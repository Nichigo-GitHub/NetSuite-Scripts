/**
 * Copyright © 2015,2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['./wms_utility','./wms_translator','N/runtime','./big','./wms_outBoundUtility','N/wms/recommendedBins'],

		function(utility,translator,runtime,bigJS,obUtility,binApi) {

	function doPost(requestBody) {
		var response = {};
		var warehouseLocationId = '';
		var serialName = '';
		var fromBinInternalId = '';
		var numberOfTimesSerialScanned = '';
		var scannedQuantity = '';
		var itemInternalId = '';
		var fromStatusInternalId = '';
		var pickTaskId = '';
		var orderInternalId = '';
		var itemType = '';
		var debugString = '';
		var multiOrder = '';        //Multi Order Picking
		var containerName ='';  //Multi Order Picking		
		var waveName = ''; //Multi Order Picking
		var customerName = '';//Multi Order Picking
		var pickQty = '';//Multi Order Picking
		var remainingQuantity = '';//Multi Order Picking
		var line = '';//Multi Order Picking
		var transactionName = '';//Multi Order Picking
		var unitType ='';

		var totalLinepickqty='';
		var impactedRecords={};
		var  recommendedbin = '';
		var recommendedBinId = '';
		var recommendedBinQty = '';
		var recommendedBinZoneId = '';
		var recommendedBinZoneName = '';

		try{

			var requestParams = requestBody.params;

			if(utility.isValueValid(requestParams)) {

				warehouseLocationId = requestParams.warehouseLocationId;
				serialName = requestParams.serialName;
				fromBinInternalId = requestParams.fromBinInternalId;
				numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				scannedQuantity = requestParams.scannedQuantity;
				itemInternalId = requestParams.itemInternalId;
				fromStatusInternalId = requestParams.fromStatusInternalId;
				pickTaskId =  requestParams.pickTaskId;
				orderInternalId = requestParams.transactionInternalID;
				itemType = requestParams.itemType;
				multiOrder = requestParams.multiOrder;  //Multi Order Picking
				containerName = requestParams.containerName;  //Multi Order Picking
				orderInternalId = requestParams.transactionInternalID;  //Multi Order Picking
				var customerString = requestParams.customerString;
				var lineNoString = requestParams.lineNoString;
				var transactionNameString = requestParams.transactionNameString;
				var transactionInternalString = requestParams.transactionInternalString;
				waveName = requestParams.waveName;
				customerName = requestParams.customerName;
				pickQty = requestParams.pickQty;
				remainingQuantity = requestParams.remainingQuantity;
				line = requestParams.line;
				transactionName = requestParams.transactionName;
				unitType = requestParams.unitType;
				totalLinepickqty = requestParams.totalLinepickqty;
				var transactiontype = requestParams.transactiontype;
				var remainingQuantityWithUOM = requestParams.remainingQuantityWithUOM;
				var qtyRemaining = requestParams.qtyRemaining;	
				var inventoryDetailLotOrSerial = requestParams.inventoryDetailLotOrSerial;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var pickedQtyString = requestParams.pickedQty;
				var remainingQtyString = requestParams.remainingQty;
				var transactionUomName = requestParams.transactionUomName;
				var remainingPickTaskQuantity = requestParams.remainingPickTaskQuantity;
				var transactionLineId = requestParams.transactionLineId;
				var waveId = requestParams.waveId;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var lineItemPickedQuantity=requestParams.lineItemPickedQuantity;
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				recommendedbin = requestParams.recommendedbin;
				recommendedBinId = requestParams.recommendedBinId;
				recommendedBinQty = requestParams.recommendedBinQty;
				recommendedBinZoneId = requestParams.recommendedBinZoneId;
				recommendedBinZoneName = requestParams.recommendedBinZoneName;
				var lineremainingPickTaskQty = requestParams.lineremainingPickTaskQty;
				var lineItemremainingPickTaskQty = requestParams.lineItemremainingPickTaskQty;

                if(!utility.isValueValid(isZonePickingEnabled)){
                    isZonePickingEnabled = false;
                }
                if(!utility.isValueValid(selectedZones)){
                    selectedZones = [];
                }

				if(remainingPickTaskQuantity==null || remainingPickTaskQuantity==''){
					remainingPickTaskQuantity=remainingQuantity;
				}
				if(locUseBinsFlag==undefined || locUseBinsFlag==null){
					locUseBinsFlag=true;
				}
                var tranType = '';
                if(transactiontype!=null && transactiontype!='')
                {
                	log.debug('transactiontype transactiontype',transactiontype);
                    if(transactiontype =='SalesOrd')
                    {
                        tranType= "Sales Order";
                    }
                    else
                    {
                        tranType="Transfer Order";
                    }
					log.debug('tranType11',tranType);
                }

				log.debug('tranType',tranType);
				log.debug('requestParams',requestParams);
				response.transactionName = transactionNameString;
				response.transactionInternalId = orderInternalId;
				response.line = line;
				response.pickQty = pickQty;
				response.remainingQuantity = remainingQuantity;
				response.customerName = customerName;
				response.remainingQuantityWithUOM = remainingQuantityWithUOM;
				response.qtyRemaining = qtyRemaining;
				response.remainingPickTaskQuantity = remainingPickTaskQuantity;
				response.totalLinepickqty = totalLinepickqty;
				response.lineItemPickedQuantity = lineItemPickedQuantity;
				response.recommendedBinNum = recommendedbin;
				response.recommendedBinId = recommendedBinId;
				response.recommendedBinZoneId = recommendedBinZoneId;
				response.recommendedBinZoneName = recommendedBinZoneName;
				response.recommendedBinQty = recommendedBinQty;
				if(!utility.isValueValid(lineItemremainingPickTaskQty)){				
					response.lineItemremainingPickTaskQty =lineremainingPickTaskQty;
				}
				else {
					response.lineItemremainingPickTaskQty =lineItemremainingPickTaskQty;
				}


				if(multiOrder != '' && multiOrder == "Y"){
					response.transactionUomName = transactionUomName;
					response.pickedQty = pickedQtyString;
					response.remainingQty = remainingQtyString;
				}

				var stageCompleteScreenLabel = translator.getTranslationString('MULTIORDERPICKING.STAGECOMPLETEORDERS');
				response.stageCompleteScreenLabel = stageCompleteScreenLabel;

				if(utility.isValueValid(serialName)){

					if((utility.isValueValid(inventoryDetailLotOrSerial)) && (inventoryDetailLotOrSerial != serialName)){
						response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_INVENTDETAILS_VALIDSERIAL');
						response.isValid = false;

					}else{
						var _isScannedSerialExits = '';
						var invtStatusFeature = utility.isInvStatusFeatureEnabled();
						var invNumSearchRes = utility.inventoryNumberInternalId(serialName, warehouseLocationId, itemInternalId,'picking');
						var scannedSerialInternalId = '';
						if(utility.isValueValid(invNumSearchRes)){
							scannedSerialInternalId = invNumSearchRes[0].id;
						}
						else{
							var currItem = utility.itemValidationForInventoryAndOutBound(serialName,warehouseLocationId);
							log.debug({title:'currItem',details:currItem});
							if((utility.isValueValid(currItem) && utility.isValueValid(currItem.itemInternalId) )||
								utility.isValueValid(currItem.barcodeIteminternalid))
							{
								var barCodeItemInternalidNumber = "";
								if(utility.isValueValid(currItem.itemInternalId))
								{
									barCodeItemInternalidNumber = currItem.itemInternalId;
								}else if(utility.isValueValid(currItem.barcodeIteminternalid))
								{
									barCodeItemInternalidNumber = currItem.barcodeIteminternalid;
								}
								if((itemInternalId == barCodeItemInternalidNumber) &&
									utility.isValueValid(currItem.barcodeSerialname)){
									serialName = currItem.barcodeSerialname;
									var invNumSearchRes = utility.inventoryNumberInternalId(serialName, warehouseLocationId, itemInternalId,'picking');
									if(utility.isValueValid(invNumSearchRes)){
										scannedSerialInternalId = invNumSearchRes[0].id;
									}
								}

							}
						}
						log.debug('scannedSerialInternalId',scannedSerialInternalId);
						if(utility.isValueValid(scannedSerialInternalId)){
							var getSerialNoId ='';
							getSerialNoId = scannedSerialInternalId;

							_isScannedSerialExits =  utility.getSerialList(fromBinInternalId,itemInternalId,warehouseLocationId,fromStatusInternalId,getSerialNoId,inventoryDetailLotOrSerial);
						}
						if( (_isScannedSerialExits.length == 0) || (!utility.isValueValid(scannedSerialInternalId)) ||
								(invNumSearchRes[0].inventorynumber != serialName)){
							response.isValid = false;
							response.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
						}
						else{
							var serialObj = {};
							serialObj.serialName = serialName;
							serialObj.itemInternalId = itemInternalId;
							var serialSearchRes = obUtility.getExitingSerial(serialObj);
							if(serialSearchRes.length != 0){
								response.isValid  = false;
								response.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED');
							}
							else
							{
								var serialstatus=_isScannedSerialExits[0].status;
								serialObj.serialstatus = serialstatus;
								serialObj.pickTaskId = pickTaskId;
								serialObj.orderInternalId = orderInternalId;
								obUtility.createWMSSerialEntry(serialObj);
								response.transactionName  = transactionName;
								response.transactionInternalString  = transactionInternalString;
								response.barcodeSerialname  = '';

								if(utility.isValueValid(customerString)){
									response.customerString  = customerString;
								}

								if(parseInt(numberOfTimesSerialScanned) + 1 < scannedQuantity){
									response.numberOfTimesSerialScanned  = parseInt(numberOfTimesSerialScanned) + 1;
								}
								else
								{
									var systemRule='Use cartons for single-order picking?';
									if(multiOrder == "Y"){
										systemRule = "Use cartons for multi-order picking?";
									}
									log.debug('systemRule',systemRule);
									//var isContainerScanRequired = utility.getSystemRuleValue(systemRule,warehouseLocationId);
                                   // var isContainerScanRequired = utility.getSystemRuleValue(systemRule,warehouseLocationId);
                                    var isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,tranType);
log.debug('getting system rule value isContainerScanRequired',isContainerScanRequired);
									if(!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N'){
										isContainerScanRequired = 'false';
									}
									else{
										isContainerScanRequired = 'true';
									}

									if(isContainerScanRequired == 'true')	{
										response.isValid = true;
										response.totalLinepickqty  = totalLinepickqty;
										if(multiOrder != "Y"){
											if(utility.isValueValid(lineItemremainingPickTaskQty)) {
												response.remainingPickTaskQuantity = lineItemremainingPickTaskQty;
											}
											else {
												response.remainingPickTaskQuantity = lineremainingPickTaskQty;
											}
										}
										if(utility.isValueValid(transactionUomConversionRate)){
											scannedQuantity = Number(bigJS(scannedQuantity).div(transactionUomConversionRate));
											log.debug({title:'scannedQuantity',details:scannedQuantity});
											response.enterqty = scannedQuantity;
										}
										else{
											response.enterqty = scannedQuantity;
										}
										response.isContainerScanRequired = true;
									}
									else {
										var picktaskId='';
										var picktaskObj ={};
										log.debug({title:'totalLinepickqty',details:totalLinepickqty});
										picktaskObj.picktaskid = pickTaskId;
										picktaskObj.whLocation = warehouseLocationId;
										picktaskObj.itemId = itemInternalId;
										picktaskObj.fromBinId = fromBinInternalId;
										picktaskObj.pickqty = scannedQuantity;
										picktaskObj.itemType = itemType;
										picktaskObj.orderInternalId = orderInternalId;   // Multi Order Picking
										picktaskObj.containerName = containerName;  // Multi Order Picking
										picktaskObj.totalLinepickqty = totalLinepickqty;
										picktaskObj.line = line;
										picktaskObj.locUseBinsFlag = locUseBinsFlag;
										picktaskObj.inventoryStatusFeature = invtStatusFeature;
										if(utility.isValueValid(transactionUomConversionRate)){
											scannedQuantity = Number(bigJS(scannedQuantity).div(transactionUomConversionRate));
											log.debug({title:'scannedQuantity',details:scannedQuantity});
											picktaskObj.enterqty =scannedQuantity;
										}
										else{
											picktaskObj.enterqty =scannedQuantity;
										}
										if(invtStatusFeature){
											picktaskObj.statusInternalId =fromStatusInternalId;
										}

										var isNewOrderExists = false;
										if(multiOrder == "Y"){
											if(isContainerScanRequired == 'false'){
												response.isContainerScanRequired  = false;
											}
											else{
												response.isContainerScanRequired  = true;
												stageCompleteScreenLabel = translator.getTranslationString('MULTIORDERPICKING.STAGECOMPLETECARTONS');
												response.stageCompleteScreenLabel  = stageCompleteScreenLabel;
											}
											response.picktaskId  = pickTaskId;
											response.transactionName  = transactionName;
											picktaskId= obUtility.multiOrderPicktaskUpdate(picktaskObj);
                                            // Multi Order Picking update
                                            response.showNavButtons = true;
											if(transactionInternalString == '')	{
												transactionInternalString = orderInternalId;	
											}
											else {
												transactionInternalString = transactionInternalString+","+orderInternalId;
											}
											if(!utility.isValueValid(pickedQtyString))	{
												pickedQtyString = '';
											}
											if(!utility.isValueValid(remainingQtyString)) {
												remainingQtyString = '';
											}

											var lineRemainingQty = requestParams.remainingQuantity;
											transactionUomName = requestParams.transactionUomName;
											log.debug({title:'lineRemainingQty',details:lineRemainingQty});
											log.debug({title:'scannedQuantity',details:scannedQuantity});
											var remainQty  = Number(bigJS(lineRemainingQty).minus(scannedQuantity));// + " "+transactionUomName ;
											if(parseFloat(remainQty) > 0 ){
												remainQty = remainQty +" "+ transactionUomName;	
											}
											else{
												remainQty = 0;
											}
											log.debug({title:'remainQty',details:remainQty});
											var pckdQty  = scannedQuantity +" "+transactionUomName;
											log.debug({title:'pckdQty',details:pckdQty});
											log.debug({title:'remainingQtyString b',details:remainingQtyString});
											if(remainingQtyString == '' || pickedQtyString == 0){
												remainingQtyString = remainQty;
											}
											else{
												remainingQtyString = remainingQtyString + ","+remainQty;
											}
											log.debug({title:'remainingQtyString a',details:remainingQtyString});
											if(pickedQtyString == '' || pickedQtyString == 0)
											{log.debug({title:'pickedQtyString2',details:pickedQtyString});
											pickedQtyString = pckdQty;
											}
											else
											{
												pickedQtyString = pickedQtyString + ","+pckdQty;
											}
											log.debug({title:'pickedQtyString a',details:pickedQtyString});
											log.debug({title:'remainingQtyString a',details:remainingQtyString});
											response.pickedQty = pickedQtyString;
											response.remainingQty = remainingQtyString;
											var orderDetails =obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,pickTaskId,'',transactiontype,'',isZonePickingEnabled);
											var ordersLength = 0;
											if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
												var recLength = 0;
												var pickTasksLength = orderDetails.length;
												var currentUser = runtime.getCurrentUser().id;
												for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
													var zone = orderDetails[pickTaskList].zone;
													var picker = orderDetails[pickTaskList].picker;
													if(!utility.isValueValid(zone)){
														zone = "0";
													}else{
														zone = parseInt(zone);
													}
													if((selectedZones.indexOf(zone) != -1) || (picker == currentUser)){
														recLength = recLength +1;  
													}
												}
												ordersLength = recLength;
											}else{
												ordersLength = orderDetails.length;
											}

											if(ordersLength > 0 ){
												var qtyRemaining_multiOrder ='';
												for(var i=0;i < ordersLength; i++){

													qtyRemaining_multiOrder = parseFloat(qtyRemaining_multiOrder) + parseFloat(orderDetails[i].lineitemremainingquantity);
												}
												response.qtyRemaining = qtyRemaining_multiOrder;
												var skipCount = requestParams.skipbtncount;	
												log.debug({title:'skipCount',details:skipCount});
												if(!utility.isValueValid(skipCount))
												{
													skipCount = 0;
												}
												if(skipCount >= ordersLength)
												{
													skipCount = ordersLength-1;
												}

												response.transactionName = orderDetails[skipCount].tranid;
												response.remainingQuantity  = orderDetails[skipCount].lineitemremainingquantity;
												response.lineItemPickedQuantity  = orderDetails[skipCount].lineitempickedquantity;
												response.transactionInternalId  = orderDetails[skipCount].internalid;
												response.line  = orderDetails[skipCount].line;
												var transactionUom = orderDetails[skipCount].unitsText;
												if(parseInt(skipCount)+1 >= ordersLength){
													response.showskipbtn = 'F';
												}
												else{
													response.showskipbtn = 'T';
												}
												if(!utility.isValueValid(transactionUom)){
													transactionUom = '';
												}
												else{
													if(utility.isValueValid(unitType) && utility.isValueValid(transactionUom))
													{
														var transactionUomResult = utility.getUnitsType(unitType,transactionUom);
														if(transactionUomResult.length > 0)
														{
															log.debug({title:'transactionUomResult',details:transactionUomResult});
															response.transactionUomConversionRate = transactionUomResult[0].conversionrate;
														}
													}	
												}
												response.transactionUomName = transactionUom;
												response.remainingQty =orderDetails[skipCount].lineitemremainingquantity + " " + transactionUom;
												var remainingQtyWithUom = orderDetails[skipCount].lineitemremainingquantity + " " + transactionUom;
												response.lblRemainingQuantity = remainingQtyWithUom;
												if(transactiontype == 'SalesOrd'){
													if(customerString == ''){											
														response.customerString = orderDetails[skipCount].customerText;
													}
													else{	
														response.customerString = customerString+","+orderDetails[skipCount].customerText;
													}
												}
												if(transactionNameString == '')	{
													response.transactionNameString = orderDetails[skipCount].tranid;
												}
												else{
													response.transactionNameString = transactionNameString+","+orderDetails[skipCount].tranid;
												}
												if(lineNoString == ''){
													response.lineNoString = orderDetails[skipCount].line;
												}
												else{
													response.lineNoString = lineNoString+","+orderDetails[skipCount].line;
												}

												isNewOrderExists= true;
											}
											else
											{
												response.qtyRemaining = 0;
											}

											if(isNewOrderExists){
												response.newOrderScanRequired = 'true';
                                                if (utility.isValueValid(recommendedBinId) && utility.isValueValid(locUseBinsFlag)
                                                    && locUseBinsFlag == true ) {
                                                    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
                                                    var searchName = 'customsearch_wmsse_invtbalance_serialsrh';

                                                    var	objBinDetails = obUtility.getItemsInventoryDetailswithInvStatusEnable(searchName, itemInternalId, fromBinInternalId, warehouseLocationId,
                                                        itemType);
                                                    log.debug('objBinDetails', objBinDetails);
                                                    if (objBinDetails.length == 0) {

                                                        var pickTaskArr = [];
                                                        pickTaskArr.push(pickTaskId);

                                                        var binResults = binApi.recommendPickPathForPickTasks(pickTaskArr);
                                                        if (binResults !== null && binResults !== undefined && binResults !== 'null') {

                                                            var binData = binResults.bins[0].data;
                                                            var binStatus = binResults.bins[0].status.code;
                                                            if (binStatus == 'SUCCESS') {
                                                                response.isNavigateToQuantityPage = 'F';
																response.newOrderScanRequired = false;
                                                                response.isBinScanPageNavigationRequired = 'T';
                                                                response.recommendedBinNum = binData.bin.name;
                                                                response.recommendedBinId = binData.bin.id;
                                                                response.recommendedBinZoneId = binData.zone.id;
                                                                response.recommendedBinZoneName = binData.zone.name;
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
                                                                            response.recommendedBinQty = binStatusMakeAvailableQty;
                                                                        }
                                                                    }

                                                                } else {
                                                                    response.recommendedBinQty = binData.quantities[0] ? binData.quantities[0].quantity : 0;
                                                                }
                                                            }
                                                            else{
                                                                response.isNavigateToQuantityPage = 'F';
                                                                response.isPickTaskListNavigationRequired = 'T';
                                                            }
                                                        }
                                                        else{
                                                            response.isNavigateToQuantityPage = 'F';
                                                            response.isPickTaskListNavigationRequired = 'T';
                                                        }

                                                    }

                                                }


                                            }
											else{
												var currentUser = runtime.getCurrentUser().id;
												var pickTasks = obUtility.getmultiorderPickTaskDetailsForValidation(warehouseLocationId, waveId, currentUser,isZonePickingEnabled);
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
														if((selectedZones.indexOf(zone) != -1) || (picker == currentUser)){
															recLength = recLength +1;  
														}
													}
													pickTasks.length = recLength;
												}
												response.isPendingPickTaks = pickTasks.length > 0 ? 'Y' : 'N';
											}
											response.transactionInternalString  = transactionInternalString;
											if(locUseBinsFlag){
												var showStageButton	 = obUtility.getShowStageFlag(waveId,warehouseLocationId);
												response.showStageButton = showStageButton;
												if(((showStageButton == 'Y') || (utility.isValueValid(stageByOrderSysRuleVal)
                                                        && stageByOrderSysRuleVal == true
                                                        && utility.isValueValid(binEmptySysRuleVal) && binEmptySysRuleVal == true ))
                                                    && utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
													response.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
                                                    var pickedOrdersArr = obUtility.getPickedOrders(waveName,warehouseLocationId,selectedZones);
                                                    response.ordersToStageCount = pickedOrdersArr.length;
													var ordersIdArr = [];
													for(var ord in  pickedOrdersArr){
														if(pickedOrdersArr[ord]) {
															ordersIdArr.push(pickedOrdersArr[ord].id);
														}
													}
													response.selectedOrders = ordersIdArr;
                                                    if(response.boolAnyItemIsAlreadyStaged == 'Y'){
														response.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
													}
													else{
														response.starDescription = '';	
													}
												}
												else{
													if(response.showStageButton == 'Y') {
														response.selectedOrders = orderInternalId;
													}
												}
											}
											if(transactiontype == 'TrnfrOrd'){
												response.impactedRecords= obUtility.noCodeSolForPicking(picktaskId, waveId,'' ,orderInternalId,transactionLineId,1);
											}else{
												response.impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId,orderInternalId ,'',transactionLineId,1);
											}
											response.isValid  = true;
										}
										else
										{
											picktaskObj.locUseBinsFlag = locUseBinsFlag;
											picktaskId= obUtility.picktaskupdate(picktaskObj);

											var pickTaskDetails = {}; 
											pickTaskDetails.orderInternalId =orderInternalId;
											pickTaskDetails.whLocationId =warehouseLocationId;
											pickTaskDetails.isZonePickingEnabled = isZonePickingEnabled;
											pickTaskDetails.selectedZones = selectedZones;

											var objpickTaskDetails=obUtility.getPickTaskDetailsForValidation(pickTaskDetails);

											if(objpickTaskDetails.length > 0){
												if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){

													var recLength = 0;
													var pickTasksLength = objpickTaskDetails.length;
													var currentUser = runtime.getCurrentUser().id;
													for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
														var zone = objpickTaskDetails[pickTaskList].zone;
														var picker = objpickTaskDetails[pickTaskList].picker;
														if(!utility.isValueValid(zone)){
															zone = "0";
														}else{
															zone = parseInt(zone);
														}
														if((selectedZones.indexOf(zone) != -1) || (picker == currentUser )){
															recLength = recLength +1;
														}
													}
													response.nextPickTaskCount = recLength;
												}
												else {
													response.nextPickTaskCount = objpickTaskDetails.length;
												}
											}
											else
											{
												response.nextPickTaskCount  = 0;
											}
											if(locUseBinsFlag == true)
											{
												var objPickedPickTaskDetails=obUtility.getPickTaskStageflag('singleOrder','',orderInternalId,warehouseLocationId);

												if(objPickedPickTaskDetails.length > 0)
												{							
													response.showStageButton = 'Y';
													if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
														response.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
                        								if(response.boolAnyItemIsAlreadyStaged == 'Y'){
                        									response.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
                        								}
                        								else{
                        									response.starDescription = '';	
                        								}

                        							}
												}
												else
												{
													var picktaskstageflagDtlforalreadystaged = obUtility.getSOPickTaskStageflagforAlreadystaged(warehouseLocationId,orderInternalId);
													if(utility.isValueValid(picktaskstageflagDtlforalreadystaged) && picktaskstageflagDtlforalreadystaged.length>0){
														response.showStageButton  = 'Y';
														if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
															response.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
	                        								if(response.boolAnyItemIsAlreadyStaged == 'Y'){
	                        									response.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
	                        								}
	                        								else{
	                        									response.starDescription = '';	
	                        								}

	                        							}
													}else{
														response.showStageButton  = 'N';
													}
												}
											}

											if(transactiontype == 'TrnfrOrd'){
												impactedRecords= obUtility.noCodeSolForPicking(picktaskId, waveId,'' ,orderInternalId,transactionLineId,1);
											}else{
												impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId,orderInternalId ,'',transactionLineId,1);
											}
											response.impactedRecords  = impactedRecords;

											response.isNavigateToQuantityPage  = 'F';
											//This condition is for sopk partial picking scenarios
											if(parseFloat(remainingPickTaskQuantity) > 0 )
											{
												response.isNavigateToQuantityPage  = 'T';
												response.showNavButtons = true;
												if (utility.isValueValid(recommendedBinId) && utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == true ) {
													var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
														var searchName = 'customsearch_wmsse_invtbalance_serialsrh';


													var	objBinDetails = obUtility.getItemsInventoryDetailswithInvStatusEnable(searchName, itemInternalId, fromBinInternalId, warehouseLocationId
															 ,itemType);
													log.debug('objBinDetails', objBinDetails);
													if (objBinDetails.length == 0) {

														var pickTaskArr = [];
														pickTaskArr.push(pickTaskId);

														var binResults = binApi.recommendPickPathForPickTasks(pickTaskArr);
														if (binResults !== null && binResults !== undefined && binResults !== 'null') {

															var binData = binResults.bins[0].data;
															var binStatus = binResults.bins[0].status.code;
															if (binStatus == 'SUCCESS') {
																response.isNavigateToQuantityPage = 'F';
																response.isBinScanPageNavigationRequired = 'T';
																response.recommendedBinNum = binData.bin.name;
																response.recommendedBinId = binData.bin.id;
																response.recommendedBinZoneId = binData.zone.id;
																response.recommendedBinZoneName = binData.zone.name;
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
																			response.recommendedBinQty = binStatusMakeAvailableQty;
																		}
																	}

																} else {
																	response.recommendedBinQty = binData.quantities[0] ? binData.quantities[0].quantity : 0;
																}
															}
															else{
																response.isNavigateToQuantityPage = 'F';
																response.isPickTaskListNavigationRequired = 'T';
															}
														}
														else{
															response.isNavigateToQuantityPage = 'F';
															response.isPickTaskListNavigationRequired = 'T';
														}

													}

												}

											}
										}
										response.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned) + 1;
									}
								}
								response.isValid  = true;
							}

						}
					}
				}
				else{
					response.isValid  = false;
					response.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
				}
			}else{
				response.isValid  = false;
			}
		}catch(e){
			response.isValid  = false;
			response.errorMessage  = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}
		return response;
	}
	return {
		'post': doPost
	};
});