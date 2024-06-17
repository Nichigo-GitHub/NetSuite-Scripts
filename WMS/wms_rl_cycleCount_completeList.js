/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_inventory_utility'],

		function (search, utility, invtUtility) {

	function doPost(requestBody) {

		var cycPlanTaskDetails={};
		var requestParams = '';
		var cycPlanTaskCompleteList =[];
		var inputParamObj ={};
		try{
			if (utility.isValueValid(requestBody)) {

				requestParams = requestBody.params;

				if (utility.isValueValid(requestParams.cyclePlanInternalId) ) {
					inputParamObj={};
					inputParamObj.warehouseLocationId = requestParams.warehouseLocationId;
					inputParamObj.cyclePlanInternalId = requestParams.cyclePlanInternalId;
					if(requestParams.planCompletionStatus == 'planCompleted'){
						
						cycPlanTaskCompleteList = getCYCCCountPlanItemList(inputParamObj);
						
					}else{
						inputParamObj.itemInternalId = requestParams.itemInternalId;
						inputParamObj.openTaskLineNum = requestParams.lineNum;
						inputParamObj.openTaskIdArray = requestParams.openTaskIdArray;

						cycPlanTaskCompleteList = invtUtility.getCYCCCountCompletedList(inputParamObj);
					}
					cycPlanTaskDetails['cycPlanTaskCompleteList']=cycPlanTaskCompleteList;
					cycPlanTaskDetails['isValid']=true;					
				}              
			}
			else {
				cycPlanTaskDetails['isValid']=false;				
			}
		}
		catch(e)
		{
			cycPlanTaskDetails['isValid'] = false;
			cycPlanTaskDetails['errorMessage'] = e.message;
		}
		log.debug('cycPlanTaskDetails',cycPlanTaskDetails);
		return cycPlanTaskDetails;
	}
	function getCYCCCountPlanItemList(inputParamObj)
	{      
		var CYCCCountCompletedSearch = search.load({id:'customsearch_wms_get_ot_cyccplan_details'});
		var CYCCFilters = CYCCCountCompletedSearch.filters;
		if (utility.isValueValid(inputParamObj.warehouseLocationId )) {
			CYCCFilters.push(search.createFilter({
				name :'custrecord_wmsse_wms_location',
				operator: search.Operator.ANYOF,
				values:  inputParamObj.warehouseLocationId 
			}));
		}
		if (utility.isValueValid(inputParamObj.cyclePlanInternalId)) {
			CYCCFilters.push(search.createFilter({
				name :'custrecord_wmsse_order_no',
				operator: search.Operator.ANYOF,
				values:  inputParamObj.cyclePlanInternalId
			}));
		}

		CYCCCountCompletedSearch.filters = CYCCFilters;
		var CYCCOpenTaskDetails = utility.getSearchResultInJSON(CYCCCountCompletedSearch);
		return CYCCOpenTaskDetails;		
	}

	return {
		'post': doPost

	};
});
