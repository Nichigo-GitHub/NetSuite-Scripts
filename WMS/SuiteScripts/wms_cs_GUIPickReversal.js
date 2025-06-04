/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/url','../Restlets/wms_translator'],

		function(url, translator) {

	function backtogeneratesearch() {

		var URLtoredirect = url.resolveScript({
			scriptId : 'customscript_wms_guipickreversal',
			deploymentId : 'customdeploy_wms_guipickreversal'
		});
		window.location.href = URLtoredirect;
	}

	function saveRecord(scriptContext) {
		
		var currentRec = scriptContext.currentRecord;
		
		var waveName = currentRec.getValue({
			fieldId : 'custpage_wave'
		});
			
		var OrderNo = currentRec.getValue({
			fieldId : 'custpage_transaction'
		});
		
		
		if((waveName == null || waveName == '' || waveName == 'null' || waveName == undefined || waveName == 'undefined')
		&& (OrderNo == null || OrderNo == '' || OrderNo == 'null' || OrderNo == undefined || OrderNo == 'undefined')		
		){
			
			alert(translator.getTranslationString("GUIPARTIAL_PICKING_ENTER_WAVE_OR_TRANSACTION"));
			return false;
		}
				
		var lineCnt = currentRec.getLineCount({
			sublistId: 'custpage_itemlist'
		});
		var count = 0;
		var NonSelectedKitCompntArr = [];
		var selectedKitComponentArr = [];
		var kitComponentObj = {};
		
		for(var i = 0; i < lineCnt; i++)
		{
			var isSelected=currentRec.getSublistValue({
				sublistId: 'custpage_itemlist',
				fieldId: 'custpage_select',
				line: i
			});

			var lineitemsubitemofText=currentRec.getSublistValue({
				sublistId: 'custpage_itemlist',
				fieldId: 'custpage_subitemof',
				line: i
			});
			kitComponentObj = {};
			
			
			var transactionNum=currentRec.getSublistValue({
				sublistId: 'custpage_itemlist',
				fieldId: 'custpage_orderinternalid',
				line: i
			});
			
			var kitItemOrdLine=currentRec.getSublistValue({
				sublistId: 'custpage_itemlist',
				fieldId: 'custpage_kititem_orderlinenum',
				line: i
			});
			
			var validationMessage = '';
			
			if(isSelected)
			{
				count++;
			}
			
			if(lineitemsubitemofText!=null && lineitemsubitemofText!='' && kitItemOrdLine!='' 
				&& kitItemOrdLine!=null)
			{
				kitComponentObj = {};
				kitComponentObj['transactionNum'] = transactionNum;
				kitComponentObj['KitItem'] = lineitemsubitemofText;
				kitComponentObj['KitItemLineNum'] = kitItemOrdLine;
				
				if(isSelected)
				{
					validationMessage = validateLines(NonSelectedKitCompntArr , selectedKitComponentArr, kitComponentObj);
				}
				else
				{
					validationMessage = validateLines(selectedKitComponentArr , NonSelectedKitCompntArr, kitComponentObj);
				}
				if(validationMessage!=true)
				{
					alert(validationMessage);
					return false;
				}
			}
		}
		
		if(lineCnt != -1 && count == 0){
			alert(translator.getTranslationString('GUIPARTIAL_PICKING_SELECT_LINE_ITEM'));
			return false;
		}

		return true;
	}
	
	function validateLines(componentArr1, componentArr2, kitComponentObj)
	{
		if(componentArr1.length > 0)
		{
			for(var itr=0; itr<componentArr1.length; itr++)
			{
				if(componentArr1[itr]['transactionNum'] == kitComponentObj['transactionNum'] && 
						componentArr1[itr]['KitItem'] == kitComponentObj['KitItem'] &&
						componentArr1[itr]['KitItemLineNum'] == kitComponentObj['KitItemLineNum'])
				{
					var alertMessage = translator.getTranslationString('GUIPICKREVERSAL_SELECT_ALL_KIT_COMPONENTS')
					return alertMessage;
				}
				else
				{						
					componentArr2.push(kitComponentObj);
				}

			}

		}
		else
		{
			componentArr2.push(kitComponentObj);					
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
		backtogeneratesearch : backtogeneratesearch,
		saveRecord:saveRecord,
		pageInit : pageInit
	};

});
