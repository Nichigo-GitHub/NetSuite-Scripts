/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./big','./wms_workOrderUtility','./wms_tallyScan_utility'],

        function (utility, translator, Big, woUtility, tallyScanUtility) {

    function doPost(requestBody) {

        var orderDetails={};

        var debugString = '';
        var requestParams = '';

        try{
            log.debug({title:'doPost:start',details: requestBody});
            if(utility.isValueValid(requestBody)){
                log.debug({title:'requestBody valid',details:requestBody});	
                   requestParams = requestBody.params;
                log.debug({title:'requestParams parsed', details: requestParams});
                var whLocation = requestParams.warehouseLocationId;
                var transactionName = requestParams.transactionName;
                var transactionType = requestParams.transactionType;
                var itemInternalId = requestParams.itemInternalId;
                var componentItemType = requestParams.itemType;
                var transactionLineNo = requestParams.transactionLineNo;
                var transactionInternalId = requestParams.transactionInternalId;
                var locUseBinsFlag = requestParams.locUseBinsFlag;
                var processNameFromState = requestParams.processNameFromState;
                var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;
                var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;
                var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;
                var binInternalIdArr = [];
                log.debug('parsed variables', { whLocation: whLocation, transactionName: transactionName, transactionType: transactionType, itemInternalId: itemInternalId, transactionLineNo: transactionLineNo, transactionInternalId: transactionInternalId });

                if(utility.isValueValid(whLocation) && utility.isValueValid(itemInternalId) && utility.isValueValid(transactionInternalId)
                        && utility.isValueValid(transactionLineNo) && utility.isValueValid(transactionName) )
                { 
                    log.debug('required params present, proceeding validation');
                    workorderOverpickingFlag = workorderOverpickingFlag || false;
                    if(!utility.isValueValid(locUseBinsFlag))
                    {
                        locUseBinsFlag =utility.lookupOnLocationForUseBins(whLocation);
                        log.debug('locUseBinsFlag looked up from location', locUseBinsFlag);
                    } else {
                        log.debug('locUseBinsFlag provided', locUseBinsFlag);
                    }
                    var lockError = utility.checkTransactionLock(transactionType,transactionInternalId, transactionLineNo);
                    log.debug({title:'lockError returned',details:lockError});
                    if(utility.isValueValid(lockError)){
                        orderDetails.isValid = false;
                        orderDetails.errorMessage = lockError;
                        log.debug('transaction locked, exiting', orderDetails.errorMessage);
                    } else 
                    { 
                        log.debug('calling woUtility.fnToValidateWO', { transactionName: transactionName, itemInternalId: itemInternalId, transactionLineNo: transactionLineNo, inventoryDetailLotOrSerialId: inventoryDetailLotOrSerialId });
                        var workOrdDtlResults =	woUtility.fnToValidateWO(transactionName,itemInternalId,transactionLineNo,'',inventoryDetailLotOrSerialId);
                        log.debug('fnToValidateWO returned', { length: (workOrdDtlResults && workOrdDtlResults.length), sample: workOrdDtlResults && workOrdDtlResults[0] });

                        if(workOrdDtlResults && workOrdDtlResults.length > 0)
                        {	
                            log.debug('workOrdDtlResults[0] snapshot', workOrdDtlResults[0]);
                            var vwoitemQty= utility.isValueValid(workOrdDtlResults[0].quantity) ? workOrdDtlResults[0].quantity : workOrdDtlResults[0]['Committed Qty'];
                            var vwoitemRcvQty = workOrdDtlResults[0].quantityshiprecv;
                            var qty= workOrdDtlResults[0].quantity;
                            var qtyuom = workOrdDtlResults[0].quantityuom;
                            var units = workOrdDtlResults[0].unitText;
                            log.debug('qty vars', { vwoitemQty: vwoitemQty, vwoitemRcvQty: vwoitemRcvQty, qty: qty, qtyuom: qtyuom, units: units });

                            if(vwoitemQty > 0){
                                vwoitemQty = parseFloat(vwoitemQty)/(parseFloat(qty)/parseFloat(qtyuom));
                                vwoitemRcvQty =  parseFloat(vwoitemRcvQty)/(parseFloat(qty)/parseFloat(qtyuom));
                                log.debug('normalized qtys', { vwoitemQty: vwoitemQty, vwoitemRcvQty: vwoitemRcvQty });
                                var vWoreminqty =0;
                                var opentaskQty =0;
                                if(vwoitemQty == null || vwoitemQty == '')
                                    vwoitemQty=0;
                                if(vwoitemRcvQty==null || vwoitemRcvQty=='')
                                    vwoitemRcvQty=0;

                                if(componentItemType == "NonInvtPart" || componentItemType=="OthCharge" || componentItemType=="Service" ||
                                        componentItemType=="DwnLdItem" || componentItemType=="GiftCert" || componentItemType=="noninventoryitem")
                                {
                                    vWoreminqty = parseFloat(vwoitemQty);
                                    log.debug('non-inventory item type, vWoreminqty set', vWoreminqty);
                                }
                                else
                                {
                                    vWoreminqty = utility.isValueValid(workOrdDtlResults[0].Quantity) ? parseFloat(vwoitemQty): Number(Big(vwoitemQty).plus(vwoitemRcvQty));
                                    log.debug('inventory item type, vWoreminqty computed', vWoreminqty);
                                }
                                orderDetails.transactionquantity = parseFloat(vWoreminqty.toFixed(8));
                                log.debug('transactionquantity set', orderDetails.transactionquantity);

                                if(vWoreminqty>0)
                                { 
                                    var selectedConversionRate =''; 
                                    var objItemDtl ={};
                                    log.debug('fetching opentask pick qty details', { transactionInternalId: transactionInternalId, itemInternalId: itemInternalId, transactionLineNo: transactionLineNo });
                                    var opentaskDetails= woUtility.getOpentaskPickQtyDetails(transactionInternalId,itemInternalId,transactionLineNo);
                                    log.debug('opentaskDetails returned', { length: (opentaskDetails && opentaskDetails.length), sample: opentaskDetails && opentaskDetails[0]});

                                    if(opentaskDetails && opentaskDetails.length > 0){
                                        log.debug('fetching opentask qty with inventory numbers');
                                        var woPickQtyResultswithInventoryNumber = woUtility.getOpentaskQtyWithInventoryNumber(transactionInternalId,itemInternalId,transactionLineNo);
                                        log.debug('woPickQtyResultswithInventoryNumber returned', { length: (woPickQtyResultswithInventoryNumber && woPickQtyResultswithInventoryNumber.length) });
                                        woUtility.updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber,objItemDtl);
                                        log.debug('updateOpentaskQtyForInvNumber called, objItemDtl snapshot', objItemDtl);
                                        if(utility.isValueValid(inventoryDetailLotOrSerialText)){
                                           var objLinedata = objItemDtl[itemInternalId];
                                           var qtyObj = objLinedata && objLinedata[transactionLineNo];
                                           opentaskQty = qtyObj ? (utility.isValueValid(qtyObj[inventoryDetailLotOrSerialText]) ? qtyObj[inventoryDetailLotOrSerialText] : 0) : 0;
                                           log.debug('computed opentaskQty from inventory number', opentaskQty);
                                        }else{
                                            opentaskQty = opentaskDetails[0].custrecord_wmsse_act_qty;
                                            log.debug('opentaskQty from opentaskDetails', opentaskQty);
                                       }
                                    } else {
                                        log.debug('no opentaskDetails found, opentaskQty remains 0');
                                    }
                                    
                                    log.debug('opentaskQty before subtracting', opentaskQty);
                                    vWoreminqty = Number(Big(vWoreminqty).minus(opentaskQty));
                                    log.debug('vWoreminqty after subtracting opentaskQty', vWoreminqty);
                                    
                                    if((vWoreminqty > 0) ||((vWoreminqty<0 || vWoreminqty ==0 ) && (workorderOverpickingFlag)))
                                    {
                                        orderDetails.transactionName = transactionName;	
                                        orderDetails.transactionInternalId = workOrdDtlResults[0].internalid;
                                        orderDetails.transactionLineNo  = transactionLineNo;
                                        orderDetails.itemInternalId = itemInternalId;
                                        orderDetails.itemType  = utility.getItemType(itemInternalId);
                                        orderDetails.transactionType  = transactionType;
                                        if(vWoreminqty<0)
                                        {
                                            orderDetails.remainingQuantity = 0;
                                        }
                                        else {
                                            orderDetails.remainingQuantity  = parseFloat(vWoreminqty.toFixed(8));
                                        }
                                        orderDetails.transactionUomName = units;
                                        orderDetails.isInventoryTypeItem = woUtility.isInventoryTypeItem(orderDetails.itemType);

                                        log.debug('orderDetails snapshot before lookup', orderDetails);

                                        var columnArray =[];
                                        columnArray.push('name');
                                        columnArray.push('unitstype');
                                        columnArray.push('stockunit');				

                                        var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
                                        log.debug('itemLookUp returned', itemLookUp);
                                        var stockunitText;
                                        if(utility.isValueValid(itemLookUp.unitstype[0])){
                                            orderDetails.unitsType = itemLookUp.unitstype[0].value ;
                                            log.debug('unitsType set from lookup', orderDetails.unitsType);
                                        }

                                        if(!orderDetails.isInventoryTypeItem || locUseBinsFlag == false){
                                            if (itemLookUp.name != undefined)
                                            {
                                                orderDetails.itemName = itemLookUp.name;
                                                log.debug('itemName set from lookup', orderDetails.itemName);
                                            }
                                        }

                                        if(utility.isValueValid(orderDetails.unitsType)){
                                                
                                            var uomObj = woUtility.getUomDetails(orderDetails.unitsType, orderDetails.transactionUomName);
                                            log.debug('uomObj returned', uomObj);
                                            if(utility.isValueValid(uomObj)){
                                                orderDetails.transcationUomInternalId = uomObj.UomInternalId;
                                                orderDetails.transactionUomConversionRate = uomObj.uomConversionRate;
                                                orderDetails.uomList = uomObj.uomList;
                                                orderDetails.uomDefaultStatus = orderDetails.transactionUomName;
                                                log.debug('uom details applied', { transcationUomInternalId: orderDetails.transcationUomInternalId, transactionUomConversionRate: orderDetails.transactionUomConversionRate });
                                            }
                                            log.debug('itemLookUp.stockunit', itemLookUp.stockunit && itemLookUp.stockunit[0]);
                                            if(itemLookUp.stockunit && itemLookUp.stockunit[0]!=null && itemLookUp.stockunit[0]!='' && itemLookUp.stockunit[0]!='undefiend'){
                                                stockunitText=itemLookUp.stockunit[0].text;
                                            }
                                            var stockuomObj = woUtility.getUomDetails(orderDetails.unitsType, stockunitText);
                                            log.debug('stockuomObj returned', stockuomObj);
                                            if(utility.isValueValid(stockuomObj)){
                                                orderDetails.stockUnitInternalId = stockuomObj.UomInternalId;
                                                orderDetails.stockUomConversionRate = stockuomObj.uomConversionRate;
                                                selectedConversionRate = stockuomObj.uomConversionRate;
                                                log.debug('stock UOM conversion rate applied', selectedConversionRate);
                                            }
                                                
                                        }
                                        log.debug({title:'selectedConversionRate',details:selectedConversionRate});	
                                        var isValid =true;
                                        if(locUseBinsFlag !== false)
                                        {
                                            log.debug('calling getRecommendedBinDetails', { itemInternalId: itemInternalId, componentItemType: componentItemType, whLocation: whLocation, vWoreminqty: vWoreminqty });
                                            getRecommendedBinDetails(itemInternalId,componentItemType,whLocation,vWoreminqty,orderDetails,
                                                    binInternalIdArr,orderDetails.itemType,inventoryDetailLotOrSerialId,inventoryDetailLotOrSerialText);
                                            log.debug('getRecommendedBinDetails returned', orderDetails);
                                            if(utility.isValueValid(inventoryDetailLotOrSerialId) && (workorderOverpickingFlag)){
                                                if(!utility.isValueValid(orderDetails.recommendedBinQty))
                                                {
                                                    isValid =false;
                                                    log.debug('inventory detail present and no recommendedBinQty -> invalid');
                                                }
                                            }
                                        } else {
                                            log.debug('locUseBinsFlag is false, skipping recommended bin lookup');
                                        }
                                        if(isValid != false) {
                                            //tally scan starts here
                                            orderDetails.availbleQuanity = orderDetails.remainingQuantity;
                                            orderDetails.processNameFromState = processNameFromState;
                                            orderDetails.unitType = orderDetails.unitsType;
                                            orderDetails.transactionuomId = orderDetails.transcationUomInternalId;
                                            orderDetails.getStockConversionRate = orderDetails.transactionUomConversionRate;
                                            orderDetails.transactionUomName = orderDetails.transactionUomName;
                                            orderDetails.warehouseLocationId = whLocation;
                                            orderDetails.inventoryDetailLotOrSerialId = inventoryDetailLotOrSerialId;
                                            orderDetails.inventoryDetailLotOrSerialText = inventoryDetailLotOrSerialText;

                                            log.debug('orderDetails to tallyscan',orderDetails);
                                            orderDetails = tallyScanUtility.isTallyScanEnabled(orderDetails,'');
                                            log.debug('after tallyScanUtility.isTallyScanEnabled', orderDetails);
                                            orderDetails.transactionUomName = units;

                                            orderDetails.isValid = true;
                                            log.debug('marking orderDetails isValid true');
                                        }
                                        else
                                        {
                                            orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INSUFFICIENT_INVENTORY');
                                            orderDetails.isValid=false;
                                            log.debug('Insufficient inventory branch', orderDetails.errorMessage);
                                        }
                                    }
                                    else
                                    {
                                        orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.ITEM_PICKED');
                                        orderDetails.isValid=false;
                                        log.debug('Item already picked branch', orderDetails.errorMessage);
                                    }
                                }
                                else
                                {
                                    orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.ITEM_BACKORDER');
                                    orderDetails.isValid=false;
                                    log.debug('vWoreminqty not > 0 branch', orderDetails.errorMessage);
                                }
                            }else
                            {
                                orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.ITEM_BACKORDER');
                                orderDetails.isValid=false;
                                log.debug('vwoitemQty <= 0 branch', orderDetails.errorMessage);
                            }

                        }
                        else{
                            orderDetails.isValid=false;	
                            log.debug('workOrdDtlResults empty branch, marking invalid');
                        }			
                    }			
                }
                else{
                    orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
                    orderDetails.isValid=false;
                    log.debug('missing required params branch', { whLocation: whLocation, itemInternalId: itemInternalId, transactionInternalId: transactionInternalId, transactionLineNo: transactionLineNo, transactionName: transactionName });
                }
            }else{
                orderDetails.isValid=false;
                log.debug('requestBody invalid branch');
            }

        }catch(e){
            orderDetails.isValid = false;
            orderDetails.errorMessage = e.message;
            log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
            log.error({title:'debugString',details:debugString});
        }
        log.debug('orderDetails--',orderDetails);

        return orderDetails;
    }

    function getRecommendedBinDetails(itemInternalId,componentItemType,whLocation,vWoreminqty,orderDetails,binInternalIdArr,itemType,inventoryDetailLotOrSerialId,inventoryDetailLotOrSerialText)
    {
        log.debug('getRecommendedBinDetails:start', { itemInternalId: itemInternalId, componentItemType: componentItemType, whLocation: whLocation, vWoreminqty: vWoreminqty, inventoryDetailLotOrSerialId: inventoryDetailLotOrSerialId, inventoryDetailLotOrSerialText: inventoryDetailLotOrSerialText });
        var objBinDetails = '';
        var itemStatus = '';
        var binQty = '';
        if(!(utility.nonInventoryItemTypeCheck(componentItemType)))
        {	
            var isInvStatusFeatureEnabled  = utility.isInvStatusFeatureEnabled();
            var itemObjDtl = {};
            itemObjDtl.itemInternalId = itemInternalId;
            itemObjDtl.location = whLocation;
            itemObjDtl.qtyToPick = vWoreminqty;
            itemObjDtl.inventoryNumberId = inventoryDetailLotOrSerialId;
            var transactionUOMInternalId = orderDetails.transcationUomInternalId;
            var transactionUOMConversionrate = orderDetails.transactionUomConversionRate;
            if(utility.isValueValid(transactionUOMInternalId)){
                itemObjDtl.selectedUnitId = transactionUOMInternalId;
            }
            log.debug('calling utility.getRecommendedBins', itemObjDtl);
            objBinDetails=utility.getRecommendedBins(itemObjDtl , 'workorder');
            log.debug('objBinDetails returned', { length: (objBinDetails && objBinDetails.length), sample: objBinDetails && objBinDetails[0] });	

            for(var binIndex=0;binIndex<objBinDetails.length;binIndex++)
            {
                binInternalIdArr.push(objBinDetails[binIndex].bininternalid);
            }
            log.debug('binInternalIdArr populated', binInternalIdArr);

            var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, binInternalIdArr, whLocation,'',
                '','','',itemType,inventoryDetailLotOrSerialText);
            log.debug('openTaskPickBinDtls returned', { length: (openTaskPickBinDtls && openTaskPickBinDtls.length), sample: openTaskPickBinDtls && openTaskPickBinDtls[0] });	
            for(var openTaskIndex=0;openTaskIndex<openTaskPickBinDtls.length;openTaskIndex++)
            {
                var binId = openTaskPickBinDtls[openTaskIndex].custrecord_wmsse_actendloc;
                var quantity = openTaskPickBinDtls[openTaskIndex].actualQuantityInBaseUnits;
                log.debug('processing openTaskPickBinDtls entry', { openTaskIndex: openTaskIndex, binId: binId, quantity: quantity });
                for(var objBinIndex=0;objBinIndex<objBinDetails.length;objBinIndex++)
                {
                    if(objBinDetails[objBinIndex].bininternalid == binId  ){						
                        log.debug('matching bin found in objBinDetails', { objBinIndex: objBinIndex, bininternalid: binId });
                        if(isInvStatusFeatureEnabled){
                            itemStatus = openTaskPickBinDtls[openTaskIndex].custrecord_wmsse_inventorystatusText;
                            if (objBinDetails[objBinIndex].status == itemStatus){ 
                                binQty = objBinDetails[objBinIndex].availableqty;
                                log.debug({title:'binQty before adjust',details:binQty});
                                if(utility.isValueValid(transactionUOMConversionrate))  
                                    quantity = utility.uomConversions(quantity,transactionUOMConversionrate,1);
                                quantity = new Big(quantity);
                                objBinDetails[objBinIndex].availableqty = (new Big(binQty)).minus(quantity)  ;
                                log.debug('adjusted availableqty for status-enabled bin', objBinDetails[objBinIndex].availableqty);
                                if(objBinDetails[objBinIndex].availableqty <= 0){
                                    objBinDetails.splice(objBinIndex,1);
                                    objBinIndex--;
                                    log.debug('removed bin from objBinDetails because availableqty <= 0');
                                }
                            }
                        }else{
                            log.debug({title:'non-status flow, binQty before adjust',details:objBinDetails[objBinIndex].availableqty});
                            binQty = objBinDetails[objBinIndex].availableqty;
                            if(utility.isValueValid(transactionUOMConversionrate))  
                                quantity = utility.uomConversions(quantity,transactionUOMConversionrate,1);
                            quantity = new Big(quantity);
                            objBinDetails[objBinIndex].availableqty = (new Big(binQty)).minus(quantity)  ;
                            log.debug('adjusted availableqty for bin', objBinDetails[objBinIndex].availableqty);
                            if(objBinDetails[objBinIndex].availableqty <= 0){
                                objBinDetails.splice(objBinIndex,1);
                                objBinIndex--;
                                log.debug('removed bin from objBinDetails because availableqty <= 0 (non-status)');
                            }

                        }

                    }
                }
            }
            log.debug({title:'objBinDetails after adjustments',details:objBinDetails});
            if(objBinDetails && objBinDetails.length > 0)
            {
                orderDetails.binInternalId=objBinDetails[0].bininternalid;
                orderDetails.recommendedbin=objBinDetails[0].binnumber;
                if(isInvStatusFeatureEnabled){
                    var totalRecommemdedBinQty = geQuantityOfAllStatusInBin(objBinDetails);
                    orderDetails.recommendedBinQty= totalRecommemdedBinQty;
                    log.debug('recommendedBinQty (all statuses)', orderDetails.recommendedBinQty);
                }
                else{
                    orderDetails.recommendedBinQty= Big(objBinDetails[0].availableqty);
                    log.debug('recommendedBinQty (non-status)', orderDetails.recommendedBinQty);
                }
                orderDetails.itemName=objBinDetails[0].itemName;
                orderDetails.itemInternalId=objBinDetails[0].itemInternalId;
                orderDetails.info_binName=objBinDetails[0].binnumber;
                log.debug('recommended bin assigned to orderDetails', { binInternalId: orderDetails.binInternalId, recommendedbin: orderDetails.recommendedbin });
            } else {
                log.debug('no objBinDetails available to recommend');
            }
        } else {
            log.debug('componentItemType is non-inventory, skipping recommended bin flow', componentItemType);
        }
        log.debug('getRecommendedBinDetails:end', orderDetails);
    }
    function geQuantityOfAllStatusInBin(objBinDetails){
        log.debug('geQuantityOfAllStatusInBin:start', { length: (objBinDetails && objBinDetails.length) });
        var totalQuantity = 0;
        var binInternalId  = objBinDetails[0].bininternalid;
        for(var objBinIndex=0;objBinIndex<objBinDetails.length;objBinIndex++)
        {
            if(binInternalId == objBinDetails[objBinIndex].bininternalid){
                totalQuantity = Number(Big(totalQuantity).plus(objBinDetails[objBinIndex].availableqty));
            }
        }
        if(totalQuantity>0){
            totalQuantity = Big(totalQuantity);
        }
        log.debug('geQuantityOfAllStatusInBin:end', totalQuantity);
        return totalQuantity;
    }
    return{
        'post' : doPost
    }
});