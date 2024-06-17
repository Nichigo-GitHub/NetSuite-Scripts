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

		var shipmentListDetails 	= {};
		var debugString 			= '';
		var whLocation = '';
		var action = '';
		var externalDocumentNum = '';

		try{
			if(utility.isValueValid(requestBody)) 
			{
				var requestParams	= requestBody.params;
				debugString = debugString + 'Request Params :'+requestParams;
				whLocation  	= requestParams.warehouseLocationId;
				action 			= requestParams.action;
				externalDocumentNum	= requestParams.externalDocumentNum;
				log.debug({title:'Request Params :', details:requestParams});

				if(utility.isValueValid(whLocation))
				{
					var shipmentInputObj = {};
					shipmentInputObj['whLocation']=whLocation;
					
					if(utility.isValueValid(action) && utility.isValueValid(externalDocumentNum) && action=='getShipmentsForExtDocNum')
					{
						shipmentInputObj['action']=action;
						shipmentInputObj['externalDocumentNumber']=externalDocumentNum;
					}

					// calling the Get Shipment List method to get the eligible Shipments
					var shipmentListObj = inboundUtility.getShipmentList(shipmentInputObj);

					if(!utility.isValueValid(shipmentListObj) || shipmentListObj.length==0)
					{
						shipmentListDetails = {
								errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.NOMATCH'), 
								isValid      : false
						};	
					}
					else
					{
						shipmentListDetails = {
								shipmentList : shipmentListObj, 
								isValid      : true
						};
						log.debug({title:'Shipment List', details: shipmentListObj});
					}
				}
				else
				{
					shipmentListDetails = {
							errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.INVALIDINPUT'),
							isValid      : false
					};	
				}
			}
			else
			{
				shipmentListDetails = {
						errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.INVALIDINPUT'),
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
	return {
		'post': doPost
	};

});
