/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility', './wms_tallyScan_utility','./wms_translator','./big'],
		/**
		 * @param {search} search
		 */
		function(search,utility,tallyScanUtility,translator,Big) {

	function doPost(requestBody) {

		var itemOrInvNumberDetails = {};
		var warehouseLocationId ='';
        var binInternalId ='';
		var debugString = '';

		try{

			if (utility.isValueValid(requestBody)) {

				var requestParams = requestBody.params;
				debugString  = debugString +"requestParams"+requestParams;
				log.debug({title:'requestParams',details:requestParams});

				warehouseLocationId = requestParams.warehouseLocationId;
				binInternalId =  requestParams.binInternalId;
				var scannedInvNumbersText =  requestParams.scannedInvNumbersText;

				log.debug('requestParams', requestParams);
				var invNumItemsList = [];

				if (utility.isValueValid(scannedInvNumbersText) )
				{
					invNumItemsList = tallyScanUtility.getinventoryNumberItemsList(warehouseLocationId, scannedInvNumbersText, binInternalId, '');
					itemOrInvNumberDetails.invNumWithMixItems = invNumItemsList;
                  itemOrInvNumberDetails.isValid=true;
                }
				else{
					itemOrInvNumberDetails.errorMessage = translator.getTranslationString('BINTRANSFER_QUANTITY.EMPTY_INPUT');
					itemOrInvNumberDetails.isValid= false;
				}
			}
			else{
				itemOrInvNumberDetails.errorMessage = translator.getTranslationString('BINTRANSFER_QUANTITY.EMPTY_INPUT');
				itemOrInvNumberDetails.isValid = false;
			}
		}
		catch(e)
		{
			itemOrInvNumberDetails.isValid = false;
			itemOrInvNumberDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug({title:'itemOrInvNumberDetails',details:itemOrInvNumberDetails});
		return itemOrInvNumberDetails;
	}



	return {
		'post': doPost
	};

});
