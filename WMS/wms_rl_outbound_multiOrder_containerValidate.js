/**
 * Copyright Ã¯Â¿Â½ 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['./wms_utility','./wms_translator','N/runtime','./wms_outBoundUtility','N/wms/recommendedBins','./big'],
		function(utility,translator,runtime,obUtility,binApi,bigJS) {

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 */
	function doPost(requestBody) {

		var containerValidate 	= {};
		var debugString 		= '';
		var itemType = '';
		var orderInternalId = '';
		var itemInternalId = '';
		var isTallyScanRequired = '';
		try{
			if(utility.isValueValid(requestBody)) {

				var requestParams	= requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var picktaskId = requestParams.pickTaskId;
				var containerName = requestParams.containerName;
				var pickQty = requestParams.pickQty;
				var lotName = requestParams.lotName;
				var pickBinId = requestParams.binInternalId;
				var pickStatusInternalId = requestParams.pickStatusInternalId;
				var currentUser	= runtime.getCurrentUser();
				var currentUserId = currentUser.id;
				var totalLinepickqty = requestParams.totalLinepickqty;
				var transactiontype = requestParams.transactiontype;
				var transactionInternalString = requestParams.transactionInternalString;
				var enterQty =  requestParams.enterqty;
				var customerString = requestParams.customerString;
				var lotString = requestParams.lotString;
				var line = requestParams.line;
				var waveId = requestParams.waveId;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var barcodeQuantity=requestParams.barcodeQuantity;
				var tallyLoopObj=requestParams.tallyLoopObj; 
				var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
				var qtyUOMObj = requestParams.qtyUOMObj;
				var unitType = requestParams.unitType;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var boolNoStock = requestParams.boolNoStock;
				var boolBinEmpty = requestParams.boolBinEmpty;
				itemType = requestParams.itemType;
				orderInternalId = requestParams.orderInternalId;
				itemInternalId = requestParams.itemInternalId;
				isTallyScanRequired = requestParams.isTallyScanRequired;
				var isInvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
				var waveNumber = requestParams.waveNumber;

				var  isZonePickingEnabled   = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var recommendedbin = requestParams.recommendedbin;
				var recommendedBinId = requestParams.recommendedBinId;
				var recommendedBinQty = requestParams.recommendedBinQty;
				var recommendedBinZoneId = requestParams.recommendedBinZoneId;
				var recommendedBinZoneName = requestParams.recommendedBinZoneName;
				var stageByOrderSysRuleVal = requestParams.stageByOrderSystemRuleValue;
				var binEmptySysRuleVal = requestParams.binEmptySystemRuleValue;

				if(!utility.isValueValid(isZonePickingEnabled)){
					isZonePickingEnabled = false;
				}
				if(!utility.isValueValid(selectedZones)){
					selectedZones = [];
				}

				locUseBinsFlag = utility.isValueValid(locUseBinsFlag) ? locUseBinsFlag : true;

				log.debug({title:'Request Params :', details:requestParams});
                  if(containerName !=null && containerName!= 'null' && containerName != undefined && containerName != ''){
                           containerName = containerName.trim();
                           }
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(picktaskId) && 
						utility.isValueValid(containerName) && containerName !== "" && utility.isValueValid(orderInternalId) &&
						(utility.isValueValid(pickBinId) || (itemType == 'noninventoryitem' || locUseBinsFlag === false )))
				{	
					debugString = debugString + 'Request Params :'+requestParams;
                          
                           
						var isValidContainerScanned = obUtility.validateScannedContainer(warehouseLocationId,containerName,orderInternalId,false,[]);
						log.debug({title:'validateContainerName Params :', details:isValidContainerScanned});

						var selectedZonesArrLength = selectedZones.length;
						var zoneIdArr = [];
						if(selectedZonesArrLength > 0 && isZonePickingEnabled == true && isValidContainerScanned.isValid == true){
							for(var zone = 0 ; zone < selectedZonesArrLength ;zone++){
								if(selectedZones[zone] != "0"){
									zoneIdArr.push(selectedZones[zone]);
								}
							}
							if (zoneIdArr.length > 0){
								 isValidContainerScanned = obUtility.validateScannedContainer(warehouseLocationId,containerName,orderInternalId,isZonePickingEnabled,zoneIdArr);
								 log.debug({title:'validateContainerName Params>>>>>> :', details:isValidContainerScanned});
								 if (utility.isValueValid(isValidContainerScanned) && isValidContainerScanned.isValid === false){
									 var zoneParamsArr = [];
									 zoneParamsArr.push(isValidContainerScanned.zoneDetail);
									 var orderParamsArr = [];
									 orderParamsArr.push(isValidContainerScanned.orderDetail);
                                    containerValidate.errorMessage = translator.getTranslationString("SINGLEORDER_CONTAINER.VALIDATE_ZONE",zoneParamsArr) + 
                                    translator.getTranslationString("MULTIORDER_CONTAINER.VALIDATE_ZONE_ORDER",orderParamsArr);
                                 }
							}
						}
						if(utility.isValueValid(isValidContainerScanned) && isValidContainerScanned.isValid == true)
						{
							var picktaskObj ={};
							var isNewOrderExists = false;
							var transactionInternalIdArray = [];
							var transInteralIdArr=[];

							containerValidate.recommendedBinNum = recommendedbin;
							containerValidate.recommendedBinId = recommendedBinId;
							containerValidate.recommendedBinZoneId = recommendedBinZoneId;
							containerValidate.recommendedBinZoneName = recommendedBinZoneName;
							containerValidate.recommendedBinQty = recommendedBinQty;

							picktaskObj.picktaskid=picktaskId;
							picktaskObj.whLocation=warehouseLocationId;
							picktaskObj.itemId=itemInternalId;
							picktaskObj.itemType=itemType;
							picktaskObj.fromBinId=pickBinId;
							picktaskObj.pickqty= utility.isValueValid(enterQty) ? enterQty : pickQty;
							picktaskObj.batchno=lotName;	
							picktaskObj.line = line;
							picktaskObj.orderInternalId=orderInternalId;
							picktaskObj.containerName=containerName;
							picktaskObj.totalLinepickqty = totalLinepickqty;
							picktaskObj.locUseBinsFlag = locUseBinsFlag;
							picktaskObj.statusInternalId=pickStatusInternalId;
							picktaskObj.isTallyScanRequired = isTallyScanRequired;
							picktaskObj.tallyLoopObj =tallyLoopObj;
							picktaskObj.inventoryStatusFeature = isInvStatusFeatureEnabled;

							log.debug({title:'picktaskObj',details:picktaskObj});

							picktaskId= obUtility.multiOrderPicktaskUpdate(picktaskObj);

							if(!utility.isValueValid(transactionInternalString))
							{
								transactionInternalString = orderInternalId;	
								transactionInternalIdArray.push(orderInternalId);
							}
							else
							{
								transactionInternalString = transactionInternalString+","+orderInternalId;
								transInteralIdArr = transactionInternalString.split(',');
								for(var i in transInteralIdArr){
									if(transInteralIdArr[i]){
										transactionInternalIdArray.push(transInteralIdArr[i]);
									}
								}
							}
                            containerValidate.showNavButtons = true;
							if(transactiontype == 'TrnfrOrd'){
								containerValidate.impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId,'' ,orderInternalId,line,1);
							}else{
								containerValidate.impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId,orderInternalId ,'',line,1);
							}
							containerValidate.picktaskId = picktaskId;
							containerValidate.barcodeQuantity = barcodeQuantity;
							containerValidate.isValid = true;
							containerValidate.tallyLoopObj = {};

							if(utility.isValueValid(customerString)){
								containerValidate.customerString = customerString;                                          
							}

							containerValidate.transactionInternalString = transactionInternalString;
							containerValidate.lotString =  lotString;
							if(boolBinEmpty === true || boolBinEmpty === 'true'|| boolNoStock === true || boolNoStock === 'true') {
								containerValidate.isPickTasklistNavigationRequired = true;
								containerValidate.binInternalId ='';
								if (boolNoStock === true || boolNoStock === 'true') {
									var markOpenPicksDoneAutomaticallySystemRule = utility.getSystemRuleValue('Automatically mark partial picks as Done',
										warehouseLocationId);
									if (utility.isValueValid(markOpenPicksDoneAutomaticallySystemRule)) {
										var markOpenPicksDoneAutomaticallySysRuleValue = markOpenPicksDoneAutomaticallySystemRule;
										log.debug('sysrule updated', markOpenPicksDoneAutomaticallySysRuleValue);
										if (markOpenPicksDoneAutomaticallySysRuleValue == "Y") {
											obUtility.updatePickTaskStatusFormultiOrder(picktaskId, markOpenPicksDoneAutomaticallySysRuleValue);

										}
									}
								}
								if (boolBinEmpty === true || boolBinEmpty === 'true') {
									log.debug("inside if", "inside if");
								if (utility.isValueValid(locUseBinsFlag) && utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true
									&& utility.isValueValid(stageByOrderSysRuleVal) && stageByOrderSysRuleVal == true
									&& utility.isValueValid(binEmptySysRuleVal) && binEmptySysRuleVal == true) {
									var pickedOrdersArr = obUtility.getPickedOrders(waveNumber, warehouseLocationId, selectedZones,picktaskId);
									log.debug("pickedOrdersArr", pickedOrdersArr);
									var ordersIdArr = [];
									for(var ord in  pickedOrdersArr){
										if(pickedOrdersArr[ord]) {
											ordersIdArr.push(pickedOrdersArr[ord].id);
										}
									}
									containerValidate.selectedOrders = ordersIdArr;
									containerValidate.ordersToStageCount = pickedOrdersArr.length;
									containerValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder', '', orderInternalId, warehouseLocationId);
									if (containerValidate.boolAnyItemIsAlreadyStaged == 'Y') {
										containerValidate.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
									} else {
										containerValidate.starDescription = '';
									}
								}
							}


							}
							else if(containerValidate.isValid !== false)
							{
								var orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,picktaskId,transactionInternalIdArray,transactiontype,'',isZonePickingEnabled);
								var ordersLength = 0;
								log.debug({title:'orderDetails',details:orderDetails});
								if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
									var recLength = 0;
									var pickTasksLength = orderDetails.length;
									for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
										var zone = orderDetails[pickTaskList].zone;
										var picker = orderDetails[pickTaskList].picker;
										if(!utility.isValueValid(zone)){
											zone = "0";
										}else{
											zone = parseInt(zone);
										}
										if((selectedZones.indexOf(zone) != -1) || (picker == currentUserId)){
											recLength = recLength +1;  
										}
									}
									ordersLength = recLength;
								}else{
									ordersLength = orderDetails.length;
								}
								log.debug({title:'ordersLength',details:ordersLength});
								if(ordersLength > 0 )	{
									var qtyRemaining ='';
									for(var index=0;index < ordersLength; index++){
										qtyRemaining = qtyRemaining + orderDetails[index].lineitemremainingquantity;
										qtyRemaining = parseFloat(qtyRemaining);
									}
									containerValidate.qtyRemaining = qtyRemaining;
									var skipCount = requestParams.skipbtncount;	
									log.debug({title:'skipCount',details:skipCount});
									if(!utility.isValueValid(skipCount))
									{
										skipCount = 0;
									}
									if(skipCount >= ordersLength)
									{
										skipCount = ordersLength - 1;
									}
									if(parseInt(skipCount)+1 >= ordersLength)
									{
										containerValidate.showskipbtn = 'F';
									}
									else
									{
										containerValidate.showskipbtn = 'T';
									}
									containerValidate.transactionName = orderDetails[skipCount].tranid;
									containerValidate.lineItememainingQuantity = orderDetails[skipCount].lineitemremainingquantity;
									containerValidate.remainingQuantity = orderDetails[skipCount].lineitemremainingquantity;
									containerValidate.lineItemPickedQuantity = orderDetails[skipCount].lineitempickedquantity;
									containerValidate.transactionInternalId = orderDetails[skipCount].internalid;	

									if(transactiontype=='SalesOrd'){
										if(customerString == ''){
											containerValidate.customerString = orderDetails[skipCount].customerText;
										}
										else{
											var transactionIdArr = transactionInternalString.split(',');  
											var transactionIndx = '';
											if(transactionIdArr.length >1){
												transactionIndx = transactionIdArr.indexOf(orderDetails[skipCount].internalid);
											}
											else if(transactionIdArr.length == 1){
												if(transactionIdArr != orderDetails[skipCount].internalid){
													transactionIndx = -1;
												}
											}
											if(transactionIndx == -1 ){
												containerValidate.customerString = customerString+","+orderDetails[skipCount].customerText;  
											}
										}
									}
									containerValidate.line = orderDetails[skipCount].line;
									var transactionUom = orderDetails[skipCount].unitsText;
									if(!utility.isValueValid(transactionUom)){
										transactionUom = '';
									}
									containerValidate.transactionUomName = transactionUom;
									containerValidate.transactionUomConversionRate = '';

									var remainingQtyWithUom = orderDetails[skipCount].lineitemremainingquantity + " " + transactionUom;
									containerValidate.remainingQty = remainingQtyWithUom;
									containerValidate.info_remainingQty = remainingQtyWithUom;
									containerValidate.lblRemainingQuantity = remainingQtyWithUom;
									isNewOrderExists = true;
									if(isTallyScanRequired) {
										if(utility.isValueValid(uomSelectionforFirstItr)) {
											containerValidate.barcodeQuantity = [{'value': 1, 'unit':  uomSelectionforFirstItr}];
										}
										else {
											containerValidate.barcodeQuantity = [{'value': 1}];	
										}
										containerValidate.uomTobePopulated = containerValidate.barcodeQuantity;
										containerValidate.tallyScanBarCodeQty = 0 ;
										if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
											var inputParamObj = {};
											inputParamObj.qtyUOMObj =qtyUOMObj; 
											inputParamObj.newOrderScanRequired = 'true';
											inputParamObj.unitType =unitType;
											inputParamObj.transactionUomConversionRate =transactionUomConversionRate ;
											obUtility.fillObjectForSerialTallyScan(orderDetails[skipCount],inputParamObj);
											containerValidate.remainingQty = inputParamObj.remainingQty;
											containerValidate.info_remainingQty = inputParamObj.lblRemainingQuantity;
											containerValidate.lblRemainingQuantity = inputParamObj.lblRemainingQuantity; 
											containerValidate.numberOfTimesSerialScanned = inputParamObj.numberOfTimesSerialScanned;
											containerValidate.scannedQuantityInBaseUnits = inputParamObj.scannedQuantityInBaseUnits;
										}    
									}
								}
								else{
									containerValidate.qtyRemaining = 0;
									containerValidate.info_remainingQty = '0';
								}
								containerValidate.transactionInternalString = transactionInternalString;
								if(isNewOrderExists){  
									containerValidate.newOrderScanRequired= 'true';
									containerValidate.isValid = true;
									if (utility.isValueValid(recommendedBinId) && (utility.isValueValid(locUseBinsFlag)
										&& isTallyScanRequired != true && locUseBinsFlag == true) &&
										(itemType != "noninventoryitem")) {

										var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

										var searchName = 'customsearch_wmsse_invtbalance_invt_item';
										if (itemType == "inventoryitem" || itemType == "assemblyitem") {
											searchName = 'customsearch_wmsse_invtbalance_invt_item';
										} else if (itemType == "serializedinventoryitem" || itemType ==
											"serializedassemblyitem") {
											searchName = 'customsearch_wmsse_invtbalance_serialsrh';

										} else {
											if (itemType == "lotnumberedinventoryitem" || itemType ==
												"lotnumberedassemblyitem") {
												searchName = "customsearch_wmsse_inventorybalance";
											}
										}
										log.debug('searchName', searchName);
										var objBinDetails = obUtility.getItemsInventoryDetailswithInvStatusEnable(searchName, itemInternalId, pickBinId, warehouseLocationId,itemType);
										log.debug('objBinDetails', objBinDetails);
										if (objBinDetails.length == 0) {

											var pickTaskArr = [];
											pickTaskArr.push(picktaskId);

											var binResults = binApi.recommendPickPathForPickTasks(pickTaskArr);
											if (binResults !== null && binResults !== undefined && binResults !== 'null') {
												log.debug({
													title: 'binResults',
													details: binResults
												});
												var binData = binResults.bins[0].data;
												var binStatus = binResults.bins[0].status.code;
												if (binStatus == 'SUCCESS') {
													containerValidate.isSamePageNavigationRequired = 'F';
													containerValidate.isBinScanPageNavigationRequired = 'T';
													containerValidate.recommendedBinNum = binData.bin.name;
													containerValidate.recommendedBinId = binData.bin.id;
													containerValidate.recommendedBinZoneId = binData.zone.id;
													containerValidate.recommendedBinZoneName = binData.zone.name;
													if (inventoryStatusFeature) {
														var inventoryStatusOptions = utility.getInventoryStatusOptions();
														if (inventoryStatusOptions.length > 0) {
															var binStatusMakeAvailableQty = 0;
															var binQtyArr = binResults.bins[0].data.quantities;
															for (var qtyIndex = 0; qtyIndex < binQtyArr.length; qtyIndex++) {

																var recomendedBinStatusName = binQtyArr[qtyIndex].status.name;

																for (var invtStatus in inventoryStatusOptions) {
																	if (inventoryStatusOptions[invtStatus]) {
																		var inventoryStatusRow = inventoryStatusOptions[invtStatus];
																		var statusText = inventoryStatusRow.name;

																		if (recomendedBinStatusName == statusText) {

																			var makeInventoryAvailable = inventoryStatusRow.listInventoryavailable;
																			if (makeInventoryAvailable) {
																				var tempBinStatusQty = binQtyArr[qtyIndex].quantity;
																				binStatusMakeAvailableQty = Number(bigJS(binStatusMakeAvailableQty).plus(tempBinStatusQty));
																			}
																		}
																	}
																}
																containerValidate.recommendedBinQty = binStatusMakeAvailableQty;
															}
														}

													} else {
														containerValidate.recommendedBinQty = binData.quantities[0] ? binData.quantities[0].quantity : 0;
													}
												}
												else{
													containerValidate.isSamePageNavigationRequired = 'F';
													containerValidate.isPickTaskListNavigationRequired = 'T';
												}
											}
											else{
												containerValidate.isSamePageNavigationRequired = 'F';
												containerValidate.isPickTaskListNavigationRequired = 'T';
											}

										}


									}

								}
								else{
									var pickTasks = obUtility.getmultiorderPickTaskDetailsForValidation(warehouseLocationId, waveId, currentUserId,isZonePickingEnabled);
									log.debug({title:'pickTasks',details:pickTasks});
									if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
										var recLength = 0;
										var pickTasksLength = pickTasks.length;
										for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
											var zone = pickTasks[pickTaskList].zone;
											var picker = pickTasks[pickTaskList].picker;
											if(!utility.isValueValid(zone)){
												zone = "0";
											}else{
												zone = parseInt(zone);
											}
											if((selectedZones.indexOf(zone) != -1) || (picker == currentUserId)){
												recLength = recLength +1;  
											}
										}
										pickTasks.length = recLength;
									}
									containerValidate.isPendingPickTaks = pickTasks.length > 0 ? 'Y' : 'N';
									if(locUseBinsFlag === true)	{
										containerValidate.showStageButton = obUtility.getShowStageFlag(waveId,warehouseLocationId);
										containerValidate.ordersToStageCount = 0;
										if(containerValidate.showStageButton == 'Y' && utility.isValueValid(isZonePickingEnabled) &&
												isZonePickingEnabled == true){
											var pickedOrdersArr = obUtility.getPickedOrders(waveNumber,warehouseLocationId,selectedZones);
                                            var ordersIdArr = [];
                                            for(var ord in  pickedOrdersArr){
                                                if(pickedOrdersArr[ord]) {
                                                    ordersIdArr.push(pickedOrdersArr[ord].id);
                                                }
                                            }

												containerValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
                                            containerValidate.selectedOrders = ordersIdArr;
                                            containerValidate.ordersToStageCount = pickedOrdersArr.length;
											if(containerValidate.boolAnyItemIsAlreadyStaged == 'Y'){
												containerValidate.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
											}
											else{
												containerValidate.starDescription = '';	
											}

										}
                                        else{
                                            if(containerValidate.showStageButton == 'Y') {
                                                containerValidate.selectedOrders = orderInternalId;
                                            }
                                        }
									}
									containerValidate.isValid = true;
								}

							}
						}
						else
						{
							var orderParamsArr = [];
							 orderParamsArr.push(isValidContainerScanned.orderDetail);
							containerValidate.errorMessage = utility.isValueValid(containerValidate.errorMessage) ? containerValidate.errorMessage : translator.getTranslationString("MULTIORDER_CONTAINER.VALIDATE",orderParamsArr) ;
							containerValidate.isValid=false;
						}
					
				}
				else
				{
					containerValidate.errorMessage = translator.getTranslationString("MULTIORDER_CONTAINER.INVALIDINPUT");
					containerValidate.isValid=false;
				}
			}
			else
			{
				containerValidate.errorMessage = translator.getTranslationString("MULTIORDER_CONTAINERLIST.EMPTYPARAM");
				containerValidate.isValid=false;
			}
		}
		catch(e)
		{
			if(isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
				utility.deleteSerialEntry(orderInternalId, '', itemInternalId,3);
			}
			containerValidate.isValid = false;
			containerValidate.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}	

		log.debug({title:'Container Validate Return Object :', details:containerValidate});

		return containerValidate;
	}
	
 


	return {
		'post': doPost

	};

});
