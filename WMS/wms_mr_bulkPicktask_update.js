/**
 * Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_outBoundUtility'],

		function(runtime,utility,obUtility) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 */
	function getInputData() {
		try
		{
			var  scriptObj= runtime.getCurrentScript();
			var currentUserId = runtime.getCurrentUser().id;
			var pickTaskId =scriptObj.getParameter({ name :'custscript_wms_picktaskid'});

			utility.updateScheduleScriptStatus('Bulkpicking PickTask Update Mapreduce',currentUserId,'In Progress',pickTaskId);

			return {'picktaskId':pickTaskId};
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

		var scriptObj = runtime.getCurrentScript();		
		var pickQty=scriptObj.getParameter({ name :'custscript_wms_pickitemqty'});
		var fromBinId=scriptObj.getParameter({ name :'custscript_wms_frombinid'});
		var batchNo=scriptObj.getParameter({ name :'custscript_wms_batchno'});
		var fromStatus=scriptObj.getParameter({ name :'custscript_wms_fromstatusid'});
		var itemType=scriptObj.getParameter({ name :'custscript_wms_item_type'});
		var containerName =scriptObj.getParameter({ name :'custscript_wms_containername'});
		var locUseBinsFlag = scriptObj.getParameter({ name :'custscript_wms_locusebinsflag'});
		var pickActionIdArray = JSON.parse(scriptObj.getParameter({ name :'custscript_wms_pickActionIdArray'}));

		try
		{  
			var pickTaskId =context.values[0];
			if(utility.isValueValid(pickTaskId))
			{  
				locUseBinsFlag = (locUseBinsFlag == "false") ? false:true;
				var picktaskObj ={};
				picktaskObj.picktaskid = pickTaskId;
				picktaskObj.pickqty = pickQty;
				picktaskObj.fromBinId = fromBinId;
				picktaskObj.batchno = batchNo;
				picktaskObj.statusInternalId = fromStatus;
				picktaskObj.itemType = itemType;
				picktaskObj.containerName = containerName;
				picktaskObj.locUseBinsFlag = locUseBinsFlag;
				picktaskObj.pickActionIdArray = pickActionIdArray;

				obUtility.bulkPickTaskUpdate(picktaskObj);
			
				if(itemType == "noninventoryitem" && locUseBinsFlag !== false)
				{
					var pickingType = 'BULK';
					obUtility.updateStageForNonInventoryItem(pickTaskId,null,'multiorder',null,pickingType);

				}
				
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
			var pickTaskId =scriptObj.getParameter({ name :'custscript_wms_picktaskid'});
			utility.updateScheduleScriptStatus('Bulkpicking PickTask Update Mapreduce',currentUserId,'Completed',pickTaskId);
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
