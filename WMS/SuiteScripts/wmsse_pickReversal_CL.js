/***************************************************************************
  Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/

function backtogeneratesearch()
{ 	 
	var InboundReversalURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_gui_pickreversalqb', 'customdeploy_wmsse_gui_pickreversalqb');

	window.location.href = InboundReversalURL;
}

function OnSave()
{
	if(nlapiGetFieldValue('custpage_hiddenfieldselectpage')!='T')
	{
		var orderNo = nlapiGetFieldValue('custpage_order');
		var pickreportNo = nlapiGetFieldValue('custpage_pickreport');

		if(orderNo == '' && pickreportNo == '')
		{
			alert('Please enter value(s) for: Transaction# (or) Pick Report#');
			return false;
		}
		var lineCount = nlapiGetLineItemCount('custpage_reversalitems');
		var itemsSelected =true;
		if(lineCount != null && lineCount != 'undefined' && lineCount != 'null' && lineCount > 0)
		{
			itemsSelected =false;
			for(var j=1;j<=lineCount;j++)
			{
				var selectValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_po', j);

				if(selectValue == 'T')
				{
					itemsSelected =true;
					break;
				}

			}

			if(itemsSelected == false)
			{
				alert('Please select atleast one line for reversal.');
				return  false;
			}

		}
	}

	return true;
}
function onChange(type, name)
{	

	if(trim(name)!=trim('custpage_selectpage'))
	{
		if(trim(name)==trim('custpage_po'))
		{
			var currLine=nlapiGetCurrentLineItemIndex('custpage_reversalitems');
			var parentskuValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_parentsku',currLine);
			var parentskulineValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_lineno',currLine);
			var skuValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_itemintrid',currLine);
			var componentItem = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_iscomponentitem',currLine);
			var nsrefno = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_nsrefno',currLine);

			if ((parentskuValue != skuValue) && componentItem=='T' && (nsrefno != null && nsrefno != '' && nsrefno != 'null' && nsrefno != 'undefined' )) {
				var lineCount = nlapiGetLineItemCount('custpage_reversalitems');

				for(var m=1;m<=lineCount;m++)
				{
					var pskuValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_parentsku',m);
					var pskulineValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_lineno',m);
					var selectValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_po', m);

					if((currLine != m) && (pskuValue == parentskuValue) && (selectValue == 'F') && (parentskulineValue == pskulineValue) ) 
					{
						var res= confirm('Item fulfillment was posted to this item ,please select all component items');
						if(res==true)
						{
							for(var m1=1;m1<=lineCount;m1++)
							{
								var pskuValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_parentsku',m1);
								var pskulineValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_lineno',m1);
								var selectValue = nlapiGetLineItemValue('custpage_reversalitems', 'custpage_po', m1);
								if((pskuValue == parentskuValue) && (selectValue == 'F') && (parentskulineValue == pskulineValue) ) 
								{
									nlapiSetLineItemValue('custpage_reversalitems', 'custpage_po', m1,'T');
								}

							}
							break;
						}
						else
						{

							nlapiSetLineItemValue('custpage_reversalitems', 'custpage_po', currLine,'F');
							break;
							return false;
						}

					}
				}

				return false;


			}
		}
	}
	else
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

}