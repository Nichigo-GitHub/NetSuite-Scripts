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
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonthValue = currentDate.getMonth() + 1;
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
            if (advanceDRS == 1) {
                monthField.isDisabled = true;
            }

            var customer = currentRecord.getText({
                fieldId: 'custrecord782'
            });

            if (month == currentMonthValue) {
                currentRecord.setValue({
                    fieldId: 'custrecord838',
                    value: 2
                });

                advanceDRS = currentRecord.getValue({
                    fieldId: 'custrecord838'
                });
            }

            if (customer && advanceDRS == 2) {
                isFieldChangeScriptActive = false;
                loadSublistData(currentRecord, customer, contextMode);
            }
        } else {
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

            currentRecord.setValue({
                fieldId: 'custrecorddrs_name',
                value: customer + ' DRS [ ' + currentMonthText + ' ' + currentDate.getFullYear() + ' ]'
            });

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
            if (currentRecord.getValue({
                    fieldId: 'custrecord838'
                }) == 1) {
                var monthField = currentRecord.getField({
                    fieldId: 'custrecord837'
                });
                var month = currentRecord.getValue({
                    fieldId: 'custrecord837'
                });

                if (month > 0 && month < 11) {
                    currentRecord.setValue({
                        fieldId: 'custrecord837',
                        value: parseInt(month) + 1
                    })
                } else if (month == 12) {
                    currentRecord.setValue({
                        fieldId: 'custrecord837',
                        value: 1
                    })
                }

                monthField.isDisabled = false;

                if (contextMode === 'create')
                    searchFulfillment = false;

                const wasActive = isFieldChangeScriptActive;
                isFieldChangeScriptActive = false;

                try {
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
                    }
                    fieldIdsToCheck.forEach(function (fieldId) {
                        for (var i = 0; i < lineCount; i++) {
                            var field = currentRecord.getSublistField({
                                sublistId: sublistId,
                                fieldId: fieldId,
                                line: i
                            });
                            if (field) {
                                field.isDisabled = false;
                            }
                        }
                    });
                } finally {
                    isFieldChangeScriptActive = wasActive;
                    revert = true;
                }
            } else if (currentRecord.getValue({
                    fieldId: 'custrecord838'
                }) == 2) {

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
                        value: currentMonthValue
                    });
                    currentRecord.commitLine({
                        sublistId: sublistId
                    });
                }

                if (contextMode === 'create' && revert) {
                    searchFulfillment = true;
                    customer = currentRecord.getValue({
                        fieldId: 'custrecord782'
                    });
                    loadItemFulfillment(currentRecord, customer, contextMode)
                    revert = false;
                }

                var month = currentRecord.getValue({
                    fieldId: 'custrecord837'
                });

                currentRecord.setValue({
                    fieldId: 'custrecord837',
                    value: currentMonthValue
                })

                var monthField = currentRecord.getField({
                    fieldId: 'custrecord837'
                });

                monthField.isDisabled = true;

                disableFields(currentRecord);
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
                var itemId = result.getText({
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

            var matchedKeys = {};

            // Process search results: Add or update sublist lines, and track matches
            Object.keys(results).forEach(function (itemId) {
                var itemData = results[itemId];

                if (!checkAndUpdateSublist(currentRecord, itemData, 'SO', customer)) {
                    // If result is not found in sublist, add a new line
                    populateSublistLine(currentRecord, itemData, contextMode, 'SO', customer);
                }
            });

            // Second, iterate through sublist and remove unmatched lines
            // removeUnmatchedSublistLines(currentRecord, matchedKeys);

            if (searchFulfillment) {
                loadItemFulfillment(currentRecord, customer)
            }

            disableFields(currentRecord);
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
    }

    // Function to update sublist and check for matches
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
            var totalDRquantity = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord835',
                line: i
            });

            // If there is a match, update and commit the sublist
            if (currentSO && currentItem) {
                if (recType === 'DR') {
                    if (currentItem === results.getText({
                            name: 'item',
                            summary: search.Summary.GROUP
                        })) {

                        currentRecord.selectLine({
                            sublistId: sublistId,
                            line: i
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

                            var field = currentRecord.getCurrentSublistField({
                                sublistId: sublistId,
                                fieldId: fieldId
                            });

                            // if (field.isDisabled == false) {
                            if (gap > 0) {
                                if (fieldValue < gap && fieldValue > 0) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: fieldId,
                                        value: 0
                                    });

                                    gap -= fieldValue;
                                } else if (fieldValue >= gap) {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: fieldId,
                                        value: parseInt(fieldValue - gap),
                                    });
                                    gap = 0;
                                }
                            } else if (gap < 0) {
                                currentRecord.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: fieldId,
                                    value: 0
                                });

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
                    /* Object.entries(results).forEach(function ([key, value]) {
                        log.debug("Property", "Key: " + key + ", Value: " + JSON.stringify(value));
                    }); */

                    for (var key in results) {
                        if (results.hasOwnProperty(key) && key == 'Item ID') {
                            var itemData = results[key];

                            if (itemData == currentItem) {
                                log.debug({
                                    title: itemData,
                                    details: 'match'
                                })
                                
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
                                    title: results["Item ID"] + ': ' + currentSO,
                                    details: 'SO exist: ' + salesOrders.includes(currentSO)
                                })

                                if (salesOrders.includes(currentSO)) {
                                    currentRecord.commitLine({
                                        sublistId: sublistId
                                    });

                                    return true;
                                } else {
                                    var replacementSO = results["Sales Orders"].length > 0 ? results["Sales Orders"][0] : null;

                                    log.debug({
                                        title: 'SO closed',
                                        details: 'replacement SO: ' + replacementSO
                                    })

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

    // Populate a sublist line
    function populateSublistLine(currentRecord, result, contextMode, recType, customer) {
        isFieldChangeScriptActive = false;

        if (populate) {
            currentRecord.selectNewLine({
                sublistId: sublistId
            });

            if (contextMode === 'edit') {
                log.debug({
                    title: 'DR',
                    details: result.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                })
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord784',
                    value: result.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord785',
                    value: result.getValue({
                        name: 'salesdescription',
                        join: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                if (recType == 'SO') {
                    currentRecord.setCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: 'custrecord786',
                        text: result.getValue({
                            name: 'tranid',
                            summary: search.Summary.GROUP
                        })
                    });
                } else if (recType == 'DR') {
                    currentRecord.setCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: 'custrecord786',
                        text: result.getText({
                            name: 'createdfrom',
                            summary: search.Summary.GROUP
                        }).split('#')[1]
                    });
                }
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
            } else if (contextMode === 'create') {
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord784',
                    value: result.getValue({
                        name: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                currentRecord.setCurrentSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord785',
                    text: result.getValue({
                        name: 'salesdescription',
                        join: 'item',
                        summary: search.Summary.GROUP
                    })
                });
                if (recType == 'SO') {
                    currentRecord.setCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: 'custrecord786',
                        text: result.getValue({
                            name: 'tranid',
                            summary: search.Summary.GROUP
                        })
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord836',
                        value: customer
                    });
                } else if (recType == 'DR') {
                    currentRecord.setCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: 'custrecord786',
                        text: result.getText({
                            name: 'createdfrom',
                            summary: search.Summary.GROUP
                        }).split('#')[1]
                    });
                    var quantity = parseInt(result.getValue({
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
        }

        populate = true;
        isFieldChangeScriptActive = true;
    }

    // Function to remove sublist lines that have no matching entries in the search results
    function removeUnmatchedSublistLines(currentRecord, matchedKeys) {
        var lineCount = currentRecord.getLineCount({
            sublistId: sublistId
        });

        for (var i = lineCount - 1; i >= 0; i--) {
            var currentSO = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord786',
                line: i
            });
            var currentItem = currentRecord.getSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord784',
                line: i
            });

            var key = currentSO + '-' + currentItem;

            if (!matchedKeys[key]) {
                currentRecord.removeLine({
                    sublistId: sublistId,
                    line: i
                });

                /* log.debug({
                    title: 'Removed line ' + i,
                    details: 'key: ' + key
                }) */
            }
        }
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

    // Disable specific fields in sublist
    function disableFields(currentRecord) {
        var disableFieldIds = ['custrecord784', 'custrecord786', 'custrecord835', 'custrecord785', 'custrecord845', 'custrecord836', 'custrecord846'];
        // if (searchFulfillment) {
        for (var x = 0; x < currentDay - 1; x++) {
            disableFieldIds.push(fieldIdsToCheck[x]);
        }
        // }


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
                if (field) {
                    field.isDisabled = true;
                }
            }
        });
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});