/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_outBoundUtility'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,obUtility) {

	/**
	 * Function to fetch staged pick tasks
	 */
	function doPost(requestBody) {

		var stagedPickTaskDetailsArr = {};
		var debugString = '';
		  var requestParams = '';
		var waveId = '';
		
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{

				var warehouseLocationId = requestParams.wareHouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;			
				var pickTaskId = requestParams.pickTaskId;
				var stageBinInternalId = requestParams.stageBinInternalId;
				var wavename = requestParams.wavename;
                var transactiontype = requestParams.transactiontype;
				log.debug({title:'requestParams',details:requestParams});
				
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId))
				{

					var stageBinDetailsObj = {}; 
					var pickTaskDetails=[];
					if(utility.isValueValid(wavename)){
					var getWaveInternalId = obUtility.getWaveInternalId(wavename,warehouseLocationId);
					if(getWaveInternalId.length > 0){
						waveId = getWaveInternalId[0]['internalid'];
					}
					}
					stageBinDetailsObj['orderInternalId'] = transactionInternalId;							
					stageBinDetailsObj['whLocationId'] = warehouseLocationId;
					stageBinDetailsObj['pickTaskId'] = pickTaskId;
					stageBinDetailsObj['stageBinInternalId'] = stageBinInternalId;
					stageBinDetailsObj['waveName'] = waveId;
					//var systemRule = translator.getTranslationString("SINGLEORDERPICKING_CONTAINERLIST.SYSTEMRULE");
					var systemRule ="Use cartons for single-order picking?";
					//var isContainerScanRequired = utility.getSystemRuleValue(systemRule,warehouseLocationId);
                    var isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,warehouseLocationId,transactiontype);
					log.debug({title:'isContainerScanRequired',details:'isContainerScanRequired'});
					if(!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N')
					{
						isContainerScanRequired = 'N';
					}
					else
					{
						isContainerScanRequired = 'Y';
					}
					log.debug({title:'isContainerScanRequired',details:isContainerScanRequired});

					pickTaskDetails =  obUtility.getStagedPickTaskDetails(stageBinDetailsObj,isContainerScanRequired);
					log.debug({title:'pickTaskDetails',details:pickTaskDetails});				

					if(pickTaskDetails.length > 0)
					{							
						stagedPickTaskDetailsArr['orderList'] = pickTaskDetails;
						stagedPickTaskDetailsArr["isValid"]=true;
					}
					else
					{
						stagedPickTaskDetailsArr["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOORDERSTOSHOW");
						stagedPickTaskDetailsArr["isValid"]=false;
					}
				}
				else
				{
					stagedPickTaskDetailsArr["isValid"]=false;	
				}
			}
			else
			{
				stagedPickTaskDetailsArr["isValid"]=false;	
			}
			log.debug({title:'stagedPickTaskDetailsArr',details:stagedPickTaskDetailsArr});
		}
		catch(e)
		{
			stagedPickTaskDetailsArr['isValid'] = false;
			stagedPickTaskDetailsArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return stagedPickTaskDetailsArr;
	}
	return {
		'post': doPost
	};
});
