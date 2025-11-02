/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (ui) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            context.form.addButton({
                id: 'custpage_print_labels',
                label: '🖨️ Print Lot Labels',
                functionName: 'openLabelPDF'
            });

            context.form.addButton({
                id: 'custpage_print_labels',
                label: '🖨️ Print Lot Labels (OQA)',
                functionName: 'openLabelOqaPDF'
            });

            context.form.addButton({
                id: 'custpage_kpbig_labels',
                label: '🖨️ KPCebu Big Lot Labels',
                functionName: 'openLabelKPbigPDF'
            });

            context.form.addButton({
                id: 'custpage_kpsmall_labels',
                label: '🖨️ KPCebu Small Lot Labels',
                functionName: 'openLabelKPsmallPDF'
            });

            context.form.addButton({
                id: 'custpage_koyama_label',
                label: '🖨️ Koyama Full Page Label',
                functionName: 'openLabelKKoyamaPDF'
            });

            context.form.clientScriptModulePath = 'SuiteScripts/[Neo] SFLI Lot Label Printout.js';
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});