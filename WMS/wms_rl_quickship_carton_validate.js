/**
 * Copyright © 2018, Oracle and/or its affiliates. All rights reserved. 
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

		var cartonDtl 			= {};
		var shipMethodArray	    = [];
		var debugString			= '';
		try{

			if(utility.isValueValid(requestBody)) 
			{
				var requestParams		= requestBody.params;
				var transactionInternalId = requestParams.transactionInternalId;
				shipMethodArray 		  = requestParams.shipMethod;
				var whLocation  		  = requestParams.warehouseLocationId;
				var cartonId 		      = requestParams.cartonId;
                var palletName 		      = requestParams.palletName;
				debugString = debugString + 'requestParams :'+requestParams;
				if( utility.isValueValid(transactionInternalId) && utility.isValueValid(shipMethodArray) && utility.isValueValid(whLocation) && utility.isValueValid(cartonId))
				{
					debugString = debugString + 'Order Id:'+transactionInternalId;
					// calling the Get Carton List method to get the cartons for a given combinations
					var cartonDtlObj = packUtility.getQSCartonList(transactionInternalId,shipMethodArray,whLocation,cartonId);
					debugString = debugString + 'cartonDtlObj'+cartonDtlObj; 
					if(!utility.isValueValid(cartonDtlObj) || cartonDtlObj.length==0)
					{
						cartonDtl = {
								errorMessage : translator.getTranslationString('QUICKSHIP_CARTONVALID.INVALIDINPUT'),
								isValid      : false
						};	
					}
					else
					{
						var carton                  	= cartonDtlObj[0]['contentsdescription'];
						var itemFulInternalId 	        = '';// cartonDtlObj[0]['internalid'];
						var pckgWeight                  = cartonDtlObj[0]['weightinlbs'];
						var txnType                     = cartonDtlObj[0]['type'];
						var txnName 	                = cartonDtlObj[0]['tranid'];
						cartonDtl = {
								cartonNum          		: carton,
								shipMethod    				:  shipMethodArray,
								transactionInternalId  	:  transactionInternalId,
								pckgWeight                 :  pckgWeight,
								itemFulInternalId 		:  itemFulInternalId,
								isValid      : true,
								transactionType : txnType,
								transactionName : txnName,
                                palletName : palletName,

						};	
					}
				}
				else
				{
					cartonDtl = {
							errorMessage : translator.getTranslationString('QUICKSHIP_CARTONVALID.INVALIDINPUT'),
							isValid              : false
					};
				}
			}
			else
			{
				cartonDtl = {
						errorMessage : translator.getTranslationString('QUICKSHIP_CARTONVALID.INVALIDINPUT'),
						isValid: false
				};	
			}
			log.debug({title:'debugMessage',details:debugString});
		}
		catch(e)
		{
			cartonDtl['isValid'] = false;
			cartonDtl['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}
		return  cartonDtl;
	}

	return {
		post: doPost
	};

});
