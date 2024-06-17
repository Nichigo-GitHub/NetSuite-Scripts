/**
 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/record', 'N/format','./wms_inventory_utility'],

		function(search,utility,Big,translator,record, format,invtUtility) {

	/**
	 * This function is to validate the serial and posting inventory count
	 *
	 */
	function doPost(requestBody) {

		var cycSerialDetails = {};
		var requestParams = '';
		var invCountPostingObj ={};
		var serialArraytoDelete ='';
		var arrOpenTaskId = [];
		var inventoryCountRecId='';
		var impactedRecords = {};
		var invCountPostingOutputObj = {};
		try
		{
			log.debug('requestBody',requestBody);
			if(utility.isValueValid(requestBody))
			{
				requestParams = requestBody.params;
				var serialNumber = requestParams.serialNumber;
				var invStatusInternalId = requestParams.invStatusInternalId;
				var cyclecountPlan = requestParams.cyclecountPlan;
				var lineNum = requestParams.lineNum;
				var cyccPlanInternalId = requestParams.cyccPlanInternalId;
				var binInternalId = requestParams.binInternalId;
				var itemInternalId = requestParams.itemInternalId;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				var unitType = requestParams.unitType;
				var itemType = requestParams.itemType;
				var actualBeginTime = requestParams.actualBeginTime;
				var conversionRate = requestParams.conversionRate;
				var scannedQuantity = requestParams.scannedQuantity;
				var scannedStatusName = requestParams.scannedStatusName;
				var totalTaskCount = requestParams.totalTaskCount;
				var completedTaskCount = requestParams.completedTaskCount;
				var binnumber = requestParams.binnumber;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var noBinsActions = requestParams.noBinsActions;
				var wmsOpentaskInternalid = requestParams.wmsopentaskinternalid;
				var openTaskLinkQty = requestParams.existingotqtybeforetimelinkclick;
				var openTaskLinkInvStatus = requestParams.existingotinvstatusbeforetimelinkclick;
				var openTaskLinkConvRate = requestParams.openTaskLinkConvRate; 
				openTaskLinkConvRate = utility.isValueValid(openTaskLinkConvRate) ? openTaskLinkConvRate : 1;

				if(utility.isValueValid(serialNumber))
				{
					var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

					var arrPlandetails=getPlanDetails(cyclecountPlan,null,null,null);
					if(!utility.isValueValid(arrPlandetails))
					{
						cycSerialDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.PLAN_DELETED');
						cycSerialDetails['isValid'] = false;
					}
					else
					{
						impactedRecords['_ignoreUpdate'] = true;
						var serialSearch = search.load({
							id: 'customsearch_wmsse_serialentry_details'
						});
						var serailFilters = serialSearch.filters;

						serailFilters.push(search.createFilter({name:'custrecord_wmsse_ser_no',
							operator: search.Operator.IS,
							values:serialNumber}));
						serailFilters.push(search.createFilter({name:'custrecord_wmsse_ser_ordline',
							operator: search.Operator.EQUALTO,
							values:lineNum}));
						serailFilters.push(search.createFilter({name:'custrecord_wmsse_ser_ordno',
							operator: search.Operator.ANYOF,
							values:cyccPlanInternalId }));
						serailFilters.push(search.createFilter({name:'custrecord_wmsse_ser_status',
							operator: search.Operator.IS,
							values:'F' }));
						if(utility.isValueValid(binInternalId)){
							serailFilters.push(search.createFilter({name:'custrecord_wmsse_ser_bin',
								operator: search.Operator.ANYOF,
								values:binInternalId}));
						}

						serialSearch.filters = serailFilters;
						var SrchRecordTmpSerial1 =utility.getSearchResultInJSON(serialSearch);

						if(SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 !='')
						{
							cycSerialDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.SERIAL_ALREADY_SCANNED');
							cycSerialDetails['isValid'] = false;
						}
						else
						{
							var isSerialExistsInInventory = '';
							if(locUseBinsFlag == false)
							{ 
								isSerialExistsInInventory = isInventoryNumberExistsCYCCNoBins(itemInternalId,serialNumber,warehouseLocationId,inventoryStatusFeature,invStatusInternalId);
							}
							else
							{
								if(inventoryStatusFeature == true)
								{
									isSerialExistsInInventory = invtUtility.isInventoryNumberExistsCYCCbystatus(itemInternalId,serialNumber,warehouseLocationId,binInternalId,invStatusInternalId);
								}
								else
								{
									isSerialExistsInInventory = invtUtility.isInventoryNumberExistsCYCC(itemInternalId,serialNumber,warehouseLocationId,binInternalId);
								}
							}

							if(isSerialExistsInInventory)
							{ if(locUseBinsFlag){
								cycSerialDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.SERIAL_EXISTING_IN_BIN');
							}else{
								cycSerialDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.SERIAL_EXISTING_IN_LOCATION');
							}
							cycSerialDetails['isValid'] = false;
							}
							else
							{
								cycSerialDetails["serialNumber"] = serialNumber;
								var customrecord = record.create({
									type: 'customrecord_wmsse_serialentry'
								});

								customrecord.setValue({fieldId: 'name', value: serialNumber});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_ordno', value: cyccPlanInternalId});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_ordline', value: lineNum});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_item', value: itemInternalId});
								if(utility.isValueValid(binInternalId)){
									customrecord.setValue({fieldId: 'custrecord_wmsse_ser_bin', value: binInternalId});
								}
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_qty', value: 1});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_no', value: serialNumber});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_status', value: false});
								if(inventoryStatusFeature == true)
									customrecord.setValue({fieldId: 'custrecord_serial_inventorystatus', value: invStatusInternalId});

								customrecord.save({
									enableSourcing: false,
									ignoreMandatoryFields: true
								});

								if ((parseInt(numberOfTimesSerialScanned) + 1) < Big(scannedQuantity).mul(conversionRate)) {

									cycSerialDetails['numberOfTimesSerialScanned'] = parseInt(numberOfTimesSerialScanned) + 1;
									cycSerialDetails['statusInternalId'] = invStatusInternalId;
									cycSerialDetails['scannedStatusName'] = scannedStatusName;
									cycSerialDetails['isSerialScan'] = 'true';
									cycSerialDetails['isValid'] = true;

								}
								else
								{
									try{
										cycSerialDetails['isSerialScan'] = 'false';
										if(noBinsActions == 'timeLinkClicked'){
											serialArraytoDelete = invtUtility.getSerialsFordelete(wmsOpentaskInternalid);
											serialArraytoDelete =serialArraytoDelete.split(',');
										}

										if(inventoryStatusFeature == true)
										{
											var serialArrayArr=new Array();
											var vSerialQtyArr = new Array();
											var vSerialStatustextArr = new Array();
											var vStatusIDArr = new Array();
											var serialDetailsArr = new Array();

											var serialSearch = search.load({
												id: 'customsearch_wmsse_serialdetails_search',
											});
											var filters = serialSearch.filters;
											filters.push(search.createFilter({
												name: 'custrecord_wmsse_ser_status',
												operator: search.Operator.IS,
												values: false
											}));
											filters.push(search.createFilter({
												name: 'custrecord_wmsse_ser_ordline',
												operator: search.Operator.EQUALTO,
												values: lineNum
											}));
											filters.push(search.createFilter({
												name: 'custrecord_wmsse_ser_ordno',
												operator: search.Operator.ANYOF,
												values: cyccPlanInternalId
											}));

											serialSearch.filters = filters;
											var SrchRecordTmpSerial1 =utility.getSearchResultInJSON(serialSearch);
											if(SrchRecordTmpSerial1!=null && SrchRecordTmpSerial1!='')
											{
												for(var zserialItr=0;zserialItr<SrchRecordTmpSerial1.length;zserialItr++)
												{
													var vSerialQty=SrchRecordTmpSerial1[zserialItr]['custrecord_wmsse_ser_qty'];
													var vSerialNum=SrchRecordTmpSerial1[zserialItr]['custrecord_wmsse_ser_no'];
													var vStatus=SrchRecordTmpSerial1[zserialItr]['custrecord_serial_inventorystatus'];
													var vStatusText=SrchRecordTmpSerial1[zserialItr]['custrecord_serial_inventorystatusText'];
													if(vStatusIDArr.indexOf(vStatus) == -1)
													{
														vStatusIDArr.push(vStatus);
														vSerialQtyArr.push(vSerialQty);
														serialArrayArr.push(vSerialNum);
														vSerialStatustextArr.push(vStatusText);
													}
													else
													{
														if(vStatusIDArr.length > 0 && vStatusIDArr.indexOf(vStatus) != -1)
														{
															var ind = vStatusIDArr.indexOf(vStatus);
															var tempQty = vSerialQtyArr[ind];
															var tempSerial = serialArrayArr[ind];
															var totalSerial = tempSerial +","+vSerialNum;
															var totalLotQty = Number(Big(tempQty).plus(vSerialQty));
															vSerialQtyArr[ind] = totalLotQty;
															serialArrayArr[ind] = totalSerial;
															vStatusIDArr[ind] = vStatus;
															vSerialStatustextArr[ind]=vStatusText;
														}
														else
														{
															vStatusIDArr.push(vStatus);
															vSerialQtyArr.push(vSerialQty);
															serialArrayArr.push(vSerialNum);
															vSerialStatustextArr.push(vStatusText);
														}
													}
													var row1=[vStatusIDArr,vSerialQtyArr,serialArrayArr,vSerialStatustextArr];
												}
												serialDetailsArr.push(row1);
												var serialStatusArr = "";
												var serialQtyArr = "";
												var serialArr = "";
												var serialsttextArr = "";
												var statusForOpenPicks = new Array();
												if(serialDetailsArr != null && serialDetailsArr!='' && serialDetailsArr.length > 0)
												{
													for(var z=0;z<serialDetailsArr.length;z++)
													{
														serialStatusArr = serialDetailsArr[z][0];
														serialQtyArr = serialDetailsArr[z][1];
														serialArr = serialDetailsArr[z][2];
														serialsttextArr = serialDetailsArr[z][3];
													}
													log.debug({title:'serialStatusArr1  in servalidate',details:serialStatusArr});
													if(serialStatusArr != null && serialStatusArr!='' && serialStatusArr.length > 0)
													{
														for(var statsItr=0;statsItr<serialStatusArr.length;statsItr++)
														{
															statusForOpenPicks.push(serialStatusArr[statsItr]);
															var vOpenBinQty=0;
															var openTaskId =invtUtility.updateCycleCountOpenTask(cyccPlanInternalId,
																	itemInternalId,lineNum,
																	Number(Big(serialQtyArr[statsItr]).toFixed(8)),binInternalId,itemType,
																	warehouseLocationId,'',cyccPlanInternalId,
																	cyclecountPlan,actualBeginTime,
																	unitType,conversionRate,
																	Number(Big(vOpenBinQty).toFixed(8)),'',serialStatusArr[statsItr]);
															arrOpenTaskId.push(openTaskId);
														}
													}

													var res = Number(Big(scannedQuantity).toFixed(8));
													invCountPostingObj ={};
													invCountPostingObj.planInternalId = cyccPlanInternalId;
													invCountPostingObj.planLineNo = lineNum;
													invCountPostingObj.enterQty = Number(Big(scannedQuantity).toFixed(8));
													invCountPostingObj.itemType = itemType;
													invCountPostingObj.itemId = itemInternalId;
													invCountPostingObj.whLocation = warehouseLocationId;
													invCountPostingObj.serialStatusArr = serialStatusArr;
													if(locUseBinsFlag == false){
														invCountPostingObj.action = noBinsActions;
														if(noBinsActions == 'timeLinkClicked' ){
															invCountPostingObj.oldQtytimelink = Number(Big(openTaskLinkQty).div(openTaskLinkConvRate)); 
															invCountPostingObj.oldInvStatustimelink =openTaskLinkInvStatus;
															invCountPostingObj.serialArraytoDelete = serialArraytoDelete;
														}
														invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
													}else{
														invCountPostingOutputObj=invtUtility.inventoryCountPosting(invCountPostingObj);
													}
													inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;

													if(inventoryCountRecId=='INVALID_KEY_OR_REF')
													{ 
														cycSerialDetails['errorMessage'] = invCountPostingOutputObj.errorMessage;
														cycSerialDetails['isValid'] = false;
														invtUtility.updateWMSOpenTask(arrOpenTaskId);
														return cycSerialDetails;
													}else{
													    invtUtility.updateWMSOpenTask(arrOpenTaskId);
														cycSerialDetails['statusInternalId'] = invStatusInternalId;
														cycSerialDetails['scannedStatusName'] = scannedStatusName;
														cycSerialDetails['isValid'] = true;
													}
													utility.deleteTransactionLock('inventorycount',cyccPlanInternalId, lineNum);
												}

												var obj = getCyclePlanCompletionsStatus(cyclecountPlan, warehouseLocationId, binnumber,locUseBinsFlag);
												cycSerialDetails['completionStatus'] = obj['completionStatus'];
												completedTaskCount = parseFloat(totalTaskCount) - obj['pendingTaskCount'];

												cycSerialDetails['statusInternalId'] = invStatusInternalId;
												cycSerialDetails['scannedStatusName'] = scannedStatusName;
												cycSerialDetails['isValid'] = true;
												cycSerialDetails['openTaskIdArray'] = arrOpenTaskId;
											}
										}
										else
										{
											var vOpenBinQty = 0;
											var openTaskId=invtUtility.updateCycleCountOpenTask(cyccPlanInternalId,
													itemInternalId,lineNum,
													Number(Big(scannedQuantity).toFixed(8)),binInternalId,
													itemType,warehouseLocationId,'',cyccPlanInternalId,
													cyclecountPlan,actualBeginTime,unitType,
													conversionRate,Number(Big(vOpenBinQty).toFixed(8)),'');
											log.debug({title:'openTaskId',details:openTaskId});
											arrOpenTaskId.push(openTaskId);
											invCountPostingObj ={};
											invCountPostingObj.planInternalId = cyccPlanInternalId;
											invCountPostingObj.planLineNo = lineNum;
											invCountPostingObj.enterQty = Number((Big(scannedQuantity)).toFixed(8));
											invCountPostingObj.itemType = itemType;
											invCountPostingObj.itemId = itemInternalId;
											invCountPostingObj.whLocation = warehouseLocationId;
											if(locUseBinsFlag == false){
												invCountPostingObj.action = noBinsActions;
												if(noBinsActions == 'timeLinkClicked'){
													invCountPostingObj.oldQtytimelink =  Number(Big(openTaskLinkQty).div(openTaskLinkConvRate));
													invCountPostingObj.oldInvStatustimelink =openTaskLinkInvStatus;
													invCountPostingObj.serialArraytoDelete = serialArraytoDelete;
												}
												invCountPostingOutputObj = invtUtility.inventoryCountPostingForNoBins(invCountPostingObj);
											}else{
												invCountPostingOutputObj=invtUtility.inventoryCountPosting(invCountPostingObj);
											}
											inventoryCountRecId = invCountPostingOutputObj.inventoryCountId;
											if(inventoryCountRecId=='INVALID_KEY_OR_REF')
											{ 
												cycSerialDetails['errorMessage'] = invCountPostingOutputObj.errorMessage;
												cycSerialDetails['isValid'] = false;
												invtUtility.updateWMSOpenTask(arrOpenTaskId);
												return cycSerialDetails;
											}else{
												invtUtility.updateWMSOpenTask(arrOpenTaskId);
												cycSerialDetails['statusInternalId'] = invStatusInternalId;
												cycSerialDetails['scannedStatusName'] = scannedStatusName;
												cycSerialDetails['isValid'] = true;
												cycSerialDetails['openTaskIdArray'] = arrOpenTaskId;
											}
											utility.deleteTransactionLock('inventorycount',cyccPlanInternalId, lineNum);
											var obj = getCyclePlanCompletionsStatus(cyclecountPlan, warehouseLocationId, binnumber,locUseBinsFlag);
											cycSerialDetails['completionStatus'] = obj['completionStatus'];
											completedTaskCount = parseFloat(totalTaskCount) - obj['pendingTaskCount'];
										}
										if(cycSerialDetails.isValid == true){
											impactedRecords = invtUtility.noCodeSolForCycleCount(inventoryCountRecId,arrOpenTaskId);
											impactedRecords['_ignoreUpdate'] = false;
											log.debug({title:'impactedRecords :', details: impactedRecords });
										}
										cycSerialDetails['completedQtyUOM'] = scannedQuantity;
									}				
									catch(e)
									{
										cycSerialDetails['numberOfTimesSerialScanned'] = numberOfTimesSerialScanned - 1;
										cycSerialDetails['errorMessage'] =e;
										cycSerialDetails['isValid'] = false;
									}
								}
							}
						}
						cycSerialDetails.impactedRecords = impactedRecords;
					}
				}
				else
				{
					cycSerialDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.VALID_SERIAL');
					cycSerialDetails['isValid'] = false;
				}
			}
			else{
				cycSerialDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_SERIALVALIDATE.VALID_SERIAL');
				cycSerialDetails['isValid'] = false;
			}

		}
		catch(e)
		{
			cycSerialDetails['errorMessage'] = e;
			cycSerialDetails['isValid'] = false;
		}
		cycSerialDetails['completedTaskCount'] = completedTaskCount;
		return cycSerialDetails;
	}

	
	/**
	 * Checking for same status for serial in entered location 
	 * Checking for serial other than entered location
	 **/

	function isInventoryNumberExistsCYCCNoBins(item,serial,location,inventoryStatusFeature,invStatusInternalId)
	{
		var boolfound = false;
		var objBinDetails = [];
		if(inventoryStatusFeature){
			var invBalanceSearch = search.load({id:'customsearch_wms_locationlevl_inventory',type:search.Type.INVENTORY_BALANCE});
			var filters = invBalanceSearch.filters;

			filters.push(search.createFilter({
				name:'item',
				operator:search.Operator.ANYOF, 
				values:item
			}));
			filters.push(search.createFilter({
				name:'location',					
				operator:search.Operator.ANYOF, 
				values:location
			}));

			filters.push(search.createFilter({
				name:'inventorynumber',
				join:'inventorynumber',
				operator:search.Operator.IS, 
				values:serial
			}));

			filters.push(search.createFilter({
				name:'onhand',
				operator:search.Operator.GREATERTHAN, 
				values:0}));

			invBalanceSearch.filters = filters;
			objBinDetails = utility.getSearchResultInJSON(invBalanceSearch);
			log.debug('objBinDetails status',objBinDetails);
			if(objBinDetails.length > 0)
			{
				for(var i =0; i<objBinDetails.length; i++)
				{
					var status = objBinDetails[i]['status'];	
					if(status != invStatusInternalId )
					{
						boolfound = true;
						return boolfound;
					}
				}
			}
		}
		var serialInvSearch = search.load({id:'customsearch_wms_locationlevl_inventory',type:search.Type.INVENTORY_BALANCE});
		var filters = serialInvSearch.filters;
		objBinDetails = [];
		filters.push(search.createFilter({
			name:'item',
			operator:search.Operator.ANYOF, 
			values:item}));
		filters.push(search.createFilter({
			name:'location',					
			operator:search.Operator.NONEOF, 
			values:location}));

		filters.push(search.createFilter({
			name:'inventorynumber',
			join:'inventorynumber',
			operator:search.Operator.IS, 
			values:serial
		}));

		filters.push(search.createFilter({
			name:'onhand',
			operator:search.Operator.GREATERTHAN, 
			values:0}));

		serialInvSearch.filters = filters;
		objBinDetails = utility.getSearchResultInJSON(serialInvSearch);
		log.debug('objBinDetails location',objBinDetails);
		if(objBinDetails.length > 0)
		{
			boolfound = true;
		}
		return boolfound ;
	}

	
	/**
	 * This function is to cycle count plan details
	 * 
	 */

	function getPlanDetails(planid,itemId,binLocationId,warehouseLocationId)
	{

		var searchrecord = search.load({
			id: 'customsearch_wms_cycc_invcnt_details',
		});
		var filter = searchrecord.filters;


		filter.push(search.createFilter({
			name: 'tranid', 
			operator: search.Operator.ANYOF,
			values: planid
		}));

		if (utility.isValueValid(itemId)) {
			filter.push(search.createFilter({
				name: 'item', 
				operator: search.Operator.ANYOF,
				values: itemId
			}));
		}
		if (utility.isValueValid(binLocationId)){
			filter.push(search.createFilter({
				name: 'internalid',
				join :'binnumber',
				operator: search.Operator.ANYOF,
				values: binLocationId
			}));
		}
		if (utility.isValueValid(warehouseLocationId)){
			filter.push(search.createFilter({
				name: 'location', operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
		}
		searchrecord.filters = filter;
		var searchrecordResult =utility.getSearchResultInJSON(searchrecord);
		return searchrecordResult;
	}

	function getCyclePlanCompletionsStatus(cyclePlanId, warehouseLocationId, binnumber,locUseBinsFlag){
		var obj = {};
		var getCycPlanTasksResult = invtUtility.getCyclePlanTaskDetails(cyclePlanId, warehouseLocationId, null, null, true,null,null,locUseBinsFlag);
		log.debug('getCycPlanTasksResult',getCycPlanTasksResult);
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



