/**
 *    Copyright ï¿½ 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','N/record','./wms_inventory_utility', './wms_inboundUtility','N/task','N/runtime','./wms_tallyScan_utility','N/format','./wms_inbound_utility'],

		function (search,utility,translator,record,invtUtility,inboundUtility,task,runtime,tallyScanUtility,format,inboundLib) {

	function doPost(requestBody)
	{
		var binoritemObject = {};
		log.debug({title:'requestBody',details:requestBody});
		var requestParams = "";
		var action = "";
		try{
			if(utility.isValueValid(requestBody)){

				requestParams = requestBody.params;
				var inputStringVar = requestParams.inputString; 
				var wareHouseLocationId = requestParams.warehouseLocationId;
				var itemId = requestParams.itemId;
				var cartBinId = requestParams.cartBinId;
				var binId = requestParams.binId;				 
				var unitType = requestParams.unitType;
				var stockConversionRate = requestParams.stockConversionRate;
				var processNameFromState = requestParams.processNameFromState;
				var info_scannedObj = '';
				var transactionUnitName = '';
				action = requestParams.action;
				var scannedPage = requestParams.scannedPage;
				var lotsCount = requestParams.lotsCount;
				var binName = requestParams.binName;
				var binTransferIdStr = requestParams.binTransferId;
				var itemType = '';

				if(((utility.isValueValid(inputStringVar)  ||	(utility.isValueValid(itemId) || utility.isValueValid(binId))) 
						|| (action == 'putawayAll')) && utility.isValueValid(wareHouseLocationId) && utility.isValueValid(cartBinId))
				{
					if(action == 'putawayAll'){
						var lotInternalId = requestParams.lotInternalId;
						var fromStatusId = requestParams.fromStatusId;
						var getCartItemListResults = _getCartItemsResultsFromInevntoryBalance_putawayAll(wareHouseLocationId,cartBinId,itemId,lotInternalId,fromStatusId);
						var cartItemListResultLength = getCartItemListResults.length;
						log.debug({title:'getCartItemListResultsLength',details:getCartItemListResults});
						if(cartItemListResultLength > 0){
							var isValidForPutAwayAll =  'T';
							if(scannedPage != "putawayAllConfirmPage"){
								isValidForPutAwayAll = this.validateItemsForPutaway(getCartItemListResults,wareHouseLocationId,binId,itemId,cartBinId,'putAwayAll');
							}
							if(isValidForPutAwayAll == 'T') {

								if(scannedPage == "putawayAllConfirmPage"){
									try{
										var inventoryCountId = _postBinTransferForPutawayAll(wareHouseLocationId,cartItemListResultLength,getCartItemListResults,binId,binName,itemId,cartBinId);
										if(inventoryCountId){
											if(!utility.isValueValid(itemId)){
												var openTaskCartItemsRecords = inboundLib.getCartBinDetailsFromOpenTask(wareHouseLocationId,cartBinId);
												if(openTaskCartItemsRecords.length > 0){
													callMapReduceScript(cartBinId,wareHouseLocationId,inventoryCountId);
													var currentUserId = runtime.getCurrentUser().id;
													utility.updateScheduleScriptStatus('WMS Cart PutAway Map Reduce',currentUserId,'Submitted',
															cartBinId,wareHouseLocationId);
												}
											}
											else{
												var openTaskResults = inboundUtility.getOpenTaskID(itemId,cartBinId,wareHouseLocationId);
												log.debug({title:'openTaskResults',details:openTaskResults});
												var openTask = 0;
												var binTransferObject = {};
												binTransferObject.inventoryCountId = inventoryCountId;
												var openTaskResultLength = openTaskResults.length;
												for(openTask = 0; openTask < openTaskResultLength ; openTask ++){
													inboundUtility.updateNSrefno(openTaskResults[openTask].internalid,binTransferObject);
												}
											}
											var cartPutawayRecords = [];
											binoritemObject.navigateToCartPutaway = 'N';
											if(utility.isValueValid(itemId)){
												cartPutawayRecords = utility.getInventoryDetailsFromBins(cartBinId,wareHouseLocationId);
												if(cartPutawayRecords.length > 0){
													binoritemObject.navigateToCartPutaway = 'Y';	
												}

											}
											binoritemObject.binTransferId = inventoryCountId;
											if(binTransferIdStr != undefined && binTransferIdStr != ""){
												binoritemObject.binTransferId = binTransferIdStr +","+inventoryCountId;
											}
											
											binoritemObject.isValid = true;
											binoritemObject.action = 'putawayAll';
										}
									}
									catch(e){
										binoritemObject.errorMessage = e.message;
										binoritemObject.isValid = false;
									}


								}
							}
							else{
								log.debug({title:'binTransferIdArr', details:'else'});
								binoritemObject.errorMessage = isValidForPutAwayAll;
								binoritemObject.isValid = false;
							}
						}
						else{
							binoritemObject.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTITEMLIST');
							binoritemObject.isValid = false;
						}
					}
					else{
						var	itemResObj = {};
						if((utility.isValueValid(inputStringVar))){
							if(utility.isValueValid(action) && (action == 'bin' || action == 'binoritem')) {
								binoritemObject = binValidation(requestParams);
							}
							log.debug({title:'binoritemObject',details:binoritemObject});
							if((binoritemObject.isValid == false && ( utility.isValueValid(action) &&  action == 'binoritem'))
									|| ( utility.isValueValid(action) && (action == 'item' ||
											(action == 'binoritem' && binoritemObject.isValid == false ) )))	{
								if((!(binoritemObject.errorMessage == translator.getTranslationString('INVENTORY_TOBINVALIDATE.SAME_FROMANDTOBINS')) &&
										binoritemObject.isValid == false)||(action  == 'item')){
									itemResObj = utility.itemValidationForInventoryAndOutBound(inputStringVar,wareHouseLocationId);
									log.debug({title:'itemResObj',details:itemResObj});

									if(utility.isValueValid(itemResObj.itemInternalId) ||
											utility.isValueValid(itemResObj.barcodeIteminternalid))	{	

										itemId = (itemResObj.itemInternalId ? itemResObj.itemInternalId : itemResObj.barcodeIteminternalid);
										info_scannedObj = itemResObj.itemName;
										binoritemObject.processedObjectType = 'item';
										binoritemObject.isValid = true;
										binoritemObject.errorMessage = '';
									}
									else{

										binoritemObject.errorMessage = itemResObj.error;
										binoritemObject.isValid = false;
									}
								}
							}
							else{
								if(binoritemObject.isValid){
									binId = binoritemObject.binInternalId;
									info_scannedObj = inputStringVar;
								}
							}
						}
						else {
							if((action == 'bin' && !utility.isValueValid(binId)) ||
									(action == 'item' && !utility.isValueValid(itemId))){
								binoritemObject.isValid = false; 
								binoritemObject.errorMessage = getErrMsg(action);
							}
							else{
								if(action == 'bin' && utility.isValueValid(binId) ){
									binoritemObject.binInternalId = binId;
									binoritemObject.binName = binName;
									binoritemObject.processedObjectType = 'bin';	
									binoritemObject.isValid = true;
								}
							}
						}

						if(binoritemObject.isValid != false){
							var stockUnitName ='';
							var emptyArr = [];
							var isMixFlagsValidForPutaway = 'T';
							if((action == 'item' && utility.isValueValid(binId) ) ||( action == 'bin' && utility.isValueValid(itemId))){
								isMixFlagsValidForPutaway = this.validateItemsForPutaway(emptyArr,wareHouseLocationId,binId,itemId,'','');
							}
							if(isMixFlagsValidForPutaway == "T"){
								if(utility.isValueValid(itemId)){
									log.debug({title:'objBinDetails',details:objBinDetails});
									var objBinDetails = getItemDetails(itemId,wareHouseLocationId);
									if(utility.isValueValid(objBinDetails))	{
										var useBins =  objBinDetails.usebins;
										itemType = objBinDetails.recordtype;
										binoritemObject.blnMixItem = objBinDetails.custitem_wmsse_mix_item;
										binoritemObject.blnMixLot = objBinDetails.custitem_wmsse_mix_lot;
										log.debug({title:'useBins',details:useBins});
										if(!useBins){
											binoritemObject.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.USEBIN_FLAG');
											binoritemObject.isValid = false;
										}
										else if(itemType == 'kititem'){
											binoritemObject.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.ITEM_VALIDATION');
											binoritemObject.isValid = false;
										}
										else{
											var getCartItemResults = inboundLib.getCartItemsResultsFromInevntoryBalance(wareHouseLocationId,cartBinId,itemId);
											var cartItemResultsLength = getCartItemResults.length;
											binoritemObject.statusLength = 1 ;
											var inventoryStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
											log.debug({title:'inventoryStatusFeatureEnabled',details:inventoryStatusFeatureEnabled});
											if(inventoryStatusFeatureEnabled){
												binoritemObject.statusLength = cartItemResultsLength ;
											}
											if(cartItemResultsLength > 0){

												itemId  = getCartItemResults[0].item ;
												binoritemObject.itemInternalId = getCartItemResults[0].item ;
												binoritemObject.itemName = getCartItemResults[0].itemText ;
												if(!utility.isValueValid(binId)){
													var itemInputObj = {};
													itemInputObj.itemId 			= itemId;
													itemInputObj.whLocation 		= wareHouseLocationId;
													itemInputObj.itemType 			= itemType;
													//itemInputObj.lotName 			= lotNo;
													itemInputObj.fromBinInternalId 	= cartBinId;
													//itemInputObj.fromStatusId 		= vInvStatus_select;

													var objRecommendedBinData = inboundUtility.getRecommendedBinForCartMoves(itemInputObj);
													log.debug("objRecommendedBinData",objRecommendedBinData);
													if(utility.isValueValid(objRecommendedBinData)){
														binoritemObject.binInternalId = objRecommendedBinData.recomendedBinId;
														binoritemObject.binName = objRecommendedBinData.recomendedBinName;
													}
													/*	var	itemResults = inboundLib.getCartItemsPreferdBinDetails(wareHouseLocationId,itemId);
                                                        log.debug({title:'itemResults',details:itemResults});
                                                        var itemResultsLength = itemResults.length;
                                                        var itemResultIndx = 0;
                                                        for(itemResultIndx = 0;itemResultIndx<itemResultsLength ; itemResultIndx++){
                                                            var binObj = binValidation(requestParams,itemResults[itemResultIndx].binnumber);
                                                            if(binObj.isValid){
                                                                binoritemObject.binInternalId = binObj.binInternalId;
                                                                binoritemObject.binName = itemResults[itemResultIndx].binnumber;
                                                            }
                                                        }
                                                        if(!utility.isValueValid(binoritemObject.binName)){
                                                            var openTaskCartItemsResults = inboundLib.getCartBinDetailsFromOpenTask(wareHouseLocationId,cartBinId,itemId);
                                                            var openTaskCartItemsResultsLength = openTaskCartItemsResults.length;
                                                            var openTaskResultIndx = 0;
                                                            binoritemObject.binName = '';
                                                            if(openTaskCartItemsResultsLength > 0){
                                                                for(openTaskResultIndx = 0;openTaskResultIndx<openTaskCartItemsResultsLength ; openTaskResultIndx++){
                                                                    binoritemObject.binName = openTaskCartItemsResults[openTaskResultIndx].custrecord_wmsse_reccommendedbinText;
                                                                    binoritemObject.binInternalId = openTaskCartItemsResults[openTaskResultIndx].custrecord_wmsse_reccommendedbin;
                                                                }
                                                            }
                                                        }*/
												}

												binoritemObject.quantity = getCartItemResults[0].onhand ;
												if(inventoryStatusFeatureEnabled){
												binoritemObject.fromStatusId = getCartItemResults[0].status;
												binoritemObject.fromStatusName = getCartItemResults[0].statusText;
												}
												transactionUnitName = getCartItemResults[0].stockunitText;
												if(utility.isValueValid(requestParams.itemId)){
													info_scannedObj = getCartItemResults[0].itemText;
												}
												if(utility.isValueValid(requestParams.binId)){
													info_scannedObj = binoritemObject.binName;
												}
												if(objBinDetails['unitstype'][0] != undefined)	{
													unitType = objBinDetails['unitstype'][0].value;
													stockUnitName = objBinDetails['stockunit'][0].text;
													if(utility.isValueValid(unitType) && utility.isValueValid(stockUnitName)) {
														binoritemObject.unitType = unitType;
														binoritemObject.stockUnitName = stockUnitName;
													}
													else{
														binoritemObject.unitType = "";
														binoritemObject.stockUnitName = "";
													}
												}
												else {
													binoritemObject.stockUnitName = '';
												}

												var tranUOMConversionRate = ''; 
												if(utility.isValueValid(unitType)){
													stockConversionRate = invtUtility.getOpenTaskStockCoversionRate(unitType,stockUnitName);

												}
												binoritemObject.stockConversionRate =stockConversionRate;

												if(utility.isValueValid(stockConversionRate) && utility.isValueValid(transactionUnitName))
												{
													tranUOMConversionRate = invtUtility.getOpenTaskStockCoversionRate(unitType,transactionUnitName);
													if(stockConversionRate!=tranUOMConversionRate){
														binoritemObject.quantity = utility.uomConversions(binoritemObject.quantity,stockConversionRate,tranUOMConversionRate);													
													}
												}

												if (objBinDetails.thumbnailurl != undefined) {
													binoritemObject.imageUrl = objBinDetails.thumbnailurl;
												}

												binoritemObject.itemType = itemType;

												binoritemObject	= utility.addItemDatatoResponse(binoritemObject, itemResObj, unitType, stockUnitName);
												binoritemObject.isValid = true;
												log.debug({title:'binoritemArray',details:binoritemObject});
												binoritemObject.getStockConversionRate = stockConversionRate;
												binoritemObject.availbleQuanity = binoritemObject.quantity;
												binoritemObject.itemType = itemType;
												binoritemObject.warehouseLocationId = wareHouseLocationId;
												binoritemObject.processNameFromState = processNameFromState;
												binoritemObject = tallyScanUtility.isTallyScanEnabled(binoritemObject,'');
												if(!utility.isValueValid(binoritemObject.stockUnitName)){
													binoritemObject.stockUnitName = "";
												}
												log.debug({title:'binoritemArray1',details:binoritemObject});
											}
											else{
												binoritemObject.errorMessage = getErrMsg(action);
												binoritemObject.isValid = false;
											}
										}
									}


								}

							}
							else{
								binoritemObject.errorMessage = isMixFlagsValidForPutaway;
								binoritemObject.isValid = false;
							}
						}
					}
				}
				else{
					binoritemObject.errorMessage = getErrMsg(action);
					binoritemObject.isValid = false;
				}
			}
			else{
				binoritemObject.errorMessage = getErrMsg(action);
				binoritemObject.isValid = false;
			}
			log.debug({title:'binoritemObject',details:binoritemObject});
		}
		catch(e){
			binoritemObject.isValid = false;
			binoritemObject.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return binoritemObject;
	}
	function getErrMsg(action) {

		var message = '';
		if(action == 'bin') {
			message = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.EMPTY_INPUT');
		}
		else if(action == 'item') {
			message = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.ITEM_VALIDATION');	
		}
		else{
			message = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.INVALID_INPUT');
		}
		log.debug({title:'action',details:action});
		return message;

	}

	function validateItemsForPutaway(cartItemListResults,whLocationId,binInternalId,itemInternalId,cartBinId,btnClick){
		var isValidForPutawayFlag = 'T';
		var itemIdArr = [];
		var item = 0;
		log.debug({title:'cartItemListResults',details:cartItemListResults});
		if(!utility.isValueValid(itemInternalId)){
			var cartItemListResultLength = cartItemListResults.length;
			for(item = 0; item < cartItemListResultLength; item++){
				itemIdArr.push(cartItemListResults[item].item);
			}
		}
		else{
			itemIdArr.push(itemInternalId);
		}
		var validationResultArr = [];
		var objItemDetails = getItemsMixFlags(whLocationId,itemIdArr);
		var itemMixRulesFlag = '';
		if(btnClick == 'putAwayAll'){
			log.debug({title:'objItemDetails',details:objItemDetails});
			validationResultArr = checkMixFlagInResults(objItemDetails.length,objItemDetails,whLocationId,cartBinId,itemIdArr,btnClick);
			if(validationResultArr.length > 0){
				itemMixRulesFlag = validationResultArr[0];
			}
			if(itemMixRulesFlag == 'F' && validationResultArr.length > 0){
				isValidForPutawayFlag =  validationResultArr[1];
			}
			var mixLot = checkMixLotFlag(objItemDetails.length,objItemDetails,whLocationId,itemIdArr,binInternalId,'');
			log.debug('mixLot',mixLot);
			if(mixLot == 'F' ){	
				isValidForPutawayFlag = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.MIXLOTS_FALSE');
			}
		}
		else{
			var itemMixRulesFlag = checkMixItemFlag(objItemDetails.length,objItemDetails,'');
			if(itemMixRulesFlag == 'F'){
				var	objBinDetails = utility.getItemMixFlagDetails(whLocationId,itemIdArr,binInternalId,'','');
				if(objBinDetails.length > 0){
				isValidForPutawayFlag =  translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.MIXITEMS_FALSE');
				}
			}
		}
		
		if(itemMixRulesFlag == 'T'){
			var	objBinDetails = utility.getItemMixFlagDetails(whLocationId,'',binInternalId,'','');
			log.debug({title:'objBinDetails',details:objBinDetails});
			var binMixRulesFlag = checkMixItemFlag(objBinDetails.length,objBinDetails,'');
			if(binMixRulesFlag == 'F'){
				isValidForPutawayFlag =  translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.BIN_MIXITEMS_FALSE');
			}
		}	
		log.debug({title:'isValidForPutawayFlag',details:isValidForPutawayFlag});

		return isValidForPutawayFlag;

	}
	function checkMixItemFlag(arrLength,itemDetailsArr,btnClickValue){
		var mixItemFlag = 'T';
		var row = 0;
		var currRow = [];
		var mixItemsFalseCount = 0;
		for(row=0;row < arrLength; row++){
			currRow = itemDetailsArr[row] ;
			if(currRow.custitem_wmsse_mix_item == false ){
				mixItemsFalseCount = mixItemsFalseCount +1;
				if(btnClickValue == 'putAwayAll'){
					if(mixItemsFalseCount >1){
						mixItemFlag = 'F';
						break;
					}
				}
				else{
					mixItemFlag = 'F';
					break;
				}
			}
		}
		return mixItemFlag;
	}
	function checkMixLotFlag(arrLength,itemDetailsArr,warehouseLocationId,itemIdArr,binId,btnClickValue){
		var mixLotFlag = 'T';
		var row = 0;
		var currRow = [];
		var binLotDetailsArr = getLotDetails(warehouseLocationId,itemIdArr,binId);
		log.debug('binLotDetailsArr',binLotDetailsArr);
		for(row=0;row < arrLength; row++){
			currRow = itemDetailsArr[row] ;
			if(currRow.recordType == "lotnumberedinventoryitem" || currRow.recordType == "lotnumberedassemblyitem"){
				if(currRow.custitem_wmsse_mix_lot == false ){
					var lotCount = 0;
					for(var binDetail = 0;binDetail<binLotDetailsArr.length;binDetail++){
						if(binLotDetailsArr[binDetail].id == currRow.id){
							lotCount = lotCount +1;
						}
						if(btnClickValue == 'putAwayAll'){
							if(lotCount > 1 ){	
								mixLotFlag = 'F';
								break;
							}
						}
						else{
							mixLotFlag = 'F';
							break;
						}
					}
					if(mixLotFlag == 'F'){break;}
				}
			}
		}
		return mixLotFlag;
		
	}
	function checkMixFlagInResults(arrLength,invDetailsArr,warehouseLocationId,cartBinId,itemIdArr,btnClick){
		var resultArr = [];
		var isValidForPutaway = 'T';
		var errMsg = '';
		if(arrLength > 0){
			var mixItem = checkMixItemFlag(arrLength,invDetailsArr,btnClick);
			if(mixItem == 'F'){
				isValidForPutaway = 'F';
				errMsg = translator.getTranslationString('CARTPUTAWAY_CARTITEMS_MIXITEMS_FALSE');
			}
			if(isValidForPutaway == 'T'){
				var mixLot = checkMixLotFlag(arrLength,invDetailsArr,warehouseLocationId,itemIdArr,cartBinId,btnClick)
				if(mixLot == 'F' ){	
					isValidForPutaway = 'F';
					errMsg = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.MIXLOTS_FALSE');
				}
			}
		}
		resultArr.push(isValidForPutaway);
		resultArr.push(errMsg);
		return resultArr;
	}
	function getLotDetails(warehouseLocationId,itemIdArr,cartBinId){
		var searchObj = search.load({id: 'customsearch_wmsse_itemwise_lots'});
		if (utility.isValueValid(warehouseLocationId)) {
			searchObj.filters.push(search.createFilter({ name :'location',
				join :'inventoryNumberBinOnHand',
				operator: search.Operator.ANYOF,
				values:  warehouseLocationId}));
		}
		if (utility.isValueValid(itemIdArr)) {
			searchObj.filters.push(search.createFilter({
				name :'internalid',
				operator: search.Operator.ANYOF,
				values:  itemIdArr}));

		}
		searchObj.filters.push(search.createFilter({
			name :'islotitem',
			operator: search.Operator.IS,
			values:  true}));
		
		if (utility.isValueValid(cartBinId)) {
			log.debug('cartBinId1',cartBinId);
			searchObj.filters.push(search.createFilter({ name :'binnumber',
				join :'inventoryNumberBinOnHand',
				operator: search.Operator.ANYOF,
				values:  cartBinId}));
		}
		return utility.getSearchResultInJSON(searchObj);
	}
	function getItemsMixFlags(warehouseLocationId, itemInternalId){
		var searchObj = search.load({ 
			name : 'Item Mix and Lot Mix Item Flag Details',
			id : 'customsearch_wms_item_mixflag_details'});

		searchObj.filters.push(search.createFilter({ name :'location',
			join :'binonhand',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));
		if (utility.isValueValid(itemInternalId)){
			searchObj.filters.push(search.createFilter({ name :'internalid',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));}
		searchObj.filters.push(search.createFilter({ name :'quantityonhand',
			join :'binonhand',
			operator: search.Operator.GREATERTHAN,
			values: 0
		}));


		return utility.getSearchResultInJSON(searchObj);
	}

	function binValidation(requestParams,preferedBinName)
	{
		var binoritemObject = {};
		var inputStringVar=requestParams.inputString;
		if(utility.isValueValid(preferedBinName)){
			inputStringVar = preferedBinName;
		}
		var whLocationId=requestParams.warehouseLocationId;
		var binInternalId='';
		var binSearchFilters = [];

		var searchrecord = search.load({
			id: 'customsearch_wmsse_binnumbers'
		});
		binSearchFilters = searchrecord.filters;

		var WIPLocId = inboundUtility.getListObjectInternalId('WIP','customlist_wmsse_bin_loc_type');

		if(utility.isValueValid(WIPLocId)) {
			binSearchFilters.push(search.createFilter({
				name:'custrecord_wmsse_bin_loc_type',
				operator:search.Operator.NONEOF,
				values:WIPLocId
			}));
			var outDirId = inboundUtility.getListObjectInternalId('Out','customlist_wmsse_stg_direction');
			binSearchFilters.push(search.createFilter({
				name:'custrecord_wmsse_bin_stg_direction',
				operator:search.Operator.NONEOF,
				values:outDirId
			}));
		}

		binSearchFilters.push(search.createFilter({
			name:'binnumber',
			operator:search.Operator.IS,
			values:inputStringVar
		}));

		if(utility.isValueValid(whLocationId))	{
			binSearchFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:whLocationId
			}));
		}
		binSearchFilters.push(search.createFilter({
			name: 'inactive',
			operator: search.Operator.IS,
			values: false
		}));
		var	 binSearchResults = searchrecord.run().getRange({
			start: 0,
			end: 1000
		});
		log.debug({title:'binSearchResults',details:binSearchResults});
		if(binSearchResults.length > 0)
		{
			binInternalId=binSearchResults[0].id;
		}
		if(!utility.isValueValid(binInternalId))
		{
			binoritemObject.errorMessage = getErrMsg(requestParams.action);
			binoritemObject.isValid = false;
		}
		else
		{
			if(binInternalId == requestParams.cartBinId ){
				binoritemObject.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.SAME_FROMANDTOBINS');
				binoritemObject.isValid = false;
			}
			else{
				binoritemObject.binInternalId = binInternalId;
				binoritemObject.binName = binSearchResults[0].getValue({ name : 'binnumber'});
				binoritemObject.processedObjectType = 'bin';	
				binoritemObject.isValid = true;
			}
		}
		return binoritemObject;
	}
	function callMapReduceScript(cartBinInternalId,wareHouseId,binTransferId) {
		var schstatus =  task.create({taskType:task.TaskType.MAP_REDUCE});
		schstatus.scriptId = 'customscript_wms_mr_putawayall';
		schstatus.deploymentId = 'customdeploy_wms_mr_putawayall';
		schstatus.params = {
				"custscript_wms_mr_cartPutaway_cartBinId" : cartBinInternalId,
				"custscript_wms_mr_cartputaway_whlocation" : wareHouseId,
				"custscript_wms_mr_cart_binTransferId" : binTransferId
		};

		schstatus.submit();		
	}
	function getItemDetails(itemInternalId,warehouseLocationId) {

		var columnArray =[];
		columnArray.push('usebins');
		columnArray.push('unitstype');
		columnArray.push('stockunit');
		columnArray.push('recordtype');	
		columnArray.push('custitem_wmsse_mix_lot');
		columnArray.push('custitem_wmsse_mix_item');

		var itemDetails = utility.getItemFieldsByLookup(itemInternalId,columnArray);

		return itemDetails;
	}
	function _getCartItemsResultsFromInevntoryBalance_putawayAll(whLocation,cartBinId,itemId,lotInternalId,fromStatusInternalId) {
		var objInvtBalanceSearch =search.load({id:'customsearch_wms_cartdtlsforputawayall',type:search.Type.INVENTORY_BALANCE});
		var invtBalanceFilters =objInvtBalanceSearch.filters;
		if(utility.isValueValid(whLocation)){
			invtBalanceFilters.push(search.createFilter({name:'location',
				operator:search.Operator.ANYOF,
				values:whLocation}));
		}
		if(utility.isValueValid(itemId)){
			invtBalanceFilters.push(search.createFilter({name:'item',
				operator:search.Operator.ANYOF,
				values:itemId}));
		}	
		invtBalanceFilters.push(search.createFilter({name:'binnumber',
			operator:search.Operator.ANYOF,
			values: cartBinId}));
		if(utility.isValueValid(lotInternalId)){
			invtBalanceFilters.push(search.createFilter({name:'inventorynumber',
				operator:search.Operator.ANYOF,
				values: lotInternalId}));
		}
		if(utility.isValueValid(fromStatusInternalId)){
			invtBalanceFilters.push(search.createFilter({name:'status',
				operator:search.Operator.ANYOF,
				values:fromStatusInternalId}));
		}
		objInvtBalanceSearch.filters = invtBalanceFilters;

		return utility.getSearchResultInJSON(objInvtBalanceSearch);

	}
	function _postBinTransferForPutawayAll(whId,cartItemsLength,cartItemListResults,toBinId,toBinName,itemInternalId,cartBinId){
		var isNewBinScanned = true;
		var itemsObjectWithScannedBin = {};
		var itemsObjectWithOtherBin = {};
		var serialItemsObj = {};
		var itemIdArr = [];
		var obj = {}; 
		var itemObj =  [];
		var invStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
		for(var count = 0; count < cartItemsLength;count++){

			itemObj = cartItemListResults[count];
			if(itemIdArr.indexOf(itemObj.item) ==-1){
				itemIdArr.push(itemObj.item);
			}
			if(itemObj.isserialitem){

				if(utility.isValueValid(serialItemsObj[itemObj.item])){
					serialItemsObj[itemObj.item].quantity = parseFloat(serialItemsObj[itemObj.item].quantity)+parseFloat(itemObj.available);
					serialItemsObj[itemObj.item].serial = serialItemsObj[itemObj.item].serial+","+itemObj.inventorynumberText;
					if(invStatusFeatureEnabled){
					serialItemsObj[itemObj.item].status = serialItemsObj[itemObj.item].status+","+itemObj.status;
					}
				}
				else{
					obj = {};
					obj.quantity =  itemObj.available;
					obj.serial =  itemObj.inventorynumberText;
					if(invStatusFeatureEnabled){
						obj.status = itemObj.status;
					}
					serialItemsObj[itemObj.item] = obj;
				}
			}
		}
		log.debug({title:'serialItemsObj',details:serialItemsObj});
		if(!utility.isValueValid(itemInternalId)){//clicks the putAwayAll from itemPage then this code block will executes
			var	itemResults = inboundLib.getCartItemsPreferdBinDetails(whId,itemIdArr);
			var openTaskCartItemsResults = inboundLib.getCartBinDetailsFromOpenTask(whId,cartBinId,itemIdArr);
			var openTaskCartItemsResultsLength = openTaskCartItemsResults.length;
			log.debug({title:'itemResults',details:itemResults});
			log.debug({title:'openTaskCartItemsResults',details:openTaskCartItemsResults});
			
			var itemResultsLength = itemResults.length;
			var itemResultIndx = 0;
			var itemResultRow = [];
			var openTaskRow = {};
			var openTaskResultIndx =0;
			for(itemResultIndx = 0;itemResultIndx<itemResultsLength ; itemResultIndx++){
				itemResultRow = itemResults[itemResultIndx];
				if(itemResultRow.binnumber == toBinName){
					if(isNewBinScanned){
						isNewBinScanned = false;
					}
					itemsObjectWithScannedBin[itemResultRow.itemid] = true;	
				}
				else{
					itemsObjectWithOtherBin[itemResultRow.itemid] =true;
				}
			}
			for(openTaskResultIndx = 0;openTaskResultIndx<openTaskCartItemsResultsLength ; openTaskResultIndx++){

				openTaskRow = openTaskCartItemsResults[openTaskResultIndx];
				if(openTaskRow.custrecord_wmsse_reccommendedbin == toBinId ){
					if(isNewBinScanned){
						isNewBinScanned = false;
					}
					itemsObjectWithScannedBin[openTaskRow.custrecord_wmsse_skuText] = true;
				}
				else {
					itemsObjectWithOtherBin[openTaskRow.custrecord_wmsse_skuText] =true;
				}
			}
		}

		log.debug({title:'itemsObjectWithScannedBin',details:itemsObjectWithScannedBin});
		log.debug({title:'itemsObjectWithOtherBin',details:itemsObjectWithOtherBin});
		var binTransfer = record.create({
			type: record.Type.BIN_TRANSFER,
			isDynamic:true
		});
		binTransfer.setValue({
			fieldId: 'location',
			value: whId
		});
		var currDate = utility.DateStamp();
		var parsedCurrentDate = format.parse({
			value: currDate,
			type: format.Type.DATE
		});
		binTransfer.setValue({
			fieldId: 'trandate',
			value: parsedCurrentDate
		});
		var binTransferAddedSerialItems = [];
		var serailStr = '';
		var serialArr = [];
		var cartItemObj = {};
		var serialStatusArr = [];
		var serialStatusStr = '';
		for(var cartItem = 0 ; cartItem < cartItemsLength; cartItem++) {

			cartItemObj = cartItemListResults[cartItem];
			if((isNewBinScanned == true || (isNewBinScanned == false &&
					(itemsObjectWithScannedBin[cartItemObj.itemText] || ! itemsObjectWithOtherBin[cartItemObj.itemText])))
					&& binTransferAddedSerialItems.indexOf(cartItemObj.item) == -1 ){
				serialArr = [];
				if(cartItemObj.isserialitem && serialItemsObj[cartItemObj.item]){
					serailStr = serialItemsObj[cartItemObj.item].serial;
					serialStatusStr = serialItemsObj[cartItemObj.item].status;
					if(serailStr.length > 0 && serailStr.indexOf(',') != -1){
						serialArr = serailStr.split(',');
					}
					if(invStatusFeatureEnabled == true && serialStatusStr.length > 0 && serialStatusStr.indexOf(',') != -1){
						serialStatusArr = serialStatusStr.split(',');
					}
				}
				binTransfer.selectNewLine({
					sublistId: 'inventory',
				});
				binTransfer.setCurrentSublistValue({
					sublistId: 'inventory',
					fieldId: 'item',
					value: cartItemObj.item
				});
				if(cartItemObj.stockunit){
					binTransfer.setCurrentSublistValue({
						sublistId: 'inventory',
						fieldId: 'itemunits',
						value: parseInt(cartItemObj.stockunit)
					});
				}
				if(!cartItemObj.isserialitem){
					binTransfer.setCurrentSublistValue({
						sublistId: 'inventory',
						fieldId: 'quantity',
						value: cartItemObj.available
					});
				}
				else{
					var serialItemQty = Math.ceil(serialItemsObj[cartItemObj.item].quantity);
					binTransfer.setCurrentSublistValue({
						sublistId: 'inventory',
						fieldId: 'quantity',
						value: serialItemQty
					});
				}
				var	compSubRecord = null;
				try{
					compSubRecord = binTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					if(serialArr.length > 0){
						log.debug({title:'serialArr.length',details:serialArr.length});
						binTransferAddedSerialItems.push(cartItemObj.item);
						var serialArrLength = serialArr.length;
						for(var invtDetailCount = 0; invtDetailCount < serialArrLength ; invtDetailCount ++){
							
							fillInventoryDetailRecord(compSubRecord,1,serialArr[invtDetailCount],cartItemObj.binnumber,toBinId,serialStatusArr[invtDetailCount]);
						}
					}
					else{
						fillInventoryDetailRecord(compSubRecord,cartItemObj.available,cartItemObj.inventorynumberText,cartItemObj.binnumber,toBinId,cartItemObj.status);
					}
				}
				catch(e){
					log.debug({title:'e',details:e.message});
				}
				binTransfer.commitLine({sublistId:'inventory'});
			}
		}
		return  binTransfer.save();

	}
	function fillInventoryDetailRecord(compSubRecord,qty,inventorynumber,fromBinId,toBinId,status){

		if(compSubRecord != undefined && compSubRecord != null){
			compSubRecord.selectNewLine({
				sublistId: 'inventoryassignment'
			});
			compSubRecord.setCurrentSublistValue({
				sublistId:'inventoryassignment',
				fieldId: 'quantity',
				value:qty});
			if(utility.isValueValid(inventorynumber)){

				compSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'receiptinventorynumber',
					value: inventorynumber
				});

			}
			compSubRecord.setCurrentSublistValue({
				sublistId: 'inventoryassignment',
				fieldId: 'binnumber',
				value: fromBinId
			});	
			compSubRecord.setCurrentSublistValue({
				sublistId: 'inventoryassignment',
				fieldId: 'tobinnumber',
				value: toBinId
			});
			if(status){
				compSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'inventorystatus',
					value: status
				});
				compSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'toinventorystatus',
					value: status
				});
			}
			compSubRecord.commitLine({sublistId:'inventoryassignment'});
		}
	}
	return {
		'post': doPost,
		'validateItemsForPutaway':validateItemsForPutaway
	};

});
