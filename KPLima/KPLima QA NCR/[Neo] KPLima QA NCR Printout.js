/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {

    function pageInit(context) {
        // Required entry point for Client Script
    }

    function openLabelPDF() {
        var rec = currentRecord.get();
        var id = rec.id;
        if (!id) {
            alert('Record ID is not available. Please save the record first.');
            return;
        }
        var url = '/app/site/hosting/scriptlet.nl?script=customscript_kplima_qa_ncr_pdf&deploy=1&recordId=' + id;
        window.open(url, '_blank');
    }

    return {
        pageInit: pageInit,
        openLabelPDF: openLabelPDF
    };
});