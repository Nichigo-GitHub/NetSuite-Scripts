/**
 *    Copyright 2023 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator', './wms_inbound_utility'],
		/**
		 * @param {search} search
		 */
	function (utility,translator, inboundUtility) {
	/**
	 * This function is to fetch the count of valid purchase orders against the vendor	 */
	function doPost(requestBody) {
		var warehouseLocationId = '';
		var transactionInternalId='';
		var requestParams = '';
		var itemReceiptDetialsObj ={};
		var itemReceiptResultsObj =[];
		var transactionType ='';
		try{
			if (utility.isValueValid(requestBody)) {
				requestParams= requestBody.params;
				warehouseLocationId = requestParams.warehouseLocationId;
				transactionInternalId = requestParams.transactionInternalId;
				transactionType = requestParams.transactionType;
				log.debug({title:'requestParams',details:requestParams});
				if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId)) {
					var itemReceiptListResults = inboundUtility.getItemReceiptDetails(transactionInternalId,'', warehouseLocationId);
					log.debug({title:'itemReceiptListResults',details:itemReceiptListResults});
					if (itemReceiptListResults.length == 0)
					{
						itemReceiptDetialsObj.errorMessage = translator.getTranslationString('ITEM_RECEIPT_TABLE_NODETAILS');
						itemReceiptDetialsObj.isValid = false;
					}else{
						if(transactionType == "returnauthorization"){
							var i=0;
							for (var result in itemReceiptListResults) {
								var unitText = itemReceiptListResults[result]['units'];
								var quantity = itemReceiptListResults[result]['quantity'];							
								if(quantity >0){
									var IRdetailsObj={};
									if(!utility.isValueValid(itemReceiptListResults[result]['units'])){
										unitText='';
									}
									itemReceiptListResults[result]['quantity']=itemReceiptListResults[result]['quantity']+" "+unitText;
									IRdetailsObj.internalid =itemReceiptListResults[result]['internalid'];
									IRdetailsObj.referencenumber=itemReceiptListResults[result]['referencenumber'];
									IRdetailsObj.number=itemReceiptListResults[result]['number'];
									IRdetailsObj.itemname=itemReceiptListResults[result]['itemname'];
									IRdetailsObj.quantity=itemReceiptListResults[result]['quantity'];
									IRdetailsObj.units=itemReceiptListResults[result]['units'];									
									itemReceiptResultsObj.push(IRdetailsObj);
									i++;
								}
							}
							log.debug('RMA Final return itemReceiptListResults',itemReceiptResultsObj);
							itemReceiptDetialsObj.itemReceiptListResults = itemReceiptResultsObj;
						}else{
						for (var result in itemReceiptListResults) {
							var unitText = itemReceiptListResults[result]['units'];
							if(!utility.isValueValid(itemReceiptListResults[result]['units'])){
								unitText='';
							}
							itemReceiptListResults[result]['quantity']=itemReceiptListResults[result]['quantity']+" "+unitText;
						}
							itemReceiptDetialsObj.itemReceiptListResults = itemReceiptListResults;
						}
						log.debug(' Final return itemReceiptListResults',itemReceiptListResults);
						itemReceiptDetialsObj.isValid = true;
					}
				}
				else {
					itemReceiptDetialsObj.errorMessage = translator.getTranslationString('ITEM_RECEIPT_TABLE_NODETAILS');
					itemReceiptDetialsObj.isValid = false;
				}
			}
			else {
				itemReceiptDetialsObj.errorMessage = translator.getTranslationString('ITEM_RECEIPT_TABLE_NODETAILS');
				itemReceiptDetialsObj.isValid = false;
			}
		}
		catch(exp)
		{
			itemReceiptDetialsObj.isValid = false;
			itemReceiptDetialsObj.errorMessage = exp.message;
			log.error({title:'Exeception in itemReceipt Details',details:exp});
			log.error({title:'errorMessage',details:exp.message+" Stack :"+exp.stack});
		}
		log.debug({title:'Return object itemReceiptDetialsObj',details:itemReceiptDetialsObj});
		return itemReceiptDetialsObj;
	}
	return {
		'post': doPost
	};
});