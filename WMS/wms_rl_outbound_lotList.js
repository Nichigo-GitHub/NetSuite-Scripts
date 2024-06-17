/**

 *    Copyright © 2015,2018, Oracle and/or its affiliates. All rights reserved.

 */


/**

 * @NApiVersion 2.x

 * @NScriptType Restlet

 * @NModuleScope Public

 */

define(['./wms_utility','./wms_translator','./wms_outBoundUtility'],

		/**

		 * @param {search} search

		 */

		function(utility,translator,obUtility) {



	/**

	 * Function to fetch  bin locations based on pickstratagies

	 */

	function doPost(requestBody) {



		var lotListDetailsArr = {};

		var debugString = '';

		try{



			var requestParams = requestBody.params;

			if(utility.isValueValid(requestParams))

			{

				var warehouseLocationId = requestParams.warehouseLocationId;

				var itemInternalId = requestParams.itemInternalId;

				var fromBinInternalId = requestParams.fromBinInternalId;

				var inventoryDetailLotOrSerial = requestParams.inventoryDetailLotOrSerial;

				var uomListObj = requestParams.uomListObj;

				var transactionUomConversionRate = requestParams.transactionUomConversionRate;

				var transactionUomName = requestParams.transactionUomName;

				var selectedConversionRate = '';

				var selectedUOMText = '';

				var isUomEnabled = false;

				var orderType = requestParams.orderType;

				var stockUomConversionRate = requestParams.stockUomConversionRate;

				var locUseBinsFlag = requestParams.locUseBinsFlag;

				var pickStatusInternalId = requestParams.pickStatusInternalId;
        var binName =  requestParams.binName;
                var tallyLoopObject = requestParams.tallyLoopObj;

				log.debug({title:'requestParams',details:requestParams});

				if(utility.isValueValid(requestParams.uomListObj))

				{

					isUomEnabled = true;

				}

				if(utility.isValueValid(requestParams.uomList))

				{

					var selectedUomList = requestParams.uomList;

					log.debug({title:'selectedUomList',details:selectedUomList});

					selectedConversionRate = selectedUomList.id;

					selectedUOMText = selectedUomList.value;

				}



				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) && (utility.isValueValid(fromBinInternalId) || locUseBinsFlag == false))

				{

					var lotListDetails=[];

					var lotDetails = {}; 
            if(utility.isValueValid(binName))
						{
							lotListDetailsArr['binName'] = binName;
						}

					lotDetails['warehouseLocationId']=warehouseLocationId;

					lotDetails['itemInternalId']=itemInternalId;

					lotDetails['fromBinInternalId']=fromBinInternalId;

					lotDetails['orderType']=orderType;

					lotDetails.fromInventorystatus = pickStatusInternalId;



					if(utility.isValueValid(inventoryDetailLotOrSerial))

					{

						lotInternalId = utility.inventoryNumberInternalId(inventoryDetailLotOrSerial, warehouseLocationId, itemInternalId);

						lotDetails['lotInternalId'] = lotInternalId;

						lotDetails['lotName'] = inventoryDetailLotOrSerial;



					}				



					lotListDetails=obUtility.getPickingLotDetails(lotDetails);



					if(lotListDetails.length > 0)

					{

						log.debug({title:'isUomEnabled',details:isUomEnabled});

						if(isUomEnabled)

						{

							lotListDetailsArr['uomList'] = uomListObj;
							lotListDetailsArr['uomDefaultStatus'] = transactionUomName;

							if(!utility.isValueValid(transactionUomConversionRate))
							{
								transactionUomConversionRate = '';
							}

							if(!utility.isValueValid(selectedConversionRate))
							{
								selectedConversionRate = '';
							}

							log.debug({title:'transactionUomConversionRate',details:transactionUomConversionRate});
							log.debug({title:'selectedConversionRate',details:selectedConversionRate});

							var is_InvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
							for(var lotRec in lotListDetails)
							{
                                if(utility.isValueValid(lotListDetails[lotRec]['datecreated']))
                                {
                                    lotListDetails[lotRec]['datecreated'] = lotListDetails[lotRec]['datecreated'].split(' ')[0];
                                }

								var qty = lotListDetails[lotRec]['available'];
								var totalQty = 0;
								if(tallyLoopObject != undefined){
									for(var obj in tallyLoopObject){
										var tqty = tallyLoopObject[obj].quantity;
										if(utility.isValueValid(transactionUomConversionRate) &&
											utility.isValueValid(stockUomConversionRate) &&
											(stockUomConversionRate != transactionUomConversionRate)){
											tqty = parseFloat(tqty) * transactionUomConversionRate;
										}
										var lotName = tallyLoopObject[obj].lotName;
                                        var statusId = tallyLoopObject[obj].statusName;
										if(is_InvStatusFeatureEnabled) {
											if (lotName == lotListDetails[lotRec]['inventorynumberText'] &&
												statusId == lotListDetails[lotRec]['status']) {
													totalQty = totalQty + tqty;
											}
										}
										else{
											if (lotName == lotListDetails[lotRec]['inventorynumberText']) {
													totalQty = totalQty + tqty;
											}
										}
									}

									if(totalQty > 0){
										qty = qty - totalQty;
										lotListDetails[lotRec]['available'] = qty;
										if(parseFloat(qty) > 0 &&
											utility.isValueValid(transactionUomConversionRate)){
											lotListDetails[lotRec]['quantityavailableWithUOM'] = qty + " " + transactionUomConversionRate;
										}
									}
								}

								if(qty > 0)
								{
									if(selectedConversionRate != ''  && selectedConversionRate != stockUomConversionRate)
									{
										qty = utility.uomConversions(qty,selectedConversionRate,stockUomConversionRate);
										lotListDetails[lotRec]['available'] = qty;
										lotListDetails[lotRec]['quantityavailableWithUOM'] = qty + " "+selectedUOMText;
									}
									else
									{
										if(transactionUomConversionRate != '' && stockUomConversionRate!='' &&  (stockUomConversionRate != transactionUomConversionRate)
												&& !utility.isValueValid(selectedConversionRate))
										{
											qty = utility.uomConversions(qty,transactionUomConversionRate,stockUomConversionRate);
											lotListDetails[lotRec]['available'] = qty;
											lotListDetails[lotRec]['quantityavailableWithUOM'] = qty + " "+transactionUomName;
										}
									}
								}
							}
						}
						else{
							for(var lotRec in lotListDetails) {
                                if(utility.isValueValid(lotListDetails[lotRec]['datecreated']))
                                {
                                    lotListDetails[lotRec]['datecreated'] = lotListDetails[lotRec]['datecreated'].split(' ')[0];
                                }
								var qty = lotListDetails[lotRec]['available'];
								var totalQty = 0;
								if (tallyLoopObject != undefined) {
									for (var obj in tallyLoopObject) {
										var tqty = tallyLoopObject[obj].quantity;
										var lotName = tallyLoopObject[obj].lotName;
										var statusId = tallyLoopObject[obj].statusName;
										if (is_InvStatusFeatureEnabled) {
											if (lotName == lotListDetails[lotRec]['inventorynumberText'] &&
												statusId == lotListDetails[lotRec]['status']) {
												totalQty = totalQty + tqty;
											}
										} else {
											if (lotName == lotListDetails[lotRec]['inventorynumberText']) {
												totalQty = totalQty + tqty;
											}
										}
									}

									if (totalQty > 0) {
										qty = qty - totalQty;
										lotListDetails[lotRec]['available'] = qty;
									}
								}
							}
						}
						if(tallyLoopObject != undefined) {
							var lotDetails = [];
							for (var lot in lotListDetails) {

								if(utility.isValueValid(lotListDetails[lot]['available']) &&
									parseFloat(lotListDetails[lot]['available']) > 0 ){
									lotDetails.push(lotListDetails[lot]);
								}
							}
							lotListDetailsArr['lotList'] = lotDetails;
						}
						else {
							lotListDetailsArr['lotList'] = lotListDetails;
						}

						lotListDetailsArr["isValid"]=true;

					}

					else

					{

						lotListDetailsArr["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOLOTLISTTOSHOW");

						lotListDetailsArr["isValid"]=false;

					}

				}

				else

				{

					lotListDetailsArr["errorMessage"] = translator.getTranslationString("SINGLEORDERPICKING.NOLOTLISTTOSHOW");

					lotListDetailsArr["isValid"]=false;	

				}

			}

			else

			{

				lotListDetailsArr["isValid"]=false;	

			}

		}

		catch(e)

		{

			lotListDetailsArr['isValid'] = false;

			lotListDetailsArr['errorMessage'] = e.message;

			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

			log.error({title:'debugString',details:debugString});

		}



		return lotListDetailsArr;

	}

	return {

		'post': doPost

	};

});

