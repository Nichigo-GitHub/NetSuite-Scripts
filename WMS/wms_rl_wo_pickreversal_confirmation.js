/**
 *    Copyright  2023, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record','N/query','./wms_utility','./wms_translator','./wms_workOrderUtility','./big'],

	function (record,query,utility,translator,woUtility,Big) {
		function doPost(requestBody) {

			var confirmationObj={};
			var requestParams = '';
			var woItemIdArray =[];
			var woItemTypeObj = {};
			var resultObj ={};
			try{
				if(utility.isValueValid(requestBody)){
					var requestParams = requestBody.params;
					var warehouseLocationId = requestParams.warehouseLocationId;
                    var transactionInternalId = requestParams.transactionInternalId;
                    var transactionName = requestParams.transactionName;
					var selectedItemsDetailsObject = requestParams.scannedItem;
					var openTaskCount =requestParams.openTaskCount;
					log.debug({title:'requestParams',details:requestParams});
					if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId) &&
						utility.isValueValid(selectedItemsDetailsObject))
					{
						var invtransferObj ={};
						var enterQty ='';
						var componentItemId ='';
						var componentItemType ='';
						var conversionRate='';
						var serialNumber ='';
						var openTaskRecordId='';
						var totalItemsCount =1;
						var openTaskinternalIdarray =[];
						var binTransfer ="";
						var binTransferId ="";

						totalItemsCount = selectedItemsDetailsObject.length;
						if(totalItemsCount > 10){
							confirmationObj.errorMessage = translator.getTranslationString('WOREVERSAL_PICKREVERSAL_SELECTIONERROR');
							confirmationObj.isValid =false;
							totalItemsCount = 0;
						}
						else{
							for(var result in selectedItemsDetailsObject){
								if(selectedItemsDetailsObject[result]){
									openTaskinternalIdarray.push(selectedItemsDetailsObject[result].internalId);
								}
							}

						var openTaskDetails = woUtility.getOpenTaskDetailsForWorkOrder(warehouseLocationId,transactionInternalId,openTaskinternalIdarray);
						if(openTaskDetails.length>0){
							var isStagedFlag =false;
							var failedOpenTaskArray =[];
							var itemString ="";
							var itemStringArray =[];
							var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

							for(var cnt=0;cnt<openTaskDetails.length;cnt++)
							{
								woItemIdArray.push(openTaskDetails[cnt].custrecord_wmsse_sku);
								var transactionReferenceNumber =openTaskDetails[cnt].custrecord_wmsse_nstrn_ref_no;
								if(utility.isValueValid(transactionReferenceNumber) && transactionReferenceNumber !=transactionInternalId){
									isStagedFlag =true;
								}
							}
							var woItemTypeDetails = woUtility.getItemTypeDetails(woItemIdArray,warehouseLocationId);
							for(var itemCnt=0;itemCnt<woItemTypeDetails.length;itemCnt++)
							{
								woItemTypeObj[woItemTypeDetails[itemCnt].id]=woItemTypeDetails[itemCnt].recordType;
							}
							log.debug({title:'isStagedFlag',details:isStagedFlag});
							if(isStagedFlag) {
								binTransfer = record.create({
									type: record.Type.BIN_TRANSFER,
									isDynamic:true
								});
								for (var openTaskItr = 0; openTaskItr < openTaskDetails.length; openTaskItr++) {
									var bintransferReferenceNumber = openTaskDetails[openTaskItr].custrecord_wmsse_nstrn_ref_no;
									if (utility.isValueValid(bintransferReferenceNumber)) {
										openTaskRecordId = openTaskDetails[openTaskItr].internalid;
										componentItemId = openTaskDetails[openTaskItr].custrecord_wmsse_sku;
										componentItemType = woItemTypeObj[componentItemId];
										enterQty = Number(openTaskDetails[openTaskItr].custrecord_wmsse_act_qty);
										conversionRate = Number(openTaskDetails[openTaskItr].custrecord_wmsse_conversionrate);

										if (componentItemType == "inventoryitem" || componentItemType == "assemblyitem" || componentItemType == "lotnumberedinventoryitem" ||
											componentItemType == "lotnumberedassemblyitem" || componentItemType == "serializedinventoryitem" || componentItemType == "serializedassemblyitem") {
											invtransferObj = {};
											invtransferObj.woInternalId = openTaskDetails[openTaskItr].custrecord_wmsse_order_no;
											invtransferObj.itemType = componentItemType;
											invtransferObj.warehouseLocationId = warehouseLocationId;
											invtransferObj.itemId = componentItemId;
											if (utility.isValueValid(conversionRate)) {
												invtransferObj.quantity=woUtility.convertQuantityInStockUnits(componentItemId,enterQty,conversionRate);
											}
											else {
												invtransferObj.quantity = enterQty;
											}
											invtransferObj.fromBinId = openTaskDetails[openTaskItr].custrecord_wmsse_stagebinloc;
											invtransferObj.toBinId = openTaskDetails[openTaskItr].custrecord_wmsse_actbeginloc;
											invtransferObj.batchNum = openTaskDetails[openTaskItr].custrecord_wmsse_batch_num;
											invtransferObj.serialNum = openTaskDetails[openTaskItr].custrecord_wmsse_serial_no;
											invtransferObj.transactionName = transactionName;
											invtransferObj.statusInternalId = openTaskDetails[openTaskItr].custrecord_wmsse_inventorystatus;
											invtransferObj.inventoryStatusFeature = inventoryStatusFeature;
											binTransferFlag = woUtility.woBinTransfer(invtransferObj, binTransfer);
										}
									}
								}
								binTransferId = binTransfer.save();
								log.debug({title:'binTransferId',details:binTransferId});
							}
							confirmationObj.isNextPickTaskLineExist =false;
							if((isStagedFlag && utility.isValueValid(binTransferId)) ||(!isStagedFlag))
							{
								for(var itr =0;itr<openTaskDetails.length;itr++) {
									resultObj = woUtility.moveOpentaskRecordToClosedTask(openTaskDetails[itr],binTransferId);
									if(utility.isValueValid(resultObj) && utility.isValueValid(resultObj.errorMessage))
									{
										failedOpenTaskArray.push(openTaskDetails.id);
									}
									else {
										if(itemStringArray.indexOf(openTaskDetails.custrecord_wmsse_skuText)==-1){
											if(!utility.isValueValid(itemString)){
												itemString =openTaskDetails[itr].custrecord_wmsse_skuText;
											}else {
												itemString = itemString + "," + openTaskDetails[itr].custrecord_wmsse_skuText;
											}
										}
									}
								}
							}
							if(failedOpenTaskArray.length>0) {
								confirmationObj.errorMessage = translator.getTranslationString('WOREVERSAL_PICKREVERSAL_FAILED');
								confirmationObj.isValid=false;
							}
							else{
								if (parseInt(openTaskCount) > parseInt(totalItemsCount)) {
									confirmationObj.isNextPickTaskLineExist = true;
									confirmationObj.openTaskCount = parseInt(openTaskCount)-parseInt(totalItemsCount);
								} else if (parseInt(openTaskCount) == parseInt(totalItemsCount))
								{
									deleteMoveTask(warehouseLocationId,transactionInternalId);
								}
								confirmationObj.transactionInternalId = transactionInternalId;
								confirmationObj.transactionName = transactionName;
								confirmationObj.itemString =itemString;
								confirmationObj.isValid = true;
							}
						}
						else {
							confirmationObj.errorMessage = translator.getTranslationString('WOREVERSAL_NO_OPENPICKS');
							confirmationObj.isValid=false;
						}
						}
					}
					else{
						confirmationObj.errorMessage = translator.getTranslationString('WOREVERSAL_PICKREVERSAL_INVALIDSELECTION');
						confirmationObj.isValid=false;
						}
				}

			}catch(e){
				confirmationObj.isValid = false;
				confirmationObj.errorMessage = e.message;
				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			}
			log.debug('confirmationObj--',confirmationObj);

			return confirmationObj;
		}

		function deleteMoveTask(warehouseLocationId,transactionInternalId)
		{
			try {
				const openTaskQuery = query.create({
					type: 'customrecord_wmsse_trn_opentask'
				});
				var statusFlagCondition = openTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_wms_status_flag',
					operator: query.Operator.ANY_OF,
					values:19
				});
				var tasktypeCondition = openTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_tasktype',
					operator: query.Operator.ANY_OF,
					values:9
				});
				var locationCondition = openTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_wms_location',
					operator: query.Operator.ANY_OF,
					values: warehouseLocationId
				});
				var inActiveCondition = openTaskQuery.createCondition({
					fieldId: 'isinactive',
					operator: query.Operator.IS,
					values: false
				});
				var orderInternalIdCondition = openTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_order_no',
					operator: query.Operator.ANY_OF,
					values: transactionInternalId
				});
				openTaskQuery.columns = [
					openTaskQuery.createColumn({
						fieldId: 'id'
					})]
				openTaskQuery.condition = openTaskQuery.and(
					statusFlagCondition,tasktypeCondition,locationCondition,inActiveCondition,orderInternalIdCondition);
				var moveTaskResults = openTaskQuery.run().asMappedResults();
				if(moveTaskResults !=null && moveTaskResults.length>0){
					for (var index in moveTaskResults) {
						var openTaskInternalId = moveTaskResults[index].id;
						if(utility.isValueValid(openTaskInternalId)) {
							record.delete({
								type: 'customrecord_wmsse_trn_opentask',
								id: openTaskInternalId
							});
						}
					}
				}
			}
			catch(exp){
				log.error('Exception in deleteMove Task',exp)
			}
		}
		return{
			'post' : doPost
		};
	});