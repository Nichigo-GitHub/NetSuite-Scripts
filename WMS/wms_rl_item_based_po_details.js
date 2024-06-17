/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define([ 'N/search', './wms_utility' ,'./wms_translator', './wms_inboundUtility','N/query'],

		function (search, utility,translator, inboundUtility,query) {

	/**
	 * This function is to fetch PO details based on the item
	 */
	function doPost(requestBody) {
		var response = {};
		var warehouseLocationId = '';
		var transactionType ='';
		var action = '';
		var itemInternalId = '';
		var itemName = '';
		var debugString = '';
		var warehouseLocationName='';
        var vendorId = '';
        var vendorName = '';
        var mpn ='';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				debugString = debugString + ",requestParams :"+requestParams;
				warehouseLocationId= requestParams.warehouseLocationId;
				transactionType = requestParams.transactionType;
				action = requestParams.action;
				itemInternalId = requestParams.itemInternalId;
				itemName = requestParams.itemName;
				warehouseLocationName=requestParams.warehouseLocationName;
                vendorId = requestParams.vendorId;
                vendorName = requestParams.vendorName;
                mpn = requestParams.mpn;

				if((utility.isValueValid(itemInternalId) || utility.isValueValid(itemName) || utility.isValueValid(mpn)) &&  utility.isValueValid(warehouseLocationId)){
					var itemPOList = [];
					var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
                  log.debug('requestParams',requestParams);
					if(action == 'getPODetails' || action == 'getTODetails'){
                        var itemArray = [];
					    if(utility.isValueValid(mpn))
                        {
                            var myItemQuery= query.create({
                                type: query.Type.ITEM
                            });

                            var condNotEmptyMPN = myItemQuery.createCondition({
                                fieldId: 'mpn',
                                operator: query.Operator.IS,
								values: mpn
                            });

							myItemQuery.condition = myItemQuery.and(condNotEmptyMPN);
                            myItemQuery.columns = [
                                myItemQuery.createColumn({
                                    fieldId: 'id'
                                })
                            ]
                            var itemResults = myItemQuery.run().results;

                            for(var i=0; i<itemResults.length; i++)
                            {
                               itemArray.push(itemResults[i].values[0]);
                            }
                            log.debug('itemArray check',itemArray);

                        }

						var poDetails = search.load({id:'customsearch_basic_po_details_search'});

						if(transactionType == 'transferorder')
						{
							var poDetails = search.load({id:'customsearch_basic_to_details_search'});

							poDetails.filters.push(search.createFilter({
								name : 'transferlocation',
								operator : search.Operator.ANYOF,
								values : warehouseLocationId
							}));
						}
						else
						{
							if(centralizesPurchasingandBilling==true && utility.isValueValid(warehouseLocationName))
							{

								poDetails.filters.push(search.createFilter({
									name: 'formulatext',
									operator: search.Operator.IS,
									formula: "CASE WHEN {targetlocation} IS NULL THEN {location} ELSE{targetlocation} END",
									values: warehouseLocationName
								}));

							}
							else
							{
							poDetails.filters.push(search.createFilter({
								name : 'location',
								operator : search.Operator.ANYOF,
								values : warehouseLocationId
							}));
							}

						}
						log.debug('itemArray itemArray',itemArray);
if(itemArray.length > 0)//this from find po by mpn
{

    poDetails.filters.push(search.createFilter({
        name : 'item',
        operator : search.Operator.ANYOF,
        values : itemArray
    }));
}
else
{

    poDetails.filters.push(search.createFilter({
        name : 'item',
        operator : search.Operator.ANYOF,
        values : itemInternalId
    }));
}


                        if(utility.isValueValid(vendorId) && action == 'getPODetails'){
                            poDetails.filters.push(search.createFilter({
                                name : 'entity',
                                operator : search.Operator.ANYOF,
                                values : ['@NONE@',vendorId]
                            }));
                        }

                        if(itemArray.length > 0)//this from find po by mpn
                        {
                            var openPutawayDetails = inboundUtility.getAllOpentaskOpenPutwayOrderDetails(warehouseLocationId, transactionType, itemArray);
                        }
                        else
                        {
                            var openPutawayDetails = inboundUtility.getAllOpentaskOpenPutwayOrderDetails(warehouseLocationId, transactionType, itemInternalId);
                        }
						if(openPutawayDetails.length > 0)
						{
							poDetails.filters.push(search.createFilter({
								name: 'internalid',
								operator: search.Operator.NONEOF,
								values: openPutawayDetails
							}));
						}

						poResults = utility.getSearchResultInJSON(poDetails);
                        log.debug('poResults', poResults);
						if(poResults.length != 0){
							for(var i in poResults){
								poResults[i]['quantity'] = poResults[i]['quantityuom'] + (poResults[i]['unitText'] == '' ? '' : ' ' + poResults[i]['unitText']);
							}
							response['poResults'] = poResults;
							response['isValid'] = true;
						}else{
							response['isValid'] = false;
                            //response['errorMessage'] = 'No PO found with the search item';
						}
					}
					else{
						var itemRes = utility.getSKUIdWithName(itemName,warehouseLocationId,'','',true);
						if(itemRes.length > 0){
							var itemArray = [];
							for(var i in itemRes){
								itemArray.push(itemRes[i]['id']);
							}
							if(transactionType!='returnauthorization') {
								if (transactionType == 'transferorder') {
									var itemPOSearch = search.load({id: 'customsearch_item_based_to_search'});

									itemPOSearch.filters.push(search.createFilter({
										name: 'transferlocation',
										operator: search.Operator.ANYOF,
										values: warehouseLocationId
									}));

								} else if (transactionType == 'purchaseorder') {
									var itemPOSearch = search.load({id: 'customsearch_item_based_po_search'});


									if (centralizesPurchasingandBilling == true) {
										itemPOSearch.filters.push(search.createFilter({
											name: 'targetlocation',
											operator: search.Operator.ANYOF,
											values: warehouseLocationId
										}));
									} else {
										itemPOSearch.filters.push(search.createFilter({
											name: 'location',
											operator: search.Operator.ANYOF,
											values: warehouseLocationId
										}));
									}

								}
								itemPOSearch.filters.push(search.createFilter({
									name : 'item',
									operator : search.Operator.ANYOF,
									values : itemArray
								}));
								var openPutawayDetails = inboundUtility.getAllOpentaskOpenPutwayOrderDetails(warehouseLocationId,transactionType,itemArray);
								if(openPutawayDetails.length > 0)
								{
									itemPOSearch.filters.push(search.createFilter({
										name: 'internalid',
										operator: search.Operator.NONEOF,
										values: openPutawayDetails
									}));
								}
								var objItemDetails = utility.getSearchResultInJSON(itemPOSearch);
								for (var itemDetail in objItemDetails) {
									objitemDetailsRec = objItemDetails[itemDetail];
									var description = objitemDetailsRec['salesdescription'];
									if(description == '- None -'){
										objitemDetailsRec['salesdescription'] = "";
									}
									itemPOList[itemPOList.length]=objitemDetailsRec;
								}
							}
                            else{
								var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
								const myTransactionQuery= query.create({
									type: query.Type.TRANSACTION,
									});
								var condOrdType = myTransactionQuery.createCondition({
									fieldId: 'type',
									operator: query.Operator.ANY_OF,
									values: 'RtnAuth'
								});
								var condOrdStatus = myTransactionQuery.createCondition({
									fieldId: 'status',
									operator: query.Operator.ANY_OF,
									values: ["RtnAuth:B","RtnAuth:D","RtnAuth:E"]
								});

								var condOrdMainline = myTransactionQuery.createCondition({
									fieldId: 'transactionlines.mainline',
									operator: query.Operator.IS,
									values: false
								});
                                var condOrdComponentLines = myTransactionQuery.createCondition({
                                        fieldId: 'transactionlines.kitmemberof',
                                        operator: query.Operator.EMPTY
                                    });
								var condOrdlocation =  myTransactionQuery.createCondition({
									fieldId: 'transactionlines.location',
									operator: query.Operator.ANY_OF,
									values: warehouseLocationId
								});
								if(crossSubsidiaryFeature == true )
								{
									 condOrdlocation = myTransactionQuery.createCondition({
										fieldId: 'transactionlines.inventorylocation',
										operator: query.Operator.ANY_OF,
										values: warehouseLocationId
									});
								}
								var condOrdTaxline = myTransactionQuery.createCondition({
									fieldId: 'transactionlines.taxline',
									operator: query.Operator.IS,
									values: false
								});
								var condOrdClose = myTransactionQuery.createCondition({
									fieldId: 'transactionlines.isclosed',
									operator: query.Operator.IS,
									values: false
								});

								var conditem = myTransactionQuery.createCondition({
									fieldId: 'transactionlines.item',
									operator: query.Operator.ANY_OF,
									values: itemArray
								});
								myTransactionQuery.columns = [

									myTransactionQuery.createColumn({
										fieldId: 'transactionlines.item',
										groupBy: true
									}),
									myTransactionQuery.createColumn({
										fieldId: 'transactionlines.item^item.fullname',
										groupBy: true
									}),
									myTransactionQuery.createColumn({
										fieldId: "transactionnumber",
										aggregate: query.Aggregate.COUNT,
										label : "Transaction Number"
									}),

									myTransactionQuery.createColumn({
										fieldId: 'transactionlines.item^item.description',
										groupBy: true
									})
								];
								myTransactionQuery.condition = myTransactionQuery.and(
									condOrdType,condOrdStatus,condOrdMainline,condOrdlocation,
									condOrdTaxline,condOrdClose,condOrdComponentLines,conditem);


								var myPagedData = myTransactionQuery.runPaged({
									pageSize: 1000
								});
								myPagedData.pageRanges.forEach(function (pageRange) {
									var myPage = myPagedData.fetch({
										index: pageRange.index
									});
									var resultSetObj =  myPage.data;
									if(resultSetObj!=null && resultSetObj!='')
									{
										var resultsObj = resultSetObj.results;
										var columnsObj = resultSetObj.columns;
										for (var row in resultsObj)
										{
											var resultObj = resultsObj[row];
											//log.debug('resultObj',resultObj);
											var columns = columnsObj;
											var  values = resultObj.values;

											var poListObj = {};
											for(var col in columns)
											{

												var colName = columns[col]['fieldId'];
												if(colName == 'transactionlines.item')
												{
													colName ='item'
												}
												if(colName == 'transactionlines.item^item.fullname')
												{
													colName ='itemText'
												}
												if(colName == 'transactionlines.item^item.description')
												{
													colName ='salesdescription'
												}
												poListObj[colName ] = values[col];

											}
											if(parseInt(poListObj["transactionnumber"]) > 0) {
												itemPOList.push(poListObj);
											}
										}
									}
								});
							  }
						log.debug({title:'itemPOList',details:itemPOList});

							response['itemPOList'] = itemPOList;
							response['isValid']=true;
						}else{
							response['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INVALID_ITEM');
							response['isValid'] = false;
						}
					}
				}
				else{
					response['errorMessage'] = translator.getTranslationString('CREATE_INVENTORY.INVALID_ITEM');
					response['isValid'] = false;
				}
			}else{
				response['isValid'] = false;
			}
		}catch(e)
		{
			response['isValid'] = false;
			response['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return response;
	}
	return {
		'post': doPost,
	};
});
