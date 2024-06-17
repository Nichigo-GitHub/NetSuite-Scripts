/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record','N/runtime','N/search','./wms_utility','./wms_inboundUtility','N/task'],

		function(record,runtime,search,utility,inboundUtility,task) {

	function getInputData() {

		try
		{

			var scriptObj = runtime.getCurrentScript();
			log.debug("MAP_Remaining governance units getInputData: " + scriptObj.getRemainingUsage());

			var shipmentInternalId  = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_location'});

			log.debug('shipmentInternalId  :', shipmentInternalId);
			log.debug('warehouseLocationId :', warehouseLocationId);

			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Map Reduce',currentUserId,'In Progress',shipmentInternalId,warehouseLocationId);
			var str = 'scriptObj. = ' + scriptObj + '<br>';
			str = str + 'shipmentInternalId. = ' + shipmentInternalId + '<br>';
			str = str + 'warehouseLocationId. = ' + warehouseLocationId + '<br>';

			var openTaskQtyDetails = '';
			
			if(utility.isValueValid(shipmentInternalId) && utility.isValueValid(warehouseLocationId))
			{
				openTaskQtyDetails = inboundUtility.getOpenTaskShipmentDetails(shipmentInternalId, warehouseLocationId);
			}
			log.debug('Open Task Qty Details :', openTaskQtyDetails);
			return openTaskQtyDetails;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}
	}

	function map(context) {
		var scriptObj = runtime.getCurrentScript();
		log.debug("MAP_Remaining governance units map: " + scriptObj.getRemainingUsage());

		var shipmentInternalId  = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_shipmentid'});
		var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_location'});
		var openTaskShipments   = context.value;


		context.write({
			key : shipmentInternalId,
			value : openTaskShipments
		});
		log.debug("MAP_Remaining governance units map end: " + scriptObj.getRemainingUsage());
	}

	function reduce(context) {
		var debugString = '';
		try
		{
			var scriptObj = runtime.getCurrentScript();
			log.debug("MAP_Remaining governance units reduce: " + scriptObj.getRemainingUsage());
			var shipmentInternalId  = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_location'});
			var remainingUsage = scriptObj.getRemainingUsage();
			
			var openTaskQtyDetails = inboundUtility.getQtyDetailsFromOpenTask(shipmentInternalId, warehouseLocationId);

			var openTaskShipmentDtl=[];
			var openTaskShipments =context.values;
			for( var i=0 ;i<context.values.length;i++)
			{
				var lineItemData = JSON.stringify(JSON.parse(openTaskShipments[i]));
				var taskArray =JSON.parse(lineItemData);				
				openTaskShipmentDtl.push(taskArray);
			}
			var fromMapReduceScriptCall = scriptObj.getParameter({ name : 'custscript_wms_isfrommapreduce'}); 
			var shipmentReceiptId = '';
			log.debug("fromMapReduceScriptCall" ,fromMapReduceScriptCall);
			if(fromMapReduceScriptCall != true && fromMapReduceScriptCall != "true"){
				shipmentReceiptId = inboundUtility.postItemReceiptISM(shipmentInternalId, warehouseLocationId, openTaskShipmentDtl, openTaskQtyDetails);
			}
			else{
				shipmentReceiptId = shipmentInternalId;
			}
			log.debug('Shipment Receipt Id :', shipmentReceiptId);
		
			if(shipmentReceiptId){
				var columnsObject = new Object();
				columnsObject['custrecord_wmsse_rec_inb_shipment'] = shipmentReceiptId;
				for(var openTaskItr in openTaskShipmentDtl){
					var scriptObj = runtime.getCurrentScript();
					var remainingUsage = scriptObj.getRemainingUsage();
					if(remainingUsage > 50){
					utility.submitRecord('customrecord_wmsse_trn_opentask', openTaskShipmentDtl[openTaskItr].internalid, columnsObject);
					}
					else{

						var mrTask = task.create({
							taskType: task.TaskType.MAP_REDUCE,
							scriptId: 'customscript_wms_mr_ism_postitemreceipt',
							deploymentId: null,
							params : {
								"custscript_wms_isfrommapreduce" : true	,	
								"custscript_wms_mr_ism_ir_shipmentid" : shipmentInternalId,
								"custscript_wms_mr_ism_ir_location":warehouseLocationId

							}
						});

						// Submit the map/reduce task
						var mrTaskId = mrTask.submit();
					          break;
					
					}
				}

			}


		}
		catch(e)
		{
			log.error({title:'Exception in reduce',details:e});    		
		}

	}

	function summarize(summary) {

		try
		{

			var scriptObj = runtime.getCurrentScript();    
			log.debug("summarize-Remaining governance summarize: " + scriptObj.getRemainingUsage());

			var shipmentInternalId  = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_ir_location'});
			var currentUserId 		= runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Map Reduce',currentUserId,'Completed',shipmentInternalId,warehouseLocationId);			
		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}

	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};

});
