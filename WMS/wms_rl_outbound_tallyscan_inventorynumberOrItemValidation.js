/**
 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_outBoundUtility','./wms_tallyScan_utility','./big','N/runtime'],

		function(utility,translator,obUtility,tallyScanUtility,bigJS,runtime) {
	/**
	 * Function to validate lot
	 */

	function doPost(requestBody) {

		var lotListDetailsObj = {};
		try{

			var requestParams = requestBody.params;
			log.debug({title:'requestParams',details:requestParams});
			if(utility.isValueValid(requestParams))	{

				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var fromBinInternalId = requestParams.fromBinInternalId;
				var lotName = requestParams.lotName;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var tallyLoopObj  = requestParams.tallyLoopObj;
				var itemType = requestParams.itemType;
				var orderInternalId =  requestParams.orderInternalId;
				var line = requestParams.line;
				var enterQty = requestParams.enterQty;
				var transactiontype = requestParams.transactiontype;
				var pickStatusInternalId = requestParams.pickStatusInternalId;
				var orderLineQty = requestParams.orderLineQty;
				var pickTaskId = requestParams.pickTaskId;
				var waveId = requestParams.waveId;
				var unitType = requestParams.unitType;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var lineItemPickedQuantity = requestParams.lineItemPickedQuantity;
				var tallyScanOrderQty = requestParams.tallyScanBarCodeQty;
				var itemName = requestParams.itemName;
				var skipBtnCount =  requestParams.skipBtnCount;
				var lotString = requestParams.lotString;
				var qtyUOMObj = requestParams.qtyUOMObj;
				var isContainerScanRequired = requestParams.isContainerScanRequired;
				var scannedPage = requestParams.scannedPage;
				var stockUomConversionRate = requestParams.stockUomConversionRate;
				var numberOfTimesSerialScanned= requestParams.numberOfTimesSerialScanned;
				var scannedQuantityInBaseUnits= requestParams.scannedQuantityInBaseUnits;
				var isInvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
				var lotId = '';
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var waveName = requestParams.waveNumber;
                var binEmptySysRuleVal = requestParams.binEmptySystemRuleValue;
                var stageByOrderSysRuleVal = requestParams.stageByOrderSystemRuleValue;

				if(!utility.isValueValid(requestParams)){
					locUseBinsFlag = true;
				}
				if(!utility.isValueValid(scannedPage)){
					scannedPage = 'lot';
				}
				isZonePickingEnabled = isZonePickingEnabled || false;
				selectedZones = selectedZones || [];


				if(utility.isValueValid(warehouseLocationId) &&
						(utility.isValueValid(itemInternalId) && (utility.isValueValid(lotName) || utility.isValueValid(itemName) ))&&
						(utility.isValueValid(fromBinInternalId) || locUseBinsFlag == false))	{
					var itemId = itemInternalId;
					log.debug({title:'requestParams',details:requestParams});
					if(utility.isValueValid(itemName)){

						var itemOutputObj = utility.itemValidationForInventoryAndOutBound(itemName, warehouseLocationId);
						itemId = '';
						if(!utility.isValueValid(itemOutputObj.error) ){
							itemId = utility.isValueValid(itemOutputObj.barcodeIteminternalid) ? itemOutputObj.barcodeIteminternalid: itemOutputObj.itemInternalId;
						}

					}
					else {
						if(scannedPage == 'item' && !utility.isValueValid(itemName)){
							itemId = '';
						}
					}
					if(itemId == itemInternalId){

						var availableQty = 0;
						if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
							var lotDetails = {};
							lotDetails.warehouseLocationId = warehouseLocationId;
							lotDetails.itemInternalId = itemInternalId;
							lotDetails.fromBinInternalId = fromBinInternalId;
							lotDetails.fromInventorystatus = pickStatusInternalId;
							if(utility.isValueValid(transactiontype) && transactiontype=='TrnfrOrd')
							{
								lotDetails.orderType = transactiontype;
							}												
							var	lotValidateDetails = obUtility.getPickingLotDetails(lotDetails);
							log.debug({title:'lotValidateDetails',details:lotValidateDetails});	

							var lotValidateDetailsLength = lotValidateDetails.length;
							var lotDetailRec = 0;
							var inventoryNumber = '';
							
							if(lotValidateDetailsLength > 0){
								
								for(lotDetailRec = 0; lotDetailRec <  lotValidateDetailsLength;lotDetailRec++) {
									inventoryNumber = lotValidateDetails[lotDetailRec].inventorynumberText;
									if(inventoryNumber == lotName)
									{
										lotId = lotValidateDetails[lotDetailRec].inventorynumber;
										lotListDetailsObj.lotInternalId = lotValidateDetails[lotDetailRec].inventorynumber;
										availableQty = parseFloat(availableQty) + parseFloat(lotValidateDetails[lotDetailRec].available);
										if(utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(stockUomConversionRate) && 
												(stockUomConversionRate != transactionUomConversionRate))
										{
											availableQty = utility.uomConversions(availableQty,transactionUomConversionRate,stockUomConversionRate);
										}

									}
								}
							}
						}else{
                            lotListDetailsObj.qtyUOMObj = qtyUOMObj;
                            lotListDetailsObj.unitType = unitType;
                            lotListDetailsObj.transactionUomConversionRate = transactionUomConversionRate;
                            lotListDetailsObj.scannedQuantityInBaseUnits = scannedQuantityInBaseUnits;
                            lotListDetailsObj.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
                            lotListDetailsObj.itemType = itemType;
							availableQty = enterQty;
						}
						log.debug({title:'availableQty',details:availableQty});	
						log.debug({title:'enterQty',details:enterQty});	
						log.debug({title:'orderLineQty',details:orderLineQty});	
						if(parseFloat(availableQty)  >= parseFloat(enterQty)){
							var remainingQty = Number(bigJS(parseFloat(orderLineQty)).minus(parseFloat(enterQty)));

							log.debug({title:'remainingQty',details:remainingQty});	
							tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
							var obj = {};
							obj.qtyUOMObj = qtyUOMObj;
							obj.transactionUomConversionRate = transactionUomConversionRate;
						    tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanObj(tallyLoopObj,itemType,orderInternalId,line,enterQty,pickStatusInternalId,'',lotName,obj);
							lotListDetailsObj.tallyLoopObj = tallyLoopObj;

							if(utility.isValueValid(lotName)) {
								lotListDetailsObj.lotString = utility.isValueValid(lotString) ? (lotString+","+lotName) : lotName;
							}
							lotListDetailsObj.tallyscanCartonScanRequired = false;
							if(parseFloat(remainingQty) == 0 ) {
								if(utility.isValueValid(isContainerScanRequired) && !isContainerScanRequired) {
									if(!utility.isValueValid(lineItemPickedQuantity)) {
										lineItemPickedQuantity=0;
									}
									var picktaskObj = {};
									picktaskObj.whLocation = warehouseLocationId;
									picktaskObj.picktaskid = pickTaskId;
									picktaskObj.pickqty = enterQty;
									picktaskObj.fromBinId = fromBinInternalId;
									picktaskObj.batchno = lotName;
									picktaskObj.statusInternalId = pickStatusInternalId ;
									picktaskObj.itemType = itemType;
									picktaskObj.line = line;
									picktaskObj.orderInternalId = orderInternalId;
									picktaskObj.totalLinepickqty = Number(bigJS(enterQty).plus(lineItemPickedQuantity));
									picktaskObj.locUseBinsFlag = locUseBinsFlag;
									picktaskObj.lotInternalId =lotId;
									picktaskObj.tallyLoopObj =tallyLoopObj;
									picktaskObj.itemId = itemInternalId;
									picktaskObj.isTallyScanRequired = true;
									picktaskObj.inventoryStatusFeature = isInvStatusFeatureEnabled;
									obUtility.multiOrderPicktaskUpdate(picktaskObj);
                                    lotListDetailsObj.tallyLoopObj = {};
								}
								else {
									lotListDetailsObj.tallyscanCartonScanRequired = true;
									lotListDetailsObj.totalLinepickqty = Number(bigJS(enterQty).plus(lineItemPickedQuantity));
								}
							}
							var orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,pickTaskId,'',transactiontype,'');
							log.debug({title:'orderDetails',details:orderDetails});	
							var ordersLength = orderDetails.length;
							if(ordersLength > 0 ) {
								lotListDetailsObj.newOrderScanRequired = parseFloat(remainingQty) > 0 ? 'false' : 'true';
								
								log.debug({title:'skipBtnCount',details:skipBtnCount});	
								log.debug({title:'ordersLength',details:ordersLength});	
								if(!utility.isValueValid(skipBtnCount) ||
										(utility.isValueValid(skipBtnCount) && (parseInt(skipBtnCount)+1) > ordersLength)) {
									skipBtnCount = 0;
								}
								var ordObj = orderDetails[skipBtnCount];
								obUtility.fillObjectWithNextOrderDetails(ordObj,lotListDetailsObj,unitType,true);
								if(parseInt(skipBtnCount)+1 >= ordersLength) {
									lotListDetailsObj.showskipbtn = 'F';
								}
								else {
									lotListDetailsObj.showskipbtn = 'T';
								}
								
								if(parseFloat(remainingQty) > 0) {
									var	remainingQtyWithUom = parseFloat(ordObj.lineitemremainingquantity) - (parseFloat(enterQty))+ " " + lotListDetailsObj.transactionUomName;
									lotListDetailsObj.lblRemainingQuantity = remainingQtyWithUom;
									lotListDetailsObj.remainingQty = ordObj.lineitemremainingquantity;
									lotListDetailsObj.tallyScanOrderQty = tallyScanOrderQty;

									lotListDetailsObj.isValid  = true;
									if(utility.isValueValid(unitType)){
										var quantityUOMObj = tallyScanUtility.getQtyObjectToBePopulated(enterQty,qtyUOMObj,transactionUomConversionRate);
										lotListDetailsObj.barcodeQuantity = quantityUOMObj;
									}
									else{
										lotListDetailsObj.barcodeQuantity = parseFloat(enterQty)+1;
									}
								}
								else {
									var	remainingQtyWithUom = parseFloat(ordObj.lineitemremainingquantity)+ " " + lotListDetailsObj.transactionUomName;
									lotListDetailsObj.lblRemainingQuantity = remainingQtyWithUom;
									lotListDetailsObj.remainingQty = ordObj.lineitemremainingquantity;
									lotListDetailsObj.barcodeQuantity = 1;
									lotListDetailsObj.tallyScanOrderQty = 0;
                                    
								}
                                if(utility.isValueValid(binEmptySysRuleVal) && binEmptySysRuleVal == true) {
                                    lotListDetailsObj.showNavButtons = true;
                                    if (utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true
                                        && utility.isValueValid(stageByOrderSysRuleVal) && stageByOrderSysRuleVal == true ) {

                                        var pickedOrdersArr = obUtility.getPickedOrders(waveName, warehouseLocationId, selectedZones, pickTaskId);
                                        lotListDetailsObj.ordersToStageCount = pickedOrdersArr.length;
                                        var ordersIdArr = [];
                                        for (var ord in pickedOrdersArr) {
                                            if (pickedOrdersArr[ord]) {
                                                ordersIdArr.push(pickedOrdersArr[ord].id);
                                            }
                                        }
                                        lotListDetailsObj.selectedOrders = ordersIdArr;
                                        lotListDetailsObj.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder', '', orderInternalId, warehouseLocationId);
                                        if (lotListDetailsObj.boolAnyItemIsAlreadyStaged == 'Y') {
                                            lotListDetailsObj.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
                                        } else {
                                            lotListDetailsObj.starDescription = '';
                                        }
                                    }
                                }

                                lotListDetailsObj.uomTobePopulated = lotListDetailsObj.barcodeQuantity;
								lotListDetailsObj.tallyScanBarCodeQty = 0 ;
								lotListDetailsObj.isPickTaskHasOrder = 'Y';
							}
							else {
								lotListDetailsObj.isPickTaskHasOrder = 'N';
								var currentUser = runtime.getCurrentUser().id;
								var pickTasks = obUtility.getmultiorderPickTaskDetailsForValidation(warehouseLocationId, waveId, currentUser,isZonePickingEnabled);
								log.debug({title:'pickTasks',details:pickTasks});
								var pickTasksLength = pickTasks.length;
                                if(utility.isValueValid(binEmptySysRuleVal) && binEmptySysRuleVal == true) {
                                    lotListDetailsObj.showNavButtons = true;
                                }
                            	if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
                            		var currentUserID = runtime.getCurrentUser().id ;
                            		var recLength = 0;
                            		for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
                            			var zone = pickTasks[pickTaskList].zone;
                            			var picker = pickTasks[pickTaskList].picker;
                            			log.debug({title:'zone',details:zone});
            							if(!utility.isValueValid(zone)){
            								zone = "0";
            							}else{
            								zone = parseInt(zone);
        								}
                            			if((selectedZones.indexOf(zone) != -1 ) || (picker == currentUserID)){
                            				recLength = recLength +1;  
                            			}
                            		}
                            		pickTasksLength = recLength;
                            		log.debug({title:'pickTasksLength',details:pickTasksLength});
                            	}
								lotListDetailsObj.isPendingPickTaks = pickTasksLength > 0 ? 'Y' : 'N';
								if(locUseBinsFlag === true){
									var showStageButton = obUtility.getShowStageFlag(waveId,warehouseLocationId);
									lotListDetailsObj.showStageButton = showStageButton;
                                    lotListDetailsObj.ordersToStageCount = 0;
									if(showStageButton == 'Y' && utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
										lotListDetailsObj.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
                                       // lotListDetailsObj.ordersToStageCount = obUtility.getStagedOrdersCount('multiOrder',waveName,'',warehouseLocationId);
                                        var pickedOrdersArr = obUtility.getPickedOrders(waveName,warehouseLocationId,selectedZones);
                                        lotListDetailsObj.ordersToStageCount = pickedOrdersArr.length;
                                        var ordersIdArr = [];
                                        for(var ord in  pickedOrdersArr){
											if(pickedOrdersArr[ord]) {
												ordersIdArr.push(pickedOrdersArr[ord].id);
											}
                                        }
                                        pickqtyValidate.selectedOrders = ordersIdArr;
                                        if(lotListDetailsObj.boolAnyItemIsAlreadyStaged == 'Y'){
											lotListDetailsObj.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
										}
										else{
											lotListDetailsObj.starDescription = '';	
										}
									}

								}
								lotListDetailsObj.isValid = true;
							}
						}
						else{
							lotListDetailsObj.errorMessage = translator.getTranslationString("BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY");
							lotListDetailsObj.isValid = false;
						}
						
					}
					else{
						if(scannedPage == 'item' && !utility.isValueValid(itemName)) {
							lotListDetailsObj.errorMessage = translator.getTranslationString("BINTRANSFER_ITEMVALIDATE.INVALID_INPUT");
							lotListDetailsObj.isValid = false;	
						}
						else {
							lotListDetailsObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
							lotListDetailsObj.isValid = false;
						}
					}


				}
				else{
					if(scannedPage == 'item') {

						lotListDetailsObj.errorMessage = translator.getTranslationString("BINTRANSFER_ITEMVALIDATE.INVALID_INPUT");
						lotListDetailsObj.isValid = false;	

					}
					else {
						lotListDetailsObj.errorMessage = translator.getTranslationString("BINTRANSFER_LOTFROMSTATUSLIST.INVALID_INPUTS");
						lotListDetailsObj.isValid = false;	
					}
				}
			}
			else{
				lotListDetailsObj.errorMessage = translator.getTranslationString("BINTRANSFER_LOTFROMSTATUSLIST.INVALID_INPUTS");
				lotListDetailsObj.isValid = false;	
			}
		}
		catch(e) {
			lotListDetailsObj.isValid = false;
			lotListDetailsObj.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return lotListDetailsObj;
	}

	return {

		'post': doPost

	};

});
