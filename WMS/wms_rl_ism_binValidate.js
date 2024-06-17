/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility','./big','./wms_translator', './wms_inboundUtility', 'N/format','N/record','N/runtime','N/task'],
		function (search, utility,Big,translator, inboundUtility, format,record,runtime,task) {
	/**
	 *This function is to validate the entered / scanned bin against bin master and post ism
	 */
	function doPost(requestBody) {


		var binValidateDetails = {};
		var impactedRecords = {};
		var openTaskIdarray=[];
		try{
			if(utility.isValueValid(requestBody)){

				var requestParams = requestBody.params;
				var receiveAllBtn = requestParams.receiveAll;
				var shipmentId = requestParams.shipmentId;
				var binInternalId = requestParams.binInternalId;
				var binName = requestParams.binName;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var shipmentLineNo = requestParams.shipmentLineNo;
				var quantity = requestParams.quantity;
				var preferBin = requestParams.preferBin;
				var preferBinInternalId = requestParams.preferBinInternalId;
				var blnMixItem = requestParams.blnMixItem;
				var blnMixLot = requestParams.blnMixLot;
				var itemInternalId = requestParams.itemInternalId;
				var itemType = requestParams.itemType;	
				var lotNo = requestParams.lotNo;
				var lotString= requestParams.lotString;
				var fromStatusId = requestParams.fromStatusId;
				var receiveAllStatusId = requestParams.statusId;
				var itemListCount = requestParams.itemListCount;
				var isMapReduceScriptInvoked = 'F';
				var selectBin= requestParams.selectBin;
				var shipmentNumber = requestParams.shipmentNumber;
				var poInternald = requestParams.poInternalId;
				var lotJSONobj = requestParams.lotJSONobj;
				var serialEntryRecordArray = requestParams.serialEntryRecordArray;
				var isTallyScanRequired = requestParams.isTallyScanRequired;
				var tallyLoopObj = requestParams.tallyLoopObj;
				var selectedConversionRateForTallyScan = requestParams.selectedConversionRateForTallyScan;
				var randomTallyScanRule = requestParams.randomTallyScan;
				var binLocType = '';
				var binIsCart = '';
				var inputParamObj={};
				var transactionType='ISM';

                if(transactionType!=null && transactionType!='')
                {
                    log.debug('transactionType transactionType',transactionType);
                    if(transactionType =='ISM')
                    {
                        tranType= "Inbound Shipment";
                    }

                    log.debug('tranType11',tranType);
                }



                if((!utility.isValueValid(binName)) && (utility.isValueValid(preferBin))){
					binName = preferBin;
				}

				log.debug({title: 'requestParams',details:requestParams});


				if(utility.isValueValid(shipmentId) && utility.isValueValid(warehouseLocationId)
						&& (utility.isValueValid(binInternalId) || utility.isValueValid(binName))
						&& (utility.isValueValid(receiveAllBtn) ||
								(utility.isValueValid(shipmentLineNo) && utility.isValueValid(quantity))))	{

					var stageRecvngSystemRule= 'N';
					//stageRecvngSystemRule=utility.getSystemRuleValue('Stage received items before putting away?',warehouseLocationId);
                    stageRecvngSystemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?',warehouseLocationId,tranType);
					if(stageRecvngSystemRule == 'N' && binName == preferBin){
						binInternalId = preferBinInternalId;
					}
					log.debug({title: 'binName',details:binName});
					log.debug({title: 'binInternalId',details:binInternalId});
					if(utility.isValueValid(binName) && ! utility.isValueValid(binInternalId)){

						var stageLocArray = getStageLocArr(stageRecvngSystemRule);		



						var binSearchResults =	validateEnteredBin(binName,warehouseLocationId,stageRecvngSystemRule,stageLocArray);
						log.debug({title: 'binSearchResults',details:binSearchResults});
						if(binSearchResults != null && binSearchResults != undefined && 
								binSearchResults != '' && binSearchResults.length > 0){
							
							binIsCart = binSearchResults[0].getValue({name:'custrecord_wms_iscart'});
							binLocType  = binSearchResults[0].getValue({name:'custrecord_wmsse_bin_loc_type'});
							
							if(stageRecvngSystemRule == 'Y')
							{
								var binStageDirection = binSearchResults[0].getValue({name:'custrecord_wmsse_bin_stg_direction'});
								if(stageLocArray.indexOf(binLocType) == -1){

									binValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.NOT_STAGEBIN');
									binValidateDetails.isValid = false;
								}
								else if(binStageDirection != 1){

									binValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_BIN_DIRECTION');
									binValidateDetails.isValid = false;
								}
								else{

									binInternalId=binSearchResults[0].id;
									binLocType = 'Stage';	
								}
							}
							else{

								binInternalId=binSearchResults[0].id;
							}
						}
						else{
							binValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_BIN');
							binValidateDetails.isValid = false;
						}
					}
					if(utility.isValueValid(binInternalId))	{

						var isErrorInMixRules = '';
						if(stageRecvngSystemRule == 'N')
						{
							isErrorInMixRules  = mixItemRulesCheck(blnMixItem,blnMixLot,itemType,lotNo,binInternalId,warehouseLocationId,
									itemInternalId,receiveAllBtn);
						}
						
						var binLookUp = search.lookupFields({
							type: search.Type.BIN,
							id: binInternalId,
							columns: ['custrecord_wms_iscart','custrecord_wmsse_bin_loc_type']
						});
						if(utility.isValueValid(binLookUp) && utility.isValueValid(binLookUp.custrecord_wms_iscart) && binLookUp.custrecord_wms_iscart==true)
						{	
							binLocType = 'Stage';
							binIsCart = binLookUp.custrecord_wms_iscart;
						}						
						
						log.debug({title: 'isErrorInMixRules',details:isErrorInMixRules});
						if(isErrorInMixRules == ''){

							if ((itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
									itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) ||(randomTallyScanRule == "T")) {

								if (randomTallyScanRule == "T"){
									log.debug({title: 'itto Randomtallyscan',details:shipmentId});

									this.createLotInfoInSerialEntry(shipmentNumber,shipmentId,warehouseLocationId,tallyLoopObj,binInternalId);
									this.updateBinInSerialEntryForRandomTallyscan(shipmentId,binInternalId);
								}
								else
								{
									if (lotJSONobj) {
									lotJSONobj = JSON.parse(lotJSONobj);
									var createLotISMObj = {};
									createLotISMObj.shipmentNumber 			= shipmentNumber;
									createLotISMObj.warehouseLocationId 	= warehouseLocationId;
									createLotISMObj.itemInternalId 			= itemInternalId;
									createLotISMObj.purchaseorderInternalId = poInternald;
									createLotISMObj.shipmentInternalNumber 	= shipmentId;
									createLotISMObj.shipmentLineNumber 		= shipmentLineNo;
									var lotNamesArray =[];
									var lotExpiryDatesObject = {};
									for (var lotObjIndex in lotJSONobj) {
										createLotISMObj.scannedQuantity 	= lotJSONobj[lotObjIndex]['quantity'];
										createLotISMObj.LotName 			= lotJSONobj[lotObjIndex]['lotName'];
										createLotISMObj.inventoryStatusId 	= lotJSONobj[lotObjIndex]['statusId'];
										
										if(isTallyScanRequired == true && utility.isValueValid(requestParams.conversionRate)) {
											var tallyScanQty = lotJSONobj[lotObjIndex]['quantity'];
											log.debug('tallyScanQty',tallyScanQty);
											tallyScanQty = Number(Big(tallyScanQty).div(requestParams.conversionRate));
											createLotISMObj.scannedQuantity 	= tallyScanQty;
										}

										var lotInternalId='';
										var lotExpiryDate = null;
										if(utility.isValueValid(lotJSONobj[lotObjIndex]['lotName']) && lotNamesArray.indexOf(lotJSONobj[lotObjIndex]['lotName']) == -1)
										{
											lotInternalId = utility.getLotInternalId(lotJSONobj[lotObjIndex]['lotName'],itemInternalId);
											lotNamesArray.push(lotJSONobj[lotObjIndex]['lotName']);
											if(utility.isValueValid(lotInternalId))
											{
												
												var lotLookUp = search.lookupFields({
													type: search.Type.INVENTORY_NUMBER,
													id: lotInternalId,
													columns: ['inventorynumber', 'expirationdate']
												});
												log.debug({title: 'lotLookUp',details:lotLookUp});
												if(utility.isValueValid(lotLookUp) && utility.isValueValid(lotLookUp.expirationdate))
												{
													lotExpiryDate = lotLookUp.expirationdate;
												}
												else
												{
													lotExpiryDate = '';
												}
												lotExpiryDatesObject[lotJSONobj[lotObjIndex]['lotName']]  = lotExpiryDate;
												
											}
										}
										if(!utility.isValueValid(lotExpiryDate))
										{
											lotExpiryDate  = lotExpiryDatesObject[lotJSONobj[lotObjIndex]['lotName']];
											if(!utility.isValueValid(lotExpiryDate) && !utility.isValueValid(lotInternalId))
											{
												lotExpiryDate = lotJSONobj[lotObjIndex]['lotExpiryDate']; //new lot
											}
										}
										if(utility.isValueValid(lotExpiryDate))
										{
											var lotDate = format.parse({
												value: lotExpiryDate,
												type: format.Type.DATE
											});
											createLotISMObj.lotExpiryDate = lotDate; //lotJSONobj[lotObjIndex]['lotExpiryDate'];
										}else{
											createLotISMObj.lotExpiryDate='';
										}

										lotJSONobj[lotObjIndex]['serialEntryRecordId'] = inboundUtility.createLotISMInfoInSerialEntry(createLotISMObj);
									}
									log.debug({title: 'lotExpiryDatesObject',details:lotExpiryDatesObject});
								}
								}

							}
							var manuallyPostIRSystemRuleValue = 'N';
							manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
							log.debug({title: 'manuallyPostIRSystemRuleValue',details:manuallyPostIRSystemRuleValue});
							binValidateDetails.manuallyPostIRSystemRuleValue = manuallyPostIRSystemRuleValue;
							var shipmentReceiptId = '';
							if(manuallyPostIRSystemRuleValue == 'N' || receiveAllBtn == 'receiveAll'){

								if(receiveAllBtn == 'receiveAll')
								{
									log.debug({title: 'Map Reduce - shipmentLineNo :',details:shipmentLineNo});
									if(itemListCount > 40 && !utility.isValueValid(shipmentLineNo))
									{
										inboundUtility.callSchedulerToReceiveISM(shipmentId,warehouseLocationId,binInternalId,receiveAllStatusId);
										isMapReduceScriptInvoked = 'T';
									}
									else
									{
										shipmentReceiptId = inboundUtility.iSM_receiveAll(shipmentId,warehouseLocationId,binInternalId,shipmentLineNo,manuallyPostIRSystemRuleValue,receiveAllStatusId);
									}

								}
								else {
									if (randomTallyScanRule != 'T') {
										var totalTallyScanQty = 0;
										if (isTallyScanRequired == true) {
											for (var obj in tallyLoopObj) {
												var tallyObj = tallyLoopObj[obj];
												totalTallyScanQty = parseFloat(totalTallyScanQty) + parseFloat(tallyObj.quantity);
											}
											if (utility.isValueValid(selectedConversionRateForTallyScan) && totalTallyScanQty > 0) {
												totalTallyScanQty = Number(Big(totalTallyScanQty).mul(selectedConversionRateForTallyScan));
												if (utility.isValueValid(requestParams.conversionRate)) {
													totalTallyScanQty = Number(Big(totalTallyScanQty).div(requestParams.conversionRate));
												}
											}
											quantity = totalTallyScanQty;
										}
										shipmentReceiptId = inboundUtility.receiveISM(shipmentId, warehouseLocationId, binInternalId,
											shipmentLineNo, quantity, poInternald, itemType, fromStatusId, isTallyScanRequired, tallyLoopObj, selectedConversionRateForTallyScan, requestParams.conversionRate);
									}
								}
							}
							log.debug({title: 'shipmentReceiptId',details:shipmentReceiptId});
							log.debug({title: 'manuallyPostIRSystemRuleValue',details:manuallyPostIRSystemRuleValue});
							if((manuallyPostIRSystemRuleValue == 'Y' || (isTallyScanRequired == true && randomTallyScanRule == 'T') ||
									utility.isValueValid(shipmentReceiptId)) && isMapReduceScriptInvoked == 'F') {
								var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId, '', warehouseLocationId);
								log.debug({title: 'shipmentListDetails', details: shipmentListDetails});
								if (receiveAllBtn == 'receiveAll') {
									var inboundShipmentLineNo = shipmentLineNo;
									if (utility.isValueValid(inboundShipmentLineNo)) {
										inboundShipmentLineNo = parseInt(inboundShipmentLineNo);
									} else {
										inboundShipmentLineNo = 'receiveAllItems';
									}

									if (shipmentListDetails.length > 0) {

										shipmentLineNo = '';
										quantity = '';
										itemInternalId = '';
										itemType = '';
										poName = '';

										var unitType, poInternalId, uom, conversionRate, strBarCode, invStatus,
											expectedQty = '';
										var invStatusId = receiveAllStatusId;
										var lineNo = '';
										var columnlookupArray = [];
										columnlookupArray.push('recordtype');
										columnlookupArray.push('unitstype');
										var shipmentLineRec = '';
										var quantityReceived = '';
										var lineItemOpentaskRcvQty = '';
										var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId, '', warehouseLocationId);
										log.debug({title: 'openPutAwayDetails', details: openPutAwayDetails});
										for (var shipmentLine in shipmentListDetails) {
											quantityReceived = '';
											lineItemOpentaskRcvQty = '';
											shipmentLineRec = shipmentListDetails[shipmentLine];
											quantity = shipmentLineRec.quantityremaining;
											lineNo = shipmentLineRec.inboundshipmentitemid;
											quantityReceived = shipmentLineRec.quantityreceived;
											if (JSON.stringify(openPutAwayDetails) != '{}') {
												lineItemOpentaskRcvQty = openPutAwayDetails[lineNo];
											}
											if (parseFloat(quantity) > 0 &&
												(inboundShipmentLineNo == lineNo || (inboundShipmentLineNo == 'receiveAllItems' && !utility.isValueValid(quantityReceived) && !utility.isValueValid(lineItemOpentaskRcvQty)))) {
												shipmentLineNo = shipmentLineRec.inboundshipmentitemid;
												itemInternalId = shipmentLineRec.item;
												uom = shipmentLineRec.unitText;
												poInternalId = shipmentLineRec.purchaseorder;
												poName = shipmentLineRec.purchaseorderText;
												expectedQty = shipmentLineRec.quantityexpected;
												var itemLookUp = utility.getItemFieldsByLookup(itemInternalId, columnlookupArray);
												if (itemLookUp.recordtype != undefined) {
													itemType = itemLookUp.recordtype;
												}
												if (itemLookUp.unitstype != undefined &&
													itemLookUp.unitstype[0] != undefined) {
													unitType = itemLookUp.unitstype[0].value;
												}
												var conversionRate = '';
												if (uom != null && uom != undefined) {

													conversionRate = utility.getConversionRate(uom, unitType);
													if (conversionRate != undefined &&
														conversionRate != null && conversionRate != '') {
														quantity = Number(Big(quantity).div(conversionRate));
													}
												}

												var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams, manuallyPostIRSystemRuleValue, binName, binInternalId, shipmentLineNo,
													quantity, warehouseLocationId, shipmentReceiptId,
													itemInternalId, itemType, poInternalId, poName, uom, conversionRate, '', invStatusId, expectedQty, shipmentId, lotString, '',
													binLocType, binIsCart);
												var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
												openTaskIdarray.push(openTaskId);
												inputParamObj = {};
												inputParamObj.poInternald = poInternalId;
												inputParamObj.shipmentId = shipmentId;
												inputParamObj.openTaskIdarray = openTaskIdarray;
												inputParamObj.poName = poName;
												inputParamObj.warehouseLocationId = warehouseLocationId;
												inputParamObj.shipmentReceiptId = shipmentReceiptId;
												inputParamObj._ignoreUpdate = false;
												impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
												log.debug({title: 'impactedRecords :', details: impactedRecords});
												binValidateDetails.impactedRecords = impactedRecords;
												binValidateDetails.vCount = 0;

												if (inboundShipmentLineNo != 'receiveAllItems') {
													break;
												}
											}
										}
									}
								}
								else {
									if (isTallyScanRequired == true && randomTallyScanRule == 'T') {

										var openTaskDtls = inboundUtility.getOpenTaskShipmentDetails(shipmentId, warehouseLocationId,randomTallyScanRule);
										log.debug({title: 'openTaskDtls',details:openTaskDtls});
										var openTaskQtyDetails = [];
										if(manuallyPostIRSystemRuleValue == 'N') {
											 openTaskQtyDetails = inboundUtility.getQtyDetailsFromOpenTask(shipmentId, warehouseLocationId, '', randomTallyScanRule);
											log.debug({title: 'openTaskQtyDetails', details: openTaskQtyDetails});
											shipmentReceiptId = inboundUtility.postItemReceiptISM(shipmentId, warehouseLocationId, openTaskDtls, openTaskQtyDetails, binInternalId, randomTallyScanRule);
											log.debug({title: 'shipmentReceiptId@@@@@@', details: shipmentReceiptId});
										}
										if(shipmentReceiptId != '' || (manuallyPostIRSystemRuleValue == 'Y' || randomTallyScanRule == 'T' )){
											var openTaskIdarray =[];
                                          var i=10;
											if((runtime.getCurrentScript().getRemainingUsage() > scriptUsageRequiredToUpdateOpenTask(openTaskQtyDetails.length))
												&& openTaskQtyDetails.length <= 100){
												for (var openTaskItr = 0; openTaskItr < openTaskDtls.length ; openTaskItr++) {
													this.updateOpenTaskWithShipmentReceiptId(openTaskDtls[openTaskItr], shipmentId, binInternalId, manuallyPostIRSystemRuleValue);
													openTaskIdarray.push(parseInt(openTaskDtls[openTaskItr].internalid));
												}
											}else{
												log.debug("triggerMapreduce","manuallyPostIRSystemRuleValue");
												var result =this.triggerMapreduce(warehouseLocationId,shipmentId,binInternalId,manuallyPostIRSystemRuleValue);
												if (JSON.stringify(result) != '{}') {
													if (result.returnStatus) {
														if (result.returnStatus == 'MapReduceTriggered'&& manuallyPostIRSystemRuleValue == 'Y') {
															binValidateDetails.mapReduceTriggered = "Y";
														}
													}
												}
											}
											var inputParamObj={};
											inputParamObj.shipmentId =shipmentId;
											inputParamObj.shipmentReceiptId =shipmentReceiptId;
											inputParamObj.openTaskIdarray =openTaskIdarray;
											inputParamObj._ignoreUpdate =false;
											impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
											log.debug({title:'impactedRecords :', details: impactedRecords });
										}
									}
									else{
									var itemId = requestParams.itemInternalId;
									var itemType1 = requestParams.itemType;
									var poId = requestParams.poInternalId;
									var poName = requestParams.poname;
									var unit = requestParams.uom;
									var unitConversionRate = requestParams.conversionRate;
									var strBarCode1 = requestParams.strBarCode;
									var invStatusId = fromStatusId;
									var exptdQty = requestParams.expectedQty;

									if (isTallyScanRequired == true && itemType != "serializedinventoryitem" &&
										itemType != "serializedassemblyitem" && itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem") {
										for (var obj in tallyLoopObj) {
											var tallyObj = tallyLoopObj[obj];
											var tallyScanQty = tallyObj.quantity;
											invStatusId = tallyObj.statusName;
											var lotName = tallyObj.lotName;
											var expiryDate = tallyObj.lotExpiryDate;
											if (utility.isValueValid(selectedConversionRateForTallyScan) && tallyScanQty > 0) {
												tallyScanQty = Number(Big(tallyScanQty).mul(selectedConversionRateForTallyScan));
												tallyScanQty = Number(Big(tallyScanQty).div(unitConversionRate));
											}

											var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams, manuallyPostIRSystemRuleValue, binName, binInternalId, shipmentLineNo,
												tallyScanQty, warehouseLocationId, shipmentReceiptId, itemId, itemType1, poId, poName, unit, unitConversionRate, strBarCode1,
												invStatusId, exptdQty, shipmentId, lotString, '', binLocType, binIsCart);
											var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
											openTaskIdarray.push(openTaskId);
										}
									} else {
										var totalTallyScanQty = 0;
										if (isTallyScanRequired == true) {
											for (var obj in tallyLoopObj) {
												var tallyObj = tallyLoopObj[obj];
												totalTallyScanQty = parseFloat(totalTallyScanQty) + parseFloat(tallyObj.quantity);
											}
											if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") &&
												utility.isValueValid(unitConversionRate)) {
												totalTallyScanQty = Number(Big(totalTallyScanQty).div(unitConversionRate));
											} else {
												if (utility.isValueValid(selectedConversionRateForTallyScan) && totalTallyScanQty > 0) {
													totalTallyScanQty = Number(Big(totalTallyScanQty).mul(selectedConversionRateForTallyScan));
													totalTallyScanQty = Number(Big(totalTallyScanQty).div(unitConversionRate));
												}
											}
											quantity = totalTallyScanQty;
										}
										var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams, manuallyPostIRSystemRuleValue, binName, binInternalId, shipmentLineNo,
											quantity, warehouseLocationId, shipmentReceiptId, itemId, itemType1, poId, poName, unit, unitConversionRate, strBarCode1,
											invStatusId, exptdQty, shipmentId, lotString, '', binLocType, binIsCart);
										var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
										openTaskIdarray.push(openTaskId);

										binValidateDetails.openTaskId = openTaskId;
									}

									if (itemType1 == translator.getTranslationString("ITEMTYPE_SERIAL") ||
										itemType1 == translator.getTranslationString("ITEMTYPE_SERIAL_ASSEMBLY")) {
										this.addBinDetailsToSerialEntryRecords(serialEntryRecordArray, shipmentId, shipmentLineNo, poId, binInternalId, invStatusId, openTaskId);
									} else if (itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
										itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
										this.addBinDetailsToSerialEntryRecords(lotJSONobj, shipmentId, shipmentLineNo, poId, binInternalId, null, openTaskId);
									}
									inputParamObj = {};
									inputParamObj.poInternald = poInternald;
									inputParamObj.shipmentId = shipmentId;
									inputParamObj.openTaskIdarray = openTaskIdarray;
									inputParamObj.poName = poName;
									inputParamObj.warehouseLocationId = warehouseLocationId;
									inputParamObj.shipmentReceiptId = shipmentReceiptId;
									inputParamObj._ignoreUpdate = false;
									impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
									log.debug({title: 'impactedRecords :', details: impactedRecords});
									binValidateDetails.impactedRecords = impactedRecords;

								}
								var receiveAllShipmentLineNo = requestParams.shipmentLineNo;
								binValidateDetails.vCount = inboundUtility.checkCountforRemaining(shipmentListDetails, shipmentReceiptId, warehouseLocationId);
								binValidateDetails.shipmentReceiptId = shipmentReceiptId;
								binValidateDetails.binName = binName;
								binValidateDetails.binInternalId = binInternalId;
								binValidateDetails.isValid = true;
							}
							}
							if(receiveAllBtn == 'receiveAll' && isMapReduceScriptInvoked == 'T'){
								//all items are received
								binValidateDetails.vCount = 0;
								binValidateDetails.isMapReduceScriptInvoked = 'T';
							}else if (binValidateDetails.mapReduceTriggered =='Y'){
                              	binValidateDetails.vCount = 0;
                            }
						}
						else{

							binValidateDetails.errorMessage = translator.getTranslationString(isErrorInMixRules);
							binValidateDetails.isValid = false;
						}

					}
					else{
						binValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_BIN');
						binValidateDetails.isValid = false;
					}
				}
				else{
					binValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_BIN');
					binValidateDetails.isValid = false;
				}
			}
			else{
				binValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_BIN');
				binValidateDetails.isValid = false;
			}
		}
		catch(e){
			binValidateDetails.isValid = false;
			binValidateDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message});
		}
		return binValidateDetails;
	}


	function validateEnteredBin(enterBin,warehouseLocationId,systemRule,stageLocArr){

		var binSearchFilters = [];

		binSearchFilters.push(search.createFilter({
			name: 'binnumber',
			operator: search.Operator.IS,
			values: enterBin
		}));

		binSearchFilters.push(search.createFilter({
			name: 'inactive',
			operator: search.Operator.IS,
			values: false
		}));
		binSearchFilters.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));
		if(systemRule == 'N' && stageLocArr.length > 0){

			var stgBinId = utility.getBinInternalId(enterBin,warehouseLocationId);		
			var binLookUp = '';
			if(utility.isValueValid(stgBinId)){
				binLookUp = search.lookupFields({
					type: search.Type.BIN,
					id: stgBinId,
					columns: ['custrecord_wms_iscart']
				});
			}
			if(utility.isValueValid(binLookUp) && utility.isValueValid(binLookUp.custrecord_wms_iscart) && binLookUp.custrecord_wms_iscart==true)
			{
				binSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_bin_loc_type',
					operator: search.Operator.ANYOF,
					values: stageLocArr
				}));
			}
			else
			{
				binSearchFilters.push(search.createFilter({
					name: 'custrecord_wmsse_bin_loc_type',
					operator: search.Operator.NONEOF,
					values: stageLocArr
				}));
			}			
		}
		var searchrecord=search.create({
			type:'Bin',
			filters:binSearchFilters,
			columns:[{
				name: 'custrecord_wmsse_bin_stg_direction'},
				{name:'custrecord_wmsse_bin_loc_type'},
				{name:'custrecord_wms_iscart'}]
		});
		return  searchrecord.run().getRange({	start: 0,end: 1000	});

	}
	function getStageLocArr(systemRule)	{
		var stageLocArr = [];

		var BinlocationSearch =  search.create({
			type:'customlist_wmsse_bin_loc_type',
			columns:[{
				name: 'name'}]
		});
		var	 BinlocationTypes = BinlocationSearch.run().getRange({
			start: 0,
			end: 1000
		});
		if(BinlocationTypes != null && BinlocationTypes != undefined && BinlocationTypes != ''
			&& BinlocationTypes.length > 0)	{
			var stgTypeArr = [];
			if(systemRule == 'Y'){

				stgTypeArr.push('Stage');
				stageLocArr =	utility.getStageLocations(stgTypeArr,BinlocationTypes);
			}
			else{
				stgTypeArr.push('Stage');
				stgTypeArr.push('WIP');
				stageLocArr =	utility.getStageLocations(stgTypeArr,BinlocationTypes);
			}
		}
		return stageLocArr;
	}
	function mixItemRulesCheck(blnMixItem,blnMixLot,itemType,lotno,binInternalId,whLocationId,itemInternalId,receiveAllBtn){

		var message = '';
		if(receiveAllBtn == 'receiveAll' && (blnMixItem == false || blnMixLot == false)){

			if(!blnMixItem)	{

				var objInvDetails = utility.fnGetInventoryBins(whLocationId,itemInternalId,binInternalId);
				log.debug({title:'objInvDetails',details:objInvDetails});
				if(objInvDetails.length > 0) {

					message = 'PO_QUANTITYVALIDATE.MIXITEMS_FALSE';
				}
			}
			if((!blnMixLot) && (itemType == translator.getTranslationString('ITEMTYPE_LOT') || 
					itemType == translator.getTranslationString('ITEMTYPE_LOT_ASSEMBLY'))) {

				var objInvDetails1 = _getLotItemInventoryDetails(whLocationId,binInternalId,lotno);
				log.debug({title:'objInvDetails1',details:objInvDetails1});
				if(objInvDetails1.length>0){
					message =  'PO_QUANTITYVALIDATE.MIXLOTS_FALSE';
				}
			}
		}
		else{
			var objInvDetails2 = utility.getItemMixFlagDetails(whLocationId,itemInternalId,binInternalId,true,null);
			if(objInvDetails2.length > 0){

				message = 'INVENTORY_QUANTITYVALIDATE.BIN_MIXITEMS_FALSE';
			}
		}

		return message;

	}

	function _getLotItemInventoryDetails(whLocation,binInternalId,lotno)	{

		var invDetailsSearch = search.load({id:'customsearch_wmsse_itemwise_lots'});
		var invDeialsFilters = invDetailsSearch.filters;

		if(utility.isValueValid(whLocation)){
			invDeialsFilters.push(search.createFilter({
				name:'location',
				join: 'inventoryNumberBinOnHand',
				operator: search.Operator.ANYOF,
				values:whLocation}));
		}
		if(utility.isValueValid(binInternalId))	{
			invDeialsFilters.push(search.createFilter({
				name:'binnumber',
				join: 'inventoryNumberBinOnHand',
				operator: search.Operator.ANYOF,
				values:binInternalId}));
		}
		if(utility.isValueValid(lotno))	{
			invDeialsFilters.push(search.createFilter({
				name:'inventorynumber',
				join: 'inventoryNumberBinOnHand',
				operator: search.Operator.ISNOT,
				values:lotno}));
		}
		invDeialsFilters.push(search.createFilter({
			name:'islotitem',
			operator: search.Operator.IS,
			values:true}));
		invDetailsSearch.filters = invDeialsFilters;
		return utility.getSearchResultInJSON(invDetailsSearch);
	}

	function addBinDetailsToSerialEntryRecords(lotJSONobj, shipmentId, shipmentLineNo, poInternalId, binInternalId, invstatusId, openTaskId){

		var columnsObject = new Object();
		columnsObject.custrecord_wmsse_ser_bin = binInternalId;
		columnsObject.custrecord_wms_opentaskno = openTaskId;
		if(invstatusId){
			columnsObject.custrecord_serial_inventorystatus = invstatusId;
		}
		for(var lotObjIndex in lotJSONobj){
			utility.submitRecord('customrecord_wmsse_serialentry', lotJSONobj[lotObjIndex]['serialEntryRecordId'], columnsObject);
		}
	}

	function updateOpenTaskWithShipmentReceiptId(openTaskDtls,shipmentReceiptId,binInternalId,systemRuleValue) {
		if (systemRuleValue == 'N') {
			record.submitFields({
				type: 'customrecord_wmsse_trn_opentask',
				id: openTaskDtls.internalid,
				values: {
					'custrecord_wmsse_rec_inb_shipment': shipmentReceiptId,
					'custrecord_wmsse_actbeginloc': binInternalId,
					'custrecord_wmsse_actendloc': binInternalId
				}
			});
		} else {
			record.submitFields({
				type: 'customrecord_wmsse_trn_opentask',
				id: openTaskDtls.internalid,
				values: {
					'custrecord_wmsse_actbeginloc': binInternalId,
					'custrecord_wmsse_actendloc': binInternalId
				}
			});
		}
	}


	function triggerMapreduce(whLocationId,shipmentId,binInternalId,manuallyPostIRSystemRuleValue){
		log.error('MR PARAMEETERs shipmentId',shipmentId);
		log.error('MR PARAMEETERs manuallyPostIRSystemRuleValue',manuallyPostIRSystemRuleValue);
		log.error('MR PARAMEETERs binInternalId',binInternalId);
				var schstatus =  task.create({taskType:task.TaskType.MAP_REDUCE});
				schstatus.scriptId = 'customscript_wms_mr_opentaskupdate';
				schstatus.params = {
					"custscript_wms_orderid"         : "",
					"custscript_wms_warehouseInternalId" : whLocationId,
					"custscript_wms_itemreceiptId" : "",
					"custscript_wms_bininternalidnumber" : binInternalId,
					"custscript_wms_shipmentId"         : shipmentId,
					"custscript_wms_processType"	: "ISM",
					"custscript_wms_systemRuleValue" :manuallyPostIRSystemRuleValue
				};
				var mrTaskId  =  schstatus.submit();
				var taskStatus = task.checkStatus(mrTaskId);
      log.error('MR taskStatus',taskStatus);
				var returnStatus = "";
				var schScriptStatusLink = "";
				if (taskStatus.status != 'FAILED') {
					utility.updateScheduleScriptStatus("ISMrandomTallyscanBinUpdate", runtime.getCurrentUser().id, "Submitted", shipmentId, "", "", "");
					returnStatus = 'MapReduceTriggered';
					var scriptStatusURL = '/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&scripttype=' + taskStatus.scriptId;
					var schScriptStatusLink = '<a href="' + scriptStatusURL + '"> ' + translator.getTranslationString('GUIPACKING.CLICKHERE') + ' </a>';
				}
				return { 'returnStatus' : returnStatus, 'schScriptStatusLink' : schScriptStatusLink};
			}
	function scriptUsageRequiredToUpdateOpenTask(opentaskCount){
				var bufferScriptUsage = 20;
				var scriptUsageNeededForStep1 = Number(Big(opentaskCount).mul(15)) ;
				var scriptUsageNeeded = parseFloat(scriptUsageNeededForStep1) + parseFloat(bufferScriptUsage);
				return scriptUsageNeeded;
			}
	function createLotInfoInSerialEntry(shipmentNumber,shipmentId,warehouseLocationId,tallyLoopObj,binInternalId) {
log.debug('tallyLoopObj',tallyLoopObj);
				for(var obj in tallyLoopObj) {
					var tallyObj = tallyLoopObj[obj];
					if (utility.isValueValid(tallyObj.lotName)) {
						var itemInternalId = tallyObj.itemInternalId;
						var lotName = tallyObj.lotName;
						var invStatusId = tallyObj.statusName;
						var lotExpiryDate = tallyObj.lotExpiryDate;
						var shipmentLineNo = tallyObj.line;
						var poInternald = tallyObj.transactionInternalId;
						/*var selectedConversionRate = tallyObj.selectedConversionRate;
						if(!utility.isValueValid(selectedConversionRate))
						{
							selectedConversionRate =1;
						}
						var lotQuantity = Number(Big(tallyObj.quantity).mul(selectedConversionRate));*/
						var lotQuantity = tallyObj.quantity;

						var createLotISMObj = {};
						createLotISMObj.shipmentNumber = shipmentNumber;
						createLotISMObj.warehouseLocationId = warehouseLocationId;
						createLotISMObj.itemInternalId = itemInternalId;
						createLotISMObj.purchaseorderInternalId = poInternald;
						createLotISMObj.shipmentInternalNumber = shipmentId;
						createLotISMObj.shipmentLineNumber = shipmentLineNo;
						createLotISMObj.scannedQuantity = lotQuantity;
						createLotISMObj.LotName = lotName;
						createLotISMObj.inventoryStatusId = invStatusId;
						createLotISMObj.binInternalId = binInternalId;

						if (utility.isValueValid(lotExpiryDate)) {
							var lotDate = format.parse({
								value: lotExpiryDate,
								type: format.Type.DATE
							});
							createLotISMObj.lotExpiryDate = lotDate;
						} else {
							createLotISMObj.lotExpiryDate = '';
						}
						var serialEntryId = inboundUtility.createLotISMInfoInSerialEntry(createLotISMObj);
						log.debug('serialEntryId',serialEntryId);

					}

				}
			}
	function updateBinInSerialEntryForRandomTallyscan(shipmentId,binInternalId)
	{
		try {
			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});
			var serailFilters = serialSearch.filters;
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_inb_shipment',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_tasktype',
				operator: search.Operator.ANYOF,
				values: 2
			}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_bin',
				operator:search.Operator.ISEMPTY
			}));
			serialSearch.filters = serailFilters;
			var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
			if (serialSearchResults.length > 0) {
				log.debug("UPDATE SERIAL ENTRY",serialSearchResults.length);
				for (var serialItr = 0; serialItr < serialSearchResults.length; serialItr++) {
					var serialInternalId = serialSearchResults[serialItr].id;
					var columnsObject = new Object();
					columnsObject.custrecord_wmsse_ser_bin = binInternalId;
					columnsObject.custrecord_wms_opentaskno = "randomTallyscan";
					utility.submitRecord('customrecord_wmsse_serialentry', serialInternalId, columnsObject);
				}
			}
		}
		catch(exp){
			log.error("Exeception in updateBinInSerialEntryForRandomTallyscan",exp);
		}
	}
	return {
		'post': doPost,
		addBinDetailsToSerialEntryRecords : addBinDetailsToSerialEntryRecords,
		updateOpenTaskWithShipmentReceiptId:updateOpenTaskWithShipmentReceiptId,
		triggerMapreduce:triggerMapreduce,
		createLotInfoInSerialEntry:createLotInfoInSerialEntry,
		updateBinInSerialEntryForRandomTallyscan:updateBinInSerialEntryForRandomTallyscan
	};
});
