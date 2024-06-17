/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator','./wms_inboundUtility'],
		function(search,utility,translator,inboundUtility) {

	/**
	 * This function is to fetch PO details based on the item
	 */
	function doPost(requestBody) {
		var response = {};
		var shipmentNumber  = '';
		var warehouseLocationId = '';
		var itemInternalId = '';
		var itemName = '';
		var debugString = '';
		var purchaseorderInternalId = '';

		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams 	    = requestBody.params;
				debugString 	  	    = debugString + ",requestParams :"+requestParams;
				warehouseLocationId     = requestParams.warehouseLocationId;
				itemInternalId 		    = requestParams.itemInternalId;
				itemName 			    = requestParams.itemName;
				shipmentNumber          = requestParams.shipmentNumber;
				purchaseorderInternalId = requestParams.purchaseorderInternalId;

				if((utility.isValueValid(purchaseorderInternalId) && utility.isValueValid(itemInternalId)) 
					&&  utility.isValueValid(shipmentNumber) && utility.isValueValid(warehouseLocationId)){

					var objpickLotListDetails=[];
					var inboundShipmentDetails = {}; 

					inboundShipmentDetails['purchaseorderInternalId']=purchaseorderInternalId;
					inboundShipmentDetails['itemInternalId']=itemInternalId;
					inboundShipmentDetails['shipmentNumber']=shipmentNumber;
					inboundShipmentDetails['warehouseLocationId']=warehouseLocationId;

					objpickLotListDetails = this.getInboundShipmentLotListDetails(inboundShipmentDetails);
					if(!utility.isValueValid(objpickLotListDetails) || objpickLotListDetails.length==0){
						response = {
								isValid:true,
                          
						}
					}
					else
					{
						response = {
								objpickLotListDetails : objpickLotListDetails, 
								isValid      : true
						};
					}
				}
				else
				{
					response = {
							errorMessage:translator.getTranslationString('ISM_LOTLIST.EMPTYPARAM'),
							isValid:false		
					}
				}
			}else{
				response['isValid'] = false;
			}
		}catch(e)
		{
			response['isValid'] = false;
			response['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return response;
	}		

	function getInboundShipmentLotListDetails(inboundShipmentDetails){

		var purchaseorderInternalId = inboundShipmentDetails['purchaseorderInternalId'];
		var itemInternalId = inboundShipmentDetails["itemInternalId"];
		var shipmentNumber = inboundShipmentDetails["shipmentNumber"];
		var whLocation = inboundShipmentDetails["warehouseLocationId"];
		var	 objISMSearchDetails = [];
      try
      {
		var ismLotListSearch = search.load({id:'customsearch_wms_inbshipment_lotlist'});
		var ismLotListFilters = ismLotListSearch.filters;
		if(utility.isValueValid(purchaseorderInternalId))
		{
			ismLotListFilters.push(search.createFilter({
				name:'purchaseorder',			
				operator:search.Operator.ANYOF,
				values:purchaseorderInternalId}))
		}
		if(utility.isValueValid(itemInternalId))
		{
			ismLotListFilters.push(search.createFilter({
				name:'item',
				operator:search.Operator.ANYOF,
				values:itemInternalId}))
		}
		if(utility.isValueValid(shipmentNumber))
		{
			ismLotListFilters.push(search.createFilter({
				name:'shipmentnumber',
				operator:search.Operator.ANYOF,
				values:[shipmentNumber]}));
		}
		if(utility.isValueValid(whLocation))
		{
			ismLotListFilters.push(search.createFilter({
				name:'receivinglocation',
				operator:search.Operator.ANYOF,
				values:[whLocation]}));
		}		
		ismLotListSearch.filters = ismLotListFilters;
			 objISMSearchDetails = utility.getSearchResultInJSON(ismLotListSearch);
      }
      catch(e)
      {
    	  log.error({title:'exception in getInboundShipmentLotListDetails',details:e});  
      }
		log.debug({title:'ismLotListSearch',details:objISMSearchDetails});

		return objISMSearchDetails;

	}

	return {
		'post': doPost,
		'getInboundShipmentLotListDetails':getInboundShipmentLotListDetails
	};
});
