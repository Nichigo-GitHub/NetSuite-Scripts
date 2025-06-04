/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
define(['N/record', 'N/runtime', 'N/format', 'N/search'], function (record, runtime, format, search) {
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

    function pageInit(context) {
        var currentRecord = context.currentRecord;
        var contextMode = context.mode;

        if (contextMode === 'create') {
            var formNumber = currentRecord.getField({
                fieldId: 'custrecord_loading_form_num'
            });
            formNumber.isDisabled = true;
            var today = new Date();
            var formattedDate = format.parse({
                value: today,
                type: format.Type.DATE
            });

            currentRecord.setValue({
                fieldId: 'custrecord_date_num',
                value: formattedDate
            });
        }
    }

    function fieldChanged(context) {
        if (context.fieldId === 'custrecord_date_num') {
            var currentRecord = context.currentRecord;
            clearSublist(currentRecord);

            // Extract relevant data from the loading form record
            var deliveryDate = currentRecord.getValue({
                fieldId: 'custrecord_date_num'
            });

            if (!deliveryDate) return;

            var dateString = formatLongDate(deliveryDate);

            currentRecord.setValue({
                fieldId: 'custrecord_loading_form_num',
                value: 'Loading Form [' + dateString + ']'
            });

            var jsDate = new Date(deliveryDate);
            var month = jsDate.getMonth() + 1;
            var day = jsDate.getDate();
            var year = jsDate.getFullYear();

            var SO_DRS = search.load({
                id: 'customsearch4946'
            });

            // Modify search filters dynamically
            SO_DRS.filters.push(
                search.createFilter({
                    name: 'custrecord846',
                    operator: search.Operator.ANYOF,
                    values: month
                }),
                search.createFilter({
                    name: fieldIdsToCheck[day - 1],
                    operator: search.Operator.GREATERTHAN,
                    values: 0
                }),
                search.createFilter({
                    name: 'custrecord856',
                    operator: search.Operator.CONTAINS,
                    values: String(year)
                })
            );

            var results = [];
            SO_DRS.run().each(function (result) {
                var rowData = {};
                SO_DRS.columns.forEach(function (column) {
                    if (result.getValue(column)) {
                        rowData[column.name] = result.getValue(column);
                        log.debug({
                            title: rowData[column.name],
                            details: result.getValue(column)
                        });
                    }
                });

                results.push(rowData);
                return true;
            });

            log.debug('DR Search Results', JSON.stringify(results));

            results.forEach(function (result) {
                populateSublistLine(currentRecord, result);
            });
        }
    }

    function populateSublistLine(currentRecord, result) {
        currentRecord.selectNewLine({
            sublistId: sublistId
        });

        currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord850',
            value: result['custrecord784'] || ''
        });
        currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord851',
            value: result['custrecord785'] || ''
        });
        currentRecord.setCurrentSublistText({
            sublistId: sublistId,
            fieldId: 'custrecord852',
            text: result['custrecord786'] || ''
        });
        currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord853',
            value: result['formulanumeric'] || ''
        });
        currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord849',
            value: result['custrecord836'] || ''
        });

        currentRecord.commitLine({
            sublistId: sublistId
        });
    }

    function clearSublist(currentRecord) {
        var lineCount = currentRecord.getLineCount({
            sublistId: sublistId
        });
        for (var i = lineCount - 1; i >= 0; i--) {
            currentRecord.removeLine({
                sublistId: sublistId,
                line: i
            });
        }
    }

    function formatLongDate(dateObj) {
        if (!(dateObj instanceof Date)) {
            dateObj = new Date(dateObj);
        }
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});