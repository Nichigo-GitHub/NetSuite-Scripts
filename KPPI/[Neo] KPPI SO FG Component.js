/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/search', 'N/record', 'N/log'], function (currentRecord, search, record, log) {
    function fieldChanged(context) {
        // Get the current record object from the context
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        var custform = currentRecord.getValue({
            fieldId: 'customform'
        });

        if (fieldId === 'custcol65') {
            if (custform == 606 || custform == 658) {
                try {
                    // Define search filters
                    var item_code = currentRecord.getCurrentSublistText({
                        sublistId: 'item',
                        fieldId: 'custcol65'
                    });

                    var componentRMArray = []; // Array to store componentRM values

                    var assemblyItemSearchFilters = [
                        // Add filters as needed
                        ['itemid', 'is', item_code] // Replace 'custitem123' with the actual field ID for item_code
                    ];

                    const assemblyItemSearchColItemId = search.createColumn({ name: 'itemid', sort: search.Sort.ASC });
                    const assemblyItemSearchColSalesDescription = search.createColumn({ name: 'salesdescription' });
                    const assemblyItemSearchColComponentRM = search.createColumn({ name: 'formulatext', formula: 'CASE WHEN {memberitem.type} = \'Inventory Item\' THEN {memberitem} ELSE {memberitem.memberitem} END' });

                    const assemblyItemSearch = search.create({
                        type: 'assemblyitem',
                        filters: assemblyItemSearchFilters,
                        columns: [
                            assemblyItemSearchColItemId,
                            assemblyItemSearchColSalesDescription,
                            assemblyItemSearchColComponentRM,
                        ],
                    });

                    var assemblyItemSearchResults = assemblyItemSearch.run().getRange({
                        start: 0,
                        end: 1000
                    });

                    assemblyItemSearchResults.forEach(function (result) {
                        var itemId = result.getValue(assemblyItemSearchColItemId);
                        var salesDescription = result.getValue(assemblyItemSearchColSalesDescription);
                        var componentRM = result.getValue(assemblyItemSearchColComponentRM);

                        log.error('Component RM', componentRM);
                        log.error('item Id', itemId);

                        componentRMArray.push(componentRM); // Push componentRM value to array

                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol246',
                            value: componentRM
                        });

                    });

                    var combinedComponentRM = componentRMArray.join('/ \n'); // Join componentRM values into a single string

                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol246',
                        value: combinedComponentRM
                    });
                } catch (e) {
                    log.error('Error', e);
                }
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});