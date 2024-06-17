/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './big', './wms_translator', './wms_inboundUtility','./wms_inbound_utility'],

    function(utility, Big, translator, inboundUtility,inboundLib) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doPost(requestBody) {

            var serialValidationDetails = {};
            var itemInternalId = '';
            var transactionInternalId = '';
            var transactionLineNo = '';
            var warehouseLocationId = '';
            var transactionName = '';
            var serialName = '';
            var numberOftimesSerialScanned = '';
            var transactionType = '';
            var scannedQuantity = '';
            var warehouseLocationName = '';
            var debugString = '';
            var impactedRecords = {};
            try {
                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    itemInternalId = requestParams.itemInternalId;
                    transactionInternalId = requestParams.transactionInternalId;
                    transactionLineNo = requestParams.transactionLineNo;
                    warehouseLocationId = requestParams.warehouseLocationId;

                    transactionName = requestParams.transactionName;
                    serialName = requestParams.serialName;
                    numberOftimesSerialScanned = requestParams.numberOfTimesSerialScanned;
                    transactionType = requestParams.transactionType;
                    scannedQuantity = requestParams.scannedQuantity;
                    var enteredQtyInEach = requestParams.enteredQtyInEach;
                    var transactionUomConversionRate = requestParams.transactionUomConversionRate;
                    var transactionUomName = requestParams.transactionUomName;
                    var itemType = requestParams.itemType;
                    var statusInternalId = requestParams.statusInternalId;
                    var strBarCode = requestParams.strBarCode;
                    var useitemcostflag = 'F';
                    var customer = requestParams.customerId;
                    var actualBeginTime = requestParams.actualBeginTime;
                    var inforeceivedQuantity = requestParams.inforeceivedQuantity;
                    var inforemainingQuantity = requestParams.inforemainingQuantity;
                    warehouseLocationName = requestParams.warehouseLocationName;
                    var locationBasedUseBins = '';
                    var isKitComponent          = requestParams.isKitComponent;
                    var parentItem              = requestParams.parentItem;
                    var parentItemLine          = requestParams.parentItemLine;
                    var targetLocation        =requestParams.targetlocation;
                    var targetSubsidiary      =requestParams.targetsubsidiary;
                    var vendorId =  requestParams.vendorId;

                    if (utility.isValueValid(serialName) && utility.isValueValid(itemInternalId) &&
                        utility.isValueValid(transactionName) && utility.isValueValid(warehouseLocationId) &&
                        utility.isValueValid(transactionLineNo) && utility.isValueValid(transactionInternalId) 
                        && utility.isValueValid(transactionType)) {

                        var itemResults = inboundUtility.getItemSearchDetails(itemInternalId, warehouseLocationId);
                        var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
                        var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
                        
                        if (itemResults.length == 0) {
                            serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.INACTIVE_ITEM');
                            serialValidationDetails.isValid = false;
                        } 
                        else {
                        	
                        	impactedRecords._ignoreUpdate = true;
                            var tempFlag = true;
                            var currItem = utility.getSKUIdWithName(serialName,warehouseLocationId,vendorId,transactionInternalId);
                            log.debug('currItem',currItem);
                            if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error)))){
                            var barcodeItemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
                               if(itemInternalId == barcodeItemInternalId ){
                                if(utility.isValueValid(currItem.barcodeSerialname)) {
                                    serialName = currItem.barcodeSerialname;
                                    }
                                }
                                else {
                                    tempFlag = false;
                                    serialValidationDetails.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
                                    serialValidationDetails.isValid = false;
                                }
                            }

                            var manuallyPostIrSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?', warehouseLocationId,transactionType);

                            
                            if (manuallyPostIrSystemRuleValue == 'Y' && tempFlag != false) {
                            	
                                var poitemLineDetails = inboundUtility.getRecevingOrderItemDetails(transactionName, itemInternalId,
                                		warehouseLocationId, transactionLineNo, null, null, transactionType,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName);
                               
                                if (poitemLineDetails.length > 0) {
                                	
                                    var poLineDetailsRec = poitemLineDetails[0];
                                    var poId = poLineDetailsRec.internalid;
                                   
                                    var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(poId, warehouseLocationId,
                                    		itemInternalId, transactionLineNo);
                                  
                                    if (JSON.stringify(openPutAwayDetails) !== '{}') {
                                    	
                                        var vpoitemOPentaskRcvQty = openPutAwayDetails[transactionLineNo];
                                        if (utility.isValueValid(vpoitemOPentaskRcvQty)) {
                                            var poLineReceivedQty = poLineDetailsRec.totalReceivedQty;
                                            var poLineRemainingQty = 0;
                                            if (transactionType == 'returnauthorization') {
                                                poLineRemainingQty = poLineDetailsRec.rmaRemainingQty;
                                            } else {
                                                poLineRemainingQty = poLineDetailsRec.poRemainingQty;
                                            }
                                            poLineDetailsRec.totalReceivedQty = Number(Big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));
                                            poLineDetailsRec.poRemainingQty = Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
                                        }
                                    }
                                    
                                    var vPoreminqty = poLineDetailsRec.poRemainingQty;
                                    if (parseFloat(vPoreminqty) <= 0) {
                                        tempFlag = false;
                                        serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.TRANSACTION_COMPLETED');
                                        serialValidationDetails.isValid = false;
                                    }
                                } else {
                                    tempFlag = false;
                                    if (transactionType == 'returnauthorization') {
                                        serialValidationDetails.errorMessage = translator.getTranslationString('RMA_SERIALVALIDATION.TRANSACTION_LINE_COMPLETED');
                                    } else {
                                        serialValidationDetails.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.TRANSACTION_LINE_COMPLETED');
                                    }
                                    serialValidationDetails.isValid = false;
                                }
                            }
                            if (tempFlag) {
                            	
                            	inboundLib.checkSerialAlreadyExistsInInventory(itemInternalId,serialName,warehouseLocationId,
                                    manuallyPostIrSystemRuleValue,serialValidationDetails,transactionLineNo,transactionInternalId);
                                    
                            	if (serialValidationDetails.isValid == true) {

                                            serialValidationDetails.serialNo = serialName;
                                            serialValidationDetails.numberOfTimesSerialScanned = parseFloat(numberOftimesSerialScanned) + 1;
                                            
                                            var createSerialObj = {};
                                            createSerialObj.serialName = serialName;
                                            createSerialObj.transactionInternalId = transactionInternalId;
                                            createSerialObj.transactionLineNo = transactionLineNo;
                                            createSerialObj.itemInternalId = itemInternalId;
                                            createSerialObj.quantity = 1;
                                            createSerialObj.serialStatus = false;
                                            createSerialObj.taskType = 2;
                                            
                                            var serialEntryRecordId = inboundUtility.createRecordInWMSSerialEntryCustomRecord(createSerialObj);
                                            
                                            serialValidationDetails.serialEntryRecordId = serialEntryRecordId;
                                            locationBasedUseBins = utility.getLocationFieldsByLookup(warehouseLocationId, new Array('usesbins'));
                                             serialValidationDetails.tallyScanBarcodeSerialname="";
                                            if (locationBasedUseBins.usesbins == false && 
                                            		enteredQtyInEach <= serialValidationDetails.numberOfTimesSerialScanned) {
                                                
                                            	serialValidationDetails.noBins = !locationBasedUseBins.usesbins;
                                                serialValidationDetails.systemRuleValue = manuallyPostIrSystemRuleValue;
                                                serialValidationDetails.warehouseLocationName = warehouseLocationName;
                                               
                                                var postIrObj = {};
                                                postIrObj.transactionType = transactionType;
                                                postIrObj.poInternalId = transactionInternalId;
                                                postIrObj.fetchedItemId = itemInternalId;
                                                postIrObj.poLineno = transactionLineNo;
                                                postIrObj.enterQty = scannedQuantity;
                                                postIrObj.itemType = itemType;
                                                postIrObj.whLocation = warehouseLocationId;
                                                postIrObj.tranid = transactionName;
                                                postIrObj.actualBeginTime = actualBeginTime;
                                                postIrObj.customer = customer;
                                                postIrObj.uom = transactionUomName;
                                                postIrObj.conversionRate = transactionUomConversionRate;
                                                postIrObj.useitemcostflag = useitemcostflag;
                                                postIrObj.systemRuleValue = manuallyPostIrSystemRuleValue;
                                                postIrObj.invtStatus = statusInternalId;
                                                postIrObj.fifoDate = null;
                                                postIrObj.PutStrategy = null;
                                                postIrObj.zoneno = null;
                                                postIrObj.TOLineDetails = null;
                                                postIrObj.lineFullQty = null;
                                                postIrObj.strBarCode = strBarCode;
                                                postIrObj.isKitComponent    = isKitComponent;
                                                postIrObj.parentItem        = parentItem;
                                                postIrObj.parentItemLine    = parentItemLine;
                                                postIrObj.targetLocation	= targetLocation;
                                                postIrObj.targetSubsidiary	= targetSubsidiary;
                                                var barcodeDataObj = {};
                                                barcodeDataObj.vendorId = requestParams.vendorId;
                                                barcodeDataObj.itemName = requestParams.fetcheditemname;
                                                barcodeDataObj.quantity = (postIrObj.enterQty).toString();
                                                barcodeDataObj.uom = postIrObj.uom; 
                                                barcodeDataObj.transactionId = transactionInternalId;
                                                barcodeDataObj.whLocation = warehouseLocationId;
                                                log.debug('barcodeDataObj',barcodeDataObj);
                                                var barcodeOutPutObj = utility.generateCompositeBarcodeString(barcodeDataObj);
                                                log.debug('barcodeOutPutObj',barcodeOutPutObj);
                                                if(utility.isValueValid(barcodeOutPutObj.compositeBarcodeString)){
                                                  postIrObj.strBarCode = barcodeOutPutObj.compositeBarcodeString;
                                                }   
                                                var itemReceipt = inboundLib.postItemReceipt(postIrObj);
                                                
                                                if (itemReceipt != '') {
                                                	
                                                	serialValidationDetails.isValid = true;
                                                	var remainingLinesToReceiveCount = getPORemainingLinesToReceiveCount(transactionName,
                                                			warehouseLocationId,transactionInternalId,transactionType,poId,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName);
                                                	
                                                	if (parseInt(remainingLinesToReceiveCount) > 0) {
                                                		
                                                		serialValidationDetails.isValid = true;
                                                		serialValidationDetails.remainingItemscount = remainingLinesToReceiveCount;
                                                		
                                                	}else {
                                                		
                                                		serialValidationDetails.isValid = true;
                                                		serialValidationDetails.remainingItemscount = 0;
                                                	}
                                                } 
                                                
                                              
                                                 impactedRecords = inboundUtility.noCodeSolForReceiving(transactionInternalId, transactionLineNo, itemReceipt, transactionType,'',locationBasedUseBins.usesbins);
                                                 serialValidationDetails.impactedRecords = impactedRecords;
                                            }
                                            serialValidationDetails.inforemainingQuantity = inforemainingQuantity;
                                            serialValidationDetails.inforeceivedQuantity = inforeceivedQuantity;
                                            serialValidationDetails.isValid = true;
                                        
                                    }
                                }
                               
                            }
                        }
                     else {
                        serialValidationDetails.errorMessage = translator.getTranslationString("RMA_SERIALVALIDATION.VALID_SERIAL");
                        serialValidationDetails.isValid = false;
                    }
                } else {
                    serialValidationDetails.isValid = false;
                }
            } catch (e) {
                serialValidationDetails.isValid = false;
                serialValidationDetails.errorMessage = e.message;
                log.error({
                    title: 'errorMessage',
                    details: e.message + " Stack :" + e.stack
                });
                log.error({
                    title: 'debugString',
                    details: debugString
                });
            }
            return serialValidationDetails;
        }
        
        return {
            'post': doPost
        };
        function getPORemainingLinesToReceiveCount(transactionName,warehouseLocationId,transactionInternalId,transactionType,poId,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName){
            
        	var toLineDetails = inboundUtility.getRecevingOrderItemDetails(transactionName, null, 
            		warehouseLocationId, '', transactionInternalId, '', transactionType,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName);
            var pORemainingLinesToReceiveCount = 0;
            
            if (toLineDetails.length > 0) {
            	
                var poId = toLineDetails[0].internalid;
                var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(poId, 
                		warehouseLocationId);
                
                var vPoReminqty = 0;
                var poLineReceivedQty = 0;
                var poLineRemainingQty = 0;
                
                for (var cnt in toLineDetails) {
                    var poLineArr = toLineDetails[cnt];
                     var poLine = poLineArr.line;
                    if (JSON.stringify(openPutAwayDetails) !== '{}') {
                        var vpoitemOPentaskRcvQty = openPutAwayDetails[poLine];
                        if (utility.isValueValid(vpoitemOPentaskRcvQty)) {
                            poLineReceivedQty = poLineArr.totalReceivedQty;
                            if (transactionType == 'transferorder') {
                                poLineRemainingQty = poLineArr.TransferOrderLine_Remainingqty;
                            } else if (transactionType == 'returnauthorization') {
                                poLineRemainingQty = poLineArr.rmaRemainingQty;
                            } else {
                                poLineRemainingQty = poLineArr.poRemainingQty;
                            }
                            poLineArr.totalReceivedQty = Number(Big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));
                            poLineArr.poRemainingQty = Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
                            poLineArr.rmaRemainingQty =Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
                        }
                    }
                    if (transactionType == 'transferorder') {
                        vPoReminqty = poLineArr.TransferOrderLine_Remainingqty;
                    } else if (transactionType == 'returnauthorization') {
                        vPoReminqty = poLineArr.rmaRemainingQty;
                    } else {
                        vPoReminqty = poLineArr.poRemainingQty;
                    }
                    if (parseFloat(vPoReminqty) > 0) {
                    	pORemainingLinesToReceiveCount = pORemainingLinesToReceiveCount+1;
                        break;
                    }
                }
            }
            return pORemainingLinesToReceiveCount;
        }
        
       
    });