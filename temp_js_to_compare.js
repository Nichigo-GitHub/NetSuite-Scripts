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

        var matchedKeys = {}; // Stores keys of processed POs and Items
        var sublistKeys = {}; // Stores existing sublist entries for deletion tracking

        var lineCount = currentRecord.getLineCount({
            sublistId: sublistId
        });

        // Step 1: Load sublist into sublistKeys
        for (var i = 0; i < lineCount; i++) {
            var poNumber = currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord537',
                line: i
            });
            var itemName = currentRecord.getSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord538',
                line: i
            });

            var key = poNumber + '-' + itemName;
            sublistKeys[key] = i; // Store line index for later removal
        }

        // Step 2: Process search results
        searchResults.forEach(function (result) {
            var poNumber = result.getValue('tranid');
            var itemName = result.getText('item');
            var key = poNumber + '-' + itemName;

            if (sublistKeys.hasOwnProperty(key)) {
                // If found in sublist, update and mark as matched
                updateSublistLine(currentRecord, sublistKeys[key], result);
                delete sublistKeys[key]; // Remove from deletion list
            } else {
                // If not found, add new line
                populateSublistLine(currentRecord, result);
            }

            matchedKeys[key] = true;
        });

        // Step 3: Remove unmatched sublist lines
        Object.keys(sublistKeys).forEach(function (key) {
            currentRecord.removeLine({
                sublistId: sublistId,
                line: sublistKeys[key]
            });
        });

        updateRemainingBalance(currentRecord);
        disableFields(currentRecord);
    } catch (e) {
        throw e;
    }
}

// Update an existing sublist line
function updateSublistLine(currentRecord, lineIndex, result) {
    currentRecord.selectLine({
        sublistId: sublistId,
        line: lineIndex
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
}

// Populate a new sublist line
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