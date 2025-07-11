/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/record'], function (search, record) {
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

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        // Trigger only when custrecord858 changes
        if (fieldId === 'custrecord858') {
            var custrecord858Value = currentRecord.getValue({
                fieldId: 'custrecord858'
            });

            if (!custrecord858Value) return;

            // Load the saved search
            var SOdrsSearch = search.load({
                id: 'customsearch5062'
            });

            // Add filter: custrecord836 anyof custrecord858 value
            SOdrsSearch.filters.push(
                search.createFilter({
                    name: 'custrecord836',
                    operator: search.Operator.ANYOF,
                    values: [custrecord858Value]
                })
            );
            // Add filter: custrecord846 anyof this month (1-12)
            var thisMonth = (new Date()).getMonth() + 1; // getMonth() is 0-based
            SOdrsSearch.filters.push(
                search.createFilter({
                    name: 'custrecord846',
                    operator: search.Operator.ANYOF,
                    values: [thisMonth.toString()]
                })
            );
            // Add filter: custrecord856 anyof this year (plain text)
            var thisYear = (new Date()).getFullYear().toString();
            SOdrsSearch.filters.push(
                search.createFilter({
                    name: 'custrecord856',
                    operator: search.Operator.IS,
                    values: [thisYear]
                })
            );

            // Run the search and get summary results
            var summaryResults = [];
            SOdrsSearch.run().each(function (result) {
                var summaryRow = {};
                SOdrsSearch.columns.forEach(function (col) {
                    // If the column is a summary (group or aggregate), get the appropriate value
                    var colKey = col.label || col.name;
                    // Check if colKey is a number between 1 and 31
                    var colNum = parseInt(colKey, 10);
                    if (!isNaN(colNum) && colNum >= 1 && colNum <= 31) {
                        var value = col.summary ?
                            result.getValue({
                                name: col.name,
                                summary: col.summary
                            }) :
                            result.getValue(col);
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
                    }
                });
                summaryResults.push(summaryRow);
                return true;
            });

            log.debug('Summary Results Count:', summaryResults.length);
            log.debug('Summary Results:', summaryResults);

            // Map summary results to SOdrsFields if col.name or col.label is 1 to 31
            // Loop through the sublist 'recmachcustrecord859' and set values from summaryResults
            var sublistId = 'recmachcustrecord859';
            var loopLength = summaryResults.length;
            var componentTexts = [];
            for (var line = 0; line < loopLength; line++) {
                var summaryRow = summaryResults[line];
                if (!summaryRow) break;

                var itemId = summaryRow["Component"];

                var itemType = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['recordtype', 'type']
                });

                // itemType.type[0].value will be 'InvtPart' for inventory item, 'Assembly' for assembly item, etc.
                if (itemType.type && itemType.type[0] && itemType.type[0].value === 'Assembly') {
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
                    for (var m = 0; m < memberSearchResults.length; m++) {
                        var memberItemId = memberSearchResults[m].getValue('memberitem');
                        if (memberItemId && memberItemId !== '464681') { // filter in JS, not in search
                            log.debug('Processing Summary Row ' + [line + 1] + ':', summaryRow + ' | Member Item ID: ' + memberItemId);
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
                            // Get the text value of custrecord893 before pushing to componentTexts
                            var custrecord893Text = currentRecord.getCurrentSublistText({
                                sublistId: sublistId,
                                fieldId: 'custrecord893'
                            });
                            componentTexts.push(custrecord893Text);
                            Object.keys(summaryRow).forEach(function (key) {
                                var idx = parseInt(key, 10);
                                if (!isNaN(idx) && idx >= 1 && idx <= 31) {
                                    var fieldId = SOdrsFields[idx - 1];
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: fieldId,
                                        value: summaryRow[key]
                                    });
                                }
                            });
                            currentRecord.commitLine({
                                sublistId: sublistId
                            });
                            loopLength++; // Increment loopLength to account for the new line added
                        }
                    }
                } else if (itemType.type && itemType.type[0] && itemType.type[0].value === 'InvtPart') {
                    currentRecord.selectNewLine({
                        sublistId: sublistId
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord860',
                        value: summaryRow["FG Item"]
                    });
                    /* currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord861',
                        value: summaryRow["Component"]
                    }); */
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord893',
                        value: summaryRow["Component"]
                    });
                    // Get the value just set for custrecord893 before pushing to componentTexts
                    var custrecord893Text = currentRecord.getCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: 'custrecord893'
                    });
                    componentTexts.push(custrecord893Text);
                    Object.keys(summaryRow).forEach(function (key) {
                        var idx = parseInt(key, 10);
                        if (!isNaN(idx) && idx >= 1 && idx <= 31) {
                            var fieldId = SOdrsFields[idx - 1];
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: fieldId,
                                value: summaryRow[key]
                            });
                        }
                    });
                    /* for (var i = 1; i <= 31; i++) {
                        var key = i.toString();
                        var fieldId = POdrsFields[i - 1];
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: fieldId,
                            value: 0
                        });
                    } */
                    currentRecord.commitLine({
                        sublistId: sublistId
                    });
                }
            }
            // After populating the sublist, loop through it again
            var lineCount = currentRecord.getLineCount({
                sublistId: sublistId
            });
            var thisMonthStr = thisMonth.toString();

            log.debug({
                title: 'Component Texts',
                details: componentTexts
            });
            log.debug({
                title: 'Component Texts Count',
                details: componentTexts.length
            });
            log.debug({
                title: 'This Month',
                details: thisMonthStr
            });
            for (var i = 0; i < lineCount; i++) {
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                });
                var POdrsSearch = search.load({
                    id: 'customsearch_po_drs_report_4'
                });
                POdrsSearch.filters.push(
                    search.createFilter({
                        name: 'custrecord538',
                        operator: search.Operator.IS,
                        values: componentTexts[i]
                    })
                );
                POdrsSearch.filters.push(
                    search.createFilter({
                        name: 'custrecord501',
                        operator: search.Operator.ANYOF,
                        values: [thisMonthStr]
                    })
                );

                // Run the search and check if result is empty, if so, break the loop
                /* var isEmpty = true;
                POdrsSearch.run().each(function () {
                    isEmpty = false;
                    return false; // stop after first result
                });
                if (isEmpty) {
                    break;
                } */
                // Run the search and get summary results
                var summaryResults = [];
                POdrsSearch.run().each(function (result) {
                    var summaryRow = {};
                    POdrsSearch.columns.forEach(function (col) {
                        // If the column is a summary (group or aggregate), get the appropriate value
                        if (!col) return; // skip to next loop if col is undefined/null
                        var colKey = col.label || col.name;
                        // Check if colKey is a number between 1 and 31
                        var colNum = parseInt(colKey, 10);
                        if (!isNaN(colNum) && colNum >= 1 && colNum <= 31) {
                            var value = col.summary ?
                                result.getValue({
                                    name: col.name,
                                    summary: col.summary
                                }) :
                                result.getValue(col);
                            if (value > 0) {
                                var POdrsValue = currentRecord.getCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: POdrsFields[colNum - 1]
                                });

                                if (POdrsValue) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: POdrsFields[colNum - 1],
                                        value: parseInt(POdrsValue, 10) + parseInt(value, 10)
                                    });
                                } else {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: POdrsFields[colNum - 1],
                                        value: value
                                    });
                                }
                                summaryRow[colKey] = value;
                            }
                        } else if (colKey === 'Item Code') {
                            if (col.summary) {
                                summaryRow[colKey] = result.getValue({
                                    name: col.name,
                                    summary: col.summary
                                });
                            } else {
                                summaryRow[colKey] = result.getValue(col);
                            }
                        }
                    });
                    summaryResults.push(summaryRow);
                    return true;
                });

                log.debug('PO DRS Results Count:', summaryResults.length);
                log.debug('PO DRS Summary Results:', summaryResults);
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});