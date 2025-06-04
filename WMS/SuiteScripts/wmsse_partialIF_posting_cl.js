/**
 * Script Description
 * This script is used to validate Post Item Fulfillment form.
 */
/***************************************************************************
  Copyright � 2017,2018, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/

/**
 * This function is used to validate GUI Post Item Fulfillment form
 */
function OnSave(type,name)
{
	var tempFlag="F";
	var lineCnt = nlapiGetLineItemCount('custpage_items');
	var validateFlag = nlapiGetFieldValue('custpage_hiddenfieldselectpage');

	for(var i=1;i<=lineCnt;i++)
	{
		var isSelected=nlapiGetLineItemValue('custpage_items', 'custpage_select', i);
		if(isSelected == 'T')
		{
			tempFlag = 'T';
			break;
		}
	}
	if(tempFlag == 'F' && validateFlag != 'T')
	{
		alert('Please select atleast one line Item');
		return false;
	}
	return true;
}//end of OnSave

/**
 * This function is to validate paging.
 * 
 */
function  SelectPage_fieldchanged(type,name)
{
	if(trim(name)==trim('custpage_selectpage'))
	{
		nlapiSetFieldValue('custpage_hiddenfieldselectpage','T');
		nlapiSetFieldValue('custpage_hiddenpagesizechange','F');
		NLDoMainFormButtonAction("submitter",true);	
	}
	else if(trim(name)==trim('custpage_pagesize'))
	{
		var pageSize = nlapiGetFieldValue('custpage_pagesize');
		//If PageSize is above 150 then System may throw script execution limit exceeded error.
		if(parseInt(pageSize) > 150)
		{
			alert('The value in the Page Size field cannot exceed 150.');
			return false;
		}
		nlapiSetFieldValue('custpage_hiddenfieldselectpage','T');
		nlapiSetFieldValue('custpage_hiddenpagesizechange','T');
		NLDoMainFormButtonAction("submitter",true);	
	}
	else
	{
		return true;
	}
}//end of field change function