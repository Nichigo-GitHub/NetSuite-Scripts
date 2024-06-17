/***************************************************************************
 *    Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************//***************************************************************************
 * @NApiVersion 2.x
 * @NModuleScope Public
 *//****************************************************************************/
define(['N/search','N/record','./wms_utility','N/format','N/query'],
		function (search,record,utility,format,query) {


	function _generateBartenderItemLabel(newRecord)
	{
		try
		{
			var itemId= newRecord.getValue({fieldId:'custrecord_wmsse_sku'});
			var itemName='';
			var customerPo=newRecord.getValue({fieldId:'name'});
			var checkinQty= newRecord.getValue({fieldId:'custrecord_wmsse_act_qty'});
			var barcodestring= newRecord.getValue({fieldId:'custrecord_wmsse_compositebarcode_string'});
			var recid = newRecord.getValue({fieldId:'id'});
			var lotNumber = newRecord.getValue({fieldId:'custrecord_wmsse_batch_num'});
			var lotExpiryDate = newRecord.getValue({fieldId:'custrecord_wmsse_expirydate'});
			var inbshipmentNO  =  newRecord.getValue({fieldId:'custrecord_wmsse_inbshipment'});
			var location=newRecord.getValue({fieldId:'custrecord_wmsse_wms_location'});
			var itemLookUp = search.lookupFields({
				type: search.Type.ITEM,
				id: itemId,
				columns: ['itemid', 'upccode','displayname']
			});
			var upcnumber ='';
			var itemDescription = '';
			if (itemLookUp.upccode != undefined) 
			{
				upcnumber = itemLookUp.upccode;
			}
			if (itemLookUp.displayname != undefined) 
			{
				itemDescription = itemLookUp.displayname;
			}
			if (itemLookUp.itemid != undefined) 
			{
				itemName = itemLookUp.itemid;
			}

			log.debug({title:'inbshipmentNO',details:inbshipmentNO});
			
			var counter = 0;
			if(utility.isValueValid(inbshipmentNO))
			{
				var   shipmentLineNo  =  newRecord.getValue({fieldId:'custrecord_wmsse_line_no'});
				var   poInternalId  =  newRecord.getValue({fieldId:'custrecord_wmsse_order_no'});
				var   shipmentId  =  newRecord.getValue({fieldId:'custrecord_wmsse_inbshipment'});
				if(utility.isValueValid(shipmentLineNo) && utility.isValueValid(poInternalId) && utility.isValueValid(shipmentId))
				{
				
					var lotResults = 	_getLotInfoFromSerialEntry(shipmentLineNo,poInternalId,shipmentId);
					log.debug({title:'lotResults',details:lotResults});
					for(counter = 0 ;counter < lotResults.length; counter++)
					{
						lotNumber = lotResults[counter].custrecord_wmsse_ser_no;
						lotExpiryDate = lotResults[counter].custrecord_wmsse_lot_expirydate;
						checkinQty = lotResults[counter].custrecord_wmsse_ser_qty;
						createExternalLabelRecord(customerPo,itemDescription,checkinQty,location,itemName,upcnumber,recid,lotNumber,lotExpiryDate,barcodestring);
					}
				}
				else
				{
					createExternalLabelRecord(customerPo,itemDescription,checkinQty,location,itemName,upcnumber,recid,lotNumber,lotExpiryDate,barcodestring);
				}

			}
			else
			{
				createExternalLabelRecord(customerPo,itemDescription,checkinQty,location,itemName,upcnumber,recid,lotNumber,lotExpiryDate,barcodestring);
			}
		}
		catch(ex)
		{
			log.debug({title:'Exception in GenerateBartenderItemLabel',details:ex});
		}

	}
	function createExternalLabelRecord(customerPo,itemDescription,quantity,location,itemName,upcnumber,recid,lotNumber,lotExpiryDate,barcodestring)
	{
		var ExternalLabelRecord = record.create({type:'customrecord_wmsse_ext_labelprinting'});
		ExternalLabelRecord.setValue({fieldId:'name',value:customerPo});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_reference1',value:customerPo});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_itemdesc', value:itemDescription});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_qty',value:quantity});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_ext_location',value:location});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_external_item',value: itemName});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_reference5',value: upcnumber});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_labeltype',value: "ITEMLABEL"});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_ext_template',value: "ITEMLABEL"});
		ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_ext_opentaskid',value: recid});
		if(utility.isValueValid(lotNumber))
		{
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_lotnumber',value: lotNumber});
		}
		if(utility.isValueValid(lotExpiryDate))
		{
			var parsedExpiryDate = format.parse({
				value: lotExpiryDate,
				type: format.Type.DATE
			});
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_lotexpirydate',value: parsedExpiryDate});
		}
		if(utility.isValueValid(barcodestring))
		{
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_external_barcode_string',value: barcodestring});
		}
		  ExternalLabelRecord.save();
	}
	function _getLotInfoFromSerialEntry(shipmentLineNo,poInternalId,shipmentId)
	{
		
			var serialSearch = search.load({
				id: 'customsearch_wmsse_serialdetails_search',
			});
			var serailFilters = serialSearch.filters;
			serailFilters.push(search.createFilter({
				name:'custrecord_wmsse_ser_ordline',
				operator: search.Operator.EQUALTO,
				values : shipmentLineNo
			}));
			serailFilters.push(search.createFilter({
				name:'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values : poInternalId
			}));
			serailFilters.push(search.createFilter({
				name:'custrecord_wmsse_inb_shipment',
				operator: search.Operator.ANYOF,
				values : shipmentId
			}));
			serialSearch.columns.push(search.createColumn({ name: 'custrecord_wmsse_ser_qty'}));
			serialSearch.columns.push(search.createColumn({ name: 'custrecord_wmsse_lot_expirydate'}));
			serialSearch.columns.push(search.createColumn({ name: 'custrecord_wmsse_ser_no'}));
			serialSearch.filters = serailFilters;
			return utility.getSearchResultInJSON(serialSearch);
		
	}
	function _generateItemLabel(ponumber,itemId,whLocation, opentaskid)
	{
		try
		{   var labeltype="ITEMLABEL";
			var ItemLabel= this.getSELabelTemplate("",labeltype);
			log.debug('in item label ',ItemLabel);
			var skuname="";
			var skudesc="";
			var itemSearchResult = getItemSearchResults(itemId);
			if(itemSearchResult !=null && itemSearchResult.length>0){
				skudesc=itemSearchResult[0].description;
				skuname=itemSearchResult[0].itemid;
			}
		
			if(ItemLabel!=null && ItemLabel!="")
			{ 
				var print=false;
				var reprint=false;
				var refno="";
				var printername="";	
				if((skudesc!=null)&&(skudesc!=""))
				{
					ItemLabel=ItemLabel.replace(/parameter21/,skudesc);
				}
				else
				{
					ItemLabel=ItemLabel.replace(/parameter21/,'');
				}
				if((skuname!=null)&&(skuname!=""))
				{
					ItemLabel=ItemLabel.replace(/parameter25/g,skuname);
				}
				else
				{
					ItemLabel=ItemLabel.replace(/parameter25/g,'');
				}
				
				_createLabelData(ItemLabel,labeltype,refno,print,reprint,"",ponumber,skuname,"",printername,"",whLocation, opentaskid);
			}

		}
		catch(ex)
		{
			log.debug({title:'Exception in GenerateItemLabel',details:ex});
		}
	}
	function _generatePalletLabel(ponumber,itemId,itemqty,username,whLocation,barcodestring, opentaskid)
	{
		try
		{
			var labeltype="PALLETLABEL";
			//if barcode is scanned in receiving process,use barcode template
			if(utility.isValueValid(barcodestring))
				labeltype="COMPOSITEPALLETLABEL";

			var palletlabel= this.getSELabelTemplate("",labeltype);
			if(palletlabel!=null && palletlabel!="")
			{
				//Initializing labeltype= "PALLETLABEL" back, becuase this labeltype is updating in Refno field in label printing.
				labeltype="PALLETLABEL";
				var skuname="";
				var skudesc="";
				var print=false;
				var reprint=false;
				var refno="";
				var printername="";	
				var recevieddate=utility.DateStamp();
				recevieddate = format.parse({
					value: recevieddate,
					type: format.Type.DATE
				});
				recevieddate = format.format({
					value: recevieddate,
					type: format.Type.DATE
				});
				var itemSearchResult = getItemSearchResults(itemId);
				if(itemSearchResult.length > 0)
				{
					skudesc=itemSearchResult[0].description;
					skuname=itemSearchResult[0].itemid;
				}
				
				if((skudesc!=null)&&(skudesc!=""))
				{
					palletlabel=palletlabel.replace(/parameter21/,skudesc);
				}
				else
				{
					palletlabel=palletlabel.replace(/parameter21/,'');
				}
				if((ponumber!=null)&&(ponumber!=""))
				{
					palletlabel=palletlabel.replace(/parameter22/,ponumber);
				}
				else
				{
					palletlabel=palletlabel.replace(/parameter22/,'');
				}
				if((username!=null)&&(username!=""))
				{
					palletlabel=palletlabel.replace(/parameter23/,username);
				}
				else
				{
					palletlabel=palletlabel.replace(/parameter23/,'');
				}

				if((recevieddate!=null)&&(recevieddate!=""))
				{
					palletlabel=palletlabel.replace(/parameter24/,recevieddate);
				}
				else
				{
					palletlabel=palletlabel.replace(/parameter24/,recevieddate);
				}
				if((skuname!=null)&&(skuname!=""))
				{
					palletlabel=palletlabel.replace(/parameter25/g,skuname);
				}
				else
				{
					palletlabel=palletlabel.replace(/parameter25/g,'');
				}

				if((itemqty!=null)&&(itemqty!=""))
				{
					palletlabel=palletlabel.replace(/parameter26/,itemqty);
				}
				else
				{
					palletlabel=palletlabel.replace(/parameter26/,'');
				}
				log.debug({title:'barcodestring',details:barcodestring});
				// if composite barcode scanned in receiving process, need to show the composite barcode in PALLET label
				if(utility.isValueValid(barcodestring))
				{
					var barcodestringtext = removepaddingcharfrombarcodestring(barcodestring);		
					if(utility.isValueValid(barcodestringtext))
					{
						palletlabel=palletlabel.replace(/parameter27/,barcodestringtext[0]);
						palletlabel=palletlabel.replace(/parameter28/,barcodestringtext[1]);
					}
				}
					
				_createLabelData(palletlabel,labeltype,refno,print,reprint,"",ponumber,skuname,"",printername,"",whLocation, opentaskid);
			}
		}
		catch(ex)
		{
			log.debug({title:'Exception in GeneratePalletLabel',details:ex});
		}
	}


	function _createLabelData(labeldata,labeltype,refno,print,reprint,company,salesorder,skuname,labelcount,printername,containerLpShip,location, opentaskid)
	{
		try
		{
			var labelrecord = record.create({type:'customrecord_wmsse_labelprinting'}); 
			labelrecord.setValue({fieldId:'name',value: salesorder}); 
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_data',value:labeldata});  
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_refno',value:labeltype});     

			labelrecord.setValue({fieldId:'custrecord_wmsse_label_type',value:"ZEBRALABEL"});                                                                                                                                                                     
			labelrecord.setValue({fieldId:'custrecord_wmse_label_print',value: print});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_reprint',value: reprint});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_lp', value:containerLpShip});

			labelrecord.setValue({fieldId:'custrecord_wmsse_label_printername',value: printername});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_location',value: location});

			if(utility.isValueValid(opentaskid)){
				labelrecord.setValue('custrecord_wmsse_label_opentaskid', opentaskid); //open task id addition.
			}

           labelrecord.save();
		}
		catch(ex)
		{
			log.debug({title:'Exception in CreateLabelData',details:ex});
		}
	}
	function getSELabelTemplate(shiptocompanyid,labeltype)
	{
		var label="";
		var labelTemplateSearch = query.create({
				type: 'customrecord_wmsse_label_template'
			});
		var labelTemplateSearchFilter = labelTemplateSearch.createCondition({
				fieldId: 'name',
				operator: query.Operator.IS,
				values: labeltype
			});

			labelTemplateSearch.columns = [
				labelTemplateSearch.createColumn({
					fieldId: 'custrecord_wmsse_labeltemplate_data',
					alias: 'custrecord_wmsse_labeltemplate_data'
				})
				];
	     if((shiptocompanyid!=null)&&(shiptocompanyid!=""))
		   {
		   	var labelCustomerFilter = labelTemplateSearch.createCondition({
				fieldId: 'custrecord_wmsse_labeltemplate_name',
				operator: query.Operator.ANY_OF,
				values: shiptocompanyid
			});

		   	labelTemplateSearch.condition = labelTemplateSearch.and(labelTemplateSearchFilter,labelCustomerFilter);
		   }
		   else
		   {
            labelTemplateSearch.condition = labelTemplateSearch.and(labelTemplateSearchFilter);
		   }
		    var labelTemplateSearchResult = labelTemplateSearch.run().asMappedResults();
			log.debug('labelTemplateSearchResult',labelTemplateSearchResult);
			if(labelTemplateSearchResult !=null && labelTemplateSearchResult.length>0){
				label=labelTemplateSearchResult[0].custrecord_wmsse_labeltemplate_data;
			}

		return label;
	}
	function removepaddingcharfrombarcodestring(barcodestring) 
	{   var barcodestringarray=[];
		try
		{
			var paddingchar="";
			var barcodetext="";
			var barcodetextwithpadding="";
			var vfilters=[];

			vfilters.push(    
					search.createFilter({
						name:'custrecord_wmsse_barcode_string',					
						operator:search.Operator.IS,
						values:barcodestring
					})
			);
			var barcodepaddingcharSearch= search.load({id:'customsearch_wmsse_barcode_string',filters: vfilters});
			var barcodepaddingchardetails = utility.getSearchResultInJSON(barcodepaddingcharSearch);
			log.debug({title:'barcodepaddingchardetails', details:barcodepaddingchardetails});
			if(barcodepaddingchardetails.length>0)
			{
				paddingchar = barcodepaddingchardetails[0].custrecord_wms_barcode_paddingcharacterText;
			}

			if(paddingchar!=null && paddingchar!='')
				barcodetext = replaceAll(barcodestring,paddingchar,'');
			barcodetext=barcodetext.trim();
			barcodestringarray[0] = barcodetext;
			if(paddingchar!=null && paddingchar!='')
			{
				//need to replace padding characters with hexadecimal,
				//for barcode generation some of the characters(example:^,~) used as a commands in ZPL.
				//in ZPL the default hexadecimal indiactor is '_'(underscore),so added extra char('_') to replace.
				var paddingcharhexacode =ascii_to_hexa(paddingchar);
				barcodetextwithpadding = replaceAll(barcodestring,paddingchar,'_'+paddingcharhexacode);
				barcodestringarray[1] = barcodetextwithpadding;
			}
		}
		catch(e)
		{
			log.debug({title:'Exception in removePaddingCharfrombarcodestring', details:e});
		}
		return barcodestringarray;
	}
	function replaceAll(originalstring, charactertoreplace, replacementcharacter) 
	{
		return originalstring.replace(new RegExp(escapeRegExp(charactertoreplace), 'g'), replacementcharacter);
	}

	function escapeRegExp(string)
	{
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	/**
	 * To covert the string to hexa decimal value
	 * @parameter :string
	 * @return : hexa decimal 
	 * 
	 */
	function ascii_to_hexa(str)
	{
		var arr1 = [];
		for (var n = 0, l = str.length; n < l; n ++) 
		{
			var hex = Number(str.charCodeAt(n)).toString(16);
			arr1.push(hex);
		}
		return arr1.join('');
	}
		function getItemSearchResults(itemId){
		var itemSearchResult =[];
		var itemSearch = query.create({
				type: 'item'
			});
			var itemSearchFilter = itemSearch.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: itemId
			});
			itemSearch.columns = [
				itemSearch.createColumn({
					fieldId: 'description',
					alias: 'description'
				}),
				itemSearch.createColumn({
					fieldId: 'itemid',
					alias: 'itemid'
				})
				];
			itemSearch.condition = itemSearch.and(itemSearchFilter);
		    itemSearchResult = itemSearch.run().asMappedResults();
			log.debug('itemSearchResult',itemSearchResult);
			return itemSearchResult;

	}

	return {
		generateBartenderItemLabel:_generateBartenderItemLabel,
		generateItemLabel:_generateItemLabel,
		generatePalletLabel:_generatePalletLabel,
		createLabelData:_createLabelData,
		getSELabelTemplate:getSELabelTemplate
	};
});