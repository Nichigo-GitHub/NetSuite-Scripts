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
  
        // Construct a URL to a Suitelet and open it in a new window when the "Print Collection Receipt" button is clicked
        var printCR = "printCR = window.open('" + url.resolveScript({
          scriptId: 'customscript_kppi_collect_receipt_print',
          deploymentId: 'customdeploy_kppi_collect_receipt_print'
        }) + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printCR', 'height=1056, width=1300, resizable=yes, scrollbars=yes, toolbar=no'); printCR.focus();";
  
        // Add a custom button to the form that triggers the "Print Collection Receipt" functionality
        form.addButton({
          id: 'custpage_printNIE',
          label: 'Print Collection Receipt',
          functionName: printCR
        });
      }
    }
  
    return {
      beforeLoad: beforeLoad
    };
  });