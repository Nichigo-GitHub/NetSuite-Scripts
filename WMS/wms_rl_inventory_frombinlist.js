/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','N/config','./wms_inventory_utility'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,config,invtUtility) {

	/**
	 * Function to fetch  bin locations based on pickstratagies
	 */
	function doPost(requestBody) {

		var binListArr = {};
		var debugString = '';
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var itemType = requestParams.itemType;
				var loadConfig = config.load({
					type: config.Type.USER_PREFERENCES
				});
				var department = loadConfig.getValue({fieldId: 'departments'});
				var classes = loadConfig.getValue({fieldId: 'classes'});
				var unitType = requestParams.unitType;	
				var itemGroup = requestParams.itemGroup;	
				var itemFamily = requestParams.itemFamily;	
				var preferedBinInternalId = requestParams.preferedBinInternalId;
				var stockConversionRate = requestParams.stockConversionRate;
				var processType = requestParams.processType;	
				var selectedConversionRate = '' ;
				var selectedUOMText ='';
				var selectedStatusId =requestParams.selectedStatusId;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var qtyToPick = requestParams.qtyToPick;
				var selectedUnit = requestParams.stockUnitName;
				if(utility.isValueValid(requestParams.uomList))
				{
					var selectedUomList = requestParams.uomList;
					selectedConversionRate = selectedUomList.id;
					selectedUOMText = selectedUomList.value;
				}
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) &&  utility.isValueValid(itemType))
				{


					var stockunitText = '';
					var uomResult = [];

					if(utility.isValueValid(unitType))
					{	
						uomResult= utility.getUnitsType(unitType);
					}


					var itemDetails =utility.getItemDetails(itemInternalId);
					debugString = debugString + "itemDetails :"+itemDetails;
					log.debug({title:'itemDetails',details:itemDetails});
					if(itemDetails !=null && itemDetails.length>0)
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


					}

					var objBinDetails=[];
					var allowAllLots = 'T';
					var pickBinDetails = {}; 

					debugString = debugString + "preferedBinInternalId :"+preferedBinInternalId;
					debugString = debugString + "itemType :"+itemType;

					pickBinDetails['itemInternalId']=itemInternalId;
					pickBinDetails['strItemGrp']=itemGroup;
					pickBinDetails['strItemFamily']=itemFamily;
					pickBinDetails['preferBinId']=preferedBinInternalId;
					pickBinDetails['whLocationId']=warehouseLocationId;
					pickBinDetails['department']=department;
					pickBinDetails['classes']=classes;
					pickBinDetails['itemType']=itemType;
					pickBinDetails['unitType']=unitType;
					pickBinDetails['blnItemUnit']=stockConversionRate;
					pickBinDetails['selectedConversionRate']=selectedConversionRate;
					pickBinDetails['currentConversionRate']=stockConversionRate;
					pickBinDetails['makeInvAvailFlagFromSelect']=selectedStatusId;
					pickBinDetails['allowAllLots']=allowAllLots;
					pickBinDetails['location']=warehouseLocationId;
					pickBinDetails['qtyToPick']= qtyToPick;
					if(processType == 'replen')
						pickBinDetails['boolinclIBStageInvFlag']='false';

					if(processType == 'BinTransfer' || processType == 'invtransfer' || processType == 'inventoryStatusChange')
					{						
						objBinDetails = invtUtility.getBinDetailsForItem(pickBinDetails,processType);
					}
					else if(processType == 'replen' ){
						
						var selectedUnitId = '';
						
						 var uomResultsObj = utility.getUomValues(unitType, selectedUnit);
						 if(utility.isValueValid(uomResultsObj) && utility.isValueValid(uomResultsObj['uomValue']))
						 {
						 	selectedUnitId = uomResultsObj['uomValue']
						 }
						
						pickBinDetails['selectedUnitId']= selectedUnitId;
						
						var	objTotalBinDetails=utility.getRecommendedBins(pickBinDetails,processType);

						for(var binCnt in objTotalBinDetails){
							if(objTotalBinDetails[binCnt].isPreferredBin == false){
								objBinDetails.push(objTotalBinDetails[binCnt]);
							}
						}

					}
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

							binListArr['uomList'] = uomList;
							binListArr['uomDefaultStatus'] = stockunitText;

						}

						log.debug({title:'selectedConversionRate testtts',details:selectedConversionRate});
						log.debug({title:'stockConversionRate testtts',details:stockConversionRate});

						if(utility.isValueValid(selectedConversionRate) && utility.isValueValid(transactionUomConversionRate))
						{
							for(var i=0;i<objBinDetails.length;i++)
							{

								objBinDetails[i]['availableqty'] = utility.uomConversions( objBinDetails[i]['availableqty'],selectedConversionRate,transactionUomConversionRate);
								log.debug({title:'after  calc ', details:objBinDetails[i]['availableqty']});
							}
						}

					var isInvStatusFeatureEnabled  = utility.isInvStatusFeatureEnabled();
						if(isInvStatusFeatureEnabled && processType != 'replen')
						{
							var statusList = utility.getInventoryStatusOptions();
							if(statusList.length > 0 )
							{
								binListArr['inventoryOptionsList'] = statusList;
							}
						}

						binListArr['binList'] = objBinDetails;
						binListArr["isValid"]=true;
					}
					else
					{
						binListArr["errorMessage"] = translator.getTranslationString("BINTRANSFER_LOTVALIDATE.FROMBINLIST.INSUFFICIENTINVENTORY");
						binListArr["isValid"]=false;

					}
				}
				else
				{
					binListArr["isValid"]=false;	
				}
			}
			else
			{
				binListArr["isValid"]=false;	
			}
			log.debug({title:'binListArr',details:binListArr});
		}
		catch(e)
		{
			binListArr['isValid'] = false;
			binListArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return binListArr;
	}


	return {
		'post': doPost
	};

});
