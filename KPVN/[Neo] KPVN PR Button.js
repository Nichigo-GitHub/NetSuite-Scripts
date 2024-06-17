/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/url', 'N/log'], function (url, log) {
  // This function is triggered before loading a record
  function beforeLoad(context) {
    // Check if the event type is "view"
    if (context.type === context.UserEventType.VIEW) {
      // Check if the "custrecord_swpr_subsidiary" field has a value of 15
      var subsidiaryValue = context.newRecord.getValue({
        fieldId: 'custrecord_swpr_subsidiary'
      });

      if (subsidiaryValue == 15) {
        // Retrieve the new record, its ID, type, and the form object
        var newRecord = context.newRecord,
          newId = newRecord.id,
          newType = newRecord.type,
          form = context.form;

        // Construct a URL to a Suitelet and open it in a new window when the "Print PR Form" button is clicked
        var printPR = "printPR = window.open('" + url.resolveScript({
          scriptId: 'customscript_kpvn_pr_print_out',
          deploymentId: 'customdeploy_kpvn_pr_print_out'
        }) + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printPR', 'height=1056, width=755, resizable=yes, scrollbars=yes, toolbar=no'); printPR.focus();";

        // Add a custom button to the form that triggers the "Print PR Form" functionality
        form.addButton({
          id: 'custpage_printPrForm',
          label: 'Print KPVN PR Form',
          functionName: printPR
        });
      }
    }
  }

  return {
    beforeLoad: beforeLoad
  };
});