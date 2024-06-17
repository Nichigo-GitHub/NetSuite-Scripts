	/**
	 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
	 */

	/**
	 * @NApiVersion 2.x
	 * @NScriptType Restlet
	 * @NModuleScope Public
	 */
	define(['N/search', './wms_utility', './wms_translator', './big', 'N/format'],
		/**
		 * @param {search} search
		 */
		function (search, utility, translator, Big, format) {

			function doPost(requestBody) {

				var quantityDetails = {};
				var itemInternalId = '';
				var warehouseLocationId = '';
				var binInternalId = '';
				var processType = '';
				var itemType = '';
				var lotName = '';
				var unitType = '';
				var stockUnitName = '';
				var debugString = '';
				var statusList = [];
				var statusTable = [];
				var statusListArray = [];
				var lotListArray = [];
				var tempStatusIdListArray = [];
				var tempStatusTextListArray = [];
				var uomListObj = '';
				var stockConversionRate = '';
				var transactionUomConversionRate = '';
				var transactionUomName = '';
				var locUseBinsFlag = '';
				var binName = '';
				try {
					log.debug({
						title: 'requestParams',
						details: requestParams
					});
					if (utility.isValueValid(requestBody)) {

						var requestParams = requestBody.params;
						debugString = debugString + "requestParams" + requestParams;

						itemInternalId = requestParams.itemInternalId;
						warehouseLocationId = requestParams.warehouseLocationId;
						binInternalId = requestParams.binInternalId;
						processType = requestParams.processType;
						uomListObj = requestParams.uomListObj;
						stockConversionRate = requestParams.stockConversionRate;
						transactionUomConversionRate = requestParams.transactionUomConversionRate;
						transactionUomName = requestParams.transactionUomName;
						locUseBinsFlag = requestParams.locUseBinsFlag;
						binName = requestParams.binName;
						var selectedStatusdefaultvalue = requestParams.defaultvalue;
						var tallyScanSerialStatus = requestParams.tallyScanSerialStatus;
						var isTallyScanRequired = requestParams.isTallyScanRequired;
						var tallyLoopObject = requestParams.tallyLoopObj;



						log.debug({
							title: 'requestParams',
							details: requestParams
						});

						var selectedConversionRate = '';
						var selectedUOMText = '';
						var defaultInvStatus = '';

						if (utility.isValueValid(requestParams.uomList)) {
							var selectedUomList = requestParams.uomList;
							selectedConversionRate = selectedUomList.id;
							selectedUOMText = selectedUomList.value;
						}
						if (utility.isValueValid(requestParams.selectedRow)) {
							var selectedRow = requestParams.selectedRow;
							var stockConversionRate = requestParams.stockConversionRate;
							var remainingTallyQuantity = selectedRow.availableQuantity;
							var itemType = requestParams.itemType;
							quantityDetails.remainingQuantityForTallyScanLoop = remainingTallyQuantity;
							quantityDetails.selectedStatusName = selectedRow.statusText;
							quantityDetails.selectedStatusId = selectedRow.statusId;
							if (utility.isValueValid(stockConversionRate) && utility.isValueValid(itemType) &&
								(itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')) {

								quantityDetails.remainingQuantityForTallyScanLoop = parseFloat(Number(Big(remainingTallyQuantity).mul(stockConversionRate)).toFixed(5));
							}
							log.debug({
								title: 'selectedRow',
								details: selectedRow
							});

						} else {
							if ((utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId) &&
									utility.isValueValid(binInternalId)) ||
								(locUseBinsFlag == false && utility.isValueValid(itemInternalId))) {
								var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
								if (processType == 'putAway' || processType == 'inventoryTransfer' ||
									processType == 'binTransfer' || processType == 'picking' ||
									processType == 'inventoryStatusChange') {
									if (utility.isValueValid(binName)) {
										quantityDetails['binName'] = binName;
									}
									itemType = requestParams.itemType;
									lotName = requestParams.lotName;
									unitType = requestParams.unitType;
									vUnits = requestParams.vUnits;
									var inventoryDetailLotOrSerial = requestParams.inventoryDetailLotOrSerial;
									if (utility.isValueValid(inventoryDetailLotOrSerial)) {
										lotName = inventoryDetailLotOrSerial;
									}
									var uomResult = [];
									if (utility.isValueValid(unitType) && !utility.isValueValid(uomListObj)) {
										uomResult = utility.getUnitsType(unitType);
										log.debug('uomResult', uomResult);
									}
									if (uomResult.length > 0) {
										uomListObj = [];
										var serialItemStockUnitNameForTallyScan = "";
										for (var uomCnt in uomResult) {
											var rec = uomResult[uomCnt];
											var conversionRate = rec['conversionrate'];
											var unitName = rec['unitname'];
											var row = {
												'value': unitName,
												'id': conversionRate
											};
											uomListObj.push(row);
											if (!utility.isValueValid(stockConversionRate)) {
												if (utility.isValueValid(requestParams.stockUnitName)) {
													if (stockUnitName.toUpperCase() == unitName.toUpperCase()) {
														stockConversionRate = conversionRate;
													}
												}
											} else {
												if (utility.isValueValid(isTallyScanRequired) && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") &&
													stockConversionRate == conversionRate) {
													serialItemStockUnitNameForTallyScan = unitName;
												}
											}
										}
									}

									if (utility.isValueValid(requestParams.stockUnitName) || utility.isValueValid(requestParams.transactionUomName)) {
										stockUnitName = requestParams.stockUnitName;
										quantityDetails['uomList'] = uomListObj;
										if (processType == 'picking') {
											quantityDetails['uomDefaultStatus'] = transactionUomName;
										} else {
											quantityDetails['uomDefaultStatus'] = stockUnitName;
										}

									}

									if (!utility.isValueValid(requestParams.itemType) && processType == 'picking') {
										itemType = utility.getItemType(itemInternalId, warehouseLocationId);
									}
									var defaultStatusText = '';

									var lotInternalId = '';
									if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem" || itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && (utility.isValueValid(lotName))) {
										lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, itemInternalId);
									}
									log.debug({
										title: 'lotInternalId',
										details: lotInternalId
									});

									var objPutawayStatusDetails = getPutawayStatusDetailsInStageBin(itemInternalId, warehouseLocationId, binInternalId, lotInternalId, itemType, unitType, stockUnitName, processType, tallyScanSerialStatus);
									log.debug({
										title: 'objPutawayStatusDetails',
										details: objPutawayStatusDetails
									});
									if (objPutawayStatusDetails.length > 0) {
										defaultStatusText = objPutawayStatusDetails[0][0];
										for (var statusItr in objPutawayStatusDetails) {
											var objectStatus = {};
											var objectStatusTable = {};

											var objStatusRec = objPutawayStatusDetails[statusItr];

											if (itemType == "inventoryitem" || itemType == "assemblyitem") {
												var availableQty = objStatusRec[1];
												if (parseFloat(availableQty) > 0) {
													if (inventoryStatusFeature) {
														if (statusListArray.indexOf(objStatusRec[2]) == -1) {
															objectStatus['statusText'] = objStatusRec[0];
															objectStatus['statusId'] = objStatusRec[2];
															statusListArray.push(objStatusRec[2]);
														}
														objectStatusTable['statusText'] = objStatusRec[0];
														objectStatusTable['statusId'] = objStatusRec[2];
													}
													objectStatusTable['availableQuantityWithUOM'] = objStatusRec[1] + " " + stockUnitName;
													objectStatusTable['availableQuantity'] = objStatusRec[1];
													objectStatusTable['itemName'] = objStatusRec[3];
												}
											} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem" || itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
												var availableQty = objStatusRec[1];

												if (parseFloat(availableQty) > 0) {
													if (inventoryStatusFeature) {
														if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
															if ((lotListArray.indexOf(objStatusRec[4]) == -1) && (statusListArray.indexOf(objStatusRec[2]) == -1)) {
																objectStatus['statusText'] = objStatusRec[0];
																objectStatus['statusId'] = objStatusRec[2];
															} else if ((statusListArray.indexOf(objStatusRec[2]) == -1)) {
																objectStatus['statusText'] = objStatusRec[0];
																objectStatus['statusId'] = objStatusRec[2];
															}
														} else {
															if (statusListArray.indexOf(objStatusRec[2]) == -1) {
																objectStatus['statusText'] = objStatusRec[0];
																objectStatus['statusId'] = objStatusRec[2];
																statusListArray.push(objStatusRec[2]);
															}
														}
														objectStatusTable['statusText'] = objStatusRec[0];
														objectStatusTable['statusId'] = objStatusRec[2];
													}
													if (utility.isValueValid(isTallyScanRequired) && utility.isValueValid(serialItemStockUnitNameForTallyScan)) {
														objectStatusTable['availableQuantityWithUOM'] = objStatusRec[1] + " " + serialItemStockUnitNameForTallyScan;
													} else {
														objectStatusTable['availableQuantityWithUOM'] = objStatusRec[1] + " " + stockUnitName;
													}
													objectStatusTable['lotName'] = objStatusRec[4];
													objectStatusTable['lotExpiryDate'] = objStatusRec[5];
													if (utility.isValueValid(objStatusRec[6])) {
														objectStatusTable['lotCreateDate'] = objStatusRec[6].split(' ')[0];
													}

													objectStatusTable['itemName'] = objStatusRec[3];
													objectStatusTable['availableQuantity'] = objStatusRec[1];
												}
											}

											var qty = objectStatusTable['availableQuantity'];

											var currentConvRate = stockConversionRate;

											if (processType == 'picking') {

												var totalQty = 0;
												if (tallyLoopObject != undefined) {
													var type = requestParams.type;
													var tempObject = {};
													if (type == 'multiorder') {
														for (var obj in tallyLoopObject) {
															for (var status in tallyLoopObject[obj]) {
																var tqty = tallyLoopObject[obj][status].quantity;
																if (utility.isValueValid(transactionUomConversionRate) &&
																	utility.isValueValid(stockConversionRate) &&
																	(stockConversionRate != transactionUomConversionRate)) {
																	tqty = Number(Big(tqty).mul(transactionUomConversionRate));
																	tqty = Number(Big(tqty).div(stockConversionRate));

																}
																if (inventoryStatusFeature) {
																	var statusId = tallyLoopObject[obj][status].statusId;
																	if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
																		var lotName = tallyLoopObject[obj][status].lotName;
																		if (statusId == objectStatusTable['statusId'] && lotName == objectStatusTable['lotName']) {
																			totalQty = totalQty + tqty;
																		}
																	} else {
																		if (statusId == objectStatusTable['statusId']) {
																			totalQty = totalQty + tqty;
																		}
																	}
																} else {
																	if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
																		var lotName = tallyLoopObject[obj][status].lotName;
																		if (lotName == objectStatusTable['lotName']) {
																			totalQty = totalQty + tqty;
																		}
																	} else {
																		totalQty = totalQty + tqty;
																	}
																}

															}
														}
													} else {
														for (var obj in tallyLoopObject) {
															var tqty = tallyLoopObject[obj].quantity;
															if (utility.isValueValid(transactionUomConversionRate) &&
																utility.isValueValid(stockConversionRate) &&
																(stockConversionRate != transactionUomConversionRate)) {
																tqty = Number(Big(tqty).mul(transactionUomConversionRate));
															}
															if (inventoryStatusFeature) {
																var statusId = tallyLoopObject[obj].statusName;
																if (statusId == objectStatusTable['statusId']) {
																	totalQty = totalQty + tqty;
																}
															} else {
																totalQty = totalQty + tqty;
															}

														}
													}
													if (totalQty > 0) {

														qty = qty - totalQty;

														objectStatusTable['availableQuantity'] = qty;
														if (parseFloat(qty) > 0 &&
															utility.isValueValid(transactionUomConversionRate)) {
															objectStatusTable['availableQuantityWithUOM'] = qty + " " + transactionUomConversionRate;
														}
													}
												}
												//log.debug('qty before conv',qty);
												if (utility.isValueValid(selectedConversionRate) &&
													selectedConversionRate != stockConversionRate && qty > 0) {

													qty = utility.uomConversions(qty, selectedConversionRate, stockConversionRate);

													objectStatusTable['availableQuantity'] = qty;
													objectStatusTable['availableQuantityWithUOM'] = qty + " " + selectedUOMText;
												} else {

													if (utility.isValueValid(transactionUomConversionRate) &&
														utility.isValueValid(stockConversionRate) &&
														(stockConversionRate != transactionUomConversionRate) &&
														!utility.isValueValid(selectedConversionRate) && qty > 0) {

														qty = utility.uomConversions(qty, transactionUomConversionRate, stockConversionRate);

														//log.debug('qty after conv',qty);
														objectStatusTable['availableQuantity'] = qty;
														objectStatusTable['availableQuantityWithUOM'] = qty + " " + transactionUomName;
													}
												}

											} else {
												if (utility.isValueValid(currentConvRate) && utility.isValueValid(qty) && utility.isValueValid(selectedConversionRate) &&
													utility.isValueValid(selectedConversionRate) &&
													(selectedConversionRate != currentConvRate)) {
													qty = utility.uomConversions(qty, selectedConversionRate, currentConvRate);
													if (qty > 0) {
														objectStatusTable['availableQuantity'] = qty;
														objectStatusTable['availableQuantityWithUOM'] = qty + " " + selectedUOMText;
													}
												}
											}


											if (utility.isValueValid(objectStatus) && JSON.stringify(objectStatus) != '{}' && qty > 0) {
												statusList[statusList.length] = objectStatus;
												if (objectStatus.statusId == '1') { //to show default inv status in drop down of available statues
													defaultInvStatus = objectStatus.statusText;
												}
											}
											if ((utility.isValueValid(objectStatusTable) && JSON.stringify(objectStatusTable) != '{}' && qty > 0)) {
												statusTable[statusTable.length] = objectStatusTable;
												statusListArray.push(objStatusRec[2]);
											}

											lotListArray.push(objStatusRec[4]);
										}
										quantityDetails['status'] = statusList;
										quantityDetails['statusTable'] = statusTable;
										if (inventoryStatusFeature) {

											if (utility.isValueValid(selectedStatusdefaultvalue)) {

												quantityDetails.defaultvalue = selectedStatusdefaultvalue;
											} else {

												quantityDetails.defaultvalue = utility.isValueValid(defaultInvStatus) ? defaultInvStatus : defaultStatusText;
											}

										}
										quantityDetails['isValid'] = true;
										log.debug({
											title: 'statusTable',
											details: statusTable
										});
										log.debug({
											title: 'statusList',
											details: statusList
										});
									} else {
										quantityDetails['errorMessage'] = "There is no inventory Available";
										quantityDetails['isValid'] = false;
									}
								} else {
									if (inventoryStatusFeature) {
										var objStatusDetails = getItemWiseStatusDetailsInBin(itemInternalId, warehouseLocationId, binInternalId);
										var defaultStatusText = '';
										if (objStatusDetails.length > 0) {
											defaultStatusText = objStatusDetails[0]['statusText'];
											for (var statusItr in objStatusDetails) {
												var objectStatus = {};
												var objStatusRec = objStatusDetails[statusItr];
												objectStatus['statusText'] = objStatusRec['statusText'];
												objectStatus['statusId'] = objStatusRec['status'];
												statusList[statusList.length] = objectStatus;
												tempStatusIdListArray.push(objStatusRec['status']);
												tempStatusTextListArray.push(objStatusRec['statusText']);
											}
										} else {
											var defaultInvStatusObj = utility.getDefaultInvStatus();
											defaultStatusText = defaultInvStatusObj.name;
											var defaultStatusId = utility.isValueValid(defaultInvStatusObj.id) ? (defaultInvStatusObj.id).toString() : '';

											var objectStatus = {};
											objectStatus.statusText = defaultStatusText;
											objectStatus.statusId = defaultStatusId;
											statusList[statusList.length] = objectStatus;
											tempStatusIdListArray.push(defaultStatusId);
											tempStatusTextListArray.push(defaultStatusText);
										}
										var defStatusId = '1'; //default good
										var tempstatusIdIndex = tempStatusIdListArray.indexOf(defStatusId);
										quantityDetails['status'] = statusList;
										if (tempStatusIdListArray.indexOf(defStatusId) != -1) //if default value 1 found in array then it enters in if
										{
											if (utility.isValueValid(selectedStatusdefaultvalue)) {
												log.debug('if if for cyclecount', 'if');
												quantityDetails.defaultvalue = selectedStatusdefaultvalue;
											} else {

												log.debug('else else for cyclecount', 'else');
												quantityDetails['defaultvalue'] = tempStatusTextListArray[tempStatusIdListArray.indexOf(defStatusId)];
											}
										} else {
											quantityDetails['defaultvalue'] = defaultStatusText;
										}
									}
									quantityDetails['isValid'] = true;
								}
							} else {
								quantityDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_QUANTITY.EMPTY_INPUT');
								quantityDetails['isValid'] = false;
							}
						}
					} else {
						quantityDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_QUANTITY.EMPTY_INPUT');
						quantityDetails['isValid'] = false;
					}
				} catch (e) {
					quantityDetails['isValid'] = false;
					quantityDetails['errorMessage'] = e.message;
					log.error({
						title: 'errorMessage',
						details: e.message + " Stack :" + e.stack
					});
					log.error({
						title: 'debugString',
						details: debugString
					});
				}
				log.debug({
					title: 'quantityDetails',
					details: quantityDetails
				});
				return quantityDetails;
			}

			function getItemWiseStatusDetailsInBin(ItemInternalId, whLocationId, vBinId) {

				var searchObj = search.load({
					id: 'customsearch_wmsse_srchres_statuswise',
					type: search.Type.INVENTORY_BALANCE
				});

				if (utility.isValueValid(ItemInternalId)) {
					searchObj.filters.push(search.createFilter({
						name: 'item',
						operator: search.Operator.ANYOF,
						values: ItemInternalId
					}));
				}
				if (utility.isValueValid(whLocationId)) {
					searchObj.filters.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: whLocationId
					}));
				}
				if (utility.isValueValid(vBinId)) {
					searchObj.filters.push(search.createFilter({
						name: 'binnumber',
						operator: search.Operator.ANYOF,
						values: vBinId
					}));
				}
				var alltaskresults = utility.getSearchResultInJSON(searchObj);
				return alltaskresults;
			}

			function getPutawayStatusDetailsInStageBin(itemInternalId, warehouseLocationId, binInternalId, lotInternalId, itemType, unitType, stockUnitName, processType, tallyScanSerialStatus) {

				var objBinDetailsSearch = search.load({
					id: 'customsearch_wms_status_alltypesearchres',
					type: search.Type.INVENTORY_BALANCE
				});


				var filterStrat = objBinDetailsSearch.filters;

				if (utility.isValueValid(itemInternalId)) {
					log.debug({
						title: 'itemInternalId new',
						details: itemInternalId
					});
					filterStrat.push(search.createFilter({
						name: 'item',
						operator: search.Operator.ANYOF,
						values: itemInternalId
					}));
				}
				if (utility.isValueValid(warehouseLocationId)) {
					log.debug({
						title: 'warehouseLocationId new',
						details: warehouseLocationId
					});
					filterStrat.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: warehouseLocationId
					}));
				}

				if (utility.isValueValid(binInternalId)) {
					log.debug({
						title: 'binInternalId new',
						details: binInternalId
					});
					filterStrat.push(search.createFilter({
						name: 'binnumber',
						operator: search.Operator.ANYOF,
						values: binInternalId
					}));
				}
				log.debug({
					title: 'lotInternalId new',
					details: lotInternalId
				});
				if (utility.isValueValid(lotInternalId)) {

					filterStrat.push(search.createFilter({
						name: 'inventorynumber',
						operator: search.Operator.ANYOF,
						values: lotInternalId
					}));
				}
				if (utility.isValueValid(tallyScanSerialStatus)) {

					filterStrat.push(search.createFilter({
						name: 'status',
						operator: search.Operator.ANYOF,
						values: tallyScanSerialStatus
					}));
				}

				if (processType == 'picking' && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
					var systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?', warehouseLocationId);

					if (systemRule_AllowExpiredItems == 'N' || systemRule_AllowExpiredItems == '') {
						var currDate = utility.DateStamp();
						currDate = format.parse({
							value: currDate,
							type: format.Type.DATE
						});
						currDate = format.format({
							value: currDate,
							type: format.Type.DATE
						});

						var dateFormat = utility.DateSetting();
						var defalutExpiryDate = utility.setExpiryDate(dateFormat, '01', '01', '2199');
						filterStrat.push(search.createFilter({
							name: 'formuladate',
							operator: search.Operator.ONORAFTER,
							formula: "NVL({inventorynumber.expirationdate},TO_DATE('" + defalutExpiryDate + "','" + dateFormat + "'))",
							values: currDate
						}));
					}
				}

				objBinDetailsSearch.filters = filterStrat;
				var vStatusDetails = utility.getSearchResultInJSON(objBinDetailsSearch);

				var vStatusDetailsArr = [];

				log.debug({
					title: 'vStatusDetails',
					details: vStatusDetails
				});

				if (vStatusDetails.length > 0) {

					if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem" || itemType == "lotnumberedinventoryitem" ||
							itemType == "lotnumberedassemblyitem")) {
						var statusArr = [];
						var lotArr = [];

						for (var statusItr = 0; statusItr < vStatusDetails.length; statusItr++) {
							var status = vStatusDetails[statusItr]['statusText'];
							var vBinQtyAvail = vStatusDetails[statusItr]['available'];
							var statusId = vStatusDetails[statusItr]['status'];
							var inventoryNumber = vStatusDetails[statusItr]['inventorynumberText'];
							var itemName = vStatusDetails[statusItr]['itemText'];
							var expiryDate = vStatusDetails[statusItr]['expirationdate'];
							var datecreated = vStatusDetails[statusItr]['datecreated'];

							if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
								if (statusArr.indexOf(statusId) == -1) {
									var currRow = [status, vBinQtyAvail, statusId, itemName, inventoryNumber, expiryDate];
									statusArr.push(statusId);
									vStatusDetailsArr.push(currRow);
								} else {
									var indx = statusArr.indexOf(statusId);
									var Row = vStatusDetailsArr[indx];
									var qty = Row[1];
									var totalQty = Big(qty).plus(vBinQtyAvail);
									var currRow = [status, totalQty, statusId, itemName, inventoryNumber, expiryDate];
									vStatusDetailsArr[indx] = currRow;
								}
							} else {
								var currRow = [status, vBinQtyAvail, statusId, itemName, inventoryNumber, expiryDate, datecreated];
								lotArr.push(inventoryNumber);
								vStatusDetailsArr.push(currRow);
							}
						}
					} else {
						for (var statusItr = 0; statusItr < vStatusDetails.length; statusItr++) {
							var status = vStatusDetails[statusItr]['statusText'];
							var vBinQtyAvail = vStatusDetails[statusItr]['available'];
							var statusId = vStatusDetails[statusItr]['status'];
							var itemName = vStatusDetails[statusItr]['itemText'];


							var currRow = [status, vBinQtyAvail, statusId, itemName];
							vStatusDetailsArr.push(currRow);
						}
					}
				}
				return vStatusDetailsArr;
			}


			return {
				'post': doPost
			};

		});