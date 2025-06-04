/***************************************************************************
  Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/

function OnSave(type,name)
{
	/*var poId=nlapiGetFieldValue('id');
	var lineCnt = nlapiGetLineItemCount('item');
	var whLocation = nlapiGetFieldValue('location');
	var makeWhSite="F";
	if(whLocation != null && whLocation !='' && whLocation !='null')
	{
		var filters=new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', whLocation));
		filters.push(new nlobjSearchFilter('custrecord_wmsse_make_wh_site', null, 'is', 'T'));
		//filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 
		var searchresults = nlapiSearchRecord('location', 'customsearch_wmsse_whloc_srh', filters, null);
		if(searchresults != null && searchresults !='' && searchresults !='null')
		{
			makeWhSite ="T";
		}
	}
	if(makeWhSite == "T")
	{
		var context = nlapiGetContext();
		var vPOoverageChecked='F';
		
		if(context != null && context != '')
		{
			vPOoverageChecked=context.getPreference('OVERRECEIPTS');
		}
		for (var k = 1; k <= lineCnt; k++) 
		{

			var itemId = nlapiGetLineItemValue('item','item',k);
			var itemText = nlapiGetLineItemText('item','item',k);
			var vItemLine = nlapiGetLineItemValue('item','line',k);
			var ordqty = nlapiGetLineItemValue('item','quantity',k);
			if(poId!=null && poId!='' && vItemLine!=null && vItemLine!='' )
			{
				var vOpenTaskDetails = getRecordDetails(poId,vItemLine,'anyof');
				if(vOpenTaskDetails != null && vOpenTaskDetails !='' && vOpenTaskDetails !='null')
				{
					var vqty=vOpenTaskDetails[0].getValue('custrecord_wmsse_act_qty',null,'sum');
					if(vqty == null || vqty == '' || vqty =='null')
						vqty =0;
					if((parseFloat(vqty) < parseFloat(ordqty)) && vPOoverageChecked=='F')
					{
						//alert('Order is being processed in warehouse. Do not make changes, please contact warehouse manager.');
						alert('You cannot make changes to this order because it is being processed in the warehouse. Contact your warehouse manager for more information.');
						return false;
					}
				}
			}
		}
	}*/
	return true;
}
function ValidateLine(type,name)
{
	var itemId = nlapiGetCurrentLineItemValue('item','item');
	var vItemLine = nlapiGetCurrentLineItemValue('item','line');
	var ordqty = nlapiGetCurrentLineItemValue('item','quantity');
	var whLocation = nlapiGetFieldValue('location');
	var makeWhSite="F";
	if(whLocation != null && whLocation !='' && whLocation !='null')
	{
		var filters=new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', whLocation));
		filters.push(new nlobjSearchFilter('custrecord_wmsse_make_wh_site', null, 'is', 'T'));
		//filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 
		var searchresults = nlapiSearchRecord('location', 'customsearch_wmsse_whloc_srh', filters, null);
		if(searchresults != null && searchresults !='' && searchresults !='null')
		{
			makeWhSite ="T";
		}
	}
	if(makeWhSite == "T")
	{
		var context = nlapiGetContext();
		var vPOoverageChecked='F';
		
		if(context != null && context != '')
		{
			vPOoverageChecked=context.getPreference('OVERRECEIPTS');
		}
		var poId=nlapiGetFieldValue('id');
		if(poId!=null && poId!='' && vItemLine!=null && vItemLine!='' )
		{
			
			var vOpenTaskDetails = getRecordDetails(poId,vItemLine,'anyof');

			if(vOpenTaskDetails != null && vOpenTaskDetails !='' && vOpenTaskDetails !='null')
			{
				var vqty=vOpenTaskDetails[0].getValue('custrecord_wmsse_act_qty',null,'sum');
				if(vqty == null || vqty == '' || vqty =='null')
					vqty =0;
				
				if((parseFloat(vqty) < parseFloat(ordqty)) && vPOoverageChecked=='F')
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
 * client event when user removes line in an PO
 * @param type
 * @returns {Boolean}
 */

function DeleteSoLine(type,name)
{
	var poId=nlapiGetFieldValue('id');
	var vItemLine =nlapiGetCurrentLineItemValue('item','line');
	var whLocation = nlapiGetFieldValue('location');
	var makeWhSite="F";
	if(whLocation != null && whLocation !='' && whLocation !='null')
	{
		var filters=new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', whLocation));
		filters.push(new nlobjSearchFilter('custrecord_wmsse_make_wh_site', null, 'is', 'T'));
	//	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F')); 
		var searchresults = nlapiSearchRecord('location', 'customsearch_wmsse_whloc_srh', filters, null);
		if(searchresults != null && searchresults !='' && searchresults !='null')
		{
			makeWhSite ="T";
		}
	}
	if(makeWhSite == "T")
	{
		
		if(poId!=null && poId!='' && vItemLine!=null && vItemLine!='' ) 
		{
			
			var searchRecords = getRecordDetails(poId,vItemLine,'anyof');
			//alert("searchRecords :" + searchRecords);
			if(searchRecords != null && searchRecords!='' && searchRecords !='null')
			{
				//alert("This line item is already considered for inbound process in WMS, so you cannot delete it.");
				alert('You cannot delete this line item because it is being processed in the warehouse. Contact your warehouse manager for more information.');
				return false;		
			}

		}
	}
	return true;
}
/**
 * searching for records
 * @param poId
 * @param lineNo
 * @returns
 */
function getRecordDetails(poId,lineNo,condn){
	
	var filter= new Array();
	if(poId !=null && poId !='')
		filter.push(new nlobjSearchFilter('custrecord_wmsse_order_no', null, 'is', poId));
	if(lineNo !=null && lineNo !='')
		filter.push(new nlobjSearchFilter('custrecord_wmsse_line_no', null, 'equalto', lineNo));
	filter.push(new nlobjSearchFilter('custrecord_wmsse_wms_status_flag', null, condn, ['3']));//3-PUTAWAY COMPLETED
	filter.push(new nlobjSearchFilter('custrecord_wmsse_tasktype', null, 'anyof', ['2']));//2-PUTW
	var columns = new Array();
	//columns[0] = new nlobjSearchColumn('custrecord_wmsse_act_qty',null,'sum');
	//columns[1] = new nlobjSearchColumn('custrecord_wmsse_line_no',null,'group');
	
	var searchRecords = nlapiSearchRecord('customrecord_wmsse_trn_opentask', 'customsearch_wmsse_opentaskclientsearch', filter, null);
	//alert("searchRecords :" + searchRecords);
	return searchRecords;
}