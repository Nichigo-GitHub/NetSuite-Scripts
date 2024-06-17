/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 *//**/***************************************************************************

 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget','../Restlets/wms_translator','../Restlets/wms_utility','N/task'],
		function(serverWidget, translator,utility,task) {

	function migrationScript(context) {
		if (context.request.method == 'GET') {
			fnCreateForm(context);
		}
		else
		{
			var taskId = '';
			try
			{
				taskId = invokeCartonFieldsDataMigrationAsyncJob('customscript_wms_cartondatamigration_sch', 'customdeploy_wms_cartondatamigration_sch');
				log.debug({title:'taskId',details:taskId});
			}
			catch(e)
			{
				log.debug({title:'exception in migrationScript',details:e});
			}
			fnCreateForm(context,taskId);
		}
	}

	function invokeCartonFieldsDataMigrationAsyncJob(scriptId,deploymentId){
		try
		{			
			var scheduledScriptTask = task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: scriptId,
				deploymentId: deploymentId
			});

			var taskId =   scheduledScriptTask.submit();
			var taskStatus = task.checkStatus(taskId);
			log.debug({title:'taskStatus',details:taskStatus});
			var scriptStatusURL = '/app/common/scripting/scriptstatus.nl?daterange=TODAY&scripttype=' + taskStatus.scriptId

			var taskObj = {
					id: taskId,
					statusObj: taskStatus,
					scriptId: taskStatus.scriptId,
					deploymentId: taskStatus.deploymentId,
					scripturl: scriptStatusURL
			};

			return taskObj;
		}
		catch(e)
		{
			log.error({title:'error in  scheduleTask',details:e});
		}
	}


	/**
	 * This function is used to display Input form 
	 * @param 
	 * @returns {}
	 */
	function fnCreateForm(context,taskId)
	{
		var form = serverWidget.createForm({
			title : translator.getTranslationString('carton_fields_migration_title')
		});

		var msg = form.addField({
			id : 'custpage_message',
			type : serverWidget.FieldType.INLINEHTML,
			label : 'Message'
		}).updateLayoutType({
			layoutType : serverWidget.FieldLayoutType.OUTSIDEABOVE
		});

		if (context.request.method == 'GET'){
			form.addSubmitButton({
				label : translator.getTranslationString('carton_fields_migration_title')
			});
		}else{

			var schScriptStatus;

			var schScriptStatusLink = '<a href="'+ taskId.scripturl +'">click here </a>';

			if (taskId.statusObj.status == 'FAILED') {
				schScriptStatus = translator.getTranslationString('migrationScripts_schIntiation_fail');
			} else if(taskId.statusObj.status == 'PENDING' || taskId.statusObj.status == 'PROCESSING') {
				schScriptStatus = translator.getTranslationString('migrationScripts_schIntiated_carton') + " " + schScriptStatusLink;
			} else {
				schScriptStatus = translator.getTranslationString('migrationScripts_completed');
			}

			if(utility.isValueValid(schScriptStatus)){
				msg.defaultValue = schScriptStatus;
			}
		}
		context.response.writePage(form);
	}

	return {
		onRequest : migrationScript
	};
});



