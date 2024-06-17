/**
 *     Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/runtime','N/record','N/config','./wms_utility'],

		function(runtime,record,config,utility) {

	function afterSubmit(scriptContext) {
		log.debug('runtime.executionContext',runtime.executionContext);
		if (runtime.executionContext === "RESTLET"){
			try
			{
				var newRecord = scriptContext.newRecord;
				var newRecordPreferencesName = newRecord.getValue({fieldId:'name'});
				log.debug('newRecord',newRecord);				
				var wmsPreferencesDetials = utility.getWmsPreferencesSearch(newRecordPreferencesName);
				if(wmsPreferencesDetials.length>0)
				{					
					updatePreferences(wmsPreferencesDetials);
				}
				else
				{					
					utility.createWmsPreferences();
				}
			}
			catch(e)
			{
				log.error('Exeception in UE',e);
			}
		}
		
		function updatePreferences(wmsPreferencesDetials)
		{
			var recordId = wmsPreferencesDetials[0].internalid;
			var preferencesName = wmsPreferencesDetials[0].wmsPreferencesName;					
			var emailRequiredFlag = wmsPreferencesDetials[0].wmsPreferencesEmailRequired;;
			var preferencesFlag=false;
			var roleSubsidaries ="";
			var notesFieldData = "";
			log.debug('preferencesName',preferencesName);
			if(preferencesName == "OVERRECEIPTS" || preferencesName =="ITEMCOSTASTRNFRORDCOST"
				|| preferencesName =="DEPTMANDATORY" || preferencesName =="CLASSMANDATORY"|| preferencesName =="CREATEITEMFULFILLMENT")
			{
				var vConfig = config.load({
					type: config.Type.ACCOUNTING_PREFERENCES
				});
				if(utility.isValueValid(vConfig)){
					preferencesFlag = vConfig.getValue({
						fieldId: preferencesName
					});
				}
				if(preferencesName =="CREATEITEMFULFILLMENT")
                {
					if(utility.isValueValid(vConfig)){
						notesFieldData = vConfig.getValue({
							fieldId: preferencesName
						});
					}
                }
				
			}
			else if(emailRequiredFlag) {
				var emailResult = utility.searchOnEmployeeForEmailId(preferencesName);
				notesFieldData = emailResult[0].email;
			} else {
				notesFieldData = utility.createDynamicSearchOnRoleForSubsidaries(preferencesName);
			}
		
			record.submitFields({
				type: 'customrecord_wms_accounting_preferences',
				id: recordId,
				values: {							
					'custrecord_wms_accountingpre_value': preferencesFlag,
					'custrecord_wms_accountingpre_notes': notesFieldData
				}
			});
		}
	}
	return {		
		afterSubmit:afterSubmit
	};
});
