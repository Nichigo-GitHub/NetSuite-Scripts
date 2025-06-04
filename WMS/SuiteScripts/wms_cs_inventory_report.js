/**

 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.

 */

/**

 * @NApiVersion 2.x

 * @NScriptType ClientScript

 * @NModuleScope Public

 */

define(['N/currentRecord', 'N/search', 'N/url', '../Restlets/wms_translator'],

    function (currentRecord, search, url, translator) {

        var contextMode;
        var rec = currentRecord.get();


        function pageInit(scriptContext) {

            contextMode = scriptContext.mode;
            var currentRecord = scriptContext.currentRecord;

            var locationId = currentRecord.getValue({
                fieldId: 'custpage_qblocation'
            });

            disableBinField(locationId, currentRecord);
            return true;

        }

        function fnInvReportExport() {
            var whLocation = rec.getValue({fieldId: 'custpage_qblocation'});
            var itemId = rec.getValue({fieldId: 'custpage_qbitem'});
            var binId = rec.getValue({fieldId: 'custpage_qbbin'});
            var lineCnt = rec.getLineCount({sublistId: 'custpage_invreportlist'});
            var invstatus = rec.getValue({fieldId: 'custpage_qbinvstatus'});

            if (lineCnt == -1 || lineCnt == 0) {
                alert(translator.getTranslationStringForClientScript('INVENTORYREPORT.FORM_NORECORDS'));
                return false;
            }

            var InvPDFURL = url.resolveScript({
                scriptId: 'customscript_wms_inventoryreport_excel',
                deploymentId: 'customdeploy_wms_inventoryreport_excel',
                params: ({
                    'custpage_item': itemId,
                    'custpage_location': whLocation,
                    'custpage_binloc': binId,
                    'custpage_invstatus': invstatus,
                })
            });
            window.open(InvPDFURL);
        }

        function fieldChanged(scriptContext) {

            var currentRecord = scriptContext.currentRecord;
            var fieldName = scriptContext.fieldId;

            if (trim(fieldName) === trim('custpage_qblocation')) {

                var locationId = currentRecord.getValue({
                    fieldId: 'custpage_qblocation'
                });
                disableBinField(locationId, currentRecord);
            }
            return true;
        }

        function disableBinField(location, currentRecord) {

            var locUseBinsFlag = true;
            if (location != null && location != '') {
                var locationDtl = getLocationFieldsByLookup(location);
                locUseBinsFlag = locationDtl.usesbins;
            }

            if (locUseBinsFlag == false) {
                currentRecord.setValue({fieldId: 'custpage_qbbin', value: ''});
                var qbBinField = currentRecord.getField({
                    fieldId: 'custpage_qbbin'
                });
                qbBinField.isDisabled = true;
            } else {
                var qbBinField = currentRecord.getField({
                    fieldId: 'custpage_qbbin'
                });
                qbBinField.isDisabled = false;
            }
        }

        function getLocationFieldsByLookup(wareHouseLocationId) {

            try {
                var locationDetails = search.lookupFields({
                    type: search.Type.LOCATION,
                    id: wareHouseLocationId,
                    columns: 'usesbins'
                });

            } catch (e) {

                log.error({
                    title: 'exception in _getLocationFieldsByLookup',
                    details: e
                });
            }
            return locationDetails;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            fnInvReportExport: fnInvReportExport

        };


    });

