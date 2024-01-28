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
  
        // Construct a URL to a Suitelet and open it in a new window when the "Print RM Tag" button is clicked
        var printRM = "printRM = window.open('" + url.resolveScript({
          scriptId: 'customscript_ina_rm_tag_sl',
          deploymentId: 'customdeploy_ina_rm_tag_sl'
        }) + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printRM', 'height=1056, width=755, resizable=yes, scrollbars=yes, toolbar=no'); printRM.focus();";
  
        // Add a custom button to the form that triggers the "Print RM Tag" functionality
        form.addButton({
          id: 'custpage_printRmTag',
          label: 'Print RM Tag',
          functionName: printRM
        });
      }
    }
  
    return {
      beforeLoad: beforeLoad
    };
  });