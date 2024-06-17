/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/runtime','../Restlets/wms_utility','N/search','N/record','N/task'],
		function(runtime,utility,search,record,task) {

	function execute(context) {

		try
		{
			var isEnabled=isWarehousemanagementFeatureEnabled();
			if(isEnabled)
			{
			updatePickTaskCoreCartonFieldsWithWMSFields();
			updateItemFulfillmentCoreCartonFieldsWithWMSFields();
			}
		}
		catch(e)
		{
			log.error({title:'error in execute',details:e});
		}
	}	

	function updatePickTaskCoreCartonFieldsWithWMSFields(){

		var wmsPickCartonSearchObj = search.load({
			id: 'customsearch_data_migration_picktask'			
		}); 

		var wmsPickCartonResult = utility.getSearchResultInJSON(wmsPickCartonSearchObj);

		if(wmsPickCartonResult.length > 0)
		{
			var duplicateWaveInternalId = [];
			for(var pickCartonIndex in wmsPickCartonResult)
			{
				var wmsPickCartonRec = wmsPickCartonResult[pickCartonIndex];
				var waveInternalId = wmsPickCartonRec['internalid'];
				log.debug({title:'waveInternalId',details:waveInternalId});
				var usage = runtime.getCurrentScript().getRemainingUsage();

				if(runtime.getCurrentScript().getRemainingUsage() <= 1000)
				{
					invokeCartonFieldsDataMigrationAsyncJob('customscript_wms_cartondatamigration_sch', 'customdeploy_wms_cartondatamigration_sch');
					break;
				}
				else{

					if(duplicateWaveInternalId.indexOf(waveInternalId)==-1){
						log.debug({title:'remaining usage Start of the wave',details:runtime.getCurrentScript().getRemainingUsage()});
						var tdate1 =  new Date();
						log.debug({title:'timeStamp at the Start of the Wave',details:tdate1.getHours()+":"+tdate1.getMinutes()+":"+tdate1.getSeconds()+":"+tdate1.getMilliseconds()});
						var picktaskArr = getPicktaskDetailsForWave(waveInternalId);
						for(var picktaskIndex =0; picktaskIndex < picktaskArr.length; picktaskIndex++){
							var pickTaskId = picktaskArr[picktaskIndex];
							var picktaskRecordObj = record.load({type:'picktask',id:pickTaskId});

							var itemLinelength =picktaskRecordObj.getLineCount({
								sublistId:'pickactions'
							});
							for(var picktaskItr=0;picktaskItr<itemLinelength;picktaskItr++)
							{
								var inventoryDetailObj = picktaskRecordObj.getSublistSubrecord({
									sublistId :'pickactions',
									fieldId : 'inventorydetail',
									line : parseInt(picktaskItr)
								});
								var invDetailsLinelength =inventoryDetailObj.getLineCount({
							sublistId:'inventoryassignment'
						});

								for(var inventoryDetailIndex =0; inventoryDetailIndex<invDetailsLinelength;inventoryDetailIndex++){
							var stageBoolen = inventoryDetailObj.getSublistValue({
								sublistId: 'inventoryassignment',
								fieldId:'custrecord_wmsse_staged', 
								line : inventoryDetailIndex
							});

							var wmsPickCarton = inventoryDetailObj.getSublistValue({
								sublistId: 'inventoryassignment',
								fieldId:'custrecord_wms_pickcarton', 
								line : inventoryDetailIndex
							});
									if(utility.isValueValid(wmsPickCarton)){
							inventoryDetailObj.setSublistValue({
								sublistId: 'inventoryassignment',
								fieldId:'pickcarton', 
								value:wmsPickCarton,
								line : inventoryDetailIndex
							});
									}
							if(stageBoolen == true){
								var quantity = inventoryDetailObj.getSublistValue({
									sublistId: 'inventoryassignment',
									fieldId:'quantity', 
									line : inventoryDetailIndex
								});

								inventoryDetailObj.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId:'quantitystaged', 
									value:quantity,
									line : inventoryDetailIndex
								});
							}
								}
							}
							try
							{
								var invid = picktaskRecordObj.save();								
							}
							catch(e)
							{
								log.error({title:'error in updatePickTaskCoreCartonFieldsWithWMSFields',details:e});
							}
						}
						duplicateWaveInternalId.push(waveInternalId);
						var tdate2 =  new Date();
						log.debug({title:'timeStamp at the End of the wave',details:tdate2.getHours()+":"+tdate2.getMinutes()+":"+tdate2.getSeconds()+":"+tdate2.getMilliseconds()});
						log.debug({title:'remaining usage End of the wave',details:runtime.getCurrentScript().getRemainingUsage()});
					}
				}
			}
		}
	}

	function updateItemFulfillmentCoreCartonFieldsWithWMSFields(){

		var wmsPickCartonSearchObj = search.load({
			id: 'customsearch_wms_datamigrate_itemfulfill'			
		}); 

		var wmsPickCartonResult = utility.getSearchResultInJSON(wmsPickCartonSearchObj);

		if(wmsPickCartonResult.length > 0)
		{
			var duplicateIFInternalId = [];
			for(var pickCartonIndex in wmsPickCartonResult)
			{
				var wmsPickCartonRec = wmsPickCartonResult[pickCartonIndex];
				var itemFulfillmentId = wmsPickCartonRec['internalid'];
				log.debug('itemFulfillmentId',itemFulfillmentId);

				if(runtime.getCurrentScript().getRemainingUsage() <= 1000)
				{
					invokeCartonFieldsDataMigrationAsyncJob('customscript_wms_cartondatamigration_sch', 'customdeploy_wms_cartondatamigration_sch');
					break;

				}
				else{
					log.debug('duplicateIFInternalId',duplicateIFInternalId);
					if(duplicateIFInternalId.indexOf(itemFulfillmentId)==-1){
						log.debug({title:'remaining usage Start of the IF',details:runtime.getCurrentScript().getRemainingUsage()});
						var tdate3 =  new Date();
						log.debug({title:'timeStamp at the Start of the IF',details:tdate3.getHours()+":"+tdate3.getMinutes()+":"+tdate3.getSeconds()+":"+tdate3.getMilliseconds()});
						var itemFulfilmentRecord = record.load({
							type : 'itemfulfillment',
							id : itemFulfillmentId,
							isDynamic: false
						});

						var itemLinelength =itemFulfilmentRecord.getLineCount({
							sublistId:'item'
						});						
						for(var Ifitr=0;Ifitr<itemLinelength;Ifitr++)
						{
							var itemType = itemFulfilmentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'itemtype',
								line: Ifitr
							});
							var isnoninventory = itemFulfilmentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'isnoninventory',
								line: Ifitr
							});                        
                            if(isnoninventory == 'F' && (itemType == 'InvtPart' || itemType == 'Assembly'))                       
							{
								var invdetailLine=itemFulfilmentRecord.getSublistSubrecord({sublistId: 'item',fieldId: 'inventorydetail',line: Ifitr});

								var invDetailslinelength =invdetailLine.getLineCount({
							sublistId:'inventoryassignment'
						});

								for(var inventoryDetailIndex =0 ;inventoryDetailIndex<invDetailslinelength;inventoryDetailIndex++){

									var wmsPickCarton = invdetailLine.getSublistValue({
								sublistId: 'inventoryassignment',
								fieldId:'custrecord_wms_pickcarton', 
								line : inventoryDetailIndex
							});

									if(utility.isValueValid(wmsPickCarton)){
										invdetailLine.setSublistValue({
								sublistId: 'inventoryassignment',
								fieldId:'pickcarton', 
								value:wmsPickCarton,
								line : inventoryDetailIndex
							});
									}
									var wmsPackCarton = invdetailLine.getSublistValue({
								sublistId: 'inventoryassignment',
								fieldId:'custrecord_wmsse_packing_container', 
								line : inventoryDetailIndex
							});
							if(utility.isValueValid(wmsPackCarton)){
										invdetailLine.setSublistValue({
									sublistId: 'inventoryassignment',
									fieldId:'packcarton', 
									value:wmsPackCarton,
									line : inventoryDetailIndex
								});
									}
								}
							}
						}
							try
							{
							var invid = itemFulfilmentRecord.save();
							duplicateIFInternalId.push(itemFulfillmentId);
							}
							catch(e)
							{
								log.error({title:'error in updateItemFulfillmentCoreCartonFieldsWithWMSFields',details:e});
						}
						var tdate4 =  new Date();
						log.debug({title:'timeStamp at the End of the IF',details:tdate4.getHours()+":"+tdate4.getMinutes()+":"+tdate4.getSeconds()+":"+tdate4.getMilliseconds()});
						log.debug({title:'remaining usage End of the IF',details:runtime.getCurrentScript().getRemainingUsage()});
					}
				}
			}
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

			scheduledScriptTask.submit();
		}
		catch(e)
		{
			log.error({title:'error in  invokeCartonFieldsDataMigrationAsyncJob',details:e});
		}
	}
	function getPicktaskDetailsForWave(waveInternalId)
	{
		try
		{			
			var pickTaskIdArr = [];
			if(utility.isValueValid(waveInternalId))
			{
				var pickTaskSearch = search.load({id:'customsearch_wms_picktaskdtl_wave'});
				var pickTaskFilters = pickTaskSearch.filters;

				pickTaskFilters.push(search.createFilter({
					name:'waveName',
					operator:search.Operator.IS,
					values:waveInternalId
				}));

				pickTaskSearch.filters = pickTaskFilters;
				var	 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
				log.debug({title:'objpicktaskSearchDetails',details:objpicktaskSearchDetails});
				if(objpicktaskSearchDetails.length > 0)
				{
					for(var pickTaskIdIndex=0;pickTaskIdIndex<objpicktaskSearchDetails.length;pickTaskIdIndex++)
					{
						pickTaskIdArr.push(parseInt(objpicktaskSearchDetails[pickTaskIdIndex]['name']));
					}

				}
			}	
			log.debug({title:'pickTaskIdArr',details:pickTaskIdArr});
			return pickTaskIdArr;		
		}
		catch(e)
		{
			log.error({title:'error in  getPicktaskDetailsForWave',details:e});
		}		

	}

	function isWarehousemanagementFeatureEnabled() {
		var vResult = false;
		try {
			var warehouseManagementFeature = runtime.isFeatureInEffect({
				feature: 'wmssystem' 
			});

			if(utility.isValueValid(warehouseManagementFeature))
			{
				//The Warehouse Management feature if provisioned on your account then return true
				vResult = true;
			}
		}
		catch (e) {
			//The Warehouse Management feature if not provisioned on your account then return false
			log.error({
				title: 'exception in isWarehousemanagementFeatureEnabled',
				details: e
			});
			vResult = false;
		}
		return vResult;
	}
	return {
		execute: execute
	};

});
