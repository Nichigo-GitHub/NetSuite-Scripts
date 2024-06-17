/**
 * Script Description
 * This script is used to create labels.
 *//***************************************************************************
 * @NApiVersion 2.x
 * @NScriptType usereventscript
 * @NModuleScope Public
 *//***************************************************************************
  Copyright � 2019, Oracle and/or its affiliates. All rights reserved. 
 ***************************************************************************/
define(
		['./wms_utility','./wms_labelprinting','N/runtime','N/search'],
		function (utility,labelPrintingObj,runtime,search){
			
function createLabels(context)
{
	try
	{
		var type = context.type;
		var newRecord = context.newRecord;
		 log.debug({title:'newRecord',details:newRecord});
		var taskType=newRecord.getValue({fieldId:'custrecord_wmsse_tasktype'});//
		var wmsstatusflag=newRecord.getValue({fieldId:'custrecord_wmsse_wms_status_flag'});
		
	    var scriptType = runtime.executionContext;
	    log.debug({title:'scriptType',details:scriptType});
	    log.debug({title:'taskType',details:taskType});
		if(type == 'create' && taskType == 2 && wmsstatusflag ==3 && (scriptType == 'restlet' || scriptType == 'RESTLET'))
		{
			var ponumberId = newRecord.getValue({fieldId:'custrecord_wmsse_order_no'});
			var ponumber = '';
			var poLookUp = search.lookupFields({
				type: search.Type.TRANSACTION,
				id: ponumberId,
				columns: ['tranid']
			});
			if (poLookUp.tranid != undefined) 
			{
				ponumber = poLookUp.tranid;
			}
			var userId= newRecord.getValue({fieldId:'custrecord_wmsse_upd_user_no'});
			var userLookUp = search.lookupFields({
				type: search.Type.EMPLOYEE,
				id: userId,
				columns: ['entityid']
			});
			var username = '';
			if (userLookUp.tranid != undefined) 
			{
				username = userLookUp.entityid;
			}
			var itemId= newRecord.getValue({fieldId:'custrecord_wmsse_sku'});
			var itemqty= newRecord.getValue({fieldId:'custrecord_wmsse_act_qty'});			
			var barcodestring= newRecord.getValue({fieldId:'custrecord_wmsse_compositebarcode_string'});
			var whLocation = newRecord.getValue({fieldId:'custrecord_wmsse_wms_location'});
			var recid=newRecord.getValue({fieldId:'id'});
			
			var zebrapalletlabel = utility.getSystemRuleValue('Label Printing: Pallet labels using ZPL');
			log.debug({title:'zebrapalletlabel',details:zebrapalletlabel});
			log.debug({title:'barcodestring',details:barcodestring});

			if(!utility.isValueValid(barcodestring))
			{
				barcodestring = "";
			}

			if(zebrapalletlabel=="Y")
			{
				labelPrintingObj.generatePalletLabel(ponumber,itemId,itemqty,username,whLocation,barcodestring, recid);

			}
			var zebraitemlabel=utility.getSystemRuleValue('Label Printing: Item labels using ZPL');
			log.debug({title:'zebraitemlabel',details:zebraitemlabel});
			
			if(zebraitemlabel=="Y")
			{
				labelPrintingObj.generateItemLabel(ponumber,itemId,whLocation, recid);
			}

			var zebrathirdpartylabel=utility.getSystemRuleValue('Label Printing: Item Labels with 3rd party integration');
			log.debug({title:'zebrathirdpartylabel', details:zebrathirdpartylabel});
			if(zebrathirdpartylabel=="Y")
			{
				labelPrintingObj.generateBartenderItemLabel(newRecord);
			}

		}

	}
	catch(e)
	{
		log.error({title:'exception',details:e});	
	}

}
return {
	afterSubmit : createLabels
};
});
