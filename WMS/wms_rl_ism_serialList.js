/**
 * Copyright ï¿½ 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_inboundUtility','N/record'],
		function(search,utility,translator,inboundUtility,record) {

	/**
	 * This function is to fetch PO details based on the item
	 */
	function doPost(requestBody) {
		var serialListDetails = {};
		var shipmentNumber  = '';
		var warehouseLocationId = '';
		var itemInternalId = '';
		var itemName = '';
		var debugString = '';
		var purchaseorderInternalId = '';
		var getNumber = '';
		var shipmentLineNo ='';
		var getSerialLst = '';
        var shipmentId   = '';
		log.debug('Serial List begin :', 'Serial List begin');

		try{
			if(utility.isValueValid(requestBody))
			{
				log.debug('Serial List begin inside request body:', 'Serial List begin inside request body');

				var requestParams 	    = requestBody.params;
				debugString 	  	    = debugString + ",requestParams :"+requestParams;
				warehouseLocationId     = requestParams.warehouseLocationId;
				itemInternalId 		    = requestParams.itemInternalId;
				itemName 			    = requestParams.itemName;
				shipmentNumber          = requestParams.shipmentNumber;
				
				shipmentLineNo          = requestParams.shipmentLineNo;
				purchaseorderInternalId = requestParams.purchaseorderInternalId;
				getNumber = requestParams.numberOfTimesSerialScanned;
				getSerialLst = requestParams.numberOfTimesSerialScanned;
				shipmentId = requestParams.shipmentId;

				log.debug({title:'requestParams',details:requestParams});

				if((utility.isValueValid(purchaseorderInternalId) && utility.isValueValid(itemInternalId)) 
						&&  utility.isValueValid(shipmentNumber) && utility.isValueValid(warehouseLocationId)){

					var objpickSerialList=[];
					var inboundShipmentDtl = {}; 

					inboundShipmentDtl['purchaseorderInternalId']=purchaseorderInternalId;
					inboundShipmentDtl['itemInternalId']=itemInternalId;
					inboundShipmentDtl['shipmentNumber']=shipmentNumber;
					inboundShipmentDtl['warehouseLocationId']=warehouseLocationId;


					if(!utility.isValueValid(getNumber))
					{
						getNumber=0;
					}
					log.debug({title:'getNumber',details:getNumber});
					if(parseInt(getNumber)==0)
					{
						var serialSearchResults = inboundUtility.getSerialsFromSerialEntry(shipmentLineNo,shipmentId,purchaseorderInternalId);
						if(serialSearchResults.length > 0)
						{
							var opentaskSerialsArr = inboundUtility.getOpenTaskSerials(itemInternalId);
							for (var j = 0; j < serialSearchResults.length; j++) {
								var serialEntryRecord = serialSearchResults[j];
								var serial = serialEntryRecord.name;
								if(opentaskSerialsArr.indexOf(serial) == -1)
								{
									inboundUtility.closeSerialInSerialEntry(serialEntryRecord.id,serial);

								}
							}

						}
					}
                    try{
					objpickSerialList = this.getISSerialList(inboundShipmentDtl);
					}
					catch(e){
						objpickSerialList = [];
					}

					if(!utility.isValueValid(objpickSerialList) || objpickSerialList.length==0){
						serialListDetails = {
								isValid:true		
						}

					}
					else
					{
						serialListDetails = {
								objpickSerialList : objpickSerialList, 
								isValid      : true
						};
					}
				}
				else
				{
					serialListDetails = {
							errorMessage:translator.getTranslationString('ISM_SERIALLIST.EMPTYPARAM'),
							isValid:false		
					}
				}
			}			
			else
			{
				serialListDetails = {
						errorMessage:translator.getTranslationString('ISM_SERIALLIST.EMPTYPARAM'),
						isValid:false		
				}
			}
		}catch(e)
		{
			serialListDetails['isValid'] = false;
			serialListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return serialListDetails;
	}	
		
	function getISSerialList(inboundShipmentDetails){

		var purchaseorderInternalId = inboundShipmentDetails.purchaseorderInternalId;
		var itemInternalId = inboundShipmentDetails.itemInternalId;
		var shipmentNumber = inboundShipmentDetails.shipmentNumber;
		var whLocation     = inboundShipmentDetails.warehouseLocationId;

		var ismSerialListSearch = search.load({id:'customsearch_wms_inbshipment_seriallist'});
		var ismSerialListFilters = ismSerialListSearch.filters;
		if(utility.isValueValid(purchaseorderInternalId))
		{
			ismSerialListFilters.push(search.createFilter({
				name:'purchaseorder',			
				operator:search.Operator.ANYOF,
				values:purchaseorderInternalId}))
		}
		if(utility.isValueValid(itemInternalId))
		{
			ismSerialListFilters.push(search.createFilter({
				name:'item',
				operator:search.Operator.ANYOF,
				values:itemInternalId}))
		}
		if(utility.isValueValid(shipmentNumber))
		{
			ismSerialListFilters.push(search.createFilter({
				name:'shipmentnumber',
				operator:search.Operator.ANYOF,
				values:[shipmentNumber]}));
		}
		if(utility.isValueValid(whLocation))
		{
			ismSerialListFilters.push(search.createFilter({
				name:'receivinglocation',
				operator:search.Operator.ANYOF,
				values:[whLocation]}));
		}
		ismSerialListSearch.filters = ismSerialListFilters;
		var	 objISMSearchDetails = utility.getSearchResultInJSON(ismSerialListSearch);
		log.debug({title:'ismSerialListSearch',details:objISMSearchDetails});

		return objISMSearchDetails;

	}
	
	return {
		'post': doPost,
		'getISSerialList':getISSerialList
		
	};
});
