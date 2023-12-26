/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/url'], function (log, record, runtime, url) {

    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.VIEW) {
                var newRecord = context.newRecord;
                var subId = newRecord.getValue({ fieldId: 'subsidiary' });
                var subUser = runtime.getCurrentUser().id;
                var subRole = runtime.getCurrentUser().role;

                if (subId == 15 || subUser == '20701' || subUser == '12353' || subUser == '6205' || subRole == '1182') {
                    var printKPIRT = "window.open('" + getSuiteletUrl() + "&formtype=" + newRecord.type + "&internalId=" + newRecord.id + "&l=t', 'printKPIRT', 'height=1056, width=1100, resizable=yes, scrollbars=yes, toolbar=no');";

                    context.form.addButton({
                        id: 'custpage_printOR',
                        label: 'Print KPVN RECEIVING TAG',
                        functionName: printKPIRT
                    });
                }
            }
        } catch (e) {
            log.error('Error', e.toString());
        }
    }

    function getSuiteletUrl() {
        return url.resolveScript({
            scriptId: 'customscript_swa_sl_receiving_tag_print',
            deploymentId: 'customdeploy_swa_sl_receiving_tag_print'
        });
    }

    return {
        beforeLoad: beforeLoad
    };

});
