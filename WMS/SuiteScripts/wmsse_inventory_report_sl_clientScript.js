/***************************************************************************
 Copyright © 2015,2019, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */



function fnInvReportExport()
{
  
    nlapiLogExecution('DEBUG', 'fnInventoryExport', 'InventoryExport');
	var InvPDFURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_inv_report_excel', 'customdeploy_wmsse_inv_report_excel_dl');

	var vLocation= nlapiGetFieldValue('custpage_location');
	var vItem= nlapiGetFieldValue('custpage_item');
	var vBinLoc= nlapiGetFieldValue('custpage_binloc'); 
	var lineCnt = nlapiGetLineItemCount('custpage_items'); 

	var invstatus = nlapiGetFieldValue('custpage_invstatus');

	if(lineCnt == -1 || lineCnt == 0)
	{
		alert(i18n.get("wms_InventoryReport.NO_RECORDS_AVAILABLE"));
		return false;
	}
	InvPDFURL = InvPDFURL + '&custpage_location='+ vLocation+'&custpage_item='+ vItem+'&custpage_binloc='+ vBinLoc+"&custpage_invstatus="+ invstatus;
	window.open(InvPDFURL);
}


function pageInit()
{
	var vLocation= nlapiGetFieldValue('custpage_location');
	disableBinField(vLocation);
	return true;
}


function onFieldChange(type, name)
{
	if(trim(name)==trim('custpage_location'))
	{
		var vLocation= nlapiGetFieldValue('custpage_location');
		disableBinField(vLocation);
	}
	return true;
}

function disableBinField(location)
{
	var locUseBinsFlag= "T";
	if(location!=null && location!='')
	{
		var locationFields = ['usesbins'];
		var locationDtl= nlapiLookupField('location',location,locationFields);
		locUseBinsFlag = locationDtl.usesbins;			
	}

	if(locUseBinsFlag == 'F')
	{
		nlapiSetFieldText('custpage_binloc', '');
		nlapiDisableField('custpage_binloc', true);
	}
	else
	{
		nlapiDisableField('custpage_binloc', false);
	}
}