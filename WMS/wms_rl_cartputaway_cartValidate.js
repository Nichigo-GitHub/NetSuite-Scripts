/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_inbound_utility'],
		/**
		 * @param {search} search
		 */
		function (search, utility,translator,inboundLib) {

	function doPost(requestBody) {

		var whLocationId = '';
		var cartName = '';
		var cartId = '';
		var cartDetails = {};		
		var requestParams = '';
		try
		{
			log.debug({title:'requestBody',details:requestBody});	
			if (utility.isValueValid(requestBody)) 
			{	
				requestParams= requestBody.params;
				whLocationId = requestParams.warehouseLocationId;
				cartName = requestParams.cartName;
				cartId = requestParams.cartId;

				if (utility.isValueValid(whLocationId) && (utility.isValueValid(cartName) || utility.isValueValid(cartId)))
				{
					//var cartId = '';
					if(utility.isValueValid(cartName))
					{
						cartId = inboundLib.validateCart(whLocationId,cartName);
					}
					if(utility.isValueValid(cartId))
					{
						var cartBinInventoryDetails = utility.getInventoryDetailsFromBins(cartId,whLocationId);
						var cartBinInventoryDetailsLength = cartBinInventoryDetails.length;
						if(cartBinInventoryDetailsLength > 0)
						{
							var cartBin = 0 ;
							var cartBinQty = 0;
							for(cartBin =0 ;cartBin < cartBinInventoryDetailsLength ; cartBin++)
							{
								cartBinQty = cartBinInventoryDetails[cartBin].quantityonhand;
								if(utility.isValueValid(cartBinQty) && parseFloat(cartBinQty) > 0){
									cartDetails.pageId = 'cartPutawayItems';	
								}
								
							}
						}
						cartDetails.itemsCountInCart = cartBinQty;
						cartDetails.cartName = cartName;
						cartDetails.cartId = cartId;
						cartDetails.isValid = true;
					}
					else
					{
						cartDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTVALIDATE');
						cartDetails.isValid = false;
					}

				}
				else {
					log.debug({title:'CARTPUTAWAY_CARTVALIDATE.INVALIDCART',details:cartDetails});
					cartDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTVALIDATE');
					cartDetails.isValid = false;
				}
			}
			else {
				cartDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTVALIDATE');
				cartDetails.isValid = false;
			}
			log.debug({title:'cartDetails',details:cartDetails});

		}
		catch(e)
		{
			cartDetails.isValid = false;
			cartDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return cartDetails;
	}

	return {
		'post': doPost

	};
});