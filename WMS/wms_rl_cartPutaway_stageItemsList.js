/**
 *    Copyright 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','N/search'],

		function(utility,translator,search) {

	function doPost(requestBody) {

		var responseParams = {};
		try{
			var	requestParams = requestBody.params;
			log.debug('requestParams',requestParams);
			if(utility.isValueValid(requestParams))
			{
				var warehouseLocationId = requestParams.warehouseLocationId;
				var binInternalId=requestParams.binInternalId;
				var scannedItem = requestParams.scannedItem;
				var actionType = requestParams.actionType;

				if(utility.isValueValid(actionType)){						
					if(actionType == 'validateItem' ){
						var responseObj = {itemText:scannedItem};
						responseParams.criteria = responseObj;
						responseParams.errorMessage = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
						log.debug('responseObj',responseObj);
					}
					else{
						var responseObject = {itemText:scannedItem};
						responseParams.criteria = responseObject;
						responseParams.errorMessage = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
					}
				}				
				else{
					if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(binInternalId))
					{
						var itemResults = getStageItemsList(warehouseLocationId,binInternalId);
						responseParams.requestParams = requestParams;
						responseParams.itemResults = itemResults;
						if(itemResults.length > 0){
							responseParams.isValid = true;
						}
					}
					else{
						responseParams.errorMessage = translator.getTranslationString('BINTRANSFER_FINDITEM.INVALID_INPUT');
						responseParams.isValid = false;
					}
				}

			}
		}
		catch(e)
		{
			responseParams.isValid = false;
			responseParams.errorMessage = e.message;
		}
		log.debug('responseParams',responseParams);
		return responseParams;
	}
	
	function getStageItemsList(warehouseLocationId,stageBinInternalId){
		var searchRec = search.load({
			id: 'customsearch_wmsse_invtbalance_serialsrh',type:search.Type.INVENTORY_BALANCE
		});

		var savedFilter = searchRec.filters;
		savedFilter.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));
		savedFilter.push(search.createFilter({
			name: 'binnumber',
			operator: search.Operator.ANYOF,
			values: stageBinInternalId
		}));
		var itemResults =  utility.getSearchResults(searchRec);
		var itemResultsLength = itemResults.length;
		var stageBinItemsResults = [];
		var row = {};
		var itemQtyArr = [];
		if(itemResultsLength > 0){
			log.debug('itemResults',itemResults);
			for(var result = 0;result < itemResultsLength; result++){
				row = {};
				var itemDetailsObj = itemResults[result];
				
				var itemId = itemDetailsObj.getValue({name:'item',summary:'GROUP'});
				var itemAvailableQty = itemDetailsObj.getValue({name:'available',summary:'SUM'});
				if(itemAvailableQty > 0){
					var itemUnits = itemDetailsObj.getText({name:'stockunit',join : 'item',summary:'GROUP'});
					var itemIndex = itemQtyArr.indexOf(itemId);
					if(itemIndex != -1 && itemAvailableQty != undefined && !isNaN(itemAvailableQty)){
						itemAvailableQty = parseFloat( stageBinItemsResults[itemIndex].availableQty)+parseFloat(itemAvailableQty);
						stageBinItemsResults[itemIndex].availableQty =  itemAvailableQty;
						stageBinItemsResults[itemIndex].available =  itemAvailableQty + " "+itemUnits;

					}
					else{
						if(!utility.isValueValid(itemUnits) || itemUnits == '- None -'){
							itemUnits = " ";
						}

						row = {'item':itemId,
								'itemText':itemDetailsObj.getText({name:'item',summary:'GROUP'}),
								'availableQty':itemAvailableQty,
								'available':itemAvailableQty + " "+itemUnits,
								'salesdescription':itemDetailsObj.getValue({name:'salesdescription',summary:'GROUP'}),								
								'units':itemDetailsObj.getValue({name:'stockunit',join:'item',summary:'GROUP'}),
						        'unitType':itemDetailsObj.getValue({name:'unitstype',join:'item',summary:'GROUP'}),
						        'statusName':itemDetailsObj.getText({name:'status',summary:'GROUP'})};
						stageBinItemsResults.push(row);
						itemQtyArr.push(itemId);
					}
				}


			}
			
		}
		return stageBinItemsResults;
	}



	return {
		'post': doPost

	};
});
