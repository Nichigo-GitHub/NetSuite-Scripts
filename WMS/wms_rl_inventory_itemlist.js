/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './big', './wms_translator'],

	function (search, utility, big, translator) {
		function getItemList(requestBody) {
			var itemList = {};
			var debugString = '';
			var requestParams = '';
			try {
				log.debug({
					title: 'requestBody',
					details: requestBody
				});
				if (utility.isValueValid(requestBody)) {
					requestParams = requestBody.params;
					var warehouseLocationId = requestParams.warehouseLocationId;
					var binInternalId = requestParams.binInternalId;
					log.debug({
						title: 'requestParams1',
						details: requestParams
					});
					if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(binInternalId)) {
						var objBinDetails = [];
						var searchRec = search.load({
							id: 'customsearch_wmsse_invtbalance_serialsrh',
							type: search.Type.INVENTORY_BALANCE
						});

						var savedFilter = searchRec.filters;
						savedFilter.push(search.createFilter({
							name: 'location',
							operator: search.Operator.ANYOF,
							values: warehouseLocationId
						}));
						savedFilter.push(search.createFilter({
							name: 'binnumber',
							operator: search.Operator.ANYOF,
							values: binInternalId
						}));
						searchRec.filters = savedFilter;
						objBinDetails = utility.getSearchResultInJSON(searchRec);

						log.debug({
							title: 'objBinDetails length',
							details: objBinDetails.length
						});
						if (objBinDetails.length == 0) {
							itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
							itemList['isValid'] = false;
						} else {
							var totalBinAvailQty = 0;
							var objBinDetailsRec = {};
							var itemsList = [];
							var statusName = "";
							var uomText = '';

							for (var binDetail in objBinDetails) {

								objBinDetailsRec = objBinDetails[binDetail];
								totalBinAvailQty = objBinDetailsRec['available'];
								statusName = objBinDetailsRec['statusText'];

								if (totalBinAvailQty > 0) {
									uomText = objBinDetailsRec['stockunitText'];
									if (!utility.isValueValid(uomText)) {
										uomText = "";
									}
									objBinDetailsRec['availbleQuanity'] = totalBinAvailQty + " " + uomText;
									objBinDetailsRec['itemName'] = objBinDetailsRec['itemText'];
									objBinDetailsRec['itemInternalId'] = objBinDetailsRec['item'];
									var description = objBinDetailsRec['salesdescription'];
									if (description == '- None -') {
										objBinDetailsRec['salesdescription'] = "";
									}
									if (utility.isValueValid(statusName)) {
										objBinDetailsRec['statusName'] = objBinDetailsRec['statusText'];
										objBinDetailsRec['statusInternalId'] = objBinDetailsRec['status'];
									}
									itemsList[itemsList.length] = objBinDetailsRec;
								}

							}

							itemList['itemList'] = itemsList;
							itemList['isValid'] = true;
						}
					} else {
						itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.INVALID_INPUT');
						itemList['isValid'] = false;
					}
				} else {
					itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.INVALID_INPUT');
					itemList['isValid'] = false;
				}
			} catch (e) {
				itemList['isValid'] = false;
				itemList['errorMessage'] = e.message;
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
				title: 'debugStringnew',
				details: debugString
			});
			log.debug({
				title: 'itemList',
				details: itemList
			});
			return itemList;

		}

		return {
			'post': getItemList
		};

	});