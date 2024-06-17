/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./big','./wms_workOrderUtility','./wms_tallyScan_utility'],

		function (utility, translator, Big, woUtility, tallyScanUtility) {

	function doPost(requestBody) {

		var orderDetails={};

		var debugString = '';
		var requestParams = '';

		try{
			if(utility.isValueValid(requestBody)){
				log.debug({title:'requestBody',details:requestBody});	
				   requestParams = requestBody.params;
				var whLocation = requestParams.warehouseLocationId;
				var transactionName = requestParams.transactionName;
				var transactionType = requestParams.transactionType;
				var itemInternalId = requestParams.itemInternalId;
				var componentItemType = requestParams.itemType;
				var transactionLineNo = requestParams.transactionLineNo;
				var transactionInternalId = requestParams.transactionInternalId;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var processNameFromState = requestParams.processNameFromState;
				var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;
				var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;
				var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;
				var binInternalIdArr = [];
				if(utility.isValueValid(whLocation) && utility.isValueValid(itemInternalId) && utility.isValueValid(transactionInternalId)
						&& utility.isValueValid(transactionLineNo) && utility.isValueValid(transactionName) )
				{ workorderOverpickingFlag = workorderOverpickingFlag || false;
					if(!utility.isValueValid(locUseBinsFlag))
					{
						locUseBinsFlag =utility.lookupOnLocationForUseBins(whLocation);
					}
					var lockError = utility.checkTransactionLock(transactionType,transactionInternalId, transactionLineNo);
					log.debug({title:'lockError',details:lockError});
					if(utility.isValueValid(lockError)){
						orderDetails.isValid = false;
						orderDetails.errorMessage = lockError;
					} else 
					{ 
						var workOrdDtlResults =	woUtility.fnToValidateWO(transactionName,itemInternalId,transactionLineNo,'',inventoryDetailLotOrSerialId);

						if(workOrdDtlResults.length > 0)
						{	
							var vwoitemQty= utility.isValueValid(workOrdDtlResults[0].quantity) ? workOrdDtlResults[0].quantity : workOrdDtlResults[0]['Committed Qty'];
							var vwoitemRcvQty = workOrdDtlResults[0].quantityshiprecv;
							var qty= workOrdDtlResults[0].quantity;
							var qtyuom = workOrdDtlResults[0].quantityuom;
							var units = workOrdDtlResults[0].unitText;
							if(vwoitemQty > 0){
								vwoitemQty = parseFloat(vwoitemQty)/(parseFloat(qty)/parseFloat(qtyuom));
								vwoitemRcvQty =  parseFloat(vwoitemRcvQty)/(parseFloat(qty)/parseFloat(qtyuom));
								var vWoreminqty =0;
								var opentaskQty =0;
								if(vwoitemQty == null || vwoitemQty == '')
									vwoitemQty=0;
								if(vwoitemRcvQty==null || vwoitemRcvQty=='')
									vwoitemRcvQty=0;

								if(componentItemType == "NonInvtPart" || componentItemType=="OthCharge" || componentItemType=="Service" ||
										componentItemType=="DwnLdItem" || componentItemType=="GiftCert" || componentItemType=="noninventoryitem")
								{
									vWoreminqty = parseFloat(vwoitemQty);
								}
								else
								{
									vWoreminqty = utility.isValueValid(workOrdDtlResults[0].Quantity) ? parseFloat(vwoitemQty): Number(Big(vwoitemQty).plus(vwoitemRcvQty));
								}
								orderDetails.transactionquantity = parseFloat(vWoreminqty.toFixed(8));
								if(vWoreminqty>0)
								{ 
									var selectedConversionRate ='';
									var objItemDtl ={};
									var opentaskDetails= woUtility.getOpentaskPickQtyDetails(transactionInternalId,itemInternalId,transactionLineNo);
									
									if(opentaskDetails.length > 0){
									var woPickQtyResultswithInventoryNumber = woUtility.getOpentaskQtyWithInventoryNumber(transactionInternalId,itemInternalId,transactionLineNo);
									woUtility.updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber,objItemDtl);
										if(utility.isValueValid(inventoryDetailLotOrSerialText)){
                                           var objLinedata = objItemDtl[itemInternalId];
                                           var qtyObj = objLinedata[transactionLineNo];
                                           opentaskQty = utility.isValueValid(qtyObj[inventoryDetailLotOrSerialText]) ? qtyObj[inventoryDetailLotOrSerialText] : 0;
                                        }else{
										opentaskQty = opentaskDetails[0].custrecord_wmsse_act_qty;
                                       }
									}
                                    
									log.debug('opentaskQty',opentaskQty);
									vWoreminqty = Number(Big(vWoreminqty).minus(opentaskQty));
									
									if((vWoreminqty > 0) ||((vWoreminqty<0 || vWoreminqty ==0 ) && (workorderOverpickingFlag)))
									{
										orderDetails.transactionName = transactionName;	
									orderDetails.transactionInternalId = workOrdDtlResults[0].internalid;
									orderDetails.transactionLineNo  = transactionLineNo;
									orderDetails.itemInternalId = itemInternalId;
									orderDetails.itemType  = utility.getItemType(itemInternalId);
									orderDetails.transactionType  = transactionType;
									if(vWoreminqty<0)
									{
										orderDetails.remainingQuantity = 0;
									}
									else {
									orderDetails.remainingQuantity  = parseFloat(vWoreminqty.toFixed(8));
									}
									orderDetails.transactionUomName = units;
									orderDetails.isInventoryTypeItem = woUtility.isInventoryTypeItem(orderDetails.itemType);

									var columnArray =[];
									columnArray.push('name');
									columnArray.push('unitstype');
									columnArray.push('stockunit');				

									var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);

									log.debug('itemLookUp',itemLookUp);
									var stockunitText;
									if(utility.isValueValid(itemLookUp.unitstype[0])){
										orderDetails.unitsType = itemLookUp.unitstype[0].value ;
									}

										if(!orderDetails.isInventoryTypeItem || locUseBinsFlag == false){
											
										if (itemLookUp.name != undefined)
										{
											orderDetails.itemName = itemLookUp.name;
										}
									}

									if(utility.isValueValid(orderDetails.unitsType)){
										
										var uomObj = woUtility.getUomDetails(orderDetails.unitsType, orderDetails.transactionUomName);
										if(utility.isValueValid(uomObj)){
											orderDetails.transcationUomInternalId = uomObj.UomInternalId;
											orderDetails.transactionUomConversionRate = uomObj.uomConversionRate;
											
												orderDetails.uomList = uomObj.uomList;
												orderDetails.uomDefaultStatus = orderDetails.transactionUomName;
											
										}
										log.debug('itemLookUpstock',itemLookUp.stockunit[0]);
										if(itemLookUp.stockunit[0]!=null && itemLookUp.stockunit[0]!='' && itemLookUp.stockunit[0]!='undefiend')
												stockunitText=itemLookUp.stockunit[0].text;

											var stockuomObj = woUtility.getUomDetails(orderDetails.unitsType, stockunitText);
										if(utility.isValueValid(stockuomObj)){
											orderDetails.stockUnitInternalId = stockuomObj.UomInternalId;
											orderDetails.stockUomConversionRate = stockuomObj.uomConversionRate;
											selectedConversionRate = stockuomObj.uomConversionRate;
										}
										
									}

									log.debug({title:'selectedConversionRate',details:selectedConversionRate});	
									var isValid =true;
										if(locUseBinsFlag !== false)
										{
											getRecommendedBinDetails(itemInternalId,componentItemType,whLocation,vWoreminqty,orderDetails,
													binInternalIdArr,orderDetails.itemType,inventoryDetailLotOrSerialId,inventoryDetailLotOrSerialText);

											if(utility.isValueValid(inventoryDetailLotOrSerialId) && (workorderOverpickingFlag)){
											
												if(!utility.isValueValid(orderDetails.recommendedBinQty))
												{
													isValid =false;
												}
											}
										}
										if(isValid != false) {
										//tally scan starts here
										orderDetails.availbleQuanity = orderDetails.remainingQuantity;
										orderDetails.processNameFromState = processNameFromState;
										orderDetails.unitType = orderDetails.unitsType;
										orderDetails.transactionuomId = orderDetails.transcationUomInternalId;
										orderDetails.getStockConversionRate = orderDetails.transactionUomConversionRate;
										orderDetails.transactionUomName = orderDetails.transactionUomName;
										orderDetails.warehouseLocationId = whLocation;
										orderDetails.inventoryDetailLotOrSerialId = inventoryDetailLotOrSerialId;
										orderDetails.inventoryDetailLotOrSerialText = inventoryDetailLotOrSerialText;

										log.debug('orderDetails to tallyscan',orderDetails);
										orderDetails = tallyScanUtility.isTallyScanEnabled(orderDetails,'');
										orderDetails.transactionUomName = units;

									orderDetails.isValid = true;
										}
										else
										{
											orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INSUFFICIENT_INVENTORY');
											orderDetails.isValid=false;
										}
									}
									else
									{
										orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.ITEM_PICKED');
										orderDetails.isValid=false;
									}
								}
								else
								{
									orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.ITEM_BACKORDER');
									orderDetails.isValid=false;
								}
							}else
							{
								orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.ITEM_BACKORDER');
								orderDetails.isValid=false;
							}

						}
						else
							orderDetails.isValid=false;	
					}			
				}
				else{
					orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
					orderDetails.isValid=false;
				}
			}else{
				orderDetails.isValid=false;
			}

		}catch(e){
			orderDetails.isValid = false;
			orderDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug('orderDetails--',orderDetails);

		return orderDetails;
	}

	function getRecommendedBinDetails(itemInternalId,componentItemType,whLocation,vWoreminqty,orderDetails,binInternalIdArr,itemType,inventoryDetailLotOrSerialId,inventoryDetailLotOrSerialText)
	{
		var objBinDetails = '';
		var itemStatus = '';
		var binQty = '';
		if(!(utility.nonInventoryItemTypeCheck(componentItemType)))
		{	
			var isInvStatusFeatureEnabled  = utility.isInvStatusFeatureEnabled();
			var itemObjDtl = {};
			itemObjDtl.itemInternalId = itemInternalId;
			itemObjDtl.location = whLocation;
			itemObjDtl.qtyToPick = vWoreminqty;
			itemObjDtl.inventoryNumberId = inventoryDetailLotOrSerialId;
			var transactionUOMInternalId = orderDetails.transcationUomInternalId;
			var transactionUOMConversionrate = orderDetails.transactionUomConversionRate;
			if(utility.isValueValid(transactionUOMInternalId)){
				itemObjDtl.selectedUnitId = transactionUOMInternalId;
			}
			objBinDetails=utility.getRecommendedBins(itemObjDtl , 'workorder');
			log.debug({title:'objBinDetails',details:objBinDetails});	

			for(var binIndex=0;binIndex<objBinDetails.length;binIndex++)
			{
				binInternalIdArr.push(objBinDetails[binIndex].bininternalid);

			}
			var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, binInternalIdArr, whLocation,'',
				'','','',itemType,inventoryDetailLotOrSerialText);
			log.debug({title:'openTaskPickBinDtls',details:openTaskPickBinDtls});	
			for(var openTaskIndex=0;openTaskIndex<openTaskPickBinDtls.length;openTaskIndex++)
			{
				var binId = openTaskPickBinDtls[openTaskIndex].custrecord_wmsse_actendloc;
				var quantity = openTaskPickBinDtls[openTaskIndex].actualQuantityInBaseUnits;
				for(var objBinIndex=0;objBinIndex<objBinDetails.length;objBinIndex++)
				{
					if(objBinDetails[objBinIndex].bininternalid == binId  ){						
						if(isInvStatusFeatureEnabled){
							itemStatus = openTaskPickBinDtls[openTaskIndex].custrecord_wmsse_inventorystatusText;
							if (objBinDetails[objBinIndex].status == itemStatus){ 
								binQty = objBinDetails[objBinIndex].availableqty;
								log.debug({title:'binQty :',details:binQty});
								if(utility.isValueValid(transactionUOMConversionrate))  
									quantity = utility.uomConversions(quantity,transactionUOMConversionrate,1);
								quantity = new Big(quantity);
								objBinDetails[objBinIndex].availableqty = (new Big(binQty)).minus(quantity)  ;
								if(objBinDetails[objBinIndex].availableqty <= 0){
									objBinDetails.splice(objBinIndex,1);
									objBinIndex--;
								}
							}
						}else{
							log.debug({title:'else',details:'else'});
							binQty = objBinDetails[objBinIndex].availableqty;
							if(utility.isValueValid(transactionUOMConversionrate))  
								quantity = utility.uomConversions(quantity,transactionUOMConversionrate,1);
							quantity = new Big(quantity);
							objBinDetails[objBinIndex].availableqty = (new Big(binQty)).minus(quantity)  ;
							if(objBinDetails[objBinIndex].availableqty <= 0){
								objBinDetails.splice(objBinIndex,1);
								objBinIndex--;
							}

						}

					}
				}
			}
			log.debug({title:'objBinDetails after:',details:objBinDetails});
			if(objBinDetails.length > 0)
			{
				orderDetails.binInternalId=objBinDetails[0].bininternalid;
				orderDetails.recommendedbin=objBinDetails[0].binnumber;
				if(isInvStatusFeatureEnabled){
					var totalRecommemdedBinQty = geQuantityOfAllStatusInBin(objBinDetails);
					orderDetails.recommendedBinQty= totalRecommemdedBinQty;
				}
				else{
					orderDetails.recommendedBinQty= Big(objBinDetails[0].availableqty);
				}
				orderDetails.itemName=objBinDetails[0].itemName;
				orderDetails.itemInternalId=objBinDetails[0].itemInternalId;
				orderDetails.info_binName=objBinDetails[0].binnumber;
			}
		}
	}
	function geQuantityOfAllStatusInBin(objBinDetails){
		var totalQuantity = 0;
		var binInternalId  = objBinDetails[0].bininternalid;
		for(var objBinIndex=0;objBinIndex<objBinDetails.length;objBinIndex++)
		{
			if(binInternalId == objBinDetails[objBinIndex].bininternalid){
				totalQuantity = Number(Big(totalQuantity).plus(objBinDetails[objBinIndex].availableqty));
			}
		}
		if(totalQuantity>0){
			totalQuantity = Big(totalQuantity);
		}
		return totalQuantity;
	}
	return{
		'post' : doPost
	}
});