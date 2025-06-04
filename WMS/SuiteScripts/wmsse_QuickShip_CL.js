/***************************************************************************
  Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/
function OnSave(type,name)
{


	var vSo = nlapiGetFieldValue('custpage_qbso');
	var vCarton = nlapiGetFieldValue('custpage_qbcarton');

	if(vSo!=null && vSo!='' || vCarton!=null && vCarton!="")
	{
		return true;

	}
	else
	{
		alert('Please enter value(s) for: Order# or Carton# ');
		return false;
	}

}

function OnFieldChange(type,name)
{


	var mastertrack="";
	if(name=="custpage_trackingno")
	{
		var vCarton = nlapiGetFieldValue('custpage_qbcarton');
		if(vCarton!=null && vCarton!="")
		{
			var updatesametrack = nlapiGetFieldValue('custpage_updatesametrack');

			if(updatesametrack=="T")
			{
				var lineCnt = nlapiGetLineItemCount('custpage_items');
				var visible="F";
				if(lineCnt>=2)
				{

					var vTrackDisplay = nlapiGetFieldValue('custpage_trackmessage');
					var confirmationstatus=confirm("Multiple orders for the given container.Same Tracking# will updated to all Orders ");
					if (confirmationstatus == true) 
					{


						for(var p=1;p<=lineCnt;p++)
						{

							mastertrack= nlapiGetLineItemValue('custpage_items','custpage_trackingno',p);

							if(mastertrack!=null && mastertrack!="")
							{
								break;

							}
						}

						for(var a=1;a<=lineCnt;a++)
						{

							var oldmastertrack= nlapiGetLineItemValue('custpage_items','custpage_trackingno',a);
							var checkboxchecked=nlapiGetLineItemValue('custpage_items','custpage_select',a);
							if(checkboxchecked=="T")
							{

								if(mastertrack!=null && mastertrack!="")
								{
									nlapiSetLineItemValue('custpage_items','custpage_trackingno',a,mastertrack);
									visible="T";
								}


							}

						}
					}

					else
					{
						nlapiSetFieldValue('custpage_updatesametrack','F');
					}
				}
			}
		}
	}
}

function backtogeneratesearch()
{ 	 
	var QuickshipURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_quickship', 'customdeploy_wmsse_quickship');

	window.location.href = QuickshipURL;
}