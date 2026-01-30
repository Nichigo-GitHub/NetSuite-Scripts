/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', './big', './wms_workOrderUtility_kppi'],

    function (search, utility, translator, Big, woUtility) {

        function doPost(requestBody) {

            var itemListDetails = {};
            var woItemList = [];

            try {
                log.debug('doPost:start', requestBody);

                if (!utility.isValueValid(requestBody) || !requestBody.params) {
                    return {
                        isValid: false,
                        errorMessage: 'Invalid request'
                    };
                }

                var params = requestBody.params;
                var whLocation = params.warehouseLocationId;
                var transactionName = params.transactionName;
                var transactionType = params.transactionType;
                var mode = params.mode || 'DEFAULT';

                if (!utility.isValueValid(transactionName)) {
                    return {
                        isValid: false,
                        errorMessage: translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER')
                    };
                }

                // Resolve WO internal ID
                var woItemListResults = woUtility.getWOLineItemList_V3({
                    whLocation: whLocation,
                    transactionName: transactionName,
                    transactionType: transactionType
                });

                if (!woItemListResults || woItemListResults.length === 0) {
                    return {
                        isValid: false,
                        errorMessage: translator.getTranslationString('WORKORDER_PICKING.ORDER_PICKED_BACKORDERED')
                    };
                }

                var woInternalId = woItemListResults[0].internalid;

                var orderList = getNonPhantomWOComponentList(woInternalId, transactionName);

                log.debug('doPost:end', { orderList: orderList });

                return {
                    isValid: true,
                    orderList: orderList
                };


            } catch (e) {
                log.error('RESTlet error', e);
                return {
                    isValid: false,
                    errorMessage: e.message
                };
            }
        }

        /* ============================================================
         * 🧩 NEW UTILITY FUNCTION
         * Returns non-phantom WO orderList regardless of backorder
         * ============================================================
         */
        function getNonPhantomWOComponentList(woInternalId, transactionName) {
            var results = [];

            var woSearch = search.create({
                type: search.Type.WORK_ORDER,
                filters: [
                    ['internalid', 'anyof', woInternalId],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['item.type', 'noneof', 'Phantom'],
                    'AND',
                    ['item.type', 'noneof', 'Assembly']
                ],
                columns: [
                    'line',
                    'item',
                    'item.type',
                    'quantity',
                    'quantitycommitted',
                ]
            });

            woSearch.run().each(function (r) {
                results.push({
                    transactionLineNo: r.getValue('line'),
                    itemInternalId: r.getValue('item'),
                    itemName: r.getText('item'),
                    itemType: r.getValue('item.type'),
                    remQtyval: Number(r.getValue('quantity')) || 0,
                    committedQty: Number(r.getValue('quantitycommitted')) || 0,
                    transactionInternalId: woInternalId,
                    transactionName: transactionName, 
                    transactionType: 'WorkOrd'
                });
                return true;
            });

            return results;
        }

        return {
            post: doPost
        };
    });