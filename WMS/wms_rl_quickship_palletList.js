/**
 *     Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./big','./wms_packingUtility'],
		
		function(search,utility,translator,Big,packUtility) {


	function doPost(requestBody) {

		var palletListDetailsArr = {};
		var debugString = '';
		var requestParams='';
		try{

			if(utility.isValueValid(requestBody))
			{
				requestParams =requestBody.params;
				debugString = debugString + "requestParams :"+requestParams;

				var warehouseLocationId = requestParams.warehouseLocationId;
				var transactionType = requestParams.transactionType;
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionType))
				{

					var palletList=[];
					var shipMethodArray=[];
					var cartonCountArray= [];

						var palletListDetails=packUtility.getpalletsForQuickship(transactionType,warehouseLocationId,null,null,null,true)
						log.debug({title:'palletListDetails',details:palletListDetails});

					if(palletListDetails.length > 0)
					{							

						for(var intItr in palletListDetails)
						{
							var orderShipmethod = palletListDetails[intItr]['servicelevel'];
                            var quickShipFlag=false;
                            var quickShipFlagResults='';
							if(utility.isValueValid(orderShipmethod)) {

                                 quickShipFlagResults = packUtility.getQuickShipFlagbyPalletShipmethod(orderShipmethod);
                            }
							if(utility.isValueValid(quickShipFlagResults))
							{
								quickShipFlag=quickShipFlagResults[0]['quickshipflag']
							}
							if(quickShipFlag ==true || quickShipFlag =="true")
							{	var cartonObj = [];
								var pallet =palletListDetails[intItr]['pallet'];
								var cartonNumberCount =palletListDetails[intItr]['contentsdescription'];
									var cartonName = palletListDetails[intItr]['cartonName'];

								
									if (cartonCountArray.indexOf(pallet) == -1) {										
										var palletListDetailsLength = palletListDetails.length;
										for (var i = 0; i < palletListDetailsLength; i++) {
											if (pallet == palletListDetails[i]['pallet']) {										
												cartonObj.push(palletListDetails[intItr]['cartonName']);
											}
										}
										if(cartonObj.length>0) {
											palletListDetails[intItr].contentsdescription = cartonObj.length;
										}										
										palletList.push(palletListDetails[intItr]);										
									}
									shipMethodArray.push(orderShipmethod);
									cartonCountArray.push(pallet);
							}

						}	

						debugString = debugString + "palletList :"+palletList;
						if(palletList.length>0)
						{
							palletListDetailsArr.palletList = palletList;
							palletListDetailsArr.isValid=true;
						}
						else
						{
							palletListDetailsArr.errorMessage = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
							palletListDetailsArr.isValid=false;

						}
					}
					else
					{
						palletListDetailsArr.errorMessage = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
						palletListDetailsArr.isValid=false;
					}
				}
				else
				{
					palletListDetailsArr.errorMessage = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
					palletListDetailsArr.isValid=false;
				}
			}
			else
			{
				palletListDetailsArr.errorMessage = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
				palletListDetailsArr.isValid=false;
			}
			log.debug({title:'palletListDetailsArr',details:palletListDetailsArr});
		}
		catch(e)
		{
			palletListDetailsArr.isValid = false;
			palletListDetailsArr.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return palletListDetailsArr;
	}
	return {
		post: doPost
	};
});
