/**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search','N/runtime','N/record','N/task','../Restlets/wms_utility','N/query'],function (search,runtime,record,task,utility,query) {


	function _migrateLocations()
	{
		log.debug({title : 'remainingUsage at the start of migrateLocations',details : runtime.getCurrentScript().getRemainingUsage()});
		var wmsLocationSearchObj = search.load({
			id: 'customsearch_wms_location_srch'			
		}); 
		var wmsLocationSearchObjFilters = wmsLocationSearchObj.filters;
		wmsLocationSearchObjFilters.push(
				search.createFilter({
					name:'custrecord_wmsse_make_wh_site',					
					operator:search.Operator.IS,
					values:true
				})
		);
		wmsLocationSearchObjFilters.push(
				search.createFilter({
					name:'usewarehousemanagement',					
					operator:search.Operator.IS,
					values:false
				})
		);
		wmsLocationSearchObj.filters = wmsLocationSearchObjFilters;
		var wmsLocationResult = utility.getSearchResultInJSON(wmsLocationSearchObj);
		log.debug({title : 'totalWmsLocationResult',details : wmsLocationResult});
		var missedLocationArr = [];
		var isScheduleScriptCalled = false;
		var migratedLocationsArray = [];
		if(wmsLocationResult.length > 0)
		{
			log.debug({title : 'totalWmsLocationResultLength',details : wmsLocationResult.length });
			for(var location in wmsLocationResult)
			{
				var locRec = wmsLocationResult[location];
				var wmsMakeWHFlag = locRec['custrecord_wmsse_make_wh_site'];
				var useWareHouseManagementFlag = locRec['usewarehousemanagement'];
				var locationId = locRec.id;
				if(runtime.getCurrentScript().getRemainingUsage() <= 100)
				{
					callMigrationScheduleScript('LocationObject');
					isScheduleScriptCalled = true;
					log.debug({title : 'isScheduleScriptCalled called',details : isScheduleScriptCalled });
					break;
				}
				else
				{
					var locationObj = record.load({type:'location',id:locationId});
					locationObj.setValue({fieldId:'usewarehousemanagement', value:true});
					try
					{
						locationObj.save();
						migratedLocationsArray.push(locationId);
					}
					catch(ex)
					{
						missedLocationArr.push(locationId);
					}
				}

			}
					log.debug({title:'migratedLocationsArray',details:migratedLocationsArray});
					log.debug({title:'migratedLocationsArrayLength',details:migratedLocationsArray.length});
					log.debug({title:'failed wmsLocations',details:missedLocationArr});
					log.debug({title:'failed wmsLocationsLength',details:missedLocationArr.Length});
				
			
		}
		log.debug({title : 'remainingUsage at the end of migrateLocations',details : runtime.getCurrentScript().getRemainingUsage() });
       return isScheduleScriptCalled;
	}
	function _migratePickStratagies()
	{
		log.debug({title : 'remainingUsage at the start of migrateWmsPickStratagies',details : runtime.getCurrentScript().getRemainingUsage() });
		var isScheduleScriptCalled = false;
		if(runtime.getCurrentScript().getRemainingUsage() <= 100)
		{
			callMigrationScheduleScript('pickStratagiesObject');
			isScheduleScriptCalled = true;
		}
		else
		{
			var wmsPickStratagiesSearchObj = search.load({
				id: 'customsearch_wms_getpickstratagies'			
			}); 
			var wmsPickStratagiesSearchResult = utility.getSearchResultInJSON(wmsPickStratagiesSearchObj);
			var erpPickStratagiesSearchObj = search.load({
				id: 'customsearch_wms_pickstrategy_srch'			
			}); 
			var erpPickStratagiesSearchResult = utility.getSearchResultInJSON(erpPickStratagiesSearchObj);
			log.debug({title : 'total migrateWmsPickStratagies',details : wmsPickStratagiesSearchResult });
			var missedPickStratagiesArr = [];
			var migratedPickStratagiesArr = [];
			if(wmsPickStratagiesSearchResult.length > 0)
			{
				log.debug({title : 'total migrateWmsPickStratagiesLength',details : wmsPickStratagiesSearchResult.length });
					for(var pickstratagie in wmsPickStratagiesSearchResult)
					{
						var pickStratagieRec = wmsPickStratagiesSearchResult[pickstratagie]; 
						var pickStratagieName = pickStratagieRec.name;
						var pickStratagieFound = false;
						for(var erpStratagie in erpPickStratagiesSearchResult)
						{
							var erpPickStratagieRec = erpPickStratagiesSearchResult[erpStratagie]; 

							var erpPickStratagieName = erpPickStratagieRec.name;
							if(pickStratagieName ==  erpPickStratagieName )
							{
								pickStratagieFound = true;
								break;
							}
						}
						if(!pickStratagieFound)
						{

							var wmsItemGroup = pickStratagieRec.custrecord_wmsse_pick_itemgroupText;
							var wmsUnits = pickStratagieRec.custrecord_wmsse_pick_units;
							var wmsOrderType = pickStratagieRec.custrecord_wmsse_pick_ordertypeText;
							var wmsLocation = pickStratagieRec.custrecord_wmsse_pick_location;
							if(utility.isValueValid(wmsLocation))
							{
								var wmsItemFamily  = pickStratagieRec.custrecord_wmsse_pick_itemfamilyText;
								var wmsPickSequence = pickStratagieRec.custrecord_wmsse_pick_sequence;
								var wmsItem = pickStratagieRec.custrecord_wmsse_pick_item;
								var wmsZone =  pickStratagieRec.custrecord_wmsse_pick_zoneText;
								if(runtime.getCurrentScript().getRemainingUsage() <= 100)
								{
									callMigrationScheduleScript('pickStratagiesObject');
									isScheduleScriptCalled = true;
									break;
								}
								else
								{
									var erpPickStratagieRec = record.create({type:'pickstrategy'});
									erpPickStratagieRec.setValue({fieldId:'name',value: pickStratagieRec.name});
									erpPickStratagieRec.setValue({fieldId:'trantype',value: 'SalesOrd'});
									if(utility.isValueValid(wmsItemGroup))
									{
										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsItemGroup
												})
										);
										var searchObj = search.create({type:'itemprocessgroup',filters:wmsFilters
										});
										var searchResult = [];
										var search_page_count = 1000;

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


										if(searchResult.length > 0)
										{
											erpPickStratagieRec.setValue({fieldId:'itemprocessgroup',value: searchResult[0].id});
										}
									}
									if(utility.isValueValid(wmsUnits))
									{
										erpPickStratagieRec.setValue({fieldId:'units',value:wmsUnits});
									}
									if(utility.isValueValid(wmsOrderType))
									{
										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsOrderType
												})
										);
										var searchObj = search.create({type:'ordertype',filters:wmsFilters
										});
										var searchResult = [];
										var search_page_count = 1000;

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
										if(searchResult.length > 0)
										{
											erpPickStratagieRec.setValue({fieldId:'ordertype',value:searchResult[0].id});
										}
									}
									if(utility.isValueValid(wmsLocation))
									{
										erpPickStratagieRec.setValue({fieldId:'location',value:wmsLocation});
									}
									if(utility.isValueValid(wmsItemFamily))
									{
										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsItemFamily
												})
										);
										var searchObj = search.create({type:'itemprocessfamily',filters:wmsFilters
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

										if(searchResult.length > 0)
										{
											erpPickStratagieRec.setValue({fieldId:'itemprocessfamily',value:searchResult[0].id });
										}
									}
									if(utility.isValueValid(wmsPickSequence))
									{
										erpPickStratagieRec.setValue({fieldId:'priority',value:wmsPickSequence});
									}
									if(utility.isValueValid(wmsItem))
									{
										erpPickStratagieRec.setValue({fieldId:'item',value:wmsItem});
									}
									erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
									if(utility.isValueValid(wmsZone))
									{
										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsZone
												})
										);
										if(wmsLocation != '')
										{
											wmsFilters.push(
													search.createFilter({
														name:'location',					
														operator:search.Operator.ANYOF,
														values:wmsLocation
													})
											);
										}
										var zoneObj = search.create({type:'zone',filters:wmsFilters
										});
										var searchResult = [];
										var search_page_count = 10;

										var myPagedData = zoneObj.runPaged({
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
										if(searchResult.length > 0)
										{
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:searchResult[0].id});
										}
									}
									try
									{
										var pickStartagieId = erpPickStratagieRec.save();
										migratedPickStratagiesArr.push(pickStartagieId);
									}
									catch(e)
									{

										log.error({title:'pickStratagieName',details:pickStratagieName});
										log.error({title:'erpPickStratagieName',details:erpPickStratagieName});
										log.error({title:'failed Stratagie',details:e});
										missedPickStratagiesArr.push(pickStratagieRec.name);
									}
								}
							}
							else
							{
								missedPickStratagiesArr.push(pickStratagieRec.name);
							}

						} 

					}
				
							log.debug({title:'migrated pickStratagies',details:migratedPickStratagiesArr.length});
							log.debug({title:'faled wmsPickStratagies',details:missedPickStratagiesArr});
							log.debug({title : 'faled wmsPickStratagiesLength',details : missedPickStratagiesArr.length });
			}
		}
		log.debug({title : 'remainingUsage at the end of migrateWmsPickStratagies',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;
	}


	function _migrateBinFields()
	{
		log.debug({title : 'remainingUsage at the start of migrateWmsBinFields',details : runtime.getCurrentScript().getRemainingUsage() });
		try
		{

			var isScheduleScriptCalled = false;
			var binCounter=0;
			if(runtime.getCurrentScript().getRemainingUsage() < 550)
			{
				callMigrationScheduleScript('binsObject');
				isScheduleScriptCalled = true;
			}
			else
			{
				var tdate=new Date();
				log.debug({title:'timeStamp at the start loc search',details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});

				var wmsLocationSearchObj = search.load({
					id: 'customsearch_wms_location_srch'			
				}); 
				var wmsLocationSearchObjFilters = wmsLocationSearchObj.filters;
				wmsLocationSearchObjFilters.push(
						search.createFilter({
							name:'custrecord_wmsse_make_wh_site',					
							operator:search.Operator.IS,
							values:true
						})
				);
				wmsLocationSearchObj.filters = wmsLocationSearchObjFilters;
				var wmsLocationResult = utility.getSearchResultInJSON(wmsLocationSearchObj);

				var wmsBinsSearchObj = search.load({
					id: 'customsearch_wms_bin_fields_srch'					
				}); 
				var wmsBinFilters = wmsBinsSearchObj.filters;
				var locationIdArr = [];
				if(wmsLocationResult.length > 0)
				{
					for(var loc in wmsLocationResult)
					{
						var locInternalId = wmsLocationResult[loc].id;
						locationIdArr.push(locInternalId);
					}
				}
				if(locationIdArr.length > 0)
				{
					log.debug({title:'locationIdArr',details:locationIdArr});
					wmsBinFilters.push(
							search.createFilter({
								name:'location',					
								operator:search.Operator.ANYOF,
								values:locationIdArr
							})
					);
				}
				wmsBinFilters.push(
						search.createFilter({
							name:'type',					
							operator:search.Operator.IS,
							values:'NONE'
						})
				);
				wmsBinsSearchObj.filters = wmsBinFilters;
				var wmsBinSearchResult = utility.getSearchResults(wmsBinsSearchObj);
				var missedBinFiledsArr = [];
				log.debug({title:'total wmsBinSearchResult',details:wmsBinSearchResult});
				if(wmsBinSearchResult.length > 0)
				{

					log.debug({title:'total wmsBinSearchResultLength',details:wmsBinSearchResult.length});
						var erpZoneSearchObj = search.load({
							id: 'customsearch_wms_erp_zonesearch'			
						}); 
						var erpZoneSearchResult = utility.getSearchResultInJSON(erpZoneSearchObj);
						for(var bin in wmsBinSearchResult)
						{
							var binRecord = null;
							var binRec = wmsBinSearchResult[bin];
							var wmsZone = binRec.getText({name:'custrecord_wmsse_zone'});
							var zone = binRec.getText({name:'zone'});
							var binLocation = binRec.getValue({name:'location'});
							var binId = binRec.id;

							if(runtime.getCurrentScript().getRemainingUsage() <= 200)
							{
								callMigrationScheduleScript('binsObject');
								isScheduleScriptCalled = true;
								break;
							}
							else
							{

								if(wmsZone != '' && (zone == ' ' || zone == 'null' || zone == null  || zone == undefined || zone == ''))
								{
									if(binRecord == null)
									{
										binRecord = record.load({type:'bin',id:binId});
									}

									var erpZoneId = '';
									for(var erpZone in erpZoneSearchResult)
									{
										var  erpZoneRec = erpZoneSearchResult[erpZone];

										var zoneName = erpZoneRec['name'];
										var zoneLocation=erpZoneRec['location'];

										if(zoneName == wmsZone && binLocation==zoneLocation)
										{
											erpZoneId = erpZoneRec['id'];
											break;
										}
									}
									if(erpZoneId != '')
									{
										binRecord.setValue({fieldId:'zone', value:erpZoneId});
									}
									else
									{
										var location = binRec.getValue({name:'location'});
										var erpZoneRec = record.create({type:'zone',
										});
										erpZoneRec.setValue({fieldId:'name',value: wmsZone});
										erpZoneRec.setValue({fieldId:'location',value: location});
										try
										{
											var zoneId = 	erpZoneRec.save();
											binRecord.setValue({fieldId:'zone', value:zoneId});
										}
										catch(e)
										{
											log.error({title:'e',details:e});
											log.error({title:'zoneName',details:zoneName});
											log.error({title:'binId',details:binId});
											log.error({title:'wmsZone',details:wmsZone});
											log.debug({title:'binLocation',details:binLocation});
											log.debug({title:'zoneLocation',details:zoneLocation});
											log.debug({title:'erpZoneRec',details:erpZoneRec});
										}
									}
								}

								var binLocationType = binRec.getText({name:'custrecord_wmsse_bin_loc_type'});
								var binDirection = binRec.getText({name:'custrecord_wmsse_bin_stg_direction'});
								var binType = binRec.getValue({name:'type'});
								var type = 'STORAGE';
								if( binType == '' || binType == 'NONE')
								{
									if(binLocationType != ''  && binDirection != '')
									{
										if(binLocationType != '')
										{
											if (binLocationType == 'WIP')
											{
												type = 'WIP';
											}
											else if(binLocationType == 'Stage' && binDirection == 'In')
											{
												type = 'INBOUND_STAGING';
											}
											else if(binLocationType == 'Stage' && binDirection == 'Out')
											{
												type = 'OUTBOUND_STAGING';
											}
											else
											{

											}
										}

										if(binRecord == null)
										{
											binRecord = record.load({type:'bin',id:binId});
										}
										binRecord.setValue({fieldId:'type', value:type});
									}
									else
									{
										if(binLocationType != ''  && binLocationType == 'WIP')
										{
											type = 'WIP';
										}
										if(binRecord == null)
										{
											binRecord = record.load({type:'bin',id:binId});
										}
										binRecord.setValue({fieldId:'type', value:type});
									}
								}

								var binPickSeq = binRec.getValue({name:'custrecord_wmsse_pickseq_no'});
								var erpPickSeq = binRec.getValue({name:'sequencenumber'});
								if(binPickSeq != '' && erpPickSeq == '')
								{
									if(binRecord == null)
									{
										binRecord = record.load({type:'bin',id:binId});
									}
									binRecord.setValue({fieldId:'sequencenumber', value:binPickSeq});
								}
								if(binRecord != null)
								{
									try
									{
										
										var bin = binRecord.save();	
										binCounter=binCounter+1;
										
										
									}
									catch(exp)
									{
										log.error({title:'binId',details:binId});
										log.error({title:'erpZoneId',details:erpZoneId});
										log.error({title:'erpZoneRec',details:erpZoneRec});
										log.error({title:'exp',details:exp});
										missedBinFiledsArr.push(binId);
									}
								}
							}

						}
					log.debug({title:'migration Failed wmsBins ',details:missedBinFiledsArr});
					log.debug({title:'migration Failed wmsBins Count',details:missedBinFiledsArr.length});
					log.debug({title:'total migratedBinsCount',details:binCounter});
					var tdate=new Date();
					log.debug({title:'timeStamp at the end bin save',details:tdate.getHours()+":"+tdate.getMinutes()+":"+tdate.getSeconds()+":"+tdate.getMilliseconds()});

				}
			}

		}
		catch(e)
		{
			log.debug({title:'exception in bin',details:e});
		}
		log.debug({title : 'remainingUsage at the end of migrateWmsBinFields',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;

	}

	function _migrateZones()
	{
		var isScheduleScriptCalled = false;
		log.debug({title : 'remainingUsage at the start of migrateWmsZones',details : runtime.getCurrentScript().getRemainingUsage() });
		if(runtime.getCurrentScript().getRemainingUsage() <= 100)
		{
			callMigrationScheduleScript('zonesObject');
			isScheduleScriptCalled = true;
		}
		else
		{
			var wmsZoneSearchObj = search.load({
				id: 'customsearch_wms_zonesbybinssrh'			
			}); 

			var wmsLocationSearchObj = search.load({
				id: 'customsearch_wms_location_srch'			
			}); 
			var wmsLocationSearchObjFilters = wmsLocationSearchObj.filters;
			wmsLocationSearchObjFilters.push(
					search.createFilter({
						name:'custrecord_wmsse_make_wh_site',					
						operator:search.Operator.IS,
						values:true
					})
			);
			wmsLocationSearchObj.filters = wmsLocationSearchObjFilters;
			var wmsLocationResult = utility.getSearchResultInJSON(wmsLocationSearchObj);

			var wmsZoneFilters = wmsZoneSearchObj.filters;
			var locationIdArr = [];
			if(wmsLocationResult.length > 0)
			{
				for(var loc in wmsLocationResult)
				{
					var locInternalId = wmsLocationResult[loc].id;
					locationIdArr.push(locInternalId);
				}
			}
			if(locationIdArr.length > 0)
			{
				wmsZoneFilters.push(
						search.createFilter({
							name:'location',					
							operator:search.Operator.ANYOF,
							values:locationIdArr
						})
				);
			}
			wmsZoneFilters.push(
					search.createFilter({
						name:'custrecord_wmsse_zone',					
						operator:search.Operator.NONEOF,
						values:['@NONE@']
					})
			);

			wmsZoneSearchObj.filters = wmsZoneFilters;		

			var wmsZoneSearchResult = utility.getSearchResultInJSON(wmsZoneSearchObj);

			var erpZoneSearchObj = search.load({
				id: 'customsearch_wms_erp_zonesearch'			
			}); 
			var erpZoneSearchResult = utility.getSearchResultInJSON(erpZoneSearchObj);
			var isScheduleScriptCalledVar = false;
			if(wmsZoneSearchResult.length > 0)
			{
				isScheduleScriptCalled = migrateWmsZonesToERP(erpZoneSearchResult,wmsZoneSearchResult);
			}
		}
		log.debug({title : 'remainingUsage at the end of migrateWmsZones',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;
	}

	function _migrateItemGroup()
	{
		var isScheduleScriptCalled = false;
		log.debug({title : 'remainingUsage at the start of migrateItemGroup',details : runtime.getCurrentScript().getRemainingUsage() });
		if(runtime.getCurrentScript().getRemainingUsage() <= 100)
		{
			callMigrationScheduleScript('itemGroupObject');
			isScheduleScriptCalled =true;
		}
		else
		{
			var wmsItemGroupSearchObj = search.load({
				id: 'customsearch_wms_itemgroup_srch'			
			}); 
			var wmsItemGroupSearchResult = utility.getSearchResultInJSON(wmsItemGroupSearchObj);

			var erpItemGroupSearchObj = search.load({
				id: 'customsearch_wms_itemprocessgroup_srch'			
			}); 
			var erpItemGroupSearchResult = utility.getSearchResultInJSON(erpItemGroupSearchObj);

			var isScheduleScriptCalledVar = false;

			if(wmsItemGroupSearchResult.length > 0)
			{
				var erpItemGroupArr = getUniqueArrValues(wmsItemGroupSearchResult,erpItemGroupSearchResult);
				isScheduleScriptCalled = migrateWmsItemGroupToERP(erpItemGroupArr);
			}

		}
		log.debug({title : 'remainingUsage at the end of migrateItemGroup',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;

	}
	function migrateWmsItemGroupToERP(itemGroupArr)
	{
		var isScheduleScriptCalled = false;
		if(itemGroupArr.length > 0)
		{
				for(var itemGroup in itemGroupArr)
				{

					var wmsItemGroupName = itemGroupArr[itemGroup];

					if(runtime.getCurrentScript().getRemainingUsage() <= 100)
					{
						callMigrationScheduleScript('itemGroupObject');
						isScheduleScriptCalled = true;
						break;
					}
					else
					{
						var erpItemGroupRec = record.create({type:'itemprocessgroup',
						});
						erpItemGroupRec.setValue({fieldId:'name',value: wmsItemGroupName});
						erpItemGroupRec.save(); 
					}
				}
		}

		return isScheduleScriptCalled ;
	}
	function migrateERPItemGroupToWMS(wmsitemGroupArr)
	{
		var isScheduleScriptCalled = false;
		if(wmsitemGroupArr.length > 0)
		{
			for(var itemGroup in wmsitemGroupArr)
			{
				var itemGroupName = wmsitemGroupArr[itemGroup];
				if(runtime.getCurrentScript().getRemainingUsage() <= 100)
				{
					callMigrationScheduleScript('itemGroupObject');
					isScheduleScriptCalled = true;
					break;
				}
				else
				{
					var wmsItemGroupRec = record.create({type:'customrecord_wmsse_itemgroup',
					});
					wmsItemGroupRec.setValue({fieldId:'name',value: itemGroupName});
					wmsItemGroupRec.save(); 
				}

			}
		}
		return isScheduleScriptCalled ;
	}
	function _migrateItemfamily()
	{
		log.debug({title : 'remainingUsage at the start of migrateItemFamily',details : runtime.getCurrentScript().getRemainingUsage() });
		var isScheduleScriptCalled = false;
		if(runtime.getCurrentScript().getRemainingUsage() <= 100)
		{
			callMigrationScheduleScript('itemFamilyObject');
			isScheduleScriptCalled = true;
		}
		else
		{
			var wmsItemFamilySearchObj = search.load({
				id: 'customsearch_wms_itemfamily_srh'			
			}); 
			var wmsItemFamilySearchResult = utility.getSearchResultInJSON(wmsItemFamilySearchObj);

			var erpItemFamilySearchObj = search.load({
				id: 'customsearch_wms_itemprocessfamily_srch'			
			}); 
			var erpItemFamilySearchResult = utility.getSearchResultInJSON(erpItemFamilySearchObj);
			var isScheduleScriptCalledVar = false;
			if(wmsItemFamilySearchResult.length > 0)
			{
				var erpItemFamilyArr = getUniqueArrValues(wmsItemFamilySearchResult,erpItemFamilySearchResult);
				isScheduleScriptCalledVar = migrateWmsItemFamilyToERP(erpItemFamilyArr);
			}
			if(isScheduleScriptCalledVar)
			{
				isScheduleScriptCalled = true; 
			}
		}
		log.debug({title : 'remainingUsage at the end of migrateItemFamily',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;

	}
	function migrateWmsItemFamilyToERP(itemFamilyArr)
	{
		var isScheduleScriptCalled = false;
		if(itemFamilyArr.length > 0)
		{
			
				for(var itemFamily in itemFamilyArr)
				{
					var wmsItemFamilyName = itemFamilyArr[itemFamily];
					if(runtime.getCurrentScript().getRemainingUsage() <= 100)
					{
						callMigrationScheduleScript('itemFamilyObject');
						isScheduleScriptCalled = true;
						break;
					}
					else
					{
						var erpItemFamilyRec = record.create({type:'itemprocessfamily',
						});
						erpItemFamilyRec.setValue({fieldId:'name',value: wmsItemFamilyName});
						var id = erpItemFamilyRec.save(); 
					}
				}
			
		}
		return isScheduleScriptCalled;
	}
	function migrateERPItemFamilyToWMS(wmsItemFamilyArr)
	{
		var isScheduleScriptCalled = false;
		if(wmsItemFamilyArr.length > 0)
		{
			for(var itemFamily in wmsItemFamilyArr)
			{
				var itemFamilyName = wmsItemFamilyArr[itemFamily];
				if(runtime.getCurrentScript().getRemainingUsage() <= 100)
				{
					callMigrationScheduleScript('itemFamilyObject');
					isScheduleScriptCalled = true;
					break;
				}
				else
				{

					var wmsItemFamilyNameRec = record.create({type:'customrecord_wmsse_item_family',
					});
					wmsItemFamilyNameRec.setValue({fieldId:'name',value: itemFamilyName});
					var id = wmsItemFamilyNameRec.save(); 
				}

			}
		}
		return isScheduleScriptCalled;
	}

	function getUniqueValuesForOrdertype(searchResultObj1,searchResultObj2)
	{

		var resultObjArr = [];
		var isScheduleScriptCalled = false;
		if(searchResultObj1.length > 0)
		{
			for(var orderTypeRec=0; orderTypeRec < searchResultObj1.length;orderTypeRec++)
			{
				var wmsOrderTypeRec = searchResultObj1[orderTypeRec];
				if(runtime.getCurrentScript().getRemainingUsage() <= 100)
				{
					callMigrationScheduleScript('orderTypeObject');
					isScheduleScriptCalled = true;
					break;
				}
				else
				{
					var wmsOrderName = wmsOrderTypeRec.name;
					var isMatchFound = false;
					for(var erpOrderTypeRec in searchResultObj2)
					{
						if(runtime.getCurrentScript().getRemainingUsage() <= 100)
						{
							callMigrationScheduleScript('orderTypeObject');
							isScheduleScriptCalled = true;
							break;
						}
						else
						{
							var orderFields = search.lookupFields({
								type: 'ordertype',
								id: searchResultObj2[erpOrderTypeRec].id,
								columns: ['name']
							});
							var erpOrderName=orderFields.name;
							if(wmsOrderName == erpOrderName)
							{
								isMatchFound = true;
								break;
							}
						}

					}

					if(!isMatchFound)
					{
						resultObjArr.push(wmsOrderName);
					}
				}

			}
		}
		if(isScheduleScriptCalled)
		{
			return isScheduleScriptCalled;
		}
		else
		{
			return resultObjArr;
		}
	}

	function getUniqueArrValues(searchResultObj1,searchResultObj2)
	{
		var resultObjArr = [];

		if(searchResultObj1.length > 0)
		{
			for(var obj in searchResultObj1)
			{
				var objRec = searchResultObj1[obj];
				var	name = objRec.name;

				var isMatchFound = false
				for(var obj1 in searchResultObj2)
				{
					var objRec2 = searchResultObj2[obj1];
					var name2 = objRec2.name;
					if(name == name2)
					{
						isMatchFound = true;
						break;
					}

				}

				if(!isMatchFound)
				{
					if(resultObjArr.indexOf(name) == -1)
					{
						resultObjArr.push(name);
					}
				}

			}
		}

		return resultObjArr;
	}
	function migrateWmsZonesToERP(erpZoneSearchResultArr,wmsZoneSearchResultArr)
	{
		var isScheduleScriptCalled =false;
		if(wmsZoneSearchResultArr.length > 0)
		{
			log.debug({title:'wmsZoneSearchResultArr',details:wmsZoneSearchResultArr});
			log.debug({title:'wmsZoneSearchResultArrLength',details:wmsZoneSearchResultArr.length});
				var migrationFailedWMSZonesArr = [];
				var wmsZoneSearchResult  = '';
				var wmsZoneName = '';
				var wmsLocationId = '';
				var erpZoneName = '';
				var erpZoneLocationId = '';
				var erpZoneSearchResult = '';
				var isMatchFound = false;
				var migratedZonesArr = [];
				for(var searchResult in wmsZoneSearchResultArr)
				{
					wmsZoneSearchResult  = wmsZoneSearchResultArr[searchResult]; 
					wmsZoneName = wmsZoneSearchResult.custrecord_wmsse_zoneText;
					wmsLocationId = wmsZoneSearchResult.location;
					isMatchFound = false;
					if(erpZoneSearchResultArr.length > 0)
					{
						for(var erpZone in erpZoneSearchResultArr)
						{
							erpZoneSearchResult = erpZoneSearchResultArr[erpZone];
							//log.debug({title : 'erpZoneSearchResult',details : erpZoneSearchResult });
							erpZoneName = erpZoneSearchResult.name;
							erpZoneLocationId = erpZoneSearchResult.location;
							if(utility.isValueValid(wmsZoneName) && utility.isValueValid(erpZoneName) &&
									utility.isValueValid(wmsLocationId) && utility.isValueValid(erpZoneLocationId) &&
									wmsZoneName == erpZoneName && wmsLocationId == erpZoneLocationId)
							{
								isMatchFound = true;
								break;

							}
						}
					}
					log.debug({title : 'isMatchFound',details : isMatchFound });
					if(!isMatchFound)
					{

						if(runtime.getCurrentScript().getRemainingUsage() <= 100)
						{
							callMigrationScheduleScript('zonesObject');
							isScheduleScriptCalled = true;
							break;
						}
						else
						{
							if(wmsLocationId != '')
							{

								var erpZoneRec = record.create({type:'zone',
								});
								erpZoneRec.setValue({fieldId:'name',value: wmsZoneName});
								erpZoneRec.setValue({fieldId:'location',value: wmsLocationId});
								try
								{
									erpZoneRec.save();
									migratedZonesArr.push(wmsZoneName);
								}
								catch(e)
								{
									log.debug({title:'e',details:e});
								}
							}
							else
							{
								migrationFailedWMSZonesArr.push(wmsZoneName);
							}
						}
					}

				}
				log.debug({title:'migrated wmsZones',details:migratedZonesArr});
				log.debug({title:'migrated wmsZonesLength',details:migratedZonesArr.length});
				log.debug({title:'migration failed wmsZones',details:migrationFailedWMSZonesArr});
				log.debug({title:'migration failed wmsZonesLength',details:migrationFailedWMSZonesArr.length});

		}
		return isScheduleScriptCalled;
	}
	function migrateERPZonesToWMS(wmsZonesArrObj)
	{
		var isScheduleScriptCalled =false;
		if(wmsZonesArrObj.length > 0)
		{
			for(var zone in wmsZonesArrObj)
			{
				var zoneName = wmsZonesArrObj[zone];

				if(runtime.getCurrentScript().getRemainingUsage() <= 100)
				{
					callMigrationScheduleScript('zonesObject');
					isScheduleScriptCalled = true;
					break;
				}
				else
				{
					var wmsZoneRec = record.create({type:'customrecord_wmsse_zone',
					});
					wmsZoneRec.setValue({fieldId:'name',value: zoneName});
					wmsZoneRec.save();
				}

			}
		}
		return isScheduleScriptCalled;
	}

	function _migrateOrderType()
	{
		log.debug({title : 'remaining usage at the start of migrateOrderType',details : runtime.getCurrentScript().getRemainingUsage() });
		var isScheduleScriptCalled = false;
		if(runtime.getCurrentScript().getRemainingUsage() <= 100)
		{
			callMigrationScheduleScript('orderTypeObject');
			isScheduleScriptCalled = true;

		}
		else
		{
			var erpOrderTypeArr = [];
			var wmsOrderTypeSearchObj = search.load({
				id: 'customsearch_wms_ordertype_srch'			
			}); 
			var wmsOrderTypeSearchResult = utility.getSearchResultInJSON(wmsOrderTypeSearchObj);

			var erpOrderTypeSearchObj = search.create({
				type: 'ordertype',
				columns:['name']
			}); 
			var search_page_count = 1000;

			var myPagedData = erpOrderTypeSearchObj.runPaged({
				pageSize: search_page_count
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function (result) {
					erpOrderTypeArr.push(result);
				});
			});
			var isScheduleScriptCalledVar =false;
			if(wmsOrderTypeSearchResult.length > 0)
			{
				var erpOrderTypeArrObj = getUniqueValuesForOrdertype(wmsOrderTypeSearchResult,erpOrderTypeArr);

				isScheduleScriptCalledVar = migrateWmsOrderTypeToERP(erpOrderTypeArrObj);
			}

			if(isScheduleScriptCalledVar)
			{
				isScheduleScriptCalled = true; 
			}

		}
		log.debug({title : 'remaining usage at the end of migrateOrderType',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;

	}
	function migrateWmsOrderTypeToERP(orderTypeArr)
	{
		var isScheduleScriptCalled =false;
		if(orderTypeArr.length > 0)
		{
			log.debug({title:'total wmsOrderTypeArr',details:orderTypeArr});
			log.debug({title:'total wmsOrderTypeArrLength',details:orderTypeArr.length});
			var migratedOrderTypeArr = [];
				for(var orderType in orderTypeArr)
				{
					var wmsOrderType = orderTypeArr[orderType];
					if(runtime.getCurrentScript().getRemainingUsage() <= 100)
					{
						callMigrationScheduleScript('orderTypeObject');
						isScheduleScriptCalled = true;
						break;
					}
					else
					{
						var erpOrderTypeRec = record.create({type:'ordertype',
						});
						erpOrderTypeRec.setValue({fieldId:'name',value: wmsOrderType});
						erpOrderTypeRec.save(); 
						migratedOrderTypeArr.push(wmsOrderType);
					}

				}
				log.debug({title:'migrated wmsOrderTypeArr',details:migratedOrderTypeArr});
				log.debug({title:'migrated wmsOrderTypeArrLength',details:migratedOrderTypeArr.length});
			
		}
		return isScheduleScriptCalled;
	}
	function migrateERPOrderTypeToWMS(wmsOrderTypeArr)
	{
		var isScheduleScriptCalled = false;
		if(wmsOrderTypeArr.length > 0)
		{
			for(var orderType in wmsOrderTypeArr)
			{
				var OrderTypeName = wmsOrderTypeArr[orderType];

				if(runtime.getCurrentScript().getRemainingUsage() <= 100)
				{
					callMigrationScheduleScript('orderTypeObject');
					isScheduleScriptCalled = true;
					break;
				}
				else
				{
					var wmsOrderTypeRec = record.create({type:'customrecord_wmsse_ordertype',
					});
					wmsOrderTypeRec.setValue({fieldId:'name',value: OrderTypeName});
					wmsOrderTypeRec.save(); 
				}

			}
		}
		return isScheduleScriptCalled;
	}
	function _migrateCyccPlan()
	{
		log.debug({title : 'remainingUsage at the start of migrateCyccPlan',details : runtime.getCurrentScript().getRemainingUsage() });
		var isScheduleScriptCalled = false;
		if(runtime.getCurrentScript().getRemainingUsage() <= 100)
		{
			callMigrationScheduleScript('migrateCyccPlan');
			isScheduleScriptCalled = true;
		}
		else
		{
			var wmsCycleCountPlanSearchObj = search.load({
				id: 'customsearch_wms_cycc_plan_srch'			
			}); 
			var wmsCycleCountSearchResult = utility.getSearchResultInJSON(wmsCycleCountPlanSearchObj);

			var erpCycleCountPlanSearchObj = search.load({
				id: 'customsearch_wms_new_cycc_plan_srch'			
			}); 
			var erpCyccPlanSearchResult = utility.getSearchResultInJSON(erpCycleCountPlanSearchObj);
			var isScheduleScriptCalledVar = false;
			if(wmsCycleCountSearchResult.length > 0)
			{
				for(var wmscyclecount in wmsCycleCountSearchResult)
				{
					var cycleCountPlanRec = wmsCycleCountSearchResult[wmscyclecount]; 

					var cyclecountPlanName = cycleCountPlanRec.name;
					var cycleCountFound = false;
					for(var erpcyCleCount in erpCyccPlanSearchResult)
					{
						var newCylceCountPlanRec = erpCyccPlanSearchResult[erpcyCleCount]; 

						var newCycleCountPlanName = newCylceCountPlanRec.name;
						if(cyclecountPlanName ==  newCycleCountPlanName )
						{
							cycleCountFound = true;
							break;
						}
					}

					//if(!cycleCountFound && (cyclecountPlanName == 'Migration Plan'))
					if(!cycleCountFound)
					{
						log.debug({title : 'cycleCountPlanRec ccc',details : cycleCountPlanRec});

						var wmsSubsidiary = cycleCountPlanRec.custrecord_wmsse_subsidiary;  //list/record
						var wmsLocation = cycleCountPlanRec.custrecord_wmsse_ccp_location; //list/record
						var wmsDepartment = cycleCountPlanRec.custrecord_wmsse_ccp_department;  //list/record
						var wmsClass = cycleCountPlanRec.custrecord_wmsse_ccp_class;  //list/record
						var wmsMemo = cycleCountPlanRec.custrecord_wmsse_ccp_memo;   //free from text
						var wmsAccount = cycleCountPlanRec.custrecord_wmsse_ccp_account;  //list/record
						var wmsAssignedTo = cycleCountPlanRec.custrecord_wmsse_ccp_assigned_to;  //list/record
						var wmsItem= cycleCountPlanRec.custrecord_wmsse_ccp_item;  //multiselect
						var wmsItemClassification = cycleCountPlanRec.custrecord_wmsse_ccp_item_classification;  //list/record
						var wmsItemFamilyText = cycleCountPlanRec.custrecord_wmsse_ccp_item_familyText;  //list/record
						var wmsItemGroupText = cycleCountPlanRec.custrecord_wmsse_ccp_item_groupText;   //list/record
						var wmsZones = cycleCountPlanRec.custrecord_wmsse_ccp_zonesText;  // multi select
						log.debug('wmsZones',wmsZones);
						var wmsAisle = cycleCountPlanRec.custrecord_wmsse_ccp_aisle;  // free from text
						var wmsBins = cycleCountPlanRec.custrecord_wmsse_ccp_bin; //Multi select
						var wmsUseItemFrequency = cycleCountPlanRec.custrecord_wmsse_ccp_use_itemfreq;  //checkbox
						var wmsCountBinRowswithZeroQuantity = cycleCountPlanRec.custrecord_wmsse_ccp_count_binrowszqty; //checkbox
						var wmsSortRowsbyBin = cycleCountPlanRec.custrecord_wmsse_ccp_rowsort_bin; //checkbox
						var wmsLocationNonWorld = cycleCountPlanRec.custrecord_wmsse_ccp_nonow_location;  //list/record

						if(runtime.getCurrentScript().getRemainingUsage() <= 100)
						{
							callMigrationScheduleScript('migrateCyccPlan');
							isScheduleScriptCalled = true;
							break;
						}
						else
						{
							var newcyccPlanRec = record.create({type:'customrecord_wms_cyclecount_plans'});
							newcyccPlanRec.setValue({fieldId:'name',value: cycleCountPlanRec.name});
							newcyccPlanRec.setValue({fieldId:'custrecord_cycc_location',value: wmsLocation});
							newcyccPlanRec.setValue({fieldId:'custrecord_cycc_account',value: wmsAccount});

							if(utility.isValueValid(wmsSubsidiary))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_subsidiary',value:wmsSubsidiary});
							}
							if(utility.isValueValid(wmsDepartment))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_department',value:wmsDepartment});
							}
							if(utility.isValueValid(wmsClass))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_class',value:wmsClass});
							}

							if(utility.isValueValid(wmsMemo))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_memo',value:wmsMemo});
							}
							if(utility.isValueValid(wmsAssignedTo))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_assignedto',value:wmsAssignedTo});
							}
							if(utility.isValueValid(wmsItemClassification))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_itemclassification',value:wmsItemClassification});
							}
							if(utility.isValueValid(wmsItemFamilyText))
							{
								var coreItemProcessFamilyId = getItemProcessFamilyId(wmsItemFamilyText);
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_itemprocessfamily',value:coreItemProcessFamilyId});
							}
							if(utility.isValueValid(wmsItemGroupText))
							{
								var coreItemGroupId = getItemGroupId(wmsItemGroupText);
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_itemprocessgroup',value:coreItemGroupId});
							}
							if(utility.isValueValid(wmsZones))
							{
								var wmszoneNames =  [];
								var zoneId =  [];
								wmszoneNames = wmsZones.split(',');
								var zoneLoadBinDetails = getZoneId(wmszoneNames);
								for (var objItr in zoneLoadBinDetails) {
									zoneId.push(zoneLoadBinDetails[objItr].values[0]);
								}
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_zones',value:zoneId});
							}
							if(utility.isValueValid(wmsItem))
							{
								var itemId =  [];
								itemId = wmsItem.split(',');
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_item',value:itemId});
							}
							if(utility.isValueValid(wmsAisle))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_aisle',value:wmsAisle});
							}

							if(utility.isValueValid(wmsBins))
							{
								var binId =  [];
								binId = wmsBins.split(',');
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_bins',value:binId});
							}
							if(utility.isValueValid(wmsUseItemFrequency))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_itemfrequency',value:wmsUseItemFrequency});
							}

							if(utility.isValueValid(wmsCountBinRowswithZeroQuantity))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_binswithzeroquantity',value:wmsCountBinRowswithZeroQuantity});
							}
							if(utility.isValueValid(wmsSortRowsbyBin))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_sortrowsbybin',value:wmsSortRowsbyBin});
							}

							if(utility.isValueValid(wmsLocationNonWorld))
							{
								newcyccPlanRec.setValue({fieldId:'custrecord_cycc_nonworld_location',value:wmsLocationNonWorld});
							}
							try
							{
								newcyccPlanRec.save();
							}
							catch(e)
							{
								log.error({title:'This _migrateCyccPlan is failed',details:e});
							}
						}
					}
				}
			}
		}
		log.debug({title : 'remainingUsage at the end of migrateItemFamily',details : runtime.getCurrentScript().getRemainingUsage() });
		return isScheduleScriptCalled;

	}
	function getItemProcessFamilyId(wmsItemProcessFamilyName){
		var itemProcessFamilyLoadQuery = query.create({
			type: query.Type.ITEM_PROCESS_FAMILY
		});
		var wmsItemFamilyNameCond = itemProcessFamilyLoadQuery.createCondition({
			fieldId: 'name',
			operator: query.Operator.IS,
			values: wmsItemProcessFamilyName
		});
		itemProcessFamilyLoadQuery.condition = itemProcessFamilyLoadQuery.and(wmsItemFamilyNameCond);
		itemProcessFamilyLoadQuery.columns = [
			itemProcessFamilyLoadQuery.createColumn({
				fieldId: 'id'
			})
			];

		var itemProcessFamilyLoadBinDetails = itemProcessFamilyLoadQuery.run().results;
		return itemProcessFamilyLoadBinDetails[0].values[0];
		
	}
	function getItemGroupId(wmsItemGroupText){
		var itemGroupLoadQuery = query.create({
			type: query.Type.ITEM_PROCESS_GROUP
		});

		var wmsItemGroupNameCond = itemGroupLoadQuery.createCondition({
			fieldId: 'name',
			operator: query.Operator.IS,
			values: wmsItemGroupText
		});


		itemGroupLoadQuery.condition = itemGroupLoadQuery.and(wmsItemGroupNameCond);


		itemGroupLoadQuery.columns = [
			itemGroupLoadQuery.createColumn({
				fieldId: 'id'
			})
			];

		var itemGroupLoadBinDetails = itemGroupLoadQuery.run().results;
		return itemGroupLoadBinDetails[0].values[0];
	}

	function getZoneId(wmszoneNames){
		var zoneLoadQuery = query.create({
			type: query.Type.ZONE
		});

		var wmsZoneNameCond = zoneLoadQuery.createCondition({
			fieldId: 'name',
			operator: query.Operator.ANY_OF,
			values: wmszoneNames
		});

		zoneLoadQuery.condition = zoneLoadQuery.and(wmsZoneNameCond);
		zoneLoadQuery.columns = [
			zoneLoadQuery.createColumn({
				fieldId: 'id'
			})
		];
		var zoneId = new Array();
		var zoneLoadBinDetails = zoneLoadQuery.run().results;
		log.debug('zoneLoadBinDetails',zoneLoadBinDetails);

		return zoneLoadBinDetails;
	}

	function callMigrationScheduleScript(param)
	{
		var schstatus =  task.create({taskType:task.TaskType.SCHEDULED_SCRIPT});
		schstatus.scriptId = 'customscript_wms_migration_schedulescrpt';
		schstatus.deploymentId = null;
		schstatus.params = {
				"custscript_wms_migration_param" : param								

		};

		schstatus.submit();	
		var currentUserID = runtime.getCurrentUser().id ;//To get current user
		utility.updateScheduleScriptStatus('migrationScript',currentUserID, 'Submitted','migrationScript','','');
	}

	return {
		migrateZones:_migrateZones,
		migrateLocations:_migrateLocations,
		migrateBinFields:_migrateBinFields,
		migrateOrderType:_migrateOrderType,
		migrateItemfamily:_migrateItemfamily,
		migrateItemGroup:_migrateItemGroup,
		migratePickStratagies:_migratePickStratagies,
		migrateCyccPlan:_migrateCyccPlan
	}
});
