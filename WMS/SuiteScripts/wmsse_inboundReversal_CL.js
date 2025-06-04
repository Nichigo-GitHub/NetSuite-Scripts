/***************************************************************************
 Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/

function backtogeneratesearch()
{ 	 
	
	var InboundReversalURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_inboundreversal_qb', 'customdeploywmsse_inboundreversal_qb');

	window.location.href = InboundReversalURL;
}

function OnSave()
{
	
	var lineCount = nlapiGetLineItemCount('custpage_items');

	var isLineSelected='F';
	for(var k = 1; k <= lineCount; k++){
		var selectValue = nlapiGetLineItemValue('custpage_items', 'custpage_po', k);
		if(selectValue=='T')
		{
			isLineSelected='T';
			break;
		}
	}
	var hiddenfieldSelectPage = nlapiGetFieldValue('custpage_hiddenfieldselectpage');
	
	if(isLineSelected == 'F' && hiddenfieldSelectPage =='F')
	{
		
		alert(i18n.get("wms_InboundReversal.SELECT_AT_LEAST_ONE_LINE"));
		return false;
	}
	
	return true;
}
function onChange(type, name)
{	
	
	if(trim(name)==trim('custpage_selectpage'))
	{
		nlapiSetFieldValue('custpage_hiddenfieldselectpage','T');
		NLDoMainFormButtonAction("submitter",true);	
	}
	else
	{
		return true;
	}

}