/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', './big', './wms_workOrderUtility_kpi'],

	function (search, utility, translator, Big, woUtility) {

		function doPost(requestBody) {

			var orderListDetails = {};
			var debugString = '';
			var requestParams = '';

			try {
				if (utility.isValueValid(requestBody)) {
					log.debug({
						title: 'requestBody',
						details: requestBody
					});
					requestParams = requestBody.params;
					var whLocation = requestParams.warehouseLocationId;
					var locUseBinsFlag = requestParams.locUseBinsFlag;
					var internalIdArr = [];
					var orderListArray = [];
					var assemblyItemQtyObj = {};
					var woInternalId = '';
					if (utility.isValueValid(whLocation)) {
						if (!utility.isValueValid(locUseBinsFlag)) {
							locUseBinsFlag = utility.lookupOnLocationForUseBins(whLocation);
						}

						var woDetailsList = woUtility.getWorkOrderDetails(whLocation);						
						var woDetailsListObj = {};
						for (var itemIndex = 0; itemIndex < woDetailsList.length; itemIndex++) {
							woInternalId = woDetailsList[itemIndex].getValue({
								name: 'internalid'
							});
							log.debug({
								title: 'internalid',
								details: woInternalId
							});
							assemblyItemQtyObj[woInternalId] = woDetailsList[itemIndex].getValue({
								name: 'quantity'
							});
							log.debug({
								title: 'quantity',
								details: assemblyItemQtyObj[woInternalId]
							});
							woDetailsListObj[woInternalId] = itemIndex;
							internalIdArr.push(woInternalId);
						}

						var validWOObj = woUtility.checkComponentItemsQty(internalIdArr, '', assemblyItemQtyObj, locUseBinsFlag);
						log.debug('validWOObj', validWOObj);

						var finalObject = {};
						var woItemsDtlObj = {};
						for (var count in validWOObj) {

							if (validWOObj[count] != undefined && validWOObj[count] != null && validWOObj[count] > 0) {
								if (woDetailsListObj[count] != undefined &&
									woDetailsListObj[count] != null) {
									finalObject = _resultToJson(woDetailsList[woDetailsListObj[count]]);

									finalObject.builtItems = finalObject.quantityshiprecv + '/' + finalObject.quantity;
									finalObject.buildable = validWOObj[count];
									orderListArray.push(finalObject);
								}
							}
						}
						if (orderListArray.length > 0) {
							orderListDetails.orderList = orderListArray;
							orderListDetails.isValid = true;
						} else {
							orderListDetails.errorMessage = translator.getTranslationString('WO_ASSEMBLY.NOORDERSTOSHOW');
							orderListDetails.isValid = false;
						}

					} else {
						orderListDetails.errorMessage = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						orderListDetails.isValid = false;
					}
				} else {
					orderListDetails.isValid = false;
				}

			} catch (e) {
				orderListDetails.isValid = false;
				orderListDetails.errorMessage = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}
			log.debug('orderListDetails--', orderListDetails);
			return orderListDetails;
		}

		function _resultToJson(searchResult) {
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
			return resultObj;
		}

		return {
			'post': doPost
		};
	});