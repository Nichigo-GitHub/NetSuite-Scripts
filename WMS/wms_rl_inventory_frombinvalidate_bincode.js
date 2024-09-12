/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/log', 'N/search', './wms_utility', './big', './wms_translator', './wms_tallyScan_utility'],
	/**
	 * @param {search} search
	 */
	function (log, search, utility, Big, translator, tallyScanUtility) {


		function doPost(requestBody) {

			var fromBinValidate = {};
			var fromBinName = '';
			var getStockConversionRate = '';
			var preferedBinName = '';
			var warehouseLocationId = '';
			var itemType = '';
			var itemInternalId = '';
			var unitType = '';
			var makeInvtAvailableFlag = '';
			var processType = '';
			var debugString = '';
			var processNameFromState = '';
			var barcodeQuantity = '';
			try {
				if (utility.isValueValid(requestBody)) {
					var requestParams = requestBody.params;
					debugString = debugString + " requestParams:" + requestParams;
					fromBinName = requestParams.fromBinName;
					getStockConversionRate = requestParams.stockConversionRate;
					preferedBinName = requestParams.preferedBinName;
					warehouseLocationId = requestParams.warehouseLocationId;
					itemType = requestParams.itemType;
					itemInternalId = requestParams.itemInternalId;
					unitType = requestParams.unitType;
					makeInvtAvailableFlag = requestParams.makeInvtAvailableFlag;
					processType = requestParams.processType;
					barcodeQuantity = requestParams.barcodeQuantity;
					itemAliasUnit = requestParams.itemAliasUnit;
					log.error({
						title: 'requestParams1',
						details: requestParams
					});

					processNameFromState = requestParams.processNameFromState;
					var fromBinNumber = '';

					if (utility.isValueValid(fromBinName) && utility.isValueValid(warehouseLocationId) &&
						utility.isValueValid(itemType) && utility.isValueValid(itemInternalId)) {
						if (!(utility.isValueValid(getStockConversionRate)))
							getStockConversionRate = 1;

						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

						if (!(utility.isValueValid(fromBinName)) && (utility.isValueValid(preferedBinName)) && (processType != 'replen')) {
							fromBinName = preferedBinName;
						}

						if (utility.isValueValid(fromBinName)) {
							var binInternalId = '';
							var binSearchResults = '';
							var binSearchFilters = '';
							var binSearchResultsvalues = '';

							if (processType == 'replen') {

								binSearchResults = search.load({
									id: 'customsearch_wmsse_guireplen_binsrh'
								});
								binSearchFilters = binSearchResults.filters;

								if (utility.isValueValid(fromBinName)) {
									binSearchFilters.push(search.createFilter({
										name: 'custrecord_bin_code',
										operator: search.Operator.IS,
										values: fromBinName
									}));
								}
								if (utility.isValueValid(warehouseLocationId)) {
									binSearchFilters.push(search.createFilter({
										name: 'location',
										operator: search.Operator.ANYOF,
										values: warehouseLocationId
									}));
								}
								binSearchResults.filters = binSearchFilters;
								binSearchResultsvalues = binSearchResults.run().getRange({
									start: 0,
									end: 1000
								});
								log.error({
									title: 'binSearchResultsvalues',
									details: binSearchResultsvalues
								});
								if (utility.isValueValid(binSearchResultsvalues)) {
									binInternalId = binSearchResultsvalues[0].id;
									fromBinNumber = binSearchResultsvalues[0].getValue({
										name: 'custrecord_bin_code'
									});

								}
								log.error({
									title: 'binInternalId',
									details: binInternalId
								});
								log.error({
									title: 'preferedBinName',
									details: preferedBinName
								});
								log.error({
									title: 'fromBinName',
									details: fromBinName
								});
								if ((!(utility.isValueValid(binInternalId))) || (fromBinName == preferedBinName)) {
									fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
									fromBinValidate.isValid = false;
									binInternalId = '';
								}
							} else {
								var stageLocArr = [];
								var BinlocationSearch = search.create({
									type: 'customlist_wmsse_bin_loc_type',
									columns: [{
										name: 'name'
									}]
								});
								var BinlocationTypes = BinlocationSearch.run().getRange({
									start: 0,
									end: 1000
								});
								if (BinlocationTypes != null && BinlocationTypes != '' && BinlocationTypes.length > 0) {
									var stgTypeArr = [];
									stgTypeArr.push('Stage');
									if (processType == "BinTransfer") {
										stgTypeArr.push('WIP');
									}
									stageLocArr = utility.getStageLocations(stgTypeArr, BinlocationTypes);
								}
								if (processType == 'putAway') {
									binSearchResults = search.load({
										id: 'customsearch_wmsse_binnumbers'
									});
									binSearchFilters = binSearchResults.filters;

									if (utility.isValueValid(fromBinName)) {
										binSearchFilters.push(search.createFilter({
											name: 'custrecord_bin_code',
											operator: search.Operator.IS,
											values: fromBinName
										}));
									}
									if (utility.isValueValid(processType) && processType == 'putAway') {
										binSearchFilters.push(search.createFilter({
											name: 'custrecord_wms_iscart',
											operator: search.Operator.IS,
											values: false
										}));
									}
									binSearchFilters.push(search.createFilter({
										name: 'inactive',
										operator: search.Operator.IS,
										values: false
									}));
									if (utility.isValueValid(warehouseLocationId)) {
										binSearchFilters.push(search.createFilter({
											name: 'location',
											operator: search.Operator.ANYOF,
											values: warehouseLocationId
										}));
									}
									binSearchResults.filters = binSearchFilters;
									binSearchResultsvalues = binSearchResults.run().getRange({
										start: 0,
										end: 1000
									});


									if (binSearchResultsvalues != null && binSearchResultsvalues != '' && binSearchResultsvalues.length > 0) {
										if (stageLocArr.indexOf(binSearchResultsvalues[0].getValue({
												name: 'custrecord_wmsse_bin_loc_type'
											})) == -1) {
											fromBinValidate.errorMessage = translator.getTranslationString('BINPUTW_FROM_BINVALIDATE.NOTSTAGE');
											fromBinValidate.isValid = false;

										} else if (binSearchResultsvalues[0].getValue({
												name: 'custrecord_wmsse_bin_stg_direction'
											}) != 1) {
											fromBinValidate.errorMessage = translator.getTranslationString('BINPUTW_FROM_BINVALIDATE.INBOUNDSTAGE_BIN');
											fromBinValidate.isValid = false;
										} else {

											binInternalId = binSearchResultsvalues[0].id;
											fromBinNumber = binSearchResultsvalues[0].getValue({
												name: 'custrecord_bin_code'
											});

										}

									}

									if (!(utility.isValueValid(binInternalId)) && binSearchResultsvalues == "") {
										fromBinValidate.errorMessage = translator.getTranslationString('BINPUTW_FROM_BINVALIDATE.INVALIDSTAGE_BIN');
										fromBinValidate.isValid = false;
									}
								} else {
									binSearchResults = search.load({
										id: 'customsearch_wmsse_binnumbers'
									});
									binSearchFilters = binSearchResults.filters;
									//var binSearchFilters = [];
									if (utility.isValueValid(fromBinName)) {
										binSearchFilters.push(search.createFilter({
											name: 'custrecord_bin_code',
											operator: search.Operator.IS,
											values: fromBinName
										}));
									}
									binSearchFilters.push(search.createFilter({
										name: 'inactive',
										operator: search.Operator.IS,
										values: false
									}));
									if (utility.isValueValid(warehouseLocationId)) {
										binSearchFilters.push(search.createFilter({
											name: 'location',
											operator: search.Operator.ANYOF,
											values: warehouseLocationId
										}));
									}

									if (stageLocArr.length > 0) {
										stageLocArr.push('@NONE@');
										binSearchFilters.push(search.createFilter({
											name: 'custrecord_wmsse_bin_loc_type',
											operator: search.Operator.ANYOF,
											values: stageLocArr
										}));
										if (processType == "BinTransfer") {
											binSearchFilters.push(search.createFilter({
												name: 'custrecord_wmsse_bin_stg_direction',
												operator: search.Operator.ANYOF,
												values: ['@NONE@', '1', '2']
											}));
										} else {
											binSearchFilters.push(search.createFilter({
												name: 'custrecord_wmsse_bin_stg_direction',
												operator: search.Operator.ANYOF,
												values: ['@NONE@', '1']
											}));
										}
									}

									binSearchResults = binSearchResults.run().getRange({
										start: 0,
										end: 1000
									});
									//var binInternalId='';
									if (utility.isValueValid(binSearchResults)) {
										binInternalId = binSearchResults[0].id;
										fromBinNumber = binSearchResults[0].getValue({
											name: 'binnumber'
										});
									}

									if (!(utility.isValueValid(binInternalId))) {
										fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
										fromBinValidate.isValid = false;
									} else {
										if (binSearchResults[0].getText({
												name: 'custrecord_wmsse_bin_loc_type'
											}) == 'Stage' &&
											binSearchResults[0].getText({
												name: 'custrecord_wmsse_bin_stg_direction'
											}) == '') {
											binInternalId = '';
											fromBinValidate.errorMessage = translator.getTranslationString('BINPUTW_FROM_BINVALIDATE.INVALID_INPUT');
											fromBinValidate.isValid = false;
										} else if (binSearchResults[0].getText({
												name: 'custrecord_wmsse_bin_loc_type'
											}) == 'WIP' &&
											binSearchResults[0].getValue({
												name: 'custrecord_wms_mfg_picking'
											}) == false) {

											binInternalId = '';
											fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
											fromBinValidate.isValid = false;
										}
									}
								}
							}
							if (!(utility.isValueValid(binInternalId))) {

								//fromBinValidate['errorMessage'] = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
								fromBinValidate.isValid = false;
							} else {
								var objBinDetails = [];
								var vmakeInvAvailFlag = true;
								var vLocDetails = search.lookupFields({
									type: search.Type.LOCATION,
									id: warehouseLocationId,
									columns: ['makeinventoryavailable']
								});
								vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
								var availableQty = 0;
								var searchName = '';
								fromBinValidate.fromBinInternalId = binInternalId;
								log.error({
									title: 'itemType',
									details: itemType
								})
								if (itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
									if (inventoryStatusFeature) {
										searchName = 'customsearch_wmsse_invtbalance_invt_item';
										if (itemType == translator.getTranslationString("ITEMTYPE_INVT") || itemType == translator.getTranslationString("ITEMTYPE_INVT_ASSEMBLY")) {
											searchName = 'customsearch_wmsse_invtbalance_invt_item';
										} else if (itemType == translator.getTranslationString("ITEMTYPE_SERIAL") || itemType == translator.getTranslationString("ITEMTYPE_SERIAL_ASSEMBLY")) {
											searchName = 'customsearch_wmsse_invtbalance_serialsrh';
										}

										objBinDetails = getItemWiseInventoryDetailswithInvStatusEnable(searchName, itemInternalId, binInternalId, warehouseLocationId, makeInvtAvailableFlag);
									} else {
										objBinDetails = getItemWiseInventoryDetails(itemInternalId, warehouseLocationId, binInternalId);
									}
								} else {
									if (inventoryStatusFeature) {

										searchName = 'customsearch_wmsse_inventorybalance';
										objBinDetails = getItemWiseInventoryDetailswithInvStatusEnable(searchName, itemInternalId, binInternalId, warehouseLocationId, makeInvtAvailableFlag);

									} else {
										objBinDetails = getItemWiseLotsDetails(itemInternalId, warehouseLocationId, fromBinNumber, fromBinName, fromBinValidate);
									}
								}
								if (objBinDetails.length == 0) {
									fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
									fromBinValidate.isValid = false;
								} else {
									if (objBinDetails.length > 0) {
										var vBinQtyAvail = '';
										var vBinText = '';
										var statusId = '';
										if (itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {

											for (var objInvIndex in objBinDetails) {

												var status = '';
												if (inventoryStatusFeature) {
													if (vmakeInvAvailFlag == "T")
														vBinQtyAvail = objBinDetails[objInvIndex].available;
													else
														vBinQtyAvail = objBinDetails[objInvIndex].onhand;

													vBinText = objBinDetails[objInvIndex].binnumberText;
													statusId = objBinDetails[objInvIndex].status;
													status = objBinDetails[objInvIndex].statusText;
													if (processType == "inventoryStatusChange" && objBinDetails.length == 1) {
														fromBinValidate.statusInternalId = statusId;
														fromBinValidate.statusName = status;
													}

												} else {
													if (vmakeInvAvailFlag == true)
														vBinQtyAvail = objBinDetails[objInvIndex].quantityavailable;
													else
														vBinQtyAvail = objBinDetails[objInvIndex].quantityonhand;
													vBinText = objBinDetails[objInvIndex].binnumberText;
												}
												if (fromBinName != vBinText) {
													fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
													fromBinValidate.isValid = false;
												}
												if (vBinQtyAvail > 0) {
													availableQty = Big(availableQty).plus(vBinQtyAvail);
												}
											}
											//availableQty = Big(availableQty).minus(vOpenPickQty);
											log.error({
												title: 'availableQty',
												details: availableQty
											});

										} else {
											for (var objLotIndex in objBinDetails) {

												var vInvLot = '';
												if (inventoryStatusFeature == true) {
													if (vmakeInvAvailFlag == true)
														vBinQtyAvail = objBinDetails[objLotIndex].available;
													else
														vBinQtyAvail = objBinDetails[objLotIndex].onhand;

													vBinText = objBinDetails[objLotIndex].binnumberText;
													vInvLot = objBinDetails[objLotIndex].inventorynumber;


												} else {
													if (vmakeInvAvailFlag == true)
														vBinQtyAvail = objBinDetails[objLotIndex].quantityavailable;
													else
														vBinQtyAvail = objBinDetails[objLotIndex].quantityonhand;
													vBinText = objBinDetails[objLotIndex].binnumberText;
													vInvLot = objBinDetails[objLotIndex].inventorynumberText;


												}



												//vBinQtyAvail = Big(vBinQtyAvail).minus(vOpenPickQty);

												if (fromBinName != vBinText) {
													fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
													fromBinValidate.isValid = false;
												}

												if (vBinQtyAvail > 0) {
													availableQty = Big(availableQty).plus(vBinQtyAvail);
												}

											}
										}
										if (availableQty == 0 || availableQty < 0) {
											log.error({
												title: 'availqty',
												details: availableQty
											});
											fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
											fromBinValidate.isValid = false;
										}
									}
								}
								if (objBinDetails.length > 0 && availableQty > 0) {
									fromBinValidate.fromBinName = fromBinNumber;
									fromBinValidate.availbleQuanity = Number(availableQty);
									fromBinValidate.lotAvailbleQuanity = Number(availableQty);
									if (objBinDetails.length > 1) {
										fromBinValidate.showTransferAllBtn = "Y";
										if (itemType == "inventoryitem" || itemType == "assemblyitem" ||
											itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
											fromBinValidate.showInvStatusPage = "Y";
										}
									} else {
										fromBinValidate.showTransferAllBtn = "N";
										if (itemType == "inventoryitem" || itemType == "assemblyitem" ||
											itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
											fromBinValidate.showInvStatusPage = "N";
										}
									}
									fromBinValidate.isValid = true;
									fromBinValidate.itemInternalId = itemInternalId;
									fromBinValidate.unitType = unitType;
									fromBinValidate.getStockConversionRate = getStockConversionRate;
									fromBinValidate.itemType = itemType;
									fromBinValidate.warehouseLocationId = warehouseLocationId;
									fromBinValidate.processNameFromState = processNameFromState;
									fromBinValidate = tallyScanUtility.isTallyScanEnabled(fromBinValidate, '');
									if (fromBinValidate.isTallyScanRequired) {
										if (utility.isValueValid(itemAliasUnit)) {
											barcodeQuantity = [{
												'value': '1',
												'unit': itemAliasUnit
											}];
										} else if (utility.isValueValid(barcodeQuantity)) {
											barcodeQuantity = [{
												'value': '1',
												'unit': barcodeQuantity[0].unit
											}];
										} else {
											barcodeQuantity = [{
												'value': '1',
												'unit': fromBinValidate.barcodeQuantity[0].unit
											}];
										}
									}
									fromBinValidate.barcodeQuantity = barcodeQuantity;
									log.error('return fromBinValidate', fromBinValidate);
								}
							}
						} else {
							fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
							fromBinValidate.isValid = false;
						}
					} else {
						fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
						fromBinValidate.isValid = false;
					}
				} else {
					fromBinValidate.errorMessage = translator.getTranslationString('BINTRANSFER_FROMBINVALIDATE.INVALID_INPUT');
					fromBinValidate.isValid = false;
				}
			} catch (e) {
				fromBinValidate.isValid = false;
				fromBinValidate.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}
			return fromBinValidate;
		}

		function getItemWiseInventoryDetails(ItemInternalId, strLocation, vBinId) {
			var searchObj = search.load({
				id: 'customsearch_wmsse_itemwise_inventory'
			});

			if (utility.isValueValid(ItemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: ItemInternalId
				}));
			}
			if (utility.isValueValid(strLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (utility.isValueValid(vBinId)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_bin_code',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: vBinId
				}));
			}
			var alltaskresults = utility.getSearchResultInJSON(searchObj);
			return alltaskresults;
		}

		function getItemWiseLotsDetails(ItemInternalId, strLocation, vBinId, fromBinName, fromBinValidate) {
			var searchObj = search.load({
				id: 'customsearch_wmsse_itemwise_lots'
			});

			if (utility.isValueValid(ItemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: ItemInternalId
				}));
			}
			if (utility.isValueValid(strLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (utility.isValueValid(vBinId)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ANYOF,
					values: vBinId
				}));
			}

			var alltaskresults = utility.getSearchResultInJSON(searchObj);
			return alltaskresults;
		}

		function getItemWiseInventoryDetailswithInvStatusEnable(searchName, itemInternalId, binInternalId, WhLocation, makeInvtAvailableFlag) {

			var searchObj = search.load({
				id: searchName,
				type: search.Type.INVENTORY_BALANCE
			});

			if (utility.isValueValid(WhLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: WhLocation
				}));
			}
			if (utility.isValueValid(itemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'internalid',
					join: 'item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
			}
			if (utility.isValueValid(binInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_bin_code',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			searchObj.filters.push(search.createFilter({
				name: 'available',
				operator: search.Operator.GREATERTHAN,
				values: 0
			}));

			if (utility.isValueValid(makeInvtAvailableFlag)) {
				if (makeInvtAvailableFlag == 'T' || makeInvtAvailableFlag == 'F') {
					searchObj.filters.push(search.createFilter({
						name: 'inventoryavailable',
						join: 'inventorystatus',
						operator: search.Operator.IS,
						values: makeInvtAvailableFlag
					}));
				} else {
					if (makeInvtAvailableFlag != 'All') {
						searchObj.filters.push(search.createFilter({
							name: 'status',
							operator: search.Operator.ANYOF,
							values: makeInvtAvailableFlag
						}));
					}
				}
			}

			var alltaskresults = utility.getSearchResultInJSON(searchObj);
			return alltaskresults;
		}
		return {
			'post': doPost
		};

	});