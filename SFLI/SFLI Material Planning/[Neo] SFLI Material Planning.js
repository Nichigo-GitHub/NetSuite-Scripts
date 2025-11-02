/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    var SOdrsFields = [
        "custrecord862", "custrecord863", "custrecord864", "custrecord865", "custrecord866",
        "custrecord867", "custrecord868", "custrecord869", "custrecord870", "custrecord871",
        "custrecord872", "custrecord873", "custrecord874", "custrecord875", "custrecord876",
        "custrecord877", "custrecord878", "custrecord879", "custrecord880", "custrecord881",
        "custrecord882", "custrecord883", "custrecord884", "custrecord885", "custrecord886",
        "custrecord887", "custrecord888", "custrecord889", "custrecord890", "custrecord891",
        "custrecord892"
    ];
    var POdrsFields = [
        "custrecord894", "custrecord895", "custrecord896", "custrecord897", "custrecord898",
        "custrecord899", "custrecord900", "custrecord901", "custrecord902", "custrecord903",
        "custrecord904", "custrecord905", "custrecord906", "custrecord907", "custrecord908",
        "custrecord909", "custrecord910", "custrecord911", "custrecord912", "custrecord913",
        "custrecord914", "custrecord915", "custrecord916", "custrecord917", "custrecord918",
        "custrecord919", "custrecord920", "custrecord921", "custrecord922", "custrecord923",
        "custrecord924"
    ];
    var forecastDRSfields = [
        'custrecord946', 'custrecord947', 'custrecord948', 'custrecord949',
        'custrecord950', 'custrecord951', 'custrecord952', 'custrecord953',
        'custrecord954', 'custrecord955'
    ];
    var forecastDRSkeys = [
        "1 - 3", "4 - 6", "7 - 9", "10 - 12",
        "13 - 15", "16 - 18", "19 - 21", "22 - 24", "25 - 27", "28 - 31"
    ];
    var forecastDRSfieldIds = [
        "custrecord977", "custrecord978", "custrecord979", "custrecord980", "custrecord981",
        "custrecord982", "custrecord983", "custrecord984", "custrecord985", "custrecord986"
    ];

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        log.error({ title: 'fieldChanged Triggered', details: 'fieldId: ' + fieldId });

        // Trigger only when custrecord858 changes
        if (fieldId === 'custrecord858') {
            var custrecord858Value = currentRecord.getValue({
                fieldId: 'custrecord858'
            });
            log.error({ title: 'custrecord858Value', details: custrecord858Value });

            var thisMonth = currentRecord.getValue({
                fieldId: 'custrecord_month'
            });
            log.error({ title: 'thisMonth', details: thisMonth });

            if (!custrecord858Value) {
                log.error({ title: 'No custrecord858Value', details: 'Exiting' });
                return;
            }

            // Check for existing active Material Forecast
            var thisYear = (new Date()).getFullYear().toString();
            log.error({ title: 'thisYear', details: thisYear });
            var forecastExists = false;
            search.create({
                type: 'customrecord2095',
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord858', 'is', custrecord858Value],
                    'AND',
                    ['custrecord_month', 'is', thisMonth]
                    /* 'AND',
                    ['custrecord925', 'onorafter', thisYear + '-01-01'] */
                ],
                columns: ['internalid']
            }).run().each(function (result) {
                log.error({ title: 'Forecast Exists Result', details: JSON.stringify(result) });
                forecastExists = true;
                return false; // stop after first match 
            });

            if (forecastExists) {
                var monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                var monthName = monthNames[thisMonth - 1] || thisMonth;
                log.error({ title: 'Duplicate Forecast', details: "An Active Material Forecast for " + custrecord858Value + " on " + monthName + " " + thisYear + " already exists" });
                alert("An Active Material Forecast for " + custrecord858Value + " on " + monthName + " " + thisYear + " already exists");
                return;
            }

            // Load the saved search
            log.error({ title: 'Start SO DRS Loading', details: 'customsearch5062' });
            var SOdrsSearch = search.load({
                id: 'customsearch5062'
            });

            // Add filter: custrecord836 anyof custrecord858 value
            SOdrsSearch.filters = SOdrsSearch.filters.concat([
                search.createFilter({
                    name: 'custrecord836',
                    operator: search.Operator.ANYOF,
                    values: [custrecord858Value]
                })
            ]);
            SOdrsSearch.filters = SOdrsSearch.filters.concat([
                search.createFilter({
                    name: 'custrecord846',
                    operator: search.Operator.ANYOF,
                    values: [thisMonth.toString()]
                })
            ]);
            SOdrsSearch.filters = SOdrsSearch.filters.concat([
                search.createFilter({
                    name: 'custrecord856',
                    operator: search.Operator.IS,
                    values: [thisYear]
                })
            ]);
            log.error({ title: 'Added SOdrsSearch filter', details: JSON.stringify(SOdrsSearch.filters) });

            // Run the search and get summary results
            var summaryResults = [];
            var separateResults = [];
            log.error({ title: 'Running SOdrsSearch', details: '' });
            SOdrsSearch.run().each(function (result) {
                separateResults.push(result);
                log.error({ title: 'SOdrsSearch Result', details: JSON.stringify(result) });
                return true;
            });
            log.error('All Separate Results:', separateResults);

            SOdrsSearch.run().each(function (result) {
                var summaryRow = {};
                SOdrsSearch.columns.forEach(function (col) {
                    var colKey = col.label || col.name;
                    var colNum = parseInt(colKey, 10);
                    log.error({ title: 'Processing Column', details: 'colKey: ' + colKey + ', colNum: ' + colNum });
                    if (!isNaN(colNum) && colNum >= 1 && colNum <= 31) {
                        var value = col.summary ?
                            result.getValue({
                                name: col.name,
                                summary: col.summary
                            }) :
                            result.getValue(col);
                        log.error({ title: 'Numeric Column Value', details: value });
                        if (value > 0) {
                            summaryRow[colKey] = value;
                        }
                    } else if (colKey === 'FG Item' || colKey === 'Component') {
                        if (col.summary) {
                            summaryRow[colKey] = result.getValue({
                                name: col.name,
                                summary: col.summary
                            });
                        } else {
                            summaryRow[colKey] = result.getValue(col);
                        }
                        log.error({ title: 'FG/Component Value', details: summaryRow[colKey] });
                    } else if (forecastDRSkeys.includes(colKey)) {
                        var value = col.summary ?
                            result.getValue({
                                name: col.name,
                                summary: col.summary
                            }) :
                            result.getValue(col);
                        summaryRow[colKey] = value;
                        log.error({ title: 'Forecast DRS Field Value', details: value });
                    }
                });
                summaryResults.push(summaryRow);
                log.error({ title: 'Summary Row', details: JSON.stringify(summaryRow) });
                return true;
            });

            log.error('Summary Results Count:', summaryResults.length);
            log.error('Summary Results:', summaryResults);

            var sublistId = 'recmachcustrecord859';
            var loopLength = summaryResults.length;
            var components = [];
            log.error({ title: 'Start Forecast DRS Loading', details: 'loopLength: ' + loopLength });
            for (var line = 0; line < loopLength; line++) {
                var summaryRow = summaryResults[line];
                log.error({ title: 'Processing Summary Row', details: JSON.stringify(summaryRow) });
                if (!summaryRow) break;

                var itemId = summaryRow["Component"];
                log.error({ title: 'itemId', details: itemId });
                if (!itemId || itemId === '' || itemId === null) {
                    log.error({
                        title: 'Skipping row: Missing Component',
                        details: 'Line: ' + line + ', summaryRow: ' + JSON.stringify(summaryRow)
                    });
                    continue;
                }

                var itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype', 'type']
                });
                log.error({ title: 'itemType', details: JSON.stringify(itemType) });

                if (itemType.type && itemType.type[0] && itemType.type[0].value === 'Assembly') {
                    log.error({ title: 'Assembly Item Detected', details: itemId });
                    var memberSearch = search.create({
                        type: search.Type.ASSEMBLY_ITEM,
                        filters: [
                            ['internalid', 'is', itemId]
                        ],
                        columns: ['memberitem']
                    });
                    var memberSearchResults = memberSearch.run().getRange({
                        start: 0,
                        end: 999
                    });
                    log.error({ title: 'memberSearchResults', details: JSON.stringify(memberSearchResults) });
                    for (var m = 0; m < memberSearchResults.length; m++) {
                        var memberItemId = memberSearchResults[m].getValue('memberitem');
                        log.error({ title: 'memberItemId', details: memberItemId });
                        if (memberItemId && memberItemId !== '464681') {
                            log.error('Processing Summary Row ' + (line + 1) + ':', JSON.stringify(summaryRow) + ' | Member Item ID: ' + memberItemId);
                            currentRecord.selectNewLine({
                                sublistId: sublistId
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord860',
                                value: summaryRow["FG Item"]
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord861',
                                value: summaryRow["Component"]
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord893',
                                value: memberItemId
                            });
                            var custrecord893Text = currentRecord.getCurrentSublistText({
                                sublistId: sublistId,
                                fieldId: 'custrecord893'
                            });
                            // Store member item ID and its display text for later use
                            components.push({
                                id: memberItemId,
                                text: custrecord893Text
                            });
                            log.error('Setting 1 Forecast DRS fields for line ' + (line + 1), summaryRow);
                            Object.keys(summaryRow).forEach(function (key) {
                                log.error('Forecast DRS field check', 'key: ' + key);
                                if (key.indexOf(" - ") !== -1) {
                                    log.error('key.indexOf(" - ")', key.indexOf(" - "));
                                    var forecastIdx = forecastDRSkeys.indexOf(key);
                                    if (forecastIdx !== -1) {
                                        log.error('Forecast DRS field found', 'Key: ' + key + ' | Index: ' + forecastIdx);
                                        var fieldId = forecastDRSfieldIds[forecastIdx];
                                        currentRecord.setCurrentSublistValue({
                                            sublistId: sublistId,
                                            fieldId: fieldId,
                                            value: summaryRow[key]
                                        });
                                        log.error('Set Forecast DRS field by key', 'Field ID: ' + fieldId + ' | Value: ' + summaryRow[key]);
                                    }
                                } else {
                                    var idx = parseInt(key, 10);
                                    log.error('Forecast DRS field check', 'key: ' + key + ' | Index: ' + idx);
                                    if (!isNaN(idx) && idx >= 1 && idx <= 31) {
                                        var fieldId = SOdrsFields[idx - 1];
                                        currentRecord.setCurrentSublistValue({
                                            sublistId: sublistId,
                                            fieldId: fieldId,
                                            value: summaryRow[key]
                                        });
                                        log.error('Set Forecast DRS field', 'Field ID: ' + fieldId + ' | Value: ' + summaryRow[key]);
                                    }
                                }
                            });
                            currentRecord.commitLine({
                                sublistId: sublistId
                            });
                            loopLength++;
                        }
                    }
                } else if (itemType.type && itemType.type[0] && itemType.type[0].value === 'InvtPart') {
                    log.error({ title: 'Inventory Part Detected', details: itemId });
                    currentRecord.selectNewLine({
                        sublistId: sublistId
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord860',
                        value: summaryRow["FG Item"]
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord893',
                        value: summaryRow["Component"]
                    });
                    var custrecord893Text = currentRecord.getCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: 'custrecord893'
                    });
                    // Store member item ID and its display text for later use
                    components.push({
                        id: summaryRow["Component"],
                        text: custrecord893Text
                    });
                    Object.keys(summaryRow).forEach(function (key) {
                        log.error('Forecast DRS field check', 'key: ' + key);
                        if (key.indexOf(" - ") !== -1) {
                            log.error('key.indexOf(" - ")', key.indexOf(" - "));
                            var forecastIdx = forecastDRSkeys.indexOf(key);
                            if (forecastIdx !== -1) {
                                log.error('Forecast DRS field found', 'Key: ' + key + ' | Index: ' + forecastIdx);
                                var fieldId = forecastDRSfieldIds[forecastIdx];
                                currentRecord.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: fieldId,
                                    value: summaryRow[key]
                                });
                                log.error('Set Forecast DRS field by key', 'Field ID: ' + fieldId + ' | Value: ' + summaryRow[key]);
                            }
                        } else {
                            var idx = parseInt(key, 10);
                            log.error('Forecast DRS field check', 'key: ' + key + ' | Index: ' + idx);
                            if (!isNaN(idx) && idx >= 1 && idx <= 31) {
                                var fieldId = SOdrsFields[idx - 1];
                                currentRecord.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: fieldId,
                                    value: summaryRow[key]
                                });
                                log.error('Set Forecast DRS field', 'Field ID: ' + fieldId + ' | Value: ' + summaryRow[key]);
                            }
                        }
                    });
                    currentRecord.commitLine({
                        sublistId: sublistId
                    });
                }
            }
            var lineCount = currentRecord.getLineCount({
                sublistId: sublistId
            });
            var thisMonthStr = thisMonth.toString();

            log.error({
                title: 'Components',
                details: components
            });
            log.error({
                title: 'Components Count',
                details: components.length
            });
            log.error({ title: 'Start PO DRS Loading', details: 'lineCount: ' + lineCount });
            for (var i = 0; i < lineCount; i++) {
                log.error({ title: 'Processing Sublist Line', details: i });
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                });
                var POdrsSearch = search.load({
                    id: 'customsearch_po_drs_report_4'
                });
                POdrsSearch.filters = POdrsSearch.filters.concat([
                    search.createFilter({
                        name: 'custrecord538',
                        operator: search.Operator.IS,
                        values: components[i].text
                    })
                ]);
                POdrsSearch.filters = POdrsSearch.filters.concat([
                    search.createFilter({
                        name: 'custrecord501',
                        operator: search.Operator.ANYOF,
                        values: [thisMonthStr]
                    })
                ]);
                log.error({ title: 'POdrsSearch Filters', details: JSON.stringify(POdrsSearch.filters) });

                var summaryResults = [];
                POdrsSearch.run().each(function (result) {
                    log.error({
                        title: 'POdrsSearch Result',
                        details: JSON.stringify(result)
                    });

                    var dayIdx = 1;

                    POdrsSearch.columns.forEach(function (col, idx) {
                        var colKey = col.label || col.name;
                        var rawValue = result.getValue(col);
                        var value = rawValue ? parseInt(rawValue, 10) : 0;

                        if (!/Numeric/i.test(colKey)) {
                            log.error({
                                title: 'Skipping Column',
                                details: 'colKey: ' + colKey + ' (no numeric found)'
                            });
                            return;
                        } else {
                            log.error({
                                title: 'Processing Column',
                                details: 'col.name: ' + col.name + ', col.summary: ' + col.summary + ', formula: ' + col.formula
                            });
                        }

                        log.error({
                            title: 'POdrs Value Check',
                            details:
                                'Column: ' + colKey +
                                ' | rawValue: ' + rawValue + ' (' + typeof rawValue + ')' +
                                ' | normalized value: ' + value + ' (' + typeof value + ')'
                        });

                        if (dayIdx >= 1 && dayIdx <= 31) {
                            var fieldId = POdrsFields[dayIdx - 1];

                            if (value !== 0) {
                                currentRecord.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: fieldId,
                                    value: value
                                });
                                log.error({
                                    title: 'Set POdrs Field',
                                    details: 'fieldId: ' + fieldId + ', value: ' + value
                                });
                            }

                            dayIdx += 1;
                        }
                    });

                    return true;
                });
            }

            lineCount = currentRecord.getLineCount({
                sublistId: sublistId
            });

            log.error({ title: 'Start PO Dated Loading', details: 'lineCount: ' + lineCount });
            for (var i = 0; i < lineCount; i++) {
                log.error({ title: 'Processing Sublist Line', details: i });
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                });
                var POdatedSearch = search.load({
                    id: 'customsearch4985'
                });
                POdatedSearch.filters = POdatedSearch.filters.concat([
                    search.createFilter({
                        name: 'item',
                        operator: search.Operator.IS,
                        values: components[i].id
                    })
                ]);
                /* POdatedSearch.filters = POdatedSearch.filters.concat([
                    search.createFilter({
                        name: 'mainname',
                        operator: search.Operator.ANYOF,
                        values: [custrecord858Value]
                    })
                ]); */
                // convert numeric month to 3-letter month name and filter custcol50 contains that string
                var shortMonthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                var thisMonthNum = parseInt(thisMonth, 10) || parseInt(thisMonthStr, 10);
                var thisMonthShort = shortMonthNames[(thisMonthNum - 1 + 12) % 12] || thisMonthStr;
                POdatedSearch.filters = POdatedSearch.filters.concat([
                    search.createFilter({
                        name: 'custcol50',
                        operator: search.Operator.CONTAINS,
                        values: [thisMonthShort]
                    })
                ]);
                log.error({ title: 'POdatedSearch Filters', details: JSON.stringify(POdatedSearch.filters) });

                var summaryResults = [];
                POdatedSearch.run().each(function (result) {
                    log.error({
                        title: 'POdatedSearch Result',
                        details: JSON.stringify(result)
                    });

                    return true;
                });
            }
        }
    }

    function pageInit(context) {
        log.error({ title: 'pageInit Triggered', details: context.mode });
        if (context.mode === 'create') {
            var currentRecord = context.currentRecord;
            var currentMonth = (new Date()).getMonth() + 1;
            log.error({ title: 'Setting custrecord_month', details: currentMonth });
            currentRecord.setValue({
                fieldId: 'custrecord_month',
                value: currentMonth
            });
        }
    }

    return {
        fieldChanged: fieldChanged,
        pageInit: pageInit
    };
});


// load GPR Forecast, pag may laman yung 2nd month at walang duplicate sa SO DRS saka siya i-add
// add quantity ng per components sa SFLI SO DRS para sa material planning