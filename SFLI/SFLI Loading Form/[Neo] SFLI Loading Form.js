/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog', 'N/format', 'N/search', 'N/runtime'], function (record, dialog, format, search, runtime) {
    const sublistId = 'recmachcustrecord848';
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
    const today = new Date();
    const month = today.getMonth();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    function pageInit(context) {
        var currentRecord = context.currentRecord;
        var contextMode = context.mode;

        var userObj = runtime.getCurrentUser();
        var userId = userObj.id;
        var roleId = userObj.role;

        if (roleId == 1204 || userId == 10006) {
            currentRecord.setValue({
                fieldId: 'custrecord1242',
                value: true
            });
        }

        var IPDField = currentRecord.getValue({ fieldId: 'custrecord1242' });

        var formNumberField = currentRecord.getField({ fieldId: 'custrecord_loading_form_num' });
        formNumberField.isDisabled = true;

        if (contextMode === 'create') {
            if (IPDField) {
                var formattedDate = monthNames[month] + ' ' + today.getFullYear();
            } else {
                var formattedDate = format.parse({ value: today, type: format.Type.DATE });
                var longDate = formatLongDate(today);
            }
            // Check duplicates
            if (checkDuplicateLoadingForm(longDate, IPDField)) {
                dialog.alert({
                    title: 'Duplicate Loading Form',
                    message: 'A Loading Form for ' + longDate + ' already exists.'
                });
                return;
            }

            currentRecord.setValue({
                fieldId: 'custrecord_date_num',
                value: formattedDate
            });
        } else if (contextMode === 'edit') {
            clearSublist(currentRecord);
            handleDateChange(currentRecord);
        }
    }

    function fieldChanged(context) {
        if (context.fieldId === 'custrecord_date_num') {
            var currentRecord = context.currentRecord;
            clearSublist(currentRecord);
            handleDateChange(currentRecord);
        }
    }

    function handleDateChange(currentRecord) {
        var deliveryDate = currentRecord.getValue({ fieldId: 'custrecord_date_num' });
        if (!deliveryDate) return;

        var IPDField = currentRecord.getValue({ fieldId: 'custrecord1242' });

        if (IPDField) {
            var dateString = monthNames[new Date(deliveryDate).getMonth()] + ' ' + new Date(deliveryDate).getFullYear();
            currentRecord.setValue({
                fieldId: 'custrecord_loading_form_num',
                value: 'IPD Loading Form [' + dateString + ']'
            });
        } else {
            var dateString = formatLongDate(deliveryDate);
            currentRecord.setValue({
                fieldId: 'custrecord_loading_form_num',
                value: 'Loading Form [' + dateString + ']'
            });
        }

        var jsDate = new Date(deliveryDate);
        var month = jsDate.getMonth() + 1;
        var day = jsDate.getDate();
        var year = jsDate.getFullYear();

        var results = runDRSearch(currentRecord, month, day, year);
        results.forEach(function (result) {
            populateSublistLine(currentRecord, result, day, month, year);
        });
    }

    function runDRSearch(currentRecord, month, day, year) {
        var results = [];
        var IPDField = currentRecord.getValue({ fieldId: 'custrecord1242' });
        var finalFilters = [];
        var baseFilters = [
            ['custrecord846', search.Operator.ANYOF, month],
            'AND',
            [
                [
                    [fieldIdsToCheck[day - 1], search.Operator.GREATERTHAN, 0],
                    'OR',
                    ['custrecord933', search.Operator.GREATERTHAN, 0]
                ]
            ],
            'AND',
            ['custrecord856', search.Operator.CONTAINS, String(year)]/* ,
            'AND',
            ['custrecord786', search.Operator.CONTAINS, 'SO-SFLI-'] */
        ];
        var IPDFilters = [
            ['custrecord846', search.Operator.ANYOF, month],
            'AND',
            [
                [
                    [fieldIdsToCheck[0], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[1], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[2], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[3], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[4], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[5], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[6], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[7], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[8], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[9], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[10], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[11], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[12], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[13], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[14], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[15], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[16], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[17], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[18], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[19], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[20], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[21], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[22], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[23], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[24], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[25], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[26], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[27], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[28], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[29], search.Operator.GREATERTHAN, 0],
                    'OR',
                    [fieldIdsToCheck[30], search.Operator.GREATERTHAN, 0],
                    'OR',
                    ['custrecord933', search.Operator.GREATERTHAN, 0]
                ],
            ],
            'AND',
            ['custrecord856', search.Operator.CONTAINS, String(year)],
            'AND',
            ['custrecord786', search.Operator.CONTAINS, 'SFLI-SO-NIPS-']
        ];
        if (IPDField) {
            finalFilters = IPDFilters;
        } else {
            finalFilters = baseFilters;
        }
        try {
            log.debug('runDRSearch params', { month: month, day: day, year: year });

            var filters = finalFilters;
            log.debug('runDRSearch filters', JSON.stringify(filters));
            var columns = [
                'custrecord784',
                'custrecord785',
                'custrecord786',
                fieldIdsToCheck[0],
                fieldIdsToCheck[1],
                fieldIdsToCheck[2],
                fieldIdsToCheck[3],
                fieldIdsToCheck[4],
                fieldIdsToCheck[5],
                fieldIdsToCheck[6],
                fieldIdsToCheck[7],
                fieldIdsToCheck[8],
                fieldIdsToCheck[9],
                fieldIdsToCheck[10],
                fieldIdsToCheck[11],
                fieldIdsToCheck[12],
                fieldIdsToCheck[13],
                fieldIdsToCheck[14],
                fieldIdsToCheck[15],
                fieldIdsToCheck[16],
                fieldIdsToCheck[17],
                fieldIdsToCheck[18],
                fieldIdsToCheck[19],
                fieldIdsToCheck[20],
                fieldIdsToCheck[21],
                fieldIdsToCheck[22],
                fieldIdsToCheck[23],
                fieldIdsToCheck[24],
                fieldIdsToCheck[25],
                fieldIdsToCheck[26],
                fieldIdsToCheck[27],
                fieldIdsToCheck[28],
                fieldIdsToCheck[29],
                fieldIdsToCheck[30],
                'custrecord836',
                'custrecord933'
            ];
            log.debug('runDRSearch columns', columns);

            var SO_DRS = search.create({
                type: 'customrecord1875',
                filters: filters,
                columns: columns
            });

            SO_DRS.run().each(function (result) {
                var rowData = {};
                SO_DRS.columns.forEach(function (column) {
                    rowData[column.name] = result.getValue(column) || '';
                });
                log.debug('runDRSearch result row', rowData);
                results.push(rowData);
                return true;
            });
            log.debug('runDRSearch total results', results.length);
        } catch (e) {
            log.error('runDRSearch error', e.message);
        }
        return results;
    }

    function populateSublistLine(currentRecord, result, day, month, year) {
        var IPDField = currentRecord.getValue({ fieldId: 'custrecord1242' });

        if (IPDField) {
            for (var i = 0; i < 31; i++) {
                if (result[fieldIdsToCheck[i]] > 0) {
                    currentRecord.selectNewLine({ sublistId: sublistId });
                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord850', value: result['custrecord784'] });
                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord851', value: result['custrecord785'] });
                    currentRecord.setCurrentSublistText({ sublistId: sublistId, fieldId: 'custrecord852', text: result['custrecord786'] });
                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord934', value: result['custrecord933'] || 0 });
                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord849', value: result['custrecord836'] });

                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord853', value: Number(result[fieldIdsToCheck[i]]) || 0 });

                    var lineDate = new Date(year, month - 1, i + 1);
                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord854', value: lineDate });
                    currentRecord.commitLine({ sublistId: sublistId });
                }
            }
        } else {
            currentRecord.selectNewLine({ sublistId: sublistId });
            currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord850', value: result['custrecord784'] });
            currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord851', value: result['custrecord785'] });
            currentRecord.setCurrentSublistText({ sublistId: sublistId, fieldId: 'custrecord852', text: result['custrecord786'] });
            currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord934', value: result['custrecord933'] || 0 });
            currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord849', value: result['custrecord836'] });

            currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord853', value: result[fieldIdsToCheck[day - 1]] || 0 });

            currentRecord.commitLine({ sublistId: sublistId });
        }
    }

    function checkDuplicateLoadingForm(formattedDate, IPDField) {
        if (IPDField) {
            var textToMatch = 'IPD Loading Form [' + formattedDate + ']';
        } else {
            var textToMatch = 'Loading Form [' + formattedDate + ']';
        }

        var duplicateSearch = search.create({
            type: 'customrecord_sfli_loading_form_dtls',
            filters: [
                ['custrecord_loading_form_num', search.Operator.IS, textToMatch]
            ],
            columns: ['internalid']
        });

        var result = duplicateSearch.run().getRange({ start: 0, end: 1 });

        return result && result.length > 0;
    }

    function clearSublist(currentRecord) {
        var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
        for (var i = lineCount - 1; i >= 0; i--) {
            currentRecord.removeLine({ sublistId: sublistId, line: i });
        }
    }

    function formatLongDate(dateObj) {
        if (!(dateObj instanceof Date)) dateObj = new Date(dateObj);
        return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});