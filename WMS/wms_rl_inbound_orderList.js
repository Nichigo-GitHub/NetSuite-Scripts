/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','N/query','N/search','./wms_inboundUtility'],
		/**
		 * @param {search} search
		 */
		function (utility,translator,query,search,inboundUtility) {

	/**
	 * This function is to fetch the valid orders to receive
	 */
	function doPost(requestBody) {
		var transactionType = '';
		var whLocation = '';
		var vendorId ='';

		var debugString = '';
        var warehouseLocationName='';
		try{
			if (utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				debugString = debugString + ",requestParams :"+requestParams;
				transactionType = requestParams.transactionType;
				whLocation = requestParams.warehouseLocationId;
				vendorId = requestParams.vendorId;

                warehouseLocationName=requestParams.warehouseLocationName;
                var itemInternalId = requestParams.finditemInternalId;
				var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
				var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
        log.debug('requestParams',requestParams);
				if (utility.isValueValid(transactionType) && utility.isValueValid(whLocation)) {

					if(transactionType=='purchaseorder')
					{
						var orderListJsonObj = this.getNewOrdList(transactionType,whLocation,vendorId,crossSubsidiaryFeature,centralizesPurchasingandBilling);
						log.debug('orderListJsonObj',orderListJsonObj);
					}
					else
					{
						var orderListJsonObj = this.getOrdList(transactionType,whLocation,vendorId,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName,itemInternalId);
					}

					if (orderListJsonObj != null && orderListJsonObj.length > 0) {
						return {orderList: orderListJsonObj, isValid:true};
					}
					else {

						debugString = debugString + ",else :no data in search result";
						if(transactionType=='transferorder')
						{
							return {errorMessage: translator.getTranslationString('TO_ORDERLIST.NOMATCH'), isValid: false};
						}
						else if(transactionType=='returnauthorization')
						{
							return {errorMessage: translator.getTranslationString('RMA_ORDERLIST.NOMATCH'), isValid: false};
						}
						else
						{
							return {errorMessage: translator.getTranslationString('PO_ORDERLIST.NOMATCH'), isValid: false};
						}
					}
				}
				else {
					return {errorMessage: translator.getTranslationString('ORDERLIST.NOMATCH'), isValid: false};
				}
			}
			else {
				return {errorMessage: translator.getTranslationString('ORDERLIST.NOMATCH'), isValid: false};
			}
		}
		catch(e)
		{
			var orderList ={};
			orderList['isValid'] = false;
			orderList['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
			return orderList;
		}
	}

	function getNewOrdList(transactionType, warehouseLocation,vendorID,crossSubsidiaryFeature,centralizesPurchasingandBilling) {

		const myTransactionQuery= query.create({
			type: query.Type.TRANSACTION
		});

		const myTransactionQueryline = myTransactionQuery.join({
			fieldId: 'transactionlines'

		});

		const myTransactionvendor = myTransactionQuery.join({
			fieldId: 'entity^entity'

		});
		
		const myTransactiondropship = myTransactionQuery.join({
			fieldId: 'transactionlines.previouslinks'

		});
		
		
		var condOrdType = myTransactionQuery.createCondition({
			fieldId: 'type',
			operator: query.Operator.ANY_OF,
			values: 'PurchOrd'
		});

		var condQunatity = myTransactionQueryline.createCondition({
			fieldId: 'quantity',
			operator: query.Operator.GREATER,
			values: 0
		});
		var condOrdStatus = myTransactionQuery.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['PurchOrd:B','PurchOrd:E','PurchOrd:D']
		});

		var condOrdMainline = myTransactionQueryline.createCondition({
			fieldId: 'mainline',
			operator: query.Operator.IS,
			values: false
		});

		var condOrdTaxline = myTransactionQueryline.createCondition({
			fieldId: 'taxline',
			operator: query.Operator.IS,
			values: false
		});
		var condOrdClose = myTransactionQueryline.createCondition({
			fieldId: 'isclosed',
			operator: query.Operator.IS,
			values: false
		});


		if(crossSubsidiaryFeature == true && transactionType=='returnauthorization')
		{
			var condOrdlocation = myTransactionQueryline.createCondition({
				fieldId: 'inventorylocation',
				operator: query.Operator.ANY_OF,
				values: warehouseLocation
			});



		}
		else {
			if (transactionType == 'transferorder') {


				var condOrdlocation = myTransactionQueryline.createCondition({
					fieldId: 'transferlocation',
					operator: query.Operator.ANY_OF,
					values: warehouseLocation
				});
			} else {
				if (centralizesPurchasingandBilling == true) {

					var condOrdlocation = myTransactionQuery.createCondition({
						formula: 'CASE WHEN {transactionlines.targetlocation} IS NULL THEN {transactionlines.location} ELSE{transactionlines.targetlocation} END',
						operator: query.Operator.ANY_OF,
						values: warehouseLocation,
						type: query.ReturnType.FLOAT

					});




				} else {
					var condOrdlocation = myTransactionQueryline.createCondition({
						fieldId: 'location',
						operator: query.Operator.ANY_OF,
						values: warehouseLocation
					});
				}
			}
		}
		condOrdDropship = myTransactiondropship.createCondition({
			fieldId: 'linktype',				
			operator: query.Operator.ANY_OF_NOT,
			values: 'DropShip'
		});

		if(utility.isValueValid(vendorID))
		{

			condOrdvendor = myTransactionQuery.createCondition({
				fieldId: 'entity',				
				operator: query.Operator.ANY_OF,
				values: vendorID
			});


		}

		if(utility.isValueValid(vendorID))
		{
			myTransactionQuery.condition = myTransactionQuery.and(
					condOrdType,condQunatity,condOrdStatus,condOrdMainline,condOrdTaxline,condOrdClose,condOrdlocation,condOrdDropship,condOrdvendor);
		}
		else
		{
			myTransactionQuery.condition = myTransactionQuery.and(
					condOrdType,condQunatity,condOrdStatus,condOrdMainline,condOrdTaxline,condOrdClose,condOrdlocation,condOrdDropship);
		}



		myTransactionQuery.columns = [

			myTransactionQuery.createColumn({
				fieldId: 'tranid',
				groupBy: true
			}),
			myTransactionQuery.createColumn({
				fieldId: "id",
				groupBy: true
			}),   

			myTransactionQuery.createColumn({
				fieldId: 'trandate',
				groupBy: true
			}),
			myTransactionQuery.createColumn({
				fieldId: 'duedate',
				groupBy: true
			}),


			myTransactionQueryline.createColumn({
				fieldId: 'location',
				groupBy: true
			}),


			myTransactionQueryline.createColumn({
				fieldId: 'quantity',
				aggregate: query.Aggregate.SUM
			}),


			myTransactionQueryline.createColumn({
				fieldId: 'linesequencenumber',
				aggregate: query.Aggregate.COUNT
			}),


			myTransactionvendor.createColumn({
				fieldId: 'entityid',
				groupBy: true
			}),


			];

		myTransactionQuery.sort = [

			myTransactionQuery.createSort({
				column: myTransactionQuery.columns[1],
				ascending: false
			})
			];


		var poListDetailsArr=[];

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
					convertToJsonObj(resultObj,poListDetailsArr,columnsObj)
				}
			}
		});



		return poListDetailsArr;



	}

	function convertToJsonObj(result,poListDetailsArr,columnsObj)
	{

		var columns = columnsObj;
		var  values = result.values;

		var poListObj = {};
		for(var col in columns)
		{

			var colName = columns[col]['fieldId'];
			if(colName == 'linesequencenumber')
			{
				colName ='line'
			}
			if(colName == 'trandate')
			{
				colName ='datecreated'
			}
			if(colName == 'id')
			{
				colName ='internalid'
			}
			poListObj[colName ] = values[col];  

		}
		poListDetailsArr.push(poListObj); 
		//return resultArr;
	}
	function getOrdList(transactionType, warehouseLocation,vendorID,crossSubsidiaryFeature,centralizesPurchasingandBilling,warehouseLocationName,itemInternalId) {




		var orderSearchName = 'customsearch_wms_polistdetails';
		if(transactionType=='transferorder')
		{
			orderSearchName = 'customsearch_wmsse_rcv_to_details';
		}
		else if(transactionType =='returnauthorization')
		{
			orderSearchName = 'customsearch_wmsse_rcv_rma_details';

		}
		var OrdLineDetailsSearch = search.load({
			id: orderSearchName
		});

		var mySearchFilter = [];
		mySearchFilter = OrdLineDetailsSearch.filters;
		/*mySearchFilter.push(search.createFilter({
			name: 'type',
			operator: search.Operator.ANYOF,
			values: vType
		}));*/
        if(transactionType =='returnauthorization' && utility.isValueValid(itemInternalId))
        {
            mySearchFilter.push(search.createFilter({
                name: 'item',
                operator: search.Operator.ANYOF,
                values: itemInternalId
            }));


        }

		if(crossSubsidiaryFeature == true && transactionType=='returnauthorization')
		{
			mySearchFilter.push(search.createFilter({
				name: 'inventorylocation',
				operator: search.Operator.ANYOF,
				values: warehouseLocation
			}));
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
			}

			}


		if(utility.isValueValid(vendorID))
		{
			mySearchFilter.push(search.createFilter({
				name: 'entity',
				operator: search.Operator.ANYOF,
				values: vendorID
			}));
		}

		OrdLineDetailsSearch.filters = mySearchFilter;
		var OrdLineDetails = utility.getSearchResultInJSON(OrdLineDetailsSearch);
		for(var i in OrdLineDetails){
			if(utility.isValueValid(OrdLineDetails[i]['datecreated'])){
				var index = OrdLineDetails[i]['datecreated'].indexOf(':');
				if(index > 0)
					OrdLineDetails[i]['datecreated'] = OrdLineDetails[i]['datecreated'].substr(0,index-2).trim();
				else
					OrdLineDetails[i]['datecreated'] = OrdLineDetails[i]['datecreated'];
			}
		}
		return OrdLineDetails;
	}

	return {
		'post': doPost,
		getOrdList: getOrdList,
		getNewOrdList:getNewOrdList
	};
});