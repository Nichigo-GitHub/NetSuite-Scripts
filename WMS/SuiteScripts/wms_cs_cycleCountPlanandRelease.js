/**
 *    Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['N/url', 'N/currentRecord', 'N/search', '../Restlets/wms_translator'],

		function (url, currentRecord, search, translator) {
	var rec = currentRecord.get();

	function backtogeneratesearch() {
		var planNumber = rec.getValue('custpage_qbplannum');
		var URLtoredirect = url.resolveScript({
			scriptId: 'customscript_wms_cc_planandrelease',
			deploymentId: 'customdeploy_wms_cc_planandrelease'
		});
		var cyclecountURL = URLtoredirect + '&custpage_qbplannum=' + planNumber;
		window.location.href = cyclecountURL;
	}

	//This is to start the inventory count
	function startCount(recid) {

		var scheduleScriptStatus = 'Completed';
		var searchResult = getScheduleScriptStatus(recid);

		if(searchResult.length > 0)
		{
			scheduleScriptStatus = searchResult[0].getValue('custrecord_wmsse_schprsstatus');
			recid =  searchResult[0].getValue('custrecord_wmsse_schprsnotes');

		}
		if(scheduleScriptStatus != 'Completed')
		{
			alert(translator.getTranslationStringForClientScript('CCGENERATEANDRELEASE.FORM_SCHD_NOTYETCOMPLETED'));
			return false;
		}
		else
		{

			var cmd = 'startcount';
			var WavePDFURL = '/app/accounting/transactions/invcountmanager.nl?id=' + recid + '&cmd=' + cmd;
			window.location.href = WavePDFURL;
		}

	}

	function saveRecord(scriptContext) {

		var currentRec = scriptContext.currentRecord;
		var tempFlag = "F";
		var lineCnt = currentRec.getLineCount({
			sublistId: 'custpage_ccgenerateandrealaselist'
		});

		var validateFlag = currentRec.getValue({
			fieldId: 'custpage_hiddenfieldselectpage'
		});
		for (var sublist = 0; sublist < lineCnt; sublist++) {

			var isSelected = currentRec.getSublistValue({
				sublistId: 'custpage_ccgenerateandrealaselist',
				fieldId: 'custpage_select',
				line: sublist
			});

			if (isSelected) {
				tempFlag = 'T';
				break;
			}
		}

		// if (tempFlag == 'F' && validateFlag != 'T') {
		if (!validateFlag && tempFlag == 'F'){
			alert(translator.getTranslationStringForClientScript('CCGENERATEANDRELEASE.FORM_ERROR_ATLEASTONELINE'));
			return false;
		}
		return true;
	}//end of OnSave

	function fieldChanged(scriptContext) {

		var currentRecord = scriptContext.currentRecord;

		var name = scriptContext.fieldId;

		if (name == 'custpage_selectpage') {
			currentRecord.setValue({
				fieldId: 'custpage_hiddenfieldselectpage',
				value: true
			});
			var hiddendnMarkFlag = currentRecord.getValue({
				fieldId: 'custpage_hiddenselectallflag'
			});
			currentRecord.setValue({
				fieldId: 'custpage_hiddenselectallflag',
				value: hiddendnMarkFlag
			});

			NLDoMainFormButtonAction("submitter", true);
		} else {
			return true;
		}
	}//end of field change function
	function getScheduleScriptStatus(schdScriptStatusRecId)
	{
		var columns = [];
		columns.push(search.createColumn({
			name: 'custrecord_wmsse_schprsstatus'
		}));

		columns.push(search.createColumn({
			name: 'custrecord_wmsse_schprsnotes'
		}));

		var wmsFilters = [];
		wmsFilters.push(
				search.createFilter({
					name:'name',
					operator:search.Operator.IS,
					values:'cycleCountGenerateAndRelease'
				})
		);
		wmsFilters.push(
				search.createFilter({
					name:'internalid',
					operator:search.Operator.ANYOF,
					values:schdScriptStatusRecId
				})
		);
		var searchObj = search.create({type:'customrecord_wmsse_schscripts_status',
			filters:wmsFilters,columns:columns
		});
		var searchResult = [];
		var search_page_count = 1;

		var myPagedData = searchObj.runPaged({
			pageSize: search_page_count
		});
		myPagedData.pageRanges.forEach(function (pageRange) {
			var myPage = myPagedData.fetch({
				index: pageRange.index
			});
			myPage.data.forEach(function (result) {
				searchResult.push(result);
			});
		});
		var scheduleScriptStatus = 'Completed';
		log.debug({title:'searchResult',details:searchResult});
		if(searchResult.length > 0)
		{
			scheduleScriptStatus = searchResult[0].getValue('custrecord_wmsse_schprsstatus');
		}
		return searchResult;
	}
	function markAll()
	{
		var flagArr = [];

		
		var localVal = '';
		rec.setValue({
			fieldId: 'custpage_unselectedlines',
			value: localVal
		});

		var lineCnt = rec.getLineCount({
			sublistId : 'custpage_ccgenerateandrealaselist'
		});
		for(var markItr = 0; markItr < lineCnt; markItr++)
		{
				rec.selectLine({
					sublistId: 'custpage_ccgenerateandrealaselist',
					line: markItr
				});
				rec.setCurrentSublistValue({
					sublistId: 'custpage_ccgenerateandrealaselist',
					fieldId: 'custpage_select',
					value: true
				});
				rec.commitLine({
					sublistId: 'custpage_ccgenerateandrealaselist'
				});
		}
	}

	function unMarkAll()
	{
		/*rec.setValue({
			fieldId: 'custpage_hiddenselectallflag',
			value: 'unmark'
		});*/

		var localValue = '';
		rec.setValue({
			fieldId: 'custpage_oldresponse',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_oldresponsecontinue',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_selectedlines',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_unselectedlines',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_oldresponsecontitem1',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_oldresponsecontitem2',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_oldresponsecontitem3',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_oldresponsecontitem4',
			value: localValue
		});
		rec.setValue({
			fieldId: 'custpage_oldresponsecontitem5',
			value: localValue
		});
		var lineCnt = rec.getLineCount({
			sublistId : 'custpage_ccgenerateandrealaselist'
		});

		for(var unmarkItr = 0; unmarkItr < lineCnt; unmarkItr++)
		{
			rec.selectLine({
				sublistId: 'custpage_ccgenerateandrealaselist',
				line: unmarkItr
			});
			rec.setCurrentSublistValue({
				sublistId: 'custpage_ccgenerateandrealaselist',
				fieldId: 'custpage_select',
				value: false
			});
			rec.commitLine({
				sublistId: 'custpage_ccgenerateandrealaselist'
			});
		}
	}

	return {
		startCount: startCount,
		backtogeneratesearch: backtogeneratesearch,
		saveRecord: saveRecord,
		getScheduleScriptStatus:getScheduleScriptStatus,
		fieldChanged: fieldChanged,
		unMarkAll: unMarkAll,
		markAll: markAll

	};

});
