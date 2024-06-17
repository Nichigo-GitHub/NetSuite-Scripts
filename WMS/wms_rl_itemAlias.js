/**
 *     Copyright © 2022, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_labelPrinting_utility','./wms_translator'],
	function(search,utility,labelPrintingUtility,translator) {
	/**
	 * This function is used to display/validate the item alias.
	 *
	 */
	function doPost(requestBody) {

		var itemAliasResults= {};
		var itemInternalId ='';
		var unitstype ='';
		var vendor ='';
		var buttonAction ='';
		var tempButtonName ='';
		var itemAliasText ='';
		var itemType ='';
		var warehouselocationId ='';
		var isTallyScanRequired =false;
		var randomTallyScan ='F';
		var isSamePageNavigationRequired ='';
		var lotPageNavigationRequiredForTS ='';
		var transactionLineNo ='';
		var barcodeQuantityObj ='';
		try{
			if (utility.isValueValid(requestBody)) {
                var requestParams = requestBody.params;
				itemInternalId = requestParams.item;
                unitstype = requestParams.unitstype;
				vendor	= requestParams.vendor;
				buttonAction	= requestParams.buttonAction;
				itemAliasText = requestParams.itemAliasText;
				itemType = requestParams.itemType;
				tempButtonName = requestParams.tempButtonName;
				warehouselocationId =requestParams.warehouselocationId;
				isTallyScanRequired =requestParams.isTallyScanRequired;
				randomTallyScan =requestParams.randomTallyScan;
				isSamePageNavigationRequired =requestParams.isSamePageNavigationRequired;
				lotPageNavigationRequiredForTS=requestParams.lotPageNavigationRequiredForTS;
				transactionLineNo =requestParams.transactionLineNo;
				barcodeQuantityObj = requestParams.barcodeQuantity;
				itemAliasObject =requestParams.itemAliasObject;
				itemAliasObject = utility.isValueValid(itemAliasObject) ? itemAliasObject : {};
				log.debug({title: 'requestParams', details: requestParams});
				if(utility.isValueValid(itemInternalId)){
				if(buttonAction =="Confirm")
				{
					itemAliasResults.selectedItemAliasFlag = false;
					if(utility.isValueValid(itemAliasText )) {
						var validatedItemAlias = this.validateItemAlias(itemInternalId, itemAliasText,vendor,warehouselocationId);
						log.debug('validatedItemAlias', validatedItemAlias);
						if (validatedItemAlias.length == 0) {
							itemAliasResults.errorMessage = translator.getTranslationString('AUTOPRINT_INVALID_ITEMALIAS');
							itemAliasResults.isValid = false;
						} else if (!labelPrintingUtility.validateGTIN(itemAliasText)) {
							itemAliasResults.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_GTIN_LENGTH');
							itemAliasResults.isValid = false;
						} else {
							var quantityValue ='';
							if(isTallyScanRequired){
								quantityValue= '1';
							}
							if(randomTallyScan =='T')
							{
								itemAliasResults.itemAliasObject = this.createObjectForItemAlias(itemInternalId,transactionLineNo,itemAliasText,itemAliasObject);
								itemAliasResults.barcodeQuantity = barcodeQuantityObj;
								log.debug('itemAliasResults.itemAliasObject ',itemAliasResults.itemAliasObject );
							}else {
							if(utility.isValueValid(validatedItemAlias[0].custrecord_wms_alias_unit)) {
								var uomQtyObj = [{'value':quantityValue,'unit': validatedItemAlias[0].custrecord_wms_alias_unit}];
								itemAliasResults.barcodeQuantity = uomQtyObj;
							}
							else if(isTallyScanRequired)
							{
								var uomQtyObj = [{'value':quantityValue,'unit': ''}];
								itemAliasResults.barcodeQuantity = uomQtyObj;
								}
							}
							itemAliasResults.selectedItemAliasText = itemAliasText;
							itemAliasResults.selectedItemAliasFlag = true;
							itemAliasResults.isValid = true;
						}
					}
					else {
						itemAliasResults.errorMessage = translator.getTranslationString('AUTOPRINT_INVALID_ITEMALIAS');
						itemAliasResults.isValid = false;
					}
				}
				else if(tempButtonName =="PrintButton" || tempButtonName =="EnterSerialButton"){
					if(!utility.isValueValid(barcodeQuantityObj))
					{
						barcodeQuantityObj = requestParams.barcodeQuantityObj;
						log.debug({title: 'barcodeQuantityObj', details: barcodeQuantityObj});
					}
					itemAliasResults.tempButtonName = tempButtonName;
					itemAliasResults.barcodeQuantity = barcodeQuantityObj;
					itemAliasResults.isValid =true;
				}
				else
				{
                    var itemAliasSearchResults = labelPrintingUtility.getAllItemAliasResultsForPrint(itemInternalId, vendor,warehouselocationId);
                  	itemAliasResults.itemAliasList = itemAliasSearchResults;
					itemAliasResults.isValid =true;
				}
				}
				else
				{
                    itemAliasResults.errorMessage = translator.getTranslationString('AUTOPRINT_INVALID_ITEMALIAS');
                    itemAliasResults.isValid =false;
				}
				log.debug({title: 'return itemAliasResults', details: itemAliasResults});
			}
		}
		catch(exp)
		{
            itemAliasResults.errorMessage = translator.getTranslationString('AUTOPRINT_INVALID_ITEMALIAS');
            itemAliasResults.isValid =false;
			log.error({title: 'exception in Item alias Restlet', details: exp});
		}
		return itemAliasResults;
	}
		function validateItemAlias(itemId,itemAliasText,vendor,warehouselocationId)
		{
			var itemAliasFilters = [];

			if(utility.isValueValid(itemId))
			{
				itemAliasFilters.push(search.createFilter({
					name: 'custrecord_wmsse_alias_item',
					operator: search.Operator.ANYOF,
					values: itemId
				}));
			}
			if(utility.isValueValid(vendor))
			{
				itemAliasFilters.push(search.createFilter({
					name: 'custrecord_wmsse_alias_vendor',
					operator: search.Operator.ANYOF,
					values: ["@NONE@",vendor]
				}));
			}
			if(utility.isValueValid(warehouselocationId))
			{
				itemAliasFilters.push(search.createFilter({
					name: 'custrecord_wmsse_alias_location',
					operator: search.Operator.ANYOF,
					values: ["@NONE@",warehouselocationId]
				}));
			}
			itemAliasFilters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: itemAliasText
			}));
			var itemAliasResultsSearch = search.load({
				id :'customsearch_wmsse_itemalias_validate'
			});
			var savedFilters = itemAliasResultsSearch.filters;
			itemAliasResultsSearch.filters = savedFilters.concat(itemAliasFilters);
				return utility.getSearchResultInJSON(itemAliasResultsSearch);
		}
		function createObjectForItemAlias(itemInternalId,transactionLineno,selectedItemAlias,itemAliasObject)
		{		
			var key = itemInternalId + '_' + transactionLineno;
			log.debug('itemAliasObject',itemAliasObject);
			if(utility.isValueValid(itemAliasObject) && (utility.isValueValid(itemAliasObject[key]))){
				log.debug('createObjectForItemAlias_Key',itemAliasObject[key]);
				itemAliasObject[key]["selectedItemAlias"]=selectedItemAlias;
			}else {
				quantity =1;
				var obj = {};
				obj.selectedItemAlias = selectedItemAlias;
				obj.quantity = quantity;
				log.error('obj',obj);
				itemAliasObject[key] = obj;
			}
			return itemAliasObject;
		}
	return {
		'post': doPost,
		validateItemAlias:validateItemAlias,
		createObjectForItemAlias:createObjectForItemAlias
	};
});
