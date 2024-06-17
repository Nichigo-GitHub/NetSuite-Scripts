/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_workOrderUtility'],
		/**
		 * @param {search} search
		 */
		function(utility,translator,utilityWO) {

	/**
	 * Function to fetch staged pick tasks
	 */
	function doPost(requestBody) {

		var stagedComponentItemDetailsArr = {};
		var debugString = '';
		var requestParams = '';

		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{

				var warehouseLocationId = requestParams.wareHouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;			
				var stageBinInternalId = requestParams.stageBinInternalId;

				log.debug({title:'requestParams',details:requestParams});

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId))
				{

					var stageBinDetailsObj = {}; 
					var stageTaskDetails=[];
					stageBinDetailsObj['orderInternalId'] = transactionInternalId;							
					stageBinDetailsObj['whLocationId'] = warehouseLocationId;
					stageBinDetailsObj['stageBinInternalId'] = stageBinInternalId;	
					log.debug({title:'stageBinDetailsObj',details:stageBinDetailsObj});	

					stageTaskDetails =  utilityWO.getStagedTaskDetails(stageBinDetailsObj);
					log.debug({title:'stageTaskDetails',details:stageTaskDetails});		

					for(var i=0; i< stageTaskDetails.length; i++){

						if(stageTaskDetails[i]['custrecord_wmsse_uom'] != '- None -'){
							stageTaskDetails[i]['custrecord_wmsse_act_qty']	= 
								stageTaskDetails[i]['custrecord_wmsse_act_qty']+ " " + stageTaskDetails[i]['custrecord_wmsse_uom'];
						}



					}

					if(stageTaskDetails.length > 0)
					{							
						stagedComponentItemDetailsArr['orderList'] = stageTaskDetails;
						stagedComponentItemDetailsArr["isValid"]=true;
					}
					else
					{
						stagedComponentItemDetailsArr["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.NO_STAGING_ITEM");
						stagedComponentItemDetailsArr["isValid"]=false;
					}
				}
				else
				{
					stagedComponentItemDetailsArr["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.NO_STAGING_ITEM");
					stagedComponentItemDetailsArr["isValid"]=false;	
				}
			}
			else
			{ stagedComponentItemDetailsArr["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.NO_STAGING_ITEM");
			stagedComponentItemDetailsArr["isValid"]=false;	
			}
			log.debug({title:'stagedComponentItemDetailsArr',details:stagedComponentItemDetailsArr});
		}
		catch(e)
		{
			stagedComponentItemDetailsArr['isValid'] = false;
			stagedComponentItemDetailsArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return stagedComponentItemDetailsArr;
	}
	return {
		'post': doPost
	};
});
