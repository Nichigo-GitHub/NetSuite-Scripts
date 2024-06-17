/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['./wms_utility','N/search','N/record','N/query','./wms_outBoundUtility','N/config','N/runtime','./big'],
	function (utility,search,record, query, obUtility,config,runtime,Big) {


	function validateTransaction(transactionInputObj){

		transactionInputObj.actionType  = 'validation';
		transactionInputObj.transaction = 'order';
		var validationObj = {};
		var tranDetails = getPickTaskLines(transactionInputObj);

		validationObj.isReversalLinesExist 	= false;

		if(tranDetails.length == 0){
			transactionInputObj.transaction = 'wave';
			tranDetails = getPickTaskLines(transactionInputObj);
			if(tranDetails.length > 0)
			{
				validationObj.transaction 			= 'wave';
				validationObj.isReversalLinesExist 	= true;
				validationObj.waveNumber = tranDetails[0].wavenameText;
			}
		}
		else{
			validationObj.transaction 			= 'order';
			validationObj.isReversalLinesExist  = true;
			validationObj.waveNumber 			= tranDetails[0].wavenameText;
		}
		return validationObj;	
	}

	function getPickTaskLines(transactionInputObj){

		var pickTaskLines  = [];
		var ignorePickTasksearch = false;
		var pickTaskSearch = search.load({id : 'customsearch_wms_picktask_lines_reversal'});

		pickTaskSearch.filters.push(search.createFilter({
			name 	: 'location',
			operator: search.Operator.ANYOF,
			values 	: transactionInputObj.whLocationId
		}));
		if(transactionInputObj.transactionType=='SalesOrder'){
			pickTaskSearch.filters.push(search.createFilter({
				name 	: 'transactiontype',
				operator: search.Operator.IS,
				values 	: 'SalesOrd'
			}));		
		}
		else if(transactionInputObj.transactionType=='TransferOrder'){
			pickTaskSearch.filters.push(search.createFilter({
				name 	: 'transactiontype',
				operator: search.Operator.IS,
				values 	: 'TrnfrOrd'
			}));			
		}
		if(utility.isValueValid(transactionInputObj.transactionNumber) && transactionInputObj.transaction=='order'){
			pickTaskSearch.filters.push(search.createFilter({
				name 	: 'truedocnumber',
				join 	: 'transaction',
				operator: search.Operator.IS,
				values 	: transactionInputObj.transactionNumber
			}));			
		}
		else if(utility.isValueValid(transactionInputObj.transactionNumber) && transactionInputObj.transaction=='wave'){
			var waveRes = obUtility.getWaveInternalId(transactionInputObj.transactionNumber,transactionInputObj.whLocationId);

			if(waveRes.length>0){
				pickTaskSearch.filters.push(search.createFilter({
					name : 'wavename',
					operator : search.Operator.ANYOF,
					values : waveRes[0].internalid
				}));				
			}
			else{
				ignorePickTasksearch = true;
			}
		}

		if(transactionInputObj.actionType == 'validation'){
			pickTaskLines = utility.getSearchResultInJSONForValidation(pickTaskSearch);
		}
		else if(!ignorePickTasksearch){
			pickTaskLines = utility.getSearchResultInJSON(pickTaskSearch);
		}

		return pickTaskLines;
	}

	function getPickActionId(pickTaskInputObj){
		var pickActionIdarr = [];

		var pickTaskId = pickTaskInputObj.pickTaskId;
		var warehouseLocationId = pickTaskInputObj.warehouseLocationId;
		var transactionId = pickTaskInputObj.orderId;

		var pickTaskSearch =  query.create({type: query.Type.PICK_TASK});
		var nameCond = pickTaskSearch.createCondition({
			fieldId	: 'name',
			operator: query.Operator.ANY_OF,
			values	: pickTaskId
		});
		var locCond = pickTaskSearch.createCondition({
			fieldId	: 'location',
			operator: query.Operator.ANY_OF,
			values	: warehouseLocationId
		});
		var pickActionStatusCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.status',
			operator: query.Operator.ANY_OF,
			values: ['STARTED','PICKED','STAGED','DONE','FAILED']				
		});
		var pickActionTranNumCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.ordernumber',
			operator: query.Operator.ANY_OF,
			values: transactionId
		});

		var pickActionsFieldsJoin = pickTaskSearch.autoJoin({
			fieldId: 'pickactions'
		});

		pickTaskSearch.columns = [
			pickActionsFieldsJoin.createColumn({
				fieldId: 'id'
			})
			];

		pickTaskSearch.condition = pickTaskSearch.and(nameCond,locCond,pickActionStatusCond,pickActionTranNumCond);	

		var pickActionResultSet = pickTaskSearch.run().results;
		var pickActnResLength   = pickActionResultSet.length;

		for(var count=0; count < pickActnResLength; count++){
			var queryData = pickActionResultSet[count].values;

			if(pickActionIdarr.indexOf(queryData[0])==-1){
				pickActionIdarr.push(queryData[0]);
			}
		}
		return pickActionIdarr;
	}	

	function submitReversal(pickTaskInputObj){

		var pickActionLineLookup = {};
		var pickActionId 	  = '';
		var orderLine    	  = '';
		var pickActionIdarr   = [];
		var reversalInputObj  = {};
		var lineIndextoUpdate = '';
   		var itemType      = '';
		var pickTaskDetailsObject={};
		var unitsOfMeasureFeature =false;

		var pickTaskId 				= pickTaskInputObj.pickTaskId;
		var warehouseLocationId 	= pickTaskInputObj.warehouseLocationId;
		var selectedPickActionLine	=  pickTaskInputObj.pickActionLineNumber;
		var selectedPickActionLineStatus = pickTaskInputObj.pickActionLineStatus;
		var itemInternalId			= pickTaskInputObj.itemInternalId;
		var locUseBinsFlag			= pickTaskInputObj.locUseBinsFlag;
		var subItemOf				= pickTaskInputObj.subItemOf;
		var kitItemLineNumber		= pickTaskInputObj.kitItemLineNumber;

		pickActionIdarr = getPickActionId(pickTaskInputObj);

		var pickActionIdarrLength = pickActionIdarr.length;

		var pickTaskRecord = record.load({
			type: 'picktask',
			id 	: pickTaskId
		});

		var pickActionCount = pickTaskRecord.getLineCount({
			sublistId: 'pickactions'
		});		

		if(utility.isValueValid(itemInternalId)) {
			var itemLookUp = search.lookupFields({
				type: search.Type.ITEM,
				id: itemInternalId,
				columns: ['recordtype']
			});
			if (utility.isValueValid(itemLookUp) && utility.isValueValid(itemLookUp.recordtype)) {
				itemType = itemLookUp.recordtype;
			}
		}
		for(var pickActnItr = 0; pickActnItr < pickActionCount;pickActnItr++){
			pickActionId = pickTaskRecord.getSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'id',
				line	  : pickActnItr
			});
			orderLine = pickTaskRecord.getSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'linenumber',
				line	  : pickActnItr
			});
			pickActionLineLookup[pickActionId] = {'lineNumber': pickActnItr , 'orderLine':orderLine};
		}

		for(var index=0; index < pickActionIdarrLength; index++){
			if(pickActionLineLookup[pickActionIdarr[index]].orderLine == selectedPickActionLine) {

				lineIndextoUpdate = pickActionLineLookup[pickActionIdarr[index]].lineNumber;

				reversalInputObj.pickaAtionStatus 		= selectedPickActionLineStatus;
				reversalInputObj.pickActionLine 		= lineIndextoUpdate;
				reversalInputObj.warehouseLocationId 	= warehouseLocationId;
				reversalInputObj.orderLine 				= pickActionLineLookup[pickActionIdarr[index]].orderLine;
				reversalInputObj.itemInternalId 		= itemInternalId;
				reversalInputObj.pickTaskId 			= pickTaskId;
				reversalInputObj.locUseBinsFlag	 		= locUseBinsFlag;
				reversalInputObj.subItemOf 				= subItemOf;
				reversalInputObj.kitItemLineNumber 		= kitItemLineNumber;
				reversalInputObj.KitComponentPickTaskArr= pickTaskInputObj.KitComponentPickTaskArr;
				reversalInputObj.itemType 				= itemType;
				reversalInputObj.toBinIternalId 		= pickTaskInputObj.toBinIternalId;
				reversalInputObj.inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
					var itemFulfillmentId = pickTaskRecord.getSublistValue({
						sublistId: 'pickactions',
						fieldId	 : 'transactionnumber',
						line 	 : reversalInputObj.pickActionLine
					});
				if(pickTaskInputObj.isBintransferRequired == true) {
					unitsOfMeasureFeature = runtime.isFeatureInEffect({
						feature: 'unitsofmeasure'
					});
					if(utility.isValueValid(subItemOf) && utility.isValueValid(kitItemLineNumber)) {
						var KitComponentPickTaskArray =pickTaskInputObj.KitComponentPickTaskArr;
						var kitComponentArrlength = KitComponentPickTaskArray.length;
						for (var kitComponentItr = 0; kitComponentItr < kitComponentArrlength; kitComponentItr++) {
							var kitCompPickTaskLineObj = KitComponentPickTaskArray[kitComponentItr];
							var kitComponentPickTaskId =kitCompPickTaskLineObj.id;
							var pickTaskItemId =kitCompPickTaskLineObj.item;
							var kitComponentPickTaskRecord = record.load({
								type: 'picktask',
								id 	:kitComponentPickTaskId
							});
							if(utility.isValueValid(pickTaskItemId)) {
								this.getItemLookupDetails(pickTaskItemId,kitComponentPickTaskRecord,reversalInputObj,unitsOfMeasureFeature);
							}
							if(!(utility.nonInventoryItemTypeCheck(reversalInputObj.itemType))) {
							reversalInputObj.pickActionLine = this.toGetPickActionIdForKit(kitComponentPickTaskRecord,kitComponentPickTaskId,kitCompPickTaskLineObj);
							var pickTaskInventoryDetArray = this.getInventoryDetailsofPickTask(kitComponentPickTaskRecord, reversalInputObj);
							pickTaskDetailsObject[kitComponentPickTaskId] = {
								'itemId': pickTaskItemId,
								'warehouseId': reversalInputObj.warehouseLocationId,
								'pickQuantity': reversalInputObj.pickedquantity,
								'itemType':reversalInputObj.itemType,
									'inventoryDetails': pickTaskInventoryDetArray,
									'transactionUOMConvRate': reversalInputObj.transactionUOMConvRate,
									'stockConversionRate': reversalInputObj.stockConversionRate
							};
							}
						}
						}
						else {
							var IFPerOrderValue = utility.getIFPerOrder();
							log.debug('IFPerOrderValue', IFPerOrderValue);
							if (utility.isValueValid(IFPerOrderValue)) {
								if (IFPerOrderValue == 'PERORDER') {
									perOrderpickTaskDetails = getAllPickTaskwithsameIF(itemFulfillmentId);

								}
							}
							log.debug('perOrderpickTaskDetails',perOrderpickTaskDetails);
							if (perOrderpickTaskDetails.length > 1) {

								for(var perOrderItr = 0; perOrderItr < perOrderpickTaskDetails.length; perOrderItr++){
									var pickTaskInputObjperOrder = {};
									pickTaskInputObjperOrder.pickTaskId = perOrderpickTaskDetails[perOrderItr].values[0];
									pickTaskInputObjperOrder.warehouseLocationId = warehouseLocationId;
									pickTaskInputObjperOrder.orderId = perOrderpickTaskDetails[perOrderItr].values[1];
									var perOrderPickTaskId = perOrderpickTaskDetails[perOrderItr].values[0];

									pickActionIdarrPerOrder = getPickActionId(pickTaskInputObjperOrder);

									var pickActionIdarrLength = pickActionIdarrPerOrder.length;

									var pickTaskRecordPerOrder = record.load({
										type: 'picktask',
										id: perOrderPickTaskId
									});

									var pickActionCount = pickTaskRecordPerOrder.getLineCount({
										sublistId: 'pickactions'
									});

									var pickTaskItem = pickTaskRecordPerOrder.getValue({fieldId: 'item'});

									if (utility.isValueValid(pickTaskItem)) {
										this.getItemLookupDetails(pickTaskItem,pickTaskRecordPerOrder,reversalInputObj,unitsOfMeasureFeature);
									}
									if(!(utility.nonInventoryItemTypeCheck(reversalInputObj.itemType))) {
									for (var pickActnItr = 0; pickActnItr < pickActionCount; pickActnItr++) {
										pickActionId = pickTaskRecordPerOrder.getSublistValue({
											sublistId: 'pickactions',
											fieldId: 'id',
											line: pickActnItr
										});
										orderLine = pickTaskRecordPerOrder.getSublistValue({
											sublistId: 'pickactions',
											fieldId: 'linenumber',
											line: pickActnItr
										});

										pickActionLineLookup[pickActionId] = {
											'lineNumber': pickActnItr,
											'orderLine': orderLine
										};
									}

									for (var indexPerOrder = 0; indexPerOrder < pickActionIdarrLength; indexPerOrder++) {
										if (pickActionLineLookup[pickActionIdarrPerOrder[indexPerOrder]].orderLine == perOrderpickTaskDetails[perOrderItr].values[3]) {

											lineIndextoUpdate = pickActionLineLookup[pickActionIdarrPerOrder[indexPerOrder]].lineNumber;
											reversalInputObj.pickActionLine = lineIndextoUpdate;
											var pickTaskInventoryDetArray = this.getInventoryDetailsofPickTask(pickTaskRecordPerOrder, reversalInputObj);
											pickTaskDetailsObject[perOrderPickTaskId] = {
												'itemId': pickTaskItem,
												'warehouseId': reversalInputObj.warehouseLocationId,
												'pickQuantity': reversalInputObj.pickedquantity,
												'itemType': reversalInputObj.itemType,
													'inventoryDetails': pickTaskInventoryDetArray,
													'transactionUOMConvRate': reversalInputObj.transactionUOMConvRate,
													'stockConversionRate': reversalInputObj.stockConversionRate
												};

											}
										}
									}
								}

							}
							else
							{
								if(utility.isValueValid(reversalInputObj.itemInternalId)) {
									this.getItemLookupDetails(reversalInputObj.itemInternalId,pickTaskRecord,reversalInputObj,unitsOfMeasureFeature);								
								}
								if(!(utility.nonInventoryItemTypeCheck(reversalInputObj.itemType))) {
						var pickTaskInventoryDetArray = this.getInventoryDetailsofPickTask(pickTaskRecord, reversalInputObj);
						pickTaskDetailsObject[pickTaskId] = {
							'itemId': reversalInputObj.itemInternalId,
							'warehouseId': reversalInputObj.warehouseLocationId,
							'pickQuantity': reversalInputObj.pickedquantity,
							'itemType':reversalInputObj.itemType,
										'inventoryDetails': pickTaskInventoryDetArray,
										'transactionUOMConvRate': reversalInputObj.transactionUOMConvRate,
										'stockConversionRate': reversalInputObj.stockConversionRate
									};
								}
					}
				}
					}
				updatePickTask(pickTaskRecord, reversalInputObj);
				if(pickTaskInputObj.isBintransferRequired == true && Object.keys(pickTaskDetailsObject).length>0) {
					var binTransferRecordId = this.binTransferForpickReversal(pickTaskDetailsObject,reversalInputObj);
					log.debug('binTransferRecordId',binTransferRecordId);
				}
				break;
			}
		}
		return true;
	}

	function toGetPickActionIdForKit(vPickTaskRec,pickTaskId,kitCompPickTaskLineObj){
		var lineIndextoUpdate ='';
		var pickTaskInputObj ={};
		var pickActionLineLookup = {};
		var orderLine='';
		var pickActionsId='';
		var vpickActionCount = vPickTaskRec.getLineCount({
			sublistId: 'pickactions'
		});

		for(var itr = 0; itr < vpickActionCount; itr++){
			pickActionsId = vPickTaskRec.getSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'id',
				line	  : itr
			});
			orderLine = vPickTaskRec.getSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'linenumber',
				line	  : itr
			});
			pickActionLineLookup[pickActionsId] = {'lineNumber': itr , 'orderLine':orderLine};
		}
		pickTaskInputObj.pickTaskId 		 = pickTaskId;
		pickTaskInputObj.warehouseLocationId = kitCompPickTaskLineObj.location;
		pickTaskInputObj.orderId 		   	 = kitCompPickTaskLineObj.internalid;
		var pickActionIdarr = getPickActionId(pickTaskInputObj);
		var pickActionIdarrLength = pickActionIdarr.length;
		for(var index=0; index < pickActionIdarrLength; index++) {
			if (pickActionLineLookup[pickActionIdarr[index]].orderLine == kitCompPickTaskLineObj.line) {
				lineIndextoUpdate = pickActionLineLookup[pickActionIdarr[index]].lineNumber;
			}
		}
		return lineIndextoUpdate;
	}


	function updatePickTask(pickTaskRecord, reversalInputObj){

		var itemMatch 	= false;
		var isIFUpdated = false;
		var pickaAtionStatus 	= reversalInputObj.pickaAtionStatus;	            
		var pickActionLine 		= reversalInputObj.pickActionLine;	            
		var warehouseLocationId = reversalInputObj.warehouseLocationId;        
		var orderLine 		   	= reversalInputObj.orderLine;	                
		var itemInternalId 		= reversalInputObj.itemInternalId;
		var pickTaskId 			= reversalInputObj.pickTaskId;	                
		var locUseBinsFlag	 	= reversalInputObj.locUseBinsFlag; 		            
		var subItemOf 			= reversalInputObj.subItemOf;		                
		var kitItemLineNumber 	= reversalInputObj.kitItemLineNumber; 		    
		var KitComponentPickTaskArr = reversalInputObj.KitComponentPickTaskArr;
		var itemType			=reversalInputObj.itemType;
		var kitComponentArrlength = 0;
		var packContainer = '';
var perOrderpickTaskDetails=[];
		var itemFulfillmentId = pickTaskRecord.getSublistValue({
			sublistId: 'pickactions',
			fieldId	 : 'transactionnumber', 
			line 	 : pickActionLine
		});

		log.debug('itemFulfillmentId :', itemFulfillmentId);
		log.debug('pickaAtionStatus before update status to DONE :', pickaAtionStatus);

		if(pickaAtionStatus == 'DONE' && utility.isValueValid(itemFulfillmentId)){

			var IFPerOrderValue = utility.getIFPerOrder();
			log.debug('IFPerOrderValue', IFPerOrderValue);
			if(utility.isValueValid(IFPerOrderValue)) {
				if (IFPerOrderValue == 'PERORDER') {
					perOrderpickTaskDetails = getAllPickTaskwithsameIF(itemFulfillmentId);

				}
			}
log.debug('perOrderpickTaskDetails',perOrderpickTaskDetails);
			var itemFulfillmentRec = record.load({
				type: 'itemfulfillment',
				id : itemFulfillmentId
			});

			var itemFulfillmentStatus = itemFulfillmentRec.getValue({
				fieldId: 'statusRef'
			});
			var vItmSubListCount = itemFulfillmentRec.getLineCount({sublistId:'item'});

			if(itemFulfillmentStatus == 'picked' || itemFulfillmentStatus == 'packed')
			{
				var itemFulfillmentkitItemsCountArr =[];
				var itemFulfillmentkitItemsCount = 0;
				var packContainerArray = [];

				if(itemFulfillmentStatus == 'packed' && utility.isValueValid(subItemOf))
				{
					kitComponentArrlength = KitComponentPickTaskArr.length;
					
					for(var itemFulItrShipmanifest=0; itemFulItrShipmanifest < vItmSubListCount; itemFulItrShipmanifest++)
					{						
						var iFLine = itemFulfillmentRec.getSublistValue({
							sublistId:'item',
							fieldId: 'orderline',
							line: itemFulItrShipmanifest
						});
						var iFItemType = itemFulfillmentRec.getSublistValue({
							sublistId:'item',
							fieldId: 'itemtype',
							line: itemFulItrShipmanifest
						});
						var compKitmember = itemFulfillmentRec.getSublistValue({
							sublistId:'item',
							fieldId: 'kitmemberof',
							line: itemFulItrShipmanifest
						});
												
						if(iFItemType != 'Kit' && utility.isValueValid(compKitmember))
						{							
							for(var itemListItr=0; itemListItr < kitComponentArrlength; itemListItr++)
							{								
								if(parseInt(iFLine) == parseInt(KitComponentPickTaskArr[itemListItr].line) &&
										parseInt(kitItemLineNumber) == parseInt(KitComponentPickTaskArr[itemListItr].kititemorderlinenumber))
								{
									var compSubRec = itemFulfillmentRec.getSublistSubrecord({
										sublistId :'item',
										fieldId : 'inventorydetail',
										line : itemFulItrShipmanifest
									});

									var compSubRecCnt = compSubRec.getLineCount({
										sublistId :'inventoryassignment'
									});

									for(var compSubRecItr=0; compSubRecItr<compSubRecCnt; compSubRecItr++)
									{
										packContainer = compSubRec.getSublistValue({
											sublistId : 'inventoryassignment',
											fieldId : 'custrecord_wmsse_packing_container',
											line : compSubRecItr
										});
										if(utility.isValueValid(packContainer))
										{
											if(packContainerArray.indexOf(packContainer) == -1)
											{
												packContainerArray.push(packContainer);
											}

										}
									}
								}
							}
						}
					}
				}

				for(var itemFulItr=0; itemFulItr < vItmSubListCount; itemFulItr++)
				{
					var vItemId	= itemFulfillmentRec.getSublistValue({
						sublistId: 'item',
						fieldId  : 'item', 
						line     : itemFulItr
					});						
					var itemFulfillmentLine = itemFulfillmentRec.getSublistValue({sublistId:'item',fieldId: 'orderline',line: itemFulItr});
					var itemFulfillmentItemType = itemFulfillmentRec.getSublistValue({sublistId:'item',fieldId: 'itemtype',line: itemFulItr});

					//Kit Changes
					if(itemFulfillmentItemType=='Kit' && vItemId==subItemOf && itemFulfillmentLine == kitItemLineNumber){
						var boolKitItemFoundInIF = false;
						var otherItemsInIF=false;
						var kitItemIndex = -1;

						for(var kitItr = 0; kitItr < vItmSubListCount; kitItr++)
						{
							var itemType= itemFulfillmentRec.getSublistValue({sublistId:'item',fieldId: 'itemtype',line: kitItr});
							var kitmember= itemFulfillmentRec.getSublistValue({sublistId:'item',fieldId: 'kitmemberof',line: kitItr});
							if(itemType!='Kit' && !utility.isValueValid(kitmember))
							{
								otherItemsInIF = true;
							}
							if(itemType=='Kit' && !utility.isValueValid(kitmember))
							{												
								itemFulfillmentkitItemsCountArr.push(itemFulfillmentkitItemsCount++);
							}

							var iFItemId = itemFulfillmentRec.getSublistValue({
								sublistId: 'item',
								fieldId: 'item', 
								line : kitItr
							});

							var iFItemLine = itemFulfillmentRec.getSublistValue({sublistId:'item',fieldId: 'orderline',line: kitItr});

							if(iFItemId == subItemOf && parseInt(iFItemLine) == parseInt(kitItemLineNumber))
							{
								boolKitItemFoundInIF = true;
								kitItemIndex = kitItr;
							}
						}							

						if(boolKitItemFoundInIF)
						{
							var packContainerArrlength = packContainerArray.length;
							var itemFulflmntShipmanifest = [];
							if(otherItemsInIF || itemFulfillmentkitItemsCountArr.length > 1)
							{
								itemFulfillmentRec.setSublistValue({
									sublistId: 'item',
									fieldId: 'itemreceive',
									line : kitItemIndex,
									value : false
								});
								itemFulfillmentRec.save();
								isIFUpdated = true;											

								if(packContainerArrlength)
								{
									for(var pckContrItr=0; pckContrItr<packContainerArrlength; pckContrItr++)
									{
										itemFulflmntShipmanifest = getItemFulflmentResultsForKit(packContainerArray[pckContrItr], warehouseLocationId);

										if(itemFulflmntShipmanifest.length==0)
										{
											deleteShipManifestRecord(packContainerArray[pckContrItr], warehouseLocationId);
										}														
									}
								}
							}
							else
							{
								record.delete({
									type : 'itemfulfillment',
									id : itemFulfillmentId
								});
								isIFUpdated = true;

								if(packContainerArrlength)
								{
									for(var packContrItr=0; packContrItr<packContainerArrlength; packContrItr++)
									{
										itemFulflmntShipmanifest = getItemFulflmentResultsForKit(packContainerArray[packContrItr], warehouseLocationId);

										if(itemFulflmntShipmanifest.length==0 && itemFulfillmentkitItemsCountArr.length==1)
										{
											deleteShipManifestRecord(packContainerArray[packContrItr], warehouseLocationId);
										}														
									}
								}
							}
						}
					}

					//Normal items - other than kit components
					if(vItemId == itemInternalId && itemFulfillmentLine == orderLine && !utility.isValueValid(subItemOf)){
						itemMatch = true;

						if(itemFulfillmentStatus == 'packed')
						{
							var	compSubRecord = itemFulfillmentRec.getSublistSubrecord({
								sublistId:'item',
								fieldId  : 'inventorydetail',
								line     : itemFulItr
							});

							var compSubRecordCnt = compSubRecord.getLineCount({
								sublistId :'inventoryassignment'
							});

							for(var compSubItr=0; compSubItr<compSubRecordCnt; compSubItr++)
							{
								packContainer = compSubRecord.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId   : 'packcarton',
									line 	  : compSubItr
								});	

								if(utility.isValueValid(packContainer))
								{
									var vItemFulflmnt = getItemFulflmentResults(packContainer, warehouseLocationId);

									if(vItemFulflmnt.length==1)
									{
										deleteShipManifestRecord(packContainer, warehouseLocationId);
									}											
								}
							}
						}							

						//if(vItmSubListCount == 1)
						//{
							record.delete({
								type: 'itemfulfillment',
								id 	: itemFulfillmentId
							});
							isIFUpdated = true;
						//}
						/*else
						{
							itemFulfillmentRec.setSublistValue({
								sublistId: 'item',
								fieldId: 'itemreceive',
								line : itemFulItr,
								value : false
							});
							itemFulfillmentRec.save();
							isIFUpdated = true;
						}*/
					}
					if(itemMatch==true)
						break;
				}


				}
				var vPickTaskRec = record.load({
					type: 'picktask',
					id 	: pickTaskId
				});

				itemFulfillmentId= vPickTaskRec.getSublistValue({
					sublistId: 'pickactions',
					fieldId	 : 'transactionnumber', 
					line 	 : pickActionLine
				});

				var pickActionSynchStatus = vPickTaskRec.getSublistValue({
					sublistId: 'pickactions',
					fieldId	 : 'completedsync', 
					line 	 : pickActionLine
				});

				if(isIFUpdated == true && !utility.isValueValid(itemFulfillmentId) && pickActionSynchStatus==true)
				{
					if(utility.isValueValid(subItemOf) && utility.isValueValid(kitItemLineNumber)){
						kitComponentArrlength = KitComponentPickTaskArr.length;

						var KitActionType = 'stage';
						for(var kitCompItr=0; kitCompItr<kitComponentArrlength; kitCompItr++){
							if(KitComponentPickTaskArr[kitCompItr].lineitemstatus == 'DONE'){
								updateKitCompPickTaskLinesToStage(KitComponentPickTaskArr[kitCompItr], locUseBinsFlag,KitActionType);
							}	
						}

						KitActionType = 'done';
						for(var compItr=0; compItr<kitComponentArrlength; compItr++){
							updateKitCompPickTaskLinesToStage(KitComponentPickTaskArr[compItr], locUseBinsFlag,KitActionType);
						}						
					}
					else{

					//trying to fetch nof.of picktasks associated with single IF.
						if(perOrderpickTaskDetails.length > 1)
						{
							var perOrderActionType = 'stage';
							for(var itr = 0; itr < perOrderpickTaskDetails.length; itr++){

								if(perOrderpickTaskDetails[itr].values[2] == 'DONE'){
									updatePickTaskLinesToStage(perOrderpickTaskDetails[itr],warehouseLocationId,locUseBinsFlag,perOrderActionType);
								}
							}



							perOrderActionType = 'done';
							for(var itr = 0; itr < perOrderpickTaskDetails.length; itr++){

								updatePickTaskLinesToStage(perOrderpickTaskDetails[itr],warehouseLocationId,locUseBinsFlag,perOrderActionType);
							}
						}
					else
						{
							updateStatusToDone(pickTaskId,pickTaskRecord,pickActionLine, warehouseLocationId,locUseBinsFlag,pickaAtionStatus,itemType);
						}

					}
				}

		}
		else
		{
			if(utility.isValueValid(subItemOf) && utility.isValueValid(kitItemLineNumber)){
				kitComponentArrlength = KitComponentPickTaskArr.length;
				
				for(var kitComponentItr=0; kitComponentItr<kitComponentArrlength; kitComponentItr++){
					if(KitComponentPickTaskArr[kitComponentItr].lineitemstatus == 'DONE'){
						updateKitCompPickTaskLinesToStage(KitComponentPickTaskArr[kitComponentItr], locUseBinsFlag);
					}	
				}
				for(var componentItr=0; componentItr<kitComponentArrlength; componentItr++){
					if(KitComponentPickTaskArr[componentItr].lineitemstatus != 'DONE'){
						updateKitCompPickTaskLinesToStage(KitComponentPickTaskArr[componentItr], locUseBinsFlag);
					}
				}				
			}
			else
			{
				updateStatusToDone(pickTaskId,pickTaskRecord,pickActionLine, warehouseLocationId,locUseBinsFlag,pickaAtionStatus,itemType);
			}
		}

	}

	function updateStatusToDone(pickTaskId,pickTaskRecord,pickActionLine, warehouseLocationId,locUseBinsFlag,pickaAtionStatus,itemType) {

		if (pickaAtionStatus == 'DONE' || pickaAtionStatus == 'FAILED'){
			if(locUseBinsFlag){
				pickTaskRecord.setSublistValue({
					sublistId : 'pickactions',
					fieldId	  : 'status',
					line 	  : pickActionLine,
					value	  : 'STAGED'
				});
				pickTaskRecord.save();					
			}
			else{
				pickTaskRecord.setSublistValue({
					sublistId : 'pickactions',
					fieldId	  : 'status',
					line 	  : pickActionLine,
					value	  : 'PICKED'
				});
				pickTaskRecord.save();					
			}
		}
		pickTaskRecord.setSublistValue({
			sublistId : 'pickactions',
			fieldId	  : 'pickedquantity',
			line 	  : pickActionLine,
			value	  : 0
		});
		pickTaskRecord.save();

		if(itemType !='noninventoryitem' && itemType !='serviceitem'){
		var pickActionStageBin = pickTaskRecord.getSublistValue({
			sublistId: 'pickactions',
			fieldId: 'stagingbin', 
			line : pickActionLine
		});

		if(utility.isValueValid(pickActionStageBin)){
			pickTaskRecord.setSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'stagingbin',
				line 	  : pickActionLine,
				value	  : ''
			});
			pickTaskRecord.save();

			pickTaskRecord = record.load({type:'picktask',
				id: pickTaskId
			});

			pickTaskRecord.setSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'stagingbin',
				line 	  : pickActionLine,
				value	  : pickActionStageBin
			});
			pickTaskRecord.save();
		}
	}
		if((pickaAtionStatus == 'STARTED' || pickaAtionStatus == 'PICKED') && locUseBinsFlag==true &&
			itemType !='noninventoryitem' && itemType !='serviceitem'){
			updateStageBin(pickTaskRecord,pickActionLine, warehouseLocationId);
		}

		pickTaskRecord.setSublistValue({
			sublistId : 'pickactions',
			fieldId	  : 'status',
			line 	  : pickActionLine,
			value	  : 'DONE'
		});
		pickTaskRecord.save();			
	}	

	function updateStageBin(pickTaskRecord,pickActionLine, whLocation){
		var stageBinId = '';
		var binSearch = search.load('customsearch_wmsse_pickstagebin_validate');
		binSearch.filters.push(search.createFilter({
			name : 'location',
			operator : search.Operator.ANYOF,
			values : whLocation
		}));
		var binResults = utility.getSearchResultInJSON(binSearch);

		if(binResults.length > 0){
			stageBinId = binResults[0].internalid;

			pickTaskRecord.setSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'stagingbin', 
				line 	  : pickActionLine,
				value	  : stageBinId
			});
			pickTaskRecord.save();
		}		
	}

	function getItemFulflmentResults(packContainer, whLocation){

		var pickTaskSearch = search.load({id : 'customsearch_wms_invtdtl_pickrvrse'});

		pickTaskSearch.filters.push(search.createFilter({
			name : 'packcarton',
			operator : search.Operator.IS,
			values : packContainer
		}));

		return utility.getSearchResultInJSON(pickTaskSearch);
	}
		

	function getShipmanifestResults(packContainer, whLocation){

		var pickTaskSearch = search.load({id : 'customsearch_wms_shipmanifest_rcrd'});

		pickTaskSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_ship_contlp',
			operator : search.Operator.IS,
			values : packContainer
		}));		
		return utility.getSearchResultInJSON(pickTaskSearch);
	}

	function deleteShipManifestRecord(packContainer, whLocation)
	{
		var shipManifestRes = getShipmanifestResults(packContainer, whLocation);
		var shipManifestReslength = shipManifestRes.length;
		var vShipManifestRecId = '';

		for(var shipManifestItr=0; shipManifestItr < shipManifestReslength; shipManifestItr++)
		{
			vShipManifestRecId = shipManifestRes[shipManifestItr].internalid;

			record.delete({
				type : 'customrecord_wmsse_ship_manifest',
				id : vShipManifestRecId
			});
		}	

	}

	function getKitComponentPickTasks(transactionInputObj){
		
		var kitCompSearch = 'customsearch_wms_picktask_lines_reversal';
		
		if(utility.isValueValid(transactionInputObj.action) && transactionInputObj.action=='componentList'){
			kitCompSearch = 'customsearch_wms_picktask_kit_invdtl_rev';
		}
		
		var pickTasksSearch = search.load({id : kitCompSearch});
		
		pickTasksSearch.filters.push(search.createFilter({
			name 	: 'location',
			operator: search.Operator.ANYOF,
			values 	: transactionInputObj.warehouseLocationId
		}));
		if(transactionInputObj.transactionType=='SalesOrder'){
			pickTasksSearch.filters.push(search.createFilter({
				name 	: 'transactiontype',
				operator: search.Operator.IS,
				values 	: 'SalesOrd'
			}));		
		}
		else if(transactionInputObj.transactionType=='TransferOrder'){
			pickTasksSearch.filters.push(search.createFilter({
				name 	: 'transactiontype',
				operator: search.Operator.IS,
				values 	: 'TrnfrOrd'
			}));			
		}
		if(utility.isValueValid(transactionInputObj.orderId)){
			pickTasksSearch.filters.push(search.createFilter({
				name 	: 'internalid',
				join 	: 'transaction',
				operator: search.Operator.IS,
				values 	: transactionInputObj.orderId
			}));			
		}
		pickTasksSearch.filters.push(search.createFilter({
			name 	: 'lineitemsubitemof',
			operator: search.Operator.IS,
			values 	: transactionInputObj.subItemOf
		}));
		pickTasksSearch.filters.push(search.createFilter({
			name 	: 'kititemorderlinenumber',
			operator: search.Operator.EQUALTO,
			values 	: transactionInputObj.kitItemLineNumber
		}));

		return utility.getSearchResultInJSON(pickTasksSearch);
	}
	
	function getItemFulflmentResultsForKit(packContainer, whLocation){

		var pickTaskSearch = search.load({id : 'customsearch_wmsse_invtdtl_kit_pickrvrse'});
		pickTaskSearch.filters.push(search.createFilter({
			name : 'packcarton',
			operator : search.Operator.IS,
			values : packContainer
		}));		

		return utility.getSearchResultInJSON(pickTaskSearch);
	}	

	function getPickTaskInvDetails(pickTaskInputObj)
	{
		var pickTaskInvDtlSrch = search.load({id : 'customsearch_wms_pickrever_invdetail'});

		pickTaskInvDtlSrch.filters.push(search.createFilter({
			name : 'internalid',
			operator : search.Operator.ANYOF,
			values : pickTaskInputObj.pickTaskId
		}));
		pickTaskInvDtlSrch.filters.push(search.createFilter({
			name : 'internalid',
			join: 'transaction',
			operator : search.Operator.ANYOF,
			values : pickTaskInputObj.orderId
		}));
		pickTaskInvDtlSrch.filters.push(search.createFilter({
			name : 'line',
			join: 'transaction',
			operator : search.Operator.EQUALTO,
			values : parseInt(pickTaskInputObj.pickTaskLineNumber)
		}));

		return utility.getSearchResultInJSON(pickTaskInvDtlSrch);
	}

	function updateKitCompPickTaskLinesToStage(kitCompPickTaskLineObj,locUseBinsFlag,kitActionType){

		var pickActionLineLookup = {};
		var lineIndextoUpdate = '';
		var pickActionsId='';
		var orderLine='';
		var pickTaskInputObj = {};

		var pickTaskId = kitCompPickTaskLineObj.id;

		var vPickTaskRec = record.load({
			type: 'picktask',
			id 	: pickTaskId
		});

		var vpickActionCount = vPickTaskRec.getLineCount({
			sublistId: 'pickactions'
		});

		for(var itr = 0; itr < vpickActionCount; itr++){
			pickActionsId = vPickTaskRec.getSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'id',
				line	  : itr
			});
			orderLine = vPickTaskRec.getSublistValue({
				sublistId : 'pickactions',
				fieldId	  : 'linenumber',
				line	  : itr
			});
			pickActionLineLookup[pickActionsId] = {'lineNumber': itr , 'orderLine':orderLine};
		}

		pickTaskInputObj.pickTaskId 		 = pickTaskId;
		pickTaskInputObj.warehouseLocationId = kitCompPickTaskLineObj.location;
		pickTaskInputObj.orderId 		   	 = kitCompPickTaskLineObj.internalid;

		var pickActionIdarr = getPickActionId(pickTaskInputObj);
		var pickActionIdarrLength = pickActionIdarr.length;

		for(var index=0; index < pickActionIdarrLength; index++){

			if(pickActionLineLookup[pickActionIdarr[index]].orderLine == kitCompPickTaskLineObj.line) {

				lineIndextoUpdate = pickActionLineLookup[pickActionIdarr[index]].lineNumber;

				if(utility.isValueValid(kitActionType) && kitActionType=='stage'){
					if(locUseBinsFlag){
						vPickTaskRec.setSublistValue({
							sublistId: 'pickactions',
							fieldId: 'status',
							line : lineIndextoUpdate,
							value: 'STAGED'
						});

						vPickTaskRec.save();					
					}
					else{
						vPickTaskRec.setSublistValue({
							sublistId: 'pickactions',
							fieldId: 'status',
							line : lineIndextoUpdate,
							value: 'PICKED'
						});

						vPickTaskRec.save();					
					}					
				}
				else{
					updateStatusToDone(pickTaskId,vPickTaskRec,lineIndextoUpdate, kitCompPickTaskLineObj.location,locUseBinsFlag,kitCompPickTaskLineObj.lineitemstatus);
				}

				break;
			}
		}
	}

	function getInventoryDetailsofPickTask(pickTaskRecord,reversalInputObj)
	{
		var pickedquantity =0;
		var inventoryDetailsArray =[];
		var pickActionLine = reversalInputObj.pickActionLine;
		  pickedquantity = pickTaskRecord.getSublistValue({
				sublistId: 'pickactions',
				fieldId: 'pickedquantity',
				line: pickActionLine
			});
			reversalInputObj.pickedquantity= pickedquantity;
			var pickTaskinvDetailRecord = pickTaskRecord.getSublistSubrecord({
					sublistId :'pickactions',
					fieldId : 'inventorydetail',
					line : pickActionLine
				});
				var pickTaskInvDtllinelength =pickTaskinvDetailRecord.getLineCount({
					sublistId:'inventoryassignment'
				});

			for(var lineIndex =0 ;lineIndex <pickTaskInvDtllinelength; lineIndex++)
			{
				var invDetObject = {};
				addInventoryDetailLine(pickTaskinvDetailRecord,lineIndex,invDetObject,
					reversalInputObj.itemType,reversalInputObj.inventoryStatusFeature);
				invDetObject.pickedquantity=pickedquantity;
				inventoryDetailsArray.push(invDetObject);
			}
		log.debug('inventoryDetailsArray',inventoryDetailsArray);
		return inventoryDetailsArray;
	}
	function addInventoryDetailLine(pickTaskinvDetailRecord,lineIndex,invDetObject,itemType,inventoryStatusFeature){
		var pickTaskinvDetreceiptNumber="";
		var pickTaskinvDetStatus ="";
		var pickTaskinvDetQuantity = pickTaskinvDetailRecord.getSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'quantity',
			line : lineIndex
		});
		var pickTaskinvDetfromBinId = pickTaskinvDetailRecord.getSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'binnumber',
			line : lineIndex
		});
		if(itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"
			|| itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){

			pickTaskinvDetreceiptNumber = pickTaskinvDetailRecord.getSublistText({
				sublistId : 'inventoryassignment',
				fieldId : 'issueinventorynumber',
				line : lineIndex
			});
		}
		if(inventoryStatusFeature)
		{
			pickTaskinvDetStatus = pickTaskinvDetailRecord.getSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'inventorystatus',
				line : lineIndex
			});
		}

		invDetObject.serialorLot = pickTaskinvDetreceiptNumber;
		invDetObject.statusId = pickTaskinvDetStatus;
		invDetObject.quantity = pickTaskinvDetQuantity;
		invDetObject.fromBinid = pickTaskinvDetfromBinId;
		log.debug('retun invDetObject____',invDetObject);
		return invDetObject;
	}
	function binTransferForpickReversal(pickTaskDetailsObject,reversalInputObj)
	{
		var bintransferRecord ='';
	try {
		log.debug('binTransferForpickReversal', pickTaskDetailsObject);
		var binTransfer = record.create({
			type: record.Type.BIN_TRANSFER,
			isDynamic: true
		});

		for (var pickTaskId in pickTaskDetailsObject) {
			var pickTaskDetials = pickTaskDetailsObject[pickTaskId];
			var pickTaskInventoryDetArray = pickTaskDetials.inventoryDetails;
			var scannedNewBin = true;
			var arrayofFromBin = [];
			for (var lineIndextoCheckBin = 0; lineIndextoCheckBin < pickTaskInventoryDetArray.length; lineIndextoCheckBin++) {
				var pickTaskInvDetails = pickTaskInventoryDetArray[lineIndextoCheckBin];
				var arrayofFromBin = [];
			if(arrayofFromBin.indexOf(pickTaskInvDetails.fromBinid) == -1)
			{
				arrayofFromBin.push(pickTaskInvDetails.fromBinid);
			}
			}
		if(arrayofFromBin.indexOf(reversalInputObj.toBinIternalId) != -1)
		{
			scannedNewBin = false;
		}
if(scannedNewBin === true)
{
			binTransfer.setValue({
				fieldId: 'location',
				value: pickTaskDetials.warehouseId
			});
			binTransfer.selectNewLine({
				sublistId: 'inventory',
			});
			binTransfer.setCurrentSublistValue({
				sublistId: 'inventory',
				fieldId: 'item',
				value: pickTaskDetials.itemId
			});
			var convertedQuantity =pickTaskDetials.pickQuantity;
			if(utility.isValueValid(pickTaskDetials.transactionUOMConvRate) && utility.isValueValid(pickTaskDetials.stockConversionRate)  )
			{				
				convertedQuantity = this.convertPickQuantityInStockUnits(convertedQuantity,pickTaskDetials);
			}
			binTransfer.setCurrentSublistValue({
				sublistId: 'inventory',
				fieldId: 'quantity',
				value: convertedQuantity
			});
			var compSubRecord = binTransfer.getCurrentSublistSubrecord({
				sublistId: 'inventory',
				fieldId: 'inventorydetail'
			});
			for (var lineIndex = 0; lineIndex < pickTaskInventoryDetArray.length; lineIndex++) {
				var pickTaskInvDetails = pickTaskInventoryDetArray[lineIndex];
				log.debug('pickTaskInvDetails.fromBinid', pickTaskInvDetails.fromBinid);
				log.debug('reversalInputObj.toBinIternalId', reversalInputObj.toBinIternalId);
				if (pickTaskInvDetails.fromBinid != reversalInputObj.toBinIternalId) {
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					if (pickTaskDetials.itemType == "lotnumberedinventoryitem" || pickTaskDetials.itemType == "lotnumberedassemblyitem"
						|| pickTaskDetials.itemType == "serializedinventoryitem" || pickTaskDetials.itemType == "serializedassemblyitem") {
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'receiptinventorynumber',
							value: pickTaskInvDetails.serialorLot
						});
					}
					var invDetailsConvertedQuantity =pickTaskInvDetails.quantity;
					if((utility.isValueValid(pickTaskDetials.transactionUOMConvRate) && utility.isValueValid(pickTaskDetials.stockConversionRate)) &&
                        (pickTaskDetials.itemType != "serializedinventoryitem" && pickTaskDetials.itemType != "serializedassemblyitem"))
					{
          		        invDetailsConvertedQuantity = this.convertPickQuantityInStockUnits(invDetailsConvertedQuantity,pickTaskDetials);
					}
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: invDetailsConvertedQuantity
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'binnumber',
						value: pickTaskInvDetails.fromBinid
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'tobinnumber',
						value: reversalInputObj.toBinIternalId
					});
					if (reversalInputObj.inventoryStatusFeature) {
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: pickTaskInvDetails.statusId
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'toinventorystatus',
							value: pickTaskInvDetails.statusId
						});
					}
					compSubRecord.commitLine({sublistId: 'inventoryassignment'});


				}
			}
	binTransfer.commitLine({sublistId: 'inventory'});

		}
		}
		bintransferRecord = binTransfer.save();
		}
		catch(e){
		log.error('Exeception in binTransferForpickReversal',e);
		}
		return bintransferRecord;
	}
  	function updatePickTaskLinesToStage(perOrderPickTaskArray,warehouseLocationId,locUseBinsFlag,kitActionType)
			{

				var pickActionLineLookup = {};
				var lineIndextoUpdate = '';
				var pickActionsId='';
				var orderLine='';
				var pickTaskInputObj = {};

				var pickTaskId = perOrderPickTaskArray.values[0];
                           

				var vPickTaskRec = record.load({
					type: 'picktask',
					id 	: perOrderPickTaskArray.values[0]
				});

				var vpickActionCount = vPickTaskRec.getLineCount({
					sublistId: 'pickactions'
				});

				for(var itr = 0; itr < vpickActionCount; itr++){
					pickActionsId = vPickTaskRec.getSublistValue({
						sublistId : 'pickactions',
						fieldId	  : 'id',
						line	  : itr
					});
					orderLine = vPickTaskRec.getSublistValue({
						sublistId : 'pickactions',
						fieldId	  : 'linenumber',
						line	  : itr
					});
					pickActionLineLookup[pickActionsId] = {'lineNumber': itr , 'orderLine':orderLine};
				}

				pickTaskInputObj.pickTaskId 		 = pickTaskId;
				pickTaskInputObj.warehouseLocationId = warehouseLocationId;
				pickTaskInputObj.orderId 		   	 = perOrderPickTaskArray.values[1];

				var pickActionIdarr = getPickActionId(pickTaskInputObj);
				var pickActionIdarrLength = pickActionIdarr.length;

				for(var index=0; index < pickActionIdarrLength; index++){

					if(pickActionLineLookup[pickActionIdarr[index]].orderLine == perOrderPickTaskArray.values[3]) {

						lineIndextoUpdate = pickActionLineLookup[pickActionIdarr[index]].lineNumber;

						if(utility.isValueValid(kitActionType) && kitActionType=='stage'){
							if(locUseBinsFlag){
								vPickTaskRec.setSublistValue({
									sublistId: 'pickactions',
									fieldId: 'status',
									line : lineIndextoUpdate,
									value: 'STAGED'
								});

								vPickTaskRec.save();

							}
							else{

								vPickTaskRec.setSublistValue({
									sublistId: 'pickactions',
									fieldId: 'status',
									line : lineIndextoUpdate,
									value: 'PICKED'
								});

								vPickTaskRec.save();
							}
						}
						else{

							updateStatusToDone(pickTaskId,vPickTaskRec,lineIndextoUpdate, warehouseLocationId,locUseBinsFlag,perOrderPickTaskArray.values[2]);
						}

						break;
					}
				}
			}
			function getAllPickTaskwithsameIF(itemFulfillmentId)
			{
				var pickTaskSearch =  query.create({type: query.Type.PICK_TASK});

				var pickActionsFieldsJoin = pickTaskSearch.autoJoin({
					fieldId: 'pickactions'
				});

				var pickActionTranNumCond = pickTaskSearch.createCondition({
					fieldId: 'pickactions.transactionnumber',
					operator: query.Operator.ANY_OF,
					values: itemFulfillmentId
				});

				pickTaskSearch.columns.push(pickTaskSearch.createColumn({
					fieldId: 'name'
				}));

				pickTaskSearch.columns.push(pickTaskSearch.createColumn({
					fieldId: 'pickactions.ordernumber'
				}));

				pickTaskSearch.columns.push(pickTaskSearch.createColumn({
					fieldId: 'pickactions.status'
				}));

				pickTaskSearch.columns.push(pickTaskSearch.createColumn({
					fieldId: 'pickactions.linenumber'
				}));


				pickTaskSearch.condition = pickTaskSearch.and(pickActionTranNumCond );

				var pickActionResultSet = pickTaskSearch.run().results;
				return  pickActionResultSet;
			}
		function getItemLookupDetails(itemInternalId,pickTaskRecord,reversalInputObj,unitsOfMeasureFeature){
			try{
				var stockUnitText = '';
				var unitType = '';
				var transactionUOMname='';
				if(unitsOfMeasureFeature) {
					transactionUOMname = pickTaskRecord.getText({fieldId: 'units'});
                }
				log.debug('transactionUOMname',transactionUOMname);
				if(utility.isValueValid(itemInternalId)) {
					var itemLookUpDetails = search.lookupFields({
						type: search.Type.ITEM,
						id: itemInternalId,
						columns: ['recordtype','unitstype', 'stockunit']
					});
					if (utility.isValueValid(itemLookUpDetails) && utility.isValueValid(itemLookUpDetails.recordtype)) {
						reversalInputObj.itemType = itemLookUpDetails.recordtype;
					}
					if (utility.isValueValid(itemLookUpDetails.unitstype) && utility.isValueValid(itemLookUpDetails.unitstype[0])) {
						unitType = itemLookUpDetails.unitstype[0].value;
					}
					if (utility.isValueValid(itemLookUpDetails.stockunit) && utility.isValueValid(itemLookUpDetails.stockunit[0])) {
						stockUnitText = itemLookUpDetails.stockunit[0].text;
					}
					if (utility.isValueValid(stockUnitText) && utility.isValueValid(unitType) && utility.isValueValid(transactionUOMname)) {
						var stockConversionRate = utility.getConversionRate(stockUnitText, unitType);
						var transactionUOMConvRate = utility.getConversionRate(transactionUOMname, unitType);
						if(!(utility.isValueValid(transactionUOMConvRate))){
							transactionUOMConvRate=1;
						}
						if(!(utility.isValueValid(stockConversionRate))){
							stockConversionRate=1;
						}
						reversalInputObj.transactionUOMConvRate=transactionUOMConvRate;
						reversalInputObj.stockConversionRate=stockConversionRate;
					}
				}
				log.debug('reversalInputObj Object return',reversalInputObj);
			}catch(e){
				log.error('Exception in getItemTransactionAndStockConversionRate',e);
			}
		}
		function convertPickQuantityInStockUnits(pickQuantity,reversalInputObj){
			try{
				var convertedQuantity =pickQuantity;
				var transactionUOMConvRate =reversalInputObj.transactionUOMConvRate;
				var stockConversionRate =reversalInputObj.stockConversionRate;
				if(!(utility.isValueValid(transactionUOMConvRate))){
					transactionUOMConvRate=1;
				}
				if(!(utility.isValueValid(stockConversionRate))){
					stockConversionRate=1;
				}
				var conversionRate = Number(Big(transactionUOMConvRate).div(stockConversionRate));
				convertedQuantity= parseFloat(Number(Big(convertedQuantity).mul(conversionRate)));
				log.debug('convertedQuantity',convertedQuantity);
				return convertedQuantity;
			}catch(e){
				log.error('Exception in convertPickQuantityInStockUnits',e);
			}
		}

	return {
		validateTransaction     : validateTransaction,
		getPickTaskLines 		: getPickTaskLines,
		submitReversal 			: submitReversal,
		getPickActionId			: getPickActionId,
		updatePickTask 			: updatePickTask,
		getPickTaskInvDetails   : getPickTaskInvDetails,
		getKitComponentPickTasks: getKitComponentPickTasks,
		updateStageBin			:updateStageBin,
		getItemFulflmentResults :getItemFulflmentResults,
		getShipmanifestResults:getShipmanifestResults,
		deleteShipManifestRecord:deleteShipManifestRecord,
		getItemFulflmentResultsForKit:getItemFulflmentResultsForKit,
		updateKitCompPickTaskLinesToStage:updateKitCompPickTaskLinesToStage,
		getInventoryDetailsofPickTask:getInventoryDetailsofPickTask,
		toGetPickActionIdForKit:toGetPickActionIdForKit,
		binTransferForpickReversal:binTransferForpickReversal,
    	getAllPickTaskwithsameIF:getAllPickTaskwithsameIF,
		updatePickTaskLinesToStage:updatePickTaskLinesToStage,
		getItemLookupDetails:getItemLookupDetails,
        convertPickQuantityInStockUnits:convertPickQuantityInStockUnits
	};
});
