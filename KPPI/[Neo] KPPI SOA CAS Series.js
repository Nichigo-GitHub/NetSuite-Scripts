/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
    var COUNTER_RECORD_TYPE = 'customrecord_cas_kppi_series';
    var COUNTER_RECORD_ID = 2;
    var SERIES_FIELD_ID = 'custrecord_kppi_soa_code';

    var PREFIX_MAP = {
        1: 'SOAM',
        2: 'SOAL',
        3: 'SOAF',
        4: 'SOAC',
        5: 'SOAM'
    };

    var COUNTER_FIELD_MAP = {
        1: 'custrecord_laguna_soa_cas_series',
        2: 'custrecord_lima_soa_cas_series',
        3: 'custrecord_fpip_soa_cas_series',
        4: 'custrecord_cebu_soa_cas_series',
        5: 'custrecord_laguna_soa_cas_series'
    };

    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.COPY) {
            return;
        }

        var rec = context.newRecord;

        try {
            var branch = rec.getValue({
                fieldId: 'custrecord_kppi_soa_branch'
            });

            var seriesPrefix = PREFIX_MAP[branch];
            var fieldIdToUpdate = COUNTER_FIELD_MAP[branch];

            if (!seriesPrefix)
                throw Error('Unsupported branch: ' + branch);

            if (!fieldIdToUpdate)
                throw Error('No counter field configured for branch: ' + branch);

            var counterRec = record.load({
                type: COUNTER_RECORD_TYPE,
                id: COUNTER_RECORD_ID
            });

            var lastSeriesValue = counterRec.getValue({
                fieldId: fieldIdToUpdate
            });

            var lastCounterNumber = extractSeriesNumber(lastSeriesValue);
            var maxUsed = getLastNumberFromSearch(seriesPrefix);
            var nextSeriesNumber = Math.max(lastCounterNumber, maxUsed) + 1;
            var finalSeries = seriesPrefix + pad(nextSeriesNumber);

            log.debug({
                title: 'Series Calculation',
                details: {
                    branch: branch,
                    prefix: seriesPrefix,
                    counterValue: lastSeriesValue,
                    counterNumber: lastCounterNumber,
                    maxUsedFromSearch: maxUsed,
                    nextSeriesNumber: nextSeriesNumber,
                    finalSeries: finalSeries
                }
            });

            rec.setValue({
                fieldId: SERIES_FIELD_ID,
                value: finalSeries
            });

            record.submitFields({
                type: COUNTER_RECORD_TYPE,
                id: COUNTER_RECORD_ID,
                values: (function () {
                    var obj = {};
                    obj[fieldIdToUpdate] = finalSeries;
                    return obj;
                })()
            });

            log.audit({
                title: 'Series Generated Successfully',
                details: finalSeries
            });
        } catch (e) {
            log.error({
                title: 'Error Generating Series',
                details: {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                }
            });

            throw e;
        }
    }

    function getLastNumberFromSearch(seriesPrefix) {
        var maxNum = 0;

        try {
            var mySearch = search.create({
                type: 'customrecord_kppi_soa',
                filters: [
                    [SERIES_FIELD_ID, 'startswith', seriesPrefix],
                    'AND',
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

            if (results.length) {
                var lastValue = results[0].getValue(SERIES_FIELD_ID) || '';

                maxNum = extractSeriesNumber(lastValue);
            }
        } catch (e) {
            log.error({
                title: 'Search Error',
                details: e
            });
        }

        return maxNum;
    }

    function extractSeriesNumber(series) {
        if (!series) return 0;

        var match = String(series).match(/\d+$/);

        return match ? parseInt(match[0], 10) : 0;
    }

    function pad(number) {
        number = String(number);

        while (number.length < 7)
            number = '0' + number;

        return number;
    }

    return {
        beforeSubmit: beforeSubmit
    };
});