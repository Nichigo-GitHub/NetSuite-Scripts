/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search'], function (search) {

    function post(context) {
        try {
            var results = [];
            var savedSearch = search.load({
                id: 'customsearch5384'
            });
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({ index: pageRange.index });

                page.data.forEach(function (result) {
                    var row = {
                        bin: result.getText({
                            name: 'binnumber',
                            join: 'inventoryNumberBinOnHand',
                            summary: search.Summary.GROUP
                        }),
                        type: result.getValue({
                            name: 'formulatext',
                            summary: search.Summary.GROUP
                        }),
                        item: result.getValue({
                            name: 'itemid',
                            summary: search.Summary.GROUP
                        }),
                        desc: result.getValue({
                            name: 'salesdescription',
                            summary: search.Summary.GROUP
                        }),
                        joNum: result.getValue({
                            name: 'inventorynumber',
                            join: 'inventoryNumberBinOnHand',
                            summary: search.Summary.GROUP
                        }),
                        qty: result.getValue({
                            name: 'quantityonhand',
                            join: 'inventoryNumberBinOnHand',
                            summary: search.Summary.MAX
                        }),
                        customer: result.getText({
                            name: 'custitem24',
                            summary: search.Summary.GROUP
                        }),
                        upc: result.getValue({
                            name: 'upccode',
                            summary: search.Summary.GROUP
                        }),
                        dateReceived: result.getValue({
                            name: 'formuladate',
                            summary: search.Summary.MIN
                        }),                        
                        age: result.getValue({
                            name: 'formulanumeric',
                            summary: search.Summary.MIN
                        })
                    };

                    results.push(row);
                });
            });

            log.debug('Results', results);

            return {
                results: results
            };

        } catch (e) {
            log.error('RESTLET ERROR', e);

            return {
                error: e.message
            };
        }
    }

    return {
        post: post
    };
});