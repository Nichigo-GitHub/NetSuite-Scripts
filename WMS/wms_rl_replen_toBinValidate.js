/**
 *   Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/record','N/runtime','./wms_utility','./big','./wms_translator','N/format','./wms_inventory_utility'],
		/**
		 * @param {search} search
		 */
		function(search,record,runtime,utility,Big,translator,format,invtUtility) {

	/**
	 * Function to validate the entered to Bin location.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 */
	function doPost(requestBody) {

		var scannedQuantity ='';
		var fromBinName='';		
		var binName ='';
		var preferedBinName ='';			
		var itemType='';
		var fromBinInternalId = '';
		var itemInternalId = '';
		var warehouseLocationId = '';
		var lotName = '';
		var actualBeginTime = '';
		var stockConversionRate = '';
		var stockUnitName ='';		
		var statusInternalId ='';
		var serialString ='';		
		var binValidateArray = {};
		var debugString  = '';
		var processType='';	
		var recordInternalId="";
		var scannedStatusQtyList="";
		var scannedStatusLotList=""
		var scannedStatusList="";
		var transactionUomConversionRate='';
		var impactRec = {};
		var binTransferArr = [];
		var openTaskArr = [];
		var invTransferArr = [];
		var labelRecArr = [];
		var extlabelRecArr = [];
		var impactedRecords = {};
		
		
		try
		{
			if (utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				scannedQuantity = requestParams.scannedQuantity;
				fromBinName = requestParams.fromBinName;
				binName = requestParams.binName;
				preferedBinName = requestParams.preferedBinName;
				itemType = requestParams.itemType;
				fromBinInternalId = requestParams.fromBinInternalId;
				itemInternalId = requestParams.itemInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				lotName = requestParams.lotName;							
				actualBeginTime = requestParams.actualBeginTime;
				stockConversionRate = requestParams.stockConversionRate;
				stockUnitName = requestParams.stockUnitName;				
				statusInternalId = requestParams.statusInternalId;
				processType=requestParams.processType;		
				recordInternalId=requestParams.recordInternalId;
				scannedStatusQtyList=requestParams.scannedStatusQtyList;
				scannedStatusLotList=requestParams.scannedStatusLotList;
				scannedStatusList=requestParams.scannedStatusList;
				transactionUomConversionRate= requestParams.transactionUomConversionRate;
				log.debug({title:'requestParams',details:requestParams});
				
				if(utility.isValueValid(binName) && utility.isValueValid(fromBinName)
						&& utility.isValueValid(itemType) && utility.isValueValid(fromBinInternalId)
						&& utility.isValueValid(itemInternalId)  && utility.isValueValid(warehouseLocationId)&& utility.isValueValid(scannedQuantity))
				{
					if(fromBinName == binName)
					{
						binValidateArray["errorMessage"] = translator.getTranslationString('INVENTORY_TOBINVALIDATE.SAME_FROMANDTOBINS');
						binValidateArray["isValid"] = false;
					}
					else if(binName != preferedBinName)
					{
						binValidateArray["errorMessage"] = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
						binValidateArray["isValid"] = false;
					}
					else
					{

						var currentUserId = runtime.getCurrentUser().id;
						var	 binSearchResults=search.load({
							id : 'customsearch_wmsse_tobin_details'
						});
						var binSearchFilters = binSearchResults.filters;

						if(utility.isValueValid(binName))
						{
							binSearchFilters.push(search.createFilter({
								name: 'binnumber',
								operator: search.Operator.IS,
								values: binName
							}));
						}
						binSearchFilters.push(search.createFilter({
							name: 'inactive',
							operator: search.Operator.IS,
							values: false
						}));

						if(utility.isValueValid(warehouseLocationId))
						{
							binSearchFilters.push(search.createFilter({
								name: 'location',
								operator: search.Operator.ANYOF,
								values: warehouseLocationId
							}));
						}

						binSearchResults.filters = binSearchFilters;
						var	 binSearchResultsvalues = binSearchResults.run().getRange({
							start: 0,
							end: 1000
						});
						var toBinInternalId='';					
						if(utility.isValueValid(binSearchResultsvalues))
						{
							toBinInternalId=binSearchResultsvalues[0].id;
							
						}
						log.debug({title:'toBinInternalId',details:toBinInternalId});
						if(!utility.isValueValid(toBinInternalId))
						{								
							binValidateArray["errorMessage"] = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
							binValidateArray["isValid"] = false;
						}												
						else
						{
							if(!utility.isValueValid(transactionUomConversionRate))
							{
								transactionUomConversionRate = 1;
							}
							var binTransferQty = null;
							if(!(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")){
								binTransferQty = Number((Big(scannedQuantity).mul(transactionUomConversionRate)).toFixed(8));
							}else{
								binTransferQty = Number((Big(scannedQuantity)).toFixed(8));
							}
							log.debug({title:'transactionUomConversionRate',details:transactionUomConversionRate});
							    var bintransferObj ={};
								bintransferObj['itemType']=itemType;
								bintransferObj['whLocation']=warehouseLocationId;
								bintransferObj['itemId']=itemInternalId;
								bintransferObj['quantity']=binTransferQty;
								bintransferObj['fromBinId']=fromBinInternalId;
								bintransferObj['toBinId']=toBinInternalId;
								bintransferObj['batchno']=lotName;
								bintransferObj['actualBeginTime']=actualBeginTime;
								bintransferObj['units']=stockUnitName;
								bintransferObj['stockConversionRate']=stockConversionRate;
								bintransferObj['opentaskQty']=Number((Big(scannedQuantity)).toFixed(8));
								bintransferObj['processType']="replen";
								bintransferObj['scannedStatusQtyList']=scannedStatusQtyList;
								bintransferObj['scannedStatusLotList']=scannedStatusLotList;
								bintransferObj['scannedStatusList']=scannedStatusList;
								bintransferObj['stockConversionRate']=transactionUomConversionRate;
								log.debug({title:'bintransferObj',details:bintransferObj});

								if(utility.isInvStatusFeatureEnabled())
								{									
									bintransferObj['fromStatus']=statusInternalId;										
									bintransferObj['toStatus']=statusInternalId;
									//binTransferId= utility.inventoryBinTransfer(bintransferObj);
									impactRec = invtUtility.inventoryBinTransfer(bintransferObj);
								}
								else
								{
									//binTransferId= utility.inventoryBinTransfer(bintransferObj);
									impactRec = invtUtility.inventoryBinTransfer(bintransferObj);
								}
								
								log.debug('Impacted Rec :', impactRec);
								
								if(utility.isValueValid(impactRec['inventoryCountId'])){
									binTransferArr.push(impactRec['inventoryCountId']);
								}else{
									binTransferArr.push();
								}

								if(utility.isValueValid(impactRec['opentaskId'])){
									openTaskArr.push(impactRec['opentaskId']);
								}else{
									openTaskArr.push();
								}

								impactedRecords['bintransfer'] = binTransferArr;
								impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskArr;

								var opentaskInternalId = '';
								var expectedQuantity = 0;
								var remQty = 0;
								var tempRemainingQunatity = 0;
								if((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"))
								{
									if(utility.isValueValid(scannedStatusQtyList))
									{
										var totalQuantity=0;										
										var qtyArray=scannedStatusQtyList.split(',');
										log.debug({title:'qtyArray',details:qtyArray});
										for(var qtyItr=0;qtyItr<qtyArray.length;qtyItr++)
										{										
											totalQuantity=Number(Big(totalQuantity).plus(qtyArray[qtyItr]));
										}
										scannedQuantity=totalQuantity;
									}

								}
								log.debug({title:'scannedQuantity',details:scannedQuantity});
								var replenTaskDetails = invtUtility.getReplenItemsList(warehouseLocationId,itemInternalId,toBinInternalId,
										currentUserId,recordInternalId);
								log.debug({title:'replenTaskDetails',details:replenTaskDetails});
								if(replenTaskDetails!=null && replenTaskDetails!='' && replenTaskDetails.length != null)
								{
									
									for(var i=0;i<replenTaskDetails.length;i++)
									{
										opentaskInternalId = replenTaskDetails[i]['internalidText'];

										var searchRec = record.load({
											type: 'customrecord_wmsse_trn_opentask',
											id: opentaskInternalId,
											
										});
										
										actualQuantity = searchRec.getValue({ fieldId:'custrecord_wmsse_act_qty'});
										expectedQuantity = searchRec.getValue({ fieldId:'custrecord_wmsse_expe_qty'});
										
										if(expectedQuantity == '' || expectedQuantity == null)
											expectedQuantity = 0;
										if(actualQuantity == '' || actualQuantity == null)
											actualQuantity = 0;
										actualQuantity = Big(actualQuantity).plus(scannedQuantity);

										tempRemainingQunatity = Big(expectedQuantity).minus(actualQuantity);

										if(parseFloat(tempRemainingQunatity) < 0)
										{
											tempRemainingQunatity = -(tempRemainingQunatity);
											actualQuantity = Big(actualQuantity).minus(tempRemainingQunatity);
											scannedQuantity = parseFloat(tempRemainingQunatity);
											remQty = Big(expectedQuantity).minus(actualQuantity);
										}
										else
										{
											remQty = parseFloat(tempRemainingQunatity);
											scannedQuantity = 0;
										}									

										searchRec.setValue({ fieldId:'custrecord_wmsse_act_qty', value :Number(Big(actualQuantity).toFixed(8)) });
										searchRec.setValue({ fieldId:'custrecord_wmsse_sku', value :itemInternalId });
										searchRec.setValue({ fieldId:'custrecord_wmsse_actbeginloc', value :fromBinInternalId });
										searchRec.setValue({ fieldId:'custrecord_wmsse_actendloc', value :toBinInternalId });
										if(parseInt(remQty) == 0 && parseInt(expectedQuantity) == parseInt(actualQuantity))
										{

											searchRec.setValue({ fieldId:'custrecord_wmsse_wms_status_flag', value :19 });
											try
											{ // temparary added Try/catch, becuase sometime it throws invalid date
												var currDate = utility.DateStamp();
												var parsedCurrentDate = format.parse({
													value: currDate,
													type: format.Type.DATE
												});
												searchRec.setValue({ fieldId:'custrecord_wmsse_act_begin_date', value :parsedCurrentDate });
												searchRec.setValue({ fieldId:'custrecord_wmsse_act_end_date', value :parsedCurrentDate });
											}
											catch(e)
											{
												log.debug({title:'exception in date update',details:e});
											}

										}
										searchRec.save();

										if(parseFloat(scannedQuantity) == 0 || parseFloat(scannedQuantity) == 0.0)
											break;	

									}

								}
								 labelRecArr.push();
								 extlabelRecArr.push();
								 impactedRecords['customrecord_wmsse_labelprinting'] = labelRecArr;
								 impactedRecords['customrecord_wmsse_ext_labelprinting'] = extlabelRecArr;
								 binValidateArray["impactedRecords"] = impactedRecords;	
								 
								binValidateArray["isValid"] = true;									
							
						}
					}

				}
				else
				{
					binValidateArray["errorMessage"] = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
					binValidateArray["isValid"] = false;
				}

			}
			else
			{
				binValidateArray["errorMessage"] = translator.getTranslationString('INVENTORY_TOBINVALIDATE.INVALID_BIN');
				binValidateArray["isValid"] = false;
			}
		}
		catch(e)
		{
			binValidateArray['isValid'] = false;
			binValidateArray['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return binValidateArray;

	}
	

	return {
		'post': doPost
		
	};

});
