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
		var orderOrCartonName='';
		var orderType = '';
		var vShipMethodArr = [];
		var vShipMethodTextArr = [];
		var Quickshpflag = '';
		var shipmethod='';
		var orderId ='';
		var shipmethodText = '';
		var vquickShipMethodArr = [];
		var requestParams = {};
		var searchName ="customsearch_wms_quickship_so_details"; 
		var orderInternalId= '';
		var debugString = '';
        var getquickShipPalletDetails='';
        var getquickShipOrderDetails='';
        var fromPageId = '';
		try{   
			requestParams = requestBody.params;
			if (utility.isValueValid(requestParams)) {					
				whLocation = requestParams.warehouseLocationId;
				orderOrCartonName = requestParams.transactionName;
				orderType = requestParams.transactionType;
				fromPageId = requestParams.fromPageID;
				debugString = debugString + 'requestParams:' + requestParams;
				if (utility.isValueValid(orderOrCartonName) && utility.isValueValid(orderType) && utility.isValueValid(whLocation) ) {

					if(orderOrCartonName != null && orderOrCartonName != undefined && orderOrCartonName != '' && orderOrCartonName != 'null')
					{
						orderOrCartonName=orderOrCartonName.trim();
					}

					 getquickShipOrderDetails = packUtility.getOrdersForQuickship(orderType,whLocation,orderOrCartonName);

					if(getquickShipOrderDetails.length== 0){
						getquickShipOrderDetails = packUtility.getOrdersForQuickship(orderType,whLocation,'',orderOrCartonName);

						if(getquickShipOrderDetails.length > 0){
							quickShipOrdDetails['isValidCarton']=true;
						}
                        else{
                             getquickShipPalletDetails = packUtility.getpalletsForQuickship(orderType, whLocation, orderOrCartonName);
                            log.debug('getquickShipPalletDetails',getquickShipPalletDetails);
                            if (getquickShipPalletDetails.length > 0) {
                                orderOrCartonName = getquickShipPalletDetails[0]['orderName'];
                                log.debug('orderOrCartonName', orderOrCartonName);
                                getquickShipOrderDetails = packUtility.getOrdersForQuickship(orderType, whLocation, orderOrCartonName);
                            }
                        }
					}
					debugString = debugString + 'getquickShipOrderDetails:' + getquickShipOrderDetails;
					log.debug('getquickShipOrderDetails',getquickShipOrderDetails);
					if(getquickShipOrderDetails.length > 0){
						orderInternalId = getquickShipOrderDetails[0]['internalid'];
						var orderDetails = [];
						var orderIdObj = {};
						var orderDetailsObj = {};
						for (var i = 0; i < getquickShipOrderDetails.length; i++)
						{	
							if(fromPageId != 'trackingNumberUpdatePage'){
								orderId = getquickShipOrderDetails[i]['id'];
								shipmethod = getquickShipOrderDetails[i]['shipmethod'];
								shipmethodText = getquickShipOrderDetails[i]['shipmethodText'];
							}
							if(!orderIdObj[getquickShipOrderDetails[i].internalid])	{
								orderDetailsObj = {};
								orderDetailsObj.transactionId = getquickShipOrderDetails[i].internalid;
								orderDetailsObj.transactionName = getquickShipOrderDetails[i].tranid;
								orderIdObj[getquickShipOrderDetails[i].internalid] = true;
								orderDetails.push(orderDetailsObj);
							}
							if(utility.isValueValid(shipmethod) && vShipMethodArr.indexOf(parseInt(shipmethod)) == -1)
							{
								vShipMethodArr.push(parseInt(shipmethod));
								vShipMethodTextArr.push(shipmethodText);

								Quickshpflag=packUtility.getQuickShipFlagbyShipmethod(shipmethod);

								if (Quickshpflag== true || Quickshpflag== 'true' )
									vquickShipMethodArr.push(parseInt(shipmethod));
							}
						}
						quickShipOrdDetails.orderDetails = orderDetails;
						log.debug('orderDetails',orderDetails);
						log.debug('vShipMethodArr',vShipMethodArr);
						if(quickShipOrdDetails['isValidCarton']== true){
							var cartonDtlObj = packUtility.getQSCartonList(orderInternalId,vquickShipMethodArr,whLocation,orderOrCartonName);
							log.debug('cartonDtlObj',cartonDtlObj);
							quickShipOrdDetails['cartonNum'] = cartonDtlObj[0]['contentsdescription'];
							quickShipOrdDetails['pckgWeight'] = cartonDtlObj[0]['weightinlbs'];
						}
						if( vShipMethodArr.length > 0)
						{
							if(vquickShipMethodArr.length > 0){
								var crossSubsidiaryFeature = false;
								if(orderType == 'SalesOrd')
								{
									crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
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
								if(orderDetailsSrchResult.length > 0 ){
									if(orderDetailsSrchResult.length == 1 ){
										quickShipOrdDetails['shipaddress'] = orderDetailsSrchResult[0]['shipaddress'];
									}
									if(orderType == 'TrnfrOrd'){
										quickShipOrdDetails['line'] = orderDetailsSrchResult[0]['transferorderitemline'];
										quickShipOrdDetails['quantityuom'] = orderDetailsSrchResult[0]['transferorderquantitycommitted'];
									}else if (orderType == 'SalesOrd'){
										quickShipOrdDetails['line'] = orderDetailsSrchResult[0]['line'];
										quickShipOrdDetails['quantityuom'] = orderDetailsSrchResult[0]['quantityuom'];
									}
								}
                                log.debug('getquickShipPalletDetails',getquickShipPalletDetails.length);
                                log.debug('orderOrCartonName',orderOrCartonName);
								if(getquickShipPalletDetails.length>0)
                                {
                                    var transactionIdArr=[];
                                    var tranIdArr=[];
                                    for (var i = 0; i < getquickShipPalletDetails.length; i++) {

                                        if(utility.isValueValid(getquickShipPalletDetails[i].internalid) && transactionIdArr.indexOf(getquickShipPalletDetails[i].internalid) == -1)
                                        {
                                            transactionIdArr.push(getquickShipPalletDetails[i].internalid)
                                        }
                                        if(utility.isValueValid(getquickShipPalletDetails[i].orderName) && transactionIdArr.indexOf(getquickShipPalletDetails[i].orderName) == -1)
                                        {
                                            tranIdArr.push(getquickShipPalletDetails[i].orderName)
                                        }

                                    }
                                    quickShipOrdDetails['palletName']= getquickShipPalletDetails[0]['pallet'];
                                    quickShipOrdDetails['transactionName']= tranIdArr ;
                                    quickShipOrdDetails['transactionInternalId']= transactionIdArr ;
									quickShipOrdDetails['isValidPallet']='true';
                                }
								else
                                {
                                    quickShipOrdDetails['transactionName']= getquickShipOrderDetails[0]['tranid']  ;
                                    quickShipOrdDetails['transactionInternalId']= orderInternalId ;
                                }
								quickShipOrdDetails['transactionType']= orderType ; 
								quickShipOrdDetails['transactionTypeText']=getquickShipOrderDetails[0]['typeText'];
								quickShipOrdDetails['entity']= getquickShipOrderDetails[0]['altname'] ;
								quickShipOrdDetails['trandate']= getquickShipOrderDetails[0]['trandate'] ;
								quickShipOrdDetails['shipdate']= getquickShipOrderDetails[0]['shipdate'] ;
								quickShipOrdDetails['cartonCount']= getquickShipOrderDetails[0]['contentsdescription'] ;
								quickShipOrdDetails['transferlocationText']= getquickShipOrderDetails[0]['transferlocationText'] ; 
								quickShipOrdDetails['shipviaMethod']= vquickShipMethodArr ;
								quickShipOrdDetails['isValid']=true; 
							}
							else
							{ 
								quickShipOrdDetails['errorMessage']=translator.getTranslationString('QUICKSHIP_VALIDATION.SHIPPING_SERVICELEVL'); 
								quickShipOrdDetails['isValid']=false;
							}
						}
						else
						{
							if(fromPageId != 'trackingNumberUpdatePage'){
								quickShipOrdDetails['errorMessage']=translator.getTranslationString('QUICKSHIP_VALIDATION.SHIPPINGMETHOD_NOTMAPPED'); 
								quickShipOrdDetails['isValid']=false; 
							}
						}


					}
					else
					{
							quickShipOrdDetails['errorMessage']=translator.getTranslationString('QUICKSHIP_VALIDATION.INVALID_ORDERORCARTN');
						    quickShipOrdDetails['isValid']=false;

					}

				}
				else {
					if(!utility.isValueValid(whLocation)){
						quickShipOrdDetails['errorMessage']=translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
						quickShipOrdDetails['isValid']=false;
					}
					else
					{ 
						quickShipOrdDetails['errorMessage']=translator.getTranslationString('QUICKSHIP_VALIDATION.INVALID_ORDERORCARTN'); 
					    quickShipOrdDetails['isValid']=false;
					}
				}
			}
			else
			{
				quickShipOrdDetails['errorMessage']=translator.getTranslationString('QUICKSHIP_VALIDATION.EMPTY_ORDERORCARTN');
				quickShipOrdDetails['isValid']=false;
			}
			log.debug('quickShipOrdDetails',quickShipOrdDetails);
		}
		catch(e)
		{
			quickShipOrdDetails['isValid'] = false;
			quickShipOrdDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString}); 
		}

		return quickShipOrdDetails;
	}


	return {
		post: doPost

	};
});