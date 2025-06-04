/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (ui) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var rec = context.newRecord;
            var subsidiary = rec.getValue({ fieldId: 'subsidiary' });
            if (subsidiary == 18) {
                context.form.addButton({
                    id: 'custpage_print_labels',
                    label: '🖨️ Print KPLima NCR',
                    functionName: 'openLabelPDF'
                });

                context.form.clientScriptModulePath = 'SuiteScripts/[Neo] KPLima QA NCR Printout.js';
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});