/**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search', 'N/runtime', 'N/record', 'N/config', 'N/format', './big', './wms_translator', 'N/url', './wms_utility', 'N/task', 'N/query'],
	function (search, runtime, record, config, format, Big, translator, url, utility, task, query) {
		function getDefaultInventoryStatusList(invtStatus_ID, isSpecOrd) {

			var inventoryStatusSearchResults = '';
			var filters = [];
			var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
			if (inventoryStatusFeature) {

				var inventoryStatusResults = search.load({
					id: 'customsearch_wmsse_getinventorystatuslst'
				});
				filters = inventoryStatusResults.filters;
				if (utility.isValueValid(invtStatus_ID)) {
					filters.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: invtStatus_ID
					}));
				}
				//To include the filter only if it special order.
				if (utility.isValueValid(isSpecOrd) && isSpecOrd == 'SpecOrd') {
					filters.push(search.createFilter({
						name: 'inventoryavailable',
						operator: search.Operator.IS,
						values: true
					}));
				}
				inventoryStatusResults.filters = filters;
				inventoryStatusSearchResults = utility.getSearchResultInJSON(inventoryStatusResults);
			}

			return inventoryStatusSearchResults;
		}

		/**
		 * To get bin internal id
		 * @param Binnumber
		 * @param whLocation
		 * @returns {String}
		 */
		function getValidBinInternalId(Binnumber, whLocation, Item) {
			var bininternalId = '';
			var filter = [];
			if (Binnumber != null && Binnumber != '' && Binnumber != 'null' && Binnumber != 'undefined')
				filter.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.IS,
					values: Binnumber
				}));
			filter.push(search.createFilter({
				name: 'inactive',
				operator: search.Operator.IS,
				values: false
			}));
			if (whLocation != null && whLocation != '' && whLocation != 'null' && whLocation != 'undefined')
				filter.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			var columns = [];
			columns[0] = search.createColumn({
				name: 'custrecord_wmsse_bin_loc_type'
			});
			var searchrecord = search.create({
				type: 'Bin',
				filters: filter,
				column: columns
			}).run().getRange({
				start: 0,
				end: 1000
			});
			if (searchrecord != null && searchrecord != "") {
				var vLocationType = searchrecord[0].getText({
					name: 'custrecord_wmsse_bin_loc_type'
				});
				if (vLocationType != 'WIP')
					bininternalId = searchrecord[0].id;
			}
			filter = null;
			searchrecord = null;
			filtersku = null;
			searchitemrecord = null;
			return bininternalId;
		}

		//Function to get total qty against bin loaction
		function getBinwiseQtyDetails(binId, location) {
			var qtyArray = [];
			var filterStrat = [];
			if (location != null && location != '')
				filterStrat.push(search.createFilter({
					name: 'location',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: location
				}));
			if (binId != null && binId != '')
				filterStrat.push(search.createFilter({
					name: 'binnumber',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: binId
				}));

			var objInvDetailsSearch = search.load({
				id: 'customsearch_wmsse_binwise_inventory'
			});
			var savedFilter = objInvDetailsSearch.filters;
			objInvDetailsSearch.filters = savedFilter.concat(filterStrat);
			var objInvDetails = utility.getSearchResultInJSON(objInvDetailsSearch);
			if (objInvDetails != null && objInvDetails != '' && objInvDetails.length > 0) {
				for (var s = 0; s < objInvDetails.length; s++) {
					var qty = objInvDetails[s]['quantityonhand'];
					qtyArray.push(qty);
				}
			}
			return qtyArray;
		}

		function getAllOpentaskOpenPutwayOrderDetails(whLocation, transactionType, itemInternalId) {


			var opentaskArr = [];
			var filterStrat = [];
			filterStrat.push(search.createFilter({
				name: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
			if (utility.isValueValid(whLocation)) {
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			if (utility.isValueValid(itemInternalId)) {
				filterStrat.push(search.createFilter({
					name: 'item',
					join: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));

			}
			var savedSearch = "customsearch_wmsse_openputaway_orders";
			if (transactionType == 'transferorder') {
				savedSearch = "customsearch_wmsse_openputaway_orders_to";
			}

			var objOpentaskDetailsSearch = search.load({
				id: savedSearch
			});
			var savedFilter = objOpentaskDetailsSearch.filters;
			objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
			var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);

			var overageReceiveEnabled = false;
			if (transactionType != 'transferorder') {
				overageReceiveEnabled = _getPoOverage(transactionType); //this._getPoOverage(transactionType);
			}


			if (objOPentaskDetails != null && objOPentaskDetails.length > 0) {
				var orderInternalIdArray = new Array();

				for (var objOPentask in objOPentaskDetails) {
					var opentaskRec = objOPentaskDetails[objOPentask];
					var poId = opentaskRec['internalid'];
					var erpReceivedQuantity = 0;
					var transactionLineCount = opentaskRec['Transaction Line Count'];
					var opentaskQuantity = opentaskRec['OpenTask Quantity'];
					var orderQuantity = opentaskRec['quantityuom'];
					var erpReceivedQuantity = opentaskRec['totalReceivedQty'];

					if (transactionType == "returnauthorization") {
						if (parseInt(orderQuantity) < 0)
							orderQuantity = Big(orderQuantity).mul(-1);


					}

					if (!utility.isValueValid(erpReceivedQuantity)) {
						erpReceivedQuantity = 0;
					}
					if (!utility.isValueValid(opentaskQuantity)) {
						opentaskQuantity = 0;
					}

					if (transactionLineCount > 0) {
						//isLinesToReceive = Number(Big(orderQuantity).minus(Big(opentaskQuantity)));
						isLinesToReceive = Number(Big(orderQuantity).minus(Big(opentaskQuantity).plus(erpReceivedQuantity)));
					}

					if ((isLinesToReceive == 0) || ((isLinesToReceive <= 0) && (overageReceiveEnabled == true))) {
						if (opentaskArr.indexOf(poId) == -1) {
							opentaskArr.push(poId);
						}
					} else {
						if (orderInternalIdArray.indexOf(poId) == -1) {
							orderInternalIdArray.push(poId);
						}
					}

				}
				log.debug({
					title: 'opentaskArr before remove',
					details: opentaskArr
				});
				log.debug({
					title: 'orderInternalIdArray',
					details: orderInternalIdArray
				});
				if ((utility.isValueValid(opentaskArr)) && (utility.isValueValid(orderInternalIdArray))) {
					for (var intItr = 0; intItr < orderInternalIdArray.length; intItr++) {
						var orderId = orderInternalIdArray[intItr]
						if (opentaskArr.indexOf(orderId) != -1) {

							var arrIndex = opentaskArr.indexOf(orderId);
							if (arrIndex > -1)
								opentaskArr.splice(arrIndex, 1);
						}
					}
				}
			}
			log.debug({
				title: 'opentaskArr1',
				details: opentaskArr
			});
			return opentaskArr;
		}

		function _getPoOverage(transactionType) {
			var preferencesName = 'OVERRECEIPTS';
			var vPOoverageChecked = false;
			if (transactionType != 'transferorder') {
				vPOoverageChecked = utility.getWmsPreferencesValue(preferencesName);
			}
			return vPOoverageChecked;
		}

		function _getItemCostRuleValue() {
			var preferencesName = 'ITEMCOSTASTRNFRORDCOST';
			var itemCostRuleValue = utility.getWmsPreferencesValue(preferencesName);
			return itemCostRuleValue
		}

		function _getRecevingOrderItemDetails(orderNumber, itemID, wareHouseLocationId, orderLineNo, orderInternalId, colsArr, tranType, crossSubsidiaryFeature, centralizesPurchasingandBilling, warehouseLocationName) {

			var kitComponentsDetails = [];
			if (tranType == 'returnauthorization') {
				kitComponentsDetails = getKitComponentsforRMA(orderNumber, itemID);
			}

			if (tranType == 'returnauthorization' && (!utility.isValueValid(crossSubsidiaryFeature)))
				crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();

			var ISMStatusFeature = isISMFeatureEnabled();


			if (ISMStatusFeature) {

				var searchName = 'customsearch_wmsse_rcv_ismpoitem_details';
				var vType = 'PurchOrd';
			} else {
				var searchName = 'customsearch_wmsse_rcv_poitem_details';
				var vType = 'PurchOrd';
			}
			if (tranType == 'transferorder') {
				searchName = 'customsearch_wmsse_rcv_to_item_details';
				vType = 'TrnfrOrd';
			} else if (tranType == 'returnauthorization') {
				searchName = 'customsearch_wmsse_rcv_rma_item_details';
				vType = 'RtnAuth';
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
								filtersArr.push(
									search.createFilter({
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

				if (tranType == 'returnauthorization' && utility.isValueValid(itemID) && kitComponentsDetails.length > 0) {
					var kitmemberofarr = [];
					for (var k = 0; k < kitComponentsDetails.length; k++) {
						kitmemberofarr.push(kitComponentsDetails[k].kitmemberof);
					}
					filtersArr.push(
						search.createFilter({
							name: 'line',
							operator: search.Operator.ANYOF,
							values: kitmemberofarr
						}));
				} else if (utility.isValueValid(itemID)) {
					filtersArr.push(
						search.createFilter({
							name: 'item',
							operator: search.Operator.ANYOF,
							values: itemID
						}));
				}
				if (tranType == 'returnauthorization' && utility.isValueValid(orderLineNo) && kitComponentsDetails.length > 0) {
					var kitmemberofarr = [];
					for (var k = 0; k < kitComponentsDetails.length; k++) {
						kitmemberofarr.push(kitComponentsDetails[k].kitmemberof);
					}
					filtersArr.push(
						search.createFilter({
							name: 'line',
							operator: search.Operator.ANYOF,
							values: kitmemberofarr
						}));
				} else if (utility.isValueValid(orderLineNo)) {
					filtersArr.push(
						search.createFilter({
							name: 'line',
							operator: search.Operator.EQUALTO,
							values: orderLineNo
						}));
				}
				POLineDetails.filters = filtersArr;
				var POLineDetailsResult = utility.getSearchResultInJSON(POLineDetails);

				if (tranType == 'returnauthorization' && POLineDetailsResult.length > 0 && kitComponentsDetails.length > 0) {
					if (utility.isValueValid(itemID)) {
						var receivingItemResult = [];
						for (var componentsLength = 0; componentsLength < POLineDetailsResult.length; componentsLength++) {
							getItemNameForMatrix(kitComponentsDetails, 0);
							if (POLineDetailsResult[componentsLength].memberitem == kitComponentsDetails[0].itemname) {
								receivingItemResult.push(POLineDetailsResult[componentsLength]);
							}
						}
						POLineDetailsResult = mergeKitComponentsDetails(receivingItemResult, kitComponentsDetails);
						for (var p = 0; p < POLineDetailsResult.length; p++) {
							var uomResult = utility.getUOMDetails(POLineDetailsResult[p].unitstype);
							for (var itr in uomResult) {
								if (uomResult[itr]['uom.baseunit']) {
									POLineDetailsResult[p].unit = uomResult[itr]['uom.internalid'];
									break;
								}
							}
						}
					} else {
						POLineDetailsResult = mergeKitComponentsDetails(POLineDetailsResult, kitComponentsDetails);
					}
				}
				log.debug('POLineDetailsResult', POLineDetailsResult);

				return POLineDetailsResult;
			} else {
				return null;
			}
		}

		function _getItemSearchDetails(getItemInternalId, warehouseLocationId) {
			if (utility.isValueValid(getItemInternalId)) {
				var itemSearchDetails = search.load({
					id: 'customsearch_wmsse_itemdetails'
				});
				var filtersArr = itemSearchDetails.filters;
				filtersArr.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: getItemInternalId
					}));
				filtersArr.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));

				itemSearchDetails.filters = filtersArr;
				var itemSearchResult = utility.getSearchResultInJSON(itemSearchDetails);
				return itemSearchResult;
			} else {
				return null;
			}
		}

		//Function to get open putaway quantity
		function _getOpentaskOpenPutwayDetails(poId, whLocation, itemId, lineNo) {
			var opentaskArr = {};
			var filterStrat = [];
			if (utility.isValueValid(poId)) {
				if (utility.isValueValid(whLocation)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_wms_location',
						operator: search.Operator.ANYOF,
						values: whLocation
					}));
				}
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: poId
				}));
				if (utility.isValueValid(lineNo)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_line_no',
						operator: search.Operator.EQUALTO,
						values: lineNo
					}));
				}
				if (utility.isValueValid(itemId)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_sku',
						operator: search.Operator.ANYOF,
						values: itemId
					}));
				}
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_nsconfirm_ref_no',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));

				var objOpentaskDetailsSearch = search.load({
					id: 'customsearch_wmsse_openputawaydetails'
				});
				var savedFilter = objOpentaskDetailsSearch.filters;
				objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
				var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);
				if (objOPentaskDetails != null && objOPentaskDetails.length > 0) {
					for (var objOPentask in objOPentaskDetails) {
						var objOPentaskRec = objOPentaskDetails[objOPentask];
						opentaskArr[objOPentaskRec['custrecord_wmsse_line_no']] = objOPentaskRec['custrecord_wmsse_expe_qty'];
					}
				}
			}
			log.debug({
				title: 'opentaskArr',
				details: opentaskArr
			});
			return opentaskArr;
		}

		function _getOpentaskOpenPutwayDetailsPO(poId, whLocation, itemId, lineNo) {
			var opentaskArr = {};
			var filterStrat = [];
			if (utility.isValueValid(poId)) {
				if (utility.isValueValid(whLocation)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_wms_location',
						operator: search.Operator.ANYOF,
						values: whLocation
					}));
				}
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: poId
				}));
				if (utility.isValueValid(lineNo)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_line_no',
						operator: search.Operator.EQUALTO,
						values: lineNo
					}));
				}
				if (utility.isValueValid(itemId)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_sku',
						operator: search.Operator.ANYOF,
						values: itemId
					}));
				}
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_nsconfirm_ref_no',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));

				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_inbshipment',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));

				var objOpentaskDetailsSearch = search.load({
					id: 'customsearch_wmsse_openputawaydetails'
				});
				var savedFilter = objOpentaskDetailsSearch.filters;
				objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
				objOpentaskDetailsSearch.run().each(function (result) {
					if (utility.isValueValid(result)) {
						opentaskArr[result.getValue({
							name: 'custrecord_wmsse_line_no',
							summary: 'GROUP'
						})] = result.getValue({
							name: 'custrecord_wmsse_act_qty',
							summary: 'SUM'
						});
					}
					return true;
				});
			}
			log.debug({
				title: 'opentaskArr',
				details: opentaskArr
			});
			return opentaskArr;
		}

		function _getTOfulfilledLotDetails(orderInternalId, getItemInternalId, orderLineNo) {
			if (utility.isValueValid(orderInternalId)) {
				var toLotDetails = search.load({
					id: 'customsearch_wmsse_transf_ful_lot_detail'
				});
				var filtersArr = toLotDetails.filters;
				filtersArr.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: orderInternalId
					}));
				filtersArr.push(
					search.createFilter({
						name: 'item',
						operator: search.Operator.ANYOF,
						values: getItemInternalId
					}));
				if (utility.isValueValid(orderInternalId)) {
					filtersArr.push(
						search.createFilter({
							name: 'line',
							operator: search.Operator.EQUALTO,
							values: orderLineNo
						}));
				}

				toLotDetails.filters = filtersArr;
				var transferOrderLotDetails = utility.getSearchResultInJSON(toLotDetails);
				return transferOrderLotDetails;
			} else {
				return null;
			}

		}

		function _getInboundStageBinDetails(locationId, type) {
			var inboundStageBinResults = "";

			if (utility.isValueValid(locationId)) {

				var stageBinDetails = search.load({
					id: 'customsearch_stage_bindetails'
				});

				var stageBinFilters = stageBinDetails.filters;

				stageBinFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: locationId
				}));
				stageBinFilters.push(search.createFilter({
					name: 'custrecord_wmsse_bin_stg_direction',
					operator: search.Operator.ANYOF,
					values: '1'
				}));
				if (utility.isValueValid(type) && (type == 'putAway' || type == 'cartPutAway')) {
					stageBinFilters.push(search.createFilter({
						name: 'custrecord_wms_iscart',
						operator: search.Operator.IS,
						values: false
					}));
				}

				stageBinDetails.filters = stageBinFilters;
				inboundStageBinResults = utility.getSearchResultInJSON(stageBinDetails);
				log.debug({
					title: 'inboundStageBinResults',
					details: inboundStageBinResults
				});


			}
			return inboundStageBinResults;
		}

		function _getInventoryDetailsforItem(stageBins, locationId, itemInternalId) {

			var binsInventoryDetails = search.load({
				id: 'customsearch_wmsse_binwise_invt_item'
			});
			var binFiltersArr = binsInventoryDetails.filters;
			if (utility.isValueValid(stageBins)) {
				binFiltersArr.push(search.createFilter({
					name: 'binnumber',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: stageBins
				}));
			}
			if (utility.isValueValid(itemInternalId)) {
				binFiltersArr.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
			}
			if (utility.isValueValid(locationId)) {
				binFiltersArr.push(search.createFilter({
					name: 'location',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: locationId
				}));
			}

			binsInventoryDetails.filters = binFiltersArr;
			var inventoryDetailsFromBins = utility.getSearchResultInJSON(binsInventoryDetails);
			return inventoryDetailsFromBins;
		}

		function updateOpenTask(objOpentaskDetails) {
			var poInternalId = objOpentaskDetails['poInternalId'];
			var FetchedItemId = objOpentaskDetails['FetchedItemId'];
			var poLineno = objOpentaskDetails['poLineno'];
			var enterQty = objOpentaskDetails['enterQty'];
			var enterBin = objOpentaskDetails['enterBin'];
			var itemType = objOpentaskDetails['itemType'];
			var whLocation = objOpentaskDetails['whLocation'];
			var idl = objOpentaskDetails['itemReceiptId'];
			var poname = objOpentaskDetails['poname'];
			var PutStrategy = objOpentaskDetails['PutStrategy'];
			var zoneno = objOpentaskDetails['zoneno'];
			var taskType = objOpentaskDetails['taskType'];
			var trantype = objOpentaskDetails['trantype'];
			var actualBeginTime = objOpentaskDetails['actualBeginTime'];
			var customer = objOpentaskDetails['customer'];
			var systemRule = objOpentaskDetails['systemRule'];
			var beginLoc = objOpentaskDetails['beginLoc'];
			var uom = objOpentaskDetails['uom'];
			var conversionRate = objOpentaskDetails['conversionRate'];
			var ordQty = objOpentaskDetails['ordQty'];
			var ordType = objOpentaskDetails['ordType'];
			var department = objOpentaskDetails['department'];
			var vclass = objOpentaskDetails['vclass'];
			var vInvStatus_select = objOpentaskDetails['vInvStatus_select'];
			var strBarCode = objOpentaskDetails['strBarCode'];
			var shipmentReceiptId = objOpentaskDetails['shipmentReceiptId'];
			var shipmentId = objOpentaskDetails['shipmentId'];
			var expectedQty = objOpentaskDetails['expectedQty'];
			var lotNo = objOpentaskDetails['lotNo'];
			var binLocType = objOpentaskDetails['binLocType'];
			var binIsCart = objOpentaskDetails['binIsCart'];
			var randomTallyscan = objOpentaskDetails['randomTallyscan'];
			var recomendedBinSequenceNo = objOpentaskDetails['recomendedBinSequenceNo'];
			var declaredQty = objOpentaskDetails['declaredQty'];
			if (utility.isValueValid(objOpentaskDetails['trantype']) && objOpentaskDetails['trantype'] == 'returnauthorization' && utility.isValueValid(objOpentaskDetails['restock'])) {
				var restock = objOpentaskDetails['restock'];
			}
			log.debug({
				title: 'objOpentaskDetails',
				details: objOpentaskDetails
			});
			log.debug({
				title: 'expectedQty',
				details: expectedQty
			});
			var openTaskRecord = record.create({
				type: 'customrecord_wmsse_trn_opentask'

			});
			if (utility.isValueValid(restock) && restock == false) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_restock',
					value: false
				});
			} else if (utility.isValueValid(restock) && restock == true) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_restock',
					value: true
				});
			}
			if (utility.isValueValid(poname)) {
				openTaskRecord.setValue({
					fieldId: 'name',
					value: poname
				});
			}
			var currDate = utility.DateStamp();
			var parsedCurrentDate = format.parse({
				value: currDate,
				type: format.Type.DATE
			});
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_act_begin_date',
				value: parsedCurrentDate
			});
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_act_end_date',
				value: parsedCurrentDate
			});
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_act_qty',
				value: Number(Big(enterQty).toFixed(5))
			});
			if (utility.isValueValid(uom)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_uom',
					value: uom
				});
			}
			if (utility.isValueValid(conversionRate)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_conversionrate',
					value: conversionRate
				});
			}

			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_sku',
				value: FetchedItemId
			});
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_line_no',
				value: poLineno
			});
			if (utility.isValueValid(shipmentReceiptId)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_expe_qty',
					value: Number(Big(expectedQty).toFixed(5))
				});
			} else {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_expe_qty',
					value: Number(Big(enterQty).toFixed(5))
				});
			}
			if (declaredQty) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_declaredqty',
					value: declaredQty
				});
			}

			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				value: 3
			}); //putaway completed
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_tasktype',
				value: 2
			}); //For PUTW
			if (utility.isValueValid(strBarCode)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_compositebarcode_string',
					value: strBarCode
				});
			}

			if (utility.isValueValid(enterBin)) {
				if (utility.isValueValid(randomTallyscan) && randomTallyscan == 'T') {
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_reccommendedbin',
						value: enterBin
					});

					if (utility.isValueValid(recomendedBinSequenceNo)) {
						openTaskRecord.setValue({
							fieldId: 'custrecord_wmsse_recomendedbinsequence',
							value: recomendedBinSequenceNo
						});
					}
				} else {
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_actbeginloc',
						value: enterBin
					});
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_actendloc',
						value: enterBin
					});
				}
			}
			if (utility.isValueValid(randomTallyscan) && randomTallyscan == 'T') {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_notes',
					value: 'randomTallyscan'
				});
			}
			if (utility.isValueValid(beginLoc)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_actbeginloc',
					value: beginLoc
				});
			}
			if (itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
				itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {

				var batchno = objOpentaskDetails['batchno'];
				var expiryDate = objOpentaskDetails['expiryDate'];
				var fifoDate = objOpentaskDetails['fifoDate'];
				if (batchno == null || batchno == '') {
					batchno = lotNo;
				}

				if (utility.isValueValid(batchno)) {
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_batch_num',
						value: batchno
					});
				}
				if (utility.isValueValid(expiryDate)) {
					var parsedExpiryDate = format.parse({
						value: expiryDate,
						type: format.Type.DATE
					});
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_expirydate',
						value: parsedExpiryDate
					});
				} else {
					var lotInternalId = '';
					if (utility.isValueValid(batchno)) {
						lotInternalId = utility.getLotInternalId(batchno);
					}
					if (utility.isValueValid(lotInternalId)) {
						var lotLookUp = search.lookupFields({
							type: search.Type.INVENTORY_NUMBER,
							id: lotInternalId,
							columns: ['inventorynumber', 'expirationdate']
						});
						var vexpiryDate = lotLookUp.expirationdate;
						var parsedExpiryDate = null;
						if (utility.isValueValid(vexpiryDate)) {
							parsedExpiryDate = format.parse({
								value: vexpiryDate,
								type: format.Type.DATE
							});
						}
						if (utility.isValueValid(parsedExpiryDate)) {
							openTaskRecord.setValue({
								fieldId: 'custrecord_wmsse_expirydate',
								value: parsedExpiryDate
							});
						}
					}
				}
				if (utility.isValueValid(fifoDate)) {
					var parsedFifoDate = format.parse({
						value: fifoDate,
						type: format.Type.DATE
					});
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_fifodate',
						value: parsedFifoDate
					});
				}

			}
			if ((itemType == translator.getTranslationString("ITEMTYPE_SERIAL") ||
					itemType == translator.getTranslationString("ITEMTYPE_SERIAL_ASSEMBLY")) && randomTallyscan != 'T') {

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

				if (systemRule != undefined && systemRule != null && systemRule != '' && systemRule == 'Y') {
					serailFilters.push(search.createFilter({
						name: 'custrecord_wms_opentaskno',
						operator: search.Operator.ISEMPTY
					}));
				}

				serialSearch.filters = serailFilters;
				var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
				if (serialSearchResults != null && serialSearchResults != "" && serialSearchResults != 'null' && serialSearchResults.length > 0) {
					var serialArray = '';
					for (var n = 0; n < serialSearchResults.length; n++) {
						if (serialArray == null || serialArray == '')
							serialArray = serialSearchResults[n]['custrecord_wmsse_ser_no'];
						else
							serialArray = serialArray + "," + serialSearchResults[n]['custrecord_wmsse_ser_no'];
					}
					openTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_serial_no',
						value: serialArray
					});
					if (systemRule == null || systemRule == '' || systemRule == 'N') {
						for (var j = 0; j < serialSearchResults.length; j++) {
							var TempRecord = serialSearchResults[j];
							var serialRec = record.load({
								type: 'customrecord_wmsse_serialentry',
								id: serialSearchResults[j].id,
								isDynamic: true
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
								value: 'because of serial number is updated in opentask we have marked this serial number as closed'
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
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_order_no',
				value: poInternalId
			});
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_wms_location',
				value: whLocation
			});
			if (utility.isValueValid(PutStrategy)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_put_strategy',
					value: PutStrategy
				});
			}

			if (utility.isValueValid(zoneno)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_zone_no',
					value: zoneno
				});
			}

			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_parent_sku_no',
				value: utility.isValueValid(objOpentaskDetails.parentItem) ? objOpentaskDetails.parentItem : FetchedItemId
			});
			if (utility.isValueValid(idl)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
					value: idl
				});
			}


			if (utility.isValueValid(objOpentaskDetails['userId'])) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_upd_user_no',
					value: objOpentaskDetails['userId']
				});
			} else {
				var currentUserID = runtime.getCurrentUser();
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_upd_user_no',
					value: currentUserID.id
				});
			}


			if (utility.isValueValid(actualBeginTime)) {
				var parsedBeginTime = utility.parseTimeString(actualBeginTime);
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_actualbegintime',
					value: parsedBeginTime
				});
			}
			var timeStamp = utility.getCurrentTimeStamp();
			if (utility.isValueValid(timeStamp)) {
				var timeString = utility.parseTimeString(timeStamp);
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_actualendtime',
					value: timeString
				});
			}
			if (utility.isValueValid(customer)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_customer',
					value: customer
				});
			}

			if (utility.isValueValid(ordType)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_ord_type',
					value: ordType
				});
			}
			if (utility.isValueValid(department)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_dept',
					value: department
				});
			}
			if (utility.isValueValid(vclass)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_classification',
					value: vclass
				});
			}

			if (utility.isValueValid(vInvStatus_select)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_inventorystatus',
					value: vInvStatus_select
				});
			}
			if (utility.isValueValid(shipmentReceiptId)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_rec_inb_shipment',
					value: shipmentReceiptId
				});
			}
			if (utility.isValueValid(shipmentId)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_inbshipment',
					value: shipmentId
				});
			}

			if (utility.isValueValid(binIsCart) && utility.isValueValid(binLocType) && binIsCart == true && binLocType == 'Stage') {
				var itemInputObj = {};
				itemInputObj.itemId = FetchedItemId;
				itemInputObj.whLocation = whLocation;
				itemInputObj.itemType = itemType;
				itemInputObj.lotName = lotNo;
				itemInputObj.fromBinInternalId = enterBin;
				itemInputObj.fromStatusId = vInvStatus_select;

				var objRecommendedBinData = getRecommendedBinForCartMoves(itemInputObj);

				if (utility.isValueValid(objRecommendedBinData)) {

					if (utility.isValueValid(vInvStatus_select)) {
						openTaskRecord.setValue({
							fieldId: 'custrecord_wmsse_inventorystatusto',
							value: vInvStatus_select
						});
					}

					if (utility.isValueValid(objRecommendedBinData.recomendedBinId)) {
						openTaskRecord.setValue({
							fieldId: 'custrecord_wmsse_reccommendedbin',
							value: objRecommendedBinData.recomendedBinId
						});
					}
					if (utility.isValueValid(objRecommendedBinData.recomendedBinSequenceNo)) {
						openTaskRecord.setValue({
							fieldId: 'custrecord_wmsse_recomendedbinsequence',
							value: objRecommendedBinData.recomendedBinSequenceNo
						});
					}
					if (utility.isValueValid(objRecommendedBinData.puStratagieId)) {
						openTaskRecord.setValue({
							fieldId: 'custrecord_wmsse_put_strategy',
							value: objRecommendedBinData.puStratagieId
						});
					}
				}
			}
			if (utility.isValueValid(objOpentaskDetails.isKitComponent)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_kitflag',
					value: objOpentaskDetails.isKitComponent
				});
			}

			var recid = openTaskRecord.save();
			openTaskRecord = null;
			if (recid != null && recid != '') {
				var lockSearch = search.create({
					type: 'customrecord_wmsse_lockrecs',
					filters: [{
							name: 'custrecord_wmsse_trantype',
							operator: 'IS',
							values: trantype
						},
						{
							name: 'custrecord_wmsse_order',
							operator: 'ANYOF',
							values: poInternalId
						},
						{
							name: 'custrecord_wmsse_line',
							operator: 'EQUALTO',
							values: poLineno
						},
						{
							name: 'custrecord_wmsse_lockflag',
							operator: 'IS',
							values: true
						}
					],
					columns: [{
						name: 'custrecord_wmsse_user'
					}]
				});

				var lockSearchResults = lockSearch.run().getRange({
					start: 0,
					end: 1000
				});

				if (lockSearchResults != null && lockSearchResults != '' && lockSearchResults != 'null' && lockSearchResults != undefined &&
					lockSearchResults != 'undefined' && lockSearchResults.length > 0) {
					for (var lockItr = 0; lockItr < lockSearchResults.length; lockItr++) {
						var lockRecordId = lockSearchResults[lockItr].id;
						var lockDeleteRecordId = record.delete({
							type: 'customrecord_wmsse_lockrecs',
							id: lockRecordId
						});
					}
					LockDeleteRecordId = null;
				}
				lockresults = null;
				lockcolumns = null;
				lockfilters = null;
				var locBinFilters = [];
				locBinFilters.push(search.createFilter({
					name: 'custrecord_wmse_lock_sku',
					operator: search.Operator.ANYOF,
					values: FetchedItemId
				}));
				if (enterBin != null && enterBin != '' && enterBin != 'null' && enterBin != 'undefined') {
					locBinFilters.push(search.createFilter({
						name: 'custrecord_wmsse_lock_binlocation',
						operator: search.Operator.ANYOF,
						values: enterBin
					}));
				}
				locBinFilters.push(search.createFilter({
					name: 'custrecord_wmsse_lock_flag',
					operator: search.Operator.IS,
					values: true
				}));

				if (utility.isValueValid(objOpentaskDetails['userId'])) {
					locBinFilters.push(search.createFilter({
						name: 'custrecord_wmsse_lockuser',
						operator: search.Operator.ANYOF,
						values: objOpentaskDetails['userId']
					}));
				} else {
					locBinFilters.push(search.createFilter({
						name: 'custrecord_wmsse_lockuser',
						operator: search.Operator.ANYOF,
						values: currentUserID.id
					}));
				}
				var lockBinSearch = search.create({
					type: 'customrecord_wmsse_lockbin',
					filters: locBinFilters,
					columns: [{
						name: 'custrecord_wmsse_lockuser'
					}]
				});
				var lockBinSearchResults = lockBinSearch.run().getRange({
					start: 0,
					end: 1000
				});
				if (lockBinSearchResults != null && lockBinSearchResults != 'null' && lockBinSearchResults != '' &&
					lockBinSearchResults != 'undefined') {
					var lockBinRecordId = lockBinSearchResults[0].id;
					var lockDeleteRecordId = record.delete({
						type: 'customrecord_wmsse_lockbin',
						id: lockBinRecordId
					});
				}
			}
			currentUserID = null;
			return recid;
		}

		function _getOrderStatus(orderInternalId, getTranId, tranType, warehouseLocationName, centralizesPurchasingandBilling) {
			log.debug({
				title: '_getOrderStatus',
				details: '_getOrderStatus'
			});
			var vType = 'PurchOrd';
			if (tranType == 'transferorder') {
				vType = 'TrnfrOrd';
			} else if (tranType == 'returnauthorization') {
				vType = 'RtnAuth';
			}
			var orderDetails = search.load({
				id: 'customsearch_wmsse_transactionid_details'
			});
			var objFiltersArr = orderDetails.filters;
			if (utility.isValueValid(orderInternalId)) {
				objFiltersArr.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.IS,
					values: orderInternalId
				}));
			}
			objFiltersArr.push(search.createFilter({
				name: 'type',
				operator: search.Operator.ANYOF,
				values: vType
			}));
			objFiltersArr.push(search.createFilter({
				name: 'tranid',
				operator: search.Operator.IS,
				values: getTranId
			}));
			if (centralizesPurchasingandBilling == true) {
				objFiltersArr.push(search.createFilter({
					name: 'mainline',
					operator: search.Operator.IS,
					values: false
				}))
				if (utility.isValueValid(warehouseLocationName)) {
					objFiltersArr.push(search.createFilter({
						name: 'formulatext',
						operator: search.Operator.IS,
						formula: "CASE WHEN {targetlocation} IS NULL THEN {location} ELSE{targetlocation} END",
						values: warehouseLocationName
					}));
				}
			} else {
				objFiltersArr.push(search.createFilter({
					name: 'mainline',
					operator: search.Operator.IS,
					values: true
				}));
			}
			orderDetails.filters = objFiltersArr;
			var orderSearchResults = utility.getSearchResultInJSON(orderDetails);
			log.debug({
				title: 'orderSearchResults',
				details: orderSearchResults
			});
			return orderSearchResults;
		}

		function _getOpenPutawayTasksforIRPosting(transactionInternalId, warehouseLocationId) {
			var openPutwTasksDetails = search.load({
				id: 'customsearch_wmsse_openputaways_details'
			});
			var openTaskSearchFilters = openPutwTasksDetails.filters;
			if (utility.isValueValid(transactionInternalId)) {
				openTaskSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: transactionInternalId
				}));
			}
			if (utility.isValueValid(warehouseLocationId)) {
				openTaskSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}

			openPutwTasksDetails.filters = openTaskSearchFilters;
			var objOpenPutwTaskDetails = utility.getSearchResultInJSON(openPutwTasksDetails);
			return objOpenPutwTaskDetails;
		}

		function getOTResultsforIRPosting(poid, containerID, item_id, itemLineNo, warehouseLocationId, randomTallyscan) {
			var otResultsforopenputawayarr = [];
			var postItemReceiptSearchObj = search.load({
				id: 'customsearch_wmsse_postitemreceipt_srch'
			});
			var postItemReceiptSearchFilters = postItemReceiptSearchObj.filters;

			if (utility.isValueValid(poid)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: poid
				}));
			}
			if (utility.isValueValid(randomTallyscan) && randomTallyscan == 'T') {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_actbeginloc',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}


			if (utility.isValueValid(item_id)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_sku',
					operator: search.Operator.ANYOF,
					values: item_id
				}));
			}
			if (utility.isValueValid(itemLineNo)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_line_no',
					operator: search.Operator.EQUALTO,
					values: itemLineNo
				}));
			}

			if (utility.isValueValid(warehouseLocationId)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}

			postItemReceiptSearchFilters.push(search.createFilter({
				name: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
			postItemReceiptSearchObj.filters = postItemReceiptSearchFilters;
			var objPostItemReceiptDetails = utility.getSearchResultInJSON(postItemReceiptSearchObj);

			return objPostItemReceiptDetails;
		}

		function _getTransferOrderItemReceiptDetails(orderInternalId, orderLineNo) {
			var toLineDetailsSearch = search.load({
				id: 'customsearch_wmsse_transf_ful_lot_detail'
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
					values: 'RECEIVING'
				}));

			}
			if (utility.isValueValid(orderLineNo)) {
				toLineDetailsFilters.push(search.createFilter({
					name: 'line',
					operator: search.Operator.EQUALTO,
					values: (parseFloat(orderLineNo) + 1)
				}));
			}

			toLineDetailsSearch.filters = toLineDetailsFilters;
			var transferOrderReceiptDetails = utility.getSearchResultInJSON(toLineDetailsSearch);
			log.debug({
				title: 'transferOrderReceiptDetails',
				details: transferOrderReceiptDetails
			});

			return transferOrderReceiptDetails;
		}

		function _getTransferOrderOpenTaskDetails(getItemInternalId, getOrderInternalId, getOrderLineNo, whLocation, fromStatusInternalId, lot, inventoryStatusFeature) {
			var searchObj = search.load({
				id: 'customsearch_wmsse_opentaskreceivingdata'
			});

			if (utility.isValueValid(getItemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_wmsse_sku',
					operator: search.Operator.ANYOF,
					values: getItemInternalId
				}));
			}
			if (utility.isValueValid(getOrderInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: getOrderInternalId
				}));
			}
			if (utility.isValueValid(getOrderLineNo)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_wmsse_line_no',
					operator: search.Operator.EQUALTO,
					values: getOrderLineNo
				}));
			}
			if (utility.isValueValid(whLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			searchObj.filters.push(search.createFilter({
				name: 'custrecord_wmsse_tasktype',
				operator: search.Operator.ANYOF,
				values: ['2']
			}));
			if (utility.isValueValid(lot)) {
				searchObj.filters.push(search.createFilter({
					name: 'custrecord_wmsse_batch_num',
					operator: search.Operator.IS,
					values: lot
				}));
			}
			searchObj.filters.push(search.createFilter({
				name: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
			if (inventoryStatusFeature) {
				if (utility.isValueValid(fromStatusInternalId)) {
					searchObj.filters.push(search.createFilter({
						name: 'custrecord_wmsse_inventorystatus',
						operator: search.Operator.ANYOF,
						values: fromStatusInternalId
					}));
				}
			}

			var results = utility.getSearchResultInJSON(searchObj);

			log.debug({
				title: 'results',
				details: results
			});

			return results;
		}

		function getItemList(itemText) {

			var isWebstoreFeature = utility.isWebstoreFeatureEnabled();
			var itemcolumns = null;
			var filters = null;
			var itemSearch = search.load({
				id: 'customsearch_wmsse_inv_basic_itemdetails'
			});
			filters = itemSearch.filters;
			itemcolumns = itemSearch.columns;
			filters.push(search.createFilter({
				name: 'nameinternal',
				operator: search.Operator.IS,
				values: itemText
			}));
			itemcolumns.push(search.createColumn({
				name: 'isinactive'
			}));
			if (isWebstoreFeature) {
				itemcolumns.push(search.createColumn({
					name: 'thumbnailurl'
				}));
				itemcolumns.push(search.createColumn({
					name: 'storedisplaythumbnail'
				}));
			}
			itemcolumns.push(search.createColumn({
				name: 'unitstype'
			}));
			itemSearch.columns = itemcolumns;
			var itemDetails = utility.getSearchResultInJSON(itemSearch);

			if (itemDetails.length > 0 && utility.isValueValid(itemDetails[0].storedisplaythumbnailText)) {
				var domainURL = url.resolveDomain({
					hostType: url.HostType.APPLICATION,
					accountId: runtime.accountId
				});
				itemDetails[0].thumbnailurl = 'https://' + domainURL + itemDetails[0].storedisplaythumbnailText;
			}

			return itemDetails;
		}

		function getBackOrderQty(warehouseLocationId, itemInternalId) {
			var backOrdQtySearch = search.load({
				id: 'customsearch_wms_backord_qty_dtls'
			});
			var backOrdQtySearchFilters = backOrdQtySearch.filters;
			var backordqty = '';

			backOrdQtySearchFilters.push(search.createFilter({
				name: 'inventorylocation',
				operator: search.Operator.ANYOF,
				values: ['@NONE@', warehouseLocationId]
			}));
			backOrdQtySearchFilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
			backOrdQtySearch.filters = backOrdQtySearchFilters;

			var backOrdQtySrchRes = utility.getSearchResultInJSON(backOrdQtySearch);

			if (utility.isValueValid(backOrdQtySrchRes)) {
				log.debug('Back Order Qty Search Results:', backOrdQtySrchRes);

				if (utility.isValueValid(backOrdQtySrchRes[0]['locationquantitybackordered'])) {
					backordqty = backOrdQtySrchRes[0]['locationquantitybackordered'];
				}
				if (!utility.isValueValid(backordqty)) {
					backordqty = 0;
				}
			} else {
				backordqty = 0;
			}
			return backordqty;
		}

		function getopentaskresultsforIRPosting(poid, containerID, item_id, itemLineNo) {
			var postItemReceiptSearchObj = search.load({
				id: 'customsearch_wmsse_postitemreceipt_srch'
			});
			var postItemReceiptSearchFilters = postItemReceiptSearchObj.filters;

			if (utility.isValueValid(poid)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: poid
				}));
			}

			if (utility.isValueValid(containerID)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_inboundcontainer',
					operator: search.Operator.ANYOF,
					values: containerID
				}));
			}
			if (utility.isValueValid(item_id)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_sku',
					operator: search.Operator.ANYOF,
					values: item_id
				}));
			}
			if (utility.isValueValid(itemLineNo)) {
				postItemReceiptSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_line_no',
					operator: search.Operator.EQUALTO,
					values: itemLineNo
				}));
			}
			postItemReceiptSearchFilters.push(search.createFilter({
				name: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
			postItemReceiptSearchObj.filters = postItemReceiptSearchFilters;
			var objPostItemReceiptDetails = utility.getSearchResultInJSON(postItemReceiptSearchObj);

			if (objPostItemReceiptDetails.length > 0) {
				for (var objOPentask in objPostItemReceiptDetails) {

					var actQuantity = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_act_qty'];
					var linenum = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_line_no'];
					var itemid = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_sku'];
					var batchno = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_batch_num'];
					var expiryDate = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_expirydate'];
					var enterBin = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_actendloc'];
					var serial = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_serial_no'];
					var wmsLocation = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_act_wms_location'];
					var vInvStatus_select = objPostItemReceiptDetails[objOPentask]['custrecord_wmsse_inventorystatus'];

					var opentaskId = objPostItemReceiptDetails[objOPentask]['internalid'];
					var serailNum = '';
					if (utility.isValueValid(serial)) {
						var serialArray = [];
						serailArray = serial.split(',');
						if (serialArray.length > 1) {
							for (var s = 0; s < serialArray.length; s++) {
								if (s == 0) {
									serailNum = serialArray[s];
								} else {
									serailNum = serailNum + "^" + serialArray[s];
								}
							}
						} else {
							serailNum = serial;
						}
					}
					var currRow = [linenum, itemid, actQuantity, enterBin, batchno, expiryDate, serailNum, opentaskId, wmsLocation, vInvStatus_select];
					objPostItemReceiptDetails.push(currRow);
				}

			}

			return objPostItemReceiptDetails;
		}

		function noCodeSolForReceiving(orderInternalId, orderLineNo, itemReceipt, transactionType, openTaskIdarray, locationUseBinlFlag, itemType) {
			var itemreceiptArr = [];
			var openTaskArr = [];
			var purchaseorderArr = [];
			var transferorderArr = [];
			var impactedRecords = {};
			var orderObj = {};
			var SubListObj = {};
			var itemArr = [];
			var rmaArr = [];
			var salesOrderArr = [];

			if (utility.isValueValid(itemReceipt['itemreceiptid'])) {
				itemreceiptArr.push(itemReceipt['itemreceiptid']);
			} else {
				itemreceiptArr.push();
			}

			if (utility.isValueValid(itemReceipt['openTaskId'])) {
				openTaskArr.push(itemReceipt['openTaskId']);
			} else {
				openTaskArr.push();
			}


			if (utility.isValueValid(transactionType) && transactionType == 'purchaseorder') {
				purchaseorderArr.push(parseInt(orderInternalId));
				impactedRecords['purchaseorder'] = purchaseorderArr;
			}

			if (utility.isValueValid(transactionType) && transactionType == 'transferorder') {
				transferorderArr.push(parseInt(orderInternalId));
				impactedRecords['transferorder'] = transferorderArr;
			}
			if (utility.isValueValid(transactionType) && transactionType == 'returnauthorization') {
				rmaArr.push(parseInt(orderInternalId));
				impactedRecords['returnauthorization'] = rmaArr;
				var fieldLookUp = search.lookupFields({
					type: search.Type.RETURN_AUTHORIZATION,
					id: orderInternalId,
					columns: ['createdfrom']
				});
				if (utility.isValueValid(fieldLookUp.createdfrom[0])) {
					salesOrderArr.push(parseInt(fieldLookUp.createdfrom[0].value));
					impactedRecords['salesorder'] = salesOrderArr;
				}
			}
			if (utility.isValueValid(openTaskIdarray)) {
				openTaskArr = openTaskIdarray;
			}

			impactedRecords['itemreceipt'] = itemreceiptArr;
			impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskArr;
			impactedRecords['customrecord_wmsse_labelprinting'] = itemReceipt['labelrec'];
			impactedRecords['customrecord_wmsse_ext_labelprinting'] = itemReceipt['extlabelrec'];

			if (locationUseBinlFlag == false) {
				impactedRecords['_ignoreUpdate'] = false;
			} else {
				if (utility.isValueValid(itemType) && (itemType == "noninventoryitem" || itemType == "otherchargeitem" ||
						itemType == "serviceitem" || itemType == "downloaditem" || itemType == "giftcertificateitem")) {
					impactedRecords['_ignoreUpdate'] = false;
				} else {
					impactedRecords['_ignoreUpdate'] = true;
				}
			}
			return impactedRecords;
		}

		function deletebarcodestring(barcodeString) {
			var filters = [];

			var barcodeStringSearch = search.load({
				id: 'customsearch_wmsse_barcode_string'
			});
			var barcodeStringFilters = barcodeStringSearch.filters;
			barcodeStringFilters.push(
				search.createFilter({
					name: 'custrecord_wmsse_barcode_string',
					operator: search.Operator.IS,
					values: barcodeString
				}));
			barcodeStringSearch.filters = barcodeStringFilters;

			var searchResults = utility.getSearchResultInJSON(barcodeStringSearch);
			log.debug({
				title: 'searchResults',
				details: searchResults
			});
			if (searchResults.length > 0) {
				var barcodestringid = searchResults[0].id;

				var id = record.delete({
					type: 'customrecord_wmsse_barcode_strings',
					id: barcodestringid
				});
			}
		}

		function checkCountforRemaining(shipmentListDetails, shipmentNum, whLocation) {
			var vCount = 0;

			if (utility.isValueValid(shipmentListDetails) && shipmentListDetails.length > 0) {
				var shipmentLineReceivedQty = 0;
				var shipmentLineRemainingQty = 0;
				var shipmentLineExpQuantity = 0;
				var tempTotalRecQty = 0;
				var openPutAwayDetails = getInbShipmentOpenTaskDetails(shipmentListDetails[0].id, shipmentNum, whLocation);
				var receivedOpentaskDetails = getInbShipmentReceivedOpenTaskDetails(shipmentListDetails[0].id, whLocation);
				log.debug({
					title: 'openPutAwayDetails',
					details: openPutAwayDetails
				});
				log.debug({
					title: 'receivedOpentaskDetails',
					details: receivedOpentaskDetails
				});
				for (var i in shipmentListDetails) {
					var shipmentObj = shipmentListDetails[i];
					log.debug('shipment Obj :', shipmentObj);

					var shipmentId = shipmentObj['id'];
					if (utility.isValueValid(shipmentObj['quantityexpected'])) {
						shipmentLineExpQuantity = parseFloat(shipmentObj['quantityexpected']);

					}
					shipmentObj['quantityexpected'] = shipmentLineExpQuantity;
					shipmentObj['quantityreceived'] = 0;
					if (JSON.stringify(receivedOpentaskDetails) != '{}') {
						var lineItemReceivedOpentaskQty = receivedOpentaskDetails[shipmentObj['inboundshipmentitemid']];
						log.debug({
							title: 'lineItemReceivedOpentaskQty :',
							details: lineItemReceivedOpentaskQty
						});

						if (utility.isValueValid(lineItemReceivedOpentaskQty)) {
							shipmentLineReceivedQty = lineItemReceivedOpentaskQty;
							shipmentObj['quantityreceived'] = shipmentLineReceivedQty;
							shipmentObj['quantityremaining'] = Number(Big(parseFloat(shipmentLineExpQuantity)).minus(shipmentLineReceivedQty));
						}

					}
					if (!utility.isValueValid(shipmentObj['quantityremaining'])) {
						shipmentLineRemainingQty = 0;
					} else {
						shipmentLineRemainingQty = parseFloat(shipmentObj['quantityremaining']);
					}
					shipmentObj['quantityremaining'] = shipmentLineRemainingQty;
					log.debug('shipmentLineReceivedQty :', shipmentLineReceivedQty);
					log.debug('shipmentLineRemainingQty :', shipmentLineRemainingQty);
					log.debug('shipmentLineExpQuantity :', shipmentLineExpQuantity);

					if (JSON.stringify(openPutAwayDetails) !== '{}') {
						var lineItemOpentaskRcvQty = openPutAwayDetails[shipmentObj['inboundshipmentitemid']];
						log.debug('open task quantity :', lineItemOpentaskRcvQty);

						if (utility.isValueValid(lineItemOpentaskRcvQty)) {
							tempTotalRecQty = Number(Big(parseFloat(shipmentLineReceivedQty)).plus(lineItemOpentaskRcvQty));
							shipmentObj['totalReceivedQty'] = tempTotalRecQty;
							shipmentObj['quantityremaining'] = Number(Big(parseFloat(shipmentLineExpQuantity)).minus(tempTotalRecQty));
						}
					}
					var orderRemainQty = 0;
					orderRemainQty = shipmentObj['quantityremaining'];
					log.debug('orderRemainQty  :', orderRemainQty);

					if (parseFloat(orderRemainQty) > 0) {
						vCount = parseInt(vCount) + 1;
						if (parseInt(vCount) > 1) {
							break;
						}
					}
				}
			}
			log.debug({
				title: 'vCount :',
				details: vCount
			});
			return vCount;

		}

		function getInbShipmentReceivedOpenTaskDetails(shipmentId, whLocation, shipmentLineNo) {

			log.debug({
				title: 'getInbShipmentReceivedOpenTaskDetails shipmentId',
				details: shipmentId
			});
			log.debug({
				title: 'getInbShipmentReceivedOpenTaskDetails whLocation',
				details: whLocation
			});
			var opentaskArr = {};
			var filterStrat = [];
			if (utility.isValueValid(shipmentId)) {
				if (utility.isValueValid(whLocation)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_wms_location',
						operator: search.Operator.ANYOF,
						values: whLocation
					}));
				}
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_inbshipment',
					operator: search.Operator.ANYOF,
					values: shipmentId
				}));
				if (utility.isValueValid(shipmentLineNo)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_line_no',
						operator: search.Operator.ANYOF,
						values: shipmentLineNo
					}));
				}

				var objOpentaskDetailsSearch = search.load({
					id: 'customsearch_wms_inbship_rcvdopentaskdtl'
				});
				var savedFilter = objOpentaskDetailsSearch.filters;
				objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
				var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);

				log.debug({
					title: 'getInbShipmentReceivedOpenTaskDetails objOPentaskDetails :',
					details: objOPentaskDetails
				});

				if (objOPentaskDetails.length > 0) {
					for (var objOPentask in objOPentaskDetails) {
						var objOPentaskRec = objOPentaskDetails[objOPentask];
						var conversionRate = objOPentaskRec.custrecord_wmsse_conversionrate;
						var receivedQuantity = objOPentaskRec.custrecord_wmsse_act_qty;
						if (!utility.isValueValid(conversionRate)) {
							conversionRate = 1;
						}
						opentaskArr[objOPentaskRec['custrecord_wmsse_line_no']] = Number(Big(receivedQuantity).mul(conversionRate));
					}
				}
			}
			log.debug({
				title: 'receivedOpentaskArr',
				details: opentaskArr
			});
			return opentaskArr;

		}

		function _checkIslinePartiallyReceivedInISM(shipmentId, whLocation, getOrderLineNo) {
			var isLineReceivedManually = false;
			var receivedISMResults = getInbShipmentReceivedOpenTaskDetails(shipmentId, whLocation, getOrderLineNo);
			var openPutawayResults = getInbShipmentOpenTaskDetails(shipmentId, '', whLocation);
			if (JSON.stringify(receivedISMResults) != '{}') {
				var lineItemReceivedOpentaskQty = receivedISMResults[getOrderLineNo];
				log.debug({
					title: 'lineItemReceivedOpentaskQty :',
					details: lineItemReceivedOpentaskQty
				});
				if (parseFloat(lineItemReceivedOpentaskQty) > 0) {
					isLineReceivedManually = true;
				}


			}
			if (JSON.stringify(openPutawayResults) != '{}') {
				var lineItemReceivedOpentaskQty = openPutawayResults[getOrderLineNo];
				log.debug({
					title: 'OpentaskQty :',
					details: lineItemReceivedOpentaskQty
				});

				if (parseFloat(lineItemReceivedOpentaskQty) > 0) {
					isLineReceivedManually = true;
				}

			}
			return isLineReceivedManually;
		}

		function getInbShipmentOpenTaskDetails(shipmentId, shipmentNum, whLocation, lineNo) {
			log.debug({
				title: 'shipmentId',
				details: shipmentId
			});
			log.debug({
				title: 'whLocation',
				details: whLocation
			});
			var opentaskArr = {};
			var filterStrat = [];
			if (utility.isValueValid(shipmentId)) {
				if (utility.isValueValid(whLocation)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_wms_location',
						operator: search.Operator.ANYOF,
						values: whLocation
					}));
				}
				if (utility.isValueValid(lineNo)) {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_line_no',
						operator: search.Operator.EQUALTO,
						values: parseInt(lineNo)
					}));
				}
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_inbshipment',
					operator: search.Operator.ANYOF,
					values: shipmentId
				}));

				var objOpentaskDetailsSearch = search.load({
					id: 'customsearch_wms_inbshipmnt_opentask_dtl'
				});
				var savedFilter = objOpentaskDetailsSearch.filters;
				objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
				var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);

				log.debug('open task dtl :', objOPentaskDetails);

				if (objOPentaskDetails.length > 0) {
					for (var objOPentask in objOPentaskDetails) {
						var objOPentaskRec = objOPentaskDetails[objOPentask];
						var conversionRate = objOPentaskRec.custrecord_wmsse_conversionrate;
						var expectedQuantity = objOPentaskRec.custrecord_wmsse_expe_qty;
						if (!utility.isValueValid(conversionRate)) {
							conversionRate = 1;
						}
						opentaskArr[objOPentaskRec['custrecord_wmsse_line_no']] = Number(Big(expectedQuantity).mul(conversionRate));
					}
				}
			}
			log.debug({
				title: 'opentaskArr',
				details: opentaskArr
			});
			return opentaskArr;
		}

		function getShipmentList(shipmentInputObj) {

			var ismSearch = '';

			if (utility.isValueValid(shipmentInputObj['shipmentId']) || utility.isValueValid(shipmentInputObj['documentNum'])) {
				ismSearch = 'customsearch_wms_inbound_shipment_valid';
			} else {
				ismSearch = 'customsearch_wms_inbound_shipment_list'
			}


			var shipmentDetailsSrch = search.load({
				id: ismSearch
			});

			var shipmentDtlFilterArr = shipmentDetailsSrch.filters;

			if (utility.isValueValid(shipmentInputObj['whLocation'])) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: shipmentInputObj['whLocation']
				}));
			}

			if (utility.isValueValid(shipmentInputObj['shipmentId'])) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'shipmentnumber',
					operator: search.Operator.ANYOF,
					values: shipmentInputObj['shipmentId']
				}));
			}

			if (utility.isValueValid(shipmentInputObj['action']) && shipmentInputObj['action'] == 'getShipmentsForExtDocNum' &&
				utility.isValueValid(shipmentInputObj['externalDocumentNumber'])) {
				shipmentInputObj['documentNum'] = shipmentInputObj['externalDocumentNumber'];
			}

			if (utility.isValueValid(shipmentInputObj['documentNum'])) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'externaldocumentnumber',
					operator: search.Operator.ANYOF,
					values: shipmentInputObj['documentNum']
				}));
			}


			shipmentDtlFilterArr.filters = shipmentDtlFilterArr;
			var shipmentListResult = utility.getSearchResultInJSON(shipmentDetailsSrch);

			return shipmentListResult;
		}

		function getItemShipments(itemArray, warehouseLocationId) {
			var itemShipmentSearch = search.load({
				id: 'customsearch_wms_item_based_is_search'
			});

			itemShipmentSearch.filters.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemArray
			}));


			itemShipmentSearch.filters.push(search.createFilter({
				name: 'receivinglocation',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));

			var itemShipmentList = utility.getSearchResultInJSON(itemShipmentSearch);
			return itemShipmentList;
		}

		function getItemShipmentList(itemInternalId, warehouseLocationId, vendorId) {
			var itemShipmentListSearch = search.load({
				id: 'customsearch_wms_inbound_shipment_valid'
			});

			itemShipmentListSearch.filters.push(search.createFilter({
				name: 'receivinglocation',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));

			itemShipmentListSearch.filters.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));

			if (utility.isValueValid(vendorId)) {
				itemShipmentListSearch.filters.push(search.createFilter({
					name: 'vendor',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', vendorId]
				}));
			}

			var itemShipmentListRes = utility.getSearchResultInJSON(itemShipmentListSearch);

			return itemShipmentListRes;
		}

		function getShipmentValidate(shipNum, shipId, whLocation, docNum) {
			var shipmentDetailsSrch = search.load({
				id: 'customsearch_wms_inbound_shipment_valid'
			});
			var shipmentDtlFilterArr = shipmentDetailsSrch.filters;

			if (utility.isValueValid(shipNum)) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'shipmentnumber',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', shipNum]
				}));
			}
			if (utility.isValueValid(whLocation)) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', whLocation]
				}));
			}
			if (utility.isValueValid(shipId)) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', shipId]
				}));
			}
			if (utility.isValueValid(docNum)) {
				shipmentDtlFilterArr.push(search.createFilter({
					name: 'externaldocumentnumber',
					operator: search.Operator.IS,
					values: docNum
				}));
			}


			shipmentDtlFilterArr.filters = shipmentDtlFilterArr;
			var shipmentListResult = utility.getSearchResultInJSON(shipmentDetailsSrch);

			return shipmentListResult;

		}

		function validateItemAgainstShipment(shipmentId, itemInternalId, warehouseLocationId) {


			var ismItemValidateSearch = search.load({
				id: 'customsearch_wms_ism_item_validation'
			});

			ismItemValidateSearch.filters.push(
				search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', warehouseLocationId]
				})
			);

			ismItemValidateSearch.filters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));

			if (utility.isValueValid(itemInternalId)) {
				ismItemValidateSearch.filters.push(
					search.createFilter({
						name: 'internalid',
						join: 'item',
						operator: search.Operator.ANYOF,
						values: itemInternalId
					})
				);
			}

			return utility.getSearchResultInJSON(ismItemValidateSearch);

		}

		function ismReceivedquantity(transactionId, warehouseLocationId) {


			var ismqtySearch = search.load({
				id: 'customsearch_wmsse_ism_receivedqty'
			});

			ismqtySearch.filters.push(
				search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', warehouseLocationId]
				})
			);
			if (utility.isValueValid(transactionId)) {
				ismqtySearch.filters.push(search.createFilter({
					name: 'purchaseorder',
					operator: search.Operator.ANYOF,
					values: transactionId
				}));
			}



			return utility.getSearchResultInJSON(ismqtySearch);

		}

		function ismTotalquantity(transactionId, warehouseLocationId) {


			var ismqtySearch = search.load({
				id: 'customsearch_wmsse_ism_total_rem'
			});

			ismqtySearch.filters.push(
				search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', warehouseLocationId]
				})
			);
			if (utility.isValueValid(transactionId)) {
				ismqtySearch.filters.push(search.createFilter({
					name: 'purchaseorder',
					operator: search.Operator.ANYOF,
					values: transactionId
				}));
			}



			return utility.getSearchResultInJSON(ismqtySearch);

		}

		function _getReceiveAllOptionValue(whLocation, transactionType) {
			var receiveAllOptionEnable = 'F';

			var recevAllSystemRule = utility.getSystemRuleValue('Enable Receive All option for inbound shipments', whLocation);

			if (recevAllSystemRule == 'Y') {
				var locationUseBinsFlag = true;
				if (utility.isValueValid(whLocation)) {
					var columnlocationlookupArray = [];
					columnlocationlookupArray.push('usesbins');
					var locationLookUp = utility.getLocationFieldsByLookup(whLocation, columnlocationlookupArray);
					log.debug({
						title: 'locationLookUp',
						details: locationLookUp
					});

					if (locationLookUp.usesbins != undefined) {
						locationUseBinsFlag = locationLookUp.usesbins;
					}
				}
				log.debug({
					title: 'locationUseBinsFlag',
					details: locationUseBinsFlag
				});
				if (locationUseBinsFlag == true) {
					//var	stageRecvngSystemRule=utility.getSystemRuleValue('Stage received items before putting away?',whLocation);
					var stageRecvngSystemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?', whLocation, transactionType);
					log.debug({
						title: 'stageRecvngSystemRule',
						details: stageRecvngSystemRule
					});
					if (stageRecvngSystemRule == 'Y') {
						receiveAllOptionEnable = 'T';
					}
				} else {
					receiveAllOptionEnable = 'T';
				}
			}
			return receiveAllOptionEnable;
		}

		function buildOpenTaskParametes(requestParams, manullayPostItemReceipt, binName, binInternalId, shipmentLineNo,
			quantity, warehouseLocationId, shipmentReceiptId, itemInternalId, itemType, poInternalId, poname, uom, conversionRate, strBarCode,
			invStatus, expectedQty, shipmentId, lotNo, lotExpiryDate, binLocType, binIsCart, isTallyScanRequired, tallyLoopObj) {

			var actualBeginTime = requestParams.actualBeginTime;

			var objOpentaskDetails = {};
			objOpentaskDetails.poInternalId = poInternalId;
			objOpentaskDetails.FetchedItemId = itemInternalId;
			objOpentaskDetails.poLineno = shipmentLineNo;
			objOpentaskDetails.enterQty = quantity;
			objOpentaskDetails.enterBin = binInternalId;
			objOpentaskDetails.itemType = itemType;
			objOpentaskDetails.whLocation = warehouseLocationId;
			objOpentaskDetails.poname = poname;
			objOpentaskDetails.taskType = 'PUTW';
			objOpentaskDetails.trantype = 'purchaseorder';
			objOpentaskDetails.actualBeginTime = actualBeginTime;
			objOpentaskDetails.customer = '';
			objOpentaskDetails.systemRule = manullayPostItemReceipt;
			objOpentaskDetails.uom = uom;
			objOpentaskDetails.conversionRate = conversionRate;
			objOpentaskDetails.vInvStatus_select = invStatus;
			objOpentaskDetails.strBarCode = strBarCode;
			objOpentaskDetails.shipmentReceiptId = shipmentReceiptId;
			objOpentaskDetails.shipmentId = shipmentId;
			objOpentaskDetails.expectedQty = expectedQty;
			objOpentaskDetails.lotNo = lotNo;
			objOpentaskDetails.expiryDate = lotExpiryDate;
			objOpentaskDetails.binLocType = binLocType;
			objOpentaskDetails.binIsCart = binIsCart;
			objOpentaskDetails.isTallyScanRequired = isTallyScanRequired;
			objOpentaskDetails.tallyLoopObj = tallyLoopObj;

			return objOpentaskDetails;
		}

		function receiveISM(shipmentId, warehouseLocationId, binInternalId, shipmentLineNo, quantity, poInternalId, itemType, invtStatus, isTallyScanRequired, tallyLoopObj, selectedConversionRateForTallyScan, transactionUomConversionRate) {

			log.debug({
				title: 'receiveISM',
				details: 'receiveISM'
			});
			var objRecord = record.load({
				type: 'receiveinboundshipment',
				id: shipmentId
			});

			var inboundShipmentItemcount = objRecord.getLineCount({
				sublistId: 'receiveitems'
			});

			var serialSearchResults = this.setLineDetailsForShipmentRecord(invtStatus, objRecord, inboundShipmentItemcount, shipmentId, warehouseLocationId, binInternalId, shipmentLineNo, quantity, poInternalId, itemType, isTallyScanRequired, tallyLoopObj, selectedConversionRateForTallyScan, transactionUomConversionRate);
			if (serialSearchResults && serialSearchResults.length > 0) {
				this.closeSerialEntryRecordsForTransaction(serialSearchResults);
			}
			return objRecord.save();

		}

		function setLineDetailsForShipmentRecord(inventoryStatusId, objRecord, inboundShipmentItemcount, shipmentId, warehouseLocationId, binInternalId, shipmentLineNo, quantity, poInternalId, itemType, isTallyScanRequired, tallyLoopObj, selectedConversionRateForTallyScan, transactionUomConversionRate) {
			log.debug({
				title: 'inventoryStatusId',
				details: inventoryStatusId
			});
			shipmentLineNo = parseInt(shipmentLineNo);
			var serialSearchResults;
			if (itemType == "noninventoryitem" || itemType == "otherchargeitem" ||
				itemType == "serviceitem" || itemType == "downloaditem" || itemType == "giftcertificateitem") {
				itemType = 'NONINVT';
			}
			var lineNo = '';
			for (var lineNumber = 0; lineNumber < inboundShipmentItemcount; lineNumber++) {

				lineNo = objRecord.getSublistValue({
					sublistId: 'receiveitems',
					fieldId: 'id',
					line: lineNumber
				});

				if (!poInternalId) {

					poInternalId = objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'purchaseorder',
						line: lineNumber
					});
				}

				lineNo = parseInt(lineNo);
				if (shipmentLineNo == lineNo) {

					objRecord.setSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'receiveitem',
						line: lineNumber,
						value: true
					});

					if (utility.isValueValid(quantity)) {

						if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") &&
							(isTallyScanRequired == true || isTallyScanRequired == 'true') && utility.isValueValid(transactionUomConversionRate)) {
							quantity = Number(Big(quantity).div(transactionUomConversionRate));
						}

						objRecord.setSublistValue({
							sublistId: 'receiveitems',
							fieldId: 'quantitytobereceived',
							line: lineNumber,
							value: quantity
						});
					}
					if (itemType != 'NONINVT') {

						var compSubRecord = objRecord.getSublistSubrecord({
							sublistId: 'receiveitems',
							fieldId: 'inventorydetail',
							line: lineNumber
						});

						var compinvlinelength = compSubRecord.getLineCount({
							sublistId: 'inventoryassignment'
						});
						if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem' ||
							itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {

							var serialSearchResults = this.getSerialsFromSerialEntryForISM(shipmentLineNo, poInternalId, shipmentId);
							log.debug({
								title: 'serialSearchResults',
								details: serialSearchResults
							});
							var serialOrLotQty = 1;
							if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {
								serialOrLotQty = 1;
							}
							if (compinvlinelength > 0) {
								for (var invtassignmentLine = 0; invtassignmentLine < compinvlinelength; invtassignmentLine++) {
									compSubRecord.removeLine({
										sublistId: 'inventoryassignment',
										line: 0

									});
								}
								compinvlinelength = 0;
							}

							if (isTallyScanRequired == true && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {
								for (var obj in tallyLoopObj) {
									var tallyObj = tallyLoopObj[obj];
									var convertedQuantity = tallyObj.quantity;
									if (utility.isValueValid(selectedConversionRateForTallyScan)) {
										convertedQuantity = Number(Big(convertedQuantity).mul(selectedConversionRateForTallyScan));
										convertedQuantity = Number(Big(convertedQuantity).div(transactionUomConversionRate));
									}
									compSubRecord.insertLine({
										sublistId: 'inventoryassignment',
										line: compinvlinelength
									});
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'receiptinventorynumber',
										line: compinvlinelength,
										value: tallyObj.lotName
									});
									if (utility.isValueValid(binInternalId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: compinvlinelength,
											value: binInternalId
										});
									}
									if (utility.isValueValid(tallyObj.statusName)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: compinvlinelength,
											value: tallyObj.statusName
										});
									}
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: compinvlinelength,
										value: convertedQuantity
									});
									if (utility.isValueValid(tallyObj.lotExpiryDate)) {
										var lotExpiryDate = format.parse({
											value: tallyObj.lotExpiryDate,
											type: format.Type.DATE
										});
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'expirationdate',
											line: compinvlinelength,
											value: lotExpiryDate
										});
									}
									compinvlinelength = compinvlinelength + 1;
								}
							} else if (serialSearchResults.length > 0) {

								for (var serialLotArr = 0; serialLotArr < serialSearchResults.length; serialLotArr++) {
									var serialNoOrLotNumber = serialSearchResults[serialLotArr]['custrecord_wmsse_ser_no'];
									if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
										serialOrLotQty = serialSearchResults[serialLotArr]['custrecord_wmsse_ser_qty'];
										inventoryStatusId = serialSearchResults[serialLotArr]['custrecord_serial_inventorystatus'];
										var lotExpiryDate = '';
										if (utility.isValueValid(serialSearchResults[serialLotArr]['custrecord_wmsse_lot_expirydate'])) {
											lotExpiryDate = format.parse({
												value: serialSearchResults[serialLotArr]['custrecord_wmsse_lot_expirydate'],
												type: format.Type.DATE
											});
										}
									} else if (isTallyScanRequired == true) {
										inventoryStatusId = serialSearchResults[serialLotArr]['custrecord_serial_inventorystatus'];
									}
									compSubRecord.insertLine({
										sublistId: 'inventoryassignment',
										line: serialLotArr
									});
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'receiptinventorynumber',
										line: serialLotArr,
										value: serialNoOrLotNumber
									});
									if (utility.isValueValid(binInternalId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: serialLotArr,
											value: binInternalId
										});
									}
									if (utility.isValueValid(inventoryStatusId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: serialLotArr,
											value: inventoryStatusId
										});
									}
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: serialLotArr,
										value: serialOrLotQty
									});
									if (utility.isValueValid(lotExpiryDate)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'expirationdate',
											line: serialLotArr,
											value: lotExpiryDate
										});
									}

								}

							}

						} else {

							log.debug({
								title: 'binInternalId',
								details: binInternalId
							});
							log.debug({
								title: 'inventoryStatusId',
								details: inventoryStatusId
							});
							log.debug({
								title: 'quantity',
								details: quantity
							});
							if (compinvlinelength > 0) {
								for (var invtassignmentLine = 0; invtassignmentLine < compinvlinelength; invtassignmentLine++) {
									compSubRecord.removeLine({
										sublistId: 'inventoryassignment',
										line: 0

									});
								}
								compinvlinelength = 0;
							}
							if (utility.isValueValid(binInternalId) || utility.isValueValid(inventoryStatusId)) {

								if (isTallyScanRequired == true) {

									for (var obj in tallyLoopObj) {
										var tallyObj = tallyLoopObj[obj];
										var convertedQuantity = tallyObj.quantity;
										if (utility.isValueValid(selectedConversionRateForTallyScan)) {
											convertedQuantity = Number(Big(convertedQuantity).mul(selectedConversionRateForTallyScan));
											convertedQuantity = Number(Big(convertedQuantity).div(transactionUomConversionRate));
										}

										compSubRecord.insertLine({
											sublistId: 'inventoryassignment',
											line: compinvlinelength
										});

										if (utility.isValueValid(binInternalId)) {
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'binnumber',
												line: compinvlinelength,
												value: binInternalId
											});
										}

										if (utility.isValueValid(tallyObj.statusName)) {
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'inventorystatus',
												line: compinvlinelength,
												value: tallyObj.statusName
											});
										}

										if (utility.isValueValid(convertedQuantity)) {
											compSubRecord.setSublistValue({
												sublistId: 'inventoryassignment',
												fieldId: 'quantity',
												line: compinvlinelength,
												value: convertedQuantity
											});
										}

									}
								} else {
									compSubRecord.insertLine({
										sublistId: 'inventoryassignment',
										line: compinvlinelength
									});


									if (utility.isValueValid(binInternalId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: compinvlinelength,
											value: binInternalId
										});
									}
									if (utility.isValueValid(inventoryStatusId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: compinvlinelength,
											value: inventoryStatusId
										});
									}
									if (utility.isValueValid(quantity)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'quantity',
											line: compinvlinelength,
											value: quantity
										});
									}
								}
							}
						}
					}
				} else {
					objRecord.setSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'receiveitem',
						line: lineNumber,
						value: false
					});
				}
			}
			return serialSearchResults;
		}

		function _iSM_receiveAll(shipmentId, warehouseLocationId, binInternalId, shipmentLineNo, manuallyPostIrSystemRule, invtStatusId) {



			var objRecord = record.load({
				type: 'receiveinboundshipment',
				id: shipmentId
			});

			var inboundShipmentItemcount = objRecord.getLineCount({
				sublistId: 'receiveitems'
			});
			var lineNo = '';
			if (utility.isValueValid(shipmentLineNo)) {
				shipmentLineNo = parseInt(shipmentLineNo);
			} else {
				shipmentLineNo = 'receiveAllItems';
			}

			log.debug({
				title: 'shipmentLineNo',
				details: shipmentLineNo
			});
			var openPutAwayDetails = getInbShipmentOpenTaskDetails(shipmentId, '', warehouseLocationId);
			log.debug({
				title: 'openPutAwayDetails',
				details: openPutAwayDetails
			});
			for (var lineNumber = 0; lineNumber < inboundShipmentItemcount; lineNumber++) {

				lineNo = objRecord.getSublistValue({
					sublistId: 'receiveitems',
					fieldId: 'id',
					line: lineNumber
				});

				lineNo = parseInt(lineNo);
				if (shipmentLineNo == lineNo || shipmentLineNo == 'receiveAllItems') {

					objRecord.setSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'receiveitem',
						line: lineNumber,
						value: true
					});
					var purchaseorderInternalId = objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'purchaseorder',
						line: lineNumber
					});
					var itemInternalId = objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'itemkey',
						line: lineNumber
					});
					var itemISMQuantity = objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'quantity',
						line: lineNumber
					});

					var itemISMReceivedQty = objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'quantityreceived',
						line: lineNumber
					});
					if (itemISMReceivedQty > 0 && shipmentLineNo == 'receiveAllItems') {

						objRecord.setSublistValue({
							sublistId: 'receiveitems',
							fieldId: 'receiveitem',
							line: lineNumber,
							value: false
						});
						continue;

					}
					if (utility.isValueValid(itemISMQuantity)) {

						objRecord.setSublistValue({
							sublistId: 'receiveitems',
							fieldId: 'quantitytobereceived',
							line: lineNumber,
							value: itemISMQuantity
						});
					}

					var compSubRecord = null;
					var compinvlinelength = 0;
					try {
						compSubRecord = objRecord.getSublistSubrecord({
							sublistId: 'receiveitems',
							fieldId: 'inventorydetail',
							line: lineNumber
						});
						compinvlinelength = compSubRecord.getLineCount({
							sublistId: 'inventoryassignment'
						});
					} catch (e) {
						log.error({
							title: 'e',
							details: e
						});
					}

					log.debug({
						title: 'compinvlinelength',
						details: compinvlinelength
					});
					log.debug({
						title: 'itemISMReceivedQty',
						details: itemISMReceivedQty
					});
					if (manuallyPostIrSystemRule == 'Y') {
						if (JSON.stringify(openPutAwayDetails) != '{}' && shipmentLineNo == 'receiveAllItems') {
							var lineItemOpentaskRcvQty = openPutAwayDetails[lineNo];
							if (parseFloat(lineItemOpentaskRcvQty) > 0) {
								continue;
							}
						}
					}

					for (var invDetailLineCount = 0; invDetailLineCount < compinvlinelength; invDetailLineCount++) {

						var serialORLotNumber = compSubRecord.getSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'receiptinventorynumber',
							line: invDetailLineCount
						});
						var serialORLotQuantity = compSubRecord.getSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'quantity',
							line: invDetailLineCount
						});

						var lotExpiryDate = compSubRecord.getSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'expirationdate',
							line: invDetailLineCount
						});

						var createLotISMObj = {};
						createLotISMObj['shipmentNumber'] = shipmentId;
						createLotISMObj['warehouseLocationId'] = warehouseLocationId;
						createLotISMObj['itemInternalId'] = itemInternalId;
						createLotISMObj['purchaseorderInternalId'] = purchaseorderInternalId;
						createLotISMObj['scannedQuantity'] = serialORLotQuantity;
						createLotISMObj['shipmentInternalNumber'] = shipmentId;
						createLotISMObj['shipmentLineNumber'] = lineNo;
						createLotISMObj['LotName'] = serialORLotNumber;
						if (utility.isValueValid(invtStatusId)) {
							createLotISMObj['inventoryStatusId'] = invtStatusId;
						}
						if (utility.isValueValid(lotExpiryDate)) {
							createLotISMObj['lotExpiryDate'] = lotExpiryDate;
						}
						if (utility.isValueValid(binInternalId)) {
							createLotISMObj['binInternalId'] = binInternalId;
						}

						var id = _createLotISMInfoInSerialEntry(createLotISMObj, manuallyPostIrSystemRule);
						log.debug({
							title: 'serial Id',
							details: id
						});
					}

					if (manuallyPostIrSystemRule == 'N') {

						if (utility.isValueValid(binInternalId)) {

							if (compinvlinelength > 0) {

								for (var invDetailLineCount = 0; invDetailLineCount < compinvlinelength; invDetailLineCount++) {

									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'binnumber',
										line: invDetailLineCount,
										value: binInternalId
									});

									if (utility.isValueValid(invtStatusId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: invDetailLineCount,
											value: invtStatusId
										});
									}
								}
							} else {
								if (compSubRecord != null) {
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'binnumber',
										line: 0,
										value: binInternalId
									});

									if (utility.isValueValid(invtStatusId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: 0,
											value: invtStatusId
										});
									}
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: 0,
										value: itemISMQuantity
									});
								}
							}
						} else {
							if (compinvlinelength > 0) {
								if (utility.isValueValid(invtStatusId)) {
									for (var invDetailLineCount = 0; invDetailLineCount < compinvlinelength; invDetailLineCount++) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: invDetailLineCount,
											value: invtStatusId
										});
									}
								}
							} else {

								if (utility.isValueValid(invtStatusId) && compSubRecord != null) {

									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: 0,
										value: itemISMQuantity
									});


									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: 0,
										value: invtStatusId
									});
								}
							}

						}

					}

				} else {
					if (shipmentLineNo != 'receiveAllItems') {
						log.debug({
							title: 'lineNumber',
							details: lineNumber
						});
						objRecord.setSublistValue({
							sublistId: 'receiveitems',
							fieldId: 'receiveitem',
							line: lineNumber,
							value: false
						});
					}
				}
			}
			var shipId = '';
			if (manuallyPostIrSystemRule != 'Y') {
				shipId = objRecord.save();
			}
			return shipId;

		}

		function _createLotISMInfoInSerialEntry(paramsLotISMObj, manuallyPostIrSystemRule) {

			var shipmentNumber = paramsLotISMObj['shipmentNumber'];
			var warehouseLocationId = paramsLotISMObj['warehouseLocationId'];
			var itemInternalId = paramsLotISMObj['itemInternalId'];
			var purchaseorderInternalId = paramsLotISMObj['purchaseorderInternalId'];
			var scannedQuantity = paramsLotISMObj['scannedQuantity'];
			var shipmentInternalNumber = paramsLotISMObj['shipmentInternalNumber'];
			var shipmentLineNumber = paramsLotISMObj['shipmentLineNumber'];
			var LotName = paramsLotISMObj['LotName'];
			var inventoryStatus = paramsLotISMObj['inventoryStatusId'];
			var lotExpiryDate = paramsLotISMObj['lotExpiryDate'];
			var binInternalId = paramsLotISMObj['binInternalId'];


			var customrecord = record.create({
				type: 'customrecord_wmsse_serialentry'
			});
			customrecord.setValue({
				fieldId: 'name',
				value: shipmentInternalNumber
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordno',
				value: purchaseorderInternalId
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordline',
				value: shipmentLineNumber
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_item',
				value: itemInternalId
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_qty',
				value: scannedQuantity
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_no',
				value: LotName
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_location',
				value: warehouseLocationId
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_inb_shipment',
				value: shipmentInternalNumber
			});
			if (utility.isValueValid(manuallyPostIrSystemRule) && manuallyPostIrSystemRule == 'N') {
				customrecord.setValue({
					fieldId: 'custrecord_wmsse_ser_status',
					value: true
				});
			} else {
				customrecord.setValue({
					fieldId: 'custrecord_wmsse_ser_status',
					value: false
				});
			}
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_tasktype',
				value: 2
			});
			if (utility.isValueValid(inventoryStatus)) {
				customrecord.setValue({
					fieldId: 'custrecord_serial_inventorystatus',
					value: inventoryStatus
				});
			}

			if (utility.isValueValid(lotExpiryDate)) {
				customrecord.setValue({
					fieldId: 'custrecord_wmsse_lot_expirydate',
					value: lotExpiryDate
				});
			}
			if (utility.isValueValid(binInternalId)) {
				customrecord.setValue({
					fieldId: 'custrecord_wmsse_ser_bin',
					value: binInternalId
				});
			}


			var serialEntryRecordId = customrecord.save({
				enableSourcing: false,
				ignoreMandatoryFields: true
			});
			return serialEntryRecordId;
		}

		function _getOpenTaskSerials(itemInternalId, shipmentId, shipmentLineNo) {
			var openTaskSerialArray = [];
			var opentaskSerialSearch = search.load({
				id: 'customsearch_wmsse_opntsk_serialsrch_ism',
			});
			var filtersseropenTask = opentaskSerialSearch.filters;
			filtersseropenTask.push(search.createFilter({
				name: 'custrecord_wmsse_sku',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
			if (utility.isValueValid(shipmentId)) {
				filtersseropenTask.push(search.createFilter({
					name: 'custrecord_wmsse_inbshipment',
					operator: search.Operator.ANYOF,
					values: shipmentId
				}));
			}
			if (utility.isValueValid(shipmentLineNo)) {
				filtersseropenTask.push(search.createFilter({
					name: 'custrecord_wmsse_line_no',
					operator: search.Operator.EQUALTO,
					values: shipmentLineNo
				}));
			}
			opentaskSerialSearch.filters = filtersseropenTask;
			var SrchRecordOpenTaskSerial = utility.getSearchResultInJSON(opentaskSerialSearch);

			if (SrchRecordOpenTaskSerial.length > 0) {
				for (var p1 = 0; p1 < SrchRecordOpenTaskSerial.length; p1++) {
					var opentaskSerial = SrchRecordOpenTaskSerial[p1]['custrecord_wmsse_serial_no'];
					if (opentaskSerial != null && opentaskSerial != '' &&
						opentaskSerial != 'null' && opentaskSerial != 'undefined') {
						var opentaskSerArray = opentaskSerial.split(',');

						if (opentaskSerArray != null && opentaskSerArray != '' && opentaskSerArray != 'null' && opentaskSerArray != undefined) {
							for (var p3 = 0; p3 < opentaskSerArray.length; p3++) {
								var serialNo = opentaskSerArray[p3];
								if (serialNo != null && serialNo != '' && serialNo != 'null' && serialNo != 'undefined') {
									openTaskSerialArray.push(serialNo);
								}
							}
						}


					}
				}
			}
			return openTaskSerialArray;
		}

		function closeSerialEntryRecordsForTransaction(serialSearchResults, lineNum, transactionInternalId) {

			if (!serialSearchResults) {
				var serialSearch = search.load({
					id: 'customsearch_wmsse_wo_serialentry_srh',
				});
				var serailFilters = serialSearch.filters;

				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordline',
					operator: search.Operator.EQUALTO,
					values: lineNum
				}));
				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordno',
					operator: search.Operator.ANYOF,
					values: transactionInternalId
				}));

				serialSearch.filters = serailFilters;
				serialSearchResults = utility.getSearchResultInJSON(serialSearch);
			}


			if (serialSearchResults.length > 0) {
				for (var j = 0; j < serialSearchResults.length; j++) {
					var TempRecord = serialSearchResults[j];
					var serialRec = record.load({
						type: 'customrecord_wmsse_serialentry',
						id: serialSearchResults[j].id,
						isDynamic: true
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
						value: 'because of serial number is updated in opentask we have marked this serial number as closed'
					});
					serialRec.setValue({
						fieldId: 'custrecord_wmsse_ser_status',
						value: true
					});
					serialRec.save();
				}
			}
		}

		function _validateShipmentWithInvtDetailsForReceiveAll(shipmentId, warehouseLocationId, itemInternalId) {

			var ismReceiveAllSearch = search.load({
				id: 'customsearch_wms_ism_item_invtdtlsrcvall'
			});



			ismReceiveAllSearch.filters.push(
				search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', warehouseLocationId]
				})
			);

			ismReceiveAllSearch.filters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));
			if (utility.isValueValid(itemInternalId)) {
				ismReceiveAllSearch.filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
			}

			return utility.getSearchResultInJSON(ismReceiveAllSearch);
		}

		function getSerialsFromSerialEntryForISM(shipmentLineNo, poInternalId, shipmentId, binInternalId, inventoryStatusId, process) {

			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});
			var serailFilters = serialSearch.filters;

			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordline',
				operator: search.Operator.EQUALTO,
				values: shipmentLineNo
			}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values: poInternalId
			}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_inb_shipment',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));
			if (process != "ISMPosting") {
				serailFilters.push(search.createFilter({
					name: 'custrecord_wms_opentaskno',
					operator: search.Operator.ISEMPTY
				}));
			}
			if (binInternalId) {
				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_bin',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			if (inventoryStatusId) {
				serailFilters.push(search.createFilter({
					name: 'custrecord_serial_inventorystatus',
					operator: search.Operator.ANYOF,
					values: inventoryStatusId
				}));
			}

			serialSearch.columns.push(search.createColumn({
				name: 'custrecord_wmsse_ser_qty'
			}));
			serialSearch.columns.push(search.createColumn({
				name: 'custrecord_serial_inventorystatus'
			}));

			serialSearch.filters = serailFilters;
			return utility.getSearchResultInJSON(serialSearch);
		}

		function postItemReceiptISM(shipmentInternalId, warehouseLocationId, openTaskDtls, openTaskQtyDetails, binId, randomTallyScanRule) {
			var shipmentListObj = {};
			var lineNo = '';
			var objRecord = record.load({
				type: 'receiveinboundshipment',
				id: shipmentInternalId
			});
			var inboundShipmentItemcount = objRecord.getLineCount({
				sublistId: 'receiveitems'
			});
			for (var qtyItr in openTaskQtyDetails) {
				for (var lineNumber = 0; lineNumber < inboundShipmentItemcount; lineNumber++) {
					lineNo = parseInt(objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'id',
						line: lineNumber
					}));
					if (openTaskQtyDetails[qtyItr]['custrecord_wmsse_line_no'] == lineNo) {
						objRecord.setSublistValue({
							sublistId: 'receiveitems',
							fieldId: 'quantitytobereceived',
							line: lineNumber,
							value: 0
						});
						var compSubRecord = null;
						try {
							compSubRecord = objRecord.getSublistSubrecord({
								sublistId: 'receiveitems',
								fieldId: 'inventorydetail',
								line: lineNumber
							});
						} catch (e) {
							compSubRecord = null;
						}
						if (utility.isValueValid(compSubRecord)) {
							var compinvlinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
							if (compinvlinelength > 0) {
								for (var invtassignmentLine = 0; invtassignmentLine < compinvlinelength; invtassignmentLine++) {
									if (compSubRecord.getSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'receiptinventorynumber',
											line: invtassignmentLine
										}) != "") {
										compSubRecord.removeLine({
											sublistId: 'inventoryassignment',
											line: 0

										});
									}
								}
							}
						}

					}
				}
			}
			for (var index = 0; index < openTaskDtls.length; index++) {
				shipmentListObj.shipmentInternalId = shipmentInternalId;
				shipmentListObj.warehouseLocationId = warehouseLocationId;
				shipmentListObj.binInternalId = openTaskDtls[index].custrecord_wmsse_actbeginloc;
				if (utility.isValueValid(randomTallyScanRule) && randomTallyScanRule == 'T') {
					shipmentListObj.binInternalId = binId;
				}
				shipmentListObj.shipmentLineNo = openTaskDtls[index].custrecord_wmsse_line_no;
				shipmentListObj.quantity = openTaskDtls[index].custrecord_wmsse_act_qty;
				shipmentListObj.itemType = utility.getItemType(openTaskDtls[index].custrecord_wmsse_sku, warehouseLocationId);
				shipmentListObj.openTaskSerials = openTaskDtls[index].custrecord_wmsse_serial_no;
				shipmentListObj.inventoryStatusId = openTaskDtls[index].custrecord_wmsse_inventorystatus;
				shipmentListObj.expiryDate = openTaskDtls[index].custrecord_wmsse_expirydate;
				serialSearchResults = this.setLineDetailsForShipmentRecordIRPosting(objRecord, inboundShipmentItemcount, shipmentListObj, openTaskDtls);
				if (serialSearchResults && serialSearchResults.length > 0) {
					this.closeSerialEntryRecordsForTransaction(serialSearchResults);
				}
			}
			return objRecord.save();
		}

		function setLineDetailsForShipmentRecordIRPosting(objRecord, inboundShipmentItemcount, shipmentListObj, openTaskDtls) {
			var serialSearchResults;
			var shipmentInternalId = shipmentListObj.shipmentInternalId;
			var binInternalId = shipmentListObj.binInternalId;
			var shipmentLineNo = shipmentListObj.shipmentLineNo;
			var quantity = shipmentListObj.quantity;
			var itemType = shipmentListObj.itemType;
			var inventoryStatusId = shipmentListObj.inventoryStatusId;
			var expiryDate = shipmentListObj.expiryDate;
			var lineNo, poInternalId;
			shipmentLineNo = parseInt(shipmentLineNo);
			if (itemType == "noninventoryitem" || itemType == "otherchargeitem" ||
				itemType == "serviceitem" || itemType == "downloaditem" || itemType == "giftcertificateitem") {
				itemType = 'NONINVT';
			}
			for (var lineNumber = 0; lineNumber < inboundShipmentItemcount; lineNumber++) {
				lineNo = objRecord.getSublistValue({
					sublistId: 'receiveitems',
					fieldId: 'id',
					line: lineNumber
				});
				poInternalId = objRecord.getSublistValue({
					sublistId: 'receiveitems',
					fieldId: 'purchaseorder',
					line: lineNumber
				});
				lineNo = parseInt(lineNo);
				if (shipmentLineNo == lineNo) {
					objRecord.setSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'receiveitem',
						line: lineNumber,
						value: true
					});
					var qtyposted = objRecord.getSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'quantitytobereceived',
						line: lineNumber
					});
					if (utility.isValueValid(quantity)) {
						objRecord.setSublistValue({
							sublistId: 'receiveitems',
							fieldId: 'quantitytobereceived',
							line: lineNumber,
							value: parseFloat(quantity) + parseFloat(qtyposted)
						});
					}
					if (itemType != 'NONINVT') {
						var compSubRecord = null;
						var compinvlinelength = -1;
						try {
							compSubRecord = objRecord.getSublistSubrecord({
								sublistId: 'receiveitems',
								fieldId: 'inventorydetail',
								line: lineNumber
							});
						} catch (e) {
							compSubRecord = null;
						}
						if (utility.isValueValid(compSubRecord)) {
							compinvlinelength = compSubRecord.getLineCount({
								sublistId: 'inventoryassignment'
							});
						}
						if (itemType == translator.getTranslationString("ITEMTYPE_SERIAL") ||
							itemType == translator.getTranslationString("ITEMTYPE_SERIAL_ASSEMBLY") ||
							itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
							itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
							if (itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
								itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
								inventoryStatusId = null;
							}

							serialSearchResults = this.getSerialsFromSerialEntryForISM(shipmentLineNo, poInternalId, shipmentInternalId, binInternalId, inventoryStatusId, "ISMPosting");

							log.debug('serialSearchResults', serialSearchResults);

							var serialOrLotQty = 1;
							if (itemType == translator.getTranslationString("ITEMTYPE_SERIAL") ||
								itemType == translator.getTranslationString("ITEMTYPE_SERIAL_ASSEMBLY")) {
								serialOrLotQty = 1;
							}
							if (serialSearchResults.length > 0) {
								log.debug('compinvlinelength', compinvlinelength);
								for (var serialLotArr = 0; serialLotArr < serialSearchResults.length; serialLotArr++) {
									var serialNoOrLotNumber = serialSearchResults[serialLotArr]['custrecord_wmsse_ser_no'];
									if (itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
										itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
										serialOrLotQty = serialSearchResults[serialLotArr]['custrecord_wmsse_ser_qty'];
										inventoryStatusId = serialSearchResults[serialLotArr]['custrecord_serial_inventorystatus'];

										var lotExpiryDate = '';
										if (utility.isValueValid(serialSearchResults[serialLotArr]['custrecord_wmsse_lot_expirydate'])) {
											lotExpiryDate = format.parse({
												value: serialSearchResults[serialLotArr]['custrecord_wmsse_lot_expirydate'],
												type: format.Type.DATE
											});
										}

									}
									compSubRecord.insertLine({
										sublistId: 'inventoryassignment',
										line: serialLotArr + compinvlinelength
									});
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'receiptinventorynumber',
										line: serialLotArr + compinvlinelength,
										value: serialNoOrLotNumber
									});
									if (utility.isValueValid(binInternalId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'binnumber',
											line: serialLotArr + compinvlinelength,
											value: binInternalId
										});
									}
									if (utility.isValueValid(lotExpiryDate)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'expirationdate',
											line: serialLotArr + compinvlinelength,
											value: lotExpiryDate
										});
									}
									if (utility.isValueValid(inventoryStatusId)) {
										compSubRecord.setSublistValue({
											sublistId: 'inventoryassignment',
											fieldId: 'inventorystatus',
											line: serialLotArr + compinvlinelength,
											value: inventoryStatusId
										});
									}
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: serialLotArr + compinvlinelength,
										value: serialOrLotQty
									});
								}
							}
						} else {
							if ((utility.isValueValid(binInternalId) || utility.isValueValid(inventoryStatusId)) &&
								utility.isValueValid(compSubRecord)) {

								if (parseInt(compinvlinelength) > 0 && !utility.isValueValid(binInternalId)) {
									for (var vItr = 0; vItr < compinvlinelength; vItr++) {
										compSubRecord.removeLine({
											sublistId: 'inventoryassignment',
											line: 0
										});
									}
									compinvlinelength = 0;
								}
								compSubRecord.insertLine({
									sublistId: 'inventoryassignment',
									line: compinvlinelength
								});
								if (utility.isValueValid(binInternalId)) {
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'binnumber',
										line: compinvlinelength,
										value: binInternalId
									});
								}
								if (utility.isValueValid(inventoryStatusId)) {
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'inventorystatus',
										line: compinvlinelength,
										value: inventoryStatusId
									});
								}
								if (utility.isValueValid(quantity)) {
									compSubRecord.setSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										line: compinvlinelength,
										value: quantity
									});
								}
							}
						}
					}
				} else {
					objRecord.setSublistValue({
						sublistId: 'receiveitems',
						fieldId: 'receiveitem',
						line: lineNumber,
						value: false
					});
				}
			}
			return serialSearchResults;
		}

		function getQtyDetailsFromOpenTask(shipmentInternalId, warehouseLocationId, shipmentLineNo) {
			var searchResForNonInvItems = search.load({
				id: 'customsearch_wms_post_shipment_dtls',
				name: 'Get Qty details for ISM shipment for Posting'
			});
			searchResForNonInvItems.filters.push(search.createFilter({
				name: 'custrecord_wmsse_inbshipment',
				operator: search.Operator.ANYOF,
				values: shipmentInternalId
			}));
			searchResForNonInvItems.filters.push(search.createFilter({
				name: 'custrecord_wmsse_wms_location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
			if (shipmentLineNo)
				searchResForNonInvItems.filters.push(search.createFilter({
					name: 'custrecord_wmsse_line_no',
					operator: search.Operator.IS,
					values: shipmentLineNo
				}));
			return utility.getSearchResultInJSON(searchResForNonInvItems);
		}

		function getOpenTaskShipmentDetails(shipmentInternalId, warehouseLocationId) {

			var shipmentDetailsSrch = search.load({
				id: 'customsearch_wms_ir_post_shipment_dtls',
				name: 'ISM shipment Details for Posting Item Receipt'
			});

			shipmentDetailsSrch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_wms_location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));

			shipmentDetailsSrch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_inbshipment',
				operator: search.Operator.ANYOF,
				values: shipmentInternalId
			}));

			return utility.getSearchResultInJSON(shipmentDetailsSrch);
		}

		function getTrasactionLinkDetails(linkIdArr) {

			var linksearch = search.load({
				id: 'customsearch_wms_transaction_link_dtl'
			});

			linksearch.filters.push(
				search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: linkIdArr
				}));

			var searchResults = utility.getSearchResultInJSON(linksearch);
			return searchResults;
		}

		function getTrasactionLinkDetailsforTO(linkIdArr, getItemInternalId) {
			log.debug('getItemInternalId', getItemInternalId);
			var linksearch = search.load({
				id: 'customsearch_wms_transactionto_link_dt'
			});

			linksearch.filters.push(
				search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: linkIdArr
				}));
			linksearch.filters.push(
				search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: getItemInternalId
				}));

			var searchResults = utility.getSearchResultInJSON(linksearch);
			return searchResults;
		}

		/**
		 *
		 * @returns {boolean}
		 */
		function isISMFeatureEnabled() {
			var vResult = false;
			try {
				var ISMStatusFeature = runtime.isFeatureInEffect({
					feature: 'inboundshipment'
				});

				if (ISMStatusFeature != null && ISMStatusFeature != '' && ISMStatusFeature != 'null' &&
					ISMStatusFeature != 'undefined' && ISMStatusFeature != false) {

					vResult = true;
				}
			} catch (e) {
				//The Inventory Status feature if not provisioned on your account then return false
				log.error({
					title: 'exception in ISMFeatureEnabled',
					details: e
				});
				vResult = false;
			}
			return vResult;
		}

		function _getFulFillmentId(orderInternalId, fetchedItemId, orderLineNo, lotno, itemType, invtStatus, inventoryStatusFeature) {
			var fulfillmentIdArray = [];
			var lineFullQty = 0;
			var useitemcostflag = '';
			var itemcostruleValue = _getItemCostRuleValue();

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
			if (TOLineDetails.length > 0) {
				log.debug('TOLineDetails', TOLineDetails);
				log.debug('TOLineDetails', TOLineDetails.length);
				var fullFillmentQuantity = 0;
				for (var d = 0; d < TOLineDetails.length; d++) {
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
											log.debug({
												title: 'fromStatusInternalId',
												details: fromStatusInternalId
											});
											log.debug({
												title: 'invtStatus',
												details: invtStatus
											});
											if (fromStatusInternalId == invtStatus) {
												if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
													fulfillmentIdArray.push(itemfulfillmentId);
												}
											}
										} else {
											if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
												fulfillmentIdArray.push(itemfulfillmentId);
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
												}

											}
										} else {
											if (fulfilledLotName == lotno) {

												if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
													fulfillmentIdArray.push(itemfulfillmentId);
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
												}
											}
										} else {
											if (fulfillmentIdArray.indexOf(itemfulfillmentId) == -1) {
												fulfillmentIdArray.push(itemfulfillmentId);
											}
										}
									}
								}
							}
						}
					}
				}

			}
			return fulfillmentIdArray;
		}

		function _getItemDetails(getItemInternalId, warehouseLocationId) {
			if (utility.isValueValid(getItemInternalId)) {
				var itemSearchDetails = search.load({
					id: 'customsearch_wms_item_dtls'
				});
				var filtersArr = itemSearchDetails.filters;
				filtersArr.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: getItemInternalId
					}));
				filtersArr.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));

				itemSearchDetails.filters = filtersArr;
				var itemSearchResult = utility.getSearchResultInJSON(itemSearchDetails);
				return itemSearchResult;
			}
		}

		function _getUseItemCostPreferenceValueAtOrderLevel(transactionInternalId) {

			var useItemCostFlag = "";
			var transferordervalues = search.load({
				id: 'customsearch_wmsse_useitemcostpreference'
			});
			var savedFilter = transferordervalues.filters;
			savedFilter.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.IS,
				values: transactionInternalId
			}));

			transferordervalues.filters = savedFilter;
			var transferOrderDetails = utility.getSearchResultInJSON(transferordervalues);
			if (transferOrderDetails.length > 0) {
				useItemCostFlag = transferOrderDetails[0]['istransferpricecosting'];
			}

			if (!(utility.isValueValid(useItemCostFlag)) && useItemCostFlag != false && useItemCostFlag != true) {
				useItemCostFlag = _getItemCostRuleValue();
			}

			return useItemCostFlag;
		}

		function createRecordInWMSSerialEntryCustomRecord(paramsSerialObj) {

			var serialName = paramsSerialObj.serialName;
			var transactionInternalId = paramsSerialObj.transactionInternalId;
			var transactionLineNo = paramsSerialObj.transactionLineNo;
			var itemInternalId = paramsSerialObj.itemInternalId;
			var quantity = paramsSerialObj.quantity;
			var serialStatus = paramsSerialObj.serialStatus;
			var taskType = paramsSerialObj.taskType;
			var inventoryStatus = paramsSerialObj.inventoryStatus;
			var shipmentId = paramsSerialObj.shipmentId

			var customrecord = record.create({
				type: 'customrecord_wmsse_serialentry'
			});
			customrecord.setValue({
				fieldId: 'name',
				value: serialName
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordno',
				value: transactionInternalId
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordline',
				value: transactionLineNo
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_item',
				value: itemInternalId
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_qty',
				value: quantity
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_no',
				value: serialName
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_status',
				value: serialStatus
			});
			customrecord.setValue({
				fieldId: 'custrecord_wmsse_ser_tasktype',
				value: taskType
			});
			if (utility.isValueValid(inventoryStatus)) {
				customrecord.setValue({
					fieldId: 'custrecord_serial_inventorystatus',
					value: inventoryStatus
				});
			}
			if (utility.isValueValid(shipmentId)) {
				customrecord.setValue({
					fieldId: 'custrecord_wmsse_inb_shipment',
					value: shipmentId
				});
			}
			var serialEntryRecordId = customrecord.save({
				enableSourcing: false,
				ignoreMandatoryFields: true
			});
			return serialEntryRecordId;
		}

		function _getItemABCVelocityDetails(getItemInternalId, warehouseLocationId) {
			if (utility.isValueValid(getItemInternalId)) {
				var itemABCVelocitySearchDetails = search.load({
					id: 'customsearch_wms_item_abcvelocitydtls'
				});
				var filtersArr = itemABCVelocitySearchDetails.filters;
				filtersArr.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: getItemInternalId
					}));
				filtersArr.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));

				itemABCVelocitySearchDetails.filters = filtersArr;
				return utility.getSearchResultInJSON(itemABCVelocitySearchDetails);
			} else {
				return null;
			}
		}

		function noCodeSolForISMReceiving(inputParamObj) {
			var orderInternalId = inputParamObj.poInternald;
			var shipmentId = inputParamObj.shipmentId;
			var openTaskIdArray = inputParamObj.openTaskIdarray;
			var poName = inputParamObj.poName;
			var whLocation = inputParamObj.warehouseLocationId;
			var shipmentReceiptId = inputParamObj.shipmentReceiptId;
			var _ignoreUpdate = inputParamObj._ignoreUpdate;
			var shipmentIdArray = [];
			var impactedRecords = {};
			var purchaseorderArray = [];
			var shipmentReceiptIdArray = [];

			if (utility.isValueValid(orderInternalId)) {
				purchaseorderArray.push(parseInt(orderInternalId));
			}
			if (utility.isValueValid(shipmentId)) {
				shipmentIdArray.push(parseInt(shipmentId));
			}
			if (utility.isValueValid(shipmentReceiptId)) {
				shipmentReceiptIdArray.push(parseInt(shipmentReceiptId));
			}
			if (utility.isValueValid(poName) && utility.isValueValid(whLocation) && utility.isValueValid(openTaskIdArray)) {
				var outputObj = getPrintLabelInfo(openTaskIdArray[0], poName, whLocation);
				impactedRecords['customrecord_wmsse_labelprinting'] = outputObj['labelrec'];
				impactedRecords['customrecord_wmsse_ext_labelprinting'] = outputObj['extlabelrec'];
			}
			impactedRecords['purchaseorder'] = purchaseorderArray;
			impactedRecords['inboundshipment'] = shipmentIdArray;
			impactedRecords['receiveinboundshipment'] = shipmentReceiptIdArray;
			impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskIdArray;
			impactedRecords['_ignoreUpdate'] = _ignoreUpdate;

			return impactedRecords;
		}

		function getPrintLabelInfo(openTaskId, poName, whLocation) {
			var impctRecReturn = {};
			// serach to get labels.
			var labelSearch = search.load({
				type: 'customrecord_wmsse_labelprinting',
				id: 'customsearch_wms_label_dtls'
			});
			labelSearch.filters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: poName
			}));

			labelSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_label_opentaskid',
				operator: search.Operator.IS,
				values: openTaskId
			}));
			labelSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_label_location',
				operator: search.Operator.IS,
				values: whLocation
			}));

			var result = utility.getSearchResultInJSON(labelSearch);
			var labelrecArr = [];

			if (utility.isValueValid(result) && result.length > 0) {
				for (var i = 0; i < result.length; i++) {
					labelrecArr.push(parseInt(result[i]['internalid']));
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
				values: poName
			}));

			extlabelSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_label_ext_opentaskid',
				operator: search.Operator.IS,
				values: openTaskId
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
			return impctRecReturn;
		}

		function getListObjectInternalId(listObjectName, listId) {
			var BinlocationSearch = search.create({
				type: listId,
				columns: [{
					name: 'name'
				}]
			});
			var BinlocationTypes = BinlocationSearch.run().getRange({
				start: 0,
				end: 1000
			});
			var listObjectId = '';
			if (BinlocationTypes != undefined && BinlocationTypes != null && BinlocationTypes != '' && BinlocationTypes.length > 0) {
				for (var b = 0; b < BinlocationTypes.length; b++) {
					var name = BinlocationTypes[b].getValue('name');
					if (name == listObjectName) {
						listObjectId = BinlocationTypes[b].id;
						break;
					}
				}
			}
			return listObjectId;
		}

		function getStageBinDetails(objItemDetails, processType, invstatus, inventoryStatusFeature, stageDir) {

			var preferedBinName = objItemDetails['preferedBinName'];
			var strLocation = objItemDetails['warehouseLocationId'];
			var preferedBinInternalId = objItemDetails['preferedBinInternalId'];
			var fromBinInternalId = objItemDetails['fromBinInternalId'];
			var selectedConvRate = objItemDetails['selectedConversionRate'];
			var currentConvRate = objItemDetails['stockConversionRate'];
			var selectedUOMText = objItemDetails['selectedUOMText'];
			var vBinLocArr = [];

			log.debug({
				title: 'fromBinInternalId1',
				details: fromBinInternalId
			});

			var objBinDetailsSearch = search.load({
				id: 'customsearch_stage_bindetails'
			});


			var filterStrat = objBinDetailsSearch.filters;
			var outStageDirectionId = '';
			var inStageDirectionId = '';
			var stageLocId = '';
			if (stageDir != null && stageDir != '' && stageDir != 'null' && stageDir != undefined && stageDir == 'Out') {
				filterStrat = [];
				outStageDirectionId = getListObjectInternalId('Out', 'customlist_wmsse_stg_direction');
				if (outStageDirectionId != '') {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_bin_stg_direction',
						operator: search.Operator.ANYOF,
						values: outStageDirectionId
					}));
				}
				stageLocId = getListObjectInternalId('Stage', 'customlist_wmsse_bin_loc_type');
				if (stageLocId != '') {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_bin_loc_type',
						operator: search.Operator.ANYOF,
						values: stageLocId
					}));
				}
			} else {
				inStageDirectionId = getListObjectInternalId('In', 'customlist_wmsse_stg_direction');
				if (inStageDirectionId != '') {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_bin_stg_direction',
						operator: search.Operator.ANYOF,
						values: inStageDirectionId
					}));
				}
			}
			if (utility.isValueValid(strLocation)) {
				filterStrat.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (utility.isValueValid(fromBinInternalId)) {
				filterStrat.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.NONEOF,
					values: fromBinInternalId
				}));

			}
			log.debug({
				title: 'outStageDirectionId',
				details: outStageDirectionId
			});
			log.debug({
				title: 'stageLocId',
				details: stageLocId
			});
			log.debug({
				title: 'inStageDirectionId',
				details: inStageDirectionId
			});

			objBinDetailsSearch.filters = filterStrat;
			var objBinDetails = utility.getSearchResultInJSON(objBinDetailsSearch);
			var vValidBinIdArr = [];
			var vValidBinIdTxtArr = [];
			var binIdArr = [];
			if (objBinDetails.length > 0) {
				for (var j = 0; j < objBinDetails.length; j++) {
					var objBinDetailsRec = objBinDetails[j];
					var vValidBinId = objBinDetailsRec['internalid'];
					var vValidBinText = objBinDetailsRec['binnumber'];
					vValidBinIdArr.push(vValidBinId);
					vValidBinIdTxtArr.push(vValidBinText);
				}
				log.debug({
					title: 'vValidBinIdArr',
					details: vValidBinIdArr
				});
				var objBinStatusDetails = search.load({
					id: 'customsearch_wmsse_stagebin_statusdetail',
					type: search.Type.INVENTORY_BALANCE,
				});
				var filterStrat = objBinStatusDetails.filters;
				if (stageDir != null && stageDir != '' && stageDir != 'null' && stageDir != undefined && stageDir == 'Out') {
					filterStrat = [];
					if (stageLocId != '') {
						filterStrat.push(search.createFilter({
							name: 'custrecord_wmsse_bin_loc_type',
							join: 'binnumber',
							operator: search.Operator.ANYOF,
							values: stageLocId
						}));
					}
					if (outStageDirectionId != '') {
						filterStrat.push(search.createFilter({
							name: 'custrecord_wmsse_bin_stg_direction',
							join: 'binnumber',
							operator: search.Operator.ANYOF,
							values: outStageDirectionId
						}));
					}

				}

				if (utility.isValueValid(strLocation)) {
					filterStrat.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: strLocation
					}));
				}
				if (vValidBinIdArr.length > 0) {
					filterStrat.push(search.createFilter({
						name: 'binnumber',
						operator: search.Operator.ANYOF,
						values: vValidBinIdArr
					}));
				}


				if (utility.isValueValid(invstatus)) {

					if (invstatus != 'All') {
						filterStrat.push(search.createFilter({
							name: 'status',
							operator: search.Operator.ANYOF,
							values: invstatus
						}));
					}

				}
				objBinStatusDetails.filters = filterStrat;
				var objBinStatusResults = utility.getSearchResultInJSON(objBinStatusDetails);
				if (objBinStatusResults.length > 0) {
					for (var stsItr in objBinStatusResults) {
						var binStatusDetailsRec = objBinStatusResults[stsItr];
						var statusName = binStatusDetailsRec['statusText'];
						var binQty = binStatusDetailsRec['onhand'];
						var statusInternalId = binStatusDetailsRec['status'];
						var binInternalId = binStatusDetailsRec['binnumber'];
						if (fromBinInternalId != binInternalId) {
							var binQtyAvailWithUOM = binQty;
							if (utility.isValueValid(selectedUOMText)) {
								binQtyAvailWithUOM = binQty + " " + selectedUOMText;
							}
							if (utility.isValueValid(binQty) && utility.isValueValid(selectedConvRate) && utility.isValueValid(currentConvRate) &&
								(selectedConvRate != currentConvRate)) {
								binQty = utility.uomConversions(binQty, selectedConvRate, currentConvRate);
								if (binQty > 0) {
									binQtyAvailWithUOM = binQty + " " + selectedUOMText;
								}
							}
							var binName = binStatusDetailsRec['binnumberText'];

							binIdArr.push(binInternalId);
							var currRow = {
								'binName': binName,
								'binInternald': binInternalId,
								'quantity': binQty,
								'quantityWithUOM': binQtyAvailWithUOM,
								'statusName': statusName,
								'statusInternalId': statusInternalId
							};
							vBinLocArr.push(currRow);
						}
					}

				}

				for (var vPutBin = 0; vPutBin < vValidBinIdArr.length; vPutBin++) {
					var blnEmpty = true;
					for (var vInvBal = 0; vInvBal < binIdArr.length; vInvBal++) {
						if (binIdArr[vInvBal] == vValidBinIdArr[vPutBin]) {
							blnEmpty = false;
						}
					}
					if (blnEmpty == true) {

						var currentRowValues = {
							'binName': vValidBinIdTxtArr[vPutBin],
							'binInternald': vValidBinIdArr[vPutBin],
							'quantity': '0',
							'quantityWithUOM': '0'
						};
						vBinLocArr.push(currentRowValues);

					}
				}

			}
			return vBinLocArr;
		}

		function _callSchedulerToReceiveISM(shipmentId, warehouseLocationId, binInternalId, receiveAllStatusId) {
			log.debug({
				title: 'Map Reduce - shipmentId :',
				details: shipmentId
			});
			var schstatus = task.create({
				taskType: task.TaskType.MAP_REDUCE
			});
			schstatus.scriptId = 'customscript_wms_mr_ism_receiveall';
			schstatus.deploymentId = 'customdeploy_wms_mr_ism_receiveall';
			schstatus.params = {
				"custscript_wms_mr_ism_shipmentid": shipmentId,
				"custscript_wms_mr_ism_location": warehouseLocationId,
				"custscript_wms_mr_ism_bininternalid": binInternalId,
				"custscript_wms_mr_ism_invstatusid": receiveAllStatusId
			};

			schstatus.submit();
			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS Inb Shipment ReceiveAll Map Reduce', currentUserId, 'Submitted',
				shipmentId, warehouseLocationId);
		}

		function checkShipmentsforExtNum(shipmentListDetails, whLocation) {
			var vCount = 0;

			if (utility.isValueValid(shipmentListDetails) && shipmentListDetails.length > 0) {
				var shipmentLineReceivedQty = 0;
				var shipmentLineRemainingQty = 0;
				var shipmentLineExpQuantity = 0;
				var tempTotalRecQty = 0;
				var shipmentArray = [];
				var openPutAwayDetails = '';
				var receivedOpentaskDetails = '';

				for (var i in shipmentListDetails) {
					var shipmentObj = shipmentListDetails[i];
					var shipmentId = shipmentObj['id'];

					if (shipmentArray.indexOf(shipmentObj['id']) == -1) {
						openPutAwayDetails = getInbShipmentOpenTaskDetails(shipmentObj.id, '', whLocation);
						receivedOpentaskDetails = getInbShipmentReceivedOpenTaskDetails(shipmentObj.id, whLocation);
						shipmentArray.push(shipmentObj.id);
					}

					log.debug({
						title: 'openPutAwayDetails',
						details: openPutAwayDetails
					});
					log.debug({
						title: 'receivedOpentaskDetails',
						details: receivedOpentaskDetails
					});

					if (utility.isValueValid(shipmentObj['quantityexpected'])) {

						shipmentLineExpQuantity = parseFloat(shipmentObj['quantityexpected']);

					}
					shipmentObj['quantityexpected'] = shipmentLineExpQuantity;
					shipmentObj['quantityreceived'] = 0;

					if (JSON.stringify(receivedOpentaskDetails) != '{}') {
						var lineItemReceivedOpentaskQty = receivedOpentaskDetails[shipmentObj['inboundshipmentitemid']];
						log.debug({
							title: 'lineItemReceivedOpentaskQty :',
							details: lineItemReceivedOpentaskQty
						});

						if (utility.isValueValid(lineItemReceivedOpentaskQty)) {
							shipmentLineReceivedQty = lineItemReceivedOpentaskQty;
							shipmentObj['quantityreceived'] = shipmentLineReceivedQty;
							shipmentObj['quantityremaining'] = Number(Big(parseFloat(shipmentLineExpQuantity)).minus(shipmentLineReceivedQty));
						}

					}
					if (!utility.isValueValid(shipmentObj['quantityremaining'])) {
						shipmentLineRemainingQty = 0;
					} else {
						shipmentLineRemainingQty = parseFloat(shipmentObj['quantityremaining']);
					}

					shipmentObj['quantityremaining'] = shipmentLineRemainingQty;
					log.debug('shipmentLineReceivedQty :', shipmentLineReceivedQty);
					log.debug('shipmentLineRemainingQty :', shipmentLineRemainingQty);
					log.debug('shipmentLineExpQuantity :', shipmentLineExpQuantity);

					if (JSON.stringify(openPutAwayDetails) !== '{}') {
						var lineItemOpentaskRcvQty = openPutAwayDetails[shipmentObj['inboundshipmentitemid']];
						log.debug('open task quantity :', lineItemOpentaskRcvQty);

						if (utility.isValueValid(lineItemOpentaskRcvQty)) {
							tempTotalRecQty = Number(Big(parseFloat(shipmentLineReceivedQty)).plus(lineItemOpentaskRcvQty));
							shipmentObj['totalReceivedQty'] = tempTotalRecQty;
							shipmentObj['quantityremaining'] = Number(Big(parseFloat(shipmentLineExpQuantity)).minus(tempTotalRecQty));
						}
					}

					var orderRemainQty = 0;
					orderRemainQty = shipmentObj['quantityremaining'];
					log.debug('orderRemainQty  :', orderRemainQty);

					if (parseFloat(orderRemainQty) > 0) {
						vCount = parseInt(vCount) + 1;
						if (parseInt(vCount) > 1) {
							break;
						}
					}
				}
			}
			log.debug({
				title: 'vCount :',
				details: vCount
			});
			return vCount;
		}

		function getStageBinItemsCount(stageBinInternalId, whLocationInternalID) {
			var results = utility.getInventoryDetailsFromBins(stageBinInternalId, whLocationInternalID);
			return results.length;
		}

		function getOpenTaskID(itemId, cartBinId, whId, recomendedBinId) {

			var filters = [];
			var opentaskIdSearch = search.load({
				id: 'customsearch_wms_opentaskcartitemdtls'
			});
			filters = opentaskIdSearch.filters;
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

			opentaskIdSearch.filters = filters;
			return utility.getSearchResultInJSON(opentaskIdSearch);

		}

		function getItemDetails(itemInternalId) {

			var columnArray = [];
			columnArray.push('usebins');
			columnArray.push('unitstype');
			columnArray.push('stockunit');
			columnArray.push('recordtype');

			return utility.getItemFieldsByLookup(itemInternalId, columnArray);

		}

		function updateNSrefno(openTaskID, binTransferRec, actualQty) {

			log.debug({
				title: 'openTaskID',
				details: openTaskID
			});
			log.debug({
				title: 'binTransferRec',
				details: binTransferRec
			});
			var openTaskRec = record.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: openTaskID
			});
			if (utility.isValueValid(actualQty)) {

				var expectedQty = openTaskRec.getValue({
					fieldId: 'custrecord_wmsse_act_qty'
				});
				var remainingQty = parseFloat(expectedQty) - parseFloat(actualQty);
				if (parseFloat(remainingQty) > 0) {
					var objRecord = record.copy({
						type: 'customrecord_wmsse_trn_opentask',
						id: openTaskID
					});
					objRecord.setValue({
						fieldId: 'name',
						value: openTaskRec.getValue({
							fieldId: 'name'
						})
					});
					objRecord.setValue({
						fieldId: 'custrecord_wmsse_act_qty',
						value: remainingQty
					});
					objRecord.setValue({
						fieldId: 'custrecord_wmsse_expe_qty',
						value: remainingQty
					});
					objRecord.setValue({
						fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
						value: ''
					});
					openTaskRec.setValue({
						fieldId: 'custrecord_wmsse_act_qty',
						value: actualQty
					});
					objRecord.save();
				}
			}

			log.debug('binTransferRec.inventoryCountId :::', binTransferRec.inventoryCountId);

			openTaskRec.setValue({
				fieldId: 'custrecord_wmsse_nstrn_ref_no',
				value: binTransferRec.inventoryCountId
			});
			openTaskRec.save();
			log.debug({
				title: 'openTaskRec',
				details: openTaskRec
			});
		}

		function getRecommendedBinForCartMoves(itemInputObj) {

			var itemResults = _getItemDetails(itemInputObj.itemId, itemInputObj.whLocation);
			var itemResultsLength = itemResults.length;
			var preferedBinInternalId = null;
			var objPutBinQueryDetails = {};
			var recBinDtlsObj = {};

			if (itemResultsLength > 0) {
				var isPreferedBin = false;
				var itemPreferedBinLocationId = null;
				var count = 0;

				for (count = 0; count < itemResultsLength; count++) {
					var itemResultsRec = itemResults[count];
					itemPreferedBinLocationId = itemResultsRec.location;
					isPreferedBin = itemResultsRec.preferredbin;

					if (count == 0) {
						objPutBinQueryDetails.itemGroup = itemResultsRec.custitem_wmsse_itemgroup;
						objPutBinQueryDetails.itemFamily = itemResultsRec.custitem_wmsse_itemfamily;
						objPutBinQueryDetails.blnMixItem = itemResultsRec.custitem_wmsse_mix_item;
						objPutBinQueryDetails.blnMixLot = itemResultsRec.custitem_wmsse_mix_lot;
						var departments = runtime.isFeatureInEffect({
							feature: 'departments'
						});
						var classes = runtime.isFeatureInEffect({
							feature: 'classes'
						});
						if (departments) {
							objPutBinQueryDetails.department = itemResultsRec.department;
						}
						if (classes) {
							objPutBinQueryDetails['class'] = itemResultsRec.class;
						}
					}
					if (isPreferedBin == true && (itemPreferedBinLocationId == itemInputObj.whLocation)) {
						var preferedBinName = itemResults[count].binnumber;
						preferedBinInternalId = getValidBinInternalId(preferedBinName, itemInputObj.whLocation, null);
						break;
					}

				}
			}

			if (utility.isValueValid(preferedBinInternalId)) {
				recBinDtlsObj.recomendedBinId = preferedBinInternalId;
			} else {
				objPutBinQueryDetails.itemInternalId = itemInputObj.itemId;
				objPutBinQueryDetails.warehouseLocationId = itemInputObj.whLocation;
				objPutBinQueryDetails.itemType = itemInputObj.itemType;
				objPutBinQueryDetails.lotName = itemInputObj.lotName;
				objPutBinQueryDetails.fromBinInternalId = itemInputObj.fromBinInternalId;
				objPutBinQueryDetails.fromStatusId = itemInputObj.fromStatusId;
				objPutBinQueryDetails.recomendedBinForPutaway = "T";
				var abcVelocityResult = _getItemABCVelocityDetails(itemInputObj.itemId, itemInputObj.whLocation);
				if (abcVelocityResult.length > 0) {
					for (var itemItr = 0; itemItr < abcVelocityResult.length; itemItr++) {
						var itemRec = abcVelocityResult[itemItr];
						if (itemRec.inventorylocation == itemInputObj.whLocation) {
							objPutBinQueryDetails.locationinvtclassification = itemRec.locationinvtclassification;
							break;
						}
					}
				}
				var binDetails = getRecomendedBinFromPutStratagie(objPutBinQueryDetails);
				if (binDetails != '{}') {

					recBinDtlsObj.puStratagieId = binDetails.putStratagie;
					recBinDtlsObj.recomendedBinId = binDetails.binId;
				}
			}

			if (utility.isValueValid(recBinDtlsObj.recomendedBinId)) {
				var fields = ['custrecord_wmsse_putseq_no', 'binnumber'];
				var binRec = search.lookupFields({
					type: 'Bin',
					id: recBinDtlsObj.recomendedBinId,
					columns: fields
				});

				if (binRec != undefined) {
					recBinDtlsObj.recomendedBinSequenceNo = binRec.custrecord_wmsse_putseq_no;
					recBinDtlsObj.recomendedBinName = binRec.binnumber;
				}
			}

			return recBinDtlsObj;
		}

		function getRecomendedBinFromPutStratagie(objPutBinQueryDetails) {
			var results = utility.getPutBinAndIntDetails(objPutBinQueryDetails);
			var binObject = {};
			if (results.length > 0) {
				var bin = 0;
				for (bin = 0; bin < 1; bin++) {
					binObject.binId = results[bin].binInternalId;
					binObject.binName = results[bin].binName;
					binObject.putStratagie = results[bin].puStratagie;
				}
			}
			log.debug({
				title: 'results',
				details: results
			});
			return binObject;
		}

		function _getSerialsFromSerialEntry(shipmentLineNo, shipmentNumber, purchaseorderInternalId) {
			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});
			var serailFilters = serialSearch.filters;

			if (utility.isValueValid(shipmentLineNo)) {
				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordline',
					operator: search.Operator.EQUALTO,
					values: shipmentLineNo
				}));
			}
			if (utility.isValueValid(shipmentNumber)) {
				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_inb_shipment',
					operator: search.Operator.ANYOF,
					values: shipmentNumber
				}));
			}
			if (utility.isValueValid(purchaseorderInternalId)) {
				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordno',
					operator: search.Operator.ANYOF,
					values: purchaseorderInternalId
				}));
			}
			serialSearch.filters = serailFilters;
			return utility.getSearchResultInJSON(serialSearch);
		}

		function _closeSerialInSerialEntry(serialEntryID, serial) {
			var serialRec = record.load({
				type: 'customrecord_wmsse_serialentry',
				id: serialEntryID
			});
			serialRec.setValue({
				fieldId: 'id',
				value: serialEntryID
			});
			serialRec.setValue({
				fieldId: 'name',
				value: serial
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

		function _updateSerialEntryWithOpenTaskId(poLineno, poInternalId, openTaskId, binInternalId, statusId) {
			log.debug('openTaskId', openTaskId);
			var serialSearchResults = _getSerialsFromSerialEntryForInboundProcesses(poLineno, poInternalId);
			var serialSearchResultsLength = serialSearchResults.length;

			if (serialSearchResultsLength > 0) {

				var columnsObject = new Object();
				columnsObject.custrecord_wmsse_ser_bin = binInternalId;
				columnsObject.custrecord_wms_opentaskno = openTaskId;
				if (utility.isValueValid(statusId)) {
					columnsObject.custrecord_serial_inventorystatus = statusId;
				}
				for (var serialRec = 0; serialRec < serialSearchResultsLength; serialRec++) {
					log.debug('serialSearchResults[serialRec].id', serialSearchResults[serialRec].id);
					utility.submitRecord('customrecord_wmsse_serialentry', serialSearchResults[serialRec].id, columnsObject);
				}
			}

		}

		function _getSerialsFromSerialEntryForInboundProcesses(poLineno, poInternalId, serialNo) {
			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});

			var serailFilters = serialSearch.filters;
			var serialSearchResults = [];
			if (utility.isValueValid(poLineno) && utility.isValueValid(poInternalId)) {

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
				serailFilters.push(search.createFilter({
					name: 'custrecord_wms_opentaskno',
					operator: search.Operator.ISEMPTY
				}));
				if (utility.isValueValid(serialNo)) {
					serailFilters.push(search.createFilter({
						name: 'custrecord_wmsse_ser_no',
						operator: search.Operator.IS,
						values: serialNo
					}));
				}
				serialSearch.filters = serailFilters;
				serialSearchResults = utility.getSearchResultInJSON(serialSearch);
			}

			return serialSearchResults;
		}

		function getKitComponentsforRMA(orderNumber, itemInternalId) {
			var matrixItemsFeature = runtime.isFeatureInEffect({
				feature: 'matrixitems'
			});
			var myTransactionQuery = query.create({
				type: query.Type.TRANSACTION
			});

			var myTransactionQueryline = myTransactionQuery.join({
				fieldId: 'transactionlines'

			});
			var condKitMemberof = myTransactionQueryline.createCondition({
				fieldId: 'kitmemberof',
				operator: query.Operator.EMPTY_NOT
			});
			var condKitcomponent = myTransactionQueryline.createCondition({
				fieldId: 'kitcomponent',
				operator: query.Operator.IS,
				values: true
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
			var condNotEmptyQunatity = myTransactionQueryline.createCondition({
				fieldId: 'quantity',
				operator: query.Operator.GREATER,
				values: 0
			});
			var condfulfillable = myTransactionQueryline.createCondition({
				fieldId: 'item^item.isfulfillable',
				operator: query.Operator.IS,
				values: true
			});
			var condOrdId = myTransactionQuery.createCondition({
				fieldId: 'tranid',
				operator: query.Operator.IS,
				values: orderNumber
			});
			if (utility.isValueValid(itemInternalId)) {
				var condItemId = myTransactionQueryline.createCondition({
					fieldId: 'item',
					operator: query.Operator.ANY_OF,
					values: itemInternalId
				});
				myTransactionQuery.condition = myTransactionQuery.and(
					condKitMemberof, condKitcomponent, condNottaxline, condNotMainline, condNotClosed, condNotEmptyQunatity, condfulfillable,
					condOrdId, condItemId);
			} else {
				myTransactionQuery.condition = myTransactionQuery.and(
					condKitMemberof, condKitcomponent, condNottaxline, condNotMainline, condNotClosed, condNotEmptyQunatity, condfulfillable,
					condOrdId);
			}

			myTransactionQuery.columns = [

				myTransactionQuery.createColumn({
					fieldId: 'id'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.itemid',
					label: 'itemname'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'kitmemberof'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.usebins',
					label: 'kitcomponentsusebins'

				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.description',
					label: 'kitcomponentdesc'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.upccode',
					label: 'kitcomponentupccode'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item^item.unitstype',
					label: 'kitcomponentunitstype'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'id',
					label: 'lineId'
				}),
			];
			if (matrixItemsFeature) {
				myTransactionQuery.columns.push(
					myTransactionQueryline.createColumn({
						fieldId: 'item^item.matrixtype',
						label: 'matrixtype'
					})
				)
			}

			var myPagedData = myTransactionQuery.runPaged({
				pageSize: 1000
			});

			return getQueryResults(myPagedData);
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

		function mergeKitComponentsDetails(transactionLineDetailsResult, kitComponentsDetails) {

			var kitComponentsDtlObj = {};
			var itemLineDtlObj = {};
			for (var componentsLength = 0; componentsLength < kitComponentsDetails.length; componentsLength++) {
				getItemNameForMatrix(kitComponentsDetails, componentsLength);
				if (utility.isValueValid(kitComponentsDtlObj[kitComponentsDetails[componentsLength].kitmemberof])) {
					itemLineDtlObj = kitComponentsDtlObj[kitComponentsDetails[componentsLength].kitmemberof];
					if (!(utility.isValueValid(itemLineDtlObj[kitComponentsDetails[componentsLength].itemname]))) {
						itemLineDtlObj[kitComponentsDetails[componentsLength].itemname] = {
							'itemInternalId': kitComponentsDetails[componentsLength].item,
							'kitcomponentsusebins': kitComponentsDetails[componentsLength].kitcomponentsusebins,
							'kitcomponentdesc': kitComponentsDetails[componentsLength].kitcomponentdesc,
							'kitcomponentupccode': kitComponentsDetails[componentsLength].kitcomponentupccode,
							'kitcomponentunitstype': kitComponentsDetails[componentsLength].kitcomponentunitstype,
							'lineId': kitComponentsDetails[componentsLength].lineId
						};
					}
				} else {
					itemLineDtlObj = {};
					itemLineDtlObj[kitComponentsDetails[componentsLength].itemname] = {
						'itemInternalId': kitComponentsDetails[componentsLength].item,
						'kitcomponentsusebins': kitComponentsDetails[componentsLength].kitcomponentsusebins,
						'kitcomponentdesc': kitComponentsDetails[componentsLength].kitcomponentdesc,
						'kitcomponentupccode': kitComponentsDetails[componentsLength].kitcomponentupccode,
						'kitcomponentunitstype': kitComponentsDetails[componentsLength].kitcomponentunitstype,
						'lineId': kitComponentsDetails[componentsLength].lineId
					};
					kitComponentsDtlObj[kitComponentsDetails[componentsLength].kitmemberof] = itemLineDtlObj;
				}
			}

			for (var resultsLength = 0; resultsLength < transactionLineDetailsResult.length; resultsLength++) {
				var itemLineResult = transactionLineDetailsResult[resultsLength];

				if (itemLineResult.itemtype == 'Kit' && utility.isValueValid(kitComponentsDtlObj[itemLineResult.line]) &&
					utility.isValueValid(kitComponentsDtlObj[itemLineResult.line][itemLineResult.memberitem])) {
					var kitComponentDataObj = kitComponentsDtlObj[itemLineResult.line][itemLineResult.memberitem];
					itemLineResult.parentItem = itemLineResult.item;
					itemLineResult.parentItemLine = itemLineResult.line;
					itemLineResult.line = kitComponentDataObj.lineId;
					itemLineResult.item = kitComponentDataObj.itemInternalId;
					itemLineResult.itemText = itemLineResult.memberitem;
					itemLineResult.usebins = kitComponentDataObj.kitcomponentsusebins;
					itemLineResult.unitText = (utility.isValueValid(itemLineResult.memberunit) && itemLineResult.memberunit !== '- None -') ? itemLineResult.memberunit : '';
					itemLineResult.totalReceivedQty = itemLineResult.MemberReceivedQty;
					itemLineResult.rmaRemainingQty = itemLineResult.MemberRemainingQty;
					itemLineResult.salesdescription = kitComponentDataObj.kitcomponentdesc;
					itemLineResult.upccode = kitComponentDataObj.kitcomponentupccode;
					itemLineResult.unitstype = kitComponentDataObj.kitcomponentunitstype;
				}
			}
			return transactionLineDetailsResult;
		}

		function getItemNameForMatrix(kitComponentsDetails, componentsLength) {
			try {

				if (utility.isValueValid(kitComponentsDetails[componentsLength].matrixtype) &&
					kitComponentsDetails[componentsLength].matrixtype == "CHILD") {

					if (utility.isValueValid(kitComponentsDetails[componentsLength].item)) {
						var itemLookUp = search.lookupFields({
							type: search.Type.ITEM,
							id: kitComponentsDetails[componentsLength].item,
							columns: ['name']
						});
						if (utility.isValueValid(itemLookUp.name)) {
							kitComponentsDetails[componentsLength].itemname = itemLookUp.name;
						}
					}
				}
				log.debug('kitComponentsDetails[componentsLength].itemname', kitComponentsDetails[componentsLength].itemname);
			} catch (e) {
				log.error('Exeception in getItemNameForMatrix', e);
			}
		}

		function _createOrUpdateOpentask(openTaskId, quantity, objOpentaskDetails, warehouseLocationId, lotName) {
			if (utility.isValueValid(openTaskId)) {
				updateOpentaskFields(openTaskId, quantity, '', lotName);
			} else {
				openTaskId = updateOpenTask(objOpentaskDetails);
			}
			return openTaskId;
		}

		function updateOpentaskFields(openTaskId, quantity, serialNo, lotName) {
			var openTaskRecord = record.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: openTaskId
			});
			if (utility.isValueValid(quantity)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_act_qty',
					value: quantity
				});
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_expe_qty',
					value: quantity
				});
			}
			if (utility.isValueValid(serialNo)) {
				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_serial_no',
					value: serialNo.toString()
				});
			}
			if (utility.isValueValid(lotName)) {

				openTaskRecord.setValue({
					fieldId: 'custrecord_wmsse_batch_num',
					value: lotName
				});
			}

			openTaskRecord.save();
		}

		function _validateScannedItemForTallyScan(itemId) {
			var itemDtlsObj = {};
			var columnlookupArray = [];
			columnlookupArray.push('recordtype');
			columnlookupArray.push('usebins');
			columnlookupArray.push('stockunit');
			columnlookupArray.push('unitstype');
			columnlookupArray.push('itemid');
			columnlookupArray.push('isinactive');
			columnlookupArray.push('internalid');
			columnlookupArray.push('custitem_wms_usetallyscan');
			var itemLookUp = utility.getItemFieldsByLookup(itemId, columnlookupArray);
			if (itemLookUp != undefined && itemLookUp != null && itemLookUp != "") {


				if (itemLookUp.custitem_wms_usetallyscan == undefined ||
					itemLookUp.custitem_wms_usetallyscan == null ||
					itemLookUp.custitem_wms_usetallyscan == false) {
					itemDtlsObj.errorMessage = 'Tallyscan not enabled for this item';
					itemDtlsObj.isValid = false;
				} else {

					itemDtlsObj.itemType = itemLookUp.recordtype;
					itemDtlsObj.itemInternalId = itemLookUp.internalid[0].value;
					itemDtlsObj.unitsType = itemLookUp.unitstype;
				}
			}
			return itemDtlsObj;
		}



		return {
			getOpenTaskID: getOpenTaskID,
			getItemDetails: getItemDetails,
			updateNSrefno: updateNSrefno,
			getStageBinItemsCount: getStageBinItemsCount,
			getDefaultInventoryStatusList: getDefaultInventoryStatusList,
			getValidBinInternalId: getValidBinInternalId,
			getBinwiseQtyDetails: getBinwiseQtyDetails,
			getAllOpentaskOpenPutwayOrderDetails: getAllOpentaskOpenPutwayOrderDetails,
			getPoOverage: _getPoOverage,
			getItemCostRuleValue: _getItemCostRuleValue,
			getRecevingOrderItemDetails: _getRecevingOrderItemDetails,
			getItemSearchDetails: _getItemSearchDetails,
			getOpentaskOpenPutwayDetails: _getOpentaskOpenPutwayDetails,
			getOpentaskOpenPutwayDetailsPO: _getOpentaskOpenPutwayDetailsPO,
			getTOfulfilledLotDetails: _getTOfulfilledLotDetails,
			getInboundStageBinDetails: _getInboundStageBinDetails,
			getInventoryDetailsforItem: _getInventoryDetailsforItem,
			getOrderStatus: _getOrderStatus,
			getOpenPutawayTasksforIRPosting: _getOpenPutawayTasksforIRPosting,
			getOTResultsforIRPosting: getOTResultsforIRPosting,
			getTransferOrderItemReceiptDetails: _getTransferOrderItemReceiptDetails,
			getTransferOrderOpenTaskDetails: _getTransferOrderOpenTaskDetails,
			getItemList: getItemList,
			getBackOrderQty: getBackOrderQty,
			updateOpenTask: updateOpenTask,
			getopentaskresultsforIRPosting: getopentaskresultsforIRPosting,
			noCodeSolForReceiving: noCodeSolForReceiving,
			deletebarcodestring: deletebarcodestring,
			checkCountforRemaining: checkCountforRemaining,
			getItemShipmentList: getItemShipmentList,
			getItemShipments: getItemShipments,
			getShipmentList: getShipmentList,
			getShipmentValidate: getShipmentValidate,
			getInbShipmentOpenTaskDetails: getInbShipmentOpenTaskDetails,
			validateItemAgainstShipment: validateItemAgainstShipment,
			getReceiveAllOptionValue: _getReceiveAllOptionValue,
			receiveISM: receiveISM,
			iSM_receiveAll: _iSM_receiveAll,
			buildOpenTaskParametes: buildOpenTaskParametes,
			createLotISMInfoInSerialEntry: _createLotISMInfoInSerialEntry,
			getOpenTaskSerials: _getOpenTaskSerials,
			setLineDetailsForShipmentRecord: setLineDetailsForShipmentRecord,
			closeSerialEntryRecordsForTransaction: closeSerialEntryRecordsForTransaction,
			validateShipmentWithInvtDetailsForReceiveAll: _validateShipmentWithInvtDetailsForReceiveAll,
			getSerialsFromSerialEntryForISM: getSerialsFromSerialEntryForISM,
			postItemReceiptISM: postItemReceiptISM,
			setLineDetailsForShipmentRecordIRPosting: setLineDetailsForShipmentRecordIRPosting,
			getQtyDetailsFromOpenTask: getQtyDetailsFromOpenTask,
			getOpenTaskShipmentDetails: getOpenTaskShipmentDetails,
			getTrasactionLinkDetails: getTrasactionLinkDetails,
			isISMFeatureEnabled: isISMFeatureEnabled,
			ismReceivedquantity: ismReceivedquantity,
			ismTotalquantity: ismTotalquantity,
			getFulFillmentId: _getFulFillmentId,
			createRecordInWMSSerialEntryCustomRecord: createRecordInWMSSerialEntryCustomRecord,
			getItemDetails: _getItemDetails,
			getItemABCVelocityDetails: _getItemABCVelocityDetails,
			noCodeSolForISMReceiving: noCodeSolForISMReceiving,
			getStageBinDetails: getStageBinDetails,
			callSchedulerToReceiveISM: _callSchedulerToReceiveISM,
			getInbShipmentReceivedOpenTaskDetails: getInbShipmentReceivedOpenTaskDetails,
			checkIslinePartiallyReceivedInISM: _checkIslinePartiallyReceivedInISM,
			checkShipmentsforExtNum: checkShipmentsforExtNum,
			getListObjectInternalId: getListObjectInternalId,
			getRecommendedBinForCartMoves: getRecommendedBinForCartMoves,
			getUseItemCostPreferenceValueAtOrderLevel: _getUseItemCostPreferenceValueAtOrderLevel,
			getRecomendedBinFromPutStratagie: getRecomendedBinFromPutStratagie,
			getSerialsFromSerialEntry: _getSerialsFromSerialEntry,
			closeSerialInSerialEntry: _closeSerialInSerialEntry,
			updateSerialEntryWithOpenTaskId: _updateSerialEntryWithOpenTaskId,
			getSerialsFromSerialEntryForInboundProcesses: _getSerialsFromSerialEntryForInboundProcesses,

			getTrasactionLinkDetailsforTO: getTrasactionLinkDetailsforTO,
			mergeKitComponentsDetails: mergeKitComponentsDetails,
			createOrUpdateOpentask: _createOrUpdateOpentask,
			updateOpentaskFields: updateOpentaskFields,
			validateScannedItemForTallyScan: _validateScannedItemForTallyScan
		}
	});