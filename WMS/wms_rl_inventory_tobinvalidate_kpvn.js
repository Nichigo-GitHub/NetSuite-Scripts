/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope public
 */
define(['N/search', 'N/record', './wms_utility', './big', './wms_translator', './wms_inventory_utility_kpvn'],
	/**
	 * @param {search} search
	 */
	function (search, record, utility, Big, translator, invtUtility) {

		/**
		 * Function to validate the entered to Bin location.
		 *
		 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
		 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
		 */
		function doPost(requestBody) {

			var scannedQuantity = '';
			var fromBinName = '';
			var binName = '';
			var preferedBinName = '';
			var blnMixItem = '';
			var blnMixLot = '';
			var itemType = '';
			var fromBinInternalId = '';
			var itemInternalId = '';
			var warehouseLocationId = '';
			var lotName = '';
			var actualBeginTime = '';
			var stockConversionRate = '';
			var stockUnitName = '';
			var serialString = '';
			var unitType = '';
			var putawayAll = '';
			var binValidateArray = {};
			var debugString = '';
			var processType = '';
			var lotInternalId = '';
			var lotId = '';
			var toWarehouseLocationId = '';
			var isValidBin = true;
			var requestParams = '';
			var fromBinLocationType = null;
			var impactRec = {};
			var binTransferArr = [];
			var openTaskArr = [];
			var invTransferArr = [];
			var labelRecArr = [];
			var extlabelRecArr = [];
			var fromLocUseBinsFlag = '';
			var impactedRecords = {};
			var tallyLoopObj = '';
			var uomSelectionforFirstItr = '';
			var qtyUomSelected = '';
			var tallyScanBarCodeQty = '';
			var isTallyScanRequired = '';
			var barcodeQuantity = '';
			var toBinInternalId = '';
			var toBinInternalLoctype = '';
			var invTranID = '';
			var rejectType1 = '';
			var rejectType2 = '';
			var rejectType3 = '';
			var rejectType4 = '';
			var rejectType5 = '';
			var rejectType6 = '';
			var rejectType7 = '';
			var rejectType8 = '';
			var rejectType9 = '';
			var rejectType10 = '';
			var rejectType11 = '';
			var rejectType12 = '';
			var rejectType13 = '';
			var rejectType14 = '';
			var rejectType15 = '';
			var rejectType16 = '';
			var rejectType17 = '';
			var rejectType18 = '';
			var rejectType19 = '';
			var rejectType20 = '';
			var rejectType21 = '';
			var rejectType22 = '';
			var rejectType23 = '';
			var rejectType24 = '';
			var rejectType25 = '';
			var rejectType26 = '';

			try {
				if (utility.isValueValid(requestBody)) {
					requestParams = requestBody.params;
					invTranID = requestParams.lotName;
					scannedQuantity = requestParams.scannedQuantity;
					fromBinName = requestParams.fromBinName;
					binName = requestParams.binName;
					if (!binName)
						binName = requestParams.binNameReject;
					preferedBinName = requestParams.preferedBinName;
					blnMixItem = requestParams.blnMixItem;
					blnMixLot = requestParams.blnMixLot;
					itemType = requestParams.itemType;
					fromBinInternalId = requestParams.fromBinInternalId;
					itemInternalId = requestParams.itemInternalId;
					warehouseLocationId = requestParams.warehouseLocationId;
					lotName = requestParams.lotName;
					lotInternalId = requestParams.lotInternalId;
					lotId = requestParams.lotId;
					actualBeginTime = requestParams.actualBeginTime;
					stockConversionRate = requestParams.stockConversionRate;
					stockUnitName = requestParams.stockUnitName;
					unitType = requestParams.unitType;
					putawayAll = requestParams.putawayAll;
					processType = requestParams.processType;
					toWarehouseLocationId = requestParams.toWarehouseLocationId;
					fromLocUseBinsFlag = requestParams.fromLocUseBinsFlag;
					serialString = requestParams["serialString[]"];
					tallyLoopObj = requestParams.tallyLoopObj;
					uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
					qtyUomSelected = requestParams.qtyUomSelection;
					barcodeQuantity = requestParams.barcodeQuantity;
					isTallyScanRequired = requestParams.isTallyScanRequired;
					tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
					rejectType1 = requestParams.rejectType1;
					rejectType2 = requestParams.rejectType2;
					rejectType3 = requestParams.rejectType3;
					rejectType4 = requestParams.rejectType4;
					rejectType5 = requestParams.rejectType5;
					rejectType6 = requestParams.rejectType6;
					rejectType7 = requestParams.rejectType7;
					rejectType8 = requestParams.rejectType8;
					rejectType9 = requestParams.rejectType9;
					rejectType10 = requestParams.rejectType10;
					rejectType11 = requestParams.rejectType11;
					rejectType12 = requestParams.rejectType12;
					rejectType13 = requestParams.rejectType13;
					rejectType14 = requestParams.rejectType14;
					rejectType15 = requestParams.rejectType15;
					rejectType16 = requestParams.rejectType16;
					rejectType17 = requestParams.rejectType17;
					rejectType18 = requestParams.rejectType18;
					rejectType19 = requestParams.rejectType19;
					rejectType20 = requestParams.rejectType20;
					rejectType21 = requestParams.rejectType21;
					rejectType22 = requestParams.rejectType22;
					rejectType23 = requestParams.rejectType23;
					rejectType24 = requestParams.rejectType24;
					rejectType25 = requestParams.rejectType25;
					rejectType26 = requestParams.rejectType26;

					log.debug({
						title: 'requestParams',
						details: requestParams
					});
					var objInvDetails = [];
					if (!utility.isValueValid(binName)) {
						binValidateArray.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.EMPTY_INPUT');
						binValidateArray.isValid = false;
						isValidBin = false;
					} else if (fromBinName == binName && processType != 'inventoryTransfer') {
						binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.SAME_FROMANDTOBINS');
						binValidateArray.isValid = false;
						isValidBin = false;
					} else {
						tallyScanBarCodeQty = utility.isValueValid(tallyScanBarCodeQty) ? tallyScanBarCodeQty : 0;
						tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
						if (!utility.isValueValid(stockConversionRate)) {
							stockConversionRate = 1;
						}

						if (!utility.isValueValid(binName) &&
							(utility.isValueValid(preferedBinName) &&
								(utility.isValueValid(fromBinName) && preferedBinName != fromBinName))) {
							binName = preferedBinName;
						}
						binValidateArray.toBinName = binName;
						var binSearchResults = search.load({
							id: 'customsearch_wmsse_tobin_details'
						});
						var binSearchFilters = binSearchResults.filters;

						if (utility.isValueValid(binName)) {
							binSearchFilters.push(search.createFilter({
								name: 'binnumber',
								operator: search.Operator.IS,
								values: binName
							}));
						}
						binSearchFilters.push(search.createFilter({
							name: 'inactive',
							operator: search.Operator.IS,
							values: false
						}));

						if (processType == 'inventoryTransfer') {
							if (utility.isValueValid(toWarehouseLocationId)) {
								binSearchFilters.push(search.createFilter({
									name: 'location',
									operator: search.Operator.ANYOF,
									values: toWarehouseLocationId
								}));
							}

						} else {
							if (utility.isValueValid(warehouseLocationId)) {
								binSearchFilters.push(search.createFilter({
									name: 'location',
									operator: search.Operator.ANYOF,
									values: warehouseLocationId
								}));
							}
						}
						log.debug({
							title: 'processType',
							details: processType
						});
						if (processType == 'BinTransfer') {
							var stgDirection = '';
							var binLookUp = search.lookupFields({
								type: search.Type.BIN,
								id: fromBinInternalId,
								columns: ['custrecord_wmsse_bin_loc_type', 'custrecord_wmsse_bin_stg_direction']
							});
							if (utility.isValueValid(binLookUp.custrecord_wmsse_bin_loc_type)) {
								fromBinLocationType = binLookUp.custrecord_wmsse_bin_loc_type;
							}
							if (binLookUp.custrecord_wmsse_bin_stg_direction != undefined && binLookUp.custrecord_wmsse_bin_stg_direction[0] != undefined) {
								stgDirection = binLookUp.custrecord_wmsse_bin_stg_direction[0].text;
							}
							var stgTypeArr = [];
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
								stgTypeArr.push('Stage');
								if (processType == "BinTransfer" && utility.isValueValid(fromBinLocationType) && fromBinLocationType.length > 0 && fromBinLocationType[0].text == 'WIP') {
									stgTypeArr.push('WIP');
								}
								stageLocArr = utility.getStageLocations(stgTypeArr, BinlocationTypes);
							}
							if (stageLocArr.length > 0) {
								stageLocArr.push('@NONE@');
								binSearchFilters.push(search.createFilter({
									name: 'custrecord_wmsse_bin_loc_type',
									operator: search.Operator.ANYOF,
									values: stageLocArr
								}));
								log.debug({
									title: 'stgDirection',
									details: stgDirection
								});
								if (stgDirection != null && stgDirection != '' && stgDirection != 'null' &&
									stgDirection != undefined && stgDirection == 'Out') {
									binSearchFilters.push(search.createFilter({
										name: 'custrecord_wmsse_bin_stg_direction',
										operator: search.Operator.ANYOF,
										values: ['2']
									}));
								} else {
									binSearchFilters.push(search.createFilter({
										name: 'custrecord_wmsse_bin_stg_direction',
										operator: search.Operator.ANYOF,
										values: ['@NONE@', '1']
									}));
								}
							} else {
								binSearchFilters.push(search.createFilter({
									name: 'custrecord_wmsse_bin_loc_type',
									operator: search.Operator.ANYOF,
									values: ['@NONE@']
								}));
								binSearchFilters.push(search.createFilter({
									name: 'custrecord_wmsse_bin_stg_direction',
									operator: search.Operator.ANYOF,
									values: ['@NONE@']
								}));
							}

						} else {
							binSearchFilters.push(search.createFilter({
								name: 'custrecord_wmsse_bin_loc_type',
								operator: search.Operator.ANYOF,
								values: ['@NONE@']
							}));
							binSearchFilters.push(search.createFilter({
								name: 'custrecord_wmsse_bin_stg_direction',
								operator: search.Operator.ANYOF,
								values: ['@NONE@']
							}));
						}
						binSearchResults.filters = binSearchFilters;
						var binSearchResultsvalues = binSearchResults.run().getRange({
							start: 0,
							end: 1000
						});
						if (utility.isValueValid(binSearchResultsvalues)) {
							toBinInternalId = binSearchResultsvalues[0].id;
							toBinInternalLoctype = binSearchResultsvalues[0].getText('custrecord_wmsse_bin_loc_type');
						}

						log.debug({
							title: 'toBinInternalLoctype ' + toBinInternalId,
							details: toBinInternalLoctype
						});

						if (!utility.isValueValid(toBinInternalId) || (processType == 'BinTransfer' && toBinInternalLoctype == 'Stage' && fromBinLocationType != null && fromBinLocationType.length == 0)) {
							binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
							binValidateArray.isValid = false;
							isValidBin = false;
							log.debug({
								title: 'isValidBin',
								details: isValidBin
							});
						} else {
							log.debug({
								title: 'else ',
								details: 'bin id valid'
							});

							var objInvDetails = [];
							var binLocArr = [];
							log.debug({
								title: 'binName',
								details: binName
							});
							log.debug({
								title: 'preferedBinName',
								details: preferedBinName
							});
							if (binName != preferedBinName) {
								log.debug({
									title: 'binName != preferedBinName',
									details: binName + ' != ' + preferedBinName
								});
								if (blnMixItem == false || blnMixItem == "false") {
									log.debug({
										title: 'processType',
										details: processType
									});

									if (processType == 'inventoryTransfer') {
										objInvDetails = utility.fnGetInventoryBins(toWarehouseLocationId, itemInternalId, toBinInternalId);
									} else if ((processType == 'BinTransfer' && toBinInternalLoctype != 'Stage') || processType != 'BinTransfer') {
										objInvDetails = utility.fnGetInventoryBins(warehouseLocationId, itemInternalId, toBinInternalId);
									}

									if (objInvDetails.length > 0) {
										binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.MIXITEMS_FALSE');
										binValidateArray.isValid = false;
										isValidBin = false;
									}
								} else {
									if (processType == 'inventoryTransfer') {
										objInvDetails = utility.getItemMixFlagDetails(toWarehouseLocationId, itemInternalId, toBinInternalId, true, null);
									} else if ((processType == 'BinTransfer' && toBinInternalLoctype != 'Stage') || processType != 'BinTransfer') {
										objInvDetails = utility.getItemMixFlagDetails(warehouseLocationId, itemInternalId, toBinInternalId, true, null);
									}
									if (objInvDetails.length > 0) {
										binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.BIN_MIXITEMS_FALSE');
										binValidateArray.isValid = false;
										isValidBin = false;
									}
								}
								log.debug({
									title: 'isValidBin',
									details: isValidBin
								});
								log.debug({
									title: 'blnMixLot',
									details: blnMixLot
								});
								log.debug({
									title: 'itemType',
									details: itemType
								});
								if ((isValidBin != false) && ((blnMixLot == false || blnMixLot == "false")) && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
									if (processType == 'inventoryTransfer') {
										binLocArr = utility.fnGetInventoryBinsForLot(toWarehouseLocationId, lotName, itemInternalId, toBinInternalId);
									} else if ((processType == 'BinTransfer' && toBinInternalLoctype != 'Stage') || processType != 'BinTransfer') {
										binLocArr = utility.fnGetInventoryBinsForLot(warehouseLocationId, lotName, itemInternalId, toBinInternalId);
									}

									if (binLocArr.length > 0) {
										for (var bin = 0; bin < binLocArr.length; bin++) {
											objInvDetails.push(binLocArr[bin]);
										}
									}
									if (objInvDetails.length > 0) {
										binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.MIXLOTS_FALSE');
										binValidateArray.isValid = false;
										isValidBin = false;
									}
								}
								if (isValidBin && ((objInvDetails.length == 0 && (blnMixItem == false || blnMixItem == "false")) ||
										(blnMixItem == true || blnMixItem == 'true'))) {
									if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
										binValidateArray.errorMessage = '';
										binValidateArray.isValid = true;
										binValidateArray.custparam_enterToBin = toBinInternalId;
										binValidateArray.custparam_enterQty = Number(Big(scannedQuantity) * (stockConversionRate)); //convert the calculated value to Number,since when we keep this value into custparam_enterQty array invalid string is passing to next screen other than acutal value

										var serialSearch = search.load({
											id: 'customsearch_wmsse_serialdetails_search',
										});
										var serailFilters = serialSearch.filters;

										serailFilters.push(search.createFilter({
											name: 'custrecord_wmsse_ser_status',
											operator: search.Operator.IS,
											values: false
										}));
										serailFilters.push(search.createFilter({
											name: 'custrecord_wmsse_ser_tasktype',
											operator: search.Operator.ANYOF,
											values: '9'
										}));
										serailFilters.push(search.createFilter({
											name: 'custrecord_wmsse_ser_bin',
											operator: search.Operator.ANYOF,
											values: toBinInternalId
										}));
										serialSearch.filters = serailFilters;
										var serialSearchResults = utility.getSearchResultInJSON(serialSearch);

										if (serialSearchResults.length > 0) {
											for (var j in serialSearchResults) {
												var TempRecord = serialSearchResults[j];
												var serialRec = record.load({
													type: 'customrecord_wmsse_serialentry',
													id: TempRecord.id
												});
												serialRec.setValue({
													fieldId: 'id',
													value: TempRecord.id
												});
												serialRec.setValue({
													fieldId: 'name',
													value: TempRecord.name
												});
												serialRec.setValue({
													fieldId: 'custrecord_wmsse_ser_note1',
													value: 'because of discontinue of serial number scanning we have marked this serial number as closed'
												});
												serialRec.setValue({
													fieldId: 'custrecord_wmsse_ser_status',
													value: true
												});
												serialRec.save();
											}

										}
									}
								}

							}
						}
					}

					if (isValidBin) {
						if (putawayAll == 'putawayAll') {

							if ((utility.isValueValid(fromBinName) || utility.isValueValid(fromLocUseBinsFlag)) && utility.isValueValid(binName) &&
								utility.isValueValid(itemType) && (utility.isValueValid(fromBinInternalId) || utility.isValueValid(fromLocUseBinsFlag)) &&
								utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId)) {


								if ((objInvDetails.length == 0 && (blnMixItem == false || blnMixItem == "false")) ||
									(blnMixItem == true || blnMixItem == 'true')) {

									if (processType == 'inventoryTransfer') {
										var invtransferObj = {};
										invtransferObj.itemType = itemType;
										invtransferObj.whLocation = warehouseLocationId;
										invtransferObj.towhLocation = toWarehouseLocationId;
										invtransferObj.itemId = itemInternalId;
										invtransferObj.fromBinId = fromBinInternalId;
										invtransferObj.toBinId = toBinInternalId;
										invtransferObj.actualBeginTime = actualBeginTime;
										invtransferObj.units = stockUnitName;
										invtransferObj.stockConversionRate = stockConversionRate;
										invtransferObj.fromLocUseBinsFlag = fromLocUseBinsFlag;

										impactRec = invtUtility.transferallInvTransfer(invtransferObj);

										if (utility.isValueValid(impactRec.inventoryCountId)) {
											invTransferArr.push(impactRec.inventoryCountId);
										} else {
											invTransferArr.push();
										}

										if (utility.isValueValid(impactRec.opentaskId)) {
											openTaskArr.push(impactRec.opentaskId);
										} else {
											openTaskArr.push();
										}
										impactedRecords.inventorytransfer = invTransferArr;
										impactedRecords.customrecord_wmsse_trn_opentask = openTaskArr;
									} else {
										impactRec = fnPutawayallBinTransfer(itemType, warehouseLocationId, itemInternalId, fromBinInternalId, toBinInternalId, actualBeginTime, stockUnitName, stockConversionRate, lotInternalId, lotName);

										if (utility.isValueValid(impactRec.inventoryCountId)) {
											binTransferArr.push(impactRec.inventoryCountId);
										} else {
											binTransferArr.push();
										}

										if (utility.isValueValid(impactRec.opentaskId)) {
											openTaskArr.push(impactRec.opentaskId);
										} else {
											openTaskArr.push();
										}
										impactedRecords.bintransfer = binTransferArr;
										impactedRecords.customrecord_wmsse_trn_opentask = openTaskArr;
									}
								} else {
									binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
									binValidateArray.isValid = false;
								}
							}
						} else {
							log.debug({
								title: 'scannedQuantity',
								details: 'utility.isValueValid(scannedQuantity): ' + utility.isValueValid(scannedQuantity)
							});
							log.debug({
								title: 'fromBinName || fromLocUseBinsFlag',
								details: '(utility.isValueValid(fromBinName): ' + utility.isValueValid(fromBinName) + ' || utility.isValueValid(fromLocUseBinsFlag))' + utility.isValueValid(fromLocUseBinsFlag)
							});
							log.debug({
								title: 'binName',
								details: 'utility.isValueValid(binName): ' + utility.isValueValid(binName)
							});
							log.debug({
								title: 'itemType',
								details: 'utility.isValueValid(itemType): ' + utility.isValueValid(itemType)
							});
							log.debug({
								title: 'blnMixItem',
								details: 'utility.isValueValid(blnMixItem): ' + utility.isValueValid(blnMixItem)
							});
							log.debug({
								title: 'blnMixLot',
								details: 'utility.isValueValid(blnMixLot): ' + utility.isValueValid(blnMixLot)
							});
							log.debug({
								title: 'fromBinInternalId || fromLocUseBinsFlag',
								details: '(utility.isValueValid(fromBinInternalId): ' + utility.isValueValid(fromBinInternalId) + ' || utility.isValueValid(fromLocUseBinsFlag))' + utility.isValueValid(fromLocUseBinsFlag)
							});
							log.debug({
								title: 'itemInternalId',
								details: 'utility.isValueValid(itemInternalId): ' + utility.isValueValid(itemInternalId)
							});
							log.debug({
								title: 'warehouseLocationId',
								details: 'utility.isValueValid(warehouseLocationId): ' + utility.isValueValid(warehouseLocationId)
							});

							if (blnMixItem != true || blnMixItem != 'true' && blnMixItem != false || blnMixItem != "false") {
								if (blnMixItem == '' || blnMixItem == null || blnMixItem != undefined)
									blnMixItem = true;
							}
							if (blnMixLot != true || blnMixLot != 'true' && blnMixLot != false || blnMixLot != "false") {
								if (blnMixLot == '' || blnMixLot == null || blnMixLot != undefined)
									blnMixLot = true;
							}

							if (utility.isValueValid(scannedQuantity) &&
								(utility.isValueValid(fromBinName) || utility.isValueValid(fromLocUseBinsFlag)) &&
								utility.isValueValid(binName) &&
								utility.isValueValid(itemType) &&
								utility.isValueValid(blnMixItem) &&
								utility.isValueValid(blnMixLot) &&
								(utility.isValueValid(fromBinInternalId) || utility.isValueValid(fromLocUseBinsFlag)) &&
								utility.isValueValid(itemInternalId) &&
								utility.isValueValid(warehouseLocationId)) {
								log.debug({
									title: 'valid bin',
									details: isValidBin
								});
								var serialarr = [];
								if (utility.isValueValid(binName)) {
									var objInvDetails = [];
									if ((objInvDetails.length == 0 && (blnMixItem == false || blnMixItem == "false")) ||
										(blnMixItem == true || blnMixItem == 'true')) {
										if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
											if (typeof serialString === 'string') {
												var serialObj = JSON.parse(serialString);
												serialarr.push(serialObj.serial_number);

											} else {
												for (var serialIndex in serialString) {
													var serialObj = JSON.parse(serialString[serialIndex]);
													serialarr.push(serialObj.serial_number);
												}
											}

											if (serialarr != null && serialarr != '') {
												for (var serialNo = 0; serialNo < serialarr.length; serialNo++) {

													var getSerialNo = serialarr[serialNo];

													var serialSearch = search.load({
														id: 'customsearch_wmsse_serialdetails_search',
													});
													var serailFilters = serialSearch.filters;

													serailFilters.push(search.createFilter({
														name: 'custrecord_wmsse_ser_no',
														operator: search.Operator.IS,
														values: getSerialNo
													}));

													serailFilters.push(search.createFilter({
														name: 'custrecord_wmsse_ser_status',
														operator: search.Operator.IS,
														values: false
													}));
													serailFilters.push(search.createFilter({
														name: 'custrecord_wmsse_ser_tasktype',
														operator: search.Operator.ANYOF,
														values: '9'
													}));
													serailFilters.push(search.createFilter({
														name: 'custrecord_wmsse_ser_bin',
														operator: search.Operator.ANYOF,
														values: toBinInternalId
													}));
													serialSearch.filters = serailFilters;
													var SrchRecordTmpSerial = utility.getSearchResultInJSON(serialSearch);
													if (SrchRecordTmpSerial.length > 0) {
														binValidateArray.errorMessage = translator.getTranslationString("Serial# already scanned");
														binValidateArray.isValid = false;
														return binValidateArray;
													}
													var customrecord = record.create({
														type: 'customrecord_wmsse_serialentry'
													});
													customrecord.setValue({
														fieldId: 'name',
														value: getSerialNo
													});
													customrecord.setValue({
														fieldId: 'custrecord_wmsse_ser_item',
														value: itemInternalId
													});
													customrecord.setValue({
														fieldId: 'custrecord_wmsse_ser_qty',
														value: 1
													});
													customrecord.setValue({
														fieldId: 'custrecord_wmsse_ser_no',
														value: getSerialNo
													});
													customrecord.setValue({
														fieldId: 'custrecord_wmsse_ser_status',
														value: false
													});
													customrecord.setValue({
														fieldId: 'custrecord_wmsse_ser_bin',
														value: toBinInternalId
													});
													customrecord.setValue({
														fieldId: 'custrecord_wmsse_ser_tasktype',
														value: 9
													});
													customrecord.save({
														enableSourcing: false,
														ignoreMandatoryFields: true
													});

												}
											}
										}
										log.debug({
											title: 'itemType',
											details: itemType
										});
										//below code commented, because Scannedquantity is already converted in previous screen.
										//var binTransferQty = Number((Big(scannedQuantity).mul(stockConversionRate)).toFixed(8));
										var binTransferQty = Number((Big(scannedQuantity)).toFixed(8));
										log.debug({
											title: 'binTransferQty',
											details: binTransferQty
										});
										log.debug({
											title: 'scannedQuantity',
											details: scannedQuantity
										});
										var tallyScanObj = {};
										if (processType == 'inventoryTransfer') {
											binTransferQty = Number((Big(scannedQuantity).div(stockConversionRate)).toFixed(8));
											var openTaskQty = Number((Big(scannedQuantity).div(stockConversionRate)).toFixed(8));

											if ((utility.isValueValid(tallyLoopObj)) && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {

												tallyScanObj = invtUtility.buildObjectFromTallyLoopObj(isTallyScanRequired, itemType, tallyLoopObj, tallyScanBarCodeQty);
												log.debug('tallyScanObj for inv transfer', tallyScanObj);
											}
											impactRec = fnInvTransfer(itemType, warehouseLocationId, toWarehouseLocationId, itemInternalId, binTransferQty, fromBinInternalId,
												toBinInternalId, lotName, actualBeginTime, stockUnitName, stockConversionRate, openTaskQty, tallyScanObj, invTranID, rejectType1, rejectType2, rejectType3, rejectType4, rejectType5, rejectType6, rejectType7, rejectType8, rejectType9, rejectType10, rejectType11, rejectType12, rejectType13, rejectType14, rejectType15, rejectType16, rejectType17, rejectType18, rejectType19, rejectType20, rejectType21, rejectType22, rejectType23, rejectType24, rejectType25, rejectType26);
											log.debug('fninvtransfer', impactRec);

											if (utility.isValueValid(impactRec.inventoryCountId)) {
												invTransferArr.push(impactRec.inventoryCountId);
											} else {
												invTransferArr.push();
											}

											if (utility.isValueValid(impactRec.opentaskId)) {
												openTaskArr.push(impactRec.opentaskId);
											} else {
												openTaskArr.push();
											}
											impactedRecords._ignoreUpdate = false;
											impactedRecords.inventorytransfer = invTransferArr;
											impactedRecords.customrecord_wmsse_trn_opentask = openTaskArr;
										} else {

											var openTaskQty = Number((Big(scannedQuantity).div(stockConversionRate)).toFixed(8));

											if ((isTallyScanRequired) && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {

												tallyScanObj = invtUtility.buildObjectFromTallyLoopObj(isTallyScanRequired, itemType, tallyLoopObj, tallyScanBarCodeQty);
												log.debug('tallyScanObj', tallyScanObj);
											}
											impactRec = fnBinTransfer(itemType, warehouseLocationId, itemInternalId, binTransferQty, fromBinInternalId, toBinInternalId, lotName, actualBeginTime, stockUnitName, stockConversionRate, openTaskQty, tallyScanObj, processType);

											if (utility.isValueValid(impactRec.inventoryCountId)) {
												binTransferArr.push(impactRec.inventoryCountId);
											} else {
												binTransferArr.push();
											}

											if (utility.isValueValid(impactRec.opentaskId)) {
												openTaskArr.push(impactRec.opentaskId);
											} else {
												openTaskArr.push();
											}
											impactedRecords._ignoreUpdate = false;
											impactedRecords.customrecord_wmsse_trn_opentask = openTaskArr;
											impactedRecords.bintransfer = binTransferArr;
										}

									}

								} else {
									binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
									binValidateArray.isValid = false;
								}
							} else {
								binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
								binValidateArray.isValid = false;
							}

						}

						labelRecArr.push();
						extlabelRecArr.push();
						impactedRecords.customrecord_wmsse_labelprinting = labelRecArr;
						impactedRecords.customrecord_wmsse_ext_labelprinting = extlabelRecArr;

						binValidateArray.impactedRecords = impactedRecords;
						binValidateArray.transferNumber = impactedRecords;
						binValidateArray.invTranID = impactRec.invTranID;
						binValidateArray.isValid = true;
						log.debug({
							title: 'impactedRecords :',
							details: impactedRecords
						});
						log.debug({
							title: 'binValidateArray.invTranID :',
							details: binValidateArray.invTranID
						});
					} else {
						if (!utility.isValueValid(binValidateArray.errorMessage))
							binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
						binValidateArray.isValid = false;
					}
				} else {
					binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
					binValidateArray.isValid = false;
				}
			} catch (e) {
				binValidateArray.isValid = false;
				binValidateArray.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}

			return binValidateArray;

		}

		function fnPutawayallBinTransfer(itemType, warehouseLocationId, itemInternalId, fromBinInternalId, toBinInternalId, actualBeginTime, stockUnitName, stockConversionRate, lotInternalId, lotName) {
			var bintransferObj = {};
			var impactRec = {};

			bintransferObj.itemType = itemType;
			bintransferObj.whLocation = warehouseLocationId;
			bintransferObj.itemId = itemInternalId;
			bintransferObj.fromBinId = fromBinInternalId;
			bintransferObj.toBinId = toBinInternalId;
			bintransferObj.actualBeginTime = actualBeginTime;
			bintransferObj.units = stockUnitName;
			bintransferObj.stockConversionRate = stockConversionRate;
			if (utility.isInvStatusFeatureEnabled()) {
				bintransferObj.batchno = lotInternalId;
			} else {
				bintransferObj.batchno = lotName;
			}
			impactRec = invtUtility.putawayallBinTransfer(bintransferObj);
			return impactRec;
		}

		function fnInvTransfer(itemType, warehouseLocationId, toWarehouseLocationId, itemInternalId, binTransferQty, fromBinInternalId, toBinInternalId, lotName, actualBeginTime, stockUnitName, stockConversionRate, openTaskQty, tallyScanObj, invTranID, rejectType1, rejectType2, rejectType3, rejectType4, rejectType5, rejectType6, rejectType7, rejectType8, rejectType9, rejectType10, rejectType11, rejectType12, rejectType13, rejectType14, rejectType15, rejectType16, rejectType17, rejectType18, rejectType19, rejectType20, rejectType21, rejectType22, rejectType23, rejectType24, rejectType25, rejectType26) {
			var invtransferObj = {};
			var impactRec = {};

			invtransferObj.invTranID = invTranID;
			invtransferObj.itemType = itemType;
			invtransferObj.whLocation = warehouseLocationId;
			invtransferObj.towhLocation = toWarehouseLocationId;
			invtransferObj.itemId = itemInternalId;
			invtransferObj.quantity = binTransferQty;
			if (utility.isValueValid(fromBinInternalId)) {
				invtransferObj.fromBinId = fromBinInternalId;
			}
			if (utility.isValueValid(toBinInternalId)) {
				invtransferObj.toBinId = toBinInternalId;
			}
			if (toWarehouseLocationId == 900) {
				invtransferObj.rejectType1 = rejectType1;
				invtransferObj.rejectType2 = rejectType2;
				invtransferObj.rejectType3 = rejectType3;
				invtransferObj.rejectType4 = rejectType4;
				invtransferObj.rejectType5 = rejectType5;
				invtransferObj.rejectType6 = rejectType6;
				invtransferObj.rejectType7 = rejectType7;
				invtransferObj.rejectType8 = rejectType8;
				invtransferObj.rejectType9 = rejectType9;
				invtransferObj.rejectType10 = rejectType10;
				invtransferObj.rejectType11 = rejectType11;
				invtransferObj.rejectType12 = rejectType12;
				invtransferObj.rejectType13 = rejectType13;
				invtransferObj.rejectType14 = rejectType14;
				invtransferObj.rejectType15 = rejectType15;
				invtransferObj.rejectType16 = rejectType16;
				invtransferObj.rejectType17 = rejectType17;
				invtransferObj.rejectType18 = rejectType18;
				invtransferObj.rejectType19 = rejectType19;
				invtransferObj.rejectType20 = rejectType20;
				invtransferObj.rejectType21 = rejectType21;
				invtransferObj.rejectType22 = rejectType22;
				invtransferObj.rejectType23 = rejectType23;
				invtransferObj.rejectType24 = rejectType24;
				invtransferObj.rejectType25 = rejectType25;
				invtransferObj.rejectType26 = rejectType26;
			}
			invtransferObj.batchno = lotName;
			invtransferObj.actualBeginTime = actualBeginTime;
			invtransferObj.units = stockUnitName;
			invtransferObj.stockConversionRate = stockConversionRate;
			invtransferObj.opentaskQty = openTaskQty;

			if (tallyScanObj.isTallyScanRequired) {
				invtransferObj.isTallyScanRequired = tallyScanObj.isTallyScanRequired;
				invtransferObj.lotArray = tallyScanObj.lotArray;
				invtransferObj.tallyQtyArr = tallyScanObj.tallyQtyArr;
				invtransferObj.statusArray = tallyScanObj.statusArray;
				invtransferObj.quantity = tallyScanObj.tallyScanBarCodeQty;
			}
			log.debug({
				title: 'invtransferObj',
				details: invtransferObj
			});

			impactRec = invtUtility.inventoryInvTransfer(invtransferObj);
			return impactRec;
		}

		function fnBinTransfer(itemType, warehouseLocationId, itemInternalId, binTransferQty, fromBinInternalId, toBinInternalId, lotName, actualBeginTime, stockUnitName, stockConversionRate, openTaskQty, tallyScanObj, processType) {
			var bintransferObj = {};
			var impactRec = {};

			bintransferObj.itemType = itemType;
			bintransferObj.whLocation = warehouseLocationId;
			bintransferObj.itemId = itemInternalId;
			bintransferObj.quantity = binTransferQty;
			bintransferObj.fromBinId = fromBinInternalId;
			bintransferObj.toBinId = toBinInternalId;
			bintransferObj.batchno = lotName;
			bintransferObj.actualBeginTime = actualBeginTime;
			bintransferObj.units = stockUnitName;
			bintransferObj.stockConversionRate = stockConversionRate;
			bintransferObj.opentaskQty = openTaskQty;
			bintransferObj.processType = processType;

			if (tallyScanObj.isTallyScanRequired) {
				bintransferObj.isTallyScanRequired = tallyScanObj.isTallyScanRequired;
				bintransferObj.lotArray = tallyScanObj.lotArray;
				bintransferObj.tallyQtyArr = tallyScanObj.tallyQtyArr;
				bintransferObj.statusArray = tallyScanObj.statusArray;
				if (parseFloat(tallyScanObj.tallyScanBarCodeQty) > 0) {
					bintransferObj.quantity = Number(Big(tallyScanObj.tallyScanBarCodeQty).mul(stockConversionRate));
				}
			}

			impactRec = invtUtility.inventoryBinTransfer(bintransferObj);

			return impactRec;
		}

		return {
			'post': doPost

		};

	}
);