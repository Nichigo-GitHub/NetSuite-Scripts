/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_translator','./wms_inboundUtility', 'N/record','N/task','N/runtime'],
		function(search,utility,translator,inboundUtility, record, task,runtime) {

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 */
	function doPost(requestBody) {

		var debugString = '';
		var warehouseLocationId;
		var shipmentNumber;
		var shipmentInternalId;
		var shipmentListDetails = new Object();

		var shipmentReceiptId;
		var isMapReduceScriptInvoked;
		var impactedRecords={};

		try{
			if(utility.isValueValid(requestBody)) {

				var requestParams	= requestBody.params;
				debugString = debugString + 'Request Params :'+requestParams;
				warehouseLocationId  	= requestParams.warehouseLocationId;
				shipmentInternalId = requestParams.shipmentInternalId;
				shipmentNumber = requestParams.shipmentNumber;
				log.debug({title:'Request Params :', details:requestParams});

					var openTaskDtls = inboundUtility.getOpenTaskShipmentDetails(shipmentInternalId, warehouseLocationId);
					log.debug('Open Task Dtl Length :', openTaskDtls.length);
					impactedRecords['_ignoreUpdate'] = true;
					if (openTaskDtls.length > 50) {
						var shipmentStatus = utility.chkScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', shipmentInternalId);
						if (shipmentStatus == 'Completed') {
							var schstatus = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
							schstatus.scriptId = 'customscript_wms_sch_ism_postitemreceipt';
							schstatus.deploymentId = null;
							schstatus.params = {
								"custscript_wms_ism_ir_shipmentid": shipmentInternalId,
								"custscript_wms_ism_ir_location": warehouseLocationId
							};

							var schTaskId = schstatus.submit();
							isMapReduceScriptInvoked = 'T';
							var taskStatus = task.checkStatus(schTaskId);
							if (taskStatus.status != 'FAILED') {
							var currentUserId = runtime.getCurrentUser().id;
							utility.updateScheduleScriptStatus('WMS ISM Post ItemReceipt Scheduler', currentUserId, 'Submitted',
								shipmentInternalId, warehouseLocationId);
							}
							shipmentListDetails['isValid'] = true;
							shipmentListDetails['isMapReduceScriptInvoked'] = isMapReduceScriptInvoked;
						}
						else {
							shipmentListDetails = {
								errorMessage: translator.getTranslationString('ISM.SCH.CONCURRENCY'),
								isValid: false
							};
						}
					} else if (openTaskDtls.length > 0) {
						var openTaskQtyDetails = inboundUtility.getQtyDetailsFromOpenTask(shipmentInternalId, warehouseLocationId);

					shipmentReceiptId = inboundUtility.postItemReceiptISM(shipmentInternalId, warehouseLocationId, openTaskDtls, openTaskQtyDetails);
					if(shipmentReceiptId){
						var openTaskIdarray = this.updateOpenTaskWithShipmentReceiptId(openTaskDtls, shipmentReceiptId);
						shipmentListDetails['isValid'] = true;
						shipmentListDetails['shipmentNumber'] = shipmentNumber;
						
						var inputParamObj={};
						inputParamObj.shipmentId =shipmentInternalId;
						inputParamObj.shipmentReceiptId =shipmentReceiptId;
						inputParamObj.openTaskIdarray =openTaskIdarray;
						inputParamObj._ignoreUpdate =false;
						impactedRecords = inboundUtility.noCodeSolForISMReceiving(inputParamObj);
						log.debug({title:'impactedRecords :', details: impactedRecords });
					}
				}
				else
				{
					shipmentListDetails = {
							errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.NOMATCH'),
							isValid      : false
					};	
				}
				shipmentListDetails.impactedRecords = impactedRecords;
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

	function updateOpenTaskWithShipmentReceiptId(openTaskDtls, shipmentReceiptId){
		var columnsObject = new Object();
		var openTaskIdArray= [];
		columnsObject['custrecord_wmsse_rec_inb_shipment'] = shipmentReceiptId;
		for(var openTaskItr in openTaskDtls){
			utility.submitRecord('customrecord_wmsse_trn_opentask', openTaskDtls[openTaskItr].internalid, columnsObject);
			openTaskIdArray.push(parseInt(openTaskDtls[openTaskItr].internalid));
		}
		return openTaskIdArray;
	}

	return {
		'post': doPost,
		updateOpenTaskWithShipmentReceiptId : updateOpenTaskWithShipmentReceiptId

	};

});
