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
        var url = '/app/site/hosting/scriptlet.nl?script=customscript_sfli_lot_label_pdf&deploy=1&recordId=' + id;
        window.open(url, '_blank');
    }

    function openLabelOqaPDF() {
        var rec = currentRecord.get();
        var id = rec.id;
        var url = '/app/site/hosting/scriptlet.nl?script=customscript_sfli_lot_label_pdf&deploy=1&recordId=' + id + '&oqa=T';
        window.open(url, '_blank');
    }

    function openLabelKPbigPDF() {
        var rec = currentRecord.get();
        var id = rec.id;
        var url = '/app/site/hosting/scriptlet.nl?script=customscript_sfli_lot_label_pdf&deploy=1&recordId=' + id + '&kpcebu=big';
        window.open(url, '_blank');
    }

    function openLabelKPsmallPDF() {
        var rec = currentRecord.get();
        var id = rec.id;
        var url = '/app/site/hosting/scriptlet.nl?script=customscript_sfli_lot_label_pdf&deploy=1&recordId=' + id + '&kpcebu=small';
        window.open(url, '_blank');
    }

    function openLabelKKoyamaPDF() {
        var rec = currentRecord.get();
        var id = rec.id;
        var url = '/app/site/hosting/scriptlet.nl?script=customscript_sfli_lot_label_pdf&deploy=1&recordId=' + id + '&koyama=full';
        window.open(url, '_blank');
    }

    return {
        pageInit: pageInit,
        openLabelPDF: openLabelPDF,
        openLabelOqaPDF: openLabelOqaPDF,
        openLabelKPbigPDF: openLabelKPbigPDF,
        openLabelKPsmallPDF: openLabelKPsmallPDF,
        openLabelKKoyamaPDF: openLabelKKoyamaPDF
    };
});