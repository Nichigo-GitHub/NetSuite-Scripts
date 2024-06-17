/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_outBoundUtility', './wms_translator'],

		function(utility,obUtility, translator) {

	/**
	 * Function to fetch orders 
	 */
	function doPost(requestBody) {

		var orderListDetails = {};
		var debugString = '';
		var requestParams = '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionType = requestParams.transactionType;
                var pickingMode = requestParams.pickingMode;

				if(utility.isValueValid(warehouseLocationId))
				{
					var ordersListArray=[];
					var ordersInputObj = {}; 

					ordersInputObj['whLocationId']=warehouseLocationId;
					ordersInputObj['transactionType']=transactionType;
                    if(!utility.isValueValid(pickingMode) || pickingMode=='orderpicking') {
                        ordersListArray = obUtility.getCommittedOrderList(ordersInputObj);
                    }

					log.debug({title:'ordersListArray',details:ordersListArray});				

					if(ordersListArray.length > 0){
						orderListDetails['committedOrderList'] = ordersListArray;
						orderListDetails["isValid"]=true;
					}
					else{
						orderListDetails["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOORDERSTOSHOW");
						orderListDetails["isValid"]=false;
					}
				}
				else
				{
					orderListDetails["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOORDERSTOSHOW");
					orderListDetails["isValid"]=false;	
				}
			}
			else
			{
				orderListDetails["isValid"]=false;	
			}
			log.debug({title:'orderListDetails :',details:orderListDetails});
		}
		catch(e)
		{
			orderListDetails['isValid'] = false;
			orderListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return orderListDetails;
	}

	return {
		'post': doPost
	};
});
