/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', './big', 'N/config', './wms_workOrderUtility','./wms_inboundUtility'],

		function (search, utility, translator, Big, config, woUtility,inboundUtility) {

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
				var assemblyItemInternalId = requestParams.assemblyItemInternalId;
				var assemblyItemType = requestParams.assemblyItemType;
				var assemblyItemName = requestParams.assemblyItemName;
				var inventoryStatusFeaturestr = requestParams.inventoryStatusFeature;
				var inventoryStatusFeature = JSON.parse(inventoryStatusFeaturestr);

				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var selectedConversionRate = requestParams.transactionUomConversionRate ;
				var selectedStatusId = requestParams.selectedStatusId;
				var transactionUomName = requestParams.transactionUomName;
				var lotName = requestParams.lotName;

				var stockunitText ='';
				var preferedBinInternalId ='';
				var preferedBinName = '';
				var unitType='';
				var stockConversionRate ='';
				var selectedUOMText = '';
				var uomResult = [];
				var binList = [];
				var allowAllLots = 'T';
				var pickBinDetails = {};

				var loadConfig = config.load({
					type: config.Type.USER_PREFERENCES
				});
				var department = loadConfig.getValue({fieldId: 'departments'});
				var classes = loadConfig.getValue({fieldId: 'classes'});

				var assemblyItemDetails = utility.getItemDetails(assemblyItemInternalId);

				if(assemblyItemDetails.length>0)
				{
					for(var itemItr=0;itemItr<assemblyItemDetails.length;itemItr++)
					{
						if(assemblyItemDetails[itemItr]['preferredbin']==true && assemblyItemDetails[itemItr]['location'] == warehouseLocationId)
						{
							preferedBinName = assemblyItemDetails[itemItr]['binnumber'];
							preferedBinInternalId = utility.getBinInternalId(preferedBinName, warehouseLocationId);
							break;
						}
					}
					var abcVelocityResults = inboundUtility.getItemABCVelocityDetails(assemblyItemInternalId,warehouseLocationId);
					if(abcVelocityResults != null && abcVelocityResults.length > 0)
					{
						for (var itemItr = 0; itemItr < abcVelocityResults.length; itemItr++) {
							var itemRec = abcVelocityResults[itemItr];
							if (itemRec['inventorylocation'] == warehouseLocationId) {
								pickBinDetails['locationinvtclassification'] = itemRec.locationinvtclassification;//ABC velocity param
								break;
							}
						}
					}
					
					unitType  = assemblyItemDetails[0]['unitstype'];
					stockunitText=assemblyItemDetails[0]['stockunitText'];

					if(utility.isValueValid(unitType))
					{	
						uomResult= utility.getUnitsType(unitType);
						stockConversionRate = utility.getConversionRate(stockunitText,unitType);
					}
					if(utility.isValueValid(requestParams.uomList))
					{
						var selectedUomList = requestParams.uomList;
						selectedConversionRate = selectedUomList.id;
						selectedUOMText = selectedUomList.value;
					}
					
					var uomList = [];
					if(uomResult.length>0)
					{
						log.debug({title:'uomResult.length',details:uomResult.length});
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
					
					pickBinDetails['itemName'] = assemblyItemName;
					pickBinDetails['itemInternalId'] = assemblyItemInternalId;
					pickBinDetails['itemGroup'] = assemblyItemDetails[0]['custitem_wmsse_itemgroup'];
					pickBinDetails['itemFamily'] = assemblyItemDetails[0]['custitem_wmsse_itemfamily'];
					pickBinDetails['preferedBinName'] = preferedBinName;
					pickBinDetails['warehouseLocationId'] = warehouseLocationId;
					pickBinDetails['department'] = department;
					pickBinDetails['class'] = classes;
					pickBinDetails['itemType'] = assemblyItemType;
					pickBinDetails['unitType'] = unitType;
					pickBinDetails['transcationUomInternalId'] = assemblyItemDetails[0]['stockunit'];
					pickBinDetails['selectedConversionRate'] = selectedConversionRate;
					pickBinDetails['currentConversionRate'] = stockConversionRate;
					pickBinDetails['makeInvAvailFlagFromSelect'] = selectedStatusId;
					pickBinDetails['allowAllLots'] = allowAllLots;
					pickBinDetails['blnMixItem'] = assemblyItemDetails[0]['custitem_wmsse_mix_item'];
					pickBinDetails['blnMixLot'] = assemblyItemDetails[0]['custitem_wmsse_mix_lot'];
					pickBinDetails['lotName'] = lotName;
					pickBinDetails['preferedBinInternalId'] = preferedBinInternalId;
					pickBinDetails['inventoryStatusFeature'] = inventoryStatusFeature;
					//pickBinDetails['vClissification'] = assemblyItemDetails[0]['locationinvtclassification'];

					binList = utility.getPutBinAndIntDetails(pickBinDetails);
					log.debug({title:'binList',details:binList});				
					binListDetails['binList'] = binList
				}
				else
				{
					binListDetails["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.INACTIVE_ITEM");
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
		log.debug('binListDetails',binListDetails);
		return binListDetails;
	}

	return{
		'post' : doPost
	}
});