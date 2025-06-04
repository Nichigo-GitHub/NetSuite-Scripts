/**
 *    Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
/***************************************************************************
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define([ 'N/url' , '../Restlets/wms_translator.js','N/currentRecord'],

		function( url,translator,currentRecord) {
	//var rec = currentRecord.get();
	function backToGenerateSearch() {

		var URLtoredirect = url.resolveScript({
			scriptId : 'customscript_wms_gui_quickship',
			deploymentId : 'customdeploy_wms_gui_quickship'
		});
		window.location.href = URLtoredirect;
	}
	function saveRecord(scriptContext) {
		var currentRec = scriptContext.currentRecord;

		var vCarton = currentRec.getValue({
			fieldId : 'custpage_carton'
		});
		var vSo = currentRec.getValue({
			fieldId : 'custpage_transaction'
		});

        var vpallet = currentRec.getValue({
            fieldId : 'custpage_pallet'
        });

		if((vSo==null || vSo=='') && (vCarton==null || vCarton=="") && (vpallet==null || vpallet==''))
		{
			alert(translator.getTranslationStringForClientScript('GUIQUICKSHIP_MANDATORY_ORDER_CARTON'));
			return false;
		}

		var lineCnt = currentRec.getLineCount({
			sublistId: 'custpage_quickshiplist'
		});
		var count = 0;
		for(var i = 0; i < lineCnt; i++){
			var isSelected=currentRec.getSublistValue({
				sublistId: 'custpage_quickshiplist',
				fieldId: 'custpage_select',
				line: i
			});
			if(isSelected)
				count++;
		}
		if(lineCnt != -1 && count == 0){
			alert(translator.getTranslationStringForClientScript('GUIQUICKSHIP.ATLEASTONE'));
			return false;
		}
		return true;
	}



	return {
		backToGenerateSearch : backToGenerateSearch,
		saveRecord : saveRecord

	};

});
