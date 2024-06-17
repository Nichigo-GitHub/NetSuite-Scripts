/**
 * Copyright © 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator', './big'],
		/**
		 * @param {search} search
		 */
		function (search, utility, translator, Big) {


	function doPost(requestBody) {

		var whLocation = '';
		var cycPlanId = '';
		var cycPlanTaskCmpltDetails = [];
		var cycPlanTaskDetails={};
		var lotItemsExist = 'F';
		var inventoryStatusFeature = '';
		var requestParams = '';
		var totalTaskCount = "";

		try{
			if (utility.isValueValid(requestBody)) {
				log.debug('requestParams',requestParams);
				requestParams = requestBody.params;
				whLocation = requestParams.warehouseLocationId;
				cycPlanId  = requestParams.cyclePlanId;
				totalTaskCount = requestParams.totalTaskCount;
				inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
				var serItemsTaskResult = [];
				var lotItemsTaskResult = [];
				if (utility.isValueValid(cycPlanId) ) {

					try {
						/* --  Getting Lot items --- */
						var lotItemsTaskSrch = search.load({
							id: 'customsearch_wms_cyc_plan_task_list'
						});

						lotItemsTaskSrch.filters.push(
							search.createFilter({
								name: 'tranid',
								operator: search.Operator.IS,
								values:  cycPlanId
							}));

						lotItemsTaskSrch.filters.push(
							search.createFilter({
								join: 'binnumber',
								name: 'location',
								operator: search.Operator.IS,
								values:  whLocation
							}));
						lotItemsTaskSrch.filters.push(
							search.createFilter({
								name: 'islotitem',
								join : 'item',
								operator: search.Operator.IS,
								values:  'T'
							}));
						lotItemsTaskSrch.columns.push(
							search.createColumn({
								name: 'inventorynumber',
								join : 'inventorydetail'

							}));
						lotItemsTaskSrch.columns.push(
							search.createColumn({
								name: 'quantity',
								join : 'inventorydetail',
								label : 'lot_quantity'

							}));
						if (inventoryStatusFeature)
							lotItemsTaskSrch.columns.push(
								search.createColumn({
									name: 'status',
									join : 'inventorydetail'

								}));


						 lotItemsTaskResult = utility.getSearchResultInJSON(lotItemsTaskSrch);
					}
					catch(e){
						log.error("exception",e);
					}
					/* --  Getting Serial/Inventory items --- */
					try {
						var serItemsTaskSrch = search.load({
							id: 'customsearch_wms_cyc_plan_task_cmpl_list'
						});

						serItemsTaskSrch.filters.push(
							search.createFilter({
								name: 'tranid',
								operator: search.Operator.IS,
								values:  cycPlanId
							}));

						serItemsTaskSrch.filters.push(
							search.createFilter({
								join: 'binnumber',
								name: 'location',
								operator: search.Operator.IS,
								values:  whLocation
							}));
						if (inventoryStatusFeature)
							serItemsTaskSrch.columns.push(search.createColumn({
								name: 'status',
								join: 'inventorydetail',
								summary: search.Summary.GROUP
							}));

						 serItemsTaskResult = utility.getSearchResultInJSON(serItemsTaskSrch);
					}
					catch (e){
						log.error("exception",e);
					}

					log.debug('serItemsTaskResult', serItemsTaskResult);
					log.debug('lotItemsTaskResult', lotItemsTaskResult);
					if(serItemsTaskResult.length == 0 && lotItemsTaskResult.length == 0)
					{
						cycPlanTaskDetails['isValid'] = true;
					}
					else
					{  
						if(serItemsTaskResult.length > 0 ){
						for (var taskResult in serItemsTaskResult) {
								var conversionRate = null;
							serItemsTaskResult[taskResult]['qtyFromPlanComplete'] = serItemsTaskResult[taskResult]['quantityuom'];
							var qty = serItemsTaskResult[taskResult]['quantity'];
								var unitType = parseFloat(serItemsTaskResult[taskResult]['unitstype']);
								var stockUnit = serItemsTaskResult[taskResult]['stockunitText'];
								var isserialitem = serItemsTaskResult[taskResult]['isserialitem'];
							if(qty == '' || qty == null || qty == undefined || isNaN(qty)){
								qty = 0;
								}
								else if(inventoryStatusFeature || (!inventoryStatusFeature && isserialitem)){
									if(utility.isValueValid(unitType) && utility.isValueValid(stockUnit)){
										conversionRate = utility.getStockCoversionRate(unitType, stockUnit, 1);
									}
									log.debug('converstion rate', serItemsTaskResult[taskResult]['itemText'] + '  ' + conversionRate);
									conversionRate = utility.isValueValid(conversionRate) ? conversionRate : 1;
								qty = Big(parseFloat(serItemsTaskResult[taskResult]['quantity'])).div(conversionRate);
							}
								stockUnit = utility.isValueValid(stockUnit) ? stockUnit : '';
								serItemsTaskResult[taskResult]['quantityuom'] = qty + " " + stockUnit;		
						}
					}
					if(lotItemsTaskResult.length > 0 ){
						lotItemsExist = 'T';
						for (var taskResult in lotItemsTaskResult) {
								var conversionRate = null;
								var unitType = parseFloat(lotItemsTaskResult[taskResult]['unitstype']);
								var stockUnit = lotItemsTaskResult[taskResult]['stockunitText'];

							var lotQty = lotItemsTaskResult[taskResult]['lot_quantity'];
							if(lotQty == '' || lotQty == null || lotQty == undefined || isNaN(lotQty)){
								lotQty = 0;
							}else{
									if(utility.isValueValid(unitType) && utility.isValueValid(stockUnit)){
										conversionRate = utility.getStockCoversionRate(unitType, stockUnit, 1);
									}
									log.debug('conversionRate', lotItemsTaskResult[taskResult]['itemText'] + '    ' + conversionRate);
									conversionRate = utility.isValueValid(conversionRate) ? conversionRate : 1;
								lotQty = Big(parseFloat(lotItemsTaskResult[taskResult]['lot_quantity'])).div(conversionRate);
							}
							lotItemsTaskResult[taskResult]['qtyFromPlanComplete'] = lotQty;
								stockUnit = utility.isValueValid(stockUnit) ? stockUnit : '';
								lotItemsTaskResult[taskResult]['quantityuom'] = lotQty + " " + stockUnit;		
						}
					}

					cycPlanTaskCmpltDetails = lotItemsTaskResult;
					for (var taskResult in serItemsTaskResult) {
						if(serItemsTaskResult[taskResult]) {
							cycPlanTaskCmpltDetails.push(serItemsTaskResult[taskResult]);
						}
					}

					cycPlanTaskDetails['cycPlanTaskCompleteList']=cycPlanTaskCmpltDetails;
					cycPlanTaskDetails['completedTaskCount'] = totalTaskCount;
					cycPlanTaskDetails['cyclePlanId']=cycPlanId;
					cycPlanTaskDetails['lotItemsExist']=lotItemsExist;
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
		log.debug('cycPlanTaskDetails',cycPlanTaskDetails);
		return cycPlanTaskDetails;
	}

	return {
		'post': doPost

	};
});