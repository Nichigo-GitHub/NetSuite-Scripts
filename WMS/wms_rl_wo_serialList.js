/**
 * Copyright © 2015,2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_workOrderUtility'],

		function(search,utility,translator, woUtility) {

	function doPost(requestBody) {

		var serialArr = {};

		try{

			var requestParams = requestBody.params;
			var processType = '';
			if(utility.isValueValid(requestParams))
			{
				var warehouseLocationId = requestParams.warehouseLocationId;
				var itemInternalId = requestParams.itemInternalId;
				var fromBinInternalId=requestParams.fromBinInternalId;
				var transactionInternalId = requestParams.transactionInternalId;
				var pickStatusInternalId = requestParams.pickStatusInternalId;
				var transactionLineNo  = requestParams.transactionLineNo;
				processType = requestParams.processType; 
				var transactionName = requestParams.transactionName; 
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var inventoryDetailLotOrSerialId = requestParams.inventoryDetailLotOrSerialId;
				var inventoryDetailLotOrSerialText = requestParams.inventoryDetailLotOrSerialText;
				log.debug({title:'requestParams',details:requestParams});

				var scannedSerialNums = [];
				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(itemInternalId) 
						&& (utility.isValueValid(fromBinInternalId)|| locUseBinsFlag == false))
				{	
					var serialSearchResults = getSerialNumbersDetails(transactionInternalId,transactionLineNo,transactionName,itemInternalId);
					if(serialSearchResults.length > 0){
						for(var i in serialSearchResults)
							scannedSerialNums.push(serialSearchResults[i]['custrecord_wmsse_ser_no']);
					}
					var getSerialNoId ='';
					var objSerialDetails =[];
					if(utility.isValueValid(inventoryDetailLotOrSerialId)){
						getSerialNoId = inventoryDetailLotOrSerialId;
						objSerialDetails.push({'inventorynumberText' : inventoryDetailLotOrSerialText});
					}
					else {
					objSerialDetails = utility.getSerialList(fromBinInternalId,itemInternalId,warehouseLocationId,pickStatusInternalId,getSerialNoId);
					}
					log.debug({title:'objSerialDetails:', details:objSerialDetails});
					var serialList = {};
					var serArr = [];
					var counter =0;
					var opentaskSerArr = [];
					var openTaskResults ='';
					log.debug({title:'scannedSerialNums:',details:scannedSerialNums});
					if(scannedSerialNums.length > 0)
					{					
						var isSerialMatchFound = false;
						for(var serialIndex in objSerialDetails){
							isSerialMatchFound = false;
							if(counter < scannedSerialNums.length)
							{
								for(var index in scannedSerialNums){
									if(objSerialDetails[serialIndex]['inventorynumberText'] == scannedSerialNums[index]){
										counter++;
										isSerialMatchFound = true;
										break;
									}
								}
							}
							if(!isSerialMatchFound)
							{
								serArr[serArr.length] = objSerialDetails[serialIndex];
							}
						}
						var serArray = [];
						var serialCounter =0;
						openTaskResults = woUtility.getOpenTaskSerialEntries(itemInternalId, fromBinInternalId, warehouseLocationId,pickStatusInternalId,inventoryDetailLotOrSerialText);
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
						log.debug({title:'Open Task Serial Numbers', details:opentaskSerArr});
						if(utility.isValueValid(opentaskSerArr) && opentaskSerArr.length>0){
							var isMatchFound = false;
							for(var arrIndex=0; arrIndex<serArr.length; arrIndex++){
								isMatchFound = false;
								if(serialCounter < opentaskSerArr.length)
								{
									for(var openTaskIndex in opentaskSerArr){
										if(serArr[arrIndex]['inventorynumberText'] == opentaskSerArr[openTaskIndex]){
											serialCounter++;
											isMatchFound = true;
											break;
										}
									}
								}
								if(!isMatchFound)
								{
									serArray[serArray.length] = serArr[arrIndex];
								}
							}
							serialList = serArray;
						}else{
							serialList = serArr;
						}
					}
					else
					{
						openTaskResults = woUtility.getOpenTaskSerialEntries(itemInternalId, fromBinInternalId, warehouseLocationId,pickStatusInternalId,inventoryDetailLotOrSerialText);
						for(var serRecIndex=0; serRecIndex<openTaskResults.length; serRecIndex++)
						{
							var serNumber = openTaskResults[serRecIndex]['custrecord_wmsse_serial_no'].split(',');
							if(serNumber.length>1){
								for(var numberIndex=0; numberIndex< serNumber.length; numberIndex++)
									opentaskSerArr.push(serNumber[numberIndex]);
							}
							else if(serNumber.length == 1){
								opentaskSerArr.push(serNumber[0]);
							}
						}
						log.debug({title:'Open Task Serial Numbers', details:opentaskSerArr});

						if(utility.isValueValid(opentaskSerArr) && opentaskSerArr.length>0){
							var isNumberMatchFound = false;
							for(var objIndex in objSerialDetails){
								isNumberMatchFound = false;
								if(counter < opentaskSerArr.length)
								{
									for(var openTaskSerIndex in opentaskSerArr){

										if(objSerialDetails[objIndex]['inventorynumberText'] == opentaskSerArr[openTaskSerIndex]){
											counter++;
											isNumberMatchFound = true;
											break;
										}
									}
								}
								if(!isNumberMatchFound)
								{
									serArr[serArr.length] = objSerialDetails[objIndex];
								}
							}
							serialList = serArr;
						}else{
							serialList = objSerialDetails;
						}
					}
					if(objSerialDetails.length>0)
					{
						serialArr['serialList'] = serialList;
						serialArr['isValid'] = true;
					}
					else
					{
						serialArr['isValid'] = false;
						serialArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
					}
				}
				else
				{
					serialArr['isValid'] = false;
					serialArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
				}
			}
			else
			{
				serialArr['isValid'] = false;
				serialArr["errorMessage"] = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
			}
		}
		catch(e)
		{
			serialArr['isValid'] = false;
			serialArr['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

		return serialArr;

	}	
	function getSerialNumbersDetails(transactionInternalId,transactionLineNo,transactionName,itemInternalId)
	{
		var serialSearch = search.load({
			id: 'customsearch_wmsse_wo_serialentry_srh',
		});
		var serailFilters = serialSearch.filters;

		if(utility.isValueValid(transactionInternalId))
		{
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));
		}
		if(utility.isValueValid(transactionLineNo))
		{
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordline',
				operator: search.Operator.IS,
				values: transactionLineNo
			}));
		}
		if(utility.isValueValid(transactionName))
		{
			serailFilters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: transactionName
			}));
		}						
		if(utility.isValueValid(itemInternalId))
		{
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


	return {
		'post': doPost
	};

});
