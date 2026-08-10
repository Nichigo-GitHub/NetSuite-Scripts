/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'],
function(record, search, log) {

    var COUNTER_RECORD_TYPE = 'customrecord_sfli_acc_series';
    var COUNTER_RECORD_ID = 1;
    var SERIES_FIELD_ID = 'custrecord1363';
    var LAST_NUMBER_FIELD_ID = 'custrecord1353';

    function beforeSubmit(context) {

        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.COPY) {
            log.debug('Series Script Skipped', 'Not CREATE or COPY');
            return;
        }

        var rec = context.newRecord;

        try {

            var counterRec = record.load({
                type: COUNTER_RECORD_TYPE,
                id: COUNTER_RECORD_ID
            });

            var storedLastNumberRaw = counterRec.getValue({
                fieldId: LAST_NUMBER_FIELD_ID
            });

            var storedLastNumber = parseInt(storedLastNumberRaw || '0', 10);
            var maxUsed = getLastNumberFromSearch();
            var nextNumber = Math.max(storedLastNumber, maxUsed) + 1;
            var finalSeries = ('000000' + nextNumber).slice(-6);


            rec.setValue({
                fieldId: SERIES_FIELD_ID,
                value: finalSeries
            });

            var valueAfterSet = rec.getValue({
                fieldId: SERIES_FIELD_ID
            });
          
            record.submitFields({
                type: COUNTER_RECORD_TYPE,
                id: COUNTER_RECORD_ID,
                values: {
                    custrecord1353: nextNumber
                }
            });

            log.audit('Series Generated Successfully', {
                finalSeries: finalSeries,
                nextNumber: nextNumber
            });

        } catch (e) {
            log.error('Error Generating Series', {
                name: e.name,
                message: e.message,
                stack: e.stack
            });
            throw e;
        }
    }

    function afterSubmit(context) {

        if (context.type !== context.UserEventType.CREATE) {
            log.debug('After Submit Skipped', 'Not CREATE');
            return;
        }

        try {
            var rec = context.newRecord;

            var seriesValue = rec.getValue({
                fieldId: SERIES_FIELD_ID
            });

            if (!seriesValue) {
                log.debug('After Submit Skipped Update', 'Series value is blank on newRecord');
                return;
            }

            record.submitFields({
                type: rec.type,
                id: rec.id,
                values: {
                    custrecord1363: seriesValue
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            log.audit('After Submit Series Updated', {
                recordType: rec.type,
                recordId: rec.id,
                seriesValue: seriesValue
            });

        } catch (e) {
            log.error('After Submit Error', {
                name: e.name,
                message: e.message,
                stack: e.stack
            });
        }
    }

    function getLastNumberFromSearch() {
        var maxNum = 0;

        try {
            log.debug('Search Started', 'Looking for highest existing series');

            var mySearch = search.create({
                type: 'customrecord2279',
                filters: [
                    [SERIES_FIELD_ID, 'isnotempty', '']
                ],
                columns: [
                    search.createColumn({
                        name: SERIES_FIELD_ID,
                        sort: search.Sort.DESC
                    })
                ]
            });

            var results = mySearch.run().getRange({
                start: 0,
                end: 1
            });

            if (results && results.length > 0) {
                var lastValue = results[0].getValue(SERIES_FIELD_ID) || '';

                maxNum = parseInt(lastValue, 10) || 0;
            }

        } catch (e) {
            log.error('Search Error', {
                name: e.name,
                message: e.message,
                stack: e.stack
            });
        }

        return maxNum;
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});