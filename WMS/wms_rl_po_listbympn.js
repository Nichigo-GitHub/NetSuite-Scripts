/**
 *    Copyright 2023 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','N/query', './wms_inboundUtility','./big'],

		function (search,utility,translator,query,inboundUtility,Big) {

	/**
	 * This function is to fetch the count of valid purchase orders against the MPN	 */
	function doPost(requestBody) {
		var transactionType = '';
		var warehouseLocationId = '';
		var debugString ='';
		var requestParams = '';
		var mpnClickAction = '';
		var selectedorScanedMPN = '';
		var orderListJsonObj = {};
		try{
			if (utility.isValueValid(requestBody)) {
				requestParams= requestBody.params;
				transactionType = requestParams.transactionType;
				warehouseLocationId = requestParams.warehouseLocationId;
				mpnClickAction = requestParams.mpnClickAction;
				selectedorScanedMPN = requestParams.selectedorScanedMPN;

				if (utility.isValueValid(warehouseLocationId))
				{
					if((utility.isValueValid(mpnClickAction)) && (utility.isValueValid(selectedorScanedMPN)) && mpnClickAction == mpnClickAction)//submit button
					{
						orderListJsonObj.selectedorScanedMPN = selectedorScanedMPN;
						orderListJsonObj.isValid = true;
					}
					else if(!utility.isValueValid(mpnClickAction))//load the mpn tabel
					{
						var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();

						var itemArray = getItemsListForMPN();
						log.debug('itemArray check',itemArray);

						var mpnList = getListofMPN(transactionType, warehouseLocationId, centralizesPurchasingandBilling,itemArray);
						log.debug('load mpn table list',mpnList);
						if (mpnList.length == 0) {
							orderListJsonObj = {
								errorMessage: translator.getTranslationString('PO_LISTBYMPN.NOMATCH'),
								isValid: false
							};
						} else {
							orderListJsonObj.mpnList = mpnList;
							orderListJsonObj.isValid = true;
						}
					}
					else
                    {
						orderListJsonObj =  {errorMessage: translator.getTranslationString('PO_MPN.VALIDATION'), isValid: false};
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
		}
		return orderListJsonObj;
	}


function getItemsListForMPN()
{
	var itemArray = [];
	var myItemQuery= query.create({
		type: query.Type.ITEM
	});

	var condNotEmptyMPN = myItemQuery.createCondition({
		fieldId: 'mpn',
		operator: query.Operator.EMPTY_NOT
	});

	myItemQuery.condition = myItemQuery.and(condNotEmptyMPN);
	myItemQuery.columns = [
		myItemQuery.createColumn({
			fieldId: 'id'
		})
	];
	var itemResults1 = myItemQuery.run().results;

	for(var i=0; i<itemResults1.length; i++)
	{
		itemArray.push(itemResults1[i].values[0]);
	}
	return itemArray;
}

function getListofMPN(transactionType,warehouseLocationId,centralizesPurchasingandBilling,itemArray)//check for input parameters
{
                 var mpnListArray = [];
				var myTransactionQuery= query.create({
					type: query.Type.TRANSACTION
				});

				var myTransactionQueryline = myTransactionQuery.join({
					fieldId: 'transactionlines'
				});

				var condNottaxline = myTransactionQueryline.createCondition({
					fieldId: 'taxline',
					operator: query.Operator.IS,
					values: false
				});
				var condNotMainline = myTransactionQueryline.createCondition({
					fieldId: 'mainline',
					operator: query.Operator.IS,
					values: false
				});
				var condNotClosed = myTransactionQueryline.createCondition({
					fieldId: 'isclosed',
					operator: query.Operator.IS,
					values: false
				});
				var condOrdStatus = myTransactionQuery.createCondition({
					fieldId: 'status',
					operator: query.Operator.ANY_OF,
					values: ['PurchOrd:B','PurchOrd:E','PurchOrd:D']
				});
				var condNotEmptyMPN = myTransactionQueryline.createCondition({
					fieldId: 'item^item.mpn',
					operator: query.Operator.EMPTY_NOT
				});
				var qtyCond = myTransactionQuery.createCondition({
					formula:'{transactionlines.quantity} - {transactionlines.quantityshiprecv}',
					operator: query.Operator.GREATER,
					values: 0,
					type : query.ReturnType.FLOAT
				});
				var condTranType = myTransactionQuery.createCondition({
					fieldId: 'type',
					operator: query.Operator.ANY_OF,
					values: 'PurchOrd'
				});

				if (centralizesPurchasingandBilling == true) {
					var condLoc = myTransactionQueryline.createCondition({
						fieldId: 'targetlocation',
						operator: query.Operator.ANY_OF,
						values: warehouseLocationId
					});

				}
				else {

					var condLoc = myTransactionQueryline.createCondition({
						fieldId: 'location',
						operator: query.Operator.ANY_OF,
						values: warehouseLocationId
					});

				}
				myTransactionQuery.condition = myTransactionQuery.and(condNottaxline,condNotMainline,condNotClosed,condOrdStatus,condNotEmptyMPN,condLoc,condTranType,qtyCond);


				myTransactionQuery.columns = [
					myTransactionQueryline.createColumn({
						fieldId: 'item^item.MPN' ,
						groupBy: true ,
						label : 'mpn'
					}),

					myTransactionQuery.createColumn({
						fieldId: 'id' ,
						aggregate: query.Aggregate.COUNT,
						label : 'pocount'
					})
				];

				//var itemResults = myTransactionQuery.run().results;

				var openPutawayDetails = getAllOpentaskOpenPutwayOrderDetails(warehouseLocationId,transactionType,itemArray);
				log.debug('openPutawayDetails',openPutawayDetails);

				var results = myTransactionQuery.runPaged({
					pageSize: 1000
				});
				var iterator = results.iterator();


				iterator.each(function (result) {
					page = result.value;
					itemResults = page.data.results;
					for(var itemResult in itemResults) {
						for (var openTaskItr in openPutawayDetails)
						{
							var opentaskRec = openPutawayDetails[openTaskItr];

							if(itemResults[itemResult].values[0] == opentaskRec.mpn)
							{
								itemResults[itemResult].values[1] = parseInt(itemResults[itemResult].values[1]-1);

							}

						}
						if(itemResults[itemResult].values[1] > 0)
						{
							var currRow = {'mpn':itemResults[itemResult].values[0],'pocount':itemResults[itemResult].values[1]};
							mpnListArray.push(currRow);
						}

					}

				});

				log.debug('mpnListArray',mpnListArray);
				return mpnListArray;

					}

            function getAllOpentaskOpenPutwayOrderDetails(whLocation,transactionType,itemInternalId) {

                var opentaskArr = [];
                var filterStrat = [];
               var opentaskMPNArr = [];
				var mpnResultArray = [];
                if (utility.isValueValid(whLocation))
                {
                    filterStrat.push(search.createFilter({
                        name: 'custrecord_wmsse_wms_location',
                        operator: search.Operator.ANYOF,
                        values: whLocation
                    }));
                }

				filterStrat.push(search.createFilter({
					name:'custrecord_wmsse_nsconfirm_ref_no',
					operator:search.Operator.ANYOF,
					values:['@NONE@']}));

                if (utility.isValueValid(itemInternalId))
                {
                    filterStrat.push(search.createFilter({
                        name:'item',
                        join: 'custrecord_wmsse_order_no',
                        operator: search.Operator.ANYOF,
                        values:itemInternalId}));

                }
                var savedSearch ="customsearch_wms_openputaway_orders_mpn";

                var objOpentaskDetailsSearch = search.load({id: savedSearch});
                var savedFilter = objOpentaskDetailsSearch.filters ;
                objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
                var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);

                var overageReceiveEnabled = false;
                if(transactionType != 'transferorder')
                {
                    overageReceiveEnabled = inboundUtility.getPoOverage(transactionType);//this._getPoOverage(transactionType);
                }
                  
			
                if (objOPentaskDetails != null &&  objOPentaskDetails.length > 0) {
                    var orderInternalIdArray = [];

                    for (var objOPentask in objOPentaskDetails) {
						var opentaskRec = objOPentaskDetails[objOPentask];
						var poId = opentaskRec.internalid;

						var erpReceivedQuantity = 0;
						//var transactionLineCount = opentaskRec['Transaction Line Count'];
						var opentaskQuantity = opentaskRec['OpenTask Quantity'];
						var orderQuantity = opentaskRec.quantityuom;
						var erpReceivedQuantity = opentaskRec.totalReceivedQty;
						var mpnfromOT = opentaskRec.mpn;

						if (!utility.isValueValid(erpReceivedQuantity)) {
							erpReceivedQuantity = 0;
						}
						if (!utility.isValueValid(opentaskQuantity)) {
							opentaskQuantity = 0;
						}
						if (opentaskQuantity > 0) {
						var isLinesToReceive = 0;
						if (opentaskQuantity > 0) {
							//isLinesToReceive = Number(Big(orderQuantity).minus(Big(opentaskQuantity)));
							isLinesToReceive = Number((Big(orderQuantity).minus(Big(opentaskQuantity)).plus(erpReceivedQuantity)));
						}
						//log.debug('isLinesToReceive', isLinesToReceive);

						if ((isLinesToReceive == 0) || ((isLinesToReceive <= 0) && (overageReceiveEnabled == true))) {
							if (opentaskArr.indexOf(poId) == -1) {
								opentaskArr.push(poId);
							}

									var currow = {'mpn':mpnfromOT,'poid':poId};
									mpnResultArray.push(currow);


						} else {
								if (orderInternalIdArray.indexOf(poId) == -1) {
								orderInternalIdArray.push(poId);
								}

									var currow = {'mpn':mpnfromOT,'poid':poId};
									mpnResultArray.push(currow);



						}
					}
                    }
                    log.debug({title:'opentaskArr before remove',details:opentaskArr});
                    log.debug({title:'orderInternalIdArray',details:orderInternalIdArray});
					log.debug({title:'mpnResultArray before splice',details:mpnResultArray});
                    if((utility.isValueValid(opentaskArr)) && (utility.isValueValid(orderInternalIdArray)))
                    {
                        for( var intItr = 0;intItr <orderInternalIdArray.length;intItr++)
                        {

                            var orderId =orderInternalIdArray[intItr];
                            log.debug('orderId check',orderId);
                            if(opentaskArr.indexOf(orderId)!= -1)
                            {

                                var arrIndex = opentaskArr.indexOf(orderId);
								log.debug('arrIndex check',arrIndex);
                                if (arrIndex > -1)
                                    opentaskArr.splice(arrIndex, 1);

                            }
							var arrIndex1 = mpnResultArray.map(function (element) {return element.poid;})
								.indexOf(orderId);
							if (arrIndex1 > -1)
								mpnResultArray.splice(arrIndex1, 1);
                        }

                    }
                }
				log.debug({title:'mpnResultArray after splice',details:mpnResultArray});
				return mpnResultArray;
            }


            return {
		'post': doPost,
		getListofMPN:getListofMPN,
		getItemsListForMPN:getItemsListForMPN,
                getAllOpentaskOpenPutwayOrderDetails:getAllOpentaskOpenPutwayOrderDetails
	};
});
