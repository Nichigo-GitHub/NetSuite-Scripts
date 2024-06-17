/**
 * Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_reversePicks_utility'],

		function(runtime,utility,reversePicksUtility) {


	function getInputData() {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var pickTaskDetailsObj = JSON.parse(scriptObj.getParameter({name : 'custscript_wms_picktask_details'}));
			log.debug({title:'pickTaskDetailsObj',details:pickTaskDetailsObj});
			return pickTaskDetailsObj;

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
			var scriptObj = runtime.getCurrentScript();
			var pickTaskData =JSON.parse(context.values[0]);
			var warehouseLocation = scriptObj.getParameter({name : 'custscript_wms_warehouse_location'});
			var locationUseBinsFlag = scriptObj.getParameter({name : 'custscript_wms_locationusebinflag'});
			var transactionType = scriptObj.getParameter({name : 'custscript_wms_trantype'});

			locationUseBinsFlag = (locationUseBinsFlag == "false") ? false:true;

			if (transactionType == "Sales Order") {
				transactionType = "SalesOrder";
			}
			else if (transactionType == "Transfer Order"){
				transactionType = "TransferOrder";
			}
			var pickTaskInputObj = {};
			var KitComponentPickTaskArr = [];
			pickTaskInputObj.warehouseLocationId = warehouseLocation;
			pickTaskInputObj.pickTaskId			 = pickTaskData.pickTaskNum;
			pickTaskInputObj.orderId 			 = pickTaskData.transactionId;
			pickTaskInputObj.pickActionLineNumber= pickTaskData.pickTasklineNum;
			pickTaskInputObj.pickActionLineStatus= pickTaskData.pickTasklineStatus;
			pickTaskInputObj.itemInternalId		 = pickTaskData.pickTask_itemId;
			pickTaskInputObj.locUseBinsFlag		 = locationUseBinsFlag;
			pickTaskInputObj.transactionType	 = transactionType;
			pickTaskInputObj.kitItemLineNumber	 = pickTaskData.kititemorderline;
			pickTaskInputObj.subItemOf			 = pickTaskData.kitItemId;

			if(utility.isValueValid(pickTaskInputObj.subItemOf) && utility.isValueValid(pickTaskInputObj.kitItemLineNumber)){
				KitComponentPickTaskArr = reversePicksUtility.getKitComponentPickTasks(pickTaskInputObj);
				pickTaskInputObj.KitComponentPickTaskArr = KitComponentPickTaskArr;
			}
			log.debug({title:'pickTaskInputObj',details:pickTaskInputObj});
			reversePicksUtility.submitReversal(pickTaskInputObj);

		}
		catch(e)
		{
			log.error({title:'Exception in Reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}
	
	function summarize(summary) {

	}

	return {
		getInputData: getInputData,		
		reduce: reduce,
		summarize: summarize
	};

});
