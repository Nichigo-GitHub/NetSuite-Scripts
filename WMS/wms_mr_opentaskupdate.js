/**
 * Copyright � 2023, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','N/record','../Restlets/wms_inboundUtility','../Restlets/wms_utility'],

		function(runtime,record,inboundUtility,utility) {


	function getInputData(context) {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var orderId = scriptObj.getParameter({ name : 'custscript_wms_orderid'});
			var warehouseId = scriptObj.getParameter({ name : 'custscript_wms_warehouseInternalId'});
			var shipmentId = scriptObj.getParameter({ name : 'custscript_wms_shipmentId'});
			var processType =scriptObj.getParameter({ name : 'custscript_wms_processType'});
			var opentaskSearchResults='';
			var mrScriptName ='';
			if(processType =="ISM"){
				opentaskSearchResults = inboundUtility.getOpenTaskShipmentDetails(shipmentId, warehouseId,'T');
				mrScriptName ='ISMrandomTallyscanBinUpdate';
				orderId =shipmentId;
			}else {
				opentaskSearchResults = inboundUtility.getOTResultsforIRPosting(orderId, '', '', '', warehouseId, 'T');
				mrScriptName ='randomTallyscanBinUpdate';
			}
			var inputArr = [];
			inputArr.push(opentaskSearchResults);
			utility.updateScheduleScriptStatus(mrScriptName,runtime.getCurrentUser().id,"In Progress",orderId,"","","");
          log.debug('inputArr',inputArr); 
           return inputArr;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}
	function map(context){
		try{
			var resultArr = JSON.parse(context.value);
			var scriptObj = runtime.getCurrentScript();
			var processType =scriptObj.getParameter({ name : 'custscript_wms_processType'});
			for (var val in resultArr) {
				var value ='';
				var opentaskDtls = resultArr[val];
				var key = opentaskDtls.id;
				if(processType =="ISM"){
					value =key;
				}else {
					value = opentaskDtls.custrecord_wmsse_kitflag;
				}
				context.write(key, value);
			}
		}
		catch (e) {
			log.error({title:'Exception in map',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}

	function reduce(context) {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var itemReceiptId = scriptObj.getParameter({ name : 'custscript_wms_itemreceiptId'});
			var binInternalId = scriptObj.getParameter({ name : 'custscript_wms_bininternalidnumber'});
			var processType =scriptObj.getParameter({ name : 'custscript_wms_processType'});
			var systemRuleValue = scriptObj.getParameter({name:'custscript_wms_systemRuleValue'});
			var shipmentId = scriptObj.getParameter({ name : 'custscript_wms_shipmentId'});
			var opentaskId = context.key;
			var isKitComponentFlag = context.values[0];
		  if(processType =="ISM"){
			  if (systemRuleValue == 'N') {
				  record.submitFields({
					  type: 'customrecord_wmsse_trn_opentask',
					  id: opentaskId,
					  values: {
						  'custrecord_wmsse_rec_inb_shipment': shipmentId,
						  'custrecord_wmsse_actbeginloc': binInternalId,
						  'custrecord_wmsse_actendloc': binInternalId
					  }
				  });
			  } else {
				  record.submitFields({
					  type: 'customrecord_wmsse_trn_opentask',
					  id: opentaskId,
					  values: {
						  'custrecord_wmsse_actbeginloc': binInternalId,
						  'custrecord_wmsse_actendloc': binInternalId
					  }
				  });
			  }
		  }else {
				if (isKitComponentFlag == false || isKitComponentFlag == 'false') {
					if (itemReceiptId) {

						record.submitFields({
							type: 'customrecord_wmsse_trn_opentask',
							id: opentaskId,
							values: {
								'custrecord_wmsse_nsconfirm_ref_no': itemReceiptId,
								'custrecord_wmsse_actbeginloc': binInternalId,
								'custrecord_wmsse_actendloc': binInternalId
							}
						});
					}
					else{
						record.submitFields({
							type: 'customrecord_wmsse_trn_opentask',
							id: opentaskId,
							values: {
								'custrecord_wmsse_actbeginloc': binInternalId,
								'custrecord_wmsse_actendloc': binInternalId
							}
						});
					}
				}
		  }
		}
		catch(e)
		{
			log.error({title:'Exception in Reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}
	
	function summarize(summary) {
		var scriptObj = runtime.getCurrentScript();
		var orderId = scriptObj.getParameter({ name : 'custscript_wms_orderid'});
		var processType =scriptObj.getParameter({ name : 'custscript_wms_processType'});
		var shipmentId = scriptObj.getParameter({ name : 'custscript_wms_shipmentId'});
		var mrScriptName ='';
		if(processType =="ISM"){
			mrScriptName ='ISMrandomTallyscanBinUpdate';
			orderId =shipmentId;
		}else {
			mrScriptName ='randomTallyscanBinUpdate';
		}
		utility.updateScheduleScriptStatus(mrScriptName,runtime.getCurrentUser().id,"Completed",orderId,"","","");


	}

	return {
		getInputData: getInputData,
		map:map,
		reduce: reduce,
		summarize: summarize
	};

});
