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
        var rec = context.newRecord;

        if (context.type === context.UserEventType.EDIT) {
            var sublistLength = rec.getLineCount({ sublistId: 'recmachcustrecord_kppi_soa_details_link' }) || 0;
            var dateTo = rec.getValue({ fieldId: 'custrecord_kppi_soa_date_to' });
            var totalAmount = 0;
            var currentTransactionAmount = 0;
            var previousBalanceAmount = 0;

            for (var line = 0; line < sublistLength; line++) {
                var tranDate = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_kppi_soa_details_link',
                    fieldId: 'custrecord_kppi_soa_details_date',
                    line: line
                });
                var amount = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_kppi_soa_details_link',
                    fieldId: 'custrecord_kppi_soa_details_orig_amount',
                    line: line
                });
                var remarks = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_kppi_soa_details_link',
                    fieldId: 'custrecord_kppi_soa_details_remarks',
                    line: line
                }) || '';

                totalAmount += parseFloat(amount) || 0;

                if (isSameMonthYear(tranDate, dateTo)) {
                    currentTransactionAmount += parseFloat(amount) || 0;
                }

                var upperRemarks = remarks.toString().toUpperCase().trim();
                var allowedRemarks = [
                    /* 'ATTN',
                    'ATTENTION', */
                    '45 DAYS',
                    '60 DAYS',
                    '75 DAYS',
                    '90 DAYS',
                    'CUT OFF',
                    'CUT-OFF',
                    'UNPAID'
                ];

                var keepRemark = false;

                for (var i = 0; i < allowedRemarks.length; i++) {
                    if (upperRemarks.indexOf(allowedRemarks[i]) !== -1) {
                        keepRemark = true;
                        break;
                    }
                }

                if (!keepRemark)
                    remarks = '';

                if (upperRemarks === 'UNPAID' ||
                    upperRemarks === 'CUT OFF' ||
                    upperRemarks === 'CUT-OFF' ||
                    upperRemarks === '45 DAYS' ||
                    upperRemarks === '60 DAYS' ||
                    upperRemarks === '75 DAYS' ||
                    upperRemarks === '90 DAYS') {
                    previousBalanceAmount += parseFloat(amount) || 0;
                }
            }

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_total',
                value: totalAmount
            });

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_previous_balance',
                value: previousBalanceAmount
            });

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_current_transaction',
                value: currentTransactionAmount
            });
        }

        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.COPY) {
            return;
        }

        try {
            var sublistLength = rec.getLineCount({ sublistId: 'recmachcustrecord_kppi_soa_details_link' }) || 0;
            var dateTo = rec.getValue({ fieldId: 'custrecord_kppi_soa_date_to' });
            var totalAmount = 0;
            var currentTransactionAmount = 0;
            var previousBalanceAmount = 0;

            for (var line = 0; line < sublistLength; line++) {
                var tranDate = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_kppi_soa_details_link',
                    fieldId: 'custrecord_kppi_soa_details_date',
                    line: line
                });
                var amount = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_kppi_soa_details_link',
                    fieldId: 'custrecord_kppi_soa_details_orig_amount',
                    line: line
                });
                var remarks = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_kppi_soa_details_link',
                    fieldId: 'custrecord_kppi_soa_details_remarks',
                    line: line
                }) || '';

                totalAmount += parseFloat(amount) || 0;

                if (isSameMonthYear(tranDate, dateTo)) {
                    currentTransactionAmount += parseFloat(amount) || 0;
                }

                var upperRemarks = remarks.toString().toUpperCase().trim();
                var allowedRemarks = [
                    /* 'ATTN',
                    'ATTENTION', */
                    '45 DAYS',
                    '60 DAYS',
                    '75 DAYS',
                    '90 DAYS',
                    'CUT OFF',
                    'CUT-OFF',
                    'UNPAID'
                ];

                var keepRemark = false;

                for (var i = 0; i < allowedRemarks.length; i++) {
                    if (upperRemarks.indexOf(allowedRemarks[i]) !== -1) {
                        keepRemark = true;
                        break;
                    }
                }

                if (!keepRemark)
                    remarks = '';

                if (upperRemarks === 'UNPAID' ||
                    upperRemarks === 'CUT OFF' ||
                    upperRemarks === 'CUT-OFF' ||
                    upperRemarks === '45 DAYS' ||
                    upperRemarks === '60 DAYS' ||
                    upperRemarks === '75 DAYS' ||
                    upperRemarks === '90 DAYS') {
                    previousBalanceAmount += parseFloat(amount) || 0;
                }
            }

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_total',
                value: totalAmount
            });

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_previous_balance',
                value: previousBalanceAmount
            });

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_current_transaction',
                value: currentTransactionAmount
            });

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

    function normalizeDateValue(value) {
        if (!value) return null;

        if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
            return value;
        }

        if (typeof value === 'string') {
            try {
                return format.parse({
                    value: value,
                    type: format.Type.DATE
                });
            } catch (e) {
                log.debug('DATE PARSE ERROR', e);
            }
        }

        return null;
    }

    function isSameMonthYear(value, compareValue) {
        var dateObj = normalizeDateValue(value);
        var compareDateObj = normalizeDateValue(compareValue);

        if (!dateObj || !compareDateObj) return false;

        return dateObj.getMonth() === compareDateObj.getMonth() &&
            dateObj.getFullYear() === compareDateObj.getFullYear();
    }

    return {
        beforeSubmit: beforeSubmit
    };
});