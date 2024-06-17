/**
 * Copyright ï¿½ 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', 'N/search', 'N/record','./big','./wms_translator', './wms_inboundUtility'],

		function (utility, search, record,Big,translator, inboundUtility) {
	function doPost(requestBody) {

		var serialValidationDetails = {};
		var itemInternalId = '';
		var shipmentId = '';
		var shipmentLineNo = '';
		var warehouseLocationId = '';
		var shipmentNumber = '';
		var serialName = '';
		var numberOftimesSerialScanned ='';
		var scannedQuantity = '';
		var poId = '';
		var debugString = '';
		var receiveAllBtn = '';
		var serialEntryRecordArray = [];
		var locUseBinsFlag = '';
		var enteredQtyInEach = '';
		var remainingQuantity = '';		
		var invStatusId = '';
		var impactedRecords  ={};
		var openTaskIdarray  =[];
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams 			= requestBody.params;
				itemInternalId 				= requestParams.itemInternalId;
				shipmentId 					= requestParams.shipmentId;
				shipmentLineNo 				= requestParams.shipmentLineNo;
				warehouseLocationId 		= requestParams.warehouseLocationId;
				shipmentNumber 				= requestParams.shipmentNumber;
				serialName 					= requestParams.serialName;
				numberOftimesSerialScanned 	= requestParams.numberOfTimesSerialScanned;
				scannedQuantity 			= requestParams.scannedQuantity;
				poId						= requestParams.poId;
				receiveAllBtn               = requestParams.receiveAll;
				serialEntryRecordArray 		= requestParams.serialEntryRecordArray;
				locUseBinsFlag              = requestParams.locUseBinsFlag;
				enteredQtyInEach            = requestParams.enteredQtyInEach;
				remainingQuantity           = requestParams.remainingQuantity;
				invStatusId                 = requestParams.invStatus;
				var serialEntryRecordObj	= {};
				var transactionType='ISM';

				log.debug({title:'requestParams',details:requestParams});

				if((utility.isValueValid(serialName) || receiveAllBtn == 'receiveAll' ) && utility.isValueValid(itemInternalId)
						&& utility.isValueValid(shipmentNumber) && utility.isValueValid(warehouseLocationId) 
						&& utility.isValueValid(shipmentLineNo) && utility.isValueValid(shipmentId))
				{
					if(receiveAllBtn == 'receiveAll'){

						impactedRecords['_ignoreUpdate'] = true;
						var isEligibleForReceiveAll = this._checkForISMLineReceiveAllOption(shipmentId,warehouseLocationId,itemInternalId,shipmentLineNo);
						if(!isEligibleForReceiveAll){
							serialValidationDetails['errorMessage'] = translator.getTranslationString('INBOUNDSHIPMENT.INVALID.RECEIVEALL');
							serialValidationDetails['isValid'] = false;
						}
						else
						{
							var isISMLineManuallyReceived = inboundUtility.checkIslinePartiallyReceivedInISM(shipmentId,warehouseLocationId,shipmentLineNo);
							if(!isISMLineManuallyReceived)
							{
								serialValidationDetails['isValid'] = true;
								if(utility.isValueValid(locUseBinsFlag)  && locUseBinsFlag == false)
								{
									var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
									if(!inventoryStatusFeature)
									{
										var manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
										var shipmentReceiptId = inboundUtility.iSM_receiveAll(shipmentId,warehouseLocationId,'',shipmentLineNo,manuallyPostIRSystemRuleValue,'');


										var itemId = requestParams.itemInternalId;
										var itemType = requestParams.itemType;		
										var poId = requestParams.poInternalId;
										var poName = requestParams.poname;
										var unit = requestParams.uom;		
										var unitConversionRate = requestParams.conversionRate;
										var strBarCode = requestParams.strBarCode;
										var remainingQuantity = requestParams.remainingQuantity;

										var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams,manuallyPostIRSystemRuleValue,'','',shipmentLineNo,
												remainingQuantity,warehouseLocationId,shipmentReceiptId,itemId,itemType,poId,poName,unit,unitConversionRate,strBarCode,
												'',remainingQuantity,shipmentId,'');
										var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
										openTaskIdarray.push(openTaskId);
										var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId,'',warehouseLocationId);
										var qtyRemainLinesCountForRecving = inboundUtility.checkCountforRemaining(shipmentListDetails,shipmentReceiptId,warehouseLocationId);
										var remainingItemsCount = qtyRemainLinesCountForRecving;

										var inputParamObj={};
										inputParamObj.poInternald =poId;
										inputParamObj.shipmentId =shipmentId;
										inputParamObj.openTaskIdarray =openTaskIdarray;
										inputParamObj.poName =poName;
										inputParamObj.warehouseLocationId =warehouseLocationId;
										inputParamObj.shipmentReceiptId =shipmentReceiptId;
										inputParamObj._ignoreUpdate = false;
										impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
										log.debug({title:'impactedRecords :', details: impactedRecords });

										serialValidationDetails['itemsCount'] = remainingItemsCount;
										serialValidationDetails['imageUrl'] = requestParams.imageUrl;
										serialValidationDetails['incoTerm'] = requestParams.incoTerm;
										serialValidationDetails['poname'] = requestParams.poname;
										serialValidationDetails['itemName'] = requestParams.itemName;
										serialValidationDetails['openTaskId'] = openTaskId;
										serialValidationDetails['shipmentReceiptId'] = shipmentReceiptId;  
										serialValidationDetails['manuallyPostIRSystemRuleValue'] = manuallyPostIRSystemRuleValue;
										serialValidationDetails['isMapReduceScriptInvoked'] = 'F';
										serialValidationDetails['isValid'] = true;
									}
								}
								else
								{
									serialValidationDetails['receiveAllBtn'] = 'receiveAll';
								}
							}
							else
							{
								serialValidationDetails['errorMessage'] = translator.getTranslationString('INBOUNDSHIPMENT.INVALID.RECEIVEALL.PARTIALLYRECEIVED');
								serialValidationDetails['isValid'] = false;
							}
						}
					}
						else
						{
							var itemResults = inboundUtility.getItemSearchDetails(itemInternalId,warehouseLocationId);

							if (itemResults == null || itemResults.length == 0)
							{
								serialValidationDetails['errorMessage'] =  translator.getTranslationString('ISM_SERIALVALIDATION.INACTIVE_ITEM');
								serialValidationDetails['isValid'] =  false;
							}
							else
							{
								impactedRecords['_ignoreUpdate'] = true;
								var tempFlag =true;

									var currItem = utility.getSKUIdWithName(serialName,warehouseLocationId,requestParams.VendorId,poId);
								

									if ((utility.isValueValid(currItem)) && (JSON.stringify(currItem) !== '{}' && !(utility.isValueValid(currItem.error)))){

										var barcodeItemInternalId = ((currItem.itemInternalId) ? (currItem.itemInternalId) : currItem.barcodeIteminternalid);										

										if(itemInternalId == barcodeItemInternalId ){

											if(utility.isValueValid(currItem.barcodeSerialname)) {

												serialName = currItem.barcodeSerialname;												

											}

										}

										else {

											tempFlag = false;

											serialValidationDetails.errorMessage = translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT");

											serialValidationDetails.isValid = false;

										}

									}
								var isSerialExistsInNSInventory = utility.isInventoryNumberExists(itemInternalId, serialName, warehouseLocationId);
								if (isSerialExistsInNSInventory)
								{
									serialValidationDetails['errorMessage'] = translator.getTranslationString('ISM_SERIALVALIDATION.SERIAL_EXISTS');
									serialValidationDetails['isValid']=false;
								}
								else
								{
									
									var openTaskSerialArray = checkOpenTaskSerialsForDuplicates(itemInternalId);
									log.debug('openTaskSerialArray :', openTaskSerialArray);

									if (openTaskSerialArray.indexOf(serialName) != -1) {
										serialValidationDetails ['errorMessage'] = translator.getTranslationString('ISM_SERIALVALIDATION.SERIAL_EXISTS_OPEN_TASK');
										serialValidationDetails['isValid']=false;
									}
									else if(tempFlag != false)
									{
										var serialSearchResults = checkSerialEntryForDuplicates(serialName,shipmentLineNo,shipmentId);

										if (serialSearchResults.length > 0) {

											serialValidationDetails ['errorMessage'] = translator.getTranslationString('ISM_SERIALVALIDATION.SERIAL_SCANNED');
											serialValidationDetails['isValid']=false;
										}
										else 
										{
											var serialEntryRecordId = createSerialInSerialEntryCustomRecord(serialName,shipmentId,poId,shipmentLineNo,itemInternalId,invStatusId);

											serialValidationDetails['serialNo'] = serialName;
											serialValidationDetails['numberOfTimesSerialScanned'] = parseFloat(numberOftimesSerialScanned) + 1;
											serialValidationDetails['serialEntryRecordId'] = serialEntryRecordId;
											serialEntryRecordObj.serialEntryRecordId = serialEntryRecordId;
											if(utility.isValueValid(serialEntryRecordArray))
											{
												serialEntryRecordArray.push(serialEntryRecordObj);
											}
											else
											{
												serialEntryRecordArray = [];
												serialEntryRecordArray.push(serialEntryRecordObj);
											}

											serialValidationDetails['serialEntryRecordArray'] = serialEntryRecordArray;										
											serialValidationDetails['isValid']=true;
											log.debug({title: 'locUseBinsFlag',details:locUseBinsFlag});
											log.debug({title: 'numberOftimesSerialScanned',details:numberOftimesSerialScanned});
											log.debug({title: 'enteredQtyInEach',details:enteredQtyInEach});
											if( utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == false &&
													parseInt(numberOftimesSerialScanned)  == parseInt(enteredQtyInEach)-1)
											{
												//Receive ISM Line for locUseBinsFlag flase scenario

												var	manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
												log.debug({title: 'manuallyPostIRSystemRuleValue',details:manuallyPostIRSystemRuleValue});
												var shipmentReceiptId = '';
												var poId = requestParams.poId;
												var itemType = requestParams.itemType;	
												log.debug({title: 'poId',details:poId});

												log.debug({title: 'invStatusId',details:invStatusId});
												if(manuallyPostIRSystemRuleValue == 'N'){

													shipmentReceiptId = inboundUtility.receiveISM(shipmentId,warehouseLocationId,'',shipmentLineNo,scannedQuantity,poId,itemType,invStatusId);
												}
												if(manuallyPostIRSystemRuleValue == 'Y' || utility.isValueValid(shipmentReceiptId)){
													var shipmentListDetails = inboundUtility.validateItemAgainstShipment(shipmentId,'',warehouseLocationId);
													log.debug({title: 'shipmentListDetails',details:shipmentListDetails});

													var itemId = requestParams.itemInternalId;													
													var poName = requestParams.poname;
													var unit = requestParams.uom;		
													var unitConversionRate = requestParams.transactionUomConversionRate;
													var strBarCode1 = requestParams.strBarCode;

													var exptdQty = requestParams.expectedQuantity;

													var opetaskParamsObj = inboundUtility.buildOpenTaskParametes(requestParams,manuallyPostIRSystemRuleValue,'','',shipmentLineNo,
															scannedQuantity,warehouseLocationId,shipmentReceiptId,itemId,itemType,poId,poName,unit,unitConversionRate,strBarCode1,
															invStatusId,exptdQty,shipmentId);

													var openTaskId = inboundUtility.updateOpenTask(opetaskParamsObj);
													openTaskIdarray.push(openTaskId);

													var qtyRemainLinesCountForRecving = inboundUtility.checkCountforRemaining(shipmentListDetails,shipmentReceiptId,warehouseLocationId);
													var remainingItemsCount = qtyRemainLinesCountForRecving;

													serialValidationDetails['vCount'] = remainingItemsCount;
													serialValidationDetails['imageUrl'] = requestParams.imageUrl;
													serialValidationDetails['incoTerm'] = requestParams.incoTerm;
													serialValidationDetails['poname'] = requestParams.poname;
													serialValidationDetails['itemName'] = requestParams.itemName;
													serialValidationDetails['openTaskId'] = openTaskId;
													serialValidationDetails['shipmentReceiptId'] = shipmentReceiptId;  
													serialValidationDetails['manuallyPostIRSystemRuleValue'] = manuallyPostIRSystemRuleValue;
													serialValidationDetails['isMapReduceScriptInvoked'] = 'F';
													serialValidationDetails['isValid'] = true;
													var inputParamObj={};
													inputParamObj.poInternald =poId;
													inputParamObj.shipmentId =shipmentId;
													inputParamObj.openTaskIdarray =openTaskIdarray;
													inputParamObj.poName =poName;
													inputParamObj.warehouseLocationId =warehouseLocationId;
													inputParamObj.shipmentReceiptId =shipmentReceiptId;
													inputParamObj._ignoreUpdate = false;
													impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
													log.debug({title:'impactedRecords :', details: impactedRecords });
												}
											}

										}
									}
								}
							}
						}
						serialValidationDetails.impactedRecords = impactedRecords;
					}
					else
					{
						serialValidationDetails ['errorMessage'] = translator.getTranslationString("ISM_SERIALVALIDATION.VALID_SERIAL");
						serialValidationDetails['isValid']=false;
					}
				}
				else
				{
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
		function _checkForISMLineReceiveAllOption(shipmentId,warehouseLocationId,itemInternalId,shipmentLineNo)
		{
			var results = inboundUtility.validateShipmentWithInvtDetailsForReceiveAll(shipmentId,warehouseLocationId,itemInternalId);
			log.debug({title: 'results',details:results});
			var _isEligibleForReceiveAll = true;
			if(results.length > 0){

				for(var res in results){
					var item = results[res].item;
					var line  = results[res].inboundshipmentitemid;
					if(parseInt(shipmentLineNo) == parseInt(line)){
						if(item == '' || item == '- None -'){
							_isEligibleForReceiveAll = false;
							break;
						}
					}
				}

			}
			return _isEligibleForReceiveAll;
		}
		function checkSerialEntryForDuplicates(serialName,shipmentLineNo,shipmentId)
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
				name: 'custrecord_wmsse_ser_ordline',
				operator: search.Operator.EQUALTO,
				values: shipmentLineNo
			}));
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_inb_shipment',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));
			serialSearch.filters = filters;
			return utility.getSearchResultInJSON(serialSearch);
		}
		function createSerialInSerialEntryCustomRecord(serialName,shipmentId,poId,shipmentLineNo,itemInternalId,inventoryStatusId)
		{
			var customrecord = record.create({
				type: 'customrecord_wmsse_serialentry'
			});
			customrecord.setValue({fieldId: 'name', value: serialName});
			customrecord.setValue({fieldId: 'custrecord_wmsse_inb_shipment', value: shipmentId});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_ordno', value: poId});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_ordline', value: shipmentLineNo});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_item', value: itemInternalId});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_qty', value: 1});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_no', value: serialName});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_status', value: false});
			customrecord.setValue({fieldId: 'custrecord_wmsse_ser_tasktype', value: 2});
			if(utility.isValueValid(inventoryStatusId))
			{
				customrecord.setValue({fieldId: 'custrecord_serial_inventorystatus', value: inventoryStatusId});
			}
			return  customrecord.save({
				enableSourcing: false,
				ignoreMandatoryFields: true
			});
		}
		function checkOpenTaskSerialsForDuplicates(itemID)
		{
			var opentaskSerialSearch = search.load({
				id: 'customsearch_wms_ism_opentask_serialsrch',
			});
			var  filtersseropenTask = opentaskSerialSearch.filters;
			filtersseropenTask.push(search.createFilter({
				name: 'custrecord_wmsse_sku',
				operator: search.Operator.ANYOF,
				values: itemID
			}));                                  
			opentaskSerialSearch.filters = filtersseropenTask;
			var openTaskSerialDetails = utility.getSearchResultInJSON(opentaskSerialSearch);
			log.debug('open task serial :', openTaskSerialDetails);
			var openTaskSerialDtlsArr = [];
			if (openTaskSerialDetails.length > 0) 
			{
				for (var openTaskRec = 0; openTaskRec < openTaskSerialDetails.length; openTaskRec++) 
				{
					var opentaskSerial = openTaskSerialDetails[openTaskRec]['custrecord_wmsse_serial_no'];
					if (utility.isValueValid(opentaskSerial)) 
					{
						var opentaskSerArray = opentaskSerial.split(',');

						if (opentaskSerArray.length > 0) {
							for (var openTaskSer = 0; openTaskSer < opentaskSerArray.length; openTaskSer++) {
								var serialNo = opentaskSerArray[openTaskSer];
								if (utility.isValueValid(serialNo)) {
									openTaskSerialDtlsArr.push(serialNo);
								}
							}
						}
					}
				}
			}

			return openTaskSerialDtlsArr;
		}
		return {
			'post': doPost,
			'_checkForISMLineReceiveAllOption':_checkForISMLineReceiveAllOption
		};
	});
