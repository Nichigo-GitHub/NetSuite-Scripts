/**
 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./big','./wms_translator','N/runtime','./wms_inventory_utility','./wms_tallyScan_utility'],

		function(utility,Big,translator,runtime,invtUtility,tallyScanUtil) {

	/**
	 * This function is to validate the scanned item
	 *
	 */
	function doPost(requestBody) {

		var cycItemDetails = {};
		var itemName = '';
		var warehouseLocationId ='';
		var cyclePlanId = '';
		var binInternalId = '';
		var itemType = '';
		var zeroQty = '';
		var actualBeginTime = '';
		var unitsType = '';
		var unit = '';
		var conversionRate = '';
		var binName = '';
		var inventoryStatusFeature = '';
		var multiStatusInvItem = 'false';
		var fromReconcileTaskList='';
		var fromReconcilePlanList='';
		var requestParams = '';
		var locUseBinsFlag = '';
		var invCountPostingObj = {};
		var inventoryCountRecId = '';
		var PlanInternalId = '';
		var PlanLine = '';
		var itemInternalid = '';
		var lineNumber = '';
		var invCountPostingOutputObj ={};
		var itemDetails = {};
		var baseUnitId = '';
		var baseUnitName = '';
		var baseUnitConvRate = '';
		var processNameFromState = '';
		var itemList = '';
		var scannedQuantity = 0;

			log.debug('requestBody',requestBody);
		try{
			if (utility.isValueValid(requestBody)) {
				requestParams = requestBody.params;
				itemName = requestParams.itemName;
				warehouseLocationId = requestParams.warehouseLocationId;
				cyclePlanId = requestParams.cyclePlanId;
				binInternalId = requestParams.binInternalId;
				zeroQty = requestParams.zeroQty;
				actualBeginTime = requestParams.actualBeginTime;
				unitsType = requestParams.unitsType;
				unit = requestParams.unit;
				binName = requestParams.binName;
				fromReconcileTaskList = requestParams.fromReconcileTaskList;
				fromReconcilePlanList = requestParams.fromReconcilePlanList;
				inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
				locUseBinsFlag  = requestParams.locUseBinsFlag;
				lineNumber  = requestParams.lineNumber;
				processNameFromState = requestParams.processNameFromState;
				if(!utility.isValueValid(locUseBinsFlag))
				{
					locUseBinsFlag =utility.lookupOnLocationForUseBins(warehouseLocationId);
				}

				if(zeroQty == 'zeroQty' && (fromReconcileTaskList == true || fromReconcilePlanList == true ))
				{
					itemList = invtUtility.getCyclePlanTaskDetails(cyclePlanId, warehouseLocationId, binName, null, null,true);
					
					for(var itemListIndex in itemList){
						if(itemList[itemListIndex]){
							PlanInternalId = itemList[itemListIndex].id;
							PlanLine = itemList[itemListIndex].line;
							itemInternalid = itemList[itemListIndex].item;
							itemType  = utility.getItemType(itemInternalid, warehouseLocationId);
							invCountPostingObj ={};
							invCountPostingObj.planInternalId = PlanInternalId;
							invCountPostingObj.planLineNo = PlanLine;
							invCountPostingObj.enterQty = scannedQuantity;
							invCountPostingObj.itemType = itemType;
							invCountPostingObj.itemId = itemInternalid;
							invCountPostingObj.whLocation = warehouseLocationId;
							invCountPostingObj.zeroQty = zeroQty;
							invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
							inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

							if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
								cycItemDetails.isValid = false;
								cycItemDetails.errorMessage = invCountPostingOutputObj.errorMessage;
							}else{
								invtUtility.updateCycleCountOpenTask(PlanInternalId, itemInternalid, PlanLine, 
										scannedQuantity, binInternalId, itemType, warehouseLocationId, null, inventoryCountRecId, 
										cyclePlanId, actualBeginTime,unit, conversionRate);
							}
						}
					}
					cycItemDetails.completionStatus  = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId);
					cycItemDetails.isValid  = true;
				}
				else if(zeroQty == 'zeroQty')
				{
					itemList = invtUtility.getCyclePlanTaskDetails(cyclePlanId, warehouseLocationId, binName, null, true);

					for(var itemIndex in itemList){
						if(itemList[itemIndex]){
							PlanInternalId = itemList[itemIndex].id;
							PlanLine = itemList[itemIndex].line;
							itemInternalid = itemList[itemIndex].item;
							itemType  = utility.getItemType(itemInternalid, warehouseLocationId);
							invCountPostingObj ={};
							invCountPostingObj.planInternalId = PlanInternalId;
							invCountPostingObj.planLineNo = PlanLine;
							invCountPostingObj.enterQty = scannedQuantity;
							invCountPostingObj.itemType = itemType;
							invCountPostingObj.itemId = itemInternalid;
							invCountPostingObj.whLocation = warehouseLocationId;
							invCountPostingObj.binInternalId = binInternalId;
							invCountPostingObj.zeroQty = zeroQty;
							invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
							inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

							if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
								cycItemDetails.isValid  = false;
								cycItemDetails.errorMessage  = invCountPostingOutputObj.errorMessage;
							}else{
								invtUtility.updateCycleCountOpenTask(PlanInternalId, itemInternalid, PlanLine, 
										scannedQuantity, binInternalId, itemType, warehouseLocationId, null, inventoryCountRecId, 
										cyclePlanId, actualBeginTime,unit, conversionRate);
							}
						}
					}
					cycItemDetails.completionStatus  = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId);
					cycItemDetails.isValid  = true;
				}
				else if((utility.isValueValid(itemName) && utility.isValueValid(binInternalId) && utility.isValueValid(cyclePlanId)) ||
						(locUseBinsFlag!='undefined' && locUseBinsFlag!=undefined && locUseBinsFlag == false && utility.isValueValid(itemName) && utility.isValueValid(cyclePlanId)))
				{
					var currItem = utility.itemValidationForInventoryAndOutBound(itemName,warehouseLocationId);

					if(utility.isValueValid(currItem.itemInternalId) || utility.isValueValid(currItem.barcodeIteminternalid))
					{

						if(utility.isValueValid(currItem.itemInternalId)){
							itemInternalid = currItem.itemInternalId;
							cycItemDetails.itemName  = currItem.itemName;
						}
						else
						{   
							itemInternalid = currItem.barcodeIteminternalid;
							cycItemDetails.itemName  = currItem.barcodeItemname;
						}

						itemInternalid = (currItem.itemInternalId ?  currItem.itemInternalId : currItem.barcodeIteminternalid);
						var unitTypeVar ='';
						var stockUnitName ='';							
						var stockConversionRate ='';
						var columnArray =[];
						columnArray.push('unitstype');
						columnArray.push('stockunit');								
						columnArray.push('usebins');																
						var itemLookUp = utility.getItemFieldsByLookup(itemInternalid,columnArray);

						if(utility.isValueValid(itemLookUp.unitstype[0]) && utility.isValueValid(itemLookUp.unitstype[0]))
						{
							unitTypeVar = itemLookUp.unitstype[0].value;
							stockUnitName = itemLookUp.stockunit[0].text;                                  
							cycItemDetails.stockUnitName  =stockUnitName;								
							stockConversionRate = invtUtility.getOpenTaskStockCoversionRate(unitTypeVar,stockUnitName);
						}

						cycItemDetails.stockConversionRate  =stockConversionRate;
						var unitTypeIdNum = unitTypeVar;

						cycItemDetails	= utility.addItemDatatoResponse(cycItemDetails, currItem, unitTypeIdNum, stockUnitName);						

						itemType  = utility.getItemType(itemInternalid,warehouseLocationId);
						itemDetails = tallyScanUtil.getItemDetails(itemInternalid,itemDetails) ;
						itemDetails = tallyScanUtil.getTallyScanRuleData(warehouseLocationId,processNameFromState,itemDetails,false);
						var arrPlandetails=invtUtility.getPlanDetails(cyclePlanId,itemInternalid,binInternalId,warehouseLocationId,locUseBinsFlag,lineNumber);
						if(arrPlandetails!=null && arrPlandetails!='' && arrPlandetails.length>0)
						{
							var taskDetails = arrPlandetails[0];
							PlanLine=taskDetails.line;
							var PlanLineLocation=taskDetails.location;
							var PlanItemId=taskDetails.item;
							//	var PlanItemText=taskDetails.itemText;
							//	var PlanBin=taskDetails.binnumber;
							//	var PlanBinText=taskDetails.binnumberText;
							PlanInternalId=taskDetails.internalidText;
							var PlanCountQty=taskDetails.quantity;
							//	var planStatus=taskDetails.statusrefText;
							var planStatusId = taskDetails.statusref;
							var transactionUOMId = taskDetails.unitid;
							var transactionUOMName = taskDetails.unit;
							unitsType = taskDetails.unitstype;

							var itemColumnArray =[];
							itemColumnArray.push('stockunit');	
							itemColumnArray.push('salesdescription');	
							itemColumnArray.push('usebins');
							var itemFieldLookUp = utility.getItemFieldsByLookup(PlanItemId,itemColumnArray);
							log.debug('itemFieldLookUp',itemFieldLookUp);
							if((!utility.isValueValid(locUseBinsFlag) || locUseBinsFlag == true) && itemFieldLookUp.usebins == false){
								cycItemDetails.errorMessage  = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.USEBINS_FLASE');
								cycItemDetails.isValid  = false;
							}
							else
							{ 
								if(planStatusId == 'started')
								{
									if(PlanLineLocation==null || PlanLineLocation=='')
									{
										PlanLineLocation=warehouseLocationId;
									}
									var lockError = utility.checkTransactionLock('inventorycount',PlanInternalId, PlanLine);
									if(utility.isValueValid(lockError)){
										cycItemDetails.isValid  = false;
										cycItemDetails.errorMessage  = lockError;
									}else{
										if(inventoryStatusFeature && (itemType == "inventoryitem" || itemType == "assemblyitem")){
											var invBalanceDtls = invtUtility.getInventoryBalanceDetails(warehouseLocationId, itemInternalid, binInternalId, locUseBinsFlag);
											if(invBalanceDtls.length > 1){
												multiStatusInvItem = 'true';
											}else if(invBalanceDtls.length == 1){
												multiStatusInvItem = 'false';
											}
										}
										if(utility.isValueValid(unitsType))
										{ 
											var uomResult = tallyScanUtil.getUOMDetails(unitsType);
											for(var itr in uomResult){
												if(uomResult[itr]['uom.baseunit']){
													baseUnitId = uomResult[itr]['uom.internalid'];
													baseUnitName = uomResult[itr]['uom.unitname'];
													baseUnitConvRate = uomResult[itr]['uom.conversionrate'];
												}
											}
										}

										cycItemDetails.multiStatusInvItem  = multiStatusInvItem;
										cycItemDetails.lineno  = PlanLine;
										cycItemDetails.itemInternalId  = PlanItemId;
										cycItemDetails.cyclePlanId  = cyclePlanId;
										cycItemDetails.itemType  = itemType;
										cycItemDetails.cycPlaninternalid  = PlanInternalId;
										cycItemDetails.transactionUOMId  = transactionUOMId; 
										cycItemDetails.transactionUOMName  = transactionUOMName;  
										
										cycItemDetails.isTallyScanRequired = itemDetails.isTallyScanRequired;
										cycItemDetails.tallyScanBarCodeQty = itemDetails.tallyScanBarCodeQty;
										cycItemDetails.showNoStockButton = true;
										if(itemDetails.itemType == "serializedinventoryitem" || itemDetails.itemType=="serializedassemblyitem"){
											if(itemDetails.isTallyScanRequired == true){
											cycItemDetails.barcodeQuantity = [{'value': '1', 'unit': baseUnitId}];
											cycItemDetails.uomSelectionforFirstItr = baseUnitId;//For Serial Item.. It should be base units
											}
											cycItemDetails.numberOfTimesSerialScanned = 0;
										}else if(!(itemDetails.itemType == 'lotnumberedinventoryitem' || itemDetails.itemType == 'lotnumberedassemblyitem')){
											if(itemDetails.isTallyScanRequired == true){
											cycItemDetails.barcodeQuantity = [{'value': '1', 'unit': transactionUOMId}];
											}
										}

										if(utility.isValueValid(PlanCountQty) && locUseBinsFlag!='undefined' && locUseBinsFlag!=undefined && locUseBinsFlag == false)
										{
											cycItemDetails.itemIsForEdit  = true;
										}
										cycItemDetails.fromReconcileItemList =true;
										if (itemFieldLookUp.thumbnailurl != undefined) 
										{
											cycItemDetails.imageUrl  = itemFieldLookUp.thumbnailurl;
										}
										if (itemFieldLookUp.stockunit != undefined && itemFieldLookUp.stockunit != "") 
										{
											cycItemDetails.stockUnitName  = itemFieldLookUp.stockunit[0].text;
										}
										if(utility.isValueValid(itemFieldLookUp.salesdescription)){
											cycItemDetails.salesDescription  = itemFieldLookUp.salesdescription;
										}

										cycItemDetails.isValid  = true;
									}
								}

								else
								{
									cycItemDetails.errorMessage  = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.COUNT_ALREADY_COMPLETED');
									cycItemDetails.isValid  = false;
								}
							}
						}
						else
						{
							if(locUseBinsFlag == false){
								cycItemDetails.errorMessage  = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.INVALID_ITEM_CYCLECOUNTPLAN_COMBINATION');
								cycItemDetails.isValid  = false;
							}
							else{
								cycItemDetails.errorMessage  = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.INVALID_ITEM_BIN_COMBINATION');
								cycItemDetails.isValid  = false;
							}


						}
					}
					else
					{   
						var itemresults= utility.checkInactiveItem(itemName,warehouseLocationId);
						if(itemresults!=null && itemresults!='')
						{
							if(utility.isValueValid(itemresults.error))
							{
								cycItemDetails.errorMessage  = itemresults.error;
								cycItemDetails.isValid  = false;
							}
							else
							{
								log.debug('itemresults1',itemresults);
								cycItemDetails.errorMessage  = currItem.error;
								//cycItemDetails.errorMessage  = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
								cycItemDetails.isValid  = false;
							}
						}
						else
						{
							cycItemDetails.errorMessage  = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
							cycItemDetails.isValid  = false;
						}

					}
				}
				else
				{
					cycItemDetails.errorMessage  = translator.getTranslationString('REPLEN_TASKVALIDATE.VALID_ITEM');
					cycItemDetails.isValid  = false;
				}
			}
			else{

				cycItemDetails.isValid  = false;
			}
		}
		catch(e)
		{
			cycItemDetails.isValid  = false;
			cycItemDetails.errorMessage  = e.message;
		}
		return cycItemDetails;
	}

	function getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId){
		var getCycPlanTasksResult = invtUtility.getCyclePlanTaskDetails(cyclePlanId, warehouseLocationId, null, null, true);
		return getCycPlanTasksResult.length > 0 ? 'planNotCompleted' : 'planCompleted';
	}

	
	return {
		'post': doPost
	};

});
