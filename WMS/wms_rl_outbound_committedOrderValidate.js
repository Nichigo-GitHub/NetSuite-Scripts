/**
 *    Copyright ï¿½ 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','N/search','N/query','./wms_translator','./wms_outBoundUtility'],

	function(utility,search,query,translator,obUtility) {

		/**
		 * Function to validate order
		 */
		function doPost(requestBody) {

			var orderValidateObj = {};
			var debugString = '';
			var requestParams = '';

			try{
				requestParams = requestBody.params;
				if(utility.isValueValid(requestParams))
				{
					debugString = debugString + "requestParams :"+requestParams;
					log.debug({title:'requestParams',details:requestParams});

					var warehouseLocationId = requestParams.warehouseLocationId;
					var orderName = requestParams.transactionName;
					var transactionType = requestParams.transactionType;
					//var waveStatusAction = requestParams.waveStatusAction;
					var selectedWaveStatus = requestParams.selectedWaveStatus;
					var selectedWaveStatusValue = requestParams.selectedWaveStatusValue;

					var createdWaveStatus = requestParams.createdWaveStatus;
					var checkaction = requestParams.checkaction;
					//var checkOKaction = requestParams.checkOKaction;

					if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(orderName)) {

						var orderDetails = [];
						var orderDetailInputObj = {};

						orderDetailInputObj.orderName = orderName;
						orderDetailInputObj.whLocationId = warehouseLocationId;
						orderDetailInputObj.transactionType = transactionType;

						var backOrderedLinesCheck = false;
						if(utility.isValueValid(requestParams.backOrderedLinesCheck)) {
							backOrderedLinesCheck = requestParams.backOrderedLinesCheck;
						}

						var waveStatusActionCheck = false;
						if(utility.isValueValid(requestParams.waveStatusActionCheck)) {
							waveStatusActionCheck = requestParams.waveStatusActionCheck;
						}

						if(backOrderedLinesCheck) {
							var backOrderedResults = getBackOrderedDetails(orderName, transactionType);
							orderValidateObj.backOrderedLines = false;
							if(backOrderedResults > 0) {
								orderValidateObj.backOrderedLines = true;
							}
						}

						log.debug({title: 'orderDetails', details: orderDetails});

						var systemRule = "Provide wave status selection for unreleased orders";
						var wavePendingReleaseSystemRuleValue = utility.getSystemRuleValue(systemRule, warehouseLocationId);
						var systemRuleValue = false;
						if (utility.isValueValid(wavePendingReleaseSystemRuleValue) && wavePendingReleaseSystemRuleValue == "Y") {
							systemRuleValue = true;
						}
						orderValidateObj.wavePendingReleaseSystemRuleValue = systemRuleValue;
						orderValidateObj.transactionName = orderName;
						orderValidateObj.transactionType = transactionType;


						orderDetails = obUtility.getCommittedOrderList(orderDetailInputObj);

						if (!backOrderedLinesCheck && !waveStatusActionCheck ) { // for clonned customers who doesn't have waveStatusAction will continue to work as per existing with systemRule == false
							log.debug('orderDetails.length', orderDetails.length);
							if (orderDetails.length > 0) {

								var waveCreateInptObj = {};
								waveCreateInptObj.location = warehouseLocationId;
								waveCreateInptObj.picktype = 'SINGLE';
								waveCreateInptObj.wavetype = transactionType;
								var waveObj = obUtility.createWave(waveCreateInptObj, orderDetails, selectedWaveStatus, selectedWaveStatusValue);
								var waveDetails = search.lookupFields({
									type: search.Type.WAVE,
									id: waveObj.waveid,
									columns: ['tranid']
								});
								var waveName = waveDetails.tranid;

								orderValidateObj.transactionInternalId = orderDetails[0]['internalid'];
								orderValidateObj.customer = orderDetails[0]['customerText'];
								orderValidateObj.transactionName = orderName;
								orderValidateObj.waveid = waveObj.waveid;
								orderValidateObj.waveName = waveName;
								orderValidateObj.createdWaveStatus = waveObj.createdWaveStatus;

								var orderLinecount = obUtility.getTransactionOrderlineCount(orderValidateObj.transactionInternalId, warehouseLocationId, transactionType);
								log.debug({title: 'orderLinecount', details: orderLinecount});

								if (orderLinecount.length > 0) {
									if (transactionType == 'TrnfrOrd') {
										orderValidateObj.Task = orderLinecount[0]['transferorderitemline'];
									} else {
										orderValidateObj.Task = orderLinecount[0]['line'];
									}
								}
								orderValidateObj.isValid = true;
								orderValidateObj.gotostage = 'N';
								orderValidateObj.transactionType = transactionType;
							} else {
								if (transactionType == 'SalesOrd') {
									orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_SALESORDER");
								} else {
									orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_TRANSFERORDER");
								}
								orderValidateObj.isValid = false;
							}
						}

						log.debug('orderValidateObj.waveid',orderValidateObj.waveid);
						log.debug('createdWaveStatus',createdWaveStatus);
						log.debug('checkaction',checkaction);


						if (systemRuleValue == true && (!utility.isValueValid(orderValidateObj.waveid)) && (orderDetails.length == 0))
						{
							log.debug('check throwing in if','if');
							if(transactionType == 'SalesOrd'){
								orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_SALESORDER");
							}
							else{
								orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_TRANSFERORDER");
							}
							orderValidateObj.isValid =false;
						}
						else if(systemRuleValue == false && (utility.isValueValid(orderValidateObj.waveid)) && orderDetails.length == 0)
						{
							log.debug('check throwing in else  if','else if');
							if(transactionType == 'SalesOrd'){
								orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_SALESORDER");
							}
							else{
								orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_TRANSFERORDER");
							}
							orderValidateObj.isValid =false;
						}

					}
					else
					{
						if(utility.isValueValid(requestParams.pendingRelaesedWave) && requestParams.pendingRelaesedWave)
						{
							orderValidateObj.isValid=true;
						}
						else
						{
							log.debug('check throwing in else','else');
							if(transactionType == 'SalesOrd'){
								orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_SALESORDER");
							}
							else{
								orderValidateObj.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALID_TRANSFERORDER");
							}
							orderValidateObj.isValid=false;
						}


					}
				}
				else
				{
					orderValidateObj.isValid=false;
				}
				log.debug({title:'orderValidateObj',details:orderValidateObj});
			}
			catch(e)
			{
				orderValidateObj.isValid = false;
				orderValidateObj.errorMessage = e.message;
				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
				log.error({title:'debugString',details:debugString});
			}

			return orderValidateObj;
		}

		function getBackOrderedDetails(orderName, transactionType) {
			var transactionQuery = query.create({
				type:query.Type.TRANSACTION
			});
			var condOrdtype = transactionQuery.createCondition({
				fieldId: 'type',
				operator: query.Operator.ANY_OF,
				values: transactionType
			});
			var condOrdId = transactionQuery.createCondition({
				fieldId: 'tranid',
				operator: query.Operator.ANY_OF,
				values: orderName
			});
			var condBackOrderedEmpty = transactionQuery.createCondition({
				fieldId: 'transactionlines.quantitybackordered',
				operator: query.Operator.EMPTY_NOT
			});
			var condBackOrderedGreater = transactionQuery.createCondition({
				fieldId: 'transactionlines.quantitybackordered',
				operator: query.Operator.GREATER,
				values: 0
			});

			transactionQuery.columns = [
				transactionQuery.createColumn({
					fieldId: 'transactionnumber'
				}),
				transactionQuery.createColumn({
					fieldId: 'transactionlines.quantitybackordered'
				})
			];

			transactionQuery.condition = transactionQuery.and(condOrdtype,condOrdId,condBackOrderedEmpty, condBackOrderedGreater);

			var resultArray = transactionQuery.run().asMappedResults();
			return resultArray.length;
		}

		return {
			'post': doPost
		};
	});