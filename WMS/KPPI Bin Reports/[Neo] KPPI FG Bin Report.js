/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search'], function (search) {

    function post(context) {
        try {
            var savedSearch = search.load({
                id: 'customsearch5384'
            });
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            var start = parseInt(context.start, 10) || 0;
            var pageSize = parseInt(context.pageSize, 10) || pagedData.count;
            var results = [];
            var currentIndex = 0;
            var collected = 0;

            log.debug({
                title: 'Search Count',
                details: pagedData.count
            });

            log.debug({
                title: 'Page Count',
                details: pagedData.pageRanges.length
            });

            outerLoop:
            for (var p = 0; p < pagedData.pageRanges.length; p++) {
                var page = pagedData.fetch({
                    index: pagedData.pageRanges[p].index
                });

                for (var r = 0; r < page.data.length; r++) {
                    if (currentIndex < start) {
                        currentIndex++;
                        continue;
                    }

                    if (collected >= pageSize)
                        break outerLoop;

                    var result = page.data[r];

                    results.push({
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
                        customer: result.getValue({
                            name: 'formulatext',
                            summary: search.Summary.MAX
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
                    });

                    currentIndex++;
                    collected++;
                }
            }

            log.debug({
                title: 'Results Returned',
                details: results.length
            });

            return {
                results: results
            };

        } catch (e) {
            log.debug('RESTLET ERROR', e);

            return {
                error: e.message
            };
        }
    }

    return {
        post: post
    };
});