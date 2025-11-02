/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

    function afterSubmit(context) {
        var currentRecord = context.newRecord;
        var recordId = currentRecord.id;

        // Load the record in edit mode
        var rec = record.load({
            type: currentRecord.type,
            id: recordId,
            isDynamic: false
        });

        var itemCount = rec.getLineCount({
            sublistId: 'item'
        });

        for (var i = 0; i < itemCount; i++) {
            var itemId = rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            try {
                // Clear existing values for BIN and Quantity before updating
                rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol554', // BIN field
                    line: i,
                    value: ''
                });

                rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol555', // Quantity field
                    line: i,
                    value: ''
                });

                // Load the saved search
                var loadedSearch = search.load({
                    id: 'customsearch4256' // Replace with your saved search ID
                });

                // Define search filters
                var filters = [
                    search.createFilter({
                        name: 'subsidiary',
                        operator: search.Operator.ANYOF,
                        values: ['4']
                    }),
                    search.createFilter({
                        name: 'quantityonhand',
                        join: 'inventorynumberbinonhand',
                        operator: search.Operator.NOTEQUALTO,
                        values: ['0']
                    }),
                    search.createFilter({
                        name: 'location',
                        join: 'inventorynumberbinonhand',
                        operator: search.Operator.ANYOF,
                        values: ['407']
                    }),
                    search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: [itemId] // Filter by the current item ID
                    })
                ];

                // Define search columns
                var columns = [
                    search.createColumn({
                        name: 'custitem24',
                        label: 'Customer'
                    }),
                    search.createColumn({
                        name: 'itemid',
                        sort: search.Sort.ASC,
                        label: 'Item'
                    }),
                    search.createColumn({
                        name: 'displayname',
                        label: 'Customer Code'
                    }),
                    search.createColumn({
                        name: 'salesdescription',
                        label: 'Description'
                    }),
                    search.createColumn({
                        name: 'inventorynumber',
                        join: 'inventoryNumberBinOnHand',
                        sort: search.Sort.ASC,
                        label: 'JO Number'
                    }),
                    search.createColumn({
                        name: 'binnumber',
                        join: 'inventoryNumberBinOnHand',
                        sort: search.Sort.ASC,
                        label: 'BIN'
                    }),
                    search.createColumn({
                        name: 'quantityonhand',
                        join: 'inventoryNumberBinOnHand',
                        label: 'Qty'
                    }),
                    search.createColumn({
                        name: 'formulatext',
                        formula: "CASE WHEN {type} = 'Inventory Item' THEN 'RM' ELSE 'FG' END",
                        label: 'Item Type'
                    })
                ];

                // Apply filters and columns to the search
                loadedSearch.filters = filters;
                loadedSearch.columns = columns;

                // Run the search
                var resultSet = loadedSearch.run();
                var results = resultSet.getRange({
                    start: 0,
                    end: 100 // Adjust as needed
                });

                // Check if search returned any results
                if (results && results.length > 0) {
                    var maxQuantity = 0;
                    var binWithMaxQty = '';
                    var itemWithMaxQty = '';

                    // Iterate through the results to find the bin with the highest quantity
                    results.forEach(function (result) {
                        var binName = result.getText({
                            name: 'binnumber',
                            join: 'inventoryNumberBinOnHand'
                        });
                        var quantity = parseFloat(result.getValue({
                            name: 'quantityonhand',
                            join: 'inventoryNumberBinOnHand'
                        }));

                        // Compare and find the bin with the maximum quantity
                        if (quantity > maxQuantity) {
                            maxQuantity = quantity;
                            binWithMaxQty = binName;
                            itemWithMaxQty = result.getValue({
                                name: 'itemid'
                            });
                        }
                    });

                    // Update the record's sublist fields with the bin having the maximum quantity
                    if (binWithMaxQty && maxQuantity > 0) {
                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol554', // Adjust your custom field ID here for BIN
                            line: i,
                            value: binWithMaxQty
                        });

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol555', // Adjust your custom field ID here for Quantity
                            line: i,
                            value: maxQuantity
                        });

                        log.debug('Item: ' + itemWithMaxQty + ' | Bin with max qty: ' + binWithMaxQty + ' | Qty: ' + maxQuantity);
                    }

                } else {
                    // No results found for this item
                    log.debug('No bins with quantity for item: ' + itemId);
                }

            } catch (e) {
                log.error('Error on item line ' + i + ' with item ID ' + itemId, e);
            }
        }

        // Step 4: Loop back through record lines and update
        for (var j = 0; j < itemCount; j++) {
            var lineItemId = rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: j
            });

            // Clear BIN and Quantity fields before updating
            rec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol554', // BIN custom field
                line: j,
                value: ''
            });
            rec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol555', // Qty custom field
                line: j,
                value: ''
            });

            if (itemBinMap[lineItemId]) {
                var binData = itemBinMap[lineItemId];

                rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol554', // BIN custom field
                    line: j,
                    value: binData.bin
                });
                rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol555', // Qty custom field
                    line: j,
                    value: binData.qty
                });

                log.debug('Updated line ' + j, {
                    itemId: lineItemId,
                    bin: binData.bin,
                    qty: binData.qty
                });
            }
        }

        // Save the record
        rec.save();
    }

    return {
        afterSubmit: afterSubmit
    };
});