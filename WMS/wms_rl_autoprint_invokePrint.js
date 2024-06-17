/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *//**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/record','N/render','N/file','./wms_rl_autoprint_const','./wms_utility','./wms_translator','N/runtime', './wms_labelPrinting_utility'],

		function (search,record,render,file,consts, utility,translator,runtime, labelPrintUtility) {

	function doPost(requestBody) 
	{
		var response = {};
		var debugString = '';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams 	= requestBody.params;
				var filePath 	  	= requestParams.filePath;
				var key 		  	= requestParams.key;
				var sourceId		= requestParams.sourceId;
				var jsonObject 		= getSourceType(key);
				var fileName;
				var interPolationObj;
				var filePathArr = [];
				log.debug("requestParams :",requestParams);
				log.debug('json Object :', jsonObject);

				if(consts.SOURCE_TYPE.RECORD == jsonObject.sourceType)
				{
					if(utility.isValueValid(sourceId)){
						sourceId = sourceId.split(',');
						for(var recordIndex = 0; recordIndex < sourceId.length; recordIndex++) {
							filePath = filePath.split(',')[0];
							interPolationObj = recordInterpolation(filePath, sourceId[recordIndex], jsonObject.sourceId);
							fileName 		 = savePdf(interPolationObj['invoicePdf'], key, sourceId[recordIndex], "", filePath, interPolationObj['advPDF']);
							filePathArr.push(fileName);
							updateWMSAutoPrintingRuleEvaluationData(sourceId[recordIndex]);
						}
					}
				}
				else if(consts.SOURCE_TYPE.SAVED_SEARCH == jsonObject.sourceType)
				{
					if(utility.isValueValid(sourceId)){
						sourceId = sourceId.split(',');
						for(var srchIndex = 0; srchIndex < sourceId.length; srchIndex++) {
							filePath = filePath.split(',')[0];
							var printRecord  = getSearchRow(jsonObject.sourceId,sourceId[srchIndex]);
							interPolationObj = searchInterpolation(filePath, printRecord);
							fileName 		 = savePdf(interPolationObj['invoicePdf'],key,sourceId[srchIndex],"",filePath, interPolationObj['advPDF']);
							filePathArr.push(fileName);
							updateWMSAutoPrintingRuleEvaluationData(sourceId[srchIndex]);
						}
					}
				}
				response.isValid = true;
				response.filePath = filePathArr;
			}
			else
			{
				response.errorMessage = translator.getTranslationString('AUTOPRINTING.INVALID_INPUT');
				response.isValid = false;
			}

			log.debug('response :', response);

			return response;
		}
		catch(e)
		{
			response.isValid = false;
			response.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
	}

	function getSourceType(key){

		var jsonObject = {};
		var searchPageData;
		var ruleReportSearchObj = search.load({
			id: consts.ID.REPORT_SEARCH
		});
		var filterArray = ruleReportSearchObj.filters;
		var labelTypeFilter = search.createFilter({
			name: consts.ID.COLUMN_NAME,
			operator : search.Operator.IS,
			values : key
		});
		filterArray.push(labelTypeFilter);
		ruleReportSearchObj.filters = filterArray;
		var pageSize = ruleReportSearchObj.runPaged().count;

		var searchData = ruleReportSearchObj.runPaged({
			pageSize: pageSize
		});
		searchData.pageRanges
		.forEach(function (pageRange) {
			searchPageData = searchData.fetch({
				index: pageRange.index
			});
			searchPageData.data
			.forEach(function (result) {
				jsonObject.key = result[consts.ID.ID];
				jsonObject.sourceId = result.getValue(consts.ID.REPORT_SOURCEID);
				jsonObject.sourceType = result.getText(consts.ID.REPORT_SOURCETYPE);
			});
		});
		return jsonObject;
	}

	function recordInterpolation(templateFile, recordId, sourceId)
	{
		var recordInterpolObj 	= {};
		var isXml 				= getTemplateType(templateFile);
		var renderer 			= render.create();
		var invoicePdf;
        var preferenceItemNumberingEnabled = false;
        var preferenceItemNumbering = runtime.getCurrentUser().getPreference('ITEMNUMBERING');
        if(utility.isValueValid(preferenceItemNumbering) && preferenceItemNumbering === true) {
            preferenceItemNumberingEnabled = true;
        }

		log.debug('templatefile : ', templateFile);

		var ruleEvaluationRec = record.load({
			type: sourceId,
			id: recordId
		});

        var itemId = ruleEvaluationRec.getValue({
            fieldId: 'custrecord_wms_item'
        });

		var labelBarcodeString = ruleEvaluationRec.getValue({fieldId: 'custrecord_label_barcode_string'});


		if(isXml)
		{
			var xmlTemplateFile 	 = file.load(templateFile);
			renderer.templateContent = xmlTemplateFile.getContents();


			if(!includes(xmlTemplateFile.getContents().toLowerCase(),consts.ID.PDF))
			{
				if(utility.isValueValid(labelBarcodeString))
				{
					labelPrintUtility.replaceFNCCharSymbol(labelBarcodeString, ruleEvaluationRec, 'ZPL');
				}
				else if(preferenceItemNumberingEnabled && utility.isValueValid(itemId) && !utility.isValueValid(labelBarcodeString)) {
					var itemDetails = search.lookupFields({
						type: search.Type.ITEM,
						id: parseInt(itemId),
						columns: ['itemid']
					});
					if (!labelBarcodeString) {
						ruleEvaluationRec.setValue({fieldId : 'custrecord_label_barcode_string', 	value : itemDetails.itemid});
						ruleEvaluationRec.save();
					}
				}

				renderer.addRecord(consts.ID.RECORD, record.load({
					type: sourceId,
					id: recordId
				}));
				invoicePdf = renderer.renderAsString();
			}
			else
			{
				if(utility.isValueValid(labelBarcodeString))
				{
					labelPrintUtility.replaceFNCCharSymbol(labelBarcodeString, ruleEvaluationRec, 'PDF');
				}
				else if (preferenceItemNumberingEnabled && utility.isValueValid(itemId) && !utility.isValueValid(labelBarcodeString)) {
                    var itemDetails = search.lookupFields({
                        type: search.Type.ITEM,
                        id: parseInt(itemId),
                        columns:['itemid']
                    });
                    if(!labelBarcodeString) {
                        ruleEvaluationRec.setValue({fieldId : 'custrecord_label_barcode_string', 	value : itemDetails.itemid});
                        ruleEvaluationRec.save();
                    }
                }

				renderer.addRecord(consts.ID.RECORD, record.load({
					type: sourceId,
					id: recordId
				}));
				invoicePdf = renderer.renderAsPdf();
			}
			recordInterpolObj.invoicePdf = invoicePdf;
			recordInterpolObj.advPDF 	= false;
		}
		else
		{

			if(utility.isValueValid(labelBarcodeString))
			{
				labelPrintUtility.replaceFNCCharSymbol(labelBarcodeString, ruleEvaluationRec, 'PDF');
			}			
            else if (preferenceItemNumberingEnabled && utility.isValueValid(itemId) && !utility.isValueValid(labelBarcodeString)) {
                var itemDetails = search.lookupFields({
                    type: search.Type.ITEM,
                    id: parseInt(itemId),
                    columns:['itemid']
                });
                if(!labelBarcodeString) {
                    ruleEvaluationRec.setValue({fieldId : 'custrecord_label_barcode_string', 	value : itemDetails.itemid});
                    ruleEvaluationRec.save();
                }
            }

			renderer.setTemplateByScriptId({
				scriptId: templateFile
			});

			renderer.addRecord(consts.ID.RECORD, record.load({
				type: sourceId,
				id: recordId
			}));

			invoicePdf = renderer.renderAsPdf();
			recordInterpolObj.invoicePdf = invoicePdf;
			recordInterpolObj.advPDF 	= true;

		}
		return recordInterpolObj;
	}

	function includes(sInput, sChkString) {
		if (sInput.length < sChkString.length) {
			return false;
		}
		return sInput.split(sChkString).length > 1;
	}	

	function getTemplateType(xmlTemplateFile){
		if(xmlTemplateFile.toString().indexOf(consts.ID.DOT) > 0){
			return true;
		}
		return false;
	}



	/**
	 * Logic to save pdf
	 * @param {invoicePdf,key,recordId} invoicePdf,key,recordId
	 * @returns {folderId}
	 */
	function savePdf(invoicePdf,key,recordId,subId,filePath, advPDF){

		var date 				= new Date();
		var time 				= Math.floor(date.getTime()/1000);
		var PrintDocFolderPath 	= '../PrintDocuments/MasterPrintDocument.xml';

		var tempFileObj 	   	= file.load(PrintDocFolderPath);
		var folderId 			= tempFileObj.folder;
		var fileId 				= '';
		var autoprintAuditRec 	= record.create({type : 'customrecord_wms_autoprint_audit_inf'});

		var finalFilePath		= '';
		var recid 				= '';

		if(utility.isValueValid(advPDF) && advPDF == true)
		{
			invoicePdf.name   = key + "-" + recordId + "-" +subId +time+'.pdf';
			invoicePdf.folder = folderId;
			fileId	 		  = invoicePdf.save();

			var invFileObj 	  = file.load({
				id:fileId
			});

			finalFilePath = invFileObj.path;

			autoprintAuditRec.setValue({fieldId : 'name', value : fileId});
			autoprintAuditRec.setValue({fieldId : 'custrecord_autoprint_file_path', value : finalFilePath});
			autoprintAuditRec.setValue({fieldId : 'custrecord_autoprint_file_id', 	value : fileId});
			autoprintAuditRec.setValue({fieldId : 'custrecord_autoprint_file_date', value : new Date()});
			recid = autoprintAuditRec.save();
			log.debug('File Saved, File Id:',fileId);

			return finalFilePath;
		}
		else
		{
			var contents 	= file.load(filePath);
			if(!includes(contents.getContents().toLowerCase(),consts.ID.PDF))
			{
				var fileObj = file.create({
					name    : (key + "-" + recordId + "-" +subId +time)+".zpl",
					fileType: file.Type.PLAINTEXT,
					contents: invoicePdf
				});

				fileObj.folder 	= folderId;
				fileId 			= fileObj.save();

				var zplFileObj 	= file.load({
					id:fileId
				});

				finalFilePath = zplFileObj.path;
			}
			else
			{
				invoicePdf.name   = key + "-" + recordId + "-" +subId +time+'.pdf';
				invoicePdf.folder = folderId;
				fileId	 		  = invoicePdf.save();

				var invFileObj 	  = file.load({
					id:fileId
				});
				finalFilePath = invFileObj.path;
			}

			autoprintAuditRec.setValue({fieldId : 'name', value : fileId});
			autoprintAuditRec.setValue({fieldId : 'custrecord_autoprint_file_path', value : finalFilePath});
			autoprintAuditRec.setValue({fieldId : 'custrecord_autoprint_file_id', value : fileId});
			autoprintAuditRec.setValue({fieldId : 'custrecord_autoprint_file_date', value : new Date()});

			recid = autoprintAuditRec.save();
			log.debug('File Saved, File Id:',fileId);

			return finalFilePath;
		}
	}

	function getSearchRow(sourceId, recordId){

		var searchRowResults = search.load({
			id: sourceId
		});
		var filterArray = searchRowResults.filters;

		var filter 		= search.createFilter({
			name: consts.ID.INTERNAL_ID,
			operator : search.Operator.ANYOF,
			values : recordId
		});

		filterArray.push(filter);
		searchRowResults.filters = filterArray;

		var pageSize = searchRowResults.runPaged().count;

		var results = searchRowResults.run().getRange(0,pageSize);

		return results;
	}

	function searchInterpolation(xmlTemplateFile, results){

		var isXml 	 			= getTemplateType(xmlTemplateFile);
		var renderer 			= render.create();
		var recordInterpolObj 	= {};
		var invoicePdf;

		if(isXml)
		{
			var xmlTemplateFile 	 = file.load(xmlTemplateFile);
			renderer.templateContent = xmlTemplateFile.getContents();

			renderer.addSearchResults({
				templateName: consts.ID.RESULTS,
				searchResult: results
			});


			if(!includes(xmlTemplateFile.getContents().toLowerCase(),consts.ID.PDF))
			{
				invoicePdf = renderer.renderAsString();
			}
			else
			{
				invoicePdf = renderer.renderAsPdf();
			}
			recordInterpolObj.invoicePdf = invoicePdf;
			recordInterpolObj.advPDF 	= false;
		}
		else
		{
			renderer.setTemplateByScriptId({
				scriptId: xmlTemplateFile
			});

			renderer.addSearchResults({
				templateName: consts.ID.RESULTS,
				searchResult: results
			});	

			invoicePdf = renderer.renderAsPdf();
			recordInterpolObj.invoicePdf = invoicePdf;
			recordInterpolObj.advPDF 	= true;

		}

		return recordInterpolObj;
	}
	function updateWMSAutoPrintingRuleEvaluationData(sourceId) {
		try{
			record.submitFields({
				type: 'customrecord_wms_rule_evaluatn_autoprint',
				id: sourceId,
				values: {
					'custrecord_wms_printed': true
				}
			});
		}
		catch(e)
		{
			log.error({title:'error in  rulecreation',details:e});


		}

	}

	return {
		'post': doPost
	};

});
