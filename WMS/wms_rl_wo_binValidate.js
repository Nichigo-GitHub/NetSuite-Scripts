/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_workOrderUtility','./big'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,woUtility,Big) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {
		try{
			var binArray = new Object();
			var debugString = '';
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemName = requestParams.itemName;
				var itemInternalId = requestParams.itemInternalId;
				var binName = requestParams.binName;
				var action = requestParams.action;
				var binInternalId = requestParams.binInternalId;
				var transactionLineNo = requestParams.transactionLineNo;
				var stockUomConversionRate  = requestParams.stockUomConversionRate;
				var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;

				log.debug('requestParams',requestParams);
				
				if(action == 'binSelceted'){
					binArray['info_binName'] = binName;
					
					binArray['binName'] = binName;
					binArray['binInternalId'] = binInternalId;
					binArray['itemName'] = itemName;
					binArray['itemInternalId'] = itemInternalId;
					binArray['transactionLineNo'] = transactionLineNo;
					binArray['isValid'] = true;
				}
				else if(utility.isValueValid(binName)){
					var binValidateSearch = search.load({
							type : search.Type.INVENTORY_BALANCE,		
							id : 'customsearch_wms_wo_inv_balance_bintype'});

					binValidateSearch.filters.push(search.createFilter({
						name : 'location',
						join : 'binnumber',
						operator : search.Operator.ANYOF,
						values : warehouseLocationId
					}));
					
					binValidateSearch.filters.push(search.createFilter({
						name : 'binnumber',
						join : 'binnumber',
						operator : search.Operator.IS,
						values : binName
					}));

					binValidateSearch.filters.push(search.createFilter({
						name : 'item',
						operator : search.Operator.ANYOF,
						values : itemInternalId
					}));
					if(utility.isValueValid(inventoryDetailLotOrSerialId)){
						binValidateSearch.filters.push(search.createFilter({
						name : 'inventorynumber',
						operator : search.Operator.ANYOF,
						values : inventoryDetailLotOrSerialId
					}));
					}

					var binValidateSearchRes = utility.getSearchResultInJSON(binValidateSearch);
					log.debug('binValidateSearchRes',binValidateSearchRes);
					if(binValidateSearchRes.length > 0 && validateBin(binValidateSearchRes))
					{
						var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, binValidateSearchRes[0]['binnumber'], warehouseLocationId);

						var invQty = 0;
						var invConvQty = 0;
						var openTaskPickQty = 0;

						for(var i=0;i<binValidateSearchRes.length;i++)
						{
							invQty =  (new Big(invQty)).plus(binValidateSearchRes[i]['available']);
						}

						if(utility.isValueValid(stockUomConversionRate))
						{
							invConvQty = utility.uomConversions(invQty,1,stockUomConversionRate);
						}
						else
						{
							invConvQty = invQty;
						}
						for(var s=0;s<openTaskPickBinDtls.length;s++)
						{
							openTaskPickQty = (new Big(openTaskPickQty)).plus(openTaskPickBinDtls[s]['actualQuantityInBaseUnits']);
						}

						//log.debug('invConvQty :',invConvQty);
						//log.debug('openTaskPickQty :',openTaskPickQty);

						if((new Big(invConvQty)).minus(openTaskPickQty) <= 0)
						{
							binArray["errorMessage"] = translator.getTranslationString("PO_QUANTITYVALIDATE.INVALID_BIN");
							binArray['isValid'] = false;
						}
						else
						{
							binArray['isValid'] = true;
							binArray['binInternalId'] = binValidateSearchRes[0]['binnumber'];
							binArray['binName'] = binValidateSearchRes[0]['binnumberText'];
							binArray['itemName'] = itemName;
							binArray['itemInternalId'] = itemInternalId;
							binArray['transactionLineNo'] = transactionLineNo;

							binArray['info_binName'] = binValidateSearchRes[0]['binnumberText'];
						}
					}else if(binValidateSearchRes.length == 0){
						binArray["errorMessage"] = translator.getTranslationString("PO_QUANTITYVALIDATE.INVALID_BIN");
						binArray['isValid'] = false;
					}
					else{
						binArray["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.STAGE_WIP_BINS_NOT_ALLOWED");
						binArray['isValid'] = false;
					}
				}else{
					binArray["errorMessage"] = translator.getTranslationString("PO_QUANTITYVALIDATE.INVALID_BIN");
					binArray['isValid'] = false;
				}
			}else{
				binArray['isValid'] = false;
			}
		}
		catch(e)
		{
			binArray['isValid'] = false;
			binArray['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			debugString = debugString + 'hai';
			log.error({title:'debugString',details:debugString});
		}
		log.debug('binArray',binArray);
		return binArray;
	}
	function validateBin(binValidateSearchRes){
		var flag = true;
		if(binValidateSearchRes[0]['typeText'] == 'Outbound Staging' || binValidateSearchRes[0]['typeText'] == 'WIP')
		{
			flag = false;
		}
		return flag;
	}

	return {
		'post': doPost
	};

});
