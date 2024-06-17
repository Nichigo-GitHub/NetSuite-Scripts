/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/format','./wms_utility','./wms_workOrderUtility','./wms_translator'],

		function (search,format,utility,woUtility ,translator) {

	function doPost(requestBody) {
		
		var lotValidationDetails = {};
		var itemInternalId = '';
		var transactionInternalId = '';
		var warehouseLocationId = '';
		var debugString = '';
		var enterLot = '';
		var enterExpiryDate = '';
		var requestParams	= '';	
		var locUseBinsFlag = '';
		var impactedRecords={};

		try{
			if (utility.isValueValid(requestBody)) {
				requestParams = requestBody.params;
				warehouseLocationId = requestParams.warehouseLocationId;
				itemInternalId = requestParams.itemInternalId;
				enterLot = requestParams.lotName;
				enterExpiryDate = requestParams.lotExpiryDate;
				transactionInternalId =requestParams.transactionInternalId;
				impactedRecords['_ignoreUpdate'] = true;

				log.debug({title:'request params:', details:requestParams});

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) && utility.isValueValid(enterLot) && utility.isValueValid(transactionInternalId))
				{

					var dtsettingFlag = utility.DateSetting(); 
					log.debug({title:'dtsettingFlag: ', details:dtsettingFlag});

					if (utility.isValueValid(enterExpiryDate)) {

						var getExpDateresult = this.ValidateDate(enterExpiryDate, dtsettingFlag);
						log.debug({title:'getExpDateresult: ', details:getExpDateresult});

						if (getExpDateresult == null || getExpDateresult == "") 
						{
							var validationMessage = translator.getTranslationString("WO_ASSEMBLY_LOTVALIDATION.EXPIRYDATE_FORMAT");
							lotValidationDetails["errorMessage"] = validationMessage+" "+dtsettingFlag+".";
							lotValidationDetails['isValid'] = false;
							return lotValidationDetails;
						}
						else 
						{
							var now = utility.convertDate();
							now.setHours(0, 0, 0, 0);
							if (now > getExpDateresult) {
								lotValidationDetails["errorMessage"] = translator.getTranslationString("WO_ASSEMBLY_LOTVALIDATION.INVALID_EXPRIRYDATE");
								lotValidationDetails['isValid'] = false;
								return lotValidationDetails;
							}
							lotValidationDetails["lotExpiryDate"] = enterExpiryDate;
						}
					}
					var enterLotId = woUtility.isInventoryNumberExists(itemInternalId, enterLot, warehouseLocationId);
					log.debug({title:'enterLotId : ', details:enterLotId});

					if (!utility.isValueValid(enterLotId) && (!utility.isValueValid(enterExpiryDate))) 
					{
						var lotLookUp = search.lookupFields({
							type: search.Type.ITEM,
							id: itemInternalId,
							columns: ['custitem_wmsse_shelflife']
						});

						var shelflife = lotLookUp.custitem_wmsse_shelflife;
						log.debug({title:'shelflife  : ', details:shelflife});

						if(!utility.isValueValid(shelflife))
						{
							shelflife =0;
						}
						if (utility.isValueValid(shelflife)) {
							if (shelflife > 0) {
								var currDate = utility.convertDate();
								var ExpiryDate = new Date(currDate.setDate(currDate.getDate() + parseInt(shelflife)));
								var expiryDateresult = format.format({
									value: ExpiryDate,
									type: format.Type.DATE
								});
								lotValidationDetails["lotExpiryDate"] = expiryDateresult;
							}
							else {
								lotValidationDetails["lotName"] = enterLot;
								lotValidationDetails["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_LOTVALIDATION.INVALID_SHELFLIFE');
								lotValidationDetails['isValid'] = false;
								return lotValidationDetails;
							}

						}
					}
					if (utility.isValueValid(enterLotId)) {
						//if lot is already exists in inventory, no need to consider expiry date
						lotValidationDetails["lotExpiryDate"] = "";
						lotValidationDetails["lotInternalId"] = enterLotId;
					}

					lotValidationDetails["lotName"] = enterLot;
					lotValidationDetails["info_lotName"] = enterLot;
					lotValidationDetails["errorMessage"] = '';
					lotValidationDetails['isValid'] = true;

					debugString = debugString + "lotValidationDetails :"+lotValidationDetails;
					if(!utility.isValueValid(locUseBinsFlag))
					{
						locUseBinsFlag =utility.lookupOnLocationForUseBins(warehouseLocationId);
					}
					if(locUseBinsFlag == false)
					{
						var impactRec = {};
						var openTaskArr = [];
						var assemblyBuildIdArr = [];
						var transactionInternalIdArr = [];
						var itemType = requestParams.itemType;
						var scannedQuantity = requestParams.scannedQuantity;
						var scannedQuantityInBaseUnits = requestParams.scannedQuantityInBaseUnits;
						var assemblyItemQuantity = requestParams.assemblyItemQuantity;
						var statusInternalId = requestParams.statusInternalId;
						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
						var transactionUomName = requestParams.transactionUomName;
						if(!utility.isValueValid(transactionUomName)){
							transactionUomName = '';
						}
						var parameterObject = {};						
						parameterObject = woUtility.buildParameterObject(parameterObject,transactionInternalId,itemInternalId,warehouseLocationId,itemType,
								scannedQuantity,scannedQuantityInBaseUnits,assemblyItemQuantity,statusInternalId,inventoryStatusFeature,
								transactionUomName,locUseBinsFlag,enterLot,lotValidationDetails["lotExpiryDate"]);
						var results = woUtility.createAssemblyBuildRec(parameterObject);
						log.debug('results', results); 
						var splitOpenTaskResults = results.opentaskSplitArray;
						if(utility.isValueValid(results['assemblyRecId'])){
							assemblyBuildIdArr.push(results['assemblyRecId']);
						}else{
							assemblyBuildIdArr.push();
						}
						impactedRecords['assemblybuild'] = assemblyBuildIdArr;
						log.debug('splitOpenTaskResults', splitOpenTaskResults);
						parameterObject['openTask_statusFlag'] = 3;
						parameterObject['openTask_taskType'] = 5;
						parameterObject['opentTask_NSConfirmationRefNo'] = results.assemblyRecId;
						parameterObject['toBinInternalId'] = '';
						var openTaskId = woUtility.createOpenTaskForWorkOrder(parameterObject);
						impactRec['opentaskId'] = openTaskId;
						if(utility.isValueValid(impactRec['opentaskId'])){
							openTaskArr.push(impactRec['opentaskId']);
						}else{
							openTaskArr.push();
						}
						impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskArr;
						if(utility.isValueValid(transactionInternalId)){
							transactionInternalIdArr.push(transactionInternalId);
						}else{
							transactionInternalIdArr.push();
						}
						lotValidationDetails['pageNavigationStatus'] = 'CompleteScreen';
						impactedRecords['workorder'] = transactionInternalIdArr;
						impactedRecords['_ignoreUpdate'] = false;
						if(utility.isValueValid(splitOpenTaskResults) && splitOpenTaskResults.length>0)
						{
							woUtility.splitOpenTaskRecordsForWO(splitOpenTaskResults,results,transactionInternalId,inventoryStatusFeature);
						}
						else
						{
							lotValidationDetails['errorMessage']='';
						}
					}
					lotValidationDetails["impactedRecords"] = impactedRecords;
				}
				else
				{
					lotValidationDetails["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_LOTVALIDATION.INVALID_LOT');
					lotValidationDetails['isValid'] = false;
				}
			}
			else {
				lotValidationDetails["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_LOTVALIDATION.INVALID_LOT');
				lotValidationDetails['isValid'] = false;
			}
		}
		catch(e)
		{
			lotValidationDetails['isValid'] = false;
			lotValidationDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return lotValidationDetails;
	}

	function ValidateDate(vDateString,dtsettingFlag)
	{
		if(vDateString != null && vDateString != '')
		{
			var vValidDate= format.parse({
				type :format.Type.DATE,
				value : vDateString
			});
			if(isNaN(vValidDate) || vValidDate == null || vValidDate == '')
				return null;
			else
				return vValidDate;
		}
		else
			return null;
	}


	return {
		'post': doPost,
		ValidateDate :ValidateDate
	};

});
