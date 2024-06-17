/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/runtime','./wms_utility','./wms_translator','./wms_inventory_utility','N/config'],

		function (search, runtime,utility,translator,invtUtility,config) {

	function doPost(requestBody) {

		var whLocation = '';
		var cycPlanDetails = {};
		var cyclePlanId = '';
		var flag = 'F';
		var planId = '';
		var requestParams = '';
		var locUseBinsFlag = '';
		var inputParamObj ={};
		try{

			if (utility.isValueValid(requestBody)) {
				requestParams = requestBody.params;
				log.debug({title:'requestParams',details:requestParams});
				whLocation = requestParams.warehouseLocationId;
				cyclePlanId = requestParams.cyclePlanId;
				var currentUser = runtime.getCurrentUser().id;
				locUseBinsFlag = requestParams.locUseBinsFlag;

				if (utility.isValueValid(cyclePlanId) && utility.isValueValid(whLocation) ) {

					inputParamObj.warehouseLocationId = whLocation;
					inputParamObj.cyclePlanId = cyclePlanId;
					inputParamObj.locUseBinsFlag = locUseBinsFlag;

					var outputParamObj = getCyclePlanDetails(inputParamObj);
					var getCycPlanData = outputParamObj.getCycPlanData ;

					if(utility.isValueValid(outputParamObj.validationPassedFlag) &&  outputParamObj.validationPassedFlag == 'F'){
						
						cycPlanDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.PLAN_ITEMF_LOCATIONT');
						cycPlanDetails['isValid']=false;
					}
					else if(getCycPlanData.length > 0)
					{
						var planStatus= getCycPlanData[0]['statusref'];

						planId=getCycPlanData[0]['internalid'];

						var invCountDepartmentId=getCycPlanData[0].department;
						var invCountClassId=getCycPlanData[0].class;

						if(planStatus == 'InvCount:B' )
						{	
							inputParamObj={};
							inputParamObj.planId = planId;
							inputParamObj.currentUser = currentUser;
							var chkCycPlansResult = checkCyccPlanfromOT(inputParamObj);

							var chkCycPlansbyUserResult = checkCycPlansbyUser(inputParamObj);

							if(chkCycPlansbyUserResult.length > 0 || chkCycPlansResult.length == 0){
								flag = 'T';
							}

							if(!utility.isValueValid(locUseBinsFlag))
							{
								var columnsArr = [];
								columnsArr.push('usesbins');
								var locResults = utility.getLocationFieldsByLookup(whLocation,columnsArr);
								if(locResults){
									locUseBinsFlag =  locResults.usesbins;
								}
							}
							var cycleTaskDtls = invtUtility.getCyclePlanTaskDetails(cyclePlanId, whLocation, null, null, true,null,null,locUseBinsFlag);

							if( flag == 'T')
							{
								log.debug('flag',flag);
								var makeDepartmentsMandatory = utility.getDeparmentValue();
								var makeClassMandatory = utility.getClassValue();

								if (makeDepartmentsMandatory == true && makeClassMandatory == true && !utility.isValueValid(invCountDepartmentId) && !utility.isValueValid(invCountClassId)) {
									cycPlanDetails.errorMessage= translator.getTranslationString('CYCLECOUNT.PLANDEPARTMENTCLASSSTR') + cyclePlanId + translator.getTranslationString('CYCLECOUNTPLAN.PLANDEPARTMENTCLASS');
									cycPlanDetails.isValid=false;
								}
								else if (makeDepartmentsMandatory && !utility.isValueValid(invCountDepartmentId)) {
									cycPlanDetails.errorMessage=translator.getTranslationString('CYCLECOUNT.PLANDEPARTMENTCLASSSTR') + cyclePlanId + translator.getTranslationString('CYCLECOUNTPLAN.PLANDEPARMENT');
									cycPlanDetails.isValid=false;
								}
								else if (makeClassMandatory && !utility.isValueValid(invCountClassId)) {
									cycPlanDetails.errorMessage=translator.getTranslationString('CYCLECOUNT.PLANDEPARTMENTCLASSSTR') + cyclePlanId + translator.getTranslationString('CYCLECOUNTPLAN.PLANCLASS');
									cycPlanDetails.isValid=false;
								}
								else{

								cycPlanDetails['planComplete'] = cycleTaskDtls.length == 0 ? 'true' : 'false';
								cycPlanDetails['cycPlanList']=getCycPlanData;
								cycPlanDetails['cyclePlanId']=getCycPlanData[0]['truedocnumber'];
								cycPlanDetails['binnumber']=getCycPlanData[0]['binnumber'];
								cycPlanDetails['item']=getCycPlanData[0]['item'];
								cycPlanDetails['actualBeginTime'] = utility.getCurrentTimeStamp();
								cycPlanDetails['totalTaskCount'] = getCycPlanData[0]['line'];
								cycPlanDetails['isValid']=true;
								cycPlanDetails['fromReconcilePlanList']=true;
								cycPlanDetails['locUseBinsFlag']=locUseBinsFlag;
							}
							}
							else if(flag == 'F')
							{
								cycPlanDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.PLANASSIGNED_USER');
								cycPlanDetails['isValid']=false;
							}
						}
						else
						{
							cycPlanDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.PLANSTARTED_COMPLETED');
							cycPlanDetails['isValid']=false;
						}

					}
					else
					{
						cycPlanDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.INVALID_PLAN');
						cycPlanDetails['isValid']=false;

					}

				}
				else {
					if(!utility.isValueValid(whLocation)){
						cycPlanDetails['errorMessage']=translator.getTranslationString('PO_WAREHOUSEVALIDATION.EMPTY_INPUT');
						cycPlanDetails['isValid']=false;
					}
					else
					{
						cycPlanDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.INVALID_PLAN');
						cycPlanDetails['isValid']=false;
					}
				}
			}
			else
			{
				cycPlanDetails['errorMessage']=translator.getTranslationString('CYCLECOUNTPLAN.INVALID_PLAN');
				cycPlanDetails['isValid']=false;
			}


		}
		catch(e)
		{
			cycPlanDetails['isValid'] = false;
			cycPlanDetails['errorMessage'] = e.message;
		}
		return cycPlanDetails;
	}
	function getCyclePlanDetails(inputParamObj)
	{
		var outputParamObj = {};
		var getCycPlans = search.load({
			id: 'customsearch_wms_cyc_plan_list'
		});

		getCycPlans.filters.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: inputParamObj.warehouseLocationId
		}));

		getCycPlans.filters.push(search.createFilter({
			name: 'tranid',
			operator: search.Operator.IS,
			values: inputParamObj.cyclePlanId
		}));
		
		var getCycPlanData = utility.getSearchResultInJSON(getCycPlans);
		outputParamObj.getCycPlanData = getCycPlanData;
		if(getCycPlanData.length > 0){
			
			if(!utility.isValueValid( inputParamObj.locUseBinsFlag) || inputParamObj.locUseBinsFlag ){
				getCycPlans.filters.push(search.createFilter({
					name: 'usebins',
					join : 'item',
					operator: search.Operator.IS,
					values: true
				}));
			var planValidateResults = utility.getSearchResultInJSON(getCycPlans);
			if(planValidateResults.length == 0 ){
				outputParamObj.validationPassedFlag = 'F';
			}
			}
		}
		
		return outputParamObj;
	}
	function checkCyccPlanfromOT(inputParamObj)
	{
		var checkCycPlan = search.load({
			id: 'customsearch_wmsse_opentask_search'
		});
		checkCycPlan.filters.push(
				search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: inputParamObj.planId
				}));
		var chkCycPlansResult = utility.getSearchResultInJSON(checkCycPlan);
		return chkCycPlansResult;
	}
	function checkCycPlansbyUser(inputParamObj)
	{
		var checkCycPlansbyUser = search.load({
			id: 'customsearch_wmsse_opentask_search'
		});
		checkCycPlansbyUser.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_task_assignedto',
					operator: search.Operator.ANYOF,
					values:  ['@NONE@', inputParamObj.currentUser]
				}));
		checkCycPlansbyUser.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_wms_status_flag',
					operator: search.Operator.ANYOF,
					values: 31
				}));
		checkCycPlansbyUser.filters.push(
				search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: inputParamObj.planId
				}));			

		var chkCycPlansbyUserResult = utility.getSearchResultInJSON(checkCycPlansbyUser);
		return chkCycPlansbyUserResult;
	}

	return {
		'post': doPost

	};
});
