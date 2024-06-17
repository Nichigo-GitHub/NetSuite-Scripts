/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_translator', './wms_reversePicks_utility'],

		function(utility, translator, revPicksUtility) {

	/**
	 * Function to fetch orders 
	 */
	function doPost(requestBody) {

		var pickTaskLines 	= {};
		var debugString 	= '';
		var requestParams 	= '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});
				
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionType 	= requestParams.transactionType;
				var transactionNumber 	= requestParams.transactionNumber;
				var transaction 		= requestParams.transaction;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionNumber))
				{
					var pickTaskLinesArray	= [];
					var orderInputObj 		= {}; 

					orderInputObj.whLocationId	  		= warehouseLocationId;
					orderInputObj.transactionType  		= transactionType;
					orderInputObj.transactionNumber  	= transactionNumber;
					orderInputObj.transaction			= transaction;

					pickTaskLinesArray = revPicksUtility.getPickTaskLines(orderInputObj);
					log.debug({title:'pickTaskLinesArray :',details:pickTaskLinesArray});				

					if(pickTaskLinesArray.length > 0){
						pickTaskLines.picktaskLineItems = pickTaskLinesArray;
						pickTaskLines.isValid			= true;
					}
					else{
						pickTaskLines.errorMessage 	= translator.getTranslationString("REVERSE_PICKS.NO_PICKACTION_LINES");
						pickTaskLines.isValid		= false;
					}
				}
				else
				{
					pickTaskLines.errorMessage 	= translator.getTranslationString("REVERSE_PICKS.NO_PICKACTION_LINES");
					pickTaskLines.isValid		= false;	
				}
			}
			else
			{
				pickTaskLines.isValid = false;	
			}
			log.debug({title:'pickTaskLines :',details:pickTaskLines});
		}
		catch(e)
		{
			pickTaskLines.isValid 		= false;
			pickTaskLines.errorMessage 	= e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return pickTaskLines;
	}

	return {
		'post': doPost
	};
});
