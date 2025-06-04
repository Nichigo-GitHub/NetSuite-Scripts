/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record'], function (record) {
    function beforeSubmit(context) {
        if (context.type === context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var locationCleared = false;
            var lineCount = newRecord.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i < lineCount; i++) {
                var itemSource = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemsource',
                    line: i
                });

                if (itemSource === 'WORK_ORDER') {
                    locationCleared = true;
                    break;
                }
            }

            if (locationCleared == true) {
                var createdfrom = newRecord.getValue({
                    fieldId: 'createdfrom'
                });
                if (!createdfrom) {
                    newRecord.setValue({
                        fieldId: 'location',
                        value: null
                    });

                    log.debug({
                        title: 'beforeSubmit',
                        details: 'Location cleared for item source WORK_ORDER.'
                    })
                }
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});