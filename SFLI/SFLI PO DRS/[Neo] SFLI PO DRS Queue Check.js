/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {

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
        if (context.type !== context.UserEventType.EDIT) {
            return;
        }

        var rec = context.newRecord;
        var customer = rec.getValue({
            fieldId: 'custrecord_customer'
        });

        var queueSearch = search.create({
            type: 'customrecord_sfli_po_drs_queue',
            filters: [
                ['custrecord_queue_customer', 'is', customer]
            ],
            columns: ['internalid', 'custrecord_queue_po', 'custrecord_queue_item', 'custrecord_queue_quantity']
        });

        var queueResults = queueSearch.run().getRange({
            start: 0,
            end: 100
        });

        if (queueResults.length === 0)
            return;


        queueResults.forEach(function (queue) {
            var queuePo = queue.getValue('custrecord_queue_po');
            var queueItem = queue.getValue('custrecord_queue_item');
            var queueQuantity = queue.getValue('custrecord_queue_quantity');

            var drsLineSearch = search.create({
                type: 'customrecord1027',
                filters: [
                    ['custrecord537', 'is', queuePo],
                    'AND',
                    ['custrecord538', 'is', queueItem]
                ],
                columns: ['internalid']
            });

            var drsLineResults = drsLineSearch.run().getRange({
                start: 0,
                end: 100
            });

            if (drsLineResults.length > 0) {
                drsLineResults.forEach(function (drsLine) {
                    var drsLineId = drsLine.getValue('internalid');

                    var customRecord = record.load({
                        type: 'customrecord1027',
                        id: drsLineId,
                        isDynamic: true
                    });

                    var previousBal = customRecord.getValue({
                        fieldId: 'custrecord540'
                    });
                    customRecord.setValue({
                        fieldId: 'custrecord780',
                        value: previousBal
                    });

                    var newPObal = previousBal - queueQuantity;
                    newPObal = newPObal < 0 ? 0 : newPObal;
                    customRecord.setValue({
                        fieldId: 'custrecord540',
                        value: newPObal
                    });

                    fieldIdsToCheck.some(function (fieldId) {
                        var fieldValue = customRecord.getValue({
                            fieldId: fieldId
                        });

                        if (fieldValue < queueQuantity && fieldValue > 0) {
                            customRecord.setValue({
                                fieldId: fieldId,
                                value: 0
                            });
                            queueQuantity -= fieldValue;
                        } else if (fieldValue >= queueQuantity) {
                            customRecord.setValue({
                                fieldId: fieldId,
                                value: fieldValue - queueQuantity < 0 ? 0 : fieldValue - queueQuantity
                            });
                            queueQuantity = 0;
                        }

                        return queueQuantity === 0;
                    });

                    var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
                        var value = customRecord.getValue({
                            fieldId: fieldId
                        }) || 0;
                        return acc + value;
                    }, 0);

                    customRecord.setValue({
                        fieldId: 'custrecord775',
                        value: newPObal - sum < 0 ? 0 : newPObal - sum
                    });

                    customRecord.save();

                    // Delete the queue.id record after saving the custom record
                    record.delete({
                        type: 'customrecord_sfli_po_drs_queue',
                        id: queue.id
                    });
                });
            }
        });
    }

    return {
        afterSubmit: afterSubmit
    };
});