/**
 * Copyright � 2015,2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_workOrderUtility','./wms_translator','./big'],

		function(search,utility, woUtility, translator,bigJS) {

	function doPost(requestBody) {
		var response = {};
		var warehouseLocationId = '';
		var serialName = '';
		var fromBinInternalId = '';
		var numberOfTimesSerialScanned = '';
		var scannedQuantity = '';
		var scannedQuantityInBaseUnits = '';
		var itemInternalId = '';
		var fromStatusInternalId = '';
		var transactionInternalId = '';
		var itemType = '';
		var pickQty = '';
		var remainingQuantity = '';
		var line = '';
		var unitType ='';
		var transactionUomConversionRate = '';
		var transactionUomName = '';
		var invtStatusFeature='';
		var transactionName = '';
		var transactionLineNo = '';
		var actualBeginTime = '';
		var transactionType = '';
		var info_scannedQuantityList = '';
		var info_statusList = '';
		var statusName = '';
		var locUseBinsFlag ='';
    var impactedRecords = {};

		try{

			var requestParams = requestBody.params;
			log.debug({title:'Request Params :', details:requestParams});

			if(utility.isValueValid(requestParams)) 
			{
				warehouseLocationId = requestParams.warehouseLocationId;
				serialName = requestParams.serialName;
				fromBinInternalId = requestParams.fromBinInternalId;
				numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				scannedQuantity = requestParams.scannedQuantity;
				scannedQuantityInBaseUnits = requestParams.scannedQuantityInBaseUnits;
				itemInternalId = requestParams.itemInternalId;
				fromStatusInternalId = requestParams.fromStatusInternalId;
				transactionInternalId = requestParams.transactionInternalId;
				itemType = requestParams.itemType;
				transactionName = requestParams.transactionName;
				pickQty = requestParams.pickQty;
				remainingQuantity = requestParams.remainingQuantity;
				line = requestParams.line;
				unitType = requestParams.unitType;
				transactionUomConversionRate = requestParams.transactionUomConversionRate;
				transactionUomName = requestParams.transactionUomName;
				transactionLineNo = requestParams.transactionLineNo;
				transactionType = requestParams.transactionType;
				actualBeginTime = requestParams.actualBeginTime;
				info_scannedQuantityList = requestParams.info_scannedQuantityList;
				info_statusList =	requestParams.info_statusList;
				statusName = requestParams.statusName;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;
				var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;
				if(utility.isValueValid(serialName))
				{
					workorderOverpickingFlag = workorderOverpickingFlag || false;
                   if((utility.isValueValid(inventoryDetailLotOrSerialText)) && (inventoryDetailLotOrSerialText != serialName)){
						response.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_INVENTDETAILS_VALIDSERIAL');
						response.isValid = false;
					}
					else
					{
					  impactedRecords['_ignoreUpdate'] = true;
					  invtStatusFeature = utility.isInvStatusFeatureEnabled();

					var _isScannedSerialExist = '';
					var invNumSearchRes = utility.inventoryNumberInternalId(serialName, warehouseLocationId, itemInternalId,'wo_picking');
					var scannedSerialInternalId = '';
					if(utility.isValueValid(invNumSearchRes)){
						scannedSerialInternalId = invNumSearchRes[0]['id'];
					}
						if(!utility.isValueValid(locUseBinsFlag)) {
							var columnsArr = [];
							columnsArr.push('usesbins');
							var locResults = utility.getLocationFieldsByLookup(warehouseLocationId, columnsArr);
							if (locResults) {
								locUseBinsFlag = locResults.usesbins;
							}
						}
					_isScannedSerialExist =  woUtility.getInventoryBalance(itemInternalId, fromBinInternalId, warehouseLocationId, serialName, fromStatusInternalId,itemType,locUseBinsFlag);

					log.debug({title:'Is Scanned Serial Exist ?  :', details:_isScannedSerialExist});

					if( (_isScannedSerialExist.length == 0) || !utility.isValueValid(scannedSerialInternalId)){
						response['isValid'] = false;
						response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
					}
					else
					{   
						if( invNumSearchRes[0]['inventorynumber'] != serialName)
						{
						response['isValid'] = false;
						response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
					}
					else
					{
						var objserialSearchRes = woUtility.getSerialEntry(serialName, itemInternalId, 9);

						var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, fromBinInternalId, warehouseLocationId, '', '',serialName);

						if(objserialSearchRes.length != 0 || openTaskPickBinDtls.length >0){
							response['isValid'] = false;
							response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED');
						}
						else
						{
								woUtility.createSerialEntries(transactionName, transactionInternalId, transactionLineNo, itemInternalId, serialName,9);
							response["transactionName"] = transactionName;
							response['remainingQuantity'] = remainingQuantity;

							if(parseInt(numberOfTimesSerialScanned) + 1 < scannedQuantityInBaseUnits){
								response['numberOfTimesSerialScanned'] = parseInt(numberOfTimesSerialScanned) + 1;
								response['info_scannedQuantityList'] = info_scannedQuantityList;
								response['info_statusList'] = info_statusList;
							}
							else
							{
								var opentaskId='';
								var openTaskObj ={};

								openTaskObj['warehouseLocationId']= warehouseLocationId;
								openTaskObj['transactionName']= transactionName;
								openTaskObj['itemInternalId']= itemInternalId;
								openTaskObj["transactionLineNo"]= transactionLineNo; 
								openTaskObj["transactionInternalId"]= transactionInternalId;
								openTaskObj["scannedQuantity"]= scannedQuantity;
								openTaskObj["toBinInternalId"]= fromBinInternalId;
								openTaskObj["binInternalId"]= fromBinInternalId;
								openTaskObj["itemType"]= itemType;
								openTaskObj["transactionType"]= transactionType;
								openTaskObj["taskType"]= 'PICK';
								openTaskObj["transactionUomName"]= transactionUomName;
								openTaskObj["conversionRate"]= transactionUomConversionRate;
								openTaskObj["actualBeginTime"]= actualBeginTime;
								openTaskObj["inventoryNumber"]= serialName;
								if(workorderOverpickingFlag) {
									openTaskObj["remainingQuantity"] = parseFloat(remainingQuantity);
								}
								if(invtStatusFeature)
								{
									openTaskObj['status']= fromStatusInternalId;
								}

								/*if(utility.isValueValid(transactionUomConversionRate))
								{
									scannedQuantity = Number(bigJS(scannedQuantity).div(transactionUomConversionRate));
									log.debug({title:'scannedQuantity',details:scannedQuantity});
									picktaskObj['enterqty']=scannedQuantity;
								}
								else
								{
									picktaskObj['enterqty']=scannedQuantity;
								}*/

								log.debug({title:'About to create Open Task :', details:openTaskObj});

								/*Creating Open Task*/
								opentaskId = woUtility.createOpenTaskForWorkOrder(openTaskObj);

								// No Code Solution Changes begin here
								impactedRecords = woUtility.noCodeSolForWO(opentaskId, transactionInternalId,locUseBinsFlag);
								log.debug({title:'impactedRecords :', details: impactedRecords });
								//No Code Solution ends here.
								
								
								
								
								response['pageNavigationStatus'] = 'pickTaskCompleteScreen';
								
								if(utility.isValueValid(remainingQuantity) && utility.isValueValid(scannedQuantity)){

										if(!utility.isValueValid(locUseBinsFlag))
										{
											locUseBinsFlag =utility.lookupOnLocationForUseBins(warehouseLocationId);
										}
										remainingQuantity = Number(bigJS(remainingQuantity).minus(scannedQuantity));
									
									if(remainingQuantity > 0){
										response['pageNavigationStatus'] = 'quantityScanScreen';
									}else{
										response['pageNavigationStatus'] = 'pickTaskCompleteScreen';
										//Next Pick Task Validation check
										response['showNextPickTaskButton'] = woUtility.showNextPickTaskButton(transactionName, warehouseLocationId, transactionInternalId,workorderOverpickingFlag);
											if(locUseBinsFlag != false)
											{
										var wostageflagDtl = woUtility.getWOStageflag(transactionInternalId);

                                          if(utility.isValueValid(wostageflagDtl) && wostageflagDtl.length>0){
                                              response['gotostage'] = 'Y';
                                          }else{
                                              response['gotostage'] = 'N';
												}
                                          }
									}
								}

								response['remainingQuantity'] = remainingQuantity;
								response['numberOfTimesSerialScanned'] = parseInt(numberOfTimesSerialScanned) + 1;

								if(utility.isValueValid(info_scannedQuantityList)){
									response['info_scannedQuantityList'] = info_scannedQuantityList.toString().concat(',', scannedQuantity, ' ', transactionUomName);
								}else{
									response['info_scannedQuantityList'] = scannedQuantity.toString().concat(' ', transactionUomName);
								}

								if(utility.isValueValid(info_statusList)){
									response['info_statusList'] = info_statusList.concat(',', statusName);									
								}else{
									response['info_statusList'] = statusName;
								}
							}
							response['impactedRecords'] = impactedRecords;
							response['isValid'] = true;
						}
					}
					}
				}
			 }
				else{
					response['isValid'] = false;
					response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
				}
			}else{
				response['isValid'] = false;
			}
		}catch(e){
			response['isValid'] = false;
			response['errorMessage'] = e.message;
		}
		return response;
	}
	return {
		'post': doPost
	};
});