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
										// Load the Work Order record by internal ID
										var workOrderRecord = record.load({
											type: record.Type.WORK_ORDER,
											id: woInternalid
										});

										// Get the value of the 'orderstatus' field
										var orderStatus = workOrderRecord.getValue({
											fieldId: 'orderstatus'
										});

										// Check if the current status is 'A' (Planned) and update it to 'B' (Released)
										if (orderStatus === 'A') {
											workOrderRecord.setValue({
												fieldId: 'orderstatus',
												value: 'B' // Set new status to 'B' (Released)
											});

											// Save the record to persist the changes
											workOrderRecord.save();

											// Reload the work order record after saving
											workOrderRecord = record.load({
												type: record.Type.WORK_ORDER,
												id: woInternalid
											});
										}

										var itemCount = workOrderRecord.getLineCount({
											sublistId: 'item'
										});
										var quantities = [];

										// Loop through each line item to get committed and backordered quantities
										for (var i = 0; i < itemCount; i++) {
											var item = {
												itemId: workOrderRecord.getSublistText({
													sublistId: 'item',
													fieldId: 'item',
													line: i
												}),
												itemDesc: workOrderRecord.getSublistValue({
													sublistId: 'item',
													fieldId: 'description',
													line: i
												}),
												committedQuantity: workOrderRecord.getSublistValue({
													sublistId: 'item',
													fieldId: 'quantitycommitted',
													line: i
												}),
												backOrderedQuantity: workOrderRecord.getSublistValue({
													sublistId: 'item',
													fieldId: 'quantitybackordered',
													line: i
												})
											};

											quantities.push(item);
										}

										var orderDetails = {
											quantities: quantities
										};

										var assemblyitem = workOrderRecord.getText({
											fieldId: 'assemblyitem'
										});

										var assemblyId = workOrderRecord.getValue({
											fieldId: 'assemblyitem'
										});

										var assemblyItemRecord = record.load({
											type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
											id: assemblyId
										});

										var componentCount = assemblyItemRecord.getLineCount({
											sublistId: 'member'
										});

										// Create an array to store assembly item components and quantities
										var assemblyComponents = [];
										for (var i = 0; i < componentCount; i++) {
											var component = {
												componentId: assemblyItemRecord.getSublistText({
													sublistId: 'member',
													fieldId: 'item',
													line: i
												}),
												componentQuantity: assemblyItemRecord.getSublistValue({
													sublistId: 'member',
													fieldId: 'quantity',
													line: i
												})
											};
											assemblyComponents.push(component);
										}

										var highestProduct = 0;
										var buildable = 0;

										// Loop through each item in workOrderRecord's quantities
										for (var i = 0; i < quantities.length; i++) {
											var workOrderItem = quantities[i];

											if (workOrderItem.backOrderedQuantity > 0) {
												// Loop through the assembly components and check if the item matches
												for (var j = 0; j < assemblyComponents.length; j++) {
													if (workOrderItem.itemId === assemblyComponents[j].componentId) {
														// Calculate the product of backordered quantity and assembly item quantity
														var product = workOrderItem.backOrderedQuantity * assemblyComponents[j].componentQuantity;

														// Check if this product is the highest one
														if (product > highestProduct) {
															highestProduct = product;
														}
													}
												}
											}
										}
										buildable = quantity - highestProduct;
										log.debug({
											title: 'buildable Quantity',
											details: buildable
										});

										if (buildable < 0)
											buildable = 0;

										orderDetails.transactionInternalId = workOrdDtlResults[0].internalid;
										orderDetails.transactionName = workOrdDtlResults[0].tranid;
										orderDetails.buildable = buildable;
										orderDetails.assemblyitem = assemblyitem;
										orderDetails.isValid = true;
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
				id: 'customsearch_wmsse_woassembly_woscan_s_2'
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