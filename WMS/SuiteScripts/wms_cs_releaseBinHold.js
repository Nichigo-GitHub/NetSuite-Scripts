/**
 *    Copyright � 2022, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['../Restlets/wms_translator.js'],

    function (translator) {
        function saveRecord(scriptContext) {
            var currentRec = scriptContext.currentRecord;
            if(currentRec != undefined) {
                var lineCnt = currentRec.getLineCount({
                    sublistId: 'custpage_itembinlist'
                });
                var qbLocation = currentRec.getText({
                    fieldId : 'custpage_qbwhlocation'
                });

                var selectedLinesCount = 0;
                var isScannedLocAndSublistLocSame = false;
                for(var i=0;i< lineCnt;i++) {
                    var isSelected = currentRec.getSublistValue({
                        sublistId: 'custpage_itembinlist',
                        fieldId: 'custpage_select',
                        line: i
                    });
                    var whId = currentRec.getSublistValue({
                        sublistId: 'custpage_itembinlist',
                        fieldId: 'custpage_locationname',
                        line: i
                    });

                    if (qbLocation == whId) {
                        isScannedLocAndSublistLocSame = true;
                    }
                    if (isSelected && qbLocation == whId) {

                        selectedLinesCount = selectedLinesCount + 1;
                        var smartcountId = currentRec.getSublistValue({
                            sublistId: 'custpage_itembinlist',
                            fieldId: 'custpage_smartcountid',
                            line: i
                        });
                        var smartcountStatus = currentRec.getSublistValue({
                            sublistId: 'custpage_itembinlist',
                            fieldId: 'custpage_smartcountstatus',
                            line: i
                        });
                        if (smartcountId != "" && smartcountId != null
                            && smartcountId != "null" && smartcountId != undefined &&
                            smartcountStatus != "Rejected" && smartcountStatus != "Cancelled") {
                            alert(translator.getTranslationStringForClientScript('GUIRELEASEHOLDBIN.SMARTCOUNT.INPROGRESS'));
                            return false;
                        } else {
                            return true;
                        }

                    }
                }
                if(lineCnt == 0 ){
                    return  true;
                }
                else if(lineCnt > 0 && selectedLinesCount == 0 && isScannedLocAndSublistLocSame == true){
                    alert(translator.getTranslationStringForClientScript('GUIRELEASEHOLDBIN.INVALIDSELECTION'));
                    return false;
                }
                else{
                    return true;
                }
            }
            else{
                return true;
            }
        }
        function fieldChanged(scriptContext){
            if (scriptContext.fieldId == 'custpage_qbwhlocation') {
                NLDoMainFormButtonAction("submitter", true);
                return true;
            }
            var chkBox = scriptContext.currentRecord.getSublistValue({sublistId: 'custpage_itembinlist',
                fieldId: 'custpage_select',line:scriptContext.line});
            if(chkBox == true){
                var scId = scriptContext.currentRecord.getSublistValue({
                    sublistId: 'custpage_itembinlist',
                    fieldId: 'custpage_smartcountid',line:scriptContext.line
                });
                var smartcountStatus = scriptContext.currentRecord.getSublistValue({
                    sublistId: 'custpage_itembinlist',
                    fieldId: 'custpage_smartcountstatus',line:scriptContext.line
                });
                if (scId !="" && scId != null && scId != "null" &&
                    scId != undefined && smartcountStatus != "Rejected" && smartcountStatus != "Cancelled") {
                    alert(translator.getTranslationStringForClientScript('GUIRELEASEHOLDBIN.SMARTCOUNT.INPROGRESS'));
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: 'custpage_itembinlist',
                        fieldId: 'custpage_select',
                        value:false,
                        line:scriptContext.line

                    });
                    return false;
                }
            }
        }

        return {
            saveRecord:saveRecord,
            fieldChanged: fieldChanged

        };

    });
