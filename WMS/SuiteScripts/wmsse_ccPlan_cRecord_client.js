/**
 * Script Description
 * This script is used to validate Cycle Count plan custom record.
 */

/***************************************************************************
 Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/

/**
 * @author siva mulagalapati
 *@version
 *@date 2017/02/08 04:15:30 $
 *@Description: This function is to validate Cycle Count plan custom record.
 */

function OnSave(type,name)
{

	var subs = nlapiGetContext().getFeature('subsidiaries');

	var planNo = nlapiGetFieldValue('name');
	if(planNo == '' || planNo == null)
	{
		alert(i18n.get("wms_Cyclecount.ENTER_PLAN_NAME"));
		return false;
	}

	var vSub = nlapiGetFieldValue('custrecord_wmsse_subsidiary');
	if((vSub == '' || vSub == null) && subs == true )
	{
		alert(i18n.get("wms_Cyclecount.ENTER_SUBSIDIARY"));
		return false;
	}

	if(subs == true)
	{
		var vLoc = nlapiGetFieldValue('custrecord_wmsse_ccp_location');	
	}
	else
	{
		var vLoc = nlapiGetFieldValue('custrecord_wmsse_ccp_nonow_location');	
	}

	if(vLoc == '' || vLoc == null)
	{
		alert(i18n.get("wms_Cyclecount.ENTER_LOCATION"));
		return false;
	}

	var vAcc = nlapiGetFieldValue('custrecord_wmsse_ccp_account');
	if(vAcc == '' || vAcc == null)
	{
		alert(i18n.get("wms_Cyclecount.ENTER_ACCOUNT"));
		return false;
	}
	// To restrict duplicate plans


	var filters = new Array();
	if(planNo != null && planNo != '')
	{
		filters.push(new nlobjSearchFilter('name',null, 'is',planNo));
		//filters.push(new nlobjSearchFilter('isinactive',null, 'is','F'));

		//var cols = new Array();

		//var srhResult = nlapiSearchRecord('customrecord_wmsse_cyclecount_plan', null, filters, cols);
		var srhResult = nlapiSearchRecord('customrecord_wmsse_cyclecount_plan',
				'customsearch_wmsse_cyccnt_template_srh', filters, null);
		nlapiLogExecution('ERROR', 'srhResult',srhResult);		

		if(srhResult != null && srhResult != '')
		{
			alert(i18n.get("wms_Cyclecount.PLAN_ALREADY_EXIS"));
			return false;
		}
	}
	var itemIdArr = new Array();
	var itemTxtArr = new Array();
	var subsidiary = '';

	if(subs == true)
	{
		subsidiary = nlapiGetFieldValue('custrecord_wmsse_subsidiary');

		var itemId = nlapiGetFieldValue('custrecord_wmsse_ccp_item');
		var itemTxt = nlapiGetFieldText('custrecord_wmsse_ccp_item');
		if(itemId != null && itemId != '' && itemId != 'null')
		{
			itemIdArr = itemId.split('');
		}
		if(itemTxt != null && itemTxt != '' && itemTxt != 'null')
		{
			itemTxtArr = itemTxt.split('');
		}

		var validItemArr = new Array();
		var invalidItemArr = new Array();
		var fil4 = new Array();

		if(subsidiary != null && subsidiary != '' && subsidiary != 'null' && subs == true)
			fil4.push(new nlobjSearchFilter('subsidiary',null, 'anyof',subsidiary));
		if(itemId != null && itemId != '' && itemId != 'null')
			fil4.push(new nlobjSearchFilter('internalid',null, 'anyof',itemIdArr));

		var col4 = new Array();
		//col4.push(new nlobjSearchColumn('subsidiary',null,'group'));
		col4.push(new nlobjSearchColumn('itemid'));
		//col4.push(new nlobjSearchColumn('internalid'));

		var itemResult = nlapiSearchRecord('item', 'customsearch_wmsse_inv_basic_itemdetails', fil4,col4);//sorting is on name
		nlapiLogExecution('ERROR', 'itemResult',itemResult);

		if(itemResult != null && itemResult != '')
		{
			for(var i=0;i<itemResult.length;i++)
			{
				validItemArr.push(itemResult[i].getValue('internalid'));
			}
			for(var j=0;j<itemTxtArr.length;j++)
			{
				//if(itemIdArr.indexOf(validItemArr[j])==-1)
				if(validItemArr.indexOf(itemIdArr[j])==-1)
				{
					invalidItemArr.push(itemTxtArr[j]);
				}
			}
			if(invalidItemArr != null && invalidItemArr != '' && invalidItemArr.length>0)
			{
				var itemStr = invalidItemArr.toString();
				if(invalidItemArr.length>1)
				{
					itemStr = itemStr+' are';
				}
				else
				{
					itemStr = itemStr+' is';
				}
				alert(itemStr + i18n.get("wms_Cyclecount.NOT_MAPPED_SELECTED_SUBSIDIARY"));
				return false;
			}
			/*else
		{
			return true;
		}*/
		}
		else
		{
			alert(i18n.get("wms_Cyclecount.ITEMS_NOT_MAPPED_SELECTED_SUBSIDIARY"));
			return false;
		}
	}


	var whLoc = '';
	if(subs == true)
	{
		whLoc = nlapiGetFieldValue('custrecord_wmsse_ccp_location');
	}
	else
	{
		whLoc = nlapiGetFieldValue('custrecord_wmsse_ccp_nonow_location');
	}
	var binsStr = nlapiGetFieldValue('custrecord_wmsse_ccp_bin');
	var binsTxt = nlapiGetFieldText('custrecord_wmsse_ccp_bin');
	var binsArr = new Array();
	var binsTxtArr = new Array();
	var validBins = new Array();
	var inValidBins = new Array();

	if(binsStr != null && binsStr != '' && binsStr != 'null')
	{
		if(binsStr != null && binsStr != '' && binsStr != 'null')
		{
			binsArr = binsStr.split('');
		}
		if(binsTxt != null && binsTxt != '' && binsTxt != 'null')
		{
			binsTxtArr = binsTxt.split('');
		}

		var binFilters = new Array();

		if(whLoc != null && whLoc != '' && whLoc != 'null')
			binFilters.push(new nlobjSearchFilter('location',null, 'anyof',whLoc));

		if(binsArr != null && binsArr != '' && binsArr != 'null' && binsArr.length>0)
			binFilters.push(new nlobjSearchFilter('internalid',null, 'anyof',binsArr));

		var binCols = new Array();

		binCols.push(new nlobjSearchColumn('binnumber'));

		var binResult = nlapiSearchRecord('bin', null, binFilters,binCols);
		if(binResult != null && binResult != '')
		{
			for(var t=0;t<binResult.length;t++)
			{
				validBins.push(binResult[t].getValue('binnumber'));
			}
			for(var s=0;s<binsArr.length;s++)
			{
				if(validBins.indexOf(binsTxtArr[s]) == -1)
				{
					inValidBins.push(binsTxtArr[s]);
				}
			}
			if(inValidBins != null && inValidBins != '' && inValidBins.length>0)
			{
				var BinStr = inValidBins.toString();
				if(inValidBins.length>1)
				{
					BinStr = BinStr+' are';
				}
				else
				{
					BinStr = BinStr+' is';
				}
				alert(BinStr + i18n.get("wms_Cyclecount.NOT_MAPPED_SELECTED_LOCATION"));
				return false;
			}
		}
		else
		{
			alert(i18n.get("wms_Cyclecount.BINS_NOT_MAPPED_SELECTED_LOCATION"));
			return false;
		}
	}

	return true;
}

/**
 * @author siva mulagalapati
 *@version
 *@date 2017/02/08 04:15:30 $
 *@Description: This function is to validate Cycle Count plan custom record.
 */
function OnFieldChange(type,name)
{

	var subs = nlapiGetContext().getFeature('subsidiaries');
	nlapiLogExecution('ERROR', 'subs', subs);

	var context=nlapiGetContext();
	var vSubsid=context.getSubsidiary();
	nlapiLogExecution('ERROR', 'vSubsid',vSubsid);

	if(name == 'custrecord_wmsse_subsidiary')
	{
		// To validate Subsidiary in One World Account
		/*var context=nlapiGetContext();
		var vSubsid=context.getSubsidiary();*/
		nlapiLogExecution('ERROR', 'vSubsid',vSubsid);
		var subsidiary = '';
		if(vSubsid != null && vSubsid != '' && vSubsid != 'null' && vSubsid != 'undefined' && subs == true)
		{
			subsidiary = nlapiGetFieldValue('custrecord_wmsse_subsidiary');
			nlapiLogExecution('ERROR', 'subsidiary',subsidiary);
			if(subsidiary == null || subsidiary == '')
			{
				alert(i18n.get("wms_Cyclecount.SUBSIDIARY_MANDATORY"));
				return false;
			}
			else
			{
				return true;
			}
		}
	}

	if(name == 'custrecord_wmsse_ccp_location')
	{
		// To validate location in One World Account

		nlapiLogExecution('ERROR', 'vSubsid',vSubsid);
		var subsidiary = '';
		if(vSubsid != null && vSubsid != '' && vSubsid != 'null' && vSubsid != 'undefined' && subs == true)
		{
			subsidiary = nlapiGetFieldValue('custrecord_wmsse_subsidiary');
			nlapiLogExecution('ERROR', 'subsidiary',subsidiary);
			var location = nlapiGetFieldValue('custrecord_wmsse_ccp_location');
			nlapiLogExecution('ERROR', 'location',location);

			var locfilt = new Array();

			if(subsidiary != null && subsidiary != '' && subsidiary != 'null')
				locfilt.push(new nlobjSearchFilter('subsidiary',null, 'anyof',subsidiary));
			if(location != null && location != '' && location != 'null')
				locfilt.push(new nlobjSearchFilter('internalid',null, 'anyof',location));

			var locResult = nlapiSearchRecord('location', 'customsearch_wmsse_locsearchresults', locfilt);//saved search sorting is on name

			if(locResult == null || locResult == '' || locResult == 'null')
			{
				alert(i18n.get("wms_Cyclecount.LOCATION_NOT_MAPPED_SELECTED_SUBSIDIARY"));
				return false;
			}else
			{
				return true;
			}

		}
	}

	if(name == 'custrecord_wmsse_ccp_account')
	{
		//To validate Account according to Subsidiary
		var cycAccount = '';		
		var subsidiary = '';
		if(vSubsid != null && vSubsid != '' && vSubsid != 'null' && vSubsid != 'undefined' && subs == true)
		{
			subsidiary = nlapiGetFieldValue('custrecord_wmsse_subsidiary');
			nlapiLogExecution('ERROR', 'subsidiary',subsidiary);			

			//var subsidiary = nlapiGetFieldValue('custrecord_wmsse_subsidiary');
			cycAccount = nlapiGetFieldValue('custrecord_wmsse_ccp_account');

			var fil3 = new Array();

			if(subsidiary != null && subsidiary != '' && subsidiary != 'null')
				fil3.push(new nlobjSearchFilter('subsidiary',null, 'anyof',subsidiary));
			if(cycAccount != null && cycAccount != '' && cycAccount != 'null')
				fil3.push(new nlobjSearchFilter('internalid',null, 'anyof',cycAccount));

			var accResult = nlapiSearchRecord('account', null, fil3);
			nlapiLogExecution('ERROR', 'accResult',accResult);

			if(accResult == null || accResult == '' || accResult == 'null')
			{
				alert(i18n.get("wms_Cyclecount.ACCOUNT_NOT_MAPPED_SELECTED_SUBSIDIARY"));
				return false;
			}else
			{
				return true;
			}
		}
	}

	/*if(name == 'custrecord_wmsse_ccp_item')
	{
		//To validate Account according to Subsidiary
		var cycAccount = '';
		var itemIdArr = new Array();
		var subsidiary = nlapiGetFieldValue('custrecord_wmsse_subsidiary');
		var itemId = nlapiGetFieldValue('custrecord_wmsse_ccp_item');
		if(itemId != null && itemId != '' && itemId != 'null')
		{
			itemIdArr = itemId.split('');
		}

		var fil4 = new Array();

		if(subsidiary != null && subsidiary != '' && subsidiary != 'null')
			fil4.push(new nlobjSearchFilter('subsidiary',null, 'anyof',subsidiary));
		if(itemId != null && itemId != '' && itemId != 'null')
			fil4.push(new nlobjSearchFilter('internalid',null, 'anyof',itemIdArr));

		var itemResult = nlapiSearchRecord('item', null, fil4);
		nlapiLogExecution('ERROR', 'itemResult',itemResult);

		if(itemResult == null || itemResult == '' || itemResult == 'null')
		{
			alert('Please select valid Item');
			return false;
		}
		else
		{
			return true;
		}
	}*/
	return true;
}


function OnLocationFieldChange(type,name)
{

	if(trim(name)==trim('custrecord_wmsse_ccp_location'))
	{
		var vLocation= nlapiGetFieldValue('custrecord_wmsse_ccp_location');
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
		nlapiSetFieldValue('custrecord_wmsse_ccp_aisle', null);
		nlapiSetFieldValue('custrecord_wmsse_ccp_count_binrowszqty', false);
		nlapiSetFieldValue('custrecord_wmsse_ccp_rowsort_bin', false);
		
		if(nlapiGetFieldValue('custrecord_wmsse_ccp_zones')!=null && nlapiGetFieldValue('custrecord_wmsse_ccp_zones')!='')
		{
			nlapiSetFieldText('custrecord_wmsse_ccp_zones', '');			
		}

		if(nlapiGetFieldValue('custrecord_wmsse_ccp_bin')!=null && nlapiGetFieldValue('custrecord_wmsse_ccp_bin')!='')
		{
			nlapiSetFieldText('custrecord_wmsse_ccp_bin', '');					
		}
		
		
		nlapiDisableField('custrecord_wmsse_ccp_zones', true);
		nlapiDisableField('custrecord_wmsse_ccp_count_binrowszqty', true);
		nlapiDisableField('custrecord_wmsse_ccp_aisle', true);
		nlapiDisableField('custrecord_wmsse_ccp_rowsort_bin', true);
		nlapiDisableField('custrecord_wmsse_ccp_bin', true);
	}
	else
	{
		nlapiDisableField('custrecord_wmsse_ccp_zones', false);
		nlapiDisableField('custrecord_wmsse_ccp_count_binrowszqty', false);
		nlapiDisableField('custrecord_wmsse_ccp_aisle', false);
		nlapiDisableField('custrecord_wmsse_ccp_rowsort_bin', false);
		nlapiDisableField('custrecord_wmsse_ccp_bin', false);		
	}	
	
}
