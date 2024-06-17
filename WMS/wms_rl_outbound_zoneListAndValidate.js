/**
 *    Copyright 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','N/query','./wms_translator'],

		function(utility,query,translator) {

	function doPost(requestBody) {

		var responseParams = {};
		try{
		var	requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				var warehouseLocationId = requestParams.warehouseLocationId;
				var actionType = requestParams.actionType;
				var zoneArr = requestParams.zoneId;
				var scannedZone = requestParams.scannedZone;


				if(utility.isValueValid(actionType) ){
					if (actionType == 'zoneSelection'){
						if(utility.isValueValid(zoneArr)){
							var zoneIdArr = [];
							if(utility.isValueValid(zoneArr)){
								for(var zone in zoneArr){
									if(zoneArr[zone]){
										zoneIdArr.push(zoneArr[zone].id);
									}
								}
							}
							if(zoneIdArr.length > 0){
								responseParams.selectedZones = zoneIdArr;
								responseParams.isValid = true;
							}
							else{
								responseParams.errorMessage = translator.getTranslationString('wms_ZonePicking.EMPTY_ZONE');
								responseParams.isValid = false;
							}
						}
						else{
							responseParams.errorMessage = translator.getTranslationString('wms_ZonePicking.EMPTY_ZONE');
							responseParams.isValid = false;
						}
					}
					if(actionType == 'validateZone' && utility.isValueValid(scannedZone)){
						var responseObj = {name:scannedZone};
						responseParams.criteria = responseObj;
						responseParams.errorMessage = translator.getTranslationString('wms_ZonePicking.INVALID_ZONE_SCANNED');
					}
					else{
						var responseObj = {name:scannedZone};
						responseParams.criteria = responseObj;
						responseParams.errorMessage = translator.getTranslationString('wms_ZonePicking.EMPTY_ZONE');
					}
				}				
				else{

					var zonesQuery = query.create({
						type: query.Type.ZONE
					});

					if(utility.isValueValid(warehouseLocationId)){
						var  whLocCondition = zonesQuery.createCondition({
							fieldId: 'location',
							operator: query.Operator.ANY_OF,
							values: warehouseLocationId
						});
						zonesQuery.condition = zonesQuery.and(whLocCondition);
					}
					zonesQuery.columns = [
					                      zonesQuery.createColumn({
					                    	  fieldId: 'name'
					                      }),
					                      zonesQuery.createColumn({
					                    	  fieldId: 'id'
					                      }),
					                      ];

					// Run the query
					var  resultSet = zonesQuery.runPaged({
						pageSize: 1000
					});
					var zonesSearchDetails = [];

					var obj = {name:'All Unassigned Zones',id:'0'};
					zonesSearchDetails.push(obj);

					var iterator = resultSet.iterator();
					var pageCoulmns = null;
					iterator.each(function(result) {
						var	page = result.value;
						if(pageCoulmns == null)
						{
							pageCoulmns = page.data.columns;
						}
						var	pageResults = page.data.results;
						getResultsFromNQuery(pageCoulmns,pageResults,zonesSearchDetails);
						return true;
					});

					responseParams.zoneList = zonesSearchDetails;
					responseParams.isValid = true;
				}
			}
		}
		catch(e)
		{
			responseParams.isValid = false;
			responseParams.errorMessage = e.message;
		}

		return responseParams;
	}
	function getResultsFromNQuery(columnsObj,pageResults,zonesSearchDetails,actionType)
	{
		var columns = columnsObj;
		var values = pageResults;
		for(var res in values){
			var resObj = values[res].values;
			var resultObj = {};
			if(columns){
				for(var col in columns){
					if(columns[col]){
						var colName = columns[col].fieldId;
						resultObj[colName] = resObj[col];
					}
				}
				zonesSearchDetails.push(resultObj);
			}
		}

	}
	return {
		'post': doPost
	};
});
