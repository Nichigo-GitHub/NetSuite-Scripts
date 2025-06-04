/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record'], function ( record) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var rec = context.newRecord;
            var isLocked = rec.getValue({
                fieldId: 'custrecord_in_edit'
            });

            if (!isLocked) {
                var label = '🔒 Lock and Edit';

                form.addButton({
                    id: 'custpage_lock_record',
                    label: label,
                    functionName: 'lockAndEditRecord'
                });

                form.clientScriptModulePath = './[Neo] SFLI PO DRS Locking Script.js';
                //form.clientScriptFileId = 353413;
            }
        }
    }

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var recId = context.newRecord.id;
            var recType = context.newRecord.type;

            record.submitFields({
                type: recType,
                id: recId,
                values: {
                    custrecord_in_edit: false // Unlock the record
                }
            });
        }
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
});