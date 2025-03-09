/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
    const fieldIdsToCheck = [
        'custrecord788', 'custrecord789', 'custrecord790', 'custrecord791',
        'custrecord792', 'custrecord793', 'custrecord794', 'custrecord795',
        'custrecord796', 'custrecord797', 'custrecord798', 'custrecord799',
        'custrecord800', 'custrecord801', 'custrecord802', 'custrecord803',
        'custrecord804', 'custrecord805', 'custrecord806', 'custrecord807',
        'custrecord808', 'custrecord809', 'custrecord810', 'custrecord811',
        'custrecord812', 'custrecord813', 'custrecord814', 'custrecord815',
        'custrecord816', 'custrecord817', 'custrecord818'
    ];

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) {
            return;
        }

        try {
            var itemReceipt = context.newRecord;

            // Subsidiary check
            var subsidiary = itemReceipt.getValue({
                fieldId: 'subsidiary'
            });
            if (subsidiary !== '14') return;

            var vendor = itemReceipt.getValue({
                fieldId: 'entity'
            }); // Vendor ID
            var purchaseOrderId = itemReceipt.getText({
                fieldId: 'createdfrom'
            }).split('#')[1]; // PO ID

            var itemDetails = {}; // Object to store itemID => quantity

            // Extract item codes and quantities from Item Receipt
            var itemCount = itemReceipt.getLineCount({
                sublistId: 'item'
            });
            for (var i = 0; i < itemCount; i++) {
                var itemCode = itemReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                var itemQuantity = itemReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                itemDetails[itemCode] = itemQuantity;
            }

            log.debug('Extracted Item Receipt Data', itemDetails);

            // Search for existing custom records
            var customRecordSearch = search.create({
                type: 'customrecord1027', // Purchase Order DRS Sublist Line
                filters: [
                    ['custrecord695', 'is', vendor], // Vendor filter
                    'AND',
                    ['custrecord537', 'is', purchaseOrderId] // PO filter
                ],
                columns: ['internalid', 'custrecord538'] // Get Internal ID & Item Code
            });

            var searchResults = customRecordSearch.run().getRange({
                start: 0,
                end: 999
            });

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

                if (itemDetails.hasOwnProperty(existingItemCode)) {
                    var matchedQuantity = itemDetails[existingItemCode];

                    log.debug('Updating Custom Record', 'ID: ' + customRecordId + ', Item Code: ' + existingItemCode + ', Quantity: ' + matchedQuantity);

                    var customRecord = record.load({
                        type: 'customrecord1027',
                        id: customRecordId,
                        isDynamic: true
                    });

                    var previousBal = currentRecord.getValue({
                        fieldId: 'custrecord540'
                    });
                    currentRecord.getValue({
                        fieldId: 'custrecord780',
                        value: previousBal
                    });
                    currentRecord.setValue({
                        fieldId: 'custrecord540',
                        value: previousBal - matchedQuantity
                    });

                    var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
                        var value = currentRecord.getValue({
                            fieldId: fieldId
                        }) || 0; // Default to 0 if null/undefined
                        return acc + value;
                    }, 0);

                    var gap = sum - matchedQuantity;

                    CurrentRecord.setValue({
                        fieldId: 'custrecord775',
                        value: gap
                    })

                    // Loop through fields and update them
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
                                value: parseInt(fieldValue - matchedQuantity),
                            });
                            matchedQuantity = 0;
                        }

                        return matchedQuantity === 0; // Stop loop when matchedQuantity is zero
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