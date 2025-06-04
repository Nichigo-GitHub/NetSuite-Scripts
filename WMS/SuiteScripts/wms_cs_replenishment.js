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

		function pageInit(scriptContext)
		{
			var currentRec = scriptContext.currentRecord;
			var lineCnt = currentRec.getLineCount({
				sublistId: 'custpage_items'
			});

			for(var pageInitItr = 0; pageInitItr <lineCnt; pageInitItr++)
			{
				var whAvailQty = currentRec.getSublistValue({sublistId: 'custpage_items',fieldId: 'custpage_whqtyavail',line: pageInitItr});
				if(whAvailQty <= 0)
				{
					currentRec.setSublistValue({
						sublistId: 'custpage_items',
						fieldId: 'custpage_select',
						line: pageInitItr,
						value: false
					});
				}
			}
			return true;
		}

		function fieldChanged(scriptContext) {
			if(scriptContext.fieldId == 'custpage_selectpage'){
				var myRecord = currentRecord.get();
				myRecord.setValue({
					fieldId: 'custpage_hiddenfieldselectpage',
					value:true
				});
				var hdnMarkFlag =myRecord.getValue({
					fieldId: 'custpage_hiddenselectallflag'	});
				NLDoMainFormButtonAction("submitter", true);
			}
			else {
				return true;
			}
		}
		function saveRecord(scriptContext){
			var tempFlag=false;
			var currentRec = scriptContext.currentRecord;
			var lineCnt = currentRec.getLineCount({
				sublistId: 'custpage_items'
			});
			var hdnFlag = currentRec.getValue({
				fieldId:'custpage_hiddenfieldselectpage'
			});
			var oldResponse = currentRec.getValue({
				fieldId:'custpage_oldresponse'
			});

			for(var iterator = 0; iterator < lineCnt; iterator++)
			{
				var isSelected = currentRec.getSublistValue({
					sublistId: 'custpage_items',
					fieldId: 'custpage_select',
					line: iterator
				});

				if(isSelected == true)
				{
					tempFlag = true;
					break;
				}
			}
			if(tempFlag == false  && parseInt(lineCnt) > 0 && hdnFlag != true && (oldResponse == null || oldResponse == '' || oldResponse == undefined))
			{
				alert(translator.getTranslationStringForClientScript('wms_GenReplenishment_SELECT_ATLEAST_ONE_LINE_ITEM'));
				return false;
			}
			return true;

		}

		function markAll()
		{
			var currentRec = currentRecord.get();
			var flagArr = [];
			currentRec.setValue({
				fieldId: 'custpage_hiddenselectallflag',
				value:"mark"
			});

			var localVal = '';
			currentRec.setValue({
				fieldId: 'custpage_unselectedlines',
				value:localVal
			});
			var lineCnt = currentRec.getLineCount({
				sublistId: 'custpage_items'
			});
          custpage_itemsMarkAll(true);return false; return false;
			
		}

		function unMarkAll()
		{
			var currentRec = currentRecord.get();

			currentRec.setValue({
				fieldId: 'custpage_hiddenselectallflag',
				value:"unmark",
				ignoreFieldChange: true
			});

			var localValue = '';
			currentRec.setValue({fieldId: 'custpage_oldresponse',value:localValue});
			currentRec.setValue({fieldId: 'custpage_oldresponsecontinue',value:localValue});
			currentRec.setValue({fieldId: 'custpage_selectedlines',value:localValue});
			currentRec.setValue({fieldId: 'custpage_unselectedlines',value:localValue});
			currentRec.setValue({fieldId: 'custpage_oldresponsecontitem1',value:localValue});
			currentRec.setValue({fieldId: 'custpage_oldresponsecontitem2',value:localValue});
			currentRec.setValue({fieldId: 'custpage_oldresponsecontitem3',value:localValue});
			currentRec.setValue({fieldId: 'custpage_oldresponsecontitem4',value:localValue});
			currentRec.setValue({fieldId: 'custpage_oldresponsecontitem5',value:localValue});

			custpage_itemsMarkAll(false);return false; return false;
		}



		return {
			pageInit:pageInit,
			fieldChanged : fieldChanged,
			saveRecord:saveRecord,
			markAll:markAll,
			unMarkAll:unMarkAll
		};

	});
