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

		var orderListDetailsArr = {};
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

					var orderList=[];
					var shipMethodArray=[];
					var cartonCountArray= [];

					var orderListDetails=packUtility.getOrdersForQuickship(transactionType,warehouseLocationId)
					log.debug({title:'orderListDetails',details:orderListDetails});				

					if(orderListDetails.length > 0)
					{							

						for(var intItr in orderListDetails)
						{
							var orderShipmethod = orderListDetails[intItr]['shipmethod'];
							var quickShipFlag = packUtility.getQuickShipFlagbyShipmethod(orderShipmethod);

							if(quickShipFlag ==true || quickShipFlag =="true")
							{
								var orderNumber =orderListDetails[intItr]['tranid'];
								var cartonNumberCount =orderListDetails[intItr]['contentsdescription'];		

								if((shipMethodArray.indexOf(orderNumber)!= -1) && shipMethodArray !=null && cartonCountArray!='')
								{
									var index =shipMethodArray.indexOf(orderNumber);								
									var orderCartonCount =cartonCountArray[index];									
									var totalCartonCount= Number(Big(orderCartonCount).plus(cartonNumberCount));

									for(var count in orderList)
									{
										var orderDocNumber =orderList[count]['tranid'];
										if(orderDocNumber ==orderNumber)
										{
											orderList[count]['contentsdescription']=totalCartonCount;
											break;
										}

									}
								}
								else
								{
									orderList.push(orderListDetails[intItr]);
								}
								shipMethodArray.push(orderNumber);
								cartonCountArray.push(cartonNumberCount);
							}

						}	

						debugString = debugString + "orderList :"+orderList;
						if(orderList.length>0)
						{
							orderListDetailsArr['orderList'] = orderList;
							orderListDetailsArr["isValid"]=true;
						}
						else
						{
							orderListDetailsArr["errorMessage"] = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
							orderListDetailsArr["isValid"]=false;

						}
					}
					else
					{
						orderListDetailsArr["errorMessage"] = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
						orderListDetailsArr["isValid"]=false;
					}
				}
				else
				{
					orderListDetailsArr["errorMessage"] = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
					orderListDetailsArr["isValid"]=false;	
				}
			}
			else
			{
				orderListDetailsArr["errorMessage"] = translator.getTranslationString("QUICKSHIP_ORDERLIST.NOORDERS");
				orderListDetailsArr["isValid"]=false;	
			}
			log.debug({title:'orderListDetailsArr',details:orderListDetailsArr});
		}
		catch(e)
		{
			orderListDetailsArr['isValid'] = false;
			orderListDetailsArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return orderListDetailsArr;
	}
	return {
		post: doPost
	};
});
