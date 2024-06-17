/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator', './wms_inboundUtility','./wms_inbound_utility','./wms_tallyScan_utility','./wms_labelPrinting_utility','N/query'],
		function (search, utility,Big,translator, inboundUtility,inboundLib,tallyScanUtility,labelPrintingUtility,query) {
	/**
	 *This function is to validate the entered / scanned item against item master and purchase order
	 */
	function doPost(requestBody) {


		var itemValidateDetails = {};

		try{
			if(utility.isValueValid(requestBody)){

				var requestParams = requestBody.params;
				var receiveAllBtn = requestParams.receiveAll;				
				var itemInternalId = requestParams.itemInternalId;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemName = requestParams.itemName;
				var shipmentLineNo = requestParams.shipmentLineNo;
				var itemListCount = requestParams.itemListCount;
				var shipmentId = requestParams.shipmentId;
				var processNameFromState = requestParams.processNameFromState;
				var printEnabled = requestParams.printEnabled;
				var emptyShipmentNo = '';
				var backOrderQty = '';
				var transactionType='ISM';

				log.debug({title: 'requestParams',details:requestParams});

				if(utility.isValueValid(shipmentId) && utility.isValueValid(warehouseLocationId)
						&& ((utility.isValueValid(itemInternalId) || utility.isValueValid(itemName)) || (receiveAllBtn =='receiveAll')))	{
					var locUseBinsFlag = this._getlocationUseBinsFlag(warehouseLocationId);
					if(receiveAllBtn == 'receiveAll'){
						var isValidForReceiveAll = false;
						itemValidateDetails.isValid = true;
						var isLotOrSerialItemExistsInISM = requestParams.isLotOrSerialItemExistsInISM;
						if(isLotOrSerialItemExistsInISM){
							var isEligibleForReceiveAll = this._checkForShipmentReceiveAllOption(shipmentId,warehouseLocationId);
							if(!isEligibleForReceiveAll)
							{
								isValidForReceiveAll = false;
								itemValidateDetails.errorMessage = translator.getTranslationString('INBOUNDSHIPMENT.INVALID.RECEIVEALL');
								itemValidateDetails.isValid = false;
							}
							else
							{
								var linesEligibleForReceiveAll = this._checkISMPartialReceived(shipmentId,warehouseLocationId);
								if(linesEligibleForReceiveAll)
								{
									isValidForReceiveAll = true;
									itemValidateDetails.receiveAllBtn = 'receiveAll';
									itemValidateDetails.isValid = true;
								}
								else
								{
									isValidForReceiveAll = false;
									itemValidateDetails.errorMessage = translator.getTranslationString('INBOUNDSHIPMENT.INVALID.RECEIVEALL.PARTIALLYRECEIVED');
									itemValidateDetails.isValid = false;
								}
							}
						}
						if(itemValidateDetails.isValid == true){
							if(utility.isValueValid(locUseBinsFlag)  && locUseBinsFlag == true)
							{
								var itemsUseBinsArr = this._checkForItemsUseBins(warehouseLocationId,shipmentId);
								log.debug('itemsUseBinsArr',itemsUseBinsArr);
								if(itemsUseBinsArr.length == 0){
									isValidForReceiveAll = true;
									itemValidateDetails.receiveAllBtn = 'receiveAll';
									itemValidateDetails.isValid = true;
								}
								else{
									isValidForReceiveAll = false;
									itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.USEBINS_FALSE')+" ("+itemsUseBinsArr.toString()+")";
									itemValidateDetails.isValid = false;
								}
							}
							else
							{
								isValidForReceiveAll = true;
								itemValidateDetails.receiveAllBtn = 'receiveAll';
								itemValidateDetails.isValid = true;
							}
						}
						if(isValidForReceiveAll == true)
						{
							var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
							if(!inventoryStatusFeature)
							{

								if(utility.isValueValid(locUseBinsFlag)  && locUseBinsFlag == false)
								{
									if(itemListCount > 40)
									{
										inboundUtility.callSchedulerToReceiveISM(shipmentId,warehouseLocationId,'','');
										itemValidateDetails.isMapReduceScriptInvoked = 'T';
										itemValidateDetails.isValid = true;
									}
									else
									{
										var manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
										var	shipmentReceiptId = inboundUtility.iSM_receiveAll(shipmentId,warehouseLocationId,'','',manuallyPostIRSystemRuleValue,'');
										itemValidateDetails.systemRuleValue = manuallyPostIRSystemRuleValue;
										if(utility.isValueValid(shipmentReceiptId) || manuallyPostIRSystemRuleValue =='Y')
										{

											var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId,'',warehouseLocationId);
											var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId,'',warehouseLocationId);	
											if(shipmentListDetails.length > 0 )	
											{

												shipmentLineNo = '';
												var unitType = '';
												var quantity = '';
												itemInternalId = '';
												var itemType = '';
												var poInternalId = '';
												var poname = '';
												var uom = '';
												var conversionRate = '';
												var expectedQty = '';
												var invStatusId = '';
												var lineNo = '';
												var quantityReceived = '';
												var lineItemOpentaskRcvQty = '';
												var openTaskIdarray = [];
												var columnlookupArray =[];
												columnlookupArray.push('recordtype');
												columnlookupArray.push('unitstype');
												var shipmentLineRec = '';
												for (var shipmentLine in shipmentListDetails)
												{

													shipmentLineRec = shipmentListDetails[shipmentLine];
													log.debug({title:'shipmentLineRec',details:shipmentLineRec});
													quantity = shipmentLineRec.quantityremaining;
													lineNo = shipmentLineRec.inboundshipmentitemid;
													quantityReceived = shipmentLineRec.quantityreceived;
													shipmentLineNo = shipmentLineRec.inboundshipmentitemid;
													if(JSON.stringify(openPutAwayDetails) != '{}')
													{
														lineItemOpentaskRcvQty = openPutAwayDetails[shipmentLineNo];
													}
													if(parseFloat(quantity) > 0	&& ( !utility.isValueValid(quantityReceived) && !utility.isValueValid(lineItemOpentaskRcvQty)))
													{

														itemInternalId = shipmentLineRec.item;
														uom = shipmentLineRec.unitText;	
														poInternalId = shipmentLineRec.purchaseorder;
														poname = shipmentLineRec.purchaseorderText;
														expectedQty = shipmentLineRec.quantityexpected;
                            itemValidateDetails.poname = poname;
														var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnlookupArray);
														if (itemLookUp.recordtype != undefined){
															itemType = itemLookUp.recordtype;
														}
														if (itemLookUp.unitstype != undefined &&
																itemLookUp.unitstype[0] != undefined){
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

														var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams,manuallyPostIRSystemRuleValue,'','',shipmentLineNo,
																quantity,warehouseLocationId,shipmentReceiptId,
																itemInternalId,itemType,poInternalId,poname,uom,conversionRate,'',invStatusId,expectedQty,shipmentId,'');
														var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
														openTaskIdarray.push(openTaskId);
														var inputParamObj={};
														inputParamObj.poInternald =poInternalId;
														inputParamObj.shipmentId =shipmentId;
														inputParamObj.openTaskIdarray =openTaskIdarray;
														inputParamObj.poName =poname;
														inputParamObj.warehouseLocationId =warehouseLocationId;
														inputParamObj.shipmentReceiptId =shipmentReceiptId;
														inputParamObj._ignoreUpdate =false;
														itemValidateDetails.impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);

													}
												}

											}
											itemValidateDetails.itemsCount = inboundUtility.checkCountforRemaining(shipmentListDetails,'',warehouseLocationId);
										}
									}
								}
								else
								{
									itemValidateDetails.receiveAllBtn = 'receiveAll';
									itemValidateDetails.isValid = true;
								}
							}
						}
					}
					else
					{					
						var currItem = [];
						if (!utility.isValueValid(itemInternalId)) {		
							currItem = utility.getSKUIdWithName(itemName,warehouseLocationId,'','');
							log.debug({title: 'currItem',details:currItem});
							if (JSON.stringify(currItem) != '{}') {
								itemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
							}						
							else{
								itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
								itemValidateDetails.isValid = false;
							}
						}
						log.debug({title: 'itemInternalId',details:itemInternalId});
						if(utility.isValueValid(itemInternalId)){

							var itemType = '';
							var useBinsFlag ='';
							var thumbNailUrl = '';
							var unitType = '';
							var stockUnitText = '';

							var itemLookUp =  _getItemFieldsByLookup(itemInternalId);

							if (utility.isValueValid(itemLookUp.thumbnailurl)) {
								thumbNailUrl = itemLookUp.thumbnailurl;
							}
							if (utility.isValueValid(itemLookUp.recordtype)){
								itemType = itemLookUp.recordtype;
							}
							if (utility.isValueValid(itemLookUp.usebins)){
								useBinsFlag = itemLookUp.usebins;
							}
							if (utility.isValueValid(itemLookUp.unitstype) && utility.isValueValid(itemLookUp.unitstype[0])){
								unitType = itemLookUp.unitstype[0].value;
							}
							if (utility.isValueValid(itemLookUp.stockunit) && utility.isValueValid(itemLookUp.stockunit[0])){
								stockUnitText = itemLookUp.stockunit[0].text;
							}


							if (useBinsFlag == false && locUseBinsFlag == true &&
									(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem'
										|| itemType == 'inventoryitem' || itemType == 'assemblyitem' ||
										itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem' )) {

								itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.USEBINS_FALSE');
								itemValidateDetails.isValid = false;
							}
							else
							{
								var isPageValid = true;
								var isBarCodeScanned = false;

								if(utility.isValueValid(currItem.barcodeIteminternalid))
								{
									isBarCodeScanned = true;
									if(itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem')
									{
										/*var isDecimalQtyScanned =  this._checkIsScannedBarCodeContainsDecimalsForSerialItem(unitType,currItem);

										if(isDecimalQtyScanned)
										{
											inboundUtility.deletebarcodestring(itemName);
											itemValidateDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMORBINVALIDATE.BARCODE_SERIALQUANTITY_VALIDATION');
											itemValidateDetails.isValid = false;
											isPageValid = false;    
										}
										else
										{*/
											var vbarcodeSerial = currItem.barcodeSerialname;
											itemValidateDetails.barcodeSerialname=vbarcodeSerial;
											if(!utility.isValueValid(currItem.serial) && utility.isValueValid(vbarcodeSerial))
												itemValidateDetails.serial = vbarcodeSerial;
										//}
									}
									if(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
										if(!utility.isValueValid(currItem.batch_lot) && utility.isValueValid(currItem.barcodeLotname))
											itemValidateDetails.batch_lot = currItem.barcodeLotname;
										if(!utility.isValueValid(currItem.expiry_date) && utility.isValueValid(currItem.barcodeLotExpirydate))
											itemValidateDetails.expiry_date = currItem.barcodeLotExpirydate;
									}
								}
								if(isPageValid){

									var itemISMDetailsObj = inboundUtility.validateItemAgainstShipment(shipmentId,itemInternalId,warehouseLocationId);
									log.debug({title: 'itemISMDetailsObj',details:itemISMDetailsObj});
									var isItemHasQtyToRcv = false;
									if (itemISMDetailsObj.length > 0) {

										if(!utility.isValueValid(shipmentLineNo))
										{
											emptyShipmentNo = 'itemScanned';
										}
										var openTaskDetailsFetched = false;
										var openPutAwayDetails = {};
										itemValidateDetails.isItemAliasPopupRequired = false;
                                        var ismVendorNotMatch = false;
										for(var itemIndex = 0 ; itemIndex < itemISMDetailsObj.length; itemIndex ++){
											if(emptyShipmentNo!='' && emptyShipmentNo == 'itemScanned')
											{
												shipmentLineNo = itemISMDetailsObj[itemIndex].inboundshipmentitemid;
											}

											if(shipmentLineNo == itemISMDetailsObj[itemIndex].inboundshipmentitemid)
											{
												if(utility.isValueValid(currItem.barcodeVendorId) && itemISMDetailsObj[itemIndex].vendor != currItem.barcodeVendorId) {
                                                    ismVendorNotMatch = true;
                                                    continue;
                                                } else if(utility.isValueValid(currItem.barcodeVendorId) && itemISMDetailsObj[itemIndex].vendor == currItem.barcodeVendorId) {
													ismVendorNotMatch = false;
												}
                                                var shipmentLineReceivedQty = itemISMDetailsObj[itemIndex].quantityreceived;
												var shipmentLineExpQuantity = itemISMDetailsObj[itemIndex].quantityexpected;
												var remainingQty = itemISMDetailsObj[itemIndex].quantityremaining;
												log.debug({title: 'remainingQty',details:remainingQty});

												if(parseFloat(remainingQty) > 0){

													if(!openTaskDetailsFetched)
													{
														openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId,'',warehouseLocationId);
													}
													log.debug({title: 'openPutAwayDetails',details:openPutAwayDetails});
													if(JSON.stringify(openPutAwayDetails) != '{}'){

														openTaskDetailsFetched = true;
														var inboundShipmentItemLineNo = itemISMDetailsObj[itemIndex].inboundshipmentitemid;
														var lineItemOpentaskRcvQty = openPutAwayDetails[inboundShipmentItemLineNo];
														log.debug({title:'open task quantity :',details: lineItemOpentaskRcvQty});

														if(utility.isValueValid(lineItemOpentaskRcvQty))
														{

															if(!utility.isValueValid(shipmentLineReceivedQty))
															{
																shipmentLineReceivedQty = 0;
															}
															var tempTotalRecQty = Number(Big(parseFloat(shipmentLineReceivedQty)).plus(lineItemOpentaskRcvQty));									
															itemValidateDetails.totalReceivedQty = tempTotalRecQty;
															itemValidateDetails.quantityRemaining 	= Number(Big(parseFloat(shipmentLineExpQuantity)).minus(tempTotalRecQty));
															remainingQty = Number(Big(parseFloat(remainingQty)).minus(lineItemOpentaskRcvQty));
														}
														else
														{
															itemValidateDetails.totalReceivedQty = itemISMDetailsObj[itemIndex].quantityreceived;
															itemValidateDetails.quantityRemaining = remainingQty;
														}
													}
													else
													{
														itemValidateDetails.totalReceivedQty = itemISMDetailsObj[itemIndex].quantityreceived;
														itemValidateDetails.quantityRemaining = remainingQty;
													}
												}

												if(parseFloat(remainingQty) > 0){
													isItemHasQtyToRcv = true;
													//tallyScanCode Starts
													if (itemLookUp.custitem_wms_usetallyscan != undefined && 
															itemLookUp.custitem_wms_usetallyscan != null ){
														itemValidateDetails.useItemLevelTallyScan = itemLookUp.custitem_wms_usetallyscan;
													}
													if(itemValidateDetails.useItemLevelTallyScan == true){

														itemValidateDetails.pickQuantity =  remainingQty;
														itemValidateDetails =tallyScanUtility.getTallyScanRuleData(warehouseLocationId, processNameFromState, itemValidateDetails);
														log.debug('itemValidateDetails',itemValidateDetails);
													}
													if (itemValidateDetails.isTallyScanRequired == true) {
														itemValidateDetails.numberOfTimesSerialScanned = 0;
														itemValidateDetails.tallyLoopObj = {};
														if(!utility.isValueValid(itemValidateDetails.transactionUomConversionRate)){
															itemValidateDetails.transactionUomConversionRate = 1;
														}
														itemValidateDetails.enteredQtyInEach = Number(Big(remainingQty).mul(itemValidateDetails.transactionUomConversionRate));
														log.debug('itemValidateDetails',itemValidateDetails);
														if (itemValidateDetails.tallyScanProcessType == "Tally Scan Across Item Types") {
															var processType ="Inbound Shipment";
															var stageRecvingSystemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?', warehouseLocationId, processType);
															log.debug('stageRecvingSystemRule',stageRecvingSystemRule);
															if ((utility.isValueValid(stageRecvingSystemRule) && stageRecvingSystemRule == "Y")|| (utility.isValueValid(locUseBinsFlag)  && locUseBinsFlag == false)) {
																var ismTotalRemainingQty = this.getISMtotalRemainingQty(shipmentId, warehouseLocationId);
																log.debug('ismTotalRemainingQty',ismTotalRemainingQty);
																if (parseFloat(ismTotalRemainingQty) > 0) {
																	itemValidateDetails.quantityRemaining = ismTotalRemainingQty;
																	if(locUseBinsFlag == false){
																		itemValidateDetails.backBtnVisibility = false;
																	}
																	else{
																		itemValidateDetails.backBtnVisibility = this._getBackBtnVisibilityForISM(shipmentId);
																	}
																	log.debug("itemValidateDetails",itemValidateDetails.backBtnVisibility);


																}
																itemValidateDetails.stageRcvSystemRule = "Y";
																itemValidateDetails.randomTallyScan = "T";
															}

														}
													}
													//tallyScanCode ends

													itemValidateDetails.strBarCode = itemName;
													var uomText  = itemISMDetailsObj[0].unitText;

													itemValidateDetails	= utility.addItemDatatoResponse(itemValidateDetails, currItem, unitType, uomText);

													itemValidateDetails.ismLineDetails = itemISMDetailsObj;
													itemValidateDetails.info_itemtxt = itemISMDetailsObj[itemIndex].itemText;
													itemValidateDetails.info_imgurl = thumbNailUrl;
													itemValidateDetails.itemType = itemType;
													itemValidateDetails.itemInternalId = itemInternalId;
													itemValidateDetails.shipmentLineNo = itemISMDetailsObj[itemIndex].inboundshipmentitemid;
													itemValidateDetails.quantity = parseFloat(remainingQty);
													itemValidateDetails.poInternalId = itemISMDetailsObj[itemIndex].purchaseorder;
													itemValidateDetails.poname = itemISMDetailsObj[itemIndex].purchaseorderText;
													itemValidateDetails.poLineno = itemISMDetailsObj[itemIndex].inboundshipmentitemid;
													itemValidateDetails.unitText = itemISMDetailsObj[itemIndex].unitText;
													itemValidateDetails.unit = itemISMDetailsObj[itemIndex].unit;
													itemValidateDetails.uomId = itemISMDetailsObj[itemIndex].unit;
													itemValidateDetails.expectedQty = itemISMDetailsObj[itemIndex].quantityexpected;
													itemValidateDetails.vendorId = itemISMDetailsObj[itemIndex].vendor;
													
													if(itemValidateDetails.isTallyScanRequired == true)
													{
													if((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
														if (utility.isValueValid(unitType)) {
															var	uomResult = tallyScanUtility.getUOMDetails(unitType);
															log.debug('uomResult',uomResult);
															for (var itr in uomResult) {
																if (uomResult[itr]['uom.baseunit']) {
																	itemValidateDetails.uomId = uomResult[itr]['uom.internalid'];
																	itemValidateDetails.barcodeQuantity = [{
																		'value': '1',
																		'unit': uomResult[itr]['uom.internalid']
																	}];
																	break;
																}
															}
														}
													}else if (utility.isValueValid(itemValidateDetails.barcodeQuantity))
														{
															itemValidateDetails.barcodeQuantity = [{
																'value': '1',
																'unit': itemValidateDetails.barcodeQuantity[0].unit
															}];
														}
													}

													//back order qty
													backOrderQty 	= inboundUtility.getBackOrderQty(warehouseLocationId, itemInternalId);
													itemValidateDetails.backOrderQty = backOrderQty;
													itemValidateDetails.yetToBePickedQty = inboundLib.getItemYetToBePickedQty(itemInternalId,warehouseLocationId);

													log.debug('back order quantity :', backOrderQty);

													if(utility.isValueValid(unitType) && utility.isValueValid(itemISMDetailsObj[itemIndex].unitText))	{

														itemValidateDetails.unitType = unitType;
														var uomconversionrate = utility.getConversionRate(itemISMDetailsObj[itemIndex].unitText,unitType);
														itemValidateDetails.conversionRate = uomconversionrate;
														var expQty = itemISMDetailsObj[itemIndex].quantityexpected;
														var convertedExpectedQty = Number(Big(expQty).div(uomconversionrate));
														var convertedRemainingQty = Number(Big(remainingQty).div(uomconversionrate));
														itemValidateDetails.expectedQty = convertedExpectedQty;
														if(itemValidateDetails.randomTallyScan !="T"){
														itemValidateDetails.quantityRemaining = convertedRemainingQty;
														}

														if(backOrderQty != 0)
														{
															itemValidateDetails.backOrderQty = backOrderQty+' '+itemISMDetailsObj[itemIndex].unitText;
															if(stockUnitText!='' && stockUnitText!=null && itemISMDetailsObj[itemIndex].unitText!=stockUnitText)
															{
																var stockConvRate 					= utility.getConversionRate(stockUnitText, unitType);
																var tranUOMbackOrdQty 				= utility.uomConversions(parseFloat(backOrderQty),uomconversionrate,stockConvRate);															
																itemValidateDetails.backOrderQty = tranUOMbackOrdQty+' '+itemISMDetailsObj[itemIndex].unitText;
															}
														}
														if(utility.isValueValid(itemValidateDetails.yetToBePickedQty) && itemValidateDetails.yetToBePickedQty != 0){
															var tranUOMYetToBePickedQty = utility.uomConversions(parseFloat(itemValidateDetails.yetToBePickedQty),uomconversionrate,1);
															itemValidateDetails.yetToBePickedQty = tranUOMYetToBePickedQty+' '+itemISMDetailsObj[itemIndex].unitText;
														}
													}
													itemValidateDetails.info_incotermtxt =itemISMDetailsObj[itemIndex].incotermText;
													itemValidateDetails.isValid = true;
													if(printEnabled)
													{
														var isGS1Enabled = labelPrintingUtility.checkGS1Enable(warehouseLocationId);
														if(utility.isValueValid(itemInternalId) && (utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true))
														{
															if (utility.isValueValid(currItem.isItemAliasScanFlag) && currItem.isItemAliasScanFlag)
															{
																itemValidateDetails.scannedItemAliasForPrint = itemName;
															}
															else if(utility.isValueValid(currItem.isbarcodescanned) && currItem.isbarcodescanned &&
																utility.isValueValid(currItem.barcodeItem)){
																itemValidateDetails.scannedItemAliasForPrint = currItem.barcodeItem;
															}
															else {
																var itemAliasList = labelPrintingUtility.getAllItemAliasResultsForPrint(itemInternalId,itemValidateDetails.vendorId,warehouseLocationId);
																	if (itemAliasList.length > 1) {
																	itemValidateDetails.isItemAliasPopupRequired = true;
																}
															}
														}
													}
													break;
												}
											}

											itemValidateDetails.isValid = true;

										}

                                        if(ismVendorNotMatch){
											itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
											itemValidateDetails.isValid = false;
										}
										if(!isItemHasQtyToRcv && !ismVendorNotMatch){
											itemValidateDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.TRANSACTION_COMPLETED');
											itemValidateDetails.isValid = false;
										}
                                        /*if(utility.isValueValid(currItem.barcodeVendorId) && currItem.barcodeVendorId != itemValidateDetails.vendorId){
											itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
											itemValidateDetails.isValid = false;
										}*/
									}
									else{
										itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
										itemValidateDetails.isValid = false;
									}
								}
							}

						}
						else {

							if(utility.isValueValid(itemName)){
								var itemresults = searchItem(itemName);
								if (itemresults != null && itemresults.length>0) {
									var itemLoc = itemresults[0].getValue({name: 'location'});
									if (itemresults[0].getValue({name: 'isinactive'}) == true) {
										itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INACTIVE_ITEM');
									}
									else if ((utility.isValueValid(itemLoc)) && 
											(itemLoc !== warehouseLocationId) ) {
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
					}
				}
				else{
					itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
					itemValidateDetails.isValid = false;
				}
			}
			else{
				itemValidateDetails.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
				itemValidateDetails.isValid = false;
			}
		}
		catch(e){
			itemValidateDetails.isValid = false;
			itemValidateDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message});
		}
		return itemValidateDetails;
	}


	function searchItem(item){

		var itemfilters = [
		                   search.createFilter({
		                	   name: 'nameinternal',
		                	   operator: search.Operator.IS,
		                	   values: item
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

		return itemresults;
	}

	function _checkIsScannedBarCodeContainsDecimalsForSerialItem(unitType,currItem)
	{
		var vbarcodeUOM = currItem.barcodeUomName;
		var vuomconversionrate = utility.getConversionRate(vbarcodeUOM,unitType);
		var vbarcodeQty = currItem.barcodeQuantity;
		var _isDecimalQtyScanned = false;
		if((utility.isValueValid(vbarcodeQty)) && !((vbarcodeQty == 1|| vbarcodeQty =='1')
				&& vuomconversionrate == 1))
		{
			_isDecimalQtyScanned = true;
		}
		return _isDecimalQtyScanned;
	}
	function _getItemFieldsByLookup(itemID)
	{
		var columnlookupArray =[];
		columnlookupArray.push('itemid');
		columnlookupArray.push('internalid');
		columnlookupArray.push('isinactive');
		columnlookupArray.push('recordtype');
		columnlookupArray.push('usebins');
		columnlookupArray.push('unitstype');
		columnlookupArray.push('stockunit');
		columnlookupArray.push('custitem_wms_usetallyscan');

		return utility.getItemFieldsByLookup(itemID,columnlookupArray);
	}
	function _getlocationUseBinsFlag(warehouseLocationId)
	{
		var locationUseBinlFlag ='';

		var columnlocationlookupArray =[];
		columnlocationlookupArray.push('usesbins');

		var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId,columnlocationlookupArray);

		if (locationLookUp.usesbins != undefined) 
		{
			locationUseBinlFlag = locationLookUp.usesbins;
		}
		return locationUseBinlFlag;
	}
	function _checkForShipmentReceiveAllOption(shipmentId,warehouseLocationId)
	{
		var _isEligibleForReceiveAll = true;
		var results = inboundUtility.validateShipmentWithInvtDetailsForReceiveAll(shipmentId,warehouseLocationId);
		if(results.length > 0){
			for(var res in results){
				var item = results[res].item;
				if(item == '' || item == '- None -' || item == null){
					_isEligibleForReceiveAll = false;
					break;
				}
			}
		}

		return _isEligibleForReceiveAll;
	}
	function _checkForItemsUseBins(warehouseLocationId,shipmentId){
		var itemsSearch = search.load({
			id:'customsearch_wms_ism_getitemusebinsflag'
		});
		itemsSearch.filters.push(
				search.createFilter({
					name:'receivinglocation',
					operator:search.Operator.ANYOF,
					values: ['@NONE@',warehouseLocationId]
				})
		);

		itemsSearch.filters.push(search.createFilter({
			name: 'internalid',
			operator: search.Operator.ANYOF,
			values: shipmentId
		}));
		
		var itemsResult =  utility.getSearchResultInJSON(itemsSearch);
		var items = [];
		if(itemsResult.length > 0){
			for(var item = 0;item < itemsResult.length ; item++){
				if(items.indexOf(itemsResult[item].itemText) == -1){
					items.push(itemsResult[item].itemText);
				}
			}
		}
		return items;
	}
	function _checkISMPartialReceived(shipmentId,warehouseLocationId)
	{
		var orderHasLinesToReceiveAll = true;
		var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId,'',warehouseLocationId);	
		var receivedOpentaskDetails = inboundUtility.getInbShipmentReceivedOpenTaskDetails(shipmentId,warehouseLocationId);	
		var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId,'',warehouseLocationId);
		var shipmentLineCount = 0;
		var manuallyReceivedLineCount = 0;
		var quantityReceived = '';
		var shipmentLineRec = [];
		var shipmentLineNo = '';
		for (var shipmentLine in shipmentListDetails)
		{

			shipmentLineRec = shipmentListDetails[shipmentLine];
			shipmentLineNo = shipmentLineRec.inboundshipmentitemid;
			quantityReceived = shipmentLineRec.quantityreceived;
			if(JSON.stringify(receivedOpentaskDetails) != '{}')
			{
				var line = receivedOpentaskDetails[shipmentLineNo];
				if(utility.isValueValid(line))
				{
					manuallyReceivedLineCount++;
				}

			}
			else if(quantityReceived != '' && quantityReceived > 0)
			{
				manuallyReceivedLineCount++;
			}
			else if(JSON.stringify(openPutAwayDetails) != '{}')
			{
				var line = openPutAwayDetails[shipmentLineNo];
				if(utility.isValueValid(line))
				{
					manuallyReceivedLineCount++;
				}
			}
			else{}
			shipmentLineCount++;

		}
		log.debug({title:'shipmentLineCount',details:shipmentLineCount});
		log.debug({title:'manuallyReceivedLineCount',details:manuallyReceivedLineCount});
		if(shipmentLineCount > manuallyReceivedLineCount)
		{
			orderHasLinesToReceiveAll  =true;
		}
		else
		{
			orderHasLinesToReceiveAll = false;
		}
		return orderHasLinesToReceiveAll;
	}

	function getISMtotalRemainingQty(shipmentId,warehouseLocationId)	{

		var totalRemainingQtyISM =0;
		var ISMdetailsObj = inboundUtility.validateItemAgainstShipment(shipmentId,'',warehouseLocationId,true);
		log.debug('ISMdetailsObj',ISMdetailsObj);
		if (ISMdetailsObj.length > 0) {
			for(var index = 0 ; index < ISMdetailsObj.length; index ++){
				var shipmentExpectedQty = ISMdetailsObj[index].quantityexpected;
				var shipmentReceivedQty = ISMdetailsObj[index].quantityreceived;
				if(!utility.isValueValid(shipmentReceivedQty))
				{
					shipmentReceivedQty = 0;
				}
				totalRemainingQtyISM =totalRemainingQtyISM +(parseFloat(shipmentExpectedQty)-parseFloat(shipmentReceivedQty));
			}
		}
		log.debug('totalRemainingQtyISM',totalRemainingQtyISM);
		if(totalRemainingQtyISM>0){
			var totalISMopenTaskQty = this.getISMopenTaskQty(shipmentId,warehouseLocationId);
			if(parseFloat(totalISMopenTaskQty)>0)
			{
				totalRemainingQtyISM = parseFloat(totalRemainingQtyISM) - parseFloat(totalISMopenTaskQty);
			}
		}log.debug('Return totalRemainingQtyISM',totalRemainingQtyISM);
		return totalRemainingQtyISM;
	}
	function getISMopenTaskQty(shipmentId,warehouseLocationId)
	{
		var myOpentaskQuery = query.create({
			type: 'customrecord_wmsse_trn_opentask'
		});
		var warehouseCond = myOpentaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_location',
				operator: query.Operator.ANY_OF,
				values: warehouseLocationId
		});
		var shipmentCond1 = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_inbshipment',
			operator: query.Operator.ANY_OF,
			values: shipmentId
		});
		var receiveShipmentCond = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_rec_inb_shipment',
			operator: query.Operator.EMPTY
		});
		var shipmentCond2 = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_inbshipment',
			operator: query.Operator.EMPTY_NOT
		});
		var statusFlagCond = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_wms_status_flag',
			operator: query.Operator.ANY_OF,
			values: 3
		});
		var tallyscanEnabledCond = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_sku^item.custitem_wms_usetallyscan',
			operator: query.Operator.IS,
			values: true
		});
		myOpentaskQuery.condition = myOpentaskQuery.and(warehouseCond,shipmentCond1,receiveShipmentCond,shipmentCond2,statusFlagCond,tallyscanEnabledCond);
		myOpentaskQuery.columns = [
			myOpentaskQuery.createColumn({
				fieldId: 'custrecord_wmsse_act_qty',
				aggregate: query.Aggregate.SUM
			})];
		var results = myOpentaskQuery.runPaged({
			pageSize: 1000
		});
		var iterator = results.iterator();
		var openTaskRemQty = 0;
		iterator.each(function(result) {
			page = result.value;
			pageResults = page.data.results;
			openTaskRemQty = pageResults[0].values[0];
			return false;
		});
		return openTaskRemQty;
	}

	function _getBackBtnVisibilityForISM(shipmentId) {

		var ismItemValidateSearch = search.load({
			id:'customsearch_wms_ism_item_validation'
		});

		ismItemValidateSearch.filters.push(search.createFilter({
			name: 'internalid',
			operator: search.Operator.ANYOF,
			values: shipmentId
		}));
		ismItemValidateSearch.filters.push(
				search.createFilter({
					name:'type',
					join:'item',
					operator:search.Operator.ANYOF,
					values: ["InvtPart","Assembly"]
				})
			);
		ismItemValidateSearch.filters.push(
			search.createFilter({
				name:'custitem_wms_usetallyscan',
				join:'item',
				operator:search.Operator.ANYOF,
				values: true
			})
		);
		var shipmentListResult  =utility.getSearchResultInJSON(ismItemValidateSearch);
		log.debug("shipmentListResult",shipmentListResult);
				var isBinScanRequired = false;
				if(shipmentListResult.length > 0){
					isBinScanRequired = true;
				}
				log.debug("isBinScanRequired",isBinScanRequired);
				return isBinScanRequired;
		}

	return {
		'post': doPost,
		'_getlocationUseBinsFlag':_getlocationUseBinsFlag,
		'_checkIsScannedBarCodeContainsDecimalsForSerialItem':_checkIsScannedBarCodeContainsDecimalsForSerialItem,
		'_checkForShipmentReceiveAllOption':_checkForShipmentReceiveAllOption,
		'_checkISMPartialReceived':_checkISMPartialReceived,
		'_checkForItemsUseBins':_checkForItemsUseBins,
		'getISMtotalRemainingQty':getISMtotalRemainingQty,
		'getISMopenTaskQty':getISMopenTaskQty,
		'_getBackBtnVisibilityForISM':_getBackBtnVisibilityForISM
	};
});
