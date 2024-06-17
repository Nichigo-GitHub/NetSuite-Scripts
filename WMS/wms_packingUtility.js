/**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search','N/runtime','N/record','N/query','./wms_utility','./big','N/task','N/format'],
		function (search,runtime,record,query,utility,Big,task,format) {

	function getOrdersForQuickship(transactionType,warehouseLocationId,transactionName,cartonName)
	{    	
		var searchName ="customsearch_wms_quickship_so_orders";    	
		if(transactionType == 'TrnfrOrd')
		{
			searchName = "customsearch_wms_quickship_to_orders";
		}
		var orderDetailsSearch = search.load({id:searchName});
		var orderFilters = orderDetailsSearch.filters;
		if(utility.isValueValid(warehouseLocationId))
		{
			orderFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:warehouseLocationId}));
		}
		if(utility.isValueValid(transactionName))
		{
			orderFilters.push(search.createFilter({
				name: 'tranid',
				join: 'createdfrom',
				operator: search.Operator.IS,
				values: transactionName
			}));
		}
		if(utility.isValueValid(cartonName))
		{
			orderFilters.push(search.createFilter({
				name       : 'contentsdescription',
				join       : 'shipmentpackage',
				operator   :  search.Operator.IS,
				values     : cartonName
			}));
			orderFilters.push(search.createFilter({
				name       : 'trackingnumber',
				join       : 'shipmentpackage',
				operator   :  search.Operator.ISEMPTY
			}));
		}
		orderDetailsSearch.filters = orderFilters;
		var	 orderSearchDetails = utility.getSearchResultInJSON(orderDetailsSearch);
		return orderSearchDetails;
	}
	function _getOrdersCountForQuickship(transactionType,warehouseLocationId,transactionName,cartonName)
	{    	
		var searchName ="customsearch_wms_quickship_so_orders";    	
		if(transactionType == 'TrnfrOrd')
		{
			searchName = "customsearch_wms_quickship_to_orders";
		}
		var orderDetailsSearch = search.load({id:searchName});
		var orderFilters = orderDetailsSearch.filters;
		if(utility.isValueValid(warehouseLocationId))
		{
			orderFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:warehouseLocationId}));
		}
		if(utility.isValueValid(transactionName))
		{
			orderFilters.push(search.createFilter({
				name: 'tranid',
				join: 'createdfrom',
				operator: search.Operator.IS,
				values: transactionName
			}));
		}
		if(utility.isValueValid(cartonName))
		{
			orderFilters.push(search.createFilter({
				name       : 'contentsdescription',
				join       : 'shipmentpackage',
				operator   :  search.Operator.IS,
				values     : cartonName
			}));
			orderFilters.push(search.createFilter({
				name       : 'trackingnumber',
				join       : 'shipmentpackage',
				operator   :  search.Operator.ISEMPTY
			}));
		}
		orderDetailsSearch.filters = orderFilters;
		return utility.getSearchResultCount(orderDetailsSearch);
	}


			function getpalletsForQuickship(transactionType,warehouseLocationId,palletName,cartonName,orderName,palletListPage)
			{
				var palletQuery = query.create({
					type: 'customrecord_wmsse_ship_manifest'
				});
				palletQuery.columns =[];
				if(palletListPage)
				{
					palletQuery.columns = [
						palletQuery.createColumn({
							fieldId: 'custrecord_wmsse_ship_contlp',
							aggregate: query.Aggregate.COUNT,
							alias: 'contentsdescription'

						}),
						palletQuery.createColumn({
							fieldId: 'custrecord_wmsse_pallet',
							groupBy: true,
							alias: 'pallet'
						}),
						palletQuery.createColumn({
							fieldId: 'custrecord_wmsse_ship_servicelevel'
							,groupBy: true,
							alias: 'servicelevel'
						}),
						palletQuery.createColumn({
							fieldId: 'custrecord_wmsse_ship_consignee'
							,groupBy: true,
							alias: 'entity'
						}),
						palletQuery.createColumn({
							fieldId: 'custrecord_wmsse_ship_contlp',
							groupBy: true,
							alias: 'cartonName'

						})
					]
					palletQuery.sort = [
						palletQuery.createSort({
							column: palletQuery.columns[1],
							ascending: true
						})
					];
				}
				else {
				palletQuery.columns = [
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_ship_contlp',
						aggregate: query.Aggregate.COUNT,
						alias: 'contentsdescription'

					}),
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_pallet',
						groupBy: true,
						alias: 'pallet'
					}),
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_ship_servicelevel'
						,groupBy: true,
						alias: 'servicelevel'
					}),
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_ship_order'
						,groupBy: true,
						alias: 'internalid'
					}),
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_ship_orderno'
						,groupBy: true,
						alias: 'orderName'
					}),
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_ship_consignee'
						,groupBy: true,
						alias: 'entity'
					})
				]

				palletQuery.sort = [

						palletQuery.createSort({
							column: palletQuery.columns[3],
							ascending: true
						})
					];
				}


				var palletCon = palletQuery.createCondition({
					fieldId: 'custrecord_wmsse_pallet',
					operator: query.Operator.EMPTY_NOT
				})
				var voidFlagCon = palletQuery.createCondition({
					fieldId: 'custrecord_wmsse_ship_void',
					operator: query.Operator.IS,
					values: 'N'
				})
				var locationCon = palletQuery.createCondition({
					fieldId: 'custrecord_wmsse_ship_location',
					operator: query.Operator.IS,
					values: warehouseLocationId
				});
				if(utility.isValueValid(palletName)) {
					var palletNameCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_pallet',
						operator: query.Operator.IS,
						values: palletName
					});
				}

				if(utility.isValueValid(cartonName)) {
					var cartonCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_ship_contlp',
						operator: query.Operator.IS,
						values: cartonName
					});
				}
				
				if(utility.isValueValid(orderName)) {
					var orderCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_ship_orderno',
						operator: query.Operator.IS,
						values: orderName
					});
				}
				
				if(utility.isValueValid(transactionType)) {
					var trantypeCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_ship_order^transaction.type',
						operator: query.Operator.ANY_OF,
						values: transactionType
					});
				}
				
				if(utility.isValueValid(palletName)) {

					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,palletNameCon,trantypeCon);
				}
				else if(utility.isValueValid(cartonName))
				{
					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,cartonCon,trantypeCon);
				}
				else if(utility.isValueValid(orderName)){
					
					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,orderCon,trantypeCon);
				}
				else
				{
					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,trantypeCon);
				}




				var result= palletQuery.run().asMappedResults()
				return result;
			}


			function getCartonForQuickship(transactionType,warehouseLocationId,palletName,orderInternalId,cartonNo)
			{
				var palletQuery = query.create({
					type: 'customrecord_wmsse_ship_manifest'
				});
				palletQuery.columns = [
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_ship_contlp',
						groupBy: true,
						alias: 'cartons'

					}),
					palletQuery.createColumn({
						fieldId: 'custrecord_wmsse_pallet',
						groupBy: true,
						alias: 'pallet'
					}),
                    palletQuery.createColumn({
                        fieldId: 'custrecord_wmsse_ship_order'
                        ,groupBy: true,
                        alias: 'internalid'
                    }),
                    palletQuery.createColumn({
                        fieldId: 'custrecord_wmsse_ship_orderno'
                        ,groupBy: true,
                        alias: 'orderName'
                    }),


				]

				var palletCon = palletQuery.createCondition({
					fieldId: 'custrecord_wmsse_pallet',
					operator: query.Operator.EMPTY_NOT
				})
				var voidFlagCon = palletQuery.createCondition({
					fieldId: 'custrecord_wmsse_ship_void',
					operator: query.Operator.IS,
					values: 'N'
				})
				var locationCon = palletQuery.createCondition({
					fieldId: 'custrecord_wmsse_ship_location',
					operator: query.Operator.IS,
					values: warehouseLocationId
				});
				if(utility.isValueValid(palletName)) {
					var palletNameCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_pallet',
						operator: query.Operator.IS,
						values: palletName
					});
				}
				if(utility.isValueValid(orderInternalId)) {
					var orderNameCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_ship_order',
						operator: query.Operator.ANY_OF,
						values: orderInternalId
					});
				}
				if(utility.isValueValid(cartonNo)) {
					var cartonNameCon = palletQuery.createCondition({
						fieldId: 'custrecord_wmsse_ship_contlp',
						operator: query.Operator.IS,
						values: cartonNo
					});
				}


				if(utility.isValueValid(palletName)) {

					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,palletNameCon);
				}
				else if(utility.isValueValid(orderInternalId)) {

					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,orderNameCon);
				}
				else if(utility.isValueValid(cartonNo)) {

					palletQuery.condition = palletQuery.and(palletCon,voidFlagCon,locationCon,cartonNameCon);
				}

				var result= palletQuery.run().asMappedResults()
				return result;
			}

	function getQuickShipFlagbyShipmethod(shipmethod)
	{
		log.debug({title:'shipmethod',details:shipmethod});
		var quickShipFalg= false;
		if(utility.isValueValid(shipmethod))
		{
			var shipMethodSearch = search.load({id:'customsearch_wmsse_getquickshipflag'});
			var shipmethodFilters = shipMethodSearch.filters;

			shipmethodFilters.push(search.createFilter({
				name:'custrecord_wmsse_carrier_nsmethod',
				operator:search.Operator.ANYOF,
				values:shipmethod}));

			shipMethodSearch.filters = shipmethodFilters;
			var	shipMethodSearchDetails = utility.getSearchResultInJSON(shipMethodSearch);    	
			if(shipMethodSearchDetails!=null && shipMethodSearchDetails !='')
			{
				quickShipFalg=shipMethodSearchDetails[0]['custrecord_wmsse_carrier_allow_quickship']; 
			}	
		}
		log.debug({title:'quickShipFalg',details:quickShipFalg});

		return quickShipFalg;
	}

			function getQuickShipFlagbyPalletShipmethod(shipmethod)
			{
				log.debug({title:'shipmethod',details:shipmethod});
				var shipmethodQuery = query.create({
					type: 'customrecord_wmsse_carrier'
				});
				shipmethodQuery.columns = [
					shipmethodQuery.createColumn({
						fieldId: 'custrecord_wmsse_carrier_nsmethod.id',
						alias: 'shipmethod'
					}),
					shipmethodQuery.createColumn({
						fieldId: 'custrecord_wmsse_carrier_nsmethod.itemid',
						alias: 'shipmethodname'
					}),
					shipmethodQuery.createColumn({
						fieldId: 'custrecord_wmsse_carrier_allow_quickship',
						alias: 'quickshipflag'
					})
				]
				if(utility.isValueValid(shipmethod)) {
					var shipMethodCon = shipmethodQuery.createCondition({
						fieldId: 'custrecord_wmsse_carrier_nsmethod.itemid',
						operator: query.Operator.IS,
						values: shipmethod
					})

				shipmethodQuery.condition = shipmethodQuery.and(shipMethodCon);
				}
				var result= shipmethodQuery.run().asMappedResults()
				return result;
			}
			function getQSCartonList(transactionInternalId,shipMethodArray,wareHouseLocation,cartonId)
	{
		var cartonDetailsSrch = search.load({
			id : 'customsearch_wms_quickship_carton_list'
		});

		var cartonDtlFilterArr = cartonDetailsSrch.filters;


		if(utility.isValueValid(transactionInternalId))
		{
			cartonDtlFilterArr.push(search.createFilter({
				name : 'internalid',
				join : 'createdfrom',
				operator : search.Operator.ANYOF,
				values : transactionInternalId
			}));
		}
		if( shipMethodArray.length > 0)
		{
			cartonDtlFilterArr.push(search.createFilter({
				name : 'shipmethod',
				operator : search.Operator.ANYOF,
				values : shipMethodArray
			}));
		}
		else{
		cartonDtlFilterArr.push(search.createFilter({
				name : 'shipmethod',
				operator : search.Operator.NONEOF,
				values : ['@NONE@']
			}));
			}
		cartonDtlFilterArr.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: wareHouseLocation
		}));

		// this gets added during the carton Validation
		if(utility.isValueValid(cartonId))
		{
			cartonDtlFilterArr.push(search.createFilter({
				// name : 'packagedescr',
				// join : 'package',
				name       : 'contentsdescription',
				join          : 'shipmentpackage',
				operator  :  search.Operator.IS,
				values        : cartonId
			}));
		}

		cartonDetailsSrch.filters = cartonDtlFilterArr;
		var CartonListDetailsResult = utility.getSearchResultInJSON(cartonDetailsSrch);

		return CartonListDetailsResult;
	}



            function getQSCartonpalletList(transactionInternalId,shipMethodArray,wareHouseLocation,cartonId)
            {
                var cartonDetailsSrch = search.load({
                    id : 'customsearch_wms_ship_pallet_carton_list'
                });

                var cartonDtlFilterArr = cartonDetailsSrch.filters;


                if(utility.isValueValid(transactionInternalId))
                {
                    cartonDtlFilterArr.push(search.createFilter({
                        name : 'internalid',
                        join : 'createdfrom',
                        operator : search.Operator.ANYOF,
                        values : transactionInternalId
                    }));
                }
                if( shipMethodArray.length > 0)
                {
                    cartonDtlFilterArr.push(search.createFilter({
                        name : 'shipmethod',
                        operator : search.Operator.ANYOF,
                        values : shipMethodArray
                    }));
                }
                cartonDtlFilterArr.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: wareHouseLocation
                }));

                // this gets added during the carton Validation
                if(utility.isValueValid(cartonId))
                {
                    cartonDtlFilterArr.push(search.createFilter({
                        // name : 'packagedescr',
                        // join : 'package',
                        name       : 'contentsdescription',
                        join          : 'shipmentpackage',
                        operator  :  search.Operator.IS,
                        values        : cartonId
                    }));
                }

                cartonDetailsSrch.filters = cartonDtlFilterArr;
                var CartonListDetailsResult = utility.getSearchResultInJSON(cartonDetailsSrch);

                return CartonListDetailsResult;
            }

	function fnIsContainerLpExist(vContLpNo,vOrderNumber)
	{
		log.debug( 'Into IsContLpExist',vContLpNo);	
		var IsContLpExist='F';
		var manifestListSearch = search.load({id:'customsearch_wmsse_shipmanifest_details',
			type : 'customrecord_wmsse_ship_manifest' });
		manifestListSearch.filters.push(
				search.createFilter({
					name:'custrecord_wmsse_ship_contlp',
					operator:search.Operator.IS,
					values:vContLpNo
				})
		);
		if(utility.isValueValid(vOrderNumber))
			manifestListSearch.filters.push(
					search.createFilter({
						name:'custrecord_wmsse_ship_order',
						operator:search.Operator.ANYOF,
						values:vOrderNumber
					})
			);


		var	 manifestList = utility.getSearchResultInJSON(manifestListSearch);
		if(manifestList.length>0)
			IsContLpExist='T';	
		log.debug( 'Out of IsContLpExist',IsContLpExist);	
		return IsContLpExist;
	}

	function fnCreateShipManifestRecord(vordNo,vordName, vContLpNo,vCarrierType,vTrackingNo,vActualweight,PackageWeight,vOrderType,whlocation,
			itemFulfillementId,cartonSize,itemId,commodityShipmentDetails,uccNo)
	{
		try {
			log.debug( 'into fnCreateShipManifestRecord','from inside');		
			log.debug( 'Order #',vordNo);
			log.debug( 'vordName #',vordName);
			log.debug( 'Container LP #',vContLpNo);	
			log.debug('Carrier Type',vCarrierType);	
			log.debug('vTrackingNo',vTrackingNo);
			log.debug('trantype', vOrderType);
            log.debug('itemId', itemId);
            log.debug('uccNo', uccNo);

			var shipManifestId  = '';
			var shipManifestArr  = [];
			var shipToCountry = '';
			var tranId= '';
			if (utility.isValueValid( vordNo )) 
			{
				if(fnIsContainerLpExist(vContLpNo,vordNo)!='T')
				{
					var freightterms ="";
					var otherrefnum="";
					var vreference3 = "";
					var trantype = vOrderType;
					var  searchresults={};
					var useItemCostFlag =true;
					var servicelevelvalue;
					var thirdpartyacct = "";
					var freightterms = "";
					var freightvalue = "";
                    var saturdayDeliveryFlag = "";
					var signatureRequiredFlag = "";
					searchresults = orderDetailsList(vordNo,trantype,itemId);
					if(searchresults!=null && searchresults!='')
					{
						vreference3 = searchresults[0]['tranid'];
						otherrefnum=searchresults[0]['otherrefnum'];
						servicelevelvalue= searchresults[0]['shipmethod'];
                        shipToCountry=searchresults[0]['shipcountry'];
						freightterms = searchresults[0]['custbody_wmsse_freighttermsText'];
						thirdpartyacct = searchresults[0]['custbody_wmsse_thirdpartyaccountnumber'];
                        saturdayDeliveryFlag = searchresults[0]['custbody_wmsse_saturdaydelivery'];
						signatureRequiredFlag = searchresults[0]['custbody_wmsse_signiturerequired'];
					}
					else
					{
						searchresults = orderDetailsList(vordNo,trantype);
						if(searchresults!=null && searchresults!='')
						{
							vreference3 = searchresults[0]['tranid'];
							otherrefnum=searchresults[0]['otherrefnum'];
							servicelevelvalue= searchresults[0]['shipmethod'];
							freightterms = searchresults[0]['custbody_wmsse_freighttermsText'];
							thirdpartyacct = searchresults[0]['custbody_wmsse_thirdpartyaccountnumber'];
							shipToCountry=searchresults[0]['shipcountry'];
                            saturdayDeliveryFlag = searchresults[0]['custbody_wmsse_saturdaydelivery'];
							signatureRequiredFlag = searchresults[0]['custbody_wmsse_signiturerequired'];
						}
					}

					log.debug('saturdayDeliveryFlag',saturdayDeliveryFlag);

					log.debug('OrderList details',searchresults);
					tranId = searchresults[0]['tranid'];
					var ShipManifest = record.create({
						type: 'customrecord_wmsse_ship_manifest'
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_order', 
						value : vordNo
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_location', 
						value : whlocation
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_nsconf_no', 
						value : itemFulfillementId
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_pkgtype', 
						value : cartonSize
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_orderno', 
						value : tranId
					});

					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_trackno',
						value :vTrackingNo
					});
					ShipManifest.setValue({
						fieldId: 'custrecord_wmsse_ship_masttrackno',
						value : vTrackingNo
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_actwght',
						value :vActualweight
					});
					ShipManifest.setValue({
						fieldId : 'name',
						value :vordNo
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_ordertype',
						value : searchresults[0]['custbody_wmsse_ordertypeText']
					});	
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_custom5',
						value : 'S'
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_void',
						value : 'N'
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_paymethod',
						value : freightterms
					});

					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_ref2',
						value : otherrefnum
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_pkgcount',
						value : 1
					});

                    ShipManifest.setValue({
                        fieldId : 'custrecord_wmsse_ship_ucccode',
                        value : uccNo
                    });

					if(utility.isValueValid(servicelevelvalue))
					{
						var servicelevelList= getSerViceLevel(servicelevelvalue);
						if(servicelevelList.length>0)
						{
							vcarrier=servicelevelList[0]['custrecord_wmsse_carrier_id']; 

							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_carrier',
								value :vcarrier
							});

							vserlevel=servicelevelList[0]['custrecord_wmsse_carrier_service_level']; 

							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_servicelevel',
								value : vserlevel
							}); 
						}
					}
					
					//Adding Freight Terms and Third Party Account Number
					log.debug('freightterms :', freightterms);
					log.debug('thirdpartyacct :', thirdpartyacct);
					
					if(utility.isValueValid(freightterms)){
						
						if(utility.isValueValid(thirdpartyacct) && freightterms!="SENDER")
						{
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_account',
								value :thirdpartyacct
							});							
						}
						
						if(freightterms=="SENDER")
						{
							freightvalue="SHP";
						}
						if(freightterms=="RECEIVER")
						{
							freightvalue="REC";
						}
						if(freightterms=="3RDPARTY")
						{
							freightvalue="TP";
						}
						
						ShipManifest.setValue({
							fieldId : 'custrecord_wmsse_ship_paymethod',
							value :freightvalue
						});
					}
                    if(utility.isValueValid(saturdayDeliveryFlag)) {
                        ShipManifest.setValue({
                            fieldId: 'custrecord_wmsse_ship_satflag',
                            value: saturdayDeliveryFlag
                        });
                    }
					if(utility.isValueValid(signatureRequiredFlag)) {
						ShipManifest.setValue({
							fieldId: 'custrecord_wmsse_ship_signature_req',
							value: signatureRequiredFlag
						});
					}
					
					
					var contactName=searchresults[0]['shippingattention'];
					var entity=searchresults[0]['entityText'];
					if(utility.isValueValid( contactName))
						contactName=contactName.replace(","," ");

					if(utility.isValueValid( entity))
						entity=entity.replace(","," ");
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_contactname',
						value : contactName
					});		
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_city',
						value :searchresults[0]['shipcity']
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_state',
						value :searchresults[0]['shipstate']
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_country',
						value :searchresults[0]['shipcountry']
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_phone',
						value : searchresults[0]['phone']
					});

					var cashondelivery= searchresults[0]['custbody_wmsse_codflag'];
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_codflag',
						value : cashondelivery
					}); 
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_email',
						value : searchresults[0]['email']
					}); 

					var zipvalue=searchresults[0]['shipzip'];

					var consignee= searchresults[0]['shipaddressee']; 
					var shipcomplete=searchresults[0]['shipcomplete']; 
					var termscondition=searchresults[0]['terms']; 
					var address1=searchresults[0]['shipaddress1'];
					var address2=searchresults[0]['shipaddress2'];
					if(utility.isValueValid( address1) )
						address1=address1.replace(","," ");

					if(utility.isValueValid( address2))
						address2=address2.replace(","," ");

					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_addr1',
						value : address1
					}); 
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_addr2',
						value : address2
					}); 

					var shiptotal="0.00";
				/*	if((shipcomplete=="T")&&(termscondition=="C.O.D."))
					{
						ShipManifest.setValue({
							fieldId : 'custrecord_wmsse_ship_codflag',
							value : 'T'
						});  
						shiptotal=searchresults[0]['total'];
						ShipManifest.setValue({
							fieldId : 'custrecord_wmsse_ship_codamount',
							value : shiptotal
						});  
					}
					else
					{ ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_codflag',
						value : 'F'
					});  
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_codamount',
						value : shiptotal
					}); 

					}*/

					if(utility.isValueValid( consignee))
						ShipManifest.setValue({
							fieldId : 'custrecord_wmsse_ship_consignee',
							value : consignee
						});  
					else
						ShipManifest.setValue({
							fieldId : 'custrecord_wmsse_ship_consignee',
							value : entity
						});  

					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_zip',
						value : zipvalue
					});  



					

					if(trantype=="TrnfrOrd")
					{
						var fromlocation = searchresults[0]['location'];

						var locRecord = search.load({
							id: 'customsearch_wms_location_add_details'
						});
						var locationfilter= locRecord.filters;
						if(utility.isValueValid(fromlocation))
						{
							locationfilter.push(search.createFilter({
								name : 'internalid',
								operator : search.Operator.ANYOF,
								values : fromlocation
							}));
						}

						locRecord.filters = locationfilter;
						var locationSearchResults = utility.getSearchResultInJSON(locRecord);
						log.debug('locationSearchResults' , locationSearchResults);
						if(locationSearchResults !=null)
						{
							var shipFromaddress1 = locationSearchResults[0]['address1'];
							var shipFromaddress2 = locationSearchResults[0]['address2'];
							var shipFromcity =   locationSearchResults[0]['city'];
							var shipFromstate = locationSearchResults[0]['state'];
							var shipFromzipcode = locationSearchResults[0]['zip'];							
							var shipFromcountry = locationSearchResults[0]['country'];
							var shipFromphone = locationSearchResults[0]['phone'];
							var shipfromcompanyname=locationSearchResults[0]['addressee'];
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_city',
								value : shipFromcity
							}); 
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_state',
								value : shipFromstate
							}); 
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_country',
								value : shipFromcountry
							}); 
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_addr1',
								value : shipFromaddress1
							}); 
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_addr2',
								value : shipFromaddress2
							});
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_zip',
								value : shipFromzipcode
							});
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_phone',
								value : shipFromphone
							});
							ShipManifest.setValue({
								fieldId : 'custrecord_wmsse_ship_from_company',
								value : shipfromcompanyname
							});
							
						}
					}

					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_contlp',
						value : vContLpNo
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_ref5',
						value : vContLpNo
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_wmsse_ship_ref3',
						value : vreference3
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_ship_length',
						value : 1
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_ship_width',
						value : 1
					});
					ShipManifest.setValue({
						fieldId : 'custrecord_ship_height',
						value : 1
					});
					if (utility.isValueValid(vContLpNo)) {

						if (PackageWeight == '0.0' || PackageWeight == '0.0000' || PackageWeight == 'undefined' || PackageWeight == '' || PackageWeight == 'NAN' || PackageWeight == 'NaN')
						{
							pakageweight='0.11';

						}
						ShipManifest.setValue({
							fieldId : 'custrecord_wmsse_ship_pkgwght',
							value : PackageWeight
						});
					}

					shipManifestId = ShipManifest.save();
					shipManifestArr.push(shipManifestId);

					if (trantype=="TrnfrOrd" )
						useItemCostFlag = searchresults[0]['istransferpricecosting'];

					shipManifestArr.push(useItemCostFlag);
					log.debug('ShipManifestId' , shipManifestId);


					/**---For international commodity shipment---**/
					log.debug('commodityShipmentDetails in util',commodityShipmentDetails);
					var shipFromCountry = getFromLocationCountry(whlocation);
					log.debug('shipFromCountry',shipFromCountry);
					log.debug('shipToCountry',shipToCountry);
					if( shipFromCountry!=null && shipFromCountry!='' && shipToCountry!=null && shipToCountry!='' && shipFromCountry!=shipToCountry )
					{
						createCommodityShipment(tranId,trantype,vordNo,vContLpNo,PackageWeight,commodityShipmentDetails);
					}

				}
				else
				{
					log.debug('in else' , vContLpNo );

					var shipManifestSearch = search.load({
						id:'customsearch_wmsse_shipmanifest_details',
						type : 'customrecord_wmsse_ship_manifest'
					});

					shipManifestSearch.filters.push(search.createFilter({
						name:'custrecord_wmsse_ship_contlp',
						operator:search.Operator.IS,
						values:vContLpNo
					}));
					shipManifestSearch.filters.push(search.createFilter({
						name:'custrecord_wmsse_ship_order',
						operator:search.Operator.ANYOF,
						values:vordNo
					}));

					var	manifestList = utility.getSearchResultInJSON(shipManifestSearch);
					log.debug('in else' , manifestList);
					log.debug('itemFulfillementId', itemFulfillementId);	       

					if(manifestList.length>0)
					{  
						var strItemFulfillmentId = manifestList[0].custrecord_wmsse_ship_nsconf_no + ',' + itemFulfillementId;
						shipManifestId = record.submitFields({
							type: 'customrecord_wmsse_ship_manifest',
							id: manifestList[0].id,
							values: {
								'custrecord_wmsse_ship_nsconf_no': strItemFulfillmentId							
							}
						});
						log.debug('shipManifestId', shipManifestId);
					}
					shipManifestArr.push(shipManifestId);
				}	
			}
			log.debug('shipManifestArr --', shipManifestArr);
			return shipManifestArr;
		}

		catch (e) {	
			log.error('ERRROR' , e);
		}

	}
	function  orderDetailsList(ordNo,ordType,itemId) {
		log.debug( 'General Functions', 'In to OrderList');
		var searchName = '';
		if(ordType == 'TrnfrOrd')
			searchName = 'customsearch_wms_to_details_quickship';
		else
			searchName = 'customsearch_wms_so_details_quickship';

		var orderDetailsSearch = search.load({
			id:searchName
		});

		orderDetailsSearch.filters.push(
				search.createFilter({
					name:'Internalid',
					operator:search.Operator.IS,
					values:ordNo
				})
		);
		if(utility.isValueValid(itemId) && ordType != 'TrnfrOrd')
			orderDetailsSearch.filters.push(
					search.createFilter({
						name:'item',
						operator:search.Operator.ANYOF,
						values:itemId
					})
			);
		var	 searchresults = utility.getSearchResultInJSON(orderDetailsSearch);


		return searchresults;
	}

	function getSerViceLevel(carrier)
	{
		log.debug( 'carrier in GetSerViceLevel',carrier);	
		var servicelevelList='';
		var serviecLevlSearch = search.load({id:'customsearch_wmsse_getquickshipflag'});

		serviecLevlSearch.filters.push(search.createFilter({
			name:'custrecord_wmsse_carrier_nsmethod',
			operator:search.Operator.ANYOF,
			values:carrier
		}));

		servicelevelList = utility.getSearchResultInJSON(serviecLevlSearch);
		log.debug({title:'servicelevelList',details:servicelevelList});

		return servicelevelList;

	}

	function getShipmethods(){
		var shipMethodSearch = search.load({id:'customsearch_wmsse_getquickshipflag'});
		var	shipMethodSearchDetails = utility.getSearchResultInJSON(shipMethodSearch);    	

		return shipMethodSearchDetails;
	}

	function bindPackingLinesSublist(form,sublistData,sublistCount,Shiparray,listlineNo,tranType,populateWMSCartonFields,
			itemwithSubItemObj)
	{ 
		try { 
			var pickQuantity=sublistData['quantity'];
			var packQuantity=sublistData['packQuantity'];
			var ActQuantity=parseFloat(pickQuantity)-parseFloat(packQuantity);
			var ExpQuantity=ActQuantity;
			var linenum= sublistData['line'];
			var	itemid=sublistData['itemText'];
			var	iteminternalid=sublistData['item'];
			var vShipMethod = sublistData['shipmethod'];
			var vShipMethodText = sublistData['shipmethodText'];
			var orderInternalId = sublistData['createdfrom'];
			var OrderNo =sublistData['createdfromText'];
			var vUnits = sublistData['unitText'];
			var location = sublistData['location'];
			var locationName = sublistData['locationText'];
			var itemfulfillId = sublistData['internalid'];	
			var itemfulfillnum = sublistData['transactionname'];	
			var shipAddress = sublistData['shipaddress'];	
			var entity = sublistData['entity'];	
			var entityName = sublistData['entityText'];	
			var shipCarrier = sublistData['shipcarrier'];
			var shipCarrierText = sublistData['shipcarrierText']; 
			var convRate = sublistData['convRate'];
			var pickCarton='';
			var itemType=sublistData['itemtype'];
			var parentItemName = itemwithSubItemObj[itemfulfillId+'-'+linenum];
      pickCarton = sublistData['pickcarton'];
		

			log.debug({title:'pickCarton',details:pickCarton});
			log.debug({title:'populateWMSCartonFields',details:populateWMSCartonFields});

			var invDtlCount = sublistData['InvDetailCount'];
			if(!(utility.isValueValid(vShipMethod)))
				vShipMethod = '- None -';
			if(!(utility.isValueValid(vShipMethodText)))
				vShipMethodText = '- None -';
			if(!(utility.isValueValid(vUnits)))
				vUnits = '- None -';
			if(!(utility.isValueValid(shipAddress)))
				shipAddress = '- None -';
			if(!(utility.isValueValid(entity)))
				entity = '- None -';
			if(!(utility.isValueValid(shipCarrierText)))
				shipCarrierText = '- None -';
			if(!(utility.isValueValid(invDtlCount)))
				invDtlCount = '- None -';
			if(!(utility.isValueValid(pickCarton)))
				pickCarton = '- None -';
			if(!(utility.isValueValid(itemType)))
				itemType = '- None -';
			if(!(utility.isValueValid(parentItemName)))
				parentItemName = '- None -';
			if(!(utility.isValueValid(convRate)))
				convRate = '';


			log.debug('locationName',locationName); 
			log.debug('vShipMethodText',vShipMethodText); 

			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_listlineno',
				line : sublistCount,
				value : listlineNo
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_orderinternalid',
				line : sublistCount,
				value : orderInternalId
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_ordernumber',
				line : sublistCount,
				value : OrderNo
			});
			if(tranType == 'SalesOrd')
				form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
					id : 'custpage_entityname',
					line : sublistCount,
					value : entityName
				});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_fulfillnumber',
				line : sublistCount,
				value : itemfulfillnum
			});

			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_skuinternalid',
				line : sublistCount,
				value : iteminternalid
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_sku',
				line : sublistCount,
				value : itemid
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_skusubitemof',
				line : sublistCount,
				value : parentItemName
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_lineno',
				line : sublistCount,
				value : linenum
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_pickqty',
				line : sublistCount,
				value : pickQuantity
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_packqty',
				line : sublistCount,
				value : packQuantity
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_actqty',
				line : sublistCount,
				value : ActQuantity
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_actqtyhddn',
				line : sublistCount,
				value : ActQuantity
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_expqtyhddn',
				line : sublistCount,
				value : ExpQuantity
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_locationhddn',
				line : sublistCount,
				value : location
			});

			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_shipmethodid',
				line : sublistCount,
				value : vShipMethod
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_shipmethodtext',
				line : sublistCount,
				value : vShipMethodText
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_shipmethodid',
				line : sublistCount,
				value : vShipMethod
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_locationname',
				line : sublistCount,
				value : locationName
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_itemfulfillid',
				line : sublistCount,
				value : itemfulfillId
			}); 
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_units',
				line : sublistCount,
				value : vUnits
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_shipaddress',
				line : sublistCount,
				value : shipAddress
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_entity',
				line : sublistCount,
				value : entity
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_inventorydetailhdn',
				line : sublistCount,
				value : 'None'
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_invdtlcount',
				line : sublistCount,
				value : invDtlCount
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_itemtype',
				line : sublistCount,
				value : itemType
			});
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_shipcarriertext',
				line : sublistCount,
				value : shipCarrierText
			});

			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_pickcartonrowwise',
				line : sublistCount,
				value : pickCarton
			});
			if( convRate != undefined && convRate != "" && utility.isValueValid(convRate)) {
				form.getSublist({id: 'custpage_packinglist'}).setSublistValue({
					id: 'custpage_conversionrate',
					line: sublistCount,
					value: convRate
				});
			}
			form.getSublist({ id :'custpage_packinglist'}).setSublistValue({
				id : 'custpage_shipcarrier',
				line : sublistCount,
				value : shipCarrier
			});

		}
		catch(exp)
		{
			log.error( 'exp',exp);		

		}	
	}

	function updateItemfulfillmentPack(objitemFulfillmentId,objitemfulfillmentIdLine,cartonNo,cartonWeight,objinvDetailData,useItemCostFlag,
			IFLineIdFinalObj,whLoc)
	{  
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
		var errItemFulfillId ='';		
		var itemFulfillmentIdArr = objitemFulfillmentId.split(',');
		var compSubRecord='';
		var setShipStatus = 'Y';
		var itemLineNo ='';
		var line='';
        var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
		var itemType ='';
		var packageDetailsObj ={};
		for(var i=0;i<itemFulfillmentIdArr.length;i++)
		{   setShipStatus = 'Y';
		var linenumArr = objitemfulfillmentIdLine[itemFulfillmentIdArr[i]].split(',');

		var itemFulfilmentRecord = record.load({
			type : 'itemfulfillment',
			id : itemFulfillmentIdArr[i],
			isDynamic: true
		});
        var packageSublistIdObj =  getPackagestabInternalIds(itemFulfilmentRecord); 
         packageDetailsObj = getIFPackageDetails(itemFulfilmentRecord,packageSublistIdObj);
         
		for (var j = 0; j < linenumArr.length; j++) { 
			line = parseInt(linenumArr[j]);
			itemLineNo = IFLineIdFinalObj[itemFulfillmentIdArr[i]][line];
            itemFulfilmentRecord.selectLine({
                    sublistId: 'item',
                    line: itemLineNo
             });
			itemType = itemFulfilmentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'itemtype'
			}); 
			if(itemType == 'NonInvtPart' || itemType =='Service'){
				itemFulfilmentRecord.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wms_packcarton',
					value : cartonNo
				});  
			}else{
				compSubRecord = itemFulfilmentRecord.getCurrentSublistSubrecord({
					sublistId	:'item',
					fieldId : 'inventorydetail'
				});
				var complinelength =compSubRecord.getLineCount({
					sublistId:'inventoryassignment'
				});
				for (var lineItr = 0; lineItr < complinelength; lineItr++) {
					compSubRecord.selectLine({
                    sublistId: 'inventoryassignment',
                    line: lineItr
                    });
					var internalid = compSubRecord.getCurrentSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'internalid'
					});

					var objlineNum	= objinvDetailData[itemFulfillmentIdArr[i]];

					var invdtlArr   = objlineNum[linenumArr[j]];
					var qunatityArray = [];
					var actualQuantity ='';
					var enteredQuantity ='';
					for(var invLineItr = 0; invLineItr < invdtlArr.length; invLineItr++) {
						compSubRecord.selectLine({
                              sublistId: 'inventoryassignment',
                              line: lineItr
                             });
						objinvdtl = invdtlArr[invLineItr];
						if(objinvdtl[internalid]){
							qunatityArray = [];
							qunatityArray = objinvdtl[internalid].split(',');
							actualQuantity = qunatityArray[1];
							enteredQuantity	= qunatityArray[0];

							if(populateWMSCartonFields==true)
							{
								compSubRecord.setCurrentSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'custrecord_wmsse_packing_container', 
									value : cartonNo
								});
							}
							compSubRecord.setCurrentSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'packcarton', 
								value : cartonNo
							});
							
							if(enteredQuantity != actualQuantity){
								setShipStatus = 'N';
								compSubRecord.setCurrentSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'quantityavailable', 
									value : Number(Big(enteredQuantity)) 
								});
								compSubRecord.setCurrentSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'quantity', 
									value : Number(Big(enteredQuantity)) 
								});
                                compSubRecord.commitLine({
                                     sublistId: 'inventoryassignment'
                                  });
								addNewInvDetailLine(compSubRecord,lineItr,qunatityArray,inventoryStatusFeature,populateWMSCartonFields); //splitting line

							}else{
								compSubRecord.commitLine({
                                  sublistId: 'inventoryassignment'
                                  });
							}
						}
						if(utility.isValueValid(objinvdtl.total)){
							var packCont= compSubRecord.getCurrentSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'packcarton'
								});
					
							if(!(utility.isValueValid(packCont))){
								updatePackCartonFullQty(compSubRecord,objinvdtl,cartonNo,lineItr,populateWMSCartonFields);
							}
						}
					}
				}
			}
			itemFulfilmentRecord.commitLine({
                    sublistId: 'item'
             });
		}
		
		if(setShipStatus == 'Y'){
			setShipStatus = checkAndSetShipStatus(itemFulfilmentRecord,setShipStatus,populateWMSCartonFields);
		}
		
		itemFulfilmentRecord =	setPackageDetails(itemFulfilmentRecord,packageSublistIdObj,packageDetailsObj,setShipStatus,
			cartonNo,cartonWeight);

		try{
			var resultId = itemFulfilmentRecord.save();										
			if(!(utility.isValueValid(resultId)))
				errItemFulfillId = errItemFulfillId + ',' +itemFulfillmentIdArr[i];
		}catch (e)  {
			log.debug('e in Utility--',e);
			errItemFulfillId = errItemFulfillId + ',' +itemFulfillmentIdArr[i];
		}

		}
		log.debug('getRemainingUsage end --', runtime.getCurrentScript().getRemainingUsage());
		return errItemFulfillId;
	}
	function createPacklistHtml(vOrdNo,trantype,salesorderdetails,vcontainerLp,whLocationId)
	{
		try
		{
			log.debug('trantype ',trantype);		
			var salesorderdetails = record.load({type:trantype,
				id:vOrdNo
			});
			var billtoaddress=salesorderdetails.getValue({fieldId:'billaddress'});
			var shipaddress=salesorderdetails.getValue({fieldId:'shipaddress'});
			if((shipaddress!=null && shipaddress!=''))
			{
				shipaddress= shipaddress.replace(/\r\n/g, "<br />").replace(/\n/g, "<br />");
			}
			var orderdate=salesorderdetails.getText({fieldId:'trandate'});
			var ordernumber=salesorderdetails.getValue({fieldId:'tranid'});
			var customerpo=salesorderdetails.getValue({fieldId:'otherrefnum'});
			var entity=salesorderdetails.getText({fieldId:'entity'});
			var locationId = utility.isValueValid(salesorderdetails.getValue({fieldId:'location'})) ? salesorderdetails.getValue({fieldId:'location'}) : whLocationId  ;
			var shipmethod=salesorderdetails.getText({fieldId:'shipmethod'});
			var shipmethodid=salesorderdetails.getValue({fieldId:'shipmethod'});
			var shipDate=salesorderdetails.getText({fieldId:'shipdate'});
			var orderType=salesorderdetails.getValue({fieldId:'ordertype'});
			var dept=salesorderdetails.getValue({fieldId:'department'});
			var classes=salesorderdetails.getValue({fieldId:'class'});

			var objPackDetails={};
			objPackDetails['whLocation'] = locationId; 
			objPackDetails['tranType'] = trantype; 
			objPackDetails['orderType'] = orderType; 
			objPackDetails['dept'] = dept; 
			objPackDetails['classes'] = classes; 
			objPackDetails['shipMethod'] = shipmethodid; 
			objPackDetails['orderId'] = vOrdNo; 
			objPackDetails['packCarton'] = vcontainerLp; 
			if((customerpo==null)||(customerpo==''))
			{
				customerpo="";
			}
			if((shipDate==null)||(shipDate==''))
			{
				shipDate="";
			}
			if((orderdate==null)||(orderdate==''))
			{
				orderdate="";
			}
			shipmethod=shipmethod.replace(/\s/g, "");
			if((shipmethod==null)||(shipmethod==''))
			{
				shipmethod="";
			}
			var FOB='';
			log.debug('location ',locationId);
			var shipaddressee="";var shipaddr1="";var shipaddr2="";var shipcity="";var shipcountry="";var shipstate="";var shipzip="";var shipstateandcountry="";
			shipaddressee=salesorderdetails.getValue({fieldId:'shipaddressee'});
			if(shipaddressee!=null && shipaddressee!='')
			{
				shipaddr1=salesorderdetails.getValue({fieldId:'shipaddr1'});
				shipaddr2=salesorderdetails.getValue({fieldId:'shipaddr2'});
				shipcity=salesorderdetails.getValue({fieldId:'shipcity'});
				shipcountry=salesorderdetails.getValue({fieldId:'shipcountry'});
				shipstate=salesorderdetails.getValue({fieldId:'shipstate'});
				shipzip=salesorderdetails.getValue({fieldId:'shipzip'});
			}
			if((shipaddressee==null)||(shipaddressee==''))
			{
				shipaddressee=shipaddress;
			}
			if((shipaddr1==null)||(shipaddr1==''))
			{
				shipaddr1="";
			}
			if((shipaddr2==null)||(shipaddr2==''))
			{
				shipaddr2="";
			}
			if((shipcity==null)||(shipcity==''))
			{
				shipcity="";
			}
			if((shipcountry==null)||(shipcountry==''))
			{
				shipcountry="";
			}
			if((shipstate==null)||(shipstate==''))
			{
				shipstate="";
			}
			if((shipzip==null)||(shipzip==''))
			{
				shipzip="";
			}
			if(shipaddressee!=null && shipaddressee!='')
			{
				shipaddr1=shipaddr1+", "+shipaddr2;
				shipstateandcountry=shipcity+" "+shipstate+" "+shipzip;
			}
			var domainName='NS WMS'; // = fndomainName();
			log.debug('domainName ',domainName);
			var getPackIfresults = search.load({
				id:'customsearch_wms_packlistord'
			});
			getPackIfresults.filters.push(
					search.createFilter({
						name:'createdfrom',
						join:'transaction',
						operator:search.Operator.IS,
						values:vOrdNo
					})
			);
			getPackIfresults.filters.push(
					search.createFilter({
						name:'custrecord_wmsse_packing_container',
						join:'inventoryDetailLines',
						operator:search.Operator.IS,
						values:vcontainerLp
					})
			);
			var	 groupopentasksearchresults = utility.getSearchResultInJSON(getPackIfresults);

			var pickOrderResults  = getNonInvItemPackingOrders(objPackDetails);
			for(var pickOrder in pickOrderResults){
				groupopentasksearchresults.push(pickOrderResults[pickOrder]);
			}
			var itemwithSubItemObj=getKititemForComponents(vOrdNo);
			var appendcontlp="";
			var actualenddate="";
			var strVar="";
			var noofCartons=0; 
			if(groupopentasksearchresults!=null && groupopentasksearchresults!='' && groupopentasksearchresults.length>0)
			{           
				log.debug('groupopentasksearchresults.length ',groupopentasksearchresults.length);
				if(locationId==null || locationId=='')
				{
					locationId = groupopentasksearchresults[0]['location'];

				}
				// to get the Location address
				var locationadress = record.load({type:'location',
					id:locationId
				});
				var billtoaddress=salesorderdetails.getValue({fieldId:'billaddress'});
				var addr1="";var city="";var state="";var zip=""; var stateandzip=""; var returnadresse="";
				log.debug('locationId ',locationId);
				if(locationId!=null && locationId!='')
				{
					addr1=locationadress.getValue({fieldId:'addr1'});
					city=locationadress.getValue({fieldId:'city'});
					state=locationadress.getValue({fieldId:'state'});
					zip=locationadress.getValue({fieldId:'zip'});
					returnadresse=locationadress.getValue({fieldId:'addressee'});
					if(returnadresse==null || returnadresse=='')
						returnadresse=groupopentasksearchresults[0]['locationText'];
					log.debug('returnadresse ',returnadresse);
				}
				if((addr1==null)||(addr1==''))
				{
					addr1="";
				}
				if((city==null)||(city==''))
				{
					city="";
				}
				if((state==null)||(state==''))
				{
					state="";
				}
				if((zip==null)||(zip==''))
				{
					zip="";
				}
				if((returnadresse==null)||(returnadresse==''))
				{
					returnadresse="";
				}
				stateandzip=city+" "+state+" "+zip;
				var totalamount='';
				var groupcount=groupopentasksearchresults.length;
				var grouplength=0;
				var invoicetasklength=groupopentasksearchresults.length;
				var linenumber=1;
				var pagecount=1; 
				var totalinvoice=0;
				var totalcount=groupopentasksearchresults.length;
				var totalshipqty=0;
				var totalcube=0;
				var totalweight=0;
				var vorderqty="";
				var strVar="";
				while(0<totalcount)
				{
					var count=0;
					var kititemcount=0;
					strVar +="<html>";
					strVar += " <body>";
					strVar += "    <table style=\"width: 100%;\">";
					strVar += "    <tr>";
					strVar += "    <td >";
					strVar += "    <table>";
					strVar += " <td align=\"left\" style=\"width: 65%;\">";
					strVar += "        <table style=\"width: 25%;\" align=\"left\">";
					strVar += "            <tr>";
					strVar += "                <td>";
					strVar += "                    <img src=\"headerimage\" width=\"320\" height=\"65\" />";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 12px; font-family:Arial;\">";
					strVar += "                 <b>" + domainName + "</b>";
					strVar += "<br \/>" +returnadresse+" <br \/>" +addr1+" <br \/>" +stateandzip+"" ; 
					strVar += "                </td>";
					strVar += "            </tr>"; 
					strVar += "        </table>";
					strVar += "        </td>";
					strVar += " <td></td>";
					strVar += "    <td></td>";
					strVar += "<td style=\"width: 35%; font-family:Arial;\" valign=\"top\">";
					strVar += "        <b>";
					strVar += "            <h2 align=\"right\">";
					strVar += "                Packing Slip</h2>";
					strVar += "        </b>";
					strVar += "        <table style=\"width: 150px;\" frame=\"box\" rules=\"all\" align=\"right\" border=\"0\" cellpadding=\"0.5\"";
					strVar += "            cellspacing=\"0\">";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 14px; text-align: center; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                    border-left: 1px solid black; border-bottom: 1px solid black;\">";
					strVar += "                    Order Date";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 12px; text-align: center; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                    border-bottom: 1px solid black; height: 18px\">";
					strVar += "                                                                          "+orderdate+"";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "        </td>";
					strVar += "</table>";
					strVar += "    </td>";
					strVar += "   </tr>";
					strVar += "   <tr>";
					strVar += "<td align=\"left\" style=\"width: 100%;\">";  
					strVar += "        <table style=\"width: 100%\">";
					strVar += "            <tr>";
					strVar += "                <td>";
					strVar += "                    <table style=\"width: 55%;\" rules=\"all\" align=\"left\" border=\"0\" frame=\"box\">";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                                border-left: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                               &nbsp Ship To";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height: 80px;\" valign=\"top\">";
					strVar += "                                <table>";
					strVar += "                                    <tr>";
					strVar += "                                        <td style=\"font-size: 12px;\">";
					strVar += "                                                                                                                                                "+shipaddressee+"";
					strVar += "                                        </td>";
					strVar += "                                    </tr>";
					strVar += "                                    <tr>";
					strVar += "                                        <td style=\"font-size: 12px;\">";
					strVar += "                                                                                                                                                                          "+shipaddr1+"";
					strVar += "                                        </td>";
					strVar += "                                    </tr>";
					strVar += "                                    <tr>";
					strVar += "                                        <td style=\"font-size: 12px;\">";
					strVar += "                                                                                                                                                        "+shipstateandcountry+"";
					strVar += "                                        </td>";
					strVar += "                                    </tr>";
					strVar += "                                </table>";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                    </table>";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <br />";
					strVar += "            <tr>";
					strVar += "                <td>";
					strVar += "                    <table style=\"width: 100%;\" rules=\"all\" border=\"0\" frame=\"box\" cellpadding=\"0.5\"";
					strVar += "                        cellspacing=\"0\">";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                                border-left: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                &nbsp Ship Date";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                 &nbsp Ship Via";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                               &nbsp PO #";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-top: 1px solid black; border-right: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                               &nbsp Order # / Container #";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height: 22px;\">";
					strVar += "                                                                                                                          &nbsp"+shipDate+"";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                height: 22px;\">";
					strVar += "                                                                                                                          &nbsp"+shipmethod+"";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                height: 22px;\">";
					strVar += "                                                                                                                          &nbsp"+customerpo+"";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                height: 22px;\">";
					strVar += "                                                                                                                          &nbsp"+ordernumber+" /"+vcontainerLp+"";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                    </table>";
					strVar += "                    <table style=\"width: 100%;\" rules=\"all\" border=\"0\" frame=\"box\" cellpadding=\"0.5\"";
					strVar += "                        cellspacing=\"0\">";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                               &nbsp Shipping Notes";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height: 22px;\">";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					strVar += "                    </table>";
					strVar += "                    <table style=\"width: 100%;\" rules=\"all\" border=\"0\" frame=\"box\" cellpadding=\"0.5\"";
					strVar += "                        cellspacing=\"0\">";
					strVar += "                        <tr>";
					strVar += "                            <td style=\"font-size: 15px; text-align: center; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                Item #";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: center; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                Subitem Of";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                               &nbsp Description";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: center; border-right: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                Ordered";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: center; border-right: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                Units";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: center; border-right: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                Back Order";
					strVar += "                            </td>";
					strVar += "                            <td style=\"font-size: 15px; text-align: center; border-right: 1px solid black; border-bottom: 1px solid black; height:24px; font-family:Arial;\">";
					strVar += "                                Shipped";
					strVar += "                            </td>";
					strVar += "                        </tr>";
					// loop starts
					var repeatpartentsku;
					for(var g=grouplength; g<groupopentasksearchresults.length;g++)
					{
						count++;
						grouplength++;
						var itemText = groupopentasksearchresults[g]['itemText'];						
						var ItemId= groupopentasksearchresults [g]['item'];
						var ifInternalid = groupopentasksearchresults[g]['internalid'];	
						var lineno = groupopentasksearchresults[g]['line'];
						var totalactqty = groupopentasksearchresults[g]['packedquantity'];
						var totalqty = groupopentasksearchresults[g]['quantity'];
						var units = groupopentasksearchresults[g]['unit'];
						var unitsText = groupopentasksearchresults[g]['unitText'];	

						unitType='';
						var itemDetails = search.lookupFields({
							type: 'item',
							id: ItemId,
							columns: ['unitstype','salesdescription']
						});
						if(utility.isValueValid(itemDetails['unitstype'][0])){
							unitType = itemDetails['unitstype'][0].value;
							
						}
						var salesdesc=itemDetails.salesdescription;

						if(utility.isValueValid(units))
						{
							var convRate  = utility.getConversionRate(unitsText,unitType);
							totalactqty=totalactqty/convRate
						}

						var unitvalue = '';
						var decscription = '';
						var backordervalue;
						var parentskuitemid = groupopentasksearchresults[g]['item'];

						if((parentskuitemid==null)||(parentskuitemid==''))
						{
							parentskuitemid=ItemId;
						}
						var parentitemSubtype = search.lookupFields({
							type: search.Type.ITEM,
							id: parentskuitemid,
							columns: ['type']
						});
						var parentitemtype=parentitemSubtype.type[0].value;
						var itemsubtype = search.lookupFields({
							type: search.Type.ITEM,
							id: ItemId,
							columns: ['type']
						});
						var itemtype=itemsubtype.type[0].value;
						log.debug('itemtype ',itemtype);
						log.debug('parentitemtype ',parentitemtype);
						log.debug('salesdesc ',salesdesc);
						

						var subItemName = itemwithSubItemObj[ifInternalid+'-'+lineno];
						if(!utility.isValueValid(subItemName))
						{
							subItemName='';
						}
						if(parentitemtype!="Kit")
						{
							if(trantype!='transferorder')
							{
								var lineitemcount=salesorderdetails.getLineCount('item');
								log.debug('lineitemcount ',lineitemcount);
								for(var p=0;p<lineitemcount;p++)
								{
									var iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									var itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									log.debug('iteminternalid,ItemId ',iteminternalid+','+ItemId);
									// if(iteminternalid==ItemId && lineno ==
									// itemlineno)
									if(iteminternalid==ItemId)
									{
										var vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										var unitvalue= salesorderdetails.getSublistText({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
							else
							{
								var lineitemcount=salesorderdetails.getLineCount('item');
								for(var p=0;p<lineitemcount;p++)
								{
									var iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									var itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									if(iteminternalid==ItemId && lineno == itemlineno )
									{
										var vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										var unitvalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
						}
						else
						{						
							if(trantype!='transferorder')
							{
								var lineitemcount=salesorderdetails.getLineCount('item');
								log.debug('lineitemcount ',lineitemcount);
								for(var p=0;p<lineitemcount;p++)
								{
									var iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									var itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									log.debug('iteminternalid,parentskuitemid ',iteminternalid+','+ItemId);
									if(iteminternalid==parentskuitemid && lineno == itemlineno)
									{
										var vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										var unitvalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
							else
							{
								var lineitemcount=salesorderdetails.getLineCount('item');
								for(var p=0;p<lineitemcount;p++)
								{
									var iteminternalid= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'item', 
										line : p
									});
									var itemlineno= salesorderdetails.getSublistValue({
										sublistId : 'item',
										fieldId : 'line', 
										line : p
									});
									if(iteminternalid==ItemId && lineno == itemlineno )
									{
										var vorderqty= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantity', 
											line : p
										});
										var unitvalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'units', 
											line : p
										});
										backordervalue= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'quantitybackordered', 
											line : p
										});
										decscription= salesorderdetails.getSublistValue({
											sublistId : 'item',
											fieldId : 'description', 
											line : p
										});
										break;
									}
								}
							}
							log.debug('vorderqty',vorderqty);				

						}
						// case 201412009
						log.debug('decscription',decscription);
						if((decscription==null)||(decscription==''))
						{
							decscription=salesdesc;
							
						}
						if((backordervalue==null)||(backordervalue==''))
						{
							backordervalue="";
						}
						// case # 201417313
						if((vorderqty==null)||(vorderqty==''))
						{
							vorderqty=totalqty;
						}
//						end of case # 201417313
						if(parentitemtype=="Kit")
						{
							var parentskudesc = search.lookupFields({
								type: search.Type.ITEM,
								id: parentskuitemid,
								columns: ['displayname']
							});
							var parentdescription=parentskudesc.displayname[0].value;
							kititemcount++;
							strVar += "<tr>";
							strVar += "<td style=\"font-size: 14px;font-family:Times New Roman; text-align: center; border-right: 1px solid black; border-left: 1px solid black;";
							strVar += " border-bottom: none; height:22px;\">";
							strVar += "                                                                                                                          "+itemText+"";
							strVar += "</td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar +=""+parentdescription+"";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: center; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar += "                                           &nbsp";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: center; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar += "                                           &nbsp ";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: center; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar +=" &nbsp";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: center; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar += "   &nbsp";
							strVar += "                            </td>";
							strVar += "                        </tr>";
						}
						if(itemtype!="Kit")
						{

							strVar += "                        <tr>";
							if(parentskuitemid==ItemId)
							{
								strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
								strVar += "                                border-bottom: none; height:22px;\">";
								strVar += "                                                                                                                         &nbsp"+itemText+"";
								strVar += "                            </td>";
							}
							else
							{
								strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
								strVar += "                                border-bottom: none; height:22px;\">";
								strVar += "                                                                                                          &nbsp"+itemText+"";
								strVar += "                            </td>";
							}
							strVar += "                            <td style=\"font-size: 14px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
							strVar += "                                border-bottom: none; height:22px;\">";
							strVar += "                                                                                                          &nbsp"+subItemName+"";
							strVar += "                            </td>";
							if(parentskuitemid==ItemId)
							{
								strVar += "                            <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: none; height:22px;\">";
								strVar +="&nbsp"+decscription+"";
								strVar += "                            </td>";
							}
							else
							{
								strVar += "                            <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: none; height:22px;\">";
								strVar +="&nbsp"+decscription+"";
								strVar += "                            </td>";
							}
							// case:201417430
							strVar += "                            <td style=\"font-size: 12px; text-align: right; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar += "                                            "+vorderqty+" &nbsp";
							strVar += "                            </td>";
							// case:201417430
							strVar += "                            <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar += "    &nbsp                 "+unitvalue+" &nbsp";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: right; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar +=" &nbsp"+backordervalue+" &nbsp";
							strVar += "                            </td>";
							strVar += "                            <td style=\"font-size: 12px; text-align: right; border-right: 1px solid black; border-bottom: none; height:22px;\">";
							strVar += "                                            "+totalactqty+" &nbsp";
							strVar += "                            </td>";
							strVar += "                        </tr>";
						}
						var pagebreakcount=parseInt(count)+parseInt(kititemcount);
						if(pagebreakcount==10)
						{
							break;
						}	
					}
					// start of for Not Having lines
					var Height='';
					if(pagecount==1)
					{
						Height='230px';
					}
					if(pagecount>1)
					{
						Height='420px';
					}
					var recordCount=pagebreakcount;
					Height=parseInt(Height)-parseInt((recordCount*20));
					strVar += "                                    <tr>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                                            border-bottom: 1px solid black; height: "+Height+";\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            height: 4px;\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            height: 4px;\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            height: 4px;\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            height: 4px;\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            height: 4px;\">";
					strVar += "                                        </td>";
					strVar += "                                        <td style=\"font-size: 12px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;";
					strVar += "                                            height: 4px;\">";
					strVar += "                                        </td>";    
					strVar += "                                    </tr>";
					// End of for Not Having lines
					strVar += "  </table>";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += " </td>";
					strVar += "    </tr>";                      
					strVar += " <tr>";
					strVar += "    <td>";
					strVar += "    <br \/>";
					strVar += "    ----------------------------------------------------------------------------------------------------------------------------";
					strVar += "    <br \/>";
					strVar += "    <br \/>    ";
					strVar += "    </td>";
					strVar += "    </tr>";
					strVar += "  <tr>";
					strVar += "   <td>";
					strVar += "        <table style=\"width: 45%;\" align=\"left\">";
					strVar += "<tr>";
					strVar += "            <td style=\"font-size: 15px;\">";
					strVar += "               <br \/>";
					strVar += "            </td>";
					strVar += "        </tr>";
					strVar += " <tr>";
					strVar += "            <td style=\"font-size: 13px; font-family:Arial;\">";
					strVar += "                <b>Ship Returns To<\/b>";
					strVar += "            </td>";
					strVar += "        </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 12px; \">";
					strVar +=""+returnadresse+" <br /> "+addr1+" <br /> "+stateandzip+" ";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "        <table style=\"width: 55%;\" align=\"right\">";                                   
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 13px; font-family:Arial;\"><b>Customer Return From </b>";
					strVar += "                </td>";
					strVar += "                <td >";                                           
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 13px; font-family:Arial;\">";
					strVar += "                    <b>Customer </b>";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 12px;\">";
					strVar += "                                                                                                                                                                          "+entity+"";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 13px; font-family:Arial;\">";
					strVar += "                    <b>Order  </b>";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 12px;\">";
					strVar +=""+ordernumber+"";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 13px; font-family:Arial;\">";
					strVar += "                    <b>R.A. # </b>";
					strVar += "                </td>";
					strVar += "                <td>";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "        <br />";
					strVar += "        <br />";
					strVar += "        <br />";
					strVar += "        <br />";                                 
					strVar += " </td>";
					strVar += "     </tr>";
					strVar += " <tr>";
					strVar += "     <td>";
					strVar += "        <table style=\"width: 100%;\" frame=\"box\" rules=\"all\" align=\"right\" border=\"0\" cellpadding=\"0.5\"";
					strVar += "            cellspacing=\"0\">";
					strVar += "            <tr style=\"background-color: Gray;\">";
					strVar += "                <td style=\"font-size: 15px; text-align: left; color: white; border-top: 1px solid black;";
					strVar += "                    border-right: 1px solid black; border-left: 1px solid black; border-bottom: 1px solid black; font-family:Arial;\">";
					strVar += "                    &nbsp Item";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 15px; text-align: left; color: white; border-top: 1px solid black;";
					strVar += "                    border-right: 1px solid black; border-bottom: 1px solid black; font-family:Arial;\">";
					strVar += "                    &nbsp Quantity";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 15px; text-align: left; color: white; border-top: 1px solid black;";
					strVar += "                    border-right: 1px solid black; border-bottom: 1px solid black; font-family:Arial;\">";
					strVar += "                   &nbsp Reason For Returning";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "            <tr>";
					strVar += "                <td style=\"font-size: 16px; text-align: left; border-right: 1px solid black; border-left: 1px solid black;";
					strVar += "                    border-bottom: 1px solid black;\" height=\"55px\">";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 16px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;\"";
					strVar += "                    height=\"55px\">";
					strVar += "                </td>";
					strVar += "                <td style=\"font-size: 16px; text-align: left; border-right: 1px solid black; border-bottom: 1px solid black;\"";
					strVar += "                    valign=\"Top\">";
					strVar += "                </td>";
					strVar += "            </tr>";
					strVar += "        </table>";
					strVar += "</td>";
					strVar += "    </tr>";
					strVar += "        </table>";
					if(grouplength==groupopentasksearchresults.length)
					{
						strVar +="<p style=\" page-break-after:avoid\"></p>";
					}
					else
					{
						strVar +="<p style=\" page-break-after:always\"></p>";
					}
					strVar += " </body>";
					strVar += "        </html>";
					log.debug('totalcount',totalcount);
					totalcount=parseInt(totalcount)-parseInt(count);
					log.debug('totalcountafter',totalcount);
				}
				var tasktype='14';
				var labeltype='PackList';
				var print=false;
				var reprint=false;
				var company='';
				var location='';
				var formattype='html';
				var labelrecord = record.create({
					type: 'customrecord_wmsse_labelprinting',
					isDynamic: true
				});
				labelrecord.setValue({fieldId: 'name', value: vOrdNo});
				labelrecord.setValue({fieldId:'custrecord_wmsse_label_data',value:strVar}); 
				labelrecord.setValue({fieldId:'custrecord_wmsse_label_refno',value:ordernumber});  
				labelrecord.setValue({fieldId:'custrecord_wmsse_label_task_type',value:tasktype});
				labelrecord.setValue({fieldId:'custrecord_wmsse_label_type',value:labeltype});
				labelrecord.setValue({fieldId:'custrecord_wmsse_label_lp',value:vcontainerLp});
				labelrecord.setValue({fieldId:'custrecord_wmse_label_print',value:print});
				labelrecord.setValue({fieldId:'custrecord_wmsse_label_reprint',value:reprint});
				var tranid = labelrecord.save();
			}
		}
		catch(exp) {

			log.debug('Exception in CreatePacklistHtml ',exp);

		}
	}

	function getNonInvItemPackingOrders(objPackDetails){
		var	 pickOrderSearchResults=[];
		log.debug('objPackDetails',objPackDetails);
		var whLocation = objPackDetails.whLocation;
		var tranType = objPackDetails.tranType;
		var orderId = objPackDetails.orderId;	
		var shipMethod = objPackDetails.shipMethod;
		var orderType = objPackDetails.orderType;
		var dept = objPackDetails.dept;
		var classes = objPackDetails.classes;
		var packCarton = objPackDetails.packCarton;
		log.debug('orderId',orderId);
		if(tranType=='salesorder')
			tranType='SalesOrd';					
		else if(tranType=='transferorder')
			tranType='TrnfrOrd';	
		log.debug('tranType',tranType);
		var pickOrderLinesSearch = search.load({
			id:'customsearch_wms_packlist_order_ninvitem'
		});


		pickOrderLinesSearch.filters.push(
				search.createFilter({
					name:'location',
					operator:search.Operator.ANYOF,
					values:whLocation 
				})
		);


		if(utility.isValueValid(orderId)){
			pickOrderLinesSearch.filters.push(
					search.createFilter({
						name:'appliedtotransaction',
						operator:search.Operator.IS,
						values:orderId
					})
			);
		}
		pickOrderLinesSearch.filters.push(search.createFilter({
			name : 'type',
			join : 'appliedtotransaction',
			operator : search.Operator.ANYOF,
			values : tranType
		}));

		if( utility.isValueValid(packCarton)){
			pickOrderLinesSearch.filters.push(
					search.createFilter({
						name:'custcol_wms_packcarton',
						operator:search.Operator.IS,
						values:packCarton
					})
			);
		}

		if( utility.isValueValid(shipMethod  )){
			pickOrderLinesSearch.filters.push(
					search.createFilter({
						name:'shipmethod',
						operator:search.Operator.ANYOF,
						values:shipMethod 
					})
			);
		}
		if( utility.isValueValid(orderType )){

			pickOrderLinesSearch.filters.push(search.createFilter({
				name : 'ordertype',
				join : 'createdfrom',
				operator : search.Operator.ANYOF,
				values : orderType
			}));
		}
		if( utility.isValueValid(dept)){
			pickOrderLinesSearch.filters.push(
					search.createFilter({
						name:'department',
						operator:search.Operator.ANYOF,
						values:dept   
					})
			);
		}
		if( utility.isValueValid(classes)){
			pickOrderLinesSearch.filters.push(
					search.createFilter({
						name:'class',
						operator:search.Operator.ANYOF,
						values:classes   
					})
			);
		}
		pickOrderSearchResults = utility.getSearchResultInJSON(pickOrderLinesSearch);
		log.debug('pickOrderSearchResults',pickOrderSearchResults);
		pickOrderSearchResults = pickOrderSearchResults.sort(function(a, b){
			return a.createdfrom - b.createdfrom;
		});

		return pickOrderSearchResults;
	}
	function getInvdtldataforPacking(itemfulfillid,itemInternalId,itemLineNo ,pickcartonNo,populateWMSCartonFields)
	{
		var invDtlLinesSearch = search.load({
			id:'customsearch_wms_get_inv_detail_packing'
		});
		invDtlLinesSearch.filters.push(
				search.createFilter({
					name:'internalid',
					join:'transaction',
					operator:search.Operator.ANYOF,
					values: itemfulfillid
				})
		);
		invDtlLinesSearch.filters.push(
				search.createFilter({
					name:'item',
					operator:search.Operator.ANYOF,
					values:itemInternalId
				})
		);
		invDtlLinesSearch.filters.push(
				search.createFilter({
					name:'line',
					join:'transaction',
					operator:search.Operator.EQUALTO,
					values: itemLineNo
				})
		);
		if (pickcartonNo != '' && pickcartonNo != '- None -')
		{
		
				invDtlLinesSearch.filters.push(
						search.createFilter({
							name:'pickcarton',							
							operator:search.Operator.IS,
							values:pickcartonNo
						})
				);
	
		}
		var	 invDtlLineSearchResults = utility.getSearchResultInJSON(invDtlLinesSearch);
		log.debug('invDtlLineSearchResults',invDtlLineSearchResults);

		return invDtlLineSearchResults;
	}

	function GenerateLabel(vWMSSeOrdNo,uompackflag,vContLpNo, whLocation)
	{

		var companyDunsNumber;
		var label='';
		var uom=0;
		var uccLabel='';
		var lpMaxValue;
		var prefixlength;
		var lpType = 1;
		var recid=null;

		try 
		{
			var licensePlateResult = GetMaxLPNo(lpType,whLocation);
			log.debug('licensePlateResult  :', licensePlateResult);
			if(utility.isValueValid(licensePlateResult))
			{
				lpMaxValue		  = licensePlateResult['maxLP'];
				prefixlength 	  = lpMaxValue;
				companyDunsNumber = licensePlateResult['companydunsnumber'];
			}

			if(!utility.isValueValid(companyDunsNumber))
			{
			     recid=null;

			}
			else {

				if (uompackflag == "3")
					uom = "2";
				else
					uom = "0";
				uccLabel = constructUCC(companyDunsNumber, prefixlength, uom);

				var uccNo = record.create({
					type: 'customrecord_wmsse_ucc_master',
					isDynamic: true
				});
				log.debug('uccLabel  :', uccLabel);
				uccNo.setValue({fieldId: 'name', value: vContLpNo});
				uccNo.setValue({fieldId: 'custrecord_wmsse_contlp', value: vContLpNo});
				uccNo.setValue({fieldId: 'custrecord_wmsse_uccno', value: uccLabel});
				uccNo.setValue({fieldId: 'custrecord_wmsse_orderno', value: vWMSSeOrdNo});
				recid = uccNo.save();
			}
		} 
		catch (err) 
		{
			log.error('error in Generate Label: ',err);
		}
		return uccLabel
	}

            // UCC - 00(AI) + 0-10(extension digit) + 7-9(company duns) + 16-duns(serial number) + check digit
            // serial number + company duns combine 16 digits in UCC
            function constructUCC(companyDuns, currentPrefix, uom) {
                var serialNumber = '', checkDigit = 0, UCC;
                var extensionDigit = uom;
                var serialNumberLength = 16 - companyDuns.toString().length;
				log.debug('serialNumberLength ',serialNumberLength);
				log.debug('currentPrefix ',currentPrefix);
				log.debug('currentPrefix.length ',currentPrefix.toString().length);
                for(var i = 0; i < serialNumberLength - currentPrefix.toString().length; i++) {
                    serialNumber += '0';
                }
                serialNumber += currentPrefix;
                UCC = extensionDigit + companyDuns + serialNumber;
                for(var i = 0; i < UCC.length; i++) {
                    if(i % 2 === 0) {
                        checkDigit += parseInt(UCC.charAt(i)) * 3;
                    } else {
                        checkDigit += parseInt(UCC.charAt(i));
                    }
                }
				if(checkDigit % 10 === 0) {
					checkDigit = 1;
				}
				else {
                checkDigit = Math.abs((checkDigit % 10) - 10);
				}
                return UCC + checkDigit.toString();
            }
	function GenerateZebraUccLabel(vWMSSeOrdNo,containerLpShip,salesorderrecord,whLocation,itemFulfillmentId)
	{
		log.debug('vOrderNo ',vWMSSeOrdNo);
		log.debug('cartonnumber ',containerLpShip);		
		var labeltype="UCCLABEL";
		var shiptocompanyid=salesorderrecord.getValue({fieldId:'entity'});
		var labeldata=GetSELabelTemplate("",labeltype);
		var location;
		var customername,customerpo;
		if(labeldata!=null && labeldata!="")
		{
			var uccnumbersearchresults=getUCCNumber(containerLpShip);
			var uccnumber="";
			var itemName='';
			if(uccnumbersearchresults!=null && uccnumbersearchresults!="")
			{
				uccnumber=uccnumbersearchresults[0]['custrecord_wmsse_uccno'];
			}
			var labelcount="";
			log.debug('uccnumber ',uccnumber);

			if(!utility.isValueValid(uccnumber))
			{
				uccnumber = containerLpShip;
			}

			// Item from Item Fulfillment begins
			if(utility.isValueValid(itemFulfillmentId))
			{
				var itmDtlSearch = search.load({
					id:'customsearch_wms_getitem_itemfulfillment'
				});
				itmDtlSearch.filters.push(
						search.createFilter({
							name:'internalid',
							operator:search.Operator.ANYOF,
							values: itemFulfillmentId
						})
				);
				var	 itmDtlSearchResults = utility.getSearchResultInJSON(itmDtlSearch);

				if(utility.isValueValid(itmDtlSearchResults) && itmDtlSearchResults.length > 0)
				{
					itemName = itmDtlSearchResults[0]['itemText'];
				}				
			}
			//Item from Item Fulfillment ends


			GenerateZebraLabel(labeltype,labeldata,uccnumber,vWMSSeOrdNo,itemName,labelcount,salesorderrecord,containerLpShip,whLocation);
		}
	}
	function GenerateUCCLabel(vOrdNo,containerLpShip,salesorderrecords)
	{
		try
		{
			log.debug('vOrdNo ',vOrdNo);
			log.debug('containerLpShip ',containerLpShip);
			var location;
			var customername,customerpo;
			var uccnumber='';
			var shiptoAddressee,shiptoAddress1,shiptoAddress2,shiptocity,shiptostate,shiptocountry,shiptocompany,shiptozipcode;
			customerpo=salesorderrecords.getValue({fieldId:'otherrefnum'});

			var ordShipAddRec 	= salesorderrecords.getSubrecord({fieldId : 'shippingaddress'});

			shiptoAddressee	= ordShipAddRec.getValue({fieldId:'addressee'});
			shiptoAddress1	= ordShipAddRec.getValue({fieldId:'addr1'});
			shiptoAddress2	= ordShipAddRec.getValue({fieldId:'addr2'});
			shiptocity		= ordShipAddRec.getValue({fieldId:'city'});
			shiptostate		= ordShipAddRec.getValue({fieldId:'state'});
			shiptocountry	= ordShipAddRec.getValue({fieldId:'country'});
			shiptocompany	= ordShipAddRec.getValue({fieldId:'entity'});
			shiptozipcode	= ordShipAddRec.getValue({fieldId:'zip'});

			location=salesorderrecords.getValue({fieldId:'location'});
			var shipfromcity,shipfromcountry,shipfromzipcode,shipfromaddress,shipfromphone,shipfromstate;
			log.debug('location ',location);
			if(location !="" && location !=null)
			{
				var locationrecord = record.load({type:'location',
					id:location
				});
				log.debug('locationrecord ',locationrecord);

				var locationrecordAddrs = locationrecord.getSubrecord({
					fieldId: 'mainaddress'
				});

				shipfromaddress		= locationrecordAddrs.getValue({fieldId:'addr1'});
				var addr2			= locationrecordAddrs.getValue({fieldId:'addr2'});
				shipfromaddress		= shipfromaddress+" " + addr2;
				shipfromcity		= locationrecordAddrs.getValue({fieldId:'city'});
				shipfromstate		= locationrecordAddrs.getValue({fieldId:'state'});
				shipfromzipcode 	= locationrecordAddrs.getValue({fieldId:'zip'});
				companyname			= locationrecordAddrs.getValue({fieldId:'addressee'});
				shipfromphone		= locationrecordAddrs.getValue({fieldId:'addrphone'});
				shipfromcountry 	= locationrecordAddrs.getValue({fieldId:'country'});
			}
			var uccnumbersearchresults=getUCCNumber(containerLpShip);

			if(utility.isValueValid(uccnumbersearchresults))
			{
				uccnumber=uccnumbersearchresults[0]['custrecord_wmsse_uccno'];
			}
			log.debug('uccnumber ',uccnumber);

			if(!utility.isValueValid(uccnumber))
			{
				uccnumber = containerLpShip;
			}

			var ucc=uccnumber[0]['custrecord_wmsse_uccno'];
			var ExternalLabelRecord = record.create({
				type: 'customrecord_wmsse_ext_labelprinting',
				isDynamic: true
			});
			ExternalLabelRecord.setValue({fieldId: 'name', value: containerLpShip});			
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_addr1',value:shipfromaddress}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_city',value:shipfromcity}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_state',value:shipfromstate}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_zip',value:shipfromzipcode}); 
			// ShipToAddress
			// ExternalLabelRecord.setFieldValue('custrecord_wmsse_label_shipaddressee',shipaddressee);
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_shipaddr1',value:shiptoAddress1}); 
			// ExternalLabelRecord.setFieldValue('custrecord_wmsse_label_addr2',shiptoAddress2);
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_shipcity',value:shiptocity}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_shipstate',value:shiptostate}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_shipcountry',value:shiptocountry}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_shipzip',value:shiptozipcode}); 
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_custom1',value:customerpo});
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_label_licenseplatenum',value:uccnumber});
			ExternalLabelRecord.setValue({fieldId:'custrecord_wmsse_ext_location',value:location});
			var tranid = ExternalLabelRecord.save();
			log.debug('internalid ',tranid);
		}
		catch(ex)
		{
			log.debug('Exception in GenerateExtUCCLabel ',ex);
		}
	}

	function GenerateZebraLabel(labeltype,Label,ucc,vWMSSeOrdNo,skuname,labelcount,salesorderrecord,containerLpShip,whLocation)
	{
		try
		{
			var ordShipAddRec 	= salesorderrecord.getSubrecord({fieldId : 'shippingaddress'});
			var shiptocity		= ordShipAddRec.getValue({fieldId:'city'});
			var shiptostate		= ordShipAddRec.getValue({fieldId:'state'});
			var shiptocountry	= ordShipAddRec.getValue({fieldId:'country'});
			var shiptocompany	= ordShipAddRec.getValue({fieldId:'addressee'});
			var shiptozipcode	= ordShipAddRec.getValue({fieldId:'zip'});
			var shiptoAddress2	= ordShipAddRec.getValue({fieldId:'addr2'});
			var shiptoAddress1	= ordShipAddRec.getValue({fieldId:'addr1'});			

			log.debug('shiptoAddress1 ',shiptoAddress1);

			var customerpo=salesorderrecord.getValue({fieldId:'otherrefnum'});
			var location=salesorderrecord.getValue({fieldId:'location'});
			var shiptocompanyid=salesorderrecord.getValue({fieldId:'entity'});
			//var customerpo=salesorderrecord.getValue({fieldId:'otherrefnum'});
			// var location=salesorderrecord.getFieldValue('location');
			var shipcarrier=salesorderrecord.getText({fieldId:'shipmethod'});
			var shiptocompanyid=salesorderrecord.getValue({fieldId:'entity'});
			location=whLocation;
			log.debug('location ',location);
			var locationrecord = record.load({type:'location',
				id:location
			});
			log.debug('locationrecord ',locationrecord);

			var locationrecordAddrs = locationrecord.getSubrecord({
				fieldId: 'mainaddress'
			});			

			var salesorder			= salesorderrecord.getValue({fieldId:'tranid'});
			var shipfromaddress1	= locationrecordAddrs.getValue({fieldId:'addr1'});
			var shipfromaddress2	= locationrecordAddrs.getValue({fieldId:'addr2'});
			var shipfromcity		= locationrecordAddrs.getValue({fieldId:'city'});
			var shipfromstate		= locationrecordAddrs.getValue({fieldId:'state'});
			var shipfromzipcode 	= locationrecordAddrs.getValue({fieldId:'zip'});
			var shipfromcompanyname	= locationrecordAddrs.getValue({fieldId:'addressee'});
			var shipfromcountry 	= locationrecordAddrs.getValue({fieldId:'country'});
			// This code not in Dev.Code For Production Dynacraft
			var shipfromaddress3	= locationrecordAddrs.getValue({fieldId:'addr3'});
			var shipdate=utility.DateStamp();
			shipdate = format.parse({
				value: shipdate,
				type: format.Type.DATE
			});
			shipdate = format.format({
				value: shipdate,
				type: format.Type.DATE
			});
			if((shiptoAddress1!=null)&&(shiptoAddress1!=""))
			{
				Label =Label.replace(/parameter01/,shiptoAddress1);
			}
			else
			{
				Label =Label.replace(/parameter01/,'');
			}
			if((shiptoAddress2!=null)&&(shiptoAddress2!=""))
			{
				Label =Label.replace(/parameter02/,shiptoAddress2);
			}
			else
			{
				Label =Label.replace(/parameter02/,'');
			}
			if((shiptocity!=null)&&(shiptocity!=""))
			{
				Label =Label.replace(/parameter03/,shiptocity);
			}
			else
			{
				Label =Label.replace(/parameter03/,'');
			}
			if((shiptostate!=null)&&(shiptostate!=""))
			{
				Label =Label.replace(/parameter04/,shiptostate);
			}
			else
			{
				Label =Label.replace(/parameter04/,'');
			}
			if((shiptocountry!=null)&&(shiptocountry!=""))
			{
				Label =Label.replace(/parameter05/,shiptocountry);
			}
			else
			{
				Label =Label.replace(/parameter05/,'');
			}
			if((shiptozipcode!=null)&&(shiptozipcode!=""))
			{
				Label =Label.replace(/parameter06/g,shiptozipcode);
			}
			else
			{  
				Label =Label.replace(/parameter06/g,'');
			}
			if((shiptocompany!=null)&&(shiptocompany!=""))
			{
				Label =Label.replace(/parameter07/g,shiptocompany);
			}
			else
			{
				Label =Label.replace(/parameter07/g,'');
			}
			if((shipfromaddress1!=null)&&(shipfromaddress1!=""))
			{
				Label =Label.replace(/parameter08/,shipfromaddress1);
			}
			else
			{
				Label =Label.replace(/parameter08/,'');
			}
			if((shipfromaddress2!=null)&&(shipfromaddress2!=""))
			{
				Label =Label.replace(/parameter09/,shipfromaddress2);
			}
			else
			{
				Label =Label.replace(/parameter09/,'');
			}
			if((shipfromcity!=null) &&(shipfromcity!=""))
			{
				Label =Label.replace(/parameter10/,shipfromcity);
			}
			else
			{
				Label =Label.replace(/parameter10/,'');
			}
			if((shipfromstate!=null)&&(shipfromstate!=""))
			{
				Label =Label.replace(/parameter11/,shipfromstate);
			}
			else
			{
				Label =Label.replace(/parameter11/,'');

			}
			if((shipfromcountry!=null) && (shipfromcountry!=""))
			{
				Label =Label.replace(/parameter12/,shipfromcountry);
			}
			else
			{
				Label =Label.replace(/parameter12/,'');
			}
			if((shipfromzipcode!=null) && (shipfromzipcode!=""))
			{
				Label =Label.replace(/parameter13/,shipfromzipcode);
			}
			else
			{
				Label =Label.replace(/parameter13/,'');
			}
			if((customerpo!=null)&&(customerpo!=""))
			{
				Label =Label.replace(/parameter14/g,customerpo);
			}
			else
			{
				Label =Label.replace(/parameter14/g,'');
			}
			if((shipcarrier!=null)&&(shipcarrier!=""))
			{
				Label =Label.replace(/parameter15/,shipcarrier);
			}
			else
			{
				Label =Label.replace(/parameter15/,'');
			}
			if((salesorder!=null)&&(salesorder!=""))
			{
				Label =Label.replace(/parameter16/g,salesorder);
			}
			else
			{
				Label =Label.replace(/parameter16/g,'');
			}
			if((skuname!=null)&&(skuname!=""))
			{
				Label =Label.replace(/parameter17/,skuname);
			}
			else
			{
				Label =Label.replace(/parameter17/,'');
			}
			if((ucc!=null)&&(ucc!=""))
			{
				Label =Label.replace(/parameter18/g,ucc);
			}
			else
			{
				Label =Label.replace(/parameter18/g,'');
			}
			if((shipfromcompanyname!=null)&&(shipfromcompanyname!=""))
			{
				Label =Label.replace(/parameter19/,shipfromcompanyname);
			}
			else
			{
				Label =Label.replace(/parameter19/,'');
			}
			if((shipdate!=null)&&(shipdate!=""))
			{
				Label =Label.replace(/parameter20/,shipdate);
			}
			else
			{
				Label =Label.replace(/parameter20/,'');
			}
			var print=false;
			var reprint=false;
			var refno="";
			var printername="";	
			// printername=GetLabelSpecificPrintername(labeltype,whLocation);
			CreateLabelData(Label,labeltype,refno,print,reprint,shiptocompanyid,salesorder,skuname,labelcount,printername,containerLpShip,whLocation);
		}
		catch(ex)
		{
			log.debug('Exception in GenerateZebraLabel ',ex);
		}
	}
	function CreateLabelData(labeldata,labeltype,refno,print,reprint,company,salesorder,skuname,labelcount,printername,containerLpShip,location)
	{
		try
		{
			var labelrecord = record.create({
				type: 'customrecord_wmsse_labelprinting',
				isDynamic: true
			});
			labelrecord.setValue({fieldId:'name', value:salesorder}); 
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_data',value:labeldata});  
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_refno',value:labeltype});    
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_type',value:"ZEBRALABEL"});                                                                                                                                                                     
			labelrecord.setValue({fieldId:'custrecord_wmse_label_print', value:print});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_reprint', value:reprint});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_lp', value:containerLpShip});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_printername', value:printername});
			labelrecord.setValue({fieldId:'custrecord_wmsse_label_location', value:location});
			var tranid = labelrecord.save();
			log.debug('recordid ',tranid);
		}
		catch(ex)
		{
			log.debug('Exception in CreateLabelData ',ex);
		}
	}

	function GenerateZebraAddressLabel(vWMSSeOrdNo,salesorderrecord,whLocation)
	{
		log.debug('vWMSSeOrdNo ',vWMSSeOrdNo);
		var labeltype="ADDRESSLABEL";
		var labeldata=GetSELabelTemplate("",labeltype);
		var location;
		var customername,customerpo;	
		var labelcount="";
		if(labeldata!=null && labeldata!="")
		{
			GenerateZebraLabel(labeltype,labeldata,"",vWMSSeOrdNo,"",labelcount,salesorderrecord,"",whLocation);
		}
	}
	function getUCCNumber(containerLpShip)
	{

		var getUccresults = search.load({
			id:'customsearch_wms_ucc_labeldata'
		});


		getUccresults.filters.push(
				search.createFilter({
					name:'custrecord_wmsse_contlp',					
					operator:search.Operator.IS,
					values:containerLpShip
				})
		);

		var	 searchResults = utility.getSearchResultInJSON(getUccresults);


		return searchResults;
	}

	function GetSELabelTemplate(shiptocompanyid,labeltype)
	{
		var filtertempalte = [] ;
		if((shiptocompanyid!=null)&&(shiptocompanyid!=""))
		{
			filtertempalte.push(
					search.createFilter({
						name:'custrecord_wmsse_labeltemplate_name',					
						operator:search.Operator.ANYOF,
						values:shiptocompanyid
					}));
		}
		filtertempalte.push(search.createFilter({
			name:'name',					
			operator:search.Operator.IS,
			values:labeltype
		}));		
		var Label="";
		var s = search.create({ 
			type:'customrecord_wmsse_label_template',
			columns: [{name: 'custrecord_wmsse_labeltemplate_data'}],
			filters: filtertempalte
		}).run().each(function(result){
			Label=result.getValue('custrecord_wmsse_labeltemplate_data');

		});		
		return Label;
	}
	function getCustomerASNEnabled(customerId){

		log.debug('customerId',customerId);
		var customerInfoSearch = search.load({id:'customsearch_wms_asn_customer_details'});
		var customerInfoFilter = customerInfoSearch.filters;
		if(utility.isValueValid(customerId))
		{
			customerInfoFilter.push(search.createFilter({
				name:'internalid',
				operator:search.Operator.ANYOF,
				values:customerId}));
		}
		customerInfoSearch.filters = customerInfoFilter;
		var customerInfoObjDetails = utility.getSearchResultInJSON(customerInfoSearch);
		return customerInfoObjDetails;

	}	
	function getOrderType(){
		var erpOrderTypeArr = [];
		var erpOrderTypeSearchObj = search.create({
			type: 'ordertype',
			columns:['name']
		}); 
		var search_page_count = 1000;

		var myPagedData = erpOrderTypeSearchObj.runPaged({
			pageSize: search_page_count
		});

		myPagedData.pageRanges.forEach(function (pageRange) {
			var myPage = myPagedData.fetch({
				index: pageRange.index
			});
			myPage.data.forEach(function (result) {
				erpOrderTypeArr.push(result);
			});
		});
		return erpOrderTypeArr;
	}
	function getItemfulfilmntLineNumber(itemFulfillIdValuesArr){
		var lineIdObj= {};
		var IFLineIdFinalObj={};
		if(typeof  itemFulfillIdValuesArr === 'string'){
			itemFulfillIdValuesArr =  itemFulfillIdValuesArr.split(',');
		}
		for(var i=0;i<itemFulfillIdValuesArr.length;i++){
			lineIdObj ={};
			var IFlineDetails = getIFlineDetails(itemFulfillIdValuesArr[i]);

			for(var lineNoItr =0;lineNoItr<IFlineDetails.length;lineNoItr++){
				lineIdObj[IFlineDetails[lineNoItr]['line']] =  lineNoItr;
			}
			IFLineIdFinalObj[itemFulfillIdValuesArr[i]] = lineIdObj;
		}
		return IFLineIdFinalObj;
	}
	function getIFlineDetails(ifInternalId){

		var getIFLinesSearch = search.load({id:'customsearch_wms_get_if_line_details'});

		var getIFLinesSearchFilters = getIFLinesSearch.filters;

		getIFLinesSearchFilters.push(search.createFilter({
			name:'internalid',
			operator:search.Operator.ANYOF,
			values:ifInternalId}));

		getIFLinesSearch.filters = getIFLinesSearchFilters;

		var	 objIFLinesDetails =  utility.getSearchResultInJSON(getIFLinesSearch);

		log.debug('objIFLinesDetails',objIFLinesDetails);

		return objIFLinesDetails;
	}
	function addNewInvDetailLine(compSubRecord,lineNo,qunatityArray,inventoryStatusFeature,populateWMSCartonFields){
		var actualQuantity = qunatityArray[1];
		var enteredQuantity	= qunatityArray[0];
		var status ='';
		
		compSubRecord.selectLine({
                    sublistId: 'inventoryassignment',
                    line: lineNo
                    });
		var invNumber = compSubRecord.getCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'issueinventorynumber'
		});
		var binnumber = compSubRecord.getCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'binnumber'
		});
		if(inventoryStatusFeature){
			status = compSubRecord.getCurrentSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'inventorystatus'
			});
		}
		var expDate = compSubRecord.getCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'expirationdate'
		});
		var pickCarton = compSubRecord.getCurrentSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'pickcarton'
			});
	

		compSubRecord.selectNewLine({
			sublistId:	'inventoryassignment'
		});
		compSubRecord.setCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'issueinventorynumber', 
			value :invNumber
		});
		compSubRecord.setCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'binnumber', 
			value :binnumber
		});
		if(inventoryStatusFeature){
			compSubRecord.setCurrentSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'inventorystatus', 
				value :status
			});
		}
		compSubRecord.setCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'expirationdate', 
			value :expDate
		});
		compSubRecord.setCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'quantityavailable', 
			value : Number(Big(actualQuantity).minus(enteredQuantity))
		});
		compSubRecord.setCurrentSublistValue({
			sublistId : 'inventoryassignment',
			fieldId : 'quantity', 
			value : Number(Big(actualQuantity).minus(enteredQuantity))
		});

		if(utility.isValueValid(pickCarton)){

			if(populateWMSCartonFields==true)
			{
				compSubRecord.setCurrentSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'custrecord_wms_pickcarton', 
					value :pickCarton
				});
			}
			compSubRecord.setCurrentSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'pickcarton', 
				value :pickCarton
			});
		}
		compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
        });
	}
	function updatePackCartonFullQty(compSubRecord,objinvdtl,cartonNo,lineItr,populateWMSCartonFields){
		var pickCartonRowWise ='';

		if(utility.isValueValid(objinvdtl['pickCarton'])){
			pickCartonRowWise = objinvdtl['pickCarton'];
		}
		var pickCartonInvDtl='';
		if(pickCartonRowWise != '' && pickCartonRowWise != '- None -' ){
			
				pickCartonInvDtl = compSubRecord.getCurrentSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'pickcarton'
					});
		
		      if(pickCartonRowWise != null && pickCartonRowWise != undefined && pickCartonRowWise != '' && pickCartonRowWise != 'null'){
			     pickCartonRowWise = pickCartonRowWise.trim();
		        }
		         if(pickCartonInvDtl != null && pickCartonInvDtl != undefined && pickCartonInvDtl != '' && pickCartonInvDtl != 'null'){
			     pickCartonInvDtl = pickCartonInvDtl.trim();
		        }
			log.debug('pickCartonRowWise',pickCartonRowWise);
			log.debug('pickCartonInvDtl',pickCartonInvDtl);
			if(pickCartonRowWise == pickCartonInvDtl){

				if(populateWMSCartonFields==true)
				{
					compSubRecord.setCurrentSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'custrecord_wmsse_packing_container', 
						value : cartonNo
					});
				}
				compSubRecord.setCurrentSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'packcarton', 
					value : cartonNo
				});
			}
		}
		else {
			if(populateWMSCartonFields==true)
			{
				compSubRecord.setCurrentSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'custrecord_wmsse_packing_container', 
					value : cartonNo
				});
			}
			compSubRecord.setCurrentSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'packcarton', 
				value : cartonNo
			});
			
		}
      compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
        });

	}
	function getItemDetails(itemIdarr){

		var itemDtlSearch = search.load({id:'customsearch_wms_get_item_details'});

		itemDtlSearch.filters.push(search.createFilter({
			name:'internalid',
			operator:search.Operator.ANYOF,
			values:itemIdarr}));

		var	 itemDetails =  utility.getSearchResultInJSON(itemDtlSearch);

		log.debug('itemDetails',itemDetails);

		return itemDetails;
	}
	function getOrderItemDetails(orderIdarr,trantype){

		var orderItemSearch = search.load({id:'customsearch_wms_transaction_item_dtls'});

		orderItemSearch.filters.push(search.createFilter({
			name:'internalid',
			operator:search.Operator.ANYOF,
			values:orderIdarr}));
		orderItemSearch.filters.push(search.createFilter({
			name:'type',
			operator: search.Operator.ANYOF,
			values : trantype 
		}));

		var	 orderItemDetails =  utility.getSearchResultInJSON(orderItemSearch);

		log.debug('orderItemDetails',orderItemDetails);

		return orderItemDetails;
	}
	function getFromLocationCountry(whlocation){

		//Getting fromLocation Country
		var shipFromCountry = '';
		var fromLocRecord = search.load({
			id: 'customsearch_wms_location_add_details'
		});

		fromLocRecord.filters.push(search.createFilter({
			name : 'internalid',
			operator : search.Operator.ANYOF,
			values : whlocation
		}));

		var fromLocationResults = utility.getSearchResultInJSON(fromLocRecord);
		log.debug('fromLocationResults' , fromLocationResults);
		if(fromLocationResults.length > 0)
		{
			shipFromCountry = fromLocationResults[0]['country'];
		}
		return shipFromCountry;
	}
	/**
	 * For international commodity shipment
	 */
	function createCommodityShipment(tranId,trantype,orderId,containerlp,packageWeight,commodityShipmentDetails)
	{       
		var itemIdarr = [];
		var itemDetails =[];
		var orderItemDetails =[]; 
		var itemQty,upccode,itemcountryname,itemunitRate,totalcummedityunit,itemdisplayname;

		orderItemDetails = getOrderItemDetails(orderId,trantype);
		for(var itemId in commodityShipmentDetails)
		{ 	itemId =	itemId.split('-');
		itemIdarr.push(itemId[0]);
		}
		log.debug('itemIdarr',itemIdarr);
		itemDetails = getItemDetails(itemIdarr);

		for(itemId in commodityShipmentDetails)
		{    itemunitRate = '';
		itemQty= commodityShipmentDetails[itemId] ;
		itemId =	itemId.split('-');
		itemId =	itemId[0];

		for(var itemItr = 0; itemItr < itemDetails.length ; itemItr++){
			if(itemDetails[itemItr].id == itemId){
				upccode=itemDetails[itemItr].upccode;
				itemdisplayname=itemDetails[itemItr].displayname;
				itemcountryname=itemDetails[itemItr].countryofmanufacture;
			}
		}
		for(var orderItemItr = 0; orderItemItr < orderItemDetails.length ; orderItemItr++){
			if(orderItemDetails[orderItemItr].item == itemId){
				itemunitRate = orderItemDetails[orderItemItr].rate;
			}
		}

		if(utility.isValueValid(itemunitRate)){
			totalcummedityunit=parseFloat(itemunitRate)*(itemQty);
		}
		//Creating Commodity shipment record
		var commodityShipment = record.create({
			type: 'customrecord_wmsse_commodity_shipmentdts'
		});
		commodityShipment.setValue({
			fieldId : 'name', 
			value : tranId
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_qty', 
			value : Number(parseFloat(itemQty).toFixed(4))
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_unitofmeasure', 
			value : 'EA'
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_unitvalue', 
			value : itemunitRate
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_totalcustomval', 
			value : totalcummedityunit
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmss_shipment_totalcomoditywt', 
			value : packageWeight
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_skuupccode', 
			value : upccode
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_containerlp', 
			value : containerlp
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_orderno', 
			value : tranId
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_contrymanufact', 
			value : itemcountryname
		});
		commodityShipment.setValue({
			fieldId : 'custrecord_wmsse_shipment_commoditydesp', 
			value : itemdisplayname
		});

		var	commodityShipmentId = commodityShipment.save();
		commodityShipment=null;

		}
	}
	function checkAndSetShipStatus(itemFulfilmentRecord,setShipStatus,populateWMSCartonFields){

		var compSubRecord ='';
		var itemType ='';
		var packContainer ='';
		var totalItemLine = itemFulfilmentRecord.getLineCount({
			sublistId: 'item'
		});
		for (var itemLine = 0; itemLine < totalItemLine; itemLine++) {
			packContainer ='';
			 itemFulfilmentRecord.selectLine({
                sublistId: 'item',
                line: itemLine
            });
			if(setShipStatus == 'Y'){
				itemType = itemFulfilmentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'itemtype'
				});
				if(itemType == 'NonInvtPart'){
					packContainer = itemFulfilmentRecord.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_wms_packcarton'
					}); 
					if(!(utility.isValueValid(packContainer)))
					{
						setShipStatus = 'N';
						break;
					}
				}else{
				var	isSubRecordExists = itemFulfilmentRecord.hasCurrentSublistSubrecord({
						sublistId	:'item',
						fieldId : 'inventorydetail'
					});
					if(isSubRecordExists){ 
					compSubRecord = itemFulfilmentRecord.getCurrentSublistSubrecord({
						sublistId	:'item',
						fieldId : 'inventorydetail'
					});

					var complinelength =compSubRecord.getLineCount({
						sublistId:'inventoryassignment'
					});
					for (var lineNo = 0; lineNo < complinelength; lineNo++) {
                            compSubRecord.selectLine({
                                sublistId: 'inventoryassignment',
                                line: lineNo
                             });
					
							packContainer = compSubRecord.getCurrentSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'packcarton'
							});
				
						if(!(utility.isValueValid(packContainer)))
						{
							setShipStatus = 'N';
							break;
						}
					}
			    	}
				}
			}
		}
		if(setShipStatus == 'Y')
			itemFulfilmentRecord.setValue('shipstatus','B'); 

		return setShipStatus;
	}
	function setPackageDetails(itemFulfilmentRecord,packageSublistIdObj,packageDetailsObj,setShipStatus,
		cartonNo,cartonWeight){
		var totalLine = itemFulfilmentRecord.getLineCount({
			sublistId: packageSublistIdObj.packageSublist
		});
      if(setShipStatus == 'Y'){
      	/// Removing the package line created by Core 
      	for(var pckgLine = 0; pckgLine < totalLine; pckgLine++){
      		itemFulfilmentRecord.removeLine({
                    sublistId: packageSublistIdObj.packageSublist,
                    line: 0
                    });
      	}
      	var totalLines = getObjectLength(packageDetailsObj);
      	packageDetailsObj[totalLines] = {'packCarton':cartonNo,
                                        'packageWeight' : cartonWeight};
      }else{
      	packageDetailsObj={};
      	packageDetailsObj[totalLine] = {'packCarton':cartonNo,
                                        'packageWeight' : cartonWeight};
      }
      	for (var packageLine in packageDetailsObj) { 
			itemFulfilmentRecord.selectNewLine({
                    sublistId: packageSublistIdObj.packageSublist
                    });

			itemFulfilmentRecord.setCurrentSublistValue({sublistId: packageSublistIdObj.packageSublist,
				                                 fieldId: packageSublistIdObj.packageDesc,
				                                 value : packageDetailsObj[packageLine].packCarton});
            if(utility.isValueValid(packageDetailsObj[packageLine].packageWeight)) {
				if(packageDetailsObj[packageLine].packageWeight == 0 || packageDetailsObj[packageLine].packageWeight == 0.0 || packageDetailsObj[packageLine].packageWeight == '0' || packageDetailsObj[packageLine].packageWeight == '0.0' || packageDetailsObj[packageLine].packageWeight == '0.0000' || packageDetailsObj[packageLine].packageWeight == undefined || packageDetailsObj[packageLine].packageWeight == '' || packageDetailsObj[packageLine].packageWeight == 'NAN' || packageDetailsObj[packageLine].packageWeight == 'NaN') {
					packageDetailsObj[packageLine].packageWeight = 0.01;
				} else {
					packageDetailsObj[packageLine].packageWeight = parseFloat(packageDetailsObj[packageLine].packageWeight).toFixed(3);
                    if(packageDetailsObj[packageLine].packageWeight == 0 || packageDetailsObj[packageLine].packageWeight == 0.0 || packageDetailsObj[packageLine].packageWeight == '0' || packageDetailsObj[packageLine].packageWeight == '0.0' || packageDetailsObj[packageLine].packageWeight == '0.0000' || packageDetailsObj[packageLine].packageWeight == undefined || packageDetailsObj[packageLine].packageWeight == '' || packageDetailsObj[packageLine].packageWeight == 'NAN' || packageDetailsObj[packageLine].packageWeight == 'NaN') {
                        packageDetailsObj[packageLine].packageWeight = 0.01;
                    }
				}
            } else if(packageDetailsObj[packageLine].packageWeight == 0 || packageDetailsObj[packageLine].packageWeight == 0.0 || packageDetailsObj[packageLine].packageWeight == '0' || packageDetailsObj[packageLine].packageWeight == '0.0' || packageDetailsObj[packageLine].packageWeight == '0.0000' || packageDetailsObj[packageLine].packageWeight == undefined || packageDetailsObj[packageLine].packageWeight == '' || packageDetailsObj[packageLine].packageWeight == 'NAN' || packageDetailsObj[packageLine].packageWeight == 'NaN') {
                packageDetailsObj[packageLine].packageWeight = 0.01;
            }
			itemFulfilmentRecord.setCurrentSublistValue({sublistId: packageSublistIdObj.packageSublist,
				                                 fieldId: packageSublistIdObj.packageWeight,
				                                 value : packageDetailsObj[packageLine].packageWeight});
			itemFulfilmentRecord.commitLine({
            sublistId: packageSublistIdObj.packageSublist
            });
		}
		return itemFulfilmentRecord;
	}
	/**
	 * For GetMaxLPNo
	 */
	function  GetMaxLPNo(lpType,whLocation)
	{
		var maxLP = 1;
		var maxLPPrefix = "";
		var companyDunsNumber = '';
		var lpDtlRec = {};
		//var lpGenType = 1;

		var lp_range_filters = [
			search.createFilter({
				name: 'custrecord_wmsse_lprange_lptype',
				operator: search.Operator.ANYOF,
				values: lpType
			}),
			search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			}),
			/*search.createFilter({
				name: 'custrecord_wmsse_lprange_lpgen_type',
				operator: search.Operator.ANYOF,
				values: lpGenType
			})
			if(utility.isValueValid(whLocation))
		{
			lp_range_filters.push(search.createFilter({
				name: 'custrecord_wmsse_lprange_site',
				operator: search.Operator.ANYOF,
				values:  ['@NONE@', whLocation]
			}));
		}

			*/
			];



		var lprangeSearch = search.load({
			id: 'customsearch_wmsse_lprange_srch_dtls'
		});
		lprangeSearch.filters = lp_range_filters;
		var lprangeSrcResults  =  utility.getSearchResultInJSON(lprangeSearch);

		log.debug('LP Range Results :', lprangeSrcResults);

		if(utility.isValueValid(lprangeSrcResults) && lprangeSrcResults.length > 0)
		{
			if(lprangeSrcResults.length == 1)
			{
				var scount = 1;
				LABL1: for(var i=0;i<scount;i++)
				{
					log.debug('CUSTOM_RECORD_COLLISION', i);
					try
					{
						var vLPRangeId	= lprangeSrcResults[0]['internalid'];
						var lprangeRec 	= record.load({type:'customrecord_wmsse_lp_range', id:vLPRangeId});

						if(utility.isValueValid(lprangeSrcResults[0]['custrecord_wmsse_lprange_lpmax']))
						{
							maxLP 		= lprangeSrcResults[0]['custrecord_wmsse_lprange_lpmax'];

						}
						if(isNaN(maxLP)){
							maxLP=0;
						}
						if(i>0)//collision incremented
						{
							maxLP = parseInt(maxLP) + i;
						}
						companyDunsNumber = lprangeSrcResults[0]['custrecord_wmsse_company_duns_num'];
						maxLP = parseInt(maxLP) + 1;
						log.debug('checking maxLP value before updating in lpmaster record',maxLP);
						lprangeRec.setValue({fieldId: 'custrecord_wmsse_lprange_lpmax', value: maxLP});
						var recid = lprangeRec.save();
						lprangeRec=null;
					}
					catch(e)
					{
						log.error('Exception in Get Max LP', e);
						log.error('check e.name',e.name);

						if(e.name =='CUSTOM_RECORD_COLLISION' || e.name =='RCRD_HAS_BEEN_CHANGED'){
							log.error('into if','');
							scount = scount+1;
							continue LABL1;
						}
						else{
							log.error('into else','');
							break LABL1;
						}
					}
				}
			}
			else
			{
				log.debug('ERROR', 'GetMaxLPNo:LP Max Query returned more than 1 row');
			}
			lprangeSrcResults=null;
		}

		// convert maxLP to string
		maxLP = maxLP.toString();
		log.debug('maxLPPrefix :', maxLPPrefix);
		if(utility.isValueValid(maxLPPrefix))
		{
			maxLP = maxLPPrefix + maxLP;
		}

		lpDtlRec['maxLP'] = maxLP;
		lpDtlRec['companydunsnumber'] = companyDunsNumber;
		return lpDtlRec;
	}
	function getKititemForComponents(arrOrderInternalId){

		var itemObj={};
		var itemwithSubItemObj={};
		var suiteQL= "SELECT \
		             item.itemid AS transactionlinesitemitemit /*{transactionlines.item^item.itemid#RAW}*/, \
              		 transactionLine.linesequencenumber AS transactionlineslinesequence /*{transactionlines.linesequencenumber#RAW}*/, \
             		 transactionLine.kitmemberof AS transactionlineskitmemberof /*{transactionlines.kitmemberof#RAW}*/, \
		             \"TRANSACTION\".\"ID\" AS idRAW /*{id#RAW}*/ \
		             FROM \
		            \"TRANSACTION\", \
		             item, \
		             transactionLine \
		             WHERE \"TRANSACTION\".\"ID\" = transactionLine.\"TRANSACTION\" \
		             AND UPPER(\"TRANSACTION\".\"TYPE\") IN ('ITEMSHIP') \
		             AND NVL(transactionLine.taxline, 'F') = 'F' \
		             AND NVL(transactionLine.donotdisplayline, 'F') = 'F' \
		             AND NVL(transactionLine.iscogs, 'F') = 'F' \
		             AND transactionLine.item = item.\"ID\" \
		             AND UPPER(item.itemtype) IN ('SUBSCRIPLAN', 'SUBTOTAL', 'SHIPITEM', 'SERVICE', 'TAXITEM', 'TAXGROUP', 'PAYMENT', 'OTHCHARGE', 'NONINVTPART', 'MARKUP', 'KIT', 'GROUP', 'INVTPART', 'GIFTCERT', 'EXPENSE', 'ENDGROUP', 'DWNLDITEM', 'DISCOUNT', 'DESCRIPTION', 'ASSEMBLY')  \
		             AND transactionLine.createdfrom IN ("+  arrOrderInternalId +" )";
		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL(suiteQL); 
		var queryResults = resultSuiteQL.results;
		/* Results from SuiteQL are {"values":[ "kitItem004", (order Line)6,null,9989]},
         {"values":[ "PinvtItem01", (order Line)7, (parent Kit Item Line Number)6,(IF Id) 34344]}*/
//		Creating an object with key as (IF id and Line Number) and value as (item name) 
		for(var row in queryResults){
			var resultsRow = queryResults[row].values;
			itemObj[resultsRow[3]+'-'+resultsRow[1]] =  resultsRow[0];
		}
		// Creating final Object with key as (IF Internal Id and order Line Id) and value as kit item name if any.
		// Getting kit item line number for respective kit component item order line in index 6.
		for(var row in queryResults){
			var resultsRow = queryResults[row].values;
			if(resultsRow[2] != null){
				itemwithSubItemObj[resultsRow[3]+'-'+resultsRow[1]] = itemObj[resultsRow[3]+'-'+resultsRow[2]];
			}else{
				itemwithSubItemObj[resultsRow[3]+'-'+resultsRow[1]] = null;
			}
		}
		log.debug('queryResults',queryResults);
		log.debug('itemwithSubItemObj',itemwithSubItemObj);
		return itemwithSubItemObj;
	}
	function fnUpdateShipManifestRecord(inputParamObj){
		var vContLpNo = inputParamObj.contLpNo ;
		var vordNo = inputParamObj.ordNo ;
		var vTrackingNo = inputParamObj.trackingNo ;
		var vActualweight = inputParamObj.actualweight ;
		var shipManifestId='';
		var itemFulfillmentId ='';
		var shipmanifestData = {};	       

		if(utility.isValueValid(inputParamObj.shipManifestId))
		{
			 record.submitFields({
				type: 'customrecord_wmsse_ship_manifest',
				id: inputParamObj.shipManifestId,
				values: {
					'custrecord_wmsse_ship_trackno': vTrackingNo,
					'custrecord_wmsse_ship_actwght': vActualweight,
					'custrecord_wmsse_ship_masttrackno': vTrackingNo,
					'custrecord_wmsse_ship_void': 'U',
					'custrecord_wms_quickship_flag' : inputParamObj.quickshipFlag						
				}
			});
            itemFulfillmentId = inputParamObj.itemFulfillmentId;
            shipManifestId = inputParamObj.shipManifestId;
		}
		 
		return {'shipManifestId' : shipManifestId , 'itemFulfillmentId' : itemFulfillmentId  };
	}
	function updateItemFulfillmentinUE(warehouseLocationId,itemFulfillmentId,orderId,itemFulfillmentRecord)
	{   var scriptObj = runtime.getCurrentScript();
		var cartonNo=itemFulfillmentId;
		var cartonWeight='1.0';
		var objItemLevelDtl ={};
		var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
		var labelsSystemRuleObj = getPackingSystemruleData(warehouseLocationId,orderId);
var processType = '';
		var scount = 1;
		LABL1: for(var i=0;i<scount;i++) {

			try {
			if(scount===1) {
				var outputObj = updateCustomFieldsinItemFulfilment(orderId, itemFulfillmentRecord);
				itemFulfillmentRecord = outputObj.itemFulfillmentRecord;
				// Transfer of pick carton from pick task to Item fulfillment
				fnGetandUpdatePickCartondetails(itemFulfillmentRecord, itemFulfillmentId, orderId, populateWMSCartonFields);


				if (labelsSystemRuleObj.manualPackingEnabled == 'N') {
					//Complete Auto Packing - update pack carton and package details
					var packcartondetails = autoPackingProcess(itemFulfillmentId, warehouseLocationId, cartonWeight, itemFulfillmentRecord, populateWMSCartonFields);

					//WMS shipmanifest record and labels creation
					if (utility.isValueValid(packcartondetails)) {
						var totalLinelength = itemFulfillmentRecord.getLineCount({
							sublistId: 'item'
						});

						for (var sublistline = 0; sublistline < totalLinelength; sublistline++) {

							var itemId = itemFulfillmentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'item',
								line: sublistline
							});
							var lineNo = itemFulfillmentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'line',
								line: sublistline
							});
							var vActqty = itemFulfillmentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'quantity',
								line: sublistline
							});
							objItemLevelDtl[itemId + "-" + lineNo] = vActqty;
						}

						if (scriptObj.getRemainingUsage() > scriptUsageRequired(packcartondetails, labelsSystemRuleObj, totalLinelength)) {
							var inputParamObj = {};
							inputParamObj.orderId = orderId;
							inputParamObj.ordertype = outputObj.ordertype;
							inputParamObj.warehouseLocationId = warehouseLocationId;
							inputParamObj.itemFulfillmentId = itemFulfillmentId;
							inputParamObj.objItemLevelDtl = objItemLevelDtl;
							inputParamObj.recordType = outputObj.recordType;
							inputParamObj.labelsSystemRuleObj = labelsSystemRuleObj;
							inputParamObj.itemId = itemId;
							for (var packCartonvalue = 0; packCartonvalue < packcartondetails.length; packCartonvalue++) {
								cartonNo = packcartondetails[packCartonvalue];
								inputParamObj.cartonNo = cartonNo;
								customRecordsCreationAfterPacking(inputParamObj);
							}
						} else {
							var mapReducetask = task.create({taskType: task.TaskType.MAP_REDUCE});
							mapReducetask.scriptId = 'customscript_wms_mr_autopack_reccreation';
							mapReducetask.params = {
								"custscript_wms_mr_packing_whlocation": warehouseLocationId,
								"custscript_wms_mr_packing_ifinternalid": itemFulfillmentId,
								"custscript_wms_mr_packing_orderid": orderId,
								"custscript_wms_mr_packing_cartondetails": packcartondetails,
								"custscript_wms_mr_packing_ordertype": outputObj.ordertype,
								"custscript_wms_mr_packing_itemlveldetail": objItemLevelDtl,
								"custscript_wms_mr_packing_recordtype": outputObj.recordType,
								"custscript_wms_mr_packing_systemruledata": labelsSystemRuleObj
							};
							log.debug('mapReducetask.params', mapReducetask.params);
							mapReducetask.submit();		// Calling scheduler for large data set processing
							var currentUserID = runtime.getCurrentUser().id;//To get current user
							utility.updateScheduleScriptStatus('WMS Auto Packing Labels Creation Map Reduce', currentUserID,
								'Submitted', itemFulfillmentId, warehouseLocationId);
						}
					}
				} else {
					itemFulfillmentRecord.save();
				}
			}
			else {
				itemFulfillmentRecord.save();
			}


			}
			catch(e)
			{
				log.error('Exception in Get Max LP', e);
				log.error('check e.name',e.name);

				if(e.name =='CUSTOM_RECORD_COLLISION' || e.name =='RCRD_HAS_BEEN_CHANGED' || e.name=='UNEXPECTED_ERROR'){
					log.error('scount',scount);
					if(scount==3)
					{
						break LABL1;
					}
					else {
						scount = scount+1;
						continue LABL1;
					}

				}
				else{
					log.error('into else','');
					break LABL1;
				}
			}

		}

		
	}
	function scriptUsageRequired(packcartondetails,labelsSystemRuleObj,IFitemLines){
        	var IFLineUsagePackListHtml = parseFloat(IFitemLines)*10; // Lines wise usage calculation for Packlisthtml creation
		var cartonwiseUsageRequired = 80; //standard
		var bufferScriptUsage = 50;
		if(labelsSystemRuleObj.ASNCRuleVal == 'Y'){
            cartonwiseUsageRequired = parseFloat(cartonwiseUsageRequired)+parseFloat(20);
		}
		if(labelsSystemRuleObj.UCCRuleVal == 'Y'){
            cartonwiseUsageRequired = parseFloat(cartonwiseUsageRequired)+parseFloat(20);
		}
		if(labelsSystemRuleObj.Zebraucclabel == 'Y'){
            cartonwiseUsageRequired = parseFloat(cartonwiseUsageRequired)+parseFloat(55);
		}
		if(labelsSystemRuleObj.ZebraAddresslabel == 'Y'){
            cartonwiseUsageRequired = parseFloat(cartonwiseUsageRequired)+parseFloat(45);
		}
		var scriptUsageNeeded = (packcartondetails.length) * cartonwiseUsageRequired ;
		scriptUsageNeeded = parseFloat(scriptUsageNeeded) + parseFloat(bufferScriptUsage) + IFLineUsagePackListHtml;
		return scriptUsageNeeded;
	}
	function getPackingSystemruleData(warehouseLocationId,orderId){
		var labelsSystemRuleObj={};
		var txnOrderType = '';
		var processType = '';
		var fieldLookUp = search.lookupFields({
			type: search.Type.TRANSACTION,
			id: orderId,
			columns: ['type','ordertype']
		});
		if( utility.isValueValid(fieldLookUp.ordertype[0])){
			log.debug('into txnOrderType',txnOrderType);
			txnOrderType= fieldLookUp.ordertype[0].value;
		}
		ordertype=fieldLookUp.type[0].value;

		if(ordertype=='SalesOrd')
			processType='Sales Order';
		else if(ordertype=='TrnfrOrd')
			processType='Transfer Order';

		log.debug('txnOrderType txnOrderType',txnOrderType);

      //  var manualPackingEnabled = utility.getSystemRuleValue('Manually pack orders?',warehouseLocationId,processType);
		var manualPackingEnabled = utility.getSystemRuleValueWithProcessType('Manually pack orders?',warehouseLocationId,processType);
			labelsSystemRuleObj.manualPackingEnabled = manualPackingEnabled;
		if(manualPackingEnabled=='N'){
		var ASNCRuleVal = utility.getSystemRuleValue('Generate EDI 856 outbound ASNs?',warehouseLocationId);
		var UCCRuleVal=utility.getSystemRuleValue('Label Printing: UCC/GS1 Labels with 3rd party integration',warehouseLocationId);
		var Zebraucclabel=utility.getSystemRuleValue('Label Printing: UCC/GS1 labels using ZPL',warehouseLocationId);
		var ZebraAddresslabel=utility.getSystemRuleValue('Label Printing: Address labels using ZPL',warehouseLocationId);
          labelsSystemRuleObj.ASNCRuleVal= ASNCRuleVal;
          labelsSystemRuleObj.UCCRuleVal= UCCRuleVal;
          labelsSystemRuleObj.Zebraucclabel= Zebraucclabel;
          labelsSystemRuleObj.ZebraAddresslabel= ZebraAddresslabel;
		}
		return labelsSystemRuleObj;
	}
    function customRecordsCreationAfterPacking(inputParamObj){
    	var vCarrierType='';
		var vTrackingNo='';
		var vActualweight='1.0';
		var PackageWeight='1.0';
		var cartonSize='';
			log.debug('inputParamObj',inputParamObj);
        //Ucc Label creation
        var uccNo=PackinglabelCreation(inputParamObj.orderId, inputParamObj.cartonNo,inputParamObj.warehouseLocationId,
            inputParamObj.itemFulfillmentId,inputParamObj.recordType,inputParamObj.labelsSystemRuleObj);

		fnCreateShipManifestRecord(inputParamObj.orderId,'',inputParamObj.cartonNo,vCarrierType,vTrackingNo,vActualweight,
						PackageWeight,inputParamObj.ordertype,inputParamObj.warehouseLocationId,inputParamObj.itemFulfillmentId,
						cartonSize,inputParamObj.itemId,inputParamObj.objItemLevelDtl,uccNo);

				
    }
    function updateCustomFieldsinItemFulfilment(orderId,itemFulfillmentRecord){
    	var txnOrderType ='';
    	var ordertype='';
    	var recordType ='';
    	var fieldLookUp = search.lookupFields({
			type: search.Type.TRANSACTION,
			id: orderId,
			columns: ['type','ordertype']
		});
		if( utility.isValueValid(fieldLookUp.ordertype[0])){
			txnOrderType= fieldLookUp.ordertype[0].value;
		}
		    ordertype=fieldLookUp.type[0].value;

		if(ordertype=='SalesOrd')
			recordType='salesorder';					
		else if(ordertype=='TrnfrOrd')
			recordType='transferorder';	

		/*Search on Item Fulfillment is not returning Tran Type value so to mitigate core limitation 
		we are explictly updating the tran type to transaction body field */
		itemFulfillmentRecord.setValue('custbody_wmsse_transactiontype',ordertype); 
		itemFulfillmentRecord.setValue('custbody_wms_ordertype',txnOrderType);
		return {'recordType' : recordType,'ordertype':ordertype, 'itemFulfillmentRecord' : itemFulfillmentRecord};

    }

	function fnGetandUpdatePickCartondetails(itemFulfillmentRecord,ifInternalId,transactionInternalId,populateWMSCartonFields)
	{  
		var pickTaskId='';
		var picktasklineNo='';
		var compSubRecord='';
		var picktaskItem='';
		var objPickTaskLineDtl= {};
		var arrPTInvDtl =[];
		var pickCartonDtlObj = {};
		var kitItemFlag= '';
		var kitItemFlagPrev = '';
		var ifLine = 0;
		var objPickTaskLineInfo = {};
		var isItemLineExists = false ;
		var itemType ='';
		var objPTSearchDetails = getPickTaskDtl(ifInternalId);
		try
		{
			if(objPTSearchDetails.length > 0){
				for(var k=0;k<objPTSearchDetails.length;k++){    
					objPickTaskLineDtl = {};
					pickTaskId =  objPTSearchDetails[k]['id'];
					picktasklineNo=  objPTSearchDetails[k]['line'];
					picktaskItem=  objPTSearchDetails[k]['item'];
					kitItemFlag =  objPTSearchDetails[k]['lineitemsubitemof'];
					itemType = objPTSearchDetails[k]['type'];
					isItemLineExists = false;
					if( (utility.isValueValid(kitItemFlag) && !(utility.isValueValid(kitItemFlagPrev))) ||
						(utility.isValueValid(kitItemFlag) && utility.isValueValid(kitItemFlagPrev) &&
						 kitItemFlag !=kitItemFlagPrev )){
						ifLine++;
				}
				if(itemType != 'NonInvtPart' && itemType!='Service'){

					var vPicktaskRec = record.load({type:'picktask',
						id:pickTaskId
					});

					var pickTaskItemcount = vPicktaskRec.getLineCount({
						sublistId: 'pickactions'
					});

					for(var Ifitr=0;Ifitr<pickTaskItemcount;Ifitr++){

						var pickTaskOrderId = vPicktaskRec.getSublistValue({sublistId: 'pickactions',fieldId: 'ordernumber',line:Ifitr});
						var lineId = vPicktaskRec.getSublistValue({sublistId: 'pickactions',fieldId: 'linenumber',line:Ifitr});

						if(transactionInternalId == pickTaskOrderId && picktasklineNo == lineId){

							compSubRecord = vPicktaskRec.getSublistSubrecord({
								sublistId :'pickactions',
								fieldId : 'inventorydetail',
								line : parseInt(Ifitr)
							});

							var compinvlinelength =compSubRecord.getLineCount({
								sublistId:'inventoryassignment'
							});
							for(var i=0;i<compinvlinelength;i++){

								arrPTInvDtl=[];
								var qty = compSubRecord.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'quantity',
									line : i
								});
								var invNumber=	compSubRecord.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'issueinventorynumber',
									line : i
								});


								var	pickCarton=	compSubRecord.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'pickcarton',
									line : i
								});

								var	pickTaskbin=compSubRecord.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'binnumber',
									line : i
								});



								arrPTInvDtl = [invNumber,qty,pickCarton,pickTaskbin];

								objPickTaskLineDtl[i] = arrPTInvDtl;	
							}
								//if the SO line have two pick taks with diffent cartons we are adding those cartons to same object.
								if(utility.isValueValid(objPickTaskLineInfo[picktasklineNo]) || objPickTaskLineInfo[picktasklineNo] == 0)								
								{
									isItemLineExists = true;
									var ifLineData = objPickTaskLineInfo[picktasklineNo];									
									var objPickTaskData = pickCartonDtlObj[ifLineData];
									
									var objlength = getObjectLength(objPickTaskData);									
									
									for(var line in objPickTaskLineDtl){											
										objPickTaskData[objlength] = objPickTaskLineDtl[line];
										objlength++;
									}
									
									
									pickCartonDtlObj[ifLineData] = objPickTaskData;

								}else{
									pickCartonDtlObj[ifLine] = objPickTaskLineDtl;
									objPickTaskLineInfo[picktasklineNo] = ifLine;
								}
								
							}
						}
					}
					kitItemFlagPrev =  kitItemFlag ;
					if(utility.isValueValid(kitItemFlag)){
						if(itemType != 'NonInvtPart'){
							ifLine++;
						}
					}else{
						if(!isItemLineExists){
							ifLine++;
						}
					}
				}
				log.debug('pickCartonDtlObj',pickCartonDtlObj);
				updatePickCartoninfulfillment(itemFulfillmentRecord,pickCartonDtlObj,populateWMSCartonFields);
			}
		}
		catch(e)
		{
			log.error({title:'error in  autopackingUpdate',details:e});
		}
	}

	function getObjectLength(obj){
		var key, count = 0;
		for(key in obj) {
			if(obj.hasOwnProperty(key)) {
				count++;
			}
			
		}
		return count;
	}

	function updatePickCartoninfulfillment(itemFulfillmentRecord,pickCartonDtlObj,populateWMSCartonFields)
	{
		var arrInvDtl= [];

		for(var intItr in pickCartonDtlObj ){
			arrInvDtl= [];
			itemFulfillmentRecord.selectLine({
                                            sublistId: 'item',
                                            line: intItr
                                             });
			var compSubRecord=itemFulfillmentRecord.getCurrentSublistSubrecord({sublistId: 'item',fieldId: 'inventorydetail'});
			var objPickTaskDtl = pickCartonDtlObj[intItr];

			for (var n  in objPickTaskDtl ) {
				arrInvDtl = objPickTaskDtl[n];		

				compSubRecord.selectLine({
                                           sublistId: 'inventoryassignment',
                                           line: n
                                        });

				var fulfillmentinvNumber=compSubRecord.getCurrentSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'issueinventorynumber'
				});					

				var	fulfillmentqty=compSubRecord.getCurrentSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'quantity'
				});	

				var picktaskinvnumber=arrInvDtl[0];
				var picktaskqty=arrInvDtl[1];

				if(fulfillmentinvNumber==picktaskinvnumber && fulfillmentqty==picktaskqty )
				{
					if(populateWMSCartonFields==true)
			         {
				       compSubRecord.setCurrentSublistValue({
					          sublistId : 'inventoryassignment',
					          fieldId : 'custrecord_wms_pickcarton',
					          value: arrInvDtl[2]
				              });
			          }
					compSubRecord.setCurrentSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'pickcarton',
						value: arrInvDtl[2]
					});
					compSubRecord.commitLine({
                        sublistId: 'inventoryassignment'
                     });
				}

			}
          itemFulfillmentRecord.commitLine({
            sublistId: 'item'
          });
		}			
	}

	function getPickTaskDtl(ifInternalId){

		var pickTaskSearch = search.load({id:'customsearch_wms_get_picktask_dtl'});

		var pickTaskSearchFilters = pickTaskSearch.filters;

		pickTaskSearchFilters.push(search.createFilter({
			name:'lineitemtransactionnumber',
			operator:search.Operator.ANYOF,
			values:ifInternalId}));

		pickTaskSearch.filters = pickTaskSearchFilters;

		var	 objPTSearchDetails =  utility.getSearchResultInJSON(pickTaskSearch);

		log.debug('objPTSearchDetails',objPTSearchDetails);
		return objPTSearchDetails;
	}

	function autoPackingProcess(itemFulfillmentId,warehouseLocationId,cartonWeight,itemFulfillmentRecord,populateWMSCartonFields)
	{
		var packCartonArr  = [];
		var packCartonObj = {};
		var packCartonName = itemFulfillmentId;
		var addedCartonObj ={};
		itemFulfillmentRecord.setValue('shipstatus','B');

		var totalLinelength = itemFulfillmentRecord.getLineCount({
			sublistId: 'item'
		});

        if(totalLinelength>0) {
            var isOneWorldAccount = runtime.isFeatureInEffect({feature: 'subsidiaries'});
            if(isOneWorldAccount) {
                var location  = itemFulfillmentRecord.getSublistValue({sublistId: 'item',fieldId: 'location',line:0});
                var locationWeightUnit = query.runSuiteQL({
                    query: 'SELECT custrecord_wms_countryweight_wlabel FROM customrecord_wms_countryweight WHERE custrecord_wms_countryweight_cc = (SELECT country FROM subsidiary WHERE id = (SELECT subsidiary FROM location WHERE id = ?))',
                    params: [location]
                }).asMappedResults()[0].custrecord_wms_countryweight_wlabel;
            } else {
                var locationWeightUnit = query.runSuiteQL({
                    query: 'SELECT custrecord_wms_countryweight_wlabel FROM customrecord_wms_countryweight WHERE custrecord_wms_countryweight_cc = ?',
                    params: [runtime.country]
                }).asMappedResults()[0].custrecord_wms_countryweight_wlabel;
            }
        }

        for (var itemLine = 0; itemLine < totalLinelength; itemLine++) {

			 itemFulfillmentRecord.selectLine({
                                              sublistId: 'item',
                                              line: itemLine
                                              });
			var isSubRecordExists = itemFulfillmentRecord.hasCurrentSublistSubrecord({
				sublistId	:'item',
				fieldId : 'inventorydetail'
			});

			var itemType = itemFulfillmentRecord.getCurrentSublistValue({sublistId: 'item',fieldId: 'itemtype'});

			if(isSubRecordExists == true && itemType!='NonInvtPart' && itemType!='Service')
			{   var compSubRecord = itemFulfillmentRecord.getCurrentSublistSubrecord({
				sublistId	:'item',
				fieldId : 'inventorydetail'
			    });
				var complinelength =compSubRecord.getLineCount({
					sublistId:'inventoryassignment'
				});

				for (var inventoryDtlLine = 0; inventoryDtlLine < complinelength; inventoryDtlLine++) {

					compSubRecord.selectLine({
                                              sublistId: 'inventoryassignment',
                                              line: inventoryDtlLine
                                              });

					var pickCartonName = compSubRecord.getCurrentSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'pickcarton'
					});
					var quantity = compSubRecord.getCurrentSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'quantity'
					});

					if(pickCartonName){
						packCartonName = pickCartonName;
						if(packCartonArr.indexOf(packCartonName)==-1)
						{
							packCartonArr.push(packCartonName);
						}
					}
					else
					{
						if(packCartonArr.indexOf(packCartonName)==-1)
						{
							packCartonArr.push(packCartonName);
						}
					}

					if(populateWMSCartonFields==true)
					{
						compSubRecord.setCurrentSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'custrecord_wmsse_packing_container',
							value : packCartonName
						});
					}

					compSubRecord.setCurrentSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'packcarton', 
						value : packCartonName
					});

                   compSubRecord.commitLine({
                                         sublistId: 'inventoryassignment'
                                        });
                packCartonObj = getItemWeightforQuantity(locationWeightUnit,itemFulfillmentRecord,itemLine,quantity,packCartonObj,packCartonName,inventoryDtlLine,addedCartonObj);
                

				}
			}

			if(itemType=='NonInvtPart' || itemType=='Service')
			{   
				var nonInvItemQuantity = itemFulfillmentRecord.getCurrentSublistValue({
						sublistId : 'item',
						fieldId : 'quantity'
					});

				if(packCartonArr.length>0)
				{
					itemFulfillmentRecord.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_wms_packcarton',value:packCartonArr[0]});
				    packCartonObj = getItemWeightforQuantity(locationWeightUnit, itemFulfillmentRecord,itemLine,nonInvItemQuantity,packCartonObj,packCartonArr[0],0);

				}
				else
				{
					itemFulfillmentRecord.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_wms_packcarton',value:packCartonName});					
                    packCartonObj = getItemWeightforQuantity(locationWeightUnit, itemFulfillmentRecord,itemLine,nonInvItemQuantity,packCartonObj,packCartonName,0);
					if(packCartonArr.indexOf(packCartonName)==-1)
					{
						packCartonArr.push(packCartonName);
					}
				}
			}
			itemFulfillmentRecord.commitLine({
                                         sublistId: 'item'
                                        });
		}

        if(utility.isValueValid(packCartonObj[packCartonName])) {
            if(packCartonObj[packCartonName] == 0 || packCartonObj[packCartonName] == 0.0 || packCartonObj[packCartonName] == '0' || packCartonObj[packCartonName] == '0.0' || packCartonObj[packCartonName] == '0.0000' || packCartonObj[packCartonName] == undefined || packCartonObj[packCartonName] == '' || packCartonObj[packCartonName] == 'NAN' || packCartonObj[packCartonName] == 'NaN') {
                packCartonObj[packCartonName] = 0.01;
            } else {
                packCartonObj[packCartonName] = parseFloat(packCartonObj[packCartonName]).toFixed(3);
                if(packCartonObj[packCartonName] == 0 || packCartonObj[packCartonName] == 0.0 || packCartonObj[packCartonName] == '0' || packCartonObj[packCartonName] == '0.0' || packCartonObj[packCartonName] == '0.0000' || packCartonObj[packCartonName] == undefined || packCartonObj[packCartonName] == '' || packCartonObj[packCartonName] == 'NAN' || packCartonObj[packCartonName] == 'NaN') {
                    packCartonObj[packCartonName] = 0.01;
                }
            }
        } else if(packCartonObj[packCartonName] == 0 || packCartonObj[packCartonName] == 0.0 || packCartonObj[packCartonName] == '0' || packCartonObj[packCartonName] == '0.0' || packCartonObj[packCartonName] == '0.0000' || packCartonObj[packCartonName] == undefined || packCartonObj[packCartonName] == '' || packCartonObj[packCartonName] == 'NAN' || packCartonObj[packCartonName] == 'NaN') {
            packCartonObj[packCartonName] = 0.01;
        }

        var packageSublistIdObj =  getPackagestabInternalIds(itemFulfillmentRecord);
      
        itemFulfillmentRecord = updatePackagesinIF(itemFulfillmentRecord,packageSublistIdObj,packCartonObj);
		
		itemFulfillmentRecord.save();	
		return packCartonArr;
	}
	function PackinglabelCreation(vorderNo,cartonNo,warehouseLocationId,itemFulfillmentId,recordType,labelsSystemRuleObj)
	{
        var uccNo='';
		createPacklistHtml(vorderNo,recordType,null,cartonNo,warehouseLocationId);//to be decided

		if(labelsSystemRuleObj.ASNCRuleVal =='Y')
		{
			var uompackFlag = 1;
			 uccNo=GenerateLabel(vorderNo,uompackFlag,cartonNo, warehouseLocationId);
			//To generate label
		}
		var salesorderrecords = record.load({type:recordType,
			id:vorderNo

		});
		if(labelsSystemRuleObj.UCCRuleVal =='Y')
		{

			GenerateUCCLabel(vorderNo,cartonNo,salesorderrecords);

		}

		if(labelsSystemRuleObj.Zebraucclabel =='Y')
		{
			GenerateZebraUccLabel(vorderNo,cartonNo,salesorderrecords,warehouseLocationId, itemFulfillmentId);

		}
		if(labelsSystemRuleObj.ZebraAddresslabel =='Y')
		{

            GenerateZebraAddressLabel(vorderNo,salesorderrecords,warehouseLocationId);
		}
		return uccNo;
	}
	// To get Packages tab intrnalid's based on shipping method
	function getPackagestabInternalIds(itemFulfilmentRecord){
		var packageSublist = 'package';
		var packageDesc = 'packagedescr';
		var packageWeight = 'packageweight';
		var packageTrackingNumber = 'packagetrackingnumber' ;
        try{ 
        	
        	var totalLinePackageups = itemFulfilmentRecord.getLineCount({
			sublistId: 'packageups'
		});
        	var totalLinePackageusps = itemFulfilmentRecord.getLineCount({
			sublistId: 'packageusps'
		});
        	var totalLinePackagefedex = itemFulfilmentRecord.getLineCount({
			sublistId: 'packagefedex'
		});
        	if(totalLinePackageups >= 0){
        		packageSublist = 'packageups';
		        packageDesc = 'packagedescrups';
		        packageWeight = 'packageweightups';
		        packageTrackingNumber = 'packagetrackingnumberups' ;
        	}else if(totalLinePackageusps >= 0){
        		packageSublist = 'packageusps';
		        packageDesc = 'packagedescrusps';
		        packageWeight = 'packageweightusps';
		        packageTrackingNumber = 'packagetrackingnumberusps' ;
        	}else if(totalLinePackagefedex >= 0){
        		packageSublist = 'packagefedex';
		        packageDesc = 'packagedescrfedex';
		        packageWeight = 'packageweightfedex';
		        packageTrackingNumber = 'packagetrackingnumberfedex' ;
        	}
	    }catch(e){
	    	log.error('Error in getPackagestabInternalIds', e);
	    }

       return { 'packageSublist' : packageSublist ,
                'packageDesc' : packageDesc ,
                'packageWeight' :packageWeight ,
                'packageTrackingNumber' : packageTrackingNumber
              };
	}
	function updatePackagesinIF(itemFulfilmentRecord,packageSublistIdObj,packCartonObj){
		var totalLinelength = itemFulfilmentRecord.getLineCount({
			sublistId: packageSublistIdObj.packageSublist
		});

		
		for(var pckgLine = 0; pckgLine < totalLinelength; pckgLine++){
			itemFulfilmentRecord.removeLine({
				sublistId: packageSublistIdObj.packageSublist,
				line: 0
			});
		}

		for (var packCarton in packCartonObj) {
			    itemFulfilmentRecord.selectNewLine({
                                                sublistId: packageSublistIdObj.packageSublist
                                               });
 
				itemFulfilmentRecord.setCurrentSublistValue({sublistId:  packageSublistIdObj.packageSublist ,
					                                  fieldId: packageSublistIdObj.packageDesc,
					                                  value : packCarton});
                if(utility.isValueValid(packCartonObj[packCarton])) {
					if(packCartonObj[packCarton] == 0 || packCartonObj[packCarton] == 0.0 || packCartonObj[packCarton] == '0' || packCartonObj[packCarton] == '0.0' || packCartonObj[packCarton] == '0.0000' || packCartonObj[packCarton] == undefined || packCartonObj[packCarton] == '' || packCartonObj[packCarton] == 'NAN' || packCartonObj[packCarton] == 'NaN') {
						packCartonObj[packCarton] = 0.01;
					} else {
						packCartonObj[packCarton] = parseFloat(packCartonObj[packCarton]).toFixed(3);
                        if(packCartonObj[packCarton] == 0 || packCartonObj[packCarton] == 0.0 || packCartonObj[packCarton] == '0' || packCartonObj[packCarton] == '0.0' || packCartonObj[packCarton] == '0.0000' || packCartonObj[packCarton] == undefined || packCartonObj[packCarton] == '' || packCartonObj[packCarton] == 'NAN' || packCartonObj[packCarton] == 'NaN') {
                            packCartonObj[packCarton] = 0.01;
                        }
					}
                } else if(packCartonObj[packCarton] == 0 || packCartonObj[packCarton] == 0.0 || packCartonObj[packCarton] == '0' || packCartonObj[packCarton] == '0.0' || packCartonObj[packCarton] == '0.0000' || packCartonObj[packCarton] == undefined || packCartonObj[packCarton] == '' || packCartonObj[packCarton] == 'NAN' || packCartonObj[packCarton] == 'NaN') {
                    packCartonObj[packCarton] = 0.01;
                }
			    itemFulfilmentRecord.setCurrentSublistValue({sublistId: packageSublistIdObj.packageSublist,
			    	                                  fieldId: packageSublistIdObj.packageWeight,
			    	                                  value :packCartonObj[packCarton]});
			    itemFulfilmentRecord.commitLine({
                                         sublistId: packageSublistIdObj.packageSublist
                                        });
		}
		return itemFulfilmentRecord;
	}

	function getItemWeightforQuantity(locationWeightUnit,itemFulfillmentRecord,lineNo,quantity,packCartonObj,packCarton,inventoryDtlLine,addedCartonObj){
		try{ 
        var unitConversion = itemFulfillmentRecord.getSublistValue({sublistId: 'item',fieldId: 'unitconversion',line:lineNo});
        var isSerialItem  = itemFulfillmentRecord.getSublistValue({sublistId: 'item',fieldId: 'isserial',line:lineNo});
        var itemId  = itemFulfillmentRecord.getSublistValue({sublistId: 'item',fieldId: 'item',line:lineNo});
            var itemWeight='';
            
            var fieldLookUp = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ['weight', 'weightunit']
            });
            if(utility.isValueValid(fieldLookUp.weightunit)) {
                var itemWeightUnit = fieldLookUp.weightunit[0].text;
            }
            if(utility.isValueValid(fieldLookUp.weight)){
                itemWeight= fieldLookUp.weight;
                if(utility.isValueValid(fieldLookUp.weightunit) && utility.isValueValid(locationWeightUnit) && locationWeightUnit != itemWeightUnit && locationWeightUnit.substring(0,2) != itemWeightUnit) {
                    itemWeight = getPackingConvertedWeight(itemWeight, itemWeightUnit, locationWeightUnit);
                }
            }

       if((utility.isValueValid(itemWeight) && (Number(Big(itemWeight)) != 0)) || inventoryDtlLine == 0 || 
       	(utility.isValueValid(addedCartonObj) && utility.isValueValid(addedCartonObj[lineNo]) && addedCartonObj[lineNo].indexOf(packCarton) == -1)){
         try{
        if(utility.isValueValid(itemWeight) && Number(Big(itemWeight)) != 0){
        	 if(utility.isValueValid(unitConversion) && isSerialItem != 'T'){
        	quantity = Number(Big(quantity).mul(unitConversion));
             }
        	itemWeight = Number(Big(itemWeight).mul(quantity));
          }else{
        	itemWeight = 0;
          }
          if(utility.isValueValid(addedCartonObj)){
          	if(utility.isValueValid(addedCartonObj[lineNo])){
            addedCartonObj[lineNo].push(packCarton);
         }else{
         	addedCartonObj[lineNo] = [packCarton];
         }
         }
   
        }catch(e){
        	itemWeight = 0;
        }
        if(utility.isValueValid(packCartonObj[packCarton])){
            packCartonObj[packCarton] =  Number(Big(packCartonObj[packCarton]).plus(itemWeight));
        }else{
        	packCartonObj[packCarton] =  itemWeight;
        }
        }
        log.debug('packCartonObj',packCartonObj);
        }
        catch(e){
        	log.error('Error in getItemWeightforQuantity', e);
        	packCartonObj[packCarton] =  0;
        }
        return packCartonObj;
	}

	function getIFPackageDetails(itemFulfilmentRecord,packageSublistIdObj,cartonNo,cartonWeight){
		var totalLinelength = itemFulfilmentRecord.getLineCount({
			sublistId: packageSublistIdObj.packageSublist
		});
		var packCarton ='';
		var packWeight = '';
		var packageDetailsObj ={};
		for (var itr=0;itr<totalLinelength;itr++) {
			    itemFulfilmentRecord.selectLine({
                                                sublistId: packageSublistIdObj.packageSublist,
                                                line : itr
                                               });
 
				 packCarton = itemFulfilmentRecord.getCurrentSublistValue({
					                                  sublistId:  packageSublistIdObj.packageSublist ,
					                                  fieldId: packageSublistIdObj.packageDesc 
					                               });
			     packWeight = itemFulfilmentRecord.getCurrentSublistValue({
			    	                                  sublistId: packageSublistIdObj.packageSublist,
			    	                                  fieldId: packageSublistIdObj.packageWeight
			    	                                });
               packageDetailsObj[itr] = {'packCarton' : packCarton,
                                         'packageWeight' : packWeight
                                        };
		}

		return packageDetailsObj;
	}
	 function noCodeSolForQuickship(shipManifestId,itemFulfillmentId)
	{  
		var shipManifestIdArr =[];
		var itemFulfillmentIdArr = [];
        var impactedRecords = {};

        if(utility.isValueValid(shipManifestId)){
        	shipManifestIdArr = shipManifestId.split(',');
        	if(!utility.isValueValid(shipManifestIdArr[(shipManifestIdArr.length)-1])){
             shipManifestIdArr.pop();
        	}
		}else{
			shipManifestIdArr.push();
		}
		if(utility.isValueValid(itemFulfillmentId)){
        	itemFulfillmentIdArr = itemFulfillmentId.split(',');
        	if(!utility.isValueValid(itemFulfillmentIdArr[(itemFulfillmentIdArr.length)-1])){
             itemFulfillmentIdArr.pop();
        	}
        	itemFulfillmentIdArr = itemFulfillmentIdArr.filter(function(ifId,index) {
                                     return itemFulfillmentIdArr.indexOf(ifId) == index;
                                             });
		}else{
			itemFulfillmentIdArr.push();
		}

           function convertToInt(value) {
                 return parseInt(value);
            }
		impactedRecords.customrecord_wmsse_ship_manifest = shipManifestIdArr.map(convertToInt);
		impactedRecords.itemfulfillment = itemFulfillmentIdArr.map(convertToInt);	
		log.debug({title:'impactedRecords :', details: impactedRecords });

		return impactedRecords;
	}
	 
	 function updatePickTaskStatusSch(sublistPickTaskId,subListPickTaskLineNo,subListpickTaskLineOrderId,stageBinId){

			
			var vPicktaskStgRec = record.load({type:'picktask',
				id:sublistPickTaskId
			});
			var pickActionLinelength = vPicktaskStgRec.getLineCount({
				sublistId:'pickactions'
			});

			
			for (var pickActionItr = 0; pickActionItr < pickActionLinelength; pickActionItr++) {

				var pickTaskLine = vPicktaskStgRec.getSublistValue({
					sublistId: 'pickactions',
					fieldId: 'linenumber',
					line : pickActionItr
				});

				var pickTaskOrderId = vPicktaskStgRec.getSublistValue({
					sublistId: 'pickactions',
					fieldId: 'ordernumber',
					line : pickActionItr
				});
				
				
				if(parseFloat(pickTaskLine) == parseFloat(subListPickTaskLineNo) && parseFloat(pickTaskOrderId) == parseFloat(subListpickTaskLineOrderId))
				{
					if(utility.isValueValid(stageBinId)){
						vPicktaskStgRec.setSublistValue({
							sublistId: 'pickactions',
							fieldId: 'stagingbin',
							line : pickActionItr,
							value: stageBinId
						});

						vPicktaskStgRec.setSublistValue({
							sublistId: 'pickactions',
							fieldId: 'status',
							line : pickActionItr,
							value: 'DONE'
						});

					}else{

						vPicktaskStgRec.setSublistValue({
							sublistId: 'pickactions',
							fieldId: 'status',
							line : pickActionItr,
							value: 'DONE'
						});
					}
				}

			}
			vPicktaskStgRec.save();
			log.debug('process end :', runtime.getCurrentScript().getRemainingUsage());
		}

	 function updateItemFulfillmentDataObj(itemfulfilmentDataObj,cartonDataObj){
    	var shipManifestData = cartonDataObj.shipManifestData;
    	var nsConfirmationNumber = shipManifestData.custrecord_wmsse_ship_nsconf_no;
    	var itemfulfillmentIdArr = [];
    	if(utility.isValueValid(nsConfirmationNumber)){
    		itemfulfillmentIdArr = nsConfirmationNumber.split(',');
    	}
    	var objCarton ={};

		for(var intItr=0;intItr<itemfulfillmentIdArr.length;intItr++){
           objCarton ={};
    	if(utility.isValueValid(itemfulfilmentDataObj[itemfulfillmentIdArr[intItr]]))
		{	
			objCarton = itemfulfilmentDataObj[itemfulfillmentIdArr[intItr]];
			objCarton[cartonDataObj.contLpNo] = cartonDataObj;
		}
		else
		{	
			objCarton[cartonDataObj.contLpNo] = cartonDataObj;
		    itemfulfilmentDataObj[itemfulfillmentIdArr[intItr]] = objCarton;
		}
	}

    }

	function updateItemfulfillmentforquickship(itemfulfilmentDataObj){ 	
		var trackingNumberCount=0;
        var containerLpLineArr= [];
        var allCartonShippingCharges = 0;
		var _asnRuleValue = utility.getSystemRuleValue("Generate EDI 856 outbound ASNs?");	

      for(var itemFulfillmentId in itemfulfilmentDataObj){
      	log.audit('getRemainingUsage IFSTART --', runtime.getCurrentScript().getRemainingUsage());
        allCartonShippingCharges = 0;
		var frecord = record.load({
			type : 'itemfulfillment',
			id : itemFulfillmentId,
			isDynamic: false
		});

		var packageSublistIdObj =  getPackagestabInternalIds(frecord);

		var totalLine = frecord.getLineCount({
			sublistId: packageSublistIdObj.packageSublist
		});

		for(var containerLp in itemfulfilmentDataObj[itemFulfillmentId]){ 
        trackingNumberCount=0;
        containerLpLineArr= [];
		var shippingCharges ='';
        var containerLpObj = itemfulfilmentDataObj[itemFulfillmentId][containerLp];
		var trackingNumber = containerLpObj.trackingNo;
		var pakageWeight = containerLpObj.actualweight;
		var shipManifestData = containerLpObj.shipManifestData;
		var payMethodType = shipManifestData.custrecord_wmsse_ship_paymethod;
		var shipRef5 = shipManifestData.custrecord_wmsse_ship_ref5;

		if(payMethodType =='FREE_FRIEGHT')	{
			shippingCharges="0.00";
		}
		else if(payMethodType =="COLLECT")	{
			shippingCharges="0.00";
		}
		else if((shipRef5=='')||(shipRef5==null)){
			shippingCharges="";
		}
		else{
			shippingCharges =shipManifestData.custrecord_wmsse_ship_charges;
		}


		for(var intItr=0; intItr<totalLine; intItr++) {
			var packageContainerLp=frecord.getSublistValue({sublistId: packageSublistIdObj.packageSublist,
				                                            fieldId: packageSublistIdObj.packageDesc,
				                                            line: intItr
				                                           });
			var packageTrackingnumber=frecord.getSublistValue({sublistId: packageSublistIdObj.packageSublist,
				                                               fieldId: packageSublistIdObj.packageTrackingNumber,
				                                               line: intItr
				                                             });

            var packageWeightIF=frecord.getSublistValue({sublistId: packageSublistIdObj.packageSublist,
                fieldId: packageSublistIdObj.packageWeight,
                line: intItr
            });
			if(utility.isValueValid(packageTrackingnumber) || (!utility.isValueValid(packageContainerLp))){
				trackingNumberCount++;
			}

			if(packageContainerLp == containerLp){
				containerLpLineArr.push(intItr);
				trackingNumberCount++;
			}
		}

		if(utility.isValueValid(trackingNumber) && containerLpLineArr.length > 0)	{
			
			var trackingNumArr 	= [];
			var packageWeightArr = [];
			trackingNumArr 		= trackingNumber.split(',');

			if(utility.isValueValid(pakageWeight)){
				packageWeightArr = pakageWeight.split(',');
			}

			if(trackingNumArr.length > 0)	{
				//Updating the same container LP in the Item Fulfillment Packages sublist with tracking number and weight if only 1 tracking number provided in shipping Integrator for 1 container LP
				if(trackingNumArr.length==1 && containerLpLineArr.length==1){
					frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[0],fieldId: packageSublistIdObj.packageTrackingNumber,value: trackingNumber});

					if(utility.isValueValid(packageWeightIF) && packageWeightIF != 0 && !isNaN(packageWeightIF))	{
						frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[0],fieldId: packageSublistIdObj.packageWeight,value: packageWeightIF});
					}
				}
				else {
					//Splitting the Container LP in the packages sublist of Item Fulfillment to multiple lines if multiple tracking numbers provided in the Shipping Integrator for 1 container LP
					var updatedCount = 0;
					var lineNumStart = totalLine;

					if(containerLpLineArr.length > trackingNumArr.length){
						for(var trackNumItr=0; trackNumItr<trackingNumArr.length; trackNumItr++){
							var pkgWeight = packageWeightArr[trackNumItr];

							var packageWeightforPackage=frecord.getSublistValue({sublistId: packageSublistIdObj.packageSublist,
								fieldId: packageSublistIdObj.packageWeight,
								line: containerLpLineArr[trackNumItr]
							});

							frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[trackNumItr],fieldId: packageSublistIdObj.packageTrackingNumber,value: trackingNumArr[trackNumItr]});
							if(utility.isValueValid(packageWeightforPackage) && packageWeightforPackage != 0 && !isNaN(packageWeightforPackage)){
								frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[trackNumItr],fieldId: packageSublistIdObj.packageWeight,value: packageWeightforPackage});
							}
							updatedCount = updatedCount + 1;
						}

						var lineNumber = containerLpLineArr.length-1;
						for(var i = lineNumber; i>=updatedCount; i--){	
							frecord.removeLine({
								sublistId	: packageSublistIdObj.packageSublist,
								line		: containerLpLineArr[i],
								ignoreRecalc: true
							});
						}
					}
					else{

						for(var cntItr=0; cntItr < containerLpLineArr.length; cntItr++)	{
							
							var pkgWeight = packageWeightArr[cntItr];
							frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[cntItr],fieldId: packageSublistIdObj.packageTrackingNumber,value: trackingNumArr[cntItr]});
							if(utility.isValueValid(pkgWeight) && pkgWeight != 0 && !isNaN(pkgWeight))
							{
								frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[cntItr],fieldId: packageSublistIdObj.packageWeight,value: pkgWeight});
							}
							updatedCount = updatedCount + 1;
						}
						
						for(var trackNumIndex=updatedCount; trackNumIndex < trackingNumArr.length; trackNumIndex++)	{

							if(utility.isValueValid(trackingNumArr[trackNumIndex].trim()))
							{
								var pkgWeight = packageWeightArr[trackNumIndex];

								frecord.insertLine({
									sublistId : packageSublistIdObj.packageSublist,
									line	  : lineNumStart
								});

								frecord.setSublistValue({
									sublistId : packageSublistIdObj.packageSublist,
									fieldId   : packageSublistIdObj.packageDesc,
									line 	  : lineNumStart,
									value     : containerLp
								});							

								frecord.setSublistValue({
									sublistId : packageSublistIdObj.packageSublist,
									fieldId   : packageSublistIdObj.packageTrackingNumber,
									line 	  : lineNumStart,
									value     : trackingNumArr[trackNumIndex]
								});

								//Package weight is mandatory while adding a line to Packages sublist, so if package weight is not provided from Shipping Integrator, we are defaulting to 0.01
								if(!utility.isValueValid(pkgWeight) || isNaN(pkgWeight))
								{
									pkgWeight = '0.01';
								}

								frecord.setSublistValue({
									sublistId : packageSublistIdObj.packageSublist,
									fieldId   : packageSublistIdObj.packageWeight,
									line 	  : lineNumStart,
									value     : pkgWeight
								});

								lineNumStart++;
							}
						}

					}				
				}
			}
		}

		allCartonShippingCharges = Number(Big(allCartonShippingCharges).plus(utility.isValueValid(shippingCharges) ? shippingCharges :0 )); 

	  }

		var lastcharges =frecord.getValue('custbody_wmsse_fulfill_shipcost');
		var totalshipcharges;
		if(!utility.isValueValid(allCartonShippingCharges))
			allCartonShippingCharges=0;
		if(utility.isValueValid(lastcharges) && parseFloat(lastcharges)>0)
		{
			totalshipcharges = Number(Big(lastcharges).plus(allCartonShippingCharges));
		}

		else
		{
			totalshipcharges = allCartonShippingCharges;
		}

		if(!utility.isValueValid(totalshipcharges)){
			totalshipcharges =frecord.getValue('shippingcost');		
			if(totalshipcharges==null || totalshipcharges==''){
				totalshipcharges = 0;
			}
		}
		frecord.setValue('custbody_wmsse_fulfill_shipcost',totalshipcharges);
		if(trackingNumberCount==totalLine)
		{
			var customerId = frecord.getValue('entity');
			var _IsEligibleASN = getIsEligibleASN(customerId,_asnRuleValue);

			if(_IsEligibleASN == "Y"){
				frecord.setValue('custbody_wms_asngeneration',1); 
			}
			frecord.setValue('shipstatus','C'); 
		}
     
		var resultId = frecord.save();										
		log.debug({title:'resultId',details:resultId});	
		 
		}
	}

	function getIsEligibleASN(customerId,_asnRuleValue){

		var isEligibleASN = "N";

		if(_asnRuleValue == 'Y'){

			var isCustomerASNEnabled = getCustomerASNEnabled(customerId);

			if(isCustomerASNEnabled!=null && isCustomerASNEnabled!=''){
				if(isCustomerASNEnabled.length>0){
					isEligibleASN = "Y";
				}
			}
		}
		return isEligibleASN;
	}
	// setting async trigger flag based calculated performance metric of 40 to 50 sec for page submit
	function checkforQuickshipAsyncTrigger(cartonsCount,itemFulfillmentCount, itemFulfilmentLineCount){
		var asyncTriggerFlag = false;

        if(cartonsCount >= 50){
        	asyncTriggerFlag = true; 
        }else{
        	if(itemFulfillmentCount >= 5 || itemFulfilmentLineCount >= 50){
        		asyncTriggerFlag = true; 
        	}
        }

        return asyncTriggerFlag;
	}

	function fnGetShipManifestRecordData(inputParamObj){
		var vContLpNo = inputParamObj.contLpNo ;
		var vordNo = inputParamObj.ordNo ;
		var shipManifestId='';
		var itemFulfillmentId ='';
		var shipmanifestData = {};
		 
		var shipManifestSearch = search.load({
			id:'customsearch_wmsse_shipmanifest_details',
			type : 'customrecord_wmsse_ship_manifest'
		});

		shipManifestSearch.filters.push(search.createFilter({
			name:'custrecord_wmsse_ship_contlp',
			operator:search.Operator.IS,
			values:vContLpNo
		}));
		shipManifestSearch.filters.push(search.createFilter({
			name:'custrecord_wmsse_ship_order',
			operator:search.Operator.ANYOF,
			values:vordNo
		}));

		var	manifestList = utility.getSearchResultInJSON(shipManifestSearch);	       
         var shipManifestObjectArr =[];
		if(manifestList.length>0)
		{
			var shipManifestObject = {};
			for (var s=0;s<manifestList.length;s++) {
				shipManifestObject = {};
				itemFulfillmentId = manifestList[s].custrecord_wmsse_ship_nsconf_no;
				shipManifestId = manifestList[s].id;
				shipmanifestData = manifestList[s];
				shipManifestObject = {'shipManifestId' : shipManifestId ,
					                  'itemFulfillmentId' : itemFulfillmentId ,
					                   'shipmanifestData' : shipmanifestData  };
				shipManifestObjectArr.push(shipManifestObject);
			}
		}
		 
		return shipManifestObjectArr;
	}
   function getItemFulfilmentLineCountData(itemFulfilmentIdArr)
   {	
   	    var itemFulfilmentLineCount=0;
	    const myTransactionQuery = query.create({
			type:  query.Type.TRANSACTION

		});
		var myTransactionQueryline = myTransactionQuery.join({
			fieldId: 'transactionlines'
		});
		var myTransactionaccountingline = myTransactionQueryline.join({
			fieldId: 'accountingimpact'
		});
	   var condOrdId = myTransactionQuery.createCondition({
			fieldId: 'id',
			operator: query.Operator.ANY_OF,
			values: itemFulfilmentIdArr
		});
	   var condOrdAccount = myTransactionaccountingline.createCondition({
			fieldId: 'account',
			operator: query.Operator.EMPTY
		});
    
        myTransactionQuery.condition = myTransactionQuery.and(condOrdId,condOrdAccount);
    
		myTransactionQuery.columns = [
            myTransactionQuery.createColumn({
				fieldId: 'id' ,
				groupBy: true
			}),
			myTransactionQueryline.createColumn({
				fieldId: 'linesequencenumber' ,
				aggregate: query.Aggregate.COUNT
			})
			];

		var result= myTransactionQuery.run().asMappedResults();
		for(var cnt=0;cnt < result.length;cnt++){
			itemFulfilmentLineCount = Number(Big(result[cnt].linesequencenumber).plus(itemFulfilmentLineCount)); 
		}
		return itemFulfilmentLineCount;
}
	function getPackingConvertedWeight(weight, from, to) {
		try {
			const conversionObj = {
				kg: {
					kg: 1,
					kgs: 1,
					g: 1000,
					lbs: 2.204623,
					lb:2.204623,
					oz: 35.273962
				},
				kgs: {
					kg: 1,
					g: 1000,
					lbs: 2.204623,
					lb:2.204623,
					oz: 35.273962
				},
				g: {
					g: 1,
					kg: 0.001,
					kgs: 0.001,
					lbs: 0.00220462,
					lb:0.00220462,
					oz: 0.035274
				},
				lbs: {
					lbs: 1,
					kg: 0.453592,
					kgs: 0.453592,
					g: 453.592,
					lb:1,
					oz: 16
				},
				lb: {
					lbs: 1,
					kg: 0.453592,
					kgs: 0.453592,
					g: 453.592,
					lb:1,
					oz: 16
				},
				oz: {
					oz: 1,
					kg: 0.0283495,
					kgs: 0.0283495,
					g: 28.3495,
					lbs: 0.0625,
					lb:0.0625,
				}
			}
			return parseFloat((parseFloat(weight) * conversionObj[from][to]));
		} catch(ex) {
			log.debug('Error while converting weight', ex.message);
			return 0;
		}
	}

	return {
		getOrdersForQuickship:getOrdersForQuickship,
		getQuickShipFlagbyShipmethod:getQuickShipFlagbyShipmethod,
		getQSCartonList :  getQSCartonList,
		fnCreateShipManifestRecord : fnCreateShipManifestRecord,
		orderDetailsList:orderDetailsList,
		getSerViceLevel:getSerViceLevel,
		getShipmethods:getShipmethods,
		fnIsContainerLpExist:fnIsContainerLpExist,		
		bindPackingLinesSublist :bindPackingLinesSublist,
		updateItemfulfillmentPack:updateItemfulfillmentPack,
		createPacklistHtml:createPacklistHtml,
		getInvdtldataforPacking:getInvdtldataforPacking,		
		GenerateLabel:GenerateLabel,
		GenerateUCCLabel:GenerateUCCLabel,
		GenerateZebraUccLabel:GenerateZebraUccLabel,
		GenerateZebraLabel:GenerateZebraLabel,
		CreateLabelData:CreateLabelData,
		GenerateZebraAddressLabel:GenerateZebraAddressLabel,
		getCustomerASNEnabled:getCustomerASNEnabled,
		getOrderType:getOrderType,
		getItemfulfilmntLineNumber:getItemfulfilmntLineNumber,
		getKititemForComponents:getKititemForComponents,
		getNonInvItemPackingOrders:getNonInvItemPackingOrders,
		fnUpdateShipManifestRecord:fnUpdateShipManifestRecord,
		updateItemFulfillmentinUE:updateItemFulfillmentinUE,
		customRecordsCreationAfterPacking:customRecordsCreationAfterPacking,
		getPickTaskDtl:getPickTaskDtl,
		getPackagestabInternalIds:getPackagestabInternalIds,
		updatePackagesinIF : updatePackagesinIF,
		noCodeSolForQuickship:noCodeSolForQuickship,
		getpalletsForQuickship:getpalletsForQuickship,
		getQuickShipFlagbyPalletShipmethod:getQuickShipFlagbyPalletShipmethod,
		getCartonForQuickship:getCartonForQuickship,
		updatePickTaskStatusSch:updatePickTaskStatusSch,
		getOrdersCountForQuickship:_getOrdersCountForQuickship,
		updateItemfulfillmentforquickship : updateItemfulfillmentforquickship,
		updateItemFulfillmentDataObj:updateItemFulfillmentDataObj,
		checkforQuickshipAsyncTrigger:checkforQuickshipAsyncTrigger,
		fnGetShipManifestRecordData:fnGetShipManifestRecordData,
		getItemFulfilmentLineCountData:getItemFulfilmentLineCountData,
        getQSCartonpalletList:getQSCartonpalletList,
		scriptUsageRequired:scriptUsageRequired,
		fnGetandUpdatePickCartondetails:fnGetandUpdatePickCartondetails,
		PackinglabelCreation:PackinglabelCreation,
		getItemWeightforQuantity:getItemWeightforQuantity,
		getPackingConvertedWeight:getPackingConvertedWeight
	}
});
