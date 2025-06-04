/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url','../Restlets/wms_translator.js'],

		function(url, translator) {

	function backToGenerateSearch() {
		var URLtoredirect = url.resolveScript({
			scriptId : 'customscript_wms_gui_mrkcmp_partial_pick',
			deploymentId : 'customdeploy_wms_gui_mrkcmp_partial_pick'
		});
		window.location.href = URLtoredirect;
	}

	function saveRecord(scriptContext) {
		var currentRec = scriptContext.currentRecord;

		var lineCnt = currentRec.getLineCount({
			sublistId: 'custpage_pickinglist'
		});
		var count = 0;
		for(var i = 0; i < lineCnt; i++){
			var isSelected=currentRec.getSublistValue({
				sublistId: 'custpage_pickinglist',
				fieldId: 'custpage_select',
				line: i
			});
			if(isSelected)
				count++;
		}
		if(lineCnt != -1 && count == 0){
			alert(translator.getTranslationString('GUIPARTIAL_PICKING_SELECT_LINE_ITEM'));
			return false;
		}

		var shipDate = currentRec.getValue({
			fieldId : 'custpage_shipdate'
		});

		var date = new Date(shipDate);
		var currentDate = new Date();
		currentDate.setHours(0,0,0,0)
		if(date < currentDate){
			alert(translator.getTranslationString('GUIPARTIAL_PICKING_PAST_DATE_NOT_ALLOWED'));
			return false;
		}

		return true;
	}
	
	function pageInit(scriptContext){
		//added because of not getting values from translator for the first time in save record in SCRUM BOX
		translator.getTranslationString('GUIPARTIAL_PICKING_PAST_DATE_NOT_ALLOWED');
		translator.getTranslationString('GUIPARTIAL_PICKING_SELECT_LINE_ITEM');
		return true;
	}

	return {
		backToGenerateSearch : backToGenerateSearch,
		saveRecord:saveRecord,
		pageInit : pageInit
	};

});
