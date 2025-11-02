/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./big','./wms_workOrderUtility_kppi'],

        function (utility,translator,Big,woUtility) {

    function doPost(requestBody) {

        var itemListDetails={};
        var debugString = '';
        var requestParams = '';
        var woItemList = [];
        var inputParamObj = {};
        try{
            log.debug('doPost:start', { requestBody: requestBody });
            if(utility.isValueValid(requestBody)){
                log.debug('requestBody valid');
                requestParams = requestBody.params;
                log.debug('requestParams parsed', requestParams);
                var whLocation = requestParams.warehouseLocationId;
                var transactionName = requestParams.transactionName;
                var transactionType = requestParams.transactionType;	
                var locUseBinsFlag = requestParams.locUseBinsFlag;
                var inventoryDetailLotOrSerialFlag = requestParams.inventoryDetailLotOrSerialFlag;
                var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;

                log.debug('params values', { whLocation: whLocation, transactionName: transactionName, transactionType: transactionType, locUseBinsFlag: locUseBinsFlag, inventoryDetailLotOrSerialFlag: inventoryDetailLotOrSerialFlag, workorderOverpickingFlag: workorderOverpickingFlag });

                var objWOLineDtl = {};
                var objItemDtl = {};
                var objRecommendedPickPathBinDetails=[];
                if(utility.isValueValid(whLocation) && utility.isValueValid(transactionName))
                {	
                    log.debug('whLocation and transactionName validated', { whLocation: whLocation, transactionName: transactionName });
                    workorderOverpickingFlag = workorderOverpickingFlag || false;
                    if(!utility.isValueValid(locUseBinsFlag))
                    {
                        locUseBinsFlag =utility.lookupOnLocationForUseBins(whLocation);
                        log.debug('locUseBinsFlag looked up from location', locUseBinsFlag);
                    }
                    log.debug('locUseBinsFlag', locUseBinsFlag);
                    inputParamObj.whLocation = whLocation;
                    inputParamObj.transactionName = transactionName;
                    inputParamObj.transactionType = transactionType;
                    inputParamObj.inventoryDetailLotOrSerialFlag = inventoryDetailLotOrSerialFlag;
                    log.debug('Calling woUtility.getWOLineItemList with', inputParamObj);
                    var woItemListResults=woUtility.getWOLineItemList(inputParamObj);
                    log.debug('woItemListResults.length', (woItemListResults && woItemListResults.length));

                    if(woItemListResults && woItemListResults.length>0)
                    { 
                        log.debug('Processing woItemListResults entries', { length: woItemListResults.length });
                        var itemIdArr =[];
                        var itemTypeArr=[];
                        var itemIdArrforNonInvItems =[];
                        var lineNumArr =[];
                        var qtyToPickArr =[];
                        var inventoryNumberArr = [];
                        var woInternalId= woItemListResults[0]['internalid'];
                        inputParamObj.woInternalId = woInternalId;
                        log.debug('Determined woInternalId', woInternalId);
                        var objWOStageDtl={};
                        for (var ItemListIndex = 0; ItemListIndex < woItemListResults.length; ItemListIndex++) 
                        {
                            log.debug('iterating woItemListResults', { index: ItemListIndex, row: woItemListResults[ItemListIndex] });
                            // Not showing items which are having use bins false and associated with Workorder location have using bins
                            if(!(locUseBinsFlag == true && woItemListResults[ItemListIndex]['usebins'] == false && 
                            woItemListResults[ItemListIndex]['Type'] == 'InvtPart')){
                                itemIdArr.push(woItemListResults[ItemListIndex]['item']);
                                lineNumArr.push(woItemListResults[ItemListIndex]['line']);
                                if(utility.isValueValid(woItemListResults[ItemListIndex].Quantity)){
                                    qtyToPickArr.push(woItemListResults[ItemListIndex].Quantity);
                                }else{
                                    qtyToPickArr.push(woItemListResults[ItemListIndex]['quantity']);
                                }
                                itemTypeArr.push(woItemListResults[ItemListIndex]['Type']);
                                inventoryNumberArr.push(woItemListResults[ItemListIndex].inventorynumber);
                                log.debug('pushed item arrays', { item: woItemListResults[ItemListIndex]['item'], line: woItemListResults[ItemListIndex]['line'] });
                            }
                            var vnitemType = woItemListResults[ItemListIndex]['Type'];
                            if(utility.nonInventoryItemTypeCheck(vnitemType))
                            {
                                itemIdArrforNonInvItems.push(woItemListResults[ItemListIndex]['item']);
                                log.debug('non-inventory item added to non-inv array', woItemListResults[ItemListIndex]['item']);
                            }
                        }

                        log.debug('Prepared item arrays', { itemIdArr: itemIdArr, itemTypeArr: itemTypeArr, itemIdArrforNonInvItems: itemIdArrforNonInvItems.length, lineNumArrLen: lineNumArr.length });

                        var woPickQtyResults = woUtility.getOpentaskPickQtyDetails(woInternalId,itemIdArr);
                        var woPickQtyResultswithInventoryNumber = woUtility.getOpentaskQtyWithInventoryNumber(woInternalId,itemIdArr);
                        log.debug('Opentask pick qty results retrieved', { woPickQtyResultsLen: (woPickQtyResults && woPickQtyResults.length), woPickQtyResultswithInventoryNumberLen: (woPickQtyResultswithInventoryNumber && woPickQtyResultswithInventoryNumber.length) });

                        var itemObjDtl = {};
                        itemObjDtl['itemIdArr'] = itemIdArr;
                        itemObjDtl['location'] = whLocation;
                        itemObjDtl['qtyToPick'] = qtyToPickArr;
                        itemObjDtl['itemTypeArr'] = itemTypeArr;
                        itemObjDtl['inventoryNumberArr'] = inventoryNumberArr;
                         
                        if(locUseBinsFlag != false)
                        {
                            log.debug('Calling getRecommendedBinswithPickPathAPI', { itemObjDtl: itemObjDtl, type: 'workorder' });
                            objRecommendedPickPathBinDetails = woUtility.getRecommendedBinswithPickPathAPI(itemObjDtl, 'workorder',itemIdArrforNonInvItems);
                            log.debug('Recommended pick path results', { length: (objRecommendedPickPathBinDetails && objRecommendedPickPathBinDetails.length) });
                        }

                        for (var openTaskIndex = 0; openTaskIndex < woPickQtyResults.length; openTaskIndex++){
                            objWOLineDtl={};
                            var itemId = woPickQtyResults[openTaskIndex]['custrecord_wmsse_sku'];
                            var openTaskLineNo = woPickQtyResults[openTaskIndex]['custrecord_wmsse_line_no'];
                            var openTaskActualQty = woPickQtyResults[openTaskIndex]['custrecord_wmsse_act_qty'];	
                            log.debug('openTask entry', { index: openTaskIndex, itemId: itemId, lineNo: openTaskLineNo, actualQty: openTaskActualQty });

                            if(utility.isValueValid(objItemDtl[itemId]))
                            {	
                                objline = objItemDtl[itemId];
                                objline[openTaskLineNo] = {'totalPickedQty' : openTaskActualQty};
                                log.debug('Updated objItemDtl existing entry', { itemId: itemId, openTaskLineNo: openTaskLineNo, qty: openTaskActualQty });
                            }else
                            {	
                                objWOLineDtl[openTaskLineNo] = {'totalPickedQty' : openTaskActualQty};
                                objItemDtl[itemId] = objWOLineDtl;
                                log.debug('Created new objItemDtl entry', { itemId: itemId, objWOLineDtl: objWOLineDtl });
                            }	
                        }
                        woUtility.updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber,objItemDtl);
                        log.debug('Called updateOpentaskQtyForInvNumber with inventory-numbered open tasks', { objItemDtlSnapshotLength: Object.keys(objItemDtl).length });

                        var woStageDtlResults = woUtility.getOpentaskPickQtyDetails(woInternalId,'','','T');
                        log.debug('woStageDtlResults fetched', { length: (woStageDtlResults && woStageDtlResults.length) });
                        if(woStageDtlResults.length > 0){
                            var lineNo =''; var actQty =''; var lineItemId ='';
                            var woStageResultswithInventoryNumber = woUtility.getOpentaskQtyWithInventoryNumber(woInternalId,'','','T');
                            for (var stageTaskIndex = 0; stageTaskIndex < woStageDtlResults.length; stageTaskIndex++){
                                objWOLineDtl ={};
                                objline ={};
                                lineNo = woStageDtlResults[stageTaskIndex].custrecord_wmsse_line_no;
                                actQty = woStageDtlResults[stageTaskIndex].custrecord_wmsse_act_qty;	
                                lineItemId = woStageDtlResults[stageTaskIndex].custrecord_wmsse_sku;
                                log.debug('woStageDtl entry', { index: stageTaskIndex, lineNo: lineNo, actQty: actQty, lineItemId: lineItemId });

                                if(utility.isValueValid(objWOStageDtl[lineItemId]))
                                 {	objline = objWOStageDtl[lineItemId];
                                	objline[lineNo] =  {'totalPickedQty' : actQty}; 
                                 }else{
                                 	objWOLineDtl[lineNo] = {'totalPickedQty' : actQty};
                                    objWOStageDtl[lineItemId] = objWOLineDtl;
                                 }
                            }
                            woUtility.updateOpentaskQtyForInvNumber(woStageResultswithInventoryNumber,objWOStageDtl);
                            log.debug('Updated stage-level opentask qty for inventory numbers', { objWOStageDtlLen: Object.keys(objWOStageDtl).length });
                        }
                        if(locUseBinsFlag == false)
                        {
                            log.debug('Using no-bins path: calling getPickTaskItemListforNoBins', { woItemListResultsLen: woItemListResults.length });
                            this.getPickTaskItemListforNoBins(woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,workorderOverpickingFlag);
                        }
                        else
                        {
                            log.debug('Using bins path: calling getPickTaskItemListforBins', { recommendedBinsLen: (objRecommendedPickPathBinDetails && objRecommendedPickPathBinDetails.length) });
                            this.getPickTaskItemListforBins(objRecommendedPickPathBinDetails,woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,workorderOverpickingFlag);
                        }

                        log.debug('woItemList after generation', { length: woItemList.length, sample: woItemList[0] });

                        if(woItemList.length >0)
                        {
                            var woItemQtyArr =[];	
                            for(var k=0;k<woItemList.length;k++)
                            {
                                if (woItemList[k]['remQtyval'] == 0 ){ 
                                    woItemQtyArr.push(woItemList[k]);
                                    woItemList.splice(k,1);
                                    k--;
                                    log.debug('Moved zero remQty to tail', { movedItem: woItemQtyArr[woItemQtyArr.length-1] });
                                }
                            }
                            for(var j in woItemQtyArr){
                                woItemList.push(woItemQtyArr[j]);
                            }
                            itemListDetails['orderList'] = woItemList;
                            itemListDetails['isValid']=true;
                            log.debug('Final orderList prepared', { orderListLength: woItemList.length });

                            if(locUseBinsFlag != false)
                            {
                                var wostageflagDtl = woUtility.getWOStageflag(woInternalId);
                                log.debug('Fetched wostageflagDtl', wostageflagDtl);
                                if(utility.isValueValid(wostageflagDtl) && wostageflagDtl.length>0){
                                    itemListDetails['gotostage'] = 'Y';
                                }else{
                                    itemListDetails['gotostage'] = 'N';
                                }
                            }
                        }
                        else
                        { 
                            itemListDetails['isValid']=false;
                            itemListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_PICKED_BACKORDERED');
                            log.debug('woItemList empty after processing', itemListDetails['errorMessage']);
                        }
                    }
                    else
                    {
                        itemListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_PICKED_BACKORDERED');
                        itemListDetails['isValid']=false;
                        log.debug('woItemListResults empty branch', itemListDetails['errorMessage']);
                    }
                }
                else{
                    itemListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
                    itemListDetails['isValid']=false;
                    log.debug('Invalid input: missing whLocation or transactionName', { whLocation: whLocation, transactionName: transactionName });
                }
            }else{
                itemListDetails['isValid']=false;
                log.debug('requestBody invalid -> isValid false');
            }

        }catch(e){
            itemListDetails['isValid'] = false;
            itemListDetails['errorMessage'] = e.message;
            log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
            log.error({title:'debugString',details:debugString});
        }
        log.debug('itemListDetails--',itemListDetails);

        return itemListDetails;
    }

    

    function getPickTaskItemListforBins(objRecommendedPickPathBinDetails,woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,woOverpickingFlag)
    {
        log.debug('getPickTaskItemListforBins:start', { recommendedBinsLen: (objRecommendedPickPathBinDetails && objRecommendedPickPathBinDetails.length), woItemListResultsLen: (woItemListResults && woItemListResults.length) });
        var vWoreminQty =0;
        var pickQty = 0;
        var objLinedata ={};
        
        for (var rbaIndex = 0; rbaIndex < objRecommendedPickPathBinDetails.length; rbaIndex++) {
            log.debug('rbaIndex loop', { rbaIndex: rbaIndex, rbaEntry: objRecommendedPickPathBinDetails[rbaIndex] });
            var pickPathItemInternalId = objRecommendedPickPathBinDetails[rbaIndex]['itemInternalId'];
            for (var itemListIndex = 0; itemListIndex < woItemListResults.length; itemListIndex++) {
                var vwoitemId = woItemListResults[itemListIndex]['item'];
                if(pickPathItemInternalId == vwoitemId && 
                    (!utility.isValueValid(woItemListResults[itemListIndex].inventorynumber) || 
                     ( woItemListResults[itemListIndex].inventorynumber == objRecommendedPickPathBinDetails[rbaIndex].inventoryNumber )	))
                { 
                    log.debug('Matched pickPath item with workorder item', { pickPathItemInternalId: pickPathItemInternalId, vwoitemId: vwoitemId, itemListIndex: itemListIndex });
                    var checkStageFlag='F';
                    var workOrderDtl = {};
                    objLinedata ={};
                    var overPickedQuantity =0;
                    var vnitemType = woItemListResults[itemListIndex]['Type'];
                    var vwoitem = woItemListResults[itemListIndex]['itemText'];
                     	vwoitemId = woItemListResults[itemListIndex]['item'];
                    var vwoitemLine = woItemListResults[itemListIndex]['line'];
                    var binName = objRecommendedPickPathBinDetails[rbaIndex]['binnumber'];
                    if(utility.isValueValid(objItemDtl[vwoitemId]))
                    {   objLinedata = objItemDtl[vwoitemId];
                        if(utility.isValueValid(objLinedata[vwoitemLine])){
                            var qtyObj = objLinedata[vwoitemLine];
                             
                            if(utility.isValueValid(woItemListResults[itemListIndex].inventorynumberText)){
                                 pickQty = qtyObj[woItemListResults[itemListIndex].inventorynumberText];
                            }
                            else{
                                pickQty = qtyObj.totalPickedQty;
                            }
                            log.debug('found pickQty from objItemDtl', { pickQty: pickQty, vwoitemId: vwoitemId, vwoitemLine: vwoitemLine });
                        }
                        else
                            pickQty =0;
                    }
                    else
                        pickQty =0;

                    var vwoitemQty= utility.isValueValid(woItemListResults[itemListIndex].Quantity)? woItemListResults[itemListIndex].Quantity:woItemListResults[itemListIndex]['Committed Quantity'];
                    var vwoitemRcvQty = woItemListResults[itemListIndex]['Built Quantity'];
                    var vUnits = woItemListResults[itemListIndex]['unitText'];
                    var vConversionRate = woItemListResults[itemListIndex]['Conversion Rate'];
                    if(utility.nonInventoryItemTypeCheck(vnitemType))
                    {
                        if(!utility.isValueValid(vConversionRate)){
                            vConversionRate = 1;
                        }
                        vwoitemQty = Number(Big(woItemListResults[itemListIndex]['quantity']).div(vConversionRate));
                    }

                    if(!(utility.isValueValid(pickQty)))
                        pickQty=0;

                    if(!(utility.isValueValid(vwoitemRcvQty)))	
                        vwoitemRcvQty=0;

                    if(!(utility.isValueValid(vwoitemQty))) 
                        vwoitemQty=0;

                    if(utility.nonInventoryItemTypeCheck(vnitemType))
                    {
                        pickQty = Number(Big(pickQty).plus(vwoitemRcvQty));
                        vWoreminQty = Number(Big(vwoitemQty).minus(pickQty));
                    }
                    else
                    {
                        vwoitemRcvQty=new Big(vwoitemRcvQty);
                        pickQty=new Big(pickQty);
                        if(utility.isValueValid(woItemListResults[itemListIndex].Quantity)){
                          vWoreminQty = Number(Big(vwoitemQty).minus(pickQty));
                        }else{
                            vWoreminQty = Number((Big(vwoitemQty).plus(vwoitemRcvQty)).minus(pickQty));
                        }
                    }
                    log.debug('calculated vWoreminQty', { vWoreminQty: vWoreminQty, vwoitemId: vwoitemId, pickQty: pickQty });

                    if(inputParamObj.transactionType=="returnauthorization")
                    {
                        if(vWoreminQty<0)
                            vWoreminQty=vWoreminQty*(-1);
                    }

                    if(woOverpickingFlag)
                    {
                        if(vWoreminQty<0) {
                            if(vUnits !=null && vUnits !='' && vUnits!='null' && vUnits !='undefined' && vUnits !='- None -')
                                overPickedQuantity = vWoreminQty*(-1)+" "+vUnits;
                            else
                                overPickedQuantity = vWoreminQty*(-1)
                            vWoreminQty = 0;
                            log.debug('overPickedQuantity applied', overPickedQuantity);
                        }
                    }
                    if(vWoreminQty == 0){
                        var stagedQty=0;
                        objLinedata ={};
                        log.debug('checking staged qty for item', vwoitemId);
                        if(utility.isValueValid(objWOStageDtl[vwoitemId]))
                        {   objLinedata = objWOStageDtl[vwoitemId];
                          if(utility.isValueValid(objLinedata[vwoitemLine])){
                            var qtyObj = objLinedata[vwoitemLine];
                           if(utility.isValueValid(woItemListResults[itemListIndex].inventorynumberText)){
                                 stagedQty = qtyObj[woItemListResults[itemListIndex].inventorynumberText];
                            }else{
                                stagedQty = qtyObj.totalPickedQty;
                            }
                          } 
                         }
                        stagedQty= new Big(stagedQty);

                        var vWoremStageQty = utility.isValueValid(woItemListResults[itemListIndex].Quantity) ? Number(Big(vwoitemQty).minus(stagedQty)) : Number((Big(vwoitemQty).plus(vwoitemRcvQty)).minus(stagedQty));
                        
                        if(vWoremStageQty == 0 || ((vWoremStageQty <0) && (woOverpickingFlag)))
                            checkStageFlag = 'T';
                        log.debug('staged quantities evaluated', { stagedQty: stagedQty.toString(), vWoremStageQty: vWoremStageQty, checkStageFlag: checkStageFlag });
                    }
                    if( checkStageFlag == 'F'){
                        if(vWoreminQty<0) {
                            vWoreminQty = 0;
                        }
                        if(vUnits !=null && vUnits !='' && vUnits !='null' && vUnits !='undefined' && vUnits !='- None -')
                            workOrderDtl['remQty'] = parseFloat(parseFloat(vWoreminQty).toFixed(8))+" "+vUnits;
                        else
                            workOrderDtl['remQty'] =parseFloat(parseFloat(vWoreminQty).toFixed(8));

                        workOrderDtl['itemName'] = vwoitem ;
                        workOrderDtl['remQtyval'] = parseFloat(parseFloat(vWoreminQty).toFixed(8));
                        workOrderDtl['salesDesc'] = utility.isValueValid(woItemListResults[itemListIndex]['salesdescription']) ? woItemListResults[itemListIndex]['salesdescription'] : null; 
                        workOrderDtl['upcCode'] = woItemListResults[itemListIndex]['upccode']; 
                        workOrderDtl['itemType'] = vnitemType;
                        workOrderDtl['itemInternalId'] = vwoitemId;
                        workOrderDtl['transactionLineNo']  = vwoitemLine;
                        workOrderDtl['transactionInternalId']  = inputParamObj.woInternalId;
                        workOrderDtl['transactionType']  =  inputParamObj.transactionType;
                        workOrderDtl['transactionName'] = inputParamObj.transactionName;
                        workOrderDtl['binName'] = binName;
                        workOrderDtl['inventorynumber'] = woItemListResults[itemListIndex].inventorynumber; 
                        workOrderDtl['inventorynumberText'] = woItemListResults[itemListIndex].inventorynumberText; 
                        workOrderDtl['overpickedQuantity'] = overPickedQuantity;
                        woItemList.push(workOrderDtl);
                        log.debug('pushed workOrderDtl into woItemList', { index: woItemList.length-1, workOrderDtl: workOrderDtl });
                    }

                }
            }
        }
        log.debug('getPickTaskItemListforBins:end', { woItemListLen: woItemList.length });
    }

    function getPickTaskItemListforNoBins(woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,woOverpickingFlag)
    {
        log.debug('getPickTaskItemListforNoBins:start', { woItemListResultsLen: (woItemListResults && woItemListResults.length) });
        var vWoreminQty =0;
        var pickQty = 0;
        var objLinedata={};
        for (var itemListIndex = 0; itemListIndex < woItemListResults.length; itemListIndex++) {
            log.debug('no-bins loop item', { index: itemListIndex, row: woItemListResults[itemListIndex] });
            objLinedata={};
            var checkStageFlag='F';
            var workOrderDtl = {};
            var overPickedQuantity =0;
            var vnitemType = woItemListResults[itemListIndex]['Type'];
            var vwoitem = woItemListResults[itemListIndex]['itemText'];
            var vwoitemId = woItemListResults[itemListIndex]['item'];
            var vwoitemLine = woItemListResults[itemListIndex]['line'];
            if(utility.isValueValid(objItemDtl[vwoitemId]))
            {   objLinedata = objItemDtl[vwoitemId];
                if(utility.isValueValid(objLinedata[vwoitemLine])){
                    var qtyObj = objLinedata[vwoitemLine];
                    if(utility.isValueValid(woItemListResults[itemListIndex].inventorynumberText)){
                        pickQty = qtyObj[woItemListResults[itemListIndex].inventorynumberText];
                    }
                    else{
                        pickQty = qtyObj.totalPickedQty;
                    }
                    log.debug('pickQty found from objItemDtl', { vwoitemId: vwoitemId, pickQty: pickQty });
                }
                else
                    pickQty =0;
            }
            else
                pickQty =0;

            var vwoitemQty= utility.isValueValid(woItemListResults[itemListIndex].Quantity)? woItemListResults[itemListIndex].Quantity:woItemListResults[itemListIndex]['Committed Quantity'];
            var vwoitemRcvQty = woItemListResults[itemListIndex]['Built Quantity'];
            var vUnits = woItemListResults[itemListIndex]['unitText'];
            var vConversionRate = woItemListResults[itemListIndex]['Conversion Rate'];
            if(utility.nonInventoryItemTypeCheck(vnitemType))
            {
                if(!utility.isValueValid(vConversionRate)){
                    vConversionRate = 1;
                }
                vwoitemQty = Number(Big(woItemListResults[itemListIndex]['quantity']).div(vConversionRate));
            }

            if(!(utility.isValueValid(pickQty)))
                pickQty=0;

            if(!(utility.isValueValid(vwoitemRcvQty)))	
                vwoitemRcvQty=0;

            if(!(utility.isValueValid(vwoitemQty))) 
                vwoitemQty=0;


            if(utility.nonInventoryItemTypeCheck(vnitemType))
            {
                pickQty = Number(Big(pickQty).plus(vwoitemRcvQty));
                vWoreminQty = Number(Big(vwoitemQty).minus(pickQty));
            }
            else
            {
                vwoitemRcvQty=new Big(vwoitemRcvQty);
                pickQty=new Big(pickQty);

                vWoreminQty = utility.isValueValid(woItemListResults[itemListIndex].Quantity)? Number(Big(vwoitemQty).minus(pickQty)) : Number((Big(vwoitemQty).plus(vwoitemRcvQty)).minus(pickQty));
            }

            log.debug('computed vWoreminQty for item', { vwoitemId: vwoitemId, vWoreminQty: vWoreminQty, pickQty: pickQty.toString() });

            if(inputParamObj.transactionType=="returnauthorization")
            {
                if(vWoreminQty<0)
                    vWoreminQty=vWoreminQty*(-1);
            }
            if(woOverpickingFlag)
            {
                if(vWoreminQty<0) {
                    if(vUnits !=null && vUnits !='' && vUnits !='null' && vUnits !='undefined' && vUnits !='- None -')
                        overPickedQuantity = vWoreminQty*(-1)+" "+vUnits;
                    else
                        overPickedQuantity = vWoreminQty*(-1)
                    vWoreminQty = 0;
                    log.debug('overPickedQuantity set for no-bins', overPickedQuantity);
                }
            }

            if(vWoreminQty == 0)	{
                var stagedQty=0;
                if(utility.isValueValid(objWOStageDtl[vwoitemId]))
                {   objLinedata = objWOStageDtl[vwoitemId];
                  if(utility.isValueValid(objLinedata[vwoitemLine])){
                    var qtyObj = objLinedata[vwoitemLine];
                   if(utility.isValueValid(woItemListResults[itemListIndex].inventorynumberText)){
                     stagedQty = qtyObj[woItemListResults[itemListIndex].inventorynumberText];
                    }else{
                    stagedQty = qtyObj.totalPickedQty;
                    }
                  } 
                }
                stagedQty= new Big(stagedQty);
                var vWoremStageQty = utility.isValueValid(woItemListResults[itemListIndex].Quantity) ? Number(Big(vwoitemQty).minus(stagedQty)) : Number((Big(vwoitemQty).plus(vwoitemRcvQty)).minus(stagedQty));
                if(vWoremStageQty == 0)
                    checkStageFlag = 'T';
                log.debug('staged qty check', { vwoitemId: vwoitemId, stagedQty: stagedQty.toString(), vWoremStageQty: vWoremStageQty, checkStageFlag: checkStageFlag });
            }
            if( checkStageFlag == 'F'){				
                if(parseFloat(vWoreminQty)>0)
                {
                    if(vUnits !=null && vUnits !='' && vUnits !='null' && vUnits !='undefined' && vUnits !='- None -')
                        workOrderDtl['remQty'] = parseFloat(parseFloat(vWoreminQty).toFixed(8))+" "+vUnits;
                    else
                        workOrderDtl['remQty'] =parseFloat(parseFloat(vWoreminQty).toFixed(8));

                    workOrderDtl['itemName'] = vwoitem ;
                    workOrderDtl['remQtyval'] = parseFloat(parseFloat(vWoreminQty).toFixed(8));
                    workOrderDtl['salesDesc'] = utility.isValueValid(woItemListResults[itemListIndex]['salesdescription']) ? woItemListResults[itemListIndex]['salesdescription'] : null; 
                    workOrderDtl['upcCode'] = woItemListResults[itemListIndex]['upccode']; 
                    workOrderDtl['itemType'] = vnitemType;
                    workOrderDtl['itemInternalId'] = vwoitemId;
                    workOrderDtl['transactionLineNo']  = vwoitemLine;
                    workOrderDtl['transactionInternalId']  = inputParamObj.woInternalId;
                    workOrderDtl['transactionType']  =  inputParamObj.transactionType;
                    workOrderDtl['transactionName'] = inputParamObj.transactionName;
                    workOrderDtl['inventorynumber'] = woItemListResults[itemListIndex].inventorynumber; 
                    workOrderDtl['inventorynumberText'] = woItemListResults[itemListIndex].inventorynumberText;
                    workOrderDtl['overpickedQuantity'] = overPickedQuantity;
                    woItemList.push(workOrderDtl);
                    log.debug('pushed workOrderDtl into woItemList (no-bins)', { index: woItemList.length-1, workOrderDtl: workOrderDtl });
                }
            }

        }
        log.debug('getPickTaskItemListforNoBins:end', { woItemListLen: woItemList.length });
    }

    return{
        'post' : doPost,
        getPickTaskItemListforNoBins:getPickTaskItemListforNoBins,
        getPickTaskItemListforBins:getPickTaskItemListforBins
    }
});