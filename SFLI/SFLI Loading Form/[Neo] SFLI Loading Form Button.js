/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/url'], function (url) {
    // This function is triggered before loading a record
    function beforeLoad(context) {
        // Check if the event type is "view"
        if (context.type === context.UserEventType.VIEW) {
            // Retrieve the new record, its ID, type, and the form object
            var newRecord = context.newRecord,
                newId = newRecord.id,
                newType = newRecord.type,
                form = context.form;

            // Construct a URL to a Suitelet and open it in a new window when the "Print Loading Form" button is clicked
            var printNIE = "printNIE = window.open('" + url.resolveScript({
                scriptId: 'customscript_sfli_loading_form_printout',
                deploymentId: 'customdeploy_sfli_loading_form_printout'
            }) + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printNIE', 'height=1056, width=1300, resizable=yes, scrollbars=yes, toolbar=no'); printNIE.focus();";

            // Add a custom button to the form that triggers the "Print Loading Form" functionality
            form.addButton({
                id: 'custpage_printNIE',
                label: 'Print Loading Form',
                functionName: printNIE
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});