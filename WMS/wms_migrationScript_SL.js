/**/***************************************************************************

 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(
		['N/ui/serverWidget','../Restlets/wms_translator','N/config','N/search','../Restlets/wms_utility','N/task','N/runtime'],

			function(serverWidget,translator,config,search,utility,task,runtime) {

			function migrationScript(context) {
				if (context.request.method == 'GET') {
					
					var wareHouseManagementFeature = checkWareHouseManagementFeature();	
					var schScriptStatus = getScheduleScriptStatus();
					fnCreateForm(context,wareHouseManagementFeature,null,schScriptStatus);

				}
				else
				{

					var wareHouseManagementFeature = checkWareHouseManagementFeature();						
					if(wareHouseManagementFeature)
					{
						try
						{
							var schScriptStatus = getScheduleScriptStatus();
							log.debug({title:'schScriptStatus',details:schScriptStatus});
							
							if(schScriptStatus != 'In Progress' && schScriptStatus != 'Submitted')
							{

								var schstatus =  task.create({taskType:task.TaskType.SCHEDULED_SCRIPT});
								schstatus.scriptId = 'customscript_wms_migration_schedulescrpt';
								schstatus.deploymentId = null;
								schstatus.params = {
										"custscript_wms_migration_param" : 'LocationObject'								
								};

								var taskId =	schstatus.submit();	
								var taskStatus = task.checkStatus(taskId);
								if (taskStatus.status != 'FAILED')
								{
									var currentUserID = runtime.getCurrentUser().id ;//To get current user
									utility.updateScheduleScriptStatus('migrationScript',currentUserID, 'Submitted','migrationScript','','');
								}
								log.debug({title:'taskStatus',details:taskStatus});
								var scriptStatusURL = '/app/common/scripting/scriptstatus.nl?daterange=TODAY&scripttype=' + taskStatus.scriptId;

								var taskObj = {
										id: taskId,
										status: taskStatus.status,
										scriptId: taskStatus.scriptId,
										deploymentId: taskStatus.deploymentId,
										scripturl: scriptStatusURL
								};
							}

						}
						catch(e)
						{
							log.error({title:'exception',details:e});
						}
					}
					fnCreateForm(context,wareHouseManagementFeature,taskObj,schScriptStatus);
				}
			}

			/**
			 * This function is used to display Input form 
			 * @param 
			 * @returns {}
			 */
			function fnCreateForm(context,wareHouseManagementFeature,taskObject,schduleScriptStatus)
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
					wareHouseManagementFeature = false;
				}
				if(!wareHouseManagementFeature)
				{
					var message = translator.getTranslationString('migrationScripts_WM_NotEnabled');
					msg.defaultValue= "<div id='div__alert' align='center'></div><script>showAlertBox('div__alert', 'Error',  '"+message+"', NLAlertDialog.TYPE_HIGH_PRIORITY,  '100%', null, null, null);</script></div>";	   
				}
				else
				{
					
					if(utility.isValueValid(taskObject)){
						var schScriptStatus;

						var schScriptStatusLink = '<a href="'+ taskObject.scripturl +'">click here </a>';

						if (taskObject.status == 'FAILED') {
							schScriptStatus = translator.getTranslationString('migrationScripts_schIntiation_fail');
						} else if(taskObject.status == 'PENDING' || taskObject.status == 'PROCESSING' ) {
							schScriptStatus = translator.getTranslationString('migrationScripts_schIntiated_carton') + " " + schScriptStatusLink;
						} else {
							form.addSubmitButton({
								label : 'Migrate WMS Records'
							});
							schScriptStatus = translator.getTranslationString('migrationScripts_completed');
						}

						if(utility.isValueValid(schScriptStatus)){
							msg.defaultValue = schScriptStatus;
						}
					}
					else
					{
						if(schduleScriptStatus == 'In Progress' || schduleScriptStatus == 'Submitted')
						{
							var message = translator.getTranslationString('migrationScripts_alreadyInitiated');
							msg.defaultValue= "<div id='div__alert' align='center'></div><script>showAlertBox('div__alert', 'Error',  '"+message+"', NLAlertDialog.TYPE_HIGH_PRIORITY,  '100%', null, null, null);</script></div>";
						}
						else
						{
							if (context.request.method == 'GET'){
								form.addSubmitButton({
									label : 'Migrate WMS Records'
								});}
						}
					}
				}
				context.response.writePage(form);
			}
			function getScheduleScriptStatus()
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
							operator:search.Operator.ISNOT,
							values:'Completed'
						})
				);
				var searchObj = search.create({type:'customrecord_wmsse_schscripts_status',
					filters:wmsFilters,columns:['custrecord_wmsse_schprsstatus']
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
				
				return scheduleScriptStatus;
			}
			function checkWareHouseManagementFeature()
			{
				var wareHouseManagementFeature = false;
				try
				{
					var vConfig = config.load({
						type: config.Type.FEATURES
					});
					if (vConfig != null && vConfig != '' && vConfig != undefined) {
						wareHouseManagementFeature = vConfig.getValue({
							fieldId: 'wmssystem'
						});
					}
				}
				catch(e)
				{
					wareHouseManagementFeature = false;
				}
				
				return wareHouseManagementFeature;
			}

			return {
				onRequest : migrationScript
			};
		});



