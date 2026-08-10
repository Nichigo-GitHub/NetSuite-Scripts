/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define([
    'N/search',
    'N/record',
    'N/runtime',
    'N/log'
], function (search, record, runtime, log) {

    function get(request) {

        var response = {
            isValid: true,
            itemsList: []
        };

        try {

            var params = request.params || {};

            log.debug('params', params);

            var countConfigId = params.countConfigIdParam;
            var locationId = params.locationIdParam;
            var zoneId = params.zoneIdParam;
            var aisleList = params.aisleParam;
            var selectedZone = params.zoneIdParam;

            var configRec = record.load({
                type: 'customrecord_sc_count_configuration',
                id: countConfigId
            });

            var savedSearchUrl = configRec.getValue({
                fieldId: 'custpage_sc_items_saved_search_link'
            });

            if (!savedSearchUrl) {
                throw 'Count Configuration has no Saved Search.';
            }

            var match = savedSearchUrl.match(/[?&]searchid=([^&]+)/);

            if (!match) {
                throw 'Unable to determine Saved Search ID.';
            }

            var savedSearchId = match[1];

            log.debug({
                title: 'Saved Search ID',
                details: savedSearchId
            });

            var ss = search.load({
                id: savedSearchId
            });

            var filters = ss.filters;

            if (locationId) {
                filters.push(search.createFilter({
                    name: 'location',
                    join: 'binOnHand',
                    operator: search.Operator.ANYOF,
                    values: params.locationId
                }));
            }

            if (params.item) {
                filters.push(search.createFilter({
                    name: 'name',
                    operator: search.Operator.STARTSWITH,
                    values: params.item
                }));
            }

            if (params.bin) {
                filters.push(search.createFilter({
                    name: 'binnumber',
                    join: 'binOnHand',
                    operator: search.Operator.ANYOF,
                    values: params.binId
                }));
            }

            if (params.upcCode) {
                filters.push(search.createFilter({
                    name: 'upccode',
                    operator: search.Operator.IS,
                    values: params.upcCode
                }));
            }

            ss.filters = filters;

            ss.run().each(function (result) {
                var existing = search.create({
                    type: 'customrecord_sc_item_count',
                    filters: [
                        ['custrecord_sc_inventoryitem', 'anyof',
                            result.id]
                    ]
                }).runPaged().count;

                if (existing > 0) {
                    log.debug()
                    return true;
                }

                var row = {};

                row.action = 'Count';

                row.inventoryItemId = result.id;

                row.itemId =
                    result.getValue('item');

                row.item =
                    result.getText('item');

                row.itemName =
                    result.getText('item');

                row.itemDescription =
                    result.getValue('description');

                row.truncatedDisplayName =
                    result.getValue('displayname');

                row.truncatedSalesDescription =
                    result.getValue('salesdescription');

                row.binId =
                    result.getValue('binnumber');

                row.binNumber =
                    result.getText('binnumber');

                row.locationId =
                    result.getValue('location');

                row.locationName =
                    result.getText('location');

                row.upcCode =
                    result.getValue('upccode');

                row.quantity =
                    Number(result.getValue('quantityavailable'));

                row.currentCount = 0;

                row.comments = '';

                row.stockUnitId =
                    result.getValue('stockunit');

                row.stockUnitName =
                    result.getText('stockunit');

                row.inventoryStatusId =
                    result.getValue('inventorystatus');

                row.inventoryStatus =
                    result.getText('inventorystatus');

                response.itemsList.push(row);

                return true;

            });

            log.debug(
                'Items Returned',
                response.itemsList.length
            );

        }
        catch (e) {

            response.isValid = false;
            response.errorMessage = e.message;

            log.error({
                title: 'SC Item List',
                details: e
            });

        }

        return response;

    }

    return {
        get: get
    };

});