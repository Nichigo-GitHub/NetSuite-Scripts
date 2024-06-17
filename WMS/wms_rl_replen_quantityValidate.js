/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/format','./wms_inventory_utility'],
		/**
		 * @param {search} search
		 */
		function(search,utility,Big,translator,format,invtUtility) {


	function doPost(requestBody) {

		var qtyValidate = {};
		var scannedQuantity='';
		var availbleQuanity = '';
		var itemType='';
		var transactionUomConversionRate = '';
		var fromStatusInternalId = '';
		var fromStatusName = '';
		var itemInternalId = '';
		var itemName = '';
		var warehouseLocationId = '';
		var binInternalId = '';
		var lotName = '';
		var lotInternalId = '';
		var unitType = '';
		var stockUnitName = '';
		var scannedQuantityWithUOM = '';
		var makeInvAvailFlagFromSelect="";
		var quantityToMove = '';
		var quantityToMovewithUOM = '';
		var remainingQuantityToMove = '';

		var scannedStatusList = '';
		var scannedStatusQtyList = '';
		var scannedStatusLotList = '';
		var replenQuantity = '';
		var remainingQuantity = '';
		var debugString ='';
		try{
			if (utility.isValueValid(requestBody)) 
			{
				var requestParams = requestBody.params;
				scannedQuantity=requestParams.scannedQuantity;
				availbleQuanity = requestParams.availbleQuanity;
				itemType=requestParams.itemType;
				transactionUomConversionRate = requestParams.transactionUomConversionRate;
				fromStatusInternalId = requestParams.fromStatusInternalId;
				fromStatusName = requestParams.fromStatusName;
				itemInternalId = requestParams.itemInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				binInternalId = requestParams.binInternalId;
				lotName = requestParams.lotName;
				lotInternalId = requestParams.lotInternalId;
				unitType = requestParams.unitType;
				stockUnitName = requestParams.stockUnitName;
				var processType = requestParams.processType;
				var putawayAll=requestParams.putawayAll;
				var noQuantity=requestParams.noQuantity;//check how ill we get this value
				quantityToMove = requestParams.quantityToMove;
				replenQuantity = requestParams.replenQuantity;
				remainingQuantity = requestParams.remainingQuantity;
				itemName = requestParams.itemName;
				remainingQuantityToMove = requestParams.remainingQuantityToMove;
				var scannedStatusQtyList = requestParams.scannedStatusQtyList;
				var scannedStatusList = requestParams.scannedStatusList;
				var scannedStatusNameList = requestParams.scannedStatusNameList;
				var scannedStatusLotList = requestParams.scannedStatusLotList;
				var stockConversionRate = requestParams.stockConversionRate;
				var availableqty = requestParams.availableqty;

				log.debug({title:'requestParams',details:requestParams});

				if (utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId) && utility.isValueValid(binInternalId) &&
						utility.isValueValid(scannedQuantity) && !(isNaN(scannedQuantity)) &&  (scannedQuantity > 0) && utility.isValueValid(itemType)
						&& (utility.isValueValid(availbleQuanity) || (utility.isValueValid(availableqty) )))
				{

					if(!(utility.isValueValid(quantityToMove)))
					{
						quantityToMove=0;
					}
					if(!(utility.isValueValid(remainingQuantityToMove)))
					{
						remainingQuantityToMove=0;
					}
					if(!(utility.isValueValid(replenQuantity)))
					{
						replenQuantity=0;
					}
					if(!(utility.isValueValid(remainingQuantity)))
					{
						remainingQuantity=0;
					}
					if(!(utility.isValueValid(availbleQuanity)))
					{
						availbleQuanity=availableqty;
					}
					if(stockUnitName == '- None -')
					{
						stockUnitName = '';
					}
					if(!utility.isValueValid(stockConversionRate))
					{
						stockConversionRate = 1;
					}

					if((parseFloat(scannedQuantity)) > (parseFloat(replenQuantity))) 
					{	

						qtyValidate["errorMessage"] = translator.getTranslationString('REPLENISMENT_QTY_GREATERTHAN_REPLNQTY');
						qtyValidate['isValid'] = false;
					}	

					else if(parseFloat(scannedQuantity) > parseFloat(remainingQuantity))
					{
						qtyValidate["errorMessage"] = translator.getTranslationString('REPLENISMENT_QTY_GREATERTHAN_REMAININGQTY');
						qtyValidate['isValid'] = false;
					}
					else
					{
						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

						if(itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")
						{
							var objBinDetails = [];
							if(!utility.isValueValid(lotName))
							{
								log.debug({title:'lotName is empty',details:lotName});
								return {errorMessage: translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT'), isValid: false};
							}
							if(inventoryStatusFeature)
							{
								log.debug({title:'lotName',details:lotName});
								lotInternalId = utility.inventoryNumberInternalId(lotName,warehouseLocationId,itemInternalId);
								debugString = debugString +", lotInternalId : "+lotInternalId;
								log.debug({title:'lotInternalId',details:lotInternalId});
								if(!utility.isValueValid(lotInternalId))
								{

									return {errorMessage: translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT'), isValid: false};

								}
								else
								{
									var balanceSearch=search.load({id:'customsearch_wmsse_inventorybalance',type:search.Type.INVENTORY_BALANCE});
									var filters = balanceSearch.filters;
									if(utility.isValueValid(itemInternalId))
									{
										filters.push(search.createFilter({name:'internalid'
											,join:'item',
											operator:search.Operator.ANYOF,
											values:itemInternalId}));
									}
									if(utility.isValueValid(binInternalId))
									{
										filters.push(search.createFilter({name:'binnumber',
											operator:search.Operator.ANYOF,
											values:binInternalId}));
									}
									if(utility.isValueValid(warehouseLocationId))
									{
										filters.push(search.createFilter({name:'location',
											operator:search.Operator.ANYOF,
											values:warehouseLocationId}));
									}
									if(utility.isValueValid(lotInternalId))
									{
										filters.push(search.createFilter({name:'inventorynumber',
											operator:search.Operator.ANYOF,
											values:lotInternalId}));
									}

									if(utility.isValueValid(makeInvAvailFlagFromSelect))
									{
										if(makeInvAvailFlagFromSelect == 'T' || makeInvAvailFlagFromSelect == 'F')
										{
											filters.push(search.createFilter({name:'inventoryavailable',
												join:'inventorystatus',
												operator:search.Operator.IS,
												values:makeInvAvailFlagFromSelect}));
										}
										else
										{
											if(makeInvAvailFlagFromSelect != 'All')
											{
												filters.push(search.createFilter({name:'status',
													operator:search.Operator.ANYOF,
													values:makeInvAvailFlagFromSelect}));
											}
										}
									}
									else
									{

										filters.push(search.createFilter({name:'status',
											operator:search.Operator.ANYOF,
											values:fromStatusInternalId}));
									}
									balanceSearch.filters = filters;
									objBinDetails = utility.getSearchResultInJSON(balanceSearch);

									debugString = debugString +", objBinDetails : "+objBinDetails;

								}
							}
							else
							{

								var binDetailsSearch = search.load({id:'customsearch_wmsse_itemwise_lots'});

								var filterStrat = binDetailsSearch.filters;

								if(utility.isValueValid(binInternalId))
								{
									filterStrat.push(search.createFilter({
										name:'binnumber',
										join:'inventoryNumberBinOnHand',
										operator:search.Operator.ANYOF,
										values:binInternalId}));
								}

								filterStrat.push(search.createFilter({
									name:'internalid',
									operator:search.Operator.ANYOF,
									values:itemInternalId}));
								filterStrat.push(search.createFilter({
									name:'isinactive',
									operator:search.Operator.IS,
									values:false}));
								filterStrat.push(search.createFilter({
									name:'location',
									join:'inventoryNumberBinOnHand',
									operator:search.Operator.ANYOF,
									values:warehouseLocationId}));
								filterStrat.push(search.createFilter({
									name:'inventorynumber',
									join:'inventoryNumberBinOnHand',
									operator:search.Operator.IS,
									values:lotName}));

								var columnStrat=binDetailsSearch.columns;
								columnStrat.push(search.createColumn({name:'quantityavailable',join:'inventoryNumberBinOnHand'}));
								columnStrat.push(search.createColumn({name:'inventorynumber',join:'inventoryNumberBinOnHand'}));
								columnStrat[0].sort = search.Sort.ASC;
								binDetailsSearch.filters =filterStrat;
								binDetailsSearch.columns =columnStrat;

								objBinDetails = utility.getSearchResultInJSON(binDetailsSearch);

								debugString = debugString +", objBinDetails : "+objBinDetails;

							}

							if(objBinDetails.length>0)
							{									
								/*var vOpenPickDetails=utility.getOpenTaskPickBinDetailsLot(itemInternalId,binInternalId,warehouseLocationId,unitType,stockUnitName);
									debugString = debugString +",vOpenPickDetails for lot: "+vOpenPickDetails;
									log.debug({title:'vOpenPickDetails',details:vOpenPickDetails});
									var vBinOpenLotArr="";
									if(vOpenPickDetails.length >0)
									{
										vBinOpenLotArr = vOpenPickDetails[3];
									}*/

								var availableQty=0;var vinventoryNumberBinOnHand='';
								var vmakeInvAvailFlag = true;
								var vLocDetails = search.lookupFields({
									type: search.Type.LOCATION,
									id: warehouseLocationId,
									columns: ['makeinventoryavailable']
								});
								vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
								debugString = debugString +",objBinDetails for lot length: "+objBinDetails.length;
								for(var k in  objBinDetails)
								{
									var vInvLot='';
									var vInvLotId='';
									var statusId ='';
									var statusName='';
									if(inventoryStatusFeature)
									{
										statusId = objBinDetails[k]['status'];
										statusName = objBinDetails[k]['statusText'];									
										vInvLot = objBinDetails[k]['inventorynumberText'];
										vInvLotId = objBinDetails[k]['inventorynumber'];
									}
									else
									{
										vInvLot=objBinDetails[k]['inventorynumberText'];
										vInvLotId=objBinDetails[k]['inventorynumber'];
									}

									if(vInvLot == lotName)
									{
										/*var vOpenPickQty=0;
											if(inventoryStatusFeature)
											{
												if(vOpenPickDetails!=null && vOpenPickDetails !='' && vOpenPickDetails.length >0)
												{
													var	vOpenPickQtyArr = vOpenPickDetails[1];
													var	vBinLotArr = vOpenPickDetails[3];
													var	vBinStatusArr = vOpenPickDetails[5];
													if(vBinStatusArr != null && vBinStatusArr != '' && vBinStatusArr != 'null'
														&& vBinStatusArr != 'undefined' && vBinStatusArr != undefined)
													{
														for(var binItr=0;binItr<vBinStatusArr.length;binItr++)
														{
															var opentaskStatus = vBinStatusArr[binItr];
															var opentaskLotText =vBinLotArr[binItr];													
															if(opentaskStatus == statusId && vInvLot==opentaskLotText)
															{
																vOpenPickQty = vOpenPickQtyArr[binItr];
																break;
															}
														}
													}


												}

											}
											else
											{
												for(var m=0;m<vBinOpenLotArr.length;m++)
												{ 
													var vOpenLot=vOpenPickDetails[3][m];
													if(vInvLot==vOpenLot)
													{
														vOpenPickQty=vOpenPickDetails[1][m];
														break;
													} 
												}
											}
											if(vOpenPickQty == null || vOpenPickQty == '' || vOpenPickQty =='null' || vOpenPickQty == '- None -')
												vOpenPickQty =0;*/

										if(inventoryStatusFeature)
										{
											if(vmakeInvAvailFlag)
												availbleQuanity=objBinDetails[k]['available'];
											else
												availbleQuanity=objBinDetails[k]['onhand'];
										}
										else
										{
											if(vmakeInvAvailFlag)
												availbleQuanity=objBinDetails[k]['quantityavailable'];
											else
												availbleQuanity=objBinDetails[k]['quantityonhand'];
										}
										//	availbleQuanity = Big(availbleQuanity).minus(vOpenPickQty);

										log.debug({title:'for lotitem availbleQuanity',details:availbleQuanity});
									}
								}

							}
							else
							{
								return {errorMessage: translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT'), isValid: false};
							}

						}

						if(itemType != "lotnumberedinventoryitem" && itemType!="lotnumberedassemblyitem")
						{
							if(inventoryStatusFeature)
							{
								log.debug({title:'inv status on',details:'inv status on'});
								var objStatusDetails = getItemWiseStatusDetailsInBin(itemInternalId,warehouseLocationId,binInternalId,fromStatusInternalId);

								for(var statusItr in objStatusDetails){
									var objectStatus = {};
									var objStatusRec = objStatusDetails[statusItr];
									availbleQuanity=objStatusRec['available'];
								}
							}
							else
							{
								var objQtyDetails = invtUtility.getItemWiseDetails(binInternalId,warehouseLocationId,itemInternalId,lotInternalId);
								log.debug({title:'objQtyDetails',details:objQtyDetails});
								for(var qtyItr in objQtyDetails){
									//var qtyItr = {};
									var qtyItrRec = objQtyDetails[qtyItr];								
									availbleQuanity=qtyItrRec['quantityavailable'];
								}
							}
						}


						log.debug({title:'availbleQuanity',details:availbleQuanity});
						scannedQuantity = Big(scannedQuantity);

						//if(!(utility.isValueValid(transactionUomConversionRate)))
						//{
						transactionUomConversionRate=1;
						//}
						if(utility.isValueValid(availbleQuanity))
						{
							availbleQuanity = Big(availbleQuanity).mul(transactionUomConversionRate);

						}

						/*if(availbleQuanity >0 && (itemType != "lotnumberedinventoryitem" && itemType!="lotnumberedassemblyitem"))
						{
							var vOpenPickDetails=utility.getOpenTaskPickBinDetails(itemInternalId,binInternalId,warehouseLocationId,unitType,'','',fromStatusInternalId);
							var vOpenPickQty=0;
							var vBinOpenTaskBinQtyArr = "";
							if(vOpenPickDetails!=null && vOpenPickDetails !='' && vOpenPickDetails.length >0)
							{
								vBinOpenTaskBinQtyArr = vOpenPickDetails[1];
								vOpenPickQty = vBinOpenTaskBinQtyArr[0];
							}

							availbleQuanity = Big(availbleQuanity).minus(vOpenPickQty);

						}*/
						var convertedScannedQty = Number(Big(scannedQuantity).mul(transactionUomConversionRate));

						log.debug({title:'convertedScannedQty',details:convertedScannedQty});
						log.debug({title:'availbleQuanity',details:availbleQuanity});

						if(utility.isValueValid(convertedScannedQty) && !isNaN(convertedScannedQty) && parseFloat(availbleQuanity) >= parseFloat(convertedScannedQty))
						{

							if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")
							{
								var convertionQty = Number(Big(scannedQuantity).mul(stockConversionRate));
								if(convertionQty.toString().indexOf('.') != -1)
								{
									qtyValidate["errorMessage"] = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
									qtyValidate['isValid'] = false;
								}
								else
								{
									qtyValidate['isValid'] = true;
									qtyValidate['numberOfTimesSerialScanned']=0;
									qtyValidate["scannedQuantity"]=Number(Big(scannedQuantity).mul(stockConversionRate));
									qtyValidate["scannedQuantityWithUOM"]=scannedQuantity +" "+stockUnitName;
									qtyValidate['fromStatusNamepageInfo'] = fromStatusName;
                                  
                                  	var remainingQuantityToMove = Number(Big(remainingQuantityToMove).minus(scannedQuantity));

									if((parseFloat(quantityToMove) != parseFloat(remainingQuantityToMove)) && parseFloat(remainingQuantityToMove) > 0)
										quantityToMovewithUOM = parseFloat(remainingQuantityToMove) +" "+stockUnitName;
                                  qtyValidate['quantityToMovewithUOM'] = quantityToMovewithUOM;
								}
							}
							else
							{
								qtyValidate["scannedQuantity"]=Number((Big(scannedQuantity).mul(transactionUomConversionRate)).toFixed(8));


								if(parseFloat(quantityToMove) > 0 && (itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem"))
								{



									remainingQuantityToMove = Number(Big(remainingQuantityToMove).minus(scannedQuantity));

									if((parseFloat(quantityToMove) != parseFloat(remainingQuantityToMove)) && parseFloat(remainingQuantityToMove) > 0)
										quantityToMovewithUOM = parseFloat(remainingQuantityToMove) +" "+stockUnitName;

									log.debug({title:'quantityToMovewithUOM in lot',details:quantityToMovewithUOM});
									qtyValidate['remainingQuantityToMove'] = remainingQuantityToMove;//while onboarding if this value is greater than zero and item type is lot then redirect to inventory quantity
									qtyValidate['quantityToMovewithUOM'] = quantityToMovewithUOM;//this variable is empty if above if condition is false[no need to loop to quantity screen]


									if(scannedStatusList != undefined)
									{
										qtyValidate['scannedStatusList'] = scannedStatusList+","+fromStatusInternalId;
									}
									else
									{
										qtyValidate['scannedStatusList'] = fromStatusInternalId;	
									}
									log.debug({title:'scannedStatusNameList in lot',details:scannedStatusNameList});
									if(scannedStatusNameList != undefined)
									{
										qtyValidate['scannedStatusNameList'] = scannedStatusNameList+","+fromStatusName;
									}
									else
									{
										log.debug({title:'scannedStatusNameList in lot11',details:scannedStatusNameList});
										qtyValidate['scannedStatusNameList'] = fromStatusName;
									}
									if(scannedStatusQtyList != undefined)
									{
										qtyValidate['scannedStatusQtyList'] = scannedStatusQtyList+","+scannedQuantity;
										qtyValidate['scannedStatusQtyListUOM'] = scannedStatusQtyList + ',' + scannedQuantity + ' ' + stockUnitName;
									}
									else
									{
										qtyValidate['scannedStatusQtyList'] = scannedQuantity;
										qtyValidate['scannedStatusQtyListUOM'] = scannedQuantity + ' ' + stockUnitName;
									}
									if(scannedStatusLotList != undefined)
									{
										qtyValidate['scannedStatusLotList'] = scannedStatusLotList+","+lotName;
									}
									else
									{
										qtyValidate['scannedStatusLotList'] = lotName;
									}

									qtyValidate['quantityToMove'] = quantityToMove;

								}
								else
								{
									qtyValidate["scannedQuantityWithUOM"]=scannedQuantity +" "+stockUnitName;
									qtyValidate['fromStatusNamepageInfo'] = fromStatusName;
                                  
									var remainingQuantityToMove = Number(Big(remainingQuantityToMove).minus(scannedQuantity));

									if((parseFloat(quantityToMove) != parseFloat(remainingQuantityToMove)) && parseFloat(remainingQuantityToMove) > 0)
										quantityToMovewithUOM = parseFloat(remainingQuantityToMove) +" "+stockUnitName;
                                  qtyValidate['quantityToMovewithUOM'] = quantityToMovewithUOM;
                                }

								qtyValidate['availbleQuanity'] = availbleQuanity;

								qtyValidate['isValid'] = true;
							}
						}
						else
						{
							if(parseFloat(convertedScannedQty) > parseFloat(availbleQuanity))
							{

								qtyValidate["errorMessage"] = translator.getTranslationString('REPLENISMENT_QTYVALIDATE.QTY_GREATERTHAN_AVAILABLE') +" "+itemName;
								qtyValidate['isValid'] = false;
							}
							else
							{
								qtyValidate["errorMessage"] = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
								qtyValidate['isValid'] = false;
							}
						}
					}

				}
				else
				{

					if(noQuantity=='noQuantity')
					{
						qtyValidate["noQuantity"] = noQuantity;
						//qtyValidate["quantitywithUOM"] = '0';
						qtyValidate["isValid"]=true;
					}
					else
					{
						qtyValidate['errorMessage'] = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
						qtyValidate['isValid'] = false;
					}


				}
			}
			else{

				qtyValidate['errorMessage'] = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
				qtyValidate['isValid'] = false;
			}
		}
		catch(e)
		{
			qtyValidate['isValid'] = false;
			qtyValidate['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug({title:'qtyValidate final',details:qtyValidate});
		return qtyValidate;
	}

	function getItemWiseStatusDetailsInBin(itemInternalId,warehouseLocationId,binInternalId,fromStatusInternalId,lotInternalId){

		var searchObj = search.load({ id : 'customsearch_wmsse_srchres_statuswise',type:search.Type.INVENTORY_BALANCE});


		searchObj.filters.push(search.createFilter({ name :'item',
			operator: search.Operator.ANYOF,
			values: itemInternalId
		}));


		searchObj.filters.push(search.createFilter({ name :'location',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));


		searchObj.filters.push(search.createFilter({ name :'binnumber',
			operator: search.Operator.ANYOF,
			values: binInternalId
		}));


		if (utility.isValueValid(fromStatusInternalId)) {
			searchObj.filters.push(search.createFilter({ name :'status',
				operator: search.Operator.ANYOF,
				values: fromStatusInternalId
			}));

		}

		var alltaskresults = utility.getSearchResultInJSON(searchObj);
		return alltaskresults;
	}

	return {
		'post': doPost  
	};

});
