function beforeLoad(type, form) {
    try {
        var newRecord = nlapiGetNewRecord();
        var newId = nlapiGetRecordId();
        var newType = nlapiGetRecordType();
        nlapiLogExecution('DEBUG', 'newtype', newType);
        var ctxtObj = nlapiGetContext();
        var executionContext = ctxtObj.getExecutionContext();
        var userRole = ctxtObj.getRole();
        var userId = ctxtObj.getUser();

        /*SALES */ if (type == "view" && (userRole == "3" || userRole == "1063" || userRole == "1076" || userRole == "1237" || userRole == "1252" || userRole == "1402")) {
            var printTI = "printTI = window.open('" + nlapiResolveURL('SUITELET', 'customscript_vs_transfer_order_s', 'customdeploy1') + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printTI', 'height=1056, width=1100, resizable=yes, scrollbars=yes, toolbar=no'); printTI.focus();";
            form.addButton("custpage_printOR", "Sales Transfer Order", printTI);
        } /*MPD */ else if (type == "view" && (userRole == "1018" || userRole == "1238" || userRole == "1242" || userRole == "1034" || userRole == "1036" || userRole == "1035" || userRole == "1056")) {
            var printTI = "printTI = window.open('" + nlapiResolveURL('SUITELET', 'customscript2969', 'customdeploy1') + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printTI', 'height=1056, width=1100, resizable=yes, scrollbars=yes, toolbar=no'); printTI.focus();";
            form.addButton("custpage_printOR", "MPD Transfer Order", printTI);
        }
    } catch (e) {
        if (e instanceof nlobjError) {
            nlapiLogExecution('DEBUG', 'beforeLoad', e.getCode() + '\n' + e.getDetails());
        } else {
            nlapiLogExecution('DEBUG', 'beforeLoad - unexpected', e.toString());
        }
    }
}
