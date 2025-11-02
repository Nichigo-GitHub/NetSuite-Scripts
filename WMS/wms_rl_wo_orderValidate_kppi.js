/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/log', './wms_utility', './wms_translator', './big', './wms_workOrderUtility'],

    function (search, log, utility, translator, Big, woUtility) {

        function doPost(requestBody) {

            var orderDetails = {};
            var debugString = '';
            var requestParams = '';
            var workOrderList = [];
            var workOrderDtl = {};
            try {
                log.debug('doPost:start', { requestBody: requestBody });

                if (utility.isValueValid(requestBody)) {
                    log.debug('requestBody is valid');

                    log.debug({
                        title: 'requestBody (raw)',
                        details: requestBody
                    });
                    var requestParams = requestBody.params;
                    log.debug('requestParams', requestParams);

                    var whLocation = requestParams && requestParams.warehouseLocationId;
                    var transactionName = requestParams && requestParams.transactionName;
                    log.debug('parsed params', { whLocation: whLocation, transactionName: transactionName });

                    // early whitelist check (kept from original)
                    if (whLocation == 789 || whLocation == 940 || whLocation == 922 || whLocation == 834 || whLocation == 942 || whLocation == 939 || whLocation == 820 || whLocation == 821) {
                        log.debug('whLocation is in special list', whLocation);
                    } else {
                        log.debug('whLocation not in special list', whLocation);
                    }

                    if (utility.isValueValid(whLocation)) {
                        log.debug('whLocation is valid', whLocation);

                        if (utility.isValueValid(transactionName)) {
                            log.debug('transactionName is valid', transactionName);

                            var workOrdDtlResults = woUtility.fnToValidateWO(transactionName);
                            log.debug('fnToValidateWO returned', { length: (workOrdDtlResults && workOrdDtlResults.length), sample: workOrdDtlResults && workOrdDtlResults[0] });

                            if (workOrdDtlResults && workOrdDtlResults.length > 0) {
                                var backOrderFlag = true;
                                var backorderItmsCount = 0;
                                var woLocation = workOrdDtlResults[0]['location'];
                                var checkFlag = 'F';
                                log.debug('initial state', { backOrderFlag: backOrderFlag, backorderItmsCount: backorderItmsCount, woLocation: woLocation, checkFlag: checkFlag });

                                if (!(utility.isValueValid(woLocation))) {
                                    checkFlag = 'T';
                                    orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_NOTMAPPED');
                                    orderDetails['isValid'] = false;
                                    log.debug('woLocation invalid -> ORDER_NOTMAPPED', { woLocation: woLocation, checkFlag: checkFlag });
                                } else if (woLocation != null && woLocation != '' && (woLocation != woLocation)) {
                                    checkFlag = 'T';
                                    orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDERMAPPED_LOCATION');
                                    orderDetails['isValid'] = false;
                                    log.debug('woLocation non-empty -> ORDERMAPPED_LOCATION', { woLocation: woLocation, checkFlag: checkFlag });
                                } else {
                                    log.debug('woLocation passed checks (else branch)', { woLocation: woLocation });

                                    var backOrderedInternalIdArr = [];
                                    var systemRule = "Pick only fully committed work orders";
                                    log.debug('Getting system rule for', { systemRule: systemRule, woLocation: woLocation });
                                    var systemRuleForFullyCommittedWO = utility.getSystemRuleValue(systemRule, woLocation);
                                    log.debug('systemRuleForFullyCommittedWO', systemRuleForFullyCommittedWO);

                                    if (systemRuleForFullyCommittedWO == 'Y') {
                                        var workOrderInternalId = workOrdDtlResults[0]['internalid'];
                                        log.debug('Calling getBackOrderedWOlist', { whLocation: whLocation, workOrderInternalId: workOrderInternalId });
                                        backOrderedInternalIdArr = woUtility.getBackOrderedWOlist(whLocation, workOrderInternalId);
                                        log.debug('getBackOrderedWOlist returned', { result: backOrderedInternalIdArr });
                                    }

                                    if (systemRuleForFullyCommittedWO == 'Y' && backOrderedInternalIdArr.length > 0) {
                                        backOrderFlag = true;
                                        backorderItmsCount = workOrdDtlResults.length;
                                        log.debug('Backordered WOs found', { backOrderedInternalIdArr: backOrderedInternalIdArr, backorderItmsCount: backorderItmsCount });
                                    } else {
                                        log.debug('Checking committed qtys for each work order detail', { length: workOrdDtlResults.length });
                                        for (var t = 0; t < workOrdDtlResults.length; t++) {

                                            var vcommittedordqty = workOrdDtlResults[t]['Committed Qty'];
                                            log.debug('workOrdDtlResults[' + t + ']', workOrdDtlResults[t]);

                                            if (!(utility.isValueValid(vcommittedordqty)))
                                                vcommittedordqty = 0;
                                            log.debug('vcommittedordqty (normalized)', vcommittedordqty);

                                            if (parseFloat(vcommittedordqty) <= 0) {
                                                backOrderFlag = true;
                                                backorderItmsCount = parseInt(backorderItmsCount) + 1;
                                                log.debug('Incrementing backorderItmsCount', backorderItmsCount);
                                            }
                                        }
                                        log.debug('After loop, backOrderFlag/backorderItmsCount', { backOrderFlag: backOrderFlag, backorderItmsCount: backorderItmsCount });
                                    }

                                    if (backOrderFlag == true) {
                                        if (parseInt(backorderItmsCount) == (parseInt(workOrdDtlResults.length))) {
                                            checkFlag = 'T';
                                            orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.BACKORDER_ITEMS');
                                            orderDetails['isValid'] = false;
                                            log.debug('All items backordered -> BACKORDER_ITEMS', { checkFlag: checkFlag });
                                        }
                                    }
                                }
                                log.debug('checkFlag after checks', checkFlag);

                                if (checkFlag == 'F') {
                                    var woInternalid = workOrdDtlResults[0]['internalid'];
                                    log.debug('Proceeding with woInternalid', woInternalid);
                                    var isValid = false;
                                    var vtotalItemQty = 0;
                                    var vtotalItemRcvQty = 0;
                                    var pickqty = 0;
                                    var lines = 0;
                                    var checkStageFlag = 'F';
                                    log.debug('Calling woOverpickingFlag for', { woInternalid: woInternalid, whLocation: whLocation });
                                    var workorderOverpickingFlag = woUtility.woOverpickingFlag(woInternalid, whLocation);
                                    log.debug('workorderOverpickingFlag', workorderOverpickingFlag);

                                    log.debug('Calling getWODetails for', woInternalid);
                                    var woDetailsList = woUtility.getWODetails(woInternalid);
                                    log.debug('woDetailsList', woDetailsList);

                                    var assemblyitemQty = woDetailsList[0] && woDetailsList[0]['quantity'];
                                    var built = woDetailsList[0] && woDetailsList[0]['quantityshiprecv'];
                                    log.debug('assemblyitemQty & built', { assemblyitemQty: assemblyitemQty, built: built });

                                    for (var s = 0; s < workOrdDtlResults.length; s++) {
                                        var vwoitemQty = workOrdDtlResults[s]['Committed Qty'];
                                        var vwoitemRcvQty = workOrdDtlResults[s]['quantityshiprecv'];
                                        var qty = workOrdDtlResults[s]['quantity'];
                                        var qtyuom = workOrdDtlResults[s]['quantityuom'];
                                        var line = workOrdDtlResults[s]['line'];

                                        log.debug('Processing line ' + s, { vwoitemQty: vwoitemQty, vwoitemRcvQty: vwoitemRcvQty, qty: qty, qtyuom: qtyuom, line: line });

                                        if (vwoitemRcvQty == null || vwoitemRcvQty == '' || vwoitemRcvQty == undefined || isNaN(vwoitemRcvQty))
                                            vwoitemRcvQty = 0;
                                        if (utility.isValueValid(vwoitemQty)) {
                                            lines++;
                                            vwoitemQty = parseFloat(vwoitemQty) / (parseFloat(qty) / parseFloat(qtyuom));
                                            vwoitemRcvQty = parseFloat(vwoitemRcvQty) / (parseFloat(qty) / parseFloat(qtyuom));

                                            if (vwoitemQty == null || vwoitemQty == '' || vwoitemQty == undefined || isNaN(vwoitemQty))
                                                vwoitemQty = 0;
                                            vwoitemQty = new Big(vwoitemQty);

                                            vtotalItemQty = Number(Big(vtotalItemQty).plus(vwoitemQty));
                                            vtotalItemRcvQty = parseFloat(vtotalItemRcvQty) + parseFloat(vwoitemRcvQty);

                                            log.debug('Accumulated totals', { vtotalItemQty: vtotalItemQty, vtotalItemRcvQty: vtotalItemRcvQty, lines: lines });
                                        } else {
                                            log.debug('vwoitemQty not valid for line', s);
                                        }
                                    }

                                    var getOpenTaskStageDtl = woUtility.getWOStageflag(woInternalid);
                                    log.debug('getWOStageflag returned', getOpenTaskStageDtl);

                                    if (getOpenTaskStageDtl.length > 0) {
                                        checkStageFlag = 'T';
                                        log.debug('Task stage open -> setting checkStageFlag = T');
                                    } else {
                                        log.debug('No open task stage -> computing pick quantities');
                                        var pickQtyResults = woUtility.getWOpickQty(woInternalid);
                                        log.debug('pickQtyResults', pickQtyResults);

                                        if (pickQtyResults && pickQtyResults.length > 0)
                                            pickqty = pickQtyResults[0]['custrecord_wmsse_act_qty'];

                                        log.debug('raw pickqty', pickqty);
                                        if (pickqty == '' || pickqty == null || pickqty == 'null' || pickqty == undefined || isNaN(pickqty))
                                            pickqty = 0;
                                        log.debug('pickqty normalized', pickqty);

                                        log.debug({
                                            title: 'vtotalItemRcvQty before Big',
                                            details: vtotalItemRcvQty
                                        });

                                        pickqty = new Big(pickqty);
                                        if (vtotalItemQty == '' || vtotalItemQty == null || vtotalItemQty == undefined || isNaN(vtotalItemQty))
                                            vtotalItemQty = 0;

                                        if (vtotalItemRcvQty == '' || vtotalItemRcvQty == null || vtotalItemRcvQty == undefined || isNaN(vtotalItemRcvQty))
                                            vtotalItemRcvQty = 0;
                                        vtotalItemRcvQty = new Big(vtotalItemRcvQty);
                                        var vWoreminqty = Number((Big(vtotalItemQty).plus(vtotalItemRcvQty)).minus(pickqty));

                                        log.debug('Calculated vWoreminqty', { vtotalItemQty: vtotalItemQty, vtotalItemRcvQty: vtotalItemRcvQty, pickqty: pickqty, vWoreminqty: vWoreminqty });

                                        if (vWoreminqty > 0 || ((vWoreminqty < 0) && (workorderOverpickingFlag))) {
                                            if (workorderOverpickingFlag) {
                                                var stagedOpenTaskCount = woUtility.getStagedOpenTaskCount(woInternalid);
                                                log.debug('stagedOpenTaskCount', stagedOpenTaskCount);
                                                if (stagedOpenTaskCount > 0 && (parseInt(stagedOpenTaskCount) == parseInt(workOrdDtlResults.length - 1))) {
                                                    checkStageFlag = 'F';
                                                    log.debug('Setting checkStageFlag = F due to stagedOpenTaskCount condition');
                                                } else {
                                                    checkStageFlag = 'T';
                                                    log.debug('Setting checkStageFlag = T (overpicking allowed but condition not met)');
                                                }
                                            } else {
                                                checkStageFlag = 'T';
                                                log.debug('Setting checkStageFlag = T (vWoreminqty > 0 and no overpicking flag)');
                                            }
                                        }
                                        log.debug('Final checkStageFlag', checkStageFlag);
                                    }

                                    if (checkStageFlag == 'T') {
                                        orderDetails['workorderOverpickingFlag'] = workorderOverpickingFlag;
                                        orderDetails['info_transactionName'] = transactionName;
                                        orderDetails['info_lines'] = lines;
                                        orderDetails['info_workOrderItemName'] = woDetailsList[0]['itemText'];
                                        orderDetails['workOrderItemInternalId'] = woDetailsList[0]['item'];
                                        var columnArray = [];
                                        columnArray.push('itemid');
                                        log.debug('Calling utility.getItemFieldsByLookup for', woDetailsList[0]['item']);
                                        var itemLookUp = utility.getItemFieldsByLookup(woDetailsList[0]['item'], columnArray);
                                        log.debug('itemLookUp', itemLookUp);

                                        if (itemLookUp && itemLookUp.thumbnailurl != undefined) {
                                            orderDetails["info_workOrderImageUrl"] = itemLookUp.thumbnailurl;
                                            log.debug('Set image url', itemLookUp.thumbnailurl);
                                        }

                                        orderDetails['transactionType'] = workOrdDtlResults[0]['type'];
                                        orderDetails['transactionInternalId'] = woInternalid;
                                        orderDetails['transactionName'] = transactionName;
                                        orderDetails['itemName'] = woDetailsList[0]['itemText'];
                                        orderDetails['actualBeginTime'] = utility.getCurrentTimeStamp();
                                        orderDetails['built'] = built;
                                        orderDetails['buildable'] = Number(Big(assemblyitemQty).minus(built));
                                        orderDetails['lines'] = lines;
                                        orderDetails['isValid'] = true;
                                        orderDetails['gotostage'] = 'N';

                                        log.debug('Order is valid, orderDetails snapshot', orderDetails);
                                    } else {
                                        orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_STAGED');
                                        orderDetails['isValid'] = false;
                                        log.debug('Order staged -> invalid', orderDetails['errorMessage']);
                                    }

                                }
                            } else {
                                orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
                                orderDetails['isValid'] = false;
                                log.debug('fnToValidateWO returned no results or empty -> INVALID_ORDER');
                            }
                        } else {
                            orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
                            orderDetails['isValid'] = false;
                            log.debug('transactionName invalid -> INVALID_ORDER');
                        }

                    } else {
                        orderDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
                        orderDetails['isValid'] = false;
                        log.debug('warehouseLocationId invalid -> INVALID_INPUT');
                    }
                } else {
                    orderDetails['isValid'] = false;
                    log.debug('requestBody not valid -> isValid false');
                }

            } catch (e) {
                orderDetails['isValid'] = false;
                orderDetails['errorMessage'] = e.message;
                log.error({
                    title: 'errorMessage',
                    details: e.message + " Stack :" + (e.stack || 'no stack')
                });
                log.error({
                    title: 'debugString',
                    details: debugString
                });
            }
            log.debug('orderDetails--', orderDetails);

            return orderDetails;
        }


        return {
            'post': doPost
        }
    });