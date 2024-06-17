/**
 * Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
 define(['N/search','./wms_utility','./wms_translator', 'N/record', './big','./wms_inventory_utility','N/format',
 	'./wms_tallyScan_utility'],
		/**
		 * @param {search} search
		 */
		 function(search, utility, translator, record, Big, invtUtility,format,tallyScanUtility) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {

		var response = {};
		log.debug({title:'requestBody',details:requestBody});
		var requestParams = '';
		var invCountPostingObj = {};
		var arrOpenTaskId = [];
		var serialArraytoDelete ='';
		var inventoryCountRecId='';
		var openTaskId='';
		var invCountPostingOutputObj = {};
		try{
			if(utility.isValueValid(requestBody))
			{
				requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var binInternalId = requestParams.binInternalId;
				var scannedQuantity = requestParams.scannedQuantity;
				var lotName = requestParams.lotName;
				var cyclePlanId = requestParams.cyclePlanId;
				var statusInternalId = requestParams.statusInternalId;
				var itemInternalId = requestParams.itemInternalId;
				var scannedStatusName = requestParams.scannedStatusName;
				var action = requestParams.action;
				var binnumber = requestParams.binnumber;
				var cyclePlanInternalId = requestParams.cyclePlanInternalId;
				var itemType = requestParams.itemType;
				var expectedQuantity = requestParams.expectedQuantity;
				var scannedLotList = requestParams.scannedLotList;
				var scannedQtyList = String(requestParams.scannedQtyList);
				var scannedStatusList = requestParams.scannedStatusList;
				var scannedStatusNameList = requestParams.scannedStatusNameList;
				var lineNum = requestParams.lineNum;
				var actualBeginTime = requestParams.actualBeginTime;
				var unitsType = requestParams.unitsType;
				var unit = requestParams.unit;
				var multiStatusInvItem = requestParams.multiStatusInvItem;
				var stockUnitName = requestParams.stockUnitName;
				var remainingQuantity = requestParams.remainingQuantity;
				var scannedQtyUOMList = requestParams.scannedQtyUOMList;
				var conversionRate = requestParams.conversionRate;
				var totalTaskCount = requestParams.totalTaskCount;
				var completedTaskCount = requestParams.completedTaskCount;
				var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
				var locUseBinsFlag  = requestParams.locUseBinsFlag;
				var noStockAction = requestParams.NoStock;
				var noBinsActions = requestParams.noBinsActions;
				var openTaskInternalid = requestParams.wmsopentaskinternalid;
				var scannedQuantityFromTimeLinkClickPrePop  = requestParams.scannedQuantityFromTimeLinkClickPrePop;
				var conversionRatefromTimeClickPrePop  = requestParams.conversionRatefromTimeClickPrePop;
				var opentaskQtyofTimelinkclick = requestParams.existingotqtybeforetimelinkclick;
				var opentaskInvstatusofTimelinkclick = requestParams.existingotinvstatusbeforetimelinkclick;
				var opentaskLotofTimelinkclick = requestParams.existingotlotbeforetimelinkclick;
				var barcodeQuantity = requestParams.barcodeQuantity;
	 			var isTallyScanRequired = requestParams.isTallyScanRequired;
	 			var qtyUomSelected = requestParams.qtyUomSelected;
	 			var tallyLoopObj = requestParams.tallyLoopObj;
	 			var tallyScanOrderQty = requestParams.tallyScanBarCodeQty;
	 			var tallyscanitem = requestParams.tallyscanitem;
	 			var tallyScanSerial = requestParams.tallyscanserial;
	 			var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
	 			var transactionuomId = requestParams.uomId;
	 			var numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
	 			var tallyLotScannedQty = utility.isValueValid(requestParams.tallyLotScannedQty) ? requestParams.tallyLotScannedQty : 0;
	 			tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};

	             stockUnitName = utility.isValueValid(unit) ? unit : stockUnitName;
				if(!utility.isValueValid(scannedQuantity)  && utility.isValueValid(scannedQuantityFromTimeLinkClickPrePop))
				{
					scannedQuantity = scannedQuantityFromTimeLinkClickPrePop;
					conversionRate = conversionRatefromTimeClickPrePop;
				}

	 			if(utility.isValueValid(isTallyScanRequired) && isTallyScanRequired){
	 				if(utility.isValueValid(action) && action == 'EnterQuantity'){
	 					conversionRate = utility.isValueValid(conversionRate) ? conversionRate : 1;
	 					response.tallyScanItem = tallyscanitem;
	 					response.tallyScanitemId = itemInternalId;
	 					response.tallyScanSerial = tallyScanSerial;
	 					response.warehouseLocationId = warehouseLocationId;
	 					response.unitType = unitsType;
	 					response.barcodeQuantity = barcodeQuantity;
	 					response.transactionUomName = unit;
	 					response.transactionuomId = transactionuomId;
	 					response.transactionUomConversionRate = conversionRate;
	 					response.uomSelectionforFirstItr = uomSelectionforFirstItr;
	 					response.qtyUomSelected = qtyUomSelected;
	 					response.tallyScanOrderQty = tallyScanOrderQty;
	 					response.isTallyScanRequired = isTallyScanRequired;
	 					response.itemType = itemType;
	 					response.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
	 					
	 					if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
	 						response = tallyScanUtility.getSerialforTallyScanCYCC(response);
	 						response.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned)+1;
	 					}else{
	 						response = tallyScanUtility.validateItemTallyScan(response);
	 						if(utility.isValueValid(itemInternalId) && itemInternalId != response.tallyScanitemId){
                                response.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
			                    response.isValid = false;
			                 }
	 					}
	 					
	 					if(response.isValid){
	 						response = tallyScanUtility.getCalculatedTallyScanQty(response);
	 						
	 						tallyLoopObj = tallyScanUtility.createOrUpdateTallyLoopObj(tallyLoopObj,itemType,cyclePlanInternalId,
	 							lineNum,scannedQuantity,statusInternalId,lotName,response);
	 						response.isSamePageNavigationRequired = 'T';
	 						response.tallyLoopObj = tallyLoopObj;
	 						//var quantityScanned = scannedQuantity;
	 						var convRate = conversionRate;
	 						if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
		                        scannedQuantity = barcodeQuantity[0].value;
		                       
		                        if(unitsType){
		                        var uomResultObj =  tallyScanUtility.getUOMDetails(unitsType);
		                        var qtyUOMObject = {};
		                        qtyUOMObject.unitId = uomSelectionforFirstItr;
		                        for(var itr in uomResultObj){
			                     if(uomResultObj[itr]['uom.internalid'] == uomSelectionforFirstItr){
				                     qtyUOMObject.conversionRate = uomResultObj[itr]['uom.conversionrate'];
				                     convRate = uomResultObj[itr]['uom.conversionrate'];
				                    qtyUOMObject.unitName = uomResultObj[itr]['uom.unitname'];
			                           }
		                        }
		                                response.qtyUOMObj = qtyUOMObject;
		                        }
		                      }
	 						var quantityUOMObj = tallyScanUtility.getQtyObjectToBePopulated(scannedQuantity,response.qtyUOMObj,convRate);
	 						response.barcodeQuantity = quantityUOMObj;
	 						response.tallyScanBarCodeQty = parseFloat(scannedQuantity) ;
	 						response.isValid = true;
	 						response.uomTobePopulated = quantityUOMObj;

	 						if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
	 							tallyLotScannedQty = Number((Big(parseFloat(tallyLotScannedQty)).plus(parseFloat(response.tallyscanQty))).toFixed(8));
	 							response.tallyLotScannedQty = tallyLotScannedQty;
	 						}else if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
	 							var serialEntryDetails = invtUtility.getSerialEntryDetails(tallyScanSerial,lineNum,cyclePlanInternalId,binInternalId);

	 							if(serialEntryDetails.length > 0)
	 							{
	 								response.errorMessage = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.SERIAL_ALREADY_SCANNED');
	 								response.isValid = false;
	 							}else{
	 								var isSerialExistsInInventory='';
	 								if(inventoryStatusFeature === true)
	 								{
	 									isSerialExistsInInventory = invtUtility.isInventoryNumberExistsCYCCbystatus(itemInternalId,tallyScanSerial,warehouseLocationId,binInternalId,statusInternalId);
	 								}
	 								else
	 								{
	 									isSerialExistsInInventory = invtUtility.isInventoryNumberExistsCYCC(itemInternalId,tallyScanSerial,warehouseLocationId,binInternalId);
	 								}
	 								if(isSerialExistsInInventory)
	 								{
	 									response.errorMessage = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.SERIAL_EXISTING_IN_LOCATION');
	 									response.isValid = false;
	 								}else{
	 									invtUtility.createSerialEntry(tallyScanSerial, cyclePlanInternalId, lineNum, itemInternalId, binInternalId, 1, statusInternalId, inventoryStatusFeature);
	 								}
	 							}
	 						}
	 						log.debug('response',response);
	 					}

	 				}else if(utility.isValueValid(action) && action == 'Done'){

	 					scannedQuantity = Number(Big(tallyScanOrderQty).toFixed(8));
	 					invCountPostingObj ={};
						invCountPostingObj.planInternalId = cyclePlanInternalId;
						invCountPostingObj.planLineNo = lineNum;
						invCountPostingObj.enterQty = scannedQuantity;
						invCountPostingObj.itemType = itemType;
						invCountPostingObj.itemId = itemInternalId;
						invCountPostingObj.whLocation = warehouseLocationId;
						invCountPostingObj.conversionRate = conversionRate;
						invCountPostingObj.isTallyScanRequired = isTallyScanRequired;

	 					if(!inventoryStatusFeature){

	 						if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
	 							openTaskId=invtUtility.updateCycleCountOpenTask(cyclePlanInternalId,
													itemInternalId,lineNum,
													Number(Big(scannedQuantity).toFixed(8)),binInternalId,
													itemType,warehouseLocationId,'',cyclePlanInternalId,
													cyclePlanId,actualBeginTime,unit,
													conversionRate );
								arrOpenTaskId.push(openTaskId);
								if(locUseBinsFlag == false){

									invCountPostingObj.action = noBinsActions;
									if(noBinsActions == 'timeLinkClicked'){
										serialArraytoDelete = invtUtility.getSerialsFordelete(openTaskInternalid);
	 				 					serialArraytoDelete =serialArraytoDelete.split(',');
										invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick;
										invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
										invCountPostingObj.oldLottimelink = opentaskLotofTimelinkclick;
									}
									invCountPostingObj.serialArraytoDelete = serialArraytoDelete;
									invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
								}else{
									invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
								}
								
	 						inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;
	 						if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
	 							response.isValid = false;
	 							response.errorMessage = invCountPostingOutputObj.errorMessage;
	 						} 
	 						invtUtility.updateWMSOpenTask(arrOpenTaskId);

	 						}else{
	 							if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
		 							var tallyScannedQtyObj = tallyLoopObj[cyclePlanInternalId + '-'+lineNum];
		 							for(var statusIterator in tallyScannedQtyObj){
		 								addSimilarLotNamesAndStatus(tallyScannedQtyObj[statusIterator].lotName, 
		 										cyclePlanInternalId,
		 										lineNum,
		 										itemInternalId,
		 										binInternalId,
		 										tallyScannedQtyObj[statusIterator].quantity,
		 										tallyScannedQtyObj[statusIterator].statusId,
		 										inventoryStatusFeature);
		 							}
		 							invCountPostingObj.enterQty = tallyLotScannedQty;
	 							}
	 							else{
	 								var tallyScannedQtyObj = tallyLoopObj[cyclePlanInternalId + '-'+lineNum];
	 								for(var statusIterator in tallyScannedQtyObj){
	 									invtUtility.createSerialEntry('INVTCYC', cyclePlanInternalId, lineNum, itemInternalId, binInternalId, 
	 										tallyScannedQtyObj[statusIterator].quantity, tallyScannedQtyObj[statusIterator].statusId, inventoryStatusFeature);
	 								//	statusId.push(tallyScannedQtyObj[statusIterator].statusId);
	 								}
	 							}
	 							if(locUseBinsFlag == false){

	 								invCountPostingObj.action = noBinsActions;
	 								if(noBinsActions == 'timeLinkClicked'){
	 									invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick;
	 									invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
	 									invCountPostingObj.oldLottimelink = opentaskLotofTimelinkclick;
	 								}
	 								invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
	 							}else{
									invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
								}
	 						inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;
	 						if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
	 							response.isValid = false;
	 							response.errorMessage = invCountPostingOutputObj.errorMessage;
	 						}else{

	 							var invListSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId, 
	 									inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid);

	 							for(var i in invListSearchRes){
	 								openTaskId ='';
	 								var qty = invListSearchRes[i].custrecord_wmsse_ser_qty;
	 								var lotNum = invListSearchRes[i].custrecord_wmsse_ser_no;
	 								var status = invListSearchRes[i].custrecord_serial_inventorystatus;
	 								log.debug({title:'warehouseLocationId',details:warehouseLocationId});
	 								openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, 
	 										Number(Big(qty).toFixed(8)),binInternalId, itemType, warehouseLocationId, lotNum, inventoryCountRecId, 
	 										cyclePlanId, actualBeginTime,unit, conversionRate, '','',status);
	 								var serialNotes = 'because of Inv Item is processed for CYCC we have marked this Inv Item as closed';
	 								utility.closeSerialEntryStatusCycleCount(invListSearchRes[i], serialNotes);
	 								arrOpenTaskId.push(openTaskId);
	 							}

	 						}
	 					  }
	 					}else{
	 						 
	 						var statusId = [];
	 						var serialOutputObj = {};

	 						if(parseFloat(scannedQuantity) > 0 ){
	 							if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
	 								var cyccPlanData = {};
	 								cyccPlanData.cyccPlanInternalId = cyclePlanInternalId;
	 								cyccPlanData.itemInternalId =itemInternalId;
	 								cyccPlanData.lineNum =lineNum;
	 								cyccPlanData.binInternalId =binInternalId;
	 								cyccPlanData.itemType = itemType;
	 								cyccPlanData.cyclecountPlan =cyclePlanId;
	 								cyccPlanData.actualBeginTime =actualBeginTime;
	 								cyccPlanData.unitType =unit;
	 								cyccPlanData.conversionRate =conversionRate;
	 								cyccPlanData.warehouseLocationId = warehouseLocationId;
	 								serialOutputObj = invtUtility.getSerialItemdataforCYCCtallyscan(cyccPlanData);
	 				 				if(noBinsActions == 'timeLinkClicked'){
	 				 					serialArraytoDelete = invtUtility.getSerialsFordelete(openTaskInternalid);
	 				 					serialArraytoDelete =serialArraytoDelete.split(',');
	 				 				}
	 				 				invCountPostingObj.serialArraytoDelete = serialArraytoDelete;
	 							}else if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'){
		 							var tallyScannedQtyObj = tallyLoopObj[cyclePlanInternalId + '-'+lineNum];
		 							for(var statusIterator in tallyScannedQtyObj){
		 								addSimilarLotNamesAndStatus(tallyScannedQtyObj[statusIterator].lotName, 
		 										cyclePlanInternalId,
		 										lineNum,
		 										itemInternalId,
		 										binInternalId,
		 										tallyScannedQtyObj[statusIterator].quantity,
		 										tallyScannedQtyObj[statusIterator].statusId,
		 										inventoryStatusFeature);
		 							}
		 							invCountPostingObj.enterQty = tallyLotScannedQty;

		 						}else{
	 								var tallyScannedQtyObj = tallyLoopObj[cyclePlanInternalId + '-'+lineNum];
	 								for(var statusIterator in tallyScannedQtyObj){
	 									invtUtility.createSerialEntry('INVTCYC', cyclePlanInternalId, lineNum, itemInternalId, binInternalId, 
	 										tallyScannedQtyObj[statusIterator].quantity, tallyScannedQtyObj[statusIterator].statusId, inventoryStatusFeature);
	 									statusId.push(tallyScannedQtyObj[statusIterator].statusId);
	 								}
	 							}

	 							
	 							invCountPostingObj.serialStatusArr = serialOutputObj.serialStatusArr;
	 							
								if(locUseBinsFlag == false){

									invCountPostingObj.action = noBinsActions;
									if(noBinsActions == 'timeLinkClicked'){
										invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick;
										invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
										invCountPostingObj.oldLottimelink = opentaskLotofTimelinkclick;
									}
									invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
								}else{
									invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
								}
	 							inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

	 							if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
	 								utility.deleteSerialEntry(cyclePlanInternalId, lineNum, itemInternalId);
	 								response.isValid = false;
	 								response.errorMessage = invCountPostingOutputObj.errorMessage;
	 							}else{

	 								if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
										arrOpenTaskId = serialOutputObj.arrOpenTaskId;
										invtUtility.updateWMSOpenTask(arrOpenTaskId);
	 								}else{
	 									var invListSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId, 
	 										inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid);

	 									for(var i in invListSearchRes){
	 										openTaskId ='';
	 										var qty = invListSearchRes[i].custrecord_wmsse_ser_qty;
	 										var lotNum = invListSearchRes[i].custrecord_wmsse_ser_no;
	 										var status = invListSearchRes[i].custrecord_serial_inventorystatus;
	 										openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, 
	 											Number(Big(qty).toFixed(8)),binInternalId, itemType, warehouseLocationId, lotNum, inventoryCountRecId, 
	 											cyclePlanId, actualBeginTime,unit, conversionRate, '','',status);
	 										var serialNotes = 'because of Inv Item is processed for CYCC we have marked this Inv Item as closed';
	 										utility.closeSerialEntryStatusCycleCount(invListSearchRes[i], serialNotes);
	 										arrOpenTaskId.push(openTaskId);
	 									}
	 								}
	 							}
	 						}
	 					}
	 					utility.deleteTransactionLock('inventorycount',cyclePlanInternalId, lineNum);
	 					var obj = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber, locUseBinsFlag);
	 					response.completionStatus = obj.completionStatus;
	 					completedTaskCount = parseFloat(totalTaskCount) - obj.pendingTaskCount;
	 					response.isValid = true;
	 					response.cyclePlanId = cyclePlanId;
	 					response.openTaskIdArray = arrOpenTaskId;
	 					if(utility.isValueValid(stockUnitName))
	 						response.completedQtyUOM = scannedQuantity + " " + stockUnitName;
	 					else
	 						response.completedQtyUOM = scannedQuantity ;
	 					if(inventoryStatusFeature)
	 						response.completedQtyStatus = scannedStatusName ;

	 				}else if(utility.isValueValid(action) && action == 'lotScanAction'){
	 					if(utility.isValueValid(lotName)){
	 					var remainingQuantityUOM = requestParams.remainingQuantityUOM;
	 					var unitId = '';
	 					if(utility.isValueValid(transactionuomId)){
	 					 unitId = utility.isValueValid(uomSelectionforFirstItr)? uomSelectionforFirstItr : transactionuomId;
	 				    }
	 				response.barcodeQuantity = [{'value': '1', 'unit': unitId}];
	 				response.remainingQuantityUOM = remainingQuantityUOM;
	 				response.remainingQuantity = remainingQuantity;
	 				response.lotName = lotName;
	 					}
	 					else{
	 						response.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
	 						response.isValid = false;
	 					}
	 				}
	 			}
	 			else if(noStockAction == 'NoStock')
	 			{
	 				scannedQuantity = 0;
	 				if(noBinsActions == 'timeLinkClicked' && (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')){
	 					serialArraytoDelete = invtUtility.getSerialsFordelete(openTaskInternalid);
	 					serialArraytoDelete =serialArraytoDelete.split(',');
	 				}

	 				invCountPostingObj ={};
	 				invCountPostingObj.planInternalId = cyclePlanInternalId;
	 				invCountPostingObj.planLineNo = lineNum;
	 				invCountPostingObj.enterQty = 0;
	 				invCountPostingObj.itemType = itemType;
	 				invCountPostingObj.itemId = itemInternalId;
	 				invCountPostingObj.whLocation = warehouseLocationId;
	 				invCountPostingObj.action = noBinsActions;
	 				invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick ;  
	 				invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
	 				invCountPostingObj.oldLottimelink = opentaskLotofTimelinkclick;
	 				invCountPostingObj.serialArraytoDelete = serialArraytoDelete;
	 				invCountPostingObj.noStockAction = noStockAction ;
	 				if(locUseBinsFlag == false){
	 				invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
	 				}else{
	 					invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
	 				}
	 				inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;
	 				log.debug('inventoryCountRecId',inventoryCountRecId);
	 				if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
	 					response['isValid'] = false;
	 					response['errorMessage'] = invCountPostingOutputObj.errorMessage;
	 				}else{
	 					openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, 
	 						scannedQuantity, binInternalId, itemType, warehouseLocationId, null, inventoryCountRecId, 
	 						cyclePlanId, actualBeginTime,unit, conversionRate);
	 					var parsedCurrentDate = format.parse({
	 						value: utility.DateStamp(),
	 						type: format.Type.DATE
	 					});
	 					record.submitFields({
	 						type: 'customrecord_wmsse_trn_opentask',
	 						id: openTaskId,
	 						values: {
	 							'custrecord_wmsse_currentdate' : parsedCurrentDate
	 						}
	 					});

						if(noBinsActions == 'timeLinkClicked' &&  !(itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') )	
						{

							var serialSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId,
									inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid,noStockAction);
						}	
						arrOpenTaskId.push(openTaskId);		
					}
								
					response['openTaskIdArray'] = arrOpenTaskId;
					var obj = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, null, locUseBinsFlag);
					response['completionStatus'] = obj['completionStatus'];
					response['isValid'] = true;
				}
				//no validation in nobins flows nostock button click,that is why nostock condition is above,other than Nostock the below validation is required
				else if(!utility.isValueValid(scannedQuantity) || parseFloat(scannedQuantity) == 0 || parseFloat(scannedQuantityFromTimeLinkClickPrePop) == 0) {
					
					if(parseFloat(scannedQuantity) == 0 || parseFloat(scannedQuantityFromTimeLinkClickPrePop) == 0){
						if(parseFloat(scannedQuantityFromTimeLinkClickPrePop) == 0){
							scannedQuantity = 0;
						}
						invCountPostingObj ={};
						invCountPostingObj.planInternalId = cyclePlanInternalId;
						invCountPostingObj.planLineNo = lineNum;
						invCountPostingObj.enterQty = scannedQuantity;
						invCountPostingObj.itemType = itemType;
						invCountPostingObj.itemId = itemInternalId;
						invCountPostingObj.whLocation = warehouseLocationId;
						invCountPostingObj.binInternalId = binInternalId;
						invCountPostingObj.zeroQty = 'zeroQty';
						invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
						inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

						if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
							response.isValid = false;
							response.errorMessage = invCountPostingOutputObj.errorMessage;
						}else{
							 invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId,
									inventoryStatusFeature, '', locUseBinsFlag, '','NoStock');
							 openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, 
									scannedQuantity, binInternalId, itemType, warehouseLocationId, null, inventoryCountRecId, 
									cyclePlanId, actualBeginTime);
							 arrOpenTaskId.push(openTaskId);
							 var planCompleteStatusObj = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber, locUseBinsFlag);
							response.completionStatus = planCompleteStatusObj.completionStatus;
							completedTaskCount = parseFloat(totalTaskCount) - planCompleteStatusObj['pendingTaskCount'];
							response.isValid = true;
							response.cyclePlanId = cyclePlanId;
							response.openTaskIdArray = arrOpenTaskId;
						}

					}else{
						response.isValid = false;
					response.errorMessage =  translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
					}
				}

				else if(action == 'totalLotQtyScreen' && !((itemType == 'inventoryitem' || itemType == 'assemblyitem') && multiStatusInvItem == 'false')){

					var serialSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId, 
							inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid);
					serialNotes = 'because of incomplete transaction this is closed';
					for(var i in serialSearchRes){
						utility.closeSerialEntryStatusCycleCount(serialSearchRes[i],serialNotes);
					}
					if(utility.isValueValid(barcodeQuantity))
					{
						response.barcodeQuantity =  barcodeQuantity;
					}									
					

					if(itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'){
						conversionRate = utility.isValueValid(conversionRate) ? conversionRate : 1;
						var convertionQty = Number(Big(parseFloat(scannedQuantity)).mul(conversionRate)) ;
						if(convertionQty.toString().indexOf('.') != -1)
						{
							response.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
							response.isValid = false;
						}else{
							response.isValid = true;
							response.scannedQuantity = scannedQuantity;
							response.unitsType = unitsType;
							response.stockUnitName = unit;
							response.conversionRate = conversionRate;
							response.numberOfTimesSerialScanned = 0;
							response.scannedQuantityInEach = convertionQty;
						}
					}else{
						response.expectedQuantity = Number(Big(scannedQuantity).toFixed(8));
						response.remainingQuantity = Number(Big(scannedQuantity).toFixed(8));
						if(utility.isValueValid(stockUnitName)){
							response.remainingQuantityUOM = Number(Big(scannedQuantity).toFixed(8)) + ' ' + stockUnitName;
							response.LotCompletedQtyUOM = Number(Big(scannedQuantity).toFixed(8)) + " " + stockUnitName;
						}else{
							response.remainingQuantityUOM = Number(Big(scannedQuantity).toFixed(8));//scannedQuantity;
							response.LotCompletedQtyUOM = Number(Big(scannedQuantity).toFixed(8));//scannedQuantity;
						}
						response.isValid = true;
						if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
							response.multipleLots = 'true';
					}
				}
				else if((itemType == 'inventoryitem' || itemType == 'assemblyitem') && multiStatusInvItem == 'false'){
					if(utility.isValueValid(scannedQuantity)){
						if(!inventoryStatusFeature){
							scannedQuantity = Number(Big(scannedQuantity).toFixed(8));
							invCountPostingObj ={};
							invCountPostingObj.itemType = itemType;
							invCountPostingObj.planInternalId = cyclePlanInternalId;
							invCountPostingObj.planLineNo = lineNum;
							invCountPostingObj.enterQty = scannedQuantity;
							invCountPostingObj.whLocation = warehouseLocationId;

							if(locUseBinsFlag == false){
								invCountPostingObj.itemId = itemInternalId;
								invCountPostingObj.action = noBinsActions;
								if(noBinsActions == 'timeLinkClicked'){
									invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick;
									invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
								}
								invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);												
							}
							else
							{
								invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
							}
							inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;
							if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
								response.isValid = false;
								response.errorMessage = invCountPostingOutputObj.errorMessage;
							}
							openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, 
									scannedQuantity, binInternalId, itemType, warehouseLocationId, null, inventoryCountRecId, 
									cyclePlanId, actualBeginTime,unit, conversionRate);
							utility.deleteTransactionLock('inventorycount',cyclePlanInternalId, lineNum);

							if(locUseBinsFlag == false && noBinsActions == 'timeLinkClicked' ){
								var invItemofNoInvStatus = true;
								var invListSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId, 
										inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid,'',invItemofNoInvStatus);
							}
							arrOpenTaskId.push(openTaskId);
							var obj = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber, locUseBinsFlag);
							response.completionStatus = obj.completionStatus;
							completedTaskCount = parseFloat(totalTaskCount) - obj.pendingTaskCount;
							response.isValid = true;
							response.cyclePlanId = cyclePlanId;
							response.openTaskIdArray = arrOpenTaskId;
							if(utility.isValueValid(stockUnitName))
								response.completedQtyUOM = scannedQuantity + " " + stockUnitName;
							else
								response.completedQtyUOM = scannedQuantity ;
						}else{

							scannedQuantity = Number(Big(scannedQuantity).toFixed(8));
							if(parseFloat(scannedQuantity) > 0 ){

								invtUtility.createSerialEntry('INVTCYC', cyclePlanInternalId, lineNum, itemInternalId, binInternalId, 
										scannedQuantity, statusInternalId, inventoryStatusFeature);
								var statusId = [];
								statusId.push(statusInternalId);

								invCountPostingObj ={};
								invCountPostingObj.planInternalId = cyclePlanInternalId;
								invCountPostingObj.planLineNo = lineNum;
								invCountPostingObj.enterQty = scannedQuantity;
								invCountPostingObj.itemType = itemType;
								invCountPostingObj.itemId = itemInternalId;
								invCountPostingObj.whLocation = warehouseLocationId;
								invCountPostingObj.serialStatusArr = statusId;

								if(locUseBinsFlag == false){

									invCountPostingObj.action = noBinsActions;
									if(noBinsActions == 'timeLinkClicked'){
										invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick;
										invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
									}
									invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
								}
								else{
									invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
								}
								inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

								if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
									utility.deleteSerialEntry(cyclePlanInternalId, lineNum, itemInternalId);
									response.isValid = false;
									response.errorMessage = invCountPostingOutputObj.errorMessage;
								}else{
									var invListSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId, 
											inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid);

									for(var i in invListSearchRes){
										openTaskId ='';
										var qty = invListSearchRes[i].custrecord_wmsse_ser_qty;
										var status = invListSearchRes[i].custrecord_serial_inventorystatus;
										openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, 
												Number(Big(qty).toFixed(8)),binInternalId, itemType, warehouseLocationId, null, inventoryCountRecId, 
												cyclePlanId, actualBeginTime,unit, conversionRate, '','',status);
										var serialNotes = 'because of Inv Item is processed for CYCC we have marked this Inv Item as closed';
										utility.closeSerialEntryStatusCycleCount(invListSearchRes[i], serialNotes);
										arrOpenTaskId.push(openTaskId);
									}
									utility.deleteTransactionLock('inventorycount',cyclePlanInternalId, lineNum);
									var obj = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber, locUseBinsFlag);
									response.completionStatus = obj.completionStatus;
									completedTaskCount = parseFloat(totalTaskCount) - obj['pendingTaskCount'];
									response.isValid = true;
									response.cyclePlanId = cyclePlanId;
									response.openTaskIdArray = arrOpenTaskId;
									if(utility.isValueValid(stockUnitName))
										response.completedQtyUOM = scannedQuantity + " " + stockUnitName;
									else
										response.completedQtyUOM = scannedQuantity ;

									response.completedQtyStatus = scannedStatusName ;
								}
							}
						}

					}else{
						response.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
					}
				}else if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') || multiStatusInvItem == 'true'){
					if(multiStatusInvItem == 'true'){
						lotName =  'INVTCYC';
					}
					if(utility.isValueValid(lotName) && utility.isValueValid(scannedQuantity))
					{	
					var sumQty = 0;
					if(utility.isValueValid(scannedQtyList)){
						var scannedQtyArray = scannedQtyList.split(',');
						for(var i in scannedQtyArray){
							sumQty = Number((Big(sumQty).plus(parseFloat(scannedQtyArray[i]))).toFixed(8));
						}
					}
					scannedQuantity = Number(Big(scannedQuantity).toFixed(8));
					sumQty =  Number((Big(sumQty).plus(scannedQuantity)).toFixed(8));
					if(sumQty <= parseFloat(expectedQuantity)){
						remainingQuantity = Number((Big(parseFloat(remainingQuantity)).minus(parseFloat(scannedQuantity))).toFixed(8));
						if(!utility.isValueValid(scannedQtyList)){

							scannedQtyList = scannedQuantity;
							scannedLotList = lotName;

							if(inventoryStatusFeature){
								scannedStatusList = statusInternalId;
								scannedStatusNameList = scannedStatusName;
							}
							if(utility.isValueValid(stockUnitName))
								scannedQtyUOMList = scannedQuantity+" " + stockUnitName;
							else
								scannedQtyUOMList = scannedQuantity;
						}else{
							scannedQtyList = scannedQtyList.concat(',').concat(scannedQuantity);
							scannedLotList = scannedLotList.concat(',').concat(lotName);
							if(inventoryStatusFeature){
								scannedStatusList = scannedStatusList.concat(',').concat(statusInternalId);
								scannedStatusNameList = scannedStatusNameList.concat(',').concat(scannedStatusName);
							}
							if(utility.isValueValid(stockUnitName))
								scannedQtyUOMList =scannedQtyUOMList.concat(',').concat( scannedQuantity+" " + stockUnitName);
							else
								scannedQtyUOMList = scannedQtyList;
						}
						addSimilarLotNamesAndStatus(lotName, cyclePlanInternalId, lineNum, itemInternalId, binInternalId,
								scannedQuantity, statusInternalId, inventoryStatusFeature);

						if(utility.isValueValid(barcodeQuantity) && (utility.isValueValid(barcodeQuantity[0]['unit'])))
						{
							var itemAliasUnit = [{'unit':barcodeQuantity[0]['unit']}];
							response.barcodeQuantity =  itemAliasUnit;
						}									
						

						if(sumQty == parseFloat(expectedQuantity)){

							invCountPostingObj ={};
							invCountPostingObj.planInternalId = cyclePlanInternalId;
							invCountPostingObj.planLineNo = lineNum;
							invCountPostingObj.enterQty = sumQty;
							invCountPostingObj.itemType = itemType;
							invCountPostingObj.itemId = itemInternalId;
							invCountPostingObj.whLocation = warehouseLocationId;
							if(locUseBinsFlag == false){
								invCountPostingObj.action = noBinsActions;
								if(noBinsActions == 'timeLinkClicked'){
									invCountPostingObj.oldQtytimelink = opentaskQtyofTimelinkclick;
									invCountPostingObj.oldInvStatustimelink =opentaskInvstatusofTimelinkclick;
									invCountPostingObj.oldLottimelink = opentaskLotofTimelinkclick;
								}
								invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
							}
							else
							{
								invCountPostingOutputObj = invtUtility.inventoryCountPosting(invCountPostingObj);
							}
							inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

							if(inventoryCountRecId == 'INVALID_KEY_OR_REF'){
								utility.deleteSerialEntry(cyclePlanInternalId, lineNum, itemInternalId);
								response.isValid = false;
								response.errorMessage = invCountPostingOutputObj.errorMessage;

							}else{
								var serialSearchRes = invtUtility.deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId,
										inventoryStatusFeature, noBinsActions, locUseBinsFlag, openTaskInternalid);
								var serialNotes;
								var objArray;

								if(multiStatusInvItem == 'true'){
									serialNotes = 'because of Inventory Item is processed for CYCC we have marked this Inv number as closed';

								}else{
									serialNotes = 'because of lot number is processed for CYCC we have marked this lot number as closed';
								}
								for(var i in serialSearchRes){
										openTaskId ='';
									var lotQty = serialSearchRes[i].custrecord_wmsse_ser_qty;
									var lotNum = serialSearchRes[i].custrecord_wmsse_ser_no;
									var status = serialSearchRes[i].custrecord_serial_inventorystatus;

										openTaskId = invtUtility.updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, Number(Big(lotQty).toFixed(8)),
											binInternalId, itemType, warehouseLocationId, lotNum, inventoryCountRecId, cyclePlanId, actualBeginTime,
											unit, conversionRate, '','',status);
									arrOpenTaskId.push(openTaskId);
								}
								for(var i in serialSearchRes){
									utility.closeSerialEntryStatusCycleCount(serialSearchRes[i],serialNotes);
								}

								utility.deleteTransactionLock('inventorycount',cyclePlanInternalId, lineNum);
								var obj = getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber, locUseBinsFlag);
								response.completionStatus = obj.completionStatus;
								completedTaskCount = parseFloat(totalTaskCount) - obj['pendingTaskCount'];
								response.isValid = true;
								response.cyclePlanId = cyclePlanId;
								response.scannedQtyList = scannedQtyList;
								response.openTaskIdArray = arrOpenTaskId;
								response.scannedStatusList = scannedStatusList;

								if(multiStatusInvItem == 'true'){
									response.scannedLotList = scannedLotList;
									response.scannedStatusNameList = scannedStatusNameList;
									response.scannedQtyUOMList = scannedQtyUOMList;
								}else{
									response.scannedLotList_lot = scannedLotList;
									response.scannedStatusNameList_lot = scannedStatusNameList;
									response.scannedQtyUOMList_lot = scannedQtyUOMList;
								}
							}
						}else{

							response.scannedQtyList = scannedQtyList;
							response.scannedLotList = scannedLotList;
							response.scannedStatusList = scannedStatusList;
							response.remainingQuantity = remainingQuantity;
							if(utility.isValueValid(stockUnitName))
								response.remainingQuantityUOM = remainingQuantity + ' ' + stockUnitName;
							else
								response.remainingQuantityUOM = remainingQuantity;
							response.scannedStatusNameList = scannedStatusNameList;
							response.scannedQtyUOMList = scannedQtyUOMList; 
							response.isValid = true;

							response.scannedLotList_lot = scannedLotList;
							response.scannedStatusNameList_lot = scannedStatusNameList;
							response.scannedQtyUOMList_lot = scannedQtyUOMList;

						}
					}else{
						response['isValid'] = false;
						if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'))
						{
							response.errorMessage = translator.getTranslationString('CYCLECOUNTPLAN.QTY_GRETERTHAN_ENTERED_QTY');
						}
						else
						{
							response.errorMessage = translator.getTranslationString('CYCLECOUNTPLAN.QTY_GRETERTHAN_ENTERED_QTY_MULTYINVSTATUS');
						}
					}
					}
					else
					{
						response['isValid'] = false;
						if(!utility.isValueValid(lotName))
							response.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
						else
							response.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
					}
				}
				if(response.isValid == true){
					var impactedRecords = {};
					if((itemType == 'inventoryitem' || itemType == 'assemblyitem')||
							(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'))
					{
						log.debug({title:'inventoryCountRecId :', details: inventoryCountRecId });
						
						impactedRecords = invtUtility.noCodeSolForCycleCount(inventoryCountRecId,arrOpenTaskId);
						if(utility.isValueValid(inventoryCountRecId))
						{
							impactedRecords['_ignoreUpdate'] = false;
						}
						else
						{
							impactedRecords['_ignoreUpdate'] = true;
						}
					}
					else
					{
						impactedRecords['_ignoreUpdate'] = true;
					}
					log.debug({title:'impactedRecords :', details: impactedRecords });
					response.impactedRecords = impactedRecords;
					response.defaultvalue = scannedStatusName;
				}
			}else{
				response.isValid = false;
			}
		}
		catch(e)
		{
			response.isValid = false;
			response.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		response.completedTaskCount = completedTaskCount;
		return response;
	}

	function addSimilarLotNamesAndStatus(lotName, cyclePlanInternalId, lineNum, itemInternalId, binInternalId, scannedQuantity, statusInternalId,
			inventoryStatusFeature){
		var serialSearch = search.load({
			type : 'customrecord_wmsse_serialentry',
			id : 'customsearch_wmsse_serialentry_details'
		});

		serialSearch.filters.push(search.createFilter({
			name : 'name',
			operator : search.Operator.IS,
			values : lotName
		}));

		serialSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_ser_status',
			operator : search.Operator.IS,
			values : false
		}));

		serialSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_ser_ordline',
			operator : search.Operator.EQUALTO,
			values : lineNum
		}));

		serialSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_ser_ordno',
			operator : search.Operator.ANYOF,
			values : cyclePlanInternalId
		}));

		if(inventoryStatusFeature)
			serialSearch.filters.push(search.createFilter({
				name : 'custrecord_serial_inventorystatus',
				operator : search.Operator.ANYOF,
				values : statusInternalId
			}));

		serialSearch.columns.push(search.createColumn({
			name : 'custrecord_wmsse_ser_qty'
		}));

		var serialSearchRes = utility.getSearchResultInJSON(serialSearch);
		if(serialSearchRes.length > 0){
			scannedQuantity = scannedQuantity + parseFloat(serialSearchRes[0]['custrecord_wmsse_ser_qty']);
		}else{
			var serialRecId = invtUtility.createSerialEntry(lotName, cyclePlanInternalId, lineNum, itemInternalId, binInternalId, scannedQuantity, 
					statusInternalId, inventoryStatusFeature);
			return serialRecId;
		}
		var objRecord = record.load({
			type : 'customrecord_wmsse_serialentry',
			id : serialSearchRes[0]['id']
		});

		objRecord.setValue({
			fieldId : 'custrecord_wmsse_ser_qty',
			value : scannedQuantity
		});

		return objRecord.save();
	}

	function getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber, locUseBinsFlag){
		var obj = {};
		var getCycPlanTasksResult = invtUtility.getCyclePlanTaskDetails(cyclePlanId, warehouseLocationId, null, null, true,null,null,locUseBinsFlag);
		obj['pendingTaskCount'] = getCycPlanTasksResult.length;
		if(getCycPlanTasksResult.length == 0){
			obj['completionStatus'] = 'planCompleted';
		}else{
			obj['completionStatus'] = 'planNotCompleted';
			for(var i in getCycPlanTasksResult){
				if(getCycPlanTasksResult[i]['binnumber'] == binnumber){
					obj['completionStatus'] = 'binNotCompleted';
					break;
				}
			}
		}
		return obj;
	}

	return {
		'post': doPost
	};

});
