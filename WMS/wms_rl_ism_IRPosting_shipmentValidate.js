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
		var requestParams;
		var warehouseLocationId;
		var shipmentNumber;
		var shipmentInternalId;
		var shipmentStatus;

		var shipmentRecord;
		var linesCount;		

		var shipmentValidationDtls = {};
		try{

			if(utility.isValueValid(requestBody))
			{
				requestParams = requestBody.params;
				debugString			= debugString + "requestParams :"+requestParams;
				warehouseLocationId = requestParams.warehouseLocationId;
				shipmentNumber		= requestParams.shipmentNumber;
				shipmentInternalId 	= requestParams.shipmentInternalId;
				linesCount			= requestParams.linesCount;

				log.debug({title:'requestParams:',details:requestParams});

				if(utility.isValueValid(shipmentNumber) || shipmentInternalId){
					var itemResults = [];
					var shipmentArray = [];

					if(!shipmentInternalId){

						shipmentRecord = this.getShipmentInternalId(shipmentNumber, warehouseLocationId);
						log.debug('shipmentRecord', shipmentRecord);

						if(shipmentRecord.length > 0)
						{
							if(shipmentRecord.length == 1)
							{
								shipmentInternalId = shipmentRecord[0].id;
								shipmentStatus = shipmentRecord[0].status;
							}
							else
							{
								for(var shipmentItr=0; shipmentItr<shipmentRecord.length; shipmentItr++)
								{
									if(shipmentArray.indexOf(shipmentRecord[shipmentItr].id)==-1)
										shipmentArray.push(shipmentRecord[shipmentItr].id);
								}
							}

								if (utility.isValueValid(shipmentStatus) && shipmentStatus != 'In Transit' && shipmentStatus != 'Partially Received') {
									this.getShipmentStatusErrorMessages(shipmentStatus, shipmentValidationDtls);
								} else {
									if (shipmentArray.length > 1) {
										shipmentInternalId = shipmentArray;
									}
									shipmentDetails = this.getShipmentListForIR(warehouseLocationId, shipmentInternalId);
									var shipmentsLength = shipmentDetails.length;
									if (shipmentsLength > 0) {
										var shipmentStatus = 'Completed';
										if (shipmentsLength == 1) {
											shipmentStatus = utility.chkScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', shipmentInternalId);
										}
										if (shipmentStatus == 'Completed') {
											shipmentValidationDtls["isValid"] = true;
											shipmentValidationDtls['shipmentNumber'] = shipmentDetails[0].custrecord_wmsse_inbshipmentText;
											shipmentValidationDtls['shipmentInternalId'] = shipmentDetails[0].custrecord_wmsse_inbshipment;
											shipmentValidationDtls['info_shipmentNumber'] = shipmentDetails[0].custrecord_wmsse_inbshipmentText;
											shipmentValidationDtls['info_lines'] = shipmentDetails[0].custrecord_wmsse_line_no;

											if (shipmentsLength > 1) {
												shipmentValidationDtls['multiShipmentsForExtNum'] = 'true';
												shipmentValidationDtls['externalDocNumber'] = shipmentNumber;
												shipmentValidationDtls['shipmentArray'] = shipmentArray;
												log.debug('shipmentDetails :', shipmentDetails);
											}
										}
										else {
											this.throwValidationMessage(shipmentValidationDtls, "ISM.SCH.CONCURRENCY");
										}



									} else {
										this.throwValidationMessage(shipmentValidationDtls, "ISM_SHIPMENT_VALIDATE.INVALIDSHIPMENT");
									}

								}
							} else {
								this.throwValidationMessage(shipmentValidationDtls, "ISM_SHIPMENT_VALIDATE.INVALIDSHIPMENT");
							}
						} else {
							var shipmentStatus = utility.chkScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', shipmentInternalId);
							if (shipmentStatus == 'Completed') {
								shipmentValidationDtls['shipmentNumber'] = shipmentNumber;
								shipmentValidationDtls['shipmentInternalId'] = shipmentInternalId;
								shipmentValidationDtls['info_shipmentNumber'] = shipmentNumber;
								shipmentValidationDtls['info_lines'] = linesCount;
								shipmentValidationDtls["isValid"] = true;
							}
							else {
								this.throwValidationMessage(shipmentValidationDtls, "ISM.SCH.CONCURRENCY");
							}
						}
					}
					else {
						this.throwValidationMessage(shipmentValidationDtls, "ISM_SHIPMENT_VALIDATE.INVALIDSHIPMENT");
					}
				}
				else {
					this.throwValidationMessage(shipmentValidationDtls, "ISM_SHIPMENT_VALIDATE.EMPTYPARAM");
				}
			}
			catch (e) {
				shipmentValidationDtls['isValid'] = false;
				shipmentValidationDtls['errorMessage'] = e.message;
				log.error({ title: 'errorMessage', details: e.message + " Stack :" + e.stack });
				log.error({ title: 'debugString', details: debugString });
			}

		return shipmentValidationDtls;
	}

	function throwValidationMessage(obj, errorMessage){
		obj["errorMessage"] = translator.getTranslationString(errorMessage);
		obj["isValid"] = false;	
	}

	function getShipmentStatusErrorMessages(status, shipmentValidationDtls){
		if(status == 'To Be Shipped')
		{
			shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_NOT_IN_TRANSIT');
			shipmentValidationDtls['isValid'] = false ;
		}
		else if(status == 'Closed')
		{
			shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_CLOSED');
			shipmentValidationDtls['isValid'] = false ;
		}
		else if(status == 'Received')
		{
			shipmentValidationDtls['errorMessage'] = translator.getTranslationString('ISM_SHIPMENT_VALIDATE.SHIPMENT_RECEIVED');
			shipmentValidationDtls['isValid'] = false ;
		}
	}

	function getShipmentInternalId(shipmentNumber, warehouseLocationId)
	{
		var filters = new Array();
		var searchRes = new Array();
		var shipementRecArray = new Array();

		var shipmentDetailsSearch = search.load({
			id: 'customsearch_wms_ism_shipment_validate',
			name: 'WMS ISM Shipment Validation'});

		filters.push(search.createFilter({
			name: 'receivinglocation',
			operator: search.Operator.ANYOF,
			values: ['@NONE@',warehouseLocationId]
		}));

		filters.push(search.createFilter({
			name: 'shipmentnumber',
			operator: search.Operator.ANYOF,
			values: shipmentNumber
		}));
		shipmentDetailsSearch.filters = filters;
		searchRes = utility.getSearchResultInJSONForValidation(shipmentDetailsSearch);
		if(searchRes.length > 0 && searchRes[0]['shipmentnumber'] == shipmentNumber){
			shipementRecArray.push(searchRes[0]);
		}
		log.debug('searchRes shipNum', searchRes);
		log.debug('shipementRecArray', shipementRecArray);

		if(shipementRecArray.length == 0){
			
			var shipmentDtlsExtNumSearch = search.load({
				id: 'customsearch_wms_ism_shipment_validate',
				name: 'WMS ISM Shipment Validation'});
			
			filters = [];
			filters.push(search.createFilter({
				name: 'receivinglocation',
				operator: search.Operator.ANYOF,
				values: ['@NONE@',warehouseLocationId]
			}));
			filters.push(search.createFilter({
				name: 'externaldocumentnumber',
				operator: search.Operator.ANYOF,
				values: shipmentNumber
			}));
			shipmentDtlsExtNumSearch.filters = filters;

			shipementRecArray = utility.getSearchResultInJSON(shipmentDtlsExtNumSearch);
			log.debug('searchRes ext Doc', shipementRecArray);
		}
		return shipementRecArray;
	}

	function getShipmentListForIR(warehouseLocationId, shipmentInternalId){
		var shipmentDetailsSrch = search.load({
			id : 'customsearch_wms_ism_ir_shipmentlist',
			name : 'WMS ISM Post IR Shipment List'
		});

		if(shipmentInternalId){
			shipmentDetailsSrch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_inbshipment',
				operator: search.Operator.ANYOF,
				values: shipmentInternalId
			}));
		}

		shipmentDetailsSrch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_wms_location',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));

		return utility.getSearchResultInJSON(shipmentDetailsSrch);
	}

	return {
		'post': doPost,
		getShipmentInternalId : getShipmentInternalId,
		getShipmentListForIR : getShipmentListForIR,
		getShipmentStatusErrorMessages : getShipmentStatusErrorMessages,
		throwValidationMessage : throwValidationMessage
	};
});
