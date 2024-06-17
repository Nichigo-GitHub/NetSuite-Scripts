/**
 *     Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search','N/runtime','N/record','./wms_utility'],function(search,runtime,record,utility){

	function afterSubmit(scriptContext) {

		if (scriptContext.type=='edit' || scriptContext.type=='xedit')
		{
			log.debug({title:'Into Edit',details:'Into Edit'});	

			try
			{
				var newRecord = scriptContext.newRecord;
				var	pickTaskId = newRecord.getValue('id');

				var vPicktaskRec = record.load({type:'picktask',
					id:pickTaskId
				});

				var pickTaskLocation = vPicktaskRec.getValue({fieldId : 'location'});

				var pickType = '';
				var isContainerScanRequired = "N";

				var systemRule ="Use cartons for single-order picking?";
				isContainerScanRequired = utility.getSystemRuleValue(systemRule,pickTaskLocation);
				if(isContainerScanRequired == 'N'){
					systemRule ="Use cartons for multi-order picking?";
					isContainerScanRequired = utility.getSystemRuleValue(systemRule,pickTaskLocation);
				}
				if(isContainerScanRequired == 'Y'){

					var complinelength =vPicktaskRec.getLineCount({
						sublistId:'pickactions'
					});
					for(var Ifitr=0;Ifitr<complinelength;Ifitr++)
					{
						var invdetailLine = vPicktaskRec.getSublistSubrecord({
							sublistId :'pickactions',
							fieldId : 'inventorydetail',
							line : parseInt(Ifitr)
						});


						var invDetailslinelength =invdetailLine.getLineCount({
							sublistId:'inventoryassignment'
						});

						for (var invDetailsIndex = 0; invDetailsIndex < invDetailslinelength; invDetailsIndex++){

							var wmsPickCarton = invdetailLine.getSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'custrecord_wms_pickcarton',
								line : invDetailsIndex								
							});	

							var corePickCarton = invdetailLine.getSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'pickcarton',
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
							var wmsStage = invdetailLine.getSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'custrecord_wmsse_staged',
								line : invDetailsIndex								
							});	

							if(wmsStage == true){

								var quantity = invdetailLine.getSublistValue({
									sublistId: 'inventoryassignment',
									fieldId:'quantity', 
									line : invDetailsIndex
								});

								invdetailLine.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId:'quantitystaged', 
									value:quantity,
									line : invDetailsIndex
								});
							}
						}
					}

					var picktaskrecId=vPicktaskRec.save();
				}

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
