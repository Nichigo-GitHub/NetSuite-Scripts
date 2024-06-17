/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', './wms_inboundUtility',  './big', 'N/format', './wms_tallyScan_utility','./wms_inbound_utility','N/record','N/query','N/runtime','./wms_labelPrinting_utility'],
    function (search, utility, translator, inboundUtility,  Big, format, tallyScanUtility,inboundLib,record,query,runtime,labelPrintingUtility) {

        /**
         * This function is to fetch PO details based on the item
         */
        function doPost(requestBody) {

            var transactionDetailsArray      =  {};
            var shipmentNumber               =  '';
            var warehouseLocationId          =  '';
            var itemInternalId               =  '';
            var itemName                     =  '';
            var debugString                  =  '';
            var purchaseorderInternalId      =  '';
            var scannedQuantity              =  '';
            var transactionUomConversionRate =  '';
            var remainingQuantity            =  0;
            var transactionUomName           =  '';
            var itemType                     =  '';
            var shipmentInternalNumber       =  '';
            var shipmentLineNumber           =  '';
            var LotName                      =  '';
            var expectedQuantity             =  '';
            var selectedStatusName           =  '';
            var selectedStatusId             = '';
            var serialentryIdStr             = '';
            var lotString                    = '';
            var remaingQtyToReceive			 = '';
            var lotExpiryDate                = '';
            var locUseBinsFlag               = '';
            var lotJSONobj                   = '';
            var poInternald                  = '';
            var shipmentId                   = '';
            var shipmentLineNo               = '';
            var totalQtyScanned              = '';
            var imageUrl                     = '';
            var incoTerm                     = '';

            var transactionType='ISM';
            var impactedRecords              ={};
            var openTaskIdarray              =[];
            var tallyLoopObj = {};
            var isTallyScanRequired = '';

            try {
                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    log.debug({title: 'requestParams', details: requestParams});
                    warehouseLocationId = requestParams.warehouseLocationId;
                    itemInternalId = requestParams.itemInternalId;
                    itemName = requestParams.itemName;
                    shipmentNumber = requestParams.shipmentNumber;
                    purchaseorderInternalId = requestParams.purchaseorderInternalId;
                    scannedQuantity = requestParams.scannedQuantity;
                    transactionUomConversionRate = requestParams.transactionUomConversionRate;
                    remainingQuantity = requestParams.remainingQuantity;
                    transactionUomName = requestParams.transactionUomName;
                    itemType = requestParams.itemType;
                    shipmentInternalNumber = requestParams.shipmentInternalNumber;
                    shipmentLineNumber = requestParams.shipmentLineNumber;
                    LotName = requestParams.LotName;
                    expectedQuantity = requestParams.expectedQuantity;
                    selectedStatusName = requestParams.invStatusName;
                    selectedStatusId = requestParams.invStatus;
                    serialentryIdStr = requestParams.serialentryIdStr;
                    lotString = requestParams.lotString;
                    totalQtyScanned = requestParams.totalQtyScanned;
                    lotExpiryDate = requestParams.lotExpiryDate;
                    locUseBinsFlag = requestParams.locUseBinsFlag;
                    lotJSONobj = requestParams.lotJSONobj;
                    poInternald = requestParams.purchaseorderInternalId;
                    shipmentId = requestParams.shipmentInternalNumber;
                    shipmentLineNo = requestParams.shipmentLineNumber;
                    imageUrl = requestParams.imageUrl;
                    incoTerm = requestParams.incoTerm;
                    lotString = requestParams.lotString;
                    var barcodeQuantity = requestParams.barcodeQuantity;
                    var printQtyUom = requestParams.printQtyUom;
                    isTallyScanRequired = requestParams.isTallyScanRequired;
                    tallyLoopObj = requestParams.tallyLoopObj;
                    var skipBtn  =  requestParams.btnElementName;
                    var numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
                    var randomTallyScanRule = requestParams.randomTallyScan;//F_RT
                    var transcationUomInternalId = requestParams.transcationUomInternalId;//F_RT
                    var btnClicked =  requestParams.btnElementName;//F_RT
                    var lotScanned = requestParams.lotScanned; //F_RT
                    var printEnabled = requestParams.printEnabled;//F_RT
                    var tempBtnClicked  =  requestParams.tempButtonName;//F_RT
                    var backBtnVisibility = requestParams.backBtnVisibility;//F_RT
                    var selectedConversionRate = 1;
                    var tallyScanRemainingQty = 0;
                    if (!utility.isValueValid(isTallyScanRequired)) {
                        isTallyScanRequired = false;
                    }
                    if (utility.isValueValid(barcodeQuantity)) {
                        transactionDetailsArray.barcodeQuantity = requestParams.barcodeQuantity[0];
                    }
                    if (utility.isValueValid(remainingQuantity)) {
                        remainingQuantity = parseFloat(remainingQuantity);
                    }
                    if(!utility.isValueValid(randomTallyScanRule)){
                        randomTallyScanRule = 'F';
                    }
                    if(randomTallyScanRule == 'T') {
                        tallyScanRemainingQty = remainingQuantity;
                        transactionDetailsArray.remainingQuantity = remainingQuantity;
                        var barcodeQtyObject = utility.isValueValid(requestParams.barcodeQuantity) ? requestParams.barcodeQuantity[0] : '';
                        if(utility.isValueValid(barcodeQtyObject)){
                            scannedQuantity = barcodeQtyObject.value;
                        }
                    }

                    if (isTallyScanRequired == true && randomTallyScanRule != "T") {

                        if (utility.isValueValid(requestParams.qtyUomSelected)) {
                            if (!utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(transactionUomName)) {
                                transactionUomConversionRate = this._getTransactionUomConversionRate(itemInternalId, transactionUomName);
                            }
                            if (!utility.isValueValid(transactionUomConversionRate)){
                                transactionUomConversionRate = 1;
                            }
                            var qtyUomSelected = requestParams.qtyUomSelected;
                            if (utility.isValueValid(requestParams.qtyUomSelected[0].unit)&& (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")){
                                selectedConversionRate = qtyUomSelected[0].conversionrate;
                            }
                            var remianingQtyWithConversionRate = Number(Big(remainingQuantity).mul(transactionUomConversionRate));
                            /* if(randomTallyScanRule == "T"){
                                 remianingQtyWithConversionRate = remainingQuantity;
                             }*/
                            remianingQtyWithConversionRate  = Number(Big(parseFloat(remianingQtyWithConversionRate)).minus(selectedConversionRate));
                            /*if(randomTallyScanRule == "T") {
                                tallyScanRemainingQty = remianingQtyWithConversionRate;
                            }
                            else {*/
                            tallyScanRemainingQty = Number(Big(remianingQtyWithConversionRate).div(transactionUomConversionRate));
                            // }
                            remainingQuantity        =  Number(Big(parseFloat(tallyScanRemainingQty)).plus(scannedQuantity));

                            //  tallyScanRemainingQty = ((remianingQtyWithConversionRate) - parseFloat(selectedConversionRate))/parseFloat(transactionUomConversionRate);
                            //	remainingQuantity = parseFloat(tallyScanRemainingQty)+parseFloat(scannedQuantity);
                        }
                        transactionDetailsArray.remainingQuantity = tallyScanRemainingQty;
                        var barcodeQtyObject = utility.isValueValid(requestParams.barcodeQuantity) ? requestParams.barcodeQuantity[0] : '';
                        if(utility.isValueValid(barcodeQtyObject)){
                            scannedQuantity = barcodeQtyObject.value;
                        }
                    }


                    if (utility.isValueValid(scannedQuantity) && !isNaN(scannedQuantity) && (scannedQuantity > 0) &&
                        ((parseFloat(remainingQuantity) >= parseFloat(scannedQuantity))||(parseFloat(remainingQuantity) > 0 &&
                            randomTallyScanRule == "T"))) {
                        var itemDetailsObj = {};
                        transactionDetailsArray.isValid = true;
                        transactionDetailsArray.lotPageNavigationRequiredForTS = "F";//F_RT
                        transactionDetailsArray.itemType = itemType;//F_RT
                        transactionDetailsArray.shipmentLineNo = requestParams.shipmentLineNumber;//F_RT
                        transactionDetailsArray.itemDescription = requestParams.itemDescription;//F_RT
                        transactionDetailsArray.itemName =  requestParams.itemName;//F_RT
                        transactionDetailsArray.itemInternalId = requestParams.itemInternalId;//F_RT
                        transactionDetailsArray.enteredQtyInEach = requestParams.enteredQtyInEach;//F_RT
                        transactionDetailsArray.serialPageNavigationRequiredForTS = 'F';//F_RT
                        transactionDetailsArray.transactionUomConversionRate = transactionUomConversionRate;//F_R
                        transactionDetailsArray.transcationUomName = transactionUomName;//F_R// T
                        transactionDetailsArray.transcationUomInternalId = transcationUomInternalId;//F_RT
                        transactionDetailsArray.unitType = requestParams.unitType;//F_RT
                        transactionDetailsArray.backOrderQty = requestParams.backOrderQty;//F_RT
                        transactionDetailsArray.isItemAliasPopupRequired =false;
                        transactionDetailsArray.isLastScanForItem = false;
                        transactionDetailsArray.itemAliasObject= requestParams.itemAliasObject;
                        transactionDetailsArray.isSerialItemFlag = false;
                        transactionDetailsArray.poInternalId =poInternald;

                        var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
                        var isInventoryOrLotItem = false;
                        var isNavigationToLotScreenRequired = false;
                        transactionDetailsArray.isValid = true;
                        impactedRecords._ignoreUpdate = true;
                        if (isTallyScanRequired == true) {
                            tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
                            transactionDetailsArray.isSamePageNavigationRequired = false;
                            transactionDetailsArray.isBinScanRequired = true;
                            if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem" && btnClicked != 'Skip') {
                                if (utility.isValueValid(requestParams.tallyScanItem)) {
                                    transactionDetailsArray.isSerialItemFlag = false;
                                    itemDetailsObj.tallyScanItem = requestParams.tallyScanItem;
                                    itemDetailsObj.warehouseLocationId = warehouseLocationId;
                                    itemDetailsObj.unitType = requestParams.unitType;
                                    itemDetailsObj.transactionUomName = transactionUomName;
                                    if(randomTallyScanRule != "T") {
                                        itemDetailsObj.uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
                                    }
                                    itemDetailsObj.qtyUomSelected = requestParams.qtyUomSelected;
                                    itemDetailsObj.barcodeQuantity = requestParams.barcodeQuantity;
                                    itemDetailsObj.tallyScanSerial = requestParams.tallyScanItem;
                                    itemDetailsObj.pickTaskId = requestParams.tallyScanItem;
                                    itemDetailsObj.pickItemId = itemInternalId;
                                    itemDetailsObj.InvStatusInternalId = selectedStatusId;
                                    itemDetailsObj.taskType = 9;
                                    transactionDetailsArray = tallyScanUtility.validateItemTallyScan(itemDetailsObj,'inboundProcess',requestParams.VendorId,purchaseorderInternalId);
                                    transactionDetailsArray.remainingQuantity = tallyScanRemainingQty;
                                    transactionDetailsArray.poInternalId =poInternald;
                                    if(randomTallyScanRule != "T") {
                                        transactionDetailsArray.itemType = itemType;//F_RT
                                        transactionDetailsArray.shipmentLineNo = requestParams.shipmentLineNumber;//F_RT
                                        transactionDetailsArray.itemDescription = requestParams.itemDescription;//F_RT
                                        transactionDetailsArray.itemName = requestParams.itemName;//F_RT
                                        transactionDetailsArray.itemInternalId = requestParams.itemInternalId;//F_RT
                                        transactionDetailsArray.enteredQtyInEach = requestParams.enteredQtyInEach;//F_RT
                                        transactionDetailsArray.serialPageNavigationRequiredForTS = 'F';//F_RT
                                        transactionDetailsArray.transactionUomConversionRate = transactionUomConversionRate;//F_R
                                        transactionDetailsArray.transcationUomName = transactionUomName;//F_R// T
                                        transactionDetailsArray.transcationUomInternalId = transcationUomInternalId;//F_RT
                                        transactionDetailsArray.unitType = requestParams.unitType;//F_RT
                                        transactionDetailsArray.backOrderQty = requestParams.backOrderQty;//F_RT
                                        transactionDetailsArray.isItemAliasPopupRequired = false;
                                        transactionDetailsArray.isLastScanForItem = false;
                                        transactionDetailsArray.itemAliasObject = requestParams.itemAliasObject;
                                        transactionDetailsArray.isSerialItemFlag = false;
                                    }
                                    if(!utility.isValueValid(transactionDetailsArray.internalid)){
                                        transactionDetailsArray.internalid = utility.isValueValid(transactionDetailsArray.barcodeIteminternalid) ? transactionDetailsArray.barcodeIteminternalid : transactionDetailsArray.itemInternalId;
                                    }
                                    if (utility.isValueValid(transactionDetailsArray.errorMessage)) {
                                        transactionDetailsArray.isValid = false;
                                    } else if (transactionDetailsArray.internalid != itemInternalId &&
                                        randomTallyScanRule != "T") {
                                        transactionDetailsArray.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
                                        transactionDetailsArray.isValid = false;
                                    }
                                    else{
                                        if((randomTallyScanRule == "T" && transactionDetailsArray.isValid != false)||(tempBtnClicked =="PrintAction")) {//new item scanned
                                            var itemdtlsObject = inboundUtility.validateScannedItemForTallyScan(transactionDetailsArray.internalid);
                                            if(utility.isValueValid(itemdtlsObject.errorMessage)){
                                                transactionDetailsArray.errorMessage = itemdtlsObject.errorMessage;
                                                transactionDetailsArray.isValid = false;
                                            }
                                            else{
                                                itemType = itemdtlsObject.itemType;
                                                itemInternalId = itemdtlsObject.itemInternalId;
                                                transactionDetailsArray.itemType = itemType;
                                                transactionDetailsArray.itemInternalId = itemInternalId;
                                                transactionDetailsArray.shipmentLineNo = requestParams.shipmentLineNumber;
                                                if(utility.isValueValid(itemdtlsObject.unitsType) && utility.isValueValid(itemdtlsObject.unitsType[0].value)) {
                                                    transactionDetailsArray.unitType = itemdtlsObject.unitsType[0].value;
                                                }
                                                else{
                                                    transactionDetailsArray.unitType = "";
                                                }
                                               this._validateScannedItemAgainstISM(transactionDetailsArray,inventoryStatusFeature,
                                                    tallyLoopObj,shipmentNumber,itemInternalId,
                                                    warehouseLocationId,purchaseorderInternalId,
                                                    transactionType,
                                                    itemType,
                                                    tallyScanRemainingQty,
                                                    transactionUomConversionRate,
                                                    selectedStatusId,requestParams.qtyUomSelected,
                                                    requestParams.backOrderQty,requestParams.tallyScanItem,requestParams.numberOfTimesSerialScanned,
                                                    LotName,locUseBinsFlag,scannedQuantity,shipmentId,lotScanned,requestParams.scannedserialsArr,lotJSONobj);
                                                // if((itemType == "lotnumberedinventoryitem" ||itemType == "lotnumberedassemblyitem") && (!utility.isValueValid(transactionDetailsArray.lotScanned))){
                                                //   transactionDetailsArray.lotScanned = lotScanned;
                                                // }


                                                if(printEnabled && transactionDetailsArray.isValid != false ){
                                                    var itemAliasObject = requestParams.itemAliasObject;
                                                    log.debug('@@@@ itemAliasObject',itemAliasObject);
                                                    if (utility.isValueValid(transactionDetailsArray.isItemAliasScanFlag) && transactionDetailsArray.isItemAliasScanFlag) {
                                                        transactionDetailsArray.scannedItemAliasForPrint = requestParams.tallyScanItem;
                                                    } else if (utility.isValueValid(transactionDetailsArray.isbarcodescanned) && transactionDetailsArray.isbarcodescanned &&
                                                        utility.isValueValid(transactionDetailsArray.barcodeItem)) {
                                                        transactionDetailsArray.scannedItemAliasForPrint = transactionDetailsArray.barcodeItem;
                                                    } else {
                                                    this.getItemAliasResults(itemInternalId,warehouseLocationId,requestParams.VendorId,requestParams.tallyScanItem,transactionDetailsArray,itemAliasObject,transactionDetailsArray.transactionLineNo);
                                                    transactionDetailsArray.itemAliasObject= itemAliasObject;
                                                    if(transactionDetailsArray.isLastScanForItem == true && transactionDetailsArray.isItemAliasPopupRequired == true){
                                                        transactionDetailsArray.printFlag = false;
                                                    }
                                                    log.debug('AfterItemAlias transactionDetailsArray.printFlag',transactionDetailsArray.printFlag);
                                                    }
                                                }

                                            }

                                        }
                                    }
                                } else {
                                    if (skipBtn != 'Skip') {
                                        transactionDetailsArray.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
                                        transactionDetailsArray.isValid = false;
                                    }
                                }

                            }
                            else{
                                if(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")
                                {
                                    transactionDetailsArray.isSerialItemFlag = true;
                                }
                                if((utility.isValueValid(requestParams.tallyScanItem)) || btnClicked == 'Done'){
                                    //if((utility.isValueValid(requestParams.tallyScanItem))){
                                    transactionDetailsArray.remainingQuantity = tallyScanRemainingQty;
                                    if(utility.isValueValid(requestParams.qtyUomSelected) && utility.isValueValid(requestParams.uomSelectionforFirstItr) && randomTallyScanRule != 'T'){
                                        var qtyUomSelected = requestParams.qtyUomSelected;
                                        var currentSelectedUnit = qtyUomSelected[0].unit;
                                        if(utility.isValueValid(currentSelectedUnit) && currentSelectedUnit != requestParams.uomSelectionforFirstItr){
                                            transactionDetailsArray.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
                                            transactionDetailsArray.isValid = false;
                                        }
                                        else{
                                            if(randomTallyScanRule == 'T') {
                                                transactionDetailsArray.uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
                                                
                                            }
                                        }
                                    }
                                    else{
                                        if(!utility.isValueValid(requestParams.uomSelectionforFirstItr) &&
                                            utility.isValueValid(requestParams.qtyUomSelected)){
                                            if (utility.isValueValid(requestParams.unitType)) {
                                                var uomResult = tallyScanUtility.getUOMDetails(requestParams.unitType);

                                                for (var itr in uomResult) {
                                                    if (uomResult[itr]['uom.baseunit']) {
                                                        transactionDetailsArray.uomSelectionforFirstItr = uomResult[itr]['uom.internalid'];
                                                       
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(randomTallyScanRule == 'T'){
                                        transactionDetailsArray.remainingQuantity  = tallyScanRemainingQty-1;
                                        transactionDetailsArray.poId = purchaseorderInternalId;
                                        transactionDetailsArray.lotJSONobj = lotJSONobj;
                                        var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
                                        var enteredQtyinEach = requestParams.enteredQtyInEach;
                                        var serialCounter = requestParams.numberOfTimesSerialScanned
                                        var key = shipmentNumber + (inventoryStatusFeature ? '_' + requestParams.invStatus : "") + "^" + itemInternalId + "^" + transactionDetailsArray.shipmentLineNo;
                                        var scanQty = 1;
                                        if(tallyLoopObj[key]!= undefined) {
                                            scanQty = Number(Big(tallyLoopObj[key]['quantity']).plus(1));
                                        }
                                        if(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                            serialCounter =serialCounter+1;
                                        }else{
                                            serialCounter =scanQty;
                                        }
                                            if (((serialCounter >= enteredQtyinEach) && tallyScanRemainingQty > 0) || btnClicked == 'Done') {
                                            transactionDetailsArray.itemType = "inventoryitem";
                                        }
                                        else{
                                            if(skipBtn != 'Done') {
                                                transactionDetailsArray.showDoneBtn = 'T';
                                            }
                                        }
                                    }

                                }
                                else{
                                    if(skipBtn != 'Skip' && skipBtn != 'Done')
                                    {
                                        transactionDetailsArray.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
                                        transactionDetailsArray.isValid = false;
                                    }
                                }

                            }


                        }
                        if (transactionDetailsArray.isValid != false && transactionDetailsArray.lotPageNavigationRequiredForTS !='T'
                            && transactionDetailsArray.serialPageNavigationRequiredForTS != 'T' && tempBtnClicked !="PrintAction") {
                            if (!utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(transactionUomName)) {
                                transactionUomConversionRate = this._getTransactionUomConversionRate(itemInternalId, transactionUomName);
                            }
                            log.debug({title: 'itemType', details: itemType});
                            if (utility.isValueValid(printQtyUom)) {
                                barcodeQuantity = printQtyUom;
                            }
                            if (utility.isValueValid(barcodeQuantity)) {
                                transactionDetailsArray.barcodeQuantity = barcodeQuantity;
                            }

                            var noStockQty = parseFloat(scannedQuantity);


                            if (itemType != 'noninventoryitem' && itemType != 'otherchargeitem' &&
                                itemType != 'serviceitem' && itemType != 'downloaditem' && itemType != 'giftcertificateitem') {
                                isInventoryOrLotItem = true;
                                if (utility.isValueValid(transactionUomName)) {
                                    transactionDetailsArray.infoscannedQuantity = scannedQuantity + ' ' + transactionUomName;
                                } else {
                                    transactionDetailsArray.infoscannedQuantity = scannedQuantity;
                                }
                                transactionDetailsArray.scannedQuantity = scannedQuantity;

                                if ((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')) {
                                    transactionDetailsArray.isSerialItemFlag = true;
                                  transactionDetailsArray.poname = requestParams.poname;
                                    isInventoryOrLotItem = false;
                                    impactedRecords._ignoreUpdate = true;
                                    var scannedSerialsArr = [];
                                    if (!utility.isValueValid(transactionUomConversionRate)) {
                                        transactionUomConversionRate = 1;
                                    }
                                    var convertionQty = (scannedQuantity) * (transactionUomConversionRate);
                                    if (convertionQty.toString().indexOf('.') != -1) {
                                        transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
                                        transactionDetailsArray.isValid= false;
                                    } else {
                                        if(isTallyScanRequired != true){
                                            debugString = debugString + ',convertionQty :' + convertionQty;
                                            transactionDetailsArray.enteredQtyInEach = convertionQty;
                                            transactionDetailsArray.numberOfTimesSerialScanned = 0;
                                            transactionDetailsArray.selectedStatusName = selectedStatusName;
                                            transactionDetailsArray.selectedStatusId = selectedStatusId;
                                            transactionDetailsArray.remainingQuantity = remainingQuantity;
                                            transactionDetailsArray.errorMessage = '';
                                            transactionDetailsArray.isValid = true;
                                            transactionDetailsArray.transactionUomConvertedQty = convertionQty;
                                        }
                                        else{
                                            if(!utility.isValueValid(numberOfTimesSerialScanned) &&  isTallyScanRequired == true)
                                            {
                                                numberOfTimesSerialScanned=0;
                                            }
                                            //log.debug({title:'getNumber',details:getNumber});
                                            var serialArrFromSerialEntry = [];
                                            if((parseInt(numberOfTimesSerialScanned)==0 || randomTallyScanRule == "T" )&& skipBtn != 'Skip' && skipBtn != 'Done')
                                            {
                                                var serialSearchResults = inboundUtility.getSerialsFromSerialEntry(shipmentLineNumber,shipmentInternalNumber,purchaseorderInternalId);

                                                if(utility.isValueValid(requestParams.scannedserialsArr)){
                                                    scannedSerialsArr = requestParams.scannedserialsArr;
                                                }
                                                var openTaskRecId = 0;
                                                if(randomTallyScanRule == "T"){
                                                    shipmentLineNumber = transactionDetailsArray.shipmentLineNo;
                                                    openTaskRecId =_getOpenTask(purchaseorderInternalId,shipmentLineNumber,inventoryStatusFeature,selectedStatusId,locUseBinsFlag,'',[]);
                                                    log.debug("opentaskrecid",openTaskRecId);
                                                     var key = '';
                                                        key = shipmentNumber + (inventoryStatusFeature ? '_' + selectedStatusId : '') + "^" + itemInternalId + "^" + transactionDetailsArray.shipmentLineNo;
                                                      if(utility.isValueValid(openTaskRecId) && numberOfTimesSerialScanned == 0 && (!utility.isValueValid(tallyLoopObj[key]))){
                                                        record.delete({
                                                            type: 'customrecord_wmsse_trn_opentask',
                                                            id: parseInt(openTaskRecId)
                                                        });
                                                        openTaskRecId = 0;
                                                    }


                                                }
                                                if(serialSearchResults.length > 0)
                                                {
                                                    var opentaskSerialsArr = inboundUtility.getOpenTaskSerials(itemInternalId,shipmentInternalNumber,shipmentLineNumber);
                                                    for (var j = 0; j < serialSearchResults.length; j++) {
                                                        var serialEntryRecord = serialSearchResults[j];
                                                        var serial = serialEntryRecord.name;

                                                        if((scannedSerialsArr.indexOf(serial) == -1 && opentaskSerialsArr.indexOf(serial) == -1)||
                                                            (scannedSerialsArr.indexOf(serial) == -1 && numberOfTimesSerialScanned > 0))
                                                        {
                                                            inboundUtility.closeSerialInSerialEntry(serialEntryRecord.id,serial);

                                                        }
                                                        else{
                                                            serialArrFromSerialEntry.push(serial);
                                                        }
                                                    }

                                                }
                                            }
                                            if(skipBtn != 'Skip' && skipBtn != 'Done'){
                                                var serialName =  requestParams.tallyScanItem;
                                                var manuallyPostIrSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',
                                                    warehouseLocationId,transactionType);
                                                var currItem = utility.getSKUIdWithName(serialName,warehouseLocationId,requestParams.VendorId,purchaseorderInternalId);
                                                if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error)))){
                                                    var barcodeItemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
                                                    if(itemInternalId == barcodeItemInternalId ){
                                                        if(utility.isValueValid(currItem.barcodeSerialname)) {
                                                            serialName = currItem.barcodeSerialname;
                                                            requestParams.tallyScanItem = serialName;
                                                        }
                                                    }
                                                }
                                                if(openTaskRecId > 0 && randomTallyScanRule == 'T' && serialArrFromSerialEntry.length >0) {
                                                    log.debug("opentaskrecidinsideif",openTaskRecId);
                                                    inboundUtility.updateOpentaskFields(openTaskRecId,'', serialArrFromSerialEntry,'');
                                                }
                                                inboundLib.checkSerialAlreadyExistsInInventory(itemInternalId,serialName,warehouseLocationId,
                                                    manuallyPostIrSystemRuleValue,transactionDetailsArray,shipmentLineNumber,poInternald);
                                                log.debug('transactionDetailsArray.isValid',transactionDetailsArray.isValid);
                                                if (transactionDetailsArray.isValid == true) {

                                                    if(transactionDetailsArray.isValid == true){
                                                        transactionDetailsArray.serialNo = requestParams.tallyScanItem;
                                                        transactionDetailsArray.numberOfTimesSerialScanned = parseFloat(numberOfTimesSerialScanned) + 1;

                                                        var createSerialObj = {};
                                                        createSerialObj.serialName = serialName;
                                                        createSerialObj.transactionInternalId = poInternald;
                                                        createSerialObj.transactionLineNo = shipmentLineNumber;
                                                        createSerialObj.itemInternalId = itemInternalId;
                                                        createSerialObj.quantity = 1;
                                                        createSerialObj.serialStatus = false;
                                                        createSerialObj.taskType = 2;
                                                        createSerialObj.inventoryStatus = selectedStatusId;
                                                        createSerialObj.shipmentId = shipmentInternalNumber;

                                                        var serialEntryRecordId = inboundUtility.createRecordInWMSSerialEntryCustomRecord(createSerialObj);
                                                        transactionDetailsArray.serialEntryRecordId = serialEntryRecordId;
                                                        transactionDetailsArray.errorMessage = '';
                                                        if(utility.isValueValid(requestParams.tallyScanItem)) {
                                                            if(scannedSerialsArr.indexOf(requestParams.tallyScanItem)== -1) {
                                                                scannedSerialsArr.push(requestParams.tallyScanItem);
                                                            }
                                                            transactionDetailsArray.scannedserialsArr = scannedSerialsArr;
                                                            if(serialArrFromSerialEntry.indexOf(requestParams.tallyScanItem)== -1) {
                                                                serialArrFromSerialEntry.push(requestParams.tallyScanItem);
                                                            }
                                                        }

                                                        var serialEntryRecordObj = {};
                                                        serialEntryRecordObj.serialEntryRecordId = serialEntryRecordId;
                                                        var serialEntryRecordArray = [];
                                                        if(utility.isValueValid(requestParams.serialEntryRecordArray))
                                                        {
                                                            serialEntryRecordArray = requestParams.serialEntryRecordArray;
                                                            serialEntryRecordArray.push(serialEntryRecordObj);
                                                        }
                                                        else
                                                        {
                                                            serialEntryRecordArray = [];
                                                            serialEntryRecordArray = [];
                                                            serialEntryRecordArray.push(serialEntryRecordObj);
                                                        }
                                                        transactionDetailsArray.serialEntryRecordArray = serialEntryRecordArray;
                                                        transactionDetailsArray.isValid = true;
                                                        //transactionDetailsArray.remainingQuantity = tallyScanRemainingQty;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && (transactionDetailsArray.isValid != false) ) {

                                    remaingQtyToReceive = Number(Big(remainingQuantity).minus(Big(scannedQuantity)));
                                    totalQtyScanned = totalQtyScanned ? Number(Big(parseFloat(scannedQuantity)).plus(totalQtyScanned)) : scannedQuantity;
                                    var lotQty = scannedQuantity;
                                    if(isTallyScanRequired == true ){
                                        lotQty = 1;
                                    }
                                    lotJSONobj = this._createOrUpdateLotJSONObject(lotJSONobj, LotName, lotQty, selectedStatusName, lotExpiryDate, selectedStatusId);
                                    transactionDetailsArray.lotJSONobj = JSON.stringify(lotJSONobj);

                                    if(isTallyScanRequired != true ){
                                        isInventoryOrLotItem = true;
                                        if (utility.isValueValid(barcodeQuantity) && (utility.isValueValid(barcodeQuantity[0].unit))) {
                                            var itemAliasUnit = [{'unit': barcodeQuantity[0].unit}];
                                            transactionDetailsArray.barcodeQuantity = itemAliasUnit;
                                        }

                                        if (remaingQtyToReceive > 0) {
                                            transactionDetailsArray.isValid = true;
                                            transactionDetailsArray.remainingQuantity = remaingQtyToReceive;
                                            transactionDetailsArray.totalQtyScanned = totalQtyScanned;
                                            transactionDetailsArray.scannedQuantity = totalQtyScanned;

                                            transactionDetailsArray.navigatetoLotScreen = 'yes';
                                            isNavigationToLotScreenRequired = true;

                                        } else {
                                            if (expectedQuantity != totalQtyScanned) {
                                                transactionDetailsArray.scannedQuantity = totalQtyScanned;
                                            } else {
                                                transactionDetailsArray.scannedQuantity = expectedQuantity;
                                            }
                                            transactionDetailsArray.isValid = true;
                                        }
                                    }

                                }


                                transactionDetailsArray.selectedStatusName = selectedStatusName;
                                transactionDetailsArray.selectedStatusId = selectedStatusId;

                            }
                            if(isTallyScanRequired == true && (transactionDetailsArray.isValid != false)){
                                transactionDetailsArray.isBinScanRequired = true;
                                var barcodeQty = parseInt(scannedQuantity)+1;
                                var qtyUomSelected = requestParams.qtyUomSelected;
                                var unitSelected = '';

                                if(utility.isValueValid(qtyUomSelected) && utility.isValueValid(qtyUomSelected[0].unit)
                                    && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")){
                                    unitSelected = qtyUomSelected[0].unit;
                                    transactionDetailsArray.selectedConversionRateForTallyScan = qtyUomSelected[0].conversionrate;
                                }
                                if(randomTallyScanRule == 'T' ){
                                        transactionDetailsArray.barcodeQuantity = [{
                                            'value': barcodeQty,
                                            'unit': ""
                                        }];
                                }
                                else {
                                    transactionDetailsArray.barcodeQuantity = [{
                                        'value': barcodeQty,
                                        'unit': unitSelected
                                    }];
                                }
                                if(skipBtn != 'Skip' && skipBtn != 'Done'){
                                    if(transactionDetailsArray.remainingQuantity){
                                        transactionDetailsArray.remainingQuantityForTallyScanLoop = transactionDetailsArray.remainingQuantity;
                                        if(utility.isValueValid(transactionUomConversionRate)){

                                            transactionDetailsArray.remainingQuantityForTallyScanLoop =	 Number(Big(transactionDetailsArray.remainingQuantity).mul(transactionUomConversionRate));
                                        }
                                    }


                                    transactionDetailsArray.isSamePageNavigationRequired =  false;
                                    if(parseFloat(transactionDetailsArray.remainingQuantityForTallyScanLoop) >= 1){
                                        transactionDetailsArray.isSamePageNavigationRequired =  true;
                                    }
                                   // transactionDetailsArray.barcodeQuantity  = [{'value': barcodeQty, 'unit': unitSelected}];

                                    transactionDetailsArray.lotName = LotName;
                                    transactionDetailsArray.navigatetoLotScreen = 'no';

                                    var itemInternalID = transactionDetailsArray.internalid;
                                    var lotName1 = LotName;
                                    var lotExpiryDate1 = lotExpiryDate;
                                    var	qty = 1;
                                    var inventoryStatusId =selectedStatusId;
                                    if(randomTallyScanRule == 'T') {
                                        if(itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"
                                           && itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"
                                            && itemType != "inventoryitem" && itemType != "assemblyitem"){
                                            inventoryStatusId = "";

                                        }
                                        if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                            itemInternalID = itemInternalId;
                                        }
                                        var openTaskIdFromTallyLoopObj = "";
                                        var key = '';
                                        if (LotName != undefined && LotName != '' && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
                                            key = LotName + '_' + shipmentNumber + (inventoryStatusFeature ? '_' + inventoryStatusId : '') + "^" + itemInternalId + "^" + transactionDetailsArray.shipmentLineNo;
                                        } else {
                                            key = shipmentNumber + (inventoryStatusFeature ? '_' + inventoryStatusId : '') + "^" + itemInternalId + "^" + transactionDetailsArray.shipmentLineNo;
                                        }
                                        var tallyscanQty = 0;
                                        var quantityWithConvRate = 1;
                                        log.debug("transactionDetailsArray",transactionDetailsArray);
                                        log.debug("@@@@@@@KEY",key);
                                        if (utility.isValueValid(tallyLoopObj[key])) {
                                            openTaskIdFromTallyLoopObj = tallyLoopObj[key].openTaskId;
                                            if(itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {

                                                if(utility.isValueValid(transactionDetailsArray.poRemainingQty)) {
                                                    var lineItemRemQty = Number(Big(transactionDetailsArray.poRemainingQty).minus(tallyLoopObj[key].quantity));
                                                    log.debug("lineItemRemQty", lineItemRemQty);
                                                    if (lineItemRemQty > 0 && lineItemRemQty < 1) {
                                                        var baseUnitConversionRate = 1;
                                                        if (utility.isValueValid(transactionDetailsArray.unitType)) {
                                                            var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsArray.unitType);
                                                            for (var itr in uomResult) {
                                                                if (uomResult[itr]['uom.baseunit']) {
                                                                    baseUnitConversionRate = uomResult[itr]['uom.conversionrate'];
                                                                    break;
                                                                }
                                                            }
                                                            var transactionQty = Number(Big(baseUnitConversionRate).div(transactionDetailsArray.transactionUomConversionRate));
                                                            tallyscanQty = Number(Big(tallyLoopObj[key].quantity).plus(transactionQty));
                                                            qty = transactionQty;
                                                        }

                                                    } else {
                                                        tallyscanQty = tallyLoopObj[key].quantity + 1;
                                                    }
                                                }
                                                else{
                                                    tallyscanQty = tallyLoopObj[key].quantity + 1;
                                                }
                                            }
                                            else{
                                                tallyscanQty = tallyLoopObj[key].quantity + 1;
                                                if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                                    transactionDetailsArray.transactionUomName =transactionDetailsArray.transcationUomName;
                                                    if (utility.isValueValid(transactionDetailsArray.unitType)) {
                                                        var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsArray.unitType);

                                                        for (var itr in uomResult) {
                                                            if (uomResult[itr]['uom.baseunit']) {
                                                                if (uomResult[itr]['uom.internalid'] != transactionDetailsArray.transcationUomInternalId) {
                                                                    var qtyWithConvRate = Number(Big(quantityWithConvRate).div(transactionDetailsArray.transactionUomConversionRate));
                                                                    tallyscanQty = Number(Big(tallyLoopObj[key].quantity).plus(qtyWithConvRate));
                                                                    qty = qtyWithConvRate;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        else{
                                            var lot = "";
										                    var scannedLotArr =[];
                                            if(itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"){
                                                lot = LotName;
											                	for (var obj in tallyLoopObj) {
												              	if (transactionDetailsArray.shipmentLineNo == tallyLoopObj[obj].line) {
													            	scannedLotArr.push(tallyLoopObj[obj].lotName);
												                	}
											                	}
                                            }
                                            openTaskIdFromTallyLoopObj = _getOpenTask(purchaseorderInternalId,transactionDetailsArray.shipmentLineNo,
                                                inventoryStatusFeature,inventoryStatusId,locUseBinsFlag,lot,scannedLotArr);
                                            tallyscanQty = 1;
                                            if(itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"
                                                && itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"
                                                && itemType != "inventoryitem" && itemType != "assemblyitem"){
                                                openTaskIdFromTallyLoopObj = "";
                                            }
                                            if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                                transactionDetailsArray.transactionUomName =transactionDetailsArray.transcationUomName;
                                                if (utility.isValueValid(transactionDetailsArray.unitType)) {
                                                    var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsArray.unitType);

                                                    for (var itr in uomResult) {
                                                        if (uomResult[itr]['uom.baseunit']) {
                                                            if (uomResult[itr]['uom.internalid'] != transactionDetailsArray.transcationUomInternalId) {
                                                                quantityWithConvRate = Number(Big(quantityWithConvRate).div(transactionDetailsArray.transactionUomConversionRate));
                                                                tallyscanQty = quantityWithConvRate;
                                                                qty = tallyscanQty;
                                                                break;
                                                            }
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                        log.debug('transaction UOM text',transactionDetailsArray.transactionUomName);
                                        var objOpentaskDetails = {};
                                        if (!utility.isValueValid(openTaskIdFromTallyLoopObj)) {
                                            objOpentaskDetails = {
                                                "poInternalId": transactionDetailsArray.poId,
                                                "FetchedItemId": itemInternalId,
                                                "poLineno": transactionDetailsArray.shipmentLineNo,
                                                "enterQty": quantityWithConvRate,
                                                "itemType": itemType,
                                                "whLocation": warehouseLocationId,
                                                "poname": transactionDetailsArray.shipmentLineNo,
                                                "PutStrategy": "",
                                                "zoneno": "",
                                                "taskType": "3",
                                                "trantype": transactionType,
                                                "actualBeginTime": "",
                                                "uom": transactionDetailsArray.transactionUomName,
                                                "conversionRate": transactionDetailsArray.transactionUomConversionRate,
                                                "vInvStatus_select": inventoryStatusId,
                                                "expectedQty": quantityWithConvRate,
                                                "lotNo": LotName,
                                                "expiryDate": lotExpiryDate,
                                                "shipmentId": shipmentId,
                                                "randomTallyscan": "T"
                                            }
                                            var recomendedBinId = '';
                                            var recomendedBinName = '';
                                            if (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == true) {
                                                var itemInputObj = {};
                                                itemInputObj.itemId = itemInternalID;
                                                itemInputObj.whLocation = warehouseLocationId;
                                                itemInputObj.itemType = itemType;
                                                itemInputObj.lotName = LotName;
                                                itemInputObj.fromStatusId = inventoryStatusId;

                                                var binObject = inboundUtility.getRecommendedBinForCartMoves(itemInputObj);
                                                if (JSON.stringify(binObject) != '{}') {
                                                    recomendedBinId = binObject.recomendedBinId;
                                                    recomendedBinName = binObject.recomendedBinName;
                                                    objOpentaskDetails.enterBin = recomendedBinId;
                                                    objOpentaskDetails.recomendedBinSequenceNo = binObject.recomendedBinSequenceNo;
                                                }
                                            }
                                        }

                                        transactionDetailsArray.openTaskId = inboundUtility.createOrUpdateOpentask(openTaskIdFromTallyLoopObj, tallyscanQty, objOpentaskDetails, warehouseLocationId);
                                        if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                            if (utility.isValueValid(transactionDetailsArray.openTaskId) > 0 && randomTallyScanRule == 'T' && serialArrFromSerialEntry.length > 0) {
                                                inboundUtility.updateOpentaskFields(transactionDetailsArray.openTaskId, '', serialArrFromSerialEntry);

                                            }
                                        }

                                        if (itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem") {
                                            lotName1 = "";
                                            lotExpiryDate1 = "";
                                        }
                                    }
                                    log.debug("itemType", itemType);


                                    transactionDetailsArray.tallyLoopObj =  tallyScanUtility.createOrUpdateTallyScanJSONObject(tallyLoopObj, '', lotName1, qty , inventoryStatusId,
                                        shipmentNumber,lotExpiryDate1,transactionDetailsArray.itemInternalId,transactionDetailsArray.shipmentLineNo,
                                        transactionDetailsArray.itemName,recomendedBinName,recomendedBinId,transactionDetailsArray.openTaskId,transactionDetailsArray.selectedConversionRateForTallyScan,randomTallyScanRule,transactionDetailsArray.poId);
                                }


                                scannedQuantity = selectedConversionRate;
                            }



                            if(randomTallyScanRule != 'T') {
                                transactionDetailsArray.poname = requestParams.poname;
                            }
                            if (itemType == 'noninventoryitem' || itemType == 'otherchargeitem' ||
                                itemType == 'serviceitem' || itemType == 'downloaditem' || itemType == 'giftcertificateitem' ||
                                (utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == false && ((isInventoryOrLotItem == true) ||(isTallyScanRequired == true)
                                )) && transactionDetailsArray.isValid != false) {
                                log.debug({title: 'into Nobins function', details: itemType});
                                transactionDetailsArray.isBinScanRequired = false;
                                if(!utility.isValueValid(randomTallyScanRule) || randomTallyScanRule == 'F'){
                                    backBtnVisibility = false;
                                }
                                if(!utility.isValueValid(isTallyScanRequired) || isTallyScanRequired == false ||
                                    (isTallyScanRequired == true &&
                                        (transactionDetailsArray.remainingQuantity == 0 && backBtnVisibility == false)
                                        || skipBtn == 'Skip' && backBtnVisibility == false) ){

                                    if(isTallyScanRequired == true){

                                        if(skipBtn == 'Skip'){
                                            noStockQty=noStockQty-1;
                                        }
                                        if(utility.isValueValid(transactionDetailsArray.selectedConversionRateForTallyScan)){
                                            noStockQty = Number(Big(noStockQty).mul(transactionDetailsArray.selectedConversionRateForTallyScan));
                                            noStockQty =  Number(Big(noStockQty).div(transactionUomConversionRate));
                                        }
                                        scannedQuantity	=noStockQty;
                                    }
                                    log.debug({title: 'in Nobins scannedQuantity', details: scannedQuantity});
                                    // Below code is to receive the ISM for non inventory
                                    // items and useBins false feature.
                                    var isLineHasRemainingQty =false;
                                    if (isTallyScanRequired == true && randomTallyScanRule == 'T'){
                                        isLineHasRemainingQty =true;
                                    }else {
                                        isLineHasRemainingQty = this._checkforISMLineRemainingQty(shipmentId, itemInternalId, warehouseLocationId, shipmentLineNo, scannedQuantity);
                                    }
                                    log.debug({title: 'in Nobins isLineHasRemainingQty', details: isLineHasRemainingQty});
                                    if (isLineHasRemainingQty) {
                                        if(randomTallyScanRule =='T') {
                                            this.createLotInfoInSerialEntry(shipmentNumber,shipmentId,warehouseLocationId,poInternald,tallyLoopObj);
                                        }
                                        else{
                                            if ((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && locUseBinsFlag == false ) {
                                                log.debug({title: 'in Nobins isTallyScanRequired', details: isTallyScanRequired});

                                                if (lotJSONobj || (isTallyScanRequired == true))  {
                                                    log.debug({title: 'in Nobins for LotItem tallyLoopObj', details: tallyLoopObj});
                                                    this._createScannedLotInfoInSerialEntryCustomRecord(shipmentNumber, warehouseLocationId,
                                                        itemInternalId, poInternald, shipmentId, shipmentLineNo, LotName, scannedQuantity, requestParams.invStatus, lotExpiryDate);
                                                }
                                            }
                                        }

                                        var	manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
                                        log.debug({title: 'manuallyPostIRSystemRuleValue',details:manuallyPostIRSystemRuleValue});

                                        var poId = requestParams.purchaseorderInternalId;
                                        var invStatusId = requestParams.invStatus;
                                        var shipmentReceiptId = '';
                                        log.debug({title: 'poId',details:poId});
                                        log.debug({title: 'invStatusId',details:invStatusId});
                                        if (isTallyScanRequired == true && randomTallyScanRule == 'T' && manuallyPostIRSystemRuleValue == 'N') {

                                            var openTaskDtls = inboundUtility.getOpenTaskShipmentDetails(shipmentInternalNumber, warehouseLocationId,randomTallyScanRule);
                                            log.debug({title: 'openTaskDtls',details:openTaskDtls});
                                            var openTaskQtyDetails = inboundUtility.getQtyDetailsFromOpenTask(shipmentInternalNumber, warehouseLocationId,'',randomTallyScanRule);
                                            log.debug({title: 'openTaskQtyDetails',details:openTaskQtyDetails});
                                            shipmentReceiptId = inboundUtility.postItemReceiptISM(shipmentInternalNumber, warehouseLocationId, openTaskDtls, openTaskQtyDetails,'',randomTallyScanRule);
                                            if(shipmentReceiptId){
                                                var openTaskIdarray = this.updateOpenTaskWithShipmentReceiptId(openTaskDtls, shipmentInternalNumber);
                                            }
                                        }
                                        else if (randomTallyScanRule != 'T')
                                        {
                                            if (manuallyPostIRSystemRuleValue == 'N') {

                                                shipmentReceiptId = inboundUtility.receiveISM(shipmentInternalNumber, warehouseLocationId, '', shipmentLineNumber, scannedQuantity, poId,
                                                    itemType, invStatusId, isTallyScanRequired, tallyLoopObj, transactionDetailsArray.selectedConversionRateForTallyScan, requestParams.transactionUomConversionRate);
                                            }
                                            transactionDetailsArray.systemRuleValue = manuallyPostIRSystemRuleValue;
                                            log.debug({title: 'systemRuleValue', details: manuallyPostIRSystemRuleValue});

                                            if (manuallyPostIRSystemRuleValue == 'Y' || utility.isValueValid(shipmentReceiptId)) {
                                                var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentInternalNumber, '', warehouseLocationId);
                                                log.debug({title: 'shipmentListDetails', details: shipmentListDetails});

                                                var itemId = requestParams.itemInternalId;
                                                var itemType1 = requestParams.itemType;
                                                var poName = requestParams.poname;
                                                var unit = requestParams.transactionUomName;
                                                var unitConversionRate = requestParams.transactionUomConversionRate;
                                                var strBarCode1 = requestParams.strBarCode;
                                                var exptdQty = requestParams.expectedQuantity;
                                                log.debug({title: 'unit', details: unit});
                                                if (isTallyScanRequired == true) {
                                                    if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
                                                        if (utility.isValueValid(unitConversionRate)) {
                                                            exptdQty = Number(Big(exptdQty).div(transactionUomConversionRate));
                                                            scannedQuantity = Number(Big(scannedQuantity).div(transactionUomConversionRate));
                                                        }
                                                    }
                                                }
                                                var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams, manuallyPostIRSystemRuleValue, '', '', shipmentLineNumber,
                                                    scannedQuantity, warehouseLocationId, shipmentReceiptId, itemId, itemType1, poId, poName, unit, unitConversionRate, strBarCode1,
                                                    invStatusId, exptdQty, shipmentInternalNumber, LotName, lotExpiryDate, null, null, isTallyScanRequired, tallyLoopObj);
                                                log.debug({title: 'opetaskParamsObj', details: opetaskParamsObj});
                                                var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
                                                openTaskIdarray.push(openTaskId);
                                                transactionDetailsArray.openTaskId = openTaskId;
                                            }
                                        }
                                        log.debug('transactionDetailsArray.selectedStatusName second', transactionDetailsArray.selectedStatusName);
                                        transactionDetailsArray.selectedStatusName = selectedStatusName;
                                        transactionDetailsArray.selectedStatusId = selectedStatusId;
                                        transactionDetailsArray.shipmentReceiptId = shipmentReceiptId;

                                        if (!isNavigationToLotScreenRequired) {
                                            var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentInternalNumber, '', warehouseLocationId);
                                            var qtyRemainLinesCountForRecving = inboundUtility.checkCountforRemaining(shipmentListDetails, shipmentReceiptId, warehouseLocationId);
                                            var remainingItemsCount = qtyRemainLinesCountForRecving;
                                            transactionDetailsArray.vCount = remainingItemsCount;
                                            if (parseFloat(remainingItemsCount) > 0) {
                                                transactionDetailsArray.imageUrl = '';
                                                transactionDetailsArray.incoterm = '';
                                                transactionDetailsArray.itemName = '';
                                                transactionDetailsArray.poname = '';
                                                transactionDetailsArray.lotString = '';
                                                log.debug('transactionDetailsArray.selectedStatusName  when not of isNavigationToLotScreenRequired', transactionDetailsArray.selectedStatusName);
                                                transactionDetailsArray.selectedStatusName = '';
                                                transactionDetailsArray.lotName = '';
                                            }
                                        } else {
                                            transactionDetailsArray.imageUrl = imageUrl;
                                            transactionDetailsArray.incoterm = incoTerm;
                                            if(randomTallyScanRule != 'T') {
                                            transactionDetailsArray.itemName = itemName;
                                                transactionDetailsArray.poname = poName;
                                            }
                                            transactionDetailsArray.lotString = lotString;
                                            transactionDetailsArray.lotName = LotName;
                                        }


                                        transactionDetailsArray.manuallyPostIRSystemRuleValue = manuallyPostIRSystemRuleValue;
                                        transactionDetailsArray.isMapReduceScriptInvoked = 'F';
                                        transactionDetailsArray.isValid = true;
                                        var inputParamObj = {};
                                        inputParamObj.poInternald = poInternald;
                                        inputParamObj.shipmentId = shipmentId;
                                        inputParamObj.openTaskIdarray = openTaskIdarray;
                                        inputParamObj.poName = poName;
                                        inputParamObj.warehouseLocationId = warehouseLocationId;
                                        inputParamObj.shipmentReceiptId = shipmentReceiptId;
                                        inputParamObj._ignoreUpdate = false;
                                        impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
                                        log.debug({title: 'impactedRecords :', details: impactedRecords});




                                    } else {
                                        transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.TRANSACTION_COMPLETED');
                                        transactionDetailsArray.isValid = false;
                                    }
                                }
                                else if(randomTallyScanRule == 'T' && ((backBtnVisibility == true && transactionDetailsArray.remainingQuantity == 0)
                                    || btnClicked == 'Skip' )){
                                    transactionDetailsArray.isBinScanRequired = true;
                                    transactionDetailsArray.isSamePageNavigationRequired = false;
                                   

                                    var binScanRequire =this. _checkIsAnyInventoryItemRecevied(shipmentId,locUseBinsFlag);
                                    log.debug("binScanRequire",binScanRequire);
                                    if(binScanRequire == true) {
                                        if (itemType == 'noninventoryitem' || itemType == 'otherchargeitem' &&
                                            itemType == 'serviceitem' || itemType == 'downloaditem' || itemType == 'giftcertificateitem') {
                                            transactionDetailsArray.scannedQuantity = scannedQuantity;
                                            transactionDetailsArray.tallyLoopObj =tallyLoopObj;
                                        }
                                        if(locUseBinsFlag == false){
                                            transactionDetailsArray.vCount	= 1;
                                        }else {
                                        transactionDetailsArray.isBinScanReq = true;
                                        }
                                        log.debug("FINAL RETURN",transactionDetailsArray);
                                    }
                                    else{
                                        transactionDetailsArray.vCount	= 1;
                                    }
                                    }
                            }
                            else {
                                transactionDetailsArray.imageUrl = imageUrl;
                                transactionDetailsArray.incoterm = incoTerm;

                                transactionDetailsArray.lotString = lotString;
                                if(randomTallyScanRule != 'T') {
                                    transactionDetailsArray.itemName = itemName;
                                    transactionDetailsArray.poname = requestParams.poname;
                                }
                                transactionDetailsArray.lotName = LotName;
                            }
                            if(utility.isValueValid(selectedStatusName) && (isTallyScanRequired == true))
                            {
                                transactionDetailsArray.defaultInventoryStatus = selectedStatusName;
                            }
                            transactionDetailsArray.impactedRecords = impactedRecords;
                        }
                    }
                    else {
                        transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
                        transactionDetailsArray.isValid = false;
                    }
                }
                else {
                    transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
                    transactionDetailsArray.isValid = false;
                }
            } catch (e) {
                transactionDetailsArray.isValid = false;
                transactionDetailsArray.errorMessage = e.message;
                log.error({title: 'errorMessage', details: e.message + ' Stack :' + e.stack});
                log.error({title: 'debugString', details: debugString});
            }
            if(isTallyScanRequired && utility.isValueValid(requestParams.tallyScanItem) && randomTallyScanRule != 'T') {
                transactionDetailsArray.tallyScanBarcodeSerialname = "";
            }
            return transactionDetailsArray;
        }

        function _checkforISMLineRemainingQty(shipmentInternalId, itemID, wareHouseLocID, shipmentLineNo, scannedQty) {
            var _isLineHasRemainingQty = false;

            var itemISMDetlsObj = inboundUtility.validateItemAgainstShipment(shipmentInternalId, itemID, wareHouseLocID);
            log.debug({title: 'itemISMDetlsObj', details: itemISMDetlsObj});
            log.debug({title: 'scannedQty', details: scannedQty});
            if (itemISMDetlsObj.length > 0) {
                var _shipmentLineNo = '';
                var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentInternalId, '', wareHouseLocID);
                log.debug({title: 'openPutAwayDetails', details: openPutAwayDetails});
                for (var itemIndex = 0; itemIndex < itemISMDetlsObj.length; itemIndex++) {
                    _shipmentLineNo = itemISMDetlsObj[itemIndex].inboundshipmentitemid;

                    if (shipmentLineNo == _shipmentLineNo) {
                        var lineRemainingQty = itemISMDetlsObj[itemIndex].quantityremaining;
                        log.debug({title: 'lineRemainingQty', details: lineRemainingQty});
                        if (parseFloat(lineRemainingQty) > 0) {
                            if (JSON.stringify(openPutAwayDetails) !== '{}') {
                                var lineItemOpentaskRcvQty = openPutAwayDetails[shipmentLineNo];
                                log.debug({title: 'lineItemOpentaskRcvQty', details: lineItemOpentaskRcvQty});
                                if (utility.isValueValid(lineItemOpentaskRcvQty)) {
                                    lineRemainingQty = Number(Big(parseInt(lineRemainingQty)).minus(lineItemOpentaskRcvQty));
                                    log.debug({title: 'lineRemainingQty', details: lineRemainingQty});
                                    if (parseFloat(lineRemainingQty) > 0 && parseFloat(scannedQty) <= parseFloat(lineRemainingQty)) {
                                        log.debug({title: '_isLineHasRemainingQty1111', details: _isLineHasRemainingQty});
                                        _isLineHasRemainingQty = true;
                                    }
                                } else {
                                    _isLineHasRemainingQty = true;
                                }
                            } else {
                                _isLineHasRemainingQty = true;
                            }
                        }
                        break;
                    }
                }
            }
            return _isLineHasRemainingQty;

        }

        function _createScannedLotInfoInSerialEntryCustomRecord(shipmentNumber, warehouseLocationId,
                                                                itemInternalId, poInternald, shipmentId, shipmentLineNo, lotName, scannedQty, selectedStatus, lotNoExpiryDate) {
            var createLotISMObj = {};
            createLotISMObj.shipmentNumber = shipmentNumber;
            createLotISMObj.warehouseLocationId = warehouseLocationId;
            createLotISMObj.itemInternalId = itemInternalId;
            createLotISMObj.purchaseorderInternalId = poInternald;
            createLotISMObj.shipmentInternalNumber = shipmentId;
            createLotISMObj.shipmentLineNumber = shipmentLineNo;
            createLotISMObj.scannedQuantity = scannedQty;
            createLotISMObj.LotName = lotName;
            createLotISMObj.inventoryStatusId = selectedStatus;

            if (utility.isValueValid(lotNoExpiryDate)) {
                var lotDate = format.parse({
                    value: lotNoExpiryDate,
                    type: format.Type.DATE
                });
                createLotISMObj.lotExpiryDate = lotDate;
            } else {
                createLotISMObj.lotExpiryDate = '';
            }
            inboundUtility.createLotISMInfoInSerialEntry(createLotISMObj);


        }

        function _createOrUpdateLotJSONObject(lotJSONobject,lotName,scannedQty,selectedStatusText,lotNoExpiryDate,selectedStatusId)
        {
            var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
            var _lotJSONObject = lotJSONobject ? JSON.parse(lotJSONobject) : new Object();
            var key = lotName + (inventoryStatusFeature ? '_' + selectedStatusText : '');
            if (_lotJSONObject[key]) {
                _lotJSONObject[key].quantity = Number(Big(_lotJSONObject[key].quantity).plus(scannedQty));
                if (utility.isValueValid(lotNoExpiryDate)) {
                    _lotJSONObject[key].lotExpiryDate = lotNoExpiryDate;
                }
            } else {
                var obj = {};
                obj.lotName = lotName;
                obj.quantity = scannedQty;
                obj.statusName = selectedStatusText;
                obj.statusId = selectedStatusId;
                if (utility.isValueValid(lotNoExpiryDate)) {
                    obj.lotExpiryDate = lotNoExpiryDate;
                } else {
                    obj.lotExpiryDate = '';
                }

                _lotJSONObject[key] = obj;
            }
            return _lotJSONObject;
        }

        function _getTransactionUomConversionRate(itemInternalId, transactionUomName) {
            var itemLookUp = search.lookupFields({
                type: search.Type.ITEM,
                id: itemInternalId,
                columns: ['unitstype']
            });
            var _transactionUomConversionRate = '';
            if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined) {
                var unitType = itemLookUp.unitstype[0].value;

                var uomValue = '';
                var uomConversionRate = '';
                var uomRecord = record.load({
                    type: record.Type.UNITS_TYPE,
                    id: unitType
                });

                var sublistCount = uomRecord.getLineCount({
                    sublistId: 'uom'
                });
                for (var uomIndx = 0; uomIndx < sublistCount; uomIndx++) {
                    var unitName = uomRecord.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'unitname',
                        line: uomIndx
                    });
                    var pluralName = uomRecord.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'pluralname',
                        line: uomIndx
                    });
                    if (transactionUomName.toUpperCase() == unitName.toUpperCase() ||
                        transactionUomName.toUpperCase() == pluralName.toUpperCase()) {

                        uomValue = uomRecord.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'internalid',
                            line: uomIndx
                        });
                        uomConversionRate = uomRecord.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'conversionrate',
                            line: uomIndx
                        });
                        break;
                    }
                }

                if (uomValue != '') {
                    _transactionUomConversionRate = uomConversionRate;
                }
            }
            return _transactionUomConversionRate;
        }
        function _validateScannedItemAgainstISM(transactionDetailsObj,inventoryStatusFeature,
                                                tallyLoopObj,transactionName,itemId,
                                                warehouseLocationId,transactionInternalId,
                                                transactionType,
                                                itemType,
                                                tallyScanRemainingQty,
                                                transactionUomConversionRate,
                                                invtStatus,
                                                qtyUomSelected,backOrdQty,tallyScanItem,
                                                numberOfTimesSerialScanned,lotName,locationUseBinlFlag,scannedQuantity,
                                                shipmentId,lotScanned,scannedSerialsArray,lotJSONobj){
            var orderLineDetails = inboundUtility.validateItemAgainstShipment(shipmentId,itemId,warehouseLocationId);
            log.debug('orderLineDetails',orderLineDetails);
            if (orderLineDetails.length > 0) {
                if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"
                    && itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"
                    && itemType != "inventoryitem" && itemType != "assemblyitem") {
                    invtStatus = "";
                }
                for (var ordLen = 0; ordLen < orderLineDetails.length; ordLen++) {
                    transactionDetailsObj.isValid = true;

                    var tallyLoopObjTotalQty = 0;
                    if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {

                        for (var obj in tallyLoopObj) {
                            if (orderLineDetails[ordLen].inboundshipmentitemid == tallyLoopObj[obj].line) {
                                tallyLoopObjTotalQty = parseInt(tallyLoopObjTotalQty) + parseInt(tallyLoopObj[obj].quantity);
                            }
                        }
                        if (tallyLoopObjTotalQty == 0 && !utility.isValueValid(lotScanned) &&  !utility.isValueValid(transactionDetailsObj.barcodeLotname)) {
                            transactionDetailsObj.errorMessage = translator.getTranslationString('RANDOMTALLYSCAN_LOTVALIDATION');
                            transactionDetailsObj.isValid = false;
                        }else {
                            log.debug('transactionDetailsObj.barcodeLotExpirydate', transactionDetailsObj.barcodeLotExpirydate);
                            if (utility.isValueValid(transactionDetailsObj.barcodeLotname) && utility.isValueValid(transactionDetailsObj.barcodeLotExpirydate)){
                                var lotExpiryDate = transactionDetailsObj.barcodeLotExpirydate.toString();
                            log.debug('lotExpiryDate', lotExpiryDate);
                            if (lotExpiryDate.indexOf("Invalid") != -1) {
                                transactionDetailsObj.errorMessage = transactionDetailsObj.barcodeLotExpirydate;
                                transactionDetailsObj.isValid = false;
                            }
                        }
                        }

                        tallyLoopObjTotalQty = tallyLoopObjTotalQty + 1;
                    }
                    if (transactionDetailsObj.isValid != false) {
                    var key = transactionName + (inventoryStatusFeature ? '_' + invtStatus : '') + "^" + itemId + "^" + orderLineDetails[ordLen].inboundshipmentitemid;

                    if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && utility.isValueValid(lotName)) {
                        key = lotName + "_" + transactionName + (inventoryStatusFeature ? '_' + invtStatus : '') + "^" + itemId + "^" + orderLineDetails[ordLen].inboundshipmentitemid;
                    }

                        var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId, '', warehouseLocationId, orderLineDetails[ordLen].inboundshipmentitemid);
                        var openTaskQty = 0;
                        var openTaskQtyForSerial = 0;
                        var scanQty = 0;
                        var selectedConversionRate = "";
                        if (utility.isValueValid(orderLineDetails[ordLen].unitText)) {
                            var uomconversionrate = utility.getConversionRate(orderLineDetails[ordLen].unitText, transactionDetailsObj.unitType);
                            transactionDetailsObj.transactionUomConversionRate = uomconversionrate;
                            transactionDetailsObj.transcationUomInternalId = orderLineDetails[ordLen].unit;
                            transactionDetailsObj.transcationUomName = orderLineDetails[ordLen].unitText;
                        } else {
                            transactionDetailsObj.transactionUomConversionRate = "";
                            transactionDetailsObj.transcationUomInternalId = "";
                            transactionDetailsObj.transcationUomName = "";
                        }
                        if (utility.isValueValid(qtyUomSelected) && utility.isValueValid(qtyUomSelected[0].conversionrate) &&
                            utility.isValueValid(transactionDetailsObj.unitType)) {
                            selectedConversionRate = qtyUomSelected[0].conversionrate;
                        }
                        if (JSON.stringify(openPutAwayDetails) != '{}') {
                            openTaskQty = openPutAwayDetails[orderLineDetails[ordLen].inboundshipmentitemid];
                            openTaskQtyForSerial = openTaskQty;
                        }
                        var lineRemainingQuantity = orderLineDetails[ordLen].quantityremaining;
                        var  lineRemQty = 0;
                        if(lineRemainingQuantity > 0){
                            if (utility.isValueValid(transactionDetailsObj.transactionUomConversionRate)) {
                                lineRemainingQuantity = Number(Big(lineRemainingQuantity).div(transactionDetailsObj.transactionUomConversionRate));
                            }
                        }
                        if (parseFloat(openTaskQty) > 0 ) {
                            if (utility.isValueValid(transactionDetailsObj.transactionUomConversionRate)) {
                                openTaskQty = Number(Big(openTaskQty).div(transactionDetailsObj.transactionUomConversionRate));
                            }
                            lineRemQty = Number(Big(lineRemainingQuantity).minus(openTaskQty));

                            if(lineRemQty >= 1) {
                                scanQty = Number(Big(openTaskQty).plus(1));
                            }
                            else{
                                if(lineRemQty >0 && lineRemQty <1){
                                    var baseUnitConversionRate = 1;
                                    var transactionConvertedQty = 1;
                                    if (utility.isValueValid(transactionDetailsObj.unitType)) {
                                        var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsObj.unitType);
                                        for (var itr in uomResult) {
                                            if (uomResult[itr]['uom.baseunit']) {
                                                baseUnitConversionRate = uomResult[itr]['uom.conversionrate'];
                                                break;
                                            }
                                        }
                                       transactionConvertedQty = Number(Big(baseUnitConversionRate).div(transactionDetailsObj.transactionUomConversionRate));
                                        scanQty = Number(Big(openTaskQty).plus(transactionConvertedQty));
                                    }

                                }
                                else{
                                    scanQty = Number(Big(openTaskQty).plus(1));
                                    if (lineRemQty == 0) {
                                        if(itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"){
                                            var lotTotalQty = 0;
                                            for (var obj in tallyLoopObj) {
                                                if (orderLineDetails[ordLen].inboundshipmentitemid == tallyLoopObj[obj].line) {
                                                    lotTotalQty = parseInt(lotTotalQty) + parseInt(tallyLoopObj[obj].quantity);
                                                }
                                            }
                                            if(lotTotalQty == openTaskQty){
                                                scanQty =  Number(Big(lotTotalQty).plus(1));
                                            }
                                            else{//backbtn pressed
                                                scanQty = 1;
                                            }
                                        }
                                        else {
                                            if (tallyLoopObj[key] != undefined) {
                                                var tallyLoopObjectQty = Number(Big(tallyLoopObj[key]['quantity']));
                                                var tallyLoopObjectOpentaskId = tallyLoopObj[key].openTaskId;
                                                if (utility.isValueValid(tallyLoopObjectOpentaskId)) {
                                                    /*var openTaskRecord = record.load({
                                                        type: 'customrecord_wmsse_trn_opentask',
                                                        id: tallyLoopObjectOpentaskId
                                                    });
                                                    openTaskQty = openTaskRecord.getValue({fieldId: 'custrecord_wmsse_act_qty'});*/
													if(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"){
														 scanQty = Number(Big(openTaskQty).plus(1));
													}
                                                }
                                               /* if (tallyLoopObjectQty < openTaskQty) {
                                                    scanQty = Number(Big(tallyLoopObjectQty).plus(1));
                                                }*/
                                            } else {

                                                scanQty = 1;
                                                openTaskQty = 0;

                                            }
                                        }
                                    }
                                }
                            }

                        } else {
                            scanQty = 1;
                            lineRemQty = Number(Big(lineRemainingQuantity).minus(1));
                        }

                            if (utility.isValueValid(transactionDetailsObj.transactionUomConversionRate) && parseFloat(scanQty) > 0) {
                                scanQty = Number(Big(scanQty).mul(transactionDetailsObj.transactionUomConversionRate));
                            }
                       
                        var itemQtyExists = true;
                        if (((parseFloat(scanQty) > parseFloat(orderLineDetails[ordLen].quantityremaining)) ||
                            (parseFloat(tallyLoopObjTotalQty) > parseFloat(orderLineDetails[ordLen].quantityremaining))
                        )) {
                            itemQtyExists = false;
                            if (ordLen == orderLineDetails.length - 1) {
                                transactionDetailsObj.errorMessage = translator.getTranslationString("PO_QUANTITYVALIDATE.OVERAGE_FALSE");
                                transactionDetailsObj.isValid = false;
                            }
                        } else {
                            itemQtyExists = true;
                        }


                        if (transactionDetailsObj.isValid != false && itemQtyExists == true) {
                            {
                                transactionDetailsObj.tallyLoopObj = tallyLoopObj;
                                transactionDetailsObj.showDoneBtn = 'F';
                                transactionDetailsObj.itemName = orderLineDetails[ordLen].itemText;
                                transactionDetailsObj.itemDescription = orderLineDetails[ordLen].salesdescription;
                                transactionDetailsObj.shipmentLineNo = orderLineDetails[ordLen].inboundshipmentitemid;
                                transactionDetailsObj.numberOfTimesSerialScanned = 0;
                                transactionDetailsObj.remainingQuantity = tallyScanRemainingQty;
                                transactionDetailsObj.poname = orderLineDetails[ordLen].purchaseorderText;
                                transactionDetailsObj.transactionLineNo = orderLineDetails[ordLen].inboundshipmentitemid;
                                transactionDetailsObj.backOrderQty = inboundUtility.getBackOrderQty(warehouseLocationId, itemId);
                                transactionDetailsObj.scannedserialsArr = scannedSerialsArray;
                                transactionDetailsObj.transactionUomName=orderLineDetails[ordLen].unitText;
                                transactionDetailsObj.itemScannedQty = scanQty;
                                transactionDetailsObj.lotJSONobj = lotJSONobj;
                                transactionDetailsObj.poId = orderLineDetails[ordLen].purchaseorder;
                                transactionDetailsObj.poInternalId = orderLineDetails[ordLen].purchaseorder;
                                var poLineItemRemainingQty =  orderLineDetails[ordLen].quantityremaining;
                                if(poLineItemRemainingQty > 0){
                                if (utility.isValueValid(transactionDetailsObj.transactionUomConversionRate)) {
                                    poLineItemRemainingQty = Number(Big(poLineItemRemainingQty).div(transactionDetailsObj.transactionUomConversionRate));
                                }
                            }
                                transactionDetailsObj.poRemainingQty = poLineItemRemainingQty;

                                if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
                                    if (utility.isValueValid(transactionDetailsObj.barcodeLotname)) {
                                        transactionDetailsObj.lotName = transactionDetailsObj.barcodeLotname;
                                        transactionDetailsObj.lotScanned = 'T';

                                    } else {
                                        var previousScannedLot = "";
                                        for (var obj in tallyLoopObj) {
                                            if (transactionDetailsObj.transactionLineNo == tallyLoopObj[obj].line) {
                                                previousScannedLot = tallyLoopObj[obj].lotName;
                                            }
                                        }
                                        if (utility.isValueValid(previousScannedLot) && utility.isValueValid(lotName) &&
                                            lotScanned != "T"
                                            && lotName != previousScannedLot) {
                                            transactionDetailsObj.lotName = previousScannedLot;
                                        } else if (utility.isValueValid(lotName)) {
                                            transactionDetailsObj.lotName = lotName;
                                        } else {
                                        }

                                    }
                                } else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
                                    numberOfTimesSerialScanned = 0;
                                    transactionDetailsObj.serialPageNavigationRequiredForTS = 'T';
                                    transactionDetailsObj.numberOfTimesSerialScanned = 0;
                                    transactionDetailsObj.lotName = lotName;
                                    transactionDetailsObj.enteredQtyInEach = orderLineDetails[ordLen]["quantityremaining"];
                                    if (utility.isValueValid(openTaskQtyForSerial) && openTaskQtyForSerial > 0) {
                                        transactionDetailsObj.enteredQtyInEach= parseFloat(orderLineDetails[ordLen]["quantityremaining"])- parseFloat(openTaskQtyForSerial);
                                        
                                    }
                                    transactionDetailsObj.tallyScanBarcodeSerialname = transactionDetailsObj.barcodeSerialname;
                                   // transactionDetailsObj.enteredQtyInEach = orderLineDetails[ordLen]["quantityremaining"];
                                    if (utility.isValueValid(transactionDetailsObj.unitType)) {
                                        var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsObj.unitType);
                                        for (var itr in uomResult) {
                                            if (uomResult[itr]['uom.baseunit']) {
                                                
                                                unitSelected = transactionDetailsObj.transactionUomInternalId;
                                                transactionDetailsObj.uomSelectionforFirstItr = transactionDetailsObj.transactionUomInternalId;
                                                break;
                                            }
                                        }
                                    }
                                    transactionDetailsObj.isValid = true;
                                    transactionDetailsObj.isSamePageNavigationRequired = true;
                                } else {
                                    transactionDetailsObj.isValid = true;
                                }
                                if (transactionDetailsObj.remainingQuantity && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {
                                    var qtyInConvRate = 1;
                                    if (utility.isValueValid(transactionDetailsObj.transactionUomConversionRate)) {
                                        transactionDetailsObj.randomtallyscanUOM = "TRANSACTION UNIT: "+transactionDetailsObj.transcationUomName;

                                        qtyInConvRate = transactionDetailsObj.transactionUomConversionRate;
                                        if(lineRemQty >0 && lineRemQty <1){
                                            var baseUnitConversionRate = 1;
                                            if (utility.isValueValid(transactionDetailsObj.unitType)) {
                                                var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsObj.unitType);
                                                for (var itr in uomResult) {
                                                    if (uomResult[itr]['uom.baseunit']) {
                                                        qtyInConvRate = uomResult[itr]['uom.conversionrate'];
                                                        transactionDetailsObj.randomtallyscanUOM = "BASE UNIT: "+uomResult[itr]['uom.unitname'];
                                                        break;
                                                    }
                                                }
                                            }

                                        }
                                    }
                                   /* if(lineRemQty <= 0 ){
                                        qtyInConvRate = 0;
                                    }*/
                                    transactionDetailsObj.remainingQuantity = parseInt(transactionDetailsObj.remainingQuantity) - parseInt(qtyInConvRate);
                                    transactionDetailsObj.remainingQuantityForTallyScanLoop = transactionDetailsObj.remainingQuantity;

                                }
                                if (locationUseBinlFlag == true && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
                                    transactionDetailsObj.isBinScanRequired = true;
                                    if (transactionDetailsObj.remainingQuantity == 0) {
                                        transactionDetailsObj.binPageNavigationRequired = 'T';
                                    }
                                }

                                var barcodeQty = parseInt(scannedQuantity);
                                if (transactionDetailsObj.serialPageNavigationRequiredForTS != 'T') {
                                    barcodeQty = parseInt(scannedQuantity) + 1;
                                }
                                    transactionDetailsObj.barcodeQuantity = [{
                                        'value': barcodeQty,
                                        'unit': ""
                                    }];

                                var itemLookUp = utility.getItemFieldsByLookup(itemId, []);

                                if (utility.isValueValid(itemLookUp.thumbnailurl)) {
                                    transactionDetailsObj.imageUrl = itemLookUp.thumbnailurl;
                                }
                                if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {
                                    transactionDetailsObj.printFlag = false;
                                    transactionDetailsObj.isLastScanForItem = false;
                                    if ((parseFloat(scanQty)) == (parseFloat(orderLineDetails[ordLen].quantityremaining))) {
                                        transactionDetailsObj.isLastScanForItem = true;
                                        transactionDetailsObj.printFlag = true;
                                        log.debug('INTO FUNCTION', transactionDetailsObj.printFlag);
                                    }
                                }
                                break;


                            }

                            //}
                        }
                    }
                }
            }
            else{
                transactionDetailsObj.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
                transactionDetailsObj.isValid = false;
            }
            log.debug("transactionDetailsObj",transactionDetailsObj);
        }


        function updateOpenTaskWithShipmentReceiptId(openTaskDtls,shipmentReceiptId){
            var openTaskIdArray= [];
            for(var openTaskItr in openTaskDtls){
                record.submitFields({
                    type: 'customrecord_wmsse_trn_opentask',
                    id: openTaskDtls[openTaskItr].internalid,
                    values: { 'custrecord_wmsse_rec_inb_shipment': shipmentReceiptId
                    }
                });
                openTaskIdArray.push(parseInt(openTaskDtls[openTaskItr].internalid));
            }
            return openTaskIdArray;
        }
        function _getOpenTask(orderInternalid,lineno,inventoryStatusFeature,inventoryStatus,locuseBinsFlag,lotName,scannedLotArr) {
            var myOpentaskQuery = query.create({
                type: 'customrecord_wmsse_trn_opentask'
            });
            var tranCond = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_order_no',
                operator: query.Operator.ANY_OF,
                values: orderInternalid
            });
            var tranLineCond = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_line_no',
                operator: query.Operator.ANY_OF,
                values: lineno
            });
            var confirmationRefCondition = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
                operator: query.Operator.EMPTY
            });
            var currentUserID = runtime.getCurrentUser();
            var userIdCondition = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_upd_user_no',
                operator: query.Operator.ANY_OF,
                values: currentUserID.id
            });
            var inbShipRefCondition = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_rec_inb_shipment',
                operator: query.Operator.EMPTY
            });
            myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition,
                tranLineCond,inbShipRefCondition);
            if (utility.isValueValid(locuseBinsFlag) && locuseBinsFlag == true) {
                var actBeginLocCondition = myOpentaskQuery.createCondition({
                    fieldId: 'custrecord_wmsse_actbeginloc',
                    operator: query.Operator.EMPTY
                });
                myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition,
                    tranLineCond,inbShipRefCondition, actBeginLocCondition);
            }

            myOpentaskQuery.columns = [

                myOpentaskQuery.createColumn({
                    fieldId: 'id'
                }),
                myOpentaskQuery.createColumn({
                    fieldId: 'custrecord_wmsse_inventorystatus'
                }),
                myOpentaskQuery.createColumn({
                    fieldId: 'custrecord_wmsse_batch_num'
                })]
            var results = myOpentaskQuery.runPaged({
                pageSize: 1000
            });
            var iterator = results.iterator();
            var opentaskId = "";
          
            iterator.each(function (result) {
                page = result.value;
                pageResults = page.data.results;
                if(inventoryStatusFeature == true){
                    opentaskId = 	_deleteOpenTask(pageResults,inventoryStatus,lotName,scannedLotArr);
                }
                else {
                    for(var rec in pageResults) {
                        if(!utility.isValueValid(lotName) || pageResults[rec].values[2] == lotName) {
                            opentaskId = pageResults[rec].values[0];
                        }
                        else {
                            if (utility.isValueValid(lotName) && scannedLotArr.length>0 && scannedLotArr.indexOf(pageResults[rec].values[2]) == -1) {
                                record.delete({
                                    type: 'customrecord_wmsse_trn_opentask',
                                    id: parseInt(pageResults[rec].values[0])
                                });

                            }
                        }
                    }
                }
                log.debug("opentaskId", opentaskId);
                return true;
            });

            return opentaskId;

        }
        function _deleteOpenTask(pageResults,invtStatus,lotName,scannedLotArray){

            var openTask = "";
            for(var rec in pageResults) {
                if(utility.isValueValid(pageResults[rec].values[1]) && (invtStatus != pageResults[rec].values[1])) {
                    record.delete({
                        type: 'customrecord_wmsse_trn_opentask',
                        id: parseInt(pageResults[rec].values[0])
                    });
                }
                else{
                    if(!utility.isValueValid(lotName) || pageResults[rec].values[2] == lotName) {
                        openTask = pageResults[rec].values[0];
                    }
                    else{
                        if(utility.isValueValid(lotName) && scannedLotArray.length>0 && scannedLotArray.indexOf(pageResults[rec].values[2])==-1){
                            record.delete({
                                type: 'customrecord_wmsse_trn_opentask',
                                id: parseInt(pageResults[rec].values[0])
                            });
                        }
                    }
                }
            }
            return openTask;
        }

        function createLotInfoInSerialEntry(shipmentNumber,shipmentId,warehouseLocationId,poInternald,tallyLoopObj) {

            for(var obj in tallyLoopObj) {
                var tallyObj = tallyLoopObj[obj];
                if (utility.isValueValid(tallyObj.lotName)) {
                    var itemInternalId = tallyObj.itemInternalId;
                    var lotName = tallyObj.lotName;
                   // var lotQuantity = tallyObj.quantity;
                    var invStatusId = tallyObj.statusName;
                    var lotExpiryDate = tallyObj.lotExpiryDate;
                    var shipmentLineNo = tallyObj.line;
                    var selectedConversionRate = tallyObj.selectedConversionRate;
                   var poInternald =tallyObj.transactionInternalId;
                   /* if(!utility.isValueValid(selectedConversionRate))
                    {
                        selectedConversionRate =1;
                    }
                    var lotQuantity = Number(Big(tallyObj.quantity).mul(selectedConversionRate));*/

                    var lotQuantity = tallyObj.quantity;
                    this._createScannedLotInfoInSerialEntryCustomRecord(shipmentNumber, warehouseLocationId,
                        itemInternalId, poInternald, shipmentId, shipmentLineNo, lotName, lotQuantity, invStatusId, lotExpiryDate);
                }

            }
        }

        function getItemAliasResults(itemInternalId,wareHouseLocationId,vendorId,tallyScanItem,transactionDetailsArray,itemAliasObject,transactionLineNo){
            log.debug('getItemAliasResults_itemInternalId',itemInternalId);

            var isGS1Enabled = labelPrintingUtility.checkGS1Enable(wareHouseLocationId);
            log.debug('isGS1Enabled',isGS1Enabled);
            if(utility.isValueValid(itemInternalId) && (utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true))
            {log.debug('ItemAlias Scanned',transactionDetailsArray.isItemAliasScanFlag);
                if (utility.isValueValid(transactionDetailsArray.isItemAliasScanFlag) && transactionDetailsArray.isItemAliasScanFlag)
                {
                    transactionDetailsArray.scannedItemAliasForPrint = tallyScanItem;
                }
                else if(utility.isValueValid(transactionDetailsArray.isbarcodescanned) && transactionDetailsArray.isbarcodescanned &&
                    utility.isValueValid(transactionDetailsArray.barcodeItem)){
                    transactionDetailsArray.scannedItemAliasForPrint = transactionDetailsArray.barcodeItem;
                }
                else {
                    var itemAliasList = labelPrintingUtility.getAllItemAliasResultsForPrint(itemInternalId,vendorId,wareHouseLocationId);
                    log.debug('itemAliasList_itemAliasList',itemAliasList);
                    if (itemAliasList.length > 1) {
                        var key = itemInternalId + '_' + transactionLineNo;
                        log.debug('key',key);
                        if(utility.isValueValid(itemAliasObject) && utility.isValueValid(itemAliasObject[key])
                            && utility.isValueValid(itemAliasObject[key]["selectedItemAlias"])) {
                            log.debug('transactionDetailsArray.itemScannedQty',transactionDetailsArray.itemScannedQty);
                            if(transactionDetailsArray.itemScannedQty >0){
                                itemAliasObject[key]["quantity"] =transactionDetailsArray.itemScannedQty;
                            }
                            transactionDetailsArray.isItemAliasPopupRequired = false;
                        }else{
                            transactionDetailsArray.isItemAliasPopupRequired = true;
                        }
                    }
                }
            }
        }
        function _checkIsAnyInventoryItemRecevied(shipmentId,locuseBinsFlag){
            log.debug('CHECKITEMRECEIPT',shipmentId);
            log.debug('locuseBinsFlag',locuseBinsFlag);
            var myOpentaskQuery = query.create({
                type: 'customrecord_wmsse_trn_opentask'
            });
            var tranCond = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_inbshipment',
                operator: query.Operator.ANY_OF,
                values: shipmentId
            });
            var confirmationRefCondition = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_rec_inb_shipment',
                operator: query.Operator.EMPTY
            });
            var currentUserID = runtime.getCurrentUser();
            var userIdCondition = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_upd_user_no',
                operator: query.Operator.ANY_OF,
                values: currentUserID.id
            });
            var itemtypeCondition = myOpentaskQuery.createCondition({
                fieldId: 'custrecord_wmsse_sku^item.itemtype',
                operator: query.Operator.ANY_OF,
                values:['InvtPart','Assembly']
            });
            myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition,itemtypeCondition);

            if (utility.isValueValid(locuseBinsFlag) && locuseBinsFlag == true) {
                log.debug("locuseBinsFlag@@@@@@", locuseBinsFlag);
                var actBeginLocCondition = myOpentaskQuery.createCondition({
                    fieldId: 'custrecord_wmsse_actbeginloc',
                    operator: query.Operator.EMPTY
                });
                myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition, actBeginLocCondition);

            }
            var invItemsReceived = false;

            myOpentaskQuery.columns = [

                myOpentaskQuery.createColumn({
                    fieldId: 'custrecord_wmsse_sku^item.itemtype'
                })]
            var result = myOpentaskQuery.run().results;

            if(result.length > 0) {
                log.debug('result.length',result.length);
                invItemsReceived = true;
            }
            return invItemsReceived;
        }
        return {
            'post': doPost,
            '_createScannedLotInfoInSerialEntryCustomRecord': _createScannedLotInfoInSerialEntryCustomRecord,
            '_createOrUpdateLotJSONObject': _createOrUpdateLotJSONObject,
            '_checkforISMLineRemainingQty': _checkforISMLineRemainingQty,
            '_getTransactionUomConversionRate': _getTransactionUomConversionRate,
            'updateOpenTaskWithShipmentReceiptId':updateOpenTaskWithShipmentReceiptId,
            'createLotInfoInSerialEntry':createLotInfoInSerialEntry,
            '_validateScannedItemAgainstISM':_validateScannedItemAgainstISM,
            'getItemAliasResults':getItemAliasResults,
            '_checkIsAnyInventoryItemRecevied':_checkIsAnyInventoryItemRecevied
        };
    });
