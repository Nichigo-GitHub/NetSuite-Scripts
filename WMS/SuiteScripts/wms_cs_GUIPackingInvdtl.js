/**
 *    Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope public
 */
define([ 'N/search', 'N/url' , 'N/record','../Restlets/wms_translator.js' ],

		function(search, url ,record,translator ) {


	function saveRecord(scriptContext) {
		var currentRec = scriptContext.currentRecord;
		var strInvDtl ='';
		var totalQty=0;
		var listLineNo = currentRec.getValue({
			fieldId : 'custpage_listlineno'
		});
		var qtyGiven = currentRec.getValue({
			fieldId : 'custpage_qtygiven'
		});

		var lineCnt = currentRec.getLineCount({
			sublistId: 'custpage_invdtllist'
		});
		var itemFulfillID = currentRec.getSublistValue({
			sublistId: 'custpage_invdtllist',
			fieldId: 'custpage_itemfulfillid',
			line: 0
		});
		var itemLineNo = currentRec.getSublistValue({
			sublistId: 'custpage_invdtllist',
			fieldId: 'custpage_lineinternalid',
			line: 0
		}); 
		for(var i=0;i< lineCnt;i++)
		{  
			var isSelected=currentRec.getSublistValue({
				sublistId: 'custpage_invdtllist',
				fieldId: 'custpage_selectbox',
				line: i
			});
			if(isSelected){
				var lineinternalid = currentRec.getSublistValue({
					sublistId: 'custpage_invdtllist',
					fieldId: 'custpage_lineinternalid',
					line: i
				}); 
				var qty = currentRec.getSublistValue({
					sublistId: 'custpage_invdtllist',
					fieldId: 'custpage_qty',
					line: i
				}); 
				var actQty = currentRec.getSublistValue({
					sublistId: 'custpage_invdtllist',
					fieldId: 'custpage_actqtyhdn',
					line: i
				}); 

				totalQty = parseFloat(totalQty)+ parseFloat(qty) ; 

				if(isNaN(qty) || parseFloat(qty)<=0)
				{
					alert(translator.getTranslationStringForClientScript('GUIPACKING.INVALIDQTY'));
					currentRec.setCurrentSublistValue({
						sublistId: 'custpage_invdtllist',
						fieldId: 'custpage_qty',
						value:qty
					});
					return false;
				}

				if(strInvDtl != '')
					strInvDtl  = strInvDtl + '#' + lineinternalid + ',' + qty	+ ',' + actQty;
				else
					strInvDtl  = lineinternalid + ',' + qty	+ ',' + actQty;
			}
		}
		if(parseFloat(totalQty) != parseFloat(qtyGiven)){
			alert(translator.getTranslationStringForClientScript('GUIPACKING.INVDTLQTY') + qtyGiven); 
			return false;
		}
        setWindowChanged(window, false);
		window.opener.document.getElementsByName(listLineNo)[0].value= strInvDtl;		
		window.close();
		return true;
	}

	function fieldChanged(scriptContext) {
		var currentRecord = scriptContext.currentRecord;
		var sublistName = scriptContext.sublistId;
		var sublistFieldName = scriptContext.fieldId;
		var lineNo = scriptContext.line;

		if (sublistName === 'custpage_invdtllist' && sublistFieldName === 'custpage_qty')
		{
			var quantity = currentRecord.getSublistValue({
				sublistId: 'custpage_invdtllist',
				fieldId: 'custpage_qty',
				line: lineNo
			}); 
			var actQty=  currentRecord.getSublistValue({
				sublistId: 'custpage_invdtllist',
				fieldId: 'custpage_actqtyhdn',
				line: lineNo
			});  
			if (parseFloat(quantity) > parseFloat(actQty)) {
				alert(translator.getTranslationStringForClientScript('GUIPACKING.UNPACKEDQTY'));
				currentRecord.setCurrentSublistValue({
					sublistId: 'custpage_invdtllist',
					fieldId: 'custpage_qty',
					value:actQty
				});  
				return false;
			}

		}
	}


	return {
		saveRecord:saveRecord,
		fieldChanged:fieldChanged
	};

});
