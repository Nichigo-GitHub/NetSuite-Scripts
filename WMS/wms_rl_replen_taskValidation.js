/**
 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/runtime','N/config'],
		/**
		 * @param {search} search
		 */
		function(search,utility,Big,translator,runtime,config) {

	/**
	 * This function is to validate the scanned item
	 *
	 */
	function doPost(requestBody) {

		var replenItemDetails = {};
		var itemName = '';
		var warehouseLocationId ='';
		var recordInternalId = '';
		

		try{
			if (utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				var replenMinQuantity = '';
				var replenMaxQuantity = '';
				var replenQuantity = '';
				var replenRoundQuantity = '';


				itemName = requestParams.itemName;
				warehouseLocationId = requestParams.warehouseLocationId;
				recordInternalId = requestParams.recordInternalId;

				if(utility.isValueValid(itemName))
				{
					log.debug({title:'itemName',details:itemName});
					var itemResObj = utility.getSKUIdWithName(itemName,warehouseLocationId);
					log.debug({title:'itemResObj :',details:itemResObj});
					if(utility.isValueValid(itemResObj))
					{
						var itemInternalId=itemResObj['itemInternalId'];
						itemName =itemResObj['itemName'];

						var itemresults= openreplenitems(warehouseLocationId,itemInternalId);
						if(itemresults.length>0)
						{
							var currentUserID = runtime.getCurrentUser().id;
							var expectedQuantity = 0;
							var actualQuantity = 0;
							var remainingQuantity = 0;

							var openTaskReplenSearchDetails = search.load({
								id: 'customsearch_wmsse_rpln_opentask_srh'
							});
							var filtersArr = openTaskReplenSearchDetails.filters;

							filtersArr.push(
									search.createFilter({
										name: 'custrecord_wmsse_sku',
										operator: search.Operator.ANYOF,
										values: itemInternalId
									}));

							if(utility.isValueValid(recordInternalId)){
								filtersArr.push(
										search.createFilter({
											name: 'internalId',
											operator: search.Operator.ANYOF,
											values: recordInternalId
										}));
							}
							if(utility.isValueValid(warehouseLocationId))
							{
								filtersArr.push(
										search.createFilter({
											name: 'custrecord_wmsse_wms_location',
											operator: search.Operator.ANYOF,
											values:[warehouseLocationId]
										}));
							}
							filtersArr.push(
									search.createFilter({
										name: 'custrecord_wmsse_task_assignedto',
										operator: search.Operator.ANYOF,
										values:['@NONE@',currentUserID]
									}));
							openTaskReplenSearchDetails.filters = filtersArr;
							var opentaskReplenSearchResult = utility.getSearchResultInJSON(openTaskReplenSearchDetails);
							log.debug({title:'opentaskReplenSearchResult',details:opentaskReplenSearchResult});
							if(opentaskReplenSearchResult.length > 0)
							{
								for(var i=0;i<opentaskReplenSearchResult.length;i++)
								{
									var tempExpectedQuantity = opentaskReplenSearchResult[i]['custrecord_wmsse_expe_qty'];
									var tempActualQuantity = opentaskReplenSearchResult[i]['custrecord_wmsse_act_qty'];

									if(tempExpectedQuantity == '' || tempExpectedQuantity == null || isNaN(tempExpectedQuantity))
									{
										tempExpectedQuantity = 0;
									}
									if(tempActualQuantity == '' || tempActualQuantity == null || isNaN(tempActualQuantity))
									{
										tempActualQuantity = 0;
									}

									expectedQuantity = Big(expectedQuantity).plus(tempExpectedQuantity);
									actualQuantity = Big(actualQuantity).plus(tempActualQuantity);


								}
								var itemType = utility.getItemType(itemInternalId);
								var thumbNailUrl ='';
								var itemDescription = '';
								var unitType = '';
								var itemgroup = '';
								var itemFamily ='';
								var stockUnitName='';
								replenItemDetails['itemInternalId'] = itemInternalId;
								
								var columnArray =[];
								columnArray.push('salesdescription');
								columnArray.push('unitstype');
																
								var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
								
								if (itemLookUp.thumbnailurl != undefined) 
								{
									thumbNailUrl = itemLookUp.thumbnailurl;
								}
								if (itemLookUp.salesdescription != undefined) 
								{
									itemDescription = itemLookUp.salesdescription;
								}
								if (itemLookUp.unitstype != undefined && itemLookUp.unitstype != 'undefined' && itemLookUp.unitstype[0] != undefined) 
								{
									unitType = itemLookUp.unitstype[0].value;
								}
								replenItemDetails['itemName'] = itemName;
								replenItemDetails['imageUrl'] = thumbNailUrl;
								replenItemDetails['itemDescription'] = itemDescription;
								replenItemDetails['unitType'] = unitType;

								remainingQuantity = Big(expectedQuantity).minus(actualQuantity);

								replenItemDetails['remainingQuantity'] = Number(remainingQuantity);
								replenItemDetails['actualQuantity'] = Number(actualQuantity);
								replenItemDetails['itemType'] = itemType;
								replenItemDetails['quantityToMove'] = Number(remainingQuantity);

								if(opentaskReplenSearchResult[0]['custrecord_wmsse_uom']!= '- None -')
								{
									replenItemDetails['stockUnitName'] = opentaskReplenSearchResult[0]['custrecord_wmsse_uom'];
								}else
								{
									replenItemDetails['stockUnitName'] = '';
								}
								
								replenItemDetails['stockConversionRate'] = opentaskReplenSearchResult[0]['custrecord_wmsse_conversionrate'];
								replenItemDetails['binName'] = opentaskReplenSearchResult[0]['custrecord_wmsse_actendlocText'];
								replenItemDetails['binInternalId'] = opentaskReplenSearchResult[0]['custrecord_wmsse_actendloc'];
								replenItemDetails['warehouseLocationName'] = opentaskReplenSearchResult[0]['custrecord_wmsse_wms_location'];
								replenItemDetails['itemGroup'] =itemresults[0]['custitem_wmsse_itemgroup'];
								replenItemDetails['itemFamily'] =itemresults[0]['custitem_wmsse_itemfamily'];
								stockUnitName =opentaskReplenSearchResult[0]['custrecord_wmsse_uom'];
								itemgroup = itemresults[0]['custitem_wmsse_itemgroup'];
								itemFamily = itemresults[0]['custitem_wmsse_itemfamily'];

								if(utility.isValueValid(opentaskReplenSearchResult[0]['custrecord_wmsse_uom']) && opentaskReplenSearchResult[0]['custrecord_wmsse_uom'] != '- None -')
								{
									replenItemDetails['quantitywithUOM'] = Number(remainingQuantity)+ ' ' + opentaskReplenSearchResult[0]['custrecord_wmsse_uom'];
								}
								else
								{
									replenItemDetails['quantitywithUOM'] = Number(remainingQuantity);
								}


								replenMinQuantity =itemresults[0]['custrecord_wmsse_replen_minqty'];
								replenMaxQuantity =itemresults[0]['custrecord_wmsse_replen_maxqty'];
								replenQuantity =itemresults[0]['custrecord_wmsse_replen_qty'];
								replenRoundQuantity =itemresults[0]['custrecord_wmsse_replen_roundqty'];
								log.debug({title:'unitType',details:unitType});

								var transactionUomConversionRate = 1;
								var selectedUnitId = '';
								
								var uomResultsObj = utility.getUomValues(unitType, stockUnitName);
								if(utility.isValueValid(uomResultsObj))
								{
									if(utility.isValueValid(uomResultsObj['uomValue'])){
										selectedUnitId = uomResultsObj['uomValue'];
									}

									if(utility.isValueValid(uomResultsObj['transactionUomConversionRate'])){
										replenItemDetails["transactionUomConversionRate"] = uomResultsObj['transactionUomConversionRate'];
									}
								}

								if(!(utility.isValueValid(replenMinQuantity)))
								{
									replenMinQuantity=0;
								}
								if(!(utility.isValueValid(replenMaxQuantity)))
								{
									replenMaxQuantity=0;
								}
								if(!(utility.isValueValid(replenQuantity)))
								{
									replenQuantity=0;
								}
								if(!(utility.isValueValid(replenRoundQuantity)))
								{
									replenRoundQuantity=0;
								}

								replenItemDetails['replenMinQuantity'] = replenMinQuantity;
								replenItemDetails['replenMaxQuantity'] = replenMaxQuantity;
								replenItemDetails['replenQuantity'] = replenQuantity;
								if(utility.isValueValid(opentaskReplenSearchResult[0]['custrecord_wmsse_uom']) && opentaskReplenSearchResult[0]['custrecord_wmsse_uom'] != '- None -')
								{
									replenItemDetails['replenQuantitywithUOM'] = Number(replenQuantity)+ ' ' + opentaskReplenSearchResult[0]['custrecord_wmsse_uom'];
								}
								else
								{
									replenItemDetails['replenQuantitywithUOM'] = Number(replenQuantity);
								}

								replenItemDetails['replenRoundQuantity'] = replenRoundQuantity;


								if(parseFloat(remainingQuantity)>0)
								{
									var objBinDetails=[];
									var allowAllLots = 'T';
									var pickBinDetails = {}; 
									var loadConfig = config.load({
										type: config.Type.USER_PREFERENCES
									});
									var department = loadConfig.getValue({fieldId: 'departments'});
									var classes = loadConfig.getValue({fieldId: 'classes'});

									pickBinDetails['itemInternalId']=itemInternalId;
									pickBinDetails['strItemGrp']=itemgroup;
									pickBinDetails['strItemFamily']=itemFamily;
									pickBinDetails['preferBinId']=opentaskReplenSearchResult[0]['custrecord_wmsse_actendloc'];
									pickBinDetails['whLocationId']=opentaskReplenSearchResult[0]['custrecord_wmsse_wms_location'];
									pickBinDetails['department']=department;
									pickBinDetails['classes']=classes;
									pickBinDetails['itemType']=itemType;
									pickBinDetails['unitType']=unitType;
									pickBinDetails['blnItemUnit']=opentaskReplenSearchResult[0]['custrecord_wmsse_uomText'];
									pickBinDetails['selectedConversionRate']='';
									pickBinDetails['currentConversionRate']='';
									pickBinDetails['makeInvAvailFlagFromSelect']='';
									pickBinDetails['allowAllLots']=allowAllLots;
									pickBinDetails['boolinclIBStageInvFlag']='false';
									pickBinDetails['location']=warehouseLocationId;
									pickBinDetails['qtyToPick']= remainingQuantity;
									pickBinDetails['selectedUnitId']= selectedUnitId;
								//	objBinDetails=utility.getPickBinDetails(pickBinDetails,'replen',1);

									var	objTotalBinDetails=utility.getRecommendedBins(pickBinDetails,'replen');
										
										for(binCnt in objTotalBinDetails){
											if(objTotalBinDetails[binCnt].isPreferredBin == false ){
												objBinDetails.push(objTotalBinDetails[binCnt]);
												break;
											}
										}
										
									
									if(objBinDetails.length > 0)
									{
										var binObj = [];
										binObj.push(objBinDetails[0]['binnumber']);
										replenItemDetails['recommendedBinName'] = binObj;
										replenItemDetails['fromBinName'] = objBinDetails[0]['binnumber'];
										replenItemDetails['fromBinInternalId'] = objBinDetails[0]['bininternalid'];
										replenItemDetails['availbleQuanity'] = objBinDetails[0]['availableqty'];
									}
									else
									{
										replenItemDetails['recommendedBinName'] = '';
									}
									replenItemDetails['isValid'] = true;
									replenItemDetails['recordInternalId'] = recordInternalId;
								}
								else if(parseFloat(remainingQuantity) == 0)
								{
									replenItemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.FORTHISITEM_COMPLETED');
									replenItemDetails['isValid'] = false;
								}
								else{}
									
							}
							else
							{
								replenItemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.FORTHISITEM_NOTSTARTED');
								replenItemDetails['isValid'] = false;
							}
						}
						else
						{
							replenItemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.VALID_ITEM');
							replenItemDetails['isValid'] = false;
						}
					}
					else
					{
						replenItemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.VALID_ITEM');
						replenItemDetails['isValid'] = false;
					}
				}
				else
				{
					replenItemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.VALID_ITEM');
					replenItemDetails['isValid'] = false;
				}
			}
			else{
				replenItemDetails['errorMessage'] = translator.getTranslationString('REPLEN_TASKVALIDATE.VALID_INPUT');
				replenItemDetails['isValid'] = false;
			}
		}
		catch(e)
		{
			replenItemDetails['isValid'] = false;
			replenItemDetails['errorMessage'] = e.message;
		}
		return replenItemDetails;
	}

	/**
	 * This function is to generate items based on given critiria
	 * 
	 */

	function openreplenitems(warehouseLocationId,itemInternalId)
	{
		var itemSearchDetails = search.load({
			id: 'customsearch_wmsse_replen_taskvalidate'
		});
		var filtersArr = itemSearchDetails.filters;


		if(utility.isValueValid(itemInternalId))
		{
			filtersArr.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: itemInternalId
					}));
		}

		if(utility.isValueValid(warehouseLocationId))
		{
			filtersArr.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values:['@NONE@',warehouseLocationId]
					}));
			filtersArr.push(
					search.createFilter({
						name: 'location',
						join: 'binnumber',
						operator: search.Operator.ANYOF,
						values:[warehouseLocationId]
					}));
		}
		itemSearchDetails.filters = filtersArr;
		var itemSearchResult = utility.getSearchResultInJSON(itemSearchDetails);
		return itemSearchResult;
	}
	
	
	

	return {
		'post': doPost
	};

});
