/***************************************************************************
 Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/
var eventtype;
function setDefaultValue(type)
{
	eventtype=type;

}


function OnSave(type,name)
{
	try
	{
		var soId=nlapiGetFieldValue('id');
		var lineCnt = nlapiGetLineItemCount('item');
		var whLocation = nlapiGetFieldValue('location');
		var makeWhSite="F";
		var trantype;


		var context = nlapiGetContext(); 
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
			if(soId!=null && soId!='')
			{
				trantype = nlapiLookupField('transaction', soId, 'recordType');
			}
			for (var k = 1; k <= lineCnt; k++) 
			{

				var itemId = nlapiGetLineItemValue('item','item',k);
				var itemText = nlapiGetLineItemText('item','item',k);
				var vItemLine = nlapiGetLineItemValue('item','line',k);
				var ordqty = nlapiGetLineItemValue('item','quantity',k);
				var vItemType = nlapiGetLineItemValue('item','itemtype',k);
				//alert("vItemType " + vItemType);
				if(soId!=null && soId!='' && vItemLine!=null && vItemLine!='' && eventtype == 'edit')
				{

					if(trantype == 'transferorder')
						vItemLine = parseInt(vItemLine)-1;


					var vOpenTaskDetails = getRecordDetails(soId,vItemLine,'noneof',vItemType);

					if(vOpenTaskDetails != null && vOpenTaskDetails !='' && vOpenTaskDetails !='null')
					{
						var vqty=vOpenTaskDetails[0].getValue('custrecord_wmsse_act_qty',null,'sum');
						if(vqty == null || vqty == '' || vqty =='null')
							vqty =0;
						if((parseFloat(ordqty) < parseFloat(vqty)))
						{
							//alert('Order is being processed in warehouse. Do not make changes, please contact warehouse manager.');
							alert('You cannot make changes to this order because it is being processed in the warehouse. Contact your warehouse manager for more information.');
							return false;
						}
					}
				}
			}
		}
	}
	catch (exps) {
		//alert('Error ' + JSON.stringify(exps));
	}

	return true;
}
function ValidateLine(type,name)
{
	var itemId = nlapiGetCurrentLineItemValue('item','item');
	var vItemLine = nlapiGetCurrentLineItemValue('item','line');
	var ordqty = nlapiGetCurrentLineItemValue('item','quantity');
	var vItemType = nlapiGetCurrentLineItemValue('item','itemtype');
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
		var soId=nlapiGetFieldValue('id');
		if(soId!=null && soId!='' && vItemLine!=null && vItemLine!='' )
		{
			var trantype = nlapiLookupField('transaction', soId, 'recordType');
			if(trantype == 'transferorder')
				vItemLine = parseInt(vItemLine)-1;
			var vOpenTaskDetails = getRecordDetails(soId,vItemLine,'noneof',vItemType);

			if(vOpenTaskDetails != null && vOpenTaskDetails !='' && vOpenTaskDetails !='null')
			{
				var vqty=vOpenTaskDetails[0].getValue('custrecord_wmsse_act_qty',null,'sum');
				if(vqty == null || vqty == '' || vqty =='null')
					vqty =0;
				//alert('ordqty:'+ordqty);
				//alert('vqty:'+vqty);
				if((parseFloat(ordqty) < parseFloat(vqty)))
				{
					//alert('Order is being processed in warehouse. Do not make changes, please contact warehouse manager.');
					alert('You cannot make changes to this order because it is being processed in the warehouse. Contact your warehouse manager for more information.');
					return false;
				}
			}
		}
	}
	return true;
}

/**
 * client event when user removes line in an SO
 * @param type
 * @returns {Boolean}
 */

function DeleteSoLine(type,name)
{
	var soId=nlapiGetFieldValue('id');
	var vItemLine =nlapiGetCurrentLineItemValue('item','line');
	var vItemType = nlapiGetCurrentLineItemValue('item','itemtype');
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
		if(soId!=null && soId!='' && vItemLine!=null && vItemLine!='' ) 
		{
			var trantype = nlapiLookupField('transaction', soId, 'recordType');
			if(trantype == 'transferorder')
				vItemLine = parseInt(vItemLine)-1;
			var searchRecords = getRecordDetails(soId,vItemLine,'noneof',vItemType);			
			if(searchRecords != null && searchRecords!='' && searchRecords !='null')
			{
				//alert("This line item is already considered for outbound process in WMS, so you cannot delete it.");
				alert('You cannot delete this line item because it is being processed in the warehouse. Contact your warehouse manager for more information.');
				return false;		
			}

		}
	}
	return true;
}
/**
 * searching for records
 * @param soId
 * @param lineNo
 * @returns
 */
function getRecordDetails(soId,lineNo,condn,pItemType){

	var filter= new Array();
	if(soId !=null && soId !='')
		filter.push(new nlobjSearchFilter('custrecord_wmsse_order_no', null, 'is', soId));
	if(lineNo !=null && lineNo !='')
		filter.push(new nlobjSearchFilter('custrecord_wmsse_line_no', null, 'equalto', lineNo));
	filter.push(new nlobjSearchFilter('custrecord_wmsse_wms_status_flag', null, condn, ['9','26','32']));//9-PICK LOCATIONS ASSIGNED, 26-FAILED PICKS, 32-STATUS.INBOUND_OUTBOUND.CLOSED
	filter.push(new nlobjSearchFilter('custrecord_wmsse_tasktype', null, 'anyof', ['3']));
	if(pItemType == 'Kit' && pItemType!=null && pItemType!='')
		filter.push(new nlobjSearchFilter('custrecord_wmsse_kitflag', null, 'is', 'F'));
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_wmsse_act_qty',null,'sum');
	columns[1] = new nlobjSearchColumn('custrecord_wmsse_line_no',null,'group');

	var searchRecords = nlapiSearchRecord('customrecord_wmsse_trn_opentask', null, filter, columns);
	//alert("searchRecords :" + searchRecords);
	return searchRecords;
}