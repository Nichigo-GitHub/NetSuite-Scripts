/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/runtime','../Restlets/wms_migrationScriptsLibrary','../Restlets/wms_utility'],

		function(runtime,migrationLibObj,utility) {


	function execute(context) {

		try
		{
			if (context.type !== context.InvocationType.ON_DEMAND)
				return;


			var currentUserId = runtime.getCurrentUser().id;    	
			utility.updateScheduleScriptStatus('migrationScript',currentUserId,'In Progress','migrationScript','','');
			log.debug({title:'context',details:context});
			var searchId = runtime.getCurrentScript().getParameter("custscript_wms_migration_param");
			log.debug({title:'searchId',details:searchId});
			var isScheduleScriptCalled = false;
			switch (searchId) 
			{
			case 'LocationObject':
				isScheduleScriptCalled = migrationLibObj.migrateLocations();
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateItemfamily();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateItemGroup();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateOrderType();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateZones();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateBinFields();
					log.debug({title:'isScheduleScriptCalled1',details:isScheduleScriptCalled});
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}

				break;

			case 'itemFamilyObject':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateItemfamily();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateItemGroup();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateOrderType();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateZones();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateBinFields();	
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}

				break;

			case 'itemGroupObject':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateItemGroup();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateOrderType();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateZones();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateBinFields();	
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}
				break;

			case 'orderTypeObject':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateOrderType();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateZones();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateBinFields();		
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}
				break; 

			case 'zonesObject':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateZones();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateBinFields();	
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}
				break; 

			case 'binsObject':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateBinFields();	
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}
				break; 
			case 'pickStratagiesObject':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
				}
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}
				break; 
			case 'migrateCyccPlan':
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateCyccPlan();
				}
				break; 

			default:
				if(isScheduleScriptCalled == false){
					isScheduleScriptCalled = migrationLibObj.migrateLocations();
				}
			if(isScheduleScriptCalled == false){
				isScheduleScriptCalled = migrationLibObj.migrateItemfamily();
			}
			if(isScheduleScriptCalled == false){
				isScheduleScriptCalled = migrationLibObj.migrateItemGroup();
			}
			if(isScheduleScriptCalled == false){
				isScheduleScriptCalled = migrationLibObj.migrateOrderType();
			}
			if(isScheduleScriptCalled == false){
				isScheduleScriptCalled = migrationLibObj.migrateZones();
			}
			if(isScheduleScriptCalled == false){
				isScheduleScriptCalled = migrationLibObj.migrateBinFields();	
			}
			if(isScheduleScriptCalled == false){
				isScheduleScriptCalled = migrationLibObj.migratePickStratagies();
			}
			if(isScheduleScriptCalled == false){
				migrationLibObj.migrateCyccPlan();
			}

			break;		
			}
			log.debug({title:'isScheduleScriptCalled',details:isScheduleScriptCalled});
			log.debug({title:'runtime.getCurrentScript().getRemainingUsage()',details:runtime.getCurrentScript().getRemainingUsage()});
			if(runtime.getCurrentScript().getRemainingUsage() > 50)
			{
				var currentUserId = runtime.getCurrentUser().id;
				utility.updateScheduleScriptStatus('migrationScript',currentUserId,'Completed','migrationScript','','');
			}

		}
		catch(e)
		{
			log.error({title:'e',details:e});

		}
	}	

	return {
		execute: execute
	};

});
