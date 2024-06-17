/**
 *  Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/runtime','./wms_inventory_utility'],
		/**
		 * @param {search} search
		 */
		function(search,utility,Big,translator,runtime,invtUtility) {

	/**
	 * This function is to validate the scanned item
	 *
	 */
	function doPost(requestBody) {

		var cycItemList = {};
		var warehouseLocationId = '';
		var cyclePlanId = '';
		var binInternalId = '';
		var showCompletedFlag = '';
		var locUseBinsFlag = '';
		var requestParams = '';
		log.debug('requestBody',requestBody);
		try{
			if (utility.isValueValid(requestBody)) {
				requestParams = requestBody.params;
				warehouseLocationId = requestParams.warehouseLocationId;
				cyclePlanId = requestParams.cyclePlanId;
				binInternalId = requestParams.binInternalId;
				showCompletedFlag = requestParams.showCompletedFlag;
				locUseBinsFlag  = requestParams.locUseBinsFlag;
				var cyclePlanItemList =	invtUtility.loadCyclePlanItemListForSeletedBin(cyclePlanId, warehouseLocationId, binInternalId,
						showCompletedFlag, locUseBinsFlag);
				if(!locUseBinsFlag){
					var outputObj = displayLogicforNobins(cyclePlanItemList);
					cyclePlanItemList = outputObj.cyclePlanItemList;
					cycItemList['planComplete'] = outputObj.planComplete ;
					cycItemList['completedTaskCount'] = outputObj.completedTaskCount;
				}
				cycItemList['itemList'] = cyclePlanItemList;
				cycItemList['isValid'] = true;
			}
			else{
				cycItemList['errorMessage'] = translator.getTranslationString('CYCCC_ITEMVALIDATE.NO_INPUT');
				cycItemList['isValid'] = false;
			}
		}
		catch(e)
		{
			cycItemList['isValid'] = false;
			cycItemList['errorMessage'] = e.message;
		}
		return cycItemList;
	}
	function displayLogicforNobins(cyclePlanItemList){
		var outputObj ={};
		var completedTaskCount= 0;
		for(var itemItr=0;itemItr<cyclePlanItemList.length;itemItr++){
			if(!(utility.isValueValid(cyclePlanItemList[itemItr].quantity))){
				cyclePlanItemList[itemItr].quantityWithUOM = '--';
			}else{
				completedTaskCount++;
			}
		}
		if( completedTaskCount == cyclePlanItemList.length){
			outputObj.planComplete = true;
		}else{
			outputObj.planComplete = false;
		}
		outputObj.cyclePlanItemList = cyclePlanItemList;
		outputObj.completedTaskCount = completedTaskCount;
		return outputObj;
	}

	return {
		'post': doPost
	};

});
