/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record','N/runtime','./wms_utility','./wms_packingUtility','N/search'],

		function(record,runtime,utility,packUtility,search) {


	function getInputData() {

		try
		{
			var scriptObj = runtime.getCurrentScript();
			var orderItemfulfillmentIdObj= scriptObj.getParameter({ name : 'custscript_wms_itemfulfillment_array'});
			var orderItemfulfillmentIdObject = JSON.parse(orderItemfulfillmentIdObj);
			var itemFulFillmentOrderObject = {};
			for(var obj in orderItemfulfillmentIdObject) {
				var itemfulfillmentString = orderItemfulfillmentIdObject[obj];
				var itemfulfillmentArr = itemfulfillmentString.split(",");
				for(var itemfulfillmentLength = 0;itemfulfillmentLength < itemfulfillmentArr.length; itemfulfillmentLength++){
					var itemfulfillmentId = itemfulfillmentArr[itemfulfillmentLength];
					itemFulFillmentOrderObject[itemfulfillmentId] = obj;
				}
			}
			var orderArray = scriptObj.getParameter({ name : 'custscript_wms_order_array'});
			var orderDetails = JSON.parse(orderArray);
			var currentUserId = runtime.getCurrentUser().id;
			var transactionType = scriptObj.getParameter({ name : 'custscript_wms_transactiontype'});
			utility.updateScheduleScriptStatus('GUI Packing Mapreduce',currentUserId,'In Progress',orderDetails,transactionType);
			return itemFulFillmentOrderObject;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}
	
	function map(context) {
		try
		{
			var orderinternald= context.value;
			var itemfulfillmentId = context.key;
			context.write(itemfulfillmentId, orderinternald);
		}
		catch(e)
		{
			log.error({title:'Exception in Map',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}

	function reduce(context) {
		try
		{			
			var itemFulfillmentId = context.key;
			var OrderInternalId =context.values;    	
			var scriptObj = runtime.getCurrentScript();
			var cartonName = scriptObj.getParameter({ name : 'custscript_wms_newcarton'});
			var cartonSize = scriptObj.getParameter({ name : 'custscript_wms_newcartonsize'});
			var cartonWeight = scriptObj.getParameter({ name : 'custscript_wms_newcartonweight'});
			var transactionName = scriptObj.getParameter({ name : 'custscript_wms_ordername'});
			var transactionType = scriptObj.getParameter({ name : 'custscript_wms_transactiontype'});
 			var itemFulfillmentline = scriptObj.getParameter({ name : 'custscript_wms_line_array'});
			var inventoryDetailsdData = scriptObj.getParameter({ name : 'custscript_wms_inventorydetails'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_location'});
 			
			var str = 'reduce Key. = ' + context.key + '<br>';
			str = str + 'OrderInternalId. = ' + OrderInternalId + '<br>';	
			str = str + 'itemFulfillmentDetails = ' + itemFulfillmentId + '<br>';
			str = str + 'itemFulfillmentline = ' + itemFulfillmentline + '<br>';
			str = str + 'cartonName = ' + cartonName + '<br>';
			str = str + 'cartonSize = ' + cartonSize + '<br>';
			str = str + 'cartonWeight = ' + cartonWeight + '<br>';
			str = str + 'transactionType = ' + transactionType + '<br>';
			str = str + 'transactionName = ' + transactionName + '<br>';
			str = str + 'inventoryDetailsdData = ' + inventoryDetailsdData + '<br>';
			str = str + 'warehouseLocationId = ' + warehouseLocationId + '<br>';
			log.debug({title:'reduce_parameters',details:str});
			
			    var ifLineIdFinalObj= packUtility.getItemfulfilmntLineNumber(itemFulfillmentId.toString());
				  packUtility.updateItemfulfillmentPack(itemFulfillmentId.toString(),JSON.parse(itemFulfillmentline),cartonName,cartonWeight,JSON.parse(inventoryDetailsdData),'',ifLineIdFinalObj,warehouseLocationId);			

		}
		catch(e)
		{
			log.error({title:'Exception in Reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}
	
	function summarize(summary) {
		try {
			var scriptObj = runtime.getCurrentScript();
			var orderArray = scriptObj.getParameter({name: 'custscript_wms_order_array'});
			var transactionType = scriptObj.getParameter({name: 'custscript_wms_transactiontype'});
			var cartonName = scriptObj.getParameter({name: 'custscript_wms_newcarton'});
			var cartonSize = scriptObj.getParameter({name: 'custscript_wms_newcartonsize'});
			var cartonWeight = scriptObj.getParameter({name: 'custscript_wms_newcartonweight'});
			var warehouseLocationId = scriptObj.getParameter({name: 'custscript_wms_location'});
			var itemDtl = scriptObj.getParameter({name: 'custscript_wms_packing_itemarray'});
			var commodityShipmentDtl = JSON.parse(scriptObj.getParameter({name: 'custscript_wms_packing_commodityshipment'}));
			var itemfulfillmentArray = scriptObj.getParameter({name: 'custscript_wms_itemfulfillment_array'});
			var orderInternalIdObj = JSON.parse(orderArray);

			if (orderInternalIdObj) {
				itemDtl = JSON.parse(itemDtl);
				for (var order1 in orderInternalIdObj) {
					var orderInternalId = orderInternalIdObj[order1];
					var itemFulfillmentDetails = JSON.parse(itemfulfillmentArray);
					var itemfulfillmentStr = itemFulfillmentDetails[orderInternalId];
					var uccNo = '';
					var packedItemfulfillmentsOfOrder = [];
					var itemfulfillmentSearchObj = search.load("customsearch_wms_itemfulfillmentstatus");
					itemfulfillmentSearchObj.filters.push(
						search.createFilter({
							name: 'createdfrom',
							operator: search.Operator.ANYOF,
							values: orderInternalId
						})
					);
					itemfulfillmentSearchObj.run().each(function (result) {
						packedItemfulfillmentsOfOrder.push(result.getValue({name: 'internalid', summary: 'group'}));
						return true;
					});
					var itemfulfillmentArr = itemfulfillmentStr.split(",");
					var itemfulfillmentList = "";
					for (var itemfulfillment = 0; itemfulfillment < itemfulfillmentArr.length; itemfulfillment++) {
						if (packedItemfulfillmentsOfOrder.indexOf(itemfulfillmentArr[itemfulfillment]) != -1) {
							if (itemfulfillmentList == "") {
								itemfulfillmentList = itemfulfillmentArr[itemfulfillment];

							} else {
								itemfulfillmentList = itemfulfillmentList + "," + itemfulfillmentArr[itemfulfillment];
							}
						}
					}
					if (itemfulfillmentList != "") {
						var ASNCRuleVal = utility.getSystemRuleValue('Generate EDI 856 outbound ASNs?', warehouseLocationId);
						if (ASNCRuleVal == 'Y') {
							uccNo = packUtility.GenerateLabel(orderInternalId, 1, cartonName);
						}


						var shipManifestDataArray =
							packUtility.fnCreateShipManifestRecord(orderInternalId, orderInternalId, cartonName, '', '', cartonWeight,
								cartonWeight, transactionType, warehouseLocationId, itemfulfillmentList.toString(), cartonSize, itemDtl[orderInternalId], commodityShipmentDtl[orderInternalId], uccNo);
						if (shipManifestDataArray.length > 0) {

							var UCCRuleVal = utility.getSystemRuleValue('Label Printing: UCC/GS1 Labels with 3rd party integration', warehouseLocationId);
							var Zebraucclabel = utility.getSystemRuleValue('Label Printing: UCC/GS1 labels using ZPL', warehouseLocationId);
							var ZebraAddresslabel = utility.getSystemRuleValue('Label Printing: Address labels using ZPL', warehouseLocationId);

							var recordType = '';
							if (transactionType == 'SalesOrd')
								recordType = 'salesorder';
							else if (transactionType == 'TrnfrOrd')
								recordType = 'transferorder';

							packUtility.createPacklistHtml(orderInternalId, recordType, null, cartonName, warehouseLocationId);


							var salesorderrecords = record.load({
								type: recordType,
								id: orderInternalId
							});
							if (UCCRuleVal == 'Y') {
								packUtility.GenerateUCCLabel(orderInternalId, cartonName, salesorderrecords);
							}
							if (Zebraucclabel == 'Y') {
								packUtility.GenerateZebraUccLabel(orderInternalId, cartonName, salesorderrecords, warehouseLocationId);
							}
							if (ZebraAddresslabel == 'Y') {
								packUtility.GenerateZebraAddressLabel(orderInternalId, salesorderrecords, warehouseLocationId);
							}
						}
					}

				}

				var currentUserId = runtime.getCurrentUser().id;
				utility.updateScheduleScriptStatus('GUI Packing Mapreduce', currentUserId, 'Completed', orderInternalIdObj, transactionType);

			}
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
