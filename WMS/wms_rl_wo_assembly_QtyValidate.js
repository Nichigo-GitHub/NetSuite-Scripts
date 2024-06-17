/**
 *     Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_workOrderUtility','./big','./wms_translator'],
		/**
		 * @param {search} search
		 */
		function(utility,woUtility,Big,translator) {

	function doPost(requestBody) {
		var debugString = '';
		var response = {};
		try{
			if(utility.isValueValid(requestBody))
			{
				//variables declaration //
				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;
				var itemName = requestParams.itemName;
				var itemInternalId = requestParams.itemInternalId;
				var itemType = requestParams.itemType;
				var scannedQuantity = requestParams.scannedQuantity;
				var remBuildableQuantity = requestParams.remBuildableQuantity;
				var assemblyItemQuantity = requestParams.assemblyItemQuantity;
				var statusName = requestParams.statusName;
				var transactionUomName = requestParams.transactionUomName;
				var scannedQuantityInBaseUnits = '';
				var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var statusInternalId = requestParams.statusInternalId;
				var impactedRecords={}; 
				var openTaskResultsObj = {};
				if(!utility.isValueValid(transactionUomName)){
					transactionUomName = '';
				}

				scannedQuantity = parseFloat(scannedQuantity);
				scannedQuantityInBaseUnits = parseFloat(scannedQuantity);

				debugString = debugString + ",requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});

				var itemResults = woUtility.validateItemForAssembly(warehouseLocationId, itemInternalId, itemName);

				if(itemResults.length > 0){
					if(!utility.isValueValid(locUseBinsFlag))
					{
						locUseBinsFlag =utility.lookupOnLocationForUseBins(warehouseLocationId);
					}

					response["binMixItem"]  = itemResults[0]['custitem_wmsse_mix_item'];
					response["binMixLot"] =  itemResults[0]['custitem_wmsse_mix_lot'];
					impactedRecords['_ignoreUpdate'] = true;

					var itemBinResults = woUtility.validateItemForAssembly(warehouseLocationId, itemInternalId, itemName,'Bins');

					if(itemBinResults.length>0){
						response["preferedBinInternalId"]  = itemBinResults[0]['preferedBinInternalId'];
						response["preferredBinName"]  = itemBinResults[0]['binnumber'];
					}

					var openTaskResults = woUtility.getOpenTaskDtlForAssembly(warehouseLocationId, transactionInternalId,locUseBinsFlag);

					if(openTaskResults.length > 0){

						for(var srchResult=0;srchResult<openTaskResults.length;srchResult++){
                             openTaskResultsObj[openTaskResults[srchResult].custrecord_wmsse_line_no] = {
                             	'item':openTaskResults[srchResult].custrecord_wmsse_sku ,
                             	'quanity': openTaskResults[srchResult].custrecord_wmsse_act_qty
                             };
						}

						var transactionResults = woUtility.getTransactionDtlForAssembly(warehouseLocationId, transactionInternalId);

						log.debug({title:'scannedQuantityInBaseUnits :',details:scannedQuantityInBaseUnits});
						log.debug({title:'remBuildableQuantity : ',details:remBuildableQuantity});

						if(scannedQuantityInBaseUnits > remBuildableQuantity || scannedQuantity <= 0){
							response["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_QUANTITYVALIDATE.QTY_GREATER_THAN_REQUIRED_QTY');
							response['isValid'] = false;		
						}
						else
						{

							if((itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') && scannedQuantity.toString().indexOf('.') != -1)
							{
								response["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
								response['isValid'] = false;
							}
							else
							{
								for(var i=0; i< transactionResults.length; i++)
								{
									var tranactionLineItem = transactionResults[i]['item'];
									var transactionLineNo =  transactionResults[i]['line'];
									var transactionLineItemQty = transactionResults[i]['quantityuom'];
									if(utility.isValueValid(transactionLineItemQty) && parseFloat(transactionLineItemQty)>0)
									{
										transactionLineItemQty =parseFloat(transactionLineItemQty).toFixed(8);
									}
								assemblyItemQuantity = new Big(assemblyItemQuantity);
								var TempQty = (new Big(transactionLineItemQty)).div(assemblyItemQuantity);
								log.debug({title:'Actual quanity that is required to built 1 Assembly Item : ',details:TempQty});

								var ActualQty = parseFloat((new Big(TempQty)).mul(scannedQuantityInBaseUnits));
								log.debug({title:'Actual quanity that needs to be built  : ',details:ActualQty});

								response['isValid'] = false;

								if(utility.isValueValid(openTaskResultsObj[transactionLineNo])){
									if(tranactionLineItem == openTaskResultsObj[transactionLineNo].item  &&  
										openTaskResultsObj[transactionLineNo].quanity >= ActualQty){
 										response.isValid = true;
									}
								}
								 
								if(response['isValid'] == false){
									response["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_QUANTITYVALIDATE.ITEM_NOT_YET_PICKED');
									response['isValid'] = false;
									break;
								}

								}
							}

							if(response['isValid'] == true)
							{
								response['scannedQuantity'] = scannedQuantity;
								response['scannedQuantityInBaseUnits'] = scannedQuantityInBaseUnits;
								response['inventoryStatusFeature'] = inventoryStatusFeature;
								response['info_scannedQuantity'] = scannedQuantity +' ' + transactionUomName;
								response['info_statusName'] = statusName;

								if(parseFloat(scannedQuantity) < remBuildableQuantity){
									response['completionStatus'] = 'partial';
								}
								if(itemType == 'lotnumberedinventoryitem' || itemType=='lotnumberedassemblyitem')
								{
									response['pageNavigationStatus'] = 'EnterLotScreen';
								}
								else if(itemType == 'serializedinventoryitem' || itemType=='serializedassemblyitem')
								{
									response['pageNavigationStatus'] = 'serialScanScreen';
									response['numberOfTimesSerialScanned'] = 0;
								}
								else
								{
									if(locUseBinsFlag == false)
									{
										var impactRec = {};
										var openTaskArr = [];
										var assemblyBuildIdArr = [];
										var transactionInternalIdArr = [];										
										var parameterObject = {};
										
										parameterObject = woUtility.buildParameterObject(parameterObject,transactionInternalId,itemInternalId,warehouseLocationId,itemType,scannedQuantity,
												scannedQuantityInBaseUnits,assemblyItemQuantity,statusInternalId,inventoryStatusFeature,transactionUomName,locUseBinsFlag);

										var results = woUtility.createAssemblyBuildRec(parameterObject);
										log.debug('results', results); 
										var splitOpenTaskResults = results.opentaskSplitArray;

										if(utility.isValueValid(results['assemblyRecId'])){
											assemblyBuildIdArr.push(results['assemblyRecId']);
										}else{
											assemblyBuildIdArr.push();
										}

										impactedRecords['assemblybuild'] = assemblyBuildIdArr;
										log.debug('splitOpenTaskResults', splitOpenTaskResults);
										parameterObject['openTask_statusFlag'] = 3;
										parameterObject['openTask_taskType'] = 5;
										parameterObject['opentTask_NSConfirmationRefNo'] = results.assemblyRecId;
										parameterObject['toBinInternalId'] = '';
										var openTaskId = woUtility.createOpenTaskForWorkOrder(parameterObject);
										impactRec['opentaskId'] = openTaskId;

										if(utility.isValueValid(impactRec['opentaskId'])){
											openTaskArr.push(impactRec['opentaskId']);
										}else{
											openTaskArr.push();
										}
										impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskArr;

										if(utility.isValueValid(transactionInternalId)){
											transactionInternalIdArr.push(transactionInternalId);
										}else{
											transactionInternalIdArr.push();
										}
										response['pageNavigationStatus'] = 'CompleteScreen';
										impactedRecords['workorder'] = transactionInternalIdArr;
										impactedRecords['_ignoreUpdate'] = false;
										if(utility.isValueValid(splitOpenTaskResults) && splitOpenTaskResults.length>0)
										{
											woUtility.splitOpenTaskRecordsForWO(splitOpenTaskResults,results,transactionInternalId,inventoryStatusFeature);
										}
										else
										{
											response['errorMessage']='';
										}
									}
									else
									{
									response['pageNavigationStatus'] = 'EnterBinScreen';
								}
							}
								response["impactedRecords"] = impactedRecords;
							}
						}

					}
				}
				else
				{
					response["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_QUANTITYVALIDATE.INACTIVE_ITEM');
					response['isValid'] = false;					
				}
			}
			else
			{
				response["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_QUANTITYVALIDATE.INVALID_INPUT');
				response['isValid'] = false;
			}

		}
		catch(e)
		{
			response['isValid'] = false;
			response['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return response;

	}

	return {
		'post': doPost
	};

});
