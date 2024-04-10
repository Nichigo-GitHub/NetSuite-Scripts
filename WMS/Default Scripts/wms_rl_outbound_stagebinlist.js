/**
 * Copyright  2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', 'N/record', './wms_outBoundUtility', 'N/query'],
	function (search, utility, translator, record, obUtility, query) {
		/**
		 * Function called upon sending a POST request to the RESTlet.
		 */
		function doPost(requestBody) {
			var whLocation = '';
			var stageInventoryDetails = {};
			var requestParams = '';
			var processType = '';
			var waveName = '';
			var orderInternalId = '';
			var pickingType = '';
			var bulkPickingType = '';
			var itemType = '';
			try {
				if (utility.isValueValid(requestBody)) {
					requestParams = requestBody.params;
					whLocation = requestParams.warehouseLocationId;
					processType = requestParams.processType;
					waveName = requestParams.waveName;
					orderInternalId = requestParams.orderInternalId;
					alreadyPickedOrders = requestParams.alreadyPickedOrders;
					pickingType = requestParams.pickingType;
					bulkPickingType = requestParams.bulkPickingType;
					itemType = requestParams.itemType;
					var isZonePickingEnabled = requestParams.isZonePickingEnabled;
					var isEnforceStageFlagEnabled = requestParams.isEnforceStageFlagEnabled;
					var pickTaskId = requestParams.pickTaskId;
					var workorderOverpickingFlag = requestParams.workorderOverpickingFlag;

					if (!utility.isValueValid(isZonePickingEnabled)) {
						isZonePickingEnabled = false;
					}
					if (!utility.isValueValid(isEnforceStageFlagEnabled)) {
						isEnforceStageFlagEnabled = false;
					}
					if (!utility.isValueValid(workorderOverpickingFlag)) {
						workorderOverpickingFlag = false;
					}

					log.debug({ title: 'requestParams', details: requestParams });

					if (utility.isValueValid(whLocation)) {
						var binRecords = [];
						var stageBinsObj = {};
						var stageInvDtlObj = {};
						var stageInvDtlArr = [];
						var binLocIdArr = [];
						var getStageBinResults = obUtility.getOutboundStageBinDetails(whLocation, processType, workorderOverpickingFlag);
						if (getStageBinResults.length > 0) {

							var alreadyStagedBinIdArr = [];
							if (processType != 'workOrder') {

								stageInventoryDetails.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged(pickingType, waveName, '', whLocation);
								log.debug('stageInventoryDetails boolAnyItemIsAlreadyStaged', stageInventoryDetails.boolAnyItemIsAlreadyStaged);
								if (stageInventoryDetails.boolAnyItemIsAlreadyStaged == 'Y') {
									//orderInternalId = alreadyPickedOrders;
									stageInventoryDetails.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
								} else {
									stageInventoryDetails.starDescription = '';
								}

								log.debug({ title: 'alreadyPickedOrders', details: alreadyPickedOrders });
								if (utility.isValueValid(alreadyPickedOrders) && !utility.isValueValid(orderInternalId)) {

									alreadyStagedBinIdArr = getExistingStgSearchPerOrder(pickingType, waveName, alreadyPickedOrders, whLocation, isZonePickingEnabled);
								}
								else {
									alreadyStagedBinIdArr = getExistingStgSearchPerOrder(pickingType, waveName, orderInternalId, whLocation, isZonePickingEnabled);
								}

								log.debug({ title: 'alreadyStagedBinIdArr', details: alreadyStagedBinIdArr });

								if (alreadyStagedBinIdArr.length > 0) {
									var stageName = "";
									for (var binItr in alreadyStagedBinIdArr) {
										if (alreadyStagedBinIdArr[binItr]) {
											var outStageBinId = alreadyStagedBinIdArr[binItr];
											if (utility.isValueValid(outStageBinId) && binLocIdArr.indexOf(outStageBinId) == -1) {
												binLocIdArr.push(outStageBinId);
											}
											stageBinsObj = {};
											stageName = "";
											for (var bin in getStageBinResults) {
												if (getStageBinResults[bin]) {
													var stageBinId = getStageBinResults[bin].id;
													if (stageBinId == outStageBinId) {
														stageName = getStageBinResults[bin].binnumber;
														break;
													}
												}
											}

											if (stageName != "") {
												stageBinsObj = {};
												stageBinsObj.binnumberText = stageName;
												var tStageName = stageName;
												//if(isZonePickingEnabled == true){
												stageName = "* " + stageName;
												//}
												stageBinsObj.binName = stageName;
												stageBinsObj.quantityonhand = 0;
												stageInvDtlObj[tStageName] = stageBinsObj;
											}
										}
									}
								}
							}


							if ((isZonePickingEnabled == false) ||
								(isZonePickingEnabled == true && (isEnforceStageFlagEnabled == false || alreadyStagedBinIdArr.length == 0))) {
								for (var bin in getStageBinResults) {
									if (getStageBinResults[bin]) {
										var stageBinId = parseInt(getStageBinResults[bin].id);
										if (utility.isValueValid(stageBinId) && binLocIdArr.indexOf(stageBinId) == -1) {
											binLocIdArr.push(stageBinId);
											if (alreadyStagedBinIdArr.indexOf(stageBinId) == -1) {
												stageBinsObj = {};
												stageBinsObj.binName = getStageBinResults[bin].binnumber;
												stageBinsObj.binnumberText = getStageBinResults[bin].binnumber;
												stageBinsObj.quantityonhand = 0;
												stageInvDtlObj[getStageBinResults[bin].binnumber] = stageBinsObj;
											}
										}
									}
								}
							}

							binRecords = utility.getInventoryFromBins(binLocIdArr, whLocation);
							log.debug({ title: 'binRecords', details: binRecords });

							var binRecordsLength = binRecords.length;

							if (binRecordsLength > 0) {
								for (var binRec = 0; binRec < binRecordsLength; binRec++) {
									if (stageInvDtlObj[binRecords[binRec].getText({ name: 'binnumber', join: 'binOnHand', summary: 'group' })] != undefined) {
										stageInvDtlObj[binRecords[binRec].getText({ name: 'binnumber', join: 'binOnHand', summary: 'group' })].quantityonhand = binRecords[binRec].getValue({ name: 'quantityonhand', join: 'binOnHand', summary: 'sum' });
									}
								}
							}
							log.debug({ title: 'stageInvDtlObj', details: stageInvDtlObj });


							for (var row in stageInvDtlObj) {
								if (stageInvDtlObj[row]) {
									stageInvDtlArr.push(stageInvDtlObj[row]);
								}
							}

							stageInventoryDetails.stageinventorydetails = stageInvDtlArr;
							stageInventoryDetails.isValid = true;
						}
						else {
							stageInventoryDetails.isValid = true;
						}

					}
					else {
						stageInventoryDetails.errorMessage = translator.getTranslationString('PICKING_STAGELIST.INVALIDINPUT');
						stageInventoryDetails.isValid = false;
					}
				}
				else {
					stageInventoryDetails.errorMessage = translator.getTranslationString('PICKING_STAGELIST.EMPTYPARAM');
					stageInventoryDetails.isValid = false;
				}

				var systemRule = "Use cartons for multi-order picking?";
				//var isContainerScanRequired = utility.getSystemRuleValue(systemRule,whLocation);
				var isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule, whLocation, processType);//CHECK WHAT IS THERE IN processType
				if (!utility.isValueValid(isContainerScanRequired) || isContainerScanRequired == 'N' ||
					(bulkPickingType == 'BULK' && (itemType != "serializedinventoryitem" && itemType != "serializedassemblyitem"))) {
					stageInventoryDetails.stageCompleteScreenLabel = translator.getTranslationString('MULTIORDERPICKING.STAGECOMPLETEORDERS');
				}
				else {

					stageInventoryDetails.stageCompleteScreenLabel = translator.getTranslationString('MULTIORDERPICKING.STAGECOMPLETECARTONS');
				}

			}
			catch (e) {
				stageInventoryDetails.isValid = false;
				stageInventoryDetails.errorMessage = e.message;
				log.error({ title: 'errorMessage', details: e.message + " Stack :" + e.stack });
			}
			return stageInventoryDetails;
		}

		function getExistingStgSearchPerOrder(pickingType, waveName, orderInternalId, whLocation, isZonePickingEnabled) {

			var pickTaskSearch = query.create({ type: query.Type.PICK_TASK });
			var pickActionsFieldsJoin = pickTaskSearch.autoJoin({
				fieldId: 'pickactions'
			});
			var locCond = pickTaskSearch.createCondition({
				fieldId: 'location',
				operator: query.Operator.ANY_OF,
				values: whLocation
			});
			var waveOrOrderCond = '';
			log.debug('pickingType', pickingType);
			var pickActionStatusCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'status',
				operator: query.Operator.ANY_OF,
				values: ['STAGED', 'DONE']
			});
			pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond, locCond);
			if (utility.isValueValid(orderInternalId)) {
				waveOrOrderCond = pickActionsFieldsJoin.createCondition({
					fieldId: 'ordernumber',
					operator: query.Operator.ANY_OF,
					values: orderInternalId
				});
				pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond, waveOrOrderCond, locCond);
			}



			if (isZonePickingEnabled != true) {// the below condition is if zonePicking is not enabled then we have to show the same stage if it is partially staged

				var pickActionsQuantityStagedCond = pickActionsFieldsJoin.createCondition({
					fieldId: 'inventorydetail.quantitystaged',
					operator: query.Operator.EQUAL,
					values: 0
				});
				if (utility.isValueValid(orderInternalId)) {
					pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond, waveOrOrderCond, locCond, pickActionsQuantityStagedCond);
				}
				else {
					pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond, locCond, pickActionsQuantityStagedCond);
				}

			}

			pickTaskSearch.columns = [pickActionsFieldsJoin.createColumn({ fieldId: 'stagingbin' })];

			var results = pickTaskSearch.runPaged({
				pageSize: 1000
			});
			var page = '';
			var stageIdArr = [];
			var pageResults = [];
			// Retrieve the query results using an iterator
			var iterator = results.iterator();
			iterator.each(function (result) {
				page = result.value;
				pageResults.push(page.data.results);
				return true;
			});
			if (pageResults.length > 0) {
				for (var pageResult in pageResults) {
					if (pageResults[pageResult]) {
						var pageResultArr = pageResults[pageResult];
						for (var result in pageResultArr) {
							if (pageResultArr[result] && stageIdArr.indexOf(pageResultArr[result].values[0]) == -1) {
								if (pageResultArr[result].values[0] != null && pageResultArr[result].values[0] != '') {
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