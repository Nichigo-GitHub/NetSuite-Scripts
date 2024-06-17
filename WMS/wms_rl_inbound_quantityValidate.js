/**
 *     Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/runtime','N/search','N/record','N/query','./wms_utility','./big','./wms_translator', './wms_inboundUtility','./wms_tallyScan_utility','./wms_inbound_utility','./wms_labelPrinting_utility'],
		/**
		 * @param {search} search
		 */
	function(runtime,search,record,query,utility,Big,translator, inboundUtility,tallyScanUtility,inboundLib,labelPrintingUtility) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {
		var transactionDetailsArray = {};
		var impactedRecords   = {};
		var fulfillmentIdArray = [];
		var debugString 	  = '';
		var itemReceipt 	  = '';
		var remainingQuantity = 0;
		var systemRuleValue   = '';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams 			= requestBody.params;
				var transactionType 		= requestParams.transactionType;
				var warehouseLocationId		= requestParams.warehouseLocationId;
				var transactionInternalId 	= requestParams.transactionInternalId;
				var transactionName 		= requestParams.transactionName;
				var itemInternalId 			= requestParams.itemInternalId;
				var transactionLineNo 		= requestParams.transactionLineNo;
				var scannedQuantity 		= requestParams.scannedQuantity;
				var statusInternalId 		= requestParams.statusInternalId;
				var lotName 				= requestParams.lotName;
				var lotExpiryDate 			= requestParams.lotExpiryDate;
				var transactionUomName 		= requestParams.transactionUomName;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var inforeceivedQuantity 	= requestParams.inforeceivedQuantity;
				var inforemainingQuantity 	= requestParams.inforemainingQuantity;
				var warehouseLocationName 	= requestParams.warehouseLocationName;
				var invtStatus 				= requestParams.invtStatus;
				var actualBeginTime  		= requestParams.actualBeginTime;
				var backOrderQty			= requestParams.backOrderQty;
				var locationUseBinlFlag 	= requestParams.locUseBinsFlag;
				remainingQuantity 			= requestParams.remainingQuantity;
				var isTallyScanRequired 	= requestParams.isTallyScanRequired;
				var tallyLoopObj            = requestParams.tallyLoopObj;
				var itemType                = requestParams.itemType;
				var numberOftimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				var btnClicked                 =  requestParams.btnElementName;
				var isKitComponent          = requestParams.isKitComponent;
				var parentItem              = requestParams.parentItem;
				var parentItemLine          = requestParams.parentItemLine;
				var targetLocation        =requestParams.targetlocation;
				var targetSubsidiary      =requestParams.targetsubsidiary;
				var selectedInvtStatusName =requestParams.selectedInvtStatusName;
				var tempBtnClicked         =  requestParams.tempButtonName;//F_RT
				var randomTallyScanRule = requestParams.randomTallyScan;//F_RT
				var qtyUomSelected = requestParams.qtyUomSelected;//F_RT
				var transcationUomInternalId = requestParams.transcationUomInternalId;//F_RT
				var unitType = requestParams.unitType;//F_RT
				var itemName = requestParams.itemName;//F_RT
				var lotScanned = requestParams.lotScanned;//F_RT
				var printEnabled = requestParams.printEnabled;//F_RT
				var backBtnVisibility = requestParams.backBtnVisibility;//F_RT

                if(utility.isValueValid(requestParams.restock)) {
                    var restock = requestParams.restock;
                    if(restock == false) {
                        var writeoffPreference = runtime.getCurrentUser().getPreference('WRITEOFFACCOUNT');
                        if(!utility.isValueValid(writeoffPreference)) {
                            transactionDetailsArray.isValid 	 = false;
                            transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_RESTOCK');
                            return transactionDetailsArray;
                        }
                    }
                }

                log.debug({title:'targetLocation',details:targetLocation});
				log.debug({title:'targetSubsidiary',details:targetSubsidiary});

				log.debug({title:'requestParams',details:requestParams});
				if(!utility.isValueValid(isTallyScanRequired)){
					isTallyScanRequired = false;
				}
				var overageReceiveEnabled = false;
				if(transactionType != 'transferorder')
				{
					overageReceiveEnabled = inboundUtility.getPoOverage(transactionType);
				}


					if(!utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(transactionUomName)){
						transactionUomConversionRate =	getTransactionConversionRate(itemInternalId,transactionUomName);
					}
					if(!utility.isValueValid(transactionUomConversionRate)){
						transactionUomConversionRate = 1;
					}
				   var tallyScanRemainingQty = 0;

				if(!utility.isValueValid(randomTallyScanRule)){
					randomTallyScanRule = 'F';
				}
				if(randomTallyScanRule == 'T'){
					quantityScanned = remainingQuantity;
					tallyScanRemainingQty = remainingQuantity;
					var barcodeQtyObject = utility.isValueValid(requestParams.barcodeQuantity) ? requestParams.barcodeQuantity[0] : '';
					if(utility.isValueValid(barcodeQtyObject)){
						scannedQuantity = barcodeQtyObject.value;
					}
				}

				if(utility.isValueValid(requestParams.barcodeQuantity)){
					transactionDetailsArray.barcodeQuantity  = requestParams.barcodeQuantity[0];
				}
				var selectedConversionRate = 1;
				var useitemcostflag =false;
				var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
				var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();

				if(utility.isValueValid(remainingQuantity) && randomTallyScanRule != "T"){
					remainingQuantity = parseFloat(remainingQuantity);
					var quantityScanned = scannedQuantity;
					if(isTallyScanRequired == true){

						var barcodeQtyObject = utility.isValueValid(requestParams.barcodeQuantity) ? requestParams.barcodeQuantity[0] : '';
						if(utility.isValueValid(barcodeQtyObject)){
							scannedQuantity = barcodeQtyObject.value;
						}
						if(utility.isValueValid(requestParams.qtyUomSelected)){
							var qtyUomSelected = requestParams.qtyUomSelected;
							if(utility.isValueValid(requestParams.qtyUomSelected[0].unit) && itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"){
								selectedConversionRate = qtyUomSelected[0].conversionrate;
							}
							var remianingQtyWithConversionRate = Number(Big(remainingQuantity).mul(transactionUomConversionRate));
							remianingQtyWithConversionRate  = Number(Big(parseFloat(remianingQtyWithConversionRate)).minus(selectedConversionRate));
							tallyScanRemainingQty    =  Number(Big(remianingQtyWithConversionRate).div(transactionUomConversionRate));
							quantityScanned =  Number(Big(scannedQuantity).mul(selectedConversionRate));
							quantityScanned =  Number(Big(quantityScanned).div(transactionUomConversionRate));
							remainingQuantity        =  Number(Big(parseFloat(tallyScanRemainingQty)).plus(quantityScanned));

						}
						transactionDetailsArray.remainingQuantity  = tallyScanRemainingQty;
					}

				}

				if( ((utility.isValueValid(quantityScanned) && !isNaN(quantityScanned) && (quantityScanned > 0)  &&
						(remainingQuantity >= parseFloat(quantityScanned))) || (overageReceiveEnabled==true)) &&
						utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId) && utility.isValueValid(transactionName) &&
						utility.isValueValid(itemInternalId)&& utility.isValueValid(transactionLineNo))
				{
					var itemDetailsObj = {};
					transactionDetailsArray.isValid = true;
					transactionDetailsArray.lotPageNavigationRequiredForTS = "F";//F_RT
					transactionDetailsArray.itemType = requestParams["item_type"];//F_RT
					transactionDetailsArray.transactionLineNo = requestParams.transactionLineNo;//F_RT
					transactionDetailsArray.itemDescription = requestParams.itemDescription;//F_RT
					transactionDetailsArray.itemName =  requestParams.fetcheditemname;//F_RT
					transactionDetailsArray.itemInternalId = requestParams.fetcheditemid;//F_RT
					transactionDetailsArray.enteredQtyInEach = requestParams.enteredQtyInEach;//F_RT
					transactionDetailsArray.serialPageNavigationRequiredForTS = 'F';//F_RT
					transactionDetailsArray.transactionUomConversionRate = transactionUomConversionRate;//F_R
					transactionDetailsArray.transactionUomName = transactionUomName;//F_R// T
					transactionDetailsArray.transcationUomInternalId = transcationUomInternalId;//F_RT
					transactionDetailsArray.unitType = unitType;//F_RT
					transactionDetailsArray.itemName = itemName;//F_RT
					transactionDetailsArray.isItemAliasPopupRequired =false;
					transactionDetailsArray.isLastScanForItem = false;
					transactionDetailsArray.itemAliasObject= requestParams.itemAliasObject;


					if(isTallyScanRequired == true) {

						tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
						if(itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")
						{
							if(utility.isValueValid(requestParams.tallyScanItem) && (btnClicked != 'Skip')){

								itemDetailsObj.tallyScanItem = requestParams.tallyScanItem;
								itemDetailsObj.tallyScanSerial = requestParams.tallyScanItem;
								itemDetailsObj.pickTaskId = requestParams.tallyScanItem;
								itemDetailsObj.warehouseLocationId = warehouseLocationId;
								itemDetailsObj.unitType = requestParams.unitType;
								itemDetailsObj.transactionUomName = transactionUomName;
								if(randomTallyScanRule != "T") {
									itemDetailsObj.uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
								}
								itemDetailsObj.qtyUomSelected = requestParams.qtyUomSelected;
								itemDetailsObj.barcodeQuantity = requestParams.barcodeQuantity;
								itemDetailsObj.pickItemId = itemInternalId;
								itemDetailsObj.InvStatusInternalId = requestParams.invtStatus;
								itemDetailsObj.taskType = 9;
								var processType = 'inboundProcess';
								if(transactionType == 'transferorder'){
									processType = '';
								}
								transactionDetailsArray = tallyScanUtility.validateItemTallyScan(itemDetailsObj,processType,requestParams.VendorId,transactionInternalId);
								transactionDetailsArray.remainingQuantity = tallyScanRemainingQty;
								transactionDetailsArray.itemInternalId = transactionDetailsArray.tallyScanitemId;
								transactionDetailsArray.transactionLineNo = requestParams.transactionLineNo;//F_RT
								if(randomTallyScanRule != "T"){
									transactionDetailsArray.transactionUomConversionRate = transactionUomConversionRate;//F_R
									transactionDetailsArray.transactionUomName = transactionUomName;//F_R// T
									transactionDetailsArray.transcationUomInternalId = transcationUomInternalId;//F_RT
									transactionDetailsArray.unitType = unitType;//F_RT
									transactionDetailsArray.itemName = itemName;//F_RT
								}
								if(!utility.isValueValid(transactionDetailsArray.internalid)){
									transactionDetailsArray.internalid = utility.isValueValid(transactionDetailsArray.barcodeIteminternalid) ? transactionDetailsArray.barcodeIteminternalid : transactionDetailsArray.itemInternalId;
								}
								if(utility.isValueValid(transactionDetailsArray.errorMessage)){
									transactionDetailsArray.isValid = false;
								}
								else {

									if (transactionDetailsArray.internalid != itemInternalId &&
										randomTallyScanRule != "T") {
											transactionDetailsArray.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.INVALID_INPUT');
											transactionDetailsArray.isValid = false;
									}
									else{
										if(randomTallyScanRule == "T" && transactionDetailsArray.isValid != false) {//new item scanned
																					var itemdtlsObject = inboundUtility.validateScannedItemForTallyScan(transactionDetailsArray.internalid);
																				 if(utility.isValueValid(itemdtlsObject.errorMessage)){
											 transactionDetailsArray.errorMessage = itemdtlsObject.errorMessage;
											 transactionDetailsArray.isValid = false;
										 }
										 else{
											 itemType = itemdtlsObject.itemType;
											 itemInternalId = itemdtlsObject.itemInternalId;
											 transactionDetailsArray.itemType = itemType;
											 transactionDetailsArray.itemInternalId = itemInternalId;
										 }

										}
									}
								}
									if((randomTallyScanRule == "T" && transactionDetailsArray.isValid != false)||(tempBtnClicked =="PrintAction")){
									var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
										this._validateScannedItemAgainstTransaction(transactionDetailsArray,inventoryStatusFeature,
										 tallyLoopObj,transactionName,itemInternalId,
										 warehouseLocationId,transactionInternalId,
										 transactionType,
										 centralizesPurchasingandBilling,
										 warehouseLocationName,itemType,
										 tallyScanRemainingQty,
										 transactionUomConversionRate,
										 overageReceiveEnabled,invtStatus,qtyUomSelected,
                                            backOrderQty,requestParams.tallyScanItem,requestParams.numberOfTimesSerialScanned,
										lotName,locationUseBinlFlag,scannedQuantity,lotScanned,requestParams.scannedserialsArr);
										 if(itemType == "lotnumberedinventoryitem" ||itemType == "lotnumberedassemblyitem"){
											lotName = transactionDetailsArray.lotName;
											//transactionDetailsArray.lotScanned = lotScanned;
										}
										if(printEnabled && transactionType == 'purchaseorder' && transactionDetailsArray.isValid != false ){
											var itemAliasObject = requestParams.itemAliasObject;
											this.getItemAliasResults(itemInternalId,warehouseLocationId,requestParams.VendorId,requestParams.tallyScanItem,transactionDetailsArray,itemAliasObject,transactionDetailsArray.transactionLineNo);
											transactionDetailsArray.itemAliasObject= itemAliasObject;
											if(transactionDetailsArray.isLastScanForItem == true && transactionDetailsArray.isItemAliasPopupRequired == true){
												transactionDetailsArray.printFlag = false;
											}
											log.debug('AfterItemAlias transactionDetailsArray.printFlag',transactionDetailsArray.printFlag);
										}
								}
							}
							else{
								log.debug('tallyScanRemainingQty',tallyScanRemainingQty);

								if(btnClicked != 'Skip')
								{
									transactionDetailsArray.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.EMPTY_INPUT');
									transactionDetailsArray.isValid = false;
								}
							}
						}
						else{
							if((utility.isValueValid(requestParams.tallyScanItem) && btnClicked != 'Skip' )|| btnClicked == 'Done'){
								if(utility.isValueValid(requestParams.qtyUomSelected) && utility.isValueValid(requestParams.uomSelectionforFirstItr)){
									var qtyUomSelected = requestParams.qtyUomSelected;
									var currentSelectedUnit = qtyUomSelected[0].unit;
									if(utility.isValueValid(currentSelectedUnit) && currentSelectedUnit != requestParams.uomSelectionforFirstItr && randomTallyScanRule != 'T'){
										transactionDetailsArray.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
										transactionDetailsArray.isValid = false;
									}
									else{
										if(randomTallyScanRule == 'T') {
										transactionDetailsArray.uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
										}
									}
								}
								else{
									if(!utility.isValueValid(requestParams.uomSelectionforFirstItr) && utility.isValueValid(requestParams.qtyUomSelected)){
										if (utility.isValueValid(requestParams.unitType)) {
											uomResult = tallyScanUtility.getUOMDetails(requestParams.unitType);
											for (var itr in uomResult) {
												if (uomResult[itr]['uom.baseunit']) {
													transactionDetailsArray.uomSelectionforFirstItr = uomResult[itr]['uom.internalid'];
													break;
												}
											}
										}
									}
								}
								transactionDetailsArray.remainingQuantity  = tallyScanRemainingQty;
								var enteredQtyinEach = requestParams.enteredQtyInEach;

								if(randomTallyScanRule == 'T'){
									transactionDetailsArray.remainingQuantity  = tallyScanRemainingQty-1;
									var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
									var key = transactionName + (inventoryStatusFeature ? '_' + requestParams.invtStatus : "") + "^" + itemInternalId + "^" + transactionDetailsArray.transactionLineNo;
									if(!utility.isValueValid(numberOftimesSerialScanned)){
										numberOftimesSerialScanned = 0;
									}
									var scanQty = parseInt(numberOftimesSerialScanned)+1;
									log.debug("scanQty",scanQty);
									log.debug("enteredQtyinEach",enteredQtyinEach);
									if ((scanQty >= enteredQtyinEach && tallyScanRemainingQty > 0) || btnClicked == 'Done')  {
										transactionDetailsArray.itemType = "inventoryitem";
									}
									else{
										if(btnClicked != 'Done') {
											transactionDetailsArray.showDoneBtn = 'T';
										}
									}
								}
							}
							else{
								if(btnClicked != 'Skip' && btnClicked != 'Done')
								{
									transactionDetailsArray.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
									transactionDetailsArray.isValid = false;
								}
							}

						}

					}
					if(transactionDetailsArray.isValid != false && transactionDetailsArray.lotPageNavigationRequiredForTS !='T'
							&& transactionDetailsArray.serialPageNavigationRequiredForTS != 'T' && tempBtnClicked !="PrintAction")
					{
						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
						var itemSearchResults 	   = this.getItemCustomDetails(itemInternalId,warehouseLocationId);
						if(itemSearchResults == null || itemSearchResults == '' || itemSearchResults == 'null')
						{
							transactionDetailsArray.errorMessage = translator.getTranslationString("PO_QUANTITYVALIDATE.INACTIVE_ITEM");
							transactionDetailsArray.isValid 	 = false;
						}
						else
						{
							var itemSearchObj   = itemSearchResults[0];
							var itemType	 	= itemSearchObj.recordType;
							systemRuleValue 	= utility.getSystemRuleValue('Required Serialnumber scan for full quantity receive?',warehouseLocationId);
							transactionDetailsArray.isBinScanRequired = true;
							if(locationUseBinlFlag=='undefined' || locationUseBinlFlag=='' || locationUseBinlFlag=='null'
								|| locationUseBinlFlag==null)
							{
								var columnlocationlookupArray =[];
								columnlocationlookupArray.push('usesbins');

								var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId,columnlocationlookupArray);
								if (locationLookUp.usesbins != undefined)
								{
									locationUseBinlFlag = locationLookUp.usesbins;
								}
							}
							if((itemType == "serializedinventoryitem"  || itemType=="serializedassemblyitem")
								&& (transactionDetailsArray.isValid == true))
							{
								impactedRecords._ignoreUpdate = true;
								if(!utility.isValueValid(transactionUomConversionRate))
								{
									transactionUomConversionRate = 1;
								}
								var convertionQty = (scannedQuantity)*(transactionUomConversionRate);
								if(convertionQty.toString().indexOf('.') != -1)
								{
									transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
									transactionDetailsArray.isValid   	 = false;
								}
								else
								{
									if(isTallyScanRequired != true ){
										debugString = debugString + ",convertionQty :"+convertionQty;
										transactionDetailsArray.transactionUomConvertedQty = convertionQty;
										transactionDetailsArray.numberOfTimesSerialScanned =0;
										transactionDetailsArray.errorMessage = '';
										transactionDetailsArray.isValid = true;
									}
									else{
										if((!utility.isValueValid(numberOftimesSerialScanned) || numberOftimesSerialScanned == 0 ||
												numberOftimesSerialScanned == '0' || randomTallyScanRule == "T") ||
											(utility.isValueValid(requestParams.tallyScanItem) && utility.isValueValid(numberOftimesSerialScanned) &&
												parseInt(numberOftimesSerialScanned) > 0 && (btnClicked != 'Skip' && btnClicked != 'Done'))){
											if(!utility.isValueValid(numberOftimesSerialScanned) && randomTallyScanRule != "T"){
												numberOftimesSerialScanned = 0;
											}
											numberOftimesSerialScanned = parseInt(numberOftimesSerialScanned);
											var lineNo = transactionLineNo;
											var openTaskRecId = 0;
											if(randomTallyScanRule == "T"){
												lineNo = transactionDetailsArray.transactionLineNo;
												 openTaskRecId =_getOpenTask(transactionInternalId,lineNo,inventoryStatusFeature,requestParams.invtStatus,locationUseBinlFlag,'',[]);
												   var binLoc = "";
												 if(utility.isValueValid(openTaskRecId)) {
													   var openTaskRec = record.load({
														   type: 'customrecord_wmsse_trn_opentask',
														   id: openTaskRecId
													   });
													 binLoc = openTaskRec.getValue({fieldId: 'custrecord_wmsse_actbeginloc'});
												   }
												  if(utility.isValueValid(openTaskRecId) && !utility.isValueValid(binLoc) && numberOftimesSerialScanned == 0 &&
													  (tallyLoopObj[key] == undefined || tallyLoopObj[key] == "") ){
													  record.delete({
														  type: 'customrecord_wmsse_trn_opentask',
														  id: parseInt(openTaskRecId)
													  });
													  openTaskRecId = 0;
												  }
											}
											//The below code is to close the already scanned serials if the back button is clicked.
											var serialSearchResults = inboundUtility.getSerialsFromSerialEntryForInboundProcesses(lineNo,transactionInternalId,"");
											var serialSearchResultsLength = serialSearchResults.length;
											var serialArrFromSerialEntry = [];
											log.debug("serialSearchResults",serialSearchResults);
											if(serialSearchResultsLength > 0) {
												var serialsArr = [];
												var opentaskSerials = [];
												if(utility.isValueValid(requestParams.scannedserialsArr)){
													serialsArr = requestParams.scannedserialsArr;
												}
												if( randomTallyScanRule == 'T' && locationUseBinlFlag == true){
													opentaskSerials = _getSerials(transactionInternalId,lineNo);
												}

												for (var serialRec = 0; serialRec < serialSearchResultsLength; serialRec++) {
													var serialEntryRecord = serialSearchResults[serialRec];

													if(((numberOftimesSerialScanned == 0 || numberOftimesSerialScanned == '0')
															&& opentaskSerials.indexOf(serialEntryRecord.name) == -1) ||
														(serialsArr.indexOf(serialEntryRecord.name) == -1 &&
															numberOftimesSerialScanned > 0 && opentaskSerials.indexOf(serialEntryRecord.name) == -1)) {
														inboundUtility.closeSerialInSerialEntry(serialEntryRecord.id, serialEntryRecord.name);
													}
													else{
														serialArrFromSerialEntry.push(serialEntryRecord.name);
													}
												}


											}
										}

										if(btnClicked != 'Skip' && btnClicked != 'Done'){

											var serialName =  requestParams.tallyScanItem;
											var manuallyPostIrSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',
												warehouseLocationId,transactionType);
											if(transactionType == 'purchaseorder') {
												var currItem = utility.getSKUIdWithName(serialName, warehouseLocationId,requestParams.VendorId,transactionInternalId);
												log.debug("currItem",currItem);
												if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error)))) {
													var barcodeItemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);
													if (itemInternalId == barcodeItemInternalId) {
														if (utility.isValueValid(currItem.barcodeSerialname)) {
															serialName = currItem.barcodeSerialname;
															requestParams.tallyScanItem = serialName;
														}
													}
												}
											}
											if(openTaskRecId > 0 && randomTallyScanRule == 'T' && serialArrFromSerialEntry.length >0) {
												inboundUtility.updateOpentaskFields(openTaskRecId,'', serialArrFromSerialEntry,'');
											}
											inboundLib.checkSerialAlreadyExistsInInventory(itemInternalId,serialName,warehouseLocationId,
												manuallyPostIrSystemRuleValue,transactionDetailsArray,transactionLineNo,transactionInternalId);
											if (transactionDetailsArray.isValid == true) {

												var isValidSerialScannedForTO = false;
												if(transactionType == 'transferorder'){
													var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
													if(inventoryStatusFeature == false){
														var getOrderLineNo = parseInt(transactionLineNo)+1;
														var transferOrderSerialFulfillmentDetails = inboundUtility.getTOfulfilledLotDetails(transactionInternalId,itemInternalId,getOrderLineNo);
														if(transferOrderSerialFulfillmentDetails.length > 0){
															for (var row = 0;row < transferOrderSerialFulfillmentDetails.length ; row++) {
																if(requestParams.tallyScanItem == transferOrderSerialFulfillmentDetails[row].serialnumber){
																	isValidSerialScannedForTO = true;
																	break;
																}

															}

														}
													}
													else{
														isValidSerialScannedForTO =	this.validateSerialFromIF(transactionInternalId,itemInternalId,transactionLineNo,invtStatus,requestParams.tallyScanItem);
													}
													if(!isValidSerialScannedForTO){
														transactionDetailsArray.isValid = false;
														transactionDetailsArray.errorMessage = translator.getTranslationString("TO_SERIALVALIDATION.MUST_FULFILLED");
													}
												}
												log.debug('transactionDetailsArray.isValid',transactionDetailsArray.isValid);
												if(transactionDetailsArray.isValid == true){
													transactionDetailsArray.serialNo = requestParams.tallyScanItem;
													var scannedSerialsArr = [];
													if(utility.isValueValid(requestParams.scannedserialsArr)){
														scannedSerialsArr = requestParams.scannedserialsArr;
													}
													if(utility.isValueValid(requestParams.tallyScanItem)) {
														scannedSerialsArr.push(requestParams.tallyScanItem);
														transactionDetailsArray.scannedserialsArr = scannedSerialsArr;

													}

													transactionDetailsArray.numberOfTimesSerialScanned = parseFloat(numberOftimesSerialScanned) + 1;

													var createSerialObj = {};
													createSerialObj.serialName = serialName;
													createSerialObj.transactionInternalId = transactionInternalId;
													createSerialObj.transactionLineNo = transactionLineNo;
													createSerialObj.itemInternalId = itemInternalId;
													createSerialObj.quantity = 1;
													createSerialObj.serialStatus = false;
													createSerialObj.taskType = 2;
													createSerialObj.inventoryStatus = invtStatus;

													var serialEntryRecordId = inboundUtility.createRecordInWMSSerialEntryCustomRecord(createSerialObj);
													transactionDetailsArray.serialEntryRecordId = serialEntryRecordId;
													transactionDetailsArray.errorMessage = '';
													transactionDetailsArray.isValid = true;


												}
											}
										}


									}

								}
							}
							if(transactionDetailsArray.isValid != false){
							var noStockQty = parseFloat(scannedQuantity);
							if(isTallyScanRequired == true ){
								var barcodeQty = parseInt(scannedQuantity)+1;
								var qtyUomSelected = requestParams.qtyUomSelected;
								var unitSelected = '';
								if(utility.isValueValid(qtyUomSelected) && utility.isValueValid(qtyUomSelected[0].unit)
										&& (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")){
									unitSelected = qtyUomSelected[0].unit;
									transactionDetailsArray.selectedConversionRateForTallyScan = qtyUomSelected[0].conversionrate;
								}
								if(randomTallyScanRule == 'T' ){

										transactionDetailsArray.barcodeQuantity = [{
											'value': barcodeQty,
											'unit': ""
										}];
										transactionDetailsArray.selectedConversionRateForTallyScan = "";

								}
								else {
									transactionDetailsArray.barcodeQuantity = [{
										'value': barcodeQty,
										'unit': unitSelected
									}];
								}
								if(btnClicked != 'Skip' && btnClicked != 'Done'){
									if(transactionDetailsArray.remainingQuantity){
										transactionDetailsArray.remainingQuantityForTallyScanLoop = transactionDetailsArray.remainingQuantity;
										if(utility.isValueValid(transactionUomConversionRate)){
											transactionDetailsArray.remainingQuantityForTallyScanLoop = Number(Big(transactionDetailsArray.remainingQuantity).mul(transactionUomConversionRate));
										}
									}

									transactionDetailsArray.isSamePageNavigationRequired =  false;
									if(parseFloat(transactionDetailsArray.remainingQuantityForTallyScanLoop) >= 1 || (overageReceiveEnabled == true && isTallyScanRequired == true &&
										randomTallyScanRule =="T")){
										transactionDetailsArray.isSamePageNavigationRequired =  true;
										if (utility.isValueValid(selectedInvtStatusName)){
											transactionDetailsArray.defaultInventoryStatus = selectedInvtStatusName;
										}
									}

									var	qty = 1;
									var itemInternalID = transactionDetailsArray.internalid;
									var lotName1 = lotName;
									var lotExpiryDate1 = lotExpiryDate;
									if(randomTallyScanRule == 'T') {
										if(itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"
											&& itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"
											&& itemType != "inventoryitem" && itemType != "assemblyitem"){
											invtStatus = "";

										}

										if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
											itemInternalID = itemInternalId;
										}
										var openTaskIdFromTallyLoopObj = "";
										var key = '';
										if (lotName != undefined && lotName != '' && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
											key = lotName + '_' + transactionName + (inventoryStatusFeature ? '_' + invtStatus : '') + "^" + itemInternalId + "^" + transactionDetailsArray.transactionLineNo;
										} else {
											key = transactionName + (inventoryStatusFeature ? '_' + invtStatus : '') + "^" + itemInternalId + "^" + transactionDetailsArray.transactionLineNo;
										}
										var tallyscanQty = 0;
										var quantityWithConvRate = 1;
										if (utility.isValueValid(tallyLoopObj[key])) {
											openTaskIdFromTallyLoopObj = tallyLoopObj[key].openTaskId;
											if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {
											if(utility.isValueValid(transactionDetailsArray.poRemainingQty)) {
												var lineItemRemQty = Number(Big(transactionDetailsArray.poRemainingQty).minus(tallyLoopObj[key].quantity));
												if (lineItemRemQty > 0 && lineItemRemQty < 1) {
													var baseUnitConversionRate = 1;
													if (utility.isValueValid(transactionDetailsArray.unitType)) {
														var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsArray.unitType);
														for (var itr in uomResult) {
															if (uomResult[itr]['uom.baseunit']) {
																baseUnitConversionRate = uomResult[itr]['uom.conversionrate'];
																break;
															}
														}
														var transactionQty = Number(Big(baseUnitConversionRate).div(transactionDetailsArray.transactionUomConversionRate));
														tallyscanQty = Number(Big(tallyLoopObj[key].quantity).plus(transactionQty));
														qty = transactionQty;
													}

												} else {
													tallyscanQty = tallyLoopObj[key].quantity + 1;
												}
											}
											else{
												tallyscanQty = tallyLoopObj[key].quantity + 1;
											}
										}
											else{
												tallyscanQty = tallyLoopObj[key].quantity + 1;
												if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
													if (utility.isValueValid(transactionDetailsArray.unitType)) {
														var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsArray.unitType);
														for (var itr in uomResult) {
															if (uomResult[itr]['uom.baseunit']) {
																if (uomResult[itr]['uom.internalid'] != transactionDetailsArray.transactionUomInternalId) {
																	var qtyWithConvRate = Number(Big(quantityWithConvRate).div(transactionDetailsArray.transactionUomConversionRate));
																	tallyscanQty = Number(Big(tallyLoopObj[key].quantity).plus(qtyWithConvRate));
																	qty = qtyWithConvRate;
																	break;
																}
															}

														}
													}
												}
											}
										}
										else {
											var lot = "";
											var scannedLotArr = [];
											if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
												lot = lotName;

												for (var obj in tallyLoopObj) {
													if (transactionDetailsArray.transactionLineNo == tallyLoopObj[obj].line) {
														scannedLotArr.push(tallyLoopObj[obj].lotName);
													}
												}
											}
											openTaskIdFromTallyLoopObj = _getOpenTask(transactionInternalId, transactionDetailsArray.transactionLineNo,
												inventoryStatusFeature, invtStatus, locationUseBinlFlag, lot, scannedLotArr);
											tallyscanQty = 1;
											if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"
												&& itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"
												&& itemType != "inventoryitem" && itemType != "assemblyitem") {
												openTaskIdFromTallyLoopObj = "";
											}

											if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
												if (utility.isValueValid(transactionDetailsArray.unitType)) {
													var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsArray.unitType);
													log.debug("quantityWithConvRatebb", quantityWithConvRate);
													for (var itr in uomResult) {
														if (uomResult[itr]['uom.baseunit']) {
															if (uomResult[itr]['uom.internalid'] != transactionDetailsArray.transactionUomInternalId) {
																quantityWithConvRate = Number(Big(quantityWithConvRate).div(transactionDetailsArray.transactionUomConversionRate));
																tallyscanQty = quantityWithConvRate;
																qty = tallyscanQty;
																break;
															}
														}

													}
													log.debug("quantityWithConvRateaa", quantityWithConvRate);
												}
											}
										}

										log.debug("qtyUomSelected", qtyUomSelected);
										var objOpentaskDetails = {};

										if (!utility.isValueValid(openTaskIdFromTallyLoopObj)) {
											objOpentaskDetails = {
												"poInternalId": transactionInternalId,
												"FetchedItemId": itemInternalId,
												"poLineno": transactionDetailsArray.transactionLineNo,
												"enterQty": quantityWithConvRate,
												"itemType": itemType,
												"whLocation": warehouseLocationId,
												"poname": transactionName,
												"PutStrategy": "",
												"zoneno": "",
												"taskType": "3",
												"trantype": transactionType,
												"actualBeginTime": actualBeginTime,
												"uom": transactionDetailsArray.transactionUomName,
												"conversionRate": transactionDetailsArray.transactionUomConversionRate,
												"vInvStatus_select": invtStatus,
												"expectedQty": quantityWithConvRate,
												"lotNo": lotName,
												"expiryDate": lotExpiryDate,
												"randomTallyscan": "T"
											}

											var recomendedBinId = '';
											var recomendedBinName = '';
											if (utility.isValueValid(locationUseBinlFlag) && locationUseBinlFlag == true) {
												var itemInputObj = {};
												itemInputObj.itemId = itemInternalID;
												itemInputObj.whLocation = warehouseLocationId;
												itemInputObj.itemType = itemType;
												itemInputObj.lotName = lotName;
												itemInputObj.fromStatusId = invtStatus;

												var binObject = inboundUtility.getRecommendedBinForCartMoves(itemInputObj);
												if (JSON.stringify(binObject) != '{}') {
													recomendedBinId = binObject.recomendedBinId;
													recomendedBinName = binObject.recomendedBinName;
													objOpentaskDetails.enterBin = recomendedBinId;
													objOpentaskDetails.recomendedBinSequenceNo = binObject.recomendedBinSequenceNo;
												}
											}
										}
										if (itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem" ) {
											lotName1 = "";
											lotExpiryDate1 = "";
										}

										transactionDetailsArray.openTaskId = inboundUtility.createOrUpdateOpentask(openTaskIdFromTallyLoopObj, tallyscanQty, objOpentaskDetails, warehouseLocationId,lotName1);
										if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
											if(randomTallyScanRule=='T' && utility.isValueValid(serialEntryRecordId) && utility.isValueValid(transactionDetailsArray.openTaskId)){

												if(serialArrFromSerialEntry.indexOf(requestParams.tallyScanItem)==-1){
													serialArrFromSerialEntry.push(requestParams.tallyScanItem);
												}
												inboundUtility.updateOpentaskFields(transactionDetailsArray.openTaskId,'',serialArrFromSerialEntry);

											}
										}
									}
									transactionDetailsArray.tallyLoopObj =  tallyScanUtility.createOrUpdateTallyScanJSONObject(tallyLoopObj, '', lotName1, qty , invtStatus,
											transactionName,lotExpiryDate1,itemInternalID,transactionDetailsArray.transactionLineNo,
										transactionDetailsArray.itemName,recomendedBinName,recomendedBinId,transactionDetailsArray.openTaskId,transactionDetailsArray.selectedConversionRateForTallyScan,randomTallyScanRule);
								}

							}
							log.debug('transactionDetailsArray.isValid',transactionDetailsArray);


								if((itemType != "noninventoryitem" && itemType != "otherchargeitem" &&
										itemType!="serviceitem" && itemType!="downloaditem" && itemType!="giftcertificateitem" && locationUseBinlFlag ==  true)
										|| (locationUseBinlFlag ==  false &&
												((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem") &&
														(!utility.isValueValid(isTallyScanRequired) || isTallyScanRequired == false))))
								{
									// transfer order
									if(transactionType == 'transferorder')
									{
										if(inventoryStatusFeature){

											var getToQuantityCheckObj = {};
											getToQuantityCheckObj.transactionInternalId=transactionInternalId;
											getToQuantityCheckObj.itemInternalId=itemInternalId;
											getToQuantityCheckObj.transactionLineNo=transactionLineNo;
											getToQuantityCheckObj.lotName=lotName;
											getToQuantityCheckObj.itemType=itemType;
											getToQuantityCheckObj.statusInternalId=statusInternalId;
											getToQuantityCheckObj.inventoryStatusFeature=inventoryStatusFeature;
											getToQuantityCheckObj.warehouseLocationId=warehouseLocationId;
											getToQuantityCheckObj.scannedQuantity=scannedQuantity;
											getToQuantityCheckObj.transactionDetailsArray=transactionDetailsArray;

											if(isTallyScanRequired ) {
																									var key ="";
												if(lotName != undefined && lotName != '' && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')){
													key = lotName + '_' + transactionName + (inventoryStatusFeature ? '_' + statusInternalId : '');
												}else {
													key = transactionName + (inventoryStatusFeature ? '_' + statusInternalId : '');
												}
												if (utility.isValueValid(tallyLoopObj[key])) {
													getToQuantityCheckObj.scannedQuantity = Number(Big(tallyLoopObj[key]['quantity']));
												}
											}
											transactionDetailsArray = inboundLib.getToQuantityCheck(getToQuantityCheckObj);
										}
										else{
											transactionDetailsArray.scannedQuantity = scannedQuantity;
											transactionDetailsArray.isValid = true;
										}
									}
									else{
										transactionDetailsArray.isValid = true;
									}
									if(utility.isValueValid(transactionUomName)){
										transactionDetailsArray.infoscannedQuantity = scannedQuantity + " " + transactionUomName;
									}
									else{
										transactionDetailsArray.infoscannedQuantity = scannedQuantity;
									}
								}
								else
								{
									if(itemType == "noninventoryitem" || itemType == "otherchargeitem" ||
											itemType =="serviceitem" || itemType =="downloaditem" || itemType =="giftcertificateitem"
												|| (locationUseBinlFlag ==  false &&
														((itemType != "serializedinventoryitem"  && itemType!="serializedassemblyitem") ||
																(isTallyScanRequired == true))))
									{
										transactionDetailsArray.isBinScanRequired = false;
										if(!utility.isValueValid(randomTallyScanRule) || randomTallyScanRule != 'T'){
											backBtnVisibility = false;
										}
										if(btnClicked == 'Skip' && randomTallyScanRule == 'T' && locationUseBinlFlag == false){
											backBtnVisibility = false;
										}
										log.debug("btnClicked",btnClicked);
										log.debug("randomTallyScanRule",randomTallyScanRule);
										log.debug("locationUseBinlFlag",locationUseBinlFlag);
										log.debug("backBtnVisibility",backBtnVisibility);
										if(!utility.isValueValid(isTallyScanRequired) || isTallyScanRequired == false ||
												(isTallyScanRequired == true &&
														(transactionDetailsArray.remainingQuantity == 0 && backBtnVisibility == false)
																|| (btnClicked == 'Skip' && backBtnVisibility == false))){
											var isValid 			=  true;
											systemRuleValue 		= utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
											transactionDetailsArray.systemRuleValue        = systemRuleValue;
											transactionDetailsArray.warehouseLocationName  = warehouseLocationName;

											if(transactionType == 'transferorder')
											{
												fulfillmentIdArray = inboundUtility.getFulFillmentId(transactionInternalId,itemInternalId,transactionLineNo,lotName,itemType,invtStatus,inventoryStatusFeature);
												var getToQuantityCheckObj = {};
												getToQuantityCheckObj.transactionInternalId=transactionInternalId;
												getToQuantityCheckObj.itemInternalId=itemInternalId;
												getToQuantityCheckObj.transactionLineNo=transactionLineNo;
												getToQuantityCheckObj.lotName=lotName;
												getToQuantityCheckObj.itemType=itemType;
												getToQuantityCheckObj.statusInternalId=invtStatus;
												getToQuantityCheckObj.inventoryStatusFeature=inventoryStatusFeature;
												getToQuantityCheckObj.warehouseLocationId=warehouseLocationId;
												getToQuantityCheckObj.scannedQuantity=scannedQuantity;
												getToQuantityCheckObj.transactionDetailsArray=transactionDetailsArray;
												transactionDetailsArray = inboundLib.getToQuantityCheck(getToQuantityCheckObj);
												isValid = transactionDetailsArray.isValid;
												useitemcostflag = inboundLib.getUseItemCostForTO(transactionInternalId);

											}

											itemReceipt = '';
											if(isValid){
												log.debug("isTallyScanRequired",isTallyScanRequired);
												log.debug("randomTallyScanRule",randomTallyScanRule);
												if(isTallyScanRequired == true && randomTallyScanRule == 'T'){
													if(systemRuleValue == 'N') {
														var opentaskIdArr = [];
														for (var openTsk in tallyLoopObj) {
															opentaskIdArr.push(tallyLoopObj[openTsk].openTaskId);
														}
														var trecord = null;


														var opentaskSearchResults = inboundUtility.getOTResultsforIRPosting(transactionInternalId, '', '', "", warehouseLocationId);
														if (opentaskSearchResults.length > 0) {

															var recordType = record.Type.PURCHASE_ORDER;
															if (transactionType == 'returnauthorization') {
																var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();

																if (crossSubsidiaryFeature) {
																	var locationSubsidiary = utility.getSubsidiaryforLocation(warehouseLocationId)

																	trecord = record.transform({
																		fromType: record.Type.RETURN_AUTHORIZATION,
																		fromId: transactionInternalId,
																		toType: record.Type.ITEM_RECEIPT,
																		defaultValues: {orderinvtsub: locationSubsidiary},
																		isDynamic: false
																	});
																} else {
																	trecord = record.transform({
																		fromType: recordType,
																		fromId: transactionInternalId,
																		toType: record.Type.ITEM_RECEIPT,
																		isDynamic: false
																	});
																}
															} else {

																if (centralizesPurchasingandBilling == true) {
																	log.debug({
																		title: 'targetSubsidiary',
																		details: targetSubsidiary
																	});
																	if (targetSubsidiary == null || targetSubsidiary == '' || targetSubsidiary == undefined || targetSubsidiary == 'undefined') {
																		targetSubsidiary = -1;
																	}
																	trecord = record.transform({
																		fromType: recordType,
																		fromId: transactionInternalId,
																		toType: record.Type.ITEM_RECEIPT,
																		defaultValues: {targetsub: targetSubsidiary},
																		isDynamic: false
																	});
																} else {
																	trecord = record.transform({
																		fromType: recordType,
																		fromId: transactionInternalId,
																		toType: record.Type.ITEM_RECEIPT,
																		isDynamic: false
																	});

																}

															}
															var prossedLinesArr = [];
															var actQuantity = '';
															var itemId = '';
															var batchNo = '';
															var expiryDate = '';
															var serialArray = '';
															var parentItem = '';
															var openTaskIdarray = [];
															var enterBin = '';
															for (var otItr = 0; otItr < opentaskSearchResults.length; otItr++) {

																var linenum = opentaskSearchResults[otItr]['custrecord_wmsse_line_no'];
																openTaskIdarray.push(parseInt(opentaskSearchResults[otItr].id));
																if (prossedLinesArr.indexOf(linenum) == -1) {
																	prossedLinesArr.push(linenum);
																	actQuantity = opentaskSearchResults[otItr].custrecord_wmsse_act_qty;
																	itemId = opentaskSearchResults[otItr].custrecord_wmsse_sku;
																	batchNo = opentaskSearchResults[otItr].custrecord_wmsse_batch_num;
																	expiryDate = opentaskSearchResults[otItr].custrecord_wmsse_expirydate;
																	enterBin = opentaskSearchResults[otItr].custrecord_wmsse_actendloc;
																	serialArray = opentaskSearchResults[otItr].custrecord_wmsse_serial_no;
																	isKitComponent = opentaskSearchResults[otItr].custrecord_wmsse_kitflag;
																	parentItem = opentaskSearchResults[otItr].custrecord_wmsse_parent_sku_no;

																	inboundLib.consolidatePostItemReceipt(trecord, actQuantity, linenum, itemId, transactionType, batchNo, expiryDate,
																		warehouseLocationId, enterBin, serialArray, opentaskSearchResults, transactionInternalId, otItr);
																	//itemIterator++;


																}
															}

															if (trecord != null && trecord != '') {

																itemReceipt = trecord.save();
																if (itemReceipt != '') {
																	for (var j = 0; j < opentaskSearchResults.length; j++) {
																		var isKitComponentFlag = opentaskSearchResults[j].custrecord_wmsse_kitflag;
																		if (!isKitComponentFlag) {
																			record.submitFields({
																				type: 'customrecord_wmsse_trn_opentask',
																				id: opentaskSearchResults[j].id,
																				values: {
																					'custrecord_wmsse_nsconfirm_ref_no': itemReceipt,
																					'name': opentaskSearchResults[j].id
																				}
																			});
																		}
																	}
																}
															}
														}
													}

												}
												else {
													var postIrObj = {};
                                                    if(utility.isValueValid(transactionType) && transactionType == 'returnauthorization' && utility.isValueValid(restock)) {
                                                        postIrObj.restock = restock;
                                                    }
													postIrObj.transactionType = transactionType;
													postIrObj.poInternalId = transactionInternalId;
													postIrObj.fetchedItemId = itemInternalId;
													postIrObj.poLineno = transactionLineNo;
													postIrObj.itemType = itemType;
													postIrObj.whLocation = warehouseLocationId;
													postIrObj.lotno = lotName;
													postIrObj.lotExpiryDate = lotExpiryDate;
													postIrObj.tranid = transactionName;
													postIrObj.actualBeginTime = actualBeginTime;
													postIrObj.uom = transactionUomName;
													postIrObj.conversionRate = transactionUomConversionRate;
													postIrObj.useitemcostflag = useitemcostflag;
													postIrObj.systemRuleValue = systemRuleValue;
													postIrObj.invtStatus = invtStatus;
													postIrObj.fifoDate = null;
													postIrObj.PutStrategy = null;
													postIrObj.zoneno = null;
													postIrObj.lineFullQty = null;
													postIrObj.TOLineDetails = fulfillmentIdArray;
													postIrObj.isKitComponent = isKitComponent;
													postIrObj.parentItem = parentItem;
													postIrObj.parentItemLine = parentItemLine;
													postIrObj.targetLocation = targetLocation;
													postIrObj.targetSubsidiary = targetSubsidiary;
													if (isTallyScanRequired == true) {
														postIrObj.selectedConversionRate = transactionDetailsArray.selectedConversionRateForTallyScan;
														if (btnClicked == 'Skip') {
															noStockQty = noStockQty - 1;
															if (utility.isValueValid(transactionDetailsArray.selectedConversionRateForTallyScan)) {
																noStockQty = Number(Big(noStockQty).mul(transactionDetailsArray.selectedConversionRateForTallyScan));
																noStockQty = Number(Big(noStockQty).div(transactionUomConversionRate));
															}
															postIrObj.enterQty = noStockQty;
														} else {
															if (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem' &&
																transactionType == 'transferorder') {

																if (utility.isValueValid(transactionDetailsArray.selectedConversionRateForTallyScan)) {
																	noStockQty = Number(Big(noStockQty).mul(transactionDetailsArray.selectedConversionRateForTallyScan));
																	noStockQty = Number(Big(noStockQty).div(transactionUomConversionRate));
																}

																postIrObj.enterQty = noStockQty;
															} else {
																postIrObj.enterQty = remainingQuantity;
															}
														}

														postIrObj.isTallyScanRequired = isTallyScanRequired;
														postIrObj.tallyLoopObj = tallyLoopObj;


													} else {
														postIrObj.enterQty = scannedQuantity;
													}

													var barcodeDataObj = {};
													barcodeDataObj.vendorId = utility.isValueValid(requestParams.VendorId) ? requestParams.VendorId : requestParams.vendorId;
													barcodeDataObj.itemName = requestParams.fetcheditemname;
													barcodeDataObj.lotName = utility.isValueValid(lotName) ? lotName : (getLotDatafromTally(tallyLoopObj)).lotName;
													barcodeDataObj.lotExpiryDate = utility.isValueValid(lotExpiryDate) ? lotExpiryDate : (getLotDatafromTally(tallyLoopObj)).lotExpiryDate;
													barcodeDataObj.quantity = (postIrObj.enterQty).toString();
													barcodeDataObj.uom = postIrObj.uom;
													barcodeDataObj.transactionId = transactionInternalId;
													barcodeDataObj.whLocation = warehouseLocationId;
													log.debug('barcodeDataObj', barcodeDataObj);
													var barcodeOutPutObj = utility.generateCompositeBarcodeString(barcodeDataObj);
													log.debug('barcodeOutPutObj', barcodeOutPutObj);
													if (utility.isValueValid(barcodeOutPutObj.compositeBarcodeString)) {
														postIrObj.strBarCode = barcodeOutPutObj.compositeBarcodeString;
													}

													if (locationUseBinlFlag == false && inventoryStatusFeature == false) {
														postIrObj.noBinLoc = false;
													}
													log.debug({title: 'postIrObj', details: postIrObj});
													itemReceipt = inboundLib.postItemReceipt(postIrObj);
													debugString = debugString + ",itemReceipt :" + itemReceipt;
													log.debug({title: 'itemReceipt', details: itemReceipt});
												}
												}
											if(itemReceipt != '' || systemRuleValue == 'Y')
											{
												transactionDetailsArray.tallyLoopObj = {};
												transactionDetailsArray.isValid = true;

												var	toLineDetails = inboundUtility.getRecevingOrderItemDetails(transactionName,null,warehouseLocationId,'',transactionInternalId,'',transactionType,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName);
												if(toLineDetails !=null && toLineDetails.length > 0)
												{
													var poId 		= toLineDetails[0].internalid;
													var vCount		= 0;
													var vPoReminqty = 0;
													var poLineReceivedQty  = 0;
													var poLineRemainingQty = 0;
													var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(poId,warehouseLocationId);

														for (var cnt in toLineDetails) {
															var poLineArr = toLineDetails[cnt];
															var poLine = poLineArr.line;
															if (JSON.stringify(openPutAwayDetails) !== '{}') {
																var vpoitemOPentaskRcvQty = openPutAwayDetails[poLine];
																if (utility.isValueValid(vpoitemOPentaskRcvQty)) {
																	poLineReceivedQty = poLineArr.totalReceivedQty;
																	if (transactionType == 'transferorder') {
																		poLineRemainingQty = poLineArr.TransferOrderLine_Remainingqty;
																	} else if (transactionType == 'returnauthorization') {
																		poLineRemainingQty = poLineArr.rmaRemainingQty;
																	} else {
																		poLineRemainingQty = poLineArr.poRemainingQty;
																	}
																	poLineArr.totalReceivedQty = Number(Big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));
																	poLineArr.poRemainingQty = Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
																	poLineArr.rmaRemainingQty = Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
																	poLineArr.TransferOrderLine_Remainingqty = Number(Big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
																}
															}
															if (transactionType == 'transferorder') {
																vPoReminqty = poLineArr.TransferOrderLine_Remainingqty;
															} else if (transactionType == 'returnauthorization') {
																vPoReminqty = poLineArr.rmaRemainingQty;
															} else {
																vPoReminqty = poLineArr.poRemainingQty;
															}
															if (parseFloat(vPoReminqty) > 0) {
																vCount++;
																break;
															}
														}
														transactionDetailsArray.count = (parseFloat(vCount) > 0) ? vCount : 0;

												}
												else
												{
													transactionDetailsArray.count	= 0;
												}

											}
										}
										else{
											if(randomTallyScanRule == 'T' && ((backBtnVisibility == true && transactionDetailsArray.remainingQuantity == 0)
												|| btnClicked == 'Skip' )){
												transactionDetailsArray.isBinScanRequired = true;
												transactionDetailsArray.isSamePageNavigationRequired = false;
												if(btnClicked == 'Skip'){
												var binScanRequire = _checkIsInventoryItemRecevied(transactionInternalId,locationUseBinlFlag);
												if(binScanRequire == true) {
													transactionDetailsArray.isBinScanReq = true;
												}
												else{
													transactionDetailsArray.count	= 1;
												}
												}
											}
										}

									}
								}
								debugString = debugString + ",transactionDetailsArray['isValid'] :"+transactionDetailsArray.isValid;
								debugString = debugString + ",itemType :"+itemType;

								var infoScannedQuantity = scannedQuantity;
								if(isTallyScanRequired == true){
									infoScannedQuantity =1;
								}
								if(randomTallyScanRule == 'T'){
									transactionDetailsArray.inforeceivedQuantity  = transactionDetailsArray.scannedQuantity;
									transactionDetailsArray.inforemainingQuantity = transactionDetailsArray.remainingQuantity;
								}
								else {
									if (utility.isValueValid(inforeceivedQuantity) && utility.isValueValid(inforemainingQuantity)) {
										if (utility.isValueValid(transactionUomName)) {

											var inforeceivedQuantityIndex = inforeceivedQuantity.indexOf(' ');
											inforeceivedQuantity = parseFloat(inforeceivedQuantity.toString().substring(0, inforeceivedQuantityIndex == -1 ? 1 : inforeceivedQuantityIndex)) + parseFloat(infoScannedQuantity);
											var inforemainingQuantityIndex = inforemainingQuantity.indexOf(' ');
											inforemainingQuantity = parseFloat(inforemainingQuantity.toString().substring(0, inforemainingQuantityIndex == -1 ? 1 : inforemainingQuantityIndex)) - parseFloat(infoScannedQuantity);
											inforeceivedQuantity = inforeceivedQuantity == 0 ? '0' : inforeceivedQuantity + ' ' + transactionUomName;
											inforemainingQuantity = inforemainingQuantity == 0 ? '0' : inforemainingQuantity + ' ' + transactionUomName;
										} else {
											inforeceivedQuantity = parseFloat(inforeceivedQuantity) + parseFloat(infoScannedQuantity);
											inforemainingQuantity = parseFloat(inforemainingQuantity) - parseFloat(infoScannedQuantity);
											if (inforemainingQuantity == 0) {
												inforemainingQuantity = '0';
											}
										}
									}
									transactionDetailsArray.inforeceivedQuantity = inforeceivedQuantity;
									transactionDetailsArray.inforemainingQuantity = inforemainingQuantity;
								}



								if(!(itemType == "serializedinventoryitem"  || itemType=="serializedassemblyitem")&&
										(transactionDetailsArray.isValid == true)){
									impactedRecords = inboundUtility.noCodeSolForReceiving(transactionInternalId, transactionLineNo, itemReceipt, transactionType,'',locationUseBinlFlag,itemType);
								}

							}

							if(!utility.isValueValid(backOrderQty) && backOrderQty != 0) {

								backOrderQty = inboundUtility.getBackOrderQty(warehouseLocationId, itemInternalId);
								if (backOrderQty != 0) {
									transactionDetailsArray['backOrderQty'] = backOrderQty + ' ' + transactionUomName;
									var stockUnitText = '';
									var unitType = '';

									var itemLookUp = search.lookupFields({
										type: search.Type.ITEM,
										id: itemInternalId,
										columns: ['unitstype', 'stockunit']

									});

									if (utility.isValueValid(itemLookUp.unitstype) && utility.isValueValid(itemLookUp.unitstype[0])) {
										unitType = itemLookUp.unitstype[0].value;
									}

									if (utility.isValueValid(itemLookUp.stockunit) && utility.isValueValid(itemLookUp.stockunit[0])) {
										stockUnitText = itemLookUp.stockunit[0].text;
									}

									if (utility.isValueValid(stockUnitText) && utility.isValueValid(unitType) && utility.isValueValid(transactionUomName)) {
										var stockConvRate = utility.getConversionRate(stockUnitText, unitType);
										var tranUOMConvRate = utility.getConversionRate(transactionUomName, unitType);
										var tranUOMbackOrdQty = utility.uomConversions(parseFloat(backOrderQty), tranUOMConvRate, stockConvRate);

										backOrderQty = tranUOMbackOrdQty + ' ' + transactionUomName;
									}


								}
							}
							transactionDetailsArray.backOrderQty    = backOrderQty;
							transactionDetailsArray.impactedRecords = impactedRecords;
						}
					}

				}
				else
				{
					if(transactionDetailsArray.isValid != false &&
						transactionDetailsArray.lotPageNavigationRequiredForTS != "T" )
					{
						if((overageReceiveEnabled==false) && (!isNaN(quantityScanned) )  && (!isNaN(remainingQuantity) )
								&& (parseFloat(quantityScanned) > parseFloat(remainingQuantity)))
						{
							if(transactionType == 'returnauthorization'){
								transactionDetailsArray.errorMessage = translator.getTranslationString('RMA_QUANTITYVALIDATE.OVERAGE_FALSE');
							}
							else if(transactionType == 'transferorder'){
								transactionDetailsArray.errorMessage = translator.getTranslationString('TO_QUANTITYVALIDATE.OVERAGE_FALSE');
							}
							else{
								transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.OVERAGE_FALSE');
							}
							transactionDetailsArray.isValid = false;
						}
						else{
							if(overageReceiveEnabled==false) {
								transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
								transactionDetailsArray.isValid = false;
							}
						}
					}
				}
			}
			else
			{
				transactionDetailsArray.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
				transactionDetailsArray.isValid      = false;
			}
		}
		catch(e)
		{
			log.error({title:'transactionDetailsArray',details:transactionDetailsArray});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			transactionDetailsArray.isValid 	 = false;
			transactionDetailsArray.errorMessage = e.message;

		}
        if(isTallyScanRequired && utility.isValueValid(requestParams.tallyScanItem) && randomTallyScanRule != 'T') {
            transactionDetailsArray.tallyScanBarcodeSerialname = "";
        }
        if(utility.isValueValid(restock)) {
            transactionDetailsArray.restock = restock;
        }
		return transactionDetailsArray;
	}
	function getItemCustomDetails(itemInternalId,warehouseLocationId)
	{
		var itemSearch= search.create({type:'item',columns:[{name:'custitem_wmsse_mix_item'},{name:'custitem_wmsse_mix_lot'}]
		});
		var itemSearchFilters = [];
		if(utility.isValueValid(itemInternalId)){
			itemSearchFilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
		}
		itemSearchFilters.push(
				search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));
		if(utility.isValueValid(warehouseLocationId)){
			itemSearchFilters.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: ['@NONE@',warehouseLocationId]
			}));
		}
		itemSearch.filters = itemSearchFilters;
		return utility.getSearchResultInJSON(itemSearch);
	}
	function validateSerialFromIF(transactionInternalId,itemInternalId,transactionLineNo,inventoryStatus,serialName){
		var trecord = record.load({
			type : 'transferorder',
			id : transactionInternalId
		});
		var IsValidSerailNumber = false;
		var links=trecord.getLineCount({sublistId:'links'});
		if(utility.isValueValid(links))
		{
			var linkIdArr = [];
			var searchResults = [];
			for(var itr = 0; itr < links;itr++)
			{
				var linkid = trecord.getSublistValue({sublistId: 'links',fieldId: 'id',	line: itr});
				linkIdArr.push(linkid);
			}
			searchResults = inboundUtility.getTrasactionLinkDetails(linkIdArr) ;
			var  searchResultsLength  = searchResults.length;
			for(var j=0;j<searchResultsLength &&  IsValidSerailNumber==false;j++)
			{
				var itemFulfillmentId  = searchResults[j].id;
				if( searchResults[j].recordtype == 'itemfulfillment')
				{
					var frecord = record.load({
						type : 'itemfulfillment',
						id : itemFulfillmentId,
						isDynamic: true
					});

					var fulfillmentItemCount=frecord.getLineCount({sublistId:'item'});
					for(var f=0;f<fulfillmentItemCount && IsValidSerailNumber == false;f++)
					{
						var fulfillmentItem = frecord.getSublistValue({sublistId:'item',fieldId: 'item',line: f});
						var fulfillmentLineNo = frecord.getSublistValue({sublistId:'item',fieldId: 'orderline',line: f});
						var toFulfillmentLineNo= fulfillmentLineNo-1;
						if(fulfillmentItem==itemInternalId && parseInt(transactionLineNo)==(parseInt(toFulfillmentLineNo)))
						{
							var serialnumbers = frecord.getSublistValue({sublistId:'item',fieldId: 'serialnumbers',line: (parseInt(f))});

							frecord.selectLine({sublistId:'item',line: f});
							var toLineLength =0;
							try{
								var compSubRecord = frecord.getCurrentSublistSubrecord({
									sublistId: 'item',
									fieldId: 'inventorydetail'
								});
								if(utility.isValueValid(compSubRecord)){
									toLineLength = compSubRecord.getLineCount({
										sublistId: 'inventoryassignment'
									});
								}
							}
							catch(e){
								log.debug({title:'e',details:e});
							}
							log.debug({title:'toLineLength',details:toLineLength});
							for(var j1=0;j1<toLineLength ;j1++)	{
								var itemfulfilStatus = compSubRecord.getSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'inventorystatus',
									line: j1
								});

								if(inventoryStatus == itemfulfilStatus)	{
									var	itemfulfilserialno = compSubRecord.getSublistText({
										sublistId: 'inventoryassignment',
										fieldId: 'issueinventorynumber',
										line: j1
									});

									if(itemfulfilserialno == serialName){
										IsValidSerailNumber= true;
										break;
									}
								}
							}
						}
						if(IsValidSerailNumber){
							break;
						}
					}
				}
				if(IsValidSerailNumber){
					break;
				}
			}
		}

		return IsValidSerailNumber;
	}
	function getTransactionConversionRate(itemInternalId,transactionUomName){

		var transactionUomConversionRate = '';
		var itemLookUp = search.lookupFields({
			type: search.Type.ITEM,
			id: itemInternalId,
			columns: ['unitstype']
		});
		if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined)
		{
			var unitType 		  = itemLookUp.unitstype[0].value;
			var uomValue 		  = '';
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
		return transactionUomConversionRate;
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

function getLotDatafromTally(tallyLoopObj){
	var lotDataObj = {};
	for(var lotData in tallyLoopObj){
		lotDataObj.lotName = tallyLoopObj[lotData].lotName;
		lotDataObj.lotExpiryDate = tallyLoopObj[lotData].lotExpiryDate;
		break;
	}
	return lotDataObj;
}
			function _validateScannedItemAgainstTransaction(transactionDetailsObj,inventoryStatusFeature,
															tallyLoopObj,transactionName,itemId,
															warehouseLocationId,transactionInternalId,
															transactionType,
															centralizesPurchasingandBilling,
															warehouseLocationName,itemType,
															tallyScanRemainingQty,
															transactionUomConversionRate,
															overageReceiveEnabled,invtStatus,
															qtyUomSelected,backOrdQty,tallyScanItem,
															numberOfTimesSerialScanned,lotName,locationUseBinlFlag,scannedQuantity,lotScanned,scannedSerialsArray){
				var orderLineDetails = inboundUtility.getRecevingOrderItemDetails(transactionName, itemId, warehouseLocationId, null, transactionInternalId, null, transactionType, null, centralizesPurchasingandBilling, warehouseLocationName);
                   log.debug('orderLineDetails',orderLineDetails)
				log.debug('scannedQuantity',scannedQuantity)
				if (orderLineDetails.length > 0) {
					transactionDetailsObj.isValid = true;



					if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"
						&& itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem"
						&& itemType != "inventoryitem" && itemType != "assemblyitem") {
						invtStatus = "";

					}
					for (var ordLen = 0; ordLen < orderLineDetails.length; ordLen++) {
						transactionDetailsObj.transactionLineNo = orderLineDetails[ordLen].line;
						var tallyLoopObjTotalQty = 0;
						if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
							for (var obj in tallyLoopObj) {
								if (orderLineDetails[ordLen].line == tallyLoopObj[obj].line) {
									tallyLoopObjTotalQty = parseInt(tallyLoopObjTotalQty) + parseInt(tallyLoopObj[obj].quantity);

								}
							}
							if (tallyLoopObjTotalQty == 0 && !utility.isValueValid(lotScanned) && !utility.isValueValid(transactionDetailsObj.barcodeLotname)) {
								transactionDetailsObj.errorMessage = translator.getTranslationString('RANDOMTALLYSCAN_LOTVALIDATION');
								transactionDetailsObj.isValid = false;

							}
							else{
								if(utility.isValueValid(transactionDetailsObj.barcodeLotname) && utility.isValueValid(transactionDetailsObj.barcodeLotExpirydate)) {
									var lotExpiryDate = transactionDetailsObj.barcodeLotExpirydate.toString();
									if (lotExpiryDate.indexOf("Invalid") != -1) {
										transactionDetailsObj.errorMessage = transactionDetailsObj.barcodeLotExpirydate;
										transactionDetailsObj.isValid = false;
									}
								}
							}
							tallyLoopObjTotalQty = tallyLoopObjTotalQty + 1;
						}

					var key = transactionName + (inventoryStatusFeature ? '_' + invtStatus : '') + "^" + itemId + "^" + orderLineDetails[ordLen].line;

					if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && utility.isValueValid(lotName)) {
						key = lotName + "_" + transactionName + (inventoryStatusFeature ? '_' + invtStatus : '') + "^" + itemId + "^" + orderLineDetails[ordLen].line;
					}

					if (transactionDetailsObj.isValid != false) {
						var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(transactionInternalId, warehouseLocationId, itemId, orderLineDetails[ordLen].line);
						var openTaskQty = 0;
						var scanQty = 0;

						if (JSON.stringify(openPutAwayDetails) !== '{}') {
							openTaskQty = openPutAwayDetails[orderLineDetails[ordLen].line];
						}
						var lineRemQty = 0;
						var variance = 0;
						if (parseFloat(openTaskQty) > 0) {
							lineRemQty = Number(Big(orderLineDetails[ordLen].poRemainingQty).minus(openTaskQty));
							if (lineRemQty >= 1) {
								scanQty = Number(Big(openTaskQty).plus(1));
							} else {
								if (parseFloat(lineRemQty) > 0 && parseFloat(lineRemQty) < 1) {
									var baseUnitConversionRate = 1;
									var transactionConvertedQty = 1;
									if (utility.isValueValid(orderLineDetails[ordLen].unitstype)) {
										var uomResult = tallyScanUtility.getUOMDetails(orderLineDetails[ordLen].unitstype);
										for (var itr in uomResult) {
											if (uomResult[itr]['uom.baseunit']) {
												baseUnitConversionRate = uomResult[itr]['uom.conversionrate'];
												break;
											}
										}
										transactionConvertedQty = Number(Big(baseUnitConversionRate).div(orderLineDetails[ordLen]["Conversion Rate"]));
										scanQty = Number(Big(openTaskQty).plus(transactionConvertedQty));
										tallyLoopObjTotalQty = scanQty;
									}

								} else {
									scanQty = Number(Big(openTaskQty).plus(1));
									if (lineRemQty == 0) {
										if (tallyLoopObj[key] != undefined) {
											var tallyLoopObjectQty = Number(Big(tallyLoopObj[key]['quantity']));
											var tallyLoopObjectOpentaskId = tallyLoopObj[key].openTaskId;
											if (utility.isValueValid(tallyLoopObjectOpentaskId)) {
												var openTaskRecord = record.load({
													type: 'customrecord_wmsse_trn_opentask',
													id: tallyLoopObjectOpentaskId
												});
												openTaskQty = openTaskRecord.getValue({fieldId: 'custrecord_wmsse_act_qty'});

											}
											if (parseFloat(tallyLoopObjectQty) < parseFloat(openTaskQty)) {
												 variance = Number(Big(openTaskQty).minus(tallyLoopObjectQty));
												scanQty = Number(Big(tallyLoopObjectQty).plus(variance));
											}
											tallyLoopObjTotalQty = scanQty;
										}
										else{
											scanQty = 1;
											openTaskQty = 0;
										}

									}

								}
							}
						} else {
							scanQty = 1;
							lineRemQty = Number(Big(orderLineDetails[ordLen].poRemainingQty).minus(1));
						}
						var itemQtyExists = true;
						var poRemainingQty = parseFloat(orderLineDetails[ordLen].poRemainingQty);

						log.debug("scanQty",scanQty);
						log.debug("poRemainingQty",poRemainingQty);
						log.debug("ordLen",ordLen);
						if (((parseFloat(scanQty) > poRemainingQty) ||
							(parseFloat(tallyLoopObjTotalQty) > poRemainingQty))) {
							itemQtyExists = false;
							if (overageReceiveEnabled == false && ordLen == orderLineDetails.length - 1) {
								transactionDetailsObj.errorMessage = translator.getTranslationString("PO_QUANTITYVALIDATE.OVERAGE_FALSE");
								transactionDetailsObj.isValid = false;
							}
						}
						else{
							itemQtyExists = true;
						}

						if (transactionDetailsObj.isValid != false && itemQtyExists == true) {
							transactionDetailsObj.tallyLoopObj = tallyLoopObj;
							transactionDetailsObj.showDoneBtn = 'F';

							transactionDetailsObj.itemName = orderLineDetails[ordLen].itemText;
							transactionDetailsObj.unitType = orderLineDetails[ordLen].unitstype;
							transactionDetailsObj.itemDescription = orderLineDetails[ordLen].salesdescription;
							transactionDetailsObj.transactionUomConversionRate = orderLineDetails[ordLen]["Conversion Rate"];
							transactionDetailsObj.targetlocation = orderLineDetails[ordLen].targetlocation;
							transactionDetailsObj.targetsubsidiary = orderLineDetails[ordLen].targetsubsidiary;
							transactionDetailsObj.transactionLineNo = orderLineDetails[ordLen].line;
							transactionDetailsObj.transactionUomInternalId = orderLineDetails[ordLen].unit;
							transactionDetailsObj.uomSelectionforFirstItr = transactionDetailsObj.transactionUomInternalId;
							transactionDetailsObj.poRemainingQty = orderLineDetails[ordLen].poRemainingQty;

							transactionDetailsObj.numberOfTimesSerialScanned = 0;
							transactionDetailsObj.scannedserialsArr = scannedSerialsArray;
							transactionDetailsObj.remainingQuantity = tallyScanRemainingQty;
							transactionDetailsObj.itemScannedQty = scanQty;
							if (utility.isValueValid(transactionDetailsObj.transactionUomInternalId)) {
								transactionDetailsObj.transactionUomName = orderLineDetails[ordLen].unit;
								transactionDetailsObj.transactionUomInternalId = _getUomInternalId(orderLineDetails[ordLen].unit, transactionDetailsObj.unitType);

							} else {
								transactionDetailsObj.transactionUomName = "";
								transactionDetailsObj.transactionUomInternalId = "";
								transactionDetailsObj.transactionUomConversionRate = "";

							}
							transactionDetailsObj.backOrderQty = inboundUtility.getBackOrderQty(warehouseLocationId, itemId);

							if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
								if (utility.isValueValid(transactionDetailsObj.barcodeLotname)) {
									transactionDetailsObj.lotName = transactionDetailsObj.barcodeLotname;
									transactionDetailsObj.lotScanned = 'T';
								} else {

									var previousScannedLot = "";
									for (var obj in tallyLoopObj) {
										if (transactionDetailsObj.transactionLineNo == tallyLoopObj[obj].line) {
											previousScannedLot = tallyLoopObj[obj].lotName;
										}
									}
									if (utility.isValueValid(previousScannedLot) && utility.isValueValid(lotName) &&
										lotScanned != "T"
										&& lotName != previousScannedLot) {
										transactionDetailsObj.lotName = previousScannedLot;
									} else if (utility.isValueValid(lotName)) {
										transactionDetailsObj.lotName = lotName;
									} else {
									}
								}

							} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {

								numberOfTimesSerialScanned = 0;
								transactionDetailsObj.serialPageNavigationRequiredForTS = 'T';
								transactionDetailsObj.numberOfTimesSerialScanned = 0;
								transactionDetailsObj.tallyScanBarcodeSerialname = transactionDetailsObj.barcodeSerialname;
								transactionDetailsObj.enteredQtyInEach = orderLineDetails[ordLen]["Conversion Order Quantity"];
								log.debug("openTaskQty",openTaskQty);
								log.debug("orderLineDetails[ordLen][Conversion Order Quantity]",orderLineDetails[ordLen]["Conversion Order Quantity"]);
								if (utility.isValueValid(openTaskQty) && openTaskQty > 0) {
									transactionDetailsObj.enteredQtyInEach = Number(Big(orderLineDetails[ordLen]["Conversion Order Quantity"]).minus(openTaskQty));

								}
								transactionDetailsObj.showDoneBtn = 'T';
								transactionDetailsObj.isValid = true;
								transactionDetailsObj.isSamePageNavigationRequired = true;

								if (utility.isValueValid(transactionDetailsObj.unitType)) {
									var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsObj.unitType);
									for (var itr in uomResult) {

										if (uomResult[itr]['uom.internalid'] == transactionDetailsObj.transactionUomInternalId) {
											transactionDetailsObj.enteredQtyInEach = Number(Big(transactionDetailsObj.enteredQtyInEach).mul(uomResult[itr]['uom.conversionrate']));
										    break;
										}
									}
									for (var itr in uomResult) {
										if (uomResult[itr]['uom.baseunit']) {
											unitSelected = transactionDetailsObj.transactionUomInternalId;
											transactionDetailsObj.uomSelectionforFirstItr = transactionDetailsObj.transactionUomInternalId;
											break;
										}

									}
								}

							} else {
								transactionDetailsObj.isValid = true;

							}
							if (transactionDetailsObj.remainingQuantity && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem")) {
								var qtyInConvRate = 1;
								if (utility.isValueValid(transactionDetailsObj.transactionUomConversionRate)) {
									transactionDetailsObj.randomtallyscanUOM = "Transaction Unit: " + transactionDetailsObj.transactionUomName;
									qtyInConvRate = transactionDetailsObj.transactionUomConversionRate;
									if ((parseFloat(lineRemQty) > 0 && parseFloat(lineRemQty) < 1 ) || parseFloat(variance) > 0 ) {
										var baseUnitConversionRate = 1;
										if (utility.isValueValid(transactionDetailsObj.unitType)) {
											var uomResult = tallyScanUtility.getUOMDetails(transactionDetailsObj.unitType);
											for (var itr in uomResult) {
												if (uomResult[itr]['uom.baseunit']) {
													qtyInConvRate = uomResult[itr]['uom.conversionrate'];
													transactionDetailsObj.randomtallyscanUOM = "Base Unit: " + uomResult[itr]['uom.unitname'];
													break;
												}
											}
										}

									}
								}

								transactionDetailsObj.remainingQuantity = Number(Big(transactionDetailsObj.remainingQuantity).minus(qtyInConvRate));
								transactionDetailsObj.remainingQuantityForTallyScanLoop = transactionDetailsObj.remainingQuantity;


							}

							var barcodeQty = parseInt(scannedQuantity);
							if (transactionDetailsObj.serialPageNavigationRequiredForTS != 'T') {
								barcodeQty = parseInt(scannedQuantity) + 1;
							}

								transactionDetailsObj.barcodeQuantity = [{
									'value': barcodeQty,
									'unit': ""
								}];


							if (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem") {
								transactionDetailsObj.printFlag = false;
								transactionDetailsObj.isLastScanForItem = false;
								if ((parseFloat(scanQty)) == (parseFloat(orderLineDetails[ordLen].poRemainingQty))) {
									transactionDetailsObj.isLastScanForItem = true;
									transactionDetailsObj.printFlag = true;
									log.debug('INTO FUNCTION', transactionDetailsObj.printFlag);
								}
							}
                            break;
						}
						//}
					}
				}
				}
				else{
					transactionDetailsObj.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
					transactionDetailsObj.isValid = false;
				}
			}
			function _getSerials(orderInternalid,lineno){
				var myOpentaskQuery = query.create({
					type: 'customrecord_wmsse_trn_opentask'
				});
				var tranCond = myOpentaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_order_no',
					operator: query.Operator.ANY_OF,
					values: orderInternalid
				});
				var tranLineCond = myOpentaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_line_no',
					operator: query.Operator.ANY_OF,
					values: lineno
				});
				var confirmationRefCondition = myOpentaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
					operator: query.Operator.EMPTY
				});
				var currentUserID = runtime.getCurrentUser();
				var userIdCondition = myOpentaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_upd_user_no',
					operator: query.Operator.ANY_OF,
					values: currentUserID.id
				});
				/*var actBeginLocCondition = myOpentaskQuery.createCondition({
						fieldId: 'custrecord_wmsse_actbeginloc',
						operator: query.Operator.EMPTY_NOT
				});*/

				myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition, tranLineCond);


				myOpentaskQuery.columns = [
					myOpentaskQuery.createColumn({
						fieldId: 'custrecord_wmsse_serial_no'
					})]
				var results = myOpentaskQuery.runPaged({
					pageSize: 1000
				});
				var iterator = results.iterator();
				var serialsArray = [];
				iterator.each(function (result) {
				var	page = result.value;
				var	pageResults = page.data.results;
					for(var rec in pageResults) {
						var serialnumbers = pageResults[rec].values[0];
						var tempSerialArr = [];
						 if(utility.isValueValid(serialnumbers)){
							 tempSerialArr = serialnumbers.split(',');
						 }
						 for(var t=0;t<tempSerialArr.length;t++){
							 serialsArray.push(tempSerialArr[t]);
						 }

					}

				});

				return serialsArray;
			}
function _getOpenTask(orderInternalid,lineno,inventoryStatusFeature,inventoryStatus,locuseBinsFlag,lotName,scannedLotArr) {
	var myOpentaskQuery = query.create({
		type: 'customrecord_wmsse_trn_opentask'
	});
	var tranCond = myOpentaskQuery.createCondition({
		fieldId: 'custrecord_wmsse_order_no',
		operator: query.Operator.ANY_OF,
		values: orderInternalid
	});
	var tranLineCond = myOpentaskQuery.createCondition({
		fieldId: 'custrecord_wmsse_line_no',
		operator: query.Operator.ANY_OF,
		values: lineno
	});
	var confirmationRefCondition = myOpentaskQuery.createCondition({
		fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
		operator: query.Operator.EMPTY
	});
	var currentUserID = runtime.getCurrentUser();
	var userIdCondition = myOpentaskQuery.createCondition({
		fieldId: 'custrecord_wmsse_upd_user_no',
		operator: query.Operator.ANY_OF,
		values: currentUserID.id
	});
	myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition, tranLineCond);
	if (utility.isValueValid(locuseBinsFlag) && locuseBinsFlag == true) {
		var actBeginLocCondition = myOpentaskQuery.createCondition({
			fieldId: 'custrecord_wmsse_actbeginloc',
			operator: query.Operator.EMPTY
		});

		myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition, tranLineCond, actBeginLocCondition);
	}

	myOpentaskQuery.columns = [

		myOpentaskQuery.createColumn({
			fieldId: 'id'
		}),
		myOpentaskQuery.createColumn({
			fieldId: 'custrecord_wmsse_inventorystatus'
		}),
		myOpentaskQuery.createColumn({
			fieldId: 'custrecord_wmsse_batch_num'
		})]
	var results = myOpentaskQuery.runPaged({
		pageSize: 1000
	});
	var iterator = results.iterator();
	var opentaskId = "";
	iterator.each(function (result) {
		page = result.value;
		pageResults = page.data.results;
		if(inventoryStatusFeature == true){
			opentaskId = 	_deleteOpenTask(pageResults,inventoryStatus,lotName,scannedLotArr);
		}
		else {
			for(var rec in pageResults) {
				if(!utility.isValueValid(lotName) || pageResults[rec].values[2] == lotName) {
					opentaskId = pageResults[rec].values[0];
				}
				else {
					if (utility.isValueValid(lotName) && scannedLotArr.indexOf(pageResults[rec].values[2]) == -1) {
						record.delete({
							type: 'customrecord_wmsse_trn_opentask',
							id: parseInt(pageResults[rec].values[0])
						});

					}
				}
			}
		}
		return true;
	});

	return opentaskId;

}
function _deleteOpenTask(pageResults,invtStatus,lotName,scannedLotArray){
		var openTask = "";
				for(var rec in pageResults) {
					if(utility.isValueValid(pageResults[rec].values[1]) && (invtStatus != pageResults[rec].values[1])) {
						record.delete({
							type: 'customrecord_wmsse_trn_opentask',
							id: parseInt(pageResults[rec].values[0])
						});
					}
					else{
						if(!utility.isValueValid(lotName) || pageResults[rec].values[2] == lotName) {
							openTask = pageResults[rec].values[0];
						}
						else{
							if(utility.isValueValid(lotName) && scannedLotArray.indexOf(pageResults[rec].values[2])==-1){
								record.delete({
									type: 'customrecord_wmsse_trn_opentask',
									id: parseInt(pageResults[rec].values[0])
								});
							}
						}
					}
				}
				return openTask;
			}

		function getItemAliasResults(itemInternalId,wareHouseLocationId,vendorId,tallyScanItem,transactionDetailsArray,itemAliasObject,transactionLineNo){
			log.debug('getItemAliasResults_itemInternalId',itemInternalId);

			var isGS1Enabled = labelPrintingUtility.checkGS1Enable(wareHouseLocationId);
			log.debug('isGS1Enabled',isGS1Enabled);
			if(utility.isValueValid(itemInternalId) && (utility.isValueValid(isGS1Enabled)  && isGS1Enabled == true))
			{log.debug('ItemAlias Scanned',transactionDetailsArray.isItemAliasScanFlag);
				if (utility.isValueValid(transactionDetailsArray.isItemAliasScanFlag) && transactionDetailsArray.isItemAliasScanFlag)
				{
					transactionDetailsArray.scannedItemAliasForPrint = tallyScanItem;
				}
				else if(utility.isValueValid(transactionDetailsArray.isbarcodescanned) && transactionDetailsArray.isbarcodescanned &&
					utility.isValueValid(transactionDetailsArray.barcodeItem)){
					transactionDetailsArray.scannedItemAliasForPrint = transactionDetailsArray.barcodeItem;
				}
				else {
					var itemAliasList = labelPrintingUtility.getAllItemAliasResultsForPrint(itemInternalId,vendorId,wareHouseLocationId);
					log.debug('itemAliasList_itemAliasList',itemAliasList);
					if (itemAliasList.length > 1) {
						var key = itemInternalId + '_' + transactionLineNo;
						log.debug('key',key);
						if(utility.isValueValid(itemAliasObject) && utility.isValueValid(itemAliasObject[key])
							&& utility.isValueValid(itemAliasObject[key]["selectedItemAlias"])) {
							log.debug('transactionDetailsArray.itemScannedQty',transactionDetailsArray.itemScannedQty);
							if(transactionDetailsArray.itemScannedQty >0){
								itemAliasObject[key]["quantity"] =transactionDetailsArray.itemScannedQty;
							}
								transactionDetailsArray.isItemAliasPopupRequired = false;
						}else{
							transactionDetailsArray.isItemAliasPopupRequired = true;
						}
					}
				}
			}
		}
		function _checkIsInventoryItemRecevied(orderInternalid,locuseBinsFlag){
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
			var currentUserID = runtime.getCurrentUser();
			var userIdCondition = myOpentaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_upd_user_no',
				operator: query.Operator.ANY_OF,
				values: currentUserID.id
			});
			var itemtypeCondition = myOpentaskQuery.createCondition({

				fieldId: 'custrecord_wmsse_sku^item.itemtype',
				operator: query.Operator.ANY_OF,
				values:['InvtPart','Assembly']
			});
			myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition,itemtypeCondition);

			if (utility.isValueValid(locuseBinsFlag) && locuseBinsFlag == true) {
				var actBeginLocCondition = myOpentaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_actbeginloc',
					operator: query.Operator.EMPTY
				});
				myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition, actBeginLocCondition);

			}
             var invItemsReceived = false;

			myOpentaskQuery.columns = [

				myOpentaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_sku^item.itemtype'
				})]
			var result = myOpentaskQuery.run().results;

			if(result.length > 0) {
				invItemsReceived = true;
			}
			return invItemsReceived;
		}
	return {
		'post': doPost,
		'getItemCustomDetails':getItemCustomDetails,
		'validateSerialFromIF':validateSerialFromIF,
		'_validateScannedItemAgainstTransaction':_validateScannedItemAgainstTransaction,
		'getItemAliasResults':getItemAliasResults
	};
});
