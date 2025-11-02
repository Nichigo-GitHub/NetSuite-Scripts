/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/record', 'N/search', 'N/log'], function(record, log) {
    function doGet(params) {
        try {
            var joNum = params.JOnum;

            // Load Work Order record
            var workOrder = record.load({
                type: record.Type.WORK_ORDER,
                id: joNum
            });

            // Extract Assembly Item
            var assemblyItemId = workOrder.getValue({ fieldId: 'assemblyitem' });

            // Log extracted values
            log.error({ title: 'Assembly Item', details: assemblyItemId });

            return {
                assemblyItem: assemblyItemId,
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