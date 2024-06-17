/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/record', './wms_utility','./big','./wms_translator', './wms_inboundUtility','./wms_tallyScan_utility','./wms_inbound_utility','./wms_labelPrinting_utility','N/query','N/runtime'],
		function (search, record, utility,Big,translator, inboundUtility,tallyScanUtility,inboundLib,labelPrintingUtility,query,runtime) {
	/**
	 *This function is to validate the entered / scanned item against item master and purchase order
	 */
	function doPost(requestBody) {


		var itemValidateDetails = {};
		var tempflag = false;
		var scannedItem = '';
		var getOrderLineNo ='';
		var getOrderLineItemId ='';
		var orderItem ='';
		var wareHouseLocationId ='';
		var trantype = '';
		var orderId = '';
		var vendorId ='';
		var debugString = '';
		var stockUnitText = '';
		var processType = '';
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				scannedItem = requestParams.itemName;
				getOrderLineNo = requestParams.transactionLineNo;
				getOrderLineItemId = requestParams.itemInternalId;
				orderItem = requestParams.itemName;
				wareHouseLocationId = requestParams.warehouseLocationId;
				var warehouseLocationName = requestParams.warehouseLocationName;
				trantype = requestParams.transactionType;
				orderId = requestParams.transactionName;
				vendorId =  requestParams.VendorId;
				var orderInternalid = requestParams.transactionInternalId;
				var processNameFromState = requestParams.processNameFromState;
        		var printEnabled = requestParams.printEnabled;
				log.debug({title: 'requestParams',details:requestParams});
                var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();

				if(utility.isValueValid(orderId) && utility.isValueValid(wareHouseLocationId) && utility.isValueValid(trantype)
						&& (utility.isValueValid(getOrderLineItemId) || utility.isValueValid(scannedItem)))
				{

					if(trantype!=null && trantype!='')
					{
						log.debug('trantype trantype',trantype);
						if(trantype=='purchaseorder')
						{
							processType= "Purchase Order";
						}
						else if(trantype=='transferorder')
						{
							processType= "Transfer Order";
						}
						else if(trantype=='returnauthorization')
						{
							processType= "Returns";
						}

						log.debug('processType',processType);
					}
					
					var currItem = {};

					if (utility.isValueValid(getOrderLineItemId)) {						

						currItem.itemInternalId = getOrderLineItemId;	
					}
					else {
						if(trantype=='transferorder')
						{
							currItem = utility.itemValidationForInventoryAndOutBound(scannedItem,wareHouseLocationId);
						}
						else
						{
							currItem = utility.getSKUIdWithName(scannedItem,wareHouseLocationId,vendorId,orderInternalid);
						}

					}

					if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error))))
					{
						var itemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
						currItem.itemName = ((currItem.itemName) ? (currItem.itemName) : currItem.barcodeItemname);
						if(utility.isValueValid(itemInternalId))
						{
							var itemType = '';
							var useBinsFlag ='';
							var columnlookupArray =[];
							var unitType = '';
							columnlookupArray.push('recordtype');
							columnlookupArray.push('usebins');
							columnlookupArray.push('stockunit');
							columnlookupArray.push('unitstype');
							columnlookupArray.push('itemid');
							columnlookupArray.push('isinactive');
							columnlookupArray.push('internalid');
							columnlookupArray.push('custitem_wms_usetallyscan');

							var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnlookupArray);
							if (itemLookUp.usebins != undefined) {
								useBinsFlag = itemLookUp.usebins;
								itemValidateDetails.useBinsFlag = useBinsFlag;
							}
							if (itemLookUp.recordtype != undefined) {
								itemType = itemLookUp.recordtype;
							}
							var locationUseBinlFlag = '';
							var thumbNailUrl ='';
							var columnsArray =[];
							columnsArray.push('usesbins');

							var locationLookUp = utility.getLocationFieldsByLookup(wareHouseLocationId,columnsArray);

							if (locationLookUp.usesbins != undefined) {
								locationUseBinlFlag = locationLookUp.usesbins;
							}
							if (itemLookUp.internalid != undefined && itemLookUp.isinactive == true){
								itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INACTIVE_ITEM');
								itemValidateDetails.isValid = false;
							}
							else{
								if(itemLookUp.internalid == undefined){
									itemValidateDetails.errorMessage =translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT'); 
									itemValidateDetails.isValid = false;
								}
							}
							if(itemValidateDetails.isValid != false){
								if (locationUseBinlFlag == true && useBinsFlag == false  &&
										(itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem"
											|| itemType == "inventoryitem" || itemType == "assemblyitem" ||
											itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")) {

									itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.USEBINS_FALSE');
									itemValidateDetails.isValid = false;
								}
								else {
									if (itemLookUp.thumbnailurl != undefined) {
										thumbNailUrl = itemLookUp.thumbnailurl;
									}
									
									if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined) {
										unitType = itemLookUp.unitstype[0].value;
									}
									if (itemLookUp.itemid != undefined) {
										currItem.itemName = itemLookUp.itemid;
									}
									if(utility.isValueValid(itemLookUp.stockunit) && utility.isValueValid(itemLookUp.stockunit[0])){
										stockUnitText = itemLookUp.stockunit[0].text;
									}

									var barcodeUOM = currItem.barcodeUomName;
									var barcodeUOMConversionRate = 1;
									var barcodeQty = currItem.barcodeQuantity;
									if(utility.isValueValid(unitType) && utility.isValueValid(barcodeUOM) &&
											utility.isValueValid(barcodeQty)  && (itemType == "serializedinventoryitem" ||
													itemType == "serializedassemblyitem")){
										barcodeUOMConversionRate = utility.getConversionRate(barcodeUOM,unitType);
										barcodeQty = currItem.barcodeQuantity;
									}

									/*if((utility.isValueValid(barcodeQty)) &&
											!((barcodeQty == 1|| barcodeQty =='1') && barcodeUOMConversionRate==1) &&
											(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"))	{

										deletebarcodestring(scannedItem);
										itemValidateDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.BARCODE_SERIALQUANTITY_VALIDATION');
										itemValidateDetails.isValid = false;	
									}*/
									//else{

										var orderLineDetails = inboundUtility.getRecevingOrderItemDetails(orderId,itemInternalId,wareHouseLocationId,getOrderLineNo,null,null,trantype,null,centralizesPurchasingandBilling,warehouseLocationName);
                                        log.debug('orderLineDetails',orderLineDetails);
										if (orderLineDetails.length > 0) {

											itemValidateDetails.barcodeSerialname=currItem.barcodeSerialname;
											var ordId = orderLineDetails[0].internalid;
											var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(ordId,wareHouseLocationId,itemInternalId,getOrderLineNo);
											var ismFeatureEnabled = inboundUtility.isISMFeatureEnabled();
											var ismqtyresults = [];
											if(ismFeatureEnabled && trantype == "purchaseorder"){
												ismqtyresults = inboundUtility.ismReceivedquantity(ordId, wareHouseLocationId);
											}

											var orderItemOpentaskRcvQty = 0;
											var orderRemainingQty = 0;
											var ordLineDetails = '';
											var orderLineReceivedQty =0;
											var orderLineRemainingQty = 0;

											for (var k in orderLineDetails) {

												ordLineDetails = orderLineDetails[k];
												orderItemOpentaskRcvQty = 0;

												if(JSON.stringify(openPutAwayDetails) !== '{}')
												{
													for(var key in  openPutAwayDetails)
													{
														if(ordLineDetails.line  == key )
														{
															orderItemOpentaskRcvQty = openPutAwayDetails[ordLineDetails.line];
															orderLineReceivedQty = ordLineDetails.totalReceivedQty;
															if(trantype=='transferorder')
															{
																orderLineRemainingQty = ordLineDetails.TransferOrderLine_Remainingqty;
																ordLineDetails.TransferOrderLine_Remainingqty =Number(Big(orderLineRemainingQty).minus(orderItemOpentaskRcvQty));
															}
															else if(trantype=='returnauthorization')
															{
																orderLineRemainingQty = ordLineDetails.rmaRemainingQty;
																ordLineDetails.rmaRemainingQty =Number(Big(orderLineRemainingQty).minus(orderItemOpentaskRcvQty));
															}
															else
															{
																orderLineRemainingQty = ordLineDetails.poRemainingQty;
																ordLineDetails.poRemainingQty =Number(Big(orderLineRemainingQty).minus(orderItemOpentaskRcvQty));
															}

															ordLineDetails.totalReceivedQty =Number(Big(orderLineReceivedQty).plus(orderItemOpentaskRcvQty));
															break;
														}
													}
												}

												if(trantype=='transferorder'){
													orderRemainingQty = ordLineDetails.TransferOrderLine_Remainingqty;
												}
												else if(trantype=='returnauthorization'){
													orderRemainingQty = ordLineDetails.rmaRemainingQty;
												}
												else {
													if (ismFeatureEnabled && ordLineDetails.quantityonshipments) {
														var quanitityReceivedInISM = 0;
														for (var ismqtyIterator in ismqtyresults) {
															if (ismqtyresults[ismqtyIterator].line == ordLineDetails.line) {
																quanitityReceivedInISM = parseFloat(ismqtyresults[ismqtyIterator].quantityreceived);
																break;
															}
														}
														ordLineDetails.poRemainingQty = Number(Big(ordLineDetails.poRemainingQty).plus(quanitityReceivedInISM).minus(ordLineDetails.quantityonshipments));
														ordLineDetails.poRemainingQty = ordLineDetails.poRemainingQty >= 0 ? ordLineDetails.poRemainingQty : 0;
													}
													orderRemainingQty = ordLineDetails.poRemainingQty;
												}
												log.debug({title: 'orderRemainingQty',details: orderRemainingQty});
												if (parseFloat(orderRemainingQty) > 0) {

													log.debug({title:'ordLineDetails',details:ordLineDetails});
													var errorObj = utility.checkTransactionLock(trantype, ordLineDetails.internalid, ordLineDetails.line);
													log.debug({title:'errorObj',details:errorObj});
													if (errorObj != null) {
														itemValidateDetails.errorMessage =errorObj;
														itemValidateDetails.isValid = false;
														break;
													}
													else{
														tempflag = true;
														if(trantype == 'transferorder')	{
															  itemValidateDetails.remainingQuantity = ordLineDetails.TransferOrderLine_Remainingqty;
															}
															else{
																itemValidateDetails.remainingQuantity = ordLineDetails.poRemainingQty;
															}
														
														
														if (itemLookUp.custitem_wms_usetallyscan != undefined && itemLookUp.custitem_wms_usetallyscan != null ){
															itemValidateDetails.useItemLevelTallyScan = itemLookUp.custitem_wms_usetallyscan;
														}
														if(itemValidateDetails.useItemLevelTallyScan == true){
															if(trantype == 'transferorder')	{
																itemValidateDetails.pickQuantity = ordLineDetails.TransferOrderLine_Remainingqty;
															}
															else if(trantype=='returnauthorization')
															{
																itemValidateDetails.pickQuantity =  ordLineDetails.rmaRemainingQty;
															}
															else{
																itemValidateDetails.pickQuantity =  ordLineDetails.poRemainingQty;
															}
															itemValidateDetails =tallyScanUtility.getTallyScanRuleData(wareHouseLocationId, processNameFromState, itemValidateDetails);
															if(trantype == 'transferorder')	{
															  itemValidateDetails.remainingQuantity = ordLineDetails.TransferOrderLine_Remainingqty;
															}
															else{
																itemValidateDetails.remainingQuantity = ordLineDetails.poRemainingQty;
																itemValidateDetails.backBtnVisibility = true;
																itemValidateDetails.randomTallyScan = "F";
																if (itemValidateDetails.tallyScanProcessType == "Tally Scan Across Item Types"  && itemValidateDetails.isTallyScanRequired == true) {

																	//var stageRecvingSystemRule = utility.getSystemRuleValue('Stage received items before putting away?', wareHouseLocationId);
                                                                    var stageRecvingSystemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?',wareHouseLocationId,processType);

																	if((utility.isValueValid(stageRecvingSystemRule) && stageRecvingSystemRule == "Y" ) || (locationUseBinlFlag == false)) {
																		itemValidateDetails.stageRcvSystemRule = stageRecvingSystemRule;
																		itemValidateDetails.randomTallyScan = "T";

																		var poremainingQty = _getPOTotalRemQty(orderInternalid);
																		if (parseFloat(poremainingQty) > 0) {
																			var openTaskQty = _getPORcvdOpenTaskQty(orderInternalid);
																			log.debug("poremainingQty",poremainingQty);
																			log.debug("openTaskQty",openTaskQty);
																			var totRemQty = poremainingQty;
																			if(parseFloat(openTaskQty) > 0) {
																				totRemQty = parseFloat(poremainingQty) - parseFloat(openTaskQty);
																			}
																			log.debug("totRemQty",totRemQty);
                                                                            if(parseFloat(totRemQty) > 0){
																				if(locationUseBinlFlag == false){
																					itemValidateDetails.backBtnVisibility = false;
																				}
																				else{
																					itemValidateDetails.backBtnVisibility = _getBackBtnVisibility(orderInternalid);
																				}
																				log.debug("itemValidateDetails",itemValidateDetails.backBtnVisibility);
																			}
																			itemValidateDetails.remainingQuantity = totRemQty;
																		}
																	}

																}
															}
														}

														
														itemValidateDetails.transactionName = orderId;
														itemValidateDetails.itemType = itemType;
														itemValidateDetails.transactionLineNo = ordLineDetails.line;
														itemValidateDetails.itemInternalId = itemInternalId;
														itemValidateDetails.transactionInternalId = ordLineDetails.internalid;
														itemValidateDetails.itemName = currItem.itemName;
														itemValidateDetails.unitType = ordLineDetails.unitstype;
														itemValidateDetails.itemDescription = ordLineDetails.salesdescription;
														itemValidateDetails.actualBeginTime = utility.getCurrentTimeStamp();
														itemValidateDetails.warehouseLocationId = ordLineDetails.location;
														itemValidateDetails.receivedQuantity = ordLineDetails.totalReceivedQty;//NEW UPDATE IN CONFLUENCE NAMING CONVENTIONS
														itemValidateDetails.imageUrl = thumbNailUrl;//NEW UPDATE IN CONFLUENCE NAMING CONVENTIONS
														itemValidateDetails.transactionUomConversionRate = ordLineDetails["Conversion Rate"];
                                                        itemValidateDetails.targetlocation = ordLineDetails.targetlocation;
                                                        itemValidateDetails.targetsubsidiary = ordLineDetails.targetsubsidiary;
														if (itemValidateDetails.isTallyScanRequired == true) {
															itemValidateDetails.numberOfTimesSerialScanned = 0;
															itemValidateDetails.tallyLoopObj = {};
															log.debug('itemValidateDetails.transactionUomConversionRate',itemValidateDetails.transactionUomConversionRate);
															if(!utility.isValueValid(itemValidateDetails.transactionUomConversionRate)){
																itemValidateDetails.transactionUomConversionRate = 1;
															}
															if(trantype == 'transferorder')	{
																  itemValidateDetails.enteredQtyInEach = Number(Big(ordLineDetails.TransferOrderLine_Remainingqty).mul(itemValidateDetails.transactionUomConversionRate));
																}
															else if(trantype=='returnauthorization')
																{
																itemValidateDetails.enteredQtyInEach =  Number(Big(ordLineDetails.rmaRemainingQty).mul(itemValidateDetails.transactionUomConversionRate));
																}
																else{
																	itemValidateDetails.enteredQtyInEach =  Number(Big(ordLineDetails.poRemainingQty).mul(itemValidateDetails.transactionUomConversionRate));
																}
															
														}
														
														var transactionUomName = ordLineDetails.unitText;
														log.debug('itemValidateDetails1',itemValidateDetails);
														if(trantype == 'transferorder')	{
															itemValidateDetails.warehouseLocationId = ordLineDetails.transferlocation;
															itemValidateDetails.transcationUomInternalId = ordLineDetails.unit;
														}
														else if(trantype == 'returnauthorization'){
															itemValidateDetails.remainingQuantity = ordLineDetails.rmaRemainingQty;
															itemValidateDetails.transcationUomInternalId = ordLineDetails.unit;
															if(utility.isIntercompanyCrossSubsidiaryFeatureEnabled()){
																itemValidateDetails.warehouseLocationId = ordLineDetails.inventorylocation;
															}
															if(utility.isValueValid(ordLineDetails.itemtype)&& ordLineDetails.itemtype == 'Kit'){
																itemValidateDetails.isKitComponent = true;
														        itemValidateDetails.parentItem = ordLineDetails.parentItem;
														        itemValidateDetails.parentItemLine = ordLineDetails.parentItemLine;
															}
															
														}
														else{
															if(utility.isValueValid(ordLineDetails.unit))
															{
																transactionUomName = ordLineDetails.unit;
																itemValidateDetails.transcationUomInternalId = this._getUomInternalId(ordLineDetails.unit,unitType);
															}
															itemValidateDetails.backOrderQty = inboundUtility.getBackOrderQty(wareHouseLocationId, itemInternalId);

														}
														itemValidateDetails.yetToBePickedQty = inboundLib.getItemYetToBePickedQty(itemInternalId,wareHouseLocationId);
														log.debug({title:'itemValidateDetails.yetToBePickedQty',details:itemValidateDetails.yetToBePickedQty});
														itemValidateDetails.inforemainingQuantity = itemValidateDetails.remainingQuantity;
														itemValidateDetails.inforeceivedQuantity = itemValidateDetails.receivedQuantity;


														if(utility.isValueValid(ordLineDetails.unit) && itemValidateDetails.randomTallyScan != 'T'){

															itemValidateDetails.transactionUomName = transactionUomName;
															if(parseFloat(itemValidateDetails.inforemainingQuantity) > 0){
																itemValidateDetails.inforemainingQuantity = itemValidateDetails.inforemainingQuantity + " " + transactionUomName;
															}

															if(parseFloat(itemValidateDetails.inforeceivedQuantity) > 0){
																itemValidateDetails.inforeceivedQuantity = itemValidateDetails.inforeceivedQuantity + " " + transactionUomName;
															}
															if(utility.isValueValid(stockUnitText) &&
																	utility.isValueValid(ordLineDetails.unitstype) && 
																	utility.isValueValid(itemValidateDetails.backOrderQty))	{
																var stockConvRate 	= utility.getConversionRate(stockUnitText, ordLineDetails.unitstype);
																var tranUOMConvRate	= utility.getConversionRate(transactionUomName, ordLineDetails.unitstype);
																if(utility.isValueValid(itemValidateDetails.backOrderQty) && itemValidateDetails.backOrderQty != 0){
																	var tranUOMbackOrdQty = utility.uomConversions(parseFloat(itemValidateDetails.backOrderQty),tranUOMConvRate,stockConvRate);
																	itemValidateDetails.backOrderQty = tranUOMbackOrdQty+' '+transactionUomName;
																}

															}
															else{
																if(utility.isValueValid(itemValidateDetails.backOrderQty) && itemValidateDetails.backOrderQty != 0){
																	itemValidateDetails.backOrderQty = itemValidateDetails.backOrderQty+' '+transactionUomName;
																}
															}
															if(utility.isValueValid(itemValidateDetails.yetToBePickedQty) && itemValidateDetails.yetToBePickedQty != 0){
																var tranUOMConvRate	= utility.getConversionRate(transactionUomName, ordLineDetails.unitstype);
																var tranUOMYetToBePickedQty = utility.uomConversions(parseFloat(itemValidateDetails.yetToBePickedQty),tranUOMConvRate,1);
																itemValidateDetails.yetToBePickedQty = tranUOMYetToBePickedQty+' '+transactionUomName;
															}
														}
														else
														{
															itemValidateDetails.transactionUomName ="";
															itemValidateDetails.transcationUomInternalId ="";
														}
														itemValidateDetails = utility.addItemDatatoResponse(itemValidateDetails, currItem, ordLineDetails.unitstype, ordLineDetails.unitText);
													
														if (itemValidateDetails.isTallyScanRequired == true){
															itemValidateDetails.isBinScanRequired ="";

															if (utility.isValueValid(itemValidateDetails.barcodeQuantity))
															{
																itemValidateDetails.barcodeQuantity = [{
																	'value': '1',
																	'unit': itemValidateDetails.barcodeQuantity[0].unit
																}];
															}
															
															if(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"){
																itemValidateDetails.isSerialItem =true;
																 if (utility.isValueValid(unitType)) {
						                                                uomResult = tallyScanUtility.getUOMDetails(unitType);
						                                                log.debug('uomResult',uomResult);
						                                                for (var itr in uomResult) {
						                                                    if (uomResult[itr]['uom.baseunit']) {
						                                                    	itemValidateDetails.transcationUomInternalId = uomResult[itr]['uom.internalid'];
																				itemValidateDetails.barcodeQuantity = [{
																					'value': '1',
																				    'unit': uomResult[itr]['uom.internalid']
																				}];
						                                                    	break;
						                                                    }
						                                                }
						                                            }
															}
															
														}

                                                        itemValidateDetails.isItemAliasPopupRequired = false;
                                                        if(printEnabled && trantype == "purchaseorder")
                                                        {
															var isGS1Enabled = labelPrintingUtility.checkGS1Enable(wareHouseLocationId);
                                                            if(utility.isValueValid(itemInternalId) && (utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true))
                                                            {
																if (utility.isValueValid(currItem.isItemAliasScanFlag) && currItem.isItemAliasScanFlag)
																{
																	itemValidateDetails.scannedItemAliasForPrint = scannedItem;
																}
                                else if(utility.isValueValid(currItem.isbarcodescanned) && currItem.isbarcodescanned &&
																	utility.isValueValid(currItem.barcodeItem)){
																	itemValidateDetails.scannedItemAliasForPrint = currItem.barcodeItem;
																}
                                  else {
																	var itemAliasList = labelPrintingUtility.getAllItemAliasResultsForPrint(itemInternalId,vendorId,wareHouseLocationId);
																	if (itemAliasList.length > 1) {
																		itemValidateDetails.isItemAliasPopupRequired = true;
																	}
																}
                                                            }
                                                        }
														itemValidateDetails.isValid = true;
														break;
													}
												}
											}
											if (!tempflag && itemValidateDetails.isValid != false) {
												itemValidateDetails.errorMessage = translator.getTranslationString('TO_BINVALIDATE.TRANSACTION_COMPLETED');
												itemValidateDetails.isValid = false;
											}

										}
										else
										{
											itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
											itemValidateDetails.isValid = false;
										}
									//}
								}
							}
						}
						else {

							if(utility.isValueValid(orderItem))
							{
								var itemfilters = [
								                   search.createFilter({
								                	   name: 'nameinternal',
								                	   operator: search.Operator.IS,
								                	   values: orderItem
								                   })
								                   ];

								var itemcolumns = [
								                   search.createColumn({name: 'isinactive'}),
								                   search.createColumn({name: 'location'})
								                   ];

								var itemresultsSearch = search.create({
									type: 'item',
									filters: itemfilters,
									columns: itemcolumns
								});
								var itemresults = itemresultsSearch.run().getRange({
									start: 0,
									end: 1000
								});
								if (itemresults.length>0) {
									var itemLoc = itemresults[0].getValue({name: 'location'});
									if (itemresults[0].getValue({name: 'isinactive'}) == true) {
										itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INACTIVE_ITEM');
									}
									else if ((utility.isValueValid(itemLoc)) && (itemLoc != wareHouseLocationId) ) {
										itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.WAREHOUSE_NOT_MATCHED');
									}
									else {
										itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
									}
								}
								else {
									itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
								}
								itemValidateDetails.isValid = false;
							}

						}
						debugString = debugString + " tempflag: "+tempflag;
					}
					else
					{
						itemValidateDetails.errorMessage = currItem.error ? currItem.error : translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
						itemValidateDetails.isValid = false;
					}
					debugString = debugString + " tempflag2: "+tempflag;
				}
				else
				{
					itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
					itemValidateDetails.isValid = false;
				}
				debugString = debugString + " tempflag3: "+tempflag;

			}
			else
			{
				itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
				itemValidateDetails.isValid = false;
			}
		}
		catch(e)
		{
			itemValidateDetails.isValid = false;
			itemValidateDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return itemValidateDetails;
	}
	function deletebarcodestring(barcodeString)
	{
		var barcodeStringSearch = search.load({
			id : 'customsearch_wmsse_barcode_string'
		});
		var barcodeStringFilters = barcodeStringSearch.filters;
		barcodeStringFilters.push(
				search.createFilter({
					name: 'custrecord_wmsse_barcode_string',
					operator: search.Operator.IS,
					values: barcodeString	
				}));
		barcodeStringSearch.filters = barcodeStringFilters;

		var searchResults = utility.getSearchResultInJSON(barcodeStringSearch);
		log.debug({title:'searchResults',details:searchResults});
		if(searchResults.length > 0){
			record.delete({
				type : 'customrecord_wmsse_barcode_strings',
				id : searchResults[0].id
			});
		}
	}


	function _getPORcvdOpenTaskQty(orderInternalid){
		var myOpentaskQuery = query.create({
			type: 'customrecord_wmsse_trn_opentask'
		});

		var tranCond = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_order_no',
			operator: query.Operator.ANY_OF,
			values: orderInternalid
		});
		var confirmationRefCondition = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
			operator: query.Operator.EMPTY
		});
		var tallyscanEnabledCond = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_sku^item.custitem_wms_usetallyscan',
			operator: query.Operator.IS,
			values: true
		});
		myOpentaskQuery.condition = myOpentaskQuery.and(tranCond,confirmationRefCondition,tallyscanEnabledCond);


		myOpentaskQuery.columns = [

			myOpentaskQuery.createColumn({
				fieldId: 'custrecord_wmsse_act_qty'
			}),
			myOpentaskQuery.createColumn({
				fieldId: 'custrecord_wmsse_conversionrate'
			})]
		var openTaskRemQty = 0;
		var conversionRate = 1;
		var results = myOpentaskQuery.runPaged({
			pageSize: 1000
		});
		var iterator = results.iterator();
		iterator.each(function(result) {
			page = result.value;
			pageResults = page.data.results;
			for(var res in pageResults) {
				var remQty = pageResults[res].values[0];
				conversionRate = pageResults[res].values[1];
				if (utility.isValueValid(conversionRate) && !isNaN(conversionRate)) {
					openTaskRemQty = openTaskRemQty + Number(Big(remQty).mul(conversionRate));
				} else {
					openTaskRemQty = Number(Big(openTaskRemQty).plus(remQty));
				}
			}
			return false;
		});

	return openTaskRemQty;

	}
function _getBackBtnVisibility(orderInternalid) {
		log.debug("orderInternalid",orderInternalid);
	var myTransactionQuery = query.create({
		type: query.Type.TRANSACTION
	});
	var tranCond = myTransactionQuery.createCondition({
		fieldId: 'id',
		operator: query.Operator.ANY_OF,
		values: orderInternalid
	});
	var qtyCond = myTransactionQuery.createCondition({
		formula: '{transactionlines.quantity} - {transactionlines.quantityshiprecv}',
		operator: query.Operator.GREATER,
		values: 0,
		type: query.ReturnType.FLOAT
	});
	var tallyscanEnabledCond = myTransactionQuery.createCondition({
		fieldId: 'transactionlines.item^item.custitem_wms_usetallyscan',
		operator: query.Operator.IS,
		values: true
	});
	var itemTypeCond = myTransactionQuery.createCondition({
		fieldId: 'transactionlines.itemtype',
		operator: query.Operator.ANY_OF,
		values: ['InvtPart','Assembly']
	});
	myTransactionQuery.condition = myTransactionQuery.and(tranCond, qtyCond, tallyscanEnabledCond,itemTypeCond);
	myTransactionQuery.columns = [
		myTransactionQuery.createColumn({
			fieldId: 'transactionlines.itemtype'
		})]
	var result = myTransactionQuery.run().results;
	log.debug("result",result);
	var isBinScanRequired = false;
	if(result.length > 0){
		isBinScanRequired = true;
	}
	log.debug("isBinScanRequired",isBinScanRequired);
	return isBinScanRequired;
}

	function _getPOTotalRemQty(orderInternalid){
		var myTransactionQuery = query.create({
			type: query.Type.TRANSACTION
		});
		var tranCond = myTransactionQuery.createCondition({
			fieldId: 'id',
			operator: query.Operator.ANY_OF,
			values: orderInternalid
		});
		var qtyCond = myTransactionQuery.createCondition({
			formula:'{transactionlines.quantity} - {transactionlines.quantityshiprecv}',
			operator: query.Operator.GREATER,
			values: 0,
			type : query.ReturnType.FLOAT
		});
		var tallyscanEnabledCond = myTransactionQuery.createCondition({
			fieldId: 'transactionlines.item^item.custitem_wms_usetallyscan',
			operator: query.Operator.IS,
			values: true
		});
		myTransactionQuery.condition = myTransactionQuery.and(tranCond,qtyCond,tallyscanEnabledCond);

		myTransactionQuery.columns = [
			myTransactionQuery.createColumn({
				fieldId:'transactionlines.quantity',
				aggregate: query.Aggregate.SUM
			}),
			myTransactionQuery.createColumn({
				fieldId:'transactionlines.quantityshiprecv',
				aggregate: query.Aggregate.SUM
			})];
		var results = myTransactionQuery.runPaged({
			pageSize: 1000
		});
		var poremainingQuantity = 0;
		var iterator = results.iterator();
		iterator.each(function(result) {
			page = result.value;
			pageResults = page.data.results;
			poremainingQuantity = poremainingQuantity+(pageResults[0].values[0] - pageResults[0].values[1]);
			return false;
		});
		return poremainingQuantity;
	}
	function _getUomInternalId(uomName,unitsTypeId){
		log.debug('uomName',uomName);
		log.debug('unitsTypeId',unitsTypeId);
		var uomValue = "";
		var uomRecord = record.load({
			type: record.Type.UNITS_TYPE,
			id: unitsTypeId
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
			if(uomName.toUpperCase() == unitName.toUpperCase() ||
					uomName.toUpperCase() == pluralName.toUpperCase())
			{
				uomValue = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'internalid',
					line: i
				});
				break;

			}
		}
		return uomValue;
	}
	return {
		'post': doPost,
		'_getUomInternalId':_getUomInternalId
	};
});
