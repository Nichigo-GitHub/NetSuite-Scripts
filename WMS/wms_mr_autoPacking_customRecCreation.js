/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 *//**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
  /** Map Reduce to create WMS custom records after Packing process is completed
     **/
 define(['N/runtime','./wms_utility','./wms_packingUtility'],

 	function(runtime,utility,packUtility) {

	 function getInputData() {
	 	try
	 	{
	 		var scriptObj = runtime.getCurrentScript();
	 		log.debug("MAP_Remaining governance units getInputData: " + scriptObj.getRemainingUsage());

	 		var packCartonArray  	= scriptObj.getParameter({ name : 'custscript_wms_mr_packing_cartondetails'});
	 		var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_whlocation'});
	 		var itemFulfillmentId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_ifinternalid'});

	 		var currentUserId = runtime.getCurrentUser().id;
	 		utility.updateScheduleScriptStatus('WMS Auto Packing Labels Creation Map Reduce',currentUserId,'In Progress',itemFulfillmentId,
	 			warehouseLocationId);
	 		var packCartonDetails = JSON.parse(packCartonArray);
	 		log.debug('packCartonDetails',packCartonDetails);
	 		return packCartonDetails;
	 	}
	 	catch(e)
	 	{
	 		log.error({title:'Exception in Getinputdata',details:e});
	 	}
	 }

	 function reduce(context) {

	 	var scriptObj = runtime.getCurrentScript();
	 	var orderType = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_ordertype'});
	 	var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_whlocation'});
	 	var itemFulfillmentId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_ifinternalid'});
	 	var objItemLevelDtl =  JSON.parse(scriptObj.getParameter({ name : 'custscript_wms_mr_packing_itemlveldetail'}));
	 	var recordType = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_recordtype'});
	 	var orderId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_orderid'});
	 	var labelsSystemRuleObj = JSON.parse(scriptObj.getParameter({ name : 'custscript_wms_mr_packing_systemruledata'}));
	 	
        try
	 	{ 
	 		var packCarton =context.values;
            packCarton = JSON.parse(JSON.stringify(packCarton));
            packCarton = packCarton[0];
	 	
	 		var inputParamObj={};
				inputParamObj.orderId = orderId;
				inputParamObj.ordertype = orderType;
				inputParamObj.warehouseLocationId = warehouseLocationId;
				inputParamObj.itemFulfillmentId = itemFulfillmentId;
				inputParamObj.objItemLevelDtl = objItemLevelDtl;
				inputParamObj.recordType = recordType;
				inputParamObj.cartonNo = packCarton; 
				inputParamObj.labelsSystemRuleObj = labelsSystemRuleObj;
				packUtility.customRecordsCreationAfterPacking(inputParamObj);
		}
		catch(e)
		{
			log.error({title:'Exception in reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}

	}

	 function summarize(summary) {
	 	try
	 	{
	 		var scriptObj = runtime.getCurrentScript();
	 		var currentUserId = runtime.getCurrentUser().id;
	 		var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_whlocation'});
	 		var itemFulfillmentId = scriptObj.getParameter({ name : 'custscript_wms_mr_packing_ifinternalid'});

	 		utility.updateScheduleScriptStatus('WMS Auto Packing Labels Creation Map Reduce',currentUserId,'Completed',
	 			itemFulfillmentId,warehouseLocationId);
	 	}
	 	catch(e)
	 	{
	 		log.error({title:'Exception in Summarize',details:e});    		
	 		log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
	 	}

	 }

	 return {
	 	getInputData: getInputData,
	 	reduce: reduce,
	 	summarize: summarize
	 };

	});
