/**
 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', 'N/ui/message', '../Restlets/wms_translator'],

		function(search, message, translator) {

	var contextMode;

	function pageInit(scriptContext)
	{
		contextMode=scriptContext.mode;

		var currentRecord = scriptContext.currentRecord;

		if(contextMode == 'create' || contextMode == 'edit')
		{
			var templateField = currentRecord.getField({
				fieldId : 'custrecord_wms_wave_rls_template'
			});
			templateField.isDisplay = false;
			var waveLimit = currentRecord.getField({
				fieldId : 'custrecord_wms_wave_release_wavelimit'
			});
			waveLimit.isDisabled = true;

			if(contextMode == 'edit')
			{
				var formtemplateField = currentRecord.getField({
					fieldId : 'custpage_wave_template'
				});
				formtemplateField.isDisabled = true;
				
				var isMultiWaveSelected = currentRecord.getValue({
					fieldId : 'custrecord_wms_waverelease_multiwaves'
				});		
				
				if(isMultiWaveSelected === true)
				{
					var waveLimit = currentRecord.getField({
						fieldId : 'custrecord_wms_wave_release_wavelimit'
					});
					waveLimit.isDisabled = false;
				}

				validateOrderLimitAndOrderLineLimit(currentRecord);
				
			}

			//disabling the fields ( + and New)
			disableFields();
		}

		//added because of not getting values from translator for the first time in SCRUM BOX
		translator.getTranslationString("GUI_WAVE_RELEASE.INVALID_EMAIL");
		translator.getTranslationString("GUI_WAVE_RELEASE.EMPTY_TEMPLATE");
		translator.getTranslationString("GUI_WAVE_RELEASE.CONFIRMATION_MESSAGE");

		return true;
	}

	function fieldChanged(scriptContext){

		var currentRecord = scriptContext.currentRecord;

			if (scriptContext.fieldId == 'custrecord_wms_wave_rls_order_limit' || scriptContext.fieldId == 'custrecord_wms_wave_min_order_limit'||
				scriptContext.fieldId == 'custrecord_wms_wave_rls_max_line_limit' || scriptContext.fieldId == 'custrecord_wms_wave_rls_min_line_limit'){
				validateOrderLimitAndOrderLineLimit(currentRecord);
			}
		if(scriptContext.fieldId == 'custpage_wave_template')
		{
			var templateValue = currentRecord.getValue({
				fieldId : 'custpage_wave_template'
			});

			if(isValueValid(templateValue))
			{
				currentRecord.setValue({
					fieldId : 'custrecord_wms_wave_rls_template',
					value : templateValue
				});

				var templateDtls = getTemplateDetails(templateValue);				

				if(isValueValid(templateDtls))
				{
					if(isValueValid(templateDtls.SalesOrd))
					{
						currentRecord.setText({
							fieldId : 'custrecord_wms_wave_rls_tran_type',
							text : templateDtls.SalesOrd 
						});					
					}

					if(isValueValid(templateDtls.TrnfrOrd))
					{
						currentRecord.setText({
							fieldId : 'custrecord_wms_wave_rls_tran_type',
							text : templateDtls.TrnfrOrd 
						});					
					}

					if(!isValueValid(templateDtls.SalesOrd) && !isValueValid(templateDtls.TrnfrOrd))
					{
						currentRecord.setValue({
							fieldId : 'custrecord_wms_wave_rls_tran_type',
							value : '' 
						});
					}



					if(isValueValid(templateDtls) && isValueValid(templateDtls.location) && templateDtls.location.length > 0)
					{
						for(locItr = 0; locItr<templateDtls.location.length; locItr++)
						{
							currentRecord.setValue({
								fieldId : 'custrecord_wms_wave_rls_location',
								value : templateDtls.location[locItr]
							});						
						}

					}else{
						currentRecord.setValue({
							fieldId : 'custrecord_wms_wave_rls_location',
							value : ''
						});							
					}
				}
			}
			else
			{
				currentRecord.setValue({
					fieldId : 'custrecord_wms_wave_rls_tran_type',
					value : ''
				});
				currentRecord.setValue({
					fieldId : 'custrecord_wms_wave_rls_location',
					value : ''
				});				
			}
		}

		if(scriptContext.fieldId == 'custrecord_wms_wave_rls_email')
		{
			var emailAddrValue = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_rls_email'
			});			

			if(isValueValid(emailAddrValue))
			{
				var isEmailValid = validateEmail(emailAddrValue);
				if(isEmailValid == false)
				{
					alert(translator.getTranslationString("GUI_WAVE_RELEASE.INVALID_EMAIL"));
					return false;		
				}
			}
		}
		if((scriptContext.fieldId == 'custrecord_wms_waverelease_multiwaves') || (scriptContext.fieldId == 'custrecord_wms_wave_rls_order_limit'))
		{
			var isMultiWaveSelected = currentRecord.getValue({
				fieldId : 'custrecord_wms_waverelease_multiwaves'
			});		
			
			var waveOrderLimit  = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_rls_order_limit'
			});	
				var minWaveOrderLimit = currentRecord.getValue({
					fieldId : 'custrecord_wms_wave_min_order_limit'
				});
				var maxOrderLineLimit = currentRecord.getValue({
					fieldId : 'custrecord_wms_wave_rls_max_line_limit'
				});
				var minOrderLineLimit = currentRecord.getValue({
					fieldId : 'custrecord_wms_wave_rls_min_line_limit'
				});
				if(isMultiWaveSelected === true && ((!isValueValid(waveOrderLimit) || waveOrderLimit < 1)&& (!isValueValid(minWaveOrderLimit) || minWaveOrderLimit < 1))
				&& ((!isValueValid(maxOrderLineLimit) || maxOrderLineLimit < 1)&& (!isValueValid(minOrderLineLimit) || minOrderLineLimit < 1)))
			{
				currentRecord.setValue({
					fieldId : 'custrecord_wms_waverelease_multiwaves',
					value : false
				});
				alert(translator.getTranslationString("GUI_WAVE_RELEASE.MULTI_WAVE_LIMIT"));
					return false;		
			}
			if(isMultiWaveSelected === true)
			{
				var waveLimit = currentRecord.getField({
					fieldId : 'custrecord_wms_wave_release_wavelimit'
				});
				waveLimit.isDisabled = false;
			}
			if(isMultiWaveSelected === false)
			{
				currentRecord.setValue({
					fieldId : 'custrecord_wms_wave_release_wavelimit',
					value : ''
				});
				var waveLimit = currentRecord.getField({
					fieldId : 'custrecord_wms_wave_release_wavelimit'
				});
				waveLimit.isDisabled = true;
			}
		}
		if((scriptContext.fieldId == 'custrecord_wms_wave_release_wavelimit'))
		{
			var waveLimit = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_release_wavelimit'
			});		

			var isMultiWaveSelected = currentRecord.getValue({
				fieldId : 'custrecord_wms_waverelease_multiwaves'
			});	
			var isPositiveIntegerValue =  isPositiveInteger(waveLimit);
			if(isValueValid(waveLimit) && (waveLimit < 1 || waveLimit > 500 || (isPositiveIntegerValue == false)))
			{
				currentRecord.setValue({
					fieldId : 'custrecord_wms_wave_release_wavelimit',
					value : ''
				});
				alert(translator.getTranslationString("GUI_WAVE_RELEASE.MULTI_WAVE.WAVE_LIMIT"));
				return false;		
			}
		}
		
		return true;
	}
	function isPositiveInteger(n) {
	    return n >>> 0 === parseFloat(n);
	}
	function getTemplateDetails(templateValue)
	{
		var templateDtlObj = {};
		var nswaveResultObj = {};

		var templateSearch = search.create({
			type: 'savedsearch',
			columns: ['id','title','internalid'],
			filters: [
			          search.createFilter({
			        	  name: 'internalid',
			        	  operator: 'is',
			        	  values: templateValue
			          })
			          ]
		});

		var templateResults = searchRun(templateSearch);
		var templateObj ={};
		var tranColumnObj = {}
		var savedSearchId = '';
		if(templateResults.length > 0)
		{
			for( var templateOption in templateResults)
			{
				templateObj = templateResults[templateOption];
				savedSearchId = templateObj.getValue('id');
			}
		}

		if(savedSearchId!='' && savedSearchId!=null)
		{
			var nswaveSearch = search.load({
				id: savedSearchId
			});
			var filters = JSON.parse(JSON.stringify(nswaveSearch.filters));

			if(filters.length > 0)
			{
				for(var filterItr=0; filterItr<filters.length; filterItr++)
				{
					if(filters[filterItr]['name'] == 'type')
					{
						var typeArr = filters[filterItr].values;
						for(typeItr=0; typeItr<typeArr.length; typeItr++)
						{
							if(typeArr[typeItr] == 'SalesOrd')
							{
								nswaveResultObj.SalesOrd = 'Sales Order';
							}

							if(typeArr[typeItr] == 'TrnfrOrd')
							{
								nswaveResultObj.TrnfrOrd = 'Transfer Order';
							}
						}

					}

					if(filters[filterItr]['name'] == 'location')
					{
						nswaveResultObj.location = filters[filterItr].values;
					}

				}
			}
		}
		return nswaveResultObj;
	}

	function saveRecord(scriptContext)
	{
		var currentRecord =  scriptContext.currentRecord;
		var templateValue = '';

		if(contextMode!='' && contextMode!='undefined' && contextMode=='edit')
		{
			templateValue = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_rls_template'
			});
		}
		else if(contextMode=='create')
		{
			templateValue = currentRecord.getValue({
				fieldId : 'custpage_wave_template'
			});

			if(!isValueValid(templateValue))
			{
				alert(translator.getTranslationString("GUI_WAVE_RELEASE.EMPTY_TEMPLATE"));
				return false;
			}
		}

			var waveOrderLimit = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_rls_order_limit'
			});
			var minWaveOrderLimit = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_min_order_limit'
			});
			var maxOrderLineLimit = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_rls_max_line_limit'
			});
			var minOrderLineLimit = currentRecord.getValue({
				fieldId : 'custrecord_wms_wave_rls_min_line_limit'
			});
			if(isValueValid(waveOrderLimit) && waveOrderLimit>0 && isValueValid(minWaveOrderLimit) && minWaveOrderLimit>0 &&
				(parseInt(minWaveOrderLimit) >parseInt(waveOrderLimit))){
				alert(translator.getTranslationString("GUI_WAVE_RELEASE.ORDERLIMITERRORMESSAGE"));
				return false;
			}
			if(isValueValid(maxOrderLineLimit) && maxOrderLineLimit>0 && isValueValid(minOrderLineLimit) && minOrderLineLimit>0 &&
				(parseInt(minOrderLineLimit) >parseInt(maxOrderLineLimit))){
				alert(translator.getTranslationString("GUI_WAVE_RELEASE.ORDERLINELIMITERRORMESSAGE"));
				return false;
			}
			var statusValue = currentRecord.getText({
			fieldId : 'custrecord_wms_waverelease_status'
		});
		   var translatedReleasedStatus = translator.getTranslationStringForClientScript("GUI_WAVE_RELEASE_RELEASEDSTATUS");
		   var translatedPendingReleaseStatus = translator.getTranslationStringForClientScript("GUI_WAVE_RELEASE_PENDINGRELEASEDSTATUS");

		if(statusValue != translatedReleasedStatus && statusValue != translatedPendingReleaseStatus){
			alert(translator.getTranslationStringForClientScript("GUI_WAVE_RELEASE.STATUS_INVALID"));
			return false;
		}

		var locationValue = currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_location'
		});		

		var pickingTypeValue = currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_picking_type'
		});

		var tranTypeValue = currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_tran_type'
		});

		var releaseDayValue = currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_release_day'
		});

		var releaseFreqValue = currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_frequency'
		});


		var releaseDayValue = currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_release_day'
		});

		var releaseDayText = currentRecord.getText({
			fieldId : 'custrecord_wms_wave_rls_release_day'
		});

		if(releaseDayText.indexOf('Every Day')!= -1)
		{
			currentRecord.setText({
				fieldId : 'custrecord_wms_wave_rls_release_day',
				text : 'Every Day'
			});			
		}


		if(isValueValid(templateValue) && isValueValid(locationValue) && 
				isValueValid(pickingTypeValue) && isValueValid(tranTypeValue) && isValueValid(releaseDayValue) && isValueValid(releaseFreqValue))
		{
			var myMsg = message.create({
				title: "Confirmation",
				message:translator.getTranslationString("GUI_WAVE_RELEASE.CONFIRMATION_MESSAGE"),
				type: message.Type.CONFIRMATION
			});
			myMsg.show();		
		}
		return true;
	}


	function searchRun(savedSch)
	{
		var searchResult = [];
		var search_page_count = 1000;
		var myPageData = savedSch.runPaged({
			pageSize: search_page_count
		});
		myPageData.pageRanges.forEach(function (pageRange) {
			var myPage = myPageData.fetch({
				index: pageRange.index
			});
			myPage.data.forEach(function (result) {
				searchResult.push(result);
			});
		});		

		return searchResult;
	}

	function isValueValid(val)
	{
		var isNotNull = false;
		if( typeof(val) == 'boolean')
		{
			val = val.toString();
		}
		if (val != null && val != '' && val != 'null' && val != undefined && val != 'undefined')
		{
			isNotNull = true;
		}

		return isNotNull;
	}

	function validateEmail(email) {
		var regex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
		var result = email.replace(/\s/g, "").split(/;/);        
		for(var i = 0;i < result.length;i++) {
			if(!regex.test(result[i])) {
				return false;
			}
		}       
		return true;
	}

	function disableFields()
	{
		
		if(isValueValid(document.getElementById('custrecord_wms_waverelease_status_popup_new'))){
			document.getElementById('custrecord_wms_waverelease_status_popup_new').style.pointerEvents = 'none';
		}
		if(isValueValid(document.getElementById('custrecord_wms_wave_rls_tran_type_popup_new'))){
			document.getElementById('custrecord_wms_wave_rls_tran_type_popup_new').style.pointerEvents = 'none';
		}
		if(isValueValid(document.getElementById('custrecord_wms_wave_rls_picking_type_popup_new')))	{
			document.getElementById('custrecord_wms_wave_rls_picking_type_popup_new').style.pointerEvents = 'none';
		}
		if(isValueValid(document.getElementById('custrecord_wms_wave_rls_wave_priority_popup_new'))){
			document.getElementById('custrecord_wms_wave_rls_wave_priority_popup_new').style.pointerEvents = 'none';
		}
		if(isValueValid(document.getElementById('custrecord_wms_wave_rls_release_day_popup_new')))	{
			document.getElementById('custrecord_wms_wave_rls_release_day_popup_new').style.pointerEvents = 'none';	
		}
		if(isValueValid(document.getElementById('custrecord_wms_wave_rls_frequency_popup_new'))){
			document.getElementById('custrecord_wms_wave_rls_frequency_popup_new').style.pointerEvents = 'none';
		}
		if(isValueValid(document.getElementById('custrecord_wms_wave_rls_status_req_popup_new'))){
			document.getElementById('custrecord_wms_wave_rls_status_req_popup_new').style.pointerEvents = 'none';
		}
		// In live accounts objects are locked,so new feild is not displayed in multiselect feild at 0 index so commenting below line
		/*if(isValueValid(document.getElementById('row_custrecord_wms_wave_rls_release_day6_0'))){
			document.getElementById('row_custrecord_wms_wave_rls_release_day6_0').style.pointerEvents = 'none';
		}*/

		if(isValueValid(document.getElementById('row_custrecord_wms_wave_rls_release_day7_0')))	{
			document.getElementById('row_custrecord_wms_wave_rls_release_day7_0').style.pointerEvents = 'none';
		}		

		/*if(isValueValid(document.getElementById('row_custrecord_wms_wave_rls_status_req8_0')))	{
			document.getElementById('row_custrecord_wms_wave_rls_status_req8_0').style.pointerEvents = 'none';
		}*/

		if(isValueValid(document.getElementById('row_custrecord_wms_wave_rls_status_req9_0')))	{
			document.getElementById('row_custrecord_wms_wave_rls_status_req9_0').style.pointerEvents = 'none';	
		}

	}

	function validateOrderLimitAndOrderLineLimit(currentRecord)
	{
		var isOrderLimitSet = false;
		var isOrderLineLimitSet = false;
		const maxOrderLimit =  currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_order_limit'
		});
		const minOrderLimit =  currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_min_order_limit'
		});
		const maxLineLimit =  currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_max_line_limit'
		});
		const minLineLimit =  currentRecord.getValue({
			fieldId : 'custrecord_wms_wave_rls_min_line_limit'
		});
		if((isValueValid(maxOrderLimit) && maxOrderLimit > 0) || (isValueValid(minOrderLimit) && minOrderLimit > 0))
		{
			isOrderLimitSet = true;
		}
		if((!isValueValid(maxOrderLimit) || maxOrderLimit < 0) && (!isValueValid(minOrderLimit) || minOrderLimit < 0))
		{
			isOrderLimitSet =false;
			if(maxOrderLimit < 0 || minOrderLimit < 0){
				var inputValue =maxOrderLimit;
				var fieldId ='custrecord_wms_wave_rls_order_limit';
				if(minOrderLimit < 0){
					inputValue =minOrderLimit;
					fieldId ='custrecord_wms_wave_min_order_limit';
				}
				var isPositiveIntegerValue =  isPositiveInteger(inputValue);
				if(isPositiveIntegerValue == false){
					currentRecord.setValue({
						fieldId : fieldId,
						value : ''
					});
					alert(translator.getTranslationString("GUI_WAVE_RELEASE.NEGATIVE_VALUES"));
					return false;
				}
			}
		}
		if((isValueValid(maxLineLimit) && maxLineLimit > 0) || (isValueValid(minLineLimit) && minLineLimit > 0)){
			isOrderLineLimitSet = true;
		}
		if((!isValueValid(maxLineLimit) || maxLineLimit < 0) && (!isValueValid(minLineLimit) || minLineLimit < 0))
		{
			isOrderLineLimitSet = false;
			if(maxLineLimit < 0 || minLineLimit < 0){
				var inputValue =maxLineLimit;
				var fieldId ='custrecord_wms_wave_rls_max_line_limit';
				if(minLineLimit < 0){
					inputValue =minLineLimit;
					fieldId ='custrecord_wms_wave_rls_min_line_limit';
				}
				var isPositiveIntegerValue =  isPositiveInteger(inputValue);
				if(isPositiveIntegerValue == false){
					currentRecord.setValue({
						fieldId : fieldId,
						value : ''
					});
					alert(translator.getTranslationString("GUI_WAVE_RELEASE.NEGATIVE_VALUES"));
					return false;
				}
			}
		}
		if(isOrderLimitSet){
			var maxLineLimitField = currentRecord.getField({
				fieldId : 'custrecord_wms_wave_rls_max_line_limit'
			});
			maxLineLimitField.isDisabled = true;
			var minLineLimitField = currentRecord.getField({
				fieldId: 'custrecord_wms_wave_rls_min_line_limit'
			});
			minLineLimitField.isDisabled = true;
		}else if(isOrderLimitSet == false) {
			var maxLineLimitField = currentRecord.getField({
				fieldId : 'custrecord_wms_wave_rls_max_line_limit'
			});
			maxLineLimitField.isDisabled = false;
			var minLineLimitField = currentRecord.getField({
				fieldId: 'custrecord_wms_wave_rls_min_line_limit'
			});
			minLineLimitField.isDisabled = false;
		}
		if(isOrderLineLimitSet){
			var maxOrderLimitField = currentRecord.getField({
				fieldId : 'custrecord_wms_wave_rls_order_limit'
			});
			maxOrderLimitField.isDisabled = true;
			var minOrderLimitField = currentRecord.getField({
				fieldId: 'custrecord_wms_wave_min_order_limit'
			});
			minOrderLimitField.isDisabled = true;
		} else if(isOrderLineLimitSet == false){
			var maxOrderLimitField = currentRecord.getField({
				fieldId : 'custrecord_wms_wave_rls_order_limit'
			});
			maxOrderLimitField.isDisabled = false;
			var minOrderLimitField = currentRecord.getField({
				fieldId: 'custrecord_wms_wave_min_order_limit'
			});
			minOrderLimitField.isDisabled = false;
		}

	}


	return {
		pageInit : pageInit,
		fieldChanged : fieldChanged,
		saveRecord : saveRecord
	};

});
