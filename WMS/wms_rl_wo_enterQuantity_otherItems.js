/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_translator', './wms_workOrderUtility', './big', './wms_tallyScan_utility'],
    /**
     * @param {search} search
     */
    function (utility, translator, workOrderUtility, Big, tallyScanUtility) {

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
            var openTaskId = '';
            var openTaskObj = {};
            var createOpenTaskFlag = true;
            var tallyscanQty = 1;
            try {

                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    var warehouseLocationId = requestParams.warehouseLocationId;
                    var transactionLineNo = requestParams.transactionLineNo;
                    var transactionInternalId = requestParams.transactionInternalId;
                    var transactionName = requestParams.transactionName;
                    var itemInternalId = requestParams.itemInternalId;
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

                    var info_scannedQuantityListOtherItems = requestParams.info_scannedQuantityListOtherItems;
                    var info_statusListOtherItems = requestParams.info_statusListOtherItems;
                    var locUseBinsFlag = requestParams.locUseBinsFlag;

                    var scannedQuantityInBaseUnits = '';
                    var barcodeQuantity = requestParams.barcodeQuantity;
                    var transactionQuantity = requestParams.transactionQuantity;

                    var isTallyScanRequired = requestParams.isTallyScanRequired;
                    var tallyscanitem = requestParams.tallyscanitem;
                    var transcationUomInternalId = requestParams.transcationUomInternalId;
                    var tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
                    var qtyUomSelection = requestParams.qtyUomSelection;
                    var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
                    var unitType = requestParams.unitType;
                    var binEmptyAction = requestParams.binEmptyAction;
                    var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;
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
                    if ((utility.isValueValid(binEmptyAction) && binEmptyAction == 'binEmpty')) {

                        if (isTallyScanRequired) {

                            openTaskObj = {};

                            openTaskObj.taskType = 'PICK';
                            openTaskObj.transactionType = 'workorder';
                            if (!utility.isValueValid(transactionUomName)) {
                                transactionUomConversionRate = '';
                            }
                            openTaskObj.transactionName = transactionName;
                            openTaskObj.transactionUomName = transactionUomName;
                            openTaskObj.conversionRate = transactionUomConversionRate;
                            openTaskObj.transactionLineNo = transactionLineNo;
                            openTaskObj.transactionInternalId = transactionInternalId;
                            openTaskObj.warehouseLocationId = warehouseLocationId;
                            openTaskObj.itemInternalId = itemInternalId;
                            openTaskObj.itemType = itemType;
                            openTaskObj.actualBeginTime = actualBeginTime;
                            openTaskObj.scannedQuantity = tallyScanBarCodeQty;
                            openTaskObj.inventoryNumber = '';
                            openTaskObj.status = '';
                            openTaskObj.lotExpiryDate = '';
                            openTaskObj.toBinInternalId = '';
                            openTaskObj.binInternalId = '';
                            openTaskObj.remainingQuantity = remainingQuantity;
                            //for nonInventoryItem Opentask TransactionReference# will updating with orderId,
                            // because no staging and no bintransferId for noninv item,so to avoid restriction in WO assembly build process updating with WO order id
                            openTaskObj.openTaskTransactionRefNo =transactionInternalId;

                            openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);
                        }
                    } else {

                        if (isTallyScanRequired) {
                            if (utility.isValueValid(tallyscanitem)) {
                                itemValidateObj.tallyScanItem = tallyscanitem;
                                itemValidateObj.warehouseLocationId = warehouseLocationId;
                                itemValidateObj.pickItemId = itemInternalId;
                                itemValidateObj.unitType = unitType;
                                itemValidateObj.InvStatusInternalId = statusInternalId;
                                itemValidateObj.transactionInternalId = transactionInternalId;
                                itemValidateObj.transactionUomName = transactionUomName;
                                itemValidateObj.transactionuomId = transcationUomInternalId;
                                itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
                                itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
                                itemValidateObj.qtyUomSelected = qtyUomSelection;
                                itemValidateObj.tallyScanOrderQty = tallyScanBarCodeQty;
                                response = tallyScanUtility.validateItemTallyScan(itemValidateObj);

                            } else {
                                itemValidate = 'F';
                            }

                        }
                        if (isTallyScanRequired && itemValidate == 'F') {
                            response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
                            response.isValid = false;
                        } else if (isTallyScanRequired && (response.tallyScanitemId != itemInternalId) && (itemType == 'inventoryitem' || itemType == 'assemblyitem')) {
                            response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
                            response.isValid = false;
                        } else if (utility.isValueValid(scannedQuantity) && ((scannedQuantity <= remainingQuantity)|| (workorderOverpickingFlag))) {

                            if (utility.isValueValid(transactionQuantity)) {
                                var workOrderOpenTaskDtlsObj = workOrderUtility.getOpentaskPickQtyDetails(transactionInternalId, itemInternalId, transactionLineNo);
                                if (workOrderOpenTaskDtlsObj.length > 0) {
                                    log.debug('workOrderOpenTaskDtlsObj', workOrderOpenTaskDtlsObj);
                                    var workOrderOpenTaskQuantity = Number(workOrderOpenTaskDtlsObj[0].custrecord_wmsse_act_qty);
                                    remainingQuantity = Big(transactionQuantity).minus(workOrderOpenTaskQuantity);
                                }
                            }
                            if ((parseFloat(remainingQuantity) >= parseFloat(scannedQuantity))||(workorderOverpickingFlag)) {

                                if (isTallyScanRequired) {
                                    response.tallyScanOrderQty = tallyScanBarCodeQty;//to send as input afor below function override same variable with latest value
                                    response = tallyScanUtility.getCalculatedTallyScanQty(response);
                                    scannedQuantity = response.tallyScanOrderQty;//overriding scannedQuantity value from text box value to barcode scanned value
                                    tallyscanQty = response.tallyscanQty;
                                    var quantityUOMObj = tallyScanUtility.getQtyObjectToBePopulated(scannedQuantity, response.qtyUOMObj, transactionUomConversionRate);
                                    response.barcodeQuantity = quantityUOMObj;
                                    response.tallyScanBarCodeQty = response.tallyScanOrderQty;
                                    response.remainingQuantity = remainingQuantity;//change this variable as decremental variable or reassign new variable for decrementing
                                    response.tallyScanRemainingQuantity = Number(Big(remainingQuantity).minus(response.tallyScanBarCodeQty));
                                    if(workorderOverpickingFlag)
                                    {
                                        if(response.tallyScanRemainingQuantity < 0)
                                            response.tallyScanRemainingQuantity =0;
                                    }
                                    response.pageNavigationStatus = 'EnterQuantityScreenForOtherItems';

                                    if ((response.tallyScanBarCodeQty == remainingQuantity) && (!workorderOverpickingFlag)) {
                                        createOpenTaskFlag = true;
                                    }
                                    else
                                    {
                                        createOpenTaskFlag = false;
                                    }

                                }

                                if (!utility.isValueValid(locUseBinsFlag)) {
                                    locUseBinsFlag = utility.lookupOnLocationForUseBins(warehouseLocationId);
                                }
                                scannedQuantityInBaseUnits = Number(Big(scannedQuantity).mul(transactionUomConversionRate));


                                if (createOpenTaskFlag) {

                                    openTaskObj = {};
                                    openTaskId = '';
                                    openTaskObj.taskType = 'PICK';
                                    openTaskObj.transactionType = 'workorder';
                                    if (!utility.isValueValid(transactionUomName)) {
                                        transactionUomConversionRate = '';
                                    }
                                    openTaskObj.transactionName = transactionName;
                                    openTaskObj.transactionUomName = transactionUomName;
                                    openTaskObj.conversionRate = transactionUomConversionRate;
                                    openTaskObj.transactionLineNo = transactionLineNo;
                                    openTaskObj.transactionInternalId = transactionInternalId;
                                    openTaskObj.warehouseLocationId = warehouseLocationId;
                                    openTaskObj.itemInternalId = itemInternalId;
                                    openTaskObj.itemType = itemType;
                                    openTaskObj.actualBeginTime = actualBeginTime;
                                    openTaskObj.scannedQuantity = scannedQuantity;
                                    openTaskObj.inventoryNumber = inventoryNumber;
                                    openTaskObj.status = statusInternalId;
                                    openTaskObj.lotExpiryDate = '';
                                    openTaskObj.toBinInternalId = '';
                                    openTaskObj.binInternalId = '';
                                    if(workorderOverpickingFlag) {
                                        openTaskObj.remainingQuantity = parseFloat(remainingQuantity);
                                    }
                                    //for nonInventoryItem Opentask TransactionReference# will updating with orderId,
                                    // because no staging and no bintransferId for noninv item,so to avoid restriction in WO assembly build process updating with WO order id
                                    openTaskObj.openTaskTransactionRefNo =transactionInternalId;
                                    openTaskId = workOrderUtility.createOpenTaskForWorkOrder(openTaskObj);

                                    if (utility.isValueValid(openTaskId) || (openTaskId != 'INVALID_KEY_OR_REF')) {

                                        // No Code Solution Changes begin here
                                        impactedRecords = workOrderUtility.noCodeSolForWO(openTaskId, transactionInternalId, locUseBinsFlag);
                                        log.debug({title: 'impactedRecords :', details: impactedRecords});
                                        response.impactedRecords = impactedRecords;
                                        //No Code Solution ends here.

                                        if (locUseBinsFlag != false) {
                                            var wostageflagDtl = workOrderUtility.getWOStageflag(transactionInternalId);

                                            if (utility.isValueValid(wostageflagDtl) && wostageflagDtl.length > 0) {
                                                response.gotostage = 'Y';
                                            } else {
                                                response.gotostage = 'N';
                                            }
                                        }
                                        if (utility.isValueValid(info_scannedQuantityListOtherItems)) {
                                            response.info_scannedQuantityListOtherItems = info_scannedQuantityListOtherItems.concat(',', scannedQuantity, ' ', transactionUomName);
                                            if (utility.isValueValid(info_statusListOtherItems))
                                                response.info_statusListOtherItems = info_statusListOtherItems.concat(',', statusName);
                                        } else {
                                            response.info_scannedQuantityListOtherItems = scannedQuantity.toString().concat(' ', transactionUomName);
                                            response.info_statusListOtherItems = statusName;
                                        }

                                        if (Big(remainingQuantity).minus(scannedQuantity) > 0) {
                                            response.pageNavigationStatus = 'EnterQuantityScreenForOtherItems';
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
                            } else {
                                response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.QTY_GREATER_THAN_REQUIRED_QTY');
                                response.isValid = false;
                            }

                        } else if ((scannedQuantity > remainingQuantity)  && (!workorderOverpickingFlag)) {
                            response.errorMessage = translator.getTranslationString('WORKORDER_PICKING.QTY_GREATER_THAN_REQUIRED_QTY');
                            response.isValid = false;
                        } else {
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

        return {
            'post': doPost
        };
    });