// Load sublist data
function loadSublistData(currentRecord, customer, contextMode) {
    try {
        var searchObj = search.create({
            type: 'purchaseorder',
            filters: [
                ['type', 'anyof', 'PurchOrd'], 'AND', ['mainline', 'is', 'F'],
                'AND', ['subsidiary', 'anyof', '14'], 'AND', ['vendtype', 'noneof', '3'],
                'AND', ['status', 'noneof', 'PurchOrd:C', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:A'],
                'AND', ['formulanumeric: {quantity}-{quantityshiprecv}', 'notlessthanorequalto', '0'],
                'AND', ['closed', 'is', 'F'], 'AND', ['custcol50', 'contains', 'DRS'],
                'AND', ['custbody41', 'anyof', customer]
            ],
            columns: [
                'custbody39', 'rate', 'trandate', 'tranid', 'memo', 'custbody41', 'mainname',
                {
                    name: 'item',
                    sort: search.Sort.ASC
                },
                {
                    name: 'formulanumeric',
                    formula: '{quantity}-{quantityshiprecv}'
                }
            ]
        });

        var searchResults = [];
        var pageSize = 100,
            start = 0,
            resultCount = 0;

        do {
            var pagedResults = searchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            searchResults = searchResults.concat(pagedResults);
            resultCount = pagedResults.length;
            start += pageSize;
        } while (resultCount === pageSize);

        var matchedKeys = {};

        // Process search results: Add or update sublist lines, and track matches
        searchResults.forEach(function (result) {
            if (!checkAndUpdateSublist(currentRecord, result)) {
                // If result is not found in sublist, add a new line
                populateSublistLine(currentRecord, result);
            }

            var poNumber = result.getValue('tranid');
            var itemName = result.getText('item');
            matchedKeys[poNumber + '-' + itemName] = true;
        });

        // Second, iterate through sublist and remove unmatched lines
        removeUnmatchedSublistLines(currentRecord, matchedKeys);

        updateRemainingBalance(currentRecord);
        disableFields(currentRecord);
    } catch (e) {
        throw e;
    }
}

// Function to update sublist and check for matches
function checkAndUpdateSublist(currentRecord, result) {
    var lineCount = currentRecord.getLineCount({
        sublistId: sublistId
    });

    for (var i = 0; i < lineCount; i++) {
        var currentPO = currentRecord.getSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord537',
            line: i
        });
        var currentItem = currentRecord.getSublistText({
            sublistId: sublistId,
            fieldId: 'custrecord538',
            line: i
        });

        // If there is a match, update and commit the sublist
        if (currentPO === result.getValue('tranid') && currentItem === result.getText('item')) {
            currentRecord.selectLine({
                sublistId: sublistId,
                line: i
            });
            var previousBal = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord540'
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord780',
                value: previousBal
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord540',
                value: result.getValue('formulanumeric')
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord700',
                value: result.getValue('rate')
            });
            currentRecord.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord695',
                text: result.getText('mainname')
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_remarks',
                value: null
            });

            currentRecord.commitLine({
                sublistId: sublistId
            });

            return true; // Match found
        }
    }

    return false; // No match
}

// Function to remove sublist lines that have no matching entries in the search results
function removeUnmatchedSublistLines(currentRecord, matchedKeys) {
    var lineCount = currentRecord.getLineCount({
        sublistId: sublistId
    });

    for (var i = lineCount - 1; i >= 0; i--) {
        var currentPO = currentRecord.getSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord537',
            line: i
        });
        var currentItem = currentRecord.getSublistText({
            sublistId: sublistId,
            fieldId: 'custrecord538',
            line: i
        });

        var key = currentPO + '-' + currentItem;

        if (!matchedKeys[key]) {
            currentRecord.removeLine({
                sublistId: sublistId,
                line: i
            });
        }
    }
}

// Populate a sublist line
function populateSublistLine(currentRecord, result) {
    isFieldChangeScriptActive = false;

    currentRecord.selectNewLine({
        sublistId: sublistId
    });
    currentRecord.setCurrentSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord698',
        text: result.getValue('trandate')
    });
    currentRecord.setCurrentSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord537',
        text: result.getValue('tranid')
    });
    currentRecord.setCurrentSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord700',
        value: result.getValue('rate')
    });
    currentRecord.setCurrentSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord538',
        text: result.getText('item')
    });
    currentRecord.setCurrentSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord539',
        text: result.getValue({
            name: 'memo'
        })
    });
    currentRecord.setCurrentSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord695',
        text: result.getText('mainname')
    });
    currentRecord.setCurrentSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord540',
        value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
    });
    currentRecord.setCurrentSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord780',
        value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
    });
    initializeSublistFieldsToZero(currentRecord);
    currentRecord.setCurrentSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord501',
        value: new Date().getMonth() + 1
    });

    currentRecord.commitLine({
        sublistId: sublistId
    });
}