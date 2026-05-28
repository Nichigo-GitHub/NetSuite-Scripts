/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search'], function (search) {

    function post(context) {
        try {
            var results = [];
            var savedSearch = search.load({
                id: 'customsearch5306'
            });
            var pagedData = savedSearch.runPaged({
                pageSize: 1000
            });

            /* var columns = savedSearch.columns || [];
            var columnMeta = columns.map(function (column) {
                return {
                    name: column.name,
                    join: column.join || '',
                    summary: column.summary || '',
                    label: column.label || '',
                    formula: column.formula || ''
                };
            });

            results.push({
                columns: columnMeta
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    var row = {};

                    columns.forEach(function (column) {
                        var key = column.name;
                        if (column.join) {
                            key = column.join + '_' + key;
                        }
                        if (column.summary) {
                            key += '_' + column.summary;
                        }

                        row[key] = {
                            value: result.getValue(column),
                            text: result.getText(column)
                        };
                    });

                    results.push(row);
                });
            }); */

            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    var row = {
                        tag: result.getValue({
                            name: 'formulatext',
                            summary: search.Summary.MIN,
                            label: 'Inventory Tag'
                        }),
                        bin: result.getValue({
                            name: 'binnumber',
                            summary: search.Summary.GROUP,
                            label: 'Bin'
                        }),
                        upcCode: result.getValue({
                            name: 'custbody_upccode',
                            summary: search.Summary.GROUP,
                            label: 'UPC Code'
                        }),
                        item: result.getValue({
                            name: 'item',
                            summary: search.Summary.GROUP,
                            label: 'Item'
                        }),
                        desc: result.getValue({
                            name: 'purchasedescription',
                            join: 'item',
                            summary: search.Summary.GROUP,
                            label: 'Description'
                        }),
                        qty: result.getValue({
                            name: 'binnumberquantity',
                            summary: search.Summary.SUM,
                            label: 'Qty'
                        }),
                        joNum: result.getValue({
                            name: 'formulatext',
                            summary: search.Summary.GROUP,
                            label: 'JO'
                        }),                  
                        customer: result.getValue({
                            name: 'formulatext',
                            summary: search.Summary.MAX,
                            label: 'Customer'
                        }),
                        FGcode: result.getValue({
                            name: 'custbody388',
                            summary: search.Summary.MIN,
                            label: 'FG Code'
                        }),
                        transferDate: result.getValue({
                            name: 'formuladate',
                            summary: search.Summary.MAX,
                            label: 'Transfer Date'
                        }),
                        age: result.getValue({
                            name: 'formulanumeric',
                            summary: search.Summary.MIN,
                            label: 'Age'
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