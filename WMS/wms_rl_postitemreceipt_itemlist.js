/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator', './wms_inboundUtility'],
		/**
		 * @param {search} search
		 */
		function(utility,translator, inboundUtility) {

	/**
	 * This function is to fetch the items of a purchase order
	 */
	function doPost(requestBody) {
		var itemListDetails = {};
		var requestParams = '';
		try{
			if(utility.isValueValid(requestBody)) {

				requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId)) {

					var openTaskItemDetails = [];
					var itemListObj = inboundUtility.getOpenPutawayTasksforIRPosting(transactionInternalId,warehouseLocationId);

					if(itemListObj.length == 0)
					{
						itemListDetails['errorMessage'] = translator.getTranslationString('PO_ITEMLIST.NOMATCH');
						itemListDetails['isValid'] = false;
					}
					else
					{
						if(itemListObj.length >0)
						{
							var openTaskDetails ='';
							var itemName = '';
							var statusName = '';
							var actQuantity = '';
							var unitText = '';
							for (var intItr in itemListObj)
							{
								openTaskDetails = {};
								itemName = itemListObj[intItr]['custrecord_wmsse_skuText'];
								statusName = itemListObj[intItr]['custrecord_wmsse_inventorystatusText'];
								actQuantity = itemListObj[intItr]['custrecord_wmsse_act_qty'];
								unitText = itemListObj[intItr]['custrecord_wmsse_uom'];
								if(unitText == "- None -" || !utility.isValueValid(unitText))
								{
									unitText = "";	
								}
								openTaskDetails['itemName'] = itemName;
								openTaskDetails['statusName'] = statusName;
								openTaskDetails['totalQtyWithUom'] = actQuantity+" "+unitText;
								openTaskItemDetails[openTaskItemDetails.length] = openTaskDetails;
							}
						}
						itemListDetails['itemList'] = openTaskItemDetails;
						itemListDetails['isValid'] = true;
					}
				}
				else{

					itemListDetails['errorMessage'] = translator.getTranslationString('PO_ITEMLIST.NOMATCH');
					itemListDetails['isValid'] = false;
				}
			}
			else{

				itemListDetails['errorMessage'] = translator.getTranslationString('PO_ITEMLIST.NOMATCH');
				itemListDetails['isValid'] = false;
			}			
		}
		catch(e)
		{
			itemListDetails['isValid'] = false;
			itemListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return itemListDetails;
	}
	return {
		'post': doPost
	};

});
