/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/runtime','N/config','N/search','N/record','./wms_utility', './wms_inboundUtility'],

		function (runtime, config, search, record, utility, inboundUtility) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {
		var getPOItem = '';
		var getPOInternalId = '';
		var getItemInternalId = '';
		var whLocation = '';
		var vInvStatus_select = '';
		var getNumber = '';
		var getPOLineNo= '';
		var debugString = '';
		var serialGetDetails ={};
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				getPOItem = requestParams.poItemText;
				getPOInternalId = requestParams.poInternalId;
				getPOLineNo = requestParams.poLineNo;
				getItemInternalId = requestParams.itemInternalId;
				whLocation = requestParams.warehouseLocationId;
				vInvStatus_select = requestParams.invStatusId;
				getNumber = requestParams.numberOfTimesSerialScanned;
				if(utility.isValueValid(getPOInternalId) && utility.isValueValid(getPOLineNo) && utility.isValueValid(getItemInternalId)
						&& utility.isValueValid(whLocation))
				{
					if(!utility.isValueValid(getNumber))
					{
						getNumber=0;
					}
					if(parseInt(getNumber)==0)
					{

						var serialSearch = search.load({
							id: 'customsearch_wmsse_wo_serialentry_srh',
						});
						var serailFilters = serialSearch.filters;

						if(utility.isValueValid(getPOLineNo))
						{
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_ordline',
								operator: search.Operator.EQUALTO,
								values: getPOLineNo
							}));
						}
						if(utility.isValueValid(getPOInternalId))
						{
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_ordno',
								operator: search.Operator.ANYOF,
								values: getPOInternalId
							}));
						}
						serialSearch.filters = serailFilters;
						var serialSearchResults =utility.getSearchResultInJSON(serialSearch);
						if(serialSearchResults !=null && serialSearchResults !="" && serialSearchResults != 'null'
							&& serialSearchResults.length > 0)
						{
							for (var j = 0; j < serialSearchResults.length; j++) {
								var TempRecord = serialSearchResults[j];
								var serialRec = record.load({
									type : 'customrecord_wmsse_serialentry',
									id : TempRecord.id
								});
								serialRec.setValue({ fieldId:'id', value :TempRecord.id });
								serialRec.setValue({ fieldId:'name', value :TempRecord.name});
								serialRec.setValue({ fieldId:'custrecord_wmsse_ser_note1', value :'because of discontinue of serial number scanning we have marked this serial number as closed'});
								serialRec.setValue({ fieldId:'custrecord_wmsse_ser_status', value :true });
								serialRec.save();
							}

						}
					}
					if(utility.isValueValid(getItemInternalId))
					{
						var itemresults = inboundUtility.getItemSearchDetails(getItemInternalId,whLocation);
						if (itemresults != null && itemresults.length > 0) {
							getPOItem = itemresults[0]['itemid'];
							serialGetDetails['getPOItem'] = getPOItem;
							serialGetDetails['isValid'] = true;
						}
					}
					if(vInvStatus_select != null && vInvStatus_select != '' && vInvStatus_select != undefined && vInvStatus_select != 'null')
					{
						var inventoryStatusLst = inboundUtility.getDefaultInventoryStatusList(vInvStatus_select);
						if(inventoryStatusLst != '')
						{
							serialGetDetails['inventoryStatusLst'] = inventoryStatusLst;
						}
					}
				}
				else
				{
					serialGetDetails['isValid'] = false;
				}
			}
			else
			{
				serialGetDetails['isValid'] = false;
			}
		}
		catch(e)
		{
			serialGetDetails['isValid'] = false;
			serialGetDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return serialGetDetails;
	}
	return {
		'post': doPost,
	};
});
