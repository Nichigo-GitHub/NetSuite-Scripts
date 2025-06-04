/***************************************************************************
 Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/record','N/url','N/runtime','N/redirect','N/config','N/search','../Restlets/wms_utility.js','N/file','N/render','../Restlets/wms_packingUtility'],
		function(serverWidget,record,url,runtime,redirect,config,search,utility,file,render,packUtility) 
		{

	function onRequest(context) 
	{
		log.debug('context',context);
		if (context.request.method === 'GET') 
		{
			try
			{
				
				var response = context.response;
				var soid=context.request.parameters.custparam_wmsse_soid;
				var containerlp=context.request.parameters.custparam_wmsse_containerlp;				
				var whLocation=context.request.parameters.custparam_wmsse_Locationid;
				var tranType=context.request.parameters.custparam_trantype;
				var strlog = 'soid. = ' + soid + '<br>';
				strlog = strlog + 'containerlp. = ' + containerlp + '<br>';	
				strlog = strlog + 'tranType. = ' + tranType + '<br>';	
				strlog = strlog + 'whLocation. = ' + whLocation + '<br>';	

				log.debug('Into GET',strlog);
				var recordType='';
				if(tranType=='SalesOrd')
					recordType='salesorder';					
				else if(tranType=='TrnfrOrd')
					recordType='transferorder';
				
				fngethtmlstring(soid,recordType,containerlp,response,context);
			}
			catch(exp)
			{
				log.error('Error in GET', exp.toString());

			}
		} 

	}

	



	function getLoadFile(fileName,context,file,runtime)
	{

		var txtFilePath = "";
		var script = runtime.getCurrentScript();
		var vBundleId = script.bundleIds;	

		if(vBundleId != null && vBundleId != '') {
			//txtFilePath = 'SuiteBundles/Bundle ' + vBundleId + '/' + 'src/Images/' + fileName;
			txtFilePath = utility.getBundleFilePath(fileName,'Images');
		}

		var objFile=null;
		try
		{

			objFile = file.load({
				id: txtFilePath
			});

		}
		catch(e)
		{
			log.error('Error in GET', e.toString());

			txtFilePath = "Images/"+ fileName;			
			log.error('txtFilePath', txtFilePath);
			objFile = file.load({
				id: txtFilePath
			});

			log.error('Exception in file load', objFile);
		}
		return objFile;
	}

	function fngethtmlstring(vOrdNo,trantype,vcontainerLp,response,context)
	{

		

		try
		{
			log.debug('trantype ',trantype);		
			var salesorderdetails = record.load({type:trantype,
				id:vOrdNo
			});
			
			var shipaddress=salesorderdetails.getValue({fieldId:'shipaddress'});
			if((shipaddress!=null && shipaddress!=''))
			{
				shipaddress= shipaddress.replace(/\r\n/g, "<br />").replace(/\n/g, "<br />");
			}
			var orderdate=salesorderdetails.getText({fieldId:'trandate'});
			var ordernumber=salesorderdetails.getValue({fieldId:'tranid'});
			var customerpo=salesorderdetails.getValue({fieldId:'otherrefnum'});
			var entity=salesorderdetails.getText({fieldId:'entity'});
			var locationId =salesorderdetails.getValue({fieldId:'location'});
			var shipmethod=salesorderdetails.getText({fieldId:'shipmethod'});
			var shipmethodid=salesorderdetails.getValue({fieldId:'shipmethod'});
			var shipDate=salesorderdetails.getText({fieldId:'shipdate'});
			var orderType=salesorderdetails.getValue({fieldId:'ordertype'});
			var dept=salesorderdetails.getValue({fieldId:'department'});
			var classes=salesorderdetails.getValue({fieldId:'class'});
			
			

			var objPackDetails={};
			objPackDetails['whLocation'] = locationId; 
			objPackDetails['tranType'] = trantype; 
			objPackDetails['orderType'] = orderType; 
			objPackDetails['dept'] = dept; 
			objPackDetails['classes'] = classes; 
			objPackDetails['shipMethod'] = shipmethodid; 
			objPackDetails['orderId'] = vOrdNo; 
			objPackDetails['packCarton'] = vcontainerLp;
			if((customerpo==null)||(customerpo==''))
			{
				customerpo="";
			}
			if((shipDate==null)||(shipDate==''))
			{
				shipDate="";
			}
			if((orderdate==null)||(orderdate==''))
			{
				orderdate="";
			}
			shipmethod=shipmethod.replace(/\s/g, "");
			if((shipmethod==null)||(shipmethod==''))
			{
				shipmethod="";
			}
			
			log.debug('location ',locationId);
			var shipaddressee="";var shipaddr1="";var shipaddr2="";var shipcity="";var shipcountry="";var shipstate="";var shipzip="";var shipstateandcountry="";
			shipaddressee=salesorderdetails.getValue({fieldId:'shipaddressee'});
			if(shipaddressee!=null && shipaddressee!='')
			{
				shipaddr1=salesorderdetails.getValue({fieldId:'shipaddr1'});
				shipaddr2=salesorderdetails.getValue({fieldId:'shipaddr2'});
				shipcity=salesorderdetails.getValue({fieldId:'shipcity'});
				shipcountry=salesorderdetails.getValue({fieldId:'shipcountry'});
				shipstate=salesorderdetails.getValue({fieldId:'shipstate'});
				shipzip=salesorderdetails.getValue({fieldId:'shipzip'});
			}
			if((shipaddressee==null)||(shipaddressee==''))
			{
				shipaddressee=shipaddress;
			}
			if((shipaddr1==null)||(shipaddr1==''))
			{
				shipaddr1="";
			}
			if((shipaddr2==null)||(shipaddr2==''))
			{
				shipaddr2="";
			}
			if((shipcity==null)||(shipcity==''))
			{
				shipcity="";
			}
			if((shipcountry==null)||(shipcountry==''))
			{
				shipcountry="";
			}
			if((shipstate==null)||(shipstate==''))
			{
				shipstate="";
			}
			if((shipzip==null)||(shipzip==''))
			{
				shipzip="";
			}
			if(shipaddressee!=null && shipaddressee!='')
			{
				shipaddr1=shipaddr1+", "+shipaddr2;
				shipstateandcountry=shipcity+" "+shipstate+" "+shipzip;
			}


			var imageurl;

			var filefound = getLoadFile('LOGOCOMP.jpg',context,file,runtime); 
			if (filefound) 
			{ 


				imageurl = filefound['url'];


				log.debug('imageurl',imageurl);
				imageurl=imageurl.replace(/&/g,"&amp;");

			}
			var domainName='NS WMS'; // = fndomainName();
			log.debug('domainName ',domainName);
			var getPackIfresults = search.load({
				id:'customsearch_wms_packlistord'
			});
			getPackIfresults.filters.push(
					search.createFilter({
						name:'createdfrom',
						join:'transaction',
						operator:search.Operator.IS,
						values:vOrdNo
					})
			);
			getPackIfresults.filters.push(
					search.createFilter({
						name:'custrecord_wmsse_packing_container',
						join:'inventoryDetailLines',
						operator:search.Operator.IS,
						values:vcontainerLp
					})
			);
			var	 groupopentasksearchresults = utility.getSearchResultInJSON(getPackIfresults);
			
			var pickOrderResults  = packUtility.getNonInvItemPackingOrders(objPackDetails);
			for(var pickOrder in pickOrderResults){
				groupopentasksearchresults.push(pickOrderResults[pickOrder]);
			}

			var itemwithSubItemObj=packUtility.getKititemForComponents(vOrdNo);
			 
			if(groupopentasksearchresults!=null && groupopentasksearchresults!='' && groupopentasksearchresults.length>0)
			{           
				log.debug('groupopentasksearchresults.length ',groupopentasksearchresults.length);
				if(locationId==null || locationId=='')
				{
					locationId = groupopentasksearchresults[0]['location'];

				}
				// to get the Location address
				var locationadress = record.load({type:'location',
					id:locationId
				});

				var addr1="";var city="";var state="";var zip=""; var stateandzip=""; var returnadresse="";
				log.debug('locationId ',locationId);
				if(locationId!=null && locationId!='')
				{
					addr1=locationadress.getValue({fieldId:'addr1'});
					city=locationadress.getValue({fieldId:'city'});
					state=locationadress.getValue({fieldId:'state'});
					zip=locationadress.getValue({fieldId:'zip'});
					returnadresse=locationadress.getValue({fieldId:'addressee'});
					if(returnadresse==null || returnadresse=='')
						returnadresse=groupopentasksearchresults[0]['locationText'];

				}
				if((addr1==null)||(addr1==''))
				{
					addr1="";
				}
				if((city==null)||(city==''))
				{
					city="";
				}
				if((state==null)||(state==''))
				{
					state="";
				}
				if((zip==null)||(zip==''))
				{
					zip="";
				}
				if((returnadresse==null)||(returnadresse==''))
				{
					returnadresse="";
				}
				stateandzip=city+" "+state+" "+zip;
				
				var grouplength=0;					
				
				var totalcount=groupopentasksearchresults.length;
				
				var vorderqty="";
				var strVar="";
				var lineitemcount=0;
				var iteminternalid;
				var itemlineno;
				var pagebreakcount;
				while(0<totalcount)
				{
					var count=0;
					var kititemcount=0;
					var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n<head><macrolist><macro id='myfooter'><p align='center'>Page <pagenumber/> of <totalpages/></p></macro></macrolist></head><body  font-size=\"7\"  size=\"A4-landscape\"    padding-top=\" 0mm\"   footer='myfooter' footer-height='20mm'>\n";


					strVar += "    <table width='100%'>";
					strVar += "    <tr width='100%'>";
					strVar += "    <td >";
					strVar += "    <table>";
					strVar += "    <tr>";
					strVar += " <td align=\"left\" style=\"width: 100%;\" >";
					strVar += "        <table style=\"width: 100%\">";
					strVar += "            <tr>";
					strVar += "                <td>";
					strVar += "                    <img src='" + imageurl + "'></img>";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td >";
					strVar += "                 <b>" + domainName + "</b>";
					strVar += "<br \/>" +returnadresse+" <br \/>" +addr1+" <br \/>" +stateandzip+"" ; 
					strVar += "                </td>";
					strVar += "            </tr>"; 
					strVar += "        </table>";
					strVar += "        </td>";
					strVar += " <td></td>";
					strVar += "    <td></td>";
					strVar += "<td  align=\"right\" style=\"width: 100%;\" >";
					strVar += "        <b>";
					strVar += "            <h2 align='right'>";
					strVar += "                Packing Slip</h2>";
					strVar += "        </b>";
					strVar += "        <table style=\"width: 100%;\" frame=\"box\" rules=\"all\" align=\"right\" border=\"0\" cellpadding=\"0.5\"";
					strVar += "            cellspacing=\"0\">";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 14px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                    Order Date";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                    border-bottom: 1px solid black; \">";
					strVar += "                                                                          "+orderdate+"";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "        </td>";
					strVar += "   </tr>";
					strVar += "</table>";
					strVar += "    </td>";
					strVar += "   </tr>";
					strVar += "   <tr>";
					strVar += "<td align=\"left\" style=\"width: 100%;\">";  
					strVar += "        <table style=\"width: 100%\">";
					strVar += "            <tr>";
					strVar += "                <td>";
					strVar += "                    <table style=\"width: 55%;\" rules=\"all\" align=\"left\" border=\"0\" frame=\"box\">";
					strVar += "                        <tr>";
					strVar += "                <td style=\"font-size: 14px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                               &nbsp; Ship To";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; \" valign=\"top\">";
					strVar += "                                <table>";
					strVar += "                                    <tr>";
					strVar += "                                        <td >";
					strVar += "                                                                                                                                                "+shipaddressee+"";
					strVar += "                                        </td>";
					strVar += "                                    </tr>";
					strVar += "                                    <tr>";
					strVar += "                                        <td >";
					strVar += "                                                                                                                                                                          "+shipaddr1+"";
					strVar += "                                        </td>";
					strVar += "                                    </tr>";
					strVar += "                                    <tr>";
					strVar += "                                        <td >";
					strVar += "                                                                                                                                                        "+shipstateandcountry+"";
					strVar += "                                        </td>";
					strVar += "                                    </tr>";
					strVar += "                                </table>";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                    </table>";
					strVar += "                </td>";
					strVar += "            </tr>";
					//strVar += "            <br />";
					strVar += "            <tr>";
					strVar += "                <td>";
					strVar += "                    <table style=\"width: 100%;\" rules=\"all\" border=\"0\" frame=\"box\" cellpadding=\"0.5\"";
					strVar += "                        cellspacing=\"0\">";
					strVar += "                        <tr>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Ship Date";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                 Ship Via";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                              PO #";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                               Order #";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                               Container #";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; \">";
					strVar += "                                                                                                                          &nbsp;"+shipDate+"";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                \">";
					strVar += "                                                                                                                          &nbsp;"+shipmethod+"";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                               \">";
					strVar += "                                                                                                                          &nbsp;"+customerpo+"";
					strVar += "                            </td>";					
					strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                \">";
					strVar += " <barcode codetype=\"code128\" showtext=\"true\" value=\"";
					strVar += " "+ordernumber+"";
					strVar += "\"/>";

					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                \">";

					strVar += " "+vcontainerLp+"";					

					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                    </table>";
					strVar += "                    <table style=\"width: 100%;\" rules=\"all\" border=\"0\" frame=\"box\" cellpadding=\"0.5\"";
					strVar += "                        cellspacing=\"0\">";
					strVar += "                        <tr>";
					strVar += "                <td style=\"font-size: 14px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px  solid black;\">";
					strVar += "                               &nbsp; Shipping Notes";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px  solid black; \">";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                    </table>";
					strVar += "                    <table style=\"width: 100%;\" rules=\"all\" border=\"0\" frame=\"box\" cellpadding=\"0.5\"";
					strVar += "                        cellspacing=\"0\">";
					strVar += "                        <tr>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Item #";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Sub Item Of";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                               &nbsp; Description";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Ordered";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Units";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Back Order";
					strVar += "                            </td>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                                Shipped";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					// loop starts
					
					for(var g=grouplength; g<groupopentasksearchresults.length;g++)
					{
						count++;
						grouplength++;
						var itemText = groupopentasksearchresults[g]['itemText'];	
						var ifInternalid = groupopentasksearchresults[g]['internalid'];	
						var ItemId= groupopentasksearchresults [g]['item'];
						var lineno = groupopentasksearchresults[g]['line'];
						var totalactqty = groupopentasksearchresults[g]['packedquantity'];
						var totalqty = groupopentasksearchresults[g]['quantity'];						
						var units = groupopentasksearchresults[g]['unit'];
						var unitsText = groupopentasksearchresults[g]['unitText'];		
						var parentskuitemid = groupopentasksearchresults[g]['item'];
						
						unitType='';
						var itemDetails = search.lookupFields({
							type: 'item',
							id: ItemId,
							columns: ['unitstype','salesdescription']
						});
						if(utility.isValueValid(itemDetails['unitstype'][0])){
							unitType = itemDetails['unitstype'][0].value;
							
						}
						var salesdesc=itemDetails.salesdescription;
						
						if(utility.isValueValid(units))
						{
							var convRate  = utility.getConversionRate(unitsText,unitType);
							totalactqty=totalactqty/convRate;
						}
						var unitvalue = '';
						var backordervalue;
						var decscription='';
						if((parentskuitemid==null)||(parentskuitemid==''))
						{
							parentskuitemid=ItemId;
						}
						var parentitemSubtype = search.lookupFields({
							type: search.Type.ITEM,
							id: parentskuitemid,
							columns: ['type']
						});
						var parentitemtype=parentitemSubtype.type[0].value;
						var itemsubtype = search.lookupFields({
							type: search.Type.ITEM,
							id: ItemId,
							columns: ['type']
						});
						var itemtype=itemsubtype.type[0].value;
						var subItemName = itemwithSubItemObj[ifInternalid+'-'+lineno];
						if(!utility.isValueValid(subItemName))
						{
							subItemName='';
						}
						if(parentitemtype!="Kit")
						{
							if(trantype!='transferorder')
							{
								lineitemcount=salesorderdetails.getLineCount('item');
								log.debug('lineitemcount ',lineitemcount);
								for(var p=0;p<lineitemcount;p++)
								{
									iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									log.debug('itemlineno,lineno ',itemlineno+','+lineno);

									if(iteminternalid==ItemId)
									{
										vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										unitvalue= salesorderdetails.getSublistText({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
							else
							{
								lineitemcount=salesorderdetails.getLineCount('item');
								for(var p=0;p<lineitemcount;p++)
								{
									iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									if(iteminternalid==ItemId && lineno == itemlineno )
									{
										vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										unitvalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
						}
						else
						{						
							if(trantype!='transferorder')
							{
								lineitemcount=salesorderdetails.getLineCount('item');
								log.debug('lineitemcount ',lineitemcount);
								for(var p=0;p<lineitemcount;p++)
								{
									iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									log.debug('iteminternalid,parentskuitemid ',iteminternalid+','+ItemId);
									if(iteminternalid==parentskuitemid && lineno == itemlineno)
									{
										vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										unitvalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
							else
							{
								lineitemcount=salesorderdetails.getLineCount('item');
								for(var p=0;p<lineitemcount;p++)
								{
									iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									if(iteminternalid==ItemId && lineno == itemlineno )
									{
										vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										unitvalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}


						}

						if((decscription==null)||(decscription==''))
						{
							decscription=salesdesc;
						}
						if((backordervalue==null)||(backordervalue==''))
						{
							backordervalue="";
						}

						if((vorderqty==null)||(vorderqty==''))
						{
							vorderqty=totalqty;
						}

						if(parentitemtype=="Kit")
						{
							var parentskudesc = search.lookupFields({
								type: search.Type.ITEM,
								id: parentskuitemid,
								columns: ['displayname']
							});
							var parentdescription=parentskudesc.displayname[0].value;
							kititemcount++;
							strVar += "<tr>";
							strVar += "<td style=\"font-size: 14px;font-family:Times New Roman; text-align: center; border-right: 1px solid black; border-left: 1px solid black;";
							strVar += " border-bottom: none; \">";
							strVar += "                                                                                                                          "+itemText+"";
							strVar += "</td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: none; \">";
							strVar +=""+parentdescription+"";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: center; border-right: 1px solid black; border-bottom: none; \">";
							strVar += "                                           &nbsp;";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: center; border-right: 1px solid black; border-bottom: none; \">";
							strVar += "                                           &nbsp; ";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: center; border-right: 1px solid black; border-bottom: none; \">";
							strVar +=" &nbsp;";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: center; border-right: 1px solid black; border-bottom: none; \">";
							strVar += "   &nbsp;";
							strVar += "                            </td>";
							strVar += "                        </tr>";
						}
						if(itemtype!="Kit")
						{

							strVar += "                        <tr>";
							if(parentskuitemid==ItemId)
							{
								strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
								strVar += "                                border-bottom: none; \">";
								strVar += "                                                                                                                         &nbsp;"+itemText+"";
								strVar += "                            </td>";
							}
							else
							{
								strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
								strVar += "                                border-bottom: none; \">";
								strVar += "                                                                                                          &nbsp;"+itemText+"";
								strVar += "                            </td>";
							}
							strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
							strVar += "                                border-bottom: none; \">";
							strVar += "                                                                                                          &nbsp;"+subItemName+"";
							strVar += "                            </td>";
							if(parentskuitemid==ItemId)
							{
								strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: none; \">";
								strVar +="&nbsp;"+decscription+"";
								strVar += "                            </td>";
							}
							else
							{
								strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: none; \">";
								strVar +="&nbsp"+decscription+"";
								strVar += "                            </td>";
							}

							strVar += "                            <td style=\"font-size: 10px; text-align: right; border-right: 1px solid black; border-bottom: none; \">";
							strVar += "                                            "+vorderqty+" &nbsp;";
							strVar += "                            </td>";

							strVar += "                            <td style=\"font-size: 10px; text-align: left; border-right: 1px solid black; border-bottom: none; \">";
							strVar += "    &nbsp;                 "+unitvalue+" &nbsp;";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: right; border-right: 1px solid black; border-bottom: none; \">";
							strVar +=" &nbsp;"+backordervalue+" &nbsp;";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 10px; text-align: right; border-right: 1px solid black; border-bottom: none; \">";
							strVar += "                                            "+totalactqty+" &nbsp;";
							strVar += "                            </td>";
							strVar += "                        </tr>";
						}
						pagebreakcount=parseInt(count)+parseInt(kititemcount);
						if(pagebreakcount==10)
						{
							break;
						}	
					}

					var Height='';
//					if(pagecount==1)
//					{
//					Height='230px';
//					}
//					if(pagecount>1)
//					{
//					Height='420px';
//					}
					var recordCount=pagebreakcount;
					Height=parseInt(Height)-parseInt((recordCount*20));
					strVar += "                                    <tr>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                            border-bottom: 1px solid black; height: "+Height+";\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                           \">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                           \">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            \">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            \">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            \">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            \">";
					strVar += "                                        </td>";    
					strVar += "                                    </tr>";
					// End of for Not Having lines
					strVar += "  </table>";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += " </td>";
					strVar += "    </tr>";                      
					strVar += " <tr>";
					strVar += "    <td>";
					strVar += "    <br \/>";
					strVar += "    -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------";
					strVar += "    <br \/>";
					strVar += "    <br \/>    ";
					strVar += "    </td>";
					strVar += "    </tr>";
					strVar += "  <tr>";
					strVar += "   <td>";
					strVar += "        <table style=\"width: 45%;\" align=\"left\">";
					strVar += "<tr>";
					strVar += "            <td style=\"font-size: 15px;\">";
					strVar += "               <br \/>";
					strVar += "            </td>";
					strVar += "        </tr>";
					strVar += " <tr>";
					strVar += "                <td style=\"font-size: 12px; \">";
					strVar += "                <b>Ship Returns To<\/b>";
					strVar += "            </td>";
					strVar += "        </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 12px; \">";
					strVar +=""+returnadresse+" <br /> "+addr1+" <br /> "+stateandzip+" ";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "        <table style=\"width: 55%;\" align=\"right\">";                                   
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 10px; \">";
					strVar += "                <b>Customer Return From </b>";
					strVar += "                </td>";
					strVar += "                <td >";                                           
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 10px; \">";
					strVar += "                    <b>Customer </b>";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 10px;\">";
					strVar += "                                                                                                                                                                          "+entity+"";
					strVar += "                </td>";
					strVar += "            </tr>";

					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 10px; \">";
					strVar += "                    <b>Order  </b>";
					strVar += "                </td>";

					strVar += "                <td style=\"font-size: 10px;\">";
					strVar += " <barcode codetype=\"code128\" showtext=\"true\" value=\"";
					strVar += " "+ordernumber+"";
					strVar += "\"/>";

					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 10px; \">";
					strVar += "                    <b>R.A. # </b>";
					strVar += "                </td>";
					strVar += "                <td>";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";

					strVar += " </td>";
					strVar += "     </tr>";
					strVar += " <tr>";
					strVar += "     <td>";
					strVar += "        <table style=\"width: 100%;\" frame=\"box\" rules=\"all\" align=\"right\" border=\"0\" cellpadding=\"0.5\"";
					strVar += "            cellspacing=\"0\">";
					strVar += "            <tr style=\"background-color: Gray;\">";
					strVar += "                <td style=\"font-size: 15px; text-align: left; color: white; border-top: 1px solid black;";
					strVar += "                    border-right: 1px solid black; border-left: 1px solid black; border-bottom: 1px solid black; \">";
					strVar += "                    &nbsp; Item";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 15px; text-align: left; color: white; border-top: 1px solid black;";
					strVar += "                    border-right: 1px solid black; border-bottom: 1px solid black; \">";
					strVar += "                    &nbsp; Quantity";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 15px; text-align: left; color: white; border-top: 1px solid black;";
					strVar += "                    border-right: 1px solid black; border-bottom: 1px solid black; \">";
					strVar += "                   &nbsp; Reason For Returning";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 16px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;\"";
					strVar += "                    height=\"20px\">";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 16px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;\"";
					strVar += "                    height=\"20px\">";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 16px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;\"";
					strVar += "                    height=\"20px\">";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "</td>";
					strVar += "    </tr>";
					strVar += "        </table>";
					if(grouplength==groupopentasksearchresults.length)
					{
						strVar +="<p style=\" page-break-after:avoid\"></p>";
					}
					else
					{
						strVar +="<p style=\" page-break-after:always\"></p>";
					}



					strVar =strVar+ "</body></pdf>";
					xml=xml +strVar;


					totalcount=parseInt(totalcount)-parseInt(count);	

					log.debug('xml',xml);						

					var renderer = render.create();
					renderer.templateContent = xml;


					var newfile = renderer.renderAsPdf();
					response.writeFile(newfile, false);


				}

			}
		}
		catch(exp) {

			log.debug('Exception in CreatePacklistHtml ',exp);

		}



	}


	return {
		onRequest: onRequest
	};
		});