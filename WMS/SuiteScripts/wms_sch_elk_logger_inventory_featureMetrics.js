/**
 *    Copyright � 2024, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/internal/elasticLogger','N/query','N/search','N/runtime','N/file','../Restlets/wms_translator'],
		function(loggerFactory,query,search,runtime,file,translator) {

	function execute(context) {

		var featuresList = [
			{'featureName' : 'BinTranfer'},
			{'featureName' : 'CartPutaway'},
			{'featureName' : 'Replen'},
			{'featureName' : 'InventoryCount','tranType' : 'INVCOUNT'},
			{'featureName' : 'VendorReturnAuthorization'},
			{'featureName' : 'ScheduleBinReplenishment'},
			{'featureName' : 'WorkOrderReversal'}
			];
		var finalDataObj =  {};
		var ISMStatusFeature =false;
		var numberOfDays = 'dago7';
		var customRecordidObj = getCustomRecordObj();
		try{
			var scriptObj = runtime.getCurrentScript();
			var NumberOfDaysFlag  = scriptObj.getParameter({ name : 'custscript_wms_inventory_30daysflag'});
			if(NumberOfDaysFlag =='30days') {
				numberOfDays = 'dago30';
			}
			log.debug('numberOfDays',numberOfDays);
			var executionContext = 'FeatureMetrics_Inventory'+numberOfDays;
			//Logging data of Last week
			getallFeatureData(featuresList,ISMStatusFeature,customRecordidObj,finalDataObj,numberOfDays);
  			logDatatoELK(finalDataObj,executionContext);
		}
		catch(e)
		{ 
			log.error({title:'error in execute',details:e});
			var logger = loggerFactory.create({
				type: loggerFactory.Type.PSG
			});
			logger.info({
				'bundleName': 'WMS',
				'executionContext' : 'FeatureMetrics_Inventory',
				'error' : e.message
			});
		}
	}	

	function getallFeatureData(featuresList,ISMStatusFeature,customRecordidObj,finalDataObj,dateRange){
		featuresList.forEach(element => { 
		 
			 if(element.featureName == 'InventoryCount' ){
					finalDataObj = getOrderdata(element.featureName,element.tranType,dateRange,finalDataObj);
			}else if(element.featureName == 'BinTranfer' || element.featureName == 'Replen'){
				finalDataObj =   getBinTranferandReplenData(element.featureName,dateRange,finalDataObj);
			}else if(element.featureName == 'CartPutaway'){
				finalDataObj =   getCartPutawayData(element.featureName,dateRange,finalDataObj);
			}else if(element.featureName == 'WorkOrderReversal'){
				 finalDataObj= getWorkOrderReversalData(element.featureName,dateRange,finalDataObj);
			 }else if(element.featureName=='BulkPickTaskAssignment'){
				 finalDataObj =  getPickTaskCountFromBulkPickTaskAssignment(customRecordidObj,element.featureName,dateRange,finalDataObj);
 			}else if (element.featureName=='ScheduleBinReplenishment'){
				 finalDataObj = getScheduleBinReplenishmentData(element.featureName,dateRange,finalDataObj);
			 }
 			});
		log.debug('finalDataObj',finalDataObj);
 			systemRulesData(finalDataObj);
	}
	function getOrderdata(featureName,tranType,dateRange,finalDataObj){
		var noOfOrders= 0;
		var maxNoOfOrderlines = 0;
		var IBdata={};
		finalDataObj[featureName] ={};

		var suiteQLQuery = " SELECT "+ 
		" \"TRANSACTION\".\"ID\" ," + 
		" COUNT(DISTINCT(CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_line_no)) cnt "+
		" FROM  CUSTOMRECORD_WMSSE_TRN_OPENTASK ,"+
		" \"TRANSACTION\" "+
		" WHERE " +
		" CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_order_no = \"TRANSACTION\".\"ID\" "+
		" AND UPPER(\"TRANSACTION\".\"TYPE\") IN ('" + tranType + "') " +
		" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_act_begin_date > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATE') "  ;

		if(tranType == 'INVCOUNT'){
			suiteQLQuery = suiteQLQuery + 
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_tasktype IN ('7') " + 
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_wms_status_flag IN ('31') " ;
		}else{
			suiteQLQuery = suiteQLQuery + 
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_tasktype IN ('2') " + 
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_wms_status_flag IN ('3') " ;
		}

		if(featureName == 'ISM'){
			suiteQLQuery = suiteQLQuery + 
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_inbshipment IS NOT NULL " ;
			getISMShipmentData(dateRange,finalDataObj);
		}
		suiteQLQuery = suiteQLQuery + " GROUP BY \"TRANSACTION\".\"ID\"  ";

		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL(suiteQLQuery); 
		var queryResults = resultSuiteQL.results;

		noOfOrders = queryResults.length;
		queryResults.forEach(element => { if(maxNoOfOrderlines < (element.values)[1])
		{ maxNoOfOrderlines = (element.values)[1];
		}  
		});
		if(featureName == 'PurchaseOrder' || featureName == 'TransferOrder'|| featureName == 'ReturnAuthorization'){
			IBdata =  getIBdata(tranType,dateRange);
		}
		finalDataObj[featureName].noOfOrders = noOfOrders; 
		finalDataObj[featureName].maxNoOfOrderlines = maxNoOfOrderlines; 
		finalDataObj[featureName].noOfReversedOrders = IBdata.noOfOrders; 

 		return finalDataObj;
	}

	function getIBdata(orderType,dateRange){
		var noOfOrders= 0;
		var suiteQLQuery = " SELECT " +
		" \"TRANSACTION\".\"ID\" ," + 
		" COUNT(DISTINCT(CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_line_no)) cnt "+
		" FROM  CUSTOMRECORD_WMSSE_TRN_OPENTASK ,"+
		" \"TRANSACTION\" "+
		" WHERE " +
		" CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_order_no = \"TRANSACTION\".\"ID\" "+
		" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_tasktype IN ('2') "+ 
		" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_wms_status_flag IN ('32') " +
		" AND UPPER(\"TRANSACTION\".\"TYPE\") IN ('" + orderType + "') " +
		" AND  CUSTOMRECORD_WMSSE_TRN_OPENTASK.lastmodified > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";

		suiteQLQuery = suiteQLQuery + " GROUP BY \"TRANSACTION\".\"ID\"  ";

		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL(suiteQLQuery); 
		var queryResults = resultSuiteQL.results;

		noOfOrders = queryResults.length;

		return { "noOfOrders" : noOfOrders };
	}

	function getBinTranferandReplenData(featureName,dateRange,finalDataObj){
		var dataProcessed =0;
		var suiteQLQuery =  " SELECT " +
		" COUNT(CUSTOMRECORD_WMSSE_TRN_OPENTASK.name) AS nameRAW /*{name#RAW}*/ " +
		" FROM " +
		" CUSTOMRECORD_WMSSE_TRN_OPENTASK ,bin " +
		" WHERE " +
		" CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_actbeginloc = bin.\"ID\"(+) "+
		" AND bin.custrecord_wms_iscart = ? " +
		" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_wms_status_flag IN ('19') " +
		" AND NOT( CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_actbeginloc IS NULL ) " +
		" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_act_begin_date > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATE') "+
		" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_order_no IS NULL ";
		if(featureName == 'BinTranfer'){
			suiteQLQuery = suiteQLQuery +
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_tasktype IN ('9') " ;
		}else{
			suiteQLQuery = suiteQLQuery + 
			" AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_tasktype IN ('17') " ;
		}
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: suiteQLQuery,
			params : ['F']}); 
		var queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			dataProcessed = (queryResults[0].values)[0];
		}
		finalDataObj[featureName] = dataProcessed;
		return finalDataObj;
	}
	function getCartPutawayData(featureName,dateRange,finalDataObj){
		var dataProcessed =0;
		var suiteQLQuery =  " SELECT " +
		" COUNT(CUSTOMRECORD_WMSSE_TRN_OPENTASK.name) AS nameRAW /*{name#RAW}*/ " +
		" FROM " +
		" CUSTOMRECORD_WMSSE_TRN_OPENTASK , bin " +
		" WHERE " +
		" CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_actbeginloc = bin.\"ID\"(+) "+
		" AND  ((NOT( CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_actbeginloc IS NULL )  "+
        " AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_tasktype IN ('9') " +
        " AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_wms_status_flag IN ('19') "+
        " AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_order_no IS NULL "+
        " AND bin.custrecord_wms_iscart = ? " +
        " AND CUSTOMRECORD_WMSSE_TRN_OPENTASK.custrecord_wmsse_act_begin_date > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATE'))) ";
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: suiteQLQuery,
			params : ['T']}); 
		var queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			dataProcessed = (queryResults[0].values)[0];
		}
		finalDataObj[featureName] = dataProcessed;
		return finalDataObj;
	}
	function getCustomRecordObj(){
		//Getting customrecord's Internalid's
		var customRecordidObj ={};
		var sqlQuery = " SELECT " +
		" CustomRecordType.internalid AS internalidRAW /*{internalid#RAW}*/, "+
		" CustomRecordType.name AS nameRAW /*{name#RAW}*/ " +
		" FROM " +
		" CustomRecordType "+
		" WHERE "+
		" UPPER(CustomRecordType.name) IN ('WMS EXTERNAL LABEL DETAILS', 'WMS LABEL PRINTING', 'WMS SHIP MANIFEST','PICKTASK') " ;
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: sqlQuery
		});      
		var queryResults = resultSuiteQL.results;
		queryResults.forEach(element => { var customRecordName = element.values[1];
		customRecordidObj[customRecordName] = element.values[0];
		});
		return customRecordidObj;
	}

	function getMobileAppdefault(){
		var NSWMSId = '';
		try{
		var sqlQuery = " SELECT " +
		" CUSTOMRECORD_MOBILE_APPLICATION_DEFAULTS.\"ID\" AS idRAW /*{id#RAW}*/ "+
		" FROM " +
		" CUSTOMRECORD_MOBILE_APPLICATION_DEFAULTS "+
		" WHERE "+
		" UPPER(CUSTOMRECORD_MOBILE_APPLICATION_DEFAULTS.name) = ? " +
		" AND NVL(CUSTOMRECORD_MOBILE_APPLICATION_DEFAULTS.isinactive, 'F') = ? " ;
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params : ['NSWMS','F']
		});      
		var queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			NSWMSId = (queryResults[0].values)[0];
		}
		}
		catch(e){
        }
		return NSWMSId;
	}
	function getMobileRegisteredApp(){
		var NSWMSId = '';
		try{
		var sqlQuery = " SELECT " +
		" CUSTOMRECORD_MOBILE_REGISTERED_APPS.\"ID\" AS idRAW /*{id#RAW}*/ "+
		" FROM " +
		" CUSTOMRECORD_MOBILE_REGISTERED_APPS "+
		" WHERE "+
		" UPPER(CUSTOMRECORD_MOBILE_REGISTERED_APPS.name) = ? " +
		" AND NVL(CUSTOMRECORD_MOBILE_REGISTERED_APPS.isinactive, 'F') = ? ";
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params : ['NSWMS','F']
		});      
		var queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			NSWMSId = (queryResults[0].values)[0];
		}
		}
		catch(e){
        }
		return NSWMSId;
	}
	function getMobileActiveClonedProcess(featureName,dateRange,finalDataObj){
		var NSWMSId =  getMobileAppdefault();
		var customProcessarray =[];
		var noOfCustomProcesses =0;
		if(_isValueValid(NSWMSId)){
			var sqlQuery = " SELECT " +
			" CUSTOMRECORD_MOBILE_PROCESS.custrecord_mobile_parent_process_id AS custrecordmobileparentproc /*{custrecord_mobile_parent_process_id#RAW}*/, "+
			" CUSTOMRECORD_MOBILE_PROCESS.name AS nameRAW /*{name#RAW}*/ "+
			" FROM " +
			" CUSTOMRECORD_MOBILE_PROCESS "+
			" WHERE "+
			" NVL(CUSTOMRECORD_MOBILE_PROCESS.isinactive, 'F') = ? " +
			" AND CUSTOMRECORD_MOBILE_PROCESS.custrecord_mobile_parent_application IN ('"+ NSWMSId +"')" ;
			// Run the SuiteQL query
			var resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['F']
			});      
			var queryResults = resultSuiteQL.results;
			queryResults.forEach(element => { if(customProcessarray.indexOf(element.values[0]) == -1){
				customProcessarray.push(element.values[0]);
			}
			noOfCustomProcesses++;
			});
			finalDataObj[featureName] = { 'noOfCustomProcesses' : noOfCustomProcesses,
					'customProcessarray' : customProcessarray
			};
		}else{
			finalDataObj[featureName] = 'NSWMS App is not found in Mobile Application Default';
		}

		return finalDataObj;
	}
	function getMobileConfiguredProcess(featureName,dateRange,finalDataObj){
		var NSWMSId =  getMobileRegisteredApp();
		var noofConfiguredProcesses =0;
		var configuredProcessarr = [];
		if(_isValueValid(NSWMSId)){
			var sqlQuery = " SELECT " +
			" DISTINCT(CUSTOMRECORD_MOBILE_CONFIG_INJECTION.custrecord_mobile_injection_process) AS custrecordmobileinjectionp /*{custrecord_mobile_injection_process#RAW}*/ "+
			" FROM " +
			" CUSTOMRECORD_MOBILE_CONFIG_INJECTION "+
			" WHERE "+
			" CUSTOMRECORD_MOBILE_CONFIG_INJECTION.custrecord_mobile_injection_app IN ('"+ NSWMSId +"') " +
			" AND NVL(CUSTOMRECORD_MOBILE_CONFIG_INJECTION.isinactive, 'F') = ?" ;
			// Run the SuiteQL query
			var resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['F']
			});      
			var queryResults = resultSuiteQL.results;
			queryResults.forEach(element => { noofConfiguredProcesses++;
			configuredProcessarr.push(element.values[0]);
			});
			finalDataObj[featureName] = { 'noofConfiguredProcesses' : noofConfiguredProcesses,
					'configuredProcessarr' : configuredProcessarr
			};
		}else{
			finalDataObj[featureName] = 'NSWMS App is not found in Mobile Registered Application';
		}

		return finalDataObj;
	}
	function systemRulesData(finalDataObj){
		var cyclecountStartandCompleteRule = getSystemRuleDetails('Start and complete counts on app');
		var cyclecountLotEntrySequenceRule = getSystemRuleDetails('Change lot entry sequence for counts?');

		finalDataObj.systemRuleData = {
			'cyclecountStartandCompleteRule':cyclecountStartandCompleteRule['Start and complete counts on app'],
			'cyclecountLotEntrySequenceRule':cyclecountLotEntrySequenceRule['Change lot entry sequence for counts?']
		};
		return finalDataObj;
	}
	function getLabelPrintingData(dateRange,finalDataObj){
		var palletLabelUsage='No';
		var itemLabelUsage='No';
		var barTenderLabelUsage ='No';
		var sqlQuery='';
		var resultSuiteQL='';
		var queryResults='';
		var customLabelTemplate = '';
		var palletLabel = getSystemRuleDetails('Label Printing: Pallet labels using ZPL');
		var itemLabel = getSystemRuleDetails('Label Printing: Item labels using ZPL');
		var barTenderLabel = getSystemRuleDetails('Label Printing: Item Labels with 3rd party integration');
		if(_isValueValid(palletLabel['Label Printing: Pallet labels using ZPL'])){
			sqlQuery = " SELECT " +
			" COUNT(CUSTOMRECORD_WMSSE_LABELPRINTING.name) AS nameRAW /*{name#RAW}*/ " +
			" FROM "+
			" CUSTOMRECORD_WMSSE_LABELPRINTING " +
			" WHERE " +
			" UPPER(CUSTOMRECORD_WMSSE_LABELPRINTING.custrecord_wmsse_label_refno) = ? "+
			" AND CUSTOMRECORD_WMSSE_LABELPRINTING.created > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
			// Run the SuiteQL query
			resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['PALLETLABEL']
			});      
			queryResults = resultSuiteQL.results;
			if(queryResults.length > 0 && (queryResults[0].values).length > 0){
				if((queryResults[0].values)[0] > 0){
					palletLabelUsage = true;
				}
			}       
		}
		if(_isValueValid(itemLabel['Label Printing: Item labels using ZPL'])){
			sqlQuery = " SELECT " +
			" COUNT(CUSTOMRECORD_WMSSE_LABELPRINTING.name) AS nameRAW /*{name#RAW}*/ " +
			" FROM "+
			" CUSTOMRECORD_WMSSE_LABELPRINTING " +
			" WHERE " +
			" UPPER(CUSTOMRECORD_WMSSE_LABELPRINTING.custrecord_wmsse_label_refno) = ? "+
			" AND  CUSTOMRECORD_WMSSE_LABELPRINTING.created > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
			// Run the SuiteQL query
			resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['ITEMLABEL']
			});      
			queryResults = resultSuiteQL.results;
			if(queryResults.length > 0 && (queryResults[0].values).length > 0){
				if((queryResults[0].values)[0] > 0){
					itemLabelUsage = true;
				}
			}       
		}
		if(_isValueValid(barTenderLabel['Label Printing: Item Labels with 3rd party integration'])){
			sqlQuery = " SELECT " +
			" COUNT(CUSTOMRECORD_WMSSE_EXT_LABELPRINTING.name) AS nameRAW /*{name#RAW}*/ " +
			" FROM "+
			" CUSTOMRECORD_WMSSE_EXT_LABELPRINTING " +
			" WHERE " +
			" UPPER(CUSTOMRECORD_WMSSE_EXT_LABELPRINTING.custrecord_wmsse_label_labeltype) = ? "+
			" AND CUSTOMRECORD_WMSSE_EXT_LABELPRINTING.created > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
			// Run the SuiteQL query
			resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['ITEMLABEL']
			});      
			queryResults = resultSuiteQL.results;
			if(queryResults.length > 0 && (queryResults[0].values).length > 0){
				if((queryResults[0].values)[0] > 0){
					barTenderLabelUsage = true;
				}
			}       
		}
		// To get custom Label Templates if any
		sqlQuery = " SELECT " +
		" CUSTOMRECORD_WMSSE_LABEL_TEMPLATE.name AS nameRAW /*{name#RAW}*/ " +
		" FROM "+
		" CUSTOMRECORD_WMSSE_LABEL_TEMPLATE " +
		" WHERE " +
		" NOT( UPPER(CUSTOMRECORD_WMSSE_LABEL_TEMPLATE.name) IN ('ADDRESSLABEL', 'COMPOSITEPALLETLABEL', 'ITEMLABEL', 'PALLETLABEL', 'UCCLABEL')) OR UPPER(CUSTOMRECORD_WMSSE_LABEL_TEMPLATE.name) IS NULL ";
		// Run the SuiteQL query
		resultSuiteQL= query.runSuiteQL({query: sqlQuery
		});      
		queryResults = resultSuiteQL.results;
		queryResults.forEach(element => { 
			customLabelTemplate = customLabelTemplate + ',' + (element.values)[0];  
		});

		finalDataObj.labelPrintingData = {
				'PalletLabelSystemRule' : palletLabel['Label Printing: Pallet labels using ZPL'],
				'palletLabelUsage' : palletLabelUsage,
				'itemLabelSystemRule' : itemLabel['Label Printing: Item labels using ZPL'],
				'itemLabelUsage' : itemLabelUsage,
				'barTenderLabelSystemRule' : barTenderLabel['Label Printing: Item Labels with 3rd party integration'],
				'barTenderLabelUsage' : barTenderLabelUsage,
				'customLabelTemplate' : customLabelTemplate
		};

	}

	function checkBarcodeSystemRuleDetails(ruleName,processType){
		var processTypeId='';
		var locale = runtime.getCurrentUser().getPreference('LANGUAGE');
		if(locale != "en_US")
		{       
			processType = translator.getKeyBasedonValue(processType);
		}

		var processTypeResult = search.create({
			type: 'customlist_wmsse_process_type',
			filters: [
				search.createFilter({
					name: 'name',
					operator: 'is',
					values: processType

				})],
				columns: [
					search.createColumn({
						name: 'internalid'
					})
					]
		});
		processTypeResult.run().each(function (result) {
			processTypeId = result.id;
		});

		var  systemRuleDetails = getSystemRuleDetails(ruleName,processTypeId);

		return systemRuleDetails;
	}

	function getSystemRuleDetails(ruleName,processTypeId){
		var systemRuleDetails = {};
		var customPackingListRule = false;
		var translatedRuleName = ruleName;
		if(ruleName == 'Use custom packing lists?'){
			customPackingListRule = true;
		}
		var LANG = "LANGUAGE";
		var locale = runtime.getCurrentUser().getPreference(LANG);
		if(locale != "en_US")
		{       
			translatedRuleName = translator.getKeyBasedonValue(ruleName);
		}
		var  sqlQuery = " SELECT " +
		" CUSTOMRECORD_WMSSE_SYSRULES.name , "+
		" CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsserulevalue ,"+
		" BUILTIN.DF(CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmssesite), "+
		" CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsse_scriptid, "+
		" CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsse_deployid, " +
		" BUILTIN.DF(CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsseprocesstype), "+
		" CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsse_processname_tallyscan, "+
		" BUILTIN.DF(CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wms_pallet_delimiter), "+
		" CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wms_ordertype, "+
		" CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsseactive "+
		" FROM " +
		" CUSTOMRECORD_WMSSE_SYSRULES "+
		" WHERE "+
		" CUSTOMRECORD_WMSSE_SYSRULES.name = ? "+
		" AND NVL(CUSTOMRECORD_WMSSE_SYSRULES.isinactive, 'F') = ? " +
		" AND UPPER(CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsserulevalue) = ? "; 
		if(_isValueValid(processTypeId)){
			sqlQuery = sqlQuery + " AND CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsseprocesstype = " + processTypeId;
		}
		if(customPackingListRule){
			sqlQuery = sqlQuery +  "AND CUSTOMRECORD_WMSSE_SYSRULES.custrecord_wmsse_scriptid IS NOT NULL " ;
		}
		// Run the SuiteQL query
		var   resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params: [translatedRuleName, 'F','Y']
		});      
		var   queryResults = resultSuiteQL.results;
		queryResults.forEach(element => { 
			if(_isValueValid(systemRuleDetails[ruleName])){
				if(customPackingListRule){
					systemRuleDetails[ruleName] = _isValueValid(element.values[2])? systemRuleDetails[ruleName] + ', '+ element.values[1] + ' '+ element.values[2] + ' '+
							element.values[3] + ' '+ element.values[4] : systemRuleDetails[ruleName] + ', '+ element.values[1] + ' '+ element.values[3] + ' '+ element.values[4];
				}else{
					systemRuleDetails[ruleName] =  _isValueValid(element.values[2])? systemRuleDetails[ruleName] + ', '+ element.values[1] + ' '+ element.values[2]
						: systemRuleDetails[ruleName] + ', '+ element.values[1] + ' '+ element.values[5] + ' '+ element.values[6]+ ' '+ element.values[7]+ ' '+ element.values[8];
				}
			}else{
				if(customPackingListRule){
					systemRuleDetails[ruleName] = _isValueValid(element.values[2])? element.values[1] + ' '+ element.values[2] + ' '+
							element.values[3] + ' '+ element.values[4] :  element.values[1] + ' '+ element.values[3] + ' '+ element.values[4] ;
				}else{
					systemRuleDetails[ruleName] = _isValueValid(element.values[2])?  element.values[1] + ' '+ element.values[2] + ' '+ element.values[5] + ' '+ element.values[6]+ ' '+ element.values[7]+ ' '+ element.values[8]: element.values[1] + ' '+ element.values[5] + ' '+ element.values[6]+ ' '+ element.values[7]+ ' '+ element.values[8];
				}
			}
		});
		return systemRuleDetails;
	}

	// to get files associated with WMS bundle
	function getFileIdfromWMSBundle(){

		var folderPath  = '../PrintDocuments/MasterPrintDocument.xml';
		var tempFileObj       = file.load(folderPath);
		var folderId  = tempFileObj.folder;

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

		var bundleFileIdObj = {};
		for(var count in allFilesresults){
			bundleFileIdObj[allFilesresults[count].internalid] = true;
		}
		return bundleFileIdObj;
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

		var Scriptsobj = {};
		for(var count in allFilesresults){
			Scriptsobj[allFilesresults[count].internalid] = allFilesresults[count].name ;
		}

		return Scriptsobj;
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

		var UEandClientScriptsobj = {};
		for(var count in allFilesresults){
			UEandClientScriptsobj[allFilesresults[count].scriptfile] = allFilesresults[count].recordtypeText ;
		}
		return UEandClientScriptsobj;
	}
	// To check file contents of UE and client for WMS Customizations and if found getting record type info
	function checkUEandClientCustomization(bundleFileIdObj,UEandClientScriptsobj,pickcartonRuleEnabled){
		var logString='';
		var cartonLogString = '';
		for(var fileId in UEandClientScriptsobj){
			if(!bundleFileIdObj[fileId]){
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
		return {'logString' : logString, 'cartonLogString' : cartonLogString};
	}
	/* To check file contents of all files and which are not assocaited with WMS bundle for WMS customizations and 
                 if found getting file names info */
	function checkOtherScriptsCustomization(bundleFileIdObj,availableFileIdObj,pickcartonRuleEnabled){
		var logString='';
		var cartonLogString = '';
		/*As discussed with PM and commented below code, here checking all javascript files by loading to capture customization details.
		Need to check other approaches to figure out the customizations.*/
		/*for(var fileId in availableFileIdObj){
			if(!bundleFileIdObj[fileId]){
				try{
					var fileObj = file.load({
						id: fileId
					});

					var fileName = fileObj.name ;
					if(fileName.indexOf('appConfig') == -1){
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
					}
				}catch(e){
				}
			}
		}*/
		return {'logString' : logString, 'cartonLogString' : cartonLogString};
	}
	function getCustomizationDtlOnWMSbundle(finalDataObj){
  		var pickcartonRuleEnabled = false;
		var _noData= 'No Data Found' ;
		var UEandClientScriptsobj = getUEandClientFiles();
		var bundleFileIdObj = getFileIdfromWMSBundle();
		var availableFileIdObj='';
		//var availableFileIdObj = getFileIdfromFileCabinet();

		if(_isValueValid(finalDataObj['SOPicking']['cartonPickingSystemRuleData']) && 
				_isValueValid(finalDataObj['SOPicking']['cartonPickingSystemRuleData']['Use cartons for single-order picking?'])){
			pickcartonRuleEnabled = true;
		}
		if(_isValueValid(finalDataObj['MOPicking']['cartonPickingSystemRuleData']) && 
				_isValueValid(finalDataObj['MOPicking']['cartonPickingSystemRuleData']['Use cartons for multi-order picking?'])){
			pickcartonRuleEnabled = true;
		}

		var UEandClientScriptlogString = checkUEandClientCustomization(bundleFileIdObj,UEandClientScriptsobj,pickcartonRuleEnabled);
		var  OtherScriptlogString = checkOtherScriptsCustomization(bundleFileIdObj,availableFileIdObj,pickcartonRuleEnabled);
		var cartonLogString = (UEandClientScriptlogString.cartonLogString).trim()+(OtherScriptlogString.cartonLogString).trim();
		finalDataObj.customizations = { 'UEandClientScript' : _isValueValid((UEandClientScriptlogString.logString).trim()) ? (UEandClientScriptlogString.logString).trim() : _noData,
				'OtherScript' : _isValueValid((OtherScriptlogString.logString).trim()) ? (OtherScriptlogString.logString).trim() : _noData,
						'CartonsCustomization' : _isValueValid(cartonLogString.trim()) ? cartonLogString.trim() : _noData
		};

	}
	function getLocationData(featureName,finalDataObj){
		    var warehouseManagementFeature = runtime.isFeatureInEffect({
				feature: 'wmssystem' 
			});
 		    var binsLocations = '';
		    var nobinsLocations = '';
		    var resultSuiteQL ;
			var sqlQuery = " SELECT "+
			" BUILTIN_RESULT.TYPE_STRING(\"LOCATION\".name) AS nameRAW /*{name#RAW}*/"+
			" FROM " +
			" \"LOCATION\" "+
			" WHERE "+
			" (\"LOCATION\".custrecord_wmsse_make_wh_site = ? ";
			if(warehouseManagementFeature){
				sqlQuery = sqlQuery + " OR \"LOCATION\".usewarehousemanagement  = ? ) ";
			}else{
				sqlQuery = sqlQuery + " ) ";
			}
			sqlQuery = sqlQuery + " AND \"LOCATION\".usebins  = ?  "+
			" AND NVL(\"LOCATION\".isinactive, 'F') = ? ";
			// Run the SuiteQL query for Bins locations
			if(warehouseManagementFeature){
				 resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['T','T','T','F']
			});
			}
			else{
				 resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['T','T','F']
			});
				}
			      
			var queryResults = resultSuiteQL.results;
			queryResults.forEach(element => { 
				if(_isValueValid(binsLocations)){
                    binsLocations = binsLocations + ',' + element.values[0];
				}else{
					binsLocations = element.values[0];
				}
			});
			 // For Nobins locations
			// Run the SuiteQL query
			if(warehouseManagementFeature){
				resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['T','T','F','F']
			}); 
			}
			else{
				resultSuiteQL= query.runSuiteQL({query: sqlQuery,
				params : ['T','F','F']
			}); 
			}
			  queryResults = resultSuiteQL.results;
			queryResults.forEach(element => { 
				if(_isValueValid(nobinsLocations)){
                    nobinsLocations = nobinsLocations + ',' + element.values[0];
				}else{
					nobinsLocations = element.values[0];
				}
			});
			finalDataObj[featureName] = { 'BinsLocations' : binsLocations,
					'NoBinsLocations' : nobinsLocations
			};
		 
		return finalDataObj;
	}

	function logDatatoELK(finalDataObj,executionContext){
		finalDataObj.BinTranfer ={"BinTranfer" : finalDataObj.BinTranfer};
		finalDataObj.CartPutaway ={"TransferOrder" : finalDataObj.CartPutaway};
		finalDataObj.Replenishment ={"Replen" : finalDataObj.Replen};
		finalDataObj.InventoryCount ={"InventoryCount" : finalDataObj.InventoryCount};

		// Logging data to Elasticsearch
		var    logger = loggerFactory.create({
			type: loggerFactory.Type.PSG
		});
		var result = logger.info({
			'bundleName': 'WMS',
			'executionContext' : executionContext,
			'featureName' : finalDataObj,
			'error' : (_isValueValid(finalDataObj.error)) ? finalDataObj.error : 'No error'
		});
		log.debug(JSON.stringify(result), "");
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
		if (val !== null && val !== '' && val !== 'null' && val !== undefined && val !== 'undefined')
		{
			isNotNull = true;
		}

		return isNotNull;
	}

	function getWorkOrderReversalData(featureName,dateRange,finalDataObj){
		var noOfTasksReversal = 0;
		try{ var daysAgo =0;
			if(dateRange =='dago7')
				daysAgo =7;
			else if(dateRange =='dago30')
				daysAgo =30;
			else if(dateRange =='dago60')
				daysAgo =60;
			var workOrderReversalQuery = query.create({type: 'customrecord_wmsse_trn_closedtask'});
			workOrderReversalQuery.columns = [ workOrderReversalQuery.createColumn({
				fieldId: 'custrecord_wmsse_sku_clt',
				groupBy: true
			}),
			workOrderReversalQuery.createColumn({
				fieldId: 'custrecord_wmsse_order_no_clt',
				groupBy: true
			})
			];
			var statusFilter= workOrderReversalQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag_clt',
				operator: query.Operator.ANY_OF,
				values: ['32']
			});
			var notesFilter = workOrderReversalQuery.createCondition({
				fieldId: 'custrecord_wmsse_notes_clt',
				operator: query.Operator.IS,
				values: "WorkOrder PickReversal"
			});
			var tasktypeFilter = workOrderReversalQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype_clt',
				operator: query.Operator.ANY_OF,
				values: ['3']
			});
			var actualbinFilter = workOrderReversalQuery.createCondition({
				fieldId: 'custrecord_wmsse_act_begin_date_clt',
				operator: query.Operator.AFTER,
				values: query.createRelativeDate({dateId: query.DateId.DAYS_AGO, value: daysAgo})
			});
			workOrderReversalQuery.condition = workOrderReversalQuery.and(statusFilter,notesFilter,tasktypeFilter,actualbinFilter);
			var resultSet = workOrderReversalQuery.run().asMappedResults();
			noOfOrders =resultSet.length;
		}
		catch(e){
		}
		finalDataObj[featureName] = {
		"noOfPicktasksReversedWO" : noOfTasksReversal
		};
		return finalDataObj;
	}

	function getPickTaskCountFromBulkPickTaskAssignment(customRecordidObj,featureName,dateRange,finalDataObj){
		try{
			var recordId = customRecordidObj['PICKTASK'];
			var daysAgo =0;
			if(dateRange =='dago7')
				daysAgo =7;
			else if(dateRange =='dago30')
				daysAgo =30;
			else if(dateRange =='dago60')
				daysAgo =60;
			var systemnoteSearchObj = search.create({
				type: "systemnote",
				filters:
					[
						["context","anyof","SLT"],
						"AND",
						["recordtype","anyof",recordId],
						"AND",
						["field","anyof","PICKTASK.KPICKER"],
						"AND",
						["date","within",daysAgo]
					],
				columns:
					[
						search.createColumn({
							name: "record",
							summary: "COUNT",
							sort: search.Sort.ASC,
							label: "Record"
						})
					]
			});
			var pickTaskResultCount = systemnoteSearchObj.runPaged().count;
			/*systemnoteSearchObj.run().each(function(result){
				// .run().each has a limit of 4,000 results
				return true;
			});*/
			finalDataObj[featureName] = { "noOfPickTasksAssigned" : pickTaskResultCount	};
		}
		catch(e){

		}
		return finalDataObj;
	}

	function getPOlinesprocessedThroughLotAutoNumbering(featureName,dateRange,finalDataObj){
		var noOfPOlines = 0;
		try{ var daysAgo =0;
			if(dateRange =='dago7')
				daysAgo =7;
			else if(dateRange =='dago30')
				daysAgo =30;
			else if(dateRange =='dago60')
				daysAgo =60;
			var autolotnumberingQuery = query.create({type: 'customrecord_wmsse_trn_opentask'});
			autolotnumberingQuery.columns = [ autolotnumberingQuery.createColumn({
				fieldId: 'custrecord_wmsse_sku',
				groupBy: true
			}),
				autolotnumberingQuery.createColumn({
					fieldId: 'custrecord_wmsse_line_no',
					groupBy: true
				})
			];
			var statusFilter= autolotnumberingQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: ['3']
			});
			var taskTypeFilter = autolotnumberingQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: ['2']
			});
			var autoLotFlagFilter = autolotnumberingQuery.createCondition({
				fieldId: 'custrecord_wms_lotautonumbering_flag',
				operator: query.Operator.IS,
				values: true
			});
			var autolotnumberingFilter = autolotnumberingQuery.createCondition({
				fieldId: 'custrecord_wms_lotautonumbering_elements',
				operator: query.Operator.EMPTY_NOT
			});
			var actualbinFilter = autolotnumberingQuery.createCondition({
				fieldId: 'custrecord_wmsse_act_begin_date',
				operator: query.Operator.AFTER,
				values: query.createRelativeDate({dateId: query.DateId.DAYS_AGO, value: daysAgo})
			});
			autolotnumberingQuery.condition = autolotnumberingQuery.and(statusFilter,taskTypeFilter,autoLotFlagFilter,autolotnumberingFilter,actualbinFilter);
			var resultSet = autolotnumberingQuery.run().asMappedResults();
			noOfPOlines =resultSet.length;
		}
		catch(e){
		}
		finalDataObj[featureName] = {
		"noOfPOlinesThroughLotAutonumering" : noOfPOlines
		};
		return finalDataObj;
	}

	function getThumbnailImageInfo(featureName,finalDataObj){
		var itemImageCount =0;
		try{
			var itemImageSearch = search.create({
				type: "item",
				filters:
					[
						["custitem_wms_thumbnail_image", "anyof", ["@NONE@"]]
					],
				columns:
					[
						search.createColumn({
							name: "itemid",
							sort: search.Sort.ASC,
							label: "Name"
						}),
						search.createColumn({name: "type", label: "Type"}),
						search.createColumn({name: "internalid", label: "Internal ID"})
					]
			});
			var itemImageCount = itemImageSearch.runPaged().count;
			finalDataObj[featureName] = { "noOfItemImageCount" : itemImageCount};
		}catch(e){
		}
		return finalDataObj;
	}
	function getIFdetailsForVRA(featureName,dateRange,finalDataObj){
		var noOfIFcreated =0;
		try{
			var daysAgo =0;
			if(dateRange =='dago7')
				daysAgo =7;
			else if(dateRange =='dago30')
				daysAgo =30;
			else if(dateRange =='dago60')
				daysAgo =60;
			var myTransactionQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'
			});
			var opentaskWmsStatusFlagCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: ['8']
			});
			var opentasktaskTypeCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: ['3']
			});
			var opentaskOrderTypeCondition = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no^transaction.type',
				operator: query.Operator.ANY_OF,
				values: ['VendAuth']
			});
			var opentaskConfirmNumCondition = myTransactionQuery.createCondition({
				fieldId:'custrecord_wmsse_nsconfirm_ref_no',
				operator:query.Operator.EMPTY_NOT
			});

			var actualbinFilter = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_act_begin_date',
				operator: query.Operator.AFTER,
				values: query.createRelativeDate({dateId: query.DateId.DAYS_AGO, value: daysAgo})
			});


			myTransactionQuery.condition = myTransactionQuery.and(
				opentaskWmsStatusFlagCond, opentasktaskTypeCond, opentaskOrderTypeCondition,opentaskConfirmNumCondition,actualbinFilter);
			myTransactionQuery.columns = [
				myTransactionQuery.createColumn({
					fieldId: 'id'
				})]
			var resultSet = myTransactionQuery.run().asMappedResults();
			noOfIFcreated =resultSet.length;

		}catch(e){
		}
		finalDataObj[featureName] = {
		 "noOfIFcreatedForVRA" : noOfIFcreated
		};
		return finalDataObj;
	}
	function getScheduleBinReplenishmentData(featureName,dateRange,finalDataObj){
				var noOfReplenTasks =0;
				var requestStatus = "Replenishment In Process";
				try{
					var daysAgo =0;
					if(dateRange =='dago7')
						daysAgo =7;
					else if(dateRange =='dago30')
						daysAgo =30;
					else if(dateRange =='dago60')
						daysAgo =60;
					var myTransactionQuery = query.create({
						type: 'customrecord_wms_brepln_release_status'
					});

					var replenStatusCond = myTransactionQuery.createCondition({
						fieldId: 'custrecord_wms_brepln_sts_req_status',
						operator: query.Operator.IS,
						values: requestStatus
					});

					var requestStartedFilter = myTransactionQuery.createCondition({
						fieldId: 'custrecord_wms_brepln_sts_req_started',
						operator: query.Operator.AFTER,
						values: query.createRelativeDate({dateId: query.DateId.DAYS_AGO, value: daysAgo})
					});
					myTransactionQuery.condition = myTransactionQuery.and(
						replenStatusCond, requestStartedFilter);
					myTransactionQuery.columns = [
						myTransactionQuery.createColumn({
							fieldId: 'custrecord_wms_repln_repln_opentask_id.id',
							aggregate: query.Aggregate.COUNT,
							alias: 'totalTaskcount'
						})]
					var resultSet = myTransactionQuery.run().asMappedResults();
					if(resultSet.length>0) {
						noOfReplenTasks = resultSet[0].totalTaskcount;
					}

				}catch(e){
				}
				finalDataObj[featureName] = {
					"noOfReplenTaskCreatedFromScheduleBinReplen" : noOfReplenTasks
				};
				return finalDataObj;
			}
	return {
		execute: execute
	};

});
