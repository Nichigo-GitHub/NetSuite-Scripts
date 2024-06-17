/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_reversePicks_utility','N/record','N/config'],

		function(utility,translator,revPicksUtility,record,config) {

	/**
	 * Function to validate order
	 */
	function doPost(requestBody) {

		var pickTaskLineValidateObj = {};
		var debugString 		= '';
		var requestParams 		= '';
		var itemFulfillmentStatus = '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});

				var orderNumber 		= requestParams.orderNumber;
				var transactionType     = requestParams.transactionType;
				var itemId				= requestParams.itemId;
				var pickTaskId			= requestParams.pickTaskId;		
				var pickTaskLineStatus  = requestParams.pickTaskLineStatus;
				var kitItemLineNumber	= requestParams.kitItemLineNumber;
				var subItemOf			= requestParams.subItemOf;
				var pickTaskLineNumber 	= requestParams.pickTaskLineNumber;
				var itemName			= requestParams.itemName;
				var orderId				= requestParams.orderId;
				var itemDescription		= requestParams.itemDescription;
				var locUseBinsFlag		= requestParams.locUseBinsFlag;
				var reversedQuantity	= requestParams.reversedQuantity;
				var itemFulfillmentId   = requestParams.lineitemtransactionnumber;
				var lineitemtransactionnumberText   = requestParams.lineitemtransactionnumberText;
				var columnArray = [];
				var itemLookUp  = utility.getItemFieldsByLookup(itemId,columnArray);

				if(itemLookUp.thumbnailurl != undefined)
				{
					pickTaskLineValidateObj.itemImageUrl = itemLookUp.thumbnailurl;
				}

				if(transactionType=='SalesOrder'){
					pickTaskLineValidateObj.infoSalesOrder = orderNumber;
				}
				else if(transactionType=='TransferOrder'){
					pickTaskLineValidateObj.infoTransferOrder = orderNumber;
				}

				pickTaskLineValidateObj.isItemDescExist = false;
				if(utility.isValueValid(itemDescription)){
					pickTaskLineValidateObj.isItemDescExist = true;
					pickTaskLineValidateObj.itemDescription = itemDescription;
				}

				var pickTaskInputObj = {};
				var pickBinArr 		 = [];
				var pickingBin 		 = '';
				pickTaskInputObj.pickTaskId = pickTaskId;
				pickTaskInputObj.orderId    = orderId;
				pickTaskInputObj.pickTaskLineNumber = pickTaskLineNumber;

				if(locUseBinsFlag){
					var pickTaskinvDetails = revPicksUtility.getPickTaskInvDetails(pickTaskInputObj);
					var pickTaskInvDtlsLength = pickTaskinvDetails.length;

					for(var invItr=0; invItr < pickTaskInvDtlsLength; invItr++){
						if(pickBinArr.indexOf(pickTaskinvDetails[invItr].binnumberText)==-1){
							pickBinArr.push(pickTaskinvDetails[invItr].binnumberText);							
							if(invItr==((pickTaskinvDetails.length)-1))
							{
								pickingBin = pickingBin + pickTaskinvDetails[invItr].binnumberText;
							}
							else{
								pickingBin = pickingBin + pickTaskinvDetails[invItr].binnumberText + ',';
							}
						}
					}
				}
				if(utility.isValueValid(subItemOf) && utility.isValueValid(kitItemLineNumber)){
					pickTaskLineValidateObj.isKitMessageDisplay = true; 
					pickTaskLineValidateObj.KitMessage 			= translator.getTranslationString("REVERSE_PICKS.KIT_SELECTION_MESSAGE");
				}
				IFPerOrderValue = utility.getIFPerOrder();
				log.debug('IFPerOrderValue', IFPerOrderValue);

				if(utility.isValueValid(IFPerOrderValue))
				{
					if (IFPerOrderValue == 'PERORDER') {
						if(utility.isValueValid(itemFulfillmentId)) {
							var perOrderpickTaskDetails = revPicksUtility.getAllPickTaskwithsameIF(itemFulfillmentId);
							var messageParams = [];
							if (perOrderpickTaskDetails.length > 1) {
								messageParams.push(lineitemtransactionnumberText);

								pickTaskLineValidateObj.isPerOrderDisplay = true;
								pickTaskLineValidateObj.PerOrderMessage = translator.getTranslationString("REVERSE_PICKS.PERORDER_SELECTION_MESSAGE",messageParams);
							}
						}
					}
				}


				if(utility.isValueValid(itemFulfillmentId)) {
					var itemFulfillmentRec = record.load({
						type: 'itemfulfillment',
						id: itemFulfillmentId
					});

					itemFulfillmentStatus = itemFulfillmentRec.getValue({
						fieldId: 'statusRef'
					});
				}

				pickTaskLineValidateObj.pickingBin 			= pickingBin;
				pickTaskLineValidateObj.orderNumber 		= orderNumber;
				pickTaskLineValidateObj.transactionType 	= transactionType;
				pickTaskLineValidateObj.pickTaskId 			= pickTaskId;
				pickTaskLineValidateObj.pickTaskLineStatus 	= pickTaskLineStatus;
				pickTaskLineValidateObj.pickTaskLineNumber 	= pickTaskLineNumber;
				pickTaskLineValidateObj.itemName			= itemName;
				pickTaskLineValidateObj.orderId				= orderId;
				pickTaskLineValidateObj.itemId				= itemId;
				pickTaskLineValidateObj.kitItemLineNumber	= kitItemLineNumber;
				pickTaskLineValidateObj.subItemOf			= subItemOf;
				pickTaskLineValidateObj.reversedQuantity	= reversedQuantity;
                pickTaskLineValidateObj.itemFulfillmentStatus	= itemFulfillmentStatus;
                if(itemFulfillmentStatus == 'shipped')
				{
					pickTaskLineValidateObj.errorMessage = translator.getTranslationString("REVERSE_PICKS.ALREADY_SHIPPED");
					pickTaskLineValidateObj.isValid	= false;
				}
                else
				{
					pickTaskLineValidateObj.isValid = true;
				}

			}
			else
			{
				pickTaskLineValidateObj.isValid = false;	
			}
			log.debug({title:'pickTaskLineValidateObj',details:pickTaskLineValidateObj});
		}
		catch(e)
		{
			pickTaskLineValidateObj.isValid 	= false;
			pickTaskLineValidateObj.errorMessage= e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return pickTaskLineValidateObj;
	}


	return {
		'post': doPost
	};
});
