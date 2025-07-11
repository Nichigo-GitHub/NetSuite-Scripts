/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope public
 */
define(['N/search', 'N/record', './wms_utility', './big', './wms_translator', './wms_inventory_utility_2'],
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
			var department = '',
				customer = '',
				preparedBy = '';
			var deliveryDate = '';
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
			var rejectType27 = '';
			var rejectType28 = '';
			var rejectType29 = '';
			var rejectType30 = '';
			var rejectType31 = '';
			var rejectType32 = '';
			var rejectType33 = '';
			var rejectType34 = '';
			var rejectType35 = '';
			var rejectType36 = '';
			var rejectType37 = '';
			var rejectType38 = '';
			var rejectType39 = '';
			var rejectType40 = '';
			var rejectType41 = '';
			var rejectType42 = '';
			var rejectType43 = '';
			var rejectType44 = '';
			var rejectType45 = '';
			var rejectType46 = '';
			var rejectType47 = '';
			var rejectType48 = '';
			var rejectType49 = '';
			var rejectType50 = '';
			var rejectType51 = '';
			var rejectType52 = '';


			try {
				if (utility.isValueValid(requestBody)) {
					requestParams = requestBody.params;
					invTranID = requestParams.lotName;
					department = requestParams.department.label;
					customer = requestParams.customer;
					preparedBy = requestParams.preparedBy;
					deliveryDate = requestParams.deliveryDate;
					scannedQuantity = requestParams.scannedQuantity;
					fromBinName = requestParams.fromBinName;
					binName = requestParams.binName;
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
					rejectType27 = requestParams.rejectType27;
					rejectType28 = requestParams.rejectType28;
					rejectType29 = requestParams.rejectType29;
					rejectType30 = requestParams.rejectType30;
					rejectType31 = requestParams.rejectType31;
					rejectType32 = requestParams.rejectType32;
					rejectType33 = requestParams.rejectType33;
					rejectType34 = requestParams.rejectType34;
					rejectType35 = requestParams.rejectType35;
					rejectType36 = requestParams.rejectType36;
					rejectType37 = requestParams.rejectType37;
					rejectType38 = requestParams.rejectType38;
					rejectType39 = requestParams.rejectType39;
					rejectType40 = requestParams.rejectType40;
					rejectType41 = requestParams.rejectType41;
					rejectType42 = requestParams.rejectType42;
					rejectType43 = requestParams.rejectType43;
					rejectType44 = requestParams.rejectType44;
					rejectType45 = requestParams.rejectType45;
					rejectType46 = requestParams.rejectType46;
					rejectType47 = requestParams.rejectType47;
					rejectType48 = requestParams.rejectType48;
					rejectType49 = requestParams.rejectType49;
					rejectType50 = requestParams.rejectType50;
					rejectType51 = requestParams.rejectType51;
					rejectType52 = requestParams.rejectType52;

					log.debug({
						title: 'requestParams',
						details: requestParams
					});
					var objInvDetails = [];
					if (!utility.isValueValid(binName)) {
						log.debug('error 108', 'error');
						binValidateArray.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.EMPTY_INPUT');
						binValidateArray.isValid = false;
						isValidBin = false;
					} else if (fromBinName == binName && processType != 'inventoryTransfer') {
						log.debug('error 114', 'error');
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
							id: 'customsearch_bin_codes'
						});
						var binSearchFilters = binSearchResults.filters;

						if (utility.isValueValid(binName)) {
							binSearchFilters.push(search.createFilter({
								name: 'custrecord_bin_code',
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
							log.debug('error 266', 'error');
							binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
							binValidateArray.isValid = false;
							isValidBin = false;
							log.debug({
								title: 'isValidBin',
								details: isValidBin
							});
						} else {

							var objInvDetails = [];
							var binLocArr = [];
							if (binName != preferedBinName) {
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
										log.debug('error 288', 'error');
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
										log.debug('error 301', 'error');
										binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.BIN_MIXITEMS_FALSE');
										binValidateArray.isValid = false;
										isValidBin = false;
									}
								}

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
										log.debug('error 323', 'error');
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
									log.debug('error 440', 'error');
									binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
									binValidateArray.isValid = false;
								}
							}
						} else {

							if (utility.isValueValid(scannedQuantity) && (utility.isValueValid(fromBinName) || utility.isValueValid(fromLocUseBinsFlag)) && utility.isValueValid(binName) &&
								utility.isValueValid(itemType) && utility.isValueValid(blnMixItem) &&
								utility.isValueValid(blnMixLot) && (utility.isValueValid(fromBinInternalId) || utility.isValueValid(fromLocUseBinsFlag)) &&
								utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId)) {

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
														log.debug('error 506', 'error');
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
												toBinInternalId, lotName, actualBeginTime, stockUnitName, stockConversionRate, openTaskQty, tallyScanObj, department, customer, preparedBy, deliveryDate, invTranID, rejectType1, rejectType2, rejectType3, rejectType4, rejectType5, rejectType6, rejectType7, rejectType8, rejectType9, rejectType10, rejectType11, rejectType12, rejectType13, rejectType14, rejectType15, rejectType16, rejectType17, rejectType18, rejectType19, rejectType20, rejectType21, rejectType22, rejectType23, rejectType24, rejectType25, rejectType26, rejectType27, rejectType28, rejectType29, rejectType30, rejectType31, rejectType32, rejectType33, rejectType34, rejectType35, rejectType36, rejectType37, rejectType38, rejectType39, rejectType40, rejectType41, rejectType42, rejectType43, rejectType44, rejectType45, rejectType46, rejectType47, rejectType48, rejectType49, rejectType50, rejectType51, rejectType52);
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
									log.debug('error 596', 'error');
									binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
									binValidateArray.isValid = false;
								}
							} else {
								log.debug('error 602', 'error');
								binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
								binValidateArray.isValid = false;
							}

						}

						labelRecArr.push();
						extlabelRecArr.push();
						impactedRecords.customrecord_wmsse_labelprinting = labelRecArr;
						impactedRecords.customrecord_wmsse_ext_labelprinting = extlabelRecArr;

						binValidateArray.impactedRecords = impactedRecords;
						binValidateArray.isValid = true;
						log.debug({
							title: 'impactedRecords :',
							details: impactedRecords
						});
					} else {
						log.debug('else error 619', 'error');
						if (!utility.isValueValid(binValidateArray.errorMessage))
							binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
						binValidateArray.isValid = false;
					}
				} else {
					log.debug('else error 626', 'error');
					binValidateArray.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
					binValidateArray.isValid = false;
				}
			} catch (e) {
				log.debug('final catch', e);
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

		function fnInvTransfer(itemType, warehouseLocationId, toWarehouseLocationId, itemInternalId, binTransferQty, fromBinInternalId, toBinInternalId, lotName, actualBeginTime, stockUnitName, stockConversionRate, openTaskQty, tallyScanObj, department, customer, preparedBy, deliveryDate, invTranID, rejectType1, rejectType2, rejectType3, rejectType4, rejectType5, rejectType6, rejectType7, rejectType8, rejectType9, rejectType10, rejectType11, rejectType12, rejectType13, rejectType14, rejectType15, rejectType16, rejectType17, rejectType18, rejectType19, rejectType20, rejectType21, rejectType22, rejectType23, rejectType24, rejectType25, rejectType26, rejectType27, rejectType28, rejectType29, rejectType30, rejectType31, rejectType32, rejectType33, rejectType34, rejectType35, rejectType36, rejectType37, rejectType38, rejectType39, rejectType40, rejectType41, rejectType42, rejectType43, rejectType44, rejectType45, rejectType46, rejectType47, rejectType48, rejectType49, rejectType50, rejectType51, rejectType52) {
			var invtransferObj = {};
			var impactRec = {};

			invtransferObj.department = department;
			invtransferObj.customer = customer;
			invtransferObj.preparedBy = preparedBy;
			invtransferObj.invTranID = invTranID;
			invtransferObj.deliveryDate = deliveryDate.value;
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
			log.debug({
				title: 'toWarehouseLocationId value and type',
				details: 'Value: ' + toWarehouseLocationId + ', Type: ' + typeof toWarehouseLocationId
			});
			if (parseInt(toWarehouseLocationId) == 665) {
				log.debug({
					title: 'Condition met',
					details: 'parseInt(toWarehouseLocationId) == 665 is TRUE'
				});
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
				invtransferObj.rejectType27 = rejectType27;
				invtransferObj.rejectType28 = rejectType28;
				invtransferObj.rejectType29 = rejectType29;
				invtransferObj.rejectType30 = rejectType30;
				invtransferObj.rejectType31 = rejectType31;
				invtransferObj.rejectType32 = rejectType32;
				invtransferObj.rejectType33 = rejectType33;
				invtransferObj.rejectType34 = rejectType34;
				invtransferObj.rejectType35 = rejectType35;
				invtransferObj.rejectType36 = rejectType36;
				invtransferObj.rejectType37 = rejectType37;
				invtransferObj.rejectType38 = rejectType38;
				invtransferObj.rejectType39 = rejectType39;
				invtransferObj.rejectType40 = rejectType40;
				invtransferObj.rejectType41 = rejectType41;
				invtransferObj.rejectType42 = rejectType42;
				invtransferObj.rejectType43 = rejectType43;
				invtransferObj.rejectType44 = rejectType44;
				invtransferObj.rejectType45 = rejectType45;
				invtransferObj.rejectType46 = rejectType46;
				invtransferObj.rejectType47 = rejectType47;
				invtransferObj.rejectType48 = rejectType48;
				invtransferObj.rejectType49 = rejectType49;
				invtransferObj.rejectType50 = rejectType50;
				invtransferObj.rejectType51 = rejectType51;
				invtransferObj.rejectType52 = rejectType52;
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
				title: 'before invtUtility.inventoryInvTransfer',
				details: invtransferObj
			})

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