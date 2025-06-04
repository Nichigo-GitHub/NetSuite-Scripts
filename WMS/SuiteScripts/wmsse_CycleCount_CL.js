/***************************************************************************
 Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/
function OnSave(type,name)
{

	var lineCnt = nlapiGetLineItemCount('item');
	var whLocation = nlapiGetFieldValue('location');
	var makeWhSite="F";
	if(whLocation != null && whLocation !='' && whLocation !='null')
	{
		var filters=new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', whLocation));
		filters.push(new nlobjSearchFilter('custrecord_wmsse_make_wh_site', null, 'is', 'T'));
		filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 
		var searchresults = nlapiSearchRecord('location', null, filters, null);
		if(searchresults != null && searchresults !='' && searchresults !='null')
		{
			makeWhSite ="T";
		}
	}
	if(makeWhSite == "T")
	{
		var binIdArr = new Array();
		for (var k = 1; k <= lineCnt; k++) 
		{

			var itemId = nlapiGetLineItemValue('item','item',k);
			var itemText = nlapiGetLineItemText('item','item',k);
			var binId = nlapiGetLineItemValue('item','binnumber',k);	
			if(binId)
			binIdArr.push(binId);

		}
		
		if(binIdArr.length > 0)
		{
		  var binIdArray=nswms_GetValidBinInternalId_CYCC(binIdArr,whLocation);
		 
			var tempFlag="F";
			var binInternalId='';

			if(binIdArray!=null && binIdArray!='' && binIdArray != 'null' && binIdArray != undefined && binIdArray.length > 0)
			{
				tempFlag='T';
			}

			if(tempFlag=="T")
			{
				alert('You cannot create inventory count for WIP bin location for these bins : '+binIdArray);
				return false;
			}
		}
	}


	return true;

}
function ValidateLine(type)
{

	var itemId = nlapiGetCurrentLineItemValue('item','item');
	var whLocation = nlapiGetFieldValue('location');
	var whMakeLocation = nlapiGetFieldValue('custrecord_wmsse_make_wh_site','location');
	//alert(whMakeLocation);
	//alert(whLocation);
	var makeWhSite="F";
	if(whLocation != null && whLocation !='' && whLocation !='null')
	{
		var filters=new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', whLocation));
		filters.push(new nlobjSearchFilter('custrecord_wmsse_make_wh_site', null, 'is', 'T'));
		filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 
		var searchresults = nlapiSearchRecord('location', null, filters, null);
		if(searchresults != null && searchresults !='' && searchresults !='null')
		{
			makeWhSite ="T";
		}
	}
	//alert(makeWhSite);
	if(makeWhSite == "T")
	{
		var filters = new Array();
		if(itemId != null && itemId != '')
			filters.push(new nlobjSearchFilter('internalid', null, 'is', itemId));
		var columns = new Array();	

		columns[0] = new nlobjSearchColumn('usebins');
		columns[1] = new nlobjSearchColumn('location');
		var ItemDetails = new nlapiSearchRecord('Item', null, filters, columns);
		var binVal = nlapiGetCurrentLineItemValue('item','binnumber');
		if(binVal!=null && binVal!='')
		{
		if(ItemDetails != null && ItemDetails !='')
		{
			var usebinsFlag=ItemDetails[0].getValue('usebins');

			if(usebinsFlag=='F')
			{
				alert('Please select use bins flag for this item');
				return false;
			}//Case# 201414599 start
			if(ItemDetails[0].getValue('location') != '' && ItemDetails[0].getValue('location') != whLocation)
			{
				alert("Entered item belongs to different warehouse");	
				return false;
			}//Case# 201414599 end
		}
		//Case# 201414684  start
		

		
		
			var binIdArray=nswms_GetValidBinInternalId_CYCC(binVal,whLocation);
			if(binIdArray!=null && binIdArray!='' && binIdArray != 'null' && binIdArray != undefined && binIdArray.length > 0)
			{
				alert('You cannot create inventory count for WIP bin location.');
				return false;
			}

			
		}
		//Case# 201414684  end
	}
	return true;
}


function nswms_GetValidBinInternalId_CYCC(Binnumber,whLocation)
{
	var bininternalId=new Array();
	var filter=new Array(); 
	filter.push(new nlobjSearchFilter('internalid',null,'anyof',Binnumber));
	filter.push(new nlobjSearchFilter('inactive',null, 'is','F'));
	if(whLocation!=null && whLocation!='' && whLocation!='null' && whLocation!=undefined)
		filter.push(new nlobjSearchFilter('location',null,'anyof',whLocation));
	var columns= new Array();
	columns[0] = new nlobjSearchColumn('custrecord_wmsse_bin_loc_type'); 
	columns[1] = new nlobjSearchColumn('binnumber'); 
	var searchrecord=nlapiSearchRecord('Bin',null,filter,columns);
	if(searchrecord!=null && searchrecord!="")
	{	
		
		for(var j=0;j<searchrecord.length;j++)
		{
			var vLocationType=searchrecord[j].getText('custrecord_wmsse_bin_loc_type');
			var vLocation=searchrecord[j].getValue('binnumber');
			if(vLocationType == 'WIP')
			{
				bininternalId.push(vLocation);
			}
		}

	}
	nlapiLogExecution('ERROR','bininternalId,Item,whLocation,Binnumber',bininternalId+","+whLocation+","+Binnumber);

	filter=null;
	searchrecord=null;
	filtersku=null;
	searchitemrecord=null;

	return bininternalId;
}