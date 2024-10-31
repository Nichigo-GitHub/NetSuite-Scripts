/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', './big', './wms_workOrderUtility_kpvn'],

	function (search, utility, translator, Big, woUtility) {

		function doPost(requestBody) {

			var orderDetails = {};
			var debugString = '';
			var requestParams = '';
			var workOrderList = [];
			var workOrderDtl = {};
			try {
				if (utility.isValueValid(requestBody)) {

					log.debug({
						title: 'requestBody',
						details: requestBody
					});
					var requestParams = requestBody.params;
					var whLocation = requestParams.warehouseLocationId;
					var transactionName = requestParams.transactionName;
					if (utility.isValueValid(whLocation)) {
						if (utility.isValueValid(transactionName)) {
							var workOrdDtlResults = woUtility.fnToValidateWO(transactionName);

							if (workOrdDtlResults.length > 0) {
								var backOrderFlag = true;
								var backorderItmsCount = 0;
								var woLocation = workOrdDtlResults[0]['location'];
								var checkFlag = 'F';
								if (!(utility.isValueValid(woLocation))) {
									checkFlag = 'T';
									orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_NOTMAPPED');
									orderDetails['isValid'] = false;

								} else if (woLocation != null && woLocation != '' && (woLocation != whLocation)) {
									checkFlag = 'T';
									orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDERMAPPED_LOCATION');
									orderDetails['isValid'] = false;
								} else {
									var backOrderedInternalIdArr = [];
									var systemRule = "Pick only fully committed work orders";
									var systemRuleForFullyCommittedWO = utility.getSystemRuleValue(systemRule, woLocation);
									if (systemRuleForFullyCommittedWO == 'Y') {
										var workOrderInternalId = workOrdDtlResults[0]['internalid'];
										backOrderedInternalIdArr = woUtility.getBackOrderedWOlist(whLocation, workOrderInternalId);
									}

									if (systemRuleForFullyCommittedWO == 'Y' && backOrderedInternalIdArr.length > 0) {
										backOrderFlag = true;
										backorderItmsCount = workOrdDtlResults.length;
									} else {
										for (var t = 0; t < workOrdDtlResults.length; t++) {

											var vcommittedordqty = workOrdDtlResults[t]['Committed Qty'];
											if (!(utility.isValueValid(vcommittedordqty)))
												vcommittedordqty = 0;
											if (parseFloat(vcommittedordqty) <= 0) {
												backOrderFlag = true;
												backorderItmsCount = parseInt(backorderItmsCount) + 1;
											}
										}
									}
									if (backOrderFlag == true) {
										if (parseInt(backorderItmsCount) == (parseInt(workOrdDtlResults.length))) {
											checkFlag = 'T';
											orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.BACKORDER_ITEMS');
											orderDetails['isValid'] = false;
										}
									}
								}
								if (checkFlag == 'F') {

									var woInternalid = workOrdDtlResults[0]['internalid'];
									var isValid = false;
									var vtotalItemQty = 0;
									var vtotalItemRcvQty = 0;
									var pickqty = 0;
									var lines = 0;
									var checkStageFlag = 'F';
									var workorderOverpickingFlag = woUtility.woOverpickingFlag(woInternalid, whLocation);
									var woDetailsList = woUtility.getWODetails(woInternalid);
									log.debug({
										title: 'woDetailsList',
										details: woDetailsList
									});
									var assemblyitemQty = woDetailsList[0]['quantity'];
									var built = woDetailsList[0]['quantityshiprecv'];
									for (var s = 0; s < workOrdDtlResults.length; s++) {
										var vwoitemQty = workOrdDtlResults[s]['Committed Qty'];
										var vwoitemRcvQty = workOrdDtlResults[s]['quantityshiprecv'];
										var qty = workOrdDtlResults[s]['quantity'];
										var qtyuom = workOrdDtlResults[s]['quantityuom'];
										var line = workOrdDtlResults[s]['line'];

										if (vwoitemRcvQty == null || vwoitemRcvQty == '' || vwoitemRcvQty == undefined || isNaN(vwoitemRcvQty))
											vwoitemRcvQty = 0;
										if (utility.isValueValid(vwoitemQty)) {
											lines++;
											vwoitemQty = parseFloat(vwoitemQty) / (parseFloat(qty) / parseFloat(qtyuom));
											vwoitemRcvQty = parseFloat(vwoitemRcvQty) / (parseFloat(qty) / parseFloat(qtyuom));


											if (vwoitemQty == null || vwoitemQty == '' || vwoitemQty == undefined || isNaN(vwoitemQty))
												vwoitemQty = 0;
											vwoitemQty = new Big(vwoitemQty);

											vtotalItemQty = Number(Big(vtotalItemQty).plus(vwoitemQty));
											vtotalItemRcvQty = parseFloat(vtotalItemRcvQty) + parseFloat(vwoitemRcvQty);
										}
									}

									var getOpenTaskStageDtl = woUtility.getWOStageflag(woInternalid);

									if (getOpenTaskStageDtl.length > 0) {
										checkStageFlag = 'T';
									} else {
										var pickQtyResults = woUtility.getWOpickQty(woInternalid);
										log.debug({
											title: 'pickQtyResults',
											details: pickQtyResults
										});


										if (pickQtyResults.length > 0)
											pickqty = pickQtyResults[0]['custrecord_wmsse_act_qty'];


										if (pickqty == '' || pickqty == null || pickqty == 'null' || pickqty == undefined || isNaN(pickqty))
											pickqty = 0;
										log.debug({
											title: 'pickqty',
											details: pickqty
										});
										log.debug({
											title: 'vtotalItemRcvQty',
											details: vtotalItemRcvQty
										});
										//vtotalItemRcvQty=new Big(vtotalItemRcvQty);
										pickqty = new Big(pickqty);
										if (vtotalItemQty == '' || vtotalItemQty == null || vtotalItemQty == undefined || isNaN(vtotalItemQty))
											vtotalItemQty = 0;

										if (vtotalItemRcvQty == '' || vtotalItemRcvQty == null || vtotalItemRcvQty == undefined || isNaN(vtotalItemRcvQty))
											vtotalItemRcvQty = 0;
										vtotalItemRcvQty = new Big(vtotalItemRcvQty);
										var vWoreminqty = Number((Big(vtotalItemQty).plus(vtotalItemRcvQty)).minus(pickqty));

										if (vWoreminqty > 0 || ((vWoreminqty < 0) && (workorderOverpickingFlag))) {
											if (workorderOverpickingFlag) {
												var stagedOpenTaskCount = woUtility.getStagedOpenTaskCount(woInternalid);
												if (stagedOpenTaskCount > 0 && (parseInt(stagedOpenTaskCount) == parseInt(workOrdDtlResults.length - 1))) {
													checkStageFlag = 'F';
												} else {
													checkStageFlag = 'T';
												}
											} else {
												checkStageFlag = 'T';
											}
										}
										log.debug({
											title: 'checkStageFlag',
											details: checkStageFlag
										});
									}


									if (checkStageFlag == 'T') {
										orderDetails['workorderOverpickingFlag'] = workorderOverpickingFlag;
										orderDetails['info_transactionName'] = transactionName;
										orderDetails['info_lines'] = lines;
										orderDetails['info_workOrderItemName'] = woDetailsList[0]['itemText'];
										orderDetails['workOrderItemInternalId'] = woDetailsList[0]['item'];
										var columnArray = [];
										columnArray.push('itemid');
										var itemLookUp = utility.getItemFieldsByLookup(woDetailsList[0]['item'], columnArray);

										if (itemLookUp.thumbnailurl != undefined) {
											orderDetails["info_workOrderImageUrl"] = itemLookUp.thumbnailurl;
										}

										orderDetails['transactionType'] = workOrdDtlResults[0]['type'];;
										orderDetails['transactionInternalId'] = woInternalid;
										orderDetails['transactionName'] = transactionName;
										orderDetails['itemName'] = woDetailsList[0]['itemText'];
										orderDetails['actualBeginTime'] = utility.getCurrentTimeStamp();
										orderDetails['built'] = built;
										orderDetails['buildable'] = Number(Big(assemblyitemQty).minus(built));
										orderDetails['lines'] = lines;
										orderDetails['isValid'] = true;
										orderDetails['gotostage'] = 'N';
									} else {
										orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.ORDER_STAGED');
										orderDetails['isValid'] = false;
									}

								}
							} else {
								orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
								orderDetails['isValid'] = false;
							}
						} else {
							orderDetails['errorMessage'] = translator.getTranslationString('WORKORDER_PICKING.INVALID_ORDER');
							orderDetails['isValid'] = false;
						}

					} else {
						orderDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSEVALIDATION.INVALID_INPUT');
						orderDetails['isValid'] = false;
					}
				} else {
					orderDetails['isValid'] = false;
				}

			} catch (e) {
				orderDetails['isValid'] = false;
				orderDetails['errorMessage'] = e.message;
				log.error({
					title: 'errorMessage',
					details: e.message + " Stack :" + e.stack
				});
				log.error({
					title: 'debugString',
					details: debugString
				});
			}
			log.debug('orderDetails--', orderDetails);

			return orderDetails;
		}


		return {
			'post': doPost
		}
	});