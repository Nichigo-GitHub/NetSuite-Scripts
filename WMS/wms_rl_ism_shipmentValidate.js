/**
 *    Copyright ï¿½ 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','N/record','./wms_utility','./wms_translator','./wms_inboundUtility','./big'],
		function(search,record,utility,translator,inboundUtility,Big) {

	/**
	 * Function to validate order
	 */
	function doPost(requestBody) {

		var debugString = '';
		var requestParams = '';
		var shipmentValidationDtls = {};
		var whLocation = '';
		var shipmentNum = '';
		var shipmentInternalId = '';
        var transactionType = '';
		var shipmentListDetails=[];
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{

				debugString 		= debugString + "requestParams :"+requestParams;
				whLocation 			= requestParams.warehouseLocationId;
				shipmentNum 		= requestParams.shipmentNumber;
				shipmentInternalId 	= requestParams.shipmentInternalId;
				action 				= requestParams.action;
                transactionType 				= requestParams.transactionType;
				shipmentValidationDtls['itemScanned'] = "F";

				log.debug({title:'requestParams:',details:requestParams});
              log.debug({title:'shipmentNum:',details:shipmentNum});
              log.debug({title:'whLocation:',details:whLocation});

				if((utility.isValueValid(shipmentNum) &&  utility.isValueValid(whLocation))||
						(utility.isValueValid(shipmentInternalId) &&  utility.isValueValid(whLocation)))
				{

					shipmentListDetails = getShipmentValidate(shipmentNum,shipmentInternalId, whLocation);
					log.debug('Shipment List:', shipmentListDetails);

					if(shipmentListDetails.length > 0)
					{
						var vCount = 0;
						//Multiple Shipments
						var shipmentsArray = [];
						for(var shipmentItr in shipmentListDetails)
						{
							if(shipmentsArray.indexOf(shipmentListDetails[shipmentItr]['shipmentnumber'])==-1)
								shipmentsArray.push(shipmentListDetails[shipmentItr]['shipmentnumber']);
						}
						if(shipmentsArray.length > 1)
						{
							vCount = inboundUtility.checkShipmentsforExtNum(shipmentListDetails, whLocation);

							if(parseFloat(vCount) > 0)
							{
								shipmentValidationDtls['multiShipmentsForExtNum']='true';
							}
							else
							{
								shipmentValidationDtls['errorMessage'] = translator.getTranslationString("ISM_VALIDATION.ORDER_RECEIVED");
								shipmentValidationDtls['isValid'] = false ;
								return shipmentValidationDtls;
							}
						}
						else
						{
							vCount = inboundUtility.checkCountforRemaining(shipmentListDetails,shipmentNum,whLocation);
						}


						if (parseFloat(vCount) > 0) 
						{
							shipmentValidationDtls["vCount"] = vCount;
							shipmentValidationDtls['actualBeginTime'] = utility.getCurrentTimeStamp();
							shipmentValidationDtls['isValid'] = true;
							shipmentValidationDtls['enableReceiveAllOption']=inboundUtility.getReceiveAllOptionValue(whLocation);
							shipmentValidationDtls['shipmentId'] = shipmentListDetails[0]['internalid'];
							shipmentValidationDtls['shipmentNumber'] = shipmentListDetails[0]['shipmentnumber'];
							shipmentValidationDtls["shipmentDtl"]=shipmentListDetails;

						}
						else 
						{
							shipmentValidationDtls['errorMessage'] = translator.getTranslationString("ISM_VALIDATION.ORDER_RECEIVED"); 
							shipmentValidationDtls['isValid'] = false ;
						}
					}
					else{

						var isColumns = [];
						isColumns.push(search.createColumn({ name: 'internalid'}));
						isColumns.push(search.createColumn({ name: 'shipmentnumber'}));
						isColumns.push(search.createColumn({ name: 'status'}));
						isColumns.push(search.createColumn({ name: 'receivinglocation'}));

						var shipmentDetailsSrch=  search.load({
							id: 'customsearch_wms_inbound_shipment_valid'});

						var filters =  [];

						if(utility.isValueValid(shipmentInternalId))
						{
							filters = [['receivinglocation',search.Operator.ANYOF,['@NONE@',whLocation]],'and',
							           ['internalid', search.Operator.ANYOF, shipmentInternalId]];
						}
						else
						{
							//[['receivinglocation',search.Operator.ANYOF,['@NONE@',whLocation]],'and',
							//[['receivinglocation',search.Operator.ANYOF,['@NONE@',whLocation]],'and',
							if(!isNaN(shipmentNum))
							{
								filters =   [['shipmentnumber', search.Operator.IS, shipmentNum], 'or',
								            ['externaldocumentnumber', search.Operator.IS, shipmentNum]];
							}
							else
							{
								filters =   ['externaldocumentnumber', search.Operator.IS, shipmentNum];
							}
						}

						shipmentDetailsSrch.filterExpression = filters;
						shipmentDetailsSrch.columns = isColumns;

						var inboundShipmentResult = utility.getSearchResultInJSON(shipmentDetailsSrch);

						log.debug('inboundShipmentResult :', inboundShipmentResult);

						if(inboundShipmentResult.length > 0)
						{
							var orderStatus = inboundShipmentResult[0].status;
							var receivingLocation = inboundShipmentResult[0].receivinglocation;

							if(orderStatus == 'To Be Shipped')
							{
								shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_NOT_IN_TRANSIT');
								shipmentValidationDtls['isValid'] = false ;
							}
							else if(orderStatus == 'Closed')
							{
								shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_CLOSED');
								shipmentValidationDtls['isValid'] = false ;
							}
							else if(orderStatus == 'Received')
							{
								shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_RECEIVED');
								shipmentValidationDtls['isValid'] = false ;
							}
							else if(receivingLocation !== whLocation)
							{
								shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_RECEIVED_INVALID_LOC');
								shipmentValidationDtls['isValid'] = false ;
							}
							else
								{
								
								}
						}
						else
						{
							shipmentListDetails=[];
							if(action == 'itemorShipmentEntered'){
								var itemName = '';
								var itemInternalId = '';
								currItem = utility.getSKUIdWithName(shipmentNum,whLocation,'','');
								if (JSON.stringify(currItem) !== '{}' &&  utility.isValueValid(currItem)) {
									log.debug('currItem :', currItem);
									if(utility.isValueValid(currItem['itemInternalId']) ||
											utility.isValueValid(currItem['barcodeIteminternalid']))
									{
										itemInternalId = ((currItem['itemInternalId']) ? (currItem['itemInternalId']) : currItem['barcodeIteminternalid']);
										itemName = ((currItem['itemName']) ? (currItem['itemName']) : currItem['barcodeItemname']);
									}
									log.debug('itemInternalId :', itemInternalId);
                                    if(utility.isValueValid(currItem['barcodeVendor']))
                                        var vendorName = currItem['barcodeVendor'];
                                    if(utility.isValueValid(currItem['barcodeVendorId']))
                                        var vendorId = currItem['barcodeVendorId'];
									if(utility.isValueValid(itemInternalId)){
										var itemShipmentsListObj = inboundUtility.getItemShipmentList(itemInternalId,whLocation, vendorId);
										log.debug('itemShipmentsListObj :', itemShipmentsListObj);
										if(itemShipmentsListObj.length > 0)
										{
											shipmentValidationDtls['enableReceiveAllOption']=inboundUtility.getReceiveAllOptionValue(whLocation,transactionType);
											shipmentValidationDtls['actualBeginTime'] = utility.getCurrentTimeStamp();
											shipmentValidationDtls['isValid']=true;
											shipmentValidationDtls['itemInternalId'] =itemInternalId;
											shipmentValidationDtls['itemScanned'] = "T";
										}
										else
										{
											shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_ITEMSHIPMENT.NO_SHIPMENTS');
											shipmentValidationDtls['isValid'] = false;
										}
									}else{
										shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_ITEMSHIPMENT.NO_SHIPMENTS');
										shipmentValidationDtls['isValid'] = false;
									}
								}						
								else{
									shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.INVALIDSHIPMENT');
									shipmentValidationDtls['isValid'] = false;
								}
							}
						}
					}
				}
				else
				{
					shipmentValidationDtls["errorMessage"] = translator.getTranslationString("ISM_SHIPMENT_VALIDATE.INVALIDSHIPMENT");
					shipmentValidationDtls["isValid"]=false;	
				}
			}
			else
			{
				shipmentValidationDtls["errorMessage"] = translator.getTranslationString("ISM_SHIPMENT_VALIDATE.EMPTYPARAM");
				shipmentValidationDtls["isValid"]=false;	
			}
		}
		catch(e)
		{
			shipmentValidationDtls['isValid'] = false;
			shipmentValidationDtls['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return shipmentValidationDtls;
	}

	function getShipmentValidate(shipNum,shipId,whLocation)
	{
		var shipmentDetailsSrch=  search.load({
			id: 'customsearch_wms_inbound_shipment_valid'});

		var filters = [];
      
      log.debug({title:'shipment validate ',details:shipNum});

		if(utility.isValueValid(shipId)){
			filters= [
			          ['receivinglocation',search.Operator.ANYOF,['@NONE@',whLocation]],'and',
			          ['internalid',search.Operator.ANYOF,shipId],'and',
			          ['status',search.Operator.ANYOF,['inTransit','partiallyReceived']]];
		}
		else{
			if(!isNaN(shipNum))
			{
               log.debug({title:'shipment validate1 ',details:shipNum});
              
				filters= [	['receivinglocation',search.Operator.ANYOF,['@NONE@',whLocation]],'and',
				          	[['shipmentnumber', search.Operator.ANYOF, shipNum], 'or',
				          	 ['externaldocumentnumber', search.Operator.IS, shipNum]],'and',
				          	 ['status',search.Operator.ANYOF,['inTransit','partiallyReceived']]];
			}
			else{
              log.debug({title:'shipment validate2 ',details:shipNum});
				filters= [	['receivinglocation',search.Operator.ANYOF,['@NONE@',whLocation]],'and',
				          	[['shipmentnumber', search.Operator.ANYOF, shipNum], 'or',
				          	 ['externaldocumentnumber', search.Operator.IS, shipNum]],'and',
				          	['status',search.Operator.ANYOF,['inTransit','partiallyReceived']]];
			}
		}


		log.error({title:'filters',details:filters});
		shipmentDetailsSrch.filterExpression= filters;

		return utility.getSearchResultInJSON(shipmentDetailsSrch);
	}
		return {
		'post': doPost
	};
});
