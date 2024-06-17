/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
 define(['N/runtime','./wms_packingUtility','N/record'],
 	function(runtime,packUtility,record) {

 		function execute(context) {
      try
      {
       var warehouseLocationId = runtime.getCurrentScript().getParameter("custscript_wms_sch_packing_whlocation");
       var itemFulfillmentId = runtime.getCurrentScript().getParameter("custscript_wms_sch_packing_ifinternalid");
       var orderId = runtime.getCurrentScript().getParameter("custscript_wms_sch_packing_orderid");
       
       var itemFulfillmentRecord = record.load({
			type : 'itemfulfillment',
			id : itemFulfillmentId,
			isDynamic: true
		});

       packUtility.updateItemFulfillmentinUE(warehouseLocationId,itemFulfillmentId,orderId,itemFulfillmentRecord);
     }
     catch(e)
     {
      log.error({title:'error in execute',details:e});
    }
  }	

  return {
    execute: execute
  };

});
