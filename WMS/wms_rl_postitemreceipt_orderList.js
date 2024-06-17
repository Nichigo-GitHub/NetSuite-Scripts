/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator'],
		/**
		 * @param {search} search
		 */
		function (search, utility,translator) {

	/**
	 * This function is to fetch the valid orders to postitemreceipt
	 */
	function doPost(requestBody) {
		
		var transactionType = '';
		var warehouseLocationId = '';
		var warehouseLocationName = '';
		var orderList = {};
		var requestParams = '';
		try{
			if (utility.isValueValid(requestBody)) {
				requestParams = requestBody.params;
				transactionType = requestParams.transactionType;
				warehouseLocationId = requestParams.warehouseLocationId;
				warehouseLocationName=requestParams.warehouseLocationName;

				if (utility.isValueValid(transactionType) && utility.isValueValid(warehouseLocationId)) {

					var orderListJsonObj = this.getOrdList(transactionType,warehouseLocationId,warehouseLocationName);
					if (orderListJsonObj.length > 0) {
						return {'orderList': orderListJsonObj, 'isValid':true,'transactionType':transactionType};
					}
					else {

						if(transactionType=='transferorder')
						{
							orderList['errorMessage'] = translator.getTranslationString('TO_ORDERLIST.NOMATCH');
							orderList['isValid'] = false;
						}
						else if(transactionType=='returnauthorization')
						{
							orderList['errorMessage'] = translator.getTranslationString('RMA_ORDERLIST.NOMATCH');
							orderList['isValid'] = false;
						}
						else
						{
							orderList['errorMessage'] = translator.getTranslationString('PO_ORDERLIST.NOMATCH');
							orderList['isValid'] = false;
						}
					}
				}
				else {
					orderList['errorMessage'] = translator.getTranslationString('ORDERLIST.NOMATCH');
					orderList['isValid'] = false;
				}
			}
			else {
				orderList['errorMessage'] = translator.getTranslationString('ORDERLIST.NOMATCH');
				orderList['isValid'] = false;
			}
		}
		catch(e)
		{
			var orderList ={};
			orderList['isValid'] = false;
			orderList['errorMessage'] = e.message;
			return orderList;
		}
		
		return orderList;
	}

	function getOrdList(transactionType,warehouseLocation,warehouseLocationName) {

		var OrdLineDetails=[];
		var orderInternalIdArr = [];
		var filterStrat = [];
		var orderLineCountArr =[];
		var orderType = 'PurchOrd';
		if(transactionType=='transferorder')
		{
			orderType = 'TrnfrOrd';
		}
		else if(transactionType =='returnauthorization')
		{
			orderType = 'RtnAuth';
		}
		filterStrat.push(search.createFilter({
			name: 'custrecord_wmsse_wms_location',
			operator: search.Operator.ANYOF,
			values: warehouseLocation
		}));
		filterStrat.push(search.createFilter({
			name: 'type',
			join:'custrecord_wmsse_order_no',
			operator: search.Operator.ANYOF,
			values: orderType
		}));
		var objOpentaskDetailsSearch = search.load({id:'customsearch_wmsse_pir_openputawaysbyord'});
		var savedFilter = objOpentaskDetailsSearch.filters ;
		objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
		var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);
		var poId ='';
		var line ='';
		var opentaskRec ='';

		if (objOPentaskDetails.length > 0) {
			for (var objOPentask in objOPentaskDetails) {
				opentaskRec = objOPentaskDetails[objOPentask];
				poId = opentaskRec['internalid'];
				line = opentaskRec['custrecord_wmsse_line_no'];
				orderInternalIdArr.push(poId);
				orderLineCountArr.push(line);
			}
		}
		
		if(orderInternalIdArr.length > 0)
		{
			var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();

			var orderSearchName = 'customsearch_wmsse_pir_po_details';
			if(transactionType=='transferorder')
			{
				orderSearchName = 'customsearch_wmsse_pir_to_details';
			}
			else if(transactionType =='returnauthorization')
			{
				var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
				orderSearchName = 'customsearch_wmsse_pir_rma_details';
			}
			var OrdLineDetailsSearch = search.load({
				id: orderSearchName
			});

			var mySearchFilter = [];
			mySearchFilter = OrdLineDetailsSearch.filters;
			if(transactionType == 'returnauthorization')
			{
				
				if(crossSubsidiaryFeature)
				{
					mySearchFilter.push(search.createFilter({
						name: 'inventorylocation',
						operator: search.Operator.ANYOF,
						values: warehouseLocation
					}));
					mySearchFilter.push(search.createFilter({
						name: 'mainline',
						operator: search.Operator.IS,
						values: false
					}));
					
					mySearchFilter.push(search.createFilter({
						name: 'taxline',
						operator: search.Operator.IS,
						values: false
					}));
				}
				else
				{
					mySearchFilter.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: warehouseLocation
					}));
					mySearchFilter.push(search.createFilter({
						name: 'mainline',
						operator: search.Operator.IS,
						values: true
					}));
				}
			}
			else
			{
				if(transactionType=='transferorder')
				{
					mySearchFilter.push(search.createFilter({
						name: 'transferlocation',
						operator: search.Operator.ANYOF,
						values: warehouseLocation
					}));
				}
				else
				{

					if(centralizesPurchasingandBilling == true && utility.isValueValid(warehouseLocationName))
					{
						mySearchFilter.push(
							search.createFilter({
								name:'formulatext',
								operator: search.Operator.IS,
								formula: "CASE WHEN {targetlocation} IS NULL THEN {location} ELSE{targetlocation} END",
								values: warehouseLocationName
							}));
						mySearchFilter.push(search.createFilter({
							name: 'mainline',
							operator: search.Operator.IS,
							values: false
						}));

					}

					else {
						mySearchFilter.push(search.createFilter({
							name: 'location',
							operator: search.Operator.ANYOF,
							values: warehouseLocation
						}));
						mySearchFilter.push(search.createFilter({
							name: 'mainline',
							operator: search.Operator.IS,
							values: true
						}));
					}
				}
			}
			mySearchFilter.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: orderInternalIdArr
			}));
			log.debug({title:'orderInternalIdArr',details:orderInternalIdArr});
			OrdLineDetailsSearch.filters = mySearchFilter;
			OrdLineDetails = utility.getSearchResultInJSON(OrdLineDetailsSearch);
			if(OrdLineDetails.length > 0)
			{
				var internalid = '';
				var idIndex = '';
				for(var ordLine in OrdLineDetails)
				{
					internalid = OrdLineDetails[ordLine]['internalid'];
					idIndex = orderInternalIdArr.indexOf(internalid);
					OrdLineDetails[ordLine]['line']=orderLineCountArr[idIndex];
				}
			}
		}
		return OrdLineDetails;
	}

	return {
		'post': doPost,
		getOrdList: getOrdList
	};
});