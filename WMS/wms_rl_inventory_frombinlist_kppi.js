/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', 'N/config', './wms_inventory_utility'],
	/**
	 * @param {search} search
	 */
	function (search, utility, translator, config, invtUtility) {

		/**
		 * Function to fetch  bin locations based on pickstratagies
		 */
		function doPost(requestBody) {
			log.audit('doPost - Start', 'Starting bin location fetch process');
			log.debug('doPost - Request', { requestBody: requestBody });

			var binListArr = {};
			var debugString = '';
			try {
				if (utility.isValueValid(requestBody)) {
					log.debug('doPost - Valid Request', 'Request body is valid');
					var requestParams = requestBody.params;
					debugString = debugString + "requestParams :" + requestParams;
					log.debug({ title: 'requestParams', details: requestParams });
					var warehouseLocationId = requestParams.warehouseLocationId;
					var itemInternalId = requestParams.itemInternalId;
					var itemType = requestParams.itemType;
					var loadConfig = config.load({
						type: config.Type.USER_PREFERENCES
					});
					var department = loadConfig.getValue({ fieldId: 'departments' });
					var classes = loadConfig.getValue({ fieldId: 'classes' });
					log.debug('doPost - Config', {
						department: department,
						classes: classes
					});
					var unitType = requestParams.unitType;
					var itemGroup = requestParams.itemGroup;
					var itemFamily = requestParams.itemFamily;
					var preferedBinInternalId = requestParams.preferedBinInternalId;
					var stockConversionRate = requestParams.stockConversionRate;
					var processType = requestParams.processType;
					var selectedConversionRate = '';
					var selectedUOMText = '';
					var selectedStatusId = requestParams.selectedStatusId;
					var transactionUomConversionRate = requestParams.transactionUomConversionRate;
					var qtyToPick = requestParams.qtyToPick;
					var selectedUnit = requestParams.stockUnitName;
					if (utility.isValueValid(requestParams.uomList)) {
						var selectedUomList = requestParams.uomList;
						selectedConversionRate = selectedUomList.id;
						selectedUOMText = selectedUomList.value;
					}
					if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) && utility.isValueValid(itemType)) {


						var stockunitText = '';
						var uomResult = [];

						if (utility.isValueValid(unitType)) {
							uomResult = utility.getUnitsType(unitType);
						}


						var itemDetails = utility.getItemDetails(itemInternalId);
						debugString = debugString + "itemDetails :" + itemDetails;
						log.debug({ title: 'itemDetails', details: itemDetails });
						if (itemDetails != null && itemDetails.length > 0) {

							for (var itemItr = 0; itemItr < itemDetails.length; itemItr++) {
								if (itemDetails[itemItr]['preferredbin'] == true && itemDetails[itemItr]['location'] == warehouseLocationId) {
									preferedBinInternalId = itemDetails[itemItr]['binnumber'];
								}
							}

							itemGroup = itemDetails[0]['custitem_wmsse_itemgroup'];
							itemFamily = itemDetails[0]['custitem_wmsse_itemfamily'];
							stockunitText = itemDetails[0]['stockunitText'];


						}

						var objBinDetails = [];
						var allowAllLots = 'T';
						var pickBinDetails = {};

						log.debug('doPost - Bin Details Parameters', {
							preferedBinInternalId: preferedBinInternalId,
							itemType: itemType,
							warehouseLocationId: warehouseLocationId,
							processType: processType
						});

						debugString = debugString + "preferedBinInternalId :" + preferedBinInternalId;
						debugString = debugString + "itemType :" + itemType;

						pickBinDetails['itemInternalId'] = itemInternalId;
						pickBinDetails['strItemGrp'] = itemGroup;
						pickBinDetails['strItemFamily'] = itemFamily;
						pickBinDetails['preferBinId'] = preferedBinInternalId;
						pickBinDetails['whLocationId'] = warehouseLocationId;
						pickBinDetails['department'] = department;
						pickBinDetails['classes'] = classes;
						pickBinDetails['itemType'] = itemType;
						pickBinDetails['unitType'] = unitType;
						pickBinDetails['blnItemUnit'] = stockConversionRate;
						pickBinDetails['selectedConversionRate'] = selectedConversionRate;
						pickBinDetails['currentConversionRate'] = stockConversionRate;
						pickBinDetails['makeInvAvailFlagFromSelect'] = selectedStatusId;
						pickBinDetails['allowAllLots'] = allowAllLots;
						pickBinDetails['location'] = warehouseLocationId;
						pickBinDetails['qtyToPick'] = qtyToPick;
						if (processType == 'replen')
							pickBinDetails['boolinclIBStageInvFlag'] = 'false';

						if (processType == 'BinTransfer' || processType == 'invtransfer' || processType == 'inventoryStatusChange') {
							log.debug('doPost - Getting Bin Details', 'Fetching bin details for ' + processType);
							objBinDetails = invtUtility.getBinDetailsForItem(pickBinDetails, processType);
							log.debug('doPost - Bin Details Result', { binDetailsCount: objBinDetails.length });
						}
						else if (processType == 'replen') {
							log.debug('doPost - Replenishment Process', 'Starting replenishment bin fetch');

							var selectedUnitId = '';

							var uomResultsObj = utility.getUomValues(unitType, selectedUnit);
							if (utility.isValueValid(uomResultsObj) && utility.isValueValid(uomResultsObj['uomValue'])) {
								selectedUnitId = uomResultsObj['uomValue']
							}

							pickBinDetails['selectedUnitId'] = selectedUnitId;

							var objTotalBinDetails = utility.getRecommendedBins(pickBinDetails, processType);

							for (var binCnt in objTotalBinDetails) {
								if (objTotalBinDetails[binCnt].isPreferredBin == false) {
									objBinDetails.push(objTotalBinDetails[binCnt]);
								}
							}

						}
						log.debug({ title: 'objBinDetails', details: objBinDetails });

						if (objBinDetails.length > 0) {
							var uomList = [];
							if (uomResult.length > 0) {

								for (var uomCnt in uomResult) {
									var rec = uomResult[uomCnt];
									var conversionRate = rec['conversionrate'];
									var unitName = rec['unitname'];
									var row = { 'value': unitName, 'id': conversionRate };
									uomList.push(row);
								}

								binListArr['uomList'] = uomList;
								binListArr['uomDefaultStatus'] = stockunitText;

							}

							log.debug({ title: 'selectedConversionRate testtts', details: selectedConversionRate });
							log.debug({ title: 'stockConversionRate testtts', details: stockConversionRate });

							if (utility.isValueValid(selectedConversionRate) && utility.isValueValid(transactionUomConversionRate)) {
								for (var i = 0; i < objBinDetails.length; i++) {

									objBinDetails[i]['availableqty'] = utility.uomConversions(objBinDetails[i]['availableqty'], selectedConversionRate, transactionUomConversionRate);
									log.debug({ title: 'after  calc ', details: objBinDetails[i]['availableqty'] });
								}
							}

							var isInvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
							if (isInvStatusFeatureEnabled && processType != 'replen') {
								var statusList = utility.getInventoryStatusOptions();
								if (statusList.length > 0) {
									binListArr['inventoryOptionsList'] = statusList;
								}
							}

							binListArr['binList'] = objBinDetails;
							binListArr["isValid"] = true;
						}
						else {
							binListArr["errorMessage"] = translator.getTranslationString("BINTRANSFER_LOTVALIDATE.FROMBINLIST.INSUFFICIENTINVENTORY");
							binListArr["isValid"] = false;

						}
					}
					else {
						binListArr["isValid"] = false;
					}
				}
				else {
					binListArr["isValid"] = false;
				}
				log.debug({ title: 'binListArr', details: binListArr });
			}
			catch (e) {
				binListArr['isValid'] = false;
				binListArr['errorMessage'] = e.message;
				log.error({ title: 'doPost - Error', details: e.message + " Stack :" + e.stack });
				log.error({ title: 'doPost - Debug String', details: debugString });
			}

			log.audit('doPost - Complete', {
				isValid: binListArr.isValid,
				binCount: binListArr.binList ? binListArr.binList.length : 0,
				hasError: !!binListArr.errorMessage
			});
			return binListArr;
		}


		return {
			'post': doPost
		};

	});
