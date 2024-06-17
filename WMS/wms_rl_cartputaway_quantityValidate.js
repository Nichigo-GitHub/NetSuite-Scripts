/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator', './wms_inventory_utility','./wms_inboundUtility','./big','N/runtime','./wms_tallyScan_utility', './wms_outBoundUtility','N/record'],
		/**
		 * @param {search} search
		 */
		function (search, utility,translator,inventoryUtiltiy,inboundUtility,Big,runtime,tallyScanUtility,obUtility,record) {

	function doPost(requestBody) {

		var whLocationId = '';
		var cartId = '';
		var itemId = '';
		var itemType = '';
		var lotName = '';
		var quantity = '';
		var expiryDate = '';
		var statusId = '';
		var statusName = '';
		var units = '';
		var stockconversionRate = '';
		var stageBinId = '';
		var quantityDetails = {};		
		var requestParams = '';
		var actualBeginTime = '';
		var preferBinId = '';
		var actionType = '';
		var expectedQuantity = '';
		var fromStatusId = '';

		var recomendedBinId ='';
		var itemName = '';
		var unitType = '';
		var tallyScanItem = '';
		var tallyScanQuantity = '';
		var barcodeQuantity = '';
		var isTallyScanRequired = '';
		var tallyScanBarCodeQty = '';
		var qtyUOMObj = '';
		var tallyScanOrderQty = '';
		var tallyLoopObj = '';
		var uomSelectionforFirstItr = '';
		var qtyUomSelected = '';
		var transactionuomValue = '';
		var isLotScan = '';
		var isItemScanned = '';
		var noStockAction = '';
		var stockUomValue = '';
		var stockUnitName = '';
		var tallyQtyArr = [];
		var statusArray = [];
		var lotArray = [];
		var tallyscanQty = '';
		var numberOfTimesSerialScanned = 0;
		var scannedQuantityInEach = 0;
		var binTransferIdStr = "";
		var loadToCartFromStage = "";
		try	{

			log.debug({title:'requestBody',details:requestBody});	
			if (utility.isValueValid(requestBody)) {

				requestParams= requestBody.params;
				whLocationId = requestParams.warehouseLocationId;
				cartId = requestParams.cartId;
				itemId = requestParams.itemId;
				lotName = requestParams.lotName;
				itemType = requestParams.itemType;
				quantity = requestParams.quantity;
				expiryDate = requestParams.expiryDate;
				statusId = requestParams.statusId;
				statusName = requestParams.statusName;
				units = requestParams.units;
				stockconversionRate = requestParams.stockconversionRate;
				stageBinId = requestParams.stageBinId;
				actualBeginTime = requestParams.actualBeginTime;
				preferBinId = requestParams.preferBinId;
				stockUnitName = requestParams.stockUnitName;
				actionType = requestParams.action;
				expectedQuantity = requestParams.expectedQuantity;
				fromStatusId = requestParams.fromStatusId;
				recomendedBinId = requestParams.recomendedBinId;
				itemName = requestParams.itemName;
				unitType =  requestParams.unitType;
				tallyScanItem = requestParams.tallyScanItem;
				tallyScanQuantity = requestParams.quantity;
				barcodeQuantity = requestParams.barcodeQuantity;
				isTallyScanRequired = requestParams.isTallyScanRequired;
				tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
				qtyUOMObj = requestParams.qtyUOMObj;
				tallyScanOrderQty=requestParams.tallyScanBarCodeQty;
				tallyLoopObj = requestParams.tallyLoopObj;
				uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
				qtyUomSelected = requestParams.qtyUomSelection;
				transactionuomValue = requestParams.transactionuomValue;
				isLotScan = requestParams.isLotScan;
				isItemScanned =  requestParams.isItemScanned;
				noStockAction = requestParams.btnAction;
				stockUomValue = requestParams.stockUomValue;
				numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				scannedQuantityInEach = requestParams.scannedQuantityInEach;
				var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
				var transactionName = requestParams.transactionName;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				binTransferIdStr = requestParams.binTransferIdString;
				loadToCartFromStage = requestParams.loadToCartFromStage;
				var selectedItemsDetailsObject = requestParams.scannedItemId;
				var stageName = requestParams.stageBinName;
				var cartName = requestParams.cartName;


				tallyScanBarCodeQty = utility.isValueValid(tallyScanBarCodeQty) ? tallyScanBarCodeQty : 0;
				tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};

				if (utility.isValueValid(whLocationId) && utility.isValueValid(cartId) &&
						(utility.isValueValid(itemId) || utility.isValueValid(selectedItemsDetailsObject)) && ((utility.isValueValid(quantity) && utility.isValueValid(expectedQuantity)) ||
								( (actionType == 'loadAll' || (actionType == 'loadToCartFromStage' &&  utility.isValueValid(selectedItemsDetailsObject)) )
										&& utility.isValueValid(stageBinId))))	{


					if(parseFloat(quantity) > parseFloat(expectedQuantity) && !utility.isValueValid(noStockAction) )	{

						quantityDetails.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.QTY_GREATERTHAN_AVAILABLE');//"You cannot transfer a quantity of an item that is greater than the available quanity.";
						quantityDetails.isValid = false;
					}
					else {

						if(actionType != 'loadAll' && actionType != 'loadToCartFromStage' && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")
								&& !(isTallyScanRequired)){

							if(quantity.toString().indexOf('.') != -1){
								quantityDetails.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
								quantityDetails.isValid = false;
							}
							else{
								quantityDetails.isValid = true;
								quantityDetails.numberOfTimesSerialScanned = 0;

								if(utility.isValueValid(stockUnitName))	{
									quantityDetails.scannedQuantity = Number(Big(quantity).mul(stockconversionRate));
									quantityDetails.scannedQuantityWithUOM = quantity +" "+stockUnitName;
								}
								else {
									quantityDetails.scannedQuantity = quantity;
									quantityDetails.scannedQuantityWithUOM = quantity;
								}
								quantityDetails.scannedStatusId = statusId;
								quantityDetails.itemName = itemName;
							}
						}
						else{
							var totalItemsCount = 1;
							if(actionType == 'loadToCartFromStage'  ){
								selectedItemsDetailsObject = selectedItemsDetailsObject || {};
								log.debug('selectedItemsDetailsObject',selectedItemsDetailsObject);
								totalItemsCount = selectedItemsDetailsObject.length;
								if(totalItemsCount > 10 ){
									quantityDetails.errorMessage = translator.getTranslationString('WMS_CART_LOADTOSTAGE.INVALIDITEM');
									quantityDetails.isValid =false;
									totalItemsCount = 0;
								}
								else{
									var itemIdArr = [];
									for(var result in selectedItemsDetailsObject){
										if(selectedItemsDetailsObject[result]){
											itemIdArr.push(selectedItemsDetailsObject[result].item);	
										}
									}
									log.debug('itemIdArr',itemIdArr);
									var inventoryResults = checkInventoryOfSelectedItems(itemIdArr,whLocationId,stageBinId);
									if(inventoryResults.length > 5000 ){
										quantityDetails.errorMessage = translator.getTranslationString('WMS_CART_LOADTOSTAGE.SELECTFEWERITEMS');
										quantityDetails.isValid =false;
										totalItemsCount = 0;
									}
								}

							}
							var failedItemsArr = [];
							var itemText = '';
							for(var itemCount = 0 ;itemCount < totalItemsCount ;itemCount++ ){


								var bintransferObj = {};
								if(!utility.isValueValid(stockconversionRate)){
									stockconversionRate = 1;
								}
								bintransferObj.itemType = itemType;
								bintransferObj.whLocation = whLocationId;
								bintransferObj.itemId = itemId;
								bintransferObj.units = units;
								bintransferObj.stockConversionRate = stockconversionRate;
								if(!utility.isValueValid(stockconversionRate)){
									stockconversionRate = 1;
								}
								if(utility.isValueValid(statusId))	{
									bintransferObj.fromStatus = fromStatusId;
									bintransferObj.toStatus = statusId;
									quantityDetails.scannedStatus = statusName;
								}
								var selectedItemsDetails ;
								if(actionType == 'loadToCartFromStage' && selectedItemsDetailsObject != undefined &&
										selectedItemsDetailsObject!=null){
									selectedItemsDetails = selectedItemsDetailsObject[itemCount];
								}
								log.debug('aselectedItemsDetails',selectedItemsDetails);
								if(selectedItemsDetails != undefined){
									bintransferObj.actionType = 'loadToCartFromStage';
									bintransferObj.itemId = selectedItemsDetails.item;
									itemId = selectedItemsDetails.item;
									itemText = selectedItemsDetails.itemText;
									bintransferObj.units = selectedItemsDetails.units;
									stockconversionRate = selectedItemsDetails.stockconversionRate;
									statusId = selectedItemsDetails.statusId;
									statusName = selectedItemsDetails.statusName;
									if(!utility.isValueValid(stockconversionRate)){
										stockconversionRate = 1;
									}
									bintransferObj.stockConversionRate = stockconversionRate;
									if(utility.isValueValid(statusId))	{
										bintransferObj.fromStatus = selectedItemsDetails.fromStatusId;
										bintransferObj.toStatus = selectedItemsDetails.statusId;
										quantityDetails.scannedStatus = selectedItemsDetails.statusName;
									}
								}
								bintransferObj.batchno = lotName;
								if(actionType == 'loadAll' || actionType == 'loadToCartFromStage')	{
									bintransferObj.quantity = null;
									bintransferObj.batchno = null;
								}
								else{
									bintransferObj.quantity =  Number(Big(quantity).mul(stockconversionRate));
									bintransferObj.opentaskQty = Number(Big(quantity).mul(stockconversionRate));
								}
								bintransferObj.fromBinId = stageBinId;
								bintransferObj.toBinId = cartId;
								bintransferObj.actualBeginTime = actualBeginTime;



								var skipBinTransferSubmit = false;
								var skipTallyLoop =  false;

								if(isTallyScanRequired){
									if((utility.isValueValid(noStockAction) && noStockAction == 'nostock')){
										if((utility.isValueValid(tallyLoopObj) || (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'))){

											tallyScanBarCodeQty = Number(Big(tallyScanBarCodeQty).mul(stockconversionRate));
											bintransferObj.quantity = tallyScanBarCodeQty;
											bintransferObj.opentaskQty = tallyScanBarCodeQty;
											if (((itemType == "inventoryitem" || itemType == "assemblyitem"))
													|| (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

												for (var tallyObjIndex in tallyLoopObj) {
													if (utility.isValueValid(tallyLoopObj[tallyObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyObjIndex].lotName) == -1) {
														lotArray.push(tallyLoopObj[tallyObjIndex].lotName);
														tallyQtyArr.push(tallyLoopObj[tallyObjIndex].quantity);
														statusArray.push(tallyLoopObj[tallyObjIndex].statusName);
													} else if (statusArray.indexOf(tallyLoopObj[tallyObjIndex].statusName) == -1) {
														tallyQtyArr.push(tallyLoopObj[tallyObjIndex].quantity);
														statusArray.push(tallyLoopObj[tallyObjIndex].statusName);
													}
													else
													{
														bintransferObj.quantity = quantityDetails.tallyScanBarCodeQty;
													}
												}
												bintransferObj.lotArray = lotArray;
												bintransferObj.tallyQtyArr = tallyQtyArr;
												bintransferObj.statusArray = statusArray;
												quantityDetails.navigateToSameScreen = false;
											}
										}
									}
									else{
										if(utility.isValueValid(tallyScanItem)){
											var isScannedItemOrLotSerial = false;
											var itemDetailsObj = {};
											itemDetailsObj.tallyScanItem = tallyScanItem;
											itemDetailsObj.warehouseLocationId = whLocationId;
											itemDetailsObj.unitType = unitType;
											itemDetailsObj.transactionUomName = stockUnitName;
											itemDetailsObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
											itemDetailsObj.qtyUomSelected = qtyUomSelected;
											itemDetailsObj.transactionuomId = stockUomValue;
											itemDetailsObj.barcodeQuantity = barcodeQuantity;
											quantityDetails.scannedQuantity = quantity;	
											quantityDetails.scannedStatusId = statusId;	
											if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
												itemDetailsObj.tallyScanSerial = tallyScanItem;
												itemDetailsObj.pickTaskId = tallyScanItem;
												itemDetailsObj.pickBinId = stageBinId;
												itemDetailsObj.binInternalid = stageBinId;
												itemDetailsObj.pickItemId = itemId;
												itemDetailsObj.InvStatusInternalId = statusId;
												if(!utility.isValueValid(actionType)){
													itemDetailsObj.InvStatusInternalId	 = fromStatusId;
												}
												itemDetailsObj.taskType = 9;
												if(isItemScanned != 'isItemScanned'){
													quantityDetails = tallyScanUtility.validateSerialTallyScan(itemDetailsObj);
													if(!utility.isValueValid(quantityDetails.errorMessage)){

														if(quantityDetails.navigateToLotItemsListScreen == 'T' && !utility.isValueValid(quantityDetails.pickItemId)){
															quantityDetails.navigateToItemSelection = true;
															skipTallyLoop =  true;
															quantityDetails.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
															quantityDetails.itemName = itemName;
															quantityDetails.lotName = quantityDetails.tallyScanSerial;

														}
														isScannedItemOrLotSerial = true;
													}
												}
												else{
													quantityDetails = tallyScanUtility.validateItemTallyScan(itemDetailsObj);

													if(utility.isValueValid(itemDetailsObj.tallyScanitemId) && itemDetailsObj.pickItemId != itemDetailsObj.tallyScanitemId){
														itemDetailsObj.errorMessage = translator.getTranslationString("BINTRANSFER_ITEMVALIDATE.INVALID_INPUT");
														itemDetailsObj.isValid = false;
													}
													if(utility.isValueValid(lotName)){
														itemDetailsObj.tallyScanSerial = lotName;
														itemDetailsObj.lotName = lotName;
														isScannedItemOrLotSerial = true;
													}
												}
											}else{
												quantityDetails = tallyScanUtility.validateItemTallyScan(itemDetailsObj);

												if(utility.isValueValid(quantityDetails.barcodeItemname)){
													itemName = quantityDetails.barcodeItemname;
													quantityDetails.tallyScanitemId = quantityDetails.barcodeIteminternalid;
													isScannedItemOrLotSerial = true;
												}
												else if(quantityDetails.itemValidate == 'T' && !utility.isValueValid(quantityDetails.errorMessage)){
													itemName = quantityDetails.itemid;
													isScannedItemOrLotSerial = true;
												}
												if(isItemScanned == 'isItemScanned'){
													lotName = requestParams.lotName;
												}
												else{
													lotName = quantityDetails.barcodeLotname;
												}
												if(!utility.isValueValid(lotName) && !utility.isValueValid(quantityDetails.errorMessage) && 
														(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

													var lotDetails = {}; 
													lotDetails.warehouseLocationId = whLocationId;
													lotDetails.itemInternalId = quantityDetails.tallyScanitemId;
													lotDetails.fromBinInternalId = stageBinId;
													lotDetails.fromInventorystatus = statusId;
													var itemLotDetails = obUtility.getPickingLotDetails(lotDetails);
													var itemLotDetailsLength = itemLotDetails.length;
													if(itemLotDetailsLength > 0) {
														isScannedItemOrLotSerial = true;
														lotName = itemLotDetails[0].inventorynumberText;
														if(itemLotDetailsLength > 1) {
															quantityDetails.isLotScanNavigationRequired = true;
															skipTallyLoop = true;
														}
													}
												}
												else if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && 
														utility.isValueValid(quantityDetails.errorMessage) || utility.isValueValid(lotName)) {

													if(utility.isValueValid(quantityDetails.barcodeLotname)){
														lotName = quantityDetails.barcodeLotname;
													}
													else{
														if(isLotScan != 'isItemScanned'){
															lotName = tallyScanItem;
														}
													}
													var itemDetails = [];
													if(isLotScan == 'isLotScan' || isItemScanned == 'isItemScanned'){
														itemDetails = tallyScanUtility.getinventoryNumberItemsList(whLocationId, lotName, stageBinId,itemId);
													}
													else{
														if(!utility.isValueValid(quantityDetails.barcodeIteminternalid)){
															itemDetails = tallyScanUtility.getinventoryNumberItemsList(whLocationId, lotName, stageBinId);
														}
													}
													var itemDetailsLength = itemDetails.length;
													if(itemDetailsLength > 0){
														isScannedItemOrLotSerial = true;
														if(utility.isValueValid(unitType)){
															quantityDetails = tallyScanUtility.getUOMToBeConsideredObj(quantityDetails);
														}
														quantityDetails.errorMessage = '';

														if(itemDetailsLength > 1){
															skipTallyLoop = true;
															quantityDetails.navigateToItemSelection = true;

															if(utility.isValueValid(quantityDetails.barcodeLotname)){
																quantityDetails.tallyScanSerial = quantityDetails.barcodeLotname;
																quantityDetails.lotName = quantityDetails.barcodeLotname;
															}else{
																quantityDetails.tallyScanSerial = tallyScanItem;
																quantityDetails.lotName = tallyScanItem;
															}
														}
														else{
															if(itemDetails[0].item == itemId){
																if(itemDetails[0].available > 0){
																	var key = itemDetails[0].inventorynumberText + '_' + transactionName + (inventoryStatusFeature ? '_' + itemDetails[0].status : '');
																	if(utility.isValueValid(tallyLoopObj[key]) && utility.isValueValid(tallyLoopObj[key].quantity)){
																		if(parseFloat(itemDetails[0].available) - parseFloat(tallyLoopObj[key].quantity) <=0){
																			itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY');
																			itemDetailsObj.isValid =false;
																		}
																	}  
																}else{
																	itemDetailsObj.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY');
																	itemDetailsObj.isValid =false;
																}
															}else{
																lotName = '';
															}

															statusId = itemDetails[0].status;
														}
														quantityDetails.isValid = true;
													}
													else{
														if(!utility.isValueValid(itemName)){
															lotName = '';
														}
													}
												}
												quantityDetails.barcodeLotname= ''; // Making it blank so as to remove prepopulation in next pages
												quantityDetails.batch_lot= '';
											}
											quantityDetails.scannedQuantity = quantity;	
											quantityDetails.scannedStatus = statusId;
											quantityDetails.tallyScanBarCodeQty = tallyScanBarCodeQty;
											quantityDetails.tallyScanOrderQty = tallyScanOrderQty;
											quantityDetails.quantity = quantity;

											if(skipTallyLoop == false){
												quantityDetails.transactionUomConversionRate = stockconversionRate;
												quantityDetails = tallyScanUtility.getCalculatedTallyScanQty(quantityDetails);
												quantityDetails.tallyScanBarCodeQty = quantityDetails.tallyScanOrderQty;
												tallyscanQty = quantityDetails.tallyscanQty;
												if(isItemScanned == 'isItemScanned'){
													lotName = requestParams.lotName;
												}
												if(itemType != "serializedinventoryitem" && itemType!="serializedassemblyitem"){
													tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanJSONObject(tallyLoopObj, '', lotName, Number(Big(tallyscanQty).mul(stockconversionRate)) , statusId);
												}
												barcodeQuantity = tallyScanUtility.getQtyObjectToBePopulated(quantity, quantityDetails.qtyUOMObj, stockconversionRate);
												quantityDetails.barcodeQuantity = barcodeQuantity;
												quantityDetails.tallyScanOrderQty = tallyScanBarCodeQty;
												quantityDetails.quantity = quantityDetails.tallyScanBarCodeQty;
												bintransferObj.opentaskQty = quantityDetails.tallyScanBarCodeQty;
												quantityDetails.numberOfTimesSerialScanned = quantityDetails.tallyScanBarCodeQty;
												quantityDetails.tallyLoopObj = tallyLoopObj;
												quantityDetails.remainingTallyQuantity = Number(Big(expectedQuantity).minus(Big(quantityDetails.tallyScanBarCodeQty)));
												quantityDetails.navigateToSameScreen = true;
												quantityDetails.itemName = itemName;
												if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem") &&
													!utility.isValueValid(itemDetailsObj.errorMessage)){
													log.debug("numberOfTimesSerialScanned",numberOfTimesSerialScanned);
													var scannedSerialsArr = [];
														if ((!utility.isValueValid(numberOfTimesSerialScanned) || numberOfTimesSerialScanned == 0)
															&& (noStockAction != 'nostock')) {

															if (utility.isValueValid(requestParams.scannedserialsArr)) {
																scannedSerialsArr = requestParams.scannedserialsArr;
															}
															closeExistingSerials(itemDetailsObj.binInternalid, itemDetailsObj.pickItemId,scannedSerialsArr);
														}

													itemDetailsObj = tallyScanUtility.getExitingSerialORCreate(itemDetailsObj);
													if(!utility.isValueValid(itemDetailsObj.errorMessage)) {

														if (utility.isValueValid(requestParams.tallyScanItem)) {
															scannedSerialsArr.push(requestParams.tallyScanItem);
															quantityDetails.scannedserialsArr = scannedSerialsArr;
														}
													}
													quantityDetails.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned) + 1;
													quantityDetails.remainingTallyQuantity = parseInt(scannedQuantityInEach) - quantityDetails.numberOfTimesSerialScanned;
												}
											}else{
												if(itemType != "serializedinventoryitem" && itemType!="serializedassemblyitem"){
													quantityDetails.tallyLoopObj = tallyLoopObj;
												}

											}

											if(utility.isValueValid(itemDetailsObj.errorMessage)){
												skipBinTransferSubmit = true;
												quantityDetails.isValid = false;
												quantityDetails.errorMessage = itemDetailsObj.errorMessage;
											}
											else if(utility.isValueValid(itemDetailsObj.tallyScanitemId) && utility.isValueValid(itemId) && itemDetailsObj.tallyScanitemId != itemId) {
												quantityDetails.errorMessage = translator.getTranslationString('BINTRANSFER_ITEMVALIDATE.INVALID_INPUT');
												skipBinTransferSubmit = true;
												quantityDetails.isValid = false;
											}
											else if(quantityDetails.uomModified == 'T') {
												quantityDetails.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.ALREADYUOMMODIFIED');
												skipBinTransferSubmit = true;
												quantityDetails.isValid = false;
											}
											else if(stageBinId == cartId){
												quantityDetails.errorMessage =  translator.getTranslationString("INVENTORY_TOBINVALIDATE.SAME_FROMANDTOBINS");
												skipBinTransferSubmit = true;
												quantityDetails.isValid = false;
											}
											else if(!utility.isValueValid(lotName) && (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')){
												quantityDetails.errorMessage =  translator.getTranslationString("BINTRANSFER_LOTVALIDATE.INVALID_LOT");
												skipBinTransferSubmit = true;
												quantityDetails.isValid = false;
											}
											else if(!isScannedItemOrLotSerial){
												quantityDetails.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
												skipBinTransferSubmit = true;
												quantityDetails.isValid = false;
											}
											else if (parseFloat(expectedQuantity) > parseFloat(quantityDetails.tallyScanBarCodeQty)){

												skipBinTransferSubmit = true;
											}
											else{
												for (var tallyLoopObjIndex in tallyLoopObj) {
													if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
														lotArray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
														tallyQtyArr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
														statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
													} else if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].statusName) &&  statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
														tallyQtyArr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
														statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
													}
													else
													{
														bintransferObj.quantity = quantityDetails.tallyScanBarCodeQty;
													}
												}
												bintransferObj.lotArray = lotArray;
												bintransferObj.tallyQtyArr = tallyQtyArr;
												bintransferObj.statusArray = statusArray;
												quantityDetails.navigateToSameScreen = false;
											}
										}
										else{
											skipBinTransferSubmit = true;
											quantityDetails.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");
											quantityDetails.isValid = false;
										}
									}
								}
								if (!skipBinTransferSubmit){
									bintransferObj.processType = 'cartPutaway';
									if(actionType == 'cartPutaway' || actionType == 'loadAll' || actionType == 'loadToCartFromStage') {
										bintransferObj.processType = 'cart';
										bintransferObj.fromStatus = statusId;
										var	itemResults = inboundUtility.getItemDetails(itemId,whLocationId);
										log.debug('aaaitemResults',itemResults);
										var itemResultsLength = 0;
										if(itemResults != undefined) {
											itemResultsLength = itemResults.length;
										}
										var preferedBinInternalId = null;
										var objPutBinQueryDetails = {};
										if (itemResultsLength > 0) {

											var isPreferedBin = false;
											var itemPreferedBinLocationId = null;
											var count = 0;
											for (count = 0; count < itemResultsLength; count++) {
												var itemResultsRec = itemResults[count];
												itemPreferedBinLocationId = itemResultsRec.location;
												isPreferedBin = itemResultsRec.preferredbin;
												if(count == 0) {
													if(actionType == 'loadToCartFromStage'){
														bintransferObj.itemType = itemResultsRec.recordType;
													}
													objPutBinQueryDetails.itemGroup = itemResultsRec.custitem_wmsse_itemgroup;
													objPutBinQueryDetails.itemFamily = itemResultsRec.custitem_wmsse_itemfamily;
													objPutBinQueryDetails.blnMixItem = itemResultsRec.custitem_wmsse_mix_item;
													objPutBinQueryDetails.blnMixLot = itemResultsRec.custitem_wmsse_mix_lot;
													var departments =runtime.isFeatureInEffect({feature: 'departments'});
													var classes =runtime.isFeatureInEffect({feature: 'classes'});
													if (departments){
														objPutBinQueryDetails.department = itemResultsRec.department;
													}
													if (classes){
														objPutBinQueryDetails['class'] = itemResultsRec.class;
													}
												}
												if (isPreferedBin == true && (itemPreferedBinLocationId == whLocationId)) {
													var preferedBinName = itemResults[count].binnumber;
													preferedBinInternalId = inboundUtility.getValidBinInternalId(preferedBinName, whLocationId, null);
													break;
												}

											}
										}
										if(utility.isValueValid(preferedBinInternalId))	{
											bintransferObj.recomendedBinId = preferedBinInternalId;	
										}
										else{

											objPutBinQueryDetails.itemInternalId = itemId;						
											objPutBinQueryDetails.warehouseLocationId = whLocationId;
											objPutBinQueryDetails.itemType = itemType;
											objPutBinQueryDetails.lotName = lotName;
											objPutBinQueryDetails.transcationUomInternalId = units;
											objPutBinQueryDetails.fromBinInternalId = stageBinId;
											objPutBinQueryDetails.fromStatusId = statusId;
											var abcVelocityResult = inboundUtility.getItemABCVelocityDetails(itemId,whLocationId);
											var abcVelocityResultLength = 0;
											if(abcVelocityResult != undefined && abcVelocityResult != null){
												abcVelocityResultLength = abcVelocityResult.length;
											}
											if(abcVelocityResultLength > 0){
												for (var itemItr = 0; itemItr < abcVelocityResult.length; itemItr++) {
													var itemRec = abcVelocityResult[itemItr];
													if (itemRec.inventorylocation == whLocationId) {
														objPutBinQueryDetails.locationinvtclassification = itemRec.locationinvtclassification;
														break;
													}
												}
											}
											var binDetails = inboundUtility.getRecomendedBinFromPutStratagie(objPutBinQueryDetails);
											if(binDetails != '{}'){

												bintransferObj.puStratagieId = binDetails.putStratagie;
												bintransferObj.recomendedBinId = binDetails.binId;
											}
										}
										if(utility.isValueValid(bintransferObj.recomendedBinId)) {
											var fields = ['custrecord_wmsse_putseq_no'];
											var binRec = search.lookupFields({type: 'Bin',id: bintransferObj.recomendedBinId,columns: fields});

											if(binRec != undefined)	{
												bintransferObj.recomendedBinSequenceNo = binRec.custrecord_wmsse_putseq_no;	
											}
										}
									}
									if(utility.isValueValid(bintransferObj)) {
										var binTransferId =  '';
										if(actionType == 'loadAll' || actionType == 'loadToCartFromStage' )	{
											if(actionType == 'loadToCartFromStage'){
												try{
													binTransferId = inventoryUtiltiy.putawayallBinTransfer(bintransferObj);
													
												}
												catch(e){
													if(utility.isValueValid(itemText)){
														failedItemsArr.push(itemText);
													}
													log.error('e',e);
												}

											}
											else{
												binTransferId = inventoryUtiltiy.putawayallBinTransfer(bintransferObj);
											}
										}
										else{
											bintransferObj.isTallyScanRequired = isTallyScanRequired;
											if(inventoryStatusFeature == false){
												bintransferObj.fromStatus = '';
												bintransferObj.toStatus = '';
											}
											binTransferId = inventoryUtiltiy.inventoryBinTransfer(bintransferObj);
											quantityDetails.tallyLoopObj = '';
											quantityDetails.barcodeQuantity = '';
											quantityDetails.tallyScanOrderQty = '';
											quantityDetails.tallyScanBarCodeQty = '';
											if(binTransferId) {
												quantityDetails.binTransferId = binTransferId.inventoryCountId;

											}
										}
										quantityDetails.scannedQuantity = quantity;	
										quantityDetails.scannedQuantityWithUOM = quantity;
										if(utility.isValueValid(units)){
											quantityDetails.scannedQuantityWithUOM = quantity + " "+units;
										}
										if(actionType != 'cartPutaway' && actionType != 'loadAll' && actionType != 'loadToCartFromStage')	{
											var openTaskResults = inboundUtility.getOpenTaskID(itemId,stageBinId,whLocationId,recomendedBinId);
											var openTask = 0;
											var openTaskResultsLength = openTaskResults.length;
											for(openTask = 0; openTask < openTaskResultsLength ; openTask ++){
												inboundUtility.updateNSrefno(openTaskResults[openTask].internalid,binTransferId,quantity);
											}
											var cartPutawayRecords = [];
											log.debug({title:'itemType',details:itemType});
											if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')&& actionType != 'loadAll'){
												var objLotDetails = inventoryUtiltiy.getPickBinDetailsLotWithExpiryDates(itemId,stageBinId,'',whLocationId,
														null,"","","F","","","", '','',locUseBinsFlag);
												if(binTransferIdStr != "" && binTransferIdStr != undefined){
													quantityDetails.binTransferId = binTransferIdStr + ","+quantityDetails.binTransferId;
												}
												log.debug({title:'lotName',details:lotName});
												if(objLotDetails.length > 1){
													quantityDetails.navigateToLotPage = 'Y';
													quantityDetails.lotInternalId = '';
												}
												else{
													if(objLotDetails.length > 0){
														if(lotName != objLotDetails[0].lotnumber){
															quantityDetails.navigateToLotPage = 'Y';
															quantityDetails.lotInternalId = '';
														}
													}
												}
											}
											if(quantityDetails.navigateToLotPage != 'Y'){
												cartPutawayRecords = utility.getInventoryDetailsFromBins(stageBinId,whLocationId);
											}

											if(cartPutawayRecords.length > 0 ){
												quantityDetails.navigateToCartPutaway = 'Y';	
											}
											else {
												quantityDetails.navigateToCartPutaway = 'N';
											}
										}
										else {
											quantityDetails.itemsCountInCart = 1;
											if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')&&
													actionType != 'loadAll' &&  actionType != 'loadToCartFromStage'){

												var objLotDetails = inventoryUtiltiy.getPickBinDetailsLotWithExpiryDates(itemId,stageBinId,'',whLocationId,
														null,"","","F","","","", '','',locUseBinsFlag);
												log.debug({title:'objLotDetails',details:objLotDetails});

												if(objLotDetails.length > 1){
													quantityDetails.navigateToLotPage = 'Y';	 
												}
												else{
													if(objLotDetails.length > 0){
														if(lotName != objLotDetails[0].lotnumber){
															quantityDetails.navigateToLotPage = 'Y';
														}
													}
												}
												quantityDetails.popupItemName = itemName;
												quantityDetails.itemName = itemName;
											}
											quantityDetails.cartLoadAllMessage = '';
											log.debug({title:'failedItemsArr',details:failedItemsArr});
											if(actionType == 'loadToCartFromStage'){
												var messageParams = [];
												if(failedItemsArr.length == 0){
													messageParams.push(stageName);
													messageParams.push(cartName);

													quantityDetails.cartLoadAllMessage = translator.getTranslationString("WMS_CART_LOADTOSTAGE.SUCESSMSG",messageParams);
												}
												else{
													var failedItems = failedItemsArr.toString();
													messageParams.push(failedItems);
													messageParams.push(stageName);
													messageParams.push(cartName);
													quantityDetails.cartLoadAllMessage = translator.getTranslationString("WMS_CART_LOADTOSTAGE.PARTIALSUCESSMSG",messageParams);
												}
											}
											else{
												quantityDetails.scannedQuantity = '';
												quantityDetails.scannedStatus = '';
												quantityDetails.lotName = '';
												quantityDetails.itemName = '';
												quantityDetails.popupItemName = itemName;
												quantityDetails.showCartPopUp = 'Y';
											}

										}
										quantityDetails.isValid = true;
									}
								}
							}
						}
					}
				}
				else {
					if(actionType == 'loadToCartFromStage'){
						quantityDetails.errorMessage = translator.getTranslationString('WMS_CART_LOADTOSTAGE.INVALIDINPUT');
						quantityDetails.isValid = false;
					}
					else{
						quantityDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTQUANTITYVALIDATE');
						quantityDetails.isValid = false;
					}
				}

				if(utility.isValueValid(statusName))
				{
					quantityDetails.defaultvalue = statusName;
				}
			}
			else {
				quantityDetails.errorMessage = translator.getTranslationString('CARTPUTAWAY_CARTQUANTITYVALIDATE');
				quantityDetails.isValid = false;
			}
			log.debug({title:'quantityDetails',details:quantityDetails});
		}
		catch(e){
			quantityDetails.isValid = false;
			quantityDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return quantityDetails;
	}
	function checkInventoryOfSelectedItems(itemIdArr,location,fromBinId){

		log.debug('location',location);
		log.debug('fromBinId',fromBinId);

		var objBinDetails =[];
		var vBinLocArr=[];
		var invBalanceSearch = search.load({id:'customsearch_wmsse_invbalance_itemdtls',type:search.Type.INVENTORY_BALANCE});
		var filters = invBalanceSearch.filters;
		if(utility.isValueValid(itemIdArr))
		{
			filters.push(search.createFilter({
				name:'internalid',
				join:'item', 
				operator:search.Operator.ANYOF, 
				values:itemIdArr}));
		}

		if(utility.isValueValid(location))
		{
			filters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF, 
				values:location}));
		}
		if(utility.isValueValid(fromBinId))
		{
			filters.push(search.createFilter({
				name:'binnumber',
				operator:search.Operator.ANYOF, 
				values:fromBinId}));
		}

		invBalanceSearch.filters = filters;
		return utility.getSearchResults(invBalanceSearch);
	}
	function closeExistingSerials(binId,itemId,alreadyScannedSerialsArr){
		var serialSearch = search.load({
			id: 'customsearch_wmsse_wo_serialentry_srh',
		});
		var serailFilters = serialSearch.filters;
		serailFilters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_tasktype',
			operator: search.Operator.ANYOF,
			values: 9
		}));
		if(utility.isValueValid(binId)){
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_bin',
				operator: search.Operator.ANYOF,
				values: binId
			}));
		}
		if(utility.isValueValid(itemId)){
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_item',
				operator: search.Operator.ANYOF,
				values: itemId
			}));
		}
		log.debug("itemId",itemId);
		log.debug("binId",binId);
		var	serialSearchResults = utility.getSearchResultInJSON(serialSearch);
		log.debug("serialSearchResults",serialSearchResults);
		if(serialSearchResults.length > 0){
			for (var j = 0; j < serialSearchResults.length; j++) {
				var TempRecord = serialSearchResults[j];
				if(alreadyScannedSerialsArr.indexOf(TempRecord.name) == -1) {
					var id = record.submitFields({
						type: 'customrecord_wmsse_serialentry',
						id: TempRecord.id,
						values: {
							id: TempRecord.id,
							name: TempRecord.name,
							custrecord_wmsse_ser_note1: 'because of discontinue of serial number scanning we have marked this serial number as closed',
							custrecord_wmsse_ser_status: true
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields: true
						}
					});
				}
			}
		}
	}
	return {
		'post': doPost

	};
});
