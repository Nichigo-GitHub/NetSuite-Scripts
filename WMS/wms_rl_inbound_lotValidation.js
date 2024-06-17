/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/format','./wms_utility','./wms_translator','./big', './wms_inboundUtility','./wms_tallyScan_utility'],

		function (search,format,utility,translator,Big, inboundUtility,tallyScanUtility) {

	/**
         This function validates the entered/scanned lot
	 */
	function doPost(requestBody) {
		var debugString = '';
		var lotValidationDetails = {};
		try{
			if (utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				var whLocation = requestParams.warehouseLocationId;
				var fetchedItemId = requestParams.itemInternalId;
				var enterLot = requestParams.lotName;
				var enterExpiryDate = requestParams.lotExpiryDate;
				var trantype = requestParams.transactionType;
				var getOrderInternalId =requestParams.transactionInternalId;
				var getOrderLineNo = requestParams.transactionLineNo;
				var lotString = requestParams.lotString;
				var receiveAllBtn = requestParams.receiveAll;
				var selectBin = requestParams.selectBin;
				var shipmentId = requestParams.shipmentId;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var transactionName = requestParams.transactionName;
				var selectedStatusName = requestParams.selectedStatusName;
				var selectedStatus = requestParams.selectedStatus;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var vendorId = requestParams.vendorId;
				var tallyLoopObj = requestParams.tallyLoopObj;
				var actualBeginTime = requestParams.actualBeginTime;
				var selectedUOM = requestParams.selectedUOM;
				var item_Type = requestParams.itemType;
				var transactionUomName = requestParams.transactionUomName;
				var poname = requestParams.poname;


				log.debug({title:'requestParams',details:requestParams});

				if((utility.isValueValid(whLocation) && utility.isValueValid(fetchedItemId) && utility.isValueValid(enterLot)
						&& utility.isValueValid(getOrderInternalId) && utility.isValueValid(getOrderLineNo)) || (utility.isValueValid(enterLot) || 
								(receiveAllBtn == 'receiveAll') || selectBin == 'selectBin' ))
				{

					var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
					if(trantype == 'transferorder')
					{
						var lotQuantity = isScannedLotFulfilled(getOrderLineNo,getOrderInternalId,fetchedItemId,enterLot,whLocation,transactionUomConversionRate);
						if(parseFloat(lotQuantity) <= 0)
						{
							lotValidationDetails['errorMessage'] = translator.getTranslationString('TO_LOT_VALIDATION.LOTNOTFULFILLED');
							lotValidationDetails['isValid'] = false;
						}
						else
						{
							lotValidationDetails['lotName'] = enterLot;
							lotValidationDetails['remainingQuantity'] = lotQuantity;
							lotValidationDetails['errorMessage'] = '';
							lotValidationDetails['isValid'] = true;
						}
					}				
					else
					{
						log.debug({title:'trantype',details:trantype});
						log.debug({title:'receiveAllBtn',details:receiveAllBtn});
						if(trantype == 'inboundShipment'){

							if(selectBin == 'selectBin')
							{
								lotValidationDetails['selectBin'] = 'selectBin';
								lotValidationDetails['isValid'] = true;
							}
							else if(receiveAllBtn == 'receiveAll'){
								var isEligibleForReceiveAll = this._checkISMLineReceiveAllEligibility(shipmentId,whLocation,fetchedItemId,getOrderLineNo);
								log.debug({title:'isEligibleForReceiveAll',details:isEligibleForReceiveAll});
								if(isEligibleForReceiveAll)
								{
									var isISMLineManuallyReceived = inboundUtility.checkIslinePartiallyReceivedInISM(shipmentId,whLocation,getOrderLineNo);
									log.debug({title:'isISMLineManuallyReceived',details:isISMLineManuallyReceived});
									if(!isISMLineManuallyReceived)
									{
										log.debug({title:'locUseBinsFlag',details:locUseBinsFlag});
										lotValidationDetails['isValid'] = true;
										if(utility.isValueValid(locUseBinsFlag)  && locUseBinsFlag == false)
										{

											var isFromNewStatusScreen = requestParams.isFromNewStatusScreen;
											if(inventoryStatusFeature)
											{

												if(isFromNewStatusScreen == 'EnterStatusScreen')
												{
													var receiveAllStatusId = requestParams.inventoryStatusId;
													if(utility.isValueValid(receiveAllStatusId))
													{
														var manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',whLocation,trantype);
														lotValidationDetails['manuallyPostIRSystemRuleValue'] = manuallyPostIRSystemRuleValue;

														var itemListCount = requestParams.itemListCount;
														lotValidationDetails['isMapReduceScriptInvoked'] = 'F';
														if(itemListCount > 40 && !utility.isValueValid(getOrderLineNo)){

															inboundUtility.callSchedulerToReceiveISM(shipmentId,whLocation,'',receiveAllStatusId);
															lotValidationDetails['isMapReduceScriptInvoked'] = 'T';
															lotValidationDetails['isValid'] = true;
															lotValidationDetails['itemsCount'] = 0;
														}
														else
														{
															var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId,'',whLocation);
															var shipmentReceiptId =	inboundUtility.iSM_receiveAll(shipmentId,whLocation,'',getOrderLineNo,manuallyPostIRSystemRuleValue,receiveAllStatusId);


															if(shipmentListDetails.length > 0 )	{
																var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId,'',whLocation);
																log.debug({title:'shipmentListDetails length',details:shipmentListDetails.length});
																var shipmentLineNo,unitType, quantity,itemInternalId,itemType,poInternalId,poname,uom,conversionRate,expectedQty = '';
																var invStatusId = receiveAllStatusId;
																var quantityReceived = '';
																var lineItemOpentaskRcvQty = '';
																for (var shipmentLine in shipmentListDetails) {

																	var shipmentLineRec = shipmentListDetails[shipmentLine];
																	quantity = shipmentLineRec.quantityremaining;
																	shipmentLineNo = shipmentLineRec.inboundshipmentitemid;
																	quantityReceived = shipmentLineRec.quantityreceived;
																	if(!utility.isValueValid(requestParams.transactionLineNo))
																	{
																		getOrderLineNo = shipmentLineNo;
																	}
																	if(JSON.stringify(openPutAwayDetails) != '{}')
																	{
																		lineItemOpentaskRcvQty = openPutAwayDetails[shipmentLineNo];
																	}
																	if(parseFloat(quantity) > 0 && shipmentLineNo == getOrderLineNo && ( !utility.isValueValid(quantityReceived) && !utility.isValueValid(lineItemOpentaskRcvQty)))
																	{

																		itemInternalId = shipmentLineRec.item;
																		uom = shipmentLineRec.unitText;	
																		var columnlookupArray =[];
																		columnlookupArray.push('recordtype');
																		columnlookupArray.push('unitstype');

																		var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnlookupArray);

																		if (itemLookUp.recordtype !== undefined){
																			itemType = itemLookUp.recordtype;
																		}
																		if (itemLookUp.unitstype !== undefined &&
																				itemLookUp.unitstype[0] !== undefined){
																			unitType = itemLookUp.unitstype[0].value;
																		}
																		var conversionRate = '';
																		if(uom != null && uom != undefined)	{

																			 conversionRate = utility.getConversionRate(uom,unitType);
																			if (conversionRate != undefined &&
																					conversionRate != null && conversionRate != ''){
																				quantity = Number(Big(quantity).div(conversionRate));
																			}
																		}

																		poInternalId = shipmentLineRec.purchaseorder;
																		poname = shipmentLineRec.purchaseorderText;
																		expectedQty = shipmentLineRec.quantityexpected;

																		var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams,manuallyPostIRSystemRuleValue,'','',shipmentLineNo,
																				quantity,whLocation,shipmentReceiptId,
																				itemInternalId,itemType,poInternalId,poname,uom,conversionRate,'',invStatusId,expectedQty,shipmentId,lotString);
																		inboundUtility.updateOpenTask(opetaskParamsObj);

																	}
																}
															}
															lotValidationDetails['itemsCount'] = inboundUtility.checkCountforRemaining(shipmentListDetails,shipmentReceiptId,whLocation);

															lotValidationDetails['manuallyPostIRSystemRuleValue'] = manuallyPostIRSystemRuleValue;
															lotValidationDetails['isMapReduceScriptInvoked'] = 'F';
															lotValidationDetails['isValid'] = true;


														}
													}
													else
													{
														lotValidationDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.SELECT_INVENTORY_STATUS');
														lotValidationDetails['isValid'] = false;
													}
												}
											}
											else
											{
												var manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',whLocation,trantype);
												var shipmentReceiptId = inboundUtility.iSM_receiveAll(shipmentId,whLocation,'',getOrderLineNo,manuallyPostIRSystemRuleValue,'');
												var itemId = requestParams.itemInternalId;
												var itemType = requestParams.itemType;		
												var poId = requestParams.poInternalId;
												var poName = requestParams.poname;
												var unit = requestParams.uom;		
												var unitConversionRate = requestParams.conversionRate;
												var strBarCode = requestParams.strBarCode;
												var remainingQuantity = requestParams.remainingQuantity;

												var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams,manuallyPostIRSystemRuleValue,'','',getOrderLineNo,
														remainingQuantity,whLocation,shipmentReceiptId,itemId,itemType,poId,poName,unit,unitConversionRate,strBarCode,
														'',remainingQuantity,shipmentId,lotString);
												var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
												lotValidationDetails['openTaskId'] = openTaskId;
												var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId,'',whLocation);
												var qtyRemainLinesCountForRecving = inboundUtility.checkCountforRemaining(shipmentListDetails,shipmentReceiptId,whLocation);
												var remainingItemsCount = qtyRemainLinesCountForRecving;
												log.debug({title:'remainingItemsCount',details:remainingItemsCount});
												lotValidationDetails['itemsCount'] = remainingItemsCount;
												lotValidationDetails['imageUrl'] = requestParams.imageUrl;
												lotValidationDetails['incoTerm'] = requestParams.incoTerm;
												lotValidationDetails['poname'] = requestParams.poname;
												lotValidationDetails['itemName'] = requestParams.itemName;
												lotValidationDetails['openTaskId'] = openTaskId;
												lotValidationDetails['shipmentReceiptId'] = shipmentReceiptId;  
												lotValidationDetails['manuallyPostIRSystemRuleValue'] = manuallyPostIRSystemRuleValue;
												lotValidationDetails['isMapReduceScriptInvoked'] = 'F';
												lotValidationDetails['isValid'] = true;
											}

										}
										else
										{
											lotValidationDetails['receiveAllBtn'] = 'receiveAll';
										}
									}
									else
									{
										lotValidationDetails['errorMessage'] =  translator.getTranslationString('INBOUNDSHIPMENT.INVALID.RECEIVEALL.PARTIALLYRECEIVED');
										lotValidationDetails['isValid'] = false; 
									}
								}
								else
								{
									lotValidationDetails['errorMessage'] = translator.getTranslationString('INBOUNDSHIPMENT.INVALID.RECEIVEALL');
									lotValidationDetails['isValid'] = false; 
								}
							}
							if(!utility.isValueValid(lotString))
							{
								lotValidationDetails['lotString'] =  enterLot;
							}
							else
							{
								lotValidationDetails['lotString'] = lotString + ","+enterLot;
							}
						}

						if(selectBin != 'selectBin' && receiveAllBtn != 'receiveAll')
						{
							var existingLotDetails = [];
							var enterLotId = false;
							var isInValidExpiryDateEntered = '';
							if(trantype == 'inboundShipment') {
								
								var currItem = utility.getSKUIdWithName(enterLot, whLocation,requestParams.VendorId,getOrderInternalId);
							
								if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error)))) {
									var barcodeItemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
								
									if (fetchedItemId == barcodeItemInternalId) {
										if (utility.isValueValid(currItem.barcodeLotname)) {
											enterLot = currItem.barcodeLotname;
										
											if(!utility.isValueValid(lotString))
											{
												lotValidationDetails['lotString'] =  enterLot;
											}
											else
											{
												lotValidationDetails['lotString'] = lotString + ","+enterLot;
											}
										}
									} else {

										lotValidationDetails[errorMessage] = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
										lotValidationDetails[isValid] = false;
									}
								}
							}
							if(utility.isValueValid(enterLot)){
							
								existingLotDetails = utility.checkInventoryNumberExistsAndGetDetails(fetchedItemId, enterLot, whLocation);
							}
							log.debug({title:'existingLotDetails',details:existingLotDetails});
							if(existingLotDetails.length>0){
								var existingExpirtydate = existingLotDetails[0].getValue({
									name: 'expirationdate'
								});
								if(utility.isValueValid(existingExpirtydate)){
									enterLotId = true;
									lotValidationDetails["lotExpiryDate"] = existingExpirtydate;
								}
							}
							if (!enterLotId)//if lot is already exists in inventory, no need to consider expiry date
							{
								var systemRule_gs1barcodeResults = utility.getSystemRuleDetails('Enable Advanced Barcode Scanning?' ,whLocation , 'Y');
								if(systemRule_gs1barcodeResults.length > 0 ) {
									if (utility.isValueValid(systemRule_gs1barcodeResults[0].custrecord_wmsseprocesstypeText)) {
										var barCodeType = systemRule_gs1barcodeResults[0].custrecord_wmsseprocesstypeText;
										var advancedBarcodeSystemRuleValue = systemRule_gs1barcodeResults[0].custrecord_wmsserulevalue;
										if(utility.isValueValid(advancedBarcodeSystemRuleValue) && advancedBarcodeSystemRuleValue == "Y"){
										var currItem = {};
										if (barCodeType == translator.getTranslationString("ADVANCE_BARCODE.GS1BARCODE")) {
											vendorId = "";
										}
										currItem = utility.getSKUIdWithName(enterLot, whLocation, vendorId, getOrderInternalId);
										log.debug("currItem", currItem);
										if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error)))) {
											enterLot = currItem.barcodeLotname;
										}
									}
									}
								}

								isInValidExpiryDateEntered = this.calculateOrValidateExpiryDate(fetchedItemId,enterExpiryDate,lotValidationDetails);
							}
							if(isInValidExpiryDateEntered != '')
							{
								lotValidationDetails['errorMessage'] = isInValidExpiryDateEntered;
								lotValidationDetails['isValid'] = false; 
							}
							else
							{
								lotValidationDetails["lotName"] = enterLot;
								lotValidationDetails["lotScanned"] = "T";
								lotValidationDetails['isValid'] = true;
							}
						}


					  // }


					}
					debugString = debugString + "lotValidationDetails :"+lotValidationDetails;
				}
				else
				{
					lotValidationDetails["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
					lotValidationDetails['isValid'] = false;
				}
			}
			else {
				lotValidationDetails["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
				lotValidationDetails['isValid'] = false;
			}
		}
		catch(e)
		{
			lotValidationDetails['isValid'] = false;
			lotValidationDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug("lotValidationDetails",lotValidationDetails);
		return lotValidationDetails;
	}

	function validateDate(vDateString,dtsettingFlag)
	{
		log.debug('avDateString',vDateString);
		if(vDateString != null && vDateString != '')
		{
			var vValidDate= format.parse({
				type :format.Type.DATE,
				value : vDateString
			});
			log.debug('avValidDate',vValidDate);
			if(isNaN(vValidDate) || vValidDate == null || vValidDate == '')
				{
				log.debug('aavValidDate1',vValidDate);
				return null;
				}
			else
				{
				log.debug('aavValidDate2',vValidDate);
				return vValidDate;
				}
		}
		else
			return null;
	}

	function _checkISMLineReceiveAllEligibility(shipmentId,whLocation,fetchedItemId,getOrderLineNo)
	{
		var _isEligibleForReceiveAll = true;
		var results = inboundUtility.validateShipmentWithInvtDetailsForReceiveAll(shipmentId,whLocation,fetchedItemId);
		log.debug({title: 'results',details:results});
		if(results.length > 0){
			log.debug({title: 'results',details:results});
			log.debug({title: 'getOrderLineNo',details:getOrderLineNo});
			for(var res in results){
				var item = results[res].item;
				var line  = results[res].inboundshipmentitemid;
				log.debug({title: 'line',details:line});
				if(parseInt(getOrderLineNo) == parseInt(line)){
					if(item == '' || item == '- None -'){
						_isEligibleForReceiveAll = false;
						break;
					}
				}
			}
		}
		return  _isEligibleForReceiveAll;
	}
	
	function isScannedLotFulfilled(getOrderLineNo,getOrderInternalId,fetchedItemId,enterLot,whLocation,transactionUomConversionRate)
	{
		var orderLineNo = parseInt(getOrderLineNo) + parseInt(1);
		var fulfilledLotDetails = inboundUtility.getTOfulfilledLotDetails(getOrderInternalId,fetchedItemId,orderLineNo);
		log.debug({title:'fulfilledLotDetails',details:fulfilledLotDetails});
		var _lotQuantity = 0;
		if (fulfilledLotDetails.length > 0)
		{

			if(!utility.isValueValid(transactionUomConversionRate)){
				transactionUomConversionRate = 1;
			}
			for (var intItr in fulfilledLotDetails) {
				var orderObj = fulfilledLotDetails[intItr];
				var lotNumber = orderObj['serialnumber'];

				if(lotNumber == enterLot)
				{
					var toLotQuantity = Big(orderObj['serialnumberquantity']).mul(-1);   
					toLotQuantity = Number(Big(toLotQuantity).div(transactionUomConversionRate));
					_lotQuantity = Big(_lotQuantity).plus(toLotQuantity);
				}

			}
			log.debug({title:'_lotQuantity',details:_lotQuantity});
			if(parseFloat(_lotQuantity) > 0)
			{
				log.debug({title:'getOrderLineNo',details:getOrderLineNo});
				var opentaskResults = inboundUtility.getTransferOrderOpenTaskDetails(fetchedItemId,getOrderInternalId,getOrderLineNo,whLocation);
				log.debug({title:'opentaskResults',details:opentaskResults});
				if(opentaskResults.length > 0)
				{
					for(var openTaskItr = 0; openTaskItr < opentaskResults.length; openTaskItr++)
					{
						var opentaskQty = opentaskResults[openTaskItr]['custrecord_wmsse_act_qty'];
						var opentaskLotNumber = opentaskResults[openTaskItr]['custrecord_wmsse_batch_num'];
						if(!utility.isValueValid(opentaskQty) || isNaN(opentaskQty))
						{
							opentaskQty = 0;
						}
						if(opentaskLotNumber == enterLot && opentaskQty > 0)
						{
							_lotQuantity =  Number(Big(_lotQuantity).minus(opentaskQty)); 

						}

					}
				}
				log.debug({title:'_lotQuantity',details:_lotQuantity});
				if(parseFloat(_lotQuantity) > 0)
				{
					var	 transferOrderLotReceiptDetails = inboundUtility.getTransferOrderItemReceiptDetails(getOrderInternalId,orderLineNo);
					log.debug({title:'transferOrderLotReceiptDetails',details:transferOrderLotReceiptDetails});
					if(transferOrderLotReceiptDetails.length > 0)
					{
						for(var receiptDetail in transferOrderLotReceiptDetails)
						{
							var orderObj = transferOrderLotReceiptDetails[receiptDetail];  
							var receivedLotNumber = orderObj['serialnumber'];
							var receivedLotQuantity = orderObj['serialnumberquantity'];
							if(receivedLotNumber == enterLot)
							{

								_lotQuantity = Number(Big(_lotQuantity).minus(receivedLotQuantity));
							}
						}
					}
				}
			}
		}

		return _lotQuantity;

	}
	function validateEnteredLotExpiryDate(enterExpiryDate)
	{
		log.debug({title:'enterExpiryDate',details:enterExpiryDate});
		var _message = '';
		var dtsettingFlag = utility.DateSetting(); 
		var getExpDateresult = this.validateDate(enterExpiryDate, dtsettingFlag);
		log.debug({title:'aabenterExpiryDate',details:getExpDateresult});
		if (getExpDateresult == null || getExpDateresult == "" || isNaN(getExpDateresult)) {
			var validationMessage = translator.getTranslationString("PO_LOTVALIDATION.EXPIRYDATE_FORMAT");
			_message = validationMessage+" "+dtsettingFlag+".";
		}
		else {
			var now = utility.convertDate();
			now.setHours(0, 0, 0, 0);
			if (now > getExpDateresult) {
				_message = translator.getTranslationString("PO_LOTVALIDATION.INVALID_EXPRIRYDATE");
			}
		}
		log.debug({title:'abnte_message',details:_message});
		return  _message;
	}
	function calculateOrValidateExpiryDate(fetchedItemId,enterExpiryDate,lotValidationDetails)
	{

		var _message = '';
		if (utility.isValueValid(enterExpiryDate)) {
			log.debug({title:'enterExpiryDate',details:enterExpiryDate});
			_message = this.validateEnteredLotExpiryDate(enterExpiryDate);
			if (_message == "") {
				lotValidationDetails['lotExpiryDate'] = enterExpiryDate;
			}
		}
		else
		{
			var lotLookUp = search.lookupFields({
				type: search.Type.ITEM,
				id: fetchedItemId,
				columns: ['custitem_wmsse_shelflife']
			});
			var shelflife = lotLookUp.custitem_wmsse_shelflife;
			log.debug({title:'ashelflife',details:shelflife});

			if (utility.isValueValid(shelflife))
			{
				if(parseInt(shelflife) > 0) {
					var currDate = utility.convertDate();
					var ExpiryDate = new Date(currDate.setDate(currDate.getDate() + parseInt(shelflife)));
					var getExpDateresult = format.format({
						value: ExpiryDate,
						type: format.Type.DATE
					});
					lotValidationDetails['lotExpiryDate'] = getExpDateresult;
				}
				else {
					_message = translator.getTranslationString('PO_LOTVALIDATION.INVALID_SHELFLIFE');
				}
			}
		}
		log.debug({title:'a_message',details:_message});
		return _message;
	}

	return {
		'post': doPost,		
		'_checkISMLineReceiveAllEligibility':_checkISMLineReceiveAllEligibility	,
		'validateDate':validateDate,
		'calculateOrValidateExpiryDate':calculateOrValidateExpiryDate,
		'validateEnteredLotExpiryDate':validateEnteredLotExpiryDate
		
		
	};

});
