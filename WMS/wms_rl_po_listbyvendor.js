/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator', './wms_inboundUtility'],
		/**
		 * @param {search} search
		 */
		function (search, utility,translator, inboundUtility) {

	/**
	 * This function is to fetch the count of valid purchase orders against the vendor	 */
	function doPost(requestBody) {
		var transactionType = '';
		var whLocation = '';
		var warehouseLocationName='';
		var debugString ='';
		var requestParams = '';
		var orderListJsonObj =null;
		try{
			if (utility.isValueValid(requestBody)) {
				requestParams= requestBody.params;
				transactionType = requestParams.transactionType;
				whLocation = requestParams.warehouseLocationId;
				warehouseLocationName=requestParams.warehouseLocationName;
				if (utility.isValueValid(whLocation)) {
					var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
					orderListJsonObj = this.getPOListByVendor(transactionType, whLocation,centralizesPurchasingandBilling,warehouseLocationName);

					if (orderListJsonObj.length == 0)
					{
						orderListJsonObj =	{errorMessage: translator.getTranslationString('PO_LISTBYVENDOR.NOMATCH'), isValid: false};
					}
				}
				else {
					orderListJsonObj =  {errorMessage: translator.getTranslationString('PO_LISTBYVENDOR.NOMATCH'), isValid: false};
				}
			}
			else {
				orderListJsonObj =  {errorMessage: translator.getTranslationString('PO_LISTBYVENDOR.NOMATCH'), isValid: false};
			}
		}
		catch(e)
		{
			orderListJsonObj =  {errorMessage: e.message, isValid: false};
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return orderListJsonObj;
	}

	function _getPOListByVendor(transactionType, warehouseLocation,centralizesPurchasingandBilling,warehouseLocationName) {

		var vType = 'PurchOrd';
		var POLineDetailsSearch = search.load({
			id: 'customsearch_wmsse_rcv_pobyvendor'
		});

		var mySearchFilter = [];
		mySearchFilter = POLineDetailsSearch.filters;
		mySearchFilter.push(search.createFilter({
			name: 'type',
			operator: search.Operator.ANYOF,
			values: vType
		}));

		if(centralizesPurchasingandBilling==true && utility.isValueValid(warehouseLocationName))
		{

			mySearchFilter.push(search.createFilter({
				name: 'formulatext',
				operator: search.Operator.IS,
				formula: "CASE WHEN {targetlocation} IS NULL THEN {location} ELSE{targetlocation} END",
				values: warehouseLocationName
			}));


		}
		else {
			mySearchFilter.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocation
			}));
		}

		var openPutawayDetails = inboundUtility.getAllOpentaskOpenPutwayOrderDetails(warehouseLocation,null);
		if(openPutawayDetails.length > 0)
		{
			mySearchFilter.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.NONEOF,
				values: openPutawayDetails
			}));
		}
		POLineDetailsSearch.filters = mySearchFilter;
		var POLineDetails = utility.getSearchResultInJSON(POLineDetailsSearch);
		return POLineDetails;
	}

	return {
		'post': doPost,
		getPOListByVendor: _getPOListByVendor
	};
});