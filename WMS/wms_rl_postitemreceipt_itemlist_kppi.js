/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator', './wms_inboundUtility_kppi'],
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
			log.debug({title:'doPost entry',details:'requestBody=' + JSON.stringify(requestBody)});
			if(utility.isValueValid(requestBody)) {

				requestParams = requestBody.params;
				log.debug({title:'requestParams',details:JSON.stringify(requestParams)});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionInternalId = requestParams.transactionInternalId;
				log.debug({title:'ids extracted',details:'warehouseLocationId=' + warehouseLocationId + ' transactionInternalId=' + transactionInternalId});

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId)) {

					var openTaskItemDetails = [];
					var itemListObj = inboundUtility.getOpenPutawayTasksforIRPosting(transactionInternalId,warehouseLocationId);
					log.debug({title:'itemListObj fetched',details:'count=' + (itemListObj ? itemListObj.length : 'undefined')});
					log.debug({title:'itemListObj fetched',details:JSON.stringify(itemListObj)});

					if(itemListObj.length == 0)
					{
						itemListDetails['errorMessage'] = translator.getTranslationString('PO_ITEMLIST.NOMATCH');
						itemListDetails['isValid'] = false;
						log.debug({title:'no items found',details:'itemListObj length is 0'});
					}
					else
					{
						if(itemListObj.length >0)
						{
							var openTaskDetails ='';
							var itemId = '';
							var itemName = '';
							var statusName = '';
							var actQuantity = '';
							var unitText = '';
							var drnum = '';
							for (var intItr in itemListObj)
							{
								openTaskDetails = {};
								itemId = itemListObj[intItr]['custrecord_wmsse_sku'];
								itemName = itemListObj[intItr]['custrecord_wmsse_skuText'];
								statusName = itemListObj[intItr]['custrecord_wmsse_inventorystatusText'];
								actQuantity = itemListObj[intItr]['custrecord_wmsse_act_qty'];
								unitText = itemListObj[intItr]['custrecord_wmsse_uom'];
								drnum = itemListObj[intItr]['custrecord_wmsse_drnumber'];
								if(unitText == "- None -" || !utility.isValueValid(unitText))
								{
									unitText = ""; 	
								}
								openTaskDetails['itemId'] = itemId;
								openTaskDetails['itemName'] = itemName;
								openTaskDetails['statusName'] = statusName;
								openTaskDetails['totalQtyWithUom'] = actQuantity+" "+unitText;
								openTaskDetails['drnum'] = drnum;
								openTaskItemDetails[openTaskItemDetails.length] = openTaskDetails;
								log.debug({title:'openTaskDetails built',details:'index=' + intItr + ' itemId=' + itemId + ' itemName=' + itemName + ' statusName=' + statusName + ' totalQtyWithUom=' + openTaskDetails['totalQtyWithUom'] + ' drnum=' + drnum});
							}
						}
						itemListDetails['itemList'] = openTaskItemDetails;
						itemListDetails['isValid'] = true;
						log.debug({title:'itemListDetails built',details:JSON.stringify(itemListDetails)});
					}
				}
				else{
					log.debug({title:'invalid ids',details:'warehouseLocationId=' + warehouseLocationId + ' transactionInternalId=' + transactionInternalId});
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
