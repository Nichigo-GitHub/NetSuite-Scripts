/**
 *     Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search','N/runtime','N/record','./wms_utility'],

		function(search,runtime,record,utility) {

	function afterSubmit(scriptContext) {

		if (scriptContext.type=='create' || scriptContext.type=='edit' || scriptContext.type=='xedit')
		{
			try
			{
				var newRecord = scriptContext.newRecord;
				var	itemFulfillmentId = newRecord.getValue('id');

				var frecord = record.load({
					type : 'itemfulfillment',
					id : itemFulfillmentId,
					isDynamic: false
				});

				var complinelength =frecord.getLineCount({
					sublistId:'item'
				});
		
					for(var Ifitr=0;Ifitr<complinelength;Ifitr++)
					{
							var invdetailLine=frecord.getSublistSubrecord({sublistId: 'item',fieldId: 'inventorydetail',line: Ifitr});
								
							var invDetailslinelength =invdetailLine.getLineCount({
								sublistId:'inventoryassignment'
							});
							
							for (var invDetailsIndex = 0; invDetailsIndex < invDetailslinelength; invDetailsIndex++) {

								var wmsPickCarton = invdetailLine.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'custrecord_wms_pickcarton',
									line : invDetailsIndex								
								});	

								var wmsPackCarton = invdetailLine.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'custrecord_wmsse_packing_container',
									line : invDetailsIndex								
								});	

								var corePickCarton = invdetailLine.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'pickcarton',
									line : invDetailsIndex								
								});	

								var corePackCarton = invdetailLine.getSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'packcarton',
									line : invDetailsIndex								
								});	

								if((utility.isValueValid(wmsPickCarton)) && (corePickCarton==null || corePickCarton=='')){
									invdetailLine.setSublistValue({
										sublistId : 'inventoryassignment',
										fieldId : 'pickcarton',
										line : invDetailsIndex,
										value : wmsPickCarton
									});
								}
								else if((utility.isValueValid(corePickCarton)) && (wmsPickCarton==null || wmsPickCarton=='')){
									invdetailLine.setSublistValue({
										sublistId : 'inventoryassignment',
										fieldId : 'custrecord_wms_pickcarton',
										line : invDetailsIndex,
										value : corePickCarton
									});
								}

								if((utility.isValueValid(wmsPackCarton)) && (corePackCarton==null || corePackCarton=='')){
									invdetailLine.setSublistValue({
										sublistId : 'inventoryassignment',
										fieldId : 'packcarton',
										line : invDetailsIndex,
										value : wmsPackCarton
									});
								}
								else if((utility.isValueValid(corePackCarton)) && (wmsPackCarton==null || wmsPackCarton=='')){
									invdetailLine.setSublistValue({
										sublistId : 'inventoryassignment',
										fieldId : 'custrecord_wmsse_packing_container',
										line : invDetailsIndex,
										value : corePackCarton
									});
								}

							}
					}
				var itemFullfillrecId=frecord.save();
			}
			catch(exp) {
				log.debug({title:'exp',details:exp});	
				log.error({title:'errorMessage',details:exp.message+" Stack :"+exp.stack});	
			}
		}		
	}

	return {		
		afterSubmit: afterSubmit
	};
});
