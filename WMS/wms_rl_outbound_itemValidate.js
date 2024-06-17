/**

 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.

 */


/**

 * @NApiVersion 2.x

 * @NScriptType Restlet

 * @NModuleScope Public

 */

define(['N/search','./wms_utility','./big','./wms_translator','N/runtime','N/record','./wms_outBoundUtility','./big','./wms_tallyScan_utility'],

		/**

		 * @param {search} search

		 */

		function(search,utility,Big,translator,runtime,record,obUtility,bigJS,tallyScanUtil) {



	/**

	 * This function is to validate the scanned item

	 *

	 */

	function validatePickingItem(requestBody) {

		var itemDetails={};
		var requestParams = '';
		var transactiontype='';
		var tranType='';
		var waveId ='';
		try	{

			if(utility.isValueValid(requestBody))

			{
				requestParams = requestBody.params;
				//Variable Declaration
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemName = requestParams.itemName;
				var pickItemName = requestParams.pickItemName;
				var itemInternalId = requestParams.itemInternalId;
				var binInternalId = requestParams.binInternalId;
				var transactionUomName = requestParams.transactionUomName;
				var pickQuantity = requestParams.pickQuantity;
				var pickingType = requestParams.pickingType;	
				var pickTaskId   = requestParams.pickTaskId;
				var waveName  = requestParams.wavename;
				var transactiontype = requestParams.transactiontype;
				var lineitemremainingquantity = requestParams.lineitemremainingquantity;
				var totalpickedquantity = requestParams.totalpickedquantity;
				var binName = requestParams.binName;
				var orderInternalId = requestParams.orderInternalId;
				var unitTypeIdNum = requestParams.unitsType;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var useBinsFlag = requestParams.useBinsFlag;
				var remainingPickTaskQuantity = requestParams.remainingPickTaskQuantity;

				log.debug({title:'requestParams',details:requestParams});

				if ((utility.isValueValid(itemName) || utility.isValueValid(itemInternalId)) &&

						utility.isValueValid(warehouseLocationId) )

				{

					if(utility.isValueValid(itemName))
					{
						var itemInternalId = '';
						var currItem = (utility.itemValidationForInventoryAndOutBound(itemName,warehouseLocationId,"picking"));
						log.debug({title:'currItem',details:currItem});

						if((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId) )||

								utility.isValueValid(currItem.barcodeIteminternalid))

						{
							if(utility.isValueValid(currItem.itemInternalId))
							{
								itemInternalId = currItem.itemInternalId;
								itemDetails.itemName = currItem.itemName;
							}else if(utility.isValueValid(currItem.barcodeIteminternalid))
							{
								itemInternalId = currItem.barcodeIteminternalid;
								itemDetails.itemName = currItem.barcodeItemname;
							}

							var columnArray = new Array();
							columnArray.push('unitstype');
							columnArray.push('usebins');

							var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
							if (itemLookUp.usebins != undefined) 
							{
								useBinsFlag = itemLookUp.usebins;
							}

							if (useBinsFlag == false && (itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem"
								|| itemType == "inventoryitem" || itemType == "assemblyitem" ||
								itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"))
							{
								itemDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.USEBINS_FALSE');
								itemDetails.isValid = false;
							}

							if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined)
							{
								unitTypeIdNum = itemLookUp.unitstype[0].value;
							}

							itemDetails = utility.addItemDatatoResponse(itemDetails, currItem, unitTypeIdNum, transactionUomName);
							log.debug({title:'itemDetails',details:itemDetails});
						}else if(currItem.error)
						{
							itemDetails.errorMessage = currItem.error;
							itemDetails.isValid = false;

						}
						else
						{
							itemDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
							itemDetails.isValid = false;

						}

					}

					itemDetails.binName = binName;

					if(transactiontype!=null && transactiontype!='')
					{
						if(transactiontype =='SalesOrd')
						{
							tranType= translator.getTranslationString('MULTIORDER_ORDERTYPE_SALESORDER');
						}
						else
						{
							tranType=translator.getTranslationString('MULTIORDER_ORDERTYPE_TRANSFERORDER');
						}
						itemDetails.tranType = tranType;
					}
					if(itemInternalId != null && itemInternalId != '')
					{
                        var gs1enabled = false;
                        if(utility.getSystemRuleValueWithProcessType('Enable Advanced Barcode Scanning?', warehouseLocationId, translator.getTranslationString("ADVANCE_BARCODE.GS1BARCODE")) === 'Y'){
                            gs1enabled = true;
                        }
                        itemDetails.gs1enabled = gs1enabled;

						itemDetails.itemInternalId = itemInternalId;
						var itemType = '';
						var useItemLevelTallyScan = '';
						var columnArray =[];
						columnArray.push('itemprocessfamily');
						columnArray.push('itemprocessgroup');
						columnArray.push('unitstype');
						columnArray.push('name');
						columnArray.push('location');
						columnArray.push('recordtype');						
						columnArray.push('usebins');
						columnArray.push('custitem_wms_usetallyscan');

						var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
						if (itemLookUp.recordtype != undefined) 
						{
							itemType = itemLookUp.recordtype;
						}
						if (itemLookUp.usebins != undefined) 
						{
							useBinsFlag = itemLookUp.usebins;
						}
						if(!utility.isValueValid(locUseBinsFlag))
						{
							var columnlocationlookupArray =[];
							columnlocationlookupArray.push('usesbins');

							var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId,columnlocationlookupArray);
							if (locationLookUp.usesbins != undefined) 
							{
								locUseBinsFlag = locationLookUp.usesbins;
							}
						}
						if (itemLookUp.custitem_wms_usetallyscan != undefined) 
						{
							useItemLevelTallyScan = itemLookUp.custitem_wms_usetallyscan;
						}
						if ( locUseBinsFlag == true && useBinsFlag == false && (itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem"

							|| itemType == "inventoryitem" || itemType == "assemblyitem" ||

							itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")) {

							itemDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.USEBINS_FALSE');
							itemDetails.isValid = false;

						}

						else
						{
							// for service item also, passing item Type as nonInventory item to skip the Onboarding changes.
							if(itemType == "serviceitem")
								itemType = "noninventoryitem";
							itemDetails.itemType = itemType;
							var itemFamily ='';
							var itemGroup = '';
							var unitType = '';
							if (itemLookUp.thumbnailurl != undefined)
							{
								itemDetails.imageUrl = itemLookUp.thumbnailurl;
							}
							if (itemLookUp.itemprocessfamily != undefined)
							{
								itemFamily = itemLookUp.itemprocessfamily;
							}
							if (itemLookUp.itemprocessgroup != undefined)
							{
								itemGroup = itemLookUp.itemprocessgroup;
							}
							var uomConversionRate = '';
							if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined)
							{
								unitType = itemLookUp.unitstype[0].value;
								var uomValue = '';
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

									uomValue = uomRecord.getSublistValue({
										sublistId: 'uom',
										fieldId: 'internalid',
										line: i
									});

									if(!isNaN(transactionUomName))
									{
										if(transactionUomName== uomValue)
										{
											uomConversionRate = uomRecord.getSublistValue({
												sublistId: 'uom',
												fieldId: 'conversionrate',
												line: i
											});
											break;
										}
									}
									else{
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

								}
                                if(utility.isValueValid(uomValue)  && utility.isValueValid(uomConversionRate))
								{
									itemDetails.uominternalId = uomValue;
									itemDetails.uomid = uomConversionRate;
								}
							}
							if (itemLookUp.name != undefined)
							{
								itemDetails.itemName = itemLookUp.name;

							}

							itemDetails.itemFamily = itemFamily;
							itemDetails.itemGroup = itemGroup;
							itemDetails.unitType = unitType;
							itemDetails.pickQuantity = pickQuantity;
							itemDetails.lineitemremainingquantity = lineitemremainingquantity;
							itemDetails.totalpickedquantity = totalpickedquantity;


							if(pickingType == 'multiorder')
							{
								var getWaveInternalId = obUtility.getWaveInternalId(waveName,warehouseLocationId);

								if(getWaveInternalId.length>0){

									waveId = getWaveInternalId[0]['internalid'];

								}

								var orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,pickTaskId,null,transactiontype);

								log.debug({title:'orderDetails',details:orderDetails});

								if(orderDetails.length>0 ){

									if(orderDetails.length == 1)
									{
										itemDetails.showskipbtn = 'F';
									}
									else
									{
										itemDetails.showskipbtn  = 'T';
									}
									log.debug({title:'Order Id:', details:orderInternalId});
									log.debug({title:'PickTask Id:', details:pickTaskId});
									//Validating Item against order / pick task.

									var itemValidateSrch = search.load({
										id : 'customsearch_wms_picking_item_validate'
									});
									var itemValidateSrchArr = itemValidateSrch.filters;
									itemValidateSrchArr.push(search.createFilter({
										name: 'location',
										operator: search.Operator.ANYOF,
										values: warehouseLocationId
									}));
									itemValidateSrchArr.push(search.createFilter({
										name: 'item',
										operator: search.Operator.ANYOF,
										values: itemInternalId
									}));
									itemValidateSrchArr.push(search.createFilter({
										name: 'internalid',
										join:'transaction',
										operator: search.Operator.ANYOF,
										values: orderDetails[0]['internalid']
									}));
									itemValidateSrchArr.push(search.createFilter({
										name: 'internalid',
										operator: search.Operator.ANYOF,
										values: pickTaskId
									}));

									itemValidateSrchArr.filters = itemValidateSrchArr;
									var itemValidateRes = utility.getSearchResultInJSON(itemValidateSrch);
									log.debug({title:'Item Results ', details:itemValidateRes});
									if(!utility.isValueValid(itemValidateRes) && itemValidateRes.length == 0)
									{
										itemDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
										itemDetails.isValid = false;

									}
									else
									{
										itemDetails.transactionName = orderDetails[0].tranid;
										itemDetails.lineItememainingQuantity = orderDetails[0].lineitemremainingquantity;
										itemDetails.lineItemPickedQuantity = orderDetails[0].lineitempickedquantity;
										itemDetails.transactionInternalId = orderDetails[0].internalid;
										if(transactiontype!='' && transactiontype=='SalesOrd')
										{
											itemDetails.customer = orderDetails[0].customerText;
										}
										itemDetails.line = orderDetails[0].line;
										var transactionUom = orderDetails[0].unitsText;

										if(!utility.isValueValid(transactionUom))
										{
											transactionUom = '';
										}

										var inventoryDetailLotOrSerial = itemValidateRes[0].inventorynumber;
										if(utility.isValueValid(inventoryDetailLotOrSerial))
										{
											itemDetails.inventoryDetailLotOrSerial = inventoryDetailLotOrSerial;
										}

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

												if(transactionUom.toUpperCase() == unitName.toUpperCase() ||
														transactionUom.toUpperCase() == pluralName.toUpperCase())
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

											if(utility.isValueValid(uomValue)  && utility.isValueValid(uomConversionRate))

											{
												itemDetails.uominternalId = uomValue;
												itemDetails.uomid = uomConversionRate;
												itemDetails.transactionUomConversionRate = uomConversionRate;

											}

										}

										itemDetails.transactionUomName = transactionUom;
										var remainingQtyWithUom ='';
										if(transactionUom!=null && transactionUom!='')
										{
											remainingQtyWithUom = orderDetails[0]['lineitemremainingquantity'] + " " +transactionUom;
										}
										else
										{
											remainingQtyWithUom = orderDetails[0]['lineitemremainingquantity'];
										}
										itemDetails.remainingQty = remainingQtyWithUom;

										itemDetails.lblRemainingQuantity = remainingQtyWithUom;
									}
									var systemRule ="Use cartons for multi-order picking?";

									var isContainerScanRequired = "N";

									if(itemType == "noninventoryitem")
									{
										//isContainerScanRequired = utility.getSystemRuleValue(systemRule,warehouseLocationId);
										isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,tranType);
									}
									if(!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N'){
										itemDetails.isContainerScanRequiredNonInv = 'false';

									}

									else{
										itemDetails.isContainerScanRequiredNonInv = 'true';

									}
								}
							}
							else
							{
								log.debug('in sopk');
								if(utility.isValueValid(itemName))
								{
									//Validating Item against order / pick task.
									var itemValidateSrch = search.load({
										id : 'customsearch_wms_picking_item_validate'
									});

									var itemValidateSrchArr = itemValidateSrch.filters;
									itemValidateSrchArr.push(search.createFilter({
										name: 'location',
										operator: search.Operator.ANYOF,
										values: warehouseLocationId
									}));

									itemValidateSrchArr.push(search.createFilter({
										name: 'item',
										operator: search.Operator.ANYOF,
										values: itemInternalId
									}));
									itemValidateSrchArr.push(search.createFilter({
										name: 'internalid',
										join:'transaction',
										operator: search.Operator.ANYOF,
										values: orderInternalId
									}));
									itemValidateSrchArr.push(search.createFilter({
										name: 'internalid',
										operator: search.Operator.ANYOF,
										values: pickTaskId
									}));
									itemValidateSrchArr.filters = itemValidateSrchArr;
									var itemValidateRes = utility.getSearchResultInJSON(itemValidateSrch);
									if(!utility.isValueValid(itemValidateRes) && itemValidateRes.length == 0)
									{
										itemDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
										itemDetails.isValid = false;

									}
								}
								var systemRule ="Use cartons for single-order picking?";
								var isContainerScanRequired = "N";
								log.debug('tranType in sop carton picking',tranType);
								if(itemType == "noninventoryitem")
								{
									//isContainerScanRequired = utility.getSystemRuleValue(systemRule,warehouseLocationId);
                                    isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,tranType);
								}
								log.debug('isContainerScanRequired for nonitem ',isContainerScanRequired);
								if(!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N'){
									itemDetails.isContainerScanRequiredNonInv = 'false';

								}
								else{
									itemDetails.isContainerScanRequiredNonInv = 'true';

								}
								if(utility.isValueValid(remainingPickTaskQuantity) && utility.isValueValid(lineitemremainingquantity) &&
									(parseFloat(remainingPickTaskQuantity) < parseFloat(lineitemremainingquantity))){
									itemDetails.lineitemremainingquantity = remainingPickTaskQuantity;

								}

							}
							if(itemDetails.isValid == false){
									itemDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
								itemDetails.isValid = false;

							}else{
								itemDetails.isValid = true;
							}

						}

					}

				}
				else
				{
					itemDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
					itemDetails.isValid = false;
				}
			}
			else
			{
				itemDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM');
				itemDetails.isValid = false;

			}

		}
		catch(exp)
		{
			log.error({title:'exp',details:exp});
			itemDetails.errorMessage = exp.message;
			itemDetails.isValid = false;
		}
        if(itemDetails.isValid == true) {
            itemDetails.itemScanned = true;
        }
		return itemDetails;
	}

	return {

		'post': validatePickingItem

	};

});



