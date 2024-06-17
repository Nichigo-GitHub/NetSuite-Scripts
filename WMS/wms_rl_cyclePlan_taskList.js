/**
 * Copyright ï¿½ 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_inventory_utility'],

		function (search,utility,translator,invtUtility) {

	function doPost(requestBody) {

		var whLocation = '';
		var planId = '';
		var cycPlanTaskDetails = {};
		var requestParams = '';
		try{
			if (utility.isValueValid(requestBody)) {		
				requestParams = requestBody.params;
				whLocation = requestParams.warehouseLocationId;
				planId  = requestParams.cyclePlanId;
				var boolShowCompletedItems = requestParams.showCompletedItems;
				if (utility.isValueValid(planId)) {

					var getCycPlanTasksResult = invtUtility.getCyclePlanTaskDetails(planId,whLocation);	
					if(!utility.isValueValid(getCycPlanTasksResult)|| getCycPlanTasksResult.length == 0)
					{
						cycPlanTaskDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.USEBINS_FLASE');
						cycPlanTaskDetails['isValid'] = false;
					}
					else
					{
						getCycPlanTasksResult = this.showPlanTaskList(getCycPlanTasksResult,boolShowCompletedItems);
						if(boolShowCompletedItems == true || boolShowCompletedItems == 'true'){
							cycPlanTaskDetails['completedTaskCount'] = getCycPlanTasksResult.length;
						}
						if(getCycPlanTasksResult.length > 0){
							cycPlanTaskDetails['binName']=getCycPlanTasksResult[0]['binnumber'];
							cycPlanTaskDetails['itemName']=getCycPlanTasksResult[0]['itemText'];
							cycPlanTaskDetails['binInternalId']=getCycPlanTasksResult[0]['Internal ID'];
							cycPlanTaskDetails['itemInternalId']=getCycPlanTasksResult[0]['item'];
							cycPlanTaskDetails['itemDesc']=getCycPlanTasksResult[0]['salesdescription'];
						}
						cycPlanTaskDetails['cycPlanTaskList']=getCycPlanTasksResult;
						cycPlanTaskDetails['isValid']=true;
					}
				}
				else {
					cycPlanTaskDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.INVALID_PLAN');
					cycPlanTaskDetails['isValid']=false;
				}
			}
			else {
				cycPlanTaskDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.INVALID_PLAN');
				cycPlanTaskDetails['isValid']=false;
			}
		}
		catch(e)
		{
			cycPlanTaskDetails['isValid'] = false;
			cycPlanTaskDetails['errorMessage'] = e.message;
		}
		return cycPlanTaskDetails;
	}


	function showPlanTaskList(getCycPlanTasksResult,boolShowCompletedItems)
	{
		var completedItems = [];
		var pendingitemstoCount = [];

		for (var taskResult in getCycPlanTasksResult) {
			getCycPlanTasksResult[taskResult]['Internal ID']= getCycPlanTasksResult[taskResult]['internalidText'];

			var quantity = getCycPlanTasksResult[taskResult]['quantityuom'];
			var unitText = getCycPlanTasksResult[taskResult]['unit'];

			if(utility.isValueValid(quantity) )
			{   getCycPlanTasksResult[taskResult]['quantity'] = quantity + " " + unitText;
			completedItems.push(getCycPlanTasksResult[taskResult]);	
			}
			else
			{
				pendingitemstoCount.push(getCycPlanTasksResult[taskResult]);
			}
		}
		if(boolShowCompletedItems == true || boolShowCompletedItems == 'true')
		{
			return completedItems;
		}
		else
		{
			return pendingitemstoCount;
		}
	}


	return {
		'post': doPost,
		showPlanTaskList : showPlanTaskList

	};
});
