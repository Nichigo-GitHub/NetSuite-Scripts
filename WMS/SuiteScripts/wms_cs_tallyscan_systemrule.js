/**

 *    Copyright Â© 2020, Oracle and/or its affiliates. All rights reserved.

 */
/**

 * @NApiVersion 2.x

 * @NScriptType ClientScript

 * @NModuleScope Public

 */
define(['../Restlets/wms_translator', 'N/record'], function(translator, record) {
    function pageInit(context) {}

    function fieldChanged(scriptContext) {
        var currentRecord = scriptContext.currentRecord;
        var fieldName = scriptContext.fieldId;
        if (fieldName === 'custpage_wms_pickingtype_dynamic') {
            var zonePickingType_dynamicValue = currentRecord.getValue({
                fieldId: 'custpage_wms_pickingtype_dynamic'
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wms_pickingtype',
                value: zonePickingType_dynamicValue
            });
        }
        if (fieldName === 'custpage_wms_enforce_stage_dynamic') {
            var enforceStageFlag_dynamicValue = currentRecord.getValue({
                fieldId: 'custpage_wms_enforce_stage_dynamic'
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wms_enforce_stage',
                value: enforceStageFlag_dynamicValue
            });
        }
        if (fieldName === 'custpage_wms_stagebyorder_flag_dynamic') {
            var stageByOrderFlag_dynamicValue = currentRecord.getValue({
                fieldId: 'custpage_wms_stagebyorder_flag_dynamic'
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wms_stagebyorder_flag',
                value: stageByOrderFlag_dynamicValue
            });
        }
        if (fieldName === 'custpage_wms_process') {
            var processName = currentRecord.getText({
                fieldId: 'custpage_wms_process'
            });
            var processId = currentRecord.getValue({
                fieldId: 'custpage_wms_process'
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wmsse_processname_tallyscan',
                value: processName
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wmsse_processid_tallyscan',
                value: processId
            });
        }
        if (fieldName === 'custpage_wms_process_ordertype') {
            var orderType = currentRecord.getValue({
                fieldId: 'custpage_wms_process_ordertype'
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wms_ordertype',
                value: orderType
            });
        }
        if (fieldName === 'custpage_wmsse_pickedquantitylimit') {
            var qtyLimit = currentRecord.getValue({
                fieldId: 'custpage_wmsse_pickedquantitylimit'
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wmsse_pickedquantitylimit',
                value: qtyLimit
            });
        }
    }

    function saveRecord(scriptContext) {
        var currentRecord = scriptContext.currentRecord;

        var currentRecordId = currentRecord.getValue({
            fieldId: 'id'
        });
        var name = currentRecord.getValue({
            fieldId: 'name'
        });
        var ruleValue = currentRecord.getValue({
            fieldId: 'custrecord_wmsserulevalue'
        });
        if (name === translator.getTranslationStringForClientScript('wms_SystemRules.ENABLE_TALLY_SCAN')) {
            var qtyLimitField = currentRecord.getValue({
                fieldId: 'custpage_wmsse_pickedquantitylimit'
            });
            if (qtyLimitField === null || qtyLimitField === '' || qtyLimitField === 'null' || qtyLimitField === undefined || qtyLimitField === 'undefined') {
                currentRecord.setValue({
                    fieldId: 'custrecord_wmsse_pickedquantitylimit',
                    value: 1
                });
                currentRecord.setValue({
                    fieldId: 'custpage_wmsse_pickedquantitylimit',
                    value: 1
                });
            }
            var processName = currentRecord.getText({
                fieldId: 'custpage_wms_process'
            });
            var processId = currentRecord.getValue({
                fieldId: 'custpage_wms_process'
            });
            //alert(processName);
            //alert(processId);
            currentRecord.setValue({
                fieldId: 'custrecord_wmsse_processname_tallyscan',
                value: processName
            });
            currentRecord.setValue({
                fieldId: 'custrecord_wmsse_processid_tallyscan',
                value: processId
            });
		}
		
		if (name === translator.getTranslationStringForClientScript('wms_SystemRules.BULKSERIALSCAN')){
		
			var palletDelimiter = currentRecord.getValue({
				fieldId: 'custpage_wms_delimiter'
			});
			

			if (palletDelimiter == null || palletDelimiter == '' || palletDelimiter == 'null' || palletDelimiter == undefined ||palletDelimiter == 'undefined'){
				alert(translator.getTranslationStringForClientScript('WMS_SystemRuleBulkSerial_Delimiter_Error'));
				return false;
			}else {
				currentRecord.setValue({
					fieldId: 'custrecord_wms_pallet_delimiter',
					value: palletDelimiter
				});
			}
        }

        if (name === translator.getTranslationStringForClientScript('wms_SystemRules.MANUALL_PACK_ORDER') || name === translator.getTranslationStringForClientScript('SINGLEORDERPICKING_CONTAINERLIST.SYSTEMRULE') || name === translator.getTranslationStringForClientScript('MULTIORDER_CONTAINERLIST.SYSTEMRULE')) {
            var orderTypeField = currentRecord.getValue({
                fieldId: 'custpage_wms_process_ordertype'
            });
            var x = currentRecord.setText({
                fieldId: 'custrecord_wms_ordertype',
                text: orderTypeField
            });

        }
        if (!(name == translator.getTranslationStringForClientScript('wms_SystemRules.ASYNC_BULKSTAGEING') || name == translator.getTranslationStringForClientScript('wms_SystemRules.ASYNC_BULKPICKING'))) {
            if (!(ruleValue == 'Y' || ruleValue == 'N')) {
                alert(translator.getTranslationStringForClientScript('SYSTEMRULE_RULEVALUEVALIDATE'));
                return false;
            } else {
                return true;
            }
        }
        if (name === translator.getTranslationStringForClientScript('wms_SystemRules.ASYNC_BULKSTAGEING')) {
            if (isNaN(ruleValue)) {
                alert(translator.getTranslationStringForClientScript('SYSTEMRULE_MRSCRIPT_RULEVALUERANGE'));
                return false;
            } else if (parseInt(ruleValue) <= 0 || parseInt(ruleValue) > 125) {
                alert(translator.getTranslationStringForClientScript('SYSTEMRULE_MRSCRIPT_RULEVALUERANGE'));
                return false;
            } else {
                return true;
            }
        } else if (name === translator.getTranslationStringForClientScript('wms_SystemRules.ASYNC_BULKPICKING')) {
            if (isNaN(ruleValue) || parseInt(ruleValue) <= 0 || parseInt(ruleValue) > 125) {
                alert(translator.getTranslationStringForClientScript('SYSTEMRULE_MRSCRIPT_BULKPICKING_RULEVALUERANGE'));
                return false;
            }
			else {
                return true;
            }
        }



    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});
