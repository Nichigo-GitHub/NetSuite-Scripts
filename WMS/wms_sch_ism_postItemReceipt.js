/**
 *    Copyright 2021, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_inboundUtility', 'N/record','N/search','N/task','N/format'],
		function(runtime,utility,inboundUtility,record,search,task,format) {

	function execute(context) {
		var scriptObj = runtime.getCurrentScript();

			var shipmentInternalId  = scriptObj.getParameter({ name : 'custscript_wms_ism_ir_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_ism_ir_location'});

			var currentUserId = runtime.getCurrentUser().id;

		try
		{
			
			var str = 'scriptObj. = ' + scriptObj + '<br>';
			str = str + 'shipmentInternalId. = ' + shipmentInternalId + '<br>';
			str = str + 'warehouseLocationId. = ' + warehouseLocationId + '<br>';
			log.debug("str ", str);

			if(utility.isValueValid(shipmentInternalId) && utility.isValueValid(warehouseLocationId))
			{
				utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler',currentUserId,'In Progress',shipmentInternalId,warehouseLocationId);
				var openTaskShipmentDtl = inboundUtility.getOpenTaskShipmentDetails(shipmentInternalId, warehouseLocationId);
				var openTaskQtyDetails = inboundUtility.getQtyDetailsFromOpenTask(shipmentInternalId, warehouseLocationId);

				var shipmentReceiptId = postItemReceiptISM(shipmentInternalId, warehouseLocationId, openTaskShipmentDtl, openTaskQtyDetails,scriptObj);
				
				var openTaskIdsToUpdate = shipmentReceiptId.OpenTaskDetails;
				
				if(openTaskIdsToUpdate){
					var columnsObject = {};
					columnsObject.custrecord_wmsse_rec_inb_shipment = shipmentReceiptId.receiveInboudShipmentId;
					for(var openTaskItr in openTaskIdsToUpdate){
						if(openTaskIdsToUpdate[openTaskItr]){
								utility.submitRecord('customrecord_wmsse_trn_opentask', openTaskIdsToUpdate[openTaskItr].openTaskIdToUpdate, columnsObject);
						}
					}

					}
					utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', currentUserId, 'Completed', shipmentInternalId, warehouseLocationId);
					if (shipmentReceiptId.invokeScheudler == true) {
						var schstatus = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
						schstatus.scriptId = 'customscript_wms_sch_ism_postitemreceipt';
						schstatus.deploymentId = null;
						schstatus.params = {
							"custscript_wms_ism_ir_shipmentid": shipmentInternalId,
							"custscript_wms_ism_ir_location": warehouseLocationId
						};
						var schTaskId = schstatus.submit();
						var taskStatus = task.checkStatus(schTaskId);
						if (taskStatus.status != 'FAILED') {
							utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', currentUserId, 'Submitted', shipmentInternalId, warehouseLocationId);
						}

					}
				}

			}
			catch (e) {
				utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', currentUserId, 'Completed', shipmentInternalId, warehouseLocationId);
				log.error({ title: 'error in execute', details: e });
			}
		}
		function postItemReceiptISM(shipmentInternalId, warehouseLocationId, openTaskDtls, openTaskQtyDetails, scriptObj) {
			var shipmentListObj = {};
			var lineNo = '';
			var objRecord = record.load({
				type: 'receiveinboundshipment',
				id: shipmentInternalId
			});
			var inboundShipmentItemcount = objRecord.getLineCount({
				sublistId: 'receiveitems'
			});
			for (var qtyItr in openTaskQtyDetails) {
				if (openTaskQtyDetails[qtyItr]) {
					for (var lineNumber = 0; lineNumber < inboundShipmentItemcount; lineNumber++) {
						lineNo = parseInt(objRecord.getSublistValue({ sublistId: 'receiveitems', fieldId: 'id', line: lineNumber }));
						if (openTaskQtyDetails[qtyItr].custrecord_wmsse_line_no == lineNo) {
							objRecord.setSublistValue({
								sublistId: 'receiveitems', fieldId: 'quantitytobereceived', line: lineNumber,
								value: ''
							});
							var compSubRecord = null;
							try {
								compSubRecord = objRecord.getSublistSubrecord({ sublistId: 'receiveitems', fieldId: 'inventorydetail', line: lineNumber });
							}
							catch (e) {
								compSubRecord = null;
							}
							if (utility.isValueValid(compSubRecord)) {
								var compinvlinelength = compSubRecord.getLineCount({ sublistId: 'inventoryassignment' });
								if (compinvlinelength > 0) {
									for (var invtassignmentLine = 0; invtassignmentLine < compinvlinelength; invtassignmentLine++) {
										if (compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber',
											line: invtassignmentLine
										}) != "") {
											compSubRecord.removeLine({
												sublistId: 'inventoryassignment',
												line: 0

											});
										}
									}
								}
							}

					}
				}
			}
		}
		var updateOpenTaskDetails = [];
		var returnObj = {};
		returnObj.invokeScheudler = false;
		for(var index = 0; index < openTaskDtls.length; index++){
			if(scriptObj.getRemainingUsage()<2500){
				returnObj.invokeScheudler =  true;
				break;
			}
			else{
				var openTaskObj = {};
				shipmentListObj.shipmentInternalId = shipmentInternalId;
				shipmentListObj.warehouseLocationId = warehouseLocationId;
				shipmentListObj.binInternalId = openTaskDtls[index].custrecord_wmsse_actbeginloc;
				shipmentListObj.shipmentLineNo = openTaskDtls[index].custrecord_wmsse_line_no;
				shipmentListObj.quantity = openTaskDtls[index].custrecord_wmsse_act_qty;
				shipmentListObj.itemType = utility.getItemType(openTaskDtls[index].custrecord_wmsse_sku, warehouseLocationId);
				shipmentListObj.openTaskSerials = openTaskDtls[index].custrecord_wmsse_serial_no;
				shipmentListObj.inventoryStatusId = openTaskDtls[index].custrecord_wmsse_inventorystatus;
				shipmentListObj.expiryDate = openTaskDtls[index].custrecord_wmsse_expirydate;
				var serialSearchResults = setLineDetailsForShipmentRecordIRPosting(objRecord, inboundShipmentItemcount, shipmentListObj, openTaskDtls);
				openTaskObj.openTaskIdToUpdate = openTaskDtls[index].internalid;
				updateOpenTaskDetails.push(openTaskObj);
				if(serialSearchResults && serialSearchResults.length > 0){
					this.closeSerialEntryRecordsForTransaction(serialSearchResults);
				}
			}
		}
		
		returnObj.receiveInboudShipmentId =  objRecord.save();
		returnObj.OpenTaskDetails = updateOpenTaskDetails;
		return returnObj;
	}
	function setLineDetailsForShipmentRecordIRPosting(objRecord, inboundShipmentItemcount, shipmentListObj, openTaskDtls){
		var serialSearchResults;
		var shipmentInternalId = shipmentListObj.shipmentInternalId;
		var binInternalId = shipmentListObj.binInternalId;
		var shipmentLineNo = shipmentListObj.shipmentLineNo;
		var quantity = shipmentListObj.quantity;
		var itemType = shipmentListObj.itemType;
		var inventoryStatusId = shipmentListObj.inventoryStatusId;
		var lineNo, poInternalId;
		shipmentLineNo = parseInt(shipmentLineNo);
		if(itemType == "noninventoryitem" || itemType == "otherchargeitem" ||
				itemType =="serviceitem" || itemType =="downloaditem" || itemType =="giftcertificateitem")
		{
			itemType = 'NONINVT';
		}
		for(var lineNumber = 0; lineNumber < inboundShipmentItemcount; lineNumber++){
			lineNo = objRecord.getSublistValue({sublistId: 'receiveitems', fieldId: 'id', line : lineNumber});
			poInternalId = objRecord.getSublistValue({sublistId: 'receiveitems',fieldId: 'purchaseorder',line : lineNumber});
			lineNo = parseInt(lineNo);
			if(shipmentLineNo == lineNo) {
				objRecord.setSublistValue({sublistId: 'receiveitems',fieldId: 'receiveitem',line : lineNumber,value: true});
				var qtyposted =	objRecord.getSublistValue({sublistId: 'receiveitems',fieldId: 'quantitytobereceived',line : lineNumber});
				if(!utility.isValueValid(qtyposted)){
					log.debug('qtyposted', qtyposted);
					qtyposted = 0;
				}
				if(utility.isValueValid(quantity))	{
					objRecord.setSublistValue({sublistId: 'receiveitems',fieldId: 'quantitytobereceived',line : lineNumber,
						value: parseFloat(quantity) + parseFloat(qtyposted)});
				}
				if(itemType != 'NONINVT')
				{
					var compSubRecord = null;
					var compinvlinelength = -1;
					try{
						compSubRecord = objRecord.getSublistSubrecord({sublistId :'receiveitems',fieldId : 'inventorydetail',line : lineNumber});
					}
					catch(e){
						compSubRecord = null;
					}
					if(utility.isValueValid(compSubRecord)){
						compinvlinelength = compSubRecord.getLineCount({sublistId:'inventoryassignment'});
					}
					if (itemType == 'serializedinventoryitem' || itemType== 'serializedassemblyitem' || itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
						if(itemType == 'lotnumberedinventoryitem' || itemType== 'lotnumberedassemblyitem'){
							inventoryStatusId = null;
						}
						serialSearchResults = this.getSerialsFromSerialEntryForISM(shipmentLineNo, poInternalId, shipmentInternalId, binInternalId, inventoryStatusId, "ISMPosting");

						var serialOrLotQty = 1;
						if (itemType == 'serializedinventoryitem' || itemType== 'serializedassemblyitem')
						{
							serialOrLotQty = 1;
						}
						if(serialSearchResults.length > 0)
						{
							log.debug('compinvlinelength', compinvlinelength);
							for(var serialLotArr = 0; serialLotArr < serialSearchResults.length ;serialLotArr ++ )
							{
								var serialNoOrLotNumber=serialSearchResults[serialLotArr].custrecord_wmsse_ser_no;
								var lotExpiryDate = '';
								if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
									serialOrLotQty = serialSearchResults[serialLotArr].custrecord_wmsse_ser_qty;
									inventoryStatusId = serialSearchResults[serialLotArr].custrecord_serial_inventorystatus;

									if(utility.isValueValid(serialSearchResults[serialLotArr].custrecord_wmsse_lot_expirydate)){
										lotExpiryDate = format.parse({
											value: serialSearchResults[serialLotArr].custrecord_wmsse_lot_expirydate,
											type: format.Type.DATE
										});
									}

								}
								compSubRecord.insertLine({sublistId: 'inventoryassignment',line : serialLotArr + compinvlinelength});
								compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'receiptinventorynumber',
									line :serialLotArr + compinvlinelength, value : serialNoOrLotNumber });
								if(utility.isValueValid(binInternalId)){
									compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'binnumber',
										line :serialLotArr + compinvlinelength, value : binInternalId });
								}
								if(utility.isValueValid(lotExpiryDate)){
									compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'expirationdate',
										line :serialLotArr + compinvlinelength, value : lotExpiryDate });
								}
								if(utility.isValueValid(inventoryStatusId)){
									compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'inventorystatus',
										line :serialLotArr + compinvlinelength, value : inventoryStatusId });
								}
								compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'quantity',
									line : serialLotArr + compinvlinelength, value : serialOrLotQty});
							}
						}
					}
					else
					{
						if((utility.isValueValid(binInternalId) || utility.isValueValid(inventoryStatusId))
								&& utility.isValueValid(compSubRecord))
						{

							if(parseInt(compinvlinelength)>0 && !utility.isValueValid(binInternalId))
							{
								for(var vItr=0;vItr<compinvlinelength;vItr++)
								{ 
									compSubRecord.removeLine({sublistId:'inventoryassignment',line:0});
								}
								compinvlinelength = 0;
							}
							compSubRecord.insertLine({
								sublistId: 'inventoryassignment',
								line : compinvlinelength });

							if(utility.isValueValid(binInternalId)){
								compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'binnumber',
									line :compinvlinelength, value : binInternalId });
							}
							if(utility.isValueValid(inventoryStatusId)){
								compSubRecord.setSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'inventorystatus',
									line :compinvlinelength,
									value : inventoryStatusId });
							}
							if(utility.isValueValid(quantity)){
								compSubRecord.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'quantity',
									line : compinvlinelength,value : quantity});
							}
						}
					}
				}
			}
			else
			{
				objRecord .setSublistValue({sublistId: 'receiveitems',fieldId: 'receiveitem',
					line : lineNumber,value: false	});
			}
		}
		return serialSearchResults;
	}
	function closeSerialEntryRecordsForTransaction(serialSearchResults, lineNum, transactionInternalId){

		if(!serialSearchResults){
			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});
			var serailFilters = serialSearch.filters;

			serailFilters.push(search.createFilter({
				name:'custrecord_wmsse_ser_ordline',
				operator: search.Operator.EQUALTO,
				values : lineNum
			}));
			serailFilters.push(search.createFilter({
				name:'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values : transactionInternalId
			}));

			serialSearch.filters = serailFilters;
			serialSearchResults =utility.getSearchResultInJSON(serialSearch);
		}


		if(serialSearchResults.length > 0)
		{
			var columnsObject = {};
			columnsObject.custrecord_wmsse_ser_status = true;
			columnsObject.custrecord_wmsse_ser_note1 = 'because of serial number is updated in opentask we have marked this serial number as closed';
			
			for (var j = 0; j < serialSearchResults.length; j++) {
				var serialRecId = serialSearchResults[j].id;
				utility.submitRecord('customrecord_wmsse_serialentry', serialRecId, columnsObject);
			}
		}
	}
	function getSerialsFromSerialEntryForISM(shipmentLineNo, poInternalId, shipmentId, binInternalId, inventoryStatusId, process){

		var serialSearch = search.load({
			id: 'customsearch_wmsse_wo_serialentry_srh',
		});
		var serailFilters = serialSearch.filters;

		serailFilters.push(search.createFilter({
			name:'custrecord_wmsse_ser_ordline',
			operator: search.Operator.EQUALTO,
			values : shipmentLineNo
		}));
		serailFilters.push(search.createFilter({
			name:'custrecord_wmsse_ser_ordno',
			operator: search.Operator.ANYOF,
			values : poInternalId
		}));
		serailFilters.push(search.createFilter({
			name:'custrecord_wmsse_inb_shipment',
			operator: search.Operator.ANYOF,
			values : shipmentId
		}));
		if(process != "ISMPosting") {
			serailFilters.push(search.createFilter({
				name: 'custrecord_wms_opentaskno',
				operator: search.Operator.ISEMPTY
			}));
		}
		if(binInternalId){
			serailFilters.push(search.createFilter({
				name:'custrecord_wmsse_ser_bin',
				operator: search.Operator.ANYOF,
				values : binInternalId
			}));
		}
		if(inventoryStatusId){
			serailFilters.push(search.createFilter({
				name:'custrecord_serial_inventorystatus',
				operator: search.Operator.ANYOF,
				values : inventoryStatusId
			}));
		}

		serialSearch.columns.push(search.createColumn({ name: 'custrecord_wmsse_ser_qty'}));
		serialSearch.columns.push(search.createColumn({ name: 'custrecord_serial_inventorystatus'}));

		serialSearch.filters = serailFilters;
		return utility.getSearchResultInJSON(serialSearch);
	}
	return {
		execute: execute,
		getSerialsFromSerialEntryForISM:getSerialsFromSerialEntryForISM,
		closeSerialEntryRecordsForTransaction:closeSerialEntryRecordsForTransaction
	};

});
