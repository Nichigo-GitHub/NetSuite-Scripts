/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
    function doGet(params) {
        var joNum = params.JOnum;

        log.error({
            title: 'params',
            details: params
        });
        if (!joNum) {
            var tranId = params.joId || params.joId_2;
            if (!tranId) {
                try {
                    if (params.itemType && params.itemType.toLowerCase() === 'inventoryitem' && params.itemInternalId) {
                        var itemRecord = record.load({
                            type: record.Type.INVENTORY_ITEM,
                            id: params.itemInternalId
                        });
                        var customer = itemRecord.getText({ fieldId: 'custitem24' });
                        log.debug({ title: 'Customer from Item', details: customer });
                        return customer;
                    }
                } catch (e) {
                    log.error({ title: 'Item Load Error', details: e });
                    return { error: 'Failed to resolve customer from item' };
                }
                log.error({ title: 'Missing identifier', details: 'Provide JOnum or tranid' });
                return { error: 'Missing JOnum and tranid' };
            }

            var workOrderSearch = search.create({
                type: record.Type.WORK_ORDER,
                filters: [['tranid', 'is', tranId]],
                columns: ['internalid']
            });

            var results = workOrderSearch.run().getRange({ start: 0, end: 1 });
            if (!results || results.length === 0) {
                log.error({ title: 'Work Order Not Found', details: 'tranid: ' + tranId });
                return { error: 'Work order not found' };
            }

            joNum = results[0].getValue({ name: 'internalid' }) || results[0].id;
            log.debug({ title: 'Resolved joNum', details: joNum });
        }
        // Load Work Order record
        var workOrder = record.load({
            type: record.Type.WORK_ORDER,
            id: joNum
        });

        // Extract Customer
        var customerId = workOrder.getText({ fieldId: 'entity' });

        log.error({ title: 'Customer', details: customerId });

        return customerId;
    }

    return {
        get: doGet
    };
});