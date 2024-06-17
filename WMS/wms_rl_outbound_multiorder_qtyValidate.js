/**
 *    Copyright ï¿½ 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./big', 'N/runtime',
				'./wms_outBoundUtility','N/task','./wms_tallyScan_utility','N/wms/recommendedBins','N/search'],

				function(utility,translator,bigJS,runtime,obUtility,task,tallyScanUtility,binApi,search) {


	function doPost(requestBody) {

		var pickqtyValidate = {};
		var itemType='';
		var isTallyScanRequired='';
		var itemInternalId='';
		var orderInternalId='';
		var picktaskObj = {};
		var ordersLength =0;
		var orderDetails =[];
		var ordObj ={};
		var lotDetails = {};

		try{
			var requestParams = requestBody.params;
			if(utility.isValueValid(requestParams)) {
				log.debug({title: 'requestParams', details: requestParams});
				var totalLinepickqty = '';
				var isContainerScanRequired;
				var pickTaskId = requestParams.pickTaskId;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var fromBinInternalId = requestParams.fromBinInternalId;
				var pickQty = requestParams.pickQty;
				var enterQty = requestParams.enterQty;
				var pickStatusInternalId = requestParams.pickStatusInternalId;
				var lotName = requestParams.lotName;
				var statusText = requestParams.statusText;
				var transactionUomName = requestParams.transactionUomName;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
										if(!utility.isValueValid(requestParams.transactionUomConversionRate) && utility.isValueValid(requestParams.unitType)) {
												transactionUomConversionRate = 1;
										}
				var boolBinEmpty = requestParams.boolBinEmpty;
				var waveId = requestParams.waveId;
				var customerString = requestParams.customerString;
				var lineNoString = requestParams.lineNoString;
				var transactionNameString = requestParams.transactionNameString;
				var lotString = requestParams.lotString;
				var transactionName = requestParams.transactionName;
				var lineItemPickedQuantity = requestParams.lineItemPickedQuantity;
				var customer = requestParams.customer;
				var line = requestParams.line;
				var remainingQtyString = requestParams.remainingQty;
				var statusString = requestParams.statusString;
				var unitType = requestParams.unitType;
				var transactiontype = requestParams.transactiontype;
				var inventoryDetailLotOrSerial = requestParams.inventoryDetailLotOrSerial;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var barcodeQuantity = requestParams.barcodeQuantity;
				var tallyscanitem = requestParams.tallyscanitem;
				var numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				var transactionuomValue = requestParams.transactionuomValue;
				var tallyScanOrderQty = requestParams.tallyScanBarCodeQty;
				var btnClicked = requestParams.btnClicked;
				var pickingType = requestParams.pickingType;
				var bulkPickQty = requestParams.bulkPickQty;
				var stockUomConversionRate = requestParams.stockUomConversionRate;
				var showSkipBtn = requestParams.showskipbtn;
				var qtyUomSelected = requestParams.qtyUomSelected;
				var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
				var tallyLoopObj = requestParams.tallyLoopObj;
				var tallyScanSerial = requestParams.tallyScanSerial;
				var scannedQuantityInBaseUnits = requestParams.scannedQuantityInBaseUnits;
				var skipBtnCount = requestParams.skipbtncount;
				var boolNoStock = requestParams.boolNoStock;
				var qtyUOMObj = requestParams.qtyUOMObj;
				itemType = requestParams.itemType;
				isTallyScanRequired = requestParams.isTallyScanRequired;
				itemInternalId = requestParams.itemInternalId;
				orderInternalId = requestParams.orderInternalId;
				var isInvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
				var cartonPickingSystemRule = "Use cartons for multi-order picking?";
				var bulkPickingSystemRule = "Enable bulk picking of large pick tasks";
				var waveNumber = requestParams.waveNumber;
				var stockQuantity = requestParams.stockQuantity;
				var quantityInStock = requestParams.quantityInStock;
				var stockunitText = requestParams.stockunitText;
				var recommendedbin = requestParams.recommendedbin;
				var recommendedBinId = requestParams.recommendedBinId;
				var recommendedBinQty = requestParams.recommendedBinQty;
				var recommendedBinZoneId = requestParams.recommendedBinZoneId;
				var recommendedBinZoneName = requestParams.recommendedBinZoneName;
				var binId = requestParams.binId;
				var binName = requestParams.binName;

				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var stageByOrderSysRuleVal = requestParams.stageByOrderSystemRuleValue;
				var binEmptySysRuleVal = requestParams.binEmptySystemRuleValue;

				var quantityInStockwithUOM;
				if (utility.isValueValid(quantityInStock) && utility.isValueValid(transactionUomName)) {
					quantityInStock = Number(bigJS(quantityInStock).minus(stockQuantity));
					quantityInStockwithUOM = quantityInStock + ' ' + stockunitText;

				}
				if (!utility.isValueValid(isZonePickingEnabled)) {
					isZonePickingEnabled = false;
				}
				if (!utility.isValueValid(selectedZones)) {
					selectedZones = [];
				}

				log.debug('requestParams', requestParams);

				tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
				locUseBinsFlag = utility.isValueValid(locUseBinsFlag) ? locUseBinsFlag : true;

								var tranType = '';
								if(transactiontype!=null && transactiontype!='')
								{
										if(transactiontype =='SalesOrd')
										{
												tranType= "Sales Order";
										}
										else
										{
												tranType="Transfer Order";
										}

								}

				if (boolBinEmpty === true || boolBinEmpty === 'true' || boolNoStock === true || boolNoStock === 'true' ||
					(utility.isValueValid(btnClicked) && btnClicked == 'skip')) {
					var markOpenPicksDoneAutomaticallySystemRule = utility.getSystemRuleValue('Automatically mark partial picks as Done',
						warehouseLocationId);
					if (isTallyScanRequired && utility.getObjectLength(tallyLoopObj) > 0 && utility.isValueValid(tallyLoopObj[orderInternalId + '-' + line]))
					{
						log.debug(' IF CONDITION in tally scan flow', tallyLoopObj);
						if (itemType != "noninventoryitem") {
							//isContainerScanRequired = utility.getSystemRuleValue(cartonPickingSystemRule, warehouseLocationId);
														isContainerScanRequired = utility.getSystemRuleValueWithProcessType(cartonPickingSystemRule,warehouseLocationId,tranType);
						}

						if (isContainerScanRequired === 'Y') {
							pickqtyValidate.isValid = true;
							pickqtyValidate.enterqty = tallyScanOrderQty;
							pickqtyValidate.isCartonScanRequired = true;
							pickqtyValidate.tallyLoopObj = tallyLoopObj;
							pickqtyValidate.totalLinepickqty = Number(bigJS(tallyScanOrderQty).plus(lineItemPickedQuantity));
							pickqtyValidate.pickQty = tallyScanOrderQty;
							pickqtyValidate.boolNoStock = boolNoStock;
							pickqtyValidate.boolBinEmpty = boolBinEmpty;
							pickqtyValidate.binInternalId =fromBinInternalId;
						}
						else
						{
							picktaskObj = {};
							picktaskObj.isTallyScanRequired = isTallyScanRequired;
							picktaskObj.whLocation = warehouseLocationId;
							picktaskObj.picktaskid = pickTaskId;
							picktaskObj.pickqty = tallyScanOrderQty;
							picktaskObj.fromBinId = fromBinInternalId;
							picktaskObj.itemType = itemType;
							picktaskObj.line = line;
							picktaskObj.orderInternalId = orderInternalId;
							picktaskObj.totalLinepickqty = Number(bigJS(tallyScanOrderQty).plus(lineItemPickedQuantity));
							picktaskObj.locUseBinsFlag = locUseBinsFlag;
							picktaskObj.tallyLoopObj = tallyLoopObj;
							picktaskObj.itemId = itemInternalId;
							picktaskObj.inventoryStatusFeature = isInvStatusFeatureEnabled;

							obUtility.multiOrderPicktaskUpdate(picktaskObj);
														pickqtyValidate.showNavButtons = true;
							if (boolBinEmpty === 'true' || boolNoStock === 'true') {


								if(utility.isValueValid(markOpenPicksDoneAutomaticallySystemRule)){
									var markOpenPicksDoneAutomaticallySysRuleValue = markOpenPicksDoneAutomaticallySystemRule;
									log.debug('status updated in IF', markOpenPicksDoneAutomaticallySysRuleValue);
									if(markOpenPicksDoneAutomaticallySysRuleValue == "Y"){
										if((itemType == 'NonInvtPart' || itemType == 'Service' || itemType == 'noninventoryitem') && locUseBinsFlag == true)
										{
											obUtility.updatePickTaskStatusFormultiOrder(pickTaskId, markOpenPicksDoneAutomaticallySysRuleValue,itemType);
										}
										obUtility.updatePickTaskStatusFormultiOrder(pickTaskId, markOpenPicksDoneAutomaticallySysRuleValue);

									}
								}
								pickqtyValidate.binInternalId ='';
								pickqtyValidate.isPickTasklistNavigationRequired = true;
								pickqtyValidate.tallyLoopObj = {};
							}
						}

					}

					if ((utility.getObjectLength(tallyLoopObj) === 0 || (utility.getObjectLength(tallyLoopObj) > 0 && !utility.isValueValid(tallyLoopObj[orderInternalId + '-' + line]))) &&
						(boolBinEmpty === true || boolBinEmpty === 'true' || boolNoStock === true || boolNoStock === 'true')) {
						log.debug('SECOND IF CONDITION tallyLoopObj', tallyLoopObj);
						pickqtyValidate.isPickTasklistNavigationRequired = true;
						pickqtyValidate.binInternalId ='';
						if(boolNoStock === true || boolNoStock === 'true')
						{

							if(utility.isValueValid(markOpenPicksDoneAutomaticallySystemRule)){
								var markOpenPicksDoneAutomaticallySysRuleValue = markOpenPicksDoneAutomaticallySystemRule;
								log.debug('status updated in w/o tallyscan flow', markOpenPicksDoneAutomaticallySysRuleValue);
								if(markOpenPicksDoneAutomaticallySysRuleValue == "Y"){
									if((itemType == 'NonInvtPart' || itemType == 'Service' || itemType == 'noninventoryitem') && locUseBinsFlag == true)
									{
										obUtility.updatePickTaskStatusFormultiOrder(pickTaskId, markOpenPicksDoneAutomaticallySysRuleValue,itemType);
									}
									obUtility.updatePickTaskStatusFormultiOrder(pickTaskId, markOpenPicksDoneAutomaticallySysRuleValue);

								}
							}
						}
					}
					else if (btnClicked == 'skip')
					{
						if (!utility.isValueValid(skipBtnCount)) {
							skipBtnCount = 1;
						} else {
							skipBtnCount = parseInt(skipBtnCount) + 1;
						}

						orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId, waveId,
							pickTaskId, '', transactiontype, '');
						ordersLength = orderDetails.length;

						if (ordersLength > 0) {
														if(!isTallyScanRequired) {
																pickqtyValidate.showNavButtons = requestParams.showNavButtons;
														}
							if (skipBtnCount >= ordersLength) {
								skipBtnCount = ordersLength - 1;
							}
							if (!(isTallyScanRequired && pickqtyValidate.isCartonScanRequired)) {
								ordObj = {};
								ordObj = orderDetails[skipBtnCount];
								pickqtyValidate.itemType = itemType;
								pickqtyValidate.newOrderScanRequired = 'true';
								pickqtyValidate.qtyUOMObj = qtyUOMObj;
								pickqtyValidate.unitType = unitType;
								pickqtyValidate.transactionUomConversionRate = transactionUomConversionRate;
								obUtility.fillObjectWithNextOrderDetails(ordObj, pickqtyValidate, unitType, isTallyScanRequired);
								pickqtyValidate.isSamePageNavigationRequired = 'T';
								if (isTallyScanRequired) {
									if (utility.isValueValid(unitType)) {
										pickqtyValidate.barcodeQuantity = [{
											'value': 1,
											'unit': uomSelectionforFirstItr
										}];
									} else {
										pickqtyValidate.barcodeQuantity = [{'value': 1}];
									}
									pickqtyValidate.uomTobePopulated = pickqtyValidate.barcodeQuantity;
									pickqtyValidate.tallyScanBarCodeQty = 0;

								}
							} else {
								pickqtyValidate.transactionInternalId = orderInternalId;
								pickqtyValidate.transactionName = transactionName;
								pickqtyValidate.line = line;
								pickqtyValidate.customerString = customerString;
								pickqtyValidate.totalLinepickqty = Number(bigJS(tallyScanOrderQty).plus(lineItemPickedQuantity));
								pickqtyValidate.pickQty = tallyScanOrderQty;
							}

							pickqtyValidate.skipbtncount = skipBtnCount;
							if (parseInt(skipBtnCount) + 1 >= ordersLength) {
								pickqtyValidate.showskipbtn = 'F';
							} else {
								pickqtyValidate.showskipbtn = 'T';
							}
						}
					}
				}
				else {
					if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(pickTaskId) &&
						((utility.isValueValid(pickQty) && utility.isValueValid(itemInternalId) &&
							(utility.isValueValid(fromBinInternalId) ||
								(itemType == 'noninventoryitem' || locUseBinsFlag === false))))) {

						var itemDetails = {};
						if (isTallyScanRequired) {

							var itemValidateObj = {};
							itemValidateObj.tallyScanItem = tallyscanitem;
							itemValidateObj.pickTaskId = pickTaskId;
							itemValidateObj.tallyScanitemId = itemInternalId;
							itemValidateObj.tallyScanSerial = tallyScanSerial;
							itemValidateObj.pickBinId = fromBinInternalId;
							itemValidateObj.pickItemId = itemInternalId;
							itemValidateObj.transactionInternalId = orderInternalId;
							itemValidateObj.InvStatusInternalId = pickStatusInternalId;
							itemValidateObj.warehouseLocationId = warehouseLocationId;
							itemValidateObj.unitType = unitType;
							itemValidateObj.transactionUomName = transactionUomName;
							itemValidateObj.transactionuomId = transactionuomValue;
							itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
							itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
							itemValidateObj.qtyUomSelected = qtyUomSelected;
							itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
							itemValidateObj.tallyScanOrderQty = tallyScanOrderQty;
							itemValidateObj.scannedQuantityInBaseUnits = scannedQuantityInBaseUnits;
							itemValidateObj.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
							itemValidateObj.isTallyScanRequired = isTallyScanRequired;
							itemValidateObj.itemType = itemType;
							itemValidateObj.inventoryDetailLotOrSerial = inventoryDetailLotOrSerial;
							pickqtyValidate.transactionuomValue = transactionuomValue;
							log.debug('itemValidateObj11', itemValidateObj);
							if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
								pickqtyValidate = tallyScanUtility.validateSerialTallyScan(itemValidateObj);
								if (utility.isValueValid(pickqtyValidate.objinvNumSearchRes) &&
									(pickqtyValidate.objinvNumSearchRes).length > 1) {
									pickqtyValidate.navigateToLotItemsListScreen = 'T';
								}
							}
							else {
								pickqtyValidate = tallyScanUtility.validateItemTallyScan(itemValidateObj);
							}
							pickqtyValidate = tallyScanUtility.getCalculatedTallyScanQty(pickqtyValidate);
							log.debug({title: 'pickqtyValidate', details: pickqtyValidate});
							lotName = pickqtyValidate.barcodeLotname;
							if (itemType != "noninventoryitem") {
								//var containerScanRequired = utility.getSystemRuleValue(cartonPickingSystemRule, warehouseLocationId);
																var containerScanRequired = utility.getSystemRuleValueWithProcessType(cartonPickingSystemRule,warehouseLocationId,tranType);
								if (containerScanRequired === 'Y') {
									pickqtyValidate.isCartonScanRequired = "true";
								}
							}

							if (!utility.isValueValid(lotName) && !utility.isValueValid(pickqtyValidate.errorMessage) &&
								(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

								if (utility.isValueValid(inventoryDetailLotOrSerial)) {
									lotName = inventoryDetailLotOrSerial;
								} else {
									lotDetails = {};
									lotDetails.warehouseLocationId = warehouseLocationId;
									lotDetails.itemInternalId = itemInternalId;
									lotDetails.fromBinInternalId = fromBinInternalId;
									var itemLotDetails = obUtility.getPickingLotDetails(lotDetails);
									log.debug('itemLotDetails', itemLotDetails);
									if (itemLotDetails.length > 0) {

										if (itemLotDetails.length > 1) {
											pickqtyValidate.isSamePageNavigationRequired = 'F';
											pickqtyValidate.isLotScanNavigationRequired = false;
											pickqtyValidate.navigateToLotListScreen = 'T';

										} else {
											lotName = itemLotDetails[0].inventorynumberText;
										}
									}
								}
							}

							if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
								utility.isValueValid(pickqtyValidate.errorMessage)) {
								lotName = tallyscanitem;
								itemDetails = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, lotName, fromBinInternalId, '', pickStatusInternalId);
								log.debug('itemDetails', itemDetails);
								if (itemDetails.length > 0) {
									if (utility.isValueValid(unitType)) {
										pickqtyValidate = tallyScanUtility.getUOMToBeConsideredObj(itemValidateObj);
									}
									log.debug('itemDetails pickqtyValidate', pickqtyValidate);
									if (pickqtyValidate.uomModified == "T") {
										pickqtyValidate.errorMessage = pickqtyValidate.errorMessage;
										pickqtyValidate.isValid = false;
									} else {
										pickqtyValidate.errorMessage = '';
										pickqtyValidate.isValid = true;
									}
									if (itemDetails.length > 1) {
										pickqtyValidate.isSamePageNavigationRequired = 'F';
										pickqtyValidate.isLotScanNavigationRequired = false;
										pickqtyValidate.navigateToLotListScreen = 'F';
										pickqtyValidate.navigateToLotItemsListScreen = 'T';
									}
								}
							}

						}
						pickqtyValidate.recommendedBinNum = recommendedbin;
						pickqtyValidate.recommendedBinId = recommendedBinId;
						pickqtyValidate.recommendedBinZoneId = recommendedBinZoneId;
						pickqtyValidate.recommendedBinZoneName = recommendedBinZoneName;
						pickqtyValidate.recommendedBinQty = recommendedBinQty;
						pickqtyValidate.binInternalId = binId;
						pickqtyValidate.binName = binName;
						if (utility.isValueValid(pickqtyValidate.errorMessage)) {
							pickqtyValidate.isValid = false;
						} else if (isTallyScanRequired && (itemInternalId != pickqtyValidate.tallyScanitemId)) {
							pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
							pickqtyValidate.isValid = false;
						} else if (!(utility.isValueValid(itemType)
														&& (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
														&& utility.isValueValid(lotName)) && !utility.isValueValid(enterQty)) {
							pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
							pickqtyValidate.isValid = false;
						} else if (!(utility.isValueValid(itemType)
														&& (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
														&& utility.isValueValid(lotName)) && (parseFloat(enterQty) > parseFloat(pickQty)) && (pickingType != 'BULK' ||
							(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"))) {
							pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
							pickqtyValidate.isValid = false;
						} else if (!(utility.isValueValid(itemType)
														&& (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
														&& utility.isValueValid(lotName)) && (parseFloat(enterQty) > parseFloat(bulkPickQty)) && pickingType == 'BULK') {
							pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.BULKPICKQTY");
							pickqtyValidate.isValid = false;
						} else {
							pickqtyValidate.isSamePageNavigationRequired = 'F';
							var serailQty = enterQty;
							if (!utility.isValueValid(transactionUomConversionRate)) {
								transactionUomConversionRate = 1;
								transactionUomName = '';
							}
							serailQty = Number(bigJS(serailQty).mul(transactionUomConversionRate));
							if (serailQty.toString().indexOf('.') != -1 &&
								(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {

								pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_.SERIALITEM_DECIMALS_NOTALLOWED');
								pickqtyValidate.isValid = false;
							} else if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && !isTallyScanRequired) {

								var availableQty = checkAvailableQuantity(warehouseLocationId, itemInternalId, fromBinInternalId, lotInternalId, pickStatusInternalId, transactionUomConversionRate,
									stockUomConversionRate, enterQty, itemType);

								if (parseFloat(enterQty) > parseFloat(availableQty) && itemType != "noninventoryitem") {
									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.AVAILABLE_QTY");
									pickqtyValidate.isValid = false;
								} else {

									if (utility.isValueValid(statusText)) {
										pickqtyValidate.statusString = utility.isValueValid(statusString) ? (statusString + "," + statusText) : statusText;
									}
									lineItemPickedQuantity = utility.isValueValid(lineItemPickedQuantity) ? lineItemPickedQuantity : 0;
									totalLinepickqty = Number(bigJS(enterQty).plus(lineItemPickedQuantity));
									pickqtyValidate.line = line;
									pickqtyValidate.transactionInternalId = orderInternalId;
									pickqtyValidate.transactionName = transactionName;
									pickqtyValidate.customerString = customerString;
									pickqtyValidate.isValid = true;
									pickqtyValidate.numberOfTimesSerialScanned = 0;
									pickqtyValidate.scannedQuantityInEach = serailQty;
									pickqtyValidate.totalLinepickqty = totalLinepickqty;
									pickqtyValidate.pickedQty = requestParams.pickedQty;
									pickqtyValidate.remainingQty = remainingQtyString;
									pickqtyValidate.transactionNameString = transactionNameString;
									pickqtyValidate.remainingQuantity = pickQty;
									pickqtyValidate.transactionUomName = transactionUomName;
									pickqtyValidate.lineNoString = lineNoString;
									pickqtyValidate.enterqty = enterQty;
									pickqtyValidate.isValid = true;
								}
							} else if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
								((!utility.isValueValid(lotName)) && ((isTallyScanRequired != true) ||
									(isTallyScanRequired == true && pickqtyValidate.navigateToLotListScreen != 'T')))) {

								pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
								pickqtyValidate.isValid = false;
							} else if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
								&& ((utility.isValueValid(inventoryDetailLotOrSerial)) &&
									((inventoryDetailLotOrSerial != lotName)) && (pickqtyValidate.navigateToLotListScreen != 'T'))) {

								pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_INVENTDETAILS_VALIDLOT");
								pickqtyValidate.isValid = false;
							} else if (isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")
								&& (utility.isValueValid(inventoryDetailLotOrSerial) && (inventoryDetailLotOrSerial != pickqtyValidate.tallyScanSerial))) {

								pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_INVENTDETAILS_VALIDSERIAL");
								pickqtyValidate.isValid = false;
							} else {
								var lotInternalId = '';
								if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {
									lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, itemInternalId);
									log.debug({title: 'lotInternalId', details: lotInternalId});
									if (!utility.isValueValid(lotInternalId)) {
										var currItem = utility.itemValidationForInventoryAndOutBound(lotName, warehouseLocationId);
										log.debug({title: 'currItem', details: currItem});
										if (utility.isValueValid(currItem.isbarcodescanned) && utility.isValueValid(currItem.barcodeQuantity)) {
											enterQty = currItem.barcodeQuantity;
											stockQuantity = enterQty;
											if (utility.isValueValid(currItem.barcodeUomName) && utility.isValueValid(unitType)) {
												var barcodeUom = utility.getUOMDetails(unitType);
												for (var i = 0; i < barcodeUom.length; i++) {
													if (barcodeUom[i]['uom.unitname'] === currItem.barcodeUomName) {
														if (utility.isValueValid(qtyUomSelected[0])) {
																														qtyUomSelected[0].unitname = barcodeUom[i]['uom.unitname'];
																														qtyUomSelected[0].pluralname = barcodeUom[i]['uom.pluralname'];
																														qtyUomSelected[0].baseunit = barcodeUom[i]['uom.baseunit'];
																														qtyUomSelected[0].conversionrate = barcodeUom[i]['uom.conversionrate'];
																														qtyUomSelected[0].unit = barcodeUom[i]['uom.internalid'];
																														qtyUomSelected[0].abbreviation = barcodeUom[i]['uom.abbreviation'];
																														qtyUomSelected[0].pluralabbreviation = barcodeUom[i]['uom.pluralabbreviation'];
																														qtyUomSelected[0].value = enterQty;
														}
														break;
													}
												}
												if(utility.isValueValid(qtyUomSelected[0].conversionrate)) {
													enterQty = utility.uomConversions(enterQty, transactionUomConversionRate, qtyUomSelected[0].conversionrate);
													stockQuantity = utility.uomConversions(enterQty, stockUomConversionRate, qtyUomSelected[0].conversionrate);
												}
											}
										}
										if ((utility.isValueValid(currItem.isbarcodescanned) && utility.isValueValid(currItem.barcodeQuantity)) && utility.isValueValid(quantityInStock) && utility.isValueValid(transactionUomName)) {
											quantityInStock = Number(bigJS(quantityInStock).minus(stockQuantity));
											quantityInStockwithUOM = quantityInStock + ' ' + stockunitText;
										}
										if (!utility.isValueValid(enterQty)) {
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
											pickqtyValidate.isValid = false;
										} else if ((parseFloat(enterQty) > parseFloat(pickQty)) && (pickingType != 'BULK' ||
											(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"))) {
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
											pickqtyValidate.isValid = false;
										} else if ((parseFloat(enterQty) > parseFloat(bulkPickQty)) && pickingType == 'BULK') {
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.BULKPICKQTY");
											pickqtyValidate.isValid = false;
										}
										if ((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId)) ||
											utility.isValueValid(currItem.barcodeIteminternalid)) {
											var barCodeItemInternalidNumber = "";
											if (utility.isValueValid(currItem.itemInternalId)) {
												barCodeItemInternalidNumber = currItem.itemInternalId;
											} else if (utility.isValueValid(currItem.barcodeIteminternalid)) {
												barCodeItemInternalidNumber = currItem.barcodeIteminternalid;
											}
											if ((itemInternalId == barCodeItemInternalidNumber) &&
												utility.isValueValid(currItem.barcodeLotname)) {
												lotName = currItem.barcodeLotname;
												lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, itemInternalId);
												log.debug({title: 'lotInternalId', details: lotInternalId});
											}

										}

									} else {
										if (!utility.isValueValid(enterQty)) {
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
											pickqtyValidate.isValid = false;
										} else if ((parseFloat(enterQty) > parseFloat(pickQty)) && (pickingType != 'BULK' ||
											(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"))) {
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
											pickqtyValidate.isValid = false;
										} else if ((parseFloat(enterQty) > parseFloat(bulkPickQty)) && pickingType == 'BULK') {
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.BULKPICKQTY");
											pickqtyValidate.isValid = false;
										}
									}
								}

								if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
									!utility.isValueValid(lotInternalId)) {
									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
									pickqtyValidate.isValid = false;
								} else {
									var lotAvailableQty = 0;
									var lotValidateDetails = [];
									if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
										(pickqtyValidate.navigateToLotListScreen != 'T')) {
										lotDetails = {};
										lotDetails.warehouseLocationId = warehouseLocationId;
										lotDetails.itemInternalId = itemInternalId;
										lotDetails.fromBinInternalId = fromBinInternalId;
										lotDetails.invStatusFeature = isInvStatusFeatureEnabled;
										lotDetails.lotInternalId = lotInternalId;
										lotDetails.fromInventorystatus = pickStatusInternalId;

										pickqtyValidate.lotName = lotName;
										pickqtyValidate.lotInternalId = lotInternalId;

										if (utility.isValueValid(transactiontype) && transactiontype == 'TrnfrOrd') {
											lotDetails.orderType = transactiontype;
										}
										lotValidateDetails = obUtility.getPickingLotDetails(lotDetails);
										log.debug({title: 'lotValidateDetails', details: lotValidateDetails});
										if (lotValidateDetails.length > 0) {

											var inventoryNumber = lotValidateDetails[0].inventorynumberText;
											if (inventoryNumber == lotName) {

												pickqtyValidate.lotInternalId = lotValidateDetails[0].inventorynumber;
												pickqtyValidate.defaultStatus = lotValidateDetails[0].statusText;
												lotAvailableQty = lotValidateDetails[0].available;
												log.debug('transactionUomConversionRate', transactionUomConversionRate);
												log.debug('stockUomConversionRate', stockUomConversionRate);
												if (utility.isValueValid(transactionUomConversionRate) &&
													utility.isValueValid(stockUomConversionRate) &&
													(stockUomConversionRate != transactionUomConversionRate)) {
													log.debug('bflotAvailableQty', lotAvailableQty);
													lotAvailableQty = utility.uomConversions(lotAvailableQty, transactionUomConversionRate, stockUomConversionRate);
													log.debug('aflotAvailableQty', lotAvailableQty);
												}
												if (tallyLoopObj != undefined && parseFloat(lotAvailableQty) > 0) {

													var totalQty = 0;
													for (var obj in tallyLoopObj) {
														if (tallyLoopObj[obj]) {

														for (var status in tallyLoopObj[obj]) {
															var qty = tallyLoopObj[obj][status].quantity;
															if (isInvStatusFeatureEnabled == true) {

																var statusId = tallyLoopObj[obj][status].statusId;
																var tallyLooplotName = tallyLoopObj[obj][status].lotName;

																if (statusId == lotValidateDetails[0]['status'] &&
																	tallyLooplotName == lotValidateDetails[0]['inventorynumberText']) {
																	totalQty = totalQty + qty;
																}
															} else {
																if (tallyLooplotName == lotValidateDetails[0]['inventorynumberText']) {
																	totalQty = totalQty + qty;
																}
															}
														}
													}
													}
													log.debug('totalQty', totalQty);
													if (parseFloat(totalQty) > 0) {
														lotAvailableQty = Number(bigJS(lotAvailableQty).minus(totalQty));
													}
													log.debug('lotAvailableQty', lotAvailableQty);
												}
											}
										}
									}
									if (isTallyScanRequired == true && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
										if (!utility.isValueValid(numberOfTimesSerialScanned) || numberOfTimesSerialScanned == 0 ||
											numberOfTimesSerialScanned == '0') {
											//The below code is to close the already scanned serials if the back button is clicked.
											if (!utility.isValueValid(numberOfTimesSerialScanned) || numberOfTimesSerialScanned == 0 ||
												numberOfTimesSerialScanned == '0') {
												obUtility.checkAndCloseSerials('', orderInternalId, itemInternalId);
											}

										}
										pickqtyValidate = tallyScanUtility.getExitingSerialORCreate(pickqtyValidate);
									}
									if (isTallyScanRequired == true &&
										(itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") &&
										(itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem")) {
										var availableQty = checkAvailableQuantity(warehouseLocationId, itemInternalId, fromBinInternalId, '', pickStatusInternalId, transactionUomConversionRate,
											stockUomConversionRate, enterQty, itemType);

										if (tallyLoopObj != undefined) {
											var totalQty = 0;
											if (parseFloat(availableQty) > 0) {
												for (var obj in tallyLoopObj) {
													if (tallyLoopObj[obj]) {
													for (var status in tallyLoopObj[obj]) {
														var qty = tallyLoopObj[obj][status].quantity;
														if (isInvStatusFeatureEnabled == true) {
															var statusId = tallyLoopObj[obj][status].statusId;
															if (statusId == pickStatusInternalId) {
																totalQty = totalQty + qty;
															}
														} else {
															totalQty = totalQty + qty;
														}
													}
												}
												}
												if (parseFloat(totalQty) > 0) {
													availableQty = Number(bigJS(availableQty).minus(totalQty));
												}

											}
											log.debug("availableQty",availableQty);
											var selectedUOMFromUIConversionRate = 1;
											var selectedUOMFromUI = requestParams.qtyUomSelected;
											if(utility.isValueValid(selectedUOMFromUI) && utility.isValueValid(unitType)) {
												selectedUOMFromUIConversionRate = selectedUOMFromUI[0].conversionrate;
											}
											log.debug("selectedUOMFromUIConversionRate",selectedUOMFromUIConversionRate);
											if (parseFloat(availableQty) < parseFloat(selectedUOMFromUIConversionRate) && itemType != "noninventoryitem") {
												pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.AVAILABLE_QTY");
												pickqtyValidate.isValid = false;

											}
										}
									}
									var qty = enterQty;
									if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
										isTallyScanRequired == true) {

										qty = 1;
										if (utility.isValueValid(qtyUomSelected)) {
											var convRate = qtyUomSelected[0].conversionrate;
											if (utility.isValueValid(convRate) && utility.isValueValid(stockUomConversionRate)) {
												qty = utility.uomConversions(qty, stockUomConversionRate, convRate);
												qty = utility.uomConversions(qty, transactionUomConversionRate, stockUomConversionRate);
												log.debug("qty", qty);
											}
										}
									}
									if (utility.isValueValid(pickqtyValidate.errorMessage)) {
										pickqtyValidate.isValid = false;
									} else if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
										(lotValidateDetails.length == 0 || lotAvailableQty == 0) && pickqtyValidate.navigateToLotListScreen != 'T') {
										pickqtyValidate.isValid = false;
										pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
									} else if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
										(parseFloat(qty) > parseFloat(lotAvailableQty)) && (pickqtyValidate.navigateToLotListScreen != 'T')) {
										log.debug({title: 'lotAvailableQty', details: lotAvailableQty});
										log.debug({title: 'enterQty', details: qty});
										pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.LOTPICKQTY");
										pickqtyValidate.isValid = false;

									} else {

										//info screen varaibles setting start
										if (utility.isValueValid(statusText)) {
											pickqtyValidate.statusString = utility.isValueValid(statusString) ? (statusString + "," + statusText) : statusText;
										}
										if (utility.isValueValid(customer)) {
											pickqtyValidate.customerString = utility.isValueValid(customerString) ? (customerString + "," + customer) : customer;
										}
										pickqtyValidate.lineNoString = utility.isValueValid(lineNoString) ? (lineNoString + "," + line) : line;
										pickqtyValidate.transactionNameString = utility.isValueValid(transactionNameString) ? (transactionNameString + "," + transactionName) : transactionName;
										if (utility.isValueValid(lotName)) {
											pickqtyValidate.lotString = utility.isValueValid(lotString) ? (lotString + "," + lotName) : lotName;
										}
										//info screen varaibles setting end

										if (pickingType == 'BULK' && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {
											isContainerScanRequired = false;
										} else if (itemType != "noninventoryitem") {
											//isContainerScanRequired = utility.getSystemRuleValue(cartonPickingSystemRule, warehouseLocationId);
																							isContainerScanRequired = utility.getSystemRuleValueWithProcessType(cartonPickingSystemRule,warehouseLocationId,tranType);
																						if (isContainerScanRequired == 'N') {
												isContainerScanRequired = false;
											} else {
												pickqtyValidate.stageCompleteScreenLabel = translator.getTranslationString('MULTIORDERPICKING.STAGECOMPLETECARTONS');
												isContainerScanRequired = true;
											}
										}

										lineItemPickedQuantity = utility.isValueValid(lineItemPickedQuantity) ? lineItemPickedQuantity : 0;
										totalLinepickqty = Number(bigJS(enterQty).plus(lineItemPickedQuantity));
										pickqtyValidate.picktaskId = pickTaskId;
										pickqtyValidate.isContainerScanRequired = isContainerScanRequired;
										if (isTallyScanRequired) {
																								if (utility.isValueValid(pickqtyValidate.barcodeQuantity) && utility.isValueValid(pickqtyValidate.barcodeQuantity[0].unit)) {
																										var selectedUOM = {};
																										if(utility.isValueValid(pickqtyValidate.barcodeIteminternalid)) {
																												pickqtyValidate.itemInternalId = pickqtyValidate.barcodeIteminternalid;
																										}
																										selectedUOM = tallyScanUtility.fetchSelectedUOM(pickqtyValidate.itemInternalId, pickqtyValidate.barcodeQuantity[0].unit);
																										pickqtyValidate.qtyUOMObj.conversionRate = selectedUOM.uomid;
																										pickqtyValidate.qtyUOMObj.unitId = selectedUOM.uominternalId;
																										pickqtyValidate.qtyUOMObj.unitName = selectedUOM.unitName;
																								}
											if (pickqtyValidate.navigateToLotListScreen != 'T' && pickqtyValidate.navigateToLotItemsListScreen != 'T') {
												tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanObj(tallyLoopObj, itemType, orderInternalId, line, enterQty, pickStatusInternalId, '', lotName, pickqtyValidate);
											}
											pickqtyValidate.tallyLoopObj = tallyLoopObj;
										}
										if (isTallyScanRequired && ((parseFloat(enterQty) < parseFloat(pickQty)) ||
											((!utility.isValueValid(lotName) && pickqtyValidate.navigateToLotListScreen == 'T') ||
												(utility.isValueValid(lotName) && pickqtyValidate.navigateToLotItemsListScreen == 'T')) ||
											((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && pickqtyValidate.navigateToLotItemsListScreen == 'T')
										)) {

											if (((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
												&& ((!utility.isValueValid(lotName) && pickqtyValidate.navigateToLotListScreen == 'T') ||
													(utility.isValueValid(lotName) && pickqtyValidate.navigateToLotItemsListScreen == 'T')
												)) || ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") &&
												pickqtyValidate.navigateToLotItemsListScreen == 'T')) {
												pickqtyValidate.isValid = true;
																								var selectedUOM = {};
																								if (utility.isValueValid(pickqtyValidate.barcodeQuantity)) {
																										if (utility.isValueValid(pickqtyValidate.barcodeQuantity[0].unit)) {
																												pickqtyValidate.uomSelectionforFirstItr = pickqtyValidate.barcodeQuantity[0].unit;
																												if (pickqtyValidate.qtyUomSelected[0].unit != pickqtyValidate.barcodeQuantity[0].unit) {
															if(utility.isValueValid(pickqtyValidate.barcodeIteminternalid)) {
																pickqtyValidate.itemInternalId = pickqtyValidate.barcodeIteminternalid;
															}
																														selectedUOM = tallyScanUtility.fetchSelectedUOM(pickqtyValidate.itemInternalId, pickqtyValidate.barcodeQuantity[0].unit);
																														pickqtyValidate.qtyUOMObj.conversionRate = selectedUOM.uomid;
																														pickqtyValidate.qtyUOMObj.unitId = selectedUOM.uominternalId;
																														pickqtyValidate.qtyUOMObj.unitName = selectedUOM.unitName;
																												}
																										}
																										if (utility.isValueValid(selectedUOM.uomid) && utility.isValueValid(pickqtyValidate.qtyUomSelected[0].conversionrate) && selectedUOM.uomid != pickqtyValidate.qtyUomSelected[0].conversionrate) {
																												var convertedValue = Number(bigJS(selectedUOM.uomid).div(pickqtyValidate.qtyUomSelected[0].conversionrate));
																												enterQty = Number(bigJS(enterQty).mul(convertedValue));//this is added becuase if we transaction uom is 2 case and if we are scannng item alias with  1 pallet then since from above enterQty field is fetching only ony 1 not 2 as transaction uom to submit in piack task
																										}
																								}
												pickqtyValidate.tallyScanBarCodeQty = parseFloat(enterQty);
												pickqtyValidate.pickStatusInternalId = pickStatusInternalId;
												pickqtyValidate.lblRemainingQuantity = requestParams.remainingQty;
												pickqtyValidate.remainingQuantity = requestParams.remainingQuantity;
												pickqtyValidate.remainingQty = requestParams.remainingQty;
												pickqtyValidate.transactionType = transactiontype;
												pickqtyValidate.lineItemPickedQuantity = lineItemPickedQuantity;
												pickqtyValidate.tallyScanOrderQty = tallyScanOrderQty;
												pickqtyValidate.line = line;
												pickqtyValidate.showskipbtn = showSkipBtn;
											} else {
												pickqtyValidate.isSamePageNavigationRequired = 'T';
																								var selectedUOM = {};
																								if (utility.isValueValid(pickqtyValidate.barcodeQuantity)) {
																										if (utility.isValueValid(pickqtyValidate.barcodeQuantity[0].unit)) {
																												pickqtyValidate.uomSelectionforFirstItr = pickqtyValidate.barcodeQuantity[0].unit;
																												if (pickqtyValidate.qtyUomSelected[0].unit != pickqtyValidate.barcodeQuantity[0].unit) {
															if(utility.isValueValid(pickqtyValidate.barcodeIteminternalid)) {
																pickqtyValidate.itemInternalId = pickqtyValidate.barcodeIteminternalid;
															}
																														selectedUOM = tallyScanUtility.fetchSelectedUOM(pickqtyValidate.itemInternalId, pickqtyValidate.barcodeQuantity[0].unit);
																														pickqtyValidate.qtyUOMObj.conversionRate = selectedUOM.uomid;
																														pickqtyValidate.qtyUOMObj.unitId = selectedUOM.uominternalId;
																														pickqtyValidate.qtyUOMObj.unitName = selectedUOM.unitName;
																												}
																										}
																										if (utility.isValueValid(selectedUOM.uomid) && utility.isValueValid(pickqtyValidate.qtyUomSelected[0].conversionrate) && selectedUOM.uomid != pickqtyValidate.qtyUomSelected[0].conversionrate) {
																												var convertedValue = Number(bigJS(selectedUOM.uomid).div(pickqtyValidate.qtyUomSelected[0].conversionrate));
																												enterQty = Number(bigJS(enterQty).mul(convertedValue));//this is added becuase if we transaction uom is 2 case and if we are scannng item alias with  1 pallet then since from above enterQty field is fetching only ony 1 not 2 as transaction uom to submit in piack task
																										}
																								}
												var quantityUOMObj = tallyScanUtility.getQtyObjectToBePopulated(enterQty, pickqtyValidate.qtyUOMObj, transactionUomConversionRate);
												pickqtyValidate.barcodeQuantity = quantityUOMObj;
												pickqtyValidate.tallyScanBarCodeQty = parseFloat(enterQty);
												var pickOrderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId, waveId, pickTaskId, '', transactiontype, '');
												if (!utility.isValueValid(skipBtnCount) || (utility.isValueValid(skipBtnCount) && (parseInt(skipBtnCount) + 1) > pickOrderDetails.length)) {
													skipBtnCount = 0;
												}
												log.debug('skipBtnCount', skipBtnCount);
												obUtility.fillObjectWithNextOrderDetails(pickOrderDetails[skipBtnCount], pickqtyValidate, unitType, isTallyScanRequired);
												pickqtyValidate.isValid = true;
												pickqtyValidate.tallyScanOrderQty = tallyScanOrderQty;
												pickqtyValidate.showskipbtn = showSkipBtn;
												pickqtyValidate.remainingQty = requestParams.remainingQty;
												pickqtyValidate.line = line;
												pickqtyValidate.uomTobePopulated = quantityUOMObj;
												pickqtyValidate.isContainerScanRequired = false; // Overriding for tallyscan
												if (!(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
													pickqtyValidate.lblRemainingQuantity = Number(bigJS(parseFloat(pickQty)).minus(parseFloat(enterQty)));
													if (utility.isValueValid(transactionUomName)) {
														pickqtyValidate.lblRemainingQuantity = pickqtyValidate.lblRemainingQuantity + " " + transactionUomName;
													}
												}

											}
										} else if (isContainerScanRequired) {


											var availableQty = 0;
											if (!isTallyScanRequired) {
												availableQty = checkAvailableQuantity(warehouseLocationId, itemInternalId, fromBinInternalId, lotInternalId, pickStatusInternalId, transactionUomConversionRate,
													stockUomConversionRate, enterQty, itemType);
											}
											if (!isTallyScanRequired && parseFloat(enterQty) > parseFloat(availableQty) && itemType != "noninventoryitem") {
												pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.AVAILABLE_QTY");
												pickqtyValidate.isValid = false;
											} else {
												pickqtyValidate.isValid = true;
												pickqtyValidate.totalLinepickqty = totalLinepickqty;
												pickqtyValidate.enterqty = enterQty;
												pickqtyValidate.transactionInternalId = orderInternalId;
												pickqtyValidate.transactionName = transactionName;
												pickqtyValidate.isTallyScanRequired = isTallyScanRequired;
												pickqtyValidate.line = line;
											}
										} else {
											picktaskObj = {};
											picktaskObj.whLocation = warehouseLocationId;
											picktaskObj.picktaskid = pickTaskId;
											picktaskObj.pickqty = enterQty;
											picktaskObj.fromBinId = fromBinInternalId;
											picktaskObj.batchno = lotName;
											picktaskObj.statusInternalId = pickStatusInternalId;
											picktaskObj.itemType = itemType;
											picktaskObj.line = line;
											picktaskObj.orderInternalId = orderInternalId;
											picktaskObj.totalLinepickqty = totalLinepickqty;
											picktaskObj.locUseBinsFlag = locUseBinsFlag;
											picktaskObj.lotInternalId = lotInternalId;
											picktaskObj.tallyLoopObj = tallyLoopObj;
											picktaskObj.itemId = itemInternalId;
											picktaskObj.inventoryStatusFeature = isInvStatusFeatureEnabled;

											var remainQty = 0;
											if (pickingType == 'BULK' && (itemType != "serializedinventoryitem" &&
												itemType != "serializedassemblyitem")) {
												// To get orders list by order priority and age of order

												availableQty = checkAvailableQuantity(warehouseLocationId, itemInternalId, fromBinInternalId, lotInternalId, pickStatusInternalId, transactionUomConversionRate,
													stockUomConversionRate, enterQty, itemType);

												if (parseFloat(enterQty) > parseFloat(availableQty) && itemType != "noninventoryitem") {
													pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.AVAILABLE_QTY");
													pickqtyValidate.isValid = false;
												} else {
													var thresholdValue = "";
													var triggerPointForMRscript = utility.getSystemRuleValue(bulkPickingSystemRule, warehouseLocationId);
													if (!utility.isValueValid(triggerPointForMRscript) || triggerPointForMRscript == 'N') {
														//get default rulevalue, if system rule is not configured or inactive
														thresholdValue = parseInt(utility.getDefaultRuleValueForAsyncSystemRules(bulkPickingSystemRule));
													} else {
														thresholdValue = parseInt(triggerPointForMRscript);
													}

													log.debug('thresholdValue', thresholdValue);
													var pickActionIdArray = obUtility.getOrdersForBulkPick(pickTaskId, itemInternalId);
													picktaskObj.pickActionIdArray = pickActionIdArray;
													if (pickActionIdArray.length < thresholdValue) {
														obUtility.bulkPickTaskUpdate(picktaskObj);
														remainQty = Number(bigJS(bulkPickQty).minus(enterQty));
														if (parseFloat(remainQty) > 0) {
															pickqtyValidate.isSamePageNavigationRequired = 'T';
														}
													} else {

														// Calling scheduler for large data set processing
														var mapReduceJobId = updateBulkPickTaskAsync(pickTaskId, enterQty, fromBinInternalId, lotName,
															pickStatusInternalId, itemType, locUseBinsFlag, pickActionIdArray);
														var currentUserID = runtime.getCurrentUser().id;//To get current user
														utility.updateScheduleScriptStatus('Bulkpicking PickTask Update Mapreduce', currentUserID,
															'Submitted', pickTaskId);
														log.debug('mapReduceJobId', mapReduceJobId);
														pickqtyValidate.isBulkMapreduceInvoke = 'T';
													}

													remainQty = Number(bigJS(bulkPickQty).minus(enterQty));
													pickqtyValidate.bulkPickQty = remainQty;

													if (parseFloat(remainQty) > 0) {
																												pickqtyValidate.showNavButtons = true;
														remainQty = remainQty + " " + transactionUomName;
														pickqtyValidate.bulkPickQtyUOM = remainQty;
													}
													pickqtyValidate.isValid = true;
													pickqtyValidate.remainingQty = remainQty;

												}
											} else {
												picktaskObj.isTallyScanRequired = isTallyScanRequired;
												obUtility.multiOrderPicktaskUpdate(picktaskObj);
																								//pickqtyValidate.showNavButtons = true;
												remainQty = Number(bigJS(pickQty).minus(enterQty));
												if (parseFloat(remainQty) > 0) {

													pickqtyValidate.isSamePageNavigationRequired = 'T';
													if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
														(parseFloat(enterQty) < parseFloat(pickQty))) {
														var lotRemainingQty = Number(bigJS(pickQty).minus(enterQty));
														pickqtyValidate.lotTotalQuantity = lotRemainingQty;
														pickqtyValidate.remainingQuantity = lotRemainingQty;
														pickqtyValidate.lineItemPickedQuantity = enterQty;
														pickqtyValidate.lblRemainingQuantity = lotRemainingQty + " " + transactionUomName;

													}


												}
												pickqtyValidate.isValid = true;


											}
											ordersLength = 0;
											if (pickqtyValidate.isValid) {

												if (pickqtyValidate.isBulkMapreduceInvoke != 'T') {
													var impactedRecords = {};
													if (transactiontype == 'TrnfrOrd') {
														impactedRecords = obUtility.noCodeSolForPicking(pickTaskId, waveId, '', orderInternalId, line, 1);
													} else {
														impactedRecords = obUtility.noCodeSolForPicking(pickTaskId, waveId, orderInternalId, '', line, 1);
													}
													pickqtyValidate.impactedRecords = impactedRecords;
													log.debug({title: 'lineRemainingQty', details: remainQty});

													if (parseFloat(remainQty) <= 0) {
														if (itemType == "noninventoryitem" && locUseBinsFlag != false) {
															obUtility.updateStageForNonInventoryItem(pickTaskId, line, "multiorder", orderInternalId, pickingType);
														}
													}

													orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId, waveId, pickTaskId, '', transactiontype, remainQty, isZonePickingEnabled);
													log.debug({title: 'orderDetails', details: orderDetails});
													if (utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true) {
														var currentUserID = runtime.getCurrentUser().id;
														var recLength = 0;
														var pickTasksLength = orderDetails.length;
														for (var pickTaskList = 0; pickTaskList < pickTasksLength; pickTaskList++) {
															var zone = orderDetails[pickTaskList].zone;
															var picker = orderDetails[pickTaskList].picker;
															log.debug({title: 'zone', details: zone});
															if (!utility.isValueValid(zone)) {
																zone = "0";
															} else {
																zone = parseInt(zone);
															}
															if ((selectedZones.indexOf(zone) != -1) || (picker == currentUserID)) {
																recLength = recLength + 1;
															}
														}
														ordersLength = recLength;
														log.debug({title: 'ordersLength', details: ordersLength});
													} else {
														ordersLength = orderDetails.length;
													}
												}
												if (ordersLength > 0) {
																										pickqtyValidate.showNavButtons = true;
													pickqtyValidate.isSamePageNavigationRequired = 'T';

													var qtyRemaining = 0;
													var ordDetail = 0;
													for (ordDetail = 0; ordDetail < ordersLength; ordDetail++) {

														qtyRemaining = parseFloat(qtyRemaining) + parseFloat(orderDetails[ordDetail].lineitemremainingquantity);
													}

													pickqtyValidate.qtyRemaining = qtyRemaining;
													if (utility.isValueValid(recommendedBinId) && (utility.isValueValid(locUseBinsFlag) && utility.isValueValid(qtyRemaining)
															&& parseFloat(qtyRemaining) > 0 && isTallyScanRequired != true && locUseBinsFlag == true) && (itemType != "noninventoryitem")
														&& (isContainerScanRequired == 'false' || isContainerScanRequired == false)) {

														var objBinDetails = [];
														var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

														var searchName = 'customsearch_wmsse_invtbalance_invt_item';
														if (itemType == "inventoryitem" || itemType == "assemblyitem") {
															searchName = 'customsearch_wmsse_invtbalance_invt_item';
														} else if (itemType == "serializedinventoryitem" || itemType ==
															"serializedassemblyitem") {
															searchName = 'customsearch_wmsse_invtbalance_serialsrh';

														} else {
															if (itemType == "lotnumberedinventoryitem" || itemType ==
																"lotnumberedassemblyitem") {
																searchName = "customsearch_wmsse_inventorybalance"
															}
														}
														log.debug('searchName', searchName);


														var objBinDetails = obUtility.getItemsInventoryDetailswithInvStatusEnable(searchName, itemInternalId, fromBinInternalId, warehouseLocationId,
															itemType);
														log.debug('objBinDetails', objBinDetails);
														if (objBinDetails.length == 0) {

															var pickTaskArr = [];
															pickTaskArr.push(pickTaskId);

															var binResults = binApi.recommendPickPathForPickTasks(pickTaskArr);
															if (binResults !== null && binResults !== undefined && binResults !== 'null') {
																log.debug({
																	title: 'binResults',
																	details: binResults
																});
																var binData = binResults.bins[0].data;
																var binStatus = binResults.bins[0].status.code;
																if (binStatus == 'SUCCESS') {
																	pickqtyValidate.isSamePageNavigationRequired = 'F';
																	pickqtyValidate.isBinScanPageNavigationRequired = 'T';
																	pickqtyValidate.recommendedBinNum = binData.bin.name;
																	pickqtyValidate.recommendedBinId = binData.bin.id;
																	pickqtyValidate.recommendedBinZoneId = binData.zone.id;
																	pickqtyValidate.recommendedBinZoneName = binData.zone.name;
																	pickqtyValidate.binInternalId = binData.bin.id;
																	pickqtyValidate.binName = binData.zone.name;
																	if (inventoryStatusFeature) {
																		var inventoryStatusOptions = utility.getInventoryStatusOptions();
																		if (inventoryStatusOptions.length > 0) {
																			var binStatusMakeAvailableQty = 0;
																			var binQtyArr = binResults.bins[0].data.quantities;
																			for (var qtyIndex = 0; qtyIndex < binQtyArr.length; qtyIndex++) {

																				var recomendedBinStatusName = binQtyArr[qtyIndex].status.name;

																				for (var invtStatus in inventoryStatusOptions) {
																					if (inventoryStatusOptions[invtStatus]) {
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
																				pickqtyValidate.recommendedBinQty = binStatusMakeAvailableQty;
																			}
																		}

																	} else {
																		pickqtyValidate.recommendedBinQty = binData.quantities[0] ? binData.quantities[0].quantity : 0;
																	}
																} else {
																	pickqtyValidate.isSamePageNavigationRequired = 'F';
																	pickqtyValidate.isPickTaskListNavigationRequired = 'T';
																}
															} else {
																pickqtyValidate.isSamePageNavigationRequired = 'F';
																pickqtyValidate.isPickTaskListNavigationRequired = 'T';
															}

														}
													//	else{
																												if(utility.isValueValid(binEmptySysRuleVal) && binEmptySysRuleVal == true) {
																														pickqtyValidate.showNavButtons = true;
																														if (utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true
																																&& utility.isValueValid(stageByOrderSysRuleVal) && stageByOrderSysRuleVal == true ) {

																																var pickedOrdersArr = obUtility.getPickedOrders(waveNumber, warehouseLocationId, selectedZones, pickTaskId);
																																pickqtyValidate.ordersToStageCount = pickedOrdersArr.length;
																																var ordersIdArr = [];
																																for (var ord in pickedOrdersArr) {
																																		if (pickedOrdersArr[ord]) {
																																				ordersIdArr.push(pickedOrdersArr[ord].id);
																																		}
																																}
																																pickqtyValidate.selectedOrders = ordersIdArr;
																																pickqtyValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder', '', orderInternalId, warehouseLocationId);
																																if (pickqtyValidate.boolAnyItemIsAlreadyStaged == 'Y') {
																																		pickqtyValidate.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
																																} else {
																																		pickqtyValidate.starDescription = '';
																																}
																														}
																												}
														//}
													}

													if (!utility.isValueValid(skipBtnCount) ||
														(utility.isValueValid(skipBtnCount) && (parseInt(skipBtnCount) + 1) > ordersLength)) {
														skipBtnCount = 0;
													}
													ordObj = {};
													ordObj = orderDetails[skipBtnCount];
													pickqtyValidate.newOrderScanRequired = 'true';

													if (transactiontype == 'SalesOrd') {

														pickqtyValidate.customer = ordObj.customerText;
													}
													obUtility.fillObjectWithNextOrderDetails(ordObj, pickqtyValidate, unitType, isTallyScanRequired);
													pickqtyValidate.isValid = true;
													if (isTallyScanRequired) {
														if (utility.isValueValid(unitType)) {
															pickqtyValidate.barcodeQuantity = [{
																'value': 1,
																'unit': (pickqtyValidate.qtyUOMObj).unitId
															}];
														} else {
															pickqtyValidate.barcodeQuantity = [{'value': 1}];
														}
														pickqtyValidate.tallyLoopObj = {};
														pickqtyValidate.uomTobePopulated = pickqtyValidate.barcodeQuantity;
														pickqtyValidate.tallyScanBarCodeQty = 0;

													} else {
														if (utility.isValueValid(barcodeQuantity) && barcodeQuantity.length > 0 && utility.isValueValid(barcodeQuantity[0].unit))
															pickqtyValidate.barcodeQuantity = [{'unit': barcodeQuantity[0].unit}];
													}
													if (parseInt(skipBtnCount) + 1 >= ordersLength) {
														pickqtyValidate.showskipbtn = 'F';
													} else {
														pickqtyValidate.showskipbtn = 'T';
													}
												} else {
													pickqtyValidate.isSamePageNavigationRequired = 'F';
													pickqtyValidate.qtyRemaining = 0;

													var currentUser = runtime.getCurrentUser().id;
													var pickTasks = obUtility.getmultiorderPickTaskDetailsForValidation(warehouseLocationId, waveId, currentUser, isZonePickingEnabled);
													log.debug('pickTasks', pickTasks);
													if (utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true) {
														var recLength = 0;
														var pickTasksLength = pickTasks.length;
														var currentUserID = runtime.getCurrentUser().id;
														for (var pickTaskList = 0; pickTaskList < pickTasksLength; pickTaskList++) {
															var zone = pickTasks[pickTaskList].zone;
															var picker = pickTasks[pickTaskList].picker;
															if (!utility.isValueValid(zone)) {
																zone = "0";
															} else {
																zone = parseInt(zone);
															}
															if ((selectedZones.indexOf(zone) != -1) || (picker == currentUserID)) {
																recLength = recLength + 1;
															}
														}
														pickTasks.length = recLength;
													}
													pickqtyValidate.isPendingPickTaks = pickTasks.length > 0 ? 'Y' : 'N';

													if (locUseBinsFlag === true) {
														pickqtyValidate.showStageButton = obUtility.getShowStageFlag(waveId, warehouseLocationId);
														pickqtyValidate.ordersToStageCount = 0;
														if (pickqtyValidate.showStageButton == 'Y' && utility.isValueValid(isZonePickingEnabled) &&
															isZonePickingEnabled == true) {
															pickqtyValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder', '', orderInternalId, warehouseLocationId);
															var pickedOrdersArr = obUtility.getPickedOrders(waveNumber, warehouseLocationId, selectedZones);
															pickqtyValidate.ordersToStageCount = pickedOrdersArr.length;
															var ordersIdArr = [];
															for (var ord in pickedOrdersArr) {
																if (pickedOrdersArr[ord]) {
																	ordersIdArr.push(pickedOrdersArr[ord].id);
																}
															}
															pickqtyValidate.selectedOrders = ordersIdArr;
															if (pickqtyValidate.boolAnyItemIsAlreadyStaged == 'Y') {
																pickqtyValidate.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
															} else {
																pickqtyValidate.starDescription = '';
															}

														}
														else{
															if(pickqtyValidate.showStageButton == 'Y') {
																pickqtyValidate.selectedOrders = orderInternalId;
															}
														}
													}
													pickqtyValidate.isValid = true;
												}
											}
										}
									}
								}
							}
						}
					}

					else
						{
							pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
							pickqtyValidate.isValid = false;
						}
					}
				}

			else {
				pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
				pickqtyValidate.isValid = false;
			}
		}
		catch(e) {
			if(isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
				utility.deleteSerialEntry(orderInternalId, '', itemInternalId,3);
			}
			pickqtyValidate.isValid = false;
			pickqtyValidate.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		pickqtyValidate.quantityInStock = quantityInStock;
		pickqtyValidate.quantityInStockwithUOM = quantityInStockwithUOM;
		log.debug({title:'pickqtyValidate final',details:pickqtyValidate});
		return pickqtyValidate;
	}
	function updateBulkPickTaskAsync(pickTaskInternalId,enteredQty,fromBinId,lot,pickStatusIId,itemType,locUseBinsFlag,pickActionArray) {
		var mapReducetask =  task.create({taskType:task.TaskType.MAP_REDUCE});
		mapReducetask.scriptId = 'customscript_wms_mr_bulkpicktask_update';
		mapReducetask.params = {
				"custscript_wms_picktaskid" :  pickTaskInternalId,
				"custscript_wms_pickitemqty" : enteredQty,
				"custscript_wms_frombinid" : fromBinId,
				"custscript_wms_batchno" : lot,
				"custscript_wms_fromstatusid" : pickStatusIId,
				"custscript_wms_item_type" : itemType,
				"custscript_wms_locusebinsflag" : locUseBinsFlag,
				"custscript_wms_pickActionIdArray" : pickActionArray
		};
		log.debug('mapReducetask',mapReducetask);
		return mapReducetask.submit();
	}
	function checkAvailableQuantity(warehouseLocationId, itemInternalId, fromBinInternalId, lotInternalId, pickStatusInternalId,transactionUomConversionRate,
			stockUomConversionRate,enterQty,itemType){

		var availableQuantityArr = [];
		var availableQty = 0;
		if (itemType != "noninventoryitem") {
			availableQuantityArr = obUtility.getstatusDetailsForValidation(warehouseLocationId, itemInternalId, fromBinInternalId, lotInternalId, pickStatusInternalId);
		}

		if (availableQuantityArr.length > 0) {

			if (itemType != "noninventoryitem") {
				var txnUOMconvertedQty = 0;
				var qtyFromSearch = 0;

				for (var j = 0; j < availableQuantityArr.length; j++) {
					txnUOMconvertedQty = 0;
					qtyFromSearch = availableQuantityArr[j].available;
					if (utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(stockUomConversionRate)) {
						txnUOMconvertedQty = utility.uomConversions(qtyFromSearch, transactionUomConversionRate, stockUomConversionRate);  // For UOM items
					} else {
						txnUOMconvertedQty = qtyFromSearch; // For non UOM items
					}
					availableQty = parseFloat(availableQty) + parseFloat(txnUOMconvertedQty);
					if (parseFloat(availableQty) > parseFloat(enterQty)) {
						break;
					}
				}
			}
		}
		return 	availableQty;
	}


			return {
		'post': doPost

	};

});
