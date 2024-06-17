/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/runtime','./wms_utility', './wms_translator','./wms_outBoundUtility'],
		/**
		 * @param {search} search
		 */
		function (search, runtime,utility,translator,obUtility) {


	function doPost(requestBody) {
		var requestParams = '';
		var response = {};
		log.debug({title:'requestBody',details:requestBody});
		var debugString = '';
		var waveName = '';
		var warehouseLocationId = '';
		var containerEnabled = '';
		var stageBinInternalId = '';
		var waveId = '';
		var isZonePickingEnabled = '';
        var transactiontype = '';
		try{
			if(utility.isValueValid(requestBody))
			{
				requestParams = requestBody.params;
				whLocation = requestParams.warehouseLocationId;
				waveName = requestParams.waveName;
				stageBinInternalId = requestParams.stageBinInternalId;
				isZonePickingEnabled   = requestParams.isZonePickingEnabled;
                transactiontype = requestParams.transactiontype;
				isZonePickingEnabled = isZonePickingEnabled || false;
				log.debug({title:'requestParams List :' , details:requestParams});
				
				var getWaveInternalId = obUtility.getWaveInternalId(waveName,whLocation);
				if(getWaveInternalId.length > 0){
					waveId = getWaveInternalId[0]['internalid'];
				}
				//var systemRule = translator.getTranslationString("MULTIORDER_CONTAINERLIST.SYSTEMRULE");
				var systemRule = "Use cartons for multi-order picking?";
				//var containerEnabled = utility.getSystemRuleValue(systemRule,whLocation);

                var containerEnabled = utility.getSystemRuleValueWithProcessType(systemRule,whLocation,transactiontype);
				
				log.debug({title:'Container Enabled System Rule :', details:containerEnabled});
				
				var containerList = obUtility.getMultiOrderStageItemList(whLocation,waveId,stageBinInternalId,containerEnabled,isZonePickingEnabled);
				
				log.debug({title:'Stage Item List :' , details:containerList});
				
				var pendingPickTaksRes = getPendingPickTasks(waveId);

				if(pendingPickTaksRes.length > 0){
					response['isPendingPickTaks'] = 'Y';
				}
				else{
					response['isPendingPickTaks'] = 'N';
				}
				
				response['containerList'] = containerList;
				response['isValid'] = true;
			}
		}catch(e){
			response['isValid'] = false;
			response['errorMessage'] = e.message;
		}
		return response;
	}
	
	function getPendingPickTasks(waveId){

		var pendingPickTasks = search.load({
			id : 'customsearch_wms_pending_pick_tasks'
		});
		if(utility.isValueValid(waveId))
			pendingPickTasks.filters.push(search.createFilter({
				name : 'wavename',
				operator : search.Operator.ANYOF,
				values : waveId
			}));
		return utility.getSearchResultInJSON(pendingPickTasks);
	}


	return {
		'post': doPost

	};
});