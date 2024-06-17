/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator', './wms_inboundUtility','./wms_inventory_utility','N/record'],
		/**
		 * @param {search} search
		 */
		function (search, utility,translator, inboundUtility,inventoryUtiltiy,record) {

	function doPost(requestBody) {

		var whLocationId = '';
		var cartBinId = '';
		var cartDetails = {};	
		try{
			var requestParams = '';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      			if (utility.isValueValid(requestBody)) 
			{	
				requestParams = requestBody.params;
				whLocationId = requestParams.warehouseLocationId;
				cartBinId    = requestParams.cartBinId;
				statusId     = requestParams.statusId;

				if (utility.isValueValid(whLocationId) && utility.isValueValid(cartBinId))
				{

					var getCartItemListResults = inboundUtility.getCartBinDetailsFromOpenTask(whLocationId,cartBinId);
					log.debug({title:'getCartItemListResults',details:getCartItemListResults});	
					var cartItemLength = getCartItemListResults.length;
					if(cartItemLength > 0)	{
						var cartItem = 0 ;
						var bintransferObj = {};
						var binTransferObject = {};
						var tdate =  new Date();
						var itemDetails = [];
						var openTask = 0;
						log.debug({title:'timeStamp at the before start of the function',
							details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});
						for (cartItem = 0;cartItem < cartItemLength; cartItem++ ){
							var tdate =  new Date();
							log.debug({title:'timeStamp at the start of the iteration',
								details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});
							
							bintransferObj = {};
							itemDetails = getItemDetails(getCartItemListResults[cartItem].custrecord_wmsse_sku);
							bintransferObj.itemType = itemDetails.recordtype;
							bintransferObj.whLocation = whLocationId;
							bintransferObj.itemId = getCartItemListResults[cartItem].custrecord_wmsse_sku;
							bintransferObj.quantity = getCartItemListResults[cartItem].custrecord_wmsse_act_qty;
							bintransferObj.fromBinId = cartBinId;
							bintransferObj.toBinId = getCartItemListResults[cartItem].custrecord_wmsse_reccommendedbin;
							bintransferObj.batchno = getCartItemListResults[cartItem].custrecord_wmsse_batch_num;
							bintransferObj.units =  getCartItemListResults[cartItem].custrecord_wmsse_uom;
							bintransferObj.stockConversionRate = getCartItemListResults[cartItem].custrecord_wmsse_conversionrate;
							bintransferObj.opentaskQty = getCartItemListResults[cartItem].custrecord_wmsse_act_qty;
							bintransferObj.fromStatus =getCartItemListResults[cartItem].custrecord_wmsse_inventorystatus;
							bintransferObj.toStatus = getCartItemListResults[cartItem].custrecord_wmsse_inventorystatusto;
							binTransferObject = inventoryUtiltiy.inventoryBinTransfer(bintransferObj);
							
							var openTaskResults = getOpenTaskID(getCartItemListResults[cartItem].custrecord_wmsse_sku,cartBinId,
									whLocationId,getCartItemListResults[cartItem].custrecord_wmsse_reccommendedbin);
							log.debug({title:'openTaskResults',details:openTaskResults});
							for(openTask = 0; openTask < openTaskResults.length ; openTask ++){
								updateNSrefno(openTaskResults[openTask].internalid,binTransferObject);
							}
							
							var tdate =  new Date();
							log.debug({title:'timeStamp at the end of the iteration',
								details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});
                             
						}
						var tdate =  new Date();
						log.debug({title:'timeStamp at the end of the function',
							details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});
					}
				}
				else {
					cartDetails.errorMessage = 'invalid Input';//translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
					cartDetails.isValid = false;
				}
			}
			else {
				cartDetails.errorMessage = 'invalid Input' ;//translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
				cartDetails.isValid = false;
			}
			log.debug({title:'cartDetails',details:cartDetails});

		}
		catch(e)
		{
			cartDetails.isValid = false;
			cartDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return cartDetails;
	}
	function getOpenTaskID(itemId,cartBinId,whId,recomendedBinId){

		var filters = [];
		var opentaskIdSearch = search.load({
			id: 'customsearch_wms_opentaskcartitemdtls'
		});
		filters = opentaskIdSearch.filters;
		if (utility.isValueValid(cartBinId)) {
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_actendloc',
				operator: search.Operator.ANYOF,
				values: cartBinId
			}));
		}
		if (utility.isValueValid(whId)) {
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_wms_location',
				operator: search.Operator.ANYOF,
				values: whId
			}));
		}
		if (utility.isValueValid(itemId)) {
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_sku',
				operator: search.Operator.ANYOF,
				values: itemId
			}));
		}
		if (utility.isValueValid(recomendedBinId)) {
			filters.push(search.createFilter({
				name: 'custrecord_wmsse_reccommendedbin',
				operator: search.Operator.ANYOF,
				values: recomendedBinId
			}));
		}

		opentaskIdSearch.filters = filters;
		return utility.getSearchResultInJSON(opentaskIdSearch);
	
	}
function getItemDetails(itemInternalId){
	
	var columnArray =[];
	columnArray.push('usebins');
	columnArray.push('unitstype');
	columnArray.push('stockunit');
	columnArray.push('recordtype');	

	return utility.getItemFieldsByLookup(itemInternalId,columnArray);

}
function updateNSrefno(openTaskID,binTransferRec){
	
	log.debug({title:'openTaskID',details:openTaskID});
	log.debug({title:'binTransferRec',details:binTransferRec});
	var openTaskRec = record.load({
		type: 'customrecord_wmsse_trn_opentask',
		id: openTaskID});
	openTaskRec.setValue({
		fieldId:'custrecord_wmsse_nsconfirm_ref_no',
		value:binTransferRec.inventoryCountId
	});
	openTaskRec.save();
	log.debug({title:'openTaskRec',details:openTaskRec});
}

	return {
		'post': doPost

	};
});