/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search'], function (search) {

    function post(context) {
        try {
            var results = [];
            var savedSearch = search.load({
                id: 'customsearch5228'
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
                    type: column.type || ''
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
                        bin: result.getText({
                            name: 'binnumber',
                            join: 'binOnHand',
                            summary: search.Summary.GROUP,
                            label: 'BIN'
                        }),
                        internalId: result.getValue({
                            name: 'internalid',
                            summary: search.Summary.GROUP,
                            label: 'Internal ID'
                        }),
                        item: result.getValue({
                            name: 'itemid',
                            summary: search.Summary.GROUP,
                            label: 'Item'
                        }),
                        desc: result.getValue({
                            name: 'salesdescription',
                            summary: search.Summary.GROUP,
                            label: 'Description'
                        }),
                        qty: result.getValue({
                            name: 'quantityonhand',
                            join: 'binOnHand',
                            summary: search.Summary.GROUP,
                            label: 'Qty'
                        }),
                        dateReceived: result.getValue({
                            name: 'formuladate',
                            summary: search.Summary.MAX,
                            label: 'Received Date'
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