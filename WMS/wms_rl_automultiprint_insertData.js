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
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				log.debug('Request Params :', requestParams);

				var item 			= requestParams.item;
				var itemType 			= requestParams.itemtype;
				var location 		= requestParams.location;
				var itemDesc 		= requestParams.itemDescription;
				var unitsType 		= requestParams.unitstype;
				var columnArray 	= [];
				var itemDetails 	= '';
				var itemFamily 		= '';
				var itemGroup 		= '';
				var gtin			= requestParams.gtin;
				var vendor			= requestParams.vendor;
				var barcodeQty      = requestParams.barcodeQuantity;


				var selectedRows =  requestParams.selectedrows;


				var receviedDate=utility.DateStamp();

				var parsedBeginDate = format.parse({
					value: receviedDate,
					type: format.Type.DATE
				});

				if(utility.isValueValid(item)){
					//Extracting Item Group and Item Family
					columnArray.push('itemprocessfamily');
					columnArray.push('itemprocessgroup');
					columnArray.push('description');

					itemDetails = search.lookupFields({
						type: search.Type.ITEM,
						id: item,
						columns:columnArray
					});


					if(utility.isValueValid(itemDetails)){
						if(utility.isValueValid(itemDetails.itemprocessfamily) && itemDetails.itemprocessfamily.length>0){
							itemFamily = itemDetails.itemprocessfamily[0].value;                    
						}

						if(utility.isValueValid(itemDetails.itemprocessgroup) && itemDetails.itemprocessgroup.length>0){
							itemGroup = itemDetails.itemprocessgroup[0].value;              
						}

						if(utility.isValueValid(itemDetails.description) && !(utility.isValueValid(itemDesc))){
							itemDesc = itemDetails.description;
						}
					}					

				}

				var recdArr = [];
				var lotNumber = '';
				var serialNumber = '';
				var lotOrSerialArr = [];
				if(selectedRows.length > 0)
				{
					for(var rowIndex=0; rowIndex<selectedRows.length; rowIndex++)
					{
						item = selectedRows[rowIndex].item;
						var quantity = selectedRows[rowIndex].available;
						itemDesc = selectedRows[rowIndex].salesdescription;
						if((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")){
						lotNumber = selectedRows[rowIndex].inventorynumberText;
							lotOrSerialArr.push(lotNumber);
						}
						else if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
						serialNumber = selectedRows[rowIndex].inventorynumberText;
							lotOrSerialArr.push(serialNumber);
						}
						var lotExpiryDate = selectedRows[rowIndex].expirationdate;
						var autoprintRulEvltnRec = record.create({type : 'customrecord_wms_rule_evaluatn_autoprint'});

						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_user', 	 	value : runtime.getCurrentUser().id});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item', 	 	value : item});  
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_tran_date', 	value : parsedBeginDate});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_qty', 	value : quantity});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_ext_location', value : location});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_desc', 	value : itemDesc});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_uom', 			value : unitsType});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_family', 	value : itemFamily});
						autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_item_group', 	value : itemGroup});

						if((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")){
							autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_lot_num', 		value : lotNumber}); //lot number addition

							if(utility.isValueValid(lotExpiryDate)){
								var lotDate = format.parse({
									value: lotExpiryDate,
									type: format.Type.DATE
								});

								autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_lot_exp_date', value : lotDate}); //lot expiry date addition
							}
						}
						if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
							autoprintRulEvltnRec.setValue({fieldId : 'custrecord_wms_serial_number', value : serialNumber});
						}
						processCustomFields(requestBody , autoprintRulEvltnRec);

						// commented below code because no need to check advance barcode system rule for search inventory
						//var isGS1Enabled = labelPrintUtility.checkGS1Enable(location);
						var isGS1Enabled =false;
						log.debug('isGS1Enabled :', isGS1Enabled);

						if(utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true)
						{
							var isGS1StringGenRequired = false;
							if(utility.isValueValid(gtin) && labelPrintUtility.validateGTIN(gtin)== true)
							{
								isGS1StringGenRequired = true;
							}
							else if(utility.isValueValid(gtin) && isNaN(gtin))
							{
								response.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.GTIN_NONNUMERIC');
							}
							else if(!utility.isValueValid(gtin))
							{
								if(utility.isValueValid(barcodeQty) && (utility.isValueValid(barcodeQty[0].unit)))
								{
									unitsType = barcodeQty[0].unit;
								}

								var itemAliasResults = labelPrintUtility.getGTINValFromItemAlias(item, unitsType, vendor);
								log.debug('itemAliasResults :', itemAliasResults);
								if(utility.isValueValid(itemAliasResults) && utility.isValueValid(itemAliasResults.aliasName) && !utility.isValueValid(itemAliasResults.errorMessage))
								{
									gtin = itemAliasResults.aliasName;
									isGS1StringGenRequired = true;							

								}else{
									response.errorMessage = itemAliasResults.errorMessage;
								}
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

								gs1ResponseObj = labelPrintUtility.generateGS1String(gs1StringObj);

								if(utility.isValueValid(gs1ResponseObj) && !utility.isValueValid(gs1ResponseObj.errorMessage))
								{
									gs1String = gs1ResponseObj.gs1String;
									autoprintRulEvltnRec.setValue({fieldId : 'custrecord_label_barcode_string', 	value : gs1String});
								}
								else if(utility.isValueValid(gs1ResponseObj.errorMessage))
								{
									response.errorMessage = gs1ResponseObj.errorMessage;
								}

							}
						}
						if(!utility.isValueValid(response.errorMessage)){
							var recid = autoprintRulEvltnRec.save();
							recdArr.push(recid);
						}
						else{
							response.isValid = false;
							break;
						}
					}
				}
				if(recdArr.length>0){
					response.isValid = true;
					response.id = recdArr;
					response.searchInvtLotOrSerialArr = lotOrSerialArr;
				}
			}
			else
			{
				response.errorMessage = translator.getTranslationString('AUTOPRINT_ENTERQUANTITY.INVALID_INPUT');
				response.isValid = false;
			}
		}
		catch(e)
		{
			response.isValid = false;
			response.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return response;

	}

	function processCustomFields(requestBody , autoprintRulEvltnRec)
	{
		var requestParamsArray 	= Object.keys(requestBody.params);
		var fieldParamsArray 	= autoprintRulEvltnRec.getFields();


		var matchedFields = requestParamsArray.filter(function(obj) {
			//log.debug('Obj: ', obj);
			return fieldParamsArray.indexOf(obj) != -1;
		});

		log.debug("matchedFields",matchedFields);

		for(var i in matchedFields){
			if(matchedFields[i]){
				autoprintRulEvltnRec.setValue({fieldId : matchedFields[i], value : requestBody.params[matchedFields[i]]});
			}
		}
	}	

	return {
		'post': doPost
	};

});
