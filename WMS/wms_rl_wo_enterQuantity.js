/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_translator', './wms_workOrderUtility', './big', 'N/format', './wms_tallyScan_utility', './wms_outBoundUtility', 'N/search', 'N/record'],
    /**
     * @param {search} search
     */
    function (utility, translator, workOrderUtility, Big, format, tallyScanUtility, obUtility, search, record) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doPost(requestBody) {
            var response = {};
            var impactedRecords = {};
            var itemValidate = 'T';
            var itemValidateObj = {};
            var tallyQtyArr = [];
            var statusArray = [];
            var lotArray = [];
            var openTaskObj = {};
            var openTaskId = '';
            var tallyscanQty = 1;
            var createOpenTaskFlag = true;
            var statusArrayLength = 0;
            var lotArrayLength = 0;

            try {

                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    var warehouseLocationId = requestParams.warehouseLocationId;
                    var transactionLineNo = requestParams.transactionLineNo;
                    var transactionInternalId = requestParams.transactionInternalId;
                    var transactionName = requestParams.transactionName;
                    var itemInternalId = requestParams.itemInternalId;
                    var binInternalId = requestParams.binInternalId;
                    var transactionUomName = requestParams.transactionUomName;
                    var itemType = requestParams.itemType;
                    var scannedQuantity = requestParams.scannedQuantity;
                    var transactionUomConversionRate = requestParams.transactionUomConversionRate;
                    var stockUomConversionRate = requestParams.stockUomConversionRate;
                    var actualBeginTime = requestParams.actualBeginTime;
                    var remainingQuantity = requestParams.remainingQuantity;
                    var statusInternalId = requestParams.statusInternalId;
                    var statusName = requestParams.statusName;
                    var inventoryNumber = requestParams.inventoryNumber;
                    var info_scannedQuantityList = requestParams.info_scannedQuantityList;
                    var info_inventoryNumberList = requestParams.info_inventoryNumberList;
                    var info_statusList = requestParams.info_statusList;
                    var locUseBinsFlag = requestParams.locUseBinsFlag;
                    var qtyAvailableInBaseUnits = '';
                    var scannedQuantityInBaseUnits = '';
                    var openTaskQuantityInBaseUnits = 0;
                    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
                    var barcodeQuantity = requestParams.barcodeQuantity;
                    var transactionQuantity = requestParams.transactionQuantity;
                    var isValid = 'T';
                    var isTallyScanRequired = requestParams.isTallyScanRequired;
                    var tallyscanitem = requestParams.tallyscanitem;
                    var tallyLoopObj = requestParams.tallyLoopObj;
                    var transcationUomInternalId = requestParams.transcationUomInternalId;
                    var tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
                    var numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
                    var scannedQuantityInEach = requestParams.scannedQuantityInEach;
                    var qtyUomSelection = requestParams.qtyUomSelection;
                    var selectLotSerialItemAction = requestParams.selectLotSerialItemAction;
                    var inventoryNumberId = requestParams.inventoryNumberId;
                    var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
                    var scannedInvNumbersText = requestParams.scannedInvNumbersText;
                    var isLotScan = requestParams.isLotScan;
                    var unitType = requestParams.unitstype;
                    var binEmptyAction = requestParams.binEmptyAction;
                    var noStockAction = requestParams.noStockAction;
                    var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;
                    var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;
                    var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;

                    log.debug({title:'requestParams',details:requestParams});
                    remainingQuantity = parseFloat(remainingQuantity);
                    scannedQuantity = parseFloat(scannedQuantity);

                    if (!utility.isValueValid(transactionUomConversionRate)) {
                        transactionUomConversionRate = 1;
                    }
                    if (!utility.isValueValid(stockUomConversionRate)) {
                        stockUomConversionRate = 1;
                    }
                    if (!utility.isValueValid(transactionUomName)) {
                        transactionUomName = '';
                    }
                    workorderOverpickingFlag = workorderOverpickingFlag || false;

                    //bin Empty Implementation
                    if ((utility.isValueValid(binEmptyAction) && binEmptyAction == 'binEmpty') || (utility.isValueValid(noStockAction) && noStockAction == 'noStock')) {
                        if (isTallyScanRequired && (utility.isValueValid(tallyLoopObj) || (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'))) {
                            openTaskObj.taskType = 'PICK';
                            openTaskObj.transactionType = 'workorder';
                            openTaskObj.transactionName = transactionName;
                            openTaskObj.transactionUomName = transactionUomName;
                            openTaskObj.conversionRate = transactionUomConversionRate;
                            openTaskObj.transactionLineNo = transactionLineNo;
                            openTaskObj.transactionInternalId = transactionInternalId;
                            openTaskObj.warehouseLocationId = warehouseLocationId;
                            openTaskObj.itemInternalId = itemInternalId;
                            openTaskObj.itemType = itemType;
                            openTaskObj.actualBeginTime = actualBeginTime;
                            openTaskObj.toBinInternalId = binInternalId;
                            openTaskObj.binInternalId = binInternalId;
                            openTaskObj.lotExpiryDate = '';
                            
                            if(workorderOverpickingFlag) {
                                openTaskObj.remainingQuantity = parseFloat(remainingQuantity);
                             
                            }

                            if (itemType == 'noninventoryitem' || itemType == 'otherchargeitem' || itemType == 'serviceitem' || itemType == 'downloaditem' || itemType == 'giftcertificateitem') {
                                openTaskObj.toBinInternalId = '';
                                openTaskObj.binInternalId = '';
                            }

                            if (itemType != 'serializedinventoryitem' && itemType != 'serializedassemblyitem') {

                                if ((itemType == "inventoryitem" || itemType == "assemblyitem")
                                    || (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

                                    for (var tallyLoopObjIndex in tallyLoopObj) {
                                        if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
                                            lotArray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
                                            tallyQtyArr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
                                            statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
                                        } else if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].statusName) && statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
                                            tallyQtyArr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
                                            if (inventoryStatusFeature) {
                                                statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
                                            }

                                        }

                                    }
                                    if (itemType == "inventoryitem" || itemType == "assemblyitem") {
                                        if (inventoryStatusFeature) {
                                            statusArrayLength = statusArray.length;
                                            for (var statusValue = 0; statusValue < statusArrayLength; statusValue++) {
                                                openTaskObj.scannedQuantity = tallyQtyArr[statusValue];
                                                openTaskObj.status = statusArray[statusValue];
                                                openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                            }
                                        } else {
                                            openTaskObj.scannedQuantity = tallyScanBarCodeQty;
                                            openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                        }

                                    } else if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
                                        lotArrayLength = lotArray.length;
                                        for (var lotvalue = 0; lotvalue < lotArrayLength; lotvalue++) {
                                            openTaskObj.scannedQuantity = tallyQtyArr[lotvalue];
                                            openTaskObj.inventoryNumber = lotArray[lotvalue];
                                            openTaskObj.status = statusArray[lotvalue];
                                            openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                        }
                                    }

                                }

                            } else {
                                //serial item submission
                                var serialObj = {};
                                serialObj.itemInternalId = itemInternalId;
                                serialObj.transactionInternalId = transactionInternalId;
                                serialObj.inventoryStatusFeature = inventoryStatusFeature;
                                serialObj.transactionLineNo = transactionLineNo;
                                serialObj.openTaskObj = openTaskObj;
                                serialObj.scannedQuantity = Number(Big(tallyScanBarCodeQty).div(transactionUomConversionRate));
                                serialObj.openTaskId = openTaskId;
                                serialObj.transactionUomConversionRate = transactionUomConversionRate;
                                serialsSubmit(serialObj);
                            }
                           response.isValid = true;
                        }
                    } else {
                        //Full Qty Picking
                        tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};

                        if (isTallyScanRequired) {
                            itemValidateObj.tallyScanItem = tallyscanitem;
                            itemValidateObj.warehouseLocationId = warehouseLocationId;
                            itemValidateObj.pickItemId = itemInternalId;
                            itemValidateObj.pickBinId = binInternalId;
                            itemValidateObj.unitType = unitType;
                            itemValidateObj.InvStatusInternalId = statusInternalId;
                            itemValidateObj.transactionInternalId = transactionInternalId;
                            itemValidateObj.transactionUomName = transactionUomName;
                            itemValidateObj.transactionuomId = transcationUomInternalId;
                            itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
                            itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
                            itemValidateObj.qtyUomSelected = qtyUomSelection;
                            itemValidateObj.tallyScanOrderQty = tallyScanBarCodeQty;

                            if (((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') ||
                                (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) &&
                                (selectLotSerialItemAction != 'selectLotSerialItemAction')) {
                                if (utility.isValueValid(tallyscanitem)) {

                                    //this block executes from quantity screen
                                    if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {
                                        itemValidateObj.tallyScanSerial = tallyscanitem;
                                        response = tallyScanUtility.validateSerialTallyScan(itemValidateObj);
                                        log.debug('response.errorMessage for serial',response.errorMessage)
                                        if (utility.isValueValid(response.errorMessage)) {

                                            itemValidate = 'F';
                                        }
                                        if (response.barcodeSerialname) {
                                            response.tallyScanSerial = response.barcodeSerialname;
                                        }
                                        log.debug('response.tallyScanSerial',response.tallyScanSerial);

                                        var serialGetObj = {};
                                        serialGetObj.serialName = tallyscanitem;
                                        serialGetObj.itemInternalId = itemInternalId;
                                        serialGetObj.taskType = 9;
                                        var serialSearchRes = workOrderUtility.getSerialEntry(serialGetObj);
                                        if (serialSearchRes.length != 0) {
                                            response.isValid = false;
                                            response.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED');
                                            isValid = 'F'
                                        }

                                        if (utility.isValueValid(response.tallyScanSerial)) //if fetches this value then bar code along with serial is scanned
                                        {
                                            tallyscanitem = response.tallyScanSerial;
                                            itemValidateObj.tallyScanSerial = tallyscanitem;
                                            response.errorMessage = 'barcode with serial scanned';
                                        }

                                    } else {
                                        var isScannedLotItemName = true;
                                        response = tallyScanUtility.validateItemTallyScan(itemValidateObj);
                                        if (response.isbarcodescanned) {
                                            if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
                                                if (utility.isValueValid(response.barcodeLotname)) {
                                                    inventoryNumber = response.barcodeLotname;
                                                }
                                                tallyscanitem = response.barcodeItemname;
                                            }
                                        }
                                        if (utility.isValueValid(response.errorMessage)) {
                                            isScannedLotItemName = false;
                                        }
                                    }
                                        var invNumbersResult = '';

                                        if (isScannedLotItemName && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'))
                                        {
                                            var lotDetails = {};

                                            lotDetails.warehouseLocationId = warehouseLocationId;
                                            if (response.isbarcodescanned) {
                                                lotDetails.itemInternalId = response.barcodeIteminternalid;
                                                if (utility.isValueValid(response.barcodeLotname)) {
                                                    var barCodeLotDetails = utility.inventoryNumberInternalId(response.barcodeLotname, warehouseLocationId, itemInternalId);
                                                    if (utility.isValueValid(barCodeLotDetails)) {
                                                        lotDetails.lotInternalId = barCodeLotDetails;
                                                    }
                                                }
                                            } else {
                                                lotDetails.itemInternalId = response.itemInternalId;
                                            }
                                            if(utility.isValueValid(inventoryDetailLotOrSerialId)){
                                               lotDetails.lotInternalId = inventoryDetailLotOrSerialId;
                                            }
                                            lotDetails.fromBinInternalId = binInternalId;
                                            lotDetails.fromInventorystatus = statusInternalId;
                                            invNumbersResult = obUtility.getPickingLotDetails(lotDetails);
                                            if (utility.isValueValid(invNumbersResult)) {
                                                inventoryNumber = invNumbersResult[0].inventorynumberText;
                                            }
                                        } else {
                                            if (isValid == 'T') {
                                                invNumbersResult = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, tallyscanitem, binInternalId, '');
                                            }
                                        }
                                        log.debug({title:'invNumbersResult for navigation',details:invNumbersResult});
                                        if(utility.isValueValid(unitType)){
                                         response = tallyScanUtility.getUOMToBeConsideredObj(itemValidateObj);
                                        }
                                        if (invNumbersResult.length > 1) {

                                            tallyscanQty = 1;
                                            isValid = 'F';
                                            response.isValid = true;
                                            response.lotShown = false;
                                            createOpenTaskFlag = false;
                                            response.itemValidate = 'T';
                                            if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedinventoryitem') {
                                                inventoryNumber = invNumbersResult[0].inventorynumberText;
                                            }
                                            if (isScannedLotItemName) {
                                                response.navigateToLotScreen = true;
                                                response.scannedInvNumbersText = response.itemName;//this o/p param is to display item name in new screen
                                            } else {
                                                response.navigateLotSerialItemScreen = true;
                                                response.scannedInvNumbersText = tallyscanitem;//this o/p param is to display lot/serial in new screen
                                            }
                                            response.invNumbersResult = invNumbersResult;

                                            response.scannedQuantity = scannedQuantity;
                                            response.statusInternalId = statusInternalId;
                                            response.qtyUomSelection = qtyUomSelection;
                                            response.tallyScanBarCodeQty = tallyScanBarCodeQty;
                                            response.barcodeQuantity = barcodeQuantity;
                                            response.remainingQuantity = remainingQuantity;
                                            response.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
                                            response.scannedQuantityInEach = scannedQuantityInEach;
                                            response.tallyLoopObj = tallyLoopObj;
                                            response.inventoryNumberId = inventoryNumberId;//it is from input param

                                        } else if (invNumbersResult.length == 1) {
                                            response.itemValidate = 'T';
                                            if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedinventoryitem'){
                                                inventoryNumber = invNumbersResult[0].inventorynumberText;
                                        }

                                        } else {
                                            if (isValid == 'T') {
                                                response.itemValidate = 'F';
                                            }
                                        }
                                   // }
                                } else {
                                    response.itemValidate = 'F';
                                }

                            } else {
                                if ((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') ||
                                    (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

                                    //this block executes from new item list screen

                                    itemValidateObj.tallyScanItem = tallyscanitem;
                                    itemValidateObj.warehouseLocationId = warehouseLocationId;
                                    itemValidateObj.unitType = unitType;
                                    itemValidateObj.transactionUomName = transactionUomName;
                                    itemValidateObj.transactionuomId = transcationUomInternalId;
                                    itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
                                    itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
                                    itemValidateObj.qtyUomSelected = qtyUomSelection;
                                    response.transactionUomConversionRate = transactionUomConversionRate;
                                    response.lotShown = false;
                                    response.tallyLoopObj = tallyLoopObj;
                                    response.scannedQuantity = scannedQuantity;

                                    if (isLotScan == 'isLotScan') {
                                        //this will execute from lot list new screen
                                        inventoryNumber = tallyscanitem;
                                        statusName = statusInternalId;
                                        isValid = 'T';
                                        var lotInternalId = utility.inventoryNumberInternalId(inventoryNumber, warehouseLocationId, itemInternalId);
                                        if(utility.isValueValid(unitType)){
                                         response = tallyScanUtility.getUOMToBeConsideredObj(itemValidateObj);
                                        }
                                        if (!utility.isValueValid(lotInternalId)) {
                                            response.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
                                            response.isValid = false;
                                            isValid = 'F';
                                        }
                                    } else {
                                        //this will execute from itemlist new screen

                                        response = tallyScanUtility.validateItemTallyScan(itemValidateObj);
                                        if (utility.isValueValid(response.errorMessage)) {
                                            response.itemValidate = 'F';
                                        } else {
                                            if (response.itemInternalId != itemInternalId) {
                                                response.itemValidate = 'F';
                                            } else {
                                                statusName = statusInternalId;
                                                if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedinventoryitem') {
                                                    inventoryNumber = scannedInvNumbersText;
                                                }

                                            }
                                        }
                                    }
                                } else {
                                    if (utility.isValueValid(tallyscanitem)) {
                                        response = tallyScanUtility.validateItemTallyScan(itemValidateObj);
                                    } else {
                                        itemValidate = 'F';
                                    }
                                }

                            }
                        }
                        log.debug({title:'scannedQuantity',details:scannedQuantity});
                        log.debug({title:'remainingQuantity',details:remainingQuantity});

                        if (isTallyScanRequired && itemValidate == 'F') {
                            response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
                            response.isValid = false;
                        } else if (isTallyScanRequired && (response.tallyScanitemId != itemInternalId) && (itemType == 'inventoryitem' || itemType == 'assemblyitem')) {
                            response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
                            response.isValid = false;
                        } else if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && !utility.isValueValid(inventoryNumber)) {
                            response.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
                            response.isValid = false;
                        }else if(utility.isValueValid(inventoryDetailLotOrSerialText) && ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
                                    inventoryDetailLotOrSerialText != inventoryNumber) ) {
                            response.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_INVENTDETAILS_VALIDLOT");
                            response.isValid = false;
                        }else if (utility.isValueValid(inventoryDetailLotOrSerialText) && (isTallyScanRequired && (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')
                                    && inventoryDetailLotOrSerialText != tallyscanitem)) {
                            response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_INVENTDETAILS_VALIDSERIAL');
                            response.isValid = false;
                        }
                        else if (inventoryStatusFeature && !utility.isValueValid(statusName)) {
                            response.errorMessage = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.SELECT_INVENTORY_STATUS');
                            response.isValid = false;
                        } else if (isTallyScanRequired && response.uomModified == 'T') {
                            response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
                            response.isValid = false;
                        }
                        else if (utility.isValueValid(scannedQuantity) && ((scannedQuantity <= remainingQuantity) || (workorderOverpickingFlag))) {
                            if (!utility.isValueValid(locUseBinsFlag)) {
                                locUseBinsFlag = utility.lookupOnLocationForUseBins(warehouseLocationId);
                            }
                            var inventoryBalanceObj = workOrderUtility.getInventoryBalance(itemInternalId, binInternalId, warehouseLocationId,
                                inventoryNumber, statusInternalId, itemType, locUseBinsFlag);
                            log.debug('inventoryBalanceObj check',inventoryBalanceObj);
                            if (inventoryBalanceObj.length == 0) {
                                response.errorMessage = validateItem(inventoryNumber, statusInternalId, response);
                                response.isValid = false;
                            } else {

                                if (!isTallyScanRequired && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && (inventoryBalanceObj['0'].inventorynumberText != inventoryNumber)) {
                                    response.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
                                    response.isValid = false;
                                } else {
                                    scannedQuantityInBaseUnits = Number(Big(scannedQuantity).mul(transactionUomConversionRate));
                                    if (utility.isValueValid(transactionQuantity)) {
                                        var workOrderOpenTaskDtlsObj = workOrderUtility.getOpentaskPickQtyDetails(transactionInternalId, itemInternalId, transactionLineNo);
                                        log.debug({title:'workOrderOpenTaskDtlsObj',details:workOrderOpenTaskDtlsObj});
                                        if (workOrderOpenTaskDtlsObj.length > 0) {
                                            var objItemDtl ={};
                                            var workOrderOpenTaskQuantity =0;
                                            var woPickQtyResultswithInventoryNumber = workOrderUtility.getOpentaskQtyWithInventoryNumber(transactionInternalId,itemInternalId,transactionLineNo);
                                            workOrderUtility.updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber,objItemDtl);
                                        if(utility.isValueValid(inventoryDetailLotOrSerialText)){
                                           var objLinedata = objItemDtl[itemInternalId];
                                           var qtyObj = objLinedata[transactionLineNo];
                                           workOrderOpenTaskQuantity = utility.isValueValid(qtyObj[inventoryDetailLotOrSerialText]) ? qtyObj[inventoryDetailLotOrSerialText] : 0;
                                           }else{
                                           workOrderOpenTaskQuantity = Number(workOrderOpenTaskDtlsObj[0].custrecord_wmsse_act_qty);
                                            }
                                            remainingQuantity = Big(transactionQuantity).minus(workOrderOpenTaskQuantity);
                                        }
                                    }
                                       if ((scannedQuantity > remainingQuantity) && (!workorderOverpickingFlag)) {
                                        response.remainingQuantity = remainingQuantity;
                                        response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.QTY_GREATER_THAN_REQUIRED_QTY');
                                        response.isValid = false;
                                    } else {
                                        var openTaskDtlsObj = workOrderUtility.getOPenTaskPickBinDetails(itemInternalId, binInternalId, warehouseLocationId,
                                            inventoryNumber, statusInternalId, null, inventoryStatusFeature, null);
                                        qtyAvailableInBaseUnits = Number(Big(parseFloat(inventoryBalanceObj[0].available)).mul(stockUomConversionRate));

                                        if (openTaskDtlsObj.length > 0) {
                                            openTaskQuantityInBaseUnits = Number(openTaskDtlsObj[0].actualQuantityInBaseUnits);
                                        }
                                        if (scannedQuantityInBaseUnits % 1 != 0 && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {

                                            response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.SERIALITEM_DECIMALS_NOTALLOWED');
                                            response.isValid = false;
                                        } else if (!isTallyScanRequired && (scannedQuantityInBaseUnits > (Big(qtyAvailableInBaseUnits).minus(openTaskQuantityInBaseUnits))) &&
                                            ((itemType != 'noninventoryitem' && itemType != 'otherchargeitem' && itemType != 'serviceitem' && itemType != 'downloaditem' && itemType != 'giftcertificateitem'))) {
                                            response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INSUFFICIENT_INVENTORY');
                                            response.isValid = false;
                                        } else if (!isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {//!tallyscan
                                            impactedRecords._ignoreUpdate = true;
                                            response.isValid = true;
                                            impactedRecords._ignoreUpdate = true;
                                            response.isValid = true;
                                            response.scannedQuantityInBaseUnits = scannedQuantityInBaseUnits;
                                            response.scannedQuantity = scannedQuantity;
                                            response.statusName = statusName;
                                            response.statusInternalId = statusInternalId;
                                            response.numberOfTimesSerialScanned = 0;
                                            response.remainingQuantity = remainingQuantity;
                                            response.pageNavigationStatus = 'serialScanScreen';
                                            response.info_scannedQuantityList = info_scannedQuantityList;
                                            response.info_statusList = info_statusList;
                                            if (utility.isValueValid(barcodeQuantity) && (utility.isValueValid(barcodeQuantity[0].unit))) {
                                                var itemAliasUnit = [{'unit': barcodeQuantity[0].unit}];
                                                response.barcodeQuantity = itemAliasUnit;
                                            }

                                        } else {
                                            log.debug('isValid',isValid);
                                            log.debug('createOpenTaskFlag',createOpenTaskFlag);
                                            if (isTallyScanRequired && isValid == 'T') {
                                                   if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && ((tallyScanBarCodeQty < scannedQuantityInEach)|| (workorderOverpickingFlag))) {
                                                    var tallyScannedQty = 1;
                                                    var tallySerialqty = 0;
                                                    var barcodeQty = '';
                                                    var uomValue = '';
                                                    if (utility.isValueValid(barcodeQuantity)) {
                                                        uomValue = barcodeQuantity[0].unit;
                                                        tallySerialqty = barcodeQuantity[0].value;
                                                        barcodeQty = Number(Big(tallySerialqty).plus(tallyScannedQty));
                                                    }
                                                    response.numberOfTimesSerialScanned = tallySerialqty;
                                                    response.scannedQuantityInEach = scannedQuantityInEach;
                                                    tallyScanBarCodeQty = barcodeQuantity[0].value;

                                                    barcodeQuantity = [{
                                                        'value': barcodeQty,
                                                        'unit': uomValue
                                                    }];

                                                    if ((parseFloat(tallyScanBarCodeQty) > parseFloat(scannedQuantityInEach)) && (!workorderOverpickingFlag)) {
                                                        response.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
                                                        response.isValid = false;
                                                        isValid = false;
                                                    } else {
                                                        if (utility.isValueValid(scannedInvNumbersText)) {
                                                            tallyscanitem = scannedInvNumbersText;
                                                        }
                                                        itemValidateObj.tallyScanSerial = tallyscanitem;
                                                        itemValidateObj.taskType = 9;
                                                        itemValidateObj.pickTaskId = transactionName;
                                                        itemValidateObj.transactionLineNo = transactionLineNo;
                                                        response.barcodeQuantity = barcodeQuantity;
                                                        response.tallyScanBarCodeQty = tallyScanBarCodeQty;
                                                        tallyScanUtility.getExitingSerialORCreate(itemValidateObj);
                                                        response.pageNavigationStatus = 'EnterQuantityScreen';
                                                        response.remainingQuantity = remainingQuantity;
                                                        response.tallyScanRemainingQuantity = Number(Big(scannedQuantityInEach).minus(response.tallyScanBarCodeQty));
                                                        if(workorderOverpickingFlag)
                                                        {
                                                            if(response.tallyScanRemainingQuantity < 0)
                                                                response.tallyScanRemainingQuantity =0;
                                                        }
                                                        scannedQuantity = scannedQuantityInEach;
                                                        createOpenTaskFlag = false;

                                                    }
                                                } else {
                                                    //looping for inv/lot items

                                                    var lotName;
                                                    response.tallyScanOrderQty = tallyScanBarCodeQty;
                                                    response = tallyScanUtility.getCalculatedTallyScanQty(response);
                                                    scannedQuantity = response.tallyScanOrderQty;
                                                    tallyscanQty = response.tallyscanQty;
                                                    lotName = inventoryNumber;
                                                    tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanJSONObject(tallyLoopObj, '', lotName, tallyscanQty, statusInternalId);
                                                    response.tallyLoopObj = tallyLoopObj;
                                                    var quantityUOMObj = tallyScanUtility.getQtyObjectToBePopulated(scannedQuantity, response.qtyUOMObj, transactionUomConversionRate);
                                                    response.barcodeQuantity = quantityUOMObj;
                                                    response.tallyScanBarCodeQty = response.tallyScanOrderQty;
                                                    response.uomTobePopulated = quantityUOMObj;
                                                    response.remainingQuantity = remainingQuantity;
                                                    response.tallyScanRemainingQuantity = Number(Big(remainingQuantity).minus(response.tallyScanBarCodeQty));
                                                    if(workorderOverpickingFlag)
                                                    {
                                                        if(response.tallyScanRemainingQuantity < 0)
                                                            response.tallyScanRemainingQuantity =0;
                                                    }
                                                    response.pageNavigationStatus = 'EnterQuantityScreen';
                                                    createOpenTaskFlag = false;
                                                       if(isTallyScanRequired ) {
                                                           var key ="";
                                                           if(inventoryNumber != undefined && inventoryNumber != '' && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')){
                                                               key = inventoryNumber + '_' + "undefined" + (inventoryStatusFeature ? '_' + statusInternalId : '');
                                                           }else {
                                                               key = "undefined" + (inventoryStatusFeature ? '_' + statusInternalId : '');
                                                           }
                                                           
                                                           
                                                           if (utility.isValueValid(tallyLoopObj[key])) {
                                                               scannedQuantityInBaseUnits = Number(Big(tallyLoopObj[key]['quantity']));
                                                           }
                                                           
                                                       }
                                                }
                                                if (scannedQuantityInBaseUnits > (Big(qtyAvailableInBaseUnits).minus(openTaskQuantityInBaseUnits))) {
                                                    response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INSUFFICIENT_INVENTORY');
                                                    response.isValid = false;
                                                    
                                                }
                                                else {
                                                    response.isValid = true;
                                                }
                                                if ((response.tallyScanBarCodeQty == remainingQuantity || response.tallyScanBarCodeQty  == scannedQuantityInEach) && (!workorderOverpickingFlag)) {
                                                    createOpenTaskFlag = true;
                                                } else {
                                                    createOpenTaskFlag = false;
                                                }

                                            }
                                            log.debug({title:'createOpenTaskFlag',details:createOpenTaskFlag});

                                            if (createOpenTaskFlag) {
                                                openTaskObj.taskType = 'PICK';
                                                openTaskObj.transactionType = 'workorder';
                                                openTaskObj.transactionName = transactionName;
                                                openTaskObj.transactionUomName = transactionUomName;
                                                openTaskObj.conversionRate = transactionUomConversionRate;
                                                openTaskObj.transactionLineNo = transactionLineNo;
                                                openTaskObj.transactionInternalId = transactionInternalId;
                                                openTaskObj.warehouseLocationId = warehouseLocationId;
                                                openTaskObj.itemInternalId = itemInternalId;
                                                openTaskObj.itemType = itemType;
                                                openTaskObj.actualBeginTime = actualBeginTime;
                                                openTaskObj.toBinInternalId = binInternalId;
                                                openTaskObj.binInternalId = binInternalId;
                                                openTaskObj.lotExpiryDate = '';
                                                if(workorderOverpickingFlag) {
                                                    openTaskObj.remainingQuantity = parseFloat(remainingQuantity);
                                                }
                                                if (itemType == 'noninventoryitem' || itemType == 'otherchargeitem' || itemType == 'serviceitem' || itemType == 'downloaditem' || itemType == 'giftcertificateitem') {
                                                    openTaskObj.toBinInternalId = '';
                                                    openTaskObj.binInternalId = '';
                                                }

                                                if (utility.isValueValid(inventoryBalanceObj[0].expirationdate)) {
                                                    openTaskObj.lotExpiryDate = format.parse({
                                                        value: inventoryBalanceObj[0].expirationdate,
                                                        type: format.Type.DATE
                                                    });
                                                }

                                                if (isTallyScanRequired) {
                                                    if ((itemType == "inventoryitem" || itemType == "assemblyitem")
                                                        || (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

                                                        for (var tallyLoopObjIndex in tallyLoopObj) {
                                                            if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
                                                                lotArray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
                                                                tallyQtyArr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
                                                                statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
                                                            } else if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].statusName) && statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
                                                                tallyQtyArr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
                                                                if (inventoryStatusFeature) {
                                                                    statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
                                                                }

                                                            }

                                                        }
                                                        openTaskObj.scannedQuantity = tallyQtyArr;
                                                        if (inventoryStatusFeature) {
                                                            openTaskObj.status = statusArray;
                                                        }
                                                    }
                                                    if (itemType == "inventoryitem" || itemType == "assemblyitem") {
                                                        if (inventoryStatusFeature) {
                                                            statusArrayLength = statusArray.length;
                                                            for (var statusItr = 0; statusItr < statusArrayLength; statusItr++) {
                                                                openTaskObj.scannedQuantity = tallyQtyArr[statusItr];
                                                                openTaskObj.status = statusArray[statusItr];
                                                                openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                                            }
                                                        } else {
                                                            openTaskObj.scannedQuantity = scannedQuantity;
                                                            openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                                        }

                                                    } else if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
                                                        lotArrayLength = lotArray.length;
                                                        for (var lotItr = 0; lotItr < lotArrayLength; lotItr++) {
                                                            openTaskObj.scannedQuantity = tallyQtyArr[lotItr];
                                                            openTaskObj.inventoryNumber = lotArray[lotItr];
                                                            openTaskObj.status = statusArray[lotItr];
                                                            openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                                        }

                                                    } else {
                                                        //serial item submission
                                                        var serialObj = {};
                                                        serialObj.itemInternalId = itemInternalId;
                                                        serialObj.transactionInternalId = transactionInternalId;
                                                        serialObj.inventoryStatusFeature = inventoryStatusFeature;
                                                        serialObj.transactionLineNo = transactionLineNo;
                                                        serialObj.openTaskObj = openTaskObj;
                                                        serialObj.scannedQuantity = scannedQuantity;
                                                        serialObj.openTaskId = openTaskId;
                                                        serialObj.transactionUomConversionRate = transactionUomConversionRate;
                                                        openTaskId = serialsSubmit(serialObj);
                                                    }

                                                } else {
                                                    openTaskObj.scannedQuantity = scannedQuantity;
                                                    openTaskObj.inventoryNumber = inventoryNumber;
                                                    openTaskObj.status = statusInternalId;
                                                    openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                                                }
                                                if (utility.isValueValid(openTaskId) || (openTaskId != 'INVALID_KEY_OR_REF')) {

                                                    // No Code Solution Changes begin here
                                                    impactedRecords = workOrderUtility.noCodeSolForWO(openTaskId, transactionInternalId, locUseBinsFlag);
                                                    log.debug({title: 'impactedRecords :', details: impactedRecords});

                                                    //No Code Solution ends here.

                                                    if (locUseBinsFlag != false) {
                                                        var wostageflagDtl = workOrderUtility.getWOStageflag(transactionInternalId);

                                                        if (utility.isValueValid(wostageflagDtl) && wostageflagDtl.length > 0) {
                                                            response.gotostage = 'Y';
                                                        } else {
                                                            response.gotostage = 'N';
                                                        }
                                                    }

                                                    if (utility.isValueValid(info_scannedQuantityList)) {
                                                        response.info_scannedQuantityList = info_scannedQuantityList.concat(',', scannedQuantity, ' ', transactionUomName);
                                                        if (utility.isValueValid(info_inventoryNumberList))
                                                            response.info_inventoryNumberList = info_inventoryNumberList.concat(',', inventoryNumber);
                                                        if (utility.isValueValid(info_statusList))
                                                            response.info_statusList = info_statusList.concat(',', statusName);
                                                    } else {
                                                        response.info_scannedQuantityList = scannedQuantity.toString().concat(' ', transactionUomName);
                                                        response.info_inventoryNumberList = inventoryNumber;
                                                        response.info_statusList = statusName;
                                                    }


                                                    if (Big(remainingQuantity).minus(scannedQuantity) > 0) {
                                                        response.pageNavigationStatus = 'EnterQuantityScreen';
                                                        response.isValid = true;
                                                        response.remainingQuantity = Big(remainingQuantity).minus(scannedQuantity);
                                                    } else {
                                                        response.pageNavigationStatus = 'PickTaskCompleteScreen';
                                                        response.isValid = true;
                                                        response.remainingQuantity = Big(remainingQuantity).minus(scannedQuantity);
                                                        response.showNextPickTaskButton = workOrderUtility.showNextPickTaskButton(transactionName, warehouseLocationId, transactionInternalId,workorderOverpickingFlag);
                                                    }
                                                    if (utility.isValueValid(barcodeQuantity) && (utility.isValueValid(barcodeQuantity[0].unit))) {
                                                        var itemAliasUnit = [{'unit': barcodeQuantity[0].unit}];
                                                        response.barcodeQuantity = itemAliasUnit;
                                                    }

                                                } else {
                                                    response.isValid = 'false';
                                                }
                                            }
                                            
                                        }
                                        response.impactedRecords = impactedRecords;
                                    }
                                }
                            }
                        }
                        else if ((scannedQuantity > remainingQuantity) && (!workorderOverpickingFlag)) {
                            response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.QTY_GREATER_THAN_REQUIRED_QTY');
                            response.isValid = false;
                        } else if(!utility.isValueValid(scannedQuantity)){
                            log.debug('into error msg');
                            response.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
                            response.isValid = false;
                        }
                    }
                } else {
                    response.isValid = false;
                }
            } catch (e) {
                response.isValid = false;
                response.errorMessage = e.message;
                log.error({title: 'errorMessage', details: e.message + " Stack :" + e.stack});
            }
            log.debug('response', response);
            return response;
        }

        function validateItem(inventoryNumber, statusInternalId, response) {
            var errorMessage = '';
            if (utility.isValueValid(inventoryNumber)) {
                errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
            } else {
                errorMessage = translator.getTranslationString('WORKORDER_PICKING.INSUFFICIENT_INVENTORY');
            }
            return errorMessage;
        }

        function serialsSubmit(serialObj) {

            var tallySerQtyArr = [];
            var tallySerStatusArr = [];
            var tallySerNumberArr = [];

            var serialSearchObj = search.load({
                type: 'customrecord_wmsse_serialentry',
                id: 'customsearch_wmsse_serialdetails_search'
            });
            serialSearchObj.filters.push(search.createFilter({
                name: 'custrecord_wmsse_ser_status',
                operator: search.Operator.IS,
                values: false
            }));
            serialSearchObj.filters.push(search.createFilter({
                name: 'custrecord_wmsse_ser_tasktype',
                operator: search.Operator.ANYOF,
                values: 9
            }));

            serialSearchObj.filters.push(search.createFilter({
                name: 'custrecord_wmsse_ser_item',
                operator: search.Operator.ANYOF,
                values: serialObj.itemInternalId
            }));

            serialSearchObj.filters.push(search.createFilter({
                name: 'custrecord_wmsse_ser_ordno',
                operator: search.Operator.IS,
                values: serialObj.transactionInternalId
            }));

            var serialSearchResults = utility.getSearchResultInJSON(serialSearchObj);

            var SerialNumArray = [];
            var SerialNameArray = [];
            var serialOpenTaskObj = {};
            log.debug({title:'serialSearchResults',details:serialSearchResults});
            if (serialSearchResults.length > 0) {
                var serialSearchResultsLength = serialSearchResults.length;
                for (var itr = 0; itr < serialSearchResultsLength; itr++) {
                    var SerInvQty = 1;
                    var SerInvstatus = serialSearchResults[itr].custrecord_serial_inventorystatus;
                    var SerInvSerialNumber = serialSearchResults[itr].custrecord_wmsse_ser_no;
                    SerialNumArray.push(serialSearchResults[itr].id);
                    SerialNameArray.push(SerInvSerialNumber);
                    var key = serialObj.transactionLineNo + (serialObj.inventoryStatusFeature ? '_' + SerInvstatus : '');
                    if (utility.isValueValid(serialOpenTaskObj[key])) {
                        serialOpenTaskObj[key]['SerInvQty'] = Number(Big(serialOpenTaskObj[key]['SerInvQty']).plus(SerInvQty));
                        serialOpenTaskObj[key]['SerInvSerialNumber'] = serialOpenTaskObj[key]['SerInvSerialNumber'] + ',' + SerInvSerialNumber;

                    } else {
                        var obj = {};
                        obj.SerInvQty = SerInvQty;
                        obj.SerInvstatus = SerInvstatus;
                        obj.SerInvSerialNumber = SerInvSerialNumber;
                        serialOpenTaskObj[key] = obj;
                    }
                }
            }


            for (var serialOTObjIndex in serialOpenTaskObj) {
                if (utility.isValueValid(serialOpenTaskObj[serialOTObjIndex].SerInvstatus) && tallySerStatusArr.indexOf(serialOpenTaskObj[serialOTObjIndex].SerInvstatus) == -1) {
                    tallySerQtyArr.push(serialOpenTaskObj[serialOTObjIndex].SerInvQty);
                    tallySerNumberArr.push(serialOpenTaskObj[serialOTObjIndex].SerInvSerialNumber);
                    if (serialObj.inventoryStatusFeature) {
                        tallySerStatusArr.push(serialOpenTaskObj[serialOTObjIndex].SerInvstatus);
                    }
                }
            }

            if (tallySerStatusArr.length > 0) {
                var tallySerStatusArrLength = tallySerStatusArr.length;
                for (var serStatusValue = 0; serStatusValue < tallySerStatusArrLength; serStatusValue++) {
                    serialObj.openTaskObj.scannedQuantity = Number(Big(tallySerQtyArr[serStatusValue]).div(serialObj.transactionUomConversionRate));
                    serialObj.openTaskObj.inventoryNumber = tallySerNumberArr[serStatusValue];
                    serialObj.openTaskObj.status = tallySerStatusArr[serStatusValue];
                    serialObj.openTaskId = workOrderUtility.createOpenTaskForWorkOrder(serialObj.openTaskObj);
                }
            } else {
                    serialObj.openTaskObj.scannedQuantity = serialObj.scannedQuantity;
                    serialObj.openTaskId = workOrderUtility.createOpenTaskForWorkOrder(serialObj.openTaskObj);
            }


            for (var serialId in SerialNumArray) {

                var serialEntryRecId = SerialNumArray[serialId];

                record.submitFields({
                    type: 'customrecord_wmsse_serialentry',
                    id: serialEntryRecId,
                    values: {
                        'custrecord_wmsse_ser_note1': 'because of discontinue of serial number scanning we have marked this serial number as closed',
                        'custrecord_wmsse_ser_status': true
                    }
                });
            }
            return serialObj.openTaskId;
        }

        return {
            'post': doPost
        };
    });
