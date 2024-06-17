/**/***************************************************************************
 * @NApiVersion 2.x
 * @NScriptType usereventscript
 * @NModuleScope Public
 */
define(
		['N/search','N/record' ,'N/config','N/runtime' ],

		function(search,record,config,runtime) {


			function migrateWMSFields(context){
				try
				{
					var type = context.type;

					var scriptType = runtime.executionContext;
					log.debug({title:'type',details:type});
					log.debug({title:'scriptType',details:scriptType});
					if(scriptType != 'SCHEDULED'){
						var wareHouseManagementFeature = false;
						try
						{
							var vConfig = config.load({	type: config.Type.FEATURES});
							log.debug({title:'vConfig',details:vConfig});
							if (vConfig != null && vConfig != '' && vConfig != undefined ) 
							{
								wareHouseManagementFeature = vConfig.getValue({fieldId: 'wmssystem'});
							}
						}
						catch(e)
						{
							log.error({title:'e',details:e});
							wareHouseManagementFeature = false;
						}
						log.debug({title:'wareHouseManagementFeature',details:wareHouseManagementFeature});
						if(type == 'delete' || type == 'copy' || type == 'DELETE' || type == 'COPY' ||
								wareHouseManagementFeature == false || wareHouseManagementFeature == 'false'|| 
								wareHouseManagementFeature == undefined)
						{
							return false;
						}
						var newRec = context.newRecord;
						if(type == 'create' || type == 'edit' || type == 'xedit' ||
								type == 'CREATE' || type == 'EDIT' || type == 'XEDIT')
						{
							if(newRec.type == 'location')
							{
								if(type == 'create' || type == 'CREATE')
								{
									var wmsMakeWarehouseSiteFlag = newRec.getValue({fieldId:'custrecord_wmsse_make_wh_site'});
									var usewarehousemanagementFlag = newRec.getValue({fieldId:'usewarehousemanagement'});

									if(wmsMakeWarehouseSiteFlag)
									{
										newRec.setValue({fieldId :'usewarehousemanagement',value:wmsMakeWarehouseSiteFlag});
									}
									else
									{
										if(usewarehousemanagementFlag)
										{
											newRec.setValue({fieldId :'custrecord_wmsse_make_wh_site',value:usewarehousemanagementFlag});
										}
									}
								}
								else
								{
									if(type == 'edit' || type == 'xedit' || type == 'EDIT' || type == 'XEDIT')
									{
										var oldRec = context.oldRecord;
										var newRec = context.newRecord;

										var wmsMakeWarehouseSiteFlagNew = newRec.getValue({fieldId:'custrecord_wmsse_make_wh_site'});
										var usewarehousemanagementFlagNew = newRec.getValue({fieldId:'usewarehousemanagement'});

										if(usewarehousemanagementFlagNew == undefined || usewarehousemanagementFlagNew == '' 
											|| usewarehousemanagementFlagNew == null || usewarehousemanagementFlagNew == 'null')
										{
											usewarehousemanagementFlagNew = false;
										}

										var wmsMakeWarehouseSiteFlagOld = oldRec.getValue({fieldId:'custrecord_wmsse_make_wh_site'});
										var usewarehousemanagementFlagOld = oldRec.getValue({fieldId:'usewarehousemanagement'});

										if(usewarehousemanagementFlagOld != usewarehousemanagementFlagNew)
										{
											log.debug({title:'usewarehousemanagementFlagNew',details:usewarehousemanagementFlagNew});
											newRec.setValue({fieldId :'usewarehousemanagement',value:usewarehousemanagementFlagNew});
											newRec.setValue({fieldId :'custrecord_wmsse_make_wh_site',value:usewarehousemanagementFlagNew});
										}
										else
										{
											if(wmsMakeWarehouseSiteFlagOld != wmsMakeWarehouseSiteFlagNew)
											{
												log.debug({title:'wmsMakeWarehouseSiteFlagNew',details:wmsMakeWarehouseSiteFlagNew});
												newRec.setValue({fieldId :'usewarehousemanagement',value:wmsMakeWarehouseSiteFlagNew});
												newRec.setValue({fieldId :'custrecord_wmsse_make_wh_site',value:wmsMakeWarehouseSiteFlagNew});
											}
										}

									}
								}

							}
							else if (newRec.type == 'bin')
							{

								var wmsZone = newRec.getValue({fieldId:'inpt_custrecord_wmsse_zone'});
								var zone = newRec.getValue({fieldId:'inpt_zone'});

								var sequencenumber = newRec.getValue({fieldId:'sequencenumber'});
								var wmsLocation = newRec.getValue({fieldId:'location'});
								var wmsSequenceNumber = newRec.getValue({fieldId:'custrecord_wmsse_pickseq_no'});

								var wmsbin_loc_type = newRec.getValue({fieldId:'inpt_custrecord_wmsse_bin_loc_type'});
								var wmsbin_stg_direction = newRec.getValue({fieldId:'inpt_custrecord_wmsse_bin_stg_direction'});
								var binType = newRec.getValue({fieldId:'type'});

								var binLocType = {};
								var binStageDirection = {};

								var binLocTypeObj = search.create({type:'customlist_wmsse_bin_loc_type',columns:['name']
								});
								var binLocTypeObjSearchResult = [];
								var search_page_count = 1000;

								var myPagedData = binLocTypeObj.runPaged({
									pageSize: search_page_count
								});
								myPagedData.pageRanges.forEach(function (pageRange) {
									var myPage = myPagedData.fetch({
										index: pageRange.index
									});
									myPage.data.forEach(function (result) {
										binLocTypeObjSearchResult.push(result);
									});
								});

								if(binLocTypeObjSearchResult.length > 0)
								{
									for(var binLocTyp in binLocTypeObjSearchResult)
									{
										var binLocTypeRec = binLocTypeObjSearchResult[binLocTyp];
										var name = binLocTypeRec.getValue({name:'name'});
										binLocType[name] = binLocTypeRec.id;
									}
								}

								var binStageDirectionObj = search.create({type:'customlist_wmsse_stg_direction',columns:['name']
								});
								var binStageDirectionObjSearchResult = [];
								var search_page_count = 1000;

								var myPagedData = binStageDirectionObj.runPaged({
									pageSize: search_page_count
								});
								myPagedData.pageRanges.forEach(function (pageRange) {
									var myPage = myPagedData.fetch({
										index: pageRange.index
									});
									myPage.data.forEach(function (result) {
										binStageDirectionObjSearchResult.push(result);
									});
								});

								if(binStageDirectionObjSearchResult.length > 0)
								{
									for(var binStageDir in binStageDirectionObjSearchResult)
									{
										var binbinStageDirRec = binStageDirectionObjSearchResult[binStageDir];
										var name = binbinStageDirRec.getValue({name:'name'});
										binStageDirection[name] = binbinStageDirRec.id;
									}
								}

								if(type == 'create' || type == 'CREATE')
								{
									var str = binType.split('');
									if(str[0] != '' && str[0] != 'NONE')
									{
										if(str[0] == 'INBOUND_STAGING')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:binStageDirection['In']});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:binLocType['Stage']});
										}
										else if(str[0] == 'OUTBOUND_STAGING')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:binStageDirection['Out']});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:binLocType['Stage']});
										}
										else if(str[0] == 'WIP')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:binLocType['WIP']});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:''});
										}
										else if(str[0] == 'NONE' || str[0] == 'STORAGE')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:''});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:''});
										}
									}
									else
									{

										if(wmsbin_loc_type != '')
										{
											if(wmsbin_loc_type == 'WIP')
											{
												newRec.setValue({fieldId:'type',value:'WIP'});
												newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:''});
											}
											else if(wmsbin_loc_type == 'Stage' && wmsbin_stg_direction == 'In')
											{
												newRec.setValue({fieldId:'type',value:'INBOUND_STAGING'});
											}
											else if(wmsbin_loc_type == 'Stage' && wmsbin_stg_direction == 'Out')
											{
												newRec.setValue({fieldId:'type',value:'OUTBOUND_STAGING'});
											}
											else
											{

											}
										}

									}

									if(sequencenumber != '' )
									{
										newRec.setValue({fieldId :'custrecord_wmsse_pickseq_no',value:sequencenumber});
									}
									else 
									{
										if(wmsSequenceNumber != '')
										{
											newRec.setValue({fieldId :'sequencenumber',value:wmsSequenceNumber});
										}
									}






									if(zone != '')
									{
										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:zone
												})
										);
										var zoneObj = search.create({type:'customrecord_wmsse_zone',filters:wmsFilters
										});
										var searchResult = [];
										var search_page_count = 1;

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
											newRec.setValue({fieldId :'custrecord_wmsse_zone',value:searchResult[0].id});
											//need to create wms zone.
										}

									}
									else 
									{

										if(wmsZone != '' && (zone == ' ' || zone == 'null' || zone == null  || zone == undefined || zone == ''))
										{
											var wmsFilters = [];
											wmsFilters.push(
													search.createFilter({
														name:'name',					
														operator:search.Operator.IS,
														values:wmsZone
													})
											);
											wmsFilters.push(
													search.createFilter({
														name:'location',					
														operator:search.Operator.ANYOF,
														values:wmsLocation
													})
											);

											var zoneObj = search.create({type:'zone',filters:wmsFilters
											});
											var zoneSearchResult = [];
											var search_page_count = 10;

											var myPagedData = zoneObj.runPaged({
												pageSize: search_page_count
											});
											myPagedData.pageRanges.forEach(function (pageRange) {
												var myPage = myPagedData.fetch({
													index: pageRange.index
												});
												myPage.data.forEach(function (result) {
													zoneSearchResult.push(result);
												});
											});

											if(zoneSearchResult.length > 0)
											{
												newRec.setValue({fieldId :'zone',value:zoneSearchResult[0].id});
											}
											else
											{
												var loc = newRec.getValue({fieldId:'location'});
												var erpLocRec = record.load({type:'location',id:loc
												});
												var usewarehousemanagement = erpLocRec.getValue({fieldId:'usewarehousemanagement'});
												if(usewarehousemanagement)
												{
													var erpZoneRec = record.create({type:'zone',
													});
													erpZoneRec.setValue({fieldId:'name',value: wmsZone});
													erpZoneRec.setValue({fieldId:'location',value: loc});
													var id=erpZoneRec.save();
													newRec.setValue({fieldId :'zone',value:id});
												}
											}


										}

									}
								}
								else
								{

									var oldRec = context.oldRecord;
									var oldSequencenumber = oldRec.getValue({fieldId:'sequencenumber'});
									var oldWmsPickSequence = oldRec.getValue({fieldId:'custrecord_wmsse_pickseq_no'});

									var newSequencenumber = newRec.getValue({fieldId:'sequencenumber'});
									var newWmsPickSequence = newRec.getValue({fieldId:'custrecord_wmsse_pickseq_no'});

									var pickSequenceNumber = '';
									if(oldSequencenumber == newSequencenumber)
									{
										pickSequenceNumber = newWmsPickSequence;
									}
									else 
									{
										pickSequenceNumber = newSequencenumber;
									}
									newRec.setValue({fieldId :'custrecord_wmsse_pickseq_no',value:pickSequenceNumber});
									newRec.setValue({fieldId :'sequencenumber',value:pickSequenceNumber});

									var oldType = oldRec.getValue({fieldId:'type'});										
									var oldBinLocationType = oldRec.getValue({fieldId:'inpt_custrecord_wmsse_bin_loc_type'});
									var oldBinDirection = oldRec.getValue({fieldId:'inpt_custrecord_wmsse_bin_stg_direction'});

								var oldBinLocationTypeWMS = oldRec.getText({fieldId:'custrecord_wmsse_bin_loc_type'});
								var oldBinDirectionWMS = oldRec.getText({fieldId:'custrecord_wmsse_bin_stg_direction'});
									var newType = newRec.getValue({fieldId:'type'});
									var newBinLocationType = newRec.getValue({fieldId:'inpt_custrecord_wmsse_bin_loc_type'});
									var newBinDirection = newRec.getValue({fieldId:'inpt_custrecord_wmsse_bin_stg_direction'});
								var newBinLocationTypeWMS = newRec.getText({fieldId:'custrecord_wmsse_bin_loc_type'});
								var newBinDirectionWMS = newRec.getText({fieldId:'custrecord_wmsse_bin_stg_direction'});

									var typeArr = newType.split('');
									if(oldType == typeArr[0])
									{

										if(oldBinLocationType != newBinLocationType || oldBinDirection != newBinDirection )
										{
											if(newBinLocationType == 'WIP')
											{

												newRec.setValue({fieldId:'type',value:'WIP'});
												newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:''});
											}
											else if(newBinLocationType == 'Stage' && newBinDirection == 'In')
											{
												log.debug({title:'newBinDirection in1',details:newBinDirection});
												newRec.setValue({fieldId:'type',value:'INBOUND_STAGING'});
											}
											else if(newBinLocationType == 'Stage' && newBinDirection == 'Out')
											{
												newRec.setValue({fieldId:'type',value:'OUTBOUND_STAGING'});
											}
										else if(((oldBinLocationTypeWMS == 'Stage' && (oldBinDirectionWMS == 'In' || oldBinDirectionWMS == 'Out')) && (newBinLocationTypeWMS == '' && newBinDirectionWMS == '' ))
											|| (oldBinLocationTypeWMS == 'WIP' && newBinLocationTypeWMS == ''))
											{
												newRec.setValue({fieldId:'type',value:''});
											}
										}
									}
									else
									{
										if(typeArr[0] == 'INBOUND_STAGING')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:binStageDirection['In']});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:binLocType['Stage']});
										}
										else if(typeArr[0] == 'OUTBOUND_STAGING')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:binStageDirection['Out']});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:binLocType['Stage']});
										}
										else if(typeArr[0] == 'WIP')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:binLocType['WIP']});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:''});
										}
										else if(typeArr[0] == 'NONE' || typeArr[0] == 'STORAGE')
										{
											newRec.setValue({fieldId:'custrecord_wmsse_bin_loc_type',value:''});
											newRec.setValue({fieldId:'custrecord_wmsse_bin_stg_direction',value:''});
										}


									}

									var oldzone = oldRec.getValue({fieldId:'zone'});
									var oldWmszone = oldRec.getValue({fieldId:'custrecord_wmsse_zone'});

									var newzone = newRec.getValue({fieldId:'zone'});
									var newWmszone = newRec.getValue({fieldId:'custrecord_wmsse_zone'});

									var zoneNumber = '';
									if(oldzone != newzone || oldWmszone != newWmszone)
									{
										if(oldzone != newzone)
										{
											zoneNumber = newRec.getValue({fieldId:'inpt_zone'});  

											var wmsFilters = [];
											wmsFilters.push(
													search.createFilter({
														name:'name',					
														operator:search.Operator.IS,
														values:zoneNumber
													})
											);



											var zoneObj = search.create({type:'customrecord_wmsse_zone',filters:wmsFilters
											});
											var searchResult = [];
											var search_page_count = 1;

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
												zoneId = searchResult[0].id;
												newRec.setValue({fieldId:'custrecord_wmsse_zone',value:zoneId});
											}
											else
											{
												var wmsZoneRec = record.create({type:'customrecord_wmsse_zone',
												});
												wmsZoneRec.setValue({fieldId:'name',value: zoneNumber});
												var id = wmsZoneRec.save();
												newRec.setValue({fieldId:'custrecord_wmsse_zone',value:id});
											}

										}
										else
										{
											zoneNumber = newRec.getValue({fieldId:'inpt_custrecord_wmsse_zone'});;
											var locationId = newRec.getValue({fieldId:'location'});
											var wmsFilters = [];
											wmsFilters.push(
													search.createFilter({
														name:'name',					
														operator:search.Operator.IS,
														values:zoneNumber
													})
											);
											wmsFilters.push(
													search.createFilter({
														name:'location',					
														operator:search.Operator.ANYOF,
														values:locationId
													})
											);
											var zoneObj = search.create({type:'zone',filters:wmsFilters
											});
											var searchResult = [];
											var search_page_count = 1;

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
												var zoneId = searchResult[0].id;
												log.debug({title:'zoneId',details:zoneId});
												newRec.setValue({fieldId:'zone',value:zoneId});
											}
											else
											{
												var erpZoneRec = record.create({type:'zone',
												});
												erpZoneRec.setValue({fieldId:'name',value: zoneNumber});
												erpZoneRec.setValue({fieldId:'location',value: locationId});
												var id = erpZoneRec.save();
												newRec.setValue({fieldId:'zone',value:id});
											}



										}
									}
								}

							}
						}
					}
				}
				catch(e)
				{
					log.debug({title:'exception',details:e});	
				}


			}


			function migrationWMSObjects(context) {

				log.debug({title:'context',details:context});
				try
				{
					if(type == 'delete' || type == 'copy' || type == 'DELETE' || type == 'COPY')
					{
						return;
					}

					var type = context.type;
					var newRec = context.newRecord;
					if(type == 'create' || type == 'CREATE')
					{

						if (newRec.type == 'customrecord_wmsse_item_family' || newRec.type == 'customrecord_wmsse_itemgroup' ||
								newRec.type == 'customrecord_wmsse_ordertype' ||  
								newRec.type == 'itemprocessfamily' || newRec.type == 'itemprocessgroup'
									|| newRec.type == 'ordertype' || newRec.type == 'zone')//|| newRec.type == 'customrecord_wmsse_zone'
						{
							var erpType = '';
							if(newRec.type == 'customrecord_wmsse_item_family')
							{
								erpType = 'itemprocessfamily';
							}
							else if(newRec.type == 'customrecord_wmsse_itemgroup')
							{
								erpType = 'itemprocessgroup';
							}
							else if(newRec.type == 'customrecord_wmsse_ordertype')
							{
								erpType = 'ordertype';
							}
							else if(newRec.type == 'itemprocessfamily')
							{
								erpType = 'customrecord_wmsse_item_family';
							}
							else if(newRec.type == 'itemprocessgroup')
							{
								erpType = 'customrecord_wmsse_itemgroup';
							}
							else if(newRec.type == 'ordertype')
							{
								erpType = 'customrecord_wmsse_ordertype';
							}
							else if(newRec.type == 'zone')
							{
								erpType = 'customrecord_wmsse_zone';
							}
							else
							{

							}
							/*else if(newRec.type == 'customrecord_wmsse_zone')
							{
								erpType = 'zone';
							}*/

							var wmsItemFamilyName = newRec.getValue({fieldId:'name'});
							var wmsFilters = [];
							wmsFilters.push(
									search.createFilter({
										name:'name',					
										operator:search.Operator.IS,
										values:wmsItemFamilyName
									})
							);
							var erpItemFamilyObj = search.create({type:erpType,filters:wmsFilters
							});
							var searchResult = [];
							var search_page_count = 10;

							var myPagedData = erpItemFamilyObj.runPaged({
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
							if(searchResult.length == 0)
							{

								var erpItemFamilyRec = record.create({type:erpType,
								});
								erpItemFamilyRec.setValue({fieldId:'name',value: wmsItemFamilyName});
								var id = erpItemFamilyRec.save(); 
							}

						}
						else if (newRec.type == 'customrecord_wmsse_pickstrategies')
						{
							var wmsPickStratagey = newRec.getValue({fieldId:'name'});
							var wmsFilters = [];
							wmsFilters.push(
									search.createFilter({
										name:'name',					
										operator:search.Operator.IS,
										values:wmsPickStratagey
									})
							);
							var erpPickStratageyObj = search.create({type:'pickstrategy',filters:wmsFilters
							});
							var searchResult = [];
							var search_page_count = 10;

							var myPagedData = erpPickStratageyObj.runPaged({
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
							if(searchResult.length == 0)
							{

								var wmsItemGroup = newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_itemgroup'});
								var wmsUnits = newRec.getValue({fieldId:'custrecord_wmsse_pick_units'});
								var wmsOrderType = newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_ordertype'});
								var wmsLocation = newRec.getValue({fieldId:'custrecord_wmsse_pick_location'});
								var wmsItemFamily  =newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_itemfamily'});
								var wmsPickSequence = newRec.getValue({fieldId:'custrecord_wmsse_pick_sequence'});
								var wmsItem = newRec.getValue({fieldId:'custrecord_wmsse_pick_item'});
								var wmsZone =  newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_zone'});

								var erpPickStratagieRec = record.create({type:'pickstrategy'
								});
								erpPickStratagieRec.setValue({fieldId:'name',value: newRec.getValue({fieldId:'name'})});
								erpPickStratagieRec.setValue({fieldId:'trantype',value: 'SalesOrd'});

								if(wmsItemGroup != '')
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
										erpPickStratagieRec.setValue({fieldId:'itemprocessgroup',value: searchResult[0].id});
									}
								}
								if(wmsUnits != '')
								{
									erpPickStratagieRec.setValue({fieldId:'units',value:wmsUnits});
								}
								if(wmsOrderType != '')
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
										erpPickStratagieRec.setValue({fieldId:'ordertype',value:searchResult[0].id});
									}
								}
								if(wmsLocation != '')
								{
									erpPickStratagieRec.setValue({fieldId:'location',value:wmsLocation});
								}
								if(wmsItemFamily != '')
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
								//erpPickStratagieRec.setValue({fieldId:'invtclassification',value: pickStratagieRec.name});
								if(wmsPickSequence != '')
								{
									erpPickStratagieRec.setValue({fieldId:'priority',value:wmsPickSequence});
								}
								if(wmsItem != '')
								{
									erpPickStratagieRec.setValue({fieldId:'item',value:wmsItem});
								}

								if(wmsZone != '')
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
										erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
										erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:searchResult[0].id});
									}
									else
									{
										if(wmsLocation != '')
										{
											var erpZoneRec = record.create({type:'zone',
											});
											erpZoneRec.setValue({fieldId:'name',value: wmsZone});
											erpZoneRec.setValue({fieldId:'location',value: wmsLocation});
											var id = erpZoneRec.save();
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:id});
										}
									}
								}
								erpPickStratagieRec.save();

							}
						}
						else
						{

						}


					}
					else
					{
						if(type == 'edit' || type == 'xedit' || type == 'EDIT' || type == 'XEDIT')
						{
							var oldRec = context.oldRecord;
							if (oldRec.type == 'customrecord_wmsse_item_family' || oldRec.type == 'customrecord_wmsse_itemgroup' ||
									newRec.type == 'customrecord_wmsse_ordertype' || newRec.type == 'customrecord_wmsse_zone' ||  
									newRec.type == 'itemprocessfamily' || newRec.type == 'itemprocessgroup'
										|| newRec.type == 'ordertype' || newRec.type == 'zone')
							{
								var erpType = '';
								if(newRec.type == 'customrecord_wmsse_item_family')
								{
									erpType = 'itemprocessfamily';
								}
								else if(newRec.type == 'customrecord_wmsse_itemgroup')
								{
									erpType = 'itemprocessgroup';
								}
								else if(newRec.type == 'customrecord_wmsse_ordertype')
								{
									erpType = 'ordertype';
								}
								else if(newRec.type == 'customrecord_wmsse_zone')
								{
									erpType = 'zone';
								}
								else if(newRec.type == 'itemprocessfamily')
								{
									erpType = 'customrecord_wmsse_item_family';
								}
								else if(newRec.type == 'itemprocessgroup')
								{
									erpType = 'customrecord_wmsse_itemgroup';
								}
								else if(newRec.type == 'ordertype')
								{
									erpType = 'customrecord_wmsse_ordertype';
								}
								else if(newRec.type == 'zone')
								{
									erpType = 'customrecord_wmsse_zone';
								}
								else
								{

								}
								var wmsItemFamilyName = oldRec.getValue({fieldId:'name'});
								var wmsFilters = [];
								wmsFilters.push(
										search.createFilter({
											name:'name',					
											operator:search.Operator.IS,
											values:wmsItemFamilyName
										})
								);
								var erpZoneLocId = '';
								if(erpType == 'zone')
								{
									var binResult =[];
									var wmsBinFilters = [];
									wmsBinFilters.push(
											search.createFilter({
												name:'custrecord_wmsse_zone',					
												operator:search.Operator.IS,
												values:newRec.getValue({fieldId:'name'})
											})
									);
									var searchObj = search.create({
										type: 'bin',
										columns:['location'],
										filters :wmsBinFilters
									}); 
									var search_page_count = 1;

									var myPagedData = searchObj.runPaged({
										pageSize: search_page_count
									});

									myPagedData.pageRanges.forEach(function (pageRange) {
										var myPage = myPagedData.fetch({
											index: pageRange.index
										});
										myPage.data.forEach(function (result) {
											binResult.push(result);
										});
									});
									if(binResult.length > 0)
									{
										erpZoneLocId = binResult[0].getValue({name:'location'});
										wmsFilters.push(
												search.createFilter({
													name:'location',					
													operator:search.Operator.ANYOF,
													values:erpZoneLocId
												})
										);
									}
								}
								var erpItemFamilyObj = search.create({type:erpType,filters:wmsFilters
								});
								var searchResult = [];
								var search_page_count = 10;

								var myPagedData = erpItemFamilyObj.runPaged({
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
								var itemFamilyName = newRec.getValue({fieldId:'name'});
								if(searchResult.length > 0)
								{
									var erpItemFamilyRec = record.load({type:erpType,id:searchResult[0].id
									});

									erpItemFamilyRec.setValue({fieldId:'name',value: itemFamilyName});


									var id = erpItemFamilyRec.save(); 
								}
								else
								{
									var Rec = record.create({type:erpType
									});
									Rec.setValue({fieldId:'name',value: itemFamilyName});
									if(erpType == 'zone' && erpZoneLocId != '')
									{
										Rec.setValue({fieldId:'location',value: erpZoneLocId});
									}
									var id = Rec.save(); 
								}

							}
							else if(oldRec.type == 'customrecord_wmsse_pickstrategies')
							{
								var wmsPickStratagey = oldRec.getValue({fieldId:'name'});
								var wmsFilters = [];
								wmsFilters.push(
										search.createFilter({
											name:'name',					
											operator:search.Operator.IS,
											values:wmsPickStratagey
										})
								);
								var erpPickStratageyObj = search.create({type:'pickstrategy',filters:wmsFilters
								});
								var searchResult = [];
								var search_page_count = 10;

								var myPagedData = erpPickStratageyObj.runPaged({
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

									var wmsItemGroup = newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_itemgroup'});
									var wmsUnits = newRec.getValue({fieldId:'custrecord_wmsse_pick_units'});
									var wmsOrderType = newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_ordertype'});
									var wmsLocation = newRec.getValue({fieldId:'custrecord_wmsse_pick_location'});
									var wmsItemFamily  =newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_itemfamily'});
									var wmsPickSequence = newRec.getValue({fieldId:'custrecord_wmsse_pick_sequence'});
									var wmsItem = newRec.getValue({fieldId:'custrecord_wmsse_pick_item'});
									var wmsZone =  newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_zone'});
									log.debug('wmsOrderType',wmsOrderType);
									var erpPickStratagieRec = record.load({type:'pickstrategy',id:searchResult[0].id
									});
									erpPickStratagieRec.setValue({fieldId:'name',value: newRec.getValue({fieldId:'name'})});
									erpPickStratagieRec.setValue({fieldId:'trantype',value: 'SalesOrd'});
									if(wmsItemGroup != '')
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
											erpPickStratagieRec.setValue({fieldId:'itemprocessgroup',value: searchResult[0].id});
										}
									}
									if(wmsUnits != '')
									{
										erpPickStratagieRec.setValue({fieldId:'units',value:wmsUnits});
									}
									if(wmsOrderType != '')
									{
										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsOrderType
												})
										);
										var searchObj = search.create({type:'ordertype',filters:wmsFilters,columns:['name']
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
										log.debug('searchResult',searchResult);
										if(searchResult.length > 0)
										{
											erpPickStratagieRec.setValue({fieldId:'ordertype',value:searchResult[0].id});
										}
									}
									if(wmsLocation != '')
									{
										erpPickStratagieRec.setValue({fieldId:'location',value:wmsLocation});
									}
									if(wmsItemFamily != '')
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
									//erpPickStratagieRec.setValue({fieldId:'invtclassification',value: pickStratagieRec.name});
									if(wmsPickSequence != '')
									{
										erpPickStratagieRec.setValue({fieldId:'priority',value:wmsPickSequence});
									}
									if(wmsItem != '')
									{
										erpPickStratagieRec.setValue({fieldId:'item',value:wmsItem});
									}

									if(wmsZone != '')
									{

										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsZone
												})
										);
										wmsFilters.push(
												search.createFilter({
													name:'location',					
													operator:search.Operator.ANYOF,
													values:wmsLocation
												})
										);
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
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:searchResult[0].id});
										}
										else
										{
											if(wmsLocation != '')
											{
												var erpZoneRec = record.create({type:'zone',
												});
												erpZoneRec.setValue({fieldId:'name',value: wmsZone});
												erpZoneRec.setValue({fieldId:'location',value: wmsLocation});
												var id = erpZoneRec.save();
												erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
												erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:id});
											}
										}
									}
									erpPickStratagieRec.save();

								}
								else
								{
									var wmsItemGroup = newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_itemgroup'});
									var wmsUnits = newRec.getValue({fieldId:'custrecord_wmsse_pick_units'});
									var wmsOrderType = newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_ordertype'});
									var wmsLocation = newRec.getValue({fieldId:'custrecord_wmsse_pick_location'});
									var wmsItemFamily  =newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_itemfamily'});
									var wmsPickSequence = newRec.getValue({fieldId:'custrecord_wmsse_pick_sequence'});
									var wmsItem = newRec.getValue({fieldId:'custrecord_wmsse_pick_item'});
									var wmsZone =  newRec.getValue({fieldId:'inpt_custrecord_wmsse_pick_zone'});

									var erpPickStratagieRec = record.create({type:'pickstrategy'
									});
									erpPickStratagieRec.setValue({fieldId:'name',value: newRec.getValue({fieldId:'name'})});
									erpPickStratagieRec.setValue({fieldId:'trantype',value: 'SalesOrd'});
									if(wmsItemGroup != '')
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
											erpPickStratagieRec.setValue({fieldId:'itemprocessgroup',value: searchResult[0].id});
										}
									}
									if(wmsUnits != '')
									{
										erpPickStratagieRec.setValue({fieldId:'units',value:wmsUnits});
									}
									if(wmsOrderType != '')
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
											erpPickStratagieRec.setValue({fieldId:'ordertype',value:searchResult[0].id});
										}
									}
									if(wmsLocation != '')
									{
										erpPickStratagieRec.setValue({fieldId:'location',value:wmsLocation});
									}
									if(wmsItemFamily != '')
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
									//erpPickStratagieRec.setValue({fieldId:'invtclassification',value: pickStratagieRec.name});
									if(wmsPickSequence != '')
									{
										erpPickStratagieRec.setValue({fieldId:'priority',value:wmsPickSequence});
									}
									if(wmsItem != '')
									{
										erpPickStratagieRec.setValue({fieldId:'item',value:wmsItem});
									}

									if(wmsZone != '')
									{

										var wmsFilters = [];
										wmsFilters.push(
												search.createFilter({
													name:'name',					
													operator:search.Operator.IS,
													values:wmsZone
												})
										);
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
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
											erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:searchResult[0].id});
										}
										else
										{
											if(wmsLocation != '')
											{
												var erpZoneRec = record.create({type:'zone',
												});
												erpZoneRec.setValue({fieldId:'name',value: wmsZone});
												erpZoneRec.setValue({fieldId:'location',value: wmsLocation});
												var id = erpZoneRec.save();
												erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'priority',value: 1});
												erpPickStratagieRec.setSublistValue({sublistId:'zones',line:0,fieldId: 'zone',value:id});
											}
										}
									}
									erpPickStratagieRec.save();
								}
							}
							else
							{

							}
						}
					}

				}
				catch(e)
				{
					log.debug({title:'exception',details:e});
				}
			}
			return {
				afterSubmit : migrationWMSObjects,
				beforeSubmit : migrateWMSFields
			};
		});



