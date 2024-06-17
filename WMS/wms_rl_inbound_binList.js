/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/runtime','./wms_utility','./big','./wms_translator', './wms_inboundUtility'],

		function (search, runtime,utility,big,translator, inboundUtility) {

	/**
	         This function is to fetch the bin locations
	 */
	function doPost(requestBody) {

		var binListDetails = {}; 
		var debugString = '';
		try{

			//Returning Bin listing details to suitelet
			if (utility.isValueValid(requestBody)) {

				var requestParams = requestBody.params;
				var binListArray = {};
				var transactionType ='';
				var transactionInternalId = '';
				var transactionLineNo = '';
				var transactionName = '';
				var itemName ='';
				var specOrderFlag ='';
				var selectedConversionRate ='';
				var selectedUOMText = '';
				var inventoryStatus = '';
				var fromBinInternalId ='';
				var transactionUomName ='';
				var transcationUomInternalId = '';
				var transactionUomConversionRate = '';
				var processType = requestParams.processType;
				var putawayAll=requestParams.putawayAll;
				var fromStatusName = requestParams.fromStatusName;
				var fromStatusId = requestParams.fromStatusId;
				var randomTallyScan = requestParams.randomTallyScan;

				var requestParamsObj = requestParams;
				debugString = debugString + "requestParams :"+requestParamsObj;

				if(processType != 'BinTransfer' && processType != 'putAway' && processType != 'Inventory')
				{
					transactionType = requestParams.transactionType;
					transactionInternalId = requestParams.transactionInternalId;
					transactionLineNo = requestParams.transactionLineNo;
					transactionName = requestParams.transactionName;
					transactionUomName = requestParams.transactionUomName;
					transcationUomInternalId = requestParams.transcationUomInternalId;
					transactionUomConversionRate = requestParams.transactionUomConversionRate;
					specOrderFlag = requestParams.specOrderFlag;
				}
				else
				{
					inventoryStatus = requestParams.selectedInventoryStatus;
					fromBinInternalId = requestParams.fromBinInternalId;
				}
				var itemInternalId = requestParams.itemInternalId;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var warehouseLocationName = requestParams.warehouseLocationName;
				var fromWarehouseLocationId = requestParams.fromWarehouseLocationId;
				itemName = requestParams.itemName;

				if(utility.isValueValid(requestParams.uomList))
				{
					var selectedUomList = requestParams.uomList;
					selectedConversionRate = selectedUomList.id;
					selectedUOMText = selectedUomList.value;
				}
				if(utility.isValueValid(requestParams.statusList))
				{
					var selectedStatusList = requestParams.statusList;
					fromStatusId = selectedStatusList.id;
				}

				var locationUseBinlFlag =true;
				if(utility.isValueValid(fromWarehouseLocationId))
				{
					var columnlocationlookupArray =[];
					columnlocationlookupArray.push('usesbins');
					var locationLookUp = utility.getLocationFieldsByLookup(fromWarehouseLocationId,columnlocationlookupArray);

					log.debug('locationLookUp :', locationLookUp);

					if(utility.isValueValid(locationLookUp))
					{

						if (utility.isValueValid( locationLookUp.usesbins )) 
						{
							locationUseBinlFlag = locationLookUp.usesbins;
						}	
					}			
				}


				if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) && 
						(((processType == 'Inventory'|| processType =='putAway' || processType == 'BinTransfer') &&
								((utility.isValueValid(fromBinInternalId)) || locationUseBinlFlag == false)) || (utility.isValueValid(transactionInternalId)
										&& utility.isValueValid(transactionLineNo) && utility.isValueValid(transactionName)
										&& utility.isValueValid(itemName) && utility.isValueValid(transactionType)))) {

					var itemObj = {};
					 if(randomTallyScan != "T") {
						 var departments = runtime.isFeatureInEffect({
							 feature: 'departments'
						 });
						 var classes = runtime.isFeatureInEffect({
							 feature: 'classes'
						 });

						 var lotName = requestParams.lotName;
						 var preferedBinName = '';
						 var preferedBinInternalId = '';
						 var preferedBinType = '';
						 var itemType = '';
						 var itemResults = '';
						 if (processType == 'Inventory') {
							 itemResults = inboundUtility.getItemDetails(itemInternalId, fromWarehouseLocationId);
						 } else {
							 itemResults = inboundUtility.getItemDetails(itemInternalId, warehouseLocationId);
						 }
						 var itemGroup = "";
						 var itemFamily = "";
						 var isActiveFlag = true;
						 var blnMixItem = true;
						 var blnMixLot = true;
						 var stockUnitName = "";
						 var unitType = '';
						 var department = "";
						 var vClass = "";

						 debugString = debugString + "itemResults :" + itemResults;
						 log.debug('itemResults', itemResults);
						 var itemResultObj = '';
						 if (itemResults != null && itemResults.length > 0) {
							 itemResultObj = itemResults[0];
							 log.debug('itemResultObj', itemResultObj);
							 var itemresultsStr = itemResultObj;
							 debugString = debugString + "itemResultObj :" + itemresultsStr;
							 if (itemResultObj.isinactive == true) {
								 binListArray.errorMessage = translator.getTranslationString("PO_BINLIST.INACTIVE_ITEM");
								 binListArray.isValid = false;
								 return binListArray;
							 } else {

								 isActiveFlag = true;
								 binListDetails.isActiveFlag = isActiveFlag;
								 itemType = itemResultObj.recordType;
								 binListDetails.itemType = itemType;
								 log.debug({title: 'itemResults', details: itemResults});
								 var itemPreferedLocation = '';
								 var isPreferedBin = '';
								 for (var d = 0; d < itemResults.length; d++) {
									 var itemResultsRec = itemResults[d];
									 itemPreferedLocation = itemResultsRec.location;
									 isPreferedBin = itemResultsRec.preferredbin
									 if (preferedBinName == '' && isPreferedBin == true && (itemPreferedLocation == warehouseLocationId)) {
										 preferedBinName = itemResults[d].binnumber;
										 break;
									 }

								 }
								 if (utility.isValueValid(preferedBinName)) {
									 preferedBinInternalId = inboundUtility.getValidBinInternalId(preferedBinName, warehouseLocationId, null);
									 preferedBinType = getPreferredBinType(preferedBinName, warehouseLocationId, null); //Not in general function
									 var preferBinQtyDetails = inboundUtility.getBinwiseQtyDetails(preferedBinInternalId, warehouseLocationId);
									 binListDetails.preferedBinQtyDetails = preferBinQtyDetails;
									 binListDetails.preferedBinName = preferedBinName;
									 binListDetails.preferedBinInternald = preferedBinInternalId;
									 binListDetails.preferedBinType = preferedBinType;
								 }
								 blnMixItem = itemResultObj.custitem_wmsse_mix_item;
								 blnMixLot = itemResultObj.custitem_wmsse_mix_lot;
								 itemGroup = itemResultObj.custitem_wmsse_itemgroup;
								 itemFamily = itemResultObj.custitem_wmsse_itemfamily;
								 stockUnitName = itemResultObj.stockunit;
								 unitType = itemResultObj.unitstype;
								 itemName = itemResultObj.itemid;
								 binListDetails.itemName = itemName;
								 binListDetails.blnMixItem = blnMixItem;
								 binListDetails.blnMixLot = blnMixLot;
								 binListDetails.unitType = unitType;

								 itemObj.itemInternalId = itemInternalId;
								 itemObj.itemGroup = itemGroup;
								 itemObj.itemFamily = itemFamily;
								 itemObj.blnMixItem = blnMixItem;
								 itemObj.blnMixLot = blnMixLot;
								 itemObj.preferedBinName = preferedBinName;
								 itemObj.warehouseLocationId = warehouseLocationId;
								 itemObj.itemType = itemType;
								 itemObj.lotName = lotName;
								 itemObj.preferedBinInternalId = preferedBinInternalId;
								 if (utility.isValueValid(requestParams.uomList)) {
									 itemObj.selectedUOMText = selectedUomList.value;
									 transactionUomName = itemResultObj.stockunitText;
								 } else {
									 if (utility.isValueValid(stockUnitName)) {
										 if (utility.isValueValid(unitType) &&
											 ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && ((blnMixItem == false ||
													 blnMixItem == "false")
												 && (blnMixLot == false || blnMixLot == 'false')))
											 || ((itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" ||
												 itemType == "serializedassemblyitem") && (blnMixItem == false || blnMixItem == "false"))) {

											 itemObj.selectedUOMText = itemResultObj.stockunitText;

										 }
										 transactionUomName = itemResultObj.stockunitText;
									 }

								 }
								 debugString = debugString + ",transactionUomName :" + transactionUomName;
								 var stritemObj = itemObj;
								 debugString = debugString + ",itemObj :" + stritemObj;
								 if (departments == true) {
									 department = itemResults[0].department;
								 }
								 if (classes == true) {
									 vClass = itemResults[0]['class'];
								 }

								 if ((!utility.isValueValid(department)) || (!utility.isValueValid(vClass))) {
									 if (departments == true && classes == true && (utility.isValueValid(transactionInternalId))) {
										 var fields = ['department', 'class'];
										 var poRes = search.lookupFields({
											 type: transactionType,
											 id: transactionInternalId,
											 columns: fields
										 });
										 if (!utility.isValueValid(department)) {

											 department = poRes.department;
										 }
										 if (!utility.isValueValid(vClass)) {

											 vClass = poRes.class;
										 }
									 }

								 }
								 if (processType == 'Inventory' || processType == 'BinTransfer') {
									 if (!utility.isValueValid(transcationUomInternalId)) {

										 transcationUomInternalId = itemResultObj.stockunit;
									 }
								 } else {
									 if (processType == 'putAway') {

										 if (utility.isValueValid(requestParams.transcationUomInternalId) &&
											 utility.isValueValid(requestParams.transcationUomInternalId[0])) {
											 var unitId;
											 for (var unitIndx = 0; unitIndx < requestParams.transcationUomInternalId.length; unitIndx++) {
												 if (unitIndx == 0) {
													 unitId = requestParams.transcationUomInternalId[unitIndx].unit;
												 } else {
													 unitId = unitId + "," + requestParams.transcationUomInternalId[unitIndx].unit;
												 }

											 }
											 transcationUomInternalId = unitId;
										 } else {
											 if (utility.isValueValid(itemResultObj)) {

												 transcationUomInternalId = itemResultObj.stockunit;
											 }
										 }
									 }
								 }
								 itemObj.department = department;
								 itemObj['class'] = vClass;
								 itemObj.transcationUomInternalId = transcationUomInternalId;

								 if (processType != 'Inventory' && processType != 'putAway' && processType != 'BinTransfer') {

									 var currentUser = runtime.getCurrentUser();
									 var lockError = utility.checkTransactionLock(transactionType, transactionInternalId, transactionLineNo);
									 if (lockError != null) {
										 log.debug({
											 title: 'Locked Transcation',
											 details: lockError
										 });
										 binListArray.errorMessage = lockError;
										 binListArray.itemName = itemName;
										 binListArray.isValid = false;
										 return binListArray;
									 }
									 binListDetails.currentUser = currentUser;
									 binListDetails.lockError = lockError;
									 var overageReceiveEnabled = false;
									 overageReceiveEnabled = inboundUtility.getPoOverage(transactionType);
									 binListDetails.overageReceiveEnabled = overageReceiveEnabled;
									 var qtyCheckFlag = false;
									 debugString = debugString + ",itemInternalId :" + itemInternalId;
									 var crossSubsidiaryFeature = false;
									 if (transactionType == 'returnauthorization') {
										 crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
									 }
									 var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();

									 var poLineDetails = inboundUtility.getRecevingOrderItemDetails(transactionName, itemInternalId, warehouseLocationId,
										 transactionLineNo, null, null, transactionType, crossSubsidiaryFeature, centralizesPurchasingandBilling, warehouseLocationName);
									 debugString = debugString + ",poLineDetails :" + poLineDetails;
									 if (poLineDetails != null && poLineDetails.length > 0) {
										 var transactionInternalId = poLineDetails[0].internalid;
										 var openPutAwayDetails = inboundUtility.getOpentaskOpenPutwayDetails(transactionInternalId, warehouseLocationId, itemInternalId,
											 transactionLineNo);
										 var poLineReceivedQty = 0;
										 var poLineRemainingQty = 0;
										 var vpoitemOPentaskRcvQty = 0;
										 for (var j = 0; j < poLineDetails.length; j++) {
											 var poRec = poLineDetails[j];
											 var polineno = poRec.line;
											 var poqty = poRec.quantity;
											 binListDetails.pocheckinqty = poqty;
											 if (!utility.isValueValid(transactionUomName)) {
												 transactionUomName = poRec.unit;
											 }
											 transcationUomInternalId = poRec.unit;

											 if (JSON.stringify(openPutAwayDetails) !== '{}') {
												 vpoitemOPentaskRcvQty = openPutAwayDetails[polineno];
												 if (utility.isValueValid(vpoitemOPentaskRcvQty)) {
													 poLineReceivedQty = poRec.totalReceivedQty;
													 if (transactionType == 'transferorder') {
														 poLineRemainingQty = poRec.TransferOrderLine_Remainingqty;
														 poRec.TransferOrderLine_Remainingqty = Number(big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
													 } else if (transactionType == 'returnauthorization') {
														 poLineRemainingQty = poRec.rmaRemainingQty;
														 poRec.rmaRemainingQty = Number(big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
													 } else {
														 poLineRemainingQty = poRec.poRemainingQty;
														 poRec.poRemainingQty = Number(big(poLineRemainingQty).minus(vpoitemOPentaskRcvQty));
													 }

													 poRec.totalReceivedQty = Number(big(poLineReceivedQty).plus(vpoitemOPentaskRcvQty));

												 }
											 }
											 var transactionLineRemainingQty = 0;

											 if (transactionType == 'transferorder') {
												 transactionLineRemainingQty = poRec.TransferOrderLine_Remainingqty;
											 } else if (transactionType == 'returnauthorization') {
												 transactionLineRemainingQty = poRec.rmaRemainingQty;
											 } else {
												 transactionLineRemainingQty = poRec.poRemainingQty;
											 }


											 debugString = debugString + ",transactionLineRemainingQty :" + transactionLineRemainingQty;
											 if (parseFloat(transactionLineRemainingQty) > 0) {
												 qtyCheckFlag = true;
												 break;
											 }
										 }
									 }
									 if (!qtyCheckFlag) {
										 binListArray.errorMessage = translator.getTranslationString("PO_BINLIST.TRANSACTION_COMPLETED");
										 binListArray.isValid = false;
										 return binListArray;
									 }
									 binListDetails.qtyCheckFlag = qtyCheckFlag;
								 }
							 }
						 }

						 var stockConversionRate = 1;
						 debugString = debugString + ",stockUnitName :" + stockUnitName;
						 if (utility.isValueValid(stockUnitName) && stockUnitName != '- None -') {
							 var results = utility.getUnitsType(unitType);
							 debugString = debugString + ",results :" + results;
							 if (results.length > 0) {
								 var uomListArr = [];
								 for (var uomCnt in results) {
									 var rec = results[uomCnt];
									 debugString = debugString + ",rec :" + rec;
									 var conversionRate = rec.conversionrate;
									 var unitName = rec.unitname;
									 var row = {'value': unitName, 'id': conversionRate};
									 uomListArr.push(row);
									 if (!utility.isValueValid(transactionUomConversionRate)) {
										 if (transactionUomName == unitName) {
											 transactionUomConversionRate = conversionRate;
										 }
									 }
								 }
							 }
							 stockConversionRate = transactionUomConversionRate;
							 if (utility.isValueValid(unitType) &&
								 ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && ((blnMixItem == false || blnMixItem == "false") && (blnMixLot == false || blnMixLot == 'false')))
								 || ((itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && (blnMixItem == false || blnMixItem == "false"))) {
								 if (results.length > 0) {
									 binListDetails.uomList = uomListArr;
									 binListDetails.uomDefaultStatus = transactionUomName;
								 }
							 }
							 debugString = debugString + ",unitType :" + unitType;
							 var str = itemResultObj.stockunitText;
							 debugString = debugString + ",itemResultObj.stockunitText :" + str;
							 debugString = debugString + ",transactionUomConversionRate :" + transactionUomConversionRate;

							 debugString = debugString + ",stockConversionRate :" + stockConversionRate;
						 }
						 binListDetails.stockConversionRate = stockConversionRate;
						 itemObj.stockConversionRate = stockConversionRate;

						 //log.debug({title:'itemObj[fromBinInternalId]',details:itemObj.fromBinInternalId});
						 var binList = [];
						 if ((itemType != "noninventoryitem" && itemType != "otherchargeitem" &&
							 itemType != "serviceitem" && itemType != "downloaditem" && itemType != "giftcertificateitem")) {

							 var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
							 if (inventoryStatusFeature) {
								 var statusList = [];
								 var inventoryStatusOptions = utility.getInventoryStatusOptions();
								 log.debug({title: 'inventoryStatusOptions', details: inventoryStatusOptions});

								 if (inventoryStatusOptions.length > 0) {
									 var row = {'value': 'All', 'id': 'All'};
									 statusList.push(row);
									 for (var invtStatus in inventoryStatusOptions) {
										 var inventoryStatusRow = inventoryStatusOptions[invtStatus];
										 var statusText = inventoryStatusRow.name;
										 var statusId = inventoryStatusRow.internalid;
										 var row = {'value': statusText, 'id': statusId};
										 statusList.push(row);
									 }
								 }
								 if (statusList.length > 0) {
									 binListDetails.statusList = statusList;
									 binListDetails.selectedStatusName = fromStatusName;
								 }
							 }
							 itemObj.selectedConversionRate = selectedConversionRate;
						 }

					 }
						 var systemRule = 'N';
                    if(transactionType!=null && transactionType!='')
                    {
                       
                        if(transactionType=='purchaseorder')
                        {
                            processType= "Purchase Order";
                        }
                        else if(transactionType=='transferorder')
                        {
                            processType= "Transfer Order";
                        }
                        else if(transactionType=='returnauthorization')
                        {
                            processType= "Returns";
                        }

                        log.debug('processType',processType);
                    }
						if(processType != 'Inventory' && processType != 'putAway' && processType != 'BinTransfer')
						{
							//systemRule = utility.getSystemRuleValue('Stage received items before putting away?', warehouseLocationId);
							systemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?',warehouseLocationId,processType);
							debugString = debugString + ",systemRule :"+systemRule;

						}
						else
						{
							var fromBinDirection = '';
							var	fromBinType = '';
							if(processType == 'BinTransfer')
							{
								var fields = ['custrecord_wmsse_bin_stg_direction','custrecord_wmsse_bin_loc_type'];
								var fromBinTypeRec = search.lookupFields({
									type: 'Bin',
									id: fromBinInternalId,
									columns: fields
								});

								fromBinType = fromBinTypeRec.custrecord_wmsse_bin_loc_type;
								fromBinDirection = fromBinTypeRec.custrecord_wmsse_bin_stg_direction;
								if(fromBinType != undefined && fromBinType[0] != undefined &&  fromBinDirection != undefined && 
										fromBinDirection[0] != undefined)
								{
									if(fromBinType[0].text == 'Stage' )
									{
										systemRule ='Y';
										itemObj.fromBinInternalId=fromBinInternalId;
										log.debug({title:'fromBinInternalId',details:fromBinInternalId});
									}
								}
							}

						}
						debugString = debugString + ",systemRule :"+systemRule;
						log.debug({title:'systemRule',details:systemRule});
						itemObj.fromStatusId=fromStatusId;
						if (systemRule == 'N'){
							if(locationUseBinlFlag == true){
								itemObj.fromBinInternalId=fromBinInternalId;
							}
							var abcVelocityResults =  null;
							if(processType == 'Inventory')
							{
								abcVelocityResults = inboundUtility.getItemABCVelocityDetails(itemInternalId,fromWarehouseLocationId);
							}
							else
							{
								abcVelocityResults = inboundUtility.getItemABCVelocityDetails(itemInternalId,warehouseLocationId);
							}
							if(abcVelocityResults != null && abcVelocityResults.length > 0)
							{
								for (var itemItr = 0; itemItr < abcVelocityResults.length; itemItr++) {
									var itemRec = abcVelocityResults[itemItr];
									if (itemRec.inventorylocation == warehouseLocationId) {
										itemObj.locationinvtclassification = itemRec.locationinvtclassification;//ABC velocity param
										break;
									}
								}
							}
							binListDetails.binList = utility.getPutBinAndIntDetails(itemObj);
							binListDetails.tableHeaderText = 'Bin Locations';
							itemObj.fromBinInternalId=null;
						}
						else
						{
							var stageDirection = '';
							if(fromBinType != undefined && fromBinType[0] != undefined &&  fromBinDirection != undefined && 
									fromBinDirection[0] != undefined)
							{
								stageDirection = fromBinDirection[0].text;
							}
							log.debug({title:'stageDirection',details:stageDirection});
							itemObj.fromBinInternalId=fromBinInternalId;
							itemObj.warehouseLocationId = warehouseLocationId;
							binList = inboundUtility.getStageBinDetails(itemObj,processType,fromStatusId,inventoryStatusFeature,stageDirection);
							if(processType == 'BinTransfer' && stageDirection == 'In' && randomTallyScan != "T")
							{
								binList = binList.concat(utility.getPutBinAndIntDetails(itemObj));

							}
							binListDetails.tableHeaderText = 'Staging Bin Locations';
							binListDetails.binList = binList;
						}

					//log.debug({title:'itemObj[fromBinInternalId]',details:itemObj.fromBinInternalId});
					//
					binListDetails.isValid = true;
					var tdate =  new Date();
					log.debug({title:'timeStamp at the end of the Restlet',details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});
					return binListDetails;

				}
				else{
					var binListDetails = {
							errorMessage: translator.getTranslationString("PO_BINLIST.NOMATCH"),
							isValid: false
					};
					log.debug({title:'debugString',details:debugString});
					return binListDetails;

				}
			}
			else{
				var binListDetails = {
						errorMessage: translator.getTranslationString("PO_BINLIST.NOMATCH"),
						isValid: false
				};
				log.debug({title:'debugString',details:debugString});
				return binListDetails;
			}
		}
		catch(e)
		{
			binListDetails.isValid = false;
			binListDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
			return  binListDetails;   
		}


	}

	/**
	 *
	 * @param Binnumber
	 * @param warehouseLocationId
	 * @param Item
	 * @returns {string}
	 */
	function getPreferredBinType(Binnumber, warehouseLocationId, Item) {
		var preferredbintype = '';
		var filter = [];
		if (utility.isValueValid(Binnumber)) {
			filter.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.IS,
				values: Binnumber
			}));
		}

		filter.push(
				search.createFilter({
					name: 'inactive',
					operator: search.Operator.IS,
					values: false
				}));
		if (utility.isValueValid(warehouseLocationId)) {
			filter.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
		}

		var columns = new Array();
		columns[0] = search.createColumn({
			name: 'custrecord_wmsse_bin_loc_type'
		});
		var binsearch = search.create({
			type: 'Bin',
			filters: filter,
			columns: columns
		});
		var searchrecord = binsearch.run().getRange({start: 0, end: 1000});
		if (searchrecord != null && searchrecord != "") {
			preferredbintype = searchrecord[0].getText({
				name: 'custrecord_wmsse_bin_loc_type'
			});

		}
		return preferredbintype;
	}

	function getYetToBePicked(itemInternalId,binList,warehouseLocationId,unitType,stockUnitName) {
		if (utility.isValueValid(itemInternalId)) {
			var shipCheckFlag = false;
			var ctx = runtime.executionContext;
			if (ctx != null && ctx != '') {
				if (runtime.isFeatureInEffect({feature: "pickpackship"}).toString() != null && 
						runtime.isFeatureInEffect({feature: "pickpackship"}).toString() != '')
					shipCheckFlag = runtime.isFeatureInEffect({feature: "pickpackship"});
			}
			var committedQty =0;
			if (shipCheckFlag) 
			{
				var orderDetailsSearch = search.load({
					id: 'customsearch_wmsse_open_pickable_qty_shp'
				});
				var filters = orderDetailsSearch.filters;
				filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));

				if (utility.isValueValid(warehouseLocationId))
					filters.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));

				orderDetailsSearch.filters = filters;
				var OrderDetails = orderDetailsSearch.run().getRange({start: 0, end: 1000});
				if (utility.isValueValid(OrderDetails) && OrderDetails.length > 0) {
					var columnsList = OrderDetails[0].columns;
					var commitedQtyIndex = 25;
					for (var x1 = 0; x1 < columnsList.length; x1++) {
						var summaryLabel = columnsList[x1].label;
						if (summaryLabel == 'Quantity Committed') {
							commitedQtyIndex = x1;
						}
					}
					for (var j = 0; j < OrderDetails.length; j++) {
						committedQty = OrderDetails[j].getValue(columnsList[commitedQtyIndex]);
					}
				}
			}
			else {
				var orderDetailsSearch = search.load({
					id: 'customsearch_wmsse_open_pickable_qty_shp'
				});
				var filters = orderDetailsSearch.filters;
				var columns = new Array();

				filters.push(search.createFilter({
					name: 'item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));


				if (warehouseLocationId != null && warehouseLocationId != '' && warehouseLocationId != 'undefined' && warehouseLocationId != 'null')
					filters.push(search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));

				orderDetailsSearch.filters = filters;

				var orderDetails = orderDetailsSearch.run().getRange({start: 0, end: 1000});


				if (orderDetails != null && orderDetails != '' && orderDetails != 'null' &&
						orderDetails != 'undefined' && orderDetails.length > 0) {
					for (var j = 0; j < orderDetails.length; j++) {
						committedQty = orderDetails[j].getValue({name: 'quantitycommitted', summary: 'sum'});
					}
				}

			}

			var openTaskPickBinDetails = utility.getOpenTaskPickBinDetails(itemInternalId, binList, warehouseLocationId,
					unitType, stockUnitName);
			var openTaskBinIdArr = "";
			var openTaskBinQtyArr = "";
			if (openTaskPickBinDetails != null && openTaskPickBinDetails != '' && openTaskPickBinDetails.length > 0) {
				openTaskBinIdArr = openTaskPickBinDetails[0];
				openTaskBinQtyArr = openTaskPickBinDetails[1];
			}
			var openBinQty = 0;
			if (openTaskBinIdArr != null && openTaskBinIdArr != "") {
				for (var f = 0; f < openTaskBinQtyArr.length; f++) {
					openBinQty = parseFloat(openBinQty) + parseFloat(openTaskBinQtyArr[f]);
				}
			}
			if (!utility.isValueValid(openBinQty))
			{
				openBinQty = 0;
			}
			if (!utility.isValueValid(committedQty))
			{
				committedQty = 0;
			}
			var finalYetToBePicked = 0;
			finalYetToBePicked = parseFloat(committedQty) - parseFloat(openBinQty);//

			var backorderdQtyDetsSearch = search.load({
				id: 'customsearch_wmsse_backorder_qty_det'
			});

			var filtersback = backorderdQtyDetsSearch.filters;
			filtersback.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));

			if (utility.isValueValid(warehouseLocationId))
				filtersback.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', warehouseLocationId]
				}));

			backorderdQtyDetsSearch.filters = filtersback;
			var backorderdQtyDets = backorderdQtyDetsSearch.run().getRange({start: 0, end: 1000});
			var BackorderdQty = 0;
			if (backorderdQtyDets != null && backorderdQtyDets != '' &&
					backorderdQtyDets != 'null' && backorderdQtyDets != 'undefined' && backorderdQtyDets.length > 0)
			{
				var vColumnslist1 = backorderdQtyDets[0].columns;

				var backOrderedQtyIndex = 25;
				var summaryLabel ='';
				for (var x2 = 0; x2 < vColumnslist1.length; x2++) {
					summaryLabel = vColumnslist1[x2].label;
					if (summaryLabel == 'Back order quantity') {
						backOrderedQtyIndex = x2;
					}
				}

				for (var B = 0; B < backorderdQtyDets.length; B++) {
					BackorderdQty = backorderdQtyDets[B].getValue(vColumnslist1[backOrderedQtyIndex]);
				}
			}

			var PickedBackOrd = new Array();

			if (finalYetToBePicked > 0)
			{
				PickedBackOrd.push(finalYetToBePicked);
			}
			else
			{
				PickedBackOrd.push(0);
			}
			if (BackorderdQty > 0)
			{
				PickedBackOrd.push(BackorderdQty);
			}
			else
			{
				PickedBackOrd.push(0);
			}

			return PickedBackOrd;
		} //
	}


	return {
		'post': doPost
	};

});
