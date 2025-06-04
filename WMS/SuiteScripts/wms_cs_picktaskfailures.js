/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/url','N/currentRecord','../Restlets/wms_translator'],

    function( url,currentRecord,translator) {

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            if (scriptContext.fieldId == 'custpage_location') {

                var myRecord = currentRecord.get();
                myRecord.setValue({
                    fieldId: 'custpage_hiddenfield',
                    value:'onChange',
                    ignoreFieldChange: true
                });
                NLDoMainFormButtonAction("submitter", true);
            }
            else if(scriptContext.fieldId == 'custpage_pagination'){
                var myRecord = currentRecord.get();
                myRecord.setValue({
                    fieldId: 'custpage_hiddenfield',
                    value:'paginationChange',
                    ignoreFieldChange: true
                });
                NLDoMainFormButtonAction("submitter", true);
            }
            else {
                var myRecord = currentRecord.get();
                myRecord.setValue({
                    fieldId: 'custpage_hiddenfield',
                    value:'',
                    ignoreFieldChange: true
                });
                return true;
            }
        }

        function  resetForm(){

            var URLtoredirect = url.resolveScript({
                scriptId : 'customscript_wms_sl_picktaskfailures',
                deploymentId : 'customdeploy_wms_sl_picktaskfailures'
            });
            window.location.href = URLtoredirect;
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function  saveRecord(scriptContext){
            var currentRec = scriptContext.currentRecord;
            var lineCnt = currentRec.getLineCount({
                sublistId: 'custpage_picktaskfailurelist'
            });
            var hiddenFieldValue = currentRec.getValue({
                fieldId:'custpage_hiddenfield'
            });

            if(hiddenFieldValue != 'paginationChange' && hiddenFieldValue != 'onChange') {
                var count = 0;
                for (var i = 0; i < lineCnt; i++) {
                    var isSelected = currentRec.getSublistValue({
                        sublistId: 'custpage_picktaskfailurelist',
                        fieldId: 'custpage_select',
                        line: i
                    });
                    var isPrevRowSelected = currentRec.getSublistValue({
                        sublistId: 'custpage_picktaskfailurelist',
                        fieldId: 'custpage_selectedpicktasksacrosspages',
                        line: i
                    });
                    if (isSelected == true ||
                        (isPrevRowSelected != '' && isPrevRowSelected != null && isPrevRowSelected != 'null' && isPrevRowSelected !=undefined )) {
                        count++;
                    }
                }
            }
            return true;
        }



        return {
            fieldChanged : fieldChanged,
            saveRecord:saveRecord,
            resetForm:resetForm
        };

    });
