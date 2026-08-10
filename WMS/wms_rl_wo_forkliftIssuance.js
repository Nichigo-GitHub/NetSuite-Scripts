/**
 *    Copyright  2023, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record', 'N/search', './wms_utility', './wms_translator'],

	function (record, search, utility, translator) {
		function doPost(requestBody) {

			var orderDetails = {};
			var requestParams = '';
			try {
				if (utility.isValueValid(requestBody)) {

					var requestParams = requestBody.params;
					var warehouseLocationId = requestParams.warehouseLocationId;
					var transactionName = requestParams.transactionName;
					var undo = requestParams.undo;
					var issued = requestParams.issued;
					var message = requestParams.message;
					log.debug({
						title: 'requestParams',
						details: requestParams
					});
					if (utility.isValueValid(warehouseLocationId)) {
						if (utility.isValueValid(transactionName)) {
							var workOrdDtlResults = this.workOrderValidate(transactionName, warehouseLocationId);
							if (workOrdDtlResults.length > 0) {
								var woInternalid = workOrdDtlResults[0].internalid;
								var quantity = workOrdDtlResults[0].quantity;
								log.debug({
									title: 'quantity',
									details: quantity
								});
								if (utility.isValueValid(woInternalid)) {
									try {
										var openTaskSearch = search.create({
											type: 'customrecord_wmsse_trn_opentask',
											filters: [
												['custrecord_wmsse_order_no', 'anyof', woInternalid],
												'AND',
												['custrecord_wmsse_tasktype', 'is', '9']
											],
											columns: [
												'custrecord_wmsse_nsconfirm_ref_no'
											]
										});

										var list = [];

										openTaskSearch.run().each(function (result) {
											var binTransferId = result.getValue({
												name: 'custrecord_wmsse_nsconfirm_ref_no'
											});

											if (!binTransferId)
												return true;

											var binTransfer = record.load({
												type: record.Type.BIN_TRANSFER,
												id: binTransferId,
												isDynamic: false
											});

											var lineCount = binTransfer.getLineCount({
												sublistId: 'inventory'
											});

											for (var i = 0; i < lineCount; i++) {
												var itemName = binTransfer.getSublistText({
													sublistId: 'inventory',
													fieldId: 'item',
													line: i
												});

												var itemDescription = binTransfer.getSublistText({
													sublistId: 'inventory',
													fieldId: 'description',
													line: i
												});

												var quantity = binTransfer.getSublistValue({
													sublistId: 'inventory',
													fieldId: 'quantity',
													line: i
												});

												log.debug('Bin Transfer Line', {
													itemName: itemName,
													quantity: quantity,
													itemDescription: itemDescription
												});

												try {
													var inventoryDetail = binTransfer.getSublistSubrecord({
														sublistId: 'inventory',
														fieldId: 'inventorydetail',
														line: i
													});

													var assignmentCount = inventoryDetail.getLineCount({
														sublistId: 'inventoryassignment'
													});

													for (var j = 0; j < assignmentCount; j++) {
														var fromBinText = inventoryDetail.getSublistText({
															sublistId: 'inventoryassignment',
															fieldId: 'binnumber',
															line: j
														});

														var assignQty = inventoryDetail.getSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'quantity',
															line: j
														});

														if (j == 0) {
															list.push({
																item: itemName,
																itemdesc: itemDescription,
																quantity: quantity,
																binText: fromBinText,
																binQty: assignQty
															});
														} else {
															if (list[list.length - 1].item === itemName) {
																list.push({
																	item: '',
																	itemdesc: '',
																	quantity: '',
																	binText: fromBinText,
																	binQty: assignQty
																});
															}
														}
													}

												} catch (e) {
													log.debug('Inventory Detail Error', e);
												}
											}

											return true;
										});

										var assemblyBuildSearch = search.create({
											type: search.Type.ASSEMBLY_BUILD,
											filters: [
												['createdfrom', 'anyof', woInternalid]
											],
											columns: [
												'internalid'
											]
										});

										var result = assemblyBuildSearch.run().getRange({
											start: 0,
											end: 1
										});

										log.debug({
											title: 'Assembly Build Search Result',
											details: result
										});

										if (result.length > 0) {
											var assemblyBuildId = result[0].getValue('internalid');

											var assemblyBuild = record.load({
												type: record.Type.ASSEMBLY_BUILD,
												id: assemblyBuildId,
												isDynamic: true
											});
										}

										if (!issued) {
											var issued = assemblyBuild.getValue({
												fieldId: 'custbody556'
											});
										}

										log.debug({
											title: 'issued',
											details: issued
										});
										log.debug({
											title: 'undo',
											details: undo
										});

										if (issued == false && undo == true) {
											orderDetails.errorMessage = 'Work Order: ' + transactionName + ' has already been unissued.';
											orderDetails.isValid = false;

											orderDetails.transactionInternalId = workOrdDtlResults[0].internalid;
											orderDetails.transactionName = workOrdDtlResults[0].tranid;
										} else if (issued == true && undo == false) {
											orderDetails.errorMessage = 'Work Order: ' + transactionName + ' has already been issued.';
											orderDetails.isValid = false;

											orderDetails.transactionInternalId = workOrdDtlResults[0].internalid;
											orderDetails.transactionName = workOrdDtlResults[0].tranid;
										} else {
											if (issued == false && undo == false) {
												assemblyBuild.setValue({
													fieldId: 'custbody556',
													value: true
												});

												var issuedDate = new Date();
												issuedDate.setDate(issuedDate.getDate() + 1);

												assemblyBuild.setValue({
													fieldId: 'custbody557',
													value: issuedDate
												});

												orderDetails.message = "Work Order: " + workOrdDtlResults[0].tranid + " Issuance has been completed successfully.";

												assemblyBuild.save();
											} else if (issued == true && undo == true) {
												assemblyBuild.setValue({
													fieldId: 'custbody556',
													value: false
												});

												assemblyBuild.setValue({
													fieldId: 'custbody557',
													value: null
												});

												orderDetails.message = "Work Order: " + workOrdDtlResults[0].tranid + " Issuance has been undone successfully.";

												assemblyBuild.save();
											}

											var orderDetails = {
												list: list
											};

											if (!message) {
												if (issued == false && undo == false) {
													orderDetails.message = "Work Order: " + workOrdDtlResults[0].tranid + " Issuance has been completed successfully.";
													orderDetails.undo = false;
												} else if (issued == true && undo == true) {
													orderDetails.message = "Work Order: " + workOrdDtlResults[0].tranid + " Issuance has been undone successfully.";
													orderDetails.undo = true;
												}
											}

											orderDetails.transactionInternalId = workOrdDtlResults[0].internalid;
											orderDetails.transactionName = workOrdDtlResults[0].tranid;
											orderDetails.issued = issued;
											orderDetails.isValid = true;
										}
									} catch (e) {
										log.error({
											title: 'Error loading Work Order record',
											details: e.message
										});
										return {
											error: e.message
										};
									}
								} else {
									orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
									orderDetails.isValid = false;
								}
							} else {
								orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
								orderDetails.isValid = false;
							}
						} else {
							orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
							orderDetails.isValid = false;
						}

					} else {
						orderDetails.errorMessage = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						orderDetails.isValid = false;
					}
				} else {
					orderDetails.isValid = false;
				}

			} catch (e) {
				orderDetails.isValid = false;
				orderDetails.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
			}
			log.debug('orderDetails', orderDetails);

			return orderDetails;
		}

		function workOrderValidate(workOrdernumber, warehouseLocationId) {
			var workOrdDtlSearch = search.load({
				id: 'customsearch_wmsse_woassembly_woscan_s_3'
			});

			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'tranid',
					operator: search.Operator.ANYOF,
					values: workOrdernumber
				})
			);
			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				})
			);
			var workOrdDtlResults = utility.getSearchResultInJSON(workOrdDtlSearch);
			log.debug('workOrdDtlResults', workOrdDtlResults);
			return workOrdDtlResults;
		}
		return {
			'post': doPost,
			workOrderValidate: workOrderValidate
		};
	});