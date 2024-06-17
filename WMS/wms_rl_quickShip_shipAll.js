/**
 * Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_packingUtility','N/runtime','N/task'],
		
		function (utility,translator,packUtility,runtime,task) {


	function doPost(requestBody) {

		var whLocation = '';
		var quickShipOrdDetails = {};
		var orderName='';
		var orderType = '';
		var palletName = '';
		var isValidPallet = '';
		var shipMethodArr = [];
		var orderInternalId = '';
		var cartonListResults = {};
		var requestParams = '';
		var debugString ='';
		var trackingNumbers ='';
		var cartonString = '';
		var inputParamObj = {};
		var outputObj = {};
		var shipManifestIdString = '';
		var itemFulfillmentIdString = '';
		var itemfulfilmentDataObj={};
		var objQuickShipData = {};
		try{ 	
			requestParams =  requestBody.params;
			if (utility.isValueValid(requestParams)) {					
				whLocation = requestParams.warehouseLocationId;
				orderName = requestParams.transactionName;
				orderType = requestParams.transactionType;
				orderInternalId = requestParams.transactionInternalId; 
				shipMethodArr = requestParams.shipMethod;
				cartonString = requestParams.cartonString;
				palletName = requestParams.palletName;
				isValidPallet=requestParams.isValidPallet;
				var tranType  			 = '';
				var objpalletDetailsArray=[];
                var cartonListResults = [];
				log.debug('requestParams check',requestParams);
				debugString = debugString + 'requestParams:' + requestParams ;
				if (utility.isValueValid(whLocation)  && utility.isValueValid(orderType) && 
						utility.isValueValid(orderInternalId) &&  utility.isValueValid(shipMethodArr) ) {

                    var orderIdArrlength=orderInternalId.length;

					var checkTxnLockReslt="";
					if(isValidPallet =='true' ) {
                    for (var order = 0; order < orderIdArrlength; order++) {
                        checkTxnLockReslt = utility.checkTransactionLock(orderType, orderInternalId[order], '0');
                    }
					}
					else {
						
						checkTxnLockReslt = utility.checkTransactionLock(orderType, orderInternalId, '0');
					}
					if(checkTxnLockReslt == null)
					{

						if(isValidPallet=='true') {

							if (utility.isValueValid(palletName)) {
								objpalletDetailsArray = packUtility.getCartonForQuickship(tranType, whLocation, palletName)
							}
							log.debug('with palletizatin',palletName);
							var cartonObj = {};
							var orderNameObj ={};
							var orderNameString ="";
							var objpalletDetailsArraylength=objpalletDetailsArray.length;
							for (var i = 0; i < objpalletDetailsArraylength; i++) {
								cartonObj[objpalletDetailsArray[i].cartons] = true;
								orderNameObj[objpalletDetailsArray[i].orderName]=true;
							}

							log.debug({title: 'objpalletDetailsArray', details: objpalletDetailsArray});
							var cartonListObjArr = packUtility.getQSCartonList(orderInternalId, shipMethodArr, whLocation);
							var cartonListObjArrlength=cartonListObjArr.length;


							for (var j = 0; j < cartonListObjArrlength; j++) {
								if (cartonObj[cartonListObjArr[j]['contentsdescription']]) {
									cartonListResults.push(cartonListObjArr[j]);
								}
							}
							if(Object.keys(orderNameObj).length>0) {
								quickShipOrdDetails.orderNameString = Object.keys(orderNameObj).toString();
							}
							if(Object.keys(cartonObj).length>0)	{
								cartonString=Object.keys(cartonObj).toString()
							}
						}
						else
						{

							 cartonListResults = packUtility.getQSCartonList(orderInternalId, shipMethodArr, whLocation);
						}
						log.debug('cartonListResults cartonListResults',cartonListResults);

						if(cartonListResults.length > 0){
							var cartonsCount  = cartonListResults.length;
							for(var carton=0; carton < cartonsCount;carton++) {
								inputParamObj = {};
								inputParamObj.contLpNo = cartonListResults[carton].contentsdescription;
								if (isValidPallet == 'true') {
									inputParamObj.ordNo = cartonListResults[carton].internalid;
								} else {
									inputParamObj.ordNo = orderInternalId;
								}
								inputParamObj.trackingNo = cartonListResults[carton].contentsdescription;
								inputParamObj.actualweight = cartonListResults[carton].weightinlbs;
								inputParamObj.quickshipFlag = 'true';
								var shipManifestDetailsArr = packUtility.fnGetShipManifestRecordData(inputParamObj);
								var shipManifestDetailsArrLength = shipManifestDetailsArr.length;
								if (shipManifestDetailsArrLength > 0) {
									for (var shipManifest = 0; shipManifest < shipManifestDetailsArrLength; shipManifest++) {
										inputParamObj = {};
										inputParamObj.contLpNo = cartonListResults[carton].contentsdescription;
										if (isValidPallet == 'true') {
											inputParamObj.ordNo = cartonListResults[carton].internalid;
										} else {
											inputParamObj.ordNo = orderInternalId;
										}
										inputParamObj.trackingNo = cartonListResults[carton].contentsdescription;
										inputParamObj.actualweight = cartonListResults[carton].weightinlbs;
										inputParamObj.quickshipFlag = 'true';
										var outputObj = shipManifestDetailsArr[shipManifest];
										cartonListResults[carton].shipManifestId = outputObj.shipManifestId;
										cartonListResults[carton].itemFulfillmentId = outputObj.itemFulfillmentId;
										inputParamObj.shipManifestData = outputObj.shipmanifestData;
										packUtility.updateItemFulfillmentDataObj(itemfulfilmentDataObj, inputParamObj);
										objQuickShipData[outputObj.shipManifestId] = {};
										objQuickShipData[outputObj.shipManifestId].orderInternalId = orderInternalId;
										objQuickShipData[outputObj.shipManifestId].trackingNo = cartonListResults[carton].contentsdescription;
										objQuickShipData[outputObj.shipManifestId].packweight = cartonListResults[carton].weightinlbs;
										objQuickShipData[outputObj.shipManifestId].shipManifestId = outputObj.shipManifestId;
										objQuickShipData[outputObj.shipManifestId].itemFulfillmentId = outputObj.itemFulfillmentId;

										if (utility.isValueValid(outputObj.shipManifestId)) {
											if (utility.isValueValid(trackingNumbers)) {
												trackingNumbers = trackingNumbers + "," + cartonListResults[carton].contentsdescription;
											} else {
												trackingNumbers = cartonListResults[carton].contentsdescription;
											}
											shipManifestIdString = outputObj.shipManifestId + ',' + shipManifestIdString;
											itemFulfillmentIdString = outputObj.itemFulfillmentId + ',' + itemFulfillmentIdString;
										}
										if (isValidPallet != 'true') {
											if (utility.isValueValid(cartonString)) {
												cartonString = cartonString + ',' + cartonListResults[carton].contentsdescription;
											} else {
												cartonString = cartonListResults[carton].contentsdescription;
											}
										}

									}
								}
							}



							if(utility.isValueValid(trackingNumbers)){

								var	itemFulfilmentLineCount = packUtility.getItemFulfilmentLineCountData(Object.keys(itemfulfilmentDataObj));

						        var asyncTriggerFlag = packUtility.checkforQuickshipAsyncTrigger(cartonsCount,
							              Object.keys(itemfulfilmentDataObj).length, itemFulfilmentLineCount);

						        if(asyncTriggerFlag === false){

						        for(var contLP in objQuickShipData){

								inputParamObj={};
								inputParamObj.contLpNo =  contLP;
								inputParamObj.ordNo = objQuickShipData[contLP].orderInternalId;
								inputParamObj.trackingNo  = objQuickShipData[contLP].trackingNo;
								inputParamObj.actualweight = objQuickShipData[contLP].packweight;
								inputParamObj.shipManifestId  = objQuickShipData[contLP].shipManifestId;
								inputParamObj.itemFulfillmentId = objQuickShipData[contLP].itemFulfillmentId;
								inputParamObj.quickshipFlag = 'true';
								outputObj = packUtility.fnUpdateShipManifestRecord(inputParamObj);
							   }
							    packUtility.updateItemfulfillmentforquickship(itemfulfilmentDataObj);
									if (isValidPallet != 'true') {
										quickShipOrdDetails.orderNameString = orderName;
									}

						        }else{
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

								var impactedRecords = packUtility.noCodeSolForQuickship(shipManifestIdString,itemFulfillmentIdString);
						        quickShipOrdDetails.impactedRecords = impactedRecords;
								quickShipOrdDetails.cartonString= cartonString;
								quickShipOrdDetails.shipManifestId= outputObj.shipManifestId;
								quickShipOrdDetails.trackingNumber= trackingNumbers;
								quickShipOrdDetails.isValid=true;
								quickShipOrdDetails.asyncTriggerFlag = asyncTriggerFlag;
							}
							else
							{
								quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.ERROR_SHIPMANIFEST');
								quickShipOrdDetails.isValid=false;
							}
						}
						else
						{
							quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_CARTONVALID.NOMATCH');
							quickShipOrdDetails.isValid=false;
						}
						
					}
					else
					{
						quickShipOrdDetails.errorMessage= checkTxnLockReslt;
						quickShipOrdDetails.isValid=false;
					}
				}
				else 
				{
					quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.INVALID_ORDER');
					quickShipOrdDetails.isValid=false;
				}
			}
			else
			{
				quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.INVALID_ORDER');
				quickShipOrdDetails.isValid=false;
			}

			log.debug('quickShipOrdDetails',quickShipOrdDetails);
		}
		catch(e)
		{
			quickShipOrdDetails.isValid = false;
			quickShipOrdDetails.errorMessage = e.message;
			log.error('debugString',debugString);
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
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
