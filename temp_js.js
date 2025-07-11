/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/log'], function (search, log) {
    var previousCustomer = null;
    var isFieldChangeScriptActive = true;
    var populate = true;
    var revert = false;
    var searchFulfillment = true;
    var contextMode = '';
    const sublistId = 'recmachcustrecord783';
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
    const forecastDRS = [
        'custrecord946', 'custrecord947', 'custrecord948', 'custrecord949',
        'custrecord950', 'custrecord951', 'custrecord952', 'custrecord953',
        'custrecord954', 'custrecord955'
    ];
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    var currentMonthValue = currentDate.getMonth() + 1;
    const nextMonthValue = currentMonthValue === 12 ? 1 : currentMonthValue + 1;
    const nextYearValue = currentMonthValue === 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthText = monthNames[currentDate.getMonth()];

    // Page Init Function - Loads when the form is loaded
    function pageInit(context) {
        var currentRecord = context.currentRecord;

        var DRSname = currentRecord.getField({
            fieldId: 'custrecorddrs_name'
        });
        var customer = currentRecord.getText({
            fieldId: 'custrecord782'
        });
        var date = currentRecord.getField({
            fieldId: 'custrecord781'
        });
        var monthField = currentRecord.getField({
            fieldId: 'custrecord837'
        });
        var month = currentRecord.getValue({
            fieldId: 'custrecord837'
        });
        var advanceDRS = currentRecord.getValue({
            fieldId: 'custrecord838'
        });

        DRSname.isDisabled = true;
        date.isDisabled = true;

        contextMode = context.mode;

        if (contextMode === 'edit') {
            log.debug('Context Mode', 'Edit');
            if (advanceDRS == 1) {
                monthField.isDisabled = false;
                log.debug({
                    title: 'Advance DRS == 1',
                    details: 'Month field enabled'
                })
            }

            /* if (month == currentMonthValue) {
                currentRecord.setValue({
                    fieldId: 'custrecord838',
                    value: 2
                });

                advanceDRS = currentRecord.getValue({
                    fieldId: 'custrecord838'
                });

                log.debug({
                    title: 'month == currentMonthValue',
                    details: 'Advance DRS set to 2'
                })
            } */

            if (customer /*  && advanceDRS == 2 */ ) {
                if (advanceDRS == 1) {
                    searchFulfillment = false;
                    log.debug({
                        title: 'Advance DRS == 1',
                        details: 'Search Fulfillment disabled'
                    })
                }

                isFieldChangeScriptActive = false;
                loadSublistData(currentRecord, customer, contextMode);
            }
        } else {
            log.debug('Context Mode', 'Not Edit');
            currentRecord.setValue({
                fieldId: 'custrecord837',
                value: currentMonthValue
            });

            currentRecord.setValue({
                fieldId: 'custrecord838',
                value: 2
            });

            monthField.isDisabled = true;
        }
    }

    // Function to react when a field changes value
    function fieldChanged(context) {
        if (!isFieldChangeScriptActive) return;

        var currentRecord = context.currentRecord;

        if (context.fieldId === 'custrecord782') {
            var customer = currentRecord.getText({
                fieldId: 'custrecord782'
            });

            var drsName = customer + ' DRS [ ' + currentMonthText + ' ' + currentDate.getFullYear() + ' ]';

            // Search for other records with the same DRS name
            var drsSearch = search.create({
                type: 'customrecord1874',
                filters: [
                    ['custrecorddrs_name', 'is', drsName]
                ],
                columns: ['custrecorddrs_name']
            });

            var hasMatch = false;
            drsSearch.run().each(function (result) {
                var matchedName = result.getValue({
                    name: 'custrecorddrs_name'
                });

                if (matchedName == drsName) {
                    hasMatch = true;
                }

                return false;
            });

            if (hasMatch) {
                log.debug('Duplicate DRS Name found', drsName);
                currentRecord.setValue({
                    fieldId: 'custrecorddrs_name',
                    value: customer + ' DRS [ ' + nextMonthValue + ' ' + nextYearValue + ' ]'
                });

                currentMonthValue = nextMonthValue;

                currentRecord.setValue({
                    fieldId: 'custrecord837',
                    value: currentMonthValue
                });

                currentRecord.setValue({
                    fieldId: 'custrecord838',
                    value: 2
                });

                var monthField = currentRecord.getField({
                    fieldId: 'custrecord837'
                });

                monthField.isDisabled = true;
            } else {
                currentRecord.setValue({
                    fieldId: 'custrecorddrs_name',
                    value: drsName
                });
            }

            if (customer !== previousCustomer && customer != '') {
                previousCustomer = customer;
                clearSublist(currentRecord);
                loadSublistData(currentRecord, customer, contextMode);
            } else if (!customer || customer == '' || customer == null) {
                clearSublist(currentRecord);
            }
        }

        if (context.fieldId === 'custrecord837') {
            var advanceDRSmonth = currentRecord.getText({
                fieldId: 'custrecord837'
            });

            var advanceDRSmonthValue = currentRecord.getValue({
                fieldId: 'custrecord837'
            });

            var customer = currentRecord.getText({
                fieldId: 'custrecord782'
            });

            currentRecord.setValue({
                fieldId: 'custrecorddrs_name',
                value: customer + ' DRS [ ' + advanceDRSmonth + ' ' + currentDate.getFullYear() + ' ]'
            });

            var lineCount = currentRecord.getLineCount({
                sublistId: sublistId
            });

            for (var i = 0; i < lineCount; i++) {
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord846',
                    value: advanceDRSmonthValue
                });
                currentRecord.commitLine({
                    sublistId: sublistId
                });
            }
        }

        if (context.fieldId === 'custrecord838') {
            log.debug('Field Changed', 'custrecord838 field changed');
            var advanceDRSValue = currentRecord.getValue({
                fieldId: 'custrecord838'
            });
            log.debug('Advance DRS Value', advanceDRSValue);

            if (advanceDRSValue == 1) {
                log.debug('Advance DRS is 1', 'Processing for Advance DRS = 1');
                var monthField = currentRecord.getField({
                    fieldId: 'custrecord837'
                });
                var month = currentRecord.getValue({
                    fieldId: 'custrecord837'
                });
                log.debug('Current Month Value', month);

                monthField.isDisabled = false;

                if (month > 0 && month < 11) {
                    currentRecord.setValue({
                        fieldId: 'custrecord837',
                        value: parseInt(month) + 1
                    });
                    log.debug('Updated Month Value', parseInt(month) + 1);
                } else if (month == 12) {
                    currentRecord.setValue({
                        fieldId: 'custrecord837',
                        value: 1
                    });
                    log.debug('Updated Month Value', 1);
                }

                if (contextMode === 'create') {
                    searchFulfillment = false;
                    log.debug('Search Fulfillment Disabled', 'Context Mode is Create');
                }

                const wasActive = isFieldChangeScriptActive;
                isFieldChangeScriptActive = false;

                try {
                    var lineCount = currentRecord.getLineCount({
                        sublistId: sublistId
                    });
                    log.debug('Sublist Line Count', lineCount);

                    for (var i = 0; i < lineCount; i++) {
                        currentRecord.selectLine({
                            sublistId: sublistId,
                            line: i
                        });

                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord835',
                            value: 0
                        });

                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord845',
                            value: 0
                        });

                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord846',
                            value: parseInt(month) + 1
                        });

                        currentRecord.commitLine({
                            sublistId: sublistId
                        });
                        log.debug('Updated Sublist Line', 'Line ' + i + ' updated');
                    }
                } finally {
                    isFieldChangeScriptActive = wasActive;
                    revert = true;
                    log.debug('Revert Flag Set', revert);
                }
            } else if (advanceDRSValue == 2) {
                log.debug('Advance DRS is 2', 'Processing for Advance DRS = 2');
                var lineCount = currentRecord.getLineCount({
                    sublistId: sublistId
                });
                log.debug('Sublist Line Count', lineCount);

                for (var i = 0; i < lineCount; i++) {
                    currentRecord.selectLine({
                        sublistId: sublistId,
                        line: i
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord846',
                        value: currentMonthValue
                    });
                    currentRecord.commitLine({
                        sublistId: sublistId
                    });
                    log.debug('Updated Sublist Line', 'Line ' + i + ' updated');
                }

                if (contextMode === 'create' && revert) {
                    log.debug('Reverting Changes', 'Loading Item Fulfillment');
                    searchFulfillment = true;
                    customer = currentRecord.getValue({
                        fieldId: 'custrecord782'
                    });
                    loadItemFulfillment(currentRecord, customer, contextMode);
                    revert = false;
                    log.debug('Revert Flag Reset', revert);
                }

                var month = currentRecord.getValue({
                    fieldId: 'custrecord837'
                });
                log.debug('Resetting Month Value', currentMonthValue);

                currentRecord.setValue({
                    fieldId: 'custrecord837',
                    value: currentMonthValue
                });

                var monthField = currentRecord.getField({
                    fieldId: 'custrecord837'
                });

                monthField.isDisabled = true;
                log.debug('Month Field Disabled', true);
            }
        }

        // Add this block for fieldIdsToCheck logic
        var fieldIndex = fieldIdsToCheck.indexOf(context.fieldId);
        if (fieldIndex !== -1) {
            // Determine which forecastDRS index to use
            var forecastIndex;
            if (fieldIndex >= 27 && fieldIndex <= 30) {
                forecastIndex = 8; // index 9 in forecastDRS (0-based)
            } else {
                forecastIndex = Math.floor(fieldIndex / 3);
            }

            // Only process if forecastIndex is within forecastDRS range
            if (forecastIndex >= 0 && forecastIndex < forecastDRS.length) {
                var forecastFieldId = forecastDRS[forecastIndex];

                // Get the changed value
                var changedValue = Number(currentRecord.getValue({
                    fieldId: context.fieldId
                })) || 0;

                // Get current forecast value
                var forecastValue = Number(currentRecord.getValue({
                    fieldId: forecastFieldId
                })) || 0;

                // Deduct changed value from forecast
                var newForecastValue = forecastValue - changedValue;

                // Update forecast field
                currentRecord.setValue({
                    fieldId: forecastFieldId,
                    value: newForecastValue
                });
            }
        }
    }

    // Clear sublist lines function
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

    // Load sublist data
    function loadSublistData(currentRecord, customer, contextMode) {
        try {
            customer = currentRecord.getValue({
                fieldId: 'custrecord782'
            });

            salesorderSearchObj = search.create({
                type: 'salesorder',
                filters: [
                    search.createFilter({
                        name: 'type',
                        operator: search.Operator.ANYOF,
                        values: ['SalesOrd']
                    }),
                    search.createFilter({
                        name: 'status',
                        operator: search.Operator.ANYOF,
                        values: ['SalesOrd:D', 'SalesOrd:E', 'SalesOrd:B'],
                    }),
                    search.createFilter({
                        name: 'mainline',
                        operator: search.Operator.IS,
                        values: ['F']
                    }),
                    search.createFilter({
                        name: 'subsidiary',
                        operator: search.Operator.ANYOF,
                        values: ['14']
                    }),
                    search.createFilter({
                        name: 'vendtype',
                        operator: search.Operator.NONEOF,
                        values: ['3']
                    }),
                    search.createFilter({
                        name: 'formulanumeric',
                        operator: search.Operator.NOTEQUALTO,
                        values: ['0'],
                        formula: '{quantity}-{quantityshiprecv}'
                    }),
                    search.createFilter({
                        name: 'closed',
                        operator: search.Operator.IS,
                        values: ['F']
                    }),
                    search.createFilter({
                        name: 'custbody16',
                        operator: search.Operator.ANYOF,
                        values: ['2']
                    }),
                    search.createFilter({
                        name: 'entity',
                        operator: search.Operator.ANYOF,
                        values: [customer]
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'tranid',
                        summary: search.Summary.GROUP,
                        label: 'Sales Order No.',
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({
                        name: 'entity',
                        summary: search.Summary.GROUP,
                        label: 'Customer'
                    }),
                    search.createColumn({
                        name: 'item',
                        summary: search.Summary.GROUP,
                        label: 'Item',
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({
                        name: 'salesdescription',
                        join: 'item',
                        summary: search.Summary.GROUP,
                        label: 'Description'
                    }),
                    search.createColumn({
                        name: 'formulatext',
                        summary: search.Summary.GROUP,
                        label: 'Unique ID',
                        formula: 'CONCAT({internalid},{item.internalid})'
                    }),
                    search.createColumn({
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Formula (Numeric)',
                        formula: '{quantity}-{quantityshiprecv}'
                    })
                ]
            });

            var pageSize = 100,
                start = 0,
                resultCount = 0;

            var SOResults = [];

            do {
                var salesOrderResults = salesorderSearchObj.run().getRange({
                    start: start,
                    end: start + pageSize
                });
                SOResults = SOResults.concat(salesOrderResults);
                resultCount = salesOrderResults.length;
                start += pageSize;
            } while (resultCount === pageSize);

            var results = {}; // Dictionary to store results

            salesorderSearchObj.run().each(function (result) {
                var itemCode = result.getText({
                    name: 'item',
                    summary: search.Summary.GROUP
                });

                var itemId = result.getValue({
                    name: 'item',
                    summary: search.Summary.GROUP
                });

                var itemDescription = result.getValue({
                    name: 'salesdescription',
                    join: 'item',
                    summary: search.Summary.GROUP
                });

                var quantity = parseFloat(result.getValue({
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    formula: '{quantity}-{quantityshiprecv}'
                })) || 0;

                var salesOrderId = result.getValue({
                    name: 'tranid',
                    summary: search.Summary.GROUP
                });

                // Ensure the item exists in the dictionary
                if (!results[itemId]) {
                    results[itemId] = {
                        "Item ID": itemId,
                        "Item Code": itemCode,
                        "Item Description": itemDescription,
                        "Total Quantity": 0,
                        "Sales Orders": []
                    };
                }

                // Add quantity to the total
                results[itemId]["Total Quantity"] += quantity;

                // Append Sales Order ID if not already present
                if (!results[itemId]["Sales Orders"].includes(salesOrderId)) {
                    results[itemId]["Sales Orders"].push(salesOrderId);
                }

                return true;
            });

            log.debug("Formatted SO Search Results", JSON.stringify(results));

            // Process search results: Add or update sublist lines, and track matches
            Object.keys(results).forEach(function (itemId) {
                var itemData = results[itemId];
                if (!checkAndUpdateSublist(currentRecord, itemData, 'SO', customer)) {
                    populateSublistLine(currentRecord, itemData, contextMode, 'SO', customer);
                }
            });

            if (searchFulfillment) {
                loadItemFulfillment(currentRecord, customer)
            }

            var lineCount = currentRecord.getLineCount({
                sublistId: sublistId
            });

            for (var i = 0; i < lineCount; i++) {
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                });

                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord856',
                    value: currentDate.getFullYear()
                });

                currentRecord.commitLine({
                    sublistId: sublistId
                });
            }

            cleanDeduplicateAndTally(currentRecord, results);

            isFieldChangeScriptActive = true
        } catch (e) {
            throw e;
        }
    }

    // Load Item Fulfillment
    function loadItemFulfillment(currentRecord, customer) {
        fulfillmentSearchObj = search.create({
            type: 'itemfulfillment',
            filters: [
                search.createFilter({
                    name: 'type',
                    operator: search.Operator.ANYOF,
                    values: ['ItemShip']
                }),
                search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: ['ItemShip:C']
                }),
                search.createFilter({
                    name: 'shipping',
                    operator: search.Operator.IS,
                    values: ['F']
                }),
                search.createFilter({
                    name: 'taxline',
                    operator: search.Operator.IS,
                    values: ['F']
                }),
                search.createFilter({
                    name: 'accounttype',
                    operator: search.Operator.ANYOF,
                    values: ['@NONE@']
                }),
                search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: ['14']
                }),
                search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: ['SalesOrd:D', 'SalesOrd:E', 'SalesOrd:B'],
                    join: 'createdfrom'
                }),
                search.createFilter({
                    name: 'custbody16',
                    operator: search.Operator.ANYOF,
                    values: ['2'],
                    join: 'createdfrom'
                }),
                search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.WITHIN,
                    values: ['thismonth']
                }),
                search.createFilter({
                    name: 'mainname',
                    operator: search.Operator.ANYOF,
                    values: [customer]
                })
            ],
            columns: [{
                name: "item",
                summary: "GROUP"
            }, {
                name: "salesdescription",
                join: "item",
                summary: "GROUP"
            }, {
                name: "quantity",
                summary: "SUM"
            }, {
                name: "createdfrom",
                summary: "GROUP"
            }, {
                name: "mainname",
                summary: "GROUP"
            }]
        })

        var pageSize = 100,
            start = 0,
            resultCount = 0;

        var DRResults = [];

        do {
            var fulfillmentResults = fulfillmentSearchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            DRResults = DRResults.concat(fulfillmentResults);
            resultCount = fulfillmentResults.length;
            start += pageSize;
        } while (resultCount === pageSize);

        var results = [];
        fulfillmentSearchObj.run().each(function (result) {
            results.push({
                item: result.getText({
                    name: 'item',
                    summary: search.Summary.GROUP
                }),
                description: result.getValue({
                    name: 'salesdescription',
                    join: 'item',
                    summary: search.Summary.GROUP
                }),
                quantity: result.getValue({
                    name: 'quantity',
                    summary: search.Summary.SUM
                }),
                createdFrom: result.getText({
                    name: 'createdfrom',
                    summary: search.Summary.GROUP
                }).split('#')[1],
                customer: result.getText({
                    name: 'mainname',
                    summary: search.Summary.GROUP
                })
            });
            return true;
        });

        log.debug('DR Search Results', JSON.stringify(results));

        // Process search results: Add or update sublist lines, and track matches
        DRResults.forEach(function (result) {
            if (!checkAndUpdateSublist(currentRecord, result, 'DR', customer)) {
                // If result is not found in sublist, add a new line
                populateSublistLine(currentRecord, result, contextMode, 'DR', customer);
            }
        });

        isFieldChangeScriptActive = true;
        log.debug({
            title: 'loadItemFulfillment',
            details: 'isFieldChangeScriptActive: ' + isFieldChangeScriptActive
        })
    }

    // Update checkAndUpdateSublist to add log.debugs for updates and conditions
    function checkAndUpdateSublist(currentRecord, results, recType, customer) {
        var lineCount = currentRecord.getLineCount({
            sublistId: sublistId
        });

        for (var i = 0; i < lineCount; i++) {
            var currentSO = currentRecord.getSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord786',
                line: i
            });
            var currentItem = currentRecord.getSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord784',
                line: i
            });
            var currentItemId = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord784',
                line: i
            });
            var totalDRquantity = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord835',
                line: i
            });
            var currentComponents = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord857',
                line: i
            });

            // If there is a match, update and commit the sublist
            if (currentSO && currentItem) {
                if (recType === 'DR') {
                    var resultItemText = results.getText({
                        name: 'item',
                        summary: search.Summary.GROUP
                    });
                    log.debug({
                        title: 'Check DR Condition',
                        details: 'Comparing currentItem: ' + currentItem + ' with resultItemText: ' + resultItemText
                    });
                    if (currentItem === resultItemText) {
                        log.debug({
                            title: 'DR Update Condition Met',
                            details: 'Updating line ' + i + ' for item: ' + currentItem
                        });

                        currentRecord.selectLine({
                            sublistId: sublistId,
                            line: i
                        });

                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord933',
                            value: 0
                        });

                        if (totalDRquantity == null) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord845',
                                value: parseInt(results.getValue({
                                    name: 'quantity',
                                    summary: search.Summary.SUM
                                }))
                            });
                        } else {
                            currentRecord.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord845',
                                value: totalDRquantity
                            });
                        }
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord835',
                            value: parseInt(results.getValue({
                                name: 'quantity',
                                summary: search.Summary.SUM
                            }))
                        });

                        var prevTotalDR = currentRecord.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord845'
                        });
                        var totalDR = currentRecord.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord835'
                        });

                        var gap = totalDR - prevTotalDR;

                        fieldIdsToCheck.some(function (fieldId) {
                            var fieldValue = currentRecord.getCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: fieldId
                            });

                            /* var field = currentRecord.getCurrentSublistField({
                                sublistId: sublistId,
                                fieldId: fieldId
                            }); */

                            // if (field.isDisabled == false) {

                            var fieldIndex = fieldIdsToCheck.indexOf(fieldId);
                            if (fieldIndex !== -1) {
                                // Determine which forecastDRS index to use
                                var forecastIndex;
                                if (fieldIndex >= 27 && fieldIndex <= 30) {
                                    forecastIndex = 8; // index 9 in forecastDRS (0-based)
                                } else {
                                    forecastIndex = Math.floor(fieldIndex / 3);
                                }

                                if (forecastIndex >= 0 && forecastIndex < forecastDRS.length) {
                                    var forecastFieldId = forecastDRS[forecastIndex];

                                    var forecastFieldValue = currentRecord.getCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: forecastFieldId
                                    });
                                }
                            }
                            if (gap > 0) {
                                if (fieldValue < gap && fieldValue > 0) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: fieldId,
                                        value: 0
                                    });

                                    gap -= fieldValue;

                                    if (forecastFieldValue) {
                                        currentRecord.setCurrentSublistValue({
                                            sublistId: sublistId,
                                            fieldId: forecastFieldId,
                                            value: parseInt(forecastFieldValue - fieldValue)
                                        });
                                    }
                                } else if (fieldValue >= gap) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: fieldId,
                                        value: parseInt(fieldValue - gap),
                                    });
                                    if (forecastFieldValue) {
                                        currentRecord.setCurrentSublistValue({
                                            sublistId: sublistId,
                                            fieldId: forecastFieldId,
                                            value: parseInt(forecastFieldValue - gap)
                                        });
                                    }
                                    gap = 0;
                                }
                            } else if (gap < 0) {
                                currentRecord.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: fieldId,
                                    value: 0
                                });
                                if (forecastFieldValue) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: forecastFieldId,
                                        value: 0
                                    });
                                }
                                gap = 0;
                            }
                            // }

                            return gap === 0;
                        });

                        currentRecord.commitLine({
                            sublistId: sublistId
                        });

                        return true; // Match found
                    }
                } else if (recType === 'SO') {
                    for (var key in results) {
                        if (results.hasOwnProperty(key) && key == 'Item ID') {
                            if (currentItem == results['Item Code']) {
                                currentRecord.selectLine({
                                    sublistId: sublistId,
                                    line: i
                                });

                                currentRecord.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord836',
                                    value: customer
                                });

                                populate = false;

                                var salesOrders = results["Sales Orders"];

                                log.debug({
                                    title: 'salesOrders',
                                    details: salesOrders
                                });

                                if (!currentComponents) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: 'custrecord857',
                                        value: getMemberItems(currentItemId)
                                    });
                                }

                                if (salesOrders.includes(currentSO)) {
                                    currentRecord.commitLine({
                                        sublistId: sublistId
                                    });

                                    log.debug({
                                        title: 'SO Line Updated',
                                        details: 'Line ' + i + ' updated for item: ' + currentItem
                                    });

                                    return true;
                                } else {
                                    var replacementSO = results["Sales Orders"].length > 0 ? results["Sales Orders"][0] : null;

                                    log.debug({
                                        title: 'SO closed',
                                        details: 'replacement SO: ' + replacementSO
                                    });

                                    if (replacementSO) {
                                        currentRecord.setCurrentSublistValue({
                                            sublistId: sublistId,
                                            fieldId: 'custrecord786',
                                            value: replacementSO
                                        });
                                    }

                                    currentRecord.commitLine({
                                        sublistId: sublistId
                                    });

                                    log.debug({
                                        title: 'SO Line Updated with Replacement',
                                        details: 'Line ' + i + ' updated for item: ' + currentItem + ' with replacement SO'
                                    });
                                }

                                break;
                            }
                        }
                    }
                }
            }
        }

        return false; // No match
    }

    // Update populateSublistLine to add log.debugs for adds and conditions
    function populateSublistLine(currentRecord, results, contextMode, recType, customer) {
        isFieldChangeScriptActive = false;

        log.debug({
            title: 'populateSublistLine',
            details: 'Adding new sublist line for recType: ' + recType + ', contextMode: ' + contextMode + ', customer: ' + customer + ', results: ' + JSON.stringify(results)
        });

        currentRecord.selectNewLine({
            sublistId: sublistId
        });

        if (contextMode === 'edit') {
            if (recType == 'SO') {
                for (var key in results) {
                    if (results.hasOwnProperty(key) && key == 'Item ID') {
                        log.debug({
                            title: 'SO Add Condition Met',
                            details: 'Adding new SO line for item: ' + results['Item Code']
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord784',
                            value: results[key]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord857',
                            value: getMemberItems(results[key])
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord785',
                            value: results["Item Description"]
                        });
                        currentRecord.setCurrentSublistText({
                            sublistId: sublistId,
                            fieldId: 'custrecord786',
                            text: results["Sales Orders"][0]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord835',
                            value: 0
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord845',
                            value: 0
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord836',
                            value: customer
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord846',
                            value: currentRecord.getValue({
                                fieldId: 'custrecord837'
                            })
                        });

                        break;
                    }
                }
            } else if (recType == 'DR') {
                log.debug({
                    title: 'DR Add Condition Met',
                    details: 'Adding new DR line for item: ' + results.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                })
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord784',
                    value: results.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord785',
                    value: results.getValue({
                        name: 'salesdescription',
                        join: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord786',
                    text: results.getText({
                        name: 'createdfrom',
                        summary: search.Summary.GROUP
                    }).split('#')[1]
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord835',
                    value: 0
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord845',
                    value: 0
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord836',
                    value: customer
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord846',
                    value: currentRecord.getValue({
                        fieldId: 'custrecord837'
                    })
                });
            }
        } else if (contextMode === 'create') {
            if (recType == 'SO') {
                for (var key in results) {
                    if (results.hasOwnProperty(key) && key == 'Item ID') {
                        log.debug({
                            title: 'SO Add Condition Met (Create)',
                            details: 'Adding new SO line for item: ' + results['Item Code']
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord784',
                            value: results[key]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord857',
                            value: getMemberItems(results[key])
                        });
                        currentRecord.setCurrentSublistText({
                            sublistId: sublistId,
                            fieldId: 'custrecord785',
                            text: results["Item Description"]
                        });
                        currentRecord.setCurrentSublistText({
                            sublistId: sublistId,
                            fieldId: 'custrecord786',
                            text: results["Sales Orders"][0]
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord835',
                            value: 0
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord845',
                            value: 0
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord836',
                            value: customer
                        });
                    }
                }
            } else if (recType == 'DR') {
                log.debug({
                    title: 'DR Add Condition Met (Create)',
                    details: 'Adding new DR line for item: ' + results.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord784',
                    value: results.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord785',
                    text: results.getValue({
                        name: 'salesdescription',
                        join: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord786',
                    text: results.getText({
                        name: 'createdfrom',
                        summary: search.Summary.GROUP
                    }).split('#')[1]
                });
                var quantity = parseInt(results.getValue({
                    name: 'quantity',
                    summary: search.Summary.SUM
                }));

                if (!quantity) {
                    quantity = 0;
                }

                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord835',
                    value: quantity
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord836',
                    value: customer
                });

            }
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord846',
                value: currentMonthValue
            });
        }
        initializeSublistFieldsToZero(currentRecord, contextMode, recType);
        currentRecord.commitLine({
            sublistId: sublistId
        });

        log.debug({
            title: 'Sublist Line Added',
            details: 'New line committed for recType: ' + recType
        });

        populate = true;
        isFieldChangeScriptActive = true;
    }

    // Function to initialize sublist fields to zero
    function initializeSublistFieldsToZero(currentRecord, contextMode, recType) {
        fieldIdsToCheck.forEach(function (fieldId) {
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
                value: 0
            });
        });

        currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord933',
            value: 0
        });

        if (contextMode === 'create') {
            if (recType == 'SO') {
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord835',
                    value: 0
                });
            }
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord845',
                value: 0
            });
        }
    }

    // Function to fetch components or member items of an item
    function getMemberItems(itemId) {
        var memberItems = [];

        try {
            var itemSearch = search.create({
                type: 'item',
                filters: [
                    ['internalid', 'is', itemId]
                ],
                columns: [
                    search.createColumn({
                        name: 'memberitem'
                    })
                ]
            });

            itemSearch.run().each(function (result) {
                memberItems.push(result.getValue({
                    name: 'memberitem'
                }));
                return true; // Continue iterating
            });

            log.debug({
                title: 'Components of ' + itemId,
                details: memberItems
            })
        } catch (e) {
            log.error('Error fetching member items', e.message);
        }

        return memberItems;
    }

    // Disable specific fields in sublist
    function disableFields(currentRecord) {
        var disableFieldIds = ['custrecord784', 'custrecord786', 'custrecord835', 'custrecord785', 'custrecord845', 'custrecord836', 'custrecord846', 'custrecord856'];

        for (var x = 0; x < currentDay - 1; x++) {
            disableFieldIds.push(fieldIdsToCheck[x]);
        }

        var lineCount = currentRecord.getLineCount({
            sublistId: sublistId
        });

        disableFieldIds.forEach(function (fieldId) {
            for (var i = 0; i < lineCount; i++) {
                var field = currentRecord.getSublistField({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: i
                });

                field.isDisabled = true;
            }
        });
    }

    /**
     * Cleans sublist lines and tallies balances:
     * 1. Removes lines whose item is not in results.
     * 2. If item is in results but SO is not, replaces SO or removes line.
     * 3. Removes duplicate lines where all fieldIdsToCheck, custrecord835, and custrecord845 sum to 0.
     * 4. Tallies balances for each line and sets custrecord933, skipping lines to be removed.
     */
    function cleanDeduplicateAndTally(currentRecord, results) {
        var lineCount = currentRecord.getLineCount({
            sublistId: sublistId
        });
        var linesToRemove = [];
        var seen = {};

        log.debug({
            title: 'cleanDeduplicateAndTally',
            details: 'Starting cleanDeduplicateAndTally with lineCount: ' + lineCount
        });

        for (var i = 0; i < lineCount; i++) {
            var itemId = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord784',
                line: i
            });
            var soText = currentRecord.getSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord786',
                line: i
            });

            log.debug({
                title: 'Line ' + i,
                details: 'itemId: ' + itemId + ', soText: ' + soText
            });

            // 1. Remove if item not in results
            if (!results[itemId]) {
                log.debug({
                    title: 'Remove Line',
                    details: 'Item not in results, marking line ' + i + ' for removal'
                });
                linesToRemove.push(i);
                continue;
            }

            // 2. Replace SO if needed, or remove if no replacement
            var soList = results[itemId]["Sales Orders"] || [];
            if (!soList.includes(soText)) {
                var replacementSO = soList.length > 0 ? soList[0] : null;
                if (replacementSO) {
                    log.debug({
                        title: 'Replace SO',
                        details: 'Replacing SO on line ' + i + ' with: ' + replacementSO
                    });
                    currentRecord.selectLine({
                        sublistId: sublistId,
                        line: i
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord786',
                        value: replacementSO
                    });
                    currentRecord.commitLine({
                        sublistId: sublistId
                    });
                } else {
                    log.debug({
                        title: 'Remove Line',
                        details: 'No replacement SO, marking line ' + i + ' for removal'
                    });
                    linesToRemove.push(i);
                    continue;
                }
            } else {
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                });
                currentRecord.commitLine({
                    sublistId: sublistId
                });
            }

            // 3. Remove duplicate zero lines
            var sum = 0;
            for (var j = 0; j < fieldIdsToCheck.length; j++) {
                sum += Number(currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldIdsToCheck[j],
                    line: i
                }) || 0);
            }
            sum += Number(currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord835',
                line: i
            }) || 0);
            sum += Number(currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord845',
                line: i
            }) || 0);

            var key = itemId + '|' + soText;
            if (sum === 0) {
                if (seen[key]) {
                    log.debug({
                        title: 'Remove Duplicate Zero Line',
                        details: 'Duplicate zero line found at ' + i + ', marking for removal'
                    });
                    linesToRemove.push(i);
                    continue;
                } else {
                    seen[key] = true;
                }
            }

            // 4. Tally balances for each line and set custrecord933 (only if not marked for removal)
            var balance = 0;
            for (var k = 0; k < currentDay - 1; k++) {
                var fieldId = fieldIdsToCheck[k];
                var value = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: i
                });
                balance += Number(value) || 0;
            }
            log.debug({
                title: 'Set Balance',
                details: 'Setting custrecord933 for line ' + i + ' to ' + balance
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord933',
                value: balance
            });
            currentRecord.commitLine({
                sublistId: sublistId
            });
        }

        // Remove lines in reverse order
        for (var k = linesToRemove.length - 1; k >= 0; k--) {
            log.debug({
                title: 'Remove Line',
                details: 'Actually removing line ' + linesToRemove[k]
            });
            currentRecord.removeLine({
                sublistId: sublistId,
                line: linesToRemove[k]
            });
        }

        log.debug({
            title: 'cleanDeduplicateAndTally',
            details: 'Completed cleanDeduplicateAndTally'
        });
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});