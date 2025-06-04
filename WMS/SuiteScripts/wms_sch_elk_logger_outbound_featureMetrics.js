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
			{'featureName' : 'SOPicking'},
			{'featureName' : 'MOPicking'},
			{'featureName' : 'BulkPicking'},
			{'featureName' : 'WavesReleasedFromMobile'},
			{'featureName' : 'PickReversalandMarkPicksDone'},
			{'featureName' : 'QuickShip'},
			{'featureName' : 'PrintDriverandShipping'}
			];
		var finalDataObj =  {};
		var ISMStatusFeature =false;
		var numberOfDays = 'dago7';
		var customRecordidObj = getCustomRecordObj();
		try{
			var scriptObj = runtime.getCurrentScript();
			var NumberOfDaysFlag  = scriptObj.getParameter({ name : 'custscript_wms_outbound_30daysflag'});
			if(NumberOfDaysFlag =='30days') {
				numberOfDays = 'dago30';
			}
			log.debug('numberOfDays',numberOfDays);
			var executionContext = 'FeatureMetrics_Outbound'+numberOfDays;
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
				'executionContext' : 'FeatureMetrics_Outbound',
				'error' : e.message
			});
		}
	}	

	function getallFeatureData(featuresList,ISMStatusFeature,customRecordidObj,finalDataObj,dateRange){
		featuresList.forEach(element => {
			if(element.featureName == 'SOPicking'){
				finalDataObj =   getSOPKOrdersData(element.featureName,dateRange,finalDataObj);
			}else if(element.featureName == 'MOPicking'){
				finalDataObj =   getMOPKOrdersData(element.featureName,dateRange,finalDataObj);
			}else if(element.featureName == 'BulkPicking'){
				finalDataObj =   getBulkPickOrdersData(element.featureName,dateRange,finalDataObj);
 			}else if(element.featureName == 'WavesReleasedFromMobile'){
				finalDataObj =   getMobileReleasedWaves(element.featureName,dateRange,finalDataObj);
 			}else if(element.featureName == 'PickReversalandMarkPicksDone'){
				finalDataObj =   getPickReversalData(element.featureName,dateRange,finalDataObj);
 			}else if(element.featureName == 'QuickShip') {
				finalDataObj = getQuickShipData(customRecordidObj, element.featureName, dateRange, finalDataObj);
			}else if(element.featureName=='BulkPickTaskAssignment') {
				finalDataObj = getPickTaskCountFromBulkPickTaskAssignment(customRecordidObj, element.featureName, dateRange, finalDataObj);
			}else if(element.featureName == 'PrintDriverandShipping'){
				finalDataObj=   getPrintdriverandShippingIntegrationData(customRecordidObj,element.featureName,dateRange,finalDataObj);
			}
 			});
 			systemRulesData(finalDataObj);
			getCustomizationDtlOnWMSbundle(finalDataObj);
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
	function getSOPKOrdersData(featureName,dateRange,finalDataObj){
 		var cartonPickingSystemRuleData = getSystemRuleDetails('Use cartons for single-order picking?');
 		var noOfOrders = 0;
		var maxNoOfOrderlines =0;
		try{
		var  sqlQuery = " SELECT " +
		" BUILTIN.DF(PickAction.ordernumber) , COUNT(pickTask.name) "+
		" FROM " +
		" pickTask ,"+
		" PickAction, "+
		" \"TRANSACTION\" "+
		" WHERE "+
		" (pickTask.\"ID\" = PickAction.picktask(+) AND pickTask.wave = \"TRANSACTION\".\"ID\"(+)) "+
		" AND (( PickAction.startdate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ) "+
		" OR (PickAction.enddate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') )) "+
		" AND UPPER(PickAction.status) IN ('DONE', 'PICKED', 'STAGED', 'STARTED') "+
		" AND UPPER(\"TRANSACTION\".picktype) IN ('SINGLE') " +
		" AND (PickAction.pickedquantity != ? AND PickAction.pickedquantity IS NOT NULL) "+
		" GROUP BY BUILTIN.DF(PickAction.ordernumber) "; 
		// Run the SuiteQL query
		var   resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params : [0]});      
		var   queryResults = resultSuiteQL.results;
 		noOfOrders = queryResults.length;
		queryResults.forEach(element => { if(maxNoOfOrderlines < (element.values)[1])
		{ maxNoOfOrderlines = (element.values)[1];
		}  
		});
		}
		catch(e){
        }
		finalDataObj[featureName] = { "cartonPickingSystemRuleData" : cartonPickingSystemRuleData['Use cartons for single-order picking?'],
				"noOfOrders" : noOfOrders,
				"maxNoOfOrderlines" : maxNoOfOrderlines
		};
 		return finalDataObj;
	}
	function getMOPKOrdersData(featureName,dateRange,finalDataObj){
		var cartonPickingSystemRuleData = getSystemRuleDetails('Use cartons for multi-order picking?');
		var noOfOrders = 0;
		var maxNoOfOrderlines =0;
		try{
		var  sqlQuery = " SELECT " +
		" BUILTIN.DF(PickAction.ordernumber) , COUNT(pickTask.name) "+
		" FROM " +
		" pickTask, "+
		" PickAction, "+
		" \"TRANSACTION\" "+
		" WHERE "+
		" ((pickTask.\"ID\" = PickAction.picktask(+) AND pickTask.wave = \"TRANSACTION\".\"ID\"(+))) "+
		" AND (( PickAction.startdate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') "+
		" OR PickAction.enddate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE')) "+
		" AND UPPER(PickAction.status) IN ('DONE', 'PICKED', 'STAGED', 'STARTED') "+
		" AND UPPER(\"TRANSACTION\".picktype) IN ('MULTI') " +
		" AND (PickAction.pickedquantity != ? AND PickAction.pickedquantity IS NOT NULL)) "+
		" GROUP BY BUILTIN.DF(PickAction.ordernumber) "; 
		// Run the SuiteQL query
		var   resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params : [0]});      
		var   queryResults = resultSuiteQL.results;

		noOfOrders = queryResults.length;
		queryResults.forEach(element => { if(maxNoOfOrderlines < (element.values)[1])
		{ maxNoOfOrderlines = (element.values)[1];
		}  
		});
		}
		catch(e){
        }
		finalDataObj[featureName] = { "cartonPickingSystemRuleData" : cartonPickingSystemRuleData['Use cartons for multi-order picking?'],
				"noOfOrders" : noOfOrders,
				"maxNoOfOrderlines" : maxNoOfOrderlines
		};
		return finalDataObj;
	}
	function getBulkPickOrdersData(featureName,dateRange,finalDataObj){
		var noOfOrders = 0;
		var maxNoOfOrderlines =0;
		try{
		var  sqlQuery = " SELECT " +
		" BUILTIN.DF(PickAction.ordernumber) , COUNT(pickTask.name) "+
		" FROM " +
		" pickTask, "+
		" PickAction, "+
		" \"TRANSACTION\" "+
		" WHERE "+
		" ((pickTask.\"ID\" = PickAction.picktask(+) AND pickTask.wave = \"TRANSACTION\".\"ID\"(+))) "+
		" AND ((PickAction.startdate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') "+
		" OR PickAction.enddate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE')) "+
		" AND UPPER(PickAction.status) IN ('DONE', 'PICKED', 'STAGED', 'STARTED') "+
		" AND UPPER(\"TRANSACTION\".picktype) IN ('BULK') " +
		" AND (PickAction.pickedquantity != ? AND PickAction.pickedquantity IS NOT NULL)) "+
		" GROUP BY BUILTIN.DF(PickAction.ordernumber) "; 
		// Run the SuiteQL query
		var   resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params : [0]});      
		var   queryResults = resultSuiteQL.results;
		noOfOrders = queryResults.length;
		queryResults.forEach(element => { if(maxNoOfOrderlines < (element.values)[1])
		{ maxNoOfOrderlines = (element.values)[1];
		}  
		});
		}
		catch(e){
        }
		finalDataObj[featureName] = {
				"noOfOrders" : noOfOrders,
				"maxNoOfOrderlines" : maxNoOfOrderlines
		};
		return finalDataObj;
	}
	function getMobileReleasedWaves(featureName,dateRange,finalDataObj){
		var noOfWaves = 0;
		try{
		var  sqlQuery =  " SELECT " +
                         " BUILTIN_RESULT.TYPE_INTEGER(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
                         " FROM "+
                         " SystemNote "+
                         " WHERE "+
                         " SystemNote.\"DATE\"  > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') "+
                         " AND UPPER(SystemNote.\"CONTEXT\") IN ('RST') "+
                         " AND SystemNote.recordtypeid IN ('-30') "+ //Transaction record internal id
                         " AND UPPER(SystemNote.field) IN ('WAVE.KPICKTYPE') "+
                         " AND UPPER(SystemNote.newvalue) IS NOT NULL "+
                         " AND SystemNote.oldvalue IS NULL ";
		// Run the SuiteQL query
		var   resultSuiteQL= query.runSuiteQL({query: sqlQuery});      
		var   queryResults = resultSuiteQL.results;
		noOfWaves = queryResults.length;
		}
		catch(e){
        }
		finalDataObj[featureName] = {
				"noOfWaves" : noOfWaves,
		};
		return finalDataObj;
	}
	function getPickReversalData(featureName,dateRange,finalDataObj){
		var noOfPicktasksReversed = 0;
		try{
		var sqlQuery =   " SELECT " +
		" COUNT(pickTask.name) AS nameRAW /*{name#RAW}*/ "+
		" FROM "+
		" pickTask, "+
		" PickAction "+
		" WHERE "+
		" pickTask.\"ID\" = PickAction.picktask(+) "+
		" AND ((PickAction.startdate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') "+
		" AND PickAction.enddate > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') "+
		" AND UPPER(PickAction.status) IN ('DONE') "+
		" AND PickAction.pickedquantity = ?))";
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: sqlQuery,
			params:[0]
		});      
		var queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			if((queryResults[0].values)[0] > 0){
				noOfPicktasksReversed = (queryResults[0].values)[0];
			}
		}
		}
		catch(e){
        }
		finalDataObj[featureName] = {"noOfPicktasksReversed" : noOfPicktasksReversed
		                            };
		return finalDataObj;
	}
	function getQuickShipData(customRecordidObj,featureName,dateRange,finalDataObj){
		var noOfCartonsShippedinMobile = 0; 
		var noOfCartonsShippedinGUI = 0; 
		// for Mobile Quickship
		var  sqlQuery = " SELECT " +
		" COUNT(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
		" FROM " +
		" SystemNote "+
		" WHERE "+
		" SystemNote.recordtypeid IN ('"+ customRecordidObj['WMS Ship Manifest'] + "') " +
		" AND UPPER(SystemNote.\"CONTEXT\") IN ('RST') " +
		" AND UPPER(SystemNote.field) IN ('CUSTRECORD_WMSSE_SHIP_TRACKNO') "+
		" AND UPPER(SystemNote.oldvalue) IS NULL " +
		" AND UPPER(SystemNote.newvalue) IS NOT NULL "+
		" AND SystemNote.\"DATE\" > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
		// Run the SuiteQL query
		var  resultSuiteQL= query.runSuiteQL({query: sqlQuery
		});      
		var  queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			if((queryResults[0].values)[0] > 0){
				noOfCartonsShippedinMobile = (queryResults[0].values)[0];
			}
		}

		// for GUI Quickship
		sqlQuery = " SELECT " +
		" COUNT(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
		" FROM " +
		" SystemNote "+
		" WHERE "+
		" SystemNote.recordtypeid IN ('"+ customRecordidObj['WMS Ship Manifest'] + "') " +
		" AND UPPER(SystemNote.\"CONTEXT\") IN ('SLT') " +
		" AND UPPER(SystemNote.field) IN ('CUSTRECORD_WMSSE_SHIP_TRACKNO') "+
		" AND UPPER(SystemNote.oldvalue) IS NULL " +
		" AND UPPER(SystemNote.newvalue) IS NOT NULL "+
		" AND SystemNote.\"DATE\" > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
		// Run the SuiteQL query
		resultSuiteQL= query.runSuiteQL({query: sqlQuery
		});
		queryResults = resultSuiteQL.results;
		if(queryResults.length > 0 && (queryResults[0].values).length > 0){
			if((queryResults[0].values)[0] > 0){
				noOfCartonsShippedinGUI = (queryResults[0].values)[0];
			}
		}

		finalDataObj[featureName] = { "noOfCartonsShippedinMobile" : noOfCartonsShippedinMobile,
				"noOfCartonsShippedinGUI" : noOfCartonsShippedinGUI
		};
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
	function systemRulesData(finalDataObj){
		var multiOrderPickReportsRule = getSystemRuleDetails('Use custom multi-order pick reports?');
		var singleOrderPackingListsRule = getSystemRuleDetails('Use custom single order packing lists?');
		var singleOrderPickReportsRule = getSystemRuleDetails('Use custom single order pick reports?');
		var addressLabelRule = getSystemRuleDetails('Label Printing: Address Labels with 3rd party integration');
		var palletLabelRule = getSystemRuleDetails('Label Printing: Pallet Labels with 3rd party integration');
		var uccGs1LabelRule = getSystemRuleDetails('Label Printing: UCC/GS1 Labels with 3rd party integration');
		var reversedPickChooseBinRule = getSystemRuleDetails('Choose bins for reversed pick tasks items?');
		var useCartonForSingleOrderPickingRule= getSystemRuleDetails('Use cartons for single-order picking?');
		var useCartonForMultiOrderPickingRule= getSystemRuleDetails('Use cartons for multi-order picking?');
		var waveStatusForUnreleasedOrderRule= getSystemRuleDetails('Provide wave status selection for unreleased orders');
		var enableBinBlockingRule=getSystemRuleDetails('Enable bin reporting and blocking');
		var markOpenpicksDoneRule=getSystemRuleDetails('Automatically mark partial picks as Done');
		var newBinforPickReversalRule = getSystemRuleDetails('Choose bins for reversed pick task items?');
		var manualpackOrderRule =getSystemRuleDetails('Manually pack orders?');
		var customPackingListEnable = getSystemRuleDetails('Use custom packing lists?');
		finalDataObj.systemRuleData = {
			'multiOrderPickReportsRule' : multiOrderPickReportsRule['Use custom multi-order pick reports?'],
			'singleOrderPackingListsRule' : singleOrderPackingListsRule['Use custom single order packing lists?'],
			'singleOrderPickReportsRule' : singleOrderPickReportsRule['Use custom single order pick reports?'],
			'addressLabelRule' : addressLabelRule['Label Printing: Address Labels with 3rd party integration'],
			'palletLabelRule' : palletLabelRule['Label Printing: Pallet Labels with 3rd party integration'],
			'uccGs1LabelRule' : uccGs1LabelRule['Label Printing: UCC/GS1 Labels with 3rd party integration'],
			'reversedPickChooseBinRule':reversedPickChooseBinRule['Choose bins for reversed pick tasks items?'],
			'useCartonForSingleOrderPickingRule':useCartonForSingleOrderPickingRule['Use cartons for single-order picking?'],
			'useCartonForMultiOrderPickingRule':useCartonForMultiOrderPickingRule['Use cartons for multi-order picking?'],
			'waveStatusForUnreleasedOrderRule':waveStatusForUnreleasedOrderRule['Provide wave status selection for unreleased orders'],
			'enableBinBlockingRule':enableBinBlockingRule['Enable bin reporting and blocking'],
			'markOpenpicksDoneRule':markOpenpicksDoneRule['Automatically mark partial picks as Done'],
			'newBinforPickReversalRule':newBinforPickReversalRule['Choose bins for reversed pick task items?'],
			'manualpackOrderRule':manualpackOrderRule['Manually pack orders?'],
			'customPackingListEnable' : customPackingListEnable['Use custom packing lists?']
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
		finalDataObj.SalesOrderPicking ={"SOPicking" : finalDataObj.SOPicking};
		finalDataObj.MultiOrderPicking ={"MOPicking" : finalDataObj.MOPicking};
		finalDataObj.BulkPicking ={"BulkPicking" :  finalDataObj.BulkPicking};
		finalDataObj.WavesReleasedFromMobile ={"WavesReleasedFromMobile" : finalDataObj.WavesReleasedFromMobil};
		finalDataObj.PickReversalAndMarkPicksDone ={"PickReversalandMarkPicksDone" : finalDataObj.PickReversalandMarkPicksDone};
		finalDataObj.QuickShip ={"QuickShip" : finalDataObj.QuickShip};

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
	function getPrintdriverandShippingIntegrationData(customRecordidObj,featureName,dateRange,finalDataObj){
				var noOfCartonsShipped =0;
				// Checking Printdriver integration enablement
				var printDriverEnabled = false;
				var sqlQuery = " SELECT " +
					" COUNT(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
					" FROM " +
					" SystemNote "+
					" WHERE "+
					" SystemNote.recordtypeid IN ('"+ customRecordidObj['WMS External Label Details'] + "') " +
					" AND UPPER(SystemNote.\"CONTEXT\") IN ('WSS') " +
					" AND UPPER(SystemNote.field) IN ('CUSTRECORD_WMSSE_LABEL_PRINTOPTION') "+
					" AND UPPER(SystemNote.oldvalue) = 'F' " +
					" AND UPPER(SystemNote.newvalue) = 'T' "+
					" AND SystemNote.\"DATE\" > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
				// Run the SuiteQL query
				var   resultSuiteQL= query.runSuiteQL({query: sqlQuery
				});
				var   queryResults = resultSuiteQL.results;
				if(queryResults.length > 0 && (queryResults[0].values).length > 0){
					if((queryResults[0].values)[0] > 0){
						printDriverEnabled = true;
					}
				}

				if(printDriverEnabled === false){

					sqlQuery = " SELECT " +
						" COUNT(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
						" FROM " +
						" SystemNote "+
						" WHERE "+
						" SystemNote.recordtypeid IN ('"+ customRecordidObj['WMS Label printing'] + "') " +
						" AND UPPER(SystemNote.\"CONTEXT\") IN ('WSS') " +
						" AND UPPER(SystemNote.field) IN ('CUSTRECORD_WMSE_LABEL_PRINT') "+
						" AND UPPER(SystemNote.oldvalue) = 'F' " +
						" AND UPPER(SystemNote.newvalue) = 'T' "+
						" AND SystemNote.\"DATE\" > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
					// Run the SuiteQL query
					resultSuiteQL= query.runSuiteQL({query: sqlQuery
					});
					queryResults = resultSuiteQL.results;
					if(queryResults.length > 0 && (queryResults[0].values).length > 0){
						if((queryResults[0].values)[0] > 0){
							printDriverEnabled = true;
						}
					}
				}

				// Checking Shipping Integration enablement
				var shipIntegrationEnabled = false;
				sqlQuery = " SELECT " +
					" COUNT(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
					" FROM " +
					" SystemNote "+
					" WHERE "+
					" SystemNote.recordtypeid IN ('"+ customRecordidObj['WMS Ship Manifest'] + "') " +
					" AND UPPER(SystemNote.\"CONTEXT\") IN ('WSS') " +
					" AND UPPER(SystemNote.field) IN ('CUSTRECORD_WMSSE_SHIP_SYSTEM') "+
					" AND UPPER(SystemNote.oldvalue) IS NULL " +
					" AND UPPER(SystemNote.newvalue) IS NOT NULL "+
					" AND SystemNote.\"DATE\" > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
				// Run the SuiteQL query
				resultSuiteQL= query.runSuiteQL({query: sqlQuery
				});
				queryResults = resultSuiteQL.results;
				if(queryResults.length > 0 && (queryResults[0].values).length > 0){
					if((queryResults[0].values)[0] > 0){
						shipIntegrationEnabled = true;
					}
				}

				if(shipIntegrationEnabled){

					// using Shipping Integration
					sqlQuery = " SELECT " +
						" COUNT(SystemNote.recordid) AS recordidRAW /*{recordid#RAW}*/ "+
						" FROM " +
						" SystemNote "+
						" WHERE "+
						" SystemNote.recordtypeid IN ('"+ customRecordidObj['WMS Ship Manifest'] + "') " +
						" AND UPPER(SystemNote.\"CONTEXT\") IN ('WSS') " +
						" AND UPPER(SystemNote.field) IN ('CUSTRECORD_WMSSE_SHIP_TRACKNO') "+
						" AND UPPER(SystemNote.oldvalue) IS NULL " +
						" AND UPPER(SystemNote.newvalue) IS NOT NULL "+
						" AND SystemNote.\"DATE\" > BUILTIN.RELATIVE_RANGES('" + dateRange + "', 'END', 'DATETIME_AS_DATE') ";
					// Run the SuiteQL query
					resultSuiteQL= query.runSuiteQL({query: sqlQuery
					});
					queryResults = resultSuiteQL.results;
					if(queryResults.length > 0 && (queryResults[0].values).length > 0){
						if((queryResults[0].values)[0] > 0){
							noOfCartonsShipped = (queryResults[0].values)[0];
						}
					}
				}
				finalDataObj[featureName] = { "printDriverEnabled" : printDriverEnabled,
					"shipIntegrationEnabled" : shipIntegrationEnabled,
					"NoOfCartonsShipped" : noOfCartonsShipped
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
	return {
		execute: execute
	};

});
