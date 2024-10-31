/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search', 'N/redirect','./wms_utility','./big','./wms_translator', './wms_inboundUtility','./wms_inbound_utility'],

		function (record, runtime, search, redirect,utility,Big,translator, inboundUtility,inboundLib) {

	/**
	 * This function is to validate the entered/scanned order
	 */
	function doPost(requestBody) {
		var orderValidationDetails = {};
		var wareHouseLocation = '';
		var transactionType ='';
		var getTranid = '';
		var orderInternalId ='';
		var debugString = '';
		var processType ='';
		var action = '';
		var warehouseLocationName='';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				debugString = debugString + ",requestParams :"+requestParams;
				wareHouseLocation= requestParams.warehouseLocationId;
				transactionType = requestParams.transactionType;
				getTranid = requestParams.transactionName;

				var parsedData = JSON.parse(getTranid);

				// Extract PO# and item ID
				getTranid = parsedData.poNumber;

				orderInternalId =  requestParams.transactionInternalId;
				processType = requestParams.processType;
				action = requestParams.action;
				warehouseLocationName=requestParams.warehouseLocationName;
                if(utility.isValueValid(transactionType) && transactionType == 'returnauthorization') {
                    var restockEnabled = utility.getSystemRuleValueWithProcessType(translator.getTranslationString('wms_SystemRules.RESTOCK'), wareHouseLocation, transactionType);
                    if(restockEnabled == 'Y') {
                        orderValidationDetails.restockEnabled = true;
                        var restockPreference = runtime.getCurrentUser().getPreference('RESTOCKRETURNS');
                        if(restockPreference == true) {
                            orderValidationDetails.defaultRestockValue = 'YES';
                        } else {
                            orderValidationDetails.defaultRestockValue = 'NO';
                        }
                    }
                }
				var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
                var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
				orderValidationDetails['itemScanned']="F";
				if((utility.isValueValid(orderInternalId) &&  utility.isValueValid(wareHouseLocation))||(utility.isValueValid(getTranid) &&  utility.isValueValid(wareHouseLocation)))
				{
					var itemResults = [];
					var cols  = [];
					if(transactionType != 'purchaseorder')
					{

						cols.push(search.createColumn({
							name: 'tranid',
							summary:'group'
						}));
						cols.push(search.createColumn({
							name: 'entityid',
							join:'vendor',
							summary: 'group'
						}));
						cols.push(search.createColumn({
							name: 'entity',
							summary: 'group'
						}));
						cols.push(search.createColumn({
							name: 'trandate',
							summary:'group'
						}));
					}

					var orderListJsonObj = inboundLib.getRecevingOrderDetails(getTranid,null, wareHouseLocation, null,orderInternalId,cols,transactionType,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName);
					debugString = debugString + ",orderListJsonObj :"+orderListJsonObj;
					log.debug('orderListJsonObj',orderListJsonObj);
					if (orderListJsonObj.length > 0) {
						var vCount = 0;
						var isValidLocation = true;
						var orderLineReceivedQty =0;
						var Location="";
						var orderObj = {};
						var openPutAwayDetails = {};
						var counter = 0;

						for (var i in orderListJsonObj) {

							orderObj = orderListJsonObj[i];
							if(transactionType=='transferorder')
								Location = orderObj['transferlocation'];
														else
														{
								if(crossSubsidiaryFeature == true && transactionType=='returnauthorization')
								{
									Location = orderObj['inventorylocation'];
								}
								else
								{
									if(centralizesPurchasingandBilling == true)
									{
										Location = orderObj['targetlocation'];
										if(!utility.isValueValid(Location))
										{
											Location = orderObj['location'];
										}
									}
									else {
										Location = orderObj['location'];
									}

								}
							}
							if (!utility.isValueValid(Location)) {
								isValidLocation = false;

								if(transactionType=='transferorder')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.WAREHOUSE_NOT_CONFIGURED');
								else if(transactionType=='returnauthorization')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.WAREHOUSE_NOT_CONFIGURED');
								else
									orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.WAREHOUSE_NOT_CONFIGURED');
								orderValidationDetails['isValid'] = false ;
								break;
							}
							else
							{

								var orderId = "";
								if(transactionType=='purchaseorder'){
									orderId = orderObj['id'];
								}else{
									orderId = orderObj['internalid'];
								}

								if(transactionType=='purchaseorder') {
									if (counter == 0) {
										 openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetailsPO(orderId, Location);
									    }
									}
								else {
										openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(orderId, Location);
								}
								counter += 1;
								//log.debug('openPutAwayDetails',openPutAwayDetails);
								if(JSON.stringify(openPutAwayDetails) !== '{}')
								{
									var lineItemOpentaskRcvQty = openPutAwayDetails[orderObj['line']];
									//debugString = debugString + ",lineItemOpentaskRcvQty :"+lineItemOpentaskRcvQty;
                                   // log.debug('lineItemOpentaskRcvQty',lineItemOpentaskRcvQty);
									if(utility.isValueValid(lineItemOpentaskRcvQty))
									{
										orderLineReceivedQty = orderObj['totalReceivedQty'];
										if(transactionType=='transferorder')
										{
											orderLineReceivedQty = orderObj['TransferOrderLine_Remainingqty'];
										}
										else
										{
											if(transactionType=="returnauthorization")
											{
												orderLineReceivedQty = orderObj['rmaRemainingQty'];
											}
											else
											{
												orderLineReceivedQty =orderObj['quantityuom'];
											}
										}
																				//log.debug('orderLineReceivedQty',orderLineReceivedQty);
																			//	log.debug('lineItemOpentaskRcvQty',lineItemOpentaskRcvQty);
										orderObj['totalReceivedQty'] =Number(Big(orderLineReceivedQty).plus(lineItemOpentaskRcvQty));
										orderObj['poRemainingQty'] =Number(Big(orderLineReceivedQty).minus(lineItemOpentaskRcvQty));
										orderObj['TransferOrderLine_Remainingqty'] =Number(Big(orderLineReceivedQty).minus(lineItemOpentaskRcvQty));
										orderObj['rmaRemainingQty'] =Number(Big(orderLineReceivedQty).minus(lineItemOpentaskRcvQty));
									}
								}
								var orderRemainQty=0;
								if(transactionType=='transferorder')
								{
									orderRemainQty = orderObj['TransferOrderLine_Remainingqty'];

								}
								else
								{

									if(transactionType=="returnauthorization")
									{
										orderRemainQty = orderObj['rmaRemainingQty'];
									}
									else
									{
										if(utility.isValueValid(lineItemOpentaskRcvQty)) {
											orderRemainQty = orderObj['poRemainingQty'];
										} else {
											orderRemainQty = orderObj['quantityuom'];
										}
                                        if(utility.isValueValid(orderObj['quantityonshipments'])) {
                                            orderRemainQty = Number(Big(orderRemainQty).minus(orderObj['quantityonshipments']));
                                        }
									}
								}
															//	log.debug('orderRemainQty',orderRemainQty);
								//debugString = debugString + ",orderRemainQty :"+orderRemainQty;
								if ((parseFloat(orderRemainQty) > 0) || (processType =="PostItemReceipt")){
									vCount = 1;
									orderValidationDetails["custparam_poid"] = orderObj['tranid'];
									orderValidationDetails["custparam_company"] = orderObj['custbody_nswms_company'];
									orderValidationDetails["custparam_vendor"] = orderObj['entityid'];
									orderValidationDetails["custparam_vendorid"] = orderObj['Internal ID'];
									orderValidationDetails["custparam_linecount"] = orderListJsonObj.length;
									orderValidationDetails["custparam_specord"] = orderObj['appliedtolinktype'];
									orderValidationDetails["transactionInternalId"] = orderId;
									orderValidationDetails["transactionType"] = transactionType;
									orderValidationDetails["custparam_potrandate"] = orderObj['trandate'];
									break;
								}
							}
						}
						if(isValidLocation == true)
						{
							if (parseFloat(vCount) > 0) {

								orderValidationDetails["vCount"] = vCount;
								orderValidationDetails['isValid'] = true ;
							}
							else {

								if(transactionType=='transferorder')
                                {
                                    orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.ORDER_RECEIVED');
                                }

								else if(transactionType=='returnauthorization')
                                {
                                    orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.ORDER_RECEIVED');
                                }

								else
                                {
									var ISMStatusFeature = inboundUtility.isISMFeatureEnabled();
									if (ISMStatusFeature) {
										var ismRemSearch = inboundUtility.ismTotalquantity(orderListJsonObj[0]['internalid'], wareHouseLocation);
									}
									if(ISMStatusFeature && ismRemSearch.length > 0 && ismRemSearch[0].quantityremaining > 0)
									{
										orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMS') + ' '+orderObj['tranid']+ ' ' + translator.getTranslationString('PO_VALIDATION.ISM_RECEIVED_WMSITEMS');
									}
									else if(transactionType=='purchaseorder' && orderRemainQty==0 )
									{
										orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED');
									}
									else
									{

										orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMS') + ' '+orderObj['tranid']+ ' ' + translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMSITEMS')+' '+translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMSMESSAGE');
									}

								}

								orderValidationDetails['isValid'] = false ;
							}
						}
					}
					else {
						var recordType=record.Type.PURCHASE_ORDER;

						if(transactionType=='transferorder')
							recordType=record.Type.TRANSFER_ORDER;
						else if(transactionType=='returnauthorization')
							recordType=record.Type.RETURN_AUTHORIZATION;

						//debugString = debugString + ",recordType :"+recordType;


						if(centralizesPurchasingandBilling == true) {
							var orderTransactionTypeFilters = [
							search.createFilter({
								name: 'tranid',
								operator: search.Operator.IS,
								values: getTranid
							}),

								search.createFilter({
									name: 'mainline',
									operator: search.Operator.IS,
									values: false
								})
								];
						}
						else {
							var orderTransactionTypeFilters = [
							search.createFilter({
								name: 'tranid',
								operator: search.Operator.IS,
								values: getTranid
							}),

								search.createFilter({
									name: 'mainline',
									operator: search.Operator.IS,
									values: true
								})
							];
						}

						if (utility.isValueValid(wareHouseLocation)) {

							if(transactionType=='transferorder')
							{
								orderTransactionTypeFilters.push(search.createFilter({
									name: 'transferlocation',
									operator: search.Operator.ANYOF,
									values:  ['@NONE@', wareHouseLocation]
								}));
							}
							else
							{
								if(centralizesPurchasingandBilling == true && utility.isValueValid(warehouseLocationName))
								{
									orderTransactionTypeFilters.push(search.createFilter({
										name: 'formulatext',
										operator: search.Operator.IS,
										formula: "CASE WHEN {targetlocation} IS NULL THEN {location} ELSE{targetlocation} END",
										values: warehouseLocationName
									}));


								}
								else
								{
									orderTransactionTypeFilters.push(search.createFilter({
										name: 'location',
										operator: search.Operator.ANYOF,
										values:  ['@NONE@', wareHouseLocation]
									}));
								}

							}
						}

						var orderTransactionTypeColumns = [
							search.createColumn({ name: 'internalid' }),
							search.createColumn({ name: 'tranid' }),
							search.createColumn({ name: 'status' }),
							search.createColumn({ name: 'trandate' })
							];

						var	orderRecordsSearch= search.create({

							type:recordType,
							filters: orderTransactionTypeFilters,
							columns: orderTransactionTypeColumns
						});

						var orderRecordsResult = orderRecordsSearch.run().getRange({
							start: 0,
							end: 1
						});
						debugString = debugString + ",orderRecordsResult :"+orderRecordsResult;

						//log.debug('orderRecordsResult',orderRecordsResult);
						if (orderRecordsResult != null && orderRecordsResult != '') {
							orderValidationDetails["custparam_poid"] = orderRecordsResult[0].getValue({
								name: 'tranid'
							});
							orderValidationDetails["custparam_potrandate"] = orderRecordsResult[0].getValue({
								name: 'trandate'
							});
							orderValidationDetails["custparam_transactionType"] = transactionType;
							var orderStatus = orderRecordsResult[0].getValue({ name :'status'});
							//debugString = debugString + ",orderStatus :"+orderStatus;

							if (orderStatus == 'pendingapproval' || orderStatus == 'pendingSupApproval') {

								if(transactionType=='transferorder')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.ORDER_NOT_APPROVED');
								else if(transactionType=='returnauthorization')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.ORDER_NOT_APPROVED');
								else 
									orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_NOT_APPROVED');

								orderValidationDetails['isValid'] = false ;
							}
							else if (orderStatus == 'closed') {

								if(transactionType=='transferorder')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.ORDER_CLOSED');
								else if(transactionType=='returnauthorization')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.ORDER_CLOSED');
								else
									orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_CLOSED');

								orderValidationDetails['isValid'] = false ;
							}
							else if (orderStatus == 'pendingFulfillment') {

								if(transactionType=='transferorder')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.INVALID_TO');
								else if(transactionType=='returnauthorization')
									orderValidationDetails['errorMessage'] =translator.getTranslationString('RMA_VALIDATION.INVALID_PO');
								else
									orderValidationDetails['errorMessage'] =translator.getTranslationString('PO_VALIDATION.INVALID_PO');
								orderValidationDetails['isValid'] = false ;
							}

							else if (orderStatus == 'pendingbilling' || orderStatus == 'pendingBilling') {

								if(transactionType=='transferorder')
									orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.ORDER_RECEIVED');
								else
									orderValidationDetails['errorMessage'] =translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED');						

								orderValidationDetails['isValid'] = false ;
							}
							else {
								var spefilters = [
									search.createFilter({
										name: 'tranid',
										operator: search.Operator.IS,
										values: getTranid
									}),
									search.createFilter({
										name: 'mainline',
										operator: search.Operator.IS,
										values: false
									})
									];
								var specolumns = [
									search.createColumn({ name: 'appliedtolinktype' })
									];
								var	orderRecordsSearch = search.create({
									type: recordType,
									filters: spefilters,
									columns: specolumns
								});

								var posearch = orderRecordsSearch.run().getRange({
									start: 0,
									end: 100
								});
								if (posearch != null && posearch != '') {
									var vSpecialOrder = posearch[0].getValue({ name : 'appliedtolinktype'});
									if (vSpecialOrder != null && vSpecialOrder != '' && vSpecialOrder == 'DropShip') {

										orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.DROPSHIPPO');
										orderValidationDetails['isValid'] = false ;
									}
									else
									{
										if(transactionType=='transferorder')
										{
											orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.ORDER_RECEIVED');
										}
										else if(transactionType=='returnauthorization')
										{
											orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.ORDER_RECEIVED');
										}
										else
										{
											log.debug('test2','test2');
											orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMS') + ' '+getTranid+ translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMSITEMS')+' '+translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMSMESSAGE')
										}

										orderValidationDetails['isValid'] = false ;
									}
								}
								else
								{
									if(transactionType=='transferorder')
									{
										orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.ORDER_RECEIVED');
									}
									else if(transactionType=='returnauthorization')
									{
										orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.ORDER_RECEIVED');
									}
									else
									{
										log.debug('test3','test3');
										orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMS') + ' '+getTranid+ translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMSITEMS')+' '+translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMSMESSAGE')
										//orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.ORDER_RECEIVED_WMS');
									}
									orderValidationDetails['isValid'] = false ;
								}
							}

						}
						else 
							if(((transactionType == 'purchaseorder') || (transactionType == 'transferorder')) && action == 'itemorpoEntered'){
								var currItem = utility.itemValidationForInventoryAndOutBound(getTranid,wareHouseLocation);
								log.debug('currItem',currItem);

								if(utility.isValueValid(currItem['itemInternalId']) || utility.isValueValid(currItem['barcodeIteminternalid']))
								{
									var itemInternalid='';
									if(utility.isValueValid(currItem['isbarcodescanned']) && currItem['isbarcodescanned']== true)
									{
										itemInternalid = currItem['barcodeIteminternalid'];
										if(utility.isValueValid(itemInternalid))
											getTranid = currItem['barcodeItemname'];
                                        if(utility.isValueValid(currItem['barcodeVendor']))
                                            var vendorName = currItem['barcodeVendor'];
                                        if(utility.isValueValid(currItem['barcodeVendorId']))
                                            var vendorId = currItem['barcodeVendorId'];
									}else{
										itemInternalid = currItem['itemInternalId'];
										if(utility.isValueValid(itemInternalid))
											getTranid = currItem['itemName'];
									}
								}
								itemResults = inboundUtility.getItemList(getTranid, wareHouseLocation);
							}

						if(itemResults.length != 0 && itemResults[0]['isinactive']){
							orderValidationDetails['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INACTIVE_ITEM');
							orderValidationDetails['isValid']=false;
						}else if(itemResults.length != 0){
							orderValidationDetails['itemList'] = itemResults;
							orderValidationDetails['itemInternalId'] = itemResults[0]['internalid'];
							orderValidationDetails['itemName'] = itemResults[0]['itemid'];
                            if(utility.isValueValid(vendorName))
                                orderValidationDetails['vendorName'] = vendorName;
                            if(utility.isValueValid(vendorId))
                                orderValidationDetails['vendorId'] = vendorId;
							orderValidationDetails['itemScanned'] = "T"; 
							orderValidationDetails['isValid']=true;
						}

						else if(orderValidationDetails['errorMessage'] ==null ||
								orderValidationDetails['errorMessage']== undefined ) {

							if(transactionType=='transferorder')
							{
								orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.INVALID_TO');
							}
							else if(transactionType=='returnauthorization')
							{
								orderValidationDetails['errorMessage'] = translator.getTranslationString('RMA_VALIDATION.INVALID_PO');
							}
							else
							{
								orderValidationDetails['errorMessage'] = translator.getTranslationString('PO_VALIDATION.INVALID_PO');
							}
							orderValidationDetails['isValid'] = false ;
						}
					}


				}
				else
				{
					if(transactionType=='transferorder')
					{
						orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.EMPTYINPUT');
					}
					else if(transactionType=='returnauthorization')
					{
						orderValidationDetails['errorMessage'] =translator.getTranslationString('RMA_VALIDATION.EMPTYINPUT');
					}
					else
					{
						orderValidationDetails['errorMessage'] =translator.getTranslationString('PO_VALIDATION.EMPTYINPUT');
					}
					orderValidationDetails['isValid'] = false ;
				}
			}
			else
			{
				if(transactionType=='transferorder')
				{
					orderValidationDetails['errorMessage'] = translator.getTranslationString('TO_VALIDATION.EMPTYINPUT');
				}
				else if(transactionType=='returnauthorization')
				{
					orderValidationDetails['errorMessage'] =translator.getTranslationString('RMA_VALIDATION.EMPTYINPUT');
				}
				else
				{
					orderValidationDetails['errorMessage'] =translator.getTranslationString('PO_VALIDATION.EMPTYINPUT');
				}
				orderValidationDetails['isValid'] = false ;
			}

		}
		catch(e)
		{
			orderValidationDetails['isValid'] = false;
			orderValidationDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return orderValidationDetails;

	}

	return {
		'post': doPost
	};
});
