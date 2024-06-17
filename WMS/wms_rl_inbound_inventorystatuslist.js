/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','N/record','N/search','./big','./wms_translator', './wms_inboundUtility'],

		function (utility,record,search,Big,translator, inboundUtility) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	var invStatusListResponseParm = {}; 
	function doPost(requestBody) {

		var trantype ='';
		var getordLineNo ='';
		var getItemInternalId ='';
		var whLocation ='';
		var itemType ='';
		var lot ='';
		var uom ='';
		var debugString = '';
		try{

			if (utility.isValueValid(requestBody)) 
			{
                var requestParams = requestBody.params;
				var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
			    debugString = debugString + ",requestParams :"+requestParams;
				var trantype = requestParams.transactionType;//requestParams.
				var transactionInternalId = requestParams.transactionInternalId;
				var getordLineNo = requestParams.transactionLineNo;
				var getItemInternalId = requestParams.itemInternalId;
				var whLocation = requestParams.warehouseLocationId;
				var itemType = requestParams.itemType;
				var lot = requestParams.lotName;
				var transactionUomName = requestParams.transactionUomName;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var selectedInventoryStatus = requestParams.defaultInventoryStatus;
				var selectedInventoryStatusId = requestParams.defaultInventoryStatusID;
        var processType = requestParams.processType;
				var putawayAll = requestParams.putawayAll;
				var actionbutton = requestParams.actionbutton;
				if(!utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(transactionUomName))
				{
					var itemLookUp = search.lookupFields({
						type: search.Type.ITEM,
						id: getItemInternalId,
						columns: ['unitstype']

					});
					
					if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined)
					{
						unitType = itemLookUp.unitstype[0].value;

						var uomValue = '';
						var uomConversionRate = '';
						var uomRecord = record.load({
							type: record.Type.UNITS_TYPE,
							id: unitType
						});


						var sublistCount = uomRecord.getLineCount({
							sublistId: 'uom'
						});
						for (var i = 0; i < sublistCount; i++) {
							var unitName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'unitname',
								line: i
							});
							var pluralName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'pluralname',
								line: i
							});
							if(transactionUomName.toUpperCase() == unitName.toUpperCase() ||
									transactionUomName.toUpperCase() == pluralName.toUpperCase())
							{

								uomValue = uomRecord.getSublistValue({
									sublistId: 'uom',
									fieldId: 'internalid',
									line: i
								});
								uomConversionRate = uomRecord.getSublistValue({
									sublistId: 'uom',
									fieldId: 'conversionrate',
									line: i
								});
								break;
							}
						}

						if(uomValue != '')
						{
							transactionUomConversionRate = uomConversionRate;
						}
					}
				}

				if(trantype == 'transferorder')
				{
					if (utility.isValueValid(trantype) && utility.isValueValid(transactionInternalId) && utility.isValueValid(getordLineNo)
							&& utility.isValueValid(getItemInternalId) && utility.isValueValid(whLocation) && utility.isValueValid(itemType))
					{
						
						
							var inventoryStatusLst = getOrdinvStatusList(trantype,transactionInternalId,getordLineNo,getItemInternalId,whLocation,
									itemType,lot,uom,inventoryStatusFeature,transactionUomName,transactionUomConversionRate,selectedInventoryStatus);

							if (inventoryStatusLst != null && inventoryStatusLst.length > 0) 
							{
								debugString = debugString + ",invStatusListResponseParm :"+invStatusListResponseParm;
								debugString = debugString + ",requestParams :"+requestParams;
								invStatusListResponseParm['inventoryStatusLst']=inventoryStatusLst;
								invStatusListResponseParm['isValid']=true;

							}
							else
							{
								invStatusListResponseParm['errorMessage'] =translator.getTranslationString('TO_INVENTORYSTATUSLIST.INVALID_TODETAILS');//"Invalid Inputs.",if needed change the message
								invStatusListResponseParm['isValid'] = false;
							}
						


					}
					else
					{
						log.debug({title:'else',details:'no data in few mandatory fields'});
						debugString = debugString + ",else :no data in few mandatory fields";
						invStatusListResponseParm['errorMessage'] = translator.getTranslationString('TO_INVENTORYSTATUSLIST.EMPTYINPUT');//change/check appropriate the message
						invStatusListResponseParm['isValid'] = false;
					}
				}
				else {
					if (processType == "BinTransfer" && putawayAll == "putawayAll") {
						invStatusListResponseParm['isStatusChangeFlag'] = false;
						var toStatusName = requestParams.toStatusName;
						if(utility.isValueValid(toStatusName)){						
						invStatusListResponseParm['toStatusName'] = toStatusName;
						invStatusListResponseParm['isStatusChangeFlag'] = true;
						}
						if(utility.isValueValid(actionbutton)){
						invStatusListResponseParm['actionbutton'] = actionbutton;
						}
						invStatusListResponseParm['isValid'] = true;
					}
					else {
						var vSpecOrder = requestParams.specOrderFlag;

						var inventoryStatusLst = inboundUtility.getDefaultInventoryStatusList('', -1, vSpecOrder);
						if (inventoryStatusLst.length > 0) {

							if (utility.isValueValid(selectedInventoryStatus)) {
								invStatusListResponseParm['defaultInventoryStatus'] = selectedInventoryStatus;
								if (utility.isValueValid(selectedInventoryStatus)) {
									invStatusListResponseParm['defaultInventoryStatusID'] = selectedInventoryStatusId;
								}
							} else {
								invStatusListResponseParm['defaultInventoryStatus'] = inventoryStatusLst[0].name;
							
						}
					}
					
					invStatusListResponseParm['inventoryStatusLst'] = inventoryStatusLst;
					invStatusListResponseParm['isValid'] = true;
				}
				}

			}
			else
			{
				debugString = debugString + ",else :no data in few mandatory fields";
				invStatusListResponseParm['errorMessage'] = translator.getTranslationString('TO_INVENTORYSTATUSLIST.EMPTYINPUT');//change/check appropriate the message
				invStatusListResponseParm['isValid'] = false;
			}
			log.debug({title:'invStatusListResponseParm final',details:invStatusListResponseParm});
			debugString = debugString + ",invStatusListResponseParm"+invStatusListResponseParm;
		}
		catch(e)
		{
			invStatusListResponseParm['isValid'] = false;
			invStatusListResponseParm['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return invStatusListResponseParm;
	}
//	REGARDING PERFORMANCE TESTING ,CAN IT BE A LOADRECORD OR SHOULD WE CHANGE IT TO LOAD SEARCH
	function getOrdinvStatusList(trantype,transactionInternalId,getordLineNo,getItemInternalId,whLocation,itemType,lot,uom,
			inventoryStatusFeature,transactionUomName,transactionUomConversionRate,selectedInventoryStatus)
	{
		var transOrdStatusArray = [];
		var lotstatuslistArray = [];
		var statusArray = [];
		var statusQtyArray =[];
		var lotstatuslistobject = {};
		var orderListJsonObj = record.load({
			type : 'transferorder',
			id : transactionInternalId
		});

		var ordersList = [];
		if (orderListJsonObj != null) {
			var trnid = orderListJsonObj.getValue({fieldId: 'tranid'});
			var links = orderListJsonObj.getLineCount({
				sublistId: 'links'
			});
			var defaultStatusName = '';
			var resultsArray=[];
			var linkIdArr = [];
			if(links!=null  && links!='')
			{  
				for(var itr = 0; itr < links;itr++)
			{
				var linkid = orderListJsonObj.getSublistValue({sublistId: 'links',fieldId: 'id',	line: itr});
				linkIdArr.push(linkid);
			}
				var searchResults = inboundUtility.getTrasactionLinkDetailsforTO(linkIdArr,getItemInternalId) ;
				log.debug('searchResults in inv',searchResults);
				for(var linkitr = 0; linkitr < searchResults.length ;linkitr++)
				{ 	var itemFulfillmentId  = searchResults[linkitr].internalid;
				   if(  searchResults[linkitr].recordtype == 'itemfulfillment')
				  {
						var frecord = record.load({
							type : 'itemfulfillment',
							id : itemFulfillmentId,
							isDynamic: true
						});

						var fitemcount = frecord.getLineCount({
							sublistId: 'item'
						});

						var ifFulFillStatus = frecord.getValue({fieldId: 'statusRef'});
						log.debug({title:'ifFulFillStatus',details:ifFulFillStatus});
						
						
						
						if(ifFulFillStatus == 'shipped')
						{
							for(var Ifitr=0;Ifitr<fitemcount;Ifitr++)
							{
								var fromStatusInternalId = '';
								var fromStatusName = '';
								var quantity = 0;
								var actQty = 0;
								var vtoStatusitemQtyforserial = 0;
								var fitem = frecord.getSublistValue({sublistId: 'item',fieldId: 'item',	line: Ifitr});
								var fline = frecord.getSublistValue({sublistId: 'item',fieldId: 'orderline',line:Ifitr});
								var pofline= parseInt(fline) + 1;
								if((fitem == getItemInternalId) && (parseInt(getordLineNo) == (parseInt(pofline)-2)))
								{
									frecord.selectLine({
										sublistId: 'item',
										line: Ifitr
									});

								var compSubRecord = null;
								try{
									compSubRecord =	frecord.getCurrentSublistSubrecord({								
									sublistId: 'item',
									fieldId: 'inventorydetail'
								});
								}
								catch(e){
									compSubRecord = null;
								}
								var ordlinelength =0;
								if(compSubRecord!=null && compSubRecord!=''&& compSubRecord!=undefined)
								{
									ordlinelength = compSubRecord.getLineCount({
										sublistId: 'inventoryassignment'
									});
								}

								if(itemType == "inventoryitem" || itemType == "assemblyitem")
								{
									for(var cnt=0;cnt<ordlinelength;cnt++)
									{

										compSubRecord.selectLine({
											sublistId: 'inventoryassignment',
											line: cnt
										});

										var vtoStatusitemQty = compSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'quantity',	line: cnt});
										if(inventoryStatusFeature)
										{
											fromStatusInternalId = compSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'inventorystatus',	line: cnt});
											fromStatusName = compSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'inventorystatus',	line: cnt});

										}

										if(vtoStatusitemQty == '' || vtoStatusitemQty == null || vtoStatusitemQty == undefined || isNaN(vtoStatusitemQty))
											vtoStatusitemQty = 0;
										quantity = vtoStatusitemQty;

										if(parseFloat(quantity) > 0)
										{
											if(statusArray.indexOf(fromStatusInternalId) == -1)
											{
												var quantitywithUOMText = quantity +" "+transactionUomName;
												var tranCurRow =  {'fromStatusInternalId':fromStatusInternalId,'fromStatusName':fromStatusName,
														'quantitywithUOMText':quantitywithUOMText,'quantity':quantity};
												transOrdStatusArray.push(tranCurRow);
												statusArray.push(fromStatusInternalId);
												statusQtyArray.push(quantity);
											}
											else
											{
												var statusIndex = statusArray.indexOf(fromStatusInternalId);
												var previousQuantity = statusQtyArray[statusIndex];
												var totalQty =  Number(Big(quantity).plus(previousQuantity));
												statusQtyArray[statusIndex] = totalQty;

												for(var ind= 0 ;ind < transOrdStatusArray.length; ind++)
												{
													var statusId = transOrdStatusArray[ind]['fromStatusInternalId'];

													if(statusId == fromStatusInternalId)
													{
														transOrdStatusArray[ind]['quantitywithUOMText']  = totalQty +" "+ transactionUomName;
														transOrdStatusArray[ind]['quantity']  = totalQty;
													}
												}

											}

										}
									}
								}
								else if( itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" || 
										itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")
								{
									for(var cnt=0;cnt<ordlinelength ;cnt++)
									{

										var vtoStatusitemQty = compSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'quantity',	line: cnt});
										if(inventoryStatusFeature)
										{
											fromStatusInternalId = compSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'inventorystatus',	line: cnt});
											fromStatusName = compSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'inventorystatus',	line: cnt});
											log.debug({title:'fromStatusInternalId',details:fromStatusInternalId});
										}
										var lotOrSerialInternalId = compSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'issueinventorynumber',	line: cnt});
										var lotOrSerialName = compSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'issueinventorynumber',	line: cnt});

										if((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem") &&
												lotOrSerialName == lot)
										{
											log.debug({title:'getordLineNo',details:getordLineNo});

											if(vtoStatusitemQty == '' || vtoStatusitemQty == null || vtoStatusitemQty == undefined || isNaN(vtoStatusitemQty))
												vtoStatusitemQty = 0;

											quantity = vtoStatusitemQty;
											var quantitywithUOMText = quantity +" "+transactionUomName;//from where stockText should be fetched for time being now it is harcoded to Ea

											log.debug({title:'quantity',details:quantity});

											if(parseFloat(quantity) > 0 ) 
											{
												if(statusArray.indexOf(fromStatusInternalId) == -1)
												{
													var tranCurRow = {'fromStatusInternalId':fromStatusInternalId,'fromStatusName':fromStatusName,'quantity':quantity,
															'quantitywithUOMText':quantitywithUOMText,'lotOrSerialInternalId':lotOrSerialInternalId,
															'lotOrSerialName':lotOrSerialName};
													transOrdStatusArray.push(tranCurRow);
													statusArray.push(fromStatusInternalId);
													statusQtyArray.push(quantity);
												}
												else
												{
													var statusIndex = statusArray.indexOf(fromStatusInternalId);
													var previousQuantity = statusQtyArray[statusIndex];
													var totalQty =  Number(Big(quantity).plus(previousQuantity));
													statusQtyArray[statusIndex] = totalQty;

													for(var ind= 0 ;ind < transOrdStatusArray.length; ind++)
													{
														var statusId = transOrdStatusArray[ind]['fromStatusInternalId'];

														if(statusId == fromStatusInternalId)
														{
															transOrdStatusArray[ind]['quantitywithUOMText']  = totalQty +" "+ transactionUomName;
															transOrdStatusArray[ind]['quantity']  = totalQty;
														}
													}

												}
											}

										}
										if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"))
										{
											if(statusArray.indexOf(fromStatusInternalId) == -1)
											{
												statusArray.push(fromStatusInternalId);
												var quantity = 1;
												statusQtyArray.push(quantity);
												var quantitywithUOMText = vtoStatusitemQty +" "+transactionUomName;
												var tranCurRow =  {'fromStatusInternalId':fromStatusInternalId,'fromStatusName':fromStatusName,
														'quantitywithUOMText':quantitywithUOMText,'quantity':vtoStatusitemQty};
												transOrdStatusArray.push(tranCurRow);
											}
											else
											{
												var statusIndex = statusArray.indexOf(fromStatusInternalId);
												var quantity = statusQtyArray[statusIndex];
												var totalQty =  quantity+(vtoStatusitemQty);
												statusQtyArray[statusIndex] = totalQty;
												for(var ind= 0 ;ind < transOrdStatusArray.length; ind++)
												{
													var statusId = transOrdStatusArray[ind]['fromStatusInternalId'];

													if(statusId == fromStatusInternalId)
													{
														transOrdStatusArray[ind]['quantitywithUOMText']  = totalQty +" "+ transactionUomName;
														transOrdStatusArray[ind]['quantity']  = totalQty;
													}
												}
											}
										}
									}
								}
							}

						}
					}
				}
				}

				log.debug({title:'transOrdStatusArray',details:transOrdStatusArray});
				var displayStatusArr = [];
				if(transOrdStatusArray.length > 0)
				{
					if(!utility.isValueValid(lot))
					{
						lot ='';
					}

					for(var ind= 0 ;ind < transOrdStatusArray.length; ind++)
					{
						var statusId = transOrdStatusArray[ind]['fromStatusInternalId'];
						var opentaskResults = inboundUtility.getTransferOrderOpenTaskDetails(getItemInternalId,transactionInternalId,
								getordLineNo,whLocation,statusId,lot,inventoryStatusFeature);
						var opentaskRcvdQty = 0;
						if(opentaskResults != null && opentaskResults.length > 0)
						{
							for(var openTaskItr = 0; openTaskItr < opentaskResults.length; openTaskItr++)
							{
								var actQty = opentaskResults[openTaskItr]['custrecord_wmsse_act_qty'];
								if(actQty == '' || actQty == null || actQty == undefined || isNaN(actQty))
									actQty = 0;

								opentaskRcvdQty = Number(Big(opentaskRcvdQty).plus(actQty));
							}

							if(opentaskRcvdQty > 0)
							{
								var statusQuantity = transOrdStatusArray[ind]['quantity'];
								statusQuantity  = Number(Big(statusQuantity).minus(opentaskRcvdQty));
								transOrdStatusArray[ind]['quantitywithUOMText']  = statusQuantity +" "+ transactionUomName;
								transOrdStatusArray[ind]['quantity']  = statusQuantity;
							}
						}
						var totalQuantity = transOrdStatusArray[ind]['quantity'];
                         if(!utility.isValueValid(transactionUomConversionRate))
                        	 {
                        	 transactionUomConversionRate = 1;
                        	 }
						log.debug({title:'totalQuantity1',details:totalQuantity});

						if(parseFloat(totalQuantity) > 0)
						{
							var statusReceivedQty =0;
							for(var recptItr = 0; recptItr < searchResults.length ;recptItr++)
							{   var receiptId  = searchResults[recptItr].internalid;
								if(searchResults[recptItr].recordtype == 'itemreceipt')
								{
									var receiptRecord = record.load({
										type : 'itemreceipt',
										id : receiptId,
										isDynamic: true
									});

									var receiptItemCount = receiptRecord.getLineCount({
										sublistId: 'item'
									});

									log.debug({title:'receiptItemCount',details:receiptItemCount});
									for(var Iritr=0;Iritr<receiptItemCount;Iritr++)
									{
										var rItem = receiptRecord.getSublistValue({sublistId: 'item',fieldId: 'item',	line: Iritr});
										var rline = receiptRecord.getSublistValue({sublistId: 'item',fieldId: 'orderline',line:Iritr});
										if((rItem == getItemInternalId) && (parseInt(getordLineNo) == (parseInt(rline)-2)))
										{
											receiptRecord.selectLine({
												sublistId: 'item',
												line: Iritr
											});

											var receiptCompSubRecord = null;
											try{
												receiptCompSubRecord = receiptRecord.getCurrentSublistSubrecord({
													sublistId: 'item',
													fieldId: 'inventorydetail'
												});
											}
											catch(e){
												receiptCompSubRecord = null;
											}
											var receiptLinelength =0;
											if(receiptCompSubRecord!=null && receiptCompSubRecord!=''&& receiptCompSubRecord!= undefined)
											{
												receiptLinelength = receiptCompSubRecord.getLineCount({
													sublistId: 'inventoryassignment'
												});
											}
											log.debug({title:'receiptLinelength',details:receiptLinelength});
											for(var cnt1=0;cnt1<receiptLinelength;cnt1++)
											{
												var	receiveLotName = '';
												if(inventoryStatusFeature)
												{
													var	statusInternalId = receiptCompSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'inventorystatus',	line: cnt1});
													var	statusName = receiptCompSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'inventorystatus',	line: cnt1});
													receiveLotName = receiptCompSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'receiptinventorynumber',	line: cnt1});
													log.debug({title:'statusInternalId',details:statusInternalId});
													log.debug({title:'statusId',details:statusId});
													log.debug({title:'receiveLotName',details:receiveLotName});
													if(!utility.isValueValid(receiveLotName))
													{
														receiveLotName ='';
													}

													if(statusId == statusInternalId && (receiveLotName == lot || ((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"))))
													{
														receivedQty = receiptCompSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'quantity',	line: cnt1});	
														statusReceivedQty =  Number(Big(statusReceivedQty).plus(receivedQty)); 
													}
												}
												else
												{
													receiveLotName = receiptCompSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'receiptinventorynumber',	line: cnt1});
													if(!utility.isValueValid(receiveLotName))
													{
														receiveLotName ='';
													}
													
													if((receiveLotName == lot || ((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"))))
													{
														receivedQty = receiptCompSubRecord.getSublistValue({sublistId: 'inventoryassignment',fieldId: 'quantity',	line: cnt1});
														statusReceivedQty =  Number(Big(statusReceivedQty).plus(receivedQty));
													}
												}

											}

										}
									}
								}

							}
							totalQuantity = Big(totalQuantity).minus(statusReceivedQty);
							if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")) {

								transOrdStatusArray[ind]['quantitywithUOMText'] = totalQuantity / transactionUomConversionRate + " " + transactionUomName;
								transOrdStatusArray[ind]['quantity'] = totalQuantity / transactionUomConversionRate;
							}
							log.debug({title:'totalQuantity',details:totalQuantity});
							if(parseFloat(totalQuantity) > 0)
							{
								var statusId = transOrdStatusArray[ind]['fromStatusInternalId'];
								var statusName= transOrdStatusArray[ind]['fromStatusName'] ;

								if(displayStatusArr.indexOf(statusId) == -1)
								{
									displayStatusArr.push(statusId);
									var lotstatuslistCurRow = {'fromStatusInternalId':statusId,'fromStatusName':statusName};
									lotstatuslistArray.push(lotstatuslistCurRow);	
								}

								if(defaultStatusName == '')
								{
                                    if(utility.isValueValid(selectedInventoryStatus))
                                    {
                                        defaultStatusName = selectedInventoryStatus;
                                    }
                                    else
                                    {
                                        defaultStatusName = statusName;
                                    }
								}
								resultsArray.push(transOrdStatusArray[ind]);
							}
						}
					}
				}

			}

			invStatusListResponseParm['lotStatusLst']=lotstatuslistArray;
			invStatusListResponseParm['defaultStatusName']=defaultStatusName;
			log.debug({title:'resultsArray',details:resultsArray});
			return  resultsArray;
		}
	}

	return {
		'post': doPost,
		getOrdinvStatusList: getOrdinvStatusList
	};

});
