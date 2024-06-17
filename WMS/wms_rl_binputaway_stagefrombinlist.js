/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./big','./wms_translator', './wms_inboundUtility'],
		/**
		 * @param {search} search
		 */
		function (search, utility,big,translator, inboundUtility) {

	function doPost(requestBody) {

		var warehouseLocationId = '';
		var itemInternalId = '';
		var stageInventoryDetails = {};
		var requestParams = '';
        var processType = '';
		
		try{
			log.debug({title:'requestBody',details:requestBody});	
			if (utility.isValueValid(requestBody)) {	
				requestParams= requestBody.params;
				warehouseLocationId = requestParams.warehouseLocationId;
				itemInternalId = requestParams.itemInternalId;
				processType = requestParams.processType;

				if ((utility.isValueValid(warehouseLocationId)) && (utility.isValueValid(itemInternalId))) {

					var getStageBinResults = inboundUtility.getInboundStageBinDetails(warehouseLocationId,processType);
					if(getStageBinResults.length>0)
					{
						var inventoryStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
						var binLocIdArr =[];
						for(var binItr in getStageBinResults)
						{
							var inbStageBinId=getStageBinResults[binItr].internalid;					
							if(utility.isValueValid(inbStageBinId) && binLocIdArr.indexOf(inbStageBinId) == -1)
								binLocIdArr.push(inbStageBinId);
						}
						log.debug({title:'binLocIdArr',details:binLocIdArr});

						var binPutawayRecords = [];	
						if(inventoryStatusFeatureEnabled){
							binPutawayRecords = utility.getItemWiseStatusDetailsInBin(binLocIdArr,warehouseLocationId,itemInternalId);
						}
						else{
							binPutawayRecords = inboundUtility.getInventoryDetailsforItem(binLocIdArr,warehouseLocationId,itemInternalId);	

						}
						log.debug({title:'inventoryStatusFeatureEnabled',details:inventoryStatusFeatureEnabled});
						log.debug({title:'binPutawayRecords',details:binPutawayRecords});
						if(binPutawayRecords.length > 0){
							var vmakeInvAvailFlag = true;
							var itemName='';
							var unitsType = '';
							var stockUnitInternalId = '';
							var stockUnitName ='';
							var objBinDetailsRec = [];
							var totalBinAvailQty = 0;
							var statusName = '';
							var itemType = '';
							var stageBinList = [];
							var vLocDetails = search.lookupFields({
								type: search.Type.LOCATION,
								id: warehouseLocationId,
								columns: ['makeinventoryavailable']
							});
							vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;

							var itemresults = inboundUtility.getItemSearchDetails(itemInternalId,warehouseLocationId);
							if (itemresults.length > 0) {
								var itemResultObj = itemresults[0];							
								itemName = itemResultObj.itemid;
								unitsType = itemResultObj.unitstype;
								stockUnitInternalId =itemResultObj.stockunit;
								stockUnitName = itemResultObj.stockunitText;
								itemType = itemResultObj.recordType;
							}						
							log.debug({title:'itemType',details:itemType});	
							var objItemDetails = {};
							for (var bindetail in binPutawayRecords) {
								 objItemDetails = {};
								objBinDetailsRec = binPutawayRecords[bindetail];
								if(inventoryStatusFeatureEnabled)
								{
									if(utility.isValueValid(objBinDetailsRec.statusText))
										statusName = objBinDetailsRec.statusText;

									if(vmakeInvAvailFlag)
										totalBinAvailQty = objBinDetailsRec.available;
									else 
										totalBinAvailQty = objBinDetailsRec.onhand;
								}
								else
								{
									if(vmakeInvAvailFlag)
										totalBinAvailQty = objBinDetailsRec.quantityavailable;
									else 
										totalBinAvailQty = objBinDetailsRec.quantityonhand;
								}

								log.debug({title:'totalBinAvailQty',details:totalBinAvailQty});
								if(totalBinAvailQty > 0)
								{					

									if(itemType == "inventoryitem" || itemType=="assemblyitem" || 
											itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")	{
										
											objItemDetails.itemName = itemName;
											objItemDetails.availbleQuanityWithUOM = totalBinAvailQty +" "+stockUnitName;
											objItemDetails.availbleQuanity = totalBinAvailQty;
											objItemDetails.binName = objBinDetailsRec.binnumberText;
											objItemDetails.itemInternalId = itemInternalId;
											objItemDetails.statusName = statusName;
											stageBinList[stageBinList.length]=objItemDetails;
										
									}
									else if(itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem")	{
								
											objItemDetails.itemName = itemName;
											objItemDetails.availbleQuanityWithUOM = totalBinAvailQty +" "+stockUnitName;
											objItemDetails.availbleQuanity = totalBinAvailQty;										
											objItemDetails.binName = objBinDetailsRec.binnumberText;
											objItemDetails.itemInternalId = itemInternalId;
											objItemDetails.statusName = statusName;
											stageBinList[stageBinList.length]=objItemDetails;
										
									}
									else{}
								}
							}
							stageInventoryDetails.stageInventoryDetails = stageBinList;
							stageInventoryDetails.isValid = true;
						}
						else
						{
							stageInventoryDetails.errorMessage = translator.getTranslationString('BINPUTW_STAGELIST.NO_INVENTORY');
							stageInventoryDetails.isValid = false;
						}
					}
					else
					{
						stageInventoryDetails.errorMessage = translator.getTranslationString('BINPUTW_STAGELIST.NO_STAGEBINS');
						stageInventoryDetails.isValid = false;
					}
				}
				else {
					stageInventoryDetails.errorMessage = translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
					stageInventoryDetails.isValid = false;
				}
			}
			else {
				stageInventoryDetails.errorMessage = translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
				stageInventoryDetails.isValid = false;
			}
		}
		catch(e){
			stageInventoryDetails.isValid = false;
			stageInventoryDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		log.debug({title:'stageInventoryDetails',details:stageInventoryDetails});
		return stageInventoryDetails;
	}
	return {
		'post': doPost
	};
});