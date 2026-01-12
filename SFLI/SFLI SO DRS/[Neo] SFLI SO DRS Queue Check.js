/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {

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
        if (context.type !== context.UserEventType.EDIT) {
            return;
        }

        var rec = context.newRecord;
        var customer = rec.getValue({
            fieldId: 'custrecord782'
        });

        log.debug('Customer ID', customer);

        if (!customer) {
            log.debug('No customer found. Exiting script.');
            return;
        }

        var queueSearch = search.create({
            type: 'customrecord_sfli_so_drs_queue',
            filters: [
                search.createFilter({
                    name: 'custrecord_queue_customer_',
                    operator: search.Operator.IS,
                    values: customer
                })
            ],
            columns: ['custrecord_queue_so', 'custrecord_queue_item_', 'custrecord_queue_quantity_']
        });

        var queueResults = queueSearch.run().getRange({
            start: 0,
            end: 100
        });

        if (queueResults.length === 0)
            return;


        queueResults.forEach(function (queue) {
            var queueSo = queue.getValue('custrecord_queue_so');
            var queueItem = queue.getValue('custrecord_queue_item_');
            var queueQuantity = queue.getValue('custrecord_queue_quantity_');

            var drsLineSearch = search.create({
                type: 'customrecord1875',
                filters: [
                    ['custrecord786', 'equalto', queueSo],
                    'AND',
                    ['custrecord784', 'equalto', queueItem],
                    'AND',
                    ['custrecord846', 'equalto', new Date().getMonth() + 1],
                    'AND',
                    ['custrecord856', 'equalto', new Date().getFullYear()]
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
                        type: 'customrecord1875',
                        id: drsLineId,
                        isDynamic: true
                    });

                    var previousBal = customRecord.getValue({
                        fieldId: 'custrecord835'
                    });
                    customRecord.setValue({
                        fieldId: 'custrecord845',
                        value: previousBal
                    });

                    var newPObal = previousBal - queueQuantity;
                    newPObal = newPObal < 0 ? 0 : newPObal;
                    customRecord.setValue({
                        fieldId: 'custrecord835',
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

                    /* customRecord.setValue({
                        fieldId: 'custrecord775',
                        value: newPObal - sum < 0 ? 0 : newPObal - sum
                    }); */

                    customRecord.save();

                    // Delete the queue.id record after saving the custom record
                    record.delete({
                        type: 'customrecord_sfli_so_drs_queue',
                        id: queue.getValue('internalid')
                    });
                });
            }
        });
    }

    return {
        afterSubmit: afterSubmit
    };
});