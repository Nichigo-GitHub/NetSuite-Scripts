/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/record', './wms_utility', './big', './wms_translator', './wms_kpvn_tallyScan_utility', './wms_outBoundUtility', './wms_inventory_utility.js'],
    /**
     * @param {search} search
     */
    function (search, record, utility, Big, translator, tallyScanUtility, obUtility, invUtility) {


        function doPost(requestBody) {

            var qtyValidate = {};
            var scannedQuantity = '';
            var availbleQuanity = '';
            var itemType = '';
            var transactionUomConversionRate = '';
            var fromStatusInternalId = '';
            var itemInternalId = '';
            var warehouseLocationId = '';
            var binInternalId = '';
            var lotName = '';
            var lotInternalId = '';
            var unitType = '';
            var stockUnitName = '';
            var debugString = '';
            var fromStatusName = '';
            var locUseBinsFlag = '';
            var tallyScanItem = '';
            var barcodeQuantity = '';
            var stockconversionRate = '';
            var isTallyScanRequired = '';
            var tallyScanBarCodeQty = '';
            var qtyUOMObj = '';
            var tallyScanOrderQty = '';
            var tallyLoopObj = '';
            var uomSelectionforFirstItr = '';
            var qtyUomSelected = '';
            var tallyscanQty = '';
            var numberOfTimesSerialScanned = 0;
            var scannedQuantityInEach = 0;
            var noStockAction = '';
            var isLotScan = '';
            var expectedQuantity = '';
            var stockUomValue = '';
            var itemName = '';
            var infoScannedQty = 0;
            var uomValue = '';
            var barcodeQty = 0;
            var lotString = "";
            var processType = "";
            try {
                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    scannedQuantity = requestParams.scannedQuantity;
                    availbleQuanity = requestParams.availbleQuanity;
                    itemType = requestParams.itemType;
                    transactionUomConversionRate = requestParams.transactionUomConversionRate;
                    fromStatusInternalId = requestParams.fromStatusInternalId;
                    itemInternalId = requestParams.itemInternalId;
                    warehouseLocationId = requestParams.warehouseLocationId;
                    binInternalId = requestParams.binInternalId;
                    lotName = requestParams.lotName;
                    lotInternalId = requestParams.lotInternalId;
                    unitType = requestParams.unitType;
                    stockUnitName = requestParams.stockUnitName;
                    fromStatusName = requestParams.fromStatusName;
                    var putawayAll = requestParams.putawayAll;
                    locUseBinsFlag = requestParams.locUseBinsFlag;
                    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
                    tallyScanItem = requestParams.tallyScanItem;
                    barcodeQuantity = requestParams.barcodeQuantity;
                    isTallyScanRequired = requestParams.isTallyScanRequired;
                    tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
                    qtyUOMObj = requestParams.qtyUOMObj;
                    tallyScanOrderQty = requestParams.tallyScanBarCodeQty;
                    tallyLoopObj = requestParams.tallyLoopObj;
                    uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
                    qtyUomSelected = requestParams.qtyUomSelection;
                    isLotScan = requestParams.isLotScan;
                    stockUomValue = requestParams.stockUomValue;
                    stockconversionRate = requestParams.transactionUomConversionRate;
                    expectedQuantity = requestParams.expectedquantity;
                    noStockAction = requestParams.noStockAction;
                    scannedQuantityInEach = requestParams.scannedQuantityInEach;
                    numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
                    lotString = requestParams.lotString;
                    log.debug({ title: 'requestParams', details: requestParams });

                    if (putawayAll == 'putawayAll') {
                        qtyValidate.selectedStatusId = 'All';
                        qtyValidate.selectedStatusName = 'All';
                        qtyValidate.putawayAll = putawayAll;
                        qtyValidate.isValid = true;
                    } else if (utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId) &&
                        (utility.isValueValid(binInternalId) || locUseBinsFlag == false)) {

                        tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
                        tallyScanBarCodeQty = utility.isValueValid(tallyScanBarCodeQty) ? tallyScanBarCodeQty : 0;
                        var skipTallyLoop = false;
                        if (!utility.isValueValid(stockconversionRate)) {
                            stockconversionRate = 1;
                        }

                        qtyValidate.isValid = true;
                        qtyValidate.numberOfTimesSerialScanned = 0;
                        if (isTallyScanRequired) {
                            infoScannedQty = scannedQuantity;
                            if ((utility.isValueValid(noStockAction) && noStockAction == 'nostock')) {
                                if ((utility.isValueValid(tallyLoopObj) || (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'))) {

                                    if (((itemType == "inventoryitem" || itemType == "assemblyitem")) || (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {
                                        qtyValidate.tallyLoopObj = tallyLoopObj;
                                        qtyValidate.scannedQuantity = tallyScanBarCodeQty;
                                    }
                                    else {
                                        qtyValidate.scannedQuantity = Number((Big(tallyScanBarCodeQty).mul(stockconversionRate)).toFixed(8));
                                    }
                                    qtyValidate.navigateToSameScreen = false;
                                    qtyValidate.isValid = true;
                                    qtyValidate.isTallyScanRequired = isTallyScanRequired;
                                    qtyValidate.tallyScanBarCodeQty = tallyScanBarCodeQty;
                                    qtyValidate.opentaskQty = tallyScanBarCodeQty;
                                    qtyValidate.selectedStatusName = fromStatusName;
                                    qtyValidate.selectedStatusId = fromStatusInternalId;
                                    qtyValidate.fromStatusName = fromStatusName;
                                    qtyValidate.noStockAction = noStockAction;
                                    if (utility.isValueValid(stockUnitName)) {
                                        qtyValidate.scannedQuantityWithUOM = qtyValidate.scannedQuantity + " " + stockUnitName;
                                    } else {
                                        qtyValidate.scannedQuantityWithUOM = qtyValidate.scannedQuantity;
                                    }
                                }
                            } else {
                                if (utility.isValueValid(tallyScanItem)) {
                                    var isScannedItemOrLotSerial = false;
                                    var itemDetailsObj = {};
                                    itemDetailsObj.tallyScanItem = tallyScanItem;
                                    itemDetailsObj.warehouseLocationId = warehouseLocationId;
                                    itemDetailsObj.unitType = unitType;
                                    itemDetailsObj.transactionUomName = stockUnitName;
                                    itemDetailsObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
                                    itemDetailsObj.qtyUomSelected = qtyUomSelected;
                                    itemDetailsObj.transactionuomId = stockUomValue;
                                    itemDetailsObj.barcodeQuantity = barcodeQuantity;
                                    qtyValidate.scannedStatusId = fromStatusInternalId;

                                    if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                        itemDetailsObj.tallyScanSerial = tallyScanItem;
                                        itemDetailsObj.pickTaskId = tallyScanItem;
                                        itemDetailsObj.pickBinId = binInternalId;
                                        itemDetailsObj.binInternalid = binInternalId;
                                        itemDetailsObj.pickItemId = itemInternalId;
                                        itemDetailsObj.InvStatusInternalId = fromStatusInternalId;
                                        itemDetailsObj.taskType = 9;

                                        var tallyScannedQty = 1;
                                        var tallySerialqty = 0;
                                        if (utility.isValueValid(barcodeQuantity)) {
                                            uomValue = barcodeQuantity[0].unit;
                                            tallySerialqty = barcodeQuantity[0].value;
                                            barcodeQty = Number(Big(tallySerialqty).plus(tallyScannedQty));
                                            infoScannedQty = tallySerialqty;
                                        }
                                        barcodeQuantity = [{
                                            'value': barcodeQty,
                                            'unit': uomValue
                                        }];
                                        itemDetailsObj.uomSelectionforFirstItr = uomValue;
                                        itemDetailsObj.qtyUomSelected = barcodeQuantity;
                                        qtyValidate.uomModified = 'F';
                                        qtyValidate = tallyScanUtility.validateSerialTallyScan(itemDetailsObj);

                                        if (!utility.isValueValid(qtyValidate.errorMessage)) {
                                            if (qtyValidate.navigateToLotItemsListScreen == 'T' && !utility.isValueValid(qtyValidate.pickItemId)) {
                                                qtyValidate.navigateToItemSelection = true;
                                                skipTallyLoop = true;
                                                qtyValidate.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
                                                qtyValidate.lotName = qtyValidate.tallyScanSerial;
                                            }
                                            isScannedItemOrLotSerial = true;
                                        }

                                    } else {
                                        var infoLotName = '';
                                        qtyValidate = tallyScanUtility.validateItemTallyScan(itemDetailsObj);
                                        if (utility.isValueValid(qtyValidate.barcodeItemname)) {
                                            itemName = qtyValidate.barcodeItemname;
                                            qtyValidate.tallyScanitemId = qtyValidate.barcodeIteminternalid;
                                            isScannedItemOrLotSerial = true;
                                        } else if (qtyValidate.itemValidate == 'T' && !utility.isValueValid(qtyValidate.errorMessage)) {
                                            itemName = qtyValidate.itemInternalId;
                                            isScannedItemOrLotSerial = true;
                                        }
                                        lotName = qtyValidate.barcodeLotname;
                                        infoLotName = lotName;
                                        if (!utility.isValueValid(lotName) && !utility.isValueValid(qtyValidate.errorMessage) &&
                                            (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

                                            var lotDetails = {};
                                            lotDetails.warehouseLocationId = warehouseLocationId;
                                            lotDetails.itemInternalId = qtyValidate.tallyScanitemId;
                                            lotDetails.fromBinInternalId = binInternalId;
                                            lotDetails.fromInventorystatus = fromStatusInternalId;

                                            var itemLotDetails = obUtility.getPickingLotDetails(lotDetails);
                                            var itemLotDetailsLength = itemLotDetails.length;
                                            log.debug('itemLotDetails', itemLotDetails);
                                            if (itemLotDetailsLength > 0) {
                                                isScannedItemOrLotSerial = true;
                                                lotName = itemLotDetails[0].inventorynumberText;
                                                infoLotName = lotName;
                                                if (itemLotDetailsLength > 1) {
                                                    qtyValidate.isLotScanNavigationRequired = true;
                                                    skipTallyLoop = true;
                                                    infoLotName = '';
                                                }
                                            }

                                            if (!utility.isValueValid(lotString) && utility.isValueValid(infoLotName)) {
                                                qtyValidate.lotString = infoLotName;
                                            } else if (utility.isValueValid(infoLotName) && utility.isValueValid(lotString)) {
                                                qtyValidate.lotString = lotString + "," + infoLotName;
                                            }

                                            log.debug("qtyValidate.lotString", qtyValidate.lotString);
                                        } else if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
                                            utility.isValueValid(qtyValidate.errorMessage) || utility.isValueValid(lotName)) {

                                            if (utility.isValueValid(qtyValidate.barcodeLotname)) {
                                                lotName = qtyValidate.barcodeLotname;
                                            } else {
                                                lotName = tallyScanItem;
                                            }
                                            infoLotName = lotName;
                                            var itemDetails = [];
                                            if (isLotScan == 'isLotScan') {
                                                itemDetails = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, lotName, binInternalId, itemInternalId);
                                            } else {
                                                if (!utility.isValueValid(qtyValidate.barcodeIteminternalid)) {
                                                    itemDetails = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, lotName, binInternalId);
                                                }
                                            }
                                            var itemDetailsLength = itemDetails.length;
                                            if (itemDetailsLength > 0) {
                                                isScannedItemOrLotSerial = true;
                                                if (utility.isValueValid(unitType)) {
                                                    qtyValidate = tallyScanUtility.getUOMToBeConsideredObj(qtyValidate);
                                                }
                                                qtyValidate.errorMessage = '';
                                                var transactionName = '';
                                                if (itemDetails[0].item == itemInternalId) {
                                                    if (itemDetails[0].available > 0 && itemDetails[0].inventorynumberText == lotName) {
                                                        var tallyObjkey = itemDetails[0].inventorynumberText + '_' + transactionName + (inventoryStatusFeature ? '_' + itemDetails[0].status : '');
                                                        if (utility.isValueValid(tallyLoopObj[tallyObjkey]) && utility.isValueValid(tallyLoopObj[tallyObjkey].quantity)) {
                                                            var lotAvailbleQuanity = 0;
                                                            if (utility.isValueValid(itemDetails[0].available) && parseFloat(itemDetails[0].available) > 0) {
                                                                lotAvailbleQuanity = Big(itemDetails[0].available).mul(transactionUomConversionRate);
                                                            }
                                                            if (parseFloat(lotAvailbleQuanity) - parseFloat(tallyLoopObj[tallyObjkey].quantity) <= 0) {
                                                                itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY');
                                                                itemDetailsObj.isValid = false;
                                                            }
                                                        }
                                                    } else {
                                                        itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY');
                                                        itemDetailsObj.isValid = false;
                                                    }
                                                }
                                                lotInternalId = itemDetails[0].inventorynumber;
                                                qtyValidate.isValid = true;

                                                if (!utility.isValueValid(lotString)) {
                                                    qtyValidate.lotString = infoLotName;
                                                } else {
                                                    qtyValidate.lotString = lotString + "," + infoLotName;
                                                }

                                            } else {
                                                if (!utility.isValueValid(itemName)) {
                                                    lotName = '';
                                                    infoLotName = '';
                                                }
                                            }

                                        }
                                        qtyValidate.barcodeLotname = '';
                                        qtyValidate.batch_lot = '';
                                    }

                                    qtyValidate.scannedStatus = fromStatusInternalId;
                                    qtyValidate.tallyScanBarCodeQty = tallyScanBarCodeQty;
                                    qtyValidate.tallyScanOrderQty = tallyScanOrderQty;

                                    if (skipTallyLoop == false) {
                                        qtyValidate.transactionUomConversionRate = stockconversionRate;
                                        qtyValidate = tallyScanUtility.getCalculatedTallyScanQty(qtyValidate);
                                        qtyValidate.tallyScanBarCodeQty = qtyValidate.tallyScanOrderQty;
                                        tallyscanQty = qtyValidate.tallyscanQty;

                                        log.debug('tallyscanQty', tallyscanQty);
                                        if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {

                                            tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanJSONObject(tallyLoopObj, '', lotName, Number(Big(tallyscanQty).mul(stockconversionRate)), fromStatusInternalId);
                                            barcodeQuantity = tallyScanUtility.getQtyObjectToBePopulated(qtyValidate.tallyScanBarCodeQty, qtyValidate.qtyUOMObj, stockconversionRate);
                                        }

                                        qtyValidate.barcodeQuantity = barcodeQuantity;
                                        qtyValidate.tallyScanOrderQty = tallyScanBarCodeQty;
                                        qtyValidate.quantity = qtyValidate.tallyScanBarCodeQty;
                                        qtyValidate.numberOfTimesSerialScanned = qtyValidate.tallyScanBarCodeQty;
                                        qtyValidate.tallyLoopObj = tallyLoopObj;

                                        qtyValidate.remainingTallyQuantity = Number(Big(expectedQuantity).minus(Big(qtyValidate.tallyScanBarCodeQty)));
                                        qtyValidate.navigateToSameScreen = true;

                                        if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && !utility.isValueValid(itemDetailsObj.errorMessage)) {
                                            itemDetailsObj = tallyScanUtility.getExitingSerialORCreate(itemDetailsObj);
                                            qtyValidate.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned) + 1;
                                            qtyValidate.remainingTallyQuantity = parseInt(scannedQuantityInEach) - qtyValidate.numberOfTimesSerialScanned;
                                        }
                                    } else {
                                        if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {
                                            qtyValidate.tallyLoopObj = tallyLoopObj;
                                        }

                                    }
                                    if (qtyValidate.uomModified == 'T') {
                                        qtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
                                        qtyValidate.isValid = false;
                                    } else if (utility.isValueValid(itemDetailsObj.errorMessage)) {
                                        qtyValidate.isValid = false;
                                        qtyValidate.errorMessage = itemDetailsObj.errorMessage;
                                    } else if (utility.isValueValid(itemDetailsObj.tallyScanitemId) && utility.isValueValid(itemInternalId) && itemDetailsObj.tallyScanitemId != itemInternalId) {

                                        qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
                                        qtyValidate.isValid = false;
                                    } else if (!utility.isValueValid(lotName) && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

                                        qtyValidate.errorMessage = translator.getTranslationString("BINTRANSFER_LOTVALIDATE.INVALID_LOT");
                                        qtyValidate.isValid = false;
                                    } else if (!isScannedItemOrLotSerial) {

                                        qtyValidate.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
                                        qtyValidate.isValid = false;
                                    } else {
                                        if (parseFloat(qtyValidate.remainingTallyQuantity) == 0) {
                                            qtyValidate.navigateToSameScreen = false;
                                        }

                                    }
                                    if ((!utility.isValueValid(qtyValidate.errorMessage)) && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {
                                        var tallyScanObj = {};
                                        tallyScanObj = invUtility.buildObjectFromTallyLoopObj(isTallyScanRequired, itemType, tallyLoopObj, tallyScanBarCodeQty);

                                        if (utility.isValueValid(tallyScanObj)) {
                                            var tallyQtyArr = [];
                                            var statusArray = [];
                                            var lotArray = [];
                                            tallyQtyArr = tallyScanObj.tallyQtyArr;
                                            statusArray = tallyScanObj.statusArray;
                                            lotArray = tallyScanObj.lotArray;

                                            if (itemType == "inventoryitem" || itemType == "assemblyitem") {
                                                if ((inventoryStatusFeature) && statusArray.length > 0) {
                                                    for (var statusvalue = 0; statusvalue < statusArray.length; statusvalue++) {
                                                        if (statusArray[statusvalue] == fromStatusInternalId) {

                                                            scannedQuantity = tallyQtyArr[statusvalue];
                                                            break;
                                                        }

                                                    }
                                                } else {

                                                    scannedQuantity = tallyQtyArr[0];


                                                }
                                            }
                                            else if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && lotArray.length > 0) {
                                                for (var lotvalue = 0; lotvalue < lotArray.length; lotvalue++) {
                                                    if (lotArray[lotvalue] == lotName) {
                                                        if ((inventoryStatusFeature) && statusArray.length > 0) {
                                                            for (var statusvalue = 0; statusvalue < statusArray.length; statusvalue++) {
                                                                if (statusArray[statusvalue] == fromStatusInternalId) {

                                                                    scannedQuantity = tallyQtyArr[statusvalue];
                                                                    break;
                                                                }

                                                            }
                                                        } else {

                                                            scannedQuantity = tallyQtyArr[lotvalue];
                                                            break;

                                                        }
                                                    }
                                                }
                                            }

                                        }
                                    }
                                } else {
                                    qtyValidate.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
                                    qtyValidate.isValid = false;
                                }

                            }
                        }
                        else {
                            if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
                                qtyValidate.lotName = lotName;
                                qtyValidate.lotInternalId = lotInternalId;
                            }

                        }
                        if (qtyValidate.isValid != false && noStockAction != 'nostock') {
                            if (utility.isValueValid(scannedQuantity) && !(isNaN(scannedQuantity)) && (scannedQuantity > 0) &&
                                utility.isValueValid(itemType) && utility.isValueValid(availbleQuanity)) {
                                qtyValidate.selectedStatusName = fromStatusName;
                                qtyValidate.selectedStatusId = fromStatusInternalId;
                                qtyValidate.fromStatusName = fromStatusName;

                                var objStatusDetails = getItemWiseStatusDetailsInBin(itemInternalId, warehouseLocationId, binInternalId,
                                    fromStatusInternalId, lotInternalId, inventoryStatusFeature);
                                for (var statusItr in objStatusDetails) {
                                    availbleQuanity = objStatusDetails[statusItr].available;
                                }
                                scannedQuantity = Big(scannedQuantity);
                                if (!(utility.isValueValid(transactionUomConversionRate))) {
                                    transactionUomConversionRate = 1;
                                }
                                if (utility.isValueValid(availbleQuanity) && parseFloat(availbleQuanity) > 0) {
                                    availbleQuanity = Big(availbleQuanity).mul(transactionUomConversionRate);
                                }


                                var convertedScannedQty = 0;
                                if (isTallyScanRequired && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {
                                    if (objStatusDetails.length == 0) {
                                        availbleQuanity = 0;
                                    }
                                    convertedScannedQty = scannedQuantity;
                                }
                                else {

                                    convertedScannedQty = Number(Big(scannedQuantity).mul(transactionUomConversionRate));
                                }

                                if (utility.isValueValid(convertedScannedQty) && !isNaN(convertedScannedQty) &&
                                    parseFloat(availbleQuanity) >= parseFloat(convertedScannedQty)) {
                                    if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                        if (convertedScannedQty.toString().indexOf('.') != -1) {
                                            qtyValidate.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
                                            qtyValidate.isValid = false;
                                        } else {
                                            qtyValidate.isValid = true;
                                            qtyValidate.scannedQuantity = Number(Big(scannedQuantity).mul(transactionUomConversionRate));
                                            if (isTallyScanRequired) {

                                                if (utility.isValueValid(stockUnitName)) {
                                                    qtyValidate.scannedQuantityWithUOM = infoScannedQty + " " + stockUnitName;
                                                } else {
                                                    qtyValidate.scannedQuantityWithUOM = infoScannedQty;
                                                }
                                            }
                                            else {
                                                if (utility.isValueValid(stockUnitName)) {
                                                    qtyValidate.scannedQuantityWithUOM = scannedQuantity + " " + stockUnitName;
                                                } else {
                                                    qtyValidate.scannedQuantityWithUOM = scannedQuantity;
                                                }
                                            }
                                        }
                                    } else {
                                        if (isTallyScanRequired) {
                                            qtyValidate.scannedQuantity = scannedQuantity;
                                        }
                                        else {
                                            qtyValidate.scannedQuantity = Number((Big(scannedQuantity).mul(transactionUomConversionRate)).toFixed(8));

                                        }
                                        if (isTallyScanRequired) {

                                            if (utility.isValueValid(stockUnitName)) {
                                                qtyValidate.scannedQuantityWithUOM = infoScannedQty + " " + stockUnitName;
                                            } else {
                                                qtyValidate.scannedQuantityWithUOM = infoScannedQty;
                                            }
                                        }
                                        else {
                                            if (utility.isValueValid(stockUnitName)) {
                                                qtyValidate.scannedQuantityWithUOM = scannedQuantity + " " + stockUnitName;
                                            } else {
                                                qtyValidate.scannedQuantityWithUOM = scannedQuantity;
                                            }
                                        }
                                        qtyValidate.isValid = true;

                                    }
                                } else {

                                    if (parseFloat(convertedScannedQty) > parseFloat(availbleQuanity)) {
                                        qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.QTY_GREATERTHAN_AVAILABLE');//"You cannot transfer a quantity of an item that is greater than the available quanity.";
                                        qtyValidate.isValid = false;
                                        if (isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
                                            this.deleteSerialFromSerialEntry(tallyScanItem, binInternalId, itemInternalId, processType);
                                        }
                                    } else {
                                        qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
                                        qtyValidate.isValid = false;
                                    }
                                }
                                qtyValidate.defaultvalue = fromStatusName;

                            } else {
                                qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
                                qtyValidate.isValid = false;
                            }
                        }
                    }
                }
            }
            catch (e) {
                qtyValidate.isValid = false;
                qtyValidate.errorMessage = e.message;
                log.error({ title: 'errorMessage', details: e.message + " Stack :" + e.stack });
                log.error({ title: 'debugString', details: debugString });
            }
            return qtyValidate;
        }

        function getItemWiseStatusDetailsInBin(itemInternalId, warehouseLocationId, binInternalId, fromStatusInternalId, lotInternalId, inventoryStatusFeature) {

            var searchObj = search.load({ id: 'customsearch_wmsse_srchres_statuswise', type: search.Type.INVENTORY_BALANCE });


            searchObj.filters.push(search.createFilter({
                name: 'item',
                operator: search.Operator.ANYOF,
                values: itemInternalId
            }));


            searchObj.filters.push(search.createFilter({
                name: 'location',
                operator: search.Operator.ANYOF,
                values: warehouseLocationId
            }));

            if (utility.isValueValid(binInternalId)) {
                searchObj.filters.push(search.createFilter({
                    name: 'binnumber',
                    operator: search.Operator.ANYOF,
                    values: binInternalId
                }));
            }

            if (inventoryStatusFeature && utility.isValueValid(fromStatusInternalId)) {
                searchObj.filters.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: fromStatusInternalId
                }));

            }

            if (utility.isValueValid(lotInternalId)) {
                searchObj.filters.push(search.createFilter({
                    name: 'inventorynumber',
                    operator: search.Operator.ANYOF,
                    values: lotInternalId
                }));

            }
            var alltaskresults = utility.getSearchResultInJSON(searchObj);
            log.debug({ title: 'alltaskresults', details: alltaskresults });
            return alltaskresults;
        }
        function deleteSerialFromSerialEntry(serialNumber, binInternalId, itemInternalId, processType) {
            try {
                var serialSearch = search.load({
                    id: 'customsearch_wmsse_wo_serialentry_srh',
                });
                var serailFilters = serialSearch.filters;

                if (utility.isValueValid(serialNumber)) {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_no',
                        operator: search.Operator.IS,
                        values: serialNumber
                    }));
                }
                if (utility.isValueValid(binInternalId)) {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_bin',
                        operator: search.Operator.ANYOF,
                        values: binInternalId
                    }));
                }
                if (utility.isValueValid(itemInternalId)) {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_item',
                        operator: search.Operator.ANYOF,
                        values: itemInternalId
                    }));
                }
                if (processType == 'InventoryTransfer') {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_tasktype',
                        operator: search.Operator.ANYOF,
                        values: 18
                    }));
                }
                else {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_tasktype',
                        operator: search.Operator.ANYOF,
                        values: 9
                    }));
                }
                serialSearch.filters = serailFilters;
                var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
                log.debug('serialSearchResults', serialSearchResults);
                if (serialSearchResults.length > 0) {
                    for (var j = 0; j < serialSearchResults.length; j++) {
                        var TempRecord = serialSearchResults[j];
                        log.debug('TempRecord', TempRecord);
                        var id = record.submitFields({
                            type: 'customrecord_wmsse_serialentry',
                            id: TempRecord.id,
                            values: {
                                id: TempRecord.id,
                                name: TempRecord.name,
                                custrecord_wmsse_ser_note1: 'because of discontinue of serial number scanning we have marked this serial number as closed',
                                custrecord_wmsse_ser_status: true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                }

            }
            catch (e) {
                log.error('execption in deleteSerialFromSerialEntry', e)
            }


        }

        return {
            'post': doPost,
            deleteSerialFromSerialEntry: deleteSerialFromSerialEntry
        };

    });
