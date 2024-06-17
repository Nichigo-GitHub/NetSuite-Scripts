/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_translator','./wms_inboundUtility'],
		function(search,utility,translator,inboundUtility) {

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 */
	function doPost(requestBody) {

		
		var debugString = '';
		var warehouseLocationId;
		var shipmentListObj;
		var shipmentListDetails = new Object();
		var action = '';
		var shipmentArray = [];

		try{
			if(utility.isValueValid(requestBody)) {

				var requestParams	= requestBody.params;
				debugString = debugString + 'Request Params :'+requestParams;
				warehouseLocationId  	= requestParams.warehouseLocationId;
				log.debug({title:'Request Params :', details:requestParams});
				
				action = requestParams.action;
				shipmentArray = requestParams.shipmentArray;	

				// calling the Get Shipment List method to get the eligible Shipments

				shipmentListObj = this.getShipmentListForIR(warehouseLocationId, action, shipmentArray);

				if(shipmentListObj.length==0)
				{
					shipmentListDetails = {
							errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.NOMATCH'), //No Inbound Shipments pending receipt.
							isValid      : false
					};	
				}
				else
				{
					shipmentListDetails = {
							shipmentList : shipmentListObj, 
							isValid      : true
					};
				}
			}
			else{
				shipmentListDetails = {
						errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.EMPTYPARAM'),
						isValid      : false
				};		
			}
		}
		catch(e)
		{
			shipmentListDetails['isValid'] = false;
			shipmentListDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}	

		return shipmentListDetails;
	}

	function getShipmentListForIR(warehouseLocationId, action, shipmentArray){
		var shipmentDetailsSrch = search.load({
			id : 'customsearch_wms_ism_ir_shipmentlist',
			name : 'WMS ISM Post IR Shipment List'
		});

		shipmentDetailsSrch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_wms_location',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));
		
		if(utility.isValueValid(action) && action=='getShipmentsForExtDocNum' && utility.isValueValid(shipmentArray) && shipmentArray.length > 0)
		{
			shipmentDetailsSrch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_inbshipment',
				operator: search.Operator.ANYOF,
				values: shipmentArray
			}));
		}

		return utility.getSearchResultInJSON(shipmentDetailsSrch);
	}

	return {
		'post': doPost,
		getShipmentListForIR : getShipmentListForIR
	};

});
