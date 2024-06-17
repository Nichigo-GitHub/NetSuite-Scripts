/**
 *    Copyright ï¿½ 2018, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_tallyScan_utility', './wms_translator', './big', './wms_outBoundUtility','N/runtime','N/wms/recommendedBins'],
	/**
	 * @param {search} search
	 */
	function (utility, tallyScanUtility, translator, bigJS, obUtility,runtime,binApi) {
		function doPost(requestBody) {
			var pickqtyValidate = {};
			var totalLinepickqty = '';
			var requestParams = '';
			var impactedRecords = {};
			var tallyscanQty = 1;
			var itemDetails = {};
			var itemValidate = 'T';
			var uomValue;
			var binEmptyAction = '';
			var noStockAction = '';
			var uomModified = 'F';
			var qtyUomSelectedArr = [];
			var barcodeQty = 0;
			var systemRule = '';
			var  recommendedbin = '';
			var recommendedBinId = '';
			var recommendedBinQty = '';
			var recommendedBinZoneId = '';
			var recommendedBinZoneName = '';
			try {
				requestParams = requestBody.params;
				if (utility.isValueValid(requestParams)) {
					var pickTaskId = requestParams.pickTaskId;
					var warehouseLocationId = requestParams.warehouseLocationId;
					var pickBinId = requestParams.pickBinId;
					var pickItemId = requestParams.pickItemId;
					var pickQty = requestParams.pickQty;
					var enterQty = requestParams.enterQty;
					var pickStatusInternalId = requestParams.pickStatusInternalId;
					var itemType = requestParams.itemType;
					var lotName = requestParams.lotName;
					var lotQtyString = requestParams.lotQtyString;
					var lotQtyStatusString = requestParams.lotQtyStatusString;
					var statusText = requestParams.statusText;
					var transactionUomName = requestParams.transactionUomName;
					var transactionUomConversionRate = requestParams.transactionUomConversionRate;
					var transactionInternalId = requestParams.transactionInternalId;
					var lineItemRemainingQuantity = requestParams.lineItemRemainingQuantity;
					var totalPickedQuantity = requestParams.totalPickedQuantity;
					var lotInternalId = '';
					var lotString = requestParams.lotString;
					var lotValidateDetails = {};
					var isValid = 'T';
					var orderType = requestParams.orderType;
					var inventoryDetailLotOrSerial = requestParams.inventoryDetailLotOrSerial;
					var waveId = requestParams.waveId;
					var transactionLineId = requestParams.transactionLineId;
					var transactionType = requestParams.transactionType;
					var stockUomConversionRate = requestParams.stockUomConversionRate;
					var locUseBinsFlag = requestParams.locUseBinsFlag;
					var isTallyScanRequired = requestParams.isTallyScanRequired;
					var tallyScanAction = requestParams.tallyScanAction;
					var barcodeQuantity = requestParams.barcodeQuantity;
					var tallyscanitem = requestParams.tallyscanitem;
					var tallyLoopObj = requestParams.tallyLoopObj;
					var lotShown = requestParams.lotShown;
					var qtyShown = requestParams.qtyShown;
					var barcodeLotname = requestParams.barcodeLotname;
					var transactionuomValue = requestParams.transactionuomValue;
					var tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
					var numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
					var scannedQuantityInEach = requestParams.scannedQuantityInEach;
					var qtyUomSelection = requestParams.qtyUomSelection;
					var navigateLotSerialScreen = requestParams.navigateLotSerialScreen;
					var selectLotSerialItemAction = requestParams.selectLotSerialItemAction;
					var inventoryNumberId = requestParams.inventoryNumberId;
					var scannedItemText = requestParams.scannedItemText;
					var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
					var scannedInvNumbersText = requestParams.scannedInvNumbersText;
					var isLotScan = requestParams.isLotScan;
					var uomConvRateofBarCode = requestParams.uomConvRateofBarCode;
					var unitType = requestParams.unitstype;
					binEmptyAction = requestParams.binEmptyAction;
					noStockAction = requestParams.noStockAction;
					var stockQuantity = requestParams.stockQuantity;
					var quantityInStock = requestParams.quantityInStock;
					var stockunitText = requestParams.stockunitText;
					recommendedbin = requestParams.recommendedbin;
					recommendedBinId = requestParams.recommendedBinId;
					recommendedBinQty = requestParams.recommendedBinQty;
					recommendedBinZoneId = requestParams.recommendedBinZoneId;
					recommendedBinZoneName = requestParams.recommendedBinZoneName;

					if(utility.isValueValid(quantityInStock) && utility.isValueValid(transactionUomName)){
						quantityInStock = Number(bigJS(quantityInStock).minus(stockQuantity));
						pickqtyValidate.quantityInStock = quantityInStock;
						pickqtyValidate.quantityInStockwithUOM = quantityInStock + ' ' + stockunitText;

					}

					var  isZonePickingEnabled   = requestParams.isZonePickingEnabled;
					var selectedZones = requestParams.selectedZones;
					if(!utility.isValueValid(isZonePickingEnabled)){
						isZonePickingEnabled = false;
					}
					if(!utility.isValueValid(selectedZones)){
						selectedZones = [];
					}
var tranType = '';
                    if(transactionType!=null && transactionType!='')
                    {
                        if(transactionType =='SalesOrd')
                        {
                            tranType= "Sales Order";
                        }
                        else
                        {
                            tranType="Transfer Order";
                        }

                    }
log.debug('tranType tranType',tranType);
					var isContainerScanRequired = '';
					log.debug({title: 'requestParams', details: requestParams});
					transactionUomConversionRate = utility.isValueValid(transactionUomConversionRate) ? transactionUomConversionRate : 1;
					uomConvRateofBarCode = utility.isValueValid(uomConvRateofBarCode) ? uomConvRateofBarCode : 1;
					locUseBinsFlag = utility.isValueValid(locUseBinsFlag) ? locUseBinsFlag : true;
					isTallyScanRequired = utility.isValueValid(isTallyScanRequired) ? isTallyScanRequired : false;
					barcodeQuantity = utility.isValueValid(barcodeQuantity) ? barcodeQuantity : 0;
					numberOfTimesSerialScanned = utility.isValueValid(numberOfTimesSerialScanned) ? numberOfTimesSerialScanned : 0;
					tallyScanBarCodeQty = utility.isValueValid(tallyScanBarCodeQty) ? tallyScanBarCodeQty : 0;
					enterQty = utility.isValueValid(enterQty) ? enterQty : 0;//added this because ,when screen comes from new intermeditae screen of tally scan th
					transactionUomName = utility.isValueValid(transactionUomName) ? transactionUomName : '';
					lotShown = utility.isValueValid(lotShown) ? lotShown : true;
					qtyShown = utility.isValueValid(qtyShown) ? qtyShown : true;
					navigateLotSerialScreen = utility.isValueValid(navigateLotSerialScreen) ? navigateLotSerialScreen : false;

					var requireQuantity = Number(bigJS(enterQty).minus(tallyScanBarCodeQty));
					var isInvStatusFeature = utility.isInvStatusFeatureEnabled();
					//bin Empty Implementation
					if ((utility.isValueValid(binEmptyAction) && binEmptyAction == 'binEmpty') ||
						(utility.isValueValid(noStockAction) && noStockAction == 'noStock')) {
						if (isTallyScanRequired && ((utility.isValueValid(tallyLoopObj) ||
							(itemType == 'serializedinventoryitem' ||
								itemType == 'serializedassemblyitem')))) {

							log.debug('tranType in sop carton picking qty validate BINEMPTY',tranType);
							systemRule = "Use cartons for single-order picking?";
							isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,tranType);
							//isContainerScanRequired = utility.getSystemRuleValue(systemRule, warehouseLocationId);

							if ((itemType != 'serializedinventoryitem' && itemType != 'serializedassemblyitem') ||
								parseInt(tallyScanBarCodeQty) > 0) {
								log.debug('into serial submission for partial carton picking',isContainerScanRequired);
								if (utility.isValueValid(isContainerScanRequired) && isContainerScanRequired == 'Y') {
									pickqtyValidate.isValid = true;
									pickqtyValidate.enterqty = tallyScanBarCodeQty;
									if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {
										pickqtyValidate.enterqty = tallyScanBarCodeQty;

									}
									pickqtyValidate.isCartonScanRequired = "true";
									pickqtyValidate.tallyLoopObj = tallyLoopObj;
									pickqtyValidate.binEmptyAction = binEmptyAction;
									pickqtyValidate.noStockAction = noStockAction;
									pickqtyValidate.binInternalId =pickBinId;
								}
								else {
									var picktaskObj = {};
									picktaskObj.picktaskid = pickTaskId;
									picktaskObj.whLocation = warehouseLocationId;
									picktaskObj.itemId = pickItemId;
									picktaskObj.fromBinId = pickBinId;
									picktaskObj.itemType = itemType;
									picktaskObj.locUseBinsFlag = locUseBinsFlag;
									picktaskObj.isTallyScanRequired = isTallyScanRequired;
									picktaskObj.enterqty = tallyScanBarCodeQty;

									var tallyqtyarr = [];
									if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {
										picktaskObj.enterqty = tallyScanBarCodeQty;

									}
									if ((isInvStatusFeature && (itemType == "inventoryitem" || itemType == "assemblyitem"))
										|| (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {


										var lotArray = [];
										var statusArray = [];

										for (var tallyLoopObjIndex in tallyLoopObj) {
											if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
												lotArray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
												tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
												statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
											} else if (statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
												tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
												statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
											}
										}
										picktaskObj.batchno = lotArray;
										picktaskObj.pickqty = tallyqtyarr;
										picktaskObj.frominvtstatus = statusArray;
										picktaskObj.statusInternalId = statusArray;
									}
									log.debug('picktaskObj binempty', picktaskObj);
									obUtility.picktaskupdate(picktaskObj);
									pickqtyValidate.isPickTasklistNavigationRequired = 'true';
									pickqtyValidate.binInternalId ='';
									if(utility.isValueValid(noStockAction) && noStockAction == 'noStock'){
										var markOpenPicksDoneAutomaticallySystemRule = utility.getSystemRuleValue('Automatically mark partial picks as Done',
											warehouseLocationId);
										if(utility.isValueValid(markOpenPicksDoneAutomaticallySystemRule)){
											var markOpenPicksDoneAutomaticallySysRuleValue = markOpenPicksDoneAutomaticallySystemRule;
											if(markOpenPicksDoneAutomaticallySysRuleValue == "Y"){
												if (utility.isValueValid(locUseBinsFlag) &&
													locUseBinsFlag == true || locUseBinsFlag == "true") {
													obUtility.updatePickTaskToDoneForSingleOrder(pickTaskId, markOpenPicksDoneAutomaticallySysRuleValue, "STAGED");
												}
												obUtility.updatePickTaskToDoneForSingleOrder(pickTaskId,markOpenPicksDoneAutomaticallySysRuleValue,"DONE");
											}
										}
									}
								}
							} else {
								pickqtyValidate.isPickTasklistNavigationRequired = 'true';
								pickqtyValidate.binInternalId ='';
							}
						} else {
							pickqtyValidate.isPickTasklistNavigationRequired = 'true';
							pickqtyValidate.binInternalId ='';
							if(utility.isValueValid(noStockAction) && noStockAction == 'noStock'){
								var markOpenPicksDoneAutomaticallySystemRule = utility.getSystemRuleValue('Automatically mark partial picks as Done',
									warehouseLocationId);
								if(utility.isValueValid(markOpenPicksDoneAutomaticallySystemRule)){
									var markOpenPicksDoneAutomaticallySysRuleValue = markOpenPicksDoneAutomaticallySystemRule;
									if(markOpenPicksDoneAutomaticallySysRuleValue == "Y"){
										if (utility.isValueValid(locUseBinsFlag) &&
											locUseBinsFlag == true || locUseBinsFlag == "true") {
											obUtility.updatePickTaskToDoneForSingleOrder(pickTaskId, markOpenPicksDoneAutomaticallySysRuleValue, "STAGED");
										}
										obUtility.updatePickTaskToDoneForSingleOrder(pickTaskId,markOpenPicksDoneAutomaticallySysRuleValue,"DONE");
									}
								}
							}
						}

					}
					else {
						pickqtyValidate.recommendedBinNum = recommendedbin;
						pickqtyValidate.recommendedBinId = recommendedBinId;
						pickqtyValidate.recommendedBinZoneId = recommendedBinZoneId;
						pickqtyValidate.recommendedBinZoneName = recommendedBinZoneName;
						pickqtyValidate.recommendedBinQty = recommendedBinQty;

						totalLinepickqty = Number(bigJS(enterQty).plus(totalPickedQuantity));
						var itemValidateObj = {};
						var scannedSerialInternalId = '';
						var qtyUomSelected = '';
						tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
						if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(pickTaskId) &&
							utility.isValueValid(pickQty) && utility.isValueValid(pickItemId) && (utility.isValueValid(pickBinId)
								|| (itemType == 'noninventoryitem' || locUseBinsFlag == false))) {
							if (isTallyScanRequired) {


								itemValidateObj.tallyScanItem = tallyscanitem;
								itemValidateObj.warehouseLocationId = warehouseLocationId;
								itemValidateObj.pickItemId = pickItemId;
								itemValidateObj.pickBinId = pickBinId;
								itemValidateObj.unitType = unitType;
								itemValidateObj.InvStatusInternalId = pickStatusInternalId;
								itemValidateObj.transactionInternalId = transactionInternalId;
								itemValidateObj.transactionUomName = transactionUomName;
								itemValidateObj.transactionuomId = transactionuomValue;
								itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
								itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
								itemValidateObj.qtyUomSelected = qtyUomSelection;
								itemValidateObj.pickTaskId = pickTaskId;
								pickqtyValidate.transactionUomConversionRate = transactionUomConversionRate;
								pickqtyValidate.tallyScanOrderQty = tallyScanBarCodeQty;


								if (utility.isValueValid(qtyUomSelection)) {
									var uomlength = qtyUomSelection.length;
									var qtyUomSelectedObj = {};
									for (var uomItr = 0; uomItr < uomlength; uomItr++) {
										if (utility.isValueValid(qtyUomSelection[uomItr].value)) {
											qtyUomSelectedObj.value = qtyUomSelection[uomItr].value;
										}
										if (utility.isValueValid(qtyUomSelection[uomItr].unit)) {
											qtyUomSelectedObj.unit = qtyUomSelection[uomItr].unit;
										}

										qtyUomSelectedArr.push(qtyUomSelectedObj);
									}
								}

								if (((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') ||
										(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) &&
									(selectLotSerialItemAction != 'selectLotSerialItemAction')) {
									if (utility.isValueValid(tallyscanitem)) {

										//this block executes from quantity screen
										var isScannedItem = true;
										pickqtyValidate = tallyScanUtility.validateItemTallyScan(itemValidateObj);
										if (pickqtyValidate.isbarcodescanned) {
											if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
												if (utility.isValueValid(pickqtyValidate.barcodeLotname)) {
													lotName = pickqtyValidate.barcodeLotname;
												}
												tallyscanitem = pickqtyValidate.barcodeItemname;
											}

											if ((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') && (utility.isValueValid(pickqtyValidate.barcodeSerialname))) //if fetches this value then bar code along with serial is scanned
											{
												tallyscanitem = pickqtyValidate.barcodeSerialname;
												pickqtyValidate.errorMessage = 'barcode with serial scanned';

											}
										}

						  		if ((utility.isValueValid(pickqtyValidate.errorMessage))||((!pickqtyValidate.isbarcodescanned) &&
                                    (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'))) {
											isScannedItem = false;
											if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')  //if fetches this value then bar code along with serial is scanned
											{
												var serialGetObj = {};
												var _isScannedSerialExits = '';
												var scannedSerialInternalId = '';
												serialGetObj.serialName = tallyscanitem;
												serialGetObj.itemInternalId = pickItemId;
												serialGetObj.warehouseLocationId =warehouseLocationId;
												serialGetObj.inventoryDetailLotOrSerial = inventoryDetailLotOrSerial;
												var invNumSearchRes = utility.inventoryNumberInternalId(tallyscanitem, warehouseLocationId, pickItemId,'picking');

												if(utility.isValueValid(invNumSearchRes)){
													scannedSerialInternalId = invNumSearchRes[0].id;
												}
												if(utility.isValueValid(scannedSerialInternalId)){
													_isScannedSerialExits =  utility.getSerialList(pickBinId,pickItemId,warehouseLocationId,pickStatusInternalId,scannedSerialInternalId,inventoryDetailLotOrSerial);
												}
												if( (_isScannedSerialExits.length == 0) || (!utility.isValueValid(scannedSerialInternalId)))
												{
													pickqtyValidate.isValid = false;
													pickqtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
													isValid = 'F';

												}
												else
												{
													var serialSearchRes = obUtility.getExitingSerial(serialGetObj);
													if (serialSearchRes.length != 0) {
														pickqtyValidate.isValid = false;
														pickqtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED');
														isValid = 'F';
													}
												}
											}
										}


										var invNumbersResult = '';

										if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
											&& isScannedItem == true) {
											var lotDetails = {};
											log.debug('if','');
											lotDetails.warehouseLocationId = warehouseLocationId;
											if (pickqtyValidate.isbarcodescanned) {
												lotDetails.itemInternalId = pickqtyValidate.barcodeIteminternalid;

												if (utility.isValueValid(pickqtyValidate.barcodeLotname)) {
													var barCodeLotDetails = utility.inventoryNumberInternalId(pickqtyValidate.barcodeLotname, warehouseLocationId, pickItemId, 'picking');
													if (barCodeLotDetails.length > 0) {
														lotDetails.lotInternalId = barCodeLotDetails[0].id;
														isValid = 'T';

													}
													else{
														isValid = 'F';
														lotName="";
														pickqtyValidate.isValid = false;
														pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
													}
												}

											} else {
												lotDetails.itemInternalId = pickqtyValidate.itemInternalId;
											}
											if(isValid !="F") {
												lotDetails.fromBinInternalId = pickBinId;
												lotDetails.fromInventorystatus = pickStatusInternalId;
												log.debug('lotDetails test', lotDetails);
												invNumbersResult = obUtility.getPickingLotDetails(lotDetails);
												log.debug('invNumbersResult test', invNumbersResult);
												if (utility.isValueValid(invNumbersResult)) {
													lotName = invNumbersResult[0].inventorynumberText;
												}
												barcodeQuantity = tallyScanUtility.getQtyObjectToBePopulated(enterQty, pickqtyValidate.qtyUOMObj, transactionUomConversionRate);
											}
										} else {
											if (isValid == 'T')
											{
												invNumbersResult = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, tallyscanitem, pickBinId, '',pickStatusInternalId);
											}
										}
										if (invNumbersResult.length > 1) {

											tallyscanQty = 1;
											pickqtyValidate.isValid = true;
											pickqtyValidate.lotShown = false;
											pickqtyValidate.itemValidate = 'T';
											isValid = 'F';

											lotName = invNumbersResult[0].inventorynumberText;
											log.debug('tranType in sop carton picking qty validate11',tranType);
											systemRule = "Use cartons for single-order picking?";
											var containerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,tranType);
                                           // var containerScanRequired = utility.getSystemRuleValue("Use cartons for single-order picking?", warehouseLocationId);
											 var isCartonScanRequired = false;
											if (utility.isValueValid(containerScanRequired) && containerScanRequired == 'Y') {
                                                   isCartonScanRequired = "true";
                                               }
                                            if (isScannedItem == true) {
												pickqtyValidate.navigateToLotScreen = true;
                                                pickqtyValidate.isCartonScanRequired = isCartonScanRequired;
												pickqtyValidate.scannedInvNumbersText = utility.isValueValid(pickqtyValidate.itemName) ? pickqtyValidate.itemName : pickqtyValidate.barcodeItemname;//this o/p param is to display item name in new screen//WMSLITE-15631
											} else {
												pickqtyValidate.navigateLotSerialItemScreen = true;
                                                pickqtyValidate.isCartonScanRequired = isCartonScanRequired;
												pickqtyValidate.scannedInvNumbersText = tallyscanitem;//this o/p param is to display lot/serial in new screen//WMSLITE-15631
											}
											pickqtyValidate.invNumbersResult = invNumbersResult;
											pickqtyValidate.enterqty = enterQty;
											pickqtyValidate.pickStatusInternalId = pickStatusInternalId;
											pickqtyValidate.qtyUomSelection = qtyUomSelection;
											pickqtyValidate.tallyScanBarCodeQty = tallyScanBarCodeQty;
											pickqtyValidate.barcodeQuantity = barcodeQuantity;
											pickqtyValidate.remainingPickTaskQuantity = lineItemRemainingQuantity;
											pickqtyValidate.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
											pickqtyValidate.scannedQuantityInEach = scannedQuantityInEach;
											pickqtyValidate.tallyLoopObj = tallyLoopObj;
											pickqtyValidate.inventoryNumberId = inventoryNumberId;//it is from input param

										} else if (invNumbersResult.length == 1) {
											pickqtyValidate.itemValidate = 'T';
											lotName = invNumbersResult[0].inventorynumberText;

										} else {
											if (isValid == 'T')
											{
												pickqtyValidate.itemValidate = 'F';
											}

										}
									} else {
										pickqtyValidate.itemValidate = 'F';
									}

								} else {
									if ((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') ||
										(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

										//this block executes from new item list screen

										itemValidateObj.tallyScanItem = scannedItemText;
										itemValidateObj.warehouseLocationId = warehouseLocationId;
										itemValidateObj.unitType = unitType;
										itemValidateObj.transactionUomName = transactionUomName;
										itemValidateObj.transactionuomId = transactionuomValue;
										itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
										itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
										itemValidateObj.qtyUomSelected = qtyUomSelection;
										itemValidateObj.qtyValidateObj = pickqtyValidate;
										pickqtyValidate.transactionUomConversionRate = transactionUomConversionRate;
										pickqtyValidate.lotShown = false;
										pickqtyValidate.tallyLoopObj = tallyLoopObj;
										pickqtyValidate.enterqty = enterQty;

										if (isLotScan == 'isLotScan') {
											//this will execute from lot list new screen
											lotName = scannedItemText;
											lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, pickItemId);

											if (lotInternalId == null || lotInternalId == '') {
												pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
												pickqtyValidate.isValid = false;
												isValid = 'F';
											}
										} else {
											//this will execute from itemlist new screen
											pickqtyValidate = tallyScanUtility.validateItemTallyScan(itemValidateObj);

											if (utility.isValueValid(pickqtyValidate.errorMessage)) {
												pickqtyValidate.itemValidate = 'F';
											} else {

												if (pickqtyValidate.itemInternalId != pickItemId) {
													pickqtyValidate.itemValidate = 'F';
												} else {
													lotName = scannedInvNumbersText;
												}
											}
										}
									} else {
										pickqtyValidate = tallyScanUtility.validateItemForTallyScan(tallyscanitem, pickItemId, unitType, warehouseLocationId, pickqtyValidate, transactionUomName, qtyUomSelectedArr, transactionuomValue, barcodeQuantity[0].unit, tallyScanBarCodeQty);
									}

								}


								uomConvRateofBarCode = pickqtyValidate.uomConvRateofBarCode;
								qtyUomSelected = pickqtyValidate.qtyUomSelectedFlag;
								itemDetails = pickqtyValidate;
								if(pickqtyValidate.uomModified == "T")
								{
									uomModified = pickqtyValidate.uomModified;
								}
								else
								{
									itemValidate = pickqtyValidate.itemValidate;
								}

							}
							pickqtyValidate.isSamePageNavigationRequired = 'F';
							pickqtyValidate.transactionuomValue = transactionuomValue;
							pickqtyValidate.uomConvRateofBarCode = uomConvRateofBarCode;
							pickqtyValidate.scannedQuantityInEach = scannedQuantityInEach;
							pickqtyValidate.partialSerQtySubmitted = 'F';
							pickqtyValidate.recommendedBinNum = recommendedbin;
							pickqtyValidate.recommendedBinId = recommendedBinId;
							pickqtyValidate.recommendedBinZoneId = recommendedBinZoneId;
							pickqtyValidate.recommendedBinZoneName = recommendedBinZoneName;
							pickqtyValidate.recommendedBinQty = recommendedBinQty;

							if (utility.isValueValid(itemType)
								&& ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
									&& (!utility.isValueValid(lotName)) && tallyScanAction != 'tallyScanAction')) {
								if(itemValidate =='F')
								{
									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_ITEM");
								}
								else {
									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
								}
								pickqtyValidate.isValid = false;
								isValid = 'F';
							} else {
								if (utility.isValueValid(inventoryDetailLotOrSerial) && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
									(inventoryDetailLotOrSerial != lotName)) {
									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_INVENTDETAILS_VALIDLOT");
									pickqtyValidate.isValid = false;
								} else {
									log.debug('enterQty', enterQty);
									log.debug('lineItemRemainingQuantity', lineItemRemainingQuantity);
									log.debug('pickQty', pickQty);

                                    if (!(utility.isValueValid(itemType)
                                        && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
                                        && utility.isValueValid(lotName)) && (parseFloat(enterQty) > parseFloat(lineItemRemainingQuantity))) {
										pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.REMQTY");
										pickqtyValidate.isValid = false;
										isValid = 'F';
									} else if (!(utility.isValueValid(itemType)
                                        && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
                                        && utility.isValueValid(lotName)) && (!utility.isValueValid(enterQty) || enterQty <= 0)) {
										pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
										pickqtyValidate.isValid = false;
									} else if (itemValidate == 'F') {
										pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
										pickqtyValidate.isValid = false;
									} else if (uomModified == 'T') {
										pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
										pickqtyValidate.isValid = false;
									} else {
                                        if (utility.isValueValid(enterQty) && enterQty > 0) {
                                            var enteredQtyInUom = Number(bigJS(enterQty).mul(transactionUomConversionRate));
                                            if (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == false) {
                                                enteredQtyInUom = enterQty;
                                            }
                                        }

										if (utility.isValueValid(enterQty) && enterQty > 0 && parseFloat(enteredQtyInUom) > parseFloat(pickQty) && isTallyScanRequired != true) {

											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
											pickqtyValidate.isValid = false;
											isValid = 'F';
										} else {
											var isLotvalidation = false;

											if (utility.isValueValid(itemType)
												&& (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
												&& utility.isValueValid(lotName)) {
												lotValidateDetails.invStatusFeature = isInvStatusFeature;
												lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, pickItemId);
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
                                                                    if (utility.isValueValid(qtyUomSelection[0])) {
                                                                        qtyUomSelection[0].unitname = barcodeUom[i]['uom.unitname'];
                                                                        qtyUomSelection[0].pluralname = barcodeUom[i]['uom.pluralname'];
                                                                        qtyUomSelection[0].baseunit = barcodeUom[i]['uom.baseunit'];
                                                                        qtyUomSelection[0].conversionrate = barcodeUom[i]['uom.conversionrate'];
                                                                        qtyUomSelection[0].unit = barcodeUom[i]['uom.internalid'];
                                                                        qtyUomSelection[0].abbreviation = barcodeUom[i]['uom.abbreviation'];
                                                                        qtyUomSelection[0].pluralabbreviation = barcodeUom[i]['uom.pluralabbreviation'];
                                                                        qtyUomSelection[0].value = enterQty;
                                                                    }
                                                                    break;
                                                                }
                                                            }
                                                            if(utility.isValueValid(qtyUomSelection[0].conversionrate)) {
                                                                enterQty = utility.uomConversions(enterQty, transactionUomConversionRate, qtyUomSelection[0].conversionrate);
                                                                stockQuantity = utility.uomConversions(enterQty, stockUomConversionRate, qtyUomSelection[0].conversionrate);
                                                            }
                                                        }
                                                    }
                                                    if ((utility.isValueValid(currItem.isbarcodescanned) && utility.isValueValid(currItem.barcodeQuantity)) && utility.isValueValid(quantityInStock) && utility.isValueValid(transactionUomName)) {
                                                        quantityInStock = Number(bigJS(quantityInStock).minus(stockQuantity));
                                                        pickqtyValidate.quantityInStock = quantityInStock;
                                                        pickqtyValidate.quantityInStockwithUOM = quantityInStock + ' ' + stockunitText;
                                                    }
                                                    if (parseFloat(enterQty) > parseFloat(lineItemRemainingQuantity)) {
                                                        pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.REMQTY");
                                                        pickqtyValidate.isValid = false;
                                                        isValid = 'F';
                                                    } else if (!utility.isValueValid(enterQty) || enterQty <= 0) {
                                                        pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
                                                        pickqtyValidate.isValid = false;
                                                        isValid = 'F';
                                                    } else {
                                                        var enteredQtyInUom = Number(bigJS(enterQty).mul(transactionUomConversionRate));
                                                        if (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == false) {
                                                            enteredQtyInUom = enterQty;
                                                        }
                                                        if (parseFloat(enteredQtyInUom) > parseFloat(pickQty) && isTallyScanRequired != true) {
                                                            pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
                                                            pickqtyValidate.isValid = false;
                                                            isValid = 'F';
                                                        }
                                                    }
													if ((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId)) ||
														utility.isValueValid(currItem.barcodeIteminternalid)) {
														var barCodeItemInternalidNumber = "";
														if (utility.isValueValid(currItem.itemInternalId)) {
															barCodeItemInternalidNumber = currItem.itemInternalId;
														} else if (utility.isValueValid(currItem.barcodeIteminternalid)) {
															barCodeItemInternalidNumber = currItem.barcodeIteminternalid;
														}
														if ((pickItemId == barCodeItemInternalidNumber) &&
															utility.isValueValid(currItem.barcodeLotname)) {
															lotName = currItem.barcodeLotname;
															lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, pickItemId);
															pickqtyValidate.lotName = lotName;
															pickqtyValidate.lotInternalId =lotInternalId;
														}
														if (!utility.isValueValid(lotInternalId)) {
															pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
															pickqtyValidate.isValid = false;
															isValid = 'F';
														}
													}
													else{
														pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
														pickqtyValidate.isValid = false;
														isValid = 'F';
													}
												} else {
                                                    if (parseFloat(enterQty) > parseFloat(lineItemRemainingQuantity)) {
                                                        pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.REMQTY");
                                                        pickqtyValidate.isValid = false;
                                                        isValid = 'F';
                                                    } else if (!utility.isValueValid(enterQty) || enterQty <= 0) {
                                                        pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
                                                        pickqtyValidate.isValid = false;
                                                        isValid = 'F';
                                                    } else {
                                                        var enteredQtyInUom = Number(bigJS(enterQty).mul(transactionUomConversionRate));
                                                        if (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == false) {
                                                            enteredQtyInUom = enterQty;
                                                        }
                                                        if (parseFloat(enteredQtyInUom) > parseFloat(pickQty) && isTallyScanRequired != true) {
                                                            pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
                                                            pickqtyValidate.isValid = false;
                                                            isValid = 'F';
                                                        }
                                                    }
													if (isValid == 'T') {
														lotValidateDetails.warehouseLocationId = warehouseLocationId;
														lotValidateDetails.itemInternalId = pickItemId;
														lotValidateDetails.fromBinInternalId = pickBinId;
														lotValidateDetails.orderType = orderType;
														lotValidateDetails.lotInternalId = lotInternalId;
														log.debug('lotValidateDetails',lotValidateDetails);
														lotValidateDetails = obUtility.getPickingLotDetails(lotValidateDetails);
														log.debug('lotValidateDetails',lotValidateDetails);
														if (lotValidateDetails.length > 0) {
															var inventoryNumber = lotValidateDetails[0].inventorynumberText;
															log.debug('inventoryNumber',inventoryNumber);
															log.debug('lotName',lotName);
															if (inventoryNumber == lotName) {
																isLotvalidation = true;
																pickqtyValidate.lotName = lotName;
																pickqtyValidate.lotInternalId = lotValidateDetails[0].inventorynumber;
																if (isTallyScanRequired) {
																	tallyscanQty = 1;
																	var lotItemUomModified ="F";
																	if (!utility.isValueValid(pickqtyValidate.isbarcodescanned)) {
																		itemValidateObj.barcodeQuantity = barcodeQuantity;
																		if (utility.isValueValid(barcodeQuantity[0].unit)) {
																			var itemDetailsObj = tallyScanUtility.getUOMToBeConsideredObj(itemValidateObj);
																			lotItemUomModified = itemDetailsObj.uomModified;
																			pickqtyValidate.qtyUOMObj = itemDetailsObj.qtyUOMObj;
																			pickqtyValidate.transactionUomConversionRate = transactionUomConversionRate;
																		}
																	}
																	if( lotItemUomModified == "T") {
																		pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
																		pickqtyValidate.isValid = false;
																		isValid = 'F';
																	}
																	else
																	{
																		barcodeQuantity = tallyScanUtility.getQtyObjectToBePopulated(enterQty, pickqtyValidate.qtyUOMObj, transactionUomConversionRate);
																		pickqtyValidate.barcodeQuantity = barcodeQuantity;
																		pickqtyValidate.tallyScanOrderQty = tallyScanBarCodeQty;

																		pickqtyValidate = tallyScanUtility.getCalculatedTallyScanQty(pickqtyValidate);
																		pickqtyValidate.tallyScanBarCodeQty = pickqtyValidate.tallyScanOrderQty;
																		tallyScanBarCodeQty = pickqtyValidate.tallyScanOrderQty;
																		tallyLoopObj = tallyScanUtility.createOrUpdateLotJSONObject(tallyLoopObj, lotName, pickqtyValidate.tallyscanQty, pickStatusInternalId);
																		//pickqtyValidate.tallyLoopObj = JSON.stringify(tallyLoopObj);
																		pickqtyValidate.tallyLoopObj = tallyLoopObj;
																	}

																}
																if (!utility.isValueValid(lotString)) {
																	pickqtyValidate.lotString = lotName;
																} else {
																	pickqtyValidate.lotString = lotString + "," + lotName;
																}
															} else {
																pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
																pickqtyValidate.isValid = false;
																isValid = 'F';
															}
														} else {
															pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
															pickqtyValidate.isValid = false;
															isValid = 'F';
														}
													}
												}
											}

											if (isValid == 'T') {
												var serailQty = enterQty;
												serailQty = Number(bigJS(serailQty).mul(transactionUomConversionRate));
												if (serailQty.toString().indexOf('.') != -1 && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
													pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_.SERIALITEM_DECIMALS_NOTALLOWED');
													pickqtyValidate.isValid = false;
												} else {
													var availableQuantityArr = [];
													if (itemType != "noninventoryitem") {
														availableQuantityArr = obUtility.getstatusDetailsForValidation(warehouseLocationId, pickItemId, pickBinId, lotInternalId, pickStatusInternalId);
														log.debug('availableQuantityArr',availableQuantityArr);
													}
													if (availableQuantityArr.length > 0 || itemType == "noninventoryitem") {
														var availableQty = 0;
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
																if(isTallyScanRequired == true &&
																	(itemType!= 'serializedinventoryitem' && itemType != 'serializedassemblyitem')){
																	var totalQty =0;
																	if(tallyLoopObj != undefined){
																		log.debug('tallyLoopObj',tallyLoopObj);
																		for(var obj in tallyLoopObj) {
																			var tqty = tallyLoopObj[obj].quantity;
																			if (utility.isValueValid(itemType)
																				&& (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
																			) {
																				if(utility.isValueValid(lotName)){
																					if (isInvStatusFeature) {
																						var statusId = tallyLoopObj[obj].statusName;
																						var tlotName = tallyLoopObj[obj].lotName;
																						if (tlotName == lotName && statusId == availableQuantityArr[j].status) {
																							totalQty = totalQty + tqty;
																						}
																					} else {
																						var tlotName = tallyLoopObj[obj].lotName;
																						if (tlotName == lotName) {
																							totalQty = totalQty + tqty;
																						}
																					}
																					if(totalQty > 0){
																						totalQty = totalQty - 1;
																						availableQty = Number(bigJS(availableQty).minus(totalQty));
																					}
																				}

																			} else {
																				if (isInvStatusFeature) {
																					var statusId = tallyLoopObj[obj].statusName;
																					if (statusId == availableQuantityArr[j].status) {
																						totalQty = totalQty + tqty;
																					}
																				} else {
																					totalQty = totalQty + tqty;
																				}
																				if(totalQty > 0){
																					availableQty = Number(bigJS(availableQty).minus(totalQty));
																				}
																			}

																		}
																	}

																}

																if (parseFloat(availableQty) > parseFloat(enterQty)) {
																	break;
																}

															}
														}
														if(parseFloat(requireQuantity) > parseFloat(availableQty) && itemType != "noninventoryitem" && isTallyScanRequired == true){
															pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.AVAILABLE_QTY");
															pickqtyValidate.isValid = false;
														}
														else if(parseFloat(enterQty) > parseFloat(availableQty) && itemType != "noninventoryitem"  && !isTallyScanRequired) {
															pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.AVAILABLE_QTY");
															pickqtyValidate.isValid = false;
														} else {
															systemRule = "Use cartons for single-order picking?";
															isContainerScanRequired = "N";
															if (itemType != "noninventoryitem") {

																//isContainerScanRequired = utility.getSystemRuleValue(systemRule, warehouseLocationId);
																log.debug('tranType in sop carton picking qty validate22',tranType);
																//systemRule = "Use cartons for single-order picking?";
																isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,tranType);

															}
															if (!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N') {
																isContainerScanRequired = 'false';
															} else {
																isContainerScanRequired = 'true';
															}
															var remainingQty = 0;
															if (!isTallyScanRequired) {
																if (utility.isValueValid(barcodeQuantity) && (utility.isValueValid(barcodeQuantity[0].unit))) {
																	var itemAliasUnit = [{'unit': barcodeQuantity[0].unit}];
																	pickqtyValidate.barcodeQuantity = itemAliasUnit;
																}
															}

															if (!isTallyScanRequired && (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')) {
																pickqtyValidate.numberOfTimesSerialScanned = 0;
																pickqtyValidate.scannedQuantityInEach = serailQty;
																pickqtyValidate.totalLinepickqty = totalLinepickqty;
																pickqtyValidate.remainingQuantityWithUOM = '';
																pickqtyValidate.lotQtyString = '';
																pickqtyValidate.isValid = true;
																remainingQty = Number(bigJS(pickQty).minus(totalLinepickqty));
																if(remainingQty > 0){
																	var remainingPickTaskQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
																	pickqtyValidate.remainingPickTaskQuantity = remainingPickTaskQty;
																	pickqtyValidate.remainingQuantityWithUOM = remainingPickTaskQty + " "+transactionUomName;
																}else{
																	remainingPickTaskQty = 0;
																	pickqtyValidate.remainingPickTaskQuantity = remainingPickTaskQty;
																	pickqtyValidate.remainingQuantityWithUOM = remainingPickTaskQty ;
																}

															}
															else
															{
																if (isTallyScanRequired) {
																	pickqtyValidate.isCartonScanRequired = isContainerScanRequired;
																	if ((itemType == "inventoryitem" || itemType == "assemblyitem") || itemType == 'noninventoryitem') {
																		tallyscanQty = 1;
																		barcodeQty = 0;
																		var barcodeConverRateObj = {};
																		var selectedUOM = {};
																		barcodeConverRateObj.transactionuomValue = transactionuomValue;
																		barcodeConverRateObj.uomValue = uomValue;

																		barcodeQuantity = tallyScanUtility.buildBarcodeObjwithconvertRate(barcodeConverRateObj, itemDetails, barcodeQuantity);


																		if (utility.isValueValid(barcodeQuantity)) {

																			if (utility.isValueValid(barcodeQuantity[0].unit) && (transactionuomValue == barcodeQuantity[0].unit)) {

																				if (qtyUomSelectedArr[0].unit != barcodeQuantity[0].unit && tallyScanBarCodeQty == 0) {
																					if (qtyUomSelected) {
																						selectedUOM = tallyScanUtility.fetchSelectedUOM(pickItemId, qtyUomSelectedArr[0].unit);
																					} else {
																						selectedUOM = tallyScanUtility.fetchSelectedUOM(pickItemId, barcodeQuantity[0].unit);
																					}
																					pickqtyValidate.uominternalId = selectedUOM.uominternalId;
																					pickqtyValidate.uomid = selectedUOM.uomid;


																				}
																			}
																			if (utility.isValueValid(barcodeQuantity[0].unit) && transactionuomValue != barcodeQuantity[0].unit) {
																				var convertedValue = Number(bigJS(uomConvRateofBarCode).div(transactionUomConversionRate));
																				tallyscanQty = Number(bigJS(tallyscanQty).mul(convertedValue));
																				tallyScanBarCodeQty = Number(bigJS(tallyScanBarCodeQty).plus(tallyscanQty));
																				pickqtyValidate.tallyScanBarCodeQty = tallyScanBarCodeQty;
																				enterQty = tallyScanBarCodeQty;//this is added becuase if we transaction uom is 2 case and if we are scannng item alias with  1 pallet then since from above enterQty field is fetching only ony 1 not 2 as transaction uom to submit in piack task

																			} else {
																				tallyScanBarCodeQty = Number(bigJS(tallyScanBarCodeQty).plus(tallyscanQty));
																				pickqtyValidate.tallyScanBarCodeQty = tallyScanBarCodeQty;
																			}
																		}
																		pickqtyValidate.barcodeQuantity = barcodeQuantity;
																		pickqtyValidate.transactionuomValue = transactionuomValue;
																		barcodeLotname = 'true';

																		tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanJSONObject(tallyLoopObj, '', '', tallyscanQty, pickStatusInternalId);
																		//pickqtyValidate.tallyLoopObj = JSON.stringify(tallyLoopObj);
																		pickqtyValidate.tallyLoopObj = tallyLoopObj;


																	} else {
																		if ((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')) {
																			var tallyScannedQty = 1;
																			var tallySerialqty = 0;
																			if (utility.isValueValid(barcodeQuantity)) {
																				uomValue = barcodeQuantity[0].unit;
																				tallySerialqty = barcodeQuantity[0].value;

																				tallyScanBarCodeQty = barcodeQuantity[0].value;
																				pickqtyValidate.tallyScanBarCodeQty = barcodeQuantity[0].value;
																				barcodeQty = Number(bigJS(tallySerialqty).plus(tallyScannedQty));
																			}

																			pickqtyValidate.numberOfTimesSerialScanned = tallySerialqty;
																			pickqtyValidate.scannedQuantityInEach = scannedQuantityInEach;

																			barcodeQuantity = [{
																				'value': barcodeQty,
																				'unit': uomValue
																			}];

																			if (parseFloat(tallyScanBarCodeQty) > parseFloat(pickQty)) {
																				pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
																				pickqtyValidate.isValid = false;
																				isValid = 'F';
																			} else {

																				var serialObj = {};
																				if (utility.isValueValid(scannedInvNumbersText)) {
																					tallyscanitem = scannedInvNumbersText;
																				}
																				itemValidateObj.tallyScanSerial = tallyscanitem;
																				itemValidateObj.scannedSerialInternalId = scannedSerialInternalId;

																				if (parseFloat(tallyScanBarCodeQty) <= parseFloat(lineItemRemainingQuantity)) {
																					log.debug('serial loop', '');
																					pickqtyValidate.barcodeQuantity = barcodeQuantity;
																					pickqtyValidate.tallyScanBarCodeQty = tallyScanBarCodeQty;
																					pickqtyValidate.enterqty = enterQty;//this to submit serial item from binempty

																					serialObj = tallyScanUtility.getExitingSerialORCreate(itemValidateObj);
																				}

																			}
																		}
																	}
																}

																log.debug('tallyScanBarCodeQty', tallyScanBarCodeQty);
																log.debug('lineItemRemainingQuantity', lineItemRemainingQuantity);
																var picktaskId = '';
																if (parseFloat(tallyScanBarCodeQty) > parseFloat(lineItemRemainingQuantity) && isTallyScanRequired == true) {//validation
																	pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
																	pickqtyValidate.isValid = false;
																	isValid = 'F';
																} else if (parseFloat(lineItemRemainingQuantity) > parseFloat(tallyScanBarCodeQty) && isTallyScanRequired == true) {//redirect to qty with above builded tallyloopobj array

																	pickqtyValidate.isSamePageNavigationRequired = 'T';
																	remainingQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));

																} else {//submission
																	log.debug('into serial submission for carton picking',isContainerScanRequired);
																	pickqtyValidate.isContainerScanRequired = isContainerScanRequired;
																	if (isContainerScanRequired == 'true') {

																		pickqtyValidate.isValid = true;
																		pickqtyValidate.enterqty = enterQty;
																	}
																	else {
																		//posting of inv /lot items
																		var tallyqtyarr = [];
																		var lotArray = [];
																		var statusArray = [];


																		var picktaskObj = {};

																		picktaskObj.picktaskid = pickTaskId;
																		picktaskObj.whLocation = warehouseLocationId;
																		picktaskObj.itemId = pickItemId;
																		picktaskObj.fromBinId = pickBinId;
																		picktaskObj.enterqty = enterQty;
																		picktaskObj.itemType = itemType;
																		//picktaskObj.totalLinepickqty = totalLinepickqty;
																		picktaskObj.locUseBinsFlag = locUseBinsFlag;
																		picktaskObj.isTallyScanRequired = isTallyScanRequired;

																		if (isTallyScanRequired) {

																			if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') || (itemType == "inventoryitem" || itemType == "assemblyitem")) {


																				for (var tallyLoopObjIndex in tallyLoopObj) {
																					if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
																						lotArray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
																						tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
																						statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
																					} else if (statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
																						tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
																						statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
																					}
																				}

																				picktaskObj.pickqty = tallyqtyarr;
																				picktaskObj.batchno = lotArray;
																				if (isInvStatusFeature) {
																					picktaskObj.frominvtstatus = statusArray;
																					picktaskObj.statusInternalId = statusArray;

																				}

																			}
																		} else {
																			picktaskObj.batchno = lotName;
																			picktaskObj.pickqty = pickQty;
																			if (isInvStatusFeature) {

																				picktaskObj.frominvtstatus = pickStatusInternalId;
																				picktaskObj.statusInternalId = pickStatusInternalId;
																			}
																		}
																		log.debug('final picktaskObj', picktaskObj);
																		picktaskId = obUtility.picktaskupdate(picktaskObj);
																		pickqtyValidate.showNavButtons = true;
																		remainingQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
																		if (transactionType == 'TrnfrOrd') {
																			impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId, '', transactionInternalId, transactionLineId, 1);
																		} else {
																			impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId, transactionInternalId, '', transactionLineId, 1);
																		}
																		pickqtyValidate.impactedRecords = impactedRecords;
																	}
																}

																remainingQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
																log.debug({title: 'remainingQty', details: remainingQty});
																if (remainingQty > 0) {
																	remainingQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
																	if (isTallyScanRequired) {
																		pickqtyValidate.tallyScanRemainingQuantity = Number(bigJS(lineItemRemainingQuantity).minus(pickqtyValidate.tallyScanBarCodeQty));
																		pickqtyValidate.lotShown = false;
																		pickqtyValidate.barcodeLotname = '';
																		pickqtyValidate.lotName = '';

																	} else {
																		if (utility.isValueValid(barcodeQuantity) && (utility.isValueValid(barcodeQuantity[0].unit))) {
																			var itemAliasUnit = [{'unit': barcodeQuantity[0].unit}];
																			pickqtyValidate.barcodeQuantity = itemAliasUnit;
																		}
																	}

																	if (remainingQty == 0) {
																		pickqtyValidate.remainingQuantityWithUOM = '0';
																	} else {
																		pickqtyValidate.remainingQuantityWithUOM = remainingQty + " " + transactionUomName;
																	}
																	pickqtyValidate.qtyRemaining = remainingQty;
																	var remainingPickTaskQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
																	if (isTallyScanRequired == true) {
																		pickqtyValidate.remainingPickTaskQuantity = lineItemRemainingQuantity;
																	} else {
																		pickqtyValidate.remainingPickTaskQuantity = remainingPickTaskQty;
																	}
																	log.debug('remainingPickTaskQty', remainingPickTaskQty);
																	if (parseFloat(remainingPickTaskQty) > 0) {
																		pickqtyValidate.isSamePageNavigationRequired = 'T';
																		if (utility.isValueValid(recommendedBinId) && (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == true)
																			&&  (itemType != "noninventoryitem") && isTallyScanRequired != true
																			&& (isContainerScanRequired == 'false' ||  isContainerScanRequired == false)) {

																			var objBinDetails = [];
																			var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
																			log.debug('inventoryStatusFeature', inventoryStatusFeature);

																			//	if (inventoryStatusFeature) {
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


																			objBinDetails = obUtility.getItemsInventoryDetailswithInvStatusEnable(searchName, pickItemId, pickBinId, warehouseLocationId,itemType);
																			//}
																			/*else {
                                                                                if (itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                                                                    objBinDetails = obUtility.getItemWiseInventoryDetails(pickItemId, warehouseLocationId, pickBinId);
                                                                                } else {
                                                                                    objBinDetails = obUtility.getItemWiseLotsDetails(pickItemId, warehouseLocationId, pickBinId);

                                                                                }
                                                                            }*/
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
																					}
																					else{
																						pickqtyValidate.isSamePageNavigationRequired = 'F';
																						pickqtyValidate.isPickTaskListNavigationRequired = 'T';
																					}
																				}
																				else{
																					pickqtyValidate.isSamePageNavigationRequired = 'F';
																					pickqtyValidate.isPickTaskListNavigationRequired = 'T';
																				}

																			}
																		}
																	}
																}
																else {
																	var pickTaskDetails = {};
																	pickTaskDetails.orderInternalId = transactionInternalId;
																	pickTaskDetails.whLocationId = warehouseLocationId;
																	pickqtyValidate.isSamePageNavigationRequired = 'F';
																	if (itemType == "noninventoryitem" && locUseBinsFlag != false) {
																		obUtility.updateStageForNonInventoryItem(pickTaskId);
																	}
																	pickTaskDetails.isZonePickingEnabled = isZonePickingEnabled;
																	pickTaskDetails.selectedZones = selectedZones;
																	var objpickTaskDetails = obUtility.getPickTaskDetailsForValidation(pickTaskDetails);

																	if (objpickTaskDetails.length > 0) {
																		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
																			var recLength = 0;
																			var pickTasksLength = objpickTaskDetails.length;
																			var currentUserId = runtime.getCurrentUser().id;
																			for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
																				var zone = objpickTaskDetails[pickTaskList].zone;
																				var picker = objpickTaskDetails[pickTaskList].picker;
																				if(!utility.isValueValid(zone)){
																					zone = "0";
																				}else{
																					zone = parseInt(zone);
																				}
																				if((selectedZones.indexOf(zone) != -1 ) || (picker == currentUserId)){
																					recLength = recLength +1;
																				}
																			}
																			pickqtyValidate.nextPickTaskCount = recLength;
																		}
																		else{
																			pickqtyValidate.nextPickTaskCount = objpickTaskDetails.length;
																		}
																	} else {
																		pickqtyValidate.nextPickTaskCount = 0;
																	}
																	pickqtyValidate.remainingQuantityWithUOM = remainingQty;
																	if (pickqtyValidate.remainingQuantityWithUOM == 0) {
																		pickqtyValidate.remainingQuantityWithUOM = '0 ';
																	}
																	pickqtyValidate.qtyRemaining = remainingQty;
																	if (isContainerScanRequired == 'true') {
																		pickqtyValidate.remainingQuantityWithUOM = Number(bigJS(lineItemRemainingQuantity).minus(enterQty)) + ' ' + transactionUomName;
																	}
																	if (locUseBinsFlag == true) {
																		var objPickedPickTaskDetails = obUtility.getPickTaskStageflag('singleOrder', '', transactionInternalId, warehouseLocationId);
																		if (objPickedPickTaskDetails.length > 0) {
																			pickqtyValidate.showStageButton = 'Y';
																			if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
																				pickqtyValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',transactionInternalId,warehouseLocationId);
																				if(pickqtyValidate.boolAnyItemIsAlreadyStaged == 'Y'){
																					pickqtyValidate.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
																				}
																				else{
																					pickqtyValidate.starDescription = '';
																				}

																			}
																		} else {
																			var picktaskstageflagDtlforalreadystaged = obUtility.getSOPickTaskStageflagforAlreadystaged(warehouseLocationId, transactionInternalId);
																			if (utility.isValueValid(picktaskstageflagDtlforalreadystaged)
																				&& picktaskstageflagDtlforalreadystaged.length > 0) {
																				pickqtyValidate.showStageButton = 'Y';
																				if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
																					pickqtyValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('','',transactionInternalId,warehouseLocationId);
																					if(pickqtyValidate.boolAnyItemIsAlreadyStaged == 'Y'){
																						pickqtyValidate.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
																					}
																					else{
																						pickqtyValidate.starDescription = '';
																					}

																				}
																			} else {
																				pickqtyValidate.showStageButton = 'N';
																			}
																		}
																	}
																}
																if (isTallyScanRequired == true) {
																	if (!utility.isValueValid(lotQtyString)) {
																		pickqtyValidate.lotQtyString = enterQty + " " + transactionUomName;
																	} else {
																		pickqtyValidate.lotQtyString = lotQtyString + "," + enterQty + " " + transactionUomName;
																	}
																} else {
																	if (!utility.isValueValid(lotQtyString)) {
																		pickqtyValidate.lotQtyString = enterQty + " " + transactionUomName;
																	} else {
																		pickqtyValidate.lotQtyString = lotQtyString + "," + enterQty + " " + transactionUomName;
																	}
																}
																if (!utility.isValueValid(lotQtyStatusString)) {
																	pickqtyValidate.lotQtyStatusString = statusText;
																} else {
																	pickqtyValidate.lotQtyStatusString = lotQtyStatusString + "," + statusText;
																}
																pickqtyValidate.picktaskId = picktaskId;
																if (isValid == 'T') {
																	pickqtyValidate.isValid = true;
																}
															}
														}
													} else {
														pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
														pickqtyValidate.isValid = false;
													}
												}
											}
										}
									}
								}
							}
						} else {
							pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
							pickqtyValidate.isValid = false;
						}

					}
				} else {
					pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
					pickqtyValidate.isValid = false;
				}
			} catch	(e) {
				pickqtyValidate.isValid = false;
				pickqtyValidate.errorMessage = e.message;
				log.error({title: 'errorMessage', details: e.message + " Stack :" + e.stack});
			}

			log.debug({title: 'final response log', details: pickqtyValidate});
			return pickqtyValidate;
		}


		return {
			'post': doPost
		};
	});
