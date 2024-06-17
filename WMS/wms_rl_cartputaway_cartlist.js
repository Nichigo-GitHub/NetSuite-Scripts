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
		var cartDetails = {};
		var objPutawayRecords = {};
		var requestParams = '';
		try{
			log.debug({title:'requestBody',details:requestBody});	
			if (utility.isValueValid(requestBody)) {	
				requestParams= requestBody.params;
				whLocationId = requestParams.warehouseLocationId;

				if (utility.isValueValid(whLocationId)) {
					var getCartBinResults = inboundLib.getCartBinDetails(whLocationId);
					log.debug({title:'getCartBinResults',details:getCartBinResults});	
					if(getCartBinResults.length > 0)
					{
						var cartBinResultsArr = getCartBinResults[0];
						log.debug({title:'cartBinResultsArr',details:cartBinResultsArr});	
						var binLocIdArr =[];
						var binItr = 0;
						
						for(binItr = 0;binItr < cartBinResultsArr.length; binItr++)
						{
							if(utility.isValueValid(cartBinResultsArr[binItr].id))
							{
								binLocIdArr.push(cartBinResultsArr[binItr].id);
							}
						}
						log.debug({title:'binLocIdArr',details:binLocIdArr});	
						var cartPutawayRecords = utility.getInventoryDetailsFromBins(binLocIdArr,whLocationId);
						log.debug({title:'cartPutawayRecords',details:cartPutawayRecords});	
						var cartPutawayBinLength = cartPutawayRecords.length;						
						var cartIdObj = {};
						var cartBinList = [];
						if(cartPutawayBinLength > 0){
							for(var cartPutawayRec =0 ;cartPutawayRec < cartPutawayBinLength ; cartPutawayRec++) {
								objPutawayRecords = {};
								objPutawayRecords.cartid = cartPutawayRecords[cartPutawayRec].binnumber;
								objPutawayRecords.cartname = cartPutawayRecords[cartPutawayRec].binnumberText;
								objPutawayRecords.quantity = cartPutawayRecords[cartPutawayRec].quantityonhand;
								cartIdObj[cartPutawayRecords[cartPutawayRec].binnumber] = true;
								cartBinList.push(objPutawayRecords);
							}
							if(cartBinList.length > 0){
								cartBinList.sort(sortByCartName);
							}
						}

						var cartBinLength = cartBinResultsArr.length;
						var cartBin = 0;
						var cartBinInternalId = '';
						var emptyCartBinsArr = [];
						for ( cartBin = 0; cartBin < cartBinLength ; cartBin++) {
							cartBinInternalId = cartBinResultsArr[cartBin].id;
							if(!cartIdObj[cartBinInternalId]){
								objPutawayRecords = {};
								objPutawayRecords.cartid = cartBinInternalId;
								objPutawayRecords.cartname = cartBinResultsArr[cartBin].binnumber;
								objPutawayRecords.quantity = 0;
								emptyCartBinsArr.push(objPutawayRecords);
							}

						}
						var emptyCartBinsLength = emptyCartBinsArr.length;
						if(emptyCartBinsLength > 0){
							emptyCartBinsArr = emptyCartBinsArr.sort(sortByCartName);
							for (var emptyBin = 0; emptyBin < emptyCartBinsLength ; emptyBin++) {
								cartBinList.push(emptyCartBinsArr[emptyBin]);
							}
						}

						cartDetails.cartList = cartBinList;
						cartDetails.isValid = true;
					}
					else
					{
						cartDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTLIST.NO_CARTBINS');
						cartDetails.isValid = false;

					}

				}
				else {
					cartDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTLIST.NO_CARTBINS');
					cartDetails.isValid = false;
				}
			}
			else {
				cartDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTLIST.NO_CARTBINS');
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

	function sortByCartName(a, b) {
		var name1 = a.cartname.toLowerCase();
		var name2 = b.cartname.toLowerCase();
		var result = 1;
		if (name1 < name2){
			result = -1;
		}
		return result;
	}
	return {
		'post': doPost

	};
});