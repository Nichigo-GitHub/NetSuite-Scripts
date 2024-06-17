/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_outBoundUtility','N/task','N/query','N/search','./wms_tallyScan_utility'],

		function(utility,translator,obUtility,task,query,search,tallyScanUtility) {

	/**
	 * Function to validate stage bin
	 */
	function doPost(requestBody) {

		var stageBinDetailsArr = {};
		var debugString = '';
		var requestParams = '';
		var waveId ='';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{

				var warehouseLocationId = requestParams.warehouseLocationId;
				var binName = requestParams.binName;
				var orderInternalId = requestParams.transactionInternalID;
				var pickingType = requestParams.pickingType;
				var waveName = requestParams.waveName;
				var isContainerScanRequired ='N';
				var isZonePickingEnabled   = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var selectedOrderIdArr = requestParams.selectedOrders;
				var stageByOrderSystemRuleValue = requestParams.stageByOrderSystemRuleValue;
				var isEnforceStageFlagEnabled = requestParams.isEnforceStageFlagEnabled;
				var pickTaskId = requestParams.pickTaskId;
				var processNameFromState = requestParams.processNameFromState;
                var fromBtnClick = requestParams.fromBtnClick;
				var completepickingpickTaskId = requestParams.completepickingpickTaskId;
                var markOpenPicksDoneAutomaticallySystemRuleValue = "N";

				log.debug('requestParams.pickTaskId',requestParams);

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(binName))
				{

					if(!utility.isValueValid(pickTaskId)) {
						pickTaskId = "";
					}
					if(utility.isValueValid(fromBtnClick)
							&& fromBtnClick == "CompletePicking" &&
						utility.isValueValid(completepickingpickTaskId)){
							pickTaskId =  completepickingpickTaskId;
						}


					if(!utility.isValueValid(selectedZones)){
						selectedZones = [];
					}
					if(!utility.isValueValid(isZonePickingEnabled)){
						isZonePickingEnabled = false;
					}
					if((!utility.isValueValid(selectedOrderIdArr)) || (isZonePickingEnabled == false)){
						selectedOrderIdArr = [];
					}
					if(!utility.isValueValid(isEnforceStageFlagEnabled)){
						isEnforceStageFlagEnabled = false;
					}

						var stageBinDetailsObj = {}; 
						var duplicate_orderInternalIdArr = [];
						var transactionType = '';
						var pickTaskIdKeysObj = {};
						stageBinDetailsObj.binName = binName;							
						stageBinDetailsObj.whLocationId = warehouseLocationId;
						stageBinDetailsObj.orderInternalId = orderInternalId;

						var stageBinInternalId =  obUtility.validateStageBin(stageBinDetailsObj);

						if(stageBinInternalId != ''){
							var enforcedStageBinId = stageBinInternalId;
							log.debug('isEnforceStageFlagEnabled',isEnforceStageFlagEnabled);
							if(isZonePickingEnabled == true && isEnforceStageFlagEnabled == true){
								if(utility.isValueValid(pickingType) && pickingType == 'multiOrder'){
									enforcedStageBinId = validateScannedStage(pickingType, selectedOrderIdArr, warehouseLocationId);
								}
								else {
									enforcedStageBinId = validateScannedStage(pickingType, orderInternalId, warehouseLocationId);
								}
							}

							if(utility.isValueValid(enforcedStageBinId) && (enforcedStageBinId != stageBinInternalId)){
								var binDetails = search.lookupFields({
									type: 'Bin',
									id: enforcedStageBinId,
									columns: ['binnumber']
								});
								log.debug('binDetails',binDetails);	
								var mergeStageBinName = '';
								if(binDetails != undefined){
								 mergeStageBinName = binDetails.binnumber;
								}

								stageBinDetailsArr.isValid = false;	 
								var msgParamArr = [];
								msgParamArr.push(mergeStageBinName);
								stageBinDetailsArr.errorMessage = translator.getTranslationString("WMS_Zonepicking.MergeStage",msgParamArr);
							}
							else{

								if(utility.isValueValid(pickingType) && pickingType == 'multiOrder'){
									var waveIdArr = obUtility.getWaveInternalId(waveName,warehouseLocationId);
									if(waveIdArr.length > 0){
										waveId = waveIdArr[0].internalid;
									}
								}
								stageBinDetailsObj.stageBinInternalId = stageBinInternalId;
								stageBinDetailsObj.pickingType = pickingType;
								stageBinDetailsObj.waveId = waveId;
								stageBinDetailsObj.isZonePickingEnabled = isZonePickingEnabled;
								stageBinDetailsObj.selectedOrderIdArr = selectedOrderIdArr;
								stageBinDetailsObj.selectedZones = selectedZones;
								stageBinDetailsObj.pickTaskId = pickTaskId;

								var isStageBinUpdated ='';
								var pickTasksDetails = obUtility.getPicktasksDetailsReadyToStage(stageBinDetailsObj);
								var pickTasksLength = pickTasksDetails.length;

								if(pickTasksLength > 0)	{
									for(var pickTaskItr = 0 ; pickTaskItr < pickTasksLength; pickTaskItr++)	{

										var pickOrderInternalId = pickTasksDetails[pickTaskItr].internalid;

										if(duplicate_orderInternalIdArr.indexOf(pickOrderInternalId)==-1){
											duplicate_orderInternalIdArr.push(parseInt(pickOrderInternalId));
											transactionType = pickTasksDetails[pickTaskItr].transactiontype;
										}
										pickTaskIdKeysObj[pickTasksDetails[pickTaskItr].id]=true;
									}
									log.debug('transactionType ',transactionType);
									var thresholdValue = "";
									var systemRule = "Enable bulk staging of large pick tasks";
									var triggerPointForMRscript = utility.getSystemRuleValue(systemRule,warehouseLocationId);	
									if(!utility.isValueValid(triggerPointForMRscript) || triggerPointForMRscript =='N')
									{
										//get default rulevalue, if system rule is not configured or inactive
										thresholdValue = parseInt(utility.getDefaultRuleValueForAsyncSystemRules(systemRule));
									}
									else
									{
										thresholdValue = parseInt(triggerPointForMRscript);
									}
									log.debug('thresholdValue',thresholdValue);

									var isMRScriptInvokeRequired = false;
									var orderOrWaveId =orderInternalId;
									if(pickingType == 'multiOrder'){
										orderOrWaveId= waveId;
									}
									if(pickTasksDetails.length >= thresholdValue)
									{
										isMRScriptInvokeRequired =true;
									}
									var resultsObject = obUtility.getDetailsFromScheduleScriptRecord(orderOrWaveId,warehouseLocationId,pickTaskIdKeysObj,isMRScriptInvokeRequired,selectedOrderIdArr);
									log.debug('resultsObject',resultsObject);
									if(!resultsObject.concurrencyFlag)
									{
										if(isMRScriptInvokeRequired){
											try{

												var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
												var schstatus =  task.create({taskType:task.TaskType.MAP_REDUCE});
												schstatus.scriptId = 'customscript_wms_mr_oub_stageupdate';
												schstatus.deploymentId = null;
												schstatus.params = {
														"custscript_wms_stagebininternalid" : stageBinInternalId,
														"custscript_wms_warehouselocation" : warehouseLocationId,
														"custscript_wms_orderinternalid" : orderInternalId,
														"custscript_wms_pickingtype" : pickingType,
														"custscript_wms_waveid" : waveId,
														"custscript_wms_usecorecartonfields" : populateWMSCartonFields,
														"custscript_wms_isZonePickingEnabled":isZonePickingEnabled ,
														"custscript_wms_selectedOrderIdArr":selectedOrderIdArr.toString()
												};
												var mrTaskId  =schstatus.submit();							
												var taskStatus = task.checkStatus(mrTaskId);								
												if (taskStatus.status == 'FAILED')	{
													if(utility.isValueValid(resultsObject.recordInternalId))
													{
														utility.deleteScheduleScriptRecord(resultsObject.recordInternalId);
													}
												}
												else
												{
													stageBinDetailsArr.isMapReduceInvoke= 'T';
													isStageBinUpdated ='T';
												}
											}catch(exp)
											{
												if(utility.isValueValid(resultsObject.recordInternalId))
												{
													utility.deleteScheduleScriptRecord(resultsObject.recordInternalId);
												}
												stageBinDetailsArr.errorMessage = exp.message;
												log.debug('exception in map reduce invocation in stageing',exp);
											}
										}
										else{
											stageBinDetailsArr.isMapReduceInvoke= 'F';
											stageBinDetailsObj.markOpenPicksDoneAutomaticallySysRule = "N";
											 markOpenPicksDoneAutomaticallySystemRuleValue = utility.getSystemRuleValue('Automatically mark partial picks as Done',
												warehouseLocationId);
											if(utility.isValueValid(markOpenPicksDoneAutomaticallySystemRuleValue)){
												stageBinDetailsObj.markOpenPicksDoneAutomaticallySysRule = markOpenPicksDoneAutomaticallySystemRuleValue;
											}
											isStageBinUpdated =  obUtility.updateStageBin(stageBinDetailsObj);
										}
										if(isStageBinUpdated == 'T'){ 
											stageBinDetailsArr.isValid=true;
											var remainingOrdersDetails = [];
											stageBinDetailsArr.isOrderScanRequired = 'N';

											if(utility.isValueValid(stageByOrderSystemRuleValue) && stageByOrderSystemRuleValue == true && 
													utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true ){
												stageBinDetailsObj.selectedOrderIdArr = [];

												remainingOrdersDetails = obUtility.getPickedOrders(waveName,warehouseLocationId,selectedZones,pickTaskId);
												if(remainingOrdersDetails.length > 0){
													stageBinDetailsArr.isOrderScanRequired = 'Y';
												}
											}
											if(remainingOrdersDetails.length == 0){
												if(!utility.isValueValid(pickingType))	{
													var cartonSystemRule = "Use cartons for single-order picking?"; 
													//isContainerScanRequired = utility.getSystemRuleValue(cartonSystemRule,warehouseLocationId);
													 isContainerScanRequired = utility.getSystemRuleValueWithProcessType(cartonSystemRule,warehouseLocationId,transactionType)
													if(!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N'){
														isContainerScanRequired = 'N';
													}
													else{
														isContainerScanRequired = 'Y';
													}
													stageBinDetailsArr.isContainerScanRequired = isContainerScanRequired;
												}

												stageBinDetailsArr.stageBinName = binName;
												stageBinDetailsArr.stageBinInternalId = stageBinInternalId;

												var pickTaskDetails = {}; 
												pickTaskDetails.orderInternalId=orderInternalId;
												pickTaskDetails.whLocationId=warehouseLocationId;
												pickTaskDetails.pickingType=pickingType;
												pickTaskDetails.waveId=waveId;
												pickTaskDetails.isZonePickingEnabled = isZonePickingEnabled;
												pickTaskDetails.selectedZones = selectedZones;
												var objpickTaskDetails=obUtility.getPickTaskDetailsForValidation(pickTaskDetails);
                                                 log.debug("objpickTaskDetails@@@@@",objpickTaskDetails);
												if(objpickTaskDetails.length > 0){
													if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
														var recLength = 0;
														var pickTasksDtlsLength = objpickTaskDetails.length;
														for(var pickTaskList = 0 ;pickTaskList < pickTasksDtlsLength; pickTaskList++){
															var zone = objpickTaskDetails[pickTaskList].zone;
															if(!utility.isValueValid(zone)){
																zone = "0";
															}else{
																zone = parseInt(zone);
															}
															if(selectedZones.indexOf(zone) != -1){
																var stagingBinId = objpickTaskDetails[pickTaskList].stagingbin;
																if(markOpenPicksDoneAutomaticallySystemRuleValue == "Y" && !utility.isValueValid(stagingBinId))
																{
																	recLength = recLength + 1;
																}
																else {
																	recLength = recLength + 1;
																}
															}
														}
														stageBinDetailsArr.nextPickTaskCount = recLength;
													}
													else{
														if(markOpenPicksDoneAutomaticallySystemRuleValue == "Y"){
															var nxtPickTskLength = 0;
															for(var pickTaskList = 0 ;pickTaskList < objpickTaskDetails.length; pickTaskList++){
																var stagingBinId = objpickTaskDetails[pickTaskList].stagingbin;

																if(!utility.isValueValid(stagingBinId)){
																	nxtPickTskLength = nxtPickTskLength+1;
																}
															}
															stageBinDetailsArr.nextPickTaskCount = nxtPickTskLength;
														}
														else {
															stageBinDetailsArr.nextPickTaskCount = objpickTaskDetails.length;
														}
													}

												}
												else{
													stageBinDetailsArr.nextPickTaskCount = 0;
												}
											}

										}
										else{
											if(isStageBinUpdated == 'N'){
												log.debug({title:'isStageBinUpdated new',details:isStageBinUpdated});	
												stageBinDetailsArr.isValid=false;	 
												stageBinDetailsArr.errorMessage = translator.getTranslationString("MULTIORDER_STAGEBIN.INVALIDINPUT");
											}
											else{
												stageBinDetailsArr.isValid=false;	 
											}
										}
									}
									else
									{
										stageBinDetailsArr.isValid=false;	 
										stageBinDetailsArr.errorMessage = translator.getTranslationString("BULKSTAGING.ASYN_PROCESS_RESTRICTION");
									}

									if(transactionType == 'TrnfrOrd'){
										if(pickingType == 'multiOrder')	{								
											stageBinDetailsArr.impactedRecords = obUtility.noCodeSolForPicking('', waveId,'' ,duplicate_orderInternalIdArr,'','',pickingType);
										}
										else{									
											stageBinDetailsArr.impactedRecords = obUtility.noCodeSolForPicking('', waveId,'' ,orderInternalId,'','',pickingType);
										}
									}
									else{
										if(pickingType == 'multiOrder')	{
											stageBinDetailsArr.impactedRecords = obUtility.noCodeSolForPicking('', waveId,duplicate_orderInternalIdArr ,'','','',pickingType);
										}
										else{
											stageBinDetailsArr.impactedRecords = obUtility.noCodeSolForPicking('', waveId,orderInternalId ,'','','',pickingType);
										}
									}
									log.debug('impactedRecords in response',stageBinDetailsArr.impactedRecords);

								}
								else
								{
									stageBinDetailsArr.errorMessage = translator.getTranslationString("STAGEBINVALIDATE.NOPICKTASKREADYTOSTAGE");
									stageBinDetailsArr.isValid=false;
								}
							}
						}
						else
						{
							stageBinDetailsArr.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDSTAGEBIN");
							stageBinDetailsArr.isValid=false;
						}

					}
					else
					{
						stageBinDetailsArr.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDSTAGEBIN");
						stageBinDetailsArr.isValid=false;	
					}
				}
				else
				{
					stageBinDetailsArr.isValid=false;	
				}
				log.debug({title:'stageBinDetailsArr',details:stageBinDetailsArr});
			}
			catch(e)
			{
				stageBinDetailsArr.isValid = false;
				stageBinDetailsArr.errorMessage = e.message;
				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
				log.error({title:'debugString',details:debugString});
			}

			return stageBinDetailsArr;
		}
		function validateScannedStage(pickingType,orderInternalId,whLocation){

			var pickTaskSearch = query.create({type: query.Type.PICK_TASK});
			var pickActionsFieldsJoin = pickTaskSearch.autoJoin({
				fieldId: 'pickactions'
			});


			var locCond = pickTaskSearch.createCondition({
				fieldId: 'location',
				operator: query.Operator.ANY_OF,
				values: whLocation
			});
			var	waveOrOrderCond = pickActionsFieldsJoin.createCondition({
					fieldId: 'ordernumber',
					operator: query.Operator.ANY_OF,
					values: orderInternalId
				});
			var pickActionStatusCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'status',
				operator: query.Operator.ANY_OF,
				values: ['STAGED','DONE']				
			});
			pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond,waveOrOrderCond,locCond);

			pickTaskSearch.columns = [pickActionsFieldsJoin.createColumn({fieldId: 'stagingbin'})];

			var results = pickTaskSearch.runPaged({
				pageSize: 1000
			});
			var page = '';
			var stageIdArr = [];
			var pageResults = [];
			// Retrieve the query results using an iterator
			var iterator = results.iterator();
			iterator.each(function(result) {
				page = result.value;
				pageResults.push(page.data.results);
				return true;
			});
			if(pageResults.length > 0){
				for(var pageResult in pageResults){
					if(pageResults[pageResult]){
						var pageResultArr = pageResults[pageResult];
						for(var result in pageResultArr){
							if(pageResultArr[result] && stageIdArr.indexOf(pageResultArr[result].values[0]) == -1){
								if(pageResultArr[result].values[0] !=null && pageResultArr[result].values[0] !='') {
								stageIdArr.push(pageResultArr[result].values[0]);
								}
							}
						}
					}
				}

			}
			return stageIdArr;
		}
		return {
			'post': doPost
		};
	});
