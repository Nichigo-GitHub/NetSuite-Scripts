/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define([], function() {
    function pageInit(context) {
        var currentRecord = context.currentRecord
        currentRecord.setValue({
            fieldId:'custbody451',
            value:'Day'
        })
        currentRecord.setValue({
            fieldId:'memo',
            value:'handle with care'
        })
        currentRecord.setValue({
            fieldId:'forinvoicegrouping',
            value:true
        })
    }

    return {
        pageInit: pageInit
    }
})