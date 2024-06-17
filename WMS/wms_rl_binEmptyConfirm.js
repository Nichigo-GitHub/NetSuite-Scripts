/**
 *     Copyright © 2022, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record','./wms_utility','N/runtime','N/email','N/wms/recommendedBins','./wms_translator','./big','./wms_outBoundUtility','N/search'],
	function(record,utility,runtime,email,recommendedBins,translator,bigJS,obUtility,search) {
		/**
		 * This function is used to block the item bin combination.
		 *
		 */
        var transactiontype = '';
		function doPost(requestBody) {

		var resultsObject= {};
		var itemInternalId ='';
		var binInternalId ='';
		var reasonCode ='';
			var itemName = '';
			var binName = '';
			var reasonCodeDescription = '';
			var processName = '';
		var blockItemBinResults ='';
		var warehouseLocationId ='';
		var tallyScanBarCodeQty ='';
		var tallyLoopObj ='';
		var isTallyScanRequired ='';
		var pickTaskId ='';
		var locUseBinsFlag ='';
			var lineItemPickedQuantity='';
			var orderInternalId = '';
			var line = '';
			var inputParametersObj = {};
		var itemType ='';
        var btnClicked = '';
		try{
			if (utility.isValueValid(requestBody)) {
                var requestParams = requestBody.params;
				itemInternalId = requestParams.pickItemId;
				binInternalId = requestParams.pickBinId;
				itemName = requestParams.itemName;
				binName = requestParams.binName;
				reasonCodeDescription = requestParams.reasonCodeDesc;
				reasonCode = requestParams.reasonCode;
				processName = requestParams.processName;
				warehouseLocationId = requestParams.warehouseLocationId;
				tallyScanBarCodeQty = requestParams.tallyScanBarCodeQty;
				tallyLoopObj = requestParams.tallyLoopObj;
				isTallyScanRequired = requestParams.isTallyScanRequired;
				pickTaskId = requestParams.pickTaskId;
				itemType = requestParams.itemType;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				lineItemPickedQuantity = requestParams.lineItemPickedQuantity;
				orderInternalId = requestParams.orderInternalId;
				line = requestParams.line;
                btnClicked = requestParams.btnClicked;
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var stageByOrderSysRuleVal = requestParams.stageByOrderSystemRuleValue;
				var waveNumber = requestParams.waveNumber;
				transactiontype = requestParams.transactiontype;
				log.debug({title: 'requestParams11111', details: requestParams});
				if(btnClicked == "CompletePicking") {
					resultsObject.fromBtnClick = btnClicked;
					resultsObject.isValid = true;
				}
				else {
					if (utility.isValueValid(itemInternalId) && utility.isValueValid(binInternalId) &&
						(utility.isValueValid(reasonCode) || utility.isValueValid(btnClicked))) {
						if (utility.isValueValid(isTallyScanRequired) && isTallyScanRequired) {

							inputParametersObj.isTallyScanRequired = isTallyScanRequired;
							inputParametersObj.tallyScanBarCodeQty = tallyScanBarCodeQty;
							inputParametersObj.warehouseLocationId = warehouseLocationId;
							inputParametersObj.pickTaskId = pickTaskId;
							inputParametersObj.itemType = itemType;
							inputParametersObj.tallyLoopObj = tallyLoopObj;
							inputParametersObj.pickItemId = itemInternalId;
							inputParametersObj.pickBinId = binInternalId;
							inputParametersObj.processName = processName;
							inputParametersObj.locUseBinsFlag = locUseBinsFlag;
							inputParametersObj.lineItemPickedQuantity = lineItemPickedQuantity;
							inputParametersObj.orderInternalId = orderInternalId;
							inputParametersObj.line = line;
							this.tallyscanPickTaskUpdate(inputParametersObj, resultsObject);
							if (utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true
								&& utility.isValueValid(stageByOrderSysRuleVal) && stageByOrderSysRuleVal == true) {
								var pickedOrdersArr = obUtility.getPickedOrders(waveNumber, warehouseLocationId, selectedZones,pickTaskId);
								var ordersIdArr = [];
								for(var ord in  pickedOrdersArr){
									if(pickedOrdersArr[ord]) {
										ordersIdArr.push(pickedOrdersArr[ord].id);
									}
								}
								resultsObject.selectedOrders = ordersIdArr;
									resultsObject.ordersToStageCount = pickedOrdersArr.length;
								resultsObject.boolAnyItemIsAlreadyStaged = obUtility.checkIfAnyItemIsAlreadyStaged('singleOrder','',orderInternalId,warehouseLocationId);
								if(resultsObject.boolAnyItemIsAlreadyStaged == 'Y'){
									resultsObject.starDescription = translator.getTranslationString('WMS_MULTIORDER_ZONEPICKING.STARDESCRIPTION');
								}
								else{
									resultsObject.starDescription = '';
								}
							}

						}
						if (!utility.isValueValid(btnClicked)) {

							var includeInBinCount = false;
							var reasonCodeDtlsArr = [];
							if(utility.isValueValid(reasonCode)){
								reasonCodeDtlsArr = reasonCode.split("^");
							}
							if(reasonCodeDtlsArr.length > 0) {
								reasonCode = reasonCodeDtlsArr[0];
								includeInBinCount = reasonCodeDtlsArr[1];
							}
							blockItemBinResults = this.blockItemAndBin(itemInternalId, parseInt(binInternalId), reasonCode);
							if (blockItemBinResults.status == "WMS_FEATURE_NOT_ENABLED") {
								resultsObject.errorMessage = translator.getTranslationString('BINEMPTY_WMS_FEATURE_NOT_ENABLED');
								resultsObject.isValid = false;
							} else if (blockItemBinResults.status == "ITEM_BIN_MISMATCH") {
								resultsObject.errorMessage = translator.getTranslationString('BINEMPTY_ITEM_BIN_MISMATCH');
								resultsObject.isValid = false;
							} else if (blockItemBinResults.status == "REASONCODE_CONTAINS_INVALID_CHARS") {
								resultsObject.errorMessage = translator.getTranslationString('REASONCODE_CONTAINS_SPECIALCHARACTERS');
								resultsObject.isValid = false;
							} else if (blockItemBinResults.status == "SUCCESS") {
								resultsObject.binName = '';
								resultsObject.binInternalId = '';
								resultsObject.isValid = true;

								sendemailNotification(itemName, binName, reasonCodeDescription, processName);
                                 try {
                                     log.debug("includeInBinCount",includeInBinCount);
									 if(includeInBinCount == "true"){


									 var smartCountSystemRuleValue  = obUtility.chkSmartCountEnabled("Enable bin reporting and blocking",warehouseLocationId,'Smart Count');
										 log.debug("smartCountSystemRuleValue",smartCountSystemRuleValue);
										 if(smartCountSystemRuleValue == "Y") {
										 var isSmartCountAppExistsInAccount = utility.fnChkSmartCountAppEntryInMobileAppDefault();
										  log.debug("isSmartCountAppExistsInAccount",isSmartCountAppExistsInAccount)
										 if (isSmartCountAppExistsInAccount) {
											 var isWMSCountConfigurationExistsInTheAccount = utility.fnChkWMSCountConfigurtion();
											 log.debug("isWMSCountConfigurationExistsInTheAccount",isWMSCountConfigurationExistsInTheAccount)
											 if (isWMSCountConfigurationExistsInTheAccount) {
												 var smartItemCountIntegrationRec = record.create({
													 type: 'customrecord_wms_sc_integration',
													 isDynamic: true
												 });
												 smartItemCountIntegrationRec.setValue({
													 fieldId: 'name',
													 value: itemInternalId
												 });
												 smartItemCountIntegrationRec.setValue({
													 fieldId: 'custrecord_wms_sc_item',
													 value: itemInternalId
												 });
												 smartItemCountIntegrationRec.setValue({
													 fieldId: 'custrecord_wms_sc_bin',
													 value: parseInt(binInternalId)
												 });
												 smartItemCountIntegrationRec.setValue({
													 fieldId: 'custrecord_wms_sc_status',
													 value: "Count"
												 });
												 smartItemCountIntegrationRec.setValue({
													 fieldId: 'custrecord_wms_sc_loc',
													 value: warehouseLocationId
												 });
												 smartItemCountIntegrationRec.setValue({
													 fieldId: 'custrecord_wms_sc_reason',
													 value: reasonCodeDescription
												 });
												 smartItemCountIntegrationRec.save();
											 }
										 }
									 }
									 }
								 }
								 catch (e) {
									 log.error("e",e);
								 }
                            }
						}
					} else {
						resultsObject.errorMessage = translator.getTranslationString('BINEMPTY_ITEM_BIN_EMPTY');
						resultsObject.isValid = false;
					}
				}
				log.debug({title: 'resultsObject', details: resultsObject});
			}
		}
		catch(exp)
		{
			resultsObject.errorMessage = translator.getTranslationString('BINEMPTY_BLOCK_ITEM_BIN_FAILED');
			resultsObject.isValid =false;
			log.error({title: 'exception in binEmpty', details: exp});
		}
		return resultsObject;
	}


	function blockItemAndBin(itemInternalId,binInternalId,reasonCode)
	{
		var blockItemBinResults = recommendedBins.blockItemBinPair({itemId:itemInternalId, binId:binInternalId,reasonCode:reasonCode});
		log.debug('blockItemBinResults',blockItemBinResults);
		return blockItemBinResults;
	}
	function sendemailNotification(itemName,binName,reasonCodeDescription,processName)
	{
			try {
				var receipientIdArray = [];
				receipientIdArray.push(runtime.getCurrentUser().getPreference ({
					name: 'custscript_wms_emptybin_emailsend1'
				}));

				receipientIdArray.push(runtime.getCurrentUser().getPreference ({
					name: 'custscript_wms_emptybin_emailsend2'
				}));

				if (utility.isValueValid(receipientIdArray)) {

					var currentUserId = runtime.getCurrentUser().id;
					var currentUserName = runtime.getCurrentUser().name;

					for (var noOfReceipients = 0; noOfReceipients < receipientIdArray.length; noOfReceipients++) {
						var receipient = utility.getWmsPreferencesValue(receipientIdArray[noOfReceipients]);
						var emailObject = composeEmail(itemName, binName, reasonCodeDescription, currentUserName, processName);
						email.send({
							author: currentUserId,
							recipients: receipient,
							subject: emailObject.subject,
							body: emailObject.body
						});
					}
				}

			} catch (error) {
				log.error({
					title: 'Sending email is failed',
					details: error
				});
			}

		}
	function composeEmail(itemName,binName,reasonCodeDescription,currentUser,processName) {
			var emailObject = {};
		log.debug('sending email','sending email');
			emailObject.subject = "Bin " + binName + " has been blocked";
			emailObject.body = getEmailBody(itemName,binName,reasonCodeDescription,currentUser,processName);
			return emailObject;
		}
	function getEmailBody(itemName,binName,reasonCodeDescription,currentUser,processName) {
				var emailBody = '';
				var successBodyLine = "";
				if(processName == 'singleorderpicking')
				{
					processName = "Single-order picking";
				}
				else if(processName == 'multiorderpicking')
				{
					processName = "Multi-order picking";
				}
				emailBody += getIntroductoryParagraph(successBodyLine);

		 emailBody += "<p>"  + "Bin " + binName + "  has been blocked through the WMS mobile app by " + currentUser + ". " +  "<br>" +
				"Process Used: " + processName + "<br>" +
				"Item: " + itemName + "<br>"  +
				"Reason: " + reasonCodeDescription
				+ " "
				+  "<br><br><b>To unblock or manage blocked bins, sign in to your NetSuite account. </b></p></body></html>";
			return emailBody;
		}
	function getIntroductoryParagraph(paraContent) {
	return "<html><head></head><body><p>" + paraContent + "</p>";
	}

	function tallyscanPickTaskUpdate(inputParameters,resultsObject) {
		var systemRule = '';
		var isContainerScanRequired = '';
		var picktaskObj = {};

		var itemType = inputParameters.itemType;
		var tallyLoopObj = inputParameters.tallyLoopObj;
		if (inputParameters.isTallyScanRequired && ((utility.isValueValid(tallyLoopObj) ||
			(inputParameters.itemType == 'serializedinventoryitem' || inputParameters.itemType == 'serializedassemblyitem')))) {


			if ((itemType != 'serializedinventoryitem' && itemType != 'serializedassemblyitem') || parseInt(inputParameters.tallyScanBarCodeQty) > 0) {
				log.debug('into partial carton picking', isContainerScanRequired);
				var isInvStatusFeature = utility.isInvStatusFeatureEnabled();
				if (inputParameters.processName == 'singleorderpicking') {
					if (itemType != "noninventoryitem") {
						systemRule = "Use cartons for single-order picking?";
						//isContainerScanRequired = utility.getSystemRuleValue(systemRule, inputParameters.warehouseLocationId);
                        isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,inputParameters.warehouseLocationId,transactiontype);
					}
					log.debug('SOPKTallyscanInputparameters', inputParameters);
					if (utility.isValueValid(isContainerScanRequired) && isContainerScanRequired == 'Y') {
						resultsObject.isValid = true;
						resultsObject.enterqty = inputParameters.tallyScanBarCodeQty;
						if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {
							resultsObject.enterqty = inputParameters.tallyScanBarCodeQty;
						}
						resultsObject.isContainerScanRequired = 'true';
						resultsObject.tallyLoopObj = tallyLoopObj;
						resultsObject.binEmptyAction = 'binEmpty';
					} else {

						picktaskObj.picktaskid = inputParameters.pickTaskId;
						picktaskObj.whLocation = inputParameters.warehouseLocationId;
						picktaskObj.itemId = inputParameters.pickItemId;
						picktaskObj.fromBinId = inputParameters.pickBinId;
						picktaskObj.itemType = inputParameters.itemType;
						picktaskObj.locUseBinsFlag = inputParameters.locUseBinsFlag;
						picktaskObj.isTallyScanRequired = inputParameters.isTallyScanRequired;
						picktaskObj.enterqty = inputParameters.tallyScanBarCodeQty;
						var tallyqtyarr = [];
						if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {
							picktaskObj.enterqty = inputParameters.tallyScanBarCodeQty;
						}
						if ((isInvStatusFeature && (itemType == "inventoryitem" || itemType == "assemblyitem"))
							|| (itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem')) {
							var lotArray = [];
							var statusArray = [];
							for (var tallyLoopObjIndex in tallyLoopObj) {
								if (utility.isValueValid(tallyLoopObj[tallyLoopObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyLoopObjIndex].lotName) == -1) {
									lotArray.push(tallyLoopObj[tallyLoopObjIndex].lotName);
									tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
									statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
								} else if (statusArray.indexOf(tallyLoopObj[tallyLoopObjIndex].statusName) == -1) {
									tallyqtyarr.push(tallyLoopObj[tallyLoopObjIndex].quantity);
									statusArray.push(tallyLoopObj[tallyLoopObjIndex].statusName);
								}
							}
							picktaskObj.batchno = lotArray;
							picktaskObj.pickqty = tallyqtyarr;
							picktaskObj.frominvtstatus = statusArray;
							picktaskObj.statusInternalId = statusArray;
						}
						log.debug('picktaskObj binempty', picktaskObj);

						obUtility.picktaskupdate(picktaskObj);

					}
				} else {
					if (itemType != "noninventoryitem") {
						systemRule = "Use cartons for multi-order picking?";
						//isContainerScanRequired = utility.getSystemRuleValue(systemRule, inputParameters.warehouseLocationId);
						isContainerScanRequired = utility.getSystemRuleValueWithProcessType(systemRule,inputParameters.warehouseLocationId,transactiontype);
					}
					
					if (isContainerScanRequired === 'Y') {
						log.debug('into partial carton picking in mop', isContainerScanRequired);
						resultsObject.isValid = true;
						resultsObject.enterqty = inputParameters.tallyScanBarCodeQty;
						resultsObject.isCartonScanRequired = true;
						resultsObject.isContainerScanRequired = 'true';
						resultsObject.tallyLoopObj = inputParameters.tallyLoopObj;
						resultsObject.totalLinepickqty = Number(bigJS(inputParameters.tallyScanBarCodeQty).plus(inputParameters.lineItemPickedQuantity));
						log.debug('picktaskObj totalLinepickqty', resultsObject.totalLinepickqty);
						resultsObject.pickQty = inputParameters.tallyScanBarCodeQty;
						resultsObject.binEmptyAction ="binEmpty";
                      resultsObject.boolBinEmpty = true;

					} else {
						log.debug('into without partial carton picking in mop', isContainerScanRequired);
						picktaskObj = {};
						picktaskObj.isTallyScanRequired = inputParameters.isTallyScanRequired;
						picktaskObj.whLocation = inputParameters.warehouseLocationId;
						picktaskObj.picktaskid = inputParameters.pickTaskId;
						picktaskObj.pickqty = inputParameters.tallyScanBarCodeQty;
						picktaskObj.fromBinId = inputParameters.pickBinId;
						picktaskObj.itemType = inputParameters.itemType;
						picktaskObj.line = inputParameters.line;
						picktaskObj.orderInternalId = inputParameters.orderInternalId;
						picktaskObj.totalLinepickqty = Number(bigJS(inputParameters.tallyScanBarCodeQty).plus(inputParameters.lineItemPickedQuantity));
						picktaskObj.locUseBinsFlag = inputParameters.locUseBinsFlag;
						picktaskObj.tallyLoopObj = inputParameters.tallyLoopObj;
						picktaskObj.itemId = inputParameters.pickItemId;
						picktaskObj.inventoryStatusFeature = isInvStatusFeature;
						log.debug('multiOrderPicktaskUpdate before', inputParameters.pickItemId);
						obUtility.multiOrderPicktaskUpdate(picktaskObj);

					}
				}
			}
		}
	}

		return {
		'post': doPost,
		blockItemAndBin:blockItemAndBin,
		composeEmail:composeEmail,
		sendemailNotification:sendemailNotification,
		tallyscanPickTaskUpdate:tallyscanPickTaskUpdate
	};
});
