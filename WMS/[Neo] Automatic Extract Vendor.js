/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/log'], function(record, log) {
    function doGet(params) {
        try {
            var joNum = params.JOnum;
            var itemInternalId = params.itemInternalId;

            // Load Work Order record
            var workOrder = record.load({
                type: record.Type.WORK_ORDER,
                id: joNum
            });

            // Extract Customer, Assembly Item, Subsidiary
            var subsidiaryId = workOrder.getValue({ fieldId: 'subsidiary' });

            // Load Item record
            var itemRecord = record.load({
                type: record.Type.INVENTORY_ITEM,
                id: itemInternalId
            });

            // Find vendor with same subsidiary in itemvendor sublist
            var vendorId = null;
            var vendorCount = itemRecord.getLineCount({ sublistId: 'itemvendor' });
            for (var i = 0; i < vendorCount; i++) {
                var vendorSubsidiary = itemRecord.getSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'subsidiary',
                    line: i
                });
                if (vendorSubsidiary == subsidiaryId) {
                    vendorId = itemRecord.getSublistValue({
                        sublistId: 'itemvendor',
                        fieldId: 'vendor',
                        line: i
                    });
                    break;
                }
            }

            // Log extracted values
            log.error({ title: 'Vendor', details: vendorId });

            return {
                vendor: vendorId
            };
        } catch (e) {
            log.error({ title: 'Error', details: e });
            return { error: e.message };
        }
    }

    return {
        get: doGet
    };
});