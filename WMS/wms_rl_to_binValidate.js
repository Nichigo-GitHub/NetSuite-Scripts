/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/record', './wms_utility', './big', './wms_translator', './wms_inboundUtility', './wms_inbound_utility'],
	/**
	 * @param {search} search
	 */
	function (search, record, utility, Big, translator, inboundUtility, inboundLib) {

		/**
		 * Function called upon sending a GET request to the RESTlet.
		 *
		 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
		 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
		 * @since 2015.1
		 */
		function doPost(requestBody) {
			var transactionType = '';
			var whLocation = '';
			var orderInternalId = '';
			var tranid = '';
			var fetchedItemId = '';
			var orderLineNo = '';
			var enterBin = '';
			var preferBin = '';
			var enterQty = '';
			var invtStatus = '';
			var lotno = '';
			var lotExpiryDate = '';
			var uom = '';
			var conversionRate = '';
			var actualBeginTime = '';
			var customer = '';
			var remQty = '';
			var binValidateDetails = {};
			var debugString = '';
			var info_receivedQuantity = '';
			var info_remainingQuantity = '';
			var binLocType = '';
			var binIsCart = '';
			var fromStatusInternalId = '';
			var stgTypeArr = [];
			var binInternalId = '';
			var binSearchFilters = [];


			try {
				if (utility.isValueValid(requestBody)) {
					//variables declaration //
					var requestParams = requestBody.params;
					transactionType = requestParams.transactionType;
					whLocation = requestParams.warehouseLocationId;
					orderInternalId = requestParams.transactionInternalId;
					tranid = requestParams.transactionName;
					fetchedItemId = requestParams.itemInternalId;
					orderLineNo = requestParams.transactionLineNo;
					enterBin = requestParams.binName;
					preferBin = requestParams.preferedBinName;
					enterQty = requestParams.scannedQuantity;
					invtStatus = requestParams.statusInternalId;
					var useitemcostflag = 'F';
					lotno = requestParams.lotName;
					lotExpiryDate = requestParams.lotExpiryDate;
					uom = requestParams.stockUnitName;
					conversionRate = requestParams.stockConversionRate;
					actualBeginTime = requestParams.actualBeginTime;
					customer = requestParams.customerId;
					remQty = requestParams.remainingQuantity;
					info_receivedQuantity = requestParams.info_receivedQuantity;
					info_remainingQuantity = requestParams.info_remainingQuantity;
					var isTallyScanRequired = requestParams.isTallyScanRequired;
					var tallyLoopObj = requestParams.tallyLoopObj;
					var locUseBinsFlag = requestParams.locUseBinsFlag;

					log.debug({
						title: 'requestParams',
						details: requestParams
					});

					if (utility.isValueValid(whLocation) && utility.isValueValid(orderInternalId) &&
						utility.isValueValid(tranid) && utility.isValueValid(fetchedItemId) &&
						utility.isValueValid(orderLineNo) && utility.isValueValid(transactionType) &&
						utility.isValueValid(enterQty)) {

						var blnMixItem = false;
						var blnMixLot = false;
						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

						if (transactionType != null && transactionType != '') {
							log.debug('transactionType transactionType', transactionType);
							if (transactionType == 'transferorder') {
								tranType = "Transfer Order";
							}

							log.debug('tranType11', tranType);
						}


						var itemSearchResults = this.getItemCustomDetails(fetchedItemId, whLocation);
						log.debug({
							title: 'itemSearchResults',
							details: itemSearchResults
						});
						if (itemSearchResults.length == 0) {
							binValidateDetails.errorMessage = translator.getTranslationString("PO_QUANTITYVALIDATE.INACTIVE_ITEM");
							binValidateDetails.isValid = false;
						} else {
							var itemSearchObjRes = null;
							var itemInvtLoc = '';
							var itemSearchObj = itemSearchResults[0];
							var isPreferBin = false;
							preferBin = '';
							for (var locRec in itemSearchResults) {
								itemSearchObjRes = itemSearchResults[locRec];
								itemInvtLoc = itemSearchObjRes.location;
								isPreferBin = itemSearchObjRes.preferredbin;
								if (itemInvtLoc == whLocation && (isPreferBin == true)) {
									preferBin = itemSearchObjRes.binnumber;
									break;
								}
							}
							blnMixItem = itemSearchObj.custitem_wmsse_mix_item;
							blnMixLot = itemSearchObj.custitem_wmsse_mix_lot;
							log.debug('blnMixItem', blnMixItem);
							log.debug('blnMixLot', itemSearchObj.custitem_wmsse_mix_lot);
							if ((!utility.isValueValid(enterBin)) && (utility.isValueValid(preferBin))) {
								enterBin = preferBin;
							}
							if (utility.isValueValid(enterBin)) {
								var convertedQty = '';
								if (conversionRate != null && conversionRate != '' && conversionRate != 'null' && conversionRate != 'undefined' &&
									enterQty != null && enterQty != '' && enterQty != 'null' && enterQty != 'undefined') {
									convertedQty = Big(enterQty).mul(conversionRate);
								}

								//var systemRule = utility.getSystemRuleValue('Stage received items before putting away?',whLocation);
								var systemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?', whLocation, tranType);
								log.debug({
									title: 'systemRule',
									details: systemRule
								});
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
								var itemType = itemSearchObj.recordType;
								log.debug('itemType', itemType);
								var boolMixItemRulesStaisfied = true;
								var isValidBin = true;
								if ((itemType != "noninventoryitem" && itemType != "otherchargeitem" && itemType != "serviceitem" && itemType != "downloaditem" && itemType != "giftcertificateitem")) {

									var fulfillmentIdArray = [];
									//var lineFullQty=0;
									useitemcostflag = '';
									var itemcostruleValue = inboundUtility.getItemCostRuleValue();

									var useitemcostSearch = search.load({
										id: 'customsearch_wmsse_useitemcostpreference',
									});
									var useitemcostFilters = useitemcostSearch.filters;

									useitemcostFilters.push(search.createFilter({
										name: 'internalid',
										operator: search.Operator.IS,
										values: orderInternalId
									}));

									useitemcostSearch.filters = useitemcostFilters;
									var transferordervalues = utility.getSearchResultInJSON(useitemcostSearch);

									if (transferordervalues.length > 0) {
										useitemcostflag = transferordervalues[0]['istransferpricecosting'];
									}

									if (!(utility.isValueValid(useitemcostflag)) && useitemcostflag != false && useitemcostflag != true && useitemcostflag != 'false' && useitemcostflag != 'true') {
										useitemcostflag = itemcostruleValue;
									}
									log.debug('useitemcostflag', useitemcostflag);


									var fulfillqtycheck = 'F';

									log.debug('orderLineNo', orderLineNo);
									var toLineDetailsSearch = search.load({
										id: 'customsearch_wmsse_transf_fulfill_detail'
									});
									var toLineDetailsFilters = toLineDetailsSearch.filters;

									if (utility.isValueValid(orderInternalId)) {
										toLineDetailsFilters.push(search.createFilter({
											name: 'internalid',
											operator: search.Operator.ANYOF,
											values: orderInternalId
										}));
										toLineDetailsFilters.push(search.createFilter({
											name: 'transactionlinetype',
											operator: search.Operator.IS,
											values: 'SHIPPING'
										}));
										toLineDetailsFilters.push(search.createFilter({
											name: 'item',
											operator: search.Operator.ANYOF,
											values: fetchedItemId
										}));
									}

									toLineDetailsSearch.filters = toLineDetailsFilters;
									var TOLineDetails = utility.getSearchResultInJSON(toLineDetailsSearch);
									var TOLineDetailsLength = TOLineDetails.length;
									if (TOLineDetailsLength > 0) {
										log.debug('TOLineDetails', TOLineDetails);
										log.debug('TOLineDetails', TOLineDetailsLength);
										var fullFillmentQuantity = 0;
										for (var d = 0; d < TOLineDetailsLength; d++) {
											var itemfulfillmentId = TOLineDetails[d]['internalid'];
											var itemfulfillmentItemId = TOLineDetails[d]['item'];
											if (itemfulfillmentId != null && itemfulfillmentId != 'null' && itemfulfillmentId != undefined &&
												itemfulfillmentId != '' && (parseInt(fetchedItemId) == (itemfulfillmentItemId))) {
												var frecord = record.load({
													type: record.Type.ITEM_FULFILLMENT,
													id: itemfulfillmentId,
													isDynamic: true
												});
												var fulfillmentItemCount = frecord.getLineCount({
													sublistId: 'item'
												});
												log.debug('fulfillmentItemCount', fulfillmentItemCount);
												log.debug('fetchedItemId', fetchedItemId);

												for (var f = 0; f < fulfillmentItemCount; f++) {
													var fitem = frecord.getSublistValue({
														sublistId: 'item',
														fieldId: 'item',
														line: f
													});
													var fline = frecord.getSublistValue({
														sublistId: 'item',
														fieldId: 'orderline',
														line: f
													});
													var inventorydetail = frecord.getSublistValue({
														sublistId: 'item',
														fieldId: 'inventorydetail',
														line: f
													});
													var tofline = parseInt(fline) + 1;

													if ((fitem == fetchedItemId) && (parseInt(orderLineNo) == (parseInt(tofline) - 2)) &&
														fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {

														frecord.selectLine({
															sublistId: 'item',
															line: f
														});

														var compSubRecord;
														if (utility.isValueValid(inventorydetail)) {
															compSubRecord = frecord.getCurrentSublistSubrecord({
																sublistId: 'item',
																fieldId: 'inventorydetail'
															});
														} else {
															if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																fulfillmentIdArray.push(itemfulfillmentId);
															}
														}


														var ordlinelength = 0;
														if (compSubRecord != null && compSubRecord != '' && compSubRecord != 'null') {
															ordlinelength = compSubRecord.getLineCount({
																sublistId: 'inventoryassignment'
															});
														}

														if (itemType == "inventoryitem" || itemType == "assemblyitem") {
															var fromStatusInternalId = '';
															for (var cnt = 0; cnt < ordlinelength; cnt++) {
																compSubRecord.selectLine({
																	sublistId: 'inventoryassignment',
																	line: cnt
																});
																log.debug({
																	title: 'inventoryStatusFeature',
																	details: inventoryStatusFeature
																});
																if (inventoryStatusFeature) {
																	fromStatusInternalId = compSubRecord.getSublistValue({
																		sublistId: 'inventoryassignment',
																		fieldId: 'inventorystatus',
																		line: cnt
																	});
																	if (fromStatusInternalId == invtStatus) {
																		if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																			fulfillmentIdArray.push(itemfulfillmentId);
																			break;
																		}
																	}
																} else {
																	if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																		fulfillmentIdArray.push(itemfulfillmentId);
																		break;
																	}
																}
															}
														} else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
															var fromStatusInternalId = '';
															for (var cnt = 0; cnt < ordlinelength; cnt++) {
																compSubRecord.selectLine({
																	sublistId: 'inventoryassignment',
																	line: cnt
																});
																var fulfilledLotName = compSubRecord.getSublistText({
																	sublistId: 'inventoryassignment',
																	fieldId: 'issueinventorynumber',
																	line: cnt
																});
																if (inventoryStatusFeature) {
																	fromStatusInternalId = compSubRecord.getSublistValue({
																		sublistId: 'inventoryassignment',
																		fieldId: 'inventorystatus',
																		line: cnt
																	});

																	if (fromStatusInternalId == invtStatus && fulfilledLotName == lotno) {
																		if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																			fulfillmentIdArray.push(itemfulfillmentId);
																			break;
																		}

																	}
																} else {
																	if (fulfilledLotName == lotno) {

																		if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																			fulfillmentIdArray.push(itemfulfillmentId);
																			break;
																		}
																	}

																}

															}
														} else {

															var fromStatusInternalId = '';
															for (var cnt = 0; cnt < ordlinelength; cnt++) {
																compSubRecord.selectLine({
																	sublistId: 'inventoryassignment',
																	line: cnt
																});
																if (inventoryStatusFeature) {
																	fromStatusInternalId = compSubRecord.getSublistValue({
																		sublistId: 'inventoryassignment',
																		fieldId: 'inventorystatus',
																		line: cnt
																	});
																	if (fromStatusInternalId == invtStatus) {

																		if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																			fulfillmentIdArray.push(itemfulfillmentId);
																			break;
																		}
																	}
																} else {
																	if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
																		fulfillmentIdArray.push(itemfulfillmentId);
																		break;
																	}
																}
															}
														}

													}
												}
											}
										}

									}
									log.debug('fulfillmentIdArray', fulfillmentIdArray);
									if (fulfillmentIdArray.length == 0) {
										binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATION.QTY_ASPERFULFILL');
										binValidateDetails.isValid = false;
										isValidBin = false;
									}

									if (systemRule == 'N') {

										if (preferBin != enterBin) {
											if (BinlocationTypes != null && BinlocationTypes != '' && BinlocationTypes.length > 0) {
												stgTypeArr.push('Stage');
												stgTypeArr.push('WIP');
												stageLocArr = utility.getStageLocations(stgTypeArr, BinlocationTypes);
											}
											if (utility.isValueValid(enterBin)) {
												binSearchFilters.push(search.createFilter({
													name: 'binnumber',
													operator: search.Operator.IS,
													values: enterBin
												}));
											}
											binSearchFilters.push(search.createFilter({
												name: 'inactive',
												operator: search.Operator.IS,
												values: false
											}));
											if (utility.isValueValid(whLocation)) {
												binSearchFilters.push(search.createFilter({
													name: 'location',
													operator: search.Operator.ANYOF,
													values: whLocation
												}));
											}

											if (stageLocArr.length > 0) {
												var stgBinId = utility.getBinInternalId(enterBin, whLocation);

												var binLookUp = search.lookupFields({
													type: search.Type.BIN,
													id: stgBinId,
													columns: ['custrecord_wms_iscart', 'custrecord_wmsse_bin_loc_type']
												});

												if (utility.isValueValid(binLookUp) && utility.isValueValid(binLookUp.custrecord_wms_iscart) && binLookUp.custrecord_wms_iscart == true) {
													binSearchFilters.push(search.createFilter({
														name: 'custrecord_wmsse_bin_loc_type',
														operator: search.Operator.ANYOF,
														values: stageLocArr
													}));

													binLocType = 'Stage';
													binIsCart = binLookUp.custrecord_wms_iscart;
												} else {
													binSearchFilters.push(search.createFilter({
														name: 'custrecord_wmsse_bin_loc_type',
														operator: search.Operator.NONEOF,
														values: stageLocArr
													}));
												}

											}
											var searchrecord = search.create({
												type: 'Bin',
												filters: binSearchFilters
											});
											var binSearchResults = searchrecord.run().getRange({
												start: 0,
												end: 1000
											});

											if (utility.isValueValid(binSearchResults)) {
												binInternalId = binSearchResults[0].id;
											}
											log.debug({
												title: 'binInternalId',
												details: binInternalId
											});
											if (!utility.isValueValid(binInternalId))

											{
												binValidateDetails.errorMessage = translator.getTranslationString("TO_BINVALIDATE.INVALID_BIN");
												binValidateDetails.isValid = false;
												isValidBin = false;
											}
										} else {
											binInternalId = utility.getBinInternalId(enterBin, whLocation);
											if (blnMixItem == false || blnMixLot == false) {
												if (enterBin != preferBin && binInternalId != '' && binInternalId != null) {
													if (!blnMixItem) {
														var objInvDetails = this.getItemInventoryDetails(fetchedItemId, whLocation, binInternalId);

														if (objInvDetails != null && objInvDetails != '') {
															if (objInvDetails.length > 0) {
																binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.MIXITEMS_FALSE');
																binValidateDetails.isValid = false;
																boolMixItemRulesStaisfied = false;
																isValidBin = false;
															}
														}
													}
													if ((!blnMixLot) && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {

														var objInvDetails = getLotItemInventoryDetails(whLocation, binInternalId, lotno);
														if (objInvDetails != null && objInvDetails != '') {
															if (objInvDetails.length > 0) {
																binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.MIXLOTS_FALSE');
																binValidateDetails.isValid = false;
																boolMixItemRulesStaisfied = false;
																isValidBin = false;
															}
														}
													}
												}
											}
										}
									} //if stage system rule is 'Y' 
									else {
										if (BinlocationTypes != null && BinlocationTypes != '' && BinlocationTypes.length > 0) {
											stgTypeArr.push('Stage');
											stageLocArr = utility.getStageLocations(stgTypeArr, BinlocationTypes);
										}
										var searchrecord = search.create({
											type: 'Bin',
											columns: [{
													name: 'custrecord_wmsse_bin_stg_direction'
												},
												{
													name: 'custrecord_wmsse_bin_loc_type'
												},
												{
													name: 'custrecord_wms_iscart'
												}
											]
										});
										if (enterBin != null && enterBin != '') {
											binSearchFilters.push(search.createFilter({
												name: 'binnumber',
												operator: search.Operator.IS,
												values: enterBin
											}));
										}
										binSearchFilters.push(search.createFilter({
											name: 'inactive',
											operator: search.Operator.IS,
											values: false
										}));
										if (whLocation != null && whLocation != '') {
											binSearchFilters.push(search.createFilter({
												name: 'location',
												operator: search.Operator.ANYOF,
												values: whLocation
											}));
										}

										searchrecord.filters = binSearchFilters;

										var binSearchResults = searchrecord.run().getRange({
											start: 0,
											end: 1000
										});

										log.debug({
											title: 'binSearchResults',
											details: binSearchResults
										});
										if (binSearchResults != null && binSearchResults != "") {
											if (stageLocArr.indexOf(binSearchResults[0].getValue({
													name: 'custrecord_wmsse_bin_loc_type'
												})) == -1) {
												binValidateDetails.errorMessage = translator.getTranslationString("TO_BINVALIDATE.NOT_STAGEBIN");
												binValidateDetails.isValid = false;
												isValidBin = false;
											} else if (binSearchResults[0].getValue({
													name: 'custrecord_wmsse_bin_stg_direction'
												}) != 1) {
												binValidateDetails.errorMessage = translator.getTranslationString("TO_BINVALIDATE.INVALID_BIN_DIRECTION");
												binValidateDetails.isValid = false;
												isValidBin = false;
											} else {
												binInternalId = binSearchResults[0].id;
												binLocType = 'Stage';
												if (utility.isValueValid(binSearchResults[0].getValue({
														name: 'custrecord_wms_iscart'
													})) && binSearchResults[0].getValue({
														name: 'custrecord_wms_iscart'
													}) == true) {
													binIsCart = binSearchResults[0].getValue({
														name: 'custrecord_wms_iscart'
													});
												}
											}

										}
										if (binSearchResults == '' || binSearchResults == null) {
											binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.INVALID_STAGEBIN');
											binValidateDetails.isValid = false;
											isValidBin = false;
										}
									}
								}
								if (!utility.isValueValid(locUseBinsFlag)) {
									if (utility.isValueValid(info_receivedQuantity) && utility.isValueValid(info_remainingQuantity)) {
										if (utility.isValueValid(uom)) {
											var index = info_receivedQuantity.indexOf(' ');
											info_receivedQuantity = parseFloat(info_receivedQuantity.toString().substring(0, index == -1 ? 1 : index)) + parseFloat(enterQty);
											index = info_remainingQuantity.indexOf(' ');
											info_remainingQuantity = parseFloat(info_remainingQuantity.toString().substring(0, index == -1 ? 1 : index)) - parseFloat(enterQty);

											info_receivedQuantity = info_receivedQuantity == 0 ? '0' : info_receivedQuantity + ' ' + uom;
											info_remainingQuantity = info_remainingQuantity == 0 ? '0' : info_remainingQuantity + ' ' + uom;
										} else {
											info_receivedQuantity = parseFloat(info_receivedQuantity) + parseFloat(enterQty);
											info_remainingQuantity = parseFloat(info_remainingQuantity) - parseFloat(enterQty);
										}
									}
								}

								binValidateDetails.info_receivedQuantity = info_receivedQuantity;
								binValidateDetails.info_remainingQuantity = info_remainingQuantity;


								var systemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?', whLocation, transactionType);
								log.debug('systemRuleValue', systemRuleValue);
								var tempflag = true;
								if (isValidBin) {
									if (systemRuleValue == 'Y') {
										var poitemLineDetails = inboundUtility.getRecevingOrderItemDetails(tranid, fetchedItemId, whLocation, orderLineNo, null, null, transactionType, null);
										if (poitemLineDetails.length > 0) {
											var poLineDetailsRec = poitemLineDetails[0];
											var poId = poLineDetailsRec.internalid;
											var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(poId, whLocation, fetchedItemId, orderLineNo);
											if (JSON.stringify(openPutAwayDetails) !== '{}') {

												var vpoitemOPentaskRcvQty = openPutAwayDetails[orderLineNo];

												if (utility.isValueValid(vpoitemOPentaskRcvQty)) {
													var poLineReceivedQty = poLineDetailsRec.totalReceivedQty;
													var poLineRemainingQty = poLineDetailsRec.TransferOrderLine_Remainingqty;
													poLineDetailsRec.totalReceivedQty = Number(Big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));
													poLineDetailsRec.TransferOrderLine_Remainingqty = Number(Big(poLineRemainingQty).plus(vpoitemOPentaskRcvQty));
												}
											}
											var vPoreminqty = poLineDetailsRec.TransferOrderLine_Remainingqty;
											if (parseFloat(vPoreminqty) <= 0) {
												tempflag = false;
											}
										} else {
											tempflag = false;
										}
										if (!tempflag) {
											binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.TRANSACTION_COMPLETED');
											binValidateDetails.isValid = false;
										}
									}
									if (tempflag) {
										if ((itemType == "noninventoryitem" || itemType == "otherchargeitem" || itemType == "serviceitem" || itemType == "downloaditem" || itemType == "giftcertificateitem")) {

											binInternalId = '';
										}
										var postIrObj = {};
										postIrObj.transactionType = transactionType;
										postIrObj.poInternalId = orderInternalId;
										postIrObj.fetchedItemId = fetchedItemId;
										postIrObj.poLineno = orderLineNo;
										postIrObj.enterQty = enterQty;
										postIrObj.binInternalId = binInternalId;
										postIrObj.itemType = itemType;
										postIrObj.whLocation = whLocation;
										postIrObj.lotno = lotno;
										postIrObj.lotExpiryDate = lotExpiryDate;
										postIrObj.tranid = tranid;
										postIrObj.actualBeginTime = actualBeginTime;
										postIrObj.customer = customer;
										postIrObj.uom = uom;
										postIrObj.conversionRate = conversionRate;
										postIrObj.useitemcostflag = useitemcostflag;
										postIrObj.systemRuleValue = systemRuleValue;
										postIrObj.invtStatus = invtStatus;
										postIrObj.fifoDate = null;
										postIrObj.PutStrategy = null;
										postIrObj.zoneno = null;
										postIrObj.TOLineDetails = fulfillmentIdArray;
										postIrObj.binLocType = binLocType;
										postIrObj.binIsCart = binIsCart;

										if (isTallyScanRequired == true) {
											tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
											postIrObj.isTallyScanRequired = isTallyScanRequired;
											postIrObj.tallyLoopObj = tallyLoopObj;
											postIrObj.selectedConversionRate = requestParams.selectedConversionRateForTallyScan;
										}


										//	postIrObj['lineFullQty']=lineFullQty;
										log.debug({
											title: 'postIrObj',
											details: postIrObj
										});
										var itemReceipt = inboundLib.postItemReceipt(postIrObj);
										log.debug({
											title: 'itemReceipt',
											details: itemReceipt
										});


										// No Code Solution Changes begin here
										var impactedRecords = {};
										impactedRecords = inboundUtility.noCodeSolForReceiving(orderInternalId, orderLineNo, itemReceipt, transactionType, '', false);
										log.debug({
											title: 'impactedRecords :',
											details: impactedRecords
										});
										//No Code Solution ends here.


										if (utility.isValueValid(itemReceipt)) {
											var poLineDetails = inboundUtility.getRecevingOrderItemDetails(tranid, null, whLocation, null, orderInternalId, '', transactionType);
											log.debug({
												title: 'poLineDetails new',
												details: poLineDetails
											});
											if (poLineDetails != null && poLineDetails.length > 0) {
												var poId = poLineDetails[0]['internalid'];
												var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(poId, whLocation);
												var vCount = 0;
												var vPoReminqty = 0;
												var poLineReceivedQty = 0;
												var poLineRemainingQty = 0;
												for (var cnt in poLineDetails) {
													var poLineArr = poLineDetails[cnt];
													var poLine = poLineArr['line'];
													if (JSON.stringify(openPutAwayDetails) !== '{}') {
														var vpoitemOPentaskRcvQty = openPutAwayDetails[poLine];
														if (utility.isValueValid(vpoitemOPentaskRcvQty)) {
															poLineReceivedQty = poLineArr.totalReceivedQty;
															poLineRemainingQty = poLineArr.TransferOrderLine_Remainingqty;
															poLineArr.totalReceivedQty = Number(Big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));
															poLineArr.TransferOrderLine_Remainingqty = Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
														}
													}
													vPoReminqty = poLineArr['TransferOrderLine_Remainingqty'];

													if (parseFloat(vPoReminqty) > 0) {
														vCount++;
														break;
													}

												}
												if (parseFloat(vCount) > 0) {
													binValidateDetails.isValid = true;
													binValidateDetails.custparam_count = vCount;
													binValidateDetails.systemRuleValue = systemRuleValue;

												} else {
													binValidateDetails.isValid = true;
													binValidateDetails.custparam_count = 0;
													binValidateDetails.systemRuleValue = systemRuleValue;
												}
												binValidateDetails.impactedRecords = impactedRecords;
											} else {
												binValidateDetails.isValid = true;
												binValidateDetails.custparam_count = 0;
												binValidateDetails.systemRuleValue = systemRuleValue;
												binValidateDetails.impactedRecords = impactedRecords;
											}

										}

									} else {
										binValidateDetails.isValid = false;
									}
								}
							} else {
								binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.INVALID_BIN');
								binValidateDetails.isValid = false;
							}
						}
					} else {
						binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.INVALID_INPUT');
						binValidateDetails.isValid = false;
					}
				} else {
					binValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.INVALID_INPUT');
					binValidateDetails.isValid = false;
				}
			} catch (e) {
				binValidateDetails.isValid = false;
				binValidateDetails.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}
			return binValidateDetails;

		}

		function getItemCustomDetails(fetchedItemId, whLocation) {
			var itemSearch = search.load({
				id: 'customsearch_wmsse_receivingitemdetails'
			});
			var itemSearchFilters = itemSearch.filters;
			if (utility.isValueValid(fetchedItemId)) {
				itemSearchFilters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: fetchedItemId
				}));
			}
			itemSearchFilters.push(
				search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));
			if (utility.isValueValid(whLocation)) {
				itemSearchFilters.push(search.createFilter({
					name: 'inventorylocation',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', whLocation]
				}));

			}
			itemSearch.filters = itemSearchFilters;
			var itemSrchResults = utility.getSearchResultInJSON(itemSearch);
			return itemSrchResults;
		}

		function getItemInventoryDetails(fetchedItemId, whLocation, binInternalId) {
			var invDetailsSearch = search.load({
				id: 'customsearch_wmsse_itemwise_invt_inbound'
			});
			var invDeialsFilters = invDetailsSearch.filters;
			if (utility.isValueValid(fetchedItemId)) {
				invDeialsFilters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.NONEOF,
					values: fetchedItemId
				}));
			}

			if (utility.isValueValid(whLocation)) {
				invDeialsFilters.push(search.createFilter({
					name: 'location',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			if (utility.isValueValid(binInternalId)) {
				invDeialsFilters.push(search.createFilter({
					name: 'binnumber',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}

			invDetailsSearch.filters = invDeialsFilters;
			var itemInvDetails = utility.getSearchResultInJSON(invDetailsSearch);
			return itemInvDetails;

		}

		function getLotItemInventoryDetails(whLocation, binInternalId, lotno) {
			var invDetailsSearch = search.load({
				id: 'customsearch_wmsse_itemwise_lots'
			});
			var invDeialsFilters = invDetailsSearch.filters;

			if (utility.isValueValid(whLocation)) {
				invDeialsFilters.push(search.createFilter({
					name: 'location',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			if (utility.isValueValid(binInternalId)) {
				invDeialsFilters.push(search.createFilter({
					name: 'binnumber',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			if (utility.isValueValid(lotno)) {
				invDeialsFilters.push(search.createFilter({
					name: 'inventorynumber',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ISNOT,
					values: lotno
				}));
			}
			invDeialsFilters.push(search.createFilter({
				name: 'islotitem',
				operator: search.Operator.IS,
				values: true
			}));
			invDetailsSearch.filters = invDeialsFilters;
			var lotItemInventoryDetails = utility.getSearchResultInJSON(invDetailsSearch);
			return lotItemInventoryDetails;
		}

		return {
			'post': doPost,
			'getItemCustomDetails': getItemCustomDetails,
			'getItemInventoryDetails': getItemInventoryDetails
		};

	});