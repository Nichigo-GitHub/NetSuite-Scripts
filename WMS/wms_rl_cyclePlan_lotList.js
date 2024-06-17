/**
 * Copyright � 2022, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility'],
    function (search, utility) {

        /**
         * This function is to fetch PO details based on the item
         */
        function doPost(requestBody) {
            var response = {};
            var warehouseLocationId = '';
            var itemInternalId = '';
            var binInternalId = '';
            var debugString = '';
            try {
                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    debugString = debugString + ",requestParams :" + requestParams;
                    warehouseLocationId = requestParams.warehouseLocationId;
                    itemInternalId = requestParams.itemInternalId;
                    binInternalId = requestParams.binInternalId;

                    var objLotListDetails = {};
                    var cycleCountDetails = {};

                    cycleCountDetails['warehouseLocationId'] = warehouseLocationId;
                    cycleCountDetails['itemInternalId'] = itemInternalId;
                    cycleCountDetails['binInternalId'] = binInternalId;

                    var lotListDetails = getCycleCountLotListDetails(cycleCountDetails);
                    objLotListDetails.lotListDetails = lotListDetails;

                    response = {
                        lotListDetails: objLotListDetails.lotListDetails,
                        isValid: true
                    };
                }
            } catch (e) {
                response['isValid'] = false;
                response['errorMessage'] = e.message;
                log.error({title: 'errorMessage', details: e.message + " Stack :" + e.stack});
                log.error({title: 'debugString', details: debugString});
            }
            return response;
        }

        function getCycleCountLotListDetails(cycleCountDetails) {
            var warehouseLocationId = cycleCountDetails['warehouseLocationId'];
            var itemInternalId = cycleCountDetails['itemInternalId'];
            var binInternalId = cycleCountDetails['binInternalId'];

            var objSearchDetails = [];

            try {
                var cycleCountLotListSearch = search.load({id: 'customsearch_wms_cyclecount_lotlist', type: 'inventorybalance'});
                var cycleCountLotListFilters = cycleCountLotListSearch.filters;
                if (utility.isValueValid(warehouseLocationId)) {
                    cycleCountLotListFilters.push(search.createFilter({
                        name: 'location',
                        operator: search.Operator.ANYOF,
                        values: [warehouseLocationId]
                    }));
                }
                if (utility.isValueValid(itemInternalId)) {
                    cycleCountLotListFilters.push(search.createFilter({
                        name: 'item',
                        operator: search.Operator.ANYOF,
                        values: itemInternalId
                    }))
                }
                if (utility.isValueValid(binInternalId)) {
                    cycleCountLotListFilters.push(search.createFilter({
                        name: 'binnumber',
                        operator: search.Operator.ANYOF,
                        values: binInternalId
                    }));
                }

                cycleCountLotListSearch.filters = cycleCountLotListFilters;
                objSearchDetails = utility.getSearchResultInJSON(cycleCountLotListSearch);

            } catch (e) {
                log.error({title: 'exception in getCycleCountLotListDetails', details: e});
            }
            log.debug({title: 'cycleCountLotListSearch', details: objSearchDetails});

            return objSearchDetails;
        }

        return {
            'post': doPost
        };
    });