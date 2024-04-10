/**
 *     Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record','N/runtime','./wms_utility','./wms_translator','N/format','N/search', './wms_labelPrinting_utility'],

		function (record,runtime,utility,translator, format, search, labelPrintUtility) {

	function doPost(requestBody) {
		var response = {};
		var debugString = '';
		var randomTallyScanRule='F';
		var itemAliasObject ={};
		var transactionLineNo ='';
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				log.debug('Request Params :', requestParams);

				var item 			= requestParams.item;
				var quantity 		= requestParams.quantity;
				var location 		= requestParams.location;
				var itemDesc 		= requestParams.itemDescription;
				var transactionType = requestParams.transactionType;
				var unitstype 		= requestParams.unitstype;
				var tranInternalId 	= requestParams.tranInternalId;
				var columnArray 	= [];
				var itemDetails 	= '';
				var itemFamily 		= '';
				var itemGroup 		= '';
				var itemType 		= '';
				var processType 	= requestParams.processType;
				var shipmentNumber 	= requestParams.shipmentNumber;
				var lotNumber 		= requestParams.lot;
				var lotExpiryDate 	= requestParams.lotExpiryDate;
				var serialNumber    = requestParams.serialNumber;
				var serialQuantity  = requestParams.serialQuantity;
				var gtin			= requestParams.gtin;
				var vendor			= requestParams.vendor;
				var barcodeQty      = requestParams.barcodeQuantity;
				var qtyUomSelection = requestParams.qtyUomSelection;
				var printQtyUom		= requestParams.printQtyUom;
				var barcodeSerialname = requestParams.barcodeSerialname;
        var cartonName      = requestParams.cartonName;
				var transactionName = requestParams.transactionName;
				var itemAliasText = requestParams.itemAliasText;
				var isMultipleItemAliasFlag = requestParams.isItemAliasPopupRequired;
				var scannedItemAliasForPrint = requestParams.scannedItemAliasForPrint;
				 itemAliasObject =requestParams.itemAliasObject;
				 randomTallyScanRule =requestParams.randomTallyScan;
				transactionLineNo =requestParams.transactionLineNo;
				var customFieldsObj = {};
				if(!utility.isValueValid(isMultipleItemAliasFlag))
				{
					isMultipleItemAliasFlag =false;
				}
				if(!utility.isValueValid(randomTallyScanRule)){
					randomTallyScanRule = 'F';
				}
				if(randomTallyScanRule =='T')
				{
					var key = item + '_' + transactionLineNo;
					log.debug('key :', key);
					log.debug('itemAliasObject :', itemAliasObject);
					if(utility.isValueValid(itemAliasObject) && utility.isValueValid(itemAliasObject[key])){
						isMultipleItemAliasFlag = true;
						itemAliasText = itemAliasObject[key]["selectedItemAlias"];
						quantity =itemAliasObject[key]["quantity"];
					}
				}
				var recevieddate=utility.DateStamp();
				var parsedBeginDate = format.parse({
					value: recevieddate,
					type: format.Type.DATE
				});

				if(utility.isValueValid(tranInternalId)){
					// search to get transaction details.
					var tranSearch = search.load({id:'customsearch_wms_auto_print_tran_dtl'});
					var tranSearchFilters = tranSearch.filters;

					tranSearchFilters.push(search.createFilter({
						name:'internalid',
						operator:search.Operator.ANYOF,
						values:tranInternalId}));

					if(utility.isValueValid(location)){
						tranSearchFilters.push(search.createFilter({
							name:'location',
							operator:search.Operator.ANYOF,
							values:['@NONE@',location]}));
					}
					tranSearch.filters = tranSearchFilters;
					var tranDetails =  utility.getSearchResultInJSON(tranSearch);

					if(utility.isValueValid(tranDetails) && tranDetails.length > 0){
						transactionType = tranDetails[0].typeText;
					}					

				}
				if(utility.isValueValid(item)){
					//Extracting Item Group and Item Family
					columnArray.push('itemprocessfamily');
					columnArray.push('itemprocessgroup');
					columnArray.push('description');
					columnArray.push('recordtype');

					itemDetails = search.lookupFields({
						type: search.Type.ITEM,
						id: item,
						columns:columnArray
					});

					if(utility.isValueValid(itemDetails)){
						if(utility.isValueValid(itemDetails.itemprocessfamily) && ((itemDetails.itemprocessfamily).length)>0){
							itemFamily = itemDetails.itemprocessfamily[0].value;                    
						}

						if(utility.isValueValid(itemDetails.itemprocessgroup) && ((itemDetails.itemprocessgroup).length)>0){
							itemGroup = itemDetails.itemprocessgroup[0].value;              
						}

						if(utility.isValueValid(itemDetails.description) && !(utility.isValueValid(itemDesc))){
							itemDesc = itemDetails.description;
						}
						if(utility.isValueValid(itemDetails.recordtype)){
							itemType  = itemDetails.recordtype;

							if(itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"){
								lotNumber ='';
								lotExpiryDate='';
							}
						}
					}
				}

				var autoprintRulEvltnRec = record.create({type : 'customrecord_wms_rule_evaluatn_autoprint'});

				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_user', 	 	value : runtime.getCurrentUser().id});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item', 	 	value : item});  
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_tran_date', 	value : parsedBeginDate});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_qty', 	value : quantity});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_ext_location', value : location});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_desc', 	value : itemDesc});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_uom', 			value : unitstype});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_family', 	value : itemFamily});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_group', 	value : itemGroup});
				autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_lot_num', 		value : lotNumber}); //lot number addition

				if(utility.isValueValid(lotExpiryDate)){
					var lotDate = format.parse({
						value: lotExpiryDate,
						type: format.Type.DATE
					});

					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_lot_exp_date', value : lotDate}); //lot expiry date addition
				}
				if(utility.isValueValid(serialNumber)){
					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_serial_number', value : serialNumber});
					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_qty', 	value : serialQuantity});
					quantity = 	serialQuantity;
				}

				if(utility.isValueValid(processType) && processType=='inboundShipment')
				{
					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_inbshipment', value : shipmentNumber});
					autoprintRulEvltnRec.setValue({fieldId : 'name', value : shipmentNumber});
				}
				if(utility.isValueValid(processType) && processType=='picking')
				{
					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_cartonname', value : cartonName});
					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_notes', value : transactionName});
				}

				if(utility.isValueValid(tranInternalId)){
					autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_tran_num', value : tranInternalId});
				}

				if(utility.isValueValid(transactionType)){
					autoprintRulEvltnRec.setText({fieldId : 'custrecord_wms_tran_type', text : transactionType});
				}
				
				//Processing Custom Fields
				processCustomFields(requestBody , autoprintRulEvltnRec,customFieldsObj);
				

				if(utility.isValueValid(printQtyUom)){
					barcodeQty = printQtyUom;
				}
				else if(utility.isValueValid(barcodeQty)){
					printQtyUom = barcodeQty;
				}
				else if(utility.isValueValid(unitstype)){
					printQtyUom = [{'unit':unitstype}];
				}
				var isGS1Enabled ='';
				// no need to check advance barcode system rule for search inventory,so assigning flag value as false
				if(utility.isValueValid(processType) && processType == 'searchInventory')
				{
					isGS1Enabled = false;
				}else {
					//GS1 Barcode String population changes.
					isGS1Enabled = labelPrintUtility.checkGS1Enable(location);
				}
				log.debug('isGS1Enabled :', isGS1Enabled);

				if(utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true)
				{
					var isGS1StringGenRequired = false;
					if(!utility.isValueValid(gtin))
					{
						if(utility.isValueValid(barcodeQty) && (utility.isValueValid(barcodeQty[0].unit)))
						{
							unitstype = barcodeQty[0].unit;
						}
						if(utility.isValueValid(scannedItemAliasForPrint))
						{
							gtin = scannedItemAliasForPrint;
							isGS1StringGenRequired = true;
						}
						else if(isMultipleItemAliasFlag && utility.isValueValid(itemAliasText))
						{
							gtin = itemAliasText;
							isGS1StringGenRequired = true;
						}
						else {

						var itemAliasResults = labelPrintUtility.getGTINValFromItemAlias(item, unitstype, vendor);

						if(utility.isValueValid(itemAliasResults) && utility.isValueValid(itemAliasResults.aliasName) && !utility.isValueValid(itemAliasResults.errorMessage))
						{
							gtin = itemAliasResults.aliasName;
							isGS1StringGenRequired = true;							

						}else if(utility.isValueValid(itemAliasResults.allowDataMatrixLabel) && itemAliasResults.allowDataMatrixLabel==true){
							isGS1StringGenRequired = false;
						}else{
							response.errorMessage = itemAliasResults.errorMessage;
							response.isValid 	  = false;
							return response;		
							}
						}
					}
					else if(utility.isValueValid(gtin) && isNaN(gtin))
					{
						response.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.GTIN_NONNUMERIC');
						response.isValid	  = false;
						return response;
					}
					else if(utility.isValueValid(gtin) && labelPrintUtility.validateGTIN(gtin)== true)
					{
						isGS1StringGenRequired = true;
					}

					log.debug('isGS1Gen Required :', isGS1StringGenRequired);
					if(utility.isValueValid(isGS1StringGenRequired) && isGS1StringGenRequired == true)
					{
						var gs1String = '';
						var gs1StringObj = {};
						var gs1ResponseObj = {};

						gs1StringObj.gtin 			= gtin;
						gs1StringObj.quantity 		= quantity;
						gs1StringObj.lotNumber 		= lotNumber;
						gs1StringObj.lotExpiryDate 	= lotExpiryDate;
						gs1StringObj.serialNumber 	= serialNumber;
						gs1StringObj.customFields   = customFieldsObj;


						gs1ResponseObj = labelPrintUtility.generateGS1String(gs1StringObj);

						if(utility.isValueValid(gs1ResponseObj) && !utility.isValueValid(gs1ResponseObj.errorMessage))
						{
							gs1String = gs1ResponseObj.gs1String;
							autoprintRulEvltnRec.setValue({fieldId : 'custrecord_label_barcode_string', 	value : gs1String});
						}
						else if(utility.isValueValid(gs1ResponseObj.errorMessage))
						{
							response.errorMessage = gs1ResponseObj.errorMessage;
							response.isValid 	  = false;
							return response;
						}
					}
				}

				//Saving the Rule Evaluation Record.
				var recid = autoprintRulEvltnRec.save();

				if(utility.isValueValid(recid))
				{
					response.isValid 			  = true;
					response.id 				  = recid;
					response.quantityenteredPrint = [{'value':quantity}];

					if(utility.isValueValid(serialNumber)){
						response.serialNumberEntered = serialNumber;
                        response.enteredLotOrSerialNum = serialNumber;
					}else if(utility.isValueValid(barcodeSerialname)){
						response.serialNumberEntered = barcodeSerialname;
                        response.enteredLotOrSerialNum = barcodeSerialname;
					}

					if(utility.isValueValid(lotNumber)){
						response.enteredLot = lotNumber;
                        response.serialNumberEntered = lotNumber;
                        response.enteredLotOrSerialNum = lotNumber;
					}
					if(utility.isValueValid(lotExpiryDate)){
						response.enteredLotExpiryDate = lotExpiryDate;
					}
					if(utility.isValueValid(qtyUomSelection)){
						var qtyUomSelectedArr = [];

						for(var itr=0; itr<qtyUomSelection.length; itr++)
						{
							var qtyUomSelectedObj = {};

							if(utility.isValueValid(qtyUomSelection[itr].value)){
								qtyUomSelectedObj.value = qtyUomSelection[itr].value;
							}
							if(utility.isValueValid(qtyUomSelection[itr].unit)){
								qtyUomSelectedObj.unit = qtyUomSelection[itr].unit;
							}
							qtyUomSelectedArr.push(qtyUomSelectedObj);
						}
						response.quantityenteredPrint = qtyUomSelectedArr;
					}
					response.printQtyUom = printQtyUom;
				}
			}
			else
			{
				response.errorMessage = translator.getTranslationString('AUTOPRINT_ENTERQUANTITY.INVALID_INPUT');
				response.isValid 	  = false;
			}
		}
		catch(e)
		{
			response.isValid 	  = false;
			response.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return response;

	}

	function processCustomFields(requestBody , autoprintRulEvltnRec,customFieldsObj)
	{
		var requestParamsArray 	= Object.keys(requestBody.params);
		var fieldParamsArray 	= autoprintRulEvltnRec.getFields();
		var matchedFields 		= requestParamsArray.filter(function(obj) {
			return fieldParamsArray.indexOf(obj) != -1;
		});

		for(var i in matchedFields){
			autoprintRulEvltnRec.setValue({fieldId : matchedFields[i], value : requestBody.params[matchedFields[i]]});
			customFieldsObj[matchedFields[i]] = requestBody.params[matchedFields[i]];
		}
	}	

	return {
		'post': doPost
	};

});
