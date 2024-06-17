/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/record','./wms_utility','./wms_translator','./wms_inventory_utility','./wms_inboundUtility'],
		/**
		 * @param {search} search
		 */
		function (search,record,utility,translator,invtUtility,inboundUtility) {
	
	/**
	 * Function to fetch item details.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 */
	
	function doPost(requestBody) {
		var itemList={};
		var debugString = '';
		var requestParams = '';
		try{
			if(utility.isValueValid(requestBody)){

				requestParams = requestBody.params;
				var enteredText = requestParams.itemText;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var action = requestParams.action;

				if(action == 'itemEntered'){

					if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(enteredText)){

						var itemresults = [];
						var currItem = utility.itemValidationForInventoryAndOutBound(enteredText,warehouseLocationId);

						if(utility.isValueValid(currItem['itemInternalId']) || utility.isValueValid(currItem['barcodeIteminternalid']))	{

							var searchItem = enteredText;

							if(utility.isValueValid(currItem['barcodeItemname']))
							{
								searchItem = currItem['barcodeItemname'];
							}
							else if(utility.isValueValid(currItem['itemName']))
							{
								searchItem = currItem['itemName'];
							}

							itemresults = inboundUtility.getItemList(searchItem);
							log.debug({title:'itemresults',details:itemresults});
						}
						if(itemresults.length == 0){
							itemList['errorMessage'] = currItem.error;
							itemList['isValid']=false;
						}
						else if(itemresults[0]['isinactive']){
							itemList['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INACTIVE_ITEM');
							itemList['isValid']=false;
						}
						else{
							itemList['itemList'] = itemresults;
							itemList['itemInternalId'] = itemresults[0]['internalid'];
							itemList['itemType'] = itemresults[0]['recordType'];
							itemList['itemName'] = itemresults[0]['itemid'];
							itemList['unitstype'] = itemresults[0]['unitstype'];
							var unitTypeId = itemresults[0]['unitstype'];
							var webStoreFeature = utility.isWebstoreFeatureEnabled();
							if(webStoreFeature)	{
								itemList['imageUrl']=itemresults[0]['thumbnailurl'];
							}

							var uomName='';

							if(utility.isValueValid(currItem['barcodeUomName'])){
								uomName = currItem['barcodeUomName'];
							}
							else if(utility.isValueValid(currItem['itemUomName'])){
								uomName = currItem['itemUomName'];
							}

							if(utility.isValueValid(unitTypeId)){ // uomEnabledItem
								var stockUnitName = itemresults[0]['stockunitText'];
								itemList['stockUnitName'] =stockUnitName;
								var stockConversionRate = invtUtility.getOpenTaskStockCoversionRate(unitTypeId,stockUnitName);
								itemList['stockConversionRate'] =stockConversionRate;
								if(!utility.isValueValid(uomName)){
									uomName = stockUnitName;
								}
							}
							
							itemList	= utility.addItemDatatoResponse(itemList, currItem, unitTypeId, uomName);

							for(var key in  itemList){
								itemList[key] = itemList[key];
							}
							itemList['isValid']=true;
						}
					}else{
						itemList['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INVALID_ITEM');
						itemList['isValid']=false;
					}

				}
				else if (action == 'findItems'){
					var itemRes = utility.getSKUIdWithName(enteredText,warehouseLocationId,'','',true);
					itemList['itemList'] = itemRes;
					itemList['isValid']=true;
				}
				else{
					itemList['isValid']=false;
				}
			}else{
				itemList['isValid']=false;
			}

		}catch(e){
			itemList['isValid'] = false;
			itemList['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return itemList;
	}

	return{
		'post' : doPost
	}
});