/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator', './wms_workOrderUtility','./big','./wms_outBoundUtility'],
		/**
		 * @param {search} search
		 */
		function(utility,translator,woUtility,Big,obUtility) {

	/**
	 * Function to fetch  bin locations based on pickstratagies
	 */
	function doPost(requestBody) {

		var lotListDetailsArr = {};
		var debugString = '';
		var processType = '';
		try{

			var requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var fromBinInternalId = requestParams.fromBinInternalId;
				var uomListObj = requestParams.uomListObj;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var transactionUomName = requestParams.transactionUomName;
				var selectedConversionRate = '';
				var selectedUOMText = '';
				var isUomEnabled = false;
				var stockUomConversionRate = requestParams.stockUomConversionRate;
				processType = requestParams.processType;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;

				log.debug({title:'requestParams',details:requestParams});
				if(utility.isValueValid(requestParams.uomListObj))
				{
					isUomEnabled = true;
				}
				if(utility.isValueValid(requestParams.uomList))
				{
					var selectedUomList = requestParams.uomList;
					selectedConversionRate = selectedUomList.id;
					selectedUOMText = selectedUomList.value;
				}

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) && 
						(utility.isValueValid(fromBinInternalId)|| locUseBinsFlag == false))
				{
					var lotListDetails=[];
					var lotDetails = {}; 
					lotDetails['warehouseLocationId']=warehouseLocationId;
					lotDetails['itemInternalId']=itemInternalId;
					lotDetails['fromBinInternalId']=fromBinInternalId;	
					lotDetails.lotInternalId = inventoryDetailLotOrSerialId;
                     
					lotListDetails=obUtility.getPickingLotDetails(lotDetails);
					log.debug({title:'lotListDetails :', details:lotListDetails});

					if(lotListDetails.length > 0)
					{
						log.debug({title:'isUomEnabled',details:isUomEnabled});

						var openTaskPickBinDtls = woUtility.getOPenTaskPickBinDetails(itemInternalId, fromBinInternalId, warehouseLocationId);
						log.debug({title:'openTaskPickBinDtls',details:openTaskPickBinDtls});	
						var is_InvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
						if(isUomEnabled)
						{
							lotListDetailsArr['uomList'] = uomListObj;
							lotListDetailsArr['uomDefaultStatus'] = transactionUomName;

							if(!utility.isValueValid(transactionUomConversionRate)){
								transactionUomConversionRate = '';
							}
							if(!utility.isValueValid(selectedConversionRate)){
								selectedConversionRate = '';
							}
							
							getLotListforUomEnabled(lotListDetails,openTaskPickBinDtls,transactionUomConversionRate,
									selectedConversionRate,stockUomConversionRate,is_InvStatusFeatureEnabled);									
							
						}
						else
						{
							getLotList(lotListDetails,openTaskPickBinDtls,is_InvStatusFeatureEnabled);			
													
						}
						log.debug('lotListDetails',lotListDetails);
						lotListDetailsArr['lotList'] = lotListDetails;
						lotListDetailsArr["isValid"]=true;
					}
					else
					{
						lotListDetailsArr["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOLOTLISTTOSHOW");
						lotListDetailsArr["isValid"]=false;
					}
				}
				else
				{
					lotListDetailsArr["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOLOTLISTTOSHOW");
					lotListDetailsArr["isValid"]=false;	
				}
			}
			else
			{
				lotListDetailsArr["isValid"]=false;	
			}
		}
		catch(e)
		{
			lotListDetailsArr['isValid'] = false;
			lotListDetailsArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return lotListDetailsArr;
	}
	
	
	function getLotListforUomEnabled(lotListDetails,openTaskPickBinDtls,transactionUomConversionRate,
			selectedConversionRate,stockUomConversionRate,is_InvStatusFeatureEnabled)
	{
		
		for(var lotIndex=0;lotIndex<lotListDetails.length;lotIndex++){
			var qty = '';

			qty = lotListDetails[lotIndex]['available'];								

			log.debug({title:'Quantity Before Convertion to Transaction UOM ',details:qty});	

			if(selectedConversionRate != '' && qty>0 && selectedConversionRate != stockUomConversionRate)
			{
				qty = utility.uomConversions(qty,selectedConversionRate,stockUomConversionRate);
			}
			else
			{
				if(transactionUomConversionRate != '' && stockUomConversionRate!='' &&  (stockUomConversionRate != transactionUomConversionRate) && qty>0
						&& !utility.isValueValid(selectedConversionRate))
				{
					qty = utility.uomConversions(qty,transactionUomConversionRate,stockUomConversionRate);
				}	
			}
			log.debug({title:'Quantity After Convertion to Transaction UOM ',details:qty});	
			if(utility.isValueValid(openTaskPickBinDtls) && openTaskPickBinDtls.length> 0){

				for(var openTaskIndex=0;openTaskIndex<openTaskPickBinDtls.length;openTaskIndex++)
				{
					var itemStatus = '';
					var lotitemStatusText = '';
					if(is_InvStatusFeatureEnabled){
						itemStatus = openTaskPickBinDtls[openTaskIndex]['custrecord_wmsse_inventorystatusText'];
						lotitemStatusText = lotListDetails[lotIndex]['statusText'];
					}
					var quantity = openTaskPickBinDtls[openTaskIndex]['actualQuantityInBaseUnits'];
					var lotName = openTaskPickBinDtls[openTaskIndex]['custrecord_wmsse_batch_num']; 
					if(lotListDetails[lotIndex]['inventorynumberText'] == lotName){

						if(!utility.isValueValid(itemStatus) || !utility.isValueValid(lotitemStatusText))
						{	
							if(selectedConversionRate != '' && qty>0)
							{
								quantity = utility.uomConversions(quantity,selectedConversionRate,1);
							}else{
								quantity = utility.uomConversions(quantity,transactionUomConversionRate,1);
							}

							quantity = new Big(quantity);
							qty = (new Big(qty)).minus(quantity);

						}else if(utility.isValueValid(itemStatus) && utility.isValueValid(lotitemStatusText) && lotitemStatusText == itemStatus)
						{
							if(selectedConversionRate != '' && qty>0)
							{
								quantity = utility.uomConversions(quantity,selectedConversionRate,1);
							}else{
								quantity = utility.uomConversions(quantity,transactionUomConversionRate,1);
							}
							quantity = new Big(quantity);
							qty = (new Big(qty)).minus(quantity);	
						}
					}
				}
			}
			if(is_InvStatusFeatureEnabled)
			{
				if(qty>0){
					lotListDetails[lotIndex]['available'] = qty;
				}else{
					lotListDetails.splice(lotIndex,1);
					lotIndex =lotIndex-1;
				}
			}
			else
			{
				//lotListDetails[lotIndex]['quantityavailableWithUOM'] = qty + " "+selectedUOMText;
				if(qty>0){
					lotListDetails[lotIndex]['quantityavailable'] = qty;
				}else{
					lotListDetails.splice(lotIndex,1);
					lotIndex =lotIndex-1;
				}
			}
		}		
	}
	
	
	function getLotList(lotListDetails,openTaskPickBinDtls,is_InvStatusFeatureEnabled)
	{
		for(var lotIndex=0;lotIndex<lotListDetails.length;lotIndex++){

			var qty = '';			
				qty = lotListDetails[lotIndex]['available'];			

			if(utility.isValueValid(openTaskPickBinDtls) && openTaskPickBinDtls.length> 0){

				for(var openTaskIndex=0;openTaskIndex<openTaskPickBinDtls.length;openTaskIndex++)
				{
					var itemStatus = '';
					var lotitemStatusText = '';
					if(is_InvStatusFeatureEnabled){
						itemStatus = openTaskPickBinDtls[openTaskIndex]['custrecord_wmsse_inventorystatusText'];
						lotitemStatusText = lotListDetails[lotIndex]['statusText'];
					}
					var quantity = openTaskPickBinDtls[openTaskIndex]['actualQuantityInBaseUnits'];
					var lotName = openTaskPickBinDtls[openTaskIndex]['custrecord_wmsse_batch_num'];
					if(lotListDetails[lotIndex]['inventorynumberText'] == lotName){
						if(!utility.isValueValid(itemStatus) || !utility.isValueValid(lotitemStatusText))
						{
							quantity = new Big(quantity);
							qty = (new Big(qty)).minus(quantity);

						}else if(utility.isValueValid(itemStatus) && utility.isValueValid(lotitemStatusText) && lotitemStatusText == itemStatus)
						{
							quantity = new Big(quantity);
							qty = (new Big(qty)).minus(quantity);	
						}
					}
				}
			}
			if(is_InvStatusFeatureEnabled)
			{
				if(qty>0){
					lotListDetails[lotIndex]['available'] = qty;
				}else{
					lotListDetails.splice(lotIndex,1);
					lotIndex =lotIndex-1;
				}
			}
			else
			{
				//lotListDetails[lotIndex]['quantityavailableWithUOM'] = qty + " "+selectedUOMText;
				if(qty>0){
					lotListDetails[lotIndex]['quantityavailable'] = qty;
				}else{
					lotListDetails.splice(lotIndex,1);
					lotIndex =lotIndex-1;
				}
			}								

		}
	}
	return {
		'post': doPost
	};
});
