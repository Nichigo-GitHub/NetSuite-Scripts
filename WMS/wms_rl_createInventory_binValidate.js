/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','./wms_inventory_utility'],
		/**
		 * @param {search} search
		 */
		function (search,utility,Big,translator,invtUtility) {

	/**
	 * Function to fetch bin details.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 */
	function doPost(requestBody) {
		var binArray = {};
		var binName = '';
		var scannedQuantity = '';
		var unitType = '';
		var stockConversionRate = '';
		var itemInternalId = '';
		var warehouseLocationId = '';
		var statusInternalId = '';
		var itemType = '';
		var expiryDate = '';
		var lotName = '';
		var notes = '';
		var period='';
		var requestParams = '';
    var impactedRecords = {};
		log.debug({title:'requestBody',details:requestBody});
		if (utility.isValueValid(requestBody)) 
		{
			try
			{
				requestParams = requestBody.params;
				binName = requestParams.binName;
				scannedQuantity = requestParams.scannedQuantity;
				unitType = requestParams.unitType;
				stockConversionRate = requestParams.stockConversionRate;
				itemInternalId = requestParams.itemInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				statusInternalId = requestParams.statusInternalId;
				itemType = requestParams.itemType;
				lotName = requestParams.lotName;
				expiryDate = requestParams.lotExpiryDate;
				if(utility.isValueValid(binName) && utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) && utility.isValueValid(scannedQuantity))
				{


					var binAndTypeFlag=invtUtility.getValidBinInternalIdWithLocationTypeInv(binName,warehouseLocationId,itemInternalId);

					var binInternalId = '';
					var isFlagChecked = 'F';

					if(binAndTypeFlag!=null && binAndTypeFlag!="")
					{	
						var locationType=binAndTypeFlag[0].custrecord_wmsse_bin_loc_typeText;
						if(locationType != 'WIP' && locationType != 'Stage' )
						{
							binInternalId=binAndTypeFlag[0].id;
							binName = binAndTypeFlag[0].binnumber;
							isFlagChecked = 'T';

						}
					}
					if(( binInternalId=='') && (isFlagChecked == 'F'))
					{
						binArray.errorMessage =translator.getTranslationString("CREATE_INVENTORY.NO_STAGE_WIP_BIN");
						binArray.isValid = false;
					}
					else{
						var resArray = invtUtility.getItemMixFlag(itemInternalId,binInternalId,warehouseLocationId,binName);
						log.debug({title:'resArray',details:resArray});
						var mixLot ='T'; 
						if((resArray[0].mixLotFlag == false) && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"))
						{
							var objInvDetails = [];
							objInvDetails = utility.fnGetInventoryBinsForLot(warehouseLocationId,lotName,itemInternalId,binInternalId);														
							log.debug({title:'objInvDetails',details:objInvDetails});
							if(objInvDetails.length>0)
							{
								mixLot ='F'; 
								binArray.errorMessage = translator.getTranslationString('CREATE_INVENTORY.MIX_LOT');
								binArray.isValid = false;

							}

						}

						if(resArray[0].isValid == 'F')
						{ 
							if(utility.isValueValid(resArray[0].errorMsg)){
							binArray.errorMessage = resArray[0].errorMsg ;
							binArray.isValid = false;
						}else {
							binArray.errorMessage =translator.getTranslationString("CREATE_INVENTORY.MIX_ITEM");
							binArray.isValid = false;
						}
						}
						else if(resArray[0].useBins == false)
						{
							binArray.errorMessage =translator.getTranslationString("CREATE_INVENTORY.USE_BIN");
							binArray.isValid = false;
						}
						else if((mixLot =='F') && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"))
						{

							binArray.errorMessage = translator.getTranslationString('CREATE_INVENTORY.MIX_LOT');
							binArray.isValid = false;

						}
						else{

							var accountNo = invtUtility.validateLocationForAccNo(warehouseLocationId);

							if(accountNo == ''){
								binArray.errorMessage = translator.getTranslationString("CREATE_INVENTORY.CONFIG_ACCOUNT");
								binArray.isValid = false;
							}
							else{
								var nsInvAdjObj = {};
								nsInvAdjObj.itemInternalId=itemInternalId;
								nsInvAdjObj.itemType=itemType;
								nsInvAdjObj.warehouseLocationId=warehouseLocationId;
								nsInvAdjObj.scannedQuantity=Number(Big(scannedQuantity).toFixed(8));
								nsInvAdjObj.binInternalId=binInternalId;
								nsInvAdjObj.expiryDate=expiryDate;
								nsInvAdjObj.lotName=lotName;
								nsInvAdjObj.notes=notes;
								nsInvAdjObj.date='';
								nsInvAdjObj.period=period;
								nsInvAdjObj.accountNo=accountNo;
								nsInvAdjObj.statusInternalId=statusInternalId;
								nsInvAdjObj.units=unitType ;
								nsInvAdjObj.stockConversionRate= stockConversionRate;

								var outputObj =invtUtility.invokeNSInventoryAdjustment(nsInvAdjObj);
								binArray.binInternalId = binInternalId;
								binArray.itemInternalId = itemInternalId;
								binArray.binName=binName;
								binArray.isValid = true;

								log.debug('outputObj adjInventoryId',outputObj.adjInventoryId);
								if(outputObj.adjInventoryId == '' && outputObj.errorMessage != ''){

									binArray.isValid = false;
									binArray.errorMessage = outputObj.errorMessage;

								}
								else
								{
									impactedRecords = invtUtility.noCodeSolForCreateInv(outputObj.adjInventoryId,outputObj.openTaskId);
									binArray.impactedRecords = impactedRecords;
								}

							}
						}
					}
					log.debug({title:'binArray',details:binArray});
				}
				else{
					binArray.errorMessage =translator.getTranslationString("CREATE_INVENTORY.INVALID_BIN");
					binArray.isValid = false;
				}

			}
			catch(e)
			{
				var msgstring= e.toString();
				binArray.number =0;
				binArray.errorMessage = msgstring;
				binArray.isValid = false;
			}
		}
		else{

			binArray.errorMessage =translator.getTranslationString("CREATE_INVENTORY.INVALID_BIN");
			binArray.isValid = false;
		}
		return binArray;
	}

	return{
		'post' : doPost
	}

});