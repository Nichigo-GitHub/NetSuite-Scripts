/**
 *    Copyright  2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./big','./wms_workOrderUtility','./wms_labelPrinting_utility'],

		function (utility,translator,Big,woUtility,labelPrintingUtility) {

	function doPost(requestBody) {

		var orderDetails={};
		var debugString = '';
		var requestParams = '';		
		var locUseBinsFlag ='';
		try{
			if(utility.isValueValid(requestBody)){

				log.debug({title:'requestBody',details:requestBody});	
				 requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionName = requestParams.transactionName;
				var printEnabled = requestParams.printEnabled;
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionName))
				{	
					var workOrdDtlResults =	woUtility.getWODetailsforAssembly(transactionName,warehouseLocationId);

					if(workOrdDtlResults.length > 0)
					{ 

						var orderStatus =workOrdDtlResults[0]['status'];
						var transactionInternalId =workOrdDtlResults[0]['internalid'];

						if(orderStatus == 'fullyBuilt')
						{
							orderDetails['errorMessage'] =translator.getTranslationString('WORKORDER_ASSEMBLY.ORDER_VALIDATE');
							orderDetails['isValid']=false;
						}
						else
						{
							if(!utility.isValueValid(locUseBinsFlag))
							{
								locUseBinsFlag =utility.lookupOnLocationForUseBins(warehouseLocationId);
							}

							var tempFlag ='true';
							var totalLines ='';
							var assemblyItemQtyObj ={};
							var assemblyitemQty = workOrdDtlResults[0]['quantity'];
							assemblyItemQtyObj[transactionInternalId]= assemblyitemQty;
							var resultsArray = woUtility.checkComponentItemsQty(transactionInternalId,tempFlag,assemblyItemQtyObj,locUseBinsFlag);
							log.debug('resultsArray',resultsArray);
							log.debug('resultsArray',resultsArray[1][transactionInternalId]);
							if(utility.isValueValid(resultsArray) && resultsArray[0] !=0 && parseFloat(resultsArray[1][transactionInternalId])>0)
							{
								totalLines =resultsArray[0];
								//var assemblyitemQty = workOrdDtlResults[0]['quantity'];
								var built=workOrdDtlResults[0]['quantityshiprecv'];
								var itemInternalId =workOrdDtlResults[0]['item'];
								var transactionUomName = workOrdDtlResults[0]['unit'];
								
								var itemDetails = woUtility.getItemStockUOMdetails(itemInternalId,transactionUomName);
								log.debug('itemDetails',itemDetails);
								
								if(utility.isValueValid(itemDetails))
								{
									orderDetails["info_workOrderImageUrl"] = itemDetails['info_imageUrl'];
									orderDetails["stockUnitName"] = itemDetails['stockUnitName'];
									orderDetails["stockCoversionRate"] = itemDetails['stockUomConversionRate'];
									orderDetails["stockUomInternalId"] = itemDetails['stockUomInternalId'];
									orderDetails["transcationUomInternalId"] = itemDetails['transcationUomInternalId'];
									orderDetails["transcationUomConversionRate"] = itemDetails['transcationUomConversionRate'];
									orderDetails["itemType"]=itemDetails["itemType"];
									
								}


								orderDetails['transactionType'] = workOrdDtlResults[0]['type'];
								orderDetails['transactionInternalId'] = transactionInternalId;
								orderDetails['transactionName'] = workOrdDtlResults[0]['tranid'];//transactionName;
								orderDetails['itemName'] =  workOrdDtlResults[0]['itemText'];
								orderDetails['built'] =built;
								orderDetails['buildable'] =Number(resultsArray[1][transactionInternalId]);
								orderDetails['assemblyItemQuantity']= Number(Big(assemblyitemQty));								
								orderDetails['Units']=workOrdDtlResults[0]['Units'];
								orderDetails['info_transactionName'] = workOrdDtlResults[0]['tranid'];//transactionName;
								orderDetails['info_workOrderItemName'] =  workOrdDtlResults[0]['itemText'];
								orderDetails['info_lines'] = totalLines;
								orderDetails['itemInternalId'] =  workOrdDtlResults[0]['item'];		
								orderDetails['transactionUomName'] = workOrdDtlResults[0]['unit'];
								orderDetails['isValid']=true;
								orderDetails['isItemAliasPopupRequired'] = false;
								if(printEnabled)
								{
									var isGS1Enabled = labelPrintingUtility.checkGS1Enable(warehouseLocationId);
									if(utility.isValueValid(itemInternalId) && (utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true))
									{
										var itemAliasList = labelPrintingUtility.getAllItemAliasResultsForPrint(itemInternalId,'',warehouseLocationId);
										if (itemAliasList.length > 1) {
												orderDetails['isItemAliasPopupRequired'] = true;
										}
									}
								}
							}
							else
							{
								orderDetails['errorMessage'] =translator.getTranslationString('WORKORDER_ASSEMBLY.INVALID_VALIDATE');
								orderDetails['isValid']=false;
							}
						}
					}
					else{
						orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
						orderDetails['isValid']=false;
					}


				}
				else{
					orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
					orderDetails['isValid']=false;
				}
			}else{
				orderDetails['isValid']=false;
			}

		}catch(e){
			orderDetails['isValid'] = false;
			orderDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug('orderDetails--',orderDetails);

		return orderDetails;
	}



	return{
		'post' : doPost
	}
});