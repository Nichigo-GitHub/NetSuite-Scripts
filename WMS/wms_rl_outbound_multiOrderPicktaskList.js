/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/runtime' ,'./wms_utility','./wms_translator','./wms_outBoundUtility','N/wms/recommendedBins','N/query'],

		function (search , runtime ,utility,translator,obUtility,binApi,query) {

	var pickingType = '';

	function doPost(requestBody) {

		var requestParams = '';
		var whLocation = '';
		var waveName='';
		var debugString = '';
		var picktaskList ={};
		var waveInternalId='';
		var locUseBinsFlag='';
		try{
			requestParams =  requestBody.params;
			if (utility.isValueValid(requestParams)) {					
				whLocation = requestParams.warehouseLocationId;
				waveName = requestParams.waveName;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				pickingType = requestParams.pickingType;
				var  isZonePickingEnabled   = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var boolShowCompleted = requestParams.boolShowCompleted;
				var boolShowOnlyCompleted = requestParams.boolShowOnlyCompleted;
				log.debug('requestParams' , requestParams);
				debugString = debugString + 'requestParams :' + requestParams;

				if (utility.isValueValid(whLocation)  && utility.isValueValid(waveName) ) {

					boolShowCompleted = boolShowCompleted || true;
					boolShowOnlyCompleted = boolShowOnlyCompleted || false;

					var currentUser = runtime.getCurrentUser().id;
					var	objpickTaskDetails = {};
					if(!utility.isValueValid(locUseBinsFlag)){
						locUseBinsFlag =this.lookupOnLocationForUseBins(whLocation);
					}
					log.debug('locUseBinsFlag' , locUseBinsFlag);

					if(!utility.isValueValid(isZonePickingEnabled)){
						isZonePickingEnabled = false;

					}
					if(!utility.isValueValid(selectedZones)){
						selectedZones = [];
					}

					var waveIdArr = obUtility.getWaveInternalId(waveName,whLocation);
					var pickTaskListArr = [];
					if(waveIdArr.length>0){
						waveInternalId = waveIdArr[0].internalid;
					}
					if(locUseBinsFlag)	{
						objpickTaskDetails = this.getMultiOrderPickTaskCompletedDetailsUsingNQery(whLocation,waveName,currentUser,boolShowCompleted,boolShowOnlyCompleted);
					}
					else{
						pickTaskListArr = obUtility.getMultiOrderPickTaskCompletedDetails(whLocation,waveInternalId,currentUser,getPickTaskDetailsForNoBins, pickingType);
                    }
					if(objpickTaskDetails.length > 0 || pickTaskListArr.length > 0)	{
                        if(objpickTaskDetails.length > 0) {
                            for(var pickTaskIdIndex=0;pickTaskIdIndex<objpickTaskDetails.length;pickTaskIdIndex++) {
                                if(utility.isValueValid(objpickTaskDetails[pickTaskIdIndex].fullname) && utility.isValueValid(objpickTaskDetails[pickTaskIdIndex].subitemof)) {
                                    objpickTaskDetails[pickTaskIdIndex].kitName = objpickTaskDetails[pickTaskIdIndex].fullname;
                                    objpickTaskDetails[pickTaskIdIndex].kitId = objpickTaskDetails[pickTaskIdIndex].subitemof;
                                }
                            }
                        }
						if(locUseBinsFlag){

							var zoneIdArr = [];
							if(isZonePickingEnabled == true && utility.isValueValid(selectedZones)
									&& selectedZones.length > 0){
								zoneIdArr  = requestParams.selectedZones;
							} 

							if(boolShowOnlyCompleted == "true" || boolShowOnlyCompleted == true){
								var objpickTaskDetailsLength = objpickTaskDetails.length;
								var pickTaskDetailsObj = {};
								var indx = 0;
								var ordersObj = {};
                                var lineitemsubitem = '';
								log.debug('objpickTaskDetails',objpickTaskDetails);
								for(var pickTask = 0; pickTask< objpickTaskDetailsLength; pickTask++) {
									
									var uomText = objpickTaskDetails[pickTask].pluralname;
									var invDtlQty  = objpickTaskDetails[pickTask]['inventorydetail.quantity'];
									var zoneId = objpickTaskDetails[pickTask]['inventorydetail.bin.zone'];
									var pickTaskID = objpickTaskDetails[pickTask].name;
									var binName = objpickTaskDetails[pickTask]['inventorydetail.bin.binnumber'];
									var conversionRate  = objpickTaskDetails[pickTask]['conversionrate'];
                                    lineitemsubitem = objpickTaskDetails[pickTask]['fullname'];
									if(parseFloat(invDtlQty) < 0){
										invDtlQty = -1 * invDtlQty;
									}
									
									var isRowAlreadyAddedToArray = false;
									if(pickTaskDetailsObj[pickTaskID] != undefined && pickTaskDetailsObj[pickTaskID].pickTaskId == pickTaskID){
										 var pickTaskOrdersObj = ordersObj[pickTaskID].toString();
										 var pickTaskOrdersArr = pickTaskOrdersObj.split(",");
										 var ordersCount = pickTaskOrdersArr.length;
										 if(pickTaskOrdersArr.indexOf(objpickTaskDetails[pickTask].ordernumber) == -1){
											 ordersCount = ordersCount + 1;
											 ordersObj[pickTaskID] = pickTaskOrdersObj+","+objpickTaskDetails[pickTask].ordernumber;
										 }
										var	existingPickTaskRow = pickTaskDetailsObj[pickTaskID];
										existingPickTaskRow.ordersCount = ordersCount;										
										pickTaskListArr[existingPickTaskRow.index] = existingPickTaskRow;
										
										if(existingPickTaskRow.binnumber == binName){
											var existingRowQty = existingPickTaskRow.qty;
											if(utility.isValueValid(existingRowQty) && existingRowQty > 0){
												invDtlQty = parseFloat(invDtlQty) + parseFloat(existingRowQty);
												isRowAlreadyAddedToArray = true;
												var qtyWithUOM = invDtlQty;
												if(utility.isValueValid(uomText)){
													invDtlQty = parseFloat(invDtlQty) / parseFloat(conversionRate);
											        qtyWithUOM = invDtlQty + " " +uomText ;
												}
												existingPickTaskRow.quantitywithUOM = qtyWithUOM;
												existingPickTaskRow.qty = invDtlQty;
												pickTaskListArr[existingPickTaskRow.index] = existingPickTaskRow;
											}
										}
									}
									if(isRowAlreadyAddedToArray == false){
										var qty  = invDtlQty;
										if(utility.isValueValid(uomText)){
											invDtlQty = parseFloat(invDtlQty) / parseFloat(conversionRate);
											qtyWithUOM = invDtlQty + " " +uomText ;
										}
										if(!utility.isValueValid(isZonePickingEnabled) || isZonePickingEnabled == false){
											if(zoneIdArr.indexOf(zoneId) == -1){
												zoneIdArr.push(zoneId);
											}
										}
										else{
											if(isZonePickingEnabled == true && (!utility.isValueValid(zoneId) || zoneId == -1) ){
												zoneId = "0";
											}
										}
										if((zoneIdArr.indexOf(zoneId) != -1 ) ||  (objpickTaskDetails[pickTask].picker == currentUser)){

											var currRow = {itemText:objpickTaskDetails[pickTask].itemid,
													internalid:objpickTaskDetails[pickTask].item,
													binnumber:binName,
													zoneText:objpickTaskDetails[pickTask]['inventorydetail.bin.zone.name'],
													pickTaskId:pickTaskID,
													quantitywithUOM:invDtlQty,
													salesdescription:objpickTaskDetails[pickTask].description,
													upccode:objpickTaskDetails[pickTask].upccode,
													order:objpickTaskDetails[pickTask].ordernumber,
													qty:qty,
													ordersCount : 1,
													custrecord_wmsse_aisle:'',
													custrecord_wmsse_level:'',
                                                    kitName: lineitemsubitem
											};
											ordersObj[pickTaskID] = objpickTaskDetails[pickTask].ordernumber;
											pickTaskListArr.push(currRow);
											pickTaskDetailsObj[pickTaskID] = currRow;
											indx = indx + 1;
										}
									}

								}

							}
							else{
								var pickTaskIdArr = [];
								var pickTaskDetailsLength = objpickTaskDetails.length;
								if(pickTaskDetailsLength > 0){
									for(var pickTaskIdIndex=0; pickTaskIdIndex < pickTaskDetailsLength; pickTaskIdIndex++)	{
										pickTaskIdArr.push(parseInt(objpickTaskDetails[pickTaskIdIndex].name));
									}
								}

								this.getPickTaskDetailsForBins(pickTaskIdArr,pickTaskListArr,objpickTaskDetails,zoneIdArr,isZonePickingEnabled,currentUser);

							}
						}
						if(boolShowCompleted == true){
							var pickTaskDtlZeroQtyArr =[];
							for(var k=0;k<pickTaskListArr.length;k++){
								if (pickTaskListArr[k] != undefined && pickTaskListArr[k].totalremainingquantity == 0 ){ 
									pickTaskDtlZeroQtyArr.push(pickTaskListArr[k]);
									pickTaskListArr.splice(k,1);
									k--;
								}
							}

							for(var j in pickTaskDtlZeroQtyArr){
								if(pickTaskDtlZeroQtyArr[j]){
									pickTaskListArr.push(pickTaskDtlZeroQtyArr[j]);
								}
							}
						}

						picktaskList.pickTaskList = pickTaskListArr;
						picktaskList.isValid=true;
					}
					var goToStageFlag = obUtility.getShowStageFlag(waveInternalId,whLocation);
					if(locUseBinsFlag){
						picktaskList.gotostage = goToStageFlag;
						picktaskList.ordersToStageCount = 0;

                        var ordersIdArr = [];

					    log.debug('isZonePickingEnabled',isZonePickingEnabled);
						if(picktaskList.gotostage == 'Y' && utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
                        //if(picktaskList.gotostage == 'Y'){

							//picktaskList.ordersToStageCount = obUtility.getStagedOrdersCount('multiOrder',waveName,'',whLocation);
							var pickedOrdersArr = obUtility.getPickedOrders(waveName,whLocation,selectedZones);
							log.debug('pickedOrdersArr in if',pickedOrdersArr);
							for(var ord in  pickedOrdersArr){
								if(pickedOrdersArr[ord]) {
									ordersIdArr.push(pickedOrdersArr[ord].id);
								}
							}
                            picktaskList.boolAnyItemIsAlreadyStaged = "N";
                            if(ordersIdArr.length == 1){
                                picktaskList.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('','',ordersIdArr,whLocation);
                            }
							picktaskList.selectedOrders = ordersIdArr;
							picktaskList.ordersToStageCount = pickedOrdersArr.length;
							if(picktaskList.boolAnyItemIsAlreadyStaged == 'Y'){

								picktaskList.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
							}
							else{
								picktaskList.starDescription = '';	
							}

						}
						else
                        {
                            log.debug('alreadyPickedOrders',ordersIdArr);
                            picktaskList.alreadyPickedOrders = ordersIdArr;
                        }
					}
					else{
						picktaskList.gotostage =  'N';
					}
					if(goToStageFlag != 'Y' && pickTaskListArr.length == 0 && boolShowOnlyCompleted != "true"){
						picktaskList.errorMessage = translator.getTranslationString("MULTIORDER_PICKTASKLIST.NOPICKTASKS");
						picktaskList.isValid=false;
					}
				}
				else 
				{
					picktaskList.isValid=false;
				}
			}
			else
			{
				picktaskList.errorMessage=translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
				picktaskList.isValid=false;
			} 

			log.debug('picktaskList' , picktaskList);
		}
		catch(e)
		{
			picktaskList.isValid = false;
			picktaskList.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return picktaskList;
	}

	function getMultiOrderPickTaskCompletedDetailsUsingNQery(whLocationId,waveId,currentUser,boolShowCompleted,boolShowOnlyCompleted)
	{

		var myTransactionQuery = query.create({
			type: query.Type.PICK_TASK
		});

		var itemFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'item^item'
		});
		var pickActionsFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'pickactions'
		});
		var waveFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'wave^transaction'
		});
		var transactionFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'pickactions.ordernumber^transaction'
		});
		var pickTaskUomFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'units'
		});
        var subItemFieldsJoin = pickActionsFieldsJoin.autoJoin({ // ADDITION
            fieldId: 'subitemof^item'
        });

		myTransactionQuery.columns = [

		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'description',
		                            	  groupBy: true
		                              }),
		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'itemid',
		                            	  groupBy: true
		                              }),
		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'upccode',
		                            	  groupBy: true
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'units',
		                            	  groupBy: true
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'item',
		                            	  groupBy: true
		                              }),
		                              waveFieldsJoin.createColumn({
		                            	  fieldId: 'wavetype',
		                            	  groupBy: true
		                              }),
		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'stockunit',
		                            	  groupBy: true
		                              }),
		                              pickActionsFieldsJoin.createColumn({
		                            	  fieldId: 'remainingquantity',
		                            	  aggregate: query.Aggregate.SUM
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'name',
		                            	  groupBy: true
		                              }),
		                              transactionFieldsJoin.createColumn({
		                            	  fieldId: 'number',
		                            	  aggregate: query.Aggregate.COUNT
		                              }),

		                              pickActionsFieldsJoin.createColumn({
		                            	  fieldId: 'pickedquantity',
		                            	  aggregate: query.Aggregate.SUM
		                              }),
		                              pickTaskUomFieldsJoin.createColumn({ 
		                            	  fieldId: 'pluralname' ,
		                            	  groupBy: true
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'picker',
		                            	  groupBy: true
		                              }),
		                              pickTaskUomFieldsJoin.createColumn({
	                                     fieldId: 'conversionrate',
	                                     groupBy: true               
                                      })
		                              ];
		if(utility.isValueValid(pickingType) && pickingType == 'MULTI') {
			myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'subitemof',
				groupBy: true
			}));
			myTransactionQuery.columns.push(subItemFieldsJoin.createColumn({
				fieldId: 'fullname',
				groupBy: true
			}));
		}
		var pickActionStatusCond = myTransactionQuery.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['READY','INPROGRESS']
		});
		var lineItemStatusCond = pickActionsFieldsJoin.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF_NOT,
			values: ['CANCELLED','DONE','FAILED']
		});
		var waveNameCond = myTransactionQuery.createCondition({
			fieldId: 'wave^transaction.tranid',
			operator: query.Operator.IS,
			values: waveId
		});
		var locCond = myTransactionQuery.createCondition({
			fieldId: 'location',
			operator: query.Operator.EQUAL,
			values: whLocationId
		});
		var pickerCond = myTransactionQuery.createCondition({
			fieldId: 'picker',
			operator: query.Operator.ANY_OF,
			values: [null,currentUser]
		});
		var waveStatusCond = myTransactionQuery.createCondition({
			fieldId: 'wave^transaction.status',
			operator: query.Operator.ANY_OF,
			values:  ['Wave:B','Wave:C']
		});
		if(boolShowCompleted == false || boolShowCompleted == "false" ){
			lineItemStatusCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'status',
				operator: query.Operator.ANY_OF_NOT,
				values: ['CANCELLED','DONE','FAILED','PICKED']
			});
		}
		if(utility.isValueValid(boolShowOnlyCompleted) && 
				(boolShowOnlyCompleted ==true || boolShowOnlyCompleted == "true")){

			lineItemStatusCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'status',
				operator: query.Operator.ANY_OF,
				values: ['PICKED','STAGED']
			});
			var pickActionsQuantityStagedCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'inventorydetail.quantitystaged',			
				operator: query.Operator.EQUAL,
				values: 0
			});
			myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.bin.binnumber',
				groupBy: true
			}));
			myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.bin.zone.name',
				groupBy: true
			}));
			myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.bin.zone',
				groupBy: true
			}));
			myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.quantity',
				aggregate: query.Aggregate.SUM
			}));
			myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'ordernumber',
				groupBy: true
			}));
			var remaining_qtycond = myTransactionQuery.createCondition({
				fieldId: 'totalremainingquantity',
				operator: query.Operator.EQUAL,
				values: 0
			});
			myTransactionQuery.condition = myTransactionQuery.and(waveNameCond,waveStatusCond,pickerCond,
					locCond,pickActionStatusCond,lineItemStatusCond,pickActionsQuantityStagedCond,remaining_qtycond);
		} 
		else{
			if(boolShowCompleted == false || boolShowCompleted == "false" ){
				var pickActionsQuery_qtycond = pickActionsFieldsJoin.createCondition({
					fieldId: 'remainingquantity',
					operator: query.Operator.GREATER,
					values: 0
				});
				myTransactionQuery.condition = myTransactionQuery.and(waveNameCond,waveStatusCond,pickerCond,
						locCond,pickActionStatusCond,lineItemStatusCond,pickActionsQuery_qtycond);

			}
			else{
				myTransactionQuery.condition = myTransactionQuery.and(waveNameCond,waveStatusCond,pickerCond,
						locCond,pickActionStatusCond,lineItemStatusCond);
			}
		}

		// Run the query as a paged query with 10 results per page
		var results = myTransactionQuery.runPaged({
			pageSize: 1000
		});

		log.debug(results.pageRanges.length);
		log.debug(results.count);

		var page = '';
		var pageCoulmns = '';
		var pageResults = '';
		var resultJsonArr =[];
		// Retrieve the query results using an iterator
		var iterator = results.iterator();
		iterator.each(function(result) {
			page = result.value;
			pageCoulmns = page.data.columns;
			pageResults = page.data.results;
			convertToJsonObj(pageResults,pageCoulmns,resultJsonArr);
			return true;
		});
		return resultJsonArr;

	}

	function convertToJsonObj(result,columnsObj,resultJsonArr){
		var resultObj = {};
		var columns = columnsObj;
		var values = result;

		for(var res in values){
			if(values[res]){
				var resObj = values[res].values;
				resultObj = {};
				for(var col in columns){
					if(columns[col]){
						var colName = columns[col].fieldId;
						resultObj[colName] = resObj[col];  
					}
				}
				resultJsonArr.push(resultObj); 
			}
		}
	}

	function lookupOnLocationForUseBins(wareHouseLocationId)
	{
		var locUseBinsFlag='';
		var columnsArr = [];
		columnsArr.push('usesbins');
		var locResults = utility.getLocationFieldsByLookup(wareHouseLocationId,columnsArr);
		if(locResults){
			locUseBinsFlag =  locResults.usesbins;
		}
		log.debug('locUseBinsFlag',locUseBinsFlag);

		return locUseBinsFlag;

	}
	function getPickTaskDetailsForBins(pickTaskIdArr,pickTaskListArr,objpickTaskDetails,zoneIdArray,isZonePickingEnabled,currentUser)
	{
		var binResult = binApi.recommendPickPathForPickTasks({pickTaskIds:pickTaskIdArr});
		//log.error('binResult',binResult);

		if(utility.isValueValid(binResult)){

			var binData = '';
			var currRow = '';
			var qtyToShow = 0;
			var recommendedbinName = '';
			var recommendedBinId = '';
			var zoneName = '';
			var objpickTaskDetailsLength = objpickTaskDetails.length;
			var pickTaskObj = [];
			var pickTaskDetailsObj = {};
			for(var pickTask = 0; pickTask< objpickTaskDetailsLength; pickTask++) {
				pickTaskDetailsObj = {};
				pickTaskDetailsObj.itemText = objpickTaskDetails[pickTask].itemid;
				pickTaskDetailsObj.itemid = objpickTaskDetails[pickTask].item;
				pickTaskDetailsObj.itemDesc = objpickTaskDetails[pickTask].description;
				pickTaskDetailsObj.itemUpcCode = objpickTaskDetails[pickTask].upccode;
				pickTaskDetailsObj.lineRemainingQty = objpickTaskDetails[pickTask].remainingquantity;
				pickTaskDetailsObj.qtyToShow =  objpickTaskDetails[pickTask].remainingquantity;
				pickTaskDetailsObj.uomText = objpickTaskDetails[pickTask].pluralname;
				pickTaskDetailsObj.aile = '';//objpickTaskDetails[pickTask].values[1];
				pickTaskDetailsObj.orderCount = objpickTaskDetails[pickTask].number;
				pickTaskDetailsObj.level = '';//objpickTaskDetails[pickTask].values[1];
                if(utility.isValueValid(objpickTaskDetails[pickTask].kitName) && utility.isValueValid(objpickTaskDetails[pickTask].kitId)){
                    pickTaskDetailsObj.kitName = objpickTaskDetails[pickTask].kitName;//objpickTaskDetails[pickTask].values[1];
                    pickTaskDetailsObj.kitId = objpickTaskDetails[pickTask].kitId
                } else {
                    pickTaskDetailsObj.kitName = '';
                    pickTaskDetailsObj.kitId = '';
                }
				pickTaskDetailsObj.pickQuantity = objpickTaskDetails[pickTask].pickedquantity;
				pickTaskDetailsObj.transactiontype = objpickTaskDetails[pickTask].wavetype;
				pickTaskDetailsObj.pickTaskId = objpickTaskDetails[pickTask].name;
				pickTaskDetailsObj.pickerId = objpickTaskDetails[pickTask].picker;
				pickTaskObj.push(pickTaskDetailsObj);
				//pickTaskObj[objpickTaskDetails[pickTask].name] = pickTaskDetailsObj;
			}
			log.debug('pickTaskObj',pickTaskObj);

			for(var rbaBinIndex=0; rbaBinIndex<objpickTaskDetailsLength; rbaBinIndex++)
			{
				recommendedbinName = '';
				recommendedBinId = '';
				zoneName  = '';
        //commented below code, because binresults and pickTaskObj indexes is not in same sequence
				// var rbaPickTaskId = rbaBinIndex;
				var rbaPickTaskIndex = binResult.bins[rbaBinIndex].inputIndex;
				var rbaPickTaskId = rbaPickTaskIndex;
				if(pickTaskObj[rbaPickTaskId] != undefined){
					qtyToShow = pickTaskObj[rbaPickTaskId].qtyToShow;
					if(parseFloat(qtyToShow) > 0 && pickTaskObj[rbaPickTaskId].uomText !== null &&
							pickTaskObj[rbaPickTaskId].uomText !== undefined && pickTaskObj[rbaPickTaskId].uomText !== ''){
						qtyToShow = qtyToShow + ' ' +pickTaskObj[rbaPickTaskId].uomText;
					}
					var binStatus = binResult.bins[rbaBinIndex].status.code;
					var zoneId = '';
					if(binStatus == 'SUCCESS'){
						binData = binResult.bins[rbaBinIndex].data;
						recommendedbinName = binData.bin.name;
						recommendedBinId = binData.bin.id;
						zoneName  = binData.zone.name;
						zoneId = binData.zone.id;
					}

					if(!utility.isValueValid(isZonePickingEnabled) || isZonePickingEnabled == false){
						if(zoneIdArray.indexOf(zoneId) == -1){
							zoneIdArray.push(zoneId);
						}
					}
					else{
						if(isZonePickingEnabled == true && (!utility.isValueValid(zoneId) || zoneId == -1) ){
							zoneId = "0";
						}
					}
					if((zoneIdArray.indexOf(zoneId) != -1 ) ||  (pickTaskObj[rbaPickTaskId].pickerId == currentUser)){
						currRow = {itemText:pickTaskObj[rbaPickTaskId].itemText,
								item:pickTaskObj[rbaPickTaskId].itemid,
								recommendedbinText:recommendedbinName,
								recommendedbin:recommendedBinId,
								stockunitText:'',
								zoneText:zoneName,
								pickTaskId:pickTaskObj[rbaPickTaskId].pickTaskId,
								quantitywithUOM:qtyToShow,
								salesdescription:pickTaskObj[rbaPickTaskId].itemDesc,
								upccode:pickTaskObj[rbaPickTaskId].itemUpcCode,
								lineitemremainingquantity:pickTaskObj[rbaPickTaskId].lineRemainingQty,
								unitsText:pickTaskObj[rbaPickTaskId].uomText,
								orderCount:pickTaskObj[rbaPickTaskId].orderCount,
								custrecord_wmsse_aisle:pickTaskObj[rbaPickTaskId].aile,
								custrecord_wmsse_level:pickTaskObj[rbaPickTaskId].level,
								totalremainingquantity:pickTaskObj[rbaPickTaskId].lineRemainingQty,
								pickedQuantity:pickTaskObj[rbaPickTaskId].pickQuantity,
								transactiontype:pickTaskObj[rbaPickTaskId].transactiontype,
								binnumber:recommendedbinName,binInternalId:recommendedBinId,
								kitName:pickTaskObj[rbaPickTaskId].kitName,
								kitId:pickTaskObj[rbaPickTaskId].kitId}
						pickTaskListArr.push(currRow);
					}
				}
			}
		}
		return pickTaskListArr ;
	}
	function getPickTaskDetailsForNoBins(pickTaskListObj,objpickTaskDetails)
	{
		if(Object.keys(pickTaskListObj).length > 0){

			var stockuntText ='';
			var lineRemainingQty = pickTaskListObj.getValue({
				name: 'lineitemremainingquantity',
				summary: 'SUM'
			});
			var lineQty = pickTaskListObj.getValue({
				name: 'lineitemremainingquantity',
				summary: 'GROUP'
			});
			var qtyToShow = lineRemainingQty ;
			var uomText = pickTaskListObj.getText({
				name: 'units',
				summary: 'GROUP'
			});

			if(parseFloat(qtyToShow) > 0 && uomText !== null && uomText !== undefined && uomText !== ''){
				qtyToShow = qtyToShow + ' ' +uomText;
			}
            var parentkitName = pickTaskListObj.getText({name: 'lineitemsubitemof',summary: 'GROUP'});
			if(parentkitName == '- None -') {
                parentkitName = '';
			}
            		var currRow = {itemText:pickTaskListObj.getText({name: 'item',summary: 'GROUP'}),
					item:pickTaskListObj.getValue({name: 'item',summary: 'GROUP'}),
					stockunitText:stockuntText,
					pickTaskId:pickTaskListObj.getValue({name: 'formulatext',summary: 'GROUP',label:'pickTaskId'}),
					quantitywithUOM:qtyToShow,
					salesdescription:pickTaskListObj.getValue({name: 'salesdescription',summary: 'GROUP',join:'item'}),
					upccode:pickTaskListObj.getValue({name: 'upccode',summary: 'GROUP',join:'item'}),
					lineitemremainingquantity:lineRemainingQty,
					unitsText:uomText,
					orderCount:pickTaskListObj.getValue({name: 'formulatext',summary: 'COUNT',label:'orderCount'}),
					custrecord_wmsse_aisle:'',
					custrecord_wmsse_level:'',
					totalremainingquantity:lineRemainingQty,
					pickedQuantity:pickTaskListObj.getValue({name: 'formulanumeric',summary: 'SUM',label:'pickedQuantity'}),
					transactiontype:pickTaskListObj.getValue({name: 'transactiontype',summary: 'GROUP'}),
					kitName:parentkitName,
					kitId:pickTaskListObj.getValue({name: 'lineitemsubitemof',summary: 'GROUP'})};

			objpickTaskDetails.push(currRow);
		}
		log.debug('pickTaskListArr return',objpickTaskDetails);
		return objpickTaskDetails;
	}
	return {
		post: doPost,
		getMultiOrderPickTaskCompletedDetailsUsingNQery:getMultiOrderPickTaskCompletedDetailsUsingNQery,
		lookupOnLocationForUseBins:lookupOnLocationForUseBins,
		getPickTaskDetailsForBins:getPickTaskDetailsForBins,
		getPickTaskDetailsForNoBins:getPickTaskDetailsForNoBins

	};
});
