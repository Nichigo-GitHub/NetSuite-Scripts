/**
 *    Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/runtime','../Restlets/wms_utility','N/search','N/record'],
		function(runtime,utility,search,record) {

	function execute(context) {

		try
		{
			waveFieldsMigration();
		}
		catch(e)
		{
			log.error({title:'error in execute',details:e});
		}
	}	

	function waveFieldsMigration(){

		var wmsWaveReleaseTemplateSearchObj = search.load({
			id: 'customsearch_wms_waverelease_migration'			
		}); 

		var wmsWaveReleaseTemplateResult = utility.getSearchResultInJSON(wmsWaveReleaseTemplateSearchObj);

		if(wmsWaveReleaseTemplateResult.length > 0)
		{
			for(var wmsWaveReleaseTemplateSearchObjIndex in wmsWaveReleaseTemplateResult)
			{
				var wmsWaveReleaseTemplateRec = wmsWaveReleaseTemplateResult[wmsWaveReleaseTemplateSearchObjIndex];
				var wmsWaveReleaseTemplateRecInternalId = wmsWaveReleaseTemplateRec.id;

				var wmsWaveReleaseTemplateRecordObj = record.load({
					type:'customrecord_wms_wave_release_schedule',
					id:wmsWaveReleaseTemplateRecInternalId
				});

				var requestStatusChange = wmsWaveReleaseTemplateRecordObj.getText({fieldId:'custrecord_wms_wave_rls_status_req'});
				var emailId = wmsWaveReleaseTemplateRecordObj.getValue({fieldId:'custrecord_wms_wave_rls_email'});

				wmsWaveReleaseTemplateRecordObj.setValue({fieldId:'custrecord_wms_waverelease_status',value: '1'});
				
				var requestStatusChangeLength = requestStatusChange.length;

				if((requestStatusChangeLength>0) && (requestStatusChange.indexOf('Wave Created')!=-1)){
					if(requestStatusChangeLength == 1){
						wmsWaveReleaseTemplateRecordObj.setValue({fieldId:'custrecord_wms_wave_rls_email',value: ''});
					}
					wmsWaveReleaseTemplateRecordObj.setValue({fieldId:'custrecord_wms_wave_rls_email_wavecreate',value: emailId});
				}
				try{
					wmsWaveReleaseTemplateRecordObj.save();
				}
				catch(e){
					log.error({title:'error in waveFieldsMigration',details:e});
				}
			}
		}
	}

	return {
		execute: execute
	};

});
