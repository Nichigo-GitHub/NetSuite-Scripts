/**
 * wmsUtility.js
 * 
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search', 'N/runtime', 'N/record', 'N/config', 'N/format', './big', './wms_translator', 'N/url',
		'N/wms/recommendedBins', 'N/query', 'N/internal/elasticLogger', 'N/ui/serverWidget'
	],
	function (search, runtime, record, config, format, Big, translator, url, binApi, query, loggerFactory, serverWidget) {



		function _getSearchResults(searchObj) {

			var search_page_count = 1000;
			var resultObj = [];
			var myPagedData = searchObj.runPaged({
				pageSize: search_page_count
			});
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					resultObj.push(result);
				});
			});
			return resultObj;
		}

		function _getSearchResultCount(searchObj) {

			var search_page_count = 1000;
			var totalSearchCount = 0;
			var myPagedData = searchObj.runPaged({
				pageSize: search_page_count
			});
			totalSearchCount = myPagedData.count;

			return totalSearchCount;
		}

		/**
		 * Makes a saved search call and returns all result items in JSON array
		 * 
		 * @param searchObj
		 *            Search object from which search needs to be performed
		 * @param callback
		 *            callback function if any to which search item needs to be
		 *            given
		 * @param callbackResultObj
		 *            search Collector, only mutable object (like array and object)
		 * @returns {*} Array of search result in JSON format
		 */
		function _getSearchResultInJSON(searchObj, callback, callbackResultObj) {
			// if callback and callbackResultObj are undefined, default behaviour is
			// 1 result -> 1 object
			if (callback == undefined || callback == '') {
				callback = _searchResultToJson;
			}
			if (callbackResultObj == undefined) {
				callbackResultObj = []; // initialize as array
			}
			var search_page_count = 1000;
			var myPagedData = searchObj.runPaged({
				pageSize: search_page_count
			});
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					// get json of result
					callback(result, callbackResultObj);
				});
			});
			return callbackResultObj;
		}
		/**
		 * Converts Search result to JSON object
		 * 
		 * @param searchResult
		 *            each search result object
		 * @returns {Array} JSON equivalent of search object
		 */
		function _searchResultToJson(searchResult, searchResults) {
			var resultObj = {};
			var columnsArray = searchResult.columns;
			var columnKeys = [];
			for (var j in columnsArray) {
				var columnObj = JSON.parse(JSON.stringify(columnsArray[j]));
				var column = columnObj.name;
				var columnSummary = columnObj.summary;
				var columnLabel = columnObj.label;
				var columnJoin = columnObj.join;
				var columnType = columnObj.type;
				if (column == 'formulanumeric' || column == 'formuladate' || column == 'formulatext') {
					var columnValue = searchResult.getValue(columnsArray[j]);
					resultObj[columnLabel] = columnValue;
				} else {
					var columnValue = searchResult.getValue({
						name: column,
						summary: columnSummary,
						join: columnJoin
					});
					if (columnKeys.indexOf(column) != -1) {
						columnKeys.push(columnLabel);
						resultObj[columnLabel] = columnValue;
					} else {
						columnKeys.push(column);
						resultObj[column] = columnValue;
					}
					if (columnType == 'select' || column == 'unit' || typeof columnObj == 'object') {
						if (columnValue != '') {
							var columnText = searchResult.getText({
								name: column,
								summary: columnSummary,
								join: columnJoin
							});
							var colName = column + "Text";
							resultObj[colName] = columnText;
						} else {
							var colName = column + "Text";
							resultObj[colName] = '';
						}
					}
				}

				resultObj['id'] = searchResult.id;
				resultObj['recordType'] = searchResult.recordType;
			}
			searchResults.push(resultObj);
		}

		/**
		 * Makes a saved search call and returns single result in JSON array
		 * basically it can be used for validation.
		 * 
		 * @param searchObj
		 *            Search object from which search needs to be performed
		 * @returns {*} Array of search result in JSON format
		 */
		function _getSearchResultInJSONForValidation(searchObj, resultLength) {
			var callbackResultObj = [];
			if (resultLength == undefined || resultLength == '') {
				resultLength = 2;
			}
			searchObj.run().each(function (result) {
				_searchResultToJson(result, callbackResultObj);
				if (parseInt(callbackResultObj.length) == parseInt(resultLength)) {
					return false;
				} else {
					return true;
				}
			});
			return callbackResultObj;
		}

		function _getCurrentUserLanguage() {
			var user = runtime.getCurrentUser();
			return user.getPreference({
				name: 'LANGUAGE'
			});
		}

		/**
		 * This function calls when the end user selects or scans the item to check
		 * the same line/item is being processed by any other user.If the lock
		 * records found error message will be returned else lock will be created
		 * for that order line to prevent others process the same line.
		 */
		function checkTransactionLock(trantype, getPOInternalId, getPOLineNo) {
			var currentUser = runtime.getCurrentUser();
			var currentUserId = currentUser.id;
			var lockfilters = [
				search.createFilter({
					name: 'custrecord_wmsse_trantype',
					operator: search.Operator.IS,
					values: trantype
				}), search.createFilter({
					name: 'custrecord_wmsse_order',
					operator: search.Operator.ANYOF,
					values: getPOInternalId
				}), search.createFilter({
					name: 'custrecord_wmsse_line',
					operator: search.Operator.EQUALTO,
					values: getPOLineNo
				}), search.createFilter({
					name: 'custrecord_wmsse_lockflag',
					operator: search.Operator.IS,
					values: true
				})
			];
			var lockSearch = search.load({
				id: 'customsearch_wmsse_lockrecs_srh'
			});

			var savedFilters = lockSearch.filters;
			lockSearch.filters = savedFilters.concat(lockfilters);

			var lockresults = lockSearch.run().getRange({
				start: 0,
				end: 1000
			});
			if (lockresults.length > 0) {
				var getLockUser = lockresults[0].getValue({
					name: 'custrecord_wmsse_user'
				});
				var getLockLine = lockresults[0].getValue({
					name: 'custrecord_wmsse_line'
				});
				if (parseInt(getLockUser) != parseInt(currentUserId)) {

					var error = translator.getTranslationString('PO_ITEMVALIDATE.CHECK_MULTIPLE_USERS');
					return error;
				} else if (parseInt(getLockLine) != parseInt(getPOLineNo)) {
					var lockRecId = createLockRecord(getPOInternalId, trantype, getPOLineNo, currentUserId);
					log.debug('lockRecId', lockRecId);
					return null;
				}
			} else {
				var lockRecId = createLockRecord(getPOInternalId, trantype, getPOLineNo, currentUserId);
				log.debug('lockRecId', lockRecId);
				return null;
			}
			//		end
		}
		/** Lock record creation */
		function createLockRecord(getPOInternalId, trantype, getPOLineNo, currentUserId) {
			var lockRecord = record.create({
				type: 'customrecord_wmsse_lockrecs',
				isDynamic: true
			});
			lockRecord.setValue({
				fieldId: 'name',
				value: getPOInternalId
			});
			lockRecord.setValue({
				fieldId: 'custrecord_wmsse_trantype',
				value: trantype
			});
			lockRecord.setValue({
				fieldId: 'custrecord_wmsse_order',
				value: getPOInternalId
			});
			lockRecord.setValue({
				fieldId: 'custrecord_wmsse_line',
				value: getPOLineNo
			});
			lockRecord.setValue({
				fieldId: 'custrecord_wmsse_lockflag',
				value: true
			});
			lockRecord.setValue({
				fieldId: 'custrecord_wmsse_user',
				value: currentUserId
			});

			var date = new Date();
			var mSecs = date.getTime();
			lockRecord.setValue({
				fieldId: 'custrecord_wmsse_time_msec',
				value: mSecs
			});

			var recid = lockRecord.save();
			return recid;
		}

		/**
		 * This function is used to validate selected/scanned item
		 * 
		 * @param itemNo
		 * @param location
		 * @param company
		 * @param poid
		 * @returns
		 */
		function getSKUIdWithName(itemNo, location, vendor, transactionId, searchItem) {
			var itemfrmBarcode = {};
			var itemResultObj = {};
			var itemResultKeys = {};
			var itemResults = [];
			var systemRule_barcodeResults = getSystemRuleDetails('Enable Advanced Barcode Scanning?', location, 'Y');
			var isBarcodeRuleEnabled = false;
			if (systemRule_barcodeResults.length > 0) {
				for (var i = 0; i < systemRule_barcodeResults.length; i++) {
					if (_isValueValid(systemRule_barcodeResults[i].custrecord_wmsseprocesstypeText)) {
						isBarcodeRuleEnabled = true;
						break;
					}
				}
				if (isBarcodeRuleEnabled) {
					var flag = false;
					if (getSystemRuleValueWithProcessType('Enable Advanced Barcode Scanning?', location, translator.getTranslationString("ADVANCE_BARCODE.HIBCBARCODE")) == 'Y' && itemNo[0] == '+' && !flag) {
						flag = true;
						itemfrmBarcode = validateItemWithHIBCbarCode(itemNo);
						if (_isValueValid(itemfrmBarcode.barcodeVendor)) {
							var vendorSearchObj = search.create({
								type: "vendor",
								filters: ["entityid", "is", itemfrmBarcode.barcodeVendor]
							})
							var vendorResults = vendorSearchObj.run().getRange({
								start: 0,
								end: 1
							});
							if (vendorResults.length > 0)
								itemfrmBarcode.barcodeVendorId = vendorResults[0].id;
						}
						if (_isValueValid(itemfrmBarcode.barcodeItem)) {
							if (_isValueValid(vendor) && _isValueValid(itemfrmBarcode.barcodeVendorId) && vendor != itemfrmBarcode.barcodeVendorId) {
								itemResultObj.error = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
								return itemResultObj;
							}
							itemResults = wmsse_GetItemIdWithNameBasedOnItemAlias(itemfrmBarcode.barcodeItem, location, searchItem);
							if (itemResults.length > 0) {
								var aliasVendor = itemResults[0]['custrecord_wmsse_alias_vendor'];
								if (_isValueValid(aliasVendor) && _isValueValid(itemfrmBarcode.barcodeVendorId) && aliasVendor != itemfrmBarcode.barcodeVendorId) {
									itemResultObj.error = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT_HIBC");
									return itemResultObj;
								} else if (_isValueValid(aliasVendor) && _isValueValid(vendor) && aliasVendor != vendor) {
									itemResultObj.error = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
									return itemResultObj;
								}
								itemResultObj['itemInternalId'] = itemResults[0]['custrecord_wmsse_alias_item'];
								itemResultObj['itemName'] = itemResults[0]['custrecord_wmsse_alias_itemText'];
								if (_isValueValid(itemResults[0]['custrecord_wms_alias_unitText'])) {
									itemResultObj['itemUomName'] = itemResults[0]['custrecord_wms_alias_unitText'];
								}
							} else {
								itemNo = itemfrmBarcode.barcodeItem;
								vendor = itemfrmBarcode.barcodeVendorId;
							}
							itemResultObj['barcodeVendor'] = itemfrmBarcode.barcodeVendor;
							itemResultObj['barcodeVendorId'] = itemfrmBarcode.barcodeVendorId;
						}
					}
					if (getSystemRuleValueWithProcessType('Enable Advanced Barcode Scanning?', location, translator.getTranslationString("ADVANCE_BARCODE.GS1BARCODE")) == 'Y' && !flag) {
						itemfrmBarcode = validateItemWithGS1barCode(itemNo, location);
						if (_isValueValid(itemfrmBarcode.barcodeItem)) {
							var itemResultsObj = validateItemWithGS1ItemAlias(itemfrmBarcode.barcodeItem, location, searchItem, vendor);
							itemResults = itemResultsObj.itemResults;
							itemResultObj = itemResultsObj.itemResultObj;
						}
						if (itemResults.length > 0) {
							flag = true;
						}
					}
					if (getSystemRuleValueWithProcessType('Enable Advanced Barcode Scanning?', location, translator.getTranslationString("ADVANCE_BARCODE.COMPOSITEBARCODE")) == 'Y' && !flag) {
						itemResultObj.barCodeType = translator.getTranslationString("ADVANCE_BARCODE.COMPOSITEBARCODE");
						if (_isValueValid(vendor)) {
							itemfrmBarcode = parsebarcodestring(vendor, itemNo, location, transactionId);
							if (_isValueValid(itemfrmBarcode.barcodeItem)) {
								itemNo = itemfrmBarcode.barcodeItem;
								flag = true;
							}
						}
					}
					if (!flag) {
						itemfrmBarcode.error = translator.getTranslationString("ADVANCE_BARCODE.BARCODENOTCONFIGURED");
					}
				} else {
					itemfrmBarcode.error = translator.getTranslationString("ADVANCE_BARCODE.PROCESSTYPENOTSET");
				}
			}
			log.debug('itemNo', itemNo);

			if (itemResults.length == 0) {
				if (_isValueValid(itemfrmBarcode.error)) {
					itemfrmBarcode = {};
				}
				itemResults = validateItemForNameAndUpccode(itemNo, location, searchItem);
				if (itemResults.length > 0) {
					//adding itemInternalId, itemName for backward compatibility.
					itemResultObj['itemInternalId'] = itemResults[0]['id'];
					itemResultObj['itemName'] = itemResults[0]['itemid'];
				}
			}

			if (itemResults.length == 0) {
				itemResults = wmsse_GetItemIdWithNameBasedOnItemAlias(itemNo, location, searchItem, vendor);
				if (itemResults.length > 0) {
					itemResultObj['itemInternalId'] = itemResults[0]['custrecord_wmsse_alias_item'];
					itemResultObj['itemName'] = itemResults[0]['custrecord_wmsse_alias_itemText'];
					itemResultObj['isItemAliasScanFlag'] = true;
					if (_isValueValid(itemResults[0]['custrecord_wms_alias_unitText'])) {
						itemResultObj['itemUomName'] = itemResults[0]['custrecord_wms_alias_unitText'];
					}
				}
			}

			if (itemResults.length > 0 && _isValueValid(searchItem) && searchItem == true) {
				log.debug('search item is true :', itemResults);
				return itemResults;
			}


			if (itemResults.length > 0) {
				//Pushing all the saved search values to the itemResultObj Object
				itemResultKeys = itemResults[0];
				for (var key in itemResultKeys) {
					var value = itemResultKeys[key];
					itemResultObj[key] = value;
				}
			}

			if (itemResults.length > 0 && itemfrmBarcode.isbarcodescanned == true && !(searchItem)) {

				if (_isValueValid(itemResultObj)) {

					itemfrmBarcode['barcodeIteminternalid'] = itemResultObj['itemInternalId'];
					itemfrmBarcode['barcodeItemname'] = itemResultObj['itemName'];
					if (_isValueValid(itemResultObj['itemUomName']) && (!_isValueValid(itemResultObj.barcodeUomName))) {
						itemfrmBarcode['barcodeUomName'] = itemResultObj['itemUomName'];
					}
					if (_isValueValid(itemResultObj['barcodeVendor']))
						itemfrmBarcode['barcodeVendor'] = itemResultObj['barcodeVendor'];
				}
				return itemfrmBarcode;
			} else if (itemResults.length == 0 && _isValueValid(itemfrmBarcode.error)) {

				itemResults = checkInactiveItem(itemNo, location);
				if (_isValueValid(itemResults.error)) {
					itemResultObj.error = itemResults.error;
				} else {
					itemResultObj.error = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT") + '/' + itemfrmBarcode.error;
				}
			} else if (itemResults.length == 0) {
				itemResults = checkInactiveItem(itemNo, location);
				if (_isValueValid(itemResults.error)) {
					itemResultObj.error = itemResults.error;
				} else {
					itemResultObj.error = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
				}

			}

			return itemResultObj;
		}

		function validateItemWithGS1ItemAlias(itemNo, location, searchItem, vendor) {
			var itemResults = [];
			var itemResultObj = {};
			itemResults = wmsse_GetItemIdWithNameBasedOnItemAlias(itemNo, location, searchItem, vendor);
			if (itemResults.length > 0) {
				itemResultObj['itemInternalId'] = itemResults[0]['custrecord_wmsse_alias_item'];
				itemResultObj['itemName'] = itemResults[0]['custrecord_wmsse_alias_itemText'];
				if (_isValueValid(itemResults[0]['custrecord_wms_alias_unitText'])) {
					itemResultObj['itemUomName'] = itemResults[0]['custrecord_wms_alias_unitText'];
				}
			} else {
				// For ensuring backward compatability with 13 digit GTIN 
				itemNo = itemNo.substring(0, itemNo.length - 1);
				itemResults = wmsse_GetItemIdWithNameBasedOnItemAlias(itemNo, location, searchItem, vendor);
				if (itemResults.length > 0) {
					itemResultObj['itemInternalId'] = itemResults[0]['custrecord_wmsse_alias_item'];
					itemResultObj['itemName'] = itemResults[0]['custrecord_wmsse_alias_itemText'];
					if (_isValueValid(itemResults[0]['custrecord_wms_alias_unitText'])) {
						itemResultObj['itemUomName'] = itemResults[0]['custrecord_wms_alias_unitText'];
					}
				}
			}
			return {
				'itemResults': itemResults,
				'itemResultObj': itemResultObj
			};
		}

		function validateItemWithGS1barCode(itemNo, location) {
			log.debug('in gs1 func', itemNo);
			var barcodecomponents = {};
			var functionDefinition = getFunctionRegistry('GS1_PARSER');
			var modulePath = functionDefinition.getValue("custrecord_print_function_path");
			var module;
			require([modulePath], function (loadedModule) {
				module = loadedModule;
			});

			var output = module[functionDefinition.getValue("custrecord_print_function_name")](itemNo);
			log.debug('output', output);
			if (output['isValid'] == true) {

				var aiObj = output['data'];

				if ((_isValueValid(aiObj.content) && _isValueValid(aiObj.content.value)) || (_isValueValid(aiObj.gtin) && _isValueValid(aiObj.gtin.value))) {

					if ((_isValueValid(aiObj.gtin) && _isValueValid(aiObj.gtin.value))) {
						barcodecomponents['barcodeItem'] = aiObj.gtin.value;
					} else if ((_isValueValid(aiObj.content) && _isValueValid(aiObj.content.value))) {
						barcodecomponents['barcodeItem'] = aiObj.content.value;
					}

					// Pushing all the fields given by GS1 library to mobile state
					for (i in aiObj) {
						barcodecomponents[i] = aiObj[i].value;
					}
					// Pushing all the fields required by composite bar code to mobile state for ensuring the backward compatibility
					if (_isValueValid(aiObj.batch_lot))
						barcodecomponents['barcodeLotname'] = aiObj.batch_lot.value;
					if (_isValueValid(aiObj.expiry_date))
						barcodecomponents['barcodeLotExpirydate'] = aiObj.expiry_date.value;
					if (_isValueValid(aiObj.serial))
						barcodecomponents['barcodeSerialname'] = aiObj.serial.value;
					if (_isValueValid(aiObj.var_item_count))
						barcodecomponents['barcodeQuantity'] = aiObj.var_item_count.value;
					if (_isValueValid(aiObj.order_number))
						barcodecomponents['barcodePOnumber'] = aiObj.order_number.value;
					barcodecomponents['isbarcodescanned'] = true;
					barcodecomponents['barcodeType'] = output['barcodeType'];
				} else {
					barcodecomponents['error'] = translator.getTranslationString("PO_ITEMVALIDATE.BARCODE_ITEM_NOTFOUND");
				}
				// Logging data to ELK
				var dataObj = {
					'bundleName': 'WMS',
					'executionContext': 'FeatureUsage',
					'featureName': 'GS1 Barcode'
				};
				logDatatoELK(dataObj);

			} else {
				barcodecomponents['error'] = output['errorMessage'];
			}

			return barcodecomponents;
		}

		function validateItemWithHIBCbarCode(itemNo) {
			var barcodecomponents = {};
			var functionDefinition = getFunctionRegistry('HIBC_PARSER');
			var modulePath = functionDefinition.getValue("custrecord_print_function_path");
			var module;
			require([modulePath], function (loadedModule) {
				module = loadedModule;
			});

			var output = module[functionDefinition.getValue("custrecord_print_function_name")](itemNo);
			log.debug('output', output);
			if (output['isValid'] == true) {
				if (_isValueValid(output['primaryData'])) {
					if (_isValueValid(output.primaryData.ProductNumber))
						barcodecomponents['barcodeItem'] = output.primaryData.ProductNumber;
					if (_isValueValid(output.primaryData.CompanyName))
						barcodecomponents['barcodeVendor'] = output.primaryData.CompanyName;
				}
				if (_isValueValid(output['secondaryData'])) {
					if (_isValueValid(output.secondaryData.ExpirationDate))
						barcodecomponents['barcodeLotExpirydate'] = output.secondaryData.ExpirationDate;
					if (_isValueValid(output.secondaryData.LotNumber))
						barcodecomponents['barcodeLotname'] = output.secondaryData.LotNumber;
					if (_isValueValid(output.secondaryData.SerialNumber))
						barcodecomponents['barcodeSerialname'] = output.secondaryData.SerialNumber;
					if (_isValueValid(output.secondaryData.Quantity))
						barcodecomponents['barcodeQuantity'] = output.secondaryData.Quantity;
				}
				barcodecomponents['isbarcodescanned'] = true;
			} else {
				barcodecomponents['error'] = output['errorMessage'];
			}
			log.debug('barcodecomponents', barcodecomponents);
			return barcodecomponents;
		}

		function getFunctionRegistry(name) {

			var filters = [];
			filters.push(search.createFilter({
				name: "name",
				operator: search.Operator.IS,
				values: name
			}));
			var savedSearch = search.load({
				id: "customsearch_print_function_search"
			});
			savedSearch.filters = filters;
			var results = [];
			var searchPageData;
			var pageSize = savedSearch.runPaged().count;
			var searchData = savedSearch.runPaged({
				pageSize: pageSize
			});
			searchData.pageRanges
				.forEach(function (pageRange) {
					searchPageData = searchData.fetch({
						index: pageRange.index
					});
					searchPageData.data
						.forEach(function (result) {
							results.push(result);
						});
				});
			var functionDefinition = results[0];

			return functionDefinition;
		}

		function validateItemForNameAndUpccode(itemNo, location, searchItem) {
			var itemList = [];
			var currItem = [];
			var itemSearchResultsSearch = search.load({
				id: 'customsearch_wmsse_validitem_name_srh'
			});

			var filters = [];
			if (searchItem) {

				filters = [
					['location', search.Operator.ANYOF, ['@NONE@', location]], 'and', [
						["nameinternal", search.Operator.CONTAINS, itemNo], "or",
						["upccode", search.Operator.CONTAINS, itemNo]
					], 'and', ["isinactive", search.Operator.IS, false]
				];
			} else {
				filters = [
					['location', search.Operator.ANYOF, ['@NONE@', location]], 'and', ["nameinternal", search.Operator.IS, itemNo], 'and', ["isinactive", search.Operator.IS, false]
				];
			}
			itemSearchResultsSearch.filterExpression = filters;

			if (searchItem) {
				var itemSearchResults = itemSearchResultsSearch.run().getRange({
					start: 0,
					end: 1000
				});
				for (i in itemSearchResults) {
					var currItem = {};
					currItem['id'] = itemSearchResults[i].id;
					currItem['itemid'] = itemSearchResults[i].getValue({
						name: 'itemid'
					});
					currItem['upccode'] = itemSearchResults[i].getValue({
						name: 'upccode'
					});
					currItem['description'] = itemSearchResults[i].getValue({
						name: 'salesdescription'
					});
					itemList.push(currItem);
				}
			} else {
				itemList = _getSearchResultInJSON(itemSearchResultsSearch);
				if (itemList.length == 0) {
					itemList = validateItemForUPCcode(itemNo, location);
				}

			}
			return itemList;
		}

		/*	*/
		/**
		 * This function is used to get Item internal Id
		 * 
		 * @param itemNo
		 * @returns {String}
		 */
		/*
			function wmsse_GetItemIdWithNameForItemNo(itemNo,location,searchItem){
				var itemList = [];
				var currItem = [];
				var filters = [];
				if(searchItem){
					filters.push(search.createFilter({
						name: 'nameinternal',
						operator: search.Operator.CONTAINS,
						values: itemNo
					}));
					filters.push(search.createFilter({
						name: 'isinactive',
						operator: search.Operator.IS,
						values: false
					}));
				}else{
					filters.push(search.createFilter({
						name: 'nameinternal',
						operator: search.Operator.IS,
						values: itemNo
					}));
				}
				if(location!=null && location!='' && location!='null')
				{
					filters.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@',location]
					}));
				}

				var itemSearchResultsSearch = search.load({
					id :'customsearch_wmsse_validitem_name_srh'
				});
				var savedFilters = itemSearchResultsSearch.filters ;
				itemSearchResultsSearch.filters = savedFilters.concat(filters);;
				var itemSearchResults =itemSearchResultsSearch.run().getRange({ start :0 ,end :1000});
				if(searchItem){
					for(i in itemSearchResults){
						var currItem = {};
						currItem['id'] = itemSearchResults[i].id;
						currItem['itemid'] = itemSearchResults[i].getValue({
							name :'itemid'
						});
						currItem['upccode'] = itemSearchResults[i].getValue({
							name :'upccode'
						});
						currItem['description'] = itemSearchResults[i].getValue({
							name :'salesdescription'
						});
						itemList.push(currItem);
					}
					return itemList;
				}else{
					if(itemSearchResults != null && itemSearchResults != '')
					{
						// There will be only one record in search result
						currItem.push(itemSearchResults[0].id);
						currItem.push(itemSearchResults[0].getValue({
							name :'itemid'
						}));
					}
					return currItem;
				}
			}*/

		/*	*/
		/**
		 * This function is used to get item id with scanned UPC code.
		 * 
		 * @param itemNo
		 * @param location
		 * @returns {String}
		 */
		/*
			function wmsse_GetItemIdWithNameBasedOnUPCCode(itemNo,location, searchItem){
				var itemList = [];
				var currItem = [];
				var filters = [];
				if(searchItem){
					filters.push(
							search.createFilter({
								name: 'upccode',
								operator: search.Operator.CONTAINS,
								values: itemNo
							}));
				}else{
					filters.push(
							search.createFilter({
								name: 'upccode',
								operator: search.Operator.IS,
								values: itemNo
							}));
				}
				if(location!=null && location!='' && location!='null')
					filters.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@',location]
					}));
				var itemSearchResultsSearch = search.load({
					id : 'customsearch_wmsse_validitem_name_srh'
				});
				var savedFilter = itemSearchResultsSearch.filters;
				itemSearchResultsSearch.filters = savedFilter.concat(filters);
				var itemSearchResults = itemSearchResultsSearch.run().getRange({ start : 0,end :1000}) ;
				if(searchItem){
					for(i in itemSearchResults){
						var currItem = {};
						currItem['id'] = itemSearchResults[i].id;
						currItem['itemid'] = itemSearchResults[i].getValue({
							name :'itemid'
						});
						currItem['upccode'] = itemSearchResults[i].getValue({
							name :'upccode'
						});
						currItem['description'] = itemSearchResults[i].getValue({
							name :'salesdescription'
						});
						itemList.push(currItem);
					}
					return itemList;
				}else{
					if(itemSearchResults != null && itemSearchResults.length != 0)
					{
						currItem.push(itemSearchResults[0].id);
						currItem.push(itemSearchResults[0].getValue({
							name :'itemid'
						}));
					}
					return currItem;
				}
			}*/
		/**
		 * This function is to check for the scanned item in the item alias custom
		 * record
		 */
		function wmsse_GetItemIdWithNameBasedOnItemAlias(itemNo, location, searchItem, vendor) {
			var itemList = [];
			var actItem = [];
			var skuAliasFilters = [];
			if (searchItem) {
				skuAliasFilters.push(search.createFilter({
					name: 'name',
					operator: search.Operator.CONTAINS,
					values: itemNo
				}));
			} else {
				skuAliasFilters.push(search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: itemNo
				}));
			}
			if (_isValueValid(vendor)) {
				skuAliasFilters.push(search.createFilter({
					name: 'custrecord_wmsse_alias_vendor',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', vendor]
				}));
			}
			if (location != null && location != '')
				skuAliasFilters.push(search.createFilter({
					name: 'custrecord_wmsse_alias_location',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', location]
				}));
			var skuAliasResultsSearch = search.load({
				id: 'customsearch_wmsse_itemalias_validate'
			});
			var savedFilters = skuAliasResultsSearch.filters;
			skuAliasResultsSearch.filters = savedFilters.concat(skuAliasFilters);

			if (searchItem) {
				var skuAliasResults = skuAliasResultsSearch.run().getRange({
					start: 0,
					end: 1000
				});
				for (i in skuAliasResults) {
					var currItem = {};
					currItem['id'] = skuAliasResults[i].getValue({
						name: 'custrecord_wmsse_alias_item'
					});
					currItem['itemid'] = skuAliasResults[i].getText({
						name: 'custrecord_wmsse_alias_item'
					});
					currItem['upccode'] = skuAliasResults[i].getValue({
						join: 'CUSTRECORD_WMSSE_ALIAS_ITEM',
						name: 'upccode'
					});
					currItem['description'] = skuAliasResults[i].getValue({
						join: 'CUSTRECORD_WMSSE_ALIAS_ITEM',
						name: 'salesdescription'
					});
					itemList.push(currItem);
				}
			} else {
				var itemList = _getSearchResultInJSON(skuAliasResultsSearch);
				log.debug('Item Alias - itemList Results :', itemList);
			}
			return itemList;
		}
		/** returns item Type */
		function getItemType(itemNo, location) {
			var itemType = "";

			var searchRec = search.load({
				id: 'customsearch_wmsse_itemtype_srh'
			});
			var savedFilter = searchRec.filters;
			savedFilter.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemNo
			}));
			searchRec.filters = savedFilter;
			var searchres = searchRec.run().getRange({
				start: 0,
				end: 1
			});
			if (searchres.length > 0) {
				itemType = searchres[0].recordType;
			}
			return itemType;
		}

		/**
		 * 
		 * @returns {boolean}
		 */
		function isInvStatusFeatureEnabled() {
			var vResult = false;
			try {
				var inventoryStatusFeature = runtime.isFeatureInEffect({
					feature: 'inventorystatus' // Not sure about this feature
				});
				// var inventoryStatusFeature =
				// nlapiGetContext().getFeature('inventorystatus');
				if (inventoryStatusFeature != null && inventoryStatusFeature != '' && inventoryStatusFeature != 'null' &&
					inventoryStatusFeature != 'undefined' && inventoryStatusFeature != false) {
					// The Inventory Status feature if provisioned on your account
					// then return true
					vResult = true;
				}
			} catch (e) {
				// The Inventory Status feature if not provisioned on your account
				// then return false
				log.error({
					title: 'exception in isInvStatusFeatureEnabled',
					details: e
				});
				vResult = false;
			}
			return vResult;
		}

		/**
		 * This function calculates the conversion rate for the given UOM
		 * 
		 */
		function getStockCoversionRate(vUnitTypeId, vUnits, cToConersionRate) {
			var uomfilters = [];
			if (vUnitTypeId != null && vUnitTypeId != '' && vUnitTypeId != 'null' && vUnitTypeId != undefined) {
				uomfilters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: vUnitTypeId
				}));
			}
			if (vUnits != null && vUnits != '' && vUnits != 'null' && vUnits != undefined) {
				uomfilters.push(search.createFilter({
					name: 'unitname',
					operator: search.Operator.IS,
					values: vUnits
				}));
			}
			var uomcolumns = [];
			uomcolumns.push(search.createColumn({
				name: 'conversionrate'
			}));
			var uomresults = search.create({
				type: 'unitstype',
				filters: uomfilters,
				columns: uomcolumns
			}).run().getRange({
				start: 0,
				end: 1000
			});
			var vRetConversionRate = 1;
			if (uomresults != null && uomresults != '') {
				var vFromRate = uomresults[0].getValue({
					name: 'conversionrate'
				});
				if (vFromRate == null || vFromRate == '') {
					vFromRate = 1;
				}
				vRetConversionRate = Number(Big(vFromRate).div(cToConersionRate));
			}
			return vRetConversionRate;
		}
		/** This function returns configured uoms for the provided unitType */
		function getUnitsType(unitId, unitName) {
			var results = '';
			var searchRec = search.load({
				id: 'customsearch_wmsse_unitstype'
			});
			var uomfilters = searchRec.filters;

			if (_isValueValid(unitId)) {
				uomfilters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: unitId
				}));
			}
			if (_isValueValid(unitName)) {
				uomfilters.push(search.createFilter({
					name: 'unitname',
					operator: search.Operator.IS,
					values: unitName
				}));
			}

			searchRec.filters = uomfilters;
			results = _getSearchResultInJSON(searchRec);

			log.debug({
				title: 'results',
				details: results
			});
			return results;
		}

		/**
		 * To get System rule
		 * 
		 * @param RuleId
		 * @param loc
		 * @returns {String}
		 */
		function getSystemRuleValueWithProcessType(RuleId, loc, transactionType) {
			var systemRuleValue = '';
			log.debug({
				title: 'transactionType',
				details: transactionType
			});
			var processType = getProcessId(transactionType);
			var processTypeCopy = processType;
			var ruleExceptionFlag = false;
			var ruleExceptionFlagPicking = false;
			var ruleExceptionFlagReceiving = false;
			var ruleExceptionFlagReceivingIR = false;
			if (_isValueValid(transactionType) && _isValueValid(RuleId)) {
				if (RuleId == 'Manually pack orders?' || RuleId == 'Use cartons for single-order picking?' || RuleId == 'Use cartons for multi-order picking?' || RuleId == 'Stage received items before putting away?' || RuleId == 'Manually post item receipts?') {
					if (RuleId == 'Manually post item receipts?') {
						ruleExceptionFlagReceivingIR = true;
					} else if (RuleId == 'Stage received items before putting away?') {
						ruleExceptionFlagReceiving = true;
					} else {
						ruleExceptionFlagPicking = true;
					}
					processType = '';
					ruleExceptionFlag = true;
				}
			}
			log.debug({
				title: 'processType',
				details: processType
			});
			try {

				var LANG = "LANGUAGE";
				var locale = runtime.getCurrentUser().getPreference(LANG)
				if (locale != "en_US") {
					RuleId = translator.getKeyBasedonValue(RuleId);
				}

				var searchRec = search.load({
					id: 'customsearch_wmsse_sys_rules'
				});
				var filters = searchRec.filters;
				filters.push(search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: RuleId.toString()
				}), search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));

				// starts

				if (_isValueValid(loc)) {
					filters.push(search.createFilter({
						name: 'custrecord_wmssesite',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', loc]
					}));
				}
				if (_isValueValid(processType)) {
					filters.push(search.createFilter({
						name: 'custrecord_wmsseprocesstype',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', processType]
					}));
				}
				searchRec.filters = filters;
				var searchresults = _getSearchResults(searchRec);
				log.debug({
					title: 'searchresults',
					details: searchresults
				});
				if (_isValueValid(searchresults) && searchresults.length > 0) {
					processType = processTypeCopy;
					for (var ruleLength in searchresults) {
						var systemRuleRecord = searchresults[ruleLength];
						var systemRuleProcessType = systemRuleRecord.getValue({
							name: 'custrecord_wmsseprocesstype'
						});
						var location = systemRuleRecord.getValue({
							name: 'custrecord_wmssesite'
						});
						var systemRuleProcessTypeText = systemRuleRecord.getText({
							name: 'custrecord_wmsseprocesstype'
						});

						if (_isValueValid(transactionType)) {
							if (ruleExceptionFlag) {
								if (ruleExceptionFlagReceivingIR && !(systemRuleProcessTypeText == 'Purchase Order' || systemRuleProcessTypeText == 'Inbound Shipment' || systemRuleProcessTypeText == 'Returns' || systemRuleProcessTypeText == 'Transfer Order')) {
									systemRuleProcessType = '';
								} else if (ruleExceptionFlagPicking && !(systemRuleProcessTypeText == 'Sales Order' || systemRuleProcessTypeText == 'Transfer Order')) {
									systemRuleProcessType = '';
								} else if (ruleExceptionFlagReceiving && !(systemRuleProcessTypeText == 'Purchase Order' || systemRuleProcessTypeText == 'Inbound Shipment' || systemRuleProcessTypeText == 'Returns')) {
									systemRuleProcessType = '';
								}
							}
						}

						if ((location && location == loc)) {
							if ((systemRuleProcessType && systemRuleProcessType == processType)) {
								systemRuleValue = systemRuleRecord.getValue({
									name: 'custrecord_wmsserulevalue'
								});

								break;
							} else {
								if (ruleExceptionFlag && (!systemRuleProcessType)) {
									systemRuleValue = systemRuleRecord.getValue({
										name: 'custrecord_wmsserulevalue'
									});
								} else if (!ruleExceptionFlag) {
									systemRuleValue = systemRuleRecord.getValue({
										name: 'custrecord_wmsserulevalue'
									});
								}
							}

						} else if (!location && !systemRuleValue && systemRuleProcessType == processType) {
							systemRuleValue = systemRuleRecord.getValue({
								name: 'custrecord_wmsserulevalue'
							});
						} else if ((!systemRuleProcessType) && (!location) && !systemRuleValue) {
							systemRuleValue = systemRuleRecord.getValue({
								name: 'custrecord_wmsserulevalue'
							});
						}

					}
				}
			} catch (exp) {
				log.error('expception', exp);
				return systemRuleValue || 'N';
			}
			return systemRuleValue || 'N';
		}


		function getProcessId(transactionType) {

			var processName = '';
			if (transactionType == 'purchaseorder') {
				processName = 'Purchase Order';
			} else if (transactionType == 'transferorder') {
				processName = 'Transfer Order';
			} else if (transactionType == 'returnauthorization') {
				processName = 'Returns';
			} else if (transactionType == 'ISM') {
				processName = 'Inbound Shipment';
			} else {
				processName = transactionType;
			}

			var wmsProcessTypeListSearch = search.create({
				type: 'customlist_wmsse_process_type',
				columns: [{
					name: 'name'
				}]
			});
			var wmsProcessTypeList = wmsProcessTypeListSearch.run().getRange({
				start: 0,
				end: 1000
			});
			var processTypeId = -1;

			if (_isValueValid(wmsProcessTypeList) && wmsProcessTypeList.length > 0) {

				for (var vProcess = 0; vProcess < wmsProcessTypeList.length; vProcess++) {
					var wmsProcessName = wmsProcessTypeList[vProcess].getValue('name');
					if (wmsProcessName == processName) {
						processTypeId = wmsProcessTypeList[vProcess].id;
						break;
					}
				}
			}
			return processTypeId;
		}


		/**
		 * To get System rule
		 *
		 * @param RuleId
		 * @param loc
		 * @returns {String}
		 */
		function getSystemRuleValue(RuleId, loc) {
			var systemrulevalue = 'N';
			try {

				var LANG = "LANGUAGE";
				var locale = runtime.getCurrentUser().getPreference(LANG)
				if (locale != "en_US") {
					RuleId = translator.getKeyBasedonValue(RuleId);
				}

				var searchRec = search.load({
					id: 'customsearch_wmsse_sys_rules'
				});
				var filters = searchRec.filters;
				filters.push(search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: RuleId.toString()
				}), search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));

				// starts
				if (loc != null && loc != '') {
					filters.push(search.createFilter({
						name: 'custrecord_wmssesite',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', loc]
					}));
				}
				searchRec.filters = filters;
				searchresults = _getSearchResultInJSON(searchRec);
				if (searchresults.length > 0) {
					if (searchresults[0]['custrecord_wmsserulevalue'] != null &&
						searchresults[0]['custrecord_wmsserulevalue'] != '') {
						systemrulevalue = searchresults[0]['custrecord_wmsserulevalue'];
					}
				}
			} catch (exp) {
				log.error('expception', exp);
				return systemrulevalue;
			}
			return systemrulevalue;
		}

		function fnGetInventoryBins(strLocation, ItemInternalId, binnumber) {
			var searchObj = search.load({
				id: 'customsearch_wmsse_itemwise_invt_inbound'
			});
			if (_isValueValid(strLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			searchObj.filters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.NONEOF,
				values: ItemInternalId
			}));
			searchObj.filters.push(search.createFilter({
				name: 'quantityonhand',
				join: 'binonhand',
				operator: search.Operator.GREATERTHAN,
				values: 0
			}));
			if (_isValueValid(binnumber)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: binnumber
				}));
			}
			var alltaskresults = _getSearchResultInJSON(searchObj);
			var binLocArr = [];
			if (alltaskresults.length > 0) {
				for (var f = 0; f < alltaskresults.length; f++) {
					if (binLocArr.indexOf(alltaskresults[f]['binnumber']) == -1) {
						binLocArr.push(alltaskresults[f]['binnumber']);
					}
				}
			}
			return binLocArr;
		}

		function fnGetInventoryBinsForLot(strLocation, strLot, ItemInternalId, binnumber) {
			var searchObj = search.load({
				id: 'customsearch_wmsse_itemwise_lots'
			});
			if (_isValueValid(strLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (_isValueValid(strLot)) {
				searchObj.filters.push(search.createFilter({
					name: 'inventorynumber',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ISNOT,
					values: strLot
				}));

			}
			if (_isValueValid(ItemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: ItemInternalId
				}));

			}
			searchObj.filters.push(search.createFilter({
				name: 'islotitem',
				operator: search.Operator.IS,
				values: true
			}));
			if (_isValueValid(binnumber)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					join: 'inventoryNumberBinOnHand',
					operator: search.Operator.ANYOF,
					values: binnumber
				}));
			}
			var alltaskresults = _getSearchResultInJSON(searchObj);
			var binLocArr = [];
			if (alltaskresults.length > 0) {
				for (var f = 0; f < alltaskresults.length; f++) {
					if (binLocArr.indexOf(alltaskresults[f]['binnumber']) == -1) {
						binLocArr.push(alltaskresults[f]['binnumber']);
					}
				}
			}
			return binLocArr;
		}
		/*function checkIsBinEmpty(vBinId) {
			var isEmptyBinRes = true;
			var objBinDetailsSearch = search.load({
				id: 'customsearch_wmsse_srchres_statuswise',
				type:search.Type.INVENTORY_BALANCE,
			});
			var savedFilter = objBinDetailsSearch.filters ;
			if (vBinId != null && vBinId != '')
				savedFilter.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: vBinId
				}));
			objBinDetailsSearch.filters = savedFilter;
			var objBinDetails = _getSearchResultInJSON(objBinDetailsSearch);
			if (objBinDetails.length > 0) {
				isEmptyBinRes = false;
			}
			return isEmptyBinRes;
		}*/

		function isInventoryNumberExists(item, serial, location) {
			var boolfound = false;
			var objDetailsSearch = search.load({
				id: 'customsearch_wmsse_assembly_lotscan_srh'
			});
			var filter = objDetailsSearch.filters;
			var cols = [];
			filter.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: item
			}));
			filter.push(search.createFilter({
				name: 'inventorynumber',
				operator: search.Operator.IS,
				values: serial
			}));
			objDetailsSearch.filters = filter;
			var objDetails = objDetailsSearch.run().getRange({
				start: 0,
				end: 1000
			});
			if (objDetails != null && objDetails != '' && objDetails.length > 0) {
				boolfound = true;
			}
			return boolfound;
		}

		function getBinInternalId(Binnumber, whLocation) {
			var bininternalId = '';
			var searchrecordSearch = search.load({
				id: 'customsearch_wmsse_woqty_bin_srh'
			});

			var filter = searchrecordSearch.filters;
			filter.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.IS,
				values: Binnumber
			}));
			// filter.push(new nlobjSearchFilter('inactive',null, 'is',false));
			if (whLocation != null && whLocation != '' && whLocation != 'null' && whLocation != 'undefined')
				filter.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			searchrecordSearch.filters = filter;
			var searchrecord = searchrecordSearch.run().getRange({
				start: 0,
				end: 1000
			});
			if (searchrecord != null && searchrecord != "")
				bininternalId = searchrecord[0].id;

			return bininternalId;
		}

		/*	// TODO : Have to make
		function _loadLookUpJson(processParentApp) {
			var lookUpSearchObj = search.create({
				type: dependencyLookup_CR,
				filters: [
					{
						name: 'custrecord_mobile_src_application',
						operator: search.Operator.IS,
						values: processParentApp
					}
					],
					columns: [
						{name: 'custrecord_mobile_source_id'},
						{name: 'custrecord_mobile_destination_id'}
						]
			});
			var myPagedData = lookUpSearchObj.runPaged({
				pageSize: search_page_count
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {

					var sourceId = result.getValue({
						name: 'custrecord_mobile_source_id'
					});

					var destinationId = result.getValue({
						name: 'custrecord_mobile_destination_id'
					});

					lookUpJSON[sourceId] = destinationId;

				});
			});

		}*/

		/**
		 * Parses time string to date object for TIMEOFDAY field
		 *
		 * @param time
		 * @returns {Date}
		 */
		function parseTimeString(time) {

			if (time == null || time == '') {
				var date = new convertDate();
				return date;
			}

			var timeStamp = format.parse({
				value: time,
				type: format.Type.TIMEOFDAY
			})
			log.debug({
				title: 'parseTimeString timestamp',
				details: timeStamp
			});
			return timeStamp;
		}

		function getLotInternalId(batchno, FetchedItemId) {
			var lotInternalId = '';
			var lotSearch = search.create({
				type: search.Type.INVENTORY_NUMBER,
				filters: [{
					name: 'inventorynumber',
					operator: 'is',
					values: batchno
				}]
			})

			var lotResults = lotSearch.run().getRange({
				start: 0,
				end: 1000
			});
			if (lotResults.length > 0) {
				lotInternalId = lotResults[0].id;
			}

			return lotInternalId;
		}

		function DateSetting() {
			var loadConfig = config.load({
				type: config.Type.USER_PREFERENCES
			});
			var setpreferencesdateformate = loadConfig.getValue({
				fieldId: 'DATEFORMAT'
			});

			return setpreferencesdateformate;
		}

		function TimeSetting() {
			var loadConfig = config.load({
				type: config.Type.USER_PREFERENCES
			});
			var setpreferencestimeformat = loadConfig.getValue({
				fieldId: 'TIMEFORMAT'
			});

			return setpreferencestimeformat;
		}

		function DateStamp() {

			var now = convertDate();
			var formattedDateString = format.format({
				value: now,
				type: format.Type.DATETIME
			});

			return formattedDateString;
		}

		function convertDate() {

			var date = new Date(); // get current date
			return date;

		}

		function getCurrentTimeStamp() {

			var now = convertDate();
			var dateString = format.format({
				value: now,
				type: format.Type.DATETIME
			});
			var timeFormatFromPref = TimeSetting();
			log.debug({
				title: 'timeFormatFromPref',
				details: timeFormatFromPref
			});
			if (timeFormatFromPref.lastIndexOf("a") != -1) {
				dateString = dateString.substring(0, dateString.lastIndexOf(" "));
			}
			var timeStampIndex = dateString.lastIndexOf(" ");
			var dateTimeString = format.format({
				value: now,
				type: format.Type.DATETIME
			});
			var timeStamp = dateTimeString.substring(timeStampIndex + 1);
			log.debug({
				title: 'getCurrentTimeStamp timestamp',
				details: timeStamp
			});
			return timeStamp;
		}

		function setExpiryDate(expiryDateFormat, vmonth, vday, vyear) {
			var dateObj = new Date(vyear, vmonth - 1, vday);
			var expDate = format.format({
				value: dateObj,
				type: format.Type.DATE
			});

			return expDate;
		}

		function _createDynamicSearchOnRoleForSubsidaries(vRoleid) {
			// This needs to be via code as saved search load on role is failing with internal error.
			var vRolefilters = [];
			var roleSubsidaries = "";
			vRolefilters.push(search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: false
			}));

			var vRoleColumns = [];
			vRoleColumns.push(search.createColumn({
				name: 'name'
			}));
			vRoleColumns.push(search.createColumn({
				name: 'subsidiaries'
			}));

			var roleSearch = search.create({
				type: 'Role',
				filters: vRolefilters,
				columns: vRoleColumns
			});
			var roleFilters = roleSearch.filters;
			roleFilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: vRoleid
			}));
			roleSearch.filters = roleFilters;
			var rolesSearchResult = _getSearchResultInJSON(roleSearch);

			for (var i = 0; i < rolesSearchResult.length; i++) {
				var vnRoleSubsid = rolesSearchResult[i]['subsidiaries'];
				if (roleSubsidaries != '') {
					roleSubsidaries = roleSubsidaries + ',' + vnRoleSubsid;
				} else {
					roleSubsidaries = vnRoleSubsid;
				}
			}
			log.debug('roleSubsidaries', roleSubsidaries);
			return roleSubsidaries;
		}
		/**
		 * This function gets Role based locations list.
		 *
		 * @returns {String}
		 */
		function getRoleBasedLocation(processType) {
			var subs = runtime.isFeatureInEffect({
				feature: 'subsidiaries'
			});
			var user = runtime.getCurrentUser();
			var vRoleLocation = [];
			var vEmpRoleLocation = user.location;

			if (subs == true) {
				var vSubsid = user.subsidiary;
				var vRoleid = user.role;
				var vRoleSubsidArray = [];
				if (_isValueValid(vRoleid)) {
					var roleSubsidiaries = getWmsPreferencesValue(vRoleid);
					if (_isValueValid(roleSubsidiaries)) {
						vRoleSubsidArray = roleSubsidiaries.split(',');
					}
					log.debug('vRoleSubsidArray', vRoleSubsidArray);
				}
				var filterForLocation = [];
				if (vRoleSubsidArray.length > 0) {
					filterForLocation.push(search.createFilter({

						name: 'subsidiary',
						operator: search.Operator.ANYOF,
						values: vRoleSubsidArray
					}));
				} else if (_isValueValid(vSubsid)) {
					filterForLocation.push(search.createFilter({
						name: 'subsidiary',
						operator: search.Operator.ANYOF,
						values: vSubsid
					}));
				}
				/*Core is supporting and to Support in platform for InventoryTransfer when employee is mapped with location
				excluding the emp location filter for Inventorytransfer*/
				if (vEmpRoleLocation != null && vEmpRoleLocation != '' && processType != 'inventoryTransfer') {
					filterForLocation.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.IS,
						values: vEmpRoleLocation
					}));
				}

				var roleBasedLocationSearch = search.load({
					id: 'customsearch_wmsse_getrolelocation'
				});
				var roleBasedLocationSearchFilter = roleBasedLocationSearch.filters;
				for (var i = 0; i < filterForLocation.length; i++) {
					// append our custom filtering conditions
					roleBasedLocationSearchFilter.push(filterForLocation[i])
				}
				roleBasedLocationSearch.filters = roleBasedLocationSearchFilter;
				var roleBasedLocations = _getSearchResultInJSON(roleBasedLocationSearch);

				for (var i = 0; i < roleBasedLocations.length; i++) {
					vRoleLocation.push(roleBasedLocations[i]['id']);
				}
			}

			// common for both subs=T||F
			if (vEmpRoleLocation != null && vEmpRoleLocation != '' && vEmpRoleLocation != 0) {
				vRoleLocation.push(vEmpRoleLocation);
				var vLocname = search.lookupFields({
					type: 'location',
					id: vEmpRoleLocation,
					columns: 'name'
				});

				var roleBasedLocationSearch = search.load({
					id: 'customsearch_wmsse_getrolelocation'
				});
				var roleBasedLocations = _getSearchResultInJSON(roleBasedLocationSearch);

				for (var i = 0; i < roleBasedLocations.length; i++) {
					var loc_name = roleBasedLocations[i]['name'];
					var loc_nohier = roleBasedLocations[i]['namenohierarchy'];

					var loc_subs = roleBasedLocations[i]['location_name'];
					var loc_id = roleBasedLocations[i]['id']; // Parent

					if (loc_nohier == vLocname['name'] || ((loc_subs != null && loc_subs != '') && (_isValueValid(vLocname) && vLocname['name'] == loc_subs))) {
						vRoleLocation.push(loc_id);
					}
				}
			}

			return vRoleLocation;
		}

		function getLocationName(vRoleLocation, useBinsFilter) {
			var locationArray = [];
			var locationNameSearch = search.load({
				id: 'customsearch_wmsse_whloc_srh'
			});

			if (_isValueValid(vRoleLocation)) {
				locationNameSearch.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: vRoleLocation
				}));
			}
			if (useBinsFilter != undefined && _isValueValid(useBinsFilter)) {
				locationNameSearch.filters.push(search.createFilter({
					name: 'usesbins',
					operator: search.Operator.IS,
					values: useBinsFilter
				}));
			}

			var searchresults = _getSearchResultInJSON(locationNameSearch);
			log.debug({
				title: 'searchresults',
				details: searchresults
			});

			if (searchresults.length > 0) {
				for (var i = 0; i < searchresults.length; i++) {
					locationArray[i] = new Array();
					locationArray[i][0] = searchresults[i]['id'];
					locationArray[i][1] = searchresults[i]['name'];
				}
			}

			return locationArray;
		}

		function _getAllLocations() {
			var vLocationArray = [];
			// for non oneoworld account case when no location is configured, show all location
			var roleBasedLocationSearch = search.load({
				id: 'customsearch_wmsse_getrolelocation'
			});
			var roleBasedLocations = _getSearchResultInJSON(roleBasedLocationSearch);

			for (var i = 0; i < roleBasedLocations.length; i++) {
				var loc_id = roleBasedLocations[i]['id'];
				vLocationArray.push(loc_id);
			}

			return vLocationArray;
		}

		function _getWHLocations(location) {
			var vLocationArray = [];
			var Whsite = '';
			// for non oneoworld account case when no location is configured, show
			// all location
			var locationSearch = search.load({
				id: 'customsearch_wmsse_getrolelocation'
			});
			var locationFilters = locationSearch.filters;

			locationFilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: location
			}));
			locationSearch.filters = locationFilters;

			var roleBasedLocations = _getSearchResultInJSON(locationSearch);
			if (roleBasedLocations != null && roleBasedLocations != '') {
				Whsite = 'T';
			} else
				Whsite = 'F';


			return Whsite;
		}

		function _isValueValid(val) {
			var isNotNull = false;
			if (typeof (val) == 'boolean') {
				val = val.toString();
			}
			if (val != null && val != '' && val != 'null' && val != undefined && val != 'undefined') {
				isNotNull = true;
			}

			return isNotNull;
		}


		function _validateDate(vDateString, dtsettingFlag) {
			if (vDateString != null && vDateString != '') {
				var vValidDate = format.parse({
					type: format.Type.DATE,
					value: vDateString
				});
				if (isNaN(vValidDate) || vValidDate == null || vValidDate == '')
					return null;
				else
					return vValidDate;
			} else
				return null;
		}
		/**
		 * To Get Inventory availablestatus from core status record
		 */
		/*	function _getInventoryAvailableStatusFromCore(makeInvAvailFlagFromSelect)
		{
			var objwmsstatusDetailsSearch = search.load({id: 'customsearch_wmsse_inventorystatusvalues'});
			var savedFilters = objwmsstatusDetailsSearch.filters ;
			var wmsInvstatusidArray = [];
			savedFilters.push(search.createFilter({
				name: 'inventoryavailable',
				operator: search.Operator.IS,
				values: makeInvAvailFlagFromSelect
			}));

			objwmsstatusDetailsSearch.filters = savedFilters;
			var objwmsstatusdetails = _getSearchResultInJSON(objwmsstatusDetailsSearch);

			if(objwmsstatusdetails.length > 0 )
			{
				wmsInvstatusidArray.push('@NONE@');

				for(var statusid in  objwmsstatusdetails)
				{
					var currentRec = objwmsstatusdetails[statusid];
					wmsInvstatusidArray.push(currentRec.id);
				}
			}

			return wmsInvstatusidArray;
		}*/
		/**
		 * To Get Inventory availablestatus
		 */
		/*function getInventoryAvailableStatus(makeInvAvailFlagFromSelect)
		{

			var wmsInvstatusidArray = [];
			var objwmsstatusDetailsSearch = search.load({id: 'customsearch_wmsse_inventorystatus_det'});
			var savedFilters = objwmsstatusDetailsSearch.filters ;
			savedFilters.push(search.createFilter({
				name: 'custrecord_wmsse_makeinventoryflag',
				operator: search.Operator.IS,
				values: makeInvAvailFlagFromSelect
			}));
			objwmsstatusDetailsSearch.filters = savedFilters;
			var objwmsstatusdetails = _getSearchResultInJSON(objwmsstatusDetailsSearch);

			if(objwmsstatusdetails.length > 0)
			{
				wmsInvstatusidArray.push('@NONE@');
				for(var statusid in objwmsstatusdetails)
				{
					wmsInvstatusidArray.push(objwmsstatusdetails[statusid].id);
				}
			}

			return wmsInvstatusidArray;
		}*/

		function replaceAll(originalstring, charactertoreplace, replacementcharacter) {
			return originalstring.replace(new RegExp(escapeRegExp(charactertoreplace), 'g'), replacementcharacter);
		}

		function escapeRegExp(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}

		function getbarcodecomponents(barcodeformatref, barcodestring, whlocation, processModule) {
			var barcodecomponents = {};
			var barcodecomponentSearch = search.load({
				id: 'customsearch_wmsse_barcodecomponents'
			});

			var barcodecomponentFilters = barcodecomponentSearch.filters;
			barcodecomponentFilters.push(
				search.createFilter({
					name: 'custrecord_wmsse_barcode_templatename',
					operator: search.Operator.ANYOF,
					values: barcodeformatref
				}));
			barcodecomponentFilters.push(
				search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));

			barcodecomponentSearch.filters = barcodecomponentFilters;
			var srchbarcodecomponents = _getSearchResultInJSON(barcodecomponentSearch);
			log.debug({
				title: 'srchbarcodecomponents',
				details: srchbarcodecomponents
			});
			if (srchbarcodecomponents.length > 0) {
				var vItem = '';
				var vLot = '';
				var vExpiryDate = '';
				var vQty = '';
				var vUOM = '';
				var vSerialNumber = '';

				log.debug({
					title: 'barcodestring.length1',
					details: srchbarcodecomponents[srchbarcodecomponents.length - 1]['custrecord_wmsse_componentendingindex']
				});
				// If the bar code string is not having all the components
				// configured
				if (barcodestring.length >= srchbarcodecomponents[srchbarcodecomponents.length - 1]['custrecord_wmsse_componentendingindex']) {
					/*
					 * barcodecomponents['error']
					 * =translator.getTranslationString('PO_ITEMVALIDATE.INVALID_BARCODE');
					 * //return barcodecomponents; } else {
					 */
					for (var barcode in srchbarcodecomponents) {
						if (JSON.stringify(barcodecomponents) !== '{}') {
							break;
						}
						var barcodeRec = srchbarcodecomponents[barcode];
						for (var barcodecomponent in srchbarcodecomponents) {
							var barcodecomponentRec = srchbarcodecomponents[barcodecomponent];

							if (barcodeRec["custrecord_wmsse_barcode_templatename"] == barcodecomponentRec["custrecord_wmsse_barcode_templatename"]) {
								var datafield = barcodecomponentRec['custrecord_wmsse_componentnameText'];
								var startindex = barcodecomponentRec['custrecord_wmsse_componentstartingindex'];
								var endindex = barcodecomponentRec['custrecord_wmsse_componentendingindex'];
								var dataformat = barcodecomponentRec['custrecord_wmsse_componentdataformatText'];
								var paddingchar = barcodecomponentRec['custrecord_wms_barcode_paddingcharacterText'];
								switch (datafield) {
									case 'Item':
										vItem = barcodestring.substring(parseInt(startindex) - 1, parseInt(endindex));
										if (_isValueValid(paddingchar)) {
											vItem = replaceAll(vItem, paddingchar, '');
										}

										if (_isValueValid(vItem)) {
											vItem = vItem.trim();
											var itemResults = [];
											if (processModule == "InventoryOrOutbound") {
												var itemResults = validateItemForNameAndUpccode(vItem, whlocation);
												if (itemResults.length == 0) {
													itemResults = wmsse_GetItemIdWithNameBasedOnItemAlias(vItem, whlocation);
													if (itemResults.length > 0) {
														barcodecomponents['barcodeItemname'] = itemResults[0].custrecord_wmsse_alias_itemText;
														barcodecomponents['barcodeIteminternalid'] = itemResults[0].custrecord_wmsse_alias_item;
													}
												} else {
													barcodecomponents['barcodeItemname'] = itemResults[0].itemid;
													barcodecomponents['barcodeIteminternalid'] = itemResults[0].id;
												}

												barcodecomponents['isbarcodescanned'] = true;
											} else {
												barcodecomponents['barcodeItem'] = vItem;
												barcodecomponents['isbarcodescanned'] = true;
											}
											// Logging data to ELK
											var dataObj = {
												'bundleName': 'WMS',
												'executionContext': 'FeatureUsage',
												'featureName': 'Composite Barcode'
											};
											logDatatoELK(dataObj);
										} else {
											barcodecomponents['error'] = translator.getTranslationString('PO_ITEMVALIDATE.BARCODE_ITEM_NOTFOUND');
										}
										break;

									case 'Lot':
										vLot = barcodestring.substring(parseInt(startindex) - 1, parseInt(endindex));
										if (_isValueValid(paddingchar)) {
											vLot = replaceAll(vLot, paddingchar, '');
										}
										if (_isValueValid(vLot)) {
											vLot = vLot.trim();
											barcodecomponents['barcodeLotname'] = vLot;
										} else {
											barcodecomponents['barcodeLotname'] = '';
										}

										break;

									case 'Expiry Date':
										vExpiryDate = barcodestring.substring(parseInt(startindex) - 1, parseInt(endindex));
										if (_isValueValid(paddingchar)) {
											vExpiryDate = replaceAll(vExpiryDate, paddingchar, '');
										}

										if (_isValueValid(vExpiryDate)) {
											vExpiryDate = vExpiryDate.trim();
											if (vExpiryDate.length == dataformat.length) {

												var actexpirydate = getvalidexpirydate(vExpiryDate, dataformat);
												var getExpDateresult = null;
												if (_isValueValid(actexpirydate)) {
													getExpDateresult = _validateDate(actexpirydate);
												}
												if (getExpDateresult == null || getExpDateresult == "") {
													barcodecomponents['error'] = translator.getTranslationString('PO_ITEMVALIDATE.BARCODE_EXPIRYDATE_INVALIDFORMAT');
												} else {
													barcodecomponents['barcodeLotExpirydate'] = actexpirydate;
												}
											} else {
												barcodecomponents['error'] = translator.getTranslationString('PO_ITEMVALIDATE.BARCODE_EXPIRYDATE_INVALIDFORMAT');
											}

										} else {
											barcodecomponents['barcodeLotExpirydate'] = '';
										}
										break;

									case 'Quantity':
										vQty = barcodestring.substring(parseInt(startindex) - 1, parseInt(endindex));
										if (_isValueValid(paddingchar)) {
											vQty = replaceAll(vQty, paddingchar, '');
										}
										if (_isValueValid(vQty)) {
											vQty = vQty.trim();
											// below code is used to replace the extra
											// zeros, i.e 0001 replace 1
											vQty = vQty.replace(/^0+/, '');
										}
										if (parseFloat(vQty) > 0 && !isNaN(vQty)) {
											barcodecomponents['barcodeQuantity'] = vQty;
										} else {
											barcodecomponents['error'] = translator.getTranslationString('PO_ITEMVALIDATE.BARCODE_QUANTITY_INVALIDFORMAT');
										}
										break;

									case 'UOM':
										vUOM = barcodestring.substring(parseInt(startindex) - 1, parseInt(endindex));
										if (_isValueValid(paddingchar)) {
											vUOM = replaceAll(vUOM, paddingchar, '');
										}
										if (_isValueValid(vUOM)) {
											vUOM = vUOM.trim();
										}
										if (_isValueValid(vUOM)) {
											var uomResults = getUnitsType(null, vUOM);
											log.debug({
												title: 'uomresults',
												details: uomResults
											});
											if (_isValueValid(uomResults)) {
												barcodecomponents['barcodeUomName'] = vUOM;
											} else {
												barcodecomponents['error'] = translator.getTranslationString('PO_ITEMVALIDATE.BARCODE_UOM_NOTFOUND');

											}
										} else {
											barcodecomponents['barcodeUomName'] = '';
										}
										break;

									case 'Serial Number':
										vSerialNumber = barcodestring.substring(parseInt(startindex) - 1, parseInt(endindex));
										if (_isValueValid(paddingchar)) {
											vSerialNumber = replaceAll(vSerialNumber, paddingchar, '');
										}
										if (_isValueValid(vSerialNumber)) {
											vSerialNumber = vSerialNumber.trim();
										}
										var serValidationArr = [];
										if (_isValueValid(vSerialNumber)) {
											var serLen = vSerialNumber.length;
											for (var serItr = 0; serItr < serLen; serItr++) {
												serValidationArr.push(vSerialNumber[serItr]);
											}

											if (serValidationArr.indexOf('[') != -1 || serValidationArr.indexOf('+') != -1 || serValidationArr.indexOf('\\') != -1 ||
												serValidationArr.indexOf(';') != -1 || serValidationArr.indexOf('<') != -1 || serValidationArr.indexOf('>') != -1 ||
												serValidationArr.indexOf('{') != -1 || serValidationArr.indexOf('}') != -1 || serValidationArr.indexOf('(') != -1 ||
												serValidationArr.indexOf(')') != -1 || serValidationArr.indexOf("'") != -1) {
												barcodecomponents['error'] = translator.getTranslationString("PO_ITEMVALIDATE.BARCODE_SERAIL_INVALIDFORMAT");
											} else {
												barcodecomponents['barcodeSerialname'] = vSerialNumber;
											}
										} else {
											barcodecomponents['barcodeSerialname'] = '';
										}
										break;
								}
							}
						}
					}
					var componentCount = Object.keys(barcodecomponents).length;
					if (componentCount < srchbarcodecomponents.length) {
						barcodecomponents['error'] = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_BARCODE");
					}
				}
				/*
				 * else { nlapiLogExecution('DEBUG', 'Components are not configured
				 * for the Template'); barcodecomponents['error'] =
				 * "NoBarcodeFormats"; }
				 */
			}
			return barcodecomponents;
		}

		function getbarcodeformat(vendor, sortFlag) {
			var srchbarcodeformats = [];
			if (_isValueValid(vendor)) {
				var barcodeFormatSearch = search.load({
					id: 'customsearch_wmsse_barcodetemplatesearch'
				});
				var barcodeFilters = barcodeFormatSearch.filters;
				var barcodeColumns = barcodeFormatSearch.columns;
				barcodeFilters.push(
					search.createFilter({
						name: 'custrecord_wmsse_barcodevendor',
						operator: search.Operator.ANYOF,
						values: vendor
					}));
				barcodeFilters.push(
					search.createFilter({
						name: 'isinactive',
						operator: search.Operator.IS,
						values: false
					}));
				if (_isValueValid(sortFlag) && sortFlag == true) {
					barcodeColumns.push(search.createColumn({
						name: 'internalid',
						sort: search.Sort.ASC
					}));
				}

				barcodeFormatSearch.columns = barcodeColumns;
				barcodeFormatSearch.filters = barcodeFilters;
				srchbarcodeformats = _getSearchResultInJSON(barcodeFormatSearch);
			}
			return srchbarcodeformats;
		}

		function Insertbarcodestring(vbarcodestring, vtranaction, vbarcodetempid) {
			var barcodestringSearch = search.load({
				id: 'customsearch_wmsse_barcode_string'
			});
			var barcodestringFilters = barcodestringSearch.filters;
			barcodestringFilters.push(
				search.createFilter({
					name: 'custrecord_wmsse_barcode_string',
					operator: search.Operator.IS,
					values: vbarcodestring
				}));
			barcodestringSearch.filters = barcodestringFilters;

			var Searchresults = _getSearchResultInJSON(barcodestringSearch);
			if (Searchresults.length == 0) {
				var barcoderecord = record.create({
					type: 'customrecord_wmsse_barcode_strings'
				});
				barcoderecord.setValue({
					fieldId: 'name',
					value: vtranaction
				});
				barcoderecord.setValue({
					fieldId: 'custrecord_wmsse_barcode_string',
					value: vbarcodestring
				});
				barcoderecord.setValue({
					fieldId: 'custrecord_wmsse_barcode_transactionno',
					value: vtranaction
				});
				barcoderecord.setValue({
					fieldId: 'custrecord_wmsse_barcode_templaterefno',
					value: vbarcodetempid
				});
				var recid = barcoderecord.save();
			}
		}

		function parsebarcodestring(vendor, barcodeString, whLocationInternalId, transactionId) {
			var barcodeComponents = {};
			var isBarcodeComponentExist = 'F';

			var barcodeFormatArr = getbarcodeformat(vendor);
			if (barcodeFormatArr.length > 0) {
				var barcodeFormatRef = '';
				for (var barcodeFormat in barcodeFormatArr) {
					var barcodeFormatRef = barcodeFormatArr[barcodeFormat].id;

					barcodeComponents = getbarcodecomponents(barcodeFormatRef, barcodeString, whLocationInternalId);
					log.debug({
						title: 'barcodeComponents[error]',
						details: barcodeComponents['error']
					});
					if (JSON.stringify(barcodeComponents) !== '{}') {
						if (barcodeComponents['error'] == null || barcodeComponents['error'] == '' || barcodeComponents['error'] == 'null') {
							isBarcodeComponentExist = 'T';
							Insertbarcodestring(barcodeString, transactionId, barcodeFormatRef);
							break;
						}
					}
				}
				if (isBarcodeComponentExist == 'F') {
					barcodeComponents["error"] = translator.getTranslationString("PO_ITEMVALIDATE.NO_BARCODES");
				}
			} else {
				barcodeComponents["error"] = translator.getTranslationString("PO_ITEMVALIDATE.NO_BARCODES");
			}

			log.debug({
				title: 'barcodeComponents',
				details: barcodeComponents
			});
			return barcodeComponents;
		}

		function getvalidexpirydate(expDate, dateformat) {
			var vyear = '';
			var vmonth = '';
			var vday = '';

			if (dateformat == 'MMDDYY') {
				vmonth = expDate.substring(0, 2);
				vday = expDate.substring(2, 4);
				vyear = expDate.substring(4, 6);
			} else if (dateformat == 'DDMMYY') {
				vday = expDate.substring(0, 2);
				vmonth = expDate.substring(2, 4);
				vyear = expDate.substring(4, 6);
			} else if (dateformat == 'YYDDMM') {
				vyear = expDate.substring(0, 2);
				vday = expDate.substring(2, 4);
				vmonth = expDate.substring(4, 6);
			} else if (dateformat == 'YYMMDD') {
				vyear = expDate.substring(0, 2);
				vmonth = expDate.substring(2, 4);
				vday = expDate.substring(4, 6);
			}

			var now = new Date();
			var yearPrefix = now.getFullYear().toString();
			yearPrefix = yearPrefix.substring(0, 2);
			vyear = yearPrefix + vyear;
			var expiryDateFormat = DateSetting();
			var expiryDate = setExpiryDate(expiryDateFormat, vmonth, vday, vyear);
			return expiryDate;
		}

		function _itemValidationForInventoryAndOutBound(itemText, wareHouseLocationId, process) {
			var itemObj = {};
			var currItem = getSKUIdWithName(itemText, wareHouseLocationId, null, null);
			log.debug({
				title: 'currItem',
				details: currItem
			});

			if (currItem.error && (currItem.barCodeType == translator.getTranslationString("ADVANCE_BARCODE.COMPOSITEBARCODE"))) {
				var barcodeComponents = parsebarcodeoutsidereceiving(itemText, wareHouseLocationId, "InventoryOrOutbound");
				if (_isValueValid(barcodeComponents) && (JSON.stringify(barcodeComponents) != '{}')) {
					if (barcodeComponents["error"] == translator.getTranslationString("PO_ITEMVALIDATE.NO_BARCODES")) {
						itemObj = {};
						itemObj["errorMessage"] = translator.getTranslationString('PO_ITEMVALIDATE.NO_BARCODES');
						itemObj['isValid'] = false;
					} else if (barcodeComponents["error"] != null && barcodeComponents["error"] != '' && barcodeComponents["error"] != 'undefined') {
						itemObj = {};
						itemObj["errorMessage"] = barcodeComponents["error"];
						itemObj['isValid'] = false;
					} else {
						var barcodeItemname = barcodeComponents['barcodeItemname'];
						var barcodeIteminternalid = '';

						if (_isValueValid(barcodeComponents['barcodeIteminternalid']['id'])) {
							barcodeIteminternalid = barcodeComponents['barcodeIteminternalid']['id'];
						} else {
							barcodeIteminternalid = barcodeComponents['barcodeIteminternalid'];
						}

						log.debug('barcode item internal id :', barcodeIteminternalid);

						var barcodeQuantity = barcodeComponents['barcodeQuantity'];
						var barcodeUomName = barcodeComponents['barcodeUomName'];
						var barcodeLotname = '';
						var barcodeLotExpirydate = '';
						var barcodeSerialname = '';
						itemObj["barcodeItemname"] = barcodeComponents['barcodeItemname'];
						itemObj["barcodeIteminternalid"] = barcodeIteminternalid;
						if (_isValueValid(barcodeQuantity)) {
							itemObj.barcodeQuantity = barcodeQuantity;
						}
						if (_isValueValid(barcodeUomName)) {
							itemObj.barcodeUomName = barcodeUomName;
						}

						log.debug({
							title: 'itemObj :',
							details: itemObj
						});
						if (_isValueValid(barcodeIteminternalid)) {
							var currItemType = '';
							var unitsType = '';
							var itemLookUp = search.lookupFields({
								type: search.Type.ITEM,
								id: barcodeIteminternalid,
								columns: ['recordtype', 'unitstype']
							});
							if (_isValueValid(itemLookUp.unitstype[0])) {
								unitsType = itemLookUp.unitstype[0].value;
							}
							if (itemLookUp.recordtype != undefined) {
								currItemType = itemLookUp.recordtype;
							}
							if (currItemType == "lotnumberedinventoryitem" || currItemType == "lotnumberedassemblyitem") {
								barcodeLotname = barcodeComponents['barcodeLotname'];
								barcodeLotExpirydate = barcodeComponents['barcodeLotExpirydate'];

								if (_isValueValid(barcodeLotname)) {
									itemObj["barcodeLotname"] = barcodeLotname;
								}

								if (_isValueValid(barcodeLotExpirydate))
									itemObj["barcodeLotExpirydate"] = barcodeLotExpirydate;
							}
							if (currItemType == "serializedinventoryitem" || currItemType == "serializedassemblyitem") {
								barcodeSerialname = barcodeComponents['barcodeSerialname'];
								log.debug({
									title: 'barcodeSerialname',
									details: barcodeSerialname
								});

								if (_isValueValid(barcodeSerialname)) {
									var barcodeUomConversionRate = getConversionRate(barcodeUomName, unitsType);
									log.debug({
										title: 'barcodeUomConversionRate',
										details: barcodeUomConversionRate
									});
									if ((_isValueValid(barcodeQuantity) && !_isValueValid(process)) && !(barcodeUomConversionRate == 1)) {
										itemObj = {};
										itemObj.errorMessage = translator.getTranslationString("BINTRANSFER_ITEMORBINVALIDATE.BARCODE_SERIALQUANTITY_VALIDATION");
										itemObj.isValid = false;
									} else {
										itemObj.barcodeSerialname = barcodeSerialname;
									}

								}
							}
						}
					}
					log.debug({
						title: 'itemObj :',
						details: itemObj
					});
					if (_isValueValid(itemObj.errorMessage)) {
						itemObj.error = itemObj.errorMessage;
					} else {
						itemObj.isValid = true;
					}
					itemObj['isbarcodescanned'] = true;
				} else {
					itemObj = currItem;
				}
			} else if (currItem.barcodeIteminternalid) {
				itemObj = currItem;
				itemObj.isValid = true;
			} else {
				itemObj = currItem;
				itemObj["isValid"] = true;
				itemObj['isbarcodescanned'] = false;
			}

			log.debug({
				title: 'itemObj :',
				details: itemObj
			});
			return itemObj;
		}
		/**
		 * To parse barcode string for outside receiving processes
		 *
		 * @parameter :barcode string
		 * @parameter :warehouse location
		 * @return : barcodencomponent details
		 *
		 */

		function parsebarcodeoutsidereceiving(barcodeString, whLocationInternalId, processModule) {
			var barcodeComponents = {};
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

			var searchResults = _getSearchResultInJSON(barcodeStringSearch);
			log.debug({
				title: 'searchResults',
				details: searchResults
			});
			if (searchResults.length > 0) {
				var barcodeTemplateRefno = searchResults[0]['custrecord_wmsse_barcode_templaterefno'];
				log.debug({
					title: 'barcodeTemplateRefno',
					details: barcodeTemplateRefno
				});
				barcodeComponents = getbarcodecomponents(barcodeTemplateRefno, barcodeString, whLocationInternalId, processModule);
				if (barcodeComponents == null || barcodeComponents == '') {
					barcodeComponents['error'] = translator.getTranslationString("BINTRANSFER_ITEMORBINVALIDATE.INVALID_BARCODE");
				}
			}
			/*
			 * else {
			 * barcodecomponents["error"]=translator.getTranslationString('PO_ITEMVALIDATE.NO_BARCODES'); }
			 */
			return barcodeComponents;
		}

		function getConversionRate(uomName, unitTypeId) {
			var uomfilters = [];
			var vconversionRate = 1;
			if (_isValueValid(uomName)) {
				var searchRec = search.load({
					id: 'customsearch_wmsse_unitstype'
				});
				var uomfilters = searchRec.filters;

				uomfilters.push(search.createFilter({
					name: 'unitname',
					operator: search.Operator.IS,
					values: uomName
				}));
				uomfilters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: unitTypeId
				}));
				searchRec.filters = uomfilters;
				var uomResults = _getSearchResultInJSON(searchRec);
				if (uomResults.length > 0) {
					vconversionRate = uomResults[0]['conversionrate'];
				}
			}
			return vconversionRate;
		}

		function uomConversions(stockqty, selectedConversionRate, currentConversionRate) {
			var conersionRate = Number(Big(currentConversionRate).div(selectedConversionRate));
			var uomValue = parseFloat(Number(Big(stockqty).mul(conersionRate)).toFixed(5));

			return uomValue;

		}

		function _getStageLocations(stageTypesArr, BinlocationTypes) {
			var stgLocArr = [];
			if (BinlocationTypes != null && BinlocationTypes != '' && BinlocationTypes.length > 0) {

				for (var b = 0; b < BinlocationTypes.length; b++) {
					var tName = BinlocationTypes[b].getValue({
						name: 'name'
					});
					if (stageTypesArr.indexOf(tName) != -1) {
						stgLocArr.push(BinlocationTypes[b].id);
						if (stageTypesArr.length == 1 && stageTypesArr[0] == 'Stage') {
							break;
						}

					}
				}
			}
			return stgLocArr;
		}

		function inventoryNumberInternalId(serial, location, item, processType, SerialInternalId) {
			var internalId = '';
			var invNumSearch = search.load({
				id: 'customsearch_inv_num_basic_search'
			});
			if (SerialInternalId) {
				invNumSearch.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: SerialInternalId
				}));
			}

			if (_isValueValid(serial)) {
				invNumSearch.filters.push(search.createFilter({
					name: 'inventorynumber',
					operator: search.Operator.IS,
					values: serial
				}));
			}
			if (location) {
				invNumSearch.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: location
				}));
			}
			if (_isValueValid(item)) {
				invNumSearch.filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: item
				}));
			}
			var invNumSearchRes = _getSearchResultInJSON(invNumSearch);

			if (invNumSearchRes.length > 0) {
				invNumSearchRes = getMatchedInventoryNumber(invNumSearchRes, serial);
				internalId = invNumSearchRes[0]['id'];
			}
			if (_isValueValid(processType)) {
				return invNumSearchRes;
			} else {
				return internalId;
			}
		}

		/**
		 * To Get selected Inventory available status
		 */
		/*function getSelectedStatus(makeInvAvailFlagFromSelect)
		{
			var wmsInvstatusidArray = [];
			var getmakeflag;
			var makeinvflag;
			var getstatusname;

			var objStatusDetailsSearch = search.load({id: 'customsearch_wmsse_inventorystatusvalues'});
			var savedFilters = objStatusDetailsSearch.filters ;
			savedFilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.IS,
				values: makeInvAvailFlagFromSelect
			}));
			objStatusDetailsSearch.filters = savedFilters;
			var objStatusDetails = _getSearchResultInJSON(objStatusDetailsSearch);
			if(objStatusDetails.length > 0)
			{
				getmakeflag=getmakeflagresults[0]['inventoryavailable'];
				getstatusname=getmakeflagresults[0]['name'];
				if(getmakeflag==null || getmakeflag=='')
					makeinvflag='T';
				else
					makeinvflag=getmakeflag;
			}
			var statusDetailsSearch = search.load({id: 'customsearch_wmsse_inventorystatus_det'});
			var savedFilters = statusDetailsSearch.filters ;
			savedFilters.push(search.createFilter({
				name: 'custrecord_wmsse_makeinventoryflag',
				operator: search.Operator.IS,
				values: makeinvflag
			}));
			statusDetailsSearch.filters = savedFilters;
			var statusDetails = _getSearchResultInJSON(statusDetailsSearch);

			if(statusDetails.length > 0)
			{
				wmsInvstatusidArray.push('@NONE@');
				for(var statusid in  statusDetails)
				{
					var statusname=objwmsstatusdetails[statusid]['name'];
					if(getstatusname==statusname ||  statusname=='All Available' || statusname=='Not Available')
						wmsInvstatusidArray.push(statusDetails[statusid].id);
				}
			}
			return wmsInvstatusidArray;
		}*/
		/**
		 * To get storage Bin locations details based on Pick Zone sorted by
		 * Internal Id
		 */
		/*function fnGetBinsbyZones(strPickZone,strLocation)
		{
			var binSearchObj = search.load({id:'customsearch_wmsse_binssort_byinternalid'});
			var binSearchFilters = binSearchObj.filters;
			if(_isValueValid(strPickZone) && strPickZone != '-None-')
			{
				binSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_zone',
					operator: search.Operator.ANYOF,
					values: strPickZone
				}));
			}
			if(_isValueValid(strLocation))
			{
				binSearchFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			binSearchFilters.push(search.createFilter({
				name: 'inactive',
				operator: search.Operator.IS,
				values: false
			}));
			binSearchObj.filters = binSearchFilters;
			var objBinByZoneDetails =  _getSearchResultInJSON(binSearchObj);

			return objBinByZoneDetails;
		}*/

		/**
		 * To get Storage and Stage Bin locations details based on Pick Zone sorted
		 * by Internal Id
		 */
		/*function fnGetBinsbyZonesAlongWithStage(strPickZone,strLocation)
		{
			var binSearchObj = search.load({id:'customsearch_wmsse_binsbypickzonewithstg'});
			var binSearchFilters = binSearchObj.filters;

			if(_isValueValid(strPickZone) && strPickZone != '-None-')
			{
				binSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_zone',
					operator: search.Operator.ANYOF,
					values: strPickZone
				}));
			}
			if(_isValueValid(strLocation))
			{
				binSearchFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}

			binSearchFilters.push(search.createFilter({
				name: 'inactive',
				operator: search.Operator.IS,
				values: false
			}));
			binSearchObj.filters = binSearchFilters;
			var objBinByZoneDetails =  _getSearchResultInJSON(binSearchObj);
			return objBinByZoneDetails;
		}*/

		/*	function getStatusId(strInvStatus)
		{
			var statusid='';
			var filterInvstatus = [];
			if(strInvStatus!= null && strInvStatus!= '')
			{
				var inventorySearchObj = search.load({id:'customsearch_wmsse_inventorystatusvalues'});
				var inventorySearchFilters = inventorySearchObj.filters;
				inventorySearchFilters.push(search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: strInvStatus
				}));
				inventorySearchObj.filters = inventorySearchFilters;
				var objstatusdetails = _getSearchResultInJSON(inventorySearchObj);
				if(objstatusdetails.length > 0)
				{
					statusid=objstatusdetails[0].id;
				}
			}

			return statusid;
		}*/

		function getInventoryStatusOptions() {
			var sOptionsArr = [];
			/*
			 * var cols = []; cols[0] = search.createColumn({name:'name'}); cols[1] =
			 * search.createColumn({name:'internalId'});
			 *
			 * var objInventoryStatusSearch =
			 * search.create({type:'customlist_wmsse_status_optionslst', columns:
			 * cols});
			 *
			 * var inventoryResults =
			 * _getSearchResultInJSON(objInventoryStatusSearch);
			 *
			 * for ( var result in inventoryResults ) { var res =
			 * inventoryResults[result]; var listValue = res['name']; var listID =
			 * null; if(listValue == 'All') { listID = 'All'; } else if(listValue ==
			 * 'All Available') { listID = 'T' } else if(listValue == 'Not
			 * Available') { listID = 'F'; } else {
			 *  } var row1={'internalid':listID,'name':listValue};
			 * sOptionsArr.push(row1); }
			 */
			var statusList = getInventoryStatusListForOutBound(null);
			if (statusList.length > 0) {
				for (var statusItr in statusList) {
					var res = statusList[statusItr];
					var listValue = res['name'];
					var listID = res['id'];
					var listValue = res['name'];
					var listInventoryavailable = res['inventoryavailable'];
					var row1 = {
						'internalid': listID,
						'name': listValue,
						'listInventoryavailable': listInventoryavailable
					};
					sOptionsArr.push(row1);
				}
			}
			return sOptionsArr;
		}

		function getInventoryStatusListForOutBound(invtStatus_ID) {
			var inventoryStatusFeature = isInvStatusFeatureEnabled();
			if (inventoryStatusFeature) {
				var inventoryStatusSearch = search.load({
					id: 'customsearch_wmsse_getinvtstatuslst_ob'
				});
				var inventoryStatusFilters = inventoryStatusSearch.filters;
				if (_isValueValid(invtStatus_ID)) {
					inventoryStatusFilters.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: invtStatus_ID
					}));
				}
				inventoryStatusSearch.filters = inventoryStatusFilters;
				inventoryResultsArray = _getSearchResultInJSON(inventoryStatusSearch);
			}
			return inventoryResultsArray;
		}

		function getInventoryStatusOptionsList() {
			var cols = [];
			cols[0] = search.createColumn({
				name: 'name'
			});
			cols[1] = search.createColumn({
				name: 'internalId'
			});

			var objInventoryStatusSearch = search.create({
				type: 'customlist_wmsse_status_optionslst',
				columns: cols
			});

			var inventoryResults = _getSearchResultInJSON(objInventoryStatusSearch);
			return inventoryResults;
		}

		function getItemDetails(itemInternalId) {
			var itemResults = "";
			if (_isValueValid(itemInternalId)) {
				var itemDetails = search.load({
					id: 'customsearch_wmsse_inventory_itemdetails'
				});
				var itemSavedFilter = itemDetails.filters;

				itemSavedFilter.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
				itemDetails.filters = itemSavedFilter;
				itemResults = _getSearchResultInJSON(itemDetails);
			}
			return itemResults;
		}

		/*function getstatusDetails(whLocation,getItemInternalId,eneteredBinId,enteredLot,fromStatusInternalId)
		{
			var balanceSearch=search.load({id:'customsearch_wmsse_srchres_statuswise',type:search.Type.INVENTORY_BALANCE});
			if(_isValueValid(whLocation))
			{
				balanceSearch.filters.push(search.createFilter({name:'location',
					operator:search.Operator.ANYOF,
					values:whLocation}));
			}
			if(_isValueValid(getItemInternalId))
			{
				balanceSearch.filters.push(search.createFilter({name:'internalid'
					,join:'item',
					operator:search.Operator.ANYOF,
					values:getItemInternalId}));
			}
			if(_isValueValid(eneteredBinId))
			{
				balanceSearch.filters.push(search.createFilter({name:'binnumber',
					operator:search.Operator.ANYOF,
					values:eneteredBinId}));
			}
			if(_isValueValid(enteredLot))
			{
				balanceSearch.filters.push(search.createFilter({name:'inventorynumber',
					operator:search.Operator.ANYOF,
					values:enteredLot}));
			}
			if (_isValueValid(fromStatusInternalId)) {
				balanceSearch.filters.push(search.createFilter({ name :'status',
					operator: search.Operator.ANYOF,
					values: fromStatusInternalId
				}));

			}
			var StatusDetails = _getSearchResultInJSON(balanceSearch);
			return StatusDetails;
		}*/

		function isIntercompanyCrossSubsidiaryFeatureEnabled() {
			var vResult = false;
			try {
				var crossSubsidiaryFeature = runtime.isFeatureInEffect({
					feature: 'crosssubsidiaryfulfillment'
				});
				if (crossSubsidiaryFeature != null && crossSubsidiaryFeature != '' && crossSubsidiaryFeature != 'null' &&
					crossSubsidiaryFeature != 'undefined' && crossSubsidiaryFeature != false) {

					vResult = true;
				}
			} catch (e) {

				log.error({
					title: 'exception in isIntercompanyCrossSubsidiaryFeatureEnabled',
					details: e
				});
				vResult = false;
			}
			return vResult;
		}

		function isCentralizedPurchasingandBillingFeatureEnabled() {
			var vResult = false;
			try {
				var centralizedPurchasingBilling = runtime.isFeatureInEffect({
					feature: 'centralizedpurchasingbilling'
				});

				if (centralizedPurchasingBilling != null && centralizedPurchasingBilling != '' && centralizedPurchasingBilling != 'null' &&
					centralizedPurchasingBilling != 'undefined' && centralizedPurchasingBilling != false) {

					vResult = true;
				}
			} catch (e) {

				log.error({
					title: 'exception in isCentralizedPurchasingandBillingFeatureEnabled',
					details: e
				});
				vResult = false;
			}
			return vResult;
		}

		function getSubsidiaryforLocation(locationId) {
			if (locationId != null && locationId != '') {
				var locationSubsidiary = '';

				var locationResults = record.load({
					type: 'location',
					id: locationId
				});
				if (locationResults != null && locationResults != '')
					locationSubsidiary = locationResults.getValue({
						fieldId: 'subsidiary'
					});
				if (locationSubsidiary != null && locationSubsidiary != '')
					return locationSubsidiary;
				else
					return null;
			} else
				return null;
		}

		function _getInventoryDetailsFromBins(stageBins, locationId) {
			var binsInventoryDetails = search.load({
				id: 'customsearch_wmsse_binlocwise_inventory'
			});
			var binFiltersArr = binsInventoryDetails.filters;
			if (_isValueValid(stageBins)) {
				binFiltersArr.push(search.createFilter({
					name: 'binnumber',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: stageBins
				}));
			}
			if (_isValueValid(locationId)) {
				binFiltersArr.push(search.createFilter({
					name: 'location',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: locationId
				}));
			}

			binsInventoryDetails.filters = binFiltersArr;
			var inventoryDetailsFromBins = _getSearchResultInJSON(binsInventoryDetails);
			return inventoryDetailsFromBins;
		}

		function _getItemWiseStatusDetailsInBin(binInternalId, whLocationId, itemInternalId) {
			var searchObj = search.load({
				id: 'customsearch_wmsse_srchres_statuswise',
				type: search.Type.INVENTORY_BALANCE
			});

			if (_isValueValid(itemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
			}
			if (_isValueValid(whLocationId)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocationId
				}));
			}
			if (_isValueValid(binInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			var inventoryDetailsResults = _getSearchResultInJSON(searchObj);
			return inventoryDetailsResults;
		}

		function updateScheduleScriptStatus(processname, currentUserId, status, transactionInternalId, transactionType, notes, pickActionIdArray) {
			var str = 'processname. = ' + processname + '<br>';
			str = str + 'currentUserId. = ' + currentUserId + '<br>';
			str = str + 'transactionInternalId. = ' + transactionInternalId + '<br>';
			str = str + 'transactionType. = ' + transactionType + '<br>';
			str = str + 'notes. = ' + notes + '<br>';
			str = str + 'status. = ' + status + '<br>';
			str = str + 'Json_pickActionIdArray. = ' + JSON.stringify(pickActionIdArray) + '<br>';
			log.debug({
				title: 'updateScheduleScriptStatus Function Parameters',
				details: str
			});
			if ((currentUserId == null) || (currentUserId == '') || (currentUserId < 0))
				currentUserId = '';
			if (!_isValueValid(notes))
				notes = '';
			var recordId = "";
			var timeStamp = getCurrentTimeStamp();
			var parsedCurrentTime = parseTimeString(timeStamp);
			var currDate = DateStamp();
			var parsedCurrentDate = format.parse({
				value: currDate,
				type: format.Type.DATE
			});
			if (status == 'Submitted') {
				var now = new Date()
				var datetime = format.parse({
					value: now,
					type: format.Type.DATETIMETZ
				})

				var schedulestatus = record.create({
					type: 'customrecord_wmsse_schscripts_status',

				});
				schedulestatus.setValue({
					fieldId: 'name',
					value: processname
				});
				schedulestatus.setValue({
					fieldId: 'custrecord_wmsse_schprsname',
					value: processname
				});
				schedulestatus.setValue({
					fieldId: 'custrecord_wmsse_schprsstatus',
					value: status
				});
				schedulestatus.setValue({
					fieldId: 'custrecord_wmsse_schprsinitiateddatetime',
					value: datetime
				});
				schedulestatus.setValue({
					fieldId: 'custrecord_wmsse_schprstranrefno',
					value: parseInt(transactionInternalId).toString()
				});
				if (currentUserId != null && currentUserId != '') {
					schedulestatus.setValue({
						fieldId: 'custrecord_wmsse_schprsinitiatedby',
						value: currentUserId
					});
				}
				if (transactionType != null && transactionType != '') {
					schedulestatus.setValue({
						fieldId: 'custrecord_wmsse_schprstrantype',
						value: transactionType
					});
				}
				if (pickActionIdArray != null && pickActionIdArray != '') {
					schedulestatus.setValue({
						fieldId: 'custrecord_wms_schpickactionids',
						value: JSON.stringify(pickActionIdArray)
					});
				}
				recordId = schedulestatus.save();
				log.debug('recordId', recordId);
			} else if (status == 'In Progress') {
				var statusDetails = search.load({
					id: 'customsearch_wmsse_mapreduce_status'
				});
				var objFiltersArr = statusDetails.filters;

				if (currentUserId != null && currentUserId != '') {
					objFiltersArr.push(search.createFilter({
						name: 'custrecord_wmsse_schprsinitiatedby',
						operator: search.Operator.ANYOF,
						values: currentUserId
					}));
				}
				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsstatus',
					operator: search.Operator.IS,
					values: 'Submitted'
				}));
				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsname',
					operator: search.Operator.IS,
					values: processname
				}));

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprstranrefno',
					operator: search.Operator.IS,
					values: parseFloat(transactionInternalId)
				}));

				statusDetails.filters = objFiltersArr;
				var statusSearchResult = _getSearchResultInJSON(statusDetails);

				if (statusSearchResult != null && statusSearchResult != '') {
					var vid = statusSearchResult[0].id;
					log.debug('vid in In Progress', vid);
					var schStatusRecord = record.load({
						type: 'customrecord_wmsse_schscripts_status',
						id: vid
					});
					schStatusRecord.setValue({
						fieldId: 'custrecord_wmsse_schprsstatus',
						value: status
					});
					schStatusRecord.setValue({
						fieldId: 'custrecord_wmsse_schprsbegindate',
						value: parsedCurrentDate
					});
					schStatusRecord.setValue({
						fieldId: 'custrecord_wmsse_schprsbegintime',
						value: parsedCurrentTime
					});
					schStatusRecord.save();
				}
				// }
			} else if (status == 'Completed') {
				var statusDetails = search.load({
					id: 'customsearch_wmsse_mapreduce_status'
				});
				var objFiltersArr = statusDetails.filters;

				if (currentUserId != null && currentUserId != '') {
					objFiltersArr.push(search.createFilter({
						name: 'custrecord_wmsse_schprsinitiatedby',
						operator: search.Operator.ANYOF,
						values: currentUserId
					}));
				}
				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsstatus',
					operator: search.Operator.IS,
					values: 'In Progress'
				}));
				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsname',
					operator: search.Operator.IS,
					values: processname
				}));

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprstranrefno',
					operator: search.Operator.IS,
					values: parseFloat(transactionInternalId)
				}));
				statusDetails.filters = objFiltersArr;
				var statusSearchResult = _getSearchResultInJSON(statusDetails);
				if (statusSearchResult != null && statusSearchResult != '') {
					for (itr = 0; itr < statusSearchResult.length; itr++) {
						var vid = statusSearchResult[itr].id;
						log.debug('vid in In Completed', vid);

						var schStatusRecord = record.load({
							type: 'customrecord_wmsse_schscripts_status',
							id: vid
						});
						schStatusRecord.setValue({
							fieldId: 'custrecord_wmsse_schprsstatus',
							value: status
						});
						schStatusRecord.setValue({
							fieldId: 'custrecord_wmsse_schprsenddate',
							value: parsedCurrentDate
						});
						schStatusRecord.setValue({
							fieldId: 'custrecord_wmsse_schprsendtime',
							value: parsedCurrentTime
						});
						schStatusRecord.setValue({
							fieldId: 'custrecord_wmsse_schprsnotes',
							value: notes
						});
						schStatusRecord.save();

					}
				}
			}
			return recordId;
		}


		function ValidateDate(vDateString, dtsettingFlag) {
			if (vDateString != null && vDateString != '') {
				var vValidDate = format.parse({
					type: format.Type.DATE,
					value: vDateString
				});
				if (isNaN(vValidDate) || vValidDate == null || vValidDate == '')
					return null;
				else
					return vValidDate;
			} else
				return null;
		}

		function _getSerialList(binInternalId, itemInternalId, warehouseLocationId, pickStatusInternalId, getSerialNoId, inventoryDetailLotOrSerial) {
			var inventoryStatusFeature = isInvStatusFeatureEnabled();
			log.debug({
				title: 'inventoryStatusFeature',
				details: inventoryStatusFeature
			});
			log.debug({
				title: 'pickStatusInternalId',
				details: pickStatusInternalId
			});
			log.debug({
				title: 'binInternalId',
				details: binInternalId
			});
			log.debug({
				title: 'warehouseLocationId',
				details: warehouseLocationId
			});
			log.debug({
				title: 'itemInternalId',
				details: itemInternalId
			});
			var savedsearchName = "customsearch_wms_serialnumbers_noinvstat";
			if (inventoryStatusFeature) {
				savedsearchName = "customsearch_wms_serialnumber_details";
			}
			if (_isValueValid(inventoryDetailLotOrSerial))
				savedsearchName = "customsearch_wmsse_serial_details";
			var filters = [];
			var serialSearch = search.load({
				type: search.Type.INVENTORY_BALANCE,
				id: savedsearchName,
			});
			filters = serialSearch.filters;
			if (_isValueValid(itemInternalId)) {
				filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
			}
			if (_isValueValid(binInternalId)) {
				filters.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			if (_isValueValid(warehouseLocationId)) {
				filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}
			if (_isValueValid(pickStatusInternalId)) {
				filters.push(search.createFilter({
					name: 'status',
					operator: search.Operator.ANYOF,
					values: pickStatusInternalId
				}));
			}
			if (_isValueValid(getSerialNoId)) {
				filters.push(search.createFilter({
					name: 'inventorynumber',
					operator: search.Operator.ANYOF,
					values: getSerialNoId
				}));
			}

			serialSearch.filters = filters;
			return _getSearchResultInJSON(serialSearch);
		}

		/*function getAllSerials(internalId, lineNum){
			var serialSearch = search.load('customsearch_wms_get_all_serials');
			serialSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_ser_status',
				operator : search.Operator.IS,
				values : false
			}));
			serialSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_ser_ordline',
				operator : search.Operator.EQUALTO,
				values : lineNum
			}));
			serialSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_ser_ordno',
				operator : search.Operator.ANYOF,
				values : internalId
			}));
			return _getSearchResultInJSON(serialSearch);
		}*/

		/*function fnGetAllSerialsbyStatus(poInternalId,poLineno,vstatus,vAllSerialArray){
			var serialSearch = search.load({
				type : 'customrecord_wmsse_serialentry',
				id : 'customsearch_wmsse_serialentry_statussrh'
			});
			serialSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_ser_status',
				operator : search.Operator.IS,
				values : false
			}));
			if(_isValueValid(poLineno))
				serialSearch.filters.push(search.createFilter({
					name : 'custrecord_wmsse_ser_ordline',
					operator : search.Operator.EQUALTO,
					values : poLineno
				}));
			if(_isValueValid(poInternalId))
				serialSearch.filters.push(search.createFilter({
					name : 'custrecord_wmsse_ser_ordno',
					operator : search.Operator.ANYOF,
					values : poInternalId
				}));
			if(_isValueValid(vstatus))
				serialSearch.filters.push(search.createFilter({
					name : 'custrecord_serial_inventorystatus',
					operator : search.Operator.ANYOF,
					values : vstatus
				}));
			var result = _getSearchResultInJSON(serialSearch);
			return result;
		}*/

		function deleteTransactionLock(trantype, internalId, lineNo) {
			var lockSearch = search.load({
				id: 'customsearch_wmsse_lockrecs_srh'
			});

			var lockfilters = [
				search.createFilter({
					name: 'custrecord_wmsse_trantype',
					operator: search.Operator.IS,
					values: trantype
				}), search.createFilter({
					name: 'custrecord_wmsse_order',
					operator: search.Operator.ANYOF,
					values: internalId
				}), search.createFilter({
					name: 'custrecord_wmsse_line',
					operator: search.Operator.EQUALTO,
					values: lineNo
				}), search.createFilter({
					name: 'custrecord_wmsse_lockflag',
					operator: search.Operator.IS,
					values: true
				})
			];

			lockSearch.filters = lockSearch.filters.concat(lockfilters);
			lockSearchRes = _getSearchResultInJSON(lockSearch);
			for (var i in lockSearchRes) {
				if (lockSearchRes[i]) {
					var lockDeleteRecordId = record.delete({
						type: 'customrecord_wmsse_lockrecs',
						id: lockSearchRes[i].id
					});
				}
			}
		}

		/*	function fnGetInventoryBinsForBinPutaway(strLocation,ItemInternalId,binnumber) {

			var searchObj = search.load({ id : 'customsearch_wmsse_getinvtentoryitembins',
				type:search.Type.INVENTORY_BALANCE});

			if (_isValueValid(strLocation)) {
				searchObj.filters.push(search.createFilter({ name :'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (_isValueValid(ItemInternalId)) {
				searchObj.filters.push(search.createFilter({ name :'item',
					operator: search.Operator.ANYOF,
					values: ItemInternalId
				}));
			}

			searchObj.filters.push(search.createFilter({ name :'onhand',
				operator: search.Operator.GREATERTHAN,
				values: 0
			}));

			var alltaskresults = _getSearchResultInJSON(searchObj);
			var binLocArr = [];

			if (alltaskresults.length > 0) {
				for (var f = 0; f < alltaskresults.length; f++) {
					var binnumber = alltaskresults[f]['binnumber'];
					if (binLocArr.indexOf(binnumber) == -1) {
						binLocArr.push(binnumber);
					}
				}
			}

			return binLocArr;
		}*/


		function fnGetInventoryBinsForLotForBinPutaway(strLocation, strLot, ItemInternalId, binnumber) {
			var searchObj = search.load({
				id: 'customsearch_wms_getlotbins',
				type: search.Type.INVENTORY_BALANCE
			});
			if (_isValueValid(strLocation)) {
				searchObj.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (_isValueValid(ItemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: ItemInternalId
				}));
			}
			if (_isValueValid(binnumber)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: binnumber
				}));
			}


			searchObj.filters.push(search.createFilter({
				name: 'onhand',
				operator: search.Operator.GREATERTHAN,
				values: 0
			}));
			var lotresults = _getSearchResultInJSON(searchObj);
			var binLocArr = [];
			log.debug({
				title: 'lotresults',
				details: lotresults
			});

			if (lotresults.length > 0) {
				var entLot = '';
				if (_isValueValid(strLot)) {
					entLot = strLot; // inventoryNumberInternalId(strLot,strLocation,ItemInternalId);
				}
				for (var f = 0; f < lotresults.length; f++) {
					var invtNumber = lotresults[f]['inventorynumberText'];
					var binnumber = lotresults[f]['binnumber'];
					if (strLot == invtNumber) {
						if (binLocArr.indexOf(binnumber) == -1) {
							var otherLotInSameBinExists = false;
							// the below code to check the other lots in the same
							// bin when mixlot is false
							for (var f1 = 0; f1 < lotresults.length; f1++) {
								var lotStr = lotresults[f1]['inventorynumberText'];
								var lotBinnumber = lotresults[f1]['binnumber'];
								if (lotBinnumber == binnumber && lotStr != strLot) {
									otherLotInSameBinExists = true;
									break;
								}
							}
							if (!otherLotInSameBinExists) {
								binLocArr.push(lotresults[f]['binnumber']);
							}
						}
					}
				}
			}
			log.debug({
				title: 'lotresultsbinLocArr',
				details: binLocArr
			});
			return binLocArr;
		}


		/*
	// Function to get Bins and InternalIds
	function getPutBinAndIntDetailsForBinPutawayWithBinSequence(objPutBinQueryDetails) {

		log.debug({title:'objPutBinQueryDetails',details:objPutBinQueryDetails});
		var getItemInternalId =objPutBinQueryDetails['itemInternalId'];
		var strItemGrp = objPutBinQueryDetails['itemGroup'];
		var  strItemFam = objPutBinQueryDetails['itemFamily'];
		var blnMixItem = objPutBinQueryDetails['blnMixItem'];
		var blnMixLot = objPutBinQueryDetails['blnMixLot'];
		var getPreferBin = objPutBinQueryDetails['preferedBinName'];
		var strLocation = objPutBinQueryDetails['warehouseLocationId'];
		var itemType =  objPutBinQueryDetails['itemType'];
		var strLot = objPutBinQueryDetails['lotName'];
		var strItemDepartment= objPutBinQueryDetails['department'];
		var strItemClass = objPutBinQueryDetails['class'];
		var strvUnits = objPutBinQueryDetails['transcationUomInternalId'];
		var makeInvAvailFlagFromSelect = objPutBinQueryDetails['makeInvAvailFlagFromSelect'];
		var  fromBinInternalId = objPutBinQueryDetails['fromBinInternalId'];
		var selectedUOMText = objPutBinQueryDetails['selectedUOMText'];
		var preferBinInternalId = objPutBinQueryDetails["preferedBinInternalId"];
		var inventoryStatusFeature = isInvStatusFeatureEnabled();

		var invstatusarray=[];
		var vTotalBinArr = [];
		if(inventoryStatusFeature == true && _isValueValid(makeInvAvailFlagFromSelect)==true)
		{
			if(makeInvAvailFlagFromSelect == 'T' || makeInvAvailFlagFromSelect == 'F')
			{
				invstatusarray=_getInventoryAvailableStatusFromCore(makeInvAvailFlagFromSelect);
			}
			else
			{
				invstatusarray.push('@NONE@');
				invstatusarray.push(makeInvAvailFlagFromSelect);
			}
		}

		if(_isValueValid(preferBinInternalId) && preferBinInternalId != fromBinInternalId){
			var	preferBinZone ='';
			var fields = ['custrecord_wmsse_zone'];
			var binRec = search.lookupFields({
				type: 'Bin',
				id: preferBinInternalId,
				columns: fields
			});
			if (_isValueValid(binRec)) {
				if(binRec.custrecord_wmsse_zone[0] != undefined)
				{
					preferBinZone = binRec.custrecord_wmsse_zone[0].text;
				}
			}
			var filterPreferBin = [];
			var objBinPreferBinDetails =  [];

			if (_isValueValid(strLocation))
			{
				filterPreferBin.push(search.createFilter({
					name: 'location', operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}

			filterPreferBin.push(search.createFilter({
				name: 'binnumber', operator: search.Operator.ANYOF,
				values: preferBinInternalId
			}));
			if(_isValueValid(fromBinInternalId))
			{
				filterPreferBin.push(search.createFilter({
					name: 'binnumber', operator: search.Operator.NONEOF,
					values: fromBinInternalId
				}));
			}

			var objPreferBinDetailsSearch = search.load({
				id: 'customsearch_wmsse_srchres_preferbin',
				type:search.Type.INVENTORY_BALANCE
			});

			var  savedFilters = objPreferBinDetailsSearch.filters;
			objPreferBinDetailsSearch.filters = savedFilters.concat(filterPreferBin);
			objBinPreferBinDetails = _getSearchResultInJSON(objPreferBinDetailsSearch);

			var preferBinArr = [];
//			log.debug({title:'objBinPreferBinDetails',details:objBinPreferBinDetails});
			if (objBinPreferBinDetails.length > 0) {
				var selectedConvRate = objPutBinQueryDetails['selectedConversionRate'];
				var currentConvRate = objPutBinQueryDetails['stockConversionRate'];
				var strBin = '';
				var strBinId = '';
				var invStatus = '';
				var invStatusId = '';
				var vBinQtyAvail = '';
				var binQtyAvailWithUOM = '';

				for (var p = 0; p < objBinPreferBinDetails.length; p++) {
					strBin = objBinPreferBinDetails[p]['binnumberText'];
					strBinId = objBinPreferBinDetails[p]['binnumber'];
					invStatus = objBinPreferBinDetails[p]['statusText'];
					invStatusId = objBinPreferBinDetails[p]['status'];
					vBinQtyAvail = objBinPreferBinDetails[p]['onhand'];
					binQtyAvailWithUOM = vBinQtyAvail;// + "
					// "+selectedUOMText;
					if(_isValueValid(selectedUOMText))
					{
						binQtyAvailWithUOM = vBinQtyAvail+ " "+selectedUOMText;
					}
					if(_isValueValid(vBinQtyAvail) && _isValueValid(selectedConvRate) && _isValueValid(currentConvRate)
							&& (selectedConvRate != currentConvRate))
					{
						vBinQtyAvail = uomConversions(vBinQtyAvail,selectedConvRate,currentConvRate);
						if(vBinQtyAvail > 0)
						{
							binQtyAvailWithUOM = vBinQtyAvail + " "+selectedUOMText;
						}
					}

					if(parseFloat(vBinQtyAvail)==0 && preferBinArr.indexOf(strBinId) == -1)
					{
						invStatus = '';
						preferBinArr.push(strBinId);
						var currentRowValues = {'binName':strBin,'binInternalId':strBinId,'statusName':invStatus,
								'statusInternalId':invStatusId,'quantity':vBinQtyAvail,'zone':preferBinZone,
								'quantityWithUOM':binQtyAvailWithUOM};
						vTotalBinArr.push(currentRowValues);
					}
					else if(parseFloat(vBinQtyAvail)>0)
					{
						var currentRowValues = {'binName':strBin,'binInternalId':strBinId,'statusName':invStatus,
								'statusInternalId':invStatusId,'quantity':vBinQtyAvail,'zone':preferBinZone,
								'quantityWithUOM':binQtyAvailWithUOM};
						vTotalBinArr.push(currentRowValues);
					}


				}
			}
			else{
				var invStatus ='';
				var invStatusId ='';
				var vBinQtyAvail =0;
				var currentRowValues = {'binName':getPreferBin,'binInternalId':preferBinInternalId,'statusName':invStatus,
						'statusInternalId':invStatusId,'quantity':vBinQtyAvail,'zone':preferBinZone,'quantityWithUOM':vBinQtyAvail};
				vTotalBinArr.push(currentRowValues);
			}
		}

		var vBinLocArr = [];
		var mixItemBinsArr = [];
		var vPutZoneArr = [];
		var filters = [];
		var columns = [];

		var binZoneArr = [];
		if (_isValueValid(fromBinInternalId)) {
			vBinLocArr.push(fromBinInternalId);
		}
		var objPutstrategiesSearchObj = search.load({
			id: 'customsearch_wmsse_putstrategies_srh'
		});
		filters = objPutstrategiesSearchObj.filters;

		if (_isValueValid(getItemInternalId))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_item',
				operator: search.Operator.ANYOF,
				values: ['@NONE@', getItemInternalId]
			}));
		}
		if (_isValueValid(strItemGrp))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_itemgroup', operator: search.Operator.ANYOF,
				values: ['@NONE@', strItemGrp]
			}));
		}
		else
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_itemgroup', operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
		}
		if (_isValueValid(strItemFam))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_itemfamily', operator: search.Operator.ANYOF,
				values: ['@NONE@', strItemFam]
			}));
		}
		else
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_itemfamily', operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
		}
		if (_isValueValid(strLocation))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_location', operator: search.Operator.ANYOF,
				values: ['@NONE@', strLocation]
			}));
		}
		else
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_location', operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
		}

		if (_isValueValid(strItemClass))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_put_class', operator: search.Operator.ANYOF,
				values: ['@NONE@', strItemClass]
			}));
		}
		else
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_put_class', operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
		}
		if (_isValueValid(strItemDepartment))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_put_department', operator: search.Operator.ANYOF,
				values: ['@NONE@', strItemDepartment]
			}));
		}
		else
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_put_department', operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
		}
		if (_isValueValid(strvUnits))
		{
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_put_units', operator: search.Operator.ANYOF,
				values: ['@NONE@', strvUnits]
			}));
		}
		if(inventoryStatusFeature==true && invstatusarray.length > 0)
		{
			filters.push(search.createFilter({name:'custrecord_wmsse_put_invstatus',
				operator: search.Operator.ANYOF,
				values: invstatusarray}));
		}

		objPutstrategiesSearchObj.filters = filters;

		var objPutstrategies = _getSearchResultInJSON(objPutstrategiesSearchObj);
		if (objPutstrategies.length > 0) {
			var mixItemsInBins = true;
			if(itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")
			{
				if((blnMixItem == false ||  blnMixItem == 'false') && (blnMixLot == 'false' || blnMixLot == false) )
				{
					mixItemsInBins = false;
				}
			}
			else
			{
				if((blnMixItem == false ||  blnMixItem == 'false'))
				{
					mixItemsInBins = false;
				}
			}

			log.debug({title:'objPutstrategies',details:objPutstrategies.length});
			if (mixItemsInBins == false &&
					(itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
				var binLocArr = fnGetInventoryBinsForLotForBinPutaway(strLocation,strLot,getItemInternalId,null);
				if(binLocArr.length > 0)
				{
					for(var bin= 0 ; bin < binLocArr.length; bin++)
					{
						mixItemBinsArr.push(binLocArr[bin]);
					}
				}
			}
			else
			{
				if (!mixItemsInBins) {
					var binLocArr = fnGetInventoryBinsForBinPutaway(strLocation,getItemInternalId,null);
					if(binLocArr.length > 0)
					{
						for(var bin = 0 ; bin < binLocArr.length; bin++)
						{
							mixItemBinsArr.push(binLocArr[bin]);
						}
					}
				}
			}
			for (var i = 0; i < objPutstrategies.length; i++) {
				var vBinLocIdArr=[];
				var vBinArr = [];
				var BinIdArr =[];
				var strPutZone = objPutstrategies[i]['custrecord_wmsse_putzone'];
				if (!_isValueValid(strPutZone))
				{
					strPutZone = "-None-";
				}
				if (strPutZone != null && strPutZone != '' && vPutZoneArr.indexOf(strPutZone) == -1) {

					vPutZoneArr.push(strPutZone);

					var filterStrat = [];

					filterStrat.push(search.createFilter({
						name: 'inactive', operator: search.Operator.IS,
						values: false
					}));

					if (_isValueValid(strPutZone)&& strPutZone != '-None-')
					{
						filterStrat.push(search.createFilter({
							name: 'custrecord_wmsse_zone', operator: search.Operator.ANYOF,
							values: strPutZone
						}));
					}

					if (_isValueValid(strLocation))
					{
						filterStrat.push(search.createFilter({
							name: 'location', operator: search.Operator.ANYOF,
							values: strLocation
						}));
					}

					var objBinDetailsSearch = search.load({id: 'customsearch_wmsse_binsbyzones'});
					var  savedFilters = objBinDetailsSearch.filters;
					objBinDetailsSearch.filters = savedFilters.concat(filterStrat);
					var objBinDetails = _getSearchResultInJSON(objBinDetailsSearch);//
					if (objBinDetails.length > 0) {

						for (var j = 0; j < objBinDetails.length; j++) {

							if (objBinDetails[j]['binnumber'] != getPreferBin &&
									vBinLocArr.indexOf(objBinDetails[j]['internalid']) == -1)
							{
								vBinLocIdArr.push(objBinDetails[j]['internalid']);
								vBinArr.push(objBinDetails[j]['binnumber']);
								binZoneArr.push(objBinDetails[j]['custrecord_wmsse_zoneText']);
							}

						}

						var filterInvBal = [];
						var objBinDetails =  [];
						if(vBinLocIdArr.length > 0)
						{
							if (strLocation != null && strLocation != '')
								filterInvBal.push(search.createFilter({
									name: 'location', operator: search.Operator.ANYOF,
									values: strLocation
								}));

							filterInvBal.push(search.createFilter({
								name: 'binnumber', operator: search.Operator.ANYOF,
								values: vBinLocIdArr
							}));

							var objBinDetailsSearch = search.load({
								id: 'customsearch_wms_invbal_getstatuswise',
								type:search.Type.INVENTORY_BALANCE
							});

							var  savedFilters = objBinDetailsSearch.filters;
							objBinDetailsSearch.filters = savedFilters.concat(filterInvBal);
							objBinDetails = _getSearchResultInJSON(objBinDetailsSearch);
						}

						// log.debug({title:'objBinDetails',details:objBinDetails});
						if (objBinDetails.length > 0) {
							var selectedConvRate = objPutBinQueryDetails['selectedConversionRate'];
							var currentConvRate =  objPutBinQueryDetails['stockConversionRate'];
							var strBin = '';
							var strBinId = '';
							var invStatus = '';
							var invStatusId = '';
							var vBinQtyAvail = '';
							var binQtyAvailWithUOM = '';
							var binIndex = '';
							var zone = '';
							var isValidBin = true;
							var invtItem = '';
							var isEmptyBin = true;
							for (var vPutBin = 0; vPutBin < vBinLocIdArr.length; vPutBin++) {
								var mBin = vBinLocIdArr[vPutBin];
								isEmptyBin = true;
								for (var vPutBinDtls = 0; vPutBinDtls < objBinDetails.length; vPutBinDtls++) {
									strBinId = objBinDetails[vPutBinDtls]['binnumber'];

									if(strBinId == mBin)
									{
										isEmptyBin = false;
										isValidBin = true;
										strBin = objBinDetails[vPutBinDtls]['binnumberText'];

										invtItem = objBinDetails[vPutBinDtls]['item'];
										if(!mixItemsInBins)
										{
											// log.debug({title:'mixItemBinsArr',details:mixItemBinsArr});
											BinIdArr.push(strBinId);
											if(invtItem != getItemInternalId || mixItemBinsArr.indexOf(strBinId) == -1 )
											{
												isValidBin = false;

											}
											else
											{
												var strBinId1 ='';
												var invtItem1 ='';
												for(var p=0;p<objBinDetails.length;p++)
												{
													strBinId1 = objBinDetails[p]['binnumber'];
													invtItem1 = objBinDetails[p]['item'];
													if(strBinId1 == strBinId && invtItem1 != getItemInternalId )
													{
														isValidBin = false;
														break;
													}
												}
											}
										}
										if(isValidBin)
										{
											invStatus = objBinDetails[vPutBinDtls]['statusText'];
											invStatusId = objBinDetails[vPutBinDtls]['status'];
											vBinQtyAvail = objBinDetails[vPutBinDtls]['onhand'];
											binQtyAvailWithUOM = vBinQtyAvail;// + "
											// "+selectedUOMText;
											if(_isValueValid(selectedUOMText))
											{
												binQtyAvailWithUOM = vBinQtyAvail+ " "+selectedUOMText;
											}
											else
											{
												selectedUOMText = '';
											}
											if(_isValueValid(vBinQtyAvail) && _isValueValid(selectedConvRate) &&
													_isValueValid(currentConvRate)
													&& (selectedConvRate != currentConvRate))
											{
												vBinQtyAvail = uomConversions(vBinQtyAvail,selectedConvRate,currentConvRate);
												if(vBinQtyAvail > 0)
												{
													binQtyAvailWithUOM = vBinQtyAvail + " "+selectedUOMText;
												}
											}
											var binNumberIndex = BinIdArr.indexOf(strBinId);
											if(binNumberIndex == -1)
											{
												BinIdArr.push(strBinId);
												vBinLocArr.push(strBinId);
												binIndex = vBinLocIdArr.indexOf(strBinId);
												zone = binZoneArr[binIndex];
												var currentRowValues = {'binName':strBin,'binInternalId':strBinId,'statusName':invStatus,
														'statusInternalId':invStatusId,'quantity':vBinQtyAvail,'zone':zone,
														'quantityWithUOM':binQtyAvailWithUOM};
												vTotalBinArr.push(currentRowValues);
											}
											else
											{
												if(!inventoryStatusFeature)
												{
													var binNumberQty = vTotalBinArr[binNumberIndex]['quantity'];
													var totalQuantity = Number(Big(vBinQtyAvail).plus(binNumberQty));
													vTotalBinArr[binNumberIndex]['quantity'] = totalQuantity;
													if(totalQuantity > 0)
													{
														var binQtyAvailWithUOM1 = totalQuantity + " "+selectedUOMText;
														vTotalBinArr[binNumberIndex]['quantityWithUOM'] = binQtyAvailWithUOM1;
													}
												}
												else
												{
													var binFound = false;
													for(var row in vTotalBinArr)
													{
														var currBinRow = vTotalBinArr[row];
														var binLocId = currBinRow['binInternalId'];
														var binStatusId = currBinRow['statusInternalId'];
														if(binLocId == strBinId && invStatusId == binStatusId)
														{
															binFound = true;
															var binNumberQty = currBinRow['quantity'];
															var totalQuantity = Number(Big(vBinQtyAvail).plus(binNumberQty));
															vTotalBinArr[row]['quantity'] = totalQuantity;
															if(totalQuantity > 0)
															{
																var binQtyAvailWithUOM1 = totalQuantity + " "+selectedUOMText;
																vTotalBinArr[row]['quantityWithUOM'] = binQtyAvailWithUOM1;
															}
															break;
														}
													}
													if(!binFound)
													{
														BinIdArr.push(strBinId);
														vBinLocArr.push(strBinId);
														binIndex = vBinLocIdArr.indexOf(strBinId);
														zone = binZoneArr[binIndex];
														var currentRowValues = {'binName':strBin,'binInternalId':strBinId,'statusName':invStatus,
																'statusInternalId':invStatusId,'quantity':vBinQtyAvail,'zone':zone,
																'quantityWithUOM':binQtyAvailWithUOM};
														vTotalBinArr.push(currentRowValues);
													}

												}
											}
										}
									}
								}

								if(isEmptyBin)
								{
									vBinLocArr.push(vBinLocIdArr[vPutBin]);
									binIndex = vBinLocIdArr.indexOf(vBinLocIdArr[vPutBin]);
									zone = binZoneArr[binIndex];
									var currentRowValues = {'binName':vBinArr[vPutBin],'binInternalId':vBinLocIdArr[vPutBin],
											'statusName':'','statusInternalId':'','quantity':'0','quantityWithUOM':'0','zone':zone};
									vTotalBinArr.push(currentRowValues);
								}
							}
						}
						else
						{
							for (var vPutBin = 0; vPutBin < vBinLocIdArr.length; vPutBin++) {

								vBinLocArr.push(vBinLocIdArr[vPutBin]);
								binIndex = vBinLocIdArr.indexOf(vBinLocIdArr[vPutBin]);
								zone = binZoneArr[binIndex];
								var currentRowValues = {'binName':vBinArr[vPutBin],'binInternalId':vBinLocIdArr[vPutBin],
										'statusName':'','statusInternalId':'','quantity':'0','quantityWithUOM':'0','zone':zone};
								vTotalBinArr.push(currentRowValues);
							}
						}


	 * var blnEmpty = true; var binIndex = ''; var zone =
	 * ''; for (var vPutBin = 0; vPutBin <
	 * vBinLocIdArr.length; vPutBin++) { blnEmpty = true;
	 * for (var vInvBal = 0; vInvBal < BinIdArr.length;
	 * vInvBal++) { if (BinIdArr[vInvBal] ==
	 * vBinLocIdArr[vPutBin]) { blnEmpty = false; } } if
	 * (blnEmpty) { vBinLocArr.push(vBinLocIdArr[vPutBin]);
	 * binIndex =
	 * vBinLocIdArr.indexOf(vBinLocIdArr[vPutBin]); zone =
	 * binZoneArr[binIndex]; var currentRowValues =
	 * {'binName':vBinArr[vPutBin],'binInternalId':vBinLocIdArr[vPutBin],
	 * 'statusName':'','statusInternalId':'','quantity':'0','quantityWithUOM':'0','zone':zone};
	 * vTotalBinArr.push(currentRowValues);
	 *  } }


						if (strPutZone != null && strPutZone != '' && strPutZone == '-None-') {
							break;
						}
					}
				}


			}
		}
		log.debug({title:'vTotalBinArr length',details:vTotalBinArr.length});
		return vTotalBinArr;

	}*/


		function SortByItem(x, y) {
			return x.sortByItem === y.sortByItem ? x.sortBySeq - y.sortBySeq : x.sortByItem - y.sortByItem;
		}

		function SortByZone(x, y) {
			return x.sortByZoneIndex === y.sortByZoneIndex ? x.sortBySeqIndex - y.sortBySeqIndex : x.sortByZoneIndex - y.sortByZoneIndex;
		}

		function _fnGetItemInventoryBins(strLocation, ItemInternalId) {
			var itemBinDetailsSearch = search.load({
				id: 'customsearch_wmsse_srchres_statuswise',
				type: search.Type.INVENTORY_BALANCE
			});
			var filterInvBal = itemBinDetailsSearch.filters;
			if (_isValueValid(strLocation)) {
				itemBinDetailsSearch.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (_isValueValid(ItemInternalId)) {
				itemBinDetailsSearch.filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: ItemInternalId
				}));
			}

			var search_page_count = 1000;
			var itemBinDetails = [];
			var myPagedData = itemBinDetailsSearch.runPaged({
				pageSize: search_page_count
			});
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					itemBinDetails.push(result);
				});
			});

			var binLocArr = [];
			var binStatusArr = [];
			var binStatusStringArr = {};
			var itemBinLength = itemBinDetails.length;
			var binArray = [];
			if (itemBinDetails.length > 0) {
				for (var f = 0; f < itemBinLength; f++) {
					var itemBinId = itemBinDetails[f].getValue({
						name: 'binnumber',
						summary: 'group'
					});
					if (_isValueValid(itemBinId) && binLocArr.indexOf(itemBinId) == -1) {
						binLocArr.push(itemBinId);
					}
					var obj = {
						'status': itemBinDetails[f].getText({
							name: 'status',
							summary: 'group'
						}),
						'statusId': itemBinDetails[f].getValue({
							name: 'status',
							summary: 'group'
						}),
						'quantity': itemBinDetails[f].getValue({
							name: 'onhand',
							summary: 'sum'
						})
					};
					binArray.push(obj);
					binStatusStringArr[itemBinId] = binArray;
				}

				binStatusArr[0] = binLocArr;
				binStatusArr[1] = binStatusStringArr;
			}
			return binStatusArr;
		}

		// Function get preferBinDetails for putStratagie
		function _getputStratagiePreferBinDetails(preferBinInternalId, strLocation, fromBinInternalId, fromStatusId, objPutBinQueryDetails) {
			var preferBinDetailsObj = [];
			var selectedUOMText = objPutBinQueryDetails['selectedUOMText'];
			var getPreferBin = objPutBinQueryDetails['preferedBinName'];
			if (_isValueValid(preferBinInternalId)) {
				var inventoryStatusFeature = isInvStatusFeatureEnabled();
				var preferBinZone = '';
				var fields = ['custrecord_wmsse_zone'];
				var binRec = search.lookupFields({
					type: 'Bin',
					id: preferBinInternalId,
					columns: fields
				});
				if (_isValueValid(binRec)) {
					if (binRec.custrecord_wmsse_zone[0] != undefined) {
						preferBinZone = binRec.custrecord_wmsse_zone[0].text;
					}
				}

				var filterPreferBin = [];
				var objBinPreferBinDetails = [];
				var inventoryStatusArr = [];
				if (_isValueValid(strLocation)) {
					filterPreferBin.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: strLocation
					}));
				}
				filterPreferBin.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: preferBinInternalId
				}));
				if (_isValueValid(fromBinInternalId)) {
					filterPreferBin.push(search.createFilter({
						name: 'binnumber',
						operator: search.Operator.NONEOF,
						values: fromBinInternalId
					}));
				}
				/*if( inventoryStatusFeature && _isValueValid(fromStatusId) && fromStatusId != 'All')
				{
					filterPreferBin.push(search.createFilter({
						name: 'status',operator: search.Operator.ANYOF,
						values: fromStatusId
					}));
				}*/
				var objPreferBinDetailsSearch = search.load({
					id: 'customsearch_wmsse_srchres_preferbin',
					type: search.Type.INVENTORY_BALANCE
				});
				var savedFilters = objPreferBinDetailsSearch.filters;
				objPreferBinDetailsSearch.filters = savedFilters.concat(filterPreferBin);
				//objBinPreferBinDetails = _getSearchResultInJSON(objPreferBinDetailsSearch);

				var search_page_count = 1000;
				var myPagedData = objPreferBinDetailsSearch.runPaged({
					pageSize: search_page_count
				});
				myPagedData.pageRanges.forEach(function (pageRange) {
					var myPage = myPagedData.fetch({
						index: pageRange.index
					});
					myPage.data.forEach(function (result) {
						objBinPreferBinDetails.push(result);
					});
				});
				log.debug({
					title: 'objBinPreferBinDetails',
					details: objBinPreferBinDetails
				});
				var preferBinArr = [];
				if (objBinPreferBinDetails.length > 0) {

					var selectedConvRate = objPutBinQueryDetails.selectedConversionRate;
					var currentConvRate = objPutBinQueryDetails.stockConversionRate;
					for (var p in objBinPreferBinDetails) {
						var strBin = objBinPreferBinDetails[p].getText({
							name: 'binnumber',
							summary: 'group'
						});
						var strBinId = objBinPreferBinDetails[p].getValue({
							name: 'binnumber',
							summary: 'group'
						});;
						var invStatus = objBinPreferBinDetails[p].getText({
							name: 'status',
							summary: 'group'
						});
						var invStatusId = objBinPreferBinDetails[p].getValue({
							name: 'status',
							summary: 'group'
						});
						var vBinQtyAvail = objBinPreferBinDetails[p].getValue({
							name: 'onhand',
							summary: 'sum'
						});
						var binQtyAvailWithUOM = vBinQtyAvail;


						if (invStatusId == fromStatusId || inventoryStatusFeature == false || fromStatusId == 'All' || !_isValueValid(fromStatusId)) {
							if (_isValueValid(selectedUOMText)) {
								binQtyAvailWithUOM = vBinQtyAvail + " " + selectedUOMText;
							}
							if (_isValueValid(vBinQtyAvail) && _isValueValid(selectedConvRate) && _isValueValid(currentConvRate) &&
								(selectedConvRate != currentConvRate)) {
								vBinQtyAvail = uomConversions(vBinQtyAvail, selectedConvRate, currentConvRate);
								if (vBinQtyAvail > 0) {
									binQtyAvailWithUOM = vBinQtyAvail + " " + selectedUOMText;
								}
							}
							var zone = '';
							if (parseFloat(vBinQtyAvail) == 0 && preferBinArr.indexOf(strBinId) == -1) {
								invStatus = '';
								preferBinArr.push(strBinId);
								var currentRowValues = {
									'binName': strBin,
									'binInternalId': strBinId,
									'statusName': invStatus,
									'statusInternalId': invStatusId,
									'quantity': vBinQtyAvail,
									'zone': preferBinZone,
									'quantityWithUOM': binQtyAvailWithUOM,
									'sortByItem': 0,
									'sortBySeq': 0
								};
								preferBinDetailsObj.push(currentRowValues);
							} else if (parseFloat(vBinQtyAvail) > 0) {
								var currentRowValues = {
									'binName': strBin,
									'binInternalId': strBinId,
									'statusName': invStatus,
									'statusInternalId': invStatusId,
									'quantity': vBinQtyAvail,
									'zone': preferBinZone,
									'quantityWithUOM': binQtyAvailWithUOM,
									'sortByItem': 0,
									'sortBySeq': 0
								};
								preferBinDetailsObj.push(currentRowValues);
							} else {}
						}
					}
				} else {

					var invStatus = '';
					var invStatusId = '';
					var vBinQtyAvail = 0;
					var currentRowValues = {
						'binName': getPreferBin,
						'binInternalId': preferBinInternalId,
						'statusName': invStatus,
						'statusInternalId': invStatusId,
						'quantity': vBinQtyAvail,
						'zone': preferBinZone,
						'quantityWithUOM': vBinQtyAvail,
						'sortByItem': 0,
						'sortBySeq': 0
					};
					preferBinDetailsObj.push(currentRowValues);

				}
			}
			log.debug({
				title: 'preferBinDetailsObj[p]',
				details: preferBinDetailsObj
			});
			return preferBinDetailsObj;
		}

		function _getPutStratagies(getItemInternalId, strItemGrp, strItemFam, strLocation, strItemClass, strItemDepartment, strvUnits, fromStatusId, inventoryStatusFeature, classification) {
			var filters = [];
			var objPutstrategiesSearchObj = search.load({
				id: 'customsearch_wmsse_putstrategies_srh'
			});
			filters = objPutstrategiesSearchObj.filters;

			if (_isValueValid(getItemInternalId)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_item',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', getItemInternalId]
				}));
			}
			if (_isValueValid(strItemGrp)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_itemgroup',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', strItemGrp]
				}));
			} else {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_itemgroup',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}
			if (_isValueValid(strItemFam)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_itemfamily',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', strItemFam]
				}));
			} else {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_itemfamily',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}
			if (_isValueValid(strLocation)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			} else {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_location',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}

			if (_isValueValid(strItemClass)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_put_class',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', strItemClass]
				}));
			} else {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_put_class',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}
			if (_isValueValid(strItemDepartment)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_put_department',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', strItemDepartment]
				}));
			} else {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_put_department',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}
			if (_isValueValid(strvUnits)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_put_units',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', parseInt(strvUnits)]
				}));
			}
			if (inventoryStatusFeature) {
				if (_isValueValid(fromStatusId) && fromStatusId != 'All') {
					filters.push(search.createFilter({
						name: 'custrecord_wmsse_put_invstatus',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', fromStatusId]
					}));
				}
			}
			if (_isValueValid(classification)) {
				var classificationId = _getABCVelocityId(classification);
				if (classificationId != '') {
					filters.push(search.createFilter({
						name: 'custrecord_wmsse_abcvelocity',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', classificationId]
					}));
				} else {
					filters.push(search.createFilter({
						name: 'custrecord_wmsse_abcvelocity',
						operator: search.Operator.ANYOF,
						values: ['@NONE@']
					}));
				}

			} else {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_abcvelocity',
					operator: search.Operator.ANYOF,
					values: ['@NONE@']
				}));
			}

			objPutstrategiesSearchObj.filters = filters;
			var objPutstrategies = _getSearchResultInJSON(objPutstrategiesSearchObj);

			return objPutstrategies;
		}

		function _getABCVelocityId(locationinvtclassification) {
			var abcVelocityFilters = [];
			var id = '';
			abcVelocityFilters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: locationinvtclassification
			}));

			var abcVelocityListSearch = search.create({
				type: 'customlist_wmsse_abcvelocity',
				columns: [{
					name: 'internalid'
				}],
				filters: abcVelocityFilters
			});
			var abcVelocityList = abcVelocityListSearch.run().getRange({
				start: 0,
				end: 1000
			});

			if (abcVelocityList != null && abcVelocityList != undefined && abcVelocityList.length > 0) {
				id = abcVelocityList[0].getValue('internalid');
			}

			return id;
		}

		// Function to get mixItemFalg
		function _getMixFlag(itemType, blnMixItem, blnMixLot) {
			var mixItemsInBins = true;
			if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
				if (blnMixLot == 'false' || blnMixLot == false) {
					mixItemsInBins = false;
				}
			} else {
				if ((blnMixItem == false || blnMixItem == 'false')) {
					mixItemsInBins = false;
				}
			}
			return mixItemsInBins;
		}
		// Function to get invent
		function _getOtherItemBinsForMixFlagFalse(mixItemsInBins, strLocation, getItemInternalId, BinsArray) {
			var itemBinsArray = [];
			itemBinsArray = BinsArray;
			if (!mixItemsInBins) {
				if (itemBinsArray.length > 0) {
					var objOtherItemBinDetailsSearch = search.load({
						id: 'customsearch_wmsse_srchres_statuswise',
						type: search.Type.INVENTORY_BALANCE
					});
					var filterInvBal = objOtherItemBinDetailsSearch.filters;
					if (_isValueValid(strLocation)) {
						filterInvBal.push(search.createFilter({
							name: 'location',
							operator: search.Operator.ANYOF,
							values: strLocation
						}));
					}

					filterInvBal.push(search.createFilter({
						name: 'item',
						operator: search.Operator.NONEOF,
						values: getItemInternalId
					}));
					filterInvBal.push(search.createFilter({
						name: 'binnumber',
						operator: search.Operator.ANYOF,
						values: itemBinsArray
					}));
					objOtherItemBinDetailsSearch.filters = filterInvBal;
					var objOtherItemBinDetails = _getSearchResultInJSON(objOtherItemBinDetailsSearch);
					if (objOtherItemBinDetails.length > 0) {
						for (var row in objOtherItemBinDetails) {
							var otherItemBin = objOtherItemBinDetails[row]['binnumber'];
							if (_isValueValid(otherItemBin)) {
								var otherItembinIndex = itemBinsArray.indexOf(otherItemBin);
								if (otherItembinIndex != -1) {
									itemBinsArray.splice(otherItembinIndex, 1);
								}
							}
						}
					}
				}
			}
			return itemBinsArray;
		}

		function _getItemInventory(strLocation, getItemInternalId, itemType, strLot, mixItemsInBins) {
			var itemBinsArray = _fnGetItemInventoryBins(strLocation, getItemInternalId);
			if (itemBinsArray.length > 0) {
				var itemBinArr = itemBinsArray[0];
				var itemBinArrAfterMixFlagChk = [];
				if (!mixItemsInBins) {
					if (itemBinArr.length > 0) {
						itemBinArrAfterMixFlagChk = _getOtherItemBinsForMixFlagFalse(mixItemsInBins, strLocation, getItemInternalId, itemBinArr);
						log.debug({
							title: 'itemBinArr after mixflag',
							details: itemBinArrAfterMixFlagChk
						});
						itemBinsArray[0] = itemBinArrAfterMixFlagChk;
					}
					if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
						var binLocArr = fnGetInventoryBinsForLotForBinPutaway(strLocation, strLot, getItemInternalId, itemBinArrAfterMixFlagChk);
						if (binLocArr.length > 0) {
							var lotItemBinArr = [];
							for (var bin = 0; bin < binLocArr.length; bin++) {
								if (lotItemBinArr.indexOf(binLocArr[bin]) == -1) {
									lotItemBinArr.push(binLocArr[bin]);
								}
							}
							itemBinsArray[0] = lotItemBinArr;
						} else {
							itemBinsArray[0] = [];
						}
					}
				}
			}
			return itemBinsArray;
		}

		function _getBinsByZoneAndLocation(mixItemsInBins, putZoneArr, strLocation, existingBinArrayLength, binInternalIdArr, putStrategyArr, selectedConvRate, currentConvRate, selectedUOMText, fromstausId, inventoryStatusFeature) {
			log.debug("binInternalIdArr", binInternalIdArr);
			if (!_isValueValid(binInternalIdArr)) {
				binInternalIdArr = [];
			}
			var totalBinsArr = [];
			var inventoryBins = [];
			var emptyBinsArr = [];
			for (var putZone = 0; putZone < putZoneArr.length; putZone++) {
				var objBinDetails = [];
				var filterStrat = [];
				var puZoneId = putZoneArr[putZone];
				filterStrat.push(search.createFilter({
					name: 'inactive',
					operator: search.Operator.IS,
					values: false
				}));
				if (_isValueValid(puZoneId) && puZoneId != '-None-') {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_zone',
						operator: search.Operator.ANYOF,
						values: puZoneId
					}));
				}
				if (_isValueValid(binInternalIdArr) && binInternalIdArr.length > 0) {
					filterStrat.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.NONEOF,
						values: binInternalIdArr
					}));
				}
				if (_isValueValid(strLocation)) {
					filterStrat.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: strLocation
					}));
				}

				var objBinDetailsSearch = search.load({
					id: 'customsearch_wmsse_binsbyzones'
				});
				var resultLength = 4000;
				if (_isValueValid(existingBinArrayLength)) {
					resultLength = 4000 - parseInt(existingBinArrayLength);
				}

				var savedFilters = objBinDetailsSearch.filters;
				objBinDetailsSearch.filters = savedFilters.concat(filterStrat);
				log.debug("resultLength", resultLength);

				//  var search_page_count = 1000;



				try {

					var binIdArr = [];
					var counter = 0;
					var emptyStrategyIndex = putZoneArr.indexOf("-None-");
					objBinDetailsSearch.run().each(function (result) {
						counter = counter + 1;
						if (binIdArr.indexOf(result.id) == -1) {
							binIdArr.push(result.id);
						}
						objBinDetails.push(result);
						if (counter == 4000 || counter == parseInt(resultLength)) {
							return false;
						} else {
							return true;
						}

					});
					if (binIdArr.length > 0) {
						var binIdObjArr = _getwarehouseInventoryBins(strLocation, binIdArr, mixItemsInBins, fromstausId, putStrategyArr, putZoneArr, selectedConvRate, currentConvRate, selectedUOMText, inventoryStatusFeature);

						if (mixItemsInBins == true && binIdObjArr != undefined) {
							if (binIdObjArr["dtls"] != undefined) {
								var inventoryBinsArr = binIdObjArr["dtls"];
								for (var l = 0; l < inventoryBinsArr.length; l++) {
									inventoryBins.push(inventoryBinsArr[l]);
								}

							}
						}
						var binsLength = objBinDetails.length;
						for (var bin = 0; bin < binsLength; bin++) {

							var strBinId = objBinDetails[bin].getValue('internalid');
							var zoneId = objBinDetails[bin].getValue('custrecord_wmsse_zone');

							var putZoneIndex = putZoneArr.indexOf(zoneId);
							log.debug('BeforeputZoneIndex', putZoneIndex);
							if (putZoneIndex == -1 && putZoneArr.indexOf("-None-") != -1) {
								putZoneIndex = putZoneArr.indexOf("-None-");

							}
							log.debug('AfterputZoneIndex', putZoneIndex);

							if (!binIdObjArr[strBinId]) {
								var strBin = objBinDetails[bin].getValue('binnumber');
								var zone = objBinDetails[bin].getText('custrecord_wmsse_zone');
								var putstrategy = "";
								if (putZoneIndex != -1) {
									putstrategy = putStrategyArr[putZoneIndex];
								}
								var currentRowValues = {
									'binName': strBin,
									'binInternalId': strBinId,
									'statusName': "",
									'statusInternalId': "",
									'quantity': "0",
									'zone': zone,
									'quantityWithUOM': "0",
									'sortByZoneIndex': putZoneIndex,
									'sortBySeqIndex': bin,
									'puStratagie': putstrategy
								};
								emptyBinsArr.push(currentRowValues);
								if (emptyStrategyIndex != -1) {
									binInternalIdArr.push(strBinId);
								}
							}
						}

					}

				} catch (e) {
					log.debug("e", e);
				}

				existingBinArrayLength = existingBinArrayLength + (binIdArr.length);
				if (binIdArr.length == resultLength) {
					break;
				}
			}
			if (emptyBinsArr.length > 0) {
				emptyBinsArr = emptyBinsArr.sort(SortByZone);
				totalBinsArr = totalBinsArr.concat(emptyBinsArr);
			}

			if (mixItemsInBins == true && inventoryBins.length > 0) {
				if (inventoryBins.length > 0) {
					inventoryBins = inventoryBins.sort(SortByZone);
					totalBinsArr = totalBinsArr.concat(inventoryBins);
				}
			}
			return totalBinsArr;
		}



		function _getBinLocationsByZoneAndLocation(strPutZone, strLocation, existingBinArrayLength, binIdArr) {
			var filterStrat = [];
			filterStrat.push(search.createFilter({
				name: 'inactive',
				operator: search.Operator.IS,
				values: false
			}));
			if (_isValueValid(strPutZone) && strPutZone != '-None-') {
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_zone',
					operator: search.Operator.ANYOF,
					values: strPutZone
				}));
			}
			if (_isValueValid(strLocation)) {
				filterStrat.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (_isValueValid(binIdArr)) {
				filterStrat.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.NONEOF,
					values: binIdArr
				}));
			}
			var objBinDetailsSearch = search.load({
				id: 'customsearch_wmsse_binsbyzones'
			});
			var resultLength = 4000;
			if (_isValueValid(existingBinArrayLength)) {
				resultLength = 4000 - parseInt(existingBinArrayLength);
			}
			var savedFilters = objBinDetailsSearch.filters;
			objBinDetailsSearch.filters = savedFilters.concat(filterStrat);
			var objBinDetails = [];
			objBinDetailsSearch.run().each(function (result) {
				objBinDetails.push(result);
				if (parseInt(objBinDetails.length) == parseInt(resultLength)) {
					return false;
				} else {
					return true;
				}
			});

			return objBinDetails;
		}


		function _getInventoryBalanceDetailsByZoneAndLoc(strLocation, binInternalIdArr, existingBinArrayLength) {
			var filterInvBal = [];
			if (_isValueValid(strLocation)) {
				filterInvBal.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (_isValueValid(binInternalIdArr) && binInternalIdArr.length > 0) {
				filterInvBal.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: binInternalIdArr
				}));
			}

			var objBinDetailsSearch = search.load({
				id: 'customsearch_wmsse_srchres_statuswise',
				type: search.Type.INVENTORY_BALANCE
			});
			var resultLength = 4000;
			if (_isValueValid(existingBinArrayLength)) {
				resultLength = 4000 - parseInt(existingBinArrayLength);
			}
			var savedFilters = objBinDetailsSearch.filters;
			objBinDetailsSearch.filters = savedFilters.concat(filterInvBal);
			var objBinDetails = [];
			objBinDetailsSearch.run().each(function (result) {
				objBinDetails.push(result);
				if (parseInt(objBinDetails.length) == parseInt(resultLength)) {
					return false;
				} else {
					return true;
				}
			});
			return objBinDetails;
		}

		function _getRecomendedBinFromPutStrategy(itemId, wareHouseLocationId, transactionType,
			transactionInternalId, transcationUomInternalId,
			selectedConversionRate, fromStatusId, lotName) {
			log.emergency("itemId@@@@@@@@", itemId);
			log.emergency("wareHouseLocationId@@@@@@@@", wareHouseLocationId);
			var itemResults = inboundUtility.getItemDetails(itemId, wareHouseLocationId);

			var binoritemObject = {};
			var binIntId = "";
			var itemPreferedLocation = "";
			//fetch preferedBin
			if (itemResults.length > 0) {
				var isPreferedBin = '';
				var preferedBinName = '';
				var itemResultObj = itemResults[0];
				for (var d = 0; d < itemResults.length; d++) {
					var itemResultsRec = itemResults[d];
					itemPreferedLocation = itemResultsRec.location;
					isPreferedBin = itemResultsRec.preferredbin
					if (preferedBinName == '' && isPreferedBin == true && (itemPreferedLocation == wareHouseLocationId)) {
						preferedBinName = itemResults[d].binnumber;
						break;
					}

				}
				log.emergency("itemResults@@@@@@@@", itemResults);
				var binObj = _binValidation(preferedBinName, wareHouseLocationId);
				log.emergency("binObj@@@@@@@@", binObj);
				if (binObj.isValid) {
					binoritemObject.binInternalId = binObj.binInternalId;
					binoritemObject.binName = binObj.binName;
					binIntId = binObj.binInternalId;
				}
			}
			//fetch same item bin
			if (!utility.isValueValid(binIntId)) {
				var itemObj = {};
				itemObj.itemInternalId = itemId;
				itemObj.itemGroup = itemResultObj.custitem_wmsse_itemgroup;
				itemObj.itemFamily = itemResultObj.custitem_wmsse_itemfamily;
				itemObj.blnMixItem = itemResultObj.custitem_wmsse_mix_item;
				itemObj.blnMixLot = itemResultObj.custitem_wmsse_mix_lot;
				itemObj.warehouseLocationId = wareHouseLocationId;
				itemObj.itemType = itemResultObj.recordtype;
				itemObj.lotName = lotName;
				itemObj.selectedUOMText = itemResultObj.stockunitText;
				var fields = ['department', 'class'];
				var poRes = search.lookupFields({
					type: transactionType,
					id: transactionInternalId,
					columns: fields
				});
				if (utility.isValueValid(poRes)) {

					itemObj.department = poRes.department;
				}
				if (utility.isValueValid(poRes)) {

					itemObj['class'] = poRes.class;
				}
				itemObj.transcationUomInternalId = transcationUomInternalId;
				//itemObj.stockConversionRate = stockConversionRate;
				itemObj.selectedConversionRate = selectedConversionRate;
				itemObj.fromStatusId = fromStatusId;
				itemObj.recomendedBinForPutaway = "T";
				var results = getPutBinAndIntDetails(itemObj);
				log.emergency("results", results);
				if (results.length > 0) {
					binoritemObject.binInternalId = results[0].binInternalId;
					binoritemObject.binName = results[0].binName;
				}
				//	itemObj.locationinvtclassification = itemRec.locationinvtclassification;
			}
			return binoritemObject;
		}

		function binValidation(preferedBinName, whLocationId) {
			var binoritemObject = {};

			var binInternalId = '';
			var binSearchFilters = [];

			var searchrecord = search.load({
				id: 'customsearch_wmsse_binnumbers'
			});
			binSearchFilters = searchrecord.filters;

			var WIPLocId = inboundUtility.getListObjectInternalId('WIP', 'customlist_wmsse_bin_loc_type');

			if (utility.isValueValid(WIPLocId)) {
				binSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_bin_loc_type',
					operator: search.Operator.NONEOF,
					values: WIPLocId
				}));
				var outDirId = inboundUtility.getListObjectInternalId('Out', 'customlist_wmsse_stg_direction');
				binSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_bin_stg_direction',
					operator: search.Operator.NONEOF,
					values: outDirId
				}));
			}

			binSearchFilters.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.IS,
				values: preferedBinName
			}));

			if (utility.isValueValid(whLocationId)) {
				binSearchFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocationId
				}));
			}
			binSearchFilters.push(search.createFilter({
				name: 'inactive',
				operator: search.Operator.IS,
				values: false
			}));
			var binSearchResults = searchrecord.run().getRange({
				start: 0,
				end: 1000
			});
			log.debug({
				title: 'binSearchResults',
				details: binSearchResults
			});
			if (binSearchResults.length > 0) {
				binInternalId = binSearchResults[0].id;
			}
			if (!utility.isValueValid(binInternalId)) {
				binoritemObject.isValid = false;
			} else {
				binoritemObject.binInternalId = binInternalId;
				binoritemObject.binName = binSearchResults[0].getValue({
					name: 'binnumber'
				});
				binoritemObject.isValid = true;
			}
			return binoritemObject;
		}

		function _updateOpentaskFields(openTaskId, quantity) {
			var openTaskRecord = record.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: openTaskId
			});

			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_act_qty',
				value: quantity
			});
			openTaskRecord.setValue({
				fieldId: 'custrecord_wmsse_expe_qty',
				value: quantity
			});
			openTaskRecord.save();
		}

		function getPutBinAndIntDetails(objPutBinQueryDetails) {

			var binDetailsArray = [];
			var tdate = new Date();
			log.debug({
				title: 'timeStamp at the start of the getPutBinAndIntDetails function',
				details: tdate.getHours() + ":" + tdate.getMinutes() + ":" + tdate.getSeconds() + ":" + tdate.getMilliseconds()
			});
			log.debug({
				title: 'getPutBinAndIntDetailsForBinPutaway',
				details: objPutBinQueryDetails
			});
			var getItemInternalId = objPutBinQueryDetails.itemInternalId;
			var strItemGrp = objPutBinQueryDetails.itemGroup;
			var strItemFam = objPutBinQueryDetails.itemFamily;
			var blnMixItem = objPutBinQueryDetails.blnMixItem;
			var blnMixLot = objPutBinQueryDetails.blnMixLot;
			var getPreferBin = objPutBinQueryDetails.preferedBinName;
			var strLocation = objPutBinQueryDetails.warehouseLocationId;
			var itemType = objPutBinQueryDetails.itemType;
			var strLot = objPutBinQueryDetails.lotName;
			var strItemDepartment = objPutBinQueryDetails.department;
			var strItemClass = objPutBinQueryDetails['class'];
			var strvUnits = objPutBinQueryDetails.transcationUomInternalId;
			var fromBinInternalId = objPutBinQueryDetails.fromBinInternalId;
			var selectedUOMText = objPutBinQueryDetails.selectedUOMText;
			var preferBinInternalId = objPutBinQueryDetails.preferedBinInternalId;
			var fromStatusId = objPutBinQueryDetails.fromStatusId;
			var classification = objPutBinQueryDetails.locationinvtclassification;
			var selectedConvRate = objPutBinQueryDetails.selectedConversionRate;
			var currentConvRate = objPutBinQueryDetails.stockConversionRate;
			var recomendedBinForPutaway = objPutBinQueryDetails.recomendedBinForPutaway;
			log.debug({
				title: 'fromStatusId',
				details: fromStatusId
			});
			var inventoryStatusFeature = isInvStatusFeatureEnabled();
			var vTotalBinArr = [];
			if (_isValueValid(preferBinInternalId) && preferBinInternalId != fromBinInternalId) {
				vTotalBinArr = _getputStratagiePreferBinDetails(preferBinInternalId, strLocation, fromBinInternalId, fromStatusId, objPutBinQueryDetails);
			}
			var objPutstrategies = _getPutStratagies(getItemInternalId, strItemGrp, strItemFam, strLocation, strItemClass, strItemDepartment,
				strvUnits, fromStatusId, inventoryStatusFeature, classification);
			log.debug({
				title: 'objPutstrategies',
				details: objPutstrategies
			});
			var objputstrategiesLength = objPutstrategies.length;
			if (objputstrategiesLength > 0) {
				var putZoneArr = [];
				var putStrategyArr = [];
				for (var putawayStrategy = 0; putawayStrategy < objputstrategiesLength; putawayStrategy++) {
					if (objPutstrategies[putawayStrategy]) {
						var strPutZone = objPutstrategies[putawayStrategy].custrecord_wmsse_putzone;
						if (!_isValueValid(strPutZone)) {
							strPutZone = "-None-";
						}
						putZoneArr.push(strPutZone);
						putStrategyArr.push(objPutstrategies[putawayStrategy].id);
					}
				}
				log.debug({
					title: 'putZoneArr',
					details: putZoneArr
				});
				log.debug({
					title: 'putStrategyArr',
					details: putStrategyArr
				});
				var itemInventoryResults = [];
				//var mixItemsInBins = _getMixFlag(itemType,blnMixItem,blnMixLot);
				var preferAndFromBinIdArr = [];
				var sameItemBinsArr = [];
				if (_isValueValid(preferBinInternalId)) {
					sameItemBinsArr.push(preferBinInternalId);
					preferAndFromBinIdArr.push(preferBinInternalId);
				}
				if (_isValueValid(fromBinInternalId)) {
					sameItemBinsArr.push(fromBinInternalId);
					preferAndFromBinIdArr.push(fromBinInternalId);
				}
				var batchNo1 = "";
				log.debug("strlot@@@@@@", strLot);
				var isSameItemBinsRequired = true;
				if (blnMixLot == false && _isValueValid(strLot) && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
					batchNo1 = strLot;
					var existingLotDtls = checkInventoryNumberExistsAndGetDetails(getItemInternalId, batchNo1, strLocation)
					if (existingLotDtls.length == 0) {
						isSameItemBinsRequired = false;
					} else {

						batchNo1 = existingLotDtls[0].id;
						log.debug("batchNo1", batchNo1);
					}
				}
				if (isSameItemBinsRequired) {
					itemInventoryResults = _getInventoryBinsForItem(strLocation, putZoneArr, getItemInternalId, preferAndFromBinIdArr, fromStatusId, "", batchNo1);
				}
				if (blnMixItem == false) {
					itemInventoryResults = _getInventoryBinsForMixFlagFalseItem(strLocation, itemInventoryResults, preferBinInternalId);
				}

				var sameItemInventoryBinsArr = fillInvBalanceDtls(blnMixItem, itemInventoryResults, selectedConvRate, currentConvRate, selectedUOMText, putZoneArr, putStrategyArr, sameItemBinsArr);
				var emptyAndOtherBinsRequired = true;
				if (sameItemInventoryBinsArr.length > 0) {
					sameItemInventoryBinsArr = sameItemInventoryBinsArr.sort(SortByZone);
					vTotalBinArr = vTotalBinArr.concat(sameItemInventoryBinsArr);
					if (_isValueValid(recomendedBinForPutaway) && recomendedBinForPutaway == "T") {
						emptyAndOtherBinsRequired = false
					}

				}
				if (vTotalBinArr.length < 4000 && emptyAndOtherBinsRequired == true) {
					var emptyBinsArr = _getBinsByZoneAndLocation(blnMixItem, putZoneArr, strLocation, parseInt(vTotalBinArr.length), sameItemBinsArr, putStrategyArr, selectedConvRate, currentConvRate, selectedUOMText, fromStatusId, inventoryStatusFeature);
					if (emptyBinsArr.length > 0) {
						vTotalBinArr = vTotalBinArr.concat(emptyBinsArr);
					}
				}
			} else {
				if (_isValueValid(preferBinInternalId) && preferBinInternalId != fromBinInternalId) {
					vTotalBinArr = _getputStratagiePreferBinDetails(preferBinInternalId, strLocation, fromBinInternalId, fromStatusId, objPutBinQueryDetails, []);
				}
			}
			return vTotalBinArr;
		}

		function _getBinsByZoneAndLocation(mixItemsInBins, putZoneArr, strLocation, existingBinArrayLength, binInternalIdArr, putStrategyArr, selectedConvRate, currentConvRate, selectedUOMText, fromstausId, inventoryStatusFeature) {
			var totalBinsArr = [];
			var inventoryBins = [];
			var emptyBinsArr = [];
			var binInternalIdArray = [];
			for (var putZone = 0; putZone < putZoneArr.length; putZone++) {
				var objBinDetails = [];
				var filterStrat = [];
				var puZoneId = putZoneArr[putZone];
				filterStrat.push(search.createFilter({
					name: 'inactive',
					operator: search.Operator.IS,
					values: false
				}));
				if (_isValueValid(puZoneId) && puZoneId != '-None-') {
					filterStrat.push(search.createFilter({
						name: 'custrecord_wmsse_zone',
						operator: search.Operator.ANYOF,
						values: puZoneId
					}));
				}
				if (_isValueValid(binInternalIdArr) && binInternalIdArr.length > 0) {
					filterStrat.push(search.createFilter({
						name: 'internalid',
						operator: search.Operator.NONEOF,
						values: binInternalIdArr
					}));
				}
				if (_isValueValid(strLocation)) {
					filterStrat.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: strLocation
					}));
				}

				var objBinDetailsSearch = search.load({
					id: 'customsearch_wmsse_binsbyzones'
				});
				var resultLength = 4000;
				if (_isValueValid(existingBinArrayLength)) {
					resultLength = 4000 - parseInt(existingBinArrayLength);
				}

				var savedFilters = objBinDetailsSearch.filters;
				objBinDetailsSearch.filters = savedFilters.concat(filterStrat);
				log.debug("resultLength", resultLength);

				//  var search_page_count = 1000;



				try {

					var binIdArr = [];
					var counter = 0;
					objBinDetailsSearch.run().each(function (result) {
						counter = counter + 1;
						if (binIdArr.indexOf(result.id) == -1) {
							binIdArr.push(result.id);
						}
						objBinDetails.push(result);
						if (counter == 4000 || counter == parseInt(resultLength)) {
							return false;
						} else {
							return true;
						}

					});
					if (binIdArr.length > 0) {
						var binIdObjArr = _getwarehouseInventoryBins(strLocation, binIdArr, mixItemsInBins, fromstausId, putStrategyArr, putZoneArr, selectedConvRate, currentConvRate, selectedUOMText, inventoryStatusFeature);

						if (mixItemsInBins == true && binIdObjArr != undefined) {
							if (binIdObjArr["dtls"] != undefined) {
								var inventoryBinsArr = binIdObjArr["dtls"];
								for (var l = 0; l < inventoryBinsArr.length; l++) {
									if (binInternalIdArray.indexOf(inventoryBinsArr[l].binInternalId) == -1)
										inventoryBins.push(inventoryBinsArr[l]);
									binInternalIdArray.push(inventoryBinsArr[l].binInternalId);
								}

							}
						}
						var binsLength = objBinDetails.length;
						for (var bin = 0; bin < binsLength; bin++) {

							var strBinId = objBinDetails[bin].getValue('internalid');
							var zoneId = objBinDetails[bin].getValue('custrecord_wmsse_zone');
							var putZoneIndex = putZoneArr.indexOf(zoneId);
							if (!binIdObjArr[strBinId] && binInternalIdArray.indexOf(strBinId) == -1) {
								var strBin = objBinDetails[bin].getValue('binnumber');
								var zone = objBinDetails[bin].getText('custrecord_wmsse_zone');
								var putstrategy = "";
								if (putZoneIndex != -1) {
									putstrategy = putStrategyArr[putZoneIndex];
								}
								var currentRowValues = {
									'binName': strBin,
									'binInternalId': strBinId,
									'statusName': "",
									'statusInternalId': "",
									'quantity': "0",
									'zone': zone,
									'quantityWithUOM': "0",
									'sortByZoneIndex': putZoneIndex,
									'sortBySeqIndex': bin,
									'puStratagie': putstrategy
								};
								emptyBinsArr.push(currentRowValues);
								binInternalIdArray.push(strBinId);
							}
						}

					}

				} catch (e) {
					log.debug("e", e);
				}

				existingBinArrayLength = existingBinArrayLength + (binIdArr.length);
				if (binIdArr.length == resultLength) {
					break;
				}
			}
			if (emptyBinsArr.length > 0) {
				emptyBinsArr = emptyBinsArr.sort(SortByZone);
				totalBinsArr = totalBinsArr.concat(emptyBinsArr);
			}

			if (mixItemsInBins == true && inventoryBins.length > 0) {
				if (inventoryBins.length > 0) {
					inventoryBins = inventoryBins.sort(SortByZone);
					totalBinsArr = totalBinsArr.concat(inventoryBins);
				}
			}
			return totalBinsArr;
		}

		function convertToJson2(binObj, result, resultsArray, columnsObj, putStrategyArr, putZoneArr, selectedConvRate, currentConvRate, selectedUOMText, invStatusFeature) {

			var columns = columnsObj;
			var values = result.values;
			var dataObj = {};
			for (var col in columns) {
				var colName = columns[col]['fieldId'];
				if (colName == "binnumber") {
					dataObj["binInternalId"] = values[col];
					binObj[values[col]] = true;
				}
				if (colName == "binnumber.binnumber") {
					dataObj["binName"] = values[col];
				}
				if (colName == "binnumber.custrecord_wmsse_zone") {
					var putstrategy = "";
					var putZoneIntId = values[col];
					if (_isValueValid(putZoneIntId)) {
						var putZoneIndex = putZoneArr.indexOf(putZoneIntId);
						if (_isValueValid(putZoneIndex)) {
							if (putZoneIndex != -1) {
								putstrategy = putStrategyArr[putZoneIndex];
							} else {
								var noneIndx = putZoneArr.indexOf("-None-");
								if (noneIndx != -1) {
									putZoneIndex = noneIndx;
									putstrategy = putStrategyArr[noneIndx];
								}
							}
						}
					} else {
						putZoneIndex = putZoneArr.length + 1;
					}

					dataObj["puStratagie"] = putstrategy;
					dataObj["sortByZoneIndex"] = putZoneIndex;
				}
				if (colName == "binnumber.custrecord_wmsse_putseq_no") {
					dataObj["sortBySeqIndex"] = values[col];
				}


				if (colName == "quantityonhand") {
					var qty = values[col];
					dataObj["quantity"] = qty;
					dataObj["quantityWithUOM"] = values[col];

					if (_isValueValid(qty) && _isValueValid(selectedConvRate) && _isValueValid(currentConvRate) &&
						(selectedConvRate != currentConvRate)) {
						qty = uomConversions(qty, selectedConvRate, currentConvRate);
						if (parseFloat(qty) > 0) {
							dataObj["quantityWithUOM"] = qty + " " + selectedUOMText;
						}
					} else {
						if (_isValueValid(selectedUOMText)) {
							dataObj["quantityWithUOM"] = qty + " " + selectedUOMText;
						}
					}


				}
				if (_isValueValid(invStatusFeature) && invStatusFeature == true) {
					if (colName == "inventorystatus.name") {
						dataObj["statusName"] = values[col];
					}
					if (colName == "inventorystatus") {
						dataObj["statusInternalId"] = values[col];
						binObj[values[col]] = true;
					}
				}

				if (colName == "binnumber.custrecord_wmsse_zone.name") {
					dataObj["zone"] = values[col];
				}

			}
			resultsArray.push(dataObj);
		}

		function _getwarehouseInventoryBins(whLocationId, binnumberIdArr, mixItemsInBins, fromStatusId, putZoneArr, putStrategyArr, selectedConvRate, currentConvRate, selectedUomTxt, inventoryStatusFeature) {

			try {
				var myTransactionQuery = query.create({
					type: query.Type.INVENTORY_BALANCE
				});
				if (_isValueValid(whLocationId)) {
					var condloc = myTransactionQuery.createCondition({
						fieldId: 'location',
						operator: query.Operator.ANY_OF,
						values: whLocationId
					});
					myTransactionQuery.condition = myTransactionQuery.and(
						condloc);
				}
				if (_isValueValid(binnumberIdArr)) {
					var binnumbercond = myTransactionQuery.createCondition({
						fieldId: 'binnumber',
						operator: query.Operator.ANY_OF,
						values: binnumberIdArr
					});
					myTransactionQuery.condition = myTransactionQuery.and(
						condloc, binnumbercond);
				}
				if (_isValueValid(fromStatusId) && !isNaN(fromStatusId) &&
					_isValueValid(inventoryStatusFeature) && inventoryStatusFeature == true) {
					var statuscond = myTransactionQuery.createCondition({
						fieldId: 'inventorystatus',
						operator: query.Operator.ANY_OF,
						values: fromStatusId
					});
					myTransactionQuery.condition = myTransactionQuery.and(
						condloc, binnumbercond, statuscond);
				}

				myTransactionQuery.columns = [

					myTransactionQuery.createColumn({
						fieldId: 'binnumber',
						groupBy: true
					}),

					myTransactionQuery.createColumn({
						fieldId: 'binnumber.custrecord_wmsse_zone',
						groupBy: true
					}),
					myTransactionQuery.createColumn({
						fieldId: 'binnumber.custrecord_wmsse_putseq_no',
						groupBy: true
					}),
					myTransactionQuery.createColumn({
						fieldId: 'binnumber.custrecord_wmsse_zone.name',
						groupBy: true
					}),

					myTransactionQuery.createColumn({
						fieldId: 'binnumber.binnumber',
						groupBy: true
					}),


					myTransactionQuery.createColumn({
						fieldId: 'quantityonhand',
						aggregate: query.Aggregate.SUM


					})

				];
				if (_isValueValid(inventoryStatusFeature) && inventoryStatusFeature == true) {
					myTransactionQuery.columns.push(myTransactionQuery.createColumn({
						fieldId: 'inventorystatus',
						groupBy: true
					}));
					myTransactionQuery.columns.push(myTransactionQuery.createColumn({
						fieldId: 'inventorystatus.name',
						groupBy: true
					}));
				}
				var c = 0;
				var pagedData = myTransactionQuery.runPaged({
					pageSize: 1000
				});
				var queryResults = [];
				var binObj = {};
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
							convertToJson2(binObj, resultObj, queryResults, columnsObj, putStrategyArr, putZoneArr, selectedConvRate, currentConvRate, selectedUomTxt, inventoryStatusFeature);
						}
					}
				});
				binObj["dtls"] = queryResults;
			} catch (e) {
				log.error("e", e.message);
			}
			return binObj;
		}

		function _getInventoryBinsForMixFlagFalseItem(whLocationId, itemInventoryResults) {

			var itemBinsArr = [];
			var inventoryBinsArrCount = 0;
			var inventoryBinsobj = {};

			var itemInventoryResultsLength = itemInventoryResults.length;
			for (var item = 0; item < itemInventoryResultsLength; item++) {
				itemBinsArr.push(itemInventoryResults[item].getValue({
					name: 'binnumber',
					summary: 'group'
				}));
			}
			log.debug("itemBinsArr", itemBinsArr);
			if (itemBinsArr.length > 0) {
				var objsearchObj = search.load({
					id: 'customsearch_wms_getitemdtls',
					type: "item"
				});
				var filters = objsearchObj.filters;
				filters.push(search.createFilter({
					name: 'binnumber',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: itemBinsArr
				}));
				filters.push(search.createFilter({
					name: 'location',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: whLocationId
				}));

				objsearchObj.filters = filters;
				var search_page_count = 1000;
				var myPagedData = objsearchObj.runPaged({
					pageSize: search_page_count
				});

				myPagedData.pageRanges.forEach(function (pageRange) {
					var myPage = myPagedData.fetch({
						index: pageRange.index
					});
					myPage.data.forEach(function (result) {

						inventoryBinsArrCount = inventoryBinsArrCount + 1;
						inventoryBinsobj[result.getValue({
							name: 'binnumber',
							join: 'binOnHand',
							summary: 'group'
						})] = true;
					});
				});
			}
			log.debug("inventoryBinsobj", inventoryBinsobj);
			log.debug("inventoryBinsArrCount", inventoryBinsArrCount);
			var itemInventoryBinsArr = [];
			if (inventoryBinsArrCount > 0) {
				for (var item = 0; item < itemInventoryResultsLength; item++) {
					var binIntId = itemInventoryResults[item].getValue({
						name: 'binnumber',
						summary: 'group'
					});
					if (inventoryBinsobj[binIntId] == true) {
						itemInventoryBinsArr.push(itemInventoryResults[item]);
					}
				}
			}

			return itemInventoryBinsArr;
		}

		function _getInventoryBinsForItem(whLocationId, putZoneArr, itemId, fromBinInternalId, fromStatusId, preferBinInternalId, strLotID) {

			var itemInventoryBinsArr = [];

			var objItemSearchObj = search.load({
				id: 'customsearch_wms_mixedinventorybinsdtls',
				type: "inventorybalance"
			});
			var filters = objItemSearchObj.filters;

			if (_isValueValid(whLocationId)) {
				filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocationId
				}));
			}

			if (_isValueValid(strLotID)) {
				log.debug("strLotID", strLotID);
				filters.push(search.createFilter({
					name: 'inventorynumber',
					operator: search.Operator.ANYOF,
					values: strLotID
				}));
			}
			if (_isValueValid(fromStatusId) && !isNaN(fromStatusId)) {
				filters.push(search.createFilter({
					name: 'status',
					operator: search.Operator.ANYOF,
					values: fromStatusId
				}));
			}

			if (putZoneArr.length > 0 && putZoneArr.indexOf("-None-") == -1) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_zone',
					join: 'binnumber',
					operator: search.Operator.ANYOF,
					values: putZoneArr
				}));
			}
			if (_isValueValid(itemId)) {
				filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemId
				}));
			}
			if (_isValueValid(fromBinInternalId) && fromBinInternalId.length > 0) {
				filters.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.NONEOF,
					values: fromBinInternalId
				}));
			}

			var search_page_count = 1000;
			objItemSearchObj.filters = filters;
			var myPagedData = objItemSearchObj.runPaged({
				pageSize: search_page_count
			});
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					itemInventoryBinsArr.push(result);
				});
			});
			log.debug("filters", filters);
			log.debug("itemInventoryBinsArr", itemInventoryBinsArr);

			return itemInventoryBinsArr;
		}

		function fillInvBalanceDtls(mixItemsInBins, itemInventoryResults, selectedConvRate, currentConvRate, selectedUOMText, putZoneArr, putStrategyArr, binArr) {
			var invBalanceBin = 0;
			var invBalanceBinId = '';
			var invBalanceStatus = '';
			var invBalanceStatusId = '';
			var invBalanceQuantity = '';
			var invBalanceBinName = "";
			var invBalanceZone = "";
			var invBalanceUOMQuantity = "";
			var invBalanceBinArr = [];
			var invBalanceLength = itemInventoryResults.length;
			for (invBalanceBin = 0; invBalanceBin < invBalanceLength; invBalanceBin++) {
				invBalanceBinId = itemInventoryResults[invBalanceBin].getValue({
					name: 'binnumber',
					summary: 'group'
				});

				binArr.push(invBalanceBinId);
				invBalanceBinName = itemInventoryResults[invBalanceBin].getText({
					name: 'binnumber',
					summary: 'group'
				});
				invBalanceStatus = itemInventoryResults[invBalanceBin].getText({
					name: 'status',
					summary: 'group'
				});
				invBalanceStatusId = itemInventoryResults[invBalanceBin].getValue({
					name: 'status',
					summary: 'group'
				});
				invBalanceQuantity = itemInventoryResults[invBalanceBin].getValue({
					name: 'onhand',
					summary: 'sum'
				});
				invBalanceZone = itemInventoryResults[invBalanceBin].getText({
					name: 'custrecord_wmsse_zone',
					summary: 'GROUP',
					join: 'binNumber'
				});
				invBalanceUOMQuantity = invBalanceQuantity;
				if (_isValueValid(invBalanceQuantity) && _isValueValid(selectedConvRate) && _isValueValid(currentConvRate) &&
					(selectedConvRate != currentConvRate)) {
					invBalanceQuantity = uomConversions(invBalanceQuantity, selectedConvRate, currentConvRate);
					if (parseFloat(invBalanceQuantity) > 0) {
						invBalanceUOMQuantity = invBalanceQuantity + " " + selectedUOMText;
					}
				} else {
					if (_isValueValid(selectedUOMText)) {
						invBalanceUOMQuantity = invBalanceQuantity + " " + selectedUOMText;
					}
				}
				var putstrategy = "";
				var putZoneIntId = itemInventoryResults[invBalanceBin].getValue({
					name: 'custrecord_wmsse_zone',
					summary: 'GROUP',
					join: 'binNumber'
				});
				if (_isValueValid(putZoneIntId)) {
					var putZoneIndex = putZoneArr.indexOf(putZoneIntId);
					if (_isValueValid(putZoneIndex)) {

						if (putZoneIndex != -1) {
							putstrategy = putStrategyArr[putZoneIndex];
						} else {

							var noneIndx = putZoneArr.indexOf("-None-");
							if (noneIndx != -1) {
								putZoneIndex = noneIndx;
								putstrategy = putStrategyArr[noneIndx];
							}
						}
					}
				} else {
					putZoneIndex = putZoneArr.length + 1;
				}

				var currentRowValues = {
					'binName': invBalanceBinName,
					'binInternalId': invBalanceBinId,
					'statusName': invBalanceStatus,
					'statusInternalId': invBalanceStatusId,
					'quantity': invBalanceQuantity,
					'zone': invBalanceZone,
					'quantityWithUOM': invBalanceUOMQuantity,
					'sortByZoneIndex': putZoneIndex,
					'sortBySeqIndex': invBalanceBin,
					'puStratagie': putstrategy
				};
				invBalanceBinArr.push(currentRowValues);
			}
			if (invBalanceBinArr.length > 0) {
				invBalanceBinArr.sort(SortByZone);
			}
			return invBalanceBinArr;
		}

		function getPutBinAndIntDetails_old(objPutBinQueryDetails) {

			var tdate = new Date();
			log.debug({
				title: 'timeStamp at the start of the getPutBinAndIntDetails function',
				details: tdate.getHours() + ":" + tdate.getMinutes() + ":" + tdate.getSeconds() + ":" + tdate.getMilliseconds()
			});
			log.debug({
				title: 'getPutBinAndIntDetailsForBinPutaway',
				details: objPutBinQueryDetails
			});
			var getItemInternalId = objPutBinQueryDetails.itemInternalId;
			var strItemGrp = objPutBinQueryDetails.itemGroup;
			var strItemFam = objPutBinQueryDetails.itemFamily;
			var blnMixItem = objPutBinQueryDetails.blnMixItem;
			var blnMixLot = objPutBinQueryDetails.blnMixLot;
			var getPreferBin = objPutBinQueryDetails.preferedBinName;
			var strLocation = objPutBinQueryDetails.warehouseLocationId;
			var itemType = objPutBinQueryDetails.itemType;
			var strLot = objPutBinQueryDetails.lotName;
			var strItemDepartment = objPutBinQueryDetails.department;
			var strItemClass = objPutBinQueryDetails['class'];
			var strvUnits = objPutBinQueryDetails.transcationUomInternalId;
			var fromBinInternalId = objPutBinQueryDetails.fromBinInternalId;
			var selectedUOMText = objPutBinQueryDetails.selectedUOMText;
			var preferBinInternalId = objPutBinQueryDetails.preferedBinInternalId;
			var fromStatusId = objPutBinQueryDetails.fromStatusId;
			var classification = objPutBinQueryDetails.locationinvtclassification;
			log.debug({
				title: 'fromStatusId',
				details: fromStatusId
			});
			var inventoryStatusFeature = isInvStatusFeatureEnabled();
			var vTotalBinArr = [];
			var binCountVariable = 0;
			if (_isValueValid(preferBinInternalId) && preferBinInternalId != fromBinInternalId) {
				vTotalBinArr = _getputStratagiePreferBinDetails(preferBinInternalId, strLocation, fromBinInternalId, fromStatusId, objPutBinQueryDetails);
				binCountVariable = vTotalBinArr.length;
			}
			var objPutstrategies = _getPutStratagies(getItemInternalId, strItemGrp, strItemFam, strLocation, strItemClass, strItemDepartment,
				strvUnits, fromStatusId, inventoryStatusFeature, classification);
			log.debug({
				title: 'objPutstrategies',
				details: objPutstrategies
			});
			if (objPutstrategies.length > 0) {
				var itemBinsArray = [];
				var itemBinStatusArray = [];
				var itemStatusArray = [];
				var mixItemsInBins = _getMixFlag(itemType, blnMixItem, blnMixLot);
				itemBinStatusArray = _getItemInventory(strLocation, getItemInternalId, itemType, strLot, mixItemsInBins);
				if (itemBinStatusArray.length > 0) {
					itemBinsArray = itemBinStatusArray[0];
					itemStatusArray = itemBinStatusArray[1];
					log.debug({
						title: 'itemBinsArr',
						details: itemBinsArray
					});
				}
				var preferAndFromBinIdArr = [];
				if (_isValueValid(fromBinInternalId)) {
					preferAndFromBinIdArr.push(fromBinInternalId);
				}
				if (_isValueValid(preferBinInternalId)) {
					preferAndFromBinIdArr.push(preferBinInternalId);
				}
				var selectedConvRate = '';
				var currentConvRate = '';
				var isMixedBin = true;
				var vPutZoneArr = [];
				var binDetailsArray = [];
				var inventoryStatusArr = [];
				for (var i = 0; i < objPutstrategies.length && parseInt(binCountVariable) <= 4000; i++) {
					binDetailsArray = [];
					log.debug({
						title: 'objPutstrategies',
						details: objPutstrategies[i]
					});
					strPutZone = objPutstrategies[i].custrecord_wmsse_putzone;
					invstatusid = objPutstrategies[i].custrecord_wmsse_put_invstatus;

					if (!_isValueValid(strPutZone)) {
						strPutZone = "-None-";
					}
					if (strPutZone != null && strPutZone != '' && vPutZoneArr.indexOf(strPutZone) == -1) {

						vPutZoneArr.push(strPutZone);
						var objBinDetails = _getBinLocationsByZoneAndLocation(strPutZone, strLocation, parseInt(binCountVariable), preferAndFromBinIdArr);
						var binLength = objBinDetails.length;
						if (binLength > 0) {
							var l = 0;
							var binIdArr = [];
							for (l = 0; l < binLength; l++) {
								binIdArr.push(objBinDetails[l].getValue('internalid'));
							}
							var objInvBalanceBinDetails = _getInventoryBalanceDetailsByZoneAndLoc(strLocation, binIdArr, parseInt(binCountVariable));
							log.debug({
								title: 'objInvBalanceBinDetails',
								details: objInvBalanceBinDetails
							});
							var isStatusfilterApplied = false;
							var invBalanceLength = objInvBalanceBinDetails.length;
							if (invBalanceLength > 0) {
								selectedConvRate = objPutBinQueryDetails.selectedConversionRate;
								currentConvRate = objPutBinQueryDetails.stockConversionRate;
								if (_isValueValid(fromStatusId)) {
									inventoryStatusArr.push(fromStatusId);
									isStatusfilterApplied = true;
								}
							}
							var invBalanceBin = 0;
							var binQtyObject = {};
							var invBalanceBinId = '';
							var invBalanceStatus = '';
							var invBalanceStatusId = '';
							var invBalanceQuantity = '';
							var obj = {};
							var qtyStr = '';
							for (invBalanceBin = 0; invBalanceBin < invBalanceLength; invBalanceBin++) {
								invBalanceBinId = objInvBalanceBinDetails[invBalanceBin].getValue({
									name: 'binnumber',
									summary: 'group'
								});
								invBalanceStatus = objInvBalanceBinDetails[invBalanceBin].getText({
									name: 'status',
									summary: 'group'
								});
								invBalanceStatusId = objInvBalanceBinDetails[invBalanceBin].getValue({
									name: 'status',
									summary: 'group'
								});
								invBalanceQuantity = objInvBalanceBinDetails[invBalanceBin].getValue({
									name: 'onhand',
									summary: 'sum'
								});
								if (binQtyObject[invBalanceBinId] != undefined) //This is to add different status to a bin
								{
									arrObj = binQtyObject[invBalanceBinId];
									var obj1 = {};
									obj1.status = invBalanceStatus;
									obj1.statusId = invBalanceStatusId;
									obj1.quantity = invBalanceQuantity;
									arrObj.push(obj1);
									binQtyObject[invBalanceBinId] = arrObj;
								} else {
									var binArr = [];
									obj = {};
									obj.status = invBalanceStatus;
									obj.statusId = invBalanceStatusId;
									obj.quantity = invBalanceQuantity;
									binArr.push(obj);
									binQtyObject[invBalanceBinId] = binArr;
								}
							}
							var bin = 0;
							var strBin = '';
							var strBinId = '';
							var invStatus = '';
							var invStatusId = '';
							var binQtyAvail = 0;
							var zone = '';
							var binQtyAvailWithUOM = 0;
							var invBalanceObject = '';
							var itemBinFound = -1;
							var sortVar = 2;
							var binAndStatusString = '';
							log.debug({
								title: 'objBinDetails',
								details: objBinDetails
							});
							for (bin = 0; bin < binLength && parseInt(binCountVariable) <= 4000; bin++) {
								sortVar = 2;
								strBin = objBinDetails[bin].getValue('binnumber');
								strBinId = objBinDetails[bin].getValue('internalid');
								zone = objBinDetails[bin].getText('custrecord_wmsse_zone');
								invBalanceObject = binQtyObject[strBinId];
								if (invBalanceObject != undefined) {
									var invObj = 0;
									var invBinObjectLength = invBalanceObject.length;
									sortVar = 3;
									for (invObj = 0; invObj < invBinObjectLength; invObj++) {
										invStatus = invBalanceObject[invObj].status;
										invStatusId = invBalanceObject[invObj].statusId;
										if ((inventoryStatusFeature == false || inventoryStatusFeature == 'false') || (isStatusfilterApplied == false) ||
											(inventoryStatusArr.indexOf(invStatusId) != -1 || fromStatusId == 'All')) {
											binQtyAvail = invBalanceObject[invObj].quantity;
											binQtyAvailWithUOM = binQtyAvail;

											if (_isValueValid(binQtyAvail) && _isValueValid(selectedConvRate) && _isValueValid(currentConvRate) &&
												(selectedConvRate != currentConvRate)) {
												binQtyAvail = uomConversions(binQtyAvail, selectedConvRate, currentConvRate);
												if (parseFloat(binQtyAvail) > 0) {
													binQtyAvailWithUOM = binQtyAvail + " " + selectedUOMText;
												}
											} else {
												if (_isValueValid(selectedUOMText)) {
													binQtyAvailWithUOM = binQtyAvail + " " + selectedUOMText;
												}
											}

											itemBinFound = fn_isSameItemBin(itemBinsArray, strBinId, inventoryStatusFeature, itemStatusArray, invStatusId);

											isMixedBin = true;

											if ((blnMixItem == false) && itemBinFound == -1) {
												isMixedBin = false;
											}

											if (itemBinFound != -1) {
												sortVar = 1;
											}
											if (isMixedBin) {
												var currentRowValues = {
													'binName': strBin,
													'binInternalId': strBinId,
													'statusName': invStatus,
													'statusInternalId': invStatusId,
													'quantity': binQtyAvail,
													'zone': zone,
													'quantityWithUOM': binQtyAvailWithUOM,
													'sortByItem': sortVar,
													'sortBySeq': bin,
													'puStratagie': objPutstrategies[i].id
												};
												binDetailsArray.push(currentRowValues);
												binCountVariable = parseInt(binCountVariable) + 1;
											}
										}
									}

								} else {
									invStatus = '';
									invStatusId = '';
									binQtyAvail = 0;
									binQtyAvailWithUOM = 0;
									var currentRowValues = {
										'binName': strBin,
										'binInternalId': strBinId,
										'statusName': invStatus,
										'statusInternalId': invStatusId,
										'quantity': binQtyAvail,
										'zone': zone,
										'quantityWithUOM': binQtyAvailWithUOM,
										'sortByItem': sortVar,
										'sortBySeq': bin,
										'puStratagie': objPutstrategies[i].id
									};
									binDetailsArray.push(currentRowValues);
									binCountVariable = parseInt(binCountVariable) + 1;

								}

							}

						}
					}

					binDetailsArray = binDetailsArray.sort(SortByItem);
					vTotalBinArr = vTotalBinArr.concat(binDetailsArray);
					if (strPutZone != null && strPutZone != '' && strPutZone == '-None-' || binCountVariable >= 4000) {
						break;
					}
				}
			}

			var tdate = new Date();
			log.debug({
				title: 'timeStamp at the end of the  function',
				details: tdate.getHours() + ":" + tdate.getMinutes() + ":" + tdate.getSeconds() + ":" + tdate.getMilliseconds()
			});
			return vTotalBinArr;

		}

		function fn_isSameItemBin(binsArray, binId, inventoryStatusFeature, statusArray, statusID) {
			var binIndex = binsArray.indexOf(binId);
			if (binIndex != -1) {
				if (inventoryStatusFeature) {
					var stausArr = statusArray[binId];
					if (stausArr.length > 0) {
						var itemStatusFound = false;
						var row = 0;
						for (row in stausArr) {

							var itemStatus = stausArr[row].statusId;
							if (itemStatus == statusID) {
								itemStatusFound = true;
								break;
							}
						}

						if (!itemStatusFound) {
							binIndex = -1;
						}
					}
				}
			}
			return binIndex;
		}


		/*	function _wmsmenusHiding(isEnabled)
		{
			// New Quick Ship script deployment
			var scrdeploymentquickship=search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters:[
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_quickship'
					})
					]
			});
			var result=scrdeploymentquickship.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if(result.length>0){
				var menuDeploymentRecordquickship=record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordquickship.setValue({
					fieldId:'isdeployed',
					value:isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordquickship.save();
			}
			// -----------------------------------------------------
			// Packing script deployment
			var scrdeploymentpacking=search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters:[
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_packing'
					})
					]
			});
			var result=scrdeploymentpacking.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if(result.length>0){
				var menuDeploymentRecordpacking=record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordpacking.setValue({
					fieldId:'isdeployed',
					value:isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordpacking.save();
			}
			// -----------------------------------------------------
			// pickreversal script deploymeny
			var scrdeploymentreversal=search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters:[
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_guipickreversal'
					})
					]
			});
			var result=scrdeploymentreversal.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if(result.length>0){
				var menuDeploymentRecordreversal=record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordreversal.setValue({
					fieldId:'isdeployed',
					value:isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordreversal.save();
			}
			// -----------------------------------------------------
			// marktaskdone script deploymeny
			var scrdeploymentmarktaskdone=search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters:[
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_mrkcmp_partial_pick'
					})
					]
			});
			var result=scrdeploymentmarktaskdone.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if(result.length>0){
				var menuDeploymentRecordmarktaskdone=record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordmarktaskdone.setValue({
					fieldId:'isdeployed',
					value:isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordmarktaskdone.save();
			}
			// -----------------------------------------------------
			// Mobilemenu script deploymeny
			var scrdeploymentMobilemenu=search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters:[
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_mobilemenu'
					})
					]
			});
			var result=scrdeploymentMobilemenu.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if(result.length>0){
				var menuDeploymentRecordmobilemenu=record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordmobilemenu.setValue({
					fieldId:'isdeployed',
					value:isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordmobilemenu.save();
			}
			// -----------------------------------------------------
		}*/

		function _isWebstoreFeatureEnabled() {
			var vResult = false;
			try {
				var webStoreFeature = runtime.isFeatureInEffect({
					feature: 'webstore'
				});
				var webSiteFeature = runtime.isFeatureInEffect({
					feature: 'website'
				});
				if (webStoreFeature != null && webStoreFeature != '' && webStoreFeature != 'null' &&
					webStoreFeature != 'undefined' && webStoreFeature != false && webStoreFeature != undefined &&
					webSiteFeature != null && webSiteFeature != '' && webSiteFeature != 'null' &&
					webSiteFeature != 'undefined' && webSiteFeature != undefined && webSiteFeature != false) {

					vResult = true;
				}
			} catch (e) {

				log.error({
					title: 'exception in isWebstoreFeatureEnabled',
					details: e
				});
				vResult = false;
			}
			return vResult;
		}

		function _getItemFieldsByLookup(getLineItemId, columnArray) {
			var itemDetails = '';
			try {
				var webStoreFeature = _isWebstoreFeatureEnabled();

				if (webStoreFeature) {
					columnArray.push('thumbnailurl');
					columnArray.push('storedisplaythumbnail');
				}
				log.debug('webStoreFeature', webStoreFeature);
				log.debug('getLineItemId', getLineItemId);
				log.debug('columnArray', columnArray);

				itemDetails = search.lookupFields({
					type: search.Type.ITEM,
					id: getLineItemId,
					columns: columnArray
				});

				if (_isValueValid(itemDetails.storedisplaythumbnail) &&
					(itemDetails.storedisplaythumbnail).length > 0 && _isValueValid(itemDetails.storedisplaythumbnail[0].text)) {
					var domainURL = url.resolveDomain({
						hostType: url.HostType.APPLICATION,
						accountId: runtime.accountId
					});
					itemDetails.thumbnailurl = 'https://' + domainURL + itemDetails.storedisplaythumbnail[0].text;
				}
			} catch (e) {

				log.error({
					title: 'exception in _getItemFieldsByLookup',
					details: e
				});

			}
			return itemDetails;
		}

		function getItemMixFlagDetails(warehouseLocationId, itemInternalId, binInternalId, mixItem, mixLot) {
			var searchObj = search.load({
				name: 'Item Mix and Lot Mix Item Flag Details',
				id: 'customsearch_wms_item_mixflag_details'
			});

			searchObj.filters.push(search.createFilter({
				name: 'location',
				join: 'binonhand',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
			if (_isValueValid(itemInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.NONEOF,
					values: itemInternalId
				}));
			}
			searchObj.filters.push(search.createFilter({
				name: 'quantityonhand',
				join: 'binonhand',
				operator: search.Operator.GREATERTHAN,
				values: 0
			}));
			if (_isValueValid(binInternalId)) {
				searchObj.filters.push(search.createFilter({
					name: 'binnumber',
					join: 'binonhand',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			if (mixLot) {
				searchObj.filters.push(search.createFilter({
					name: 'custitem_wmsse_mix_lot',
					operator: search.Operator.IS,
					values: false
				}));
			}
			if (mixItem) {
				searchObj.filters.push(search.createFilter({
					name: 'custitem_wmsse_mix_item',
					operator: search.Operator.IS,
					values: false
				}));
			}
			return _getSearchResultInJSON(searchObj);
		}

		function getSystemRuleDetails(RuleId, loc, RuleValue) {

			var LANG = "LANGUAGE";
			var locale = runtime.getCurrentUser().getPreference(LANG)
			if (locale != "en_US") {
				RuleId = translator.getKeyBasedonValue(RuleId);
			}

			var searchRec = search.load({
				id: 'customsearch_wmsse_sys_rules'
			});
			var filters = searchRec.filters;
			filters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: RuleId.toString()
			}), search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: false
			}));

			if (_isValueValid(RuleValue)) {
				filters.push(search.createFilter({
					name: 'custrecord_wmsserulevalue',
					operator: search.Operator.IS,
					values: RuleValue
				}));
			}
			//starts
			if (loc != null && loc != '') {
				filters.push(search.createFilter({
					name: 'custrecord_wmssesite',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', loc]
				}));
			}
			searchRec.filters = filters;
			searchresults = _getSearchResultInJSON(searchRec);

			log.debug('searchresults', searchresults);
			return searchresults;
		}

		function checkInactiveItem(itemName, wareHouseLocationId) {
			var itemValidateDetails = {};
			var itemfilters = [
				search.createFilter({
					name: 'nameinternal',
					operator: search.Operator.IS,
					values: itemName
				})
			];

			var itemcolumns = [
				search.createColumn({
					name: 'isinactive'
				}),
				search.createColumn({
					name: 'location'
				})
			];

			var itemresultsSearch = search.create({
				type: 'item',
				filters: itemfilters,
				columns: itemcolumns
			});
			var itemresults = itemresultsSearch.run().getRange({
				start: 0,
				end: 1000
			});
			if (itemresults != null && itemresults.length > 0) {
				var itemLoc = itemresults[0].getValue({
					name: 'location'
				});
				if (itemresults[0].getValue({
						name: 'isinactive'
					}) == true) {
					itemValidateDetails['error'] = translator.getTranslationString('PO_ITEMVALIDATE.INACTIVE_ITEM');
				} else if ((_isValueValid(itemLoc)) && (itemLoc != wareHouseLocationId)) {
					itemValidateDetails['error'] = translator.getTranslationString('PO_ITEMVALIDATE.WAREHOUSE_NOT_MATCHED');
				} else {
					itemValidateDetails['error'] = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
				}
			}
			return itemValidateDetails;
		}

		function submitRecord(stRecordType, recordId, columnsObject) {
			return record.submitFields({
				type: stRecordType,
				id: recordId,
				values: columnsObject
			});
		}


		function oldMenusDisplayOnWarehouseMgmtFeature(whRole, isinActiveFlag) {
			try {
				log.debug('old menu display', whRole);

				//Composite Bar Code Component Mapping
				var scrdeploymentCompositeBarCodeMapping = search.create({
					type: "customrecordtype",
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customrecord_barcode_componentmapping'
						})
					],
				});
				var result = scrdeploymentCompositeBarCodeMapping.run().getRange({
					start: 0,
					end: 1
				}) || [];

				if (result.length > 0) {
					log.debug({
						title: 'composite bar code',
						details: result[0].id
					});
					var menuDeploymentRecordCompositeBarCodeMapping = record.load({
						type: "customrecordtype",
						id: result[0].id
					});
					menuDeploymentRecordCompositeBarCodeMapping.setValue({
						fieldId: 'isinactive',
						value: isinActiveFlag,
						ignoreFieldChange: true
					});
					menuDeploymentRecordCompositeBarCodeMapping.save();
				}


				//..........................................................................
				// new cycle count generate and release script

				var scrdeploymentCYCCGenerateAndRelease = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wms_cc_planandrelease'
						})
					]
				});
				var result = scrdeploymentCYCCGenerateAndRelease.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordCYCCGenerateAndRelease = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordCYCCGenerateAndRelease.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordCYCCGenerateAndRelease.save();
				}
				//-------------------------------------------------------
				//old GUI post item receipt deployment
				log.debug("GUIPostitemreceipt", whRole);
				var scrdeploymentPostItemReceipt = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_postitemreceipt'
						})
					]
				});
				var result = scrdeploymentPostItemReceipt.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentPostItemReceipt = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentPostItemReceipt.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentPostItemReceipt.save();
				}

				//.............................................................

				//old cycle plan custom record

				var scrdeploymentOldCYCCPlan = search.create({
					type: "customrecordtype",
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customrecord_wmsse_cyclecount_plan'
						})
					],
				});
				var result = scrdeploymentOldCYCCPlan.run().getRange({
					start: 0,
					end: 1
				}) || [];

				if (result.length > 0) {
					//log.debug({title:'OldCYCCPlan',details:result[0].id});
					var menuDeploymentRecordOldCYCCPlan = record.load({
						type: "customrecordtype",
						id: result[0].id
					});
					menuDeploymentRecordOldCYCCPlan.setValue({
						fieldId: 'isinactive',
						value: isinActiveFlag,
						ignoreFieldChange: true
					});
					menuDeploymentRecordOldCYCCPlan.save();
				}


				//Old Pick Strategy

				var scrdeploymentOldPickStrategy = search.create({
					type: "customrecordtype",
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customrecord_wmsse_pickstrategies'
						})
					],
				});
				var result = scrdeploymentOldPickStrategy.run().getRange({
					start: 0,
					end: 1
				}) || [];

				if (result.length > 0) {
					//log.debug({title:'OldPickStrategy',details:result[0].id});
					var menuDeploymentRecordOldPickStrategy = record.load({
						type: "customrecordtype",
						id: result[0].id
					});
					menuDeploymentRecordOldPickStrategy.setValue({
						fieldId: 'isinactive',
						value: isinActiveFlag,
						ignoreFieldChange: true
					});
					menuDeploymentRecordOldPickStrategy.save();
				}


				//WMS OrderType

				var scrdeploymentWMSOrderType = search.create({
					type: "customrecordtype",
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customrecord_wmsse_ordertype'
						})
					],
				});
				var result = scrdeploymentWMSOrderType.run().getRange({
					start: 0,
					end: 1
				}) || [];

				if (result.length > 0) {
					var menuDeploymentRecordWMSOrderType = record.load({
						type: "customrecordtype",
						id: result[0].id
					});
					menuDeploymentRecordWMSOrderType.setValue({
						fieldId: 'isinactive',
						value: isinActiveFlag,
						ignoreFieldChange: true
					});
					menuDeploymentRecordWMSOrderType.save();
				}

				//single order pick report

				var scrdeploymentSOPKReport = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_pickreport'
						})
					]
				});
				var result = scrdeploymentSOPKReport.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordSOPKReport = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordSOPKReport.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordSOPKReport.save();
				}

				//multi order pickreport script deployment

				var scrdeploymentMOPKReport = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_multiordpickreport'
						})
					]
				});
				var result = scrdeploymentMOPKReport.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordMOPKReport = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordMOPKReport.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordMOPKReport.save();
				}

				//Multi-Order Pick Report Scheduler script deployment

				var scrdeploymentMOPKReportSchd = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_multiordpickrpt'
						})
					]
				});
				var result = scrdeploymentMOPKReportSchd.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordMOPKReportSchd = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordMOPKReportSchd.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordMOPKReportSchd.save();
				}
				var scrdeploymentpickReportStatus = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_pickstatusreport'
						})
					]
				});
				var result = scrdeploymentpickReportStatus.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordpickReportStatus = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordpickReportStatus.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordpickReportStatus.save();
				}

				//Multi Order Pick Report-Back Order Scheduler script deployment

				var scrdeploymentMOPKReportBackSchd = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_multiordpickrpt_fcfc'
						})
					]
				});
				var result = scrdeploymentMOPKReportBackSchd.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordMOPKReportBackSchd = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordMOPKReportBackSchd.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordMOPKReportBackSchd.save();
				}

				//pick reversal old

				var scrdeploymentreversal = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_gui_pickreversalqb'
						})
					]
				});
				var result = scrdeploymentreversal.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordreversal = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordreversal.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordreversal.save();
				}


				//Bin Lock record delete

				var scrdeploymentBinLockrecordDelete = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_binlocks_del_sch'
						})
					]
				});
				var result = scrdeploymentBinLockrecordDelete.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordBinLockrecordDelete = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordBinLockrecordDelete.setValue({
						fieldId: 'isdeployed',
						value: true,
						ignoreFieldChange: true
					});
					menuDeploymentRecordBinLockrecordDelete.save();
				}

				//inventory report old

				var scrdeploymentOldInvReport = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_inv_report_dl'
						})
					]
				});
				var result = scrdeploymentOldInvReport.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordOldInvReport = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordOldInvReport.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordOldInvReport.save();
				}

				//Mobilemenu script deployment
				var scrdeploymentMobilemenu = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_menu_loc_scan'
						})
					]
				});
				var result = scrdeploymentMobilemenu.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordmobilemenu = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordmobilemenu.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordmobilemenu.save();
				}
				//post item fulfillment partial picked orders

				var scrdeploymentIFPartialPicked = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_partial_fulfill'
						})
					]
				});
				var result = scrdeploymentIFPartialPicked.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordIFPartialPicked = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordIFPartialPicked.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordIFPartialPicked.save();
				}


				//single order packing

				var scrdeploymentSOPacking = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_gui_packing'
						})
					]
				});
				var result = scrdeploymentSOPacking.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordSOPacking = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordSOPacking.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordSOPacking.save();
				}


				//multi order packing

				var scrdeploymentMOPacking = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_gui_bulk_packing'
						})
					]
				});
				var result = scrdeploymentMOPacking.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordMOPacking = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordMOPacking.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordMOPacking.save();
				}
				var scrdeploymentQuickShip = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [
						search.createFilter({
							name: 'scriptid',
							operator: 'is',
							values: 'customdeploy_wmsse_quickship'
						})
					]
				});
				var result = scrdeploymentQuickShip.run().getRange({
					start: 0,
					end: 1
				}) || [];
				if (result.length > 0) {
					var menuDeploymentRecordQuickShip = record.load({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result[0].id
					});
					menuDeploymentRecordQuickShip.setValue({
						fieldId: 'isdeployed',
						value: whRole,
						ignoreFieldChange: true
					});
					menuDeploymentRecordQuickShip.save();
				}
			} catch (e) {
				log.error({
					title: 'error in  hideOldMenus',
					details: e
				});
			}
		}


		function newMenusDisplayOnWarehouseMgmtFeature(isEnabled) {
			log.debug('new menu display', isEnabled);
			var isInActive = false;
			if (!isEnabled) {
				isInActive = true;
			}
			//-----------------------------------------------------

			// new cycle count generate and release script

			var scrdeploymentCYCCGenerateAndRelease = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_cc_planandrelease'
					})
				]
			});
			var result = scrdeploymentCYCCGenerateAndRelease.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordCYCCGenerateAndRelease = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordCYCCGenerateAndRelease.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordCYCCGenerateAndRelease.save();
			}

			//............................................................
			//new cycle plan custom record
			var scrdeploymentCYCCPlan = search.create({
				type: "customrecordtype",
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customrecord_wms_cyclecount_plans'
					})
				],
			});
			var result = scrdeploymentCYCCPlan.run().getRange({
				start: 0,
				end: 1
			}) || [];

			if (result.length > 0) {
				//log.debug({title:'CYCCPlan',details:result[0].id});
				var menuDeploymentRecordCYCCPlan = record.load({
					type: "customrecordtype",
					id: result[0].id
				});
				menuDeploymentRecordCYCCPlan.setValue({
					fieldId: 'isinactive',
					value: isInActive,
					ignoreFieldChange: true
				});
				menuDeploymentRecordCYCCPlan.save();
			}

			//New Quick Ship script deployment
			var scrdeploymentquickship = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_quickship'
					})
				]
			});
			var result = scrdeploymentquickship.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordquickship = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordquickship.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordquickship.save();
			}
			//-----------------------------------------------------

			//		new Inventory Report
			var scrdeploymentinvreport = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_inventoryreport'
					})
				]
			});
			var result = scrdeploymentinvreport.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordinvreport = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				log.debug('checknow', result[0].id);
				menuDeploymentRecordinvreport.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordinvreport.save();
			}


			//Packing script deployment
			var scrdeploymentpacking = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_packing'
					})
				]
			});
			var result = scrdeploymentpacking.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordpacking = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordpacking.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordpacking.save();
			}
			//-----------------------------------------------------

			//pickreversal script deploymeny
			var scrdeploymentreversal = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_guipickreversal'
					})
				]
			});
			var result = scrdeploymentreversal.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordreversal = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordreversal.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordreversal.save();
			}
			//-----------------------------------------------------

			//new GUI post item receipt
			var scrdeploymentPostItemReceipt = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_postitemreceipt'
					})
				]
			});
			var result = scrdeploymentPostItemReceipt.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentPostItemReceipt = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentPostItemReceipt.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentPostItemReceipt.save();
			}
			//-----------------------------------------------------

			//marktaskdone script deploymeny
			var scrdeploymentmarktaskdone = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_gui_mrkcmp_partial_pick'
					})
				]
			});
			var result = scrdeploymentmarktaskdone.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordmarktaskdone = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordmarktaskdone.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordmarktaskdone.save();
			}
			//-----------------------------------------------------


			//Mobilemenu script deploymeny
			var scrdeploymentMobilemenu = search.create({
				type: search.Type.SCRIPT_DEPLOYMENT,
				filters: [
					search.createFilter({
						name: 'scriptid',
						operator: 'is',
						values: 'customdeploy_wms_mobilemenu'
					})
				]
			});
			var result = scrdeploymentMobilemenu.run().getRange({
				start: 0,
				end: 1
			}) || [];
			if (result.length > 0) {
				var menuDeploymentRecordmobilemenu = record.load({
					type: record.Type.SCRIPT_DEPLOYMENT,
					id: result[0].id
				});
				menuDeploymentRecordmobilemenu.setValue({
					fieldId: 'isdeployed',
					value: isEnabled,
					ignoreFieldChange: true
				});
				menuDeploymentRecordmobilemenu.save();
			}
			//-----------------------------------------------------

		}

		function getRecommendedBins(itemObj, transactionType) {
			var tranType = '';
			var criteria = {};
			var result = '';
			var binResArr = [];
			var whLocation = parseInt(itemObj['location']);

			if (_isValueValid(transactionType)) {
				if (transactionType == 'workorder')
					tranType = binApi.TranType.WORK_ORDER;
				else if (transactionType == 'replen')
					tranType = binApi.TranType.REPLENISHMENT;
			}

			if (_isValueValid(itemObj)) {
				criteria.itemId = parseInt(itemObj['itemInternalId']);
				if (_isValueValid(itemObj['qtyToPick']))
					criteria.quantityToPick = parseInt(itemObj['qtyToPick']);
				else
					criteria.quantityToPick = 0;
				if (_isValueValid(itemObj['selectedUnitId'])) {
					criteria.unitId = parseInt(itemObj['selectedUnitId']);
				}
				if (_isValueValid(itemObj.inventoryNumberId))
					criteria.inventoryNumberId = parseInt(itemObj.inventoryNumberId);
			}

			if (_isValueValid(criteria) && _isValueValid(tranType)) {
				result = binApi.computeBinList({
					locationId: whLocation,
					tranType: tranType,
					criteria: criteria
				});
			}
			//log.debug('result',result);
			if (_isValueValid(result)) {

				for (var index = 0; index < result.bins.length; index++) {
					var bin = result.bins[index];

					if (_isValueValid(bin) && bin.status.code == binApi.ResultCode.SUCCESS) {

						var binData = bin.data;
						var binObj = binData['bin'];
						var binQtyArr = binData['quantities'];
						var binItemObj = binData['item'];
						var binZoneObj = binData['zone'];
						var isPreferredBin = binData['isPreferred'];
						var seqNum = binData['seqNum'];
						for (var qtyIndex = 0; qtyIndex < binQtyArr.length; qtyIndex++) {
							var binDtlResObj = {};

							binDtlResObj['bininternalid'] = binObj['id'];
							binDtlResObj['binnumber'] = binObj['name'];
							binDtlResObj['itemName'] = binItemObj['name'];
							binDtlResObj['itemInternalId'] = binItemObj['id'];
							binDtlResObj['zone'] = binZoneObj['name'];
							binDtlResObj['wmsaisle'] = '';
							binDtlResObj['wmslevel'] = '';
							binDtlResObj['status'] = binQtyArr[qtyIndex]['status']['name'];
							binDtlResObj['availableqty'] = binQtyArr[qtyIndex]['quantity'];
							binDtlResObj['isPreferredBin'] = isPreferredBin;
							binDtlResObj['seqNum'] = seqNum;

							binResArr.push(binDtlResObj);
						}
					}
				}
			}

			log.debug('binResArr', binResArr);
			return binResArr;

		}

		function _getLocationFieldsByLookup(wareHouseLocationId, columnArray) {

			try {

				var locationDetails = search.lookupFields({
					type: search.Type.LOCATION,
					id: wareHouseLocationId,
					columns: columnArray
				});

			} catch (e) {

				log.error({
					title: 'exception in _getLocationFieldsByLookup',
					details: e
				});

			}
			return locationDetails;
		}

		function _isLotnumberedInventoryFeatureEnabled() {

			var lotnumberedInventoryFeature = false;
			try {

				lotnumberedInventoryFeature = runtime.isFeatureInEffect({
					feature: 'lotnumberedinventory' // Not sure about this feature
				});

			} catch (e) {
				lotnumberedInventoryFeature = false;
				log.error({
					title: 'exception in _isLotnumberedInventoryFeatureEnabled',
					details: e
				});

			}
			return lotnumberedInventoryFeature;
		}

		function _isSerializedInventoryFeatureEnabled() {

			var serializedInventoryFeature = false;
			try {

				serializedInventoryFeature = runtime.isFeatureInEffect({
					feature: 'serializedinventory' // Not sure about this feature
				});

			} catch (e) {
				serializedInventoryFeature = false;
				log.error({
					title: 'exception in _isSerializedInventoryFeatureEnabled',
					details: e
				});

			}
			return serializedInventoryFeature;
		}

		function lookupOnLocationForUseBins(wareHouseLocationId) {
			try {

				var locUseBinsFlag = true;
				var columnsArr = [];
				columnsArr.push('usesbins');
				var locoationResults = _getLocationFieldsByLookup(wareHouseLocationId, columnsArr);
				if (_isValueValid(locoationResults)) {
					locUseBinsFlag = locoationResults.usesbins;
				}
				log.debug('locUseBinsFlag', locUseBinsFlag);
			} catch (e) {

				log.error({
					title: 'exception in lookupOnLocationForUseBins',
					details: e
				});

			}
			return locUseBinsFlag;

		}

		function nonInventoryItemTypeCheck(itemType) {
			var nonInventoryItemtype = false;
			if (itemType == "NonInvtPart" || itemType == "OthCharge" || itemType == "Service" || itemType == "DwnLdItem" || itemType == "GiftCert" || itemType == "noninventoryitem") {
				nonInventoryItemtype = true;
			}

			return nonInventoryItemtype;
		}

		function isPopulateWMSCartonFieldSet() {
			var populateWMSCartonFields = true;
			try {

				var searchRec = search.load({
					id: 'customsearch_wms_populate_platformcarton'
				});

				var searchresults = _getSearchResultInJSON(searchRec);
				if (searchresults.length > 0) {
					if (searchresults[0]['custrecord_populate_platformcarton_field'] != null &&
						searchresults[0]['custrecord_populate_platformcarton_field'] != '') {
						populateWMSCartonFields = searchresults[0]['custrecord_populate_platformcarton_field'];
					}
				}
				log.debug('populateWMSCartonFields', populateWMSCartonFields);
			} catch (exp) {
				log.error('expception', exp);
				return populateWMSCartonFields;
			}
			return populateWMSCartonFields;
		}

		function addItemDatatoResponse(itemList, itemResult, unitType, unitName) {
			for (var key in itemResult) {
				if (key == 'barcodeUomName' || key == 'barcodeQuantity' || key == 'itemUomName') {
					var uomName = '';
					if (_isValueValid(itemResult['barcodeUomName'])) {
						uomName = itemResult['barcodeUomName'];
					} else if (_isValueValid(itemResult['itemUomName'])) {
						uomName = itemResult['itemUomName'];
					}

					if (!_isValueValid(uomName) && _isValueValid(unitName)) {
						uomName = unitName
					}

					var uomValue = '';
					var uomQty = itemResult['barcodeQuantity'];

					if (_isValueValid(unitType)) {
						var uomRecord = record.load({
							type: record.Type.UNITS_TYPE,
							id: unitType
						});
						var sublistCount = uomRecord.getLineCount({
							sublistId: 'uom'
						});
						for (var i = 0; i < sublistCount; i++) {
							var unitNameText = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'unitname',
								line: i
							});
							var pluralName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'pluralname',
								line: i
							});

							if (uomName.toUpperCase() == unitNameText.toUpperCase() ||
								uomName.toUpperCase() == pluralName.toUpperCase()) {
								uomValue = uomRecord.getSublistValue({
									sublistId: 'uom',
									fieldId: 'internalid',
									line: i
								});
								break;
							}
						}
					}


					if (uomValue != '') {
						if (_isValueValid(uomQty)) {
							var uomQtyObj = [{
								'value': uomQty,
								'unit': uomValue
							}];
							itemList['barcodeQuantity'] = uomQtyObj;
						} else {
							var uomQtyObj = [{
								'value': '',
								'unit': uomValue
							}];
							itemList['barcodeQuantity'] = uomQtyObj;
						}
					} else {
						if (_isValueValid(uomQty)) {
							var uomQtyObj = [{
								'value': uomQty
							}];
							itemList['barcodeQuantity'] = uomQtyObj;
						}
					}

				} else {
					var value = itemResult[key];
					itemList[key] = value;
				}
			}
			return itemList;
		}

		function getUomValues(unitType, selectedUnitName) {
			var uomResultsObj = {};
			if (_isValueValid(unitType)) {
				var uomRecord = record.load({
					type: record.Type.UNITS_TYPE,
					id: unitType
				});
				var sublistCount = uomRecord.getLineCount({
					sublistId: 'uom'
				});

				for (var i = 0; i < sublistCount; i++) {
					var unitName = uomRecord.getSublistValue({
						sublistId: 'uom',
						fieldId: 'unitname',
						line: i
					});

					if (_isValueValid(selectedUnitName) && _isValueValid(unitName)) {
						if (selectedUnitName.toUpperCase() == unitName.toUpperCase()) {
							var uomValue = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'internalid',
								line: i
							});

							var conversionRate = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'conversionrate',
								line: i
							});
							uomResultsObj['uomValue'] = uomValue;
							uomResultsObj['transactionUomConversionRate'] = conversionRate;
							break;
						}
					}
				}
			}
			return uomResultsObj;

		}

		function getDefaultInvStatus() {
			var defaultStatusObj = {};
			//State: D is for default Inventory status
			var invStatusQuery = " SELECT " +
				" inventoryStatus.name AS nameRAW /*{name#RAW}*/, " +
				" inventoryStatus.\"ID\" AS idRAW /*{id#RAW}*/ " +
				" FROM " +
				" inventoryStatus " +
				" WHERE " +
				" UPPER(inventoryStatus.state) IN ('D') " +
				" AND NVL(inventoryStatus.isinactive, 'F') = ? ";
			// Run the SuiteQL query
			var resultSuiteQL = query.runSuiteQL({
				query: invStatusQuery,
				params: ['F']
			});
			var queryResults = resultSuiteQL.asMappedResults();
			for (var result in queryResults) {
				defaultStatusObj.name = queryResults[result].name;
				defaultStatusObj.id = queryResults[result].id;
			}
			return defaultStatusObj;
		}

		function getInvReportDetails(objInvQBDetails) {
			log.debug('objInvQBDetails', objInvQBDetails);

			var InvReportSearchResults = [];
			var whLocation = objInvQBDetails.whLocation;
			var itemId = objInvQBDetails.itemId;
			var binId = objInvQBDetails.binId;
			var invStatusId = objInvQBDetails.invStatusId;
			var invReportSearch = search.load({
				id: 'customsearch_wmsse_inv_report_invbnew',
				type: search.Type.INVENTORY_BALANCE
			});


			invReportSearch.filters.push(
				search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocation
				})
			);

			if (_isValueValid(itemId)) {
				invReportSearch.filters.push(
					search.createFilter({
						name: 'item',
						operator: search.Operator.ANYOF,
						values: itemId
					})
				);
			}

			if (_isValueValid(binId)) {
				invReportSearch.filters.push(
					search.createFilter({
						name: 'binnumber',
						operator: search.Operator.ANYOF,
						values: binId
					})
				);
			}

			if (_isValueValid(invStatusId)) {
				invReportSearch.filters.push(
					search.createFilter({
						name: 'status',
						operator: search.Operator.ANYOF,
						values: invStatusId
					})
				);
			}

			var search_page_count = 1000;
			var myPagedData = invReportSearch.runPaged({
				pageSize: search_page_count
			});
			//fetching morethan 4000 without JSON result
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					InvReportSearchResults.push(result);

				});
			});
			return InvReportSearchResults;
		}

		function getOpenTaskPickBinDetailsQuery(itemIds, binIds, warehouseLocationId, inventoryStatusFeature,
			statusIds, locUseBinsFlag, inputMap, uomMap, uomFlag) {
			var opentaskArr = {};

			var myTransactionQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});

			var openPickStatusFlagCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: [8, 28]
			});


			var openPickTaskTypeCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});

			var openPickWhLocCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_location',
				operator: query.Operator.ANY_OF,
				values: warehouseLocationId
			});

			var openPickItemIdCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_sku',
				operator: query.Operator.ANY_OF,
				values: itemIds
			});

			if (_isValueValid(binIds) && locUseBinsFlag == true) {
				var openPickActendLocCond = myTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_actendloc',
					operator: query.Operator.ANY_OF,
					values: binIds
				});
			} else { //this is else for the records created with nobins
				log.debug('considering empty binlocation from OT as criertia for NOBINS', '');
				var openPickActendLocCond = myTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_actendloc',
					operator: query.Operator.EMPTY

				});
			}


			var openPickTranRefCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_nstrn_ref_no',
				operator: query.Operator.EMPTY
			});
			var openPickNSRefCond = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: query.Operator.EMPTY
			});

			if (inventoryStatusFeature) {
				var openPickInvStatusCond = myTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_inventorystatus',
					operator: query.Operator.ANY_OF,
					values: statusIds
				});

				myTransactionQuery.condition = myTransactionQuery.and(
					openPickStatusFlagCond, openPickTaskTypeCond, openPickItemIdCond,
					openPickActendLocCond, openPickWhLocCond, openPickTranRefCond, openPickNSRefCond, openPickInvStatusCond);


			} else {
				myTransactionQuery.condition = myTransactionQuery.and(
					openPickStatusFlagCond, openPickTaskTypeCond, openPickItemIdCond,
					openPickActendLocCond, openPickWhLocCond, openPickTranRefCond, openPickNSRefCond);

			}

			myTransactionQuery.columns = [

				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_sku',
					groupBy: true
				}),

				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_actendloc',
					groupBy: true
				}),

				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty',
					aggregate: query.Aggregate.SUM
				}),

				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_expe_qty',
					aggregate: query.Aggregate.SUM
				}),


				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_inventorystatus',
					groupBy: true
				}),

				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_kitflag',
					groupBy: true
				}),

				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_conversionrate',
					groupBy: true
				})
			];


			var objOPentaskDetails = myTransactionQuery.run().results;
			log.debug({
				title: 'objOPentaskDetails.length --',
				details: objOPentaskDetails.length
			});

			var converRate = 1;
			if (objOPentaskDetails != null && objOPentaskDetails.length > 0) {

				var openPickStr = '';
				var qtyTobeSubtracted = 0;
				for (var objOPentask in objOPentaskDetails) {
					if (inventoryStatusFeature) {

						if (locUseBinsFlag == false) {
							openPickStr = objOPentaskDetails[objOPentask].values[0] + '_' + objOPentaskDetails[objOPentask].values[4];
						} else {
							openPickStr = objOPentaskDetails[objOPentask].values[0] + '_' + objOPentaskDetails[objOPentask].values[1] + '_' + objOPentaskDetails[objOPentask].values[4];
						}
						qtyTobeSubtracted = opentaskArr[openPickStr] ? opentaskArr[openPickStr] : 0;
						if (uomFlag) {
							converRate = uomMap[inputMap[openPickStr]];
						}
					} else {
						if (locUseBinsFlag == false) {
							openPickStr = objOPentaskDetails[objOPentask].values[0];
						} else {
							openPickStr = objOPentaskDetails[objOPentask].values[0] + '_' + objOPentaskDetails[objOPentask].values[1];
						}
						qtyTobeSubtracted = opentaskArr[openPickStr] ? opentaskArr[openPickStr] : 0;
						if (uomFlag) {
							converRate = uomMap[inputMap[openPickStr]];
						}
					}
					var openPickQtywithUOM = 0;
					var vPickQty = 0;
					if (objOPentaskDetails[objOPentask].values[5]) //custrecord_wmsse_kitflag,custrecord_wmsse_expe_qty
					{
						vPickQty = objOPentaskDetails[objOPentask].values[3];
					} else {
						vPickQty = objOPentaskDetails[objOPentask].values[2];
					}
					if (uomFlag) {
						var vPickConversionRate = objOPentaskDetails[objOPentask].values[6];
						vPickConversionRate = getDefaultConvRate(vPickConversionRate);
						converRate = getDefaultConvRate(converRate);

						//  openPickQtywithUOM = vPickQty * (parseFloat(vPickConversionRate) / parseFloat(converRate));
						var conversionRate = Number(Big(vPickConversionRate).div(converRate));
						openPickQtywithUOM = Number(Big(vPickQty).mul(conversionRate));
						qtyTobeSubtracted = Number(Big(qtyTobeSubtracted).plus(openPickQtywithUOM));
						opentaskArr[openPickStr] = qtyTobeSubtracted;
					} else {
						qtyTobeSubtracted = Number(Big(qtyTobeSubtracted).plus(vPickQty));
						opentaskArr[openPickStr] = qtyTobeSubtracted;
					}
				}

			}
			log.debug({
				title: 'opentaskArr',
				details: opentaskArr
			});
			return opentaskArr;
		}

		function getDefaultConvRate(convRate) {
			return (convRate == null || convRate == '' || convRate == 'null' || convRate == '- None -') ? 1 : convRate;
		}

		function getOpenTaskStockCoversionRate(vUnitTypeId, vUnits) {

			var conversionRateObj = {};
			var uomfilters = [];
			var uomcolumns = [];

			if (_isValueValid(vUnits)) {

				if (_isValueValid(vUnitTypeId)) {
					uomfilters[0] = search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: vUnitTypeId
					});
				}

				uomcolumns[0] = search.createColumn({
					name: "conversionrate"
				});
				uomcolumns[1] = search.createColumn({
					name: "internalid"
				});
				uomcolumns[2] = search.createColumn({
					name: "unitname"
				});

				var uomresults = search.create({
					type: 'unitstype',
					filters: uomfilters,
					columns: uomcolumns
				}).run().getRange({
					start: 0,
					end: 1000
				});
				var vFromRate = 1;
				var convRateArr = [];
				if (uomresults != null && uomresults != '') {

					for (var i = 0; i < uomresults.length; i++) {
						vvFromRate = uomresults[i].getValue({
							name: 'conversionrate'
						});
						var unitId = uomresults[i].getValue({
							name: 'internalid'
						});
						var unitname = uomresults[i].getValue({
							name: 'unitname'
						});
						//{"UOM1_EACH" : 1 ,  "UOM1_BOX":  5   }
						conversionRateObj[unitId + '_' + unitname] = vvFromRate;

					}

				}
			}
			return conversionRateObj;
		}

		function getSearchResult(invReportSearch, resultLength) {
			var callbackResultObj = [];
			invReportSearch.run().each(function (result) {
				callbackResultObj.push(result);
				if (parseInt(callbackResultObj.length) == parseInt(resultLength)) {
					return false;
				} else {
					return true;
				}
			});
			return callbackResultObj;
		}
		// As Saved search is not honouring the case sensitivity of Inventory number so we are removing the extra rows
		function getMatchedInventoryNumber(invNumSearchRes, inventoryNumber) {

			if (invNumSearchRes.length > 1 && _isValueValid(inventoryNumber)) {
				for (var itr = 0; itr < invNumSearchRes.length; itr++) {
					if (invNumSearchRes[itr].inventorynumber != inventoryNumber) {
						invNumSearchRes.splice(itr, 1);
						itr--;
					}
				}
			}
			return invNumSearchRes;
		}

		function getPickActionDetailsFromScheduleScriptRecord(processName, currentUserId, transactionInternalId) {
			try {

				var statusDetails = search.load({
					id: 'customsearch_wmsse_mapreduce_status'
				});
				var objFiltersArr = statusDetails.filters;

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsstatus',
					operator: search.Operator.IS,
					values: 'In Progress'
				}));

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsname',
					operator: search.Operator.IS,
					values: processName
				}));

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprstranrefno',
					operator: search.Operator.IS,
					values: parseFloat(transactionInternalId)
				}));

				if (_isValueValid(currentUserId)) {
					objFiltersArr.push(search.createFilter({
						name: 'custrecord_wmsse_schprsinitiatedby',
						operator: search.Operator.ANYOF,
						values: currentUserId
					}));
				}

				statusDetails.filters = objFiltersArr;
				var statusSearchResult = _getSearchResultInJSON(statusDetails);
				return statusSearchResult;
			} catch (exp) {
				log.error('exception in getPickActionDetailsFromScheduleScriptRecord', exp);
			}
		}

		function deleteScheduleScriptRecord(recordInternalId) {
			try {
				if (_isValueValid(recordInternalId)) {
					var scheduleScriptDeleteRecordId = record.delete({
						type: 'customrecord_wmsse_schscripts_status',
						id: recordInternalId
					});
				}
			} catch (e) {
				log.error('exception in deleteTempSchedulerRecord', e);
			}
		}

		function getDefaultRuleValueForAsyncSystemRules(systemRuleName) {
			var systemRuleLookup = {};
			var sytemrulesArray = [{
					key: "Enable bulk staging of large pick tasks",
					value: 125
				},
				{
					key: "Enable bulk picking of large pick tasks",
					value: 125
				}
			]

			for (var arrIndex = 0; arrIndex < sytemrulesArray.length; arrIndex++) {
				var sytemrulesArrayKey = sytemrulesArray[arrIndex].key;
				var sytemrulesArrayValue = sytemrulesArray[arrIndex].value;
				systemRuleLookup[sytemrulesArrayKey] = {
					ruleValue: sytemrulesArrayValue
				};
			}
			var systemRuleValue = systemRuleLookup[systemRuleName].ruleValue
			log.debug('systemRuleValue', systemRuleValue);
			return systemRuleValue;
		}

		function getObjectLength(obj) {
			var key, count = 0;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					count++;
				}

			}
			return count;
		}

		function deleteSerialEntry(transactionInternalId, lineNum, itemInternalId, taskType) {
			var serialNotes = 'because of incomplete transaction this is closed';
			var serialSearch = search.load({
				type: 'customrecord_wmsse_serialentry',
				id: 'customsearch_wmsse_serialentry_details'
			});
			serialSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_status',
				operator: search.Operator.IS,
				values: false
			}));
			if (_isValueValid(lineNum)) {
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordline',
					operator: search.Operator.EQUALTO,
					values: lineNum
				}));
			}
			serialSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));
			serialSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
			if (_isValueValid(taskType)) {
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_tasktype',
					operator: search.Operator.ANYOF,
					values: taskType
				}));
			}

			var serialSearchRes = _getSearchResultInJSON(serialSearch);
			log.debug('delelte serialSearchRes', serialSearchRes);

			for (var record in serialSearchRes) {
				closeSerialEntryStatusCycleCount(serialSearchRes[record], serialNotes);
			}
		}

		function closeSerialEntryStatusCycleCount(lotListSearchRes, serialNotes) {
			var serialRec = record.load({
				type: 'customrecord_wmsse_serialentry',
				id: lotListSearchRes['id']
			});
			serialRec.setValue({
				fieldId: 'id',
				value: lotListSearchRes['id']
			});
			serialRec.setValue({
				fieldId: 'name',
				value: lotListSearchRes['name']
			});
			serialRec.setValue({
				fieldId: 'custrecord_wmsse_ser_note1',
				value: serialNotes
			});
			serialRec.setValue({
				fieldId: 'custrecord_wmsse_ser_status',
				value: true
			});
			serialRec.save();
		}

		function validateItemForUPCcode(itemNo, location) {
			var itemList = [];
			var itemSearchResultsSearch = search.load({
				id: 'customsearch_wmsse_validitem_name_srh'
			});

			var filters = [
				['location', search.Operator.ANYOF, ['@NONE@', location]], 'and',
				["upccode", search.Operator.IS, itemNo], 'and', ["isinactive", search.Operator.IS, false]
			];

			itemSearchResultsSearch.filterExpression = filters;

			itemList = _getSearchResultInJSON(itemSearchResultsSearch);
			return itemList;
		}

		function createWmsPreferences() {
			try {
				var user = runtime.getCurrentUser();
				var roleIntenalId = user.role;
				var fisrtReceipientId = runtime.getCurrentUser().getPreference({
					name: 'custscript_wms_emptybin_emailsend1'
				});

				var secondReceipientId = runtime.getCurrentUser().getPreference({
					name: 'custscript_wms_emptybin_emailsend2'
				});

				var IFperorder = runtime.getCurrentUser().getPreference({
					name: 'CREATEITEMFULFILLMENT'
				});
				//log.debug('fetched IFperorder in utlity for first time',IFperorder);
				var wmsPreferences = [{
						"name": "OVERRECEIPTS",
						"value": false
					},
					{
						"name": "ITEMCOSTASTRNFRORDCOST",
						"value": true
					},
					{
						"name": roleIntenalId,
						"value": false
					},
					{
						"name": "DEPTMANDATORY",
						"value": false
					},
					{
						"name": "CLASSMANDATORY",
						"value": false
					},
					{
						"name": "CREATEITEMFULFILLMENT",
						"value": false
					},
					{
						"name": fisrtReceipientId,
						"value": false
					},
					{
						"name": secondReceipientId,
						"value": false
					},
				];

				var arrIndex = 0;
				var wmsPreferencesLength = wmsPreferences.length;
				for (arrIndex = 0; arrIndex < wmsPreferencesLength; arrIndex++) {
					var preferencesName = wmsPreferences[arrIndex].name;
					var preferencesValue = wmsPreferences[arrIndex].value;

					var wmsPreferencesDetails = getWmsPreferencesSearch(preferencesName);

					if (wmsPreferencesDetails.length == 0) {
						var wmsPreferencesRecord = record.create({
							type: 'customrecord_wms_accounting_preferences'

						});
						wmsPreferencesRecord.setValue({
							fieldId: 'name',
							value: preferencesName
						});
						wmsPreferencesRecord.setValue({
							fieldId: 'custrecord_wms_accountingpre_name',
							value: preferencesName
						});

						if (preferencesName == "OVERRECEIPTS" || preferencesName == "ITEMCOSTASTRNFRORDCOST" ||
							preferencesName == "DEPTMANDATORY" || preferencesName == "CLASSMANDATORY") {
							wmsPreferencesRecord.setValue({
								fieldId: 'custrecord_wms_accountingpre_value',
								value: preferencesValue
							});
						} else if (preferencesName == "CREATEITEMFULFILLMENT") {
							log.debug('setting values in notes field while creating', IFperorder);
							wmsPreferencesRecord.setValue({
								fieldId: 'custrecord_wms_accountingpre_notes',
								value: IFperorder
							});
						} else if (_isValueValid(fisrtReceipientId) || _isValueValid(secondReceipientId)) {
							wmsPreferencesRecord.setValue({
								fieldId: 'custrecord_wms_accountingpre_emailreqire',
								value: true
							});
						}
						wmsPreferencesRecord.save();
					}
				}
			} catch (exp) {
				log.error('exception in createWmsPreferences', exp);
			}
		}

		function getWmsPreferencesValue(preferencesName) {
			var resultValue = false;
			if (preferencesName != "OVERRECEIPTS" && preferencesName != "ITEMCOSTASTRNFRORDCOST" &&
				preferencesName != "DEPTMANDATORY" && preferencesName != "CLASSMANDATORY" && preferencesName != "CREATEITEMFULFILLMENT") {
				resultValue = "";
			}
			var resultsArray = [];
			try {
				resultsArray = getWmsPreferencesSearch(preferencesName);
				log.debug('resultsArray', resultsArray);
				if (resultsArray.length > 0) {
					var recordId = resultsArray[0].internalid;
					var tempRecord = record.load({
						type: 'customrecord_wms_accounting_preferences',
						id: recordId,
						isDynamic: true
					});
					tempRecord.save();
				} else {
					createWmsPreferences();
				}
				var wmsPreferencesDetails = getWmsPreferencesSearch(preferencesName);
				log.debug('wmsPreferencesDetails', wmsPreferencesDetails);
				if (wmsPreferencesDetails.length > 0) {

					if (preferencesName == "OVERRECEIPTS" || preferencesName == "ITEMCOSTASTRNFRORDCOST" ||
						preferencesName == "DEPTMANDATORY" || preferencesName == "CLASSMANDATORY") {
						resultValue = wmsPreferencesDetails[0].wmsPreferencesValue;
					} else {
						resultValue = wmsPreferencesDetails[0].wmsPreferencesNotes;
					}
				}
				log.debug('resultValue', resultValue);
			} catch (e) {
				log.error('execption in getWmsPreferencesValue', e);
			}
			return resultValue;
		}

		function getWmsPreferencesSearch(preferencesName) {
			var accountingFeatureQuery = query.create({
				type: 'customrecord_wms_accounting_preferences'
			});

			if (_isValueValid(preferencesName)) {
				var condOrdlocation = accountingFeatureQuery.createCondition({
					fieldId: 'name',
					operator: query.Operator.IS,
					values: preferencesName
				});
				accountingFeatureQuery.condition = accountingFeatureQuery.and(condOrdlocation);
			}

			accountingFeatureQuery.columns = [
				accountingFeatureQuery.createColumn({
					fieldId: 'name'
				}),
				accountingFeatureQuery.createColumn({
					fieldId: 'id'
				}),
				accountingFeatureQuery.createColumn({
					fieldId: 'custrecord_wms_accountingpre_value'
				}),
				accountingFeatureQuery.createColumn({
					fieldId: 'custrecord_wms_accountingpre_notes'
				}),
				accountingFeatureQuery.createColumn({
					fieldId: 'custrecord_wms_accountingpre_emailreqire'
				}),
			];

			var myPagedData = accountingFeatureQuery.runPaged({
				pageSize: 10
			});

			var resultJsonArr = [];
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, resultJsonArr, columnsObj);
					}
				}
			});
			log.debug('resultJsonArr', resultJsonArr);
			return resultJsonArr;

		}

		function convertToJsonObj(result, resultJsonArr, columnsObj) {

			var columns = columnsObj;
			var values = result.values;

			var resultsObj = {};
			for (var col in columns) {
				var colName = columns[col].fieldId;
				if (colName == 'name') {
					colName = 'wmsPreferencesName';
				}
				if (colName == 'id') {
					colName = 'internalid';
				}
				if (colName == 'custrecord_wms_accountingpre_value') {
					colName = 'wmsPreferencesValue';
				}
				if (colName == 'custrecord_wms_accountingpre_notes') {
					colName = 'wmsPreferencesNotes';
				}
				if (colName == 'custrecord_wms_accountingpre_emailreqire') {
					colName = 'wmsPreferencesEmailRequired';
				}
				resultsObj[colName] = values[col];
			}
			resultJsonArr.push(resultsObj);
		}

		function getAsynScriptDetailsFromScheduleScriptRecord(processName, currentUserId, transactionInternalId) {
			var processStatusFlag = false;
			try {
				var statusDetails = search.load({
					id: 'customsearch_wmsse_mapreduce_status'
				});
				var objFiltersArr = statusDetails.filters;

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsstatus',
					operator: search.Operator.ISNOT,
					values: 'Completed'
				}));

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsname',
					operator: search.Operator.IS,
					values: processName
				}));

				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprstranrefno',
					operator: search.Operator.IS,
					values: parseFloat(transactionInternalId)
				}));

				if (_isValueValid(currentUserId)) {
					objFiltersArr.push(search.createFilter({
						name: 'custrecord_wmsse_schprsinitiatedby',
						operator: search.Operator.ANYOF,
						values: currentUserId
					}));
				}
				statusDetails.filters = objFiltersArr;
				var asynchrousProcessDetails = _getSearchResultInJSON(statusDetails);
				if (asynchrousProcessDetails.length > 0) {
					var processStatus = asynchrousProcessDetails[0].custrecord_wmsse_schprsstatus;
					processStatusFlag = (processStatus == 'In Progress' || processStatus == 'Submitted') ? true : false;
				}
				log.debug('processStatusFlag', processStatusFlag);
			} catch (exp) {
				log.error('exception in getAsynScriptDetailsFromScheduleScriptRecord', exp);
			}

			return processStatusFlag;
		}

		function logDatatoELK(dataObj) {
			try {
				// Logging data to Elasticsearch
				var logger = loggerFactory.create({
					type: loggerFactory.Type.PSG
				});
				var result = logger.info(dataObj);
				log.debug(JSON.stringify(result), "");
			} catch (e) {
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
			}
		}

		function setPaging(sublistDetailArr, form, request) {

			var size = 500;
			var loadConfig = config.load({
				type: config.Type.COMPANY_PREFERENCES
			});
			var companyPreferencesPageSize = loadConfig.getValue({
				fieldId: 'LISTSEGMENTSIZE'
			});
			if (_isValueValid(companyPreferencesPageSize)) {
				size = companyPreferencesPageSize;
			}
			if (sublistDetailArr.length > parseInt(size)) {

				var select = form.addField({
					id: 'custpage_selectpage',
					type: serverWidget.FieldType.SELECT,
					label: translator.getTranslationString('CCGENERATEANDRELEASE.FORM_PAGING_FIELD')
				});

				var len = sublistDetailArr.length / parseInt(size);
				for (var pageSize = 1; pageSize <= Math.ceil(len); pageSize++) {
					var from;
					var to;

					to = parseFloat(pageSize) * parseInt(size);
					from = (parseFloat(to) - parseInt(size)) + 1;
					if (parseFloat(to) > sublistDetailArr.length) {
						to = sublistDetailArr.length;
					}

					var selectvalues = from.toString() + " to " + to.toString();
					var selectvalues_display = from.toString() + "," + to.toString();

					select
						.addSelectOption({
							value: selectvalues_display,
							text: selectvalues
						});

				} //Setting values to Paging Dropdown box3

				if (request.parameters.custpage_selectpage != null &&
					request.parameters.custpage_selectpage != 'null' &&
					request.parameters.custpage_selectpage != '' &&
					request.parameters.custpage_selectpage != 'undefined' &&
					request.parameters.custpage_selectpage != undefined) {
					select.defaultValue = request.parameters.custpage_selectpage;
				}


			}
			var minval = 0;
			var maxval = parseFloat(sublistDetailArr.length) - 1;
			var selectno = request.parameters.custpage_selectpage;

			if (selectno != null && selectno != 'null' && selectno != undefined &&
				selectno != '' && sublistDetailArr.length > parseInt(size)) {
				var selectedPage = request.parameters.custpage_selectpage;
				var selectedPageArray = selectedPage.split(',');

				minval = parseFloat(selectedPageArray[0]) - 1;

				if (parseFloat(sublistDetailArr.length) >= parseFloat(selectedPageArray[1])) {
					maxval = parseFloat(selectedPageArray[1]) - 1;
				}

			} else {
				if (sublistDetailArr.length > parseInt(size)) {
					maxval = parseInt(size) - 1;
				}
			}

			var pageValues = [];
			pageValues.push(minval);
			pageValues.push(maxval);
			return pageValues;
		}

		function getDeparmentandClassSettings() {
			var departmentandClassObj = {};
			var accountConfig = config.load({
				type: config.Type.ACCOUNTING_PREFERENCES
			});

			var makeDepartmentsMandatory = accountConfig.getValue({
				fieldId: 'DEPTMANDATORY'
			});
			var makeClassMandatory = accountConfig.getValue({
				fieldId: 'CLASSMANDATORY'
			});

			departmentandClassObj.makeDepartmentsMandatory = makeDepartmentsMandatory;
			departmentandClassObj.makeClassMandatory = makeClassMandatory;

			return departmentandClassObj;
		}

		function getDeparmentValue() {
			var preferencesName = 'DEPTMANDATORY';
			var departmentsMandatoryValue = getWmsPreferencesValue(preferencesName);
			return departmentsMandatoryValue
		}

		function getClassValue() {
			var preferencesName = 'CLASSMANDATORY';
			var classMandatoryValue = getWmsPreferencesValue(preferencesName);
			return classMandatoryValue
		}

		function getIFPerOrder() {
			var preferencesName = 'CREATEITEMFULFILLMENT';
			var IFPerOrderValue = getWmsPreferencesValue(preferencesName);
			return IFPerOrderValue
		}

		function checkInventoryNumberExistsAndGetDetails(item, lotName, location) {

			var objDetailsSearch = search.load({
				id: 'customsearch_wmsse_assembly_lotscan_srh'
			});
			var filter = objDetailsSearch.filters;
			var cols = [];
			if (_isValueValid(item)) {
				filter.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: item
				}));
			}
			if (_isValueValid(lotName)) {
				filter.push(search.createFilter({
					name: 'inventorynumber',
					operator: search.Operator.IS,
					values: lotName
				}));
			}
			if (_isValueValid(location)) {
				filter.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: location
				}));
			}
			objDetailsSearch.filters = filter;
			var objDetails = objDetailsSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return objDetails;
		}

		function _getInventoryFromBins(stageBins, locationId) {
			var binsInventoryDetails = search.load({
				id: 'customsearch_wmsse_binlocwise_inventory'
			});
			var binFiltersArr = binsInventoryDetails.filters;
			if (_isValueValid(stageBins)) {
				binFiltersArr.push(search.createFilter({
					name: 'binnumber',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: stageBins
				}));
			}
			if (_isValueValid(locationId)) {
				binFiltersArr.push(search.createFilter({
					name: 'location',
					join: 'binOnHand',
					operator: search.Operator.ANYOF,
					values: locationId
				}));
			}
			binsInventoryDetails.filters = binFiltersArr;
			return _getSearchResults(binsInventoryDetails);
		}

		function getUOMDetails(unitTypeId) {
			var resultJsonArr = [];
			if (_isValueValid(unitTypeId)) {

				var unitTypeSearch = query.create({
					type: query.Type.UNITS_TYPE
				});

				var idCond = unitTypeSearch.createCondition({
					fieldId: 'id',
					operator: query.Operator.ANY_OF,
					values: unitTypeId
				});

				unitTypeSearch.columns = [
					unitTypeSearch.createColumn({
						fieldId: 'uom.unitname'
					}),
					unitTypeSearch.createColumn({
						fieldId: 'uom.pluralname'
					}),
					unitTypeSearch.createColumn({
						fieldId: 'uom.baseunit'
					}),
					unitTypeSearch.createColumn({
						fieldId: 'uom.conversionrate'
					}),
					unitTypeSearch.createColumn({
						fieldId: 'uom.internalid'
					}),
					unitTypeSearch.createColumn({
						fieldId: 'uom.abbreviation'
					}),
					unitTypeSearch.createColumn({
						fieldId: 'uom.pluralabbreviation'
					})
				];

				unitTypeSearch.condition = unitTypeSearch.and(idCond);
				var results = unitTypeSearch.runPaged({
					pageSize: 1000
				});
				log.debug('results', results);

				results.pageRanges.forEach(function (pageRange) {
					var myPage = results.fetch({
						index: pageRange.index
					});
					var resultSetObj = myPage.data;
					if (resultSetObj != null && resultSetObj != '') {
						var resultsObj = resultSetObj.results;
						var columnsArray = [];
						for (var col in resultSetObj.columns) {
							var colName = (resultSetObj.columns)[col].fieldId;
							columnsArray.push(colName);
						}
						for (var row in resultsObj) {
							var resultObj = resultsObj[row];
							convertToJson(resultObj, columnsArray, resultJsonArr);
						}
					}
				});
			}
			log.debug('resultJsonArr', resultJsonArr);
			return resultJsonArr;
		}

		function convertToJson(result, columnsArray, resultJsonArr) {
			var resultObj = {};
			var resArray = result.values;
			resultObj = {};
			for (var itr in resArray) {
				resultObj[columnsArray[itr]] = resArray[itr];
			}
			resultJsonArr.push(resultObj);
		}

		function generateCompositeBarcodeString(inputDataObj) {
			var barcodeOutPutObj = {};
			var barcodeFormatRef = '';
			try {
				var systemRule_barcodeResults = getSystemRuleDetails('Enable Advanced Barcode Scanning?', inputDataObj.whLocation, 'Y');
				if (systemRule_barcodeResults.length > 0) {
					if (_isValueValid(systemRule_barcodeResults[0].custrecord_wmsseprocesstypeText) &&
						systemRule_barcodeResults[0].custrecord_wmsseprocesstypeText == translator.getTranslationString("ADVANCE_BARCODE.COMPOSITEBARCODE")) {

						var barcodeFormatArr = getbarcodeformat(inputDataObj.vendorId, true);
						if (barcodeFormatArr.length > 0) {
							for (var barcodeFormat in barcodeFormatArr) {
								barcodeFormatRef = barcodeFormatArr[barcodeFormat].id;
								log.debug('barcodeFormatRef', barcodeFormatRef);

								barcodeOutPutObj = getCompositebarcodecomponents(barcodeFormatRef, inputDataObj);

								if (!_isValueValid(barcodeOutPutObj.error) && _isValueValid(barcodeOutPutObj.compositeBarcodeString)) {
									Insertbarcodestring(barcodeOutPutObj.compositeBarcodeString, inputDataObj.transactionId, barcodeFormatRef);
									break;
								} else if (_isValueValid(barcodeOutPutObj.error)) {
									barcodeOutPutObj.compositeBarcodeString = '';
								}
							}
							if (!_isValueValid(barcodeOutPutObj.compositeBarcodeString)) {
								log.debug('Error in CompositeBarcode generation', translator.getTranslationString("COMPOSITEBARCODE.NO_MATCHING_TEMPLATES"));
							}
						} else {
							log.debug('Error in CompositeBarcode generation', translator.getTranslationString("COMPOSITEBARCODE.NO_TEMPLATES"));
						}
					}
				}
			} catch (e) {
				log.error('Exeception in CompositeBarcode generation', e);
			}
			return barcodeOutPutObj;
		}

		function getCompositebarcodecomponents(barcodeformatref, inputDataObj) {
			var compositeBarcodeString = '';
			var outputObj = {};
			var barcodecomponentSearch = search.load({
				id: 'customsearch_wmsse_barcodecomponents'
			});

			var barcodecomponentFilters = barcodecomponentSearch.filters;
			barcodecomponentFilters.push(
				search.createFilter({
					name: 'custrecord_wmsse_barcode_templatename',
					operator: search.Operator.ANYOF,
					values: barcodeformatref
				}));
			barcodecomponentFilters.push(
				search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));

			barcodecomponentSearch.filters = barcodecomponentFilters;
			var srchbarcodecomponents = _getSearchResultInJSON(barcodecomponentSearch);
			log.debug({
				title: 'srchbarcodecomponents',
				details: srchbarcodecomponents
			});
			if (srchbarcodecomponents.length > 0) {
				var vItem = '';
				var vLot = '';
				var vExpiryDate = '';
				var vQty = '';
				var vUOM = '';
				var vSerialNumber = '';

				for (var barcodecomponent in srchbarcodecomponents) {
					var barcodecomponentRec = srchbarcodecomponents[barcodecomponent];

					var datafield = barcodecomponentRec['custrecord_wmsse_componentnameText'];
					var startindex = barcodecomponentRec['custrecord_wmsse_componentstartingindex'];
					var endindex = barcodecomponentRec['custrecord_wmsse_componentendingindex'];
					var dataformat = barcodecomponentRec['custrecord_wmsse_componentdataformatText'];
					var paddingchar = barcodecomponentRec['custrecord_wms_barcode_paddingcharacterText'];
					var differedLength = (parseInt(endindex) - parseInt(startindex)) + 1;
					switch (datafield) {
						case 'Item':
							if (_isValueValid(inputDataObj.itemName)) {
								if ((inputDataObj.itemName).length <= (parseInt(endindex) - parseInt(startindex)) + 1) {
									compositeBarcodeString = compositeBarcodeString + inputDataObj.itemName;

									differedLength = ((parseInt(endindex) - parseInt(startindex)) + 1) - (inputDataObj.itemName).length;
									for (var count = 0; count < differedLength; count++) {
										compositeBarcodeString = compositeBarcodeString + paddingchar;
									}
								} else {
									outputObj.error = translator.getTranslationString("COMPOSITEBARCODE.ITEMINDEX_NOMATCH");
									log.debug('Error in Composite Barcode generation', outputObj.error);
								}
							} else {
								for (var count = 0; count < (parseInt(endindex) - parseInt(startindex)) + 1; count++) {
									compositeBarcodeString = compositeBarcodeString + paddingchar;
								}
							}
							break;

						case 'Lot':
							if (_isValueValid(inputDataObj.lotName)) {
								if ((inputDataObj.lotName).length <= (parseInt(endindex) - parseInt(startindex)) + 1) {
									compositeBarcodeString = compositeBarcodeString + inputDataObj.lotName;
									differedLength = ((parseInt(endindex) - parseInt(startindex)) + 1) - (inputDataObj.lotName).length;
								}
							}
							for (var count = 0; count < differedLength; count++) {
								compositeBarcodeString = compositeBarcodeString + paddingchar;
							}

							break;

						case 'Expiry Date':
							if (_isValueValid(inputDataObj.lotExpiryDate)) {
								if (dataformat.length <= (parseInt(endindex) - parseInt(startindex)) + 1) {
									try {
										var lotExpiryDate = format.parse({
											value: inputDataObj.lotExpiryDate,
											type: format.Type.DATE
										});

										var formatedLotDate = new Date(lotExpiryDate);

										var month = ((formatedLotDate.getMonth() + 1).toString().length == 2) ? (formatedLotDate.getMonth() + 1) : '0' + (formatedLotDate.getMonth() + 1);
										var date = ((formatedLotDate.getDate()).toString().length == 2) ? (formatedLotDate.getDate()) : '0' + (formatedLotDate.getDate());
										var year = ((formatedLotDate.getFullYear()).toString().length == 4) ? (formatedLotDate.getFullYear()).toString().substring(2, 4) : formatedLotDate.getFullYear();

										if (dataformat == 'MMDDYY') {
											compositeBarcodeString = compositeBarcodeString + month + date + year;
										} else if (dataformat == 'DDMMYY') {
											compositeBarcodeString = compositeBarcodeString + date + month + year;
										} else if (dataformat == 'YYDDMM') {
											compositeBarcodeString = compositeBarcodeString + year + date + month;
										} else if (dataformat == 'YYMMDD') {
											compositeBarcodeString = compositeBarcodeString + year + month + date;
										}
										differedLength = ((parseInt(endindex) - parseInt(startindex)) + 1) - dataformat.length;

									} catch (e) {
										log.error('Exeception in Composite Barcode generation', e);
									}
								}
							}
							for (var count = 0; count < differedLength; count++) {
								compositeBarcodeString = compositeBarcodeString + paddingchar;
							}

							break;

						case 'Quantity':
							if (_isValueValid(inputDataObj.quantity)) {
								if ((inputDataObj.quantity).length <= (parseInt(endindex) - parseInt(startindex)) + 1) {
									compositeBarcodeString = compositeBarcodeString + inputDataObj.quantity;
									differedLength = ((parseInt(endindex) - parseInt(startindex)) + 1) - (inputDataObj.quantity).length;

								}
							}
							for (var count = 0; count < differedLength; count++) {
								compositeBarcodeString = compositeBarcodeString + paddingchar;
							}

							break;

						case 'UOM':
							if (_isValueValid(inputDataObj.uom)) {
								if ((inputDataObj.uom).length <= (parseInt(endindex) - parseInt(startindex)) + 1) {
									compositeBarcodeString = compositeBarcodeString + inputDataObj.uom;
									differedLength = ((parseInt(endindex) - parseInt(startindex)) + 1) - (inputDataObj.uom).length;
								}
							}
							for (var count = 0; count < differedLength; count++) {
								compositeBarcodeString = compositeBarcodeString + paddingchar;
							}

							break;

						case 'Serial Number':
							if (_isValueValid(inputDataObj.serialName)) {
								if ((inputDataObj.serialName).length <= (parseInt(endindex) - parseInt(startindex)) + 1) {
									compositeBarcodeString = compositeBarcodeString + inputDataObj.serialName;
									differedLength = ((parseInt(endindex) - parseInt(startindex)) + 1) - (inputDataObj.serialName).length;
								}
							}
							for (var count = 0; count < differedLength; count++) {
								compositeBarcodeString = compositeBarcodeString + paddingchar;
							}

							break;
					}
				}
			}
			outputObj.compositeBarcodeString = compositeBarcodeString;
			return outputObj;
		}

		function getScheduleScriptStatus(schedulerName) {
			var wmsFilters = [];
			wmsFilters.push(
				search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: schedulerName
				})
			);
			wmsFilters.push(
				search.createFilter({
					name: 'custrecord_wmsse_schprsstatus',
					operator: search.Operator.ISNOT,
					values: 'Completed'
				})
			);
			var searchObj = search.create({
				type: 'customrecord_wmsse_schscripts_status',
				filters: wmsFilters,
				columns: ['custrecord_wmsse_schprsstatus']
			});
			var searchResult = [];
			var search_page_count = 1;

			var myPagedData = searchObj.runPaged({
				pageSize: search_page_count
			});
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					searchResult.push(result);
				});
			});
			var scheduleScriptStatus = 'Completed';
			log.debug({
				title: 'searchResult',
				details: searchResult
			});
			if (searchResult.length > 0) {
				scheduleScriptStatus = searchResult[0].getValue('custrecord_wmsse_schprsstatus');
			}

			return scheduleScriptStatus;
		}

		function _chkScheduleScriptStatus(schduleScriptName, transactionName) {
			var scheduleScriptStatus = 'Completed';
			if (_isValueValid(transactionName)) {
				var wmsFilters = [];
				wmsFilters.push(
					search.createFilter({
						name: 'name',
						operator: search.Operator.IS,
						values: schduleScriptName
					})
				);
				wmsFilters.push(
					search.createFilter({
						name: 'custrecord_wmsse_schprstranrefno',
						operator: search.Operator.IS,
						values: transactionName
					})
				);
				wmsFilters.push(
					search.createFilter({
						name: 'custrecord_wmsse_schprsstatus',
						operator: search.Operator.ISNOT,
						values: 'Completed'
					})
				);
				var searchObj = search.create({
					type: 'customrecord_wmsse_schscripts_status',
					filters: wmsFilters,
					columns: ['custrecord_wmsse_schprsstatus']
				});
				var searchResult = [];
				var search_page_count = 1;

				var myPagedData = searchObj.runPaged({
					pageSize: search_page_count
				});
				myPagedData.pageRanges.forEach(function (pageRange) {
					var myPage = myPagedData.fetch({
						index: pageRange.index
					});
					myPage.data.forEach(function (result) {
						searchResult.push(result);
					});
				});

				log.debug({
					title: 'searchResult',
					details: searchResult
				});
				if (searchResult.length > 0) {
					scheduleScriptStatus = searchResult[0].getValue('custrecord_wmsse_schprsstatus');
				}
			}

			return scheduleScriptStatus;
		}

		function _searchOnEmployeeForEmailId(employeeId) {

			var accountingFeatureQuery = query.create({
				type: 'employee'
			});

			if (_isValueValid(employeeId)) {
				var condOrdlocation = accountingFeatureQuery.createCondition({
					fieldId: 'id',
					operator: query.Operator.ANY_OF,
					values: employeeId
				});
				accountingFeatureQuery.condition = accountingFeatureQuery.and(condOrdlocation);
			}

			accountingFeatureQuery.columns = [
				accountingFeatureQuery.createColumn({
					fieldId: 'email'
				}),
			];

			var myPagedData = accountingFeatureQuery.runPaged({
				pageSize: 10
			});

			var resultJsonArr = [];
			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, resultJsonArr, columnsObj);
					}
				}
			});
			log.debug('resultJsonArr for employee nquery', resultJsonArr);
			return resultJsonArr;

		}

		function fnChkSmartCountAppEntryInMobileAppDefault() {
			var returnVal = false;
			try {
				var applicationDefalutSearch = search.create({
					type: 'customrecord_mobile_application_defaults',
					filters: [{
							name: 'name',
							operator: 'is',
							values: 'Smart_Count'
						},
						{
							name: 'isinactive',
							operator: 'is',
							values: 'F'
						}
					]
				});

				var myPagedData = applicationDefalutSearch.runPaged({
					pageSize: 10
				});
				myPagedData.pageRanges.forEach(function (pageRange) {
					var myPage = myPagedData.fetch({
						index: pageRange.index
					});
					myPage.data.forEach(function (result) {
						returnVal = true;
					});
				});
			} catch (e) {
				log.error("e", e);
				returnVal = false;
			}

			return returnVal;
		}

		function fnChkWMSCountConfigurtion() {
			var returnVal = false;
			try {
				var applicationDefalutSearch = search.create({
					type: 'customrecord_sc_count_configuration',
					filters: [{
						name: 'name',
						operator: 'is',
						values: 'WMS Blocked Bins List'
					}]
				});

				var myPagedData = applicationDefalutSearch.runPaged({
					pageSize: 1000
				});
				myPagedData.pageRanges.forEach(function (pageRange) {
					var myPage = myPagedData.fetch({
						index: pageRange.index
					});
					myPage.data.forEach(function (result) {
						returnVal = true;
						//return true;
					});
				});
			} catch (e) {
				returnVal = false;
			}

			return returnVal;
		}

		function _createOrUpdateOpentask(openTaskId, quantity, objOpentaskDetails, warehouseLocationId, itemObj) {
			if (utility.isValueValid(openTaskId)) {
				_updateOpentaskFields(openTaskId, quantity);
			} else {
				var binObject = _getRecomendedBinFromPutStrategy(itemObj.itemInternalID, warehouseLocationId, itemObj.transactionType,
					itemObj.transactionInternalId, itemObj.transcationUomInternalId,
					"", itemObj.selectedConversionRate, itemObj.invtStatus, itemObj.lotName);
				var recomendedBinId = "";
				if (JSON.stringify(binObject)) {
					recomendedBinId = binObject.binInternalId;
				}
				objOpentaskDetails.enterBin = recomendedBinId;
				objOpentaskDetails.beginLoc = recomendedBinId;
				openTaskId = inboundUtility.updateOpenTask(objOpentaskDetails);
			}
			log.emergency("openTaskId", openTaskId);
			return openTaskId;
		}

		return {
			checkTransactionLock: checkTransactionLock,
			getSKUIdWithName: getSKUIdWithName,
			getItemType: getItemType,
			isInvStatusFeatureEnabled: isInvStatusFeatureEnabled,
			getStockCoversionRate: getStockCoversionRate,
			getUnitsType: getUnitsType,
			getSystemRuleValue: getSystemRuleValue,
			getPutBinAndIntDetails: getPutBinAndIntDetails,
			isInventoryNumberExists: isInventoryNumberExists,
			getBinInternalId: getBinInternalId,
			setExpiryDate: setExpiryDate,
			getRoleBasedLocation: getRoleBasedLocation,
			getLocationName: getLocationName,
			DateSetting: DateSetting,
			convertDate: convertDate,
			getSearchResultInJSON: _getSearchResultInJSON,
			getCurrentUserLanguage: _getCurrentUserLanguage,
			getAllLocations: _getAllLocations,
			getWHLocations: _getWHLocations,
			isValueValid: _isValueValid,
			itemValidationForInventoryAndOutBound: _itemValidationForInventoryAndOutBound,
			uomConversions: uomConversions,
			getStageLocations: _getStageLocations,
			fnGetInventoryBins: fnGetInventoryBins,
			fnGetInventoryBinsForLot: fnGetInventoryBinsForLot,
			inventoryNumberInternalId: inventoryNumberInternalId,
			DateStamp: DateStamp,
			DateSetting: DateSetting,
			getInventoryStatusOptions: getInventoryStatusOptions,
			getItemDetails: getItemDetails,
			//getstatusDetails:getstatusDetails,
			isIntercompanyCrossSubsidiaryFeatureEnabled: isIntercompanyCrossSubsidiaryFeatureEnabled,
			getInventoryDetailsFromBins: _getInventoryDetailsFromBins,
			getItemWiseStatusDetailsInBin: _getItemWiseStatusDetailsInBin,
			getSubsidiaryforLocation: getSubsidiaryforLocation,
			updateScheduleScriptStatus: updateScheduleScriptStatus,
			ValidateDate: ValidateDate,
			getCurrentTimeStamp: getCurrentTimeStamp,
			getSerialList: _getSerialList,
			deleteTransactionLock: deleteTransactionLock,
			getConversionRate: getConversionRate,
			//	getBinQtyDetailsItemwise:getBinQtyDetailsItemwise,
			getSearchResultInJSONForValidation: _getSearchResultInJSONForValidation,
			//getInventoryAvailableStatus:getInventoryAvailableStatus,
			//getSelectedStatus:getSelectedStatus,
			//fnGetBinsbyZones:fnGetBinsbyZones,
			//fnGetBinsbyZonesAlongWithStage:fnGetBinsbyZonesAlongWithStage,
			//getStatusId:getStatusId,
			getLotInternalId: getLotInternalId,
			//wmsmenusHiding:_wmsmenusHiding,
			isWebstoreFeatureEnabled: _isWebstoreFeatureEnabled,
			getItemFieldsByLookup: _getItemFieldsByLookup,
			parseTimeString: parseTimeString,
			getItemMixFlagDetails: getItemMixFlagDetails,
			submitRecord: submitRecord,
			getInventoryStatusOptionsList: getInventoryStatusOptionsList,
			newMenusDisplayOnWarehouseMgmtFeature: newMenusDisplayOnWarehouseMgmtFeature,
			oldMenusDisplayOnWarehouseMgmtFeature: oldMenusDisplayOnWarehouseMgmtFeature,
			getRecommendedBins: getRecommendedBins,
			getLocationFieldsByLookup: _getLocationFieldsByLookup,
			getPutStratagies: _getPutStratagies,
			checkInactiveItem: checkInactiveItem,
			isLotnumberedInventoryFeatureEnabled: _isLotnumberedInventoryFeatureEnabled,
			isSerializedInventoryFeatureEnabled: _isSerializedInventoryFeatureEnabled,
			lookupOnLocationForUseBins: lookupOnLocationForUseBins,
			nonInventoryItemTypeCheck: nonInventoryItemTypeCheck,
			isPopulateWMSCartonFieldSet: isPopulateWMSCartonFieldSet,
			addItemDatatoResponse: addItemDatatoResponse,
			getSystemRuleDetails: getSystemRuleDetails,
			getUomValues: getUomValues,
			getDefaultInvStatus: getDefaultInvStatus,
			getInventoryStatusListForOutBound: getInventoryStatusListForOutBound,
			getInvReportDetails: getInvReportDetails,
			getOpenTaskPickBinDetailsQuery: getOpenTaskPickBinDetailsQuery,
			getDefaultConvRate: getDefaultConvRate,
			getOpenTaskStockCoversionRate: getOpenTaskStockCoversionRate,
			getSearchResult: getSearchResult,
			getMatchedInventoryNumber: getMatchedInventoryNumber,
			getPickActionDetailsFromScheduleScriptRecord: getPickActionDetailsFromScheduleScriptRecord,
			deleteScheduleScriptRecord: deleteScheduleScriptRecord,
			getDefaultRuleValueForAsyncSystemRules: getDefaultRuleValueForAsyncSystemRules,
			getObjectLength: getObjectLength,
			closeSerialEntryStatusCycleCount: closeSerialEntryStatusCycleCount,
			deleteSerialEntry: deleteSerialEntry,
			createWmsPreferences: createWmsPreferences,
			getWmsPreferencesSearch: getWmsPreferencesSearch,
			getWmsPreferencesValue: getWmsPreferencesValue,
			createDynamicSearchOnRoleForSubsidaries: _createDynamicSearchOnRoleForSubsidaries,
			getAsynScriptDetailsFromScheduleScriptRecord: getAsynScriptDetailsFromScheduleScriptRecord,
			logDatatoELK: logDatatoELK,
			setPaging: setPaging,
			getSearchResults: _getSearchResults,
			validateItemWithGS1barCode: validateItemWithGS1barCode,
			getDeparmentandClassSettings: getDeparmentandClassSettings,
			getSearchResultCount: _getSearchResultCount,
			getDeparmentValue: getDeparmentValue,
			getClassValue: getClassValue,
			checkInventoryNumberExistsAndGetDetails: checkInventoryNumberExistsAndGetDetails,
			getSystemRuleValueWithProcessType: getSystemRuleValueWithProcessType,
			getInventoryFromBins: _getInventoryFromBins,
			getUOMDetails: getUOMDetails,
			generateCompositeBarcodeString: generateCompositeBarcodeString,
			isCentralizedPurchasingandBillingFeatureEnabled: isCentralizedPurchasingandBillingFeatureEnabled,
			getScheduleScriptStatus: getScheduleScriptStatus,
			chkScheduleScriptStatus: _chkScheduleScriptStatus,
			searchOnEmployeeForEmailId: _searchOnEmployeeForEmailId,
			fnChkWMSCountConfigurtion: fnChkWMSCountConfigurtion,
			fnChkSmartCountAppEntryInMobileAppDefault: fnChkSmartCountAppEntryInMobileAppDefault,
			getProcessId: getProcessId,
			replaceAll: replaceAll,
			getbarcodeformat: getbarcodeformat,
			Insertbarcodestring: Insertbarcodestring,
			parsebarcodestring: parsebarcodestring,
			getbarcodecomponents: getbarcodecomponents,
			getvalidexpirydate: getvalidexpirydate,
			fnGetInventoryBinsForLotForBinPutaway: fnGetInventoryBinsForLotForBinPutaway,
			createOrUpdateOpentask: _createOrUpdateOpentask,
			getIFPerOrder: getIFPerOrder


		}
	});