/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define([ './wms_utility', './wms_tallyScan_utility', './big', './wms_translator', 'N/record', './wms_outBoundUtility', 'N/wms/recommendedBins', 'N/query'],
		/**
		 * @param {search} search
		 */
		function (utility, tallyScanUtility, bigJS, translator, record, obUtility, binApi, query) {


	function doPost(requestBody) {

		var picktaskValidate = {};
		var pickTaskId = '';
		var requestParams = '';
		var recommendedBinNum = '';
		var recommendedBinId = '';
		var iteminternalid = '';
		var stockunitText = '';
		var actionType = '';
		var pickTaskName = '';
		var lineitemsubitemof = '';
		var locUseBinsFlag = '';
		var processNameFromState = '';
	
		var uomResult = [];
		var baseUnitId = '';
		var baseUnitName = '';
		var baseUnitConvRate = '';
		var transactionInternalId = '';
	
		try {
			requestParams = requestBody.params;

			log.debug({title: 'requestParams', details: requestParams});
			if (utility.isValueValid(requestParams)) {

				pickTaskName = requestParams.pickTaskName;
				actionType = requestParams.actionType;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				processNameFromState = requestParams.processNameFromState;
				transactionInternalId = requestParams.transactionInternalId;
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				
				
				if (utility.isValueValid(pickTaskName)) {
					
					if(!utility.isValueValid(isZonePickingEnabled)){
						isZonePickingEnabled = false;
					}
					if(!utility.isValueValid(selectedZones)){
						selectedZones = [];
					}
					
					if (actionType == 'btnAction') {
						pickTaskId = pickTaskName;
					} else {
						pickTaskId = requestParams.pickTaskId;
					}

					if (utility.isValueValid(pickTaskId)) {
						var objpickTaskDetails = [];
						try {
							objpickTaskDetails = this._getPickTaskResultsWithNQuery(pickTaskId,transactionInternalId);
						} catch (e) {
							picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDPICKTASK');
							picktaskValidate.isValid = false;
						}

						if (objpickTaskDetails.length > 0) {

							var pickTaskStatus = objpickTaskDetails[0].status;
							var pickTaskPicker = objpickTaskDetails[0].picker;
							var isValidPicker = obUtility.validatePicker(pickTaskPicker);
							if (!isValidPicker) {
								picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_PICKTASK.ALREADYINTIATED');
								picktaskValidate.isValid = false;
							} else if (pickTaskStatus == 'FAILED') {
								picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_PICKTASK.PICKED');
								picktaskValidate.isValid = false;
							} else {
								var wareHouseLocationId = objpickTaskDetails[0].location;
								if (!utility.isValueValid(locUseBinsFlag)) {

									log.debug({title: 'wareHouseLocationId', details: wareHouseLocationId});
									var columnsArr = [];
									columnsArr.push('usesbins');
									var locResults = utility.getLocationFieldsByLookup(wareHouseLocationId, columnsArr);
									if (locResults) {
										locUseBinsFlag = locResults.usesbins;
									}

								}

								var pickTaskRemQty = objpickTaskDetails[0].remainingquantity;
								log.debug({title: 'pickTaskRemQty', details: pickTaskRemQty});
								var pickTaskIdNum = parseInt(pickTaskId);
								if (parseFloat(pickTaskRemQty) > 0) {
									if (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == true) {


										var pickTaskArr = [];
										pickTaskArr.push(pickTaskIdNum);

										var binResults = binApi.recommendPickPathForPickTasks(pickTaskArr);
										if (binResults !== null && binResults !== undefined && binResults !== 'null') {
											log.debug({title: 'binResults', details: binResults});


											var binData = binResults.bins[0].data;
											var binStatus = binResults.bins[0].status.code;
											if (binStatus == 'SUCCESS') {
												recommendedBinNum = binData.bin.name;
												recommendedBinId = binData.bin.id;
												var pickTaskRecomendedBinZoneId = binData.zone.id;
												picktaskValidate.recommendedBinZoneName = binData.zone.name;
												picktaskValidate.recommendedBinZoneId = pickTaskRecomendedBinZoneId;
												if(!utility.isValueValid(pickTaskRecomendedBinZoneId) || pickTaskRecomendedBinZoneId == -1){
													pickTaskRecomendedBinZoneId = '0';
												}
												if((isZonePickingEnabled ==  true && (selectedZones.indexOf(pickTaskRecomendedBinZoneId) != -1 || 
														(isValidPicker == true && utility.isValueValid(pickTaskPicker)))) 
														|| 	isZonePickingEnabled != true){

													var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
													var binStatusMakeAvailableQty = 0;
													if (inventoryStatusFeature) {

														var inventoryStatusOptions = utility.getInventoryStatusOptions();
														if (inventoryStatusOptions.length > 0) {

															var binQtyArr = binResults.bins[0].data.quantities;
															for (var qtyIndex = 0; qtyIndex < binQtyArr.length; qtyIndex++) {

																var recomendedBinStatusName = binQtyArr[qtyIndex].status.name;

																for (var invtStatus in inventoryStatusOptions) {
																	if(inventoryStatusOptions[invtStatus]){
																		var inventoryStatusRow = inventoryStatusOptions[invtStatus];
																		var statusText = inventoryStatusRow.name;

																		if (recomendedBinStatusName == statusText) {

																			var makeInventoryAvailable = inventoryStatusRow.listInventoryavailable;
																			if (makeInventoryAvailable) {
																				var tempBinStatusQty = binQtyArr[qtyIndex].quantity;
																				binStatusMakeAvailableQty = Number(bigJS(binStatusMakeAvailableQty).plus(tempBinStatusQty));
																			}
																		}
																	}
																}
															}
														}
													} else {
														binStatusMakeAvailableQty = binData.quantities[0] ? binData.quantities[0].quantity : 0;
													}
													picktaskValidate.recommendedBinQty = binStatusMakeAvailableQty;
												}
												else {
													picktaskValidate.errorMessage = translator.getTranslationString('wms_ZonePicking.INVALID_PICKTASK_SCANNED');
													picktaskValidate.isValid = false;
												}
											}
										} else {
											picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDPICKTASK');
											picktaskValidate.isValid = false;
										}
									}
									if( picktaskValidate.isValid != false){
										iteminternalid = objpickTaskDetails[0].item;
										stockunitText = objpickTaskDetails[0].stockunit;
										lineitemsubitemof = objpickTaskDetails[0].subitemof;
										var inventoryDetailRec = [];
										inventoryDetailRec = objpickTaskDetails[0].inventorynumber ? utility.inventoryNumberInternalId(null, null, null, "singleOrderPicking", objpickTaskDetails[0].inventorynumber) : [];
										var inventoryDetailLotOrSerial = inventoryDetailRec.length > 0 ? inventoryDetailRec[0].inventorynumber : null;
										var waveId = objpickTaskDetails[0].wave;
										var unitsType = objpickTaskDetails[0].unitsType;
										var pickTaskLine = objpickTaskDetails[0].linenumber;


										var itemDetails = {};
										itemDetails = tallyScanUtility.getItemDetails(iteminternalid, itemDetails);
										var itemType = itemDetails.itemType;
										unitsType = itemDetails.unitType;
										var itemImageURL = itemDetails.imageUrl;
										picktaskValidate.stockunitText = itemDetails.stockUnitText;


										if (!utility.isValueValid(recommendedBinNum) && locUseBinsFlag == true &&
												(itemType == 'inventoryitem' || itemType == 'assemblyitem' || itemType ==
													'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'
											|| itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')) {
											
											picktaskValidate.errorMessage = translator.getTranslationString('SINGLEANDMULTIORDERPICKING_INACTIVEBINORNOINVENTORYAVAILABLE');
											picktaskValidate.isValid = false;
											
										} else {
											log.debug({title: 'itemType', details: itemType});
											if (utility.isValueValid(unitsType)) {
												var uomLst = _getUomList(unitsType, picktaskValidate, objpickTaskDetails[0].units,
														objpickTaskDetails[0].stockunit);
												var quantityInStock;
												if(utility.isValueValid(picktaskValidate.stockUomConversionRate) && utility.isValueValid(picktaskValidate.transactionUomConversionRate)){
												quantityInStock = utility.uomConversions(pickTaskRemQty,picktaskValidate.stockUomConversionRate,picktaskValidate.transactionUomConversionRate);
												picktaskValidate.quantityInStock = quantityInStock;
												picktaskValidate.quantityInStockwithUOM = quantityInStock +  ' ' + picktaskValidate.stockunitText;
												}
												picktaskValidate.unitstype = unitsType;
												picktaskValidate.uomList = uomLst;
											} else {

												picktaskValidate.uomDefaultStatus = '';
												picktaskValidate.units = '';
												picktaskValidate.transactionUomConversionRate = '';
											}


											if (!(utility.isValueValid(pickTaskPicker))) {
												log.debug({title: 'pickTaskIdNum', details: pickTaskIdNum});
												var pickTaskRecord = record.load({
													type: 'picktask',
													id: pickTaskIdNum
												});
												obUtility.updateAssignedPicker(pickTaskRecord);
												pickTaskRecord.save();
											}
											var baseUnitRes = [];
											if (utility.isValueValid(unitsType)) {
												uomResult = tallyScanUtility.getUOMDetails(unitsType);
												baseUnitRes = obUtility.getBaseUnitRate(unitsType);

												for (var itr in uomResult) {
													if (uomResult[itr]['uom.baseunit']) {
														baseUnitId = uomResult[itr]['uom.internalid'];
														baseUnitName = uomResult[itr]['uom.unitname'];
														baseUnitConvRate = uomResult[itr]['uom.conversionrate'];
													}
												}
											}
											itemDetails.transactionuomId = objpickTaskDetails[0].units;
											itemDetails.pickQuantity = pickTaskRemQty;
											itemDetails.baseUnitId = baseUnitId;
											itemDetails.baseUnitConvRate = baseUnitConvRate;

											itemDetails = tallyScanUtility.getTallyScanRuleData(wareHouseLocationId, processNameFromState, itemDetails);
											// for service item also, passing item Type as nonInventory item to skip the Onboarding changes.
											if(itemType == "serviceitem")
												itemType = "noninventoryitem";
											picktaskValidate.itemType = itemType;
											picktaskValidate.isValid = true;
											picktaskValidate.inventoryDetailLotOrSerial = inventoryDetailLotOrSerial;
											picktaskValidate.waveId = waveId;
											picktaskValidate.transactionLineId = pickTaskLine;
											picktaskValidate.recommendedbin = recommendedBinNum;
											picktaskValidate.recommendedBinId = recommendedBinId;
											picktaskValidate.lineitemremainingquantity = objpickTaskDetails[0].remainingquantity;
											picktaskValidate.stockunit = objpickTaskDetails[0].stockunit;
											picktaskValidate.item = objpickTaskDetails[0].itemid;
											picktaskValidate.salesdescription = objpickTaskDetails[0].description;
											picktaskValidate.itemInternalid = iteminternalid;
											picktaskValidate.picktaskId = pickTaskIdNum;
											picktaskValidate.quantity = objpickTaskDetails[0].quantity;
											picktaskValidate.totalpickedquantity = objpickTaskDetails[0].totalpickedquantity;
											picktaskValidate.unitstype = objpickTaskDetails[0].unitstype;
											picktaskValidate.isStatusDataTableFlag = true;
											picktaskValidate.isTallyScanRequired = itemDetails.isTallyScanRequired;
											if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem' || itemType == 'noninventoryitem') {
												picktaskValidate.isStatusDataTableFlag = false;
											}
											if (itemDetails.isTallyScanRequired) {
												picktaskValidate.lotShown = false;
												picktaskValidate.tallyScanBarCodeQty = itemDetails.tallyScanBarCodeQty;
												picktaskValidate.transactionuomValue = objpickTaskDetails[0].units;
												picktaskValidate.itemImageURL = itemImageURL;
												var selectedUOM = tallyScanUtility.fetchSelectedUOM(iteminternalid, objpickTaskDetails[0].units);
												log.debug({title: 'selectedUOM', details: selectedUOM});
												picktaskValidate.uominternalId = selectedUOM.uominternalId;
												picktaskValidate.uomid = selectedUOM.uomid;
												itemDetails.transactionUomConversionRate = selectedUOM.uomid;

												if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {


													picktaskValidate.numberOfTimesSerialScanned = 0;
													picktaskValidate.isStatusDataTableFlag = false;
													if (utility.isValueValid(unitsType)) {
														var lineitemremainingquantity = objpickTaskDetails[0].remainingquantity;

														itemDetails = tallyScanUtility.getQtyInBaseUnits(itemDetails, lineitemremainingquantity);
														picktaskValidate.units = baseUnitRes[0].unitname;

														picktaskValidate.scannedQuantityInEach = itemDetails.lineitemremainingquantity;
														picktaskValidate.lineitemremainingquantity = itemDetails.lineitemremainingquantity;
														picktaskValidate.uomSelectionforFirstItr = itemDetails.baseUnitId;//For Serial Item.. It should be base units

													} else {
														picktaskValidate.scannedQuantityInEach = objpickTaskDetails[0].remainingquantity;
														picktaskValidate.lineitemremainingquantity = objpickTaskDetails[0].remainingquantity;

													}


												}
												picktaskValidate.barcodeQuantity = itemDetails.barcodeQuantity;
											}
											picktaskValidate.binEmptySystemRuleValue =false;
											if(locUseBinsFlag == true)
											{
												log.debug('getting bin empty system rule','itemDetails');
                                                var systemRule = "Enable bin reporting and blocking";
												var binEmptySystemRuleValue = utility.getSystemRuleValue(systemRule,wareHouseLocationId);
                                                var systemRuleValue = false;
												if(utility.isValueValid(binEmptySystemRuleValue) && binEmptySystemRuleValue == "Y") {
													systemRuleValue = true;
												}
                                                picktaskValidate.binEmptySystemRuleValue =systemRuleValue;
											}


											var subitemOf = objpickTaskDetails[0].fullname;

											if (utility.isValueValid(subitemOf)) {
												picktaskValidate.info_lineitemsubitemof = subitemOf;
												var subItemId = objpickTaskDetails[0].subitemof;
												var columnArray = [];
												var itemLookUp = utility.getItemFieldsByLookup(subItemId, columnArray);
												if (itemLookUp.thumbnailurl != undefined) {
													picktaskValidate.info_imageURL_lineitemsubitemof = itemLookUp.thumbnailurl;
												}

											}
										}
									}
								} else {
									picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_PICKTASK.PICKED');
									picktaskValidate.isValid = false;
								}
							}
						} else {
							picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDPICKTASK');
							picktaskValidate.isValid = false;
						}
					} else {
						picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDPICKTASK');
						picktaskValidate.isValid = false;
					}
				} else {
					picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDPICKTASK');
					picktaskValidate.isValid = false;
				}
			} else {
				picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDINPUT');
				picktaskValidate.isValid = false;
			}
		} catch (e) {
			picktaskValidate.isValid = false;
			picktaskValidate.errorMessage = e.message;
			log.error({title: 'errorMessage', details: e.message + ' Stack :' + e.stack});

		}
		return picktaskValidate;
	}

	function _getPickTaskResultsWithNQuery(pickTaskId,transactionInternalId) {


		var myPickTaskQuery = query.create({
			type: query.Type.PICK_TASK
		});
		var itemFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'item^item'
		});
		var pickActionsFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'pickactions'
		});
		var pickTaskUomFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'units'
		});
		var subItemFieldsJoin = pickActionsFieldsJoin.autoJoin({ // ADDITION
			fieldId: 'subitemof^item'
		});
		// Create a query column
		var pickTaskColumnsArr = [];
		pickTaskColumnsArr.push(pickTaskUomFieldsJoin.createColumn({
			fieldId: 'unitname'
		}));
		pickTaskColumnsArr.push(pickActionsFieldsJoin.createColumn({
			fieldId: 'linenumber'
		}));

		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'wave'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'status'
		}));
		pickTaskColumnsArr.push(pickActionsFieldsJoin.createColumn({
			fieldId: 'quantity'
		}));
		pickTaskColumnsArr.push(pickActionsFieldsJoin.createColumn({
			fieldId: 'pickedquantity'
		}));
		pickTaskColumnsArr.push(itemFieldsJoin.createColumn({
			fieldId: 'stockunit'
		}));
		pickTaskColumnsArr.push(itemFieldsJoin.createColumn({
			fieldId: 'unitstype'
		}));
		pickTaskColumnsArr.push(itemFieldsJoin.createColumn({
			fieldId: 'description'
		}));
		pickTaskColumnsArr.push(itemFieldsJoin.createColumn({
			fieldId: 'upccode'
		}));
		pickTaskColumnsArr.push(pickActionsFieldsJoin.createColumn({
			fieldId: 'remainingquantity'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'units'
		}));
		pickTaskColumnsArr.push(subItemFieldsJoin.createColumn({
			fieldId: 'fullname'
		}));
		pickTaskColumnsArr.push(pickActionsFieldsJoin.createColumn({
			fieldId: 'subitemof'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'id'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'totalpickedquantity'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'item'
		}));
		pickTaskColumnsArr.push(itemFieldsJoin.createColumn({
			fieldId: 'itemid'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'picker'
		}));
		pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
			fieldId: 'location'
		}));

		if(utility.isLotnumberedInventoryFeatureEnabled() ==  true || utility.isSerializedInventoryFeatureEnabled() ==  true  )
		{
			pickTaskColumnsArr.push(myPickTaskQuery.createColumn({
				fieldId: 'inventorynumber'
			}));
		}
		var pickTaskQueryCondition =	myPickTaskQuery.createCondition({
			fieldId: 'id',
			operator: query.Operator.ANY_OF,
			values: pickTaskId
		});
        var  pickTaskQuery_pickingType = myPickTaskQuery.createCondition({
            fieldId: 'wave^transaction.picktype',
            operator: query.Operator.ANY_OF,
            values: 'Single'
        });
		myPickTaskQuery.condition = myPickTaskQuery.and(pickTaskQueryCondition,pickTaskQuery_pickingType);

		if(transactionInternalId) {
			var pickTaskQuery_orderId = myPickTaskQuery.createCondition({
				fieldId: 'pickactions.ordernumber',
				operator: query.Operator.ANY_OF,
				values: transactionInternalId
			});
			myPickTaskQuery.condition = myPickTaskQuery.and(pickTaskQueryCondition,pickTaskQuery_pickingType,pickTaskQuery_orderId);

		}
				myPickTaskQuery.columns = pickTaskColumnsArr;

        var resultSet = myPickTaskQuery.run();
        log.debug(resultSet);
        var pageCoulmns = resultSet.columns;
        var pageResults = resultSet.results;
        var resultJsonArr = [];
        // Retrieve the query results using an iterator
        if (pageResults.length !== 0) {
            convertToJsonObj(pageResults, pageCoulmns, resultJsonArr);
        }
		return resultJsonArr;

	}

	function convertToJsonObj(result, columnsObj, resultJsonArr) {
		log.debug({title: 'into', details: 'convertToJsonObj'});
		var resultObj = {};
		var columns = columnsObj;
		var values = result;

		for (var res in values) {
			if(values[res]){
				var resObj = values[res].values;
				resultObj = {};
				for (var col in columns) {
					if(columns[col]){
					var colName = columns[col].fieldId;
					resultObj[colName] = resObj[col];
					}
				}
				resultJsonArr.push(resultObj);
			}
		}
	}

	function _getUomList(unitType, picktaskValidate, transactionUnits, stockunit) {

		var uomList = [];

		if (utility.isValueValid(unitType)) {

			var uomRecord = record.load({
				type: record.Type.UNITS_TYPE,
				id: unitType
			});
			var sublistCount = uomRecord.getLineCount({
				sublistId: 'uom'
			});
			log.debug({title: 'transactionUnits', details: transactionUnits});
			log.debug({title: 'stockunit', details: stockunit});
			for (var i = 0; i < sublistCount; i++) {
				var unitName = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'unitname',
					line: i
				});
				
				var conversionRate = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'conversionrate',
					line: i
				});
				var uomValue = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'internalid',
					line: i
				});

				if (utility.isValueValid(transactionUnits)) {
					if (transactionUnits == uomValue) {
						picktaskValidate.uomDefaultStatus = unitName;
						picktaskValidate.units = unitName;
						picktaskValidate.transactionUomConversionRate = conversionRate;

					}
				}
				if (utility.isValueValid(stockunit)) {
					if (stockunit == uomValue) {
						picktaskValidate.stockunitText = unitName;
						picktaskValidate.stockUomConversionRate = conversionRate;
						if (!utility.isValueValid(transactionUnits)) { //This will execute for kitcomponent item
							picktaskValidate.uomDefaultStatus = unitName;
							picktaskValidate.units = unitName;
							picktaskValidate.transactionUomConversionRate = conversionRate;
						}
					}
				}

				var row = {'value': unitName, 'id': conversionRate};
				uomList.push(row);

			}
		}
		return uomList;
	}

	return {
		'post': doPost,
		_getPickTaskResultsWithNQuery: _getPickTaskResultsWithNQuery
	};

});
