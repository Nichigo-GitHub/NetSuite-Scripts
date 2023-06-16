/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/url'], function (url) {
  function beforeLoad(context) {
    if (context.type === context.UserEventType.VIEW) {
      var newRecord = context.newRecord,
        newId = newRecord.id,
        newType = newRecord.type,
        form = context.form,
        printRM = "printRM = window.open('" + url.resolveScript({
          scriptId: 'customscript_rm_tag_sl',
          deploymentId: 'customdeploy1'
        }) + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printRM', 'height=1056, width=755, resizable=yes, scrollbars=yes, toolbar=no'); printRM.focus();";

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