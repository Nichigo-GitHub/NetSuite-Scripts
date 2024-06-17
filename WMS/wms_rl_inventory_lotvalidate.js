/**
 *    Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/format'],
		/**
		 * @param {search} search
		 */
		function(search,utility,Big,translator,format) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {

		var lotValidateArr ={};
		var debugString = '';
		debugString = debugString +"requestBody : "+requestBody;
		var requestParams = '';
		try{
			if(utility.isValueValid(requestBody))
			{
				requestParams = requestBody.params;
				var lotName = requestParams.lotName;
				var fromBinInternalId=requestParams.fromBinInternalId;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var unitType = requestParams.unitType;
				var stockUnitName = requestParams.stockUnitName;
				var scannedQuantity = requestParams.scannedQuantity;
				var processType = requestParams.processType;
				var putawayAll=requestParams.putawayAll;
				var mixLotFlag = requestParams.blnMixLot;
				log.debug({title:'requestParams',details:requestParams});

				if(putawayAll=='putawayAll')
				{
					lotValidateArr["selectedStatusId"] = 'All';
					lotValidateArr["selectedStatusName"] = 'All';
					lotValidateArr["putawayAll"] = putawayAll;
					if(processType == 'inventoryTransfer')
					{
						lotValidateArr["processType"] = processType;
					}
					else if(processType == 'BinTransfer')
					{
						lotValidateArr["processType"] = processType;
					}
					lotValidateArr["isValid"]=true;
				}
				else if(utility.isValueValid(lotName) && utility.isValueValid(warehouseLocationId) &&
						utility.isValueValid(itemInternalId))
				{
					var objBinDetails = [];
					var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
					var  EntLotId = utility.inventoryNumberInternalId(lotName,warehouseLocationId,itemInternalId);
					if(!utility.isValueValid(EntLotId)) {
						var itemResObj = utility.itemValidationForInventoryAndOutBound(lotName, warehouseLocationId);
						if (utility.isValueValid(itemResObj.barcodeIteminternalid)) {
							var barcodeLotname = itemResObj.barcodeLotname;
							var barcodeIteminternalid = itemResObj.barcodeIteminternalid;
							if (barcodeIteminternalid == itemInternalId) {
								EntLotId = utility.inventoryNumberInternalId(barcodeLotname, warehouseLocationId, itemInternalId);
								lotName = barcodeLotname;
							}
						}
					}
					if(!utility.isValueValid(EntLotId))
					{
						lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
						lotValidateArr["isValid"]=false;
					}
					else
					{
						var balanceSearch=search.load({id:'customsearch_wmsse_inventorybalance',type:search.Type.INVENTORY_BALANCE});
						var filters = balanceSearch.filters;
						if(utility.isValueValid(itemInternalId))
						{
							filters.push(search.createFilter({name:'internalid'
								,join:'item',
								operator:search.Operator.ANYOF,
								values:itemInternalId}));
						}
						if(utility.isValueValid(fromBinInternalId))
						{
							filters.push(search.createFilter({name:'binnumber',
								operator:search.Operator.ANYOF,
								values:fromBinInternalId}));
						}
						if(utility.isValueValid(warehouseLocationId))
						{
							filters.push(search.createFilter({name:'location',
								operator:search.Operator.ANYOF,
								values:warehouseLocationId}));
						}
						if(utility.isValueValid(EntLotId))
						{
							filters.push(search.createFilter({name:'inventorynumber',
								operator:search.Operator.ANYOF,
								values:EntLotId}));
						}
						balanceSearch.filters = filters;
						objBinDetails = utility.getSearchResultInJSON(balanceSearch);

					}
					var lotStatusDetailsArr =  [];
					if(objBinDetails.length>0)
					{
						var binLocArr = [];
						if(utility.isValueValid(requestParams.toBinInternalId) && utility.isValueValid(requestParams.processType) &&
								requestParams.processType == 'putAway' && utility.isValueValid(mixLotFlag)
								&& (mixLotFlag == false || mixLotFlag == 'false') ) {
							if(utility.isValueValid(fromBinInternalId))
							{
							var fields = ['custrecord_wms_iscart'];
							var fromBinType = search.lookupFields({
								type: 'Bin',
								id: fromBinInternalId,
								columns: fields
							});
							if (fromBinType != undefined && fromBinType.custrecord_wms_iscart != undefined) {
								var isCart = fromBinType.custrecord_wms_iscart;
								if ( utility.isValueValid(isCart) && isCart == true) {
									binLocArr = utility.fnGetInventoryBinsForLot(warehouseLocationId, lotName, itemInternalId, requestParams.toBinInternalId);
								}
							}
						  }
						}
						if(binLocArr.length > 0){
							lotValidateArr["errorMessage"] = translator.getTranslationString('INVENTORY_QUANTITYVALIDATE.MIXLOTS_FALSE');
							lotValidateArr["isValid"] = false;
						}
						else{
							var systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?',warehouseLocationId);
							var isLotExpiryDateValid = true;
							if(systemRule_AllowExpiredItems == 'N'  && processType == 'putAway')
							{
								var currDate = utility.DateStamp();
								currDate = format.parse({
									value: currDate,
									type: format.Type.DATE
								});
								currDate = format.format({
									value: currDate,
									type: format.Type.DATE
								});
								var dateFormat = utility.DateSetting();
								var defalutExpiryDate  = utility.setExpiryDate(dateFormat,'01','01','2199');

								var lotExpirySearch = search.load({id:'customsearch_wmsse_expdate_lots'});
								var filtersExp = lotExpirySearch.filters;
								if (utility.isValueValid(itemInternalId)){
									filtersExp.push(search.createFilter({name:'internalid',
										operator:search.Operator.ANYOF,
										values:itemInternalId}));		 
								}
								if(utility.isValueValid(warehouseLocationId))
								{
									filtersExp.push(search.createFilter({name:'location',
										join:'inventorynumber',
										operator:search.Operator.ANYOF,
										values:warehouseLocationId}));		 
								}
								filtersExp.push(search.createFilter({name:'inventorynumber',
									operator:search.Operator.IS,
									join:'inventorynumber',
									values:lotName}));
								filtersExp.push(search.createFilter({name:'formuladate',
									formula:"NVL({inventorynumber.expirationdate},TO_DATE('"+defalutExpiryDate+"','"+dateFormat+"'))",
									operator:search.Operator.ONORAFTER,
									values:currDate}));
								lotExpirySearch.filters = filtersExp;

								var searchresultsExp = utility.getSearchResultInJSON(lotExpirySearch);
								debugString = debugString +", searchresultsExp : "+searchresultsExp;
								if(searchresultsExp.length == 0)
								{
									lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT_EXPIRYDATE');
									lotValidateArr["isValid"]=false;
									isLotExpiryDateValid = false;
								}

							}
							debugString = debugString +", isLotExpiryDateValid : "+isLotExpiryDateValid;
							if(isLotExpiryDateValid)
							{
								var availableQty=0;
								var vinventoryNumberBinOnHand='';
								var vmakeInvAvailFlag = true;
								var vLocDetails = search.lookupFields({
									type: search.Type.LOCATION,
									id: warehouseLocationId,
									columns: ['makeinventoryavailable']
								});
								vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
								var vInvLot='';
								var vInvLotId='';
								var statusId ='';
								var statusName='';
								var vBinQtyAvail='';
								for(var k in  objBinDetails)
								{

									statusId = objBinDetails[k]['status'];
									statusName = objBinDetails[k]['statusText'];									
									vInvLot = objBinDetails[k]['inventorynumberText'];
									vInvLotId = objBinDetails[k]['inventorynumber'];

									if(vInvLot == lotName)
									{
										vBinQtyAvail='';
										if(vmakeInvAvailFlag)
										{
											vBinQtyAvail=objBinDetails[k]['available'];
										}
										else
										{
											vBinQtyAvail=objBinDetails[k]['onhand'];
										}

										if(vBinQtyAvail > 0 && inventoryStatusFeature == true &&
												lotStatusDetailsArr.indexOf(statusId)==-1)
										{
											var currentRow = [statusId,statusName];
											lotStatusDetailsArr.push(currentRow);
										}
										availableQty=Big(availableQty).plus(vBinQtyAvail);
										vinventoryNumberBinOnHand=objBinDetails[k]['inventorynumberText'];
									}
								}
								if(processType!='putAway')
								{
									if(!utility.isValueValid(scannedQuantity))
									{
										scannedQuantity = availableQty;
									}
									if((parseFloat(availableQty)<=0 || ( parseFloat(availableQty) < parseFloat(scannedQuantity)) )
											|| (lotName != vinventoryNumberBinOnHand))
									{
										lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY');
										lotValidateArr["isValid"]=false;
									}
									else
									{
										lotValidateArr["availbleQuanity"] =Number(availableQty);
										lotValidateArr["lotName"] = lotName;
										lotValidateArr["lotInternalId"] = vInvLotId;
										lotValidateArr["scannedQuantity"] = scannedQuantity;
										lotValidateArr["isValid"]=true;
										if(lotStatusDetailsArr.length > 0){
											if(lotStatusDetailsArr.length > 1)
											{
												lotValidateArr["fromBinInternalId"]=fromBinInternalId;									
												lotValidateArr["statusLength"]=lotStatusDetailsArr.length;
												lotValidateArr["showTransferAllBtnInQty"] = "Y";
												lotValidateArr["showInvStatusPage"] = "Y";
											}
											else
											{
												var statusRow = lotStatusDetailsArr[0];
												lotValidateArr["statusInternalId"]= statusRow[0];
												lotValidateArr["statusName"] = statusRow[1];
												lotValidateArr["showTransferAllBtnInQty"] = "N";
												lotValidateArr["showInvStatusPage"] = "N";
											}
										}
									}
								}
								else
								{
									if((lotName != vinventoryNumberBinOnHand))
									{
										lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.LOT_INSUFFICIENTINVENTORY');
										lotValidateArr["isValid"]=false;
									}
									else
									{
										lotValidateArr["availbleQuanity"] =Number(availableQty);
										lotValidateArr["lotName"] = lotName;
										lotValidateArr["lotInternalId"] = vInvLotId;
										lotValidateArr["isValid"]=true;
										if(lotStatusDetailsArr.length > 0){
											if(lotStatusDetailsArr.length > 1)
											{
												lotValidateArr["fromBinInternalId"]=fromBinInternalId;									
												lotValidateArr["statusLength"]=lotStatusDetailsArr.length;
											}
											else
											{
												var statusRow = lotStatusDetailsArr[0];
												lotValidateArr["statusInternalId"]= statusRow[0];
												lotValidateArr["statusName"] = statusRow[1];
											}
										}
									}
								}
							}
						}
					}
					else
					{
						lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
						lotValidateArr["isValid"]=false;
					}
				}
				else
				{
					lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
					lotValidateArr["isValid"]=false;
				}
			}
			else
			{
				lotValidateArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_LOTVALIDATE.INVALID_LOT');
				lotValidateArr["isValid"]=false;
			}
		}
		catch(e)
		{
			lotValidateArr['isValid'] = false;
			lotValidateArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug({title:'debugString',details:debugString});
		return lotValidateArr;

	}



	return {
		'post': doPost
	};

});
