/**
 * Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_outBoundUtility','N/search','./wms_inbound_utility'],

		function(runtime,utility,obUtility,search,inbound_utility) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 */
	function getInputData() {
		try
		{
			var  scriptObj= runtime.getCurrentScript();
			var currentUserId = runtime.getCurrentUser().id;

			var ordid =scriptObj.getParameter({ name :'custscript_wms_taskorderid'});
			var taskIdStr =scriptObj.getParameter({ name :'custscript_wms_taskdata'});
			log.debug("taskIdStr",taskIdStr)

			var taskIdArr = [];
			var resultObj = {};
			if(utility.isValueValid(taskIdStr)){
				taskIdArr = taskIdStr.split(",");
				/*if(taskIdArr.length > 0){
					resultObj =	getOpentaskResults(taskIdArr);
				}*/
				utility.updateScheduleScriptStatus('Inbound Reversal Mapreduce',currentUserId,'In Progress',ordid);
			}


			return taskIdArr;
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
			var taskId = context.values[0];
			log.debug("taskId",taskId);
			var openTaskResult =	inbound_utility.getOpentaskResultsForReversal(taskId);
			var nsrefCounter = 0;
			var nsrefArray = [];
			var parentItemArray = [];
			log.debug("opentaskresult",openTaskResult);
			for(var task =0;task<openTaskResult.length;task++) {
				var nsrefno = openTaskResult[task].getValue('custrecord_wmsse_nsconfirm_ref_no');
				var isIRUpdated = true;
				var ordid = openTaskResult[task].getValue('custrecord_wmsse_order_no');
				var ordlineno = openTaskResult[task].getValue('custrecord_wmsse_line_no');
				var taskqty = openTaskResult[task].getValue('custrecord_wmsse_act_qty');
				var serials = openTaskResult[task].getValue('custrecord_wmsse_serial_no');
				var taskactloc = openTaskResult[task].getValue('custrecord_wmsse_actbeginloc');
				var taskstatus = openTaskResult[task].getValue('custrecord_wmsse_inventorystatus');
				var tasklotno = openTaskResult[task].getValue('custrecord_wmsse_batch_num');
				var itemId = openTaskResult[task].getValue('custrecord_wmsse_sku');
                var inboundShipment = openTaskResult[task].getText('custrecord_wmsse_inbshipment');
				var lineNo = ordlineno;

				var parentItem = openTaskResult[task].getText('custrecord_wmsse_parent_sku_no');
				var parentItemId = openTaskResult[task].getValue('custrecord_wmsse_parent_sku_no');
				var kitFlag = openTaskResult[task].getValue('custrecord_wmsse_kitflag');

				log.debug('parentItem', parentItem);
				log.debug('parentItemId', parentItemId);
				if(nsrefArray.indexOf(nsrefno) == -1){
					parentItemArray.push(parentItemId);
					nsrefArray.push(nsrefno);
					nsrefCounter=0;
				}
				else{
					if(parentItemArray.indexOf(parentItemId) == -1)
					{
						log.debug('new item came into parentItemArray','');
						nsrefArray.push(nsrefno);
						parentItemArray.push(parentItemId);
						nsrefCounter=0;
					}
					else
					{
						log.debug('same item came into parentItemArray','');
						nsrefArray.push(nsrefno);
						nsrefCounter++;
					}

				}
				log.debug('nsrefArray', nsrefArray);
				log.debug('parentItemArray',parentItemArray);

				if(utility.isValueValid(inboundShipment)){
					nsrefno= inbound_utility.getItemReceiptId(ordid,inboundShipment,itemId);
					lineNo = inbound_utility.getOrderLineNo(ordid,inboundShipment,itemId);
				}

				if (utility.isValueValid(nsrefno)) {
					var vTrantype = '';
					if(utility.isValueValid(ordid)) {
						var orderLookUp = search.lookupFields({
							type: search.Type.TRANSACTION,
							id: ordid,
							columns: ['type']

						});
						log.debug("orderLookUp",orderLookUp);
						if(utility.isValueValid(vTrantype)){
							var type  =  orderLookUp.type;
							 vTrantype = type[0].text;
							if(vTrantype == "Transfer Order")
							{
								vTrantype = "transferorder";
							}
						}
					}
					var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
					isIRUpdated = inbound_utility.updateItemReceipt(inventoryStatusFeature, nsrefno, ordid, lineNo, vTrantype, taskqty, serials, taskactloc, taskstatus, tasklotno, parentItemArray, itemId, kitFlag, nsrefCounter);
				}
				if (isIRUpdated) {
					inbound_utility.updateOpenTaskRecord(taskId, taskqty);

					if (!utility.isValueValid(nsrefno) && utility.isValueValid(serials)) {
						inbound_utility.updateSerialTask(itemId, ordlineno, ordid);
					}

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
			var ordid =scriptObj.getParameter({ name :'custscript_wms_taskorderid'});
			utility.updateScheduleScriptStatus('Inbound Reversal Mapreduce',currentUserId,'Completed',ordid);

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
