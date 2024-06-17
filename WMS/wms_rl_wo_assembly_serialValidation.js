/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_workOrderUtility', 'N/search', 'N/record','./big','./wms_translator'],

		function (utility, woUtility , search, record,Big,translator) {

	function doPost(requestBody) {

		var serialValidationDetails = {};
		var itemInternalId = '';
		var transactionInternalId = '';
		var warehouseLocationId = '';
		var serialName = '';
		var numberOfTimesSerialScanned ='';
		var scannedQuantity = '';
		var debugString = '';
		var scannedQuantityInBaseUnits = '';
		var itemType = '';
		var transactionName = '';
		var itemName = '';
		var locUseBinsFlag ='';
		var impactedRecords={};

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				itemInternalId = requestParams.itemInternalId;
				transactionInternalId = requestParams.transactionInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				transactionName = requestParams.transactionName;
				serialName = requestParams.serialName;
				numberOfTimesSerialScanned =requestParams.numberOfTimesSerialScanned;
				scannedQuantity = requestParams.scannedQuantity;
				scannedQuantityInBaseUnits = requestParams.scannedQuantityInBaseUnits;
				itemName = requestParams.itemName;
				impactedRecords['_ignoreUpdate'] = true;

				log.debug({title:'request params :', details:requestParams});

				if(utility.isValueValid(serialName) && utility.isValueValid(itemInternalId)
						&& utility.isValueValid(transactionName) && utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId) )
				{

					var itemResults = woUtility.validateItemForAssembly(warehouseLocationId, itemInternalId, itemName);

					if(itemResults.length > 0){

						var isSerialExistsInInventory = woUtility.isInventoryNumberExists(itemInternalId, serialName, warehouseLocationId);

						log.debug({title:'isSerialExistsInInventory :', details:isSerialExistsInInventory});

						if (isSerialExistsInInventory) {
							serialValidationDetails['errorMessage'] = translator.getTranslationString('WO_ASSEMBLY_SERIALVALIDATION.SERIAL_EXISTS');
							serialValidationDetails['isValid']=false;
						}
						else
						{

							openTaskResults = woUtility.getOpenTaskSerialEntries(itemInternalId, '', warehouseLocationId);
							log.debug({title:'openTaskResults :', details:openTaskResults});

							var opentaskSerArr = [];
							for(var serRec=0; serRec<openTaskResults.length; serRec++)
							{
								var serNum = openTaskResults[serRec]['custrecord_wmsse_serial_no'].split(',');
								if(serNum.length>1){

									for(var n=0; n< serNum.length; n++)
										opentaskSerArr.push(serNum[n]);
								}else if(serNum.length == 1){
									opentaskSerArr.push(serNum[0]);
								}
							}

							log.debug({title:'openTaskResults Serials :', details:opentaskSerArr});

							if (opentaskSerArr.indexOf(serialName) != -1) 
							{
								serialValidationDetails ['errorMessage'] = translator.getTranslationString('WO_ASSEMBLY_SERIALVALIDATION.SERIAL_EXISTS');
								serialValidationDetails['isValid']=false;
							}
							else
							{
								log.debug({title:'openTaskResults Serials does not exist :', details:opentaskSerArr});

								var serialSearchResults = this.getSerialSearch(serialName,transactionInternalId);


								debugString = debugString + ",serialSearchResults :"+serialSearchResults;
								if (serialSearchResults != null && serialSearchResults.length > 0) {

									serialValidationDetails ['errorMessage'] = translator.getTranslationString("WO_ASSEMBLY_SERIALVALIDATION.SERIAL_SCANNED");
									serialValidationDetails['isValid']=false;
								}
								else {

									serialValidationDetails["serialNo"] = serialName;
									serialValidationDetails["numberOfTimesSerialScanned"] = parseFloat(numberOfTimesSerialScanned) + 1;

									var serialentryId = woUtility.createSerialEntries(transactionName, transactionInternalId, '', itemInternalId, serialName, 2);

									var customrecord = record.create({
										type: 'customrecord_wmsse_serialentry'
									});

									serialValidationDetails['serialEntryRecordId'] = customrecord;
									debugString = debugString + ",serialEntryRecordId :"+customrecord;

									serialValidationDetails['isValid']=true;
									if(!utility.isValueValid(locUseBinsFlag))
									{
										locUseBinsFlag =utility.lookupOnLocationForUseBins(warehouseLocationId);
									}
                                  

									if (locUseBinsFlag == false && scannedQuantityInBaseUnits <= serialValidationDetails["numberOfTimesSerialScanned"]) 
									{
										var impactRec = {};
										var openTaskArr = [];
										var assemblyBuildIdArr = [];
										var transactionInternalIdArr = [];
										itemType = requestParams.itemType;								
										var assemblyItemQuantity = requestParams.assemblyItemQuantity;
										var statusInternalId = requestParams.statusInternalId;
										var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
										var transactionUomName = requestParams.transactionUomName;
										if(!utility.isValueValid(transactionUomName)){
											transactionUomName = '';
										}
										var parameterObject = new Object();						
										parameterObject = woUtility.buildParameterObject(parameterObject,transactionInternalId,itemInternalId,warehouseLocationId,itemType,
												scannedQuantity,scannedQuantityInBaseUnits,assemblyItemQuantity,statusInternalId,inventoryStatusFeature,transactionUomName,locUseBinsFlag);
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
										serialValidationDetails['pageNavigationStatus'] = 'CompleteScreen';
										impactedRecords['workorder'] = transactionInternalIdArr;
										impactedRecords['_ignoreUpdate'] = false;
										if(utility.isValueValid(splitOpenTaskResults) && splitOpenTaskResults.length>0)
										{
											woUtility.splitOpenTaskRecordsForWO(splitOpenTaskResults,results,transactionInternalId,inventoryStatusFeature);
										}
										else
										{
											serialValidationDetails['errorMessage']='';
										}
									}
									serialValidationDetails["impactedRecords"] = impactedRecords;
								}
							}
						}					
					}
					else
					{
						serialValidationDetails["errorMessage"] = translator.getTranslationString('WO_ASSEMBLY_SERIALVALIDATION.INACTIVE_ITEM');
						serialValidationDetails['isValid'] = false;								
					}
				}
				else
				{
					serialValidationDetails ['errorMessage'] = translator.getTranslationString("WO_ASSEMBLY_SERIALVALIDATION.VALID_SERIAL");
					serialValidationDetails['isValid']=false;
				}
			}
			else
			{
				serialValidationDetails['isValid']=false;
			}
		}
		catch(e)
		{
			serialValidationDetails['isValid'] = false;
			serialValidationDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return serialValidationDetails;
	}
	function getSerialSearch(serialName,transactionInternalId)
	{
		var serialSearch = search.load({
			id: 'customsearch_wmsse_wo_serialentry_srh',
		});
		var filters = serialSearch.filters;
		filters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_no',
			operator: search.Operator.IS,
			values: serialName
		}));
		filters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_ordno',
			operator: search.Operator.ANYOF,
			values: transactionInternalId
		}));
		serialSearch.filters = filters;
		return utility.getSearchResultInJSON(serialSearch);
	}
	return {
		'post': doPost,
		'getSerialSearch':getSerialSearch
	};
});
