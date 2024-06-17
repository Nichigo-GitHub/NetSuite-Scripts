/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./big','./wms_workOrderUtility'],

		function (utility,translator,Big,woUtility) {

	function doPost(requestBody) {

		var itemListDetails={};
		var debugString = '';
		var requestParams = '';
		var woItemList = [];
		var inputParamObj = {};
		try{
			if(utility.isValueValid(requestBody)){
				log.debug({title:'requestBody',details:requestBody});	
				requestParams = requestBody.params;
				var whLocation = requestParams.warehouseLocationId;
				var transactionName = requestParams.transactionName;
				var transactionType = requestParams.transactionType;	
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var inventoryDetailLotOrSerialFlag = requestParams.inventoryDetailLotOrSerialFlag;
				var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;

				var objWOLineDtl = {};
				var objItemDtl = {};
				var objRecommendedPickPathBinDetails=[];
				if(utility.isValueValid(whLocation) && utility.isValueValid(transactionName))
				{	workorderOverpickingFlag = workorderOverpickingFlag || false;
					if(!utility.isValueValid(locUseBinsFlag))
					{
						locUseBinsFlag =utility.lookupOnLocationForUseBins(whLocation);
					}
					log.debug('locUseBinsFlag' , locUseBinsFlag);
					inputParamObj.whLocation = whLocation;
					inputParamObj.transactionName = transactionName;
					inputParamObj.transactionType = transactionType;
					inputParamObj.inventoryDetailLotOrSerialFlag = inventoryDetailLotOrSerialFlag;
					var woItemListResults=woUtility.getWOLineItemList(inputParamObj);

					if(woItemListResults.length>0)
					{ 
						var itemIdArr =[];
					var itemTypeArr=[];
					var itemIdArrforNonInvItems =[];
					var lineNumArr =[];
					var qtyToPickArr =[];
					var inventoryNumberArr = [];
					var woInternalId= woItemListResults[0]['internalid'];
						inputParamObj.woInternalId = woInternalId;
					var objWOStageDtl={};
						for (var ItemListIndex = 0; ItemListIndex < woItemListResults.length; ItemListIndex++) 
					{
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
								}
							var vnitemType = woItemListResults[ItemListIndex]['Type'];
							if(utility.nonInventoryItemTypeCheck(vnitemType))
						{
								itemIdArrforNonInvItems.push(woItemListResults[ItemListIndex]['item']);
						}
					}

					var woPickQtyResults = woUtility.getOpentaskPickQtyDetails(woInternalId,itemIdArr);
					var woPickQtyResultswithInventoryNumber = woUtility.getOpentaskQtyWithInventoryNumber(woInternalId,itemIdArr);
					var itemObjDtl = {};

					itemObjDtl['itemIdArr'] = itemIdArr;
					itemObjDtl['location'] = whLocation;
					itemObjDtl['qtyToPick'] = qtyToPickArr;
					itemObjDtl['itemTypeArr'] = itemTypeArr;
					itemObjDtl['inventoryNumberArr'] = inventoryNumberArr;
					 
						if(locUseBinsFlag != false)
						{
					objRecommendedPickPathBinDetails = woUtility.getRecommendedBinswithPickPathAPI(itemObjDtl, 'workorder',itemIdArrforNonInvItems);
						}
						for (var openTaskIndex = 0; openTaskIndex < woPickQtyResults.length; openTaskIndex++){
						    objWOLineDtl={};
							var itemId = woPickQtyResults[openTaskIndex]['custrecord_wmsse_sku'];
							var openTaskLineNo = woPickQtyResults[openTaskIndex]['custrecord_wmsse_line_no'];
							var openTaskActualQty = woPickQtyResults[openTaskIndex]['custrecord_wmsse_act_qty'];	

						if(utility.isValueValid(objItemDtl[itemId]))
						{	objline = objItemDtl[itemId];
							objline[openTaskLineNo] = {'totalPickedQty' : openTaskActualQty};
						}else
							{	objWOLineDtl[openTaskLineNo] = {'totalPickedQty' : openTaskActualQty};
						objItemDtl[itemId] = objWOLineDtl;
						}	
					}
					woUtility.updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber,objItemDtl);
					 
					var woStageDtlResults = woUtility.getOpentaskPickQtyDetails(woInternalId,'','','T');
					if(woStageDtlResults.length > 0){
						var lineNo ='';
						var actQty ='';
						var lineItemId ='';
						var woStageResultswithInventoryNumber = woUtility.getOpentaskQtyWithInventoryNumber(woInternalId,'','','T');
						    
							for (var stageTaskIndex = 0; stageTaskIndex < woStageDtlResults.length; stageTaskIndex++){
								objWOLineDtl ={};
								objline ={};
								lineNo = woStageDtlResults[stageTaskIndex].custrecord_wmsse_line_no;
								actQty = woStageDtlResults[stageTaskIndex].custrecord_wmsse_act_qty;	
								lineItemId = woStageDtlResults[stageTaskIndex].custrecord_wmsse_sku;

								if(utility.isValueValid(objWOStageDtl[lineItemId]))
						         {	objline = objWOStageDtl[lineItemId];
						        	objline[lineNo] =  {'totalPickedQty' : actQty}; 
						         }else{
						         	objWOLineDtl[lineNo] = {'totalPickedQty' : actQty};
						            objWOStageDtl[lineItemId] = objWOLineDtl;
						         }
						}
						woUtility.updateOpentaskQtyForInvNumber(woStageResultswithInventoryNumber,objWOStageDtl);
					}
					  if(locUseBinsFlag == false)
						{
						this.getPickTaskItemListforNoBins(woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,workorderOverpickingFlag);
						}
						else
						{
						this.getPickTaskItemListforBins(objRecommendedPickPathBinDetails,woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,workorderOverpickingFlag);
				        }

					if(woItemList.length >0)
					{
						var woItemQtyArr =[];	
						for(var k=0;k<woItemList.length;k++)
						{
							if (woItemList[k]['remQtyval'] == 0 ){ 
								woItemQtyArr.push(woItemList[k]);
								woItemList.splice(k,1);
								k--;
							}
						}
						for(var j in woItemQtyArr){
							woItemList.push(woItemQtyArr[j]);
						}
						itemListDetails['orderList'] = woItemList;
						itemListDetails['isValid']=true;

					 if(locUseBinsFlag != false)
						{
						var wostageflagDtl = woUtility.getWOStageflag(woInternalId);
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
					}
					}
					else
					{
						itemListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_PICKED_BACKORDERED');
						itemListDetails['isValid']=false;
					}
				}
				else{
					itemListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
					itemListDetails['isValid']=false;
				}
			}else{
				itemListDetails['isValid']=false;
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
		var vWoreminQty =0;
		var pickQty = 0;
		var objLinedata ={};
		
		for (var rbaIndex = 0; rbaIndex < objRecommendedPickPathBinDetails.length; rbaIndex++) {
			var pickPathItemInternalId = objRecommendedPickPathBinDetails[rbaIndex]['itemInternalId'];
			for (var itemListIndex = 0; itemListIndex < woItemListResults.length; itemListIndex++) {
				var vwoitemId = woItemListResults[itemListIndex]['item'];
				if(pickPathItemInternalId == vwoitemId && 
					(!utility.isValueValid(woItemListResults[itemListIndex].inventorynumber) || 
					 ( woItemListResults[itemListIndex].inventorynumber == objRecommendedPickPathBinDetails[rbaIndex].inventoryNumber )	))
				{ 
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
						}
					}
					if(vWoreminQty == 0){
						var stagedQty=0;
						objLinedata ={};
                      log.debug('objWOStageDtl',objWOStageDtl);
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
					}
					if( checkStageFlag == 'F'){
						if(vWoreminQty<0) {
							vWoreminQty = 0;
						}
						if(vUnits !=null && vUnits !='' && vUnits!='null' && vUnits !='undefined' && vUnits !='- None -')
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
					}

				}
			}
		}
	}

	function getPickTaskItemListforNoBins(woItemListResults,objWOStageDtl,objItemDtl,inputParamObj,woItemList,woOverpickingFlag)
	{
		var vWoreminQty =0;
		var pickQty = 0;
		var objLinedata={};
		for (var itemListIndex = 0; itemListIndex < woItemListResults.length; itemListIndex++) {
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
			}
			if( checkStageFlag == 'F'){				
				if(parseFloat(vWoreminQty)>0)
				{
					if(vUnits !=null && vUnits !='' && vUnits!='null' && vUnits !='undefined' && vUnits !='- None -')
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
				}
			}

		}
	}

	return{
		'post' : doPost,
		getPickTaskItemListforNoBins:getPickTaskItemListforNoBins,
		getPickTaskItemListforBins:getPickTaskItemListforBins
	}
});