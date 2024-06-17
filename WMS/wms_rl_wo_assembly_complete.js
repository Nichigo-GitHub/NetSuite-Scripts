/**
 *    Copyright  2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_workOrderUtility'],

		function (utility,translator,woUtility) {

	function doPost(requestBody) {

		var orderDetails={};
		var debugString = '';
		var requestParams = '';		
		try{
			if(utility.isValueValid(requestBody)){

				log.debug({title:'requestBody',details:requestBody});	
				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionName = requestParams.transactionName;
				var transactionInternalId = requestParams.transactionInternalId;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionName) && utility.isValueValid(transactionInternalId))
				{	
					var workOrdDtlResults =	woUtility.getOpenTaskDetailsforAssemblycomplete(transactionInternalId,warehouseLocationId,locUseBinsFlag);

					if(workOrdDtlResults.length > 0)
					{

						for(var intItr=0; intItr< workOrdDtlResults.length; intItr++){

							if(workOrdDtlResults[intItr]['custrecord_wmsse_uom'] != '- None -'){
								workOrdDtlResults[intItr]['custrecord_wmsse_act_qty']	= 
									workOrdDtlResults[intItr]['custrecord_wmsse_act_qty']+ " " + workOrdDtlResults[intItr]['custrecord_wmsse_uom'];
							}

						}
						
						orderDetails['orderList'] = workOrdDtlResults;
						orderDetails['isValid']=true;

					}
				}
				else{
					orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
					orderDetails['isValid']=false;
				}
			}else{
				orderDetails['isValid']=false;
			}

		}catch(e){
			orderDetails['isValid'] = false;
			orderDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug('orderDetails--',orderDetails);

		return orderDetails;
	}


	return{
		'post' : doPost
	}
});