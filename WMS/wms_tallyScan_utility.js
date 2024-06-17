/**

 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.

 */
/**

 * @NApiVersion 2.x

 * @NModuleScope public

 */

define(['./wms_utility', 'N/search', 'N/record', './wms_translator', 'N/runtime', './big','N/query'],

		function (utility, search, record, translator, runtime, Big,query) {

	function getItemDetails(itemInternalId,itemDetails) {
		try {
			var columnArray = [];
			columnArray.push('unitstype');
			columnArray.push('name');
			columnArray.push('location');
			columnArray.push('recordtype');
			columnArray.push('usebins');
			columnArray.push('custitem_wms_usetallyscan');
			columnArray.push('stockunit');
			columnArray.push('itemid');
			columnArray.push('salesdescription');
			var itemLookUp = utility.getItemFieldsByLookup(itemInternalId, columnArray);
			var itemType = utility.isValueValid(itemLookUp.recordtype) ? itemLookUp.recordtype : null;
			var itemUseBinsFlag = utility.isValueValid(itemLookUp.usebins) ? itemLookUp.usebins : null;
			var useItemLevelTallyScan = utility.isValueValid(itemLookUp.custitem_wms_usetallyscan) ? itemLookUp.custitem_wms_usetallyscan : null;
			var thumbnailurl = utility.isValueValid(itemLookUp.thumbnailurl) ? itemLookUp.thumbnailurl : null;
			var name = utility.isValueValid(itemLookUp.name) ? itemLookUp.name : null;
			var unitType = utility.isValueValid(itemLookUp.unitstype) ? itemLookUp.unitstype[0].value : null;
			var stockUnitText = utility.isValueValid(itemLookUp.stockunit) ? itemLookUp.stockunit[0].text : null;
			var stockUnitValue = utility.isValueValid(itemLookUp.stockunit) ? itemLookUp.stockunit[0].value : null;
			var itemText = utility.isValueValid(itemLookUp.itemid) ? itemLookUp.itemid : null;
			var salesDesc = utility.isValueValid(itemLookUp.salesdescription) ? itemLookUp.salesdescription : null;

			itemDetails.itemType = itemType;
			itemDetails.imageUrl = thumbnailurl;
			itemDetails.itemName = name;
			itemDetails.unitType = unitType;
			itemDetails.stockUnitValue = stockUnitValue;
			itemDetails.stockUnitText = stockUnitText;
						itemDetails.stockUnitName = stockUnitText;
			itemDetails.itemText = itemText;
			itemDetails.salesDesc = salesDesc;
			itemDetails.itemUseBinsFlag = itemUseBinsFlag;
			itemDetails.useItemLevelTallyScan = useItemLevelTallyScan;

		} catch (e) {
			log.error('expception', e);
		}

		return itemDetails;
	}

	function getTallyScanRuleData(warehouseLocationId,processNameFromState,itemDetails,isQtyLimitApplicable){

		itemDetails.isTallyScanRequired = false;
		var tallyScanRequiredResult = [];
		if(utility.isValueValid(processNameFromState)){
		tallyScanRequiredResult = getSystemRuleValueforTallyScan('Enable Tally Scan?',
				warehouseLocationId, processNameFromState);
		}
		if(tallyScanRequiredResult.length > 0){
			var systemrulevalue = tallyScanRequiredResult[0].custrecord_wmsserulevalue;
			var systemruleThresholdQty = utility.isValueValid(tallyScanRequiredResult[0].custrecord_wmsse_pickedquantitylimit) ? tallyScanRequiredResult[0].custrecord_wmsse_pickedquantitylimit : 0;
			var qtyCondition  = (utility.isValueValid(isQtyLimitApplicable)&& isQtyLimitApplicable === false) ? true : (parseFloat(itemDetails.pickQuantity) <= parseFloat(systemruleThresholdQty));
			itemDetails.tallyScanProcessType = tallyScanRequiredResult[0].custrecord_wmsseprocesstypeText;
			if (systemrulevalue == 'Y' && qtyCondition && itemDetails.useItemLevelTallyScan === true) {
				itemDetails.isTallyScanRequired = true;

				itemDetails.tallyScanBarCodeQty = 0;//no scanned happened,so it zero.and if remaining qty and this qty are not equal the only itemscam text box is visible
				if(itemDetails.itemType == "serializedinventoryitem" || itemDetails.itemType=="serializedassemblyitem"){
					itemDetails.barcodeQuantity = [{'value': '1', 'unit': itemDetails.baseUnitId}];
				}else{
					itemDetails.barcodeQuantity = [{'value': '1', 'unit': itemDetails.transactionuomId}];
				}
				itemDetails.transactionuomValue = itemDetails.transactionuomId;
			}
		}
		return itemDetails;
	}

	function getCartonPickingRequiredData(systemRule, warehouseLocationId, itemType, itemDetails) {

		var isContainerScanRequired = "N";
		if (itemType == "noninventoryitem") {
			isContainerScanRequired = utility.getSystemRuleValue(systemRule, warehouseLocationId);
		}

		if (!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N') {
			itemDetails.isContainerScanRequiredNonInv = 'false';
		} else {
			itemDetails.isContainerScanRequiredNonInv = 'true';
		}
		return itemDetails;
	}

	function getSystemRuleValueforTallyScan(RuleId, loc, processNameFromState) {
		var searchresults = [];
		try {
			var getprocessInternalid = getMobileProcess(processNameFromState)
			var LANG = "LANGUAGE";
			var locale = runtime.getCurrentUser().getPreference(LANG);
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

			if (loc != null && loc != '') {
				filters.push(search.createFilter({
					name: 'custrecord_wmssesite',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', loc]
				}));
			}

			if (utility.isValueValid(getprocessInternalid)){
								filters.push(search.createFilter({
										name: 'custrecord_wmsse_processid_tallyscan',
										operator: search.Operator.IS,
										values: getprocessInternalid
								}));
						}
			else
			{
				filters.push(search.createFilter({
					name: 'custrecord_wmsse_processname_tallyscan',
					operator: search.Operator.IS,
					values: processNameFromState
				}));
			}
			searchRec.filters = filters;
			searchresults = utility.getSearchResultInJSON(searchRec);
		} catch (exp) {
			log.error('expception', exp);
			return searchresults;
		}
		return searchresults;
	}

	function validateItemForTallyScan(tallyscanitem, pickItemId, unitType, warehouseLocationId, qtyValidateObj, transactionUomName, qtyUomSelectedArr, transactionuomValue, barcodeUnitValue, tallyScanBarCodeQty) {
		log.debug({title: 'tallyscanitem', details: tallyscanitem});
		if (utility.isValueValid(tallyscanitem)) {
			var tallyScanitemlId = '';
			qtyValidateObj.itemValidate = 'T';
			qtyValidateObj.uomModified = 'F';
			var currItem = utility.itemValidationForInventoryAndOutBound(tallyscanitem, warehouseLocationId);

			if ((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId)) ||
					utility.isValueValid(currItem.barcodeIteminternalid)) {
				if (utility.isValueValid(currItem.itemInternalId)) {
					tallyScanitemlId = currItem.itemInternalId;
				} else if (utility.isValueValid(currItem.barcodeIteminternalid)) {
					tallyScanitemlId = currItem.barcodeIteminternalid;
					qtyValidateObj.barcodeLotname = currItem.barcodeLotname;
					qtyValidateObj.barcodeSerialname = currItem.barcodeSerialname;
				}
				// log.debug({title:'tallyScanitemlId',details:tallyScanitemlId});
				// log.debug({title:'pickItemId',details:pickItemId});

				if (tallyScanitemlId != pickItemId) {
					qtyValidateObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
					qtyValidateObj.isValid = false;
					qtyValidateObj.itemValidate = 'F';
				} else {
					qtyValidateObj = utility.addItemDatatoResponse(qtyValidateObj, currItem, unitType, transactionUomName);
					log.debug({title: 'qtyValidateObj in tallyscan utilty', details: qtyValidateObj});
					//log.debug({title:'qtyValidateObj.barcodeQuantity[0].unit',details:qtyValidateObj.barcodeQuantity[0].unit});
					if (utility.isValueValid(qtyValidateObj.barcodeQuantity) && utility.isValueValid(qtyValidateObj.barcodeQuantity[0].unit)) {
						var uomObj = {};
						uomObj.unitType = unitType;
						uomObj.barcodeUOM = qtyValidateObj.barcodeQuantity[0].unit;
						qtyValidateObj.uomConvRateofBarCode = fetchBarcodeUnitType(uomObj);
						qtyValidateObj.qtyUomSelectedFlag = false;
					} else {
						log.debug({title: 'qtyUomSelectedArr ', details: qtyUomSelectedArr});
						log.debug({title: 'transactionuomValue ', details: transactionuomValue});
						log.debug({title: 'barcodeUnitValue ', details: barcodeUnitValue});

						if (transactionuomValue == barcodeUnitValue && tallyScanBarCodeQty == 0) {
							log.debug({title: 'First time ', details: qtyUomSelectedArr});

							if (utility.isValueValid(qtyUomSelectedArr[0].unit)) {
								log.debug({title: 'First time UOM Modified ', details: ''});
								var uomObj = {};
								uomObj.unitType = unitType;
								uomObj.barcodeUOM = qtyUomSelectedArr[0].unit;
								qtyValidateObj.uomConvRateofBarCode = fetchBarcodeUnitType(uomObj);
								qtyValidateObj.barcodeQuantity = qtyUomSelectedArr;
								qtyValidateObj.qtyUomSelectedFlag = true;
							}

						} else {
							log.debug({
								title: 'second time UOM Modified so considering first modified uom only',
								details: ''
							});
							if (utility.isValueValid(barcodeUnitValue) && utility.isValueValid(qtyUomSelectedArr[0].unit)) {

								if (barcodeUnitValue != qtyUomSelectedArr[0].unit) {
									qtyValidateObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
									qtyValidateObj.isValid = false;
									qtyValidateObj.uomModified = 'T';
								} else {

									var uomObj = {};
									uomObj.unitType = unitType;
									uomObj.barcodeUOM = barcodeUnitValue;
									qtyValidateObj.uomConvRateofBarCode = fetchBarcodeUnitType(uomObj);
									qtyValidateObj.qtyUomSelectedFlag = true;
								}

							}


						}

					}
				}
			} else if (currItem.error) {
				qtyValidateObj.errorMessage = currItem.error;
				qtyValidateObj.isValid = false;
				qtyValidateObj.itemValidate = 'F';
			} else {
				qtyValidateObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
				qtyValidateObj.isValid = false;
				qtyValidateObj.itemValidate = 'F';
			}
		} else {
			qtyValidateObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
			qtyValidateObj.isValid = false;
			qtyValidateObj.itemValidate = 'F';
		}
		log.debug({title: 'qtyValidateObj', details: qtyValidateObj});
		return qtyValidateObj;
	}

	//this function is also there in outbound utitlity ,left it there for MOP,at the time of MOP changes remove from there.
	function _createOrUpdateLotJSONObject(tallyLoopObj, lotName, scannedQty, selectedStatusText, transactionName) {
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
		//var _lotJSONObject = lotJSONobject ? JSON.parse(lotJSONobject) : new Object();
		var key = lotName + '_' + transactionName + (inventoryStatusFeature ? '_' + selectedStatusText : '');
		log.debug({title: 'key', details: key});
		//if (_lotJSONObject[key]) {
		if(utility.isValueValid(tallyLoopObj[key])){
			tallyLoopObj[key]['quantity'] = Number(Big(tallyLoopObj[key]['quantity']).plus(scannedQty));

		} else {
			var obj = {};
			obj.lotName = lotName;
			obj.quantity = scannedQty;
			obj.statusName = selectedStatusText;
			obj.transactionName = transactionName;


			tallyLoopObj[key] = obj;
		}
		return tallyLoopObj;
	}


	function _createOrUpdateTallyScanJSONObject(tallyLoopObj, lotJSONobject, lotName, scannedQty, selectedStatusText,
			transactionName,lotExpiryDate,itemInternalId,transactionLineNo,itemName,
												recomendedbinName,recomendedbinId,openTaskId,selecetdConRate,randomTallyscan,transactionId) {
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
		log.debug("transactionLineNo",transactionLineNo);
		log.debug("itemInternalId",itemInternalId);
		var key = '';
		if(lotName != undefined && lotName != '') {
			if (randomTallyscan == 'T') {
				key = lotName + '_' + transactionName + (inventoryStatusFeature ? '_' + selectedStatusText : '') + "^" + itemInternalId + "^" + transactionLineNo;
			}
			else{
				key = lotName + '_' + transactionName + (inventoryStatusFeature ? '_' + selectedStatusText : '');
			}
		}
		else {
			if (randomTallyscan == 'T') {
				key = transactionName + (inventoryStatusFeature ? '_' + selectedStatusText : '') + "^" + itemInternalId + "^" + transactionLineNo;
			}
			else{
				key =  transactionName + (inventoryStatusFeature ? '_' + selectedStatusText : '');
			}
		}

			if(utility.isValueValid(tallyLoopObj[key])){
				tallyLoopObj[key]['quantity'] = Number(Big(tallyLoopObj[key]['quantity']).plus(scannedQty));
				if(lotName != undefined && lotName != '' && lotExpiryDate != undefined && lotExpiryDate != null && lotExpiryDate!=''){
					tallyLoopObj[key]['lotExpiryDate'] = lotExpiryDate;
				}
				if(randomTallyscan == 'T' && selecetdConRate != null && selecetdConRate != '' && selecetdConRate != undefined && selecetdConRate != 'null' &&
					(tallyLoopObj[key]['selectedConversionRate'] =='' || tallyLoopObj[key]['selectedConversionRate'] == undefined ||
						tallyLoopObj[key]['selectedConversionRate'] == 'null' || tallyLoopObj[key]['selectedConversionRate'] == null)){
					tallyLoopObj[key]['selectedConversionRate'] = selecetdConRate;
				}

		} else {
			var obj = {};
			obj.lotName = lotName;
			obj.lotExpiryDate = lotExpiryDate;
			obj.quantity = scannedQty;
			obj.statusName = selectedStatusText;
			obj.transactionName = transactionName;
			if(randomTallyscan == 'T') {
				obj.itemInternalId = itemInternalId;
				obj.line = transactionLineNo;
				obj.itemName = itemName;
				obj.recomendedBinName = recomendedbinName;
				obj.recomendedBinId = recomendedbinId;
				obj.openTaskId = openTaskId;
				obj.selectedConversionRate = selecetdConRate;
				if(utility.isValueValid (transactionId)){
					obj.transactionInternalId = transactionId;
				}
			}
			tallyLoopObj[key] = obj;
		}
		log.debug("tallyLoopObj",tallyLoopObj);
		return tallyLoopObj;
	}

	function fetchBarcodeUnitType(uomObj) {
		var uomConvRateofBarCode = 1;
		var uomRecord = record.load({
			type: record.Type.UNITS_TYPE,
			id: uomObj.unitType
		});
		var sublistCount = uomRecord.getLineCount({
			sublistId: 'uom'
		});

		for (var uomItr = 0; uomItr < sublistCount; uomItr++) {
			var uomValueList = uomRecord.getSublistValue({
				sublistId: 'uom',
				fieldId: 'internalid',
				line: uomItr
			});

			if (uomValueList == uomObj.barcodeUOM) {
				uomConvRateofBarCode = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'conversionrate',
					line: uomItr
				});

				break;

			}
		}
		return uomConvRateofBarCode;
	}

	function fetchSelectedUOM(iteminternalid, transactionUnits) {
		var selectedUOM = {};

		if (utility.isValueValid(iteminternalid)) {
			var columnArray = [];
			columnArray.push('unitstype');
			var itemLookUp = utility.getItemFieldsByLookup(iteminternalid, columnArray);


			if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined) {
				unitType = itemLookUp.unitstype[0].value;
				var uomValue = '';
								var uomConversionRate ='';
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

					var pluralName = uomRecord.getSublistValue({

						sublistId: 'uom',

						fieldId: 'pluralname',

						line: i

					});

					uomValue = uomRecord.getSublistValue({

						sublistId: 'uom',

						fieldId: 'internalid',

						line: i

					});

					if (!isNaN(transactionUnits)) {

						if (transactionUnits == uomValue) {

							uomConversionRate = uomRecord.getSublistValue({

								sublistId: 'uom',

								fieldId: 'conversionrate',

								line: i

							});

							break;

						}

					} else {

						if (transactionUnits.toUpperCase() == unitName.toUpperCase() ||

								transactionUnits.toUpperCase() == pluralName.toUpperCase()) {


							uomValue = uomRecord.getSublistValue({

								sublistId: 'uom',

								fieldId: 'internalid',

								line: i

							});

							uomConversionRate = uomRecord.getSublistValue({

								sublistId: 'uom',

								fieldId: 'conversionrate',

								line: i

							});

							break;

						}

					}

				}


				if (utility.isValueValid(uomValue)) {


										if(utility.isValueValid(uomConversionRate)) {
												selectedUOM["uomid"] = uomConversionRate;
						selectedUOM["uominternalId"] = uomValue;
												selectedUOM["unitName"] = unitName;
										}

				}

			}


		}
		log.debug({title: 'selectedUOM in tallyscan utlity', details: selectedUOM});
		return selectedUOM;
	}


	function buildBarcodeObjwithconvertRate(barcodeConverRateObj, itemDetails, barcodeQuantity) {
		var tallyscanQty = 1;
		uomValue = barcodeConverRateObj.uomValue;
		transactionuomValue = barcodeConverRateObj.transactionuomValue;
		log.debug({title: 'itemDetails in buildBarcodeObjwithconvertRate function', details: itemDetails});
		if (utility.isValueValid(itemDetails.barcodeQuantity)) {
			uomValue = itemDetails.barcodeQuantity[0]['unit'];

		} else {
			uomValue = transactionuomValue;

			if (utility.isValueValid(barcodeQuantity)) {
				uomValue = barcodeQuantity[0]['unit'];
			}
		}

		log.debug({
			title: 'assigned uomValue as itemalias scanned in buildBarcodeObjwithconvertRate function',
			details: uomValue
		});
		log.debug({
			title: 'normal barcodeQuantity in buildBarcodeObjwithconvertRate function',
			details: barcodeQuantity
		});
		if (utility.isValueValid(barcodeQuantity)) {
			barcodeQty = Number(Big(barcodeQuantity[0].value).plus(tallyscanQty));
		} else {
			barcodeQty = tallyscanQty;
		}
		var barcodeObj = [{'value': barcodeQty, 'unit': uomValue}];
		//barcodeQuantity=barcodeObj;

		return barcodeObj;
	}

	function getUOMDetails(unitTypeId){
		var resultJsonArr =[];
		if(utility.isValueValid(unitTypeId)){

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
																})
																];

			unitTypeSearch.condition = unitTypeSearch.and(idCond);
			var results = unitTypeSearch.runPaged({
				pageSize: 1000
			});
			log.debug('results',results);

			results.pageRanges.forEach(function (pageRange) {
				var myPage = results.fetch({
					index: pageRange.index
				});
				var resultSetObj =  myPage.data;
				if(resultSetObj!=null && resultSetObj!='')
				{
					var resultsObj = resultSetObj.results;
					var columnsArray = [];
					for(var col in resultSetObj.columns)
					{ var colName = (resultSetObj.columns)[col].fieldId;
					columnsArray.push(colName);
					}
					for (var row in resultsObj)
					{
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj,columnsArray,resultJsonArr);
					}
				}
			});
		}
		log.debug('resultJsonArr',resultJsonArr);
		return resultJsonArr;
	}
	function convertToJsonObj(result,columnsArray,resultJsonArr){
		var resultObj = {};
		var resArray = result.values;
		resultObj = {};
		for(var itr in resArray){
			resultObj[columnsArray[itr]] = resArray[itr];
		}
		resultJsonArr.push(resultObj);
	}
	function validateItemTallyScan(itemDetailsObj,processType,vendorId,orderInternalid) {

		var tallyScanItem = itemDetailsObj.tallyScanItem;
		var warehouseLocationId = itemDetailsObj.warehouseLocationId;
		var unitType = itemDetailsObj.unitType ;
		var transactionUomName = itemDetailsObj.transactionUomName;

		if (utility.isValueValid(tallyScanItem)) {

			itemDetailsObj.itemValidate = 'T';
			itemDetailsObj.uomModified = 'F';
			itemDetailsObj.isTallyScanRequired = true;
			var currItem = null;
			if(utility.isValueValid(processType) && processType == 'inboundProcess'){
				currItem = utility.getSKUIdWithName(tallyScanItem,warehouseLocationId,vendorId,orderInternalid);
			}
			else{
				currItem = utility.itemValidationForInventoryAndOutBound(tallyScanItem, warehouseLocationId);
			}


			if (utility.isValueValid(currItem) &&
					(utility.isValueValid(currItem.itemInternalId) || utility.isValueValid(currItem.barcodeIteminternalid))) {

				itemDetailsObj.tallyScanitemId = utility.isValueValid(currItem.itemInternalId) ? currItem.itemInternalId : currItem.barcodeIteminternalid;
				itemDetailsObj = utility.addItemDatatoResponse(itemDetailsObj, currItem, unitType, transactionUomName);
				if(utility.isValueValid(unitType)){
					itemDetailsObj = getUOMToBeConsideredObj(itemDetailsObj);
				}
			} else if (currItem.error) {
				itemDetailsObj.errorMessage = currItem.error;
				itemDetailsObj.isValid = false;
			} else {
				itemDetailsObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
				itemDetailsObj.isValid = false;
			}
		} else {
			itemDetailsObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
			itemDetailsObj.isValid = false;
		}
		log.debug({title: 'itemDetailsObj', details: itemDetailsObj});
		return itemDetailsObj;
	}
	function getUOMToBeConsideredObj(itemDetailsObj){
		var uomToBeConsideredObj = {};
		var uomResultObj =  getUOMDetails(itemDetailsObj.unitType);
		if (!utility.isValueValid(itemDetailsObj.uomSelectionforFirstItr)){
			if(utility.isValueValid(itemDetailsObj.barcodeQuantity) && utility.isValueValid(itemDetailsObj.barcodeQuantity[0].unit)){
				uomToBeConsideredObj.unitId = itemDetailsObj.barcodeQuantity[0].unit;
			}else{
				uomToBeConsideredObj.unitId = itemDetailsObj.transactionuomId;
			}
			if(utility.isValueValid(itemDetailsObj.qtyUomSelected) && (itemDetailsObj.qtyUomSelected).length >0 &&
					itemDetailsObj.qtyUomSelected[0].unit != itemDetailsObj.transactionuomId ){
				uomToBeConsideredObj.unitId = itemDetailsObj.qtyUomSelected[0].unit;
			}
		}else{
			if(utility.isValueValid(itemDetailsObj.qtyUomSelected) && (itemDetailsObj.qtyUomSelected).length >0 && itemDetailsObj.qtyUomSelected[0].unit != itemDetailsObj.uomSelectionforFirstItr){
				itemDetailsObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
				itemDetailsObj.isValid = false;
				itemDetailsObj.uomModified = 'T';
				return itemDetailsObj;
			}else{
				uomToBeConsideredObj.unitId = itemDetailsObj.uomSelectionforFirstItr;
			}
		}
		for(var itr in uomResultObj){
			if(uomResultObj[itr]['uom.internalid'] == uomToBeConsideredObj.unitId){
				uomToBeConsideredObj.conversionRate = uomResultObj[itr]['uom.conversionrate'];
				uomToBeConsideredObj.unitName = uomResultObj[itr]['uom.unitname'];
			}
		}
		itemDetailsObj.qtyUOMObj = uomToBeConsideredObj;
		itemDetailsObj.uomSelectionforFirstItr = uomToBeConsideredObj.unitId;
		return itemDetailsObj;
	}
	function getCalculatedTallyScanQty(itemValidateObj){
		var tallyscanQty= 1;
		if(utility.isValueValid(itemValidateObj.qtyUOMObj) && utility.isValueValid(itemValidateObj.transactionUomConversionRate)){
			var convertedValue = Number(Big((itemValidateObj.qtyUOMObj).conversionRate).div(itemValidateObj.transactionUomConversionRate));
			tallyscanQty = Number(Big(tallyscanQty).mul(convertedValue));

			itemValidateObj.tallyScanOrderQty = Number(Big(itemValidateObj.tallyScanOrderQty).plus(tallyscanQty));
		} else{

			itemValidateObj.tallyScanOrderQty = Number(Big(itemValidateObj.tallyScanOrderQty).plus(tallyscanQty));
		}
		itemValidateObj.tallyscanQty =tallyscanQty;
		return itemValidateObj;
	}

	function createOrUpdateTallyScanObj(tallyLoopObj,itemType,transactionId,lineId,scannedQty,selectedStatusId,pickCarton,lotName,itemValidateObj) {
		var tallyscanQty = 1;
		var childObj={};
		var newChildObj = {};
		var childKey='';
		var key = transactionId + '-' + lineId;
		if(utility.isValueValid(itemValidateObj.transactionUomConversionRate)){
			var convertedValue = Number(Big((itemValidateObj.qtyUOMObj).conversionRate).div(itemValidateObj.transactionUomConversionRate));
			tallyscanQty = Number(Big(1).mul(convertedValue));
		}
		if(itemType == "inventoryitem" || itemType=="assemblyitem"){
			childKey = selectedStatusId + '-'+ pickCarton;
		}else if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
			childKey = lotName + '-'+ selectedStatusId + '-'+ pickCarton;
		}
		if(itemType == "inventoryitem" || itemType=="assemblyitem" ||
				itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
			if(utility.isValueValid(tallyLoopObj[key])){
				childObj = tallyLoopObj[key];
				if(utility.isValueValid(childObj[childKey])){
					childObj[childKey].quantity = parseFloat(childObj[childKey].quantity)+tallyscanQty;
				}else{
					newChildObj.quantity = tallyscanQty;
					newChildObj.statusId = selectedStatusId;
					newChildObj.pickCarton = pickCarton;
					newChildObj.lotName = lotName;
					childObj[childKey] = newChildObj ;
					tallyLoopObj[key] = childObj;
				}
			}else{
				newChildObj.quantity = tallyscanQty;
				newChildObj.statusId = selectedStatusId;
				newChildObj.pickCarton = pickCarton;
				newChildObj.lotName = lotName;
				childObj[childKey] = newChildObj ;
				tallyLoopObj[key] = childObj;
			}
		}else{
			tallyLoopObj[key] = scannedQty;
		}

		return tallyLoopObj;
	}

	function getQtyObjectToBePopulated(enterQty,qtyUOMObj,transactionUomConvRate){
		var quantityUOMObj ={};
		if(utility.getObjectLength(qtyUOMObj) > 0){
			var convertedValue = Number(Big(transactionUomConvRate).div(qtyUOMObj.conversionRate));
			var convertedQty = Number(Big(enterQty).mul(convertedValue));
			quantityUOMObj = [{'value': parseFloat(convertedQty) + parseFloat(1),'unit': qtyUOMObj.unitId}];
		}else{
			quantityUOMObj = [{'value': parseFloat(enterQty) + parseFloat(1)}];
		}
		return quantityUOMObj;
	}
	function getQtyInBaseUnits(itemDetails,lineitemremainingquantity){
		if(utility.isValueValid(itemDetails.baseUnitId)){
			var convertedValue = Number(Big(itemDetails.baseUnitConvRate).mul(itemDetails.transactionUomConversionRate));
			itemDetails.lineitemremainingquantity = Number(Big(lineitemremainingquantity).mul(convertedValue));
		} else{
			itemDetails.lineitemremainingquantity =lineitemremainingquantity;
		}
		return itemDetails;
	}

	function getExitingSerialORCreate(itemDetailsObj) {

		var serialName = itemDetailsObj.tallyScanSerial;
		var itemInternalId = itemDetailsObj.pickItemId ;
		var pickTaskId = itemDetailsObj.pickTaskId;
		var orderInternalId = itemDetailsObj.transactionInternalId;
		var InvStatusInternalId = itemDetailsObj.InvStatusInternalId;
		var taskType = itemDetailsObj.taskType;
		var binInternalid = itemDetailsObj.binInternalid;
		var transactionLineNo = itemDetailsObj.transactionLineNo;


		if(!utility.isValueValid(taskType)){
			taskType = 3;
		}
		var serialSearch = search.load({
			type: 'customrecord_wmsse_serialentry',
			id: 'customsearch_wmsse_serialdetails_search'
		});
		serialSearch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_no',
			operator: search.Operator.IS,
			values: serialName
		}));
		serialSearch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_item',
			operator: search.Operator.ANYOF,
			values: itemInternalId
		}));
		serialSearch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_status',
			operator: search.Operator.IS,
			values: false
		}));
		serialSearch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_tasktype',
			operator: search.Operator.ANYOF,
			values: taskType
		}));
		var serialSearchRes = utility.getSearchResultInJSON(serialSearch);
		if (serialSearchRes.length > 0) {
			itemDetailsObj.isValid = false;
			itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED');
		} else {
			var objRecord = record.create({
				type: 'customrecord_wmsse_serialentry',

			});
			objRecord.setValue({
				fieldId: 'name',
				value: pickTaskId
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordno',
				value: orderInternalId
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_item',
				value: itemInternalId
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_qty',
				value: 1
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_no',
				value: serialName
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordline',
				value: transactionLineNo
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_status',
				value: false
			});

			if(utility.isValueValid(binInternalid))
			{
				objRecord.setValue({
					fieldId: 'custrecord_wmsse_ser_bin',
					value: binInternalid
				});
			}

			if(utility.isValueValid(InvStatusInternalId)){
				objRecord.setValue({
					fieldId: 'custrecord_serial_inventorystatus',
					value: InvStatusInternalId
				});
			}
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_tasktype',
				value: taskType
			});
			objRecord.save();
		}
		return itemDetailsObj;
	}

	function getInvNumSearch(whLocation, tallyScanSerial, pickBinId) {
		var invNumSearch = search.load({
			type: search.Type.INVENTORY_NUMBER_BIN,
			id: 'customsearch_wms_getmix_invnumbers'
		});
		var invNumSearchFilters = invNumSearch.filters;
		invNumSearchFilters.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: whLocation
		}));
		invNumSearchFilters.push(search.createFilter({
			name: 'inventorynumber',
			operator: search.Operator.IS,
			values: tallyScanSerial
		}));
		if (utility.isValueValid(pickBinId)) {
			invNumSearchFilters.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.ANYOF,
				values: pickBinId
			}));
		}
		invNumSearch.filters = invNumSearchFilters;
		var objinvNumSearchRes = utility.getSearchResultInJSON(invNumSearch);
		log.debug({title:'objinvNumSearchRes',details:objinvNumSearchRes});
		objinvNumSearchRes = utility.getMatchedInventoryNumber(objinvNumSearchRes,tallyScanSerial);
		log.debug({title:'objinvNumSearchRes',details:objinvNumSearchRes});

		log.debug({title: 'objinvNumSearchRes list new new:', details: objinvNumSearchRes});
		return objinvNumSearchRes;
	}
	function validateSerialTallyScan(itemDetailsObj){
		if (utility.isValueValid(itemDetailsObj.tallyScanSerial)) {
			var tallyScanSerial = itemDetailsObj.tallyScanSerial;
			var warehouseLocationId = itemDetailsObj.warehouseLocationId;
			var pickBinId = itemDetailsObj.pickBinId;
			var pickItemId = itemDetailsObj.pickItemId;
			var invStatusInternalId = itemDetailsObj.InvStatusInternalId;
			var inventoryDetailLotOrSerial = itemDetailsObj.inventoryDetailLotOrSerial;
			var _isScannedSerialExits =[];

			var itemOutputObj = utility.itemValidationForInventoryAndOutBound(tallyScanSerial, warehouseLocationId);
			tallyScanSerial = utility.isValueValid(itemOutputObj.barcodeSerialname) ? itemOutputObj.barcodeSerialname: tallyScanSerial;
			itemDetailsObj.tallyScanSerial = tallyScanSerial;
			var objinvNumSearchRes =  getinventoryNumberItemsList(warehouseLocationId, tallyScanSerial, pickBinId,'',invStatusInternalId);
			log.debug('objinvNumSearchRes',objinvNumSearchRes);
			if(utility.isValueValid(itemDetailsObj.unitType)){
				itemDetailsObj = getUOMToBeConsideredObj(itemDetailsObj);
			}
			if(objinvNumSearchRes.length == 1){
				var inventoryNumberId = objinvNumSearchRes[0].inventorynumber;
				_isScannedSerialExits =  utility.getSerialList(pickBinId,pickItemId,warehouseLocationId,invStatusInternalId,inventoryNumberId,inventoryDetailLotOrSerial);

				if(!utility.isValueValid(inventoryNumberId) || _isScannedSerialExits.length === 0){
					itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
					itemDetailsObj.isValid = false;
				}else{
					itemDetailsObj.scannedSerialInternalId = inventoryNumberId;
					itemDetailsObj.objinvNumSearchRes = objinvNumSearchRes;
				}
			}else if(objinvNumSearchRes.length > 1){
				itemDetailsObj.navigateToLotItemsListScreen = 'T';
			}else{
				itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
				itemDetailsObj.isValid = false;
			}
		} else {
			itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.EMPTY_INPUT');
			itemDetailsObj.isValid = false;
		}
		log.debug({title: 'itemDetailsObj', details: itemDetailsObj});
		return itemDetailsObj;
	}


	function getinventoryNumberItemsList(whLocation, tallyscanitem, binInternalId, pickItemId,invStatusInternalId) {

		var mixItemListSearch = search.load({
			type: search.Type.INVENTORY_BALANCE,
			id: 'customsearch_wms_getmixitem_invnumbers'
		});
		var searchFilters = mixItemListSearch.filters;

		searchFilters.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: whLocation
		}));

		if(utility.isValueValid(tallyscanitem)){
			searchFilters.push(search.createFilter({
				name : 'inventorynumber',
				join : 'inventorynumber',
				operator : search.Operator.IS,
				values : tallyscanitem
			}));
		}
		if (utility.isValueValid(binInternalId)) {
			searchFilters.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.ANYOF,
				values: binInternalId
			}));
		}
		if (utility.isValueValid(pickItemId)) {
			searchFilters.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: pickItemId
			}));
		}
		if (utility.isValueValid(invStatusInternalId)) {
			searchFilters.push(search.createFilter({
				name: 'status',
				operator: search.Operator.ANYOF,
				values: invStatusInternalId
			}));
		}
		mixItemListSearch.filters = searchFilters;
		var objmixItemListSearchRes = utility.getSearchResultInJSON(mixItemListSearch);
		log.debug({title:'objmixItemListSearchRes1',details:objmixItemListSearchRes});
		objmixItemListSearchRes = getMatchedInventoryNumber(objmixItemListSearchRes,tallyscanitem);
		log.debug({title:'objmixItemListSearchRes2',details:objmixItemListSearchRes});
		return objmixItemListSearchRes;
	}
	function getMatchedInventoryNumber(invNumSearchRes,inventoryNumber){

		if(invNumSearchRes.length > 1 && utility.isValueValid(inventoryNumber)){
			for(var itr=0;itr<invNumSearchRes.length;itr++){
				if(invNumSearchRes[itr].inventorynumberText != inventoryNumber){
					invNumSearchRes.splice(itr,1);
					itr--;
				}
			}
		}
		return invNumSearchRes;
	}
	function isTallyScanEnabled(itemDetails,itemId)
	{
		var baseUnitId = '';
		var baseUnitName = '';
		var baseUnitConvRate = '';
		log.debug('itemDetails before getItemDetails',itemDetails);
		if(utility.isValueValid(itemId)){
			itemDetails.itemInternalId = itemId;
		}
		itemDetails = getItemDetails(itemDetails.itemInternalId, itemDetails);
log.debug('itemDetails from getItemDetails',itemDetails);
		if (utility.isValueValid(itemDetails.unitType)) {
			uomResult = getUOMDetails(itemDetails.unitType);


			for (var itr in uomResult) {
				if (uomResult[itr]['uom.baseunit']) {
					baseUnitId = uomResult[itr]['uom.internalid'];
					baseUnitName = uomResult[itr]['uom.unitname'];
					baseUnitConvRate = uomResult[itr]['uom.conversionrate'];
				}
			}
			itemDetails.baseUnitId = baseUnitId;
			itemDetails.baseUnitConvRate = baseUnitConvRate;
			itemDetails.baseUnitName = baseUnitName
		}

			if (utility.isValueValid(itemDetails.stockUnitValue) && (itemDetails.processNameFromState == 'NSWMS_CartPutaway' || itemDetails.processNameFromState == 'NSWMS_BinPutaway'|| itemDetails.processNameFromState == 'NSWMS_BinTransfer'|| itemDetails.processNameFromState == 'NSWMS_InventoryTransfer')) {//filled from cart moves
				if((utility.isValueValid(itemDetails.barcodeQuantity))){
				itemDetails.transactionuomId = itemDetails.barcodeQuantity[0]['unit'];
			}else{
				itemDetails.transactionuomId = itemDetails.stockUnitValue;
			}
						 // itemDetails.uomSelectionforFirstItr = itemDetails.transactionuomId;
			}
			itemDetails.pickQuantity = Number(itemDetails.availbleQuanity);
			itemDetails = getTallyScanRuleData(itemDetails.warehouseLocationId, itemDetails.processNameFromState, itemDetails);
			itemDetails.showAvailableQtyTable = true;

			if(itemDetails.isTallyScanRequired) {

				itemDetails.transactionUomConversionRate = itemDetails.getStockConversionRate;
				log.debug('itemDetails.transactionUomConversionRate for serials',itemDetails.transactionUomConversionRate);
				itemDetails.transactionUomId = itemDetails.transactionUomId;
				//itemDetails.transactionUomName = itemDetails.transactionUomName;
				itemDetails.expectedquantity = itemDetails.availbleQuanity;
				itemDetails.remainingTallyQuantity = itemDetails.availbleQuanity;
				if (utility.isValueValid(itemDetails.unitType)) {

					itemDetails.stockUnitName = itemDetails.stockUnitText;
				}
				else
				{
					itemDetails.stockUnitName = '';
				}

				if(itemDetails.itemType == "inventoryitem" || itemDetails.itemType == "assemblyitem")
				{
					var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
					if(!inventoryStatusFeature && itemDetails.processNameFromState == 'NSWMS_CartPutaway'){
						var tallyLoopObj = {};
						var lotName;
						itemDetails.tallyScanBarCodeQty = 1;
						if(utility.isValueValid(itemDetails.stockConversionRate)){
							itemDetails.tallyScanBarCodeQty = Big(itemDetails.tallyScanBarCodeQty).div(Big(itemDetails.stockConversionRate));
						}
						tallyLoopObj = _createOrUpdateTallyScanJSONObject(tallyLoopObj, '', lotName, itemDetails.tallyScanBarCodeQty);
											itemDetails.remainingTallyQuantity = Number(Big(itemDetails.availbleQuanity).minus(Big(itemDetails.tallyScanBarCodeQty)));

						itemDetails.tallyLoopObj = tallyLoopObj;
					}
					else{
						itemDetails.tallyScanBarCodeQty = 0;
					}
				}
				else
				{
					itemDetails.tallyScanBarCodeQty = itemDetails.tallyScanBarCodeQty;
					itemDetails.showAvailableQtyTable = false;
					if (itemDetails.itemType == 'serializedinventoryitem' || itemDetails.itemType == 'serializedassemblyitem') {
						itemDetails.numberOfTimesSerialScanned = 0;
						itemDetails.scannedQuantityInEach = Number(itemDetails.availbleQuanity);
						itemDetails.isSerialItem = true;

					if (utility.isValueValid(itemDetails.unitType)) {
						var lineitemremainingquantity =  Number(itemDetails.availbleQuanity);

						itemDetails = getQtyInBaseUnits(itemDetails, Number(itemDetails.availbleQuanity));
						log.debug('itemDetails for serials',itemDetails);
						itemDetails.expectedquantity = itemDetails.lineitemremainingquantity;
							itemDetails.remainingQuantity = itemDetails.lineitemremainingquantity;//for WO
						itemDetails.stockUnitName = itemDetails.baseUnitName ;
							itemDetails.transactionUomName = itemDetails.baseUnitName ;
						itemDetails.scannedQuantityInEach = itemDetails.expectedquantity;
						itemDetails.remainingTallyQuantity = itemDetails.lineitemremainingquantity;
					}


				}
			}

			itemDetails.isTallyScanRequired = itemDetails.isTallyScanRequired;

			itemDetails.uomTobePopulated = itemDetails.barcodeQuantity;

				itemDetails.unitType = itemDetails.unitType;
				itemDetails.transactionUomConversionRate = itemDetails.getStockConversionRate;
			}
			return itemDetails;
		}

	function createOrUpdateTallyLoopObj(tallyLoopObj,itemType,transactionId,lineId,scannedQty,
		selectedStatusId,lotName,itemValidateObj) {
		var tallyscanQty = 1;
		var childObj={};
		var newChildObj = {};
		var childKey='';
		var key = transactionId + '-' + lineId;
		if(utility.isValueValid(itemValidateObj.transactionUomConversionRate)&&
			utility.isValueValid(itemValidateObj.qtyUOMObj)){
			var convertedValue = Number(Big((itemValidateObj.qtyUOMObj).conversionRate).div(itemValidateObj.transactionUomConversionRate));
			tallyscanQty = Number(Big(1).mul(convertedValue));
		}
		if(itemType == "inventoryitem" || itemType=="assemblyitem"){
			childKey = selectedStatusId ;
		}else if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
			childKey = lotName + '-'+ selectedStatusId ;
		}
		if(itemType == "inventoryitem" || itemType=="assemblyitem" ||
				itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
			if(utility.isValueValid(tallyLoopObj[key])){
				childObj = tallyLoopObj[key];
				if(utility.isValueValid(childObj[childKey])){
					childObj[childKey].quantity = parseFloat(childObj[childKey].quantity)+tallyscanQty;
				}else{
					newChildObj.quantity = tallyscanQty;
					newChildObj.statusId = selectedStatusId;
					newChildObj.lotName = lotName;
					childObj[childKey] = newChildObj ;
					tallyLoopObj[key] = childObj;
				}
			}else{
				newChildObj.quantity = tallyscanQty;
				newChildObj.statusId = selectedStatusId;
				newChildObj.lotName = lotName;
				childObj[childKey] = newChildObj ;
				tallyLoopObj[key] = childObj;
			}
		}else{
			tallyLoopObj[key] = scannedQty;
		}

		return tallyLoopObj;
	}

	function getSerialforTallyScanCYCC(itemDetailsObj){
		if (utility.isValueValid(itemDetailsObj.tallyScanSerial)) {
			var tallyScanSerial = itemDetailsObj.tallyScanSerial;
			var warehouseLocationId = itemDetailsObj.warehouseLocationId;
			var unitType = itemDetailsObj.unitType;
			var transactionUomName = itemDetailsObj.transactionUomName;

			var itemOutputObj = utility.itemValidationForInventoryAndOutBound(tallyScanSerial, warehouseLocationId);
			tallyScanSerial = utility.isValueValid(itemOutputObj.barcodeSerialname) ? itemOutputObj.barcodeSerialname: tallyScanSerial;
			itemDetailsObj.tallyScanSerial = tallyScanSerial;
			var itemInternalId = utility.isValueValid(itemOutputObj.itemInternalId) ? itemOutputObj.itemInternalId : itemOutputObj.barcodeIteminternalid;
			if(utility.isValueValid(itemInternalId) && itemInternalId != itemDetailsObj.tallyScanitemId){
							 itemDetailsObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
				 itemDetailsObj.isValid = false;
			}else{
				itemDetailsObj = utility.addItemDatatoResponse(itemDetailsObj, itemOutputObj, unitType, transactionUomName);
				if(utility.isValueValid(unitType)){
					itemDetailsObj = getUOMToBeConsideredObj(itemDetailsObj);
				}
				 itemDetailsObj.errorMessage = '';
				 itemDetailsObj.error  = '';
				 itemDetailsObj.isValid = true;
			}

		} else {
			itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.EMPTY_INPUT');
			itemDetailsObj.isValid = false;
		}
		log.debug({title: 'itemDetailsObj', details: itemDetailsObj});
		return itemDetailsObj;
	}


			function getZonePickingTypes(){
				var zonePickingTypeSearch =  search.create({type:'customlist_wms_zone_pickingtype',columns:[{	name: 'name'},{	name: 'internalid'}]	});
				var	 zonePickingType = zonePickingTypeSearch.run().getRange({start: 0,end: 1000});
				var zonePickingTypeArray = [];
				if(zonePickingType != undefined && zonePickingType != null && zonePickingType !='' && zonePickingType.length > 0)
				{
					for(var b=0;b<zonePickingType.length;b++)
					{
						zonePickingTypeArray.push(zonePickingType[b].getValue('name')+"@"+zonePickingType[b].getValue('internalid'));

					}
				}
				return zonePickingTypeArray;
			}

			function getMobileProcess(processNameFromState){
				var standardOrClonedProcessId = [];

				var standarProcessId = getStandardProcessId(processNameFromState);
				if(utility.isValueValid(standarProcessId))
				{
					standardOrClonedProcessId.push(standarProcessId);
				}
				var ClonedProcessId = getClonedProcessId(processNameFromState);
				if(utility.isValueValid(ClonedProcessId))
				{
					standardOrClonedProcessId.push(ClonedProcessId);
				}
				log.debug ('standardOrClonedProcessId',standardOrClonedProcessId);
				return standardOrClonedProcessId;
			}

			function getStandardProcessId(processNameFromState)
			{
				const importedProcessQuery = query.create({
					type: 'customrecord_mobile_imported_process'

				});

				var condIsActive = importedProcessQuery.createCondition({
					fieldId: 'isinactive',
					operator: query.Operator.IS,
					values: false
				});

				var condIsName = importedProcessQuery.createCondition({
					fieldId: 'name',
					operator: query.Operator.IS,
					values: processNameFromState
				});

				importedProcessQuery.condition = importedProcessQuery.and(
					condIsActive, condIsName);

				importedProcessQuery.columns = [
					importedProcessQuery.createColumn({
						fieldId: 'name'
					}),

					importedProcessQuery.createColumn({
						fieldId: 'custrecord_mobile_process_id'
					}),

					importedProcessQuery.createColumn({
						fieldId: 'id'
					}),

				];

				var standardProcessId ='';
				var objStandardProcessIdDetails = importedProcessQuery.run().results;

				if (objStandardProcessIdDetails != null && objStandardProcessIdDetails.length > 0) {
					for (var objStdProcessId in objStandardProcessIdDetails) {
						standardProcessId = objStandardProcessIdDetails[objStdProcessId].values[2]
					}
				}

				return standardProcessId;
			}

			function getClonedProcessId(processNameFromState)
			{
				const clonedProcessQuery = query.create({
					type: 'customrecord_mobile_process'

				});

				var condIsActive = clonedProcessQuery.createCondition({
					fieldId: 'isinactive',
					operator: query.Operator.IS,
					values: false
				});

				var condIsName = clonedProcessQuery.createCondition({
					fieldId: 'name',
					operator: query.Operator.IS,
					values: processNameFromState
				});


				clonedProcessQuery.condition = clonedProcessQuery.and(
					condIsActive,condIsName);

				clonedProcessQuery.columns = [

					clonedProcessQuery.createColumn({
						fieldId: 'name',
						groupBy: true
					}),

					clonedProcessQuery.createColumn({
						fieldId: 'custrecord_mobile_parent_process<customrecord_mobile_page.id',
						aggregate: query.Aggregate.MINIMUM

					}),

				];

				var clonedProcessId='';
				var objStandardProcessIdDetails = clonedProcessQuery.run().results;

				if (objStandardProcessIdDetails != null && objStandardProcessIdDetails.length > 0) {
					for (var objClonedProcessId in objStandardProcessIdDetails) {
						clonedProcessId = objStandardProcessIdDetails[objClonedProcessId].values[1]
					}
				}
				log.debug({title:'clonedProcessId',details:clonedProcessId});
				return clonedProcessId;
			}



			return {
		getItemDetails: getItemDetails,
		getTallyScanRuleData:getTallyScanRuleData,
		getCartonPickingRequiredData:getCartonPickingRequiredData,
		validateItemForTallyScan: validateItemForTallyScan,
		createOrUpdateLotJSONObject: _createOrUpdateLotJSONObject,
		createOrUpdateTallyScanJSONObject: _createOrUpdateTallyScanJSONObject,
		fetchBarcodeUnitType: fetchBarcodeUnitType,
		fetchSelectedUOM: fetchSelectedUOM,
		buildBarcodeObjwithconvertRate: buildBarcodeObjwithconvertRate,
		getUOMDetails:getUOMDetails,
		validateItemTallyScan:validateItemTallyScan,
		getCalculatedTallyScanQty:getCalculatedTallyScanQty,
		createOrUpdateTallyScanObj:createOrUpdateTallyScanObj,
		getQtyObjectToBePopulated:getQtyObjectToBePopulated,
		getQtyInBaseUnits:getQtyInBaseUnits,
		validateSerialTallyScan:validateSerialTallyScan,
		getExitingSerialORCreate:getExitingSerialORCreate,
		getinventoryNumberItemsList:getinventoryNumberItemsList,
		getInvNumSearch:getInvNumSearch,
		getUOMToBeConsideredObj:getUOMToBeConsideredObj,
		isTallyScanEnabled:isTallyScanEnabled,
		getSystemRuleValueforTallyScan:getSystemRuleValueforTallyScan,
		createOrUpdateTallyLoopObj:createOrUpdateTallyLoopObj,
		getSerialforTallyScanCYCC:getSerialforTallyScanCYCC,
				getMobileProcess:getMobileProcess
	};

});

