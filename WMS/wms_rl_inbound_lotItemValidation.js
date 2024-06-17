/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','N/search','./wms_translator','./big', './wms_inboundUtility'],

		function (utility,search,translator,Big, inboundUtility) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {
		var debugString = '';
		var lotItemDetails = {};
		var  resultArray = [];
		try{
			if (utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				var trantype = requestParams.transactionType;//requestParams.
				var getOrderInternalId = requestParams.orderInternalId;
				var getOrderLineNo = requestParams.orderLineNo;
				var getItemInternalId = requestParams.itemInternalId;
				var whLocation = requestParams.warehouseLocationId;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var transactionUomName = requestParams.transactionUomName;
				var itemType = requestParams.itemType;

				
				if (utility.isValueValid(getOrderInternalId) && utility.isValueValid(getOrderLineNo) 
						&& utility.isValueValid(getItemInternalId) && utility.isValueValid(whLocation) && utility.isValueValid(trantype)) {
					var getOrderItem;


					var lockErrorMsg = utility.checkTransactionLock(trantype, getOrderInternalId, getOrderLineNo);
					if (lockErrorMsg != null) {
						lotItemDetails.errorMessage = lockErrorMsg;
						lotItemDetails.isValid = false;
						return lotItemDetails;
					}
					var itemresults = inboundUtility.getItemSearchDetails(getItemInternalId,whLocation);

					if (itemresults != null && itemresults.length > 0) {
						var itemResultObj = itemresults[0];
						//var itemLoc = itemResultObj['location']; commented as part of WMSLITE-6979
						var itemLoc = itemResultObj.Location;
						getOrderItem = itemResultObj.itemid;
						var stockText =itemResultObj.stockunitText;
						lotItemDetails.getOrderItem = getOrderItem;
						if(utility.isValueValid(stockText)&& utility.isValueValid(transactionUomName)){
							stockText = transactionUomName;
						}

						if (itemResultObj.isinactive == true) {
							lotItemDetails.errorMessage = translator.getTranslationString('PO_LOTITEMVALIDATION.INACTIVE_ITEM');
							lotItemDetails.isValid = false;
							return lotItemDetails;
						}
						else if ((utility.isValueValid(itemLoc)) && (itemLoc != whLocation)) {
							lotItemDetails.errorMessage = translator.getTranslationString('PO_LOTITEMVALIDATION.WAREHOUSE_NOT_MATCHED');
							lotItemDetails.isValid = false;
							return lotItemDetails;
						}
						if(trantype=='transferorder')
						{
							getOrderLineNo = parseInt(getOrderLineNo)+1;
							var transferOrderLotFulfillmentDetails = inboundUtility.getTOfulfilledLotDetails(getOrderInternalId,getItemInternalId,getOrderLineNo);
							debugString = debugString + "transferOrderLotFulfillmentDetails :"+transferOrderLotFulfillmentDetails;
							log.debug({title:'transferOrderLotFulfillmentDetails',details:transferOrderLotFulfillmentDetails});
							var lotDetails = [];
							var lotNumberArray = [];
							if (transferOrderLotFulfillmentDetails != null && transferOrderLotFulfillmentDetails.length > 0) {
								var	 transferOrderLotReceiptDetails = inboundUtility.getTransferOrderItemReceiptDetails(getOrderInternalId,getOrderLineNo);
								log.debug({title:'transferOrderLotReceiptDetails',details:transferOrderLotReceiptDetails});

								var lotNumber='';
								var lotQuantity =0;
								getOrderLineNo = parseInt(getOrderLineNo)-1;
								if(!utility.isValueValid(transactionUomConversionRate)){
									transactionUomConversionRate = 1;
								}
								for (var i in transferOrderLotFulfillmentDetails) {
									var objLotDetails = {};
									var orderObj = transferOrderLotFulfillmentDetails[i];  
									lotNumber = orderObj.serialnumber;
									lotQuantity = Big(orderObj.serialnumberquantity).mul(-1);     

									if(lotQuantity > 0)
									{
										lotQuantity = Number(Big(lotQuantity).div(transactionUomConversionRate));
										if(lotNumberArray.indexOf(lotNumber) == -1)
										{
											lotNumberArray.push(lotNumber);
											objLotDetails.lotName=lotNumber;
											objLotDetails.lotQuantity=lotQuantity; 
											objLotDetails.lotQuantityWithUOM=lotQuantity +" "+stockText; 
											lotDetails[lotDetails.length]=objLotDetails;
										}
										else
										{
											for(var toLotDetail in lotDetails)
											{
												var toLotDetailObj = lotDetails[toLotDetail];
												var lotName = toLotDetailObj.lotName;
												if(lotNumber == lotName)
												{
													var lotQty = toLotDetailObj.lotQuantity;
													var totalQuantity = parseFloat(lotQty)+parseFloat(lotQuantity);
													toLotDetailObj .lotQuantity = totalQuantity;
													var quantitywithUOMText = totalQuantity +" "+stockText;
													toLotDetailObj .lotQuantityWithUOM = quantitywithUOMText;
												}

											}

										}
									}

								}
								
								if(lotDetails.length > 0)
								{
									var opentaskResults = inboundUtility.getTransferOrderOpenTaskDetails(getItemInternalId,getOrderInternalId,getOrderLineNo,whLocation);
									var alreadyScannedSerialsObj = {};
									if(itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'){
										alreadyScannedSerialsObj = getScannedSerials(getOrderInternalId,getItemInternalId,getOrderLineNo);
									}
									
									for (var ind in lotDetails)
									{
										var row = lotDetails[ind];
										var lotNumber = row.lotName;
										if(opentaskResults != null && opentaskResults.length > 0)
										{
											var opentaskLotQuantity = 0;
											for(var openTaskItr = 0; openTaskItr < opentaskResults.length; openTaskItr++)
											{
												var opentaskQty = opentaskResults[openTaskItr].custrecord_wmsse_act_qty;
												var opentaskLotNumber = opentaskResults[openTaskItr].custrecord_wmsse_batch_num;
												if(opentaskQty == '' || opentaskQty == null || opentaskQty == undefined 
														|| isNaN(opentaskQty))
												{
													opentaskQty = 0;
												}
												if(opentaskLotNumber == lotNumber && opentaskQty > 0)
												{
													opentaskLotQuantity =  Number(Big(opentaskLotQuantity).plus(opentaskQty)); 

												}
											}
											if(parseFloat(opentaskLotQuantity)>0)
											{
												var lotQuantity =  row.lotQuantity;
												var totalQuantity  = Number(Big(lotQuantity).minus(opentaskLotQuantity)); 
												row.lotQuantityWithUOM  = totalQuantity +" "+ stockText;
												row.lotQuantity  = totalQuantity;
											}
										}
										var statsuReceivedQuantity = 0;
										if(transferOrderLotReceiptDetails.length > 0)
										{
											var lotQuantity =  row.lotQuantity;
											for(var receiptDetail in transferOrderLotReceiptDetails)
											{
												var orderObj = transferOrderLotReceiptDetails[receiptDetail];  
												var receivedLotNumber = orderObj.serialnumber;
												var receivedLotQuantity = orderObj.serialnumberquantity;
												receivedLotQuantity = Number((Big(receivedLotQuantity).div(transactionUomConversionRate)).toFixed(8));
												if(receivedLotNumber == lotNumber)
												{
													statsuReceivedQuantity = Number(Big(statsuReceivedQuantity).plus(receivedLotQuantity));
												}
											}
										}
										if(parseFloat(statsuReceivedQuantity) > 0 )
										{
											var lotQuantity =  row.lotQuantity;
											var totalQty = Number((Big(lotQuantity).minus(statsuReceivedQuantity)).toFixed(8));
											row.lotQuantityWithUOM  = totalQty +" "+ stockText;
											row.lotQuantity  = totalQty;
										}
										
										var qty = row.lotQuantity;
										
										if(parseFloat(qty) > 0)
										{
											if(alreadyScannedSerialsObj != undefined){
												if(alreadyScannedSerialsObj[lotDetails[ind].lotName] != true){
													resultArray.push(lotDetails[ind]);
												}
											}
											else{
												resultArray.push(lotDetails[ind]);
											}
										}
									}
								}
								log.debug({title:'lotDetails',details:lotDetails});
								debugString = debugString + "objLotDetails :"+objLotDetails;
							}
							else
							{
								lotItemDetails.errorMessage = translator.getTranslationString('PO_LOTITEMVALIDATION.INVALID_ITEM');
								lotItemDetails.isValid = false;
							}
							if(lotDetails!=null && lotDetails.length>0)
							{
								lotItemDetails.lotList=resultArray;
								lotItemDetails.isValid = true;
							}
						}
						else
						{
							lotItemDetails.isValid = true;
						}
						debugString = debugString + "lotItemDetails :"+lotItemDetails;
						return lotItemDetails;
					}
					else {
						lotItemDetails.errorMessage = translator.getTranslationString('PO_LOTITEMVALIDATION.INVALID_ITEM');
						lotItemDetails.isValid = false;
						return lotItemDetails;
					}
				}
				else{
					var lotItemDetails = {
							isValid :  false,
							errorMessage : translator.getTranslationString('PO_LOTITEMVALIDATION.NOMATCH')
					};
					return lotItemDetails;
				}
			}
			else{
				var lotItemDetails = {
						isValid :  false,
						errorMessage : translator.getTranslationString('PO_LOTITEMVALIDATION.NOMATCH')
				};
				return lotItemDetails;
			}
		}
		catch(e)
		{
			lotItemDetails.isValid = false;
			lotItemDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
			return lotItemDetails;
		}
	}
	function getScannedSerials(orderInternalId,itemInternalId,orderLineNo){

		
		var serialSearch = search.load({

			id: 'customsearch_wmsse_wo_serialentry_srh',

		});

		var serailFilters = serialSearch.filters;

		if(utility.isValueValid(orderInternalId)){

			serailFilters.push(search.createFilter({

				name: 'custrecord_wmsse_ser_ordno',

				operator: search.Operator.ANYOF,

				values: orderInternalId

			}));

		}
		if(utility.isValueValid(orderLineNo)){

			serailFilters.push(search.createFilter({

				name: 'custrecord_wmsse_ser_ordline',

				operator: search.Operator.ANYOF,

				values: orderLineNo

			}));

		}

		if(utility.isValueValid(itemInternalId)){

			serailFilters.push(search.createFilter({

				name: 'custrecord_wmsse_ser_item',

				operator: search.Operator.ANYOF,

				values: itemInternalId

			}));

		}

		serailFilters.push(search.createFilter({

			name: 'custrecord_wmsse_ser_status',

			operator: search.Operator.IS,

			values: false				

		}));

		serialSearch.filters = serailFilters;

		var results =  utility.getSearchResults(serialSearch);
		var resultObj = {};
		 if(results.length > 0){
			 for(var len = 0; len < results.length; len++){
				 resultObj[results[len].getValue({name:'custrecord_wmsse_ser_no'})] = true;
			 }
		 }
		log.debug('resultObj',resultObj);
		
    return resultObj;
	}


	return {
		'post': doPost,

	};

});
