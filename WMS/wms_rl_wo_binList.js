/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./big','N/config','./wms_workOrderUtility'],

		function (search,utility,translator,Big,config,woUtility) {

	function doPost(requestBody) {

		var binListDetails={};
		var debugString = '';
		var requestParams = '';
		var woItemList = [];

		try{
			if(utility.isValueValid(requestBody)){
				log.debug({title:'requestBody',details:requestBody});	
				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var itemType = requestParams.itemType;
				var itemName = requestParams.itemName;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var selectedConversionRate = requestParams.transactionUomConversionRate ;
				var selectedUOMText ='';
				var selectedStatusId =requestParams.selectedStatusId;
				var transactionUomName =requestParams.transactionUomName; 
				var itemGroup = '';
				var itemFamily = '';
				var stockunitText ='';
				var preferedBinInternalId ='';
				var unitType='';
				var stockConversionRate ='';
				var itemStockunit='';
				var loadConfig = config.load({
					type: config.Type.USER_PREFERENCES
				});
				var department = loadConfig.getValue({fieldId: 'departments'});
				var classes = loadConfig.getValue({fieldId: 'classes'});
				var internalIdArr=[];
				var objWOLineDtl = {};
				var objItemDtl = {};
				var qtyToPick = requestParams.qtyToPick;
				var transactionUnitInternalId = requestParams.transactionUnitInternalId;
				var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;
				var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId)&&  utility.isValueValid(itemType))
				{
					var isInvStatusFeatureEnabled  = utility.isInvStatusFeatureEnabled();
					var stockunitText = '';
					var uomResult = [];
					var objBinDetails=[];
					var allowAllLots = 'T';
					var pickBinDetails = {};
					var binInternalIdArr = [];
					var binId = '';
					var quantity ='';
					var itemStatus = '';
					var binQty ='';
					var itemDetails =utility.getItemDetails(itemInternalId);
					log.debug({title:'itemDetails',details:itemDetails});
					if(itemDetails.length>0)
					{

						for(var itemItr=0;itemItr<itemDetails.length;itemItr++)
						{
							if(itemDetails[itemItr]['preferredbin']==true && itemDetails[itemItr]['location'] == warehouseLocationId)
							{
								preferedBinInternalId = itemDetails[itemItr]['binnumber'];
							}
						}

						itemGroup = itemDetails[0]['custitem_wmsse_itemgroup'];
						itemFamily = itemDetails[0]['custitem_wmsse_itemfamily'];
						stockunitText=itemDetails[0]['stockunitText'];
						itemStockunit =itemDetails[0]['stockunit']; 
						unitType  = itemDetails[0]['unitstype'];



						if(utility.isValueValid(unitType))
						{	
							uomResult= utility.getUnitsType(unitType);
						}
						if(utility.isValueValid(unitType))
						{
							stockConversionRate = utility.getConversionRate(stockunitText,unitType);
						}
						if(utility.isValueValid(requestParams.uomList))
						{
							var selectedUomList = requestParams.uomList;
							selectedConversionRate = selectedUomList.id;
							selectedUOMText = selectedUomList.value;
							transactionUomName = selectedUOMText;
						}
						pickBinDetails['itemName']=itemName;
						pickBinDetails['itemInternalId']=itemInternalId;
						pickBinDetails['strItemGrp']=itemGroup;
						pickBinDetails['strItemFamily']=itemFamily;
						pickBinDetails['preferBinId']=preferedBinInternalId;
						pickBinDetails['whLocationId']=warehouseLocationId;
						pickBinDetails['department']=department;
						pickBinDetails['classes']=classes;
						pickBinDetails['itemType']=itemType;
						pickBinDetails['unitType']=unitType;
						pickBinDetails['blnItemUnit']=itemStockunit;
						pickBinDetails['selectedConversionRate']=selectedConversionRate;
						pickBinDetails['currentConversionRate']=stockConversionRate;
						pickBinDetails['makeInvAvailFlagFromSelect']=selectedStatusId;
						pickBinDetails['allowAllLots']=allowAllLots;
						
						log.debug({title:'pickBinDetails',details:pickBinDetails});
						var itemObjDtl = {};

						itemObjDtl['itemInternalId'] = itemInternalId;
						itemObjDtl['location'] = warehouseLocationId;
						itemObjDtl['qtyToPick'] = qtyToPick;
						itemObjDtl.inventoryNumberId = inventoryDetailLotOrSerialId;

						if(utility.isValueValid(unitType)){
							var uomObj = woUtility.getUomDetails(unitType, transactionUomName);
							if(utility.isValueValid(uomObj)){
								transactionUnitInternalId = uomObj.UomInternalId;
							}
						}

						if(utility.isValueValid(transactionUnitInternalId)){
							itemObjDtl['selectedUnitId'] = transactionUnitInternalId;
						}

						//objBinDetails=woUtility.getWOPickBinDetails(pickBinDetails);
						objBinDetails=utility.getRecommendedBins(itemObjDtl , 'workorder');
						log.debug({title:'objBinDetails',details:objBinDetails});				

						if(objBinDetails.length > 0)
						{	
							var uomList = [];
							if(uomResult.length>0)
							{

								for(var uomCnt in uomResult)
								{  
									var rec = uomResult[uomCnt];
									var conversionRate = rec['conversionrate'];
									var unitName =rec['unitname'];
									var row = {'value':unitName,'id':conversionRate};
									uomList.push(row);
								}

								binListDetails['uomList'] = uomList;
								binListDetails['uomDefaultStatus'] = transactionUomName;

							}
							if(isInvStatusFeatureEnabled)
							{
								var statusList = utility.getInventoryStatusOptions();
								if(statusList.length > 0 )
								{
									binListDetails['inventoryOptionsList'] = statusList;
								}
							}

							for(var s=0;s<objBinDetails.length;s++)
							{
								binInternalIdArr.push(objBinDetails[s]['bininternalid']);
							}
							log.debug({title:'binInternalIdArr',details:binInternalIdArr});
							var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, binInternalIdArr, warehouseLocationId,'',
				                '','','',itemType,inventoryDetailLotOrSerialText);
							log.debug({title:'openTaskPickBinDtls',details:openTaskPickBinDtls});	
							for(var s=0;s<openTaskPickBinDtls.length;s++)
							{
								binId = openTaskPickBinDtls[s]['custrecord_wmsse_actendloc'];
								quantity = openTaskPickBinDtls[s]['actualQuantityInBaseUnits'];
								for(var i=0;i<objBinDetails.length;i++)
								{
									if(objBinDetails[i]['bininternalid'] == binId  ){
										if(isInvStatusFeatureEnabled){
											itemStatus = openTaskPickBinDtls[s]['custrecord_wmsse_inventorystatusText'];
											if (objBinDetails[i]['status'] == itemStatus){ 
												binQty = objBinDetails[i]['availableqty'];
												log.debug({title:'binQty :',details:binQty});
												if(utility.isValueValid(selectedConversionRate))  
													quantity = utility.uomConversions(quantity,selectedConversionRate,1);
												quantity = new Big(quantity);
												objBinDetails[i]['availableqty'] = (new Big(binQty)).minus(quantity)  ;
												if(objBinDetails[i]['availableqty'] <= 0){
													objBinDetails.splice(i,1);
													i--;
												}
											}
										}else{
											binQty = objBinDetails[i]['availableqty'];
											if(utility.isValueValid(selectedConversionRate))  
												quantity = utility.uomConversions(quantity,selectedConversionRate,1);
											quantity = new Big(quantity);
											objBinDetails[i]['availableqty'] = (new Big(binQty)).minus(quantity)  ;
											if(objBinDetails[i]['availableqty'] <= 0){
												objBinDetails.splice(i,1);
												i--;
											}

										}

									}
								}

							}

							binListDetails['binList'] = objBinDetails;
							binListDetails["isValid"]=true;
						}
						else
						{
							binListDetails["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.INSUFFICIENTINVENTORY");
							binListDetails["isValid"]=false;

						}

					}
					else
					{
						binListDetails["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.INACTIVE_ITEM");
						binListDetails["isValid"]=false;
					}
				}
				else
				{
					binListDetails["isValid"]=false;	
				}
			}else{
				binListDetails['isValid']=false;
			}

		}catch(e){
			binListDetails['isValid'] = false;
			binListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug('binListDetails--',binListDetails);
		return binListDetails;
	}


	return{
		'post' : doPost
	}
});