/**
 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./big','./wms_translator','./wms_inventory_utility'],

		function(utility,Big,translator,invtUtility) {

	function doPost(requestBody) {

		var qtyValidate = {};
		var scannedQuantity='';
		var availbleQuanity = '';
		var itemType='';
		var transactionUomConversionRate = '';
		var previousStatusInternalId = '';
		var itemInternalId = '';
		var warehouseLocationId = '';
		var binInternalId = '';
		var lotName = '';
		var lotInternalId = '';
		var unitType = '';
		var stockUnitName = '';
		var previousStatusName = '';
		var locUseBinsFlag = '';
		var revisedStatusInternalId ='';
		var revisedStatusName ='';
		var actualBeginTime='';
		try{
			if (utility.isValueValid(requestBody)) 
			{
				var requestParams = requestBody.params;
				scannedQuantity=requestParams.scannedQuantity;
				availbleQuanity = requestParams.availbleQuanity;
				itemType=requestParams.itemType;
				transactionUomConversionRate = requestParams.transactionUomConversionRate;
				itemInternalId = requestParams.itemInternalId;
				warehouseLocationId = requestParams.warehouseLocationId;
				binInternalId = requestParams.binInternalId;
				lotName = requestParams.lotName;
				lotInternalId = requestParams.lotInternalId;
				unitType = requestParams.unitType;
				stockUnitName = requestParams.stockUnitName;
				previousStatusInternalId = requestParams.previousStatusInternalId;
				previousStatusName = requestParams.previousStatusName;
				revisedStatusInternalId = requestParams.revisedStatusInternalId;
				revisedStatusName = requestParams.revisedStatusName;
				locUseBinsFlag =  requestParams.locUseBinsFlag;
				actualBeginTime = requestParams.actualBeginTime;
				log.debug({title:'requestParams',details:requestParams});

				if(utility.isValueValid(itemInternalId) && utility.isValueValid(warehouseLocationId) && 
						(utility.isValueValid(binInternalId) || locUseBinsFlag == false)) {

					if(utility.isValueValid(scannedQuantity) && !(isNaN(scannedQuantity)) && 
							(scannedQuantity > 0) && utility.isValueValid(itemType) && utility.isValueValid(availbleQuanity))
					{
						if(utility.isValueValid(revisedStatusInternalId) && utility.isValueValid(previousStatusInternalId) &&
								 revisedStatusInternalId != previousStatusInternalId)
						{

							var objStatusDetails = invtUtility.getItemWiseStatusDetailsInBin(itemInternalId,warehouseLocationId,binInternalId,previousStatusInternalId,lotInternalId,true);

							for(var statusItr in objStatusDetails){
								availbleQuanity=objStatusDetails[statusItr].available;
							}

							scannedQuantity = Big(scannedQuantity);
							if(!(utility.isValueValid(transactionUomConversionRate)))
							{
								transactionUomConversionRate=1;
							}
							if(utility.isValueValid(availbleQuanity))
							{
								availbleQuanity = Big(availbleQuanity).mul(transactionUomConversionRate);
							}
							var convertedScannedQty = Number(Big(scannedQuantity).mul(transactionUomConversionRate));

							if(utility.isValueValid(convertedScannedQty) && !isNaN(convertedScannedQty) && 
									parseFloat(availbleQuanity) >= parseFloat(convertedScannedQty))
							{
								if(itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem")
								{
									if(convertedScannedQty.toString().indexOf('.') != -1)
									{
										qtyValidate.errorMessage = translator.getTranslationString('PO_QUANTITYVALIDATE.SERIALITEM_DECIMALS_NOTALLOWED');
										qtyValidate.isValid = false;
									}
									else
									{
										qtyValidate.isValid = true;
										qtyValidate.numberOfTimesSerialScanned =0;
										qtyValidate.scannedQuantity=Number(Big(scannedQuantity).mul(transactionUomConversionRate));
										if(utility.isValueValid(stockUnitName))
										{
											qtyValidate.scannedQuantityWithUOM =scannedQuantity+" "+stockUnitName;
										}
										else{
											qtyValidate.scannedQuantityWithUOM=scannedQuantity;
										}
									}
								}
								else
								{
									qtyValidate.scannedQuantity=Number((Big(scannedQuantity).mul(transactionUomConversionRate)).toFixed(8));
									var inputObj= {};
									inputObj.itemType = itemType; 
									inputObj.warehouseLocationId = warehouseLocationId;
									inputObj.itemInternalId = itemInternalId;
									inputObj.scannedQuantity = qtyValidate.scannedQuantity;
									inputObj.binInternalId = binInternalId;
									inputObj.lotInternalId = lotInternalId;
									inputObj.revisedStatusInternalId = revisedStatusInternalId;
									inputObj.previousStatusInternalId = previousStatusInternalId;
									inputObj.openTaskQty = scannedQuantity;
									inputObj.unitType = stockUnitName;
									inputObj.transactionUomConversionRate = transactionUomConversionRate;
									inputObj.lotName = lotName;
									inputObj.actualBeginTime = actualBeginTime; 									
									var inventoryStatusChangeId = invtUtility.postInventoryStatusChange(inputObj);
									if(utility.isValueValid(inventoryStatusChangeId)){
										qtyValidate.isValid = true;
										qtyValidate.inventoryStatusChangeId = inventoryStatusChangeId;

										if(utility.isValueValid(stockUnitName))
										{
											qtyValidate.scannedQuantityWithUOM =scannedQuantity +" "+stockUnitName;
										}
										else{
											qtyValidate.scannedQuantityWithUOM=scannedQuantity;
										}

									}else{
										qtyValidate.isValid = false;
									}
								}
							}
							else
							{
								if(parseFloat(convertedScannedQty) > parseFloat(availbleQuanity))
								{
									qtyValidate.errorMessage = translator.getTranslationString('STATUSCHANGE_QTYVALIDATE.GREATERTHAN_AVAILABLE');//"You cannot transfer a quantity of an item that is greater than the available quanity.";
									qtyValidate.isValid = false;
								}
								else
								{
									qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
									qtyValidate.isValid = false;
								}
							}
						}
						else
						{
							qtyValidate.errorMessage = translator.getTranslationString('STATUSCHANGE_QTYVALIDATE.FORSAMESTATUS');
							qtyValidate.isValid = false;
						}
					}
					else{
						qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
						qtyValidate.isValid = false;
					}
				}
				else{
					qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
					qtyValidate.isValid = false;
				}
				log.debug('qtyValidate',qtyValidate);
			}
			else{

				qtyValidate.errorMessage = translator.getTranslationString('BINTRANSFER_QTYVALIDATE.INVALID_INPUT');
				qtyValidate.isValid = false;
			}
		}
		catch(e)
		{
			qtyValidate.isValid = false;
			qtyValidate.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return qtyValidate;
	}



	return {
		'post': doPost      
	};

});
