/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_reversePicks_utility'],

		function(utility,translator,revPicksUtility) {

	/**
	 * Function to validate order
	 */
	function doPost(requestBody) {

		var transactionValidateObj= {};
		var debugString   = '';
		var requestParams = '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});

				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionNumber 	= requestParams.transactionNumber;
				var transactionType 	= requestParams.transactionType;
				var action 				= requestParams.action;

				if(utility.isValueValid(action) && action=='transactionTypeSelection')
				{
					transactionValidateObj.transactionType = transactionType;
					transactionValidateObj.isValid		   = true;
					return transactionValidateObj;
				}
				else{
					if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionNumber))
					{
						var transactionDetails  = [];
						var transactionInputObj = {}; 

						transactionInputObj.transactionNumber = transactionNumber;							
						transactionInputObj.whLocationId	  = warehouseLocationId;
						transactionInputObj.transactionType	  = transactionType;

						transactionDetails = revPicksUtility.validateTransaction(transactionInputObj);
						log.debug({title:'transactionDetails', details:transactionDetails});

						if(utility.isValueValid(transactionDetails) && transactionDetails.isReversalLinesExist == true){
							transactionValidateObj.transaction 		 = transactionDetails.transaction;
							transactionValidateObj.isValid 			 = true;
							transactionValidateObj.transactionNumber = transactionNumber;
							transactionValidateObj.waveNumber 		 = transactionDetails.waveNumber;
						}else{
							if(transactionType == 'SalesOrder'){
								transactionValidateObj.errorMessage = translator.getTranslationString("REVERSE_PICKS.NO_SALES_ORDERS");
							}
							else if(transactionType == 'TransferOrder'){
								transactionValidateObj.errorMessage = translator.getTranslationString("REVERSE_PICKS.NO_TRANSFER_ORDERS");
							}
							transactionValidateObj.isValid = false;	
						}
					}
					else
					{
						if(transactionType == 'SalesOrder'){
							transactionValidateObj.errorMessage = translator.getTranslationString("REVERSE_PICKS.NO_SALES_ORDERS");
						}
						else if(transactionType == 'TransferOrder'){
							transactionValidateObj.errorMessage = translator.getTranslationString("REVERSE_PICKS.NO_TRANSFER_ORDERS");
						}
						transactionValidateObj.isValid = false;	
					}					
				}
			}
			else
			{
				transactionValidateObj.isValid=false;	
			}
			log.debug({title:'transactionValidateObj',details:transactionValidateObj});
		}
		catch(e)
		{
			transactionValidateObj.isValid = false;
			transactionValidateObj.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return transactionValidateObj;
	}


	return {
		'post': doPost
	};
});