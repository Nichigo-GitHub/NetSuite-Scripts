/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_inboundUtility','./wms_inbound_utility'],

		function(runtime,utility,inboundUtility,inboundLib) {

	function getInputData(context) {

		try
		{

			var scriptObj = runtime.getCurrentScript();
			log.debug({title:"MAP_Remaining governance units getInputData: " ,details: scriptObj.getRemainingUsage()});

			var cartBinId 			= scriptObj.getParameter({ name : 'custscript_wms_mr_cartPutaway_cartBinId'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_cartputaway_whlocation'});
			var binTransferId = scriptObj.getParameter({ name : 'custscript_wms_mr_cart_binTransferId'});

			log.debug({title:'cartBinId:',details:cartBinId});
			log.debug({title:'warehouseLocationId :', details:warehouseLocationId});

			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS Cart PutAway Map Reduce',currentUserId,'In Progress',cartBinId,warehouseLocationId);


			var getCartItemListResults = null;
			if(utility.isValueValid(cartBinId) && utility.isValueValid(warehouseLocationId) && utility.isValueValid(binTransferId))
			{
				getCartItemListResults = inboundLib.getCartBinDetailsFromOpenTask(warehouseLocationId,cartBinId);
				log.debug({title:'getCartItemListResults', details:getCartItemListResults});
			}
			return getCartItemListResults;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}
	}

	function map(context) {

		var resultObj = JSON.parse(context.value);
		context.write({
			key : resultObj.custrecord_wmsse_sku,
			value : resultObj
		});
	}

	function reduce(context) {
		try{
			var cartItemObj = JSON.parse(context.values[0]);
			var scriptObj = runtime.getCurrentScript();
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_cartputaway_whlocation'});
			var cartBinId 			= scriptObj.getParameter({ name : 'custscript_wms_mr_cartPutaway_cartBinId'});
			var binTransferId 			= scriptObj.getParameter({ name : 'custscript_wms_mr_cart_binTransferId'});
			var	binTransferObject = {};
			binTransferObject.inventoryCountId = binTransferId;
			var openTaskResults = inboundUtility.getOpenTaskID(cartItemObj.custrecord_wmsse_sku,cartBinId,
					warehouseLocationId,cartItemObj.custrecord_wmsse_reccommendedbin);
			log.debug({title:'openTaskResults',details:openTaskResults});
			var openTask = 0;
			var openTaskResultsLength = openTaskResults.length;
			for(openTask = 0; openTask < openTaskResultsLength ; openTask ++){
				inboundUtility.updateNSrefno(openTaskResults[openTask].internalid,binTransferObject);
			}
		}
		catch(e){
			log.debug({title:'e',details:e});
		}


	}

	function summarize(summary) {

		try
		{
			var scriptObj = runtime.getCurrentScript();    
			log.debug("summarize-Remaining governance summarize: " + scriptObj.getRemainingUsage());

			var shipmentId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_location'});
			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS Cart PutAway Map Reduce',currentUserId,'Completed',shipmentId,warehouseLocationId);
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
