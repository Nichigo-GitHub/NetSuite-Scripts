/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','N/record','N/runtime'],
		/**
		 * @param {search} search
		 */
		function(search,utility,translator,record,runtime) {

	/**
	 * This function is to fetch the items of a purchase order
	 */
	function doPost(requestBody) {
		var response = {};
		var warehouseLocationId = '';
		var serialName = '';
		var fromBinInternalId = '';
		var toBinInternalId = '';
		var numberOfTimesSerialScanned = '';
		var scannedQuantity = '';
		var itemInternalId = '';
		var fromStatusInternalId = '';
		var debugString = '';
		try{
			if(utility.isValueValid(requestBody)) {
				var requestParams = requestBody.params;
				var inventoryStatus = utility.isInvStatusFeatureEnabled();
				warehouseLocationId = requestParams.warehouseLocationId;
				serialName = requestParams.serialName;
				fromBinInternalId = requestParams.fromBinInternalId;
				numberOfTimesSerialScanned = requestParams.numberOfTimesSerialScanned;
				scannedQuantity = requestParams.scannedQuantity;
				itemInternalId = requestParams.itemInternalId;
				fromStatusInternalId = requestParams.fromStatusInternalId;
				toBinInternalId = requestParams.toBinInternalId;

				log.debug('requestParams',requestParams);

				if(utility.isValueValid(serialName)){
					var invNumber = utility.inventoryNumberInternalId(serialName, warehouseLocationId, itemInternalId);
					var invBalanceRes = {};
					if(utility.isValueValid(invNumber))
					{
						if(inventoryStatus){

							var invBalanceSearch = search.load({type : search.Type.INVENTORY_BALANCE, id:'customsearch_wmsse_inventorybalance'});

							invBalanceSearch.filters.push(search.createFilter({
								name : 'binnumber',
								operator : search.Operator.ANYOF,
								values : fromBinInternalId
							}));

							invBalanceSearch.filters.push(search.createFilter({
								name : 'internalid',
								join : 'item',
								operator : search.Operator.ANYOF,
								values : itemInternalId
							}));

							invBalanceSearch.filters.push(search.createFilter({
								name : 'location',
								operator : search.Operator.ANYOF,
								values : warehouseLocationId
							}));

							invBalanceSearch.filters.push(search.createFilter({
								name : 'inventorynumber',
								operator : search.Operator.ANYOF,
								values : invNumber
							}));

							invBalanceSearch.filters.push(search.createFilter({
								name : 'status',
								operator : search.Operator.ANYOF,
								values : fromStatusInternalId
							}));

							invBalanceRes = utility.getSearchResultInJSONForValidation(invBalanceSearch);
							
						}
						else
						{
							invBalanceRes = getItemWiseSearchResults(fromBinInternalId,itemInternalId,warehouseLocationId,serialName);

						}
					}
					else
					{
						log.debug({title:'invalis serial',details:'invBalanceRes'});
						response['isValid'] = false;
						response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
						return response;
					}
					if(invBalanceRes.length == 0){
						response['isValid'] = false;
						response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
					}else{

						var serialSearch = search.load({type : 'customrecord_wmsse_serialentry', id : 'customsearch_wmsse_replen_serial_srh'});
						serialSearch.filters.push(search.createFilter({
							name : 'custrecord_wmsse_ser_no',
							operator : search.Operator.IS,
							values : serialName
						}));

						serialSearch.filters.push(search.createFilter({
							name : 'custrecord_wmsse_ser_bin',
							operator : search.Operator.ANYOF,
							values : toBinInternalId
						}));

						var serialSearchRes = utility.getSearchResultInJSON(serialSearch);

						if(serialSearchRes.length != 0){
							response['isValid'] = false;
							response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.SERIAL_ALREADYSCANNED');
						}else{

							var currentUserId = runtime.getCurrentUser().id;
							var name = "replen" + "^" + currentUserId + "^" + serialName;
							var objRecord = record.create({
								type : 'customrecord_wmsse_serialentry',

							});

							objRecord.setValue({
								fieldId: 'name',
								value: name
							});

							objRecord.setValue({
								fieldId: 'custrecord_wmsse_ser_item',
								value: itemInternalId
							});

							objRecord.setValue({
								fieldId: 'custrecord_wmsse_ser_qty',
								value: 1
							});

							objRecord.setValue({
								fieldId: 'custrecord_wmsse_ser_no',
								value: serialName
							});

							objRecord.setValue({
								fieldId: 'custrecord_wmsse_ser_status',
								value: false
							});

							objRecord.setValue({
								fieldId: 'custrecord_wmsse_ser_bin',
								value: toBinInternalId
							});

							objRecord.setValue({
								fieldId: 'custrecord_wmsse_ser_tasktype',
								value: 17
							});
							var id = objRecord.save();

							if(parseInt(numberOfTimesSerialScanned) < scannedQuantity){
								response['numberOfTimesSerialScanned'] = parseInt(numberOfTimesSerialScanned) + 1;
							}
							response['isValid'] = true;
						}
					}
				}else{
					response['isValid'] = false;
					response['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.ENTER_VALIDSERIAL');
				}
			}else{
				response['isValid'] = false;
			}
		}catch(e){
			response['isValid'] = false;
			response['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString})
		}
		log.debug('response',response);
		return response;
	}

	function  getItemWiseSearchResults(fromBinInternalId,itemInternalId,warehouseLocationId,serialName)
	{
		log.debug('fromBinInternalId',fromBinInternalId);
		log.debug('itemInternalId',itemInternalId);
		log.debug('warehouseLocationId',warehouseLocationId);
		log.debug('serialName',serialName);

		var searchObj = search.load({id:'customsearch_wmsse_itemwise_validinvtdet'});
		var columns = searchObj.columns;
		
		var filters = searchObj.filters;
		if(fromBinInternalId!= null && fromBinInternalId!= '')
		{
			filters.push(search.createFilter({
				name:'binnumber',
				join:'inventoryNumberBinOnHand', 
				operator:search.Operator.ANYOF, 
				values:fromBinInternalId}));
		}
		filters.push(search.createFilter({
			name:'internalid',
			operator:search.Operator.ANYOF, 
			values:itemInternalId}));
		filters.push(search.createFilter({
			name:'isinactive',
			operator:search.Operator.IS, 
			values:false}));

		filters.push(search.createFilter({
			name:'location',
			join:'inventoryNumberBinOnHand',
			operator:search.Operator.ANYOF, 
			values:warehouseLocationId}));
		if(serialName!= null && serialName!= '')
		{
			filters.push(search.createFilter({
				name:'inventorynumber',
				join:'inventoryNumberBinOnHand',
				operator:search.Operator.IS, 
				values:serialName}));
		}
		searchObj.filters = filters;
		searchObj.columns = columns;
		var	objBinDetails = utility.getSearchResultInJSONForValidation(searchObj);
		log.debug({title:'objBinDetails in  inv status OFF',details:objBinDetails});
		return objBinDetails;
	}
	return {
		'post': doPost
	};
});
