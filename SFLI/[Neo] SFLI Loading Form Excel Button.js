/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url', 'N/record'], function (serverWidget, url, record) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var recordId = context.newRecord.id;

            // Generate Suitelet URL
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sfli_loading_excel_export',
                deploymentId: 'customdeploy_sfli_loading_excel_export',
                params: {
                    internalId: recordId
                }
            });

            // Add Export CSV Button
            form.addButton({
                id: 'custpage_export_csv',
                label: 'Excel Export',
                functionName: "window.open('" + suiteletURL + "', '_blank')"
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});