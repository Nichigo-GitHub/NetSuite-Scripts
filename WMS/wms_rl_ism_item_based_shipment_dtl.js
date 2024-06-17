/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_inboundUtility','./big'],
		function(search,utility,translator,inboundUtility,Big) {

	/**
	 * This function is to fetch PO details based on the item
	 */
	function doPost(requestBody) {
		var response = {};
		var warehouseLocationId = '';
		var action = '';
		var itemInternalId = '';
		var itemName = '';
		var debugString = '';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams 	= requestBody.params;
				debugString 	  	= debugString + ",requestParams :"+requestParams;
				warehouseLocationId = requestParams.warehouseLocationId;
				action 				= requestParams.action;
				itemInternalId 		= requestParams.itemId;
				itemName 			= requestParams.itemName;
				var shipmentInputObj = {}; 

				if((utility.isValueValid(itemInternalId) || utility.isValueValid(itemName)) &&  utility.isValueValid(warehouseLocationId))
				{
					if(utility.isValueValid(action) && action == 'getShipmentDetails')
					{
						var itemShipmentsListObj = inboundUtility.getItemShipmentList(itemInternalId , warehouseLocationId);

						if(itemShipmentsListObj.length != 0)
						{
							for(var itemListInd = 0 ; itemListInd < itemShipmentsListObj.length;){
								var changeIndexforSplice = false;
								var shipmentLineReceivedQty = itemShipmentsListObj[itemListInd].quantityreceived;
								var shipmentLineExpQuantity = itemShipmentsListObj[itemListInd].quantityexpected;
								var remainingQty = itemShipmentsListObj[itemListInd].quantityremaining;
								var shipmentId = itemShipmentsListObj[itemListInd].internalid;
									if(parseFloat(remainingQty) > 0){
										var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId,'',warehouseLocationId);							
										if(JSON.stringify(openPutAwayDetails) !== '{}'){
											var inboundShipmentItemLineNo = itemShipmentsListObj[itemListInd].inboundshipmentitemid;
											var lineItemOpentaskRcvQty = openPutAwayDetails[inboundShipmentItemLineNo];
											if(utility.isValueValid(lineItemOpentaskRcvQty)){

												if(!utility.isValueValid(shipmentLineReceivedQty))
												{
													shipmentLineReceivedQty = 0;
												}
												var tempTotalRecQty = Number(Big(parseFloat(shipmentLineReceivedQty)).plus(lineItemOpentaskRcvQty));	
												itemShipmentsListObj[itemListInd]['quantityremaining'] 	= Number(Big(parseFloat(shipmentLineExpQuantity)).minus(tempTotalRecQty));
												if(itemShipmentsListObj[itemListInd]['quantityremaining'] == 0){
													itemShipmentsListObj.splice(itemListInd, 1);
													changeIndexforSplice = true;
												}
												remainingQty = Number(Big(parseFloat(remainingQty)).minus(lineItemOpentaskRcvQty));
											}
											else{
												itemShipmentsListObj[itemListInd]['quantityremaining'] = remainingQty;
											}
										}
										else{
											itemShipmentsListObj[itemListInd]['quantityremaining'] = remainingQty;
										}
									}
								if(!changeIndexforSplice){
									itemListInd++;
								}
							}
							response['shipmentResults'] = itemShipmentsListObj;
							response['isValid'] = true;
						}
						else
						{
							response['errorMessage'] = translator.getTranslationString('ISM_ITEMSHIPMENT.NO_SHIPMENTS');
							response['isValid'] = false;
						}
					}
					else
					{
						var itemRes = utility.getSKUIdWithName(itemName,warehouseLocationId,'','',true);
						log.debug({title:'itemRes',details:itemRes});
						if(itemRes.length > 0)
						{
							var itemArray = [];
							for(var i in itemRes){
								itemArray.push(itemRes[i]['id']);
							}

							var itemShipmentsObj = inboundUtility.getItemShipments(itemArray , warehouseLocationId);

							log.debug('item Shipments :', itemShipmentsObj);

							response['itemShipmentList'] = itemShipmentsObj;
							response['isValid']=true;
						}else{
							response['errorMessage'] = translator.getTranslationString('ISM_ITEMSHIPMENT.INVALID_ITEM');
							response['isValid'] = false;
						}
					}
				}
				else{
					response['errorMessage'] = translator.getTranslationString('ISM_ITEMSHIPMENT.INVALID_ITEM');
					response['isValid'] = false;
				}
			}else{
				response['isValid'] = false;
			}
		}catch(e)
		{
			response['isValid'] = false;
			response['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return response;
	}		

	return {
		'post': doPost,
	};
});
