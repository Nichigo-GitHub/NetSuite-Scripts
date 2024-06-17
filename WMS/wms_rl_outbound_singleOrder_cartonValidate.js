/**
 * Copyright Ã¯Â¿Â½ 2018, Oracle and/or its affiliates. All rights reserved.
 *
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['./wms_utility', './wms_translator', 'N/runtime', './big', './wms_outBoundUtility','N/wms/recommendedBins'],
    function ( utility, translator, runtime, bigJS, obUtility,binApi) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         */
        function doPost(requestBody) {

            var cartonValidate = {};
            var debugString = '';
            var impactedRecords = {};
            try {

                if (utility.isValueValid(requestBody)) {

                    var requestParams = requestBody.params;
                    var warehouseLocationId = requestParams.warehouseLocationId;
                    var picktaskId = requestParams.pickTaskId;
                    var itemType = requestParams.itemType;
                    var containerName = requestParams.containerName;
                    var orderInternalId = requestParams.transactionInternalId;
                    var pickQty = requestParams.pickTaskQuantity;//var pickQty = requestParams.pickQty;
                    var lotName = requestParams.lotName;
                    var pickBinId = requestParams.binInternalId;//can it be recommendedbinid also
                    var pickStatusInternalId = requestParams.pickStatusInternalId;//value is there in singleOrderPicking_quantityScan_invtStatusDDL
                    var currentUser = runtime.getCurrentUser();
                    var currentUserId = currentUser.id;
                    var totalLinepickqty = requestParams.totalpickedquantity;//totalLinepickqty
                    var transactiontype = requestParams.transactiontype;//may be no transaction type lets check
                    var itemInternalId = requestParams.itemInternalId;
                    var enterQty = requestParams.enterqty;
                    var transactionUomName = requestParams.transactionUomName;
                    //var remainingLineItemqty  = requestParams.remainingLineItemqty;
                    var lineItemRemainingQuantity = requestParams.lineitemremainingquantity;
                    var transactionLineId = requestParams.transactionLineId;
                    var transactionType = requestParams.transactionType;
                    var waveId = requestParams.waveId;
                    var locUseBinsFlag = requestParams.locUseBinsFlag;
                    var isTallyScanRequired = requestParams.isTallyScanRequired;
                    var tallylotObj = requestParams.tallylotObj;
                    var barcodeLotname = requestParams.barcodeLotname;
                    var lotShown = requestParams.lotShown;
                    var barcodeQuantity = requestParams.barcodeQuantity;
                    var tallyLoopObj = requestParams.tallyLoopObj;
                    var binEmptyAction = requestParams.binEmptyAction;
                    var noStockAction = requestParams.noStockAction;
                   var  recommendedbin = requestParams.recommendedbin;
                   var   recommendedBinId = requestParams.recommendedBinId;
                   var   recommendedBinQty = requestParams.recommendedBinQty;
                   var  recommendedBinZoneId = requestParams.recommendedBinZoneId;
                   var  recommendedBinZoneName = requestParams.recommendedBinZoneName;
                    var  fromBtnClick = requestParams.fromBtnClick;


                    var qtyShown = requestParams.qtyShown;
                    var isZonePickingEnabled = requestParams.isZonePickingEnabled;
                    var selectedZones = requestParams.selectedZones;
                    
                    selectedZones = selectedZones || [];
                    isZonePickingEnabled = isZonePickingEnabled || false;

                    if (!utility.isValueValid(locUseBinsFlag)) {
                        locUseBinsFlag = true;
                    }

                    log.debug({title: 'Request Params :', details: requestParams});
                    if(containerName !=null && containerName!= 'null' && containerName != undefined && containerName != ''){
                        containerName = containerName.trim();
                        }
                    if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(picktaskId) &&  utility.isValueValid(containerName)
                   && containerName !== "" && utility.isValueValid(orderInternalId) && (utility.isValueValid(pickBinId) ||
                        (itemType == 'noninventoryitem' || locUseBinsFlag == false))) {
                        debugString = debugString + 'Request Params :' + requestParams;

                        cartonValidate.recommendedBinNum = recommendedbin;
                        cartonValidate.recommendedBinId = recommendedBinId;
                        cartonValidate.recommendedBinZoneId = recommendedBinZoneId;
                        cartonValidate.recommendedBinZoneName = recommendedBinZoneName;
                        cartonValidate.recommendedBinQty = recommendedBinQty;
                        var isValidContainerScanned = obUtility.validateScannedContainer(warehouseLocationId,containerName,
                            orderInternalId,false,[]);
                       
                        log.debug({title: 'isValidContainerScanned', details: isValidContainerScanned});
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
								
								 if (utility.isValueValid(isValidContainerScanned) && isValidContainerScanned.isValid === false){
									 var zoneParamsArr = [];
									 zoneParamsArr.push(isValidContainerScanned.zoneDetail);
									 var orderParamsArr = [];
									 orderParamsArr.push(isValidContainerScanned.orderDetail);
									 cartonValidate.errorMessage = translator.getTranslationString("SINGLEORDER_CONTAINER.VALIDATEZONE",zoneParamsArr) ;
								 }
							}
							log.debug({title: 'isValidContainerScanned Params2 :', details: isValidContainerScanned});
                        }
                        
                        if (utility.isValueValid(isValidContainerScanned) && isValidContainerScanned.isValid == true) {
                            var picktaskObj = {};
                            if (!utility.isValueValid(transactionUomName)) {
                                transactionUomName = '';
                            }

                            picktaskObj.picktaskid = picktaskId;
                            picktaskObj.whLocation = warehouseLocationId;
                            picktaskObj.itemId = itemInternalId;
                            picktaskObj.itemType = itemType;
                            picktaskObj.fromBinId = pickBinId;
                            picktaskObj.orderInternalId = orderInternalId;
                            picktaskObj.containerName = containerName;
                            picktaskObj.totalLinepickqty = totalLinepickqty;
                            picktaskObj.locUseBinsFlag = locUseBinsFlag;
                            picktaskObj.isTallyScanRequired = isTallyScanRequired;
                            picktaskObj.enterqty = enterQty;

                            if (isTallyScanRequired == true) {
                                log.debug({title: 'tallylotObj :', details: tallylotObj});

                                var tallyqtyarr = [];
                                var lotarray = [];
                                var statusArray = [];
                                if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') || (itemType == "inventoryitem" || itemType == "assemblyitem")) {
                                   // var tallyObj = JSON.parse(tallyLoopObj);

                                }

                                for (var tallyLoopObjIndex in tallyLoopObj) {

                                    if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
                                        if (lotarray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
                                            lotarray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
                                            tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
                                            statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
                                        }
                                    } else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
                                        if (statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
                                            tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
                                            statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
                                        }
                                    }

                                }
                                picktaskObj.enterqty = enterQty;
                                picktaskObj.pickqty = tallyqtyarr;
                                if (!utility.isValueValid(enterQty)) {
                                    picktaskObj.pickqty = pickQty;
                                }
                                picktaskObj.batchno = lotarray;
                                if (utility.isInvStatusFeatureEnabled()) {
                                   picktaskObj.statusInternalId = statusArray;
                                }

                            } else {
                                picktaskObj.pickqty = enterQty;
                                picktaskObj.batchno = lotName;
                                if (utility.isInvStatusFeatureEnabled()) {
                                   picktaskObj.statusInternalId = pickStatusInternalId;
                                }
                            }

                            var remainingQty = 0;

                            log.debug({title: 'picktaskObj', details: picktaskObj});

                            picktaskId = obUtility.picktaskupdate(picktaskObj);
                            cartonValidate.showNavButtons = true;
                            remainingQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
                            log.debug({title: 'remainingQty', details: remainingQty});
                            if (transactionType == 'TrnfrOrd') {
                                impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId, '', orderInternalId, transactionLineId, 1);
                            } else {
                                impactedRecords = obUtility.noCodeSolForPicking(picktaskId, waveId, orderInternalId, '', transactionLineId, 1);
                            }
                            cartonValidate.impactedRecords = impactedRecords;
                            if (isTallyScanRequired == true) {
                                cartonValidate.isTallyScanRequired = isTallyScanRequired;
                                cartonValidate.tallylotObj = tallylotObj;
                                cartonValidate.lotShown = false;
                                cartonValidate.qtyShown = false;
                            }

                            if ((utility.isValueValid(binEmptyAction) && binEmptyAction == 'binEmpty') ||
                                (utility.isValueValid(noStockAction) && noStockAction == 'noStock')) {
                                cartonValidate.isPickTasklistNavigationRequired = 'true';
                                cartonValidate.qtyShown = true;
                                cartonValidate.binInternalId ='';
                                if(utility.isValueValid(binEmptyAction) && binEmptyAction == 'binEmpty' &&
                                    utility.isValueValid(fromBtnClick) && fromBtnClick == "CompletePicking"){
                                    cartonValidate.isPickTasklistNavigationRequired = 'false';
                                }
                                if(utility.isValueValid(noStockAction) && noStockAction == 'noStock'){
                                    var markOpenPicksDoneAutomaticallySystemRule = utility.getSystemRuleValue('Automatically mark partial picks as Done',
                                        warehouseLocationId);
                                    if(utility.isValueValid(markOpenPicksDoneAutomaticallySystemRule)){
                                        var markOpenPicksDoneAutomaticallySysRuleValue = markOpenPicksDoneAutomaticallySystemRule;
                                        if(markOpenPicksDoneAutomaticallySysRuleValue == "Y"){
                                            if (utility.isValueValid(locUseBinsFlag) &&
                                                locUseBinsFlag == true || locUseBinsFlag == "true") {
                                                obUtility.updatePickTaskToDoneForSingleOrder(picktaskId, markOpenPicksDoneAutomaticallySysRuleValue, "STAGED");
                                            }
                                            obUtility.updatePickTaskToDoneForSingleOrder(picktaskId,markOpenPicksDoneAutomaticallySysRuleValue,"DONE");

                                        }
                                    }
                                }
                            } else {
                                if (remainingQty > 0) {
                                    cartonValidate.remainingQuantityWithUOM = remainingQty + " " + transactionUomName;
                                    cartonValidate.qtyRemaining = remainingQty;
                                    log.debug({title: 'remainingQty', details: remainingQty});
                                    var remainingPickTaskQty = Number(bigJS(lineItemRemainingQuantity).minus(enterQty));
                                    cartonValidate.remainingPickTaskQuantity = remainingPickTaskQty;
                                    cartonValidate.remainingPickTaskQty = remainingPickTaskQty;
                                    cartonValidate.isNavigateToQuantityPage = 'F';
                                    if (parseFloat(remainingPickTaskQty) > 0) {
                                        cartonValidate.isNavigateToQuantityPage = 'T';
                                        if (utility.isValueValid(recommendedBinId) && isTallyScanRequired != true &&
                                            utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == true &&
                                            (itemType != "noninventoryitem") ) {
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
                                                        searchName = "customsearch_wmsse_inventorybalance"
                                                    }
                                                }
                                                log.debug('searchName', searchName);
                                        var objBinDetails = obUtility.getItemsInventoryDetailswithInvStatusEnable(searchName, itemInternalId, pickBinId, warehouseLocationId,
                                                    itemType);

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
                                                        cartonValidate.isNavigateToQuantityPage = 'F';
                                                        cartonValidate.isBinScanPageNavigationRequired = 'T';
                                                        cartonValidate.recommendedBinNum = binData.bin.name;
                                                        cartonValidate.recommendedBinId = binData.bin.id;
                                                        cartonValidate.recommendedBinZoneId = binData.zone.id;
                                                        cartonValidate.recommendedBinZoneName = binData.zone.name;
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
                                                                    cartonValidate.recommendedBinQty = binStatusMakeAvailableQty;
                                                                }
                                                            }

                                                        } else {
                                                            cartonValidate.recommendedBinQty = binData.quantities[0] ? binData.quantities[0].quantity : 0;
                                                        }
                                                    } else {
                                                        cartonValidate.isNavigateToQuantityPage = 'F';
                                                        cartonValidate.isPickTaskListNavigationRequired = 'T';
                                                    }
                                                } else {
                                                    cartonValidate.isNavigateToQuantityPage = 'F';
                                                    cartonValidate.isPickTaskListNavigationRequired = 'T';
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    var pickTaskDetails = {};

                                    pickTaskDetails.orderInternalId = orderInternalId;
                                    pickTaskDetails.whLocationId = warehouseLocationId;
                                    pickTaskDetails.isZonePickingEnabled = isZonePickingEnabled;
                                    pickTaskDetails.selectedZones = selectedZones;
                                    var objpickTaskDetails = obUtility.getPickTaskDetailsForValidation(pickTaskDetails);

                                    if (objpickTaskDetails.length > 0) {
                                        if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
                                            var recLength = 0;
                                            var pickTasksLength = objpickTaskDetails.length;
                                            for(var pickTaskList = 0 ;pickTaskList < pickTasksLength; pickTaskList++){
                                                var zone = objpickTaskDetails[pickTaskList].zone;
                                                var picker = objpickTaskDetails[pickTaskList].picker;
                                                if(!utility.isValueValid(zone)){
													zone = "0";
                    							}else{
                    								zone = parseInt(zone);
                								}
                                                if((selectedZones.indexOf(zone) != -1 ) || (picker == currentUserId)){
                                                    recLength = recLength +1;
                                                }
                                            }
                                            cartonValidate.nextPickTaskCount = recLength;
                                        }
                                        else {
                                            cartonValidate.nextPickTaskCount = objpickTaskDetails.length;
                                        }
                                    } else {
                                        cartonValidate.nextPickTaskCount = 0;
                                    }

                                    if (locUseBinsFlag == true) {


    									var objPickedPickTaskDetails = obUtility.getPickTaskStageflag('singleOrder', '', orderInternalId, warehouseLocationId);

    									if (objPickedPickTaskDetails.length > 0) {
    										cartonValidate.showStageButton= 'Y';
    										if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
    											cartonValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
    											if(cartonValidate.boolAnyItemIsAlreadyStaged == 'Y'){
    												cartonValidate.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
    											}
    											else{
    												cartonValidate.starDescription = '';	
    											}

    										}
    									} else {
    										var picktaskstageflagDtlforalreadystaged = obUtility.getSOPickTaskStageflagforAlreadystaged(warehouseLocationId, orderInternalId);
    										if (utility.isValueValid(picktaskstageflagDtlforalreadystaged) && picktaskstageflagDtlforalreadystaged.length > 0) {
    											cartonValidate.showStageButton = 'Y';
    											if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
    												cartonValidate.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
    												if(cartonValidate.boolAnyItemIsAlreadyStaged == 'Y'){
    													cartonValidate.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
    												}
    												else{
    													cartonValidate.starDescription = '';	
    												}

    											}
    										} else {
    											cartonValidate.showStageButton = 'N';
    										}
    									}
    								}

                                    cartonValidate.remainingQuantityWithUOM = remainingQty;
                                    cartonValidate.qtyRemaining = remainingQty;

                                }
                                if (cartonValidate.remainingQuantityWithUOM == 0) {
                                    cartonValidate.remainingQuantityWithUOM = '0 ';
                                }
                                cartonValidate.picktaskId = picktaskId;
                                cartonValidate.barcodeQuantity = barcodeQuantity;
}
                                cartonValidate.isValid = true;

                            }
                        else
                        {
                        	var orderParamsArr = [];
                        	orderParamsArr.push(isValidContainerScanned.orderDetail);
                        	cartonValidate.errorMessage = utility.isValueValid(cartonValidate.errorMessage) ? cartonValidate.errorMessage : translator.getTranslationString("MULTIORDER_CONTAINER.VALIDATE",orderParamsArr) ;
                        	cartonValidate.isValid = false;
                        }
                        } else {
                            cartonValidate.errorMessage = translator.getTranslationString("MULTIORDER_CONTAINER.INVALIDINPUT");
                            cartonValidate.isValid = false;
                        }
                    }
                }
            catch (e)
                {
                    cartonValidate.isValid = false;
                    cartonValidate.errorMessage = e.message;
                    log.error({title: 'errorMessage', details: e.message + " Stack :" + e.stack});
                    log.error({title: 'debugMessage', details: debugString});
                }
                log.debug({title: 'Container Validate Return Object :', details: cartonValidate});

                cartonValidate.locUseBinsFlag = locUseBinsFlag;
                return cartonValidate;
            }

     


            return {
                'post': doPost
            };

    });
