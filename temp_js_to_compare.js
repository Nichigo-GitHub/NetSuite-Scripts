/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/log'], function (currentRecord, record, search, log) {
    const fieldIdsToCheck = [
        'custrecord541', 'custrecord542', 'custrecord543', 'custrecord544',
        'custrecord545', 'custrecord546', 'custrecord547', 'custrecord548',
        'custrecord549', 'custrecord550', 'custrecord551', 'custrecord552',
        'custrecord553', 'custrecord554', 'custrecord555', 'custrecord556',
        'custrecord557', 'custrecord558', 'custrecord559', 'custrecord560',
        'custrecord561', 'custrecord562', 'custrecord563', 'custrecord564',
        'custrecord565', 'custrecord566', 'custrecord567', 'custrecord568',
        'custrecord569', 'custrecord570', 'custrecord571'
    ];

    function saveRecord(context) {
        log.debug({
            title: "saveRecord",
            details: "Start saveRecord"
        });
        var rec = currentRecord.get();

        if (!rec.id) {
            var itemReceipt = currentRecord.get();

            var subsidiary = itemReceipt.getValue({
                fieldId: 'subsidiary'
            });

            if (subsidiary !== '14') return true;

            var vendor = itemReceipt.getText({
                fieldId: 'entity'
            });
            var customer = itemReceipt.getValue({
                fieldId: 'custbody41'
            });
            var poIdText = itemReceipt.getText({
                fieldId: 'createdfrom'
            });
            var purchaseOrderId = poIdText ? poIdText.split('#')[1] : '';
            var systemMonth = new Date().getMonth();
            var currentMonth = systemMonth + 1;

            var itemDetails = {};
            var itemCount = itemReceipt.getLineCount({
                sublistId: 'item'
            });
            log.debug({
                title: "Item Count",
                details: itemCount
            });

            for (var i = 0; i < itemCount; i++) {
                var itemreceive = itemReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    line: i
                });

                if (!itemreceive) continue;

                var itemCode = itemReceipt.getSublistText({
                    sublistId: 'item',
                    fieldId: 'itemname',
                    line: i
                });
                var quantity = itemReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                if (quantity) itemDetails[itemCode] = quantity;
            }

            var customRecordSearch = search.create({
                type: 'customrecord1027',
                filters: [
                    ['custrecord695', 'is', vendor],
                    'AND',
                    ['custrecord537', 'is', purchaseOrderId]
                ],
                columns: ['internalid', 'custrecord500', 'custrecord538']
            });

            var searchResults = customRecordSearch.run().getRange({
                start: 0,
                end: 999
            });

            log.debug({
                title: "Search Results",
                details: searchResults
            });

            if (searchResults.length === 0) {
                log.debug({
                    title: "PO Not Found",
                    details: "Prompting user for confirmation"
                });
                var confirmPO = window.confirm(
                    '⚠️ Warning! Please Check with CS Team First\n\n' +
                    'The Purchase Order is not found in any PO DRS. Do you still want to save this Item Receipt?');
                if (!confirmPO) return false;
            }

            for (var i = 0; i < searchResults.length; i++) {
                var result = searchResults[i];

                var customRecordId = result.getValue({
                    name: 'internalid'
                });
                var parentRecordId = result.getValue({
                    name: 'custrecord500'
                });
                var parentRecord = record.load({
                    type: 'customrecordpurchase_order_drs',
                    id: parentRecordId
                });

                var parentLocked = parentRecord.getValue({
                    fieldId: 'custrecord_in_edit'
                });
                var existingItemCode = result.getValue({
                    name: 'custrecord538'
                });

                if (itemDetails.hasOwnProperty(existingItemCode)) {
                    var matchedQuantity = itemDetails[existingItemCode];

                    var customRecord = record.load({
                        type: 'customrecord1027',
                        id: customRecordId,
                        isDynamic: true
                    });

                    var NetSuiteMonth = customRecord.getValue({
                        fieldId: 'custrecord501'
                    });
                    log.debug({
                        title: "NetSuiteMonth",
                        details: NetSuiteMonth
                    });

                    if (NetSuiteMonth !== currentMonth) {
                        log.debug({
                            title: "Skip",
                            details: "NetSuiteMonth does not match currentMonth"
                        });
                        continue;
                    }

                    var previousBal = customRecord.getValue({
                        fieldId: 'custrecord540'
                    });
                    customRecord.setValue({
                        fieldId: 'custrecord780',
                        value: previousBal
                    });
                    log.debug({
                        title: "previousBal",
                        details: previousBal
                    });

                    var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
                        var value = customRecord.getValue({
                            fieldId: fieldId
                        }) || 0;
                        return acc + value;
                    }, 0);

                    // log.debug({ title: "Sum for Item", details: { existingItemCode, sum, matchedQuantity } });

                    if (sum < matchedQuantity) {
                        var confirmQty = window.confirm(
                            '⚠️ Warning! Please Check with CS Team First\n\n' +
                            'The Quantity to Receive (' + matchedQuantity + ') for Item ' + existingItemCode + ' Exceeds The Scheduled Amount (' + sum + ').\n\n' +
                            'Do you still want to save this Item Receipt?'
                        );
                        if (!confirmQty) return false;
                    }

                    if (parentLocked) {
                        var queueRecord = record.create({
                            type: 'customrecord_sfli_po_drs_queue'
                        });
                        queueRecord.setValue({
                            fieldId: 'custrecord_queue_vendor',
                            value: vendor
                        });
                        queueRecord.setValue({
                            fieldId: 'custrecord_queue_customer',
                            value: customer
                        });
                        queueRecord.setValue({
                            fieldId: 'custrecord_queue_po',
                            value: purchaseOrderId
                        });
                        queueRecord.setValue({
                            fieldId: 'custrecord_queue_item',
                            value: existingItemCode
                        });
                        queueRecord.setValue({
                            fieldId: 'custrecord_queue_quantity',
                            value: matchedQuantity
                        });
                        queueRecord.save();
                        log.debug({
                            title: "Queued update",
                            details: customRecordId
                        });
                    } else {
                        var newPObal = previousBal - matchedQuantity;
                        newPObal = newPObal < 0 ? 0 : newPObal;
                        customRecord.setValue({
                            fieldId: 'custrecord540',
                            value: newPObal
                        });
                        log.debug({
                            title: "Updated custrecord540",
                            details: newPObal
                        });

                        fieldIdsToCheck.some(function (fieldId) {
                            var fieldValue = customRecord.getValue({
                                fieldId: fieldId
                            });

                            if (fieldValue < matchedQuantity && fieldValue > 0) {
                                customRecord.setValue({
                                    fieldId: fieldId,
                                    value: 0
                                });
                                matchedQuantity -= fieldValue;
                            } else if (fieldValue >= matchedQuantity) {
                                customRecord.setValue({
                                    fieldId: fieldId,
                                    value: fieldValue - matchedQuantity < 0 ? 0 : fieldValue - matchedQuantity
                                });
                                log.debug("Reduced fieldId", fieldValue - matchedQuantity < 0 ? 0 : fieldValue - matchedQuantity);
                                matchedQuantity = 0;
                            }
                            return matchedQuantity === 0;
                        });

                        var newSum = fieldIdsToCheck.reduce(function (acc, fieldId) {
                            var value = customRecord.getValue({
                                fieldId: fieldId
                            }) || 0;
                            return acc + value;
                        }, 0);

                        log.debug({
                            title: "newSum",
                            details: newSum
                        });

                        customRecord.setValue({
                            fieldId: 'custrecord775',
                            value: newPObal - newSum < 0 ? 0 : newPObal - newSum
                        });
                        log.debug("Set custrecord775", newPObal - newSum < 0 ? 0 : newPObal - newSum);

                        customRecord.save();
                        log.debug({
                            title: "Custom Record Saved",
                            details: customRecordId
                        });
                    }
                }
            }
        }
        log.debug({
            title: "saveRecord",
            details: "End saveRecord"
        });
        return true;
    }

    return {
        saveRecord: saveRecord
    };
});