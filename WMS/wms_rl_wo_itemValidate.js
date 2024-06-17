/**
 *  Copyright Â© 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','N/record','./wms_workOrderUtility','./big'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,record,utilityWO,Big) {

	/**
	 * This function is to validate the scanned item
	 *
	 */
	function validateWorkorderItem(requestBody) {

		var itemDetails={};
		try
		{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestParams = requestBody.params;

				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemName = requestParams.itemName;			
				var itemInternalId = requestParams.itemInternalId;
				var transactionUomName = requestParams.transactionUomName;			
				var transactiontype = requestParams.transactiontype;			
				var orderInternalId = requestParams.transactionInternalId;
				var unitTypeIdNum = requestParams.unitsType;
				var transactionLineNo = requestParams.transactionLineNo;
				var action = requestParams.action;
				var transactionQuantity = requestParams.transactionQuantity;
				var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;
				var scannedItemInternalId = '';
				var itemFamily ='';
				var itemGroup = '';
				var unitType = '';
				var stockUnitName='';
				var stockCoversionRate ='';
				var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;

				workorderOverpickingFlag = workorderOverpickingFlag || false;
				if (utility.isValueValid(itemName))
				{
					if(action == 'itemScanned')
					{
						var currItem = (utility.itemValidationForInventoryAndOutBound(itemName,warehouseLocationId));
						log.debug({title:'currItem',details:currItem});

						if((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId) )||
								utility.isValueValid(currItem.barcodeIteminternalid))
						{
							scannedItemInternalId = ((currItem['itemInternalId']) ? (currItem['itemInternalId']) : currItem['barcodeIteminternalid']);
							itemDetails["itemName"] = ((currItem['itemName']) ? (currItem['itemName']) : currItem['barcodeItemname']);


							itemDetails = utility.addItemDatatoResponse(itemDetails, currItem, unitTypeIdNum, transactionUomName);

							log.debug('itemDetails :', itemDetails);
						}
						else
						{
							var itemresults= utilityWO.getbasicItemDetails(itemName,warehouseLocationId);
							log.debug({title:'itemresults',details:itemresults});
							if(itemresults!=null && itemresults!='')
							{
								log.debug({title:'inactive',details:itemresults[0]['isinactive']});
								if(itemresults[0]['isinactive']==true)
								{log.debug({title:'inactive11',details:itemresults[0]['isinactive']});
								itemDetails["errorMessage"] = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INACTIVE_ITEM');
								itemDetails['isValid'] = false;
								}
								else
								{
									itemDetails["errorMessage"] = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
									itemDetails['isValid'] = false;
								}
							}
							else
							{
								itemDetails["errorMessage"] = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
								itemDetails['isValid'] = false;
							}						
						}
					}else{
						scannedItemInternalId = itemInternalId;
					}
					if(scannedItemInternalId == itemInternalId){
						if(utility.isValueValid(transactionQuantity))
						{
							itemDetails["remainingQuantity"] = transactionQuantity;
							var workOrderOpenTaskDtlsObj = utilityWO.getOpentaskPickQtyDetails(orderInternalId,itemInternalId,transactionLineNo);
							log.debug('workOrderOpenTaskDtlsObj',workOrderOpenTaskDtlsObj);
							if(workOrderOpenTaskDtlsObj.length > 0)
							{   var workOrderOpenTaskQuantity=0;
								var objItemDtl ={};
								var woPickQtyResultswithInventoryNumber = utilityWO.getOpentaskQtyWithInventoryNumber(orderInternalId,itemInternalId,transactionLineNo);

									utilityWO.updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber,objItemDtl);
										if(utility.isValueValid(inventoryDetailLotOrSerialText)){
                                           var objLinedata = objItemDtl[itemInternalId];
                                           var qtyObj = objLinedata[transactionLineNo];
                                           workOrderOpenTaskQuantity = utility.isValueValid(qtyObj[inventoryDetailLotOrSerialText]) ? qtyObj[inventoryDetailLotOrSerialText] : 0;
                                        }else{
										workOrderOpenTaskQuantity = Number(workOrderOpenTaskDtlsObj[0].custrecord_wmsse_act_qty);
                                       }
								  
								itemDetails["remainingQuantity"] = Big(transactionQuantity).minus(workOrderOpenTaskQuantity);
							}
						}
                         
                        	  itemDetails["itemInternalId"] = itemInternalId;                        	 
                        	  var itemType = '';						
                        	  var columnArray =[];
                        	  columnArray.push('itemprocessfamily');
                        	  columnArray.push('itemprocessgroup');
                        	  columnArray.push('unitstype');
                        	  columnArray.push('name');
                        	  columnArray.push('location');
                        	  columnArray.push('recordtype');
                        	  columnArray.push('stockunit');

						var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);

						if (itemLookUp.recordtype != undefined) 
						{
							itemType = itemLookUp.recordtype;
						}
						itemDetails["itemType"] = itemType;

						if (itemLookUp.thumbnailurl != undefined)
						{
							itemDetails["info_imageUrl"] = itemLookUp.thumbnailurl;
						}
						if (itemLookUp.itemprocessfamily != undefined)
						{
							itemFamily = itemLookUp.itemprocessfamily;
						}
						if (itemLookUp.itemprocessgroup != undefined)
						{
							itemGroup = itemLookUp.itemprocessgroup;
						}
						if (itemLookUp.unitstype != undefined && itemLookUp.unitstype.length > 0 && itemLookUp.stockunit != undefined && itemLookUp.stockunit[0]!=null && itemLookUp.stockunit[0]!='' && itemLookUp.stockunit[0]!='undefiend')
						{
							stockUnitName = itemLookUp.stockunit[0].text;
						}
						if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined)
						{
							unitType = itemLookUp.unitstype[0].value;
							log.debug({title:'unitType',details:unitType});
							if(utility.isValueValid(unitType))
							{
								var uomValue = '';
								var uomConversionRate = '';
								var uomRecord = record.load({
									type: record.Type.UNITS_TYPE,
									id: unitType
								});

								var sublistCount = uomRecord.getLineCount({
									sublistId: 'uom'
								});
								for (var i = 0; i < sublistCount; i++) {
									var unitName = uomRecord.getSublistValue({
										sublistId: 'uom',
										fieldId: 'unitname',
										line: i
									});
									var pluralName = uomRecord.getSublistValue({
										sublistId: 'uom',
										fieldId: 'pluralname',
										line: i
									});
									if(transactionUomName.toUpperCase() == unitName.toUpperCase() ||
											transactionUomName.toUpperCase() == pluralName.toUpperCase())
									{

										uomValue = uomRecord.getSublistValue({
											sublistId: 'uom',
											fieldId: 'internalid',
											line: i
										});
										uomConversionRate = uomRecord.getSublistValue({
											sublistId: 'uom',
											fieldId: 'conversionrate',
											line: i
										});
										break;
									}
								}
								for (var i = 0; i < sublistCount; i++) {
									var unitName = uomRecord.getSublistValue({
										sublistId: 'uom',
										fieldId: 'unitname',
										line: i
									});
									var pluralName = uomRecord.getSublistValue({
										sublistId: 'uom',
										fieldId: 'pluralname',
										line: i
									});
									if(stockUnitName !=null && stockUnitName!='' && stockUnitName !='undefiend')
									{
										if(stockUnitName.toUpperCase() == unitName.toUpperCase() ||
												stockUnitName.toUpperCase() == pluralName.toUpperCase())
										{
											stockCoversionRate = uomRecord.getSublistValue({
												sublistId: 'uom',
												fieldId: 'conversionrate',
												line: i
											});
											break;
										}
									}

								}

								if(uomValue != '')
								{
									itemDetails["uominternalId"] = uomValue;
									itemDetails["uomid"] = uomConversionRate;
									itemDetails["transcationUomInternalId"] = uomValue;
								}
							}
						}
						if (itemLookUp.name != undefined)
						{
							itemDetails["info_itemName"] = itemLookUp.name;
						}
						if((itemDetails["remainingQuantity"] <0) && (workorderOverpickingFlag))
						{
							itemDetails["remainingQuantity"] =0;
						}
						itemDetails["stockUnitName"] = stockUnitName;
						itemDetails["stockUomConversionRate"] = stockCoversionRate;  
						itemDetails["itemFamily"] = itemFamily;
						itemDetails["itemGroup"] = itemGroup;
						itemDetails["unitType"] = unitType;
						itemDetails['isValid'] = true;
					}
					else
					{
						if(utility.isValueValid(currItem.error))
						{
							itemDetails["errorMessage"] = currItem.error;
						}
						else
						{
							itemDetails['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
						}
						itemDetails['isValid'] = false;
					}
				}
				else
				{
					itemDetails['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
					itemDetails['isValid'] = false;
				}

			}
			else
			{
				itemDetails['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
				itemDetails['isValid'] = false;
			}
		}
		catch(exp)
		{
			log.error({title:'exp',details:exp});
			itemDetails['errorMessage'] = exp.message;
			itemDetails['isValid'] = false;
		}

		return itemDetails;
	}

	return {
		'post': validateWorkorderItem
	};
});

