/**
 * Copyright © 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_packingUtility','N/task','N/runtime'],

		function (utility,translator,packUtility,task,runtime) {


	function doPost(requestBody) {

		var whLocation = '';
		var quickShipOrdDetails = {};
		var orderName='';
		var orderType = '';
		var trackingNo= '';
		var contLP = '';
		var orderInternalId = ''
        var orderInternalIdArray = [];
		var shipMethodArr = '';
		var containerLPListResults =[];
		var objpalletDetailsArray=[];
		var requestParams ='';
		var debugString = '';
		var isValidCarton = '';
		var cartonString = '';
		var inputParamObj={};
		var pckgWeight='';
		var palletName='';
		var transactionNameString = '';
		var itemfulfilmentDataObj ={};
		var prepopulatedTrackingNo ='';
		try{ 
			requestParams =  requestBody.params;

		if (utility.isValueValid(requestParams)) {					
			whLocation = requestParams.warehouseLocationId;
			orderName = requestParams.transactionName;
			orderType = requestParams.transactionType;
			orderInternalId = requestParams.transactionInternalId; 
			trackingNo = requestParams.trackingNo;
			contLP = requestParams.cartonNum;
			pckgWeight = requestParams.pckgWeight;
			shipMethodArr = requestParams.shipMethod;
			isValidCarton = requestParams.isValidCarton;
			cartonString = requestParams.cartonString;
            palletName = requestParams.palletName;
            transactionNameString = requestParams.transactionNameString;

			debugString = debugString + 'requestParams:' + requestParams;
			if (utility.isValueValid(orderName) && utility.isValueValid(orderType) && utility.isValueValid(orderInternalId) && 
					utility.isValueValid(contLP) &&  utility.isValueValid(pckgWeight) &&
					utility.isValueValid(shipMethodArr) ) {
				prepopulatedTrackingNo = trackingNo;
				if(!utility.isValueValid(trackingNo))
				{
					trackingNo = contLP;
				}
				var checkTxnLockReslt = utility.checkTransactionLock(orderType,orderInternalId,'0');

				if(checkTxnLockReslt == null){

					inputParamObj={};
					inputParamObj.contLpNo =  contLP;
					inputParamObj.ordNo = orderInternalId ;
					inputParamObj.trackingNo  = trackingNo;
					inputParamObj.actualweight = pckgWeight;
					inputParamObj.quickshipFlag = 'true';
					var	shipManifestDetailsArr = packUtility.fnGetShipManifestRecordData(inputParamObj);
					var shipManifestDetailsArrLength = shipManifestDetailsArr.length;
					if(shipManifestDetailsArrLength > 0){
						for(var shipManifest = 0 ;shipManifest < shipManifestDetailsArrLength;shipManifest++){
							var outputObj = shipManifestDetailsArr[shipManifest];
							inputParamObj={};
							inputParamObj.contLpNo =  contLP;
							inputParamObj.ordNo = orderInternalId ;
							inputParamObj.trackingNo  = trackingNo;
							inputParamObj.actualweight = pckgWeight;
							inputParamObj.quickshipFlag = 'true';
							inputParamObj.shipManifestId  = outputObj.shipManifestId;
							inputParamObj.itemFulfillmentId = outputObj.itemFulfillmentId;
							inputParamObj.shipManifestData = outputObj.shipmanifestData;
							packUtility.updateItemFulfillmentDataObj(itemfulfilmentDataObj,inputParamObj);
						}
						quickShipOrdDetails.transactionNameString = transactionNameString?transactionNameString+","+orderName:orderName;
						var itemFulfilmentLineCount = packUtility.getItemFulfilmentLineCountData(Object.keys(itemfulfilmentDataObj));
						var asyncTriggerFlag = packUtility.checkforQuickshipAsyncTrigger(1,Object.keys(itemfulfilmentDataObj).length, itemFulfilmentLineCount);
                        if(asyncTriggerFlag === false){
							for(var shipManifest = 0 ;shipManifest < shipManifestDetailsArrLength;shipManifest++) {
								var outputObj = shipManifestDetailsArr[shipManifest];
								inputParamObj = {};
								inputParamObj.contLpNo = contLP;
								inputParamObj.ordNo = orderInternalId;
								inputParamObj.trackingNo = trackingNo;
								inputParamObj.actualweight = pckgWeight;
								inputParamObj.quickshipFlag = 'true';
								inputParamObj.shipManifestId = outputObj.shipManifestId;
								inputParamObj.itemFulfillmentId = outputObj.itemFulfillmentId;
								inputParamObj.shipManifestData = outputObj.shipmanifestData;
								 outputObj = packUtility.fnUpdateShipManifestRecord(inputParamObj);
							}

						packUtility.updateItemfulfillmentforquickship(itemfulfilmentDataObj);

						var ordersCountForQuickship = packUtility.getOrdersCountForQuickship(orderType,whLocation,'',contLP);
							log.debug("ordersCountForQuickship",ordersCountForQuickship);
						quickShipOrdDetails.cartonOrdersCount = ordersCountForQuickship;
						quickShipOrdDetails.transactionName = orderName;
						if(quickShipOrdDetails.cartonOrdersCount > 0){
							var cartonDtlObj = packUtility.getQSCartonList('','',whLocation,contLP);
							quickShipOrdDetails.cartonNum = cartonDtlObj[0].contentsdescription;
							quickShipOrdDetails.pckgWeight = cartonDtlObj[0].weightinlbs;
							quickShipOrdDetails.transactionInternalId = cartonDtlObj[0].internalid;
							orderInternalId =  cartonDtlObj[0].internalid;							
							quickShipOrdDetails.transactionName = cartonDtlObj[0].tranid;
						}
						else{
							quickShipOrdDetails.containerLPExist="false";
							if (utility.isValueValid(palletName)) {
								objpalletDetailsArray = packUtility.getCartonForQuickship(orderType, whLocation, palletName);

                                log.debug({title: 'objpalletDetailsArray', details: objpalletDetailsArray});
								if(objpalletDetailsArray.length > 0){
                                    for (var orderId = 0; orderId < objpalletDetailsArray.length; orderId++) {
                                        var orderValue = objpalletDetailsArray[orderId]['internalid'];
                                        orderInternalIdArray.push(orderValue);
                                    }
									quickShipOrdDetails.containerLPExist="true";
									trackingNo = "";
								}
							}
							else{
								if(isValidCarton != true){ 
									containerLPListResults = packUtility.getQSCartonList(orderInternalId,shipMethodArr,whLocation);
									log.debug('containerLPListResults',containerLPListResults.length );
									if(containerLPListResults.length > 0){
										quickShipOrdDetails.containerLPExist="true";
										trackingNo = "";
									}
								}
							}
							if(quickShipOrdDetails.containerLPExist=="false"){
								log.debug('orderName',orderName);
								if (utility.isValueValid(transactionNameString)){
								transactionNameString = transactionNameString+","+quickShipOrdDetails.transactionName;
								}
								else{
									transactionNameString = quickShipOrdDetails.transactionName;
								}
								log.debug('orderName',transactionNameString);
									var transactionNameArr = transactionNameString.split(',');
									var transcationArr =[];
									var transactionNameArrLength = transactionNameArr.length;
									if(transactionNameArrLength > 0){
										for(var l=0;l<transactionNameArrLength;l++){
											if(transcationArr.indexOf(transactionNameArr[l]) == -1){
												transcationArr.push(transactionNameArr[l]);
											}

										}
									}
									quickShipOrdDetails.transactionName = transcationArr.toString();
								
								if (utility.isValueValid(cartonString)){
									var cartonStringArr = cartonString.split(',');
									var cartonArr =[];
									var cartonStringLength = cartonStringArr.length;
									if(cartonStringLength > 0){
										for(var c=0;c<cartonStringLength;c++){
											if(cartonArr.indexOf(cartonStringArr[c]) == -1){
												cartonArr.push(cartonStringArr[c]);
											}

										}
									}
									quickShipOrdDetails.cartonString = cartonArr.toString();
								}
								
							}
						}
					}
					else
					{
						var objQuickShipData={};
				        objQuickShipData[contLP] ={};
						objQuickShipData[contLP].orderInternalId = orderInternalId;
						objQuickShipData[contLP].trackingNo = trackingNo;
						objQuickShipData[contLP].packweight = pckgWeight;
						objQuickShipData[contLP].shipManifestId = inputParamObj.shipManifestId;
						objQuickShipData[contLP].itemFulfillmentId = inputParamObj.itemFulfillmentId ;
						var schstatus =  task.create({taskType:task.TaskType.MAP_REDUCE});
							schstatus.scriptId = 'customscript_wms_mr_quickship';
							schstatus.deploymentId = null;
							schstatus.params = {
								"custscript_wms_quickshipdata"         : objQuickShipData,
								"custscript_wms_itemfulfilmentdata"    : itemfulfilmentDataObj,
								"custscript_wms_transactioninternalid" : orderInternalId
							};
						    schstatus.submit();
							utility.updateScheduleScriptStatus('GUI Quickship Mapreduce',runtime.getCurrentUser().id,'Submitted',orderInternalId);
                    }

						if (utility.isValueValid(cartonString)){
							cartonString = cartonString + ',' + contLP;
							var cartonStringArr = cartonString.split(',');
							var cartonArr =[];
							var cartonStringLength = cartonStringArr.length;
							if(cartonStringLength > 0){
								for(var c=0;c<cartonStringLength;c++){
									if(cartonArr.indexOf(cartonStringArr[c]) == -1){
										cartonArr.push(cartonStringArr[c]);
									}

								}
							}
							cartonString = cartonArr.toString();
							
						}else{
							cartonString =  contLP;
						}
						quickShipOrdDetails.asyncTriggerFlag = asyncTriggerFlag;
						quickShipOrdDetails.cartonString= cartonString;
						quickShipOrdDetails.shipManifestId= outputObj.shipManifestId;
						quickShipOrdDetails.isValid=true;
						if(orderInternalIdArray.length>0){
            			quickShipOrdDetails.transactionInternalId=orderInternalIdArray;
            			}
						else {
            			quickShipOrdDetails.transactionInternalId=orderInternalId;
            			}
						quickShipOrdDetails.shipMethod=shipMethodArr;
						quickShipOrdDetails.trackingNumber=prepopulatedTrackingNo;
                        quickShipOrdDetails.palletName=palletName;
						var impactedRecords = packUtility.noCodeSolForQuickship(outputObj.shipManifestId,outputObj.itemFulfillmentId);
						quickShipOrdDetails.impactedRecords = impactedRecords;
					}
					else
					{
						quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.ERROR_SHIPMANIFEST');
						quickShipOrdDetails.isValid=false;
					}

				}
				else{
					quickShipOrdDetails.errorMessage= checkTxnLockReslt;
					quickShipOrdDetails.isValid=false;
				}

			}
			else 
			{
				quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_CARTONVALID.INVALIDINPUT');
				quickShipOrdDetails.isValid=false;
			}
		}
		else
		{
			quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_CARTONVALID.INVALIDINPUT');
			quickShipOrdDetails.isValid=false;
		}

		log.debug('quickShipOrdDetails',quickShipOrdDetails );
		}
		catch(e)
		{
			quickShipOrdDetails.isValid = false;
			quickShipOrdDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error('debugString',debugString );
		}
		finally{
			if (utility.isValueValid(orderType) && utility.isValueValid(orderInternalId))
				utility.deleteTransactionLock(orderType, orderInternalId, '0');
		}

		return quickShipOrdDetails;
	}


	return {
		post: doPost

	};
});