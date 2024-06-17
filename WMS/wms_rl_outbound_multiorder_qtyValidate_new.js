/**
 *    Copyright ï¿½ 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/record','./wms_utility','./wms_translator','N/config','./big', 'N/runtime',
	'./wms_outBoundUtility','N/task','./wms_tallyScan_utility'],

	function(search,record,utility,translator,config,bigJS, runtime,obUtility,task,tallyScanUtility) {


	function doPost(requestBody) {

		var pickqtyValidate = {};
		
		try{
			var requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				log.debug({title:'requestParams',details:requestParams});
				var totalLinepickqty='';
				var isContainerScanRequired;
				var pickTaskId = requestParams.pickTaskId;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var fromBinInternalId = requestParams.fromBinInternalId;
				var itemInternalId = requestParams.itemInternalId;
				var pickQty = requestParams.pickQty;
				var enterQty = requestParams.enterQty;
				var pickStatusInternalId = requestParams.pickStatusInternalId;				
				var itemType = requestParams.itemType;
				var lotName = requestParams.lotName;
				var lotQtyString = requestParams.lotQtyString;
				var statusText = requestParams.statusText;
				var transactionUomName = requestParams.transactionUomName;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var boolBinEmpty = requestParams.boolBinEmpty;
				var waveId = requestParams.waveId;
				var waveName = requestParams.waveNumber;
				var orderInternalId = requestParams.orderInternalId;
				var customerString = requestParams.customerString;
				var lineNoString = requestParams.lineNoString;
				var transactionNameString = requestParams.transactionNameString;
				var lotString = requestParams.lotString;
				var transactionName = requestParams.transactionName;
				var transactionInternalId = requestParams.transactionInternalId;
				var lineItemPickedQuantity = requestParams.lineItemPickedQuantity;
				var customer = requestParams.customer;
				var line = requestParams.line;
				var remainingQtyString = requestParams.remainingQty;
				var statusString = requestParams.statusString;
				var unitType = requestParams.unitType;
				var transactiontype = requestParams.transactiontype;
				var inventoryDetailLotOrSerial = requestParams.inventoryDetailLotOrSerial;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var isTallyScanRequired = requestParams.isTallyScanRequired;
				var barcodeQuantity=requestParams.barcodeQuantity;
				var tallyscanitem=requestParams.tallyscanitem;
				var lblRemainingQuantity=requestParams.lblRemainingQuantity;
				var tallylotObj=requestParams.tallylotObj;
				var numberOfTimesSerialScanned=requestParams.numberOfTimesSerialScanned;
				var barcodeLotname=requestParams.barcodeLotname;
				var transactionuomValue=requestParams.transactionuomValue;
				var tallyScanOrderQty=requestParams.tallyScanBarCodeQty;
				var uomConvRateofBarCode = requestParams.uomConvRateofBarCode;	
				var btnClicked = requestParams.btnClicked;
				var pickingType = requestParams.pickingType;
				var bulkPickQty = requestParams.bulkPickQty;
				var stockUomConversionRate =requestParams.stockUomConversionRate;
				var showSkipBtn = requestParams.showskipbtn;
				var qtyUomSelected = requestParams.qtyUomSelected;
				var uomSelectionforFirstItr = requestParams.uomSelectionforFirstItr;
				var tallyLoopObj  = requestParams.tallyLoopObj;
				var tallyScanSerial  = requestParams.tallyScanSerial; 
				var scannedQuantityInBaseUnits  = requestParams.scannedQuantityInBaseUnits;
				var skipBtnCount = requestParams.skipbtncount;
				var boolNoStock = requestParams.boolNoStock;
				
				log.debug('requestParams',requestParams);
				
				tallyLoopObj = utility.isValueValid(tallyLoopObj) ? tallyLoopObj : {};
				locUseBinsFlag = utility.isValueValid(locUseBinsFlag) ? locUseBinsFlag : true;

				if( boolBinEmpty === true || boolBinEmpty === 'true'|| boolNoStock === true || boolNoStock === 'true' ||
						(utility.isValueValid(btnClicked) && btnClicked == 'skip'))
				{  
					if(isTallyScanRequired && utility.getObjectLength(tallyLoopObj) > 0){
					isContainerScanRequired = utility.getSystemRuleValue("Use cartons for multi-order picking?",
							warehouseLocationId);

					if ( isContainerScanRequired === 'Y') {
						pickqtyValidate.isValid = true;
						pickqtyValidate.enterqty = tallyScanOrderQty;
						pickqtyValidate.isCartonScanRequired = true;
						pickqtyValidate.tallyLoopObj = tallyLoopObj;
						pickqtyValidate.totalLinepickqty = Number(bigJS(tallyScanOrderQty).plus(lineItemPickedQuantity));
						pickqtyValidate.pickQty = tallyScanOrderQty;
						pickqtyValidate.boolNoStock = boolNoStock;
						pickqtyValidate.boolBinEmpty = boolBinEmpty;
					} else {
						var picktaskObj = {};
						picktaskObj.isTallyScanRequired = isTallyScanRequired;
						picktaskObj.whLocation = warehouseLocationId;
						picktaskObj.picktaskid = pickTaskId;
						picktaskObj.pickqty = tallyScanOrderQty;
						picktaskObj.fromBinId = fromBinInternalId;
						picktaskObj.itemType = itemType;
						picktaskObj.line = line;
						picktaskObj.orderInternalId = orderInternalId;
						picktaskObj.totalLinepickqty = Number(bigJS(tallyScanOrderQty).plus(lineItemPickedQuantity));
						picktaskObj.locUseBinsFlag = locUseBinsFlag;
						picktaskObj.tallyLoopObj =tallyLoopObj;
						picktaskObj.itemId =itemInternalId;

						obUtility.multiorderpicktaskupdate(picktaskObj);
						if(boolBinEmpty === 'true'|| boolNoStock === 'true')
					  pickqtyValidate.isPickTasklistNavigationRequired = true;
					}
					
				}

				if(utility.getObjectLength(tallyLoopObj) === 0 && (boolBinEmpty === true || boolBinEmpty === 'true'|| boolNoStock === true || boolNoStock === 'true')){
					    obUtility.fnEmptyBinOrNoStock(pickTaskId); 
					    pickqtyValidate.isPickTasklistNavigationRequired = true;
				}else if(btnClicked == 'skip'){
				     	if(!utility.isValueValid(skipBtnCount)){
								skipBtnCount = 1;
							}
							else{
								skipBtnCount = parseInt(skipBtnCount) + 1;
							}

							var orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,
									pickTaskId,'',transactiontype,'');
							var ordersLength = orderDetails.length;

							if(ordersLength > 0 ) {
								if(skipBtnCount >= ordersLength) {
									skipBtnCount = ordersLength - 1;
								}
								if(!(isTallyScanRequired && pickqtyValidate.isCartonScanRequired)){
								var ordObj = orderDetails[skipBtnCount];
								fillObjectWithNextOrderDetails (ordObj,pickqtyValidate,unitType,isTallyScanRequired);
								pickqtyValidate.isSamePageNavigationRequired = 'T'; 
							    if(isTallyScanRequired) {
									if(utility.isValueValid(unitType)) {
										pickqtyValidate.barcodeQuantity = [{'value': 1, 'unit': uomSelectionforFirstItr}];
									}
									else {
										pickqtyValidate.barcodeQuantity = [{'value': 1}];	
									}
									pickqtyValidate.uomTobePopulated = pickqtyValidate.barcodeQuantity;
									pickqtyValidate.tallyScanBarCodeQty = 0 ;

								}	
						    	}else{
						    	pickqtyValidate.transactionInternalId = orderInternalId;
						        pickqtyValidate.transactionName = transactionName;
					         	pickqtyValidate.line=line;
					         	pickqtyValidate.customerString = customerString;
					         	pickqtyValidate.totalLinepickqty = Number(bigJS(tallyScanOrderQty).plus(lineItemPickedQuantity));
					         	pickqtyValidate.pickQty = tallyScanOrderQty;
							   }
								
								pickqtyValidate.skipbtncount = skipBtnCount;
								if(parseInt(skipBtnCount)+1 >= ordersLength) {
									pickqtyValidate.showskipbtn = 'F';
								}
								else {
									pickqtyValidate.showskipbtn = 'T';
								}
							}
				     }   
				}
				else
				{
					if( utility.isValueValid(warehouseLocationId) && utility.isValueValid(pickTaskId) &&
							((utility.isValueValid(pickQty) && utility.isValueValid(itemInternalId) && 
									(utility.isValueValid(fromBinInternalId) || 
											(itemType == 'noninventoryitem' || locUseBinsFlag === false )))))	{
						
						var isInvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
						var itemDetails={};
							if(isTallyScanRequired){
								
								var itemValidateObj = {};
								itemValidateObj.tallyScanItem = tallyscanitem;
								itemValidateObj.pickTaskId = pickTaskId;
								itemValidateObj.tallyScanitemId = itemInternalId;
								itemValidateObj.tallyScanSerial = tallyScanSerial;
								itemValidateObj.pickBinId = fromBinInternalId;
								itemValidateObj.pickItemId = itemInternalId;
								itemValidateObj.transactionInternalId = transactionInternalId;
								itemValidateObj.InvStatusInternalId = pickStatusInternalId;
								itemValidateObj.warehouseLocationId = warehouseLocationId;
								itemValidateObj.unitType = unitType;
								itemValidateObj.transactionUomName = transactionUomName;
								itemValidateObj.transactionuomId = transactionuomValue;
								itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
								itemValidateObj.uomSelectionforFirstItr = uomSelectionforFirstItr;
								itemValidateObj.qtyUomSelected = qtyUomSelected;
								itemValidateObj.transactionUomConversionRate = transactionUomConversionRate;
								itemValidateObj.tallyScanOrderQty = tallyScanOrderQty;
								itemValidateObj.scannedQuantityInBaseUnits = scannedQuantityInBaseUnits;
								itemValidateObj.numberOfTimesSerialScanned = numberOfTimesSerialScanned;
								itemValidateObj.isTallyScanRequired = isTallyScanRequired;
								itemValidateObj.itemType = itemType;
								pickqtyValidate.transactionuomValue = transactionuomValue;
								log.debug('itemValidateObj11',itemValidateObj);
								if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"){
									pickqtyValidate = tallyScanUtility.validateSerialTallyScan(itemValidateObj);
									if(utility.isValueValid(pickqtyValidate.objinvNumSearchRes) && 
											(pickqtyValidate.objinvNumSearchRes).length > 1){
										pickqtyValidate.navigateToLotItemsListScreen = 'T';
									}
								}else{
									pickqtyValidate = tallyScanUtility.validateItemTallyScan(itemValidateObj);
								}
								log.debug('pickqtyValidate1',pickqtyValidate);
								pickqtyValidate = tallyScanUtility.getCalculatedTallyScanQty(pickqtyValidate);
								log.debug('pickqtyValidate2',pickqtyValidate);
								enterQty = pickqtyValidate.tallyScanOrderQty;
								lotName = pickqtyValidate.barcodeLotname;
								if(!utility.isValueValid(lotName) && !utility.isValueValid(pickqtyValidate.errorMessage) && 
										(itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

									var lotDetails = {}; 
									lotDetails.warehouseLocationId = warehouseLocationId;
									lotDetails.itemInternalId = itemInternalId;
									lotDetails.fromBinInternalId = fromBinInternalId;
									var itemLotDetails = obUtility.getPickingLotDetails(lotDetails);
									log.debug('itemLotDetails',itemLotDetails);
									if(itemLotDetails.length > 0) {
										
										if(itemLotDetails.length > 1) {
											pickqtyValidate.isSamePageNavigationRequired = 'F';
											pickqtyValidate.isLotScanNavigationRequired = false;
											pickqtyValidate.navigateToLotListScreen = 'T';

										}
										else {
											lotName = itemLotDetails[0].inventorynumberText;
										}
									}
								}

								if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && 
										utility.isValueValid(pickqtyValidate.errorMessage)) {
									
										lotName = tallyscanitem;
										itemDetails = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, lotName, fromBinInternalId);
										log.debug('itemDetails',itemDetails);
										if(itemDetails.length > 0){
											if(utility.isValueValid(unitType)){
											pickqtyValidate = tallyScanUtility.getUOMToBeConsideredObj(itemValidateObj);
											}
											log.debug('itemDetails pickqtyValidate',pickqtyValidate);
											pickqtyValidate.errorMessage = '';
											pickqtyValidate.isValid = true;
											if(itemDetails.length > 1){
											pickqtyValidate.isSamePageNavigationRequired = 'F';
											pickqtyValidate.isLotScanNavigationRequired = false;
											pickqtyValidate.navigateToLotListScreen = 'F';
											pickqtyValidate.navigateToLotItemsListScreen = 'T';
											}
										}
								}

							}
							if(utility.isValueValid(pickqtyValidate.errorMessage))
							{
								pickqtyValidate.isValid = false;
							}
							else if(isTallyScanRequired && (itemInternalId != pickqtyValidate.tallyScanitemId))
							{
								pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALID_ITEM_TALLYSCAN');
								pickqtyValidate.isValid = false;
							}
							else if(!utility.isValueValid(enterQty))
							{
								pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
								pickqtyValidate.isValid = false;
							}
							else if((parseFloat(enterQty) > parseFloat(pickQty)) && pickingType!='BULK') {
								pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.ENTERQTY");
								pickqtyValidate.isValid = false;
							}
							else if((parseFloat(enterQty) > parseFloat(bulkPickQty)) && pickingType=='BULK') {
								pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.BULKPICKQTY");
								pickqtyValidate.isValid = false;
							}
							else {
								log.debug('lotName',lotName);
								log.debug('pickqtyValidate.navigateToLotListScreen',pickqtyValidate.navigateToLotListScreen);
								var serailQty =enterQty;
								if(!utility.isValueValid(transactionUomConversionRate))	{
									transactionUomConversionRate = 1;
									transactionUomName = '';
								}
								serailQty =	Number(bigJS(serailQty).mul(transactionUomConversionRate));
								if(serailQty.toString().indexOf('.') != -1 && 
										(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"))	{

									pickqtyValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_.SERIALITEM_DECIMALS_NOTALLOWED');
									pickqtyValidate.isValid = false;
								}								
								else if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" ) && !isTallyScanRequired) {

									if(utility.isValueValid(statusText)) {
										pickqtyValidate.statusString = utility.isValueValid(statusString) ? (statusString+","+statusText) : statusText;
									}
									pickqtyValidate.numberOfTimesSerialScanned = 0;
									pickqtyValidate.scannedQuantityInEach = serailQty;
									pickqtyValidate.totalLinepickqty = totalLinepickqty;
									pickqtyValidate.pickedQty = requestParams.pickedQty;
									pickqtyValidate.remainingQty = remainingQtyString;	
									pickqtyValidate.transactionNameString = transactionNameString;
									pickqtyValidate.remainingQuantity = pickQty;
									pickqtyValidate.transactionUomName = transactionUomName;
									pickqtyValidate.lineNoString = lineNoString;
									pickqtyValidate.enterqty = enterQty;
									pickqtyValidate.isValid = true;	
								}
								else if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && 
										((!utility.isValueValid(lotName)) && ((isTallyScanRequired == false) || 
												(isTallyScanRequired == true && pickqtyValidate.navigateToLotListScreen != 'T'))) ) {

									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
									pickqtyValidate.isValid = false;	
								}
								else if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
										&& ((utility.isValueValid(inventoryDetailLotOrSerial)) && (inventoryDetailLotOrSerial != lotName)) ) {

									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_INVENTDETAILS_VALIDLOT");
									pickqtyValidate.isValid = false;	
								}
								else if( isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")
										&& (utility.isValueValid(inventoryDetailLotOrSerial) && (inventoryDetailLotOrSerial != pickqtyValidate.tallyScanSerial)) ) {

									pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_INVENTDETAILS_VALIDSERIAL");
									pickqtyValidate.isValid = false;	
								}
								else {
									var lotInternalId = '';
									if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {

										lotInternalId = utility.inventoryNumberInternalId(lotName, warehouseLocationId, itemInternalId);
										log.debug({title:'lotInternalId',details:lotInternalId});
									}

									if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && 
											!utility.isValueValid(lotInternalId)) {
										pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_VALIDLOT");
										pickqtyValidate.isValid = false;
									}
									else {
										var lotAvailableQty = 0;
										if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && 
												(pickqtyValidate.navigateToLotListScreen != 'T' )) {	
											var lotDetails = {};
											lotDetails.warehouseLocationId = warehouseLocationId;
											lotDetails.itemInternalId = itemInternalId;
											lotDetails.fromBinInternalId = fromBinInternalId;
											lotDetails.invStatusFeature = isInvStatusFeatureEnabled;
											lotDetails.lotInternalId = lotInternalId;
											lotDetails.fromInventorystatus = pickStatusInternalId;

											pickqtyValidate.lotName = lotName;
											pickqtyValidate.lotInternalId = lotInternalId;	

											if(utility.isValueValid(transactiontype) && transactiontype=='TrnfrOrd') {
												lotDetails.orderType = transactiontype;
											}												
											var	lotValidateDetails = obUtility.getPickingLotDetails(lotDetails);
											log.debug({title:'lotValidateDetails',details:lotValidateDetails});	

											if(lotValidateDetails.length > 0) {

												var inventoryNumber = lotValidateDetails[0].inventorynumberText;
												if(inventoryNumber == lotName) {
													isLotvalidation = true;
													pickqtyValidate.lotInternalId = lotValidateDetails[0].inventorynumber;
													pickqtyValidate.defaultStatus = lotValidateDetails[0].statusText;
													var lotAvailableQty = lotValidateDetails[0].available;
													if(utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(stockUomConversionRate) && 
															(stockUomConversionRate != transactionUomConversionRate))
													{
														lotAvailableQty = utility.uomConversions(lotAvailableQty,transactionUomConversionRate,stockUomConversionRate);
													}

												}
											}
										}
										if(isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){

											pickqtyValidate = tallyScanUtility.getExitingSerialORCreate(pickqtyValidate);
										}
										if(utility.isValueValid(pickqtyValidate.errorMessage)){
											pickqtyValidate.isValid = false;
										}
										else if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
												(parseFloat(enterQty) > parseFloat(lotAvailableQty)) && (pickqtyValidate.navigateToLotListScreen != 'T')) {
											log.debug({title:'lotAvailableQty',details:lotAvailableQty});	
											log.debug({title:'enterQty',details:enterQty});	
											pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.LOTPICKQTY");
											pickqtyValidate.isValid = false;

										}else{
											
											//info screen varaibles setting start
											if(utility.isValueValid(statusText)) {
												pickqtyValidate.statusString = utility.isValueValid(statusString) ? (statusString+","+statusText) : statusText;
											}
											if(utility.isValueValid(customer)) {
											pickqtyValidate.customerString = utility.isValueValid(customerString) ? (customerString+","+customer) : customer;
											}
											pickqtyValidate.lineNoString = utility.isValueValid(lineNoString) ? (lineNoString+","+line) : line;
											pickqtyValidate.transactionNameString = utility.isValueValid(transactionNameString) ? (transactionNameString+","+transactionName) : transactionName;
											if(utility.isValueValid(lotName)) {
												pickqtyValidate.lotString = utility.isValueValid(lotString) ? (lotString+","+lotName) : lotName;
											}
											//info screen varaibles setting end
											
											var systemRule = "Use cartons for multi-order picking?";
											if(itemType != "noninventoryitem")	{
												isContainerScanRequired = utility.getSystemRuleValue(systemRule,warehouseLocationId);
												if(isContainerScanRequired == 'N') {
													isContainerScanRequired = false;
												}
												else {
													pickqtyValidate.stageCompleteScreenLabel = translator.getTranslationString('MULTIORDERPICKING.STAGECOMPLETECARTONS');
													isContainerScanRequired = true;
												}
											}

											lineItemPickedQuantity = utility.isValueValid(lineItemPickedQuantity)?lineItemPickedQuantity:0;
											totalLinepickqty = Number(bigJS(enterQty).plus(lineItemPickedQuantity));
											pickqtyValidate.picktaskId = pickTaskId;
											pickqtyValidate.isContainerScanRequired = isContainerScanRequired;
											if(isTallyScanRequired){
												if(pickqtyValidate.navigateToLotListScreen != 'T' && pickqtyValidate.navigateToLotItemsListScreen != 'T') {
													tallyLoopObj = tallyScanUtility.createOrUpdateTallyScanObj(tallyLoopObj,itemType,orderInternalId,line,enterQty,pickStatusInternalId,'',lotName,pickqtyValidate);
												}
												pickqtyValidate.tallyLoopObj = tallyLoopObj;
											}
											
											if(isTallyScanRequired && ((parseFloat(enterQty) < parseFloat(pickQty)) || 
													((!utility.isValueValid(lotName) && pickqtyValidate.navigateToLotListScreen == 'T' ) || 
													(utility.isValueValid(lotName) && pickqtyValidate.navigateToLotItemsListScreen == 'T' )))){

												if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')
														&& ((!utility.isValueValid(lotName) && pickqtyValidate.navigateToLotListScreen == 'T') || 
																(utility.isValueValid(lotName) && pickqtyValidate.navigateToLotItemsListScreen == 'T' )
														)){
													pickqtyValidate.isValid = true;
													pickqtyValidate.tallyScanBarCodeQty = parseFloat(enterQty);
													pickqtyValidate.pickStatusInternalId = pickStatusInternalId;
													pickqtyValidate.lblRemainingQuantity = requestParams.remainingQty;
													pickqtyValidate.remainingQuantity   = requestParams.remainingQuantity;
													pickqtyValidate.remainingQty   = requestParams.remainingQty;
													pickqtyValidate.transactionType = transactiontype;
													pickqtyValidate.lineItemPickedQuantity = lineItemPickedQuantity;
													pickqtyValidate.tallyScanOrderQty = tallyScanOrderQty;
													pickqtyValidate.line = line;
													pickqtyValidate.showskipbtn = showSkipBtn;
												}else if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" )&& pickqtyValidate.navigateToLotItemsListScreen == 'T'){
													pickqtyValidate.isValid = true;
												}
												else{
													pickqtyValidate.isSamePageNavigationRequired = 'T';
													var quantityUOMObj = tallyScanUtility.getQtyObjectToBePopulated(enterQty,pickqtyValidate.qtyUOMObj,transactionUomConversionRate);
													pickqtyValidate.barcodeQuantity = quantityUOMObj;
													pickqtyValidate.tallyScanBarCodeQty = parseFloat(enterQty) ;
													var pickOrderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,pickTaskId,'',transactiontype,'');
													if(!utility.isValueValid(skipBtnCount) || (utility.isValueValid(skipBtnCount) && (parseInt(skipBtnCount)+1) > pickOrderDetails.length)) {
														skipBtnCount = 0;
													}
													log.debug('skipBtnCount',skipBtnCount);
													fillObjectWithNextOrderDetails (pickOrderDetails[skipBtnCount],pickqtyValidate,unitType,isTallyScanRequired);
													pickqtyValidate.isValid = true;
													pickqtyValidate.tallyScanOrderQty = tallyScanOrderQty;
													pickqtyValidate.showskipbtn = showSkipBtn;
													pickqtyValidate.remainingQty   = requestParams.remainingQty;
													pickqtyValidate.line = line;
													pickqtyValidate.uomTobePopulated = quantityUOMObj; 
													pickqtyValidate.isContainerScanRequired = false; // Overriding for tallyscan 
													if(!(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" )){
														pickqtyValidate.lblRemainingQuantity = Number(bigJS(parseFloat(pickQty)).minus(parseFloat(enterQty)));
													}
													
												}
											}else if(isContainerScanRequired) {
												pickqtyValidate.isValid = true;
												pickqtyValidate.totalLinepickqty = totalLinepickqty;
												pickqtyValidate.enterqty = enterQty;
												pickqtyValidate.transactionInternalId = orderInternalId;
												pickqtyValidate.transactionName = transactionName;
												pickqtyValidate.isTallyScanRequired = isTallyScanRequired;
												pickqtyValidate.line=line;
											}else{
												var picktaskObj = {};
												picktaskObj.whLocation = warehouseLocationId;
												picktaskObj.picktaskid = pickTaskId;
												picktaskObj.pickqty = enterQty;
												picktaskObj.fromBinId = fromBinInternalId;
												picktaskObj.batchno = lotName;
												picktaskObj.statusInternalId = pickStatusInternalId ;
												picktaskObj.itemType = itemType;
												picktaskObj.line = line;
												picktaskObj.orderInternalId = orderInternalId;
												picktaskObj.totalLinepickqty = totalLinepickqty;
												picktaskObj.locUseBinsFlag = locUseBinsFlag;
												picktaskObj.lotInternalId =lotInternalId;
												picktaskObj.tallyLoopObj =tallyLoopObj;
												picktaskObj.itemId = itemInternalId;

												var remainQty = 0;
												if(pickingType == 'BULK'){
													// To get orders list by order priority and age of order
													var pickActionIdArray = obUtility.getOrdersForBulkPick(pickTaskId,itemInternalId);
													picktaskObj.pickActionIdArray = pickActionIdArray;
													if(pickActionIdArray.length <= 10){
														obUtility.bulkpicktaskupdate(picktaskObj);
														remainQty = Number(bigJS(bulkPickQty).minus(enterQty));
														if(parseFloat(remainQty) > 0 )	{
															pickqtyValidate.isSamePageNavigationRequired = 'T';
														}
													}else{

														// Calling scheduler for large data set processing	
														var mapReduceJobId = updateBulkPickTaskAsync(pickTaskId,enterQty,fromBinInternalId,lotName,
																pickStatusInternalId,itemType,locUseBinsFlag,pickActionIdArray);
														var currentUserID = runtime.getCurrentUser().id ;//To get current user
														utility.updateScheduleScriptStatus('PickTask Update Mapreduce',currentUserID, 
																'Submitted',pickTaskId);
														log.debug('mapReduceJobId',mapReduceJobId);
														pickqtyValidate.isBulkMapreduceInvoke = 'T';
													}

													remainQty = Number(bigJS(bulkPickQty).minus(enterQty));
													pickqtyValidate.bulkPickQty = remainQty;
													if(parseFloat(remainQty) > 0 )	{
														remainQty = remainQty +" "+ transactionUomName;	
														pickqtyValidate.bulkPickQtyUOM = remainQty;
													}
												}
												else {
													picktaskObj.isTallyScanRequired = isTallyScanRequired;
													obUtility.multiorderpicktaskupdate(picktaskObj);
													remainQty = Number(bigJS(pickQty).minus(enterQty));
													if(parseFloat(remainQty) > 0 )	{
														pickqtyValidate.isSamePageNavigationRequired = 'T';
														if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') &&
																(parseFloat(enterQty) < parseFloat(pickQty))) {  
															var lotRemainingQty = Number(bigJS(pickQty).minus(enterQty));
															pickqtyValidate.lotTotalQuantity = lotRemainingQty;
															pickqtyValidate.remainingQuantity = lotRemainingQty;
															pickqtyValidate.lineItemPickedQuantity = enterQty;
															pickqtyValidate.lblRemainingQuantity =  lotRemainingQty + " "+ transactionUomName;

														}
													}

												}
												var impactedRecords={};
												if(transactiontype == 'TrnfrOrd'){
													impactedRecords= obUtility.noCodeSolForPicking(pickTaskId, waveId,'' ,transactionInternalId,line,1);
												}else{
													impactedRecords = obUtility.noCodeSolForPicking(pickTaskId, waveId,transactionInternalId ,'',line,1);
												}
												pickqtyValidate.impactedRecords = impactedRecords;
												log.debug({title:'lineRemainingQty',details:pickQty});


												if(parseFloat(remainQty) <= 0 )	{
													if(itemType == "noninventoryitem" && locUseBinsFlag != false) { 
														var stageNonInventoryItemPickTask = obUtility.updateStageForNonInventoryItem(pickTaskId,line,"multiorder",orderInternalId);
													}
												}

												var orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,pickTaskId,'',transactiontype,remainQty);
												var ordersLength = orderDetails.length;
												if(ordersLength > 0){
													pickqtyValidate.isSamePageNavigationRequired = 'T';
													var qtyRemaining = 0;
													var ordDetail = 0 ;
													for(ordDetail=0; ordDetail<ordersLength; ordDetail++){

														qtyRemaining = parseFloat(qtyRemaining) + parseFloat(orderDetails[ordDetail].lineitemremainingquantity);
													}

													pickqtyValidate.qtyRemaining  = qtyRemaining;

													if(!utility.isValueValid(skipBtnCount) ||
															(utility.isValueValid(skipBtnCount) && (parseInt(skipBtnCount)+1) > ordersLength)) {
														skipBtnCount = 0;
													}

													var ordObj = orderDetails[skipBtnCount];
													pickqtyValidate.newOrderScanRequired = 'true';
													log.debug({title:'ordObj',details:ordObj});
													if(transactiontype == 'SalesOrd'){

														pickqtyValidate.customer = ordObj.customerText;
													}
													fillObjectWithNextOrderDetails (ordObj,pickqtyValidate,unitType,isTallyScanRequired);
													pickqtyValidate.isValid  = true;
													if(isTallyScanRequired) {
														if(utility.isValueValid(unitType)) {
															pickqtyValidate.barcodeQuantity = [{'value': 1, 'unit': (pickqtyValidate.qtyUOMObj).unitId}];
														}
														else {
															pickqtyValidate.barcodeQuantity = [{'value': 1}];	
														}
														pickqtyValidate.uomTobePopulated = pickqtyValidate.barcodeQuantity;
														pickqtyValidate.tallyScanBarCodeQty = 0 ;

													}
													if(parseInt(skipBtnCount)+1 >= ordersLength) {
														pickqtyValidate.showskipbtn = 'F';
													}
													else {
														pickqtyValidate.showskipbtn = 'T';
													}
												}
												else{
													pickqtyValidate.isSamePageNavigationRequired = 'F';
													pickqtyValidate.qtyRemaining = 0;
													var currentUser = runtime.getCurrentUser().id;
													var pickTasks = obUtility.getmultiorderPickTaskDetailsForValidation(warehouseLocationId, waveId, currentUser);
													log.error('pickTasks',pickTasks);
													pickqtyValidate.isPendingPickTaks = pickTasks.length > 0 ? 'Y' : 'N';
													if(locUseBinsFlag === true){
														pickqtyValidate.showStageButton = obUtility.getShowStageFlag(waveId,warehouseLocationId);
													}
													pickqtyValidate.isValid = true;
												}
											}
										}
									}
								}
							}
					}
					else {
						pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
						pickqtyValidate.isValid = false;
					}
				}
			}
			else {
				pickqtyValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDQTY");
				pickqtyValidate.isValid = false;
			}
		}
		catch(e) {

			pickqtyValidate.isValid = false;
			pickqtyValidate.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		log.error({title:'pickqtyValidate final',details:pickqtyValidate});
		return pickqtyValidate;
	}
	function updateBulkPickTaskAsync(pickTaskInternalId,enteredQty,fromBinId,lot,pickStatusIId,itemType,locUseBinsFlag,pickActionArray) {
		var mapReducetask =  task.create({taskType:task.TaskType.MAP_REDUCE});
		mapReducetask.scriptId = 'customscript_wms_mr_bulkpicktask_update';
		mapReducetask.params = {
				"custscript_wms_picktaskid" :  pickTaskInternalId,
				"custscript_wms_pickitemqty" : enteredQty,
				"custscript_wms_frombinid" : fromBinId,
				"custscript_wms_batchno" : lot,
				"custscript_wms_fromstatusid" : pickStatusIId,
				"custscript_wms_item_type" : itemType,
				"custscript_wms_locusebinsflag" : locUseBinsFlag,
				"custscript_wms_pickActionIdArray" : pickActionArray
		};
		log.debug('mapReducetask',mapReducetask);
		return mapReducetask.submit();
	}

	function fillObjectWithNextOrderDetails (ordObj,pickqtyValidate,unitType,isTallyScanRequired) {

		pickqtyValidate.transactionName = ordObj.tranid;
		pickqtyValidate.lineItememainingQuantity = ordObj.lineitemremainingquantity;
		pickqtyValidate.remainingQuantity = ordObj.lineitemremainingquantity;
		pickqtyValidate.lineItemPickedQuantity = ordObj.lineitempickedquantity;	
		pickqtyValidate.transactionInternalId = ordObj.internalid;	
		pickqtyValidate.line = ordObj.line;
		var transactionUom = ordObj.unitsText;
		if(utility.isValueValid(unitType) && utility.isValueValid(transactionUom))	{
			var transactionUomResult = utility.getUnitsType(unitType,transactionUom);
			if(transactionUomResult.length > 0)	{
				pickqtyValidate.transactionUomConversionRate = transactionUomResult[0].conversionrate;
			}
		}
		else {
			transactionUom = '';
		}
		pickqtyValidate.transactionUomName = transactionUom;
		var	remainingQtyWithUom = ordObj.lineitemremainingquantity + " " + transactionUom;
		pickqtyValidate.lblRemainingQuantity = remainingQtyWithUom;
		if(isTallyScanRequired && (pickqtyValidate.itemType == "serializedinventoryitem" || pickqtyValidate.itemType=="serializedassemblyitem")){
			tallyScanUtility.fillObjectForSerialTallyScan(ordObj,pickqtyValidate);
		}

	}

	return {
		'post': doPost

	};

});
