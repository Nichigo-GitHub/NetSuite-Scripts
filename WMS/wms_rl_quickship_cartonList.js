/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_translator','./wms_packingUtility'],
		
		function(search,utility,translator,packUtility) {

	
	function doPost(requestBody) {

		var cartonListDetails 	= {};
		var debugString 			= '';
		var shipMethodArray	= [];

		try{

			if(utility.isValueValid(requestBody)) 
			{			
				var requestParams		= requestBody.params;
				var transactionInternalId    = requestParams.transactionInternalId;
				shipMethodArray 			 = requestParams.shipMethod;
				var whLocation  			 = requestParams.warehouseLocationId;
                var palletName  			 = requestParams.palletName;
                var tranType  			 = '';
				var objpalletDetailsArray='';
                var isValidPallet=requestParams.isValidPallet;

                if(utility.isValueValid(transactionInternalId) && utility.isValueValid(shipMethodArray) && utility.isValueValid(whLocation))
				{	
					debugString = debugString + 'Order Id:'+transactionInternalId;
					// calling the Get Carton List method to get the cartons for a given combinations

					if(isValidPallet=='true') {

						if (utility.isValueValid(palletName)) {
							 objpalletDetailsArray = packUtility.getCartonForQuickship(tranType, whLocation, palletName)
						}
						var cartonObj = {};
						var objpalletDetailsArraylength=objpalletDetailsArray.length;
						for (var i = 0; i < objpalletDetailsArraylength; i++) {
							cartonObj[objpalletDetailsArray[i].cartons] = true;
						}

						log.debug({title: 'objpalletDetailsArray', details: objpalletDetailsArray});
						var cartonListObjArr = packUtility.getQSCartonpalletList(transactionInternalId, shipMethodArray, whLocation);
						var cartonListObjArrlength=cartonListObjArr.length;

						var cartonListObj = [];
						for (var j = 0; j < cartonListObjArrlength; j++) {
							if (cartonObj[cartonListObjArr[j]['contentsdescription']]) {
								cartonListObj.push(cartonListObjArr[j]);
							}
						}
					}
					else
					{
						var cartonListObj = packUtility.getQSCartonList(transactionInternalId,shipMethodArray,whLocation);
					}
                    log.debug({title:'cartonListObj',details:cartonListObj});
					if(!utility.isValueValid(cartonListObj) || cartonListObj.length==0)
					{
						log.debug({title:'No Cartons Found',details:'No Cartons Found'});
						cartonListDetails = {
								errorMessage : translator.getTranslationString('QUICKSHIP_CARTONLIST.NOMATCH'),
								isValid      : false
						};
					}
					else
					{
						cartonListDetails = {
								cartonList : cartonListObj,
								isValid      : true,
								palletName:	palletName,
								cartonCount : cartonListObj.length
						};
					}
				}
				else
				{
					cartonListDetails = {
							errorMessage : translator.getTranslationString('QUICKSHIP_CARTONLIST.NOMATCH'),
							isValid      : false
					};
				}
			}
			else
			{
				cartonListDetails = {
						errorMessage : translator.getTranslationString('QUICKSHIP_CARTONLIST.NOMATCH'),
						isValid      : false
				};
			}
		}
		catch(e)
		{
			cartonListDetails['isValid'] = false;
			cartonListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}

		return cartonListDetails;
	}

	return {
		post: doPost
	};

});
