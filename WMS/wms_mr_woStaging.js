/**
 * Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_workOrderUtility'],

		function(runtime,utility,woUtility) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 */
	function getInputData() {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var str = 'scriptObj. = ' + scriptObj + '<br>';
			var currentUserId = runtime.getCurrentUser().id;

			var transactionInternalId = scriptObj.getParameter({ name :'custscript_wms_mr_wointernalid'});
	
			//updating the intermediate custom record status to 'In progress' for internal reference
			utility.updateScheduleScriptStatus('Workorder Stagebin Update Mapreduce',currentUserId,'In Progress',
					transactionInternalId);

			var opentaskSearchResultsPick =  woUtility.fetchingComponentsforStaging(transactionInternalId);

			str = str + 'currentUserId. = ' + currentUserId + '<br>';	
			str = str + 'transactionInternalId. = ' + transactionInternalId + '<br>';	
			str = str + 'opentaskSearchResultsPick. = ' + opentaskSearchResultsPick.length + '<br>';
			log.debug('str',str);
			return opentaskSearchResultsPick;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 */

	function reduce(context) {
		try
		{
			var scriptObj = runtime.getCurrentScript();		
			var stageBinInternalId = scriptObj.getParameter({ name :'custscript_wms_mr_stagebininternalid'});
			var binTransferId = scriptObj.getParameter({ name :'custscript_wms_mr_bintransferid'});
			var openTaskDetails =context.values[0];		
			var openTaskData = JSON.stringify(JSON.parse(openTaskDetails));
		    openTaskDetails =JSON.parse(openTaskData);
			if(utility.isValueValid(openTaskDetails) && utility.isValueValid(binTransferId) && utility.isValueValid(stageBinInternalId))
			{
				woUtility.updateOpenTaskInWOStaging(openTaskDetails,binTransferId,stageBinInternalId);
			}
		}
		catch(e)
		{
			log.error({title:'Exception in reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}

	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

		try
		{
			var scriptObj = runtime.getCurrentScript();
			var currentUserId = runtime.getCurrentUser().id;
			var transactionInternalId = scriptObj.getParameter({ name :'custscript_wms_mr_wointernalid'});
			var warehouseLocationId = scriptObj.getParameter({ name :'custscript_wms_mr_warehouselocationid'});
			var vnFetchedItemId = scriptObj.getParameter({ name :'custscript_wms_mr_itemid'});
			var vnenterQty = scriptObj.getParameter({ name :'custscript_wms_mr_quantity'});
			var vnbinInternalId = scriptObj.getParameter({ name :'custscript_wms_mr_frombinid'});
			var stageBinInternalId = scriptObj.getParameter({ name :'custscript_wms_mr_stagebininternalid'});
			var binTransferId = scriptObj.getParameter({ name :'custscript_wms_mr_bintransferid'});
			var fromInvStatus = scriptObj.getParameter({ name :'custscript_wms_mr_fromstatus'});
			var toInvStatus = scriptObj.getParameter({ name :'custscript_wms_mr_tostatus'});

			
		   var opentaskObj = {}; 	
           opentaskObj.warehouseLocationId = warehouseLocationId;
           opentaskObj.itemId = vnFetchedItemId;	
           opentaskObj.vnenterQty = vnenterQty;	
           opentaskObj.fromBinId = vnbinInternalId;	
           opentaskObj.toBinId = stageBinInternalId;	
           opentaskObj.inventoryCountId = binTransferId;	
           opentaskObj.taskType = "MOVE";	
           opentaskObj.soInternalId = transactionInternalId;
           opentaskObj.fromStatus = fromInvStatus;
           opentaskObj.toStatus = toInvStatus;
           woUtility.updateMoveOpenTask(opentaskObj);

			//updating the intermediate custom record status to 'Complete' for internal reference
			utility.updateScheduleScriptStatus('Workorder Stagebin Update Mapreduce',currentUserId,'Completed',
					transactionInternalId);
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
