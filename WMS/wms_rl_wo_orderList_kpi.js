/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_translator', './big', './wms_workOrderUtility_kpi', 'N/query'],

	function (utility, translator, Big, woUtility, query) {

		function doPost(requestBody) {

			var orderListDetails = {};
			var debugString = '';
			var requestParams = '';
			var pickqty = 0;
			try {
				if (utility.isValueValid(requestBody)) {
					log.debug({
						title: 'requestBody',
						details: requestBody
					});
					requestParams = requestBody.params;
					var whLocation = requestParams.warehouseLocationId;
					var internalIdArr = [];
					var objpickQty = {};
					var itemDtlArr = [];
					var openTaskOrderId = '';
					var objStageQty = {};
					var checkStageFlag = 'F';
					var backOrderedInternalIdArr = [];
					var locUseBinsFlag = requestParams.locUseBinsFlag;
					if (utility.isValueValid(whLocation)) {
						if (!utility.isValueValid(locUseBinsFlag)) {
							locUseBinsFlag = utility.lookupOnLocationForUseBins(whLocation);
						}
						var systemRule = "Pick only fully committed work orders";
						var systemRuleForFullyCommittedWO = utility.getSystemRuleValue(systemRule, whLocation);
						var workOrdListResults = woUtility.getWOList(whLocation, '', locUseBinsFlag);
						var objWorkOrdrResult = workOrdListResults;
						if (workOrdListResults.length > 0) {
							if (systemRuleForFullyCommittedWO == 'Y') {
								backOrderedInternalIdArr = woUtility.getBackOrderedWOlist(whLocation);
							}
							for (var orderListIndex = 0; orderListIndex < workOrdListResults.length; orderListIndex++) {
								var woOrderInternalId = workOrdListResults[orderListIndex]['internalid'];
								if (systemRuleForFullyCommittedWO == 'Y' && backOrderedInternalIdArr.length > 0) {
									if (backOrderedInternalIdArr.indexOf(woOrderInternalId) == -1) {
										internalIdArr.push(woOrderInternalId);
									}
								} else {
									internalIdArr.push(woOrderInternalId);
								}
							}
							if (internalIdArr.length > 0) {
								var woDetailsList = woUtility.getWODetails(internalIdArr);

								var pickQtyResults = getWolistquery(internalIdArr);


								for (var openTaskIndex = 0; openTaskIndex < pickQtyResults.length; openTaskIndex++) {
									var orderInternalId = pickQtyResults[openTaskIndex]['internalid'];
									objpickQty[orderInternalId] = pickQtyResults[openTaskIndex]['custrecord_wmsse_act_qty'];
								}
								if (locUseBinsFlag != false) {
									var getOpenTaskStageDtl = getWostagedetails(internalIdArr);
									log.debug('getOpenTaskStageDtl', getOpenTaskStageDtl);

									for (var stageTaskIndex = 0; stageTaskIndex < getOpenTaskStageDtl.length; stageTaskIndex++) {
										openTaskOrderId = getOpenTaskStageDtl[stageTaskIndex]['custrecord_wmsse_order_no'];
										if (!(utility.isValueValid(objStageQty[openTaskOrderId])))
											objStageQty[openTaskOrderId] = 1;
									}
								}

								for (var s = 0; s < workOrdListResults.length;) {
									checkStageFlag = 'F';
									itemDtlArr = [];
									var woInternalId = workOrdListResults[s]['internalid'];
									var woId = workOrdListResults[s]['tranid'];

									var vwoitemQty = workOrdListResults[s]['Committed Quantity'];
									var vwoitemRcvQty = workOrdListResults[s]['Built Quantity'];
									if (vwoitemQty == null || vwoitemQty == '')
										vwoitemQty = 0;
									if (vwoitemRcvQty == null || vwoitemRcvQty == '')
										vwoitemRcvQty = 0;
									if (systemRuleForFullyCommittedWO == 'Y' && backOrderedInternalIdArr.length > 0 &&
										(backOrderedInternalIdArr.indexOf(woInternalId) != -1)) {
										checkStageFlag = 'F';
									} else if (utility.isValueValid(objStageQty[woInternalId]))
										checkStageFlag = 'T';
									else {
										vwoitemQty = new Big(vwoitemQty);
										vwoitemRcvQty = new Big(vwoitemRcvQty);

										if (utility.isValueValid(objpickQty[woInternalId]))
											pickqty = objpickQty[woInternalId];
										else
											pickqty = 0;

										pickqty = new Big(pickqty);
										var vWoreminqty = ((vwoitemQty).plus(vwoitemRcvQty)).minus(pickqty);

										if (vWoreminqty > 0) {
											checkStageFlag = 'T';
										}
									}

									if (checkStageFlag == 'T') {
										for (var k = 0; k < woDetailsList.length; k++) {

											if (workOrdListResults[s]['internalid'] == woDetailsList[k]['internalid']) {

												var obj = woDetailsList[k];

												for (var i in obj) {
													objWorkOrdrResult[s][i] = obj[i];
												}
												objWorkOrdrResult[s]['builtItems'] = objWorkOrdrResult[s]['quantityshiprecv'] + '/' + objWorkOrdrResult[s]['quantity'];
											}

										}
										s++;
									} else {
										objWorkOrdrResult.splice(s, 1);
									}

								}

								if (objWorkOrdrResult.length > 0) {
									orderListDetails['orderList'] = objWorkOrdrResult;
									orderListDetails['isValid'] = true;
								} else {
									orderListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.NOORDERSTOSHOW');
									orderListDetails['isValid'] = false;
								}
							} else {
								orderListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.NOORDERSTOSHOW');
								orderListDetails['isValid'] = false;
							}
						} else {
							orderListDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.NOORDERSTOSHOW');
							orderListDetails['isValid'] = false;
						}
					} else {
						orderListDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						orderListDetails['isValid'] = false;
					}
				} else {
					orderListDetails['isValid'] = false;
				}

			} catch (e) {
				orderListDetails['isValid'] = false;
				orderListDetails['errorMessage'] = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}
			log.debug('orderListDetails--', orderListDetails);

			return orderListDetails;
		}


		function getWostagedetails(internalIdArr) {

			const myTransactionQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});


			var cond1 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});

			var cond2 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var cond3 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_nstrn_ref_no',
				operator: query.Operator.EMPTY

			});

			var cond4 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_actendloc',
				operator: query.Operator.EMPTY_NOT

			});

			var cond5 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: internalIdArr
			});



			myTransactionQuery.condition = myTransactionQuery.and(
				cond1, cond2, cond3, cond4, cond5);

			myTransactionQuery.columns = [
				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_order_no'

				})

			];


			var wostageDetailsArr = [];

			var myPagedData = myTransactionQuery.runPaged({
				pageSize: 1000
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, wostageDetailsArr, columnsObj);
					}
				}
			});



			return wostageDetailsArr;
		}


		function getWolistquery(internalIdArr) {

			const myTransactionQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});

			const myTransactionQueryline = myTransactionQuery.join({
				fieldId: 'custrecord_wmsse_order_no^transaction'

			});
			const myTransactionQuerylinemain = myTransactionQuery.join({
				fieldId: 'custrecord_wmsse_order_no^transaction.transactionlines'

			});

			var cond1 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});

			var cond2 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var cond3 = myTransactionQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});

			var cond4 = myTransactionQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: internalIdArr
			});

			var cond5 = myTransactionQuerylinemain.createCondition({
				fieldId: 'mainline',
				operator: query.Operator.IS,
				values: true
			});


			myTransactionQuery.condition = myTransactionQuery.and(
				cond1, cond2, cond3, cond4, cond5);

			myTransactionQuery.columns = [
				myTransactionQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty',
					aggregate: query.Aggregate.SUM
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'id',
					groupBy: true
				})


			];


			var woListDetailsArr = [];

			var myPagedData = myTransactionQuery.runPaged({
				pageSize: 1000
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, woListDetailsArr, columnsObj);
					}
				}
			});



			return woListDetailsArr;
		}

		function convertToJsonObj(result, woListDetailsArr, columnsObj) {

			var columns = columnsObj;
			var values = result.values;

			var woListObj = {};
			for (var col in columns) {

				var colName = columns[col]['fieldId'];
				/*if(colName == 'linesequencenumber')
				{
					colName ='line'
				}
				if(colName == 'trandate')
				{
					colName ='datecreated'
				}*/
				if (colName == 'id') {
					colName = 'internalid';
				}
				woListObj[colName] = values[col];

			}
			woListDetailsArr.push(woListObj);
			//return resultArr;
		}


		return {
			'post': doPost
		};
	});