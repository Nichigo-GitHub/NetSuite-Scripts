/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./big','./wms_workOrderUtility'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,Big,woUtility) {

	function doPost(requestBody) {

		var quantityDetails = {};
		var itemInternalId = '';
		var warehouseLocationId ='';
		var binInternalId = '';
		var processType = '';
		var itemType = '';
		var lotName = '';
		var unitType = '';
		var stockUnitName = '';
		var debugString = '';
		var statusList =[];
		var statusTable = [];
		var statusListArray =[];
		var lotListArray = [];
		var tempStatusIdListArray =[];
		var tempStatusTextListArray =[];
		var uomListObj ='';
		var stockConversionRate = '';
		var transactionUomConversionRate = '';
		var transactionUomName ='';
		var locUseBinsFlag = '';
		try{

			if (utility.isValueValid(requestBody)) {

				var requestParams = requestBody.params;
				debugString  = debugString +"requestParams"+requestParams;
				log.debug({title:'requestParams',details:requestParams});
				itemInternalId = requestParams.itemInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				binInternalId = requestParams.binInternalId;
				processType = requestParams.processType;
				uomListObj = requestParams.uomListObj;
				stockConversionRate = requestParams.stockConversionRate;
				transactionUomConversionRate = requestParams.transactionUomConversionRate;
				transactionUomName = requestParams.transactionUomName;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				var selectedConversionRate = '';
				var selectedUOMText = '';
				var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;
				var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;


				if(utility.isValueValid(requestParams.uomList))
				{
					var selectedUomList = requestParams.uomList;
					selectedConversionRate = selectedUomList.id;
					selectedUOMText = selectedUomList.value;
				}

				if(!utility.isValueValid(transactionUomConversionRate)){
					transactionUomConversionRate = 1;
				}

				if(!utility.isValueValid(stockConversionRate)){
					stockConversionRate = 1;
				}

				if ((utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId) && utility.isValueValid(binInternalId)) || 
						(locUseBinsFlag == false && utility.isValueValid(itemInternalId)))
				{
					var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();

					itemType = requestParams.itemType;
					lotName = requestParams.lotName;
					unitType = requestParams.unitType;
					vUnits = requestParams.vUnits;
					var uomResult = [];
					if(utility.isValueValid(unitType) && !utility.isValueValid(uomListObj))
					{	
						uomResult = utility.getUnitsType(unitType);
						log.debug('uomResult',uomResult);
					}
					if(uomResult.length > 0){
						uomListObj = [];
						for(var uomCnt in uomResult)
						{  
							var rec = uomResult[uomCnt];
							var conversionRate = rec['conversionrate'];
							var unitName =rec['unitname'];
							var row = {'value':unitName,'id':conversionRate};
							uomListObj.push(row);
							if(!utility.isValueValid(stockConversionRate))
							{
								if(utility.isValueValid(requestParams.stockUnitName)){
									if(stockUnitName.toUpperCase() == unitName.toUpperCase())
									{
										stockConversionRate = conversionRate;
									}
								}
							}								
						}
					}

					if(utility.isValueValid(requestParams.stockUnitName) || utility.isValueValid(requestParams.transactionUomName))
					{
						stockUnitName = requestParams.stockUnitName;
						quantityDetails['uomList'] = uomListObj;
						quantityDetails['uomDefaultStatus'] = transactionUomName;
					}

					if(!utility.isValueValid(requestParams.itemType))
					{
						itemType = utility.getItemType(itemInternalId,warehouseLocationId);
					}
					var defaultStatusText = '';

					var  inventoryNumberId = '';
					if((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem"||itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" ) && (utility.isValueValid(inventoryDetailLotOrSerialId))){
						inventoryNumberId = inventoryDetailLotOrSerialId;
					}
					else if((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem"||itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" ) && (utility.isValueValid(lotName)))
					{
						inventoryNumberId = utility.inventoryNumberInternalId(lotName,warehouseLocationId,itemInternalId);
					}
					log.debug({title:'inventoryNumberId',details:inventoryNumberId});

					
						var objPutawayStatusDetails = getPutawayStatusDetailsInStageBin(itemInternalId,warehouseLocationId,binInternalId,inventoryNumberId,itemType,unitType,stockUnitName,processType);
						log.debug({title:'objPutawayStatusDetails:',details:objPutawayStatusDetails});
						if(objPutawayStatusDetails.length>0)
						{
							defaultStatusText = objPutawayStatusDetails[0][0];
							for(var statusItr in objPutawayStatusDetails){
								var objectStatus = {};
								var objectStatusTable = {};

								var objStatusRec = objPutawayStatusDetails[statusItr];

								if(itemType == "inventoryitem" || itemType == "assemblyitem")
								{
									var availableQty = objStatusRec[1];
									if(parseFloat(availableQty)>0)
									{   if(inventoryStatusFeature){
										if(statusListArray.indexOf(objStatusRec[2])== -1)
										{
											objectStatus['statusText']=objStatusRec[0];
											objectStatus['statusId']=objStatusRec[2];
											statusListArray.push(objStatusRec[2]);
										}
										objectStatusTable['statusText']=objStatusRec[0];
									}
										objectStatusTable['availableQuantityWithUOM']=objStatusRec[1] +" "+stockUnitName;
										objectStatusTable['availableQuantity']=objStatusRec[1];
										objectStatusTable['itemName']=objStatusRec[3];
									}
								}
								else if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" || itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")
								{
									var availableQty = objStatusRec[1];

									if(parseFloat(availableQty)>0)
									{
										if(inventoryStatusFeature){ 
										if(itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")
										{
											var lotNumber = objStatusRec[4];

											if((lotListArray.indexOf(objStatusRec[4]) == -1) && (statusListArray.indexOf(objStatusRec[2])== -1))
											{
												objectStatus['statusText']=objStatusRec[0];
												objectStatus['statusId']=objStatusRec[2];
											}
											else if((statusListArray.indexOf(objStatusRec[2])== -1))
											{
												objectStatus['statusText']=objStatusRec[0];
												objectStatus['statusId']=objStatusRec[2];
											}
										}
										else
										{
											if(statusListArray.indexOf(objStatusRec[2])== -1)
											{
												objectStatus['statusText']=objStatusRec[0];
												objectStatus['statusId']=objStatusRec[2];
												statusListArray.push(objStatusRec[2]);
											}
										}
										objectStatusTable['statusText']=objStatusRec[0];
										}
										objectStatusTable['availableQuantityWithUOM']=objStatusRec[1] +" "+stockUnitName;
										objectStatusTable['lotName']=objStatusRec[4];
										objectStatusTable['lotExpiryDate']=objStatusRec[5];
										objectStatusTable['itemName']=objStatusRec[3];
										objectStatusTable['availableQuantity']=objStatusRec[1];
									}
								}

								var qty = objectStatusTable['availableQuantity'];
								var currentConvRate = stockConversionRate;

								if(utility.isValueValid(currentConvRate) && utility.isValueValid(qty) &&
										utility.isValueValid(selectedConversionRate)
										&& (selectedConversionRate != currentConvRate))
								{
									qty = utility.uomConversions(qty,selectedConversionRate,currentConvRate);
									if(qty > 0)
									{
										objectStatusTable['availableQuantity'] = qty;
										//objectStatusTable['availableQuantityWithUOM'] = qty + " "+selectedUOMText;
									}
								}

								if(utility.isValueValid(transactionUomConversionRate) && utility.isValueValid(qty) && utility.isValueValid(stockConversionRate) 
										&& (stockConversionRate != transactionUomConversionRate) && !utility.isValueValid(selectedConversionRate))
								{
									qty = utility.uomConversions(qty,transactionUomConversionRate,currentConvRate);
									if(qty > 0)
									{
										objectStatusTable['availableQuantity'] = qty;
										//objectStatusTable['availableQuantityWithUOM'] = qty + " "+selectedUOMText;
									}
								}                                  


								if(utility.isValueValid(objectStatus) && JSON.stringify(objectStatus) !='{}' )
									statusList[statusList.length] = objectStatus;
								if((utility.isValueValid(objectStatusTable) && JSON.stringify(objectStatusTable) !='{}' )){
									statusTable[statusTable.length] = objectStatusTable;
									statusListArray.push(objStatusRec[2]);
								}

								lotListArray.push(objStatusRec[4]);
							}
							quantityDetails['status'] = statusList;
							quantityDetails['defaultvalue'] = defaultStatusText;
							quantityDetails['isValid'] = true;
							log.debug({title:'statusTable',details:statusTable});
							log.debug({title:'statusList',details:statusList});

							var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, binInternalId, warehouseLocationId,
								'','','','',itemType,inventoryDetailLotOrSerialText);
							log.debug({title:'openTaskPickBinDtls :', details:openTaskPickBinDtls});

							for(var n=0;n<openTaskPickBinDtls.length;n++)
							{
								var binId = openTaskPickBinDtls[n]['custrecord_wmsse_actendloc'];
								var itemStatus = openTaskPickBinDtls[n]['custrecord_wmsse_inventorystatusText'];
								var quantity = openTaskPickBinDtls[n]['actualQuantityInBaseUnits'];
								for(var i=0;i<statusTable.length;i++)
								{
									if((!utility.isValueValid(statusTable[i]['statusText']) && !utility.isValueValid(itemStatus)) || (statusTable[i]['statusText'] == itemStatus)){
										var binQty = statusTable[i]['availableQuantity'];
										if(utility.isValueValid(selectedConversionRate) && quantity>0){
											quantity = utility.uomConversions(quantity,selectedConversionRate,1);
										}else{
											quantity = utility.uomConversions(quantity,transactionUomConversionRate,1);											
										}

										quantity = new Big(quantity);
										statusTable[i]['availableQuantity'] = (new Big(binQty)).minus(quantity)  ;
										if(statusTable[i]['availableQuantity'] <= 0){
											statusTable.splice(i,1);
										}
									}
								}

							}

							var statusListArr = [];
							var dfltStsTxt = '';
							for(var stsLstItr=0; stsLstItr<statusList.length; stsLstItr++)
							{
								var stsListObj = {};
								for(stsTblItr=0; stsTblItr<statusTable.length; stsTblItr++)
								{
									if(statusList[stsLstItr]['statusText'] == statusTable[stsTblItr]['statusText'])
									{
										stsListObj['statusId'] = statusList[stsLstItr]['statusId'];
										stsListObj['statusText'] = statusList[stsLstItr]['statusText'];

										//if(dfltStsTxt!='' || dfltStsTxt!=null){
										if(dfltStsTxt == '' || dfltStsTxt == null){
											dfltStsTxt = statusList[stsLstItr]['statusText'];
										}
										statusListArr[statusListArr.length]= stsListObj;
										break;
									}
								}
							}

							if(statusListArr!='' && statusListArr.length>0){
								quantityDetails['status'] = statusListArr;
								quantityDetails['defaultvalue'] = dfltStsTxt;
							}
							quantityDetails['statusTable'] = statusTable;

						}
						else
						{
							quantityDetails['errorMessage'] = "There is no inventory Available";
							quantityDetails['isValid'] = false;
						}

				}
				else{
					quantityDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_QUANTITY.EMPTY_INPUT');
					quantityDetails['isValid'] = false;
				}
			}
			else{
				quantityDetails['errorMessage'] = translator.getTranslationString('BINTRANSFER_QUANTITY.EMPTY_INPUT');
				quantityDetails['isValid'] = false;
			}
		}
		catch(e)
		{
			quantityDetails['isValid'] = false;
			quantityDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug({title:'quantityDetails',details:quantityDetails});
		return quantityDetails;
	}

	function getItemWiseStatusDetailsInBin(ItemInternalId,whLocationId,vBinId) {

		var searchObj = search.load({ id : 'customsearch_wmsse_srchres_statuswise',type:search.Type.INVENTORY_BALANCE});

		if (utility.isValueValid(ItemInternalId)) {
			searchObj.filters.push(search.createFilter({ name :'item',
				operator: search.Operator.ANYOF,
				values: ItemInternalId
			}));
		}
		if (utility.isValueValid(whLocationId)) {
			searchObj.filters.push(search.createFilter({ name :'location',
				operator: search.Operator.ANYOF,
				values: whLocationId
			}));
		}
		if (utility.isValueValid(vBinId)) {
			searchObj.filters.push(search.createFilter({ name :'binnumber',
				operator: search.Operator.ANYOF,
				values: vBinId
			}));
		}
		var alltaskresults = utility.getSearchResultInJSON(searchObj);
		return alltaskresults;
	}

	function getPutawayStatusDetailsInStageBin(itemInternalId,warehouseLocationId,binInternalId,inventoryNumberId,itemType,unitType,stockUnitName,processType)
	{

		var objBinDetailsSearch = search.load({
			id : 'customsearch_wms_status_alltypesearchres',
			type:search.Type.INVENTORY_BALANCE
		});

		var filterStrat = objBinDetailsSearch.filters;

		if (utility.isValueValid(itemInternalId)) 
		{
			filterStrat.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
		}
		if (utility.isValueValid(warehouseLocationId))
		{
			filterStrat.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
		}

		if (utility.isValueValid(binInternalId)) 
		{
			filterStrat.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.ANYOF,
				values: binInternalId
			}));
		}
		if (utility.isValueValid(inventoryNumberId))
		{
			filterStrat.push(search.createFilter({
				name: 'inventorynumber',
				operator: search.Operator.ANYOF,
				values: inventoryNumberId
			}));
		}

		objBinDetailsSearch.filters = filterStrat;
		var vStatusDetails = utility.getSearchResultInJSON(objBinDetailsSearch);

		var vStatusDetailsArr = [];

		log.debug({title:'vStatusDetails',details:vStatusDetails});

		if(vStatusDetails.length >0)
		{

			if((itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem" || itemType == "lotnumberedinventoryitem" || 
					itemType=="lotnumberedassemblyitem"))
			{
				var statusArr = [];
				var lotArr = [];

				for(var statusItr=0; statusItr<vStatusDetails.length; statusItr++)
				{
					var status = vStatusDetails[statusItr]['statusText'];
					var vBinQtyAvail=vStatusDetails[statusItr]['available'];
					var statusId = vStatusDetails[statusItr]['status'];
					var inventoryNumber = vStatusDetails[statusItr]['inventorynumberText'];
					var itemName = vStatusDetails[statusItr]['itemText'];
					var expiryDate = vStatusDetails[statusItr]['expirationdate'];

					if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")
					{
						if(statusArr.indexOf(statusId)==-1)
						{
							var currRow = [status,vBinQtyAvail,statusId,itemName,inventoryNumber,expiryDate];
							statusArr.push(statusId);
							vStatusDetailsArr.push(currRow);
						}
						else
						{
							var indx = statusArr.indexOf(statusId);
							var Row = vStatusDetailsArr[indx];
							var qty = Row[1];
							var totalQty = Big(qty).plus(vBinQtyAvail);
							var currRow = [status,totalQty,statusId,itemName,inventoryNumber,expiryDate];
							vStatusDetailsArr[indx]=currRow;
						}
					}
					else
					{
						var currRow = [status,vBinQtyAvail,statusId,itemName,inventoryNumber,expiryDate];
						lotArr.push(inventoryNumber);					
						vStatusDetailsArr.push(currRow);
					}
				}
			}
			else
			{
				for(var statusItr=0;statusItr<vStatusDetails.length;statusItr++)
				{
					var status = vStatusDetails[statusItr]['statusText'];
					var vBinQtyAvail=vStatusDetails[statusItr]['available'];
					var statusId = vStatusDetails[statusItr]['status'];
					var itemName = vStatusDetails[statusItr]['itemText'];


					var currRow = [status,vBinQtyAvail,statusId,itemName];
					vStatusDetailsArr.push(currRow);
				}
			}
		}
		return vStatusDetailsArr;
	}
	


	return {
		'post': doPost
	};

});
