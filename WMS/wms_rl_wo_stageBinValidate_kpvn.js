/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record', './wms_utility', './wms_workOrderUtility_kpvn', './big', './wms_translator', 'N/runtime', 'N/task'],

	function (record, utility, woutility, Big, translator, runtime, task) {

		/**
		 * Function to validate stage bin
		 */
		function doPost(requestBody) {

			var wostageBinDetailsObj = {};
			var debugString = '';
			var requestParams = '';
			var binTransferId = '';
			var binTransferFlag = '';
			var impactedRecords = {};
			var woItemIdArray = [];
			var woItemTypeObj = {};
			try {
				requestParams = requestBody.params;
				log.debug({
					title: 'requestParams',
					details: requestParams
				});
				if (utility.isValueValid(requestParams)) {
					var warehouseLocationId = requestParams.warehouseLocationId;
					var binName = requestParams.binName;
					var transactionInternalId = requestParams.transactionInternalId;
					var transactionName = requestParams.transactionName;
					var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;
					var rrnumber = requestParams.rrnumber;
					var vInvStatus = '';
					var invtransferObj = {};
					var vnenterQty = '';
					var vnbinInternalId = '';
					var vnFetchedItemId = '';
					var vnItemType = '';
					var vnConversionRate = '';
					var vnBatchNum = '';
					var vnSerialNum = '';
					var vnWoInternalId = '';
					var recordIdPick = '';
					if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(binName) && utility.isValueValid(transactionInternalId)) {
						workorderOverpickingFlag = workorderOverpickingFlag || false;
						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
						var stageBinDetailsObj = {};
						stageBinDetailsObj.binName = binName;
						stageBinDetailsObj.warehouseLocationId = warehouseLocationId;
						stageBinDetailsObj.transactionInternalId = transactionInternalId;
						stageBinDetailsObj.workorderOverpickingFlag = workorderOverpickingFlag;
						var stageBinInternalId = woutility.validateStageBin(stageBinDetailsObj);

						if (utility.isValueValid(stageBinInternalId)) {
							var opentaskSearchResultsPick = woutility.fetchingComponentsforStaging(transactionInternalId);

							if (opentaskSearchResultsPick.length > 0) {
								for (var cnt = 0; cnt < opentaskSearchResultsPick.length; cnt++) {
									woItemIdArray.push(opentaskSearchResultsPick[cnt].custrecord_wmsse_sku);
								}
								var woItemTypeDetails = woutility.getItemTypeDetails(woItemIdArray, warehouseLocationId);
								for (var itemCnt = 0; itemCnt < woItemTypeDetails.length; itemCnt++) {
									woItemTypeObj[woItemTypeDetails[itemCnt].id] = woItemTypeDetails[itemCnt].recordType;
								}
								var binTransfer = record.create({
									type: record.Type.BIN_TRANSFER,
									isDynamic: true
								});

								for (var openTaskResult = 0; openTaskResult < opentaskSearchResultsPick.length; openTaskResult++) {
									recordIdPick = opentaskSearchResultsPick[openTaskResult].internalid;
									vnFetchedItemId = opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_sku;
									vnItemType = woItemTypeObj[vnFetchedItemId];
									vnenterQty = Number(opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_act_qty);
									vnConversionRate = Number(opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_conversionrate);
									vnbinInternalId = opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_actbeginloc;
									vnBatchNum = opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_batch_num;
									vnSerialNum = opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_serial_no;
									vnWoInternalId = opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_order_no;
									vInvStatus = opentaskSearchResultsPick[openTaskResult].custrecord_wmsse_inventorystatus;
									if (vnItemType == "inventoryitem" || vnItemType == "assemblyitem" || vnItemType == "lotnumberedinventoryitem" || vnItemType == "lotnumberedassemblyitem" || vnItemType == "serializedinventoryitem" ||
										vnItemType == "serializedassemblyitem") {
										invtransferObj = {};
										invtransferObj.woInternalId = vnWoInternalId;
										invtransferObj.itemType = vnItemType;
										invtransferObj.warehouseLocationId = warehouseLocationId;
										invtransferObj.itemId = vnFetchedItemId;
										if (utility.isValueValid(vnConversionRate)) {

											invtransferObj.quantity = woutility.convertQuantityInStockUnits(vnFetchedItemId, vnenterQty, vnConversionRate);
										} else {
											invtransferObj.quantity = vnenterQty;
										}
										invtransferObj.fromBinId = vnbinInternalId;
										invtransferObj.toBinId = stageBinInternalId;
										invtransferObj.batchNum = vnBatchNum;
										invtransferObj.serialNum = vnSerialNum;
										invtransferObj.transactionName = transactionName;
										invtransferObj.statusInternalId = vInvStatus;
										invtransferObj.inventoryStatusFeature = inventoryStatusFeature;
										invtransferObj.rrnumber = rrnumber;

										binTransferFlag = woutility.woBinTransfer(invtransferObj, binTransfer);
									}
								}
								binTransferId = binTransfer.save();

								// No Code Solution Changes begin here
								impactedRecords = woutility.noCodeSolForWO(recordIdPick, transactionInternalId, false, binTransferId);
								log.debug({
									title: 'impactedRecords :',
									details: impactedRecords
								});
								wostageBinDetailsObj.impactedRecords = impactedRecords;
								//No Code Solution ends here.

								if (utility.isValueValid(binTransferId)) {
									if (opentaskSearchResultsPick.length > 50) {
										var mapReducetask = task.create({
											taskType: task.TaskType.MAP_REDUCE
										});
										mapReducetask.scriptId = 'customscript_wms_mr_wo_staging';
										mapReducetask.params = {
											"custscript_wms_mr_wointernalid": transactionInternalId,
											"custscript_wms_mr_stagebininternalid": stageBinInternalId,
											"custscript_wms_mr_bintransferid": binTransferId,
											"custscript_wms_mr_warehouselocationid": warehouseLocationId,
											"custscript_wms_mr_itemid": vnFetchedItemId,
											"custscript_wms_mr_quantity": Number(Big(vnenterQty).toFixed(8)),
											"custscript_wms_mr_frombinid": vnbinInternalId,
											"custscript_wms_mr_fromstatus": vInvStatus,
											"custscript_wms_mr_tostatus": vInvStatus
										};
										log.audit('mapReducetask', mapReducetask);
										mapReducetask.submit(); // Calling scheduler for large data set processing			
										utility.updateScheduleScriptStatus('Workorder Stagebin Update Mapreduce', runtime.getCurrentUser().id, 'Submitted',
											transactionInternalId);
										wostageBinDetailsObj.isMapReduceInvoke = 'T';
									} else {
										for (var openTaskRes = 0; openTaskRes < opentaskSearchResultsPick.length; openTaskRes++) {
											woutility.updateOpenTaskInWOStaging(opentaskSearchResultsPick[openTaskRes], binTransferId, stageBinInternalId);
										}
										var opentaskObj = {};
										opentaskObj.warehouseLocationId = warehouseLocationId;
										opentaskObj.itemId = vnFetchedItemId;
										opentaskObj.vnenterQty = Number(Big(vnenterQty).toFixed(8));
										opentaskObj.fromBinId = vnbinInternalId;
										opentaskObj.toBinId = stageBinInternalId;
										opentaskObj.inventoryCountId = binTransferId;
										opentaskObj.taskType = "MOVE";
										opentaskObj.soInternalId = vnWoInternalId;
										opentaskObj.fromStatus = vInvStatus;
										opentaskObj.toStatus = vInvStatus;
										woutility.updateMoveOpenTask(opentaskObj);
									}
									wostageBinDetailsObj.stageBinName = binName;
									wostageBinDetailsObj.stageBinInternalId = stageBinInternalId;
									wostageBinDetailsObj.isValid = true;
									wostageBinDetailsObj.showNextPickTaskButton = woutility.showNextPickTaskButton(transactionName, warehouseLocationId, transactionInternalId, workorderOverpickingFlag);
								} else {
									wostageBinDetailsObj.errorMessage = translator.getTranslationString("WORKORDER_PICKING.ERROR_BINTRANSFER");
									wostageBinDetailsObj.isValid = false;
								}
							} else {
								wostageBinDetailsObj.errorMessage = translator.getTranslationString("WORKORDER_PICKING.NO_STAGING_ITEM");
								wostageBinDetailsObj.isValid = false;
							}
						} else {
							wostageBinDetailsObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDSTAGEBIN");
							wostageBinDetailsObj.isValid = false;
						}
					} else {
						wostageBinDetailsObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDSTAGEBIN");
						wostageBinDetailsObj.isValid = false;
					}
				} else {
					wostageBinDetailsObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDSTAGEBIN");
					wostageBinDetailsObj.isValid = false;
				}
			} catch (e) {
				wostageBinDetailsObj.isValid = false;
				wostageBinDetailsObj.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}
			return wostageBinDetailsObj;
		}
		return {
			'post': doPost
		};
	});