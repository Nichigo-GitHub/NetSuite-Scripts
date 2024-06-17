/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope public
 */
define(['N/search','N/record','./wms_utility','./big','./wms_translator','./wms_inventory_utility'],

		function(search,record,utility,Big,translator,invtUtility) {

	/**
	 * Function to validate TO Location and posting the inventory transfer for NO Bin flow .
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 */
	function doPost(requestBody) {

		var scannedQuantity ='';
		var fromBinName='';			
		var itemType='';
		var fromBinInternalId = '';
		var itemInternalId = '';
		var warehouseLocationId = '';
		var lotName = '';
		var actualBeginTime = '';
		var stockConversionRate = '';
		var stockUnitName ='';
		var fromStatusInternalId ='';
		var statusInternalId ='';
		var unitType='';
		var putawayAll='';
		var invtTransferPostingObj = {};
		var processType='';
		var lotInternalId='';
		var lotId='';
		var toWarehouseLocationId='';
		var requestParams = '';
		var impactRec = {};
		var openTaskArr = [];
		var invTransferArr = [];
		var labelRecArr = [];
		var extlabelRecArr = [];
		var fromLocUseBinsFlag = '';
		var impactedRecords = {};
		var toWarehouseLocationName ='';
		var warehouseLocationDetails={};
		var navigateToBinPage ='';
		var navigateToStatusPage ='';
		var tallyLoopObj = '';
		var uomSelectionforFirstItr = '';
		var qtyUomSelected = '';
		var tallyScanBarCodeQty ='';
		var isTallyScanRequired ='';
		var barcodeQuantity ='';
		var noStockAction = '';
		try
		{
			if (utility.isValueValid(requestBody)) {
				requestParams = requestBody.params;
				scannedQuantity = requestParams.scannedQuantity;
				fromBinName = requestParams.fromBinName;
				itemType = requestParams.itemType;
				fromBinInternalId = requestParams.fromBinInternalId;
				itemInternalId = requestParams.itemInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				lotName = requestParams.lotName;
				lotInternalId = requestParams.lotInternalId;
				lotId=requestParams.lotId;
				actualBeginTime = requestParams.actualBeginTime;
				stockConversionRate = requestParams.stockConversionRate;
				stockUnitName = requestParams.stockUnitName;
				fromStatusInternalId = requestParams.fromStatusInternalId;
				statusInternalId = requestParams.statusInternalId;
				unitType = requestParams.unitType;
				putawayAll=requestParams.putawayAll;
				processType=requestParams.processType;
				toWarehouseLocationId = requestParams.toWarehouseLocationId;
				fromLocUseBinsFlag =  requestParams.fromLocUseBinsFlag;
				toWarehouseLocationName = requestParams.toWarehouseLocationName;
				navigateToBinPage =  requestParams.navigateToBinPage;
				navigateToStatusPage = requestParams.navigateToStatusPage;
				tallyLoopObj = requestParams.tallyLoopObj;
				isTallyScanRequired = requestParams.isTallyScanRequired;
				tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
				noStockAction = requestParams.noStockAction;
				var totalPutawayQty=0;		

				log.debug({title:'requestParams',details:requestParams});
				var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
				/*------------------------- Checking location to be valid or not if post directly from TO location ----------------------*/
				warehouseLocationDetails.isValid = true;
				if(utility.isValueValid(toWarehouseLocationName) && !(utility.isValueValid(toWarehouseLocationId))){
					var vLocationArr=utility.getRoleBasedLocation();
					if(vLocationArr.length==0){
						//for non oneWorld account to fetch all locations
						vLocationArr=utility.getAllLocations();
					}
					var locationSearch = search.load({id:'customsearch_wmsse_getrolelocation'});
					var locationSearchFilter = locationSearch.filters;
					locationSearchFilter.push(search.createFilter({
						name: 'name',
						operator: search.Operator.IS,
						values : toWarehouseLocationName
					}));
					locationSearch.filters = locationSearchFilter;
					var locResult = utility.getSearchResultInJSON(locationSearch);
					log.debug({title:'locResult',details:locResult});

					if(locResult.length > 0){
						var locId=locResult[0].id;
						if(vLocationArr.length > 0 && vLocationArr.indexOf(locId) == -1){
							warehouseLocationDetails.errorMessage = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
							warehouseLocationDetails.isValid = false;
						}
						else{
							var boolUseBins = locResult[0].usesbins;

							if(inventoryStatusFeature && boolUseBins ==  false)
							{
								warehouseLocationDetails.navigateToStatusPage = true;
							}else if(inventoryStatusFeature == false && boolUseBins ==  false ){
								warehouseLocationDetails.navigateToBinPage = false;
							}else if(boolUseBins ==  true){
								warehouseLocationDetails.navigateToBinPage = true;
							}

							warehouseLocationDetails.useBinsFlag = boolUseBins;
							warehouseLocationDetails.custparam_whlocation = locId;
							toWarehouseLocationId=locId;
						}
					}
					else{
						warehouseLocationDetails.errorMessage =translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						warehouseLocationDetails.isValid = false;
					}


				}else if(!(utility.isValueValid(toWarehouseLocationName)) && !(utility.isValueValid(toWarehouseLocationId))){
					warehouseLocationDetails.errorMessage =translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
					warehouseLocationDetails.isValid = false;
				}
				/*----------------------- Posting inventory transfer record for no Bins flow ----------------------*/
				if(	warehouseLocationDetails.isValid == true && (warehouseLocationDetails.navigateToBinPage == false || navigateToBinPage == false || navigateToStatusPage == true)){

						tallyScanBarCodeQty = utility.isValueValid(tallyScanBarCodeQty) ? tallyScanBarCodeQty : 0;
						tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
					if(!utility.isValueValid(stockConversionRate))
					{
						stockConversionRate = 1;
					}
					var invtransferObj ={};
					if(putawayAll=='putawayAll')
					{	

						if ((utility.isValueValid(fromBinName) || utility.isValueValid(fromLocUseBinsFlag)) && utility.isValueValid(itemType) && (utility.isValueValid(fromBinInternalId) || utility.isValueValid(fromLocUseBinsFlag))
								&& utility.isValueValid(itemInternalId)  && utility.isValueValid(warehouseLocationId)) {

							invtransferObj.itemType = itemType;
							invtransferObj.whLocation=warehouseLocationId;
							invtransferObj.towhLocation=toWarehouseLocationId;
							invtransferObj.itemId=itemInternalId;
							invtransferObj.fromBinId=fromBinInternalId;
							invtransferObj.actualBeginTime=actualBeginTime;
							invtransferObj.units=stockUnitName;
							invtransferObj.stockConversionRate=stockConversionRate;
							invtransferObj.fromLocUseBinsFlag=fromLocUseBinsFlag;

							if(utility.isInvStatusFeatureEnabled())
							{
								invtransferObj.frominvtstatus=fromStatusInternalId;
								invtransferObj.statusInternalId=statusInternalId;
								invtransferObj.fromStatus=fromStatusInternalId;
								invtransferObj.toStatus=statusInternalId;
								log.debug({title:'invtransferObj',details:invtransferObj});
							}

							impactRec = invtUtility.transferallInvTransfer(invtransferObj);

							if(utility.isValueValid(impactRec.inventoryCountId))
							{
								invTransferArr.push(impactRec.inventoryCountId);
							}else
							{
								invTransferArr.push();
							}

							if(utility.isValueValid(impactRec.opentaskId))
							{
								openTaskArr.push(impactRec.opentaskId);
							}else
							{
								openTaskArr.push();
							}
							impactedRecords.inventorytransfer = invTransferArr;
							impactedRecords.customrecord_wmsse_trn_opentask = openTaskArr;

						}
					}
					else
					{

						if (utility.isValueValid(scannedQuantity) && (utility.isValueValid(fromBinName) || utility.isValueValid(fromLocUseBinsFlag))
								&& utility.isValueValid(itemType)  && (utility.isValueValid(fromBinInternalId) || utility.isValueValid(fromLocUseBinsFlag))
								&& utility.isValueValid(itemInternalId)  && utility.isValueValid(warehouseLocationId)) {


								var binTransferQty=0;
								var openTaskQty =0;
								if (noStockAction != 'nostock') {
									binTransferQty = Number((Big(scannedQuantity).div(stockConversionRate)).toFixed(8));
									openTaskQty = Number((Big(scannedQuantity).div(stockConversionRate)).toFixed(8));
								}
								else
								{
									binTransferQty = scannedQuantity;
									openTaskQty = scannedQuantity;
								}

								//var invtransferObj ={};
								invtransferObj.itemType=itemType;
								invtransferObj.whLocation=warehouseLocationId;
								invtransferObj.towhLocation=toWarehouseLocationId;
								invtransferObj.itemId=itemInternalId;
								invtransferObj.quantity=binTransferQty;
								if(utility.isValueValid(fromBinInternalId)){
									invtransferObj.fromBinId=fromBinInternalId;
								}
								invtransferObj.batchno=lotName;
								invtransferObj.actualBeginTime=actualBeginTime;
								invtransferObj.units=stockUnitName;
								invtransferObj.stockConversionRate=stockConversionRate;
								invtransferObj.opentaskQty=openTaskQty;

							if(utility.isInvStatusFeatureEnabled())
							{
								invtransferObj.frominvtstatus=fromStatusInternalId;
								invtransferObj.statusInternalId=statusInternalId;
								invtransferObj.fromStatus=fromStatusInternalId;
								invtransferObj.toStatus=statusInternalId;
							}
								var tallyScanObj ={};
								if((utility.isValueValid(tallyLoopObj)) && (itemType != "serializedinventoryitem"  &&  itemType != "serializedassemblyitem")) {

									tallyScanObj =invtUtility.buildObjectFromTallyLoopObj(isTallyScanRequired,itemType,tallyLoopObj,tallyScanBarCodeQty);
									log.debug('tallyScanObj',tallyScanObj);
								}

								if(tallyScanObj.isTallyScanRequired)
								{
									invtransferObj.isTallyScanRequired = tallyScanObj.isTallyScanRequired;
									invtransferObj.lotArray = tallyScanObj.lotArray;
									invtransferObj.tallyQtyArr = tallyScanObj.tallyQtyArr;
									invtransferObj.statusArray = tallyScanObj.statusArray;
									//invtransferObj.quantity= Number(Big(tallyScanObj.tallyScanBarCodeQty).mul(stockConversionRate));
								}
							impactRec =  invtUtility.inventoryInvTransfer(invtransferObj);

							if(utility.isValueValid(impactRec.inventoryCountId)){
								invTransferArr.push(impactRec.inventoryCountId);
							}else{
								invTransferArr.push();
							}

							if(utility.isValueValid(impactRec.opentaskId)){
								openTaskArr.push(impactRec.opentaskId);
							}else{
								openTaskArr.push();
							}
							impactedRecords.inventorytransfer = invTransferArr;
							impactedRecords.customrecord_wmsse_trn_opentask = openTaskArr;
							impactedRecords._ignoreUpdate = false;

						}
						else
						{
							invtTransferPostingObj.errorMessage = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
							invtTransferPostingObj.isValid = false;
						}

					}

					labelRecArr.push();
					extlabelRecArr.push();
					impactedRecords.customrecord_wmsse_labelprinting = labelRecArr;
					impactedRecords.customrecord_wmsse_ext_labelprinting = extlabelRecArr;

					invtTransferPostingObj.impactedRecords = impactedRecords;
					invtTransferPostingObj.isValid = true;
					log.debug({title:'impactedRecords :', details: impactedRecords });
				}
				for(objValue in warehouseLocationDetails){
					invtTransferPostingObj[objValue] =  warehouseLocationDetails[objValue];
				}

			}
			else
			{
				invtTransferPostingObj.errorMessage = translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
				invtTransferPostingObj.isValid = false;
			}
		}
		catch(e)
		{
			invtTransferPostingObj.isValid = false;
			invtTransferPostingObj.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

		return invtTransferPostingObj;

	}

	return {
		'post': doPost

	};

});
