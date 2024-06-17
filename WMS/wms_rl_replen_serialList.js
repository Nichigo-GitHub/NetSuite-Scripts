/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {

		var serialArr = {};
		var debugString = '';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var toBinInternalId=requestParams.toBinInternalId;
				var fromBinInternalId=requestParams.fromBinInternalId;
				var fromStatusInternalId = requestParams.fromStatusInternalId;
				var scannedSerialNums = [];
				log.debug({title:'requestParams',details:requestParams});
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(toBinInternalId) && utility.isValueValid(itemInternalId)
						&& utility.isValueValid(fromBinInternalId))
				{	

				

					var serialSearch = search.load({
						id: 'customsearch_wmsse_wo_serialentry_srh',
					});
					var serailFilters = serialSearch.filters;

					if(utility.isValueValid(toBinInternalId))
					{
						serailFilters.push(search.createFilter({
							name: 'custrecord_wmsse_ser_bin',
							operator: search.Operator.ANYOF,
							values: toBinInternalId
						}));
					}
					if(utility.isValueValid(itemInternalId))
					{
						serailFilters.push(search.createFilter({
							name: 'custrecord_wmsse_ser_item',
							operator: search.Operator.ANYOF,
							values: itemInternalId
						}));
					}
					serailFilters.push(search.createFilter({
						name: 'custrecord_wmsse_ser_tasktype',
						operator: search.Operator.ANYOF,
						values: 17
					}));
					serailFilters.push(search.createFilter({
						name: 'custrecord_wmsse_ser_status',
						operator: search.Operator.IS,
						values: false				
					}));
					serialSearch.filters = serailFilters;
					var serialSearchResults =utility.getSearchResultInJSON(serialSearch);

					if(serialSearchResults.length > 0){
						for(var i in serialSearchResults)
							scannedSerialNums.push(serialSearchResults[i]['custrecord_wmsse_ser_no']);
					}
				
					var objSerialDetails = utility.getSerialList(fromBinInternalId,itemInternalId,warehouseLocationId,fromStatusInternalId);
					var serialList = {};
					var serArr = [];
					var counter =0;
					if(scannedSerialNums.length > 0)
					{
						var isMatchFound = false;
						for(var i in objSerialDetails){
							isMatchFound = false;
							if(counter < scannedSerialNums.length)
							{
								for(var j in scannedSerialNums){

									if(objSerialDetails[i]['inventorynumberText'] == scannedSerialNums[j]){
										counter++;
										isMatchFound = true;
										break;
									}
								}
							}
							if(!isMatchFound)
							{
								serArr[serArr.length] = objSerialDetails[i];
							}
						}
						serialList = serArr;
					}
					else
					{
						serialList = objSerialDetails;
					}
					if(objSerialDetails.length>0)
					{
						serialArr['serialList'] = serialList;
						serialArr['isValid'] = true;
					}
					else
					{
						serialArr['isValid'] = false;
						serialArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
					}
				}
				else
				{
					serialArr['isValid'] = false;
					serialArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
				}
			}
			else
			{
				serialArr['isValid'] = false;
				serialArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
			}
		}
		catch(e)
		{
			serialArr['isValid'] = false;
			serialArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return serialArr;

	}

	return {
		'post': doPost
	};

});
