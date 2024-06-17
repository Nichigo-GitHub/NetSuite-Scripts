/**
 * Copyright © 2015,2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','N/record'],
		function(search,utility,translator,record) {
	function doPost(requestBody) {
		var serialArr = {};
		try{
			var requestParams = requestBody.params;
			if(utility.isValueValid(requestParams)){
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var fromBinInternalId=requestParams.fromBinInternalId;
				var orderInternalId = requestParams.transactionInternalID;
				var pickTaskId = requestParams.pickTaskId;
				var pickStatusInternalId = requestParams.pickStatusInternalId;
				var inventoryDetailLotOrSerial =requestParams.inventoryDetailLotOrSerial;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var isTallyScanRequired = requestParams.isTallyScanRequired;
				var processType = requestParams.processType;
				var serialNumber = requestParams.serialNumber;
         var binName =  requestParams.binName;
				log.debug({title:'requestParams',details:requestParams});
				if(isTallyScanRequired==true){
         	if(utility.isValueValid(binName))
						{
							serialArr.binName = binName;
						}
					if(processType != 'NSWMS_CartPutaway'){
						pickStatusInternalId='';
					}
					if(processType == 'NSWMS_CartPutaway' || processType == 'NSWMS_InventoryTransfer'){
						if(utility.isValueValid(serialNumber)){
							rollbackSerialNumberInSerialEntry(serialNumber,fromBinInternalId,itemInternalId);
						}
					}
				}
				var scannedSerialNums = [];
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId)
						&& (utility.isValueValid(fromBinInternalId) || locUseBinsFlag == false)){	
					var serialSearchResults = this.getScannedSerialList(itemInternalId);
					if(serialSearchResults.length > 0){
						for(var serialNoIndex in serialSearchResults)
							scannedSerialNums.push(serialSearchResults[serialNoIndex]['custrecord_wmsse_ser_no']);
					}
					var getSerialNoId ='';
					var objSerialDetails =[];
					if(utility.isValueValid(inventoryDetailLotOrSerial)){
						objSerialDetails.push({'inventorynumberText' : inventoryDetailLotOrSerial});
					}
					else{
						objSerialDetails = utility.getSerialList(fromBinInternalId,itemInternalId,warehouseLocationId,pickStatusInternalId,getSerialNoId);
					}
					log.debug({title:'objSerialDetails',details:objSerialDetails});
					var serialList = {};
					var serArr = [];
					var counter =0;
					if(scannedSerialNums.length > 0){
						var isMatchFound = false;
						for(var i in objSerialDetails){
							isMatchFound = false;
							if(counter < scannedSerialNums.length){
								for(var j in scannedSerialNums){
									if(objSerialDetails[i]['inventorynumberText'] == scannedSerialNums[j]){
										counter++;
										isMatchFound = true;
										break;
									}
								}
							}
							if(!isMatchFound){
								serArr[serArr.length] = objSerialDetails[i];
							}
						}
						serialList = serArr;
					}
					else{
						serialList = objSerialDetails;
					}
					if(objSerialDetails.length>0){
						serialArr.serialList = serialList;
						serialArr.isValid = true;
					}else{
						serialArr.isValid = false;
						serialArr.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
					}
				}else{
					serialArr.isValid = false;
					serialArr.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
				}
			}else{
				serialArr.isValid = false;
				serialArr.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
			}
		}
		catch(e){
			serialArr.isValid = false;
			serialArr.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return serialArr;
	}	function getScannedSerialList(itemInternalId){		var serialSearch = search.load({
			id: 'customsearch_wmsse_wo_serialentry_srh',
		});
		var serailFilters = serialSearch.filters;					if(utility.isValueValid(itemInternalId)){
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
		}
		serailFilters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_status',
			operator: search.Operator.IS,
			values: false				
		}));
		serialSearch.filters = serailFilters;
		return utility.getSearchResultInJSON(serialSearch);
	}
	function rollbackSerialNumberInSerialEntry(serialNumber,binInternalId,itemInternalId){
		var serialSearch = search.load({
			id: 'customsearch_wmsse_wo_serialentry_srh',
		});
		var serailFilters = serialSearch.filters;
		serailFilters.push(search.createFilter({
			name: 'custrecord_wmsse_ser_no',
			operator: search.Operator.IS,
			values: serialNumber
		}));
		if(utility.isValueValid(binInternalId)){
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_bin',
				operator: search.Operator.ANYOF,
				values: binInternalId
			}));
		}
		if(utility.isValueValid(itemInternalId)){
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
		}
		serialSearch.filters = serailFilters;
		log.debug({title:'serialSearch',details:serialSearch});
		var serialSearchResults =utility.getSearchResultInJSON(serialSearch);
		log.debug({title:'serialSearchResults',details:serialSearchResults});
		var serialSearchResultsLength = serialSearchResults.length;
		if(serialSearchResultsLength > 0){
			for (var j = 0; j < serialSearchResultsLength; j++){
				var TempRecord = serialSearchResults[j];
				var serialRec = record.load({
					type : 'customrecord_wmsse_serialentry',
					id : TempRecord.id
				});
				serialRec.setValue({ fieldId:'custrecord_wmsse_ser_note1', value :'because of discontinue of serial number scanning we have marked this serial number as closed'});
				serialRec.setValue({ fieldId:'custrecord_wmsse_ser_status', value :true });
				serialRec.save();
			}
		}
	}
	return {
		'post': doPost,
		'getScannedSerialList':getScannedSerialList
	};
});
