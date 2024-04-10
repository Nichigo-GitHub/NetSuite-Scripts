/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_inventory_utility'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,invtUtility) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {

		var lotListObj = {};

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var fromBinInternalId=requestParams.fromBinInternalId;
				var unitType = requestParams.unitType;
				var stockConversionRate = requestParams.stockConversionRate;
				var selectedConversionRate ='';
				var selectedUOMText ='';
				var processType = requestParams.processType;
				var locUseBinsFlag = requestParams.locUseBinsFlag;

				if(utility.isValueValid(requestParams.uomList))	{
					var selectedUomList = requestParams.uomList;
					selectedConversionRate = selectedUomList.id;
					selectedUOMText = selectedUomList.value;
				}
				
				if(utility.isValueValid(warehouseLocationId) && (utility.isValueValid(fromBinInternalId) ||
						(locUseBinsFlag!='undefined' && locUseBinsFlag!=undefined && locUseBinsFlag == false)) 
						&& utility.isValueValid(itemInternalId)){
					
					var stockConversionUnitname = '';
					if(utility.isValueValid(unitType)){

						var columnArray =[];
						columnArray.push('stockunit');
						var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);
						stockConversionUnitname = itemLookUp.stockunit[0].text;
						
						var uomResult= utility.getUnitsType(unitType);
						var uomList = [];
						if(uomResult.length > 0){
							var rec = [];
							var row = {};
							for(var uomCnt in uomResult){  
								
								 rec = uomResult[uomCnt];
								 row = {'value':rec.unitname,'id':rec.conversionrate};
								uomList.push(row);
							}
							lotListObj.uomList = uomList;
							lotListObj.uomDefaultStatus = stockConversionUnitname;
						}
					}
					var allowAllLots = 'T';//making flag as 'T', because no need to check the "Allow expired items" system rule
					if(	processType == 'putAway') {
						allowAllLots='F';
					}
					log.debug({title:'stockConversionUnitname',details:stockConversionUnitname});
					var objLotDetails = invtUtility.getPickBinDetailsLotWithExpiryDates(itemInternalId,fromBinInternalId,'',warehouseLocationId,
							null,unitType,stockConversionRate,allowAllLots,selectedConversionRate,stockConversionUnitname,selectedUOMText, '','',locUseBinsFlag);
					var lotListLength = objLotDetails.length;
					lotListObj.lotsCount = lotListLength;
					if(lotListLength > 0){
						lotListObj.lotlist = objLotDetails;
						lotListObj.isValid = true;
						if(lotListLength == 1){
							lotListObj.existingLotNumberInBin = objLotDetails[0].lotnumber;//adding this parameter for cartPutaway process
						}
					}
				}
				else{
					lotListObj.isValid = false;
					lotListObj.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
				}
			}
			else {
				lotListObj.isValid = false;
				lotListObj.errorMessage = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
			}
		}
		catch(e){
			
			lotListObj.isValid = false;
			lotListObj.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

		return lotListObj;

	}


	return {
		'post': doPost
	};

});
