/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
 define(['N/internal/elasticLogger','N/search','N/file','N/runtime'],
 	function(loggerFactory,search,file,runtime) {

 		function execute(context) {

 			var scriptObj = runtime.getCurrentScript();
 			log.debug("Remaining governance units start: " + scriptObj.getRemainingUsage()); 
 			var SysRuleslogString = '';
 			var UEandClientScriptlogString = '';
 			var OtherScriptlogString = '';
 			var cartonLogString='';
 			var isGS1Enabled ='';
 			var _noData= 'No Data Found' ;
 			try{ 
                 // To get System rules data
                 SysRuleslogString = getSystemRulesDetails();
                 // To get GS1 System rule data
                 isGS1Enabled = checkGS1SystemRuleDetails();
                 // To get Pick carton system rule data
                 var pickcartonRuleEnabled = isPickcartonRuleEnabled();
                 // To get UE and client scripts deployment and file data
                 var UEandClientScriptsobj = getUEandClientFiles();
                 // To get all files associated with WMS bundle which are available
                 var bundleFileIdArray = getFileIdfromWMSBundle();
                 // To get all files which are available in file cabinet
                 var availableFileIdObj = getFileIdfromFileCabinet();

                 // To check file contents of UE and client for WMS Customizations and if found getting record type info
                 UEandClientScriptlogString = checkUEandClientCustomization(bundleFileIdArray,UEandClientScriptsobj,pickcartonRuleEnabled);
                 /* To check file contents of all files and which are not assocaited with WMS bundle for WMS customizations and 
                 if found getting file names info */
                 OtherScriptlogString = checkOtherScriptsCustomization(bundleFileIdArray,availableFileIdObj,pickcartonRuleEnabled);
                 /* To check file contents of all files and which are not assocaited with WMS bundle for Platform carton fields
                 customizations and if found getting file names info */
                 cartonLogString = (UEandClientScriptlogString.cartonLogString).trim()+(OtherScriptlogString.cartonLogString).trim();
                 
                 
                 // If no data found above then updating the log with No data found
                 if (!(_isValueValid(SysRuleslogString))){
                 	SysRuleslogString = _noData ;
                 }
                 if (!(_isValueValid(UEandClientScriptlogString.logString))){
                 	UEandClientScriptlogString.logString = _noData ;
                 }
                 if (!(_isValueValid(OtherScriptlogString.logString))){
                 	OtherScriptlogString.logString = _noData ;
                 }
                 if (!(_isValueValid(cartonLogString))){
                 	cartonLogString = _noData ;
                 }
                 if (!(_isValueValid(isGS1Enabled))){
                 	isGS1Enabled = _noData ;
                 }

                 // Logging data to Elasticsearch

                 var logger = loggerFactory.create({
                 	type: loggerFactory.Type.PSG
                 });
                 var result = logger.info({
                 	'bundleName': 'WMS',
                 	'bundleVersion' : (SysRuleslogString.match(/,/g) || []).length,
                 	'subsidiary' : ((UEandClientScriptlogString.logString).match(/,/g) || []).length ,
                 	'location' : ((OtherScriptlogString.logString).match(/,/g) || []).length,
                 	'executionContext' : (cartonLogString.match(/,/g) || []).length ,
                 	'featureName' :  SysRuleslogString.trim(),
                 	'scriptType': (OtherScriptlogString.logString).trim(),
                 	'recordType' : (UEandClientScriptlogString.logString).trim(),
                 	'language' : cartonLogString.trim(),
                 	'edition'  : isGS1Enabled.trim(),
                 	'countryCode' : (isGS1Enabled.match(/,/g) || []).length
                 });
                 log.debug(JSON.stringify(result), "");
                 log.debug("Remaining governance units end: " + scriptObj.getRemainingUsage()); 
             }
             catch(e)
             {   
             	//Adding all the data to log along with exception
             	var logger = loggerFactory.create({
             		type: loggerFactory.Type.PSG
             	});
             	var result = logger.info({
             		'bundleName': 'WMS',
             		'bundleVersion' :  _isValueValid(SysRuleslogString) ? (SysRuleslogString.match(/,/g) || []).length : _noData ,
                 	'subsidiary' : _isValueValid(UEandClientScriptlogString.logString) ? ((UEandClientScriptlogString.logString).match(/,/g) || []).length : _noData,
                 	'location' : _isValueValid(OtherScriptlogString.logString) ? ((OtherScriptlogString.logString).match(/,/g) || []).length : _noData,
                 	'executionContext' : _isValueValid(cartonLogString) ? (cartonLogString.match(/,/g) || []).length : _noData,
                 	'featureName' : _isValueValid(SysRuleslogString) ? SysRuleslogString.trim() : _noData , 
                 	'scriptType': _isValueValid(OtherScriptlogString.logString) ? (OtherScriptlogString.logString).trim() : _noData,
                 	'recordType' : _isValueValid(UEandClientScriptlogString.logString) ? (UEandClientScriptlogString.logString).trim() : _noData,
                 	'language' : _isValueValid(cartonLogString) ? cartonLogString.trim() : _noData,
                 	'edition'  : _isValueValid(isGS1Enabled) ? isGS1Enabled.trim() : _noData,
             		'countryCode' :  e.trim()
             	});
             	log.debug(JSON.stringify(result), "");
             	log.error({title:'error in execute',details:e});
             }
         }	

         function isPickcartonRuleEnabled(){
         	var ruleArray=[];
         	var SysRuleslogString='';
         	ruleArray.push('Use cartons for multi-order picking?');
         	ruleArray.push('Use cartons for single-order picking?');

         	for (var rule = 0; rule < ruleArray.length; rule++) {
         		SysRuleslogString =   getSystemRuleDetails(ruleArray[rule],SysRuleslogString);
         		var isFound = SysRuleslogString.search("Y");
         		if(isFound != -1){
         			return true;
         		}
         	}
         	return false;
         }
          // TO GET System rule enable details
          function getSystemRuleDetails(ruleName,logString,processTypeId){
          	var wmsSystemRulesSearch = search.create({
          		type: 'customrecord_wmsse_sysrules',
          		columns: [
          		{name: 'name'},
          		{name: 'custrecord_wmssesite'},
          		{name: 'custrecord_wmsserulevalue'}
          		]

          	});
          	var filters = wmsSystemRulesSearch.filters;
          	filters.push(search.createFilter({
          		name: 'name',
          		operator: search.Operator.IS,
          		values: ruleName.toString()
          	}), search.createFilter({
          		name: 'isinactive',
          		operator: search.Operator.IS,
          		values: false
          	}),search.createFilter({
          		name: 'custrecord_wmsserulevalue',
          		operator: search.Operator.IS,
          		values: 'Y'
          	}));
          	if(_isValueValid(processTypeId)){
          		filters.push(search.createFilter({
          			name: 'custrecord_wmsseprocesstype',
          			operator: search.Operator.ANYOF,
          			values: processTypeId
          		}));
          	}
          	wmsSystemRulesSearch.filters = filters;
          	var search_page_count = 1000;

          	var myPagedData = wmsSystemRulesSearch.runPaged({
          		pageSize: search_page_count
          	});
          	myPagedData.pageRanges.forEach(function (pageRange) {
          		var myPage = myPagedData.fetch({
          			index: pageRange.index
          		});
          		myPage.data.forEach(function (result) {
          			logString = logString + ', '+ ruleName + ' : ' + result.getValue('custrecord_wmsserulevalue') ;
          			if(_isValueValid( result.getText('custrecord_wmssesite') )){
          				logString = logString + ' - ' + result.getText('custrecord_wmssesite') ;
          			}
          		});
          	});

          	return logString;
          }
          /// To get UserEvent and Client scripts which are created on WMS records
          function getUEandClientFiles(){

          	var columns = [];
          	columns.push(search.createColumn({
          		name: 'recordtype'
          	}));
          	columns.push(search.createColumn({
          		name: 'scriptfile',
          		join:  'script'
          	}));
          	var scriptSearch = search.create({
          		type: 'scriptdeployment',
          		columns: columns
          	});
          	var filters = scriptSearch.filters;
          	filters.push(search.createFilter({
          		name: 'scripttype',
          		join : 'script',
          		operator: search.Operator.ANYOF,
          		values: ['CLIENT','USEREVENT']
          	}),search.createFilter({
          		name: 'isinactive',
          		join : 'script',
          		operator: search.Operator.IS,
          		values: false
          	}),
          	search.createFilter({
          		name: 'isdeployed',
          		operator: search.Operator.IS,
          		values: true
          	}));
          	scriptSearch.filters = filters;
          	var  allFilesresults = _getSearchResultInJSON(scriptSearch);
        
          	var UEandClientScriptsobj = [];
          	for(var count in allFilesresults){
          		UEandClientScriptsobj[allFilesresults[count].scriptfile] = allFilesresults[count].recordtypeText ;
          	}
          	return UEandClientScriptsobj;
          }
          // to get files associated with WMS bundle
          function getFileIdfromWMSBundle(){

          	var folderPath 	= '../PrintDocuments/MasterPrintDocument.xml';
          	var tempFileObj 	   	= file.load(folderPath);
          	var folderId 	= tempFileObj.folder;

          	var parentFolderId= getParentfolder(folderId);
          	var columns = [];
          	columns.push(search.createColumn({
          		name: 'name',
          		join: 'file'
          	}));
          	columns.push(search.createColumn({
          		name: 'internalid',
          		join:  'file'
          	}));

          	var folderSearch = search.create({
          		type: 'folder',
          		columns: columns
          	});
          	var filters = folderSearch.filters;
          	filters.push(search.createFilter({
          		name: 'predecessor',
          		operator: search.Operator.ANYOF,
          		values: parentFolderId
          	}));
          	filters.push(search.createFilter({
          		name: 'isavailable',
          		join : 'file',
          		operator: search.Operator.IS,
          		values: true
          	}));
          	filters.push(search.createFilter({
          		name: 'filetype',
          		join : 'file',
          		operator: search.Operator.ANYOF,
          		values: ['JAVASCRIPT']
          	}));
          	folderSearch.filters = filters;
          	var  allFilesresults = _getSearchResultInJSON(folderSearch);
          	
          	var bundleFileIdArray = [];
          	for(var count in allFilesresults){
          		bundleFileIdArray.push(allFilesresults[count].internalid);
          	}
          	return bundleFileIdArray;
          }
          function getParentfolder(restletsFolderId){
          	var columns = [];
          	columns.push(search.createColumn({
          		name: 'parent'
          	}));

          	var folderSearch = search.create({
          		type: 'folder',
          		columns: columns
          	});
          	var filters = folderSearch.filters;
          	filters.push(search.createFilter({
          		name: 'internalid',
          		operator: search.Operator.ANYOF,
          		values: restletsFolderId
          	}));
          	folderSearch.filters = filters;
          	var  parentFolderresults = _getSearchResultInJSON(folderSearch);
          	return parentFolderresults[0].parent;
          }
          // to get files which are available
          function getFileIdfromFileCabinet(){

          	var columns = [];
          	columns.push(search.createColumn({
          		name: 'name',
          		join: 'file'
          	}));
          	columns.push(search.createColumn({
          		name: 'internalid',
          		join:  'file'
          	}));

          	var folderSearch = search.create({
          		type: 'folder',
          		columns: columns
          	});
          	var filters = folderSearch.filters;
          	filters.push(search.createFilter({
          		name: 'isavailable',
          		join : 'file',
          		operator: search.Operator.IS,
          		values: true
          	}), search.createFilter({
          		name: 'filetype',
          		join : 'file',
          		operator: search.Operator.ANYOF,
          		values: ['JAVASCRIPT']
          	}));
          	folderSearch.filters = filters;
          	var  allFilesresults = _getSearchResultInJSON(folderSearch);
          	
          	var Scriptsobj = [];
          	for(var count in allFilesresults){
          		Scriptsobj[allFilesresults[count].internalid] = allFilesresults[count].name ;
          	}

          	return Scriptsobj;
          }
          function checkUEandClientCustomization(bundleFileIdArray,UEandClientScriptsobj,pickcartonRuleEnabled){
          	var logString='';
          	var cartonLogString = '';
          	var cnt=0;
          	for(var fileId in UEandClientScriptsobj){
          		if(bundleFileIdArray.indexOf(fileId) == -1){
          			cnt++;
          			try{
          				var fileObj = file.load({
          					id: fileId
          				});
          				var fileContent = fileObj.getContents();
          				var isFound = fileContent.search("wms");
          				if(isFound != -1){
          					logString = logString +', ' + UEandClientScriptsobj[fileId];
          				}
          				if(pickcartonRuleEnabled){
          					var isPickcartonFound = fileContent.search("custrecord_wms_pickcarton");
          					var isPackcartonFound = fileContent.search("custrecord_wmsse_packing_container");
          					if(isPickcartonFound != -1 || isPackcartonFound != -1 ){
          						cartonLogString = cartonLogString +', ' + UEandClientScriptsobj[fileId];
          					}
          				}
          			}catch(e){
          			}
          		}
          	}
          	log.debug('cnt in UE',cnt);
          	return {'logString' : logString, 'cartonLogString' : cartonLogString};
          }

          function checkOtherScriptsCustomization(bundleFileIdArray,availableFileIdObj,pickcartonRuleEnabled){
          	var logString='';
          	var cartonLogString = '';
          	var cnt=0;
          	for(var fileId in availableFileIdObj){
          		if(bundleFileIdArray.indexOf(fileId) == -1){
          			cnt++;
          			try{
          				var fileObj = file.load({
          					id: fileId
          				});
          				var fileContent = fileObj.getContents();
          				var isFound = fileContent.search("wms");
          				if(isFound != -1){
          					logString = logString +', ' + availableFileIdObj[fileId];
          				}

          				if(pickcartonRuleEnabled){
          					var isPickcartonFound = fileContent.search("custrecord_wms_pickcarton");
          					var isPackcartonFound = fileContent.search("custrecord_wmsse_packing_container");
          					if(isPickcartonFound != -1 || isPackcartonFound != -1 ){
          						cartonLogString = cartonLogString +', ' + availableFileIdObj[fileId];
          					}
          				}
          			}catch(e){
          			}
          		}
          	}
          	log.debug('cnt in other',cnt);
          	return {'logString' : logString, 'cartonLogString' : cartonLogString};
          }

          function getSystemRulesDetails(){
          	var ruleArray=[];
          	var SysRuleslogString='';
          	ruleArray.push('Use custom RF menu items?');
          	ruleArray.push('Use custom packing lists?');
          	ruleArray.push('Use custom multi-order pick reports?');
          	ruleArray.push('Use custom single order packing lists?');
          	ruleArray.push('Use custom single order pick reports?');
          	ruleArray.push('Label Printing: Address Labels with 3rd party integration');
          	ruleArray.push('Label Printing: Item Labels with 3rd party integration');
          	ruleArray.push('Label Printing: Pallet Labels with 3rd party integration');
          	ruleArray.push('Label Printing: UCC/GS1 Labels with 3rd party integration');
          	ruleArray.push('Use cartons for multi-order picking?');
          	ruleArray.push('Use cartons for single-order picking?');

          	for (var rule = 0; rule < ruleArray.length; rule++) {
          		SysRuleslogString =   getSystemRuleDetails(ruleArray[rule],SysRuleslogString);
          	}
          	return SysRuleslogString;
          }

          function checkGS1SystemRuleDetails(){
          	var ruleArray=[];
          	var SysRuleslogString='';
          	var recordId='';
          	ruleArray.push('Enable Advanced Barcode Scanning?');

          	var processTypeResult = search.create({
          		type: 'customlist_wmsse_process_type',
          		filters: [
          		search.createFilter({
          			name: 'name',
          			operator: 'is',
          			values: 'GS1 Bar Code'

          		})],
          		columns: [
          		search.createColumn({
          			name: 'internalid'
          		})
          		]
          	});
          	processTypeResult.run().each(function (result) {
          		recordId = result.id;
          	});

          	for (var rule = 0; rule < ruleArray.length; rule++) {
          		SysRuleslogString =   getSystemRuleDetails(ruleArray[rule],SysRuleslogString,recordId);
          	}
          	return SysRuleslogString;
          }


          function _getSearchResultInJSON(searchObj, callback, callbackResultObj) {
		// if callback and callbackResultObj are undefined, default behaviour is
		// 1 result -> 1 object
		if (callback == undefined || callback == '') {
			callback = _searchResultToJson;
		}
		if (callbackResultObj == undefined) {
			callbackResultObj = []; // initialize as array
		}
		var search_page_count = 1000;
		var myPagedData = searchObj.runPaged({
			pageSize: search_page_count
		});
		myPagedData.pageRanges.forEach(function (pageRange) {
			var myPage = myPagedData.fetch({
				index: pageRange.index
			});
			myPage.data.forEach(function (result) {
				// get json of result
				callback(result,callbackResultObj);
			});
		});
		return callbackResultObj;
	}
	function _searchResultToJson(searchResult, searchResults) {
		var resultObj = {};
		var columnsArray = searchResult.columns;
		var columnKeys =[];
		for (var j in columnsArray) {
			var columnObj = JSON.parse(JSON.stringify(columnsArray[j]));
			var column = columnObj.name;
			var columnSummary = columnObj.summary;
			var columnLabel = columnObj.label;
			var columnJoin = columnObj.join;
			var columnType = columnObj.type;
			if (column == 'formulanumeric' || column == 'formuladate' || column == 'formulatext') {
				var columnValue = searchResult.getValue(columnsArray[j]);
				resultObj[columnLabel] = columnValue;
			}
			else {
				var columnValue = searchResult.getValue({
					name: column,
					summary: columnSummary,
					join: columnJoin
				});
				if(columnKeys.indexOf(column) != -1)
				{
					columnKeys.push(columnLabel);
					resultObj[columnLabel] = columnValue;
				}
				else
				{
					columnKeys.push(column);
					resultObj[column] = columnValue;
				}
				if (columnType == 'select' || column == 'unit'  || typeof columnObj == 'object') {
					if(columnValue!= '')
					{
						var columnText = searchResult.getText({
							name: column,
							summary: columnSummary,
							join: columnJoin
						});
						var colName = column + "Text";
						resultObj[colName] = columnText;
					}
					else
					{
						var colName = column + "Text";
						resultObj[colName] = '';	
					}                                             
				}
			}

			resultObj.id = searchResult.id;
			resultObj.recordType = searchResult.recordType;
		}
		searchResults.push(resultObj);
	}
	function _isValueValid(val)
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



	return {
		execute: execute
	};

});
