/**
 *    Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 **/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/url','../Restlets/wms_translator'],

		function(url, translator) {

	function backtogeneratesearch() {

				var URLtoredirect = url.resolveScript({
					scriptId : 'customscript_wms_gui_postitemreceipt',
					deploymentId : 'customdeploy_wms_gui_postitemreceipt'
				});
				window.location.href = URLtoredirect;
	}
	function saveRecord(scriptContext) {

				var currentRec = scriptContext.currentRecord;

				var transactionType = currentRec.getValue({
					fieldId : 'custpage_qbtrantype'
				});

				var transactionNumber = currentRec.getValue({
					fieldId : 'custpage_qbtransaction'
				});

				if(transactionType == null || transactionType == '' || transactionType == 'null' || transactionType == undefined || transactionType == 'undefined')
				{
					var transactionTypeFieldName = translator.getTranslationStringForClientScript("GUIPICKREVERSAL_TRANSACTIONTYPE_FIELD")
					alert(translator.getTranslationStringForClientScript("GUIPOSTITEMRECEIPT_ENTER_TRANSACTIONTYPE")+transactionTypeFieldName);
					return false;
				}
				else if (transactionNumber == null || transactionNumber == '' || transactionNumber == 'null' || transactionNumber == undefined || transactionNumber == 'undefined')
				{
					alert(translator.getTranslationStringForClientScript("GUIPOSTITEMRECEIPT_ENTER_TRANSACTION"));
					return false;
				}
				return true;
			}

	return {
		backtogeneratesearch:backtogeneratesearch,
		saveRecord:saveRecord
	};

});
