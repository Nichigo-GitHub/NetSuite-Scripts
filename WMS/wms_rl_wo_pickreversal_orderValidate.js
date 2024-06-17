/**
 *    Copyright  2023, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_workOrderUtility'],

	function (search,utility,translator,woUtility) {
	function doPost(requestBody) {

		var orderDetails={};
		var requestParams = '';
		try{
			if(utility.isValueValid(requestBody)){

				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionName = requestParams.transactionName;
				log.debug({title:'requestParams',details:requestParams});
				if(utility.isValueValid(warehouseLocationId) )
				{
					if(utility.isValueValid(transactionName)){
					var workOrdDtlResults =	this.workOrderValidate(transactionName,warehouseLocationId);
					if(workOrdDtlResults.length > 0)
					{
						var woInternalid=workOrdDtlResults[0].internalid;
						var assemblyItemName=workOrdDtlResults[0].itemText;
						log.debug({title:'woInternalid',details:woInternalid});
						if(utility.isValueValid(woInternalid))
						{
						var openTaskDetails = woUtility.getOpenTaskDetailsForWorkOrder(warehouseLocationId,woInternalid);
						if(openTaskDetails.length>0){
							orderDetails.transactionInternalId =woInternalid;
							orderDetails.transactionName =transactionName;
							orderDetails.openTaskCount =openTaskDetails.length;
							orderDetails.assemblyItemName =assemblyItemName;
							orderDetails.isValid=true;
							}
						else {
							orderDetails.errorMessage = translator.getTranslationString('WOREVERSAL_NO_OPENPICKS');
							orderDetails.isValid=false;
							}
						}
						else {
							orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
							orderDetails.isValid=false;
						}
					}
					else{
						orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
						orderDetails.isValid=false;
					}
				}
				else 
				{
					orderDetails.errorMessage = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
					orderDetails.isValid=false;
				}

				}
				else{
					orderDetails.errorMessage = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
					orderDetails.isValid=false;
				}
			}else{
				orderDetails.isValid=false;
			}

		}catch(e){
			orderDetails.isValid = false;
			orderDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		log.debug('orderDetails--',orderDetails);

		return orderDetails;
	}

	function workOrderValidate(workOrdernumber,warehouseLocationId)
	{
		var workOrdDtlSearch = search.load({
			id:'customsearch_wmsse_woassembly_woscan_srh'
		});

		workOrdDtlSearch.filters.push(
			search.createFilter({
				name:'tranid',
				operator:search.Operator.ANYOF,
				values: workOrdernumber
			})
		);
		workOrdDtlSearch.filters.push(
			search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values: warehouseLocationId
			})
		);
		var	 workOrdDtlResults = utility.getSearchResultInJSON(workOrdDtlSearch);
		log.debug('workOrdDtlResults',workOrdDtlResults);
		return workOrdDtlResults;
	}
	return{
		'post' : doPost,
		workOrderValidate:workOrderValidate
	};
});