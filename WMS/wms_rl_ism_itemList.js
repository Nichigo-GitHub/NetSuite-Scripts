/**
 * Copyright ï¿½ 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
 define(['N/search','./wms_utility','./big','./wms_translator','N/query','N/runtime','N/record'],
		/**
		 * @param {search} search
		 */
		 function(search,utility,Big,translator,query,runtime,record) {

	/**
	 * This function is to fetch the items of a purchase order
	 */
	 var openPutAwayDetails = {};
	 function doPost(requestBody) {
	 	var itemListDetails = {};
	 	var debugString = '';
	 	var isLotOrSerialItemExistsInISM = false;
	 	var completedItems = [];
	 	var pendingitemstoReceive = [];
	 	try{
	 		if(utility.isValueValid(requestBody))
	 		{
	 			var requestParams 			= requestBody.params;
	 			var whLocation 				= requestParams.warehouseLocationId;
	 			var shipmentNumber         	= requestParams.shipmentNumber;
	 			var shipmentId				=requestParams.shipmentId;
	 			var boolShowCompletedItems 	= requestParams.showCompletedItems;
	 			var transactionUOMConvRate  = requestParams.transactionUOMConvRate;
				var printEnabled = requestParams.printEnabled;
	 			var islotserialCount 		= 0;
	 			var itemListCount 			= 0;
	 			var itemOpentaskRcvQty =0;
	 			var lineReceivedQty = 0;
	 			var lineRemainingQty=0;
	 			var lineExpectedQty=0;
				var randomTallyScan = requestParams.randomTallyScan;
				var locUseBinsFlag = requestParams.locUseBinsFlag;

	 			log.debug({title:'Request Params:',details:requestParams});

	 			if(utility.isValueValid(whLocation) && utility.isValueValid(shipmentId))
	 			{
					itemListDetails.printEnabled =printEnabled;

	 				var itemListObj = getIsmItemDetails(shipmentId,whLocation);
	 				
	 				debugString = debugString + "itemListObj :"+itemListObj;

	 				if(!utility.isValueValid(itemListObj)|| itemListObj.length == 0)
	 				{
	 					itemListDetails.isValid = false;
	 				}
	 				else
	 				{
	 					var shipmentId = itemListObj[0].internalid;
					var locUseBinsFlag = this._getlocationUseBinsFlag(whLocation);
						if(locUseBinsFlag != false) {
						_deleteOpenTask(shipmentId,locUseBinsFlag);//to delete random itemscan opentask for backbutton
						}
	 					openPutAwayDetails = getOpentaskOpenPutwayDetails(shipmentId,shipmentNumber,whLocation);

	 					var uomConversionRateObj = getUOMConversionRate(itemListObj);

	 					for(var index in itemListObj)
	 					{
	 						if(utility.isValueValid(itemListObj[index].unitstype))
	 						{
	 							var convRate = uomConversionRateObj[(itemListObj[index].unitstype).toString()+ (itemListObj[index].unitText).toString()];

	 							if(utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index].quantityreceived))
	 							{
	 								itemListObj[index].quantityreceived = utility.uomConversions(parseFloat(itemListObj[index].quantityreceived),convRate,1);
	 							}

	 							if(utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index].quantityremaining))
	 							{
	 								itemListObj[index].quantityremaining = utility.uomConversions(parseFloat(itemListObj[index].quantityremaining),convRate,1);
	 							}

	 							if(utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index].quantityexpected))
	 							{
	 								itemListObj[index].quantityexpected = utility.uomConversions(parseFloat(itemListObj[index].quantityexpected),convRate,1);
	 							}

	 						}

	 						if(islotserialCount == 0 && (itemListObj[index].islotitem == true || itemListObj[index].isserialitem == true)){
	 							isLotOrSerialItemExistsInISM = true;
	 							islotserialCount = 1;
	 						}

	 						if(utility.isValueValid(openPutAwayDetails[itemListObj[index].inboundshipmentitemid]))
	 						{	
	 							itemOpentaskRcvQty = openPutAwayDetails[itemListObj[index].inboundshipmentitemid];

	 							if(utility.isValueValid(itemListObj[index].quantityexpected))
	 							{
	 								lineExpectedQty = parseFloat(itemListObj[index].quantityexpected);
	 							}

	 							itemListObj[index].quantityremaining = Number(Big(lineExpectedQty).minus(itemOpentaskRcvQty));
	 							itemListObj[index].quantityremaining = itemListObj[index].quantityremaining >= 0 ? itemListObj[index].quantityremaining : 0;
	 							itemListObj[index].quantityreceived = parseFloat(itemOpentaskRcvQty);
	 						}

	 						lineReceivedQty = itemListObj[index].quantityreceived >= 0 ? itemListObj[index].quantityreceived : 0;
	 						lineRemainingQty = itemListObj[index].quantityremaining >= 0 ? itemListObj[index].quantityremaining : 0;
	 						
	 						if(lineRemainingQty > 0 && utility.isValueValid(itemListObj[index].unitText)){
	 							itemListObj[index].quantityremainingWithUom = lineRemainingQty+" "+itemListObj[index].unitText;
	 						}
	 						else{
	 							itemListObj[index].quantityremainingWithUom = lineRemainingQty;	
	 						}

	 						if(lineReceivedQty > 0 && utility.isValueValid(itemListObj[index].unitText)){
	 							itemListObj[index].quantityreceivedWithUom = lineReceivedQty+" "+ itemListObj[index].unitText;
	 						}
	 						else{
	 							itemListObj[index].quantityreceivedWithUom = lineReceivedQty;	
	 						}

	 						if(lineRemainingQty <= 0)
	 						{
	 							completedItems.push(itemListObj[index]);	
	 						}
	 						else
	 						{
	 							pendingitemstoReceive.push(itemListObj[index]);
	 						}
	 					}
	 					
	 					
	 					if(boolShowCompletedItems == true || boolShowCompletedItems == 'true'){
	 						itemListDetails.itemList = completedItems;
	 					}else{
	 						itemListDetails.itemList = pendingitemstoReceive;
	 					}

	 					itemListCount = itemListObj.length;
	 					itemListDetails.itemListCount = itemListCount;
	 					itemListDetails.isValid	 = true;
	 					itemListDetails.isLotOrSerialItemExistsInISM = isLotOrSerialItemExistsInISM;
	 					
	 				}
	 			}
	 			else{
	 				itemListDetails ={
	 					errorMessage:translator.getTranslationString('ISM_ITEMLIST.NOMATCH'),
	 					isValid: false
	 				};
	 			}
	 		}
	 		else{
	 			itemListDetails ={
	 				errorMessage:translator.getTranslationString('ISM_ITEMLIST.EMPTYPARAM'),
	 				isValid: false
	 			};
	 		}
	 		debugString = debugString + "itemListDetails :"+itemListDetails;
	 	}
	 	catch(e)
	 	{
	 		itemListDetails.isValid = false;
	 		itemListDetails.errorMessage = e.message;
	 		log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
	 		log.error({title:'debugMessage',details:debugString});
	 	}
	 	return itemListDetails;
	 }

	function getIsmItemDetails(shipmentNumber,warehouseLocationId)
	{

		var itemListSrch = search.load({
			id : 'customsearch_wms_ism_item_list'
		});

		var itemListSrchArr = itemListSrch.filters;

		if(utility.isValueValid(warehouseLocationId)){
			itemListSrchArr.push(search.createFilter({
				name: 'receivinglocation',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));	
		}

		if(utility.isValueValid(shipmentNumber)){
			itemListSrchArr.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: shipmentNumber
			}));	
		}


		itemListSrchArr.filters = itemListSrchArr;
		var itemListResult = utility.getSearchResultInJSON(itemListSrch);

		return itemListResult;		
	}

	function getOpentaskOpenPutwayDetails(shipmentId,shipmentNum,whLocation){
		var opentaskArr = {};
		var filterStrat = [];
		if (utility.isValueValid(shipmentId))
		{
			if (utility.isValueValid(whLocation))
			{
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			filterStrat.push(search.createFilter({
				name: 'custrecord_wmsse_inbshipment',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));

			var objOpentaskDetailsSearch = search.load({id: 'customsearch_wms_inbshp_opentask_qty_dtl'});
			var savedFilter = objOpentaskDetailsSearch.filters ;
			objOpentaskDetailsSearch.filters = savedFilter.concat(filterStrat);
			var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);

	 		if (objOPentaskDetails != null &&  objOPentaskDetails.length > 0) {
	 			for (var objOPentask in objOPentaskDetails) {
	 				var objOPentaskRec = objOPentaskDetails[objOPentask];
	 				opentaskArr[objOPentaskRec.custrecord_wmsse_line_no] = objOPentaskRec.custrecord_wmsse_act_qty;
	 			}
	 		}
	 	}
		//log.debug({title:'opentaskArr',details:opentaskArr});
		return opentaskArr;
	}

	function getUOMConversionRate(itemresults)
	{
		var uomfilters=[];
		var totalUOMObj = {};
		var unitsTypeArray=[];
		var vUnitType ='';
		for(var itr = 0; itr < itemresults.length; itr++)
		{
			vUnitType = itemresults[itr].unitstype;
			if(utility.isValueValid(vUnitType)){
				unitsTypeArray.push(vUnitType);
			}
		}
		var searchRec = search.load({
			id: 'customsearch_wmsse_unitstype'
		});
		uomfilters = searchRec.filters;
		if(unitsTypeArray.length > 0)
		{
			uomfilters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: unitsTypeArray
			}));
		}
		searchRec.filters = uomfilters;
		var uomResults = utility.getSearchResultInJSON(searchRec);
		
		for (var recIdItr = 0; recIdItr < uomResults.length; recIdItr++) {
			var objUnitRec = uomResults[recIdItr];
			totalUOMObj[(objUnitRec.id).toString()+(objUnitRec.unitname).toString()] =objUnitRec.conversionrate;
		}
		
		return totalUOMObj;
	}
			function _deleteOpenTask(shipmentId,locuseBinsFlag){//to delete opentasks if navigate back from quantity screen
				var wmsFilters = [];
				wmsFilters.push(
					search.createFilter({
						name:'name',
						operator:search.Operator.IS,
						values:'ISMrandomTallyscanBinUpdate'
					})
				);
				wmsFilters.push(
					search.createFilter({
						name:'custrecord_wmsse_schprstranrefno',
						operator:search.Operator.IS,
						values:shipmentId
					})
				);
				wmsFilters.push(
					search.createFilter({
						name:'custrecord_wmsse_schprsstatus',
						operator:search.Operator.ISNOT,
						values:'Completed'
					})
				);
				var searchObj = search.create({type:'customrecord_wmsse_schscripts_status',
					filters:wmsFilters,columns:['custrecord_wmsse_schprsstatus']
				});
				var searchResult = [];
				var search_page_count = 1;

				var myPagedData = searchObj.runPaged({
					pageSize: search_page_count
				});
				myPagedData.pageRanges.forEach(function (pageRange) {
					var myPage = myPagedData.fetch({
						index: pageRange.index
					});
					myPage.data.forEach(function (result) {
						searchResult.push(result);
					});
				});
				if(searchResult.length == 0) {
					var myOpentaskQuery = query.create({
						type: 'customrecord_wmsse_trn_opentask'
					});
					var tranCond = myOpentaskQuery.createCondition({
						fieldId: 'custrecord_wmsse_inbshipment',
						operator: query.Operator.ANY_OF,
						values: shipmentId
					});
					var confirmationRefCondition = myOpentaskQuery.createCondition({
						fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
						operator: query.Operator.EMPTY
					});
					var inbShipRefCondition = myOpentaskQuery.createCondition({
						fieldId: 'custrecord_wmsse_rec_inb_shipment',
						operator: query.Operator.EMPTY
					});
					var notesCondition = myOpentaskQuery.createCondition({
						fieldId: 'custrecord_wmsse_notes',
						operator: query.Operator.IS,
						values:'randomTallyscan'
					});
					var currentUserID = runtime.getCurrentUser();
					var userIdCondition = myOpentaskQuery.createCondition({
						fieldId: 'custrecord_wmsse_upd_user_no',
						operator: query.Operator.ANY_OF,
						values: currentUserID.id
					});
					myOpentaskQuery.createCondition({fieldId:'custrecord_wmsse_inbshipment',
					operator:query.Operator.EMPTY_NOT
					});
					myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition,
						userIdCondition,inbShipRefCondition,notesCondition);

					if (utility.isValueValid(locuseBinsFlag) && locuseBinsFlag == true) {
						var actBeginLocCondition = myOpentaskQuery.createCondition({
							fieldId: 'custrecord_wmsse_actbeginloc',
							operator: query.Operator.EMPTY
						});
						var itemtypeCondition = myOpentaskQuery.createCondition({
							fieldId: 'custrecord_wmsse_sku^item.itemtype',
							operator: query.Operator.ANY_OF,
							values:['InvtPart','Assembly']
						});
						myOpentaskQuery.condition = myOpentaskQuery.and(tranCond, confirmationRefCondition, userIdCondition,
							actBeginLocCondition,inbShipRefCondition,notesCondition,itemtypeCondition);
					}


					myOpentaskQuery.columns = [
						myOpentaskQuery.createColumn({
							fieldId: 'id'
						})]
					var results = myOpentaskQuery.runPaged({
						pageSize: 1000
					});
					var iterator = results.iterator();
					iterator.each(function (result) {
						page = result.value;
						pageResults = page.data.results;
						deleterecord(pageResults);

						return true;
					});
				}
			}
			function deleterecord(pageResults){
				for(var rec in pageResults) {
					record.delete({
						type: 'customrecord_wmsse_trn_opentask',
						id: parseInt(pageResults[rec].values[0])
					});
				}
			}

			function _getlocationUseBinsFlag(warehouseLocationId)
			{
				var locationUseBinlFlag ='';

				var columnlocationlookupArray =[];
				columnlocationlookupArray.push('usesbins');

				var locationLookUp = utility.getLocationFieldsByLookup(warehouseLocationId,columnlocationlookupArray);

				if (locationLookUp.usesbins != undefined)
				{
					locationUseBinlFlag = locationLookUp.usesbins;
				}
				return locationUseBinlFlag;
			}
	return {
		'post': doPost,
		'_getlocationUseBinsFlag':_getlocationUseBinsFlag
	};

});
