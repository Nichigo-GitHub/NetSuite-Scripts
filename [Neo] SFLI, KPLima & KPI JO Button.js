function userEventBeforeLoad(type, form) {
    var newId = nlapiGetRecordId();

    if (type == 'view') {
        sub = nlapiGetFieldValue('subsidiary');
        custfrm = nlapiGetFieldValue('customform');

        nlapiLogExecution('ERROR', 'View Type and Subsidiary', 'Type: ' + type + ', Subsidiary: ' + sub + ', Custom Form: ' + custfrm);

        var SFLIJO = "printJO = window.open('" + nlapiResolveURL('SUITELET', 'customscript_sfli_woprint', 'customdeploy1') + "&internalid=" + newId + "&l=t', 'printJO'); printJO.focus();"; //, 'height=1056, width=1100, resizable=yes, scrollbars=yes, toolbar=no'
        var KPIJO = "KPIJO = window.open('" + nlapiResolveURL('SUITELET', 'customscript_sfli_woprint', 'customdeploy1') + "&internalid=" + newId + "&l=t', 'printJO'); KPIJO.focus();";
        var KPLIMAJO = "KPLIMAJO = window.open('" + nlapiResolveURL('SUITELET', 'customscript_sfli_woprint', 'customdeploy1') + "&internalid=" + newId + "&l=t', 'printJO'); KPLIMAJO.focus();";

        if (sub == '14') { // Superflex Logistic Inc.
            nlapiLogExecution('ERROR', 'Subsidiary', 'SFLI');
            form.addButton("custpage_ppo1", "Print Job Order", SFLIJO);

        } else if (sub == '4') { // PT. Kanepackage Indonesia
            nlapiLogExecution('ERROR', 'Subsidiary', 'KPI');
            form.addButton("custpage_ppo2", "Print Work Order", KPIJO);

        } else if (sub == '5' || sub == '18' || custfrm == '656') { // Kanepackage Philippine Inc
            nlapiLogExecution('ERROR', 'Subsidiary', 'KPPI');
            form.addButton("custpage_ppo2", "KPLIMA JO Printout", KPLIMAJO);

        } else if (sub == '15') { // Kanepackage Vietnam Co.,Ltd
            nlapiLogExecution('ERROR', 'Subsidiary', 'KPVN');
            if (custfrm == '719') {
                nlapiLogExecution('ERROR', 'Form', 'Hanoi');
                form.addButton("custpage_ppo2", "Print Job Order", KPIJO);
            } else if (custfrm == '692') {
                nlapiLogExecution('ERROR', 'Form', 'Amata');
            } else {
                form.addButton("custpage_ppo2", "Print Job Order", KPIJO);
            }

        }
    }
}