/**
 *    Copyright � 2023, Oracle and/or its affiliates. All rights reserved.
 */
/**
/***************************************************************************
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define([ 'N/url' , '../Restlets/wms_translator','N/currentRecord'],

		function( url,translator,currentRecord) {

			function fieldChanged(scriptContext) {

				if (scriptContext.fieldId == 'custpage_qbwhlocation' ||
					scriptContext.fieldId == 'custpage_item' ) {

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
					scriptId : 'customscript_wms_sl_bulk_pickerassignmnt',
					deploymentId : 'customdeploy_wms_sl_bulk_pickerassignmnt'
				});
				window.location.href = URLtoredirect;
			}
			function  saveRecord(scriptContext){
				var currentRec = scriptContext.currentRecord;
				var lineCnt = currentRec.getLineCount({
					sublistId: 'custpage_picktasklist'
				});
              var hiddenFieldValue = currentRec.getValue({
				  fieldId:'custpage_hiddenfield'
			  });
				var taskassignedTo = currentRec.getText({
					fieldId:'custpage_taskassignedto'
				});
				var pickTaskFromDate = currentRec.getValue({
					fieldId:'custpage_picktaskcreationdate'
				});
				var pickTaskToDate = currentRec.getValue({
					fieldId:'custpage_picktaskcreationtodate'
				});
				if (pickTaskFromDate != '' && pickTaskFromDate != null &&
					pickTaskFromDate != 'null' && pickTaskFromDate != undefined) {

					if (pickTaskToDate == '' || pickTaskToDate == null ||
						pickTaskToDate == 'null' || pickTaskToDate == undefined) {
						alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_PICKTSK_TODATE'));
                       return false;
					}
					else{
						var pickTaskFromDateInTime = new Date(pickTaskFromDate).getTime();
						var pickTaskToDateInTime = new Date(pickTaskToDate).getTime();
						if(pickTaskFromDateInTime > pickTaskToDateInTime){
							alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_PICKTSK_TODATE'));
							return false;
						}
					}
				}
				if (pickTaskToDate != '' && pickTaskToDate != null &&
					pickTaskToDate != 'null' && pickTaskToDate != undefined) {

					if (pickTaskFromDate == '' || pickTaskFromDate == null ||
						pickTaskFromDate == 'null' || pickTaskFromDate == undefined) {
						alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_PICKTSK_FROMDATE'));
						return false;
					}
				}
				var pickTaskReleaseFromDate = currentRec.getValue({
					fieldId:'custpage_picktaskreleaseddate'
				});
				var pickTaskReleaseToDate = currentRec.getValue({
					fieldId:'custpage_picktaskreleasedtodate'
				});
				if (pickTaskReleaseFromDate != '' && pickTaskReleaseFromDate != null &&
					pickTaskReleaseFromDate != 'null' && pickTaskReleaseFromDate != undefined) {

					if (pickTaskReleaseToDate == '' || pickTaskReleaseToDate == null ||
						pickTaskReleaseToDate == 'null' || pickTaskReleaseToDate == undefined) {
						alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_Release_TODATE'));
						return false;
					}
					else{
						var pickTaskReleaseFromDateInTime = new Date(pickTaskReleaseFromDate).getTime();
						var pickTaskReleaseToDateInTime = new Date(pickTaskReleaseToDate).getTime();
						if(pickTaskReleaseFromDateInTime > pickTaskReleaseToDateInTime){
							alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_Release_TODATE'));
							return false;
						}
					}
				}
				if (pickTaskReleaseToDate != '' && pickTaskReleaseToDate != null &&
					pickTaskReleaseToDate != 'null' && pickTaskReleaseToDate != undefined) {

					if (pickTaskReleaseFromDate == '' || pickTaskReleaseFromDate == null ||
						pickTaskReleaseFromDate == 'null' || pickTaskReleaseFromDate == undefined) {
						alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_Release_FROMDATE'));
						return false;
					}
				}

			  if(hiddenFieldValue != 'paginationChange' && hiddenFieldValue != 'onChange') {
				  var count = 0;
				  for (var i = 0; i < lineCnt; i++) {
					  var isSelected = currentRec.getSublistValue({
						  sublistId: 'custpage_picktasklist',
						  fieldId: 'custpage_select',
						  line: i
					  });
					  var isPrevRowSelected = currentRec.getSublistValue({
						  sublistId: 'custpage_picktasklist',
						  fieldId: 'custpage_selectedpicktasksacrosspages',
						  line: i
					  });
					  if (isSelected == true ||
						  (isPrevRowSelected != '' && isPrevRowSelected != null && isPrevRowSelected != 'null' && isPrevRowSelected !=undefined )) {
						  count++;
					  }
				  }
				  if (lineCnt > 0 && count == 0) {
					  alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_ATLEASTONE'));

					  return false;
				  }
				  if(lineCnt > 0) {
					  if (taskassignedTo == '' || taskassignedTo == null || taskassignedTo == 'null' || taskassignedTo == undefined) {
						  alert(translator.getTranslationStringForClientScript('GUIBULKPICKTASKASSIGNMENT_SELECTPICKER'));
						  return false;
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
