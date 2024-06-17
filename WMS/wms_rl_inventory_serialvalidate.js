/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility','./wms_translator','N/record','./wms_inventory_utility','./wms_inboundUtility','./big','N/runtime'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,record,invtUtility,inboundUtility,Big,runtime) {

	/**
	 * This function is to validate the scanned serial number in bin transfer process
	 *
	 */
	function doPost(requestBody) {

		var serailValidate = {};
		var warehouseLocationId ='';
		var serialName='';
		var fromBinInternalId='';
		var itemInternalId='';
		var fromStatusInternalId = '';
		var numberOfTimesSerialScanned ='';
		var debugString = '';
		var requestParams = '';
		var processType = '';
		var scannedQuantity ='';
		var itemType ='';
		var revisedStatusInternalId ='';
		var previousStatusInternalId ='';
		var unitType ='';
		var transactionUomConversionRate ='';
		var stockUnitName = '';
		var actualBeginTime='';
		var cartId = '';
		var preferBinId = '';
		var stockConversionRate = '';
		var stageBinId = '';
		var action = '';
		var toStatusInternalId = '';
		var recomendedBinId = '';
		var itemName = '';
		if (utility.isValueValid(requestBody)) {

			try
			{
				requestParams = requestBody.params;
				warehouseLocationId = requestParams.warehouseLocationId;
				serialName = requestParams.serialName;
				fromBinInternalId = requestParams.fromBinInternalId;
				itemInternalId=requestParams.itemInternalId;
				fromStatusInternalId =requestParams.fromStatusInternalId;
				toStatusInternalId = requestParams.toStatusInternalId;
				numberOfTimesSerialScanned =requestParams.numberOfTimesSerialScanned;
				processType = requestParams.processType;
				var serial_matchfound='F';
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				scannedQuantity = requestParams.scannedQuantity;
				itemType = requestParams.itemType;
				revisedStatusInternalId = requestParams.revisedStatusInternalId;
				previousStatusInternalId = requestParams.previousStatusInternalId;
				unitType = requestParams.unitType;
				transactionUomConversionRate = requestParams.transactionUomConversionRate;
				actualBeginTime = requestParams.actualBeginTime;
				stockUnitName = requestParams.stockUnitName;
				cartId = requestParams.cartId;
				preferBinId = requestParams.preferBinId;
				stockConversionRate = requestParams.stockConversionRate;
				stageBinId = requestParams.stageBinId;
				action = requestParams.action;
				recomendedBinId = requestParams.recomendedBinId;
				itemName = requestParams.itemName;
				if(utility.isValueValid(serialName) && utility.isValueValid(warehouseLocationId) && (utility.isValueValid(fromBinInternalId) || (locUseBinsFlag!='undefined' && locUseBinsFlag!=undefined && locUseBinsFlag == false)) && utility.isValueValid(itemInternalId))
				{

					serialName =serialName.trim();
					if(utility.isValueValid(serialName))
					{

						var objBinDetails = [];
						var getSerialNoId = utility.inventoryNumberInternalId(serialName,warehouseLocationId,itemInternalId);
						serailValidate.scannedQuantity = scannedQuantity;
						serailValidate.itemName = itemName;
                        if(!utility.isValueValid(getSerialNoId)){
							var itemResObj = utility.itemValidationForInventoryAndOutBound(serialName, warehouseLocationId);
							if (utility.isValueValid(itemResObj.barcodeIteminternalid)) {
								var barcodeSerialname = itemResObj.barcodeSerialname;
								var barcodeIteminternalid = itemResObj.barcodeIteminternalid;
								if (barcodeIteminternalid == itemInternalId) {
									getSerialNoId = utility.inventoryNumberInternalId(barcodeSerialname, warehouseLocationId, itemInternalId);
									serialName = barcodeSerialname;
								}
							}
						}
						log.debug({title:'getSerialNoId',details:getSerialNoId});
						if(utility.isValueValid(getSerialNoId))	{
							objBinDetails = getInventoryBalanceSearchResults(fromBinInternalId,itemInternalId,warehouseLocationId,getSerialNoId,fromStatusInternalId);
						}
						if(objBinDetails.length>0){
                            var availableQty = "";
                            var inventorynumber = "";
							for(var i  in objBinDetails){
                                if(objBinDetails[i]) {
                                     availableQty = objBinDetails[i].available;
                                     inventorynumber = objBinDetails[i].inventorynumberText;
                                    if (parseFloat(availableQty) > 0 && inventorynumber == serialName) {
                                        serial_matchfound = 'T';
                                        break;
                                    }
                                }

							}
							if(serial_matchfound == 'F')
							{
								serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
								serailValidate.isValid = false;
							}
						}
						else
						{
							if(processType == 'inventoryTransfer' || processType == 'inventoryStatusChange')
							{  if(locUseBinsFlag == false){
								serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.INVALIDSERIALNO');
							}else{
								serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.BIN_INVALIDSERIALNO');
							}

							}
							else
							{
								serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIALNO_NOTEXISTS');
							}
							serailValidate.isValid = false;
						}

						log.debug({title:'serailValidate[isValid]',details:serailValidate.isValid});
						if(serailValidate.isValid != false)
						{
							var serialSearch = search.load({
								id: 'customsearch_wmsse_wo_serialentry_srh',
							});
							var filters = serialSearch.filters;
							filters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_no',
								operator: search.Operator.IS,
								values: serialName
							}));
							filters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_status',
								operator: search.Operator.IS,
								values: false
							}));
							if(processType == 'inventoryStatusChange'){
								filters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_tasktype',
									operator: search.Operator.ANYOF,
									values: 18
								}));
							}else{
								filters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_tasktype',
									operator: search.Operator.ANYOF,
									values: 9
								}));
							}
							if(utility.isValueValid(fromBinInternalId))
							{
								filters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_bin',
									operator: search.Operator.ANYOF,
									values: fromBinInternalId
								}));
							}
							filters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_item',
								operator: search.Operator.ANYOF,
								values: itemInternalId
							}));

							serialSearch.filters = filters;
							var serialSearchResults =utility.getSearchResultInJSON(serialSearch);
							log.debug({title:'serialSearchResults',details:serialSearchResults});
							debugString = debugString + ",serialSearchResults :"+serialSearchResults;
							if (serialSearchResults.length > 0) {

								serailValidate.errorMessage = translator.getTranslationString("BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED");
								serailValidate.isValid = false;
							}
							else {

								log.debug({title:'serialSearchResults else',details:'else'});
								var customrecord = record.create({
									type: 'customrecord_wmsse_serialentry'
								});
                                var currentUserId = runtime.getCurrentUser().id;
								var name = serialName;
								if(utility.isValueValid(processType) && (processType == "inventoryTransfer" ||
                                    processType == "binTransfer" || processType == "putAway" ||
                                    processType == "cartPutaway" || processType == 'inventoryStatusChange')) {
									 name = processType + "^" + currentUserId + "^" + serialName;
								}
								customrecord.setValue({fieldId: 'name', value: name});
								if(utility.isValueValid(fromBinInternalId))
								{
									customrecord.setValue({fieldId: 'custrecord_wmsse_ser_bin', value: fromBinInternalId});
								}
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_item', value: itemInternalId});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_qty', value: 1});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_no', value: serialName});
								customrecord.setValue({fieldId: 'custrecord_wmsse_ser_status', value: false});
								if(utility.isValueValid(fromStatusInternalId))
								{
								customrecord.setValue({fieldId: 'custrecord_serial_inventorystatus', value: fromStatusInternalId});
								}
								if(processType == 'inventoryStatusChange'){
									customrecord.setValue({fieldId: 'custrecord_wmsse_ser_tasktype', value: 18});
								}else{
									customrecord.setValue({fieldId: 'custrecord_wmsse_ser_tasktype', value: 9});
								}
								var serialEntryRecordId = customrecord.save({
									enableSourcing: false,
									ignoreMandatoryFields: true
								});
								debugString = debugString + ",serialEntryRecordId :"+serialEntryRecordId;

								if(!utility.isValueValid(numberOfTimesSerialScanned)){
									numberOfTimesSerialScanned = 0;
								}
								if(processType == 'inventoryStatusChange' || processType == 'cartPutaway'){
									if(parseInt(numberOfTimesSerialScanned) + 1 < scannedQuantity){
										serailValidate.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned) + 1;
										serailValidate.serialName = serialName;
										serailValidate.isValid = true;
									}else{
										serailValidate.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned) + 1;
										if(processType == 'cartPutaway') {
											var bintransferObj = {};
											bintransferObj.itemType = itemType;
											bintransferObj.whLocation = warehouseLocationId;
											bintransferObj.itemId = itemInternalId;
											bintransferObj.quantity = scannedQuantity;
											bintransferObj.opentaskQty = scannedQuantity;
											if(utility.isValueValid(stockConversionRate)) {
												bintransferObj.opentaskQty = Number(Big(scannedQuantity).div(stockConversionRate));	
											}
											bintransferObj.fromBinId = fromBinInternalId;
											bintransferObj.toBinId = cartId;
											bintransferObj.units = stockUnitName;
											bintransferObj.stockConversionRate = stockConversionRate;
											bintransferObj.processType = 'cartPutaway';
											if(action == 'stageToCart' ) {
												bintransferObj.processType = 'cart';
												var	itemResults = inboundUtility.getItemDetails(itemInternalId,warehouseLocationId);
												var itemResultsLength = itemResults.length;
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
														if (isPreferedBin == true && (itemPreferedBinLocationId == warehouseLocationId)) {
															var preferedBinName = itemResults[count].binnumber;
															preferedBinInternalId = inboundUtility.getValidBinInternalId(preferedBinName, warehouseLocationId, null);
															break;
														}

													}
												}
												
												
												if(utility.isValueValid(preferedBinInternalId))
												{
													bintransferObj.recomendedBinId = preferedBinInternalId;	
												}
												else
												{
													
													objPutBinQueryDetails.itemInternalId = itemInternalId;						
													objPutBinQueryDetails.warehouseLocationId = warehouseLocationId;
													objPutBinQueryDetails.itemType = itemType;
													objPutBinQueryDetails.transcationUomInternalId = stockUnitName;
													objPutBinQueryDetails.fromBinInternalId = fromBinInternalId;
													objPutBinQueryDetails.fromStatusId = fromStatusInternalId;
													var abcVelocityResult = inboundUtility.getItemABCVelocityDetails(itemInternalId,warehouseLocationId);

													if(abcVelocityResult.length > 0)
													{
														for (var itemItr = 0; itemItr < abcVelocityResult.length; itemItr++) {
															var itemRec = abcVelocityResult[itemItr];
															if (itemRec.inventorylocation == warehouseLocationId) {
																objPutBinQueryDetails.locationinvtclassification = itemRec.locationinvtclassification;
																break;
															}
														}
													}

													var binDetails = inboundUtility.getRecomendedBinFromPutStratagie(objPutBinQueryDetails);
													if(binDetails != '{}')
													{
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

											if(utility.isValueValid(fromStatusInternalId))
											{
												bintransferObj.fromStatus = fromStatusInternalId;
												bintransferObj.toStatus = toStatusInternalId;
												if(action == 'stageToCart')
												{
													bintransferObj.toStatus = fromStatusInternalId;
												}
											}
											
											if(utility.isValueValid(bintransferObj))
											{
												var binTransferId = invtUtility.inventoryBinTransfer(bintransferObj);
												serailValidate.binTransferId = binTransferId.inventoryCountId;
												serailValidate.isValid = true;
												if(action == 'stageToCart')
												{
													serailValidate.itemsCountInCart = 1;
													var stageBinItemsCount = inboundUtility.getStageBinItemsCount(stageBinId,warehouseLocationId);
													serailValidate.stageBinItemsCount = stageBinItemsCount;
													if(stageBinItemsCount > 0) {
														serailValidate.scannedQuantity = '';
														serailValidate.scannedStatus = '';
														serailValidate.lotName = '';
														serailValidate.itemName = '';
														serailValidate.popupItemName = itemName;
														serailValidate.showCartPopUp = 'Y';
													}
													serailValidate.scannedQuantity = scannedQuantity;	
												}												
												else
												{
													var openTaskResults = inboundUtility.getOpenTaskID(itemInternalId,fromBinInternalId,warehouseLocationId,
															recomendedBinId);
													for(var openTask = 0; openTask < openTaskResults.length ; openTask ++){
														inboundUtility.updateNSrefno(openTaskResults[openTask].internalid,binTransferId,scannedQuantity);
													}
													var cartPutawayRecords = utility.getInventoryDetailsFromBins(stageBinId,warehouseLocationId);
													log.debug({title:'cartPutawayRecords',details:cartPutawayRecords});	
													if(cartPutawayRecords.length > 0 ){
														serailValidate.navigateToCartPutaway = 'Y';	
													}
													else {
														serailValidate.navigateToCartPutaway = 'N';
													}
												}
											}
										}
										else {
											var inputObj= {};
											inputObj.itemType = itemType; 
											inputObj.warehouseLocationId = warehouseLocationId;
											inputObj.itemInternalId = itemInternalId;
											inputObj.scannedQuantity = scannedQuantity;
											inputObj.binInternalId = fromBinInternalId;
											inputObj.revisedStatusInternalId = revisedStatusInternalId;
											inputObj.previousStatusInternalId = previousStatusInternalId;
											inputObj.openTaskQty = scannedQuantity;
											inputObj.unitType = stockUnitName;
											inputObj.transactionUomConversionRate = transactionUomConversionRate;
											inputObj.actualBeginTime = actualBeginTime;
											var inventoryStatusChangeId = invtUtility.postInventoryStatusChange(inputObj);
											if(utility.isValueValid(inventoryStatusChangeId)){
												serailValidate.isValid = true;
												serailValidate.inventoryStatusChangeId = inventoryStatusChangeId;
												if(utility.isValueValid(stockUnitName))
												{
													serailValidate.scannedQuantityWithUOM = scannedQuantity +" "+stockUnitName;
												}
												else{
													serailValidate.scannedQuantityWithUOM = scannedQuantity;
												}
											}else{
												serailValidate.isValid = false;
											}
										}
									}

								}else{
                                    serailValidate.numberOfTimesSerialScanned = parseInt(numberOfTimesSerialScanned) + 1;
									serailValidate.serialName = serialName;
									serailValidate.isValid = true;
								}
							}
						}

					}
					else
					{
						serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
						serailValidate.isValid = false;
					}


				}
				else{
					serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.EMPTY_INPUT');
					serailValidate.isValid = false;
				}
			}
			catch(e)
			{
				serailValidate.isValid = false;
				serailValidate.errorMessage = e.message;
				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
				log.error({title:'debugString',details:debugString});
			}

		}
		else{
			serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.EMPTY_INPUT');
			serailValidate.isValid = false;
		}
		log.debug({title:'serailValidate',details:serailValidate});
		return serailValidate;
	}

	function getInventoryBalanceSearchResults(fromBinInternalId,itemInternalId,warehouseLocationId,getSerialNoId,fromStatusInternalId)
	{

		var invBalanceSearch = search.load({id:'customsearch_wmsse_inventorybalance',type:search.Type.INVENTORY_BALANCE});
		var filters = invBalanceSearch.filters;
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
		if(fromBinInternalId!= null && fromBinInternalId!= '')
		{
			filters.push(search.createFilter({
				name:'binnumber',
				operator:search.Operator.ANYOF, 
				values:fromBinInternalId}));
		}
		filters.push(search.createFilter({
			name:'internalid',
			join:'item', 
			operator:search.Operator.ANYOF, 
			values:itemInternalId}));
		filters.push(search.createFilter({
			name:'location',
			operator:search.Operator.ANYOF, 
			values:warehouseLocationId}));
		if(getSerialNoId!= null && getSerialNoId!= '')
		{
			filters.push(search.createFilter({
				name:'inventorynumber',
				operator:search.Operator.ANYOF, 
				values:getSerialNoId}));
		}
		if(inventoryStatusFeature && fromStatusInternalId!= null && fromStatusInternalId!= '')
		{
			filters.push(search.createFilter({
				name:'status',
				operator:search.Operator.ANYOF, 
				values:fromStatusInternalId}));
		}
		invBalanceSearch.filters = filters;
		var	objBinDetails =utility.getSearchResultInJSON(invBalanceSearch);
		log.debug({title:'objBinDetails',details:objBinDetails});
		return objBinDetails;
	}

	/*function  getItemWiseLotsSearchResults(fromBinInternalId,itemInternalId,warehouseLocationId,serialName)
	{
		var searchObj = search.load({id:'customsearch_wmsse_itemwise_lots'});
		var columns = searchObj.columns;
		columns.push(search.createColumn({name:'quantityavailable',join :'inventoryNumberBinOnHand'}));
		columns.push(search.createColumn({name:'inventorynumber',join :'inventoryNumberBinOnHand'}));
		columns.push(search.createColumn({name:'usebins'}));

		var filters = searchObj.filters;
		if(fromBinInternalId!= null && fromBinInternalId!= '')
		{
			filters.push(search.createFilter({
				name:'binnumber',
				join:'inventoryNumberBinOnHand', 
				operator:search.Operator.ANYOF, 
				values:fromBinInternalId}));
		}
		filters.push(search.createFilter({
			name:'internalid',
			operator:search.Operator.ANYOF, 
			values:itemInternalId}));
		filters.push(search.createFilter({
			name:'isinactive',
			operator:search.Operator.IS, 
			values:false}));

		filters.push(search.createFilter({
			name:'location',
			join:'inventoryNumberBinOnHand',
			operator:search.Operator.ANYOF, 
			values:warehouseLocationId}));
		if(serialName!= null && serialName!= '')
		{
			filters.push(search.createFilter({
				name:'inventorynumber',
				join:'inventoryNumberBinOnHand',
				operator:search.Operator.IS, 
				values:serialName}));
		}
		searchObj.filters = filters;
		searchObj.columns = columns;
		var	objBinDetails = utility.getSearchResultInJSON(searchObj);
		log.debug({title:'objBinDetails',details:objBinDetails});
		return objBinDetails;
	}
	function getOpentaskSearchResults(itemInternalId,binInternalId,warehouseLocationId,fromStatusInternalId)
	{
		var searchObj = search.load({id:'customsearch_wmsse_opentask_search'});
		var cols = search.createColumn({name:'custrecord_wmsse_sku'});
		searchObj.columns.push(cols);

		var filters = searchObj.filters;
		if((utility.isValueValid(itemInternalId)))
		{
			filters.push(search.createFilter({
				name:'custrecord_wmsse_sku',
				operator:search.Operator.ANYOF, 
				values:itemInternalId}));
		}
		if(utility.isValueValid( binInternalId))
		{
			filters.push(search.createFilter({
				name:'custrecord_wmsse_actendloc',
				operator:search.Operator.ANYOF, 
				values:binInternalId}));
		}
		if(utility.isValueValid(warehouseLocationId))
		{
			filters.push(search.createFilter({
				name:'custrecord_wmsse_wms_location',
				operator:search.Operator.ANYOF, 
				values:warehouseLocationId}));
		}
		filters.push(search.createFilter({
			name:'custrecord_wmsse_tasktype',
			operator:search.Operator.ANYOF, 
			values:3}));
		filters.push(search.createFilter({
			name:'custrecord_wmsse_wms_status_flag',
			operator:search.Operator.ANYOF, 
			values:[8,28]}));
		filters.push(search.createFilter({
			name:'mainline',
			join:'custrecord_wmsse_order_no',
			operator:search.Operator.IS, 
			values:true}));
		filters.push(search.createFilter({
			name:'status',
			join:'custrecord_wmsse_order_no',
			operator:search.Operator.ANYOF, 
			values:['SalesOrd:B','SalesOrd:D','SalesOrd:E','TrnfrOrd:B','TrnfrOrd:D','TrnfrOrd:E']}));
		filters.push(search.createFilter({
			name:'custrecord_wmsse_nsconfirm_ref_no',
			operator:search.Operator.ANYOF, 
			values:['@NONE@']}));

		if(utility.isValueValid(fromStatusInternalId))
		{
			filters.push(search.createFilter({
				name:'custrecord_wmsse_inventorystatus',
				operator:search.Operator.ANYOF, 
				values:fromStatusInternalId}));
		}

		searchObj.filters = filters;
		var	objBinDetails =utility.getSearchResultInJSON(searchObj);
		return objBinDetails;
	}*/
	return {
		'post': doPost
	};

});
