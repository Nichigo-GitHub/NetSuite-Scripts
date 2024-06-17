/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/runtime', 'N/config','./wms_utility','./big','./wms_translator','./wms_inboundUtility'],

		function (search, runtime, config,utility,big,translator,inboundUtility) {

	/**
	         This function is to fetch the bin locations
	 */
	function doPost(requestBody) {

		var binListDetails = {}; 
		var debugString = '';
		try{

			if (utility.isValueValid(requestBody)) {

				var requestParams                               =      requestBody.params;
				var binListArray                                =      {};
				var fromStatusName                              =      requestParams.fromStatusName;
				var fromStatusId                                =      requestParams.fromStatusId;
				var transactionType                             =      requestParams.transactionType;
				var	transactionInternalId                       =      requestParams.transactionInternalId;
				var transactionUomName                          =      requestParams.transactionUomName;
				var transcationUomInternalId                    =      requestParams.transcationUomInternalId;
				var transactionUomConversionRate                =      requestParams.transactionUomConversionRate;
				var itemInternalId                              =      requestParams.itemInternalId;
				var warehouseLocationId                         =      requestParams.warehouseLocationId;
				var itemName                                    =      requestParams.itemName;
				var lotName                                     =      requestParams.lotName;
				var selectedConversionRate                      =      '';
				var selectedUOMText                             =      '';
				var transactionUomConversionRate                =      '';
				var processType                             	= 'ISM';

				if(processType!=null && processType!='')
				{
					log.debug('processType processType',processType);
					if(processType =='ISM')
					{
						tranType= "Inbound Shipment";
					}

					log.debug('tranType11',tranType);
				}

				if(utility.isValueValid(requestParams.uomList))
				{
					var selectedUomList       =  requestParams.uomList;
					selectedConversionRate    =  selectedUomList.id;
					selectedUOMText           =  selectedUomList.value;
				}
				if(utility.isValueValid(requestParams.statusList))
				{
					var selectedStatusList   =  requestParams.statusList;
					fromStatusId             =  selectedStatusList.id;
				}

				log.debug({title:'requestParams ',details:requestParams});
				if (utility.isValueValid(warehouseLocationId)) {

					var departments =runtime.isFeatureInEffect({
						feature: 'departments'
					});
					var classes =runtime.isFeatureInEffect({
						feature: 'classes'
					});

					var preferedBinName        =  '';
					var preferedBinInternalId  =  '';
					var preferedBinType        =  '';
					var itemType               =  '';
					var itemResults            =  '';
					var itemGroup              =  "";
					var itemFamily             =  "";
					var blnMixItem             =  true;
					var blnMixLot              =  true;
					var stockUnitName          =  "";
					var unitType               =  '';
					var department             =  "";
					var vClass                 =  "";

					itemResults                =  inboundUtility.getItemDetails(itemInternalId,warehouseLocationId);

					var itemObj = {};
					itemObj['warehouseLocationId']   = warehouseLocationId;
					debugString = debugString + "itemResults :"+itemResults;
					log.debug({title:'itemResults ',details:itemResults});
					if (itemResults != null && itemResults.length > 0){

						var itemResultObj  = itemResults[0];
						var itemresultsStr = itemResultObj;
						debugString        = debugString + "itemResultObj :"+itemresultsStr;
						log.debug({title:'itemresultsStr ',details:itemresultsStr});
						if (itemResultObj['isinactive'] == true) {

							binListArray["errorMessage"] = translator.getTranslationString("PO_BINLIST.INACTIVE_ITEM");
							binListArray['isValid'] = false;
							return binListArray;
						}
						else
						{
							itemType = itemResultObj['recordType'];
							binListDetails['itemType'] = itemType;
							log.debug({title:'itemType ',details:itemType});
							for (var d = 0; d < itemResults.length; d++) {

								var itemResultsRec = itemResults[d];

								if (itemResultsRec['preferredbin'] == true && (itemResultsRec['location'] == warehouseLocationId)) {

									preferedBinName         = itemResults[d]['binnumber'];

									break;
								}

							}
							if(utility.isValueValid(preferedBinName))
							{
								preferedBinInternalId   = inboundUtility.getValidBinInternalId(preferedBinName, warehouseLocationId, null);
								preferedBinType         = getPreferredBinType(preferedBinName, warehouseLocationId, null); //Not in general function
								var preferBinQtyDetails = inboundUtility.getBinwiseQtyDetails(preferedBinInternalId, warehouseLocationId);

								binListDetails['preferedBinQtyDetails'] = preferBinQtyDetails;
								binListDetails['preferedBinName']       = preferedBinName;
								binListDetails['preferedBinInternald']  = preferedBinInternalId;
								binListDetails['preferedBinType']       = preferedBinType;
							}
							blnMixItem    = itemResultObj['custitem_wmsse_mix_item'];
							blnMixLot     = itemResultObj['custitem_wmsse_mix_lot'];
							itemGroup     = itemResultObj['custitem_wmsse_itemgroup'];
							itemFamily    = itemResultObj['custitem_wmsse_itemfamily'];
							stockUnitName = itemResultObj['stockunit'];
							unitType      = itemResultObj['unitstype'];
							itemName      = itemResultObj['itemid'];

							itemObj['itemInternalId']        = itemInternalId;
							itemObj['itemGroup']             = itemGroup;
							itemObj['itemFamily']            = itemFamily;
							itemObj['blnMixItem']            = blnMixItem;
							itemObj['blnMixLot']             = blnMixLot;
							itemObj['preferedBinName']       = preferedBinName;							
							itemObj['itemType']              = itemType;
							itemObj['lotName']               = lotName;
							itemObj['preferedBinInternalId'] = preferedBinInternalId;

							binListDetails['isQtyScanned']   = true;
							binListDetails['itemName']   = itemName;
							binListDetails['blnMixItem'] = blnMixItem;
							binListDetails['blnMixLot']  = blnMixLot;
							binListDetails['unitType']   = unitType;
							
							log.debug({title:'itemObj ',details:itemObj});
							
							if(utility.isValueValid(requestParams.uomList))
							{
								itemObj['selectedUOMText']   =   selectedUomList.value;
								transactionUomName           =   itemResultObj['stockunitText'];
							}
							else
							{
								if(utility.isValueValid(stockUnitName))
								{
									if (utility.isValueValid(unitType) && 
											((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem") && ((blnMixItem == false ||
													blnMixItem == "false")
													&& (blnMixLot == false || blnMixLot == 'false')) )
													|| ((itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" ||
															itemType=="serializedassemblyitem") && (blnMixItem == false || blnMixItem == "false") ) )
									{

										itemObj['selectedUOMText']=itemResultObj['stockunitText'];

									}
									transactionUomName = itemResultObj['stockunitText'];
								}

							}
							debugString = debugString + ",transactionUomName :"+transactionUomName;
							var stritemObj = itemObj;
							debugString = debugString + ",itemObj :"+stritemObj;
							if (departments == true)
							{
								department = itemResults[0]['department'];
							}
							if (classes == true)
							{
								vClass = itemResults[0]['class'];
							}

							if ((!utility.isValueValid(department))|| (!utility.isValueValid(vClass))) {
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

							itemObj['department']               =  department;
							itemObj['class']                    =  vClass;
							itemObj['transcationUomInternalId'] =  transcationUomInternalId;
						}
					}
					var stockConversionRate = 1;
					debugString = debugString + ",stockUnitName :"+stockUnitName;
					if (utility.isValueValid(stockUnitName)&& stockUnitName != '- None -') {
						var results = utility.getUnitsType(unitType);
						debugString = debugString + ",results :"+results;
						if(results.length > 0)
						{
							var uomListArr =[];
							for(var uomCnt in results)
							{  
								var rec = results[uomCnt];
								debugString = debugString + ",rec :"+rec;
								var conversionRate = rec['conversionrate'];
								var unitName =rec['unitname'];
								var row = {'value':unitName,'id':conversionRate};
								uomListArr.push(row);
								if(!utility.isValueValid(transactionUomConversionRate))
								{
									if(transactionUomName == unitName)
									{
										transactionUomConversionRate = 	conversionRate;
									}
								}
							}
						}
						stockConversionRate = transactionUomConversionRate;
						if (utility.isValueValid(unitType) && 
								((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem") && ((blnMixItem == false || blnMixItem == "false") && (blnMixLot == false || blnMixLot == 'false')) )
								|| ((itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem") && (blnMixItem == false || blnMixItem == "false") ) ) 
						{
							if(results.length > 0)
							{
								binListDetails['uomList']          = uomListArr;
								binListDetails['uomDefaultStatus'] = transactionUomName ;
							}
						}
						debugString = debugString + ",unitType :"+unitType;
						var str = itemResultObj['stockunitText'];
						debugString = debugString + ",itemResultObj['stockunitText'] :"+str;
						debugString = debugString + ",transactionUomConversionRate :"+transactionUomConversionRate;

						debugString = debugString + ",stockConversionRate :"+stockConversionRate;
					}
					binListDetails['stockConversionRate'] = stockConversionRate;
					itemObj['stockConversionRate'] = stockConversionRate;
					var binList =[];
					log.debug({title:'itemType ',details:itemType});
					if((itemType != "noninventoryitem" && itemType != "otherchargeitem" && 
							itemType != "serviceitem" && itemType != "downloaditem" && itemType != "giftcertificateitem"))
					{
						var systemRule = 'N';
						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
						log.debug({title:'inventoryStatusFeature ',details:inventoryStatusFeature});
						if(inventoryStatusFeature)
						{
							var statusList = [];
							var inventoryStatusOptions = utility.getInventoryStatusOptions();
							log.debug({title:'inventoryStatusOptions',details:inventoryStatusOptions});

							if(inventoryStatusOptions.length>0)
							{
								var row = {'value':'All','id':'All'};
								statusList.push(row);
								for(var invtStatus in  inventoryStatusOptions)
								{                    	 
									var inventoryStatusRow = inventoryStatusOptions[invtStatus];
									var statusText =inventoryStatusRow.name;
									var statusId =inventoryStatusRow.internalid;
									var row = {'value':statusText,'id':statusId};
									statusList.push(row);
								}
							}
							if(statusList.length > 0)
							{
								binListDetails['statusList'] = statusList; 
								if((fromStatusName))
									{
								binListDetails['selectedStatusName'] = fromStatusName;
									}
								else
									{
									binListDetails['selectedStatusName'] = 'All';	
									}
							}
						}
						itemObj['selectedConversionRate']= selectedConversionRate;

						//systemRule = utility.getSystemRuleValue('Stage received items before putting away?', warehouseLocationId);
                        systemRule = utility.getSystemRuleValueWithProcessType('Stage received items before putting away?',warehouseLocationId,tranType);

						log.debug({title:'systemRule',details:systemRule});
						itemObj['fromStatusId']=fromStatusId;
						if (systemRule == 'N'){
							
							var abcVelocityResults = inboundUtility.getItemABCVelocityDetails(itemInternalId,warehouseLocationId);
							if(abcVelocityResults != null && abcVelocityResults.length > 0)
							{
								for (var itemItr = 0; itemItr < abcVelocityResults.length; itemItr++) {
									var itemRec = abcVelocityResults[itemItr];
									if (itemRec['inventorylocation'] == warehouseLocationId) {
										itemObj['locationinvtclassification'] = itemRec.locationinvtclassification;//ABC velocity param
										break;
									}
								}
							}
							
							binList = utility.getPutBinAndIntDetails(itemObj);
							binListDetails['tableHeaderText'] = 'Bin Locations';
						}
						else
						{
							binList = inboundUtility.getStageBinDetails(itemObj,'',fromStatusId,inventoryStatusFeature,'');
							binListDetails['tableHeaderText'] = 'Staging Bin Locations';
						}
					}
					binListDetails['binList'] = binList;
					binListDetails['isValid'] = true;
					log.debug({title:'debugString',details:debugString});
					var tdate =  new Date();
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
			binListDetails['isValid'] = false;
			binListDetails['errorMessage'] = e.message;
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

	/*function getStageBinDetails(objItemDetails,invstatus,inventoryStatusFeature) {

		var preferedBinName = objItemDetails['preferedBinName'];
		var strLocation  =objItemDetails['warehouseLocationId'];
		var preferedBinInternalId = objItemDetails['preferedBinInternalId'];
		var selectedConvRate = objItemDetails['selectedConversionRate'];
		var currentConvRate = objItemDetails['stockConversionRate'];
		var selectedUOMText = objItemDetails['selectedUOMText'];
		var vBinLocArr = [];

		var objBinDetailsSearch = search.load({
			id : 'customsearch_stage_bindetails'
		});


		var filterStrat = objBinDetailsSearch.filters;

		var stgLocId = -1;

		filterStrat.push(search.createFilter({
			name: 'custrecord_wmsse_bin_stg_direction',
			operator: search.Operator.ANYOF,
			values: ['1']
		}));
		if (utility.isValueValid(strLocation)) {
			filterStrat.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: strLocation
			}));
		}

		objBinDetailsSearch.filters = filterStrat;
		var objBinDetails = utility.getSearchResultInJSON(objBinDetailsSearch);
		log.debug({title:'objBinDetails11',details:objBinDetails});
		var vValidBinIdArr =[];
		var vValidBinIdTxtArr =[];
		var binIdArr = [];
		if (objBinDetails.length > 0) {
			for (var j = 0; j < objBinDetails.length; j++) {
				var objBinDetailsRec = objBinDetails[j];
				var vValidBinId = objBinDetailsRec['internalid'];
				var vValidBinText = objBinDetailsRec['binnumber'];
				vValidBinIdArr.push(vValidBinId);
				vValidBinIdTxtArr.push(vValidBinText);
			}
			log.debug({title:'vValidBinIdArr',details:vValidBinIdArr});
			var objBinStatusDetails = search.load({
				id : 'customsearch_wmsse_stagebin_statusdetail',
				type:search.Type.INVENTORY_BALANCE,
			});
			var filterStrat = objBinStatusDetails.filters;

			if (utility.isValueValid(strLocation)) {
				filterStrat.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: strLocation
				}));
			}
			if (vValidBinIdArr.length > 0) {
				filterStrat.push(search.createFilter({
					name: 'binnumber',
					operator: search.Operator.ANYOF,
					values: vValidBinIdArr
				}));
			}

			if (utility.isValueValid(invstatus)) {

				if(invstatus != 'All')
				{
					filterStrat.push(search.createFilter({
						name: 'status',
						operator: search.Operator.ANYOF,
						values: invstatus
					}));	
				}

			}
			objBinStatusDetails.filters = filterStrat;
			var objBinStatusResults = utility.getSearchResultInJSON(objBinStatusDetails);
			log.debug({title:'objBinStatusResults',details:objBinStatusResults});
			if(objBinStatusResults.length >0)
			{
				for(var stsItr in objBinStatusResults)
				{				
					var binStatusDetailsRec = objBinStatusResults[stsItr];
					var statusName = binStatusDetailsRec['statusText'];					
					var binQty=binStatusDetailsRec['onhand'];				
					var statusInternalId = binStatusDetailsRec['status'];
					var binInternalId = binStatusDetailsRec['binnumber'];
					var binQtyAvailWithUOM = binQty;
					if(utility.isValueValid(selectedUOMText))
					{
						binQtyAvailWithUOM = binQty+ " "+selectedUOMText;
					}
					if(utility.isValueValid(binQty) && utility.isValueValid(selectedConvRate) && utility.isValueValid(currentConvRate)
							&& (selectedConvRate != currentConvRate))
					{
						binQty = utility.uomConversions(binQty,selectedConvRate,currentConvRate);
						if(binQty > 0)
						{
							binQtyAvailWithUOM = binQty + " "+selectedUOMText;
						}
					}
					var binName = binStatusDetailsRec['binnumberText'];

					binIdArr.push(binInternalId);
					var currRow = {'binName':binName,'binInternald':binInternalId,'quantity': binQty,'quantityWithUOM':binQtyAvailWithUOM,
							'statusName':statusName,'statusInternalId':statusInternalId};
					vBinLocArr.push(currRow);
				}

			}

			for (var vPutBin = 0; vPutBin < vValidBinIdArr.length; vPutBin++) {
				var blnEmpty = true;
				for (var vInvBal = 0; vInvBal < binIdArr.length; vInvBal++) {
					if (binIdArr[vInvBal] == vValidBinIdArr[vPutBin]) {
						blnEmpty = false;
					}
				}
				if (blnEmpty == true) {

					var currentRowValues = {'binName':vValidBinIdTxtArr[vPutBin],'binInternald':vValidBinIdArr[vPutBin],'quantity':'0','quantityWithUOM':'0'};
					vBinLocArr.push(currentRowValues);

				}
			}
		}
		return vBinLocArr;
	}*/
	return {
		'post': doPost
	};

});
