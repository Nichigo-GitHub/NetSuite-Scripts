/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','N/search','./wms_translator'],

		function (utility,search,translator) {

	/**
	 * Function to validate the entered/scanned warehouse Location
	 * @param {Object} requestParams - Parameters from HTTP request URL;
	 * @returns object with array of scanned warehouse details like warehouse id
	 * @since 2015.1
	 */
	function doPost(requestBody) {
		var warehouseLocationDetails = {};
		var debugString = '';
		try{
			if (utility.isValueValid(requestBody)) {
				var requestParamsObj = requestBody.params;
				log.debug({title:'requestParamsObj',details:requestParamsObj});
				var processType = requestParamsObj.processType;

				var vLocationArr=utility.getRoleBasedLocation(processType);
				var enteredLocation  ='';
				if(requestParamsObj != null && requestParamsObj != '' && 
						requestParamsObj != 'null' && requestParamsObj != undefined && requestParamsObj != 'undefined'){
					enteredLocation = requestParamsObj.warehouseLocationName;
				}
				debugString = debugString +'vLocationArr :'+vLocationArr;
				if(vLocationArr.length==0){
					//for non oneWorld account to fetch all locations
					vLocationArr=utility.getAllLocations();
				}
				if (enteredLocation != '') {

					var locationSearch = search.load({id:'customsearch_wmsse_getrolelocation'});
					var locationSearchFilter = locationSearch.filters;
					locationSearchFilter.push(search.createFilter({
						name: 'name',
						operator: search.Operator.IS,
						values : enteredLocation
					}));
					locationSearch.filters = locationSearchFilter;
					var locResult = utility.getSearchResultInJSON(locationSearch);
					log.debug({title:'locResult',details:locResult});
					if(locResult.length > 0){
						var locId=locResult[0]['id'];
						if(vLocationArr.length > 0 && vLocationArr.indexOf(locId) == -1){
							warehouseLocationDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
							warehouseLocationDetails['isValid'] = false;
							debugString = debugString +'locId :'+locId;
						}
						else{
							var boolUseBins = locResult[0].usesbins;
							var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
							if(inventoryStatusFeature && boolUseBins ==  false)
							{
								warehouseLocationDetails['navigateToStatusPage'] = true;
							}
							
							warehouseLocationDetails['useBinsFlag'] = boolUseBins;
							warehouseLocationDetails['custparam_whlocation'] = locId;
							warehouseLocationDetails['custparam_whlocationname'] = enteredLocation;
							warehouseLocationDetails['isValid'] = true;
							debugString = debugString +'locId :'+locId;
						}
					}
					else{
						warehouseLocationDetails['errorMessage'] =translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						warehouseLocationDetails['isValid'] = false;
						debugString = debugString +'SearchResults  Length is null:';
					}
				}
				else{
					warehouseLocationDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
					warehouseLocationDetails['isValid'] = false;
					debugString = debugString +'SearchResults  Length is null:';

				}
			}
			else{
				warehouseLocationDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
				warehouseLocationDetails['isValid'] = false;
			}
		}
		catch(e){
			warehouseLocationDetails['isValid'] = false;
			warehouseLocationDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+' Stack :'+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return warehouseLocationDetails;
	}
	return {
		'post': doPost
	};

});
