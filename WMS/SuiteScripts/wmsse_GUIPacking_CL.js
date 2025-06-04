/***************************************************************************
 Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/

function backtogeneratesearch()
{ 	 
	var PackingURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_gui_packing', 'customdeploy_wmsse_gui_packing');

	window.location.href = PackingURL;
}

function OnSave(type,name)
{
	var cartonNo = nlapiGetFieldValue('custpage_carton');
	var cartonWeight = nlapiGetFieldValue('custpage_cartonweight');
	var SOid = nlapiGetFieldValue('custpage_order');
	var location=nlapiGetFieldValue('custpage_locationhddn');

	var FULFILLMENTATORDERLEVEL = getSystemRuleValue('Consolidate item fulfillments by sales order?',location);
	if(cartonNo==null || cartonNo=='')
	{
		alert('Please enter value(s) for: carton');
		return false;
	}

	if(cartonWeight==null || cartonWeight=='')
	{
		alert('Please enter value(s) for: carton weight');
		return false;
	}

	if(cartonNo !=null && cartonNo !='' && cartonNo !=null && cartonNo !='')
	{
		var newcartonNo = cartonNo.replace(/[';:!%&#@,<>]/g, "");

		if(newcartonNo.length != cartonNo.length)
		{
			//alert('Please enter valid value(s) for: Carton');
			alert('Carton numbers cannot contain the following special characters: ! ; %  : & # , @ < >');
			return false;
		}
	}

	if(isNaN(cartonWeight)==true)
	{

		alert('Please enter numeric value(s) for: carton weight');
		return false;
	}

	if(parseFloat(cartonWeight)<0)
	{
		//alert('Please enter valid carton weight');
		alert('Carton weight should not be negative value');
		return false;
	}
	if(parseFloat(cartonWeight) == 0)
	{
		alert('Carton weight should be greater than zero');
		return false;
	}
	var maxvalue =  Math.pow(2,64);
	if(parseFloat(cartonWeight) > parseFloat(maxvalue))
	{
		alert("Illegal Carton weight: " + cartonWeight);
		return false;
	}	
	var tempFlag="F";

	var lineCnt = nlapiGetLineItemCount('custpage_packinglist');
	var vCustmerArr = new Array();
	var count = 1;
	var tempId ='';
	var checkflag = 'F';
	for(var i=1;i<=lineCnt;i++)
	{
		var isSelected=nlapiGetLineItemValue('custpage_packinglist', 'custpage_select', i);
		var orderId=nlapiGetLineItemValue('custpage_packinglist', 'custpage_orderinternalid', i);
		var enteredQty=nlapiGetLineItemValue('custpage_packinglist', 'custpage_actqty', i);
		var actQty=nlapiGetLineItemValue('custpage_packinglist', 'custpage_actqtyhddn', i);
		var expQty=nlapiGetLineItemValue('custpage_packinglist', 'custpage_expqtyhddn', i);
		var customer=nlapiGetLineItemValue('custpage_packinglist','custpage_customers', i);
		var whLoc=nlapiGetLineItemValue('custpage_packinglist', 'custpage_locationhddn', i);
		var checkFlaghddn=nlapiGetLineItemValue('custpage_packinglist', 'custpage_checkflaghddn', i);
		var lineNo = nlapiGetLineItemValue('custpage_packinglist', 'custpage_lineno', i);
		var containerNo = nlapiGetLineItemValue('custpage_packinglist', 'custpage_container', i);		
		var skuInternalId = nlapiGetLineItemValue('custpage_packinglist', 'custpage_skuinternalid', i);
		var isRemainingQtyExists = nlapiGetLineItemValue('custpage_packinglist', 'custpage_isremqtyexistsfororder', i);
		if(expQty == null || expQty == 'null' || expQty == '' || expQty == undefined)
		{			
			expQty = '0';
		}

		if(isSelected=="T")
		{

			if(count == 1)
			{

				tempId = orderId;
				count++;
			}
			if(orderId != tempId)
			{

				alert('Please select a single order');
				nlapiSetLineItemValue('custpage_packinglist', 'custpage_select', i,'F');
				return false;
			}
			if( vCustmerArr.indexOf(customer)==-1)
			{
				vCustmerArr.push(customer);//201413405
			}
			tempFlag="T";
			if(isNaN(enteredQty) || parseFloat(enteredQty)<=0)
			{
				alert('Please enter valid qty');
				nlapiSetLineItemValue('custpage_packinglist', 'custpage_actqty', i,actQty);
				return false;
			}
			if(parseFloat(enteredQty) > parseFloat(actQty))
			{
				alert('Pack qty should be less than or equal to Pick Qty');
				nlapiSetLineItemValue('custpage_packinglist', 'custpage_actqty', i,actQty);
				return false;
			}

			if(parseFloat(enteredQty) != parseFloat(actQty) || isRemainingQtyExists == 'T')
			{



				if(FULFILLMENTATORDERLEVEL =='Y')
				{
					if(checkflag == 'F')
						var confirmFulfillment = confirm("Do you wish to fulfill this order with partial quantity");

					if(confirmFulfillment == true)
					{	

						//nlapiSetLineItemValue('custpage_packinglist', 'custpage_checkFlaghddn',checkFlaghddn);
						checkflag = 'T';
						nlapiSetLineItemValue('custpage_packinglist', 'custpage_checkflaghddn', i,'T');

					}
					else
						return false;
				}
			}

		}
	}

	if(isRemainingQtyExists == 'T')
	{
		var filtersPack = new Array();
		filtersPack.push(new nlobjSearchFilter('custrecord_wmsse_wms_status_flag', null, 'anyof', ['28']));
		filtersPack.push(new nlobjSearchFilter('custrecord_wmsse_nsconfirm_ref_no', null, 'anyof',['@NONE@'])); 
		filtersPack.push(new nlobjSearchFilter('custrecord_wmsse_order_no', null, 'anyof', orderId));
		filtersPack.push(new nlobjSearchFilter('custrecord_wmsse_tasktype', null, 'anyof', ['14']));

						var columnsPack=new Array();
						columnsPack[0]=new nlobjSearchColumn('custrecord_wmsse_device_upload_flag');
						var opentaskSearchResultsPack=nlapiSearchRecord('customrecord_wmsse_trn_opentask',null,filtersPack,columnsPack);
						if(opentaskSearchResultsPack!=null && opentaskSearchResultsPack!='')
						{


							var fieldsPack = new Array();
							var valuesPack = new Array();
							for(var x=0; x < opentaskSearchResultsPack.length; x++)
							{

				var RecordIdPack=opentaskSearchResultsPack[x].getId();
				if(RecordIdPack!=null && RecordIdPack!='')
				{
					var recId=nlapiLoadRecord('customrecord_wmsse_trn_opentask',RecordIdPack);
					recId.setFieldValue('custrecord_wmsse_device_upload_flag','T');
					var vPackRecId = nlapiSubmitRecord(recId);
					nlapiLogExecution('ERROR','vPackRecId at',vPackRecId);
				}
			}

		}
	}

	if(tempFlag=="F")
	{
		alert('Please Select Atleast One Line Item');
		return false;
	}
	if(vCustmerArr.length > 1)
	{
		alert("Please Select Unique customer.");
		return false;
	}
	return true;
	PrintPacklist();
}


/*function PrintPacklist()
{
	var htmlstring=nlapiGetFieldValue('custpage_temphtmlstring');	
	//var imgurl=nlapiGetFieldValue('custpage_tempimgurl');	
	if((htmlstring!=null && htmlstring!=''))
	{
		var soid=nlapiGetFieldValue('custpage_soid');
		var containerlp=nlapiGetFieldValue('custpage_contlp');
		var bulkpack='NO';
		var WavePDFURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_pack_list_print', 'customdeploy_wmsse_pack_list_print');
		WavePDFURL = WavePDFURL + '&custparam_wmsse_soid='+ soid+ '&custparam_wmsse_containerlp='+ containerlp+ '&custparam_bul_pack='+ bulkpack;
		var printWindow=window.open(WavePDFURL);
		printWindow.focus();
		printWindow.print();
	}
}*/


function getSystemRuleValue(RuleId,loc)
{
	nlapiLogExecution('Debug', 'Into getSystemRuleValue... ', RuleId);
	nlapiLogExecution('Debug', 'loc', loc);
	var systemrulevalue='';

	try{
		var filters = new Array();

		filters[0] = new nlobjSearchFilter('name', null, 'is', RuleId.toString());
		filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		//starts
		if(loc != null && loc != '')
			filters.push(new nlobjSearchFilter('custrecord_wmssesite', null, 'anyof', ['@NONE@',loc]));
		//ends

		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_wmsserulevalue');
		columns[1] = new nlobjSearchColumn('custrecord_wmssesite');

		columns[1].setSort();
		var searchresults = nlapiSearchRecord('customrecord_wmsse_sysrules', null, filters, columns);	
		if(searchresults != null && searchresults != '')
		{
			if(searchresults[0].getValue('custrecord_wmsserulevalue') != null && searchresults[0].getValue('custrecord_wmsserulevalue') != '')
			{
				systemrulevalue = searchresults[0].getValue('custrecord_wmsserulevalue');
				searchresults=null;
				return systemrulevalue;
			}
			else
				return systemrulevalue;
		}
		else
			return systemrulevalue;
	}
	catch (exp) 
	{
		nlapiLogExecution('Debug', 'Exception in GetSystemRules: ', exp);
		return systemrulevalue;
	}	
}

function getSystemRuleValueRec(RuleId,loc)
{
	nlapiLogExecution('Debug', 'Into getSystemRuleValue... ', RuleId);
	nlapiLogExecution('Debug', 'loc', loc);
	var systemrulevalue='';


	var filters = new Array();

	filters[0] = new nlobjSearchFilter('name', null, 'is', RuleId.toString());
	filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
	//starts
	if(loc != null && loc != '')
		filters.push(new nlobjSearchFilter('custrecord_wmssesite', null, 'anyof', ['@NONE@',loc]));
	//ends

	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_wmsserulevalue');
	columns[1] = new nlobjSearchColumn('custrecord_wmssesite');
	columns[2] = new nlobjSearchColumn('custrecord_wmsse_scriptid');
	columns[3] = new nlobjSearchColumn('custrecord_wmsse_deployid');

	columns[1].setSort();
	var searchresults = nlapiSearchRecord('customrecord_wmsse_sysrules', null, filters, columns);

	return searchresults;
}


function PrintPacklist(Locationid)
{
	var htmlstring=nlapiGetFieldValue('custpage_temphtmlstring');	
	var itemfulfillmentid = nlapiGetFieldValue('custpage_fulfillment');


	//var imgurl=nlapiGetFieldValue('custpage_tempimgurl');	
	if((htmlstring!=null && htmlstring!=''))
	{
		var value = getSystemRuleValueRec('Use custom single order packing lists?',Locationid);
		var PackslipPDFURL;
		var systemrulevalue = '';
		var scriptID ='';
		var deployID = '';
		if(value != null && value != '' && value != 'null' && value != 'undefined')
		{
			systemrulevalue = value[0].getValue('custrecord_wmsserulevalue');
			scriptID = value[0].getValue('custrecord_wmsse_scriptid');
			//alert(scriptID);
			deployID = value[0].getValue('custrecord_wmsse_deployid');
			//alert(deployID);
		}

		if(systemrulevalue == 'Y')
		{
			if(scriptID != null && scriptID != 'null' && scriptID != '')
			{
				if(deployID != null && deployID != 'null' && deployID != '')
				{
					//alert('in if');
					var soid=nlapiGetFieldValue('custpage_soid');
					var containerlp=nlapiGetFieldValue('custpage_contlp');
					var bulkpack='NO';
					PackslipPDFURL = nlapiResolveURL('SUITELET', scriptID, deployID);
					PackslipPDFURL = PackslipPDFURL + '&custparam_wmsse_soid='+ soid+ '&custparam_wmsse_containerlp='+ containerlp+ '&custparam_bul_pack='+ bulkpack;
				}	
				else{

					if(itemfulfillmentid!=null && itemfulfillmentid!='' && itemfulfillmentid!=undefined)
					{

						PackslipPDFURL=scriptID.replace(/itemfulfillmentid/g,itemfulfillmentid);
					}
					else
					{
						alert("Unable to print the Packslip due to itemfulfillment not yet generated");
						return false;
					}

					//PackslipPDFURL = "/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&id="+itemfulfillmentid+"&label=Packing%20Slip&printtype=packingslip&trantype=itemship&orgtrantype=SalesOrd&auxtrans="+itemfulfillmentid+"";
				}
			}
		}else{
			var soid=nlapiGetFieldValue('custpage_soid');
			var containerlp=nlapiGetFieldValue('custpage_contlp');
			var bulkpack='NO';
			PackslipPDFURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_pack_list_print', 'customdeploy_wmsse_pack_list_print');
			PackslipPDFURL = PackslipPDFURL + '&custparam_wmsse_Locationid='+ Locationid+'&custparam_wmsse_soid='+ soid+ '&custparam_wmsse_containerlp='+ containerlp+ '&custparam_bul_pack='+ bulkpack;
		}

		var printWindow=window.open(PackslipPDFURL);
		printWindow.focus();
		printWindow.print();

	}

}



function onChange(type, name)
{
	if(trim(name)==trim('custpage_actqty'))
	{
		var currLine=nlapiGetCurrentLineItemIndex('custpage_packinglist');
		var quantity = nlapiGetLineItemValue('custpage_packinglist', 'custpage_actqty',currLine);
		var actQty=nlapiGetLineItemValue('custpage_packinglist', 'custpage_actqtyhddn', currLine);
		if(quantity != null && quantity != '')
		{
			var qtyValidate = quantity.split('.');
			if(qtyValidate.length > 1)
			{
				if(parseInt(qtyValidate[1].length) > 5)
				{
					alert('Quantity can not have more than 5 decimal places.');
					nlapiSetLineItemValue('custpage_packinglist', 'custpage_actqty', currLine,actQty);
					return false;
				}
			}
		}
	}



}
