/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/runtime', './wms_utility', './wms_translator'],
	/**
	 * @param {search} search
	 */
	function(search, runtime, utility, translator) {


		function doPost(requestBody) {

			var whLocation = '';
			var cycPlanDetails = {};
			var getCycPlansResult = [];
			var incompletedPlans = {};
			var showCompletedItems = '';
			var requestParams = '';
			var inputParamObj = {};
			var currentUser = '';
			var locUseBinsFlag = '';
			var cyclePlanCountRes = [];
			try {

				if (utility.isValueValid(requestBody)) {
					requestParams = requestBody.params;
					whLocation = requestParams.warehouseLocationId;
					showCompletedItems = requestParams.showCompletedItems;
					currentUser = runtime.getCurrentUser().id;
					locUseBinsFlag = requestParams.locUseBinsFlag;

					if (utility.isValueValid(whLocation)) {

						inputParamObj.currentUser = currentUser;
						var cycPlanInternalIdObj = getOtherUserAssignedPlans(inputParamObj);

						inputParamObj = {};
						inputParamObj.warehouseLocationId = whLocation;
						inputParamObj.showCompletedItems = showCompletedItems;
						inputParamObj.locUseBinsFlag = locUseBinsFlag;

						var outputParamObj = getCyclePlanList(inputParamObj);

						if (outputParamObj != undefined) {
							cyclePlanCountRes = outputParamObj.cyclePlanCountRes[0];
							getCycPlansResult = outputParamObj.getCycPlansResult;
						}

						if (getCycPlansResult.length > 0) {
							var cycPlanResults = [];
							var trueDocNumber = '';
							var varInternalId = '';
							for (var i in getCycPlansResult) {

								var cycPlanResultsObj = {};
								varInternalId = getCycPlansResult[i]['internalid'];
								if (cycPlanInternalIdObj[varInternalId] != true) {
									cycPlanResultsObj = getCycPlansResult[i];
									trueDocNumber = getCycPlansResult[i]['truedocnumber'];
									incompletedPlans[trueDocNumber] = true;
									if (cyclePlanCountRes != undefined && cyclePlanCountRes[trueDocNumber] != undefined) {

										cycPlanResultsObj.totalTaskCount = cyclePlanCountRes[trueDocNumber]['line'];
										cycPlanResultsObj.binnumberTotal = cyclePlanCountRes[trueDocNumber]['binnumber'];
										cycPlanResultsObj.itemTotal = cyclePlanCountRes[trueDocNumber]['item'];
										cycPlanResultsObj.completedTaskCount = parseInt(cyclePlanCountRes[trueDocNumber]['line']) - parseInt(getCycPlansResult[i]['line']);
										cycPlanResultsObj.remaingTaskCount = getCycPlansResult[i]['line'];

									}

									cycPlanResults.push(cycPlanResultsObj);
								}
							}
							cycPlanDetails['cycPlanList'] = cycPlanResults;
						}
						else {
							cycPlanDetails['errorMessage'] = translator.getTranslationString('CYCLECOUNTPLAN.NO_PLANS');
							cycPlanDetails['isValid'] = false;
						}

						if (showCompletedItems == 'true') {

							cycPlanDetails['completedPlans'] = getCompletedCyclePlanDetails(whLocation, incompletedPlans, cycPlanInternalIdObj);
						}
						cycPlanDetails['isValid'] = true;
					}
					else {
						cycPlanDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						cycPlanDetails['isValid'] = false;
					}
				}
				else {
					cycPlanDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
					cycPlanDetails['isValid'] = false;
				}

			}
			catch (e) {
				cycPlanDetails['isValid'] = false;
				cycPlanDetails['errorMessage'] = e.message;
			}
			return cycPlanDetails;
		}
		function getCompletedCyclePlanDetails(whLocation, incompletedPlans, cycPlanobj) {
			var completedPlans = [];
			var getCycPlanTasks = search.load({
				id: 'customsearch_wms_cyc_plan_list'
			});

			if (utility.isValueValid(whLocation))
				getCycPlanTasks.filters.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.IS,
						values: whLocation
					}));

			getCycPlanTasks.filters.push(search.createFilter({
				name: 'status',
				operator: search.Operator.ANYOF,
				values: ['InvCount:B']
			}));
			getCycPlanTasks.filters.push(
				search.createFilter({
					name: 'quantity',
					operator: search.Operator.ISNOTEMPTY,
				}));

			var searchRes = utility.getSearchResultInJSON(getCycPlanTasks);
			var matchFound = false;
			for (var i in searchRes) {
				if (cycPlanobj != undefined && cycPlanobj[searchRes[i]['internalid']] != true) {
					matchFound = false;
					if (incompletedPlans != undefined && incompletedPlans[searchRes[i]['truedocnumber']] == true) {
						matchFound = true;

					}

					if (!matchFound) {
						completedPlans.push(searchRes[i]);
					}
				}
			}
			return completedPlans;
		}

		function getCyclePlanList(inputParamObj) {

			var cyclePlanCountRes = [];
			var getCycPlansResult = [];
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
				name: 'status',
				operator: search.Operator.ANYOF,
				values: ['InvCount:B']
			}));

			if (!utility.isValueValid(inputParamObj.locUseBinsFlag) || inputParamObj.locUseBinsFlag) {
				getCycPlans.filters.push(search.createFilter({
					name: 'usebins',
					join: 'item',
					operator: search.Operator.IS,
					values: true
				}));
			}
			if (inputParamObj.showCompletedItems != 'true') {
				var cyclePlanCountResults = utility.getSearchResults(getCycPlans);

				var cyclePlanCountResultsLength = cyclePlanCountResults.length;
				log.debug('cyclePlanCountResultsLength', cyclePlanCountResultsLength);
				if (cyclePlanCountResultsLength > 0) {
					var curObj = {};
					for (var cycplan = 0; cycplan < cyclePlanCountResultsLength; cycplan++) {
						var curRow = cyclePlanCountResults[cycplan];
						var Obj = {};
						Obj.truedocnumber = curRow.getValue({ name: 'truedocnumber', summary: 'GROUP' });
						Obj.internalid = curRow.getValue({ name: 'internalid', summary: 'GROUP' });
						Obj.internalid = curRow.getText({ name: 'internalid', summary: 'GROUP' });
						Obj.statusref = curRow.getValue({ name: 'statusref', summary: 'GROUP' });
						Obj.statusrefText = curRow.getText({ name: 'statusref', summary: 'GROUP' });
						Obj.binnumber = curRow.getValue({ name: 'binnumber', join: 'binNumber', summary: 'COUNT' });
						Obj.binnumberText = curRow.getText({ name: 'binnumber', join: 'binNumber', summary: 'COUNT' });
						Obj.item = curRow.getValue({ name: 'item', summary: 'COUNT' });
						Obj.datecreated = curRow.getValue({ name: 'datecreated', summary: 'GROUP' });
						Obj.line = curRow.getValue({ name: 'line', summary: 'COUNT' });
						Obj.trandate = curRow.getValue({ name: 'trandate', summary: 'GROUP' });
						curObj[Obj.truedocnumber] = Obj;
						cyclePlanCountRes.push(curObj);
					}
				}
			}

			getCycPlans.filters.push(
				search.createFilter({
					name: 'quantity',
					operator: search.Operator.ISEMPTY
				}));
			var getCycPlansResult = utility.getSearchResultInJSON(getCycPlans);

			outputParamObj.cyclePlanCountRes = cyclePlanCountRes;
			outputParamObj.getCycPlansResult = getCycPlansResult;

			return outputParamObj;
		}
		function getOtherUserAssignedPlans(inputParamObj) {
			var getCycPlansbyUser = search.load({
				id: 'customsearch_wmsse_opentask_search'
			});

			getCycPlansbyUser.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_task_assignedto',
					operator: search.Operator.NONEOF,
					values: ['@NONE@', inputParamObj.currentUser]
				}));
			getCycPlansbyUser.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_wms_status_flag',
					operator: search.Operator.ANYOF,
					values: 31
				}));


			getCycPlansbyUser.columns.push(search.createColumn({
				name: 'name'
			}));

			var getUserCycPlansResult = utility.getSearchResults(getCycPlansbyUser);
			var cycleCountPlanIdObj = {};
			for (var cycPlanItr in getUserCycPlansResult) {
				var cycPlan = getUserCycPlansResult[cycPlanItr].getValue({ name: 'name' });
				if (utility.isValueValid(cycPlan) && cycleCountPlanIdObj[cycPlan] != true)
					cycleCountPlanIdObj[cycPlan] = true;
			}
			return cycleCountPlanIdObj;
		}

		return {
			'post': doPost

		};
	});
