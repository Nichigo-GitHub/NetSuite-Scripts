/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./big','./wms_translator','N/record','./wms_outBoundUtility',
        'N/wms/recommendedBins','N/query','./wms_tallyScan_utility'],

        function(utility,bigJS,translator,record,obUtility,binApi,query,tallyScanUtil) {

    var pickingType = '';
	function doPost(requestBody) {

		var picktaskValidate = {};
		var requestParams = '';
		var recommendedBinNum = '';
		var recommendedBinId = '';
		var picktaskId ='';
		var transactionUomConversionRate = '';
		var vItemQtyUnits = '';
		var iteminternalid='';
		var stockUomConversionRate = '';
		var stockunitText = '';
		var uomDefaultStatus = '';
		var actionType = '';
		var warehouseLocationId = '';
		var pickTaskName = '';
		var waveName='';
		var binQuantity = '';
		var locUseBinsFlag ='';
		var binResults='';
		var processNameFromState = '';
		var transactionUomId ='';
		var transactionUomName = '';
		var stockUomId = '';
		var uomResult = [];
		var baseUnitId ='';
		var baseUnitName ='';
		var baseUnitConvRate='';
		var remainingQty = '';
		var transactionType='';
		var binStatus ='';
		var bulkremainingQty = '';
		var kitId = ''; // For info screen kit image
		var kitName = '';
		try
		{
			requestParams = requestBody.params;
			log.debug({title:'requestParams',details:requestParams});
			if (utility.isValueValid(requestParams))
			{
				actionType = requestParams.actionType;
				pickTaskName = requestParams.pickTaskName;
				transactionUomConversionRate = requestParams.transactionUomConversionRate;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				warehouseLocationId = requestParams.warehouseLocationId;
				pickingType = requestParams.pickingType;
				processNameFromState = requestParams.processNameFromState;
				transactionType = requestParams.transactionType;
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var fromTable = requestParams.fromTable;
				var ordersCount = requestParams.ordersCount;
				var waveName = requestParams.waveName;
				kitId = requestParams.kitId; // For info screen kit image
				kitName = requestParams.kitName;

				if(utility.isValueValid(pickTaskName) && !isNaN(pickTaskName))
				{
					if(!utility.isValueValid(isZonePickingEnabled)){
						isZonePickingEnabled = false;
					}
					if(!utility.isValueValid(selectedZones)){
						selectedZones = [];
					}

					var pickTaskIdNum = parseInt(pickTaskName);

					var pickTaskArr = [];
					pickTaskArr.push(pickTaskIdNum);

					if(!utility.isValueValid(locUseBinsFlag))
					{
						var columnsArr = [];
						columnsArr.push('usesbins');
						var locResults = utility.getLocationFieldsByLookup(warehouseLocationId,columnsArr);
						if(locResults){
							locUseBinsFlag =  locResults.usesbins;
						}

					}
					else
					{
						locUseBinsFlag=true;

					}
					if(locUseBinsFlag == true)
						binResults = binApi.recommendPickPathForPickTasks(pickTaskArr);

					if(actionType == 'btnAction')
					{
						warehouseLocationId = requestParams.warehouseLocationId;

						//	picktaskId = pickTaskName;

						var objpickTaskDetails=[];
						var pickTaskDetails = {};

						pickTaskDetails.waveName = waveName;
						pickTaskDetails.whLocationId = warehouseLocationId;
						pickTaskDetails.pickTaskName = pickTaskName;

						objpickTaskDetails=this.getwavePickTaskDetailsUsingNQuery(pickTaskDetails);
						if(objpickTaskDetails.length > 0)
						{
							if(!(utility.isValueValid(kitId) && utility.isValueValid(kitName)) && utility.isValueValid(objpickTaskDetails[0].subitemof) && utility.isValueValid(objpickTaskDetails[0].fullname)) { // For info screen kit image
								var kitId = objpickTaskDetails[0].subitemof;
								var kitName = objpickTaskDetails[0].fullname;
							}

							if(locUseBinsFlag == true)
							{
								if (binResults !== null && binResults !== undefined && binResults !== 'null') {

									binStatus = binResults.bins[0].status.code;
									var pickTaskRecomendedBinZoneId = '';
									if(binStatus == 'SUCCESS'){
										var binData = binResults.bins[0].data;
										recommendedBinNum = binData.bin.name;
										recommendedBinId = binData.bin.id;
										pickTaskRecomendedBinZoneId = binData.zone.id;
										picktaskValidate.recommendedBinZoneName = binData.zone.name;
										picktaskValidate.recommendedBinZoneId = pickTaskRecomendedBinZoneId;
										if(!utility.isValueValid(pickTaskRecomendedBinZoneId) || pickTaskRecomendedBinZoneId == -1){
											pickTaskRecomendedBinZoneId = '0';
										}
									}
									else{
										recommendedBinNum = '';
										recommendedBinId = '';
									}
									var isValidPicker = false;
									if(isZonePickingEnabled == true){
										if(selectedZones.indexOf(pickTaskRecomendedBinZoneId) == -1){
											var vPicktask = record.load({
												type : 'picktask',
												id   : objpickTaskDetails[0].pickTaskId
											});

											var pickTaskPicker = vPicktask.getValue({fieldId:'picker'});
											if(utility.isValueValid(pickTaskPicker)){
												isValidPicker = obUtility.validatePicker(pickTaskPicker);
											}
										}
										else{
											isValidPicker = true;
										}
									}
									if((isZonePickingEnabled ==  true && (selectedZones.indexOf(pickTaskRecomendedBinZoneId) != -1 || isValidPicker == true) ) ||
											isZonePickingEnabled != true){
										picktaskId = objpickTaskDetails[0].pickTaskId;
										iteminternalid = objpickTaskDetails[0].item;
										stockunitText = objpickTaskDetails[0].stockunitText;

										picktaskValidate.recommendedbin = recommendedBinNum;
										picktaskValidate.remainingQty =objpickTaskDetails[0].totalremainingquantity;
										picktaskValidate.info_remainingQty =objpickTaskDetails[0].totalremainingquantity;
										picktaskValidate.units =objpickTaskDetails[0].units;
										picktaskValidate.unitsText =objpickTaskDetails[0].unitsText;
										picktaskValidate.stockunit =objpickTaskDetails[0].stockunit;
										picktaskValidate.itemInternalId =iteminternalid;
										picktaskValidate.pickTaskId =picktaskId;
										picktaskValidate.stockunitText =stockunitText;
										picktaskValidate.quantity =objpickTaskDetails[0].totalQuantity;
										picktaskValidate.pickedQty =objpickTaskDetails[0].pickedQuantity;
										picktaskValidate.transactiontype =objpickTaskDetails[0].transactiontype;
										picktaskValidate.bulkPickQty = objpickTaskDetails[0].totalremainingquantity;

										if (objpickTaskDetails[0].unitsText != null && objpickTaskDetails[0].unitsText != '' && objpickTaskDetails[0].totalremainingquantity > 0) {
											bulkremainingQty = objpickTaskDetails[0].totalremainingquantity + " " + objpickTaskDetails[0].unitsText;
											picktaskValidate.bulkPickQtyUOM = bulkremainingQty;
										}
									}
									else {
										picktaskValidate.errorMessage = translator.getTranslationString('wms_ZonePicking.INVALID_PICKTASK_SCANNED');
										picktaskValidate.isValid = false;
									}
								}
								else
								{
									picktaskValidate.errorMessage =translator.getTranslationString('MULTIORDER_PICKTASKLIST.INVALIDPICKTASK');
									picktaskValidate.isValid = false;
								}
							}
							else
							{
								picktaskId = objpickTaskDetails[0].pickTaskId;
								iteminternalid = objpickTaskDetails[0].item;
								stockunitText = objpickTaskDetails[0].stockunitText;

								picktaskValidate.recommendedbin = recommendedBinNum;
								picktaskValidate.remainingQty =objpickTaskDetails[0].totalremainingquantity;
								picktaskValidate.info_remainingQty = objpickTaskDetails[0].totalremainingquantity;
								picktaskValidate.units = objpickTaskDetails[0].units;
								picktaskValidate.unitsText = objpickTaskDetails[0].unitsText;
								picktaskValidate.stockunit = objpickTaskDetails[0].stockunit;
								picktaskValidate.itemInternalId = iteminternalid;
								picktaskValidate.pickTaskId = picktaskId;
								picktaskValidate.stockunitText = stockunitText;
								picktaskValidate.quantity = objpickTaskDetails[0].totalQuantity;
								picktaskValidate.pickedQty = objpickTaskDetails[0].pickedQuantity;
								picktaskValidate.transactiontype = objpickTaskDetails[0].transactiontype;
								picktaskValidate.bulkPickQty = objpickTaskDetails[0].totalremainingquantity;

								if (objpickTaskDetails[0].unitsText != null && objpickTaskDetails[0].unitsText != '' &&
										objpickTaskDetails[0].totalremainingquantity > 0) {
									bulkremainingQty = objpickTaskDetails[0].totalremainingquantity + " " + objpickTaskDetails[0].unitsText;
									picktaskValidate.bulkPickQtyUOM = bulkremainingQty;
								}

							}
						}
					}
					else
					{
						var pickedQty = requestParams.pickedQty;
						remainingQty = requestParams.remainingQty;
						var unitsText = requestParams.unitsText;
						recommendedBinNum = requestParams.recommendedBinNum;
						recommendedBinId = requestParams.recommendedBinId;
						picktaskId = requestParams.pickTaskId;
						iteminternalid = requestParams.itemId;
						stockunitText = requestParams.stockunitText;
						picktaskValidate.bulkPickQty = remainingQty;
						if(unitsText!=null && unitsText!='' && pickedQty>0)
							pickedQty=pickedQty + " "+unitsText;

						if(unitsText!=null && unitsText!='' && remainingQty>0)
							remainingQty=remainingQty + " "+unitsText;

						picktaskValidate.pickedQty = pickedQty;
						picktaskValidate.remainingQty = remainingQty;
						picktaskValidate.bulkPickQtyUOM = remainingQty;
						picktaskValidate.info_remainingQty = remainingQty;
						picktaskValidate.pickTaskId =picktaskId;
						picktaskValidate.transactiontype = transactionType;
					}
					log.debug({title:'picktaskId',details:picktaskId});
					if(picktaskValidate.isValid != false){
						if(utility.isValueValid(picktaskId))
						{
							var itemDetails = {};
							itemDetails = tallyScanUtil.getItemDetails(iteminternalid,itemDetails) ;
							var itemType = itemDetails.itemType;
							//log.debug({title:'itemType',details:itemType});
							if(itemType == "serviceitem"){
								itemType = "noninventoryitem";
								}
							var unitType = itemDetails.unitType;
							stockunitText = itemDetails.stockUnitText;
							var itemId = itemDetails.itemText;
							var itemImageURL = itemDetails.imageUrl;
							if(!utility.isValueValid(recommendedBinNum) && locUseBinsFlag == true &&( itemType != 'noninventoryitem')) {
								picktaskValidate.errorMessage = translator.getTranslationString('SINGLEANDMULTIORDERPICKING_INACTIVEBINORNOINVENTORYAVAILABLE');
								picktaskValidate.isValid = false;
							}else if (locUseBinsFlag == true && itemDetails.itemUseBinsFlag == false
									&& 	(itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"
										|| itemType == "inventoryitem" || itemType == "assemblyitem"
											|| itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")) {
								picktaskValidate.errorMessage = translator.getTranslationString('PO_ITEMVALIDATE.USEBINS_FALSE');
								picktaskValidate.isValid = false;
							}
							else{
								var vPicktask = record.load({
									type : 'picktask',
									id   : picktaskId
								});
								var pickTaskPicker = vPicktask.getValue({fieldId:'picker'});
								vItemQtyUnits = vPicktask.getValue({fieldId:'units'});
								var isValidPicker = obUtility.validatePicker(pickTaskPicker);
								var inventoryDetailLotOrSerial = vPicktask.getText({fieldId:'inventorynumber'});
								if(!isValidPicker){
									picktaskValidate.errorMessage = translator.getTranslationString('SINGLEORDERPICKING_PICKTASK.ALREADYINTIATED');
									picktaskValidate.isValid = false;
									return picktaskValidate;
								}
								if(pickingType == 'BULK' && !(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem"))
								{
									var asynchrousScriptProcessFlag= utility.getAsynScriptDetailsFromScheduleScriptRecord('Bulkpicking PickTask Update Mapreduce',pickTaskPicker,picktaskId);
									if(asynchrousScriptProcessFlag)
									{
										picktaskValidate.errorMessage = translator.getTranslationString('BULKPICKING.ASYN_PROCESS_RESTRICTION');
										picktaskValidate.isValid = false;
										return picktaskValidate;
									}
								}
								var waveId = vPicktask.getValue({fieldId:'wave'});
								var pickActionLinelength = vPicktask.getLineCount({
									sublistId:'pickactions'
								});
								log.debug({title:'pickActionLinelength',details:pickActionLinelength});
								var pickTaskRemQty = 0;
								picktaskValidate.binEmptySystemRuleValue =false;
								for (var pickActionItr = 0; pickActionItr < pickActionLinelength; pickActionItr++) {

									var pickTaskLine = vPicktask.getSublistValue({
										sublistId: 'pickactions',
										fieldId: 'linenumber',
										line : pickActionItr
									});

									log.debug({title:'pickTaskLine',details:pickTaskLine});

									var remQty = vPicktask.getSublistValue({
										sublistId: 'pickactions',
										fieldId: 'remainingquantity',
										line : pickActionItr
									});

									var pickTaskstatus = vPicktask.getSublistValue({
										sublistId: 'pickactions',
										fieldId: 'status',
										line : pickActionItr
									});

									log.debug({title:'pickTaskstatus',details:pickTaskstatus});
									if(pickTaskstatus == 'FAILED' && pickActionLinelength == 1)
									{
										log.debug({title:'FAILED',details:'FAILED'});
										picktaskValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_PICKTASK.PICKED");
										picktaskValidate.isValid = false;
										return picktaskValidate;
									}
									if(pickTaskstatus != 'DONE' &&  pickTaskstatus != 'CANCELLED' && pickTaskstatus != 'FAILED')
									{
										pickTaskRemQty = pickTaskRemQty + remQty;
									}
								}
								if(utility.isValueValid(pickTaskRemQty) > 0)
								{
									if(locUseBinsFlag == true)
									{
										binStatus = binResults.bins[0].status.code;
										if(binStatus == 'SUCCESS'){


											var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
											binQuantity = 0;
											if(inventoryStatusFeature){
												var inventoryStatusOptions = utility.getInventoryStatusOptions();
												if(inventoryStatusOptions.length > 0){
													var binQtyArr = binResults.bins[0].data.quantities;
													for(var qtyIndex=0; qtyIndex<binQtyArr.length; qtyIndex++){
														var recomendedBinStatusName = binQtyArr[qtyIndex].status.name;
														for(var invtStatus in  inventoryStatusOptions){

															var inventoryStatusRow = inventoryStatusOptions[invtStatus];
															var statusText =inventoryStatusRow.name;
															if(recomendedBinStatusName == statusText){
																var makeInventoryAvailable =inventoryStatusRow.listInventoryavailable;
																if(makeInventoryAvailable){
																	var tempBinStatusQty = binQtyArr[qtyIndex].quantity;
																	binQuantity =  Number(bigJS(binQuantity).plus(tempBinStatusQty));
																}
															}
														}
													}
												}
											}
											else{

												binQuantity =  binResults.bins[0].data.quantities[0].quantity;
											}
											if(itemType=="noninventoryitem")
											{
												picktaskValidate.recommendedBinQty = remainingQty;
											}
											else
											{
												picktaskValidate.recommendedBinQty = binQuantity;
											}
											if(isZonePickingEnabled == true){
												picktaskValidate.recommendedBinZoneName = binResults.bins[0].data.zone.name;
												picktaskValidate.recommendedBinZoneId = binResults.bins[0].data.zone.id;
											}
										}
                                        var systemRule = "Enable bin reporting and blocking";
										var binEmptySystemRuleValue = utility.getSystemRuleValue(systemRule,warehouseLocationId);
                                        log.debug("binEmptySystemRuleValue",binEmptySystemRuleValue);
										var systemRuleValue = false;
                                        if(utility.isValueValid(binEmptySystemRuleValue) && binEmptySystemRuleValue == "Y") {
                                                systemRuleValue = true;
                                        }
										picktaskValidate.binEmptySystemRuleValue =systemRuleValue;

									}
									if(utility.isValueValid(unitType))
									{
										uomResult = tallyScanUtil.getUOMDetails(unitType);
										for(var itr in uomResult){
											if(uomResult[itr]['uom.internalid'] == vItemQtyUnits){
												transactionUomConversionRate = uomResult[itr]['uom.conversionrate'];
												transactionUomId = uomResult[itr]['uom.internalid'];
												transactionUomName = uomResult[itr]['uom.unitname'];
												uomDefaultStatus = transactionUomName;
											}else if(uomResult[itr]['uom.unitname'] == stockunitText){
												stockUomConversionRate = uomResult[itr]['uom.conversionrate'];
												stockUomId = uomResult[itr]['uom.internalid'];
											}
											if(uomResult[itr]['uom.baseunit']){
												baseUnitId = uomResult[itr]['uom.internalid'];
												baseUnitName = uomResult[itr]['uom.unitname'];
												baseUnitConvRate = uomResult[itr]['uom.conversionrate'];
											}
										}
										if(!(utility.isValueValid(stockUomId)) && stockunitText == transactionUomName){
											stockUomConversionRate = transactionUomConversionRate;
											stockUomId = transactionUomId;
										}
									}
									log.debug({title:'uomResult :', details:uomResult});

									if(!(utility.isValueValid(pickTaskPicker))){
										obUtility.updateAssignedPicker(vPicktask);
										vPicktask.save();
									}
									itemDetails.pickQuantity = pickTaskRemQty;
									itemDetails.transactionuomId = transactionUomId;
									itemDetails.baseUnitId = baseUnitId;
									itemDetails.baseUnitName = baseUnitName;
									itemDetails.baseUnitConvRate = baseUnitConvRate;
									itemDetails.transactionUomConversionRate = transactionUomConversionRate;
									itemDetails = tallyScanUtil.getTallyScanRuleData(warehouseLocationId,processNameFromState,itemDetails);
									if(pickingType == 'BULK' && !(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
										itemDetails.isTallyScanRequired = false;
									}

									if(itemDetails.isTallyScanRequired){
										picktaskValidate.tallyScanBarCodeQty = itemDetails.tallyScanBarCodeQty;
										picktaskValidate.barcodeQuantity = itemDetails.barcodeQuantity;
										picktaskValidate.uomTobePopulated = itemDetails.barcodeQuantity;
										itemDetails = tallyScanUtil.getCartonPickingRequiredData('Use cartons for multi-order picking?',
												warehouseLocationId, itemType, itemDetails);
										picktaskValidate.isContainerScanRequiredNonInv = itemDetails.isContainerScanRequiredNonInv;
										picktaskValidate.transactionUomId = transactionUomId;
										picktaskValidate.transactionUomName = transactionUomName;
										picktaskValidate.unitType = unitType;
										picktaskValidate.itemImageURL = itemImageURL;
										var orderDetails = obUtility.getMultiOrderPickTaskOrderDetails(warehouseLocationId,waveId,picktaskId,null,picktaskValidate.transactiontype);
										if(orderDetails.length >0){
											var lineitemremainingquantity = orderDetails[0].lineitemremainingquantity;
											picktaskValidate.transactionName = orderDetails[0].tranid;
											picktaskValidate.lineItememainingQuantity = lineitemremainingquantity;
											picktaskValidate.lineItemPickedQuantity = orderDetails[0].lineitempickedquantity;
											picktaskValidate.transactionInternalId = orderDetails[0].internalid;
											picktaskValidate.customer = orderDetails[0].customerText;
											picktaskValidate.line = orderDetails[0].line;
											picktaskValidate.pickQuantity = pickTaskRemQty;
											if(itemDetails.itemType == "serializedinventoryitem" || itemDetails.itemType=="serializedassemblyitem"){
												itemDetails = tallyScanUtil.getQtyInBaseUnits(itemDetails,lineitemremainingquantity);
												picktaskValidate.remainingQty = itemDetails.lineitemremainingquantity + " " + baseUnitName;
												picktaskValidate.lblRemainingQuantity = itemDetails.lineitemremainingquantity + " " + baseUnitName;
												picktaskValidate.numberOfTimesSerialScanned = 0;
												picktaskValidate.scannedQuantityInBaseUnits = itemDetails.lineitemremainingquantity;
												picktaskValidate.uomSelectionforFirstItr = itemDetails.baseUnitId;//For Serial Item.. It should be base units
											}else{
												picktaskValidate.remainingQty = lineitemremainingquantity + " " + transactionUomName;
												picktaskValidate.lblRemainingQuantity = lineitemremainingquantity + " " + transactionUomName;
											}
											if(orderDetails.length == 1)
											{
												picktaskValidate.showskipbtn = 'F';
											}
											else
											{
												picktaskValidate.showskipbtn  = 'T';
											}
										}

										if(utility.isValueValid(picktaskValidate.transactiontype))
										{
											if(picktaskValidate.transactiontype =='SalesOrd')
											{
												picktaskValidate.tranType=translator.getTranslationString('MULTIORDER_ORDERTYPE_SALESORDER');
											}
											else
											{
												picktaskValidate.tranType=translator.getTranslationString('MULTIORDER_ORDERTYPE_TRANSFERORDER');
											}
										}
									}
									picktaskValidate.inventoryDetailLotOrSerial= inventoryDetailLotOrSerial;
									picktaskValidate.isTallyScanRequired=itemDetails.isTallyScanRequired;
									picktaskValidate.salesdescription = itemDetails.salesDesc;
									picktaskValidate.transactionUomConversionRate = transactionUomConversionRate;
									picktaskValidate.stockUomConversionRate = stockUomConversionRate;
								var quantityInStock;
								if(utility.isValueValid(stockUomConversionRate) && utility.isValueValid(transactionUomConversionRate)){
								quantityInStock = utility.uomConversions(pickTaskRemQty,stockUomConversionRate,transactionUomConversionRate);
								picktaskValidate.quantityInStock = quantityInStock;
								picktaskValidate.stockunitText = stockunitText;
								picktaskValidate.quantityInStockwithUOM = quantityInStock +  ' ' + stockunitText;
								}
									picktaskValidate.uomDefaultStatus = uomDefaultStatus;
									picktaskValidate.itemText=itemId;
									picktaskValidate.itemName=itemId;
									picktaskValidate.recommendedbin=recommendedBinNum;
									picktaskValidate.recommendedBinId=recommendedBinId;
									picktaskValidate.waveId = waveId;
									picktaskValidate.itemType = itemType;
									picktaskValidate.unitsText=transactionUomName;
									picktaskValidate.itemInternalId=iteminternalid;
									if((itemType == "inventoryitem" || itemType=="assemblyitem") ||
											(!itemDetails.isTallyScanRequired && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" )) ){
										picktaskValidate.showAvailableQtyTable= true;
									}

									if(pickingType == 'BULK' && !(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem")){
										picktaskValidate.showExpectedQuantity='Y';
									}
									if(pickingType == 'BULK' && (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
										picktaskValidate.pickingType ='MULTI';
									}

									if (utility.isValueValid(kitName) && utility.isValueValid(kitId)) { // For info screen kit image
										picktaskValidate.info_lineitemsubitemof = kitName;
										var subItemId = kitId;
										var columnArray = [];
										var itemLookUp = utility.getItemFieldsByLookup(subItemId, columnArray);
										if (itemLookUp.thumbnailurl != undefined) {
											picktaskValidate.info_imageURL_lineitemsubitemof = itemLookUp.thumbnailurl;
										}

									}
									picktaskValidate.isValid= true;
								}
								else
								{
									picktaskValidate.errorMessage = translator.getTranslationString("SINGLEORDERPICKING_PICKTASK.PICKED");
									picktaskValidate.isValid=false;
								}
							}
						}
						else
						{
							picktaskValidate.errorMessage =translator.getTranslationString('MULTIORDER_PICKTASKLIST.INVALIDPICKTASK');
							picktaskValidate.isValid = false;
						}
					}
				}
				else
				{
					if(fromTable == 'showFullyPicked'){
						picktaskValidate.ordersCount = ordersCount;
						picktaskValidate.isValid = true;
					}
					else{
						picktaskValidate.errorMessage =translator.getTranslationString('MULTIORDER_PICKTASKLIST.INVALIDPICKTASK');
						picktaskValidate.isValid = false;
					}
				}
			}
			else{
				picktaskValidate.errorMessage =translator.getTranslationString('MULTIORDER_PICKTASKLIST.INVALIDPICKTASK');
				picktaskValidate.isValid= false;
			}
		}
		catch(e)
		{
			picktaskValidate.isValid = false;
			picktaskValidate.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
		log.debug('picktaskValidate',picktaskValidate);
		return picktaskValidate;

	}
	function getwavePickTaskDetailsUsingNQuery(pickTaskDetails)
	{

		var strLocation = pickTaskDetails.whLocationId;
		var pickTaskName = pickTaskDetails.pickTaskName;
		var waveName = pickTaskDetails.waveName;

		// NQery Start
		var myTransactionQuery = query.create({
			type: query.Type.PICK_TASK
		});
		var itemFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'item^item'
		});
		var pickActionsFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'pickactions'
		});
		var waveFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'wave^transaction'
		});
		var transactionFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'pickactions.ordernumber^transaction'
		});
		var pickTaskUomFieldsJoin = myTransactionQuery.autoJoin({
			fieldId: 'units'
		});
        var subItemFieldsJoin = pickActionsFieldsJoin.autoJoin({ // For info screen kit image
            fieldId: 'subitemof^item'
        });


		myTransactionQuery.columns = [

		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'description',
		                            	  groupBy: true
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'item',
		                            	  groupBy: true
		                              }),
		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'upccode',
		                            	  groupBy: true
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'units',
		                            	  groupBy: true
		                              }),
		                              waveFieldsJoin.createColumn({
		                            	  fieldId: 'wavetype',
		                            	  groupBy: true
		                              }),
		                              itemFieldsJoin.createColumn({
		                            	  fieldId: 'stockunit',
		                            	  groupBy: true
		                              }),
		                              pickActionsFieldsJoin.createColumn({
		                            	  fieldId: 'remainingquantity',
		                            	  aggregate: query.Aggregate.SUM
		                              }),
		                              myTransactionQuery.createColumn({
		                            	  fieldId: 'name',
		                            	  groupBy: true
		                              }),
		                              transactionFieldsJoin.createColumn({
		                            	  fieldId: 'number',
		                            	  aggregate: query.Aggregate.COUNT
		                              }),

		                              pickActionsFieldsJoin.createColumn({
		                            	  fieldId: 'pickedquantity',
		                            	  aggregate: query.Aggregate.SUM
		                              }),
		                              pickTaskUomFieldsJoin.createColumn({
		                            	  fieldId: 'pluralname' ,
		                            	  groupBy: true
		                              })
		                              ];

        if(utility.isValueValid(pickingType) && pickingType == 'MULTI') {
            myTransactionQuery.columns.push(pickActionsFieldsJoin.createColumn({//For info screen kit image
                fieldId: 'subitemof' ,
                groupBy: true
            }));
            myTransactionQuery.columns.push(subItemFieldsJoin.createColumn({//For info screen kit image
                fieldId: 'fullname',
                groupBy: true
            }));
        }

		/*

		the available options are:
			Wave:A (Wave : Pending Release)
			Wave:B (Wave : Released)
			Wave:C (Wave : In Progress)
			Wave:D (Wave : Complete)

		 */

		var waveStatusCond = myTransactionQuery.createCondition({
			fieldId: 'wave^transaction.status',
			operator: query.Operator.ANY_OF,
			values:  ['Wave:B','Wave:C']
		});
		var pickActionStatusCond = myTransactionQuery.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['READY','INPROGRESS']
		});
		var lineItemStatusCond = pickActionsFieldsJoin.createCondition({
			fieldId: 'remainingquantity',
			operator: query.Operator.GREATER,
			values:0
		});
		var locCond = myTransactionQuery.createCondition({
			fieldId: 'location',
			operator: query.Operator.ANY_OF,
			values: strLocation
		});
		var pickTaskCond = myTransactionQuery.createCondition({
			fieldId: 'name',
			operator: query.Operator.ANY_OF,
			values: pickTaskName
		});
        var  pickTaskQuery_pickingType = myTransactionQuery.createCondition({
            fieldId: 'wave^transaction.picktype',
            operator: query.Operator.ANY_OF_NOT,
            values: 'Single'
        });
		myTransactionQuery.condition = myTransactionQuery.and(
				waveStatusCond,pickActionStatusCond,lineItemStatusCond,pickTaskCond,locCond,pickTaskQuery_pickingType);
		if(utility.isValueValid(waveName)) {

				var waveNameCond = myTransactionQuery.createCondition({
					fieldId: 'wave^transaction.tranid',
					operator: query.Operator.IS,
					values: waveName
				});
				myTransactionQuery.condition = myTransactionQuery.and(
					waveStatusCond, pickActionStatusCond, lineItemStatusCond, pickTaskCond, locCond, pickTaskQuery_pickingType, waveNameCond);

		}

		var pickTaskListDetailsArr=[];

		// Run the query as a paged query with 10 results per page
		var results = myTransactionQuery.runPaged({
			pageSize: 10
		});

		log.debug(results.pageRanges.length);
		log.debug(results.count);


		results.pageRanges.forEach(function (pageRange) {
			var myPage = results.fetch({
				index: pageRange.index
			});
			var resultSetObj =  myPage.data;
			if(resultSetObj!=null && resultSetObj!='')
			{
				var resultsObj = resultSetObj.results;
				var columnsObj = resultSetObj.columns;
				for (var row in resultsObj)
				{
					var resultObj = resultsObj[row];
					convertToJsonObj(resultObj,pickTaskListDetailsArr,columnsObj);
				}
			}
		});

		return pickTaskListDetailsArr;
	}

	function convertToJsonObj(result,pickTaskListDetailsArr,columnsObj)
	{

		var columns = columnsObj;
		var  values = result.values;

		var pickTaskListObj = {};
		for(var col in columns)
		{

			var colName = columns[col].fieldId;
			if(colName == 'name')
			{
				colName ='pickTaskId';
			}
			if(colName == 'pickedquantity')
			{
				colName ='pickedQuantity';
			}
			if(colName == 'remainingquantity')
			{
				colName ='totalremainingquantity';
			}
			if(colName == 'units')
			{
				colName ='pluralname';
			}
			if(colName == 'wavetype')
			{
				colName ='transactiontype';
			}
			if(colName == 'pluralname')
			{
				colName ='unitsText';
			}
			pickTaskListObj[colName ] = values[col];

		}
		pickTaskListDetailsArr.push(pickTaskListObj);
	}

	return {
		'post': doPost,
		getwavePickTaskDetailsUsingNQuery:getwavePickTaskDetailsUsingNQuery
	};

});
