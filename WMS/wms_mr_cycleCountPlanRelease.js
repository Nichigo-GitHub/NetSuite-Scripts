/**
 * Copyright © 2021, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility', 'N/record', '../Restlets/wms_inventory_utility'],

		function(runtime,utility,record,inventoryUtility) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 */
	function getInputData() {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('cycleCountGenerateAndRelease',currentUserId,'In Progress');
			//log.error({title:'context',details:context});
			var cycleCountPlanName = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_plannumber_param'});
			utility.updateScheduleScriptStatus('cycleCountGenerateAndRelease',currentUserId,'In Progress');

			return {'cycleCountPlanName':cycleCountPlanName};

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
		var currentUserId = runtime.getCurrentUser().id;

		log.debug({title:'context in reduce',details:context});

		try
		{  
			var cycleCountPlanName =context.values[0];

			if(utility.isValueValid(cycleCountPlanName)) {
				var invCountObj = {};
				var itemId = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_itemid_param'});
				var binId = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_binlocid_param'});

				if (utility.isValueValid(itemId)) {
					itemIdArray = itemId.split(',');
				}

				if (utility.isValueValid(binId)) {
					binIdArray = binId.split(',');
				}

				invCountObj.cycleCountPlanLoction = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_location_param'});
				invCountObj.itemId = itemIdArray
				invCountObj.binId = binIdArray
				invCountObj.lineCount = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_linecount_param'});
				invCountObj.cycleCountPlansubsidiary = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_subsidary_param'});
				invCountObj.cycleCountPlanDeparment = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_department_param'});
				invCountObj.cycleCountPlanClass = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_class_param'});
				invCountObj.cycleCountPlanMemo = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_memo_param'});
				invCountObj.cycleCountPlanAccount = scriptObj.getParameter({name: 'custscript_wms_mr_cycc_account_param'});

				var recid = inventoryUtility.createInventoryCountRecord(invCountObj);
				log.debug({title:'recid in reduce',details:recid});
				if (utility.isValueValid(recid))
				{
					utility.updateScheduleScriptStatus('cycleCountGenerateAndRelease', currentUserId, 'Completed', '', '', recid);
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


	}

	return {
		getInputData: getInputData,
		reduce: reduce,
		summarize: summarize
	};

});
