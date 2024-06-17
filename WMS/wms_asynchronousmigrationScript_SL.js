/**/***************************************************************************

 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(
		['N/ui/serverWidget', '../Restlets/wms_migrationScriptsLibrary',
			'../Restlets/wms_translator','N/config','N/search','../Restlets/wms_utility','N/task','N/runtime'],

			function(serverWidget, migrationLibObj, translator,config,search,utility,task,runtime) {


			function migrationScript(context) {
				if (context.request.method == 'GET') {
					var wareHouseManagementFeature = false;
					try
					{
						var vConfig = config.load({
							type: config.Type.FEATURES
						});
						if (vConfig != null && vConfig != '' ) {
							wareHouseManagementFeature = vConfig.getValue({
								fieldId: 'wmssystem'
							});
						}
					}
					catch(e)
					{
						wareHouseManagementFeature = false;
					}
					fnCreateForm(context,false,wareHouseManagementFeature);

				}
				else
				{

					var wareHouseManagementFeature = false;
					try
					{
						var vConfig = config.load({
							type: config.Type.FEATURES
						});
						if (vConfig != null && vConfig != '' ) {
							wareHouseManagementFeature = vConfig.getValue({
								fieldId: 'wmssystem'
							});
						}
					}
					catch(e)
					{
						wareHouseManagementFeature = false;
					}
					var isScheduleScriptCalled = false;
					if(wareHouseManagementFeature)
					{
						try
						{

							var schstatus =  task.create({taskType:task.TaskType.SCHEDULED_SCRIPT});
							schstatus.scriptId = 'customscript_wms_migration_schedulescrpt';
							schstatus.deploymentId = null;
							schstatus.params = {
									"custscript_wms_migration_param" : 'LocationObject'								
							};

							schstatus.submit();	
							isScheduleScriptCalled = true;
							var currentUserID = runtime.getCurrentUser().id ;//To get current user
							utility.updateScheduleScriptStatus('migrationScript',currentUserID, 'Submitted','migrationScript','','');

						}
						catch(e)
						{
							log.error({title:'exception',details:e});
						}
						log.debug({title:'isScheduleScriptCalled',details:isScheduleScriptCalled});
					}
					fnCreateForm(context,isScheduleScriptCalled,wareHouseManagementFeature);
				}
			}

			/**
			 * This function is used to display Input form 
			 * @param 
			 * @returns {}
			 */
			function fnCreateForm(context,isScheduleScriptCalled,wareHouseManagementFeature)
			{

				var form = serverWidget.createForm({
					title : 'Migrate WMS Records'
				});


				var msg = form.addField({
					id : 'custpage_message',
					type : serverWidget.FieldType.INLINEHTML,
					label : 'Message'
				}).updateLayoutType({
					layoutType : serverWidget.FieldLayoutType.OUTSIDEABOVE
				});
				if(wareHouseManagementFeature == '' || wareHouseManagementFeature == null || wareHouseManagementFeature == 'null'
					|| wareHouseManagementFeature == undefined || wareHouseManagementFeature == 'undefined')
				{
					wareHouseManagementFeature =false;
				}
				if(!wareHouseManagementFeature)
				{
					var message = translator.getTranslationString('migrationScripts_WM_NotEnabled');
					msg.defaultValue= "<div id='div__alert' align='center'></div><script>showAlertBox('div__alert', 'Error',  '"+message+"', NLAlertDialog.TYPE_HIGH_PRIORITY,  '100%', null, null, null);</script></div>";	   
				}
				else
				{

					if(isScheduleScriptCalled)
					{
						var message = translator.getTranslationString('migrationScripts_schIntiated');
						msg.defaultValue= "<div id='div__alert' align='center'></div><script>showAlertBox('div__alert', 'Confirmation',  '"+message+"', NLAlertDialog.TYPE_LOWEST_PRIORITY,  '100%', null, null, null);</script></div>";
					}
					else
					{
						var wmsFilters = [];
						wmsFilters.push(
								search.createFilter({
									name:'name',					
									operator:search.Operator.IS,
									values:'migrationScript'
								})
						);
						wmsFilters.push(
								search.createFilter({
									name:'custrecord_wmsse_schprsstatus',					
									operator:search.Operator.IS,
									values:'In Progress'
								})
						);
						var searchObj = search.create({type:'customrecord_wmsse_schscripts_status',filters:wmsFilters,columns:['custrecord_wmsse_schprsstatus']
						});
						var searchResult = [];
						var search_page_count = 1;

						var myPagedData = searchObj.runPaged({
							pageSize: search_page_count
						});
						myPagedData.pageRanges.forEach(function (pageRange) {
							var myPage = myPagedData.fetch({
								index: pageRange.index
							});
							myPage.data.forEach(function (result) {
								searchResult.push(result);
							});
						});
						var scheduleScriptStatus = 'Completed';
						log.debug({title:'searchResult',details:searchResult});
						if(searchResult.length > 0)
						{
							scheduleScriptStatus = searchResult[0].getValue('custrecord_wmsse_schprsstatus');
						}

						log.debug({title:'scheduleScriptStatus',details:scheduleScriptStatus});
						if(scheduleScriptStatus == 'Completed')
						{
							form.addSubmitButton({
								label : 'Migrate WMS Records'
							});
						}
						else
						{
							if(scheduleScriptStatus == 'In Progress' || scheduleScriptStatus == 'Submitted')
							{
								var message = translator.getTranslationString('migrationScripts_alreadyInitiated');
								msg.defaultValue= "<div id='div__alert' align='center'></div><script>showAlertBox('div__alert', 'Error',  '"+message+"', NLAlertDialog.TYPE_HIGH_PRIORITY,  '100%', null, null, null);</script></div>";
							}
						}
					}
				}
				context.response.writePage(form);
			}

			return {
				onRequest : migrationScript
			};
		});



