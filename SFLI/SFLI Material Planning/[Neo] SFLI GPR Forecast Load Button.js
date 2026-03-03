/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {

            var form = context.form;

            form.clientScriptModulePath = 'SuiteScripts/[Neo] SFLI GPR Forecast Autofill Sublist.js';

            form.addButton({
                id: 'custpage_loadGPRForecast',
                label: 'Load GPR Forecast',
                functionName: 'onClickLoadGPR'
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});