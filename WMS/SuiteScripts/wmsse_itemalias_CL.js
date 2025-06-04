/***************************************************************************
 * Script Description
 * This script is used to find duplicate item aliases.
 */

/***************************************************************************
 Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/
var eventtype;
function setDefaultValue(type)
{
	eventtype=type;

}

function onSave(type)
{	
	if(eventtype=='create' || eventtype=='copy' || eventtype=='edit')
	{
		var itemalias=nlapiGetFieldValue('name');
		var recordId=nlapiGetFieldValue('id');
//		alert("itemalias" + itemalias);
		var filterspo = new Array();
		filterspo.push(new nlobjSearchFilter('name', null, 'is', itemalias));


		var colspo = new Array();
		colspo[0]=new nlobjSearchColumn('name');
		colspo[1]=new nlobjSearchColumn('internalId');
		colspo[0].setSort(true);

		var searchresults = nlapiSearchRecord('customrecord_wmsse_sku_alias', null, filterspo, colspo);

		//alert("searchresults" + searchresults);

		if(searchresults !="" && searchresults !=null)
		{
			if(searchresults.length==1 && eventtype=='edit'){
				if(recordId == searchresults[0].getValue('internalId') && itemalias == searchresults[0].getValue('name')){
				return true;
				}else{
					alert("Item alias already exists");
					return false;
				}			
			}else{
			alert("Item alias already exists");
			return false;
			}
		}
		else
			return true;
	}
	else
		return true;

}


//upto here
