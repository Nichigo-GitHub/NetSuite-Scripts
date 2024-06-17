/**
 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/runtime','N/record'],
		/**
		 * @param {search} search
		 */
		function(search,utility,Big,translator,runtime,record) {

	/**
	 * This function is to validate the scanned item
	 *
	 */
	function validateReplenItem(requestBody) {

		var itemDetails={};
		if(utility.isValueValid(requestBody))
		{
			var requestParams = requestBody.params;
			//Variable Declaration
			var itemName = requestParams.itemName;
			var itemNameScanned = requestParams.itemNameScanned;
			//var itemInternalId = requestParams.itemInternalId;
			var warehouseLocationId = requestParams.warehouseLocationId;

			try
			{
				log.debug({title:'requestParams',details:requestParams});
				var itemInternalId = '';
				if (utility.isValueValid(itemName) && utility.isValueValid(warehouseLocationId))
				{

					var currItem = (utility.itemValidationForInventoryAndOutBound(itemName,warehouseLocationId));
					log.debug({title:'currItem',details:currItem});
					if((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId) )||
							utility.isValueValid(currItem.barcodeIteminternalid))
					{

						var itemLookUp = null;
						log.debug({title:'currItemitemInternalId',details:currItem["itemInternalId"]});
						var unitTypeIdNum = '';
						var stockUnitName = '';
						if(utility.isValueValid(currItem['itemInternalId']) && utility.isValueValid(currItem['itemName']))
						{

							itemName = currItem.itemName;
							if(itemNameScanned.toUpperCase() == itemName.toUpperCase())
							{
								itemInternalId = currItem['itemInternalId'];
								itemDetails["itemName"] = currItem['itemName'];

								var columnArray =[];
								columnArray.push('custitem_wmsse_itemfamily');
								columnArray.push('custitem_wmsse_itemgroup');
								columnArray.push('unitstype');
								columnArray.push('stockunit');

								itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
								if (itemLookUp.unitstype != undefined && itemLookUp.unitstype != 'undefined' && itemLookUp.unitstype[0] != undefined)
								{
									unitTypeIdNum = itemLookUp.unitstype[0].value;
								}
								if(itemLookUp.stockunit != undefined && itemLookUp.stockunit[0]!=null && itemLookUp.stockunit[0]!='' && itemLookUp.stockunit[0]!='undefiend')
								{
									stockUnitName =  itemLookUp.stockunit[0].text;
								}


								itemDetails = utility.addItemDatatoResponse(itemDetails, currItem, unitTypeIdNum, stockUnitName);
								log.debug('item Details :', itemDetails);

							}							
							else
							{
								itemDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
								itemDetails['isValid'] = false;
							}
						}
						else
						{
							itemInternalId = currItem["barcodeIteminternalid"];
							var barcodeItemName = currItem["barcodeItemname"];
							if(barcodeItemName.toUpperCase() == itemNameScanned.toUpperCase())
							{
								var columnArray =[];
								columnArray.push('custitem_wmsse_itemfamily');
								columnArray.push('custitem_wmsse_itemgroup');
								columnArray.push('unitstype');
								columnArray.push('stockunit');								
								
								itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
								if (itemLookUp.unitstype != undefined && itemLookUp.unitstype != 'undefined' && itemLookUp.unitstype[0] != undefined)
								{
									unitTypeIdNum = itemLookUp.unitstype[0].value;
								}
								if(itemLookUp.stockunit != undefined && itemLookUp.stockunit[0]!=null && itemLookUp.stockunit[0]!='' && itemLookUp.stockunit[0]!='undefiend')
								{
									stockUnitName =  itemLookUp.stockunit[0].text;
								}

								itemDetails = utility.addItemDatatoResponse(itemDetails, currItem, unitTypeIdNum, stockUnitName);
							}
							else
							{

								itemDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
								itemDetails['isValid'] = false;
							}
						}
					}
					else
					{
						if(utility.isValueValid(currItem.error))
						{
							itemDetails["errorMessage"] = currItem.error;
						}
						else
						{
							itemDetails['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INVALID_ITEM');
						}
						itemDetails['isValid'] = false;
					}

					//	log.debug({title:'itemInternalId',details:itemInternalId});
					if(itemInternalId != null && itemInternalId != '')
					{
						itemDetails["itemInternalId"] = itemInternalId;
						var itemType = utility.getItemType(itemInternalId,warehouseLocationId);
						itemDetails["itemType"] = itemType;

						if(itemLookUp == null)
						{
							var columnArray =[];
							columnArray.push('custitem_wmsse_itemfamily');
							columnArray.push('custitem_wmsse_itemgroup');
							columnArray.push('unitstype');
														
							var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
							
						}
						log.debug({title:'itemType',details:itemType});
						var itemFamily ='';
						var itemGroup = '';
						var unitType = '';
						if (itemLookUp.thumbnailurl != undefined) 
						{
							itemDetails["imageUrl"] = itemLookUp.thumbnailurl;
						}
						if (itemLookUp.custitem_wmsse_itemfamily != undefined) 
						{
							itemFamily = itemLookUp.custitem_wmsse_itemfamily;
						}

						itemDetails["itemFamily"] = itemFamily;
						itemDetails["itemGroup"] = itemGroup;
						itemDetails["unitType"] = unitType;

						var itemresults= openReplenItems(warehouseLocationId,itemInternalId,itemFamily,itemGroup);
						log.debug({title:'itemresults',details:itemresults});

						if(itemresults.length > 0)
						{
							var currentUserID = runtime.getCurrentUser().id;
							var expQty = 0;
							var actQty = 0;

							var openTaskReplenDetailSearch = search.load({id:'customsearch_wmsse_rpln_opentask_srh'});
							var openTaskReplenDetailFilters = openTaskReplenDetailSearch.filters;

							openTaskReplenDetailFilters.push(search.createFilter({
								name:'custrecord_wmsse_sku',
								operator: search.Operator.ANYOF,
								values:itemInternalId}));

							if(utility.isValueValid(warehouseLocationId))
							{
								openTaskReplenDetailFilters.push(search.createFilter({
									name:'custrecord_wmsse_wms_location',
									operator: search.Operator.ANYOF,
									values:warehouseLocationId}));
							}

							openTaskReplenDetailFilters.push(search.createFilter({
								name:'custrecord_wmsse_task_assignedto',
								operator: search.Operator.ANYOF,
								values:['@NONE@',currentUserID]}));

							openTaskReplenDetailSearch.filters = openTaskReplenDetailFilters;
							var	 otResult = utility.getSearchResultInJSON(openTaskReplenDetailSearch);

							if(otResult.length > 0)
							{
								for(var i in  otResult)
								{
									var expectedQty = otResult[i]['custrecord_wmsse_expe_qty'];
									var actualQty = otResult[i]['custrecord_wmsse_act_qty'];

									if(!utility.isValueValid(expectedQty) || isNaN(expectedQty))
									{
										expectedQty = 0;
									}
									if(!utility.isValueValid(actualQty)|| isNaN(actualQty))
									{
										actualQty = 0;		
									}

									expQty = Big(expQty).plus(expectedQty);
									actQty = Big(actQty).plus(actualQty);

								}

								var remQty = Big(expQty).minus(actQty);
								if(parseFloat(remQty)>0)
								{
									itemDetails["toBinName"] = otResult[0]['custrecord_wmsse_actendlocText'];
									itemDetails["toBinId"] = otResult[0]['custrecord_wmsse_actendloc'];
									itemDetails['stockUnitName'] = otResult[0]['custrecord_wmsse_uom'];
									itemDetails['stockConversionRate'] = otResult[0]['custrecord_wmsse_conversionrate'];
									itemDetails["replenminqty"] = itemresults[0]['custrecord_wmsse_replen_minqty'];
									itemDetails["replenmaxqty"] = itemresults[0]['custrecord_wmsse_replen_maxqty'];
									itemDetails["replenqty"] = itemresults[0]['custrecord_wmsse_replen_qty'];
									itemDetails["replenroundqty"] = itemresults[0]['custrecord_wmsse_replen_roundqty'];
									itemDetails['actualbegintime'] =utility.getCurrentTimeStamp();
									itemDetails['isValid'] = true;

								}
								else if(parseFloat(remQty) == 0)
								{
									itemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.FORTHISITEM_COMPLETED');
									itemDetails['isValid'] = false;	
								}
								else
								{
									itemDetails['errorMessage'] = translator.getTranslationString('PO_ITEMVALIDATE.CHECK_MULTIPLE_USERS');
									itemDetails['isValid'] = false;
								}
							}
							else
							{
								itemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.FORTHISITEM_COMPLETED');
								itemDetails['isValid'] = false;
							}	

						}
						else
						{
							itemDetails['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INVALID_ITEM');
							itemDetails['isValid'] = false;
						}

					}


				}
				else
				{
					itemDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_BINVALIDATE.EMPTY_INPUT');
					itemDetails['isValid'] = false;
				}
			}
			catch(exp)
			{
				log.error({title:'exp',details:exp});
				itemDetails['errorMessage'] = exp.message;
				itemDetails['isValid'] = false;

			}
		}
		else
		{
			itemDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_BINVALIDATE.EMPTY_INPUT');
			itemDetails['isValid'] = false;
		}

		return itemDetails;

	}

	/**
	 * This function is to generate items based on given critiria
	 * 
	 */
	function openReplenItems(warehouseLocationId,itemInternalId,itemFamily,itemGroup)
	{

		log.debug({title:'warehouseLocationId',details:warehouseLocationId});
		log.debug({title:'itemInternalId',details:itemInternalId});


		var replenItemSearch = search.load({id:'customsearch_wmsse_rpln_item_srh'});
		var replenItemSearchFilters = replenItemSearch.filters;
		if(utility.isValueValid(itemInternalId))
		{
			replenItemSearchFilters.push(search.createFilter({
				name:'internalid',
				operator: search.Operator.ANYOF,
				values:itemInternalId}));
		}

		if(utility.isValueValid(itemFamily) && itemFamily.length > 0)
		{
			replenItemSearchFilters.push(search.createFilter({
				name:'custitem_wmsse_itemfamily',
				operator: search.Operator.ANYOF,
				values:itemFamily}));
		}

		if(utility.isValueValid(itemGroup) && itemGroup.length > 0)
		{
			replenItemSearchFilters.push(search.createFilter({
				name:'custitem_wmsse_itemgroup',
				operator: search.Operator.ANYOF,
				values:itemgroup}));
		}

		if(utility.isValueValid(warehouseLocationId))
		{
			replenItemSearchFilters.push(search.createFilter({
				name:'location',
				operator: search.Operator.ANYOF,
				values:['@NONE@',warehouseLocationId]}));

			replenItemSearchFilters.push(search.createFilter({
				name:'location',
				join:'binnumber',
				operator: search.Operator.ANYOF,
				values:warehouseLocationId}));
		}

		replenItemSearch.filters = replenItemSearchFilters;
		var	 itemResults = utility.getSearchResultInJSON(replenItemSearch);
		log.debug({title:'itemResults1',details:itemResults});
		return itemResults;
	}
	return {
		'post': validateReplenItem
	};
});

