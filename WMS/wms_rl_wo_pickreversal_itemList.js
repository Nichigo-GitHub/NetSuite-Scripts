/**
 *    Copyright � 2023, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_workOrderUtility'],

		function (utility,translator,woUtility) {

	function doPost(requestBody) {

		var itemListDetails={};
		var requestParams = '';
		var woItemListResults = [];
		var woItemListArray = [];
		try{
			if(utility.isValueValid(requestBody)){
				requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;
				var scannedItem = requestParams.scannedItem;
				var actionType = requestParams.actionType;
				log.debug({title:'requestParams',details:requestParams});
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId))
				{
					if(utility.isValueValid(actionType)){
						if(actionType == 'validateItem' ){
							var responseObject = {itemText:scannedItem};
							itemListDetails.criteria = responseObject;
							itemListDetails.errorMessage = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
							log.debug('itemListDetails',itemListDetails);
						}
						else{
							var responseObject = {itemText:scannedItem};
							itemListDetails.criteria = responseObject;
							itemListDetails.errorMessage = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
						}
					}
					else {
						woItemListResults = woUtility.getOpenTaskDetailsForWorkOrder(warehouseLocationId,transactionInternalId);
						if (woItemListResults.length > 0) {

							for (var itemListIndex=0; itemListIndex < woItemListResults.length;itemListIndex++) {
								var openTaskDetails = {};
								openTaskDetails.itemText = woItemListResults[itemListIndex].custrecord_wmsse_skuText;
								openTaskDetails.quantity = woItemListResults[itemListIndex].custrecord_wmsse_act_qty;
								openTaskDetails.internalId = woItemListResults[itemListIndex].id;
								openTaskDetails.salesdescription = woItemListResults[itemListIndex].salesdescription;
								openTaskDetails.upccode = woItemListResults[itemListIndex].upccode;
								woItemListArray.push(openTaskDetails);
							}
							log.debug('woItemListArray',woItemListArray);

							itemListDetails.itemResults = woItemListArray;
							itemListDetails.isValid = true;
						} else {
							itemListDetails.errorMessage = translator.getTranslationString('WOREVERSAL_NO_OPENPICKS');
							itemListDetails.isValid = false;
						}
					}
				}
				else{
					itemListDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
					itemListDetails.isValid=false;
				}
			}else{
				itemListDetails.isValid=false;
			}

		}catch(e){
			itemListDetails.isValid= false;
			itemListDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		log.debug('itemListDetails--',itemListDetails);

		return itemListDetails;
	}
	return{
		'post' : doPost
	};
});