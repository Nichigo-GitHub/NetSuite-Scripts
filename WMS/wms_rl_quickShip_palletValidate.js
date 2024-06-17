/**
 * Copyright ï¿½ 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_packingUtility'],

		function (search, utility,translator,packUtility) {


	function doPost(requestBody) {

		var whLocation = '';
		var quickShipOrdDetails = {};
		var palletOrCartonName='';
		var orderType = '';
		var vShipMethodArr = [];
		var vShipMethodTextArr = [];
		var Quickshpflag = '';
		var shipmethod='';
		var shipmethodText = '';
		var tranName='';
		var vquickShipMethodArr = [];
		var requestParams = {};
		var orderInternalId= [];
		var debugString = '';
		var cartonScan='N';
		var orderScan='N';
		//try{   
		requestParams = requestBody.params;
		if (utility.isValueValid(requestParams)) {					
			whLocation = requestParams.warehouseLocationId;
			palletOrCartonName = requestParams.palletName;
			orderType = requestParams.transactionType;
			debugString = debugString + 'requestParams:' + requestParams;
			log.debug('requestParams',requestParams);
			if (utility.isValueValid(palletOrCartonName) && utility.isValueValid(orderType) && utility.isValueValid(whLocation) ) {

				var getquickShipOrderDetails = packUtility.getpalletsForQuickship(orderType,whLocation,palletOrCartonName);
								
				if(getquickShipOrderDetails.length == 0){
					getquickShipOrderDetails = packUtility.getpalletsForQuickship(orderType,whLocation,'','',palletOrCartonName);
					if(getquickShipOrderDetails.length > 0){
						orderScan='Y'
					}
				}
				if(getquickShipOrderDetails.length == 0){
					getquickShipOrderDetails = packUtility.getpalletsForQuickship(orderType,whLocation,'',palletOrCartonName);
					if(getquickShipOrderDetails.length > 0){
						quickShipOrdDetails.isValidCarton=true;
						quickShipOrdDetails.cartonNum = palletOrCartonName;
						cartonScan='Y';
					}
				}


				debugString = debugString + 'getquickShipOrderDetails:' + getquickShipOrderDetails;
				log.debug('getquickShipOrderDetails',getquickShipOrderDetails);
				if(getquickShipOrderDetails.length > 0){

                    for (var orderId = 0; orderId < getquickShipOrderDetails.length; orderId++) {
                        var orderValue = getquickShipOrderDetails[orderId]['internalid'];
                            orderInternalId.push(orderValue);

                    }
                    log.debug('orderInternalId',orderInternalId);

					shipmethodText = getquickShipOrderDetails[0]['servicelevel'];
					tranName = getquickShipOrderDetails[0]['orderName'];
                    var quickShipFlagResults;
                    if(utility.isValueValid(shipmethodText)) {
                         quickShipFlagResults = packUtility.getQuickShipFlagbyPalletShipmethod(shipmethodText);
                    }
					
					if(utility.isValueValid(quickShipFlagResults))
					{
						quickShipFlag=quickShipFlagResults[0]['quickshipflag'];
						if(quickShipFlag ==true || quickShipFlag =="true")
						{
							vquickShipMethodArr.push(quickShipFlagResults[0]['shipmethod']);
						}
					}

					log.debug({title:'vquickShipMethodArr',details:vquickShipMethodArr});
					if(vquickShipMethodArr.length > 0){
						var crossSubsidiaryFeature = false;
						if(orderType == 'SalesOrd')
						{
							crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
							searchName = "customsearch_wms_quickship_so_details";
						}

						if(orderType == 'TrnfrOrd')
							searchName = "customsearch_wms_quickship_to_details";

						var orderDetailsSearch = search.load({id:searchName});
						var orderFilters = orderDetailsSearch.filters;

						if(crossSubsidiaryFeature == true && orderType=='SalesOrd')
						{
							orderFilters.push(search.createFilter({
								name:'inventorylocation',
								operator:search.Operator.ANYOF,
								values:whLocation
							}));

						}
						else
						{
							orderFilters.push(search.createFilter({
								name:'location',
								operator:search.Operator.ANYOF,
								values:whLocation
							}));
						}
						if(utility.isValueValid(orderInternalId))
						{
							orderFilters.push(search.createFilter({
								name: 'internalid',
								operator: search.Operator.ANYOF,
								values: orderInternalId
							}));
						}
						orderDetailsSearch.filters = orderFilters;

						var	 orderDetailsSrchResult = utility.getSearchResultInJSON(orderDetailsSearch);
						log.debug({title:'orderDetailsSrchResult',details:orderDetailsSrchResult});
						if(orderDetailsSrchResult.length > 0 ){
							if(orderDetailsSrchResult.length == 1 ){
								quickShipOrdDetails.shipaddress = orderDetailsSrchResult[0]['shipaddress'];
							}
							if(orderType == 'TrnfrOrd'){
								quickShipOrdDetails.line = orderDetailsSrchResult[0]['transferorderitemline'];
								quickShipOrdDetails.quantityuom = orderDetailsSrchResult[0]['transferorderquantitycommitted'];
							}else if (orderType == 'SalesOrd'){
								quickShipOrdDetails.line = orderDetailsSrchResult[0]['line'];
								quickShipOrdDetails.quantityuom = orderDetailsSrchResult[0]['quantityuom'];
							}
						}

						if(quickShipOrdDetails.isValidCarton== true){
							var cartonDtlObj = packUtility.getQSCartonList(orderInternalId,vquickShipMethodArr,whLocation,palletOrCartonName);
							log.debug('cartonDtlObj',cartonDtlObj);
							quickShipOrdDetails.cartonNum = cartonDtlObj[0]['contentsdescription'];
							quickShipOrdDetails.pckgWeight = cartonDtlObj[0]['weightinlbs'];
						}


						quickShipOrdDetails.transactionType= orderType ;
						quickShipOrdDetails.transactionTypeText=getquickShipOrderDetails[0]['typeText'];
						quickShipOrdDetails.transactionInternalId= orderInternalId ;
						quickShipOrdDetails.entity= getquickShipOrderDetails[0]['entity'] ;
						quickShipOrdDetails.trandate= getquickShipOrderDetails[0]['trandate'] ;
						quickShipOrdDetails.shipdate= getquickShipOrderDetails[0]['shipdate'] ;
						quickShipOrdDetails.cartonCount= getquickShipOrderDetails[0]['contentsdescription'] ;
						quickShipOrdDetails.transferlocationText= getquickShipOrderDetails[0]['transferlocationText'] ;

						quickShipOrdDetails.transactionName= tranName  ;
						quickShipOrdDetails.shipviaMethod= vquickShipMethodArr ;
						if(cartonScan=='N' &&  orderScan=='N')
						{
							quickShipOrdDetails.palletName= palletOrCartonName;
							quickShipOrdDetails.isValidPallet='true';
						}
						
						
						quickShipOrdDetails.isValid=true;

					}
					else
					{
						log.debug('test1','test1');
						quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.SHIPPING_SERVICELEVL');
						quickShipOrdDetails.isValid=false;
					}
				}
				else
					{
					quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.INVALID_ORDERORCARTN');
					quickShipOrdDetails.isValid=false;
					}


			}



			else {
				if(!utility.isValueValid(whLocation)){
					log.debug('test2','test2');
					quickShipOrdDetails.errorMessage=translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
					quickShipOrdDetails.isValid=false;
				}
				else
				{ 
					log.debug('test3','test3');
					quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.INVALID_ORDERORCARTN');
					quickShipOrdDetails.isValid=false;
				}
			}
		}
		else
		{
			log.debug('test4','test4');
			quickShipOrdDetails.errorMessage=translator.getTranslationString('QUICKSHIP_VALIDATION.EMPTY_ORDERORCARTN');
			quickShipOrdDetails.isValid=false;
		}
		log.debug('quickShipOrdDetails',quickShipOrdDetails);
		/*}
		catch(e)
		{

			quickShipOrdDetails.isValid = false;
			quickShipOrdDetails.errorMessage = e.message;

		}*/
		log.debug('test5','test5');
		return quickShipOrdDetails;
	}


	return {
		post: doPost

	};
});