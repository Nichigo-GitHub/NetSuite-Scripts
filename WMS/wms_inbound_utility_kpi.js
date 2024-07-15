/**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search', 'N/runtime', 'N/record', 'N/format', './big', './wms_translator', './wms_utility', 'N/query', './wms_inboundUtility'],
	function (search, runtime, record, format, Big, translator, utility, query, inboundUtility) {
		function consolidatePostItemReceipt(trecord, actQuantity, linenum, itemId, transactionType, batchNo, expiryDate, whLocationId, enterBin, serialArray, opentaskSearchResults, transactionInternalId, itrValue, randomTallyScanRule, declaredQty) {
			try {
				var compSubRecord = null;
				var commitflag = 'N';
				var isSerialItem = '';
				var isLotItem = '';
				var isInventoryItem = '';
				var itemLineNo = '';
				var item_id = '';
				var itemrec = '';
				var itemType = '';
				var polinelength = trecord.getLineCount({
					sublistId: 'item'
				});
				if (itrValue == 0) {
					for (var irItr = 0; irItr < polinelength; irItr++) {
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'itemreceive',
							line: irItr,
							value: false
						});
					}
				}
				for (var irItr = 0; irItr < polinelength; irItr++) {
					itemLineNo = trecord.getSublistValue({
						sublistId: 'item',
						fieldId: 'line',
						line: irItr
					});
					item_id = trecord.getSublistValue({
						sublistId: 'item',
						fieldId: 'item',
						line: irItr
					});
					itemrec = trecord.getSublistValue({
						sublistId: 'item',
						fieldId: 'itemreceive',
						line: irItr
					});
					quantity = actQuantity;
					if (transactionType == 'transferorder') {
						itemLineNo = parseInt(itemLineNo) - parseInt(2);
					}
					if (itemLineNo == linenum) {
						isSerialItem = trecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'isserial',
							line: irItr
						});
						isLotItem = trecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'isnumbered',
							line: irItr
						});
						isInventoryItem = trecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'invttype',
							line: irItr
						});
						if (isSerialItem == 'T') {
							itemType = 'serializedinventoryitem';
						} else if (isLotItem == 'T') {
							itemType = 'lotnumberedinventoryitem';
						} else if (isInventoryItem == 'T') {
							itemType = 'inventoryitem';
						} else {}
						var totallineQty = 0;
						for (var otItr = 0; otItr < opentaskSearchResults.length; otItr++) {
							var opentaskLinenum = opentaskSearchResults[otItr]['custrecord_wmsse_line_no'];
							if (opentaskLinenum == linenum) {
								var actlineQuantity = opentaskSearchResults[otItr]['custrecord_wmsse_act_qty'];
								totallineQty = Big(totallineQty).plus(actlineQuantity);
								if (utility.isValueValid(opentaskSearchResults[otItr]['custrecord_wmsse_restock']) && (opentaskSearchResults[otItr]['custrecord_wmsse_restock'] == true || opentaskSearchResults[otItr]['custrecord_wmsse_restock'] == false)) {
									var restock = opentaskSearchResults[otItr]['custrecord_wmsse_restock'];
								}
							}
						}
						var whLocation = trecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'location',
							line: irItr
						});
						if (whLocation == null || whLocation == "")
							whLocation = whLocationId;
						commitflag = 'Y';
						trecord.setSublistValue({
							sublistId: 'item',
							line: irItr,
							fieldId: 'itemreceive',
							value: true
						});
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'quantity',
							line: irItr,
							value: Number(Big(totallineQty).toFixed(5))
						});
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol68',
							line: irItr,
							value: declaredQty
						});
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'location',
							line: irItr,
							value: whLocation
						});
						if (utility.isValueValid(transactionType) && transactionType == 'returnauthorization' && utility.isValueValid(restock) && restock == false) {
							trecord.setSublistValue({
								sublistId: 'item',
								fieldId: 'restock',
								line: irItr,
								value: false
							});
						} else if (utility.isValueValid(transactionType) && transactionType == 'returnauthorization' && utility.isValueValid(restock) && restock == true) {
							trecord.setSublistValue({
								sublistId: 'item',
								fieldId: 'restock',
								line: irItr,
								value: true
							});
						}
						if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem" || itemType == "lotnumberedinventoryitem" ||
							itemType == "lotnumberedassemblyitem" || itemType == "inventoryitem" || itemType == "assemblyitem") {
							var compSubRecord = trecord.getSublistSubrecord({
								sublistId: 'item',
								fieldId: 'inventorydetail',
								line: irItr
							});
							var complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							if (parseInt(complinelength) > 0) {
								for (var invassItr = 0; invassItr < complinelength; invassItr++) {
									compSubRecord.removeLine({
										sublistId: 'inventoryassignment',
										line: 0
									});
								}
							}
							complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
								for (var r2 = 0; r2 < opentaskSearchResults.length; r2++) {
									var opentaskLinenumber = opentaskSearchResults[r2]['custrecord_wmsse_line_no'];
									var vInvStatus_select = opentaskSearchResults[r2]['custrecord_wmsse_inventorystatus'];
									var openTaskBatchno = opentaskSearchResults[r2]['custrecord_wmsse_batch_num'];
									var opentaskQuantity = opentaskSearchResults[r2]['custrecord_wmsse_act_qty'];
									var opentaskbin = opentaskSearchResults[r2]['custrecord_wmsse_actendloc'];
									if (utility.isValueValid(randomTallyScanRule) && randomTallyScanRule == "T") {
										opentaskbin = enterBin;
									}
									expiryDate = opentaskSearchResults[r2].custrecord_wmsse_expirydate;
									if (opentaskLinenumber == linenum) {
										compSubRecord.insertLine({
											sublistId: 'inventoryassignment',
											line: complinelength
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: complinelength,
											value: Number(Big(opentaskQuantity).toFixed(5))
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'receiptinventorynumber',
											line: complinelength,
											value: openTaskBatchno
										});
										if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'binnumber',
												line: complinelength,
												value: opentaskbin
											});
										if (expiryDate != undefined && expiryDate != null && expiryDate != "" && expiryDate != 'null') {
											var parsedExpiryDate = format.parse({
												value: expiryDate,
												type: format.Type.DATE
											});
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'expirationdate',
												line: complinelength,
												value: parsedExpiryDate
											});
										}
										if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'inventorystatus',
												line: complinelength,
												value: vInvStatus_select
											});
										complinelength++;
									}
								}
							} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
								var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
								var noBinFlag = true;
								if (inventoryStatusFeature == false) {
									var locationUseBinlFlag = true;
									var columnlocationlookupArray = [];
									columnlocationlookupArray.push('usesbins');
									var locationLookUp = utility.getLocationFieldsByLookup(whLocationId, columnlocationlookupArray);
									if (locationLookUp.usesbins != undefined) {
										locationUseBinlFlag = locationLookUp.usesbins;
									}
									if (locationUseBinlFlag != true) {
										noBinFlag = false;
									}
								}
								if (noBinFlag) {
									for (var r1 = 0; r1 < opentaskSearchResults.length; r1++) {
										var opentaskLinenumber = opentaskSearchResults[r1]['custrecord_wmsse_line_no'];
										var vInvStatus_select = opentaskSearchResults[r1]['custrecord_wmsse_inventorystatus'];
										var opentaskQuantity = opentaskSearchResults[r1]['custrecord_wmsse_act_qty'];
										var opentaskbin = opentaskSearchResults[r1]['custrecord_wmsse_actendloc'];
										if (utility.isValueValid(randomTallyScanRule) && randomTallyScanRule == "T") {
											opentaskbin = enterBin;
										}
										if (opentaskLinenumber == linenum) {
											compSubRecord.insertLine({
												sublistId: 'inventoryassignment',
												line: complinelength
											});
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: complinelength,
												value: Number(Big(opentaskQuantity).toFixed(5))
											});
											if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'binnumber',
													line: complinelength,
													value: opentaskbin
												});
											if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'inventorystatus',
													line: complinelength,
													value: vInvStatus_select
												});
											complinelength++;
										}
									}
								}
							} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
								var opentaskLinenumberArray = [];
								var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
								var attachedSerials = [];
								var sublistLineIndex = attachedSerials.length;
								for (var r3 = 0; r3 < opentaskSearchResults.length; r3++) {
									var opentaskLinenumber = opentaskSearchResults[r3]['custrecord_wmsse_line_no'];
									if (opentaskLinenumber == linenum) {
										if (inventoryStatusFeature == true) {
											if (opentaskLinenumberArray.indexOf(opentaskLinenumber) == -1) {
												opentaskLinenumberArray.push(opentaskLinenumber);
												var serialSearch = search.load({
													id: 'customsearch_wmsse_wo_serialentry_srh',
												});
												var serailFilters = serialSearch.filters;
												serailFilters.push(search.createFilter({
													name: 'custrecord_wmsse_ser_ordline',
													operator: search.Operator.EQUALTO,
													values: linenum
												}));
												serailFilters.push(search.createFilter({
													name: 'custrecord_wmsse_ser_ordno',
													operator: search.Operator.ANYOF,
													values: transactionInternalId
												}));
												serialSearch.filters = serailFilters;
												var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
												var serialSearchResultsLength = serialSearchResults.length;
												if (serialSearchResultsLength > 0) {
													log.debug('serialSearchResults', serialSearchResults);
													for (var n = 0; n < serialSearchResultsLength; n++) {
														compSubRecord.insertLine({
															sublistId: 'inventoryassignment',
															line: n
														});
														vInvStatus_select = serialSearchResults[n]['custrecord_serial_inventorystatus'];
														var opentaskbin = serialSearchResults[n]['custrecord_wmsse_ser_bin'];
														if (utility.isValueValid(randomTallyScanRule) && randomTallyScanRule == "T") {
															opentaskbin = enterBin;
														}
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'quantity',
															line: n,
															value: 1
														});
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'receiptinventorynumber',
															line: n,
															value: serialSearchResults[n]['custrecord_wmsse_ser_no']
														});
														if (utility.isValueValid(opentaskbin)) {
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'binnumber',
																line: n,
																value: opentaskbin
															});
														}
														if (utility.isValueValid(vInvStatus_select)) {
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'inventorystatus',
																line: n,
																value: vInvStatus_select
															});
														}
													}
												}
											}
										} else {
											var opentaskQuantity = opentaskSearchResults[r3]['custrecord_wmsse_act_qty'];
											var opentaskserialArray = opentaskSearchResults[r3]['custrecord_wmsse_serial_no'];
											var opentaskbin = opentaskSearchResults[r3]['custrecord_wmsse_actendloc'];
											if (utility.isValueValid(randomTallyScanRule) && randomTallyScanRule == "T") {
												opentaskbin = enterBin;
											}
											var totalSerialArray = opentaskserialArray.split(',');
											var complinelength = compSubRecord.getLineCount({
												sublistId: 'inventoryassignment'
											});
											if (parseInt(complinelength) > 0 && r3 == 0) {
												for (var vItr = 0; vItr < complinelength; vItr++) {
													compSubRecord.removeLine({
														sublistId: 'inventoryassignment',
														line: 0
													});
												}
											}
											complinelength = compSubRecord.getLineCount({
												sublistId: 'inventoryassignment'
											});

											for (var k1 = 0; k1 < totalSerialArray.length; k1++) {
												if (attachedSerials.indexOf(totalSerialArray[k1]) == -1) {
													sublistLineIndex = attachedSerials.length;
													compSubRecord.insertLine({
														sublistId: 'inventoryassignment',
														line: complinelength
													});
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'quantity',
														line: sublistLineIndex,
														value: 1
													});
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'receiptinventorynumber',
														line: sublistLineIndex,
														value: totalSerialArray[k1]
													});
													if (utility.isValueValid(opentaskbin)) {
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'binnumber',
															line: sublistLineIndex,
															value: opentaskbin
														});
													}
													complinelength++;
													attachedSerials.push(totalSerialArray[k1]);
												}
											}
										}
									}
								}
								updateSerialNumbersStatus(linenum, transactionInternalId);
							}
						}
						break;
					}
				}
			} catch (e) {
				log.error({
					title: 'e',
					details: e
				});
			}
		}

		function updateSerialNumbersStatus(linenum, transactionInternalId) {
			var serialSearch = search.load({
				id: 'customsearch_wmsse_serialentry_details',
			});
			var serailFilters = serialSearch.filters;
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordline',
				operator: search.Operator.EQUALTO,
				values: linenum
			}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_status',
				operator: search.Operator.IS,
				values: false
			}));
			serialSearch.filters = serailFilters;
			var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
			if (serialSearchResults.length > 0) {
				for (var j3 = 0; j3 < serialSearchResults.length; j3++) {
					var vid = serialSearchResults[j3]['id'];
					var id = record.submitFields({
						type: 'customrecord_wmsse_serialentry',
						id: vid,
						values: {
							'custrecord_wmsse_ser_note1': 'because of serial number is updated in opentask we have marked this serial number as closed',
							'custrecord_wmsse_ser_status': true
						}
					});
				}
			}
		}

		function consolidatePostItemReceiptforTO(transactionInternalId, warehouseLocationId, opentaskSearchResults) {
			try {
				var idl = '';
				var trecord = '';
				var vitemfulfillmentid = '';
				var trecord = '';
				var toLineDetailsSearch = search.load({
					id: 'customsearch_wmsse_transf_fulfill_detail'
				});
				var toLineDetailsFilters = toLineDetailsSearch.filters;
				var itemindex = 1;
				if (utility.isValueValid(transactionInternalId)) {
					toLineDetailsFilters.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: transactionInternalId
					}));
				}
				toLineDetailsFilters.push(search.createFilter({
					name: 'type',
					operator: search.Operator.ANYOF,
					values: 'TrnfrOrd'
				}));
				toLineDetailsFilters.push(search.createFilter({
					name: 'formulatext',
					operator: search.Operator.IS,
					formula: "decode({type},'Transfer Order',{transactionlinetype},'Shipping')",
					values: "Shipping"
				}));
				toLineDetailsSearch.filters = toLineDetailsFilters;
				var TOLineDetailsNew = utility.getSearchResultInJSON(toLineDetailsSearch);
				var vitemfulfillmentid = '';
				if (TOLineDetailsNew.length > 0) {
					var TOLineDetails = [];
					var alreadyPostIRopenTaskDetails = {};
					var remainingqty = 0;
					for (var ifItr = 0; ifItr < TOLineDetailsNew.length; ifItr++) {
						vitemfulfillmentid = TOLineDetailsNew[ifItr]['internalid'];
						vitemfulfillmentitemid = TOLineDetailsNew[ifItr]['item'];
						vitemfulfillmentqty = TOLineDetailsNew[ifItr]['quantity'];
						if (vitemfulfillmentid != null && vitemfulfillmentid != 'null' && vitemfulfillmentid != undefined &&
							vitemfulfillmentid != '' && TOLineDetails.indexOf(parseInt(vitemfulfillmentid)) == -1) {
							TOLineDetails.push(parseInt(vitemfulfillmentid));
						}
					}
					for (var postitemItr = 0; postitemItr < TOLineDetails.length; postitemItr++) {
						try {
							vitemfulfillmentid = TOLineDetails[postitemItr];
							var frecord = record.load({
								type: record.Type.ITEM_FULFILLMENT,
								id: vitemfulfillmentid,
								isDynamic: true
							});
							trecord = record.transform({
								fromType: record.Type.TRANSFER_ORDER,
								fromId: transactionInternalId,
								toType: record.Type.ITEM_RECEIPT,
								defaultValues: {
									itemfulfillment: vitemfulfillmentid
								},
								isDynamic: false
							});
							var tolinelength = trecord.getLineCount({
								sublistId: 'item'
							});
							var openTaskIdArr = [];
							for (var itemItr = 0; itemItr < tolinelength; itemItr++) {
								var itemId = trecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'item',
									line: itemItr
								});
								var itemRec = trecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'itemreceive',
									line: itemItr
								});
								var itemLineNo = trecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'line',
									line: itemItr
								});
								var itemQuantity = trecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'quantity',
									line: itemItr
								});
								var whLocation = trecord.getSublistValue({
									sublistId: 'item',
									fieldId: 'location',
									line: itemItr
								});
								if (whLocation == null || whLocation == "")
									whLocation = warehouseLocationId;
								var itemLineNo = parseInt(itemLineNo) - parseInt(2);
								if (opentaskSearchResults.length > 0) {
									if (itemItr == 0) {
										for (var indexItr = 0; indexItr < tolinelength; indexItr++) {
											trecord.setSublistValue({
												sublistId: 'item',
												fieldId: 'itemreceive',
												line: indexItr,
												value: false
											});
										}
									}
									for (var tempItr = 0; tempItr < opentaskSearchResults.length; tempItr++) {
										var toLineno = opentaskSearchResults[tempItr]['custrecord_wmsse_line_no'];
										if (parseFloat(toLineno) == parseFloat(itemLineNo)) {
											var compSubRecord = trecord.getSublistSubrecord({
												sublistId: 'item',
												fieldId: 'inventorydetail',
												line: itemItr
											});
											var complinelength = compSubRecord.getLineCount({
												sublistId: 'inventoryassignment'
											});
											if (parseInt(complinelength) > 0) {
												for (var invassItr = 0; invassItr < complinelength; invassItr++) {
													compSubRecord.removeLine({
														sublistId: 'inventoryassignment',
														line: 0
													});
												}
												complinelength = compSubRecord.getLineCount({
													sublistId: 'inventoryassignment'
												});
											}
											break;
										}
									}
									var enterQty = '';
									var toLineno = '';
									var enterBin = '';
									var batchno = '';
									var expiryDate = '';
									var FetchedItemId = '';
									var itemStatus = '';
									var serialNumber = '';
									var itemType = '';
									var isSerialItem = '';
									var isLotItem = '';
									var isInventoryItem = '';
									var totalLineQty = 0;
									var opentaskLinenumberArray = [];
									var openTaskInternalId = '';
									var remainingQuantity = 0;
									var quantityMatched = true;
									for (var otItr = 0;
										(otItr < opentaskSearchResults.length) && (quantityMatched); otItr++) {
										enterQty = opentaskSearchResults[otItr]['custrecord_wmsse_act_qty'];
										toLineno = opentaskSearchResults[otItr]['custrecord_wmsse_line_no'];
										enterBin = opentaskSearchResults[otItr]['custrecord_wmsse_actendloc'];
										batchno = opentaskSearchResults[otItr]['custrecord_wmsse_batch_num'];
										expiryDate = opentaskSearchResults[otItr]['custrecord_wmsse_expirydate'];
										FetchedItemId = opentaskSearchResults[otItr]['custrecord_wmsse_sku'];
										itemStatus = opentaskSearchResults[otItr]['custrecord_wmsse_inventorystatus'];
										serialNumber = opentaskSearchResults[otItr]['custrecord_wmsse_serial_no'];
										isSerialItem = trecord.getSublistValue({
											sublistId: 'item',
											fieldId: 'isserial',
											line: itemItr
										});
										isLotItem = trecord.getSublistValue({
											sublistId: 'item',
											fieldId: 'isnumbered',
											line: itemItr
										});
										isInventoryItem = trecord.getSublistValue({
											sublistId: 'item',
											fieldId: 'invttype',
											line: itemItr
										});
										if (isSerialItem == 'T') {
											itemType = 'serializedinventoryitem';
										} else if (isLotItem == 'T') {
											itemType = 'lotnumberedinventoryitem';
										} else if (isInventoryItem == 'T') {
											itemType = 'inventoryitem';
										} else {}
										if ((parseInt(itemLineNo) == parseInt(toLineno))) {

											if (alreadyPostIRopenTaskDetails != {}) {
												if (utility.isValueValid(alreadyPostIRopenTaskDetails[opentaskSearchResults[otItr]['id']])) {
													enterQty = alreadyPostIRopenTaskDetails[opentaskSearchResults[otItr]['id']].remainingQty;
													log.debug('from object enterQty', enterQty);
												}
											}

											if (parseFloat(enterQty) >= parseFloat(itemQuantity)) {
												remainingQuantity = parseFloat(enterQty) - parseFloat(itemQuantity);
												enterQty = itemQuantity;
												log.debug('remainingQuantity', remainingQuantity);
												quantityMatched = false;
											}

											log.debug('after calculation enterQty', enterQty);
											if (enterQty > 0) {
												/*var fitemcount = frecord.getLineCount({
													sublistId: 'item'
												});*/
												totalLineQty = Big(totalLineQty).plus(enterQty);
												//below used variables are not used any where so commented the below code
												/*for(var Ifitr=0;Ifitr<fitemcount;Ifitr++)
												{  var fulfillSubRecord ='';
													frecord.selectLine({
														sublistId: 'item',
														line: Ifitr
													});
													var fline = frecord.getSublistValue({sublistId: 'item',fieldId: 'orderline',	line:Ifitr});
													var inventoryDetail = frecord.getSublistValue({sublistId: 'item',fieldId: 'inventorydetail',line:Ifitr});
													var pofline= parseInt(fline) + 1;
													if(utility.isValueValid(inventoryDetail)){
														fulfillSubRecord = frecord.getCurrentSublistSubrecord({
															sublistId: 'item',
															fieldId: 'inventorydetail'
														});
													}
													var toInventoryassignmentLineLength=0;
													if(fulfillSubRecord!=null && fulfillSubRecord!=''&& fulfillSubRecord!='null')
														toInventoryassignmentLineLength = fulfillSubRecord.getLineCount({
															sublistId: 'inventoryassignment'
														});
													if(parseInt(toLineno) == (parseInt(pofline)-2))
													{
														break;
													}
												}*/
												if (remainingQuantity == 0 || remainingQuantity < 0) {
													openTaskIdArr.push(opentaskSearchResults[otItr]['id']);
												}
												alreadyPostIRopenTaskDetails[parseInt(opentaskSearchResults[otItr]['id'])] = {
													'lineNo': toLineno,
													'totalquantity': enterQty,
													'remainingQty': remainingQuantity
												};
												itemindex = itemItr;
												trecord.setSublistValue({
													sublistId: 'item',
													line: itemindex,
													fieldId: 'itemreceive',
													value: true
												});
												trecord.setSublistValue({
													sublistId: 'item',
													line: itemindex,
													fieldId: 'quantity',
													value: parseFloat(totalLineQty)
												});
												trecord.setSublistValue({
													sublistId: 'item',
													line: itemindex,
													fieldId: 'location',
													value: whLocation
												});
												if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
													var transLotResultValues = getLotorSerialDetailsFromIF(transactionInternalId, FetchedItemId, toLineno, vitemfulfillmentid);
													if (utility.isValueValid(transLotResultValues) && transLotResultValues.length > 0 &&
														transLotResultValues.indexOf(batchno) != -1) {

														compSubRecord.insertLine({
															sublistId: 'inventoryassignment',
															line: complinelength
														});
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'quantity',
															line: complinelength,
															value: parseFloat(enterQty)
														});
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'receiptinventorynumber',
															line: complinelength,
															value: batchno
														});
														if (enterBin != null && enterBin != "" && enterBin != 'null')
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'binnumber',
																line: complinelength,
																value: enterBin
															});
														if (expiryDate != null && expiryDate != "" && expiryDate != 'null') {
															var parsedExpiryDate = format.parse({
																value: expiryDate,
																type: format.Type.DATE
															});
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'expirationdate',
																line: complinelength,
																value: parsedExpiryDate
															});
														}
														if (itemStatus != null && itemStatus != "" && itemStatus != 'null' && itemStatus != undefined)
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'inventorystatus',
																line: complinelength,
																value: itemStatus
															});
														complinelength++;
														/*if(otItr+1 == toInventoryassignmentLineLength)
																										{
																												break;
																										}*/
													}
												} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
													var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
													var noBinFlag = true;
													if (inventoryStatusFeature == false) {
														var locationUseBinlFlag = true;
														var columnlocationlookupArray = [];
														columnlocationlookupArray.push('usesbins');
														var locationLookUp = utility.getLocationFieldsByLookup(whLocation, columnlocationlookupArray);
														if (locationLookUp.usesbins != undefined) {
															locationUseBinlFlag = locationLookUp.usesbins;
														}
														if (locationUseBinlFlag != true) {
															noBinFlag = false;
														}
													}
													if (noBinFlag) {
														compSubRecord.insertLine({
															sublistId: 'inventoryassignment',
															line: complinelength
														});
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'quantity',
															line: complinelength,
															value: parseFloat(enterQty)
														});
														if (enterBin != null && enterBin != "" && enterBin != 'null')
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'binnumber',
																line: complinelength,
																value: enterBin
															});
														if (itemStatus != null && itemStatus != "" && itemStatus != 'null' && itemStatus != undefined)
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'inventorystatus',
																line: complinelength,
																value: itemStatus
															});
														complinelength++;
													}
													/*if(otItr+1 == toInventoryassignmentLineLength)
																									{
																											break;
																									}*/
												} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
													//	if (opentaskLinenumberArray.indexOf(toLineno) == -1) {
													//	opentaskLinenumberArray.push(toLineno);
													var serialSearch = search.load({
														id: 'customsearch_wmsse_wo_serialentry_srh',
													});
													var serailFilters = serialSearch.filters;
													serailFilters.push(search.createFilter({
														name: 'custrecord_wmsse_ser_ordline',
														operator: search.Operator.EQUALTO,
														values: toLineno
													}));
													serailFilters.push(search.createFilter({
														name: 'custrecord_wmsse_ser_ordno',
														operator: search.Operator.ANYOF,
														values: transactionInternalId
													}));

													serialSearch.filters = serailFilters;
													var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(serialSearch);
													log.debug({
														title: 'SrchRecordTmpSerial1',
														details: SrchRecordTmpSerial1
													});
													if (SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 != "" && SrchRecordTmpSerial1.length > 0) {
														var serialSearchResultsLength = SrchRecordTmpSerial1.length;

														var transSerialResultValues = getLotorSerialDetailsFromIF(transactionInternalId, FetchedItemId, toLineno, vitemfulfillmentid);

														for (var n = 0; n < serialSearchResultsLength; n++) {
															if (utility.isValueValid(transSerialResultValues) &&
																transSerialResultValues.indexOf(SrchRecordTmpSerial1[n]['custrecord_wmsse_ser_no']) != -1) {
																itemStatus = SrchRecordTmpSerial1[n]['custrecord_serial_inventorystatus'];
																var opentaskbin = SrchRecordTmpSerial1[n]['custrecord_wmsse_ser_bin'];
																compSubRecord.insertLine({
																	sublistId: 'inventoryassignment',
																	line: complinelength
																});
																compSubRecord.setSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'quantity',
																	line: complinelength,
																	value: 1
																});
																compSubRecord.setSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'receiptinventorynumber',
																	line: complinelength,
																	value: SrchRecordTmpSerial1[n]['custrecord_wmsse_ser_no']
																});
																if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
																	compSubRecord.setSublistValue({
																		sublistId: 'inventoryassignment',
																		fieldId: 'binnumber',
																		line: complinelength,
																		value: opentaskbin
																	});
																if (itemStatus != null && itemStatus != "" && itemStatus != 'null' && itemStatus != undefined)
																	compSubRecord.setSublistValue({
																		sublistId: 'inventoryassignment',
																		fieldId: 'inventorystatus',
																		line: complinelength,
																		value: itemStatus
																	});
																complinelength++;
																/*if(otItr+1 == toInventoryassignmentLineLength)
																															{
																																	break;
																															}*/

																var TempRecord = SrchRecordTmpSerial1[n];
																var serialRec = record.load({
																	type: 'customrecord_wmsse_serialentry',
																	id: TempRecord.id,
																	isDynamic: true
																});
																serialRec.setValue({
																	fieldId: 'id',
																	value: TempRecord.id
																});
																serialRec.setValue({
																	fieldId: 'name',
																	value: transactionInternalId
																});
																serialRec.setValue({
																	fieldId: 'custrecord_wmsse_ser_note1',
																	value: 'because of item receipt posted for serial number  we have marked this serial number as closed'
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
								}
							}
							if (trecord != null && trecord != '') {
								idl = trecord.save();
								log.debug({
									title: 'idl',
									details: idl
								});
							}
							if (idl != null && idl != '') {
								for (var q = 0; q < openTaskIdArr.length; q++) {
									var vid = openTaskIdArr[q];
									var id = record.submitFields({
										type: 'customrecord_wmsse_trn_opentask',
										id: vid,
										values: {
											'custrecord_wmsse_nsconfirm_ref_no': idl
										}
									});
								}
							}
						} catch (e) {
							log.error({
								title: 'e for fullfiment id',
								details: e
							});
						}
					}
				}
			} catch (e) {
				log.error({
					title: 'e',
					details: e
				});
			}
			return idl;
		}

		function _getCartItemsPreferdBinDetails(whLocation, itemIdArr) {
			var objItemSearch = search.load({
				id: 'customsearch_getpreferedbindetails'
			});
			var objItemSearchFilters = objItemSearch.filters;
			if (utility.isValueValid(whLocation)) {
				objItemSearchFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					join: 'binnumber',
					values: whLocation
				}));
			}
			objItemSearchFilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemIdArr
			}));
			objItemSearch.filters = objItemSearchFilters;
			return utility.getSearchResultInJSON(objItemSearch);
		}

		function _getCartItemsResultsFromInevntoryBalance(whLocation, cartBinId, itemId) {
			var objInvtBalanceSearch = search.load({
				id: 'customsearch_wms_cartitemsdtls',
				type: search.Type.INVENTORY_BALANCE
			});
			var invtBalanceFilters = objInvtBalanceSearch.filters;
			if (utility.isValueValid(whLocation)) {
				invtBalanceFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			if (utility.isValueValid(itemId)) {
				invtBalanceFilters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemId
				}));
			}
			invtBalanceFilters.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.ANYOF,
				values: cartBinId
			}));
			objInvtBalanceSearch.filters = invtBalanceFilters;
			return utility.getSearchResultInJSON(objInvtBalanceSearch);
		}

		function _getCartBinDetailsFromOpenTask(whId, cartBinId, itemId, recomendedBinId, binTrasnferId) {
			var filters = [];
			var opentaskCartItemsListSearch = search.load({
				id: 'customsearch_wms_getcartitems'
			});
			filters = opentaskCartItemsListSearch.filters;
			if (utility.isValueValid(cartBinId)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_actendloc',
					operator: search.Operator.ANYOF,
					values: cartBinId
				}));
			}
			if (utility.isValueValid(whId)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: whId
				}));
			}
			if (utility.isValueValid(itemId)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_sku',
					operator: search.Operator.ANYOF,
					values: itemId
				}));
			}
			if (utility.isValueValid(recomendedBinId)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_reccommendedbin',
					operator: search.Operator.ANYOF,
					values: recomendedBinId
				}));
			}
			if (utility.isValueValid(binTrasnferId)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_nsconfirm_ref_no',
					operator: search.Operator.ANYOF,
					values: binTrasnferId
				}));
			}
			opentaskCartItemsListSearch.filters = filters;
			return utility.getSearchResultInJSON(opentaskCartItemsListSearch);
		}

		function _getCartBinDetails(whLocationId) {
			var reultsArray = [];
			var cartResults = [];
			if (whLocationId) {
				var cartBinsQuery = query.create({
					type: query.Type.BIN
				});
				var whLocCondition = cartBinsQuery.createCondition({
					fieldId: 'location',
					operator: query.Operator.ANY_OF,
					values: whLocationId
				});
				var isCartCondition = cartBinsQuery.createCondition({
					fieldId: 'custrecord_wms_iscart',
					operator: query.Operator.IS,
					values: true
				});
				var typeCondition = cartBinsQuery.createCondition({
					fieldId: 'type',
					operator: query.Operator.IS,
					values: 'INBOUND_STAGING'
				});
				var stageLocId = inboundUtility.getListObjectInternalId('Stage', 'customlist_wmsse_bin_loc_type');
				var wmsInboundStageCondition = cartBinsQuery.createCondition({
					fieldId: 'custrecord_wmsse_bin_loc_type',
					operator: query.Operator.ANY_OF,
					values: stageLocId
				});
				var wmsInboundStageDirectionCondition = cartBinsQuery.createCondition({
					fieldId: 'custrecord_wmsse_bin_stg_direction',
					operator: query.Operator.ANY_OF,
					values: ['1']
				});
				// Create query columns
				cartBinsQuery.columns = [
					cartBinsQuery.createColumn({
						fieldId: 'binnumber'
					}),
					cartBinsQuery.createColumn({
						fieldId: 'id'
					}),
					cartBinsQuery.createColumn({
						fieldId: 'custrecord_wmsse_putseq_no'
					})
				];
				cartBinsQuery.sort = [cartBinsQuery.createSort({
					column: cartBinsQuery.columns[2]
				})];
				cartBinsQuery.condition = cartBinsQuery.and(whLocCondition, isCartCondition, wmsInboundStageCondition, wmsInboundStageDirectionCondition, typeCondition);
				// Run the query
				var resultSet = cartBinsQuery.runPaged({
					pageSize: 1000
				});
				var results = [];
				var iterator = resultSet.iterator();
				var pageCoulmns = null;
				iterator.each(function (result) {
					page = result.value;
					if (pageCoulmns == null) {
						pageCoulmns = page.data.columns;
					}
					pageResults = page.data.results;
					results = getResultsFromNQuery(pageCoulmns, pageResults);
					cartResults.push(results);
					return true;
				});
			}
			return cartResults;
		}

		function getResultsFromNQuery(columnsObj, pageResults) {
			var resultArr = [];
			var columns = columnsObj;
			var values = pageResults;
			for (var res in values) {
				var resObj = values[res].values;
				var resultObj = {};
				for (var col in columns) {
					var colName = columns[col].fieldId;
					resultObj[colName] = resObj[col];
				}
				resultArr.push(resultObj);
			}
			return resultArr;
		}

		function _validateCart(whLocationId, binName) {
			var cartId = '';
			if (whLocationId) {
				var cartBinResults = search.load({
					id: 'customsearch_wms_getcartbins'
				});
				var filters = cartBinResults.filters;
				filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocationId
				}));
				filters.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.IS,
					values: binName
				}));
				cartBinResults.filters = filters;
				var cartBinSearchResults = utility.getSearchResultInJSON(cartBinResults);
				if (cartBinSearchResults.length > 0) {
					cartId = cartBinSearchResults[0].id;
				}
			}
			return cartId;
		}

		function _getItemCommitedQuantity(itemId, wareHouseLocId) {
			var committedQty = 0;
			var shipFlagCheck = runtime.isFeatureInEffect({
				feature: 'pickpackship'
			});
			var searchId = 'customsearch_wmsse_open_pickable_qty_pic';
			var columnName = 'formulanumeric';
			if (!shipFlagCheck || shipFlagCheck == false) {
				searchId = 'customsearch_wmsse_open_pickable_qty_shp';
				columnName = 'quantitycommitted';
			}
			var transactionSearch = search.load({
				id: searchId
			});
			var transactionSearchFilters = transactionSearch.filters;
			if (utility.isValueValid(wareHouseLocId)) {
				transactionSearchFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: wareHouseLocId
				}))
			}
			if (utility.isValueValid(itemId)) {
				transactionSearchFilters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemId
				}))
			}
			var search_page_count = 1000;
			var transactionSearchResults = [];
			var myPagedData = transactionSearch.runPaged({
				pageSize: search_page_count
			});
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					transactionSearchResults.push(result);
				});
			});
			if (transactionSearchResults.length > 0) {
				committedQty = transactionSearchResults[0].getValue({
					name: columnName,
					summary: 'SUM'
				});
			}
			return committedQty;
		}

		function _getItemYetToBePickedQty(itemId, wareHouseLocId) {
			var yetToBePickedQty = parseFloat(_getItemCommitedQuantity(itemId, wareHouseLocId));
			if (yetToBePickedQty > 0) {
				var pickTaskSearch = query.create({
					type: query.Type.PICK_TASK
				});
				var pickActionsSearch = pickTaskSearch.autoJoin({
					fieldId: 'pickactions'
				});
				var itemCondition = pickTaskSearch.createCondition({
					fieldId: 'item',
					operator: query.Operator.ANY_OF,
					values: itemId
				});
				var itmfulfillmentCondition = pickActionsSearch.createCondition({
					fieldId: 'transactionnumber',
					operator: query.Operator.EMPTY
				});
				var locCondition = pickTaskSearch.createCondition({
					fieldId: 'location',
					operator: query.Operator.ANY_OF,
					values: wareHouseLocId
				});
				pickTaskSearch.condition = pickTaskSearch.and(itemCondition, locCondition, itmfulfillmentCondition);
				pickTaskSearch.columns = [pickActionsSearch.createColumn({
						fieldId: 'pickedquantity',
						aggregate: query.Aggregate.SUM
					}),
					pickTaskSearch.createColumn({
						fieldId: 'item',
						groupBy: true
					}),
					pickTaskSearch.createColumn({
						fieldId: 'units.conversionrate',
						groupBy: true
					})
				];
				var itemResults = pickTaskSearch.run().results;
				log.debug({
					title: 'itemResults',
					details: itemResults
				});
				if (itemResults.length > 0) {
					var unitsConverionRate = 0;
					var pickedQuantity = 0;
					for (var itemResult in itemResults) {
						if (itemResults[0].values[2]) {
							unitsConverionRate = parseFloat(itemResults[itemResult].values[2]);
						}
						if (itemResults[0].values[0]) {
							pickedQuantity = parseFloat(itemResults[itemResult].values[0]);
						}
						if (utility.isValueValid(unitsConverionRate) && unitsConverionRate > 0) {
							pickedQuantity = pickedQuantity * unitsConverionRate;
						}
						yetToBePickedQty = yetToBePickedQty - pickedQuantity;
					}
				}
			}
			return yetToBePickedQty;
		}

		function getToQuantityCheck(objGetToQuantityCheckValues) {
			var transactionInternalId = objGetToQuantityCheckValues['transactionInternalId'];
			var itemInternalId = objGetToQuantityCheckValues['itemInternalId'];
			var transactionLineNo = objGetToQuantityCheckValues['transactionLineNo'];
			var lotName = objGetToQuantityCheckValues['lotName'];
			var itemType = objGetToQuantityCheckValues['itemType'];
			var statusInternalId = objGetToQuantityCheckValues['statusInternalId'];
			var inventoryStatusFeature = objGetToQuantityCheckValues['inventoryStatusFeature'];
			var warehouseLocationId = objGetToQuantityCheckValues['warehouseLocationId'];
			var scannedQuantity = objGetToQuantityCheckValues['scannedQuantity'];
			var transactionDetailsArray = objGetToQuantityCheckValues['transactionDetailsArray'];
			var fulfillqtycheck = 'F';
			var linkIdArr = _getAllTOLinksInternalIds(transactionInternalId);
			if (linkIdArr.length > 0) {
				var remainingQuantityToReceive = 0;
				var searchResults = inboundUtility.getTrasactionLinkDetailsforTO(linkIdArr, itemInternalId);
				if (searchResults.length > 0) {
					// function to get ItemCostValue
					var useItemCostFlag = inboundUtility.getUseItemCostPreferenceValueAtOrderLevel(transactionInternalId);
					if (!useItemCostFlag) {
						var fullFillmentQuantity = _getFulfillmentQuantityOfItem(searchResults, objGetToQuantityCheckValues);
						if (parseFloat(fullFillmentQuantity) > 0) {
							if (!utility.isValueValid(lotName)) {
								lotName = '';
							}
							var opentaskResults = inboundUtility.getTransferOrderOpenTaskDetails(itemInternalId, transactionInternalId,
								transactionLineNo, warehouseLocationId, statusInternalId, lotName, inventoryStatusFeature);
							var rcvdQty = 0;
							if (opentaskResults != null && opentaskResults.length > 0) {
								for (var openTaskItr = 0; openTaskItr < opentaskResults.length; openTaskItr++) {
									var actQty = opentaskResults[openTaskItr]['custrecord_wmsse_act_qty'];
									if (actQty == '' || actQty == null || actQty == undefined || isNaN(actQty))
										actQty = 0;
									rcvdQty = Number(Big(rcvdQty).plus(actQty));
								}
							}
							remainingQuantityToReceive = Number(Big(fullFillmentQuantity).minus(rcvdQty));
							if (parseFloat(remainingQuantityToReceive) > 0) {
								remainingQuantityToReceive = _getRemainingQuantityToReceive(searchResults, objGetToQuantityCheckValues, remainingQuantityToReceive);
							}
							if (parseFloat(remainingQuantityToReceive) > 0 && parseFloat(scannedQuantity) <= parseFloat(remainingQuantityToReceive)) {
								transactionDetailsArray['scannedQuantity'] = scannedQuantity;
								if (inventoryStatusFeature)
									transactionDetailsArray['statusInternalId'] = statusInternalId;
								transactionDetailsArray["errorMessage"] = "";
								transactionDetailsArray['isValid'] = true;
							} else {
								transactionDetailsArray["errorMessage"] = translator.getTranslationString("TO_QUANTITY_VALIDATION.NOT_FULFILLED_QUANTITY");
								transactionDetailsArray['isValid'] = false;
							}
						} else {
							transactionDetailsArray["errorMessage"] = translator.getTranslationString("TO_QUANTITY_VALIDATION.NOT_FULFILLED_QUANTITY");
							transactionDetailsArray['isValid'] = false;
						}
					} else {
						var remainingQuantityToReceive = 0;
						remainingQuantityToReceive = _getRemainingQuantityToReceiveUseItemTrue(searchResults, objGetToQuantityCheckValues);
						if (parseFloat(remainingQuantityToReceive) > 0) {
							if (parseFloat(remainingQuantityToReceive) > 0 && parseFloat(scannedQuantity) <= parseFloat(remainingQuantityToReceive)) {
								transactionDetailsArray['scannedQuantity'] = scannedQuantity;
								if (inventoryStatusFeature)
									transactionDetailsArray['statusInternalId'] = statusInternalId;
								transactionDetailsArray["errorMessage"] = "";
								transactionDetailsArray['isValid'] = true;
							} else {
								transactionDetailsArray["errorMessage"] = translator.getTranslationString("TO_QUANTITY_VALIDATION.NOT_FULFILLED_QUANTITY");
								transactionDetailsArray['isValid'] = false;
							}
						} else {
							transactionDetailsArray["errorMessage"] = translator.getTranslationString("TO_QUANTITY_VALIDATION.NOT_FULFILLED_QUANTITY");
							transactionDetailsArray['isValid'] = false;
						}
					}
				}
			}
			return transactionDetailsArray;
		}

		function _getAllTOLinksInternalIds(transactionInternalId) {
			var linkIdArr = [];
			var transferOrderObj = record.load({
				type: 'transferorder',
				id: transactionInternalId
			});
			if (transferOrderObj != null) {
				var links = transferOrderObj.getLineCount({
					sublistId: 'links'
				});
				if (links != null && links != '') {
					for (var itr = 0; itr < links; itr++) {
						var linkid = transferOrderObj.getSublistValue({
							sublistId: 'links',
							fieldId: 'id',
							line: itr
						});
						linkIdArr.push(linkid);
					}
				}
			}
			return linkIdArr;
		}

		function _getFulfillmentQuantityOfItem(searchResults, objGetToQuantityCheckValues) {
			var fullFillmentQuantity = 0;
			var itemInternalId = objGetToQuantityCheckValues['itemInternalId'];
			var transactionLineNo = objGetToQuantityCheckValues['transactionLineNo'];
			var lotName = objGetToQuantityCheckValues['lotName'];
			var itemType = objGetToQuantityCheckValues['itemType'];
			var statusInternalId = objGetToQuantityCheckValues['statusInternalId'];
			var inventoryStatusFeature = objGetToQuantityCheckValues['inventoryStatusFeature'];
			for (var linkitr = 0; linkitr < searchResults.length; linkitr++) {
				var itemFulfillmentId = searchResults[linkitr]['internalid'];
				if (searchResults[linkitr].recordtype == 'itemfulfillment') {
					var frecord = record.load({
						type: 'itemfulfillment',
						id: itemFulfillmentId,
						isDynamic: true
					});
					var fitemcount = frecord.getLineCount({
						sublistId: 'item'
					});
					for (var Ifitr = 0; Ifitr < fitemcount; Ifitr++) {
						var fitem = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: Ifitr
						});
						var fline = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'orderline',
							line: Ifitr
						});
						var flinequantity = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'quantity',
							line: Ifitr
						});
						var inventorydetail = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'inventorydetail',
							line: Ifitr
						});
						var tofline = parseInt(fline) + 1;
						if ((fitem == itemInternalId) && (parseInt(transactionLineNo) == (parseInt(tofline) - 2))) {
							frecord.selectLine({
								sublistId: 'item',
								line: Ifitr
							});
							var compSubRecord;
							if (utility.isValueValid(inventorydetail)) {
								compSubRecord = frecord.getCurrentSublistSubrecord({
									sublistId: 'item',
									fieldId: 'inventorydetail'
								});
							} else {
								fullFillmentQuantity = flinequantity;
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
										log.debug({
											title: 'fromStatusInternalId',
											details: fromStatusInternalId
										});
										log.debug({
											title: 'statusInternalId',
											details: statusInternalId
										});
										if (fromStatusInternalId == statusInternalId) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
										}
									} else {
										var fQuantity = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt
										});
										fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
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
										if (fromStatusInternalId == statusInternalId && fulfilledLotName == lotName) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
										}
									} else {
										if (fulfilledLotName == lotName) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
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
										if (fromStatusInternalId == statusInternalId) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
										}
									} else {
										var fQuantity = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt
										});
										fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
									}
								}
							}
						}
					}
				}
			}
			return fullFillmentQuantity;
		}

		function _getRemainingQuantityToReceive(searchResults, objGetToQuantityCheckValues, remainingQuantityToReceive) {
			var statusReceivedQty = 0;
			var itemInternalId = objGetToQuantityCheckValues['itemInternalId'];
			var transactionLineNo = objGetToQuantityCheckValues['transactionLineNo'];
			var lotName = objGetToQuantityCheckValues['lotName'];
			var itemType = objGetToQuantityCheckValues['itemType'];
			var statusInternalId = objGetToQuantityCheckValues['statusInternalId'];
			var inventoryStatusFeature = objGetToQuantityCheckValues['inventoryStatusFeature'];
			for (var recptItr = 0; recptItr < searchResults.length; recptItr++) {
				var receiptId = searchResults[recptItr]['internalid'];
				if (searchResults[recptItr].recordtype == 'itemreceipt') {
					var receiptRecord = record.load({
						type: 'itemreceipt',
						id: receiptId,
						isDynamic: true
					});
					var receiptItemCount = receiptRecord.getLineCount({
						sublistId: 'item'
					});
					for (var Iritr = 0; Iritr < receiptItemCount; Iritr++) {
						var rItem = receiptRecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: Iritr
						});
						var rline = receiptRecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'orderline',
							line: Iritr
						});
						var inventorydetail = receiptRecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'inventorydetail',
							line: Iritr
						});
						if ((rItem == itemInternalId) && (parseInt(transactionLineNo) == (parseInt(rline) - 2))) {
							receiptRecord.selectLine({
								sublistId: 'item',
								line: Iritr
							});
							var receiptCompSubRecord = '';
							if (utility.isValueValid(inventorydetail)) {
								receiptCompSubRecord = receiptRecord.getCurrentSublistSubrecord({
									sublistId: 'item',
									fieldId: 'inventorydetail'
								});
							}
							var receiptLinelength = 0;
							if (receiptCompSubRecord != null && receiptCompSubRecord != '' && receiptCompSubRecord != 'null') {
								receiptLinelength = receiptCompSubRecord.getLineCount({
									sublistId: 'inventoryassignment'
								});
							}
							for (var cnt1 = 0; cnt1 < receiptLinelength; cnt1++) {
								if (inventoryStatusFeature) {
									var receiptStatusInternalId = receiptCompSubRecord.getSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: cnt1
									});
									var statusName = receiptCompSubRecord.getSublistText({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: cnt1
									});
									var receiveLotName = receiptCompSubRecord.getSublistText({
										sublistId: 'inventoryassignment',
										fieldId: 'receiptinventorynumber',
										line: cnt1
									});
									if (!utility.isValueValid(receiveLotName)) {
										receiveLotName = '';
									}
									if (receiptStatusInternalId == statusInternalId && (itemType == "inventoryitem" || itemType == "assemblyitem")) {
										receivedQty = receiptCompSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt1
										});
										statusReceivedQty = Number(Big(statusReceivedQty).plus(receivedQty));
									} else if (receiptStatusInternalId == statusInternalId &&
										(receiveLotName == lotName ||
											((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")))) {
										receivedQty = receiptCompSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt1
										});
										statusReceivedQty = Number(Big(statusReceivedQty).plus(receivedQty));
									}
								} else {
									var receiveLotName = receiptCompSubRecord.getSublistText({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorynumber',
										line: cnt1
									});
									if (!utility.isValueValid(receiveLotName)) {
										receiveLotName = '';
									}
									if (receiveLotName == lotName ||
										((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"))) {
										receivedQty = receiptCompSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt1
										});
										statusReceivedQty = Number(Big(statusReceivedQty).plus(receivedQty));
									}
								}
							}
						}
					}
				}
			}
			remainingQuantityToReceive = Big(remainingQuantityToReceive).minus(statusReceivedQty);
			return remainingQuantityToReceive;
		}

		function _getRemainingQuantityToReceiveUseItemTrue(searchResults, objGetToQuantityCheckValues) {
			var fullFillmentQuantity = 0;
			var remainingQuantityToReceive = 0;
			var taskQuantity = 0;
			var transactionInternalId = objGetToQuantityCheckValues['transactionInternalId'];
			var itemInternalId = objGetToQuantityCheckValues['itemInternalId'];
			var transactionLineNo = objGetToQuantityCheckValues['transactionLineNo'];
			var lotName = objGetToQuantityCheckValues['lotName'];
			var itemType = objGetToQuantityCheckValues['itemType'];
			var statusInternalId = objGetToQuantityCheckValues['statusInternalId'];
			var inventoryStatusFeature = objGetToQuantityCheckValues['inventoryStatusFeature'];
			var warehouseLocationId = objGetToQuantityCheckValues['warehouseLocationId'];
			var scannedQuantity = objGetToQuantityCheckValues['scannedQuantity'];
			for (var linkitr = 0; linkitr < searchResults.length; linkitr++) {
				var itemFulfillmentId = searchResults[linkitr]['internalid'];
				if (searchResults[linkitr].recordtype == 'itemfulfillment') {
					var frecord = record.load({
						type: 'itemfulfillment',
						id: itemFulfillmentId,
						isDynamic: true
					});
					var fitemcount = frecord.getLineCount({
						sublistId: 'item'
					});
					for (var Ifitr = 0; Ifitr < fitemcount; Ifitr++) {
						var fitem = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: Ifitr
						});
						var fline = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'orderline',
							line: Ifitr
						});
						var flinequantity = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'quantity',
							line: Ifitr
						});
						var inventorydetail = frecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'inventorydetail',
							line: Ifitr
						});
						var tofline = parseInt(fline) + 1;
						if ((fitem == itemInternalId) && (parseInt(transactionLineNo) == (parseInt(tofline) - 2))) {
							var compSubRecord;
							taskQuantity = 0;
							var ordlinelength = 0;
							frecord.selectLine({
								sublistId: 'item',
								line: Ifitr
							});
							if (utility.isValueValid(inventorydetail)) {
								compSubRecord = frecord.getCurrentSublistSubrecord({
									sublistId: 'item',
									fieldId: 'inventorydetail'
								});
							} else {
								fullFillmentQuantity = flinequantity;
								taskQuantity = flinequantity;
							}
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
									if (inventoryStatusFeature) {
										fromStatusInternalId = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: cnt
										});
										if (fromStatusInternalId == statusInternalId) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
											taskQuantity = Number(Big(taskQuantity).plus(fQuantity));
										}
									} else {
										var fQuantity = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt
										});
										fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
										taskQuantity = Number(Big(taskQuantity).plus(fQuantity));
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
										if (fromStatusInternalId == statusInternalId && fulfilledLotName == lotName) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
											taskQuantity = Number(Big(taskQuantity).plus(fQuantity));
										}
									} else {
										if (fulfilledLotName == lotName) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
											taskQuantity = Number(Big(taskQuantity).plus(fQuantity));
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
										if (fromStatusInternalId == statusInternalId) {
											var fQuantity = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: cnt
											});
											fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
											taskQuantity = Number(Big(taskQuantity).plus(fQuantity));
										}
									} else {
										var fQuantity = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: cnt
										});
										fullFillmentQuantity = Number(Big(fullFillmentQuantity).plus(fQuantity));
										taskQuantity = Number(Big(taskQuantity).plus(fQuantity));
									}
								}
							}
							if (taskQuantity > 0) {
								var opentaskResults = inboundUtility.getTransferOrderOpenTaskDetails(itemInternalId, transactionInternalId,
									transactionLineNo, warehouseLocationId, statusInternalId, lotName, inventoryStatusFeature);
								var rcvdQty = 0;
								if (opentaskResults != null && opentaskResults.length > 0) {
									for (var openTaskItr = 0; openTaskItr < opentaskResults.length; openTaskItr++) {
										var actQty = opentaskResults[openTaskItr]['custrecord_wmsse_act_qty'];
										if (actQty == '' || actQty == null || actQty == undefined || isNaN(actQty))
											actQty = 0;
										rcvdQty = Number(Big(rcvdQty).plus(actQty));
									}
								}
								remainingQuantityToReceive = Number(Big(fullFillmentQuantity).minus(rcvdQty));
								if (parseFloat(remainingQuantityToReceive) > 0) {
									remainingQuantityToReceive = _getRemainingQuantityToReceive(searchResults, objGetToQuantityCheckValues, remainingQuantityToReceive);
								}
								if (parseFloat(remainingQuantityToReceive) >= scannedQuantity && scannedQuantity == taskQuantity) {
									break;
								}
							}
						}
					}
				}
				if (parseFloat(remainingQuantityToReceive) >= scannedQuantity && scannedQuantity == taskQuantity) {
					break;
				}
			}
			return remainingQuantityToReceive;
		}

		function _checkSerialAlreadyExistsInInventory(itemInternalId, serialName, warehouseLocationId, systemRuleValue, serialValidationDetails, transactionLineNo, transactionInternalId) {
			var isSerialExistsInInventory = utility.isInventoryNumberExists(itemInternalId, serialName, warehouseLocationId);
			if (isSerialExistsInInventory) {
				serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.SERIAL_EXISTS');
				serialValidationDetails.isValid = false;
			} else {
				var openTaskSerialArray = [];
				if (systemRuleValue == 'Y') {
					var opentaskSerialSearch = search.load({
						id: 'customsearch_wmsse_opentask_serialsrch'
					});
					var filtersseropenTask = opentaskSerialSearch.filters;
					filtersseropenTask.push(search.createFilter({
						name: 'custrecord_wmsse_sku',
						operator: search.Operator.ANYOF,
						values: itemInternalId
					}));
					opentaskSerialSearch.filters = filtersseropenTask;
					var openTaskSerialRecords = utility.getSearchResultInJSON(opentaskSerialSearch);
					var openTaskSerialRecordsLength = openTaskSerialRecords.length;
					if (openTaskSerialRecordsLength > 0) {
						for (var opentaskRec = 0; opentaskRec < openTaskSerialRecordsLength; opentaskRec++) {
							var opentaskSerial = openTaskSerialRecords[opentaskRec].custrecord_wmsse_serial_no;
							if (utility.isValueValid(opentaskSerial)) {
								var opentaskSerArray = [];
								opentaskSerArray = opentaskSerial.split(',');
								var opentaskSerArrayLength = opentaskSerArray.length;
								if (opentaskSerArrayLength > 0) {
									for (var serial = 0; serial < opentaskSerArrayLength; serial++) {
										if (utility.isValueValid(opentaskSerArray[serial])) {
											openTaskSerialArray.push(opentaskSerArray[serial]);
										}
									}
								}
							}
						}
					}
				}
				if (openTaskSerialArray.indexOf(serialName) != -1) {
					serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.SERIAL_EXISTS');
					serialValidationDetails.isValid = false;
				} else {
					var serialSearchResults = isSerialAlreadyExistsInWMSSerialEntryCustomRecord(serialName, transactionLineNo, transactionInternalId);
					if (serialSearchResults.length > 0) {
						serialValidationDetails.errorMessage = translator.getTranslationString("PO_SERIALVALIDATION.SERIAL_SCANNED");
						serialValidationDetails.isValid = false;
					} else {
						serialValidationDetails.isValid = true;
					}
				}
			}
		}

		function isSerialAlreadyExistsInWMSSerialEntryCustomRecord(serialName, transactionLineNo, transactionInternalId) {
			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});
			var filters = serialSearch.filters;
			if (utility.isValueValid(serialName)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_no',
					operator: search.Operator.IS,
					values: serialName
				}));
			}
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordline',
				operator: search.Operator.EQUALTO,
				values: transactionLineNo
			}));
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_status',
				operator: search.Operator.IS,
				values: false
			}));
			serialSearch.filters = filters;
			return utility.getSearchResultInJSON(serialSearch);
		}

		function _getRecevingOrderDetails(orderNumber, itemID, wareHouseLocationId, orderLineNo, orderInternalId, colsArr, tranType, crossSubsidiaryFeature, centralizesPurchasingandBilling, warehouseLocationName) {
			var ISMStatusFeature = inboundUtility.isISMFeatureEnabled();
			if (ISMStatusFeature && tranType != 'purchaseorder') {
				var searchName = 'customsearch_wmsse_rcv_poism_validate';
				var vType = 'PurchOrd';
			}

			if (tranType == 'transferorder') {
				searchName = 'customsearch_wmsse_rcv_to_item_details';
				vType = 'TrnfrOrd';
			} else if (tranType == 'returnauthorization') {
				searchName = 'customsearch_wmsse_rcv_rma_item_details';
				vType = 'RtnAuth';
			} else {
				var searchName = 'customsearch_wmsse_rcv_po_validate';
				var vType = 'PurchOrd';

			}
			if (utility.isValueValid(orderNumber) || utility.isValueValid(orderInternalId)) {
				var POLineDetails = search.load({
					id: searchName
				});
				var filtersArr = POLineDetails.filters;
				if (utility.isValueValid(colsArr)) {
					for (var j = 0; j < colsArr.length; j++) {
						log.debug({
							title: 'colsArr[j]',
							details: colsArr[j]
						});
						POLineDetails.columns.push(colsArr[j]);
					}
				}
				if (utility.isValueValid(orderInternalId)) {
					filtersArr.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: orderInternalId
					}));
				} else {
					filtersArr.push(search.createFilter({
						name: 'tranid',
						operator: search.Operator.IS,
						values: orderNumber
					}));
				}
				filtersArr.push(search.createFilter({
					name: 'type',
					operator: search.Operator.ANYOF,
					values: vType
				}));
				if (utility.isValueValid(wareHouseLocationId)) {
					if (tranType == 'transferorder') {
						filtersArr.push(
							search.createFilter({
								name: 'transferlocation',
								operator: search.Operator.ANYOF,
								values: ['@NONE@', wareHouseLocationId]
							}));
					} else {
						if (crossSubsidiaryFeature == true && tranType == 'returnauthorization') {
							filtersArr.push(
								search.createFilter({
									name: 'inventorylocation',
									operator: search.Operator.ANYOF,
									values: ['@NONE@', wareHouseLocationId]
								}));
						} else {
							if (centralizesPurchasingandBilling == true && utility.isValueValid(warehouseLocationName)) {

								filtersArr.push(search.createFilter({
									name: 'formulatext',
									operator: search.Operator.IS,
									formula: "CASE WHEN {targetlocation} IS NULL THEN {location} ELSE{targetlocation} END",
									values: warehouseLocationName
								}));
							} else {
								filtersArr.push(
									search.createFilter({
										name: 'location',
										operator: search.Operator.ANYOF,
										values: ['@NONE@', wareHouseLocationId]
									}));
							}

						}
					}
				}
				if (utility.isValueValid(itemID)) {
					filtersArr.push(
						search.createFilter({
							name: 'item',
							operator: search.Operator.ANYOF,
							values: itemID
						}));
				}
				if (utility.isValueValid(orderLineNo)) {
					filtersArr.push(
						search.createFilter({
							name: 'line',
							operator: search.Operator.EQUALTO,
							values: orderLineNo
						}));
				}
				POLineDetails.filters = filtersArr;
				var POLineDetailsResult = utility.getSearchResultInJSON(POLineDetails);
				return POLineDetailsResult;
			} else {
				return null;
			}
		}

		function getlineItemsforReceiveAll(shipmentId, warehouseLocationId) {
			var itemListSrch = search.load({
				id: 'customsearch_wms_ism_item_list'
			});
			var itemListSrchArr = itemListSrch.filters;
			if (utility.isValueValid(warehouseLocationId)) {
				itemListSrchArr.push(search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}
			if (utility.isValueValid(shipmentId)) {
				itemListSrchArr.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: shipmentId
				}));
			}
			itemListSrchArr.filters = itemListSrchArr;
			var itemListObj = utility.getSearchResultInJSON(itemListSrch);
			log.debug('itemList Obj before conversion:', itemListObj);
			for (var index in itemListObj) {
				if (utility.isValueValid(itemListObj[index]['unitstype'])) {
					var convRate = utility.getConversionRate(itemListObj[index]['unitText'], itemListObj[index]['unitstype']);
					if (utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index]['quantityreceived'])) {
						itemListObj[index]['quantityreceived'] = utility.uomConversions(parseFloat(itemListObj[index]['quantityreceived']), convRate, 1);
					}
					if (utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index]['quantityremaining'])) {
						itemListObj[index]['quantityremaining'] = utility.uomConversions(parseFloat(itemListObj[index]['quantityremaining']), convRate, 1);
					}
					if (utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index]['quantityexpected'])) {
						itemListObj[index]['quantityexpected'] = utility.uomConversions(parseFloat(itemListObj[index]['quantityexpected']), convRate, 1);
					}
				}
			}
			return itemListObj;
		}

		function _checkSerialAlreadyExistsInInventory(itemInternalId, serialName, warehouseLocationId, systemRuleValue, serialValidationDetails, transactionLineNo, transactionInternalId) {
			var isSerialExistsInInventory = utility.isInventoryNumberExists(itemInternalId, serialName, warehouseLocationId);
			if (isSerialExistsInInventory) {
				serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.SERIAL_EXISTS');
				serialValidationDetails.isValid = false;
			} else {
				var openTaskSerialArray = [];
				if (systemRuleValue == 'Y') {

					var opentaskSerialSearch = search.load({
						id: 'customsearch_wmsse_opentask_serialsrch'
					});
					var filtersseropenTask = opentaskSerialSearch.filters;
					filtersseropenTask.push(search.createFilter({
						name: 'custrecord_wmsse_sku',
						operator: search.Operator.ANYOF,
						values: itemInternalId
					}));
					var ISMStatusFeature = inboundUtility.isISMFeatureEnabled();
					if (ISMStatusFeature) {
						filtersseropenTask.push(search.createFilter({
							name: 'custrecord_wmsse_rec_inb_shipment',
							operator: search.Operator.ISEMPTY
						}));
					}
					opentaskSerialSearch.filters = filtersseropenTask;
					var openTaskSerialRecords = utility.getSearchResultInJSON(opentaskSerialSearch);
					var openTaskSerialRecordsLength = openTaskSerialRecords.length;
					if (openTaskSerialRecordsLength > 0) {
						for (var opentaskRec = 0; opentaskRec < openTaskSerialRecordsLength; opentaskRec++) {
							var opentaskSerial = openTaskSerialRecords[opentaskRec].custrecord_wmsse_serial_no;
							if (utility.isValueValid(opentaskSerial)) {
								var opentaskSerArray = [];
								opentaskSerArray = opentaskSerial.split(',');
								var opentaskSerArrayLength = opentaskSerArray.length;
								if (opentaskSerArrayLength > 0) {
									for (var serial = 0; serial < opentaskSerArrayLength; serial++) {
										if (utility.isValueValid(opentaskSerArray[serial])) {
											openTaskSerialArray.push(opentaskSerArray[serial]);
										}
									}
								}
							}
						}
					}
				}
				if (openTaskSerialArray.indexOf(serialName) != -1) {
					serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.SERIAL_EXISTS');
					serialValidationDetails.isValid = false;
				} else {
					var serialSearchResults = isSerialAlreadyExistsInWMSSerialEntryCustomRecord(serialName, transactionLineNo, transactionInternalId);
					if (serialSearchResults.length > 0) {

						serialValidationDetails.errorMessage = translator.getTranslationString("PO_SERIALVALIDATION.SERIAL_SCANNED");
						serialValidationDetails.isValid = false;
					} else {
						serialValidationDetails.isValid = true;
					}
				}
			}
		}

		function postItemReceipt(objPostIrValues) {

			var trantype = objPostIrValues['transactionType'];
			var poInternalId = objPostIrValues['poInternalId'];
			var FetchedItemId = objPostIrValues['fetchedItemId'];
			var poLineno = objPostIrValues['poLineno'];
			var enterQty = objPostIrValues['enterQty'];
			var enterBin = objPostIrValues['binInternalId'];
			var itemType = objPostIrValues['itemType'];
			var whLocation = objPostIrValues['whLocation'];
			var batchno = objPostIrValues['lotno'];
			var expiryDate = objPostIrValues['lotExpiryDate'];
			var fifoDate = objPostIrValues['fifoDate'];
			var poname = objPostIrValues['tranid'];
			var PutStrategy = objPostIrValues['PutStrategy'];
			var zoneno = objPostIrValues['zoneno'];
			var actualBeginTime = objPostIrValues['actualBeginTime'];
			var customer = objPostIrValues['customer'];
			var uom = objPostIrValues['uom'];
			var conversionRate = objPostIrValues['conversionRate'];
			var TOLineDetails = objPostIrValues['TOLineDetails'];
			var lineFullQty = objPostIrValues['lineFullQty'];
			var useitemcostflag = objPostIrValues['useitemcostflag'];
			var vInvStatus_select = objPostIrValues['invtStatus'];
			var systemRule = objPostIrValues['systemRuleValue'];
			var strBarCode = objPostIrValues['strBarCode'];
			var isTallyScanRequired = objPostIrValues['isTallyScanRequired'];
			var selectedConversionRateForTallyScan = objPostIrValues['selectedConversionRate'];
			var tallyLoopObj = objPostIrValues['tallyLoopObj'];
			var noBinLoc = true;
			var targetLocation = objPostIrValues['targetLocation'];
			var targetSubsidiary = objPostIrValues['targetSubsidiary'];
			log.debug('targetLocation', targetLocation);
			log.debug('targetSubsidiary', targetSubsidiary);

			if (utility.isValueValid(trantype) && trantype == 'returnauthorization' && utility.isValueValid(objPostIrValues['restock'])) {
				var restock = objPostIrValues['restock'];
			}

			if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") &&
				(isTallyScanRequired == true || isTallyScanRequired == 'true') && utility.isValueValid(conversionRate)) {
				enterQty = Number(Big(enterQty).div(conversionRate));
			}

			if (utility.isValueValid(objPostIrValues['noBinLoc'])) {
				noBinLoc = objPostIrValues['noBinLoc'];
			}
			var impctRecReturn = {};

			var idl = "";


			if (trantype == 'returnauthorization' && (utility.isValueValid(objPostIrValues.isKitComponent) && objPostIrValues.isKitComponent === true) && systemRule == 'N') {
				var kitOTResults = getKitOTResultsforIRPosting(poInternalId, objPostIrValues.parentItem, whLocation, objPostIrValues);
				var kitDetailsforRMA = getKitDetailsforRMA(poInternalId, objPostIrValues.parentItem);
				log.debug('kitOTResults', kitOTResults);
				log.debug('kitDetailsforRMA', kitDetailsforRMA);
				var kitIRPostObj = matchKitComponentsQty(kitOTResults, kitDetailsforRMA, objPostIrValues, impctRecReturn);
				if (kitIRPostObj.postItemReceiptforKit === false) {
					systemRule = 'Y'; /// To stop automatic item receipt post for incomplete kit components receiving
				} else {
					systemRule = 'Posted'; /// To stop automatic item receipt post for kit components receiving as it is already posted in this function matchKitComponentsQty
				}
			}
			log.debug({
				title: 'systemRule',
				details: systemRule
			});
			if (systemRule == 'N') {
				var itemindex = -1;
				log.debug({
					title: 'trantype',
					details: trantype
				});
				if (trantype == 'transferorder') {
					log.debug({
						title: 'itemType',
						details: itemType
					});

					var vitemfulfillmentid = '';
					if (TOLineDetails.length > 0) {
						log.debug({
							title: 'TOLineDetails.length',
							details: TOLineDetails.length
						});
						var remainingqty = enterQty;
						var isMatched = false;
						for (var d = 0; d < TOLineDetails.length; d++) {
							vitemfulfillmentid = TOLineDetails[d];
							log.debug({
								title: 'vitemfulfillmentid',
								details: vitemfulfillmentid
							});

							if (utility.isValueValid(vitemfulfillmentid)) {

								var trecord = record.transform({
									fromType: record.Type.TRANSFER_ORDER,
									fromId: poInternalId,
									toType: record.Type.ITEM_RECEIPT,
									defaultValues: {
										itemfulfillment: vitemfulfillmentid
									},
									isDynamic: false
								});

								var polinelength = trecord.getLineCount({
									sublistId: 'item'
								});
								log.debug({
									title: 'polinelength',
									details: polinelength
								});
								isMatched = false;
								for (var j = 0; j < polinelength; j++) {
									var item_id = trecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'item',
										line: j
									});
									var itemrec = trecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'itemreceive',
										line: j
									});
									var itemLineNo = trecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'line',
										line: j
									});
									var itemQuantity = trecord.getSublistValue({
										sublistId: 'item',
										fieldId: 'quantity',
										line: j
									});
									log.debug({
										title: 'itemQuantity xx',
										details: itemQuantity
									});
									log.debug({
										title: 'enterQty xx',
										details: enterQty
									});

									var opentaskSearchResults = inboundUtility.getopentaskresultsforIRPosting(poInternalId, null, item_id, itemLineNo);
									log.debug({
										title: 'opentaskSearchResults',
										details: opentaskSearchResults
									});
									if (opentaskSearchResults.length > 0) {
										var totalLineQty = 0;
										for (var tempItr = 0; tempItr < opentaskSearchResults.length; tempItr++) {
											var enterQty = opentaskSearchResults[tempItr][2];
											var toLineno = opentaskSearchResults[tempItr][0];
											if (parseFloat(toLineno) == parseFloat(itemLineNo))
												totalLineQty = parseFloat(totalLineQty) + parseFloat(enterQty);
										}
										enterQty = parseFloat(totalLineQty);
									}

									var itemLineNo = parseInt(itemLineNo) - parseInt(2);

									if ((parseInt(itemLineNo) == parseInt(poLineno))) {
										if (useitemcostflag == false) {
											itemQuantity = enterQty;
										} else if ((parseFloat(enterQty) > parseFloat(itemQuantity)) && useitemcostflag == true) {
											enterQty = itemQuantity;
										}
										log.debug({
											title: 'after enterQty ',
											details: enterQty
										});

										log.debug({
											title: 'itemLineNo',
											details: itemLineNo
										});
										log.debug({
											title: 'poLineno',
											details: poLineno
										});
										itemindex = j;

										trecord.setSublistValue({
											sublistId: 'item',
											line: itemindex,
											fieldId: 'itemreceive',
											value: true
										});
										trecord.setSublistValue({
											sublistId: 'item',
											line: itemindex,
											fieldId: 'quantity',
											value: enterQty
										});
										trecord.setSublistValue({
											sublistId: 'item',
											line: itemindex,
											fieldId: 'location',
											value: whLocation
										});
										log.debug({
											title: 'itemType',
											details: itemType
										});
										if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
											var compSubRecord = trecord.getSublistSubrecord({
												sublistId: 'item',
												fieldId: 'inventorydetail',
												line: itemindex
											});
											var inventoryAssignmentLength = compSubRecord.getLineCount({
												sublistId: 'inventoryassignment'
											});
											if (parseInt(inventoryAssignmentLength) > 0) {
												for (var r1 = 0; r1 < inventoryAssignmentLength; r1++) {
													compSubRecord.removeLine({
														sublistId: 'inventoryassignment',
														line: 0
													});
												}
												inventoryAssignmentLength = 0;
											}
											if (isTallyScanRequired == true) {
												for (var obj in tallyLoopObj) {
													var tallyObj = tallyLoopObj[obj];
													var convertedQuantity = tallyObj.quantity;
													if (utility.isValueValid(selectedConversionRateForTallyScan)) {
														convertedQuantity = Number(Big(convertedQuantity).mul(selectedConversionRateForTallyScan));
														convertedQuantity = Number(Big(convertedQuantity).div(conversionRate));
													}
													if ((parseFloat(convertedQuantity) > parseFloat(enterQty)) && useitemcostflag == true) {
														convertedQuantity = enterQty;
													}
													compSubRecord.insertLine({
														sublistId: 'inventoryassignment',
														line: inventoryAssignmentLength
													});
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'quantity',
														line: inventoryAssignmentLength,
														value: convertedQuantity
													});
													if (utility.isValueValid(enterBin))
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'binnumber',
															line: inventoryAssignmentLength,
															value: enterBin
														});
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'receiptinventorynumber',
														line: inventoryAssignmentLength,
														value: tallyObj.lotName
													});
													if (utility.isValueValid(tallyObj.lotExpiryDate)) {
														var expDate = tallyObj.lotExpiryDate;
														var expiryDate = format.parse({
															value: expDate,
															type: format.Type.DATE
														});
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'expirationdate',
															line: inventoryAssignmentLength,
															value: expiryDate
														});
													}
													if (utility.isValueValid(tallyObj.statusName)) {

														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'inventorystatus',
															line: inventoryAssignmentLength,
															value: tallyObj.statusName
														});
													}
													complinelength = complinelength + 1;
													isMatched = true;
												}

											} else {

												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'quantity',
													line: 0,
													value: enterQty
												});
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'receiptinventorynumber',
													line: 0,
													value: batchno
												});
												if (utility.isValueValid(enterBin))
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'binnumber',
														line: 0,
														value: enterBin
													});
												if (utility.isValueValid(expiryDate)) {
													var parsedExpiryDate = format.parse({
														value: expiryDate,
														type: format.Type.DATE
													});
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'expirationdate',
														line: 0,
														value: parsedExpiryDate
													});

												}
												if (utility.isValueValid(vInvStatus_select))
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'inventorystatus',
														line: 0,
														value: vInvStatus_select
													});

												isMatched = true;
											}
										} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
											var compSubRecord = null;
											try {
												compSubRecord = trecord.getSublistSubrecord({
													sublistId: 'item',
													fieldId: 'inventorydetail',
													line: itemindex
												});
											} catch (e) {
												compSubRecord = null;
											}
											if (utility.isValueValid(compSubRecord)) {
												var inventoryAssignmentLength = compSubRecord.getLineCount({
													sublistId: 'inventoryassignment'
												});
												if (parseInt(inventoryAssignmentLength) > 0) {

													for (var r1 = 0; r1 < inventoryAssignmentLength; r1++) {
														compSubRecord.removeLine({
															sublistId: 'inventoryassignment',
															line: 0
														});
													}
												}
												inventoryAssignmentLength = 0;

											}
											if (isTallyScanRequired == true) {
												if (noBinLoc == true) {
													for (var obj in tallyLoopObj) {
														var tallyObj = tallyLoopObj[obj];
														compSubRecord.insertLine({
															sublistId: 'inventoryassignment',
															line: inventoryAssignmentLength
														});
														var convertedQuantity = tallyObj.quantity;
														if (utility.isValueValid(selectedConversionRateForTallyScan)) {
															convertedQuantity = Number(Big(convertedQuantity).mul(selectedConversionRateForTallyScan));
															convertedQuantity = Number(Big(convertedQuantity).div(conversionRate));
														}
														if ((parseFloat(convertedQuantity) > parseFloat(enterQty)) && useitemcostflag == true) {
															convertedQuantity = enterQty;
														}
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'quantity',
															line: inventoryAssignmentLength,
															value: convertedQuantity
														});
														if (utility.isValueValid(enterBin)) {
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'binnumber',
																line: inventoryAssignmentLength,
																value: enterBin
															});
														}
														if (utility.isValueValid(tallyObj.statusName)) {
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'inventorystatus',
																line: inventoryAssignmentLength,
																value: tallyObj.statusName
															});
														}
														inventoryAssignmentLength = inventoryAssignmentLength + 1;
														isMatched = true;
													}
												} else {
													isMatched = true;
												}

											} else {
												log.debug({
													title: 'vInvStatus_select',
													details: vInvStatus_select
												});
												if (noBinLoc == true) {
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'quantity',
														line: 0,
														value: enterQty
													});
													if (utility.isValueValid(enterBin)) {
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'binnumber',
															line: 0,
															value: enterBin
														});
													}
													if (utility.isValueValid(vInvStatus_select)) {
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'inventorystatus',
															line: 0,
															value: vInvStatus_select
														});
													}


												}
												isMatched = true;
											}
										} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
											var filterssertemp1 = [search.createFilter({
												name: 'custrecord_wmsse_ser_status',
												operator: search.Operator.IS,
												values: false
											}), search.createFilter({
												name: 'custrecord_wmsse_ser_ordline',
												operator: search.Operator.EQUALTO,
												values: parseFloat(poLineno)
											})];
											filterssertemp1.push(search.createFilter({
												name: 'custrecord_wmsse_ser_ordno',
												operator: search.Operator.ANYOF,
												values: poInternalId
											}));

											var columnssertemp1 = [];
											columnssertemp1[0] = search.createColumn({
												name: 'custrecord_wmsse_ser_no'
											});
											columnssertemp1[1] = search.createColumn({
												name: 'name'
											});
											columnssertemp1[2] = search.createColumn({
												name: 'custrecord_serial_inventorystatus'
											});

											columnssertemp1[1].sort = search.Sort.ASC;
											var SrchRecordTmpSerial1 = search.create({
												type: 'customrecord_wmsse_serialentry',
												filters: filterssertemp1,
												columns: columnssertemp1
											}).run().getRange({
												start: 0,
												end: 1000
											});

											log.debug({
												title: 'SrchRecordTmpSerial1',
												details: SrchRecordTmpSerial1
											});
											if (SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 != "") {
												var compSubRecord = trecord.getSublistSubrecord({
													sublistId: 'item',
													fieldId: 'inventorydetail',
													line: itemindex
												});

												var complinelength = compSubRecord.getLineCount({
													sublistId: 'inventoryassignment'
												});
												log.debug({
													title: 'complinelength',
													details: complinelength
												});
												if (parseInt(complinelength) > 0) {
													for (var r1 = 0; r1 < complinelength; r1++) {
														compSubRecord.removeLine({
															sublistId: 'inventoryassignment',
															line: 0
														});
													}
												}
												var transerresultvalues = getLotorSerialDetailsFromIF(poInternalId, FetchedItemId, poLineno, vitemfulfillmentid);
												log.debug({
													title: 'transerresultvalues',
													details: transerresultvalues
												});
												var count = 0;
												if (isTallyScanRequired == true) {
													var SrchRecordTmpSerial1Length = SrchRecordTmpSerial1.length;
													for (var n = 0; n < SrchRecordTmpSerial1Length; n++) {
														if (utility.isValueValid(transerresultvalues) && transerresultvalues.length > 0 &&
															transerresultvalues.indexOf(SrchRecordTmpSerial1[n].getValue('custrecord_wmsse_ser_no')) != -1) {
															var serialEntryStatus = SrchRecordTmpSerial1[n].getValue('custrecord_serial_inventorystatus');
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'quantity',
																line: count,
																value: 1
															});
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'receiptinventorynumber',
																line: count,
																value: SrchRecordTmpSerial1[n].getValue('custrecord_wmsse_ser_no')
															});

															if (utility.isValueValid(enterBin)) {
																compSubRecord.setSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'binnumber',
																	line: count,
																	value: enterBin
																});
															}
															if (utility.isValueValid(serialEntryStatus)) {
																compSubRecord.setSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'inventorystatus',
																	line: count,
																	value: serialEntryStatus
																});
															}
															var TempRecord = SrchRecordTmpSerial1[n];
															var serialRec = record.load({
																type: 'customrecord_wmsse_serialentry',
																id: TempRecord.id,
																isDynamic: true
															});
															serialRec.setValue({
																fieldId: 'id',
																value: TempRecord.id
															});
															serialRec.setValue({
																fieldId: 'name',
																value: poInternalId
															});
															serialRec.setValue({
																fieldId: 'custrecord_wmsse_ser_note1',
																value: 'because of item receipt posted for serial number  we have marked this serial number as closed'
															});
															serialRec.setValue({
																fieldId: 'custrecord_wmsse_ser_status',
																value: true
															});
															serialRec.save();
															isMatched = true;
															count++;
														}
													}
												} else {
													for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {


														if (transerresultvalues != null && transerresultvalues != 'null' && transerresultvalues != '' &&
															transerresultvalues.length > 0 &&
															transerresultvalues.indexOf(SrchRecordTmpSerial1[n].getValue('custrecord_wmsse_ser_no')) != -1) {
															log.debug({
																title: 'transerresultvalues  test',
																details: transerresultvalues
															});
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'quantity',
																line: count,
																value: 1
															});
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'receiptinventorynumber',
																line: count,
																value: SrchRecordTmpSerial1[n].getValue('custrecord_wmsse_ser_no')
															});

															if (enterBin != null && enterBin != "" && enterBin != 'null')
																compSubRecord.setSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'binnumber',
																	line: count,
																	value: enterBin
																});

															if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
																compSubRecord.setSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'inventorystatus',
																	line: count,
																	value: vInvStatus_select
																});

															var TempRecord = SrchRecordTmpSerial1[n];
															var serialRec = record.load({
																type: 'customrecord_wmsse_serialentry',
																id: TempRecord.id,
																isDynamic: true
															});
															serialRec.setValue({
																fieldId: 'id',
																value: TempRecord.id
															});
															serialRec.setValue({
																fieldId: 'name',
																value: poInternalId
															});
															serialRec.setValue({
																fieldId: 'custrecord_wmsse_ser_note1',
																value: 'because of item receipt posted for serial number  we have marked this serial number as closed'
															});
															serialRec.setValue({
																fieldId: 'custrecord_wmsse_ser_status',
																value: true
															});
															serialRec.save();
															isMatched = true;
															count++;
														}

													}
												}

											}
										}

									} else {
										log.debug({
											title: 'J else',
											details: j
										});
										trecord.setSublistValue({
											sublistId: 'item',
											fieldId: 'itemreceive',
											line: j,
											value: false
										});

									}
								}
								if (trecord != null && trecord != '' && isMatched == true) {
									remainingqty = parseFloat(remainingqty) - parseFloat(enterQty);
									log.debug({
										title: 'trecord',
										details: trecord
									});
									idl = trecord.save();
									log.debug({
										title: 'idl',
										details: idl
									});
									enterQty = parseFloat(remainingqty);
									impctRecReturn['itemreceiptid'] = idl;
								}
								if (parseFloat(remainingqty) <= 0) {
									break;
								}
							}


						}
					}

				} else {
					var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
					var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
					log.debug({
						title: 'crossSubsidiaryFeature',
						details: crossSubsidiaryFeature
					});
					if (centralizesPurchasingandBilling == true) {
						if (targetSubsidiary == null || targetSubsidiary == '') {
							targetSubsidiary = -1;
						}
					}
					var recordType = record.Type.PURCHASE_ORDER;
					if (trantype == 'returnauthorization')
						recordType = record.Type.RETURN_AUTHORIZATION;

					var trecord = null;

					if (crossSubsidiaryFeature == true && trantype == 'returnauthorization') {
						var locationSubsidiary = utility.getSubsidiaryforLocation(whLocation)

						trecord = record.transform({
							fromType: record.Type.RETURN_AUTHORIZATION,
							fromId: poInternalId,
							toType: record.Type.ITEM_RECEIPT,
							defaultValues: {
								orderinvtsub: locationSubsidiary
							},
							isDynamic: false
						});
					} else {

						if (centralizesPurchasingandBilling == true && targetSubsidiary) {
							if (targetSubsidiary == null && targetSubsidiary == '') {
								targetSubsidiary = -1;
							}

							trecord = record.transform({
								fromType: recordType,
								fromId: poInternalId,
								toType: record.Type.ITEM_RECEIPT,
								defaultValues: {
									targetsub: targetSubsidiary
								},
								isDynamic: false
							});
						} else {
							trecord = record.transform({
								fromType: recordType,
								fromId: poInternalId,
								toType: record.Type.ITEM_RECEIPT,
								isDynamic: false
							});
						}

					}
					var polinelength = trecord.getLineCount({
						sublistId: 'item'
					});
					for (var j = 0; j < polinelength; j++) {
						var itemLineNo = trecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'line',
							line: j
						});
						if (parseInt(itemLineNo) == parseInt(poLineno)) {
							itemindex = j;
						} else {
							trecord.setSublistValue({
								sublistId: 'item',
								fieldId: 'itemreceive',
								line: j,
								value: false
							});
						}
					}
					trecord.setSublistValue({
						sublistId: 'item',
						line: itemindex,
						fieldId: 'itemreceive',
						value: true
					});
					trecord.setSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						line: itemindex,
						value: enterQty
					});
					trecord.setSublistValue({
						sublistId: 'item',
						fieldId: 'location',
						line: itemindex,
						value: whLocation
					});
					if (trantype == 'returnauthorization' && utility.isValueValid(restock) && restock == false) {
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'restock',
							line: itemindex,
							value: false
						});
					} else if (trantype == 'returnauthorization' && utility.isValueValid(restock) && restock == true) {
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'restock',
							line: itemindex,
							value: true
						});
					}

					if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {

						var compSubRecord = trecord.getSublistSubrecord({
							sublistId: 'item',
							fieldId: 'inventorydetail',
							line: itemindex
						});
						var complinelength = compSubRecord.getLineCount({
							sublistId: 'inventoryassignment'
						});
						if (parseInt(complinelength) > 0) {

							for (var vItr = 0; vItr < complinelength; vItr++) {
								compSubRecord.removeLine({
									sublistId: 'inventoryassignment',
									line: 0
								});
							}
							complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
						}
						if (isTallyScanRequired == true) {
							for (var obj in tallyLoopObj) {
								var tallyObj = tallyLoopObj[obj];
								compSubRecord.insertLine({
									sublistId: 'inventoryassignment',
									line: complinelength
								});
								var convertedQuantity = tallyObj.quantity;
								if (utility.isValueValid(selectedConversionRateForTallyScan)) {
									convertedQuantity = Number(Big(convertedQuantity).mul(selectedConversionRateForTallyScan));
									convertedQuantity = Number(Big(convertedQuantity).div(conversionRate));
								}
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'quantity',
									line: complinelength,
									value: convertedQuantity
								});
								if (enterBin != undefined && enterBin != null && enterBin != "" && enterBin != 'null')
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'binnumber',
										line: complinelength,
										value: enterBin
									});
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'receiptinventorynumber',
									line: complinelength,
									value: tallyObj.lotName
								});
								log.debug('tallyObj', tallyObj);
								if (tallyObj.lotExpiryDate != undefined && tallyObj.lotExpiryDate != null && tallyObj.lotExpiryDate != '') {
									var expDate = tallyObj.lotExpiryDate;
									var expiryDate = format.parse({
										value: expDate,
										type: format.Type.DATE
									});
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'expirationdate',
										line: complinelength,
										value: expiryDate
									});
								}
								if (tallyObj.statusName != undefined && tallyObj.statusName != null && tallyObj.statusName != '') {

									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: complinelength,
										value: tallyObj.statusName
									});
								}
								complinelength = complinelength + 1;
							}
						} else {
							compSubRecord.insertLine({
								sublistId: 'inventoryassignment',
								line: complinelength
							});
							compSubRecord.setSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'quantity',
								line: complinelength,
								value: enterQty
							});
							compSubRecord.setSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'receiptinventorynumber',
								line: complinelength,
								value: batchno
							});
							if (enterBin != undefined && enterBin != null && enterBin != "" && enterBin != 'null')
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'binnumber',
									line: complinelength,
									value: enterBin
								});
							if (expiryDate != null && expiryDate != "" && expiryDate != 'null') {
								var parsedExpiryDate = format.parse({
									value: expiryDate,
									type: format.Type.DATE
								});
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'expirationdate',
									line: complinelength,
									value: parsedExpiryDate
								});
							}
							if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'inventorystatus',
									line: complinelength,
									value: vInvStatus_select
								});
						}
					} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {

						if (noBinLoc == true) {
							var compSubRecord = trecord.getSublistSubrecord({
								sublistId: 'item',
								fieldId: 'inventorydetail',
								line: itemindex
							});
							var complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							if (parseInt(complinelength) > 0) {

								for (var vItr = 0; vItr < complinelength; vItr++) {
									compSubRecord.removeLine({
										sublistId: 'inventoryassignment',
										line: 0
									});
								}
								complinelength = compSubRecord.getLineCount({
									sublistId: 'inventoryassignment'
								});
							}


							if (isTallyScanRequired == true) {
								for (var obj in tallyLoopObj) {
									var tallyObj = tallyLoopObj[obj];
									compSubRecord.insertLine({
										sublistId: 'inventoryassignment',
										line: complinelength
									});
									var convertedQuantity = tallyObj.quantity;
									if (utility.isValueValid(selectedConversionRateForTallyScan)) {
										convertedQuantity = Number(Big(convertedQuantity).mul(selectedConversionRateForTallyScan));
										convertedQuantity = Number(Big(convertedQuantity).div(conversionRate));
									}

									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: complinelength,
										value: convertedQuantity
									});
									if (enterBin != null && enterBin != "" && enterBin != 'null')
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: complinelength,
											value: enterBin
										});

									if (tallyObj.statusName != undefined && tallyObj.statusName != null && tallyObj.statusName != '') {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: complinelength,
											value: tallyObj.statusName
										});
									}
									complinelength = complinelength + 1;
								}
							} else {

								compSubRecord.insertLine({
									sublistId: 'inventoryassignment',
									line: complinelength
								});
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'quantity',
									line: complinelength,
									value: enterQty
								});
								if (enterBin != null && enterBin != "" && enterBin != 'null')
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'binnumber',
										line: complinelength,
										value: enterBin
									});
								if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: complinelength,
										value: vInvStatus_select
									});
							}
						}
					} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
						var serialSearch = search.load({
							id: 'customsearch_wmsse_wo_serialentry_srh',
						});
						var serailFilters = serialSearch.filters;

						serailFilters.push(search.createFilter({
							name: 'custrecord_wmsse_ser_ordline',
							operator: search.Operator.EQUALTO,
							values: poLineno
						}));
						serailFilters.push(search.createFilter({
							name: 'custrecord_wmsse_ser_ordno',
							operator: search.Operator.ANYOF,
							values: poInternalId
						}));

						serialSearch.filters = serailFilters;
						var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
						var serialSearchResultsLength = serialSearchResults.length;
						log.debug('serialSearchResults', serialSearchResults);
						if (serialSearchResultsLength > 0) {

							var compSubRecord = trecord.getSublistSubrecord({
								sublistId: 'item',
								fieldId: 'inventorydetail',
								line: itemindex
							});
							var complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							if (parseInt(complinelength) > 0) {

								for (var vItr = 0; vItr < complinelength; vItr++) {
									compSubRecord.removeLine({
										sublistId: 'inventoryassignment',
										line: 0
									});
								}
								complinelength = compSubRecord.getLineCount({
									sublistId: 'inventoryassignment'
								});
							}
							var tLineNo = complinelength;
							for (var n = 0; n < serialSearchResultsLength; n++) {
								if (n > 0) {
									tLineNo = parseInt(complinelength) + 1;
								}
								compSubRecord.insertLine({
									sublistId: 'inventoryassignment',
									line: tLineNo
								});
								if (isTallyScanRequired == true) {
									vInvStatus_select = serialSearchResults[n]['custrecord_serial_inventorystatus'];
								}

								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'quantity',
									line: tLineNo,
									value: 1
								});
								compSubRecord.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'receiptinventorynumber',
									line: tLineNo,
									value: serialSearchResults[n]['custrecord_wmsse_ser_no']
								});
								if (utility.isValueValid(enterBin)) {
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'binnumber',
										line: tLineNo,
										value: enterBin
									});
								}
								if (utility.isValueValid(vInvStatus_select)) {
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: tLineNo,
										value: vInvStatus_select
									});
								}
							}


						}

					}
					if (trecord != null && trecord != '') {

						idl = trecord.save();
						impctRecReturn['itemreceiptid'] = idl;
					}
				}
			}

			if (!utility.isValueValid(idl)) {
				impctRecReturn['itemreceiptid'] = null;
			}

			if ((idl != '' && idl != null && idl != 'null' && idl != undefined) || (systemRule != null && systemRule != '' && systemRule == 'Y')) {
				var taskType = "PUTW";
				var opentaskObj = {};
				opentaskObj.poInternalId = poInternalId;
				opentaskObj.FetchedItemId = FetchedItemId;
				opentaskObj.poLineno = poLineno;
				opentaskObj.enterQty = objPostIrValues.enterQty;
				opentaskObj.enterBin = enterBin;
				opentaskObj.itemType = itemType;
				opentaskObj.whLocation = whLocation;
				opentaskObj.batchno = batchno;
				opentaskObj.expiryDate = expiryDate;
				opentaskObj.fifoDate = fifoDate;
				opentaskObj.itemReceiptId = idl;
				opentaskObj.poname = poname;
				opentaskObj.PutStrategy = PutStrategy;
				opentaskObj.zoneno = zoneno;
				opentaskObj.taskType = taskType;
				opentaskObj.trantype = trantype;
				opentaskObj.actualBeginTime = actualBeginTime;
				opentaskObj.systemRule = systemRule;
				opentaskObj.uom = uom;
				opentaskObj.conversionRate = conversionRate;
				opentaskObj.vInvStatus_select = vInvStatus_select;
				opentaskObj.strBarCode = strBarCode;
				opentaskObj.binLocType = objPostIrValues.binLocType;
				opentaskObj.binIsCart = objPostIrValues.binIsCart;
				opentaskObj.isKitComponent = objPostIrValues.isKitComponent;
				opentaskObj.parentItem = objPostIrValues.parentItem;
				opentaskObj.parentItemLine = objPostIrValues.parentItemLine;
				if (utility.isValueValid(trantype) && trantype == 'returnauthorization' && utility.isValueValid(restock)) {
					opentaskObj.restock = restock;
				}

				if (isTallyScanRequired == true && itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {
					for (var obj in tallyLoopObj) {
						var tallyObj = tallyLoopObj[obj];
						opentaskObj.vInvStatus_select = tallyObj.statusName;
						opentaskObj.batchno = tallyObj.lotName;
						opentaskObj.expiryDate = tallyObj.lotExpiryDate;
						if (utility.isValueValid(selectedConversionRateForTallyScan)) {
							var qty = Number(Big(tallyObj.quantity).mul(selectedConversionRateForTallyScan));
							opentaskObj.enterQty = Number(Big(qty).div(conversionRate));
						} else {
							opentaskObj.enterQty = tallyObj.quantity;
						}
						idl = inboundUtility.updateOpenTask(opentaskObj);
					}
				} else {
					idl = inboundUtility.updateOpenTask(opentaskObj);
					if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
						inboundUtility.updateSerialEntryWithOpenTaskId(poLineno, poInternalId, idl, enterBin, vInvStatus_select);

					}
				}

				if (utility.isValueValid(idl)) {
					impctRecReturn.openTaskId = idl;

					// serach to get labels.
					var labelrecArr = [];

					var labelSearchQuery = query.create({
						type: 'customrecord_wmsse_labelprinting'
					});

					var ponameCond = labelSearchQuery.createCondition({
						fieldId: 'name',
						operator: query.Operator.IS,
						values: poname
					});

					var inactiveCond = labelSearchQuery.createCondition({
						fieldId: 'isinactive',
						operator: query.Operator.IS,
						values: false
					});

					var idlCond = labelSearchQuery.createCondition({
						fieldId: 'custrecord_wmsse_label_opentaskid',
						operator: query.Operator.IS,
						values: idl
					});

					var whLocationCond = labelSearchQuery.createCondition({
						fieldId: 'custrecord_wmsse_label_location',
						operator: query.Operator.ANY_OF,
						values: whLocation
					});

					labelSearchQuery.columns = [
						labelSearchQuery.createColumn({
							fieldId: 'id'
						})
					];

					labelSearchQuery.condition = labelSearchQuery.and(
						ponameCond, inactiveCond, idlCond, whLocationCond);

					var result = labelSearchQuery.run().results;

					var tdate = new Date();
					log.debug({
						title: 'timeStamp after nquery customsearch_wms_label_dtls ',
						details: tdate.getHours() + ":" + tdate.getMinutes() + ":" + tdate.getSeconds() + ":" + tdate.getMilliseconds()
					});

					if (utility.isValueValid(result) && result.length > 0) {

						for (var objLabeldetails in result) {
							labelrecArr.push(result[objLabeldetails].values[0]);
						}
						impctRecReturn['labelrec'] = labelrecArr;
					} else {
						impctRecReturn['labelrec'] = labelrecArr;
					}


					// serach to get External labels.
					var extlabelSearch = search.load({
						type: 'customrecord_wmsse_ext_labelprinting',
						id: 'customsearch_wms_ext_label_id_dtls'
					});
					extlabelSearch.filters.push(search.createFilter({
						name: 'name',
						operator: search.Operator.IS,
						values: poname
					}));

					extlabelSearch.filters.push(search.createFilter({
						name: 'custrecord_wmsse_label_ext_opentaskid',
						operator: search.Operator.IS,
						values: idl
					}));

					var extLabelResult = utility.getSearchResultInJSON(extlabelSearch);
					var extlabelrecArr = [];

					if (utility.isValueValid(extLabelResult) && extLabelResult.length > 0) {
						for (var i = 0; i < extLabelResult.length; i++) {
							extlabelrecArr.push(parseInt(extLabelResult[i]['internalid']));
						}
						impctRecReturn['extlabelrec'] = extlabelrecArr;
					} else {
						impctRecReturn['extlabelrec'] = extlabelrecArr;
					}
				}

			}
			return impctRecReturn;

		}

		function updateItemReceiptDetailsForRMAKit(trecord, selectedOpentaskSearchResult, opentaskSearchResults,
			warehouseLocationId, transactionInternalId, kitDetailsforRMA, kitIRPostObj, irUpdateOpenTaskId, splitOpenTaskId) {

			var processedLineArr = [];
			var rmaLineLength = trecord.getLineCount({
				sublistId: 'item'
			});
			for (var itr = 0; itr < rmaLineLength; itr++) {
				trecord.setSublistValue({
					sublistId: 'item',
					fieldId: 'itemreceive',
					line: itr,
					value: false
				});
			}

			for (var irItr = 0; irItr < rmaLineLength; irItr++) {
				itemLineNo = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'line',
					line: irItr
				});
				item_id = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: irItr
				});
				itemrec = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'itemreceive',
					line: irItr
				});
				isSerialItem = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'isserial',
					line: irItr
				});
				isLotItem = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'isnumbered',
					line: irItr
				});
				isInventoryItem = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'invttype',
					line: irItr
				});
				var itemType = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'itemtype',
					line: irItr
				});

				if (selectedOpentaskSearchResult.custrecord_wmsse_line_no == itemLineNo &&
					processedLineArr.indexOf(selectedOpentaskSearchResult.custrecord_wmsse_line_no) == -1) {
					var kitQuantity = kitIRPostObj[selectedOpentaskSearchResult.custrecord_wmsse_parent_sku_no];

					var requiredItemQty = (itemType == 'Kit') ? kitQuantity : Number(Big(kitQuantity).mul(kitDetailsforRMA[selectedOpentaskSearchResult.custrecord_wmsse_parent_sku_no][item_id]));

					if (isSerialItem == 'T') {
						itemType = 'serializedinventoryitem';
					} else if (isLotItem == 'T') {
						itemType = 'lotnumberedinventoryitem';
					} else if (isInventoryItem == 'T') {
						itemType = 'inventoryitem';
					} else {}
					if (itemType == 'Kit') {
						irUpdateOpenTaskId.push(selectedOpentaskSearchResult.id);
					}
					var whLocation = trecord.getSublistValue({
						sublistId: 'item',
						fieldId: 'location',
						line: irItr
					});
					if (whLocation == null || whLocation == "")
						whLocation = warehouseLocationId;
					trecord.setSublistValue({
						sublistId: 'item',
						line: irItr,
						fieldId: 'itemreceive',
						value: true
					});
					trecord.setSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						line: irItr,
						value: Number(Big(requiredItemQty).toFixed(5))
					});
					trecord.setSublistValue({
						sublistId: 'item',
						fieldId: 'location',
						line: irItr,
						value: whLocation
					});
					if (utility.isValueValid(selectedOpentaskSearchResult.custrecord_wmsse_restock) && selectedOpentaskSearchResult.custrecord_wmsse_restock == false) {
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'restock',
							line: irItr,
							value: false
						});
					} else if (utility.isValueValid(selectedOpentaskSearchResult.custrecord_wmsse_restock) && selectedOpentaskSearchResult.custrecord_wmsse_restock == true) {
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'restock',
							line: irItr,
							value: true
						});
					}
					if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem" || itemType == "lotnumberedinventoryitem" ||
						itemType == "lotnumberedassemblyitem" || itemType == "inventoryitem" || itemType == "assemblyitem") {
						var compSubRecord = trecord.getSublistSubrecord({
							sublistId: 'item',
							fieldId: 'inventorydetail',
							line: irItr
						});
						var complinelength = compSubRecord.getLineCount({
							sublistId: 'inventoryassignment'
						});
						var inventoryassignmentQty = 0;
						var totalKitComponentQty = 0;
						if (parseInt(complinelength) > 0) {
							for (var invassItr = 0; invassItr < complinelength; invassItr++) {
								compSubRecord.removeLine({
									sublistId: 'inventoryassignment',
									line: 0
								});
							}
						}
						complinelength = compSubRecord.getLineCount({
							sublistId: 'inventoryassignment'
						});
						if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
							for (var itr2 = 0; itr2 < opentaskSearchResults.length; itr2++) {

								var opentaskLinenumber = opentaskSearchResults[itr2]['custrecord_wmsse_line_no'];
								var vInvStatus_select = opentaskSearchResults[itr2]['custrecord_wmsse_inventorystatus'];
								var openTaskBatchno = opentaskSearchResults[itr2]['custrecord_wmsse_batch_num'];
								var opentaskQuantity = opentaskSearchResults[itr2]['custrecord_wmsse_act_qty'];
								var opentaskbin = opentaskSearchResults[itr2]['custrecord_wmsse_actendloc'];
								var expiryDate = opentaskSearchResults[itr2]['custrecord_wmsse_expirydate'];
								if (opentaskLinenumber == itemLineNo) {
									if (parseFloat(requiredItemQty) < parseFloat(opentaskQuantity)) {
										inventoryassignmentQty = requiredItemQty;
										splitOpenTaskId[opentaskSearchResults[itr2].id] = {
											'requiredItemQty': requiredItemQty,
											'opentaskQty': opentaskQuantity
										};
									} else {
										inventoryassignmentQty = opentaskQuantity;
										irUpdateOpenTaskId.push(opentaskSearchResults[itr2].id);
									}

									totalKitComponentQty = Number(Big(inventoryassignmentQty).plus(totalKitComponentQty));
									compSubRecord.insertLine({
										sublistId: 'inventoryassignment',
										line: complinelength
									});
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: complinelength,
										value: Number(Big(inventoryassignmentQty).toFixed(5))
									});
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'receiptinventorynumber',
										line: complinelength,
										value: openTaskBatchno
									});
									if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: complinelength,
											value: opentaskbin
										});
									if (expiryDate != null && expiryDate != "" && expiryDate != 'null') {
										var parsedExpiryDate = format.parse({
											value: expiryDate,
											type: format.Type.DATE
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'expirationdate',
											line: complinelength,
											value: parsedExpiryDate
										});
									}
									if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: complinelength,
											value: vInvStatus_select
										});
									complinelength++;

									if (totalKitComponentQty == requiredItemQty) {
										break;
									}
								}
							}
						} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
							var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
							var noBinFlag = true;
							if (inventoryStatusFeature == false) {
								var locationUseBinlFlag = true;
								var columnlocationlookupArray = [];
								columnlocationlookupArray.push('usesbins');
								var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId, columnlocationlookupArray);
								if (locationLookUp.usesbins != undefined) {
									locationUseBinlFlag = locationLookUp.usesbins;
								}
								if (locationUseBinlFlag != true) {
									noBinFlag = false;
								}
							}
							if (noBinFlag) {
								for (var itr1 = 0; itr1 < opentaskSearchResults.length; itr1++) {
									var opentaskLinenumber = opentaskSearchResults[itr1]['custrecord_wmsse_line_no'];
									var vInvStatus_select = opentaskSearchResults[itr1]['custrecord_wmsse_inventorystatus'];
									var opentaskQuantity = opentaskSearchResults[itr1]['custrecord_wmsse_act_qty'];
									var opentaskbin = opentaskSearchResults[itr1]['custrecord_wmsse_actendloc'];
									if (opentaskLinenumber == itemLineNo) {
										if (parseFloat(requiredItemQty) < parseFloat(opentaskQuantity)) {
											inventoryassignmentQty = requiredItemQty;
											splitOpenTaskId[opentaskSearchResults[itr1].id] = {
												'requiredItemQty': requiredItemQty,
												'opentaskQty': opentaskQuantity
											};
										} else {
											inventoryassignmentQty = opentaskQuantity;
											irUpdateOpenTaskId.push(opentaskSearchResults[itr1].id);
										}

										totalKitComponentQty = Number(Big(inventoryassignmentQty).plus(totalKitComponentQty));
										compSubRecord.insertLine({
											sublistId: 'inventoryassignment',
											line: complinelength
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: complinelength,
											value: Number(Big(inventoryassignmentQty).toFixed(5))
										});
										if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'binnumber',
												line: complinelength,
												value: opentaskbin
											});
										if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'inventorystatus',
												line: complinelength,
												value: vInvStatus_select
											});
										complinelength++;
										if (totalKitComponentQty == requiredItemQty) {
											break;
										}
									}
								}
							}
						} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
							var opentaskLinenumberArray = [];
							var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
							for (var itr3 = 0; itr3 < opentaskSearchResults.length; itr3++) {
								var opentaskLinenumber = opentaskSearchResults[itr3]['custrecord_wmsse_line_no'];
								var opentaskQuantity = opentaskSearchResults[itr3]['custrecord_wmsse_act_qty'];
								if (opentaskLinenumber == itemLineNo) {

									if (parseFloat(requiredItemQty) < parseFloat(opentaskQuantity)) {
										inventoryassignmentQty = requiredItemQty;
										splitOpenTaskId[opentaskSearchResults[itr3].id] = {
											'requiredItemQty': requiredItemQty,
											'opentaskQty': opentaskQuantity
										};
									} else {
										inventoryassignmentQty = opentaskQuantity;
										irUpdateOpenTaskId.push(opentaskSearchResults[itr3].id);
									}

									totalKitComponentQty = Number(Big(inventoryassignmentQty).plus(totalKitComponentQty));
									if (inventoryStatusFeature == true) {
										if (opentaskLinenumberArray.indexOf(opentaskLinenumber) == -1) {
											opentaskLinenumberArray.push(opentaskLinenumber);
											var serialSearch = search.load({
												id: 'customsearch_wmsse_wo_serialentry_srh',
											});
											var serailFilters = serialSearch.filters;
											serailFilters.push(search.createFilter({
												name: 'custrecord_wmsse_ser_ordline',
												operator: search.Operator.EQUALTO,
												values: itemLineNo
											}));
											serailFilters.push(search.createFilter({
												name: 'custrecord_wmsse_ser_ordno',
												operator: search.Operator.ANYOF,
												values: transactionInternalId
											}));
											serialSearch.filters = serailFilters;
											var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
											var serialSearchResultsLength = serialSearchResults.length;
											log.debug('serialSearchResults', serialSearchResults);
											if (serialSearchResultsLength > 0) {
												for (var n = 0; n < serialSearchResultsLength; n++) {
													compSubRecord.insertLine({
														sublistId: 'inventoryassignment',
														line: n
													});
													vInvStatus_select = serialSearchResults[n]['custrecord_serial_inventorystatus'];
													var opentaskbin = serialSearchResults[n]['custrecord_wmsse_ser_bin'];
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'quantity',
														line: n,
														value: 1
													});
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'receiptinventorynumber',
														line: n,
														value: serialSearchResults[n]['custrecord_wmsse_ser_no']
													});
													if (utility.isValueValid(opentaskbin)) {
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'binnumber',
															line: n,
															value: opentaskbin
														});
													}
													if (utility.isValueValid(vInvStatus_select)) {
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'inventorystatus',
															line: n,
															value: vInvStatus_select
														});
													}
													if (utility.isValueValid(splitOpenTaskId) && utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id])) {
														if (utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString)) {
															splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString + ',' + serialSearchResults[n]['custrecord_wmsse_ser_no'];
														} else {
															splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = serialSearchResults[n]['custrecord_wmsse_ser_no'];
														}
													}
													var id = record.submitFields({
														type: 'customrecord_wmsse_serialentry',
														id: serialSearchResults[n].id,
														values: {
															'custrecord_wmsse_ser_note1': 'because11111 of serial number is updated in opentask we have marked this serial number as closed',
															'custrecord_wmsse_ser_status': true
														}
													});

												}
											}
										}
									} else {
										var opentaskQuantity = opentaskSearchResults[itr3]['custrecord_wmsse_act_qty'];
										var opentaskserialArray = opentaskSearchResults[itr3]['custrecord_wmsse_serial_no'];
										var opentaskbin = opentaskSearchResults[itr3]['custrecord_wmsse_actendloc'];
										var totalSerialArray = opentaskserialArray.split(',');
										var complinelength = compSubRecord.getLineCount({
											sublistId: 'inventoryassignment'
										});
										if (parseInt(complinelength) > 0) {
											for (var vItr = 0; vItr < complinelength; vItr++) {
												compSubRecord.removeLine({
													sublistId: 'inventoryassignment',
													line: 0
												});
											}
										}
										complinelength = compSubRecord.getLineCount({
											sublistId: 'inventoryassignment'
										});
										for (var k1 = 0; k1 < inventoryassignmentQty; k1++) {
											compSubRecord.insertLine({
												sublistId: 'inventoryassignment',
												line: complinelength
											});
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: k1,
												value: 1
											});
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'receiptinventorynumber',
												line: k1,
												value: totalSerialArray[k1]
											});
											if (utility.isValueValid(opentaskbin)) {
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'binnumber',
													line: k1,
													value: opentaskbin
												});
											}
											complinelength++;
											if (utility.isValueValid(splitOpenTaskId) && utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id])) {
												if (utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString)) {
													splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString + ',' + totalSerialArray[k1];
												} else {
													splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = totalSerialArray[k1];
												}
											}

										}
									}
									if (totalKitComponentQty == requiredItemQty) {
										break;
									}
								}
							}
						}
						processedLineArr.push(itemLineNo);
					}
				}
			}

		}

		function getKitDetailsforRMA(orderInternalId, kititemInternalId) {
			var myTransactionQuery = query.create({
				type: query.Type.TRANSACTION
			});

			var myTransactionQueryline = myTransactionQuery.join({
				fieldId: 'transactionlines'
			});
			var condNottaxline = myTransactionQueryline.createCondition({
				fieldId: 'taxline',
				operator: query.Operator.IS,
				values: false
			});
			var condNotMainline = myTransactionQueryline.createCondition({
				fieldId: 'mainline',
				operator: query.Operator.IS,
				values: false
			});
			var condNotClosed = myTransactionQueryline.createCondition({
				fieldId: 'isclosed',
				operator: query.Operator.IS,
				values: false
			});
			var condfulfillable = myTransactionQueryline.createCondition({
				fieldId: 'item^item.isfulfillable',
				operator: query.Operator.IS,
				values: true
			});
			var condOrdId = myTransactionQuery.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: orderInternalId
			});
			var condItemType = myTransactionQueryline.createCondition({
				fieldId: 'itemtype',
				operator: query.Operator.ANY_OF,
				values: 'Kit'
			});
			if (utility.isValueValid(kititemInternalId)) {
				var condItemId = myTransactionQueryline.createCondition({
					fieldId: 'item',
					operator: query.Operator.ANY_OF,
					values: kititemInternalId
				});
				myTransactionQuery.condition = myTransactionQuery.and(
					condNottaxline, condNotMainline, condNotClosed, condfulfillable, condOrdId, condItemType, condItemId);

			} else {
				myTransactionQuery.condition = myTransactionQuery.and(
					condNottaxline, condNotMainline, condNotClosed, condfulfillable, condOrdId, condItemType);

			}

			myTransactionQuery.columns = [

				myTransactionQueryline.createColumn({
					fieldId: 'id',
					label: 'linesequencenumber'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.itemid',
					label: 'itemname'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'quantity'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'itemtype'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.member.item',
					label: 'componentItemname'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.member.quantity',
					label: 'componentItemQty'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.member.memberunit',
					label: 'componentItemUnit'
				})
			];

			var myPagedData = myTransactionQuery.runPaged({
				pageSize: 1000
			});

			var queryResults = getQueryResults(myPagedData);
			var kitItemDetailsObj = {};
			var itemLineDtlObj = {};
			for (var resultItem = 0; resultItem < queryResults.length; resultItem++) {
				if (utility.isValueValid(kitItemDetailsObj[queryResults[resultItem].item])) {
					itemLineDtlObj = kitItemDetailsObj[queryResults[resultItem].item];
					if (!(utility.isValueValid(itemLineDtlObj[queryResults[resultItem].componentItemname]))) {
						itemLineDtlObj[queryResults[resultItem].componentItemname] = queryResults[resultItem].componentItemQty;
					}
				} else {
					itemLineDtlObj = {};
					itemLineDtlObj[queryResults[resultItem].componentItemname] = queryResults[resultItem].componentItemQty;
					kitItemDetailsObj[queryResults[resultItem].item] = itemLineDtlObj;
					kitItemDetailsObj[queryResults[resultItem].item].quantity = queryResults[resultItem].quantity;
					kitItemDetailsObj[queryResults[resultItem].item].linesequencenumber = queryResults[resultItem].linesequencenumber;

				}
			}
			return kitItemDetailsObj;
		}

		function getKitOpenTaskResults(transactionInternalId, warehouseLocationId, kititemInternalId, checkKitFlag) {
			var postItemReceiptSearchObj = search.load({
				id: 'customsearch_wmsse_postitemreceipt_srch'
			});
			var postItemReceiptSearchFilters = postItemReceiptSearchObj.filters;

			if (utility.isValueValid(transactionInternalId)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: transactionInternalId
				}));
			}
			if (utility.isValueValid(kititemInternalId)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_parent_sku_no',
					operator: search.Operator.ANYOF,
					values: kititemInternalId
				}));
			}

			if (utility.isValueValid(warehouseLocationId)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}
			if (checkKitFlag) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_kitflag',
					operator: search.Operator.IS,
					values: true
				}));
			}


			postItemReceiptSearchObj.filters = postItemReceiptSearchFilters;
			var objPostItemReceiptDetails = utility.getSearchResultInJSON(postItemReceiptSearchObj);
			return objPostItemReceiptDetails;
		}

		function getKitOTResultsforIRPosting(transactionInternalId, kititemInternalId, warehouseLocationId, objPostIRValues) {

			var objPostItemReceiptDetails = getKitOpenTaskResults(transactionInternalId, warehouseLocationId, kititemInternalId, true);

			if (utility.isValueValid(objPostIRValues)) {
				objPostItemReceiptDetails.push({
					'custrecord_wmsse_parent_sku_no': objPostIRValues.parentItem,
					'custrecord_wmsse_sku': objPostIRValues.fetchedItemId,
					'custrecord_wmsse_act_qty': objPostIRValues.enterQty,
					'id': objPostIRValues.fetchedItemId + '_tobegenerated'
				});
			}

			var kitItemDetailsObj = {};
			var itemLineDtlObj = {};
			var OTresultObj = {};
			for (var resultItem = 0; resultItem < objPostItemReceiptDetails.length; resultItem++) {
				if (utility.isValueValid(kitItemDetailsObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_parent_sku_no])) {
					itemLineDtlObj = kitItemDetailsObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_parent_sku_no];
					if (!(utility.isValueValid(itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku]))) {
						OTresultObj = {};
						OTresultObj[objPostItemReceiptDetails[resultItem].id] = objPostItemReceiptDetails[resultItem].custrecord_wmsse_act_qty;
						itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku] = OTresultObj;
						itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku].totalReceivedQty = objPostItemReceiptDetails[resultItem].custrecord_wmsse_act_qty;
					} else {
						itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku][objPostItemReceiptDetails[resultItem].id] = objPostItemReceiptDetails[resultItem].custrecord_wmsse_act_qty;
						itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku].totalReceivedQty = Number(Big(itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku].totalReceivedQty).plus(objPostItemReceiptDetails[resultItem].custrecord_wmsse_act_qty));
					}
				} else {
					itemLineDtlObj = {};
					OTresultObj = {};
					OTresultObj[objPostItemReceiptDetails[resultItem].id] = objPostItemReceiptDetails[resultItem].custrecord_wmsse_act_qty;
					itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku] = OTresultObj;
					itemLineDtlObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_sku].totalReceivedQty = objPostItemReceiptDetails[resultItem].custrecord_wmsse_act_qty;
					kitItemDetailsObj[objPostItemReceiptDetails[resultItem].custrecord_wmsse_parent_sku_no] = itemLineDtlObj;
				}
			}
			if (objPostItemReceiptDetails.length > 0 && utility.isValueValid(objPostItemReceiptDetails[0].custrecord_wmsse_restock) && objPostItemReceiptDetails[0].custrecord_wmsse_restock == false) {
				kitItemDetailsObj.restock = false;
			} else if (objPostItemReceiptDetails.length > 0 && utility.isValueValid(objPostItemReceiptDetails[0].custrecord_wmsse_restock) && objPostItemReceiptDetails[0].custrecord_wmsse_restock == true) {
				kitItemDetailsObj.restock = true;
			}

			return kitItemDetailsObj;
		}

		function matchKitComponentsQty(kitOTResults, kitDetailsforRMA, objPostIrValues, impctRecReturn) {
			var kitIRpostObj = {};
			var totalKitQty = 0;
			var componentObj = {};
			for (var kitItem in kitDetailsforRMA) {
				for (var componentItem in kitDetailsforRMA[kitItem]) {
					if (componentItem != 'quantity' && componentItem != 'linesequencenumber') {
						if (utility.isValueValid(kitOTResults[kitItem][componentItem])) {
							totalKitQty = Number(Big(kitOTResults[kitItem][componentItem].totalReceivedQty).div(kitDetailsforRMA[kitItem][componentItem]));
						} else {
							totalKitQty = 0;
						}
						if (utility.isValueValid(kitIRpostObj[kitItem])) {
							kitIRpostObj[kitItem][componentItem] = totalKitQty;
						} else {
							componentObj = {};
							componentObj[componentItem] = totalKitQty;
							kitIRpostObj[kitItem] = componentObj;
						}
					}
				}
			}

			var componentItemDtlobj = {};
			var outPutKitObj = {};
			for (var kitItemId in kitIRpostObj) {
				componentItemDtlobj = kitIRpostObj[kitItemId];
				for (var componentItemId in componentItemDtlobj) {
					if (outPutKitObj[kitItemId] == '0' || utility.isValueValid(outPutKitObj[kitItemId])) {
						if (parseFloat(outPutKitObj[kitItemId]) > parseFloat(componentItemDtlobj[componentItemId]))
							outPutKitObj[kitItemId] = componentItemDtlobj[componentItemId];
					} else
						outPutKitObj[kitItemId] = componentItemDtlobj[componentItemId];
				}
			}


			if (objPostIrValues.systemRuleValue == 'N') {
				if (utility.isValueValid(outPutKitObj[objPostIrValues.parentItem]) && outPutKitObj[objPostIrValues.parentItem] > 0) {
					outPutKitObj.postItemReceiptforKit = true;
					createOpenTaskforKitAndComponent(objPostIrValues, outPutKitObj[objPostIrValues.parentItem], impctRecReturn); // for creating open taks
					postItemReceiptRMAforKititem(objPostIrValues.whLocation, objPostIrValues.poInternalId, objPostIrValues.parentItem,
						outPutKitObj[objPostIrValues.parentItem], kitDetailsforRMA, impctRecReturn);

				} else {
					outPutKitObj.postItemReceiptforKit = false;
				}
			} else {

				for (var kitItemId in outPutKitObj) {
					if (outPutKitObj[kitItemId] > 0) {
						createOpenTaskforKit(kitItemId, kitDetailsforRMA[kitItemId].linesequencenumber,
							outPutKitObj[kitItemId], objPostIrValues); // for creating open taks
						outPutKitObj.postItemReceiptforKit = true;
					}
				}
			}
			return outPutKitObj;
		}

		function createOpenTaskforKit(kitItemId, kitLineNo, kitQuantity, objPostIrValues) {
			var opentaskObj = {};
			opentaskObj.poInternalId = objPostIrValues.transactionInternalId;
			opentaskObj.poname = objPostIrValues.tranid;
			opentaskObj.FetchedItemId = kitItemId;
			opentaskObj.poLineno = kitLineNo;
			opentaskObj.enterQty = kitQuantity;
			opentaskObj.whLocation = objPostIrValues.whLocation;
			opentaskObj.taskType = "PUTW";
			opentaskObj.trantype = objPostIrValues.transactionType;

			if (utility.isValueValid(opentaskObj.trantype) && opentaskObj.trantype == 'returnauthorization' && utility.isValueValid(objPostIrValues.restock)) {
				opentaskObj.restock = objPostIrValues.restock;
			}

			var openTaskId = inboundUtility.updateOpenTask(opentaskObj);
		}

		function createOpenTaskforKitAndComponent(objPostIrValues, kitQuantity, impctRecReturn) {

			var openTaskId = '';
			var taskType = "PUTW";
			var opentaskObj = {};
			opentaskObj.poInternalId = objPostIrValues.poInternalId;
			opentaskObj.FetchedItemId = objPostIrValues.fetchedItemId;
			opentaskObj.poLineno = objPostIrValues.poLineno;
			opentaskObj.enterQty = objPostIrValues.enterQty;
			opentaskObj.enterBin = objPostIrValues.binInternalId;
			opentaskObj.itemType = objPostIrValues.itemType;
			opentaskObj.whLocation = objPostIrValues.whLocation;
			opentaskObj.batchno = objPostIrValues.lotno;
			opentaskObj.expiryDate = objPostIrValues.lotExpiryDate;
			opentaskObj.fifoDate = objPostIrValues.fifoDate;
			opentaskObj.itemReceiptId = objPostIrValues.idl;
			opentaskObj.poname = objPostIrValues.tranid;
			opentaskObj.PutStrategy = objPostIrValues.PutStrategy;
			opentaskObj.zoneno = objPostIrValues.zoneno;
			opentaskObj.taskType = taskType;
			opentaskObj.trantype = objPostIrValues.transactionType;
			opentaskObj.actualBeginTime = objPostIrValues.actualBeginTime;
			opentaskObj.uom = objPostIrValues.uom;
			opentaskObj.conversionRate = objPostIrValues.conversionRate;
			opentaskObj.vInvStatus_select = objPostIrValues.invtStatus;
			opentaskObj.strBarCode = objPostIrValues.strBarCode;
			opentaskObj.binLocType = objPostIrValues.binLocType;
			opentaskObj.binIsCart = objPostIrValues.binIsCart;
			opentaskObj.isKitComponent = objPostIrValues.isKitComponent;
			opentaskObj.parentItem = objPostIrValues.parentItem;
			opentaskObj.parentItemLine = objPostIrValues.parentItemLine;
			opentaskObj.systemRule = 'Y';

			if (utility.isValueValid(opentaskObj.trantype) && opentaskObj.trantype == 'returnauthorization' && utility.isValueValid(objPostIrValues.restock)) {
				opentaskObj.restock = objPostIrValues.restock;
			}

			openTaskId = inboundUtility.updateOpenTask(opentaskObj); // For Component item
			impctRecReturn.openTaskId = openTaskId;
			if (objPostIrValues.itemType == "serializedinventoryitem" || objPostIrValues.itemType == "serializedassemblyitem") {
				inboundUtility.updateSerialEntryWithOpenTaskId(opentaskObj.poLineno, opentaskObj.poInternalId, opentaskObj.itemReceiptId,
					opentaskObj.enterBin, opentaskObj.vInvStatus_select);
			}

			opentaskObj = {};
			opentaskObj.poInternalId = objPostIrValues.poInternalId;
			opentaskObj.poname = objPostIrValues.tranid;
			opentaskObj.FetchedItemId = objPostIrValues.parentItem;
			opentaskObj.poLineno = objPostIrValues.parentItemLine;
			opentaskObj.enterQty = kitQuantity;
			opentaskObj.whLocation = objPostIrValues.whLocation;
			opentaskObj.itemReceiptId = objPostIrValues.idl;
			opentaskObj.taskType = taskType;
			opentaskObj.actualBeginTime = objPostIrValues.actualBeginTime;
			opentaskObj.trantype = objPostIrValues.transactionType;

			openTaskId = inboundUtility.updateOpenTask(opentaskObj); // For kit

			return openTaskId;
		}

		function postItemReceiptRMAforKititem(warehouseLocationId, transactionInternalId, kititemInternalId, kitQuantity, kitDetailsforRMA, impctRecReturn) {

			var opentaskSearchResults = getKitOpenTaskResults(transactionInternalId, warehouseLocationId, kititemInternalId, false);
			log.debug('opentaskSearchResults', opentaskSearchResults);
			var trecord = null;
			var prossedLinesArr = [];
			var actQuantity = '';
			var itemId = '';
			var batchNo = '';
			var expiryDate = '';
			var serialArray = '';
			var itemReceiptId = '';
			var irUpdateOpenTaskId = [];
			var splitOpenTaskId = {};
			var processedLineArr = [];
			var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
			if (crossSubsidiaryFeature) {
				var locationSubsidiary = utility.getSubsidiaryforLocation(warehouseLocationId);

				trecord = record.transform({
					fromType: record.Type.RETURN_AUTHORIZATION,
					fromId: transactionInternalId,
					toType: record.Type.ITEM_RECEIPT,
					defaultValues: {
						orderinvtsub: locationSubsidiary
					},
					isDynamic: false
				});
			} else {
				trecord = record.transform({
					fromType: record.Type.RETURN_AUTHORIZATION,
					fromId: transactionInternalId,
					toType: record.Type.ITEM_RECEIPT,
					isDynamic: false
				});
			}

			var rmaLineLength = trecord.getLineCount({
				sublistId: 'item'
			});
			for (var itr = 0; itr < rmaLineLength; itr++) {
				trecord.setSublistValue({
					sublistId: 'item',
					fieldId: 'itemreceive',
					line: itr,
					value: false
				});
			}

			for (var irItr = 0; irItr < rmaLineLength; irItr++) {
				itemLineNo = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'line',
					line: irItr
				});
				item_id = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: irItr
				});
				itemrec = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'itemreceive',
					line: irItr
				});
				isSerialItem = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'isserial',
					line: irItr
				});
				isLotItem = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'isnumbered',
					line: irItr
				});
				isInventoryItem = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'invttype',
					line: irItr
				});
				var itemType = trecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'itemtype',
					line: irItr
				});

				for (var otResult = 0; otResult < opentaskSearchResults.length; otResult++) {

					if (opentaskSearchResults[otResult].custrecord_wmsse_line_no == itemLineNo && processedLineArr.indexOf(opentaskSearchResults[otResult].custrecord_wmsse_line_no) == -1) {

						var requiredItemQty = (itemType == 'Kit') ? kitQuantity : Number(Big(kitQuantity).mul(kitDetailsforRMA[kititemInternalId][item_id]));

						if (isSerialItem == 'T') {
							itemType = 'serializedinventoryitem';
						} else if (isLotItem == 'T') {
							itemType = 'lotnumberedinventoryitem';
						} else if (isInventoryItem == 'T') {
							itemType = 'inventoryitem';
						} else {}
						if (itemType == 'Kit') {
							irUpdateOpenTaskId.push(opentaskSearchResults[otResult].id);
						}
						var whLocation = trecord.getSublistValue({
							sublistId: 'item',
							fieldId: 'location',
							line: irItr
						});
						if (whLocation == null || whLocation == "")
							whLocation = warehouseLocationId;
						trecord.setSublistValue({
							sublistId: 'item',
							line: irItr,
							fieldId: 'itemreceive',
							value: true
						});
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'quantity',
							line: irItr,
							value: Number(Big(requiredItemQty).toFixed(5))
						});
						trecord.setSublistValue({
							sublistId: 'item',
							fieldId: 'location',
							line: irItr,
							value: whLocation
						});
						if (utility.isValueValid(opentaskSearchResults[otResult].custrecord_wmsse_restock) && opentaskSearchResults[otResult].custrecord_wmsse_restock == false) {
							trecord.setSublistValue({
								sublistId: 'item',
								fieldId: 'restock',
								line: irItr,
								value: false
							});
						} else if (utility.isValueValid(opentaskSearchResults[otResult].custrecord_wmsse_restock) && opentaskSearchResults[otResult].custrecord_wmsse_restock == true) {
							trecord.setSublistValue({
								sublistId: 'item',
								fieldId: 'restock',
								line: irItr,
								value: true
							});
						}
						if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem" || itemType == "lotnumberedinventoryitem" ||
							itemType == "lotnumberedassemblyitem" || itemType == "inventoryitem" || itemType == "assemblyitem") {
							var compSubRecord = trecord.getSublistSubrecord({
								sublistId: 'item',
								fieldId: 'inventorydetail',
								line: irItr
							});
							var complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							var inventoryassignmentQty = 0;
							var totalKitComponentQty = 0;
							if (parseInt(complinelength) > 0) {
								for (var invassItr = 0; invassItr < complinelength; invassItr++) {
									compSubRecord.removeLine({
										sublistId: 'inventoryassignment',
										line: 0
									});
								}
							}
							complinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
								for (var itr2 = 0; itr2 < opentaskSearchResults.length; itr2++) {

									var opentaskLinenumber = opentaskSearchResults[itr2]['custrecord_wmsse_line_no'];
									var vInvStatus_select = opentaskSearchResults[itr2]['custrecord_wmsse_inventorystatus'];
									var openTaskBatchno = opentaskSearchResults[itr2]['custrecord_wmsse_batch_num'];
									var opentaskQuantity = opentaskSearchResults[itr2]['custrecord_wmsse_act_qty'];
									var opentaskbin = opentaskSearchResults[itr2]['custrecord_wmsse_actendloc'];
									var expiryDate = opentaskSearchResults[itr2]['custrecord_wmsse_expirydate'];
									if (opentaskLinenumber == itemLineNo) {
										if (parseFloat(requiredItemQty) < parseFloat(opentaskQuantity)) {
											inventoryassignmentQty = requiredItemQty;
											splitOpenTaskId[opentaskSearchResults[itr2].id] = {
												'requiredItemQty': requiredItemQty,
												'opentaskQty': opentaskQuantity
											};
										} else {
											inventoryassignmentQty = opentaskQuantity;
											irUpdateOpenTaskId.push(opentaskSearchResults[itr2].id);
										}

										totalKitComponentQty = Number(Big(inventoryassignmentQty).plus(totalKitComponentQty));
										compSubRecord.insertLine({
											sublistId: 'inventoryassignment',
											line: complinelength
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: complinelength,
											value: Number(Big(inventoryassignmentQty).toFixed(5))
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'receiptinventorynumber',
											line: complinelength,
											value: openTaskBatchno
										});
										if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'binnumber',
												line: complinelength,
												value: opentaskbin
											});
										if (expiryDate != null && expiryDate != "" && expiryDate != 'null') {
											var parsedExpiryDate = format.parse({
												value: expiryDate,
												type: format.Type.DATE
											});
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'expirationdate',
												line: complinelength,
												value: parsedExpiryDate
											});
										}
										if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'inventorystatus',
												line: complinelength,
												value: vInvStatus_select
											});
										complinelength++;

										if (totalKitComponentQty == requiredItemQty) {
											break;
										}
									}
								}
							} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
								var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
								var noBinFlag = true;
								if (inventoryStatusFeature == false) {
									var locationUseBinlFlag = true;
									var columnlocationlookupArray = [];
									columnlocationlookupArray.push('usesbins');
									var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId, columnlocationlookupArray);
									if (locationLookUp.usesbins != undefined) {
										locationUseBinlFlag = locationLookUp.usesbins;
									}
									if (locationUseBinlFlag != true) {
										noBinFlag = false;
									}
								}
								if (noBinFlag) {
									for (var itr1 = 0; itr1 < opentaskSearchResults.length; itr1++) {
										var opentaskLinenumber = opentaskSearchResults[itr1]['custrecord_wmsse_line_no'];
										var vInvStatus_select = opentaskSearchResults[itr1]['custrecord_wmsse_inventorystatus'];
										var opentaskQuantity = opentaskSearchResults[itr1]['custrecord_wmsse_act_qty'];
										var opentaskbin = opentaskSearchResults[itr1]['custrecord_wmsse_actendloc'];
										if (opentaskLinenumber == itemLineNo) {
											if (parseFloat(requiredItemQty) < parseFloat(opentaskQuantity)) {
												inventoryassignmentQty = requiredItemQty;
												splitOpenTaskId[opentaskSearchResults[itr1].id] = {
													'requiredItemQty': requiredItemQty,
													'opentaskQty': opentaskQuantity
												};
											} else {
												inventoryassignmentQty = opentaskQuantity;
												irUpdateOpenTaskId.push(opentaskSearchResults[itr1].id);
											}

											totalKitComponentQty = Number(Big(inventoryassignmentQty).plus(totalKitComponentQty));
											compSubRecord.insertLine({
												sublistId: 'inventoryassignment',
												line: complinelength
											});
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: complinelength,
												value: Number(Big(inventoryassignmentQty).toFixed(5))
											});
											if (opentaskbin != null && opentaskbin != "" && opentaskbin != 'null')
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'binnumber',
													line: complinelength,
													value: opentaskbin
												});
											if (vInvStatus_select != null && vInvStatus_select != "" && vInvStatus_select != 'null' && vInvStatus_select != 'undefined')
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'inventorystatus',
													line: complinelength,
													value: vInvStatus_select
												});
											complinelength++;
											if (totalKitComponentQty == requiredItemQty) {
												break;
											}
										}
									}
								}
							} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
								var opentaskLinenumberArray = [];
								var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
								for (var itr3 = 0; itr3 < opentaskSearchResults.length; itr3++) {
									var opentaskLinenumber = opentaskSearchResults[itr3]['custrecord_wmsse_line_no'];
									var opentaskQuantity = opentaskSearchResults[itr3]['custrecord_wmsse_act_qty'];
									if (opentaskLinenumber == itemLineNo) {

										if (parseFloat(requiredItemQty) < parseFloat(opentaskQuantity)) {
											inventoryassignmentQty = requiredItemQty;
											splitOpenTaskId[opentaskSearchResults[itr3].id] = {
												'requiredItemQty': requiredItemQty,
												'opentaskQty': opentaskQuantity
											};
										} else {
											inventoryassignmentQty = opentaskQuantity;
											irUpdateOpenTaskId.push(opentaskSearchResults[itr3].id);
										}

										totalKitComponentQty = Number(Big(inventoryassignmentQty).plus(totalKitComponentQty));
										if (inventoryStatusFeature == true) {
											if (opentaskLinenumberArray.indexOf(opentaskLinenumber) == -1) {
												opentaskLinenumberArray.push(opentaskLinenumber);
												var serialSearch = search.load({
													id: 'customsearch_wmsse_wo_serialentry_srh',
												});
												var serailFilters = serialSearch.filters;
												serailFilters.push(search.createFilter({
													name: 'custrecord_wmsse_ser_ordline',
													operator: search.Operator.EQUALTO,
													values: itemLineNo
												}));
												serailFilters.push(search.createFilter({
													name: 'custrecord_wmsse_ser_ordno',
													operator: search.Operator.ANYOF,
													values: transactionInternalId
												}));
												serialSearch.filters = serailFilters;
												var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
												var serialSearchResultsLength = serialSearchResults.length;
												log.debug('serialSearchResults', serialSearchResults);
												if (serialSearchResultsLength > 0) {
													for (var n = 0; n < inventoryassignmentQty; n++) {
														compSubRecord.insertLine({
															sublistId: 'inventoryassignment',
															line: n
														});
														vInvStatus_select = serialSearchResults[n]['custrecord_serial_inventorystatus'];
														var opentaskbin = serialSearchResults[n]['custrecord_wmsse_ser_bin'];
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'quantity',
															line: n,
															value: 1
														});
														compSubRecord.setSublistValue({
															sublistId: 'inventoryassignment',
															fieldId: 'receiptinventorynumber',
															line: n,
															value: serialSearchResults[n]['custrecord_wmsse_ser_no']
														});
														if (utility.isValueValid(opentaskbin)) {
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'binnumber',
																line: n,
																value: opentaskbin
															});
														}
														if (utility.isValueValid(vInvStatus_select)) {
															compSubRecord.setSublistValue({
																sublistId: 'inventoryassignment',
																fieldId: 'inventorystatus',
																line: n,
																value: vInvStatus_select
															});
														}
														if (utility.isValueValid(splitOpenTaskId) && utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id])) {
															if (utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString)) {
																splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString + ',' + serialSearchResults[n]['custrecord_wmsse_ser_no'];
															} else {
																splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = serialSearchResults[n]['custrecord_wmsse_ser_no'];
															}
														}
														var id = record.submitFields({
															type: 'customrecord_wmsse_serialentry',
															id: serialSearchResults[n].id,
															values: {
																'custrecord_wmsse_ser_note1': 'because11111 of serial number is updated in opentask we have marked this serial number as closed',
																'custrecord_wmsse_ser_status': true
															}
														});

													}
												}
											}
										} else {
											var opentaskQuantity = opentaskSearchResults[itr3]['custrecord_wmsse_act_qty'];
											var opentaskserialArray = opentaskSearchResults[itr3]['custrecord_wmsse_serial_no'];
											var opentaskbin = opentaskSearchResults[itr3]['custrecord_wmsse_actendloc'];
											var totalSerialArray = opentaskserialArray.split(',');
											var complinelength = compSubRecord.getLineCount({
												sublistId: 'inventoryassignment'
											});
											if (parseInt(complinelength) > 0) {
												for (var vItr = 0; vItr < complinelength; vItr++) {
													compSubRecord.removeLine({
														sublistId: 'inventoryassignment',
														line: 0
													});
												}
											}
											complinelength = compSubRecord.getLineCount({
												sublistId: 'inventoryassignment'
											});
											for (var k1 = 0; k1 < inventoryassignmentQty; k1++) {
												compSubRecord.insertLine({
													sublistId: 'inventoryassignment',
													line: complinelength
												});
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'quantity',
													line: k1,
													value: 1
												});
												compSubRecord.setSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'receiptinventorynumber',
													line: k1,
													value: totalSerialArray[k1]
												});
												if (utility.isValueValid(opentaskbin)) {
													compSubRecord.setSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'binnumber',
														line: k1,
														value: opentaskbin
													});
												}
												complinelength++;
												if (utility.isValueValid(splitOpenTaskId) && utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id])) {
													if (utility.isValueValid(splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString)) {
														splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString + ',' + totalSerialArray[k1];
													} else {
														splitOpenTaskId[opentaskSearchResults[itr3].id].serialsString = totalSerialArray[k1];
													}
												}

											}
										}
										if (totalKitComponentQty == requiredItemQty) {
											break;
										}
									}
								}
							}
							processedLineArr.push(itemLineNo);
						}
					}
				}
			}


			if (trecord != null && trecord != '') {
				itemReceiptId = trecord.save();
				impctRecReturn.itemreceiptid = itemReceiptId;
			}

			if (itemReceiptId != null && itemReceiptId != '') {
				updateorCloneOpenTask(itemReceiptId, irUpdateOpenTaskId, splitOpenTaskId);
			}
			log.debug('itemReceiptId', itemReceiptId);

		}

		function updateorCloneOpenTask(itemReceiptId, irUpdateOpenTaskId, splitOpenTaskId) {
			var opentaskId = '';
			var postedSerialsArray = [];
			var yettobePostedSerials = [];
			for (var otCount = 0; otCount < irUpdateOpenTaskId.length; otCount++) {
				record.submitFields({
					type: 'customrecord_wmsse_trn_opentask',
					id: irUpdateOpenTaskId[otCount],
					values: {
						'custrecord_wmsse_nsconfirm_ref_no': itemReceiptId
					}
				});
			}
			for (var opentaskId in splitOpenTaskId) {
				yettobePostedSerials = [];
				postedSerialsArray = [];
				var openTaskRec = record.load({
					type: 'customrecord_wmsse_trn_opentask',
					id: opentaskId
				});
				var tranId = openTaskRec.getValue({
					fieldId: 'name'
				});
				if (utility.isValueValid(splitOpenTaskId[opentaskId].serialsString)) {
					postedSerialsArray = (splitOpenTaskId[opentaskId].serialsString).split(',');
					var openTaskSerials = openTaskRec.getValue({
						fieldId: 'custrecord_wmsse_serial_no'
					});
					openTaskSerials = openTaskSerials.split(',');
					for (var serials = 0; serials < openTaskSerials.length; serials++) {
						if (postedSerialsArray.indexOf(openTaskSerials[serials]) == -1) {
							yettobePostedSerials.push(openTaskSerials[serials]);
						}
					}
				}

				openTaskRec.setValue({
					fieldId: 'custrecord_wmsse_expe_qty',
					value: splitOpenTaskId[opentaskId].requiredItemQty
				});
				openTaskRec.setValue({
					fieldId: 'custrecord_wmsse_act_qty',
					value: splitOpenTaskId[opentaskId].requiredItemQty
				});
				openTaskRec.setValue({
					fieldId: 'custrecord_wmsse_upd_user_no',
					value: runtime.getCurrentUser().id
				});
				openTaskRec.setValue({
					fieldId: 'custrecord_wmsse_serial_no',
					value: splitOpenTaskId[opentaskId].serialsString
				});
				openTaskRec.setValue({
					fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
					value: itemReceiptId
				});

				openTaskRec.save();


				var cloneOpenTaskRec = record.copy({
					type: 'customrecord_wmsse_trn_opentask',
					id: opentaskId
				});
				var remainingQty = Number(Big(parseFloat(splitOpenTaskId[opentaskId].opentaskQty)).minus(parseFloat(splitOpenTaskId[opentaskId].requiredItemQty)).toFixed(8));
				cloneOpenTaskRec.setValue({
					fieldId: 'custrecord_wmsse_expe_qty',
					value: remainingQty
				});
				cloneOpenTaskRec.setValue({
					fieldId: 'custrecord_wmsse_act_qty',
					value: remainingQty
				});
				cloneOpenTaskRec.setValue({
					fieldId: 'custrecord_wmsse_upd_user_no',
					value: runtime.getCurrentUser().id
				});
				cloneOpenTaskRec.setValue({
					fieldId: 'custrecord_wmsse_serial_no',
					value: yettobePostedSerials.toString()
				});
				cloneOpenTaskRec.setValue({
					fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
					value: ''
				});
				cloneOpenTaskRec.setValue({
					fieldId: 'name',
					value: tranId
				});
				var cloneOpenTaskRecId = cloneOpenTaskRec.save();

			}
		}

		function getQueryResults(pagedData) {
			var queryResults = [];
			pagedData.pageRanges.forEach(function (pageRange) {
				var myPage = pagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, queryResults, columnsObj);
					}
				}
			});
			log.debug('queryResults', queryResults);
			return queryResults;
		}

		function convertToJsonObj(result, resultsArray, columnsObj) {
			var columns = columnsObj;
			var values = result.values;
			var dataObj = {};
			for (var col in columns) {
				var colName = columns[col]['fieldId'];
				if (utility.isValueValid(columns[col]['label'])) {
					colName = columns[col]['label'];
				}
				dataObj[colName] = values[col];

			}
			resultsArray.push(dataObj);
		}

		function getLotorSerialDetailsFromIF(transactionInternalId, fetchedItemId, transactionLineno, itemFulfillmentId) {
			var tranLotSerialResultValues = [];
			var tranLotSerialdetails = search.load({
				id: 'customsearch_wmsse_transf_ful_lot_detail'
			});
			var tranfilter = tranLotSerialdetails.filters;
			if (utility.isValueValid(transactionInternalId)) {
				tranfilter.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: transactionInternalId
				}));
			}
			tranfilter.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: fetchedItemId
			}));
			var fline = (parseFloat(transactionLineno) + 1);
			log.debug({
				title: 'fline',
				details: fline
			});
			tranfilter.push(search.createFilter({
				name: 'line',
				operator: search.Operator.EQUALTO,
				values: fline
			}));
			tranLotSerialdetails.filters = tranfilter;
			var tranLotSerialresults = utility.getSearchResultInJSON(tranLotSerialdetails);
			for (var itr in tranLotSerialresults) {
				var searchItemFulfillmentId = tranLotSerialresults[itr]['internalid'];
				var lotOrSerialnumber = tranLotSerialresults[itr]['serialnumber'];
				if (searchItemFulfillmentId == itemFulfillmentId)
					tranLotSerialResultValues.push(lotOrSerialnumber);
			}
			log.debug({
				title: 'return tranLotSerialResultValues',
				details: tranLotSerialResultValues
			});
			return tranLotSerialResultValues;
		}

		function getUseItemCostForTO(orderInternalId) {
			var useitemcostflag = false;
			try {
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
			} catch (e) {
				log.error('Exeception in getUseItemCostForTO', e);
			}
			return useitemcostflag;
		}

		function getItemReceiptDetails(orderInternalid, itemReceiptId, warehouselocationId) {
			try {
				var itemReceiptTransactionQuery = query.create({
					type: query.Type.TRANSACTION
				});

				var conditionType = itemReceiptTransactionQuery.createCondition({
					fieldId: 'type',
					operator: query.Operator.IS,
					values: "ItemRcpt"
				});
				var transactionQueryline = itemReceiptTransactionQuery.join({
					fieldId: 'transactionlines'
				});
				var conditionMainline = transactionQueryline.createCondition({
					fieldId: 'mainline',
					operator: query.Operator.IS,
					values: false
				})
				var conditionLocation = transactionQueryline.createCondition({
					fieldId: 'location',
					operator: query.Operator.ANY_OF,
					values: warehouselocationId
				})

				itemReceiptTransactionQuery.condition = itemReceiptTransactionQuery.and(
					conditionType, conditionMainline, conditionLocation);
				if (utility.isValueValid(orderInternalid)) {
					var conditionCreateFrom = transactionQueryline.createCondition({
						fieldId: 'createdfrom',
						operator: query.Operator.ANY_OF,
						values: orderInternalid
					})
					itemReceiptTransactionQuery.condition = itemReceiptTransactionQuery.and(itemReceiptTransactionQuery.condition, conditionCreateFrom);
				} else {
					var conditionItemReceiptId = itemReceiptTransactionQuery.createCondition({
						fieldId: 'id',
						operator: query.Operator.ANY_OF,
						values: itemReceiptId
					});
					itemReceiptTransactionQuery.condition = itemReceiptTransactionQuery.and(itemReceiptTransactionQuery.condition, conditionItemReceiptId);
				}
				itemReceiptTransactionQuery.columns = [
					itemReceiptTransactionQuery.createColumn({
						fieldId: 'id',
						groupBy: true,
						alias: 'internalid'
					}),
					itemReceiptTransactionQuery.createColumn({
						fieldId: 'tranid',
						groupBy: true,
						alias: 'referencenumber'
					}),
					itemReceiptTransactionQuery.createColumn({
						fieldId: 'number',
						groupBy: true,
						alias: 'number'
					}),
					transactionQueryline.createColumn({
						fieldId: 'item^item.itemid',
						groupBy: true,
						alias: 'itemname'
					}),
					transactionQueryline.createColumn({
						fieldId: 'quantity',
						aggregate: query.Aggregate.SUM,
						alias: 'quantity'
					}),
					transactionQueryline.createColumn({
						fieldId: 'units.unitname',
						groupBy: true,
						alias: 'units'
					}),
				]
				itemReceiptTransactionQuery.sort = [
					itemReceiptTransactionQuery.createSort({
						column: itemReceiptTransactionQuery.columns[0],
						ascending: true
					})
				];
				return itemReceiptTransactionQuery.run().asMappedResults();
			} catch (e) {
				log.error('Expection in getItemReceiptDetails', e);
			}

		}

		function updateItemReceipt(inventoryStatusFeature, nsrefno, ordid, ordlineno, trantype, totalqty, serials, taskactloc, taskstatus, tasklotno, parentItemArray, itemId, kitFlag, nsrefCounter) {
			var returnID = -1;
			if (ordid != null && ordid != '') {
				var opentaskSerialArr = [];
				var itemType = '';
				var itemIndex = -1;
				var boolfound = true;

				if (trantype == "returnauthorization" && nsrefCounter > 0) { //found nsref in other OT also
					nsrefno = '';
					returnID = 1;
				}

				if (utility.isValueValid(nsrefno)) {
					var transformRec = record.load({
						type: 'itemreceipt',
						id: nsrefno
					});
					var kitItemLineNo = 0;
					// To get the no of lines from item fulfillment record
					var IRItemsLength = transformRec.getLineCount("item");
					log.debug("IRItemsLength111111", IRItemsLength);
					var kitLineNoArray = [];
					var normalItemsArray = [];

					for (var j = 0; IRItemsLength != null && j < IRItemsLength; j++) {

						var itemLineNo = transformRec.getSublistValue({
							sublistId: 'item',
							fieldId: 'orderline',
							line: j
						});
						var IRitemtype = transformRec.getSublistValue({
							sublistId: 'item',
							fieldId: 'itemtype',
							line: j
						});
						var IRItemId = transformRec.getSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: j
						});
						log.debug('itemLineNo in loop starting', itemLineNo);
						log.debug('ordlineno', ordlineno);
						log.debug('IRitemtype', IRitemtype);
						log.debug('IRItemId', IRItemId);
						log.debug('parentItemArray', parentItemArray);
						log.debug('current transaction itemId', itemId);
						if (trantype == "transferorder") {
							itemLineNo = parseInt(itemLineNo) - 2;
						}
						if (trantype == "returnauthorization" && kitFlag === true && (!utility.isValueValid(itemLineNo))) {
							itemIndex = kitItemLineNo;

							log.debug('itemLineNo is empty because component came', itemIndex);
						} else {
							log.debug('itemLineNo is not empty because parentItem came', itemLineNo);

							if (IRitemtype === 'Kit' && trantype == "returnauthorization") {
								kitLineNoArray.push(kitItemLineNo);
								log.debug('assigning with mainitem ', kitLineNoArray);

								if (kitLineNoArray.length > 0 && parentItemArray.indexOf(IRItemId) != -1 && IRitemtype === 'Kit' && trantype == "returnauthorization") {
									kitItemLineNo = j;
									log.debug('saving mainitem kitItemLineNo', kitItemLineNo);
								}

							} else if (trantype != "returnauthorization") {
								normalItemsArray.push(ordlineno);
							}

							if (itemLineNo == ordlineno) {
								itemIndex = j;

							}
						}
					}
					log.debug("itmindx", itemIndex)

					if (itemIndex != -1) {
						log.debug("totalqty", totalqty)
						if (totalqty > 0) {
							var oldputqty = transformRec.getSublistValue({
								sublistId: 'item',
								fieldId: 'quantity',
								line: itemIndex
							});
							log.debug("oldputqty", oldputqty);
							var newputqty = Number(Big(oldputqty).minus(totalqty));
							log.debug("newputqty", newputqty);
							if (parseFloat(newputqty) > 0) {
								var item_id = transformRec.getSublistValue({
									sublistId: 'item',
									fieldId: 'item',
									line: itemIndex
								});
								var columnlookupArray = [];
								columnlookupArray.push('recordtype');
								var itemLookUp = utility.getItemFieldsByLookup(item_id, columnlookupArray);
								if (itemLookUp.recordtype != undefined) {
									itemType = itemLookUp.recordtype;
								}
								log.debug("itemType", itemType);
								var itemloc2 = transformRec.getSublistValue({
									sublistId: 'item',
									fieldId: 'location',
									line: itemIndex
								});
								transformRec.setSublistValue({
									sublistId: 'item',
									fieldId: 'itemreceive',
									line: itemIndex,
									value: true
								});
								transformRec.setSublistValue({
									sublistId: 'item',
									fieldId: 'quantity',
									line: itemIndex,
									value: newputqty
								});
								transformRec.setSublistValue({
									sublistId: 'item',
									fieldId: 'location',
									line: itemIndex,
									value: itemloc2
								});

								if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {

									var compSubRecord = transformRec.getSublistSubrecord({
										sublistId: 'item',
										fieldId: 'inventorydetail',
										line: itemIndex
									});
									var complinelength = compSubRecord.getLineCount({
										sublistId: 'inventoryassignment'
									});

									for (var r1 = 0; r1 < complinelength; r1++) {

										var vOldSubBinLocText = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: r1
										});
										var vOldSubBinLocQty = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: r1
										});
										var vOldReceiptInventoryNumber = compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'receiptinventorynumber',
											line: r1
										});
										var vOldReceiptInventoryStatus = '';
										if (inventoryStatusFeature == true) {
											vOldReceiptInventoryStatus = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'inventorystatus',
												line: r1
											});
										}

										if (((vOldSubBinLocText == taskactloc) || (vOldSubBinLocText == '')) && totalqty == vOldSubBinLocQty &&
											(tasklotno == vOldReceiptInventoryNumber) &&
											((vOldReceiptInventoryStatus == taskstatus) || (vOldReceiptInventoryStatus == ''))) {
											compSubRecord.removeLine('inventoryassignment', r1);
											break;

										}

									}
								} else if (itemType == "inventoryitem" || itemType == "assemblyitem") {

									var compSubRecord = transformRec.getSublistSubrecord({
										sublistId: 'item',
										fieldId: 'inventorydetail',
										line: itemIndex
									});
									if (utility.isValueValid(compSubRecord)) {

										var complinelength = compSubRecord.getLineCount({
											sublistId: 'inventoryassignment'
										});
										for (var r1 = 0; r1 < complinelength; r1++) {
											var vOldSubBinLocText = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'binnumber',
												line: r1
											});
											var vOldSubBinLocQty = compSubRecord.getSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: r1
											});
											var vOldSubBinInventoryStatus = '';
											if (inventoryStatusFeature == true) {
												vOldSubBinInventoryStatus = compSubRecord.getSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'inventorystatus',
													line: r1
												});
											}
											if (((vOldSubBinLocText == taskactloc) || (vOldSubBinLocText == '')) &&
												((vOldSubBinInventoryStatus == taskstatus) || (vOldSubBinInventoryStatus == '')) &&
												totalqty == vOldSubBinLocQty) {
												compSubRecord.removeLine({
													sublistId: 'inventoryassignment',
													line: r1
												});
												break;
											}
										}

									}
								} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
									var serialQty = totalqty;
									if (utility.isValueValid(serials)) {
										opentaskSerialArr = serials.split(',');
										serialQty = opentaskSerialArr.length;
									}

									var compSubRecord = transformRec.getSublistSubrecord({
										sublistId: 'item',
										fieldId: 'inventorydetail',
										line: itemIndex
									});
									do {
										var complinelength = compSubRecord.getLineCount({
											sublistId: 'inventoryassignment'
										});

										if (parseInt(complinelength) > 0) {

											for (var r1 = 0; r1 < complinelength; r1++) {
												var vOldSubBinLocText = compSubRecord.getSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'binnumber',
													line: r1
												});
												var serialNum = compSubRecord.getSublistValue({
													sublistId: 'inventoryassignment',
													fieldId: 'receiptinventorynumber',
													line: r1
												});
												var vOldSubBinInventoryStatus = '';
												if (inventoryStatusFeature == true) {
													vOldSubBinInventoryStatus = compSubRecord.getSublistValue({
														sublistId: 'inventoryassignment',
														fieldId: 'inventorystatus',
														line: r1
													});
												}
												if (((vOldSubBinLocText == taskactloc) || (vOldSubBinLocText == '')) && opentaskSerialArr.indexOf(serialNum) != -1 &&
													((vOldSubBinInventoryStatus == taskstatus) || (vOldSubBinInventoryStatus == ''))) {
													serialQty = Number(Big(serialQty).minus(1));
													compSubRecord.removeLine({
														sublistId: 'inventoryassignment',
														line: r1
													});
													break;
												}

											}


										}
									}
									while (serialQty > 0)
								}

							} else {
								log.debug("in else of newputqty", kitFlag);
								log.debug("kitItemLineNo", kitItemLineNo);
								log.debug("itemLineNo", itemLineNo);
								log.debug("kitLineNoArray.length", kitLineNoArray.length);
								log.debug("normalItemsArray.length", normalItemsArray.length);

								if (IRItemsLength == 1) // || (trantype=="returnauthorization" && kitFlag === true))
								{

									log.debug("if", "intoif");
									record.delete({
										id: nsrefno,
										type: 'itemreceipt'
									});
									returnID = nsrefno;
								} else if (kitFlag === true && trantype == "returnauthorization" && kitLineNoArray.length == 1 && normalItemsArray == 0) {
									log.debug("elseif", "intoelseif");
									record.delete({
										id: nsrefno,
										type: 'itemreceipt'
									});
									returnID = nsrefno;
								} else {
									log.debug("intoelse with itemIndex", itemIndex);
									transformRec.setSublistValue({
										sublistId: 'item',
										fieldId: 'itemreceive',
										line: itemIndex,
										value: false
									});
								}

							}
						} else {
							log.debug("IRItemsLength in else of totalqty", IRItemsLength);
							if (IRItemsLength == 1) {
								record.delete({
									id: nsrefno,
									type: 'itemreceipt'
								});
								returnID = nsrefno;

							} else {
								transformRec.setSublistValue({
									sublistId: 'item',
									fieldId: 'itemreceive',
									line: itemIndex,
									value: false
								});
							}
						}
					} else {
						if (IRItemsLength == 1) {
							record.delete({
								id: nsrefno,
								type: 'itemreceipt'
							});
							returnID = nsrefno;
						}
					}
					if (returnID == -1) {
						returnID = transformRec.save();
					}

				}

			}
			return returnID;
		}

		function updateSerialTask(itemId, lineno, ordintrid) {

			var serialEntrySrch = search.load({
				id: 'customsearch_wmsse_serialdetails_search'
			});

			serialEntrySrch.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_ser_status',
					operator: search.Operator.IS,
					values: false
				}));
			serialEntrySrch.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_ser_ordline',
					operator: search.Operator.EQUALTO,
					values: parseInt(lineno)
				}));
			serialEntrySrch.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_ser_ordno',
					operator: search.Operator.ANYOF,
					values: ordintrid
				}));
			serialEntrySrch.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_ser_item',
					operator: search.Operator.ANYOF,
					values: itemId
				}));

			var serialsrchResultsArr = utility.getSearchResultInJSON(serialEntrySrch);

			if (serialsrchResultsArr.length > 0) {
				for (var m = 0; m < serialsrchResultsArr.length; m++) {
					record.submitFields({
						type: 'customrecord_wmsse_serialentry',
						id: serialsrchResultsArr[m].id,
						values: {
							'custrecord_wmsse_ser_note1': "Updated by inbound reversal process",
							'custrecord_wmsse_ser_status': true
						}
					});

				}
			}

		}

		function updateOpenTaskRecord(taskid, taskactqty) {
			var taskremqty = 0;
			log.debug("taskid", taskid);
			log.debug("taskactqty", taskactqty);
			var currDate = utility.DateStamp();
			var parsedCurrentDate = format.parse({
				value: currDate,
				type: format.Type.DATE
			});
			record.submitFields({
				type: 'customrecord_wmsse_trn_opentask',
				id: taskid,
				values: {
					'custrecord_wmsse_notes': "Updated by inbound reversal process",
					'custrecord_wmsse_reversalqty': taskactqty,
					'custrecord_wmsse_act_qty': taskremqty,
					'custrecord_wmsse_wms_status_flag': '32',
					'custrecord_wmsse_act_end_date': parsedCurrentDate
				}
			});
		}

		function getOpentaskResultsForReversal(opentaskId) {
			var opentaskSearch = search.load({
				id: 'customsearch_wmsse_opentaskreversal'
			});
			opentaskSearch.filters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: opentaskId
			}));
			var resultArr = [];
			opentaskSearch.run().each(function (result) {
				resultArr.push(result);
				return true;

			});

			return resultArr;
		}

		function getItemReceiptId(ordid, vInboundShipment, itemid) {
			var receiptId = '';
			var ismReceiptDetailsSrch = search.load('customsearch_wms_ism_itemreceipt_details');

			var filters = ismReceiptDetailsSrch.filters;
			filters.push(search.createFilter({
				name: 'type',
				operator: search.Operator.ANYOF,
				values: 'ItemRcpt'
			}));
			filters.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemid
			}));
			filters.push(search.createFilter({
				name: 'createdfrom',
				operator: search.Operator.ANYOF,
				values: ordid
			}));
			filters.push(search.createFilter({
				name: 'mainline',
				operator: search.Operator.IS,
				values: false
			}));
			filters.push(search.createFilter({
				name: 'shipmentnumber',
				operator: search.Operator.ANYOF,
				values: vInboundShipment
			}));
			ismReceiptDetailsSrch.filters = filters;
			var ismReceiptDetailsArr = utility.getSearchResultInJSON(ismReceiptDetailsSrch);
			log.debug("ismReceiptDetailsArr", ismReceiptDetailsArr);
			if (ismReceiptDetailsArr.length > 0) {
				receiptId = ismReceiptDetailsArr[0].id;
			}
			return receiptId;

		}

		function getOrderLineNo(ordid, inboundShipment, itemId) {
			var ismSrch = search.load('customsearch_wms_ism_poline_for_reversal');

			var filters = ismSrch.filters;

			filters.push(search.createFilter({
				name: 'purchaseorder',
				operator: search.Operator.ANYOF,
				values: ordid
			}));

			filters.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemId
			}));

			filters.push(search.createFilter({
				name: 'shipmentnumber',
				operator: search.Operator.ANYOF,
				values: inboundShipment
			}));

			ismSrch.filters = filters;
			var ismReceiptDetailsArr = utility.getSearchResultInJSON(ismSrch);
			log.debug("ismReceiptDetailsArr", ismReceiptDetailsArr);
			var line = '';
			if (ismReceiptDetailsArr.length > 0) {
				line = ismReceiptDetailsArr[0].line;
			}
			return line;

		}

		return {
			consolidatePostItemReceipt: consolidatePostItemReceipt,
			consolidatePostItemReceiptforTO: consolidatePostItemReceiptforTO,
			getCartItemsPreferdBinDetails: _getCartItemsPreferdBinDetails,
			getCartItemsResultsFromInevntoryBalance: _getCartItemsResultsFromInevntoryBalance,
			getCartBinDetailsFromOpenTask: _getCartBinDetailsFromOpenTask,
			getCartBinDetails: _getCartBinDetails,
			validateCart: _validateCart,
			getItemYetToBePickedQty: _getItemYetToBePickedQty,
			getToQuantityCheck: getToQuantityCheck,
			isSerialAlreadyExistsInWMSSerialEntryCustomRecord: isSerialAlreadyExistsInWMSSerialEntryCustomRecord,
			getRecevingOrderDetails: _getRecevingOrderDetails,
			getlineItemsforReceiveAll: getlineItemsforReceiveAll,
			checkSerialAlreadyExistsInInventory: _checkSerialAlreadyExistsInInventory,
			postItemReceipt: postItemReceipt,
			updateItemReceiptDetailsForRMAKit: updateItemReceiptDetailsForRMAKit,
			getKitOTResultsforIRPosting: getKitOTResultsforIRPosting,
			getKitDetailsforRMA: getKitDetailsforRMA,
			matchKitComponentsQty: matchKitComponentsQty,
			updateorCloneOpenTask: updateorCloneOpenTask,
			getUseItemCostForTO: getUseItemCostForTO,
			getItemReceiptDetails: getItemReceiptDetails,
			updateItemReceipt: updateItemReceipt,
			updateSerialTask: updateSerialTask,
			updateOpenTaskRecord: updateOpenTaskRecord,
			getOpentaskResultsForReversal: getOpentaskResultsForReversal,
			getItemReceiptId: getItemReceiptId,
			getOrderLineNo: getOrderLineNo
		}
	});