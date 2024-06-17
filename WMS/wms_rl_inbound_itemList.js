/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./big','./wms_translator', './wms_inboundUtility','N/query','N/runtime','N/record','N/search'],
		/**
		 * @param {search} search
		 */
		function(utility,Big,translator, inboundUtility,query,runtime,record,search) {

	/**
	 * This function is to fetch the items of a purchase order
	 */
	function doPost(requestBody) {
		var itemListDetails = {};
		var debugString = '';
		try{
			if(utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				var transactionName = requestParams.transactionName;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var warehouseLocationName = requestParams.warehouseLocationName;
				var transcationType = requestParams.transactionType;
				var boolShowCompletedItems = requestParams.showCompletedItems;
				var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
                var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
				var printEnabled = requestParams.printEnabled;
				itemListDetails.printEnabled =printEnabled;
				if(utility.isValueValid(transactionName) && utility.isValueValid(warehouseLocationId)) {
					var itemListObj = inboundUtility.getRecevingOrderItemDetails(transactionName,null, warehouseLocationId, null,null,null,transcationType,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName);
					debugString = debugString + "itemListObj :"+itemListObj;
					log.debug('itemListObj',itemListObj);

					if(!utility.isValueValid(itemListObj)|| itemListObj.length == 0)
					{
						itemListDetails['isValid'] = false;
					}
					else
					{
						var orderId = itemListObj[0]['internalid'];
						if(utility.isValueValid(locUseBinsFlag) && locUseBinsFlag ==true) {
						var itemList = this.knitCalculatedColumns(itemListObj,warehouseLocationId,openPutAwayDetails,transcationType,boolShowCompletedItems,orderId);
						itemListDetails['itemList'] = itemList;
						itemListDetails['isValid'] = true;

					}
				}
				else{
					var itemListDetails ={
							errorMessage:translator.getTranslationString('PO_ITEMLIST.NOMATCH'),
							isValid: false
					};
				}
			}
			else{
				var itemListDetails ={
						errorMessage:translator.getTranslationString('PO_ITEMLIST.NOMATCH'),
						isValid: false
				};
			}
			debugString = debugString + "itemListDetails :"+itemListDetails;
		}
		catch(e)
		{
			itemListDetails['isValid'] = false;
			itemListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}
		return itemListDetails;
	}

	function generateItemList(searchResult,warehouseLocationId,openPutAwayDetails,transcationType,boolShowCompletedItems, orderInternalId)
	{
		var completedItems = [];
		var pendingitemstoReceive = [];
		if(transcationType == 'transferorder')
		{
			var toLineReceivedQty = 0;
			var toItemOpentaskRcvQty = 0;
			var toLineRemainingQty = 0;
			var toLineFulfilledQty = 0;
			for (var i in openPutAwayDetails) {
				for (var k in searchResult) {
					if(searchResult[k]['line']  == i )
					{
						toItemOpentaskRcvQty = openPutAwayDetails[i];
						toLineReceivedQty = searchResult[k]['totalReceivedQty'];
						toLineRemainingQty =searchResult[k]['TransferOrderLine_Remainingqty'];
						searchResult[k]['totalReceivedQty'] = Number(Big(toLineReceivedQty).plus(toItemOpentaskRcvQty)); 
						searchResult[k]['TransferOrderLine_Remainingqty'] = Number(Big(toLineRemainingQty).minus(toItemOpentaskRcvQty));
						break;
					}
				}
			}

			for (var result in searchResult) {
				var unitText = searchResult[result]["unitText"];
				var toLineReceivedQty = searchResult[result]['totalReceivedQty'];
				var toLineFulfilledQty = searchResult[result]['TransferOrderLine_Fulfilledquantity'];
				var toLineRemainingQty =searchResult[result]['TransferOrderLine_Remainingqty'];
				if(toLineReceivedQty > 0)
				{
					searchResult[result]['totalReceivedQtyWithUom'] = toLineReceivedQty+" "+unitText;
				}
				else
				{
					searchResult[result]['totalReceivedQtyWithUom'] = toLineReceivedQty;	
				}
				if(toLineRemainingQty > 0)
				{
					searchResult[result]['TransferOrderLine_RemainingqtyWithUom'] = toLineRemainingQty+" "+unitText;
				}
				else
				{
					searchResult[result]['TransferOrderLine_RemainingqtyWithUom'] = toLineRemainingQty;
				}
				if(toLineFulfilledQty == toLineReceivedQty)
				{
					completedItems.push(searchResult[result]);	
				}
				else
				{
					pendingitemstoReceive.push(searchResult[result]);
				}
			}

		}
		else
		{
			
			var itemOpentaskRcvQty =0;
			var lineReceivedQty = 0;
			var lineRemainingQty=0;
			var ismFeatureEnabled = inboundUtility.isISMFeatureEnabled();
			var ismqtyresults = [];
			if(ismFeatureEnabled){
				ismqtyresults = inboundUtility.ismReceivedquantity(orderInternalId, warehouseLocationId);
			}
			//var unitText;
			for (var i in openPutAwayDetails) {
				for (var k in searchResult) {
					if(searchResult[k]['line']  == i )
					{
						itemOpentaskRcvQty = openPutAwayDetails[i];
						lineReceivedQty = searchResult[k]['totalReceivedQty'];
						if(transcationType == 'purchaseorder')
						{
											lineRemainingQty =searchResult[k]['poRemainingQty'];
											searchResult[k]['poRemainingQty'] = Number(Big(lineRemainingQty).minus(itemOpentaskRcvQty));
											searchResult[k]['poRemainingQty'] = searchResult[k]['poRemainingQty'] >= 0 ? searchResult[k]['poRemainingQty'] : 0;
						}
						else
						{
							lineRemainingQty =searchResult[k]['rmaRemainingQty'];	
							searchResult[k]['rmaRemainingQty'] = Number(Big(lineRemainingQty).minus(itemOpentaskRcvQty));
							searchResult[k]['rmaRemainingQty'] = searchResult[k]['rmaRemainingQty'] >= 0 ? searchResult[k]['rmaRemainingQty'] : 0;
						}
						searchResult[k]['totalReceivedQty'] = Number(Big(lineReceivedQty).plus(itemOpentaskRcvQty)); 

						break;
					}
				}
			}

			var assemblyItemLineNoArray =[];
			for (var result in searchResult) {
				var unit = searchResult[result]['unit'];
				var unitText = searchResult[result]['unitText'];
				lineReceivedQty = searchResult[result]['totalReceivedQty'];
				var itemType = searchResult[result]['itemtype'];
				var orderLineno = searchResult[result]['line'];

				if(transcationType == 'returnauthorization' && itemType == "Assembly") {
					if (assemblyItemLineNoArray.indexOf(orderLineno) != -1) {						
						continue;
					}
					else {
						assemblyItemLineNoArray.push(orderLineno);						
					}
				}
				log.debug('lineReceivedQty',lineReceivedQty);
				if(transcationType == 'purchaseorder')
				{
                    if (ismFeatureEnabled && searchResult[result]['quantityonshipments']) {
                        var quanitityReceivedInISM = 0;
                        for(var ismqtyIterator in ismqtyresults) {
                            if(ismqtyresults[ismqtyIterator]['line'] == searchResult[result]['line']) {
                                quanitityReceivedInISM = parseFloat(ismqtyresults[ismqtyIterator]['quantityreceived']);
									break;
								}
								}
                quanitityReceivedInISM = quanitityReceivedInISM ? quanitityReceivedInISM : 0;
						  lineReceivedQty = lineReceivedQty ? lineReceivedQty : 0;
                        searchResult[result]['poRemainingQty'] = Number(Big(searchResult[result]['poRemainingQty']).plus(quanitityReceivedInISM).minus(searchResult[result]['quantityonshipments']));
						lineReceivedQty = Number(Big(lineReceivedQty).minus(quanitityReceivedInISM));
						}
						lineRemainingQty = searchResult[result]['poRemainingQty'] >= 0 ? searchResult[result]['poRemainingQty'] : 0;
					if(lineRemainingQty > 0)
					{
						searchResult[result]['poRemainingQtyWithUom'] = lineRemainingQty+" "+unit;
					}
					else
					{
						searchResult[result]['poRemainingQtyWithUom'] = lineRemainingQty;	
					}
				}
				else
				{
					lineRemainingQty = searchResult[result]['rmaRemainingQty'] >= 0 ? searchResult[result]['rmaRemainingQty'] : 0;

					if(lineRemainingQty > 0)
					{
						searchResult[result]['rmaRemainingQtyWithUom'] = lineRemainingQty+" "+unitText;
					}
					else
					{
						searchResult[result]['rmaRemainingQtyWithUom'] = lineRemainingQty;	
					}
				}

				if(lineReceivedQty > 0)
				{
					if(transcationType == 'purchaseorder')
					{
						searchResult[result]['totalReceivedQtyWithUom'] = lineReceivedQty+" "+unit;
					}
					else
					{
						searchResult[result]['totalReceivedQtyWithUom'] = lineReceivedQty+" "+unitText;
					}
				}
				else
				{
					searchResult[result]['totalReceivedQtyWithUom'] = lineReceivedQty;	
				}

				if(lineRemainingQty <= 0)
				{
					completedItems.push(searchResult[result]);	
				}
				else
				{
					pendingitemstoReceive.push(searchResult[result]);
				}
			}

		}
		if(boolShowCompletedItems == true || boolShowCompletedItems == 'true')
		{
			return completedItems;
		}
		else
		{
			return pendingitemstoReceive;
		}
	}
	return {
		'post': doPost,
		knitCalculatedColumns : generateItemList


});