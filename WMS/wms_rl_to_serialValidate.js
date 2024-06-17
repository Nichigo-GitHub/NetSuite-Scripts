/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', 'N/search', 'N/record','./big','./wms_translator', './wms_inboundUtility','./wms_inbound_utility'],

		function (utility, search, record,Big,translator, inboundUtility,inboundLib) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {

		var serialValidationDetails = {};
		var itemInternalId = '';
		var transactionInternalId = '';
		var transactionLineNo = '';
		var warehouseLocationId = '';
		var transactionName = '';
		var serialName = '';
		var numberOftimesSerialScanned ='';
		var transactionType ='';
		var inventoryStatus = '';
		var debugString ='';
		var requestParams ='';
		var impactedRecords = {};

		try{
			if(utility.isValueValid(requestBody))
			{
				requestParams= requestBody.params;
				itemInternalId = requestParams.itemInternalId;
				transactionInternalId = requestParams.transactionInternalId;
				transactionLineNo = requestParams.transactionLineNo;
				warehouseLocationId = requestParams.warehouseLocationId;
				transactionName = requestParams.transactionName;
				serialName = requestParams.serialName;
				numberOftimesSerialScanned =requestParams.numberOfTimesSerialScanned;
				transactionType = requestParams.transactionType;
				inventoryStatus = requestParams.inventoryStatus;
				var enteredQtyInEach = requestParams.enteredQtyInEach;

				var itemType = requestParams.itemType;
				var scannedQuantity = requestParams.scannedQuantity;
				var customer = requestParams.customerId;

				var invtStatus = requestParams.statusInternalId;
				var actualBeginTime = requestParams.actualBeginTime;
				var useitemcostflag = 'F';
				var remQty = requestParams.remainingQuantity;
				var info_receivedQuantity = requestParams.info_receivedQuantity;
				var info_remainingQuantity = requestParams.info_remainingQuantity;
				var uom = requestParams.stockUnitName;
				var conversionRate = requestParams.stockConversionRate;//not able to find

				if(utility.isValueValid(serialName) && utility.isValueValid(itemInternalId)
						&& utility.isValueValid(transactionName) && utility.isValueValid(warehouseLocationId) 
						&& utility.isValueValid(transactionLineNo) && utility.isValueValid(transactionInternalId))
				{



					var itemResults = inboundUtility.getItemSearchDetails(itemInternalId,warehouseLocationId);
					if (itemResults == null || itemResults.length == 0) {
						serialValidationDetails['errorMessage'] =translator.getTranslationString('TO_SERIALVALIDATION.INACTIVE_ITEM');
						serialValidationDetails['isValid']=false;
					}
					else
					{
						impactedRecords['_ignoreUpdate'] = true;

						var systemRuleValue=utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
						var tempFlag = true;
						if(systemRuleValue == 'Y')
						{
							var toitemLineDetails =  inboundUtility.getRecevingOrderItemDetails(transactionName,itemInternalId, warehouseLocationId, transactionLineNo,'','',transactionType);
							if(toitemLineDetails.length > 0)
							{
								var toLineDetailsRec = toitemLineDetails[0];
								var toInternalId = toLineDetailsRec['internalid'];
								var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(toInternalId,warehouseLocationId,itemInternalId,transactionLineNo);
								if(JSON.stringify(openPutAwayDetails) !== '{}')
								{
									var toitemOPentaskRcvQty = openPutAwayDetails[transactionLineNo];
									if(utility.isValueValid(toitemOPentaskRcvQty))
									{
										var toLineReceivedQty = toLineDetailsRec['totalReceivedQty'];
										var toLineRemainingQty = toLineDetailsRec['TransferOrderLine_Remainingqty'];
										toLineDetailsRec['totalReceivedQty'] = Number(Big(toLineReceivedQty).plus(toitemOPentaskRcvQty));
										toLineDetailsRec['TransferOrderLine_Remainingqty'] = Number(Big(toLineRemainingQty).minus(toitemOPentaskRcvQty));
									}
								}
								var toReminQty = toLineDetailsRec['TransferOrderLine_Remainingqty'];
								if(parseFloat(toReminQty) <= 0)
								{
									tempFlag = false;
									serialValidationDetails["errorMessage"] = translator.getTranslationString('TO_SERIALVALIDATION.TRANSACTION_COMPLETED');
									serialValidationDetails['isValid'] = false;
								}
							}
							else
							{
								tempFlag = false;
								serialValidationDetails["errorMessage"] = translator.getTranslationString('TO_SERIALVALIDATION.TRANSACTION_LINE_COMPLETED');
								serialValidationDetails['isValid'] = false;
							}
						}
						if(tempFlag)
						{
							var isSerialExistsInInventory = utility.isInventoryNumberExists(itemInternalId, serialName, warehouseLocationId);
							if (isSerialExistsInInventory) {
								serialValidationDetails['errorMessage'] = translator.getTranslationString('TO_SERIALVALIDATION.SERIAL_EXISTS');
								serialValidationDetails['isValid']=false;
							}
							else
							{
								var openTaskSerialArray = [];
								if (systemRuleValue == 'Y') {

									var opentaskSerialSearch = search.load({
										id: 'customsearch_wmsse_opentask_serialsrch',
									});
									var  filtersseropenTask = opentaskSerialSearch.filters;
									filtersseropenTask.push(search.createFilter({
										name: 'custrecord_wmsse_sku',
										operator: search.Operator.ANYOF,
										values: itemInternalId
									}));
									filtersseropenTask.push(search.createFilter({
										name: 'custrecord_wmsse_rec_inb_shipment',
										operator: search.Operator.ISEMPTY

									}));
									opentaskSerialSearch.filters = filtersseropenTask;
									var SrchRecordOpenTaskSerial =utility.getSearchResultInJSON(opentaskSerialSearch);
									if (SrchRecordOpenTaskSerial != null && SrchRecordOpenTaskSerial != '' && SrchRecordOpenTaskSerial.length > 0) {
										for (var p1 = 0; p1 < SrchRecordOpenTaskSerial.length; p1++) {
											var opentaskSerial = SrchRecordOpenTaskSerial[p1]['custrecord_wmsse_serial_no'];
											if (opentaskSerial != null && opentaskSerial != '' &&
													opentaskSerial != 'null' && opentaskSerial != 'undefined') {
												var opentaskSerArray = opentaskSerial.split(',');

												if (opentaskSerArray != null && opentaskSerArray != '' && opentaskSerArray != 'null' && opentaskSerArray != 'undefined') {
													for (var p3 = 0; p3 < opentaskSerArray.length; p3++) {
														var serialNo = opentaskSerArray[p3];
														if (serialNo != null && serialNo != '' && serialNo != 'null' && serialNo != 'undefined') {
															openTaskSerialArray.push(serialNo);
														}
													}
												}


											}
										}
									}

								}
								if (openTaskSerialArray.indexOf(serialName) != -1) {
									serialValidationDetails ['errorMessage'] = translator.getTranslationString('TO_SERIALVALIDATION.SERIAL_EXISTS');
									serialValidationDetails['isValid']=false;
								}
								else
								{
									var serialSearchResults =inboundLib.isSerialAlreadyExistsInWMSSerialEntryCustomRecord(serialName,transactionLineNo,transactionInternalId);

									log.debug('serialSearchResults',serialSearchResults);
									if (serialSearchResults != null && serialSearchResults.length > 0) {

										serialValidationDetails ['errorMessage'] = translator.getTranslationString("TO_SERIALVALIDATION.SERIAL_SCANNED");
										serialValidationDetails['isValid']=false;
									}
									else {


										var IsValidSerailNumber='F';

										var trecord = record.load({
											type : 'transferorder',
											id : transactionInternalId
										});


										var links=trecord.getLineCount({sublistId:'links'});
										if(links!= null  && links != '')
										{  var linkIdArr = [];
											for(var itr = 0; itr < links;itr++)
											{
												var linkid = trecord.getSublistValue({sublistId: 'links',fieldId: 'id',	line: itr});
												linkIdArr.push(linkid);
											}
												var searchResults = inboundUtility.getTrasactionLinkDetails(linkIdArr) ;
												log.debug('searchResults in inv',searchResults);
												
											for(var j=0;j<searchResults.length &&  IsValidSerailNumber=='F';j++)
											{
												var itemFulfillmentId  = searchResults[j]['id'];
												if( searchResults[j].recordtype == 'itemfulfillment')
												{
													var frecord = record.load({
														type : 'itemfulfillment',
														id : itemFulfillmentId,
														isDynamic: true
													});

													var fulfillmentItemCount=frecord.getLineCount({sublistId:'item'});
													log.debug({title:'fulfillmentItemCount',details:fulfillmentItemCount});
													for(var f=0;f<fulfillmentItemCount;f++)
													{
														var fulfillmentItem = frecord.getSublistValue({sublistId:'item',fieldId: 'item',line: f});
														var fulfillmentLineNo = frecord.getSublistValue({sublistId:'item',fieldId: 'orderline',line: f});
														var toFulfillmentLineNo= fulfillmentLineNo-1;
														if(fulfillmentItem==itemInternalId && parseInt(transactionLineNo)==(parseInt(toFulfillmentLineNo)))
														{
															var serialnumbers = frecord.getSublistValue({sublistId:'item',fieldId: 'serialnumbers',line: (parseInt(f))});

															var itemfulfilserialno;
															frecord.selectLine({sublistId:'item',line: f});

															var compSubRecord = frecord.getCurrentSublistSubrecord({
																sublistId: 'item',
																fieldId: 'inventorydetail'
															});
															log.debug({title:'compSubRecord',details:compSubRecord});
															var toLineLength =0;

															if(compSubRecord!=null && compSubRecord!=''&& compSubRecord!='null')
															{
																toLineLength = compSubRecord.getLineCount({
																	sublistId: 'inventoryassignment'
																});
															}
															log.debug({title:'toLineLength',details:toLineLength});
															for(var j1=0;j1<toLineLength ;j1++)
															{
																itemfulfilserialno = compSubRecord.getSublistText({
																	sublistId: 'inventoryassignment',
																	fieldId: 'issueinventorynumber',
																	line: j1
																});
																log.debug({title:'itemfulfilserialno',details:itemfulfilserialno});
																var itemfulfilStatus = compSubRecord.getSublistValue({
																	sublistId: 'inventoryassignment',
																	fieldId: 'inventorystatus',
																	line: j1
																});
																var invStatusFeature = utility.isInvStatusFeatureEnabled();
																if((inventoryStatus == itemfulfilStatus) || (!invStatusFeature))
																{
																	log.debug({title:'itemfulfilStatus',details:itemfulfilStatus});
																	if(itemfulfilserialno!=null && itemfulfilserialno!='')
																	{
																		var tserials=itemfulfilserialno;
																		log.debug({title:'tserials',details:tserials});
																		if(tserials!=null && tserials!='' && tserials.length>0)
																		{
																			log.debug({title:'serialName',details:serialName});
																			if(tserials == serialName)
																			{
																				IsValidSerailNumber='T';
																				break;
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}

										log.debug({title:'IsValidSerailNumber',details:IsValidSerailNumber});
										if(IsValidSerailNumber=='F')
										{
											serialValidationDetails["errorMessage"] = translator.getTranslationString("TO_SERIALVALIDATION.MUST_FULFILLED");
											serialValidationDetails['isValid']=false;
										}
										else
										{
											var createSerialObj = {};
											createSerialObj['serialName'] = serialName;
											createSerialObj['transactionInternalId'] = transactionInternalId;
											createSerialObj['transactionLineNo'] = transactionLineNo;
											createSerialObj['itemInternalId'] = itemInternalId;
											createSerialObj['quantity'] = 1;
											createSerialObj['serialStatus'] = false;
											createSerialObj['taskType'] = 2;

											var serialEntryRecordId = inboundUtility.createRecordInWMSSerialEntryCustomRecord(createSerialObj);

											serialValidationDetails['serialEntryRecordId'] = serialEntryRecordId;
											log.debug({
												title : 'serialEntryRecordId',
												details : serialEntryRecordId
											});
											if(!utility.isValueValid(numberOftimesSerialScanned)){
												numberOftimesSerialScanned = 0;
											}
											var serialSearchResultsCount =inboundLib.isSerialAlreadyExistsInWMSSerialEntryCustomRecord(null,transactionLineNo,transactionInternalId);

											serialValidationDetails["serialno"] = serialName;
											serialValidationDetails["numberOfTimesSerialScanned"] = parseInt(numberOftimesSerialScanned)+1;
											serialValidationDetails['isValid']=true;
											serialValidationDetails["info_receivedQuantity"] = info_receivedQuantity;
											serialValidationDetails["info_remainingQuantity"] = info_remainingQuantity;
											var locationBasedUseBins = utility.getLocationFieldsByLookup(warehouseLocationId, new Array('usesbins'));
											if(!locationBasedUseBins.usesbins && serialSearchResultsCount.length == enteredQtyInEach){
												var useitemcostflag = this.getUseItemCostFlag(transactionInternalId);
												log.audit('useitemcostflag', useitemcostflag);
												var fulfillmentIdArray = inboundUtility.getFulFillmentId(transactionInternalId,itemInternalId,transactionLineNo,null,itemType,invtStatus,invStatusFeature);
												log.audit('fulfillmentIdArray', fulfillmentIdArray);

												var postIrObj = {};
												postIrObj['transactionType']=transactionType;
												postIrObj['poInternalId']=transactionInternalId;
												postIrObj['fetchedItemId']=itemInternalId;
												postIrObj['poLineno']=transactionLineNo;
												postIrObj['enterQty']=scannedQuantity;
												postIrObj['itemType']=itemType;
												postIrObj['whLocation']=warehouseLocationId;
												postIrObj['tranid']=transactionName;
												postIrObj['actualBeginTime']=actualBeginTime;
												postIrObj['customer']=customer;
												postIrObj['uom']=uom;
												postIrObj['conversionRate']=conversionRate;
												postIrObj['useitemcostflag']=useitemcostflag;
												postIrObj['systemRuleValue']=systemRuleValue;
												postIrObj['invtStatus']=invtStatus;
												postIrObj['fifoDate']=null;
												postIrObj['PutStrategy']=null;
												postIrObj['zoneno']=null;
												postIrObj['TOLineDetails']=fulfillmentIdArray;
												log.debug({title:'postIrObj',details:postIrObj});
												var itemReceipt= inboundLib.postItemReceipt(postIrObj);
												log.debug({title:'itemReceipt',details:itemReceipt});

												if(utility.isValueValid(info_receivedQuantity) && utility.isValueValid(info_remainingQuantity)){
													if(utility.isValueValid(uom)){
														var index = info_receivedQuantity.indexOf(' ');
														info_receivedQuantity = parseFloat(info_receivedQuantity.toString().substring(0,index == -1 ? 1 : index)) + parseFloat(scannedQuantity);
														index = info_remainingQuantity.indexOf(' ');
														info_remainingQuantity = parseFloat(info_remainingQuantity.toString().substring(0,index == -1 ? 1 : index)) - parseFloat(scannedQuantity);

														info_receivedQuantity = info_receivedQuantity == 0 ? '0' : info_receivedQuantity + ' ' + uom;
														info_remainingQuantity = info_remainingQuantity == 0 ? '0' : info_remainingQuantity + ' ' + uom;
													}else{
														info_receivedQuantity = parseFloat(info_receivedQuantity) + parseFloat(scannedQuantity);
														info_remainingQuantity = parseFloat(info_remainingQuantity) - parseFloat(scannedQuantity);
													}
												}

												if(utility.isValueValid(itemReceipt))
												{
													var	poLineDetails = inboundUtility.getRecevingOrderItemDetails(transactionName,null,warehouseLocationId,null,transactionInternalId,'',transactionType);
													log.debug({title:'poLineDetails new',details:poLineDetails});
													if(poLineDetails !=null && poLineDetails.length > 0)
													{
														var poId = poLineDetails[0]['internalid'];
														var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(poId,warehouseLocationId);
														var vCount=0;
														var vPoReminqty =0;
														var poLineReceivedQty =0;
														var poLineRemainingQty = 0;
														for(var cnt in poLineDetails)
														{
															var poLineArr = poLineDetails[cnt];
															var poLine = poLineArr['line'];
															if(JSON.stringify(openPutAwayDetails) !== '{}')
															{
																var vpoitemOPentaskRcvQty = openPutAwayDetails[poLine];
																if(utility.isValueValid(vpoitemOPentaskRcvQty))
																{
																	poLineReceivedQty = poLineArr['totalReceivedQty'];
																	poLineRemainingQty = poLineArr['TransferOrderLine_Remainingqty'];
																	poLineArr['totalReceivedQty'] =Number(Big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));
																	poLineArr['TransferOrderLine_Remainingqty'] =Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
																}
															}
															vPoReminqty = poLineArr['TransferOrderLine_Remainingqty'];

															if(parseFloat(vPoReminqty) > 0)
															{
																vCount++;
																break;
															}

														}
														if(parseFloat(vCount) > 0)
														{
															serialValidationDetails['isValid'] = true;
															serialValidationDetails["custparam_count"]=vCount;
															serialValidationDetails["systemRuleValue"]=systemRuleValue;

														}
														else
														{
															serialValidationDetails['isValid'] = true;
															serialValidationDetails["custparam_count"]=0;
															serialValidationDetails["systemRuleValue"]=systemRuleValue;
														}
														//serialValidationDetails['impactedRecords'] = impactedRecords;
													}
													else
													{
														serialValidationDetails['isValid'] = true;
														serialValidationDetails["custparam_count"]=0;
														serialValidationDetails["systemRuleValue"]=systemRuleValue;
														//serialValidationDetails['impactedRecords'] = impactedRecords;
													}

												}

 												// No Code Solution Changes begin here                                                 
                                                 impactedRecords = inboundUtility.noCodeSolForReceiving(transactionInternalId, transactionLineNo, itemReceipt, transactionType,'',locationBasedUseBins.usesbins);
                                                 log.debug({title:'impactedRecords :', details: impactedRecords });
                                                // serialValidationDetails.impactedRecords = impactedRecords;
                                                 //No Code Solution ends here.
											}
										}
										}
									}
								}
							}
							serialValidationDetails.impactedRecords = impactedRecords;
						}
					}
				}
				else
				{
					serialValidationDetails["errorMessage"] = translator.getTranslationString("TO_SERIALVALIDATION.VALID_SERIAL");
					serialValidationDetails['isValid']=false;
				}
			}
			else
			{
				serialValidationDetails["errorMessage"] = translator.getTranslationString("TO_SERIALVALIDATION.VALID_INPUT");
				serialValidationDetails['isValid']=false;
			}
		}
		catch(e)
		{
			serialValidationDetails['isValid'] = false;
			serialValidationDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return serialValidationDetails;
	}

	function getUseItemCostFlag(transactionInternalId) {
		var itemcostruleValue = inboundUtility.getItemCostRuleValue();

		var useitemcostSearch = search.load({
			id: 'customsearch_wmsse_useitemcostpreference',
		});
		var useitemcostFilters = useitemcostSearch.filters;

		useitemcostFilters.push(search.createFilter({
			name: 'internalid',
			operator: search.Operator.IS,
			values: transactionInternalId
		}));

		useitemcostSearch.filters = useitemcostFilters;
		var transferordervalues = utility.getSearchResultInJSON(useitemcostSearch);

		if (transferordervalues.length > 0) {
			useitemcostflag = transferordervalues[0]['istransferpricecosting'];
		}

		if (!(utility.isValueValid(useitemcostflag)) && useitemcostflag != false && useitemcostflag != true && useitemcostflag != 'false' && useitemcostflag != 'true') {
			useitemcostflag = itemcostruleValue;
		}
		return useitemcostflag;
	}


	return {
		'post': doPost,
		getUseItemCostFlag : getUseItemCostFlag
	};
});
