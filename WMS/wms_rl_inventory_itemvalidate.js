/**
 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './big', './wms_translator', 'N/record', './wms_inventory_utility', './wms_tallyScan_utility'],
	/**
	 * @param {search} search
	 */
	function (search, utility, Big, translator, record, invtUtility, tallyScanUtility) {

		/**
		 * This function is to validate the scanned item
		 *
		 */
		function doPost(requestBody) {

			var itemDetails = {};
			var txtItem = '';
			var warehouseLocationId = '';
			var binInternalId = '';
			var requestParams = '';
			var processNameFromState = '';
			var useItemLevelTallyScan = '';
			var processType = '';
			var warehouseLocationName = '';
			var availableQty = '';
			try {
				if (utility.isValueValid(requestBody)) {
					requestParams = requestBody.params;
					txtItem = requestParams.txtItem;
					warehouseLocationId = requestParams.warehouseLocationId;
					binInternalId = requestParams.binInternalId;
					processType = requestParams.processType;
					warehouseLocationName = requestParams.warehouseLocationName;
					processNameFromState = requestParams.processNameFromState;

					log.debug({
						title: 'requestParams',
						details: requestParams
					});
					if (utility.isValueValid(txtItem) && utility.isValueValid(warehouseLocationId)) {
						if (utility.isValueValid(txtItem)) {
							var currItem = utility.itemValidationForInventoryAndOutBound(txtItem, warehouseLocationId);
							if (utility.isValueValid(currItem.itemInternalId) || utility.isValueValid(currItem.barcodeIteminternalid)) {

								var itemInternalid = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
								itemDetails.itemName = ((currItem.itemName) ? (currItem.itemName) : currItem.barcodeItemname);

								if (utility.isValueValid(itemInternalid)) {

									var useBins = false;
									itemDetails.itemInternalId = itemInternalid;

									var columnArray = [];
									columnArray.push('unitstype');
									columnArray.push('stockunit');
									columnArray.push('recordtype');
									columnArray.push('usebins');
									columnArray.push('custitem_wms_usetallyscan');

									var itemLookUp = utility.getItemFieldsByLookup(itemInternalid, columnArray);
									if (itemLookUp.usebins != undefined) {
										useBins = itemLookUp.usebins;
										useItemLevelTallyScan = itemLookUp.custitem_wms_usetallyscan;
									}

									var locationUseBinlFlag = '';

									var columnlocationlookupArray = [];
									columnlocationlookupArray.push('usesbins');

									var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId, columnlocationlookupArray);

									if (locationLookUp.usesbins != undefined) {
										locationUseBinlFlag = locationLookUp.usesbins;
									}

									if (locationUseBinlFlag == true && useBins == false) {
										itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.USEBIN_FLAG');
										itemDetails.isValid = false;
									} else {
										var searchName = 'customsearch_wms_inventorybalance_getqty';

										var objBinDetails = this.getInventoryForScannedBin(searchName, warehouseLocationId, itemInternalid, binInternalId);
										log.debug({
											title: 'objBinDetails',
											details: objBinDetails
										});
										if (objBinDetails.length > 0) {
											var unitTypeVar = '';
											var stockUnitName = '';
											var itemType = '';
											var stockConversionRate = '';
											var stockUnitId = '';
											var dblTotbinAvailQty = 0;
											var binAvailQty = 0;
											for (var p = 0; p < objBinDetails.length; p++) {
												binAvailQty = objBinDetails[p].available;
												if (binAvailQty == null || binAvailQty == '')
													binAvailQty = 0;
												dblTotbinAvailQty = Big(dblTotbinAvailQty).plus(binAvailQty);
												/*if(dblTotbinAvailQty > 0)
												{
													break;
												}*/
											}
											if (parseFloat(dblTotbinAvailQty) > 0) {
												if (itemLookUp.thumbnailurl != undefined) {
													itemDetails.imageUrl = itemLookUp.thumbnailurl;
												}
												if (itemLookUp['unitstype'][0] != undefined &&
													itemLookUp['unitstype'][0] != 'undefined') {
													unitTypeVar = itemLookUp['unitstype'][0].value;
													stockUnitName = itemLookUp['stockunit'][0].text;
													stockUnitId = itemLookUp['stockunit'][0].value;
													itemDetails.unitType = unitTypeVar;
													itemDetails.stockUnitName = stockUnitName;
													stockConversionRate = invtUtility.getOpenTaskStockCoversionRate(unitTypeVar, stockUnitName);
												}
												itemDetails.stockConversionRate = stockConversionRate;
												itemDetails.stockUnitName = stockUnitName;
												itemDetails.stockUnitId = stockUnitId;
												if (itemLookUp.recordtype != undefined) {
													itemType = itemLookUp.recordtype;
												}
												itemDetails.itemType = itemType;
												var unitTypeIdNum = unitTypeVar;

												itemDetails = utility.addItemDatatoResponse(itemDetails, currItem, unitTypeIdNum, stockUnitName);

												itemDetails.availableQty = Number(dblTotbinAvailQty);
												itemDetails.isValid = true;
												log.debug('itemType', itemType);
												log.debug('dblTotbinAvailQty', dblTotbinAvailQty);
												log.debug('objBinDetails.length', objBinDetails.length);
												if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
													if (objBinDetails.length > 1) {
														itemDetails.showTransferAllBtn = "Y";
													} else {
														itemDetails.showTransferAllBtn = "N";
													}

												}
												var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
												if (inventoryStatusFeature && processType == "inventoryStatusChange") {
													var invStatusCount = invtUtility.getInventoryStatusList();
													if (invStatusCount.length > 0 && invStatusCount.length == 1) {
														itemDetails.errorMessage = translator.getTranslationString('STATUSCHANGE_ITEMVALIDATE.ONLYONE_STATUS');
														itemDetails.isValid = false;
													} else {
														if (locationUseBinlFlag == false) {
															itemDetails.warehouseLocationName = warehouseLocationName;

															if (itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" ||
																itemType == "serializedassemblyitem") {
																var inventoryStatusDetails = {};
																inventoryStatusDetails = invtUtility.itemInventoryDetailsforNoBins(itemType, warehouseLocationId, itemInternalid);
																log.debug('inventoryStatusDetails', inventoryStatusDetails);
																if (utility.isValueValid(inventoryStatusDetails)) {
																	itemDetails.statusInternalId = inventoryStatusDetails.statusInternalId;
																	itemDetails.statusName = inventoryStatusDetails.statusName;
																	itemDetails.availbleQuanity = Number(inventoryStatusDetails.locAvailableQty);
																	itemDetails.showInvStatusPage = inventoryStatusDetails.showInvStatusPage;

																}
															}

														}
													}
												}
												itemDetails.unitType = unitTypeVar;
												itemDetails.availbleQuanity = Number(dblTotbinAvailQty);
												itemDetails.getStockConversionRate = stockConversionRate;
												itemDetails.itemType = itemType;
												itemDetails.warehouseLocationId = warehouseLocationId;
												itemDetails.processNameFromState = processNameFromState;
												if (utility.isValueValid(processNameFromState)) {
													itemDetails = tallyScanUtility.isTallyScanEnabled(itemDetails);
													if (itemDetails.isTallyScanRequired) {
														if (utility.isValueValid(itemDetails.barcodeQuantity) && utility.isValueValid(itemDetails.custrecord_wms_alias_unit)) {
															itemDetails.barcodeQuantity = [{
																'value': '1',
																'unit': itemDetails.custrecord_wms_alias_unit
															}];
														}
													}
												}
											} else {
												itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.NO_INVENTORY');
												itemDetails.isValid = false;
											}
										} else {
											if (utility.isValueValid(binInternalId)) {
												itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.NO_INVENTORY');
											} else {
												itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.FROMBINLIST.INSUFFICIENTINVENTORY');
											}
											itemDetails.isValid = false;
										}

									}

								} else {
									itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
									itemDetails.isValid = false;
								}
							} else {
								var itemresults = this.getItemDetails(txtItem, warehouseLocationId);
								if (itemresults.length > 0) {
									if (itemresults[0].isinactive == true) {
										itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INACTIVE_ITEM');
										itemDetails.isValid = false;
									} else {
										itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
										itemDetails.isValid = false;
									}
								} else {
									if (utility.isValueValid(currItem.error)) {
										itemDetails.errorMessage = currItem.error;
									} else {
										itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
									}

									itemDetails.isValid = false;
								}
							}
						} else {
							itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_BINVALIDATE.EMPTY_INPUT');
							itemDetails.isValid = false;
						}
					} else {

						itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_BINVALIDATE.EMPTY_INPUT');
						itemDetails.isValid = false;
					}
				} else {
					itemDetails.errorMessage = translator.getTranslationString('BINTRANSFER_BINVALIDATE.EMPTY_INPUT');
					itemDetails.isValid = false;
				}
			} catch (e) {
				itemDetails.isValid = false;
				itemDetails.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
			}
			return itemDetails;
		}

		function getInventoryForScannedBin(searchName, warehouseLocationId, itemId, binInternalId) {

			var searchObj = search.load({
				id: searchName,
				type: search.Type.INVENTORY_BALANCE
			});

			if (utility.isValueValid(warehouseLocationId)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}
			searchObj.filters.push(search.createFilter({
				name: 'internalid',
				join: 'item',
				operator: search.Operator.ANYOF,
				values: itemId
			}));
			if (utility.isValueValid(binInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			var alltaskresults = utility.getSearchResultInJSON(searchObj);
			return alltaskresults;
		}

		function getItemDetails(getItem, warehouseLocationId) {
			var itemSearchDetails = search.load({
				id: 'customsearch_wmsse_inv_basic_itemdetails'
			});
			var cols = search.createColumn({
				name: 'isinactive'
			});
			itemSearchDetails.columns.push(cols);

			var filtersArr = itemSearchDetails.filters;
			filtersArr.push(
				search.createFilter({
					name: 'nameinternal',
					operator: search.Operator.IS,
					values: getItem
				}));
			if (utility.isValueValid(warehouseLocationId)) {
				filtersArr.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));
			}

			itemSearchDetails.filters = filtersArr;
			var alltaskresults = utility.getSearchResultInJSON(itemSearchDetails);
			return alltaskresults;
		}
		return {
			'post': doPost,
			getItemDetails: getItemDetails,
			getInventoryForScannedBin: getInventoryForScannedBin
		};

	});