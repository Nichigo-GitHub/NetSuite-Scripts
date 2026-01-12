/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function afterSubmit(context) {
        var rec = context.newRecord;
        var customForm = rec.getValue({ fieldId: 'customform' });
        var DRno = rec.getValue({ fieldId: 'tranid' });
        var invoiceNum = rec.getValue({ fieldId: 'custbody29' });

        log.debug('Custom Form', customForm);
        log.debug('invoiceNum', invoiceNum);
        log.debug('DR number', DRno);

        if (invoiceNum) {
            log.debug('Already have Invoice number ', invoiceNum);
            return;
        } else {
            if (context.type != context.UserEventType.CREATE) {
                log.debug('Context type is not CREATE Exiting script.', context.type);
                return;
            }
        }

        if (customForm !== '123') {
            log.debug('Custom form does not match. Exiting script.', customForm);
            return;
        }

        if (DRno.indexOf('SFLI-DR-') == -1) {
            log.debug('DR number does not match pattern. Exiting script.', DRno);
            return;
        }

        var mySearch = search.load({
            id: 'customsearch5273'
        });
        mySearch.filters.push(
            search.createFilter({
                name: 'custrecord_eh_record_type',
                operator: search.Operator.IS,
                values: 'customrecord1874'
            }),
            search.createFilter({
                name: 'custrecord_eh_record_id',
                operator: search.Operator.EQUALTO,
                values: rec.id
            }),
            search.createFilter({
                name: 'custrecord_eh_active_session',
                operator: search.Operator.IS,
                values: true
            })
        );
        var searchResult = mySearch.run().getRange({ start: 0, end: 1000 });

        if (searchResult.length > 0) {
            var customer = rec.getValue('entity');
            var createdFrom = rec.getText('createdfrom');
            var soNumber = createdFrom.replace('Sales Order #', '');

            var Items = rec.getLineCount({ sublistId: 'item' });
            log.debug('Number of Items', Items);

            for (var i = 0; i < Items; i++) {
                log.debug('Processing item ' + i + ' in queue creation');
                var fields = rec.getSublistFields({ sublistId: 'item' });
                for (var f = 0; f < fields.length; f++) {
                    var fieldId = fields[f];
                    var value = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: fieldId,
                        line: i
                    });
                    log.debug('Line ' + i + ' Field ' + fieldId + ': ' + value);
                }
                var item = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var DRquantity = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                if (!DRquantity || DRquantity <= 0) {
                    log.debug('Skipping item ' + i + ' due to zero or negative quantity', {
                        item: item,
                        DRquantity: DRquantity
                    });
                    continue;
                }

                var queueRecord = record.create({
                    type: 'customrecord_sfli_so_drs_queue'
                });
                queueRecord.setValue({
                    fieldId: 'custrecord_queue_customer_',
                    value: customer
                });
                queueRecord.setValue({
                    fieldId: 'custrecord_queue_so',
                    value: soNumber
                });
                queueRecord.setValue({
                    fieldId: 'custrecord_queue_item_',
                    value: item
                });
                queueRecord.setValue({
                    fieldId: 'custrecord_queue_quantity_',
                    value: DRquantity
                });

                queueRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Queue record created', queueRecord.id);
            }
        } else {
            var createdFrom = rec.getText('createdfrom');
            var soNumber = createdFrom.replace('Sales Order #', '');
            log.debug('SO Number', soNumber);

            var Items = rec.getLineCount({ sublistId: 'item' });
            log.debug('Number of Items', Items);

            for (var i = 0; i < Items; i++) {
                /* var fields = rec.getSublistFields({ sublistId: 'item' });
                for (var f = 0; f < fields.length; f++) {
                    var fieldId = fields[f];
                    var value = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: fieldId,
                        line: i
                    });
                    log.debug('Line ' + i + ' Field ' + fieldId + ': ' + value);
                } */
                var item = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var DRquantity = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                if (!DRquantity || DRquantity <= 0) {
                    /* log.debug('Skipping item ' + i + ' due to zero or negative quantity', {
                        item: item,
                        DRquantity: DRquantity
                    }); */
                    continue;
                }

                log.debug('Processing item ' + i, {
                    item: item,
                    DRquantity: DRquantity
                });

                var SOdrs = search.create({
                    type: 'customrecord1875',
                    filters: [
                        search.createFilter({
                            name: 'custrecord786',
                            operator: search.Operator.IS,
                            values: soNumber
                        }),
                        search.createFilter({
                            name: 'custrecord784',
                            operator: search.Operator.ANYOF,
                            values: item
                        }),
                        search.createFilter({
                            name: 'custrecord846',
                            operator: search.Operator.ANYOF,
                            values: new Date().getMonth() + 1
                        }),
                        search.createFilter({
                            name: 'custrecord856',
                            operator: search.Operator.IS,
                            values: new Date().getFullYear()
                        })
                    ]
                }).run().getRange({ start: 0, end: 1 });

                log.debug('SOdrs filters', {
                    soNumber: soNumber,
                    item: item,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                });

                if (SOdrs.length > 0) {
                    log.debug('Found DRS records for item ' + item + ': ' + SOdrs.length);
                    for (var j = 0; j < SOdrs.length; j++) {
                        log.debug('Processing DRS record ' + j + ', ID: ' + SOdrs[j].id);
                        var drsRecord = record.load({
                            type: 'customrecord1875',
                            id: SOdrs[j].id
                        });

                        var previousTotalDRQty = drsRecord.getValue({
                            fieldId: 'custrecord845'
                        });
                        log.debug('Previous Total DR Quantity', previousTotalDRQty);

                        var newTotalDRQty = parseFloat(previousTotalDRQty) + parseFloat(DRquantity);
                        drsRecord.setValue({
                            fieldId: 'custrecord835',
                            value: newTotalDRQty
                        });
                        log.debug('Updated Total DR Quantity', newTotalDRQty);

                        for (var k = 788; k <= 818; k++) {
                            var fieldValue = drsRecord.getValue({
                                fieldId: 'custrecord' + k
                            });

                            if (!fieldValue || fieldValue <= 0) {
                                continue;
                            }

                            log.debug('custrecord' + k, fieldValue);

                            if (fieldValue > DRquantity) {
                                drsRecord.setValue({
                                    fieldId: 'custrecord' + k,
                                    value: fieldValue - DRquantity
                                });

                                log.debug('Updated custrecord' + k, fieldValue - DRquantity);
                                DRquantity = 0;
                                break;
                            } else if (fieldValue <= DRquantity) {
                                drsRecord.setValue({
                                    fieldId: 'custrecord' + k,
                                    value: 0
                                });

                                DRquantity -= fieldValue;
                                log.debug('Updated custrecord' + k, 0);
                            }

                            if (!DRquantity || DRquantity <= 0) {
                                break;
                            }
                        }

                        drsRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug('DRS Record Updated', 'Record ID: ' + SOdrs[j].id);
                    }
                    log.debug('Finished processing DRS records for item ' + i);
                } else {
                    log.debug('No DRS records found for item ' + item);
                }
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});