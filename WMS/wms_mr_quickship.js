/**
 * Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_packingUtility'],

		function(runtime,utility,packUtility) {


	function getInputData() {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var inputParamObj={};
			var outputObj ={};
			var itemfulfilmentDataObj={};
			var objQuickShipData = scriptObj.getParameter({ name : 'custscript_wms_quickshipdata'});
			var transactionInternalId = scriptObj.getParameter({ name : 'custscript_wms_transactioninternalid'});
			var itemfulfilmentData = scriptObj.getParameter({ name : 'custscript_wms_itemfulfilmentdata'});
			var str =  'OrderInternalId. = ' + transactionInternalId + '<br>';	
			str = str + 'itemFulfillmentDetails = ' + itemfulfilmentData + '<br>';
			str = str + 'quickShipData = ' + objQuickShipData + '<br>';
		 
			log.debug({title:'input_parameters',details:str});
			objQuickShipData = JSON.parse(objQuickShipData);
		    if(utility.isValueValid(itemfulfilmentData)){
               itemfulfilmentDataObj = JSON.parse(itemfulfilmentData);
		    }
			log.debug("objQuickShipData",objQuickShipData);
		    for(var containerLP in objQuickShipData){
					inputParamObj={};
					inputParamObj.contLpNo =  containerLP;
					inputParamObj.ordNo = objQuickShipData[containerLP].orderInternalId;
					inputParamObj.trackingNo  = objQuickShipData[containerLP].trackingNo;
					inputParamObj.actualweight = objQuickShipData[containerLP].packweight;
					var shipManifestDetailsArr = packUtility.fnGetShipManifestRecordData(inputParamObj);
			     	var shipManifestDetailsArrLength = shipManifestDetailsArr.length;
				   if(shipManifestDetailsArrLength > 0) {
					   for(var shipManifest = 0 ;shipManifest < shipManifestDetailsArrLength;shipManifest++) {
						   var outputObj = shipManifestDetailsArr[shipManifest];
						   inputParamObj={};
						   inputParamObj.contLpNo =  containerLP;
						   inputParamObj.ordNo = objQuickShipData[containerLP].orderInternalId;
						   inputParamObj.trackingNo  = objQuickShipData[containerLP].trackingNo;
						   inputParamObj.actualweight = objQuickShipData[containerLP].packweight;
						  if (!utility.isValueValid(itemfulfilmentData) || itemfulfilmentData == '{}') {
							   objQuickShipData[containerLP].shipManifestId = outputObj.shipManifestId;
							   objQuickShipData[containerLP].itemFulfillmentId = outputObj.itemFulfillmentId;
							   inputParamObj.shipManifestData = outputObj.shipmanifestData;
						       inputParamObj.shipManifestId = outputObj.shipManifestId;
						       inputParamObj.itemFulfillmentId = outputObj.itemFulfillmentId;
							   packUtility.updateItemFulfillmentDataObj(itemfulfilmentDataObj, inputParamObj);
						  }
						   inputParamObj.shipManifestId = outputObj.shipManifestId;
						   inputParamObj.itemFulfillmentId = outputObj.itemFulfillmentId;
						   inputParamObj.quickshipFlag = 'true';
						   packUtility.fnUpdateShipManifestRecord(inputParamObj);
					   }
				  }
				   else{
					   if(!utility.isValueValid(itemfulfilmentData) || itemfulfilmentData == '{}'){
						   outputObj = packUtility.fnGetShipManifestRecordData(inputParamObj);
						   objQuickShipData[containerLP].shipManifestId = outputObj.shipManifestId;
						   objQuickShipData[containerLP].itemFulfillmentId = outputObj.itemFulfillmentId;
						   inputParamObj.shipManifestData = outputObj.shipmanifestData;
						   packUtility.updateItemFulfillmentDataObj(itemfulfilmentDataObj,inputParamObj);
					   }
					   inputParamObj.shipManifestId  = objQuickShipData[containerLP].shipManifestId;
					   inputParamObj.itemFulfillmentId = objQuickShipData[containerLP].itemFulfillmentId;
					   inputParamObj.quickshipFlag = 'true';
					   packUtility.fnUpdateShipManifestRecord(inputParamObj);
				   }
				}
 			 	
			utility.updateScheduleScriptStatus('GUI Quickship Mapreduce',runtime.getCurrentUser().id,'In Progress',transactionInternalId);
			return itemfulfilmentDataObj;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}
	
	function reduce(context) {
		try
		{
			var itemFulfillmentId = context.key;
			var itemfulfilmentData =context.values[0];    	
			
			var str = 'reduce Key. = ' + context.key + '<br>';
			str = str + 'itemfulfilmentData. = ' + itemfulfilmentData + '<br>';	
			
			log.debug({title:'reduce_parameters',details:str});
			itemfulfilmentData = JSON.parse(itemfulfilmentData);
 			var itemfulfilmentDataObj = {};
			itemfulfilmentDataObj[itemFulfillmentId] = itemfulfilmentData;
			packUtility.updateItemfulfillmentforquickship(itemfulfilmentDataObj);
		}
		catch(e)
		{
			log.error({title:'Exception in Reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}
	
	function summarize(summary) {
		try
    	{  
    		var scriptObj = runtime.getCurrentScript();    		
    		var orderInternalId = scriptObj.getParameter({ name : 'custscript_wms_transactioninternalid'});
    		 
     		utility.updateScheduleScriptStatus('GUI Quickship Mapreduce',runtime.getCurrentUser().id,'Completed',orderInternalId);
    	
    	}
    	catch(e)
    	{
    		log.error({title:'Exception in Summarize',details:e});    		
    		log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
    	}

	}

	return {
		getInputData: getInputData,
		reduce: reduce,
		summarize: summarize
	};

});
