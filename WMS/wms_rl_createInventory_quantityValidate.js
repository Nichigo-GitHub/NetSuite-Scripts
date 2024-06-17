/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator', 'N/format','./wms_inventory_utility','./big'],
		/**
		 * @param {search} search
		 */
		function (search,utility,translator,format,invtUtility,bigJs) {

	/**
	 * Function to fetch bin details.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 */
	function doPost(requestBody) {
		var debugString = '';
		var response = {};
		var requestParams = '';
		var impactedRecords={};
		var scannedNegativeQuantityValue = 0;
		try{
			if(utility.isValueValid(requestBody)){
				requestParams = requestBody.params;
				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var scannedQuantity = requestParams.scannedQuantity;
				var lotName = requestParams.lotName;
				var enterExpiryDate = requestParams.enterExpiryDate;
				var action = requestParams.action;
				var itemInternalId = requestParams.itemInternalId;
				var dateSetting = utility.DateSetting();
				var itemType = requestParams.itemType;
				var stockConversionRate = requestParams.stockConversionRate;
				var transactionUomName = requestParams.transactionUomName;
				var locUseBinsFlag = requestParams.locUseBinsFlag;

				var statusInternalId = requestParams.statusInternalId;
				var expiryDate = requestParams.lotExpiryDate;
				var warehouseLocationName = requestParams.warehouseLocationName;
				response.requestParams = requestParams;
				if(action == 'validateLotNumber'){
					if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(lotName)
							&& utility.isValueValid(itemInternalId)){
						debugString = debugString + 'dateSetting :'+dateSetting;
						debugString = debugString + 'enterExpiryDate :'+enterExpiryDate;
						var enterLotId = utility.isInventoryNumberExists(itemInternalId, lotName, warehouseLocationId);
						log.debug({title:'enterLotId',details:enterLotId});
						response.lotName = lotName;
						response.isValid = true;
						if(utility.isValueValid(enterExpiryDate))
						{
							log.debug({title:'aenterExpiryDate',details:enterExpiryDate});
							response.enterExpiryDate = enterExpiryDate.toString();
							var getExpDateresult = utility.ValidateDate(enterExpiryDate,dateSetting);
							log.debug({title:'agetExpDateresult',details:enterExpiryDate});
							if (getExpDateresult == null || getExpDateresult == '') {
								var validationMessage = translator.getTranslationString('PO_LOTVALIDATION.EXPIRYDATE_FORMAT');
								response.errorMessage = validationMessage+' '+dateSetting+'.';
								response.isValid = false;
							}
							else {
								var now = utility.convertDate();
								var now1 = now.setHours(0, 0, 0, 0);
								response.now = now1.toString();
								response.getExpDateresult = getExpDateresult.toString();

								if (now > getExpDateresult) {
									response.errorMessage = translator.getTranslationString('PO_LOTVALIDATION.INVALID_EXPRIRYDATE');
									response.isValid = false;
								}
								else{
									response.lotExpiryDate = enterExpiryDate;
								}
							}
						}
						else{
							if (!enterLotId && (!utility.isValueValid(enterExpiryDate))) {// for new lot calculate the expiry date, if not given manually through GUI

								var getExpDateresult = this.getLotNumberExpiryDateBYItemShelfLife(itemInternalId);
								if (utility.isValueValid(getExpDateresult)) {
									if(getExpDateresult != 0){
										response.lotExpiryDate = getExpDateresult;
									}
									else {
										response.lotName = lotName;
										response.errorMessage = translator.getTranslationString('PO_LOTVALIDATION.INVALID_SHELFLIFE');
										response.isValid = false;
									}
								}
							}
						}
						if (enterLotId) { // for Already existing lots not considering the expiry date.
							response.lotExpiryDate = "";
						}


					}else{
						response.isValid = false;
						if(!utility.isValueValid(lotName)){
							response.errorMessage= translator.getTranslationString('BINTRANSFER_LOTFROMSTATUSLIST.INVALID_INPUTS');
						}
					}
				}
				else if(action == 'validateQuantity'){

					if(utility.isValueValid(scannedQuantity)){


						if(isNaN(scannedQuantity)){

							response.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
							response.isValid = false;
						}
						else{
							impactedRecords._ignoreUpdate= true;
							response.isValid = true;

							var scannedNewLot = true;
							if(scannedQuantity < 0 && utility.isValueValid(lotName) ) {
								scannedNewLot = utility.isInventoryNumberExists(itemInternalId, lotName, warehouseLocationId);
							}
								log.debug({title:'scannedNewLot at negative adjustment scenario',details:scannedNewLot});
								if(scannedNewLot != true)
								{
									response.errorMessage = translator.getTranslationString('CREATE_INVENTORY_QTYVALIDATE.INVALID_LOTINPUT');

									response.isValid = false;
								}






							if (!utility.isValueValid(stockConversionRate)) {

								stockConversionRate = 1;
							}
							var decimalQtyScanned = false;// except for serial items  allow decimal qtys

							if (itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem') {


								response.numberOfTimesSerialScanned = 0;
								if (scannedQuantity < 0) {
									log.debug('scanned scannedQuantity is ', scannedQuantity);
									response.scannedNegativeQuantity = true;
									scannedNegativeQuantityValue = scannedQuantity;
									scannedQuantity = scannedQuantity * -1;//This o/p is to set to postive value even if we scan negative,because if scan -2 in qty screen then for serial it should 0 of 2 in serial scanning screen not as 0 of -2
								}

								var convertedQty = (scannedQuantity) * (stockConversionRate);

								response.scannedQuantity = convertedQty;
								decimalQtyScanned = checkForDecimalQtyForSerialItems(scannedQuantity,stockConversionRate);
							}
							if(decimalQtyScanned){

								response.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
								response.isValid = false;
							}
							else{
								log.debug({title:'locUseBinsFlag',details:locUseBinsFlag});

								if((locUseBinsFlag != undefined && (locUseBinsFlag == false) || locUseBinsFlag == 'false' )){

									response.infoLocation = warehouseLocationName;
									if(itemType != 'serializedinventoryitem'  && itemType != 'serializedassemblyitem'){
										log.debug({title:'warehouseLocationId',details:warehouseLocationId});

										var accountNo = invtUtility.validateLocationForAccNo(warehouseLocationId);
										log.debug({title:'accountNo',details:accountNo});
										if(!utility.isValueValid(stockConversionRate)){

											stockConversionRate = 1;
										}

										if(accountNo == ''){
											response.errorMessage = translator.getTranslationString('CREATE_INVENTORY.CONFIG_ACCOUNT');
											response.isValid = false;
										}
										else{
											var nsInvAdjObj = {};
											nsInvAdjObj.itemInternalId=itemInternalId;
											nsInvAdjObj.itemType=itemType;
											nsInvAdjObj.warehouseLocationId=warehouseLocationId;
											nsInvAdjObj.scannedQuantity=Number(bigJs(scannedQuantity).toFixed(8));
											nsInvAdjObj.expiryDate=expiryDate;
											nsInvAdjObj.lotName=lotName;
											nsInvAdjObj.notes='';
											nsInvAdjObj.date='';
											nsInvAdjObj.period='';
											nsInvAdjObj.accountNo=accountNo;
											nsInvAdjObj.statusInternalId=statusInternalId;
											nsInvAdjObj.units=transactionUomName;
											nsInvAdjObj.stockConversionRate= stockConversionRate;

											var outputObj=invtUtility.invokeNSInventoryAdjustment(nsInvAdjObj);
											response.itemInternalId = itemInternalId;
											if(utility.isValueValid(transactionUomName)){
												response.itemUnits = scannedQuantity + ' ' + transactionUomName;
											}
											else {
												response.itemUnits = scannedQuantity;
											}

											if(outputObj.adjInventoryId == ''){

												response.isValid = false;
												response.errorMessage = translator.getTranslationString("BINTRANSFER_LOTVALIDATE.FROMBINLIST.INSUFFICIENTINVENTORY");

											}
											else {

												impactedRecords = invtUtility.noCodeSolForCreateInv(outputObj.adjInventoryId, outputObj.openTaskId);
											}

										}

									}
								}


								response.impactedRecords = impactedRecords;
								log.debug('transactionUomName transactionUomName',transactionUomName);
								if(response.scannedNegativeQuantity == true &&
								( itemType == 'serializedinventoryitem' || itemType == 'serializedassemblyitem'))
								{
									scannedQuantity = scannedNegativeQuantityValue;
								}
								if (utility.isValueValid(transactionUomName)) {


									response.infoScannedQuantity = scannedQuantity + '' + transactionUomName;
								}
								else {

									response.infoScannedQuantity = scannedQuantity;
								}

							}
						}
					}
					else{
						response.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.INVALID_INPUT');
						response.isValid = false;
					}
				}
				else{
					response.isValid = false;
				}
			}
			else{
				response.isValid = false;
			}

		}catch(e){
			{
				response.isValid = false;
				response.errorMessage = e.message;
				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
				log.error({title:'debugString',details:debugString});
			}
		}
		return response;
	}
	function checkForDecimalQtyForSerialItems(quantity,convertionRate){
		var isDecimalExists = false;
		if(utility.isValueValid(quantity)){
			if(!utility.isValueValid(convertionRate))
			{
				convertionRate = 1;
			}
			var convertedQty = (quantity)*(convertionRate);
			 if(convertedQty.toString().indexOf('.') != -1){
				 isDecimalExists = true;
			 }
		}
		return isDecimalExists;
	}
	function getLotNumberExpiryDateBYItemShelfLife(itemInternalId){

		var lotExpiryDate = '';
		if(utility.isValueValid(itemInternalId)){
			var lotLookUp = search.lookupFields({
				type: search.Type.ITEM,
				id: itemInternalId,
				columns: ['custitem_wmsse_shelflife']
			});
			var shelflife = 0;

			if(lotLookUp != undefined && lotLookUp != null && lotLookUp != ''){
				shelflife = lotLookUp.custitem_wmsse_shelflife;
			}
			if(!utility.isValueValid(shelflife)){
				shelflife =0;
			}
			if (shelflife > 0) {
				var currDate = utility.convertDate();
				var ExpiryDate = new Date(currDate.setDate(currDate.getDate() + parseInt(shelflife)));
				var lotExpiryDate = format.format({
					value: ExpiryDate,
					type: format.Type.DATE
				});
			}
			else{
				lotExpiryDate = 0;
			}
		}
		return lotExpiryDate;

	}
	return{
		'post' : doPost,
		'getLotNumberExpiryDateBYItemShelfLife':getLotNumberExpiryDateBYItemShelfLife
	}

});


