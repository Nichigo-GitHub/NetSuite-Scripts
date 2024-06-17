/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_outBoundUtility','N/runtime','N/wms/recommendedBins','N/query'],

		function(utility,translator,obUtility,runtime,binApi,query) {

	/**
	 * Function to fetch  pick tasks
	 */
	function doPost(requestBody) {

		var picktaskListArr = {};
		var requestParams = '';
		var locUseBinsFlag='';
		try{

			requestParams = requestBody.params;
			log.debug({title:'requestParams',details:requestParams});
			if(utility.isValueValid(requestParams))	{

				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				var  isZonePickingEnabled   = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var boolShowCompleted = requestParams.boolShowCompleted;
				var boolShowOnlyCompleted = requestParams.boolShowOnlyCompleted;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId)){

					if(!utility.isValueValid(boolShowCompleted)){
						boolShowCompleted = true;

					}
					if(!utility.isValueValid(boolShowOnlyCompleted)){
						boolShowOnlyCompleted = false;
					}

					if(!utility.isValueValid(isZonePickingEnabled)){
						isZonePickingEnabled = false;

					}
					if(!utility.isValueValid(selectedZones)){
						selectedZones = [];
					}

					var objpickTaskDetails=[];
					var pickTaskDetails = {}; 
					var currentUser = runtime.getCurrentUser().id;

					if(!utility.isValueValid(locUseBinsFlag))
					{
						locUseBinsFlag =this.lookupOnLocationForUseBins(warehouseLocationId);
					}
					pickTaskDetails.orderInternalId=transactionInternalId;
					pickTaskDetails.whLocationId=warehouseLocationId;
					pickTaskDetails.currentUser=currentUser;

					if(locUseBinsFlag == false)
					{
                        pickTaskDetails.pickingType = 'SINGLE';
						objpickTaskDetails = obUtility.getPickTaskDtlstoIncldAlreadyPickedOrders(pickTaskDetails);
					}
					else
					{
						objpickTaskDetails = _getPickTaskResultsWithNQuery(pickTaskDetails,boolShowCompleted,boolShowOnlyCompleted);
					}

					var objpickTaskDetailsLength = objpickTaskDetails.length;
					log.debug({title:'objpickTaskDetailsLength',details:objpickTaskDetails});
					if(objpickTaskDetailsLength > 0){

						var pickTaskIdArr = []; 
						for(var pickTaskIdIndex=0;pickTaskIdIndex<objpickTaskDetailsLength;pickTaskIdIndex++){
							if(pickTaskIdArr.indexOf(objpickTaskDetails[pickTaskIdIndex].id) === -1) {
								pickTaskIdArr.push(parseInt(objpickTaskDetails[pickTaskIdIndex].id));
							}
							if(utility.isValueValid(objpickTaskDetails[pickTaskIdIndex].fullname)) {
								objpickTaskDetails[pickTaskIdIndex].lineitemsubitemof = objpickTaskDetails[pickTaskIdIndex].fullname;
							}
						}

						var pickTaskListResult = [];

						if(locUseBinsFlag == false){
							pickTaskListResult = this.getPickTaskDetailsForNoBins(pickTaskIdArr,objpickTaskDetails);
						}
						else{
							var zoneIdArr = [];
							if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true && 
									utility.isValueValid(selectedZones)
									&& selectedZones.length > 0){
								zoneIdArr  = requestParams.selectedZones;
							} 
							if(boolShowOnlyCompleted == "true" || boolShowOnlyCompleted == true){
								var objpickTaskDetailsLength = objpickTaskDetails.length;
								var pickTaskDetailsObj = {};
                                var lineitemsubitem = '';
								var indx = 0;
								for( var pickTask = 0; pickTask < objpickTaskDetailsLength; pickTask++) {
									var uomText = objpickTaskDetails[pickTask].unitname;
									var invDtlQty  = objpickTaskDetails[pickTask]['inventorydetail.quantity'];
									var pickTaskID = objpickTaskDetails[pickTask].id;
									var binName = objpickTaskDetails[pickTask]['inventorydetail.bin.binnumber'];
									var conversionRate  = objpickTaskDetails[pickTask]['conversionrate'];
                                    lineitemsubitem = objpickTaskDetails[pickTask].lineitemsubitemof;
									if(parseFloat(invDtlQty) < 0){
										invDtlQty = -1 * invDtlQty;

									}
									var isRowAlreadyAddedToArray = false;
									if(pickTaskDetailsObj[pickTaskID] != undefined && pickTaskDetailsObj[pickTaskID].id == pickTaskID){
										var	existingPickTaskRow = pickTaskDetailsObj[pickTaskID];
										if(existingPickTaskRow.recommendedBinName == binName){
											var existingRowQty = existingPickTaskRow.qty
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
												pickTaskListResult[existingPickTaskRow.index] = existingPickTaskRow;
											}
										}
									}
									if(isRowAlreadyAddedToArray == false)	{
										var qtyWithUOM = invDtlQty;
										if(utility.isValueValid(uomText)){
											
											invDtlQty = parseFloat(invDtlQty) / parseFloat(conversionRate);
											qtyWithUOM = invDtlQty + " " +uomText ;
											
										}
										var zoneId = objpickTaskDetails[pickTask]['inventorydetail.bin.zone'];
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

											var currRow = {
													item:objpickTaskDetails[pickTask].itemid,
													internalid:objpickTaskDetails[pickTask].item,
													id:pickTaskID,
													recommendedbin:binName,
													recommendedBinName:binName,
													zoneText:objpickTaskDetails[pickTask]['inventorydetail.bin.zone.name'],
													name:pickTaskID,
													quantitywithUOM:qtyWithUOM,
													salesdescription:objpickTaskDetails[pickTask].description,
													upccode:objpickTaskDetails[pickTask].upccode,
													qty : invDtlQty,
													order:objpickTaskDetails[pickTask].ordernumber,
													index : indx,
                                                    lineitemsubitemof:lineitemsubitem
											};
											pickTaskListResult.push(currRow);
											pickTaskDetailsObj[objpickTaskDetails[pickTask].id] = currRow;
											indx = indx + 1;
										}
									}

								}

							}
							else{

								pickTaskListResult = this.getPickTaskDetailsForBins(pickTaskIdArr,objpickTaskDetails,zoneIdArr,currentUser,isZonePickingEnabled);
							}
						}

						picktaskListArr.pickTaskList = pickTaskListResult;
						picktaskListArr.isValid=true;

					}
					else{
						if(boolShowOnlyCompleted != "true"){
							picktaskListArr.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.NOPICKTASKS');
							picktaskListArr.isValid=false;
						}
					}
					if(locUseBinsFlag == true){
						var picktaskstageflagDtl = obUtility.getPickTaskStageflag('singleOrder','',transactionInternalId,warehouseLocationId);
						log.debug({title:'picktaskstageflagDtl',details:picktaskstageflagDtl});
						if(utility.isValueValid(picktaskstageflagDtl) && picktaskstageflagDtl.length>0){
							picktaskListArr.gotostage = 'Y';
							if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
								picktaskListArr.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',transactionInternalId,warehouseLocationId);
								if(picktaskListArr.boolAnyItemIsAlreadyStaged == 'Y'){
									picktaskListArr.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
								}
								else{
									picktaskListArr.starDescription = '';	
								}

							}
							picktaskListArr.isValid=true;
						}else{
							var picktaskstageflagDtlforalreadystaged = obUtility.getSOPickTaskStageflagforAlreadystaged(warehouseLocationId,transactionInternalId,'Single');
							log.debug("picktaskstageflagDtlforalreadystaged",picktaskstageflagDtlforalreadystaged);
							if(utility.isValueValid(picktaskstageflagDtlforalreadystaged) && picktaskstageflagDtlforalreadystaged.length>0){
								picktaskListArr.gotostage = 'Y';
								if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
									picktaskListArr.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',transactionInternalId,warehouseLocationId);
									if(picktaskListArr.boolAnyItemIsAlreadyStaged == 'Y'){
										picktaskListArr.starDescription = translator.getTranslationString('WMS_SUNGLEORDER_ZONEPICKING.STARDESCRIPTION');
									}
									else{
										picktaskListArr.starDescription = '';	
									}

								}
								picktaskListArr.isValid=true;
							}else{
								picktaskListArr.gotostage = 'N';
							}
						}
					}
					else{
						picktaskListArr.gotostage = 'N';
					}
				}
				else{
					picktaskListArr.isValid=false;	
				}
			}
			else{
				picktaskListArr.isValid=false;	
			}
			//log.debug({title:'picktaskListArr',details:picktaskListArr});
		}
		catch(e){
			picktaskListArr.isValid = false;
			picktaskListArr.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+'Stack :'+e.stack});
		}

		return picktaskListArr;
	}

	function _getPickTaskResultsWithNQuery(pickTaskDetails,boolShowCompleted,boolShowOnlyCompleted){

		log.debug('boolShowOnlyCompleted',boolShowOnlyCompleted);
		var vOrderId  =	pickTaskDetails.orderInternalId;
		var vWhLocationId =	pickTaskDetails.whLocationId;
		var vCurrentUser =	pickTaskDetails.currentUser;

		var myPickTaskQuery = query.create({
			type: query.Type.PICK_TASK
		});
		var itemFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'item^item'
		});
		var pickActionsFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'pickactions'
		});
		var pickTaskUomFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'units'
		});
		var subItemFieldsJoin = pickActionsFieldsJoin.autoJoin({ // ADDITION
			fieldId: 'subitemof^item'
		});


		// Create a query column
		myPickTaskQuery.columns = [

pickActionsFieldsJoin.createColumn({
	fieldId: 'quantity'
}),
pickActionsFieldsJoin.createColumn({
	fieldId: 'pickedquantity'
}),
itemFieldsJoin.createColumn({
	fieldId: 'stockunit'
}),
itemFieldsJoin.createColumn({
	fieldId: 'description'
}),
itemFieldsJoin.createColumn({
	fieldId: 'upccode'
}),
pickActionsFieldsJoin.createColumn({
	fieldId: 'remainingquantity'
}),
pickTaskUomFieldsJoin.createColumn({
	fieldId: 'unitname'               
}),
myPickTaskQuery.createColumn({
	fieldId: 'units'              
}),
pickActionsFieldsJoin.createColumn({
	fieldId: 'subitemof'
}),
subItemFieldsJoin.createColumn({
	fieldId: 'fullname'
}),
myPickTaskQuery.createColumn({
	fieldId: 'id'
}),
myPickTaskQuery.createColumn({
	fieldId: 'item'
}),
itemFieldsJoin.createColumn({
	fieldId: 'itemid'
}),
myPickTaskQuery.createColumn({
	fieldId: 'picker'
}),
pickTaskUomFieldsJoin.createColumn({
	fieldId: 'conversionrate'               
})
];
        var  pickTaskQuery_pickingType = myPickTaskQuery.createCondition({
            fieldId: 'wave^transaction.picktype',
            operator: query.Operator.ANY_OF,
            values: 'Single'
        });
		var  pickActionsQuery_orderId = pickActionsFieldsJoin.createCondition({
			fieldId: 'ordernumber',
			operator: query.Operator.ANY_OF,
			values: vOrderId
		});
		var piscTaskQuery_Location = myPickTaskQuery.createCondition({
			fieldId: 'location',    
			operator: query.Operator.ANY_OF,
			values: vWhLocationId
		});
		var pickTaskQuery_Picker = myPickTaskQuery.createCondition({
			fieldId: 'picker',
			operator: query.Operator.ANY_OF,
			values: [null,vCurrentUser]
		});
		var pickActionStatusCond = myPickTaskQuery.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['READY','INPROGRESS']
		});
		var pickActionsQuery_status = pickActionsFieldsJoin.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF_NOT,
			values: ['CANCELLED','DONE','FAILED']
		});
		if(boolShowCompleted == false || boolShowCompleted == "false" ){
			pickActionsQuery_status = pickActionsFieldsJoin.createCondition({
				fieldId: 'status',
				operator: query.Operator.ANY_OF_NOT,
				values: ['CANCELLED','DONE','FAILED','PICKED']
			});

		}

		if(utility.isValueValid(boolShowOnlyCompleted) && 
				(boolShowOnlyCompleted ==true || boolShowOnlyCompleted == "true")){
			pickActionsQuery_status = pickActionsFieldsJoin.createCondition({
				fieldId: 'status',
				operator: query.Operator.ANY_OF,
				values: ['PICKED','STAGED']
			});
			var pickActionsQuantityStagedCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'inventorydetail.quantitystaged',			
				operator: query.Operator.EQUAL,
				values: 0
			});
			myPickTaskQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.bin.binnumber'
			}));
			myPickTaskQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.bin.zone.name'
			}));
			myPickTaskQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.bin.zone'

			}));
			myPickTaskQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'inventorydetail.quantity'
			}));
			myPickTaskQuery.columns.push(pickActionsFieldsJoin.createColumn({
				fieldId: 'ordernumber'
			}));
			var remaining_qtycond = myPickTaskQuery.createCondition({
				fieldId: 'totalremainingquantity',
				operator: query.Operator.EQUAL,
				values: 0
			});

			myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_orderId,piscTaskQuery_Location,pickTaskQuery_Picker,pickActionStatusCond,
					pickActionsQuery_status,pickActionsQuantityStagedCond,remaining_qtycond,pickTaskQuery_pickingType);
		} 
		else{
			if(boolShowCompleted == false || boolShowCompleted == "false" ){
				var pickActionsQuery_qtycond = pickActionsFieldsJoin.createCondition({
					fieldId: 'remainingquantity',
					operator: query.Operator.GREATER,
					values: 0
				});
				myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_orderId,piscTaskQuery_Location,pickTaskQuery_Picker,pickActionStatusCond,
						pickActionsQuery_status,pickActionsQuery_qtycond,pickTaskQuery_pickingType);
			}
			else{
				myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_orderId,piscTaskQuery_Location,pickTaskQuery_Picker,pickActionStatusCond,
						pickActionsQuery_status,pickTaskQuery_pickingType);
			}
		}


		var results = myPickTaskQuery.runPaged({
			pageSize: 1000
		});

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


	function getPickTaskDetailsForBins(pickTaskIdArr,objpickTaskDetails,zoneIdArray,currentUserId,isZonePickingEnabled)
	{
		var pickTaskListArr = [];
		var binResults = binApi.recommendPickPathForPickTasks({pickTaskIds:pickTaskIdArr});
		var zeroQtyPickTaskArr = [];
		if (binResults !== null && binResults !== undefined && binResults !== 'null') {
			var itemDesc = '';
			var itemUpcCode = '';
			var lineRemainingQty = '';
			var binData = '';
			var pickTaskId =  '';
			var binResult = '';
			var p = 0;
			var currRow = '';
			var uomText = '';
			var qtyToShow = 0;
			var stockuntText ='';
			var lineitemsubitem = '';
			var pickQuantity = 0;
			var totalpckdquantity = 0;
			var pickTaskIdIndex = -1;
			var binResultPickTaskId = -1;

			var itemName = '';
			var itemId = '';
			var recommendedbinName = '';
			var recommendedBinId = '';
			var binZone = '';

			for( binResult in binResults.bins){
				if(binResults.bins[binResult]){

					pickTaskIdIndex = binResults.bins[binResult].inputIndex;
					binResultPickTaskId = pickTaskIdArr[pickTaskIdIndex];
					itemDesc ='';
					itemUpcCode ='';
					lineRemainingQty ='';
					currRow = '';
					uomText = '';
					stockuntText = '';
					var pickerId = 0;
					//Currently RBA is not returning all required fields so this for loop can be removed once core team make changes to 
					//RBA to returns all fields
					var objpickTaskDetailsLength = objpickTaskDetails.length;
					log.debug('binResult',binResults.bins[binResult]);
					for( p = 0; p< objpickTaskDetailsLength; p++) {
						pickTaskId = objpickTaskDetails[p].id;
						if(parseInt(pickTaskId) === binResultPickTaskId) {
							itemDesc = objpickTaskDetails[p].description;
							itemUpcCode = objpickTaskDetails[p].upccode;
							lineRemainingQty = objpickTaskDetails[p].remainingquantity;
							qtyToShow = lineRemainingQty ;
							uomText = objpickTaskDetails[p].unitname;
							stockuntText = objpickTaskDetails[p].stockunit;
							lineitemsubitem = objpickTaskDetails[p].lineitemsubitemof;
							pickQuantity = objpickTaskDetails[p].quantity;
							totalpckdquantity = objpickTaskDetails[p].pickedquantity;
							itemName = objpickTaskDetails[p].itemid;
							itemId = objpickTaskDetails[p].item;
							pickerId = objpickTaskDetails[p].picker;
							break;
						}
					}
					if(parseFloat(qtyToShow) > 0 && uomText !== null && uomText !== undefined && uomText !== ''){
						qtyToShow = qtyToShow + ' ' +uomText;
					}
					var binStatus = binResults.bins[binResult].status.code;
					var zoneId = '';

					if(binStatus == 'SUCCESS'){
						binData = binResults.bins[binResult].data;
						log.debug({title:'binData',details:binData});
						recommendedbinName = binData.bin.name;
						recommendedBinId = binData.bin.id;
						binZone  = binData.zone.name;
						zoneId = binData.zone.id;

					}
					else{
						recommendedbinName = '';
						recommendedBinId = '';
						binZone = '';
					}
					if(isZonePickingEnabled == false){
						if(zoneIdArray.indexOf(zoneId) == -1){
							zoneIdArray.push(zoneId);
						}
					}
					else{
						if(isZonePickingEnabled == true &&
								(!utility.isValueValid(zoneId) || zoneId == -1) ){
							zoneId = "0";
						}
					}
					log.debug('zoneIdArray',zoneIdArray);
					log.debug('zoneId',zoneId);
					log.debug('zoneIdArray.indexOf(zoneId)',zoneIdArray.indexOf(zoneId));
					if(((zoneIdArray.indexOf(zoneId) != -1  )|| currentUserId == pickerId ) || 
							(isZonePickingEnabled == false)){

						currRow = {item:itemName,internalid:itemId,id:binResultPickTaskId,quantity:pickQuantity,
								stockunitText:stockuntText,recommendedbin:recommendedbinName,'Recommended BinId':recommendedBinId,
								recommendedBinName:recommendedbinName,
								zoneText:binZone,name:binResultPickTaskId,quantitywithUOM:qtyToShow,
								salesdescription:itemDesc,upccode:itemUpcCode,lineitemremainingquantity:lineRemainingQty,units:uomText,
								lineitemsubitemof:lineitemsubitem,totalpickedquantity:totalpckdquantity};

						if(parseFloat(lineRemainingQty) > 0){
							pickTaskListArr.push(currRow);
						}
						else{
							zeroQtyPickTaskArr.push(currRow);
						}
					}
				}
			}

		}

		if(zeroQtyPickTaskArr.length > 0){
			pickTaskListArr = pickTaskListArr.concat(zeroQtyPickTaskArr);
		}

		return pickTaskListArr ;
	}

	function getPickTaskDetailsForNoBins(pickTaskIdArr,objpickTaskDetails)
	{
		var pickTaskListArr = [];
		log.debug({title:'getPickTaskDetailsForNoBins',details:objpickTaskDetails});
		var count = 0;
		var itemDesc = '';
		var itemUpcCode = '';
		var lineRemainingQty = '';
		var pickTaskId =  '';
		var currRow = '';
		var uomText = '';
		var qtyToShow = 0;
		var stockuntText ='';
		var unitText = '';
		var lineitemsubitem = '';
		var pickQuantity = 0;
		var totalpckdquantity = 0;
		var itemName = '';
		var itemId = '';
		var recommendedbinName = '';
		var recommendedBinId = '';
		var zoneName = '';

		var objpickTaskDetailsLength = objpickTaskDetails.length;

		for(var objPicktaskIndex=0;objPicktaskIndex<objpickTaskDetailsLength;objPicktaskIndex++)
		{
			pickTaskId = objpickTaskDetails[objPicktaskIndex].id;					
			itemName = objpickTaskDetails[objPicktaskIndex].itemText;
			itemId = objpickTaskDetails[objPicktaskIndex].item;
			itemDesc = objpickTaskDetails[objPicktaskIndex].salesdescription;
			itemUpcCode = objpickTaskDetails[objPicktaskIndex].upccode;
			lineRemainingQty = objpickTaskDetails[objPicktaskIndex].lineitemremainingquantity;
			qtyToShow = objpickTaskDetails[objPicktaskIndex].lineitemremainingquantity ;
			uomText = objpickTaskDetails[objPicktaskIndex].unitsText;
			unitText = objpickTaskDetails[objPicktaskIndex].unitstypeText;
			lineitemsubitem = objpickTaskDetails[objPicktaskIndex].lineitemsubitemofText;
			pickQuantity = objpickTaskDetails[objPicktaskIndex].lineitemremainingquantity;
			totalpckdquantity = objpickTaskDetails[objPicktaskIndex].totalpickedquantity;
			zoneName = objpickTaskDetails[objPicktaskIndex].zoneText;

			if(parseFloat(qtyToShow) > 0 && uomText !== null && uomText !== undefined && uomText !== ''){
				qtyToShow = qtyToShow + ' ' +uomText;
			}
			currRow = {item:itemName,internalid:itemId,id:pickTaskId,quantity:pickQuantity,
					stockunitText:stockuntText,recommendedbin:recommendedbinName,'Recommended BinId':recommendedBinId,
					recommendedBinName:recommendedbinName,
					zoneText:zoneName,name:pickTaskId,quantitywithUOM:qtyToShow,
					salesdescription:itemDesc,upccode:itemUpcCode,lineitemremainingquantity:lineRemainingQty,units:uomText,
					lineitemsubitemof:lineitemsubitem,totalpickedquantity:totalpckdquantity};
			count++; 
			pickTaskListArr.push(currRow);


		}

		return pickTaskListArr;
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

	return {
		'post': doPost,
		lookupOnLocationForUseBins:lookupOnLocationForUseBins,
		getPickTaskDetailsForNoBins:getPickTaskDetailsForNoBins,
		getPickTaskDetailsForBins:getPickTaskDetailsForBins
	};

});
