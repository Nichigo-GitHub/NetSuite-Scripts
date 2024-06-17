/**
 * Copyright © 2020, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator', './wms_inboundUtility','N/record','./wms_inbound_utility'],
		/**
		 * @param {search} search
		 */
		function ( utility,translator, inboundUtility,record,inboundLib) {

	function doPost(requestBody) {

		var whLocationId = '';
		var cartBinId = '';
		var binTrasnferId = '';
		var cartDetails = {};
		var requestParams = '';
		var scannedBinName = '';
		try{
			log.debug({title:'requestBody',details:requestBody});	
			if (utility.isValueValid(requestBody)) {	
				requestParams = requestBody.params;
				whLocationId  = requestParams.warehouseLocationId;
				cartBinId     = requestParams.cartBinId;
				binTrasnferId = requestParams.binTrasnferId;
				scannedBinName = requestParams.recomendedBinName;

				if (utility.isValueValid(whLocationId) && (utility.isValueValid(cartBinId) || utility.isValueValid(binTrasnferId))) {

					var getCartItemListResults = [];
					if(utility.isValueValid(binTrasnferId)){

						var binTransferArr = [];
						if(binTrasnferId.toString().indexOf(',') != -1){
							binTransferArr = binTrasnferId.split(',');
						}
						else{
							binTransferArr.push(binTrasnferId);
						}
						var binTransferLength = binTransferArr.length;
						for(var binTransferCount = 0; binTransferCount< binTransferLength;binTransferCount++){

							var binTransferRec = record.load({type: record.Type.BIN_TRANSFER,
								id:binTransferArr[binTransferCount]
							});
							var	binTransferItemsCount = binTransferRec.getLineCount({sublistId: 'inventory'});
							var count = 0;
							var status = "";
							var objSubRecord = null;
							var qty = 0;
							var row = {};
							var invStatusFeature = utility.isInvStatusFeatureEnabled();
							for(count = 0; count < binTransferItemsCount;count++){
								if(invStatusFeature){
									objSubRecord = binTransferRec.getSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail',line: count});
									var statusQtyObj = {};
									if(objSubRecord != null && objSubRecord != undefined ){
										var compinvlinelength =objSubRecord.getLineCount({
											sublistId:'inventoryassignment'
										});
										var inventoryAssigmentCount = 0;
										for(inventoryAssigmentCount = 0 ;inventoryAssigmentCount < compinvlinelength;inventoryAssigmentCount++){
											if(statusQtyObj[objSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'toinventorystatus',line:inventoryAssigmentCount})] != undefined){
												statusQtyObj[objSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'toinventorystatus',line:inventoryAssigmentCount})] = parseFloat(objSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'quantity',line:inventoryAssigmentCount}))+parseFloat(statusQtyObj[objSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'toinventorystatus',line:inventoryAssigmentCount})]);	
											}
											else{
												statusQtyObj[objSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'toinventorystatus',line:inventoryAssigmentCount})] = objSubRecord.getSublistText({sublistId: 'inventoryassignment',fieldId: 'quantity',line:inventoryAssigmentCount});
											}
										}
									}
									log.debug({title:'statusQtyObj',details:statusQtyObj});
									for(var statusQtyRow in statusQtyObj){
										qty = statusQtyObj[statusQtyRow];
										if(binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'itemunits_display',line: count})){
											qty = qty + " "+binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'itemunits_display',line: count});
										}
                                        var itemDescription = binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'description',line: count});
                                        if(itemDescription == '- None -'){
                                            itemDescription = "";
                                        }

										row = {'custrecord_wmsse_skuText':binTransferRec.getSublistText({sublistId: 'inventory',fieldId: 'item',line: count}),
												'custrecord_wmsse_sku':binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'item',line: count}),
												'custrecord_wmsse_act_qty':qty,
												'custrecord_wmsse_inventorystatustoText':statusQtyRow,
											'itemDescription':itemDescription,
										};
										getCartItemListResults.push(row);

									}

								}
								else{
									qty = binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'quantity',line: count});
									if(binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'itemunits_display',line: count})){
										qty = qty +" "+binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'itemunits_display',line: count});
									}
									row = {'custrecord_wmsse_skuText':binTransferRec.getSublistText({sublistId: 'inventory',fieldId: 'item',line: count}),
											'custrecord_wmsse_sku':binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'item',line: count}),
											'custrecord_wmsse_act_qty':qty,
											'custrecord_wmsse_inventorystatustoText':status,
										'itemDescription':binTransferRec.getSublistValue({sublistId: 'inventory',fieldId: 'description',line: count}),
									};
									getCartItemListResults.push(row);
								}

							}
						}
					}
					else{
						var inventoryBalanceArr = inboundLib.getCartItemsResultsFromInevntoryBalance(whLocationId,cartBinId);
						log.debug({title:'inventoryBalanceArr',details:inventoryBalanceArr});
						var InvBalanceArrLength = inventoryBalanceArr.length;
						if(InvBalanceArrLength > 0){

							var openTaskCartItemsResults = inboundLib.getCartBinDetailsFromOpenTask(whLocationId,cartBinId);
							var openTaskCartItemsResultsLength = openTaskCartItemsResults.length;
							var invBalanceResultIndx = 0;
							var invBalanceRow = [];
							var stockUnitText = '';
							var onHandQty = 0;
							var binItemObject = {};
							var openTaskRow = [];
							var openTaskResultIndx = 0;
							var recomendedBinName = '';
							var recomendedBinId = '';
							var recomendedBinSequence = '';
							var obj ={};
							var opentaskObject = {};
							var currentRow = {};
							var itemIdArr = [];
							var scannedBinResults = [];
							var itemsObj = {};

							for(invBalanceResultIndx = 0; invBalanceResultIndx < InvBalanceArrLength;invBalanceResultIndx++){
								invBalanceRow = inventoryBalanceArr[invBalanceResultIndx];
								if(!itemsObj[inventoryBalanceArr[invBalanceResultIndx].item]){
									itemIdArr.push(inventoryBalanceArr[invBalanceResultIndx].item);
									itemsObj[inventoryBalanceArr[invBalanceResultIndx].item] = inventoryBalanceArr[invBalanceResultIndx].item;
								}

							}
							log.debug({title:'itemIdArr',details:itemIdArr});
							var	itemResults = inboundLib.getCartItemsPreferdBinDetails(whLocationId,itemIdArr);
							log.debug({title:'itemResults',details:itemResults});
							var itemResultsLength = itemResults.length;
							var itemResultIndx = 0;
							var itemPreferdBinObj = {};
							var itemResultRow = [];
							for(itemResultIndx = 0;itemResultIndx<itemResultsLength ; itemResultIndx++){
								itemResultRow = itemResults[itemResultIndx];
								obj ={};
								obj.preferedBinName = itemResultRow.binnumber;
								obj.preferedBinSequence = itemResultRow.custrecord_wmsse_putseq_no;
								itemPreferdBinObj[itemResultRow.id] = obj;
							}
							obj = {};
							for(openTaskResultIndx = 0;openTaskResultIndx<openTaskCartItemsResultsLength ; openTaskResultIndx++){
								openTaskRow = openTaskCartItemsResults[openTaskResultIndx];
								obj ={};
								obj.custrecord_wmsse_reccommendedbinText = openTaskRow.custrecord_wmsse_reccommendedbinText;
								obj.custrecord_wmsse_reccommendedbin = openTaskRow.custrecord_wmsse_reccommendedbin;
								obj.custrecord_wmsse_recomendedbinsequenceText = openTaskRow.custrecord_wmsse_recomendedbinsequence; 
								binItemObject[openTaskRow.custrecord_wmsse_sku] = obj;
							}
							var itemPreferedBinObject = {};
							var isNewBinScanned = true;
							for(invBalanceResultIndx = 0; invBalanceResultIndx < InvBalanceArrLength;invBalanceResultIndx++){
								invBalanceRow = inventoryBalanceArr[invBalanceResultIndx];
								stockUnitText = '';
								recomendedBinName = '';
								recomendedBinSequence = '';
								recomendedBinId ='';
								itemPreferedBinObject = itemPreferdBinObj[invBalanceRow.item];
								if(itemPreferedBinObject != undefined && itemPreferedBinObject != {}){
									recomendedBinName = itemPreferedBinObject.preferedBinName;
									recomendedBinSequence = itemPreferedBinObject.preferedBinSequence;
								}

								onHandQty = invBalanceRow.onhand;
								if(invBalanceRow.stockunit){
									stockUnitText = invBalanceRow.stockunitText;
									onHandQty = onHandQty + " "+stockUnitText;
								}

								if(!utility.isValueValid(recomendedBinName)){
									opentaskObject = binItemObject[invBalanceRow.item];
									if(opentaskObject != undefined && opentaskObject !={}){

										recomendedBinName = opentaskObject.custrecord_wmsse_reccommendedbinText;
										recomendedBinSequence = opentaskObject.custrecord_wmsse_recomendedbinsequenceText;
										recomendedBinId = opentaskObject.custrecord_wmsse_reccommendedbin;

									}
									else{
										recomendedBinName = '';
									}
								}

                                var itemDescription = invBalanceRow.salesdescription;
                                if(itemDescription == '- None -'){
                                    itemDescription = "";
                                }
								currentRow = {'custrecord_wmsse_skuText':invBalanceRow.itemText,
										'custrecord_wmsse_sku':invBalanceRow.item,
										'custrecord_wmsse_act_qty':onHandQty,
										'custrecord_wmsse_actendlocText':invBalanceRow.binnumberText,
										'custrecord_wmsse_inventorystatusText':invBalanceRow.statusText,
										'custrecord_wmsse_reccommendedbinText':recomendedBinName,
										'custrecord_wmsse_reccommendedbin':recomendedBinId,
										'custrecord_wmsse_recomendedbinsequence':recomendedBinSequence,
										'itemDescription':itemDescription

								};
								if(utility.isValueValid(scannedBinName) &&
										((scannedBinName == recomendedBinName)||(recomendedBinName ==''))){
									if(scannedBinName == recomendedBinName && isNewBinScanned){
										isNewBinScanned = false;
									}
									scannedBinResults.push(currentRow);
								}
								getCartItemListResults.push(currentRow);

							}
							if(scannedBinResults.length > 0 && !isNewBinScanned){
								getCartItemListResults = scannedBinResults;
							}
							getCartItemListResults = getCartItemListResults.sort(SortByBinSequence);
						}
					}
					log.debug({title:'getCartItemListResults',details:getCartItemListResults});	
					if(getCartItemListResults.length > 0){
						cartDetails.cartItemList = getCartItemListResults;
						cartDetails.isValid = true;
					}
					
				}
				else {
					cartDetails.errorMessage = translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
					cartDetails.isValid = false;
				}
			}
			else {
				cartDetails.errorMessage = translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
				cartDetails.isValid = false;
			}
			log.debug({title:'cartDetails',details:cartDetails});

		}
		catch(e)
		{
			cartDetails.isValid = false;
			cartDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return cartDetails;
	}

	function SortByBinSequence(x,y) {
		return (y.custrecord_wmsse_recomendedbinsequence != "") - (x.custrecord_wmsse_recomendedbinsequence != "") || x.custrecord_wmsse_recomendedbinsequence - y.custrecord_wmsse_recomendedbinsequence;
	}



	return {
		'post': doPost

	};
});