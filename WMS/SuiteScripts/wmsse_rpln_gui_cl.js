/**
 * Script Description
 * This script is used to validate Generate Replenishment process.
 */
/***************************************************************************
 Copyright � 2017,2018, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/

/**
 * This function is used to validate GUI Generate Replenishment page
 */
function OnSave(type,name)
{
	var tempFlag="F";
	var lineCnt = nlapiGetLineItemCount('custpage_items');
	var hdnFlag = nlapiGetFieldValue('custpage_hiddenfieldselectpage');
	var oldResponse = nlapiGetFieldValue('custpage_oldresponse');

	for(var iterator = 1; iterator <= lineCnt; iterator++)
	{
		var isSelected=nlapiGetLineItemValue('custpage_items', 'custpage_select', iterator);
		if(isSelected == 'T')
		{
			tempFlag = 'T';
			break;
		}
	}
	if(tempFlag == 'F'  && parseInt(lineCnt) > 0 && hdnFlag != 'T' && (oldResponse == null || oldResponse == '' || oldResponse == undefined))
	{
		alert(i18n.get('wms_GenReplenishment.SELECT_ATLEAST_ONE_LINE_ITEM'));
		return false;
	}
	return true;
}

function pageInit(type,name)
{
	var lineCnt = nlapiGetLineItemCount('custpage_items');
	for(var pageInitItr = 1; pageInitItr <= lineCnt; pageInitItr++)
	{
		var whAvailQty = nlapiGetLineItemValue('custpage_items','custpage_whqtyavail', pageInitItr);
		if(whAvailQty <= 0)
		{
			nlapiSetLineItemValue('custpage_items', 'custpage_select', pageInitItr,'F');
			nlapiSetLineItemDisabled('custpage_items', 'custpage_select', true, pageInitItr);
		}
	}
	return true;
}

function  selectPage_fieldchanged(type,name)
{
	if(trim(name)==trim('custpage_selectpage'))
	{
		nlapiSetFieldValue('custpage_hiddenfieldselectpage','T');

		var hdnMarkFlag = nlapiGetFieldValue('custpage_hiddenselectallflag');

		nlapiSetFieldValue('custpage_hiddenselectallflag',hdnMarkFlag);

		NLDoMainFormButtonAction("submitter",true);	
	}
	else
	{
		return true;
	}
}//end of field change function

function markAll()
{
	var flagArr = [];
	nlapiSetFieldValue('custpage_hiddenselectallflag','mark');

	var localVal = '';
	nlapiSetFieldValue('custpage_unselectedlines',localVal);

	var lineCnt = nlapiGetLineItemCount('custpage_items');
	for(var markItr = 1; markItr <= lineCnt; markItr++)
	{
		var whAvailQty = nlapiGetLineItemValue('custpage_items','custpage_whqtyavail', markItr);
		if(whAvailQty > 0)
		{
			nlapiSetLineItemValue('custpage_items', 'custpage_select', markItr,'T');
		}
	}
}

function unMarkAll()
{
	nlapiSetFieldValue('custpage_hiddenselectallflag','unmark');

	var localValue = '';
	nlapiSetFieldValue('custpage_oldresponse',localValue);
	nlapiSetFieldValue('custpage_oldresponsecontinue',localValue);
	nlapiSetFieldValue('custpage_selectedlines',localValue);
	nlapiSetFieldValue('custpage_unselectedlines',localValue);
	nlapiSetFieldValue('custpage_oldresponsecontitem1',localValue);
	nlapiSetFieldValue('custpage_oldresponsecontitem2',localValue);
	nlapiSetFieldValue('custpage_oldresponsecontitem3',localValue);
	nlapiSetFieldValue('custpage_oldresponsecontitem4',localValue);
	nlapiSetFieldValue('custpage_oldresponsecontitem5',localValue);

	var lineCnt = nlapiGetLineItemCount('custpage_items');
	for(var unmarkItr = 1; unmarkItr <= lineCnt; unmarkItr++)
	{
		nlapiSetLineItemValue('custpage_items', 'custpage_select', unmarkItr,'F');
	}
}
