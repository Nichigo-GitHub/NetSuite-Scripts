/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_inventory_utility'],

		function (utility, invtUtility) {

	function doPost(requestBody) {

		var cycPlanTaskDetails={};		
		var requestParams = '';
		var inputParamObj ={};
		try{
			if (utility.isValueValid(requestBody)) {

				requestParams = requestBody.params;

				if(requestParams.noBinsActions == 'newEntryBtnClicked'){
					cycPlanTaskDetails['isValid']=true;
					cycPlanTaskDetails['newEntryBtnClicked']=requestParams.noBinsActions;
				}
				else if(requestParams.noBinsActions == 'timeLinkClicked'){
					cycPlanTaskDetails['isValid']=true;
					cycPlanTaskDetails['timeLinkClicked']=requestParams.noBinsActions;
				}
				else if(requestParams.noBinsActions == 'tableOnAction' && utility.isValueValid(requestParams.cyclePlanInternalId)
						&& utility.isValueValid(requestParams.itemInternalId)){
					inputParamObj={};
					inputParamObj.warehouseLocationId = requestParams.warehouseLocationId;
					inputParamObj.itemInternalId = requestParams.itemInternalId;
					inputParamObj.openTaskLineNum = requestParams.lineNum;
					inputParamObj.cyclePlanInternalId = requestParams.cyclePlanInternalId;
					var cycPlanTaskCompleteList = invtUtility.getCYCCCountCompletedList(inputParamObj);
					cycPlanTaskDetails['cycPlanTaskCompleteList']=cycPlanTaskCompleteList;
					cycPlanTaskDetails['isValid']=true;			
				}
				else {
					cycPlanTaskDetails['isValid']=false;					
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

	return {
		'post': doPost

	};
});
