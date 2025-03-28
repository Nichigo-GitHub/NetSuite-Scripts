/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
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

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) {
            log.debug('Exit', 'Not a CREATE event');
            return;
        }

        try {
            var itemReceipt = context.newRecord;
            log.debug('Script Execution', 'Processing Item Receipt ID: ' + itemReceipt.id);

            // Subsidiary check
            var subsidiary = itemReceipt.getValue({
                fieldId: 'subsidiary'
            });
            log.debug('Subsidiary', 'Subsidiary ID: ' + subsidiary);
            if (subsidiary !== '14') {
                log.debug('Exit', 'Subsidiary is not 14');
                return;
            }

            var vendor = itemReceipt.getText({
                fieldId: 'entity'
            });
            var purchaseOrderId = itemReceipt.getText({
                fieldId: 'createdfrom'
            }).split('#')[1];
            log.debug('Vendor & PO', 'Vendor: ' + vendor + ', PO ID: ' + purchaseOrderId);

            var itemDetails = {}; // Object to store itemID => quantity
            var itemCount = itemReceipt.getLineCount({
                sublistId: 'item'
            });
            log.debug('Item Count', 'Total Items: ' + itemCount);

            // Extract item codes and quantities
            for (var i = 0; i < itemCount; i++) {
                var itemCode = itemReceipt.getSublistText({
                    sublistId: 'item',
                    fieldId: 'itemname',
                    line: i
                });
                var itemQuantity = itemReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                if (itemQuantity) {
                    itemDetails[itemCode] = itemQuantity;
                }
            }
            log.debug('Extracted Item Receipt Data', JSON.stringify(itemDetails));

            // Search for existing custom records
            var customRecordSearch = search.create({
                type: 'customrecord1027',
                filters: [
                    ['custrecord695', 'is', vendor],
                    'AND',
                    ['custrecord537', 'is', purchaseOrderId]
                ],
                columns: ['internalid', 'custrecord538']
            });

            var searchResults = customRecordSearch.run().getRange({
                start: 0,
                end: 999
            });
            log.debug('Custom Record Search', 'Records Found: ' + searchResults.length);

            if (searchResults.length === 0) {
                log.debug('No matching custom records found');
                return;
            }

            searchResults.forEach(function (result) {
                var customRecordId = result.getValue({
                    name: 'internalid'
                });
                var existingItemCode = result.getValue({
                    name: 'custrecord538'
                });
                log.debug('Processing Custom Record', 'ID: ' + customRecordId + ', Item Code: ' + existingItemCode);

                if (itemDetails.hasOwnProperty(existingItemCode)) {
                    var matchedQuantity = itemDetails[existingItemCode];
                    log.debug('Match Found', 'Item Code: ' + existingItemCode + ', Quantity: ' + matchedQuantity);

                    var customRecord = record.load({
                        type: 'customrecord1027',
                        id: customRecordId,
                        isDynamic: true
                    });

                    var previousBal = customRecord.getValue({
                        fieldId: 'custrecord540'
                    });
                    log.debug('Previous Balance', 'Value: ' + previousBal);

                    customRecord.setValue({
                        fieldId: 'custrecord780',
                        value: previousBal
                    });
                    customRecord.setValue({
                        fieldId: 'custrecord540',
                        value: previousBal - matchedQuantity
                    });

                    var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
                        var value = customRecord.getValue({
                            fieldId: fieldId
                        }) || 0;
                        return acc + value;
                    }, 0);

                    var gap = sum - matchedQuantity;
                    log.debug('Gap Calculation', 'Sum: ' + sum + ', Gap: ' + gap);

                    customRecord.setValue({
                        fieldId: 'custrecord775',
                        value: gap
                    });

                    fieldIdsToCheck.some(function (fieldId) {
                        var fieldValue = customRecord.getValue({
                            fieldId: fieldId
                        });
                        log.debug('Checking Field', 'Field: ' + fieldId + ', Value: ' + fieldValue);

                        if (fieldValue < matchedQuantity && fieldValue > 0) {
                            customRecord.setValue({
                                fieldId: fieldId,
                                value: 0
                            });
                            matchedQuantity -= fieldValue;
                        } else if (fieldValue >= matchedQuantity) {
                            customRecord.setValue({
                                fieldId: fieldId,
                                value: parseInt(fieldValue - matchedQuantity)
                            });
                            matchedQuantity = 0;
                        }

                        return matchedQuantity === 0;
                    });

                    var savedRecordId = customRecord.save();
                    log.debug('Custom Record Updated', 'ID: ' + savedRecordId);
                }
            });

        } catch (error) {
            log.error('Error in afterSubmit', error);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});