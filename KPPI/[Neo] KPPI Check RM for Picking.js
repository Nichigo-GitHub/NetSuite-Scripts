/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search'], function (search) {

    function beforeSubmit(context) {
        var rec = context.newRecord;

        var subsidiary = rec.getValue({
            fieldId: 'subsidiary'
        });

        var location = rec.getValue({
            fieldId: 'location'
        });

        if (location === 820 && subsidiary === 18) {
            var custbody23 = rec.getValue({
                fieldId: 'custbody23'
            });

            var lineCount = rec.getLineCount({
                sublistId: 'component'
            });

            var itemIds = [];

            log.error('Line Count', lineCount);

            for (var i = 0; i < lineCount; i++) {
                var itemId = rec.getSublistValue({
                    sublistId: 'component',
                    fieldId: 'item',
                    line: i
                });

                var itemSource = rec.getSublistValue({
                    sublistId: 'component',
                    fieldId: 'itemsource',
                    line: i
                });

                log.error('Line ' + i, 'Item: ' + itemId + ' | Source: ' + itemSource);

                // ❌ Skip Phantom
                if (itemSource === 'PHANTOM') {
                    continue;
                }

                itemIds.push(itemId);
            }

            // ✅ Load saved search
                var searchObj = search.load({
                    id: 'customsearch5329'
                });

                // ✅ Add filters
                searchObj.filters.push(
                    search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: itemIds
                    })
                );

                if (custbody23) {
                    searchObj.filters.push(
                        search.createFilter({
                            name: 'custbody23',
                            operator: search.Operator.CONTAINS,
                            values: custbody23
                        })
                    );
                }

            var results = searchObj.run().getRange({
                start: 0,
                end: 1000
            });

            log.error('Results for Item ' + itemId, results.length);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});