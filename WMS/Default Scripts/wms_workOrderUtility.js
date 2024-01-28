/**
 *    Copyright Ã¯Â¿Â½ 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['./wms_utility', 'N/search', 'N/runtime', 'N/record', 'N/config', 'N/format', './big', './wms_translator', 'N/wms/recommendedBins', 'N/task', 'N/query'],
	function (utility, search, runtime, record, config, format, Big, translator, binApi, task, query) {

		function getWOList(whLocation, transactionName, locUseBinsFlag, woIDArr) {
			var workOrdListSearch = search.load({
				id: 'customsearch_wms_workorder_orderlist'
			});

			workOrdListSearch.filters.push(
				search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: whLocation
				})
			);

			if (utility.isValueValid(transactionName)) {
				workOrdListSearch.filters.push(
					search.createFilter({
						name: 'tranid',
						operator: search.Operator.ANYOF,
						values: transactionName
					})
				);
			}
			if (utility.isValueValid(woIDArr)) {
				workOrdListSearch.filters.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: woIDArr
					})
				);
			}

			/*if(!utility.isValueValid( locUseBinsFlag) || locUseBinsFlag ){
				workOrdListSearch.filters.push(search.createFilter({
					name: 'usebins',
					join : 'item',
					operator: search.Operator.IS,
					values: true
				}));
			}*/

			var workOrdListResults = utility.getSearchResultInJSON(workOrdListSearch);
			log.debug('workOrdListResults', workOrdListResults);

			return workOrdListResults;
		}

		function getWODetails(wonumber) {
			var workOrdDtlSearch = search.load({
				id: 'customsearch_wms_wo_transaction_dtl'
			});

			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: wonumber
				})
			);
			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'mainline',
					operator: search.Operator.IS,
					values: 'T'
				})
			);

			var workOrdDtlResults = utility.getSearchResultInJSON(workOrdDtlSearch);
			log.debug('workOrdDtlResults', workOrdDtlResults);

			return workOrdDtlResults;
		}
		function _getWorkOrderDetails(whLocation) {
			var mfgBundleFlag = checkMFGbundleExistOrNot();
			var workOrdDtlSearch = search.load({
				id: 'customsearch_wms_wo_transaction_dtl'
			});
			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'mainline',
					operator: search.Operator.IS,
					values: true
				})

			);
			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'status',
					operator: search.Operator.ANYOF,
					values: ['WorkOrd:D', 'WorkOrd:B']
				}));
			if (utility.isValueValid(whLocation)) {
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: whLocation
					})
				);
			}
			if (mfgBundleFlag) {
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'custbody_mfgmob_workcenter',
						operator: search.Operator.ANYOF,
						values: ['@NONE@']
					}));
			}



			return utility.getSearchResults(workOrdDtlSearch);
		}

		function fnToValidateWO(transactionName, itemId, transactionLineNo, transactionInternalId, inventoryDetailLotOrSerialId) {

			var workOrdDtlSearch = search.load({
				id: 'customsearch_wms_workorder_ordervalidate'
			});
			if (utility.isValueValid(transactionName))
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'tranid',
						operator: search.Operator.ANYOF,
						values: transactionName
					})
				);
			if (utility.isValueValid(itemId))
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'item',
						operator: search.Operator.ANYOF,
						values: itemId
					})
				);
			if (utility.isValueValid(transactionLineNo))
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'line',
						operator: search.Operator.EQUALTO,
						values: transactionLineNo
					})
				);
			if (utility.isValueValid(transactionInternalId))
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'internalid',
						operator: search.Operator.ANYOF,
						values: transactionInternalId
					})
				);
			if (utility.isValueValid(inventoryDetailLotOrSerialId)) {
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'inventorynumber',
						join: 'inventorydetail',
						operator: search.Operator.ANYOF,
						values: inventoryDetailLotOrSerialId
					})
				);
				workOrdDtlSearch.columns.push(
					search.createColumn({
						name: 'inventorynumber',
						join: 'inventorydetail',
						summary: search.Summary.GROUP
					})
				);
				workOrdDtlSearch.columns.push(
					search.createColumn({
						name: 'quantity',
						join: 'inventorydetail',
						label: 'quantity',
						summary: search.Summary.SUM
					})
				);
			}

			var workOrdDtlResults = utility.getSearchResultInJSON(workOrdDtlSearch);
			log.debug('workOrdDtlResults iin validate', workOrdDtlResults);

			return workOrdDtlResults;
		}

		function getWOLineItemList(inputParamObj) {
			var itemListSearch = search.load({
				id: 'customsearch_wms_workorder_lineitemlist'
			});

			itemListSearch.filters.push(
				search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: inputParamObj.whLocation
				})
			);

			if (utility.isValueValid(inputParamObj.transactionName))
				itemListSearch.filters.push(
					search.createFilter({
						name: 'tranid',
						operator: search.Operator.IS,
						values: inputParamObj.transactionName
					})
				);

			if (inputParamObj.inventoryDetailLotOrSerialFlag) {

				itemListSearch.columns.push(
					search.createColumn({
						name: 'inventorynumber',
						join: 'inventorydetail',
						summary: search.Summary.GROUP
					})
				);
				itemListSearch.columns.push(
					search.createColumn({
						name: 'formulanumeric',
						formula: '{inventorydetail.quantity}/({quantity}/{quantityuom})',
						label: 'Quantity',
						summary: search.Summary.SUM
					})
				);
			}

			var itemListResults = utility.getSearchResultInJSON(itemListSearch);
			log.debug('itemListResults', itemListResults);

			return itemListResults;
		}

		//	Commented below function, becuase in workorder picking Bins are display from recommaned bin api
		/*function getWOPickBinDetails(pickBinDetailsObj)
		{   var itemName = pickBinDetailsObj['itemName'];
		var getItemInternalId = pickBinDetailsObj['itemInternalId'];
		var strItemGrp = pickBinDetailsObj['strItemGrp'];
		var strItemFam = pickBinDetailsObj['strItemFamily'];
		var getPreferBin = pickBinDetailsObj["preferBinId"];
		var strLocation = pickBinDetailsObj["whLocationId"];
		var strItemDept = pickBinDetailsObj["department"];
		var strItemClass = pickBinDetailsObj["classes"];
		var strOrderType = pickBinDetailsObj["strOrderType"];
		var strvUnits = pickBinDetailsObj["strvUnits"];
		var boolinclIBStageInvFlag =pickBinDetailsObj["boolinclIBStageInvFlag"];
		var makeInvAvailFlagFromSelect = pickBinDetailsObj["makeInvAvailFlagFromSelect"];
		var itemType = pickBinDetailsObj["itemType"];
		var itemUnitType = pickBinDetailsObj["unitType"];
		var itemStockUnit = pickBinDetailsObj["blnItemUnit"];
		var getPreferBinId = pickBinDetailsObj["preferBinId"];
		var selectedConversionRate = pickBinDetailsObj["selectedConversionRate"];
		var currentConversionRate = pickBinDetailsObj["currentConversionRate"];
		var invstatusarray=[];
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
	
		if(! utility.isValueValid(makeInvAvailFlagFromSelect))
		{
			makeInvAvailFlagFromSelect='All';
		}
		if(inventoryStatusFeature==true && makeInvAvailFlagFromSelect!=null && makeInvAvailFlagFromSelect!=''
			&& makeInvAvailFlagFromSelect!='All')
		{
			if(makeInvAvailFlagFromSelect == 'T' || makeInvAvailFlagFromSelect == 'F')
			{
				invstatusarray=utility.getInventoryAvailableStatus(makeInvAvailFlagFromSelect);
			}
			else
			{ 
				invstatusarray=utility.getSelectedStatus(makeInvAvailFlagFromSelect);
			}
	
		}
		var vmakeInvAvailFlag = true;
		var vLocDetails = search.lookupFields({
			type: search.Type.LOCATION,
			id: strLocation,
			columns: ['makeinventoryavailable']
		});
		vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
		var vBinLocArr=[];
		var vPickZoneArr=[];
		var vBinIntIdExcludeArr = [];
		var filterPref = [];
		var inclIBStageInvFlagArr =[];
		var stageLocArr = [];
	
		if(utility.isValueValid(getPreferBin) )
		{
			var BinlocationSearch =  search.create({
				type:'customlist_wmsse_bin_loc_type',
				columns:[{
					name: 'name'}]
			});
			var	 BinlocationTypes = BinlocationSearch.run().getRange({
				start: 0,
				end: 1000
			});
			if(BinlocationTypes.length > 0)
			{
				var stgTypeArr = [];
				stgTypeArr.push('Stage');
				stageLocArr =utility.getStageLocations(stgTypeArr,BinlocationTypes);
				stageLocArr.push('@NONE@');
			}
			var preferBinSearch = search.load({id:'customsearch_wmsse_binsbypickzonesearch'});
			var PreferBinFilters =preferBinSearch.filters;
	
			PreferBinFilters.push(search.createFilter({name:
				'inactive',
				operator:search.Operator.IS,
				values:false}));
	
	
			PreferBinFilters.push(search.createFilter({name:
				'binnumber',
				operator:search.Operator.IS,
				values:getPreferBin}));
	
	
			if(utility.isValueValid(strLocation))
			{
				PreferBinFilters.push(search.createFilter({name:
					'location',
					operator:search.Operator.ANYOF,
					values:strLocation}));
	
			}
			if(stageLocArr.length > 0)
			{
				PreferBinFilters.push(search.createFilter({name:
					'custrecord_wmsse_bin_loc_type',
					operator:search.Operator.ANYOF,
					values:stageLocArr}));
				PreferBinFilters.push(search.createFilter({name:
					'custrecord_wmsse_bin_stg_direction',
					operator:search.Operator.ANYOF,
					values: ['@NONE@','1']}));
	
			}
			preferBinSearch.filters = PreferBinFilters;
			var objPrefBinIdDetails = utility.getSearchResultInJSON(preferBinSearch);
			log.debug({title:'objPrefBinIdDetails',details:objPrefBinIdDetails});
			if(objPrefBinIdDetails.length>0 && objPrefBinIdDetails[0]['internalid']!= null && 
					objPrefBinIdDetails[0]['internalid'] != '' && utility.isValueValid(getPreferBin))
			{  var  wmsAisle = objPrefBinIdDetails[0]['custrecord_wmsse_aisle'];
			var  wmsLevel = objPrefBinIdDetails[0]['custrecord_wmsse_level'];
			var  VZone  = objPrefBinIdDetails[0]['custrecord_wmsse_zoneText'];
			getPreferBinId=objPrefBinIdDetails[0]['internalid'];
			log.debug({title:'getPreferBinId',details:getPreferBinId});
	
			var vStockUnit="";
			var vUnittype="";
			var objPrefBinDetails =[];
			var searchName = 'customsearch_wms_get_invbalance_details';
	
			var objPrefSearch =search.load({id:searchName,type:search.Type.INVENTORY_BALANCE});
			var preferBinFilters =objPrefSearch.filters;
			if(utility.isValueValid(getItemInternalId))
			{
				preferBinFilters.push(search.createFilter({name:
					'internalid',
					join:'item',
					operator:search.Operator.ANYOF,
					values:getItemInternalId}));
	
			}
			if(utility.isValueValid(strLocation))
			{
				preferBinFilters.push(search.createFilter({name:
					'location',
					operator:search.Operator.ANYOF,
					values:strLocation}));
	
			}
			if(inventoryStatusFeature)
			{
				if(utility.isValueValid(makeInvAvailFlagFromSelect))
				{
					if(makeInvAvailFlagFromSelect == 'T' || makeInvAvailFlagFromSelect == 'F')
					{
						preferBinFilters.push(search.createFilter({name:
							'inventoryavailable',
							join:'inventorystatus',
							operator:search.Operator.IS,
							values:makeInvAvailFlagFromSelect}));
	
					}
					else
					{
						if(makeInvAvailFlagFromSelect != 'All')
						{
							preferBinFilters.push(search.createFilter({name:
								'status',
								operator:search.Operator.ANYOF,
								values:makeInvAvailFlagFromSelect}));
						}
	
					}
	
				}
			}
			preferBinFilters.push(search.createFilter({name:
				'binnumber',
				operator:search.Operator.ANYOF,
				values:objPrefBinIdDetails[0]['internalid']}));
	
			objPrefSearch.filters = preferBinFilters;
			var objPrefBinDetails  = utility.getSearchResultInJSON(objPrefSearch);
			log.debug({title:'objPrefBinDetails',details:objPrefBinDetails});
			if(objPrefBinDetails.length > 0)
			{
				var vValidBinId='';
				var vValidBin='';
				var vPrefBinQtyAvail='';
				var vBinStatus='';
				var vBinStatusID='';
	
	
				for(var prefBinIterator in  objPrefBinDetails)
				{
	
					vValidBinId=objPrefBinDetails[prefBinIterator]['binnumber'];
					vValidBin=objPrefBinDetails[prefBinIterator]['binnumberText'];
					vPrefBinQtyAvail=objPrefBinDetails[prefBinIterator]['available'];
					vBinStatus=objPrefBinDetails[prefBinIterator]['statusText'];
					//VZone = objPrefBinDetails[prefBinIterator]['custrecord_wmsse_zoneText'];
					vBinStatusID = objPrefBinDetails[prefBinIterator]['status'];
	
					vPrefBinQtyAvail = parseFloat(vPrefBinQtyAvail);
					if(parseFloat(vPrefBinQtyAvail) > 0)
					{
						if(utility.isValueValid(selectedConversionRate) && utility.isValueValid(currentConversionRate) && (selectedConversionRate != currentConversionRate))
						{
							vPrefBinQtyAvail = utility.uomConversions(vPrefBinQtyAvail,selectedConversionRate,currentConversionRate);
						}
						var currRow ={'binnumber':getPreferBin,'availableqty':vPrefBinQtyAvail,'bininternalid':objPrefBinIdDetails[0]['internalid'],'zone':VZone,'status':vBinStatus,'itemName' : itemName,
								'wmsaisle' : wmsAisle , 'wmslevel' : wmsLevel};
						vBinIntIdExcludeArr.push(objPrefBinIdDetails[0]['internalid']);
						vBinLocArr.push(currRow);
					}
				}
			}
			}
		}
		var pickStratagiesSearch = search.load({id:'customsearch_wmsse_get_pickstrategies'});
		var pickStratagiesFilters = pickStratagiesSearch.filters;
		if(utility.isValueValid(getItemInternalId))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_item',
				operator:search.Operator.ANYOF,
				values:['@NONE@',getItemInternalId]}));
		}
	
		if(utility.isValueValid(strItemGrp))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_itemgroup',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strItemGrp]}));
		}
		else
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_itemgroup',
				operator:search.Operator.ANYOF, 
				values:['@NONE@']}));
		}
		if(utility.isValueValid(strItemFam))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_itemfamily',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strItemFam]}));
		}
		else
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_itemfamily',
				operator:search.Operator.ANYOF,
				values:['@NONE@']}));
		}
		if(utility.isValueValid(strLocation))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		else
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_location',
				operator:search.Operator.ANYOF,
				values:['@NONE@']}));
		}
		pickStratagiesFilters.push(search.createFilter({
			name:'isinactive',
			operator:search.Operator.IS,
			values:false}));
	
		if(utility.isValueValid(strItemDept))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_department',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strItemDept]}));
		}
		else
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_department',
				operator:search.Operator.ANYOF,
				values:['@NONE@']}));
		}
	
		if(utility.isValueValid(strItemClass))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_class',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strItemClass]}));
		}
		else
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_class',
				operator:search.Operator.ANYOF,
				values:['@NONE@']}));
		}
	
		if(utility.isValueValid(strOrderType))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_ordertype',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strOrderType]}));
		}
		if(utility.isValueValid(strvUnits))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_pick_units',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strvUnits]}));
		}
		if(inventoryStatusFeature==true && utility.isValueValid(invstatusarray))
		{
			pickStratagiesFilters.push(search.createFilter({
				name:'custrecord_wmsse_invstatus',
				operator:search.Operator.ANYOF,
				values:invstatusarray}));
		}
	
		pickStratagiesSearch.filters  = pickStratagiesFilters;
	
		var objPickstrategies = utility.getSearchResultInJSON(pickStratagiesSearch);
		if(objPickstrategies.length > 0)
		{
			var vBinLocStatusArr  = [];
			for(var pickStrategie in objPickstrategies)
			{
	
				var strPickZone= objPickstrategies[pickStrategie]['custrecord_wmsse_pick_zone'];
				var strInvStatus= objPickstrategies[pickStrategie]['custrecord_wmsse_invstatusText'];
				var inclIBStageInvFlag = objPickstrategies[pickStrategie]['custrecord_wmsse_pick_from_stageloc'];
	
				//This is to restrict the display of stage bins at inventroy to bin scan page
				if(utility.isValueValid(boolinclIBStageInvFlag) && ((boolinclIBStageInvFlag == false)||(boolinclIBStageInvFlag == 'false')))
				{
					inclIBStageInvFlag   = false;
				}
				//ends
	
				if(!utility.isValueValid(strPickZone))
				{
					strPickZone="-None-";
				}
	
				if(inclIBStageInvFlag == true && stageLocArr.length == 0)
				{
					var BinlocationSearch =  search.create({
						type:'customlist_wmsse_bin_loc_type',
						columns:[{
							name: 'name'}]
					});
					var	 BinlocationTypes = BinlocationSearch.run().getRange({
						start: 0,
						end: 1000
					});
					if(BinlocationTypes.length > 0)
					{
						var stgTypeArr = [];
						stgTypeArr.push('Stage');
						stageLocArr =utility.getStageLocations(stgTypeArr,BinlocationTypes);
						stageLocArr.push('@NONE@');
					}
				}
				var strPickZoneText= objPickstrategies[pickStrategie]['custrecord_wmsse_pick_zoneText'];
				var pickZoneIndx = vPickZoneArr.indexOf(strPickZone);
				if(utility.isValueValid(strPickZone) && (vPickZoneArr.indexOf(strPickZone)== -1 ||
						(inclIBStageInvFlag == true && inclIBStageInvFlag != inclIBStageInvFlagArr[pickZoneIndx]) ))
				{
					vPickZoneArr.push(strPickZone);
					inclIBStageInvFlagArr.push(inclIBStageInvFlag);
					var vBinIdArr=[];
					var vBinArr=[];
					var vNonStorageBinIdArr = [];
					if(utility.isValueValid(strPickZone)&& strPickZone != '-None-')
					{	
						var objBinByZoneDetails = [];
						if(inclIBStageInvFlag == false)
						{
							objBinByZoneDetails = utility.fnGetBinsbyZones(strPickZone,strLocation);
						}
						else
						{
							objBinByZoneDetails = utility.fnGetBinsbyZonesAlongWithStage(strPickZone,strLocation);
						}
						if(objBinByZoneDetails.length > 0)
						{
	
							for(var bin in objBinByZoneDetails)
							{ 
								vBinIdArr.push(objBinByZoneDetails[bin]['internalid']);
								vBinArr.push(objBinByZoneDetails[bin]['binnumber']);
	
							}
						}
					}
					else if(strPickZone == '-None-')
					{
						if(!inclIBStageInvFlag)
						{
	
							var binSearch = search.load({id:'customsearch_wmsse_non_storagebins'});
							var binFilters = binSearch.filters;
	
							if(utility.isValueValid(strLocation))
							{
								binFilters.push(search.createFilter({name:'location',
									operator:search.Operator.ANYOF,
									values:strLocation}));
							}
	
							binFilters.push(search.createFilter({name:'inactive',
								operator:search.Operator.IS,
								values:false}));
	
							binSearch.filters = binFilters;
	
							objBinByZoneDetails = utility.getSearchResultInJSON(binSearch);
	
							if(objBinByZoneDetails.length > 0)
							{
								for(var j=0;j<objBinByZoneDetails.length;j++)
								{ 
									vNonStorageBinIdArr.push(objBinByZoneDetails[j].id);						 
	
								}
							}
						}
					}
					else
					{
	
					}
	
					var systemRule_AllowExpiredItems=' ';
					systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?',strLocation);
					log.debug({title:'systemRule_AllowExpiredItems',details:systemRule_AllowExpiredItems});
					var filterStrat = [];
					//	systemRule_AllowExpiredItems = 'Y';/////////////////////////////////////delete
					var invstatusid = utility.getStatusId(strInvStatus);
					var objBinDetails = [];
	
					var searchName = 'customsearch_wms_get_invbalance_details';
	
					var inventorySearchDetails = search.load({id:searchName,type:search.Type.INVENTORY_BALANCE});
					var inventorySearchFilters = inventorySearchDetails.filters;
	
					if(utility.isValueValid(strLocation))
					{
						inventorySearchFilters.push(search.createFilter({
							name:'location',
							operator:search.Operator.ANYOF,
							values:strLocation}));
					}
	
					if(utility.isValueValid(getItemInternalId))
					{
						inventorySearchFilters.push(search.createFilter({
							name:'internalid',
							join:'item',
							operator:search.Operator.ANYOF,
							values:getItemInternalId}));
					}
					log.debug({title:'vNonStorageBinIdArr',details:vNonStorageBinIdArr});
					if(utility.isValueValid(vNonStorageBinIdArr))
					{
						inventorySearchFilters.push(search.createFilter({
							name:'binnumber',
							operator:search.Operator.NONEOF,
							values:vNonStorageBinIdArr}));
					}
	
					if((systemRule_AllowExpiredItems == 'N' || systemRule_AllowExpiredItems == '') && (itemType == "lotnumberedinventoryitem" || itemType== "lotnumberedassemblyitem"))
					{
						var currDate = utility.DateStamp();
	
						var dateFormat = utility.DateSetting();
						var defalutExpiryDate  = utility.setExpiryDate(dateFormat,'01','01','2199');
						inventorySearchFilters.push(search.createFilter({
							name:'formuladate',
							operator:search.Operator.ONORAFTER, 
							formula:"NVL({inventorynumber.expirationdate},TO_DATE('"+defalutExpiryDate+"','"+dateFormat+"'))",
							values:currDate}));
	
					}
					if(inventoryStatusFeature)
					{
						if(makeInvAvailFlagFromSelect != null && makeInvAvailFlagFromSelect != '' && makeInvAvailFlagFromSelect != 'null' &&
								makeInvAvailFlagFromSelect != 'undefined' && makeInvAvailFlagFromSelect != undefined )
						{
							if(makeInvAvailFlagFromSelect == 'T' || makeInvAvailFlagFromSelect == 'F')
							{
								inventorySearchFilters.push(search.createFilter({
									name:'inventoryavailable',
									join:'inventorystatus',
									operator:search.Operator.IS,
									values:makeInvAvailFlagFromSelect}));
								if(invstatusid!=null && invstatusid!='' && invstatusid!='undefined')
								{
									inventorySearchFilters.push(search.createFilter({
										name:'status',
										operator:search.Operator.ANYOF,
										values:invstatusid}));
								}
							}
							else
							{
								if(makeInvAvailFlagFromSelect != 'All')
								{
									inventorySearchFilters.push(search.createFilter({
										name:'status',
										operator:search.Operator.ANYOF,
										values:makeInvAvailFlagFromSelect}));
								}
								else
								{
									if(invstatusid!=null && invstatusid!='' && invstatusid!='undefined')
									{
										inventorySearchFilters.push(search.createFilter({
											name:'status',
											operator:search.Operator.ANYOF,
											values:invstatusid}));
									}
									else
									{
										if(strInvStatus=='All Available')
										{
											inventorySearchFilters.push(search.createFilter({
												name:'inventoryavailable',
												join:'inventorystatus',
												operator:search.Operator.ANYOF,
												values:true}));
										}
										else if(strInvStatus=='Not Available')
										{
											inventorySearchFilters.push(search.createFilter({
												name:'inventoryavailable',
												join:'inventorystatus',
												operator:search.Operator.ANYOF,
												values:false}));
										}
									}
								}
	
							}
	
						}
					}
					inventorySearchDetails.filters = inventorySearchFilters;
					objBinDetails = utility.getSearchResultInJSON(inventorySearchDetails);
	
					if(objBinDetails.length >0)
					{
	
						var vValidBinIdArr=[];
						var vValidBinTextArr=[];
						var vValidBinAvailQtyArr=[];
						var vValidBinStatusArr =  [];
						var vValidBinStatusIdArr =  [];
						var vValidBinId='';
						var vValidBin='';
						var vBinQtyAvail='';
						var vBinStatus='';
						var vBinStatusId='';
						var vBinLocStatusArr=[];
						for(var invIterator in objBinDetails)
						{
							log.debug({title:'objBinDetails',details:objBinDetails[invIterator]})
							vValidBinId=objBinDetails[invIterator]['binnumber'];
							if(utility.isValueValid(vValidBinId))
							{
								if((strPickZone == '-None-' || vBinIdArr.indexOf(vValidBinId) != -1)
										&& vBinIntIdExcludeArr.indexOf(vValidBinId) == -1)
								{
									vValidBin=objBinDetails[invIterator]['binnumberText'];
									vBinQtyAvail=objBinDetails[invIterator]['available'];
									vBinStatus=objBinDetails[invIterator]['statusText'];
									vBinStatusId=objBinDetails[invIterator]['status'];
									var binIndex = 	vValidBinIdArr.indexOf(vValidBinId);
	
									if((vValidBinIdArr.indexOf(vValidBinId)==-1) || (vValidBinStatusIdArr[binIndex] != vBinStatusId ))
									{
										vValidBinIdArr.push(vValidBinId);
										vValidBinTextArr.push(vValidBin);
										vValidBinAvailQtyArr.push(vBinQtyAvail);
										vValidBinStatusArr.push(vBinStatus);
										vValidBinStatusIdArr.push(vBinStatusId);
									}
									else
									{
										var binQty = vValidBinAvailQtyArr[binIndex];
										var totalBinAvailableQty = parseFloat(binQty)+parseFloat(vBinQtyAvail);
										vValidBinAvailQtyArr[binIndex] = totalBinAvailableQty;
									}
								}
							}
	
						}
						var objBinwithSeq=[];
						if(vValidBinIdArr.length > 0 && inclIBStageInvFlag == true)
						{
							var binsByPickZoneSearch = search.load({id:'customsearch_wmsse_binsbypickzonenodir'});
							var binFilters = binsByPickZoneSearch.filters;
							binFilters.push(search.createFilter({
								name:'internalid',
								operator:search.Operator.ANYOF,
								values:vValidBinIdArr}));
	
							if(utility.isValueValid(strLocation))
							{
								binFilters.push(search.createFilter({
									name:'location',
									operator:search.Operator.ANYOF,
									values:strLocation}));
							}
	
							binFilters.push(search.createFilter({
								name:'inactive',
								operator:search.Operator.IS,
								values:false}));
	
							if(stageLocArr.length > 0)
							{
								binFilters.push(search.createFilter({
									name:'custrecord_wmsse_bin_loc_type',
									operator:search.Operator.ANYOF,
									values:stageLocArr}));
								binFilters.push(search.createFilter({name:
									'custrecord_wmsse_bin_stg_direction',
									operator:search.Operator.ANYOF,
									values: ['@NONE@','1']}));
							}
	
							binsByPickZoneSearch.filters = binFilters;
	
							objBinwithSeq = utility.getSearchResultInJSON(binsByPickZoneSearch);
	
						}
						else if(vValidBinIdArr.length > 0 && inclIBStageInvFlag == false)
						{
	
							log.debug({title:'vValidBinIdArr',details:vValidBinIdArr});
							var binSearchObj = search.load({id:'customsearch_wmsse_binsbypickzones'});
	
							var binFilters = binSearchObj.filters;
	
							binFilters.push(search.createFilter({
								name:'internalid',
								operator:search.Operator.ANYOF,
								values:vValidBinIdArr}));
	
	
							if(utility.isValueValid(strLocation))
							{
								binFilters.push(search.createFilter({
									name:'location',
									operator:search.Operator.ANYOF,
									values:strLocation}));
							}
	
							binFilters.push(search.createFilter({
								name:'inactive',
								operator:search.Operator.ANYOF,
								values:false}));
	
							binSearchObj.filters = binFilters;
	
							objBinwithSeq =  utility.getSearchResultInJSON(binSearchObj);
	
						}
						var strPickZone = strPickZoneText;
						if(objBinwithSeq.length > 0)
						{
							for(var objItr=0;objItr<objBinwithSeq.length ;objItr++)
							{
								var vValidBinId=objBinwithSeq[objItr]['internalid'];								
								if(!utility.isValueValid(strPickZone))
								{
									strPickZoneText=objBinwithSeq[objItr]['custrecord_wmsse_zoneText'];
	
								}
								var wmsAisle= objBinwithSeq[objItr]['custrecord_wmsse_aisle'];
								var wmsLevel= objBinwithSeq[objItr]['custrecord_wmsse_level'];
								for(var binItr=0;binItr<vValidBinIdArr.length;binItr++)
								{
									var bin = vValidBinIdArr[binItr];
									var status = vValidBinStatusIdArr[binItr];
									var vValidBinStatus =  vValidBinStatusArr[binItr];									
									var vValidBinStatusId = vValidBinStatusIdArr[binItr];
	
									if(vValidBinId!= null && vValidBinId!= '' && vValidBinId == bin  )
									{
										if(vValidBinIdArr.indexOf(vValidBinId) != -1)
										{
											var vValidBin = vValidBinTextArr[binItr];
											var vBinQtyAvail = vValidBinAvailQtyArr[binItr];
	
											var vValidBinStatus =  vValidBinStatusArr[binItr];	
	
											vBinQtyAvail = parseFloat(vBinQtyAvail);
											if(parseFloat(vBinQtyAvail) > 0)
											{
												if(vValidBin != getPreferBin && vValidBinId != getPreferBinId)
												{			
													if(utility.isValueValid(selectedConversionRate) && utility.isValueValid(currentConversionRate))
													{
														vBinQtyAvail = utility.uomConversions(vBinQtyAvail,selectedConversionRate,currentConversionRate);
													}
													vBinIntIdExcludeArr.push(vValidBinId);
													var currRow ={'binnumber':vValidBin,'availableqty':vBinQtyAvail,'bininternalid':vValidBinId,'zone':strPickZoneText,'status':vValidBinStatus,'itemName' : itemName,
															'wmsaisle' : wmsAisle,  'wmslevel':wmsLevel};
													vBinLocArr.push(currRow);
												}
											}
										}	
									}
								}
							}
						}
	
					}	
				}	
			}
		}
		return vBinLocArr;
	}*/

		function getOPenTaskPickBinDetails(itemInternalId, binInternalId, warehouseLocationId, inventoryNumber, statusInternalId, serialName, inventoryStatusFeature, itemType, inventoryDetailLotOrSerialText) {
			var openTaskSearch = search.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: 'customsearch_wms_opentask_pickbindetails'
			});//customsearch_wmsse_opentask_pickdetails
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_sku',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));

			if (utility.isValueValid(binInternalId)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_actendloc',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_wms_location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));

			if (utility.isValueValid(inventoryNumber)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_batch_num',
					operator: search.Operator.CONTAINS,
					values: inventoryNumber
				}));//custrecord_wmsse_serial_no
			}

			if (utility.isValueValid(serialName)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_serial_no',
					operator: search.Operator.CONTAINS,
					values: serialName
				}));
			}
			if (inventoryStatusFeature) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_inventorystatus',
					operator: search.Operator.ANYOF,
					values: statusInternalId
				}));
			}
			if (utility.isValueValid(inventoryDetailLotOrSerialText)) {
				if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
					openTaskSearch.filters.push(search.createFilter({
						name: 'custrecord_wmsse_batch_num',
						operator: search.Operator.CONTAINS,
						values: inventoryDetailLotOrSerialText
					}));
				} else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
					openTaskSearch.filters.push(search.createFilter({
						name: 'custrecord_wmsse_serial_no',
						operator: search.Operator.CONTAINS,
						values: inventoryDetailLotOrSerialText
					}));
				}
			}
			var openTaskDetails = utility.getSearchResultInJSON(openTaskSearch);
			log.debug('openTaskDetails', openTaskDetails);
			return openTaskDetails;
		}

		function getInventoryBalance(itemInternalId, binInternalId, warehouseLocationId, inventoryNumber, status, itemType, locUseBinsFlag) {
			var invBalanceSearch = '';
			if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
				invBalanceSearch = search.load({
					type: search.Type.INVENTORY_BALANCE,
					id: 'customsearch_wms_get_invbalance_details'
				});//customsearch_wms_get_invbal_stat_details
			} else {

				invBalanceSearch = search.load({
					type: search.Type.INVENTORY_BALANCE,
					id: 'customsearch_wms_wo_invbal_inv_lot_exp'
				});//customsearch_wms_get_invbal_stat_details
			}
			if (locUseBinsFlag == true) {
				invBalanceSearch.filters.push(search.createFilter({
					name: 'location',
					join: 'binnumber',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));

				if (utility.isValueValid(binInternalId)) {
					invBalanceSearch.filters.push(search.createFilter({
						name: 'binnumber',
						operator: search.Operator.IS,
						values: binInternalId
					}));
				}
			}
			else {
				invBalanceSearch.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}
			invBalanceSearch.filters.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));

			if (utility.isValueValid(status)) {
				invBalanceSearch.filters.push(search.createFilter({
					name: 'status',
					operator: search.Operator.ANYOF,
					values: status
				}));
			}

			if (utility.isValueValid(inventoryNumber)) {
				invBalanceSearch.filters.push(search.createFilter({
					name: 'inventorynumber',
					join: 'inventorynumber',
					operator: search.Operator.IS,
					values: inventoryNumber
				}));
			}

			invBalanceResults = utility.getSearchResultInJSON(invBalanceSearch);
			log.debug('invBalanceResults', invBalanceResults);
			return invBalanceResults;
		}

		//commented by Raghu not required please check if any body needs this function
		/*function getWOLineDetailsNew(transactionName, warehouseLocationId, itemInternalId, transactionLineNo){
			var WOLineDetialsSearch = search.load('customsearch_wmsse_wo_item_srh');
			WOLineDetialsSearch.filters.push(search.createFilter({
				name : 'tranid',
				operator : search.Operator.IS,
				values : transactionName
			}));
			if(utility.isValueValid(itemInternalId)){
			WOLineDetialsSearch.filters.push(search.createFilter({
				name : 'item',
				operator : search.Operator.ANYOF,
				values : itemInternalId
			}));
			}
			if(utility.isValueValid(transactionLineNo)){
			WOLineDetialsSearch.filters.push(search.createFilter({
				name : 'line',
				operator : search.Operator.EQUALTO,
				values : transactionLineNo
			}));
			}
	
			WOLineDetialsSearch.filters.push(search.createFilter({
				name : 'location',
				operator : search.Operator.ANYOF,
				values : warehouseLocationId
			}));
	
			var WOLineDetials = utility.getSearchResultInJSON(WOLineDetialsSearch);
			log.debug('WOLineDetials',WOLineDetials);
			return WOLineDetials;
		}*/

		//commented by Raghu not required please check if any body needs this function
		/*function getopentaskDetailsforSku(transactionInternalId, transactionLineNo, itemInternalId, status){
			var openTaskSearch = search.load('customsearch_wmsse_opentaskpickqtysearch');
			if(utility.isValueValid(transactionLineNo)){
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_line_no',
				operator : search.Operator.EQUALTO,
				values : transactionLineNo
			}));
			}
			if(utility.isValueValid(itemInternalId)){
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_sku',
				operator : search.Operator.ANYOF,
				values : itemInternalId
			}));
			}
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_order_no',
				operator : search.Operator.ANYOF,
				values : transactionInternalId
			}));
	
			if(utility.isValueValid(status)){
				openTaskSearch.filters.push(search.createFilter({
					name : 'custrecord_wmsse_inventorystatus',
					operator : search.Operator.ANYOF,
					values : status
				}));
			}
			var openTaskResults = utility.getSearchResultInJSON(openTaskSearch);
			log.debug('openTaskResults',openTaskResults);
			return openTaskResults;
		}*/

		function createOpenTaskForWorkOrder(openTaskObj) {
			log.debug('openTaskObj step1', openTaskObj);
			var warehouseLocationId = openTaskObj['warehouseLocationId'];
			var transactionName = openTaskObj['transactionName'];
			var itemInternalId = openTaskObj['itemInternalId'];
			var transactionLineNo = openTaskObj["transactionLineNo"];
			var transactionInternalId = openTaskObj["transactionInternalId"];
			var status = openTaskObj["status"];
			var scannedQuantity = openTaskObj["scannedQuantity"];
			var toBinInternalId = openTaskObj["toBinInternalId"];
			var binInternalId = openTaskObj["binInternalId"];
			var itemType = openTaskObj["itemType"];
			var transactionType = openTaskObj["transactionType"];
			var taskType = openTaskObj["taskType"];
			var transactionUomName = openTaskObj["transactionUomName"];
			var conversionRate = openTaskObj["conversionRate"];
			var actualBeginTime = openTaskObj["actualBeginTime"];
			var inventoryNumber = openTaskObj["inventoryNumber"];
			var lotExpiryDate = openTaskObj["lotExpiryDate"];
			var processType = openTaskObj['processType'];
			var openTask_statusFlag = openTaskObj['openTask_statusFlag'];
			var openTask_taskType = openTaskObj['openTask_taskType'];
			var opentTask_NSConfirmationRefNo = openTaskObj['opentTask_NSConfirmationRefNo'];
			var lotInternalId = openTaskObj['lotInternalId'];
			var openTaskTransactionRefNo = openTaskObj['openTaskTransactionRefNo'];
			var expectedQuantity = openTaskObj['remainingQuantity'];

			var fifoDate = '';
			var serialArray = '';

			var OpenTaskRecId = '';
			try {
				var openTaskRecord = record.create({
					type: 'customrecord_wmsse_trn_opentask'

				});

				var currDate = utility.DateStamp();
				var parsedCurrentDate = format.parse({
					value: currDate,
					type: format.Type.DATE
				});

				var parsedPickDate = format.parse({
					value: new Date(),
					type: format.Type.DATE
				});

				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_act_begin_date', value: parsedCurrentDate });
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_act_end_date', value: parsedCurrentDate });
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_act_qty', value: scannedQuantity });
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_sku', value: itemInternalId });
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_line_no', value: transactionLineNo });
				if (utility.isValueValid(expectedQuantity)) {
					if (expectedQuantity < 0)
						expectedQuantity = 0;

					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_expe_qty', value: expectedQuantity });
				}
				else {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_expe_qty', value: scannedQuantity });
				}

				if (utility.isValueValid(binInternalId)) {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_actbeginloc', value: binInternalId });
				}
				if (utility.isValueValid(toBinInternalId)) {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_actendloc', value: toBinInternalId });
				}
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_order_no', value: transactionInternalId });
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_wms_location', value: warehouseLocationId });
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_parent_sku_no', value: itemInternalId });
				if (utility.isValueValid(transactionInternalId)) {
					openTaskRecord.setValue({ fieldId: 'name', value: transactionInternalId });
				}
				if (utility.isValueValid(transactionUomName)) {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_uom', value: transactionUomName });
				}
				if (utility.isValueValid(conversionRate)) {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_conversionrate', value: parseFloat(conversionRate) });
				}
				var currentUserID = runtime.getCurrentUser();
				openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_upd_user_no', value: currentUserID.id });
				if (taskType == 'PICK') {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_wms_status_flag', value: 8 });
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_tasktype', value: 3 });
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_pick_comp_date', value: parsedPickDate });
				}
				else {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_wms_status_flag', value: openTask_statusFlag });
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_tasktype', value: openTask_taskType });
				}
				if (utility.isValueValid(opentTask_NSConfirmationRefNo)) {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_nsconfirm_ref_no', value: opentTask_NSConfirmationRefNo });
				}
				// no staging and no bintransferId for noninv item,so to avoid restriction in WO assembly build process updating with WO order id
				if (utility.isValueValid(openTaskTransactionRefNo)) {
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_nstrn_ref_no', value: openTaskTransactionRefNo });
				}

				if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {

					if (utility.isValueValid(inventoryNumber) && !utility.isValueValid(lotInternalId))
						lotInternalId = utility.inventoryNumberInternalId(inventoryNumber, warehouseLocationId, itemInternalId);
					if (utility.isValueValid(inventoryNumber)) {
						openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_batch_num', value: inventoryNumber });
						openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_batch_no', value: lotInternalId });
					}
					if (utility.isValueValid(lotExpiryDate)) {
						var parsedCurrentDate = format.parse({
							value: lotExpiryDate,
							type: format.Type.DATE
						});
						openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_expirydate', value: parsedCurrentDate });
					}
					else {
						/*if(utility.isValueValid(inventoryNumber) && !utility.isValueValid(lotInternalId))
						lotInternalId = utility.getLotInternalId(inventoryNumber);*/
						if (utility.isValueValid(lotInternalId)) {
							var lotLookUp = search.lookupFields({
								type: search.Type.INVENTORY_NUMBER,
								id: lotInternalId,
								columns: ['inventorynumber', 'expirationdate']
							});
							var vexpiryDate = lotLookUp.expirationdate;
							var parsedExpiryDate = null;
							if (utility.isValueValid(vexpiryDate)) {
								parsedExpiryDate = format.parse({
									value: vexpiryDate,
									type: format.Type.DATE
								});
							}
							if (utility.isValueValid(parsedExpiryDate)) {
								openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_expirydate', value: parsedExpiryDate });
							}
						}
					}
					if (utility.isValueValid(fifoDate)) {
						var parsedFifoDate = format.parse({
							value: fifoDate,
							type: format.Type.DATE
						});
						openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_fifodate', value: fifoDate });
					}
				}

				if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {

					serialArray = updateOpenTaskSerial(transactionLineNo, transactionInternalId, warehouseLocationId, itemInternalId, taskType);

					log.debug({ title: 'Serial Array :', details: serialArray });

					if (utility.isValueValid(serialArray.serialNumArray)) {
						openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_serial_no', value: serialArray.serialNumArray });
					}
					if ((utility.isValueValid(serialArray.serialInternalIdArray)) && taskType == 'PICK') {
						openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_multi_bins', value: serialArray.serialInternalIdArray });
					}
				}
				if (utility.isValueValid(actualBeginTime)) {
					var parsedBeginTime = parseTimeString(actualBeginTime);
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_actualbegintime', value: parsedBeginTime });
				}
				var timeStamp = utility.getCurrentTimeStamp();
				if (utility.isValueValid(timeStamp)) {
					var timeString = parseTimeString(timeStamp);
					log.debug('timeString step2', timeString);
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_actualendtime', value: timeString });
				}
				if (utility.isValueValid(status))
					openTaskRecord.setValue({ fieldId: 'custrecord_wmsse_inventorystatus', value: status });

				OpenTaskRecId = openTaskRecord.save();

			}
			catch (e) {
				OpenTaskRecId = 'INVALID_KEY_OR_REF';
				log.debug('e', e);
			}
			return OpenTaskRecId;
		}

		function updateOpenTaskSerial(transactionLineNo, transactionInternalId, warehouseLocationId, itemInternalId, taskType) {
			var serialResults = {};
			var serialArray = '';
			var serialInternalIdArray = '';
			var serialSearch = search.load({
				id: 'customsearch_wmsse_wo_serialentry_srh',
			});
			var serailFilters = serialSearch.filters;
			if (utility.isValueValid(transactionLineNo))
				serailFilters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordline',
					operator: search.Operator.EQUALTO,
					values: transactionLineNo
				}));
			serailFilters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_ordno',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));

			serialSearch.filters = serailFilters;
			var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
			if (serialSearchResults != null && serialSearchResults != "" && serialSearchResults != 'null' && serialSearchResults.length > 0) {

				for (var n = 0; n < serialSearchResults.length; n++) {
					var openTaskSerialInternalId = '';
					var serialNumber = serialSearchResults[n]['custrecord_wmsse_ser_no'];
					if (taskType == 'PICK')
						openTaskSerialInternalId = utility.inventoryNumberInternalId(serialNumber, warehouseLocationId, itemInternalId);
					if (serialArray == null || serialArray == '') {
						serialArray = serialSearchResults[n]['custrecord_wmsse_ser_no'];
						if (taskType == 'PICK')
							serialInternalIdArray = openTaskSerialInternalId;
					}
					else {
						serialArray = serialArray + "," + serialSearchResults[n]['custrecord_wmsse_ser_no'];
						if (taskType == 'PICK')
							serialInternalIdArray = serialInternalIdArray + "," + openTaskSerialInternalId;
					}
				}
				for (var j = 0; j < serialSearchResults.length; j++) {
					var TempRecord = serialSearchResults[j];
					var serialRec = record.load({
						type: 'customrecord_wmsse_serialentry',
						id: serialSearchResults[j].id,
						isDynamic: true
					});
					serialRec.setValue({ fieldId: 'id', value: TempRecord.id });
					serialRec.setValue({ fieldId: 'name', value: TempRecord.name });
					serialRec.setValue({
						fieldId: 'custrecord_wmsse_ser_note1',
						value: 'because of serial number is updated in opentask we have marked this serial number as closed'
					});
					serialRec.setValue({ fieldId: 'custrecord_wmsse_ser_status', value: true });
					serialRec.save();
				}

			}
			serialResults['serialNumArray'] = serialArray;
			serialResults['serialInternalIdArray'] = serialInternalIdArray;
			log.debug('serialResults', serialResults);
			return serialResults;
		}

		function parseTimeString(time) {

			if (time == null || time == '') {
				var date = new convertDate();
				return date;
			}

			var timeStamp = format.parse({ value: time, type: format.Type.TIMEOFDAY });
			log.debug({ title: 'parseTimeString timestamp', details: timeStamp });
			return timeStamp;
		}

		function getbasicItemDetails(getItem, warehouseLocationId) {
			var itemSearchDetails = search.load({
				id: 'customsearch_wmsse_inv_basic_itemdetails'
			});
			var filtersArr = itemSearchDetails.filters;
			filtersArr.push(
				search.createFilter({
					name: 'nameinternal',
					operator: search.Operator.IS,
					values: getItem
				}));
			if (utility.isValueValid(warehouseLocationId)) {
				filtersArr.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: ['@NONE@', warehouseLocationId]
					}));
			}

			itemSearchDetails.filters = filtersArr;
			var itemesults = utility.getSearchResultInJSON(itemSearchDetails);
			return itemesults;
		}

		function validateStageBin(picktaskObj) {
			var stageBinId = '';
			var binName = picktaskObj['binName'];
			var warehouseLocationId = picktaskObj['warehouseLocationId'];

			var binlocationSearch = search.load({
				id: 'customsearch_wmsse_wo_stagescan_bin'
			});
			var binFilters = binlocationSearch.filters;
			if (utility.isValueValid(warehouseLocationId)) {
				binFilters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}
			binFilters.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.IS,
				values: binName
			}));
			binFilters.push(search.createFilter({
				name: 'type',
				operator: search.Operator.ANYOF,
				values: 'WIP'
			}));

			if (picktaskObj.workorderOverpickingFlag) {
				binFilters.push(search.createFilter({
					name: 'custrecord_wms_mfg_picking',
					operator: search.Operator.IS,
					values: true
				}));
			}

			binlocationSearch.filters = binFilters;
			var binRecord = utility.getSearchResultInJSON(binlocationSearch);
			log.debug({ title: 'binRecord', details: binRecord });
			if (binRecord.length > 0) {
				var stageBinId1 = binRecord[0]['internalid'];
				stageBinId = binRecord[0]['id'];
			}
			log.debug({ title: 'stageBinId', details: stageBinId });

			return stageBinId;

		}

		function woBinTransfer(invtransferObj, binTransfer) {
			var binTransferFlag = true;
			log.debug({ title: 'invtransferObj in WO', details: invtransferObj });
			var vnWoInternalId = invtransferObj['woInternalId'];
			var itemType = invtransferObj['itemType'];
			var warehouseLocationId = invtransferObj['warehouseLocationId'];
			var itemId = invtransferObj['itemId'];
			var quantity = invtransferObj['quantity'];
			var fromBinId = invtransferObj['fromBinId'];
			var toBinId = invtransferObj['toBinId'];
			var batchno = invtransferObj['batchNum'];
			var vnSerialNum = invtransferObj['serialNum'];
			var workOrderId = invtransferObj['transactionName'];
			var vInvStatus = invtransferObj['statusInternalId'];
			var inventoryStatusFeature = invtransferObj['inventoryStatusFeature'];
			try {

				if (vInvStatus != undefined && vInvStatus != null && vInvStatus != 'null' && vInvStatus != "") {
					vInvStatus = vInvStatus.toString();
				}
				var batchnoArr = [];
				var statusArr = [];
				var quantityArr = [];
				var lotArrr = [];
				binTransfer.setValue({
					fieldId: 'location',
					value: warehouseLocationId
				});
				var currDate = utility.DateStamp();
				var parsedCurrentDate = format.parse({
					value: currDate,
					type: format.Type.DATE
				});
				binTransfer.setValue({
					fieldId: 'memo',
					value: workOrderId
				});
				binTransfer.selectNewLine({
					sublistId: 'inventory',
				});
				binTransfer.setCurrentSublistValue({
					sublistId: 'inventory',
					fieldId: 'item',
					value: itemId
				});
				binTransfer.setCurrentSublistValue({
					sublistId: 'inventory',
					fieldId: 'quantity',
					value: quantity
				});
				if (itemType == "inventoryitem" || itemType == "assemblyitem") {
					var compSubRecord = binTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					compSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: quantity });
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'binnumber',
						value: fromBinId
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'tobinnumber',
						value: toBinId
					});
					if (inventoryStatusFeature) {
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: vInvStatus
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'toinventorystatus',
							value: vInvStatus
						});
					}
					compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
				}
				else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
					var compSubRecord = binTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: quantity
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'receiptinventorynumber',
						value: batchno
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'binnumber',
						value: fromBinId
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'tobinnumber',
						value: toBinId
					});
					if (inventoryStatusFeature) {
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: vInvStatus
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'toinventorystatus',
							value: vInvStatus
						});
					}
					compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
				}
				else {
					var serialNumArray = vnSerialNum.split(',');


					var compSubRecord = binTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					for (var n = 0; n < serialNumArray.length; n++) {
						compSubRecord.selectNewLine({
							sublistId: 'inventoryassignment'
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'quantity',
							value: 1
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'receiptinventorynumber',
							value: serialNumArray[n]
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: fromBinId
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'tobinnumber',
							value: toBinId
						});
						if (inventoryStatusFeature) {
							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'inventorystatus',
								value: vInvStatus
							});
							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'toinventorystatus',
								value: vInvStatus
							});
						}
						compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
					}
				}
				binTransfer.commitLine({ sublistId: 'inventory' });

			} catch (e) {
				binTransferFlag = false;
				log.debug('e', e);
			}
			return binTransferFlag;
		}

		function updateMoveOpenTask(opentaskObj) {
			var itemType = opentaskObj['itemType'];
			var whLocation = opentaskObj['warehouseLocationId'];
			var itemId = opentaskObj['itemId'];
			var quantity = opentaskObj['quantity'];
			var fromBinId = opentaskObj['fromBinId'];
			var toBinId = opentaskObj['toBinId'];
			var batchno = opentaskObj['batchno'];
			var inventoryCountId = opentaskObj['inventoryCountId'];
			var taskType = opentaskObj['taskType'];
			var actwhLocation = opentaskObj['actwhLocation'];
			var soInternalId = opentaskObj['soInternalId'];
			var actualBeginTime = opentaskObj['actualBeginTime'];
			var units = opentaskObj['units'];
			var stockConversionRate = opentaskObj['stockConversionRate'];
			var fromStatus = opentaskObj['fromStatus'];
			var toStatus = opentaskObj['toStatus'];
			var customrecord = record.create({ type: 'customrecord_wmsse_trn_opentask' });
			if (utility.isValueValid(inventoryCountId)) {
				customrecord.setValue({ fieldId: 'name', value: inventoryCountId });
			}
			var currDate = utility.DateStamp();
			var parsedCurrentDate = format.parse({
				value: currDate,
				type: format.Type.DATE
			});
			customrecord.setValue({ fieldId: 'custrecord_wmsse_act_begin_date', value: parsedCurrentDate });
			customrecord.setValue({ fieldId: 'custrecord_wmsse_act_end_date', value: parsedCurrentDate });
			customrecord.setValue({ fieldId: 'custrecord_wmsse_act_qty', value: quantity });
			customrecord.setValue({ fieldId: 'custrecord_wmsse_expe_qty', value: quantity });
			//if(taskType=="MOVE")
			customrecord.setValue({ fieldId: 'custrecord_wmsse_wms_status_flag', value: 19 });//storage
			customrecord.setValue({ fieldId: 'custrecord_wmsse_tasktype', value: 9 }); //For MOVE
			if (utility.isValueValid(soInternalId)) {
				customrecord.setValue({ fieldId: 'custrecord_wmsse_order_no', value: soInternalId });
			}
			if (utility.isValueValid(units)) {
				customrecord.setValue({ fieldId: 'custrecord_wmsse_uom', value: units });
			}
			if (utility.isValueValid(stockConversionRate)) {
				customrecord.setValue({ fieldId: 'custrecord_wmsse_conversionrate', value: stockConversionRate });
			}
			customrecord.setValue({ fieldId: 'custrecord_wmsse_actbeginloc', value: fromBinId });
			customrecord.setValue({ fieldId: 'custrecord_wmsse_actendloc', value: toBinId });
			if (itemType == translator.getTranslationString("ITEMTYPE_LOT") ||
				itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
				if (utility.isValueValid(batchno)) {
					customrecord.setValue({ fieldId: 'custrecord_wmsse_batch_num', value: batchno });
				}
			}
			log.debug({ title: 'actualBeginTime', details: actualBeginTime });
			if (utility.isValueValid(actualBeginTime)) {
				var parsedBeginTime = parseTimeString(actualBeginTime);
				customrecord.setValue({ fieldId: 'custrecord_wmsse_actualbegintime', value: parsedBeginTime });
			}

			var timeStamp = utility.getCurrentTimeStamp();
			if (utility.isValueValid(timeStamp)) {
				var timeString = parseTimeString(timeStamp);
				log.debug('timeString step2', timeString);
				customrecord.setValue({ fieldId: 'custrecord_wmsse_actualendtime', value: timeString });
			}
			customrecord.setValue({ fieldId: 'custrecord_wmsse_wms_location', value: whLocation });
			customrecord.setValue({ fieldId: 'custrecord_wmsse_parent_sku_no', value: itemId });
			if (utility.isValueValid(inventoryCountId) && taskType != "XFER") {
				customrecord.setValue({ fieldId: 'custrecord_wmsse_nsconfirm_ref_no', value: inventoryCountId });
			}
			if (utility.isValueValid(fromStatus)) {
				customrecord.setValue({ fieldId: 'custrecord_wmsse_inventorystatus', value: fromStatus });
			}
			if (utility.isValueValid(toStatus)) {
				customrecord.setValue({ fieldId: 'custrecord_wmsse_inventorystatusto', value: toStatus });
			}
			var currentUserID = runtime.getCurrentUser();
			customrecord.setValue({ fieldId: 'custrecord_wmsse_upd_user_no', value: currentUserID.id });
			var recid = customrecord.save();
			return recid;

		}

		function getStagedTaskDetails(stageTaskDetails) {
			var getOrderInternalId = stageTaskDetails['orderInternalId'];
			var warehouseLocationId = stageTaskDetails["whLocationId"];
			var stageBinInternalId = stageTaskDetails["stageBinInternalId"];

			log.debug({ title: 'stageTaskDetails', details: stageTaskDetails });
			var openTaskSearch = search.load({ id: 'customsearch_wms_wo_comp_stagedetails' });
			var openTaskFilters = openTaskSearch.filters;
			if (utility.isValueValid(getOrderInternalId)) {
				openTaskFilters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: getOrderInternalId
				}))
			}

			if (utility.isValueValid(warehouseLocationId)) {
				openTaskFilters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', warehouseLocationId]
				}));
			}
			if (utility.isValueValid(stageBinInternalId)) {
				openTaskFilters.push(search.createFilter({
					name: 'custrecord_wmsse_actendloc',
					operator: search.Operator.ANYOF,
					values: stageBinInternalId
				}));
			}

			openTaskSearch.filters = openTaskFilters;
			var objopentaskSearchDetails = utility.getSearchResultInJSON(openTaskSearch);
			log.debug({ title: 'objopentaskSearchDetails', details: objopentaskSearchDetails });
			return objopentaskSearchDetails;
		}

		function getSerialEntry(serialName, itemInternalId, taskType) {
			var serialSearch = search.load({ type: 'customrecord_wmsse_serialentry', id: 'customsearch_wmsse_serialdetails_search' });

			if (utility.isValueValid(serialName)) {
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_no',
					operator: search.Operator.IS,
					values: serialName
				}));
			}

			if (utility.isValueValid(itemInternalId)) {
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_item',
					operator: search.Operator.ANYOF,
					values: itemInternalId
				}));
			}

			if (utility.isValueValid(taskType)) {
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_tasktype',
					operator: search.Operator.ANYOF,
					values: taskType //9
				}));
			}

			serialSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_status',
				operator: search.Operator.IS,
				values: false
			}));


			var serialSearchRes = utility.getSearchResultInJSON(serialSearch);
			return serialSearchRes;
		}

		function createSerialEntries(transactionName, transactionInternalId, transactionLineNo, itemInternalId, serialName, tasktype) {
			var objRecord = record.create({
				type: 'customrecord_wmsse_serialentry',
			});

			objRecord.setValue({
				fieldId: 'name',
				value: transactionName
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordno',
				value: transactionInternalId
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_ordline',
				value: transactionLineNo
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_item',
				value: itemInternalId
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_qty',
				value: 1
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_no',
				value: serialName
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_status',
				value: false
			});
			objRecord.setValue({
				fieldId: 'custrecord_wmsse_ser_tasktype',
				value: tasktype //9
			});

			var id = objRecord.save();
			return id;
		}

		function showNextPickTaskButton(transactionName, warehouseLocationId, transactionInternalId, workorderOverpickingFlag) {
			var vwoitemQty = 0;
			var vwoitemRcvQty = 0;
			var pickedQty = 0;
			var itemRemQty = 0;
			var inputParamObj = {};
			var nextPickTaskFlag = false;
			var nextPickTaskFlagForOverpicking = false;
			inputParamObj.whLocation = warehouseLocationId;
			inputParamObj.transactionName = transactionName;
			//Getting Work Order Details to get quantity sum up
			var woItemListResults = getWOLineItemList(inputParamObj);
			var locUseBinsFlag = utility.lookupOnLocationForUseBins(warehouseLocationId);

			if (utility.isValueValid(woItemListResults) && woItemListResults.length > 0) {
				log.debug({ title: 'woItemListResults Results :', details: woItemListResults.length });
				for (var itemListIndex = 0; itemListIndex < woItemListResults.length; itemListIndex++) {

					var vnitemType = woItemListResults[itemListIndex]['Type'];

					if (!(locUseBinsFlag == true && woItemListResults[itemListIndex]['usebins'] == false &&
						woItemListResults[itemListIndex]['Type'] == 'InvtPart')) {

						if (vnitemType == "NonInvtPart" || vnitemType == "OthCharge" || vnitemType == "Service" || vnitemType == "DwnLdItem" || vnitemType == "GiftCert") {
							vwoitemQty = Number(Big(vwoitemQty).plus(woItemListResults[itemListIndex]['quantity']));
						} else {
							var committedQty = woItemListResults[itemListIndex]['Committed Quantity'];
							if (committedQty == null || committedQty == '' || committedQty == undefined || isNaN(committedQty))
								committedQty = 0;
							committedQty = new Big(committedQty);
							vwoitemQty = Number(Big(vwoitemQty).plus(committedQty));
							vwoitemRcvQty = Number(Big(vwoitemRcvQty).plus(woItemListResults[itemListIndex]['Built Quantity']));
						}
					}
				}

				//getting open task qty details
				var openTaskQtyRes = getWOpickQty(transactionInternalId);
				if (utility.isValueValid(openTaskQtyRes) && openTaskQtyRes.length > 0) {
					log.debug({ title: 'openTaskQtyRes Results :', details: openTaskQtyRes });
					var pickedQty = utility.isValueValid(openTaskQtyRes[0]['custrecord_wmsse_act_qty']) ? openTaskQtyRes[0]['custrecord_wmsse_act_qty'] : 0;
				}

				vwoitemRcvQty = new Big(vwoitemRcvQty);
				pickedQty = new Big(pickedQty);

				vwoitemQty = parseFloat(vwoitemQty).toFixed(8);
				vwoitemRcvQty = parseFloat(vwoitemRcvQty).toFixed(8);
				pickedQty = parseFloat(pickedQty).toFixed(8);
				if (utility.isValueValid(vwoitemQty) && utility.isValueValid(vwoitemRcvQty) && utility.isValueValid(pickedQty)) {
					itemRemQty = Number((Big(vwoitemQty).plus(vwoitemRcvQty)).minus(pickedQty));
				} else {
					itemRemQty = 0;
				}
				if (workorderOverpickingFlag) {
					nextPickTaskFlagForOverpicking = nextPickTaskCheckForWOoverpicking(transactionInternalId, woItemListResults);

				}
				log.debug({ title: 'itemRemQty :', details: itemRemQty });
				if ((itemRemQty > 0) || (workorderOverpickingFlag && nextPickTaskFlagForOverpicking)) {
					var nextPickTaskFlag = true;
				}
			}
			return nextPickTaskFlag;
		}

		function getWOStageflag(transactionInternalId) {
			var gotoStageSearch = search.load({
				id: 'customsearch_wms_wo_goto_stagecheck'
			});

			gotoStageSearch.filters.push(
				search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: transactionInternalId
				})
			);

			var opentaskResults = utility.getSearchResultInJSON(gotoStageSearch);
			log.debug('opentaskResults', opentaskResults);
			return opentaskResults;
		}

		function isInventoryTypeItem(itemType) {
			if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"
				|| itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem"
				|| itemType == "inventoryitem" || itemType == "assemblyitem") {
				return true;
			}
			return false;
		}

		function getOpenTaskSerialEntries(itemInternalId, binInternalId, warehouseLocationId, status, inventoryDetailLotOrSerialText) {
			var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
			var openTaskSearch = search.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: 'customsearch_wms_opentask_serial_dtl'
			});

			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_sku',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));

			if (utility.isValueValid(binInternalId)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_actendloc',
					operator: search.Operator.ANYOF,
					values: binInternalId
				}));
			}

			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_wms_location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));

			if (utility.isValueValid(inventoryDetailLotOrSerialText)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_serial_no',
					operator: search.Operator.CONTAINS,
					values: inventoryDetailLotOrSerialText
				}));

			}

			var openTaskDetails = utility.getSearchResultInJSON(openTaskSearch);
			log.debug('openTaskDetails', openTaskDetails);
			return openTaskDetails;
		}

		function validateItemForAssembly(warehouseLocationId, itemInternalId, itemName, itemBins) {

			var itemSearch = search.load({
				type: 'item',
				id: 'customsearch_wms_wo_assembly_item_valid'
			});

			itemSearch.filters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));

			itemSearch.filters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: itemName
			}));

			itemSearch.filters.push(search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			}));

			if (utility.isValueValid(itemBins) && itemBins == 'Bins') {
				itemSearch.filters.push(search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					join: 'binnumber',
					values: warehouseLocationId
				}));
			}

			var itemDetails = utility.getSearchResultInJSON(itemSearch);
			log.debug('itemDetails :', itemDetails);
			return itemDetails;
		}


		function getOpenTaskDtlForAssembly(warehouseLocationId, transactionInternalId, locUseBinsFlag) {
			const openTaskItemQtyQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});
			var statusFlagCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});
			var locationCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_location',
				operator: query.Operator.ANY_OF,
				values: warehouseLocationId
			});
			var inActiveCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});

			var orderInternalIdCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: transactionInternalId
			});

			var confirmationRefCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: query.Operator.EMPTY
			});
			if (locUseBinsFlag == false) {
				openTaskItemQtyQuery.condition = openTaskItemQtyQuery.and(
					statusFlagCondition, locationCondition, inActiveCondition, orderInternalIdCondition,
					confirmationRefCondition);
			} else {
				var transactionRefCondition = openTaskItemQtyQuery.createCondition({
					fieldId: 'custrecord_wmsse_nstrn_ref_no',
					operator: query.Operator.EMPTY_NOT
				});
				openTaskItemQtyQuery.condition = openTaskItemQtyQuery.and(
					statusFlagCondition, locationCondition, inActiveCondition, orderInternalIdCondition,
					confirmationRefCondition, transactionRefCondition);
			}

			openTaskItemQtyQuery.columns = [
				openTaskItemQtyQuery.createColumn({
					fieldId: 'custrecord_wmsse_line_no',
					groupBy: true
				}),
				openTaskItemQtyQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty',
					aggregate: query.Aggregate.SUM
				}),
				openTaskItemQtyQuery.createColumn({
					fieldId: 'custrecord_wmsse_sku',
					groupBy: true
				}),
				openTaskItemQtyQuery.createColumn({
					fieldId: 'custrecord_wmsse_conversionrate',
					groupBy: true
				}),
			];

			var myPagedData = openTaskItemQtyQuery.runPaged({
				pageSize: 1000
			});

			return getQueryResults(myPagedData);
		}

		function getTransactionDtlForAssembly(warehouseLocationId, transactionInternalId) {

			var transactionSearch = search.load({
				type: 'workorder',
				id: 'customsearch_wms_wo_assembly_trnsctn_dtl'
			});

			transactionSearch.filters.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));

			transactionSearch.filters.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));

			var transactionDetails = utility.getSearchResultInJSON(transactionSearch);
			log.debug('getTransactionDtlForAssembly Transaction Details:', transactionDetails);
			return transactionDetails;
		}

		function isInventoryNumberExists(item, serial, location) {
			var lotInternalId = '';
			var objDetailsSearch = search.load({ id: 'customsearch_wms_wo_assembly_serialscan' });
			var filter = objDetailsSearch.filters;
			var cols = [];
			filter.push(search.createFilter({
				name: 'item',
				operator: search.Operator.ANYOF,
				values: item
			}));
			filter.push(search.createFilter({
				name: 'inventorynumber',
				operator: search.Operator.IS,
				values: serial
			}));
			objDetailsSearch.filters = filter;
			var objDetails = objDetailsSearch.run().getRange({
				start: 0, end: 1000
			});

			log.debug('objDetails Inventory Number Details:', objDetails);

			if (objDetails != null && objDetails != '' && objDetails.length > 0) {
				lotInternalId = objDetails[0]['id']
			}
			return lotInternalId;
		}

		function getOpenTaskDetailsforAssemblycomplete(transactionInternalId, warehouseLocationId, locUseBinsFlag) {
			var savedSearchName = 'customsearch_wms_wo_assembly_complete';
			if (locUseBinsFlag == false) {
				savedSearchName = 'customsearch_wms_wo_assembly_comp_nobin';
			}
			var openTaskSearch = search.load({ id: savedSearchName });
			var openTaskFilters = openTaskSearch.filters;
			if (utility.isValueValid(transactionInternalId)) {
				openTaskFilters.push(search.createFilter({
					name: 'custrecord_wmsse_order_no',
					operator: search.Operator.ANYOF,
					values: transactionInternalId
				}))
			}

			if (utility.isValueValid(warehouseLocationId)) {
				openTaskFilters.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));
			}

			openTaskSearch.filters = openTaskFilters;
			var objopentaskSearchDetails = utility.getSearchResultInJSON(openTaskSearch);
			log.debug({ title: 'objopentaskSearchDetails', details: objopentaskSearchDetails });
			return objopentaskSearchDetails;
		}

		function getWODetailsforAssembly(wonumber, warehouseLocationId) {
			var mfgBundleFlag = checkMFGbundleExistOrNot();
			var workOrdDtlSearch = search.load({
				id: 'customsearch_wmsse_woassembly_woscan_srh'
			});

			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'tranid',
					operator: search.Operator.ANYOF,
					values: wonumber
				})
			);
			workOrdDtlSearch.filters.push(
				search.createFilter({
					name: 'location',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				})
			);
			if (mfgBundleFlag) {
				workOrdDtlSearch.filters.push(
					search.createFilter({
						name: 'custbody_mfgmob_workcenter',
						operator: search.Operator.ANYOF,
						values: ['@NONE@']
					}));
			}

			var workOrdDtlResults = utility.getSearchResultInJSON(workOrdDtlSearch);
			log.debug('workOrdDtlResults', workOrdDtlResults);

			return workOrdDtlResults;
		}

		function getWOItems(transactionInternalIdArr) {
			var mfgworkinprocessFeature = runtime.isFeatureInEffect({
				feature: 'mfgworkinprocess'
			});

			var myTransactionQuery = query.create({
				type: query.Type.TRANSACTION
			});

			var myTransactionQueryline = myTransactionQuery.join({
				fieldId: 'transactionlines'

			});
			var condOrdType = myTransactionQuery.createCondition({
				fieldId: 'type',
				operator: query.Operator.ANY_OF,
				values: 'WorkOrd'
			});

			var condNotEmptyQunatity = myTransactionQueryline.createCondition({
				fieldId: 'quantity',
				operator: query.Operator.EMPTY_NOT
			});
			var condNonZeroQunatity = myTransactionQueryline.createCondition({
				fieldId: 'quantity',
				operator: query.Operator.EQUAL_NOT,
				values: 0
			});

			var condOrdMainline = myTransactionQueryline.createCondition({
				fieldId: 'mainline',
				operator: query.Operator.IS,
				values: false
			});

			var condfulfillable = myTransactionQueryline.createCondition({
				fieldId: 'fulfillable',
				operator: query.Operator.IS,
				values: true
			});
			var condItemPhatom = myTransactionQueryline.createCondition({
				fieldId: 'item^item.isphantom',
				operator: query.Operator.IS,
				values: false
			});
			var condOrdId = myTransactionQuery.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: transactionInternalIdArr
			});
			var condOrdQuantity = myTransactionQueryline.createCondition({
				formula: 'DECODE({transactionlines.itemtype#display},' + "'Non-inventory Item'" + ', ABS({transactionlines.quantity}),' + "'Other Charge'" + ',ABS({transactionlines.quantity}),' + "'Service'" + ',ABS({transactionlines.quantity}),' + "'Download Item'" + ',ABS({transactionlines.quantity}),' + "'Gift Certificate'" + ',ABS({transactionlines.quantity}),{transactionlines.quantitycommitted})',
				operator: query.Operator.GREATER,
				values: 0,
				type: query.ReturnType.FLOAT
			});
			var condPhantom = myTransactionQuery.createCondition({
				fieldId: 'transactionlines.itemsource',
				operator: query.Operator.ANY_OF_NOT,
				values: 'Phantom'
			});
			if (mfgworkinprocessFeature) {
				var isWipCondition = myTransactionQuery.createCondition({
					fieldId: 'iswip',
					operator: query.Operator.IS,
					values: false
				});
				myTransactionQuery.condition = myTransactionQuery.and(
					condOrdType, condNotEmptyQunatity, condOrdMainline, condfulfillable, condItemPhatom, condOrdId, isWipCondition, condNonZeroQunatity, condPhantom);
			} else {
				myTransactionQuery.condition = myTransactionQuery.and(
					condOrdType, condNotEmptyQunatity, condOrdMainline, condfulfillable, condItemPhatom, condOrdId, condNonZeroQunatity, condPhantom);
			}
			myTransactionQuery.columns = [
				myTransactionQuery.createColumn({
					fieldId: 'id'
				}),
				myTransactionQueryline.createColumn({
					fieldId: 'item'
				}),
				myTransactionQuery.createColumn({
					fieldId: 'transactionlines.id'

				}),
				myTransactionQueryline.createColumn({
					fieldId: 'quantityshiprecv'
				}),
				myTransactionQueryline.createColumn({
					formula: 'CASE WHEN {transactionlines.units.conversionrate} <> 1 THEN ABS({transactionlines.quantity})/{transactionlines.units.conversionrate} ELSE ABS({transactionlines.quantity}) END',
					type: query.ReturnType.FLOAT,
					label: 'quantityuom'
				}),
				myTransactionQueryline.createColumn({
					formula: 'ABS({transactionlines.quantity})',
					type: query.ReturnType.FLOAT,
					label: 'quantity'
				})
			];

			myTransactionQuery.sort = [
				myTransactionQuery.createSort({
					column: myTransactionQuery.columns[0]
				})
			];

			var myPagedData = myTransactionQuery.runPaged({
				pageSize: 1000
			});

			return getQueryResults(myPagedData);
		}


		function getOpentaskItemQtyforBuild(transactionInternalIdArr, locUseBinsFlag) {
			const openTaskItemQtyQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});

			const transactionQuery = openTaskItemQtyQuery.join({
				fieldId: 'custrecord_wmsse_order_no^transaction'

			});
			const transactionQuerylinemain = openTaskItemQtyQuery.join({
				fieldId: 'custrecord_wmsse_order_no^transaction.transactionlines'

			});

			var statusFlagCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});

			var taskTypeCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var inActiveCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});

			var orderInternalIdCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: transactionInternalIdArr
			});

			var mainlineCondition = transactionQuerylinemain.createCondition({
				fieldId: 'mainline',
				operator: query.Operator.IS,
				values: true
			});

			var confirmationRefCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: query.Operator.EMPTY
			});
			if (locUseBinsFlag == false) {
				openTaskItemQtyQuery.condition = openTaskItemQtyQuery.and(
					statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, mainlineCondition,
					confirmationRefCondition);
			} else {
				var transactionRefCondition = openTaskItemQtyQuery.createCondition({
					fieldId: 'custrecord_wmsse_nstrn_ref_no',
					operator: query.Operator.EMPTY_NOT
				});
				openTaskItemQtyQuery.condition = openTaskItemQtyQuery.and(
					statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, mainlineCondition,
					confirmationRefCondition, transactionRefCondition);
			}

			openTaskItemQtyQuery.columns = [
				openTaskItemQtyQuery.createColumn({
					fieldId: 'custrecord_wmsse_line_no',
					groupBy: true
				}),
				openTaskItemQtyQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty',
					aggregate: query.Aggregate.SUM
				}),
				transactionQuery.createColumn({
					fieldId: 'id',
					groupBy: true
				})
			];

			var myPagedData = openTaskItemQtyQuery.runPaged({
				pageSize: 1000
			});

			return getQueryResults(myPagedData);
		}
		function getQueryResults(pagedData) {
			var queryResults = [];
			pagedData.pageRanges.forEach(function (pageRange) {
				var myPage = pagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, queryResults, columnsObj);
					}
				}
			});
			log.debug('queryResults', queryResults);
			return queryResults;
		}

		function checkComponentItemsQty(woInternalIdArray, tempFlag, assemblyItemQtyObj, locUseBinsFlag) {
			var orderNumObj = {};
			var resultsArray = [];
			var totalLines = 0;
			var openTaskDtlObj = {};
			var itemLineDtlObj = {};
			var assemblyItemQuantity = '';
			var orderQtyArr = [];
			var orderDtlObj = {};
			var itemBuildableQty = '';
			var itemDtlArr = [];
			var objWOLineDtl = {};
			var itemDtlObj = {};
			var openTaskItemActqty = 0;
			var woCompItem = '';
			var itemQtyObj = {};
			var woCompItemLine = '';
			var fulfilledqty = '';
			var vqty = '';
			var internalId = '';
			var requiredItemQty = '';
			var vRemqty = '';
			var openTaskSearchResults = [];
			if (woInternalIdArray.length > 0) {
				openTaskSearchResults = getOpentaskItemQtyforBuild(woInternalIdArray, locUseBinsFlag);
			}

			var openTaskWorkOrderInternalIdArr = [];
			for (var cnt = 0; cnt < openTaskSearchResults.length; cnt++) {
				if (openTaskWorkOrderInternalIdArr.indexOf(openTaskSearchResults[cnt]['internalid']) == -1) {
					openTaskWorkOrderInternalIdArr.push(openTaskSearchResults[cnt]['internalid']);
				}
				if (utility.isValueValid(openTaskDtlObj[openTaskSearchResults[cnt]['internalid']])) {
					itemLineDtlObj = openTaskDtlObj[openTaskSearchResults[cnt]['internalid']];
					if (!(utility.isValueValid(itemLineDtlObj[openTaskSearchResults[cnt]['custrecord_wmsse_line_no']]))) {
						itemLineDtlObj[openTaskSearchResults[cnt]['custrecord_wmsse_line_no']] = openTaskSearchResults[cnt]['custrecord_wmsse_act_qty'];
					}
				} else {
					itemLineDtlObj = {};
					itemLineDtlObj[openTaskSearchResults[cnt]['custrecord_wmsse_line_no']] = openTaskSearchResults[cnt]['custrecord_wmsse_act_qty'];
					openTaskDtlObj[openTaskSearchResults[cnt]['internalid']] = itemLineDtlObj;
				}
			}
			var woItemSearchResults = [];
			if (openTaskWorkOrderInternalIdArr.length > 0) {
				woItemSearchResults = getWOItems(openTaskWorkOrderInternalIdArr);
			}

			if (tempFlag == 'true' && woItemSearchResults.length > 0) {
				totalLines = woItemSearchResults.length;

			}
			for (var itemSrchResult = 0; itemSrchResult < woItemSearchResults.length; itemSrchResult++) {
				openTaskItemActqty = 0;
				itemQtyObj = {};
				woCompItem = woItemSearchResults[itemSrchResult]['item'];
				woCompItemLine = woItemSearchResults[itemSrchResult]['line'];
				fulfilledqty = woItemSearchResults[itemSrchResult]['quantityshiprecv'];
				vqty = woItemSearchResults[itemSrchResult]['quantityuom'];
				internalId = woItemSearchResults[itemSrchResult]['id'];
				assemblyItemQuantity = assemblyItemQtyObj[internalId];
				if (parseFloat(assemblyItemQuantity) > 0 && parseFloat(vqty) > 0) {
					vqty = parseFloat(vqty).toFixed(8);
					assemblyItemQuantity = new Big(assemblyItemQuantity);
					requiredItemQty = (new Big(vqty)).div(assemblyItemQuantity);
					vRemqty = Number((Big(vqty).minus(fulfilledqty)).toFixed(8));
					if (utility.isValueValid(orderDtlObj[woItemSearchResults[itemSrchResult]['id']])) {
						objItem = orderDtlObj[woItemSearchResults[itemSrchResult]['id']];
						if (!(utility.isValueValid(objItem[woCompItemLine])))
							objItem[woCompItemLine] = 0;
					} else {
						objWOLineDtl = {};
						objWOLineDtl[woCompItemLine] = 0;
						orderDtlObj[woItemSearchResults[itemSrchResult]['id']] = objWOLineDtl;
					}

					if (utility.isValueValid(openTaskDtlObj[internalId])) {
						itemQtyObj = openTaskDtlObj[internalId];
						if (utility.isValueValid(itemQtyObj[woCompItemLine]))
							openTaskItemActqty = itemQtyObj[woCompItemLine];
					}
					objWOLineDtl = {};
					openTaskItemActqty = new Big(openTaskItemActqty);
					requiredItemQty = new Big(requiredItemQty);
					itemBuildableQty = openTaskItemActqty.div(requiredItemQty);
					if (utility.isValueValid(orderDtlObj[woItemSearchResults[itemSrchResult]['id']])) {
						objItem = orderDtlObj[woItemSearchResults[itemSrchResult]['id']];
						objItem[woCompItemLine] = itemBuildableQty;
					} else {
						objWOLineDtl[woCompItemLine] = itemBuildableQty;
						orderDtlObj[woItemSearchResults[itemSrchResult]['id']] = objWOLineDtl;
					}
				}
			}
			for (var n in orderDtlObj) {
				itemDtlobj = orderDtlObj[n];
				for (var m in itemDtlobj) {
					if (orderNumObj[n] == '0' || utility.isValueValid(orderNumObj[n])) {
						if (parseFloat(orderNumObj[n]) > parseFloat(itemDtlobj[m]))
							if (utility.isValueValid(itemDtlobj[m])) {
								orderNumObj[n] = Number(Big(itemDtlobj[m]).round(5, 1));
							}
					}
					else
						if (utility.isValueValid(itemDtlobj[m])) {
							orderNumObj[n] = Number(Big(itemDtlobj[m]).round(5, 1));
						}
				}
			}

			if (tempFlag == 'true') {
				resultsArray.push(totalLines);
				resultsArray.push(orderNumObj);
				log.debug('resultsArray', resultsArray);
				return resultsArray;
			}
			else {
				return orderNumObj;
			}
		}

		function getSerialsforWObuild(orderInternalId, item) {
			var serialSearch = search.load({
				type: 'customrecord_wmsse_serialentry',
				id: 'customsearch_wmsse_serialentry_statussrh'
			});
			serialSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_status',
				operator: search.Operator.IS,
				values: false
			}));
			if (utility.isValueValid(item))
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_item',
					operator: search.Operator.ANYOF,
					values: item
				}));
			if (utility.isValueValid(orderInternalId))
				serialSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_ser_ordno',
					operator: search.Operator.ANYOF,
					values: orderInternalId
				}));
			serialSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_ser_tasktype',
				operator: search.Operator.ANYOF,
				values: 2
			}));
			var result = utility.getSearchResultInJSON(serialSearch);
			return result;
		}


		function getOpenTaskDetailsforBuild(transactionInternalId, locUseBinsFlag) {
			const openTaskItemQtyQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});
			const itemQuery = openTaskItemQtyQuery.join({
				fieldId: 'custrecord_wmsse_sku^item'

			});
			var statusFlagCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});
			var inActiveCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});
			var orderInternalIdCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: transactionInternalId
			});
			var confirmationRefCondition = openTaskItemQtyQuery.createCondition({
				fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: query.Operator.EMPTY
			});
			if (locUseBinsFlag == false) {
				openTaskItemQtyQuery.condition = openTaskItemQtyQuery.and(
					statusFlagCondition, inActiveCondition, orderInternalIdCondition, confirmationRefCondition);
			} else {
				var transactionRefCondition = openTaskItemQtyQuery.createCondition({
					fieldId: 'custrecord_wmsse_nstrn_ref_no',
					operator: query.Operator.EMPTY_NOT
				});
				openTaskItemQtyQuery.condition = openTaskItemQtyQuery.and(
					statusFlagCondition, inActiveCondition, orderInternalIdCondition, confirmationRefCondition,
					transactionRefCondition);
			}
			var openTaskItemQtyQueryArr = [];


			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_batch_num',
				groupBy: true
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_sku',
				groupBy: true
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_line_no',
				groupBy: true
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_act_qty',
				aggregate: query.Aggregate.SUM
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_actendloc',
				groupBy: true
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_conversionrate',
				groupBy: true
			}));
			if (utility.isLotnumberedInventoryFeatureEnabled() == true) {
				openTaskItemQtyQueryArr.push(itemQuery.createColumn({
					fieldId: 'islotitem',
					groupBy: true
				}));
			}
			if (utility.isSerializedInventoryFeatureEnabled() == true) {
				openTaskItemQtyQueryArr.push(itemQuery.createColumn({
					fieldId: 'isserialitem',
					groupBy: true
				}));
			}
			openTaskItemQtyQueryArr.push(itemQuery.createColumn({
				fieldId: 'itemtype',
				groupBy: true
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_inventorystatus',
				groupBy: true
			}));
			openTaskItemQtyQueryArr.push(openTaskItemQtyQuery.createColumn({
				fieldId: 'custrecord_wmsse_batch_no',
				groupBy: true
			}));
			openTaskItemQtyQuery.columns = openTaskItemQtyQueryArr;


			var myPagedData = openTaskItemQtyQuery.runPaged({
				pageSize: 1000
			});

			return getQueryResults(myPagedData);
		}


		function getMemberItemQtyForWO(transactionInternalId, AssemItemOrdQty) {

			var searchresults = fnToValidateWO('', '', '', transactionInternalId);

			var compItemDetailsArray = [];
			var memberItemQty = 0;
			var vLine = '';
			var transactionUom;
			var memberUOMQty = 0;
			var currRow = [];
			for (var q = 0; q < searchresults.length; q++) {
				currRow = [];

				vLine = searchresults[q]['line'];
				transactionUom = searchresults[q]['unit'];
				if (utility.isValueValid(transactionUom)) {
					memberItemQty = searchresults[q]['quantityuom'];
				}
				else {
					memberItemQty = searchresults[q]['quantity'];
				}

				memberUOMQty = 0;
				if (AssemItemOrdQty != null && AssemItemOrdQty != '' && AssemItemOrdQty != 0) {
					memberItemQty = Big(memberItemQty);
					AssemItemOrdQty = Big(AssemItemOrdQty);
					log.debug('memberItemQty', memberItemQty);
					log.debug('AssemItemOrdQty', AssemItemOrdQty);
					memberUOMQty = memberItemQty.div(AssemItemOrdQty);
				}

				currRow = [searchresults[q]['item'], memberUOMQty, vLine];
				compItemDetailsArray.push(currRow);
			}
			log.debug('compItemDetailsArray', compItemDetailsArray);
			return compItemDetailsArray;
		}
		function getOpenTaskDetailsforSerial(transactionInternalId, lineNo, itemInternalId, enterBin) {
			var openTaskSearch = search.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: 'customsearch_wmsse_assembly_qtyscan_ot'
			});
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_order_no',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));
			if (utility.isValueValid(enterBin)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_nstrn_ref_no',
					operator: search.Operator.NONEOF,
					values: ['@NONE@']
				}));
			}
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_line_no',
				operator: search.Operator.EQUALTO,
				values: lineNo
			}));
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_sku',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
			if (utility.isValueValid(enterBin)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_actendloc',
					operator: search.Operator.ANYOF,
					values: enterBin
				}));
			}

			var result = utility.getSearchResultInJSON(openTaskSearch);
			return result;
		}


		function createAssemblyBuildRec(dataObj) {
			log.debug('dataObj', dataObj);
			var woInternalId = dataObj['transactionInternalId'];
			var bin = dataObj['binInternalId'];
			var assemblyItemId = dataObj['assemblyItemInternalId'];
			var whLocation = dataObj['warehouseLocationId'];
			var itemType = dataObj['itemType'];
			var batchno = dataObj['inventoryNumber'];
			var enteredQty = dataObj['scannedQuantity'];
			var totalOrdQty = dataObj['assemblyItemQuantity'];
			var lotExpiryDate = dataObj['lotExpiryDate'];
			var statusId = dataObj['statusInternalId'];
			var inventoryStatusFeature = dataObj['inventoryStatusFeature'];
			var locUseBinsFlag = dataObj['locUseBinsFlag'];

			var idl = "";
			var serialIds = [];
			var opentaskSplitArray = [];
			var opentaskSplitObj = {};
			var CompItemCount = 0;
			var openTaskItemDetailsResults = [];
			var memberItemsArray = [];
			var enteredLineArr = [];

			var buildRecord = record.transform({
				fromType: record.Type.WORK_ORDER,
				fromId: woInternalId,
				toType: record.Type.ASSEMBLY_BUILD,
				isDynamic: true
			});
			buildRecord.setValue({ fieldId: 'quantity', value: enteredQty, ignoreFieldChange: true });
			buildRecord.setValue({ fieldId: 'location', value: whLocation, ignoreFieldChange: true });
			buildRecord.setValue({ fieldId: 'item', value: assemblyItemId });

			if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {

				setLotAssemblyItemInventoryDetails(buildRecord, dataObj);
			}
			else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
				setSerialAssemblyItemInventoryDetails(buildRecord, dataObj);

			}
			else if (itemType == "inventoryitem" || itemType == "assemblyitem") {

				if ((utility.isValueValid(bin)) || (inventoryStatusFeature)) {
					setInvAssemblyItemInventoryDetails(buildRecord, dataObj);
				}
			}
			if (buildRecord != null && buildRecord != '') {
				CompItemCount = buildRecord.getLineCount({
					sublistId: 'component'
				});
			}
			if (CompItemCount > 0) {
				openTaskItemDetailsResults = getOpenTaskDetailsforBuild(woInternalId, locUseBinsFlag);
				memberItemsArray = getMemberItemQtyForWO(woInternalId, totalOrdQty);
			}

			for (var compIndex = 0; compIndex < CompItemCount; compIndex++) {
				var tempQuantity = 0;
				var compSubRecord = '';
				var requiredItemQty = 0;
				var objWOLineDtl = {};
				var objItemDtl = {};
				buildRecord.selectLine({
					sublistId: 'component',
					line: compIndex
				});
				var compItemLine = buildRecord.getSublistValue({
					sublistId: 'component',
					fieldId: 'orderline',
					line: compIndex
				});
				var compItem = buildRecord.getSublistValue({
					sublistId: 'component',
					fieldId: 'item',
					line: compIndex
				});

				for (var count = 0; count < memberItemsArray.length; count++) {
					var memItemDetails = memberItemsArray[count];
					var memItem = memItemDetails[0];
					var memItemqty = memItemDetails[1];
					var memItemLine = memItemDetails[2];
					memItemqty = Big(memItemqty);
					tempQuantity = memItemqty.mul(enteredQty);
					objWOLineDtl = {};
					if (utility.isValueValid(objItemDtl[memItem])) {
						objline = objItemDtl[memItem];
						objline[memItemLine] = tempQuantity;
					} else {
						objWOLineDtl[memItemLine] = tempQuantity;
						objItemDtl[memItem] = objWOLineDtl;
					}
				}

				for (var openTaskIndex = 0; openTaskIndex < openTaskItemDetailsResults.length; openTaskIndex++) {

					var itemBuildQty = 0;
					var openTaskSku = openTaskItemDetailsResults[openTaskIndex]['custrecord_wmsse_sku'];
					var openTaskLine = openTaskItemDetailsResults[openTaskIndex]['custrecord_wmsse_line_no'];
					var isLot = openTaskItemDetailsResults[openTaskIndex]['islotitem'];
					var isSerial = openTaskItemDetailsResults[openTaskIndex]['isserialitem'];
					var itemType = openTaskItemDetailsResults[openTaskIndex]['type'];
					var compItemReqQty = '';
					if (isLot == '' || isLot == 'null' || isLot == undefined || isLot == null) {
						isLot = false;
					}

					if (isSerial == '' || isSerial == 'null' || isSerial == undefined || isSerial == null) {
						isSerial = false;
					}

					if (openTaskSku == compItem && compItemLine == openTaskLine && enteredLineArr.indexOf(compItemLine) == -1) {
						var vSerialNumArray = [];
						var vLotNumArray = [];
						var vInvStatusArray = [];
						var componentItemOpentaskQty = 0;
						var componentopenTaskSku = '';
						var componentopenTaskLine = '';
						var invStatusQuantity = {};
						var lotWiseQuantity = {};
						var lineNo = openTaskItemDetailsResults[openTaskIndex]['custrecord_wmsse_line_no'];
						var enterBin = openTaskItemDetailsResults[openTaskIndex]['custrecord_wmsse_actendloc'];
						var batchNo = openTaskItemDetailsResults[openTaskIndex]['custrecord_wmsse_batch_num'];
						var conversionRate = openTaskItemDetailsResults[openTaskIndex]['custrecord_wmsse_conversionrate'];
						if (conversionRate == null || conversionRate == '' || conversionRate == '- None -')
							conversionRate = 1;

						for (var m = 0; m < openTaskItemDetailsResults.length; m++) {
							componentopenTaskSku = openTaskItemDetailsResults[m]['custrecord_wmsse_sku'];
							componentopenTaskLine = openTaskItemDetailsResults[m]['custrecord_wmsse_line_no'];
							if (componentopenTaskSku == compItem && componentopenTaskLine == compItemLine) {
								componentItemOpentaskQty = parseFloat(componentItemOpentaskQty) + parseFloat(openTaskItemDetailsResults[m]['custrecord_wmsse_act_qty']);
							}
						}
						objLinedata = objItemDtl[compItem];
						if (utility.isValueValid(objLinedata[compItemLine]))
							requiredItemQty = objLinedata[compItemLine];

						if (parseFloat(requiredItemQty) <= parseFloat(componentItemOpentaskQty)) {
							itemBuildQty = requiredItemQty;
						}
						else {
							itemBuildQty = componentItemOpentaskQty;
						}

						itemBuildQty = Big(itemBuildQty);
						//itemBuildQty = Number(itemBuildQty.mul(conversionRate));
						compItemReqQty = Number(itemBuildQty);
						buildRecord.setCurrentSublistValue({
							sublistId: 'component',
							fieldId: 'quantity',
							line: compIndex,
							value: parseFloat(parseFloat(itemBuildQty).toFixed(8))
						});

						if (isLot) {
							if (parseFloat(requiredItemQty) <= parseFloat(componentItemOpentaskQty)) {
								enteredLineArr.push(compItemLine);

							}
							setLotComponentItemInventoryDetails(buildRecord, compSubRecord, openTaskItemDetailsResults, itemBuildQty,
								inventoryStatusFeature, vInvStatusArray, vLotNumArray, whLocation, compIndex, compItem, compItemLine, invStatusQuantity, lotWiseQuantity);
						}
						else if ((itemType == "InvtPart" || itemType == "Assembly") && isLot == false && isSerial == false) {
							if (parseFloat(requiredItemQty) <= parseFloat(componentItemOpentaskQty)) {
								enteredLineArr.push(compItemLine);

							}
							if ((utility.isValueValid(enterBin)) || (inventoryStatusFeature)) {
								setInvtComponentInventoryDetails(buildRecord, compSubRecord, openTaskItemDetailsResults, itemBuildQty,
									inventoryStatusFeature, vInvStatusArray, vLotNumArray, whLocation, compIndex, compItem, compItemLine, invStatusQuantity);
							}

						}
						else if (isSerial) {
							if (parseFloat(requiredItemQty) <= parseFloat(componentItemOpentaskQty)) {
								enteredLineArr.push(compItemLine);
							}

							setSerialComponentInventoryDetails(buildRecord, compSubRecord, itemBuildQty,
								inventoryStatusFeature, vInvStatusArray, vSerialNumArray, dataObj, compIndex, compItem, compItemLine, enterBin, conversionRate, invStatusQuantity);
						}
						var openTaskObj = {};
						openTaskObj['assemblyBuildQty'] = compItemReqQty;
						openTaskObj['openTaskLine'] = openTaskLine;
						openTaskObj['openTaskItem'] = openTaskSku;
						openTaskObj['openTaskSerialArray'] = vSerialNumArray;
						openTaskObj['openTaskStatusArray'] = vInvStatusArray;
						openTaskObj['openTaskLotArray'] = vLotNumArray;
						openTaskObj['openTaskInvStatusObj'] = invStatusQuantity;
						openTaskObj['lotWiseQuantity'] = lotWiseQuantity;
						opentaskSplitArray.push(openTaskObj);
						opentaskSplitObj['opentaskSplitArray'] = opentaskSplitArray;
					}
				}

				buildRecord.commitLine({ sublistId: 'component' });
			}

			if (buildRecord != null && buildRecord != '')
				var assemBuildRecId = buildRecord.save();
			log.debug('assemBuildRecId', assemBuildRecId);
			opentaskSplitObj['assemblyRecId'] = assemBuildRecId;
			//opentaskSplitArray.push(assemBuildRecId);


			return opentaskSplitObj;
		}
		function getItemStockUOMdetails(itemInternalId, transactionUomName) {
			log.debug('transactionUomName', transactionUomName);
			var itemDetails = {};
			var itemType = '';
			var stockUnitName = '';
			var stockCoversionRate = '';
			var itemFamily = '';
			var itemGroup = '';
			var unitType = '';
			if (utility.isValueValid(itemInternalId)) {

				var columnArray = [];
				columnArray.push('itemprocessfamily');
				columnArray.push('itemprocessgroup');
				columnArray.push('unitstype');
				columnArray.push('name');
				columnArray.push('recordtype');
				columnArray.push('stockunit');

				var itemLookUp = utility.getItemFieldsByLookup(itemInternalId, columnArray);

				if (itemLookUp.recordtype != undefined) {
					itemType = itemLookUp.recordtype;
				}
				itemDetails["itemType"] = itemType;

				if (itemLookUp.thumbnailurl != undefined) {
					itemDetails["info_imageUrl"] = itemLookUp.thumbnailurl;
				}
				if (itemLookUp.itemprocessfamily != undefined) {
					itemFamily = itemLookUp.itemprocessfamily;
				}
				if (itemLookUp.itemprocessgroup != undefined) {
					itemGroup = itemLookUp.itemprocessgroup;
				}
				if (itemLookUp.unitstype != undefined && itemLookUp.unitstype.length > 0 && itemLookUp.stockunit != undefined) {
					stockUnitName = itemLookUp.stockunit[0].text;
				}
				if (itemLookUp.unitstype != undefined && itemLookUp.unitstype[0] != undefined) {
					unitType = itemLookUp.unitstype[0].value;
					log.debug({ title: 'unitType', details: unitType });
					if (utility.isValueValid(unitType)) {
						var uomValue = '';
						var uomConversionRate = '';
						var uomRecord = record.load({
							type: record.Type.UNITS_TYPE,
							id: unitType
						});

						var sublistCount = uomRecord.getLineCount({
							sublistId: 'uom'
						});

						for (var i = 0; i < sublistCount; i++) {
							var unitName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'unitname',
								line: i
							});
							var pluralName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'pluralname',
								line: i
							});
							if (transactionUomName.toUpperCase() == unitName.toUpperCase() ||
								transactionUomName.toUpperCase() == pluralName.toUpperCase()) {
								log.debug('unitName', unitName);
								uomValue = uomRecord.getSublistValue({
									sublistId: 'uom',
									fieldId: 'internalid',
									line: i
								});
								uomConversionRate = uomRecord.getSublistValue({
									sublistId: 'uom',
									fieldId: 'conversionrate',
									line: i
								});
								break;
							}
						}

						for (var i = 0; i < sublistCount; i++) {
							var unitName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'unitname',
								line: i
							});
							var pluralName = uomRecord.getSublistValue({
								sublistId: 'uom',
								fieldId: 'pluralname',
								line: i
							});
							if (stockUnitName.toUpperCase() == unitName.toUpperCase() ||
								stockUnitName.toUpperCase() == pluralName.toUpperCase()) {

								stockCoversionRate = uomRecord.getSublistValue({
									sublistId: 'uom',
									fieldId: 'conversionrate',
									line: i
								});
								break;
							}

						}

						if (uomValue != '') {
							itemDetails["transcationUomConversionRate"] = uomConversionRate;
							itemDetails["transcationUomInternalId"] = uomValue;
						}
					}
				}

				itemDetails["stockUnitName"] = stockUnitName;
				itemDetails["stockUomConversionRate"] = stockCoversionRate;
				itemDetails["itemFamily"] = itemFamily;
				itemDetails["itemGroup"] = itemGroup;
				itemDetails["unitType"] = unitType;


			}
			return itemDetails;
		}
		function getRecommendedBinswithPickPathAPI(itemObj, transactionType, itemIdArrforNonInvItems) {
			var tranType = '';

			var criteriasArry = [];
			var nonInventoryArry = [];
			var inventoryArry = [];
			//var itemArry = [];
			var result = '';
			var recommendedBinResArr = [];
			var whLocation = parseInt(itemObj['location']);
			var itemInventoryNumObj = {};

			if (utility.isValueValid(transactionType)) {
				if (transactionType == 'workorder')
					tranType = binApi.TranType.WORK_ORDER;
			}

			if (utility.isValueValid(itemObj)) {

				for (var k = 0; k < itemObj['itemIdArr'].length; k++) {
					var criteria = {};
					criteria.itemId = parseInt(itemObj['itemIdArr'][k]);
					if (utility.isValueValid(itemObj['qtyToPick'][k]))
						criteria.quantityToPick = parseFloat(itemObj['qtyToPick'][k]);
					else
						criteria.quantityToPick = 0;

					if (utility.isValueValid(itemObj['inventoryNumberArr'][k]))
						criteria.inventoryNumberId = parseInt(itemObj['inventoryNumberArr'][k]);

					criteriasArry.push(criteria);
				}

			}
			log.debug('criteriasArry in pickpath', criteriasArry);
			if (utility.isValueValid(criteria) && utility.isValueValid(tranType)) {
				result = binApi.recommendPickPath({
					locationId: whLocation,
					tranType: tranType,
					criterias: criteriasArry

				});
			}

			if (utility.isValueValid(result)) {

				for (var index = 0; index < result.bins.length; index++) {
					var bin = result.bins[index];
					var inputIndex = bin.inputIndex;
					if (utility.isValueValid(bin) && (bin.status.code == binApi.ResultCode.SUCCESS)) {

						var binData = bin.data;
						var binObj = binData['bin'];
						var binQtyArr = binData['quantities'];
						var binItemObj = binData['item'];
						var binZoneObj = binData['zone'];
						var isPreferredBin = binData['isPreferred'];
						var seqNum = binData['seqNum'];

						for (var qtyIndex = 0; qtyIndex < binQtyArr.length; qtyIndex++) {

							if ((inventoryArry.indexOf(binItemObj['id']) == -1) ||
								(inventoryArry.indexOf(binItemObj['id']) != -1 &&
									utility.isValueValid(itemInventoryNumObj[binItemObj.id]) &&
									utility.isValueValid(criteriasArry[inputIndex].inventoryNumberId) &&
									itemInventoryNumObj[binItemObj.id] != criteriasArry[inputIndex].inventoryNumberId)) {

								var binDtlResObj = {};

								binDtlResObj['bininternalid'] = binObj['id'];
								binDtlResObj['binnumber'] = binObj['name'];
								binDtlResObj['itemName'] = binItemObj['name'];
								binDtlResObj['itemInternalId'] = binItemObj['id'];
								binDtlResObj['zone'] = binZoneObj['name'];
								binDtlResObj['wmsaisle'] = '';
								binDtlResObj['wmslevel'] = '';
								binDtlResObj['status'] = binQtyArr[qtyIndex]['status']['name'];
								binDtlResObj['availableqty'] = binQtyArr[qtyIndex]['quantity'];
								binDtlResObj['isPreferredBin'] = isPreferredBin;
								binDtlResObj['seqNum'] = seqNum;
								if (utility.isValueValid(criteriasArry[inputIndex].inventoryNumberId)) {
									binDtlResObj['inventoryNumber'] = criteriasArry[inputIndex].inventoryNumberId;
									itemInventoryNumObj[binItemObj['id']] = criteriasArry[inputIndex].inventoryNumberId;
								}


								recommendedBinResArr.push(binDtlResObj);
								inventoryArry.push(binItemObj['id']);
							}

						}
					}
					else if (bin.status.code == binApi.ResultCode.EMPTY_BIN_LIST) {
						log.debug('itemIdArrforNonInvItems in pickpath', itemIdArrforNonInvItems);
						for (var NinvItem = 0; NinvItem < itemIdArrforNonInvItems.length; NinvItem++) {

							if (nonInventoryArry.indexOf(itemIdArrforNonInvItems[NinvItem]) == -1) {
								var binDtlResObj = {};
								binDtlResObj['bininternalid'] = '';
								binDtlResObj['binnumber'] = '';
								binDtlResObj['itemName'] = '';
								binDtlResObj['itemInternalId'] = itemIdArrforNonInvItems[NinvItem];
								binDtlResObj['zone'] = '';
								binDtlResObj['wmsaisle'] = '';
								binDtlResObj['wmslevel'] = '';
								binDtlResObj['status'] = '';
								binDtlResObj['availableqty'] = '';
								binDtlResObj['isPreferredBin'] = '';
								binDtlResObj['seqNum'] = '';
								recommendedBinResArr.push(binDtlResObj);
								nonInventoryArry.push(itemIdArrforNonInvItems[NinvItem]);
							}

						}

					}
				}
			}

			log.debug('recommendedBinResArr in pickpath ', recommendedBinResArr);
			return recommendedBinResArr;

		}
		function setLotAssemblyItemInventoryDetails(buildRecord, dataObj) {
			var buildSubRecord = buildRecord.getSubrecord({
				fieldId: 'inventorydetail'
			});
			buildSubRecord.selectNewLine({
				sublistId: 'inventoryassignment'
			});
			buildSubRecord.setCurrentSublistValue({
				sublistId: 'inventoryassignment',
				fieldId: 'receiptinventorynumber',
				value: dataObj['inventoryNumber']
			});
			buildSubRecord.setCurrentSublistValue({
				sublistId: 'inventoryassignment',
				fieldId: 'quantity',
				value: dataObj['scannedQuantity']
			});
			if (utility.isValueValid(dataObj['binInternalId'])) {
				buildSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'binnumber',
					value: dataObj['binInternalId']
				});
			}
			if (dataObj['inventoryStatusFeature']) {
				buildSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'inventorystatus',
					value: dataObj['statusInternalId']
				});
			}
			if (utility.isValueValid(dataObj['lotExpiryDate'])) {
				var parsedCurrentDate = format.parse({
					value: dataObj['lotExpiryDate'],
					type: format.Type.DATE
				});
				buildSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'expirationdate',
					value: parsedCurrentDate
				});
			}
			buildSubRecord.commitLine({ sublistId: 'inventoryassignment' });
		}
		function setSerialAssemblyItemInventoryDetails(buildRecord, dataObj) {
			var enteredQty = dataObj['scannedQuantity'];
			var SrchRecordTmpSerial = getSerialsforWObuild(dataObj['transactionInternalId'], dataObj['assemblyItemInternalId']);
			if (SrchRecordTmpSerial.length > 0) {
				var buildSubRecord = buildRecord.getSubrecord({
					fieldId: 'inventorydetail'
				});
				for (var n = 0; n < Math.min(SrchRecordTmpSerial.length, enteredQty); n++) {
					buildSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					buildSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: 1
					});
					buildSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'receiptinventorynumber',
						value: SrchRecordTmpSerial[n]['custrecord_wmsse_ser_no']
					});
					if (utility.isValueValid(dataObj['binInternalId'])) {
						buildSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: dataObj['binInternalId']
						});
					}
					if (dataObj['inventoryStatusFeature'])
						buildSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: dataObj['statusInternalId']
						});
					buildSubRecord.commitLine({ sublistId: 'inventoryassignment' });
				}
			}
		}
		function setInvAssemblyItemInventoryDetails(buildRecord, dataObj) {
			var buildSubRecord = buildRecord.getSubrecord({
				fieldId: 'inventorydetail'
			});
			var compLinelength = buildSubRecord.getLineCount({
				sublistId: 'inventoryassignment'
			});
			if (parseInt(compLinelength) > 0) {
				for (var intItr = 0; intItr < compLinelength; intItr++) {
					buildSubRecord.removeLine({ sublistId: 'inventoryassignment', line: 0 });
				}
			}
			buildSubRecord.selectNewLine({
				sublistId: 'inventoryassignment'
			});
			buildSubRecord.setCurrentSublistValue({
				sublistId: 'inventoryassignment',
				fieldId: 'quantity',
				value: dataObj['scannedQuantity']
			});
			if (utility.isValueValid(dataObj['binInternalId'])) {
				buildSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'binnumber',
					value: dataObj['binInternalId']
				});
			}
			if (dataObj['inventoryStatusFeature'])
				buildSubRecord.setCurrentSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'inventorystatus',
					value: dataObj['statusInternalId']
				});
			buildSubRecord.commitLine({ sublistId: 'inventoryassignment' });
		}
		function setLotComponentItemInventoryDetails(buildRecord, compSubRecord, openTaskItemDetailsResults,
			itemBuildQty, inventoryStatusFeature, vInvStatusArray, vLotNumArray, whLocation, compIndex, compItem, compItemLine, invStatusQuantity, lotWiseQuantity) {
			var count = 0;
			for (var openTaskItr = 0; openTaskItr < openTaskItemDetailsResults.length; openTaskItr++) {
				var openTaskLotSku = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_sku'];
				var openTaskLotLine = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_line_no'];
				if (openTaskLotSku == compItem && compItemLine == openTaskLotLine && parseFloat(itemBuildQty) > 0) {
					count++;
					var openTaskLotQty = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_act_qty'];
					var vConversionRate = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_conversionrate'];
					if (vConversionRate == null || vConversionRate == '' || vConversionRate == '- None -')
						vConversionRate = 1;
					openTaskLotQty = Big(openTaskLotQty);
					var otItemQuantity = Big(openTaskLotQty);
					if (parseFloat(itemBuildQty) <= parseFloat(openTaskLotQty)) {
						openTaskLotQty = itemBuildQty;
					}
					else if (parseFloat(openTaskLotQty) < parseFloat(itemBuildQty)) {
						openTaskLotQty = otItemQuantity;
					}
					var openTaskLot = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_batch_num'];
					var openTaskBin = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_actendloc'];
					var openTaskLotInternalId = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_batch_no'];
					var openTaskStatusId = "";
					if (inventoryStatusFeature)
						openTaskStatusId = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_inventorystatus'];
					if (!utility.isValueValid(openTaskLotInternalId)) {
						openTaskLotInternalId = utility.inventoryNumberInternalId(openTaskLot, whLocation, openTaskLotSku);
					}

					compSubRecord = buildRecord.getCurrentSublistSubrecord({
						sublistId: 'component',
						fieldId: 'componentinventorydetail',
						line: compIndex
					});
					var compLinelength = compSubRecord.getLineCount({
						sublistId: 'inventoryassignment'
					});

					if ((parseInt(compLinelength) > 0) && (count == 1)) {
						for (var intItr = 0; intItr < compLinelength; intItr++) {
							compSubRecord.removeLine({ sublistId: 'inventoryassignment', line: 0 });
						}
					}
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'issueinventorynumber',
						value: openTaskLotInternalId
					});
					if (utility.isValueValid(openTaskBin))
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: openTaskBin
						});
					if (inventoryStatusFeature)
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: openTaskStatusId
						});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: parseFloat(parseFloat(openTaskLotQty).toFixed(8))
					});
					compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
					if (vLotNumArray.indexOf(openTaskLot) == -1) {
						vLotNumArray.push(openTaskLot);
						lotWiseQuantity[openTaskLot] = parseFloat(openTaskLotQty);
					}
					else {
						lotWiseQuantity[openTaskLot] = parseFloat(lotWiseQuantity[openTaskLot]) + parseFloat(openTaskLotQty);
					}
					if (inventoryStatusFeature) {
						if (vInvStatusArray.indexOf(openTaskStatusId) == -1) {
							vInvStatusArray.push(openTaskStatusId.toString());
							invStatusQuantity[openTaskStatusId] = parseFloat(openTaskLotQty);
						}
						else {
							invStatusQuantity[openTaskStatusId] = parseFloat(invStatusQuantity[openTaskStatusId]) + parseFloat(openTaskLotQty);
						}
					}
					itemBuildQty = Number(Big(itemBuildQty).minus(openTaskLotQty));
				}
				if (itemBuildQty <= 0) {
					break;
				}
			}

		}
		function setInvtComponentInventoryDetails(buildRecord, compSubRecord, openTaskItemDetailsResults, itemBuildQty,
			inventoryStatusFeature, vInvStatusArray, vLotNumArray, whLocation, compIndex, compItem, compItemLine, invStatusQuantity) {
			var count = 0;
			for (var openTaskItr = 0; openTaskItr < openTaskItemDetailsResults.length; openTaskItr++) {

				var openTaskLotSku = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_sku'];
				var openTaskLotLine = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_line_no'];
				if (openTaskLotSku == compItem && compItemLine == openTaskLotLine && parseFloat(itemBuildQty) > 0) {
					count++;
					var openTaskLotQty = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_act_qty'];
					var vConversionRate = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_conversionrate'];
					var openTaskBin = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_actendloc'];
					var openTaskStatusId = "";
					if (inventoryStatusFeature)
						openTaskStatusId = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_inventorystatus'];
					var vConversionRate = openTaskItemDetailsResults[openTaskItr]['custrecord_wmsse_conversionrate'];
					if (vConversionRate == null || vConversionRate == '' || vConversionRate == '- None -')
						vConversionRate = 1;
					openTaskLotQty = Big(openTaskLotQty);
					var otItemQuantity = Big(openTaskLotQty);

					if (parseFloat(itemBuildQty) <= parseFloat(openTaskLotQty)) {
						openTaskLotQty = itemBuildQty;
					}
					else if (parseFloat(openTaskLotQty) < parseFloat(itemBuildQty)) {
						openTaskLotQty = otItemQuantity;
					}

					compSubRecord = buildRecord.getCurrentSublistSubrecord({
						sublistId: 'component',
						fieldId: 'componentinventorydetail',
						line: compIndex
					});
					var compLinelength = compSubRecord.getLineCount({
						sublistId: 'inventoryassignment'
					});
					if ((parseInt(compLinelength) > 0) && (count == 1)) {
						for (var intItr = 0; intItr < compLinelength; intItr++) {
							compSubRecord.removeLine({ sublistId: 'inventoryassignment', line: 0 });
						}
					}
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: parseFloat(parseFloat(openTaskLotQty).toFixed(8))
					});

					if (utility.isValueValid(openTaskBin))
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: openTaskBin
						});
					if (inventoryStatusFeature)
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: openTaskStatusId
						});
					compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
					if (inventoryStatusFeature) {
						if (vInvStatusArray.indexOf(openTaskStatusId) == -1) {
							vInvStatusArray.push(openTaskStatusId.toString());
							invStatusQuantity[openTaskStatusId] = parseFloat(openTaskLotQty);
						}
						else {
							invStatusQuantity[openTaskStatusId] = parseFloat(invStatusQuantity[openTaskStatusId]) + parseFloat(openTaskLotQty);
						}
					}
					itemBuildQty = Number(Big(itemBuildQty).minus(openTaskLotQty));

				}
				if (itemBuildQty <= 0) {
					break;
				}
			}

		}
		function setSerialComponentInventoryDetails(buildRecord, compSubRecord, itemBuildQty,
			inventoryStatusFeature, vInvStatusArray, vSerialNumArray, dataObj, compIndex, compItem, compItemLine, enterBin, conversionRate, invStatusQuantity) {
			var openTaskStatusId = '';
			var OpenTaskSerialResults = getOpenTaskDetailsforSerial(dataObj['transactionInternalId'], compItemLine, compItem, enterBin);

			if (OpenTaskSerialResults.length > 0) {
				var serialInventoryStatus = {};
				if (inventoryStatusFeature) {
					for (var serialItr = 0; serialItr < OpenTaskSerialResults.length; serialItr++) {
						var tempSerialArray = OpenTaskSerialResults[serialItr]['custrecord_wmsse_serial_no'];
						var serialInventoryStaus = OpenTaskSerialResults[serialItr]['custrecord_wmsse_inventorystatus'];
						var tempTotalSerialArray = '';
						if (tempSerialArray.length > 0)
							tempTotalSerialArray = tempSerialArray.split(',');
						for (var index = 0; index < tempTotalSerialArray.length; index++) {
							var tempSerial = tempTotalSerialArray[index];
							serialInventoryStatus[tempSerial] = serialInventoryStaus;
						}
					}
				}
				log.debug('serialInventoryStatus', serialInventoryStatus);
				var serialArray = '';
				var serialInternalIdArray = '';
				for (var serialItr = 0; serialItr < OpenTaskSerialResults.length; serialItr++) {
					if (serialArray == null || serialArray == '') {
						serialArray = OpenTaskSerialResults[serialItr]['custrecord_wmsse_serial_no'];
						if (utility.isValueValid(OpenTaskSerialResults[serialItr]['custrecord_wmsse_multi_bins']))
							serialInternalIdArray = OpenTaskSerialResults[serialItr]['custrecord_wmsse_multi_bins']
					}
					else {
						serialArray = serialArray + "," + OpenTaskSerialResults[serialItr]['custrecord_wmsse_serial_no'];
						if (utility.isValueValid(OpenTaskSerialResults[serialItr]['custrecord_wmsse_multi_bins']))
							serialInternalIdArray = serialInternalIdArray + "," + OpenTaskSerialResults[serialItr]['custrecord_wmsse_multi_bins'];
					}
				}
				var totalSerialArray = serialArray.split(',');
				log.debug('totalSerialArray', totalSerialArray);
				var totalSerialInternalIdArray = '';
				if (serialInternalIdArray != null && serialInternalIdArray.length > 0)
					totalSerialInternalIdArray = serialInternalIdArray.split(',');
				log.debug('totalSerialInternalIdArray', totalSerialInternalIdArray);
				compSubRecord = buildRecord.getCurrentSublistSubrecord({
					sublistId: 'component',
					fieldId: 'componentinventorydetail',
					line: compIndex
				});
				var compLinelength = compSubRecord.getLineCount({
					sublistId: 'inventoryassignment'
				});

				if (parseInt(compLinelength) > 0) {
					for (var intItr = 0; intItr < compLinelength; intItr++) {
						compSubRecord.removeLine({ sublistId: 'inventoryassignment', line: 0 });
					}
				}
				var finalSerialArray = [];
				var finalSerialInternalIdArray = [];
				itemBuildQty = Number(itemBuildQty.mul(conversionRate));
				log.debug('itemBuildQty', itemBuildQty);
				if (parseFloat(itemBuildQty) < totalSerialArray.length) {
					for (var arrayIndex = 0; arrayIndex < itemBuildQty; arrayIndex++) {
						finalSerialArray[arrayIndex] = totalSerialArray[arrayIndex];
						if (totalSerialInternalIdArray.length > 0)
							finalSerialInternalIdArray[arrayIndex] = totalSerialInternalIdArray[arrayIndex];
					}
				}
				else {
					for (var arrayIndex = 0; arrayIndex < totalSerialArray.length; arrayIndex++) {
						finalSerialArray[arrayIndex] = totalSerialArray[arrayIndex];
						if (totalSerialInternalIdArray.length > 0)
							finalSerialInternalIdArray[arrayIndex] = totalSerialInternalIdArray[arrayIndex]
					}
				}
				log.debug('finalSerialArray', finalSerialArray);
				log.debug('finalSerialInternalIdArray', finalSerialInternalIdArray);
				for (var serialIndex = 0; serialIndex < finalSerialArray.length; serialIndex++) {
					var openTaskSerialInternalId = '';
					if (utility.isValueValid(finalSerialInternalIdArray) && finalSerialInternalIdArray.length > 0) {
						openTaskSerialInternalId = finalSerialInternalIdArray[serialIndex];
					}
					else {
						openTaskSerialInternalId = utility.inventoryNumberInternalId(finalSerialArray[serialIndex], dataObj['warehouseLocationId'], compItem);
					}
					log.debug('openTaskSerialInternalId', openTaskSerialInternalId);
					if (inventoryStatusFeature) {
						if (utility.isValueValid(serialInventoryStatus)) {
							openTaskStatusId = serialInventoryStatus[finalSerialArray[serialIndex]];
						}
					}
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: 1
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'issueinventorynumber',
						value: openTaskSerialInternalId
					});
					if (enterBin != null && enterBin != "" && enterBin != 'null')
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: enterBin
						});
					if (inventoryStatusFeature)
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							value: openTaskStatusId
						});
					compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
					if (utility.isValueValid(openTaskStatusId)) {
						if (vInvStatusArray.indexOf(openTaskStatusId) == -1) {
							vInvStatusArray.push(openTaskStatusId);
							invStatusQuantity[openTaskStatusId] = 1;
						}
						else {
							invStatusQuantity[openTaskStatusId] = parseFloat(invStatusQuantity[openTaskStatusId]) + 1;
						}
					}
					vSerialNumArray.push(finalSerialArray[serialIndex]);
				}
			}

		}

		function splitOpenTaskRecordsForWO(splitOpenTaskResults, results, transactionInternalId, inventoryStatusFeature) {
			for (var index in splitOpenTaskResults) {
				if (runtime.getCurrentScript().getRemainingUsage() <= 100) {
					var schstatus = task.create({ taskType: task.TaskType.MAP_REDUCE });
					schstatus.scriptId = 'customscript_wms_mr_assemblybuild_ot_upd';
					schstatus.deploymentId = null;
					schstatus.params = {
						"custscript_wms_woid": transactionInternalId,
						"custscriptwms_wotype": 'workorder',
						"custscript_wms_woresults": splitOpenTaskResults,
						"custscript_wms_assemblybuildid": results.assemblyRecId
					};
					schstatus.submit();
					break;
				} else {
					var assemblyBuildQty = Number(splitOpenTaskResults[index]['assemblyBuildQty']);
					var openTaskLineNo = splitOpenTaskResults[index]['openTaskLine'];
					var openTaskItem = splitOpenTaskResults[index]['openTaskItem'];
					var openTaskSerial = splitOpenTaskResults[index]['openTaskSerialArray'];
					var openTaskStatus = splitOpenTaskResults[index]['openTaskStatusArray'];
					var openTaskLot = splitOpenTaskResults[index]['openTaskLotArray'];
					log.debug('assemblyBuildQty', assemblyBuildQty);
					var openTaskList = getOpenTaskLineDetails(transactionInternalId, openTaskLineNo, openTaskItem, '', openTaskSerial, inventoryStatusFeature);
					log.debug('openTaskList', openTaskList);
					for (var openTaskItr = 0; openTaskItr < openTaskList.length && assemblyBuildQty > 0; openTaskItr++) {
						var assemblyBuildOpenTaskId = openTaskList[openTaskItr]['id']
						var transactionRec = record.load({ type: 'customrecord_wmsse_trn_opentask', id: assemblyBuildOpenTaskId });
						var recordActualQty = transactionRec.getValue({ fieldId: 'custrecord_wmsse_act_qty' });
						var recordActualSerail = transactionRec.getValue({ fieldId: 'custrecord_wmsse_serial_no' });
						var recordStatus = transactionRec.getValue({ fieldId: 'custrecord_wmsse_inventorystatus' });
						var recordkBatchNum = transactionRec.getValue({ fieldId: 'custrecord_wmsse_batch_num' });
						var recordActualSerialIds = transactionRec.getValue({ fieldId: 'custrecord_wmsse_multi_bins' });
						if (utility.isValueValid(openTaskStatus) && openTaskStatus.length > 0 &&
							utility.isValueValid(recordStatus) && inventoryStatusFeature == true) {
							if (((openTaskStatus.indexOf(recordStatus) != -1) && (openTaskLot == '' || openTaskLot == null || openTaskLot == 'null')) ||
								((openTaskStatus.indexOf(recordStatus) != -1) && (openTaskLot != '' && openTaskLot != null && openTaskLot.indexOf(recordkBatchNum) != -1))) {
								if (parseFloat(assemblyBuildQty) < parseFloat(recordActualQty)) {
									var newSerialString = '';
									var newSerialInternalId = '';
									if (utility.isValueValid(recordActualSerail) && utility.isValueValid(openTaskSerial)) {
										var serialArray = recordActualSerail.split(',');
										var serialInternalIdArray = '';
										if (utility.isValueValid(recordActualSerialIds)) {
											serialInternalIdArray = recordActualSerialIds.split(',');
										}
										for (var n in serialArray) {
											if (openTaskSerial.indexOf(serialArray[n]) == -1) {
												if (newSerialString == '') {
													newSerialString = serialArray[n];
													if (serialInternalIdArray.length > 0) {
														newSerialInternalId = serialInternalIdArray[n];
													}
												} else {
													newSerialString = newSerialString.concat(',', serialArray[n]);
													if (serialInternalIdArray.length > 0) {
														newSerialInternalId = newSerialInternalId.concat(',', serialInternalIdArray[n]);
													}
												}
											}
										}
									}
									cloneOpenTaskRecord(assemblyBuildOpenTaskId, recordActualQty, assemblyBuildQty, transactionInternalId,
										newSerialString, recordActualSerialIds, newSerialInternalId);
									transactionRec.setValue({ fieldId: 'custrecord_wmsse_expe_qty', value: Number(parseFloat(assemblyBuildQty).toFixed(8)) });
									transactionRec.setValue({ fieldId: 'custrecord_wmsse_act_qty', value: Number(parseFloat(assemblyBuildQty).toFixed(8)) });
								}
								transactionRec.setValue({ fieldId: 'custrecord_wmsse_nsconfirm_ref_no', value: results.assemblyRecId });
								transactionRec.save();
								assemblyBuildQty = Big(assemblyBuildQty).minus(recordActualQty);
							}
						}
						else {
							if ((openTaskLot == '' || openTaskLot == null || openTaskLot == 'null') ||
								(openTaskLot != '' && openTaskLot != null && openTaskLot.indexOf(recordkBatchNum) != -1)) {
								if (parseFloat(assemblyBuildQty) < parseFloat(recordActualQty)) {
									var newSerialString = '';
									var newSerialInternalId = '';
									if (utility.isValueValid(recordActualSerail) && utility.isValueValid(openTaskSerial)) {
										var serialArray = recordActualSerail.split(',');
										var serialInternalIdArray = '';
										if (utility.isValueValid(recordActualSerialIds)) {
											serialInternalIdArray = recordActualSerialIds.split(',');
										}
										for (var n in serialArray) {
											if (openTaskSerial.indexOf(serialArray[n]) == -1) {
												if (newSerialString == '') {
													newSerialString = serialArray[n];
													if (serialInternalIdArray.length > 0) {
														newSerialInternalId = serialInternalIdArray[n];
													}
												} else {
													newSerialString = newSerialString.concat(',', serialArray[n]);
													if (serialInternalIdArray.length > 0) {
														newSerialInternalId = newSerialInternalId.concat(',', serialInternalIdArray[n]);
													}
												}
											}
										}
									}
									cloneOpenTaskRecord(assemblyBuildOpenTaskId, recordActualQty, assemblyBuildQty, transactionInternalId,
										newSerialString, recordActualSerialIds, newSerialInternalId);
									transactionRec.setValue({ fieldId: 'custrecord_wmsse_expe_qty', value: Number(parseFloat(assemblyBuildQty).toFixed(8)) });
									transactionRec.setValue({ fieldId: 'custrecord_wmsse_act_qty', value: Number(parseFloat(assemblyBuildQty).toFixed(8)) });
								}
								transactionRec.setValue({ fieldId: 'custrecord_wmsse_nsconfirm_ref_no', value: results.assemblyRecId });
								transactionRec.save();
								assemblyBuildQty = Big(assemblyBuildQty).minus(recordActualQty);
								log.debug({ title: 'assemblyBuildQty1', details: assemblyBuildQty });
							}
						}
					}
				}
			}
		}
		function cloneOpenTaskRecord(assemblyBuildOpenTaskId, recordActualQty, assemblyBuildQty, transactionInternalId,
			newSerialString, recordActualSerialIds, newSerialInternalId) {
			var cloneOpenTaskRec = record.copy({
				type: 'customrecord_wmsse_trn_opentask',
				id: assemblyBuildOpenTaskId
			});
			var remainingQty = Number(Big(parseFloat(recordActualQty)).minus(parseFloat(assemblyBuildQty)).toFixed(8));
			cloneOpenTaskRec.setValue({ fieldId: 'custrecord_wmsse_expe_qty', value: remainingQty });
			cloneOpenTaskRec.setValue({ fieldId: 'custrecord_wmsse_act_qty', value: remainingQty });
			cloneOpenTaskRec.setValue({ fieldId: 'custrecord_wmsse_upd_user_no', value: runtime.getCurrentUser().id });
			cloneOpenTaskRec.setValue({ fieldId: 'custrecord_wmsse_serial_no', value: newSerialString });
			cloneOpenTaskRec.setValue({ fieldId: 'custrecord_wmsse_nsconfirm_ref_no', value: '' });
			cloneOpenTaskRec.setValue({ fieldId: 'name', value: transactionInternalId });
			if (utility.isValueValid(recordActualSerialIds))
				cloneOpenTaskRec.setValue({ fieldId: 'custrecord_wmsse_multi_bins', value: newSerialInternalId });
			var cloneOpenTaskRecId = cloneOpenTaskRec.save();
		}
		function buildParameterObject(parameterObject, transactionInternalId, itemInternalId, warehouseLocationId, itemType, scannedQuantity,
			scannedQuantityInBaseUnits, assemblyItemQuantity, statusInternalId, inventoryStatusFeature, stockUnitName, locUseBinsFlag, inventoryNumber, lotExpiryDate) {
			parameterObject['transactionInternalId'] = transactionInternalId;
			parameterObject['binInternalId'] = '';
			parameterObject['assemblyItemInternalId'] = itemInternalId;
			parameterObject['warehouseLocationId'] = warehouseLocationId;
			parameterObject['itemType'] = itemType;
			parameterObject['inventoryNumber'] = inventoryNumber;
			parameterObject['lotInternalId'] = '';
			parameterObject['scannedQuantity'] = scannedQuantity;
			parameterObject['scannedQuantityInBaseUnits'] = scannedQuantityInBaseUnits;
			parameterObject['assemblyItemQuantity'] = assemblyItemQuantity;
			parameterObject['lotExpiryDate'] = lotExpiryDate;
			parameterObject['statusInternalId'] = statusInternalId;
			parameterObject['inventoryStatusFeature'] = inventoryStatusFeature;
			parameterObject['actualBeginTime'] = '';
			parameterObject['itemInternalId'] = itemInternalId;
			parameterObject['status'] = statusInternalId;
			parameterObject['processType'] = 'WorkOrderAssembly';
			parameterObject['transactionUomName'] = stockUnitName;
			parameterObject['locUseBinsFlag'] = locUseBinsFlag;
			return parameterObject;
		}
		function getOpenTaskLineDetails(transactionInternalId, openTaskLineNo, openTaskSku, openTaskLotNum, openTaskSerial, inventoryStatusFeature) {
			var openTaskSearch = search.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: 'customsearch_wmsse_assembly_qtyscan_ot'
			});
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_order_no',
				operator: search.Operator.ANYOF,
				values: transactionInternalId
			}));
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_wms_status_flag',
				operator: search.Operator.ANYOF,
				values: ['8']
			}));
			openTaskSearch.filters.push(search.createFilter({
				name: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: search.Operator.ANYOF,
				values: ['@NONE@']
			}));
			openTaskSearch.filters.push(search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: false
			}));
			if (utility.isValueValid(openTaskSku)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_sku',
					operator: search.Operator.ANYOF,
					values: openTaskSku
				}));
			}
			if (utility.isValueValid(openTaskLineNo)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_line_no',
					operator: search.Operator.EQUALTO,
					values: openTaskLineNo
				}));
			}
			if (utility.isValueValid(openTaskLotNum)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_batch_num',
					operator: search.Operator.IS,
					values: openTaskLotNum
				}));
			}
			if (utility.isValueValid(openTaskSerial)) {
				openTaskSearch.filters.push(search.createFilter({
					name: 'custrecord_wmsse_serial_no',
					operator: search.Operator.CONTAINS,
					values: openTaskSerial
				}));
			}
			var openTaskRes = utility.getSearchResultInJSON(openTaskSearch);
			log.debug('openTaskRes', openTaskRes);
			return openTaskRes;
		}

		function noCodeSolForWO(opentaskId, transactionInternalId, locationUseBinlFlag, binTransferId) {
			var openTaskArr = [];
			var transactionInternalIdArr = [];
			var binTransferArr = [];
			var impactedRecords = {};

			if (utility.isValueValid(opentaskId)) {
				openTaskArr.push(opentaskId);
			} else {
				openTaskArr.push();
			}

			if (utility.isValueValid(transactionInternalId)) {
				transactionInternalIdArr.push(transactionInternalId);
			} else {
				transactionInternalIdArr.push();
			}

			if (utility.isValueValid(binTransferId)) {
				binTransferArr.push(binTransferId);
			} else {
				binTransferArr.push();
			}

			if (locationUseBinlFlag == false) {
				impactedRecords['_ignoreUpdate'] = false;//updated
			}
			else {
				impactedRecords['_ignoreUpdate'] = true;//not update
			}

			impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskArr;
			impactedRecords['workorder'] = transactionInternalIdArr;
			impactedRecords['bintransfer'] = binTransferArr;
			return impactedRecords;
		}

		function getUomDetails(unitType, transactionUomName) {
			var obj = {};
			var uomValue = '';
			var uomConversionRate = '';
			var uomList = [];
			var uomRecord = record.load({
				type: record.Type.UNITS_TYPE,
				id: unitType
			});

			var sublistCount = uomRecord.getLineCount({
				sublistId: 'uom'
			});
			for (var i = 0; i < sublistCount; i++) {
				var unitName = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'unitname',
					line: i
				});
				var pluralName = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'pluralname',
					line: i
				});
				conversionRate = uomRecord.getSublistValue({
					sublistId: 'uom',
					fieldId: 'conversionrate',
					line: i
				});

				if (transactionUomName != null && transactionUomName != '' && transactionUomName != 'undefiend') {
					if (transactionUomName.toUpperCase() == unitName.toUpperCase() ||
						transactionUomName.toUpperCase() == pluralName.toUpperCase()) {
						uomValue = uomRecord.getSublistValue({
							sublistId: 'uom',
							fieldId: 'internalid',
							line: i
						});
						uomConversionRate = uomRecord.getSublistValue({
							sublistId: 'uom',
							fieldId: 'conversionrate',
							line: i
						});

					}
				}
				var row = { 'value': unitName, 'id': conversionRate };
				uomList.push(row);
			}
			if (uomValue != '') {
				obj["uomConversionRate"] = uomConversionRate;
				obj["UomInternalId"] = uomValue;
				obj["uomList"] = uomList;
			}
			return obj;
		}
		function getWOpickQty(woInternalId) {
			var myOpenTaskQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});
			var statusFlagCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});

			var taskTypeCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var inActiveCondition = myOpenTaskQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});
			var orderInternalIdCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: woInternalId
			});

			myOpenTaskQuery.condition = myOpenTaskQuery.and(statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition);

			myOpenTaskQuery.columns = [
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty',
					aggregate: query.Aggregate.SUM
				})];


			var openTaskDetailsArr = [];

			var myPagedData = myOpenTaskQuery.runPaged({
				pageSize: 1000
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, openTaskDetailsArr, columnsObj);
					}
				}
			});

			log.debug('openTaskDetailsArr', openTaskDetailsArr);
			return openTaskDetailsArr;
		}

		function getOpentaskPickQtyDetails(woInternalId, itemIdArr, lineNumArr, transactionRef) {
			var myOpenTaskQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'
			});
			var itemIdCondition;
			var lineNumCondition;
			var transactionRefCondition;
			var statusFlagCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});
			var taskTypeCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var inActiveCondition = myOpenTaskQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});
			var orderInternalIdCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: woInternalId
			});
			if (utility.isValueValid(itemIdArr)) {
				itemIdCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_sku',
					operator: query.Operator.ANY_OF,
					values: itemIdArr
				});
			} else {
				itemIdCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_sku',
					operator: query.Operator.EMPTY_NOT
				});
			}
			if (utility.isValueValid(lineNumArr)) {
				lineNumCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_line_no',
					operator: query.Operator.EQUAL,
					values: lineNumArr
				});
			} else {
				lineNumCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_line_no',
					operator: query.Operator.EMPTY_NOT
				});
			}
			if (utility.isValueValid(transactionRef)) {
				transactionRefCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_nstrn_ref_no',
					operator: query.Operator.EMPTY_NOT
				});
				myOpenTaskQuery.condition = myOpenTaskQuery.and(
					statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, itemIdCondition, lineNumCondition, transactionRefCondition);
			} else {
				myOpenTaskQuery.condition = myOpenTaskQuery.and(
					statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, itemIdCondition, lineNumCondition);
			}

			myOpenTaskQuery.columns = [
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty',
					aggregate: query.Aggregate.SUM
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_sku',
					groupBy: true
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_line_no',
					groupBy: true
				})
			];

			var openTaskDetailsArr = [];

			var myPagedData = myOpenTaskQuery.runPaged({
				pageSize: 1000
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, openTaskDetailsArr, columnsObj);
					}
				}
			});

			log.debug('openTaskDetailsArr', openTaskDetailsArr);
			return openTaskDetailsArr;
		}

		function getOpentaskQtyWithInventoryNumber(woInternalId, itemIdArr, lineNumArr, transactionRef) {
			var myOpenTaskQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'
			});
			var itemIdCondition;
			var lineNumCondition;
			var transactionRefCondition;
			var statusFlagCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});
			var taskTypeCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var inActiveCondition = myOpenTaskQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});
			var orderInternalIdCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: woInternalId
			});
			if (utility.isValueValid(itemIdArr)) {
				itemIdCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_sku',
					operator: query.Operator.ANY_OF,
					values: itemIdArr
				});
			} else {
				itemIdCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_sku',
					operator: query.Operator.EMPTY_NOT
				});
			}
			if (utility.isValueValid(lineNumArr)) {
				lineNumCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_line_no',
					operator: query.Operator.EQUAL,
					values: lineNumArr
				});
			} else {
				lineNumCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_line_no',
					operator: query.Operator.EMPTY_NOT
				});
			}
			if (utility.isValueValid(transactionRef)) {
				transactionRefCondition = myOpenTaskQuery.createCondition({
					fieldId: 'custrecord_wmsse_nstrn_ref_no',
					operator: query.Operator.EMPTY_NOT
				});
				myOpenTaskQuery.condition = myOpenTaskQuery.and(
					statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, itemIdCondition, lineNumCondition, transactionRefCondition);
			} else {
				myOpenTaskQuery.condition = myOpenTaskQuery.and(
					statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, itemIdCondition, lineNumCondition);
			}

			myOpenTaskQuery.columns = [
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_sku'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_line_no'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_batch_num'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_serial_no'
				})
			];

			var openTaskDetailsArr = [];

			var myPagedData = myOpenTaskQuery.runPaged({
				pageSize: 1000
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, openTaskDetailsArr, columnsObj);
					}
				}
			});

			log.debug('openTaskDetails', openTaskDetailsArr);
			return openTaskDetailsArr;
		}

		function fetchingComponentsforStaging(woInternalId) {
			var myOpenTaskQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'
			});

			var statusFlagCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});
			var taskTypeCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var inActiveCondition = myOpenTaskQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});
			var orderInternalIdCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: woInternalId
			});
			var confirmationRefCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
				operator: query.Operator.EMPTY
			});
			var transactionRefCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_nstrn_ref_no',
				operator: query.Operator.EMPTY
			});


			myOpenTaskQuery.condition = myOpenTaskQuery.and(
				statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition, confirmationRefCondition, transactionRefCondition);


			myOpenTaskQuery.columns = [
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_act_qty'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_sku'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_actendloc'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_conversionrate'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_batch_num'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_serial_no'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'id'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_order_no'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_inventorystatus'
				}),
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_actbeginloc'
				})
			];

			myOpenTaskQuery.sort = [myOpenTaskQuery.createSort({ column: myOpenTaskQuery.columns[6] })];

			var openTaskDetailsArr = [];

			var myPagedData = myOpenTaskQuery.runPaged({
				pageSize: 1000
			});

			myPagedData.pageRanges.forEach(function (pageRange) {
				var myPage = myPagedData.fetch({
					index: pageRange.index
				});
				var resultSetObj = myPage.data;
				if (resultSetObj != null && resultSetObj != '') {
					var resultsObj = resultSetObj.results;
					var columnsObj = resultSetObj.columns;
					for (var row in resultsObj) {
						var resultObj = resultsObj[row];
						convertToJsonObj(resultObj, openTaskDetailsArr, columnsObj);
					}
				}
			});

			log.debug('openTaskDetailsArr', openTaskDetailsArr);
			return openTaskDetailsArr;
		}

		function convertToJsonObj(result, resultsArray, columnsObj) {
			var columns = columnsObj;
			var values = result.values;
			var dataObj = {};
			for (var col in columns) {
				var colName = columns[col]['fieldId'];
				if (colName == '' || colName == null) {
					colName = columns[col]['label'];
				}
				dataObj[colName] = values[col];
				if (colName == 'id') {
					dataObj.internalid = values[col];
				}
				if (colName == 'itemtype') {
					dataObj.type = values[col];
				}
				if (colName == 'transactionlines.id') {
					dataObj.line = values[col];
				}
			}
			resultsArray.push(dataObj);
		}
		function getItemTypeDetails(itemIdArray, location) {
			var searchRec = search.load({
				id: 'customsearch_wmsse_itemtype_srh'
			});
			var savedFilter = searchRec.filters;
			savedFilter.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemIdArray
			}));
			searchRec.filters = savedFilter;
			var searchres = utility.getSearchResultInJSON(searchRec);
			return searchres;
		}
		function updateOpenTaskInWOStaging(opentaskSearchResultsPick, binTransferId, stageBinInternalId) {

			var vopentaskRec = record.load({
				type: 'customrecord_wmsse_trn_opentask',
				id: opentaskSearchResultsPick.internalid
			});
			vopentaskRec.setValue({ fieldId: 'custrecord_wmsse_nstrn_ref_no', value: binTransferId });
			vopentaskRec.setValue({ fieldId: 'custrecord_wmsse_stagebinloc', value: stageBinInternalId });
			vopentaskRec.setValue({ fieldId: 'custrecord_wmsse_actendloc', value: stageBinInternalId });
			vopentaskRec.save();
		}
		function updateOpentaskQtyForInvNumber(woPickQtyResultswithInventoryNumber, objItemDtl) {
			var objline = {};
			var lineObject = {};
			var lotNum = '';
			var itemId = '';
			var lineNo = '';
			var actQty = '';
			var serialNo = '';
			for (var openTaskResult = 0; openTaskResult < woPickQtyResultswithInventoryNumber.length; openTaskResult++) {
				lineObject = {};
				objline = {};
				lotNum = woPickQtyResultswithInventoryNumber[openTaskResult].custrecord_wmsse_batch_num;
				itemId = woPickQtyResultswithInventoryNumber[openTaskResult].custrecord_wmsse_sku;
				lineNo = woPickQtyResultswithInventoryNumber[openTaskResult].custrecord_wmsse_line_no;
				actQty = woPickQtyResultswithInventoryNumber[openTaskResult].custrecord_wmsse_act_qty;
				serialNo = woPickQtyResultswithInventoryNumber[openTaskResult].custrecord_wmsse_serial_no;
				if (!utility.isValueValid(objItemDtl[itemId])) {
					objline[lineNo] = {};
					objItemDtl[itemId] = objline;
				}

				if (utility.isValueValid(lotNum)) {
					objline = objItemDtl[itemId];
					lineObject = objline[lineNo];
					log.debug('lineObject', lineObject);
					log.debug('lineObject[lotNum]', lineObject[lotNum]);
					if (utility.isValueValid(lineObject[lotNum])) {
						lineObject[lotNum] = Big(parseFloat(lineObject[lotNum])).plus(parseFloat(actQty)).toFixed(8);
					} else {
						lineObject[lotNum] = actQty;
					}
				}
				else if (utility.isValueValid(serialNo)) {
					objline = objItemDtl[itemId];
					lineObject = objline[lineNo];
					var serialNumberArray = (serialNo).split(',');
					for (var serial = 0; serial < serialNumberArray.length; serial++) {
						lineObject[serialNumberArray[serial]] = 1;
					}
				}
			}
			log.debug('objItemDtl', objItemDtl);
		}
		function woOverpickingFlag(workOrderId, whLocation) {
			try {
				var overPickingFlag = false;
				if (utility.isValueValid(workOrderId)) {
					var workOrderDetails = record.load({ type: 'workorder', id: workOrderId });
					var workCenter = workOrderDetails.getValue({ fieldId: 'custbody_mfgmob_workcenter' });
					var iswip = workOrderDetails.getValue({ fieldId: 'iswip' });

					if ((utility.isValueValid(iswip) && iswip == true) || (utility.isValueValid(workCenter))) {
						var systemRule_WOoverpickingResults = utility.getSystemRuleDetails('Allow over-picking for work orders', whLocation, 'Y')

						if (systemRule_WOoverpickingResults.length > 0) {
							if (utility.isValueValid(systemRule_WOoverpickingResults[0].custrecord_wmsseprocesstypeText)) {
								var processType = systemRule_WOoverpickingResults[0].custrecord_wmsseprocesstypeText;
								if (processType == "Manufacturing Mobile app") {
									overPickingFlag = true;
								}
							}
						}
					}
				}
			}
			catch (e) {
				log.error('execption in woOverpickingFlag', e);
			}
			log.debug('overPickingFlag', overPickingFlag);
			return overPickingFlag;
		}

		function getWOcompItemsCountFromOpenTask(woInternalId) {
			var totalSearchCount = 0;
			var myOpenTaskQuery = query.create({
				type: 'customrecord_wmsse_trn_opentask'

			});
			var statusFlagCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_wms_status_flag',
				operator: query.Operator.ANY_OF,
				values: 8
			});

			var taskTypeCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_tasktype',
				operator: query.Operator.ANY_OF,
				values: 3
			});
			var inActiveCondition = myOpenTaskQuery.createCondition({
				fieldId: 'isinactive',
				operator: query.Operator.IS,
				values: false
			});
			var orderInternalIdCondition = myOpenTaskQuery.createCondition({
				fieldId: 'custrecord_wmsse_order_no',
				operator: query.Operator.ANY_OF,
				values: woInternalId
			});

			myOpenTaskQuery.condition = myOpenTaskQuery.and(statusFlagCondition, taskTypeCondition, inActiveCondition, orderInternalIdCondition);

			myOpenTaskQuery.columns = [
				myOpenTaskQuery.createColumn({
					fieldId: 'custrecord_wmsse_line_no',
					groupBy: true
				})];

			var myPagedData = myOpenTaskQuery.runPaged({
				pageSize: 1000
			});

			totalSearchCount = myPagedData.count;
			log.debug('totalSearchCount', totalSearchCount);
			return totalSearchCount;
		}
		function nextPickTaskCheckForWOoverpicking(transactionInternalId, woItemListResults) {
			var openTaskItemCount = 0;
			var nextPickTaskFlagForOverpicking = false;
			openTaskItemCount = getWOcompItemsCountFromOpenTask(transactionInternalId);
			var WOitemsCount = woItemListResults.length;
			if (parseInt(openTaskItemCount) < parseInt(WOitemsCount)) {
				nextPickTaskFlagForOverpicking = true;
			}
			log.debug({ title: 'nextPickTaskFlagForOverpicking :', details: nextPickTaskFlagForOverpicking });
			return nextPickTaskFlagForOverpicking;
		}
		function checkMFGbundleExistOrNot() {
			var mfgBundleExist = false;
			try {
				// to check manufacturing mobile bundle exists or not
				var filters = [search.createFilter({
					name: "scriptid",
					operator: "IS",
					values: 'customrecord_mfgmob_productionreporting'
				})];

				var searchColumns = ["name", "scriptid"];

				var recordSearch = search.create({
					type: 'customrecordtype',
					filters: filters,
					columns: searchColumns
				});

				var results = [];
				var searchPageData;
				var pageSize = recordSearch.runPaged().count;

				var searchData = recordSearch.runPaged({
					pageSize: pageSize
				});
				searchData.pageRanges
					.forEach(function (pageRange) {
						searchPageData = searchData.fetch({
							index: pageRange.index
						});
						searchPageData.data
							.forEach(function (result) {
								results.push(result);
							});
					});

				if (results && results.length > 0) {
					recId = results[0].id;
					mfgBundleExist = true;
				}
			}
			catch (e) {
				log.error({ title: 'error in  checkMFGbundleExistOrNot', details: e });
			}
			log.debug({ title: 'mfgBundleExist', details: mfgBundleExist });
			return mfgBundleExist;
		}

		function getStagedOpenTaskCount(woInternalid) {
			var totalSearchCount = 0;
			try {
				const woTransactionQuery = query.create({
					type: 'customrecord_wmsse_trn_opentask'
				});
				var cond1 = woTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_wms_status_flag',
					operator: query.Operator.ANY_OF,
					values: 8
				});
				var cond2 = woTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_tasktype',
					operator: query.Operator.ANY_OF,
					values: 3
				});
				var cond3 = woTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_nstrn_ref_no',
					operator: query.Operator.EMPTY_NOT
				});
				var cond4 = woTransactionQuery.createCondition({
					fieldId: 'custrecord_wmsse_order_no',
					operator: query.Operator.ANY_OF,
					values: woInternalid
				});
				woTransactionQuery.condition = woTransactionQuery.and(
					cond1, cond2, cond3, cond4);
				woTransactionQuery.columns = [
					woTransactionQuery.createColumn({
						fieldId: 'custrecord_wmsse_line_no',
						groupBy: true
					})
				];
				var myPagedData = woTransactionQuery.runPaged({
					pageSize: 1000
				});
				totalSearchCount = myPagedData.count;
				log.debug('totalSearchCount', totalSearchCount);

			}
			catch (e) {
				log.error('Exception in getStagedOpenTaskCount', e);
			}
			return totalSearchCount;
		}

		function getBackOrderedWOlist(whLocation, woInternalId) {
			var backOrderedWOinternalIdArr = [];
			try {
				var workOrderListSearch = search.load({
					id: 'customsearch_wms_workorder_list_fullycom'
				});
				workOrderListSearch.filters.push(
					search.createFilter({
						name: 'location',
						operator: search.Operator.ANYOF,
						values: whLocation
					})
				);
				if (utility.isValueValid(woInternalId)) {
					workOrderListSearch.filters.push(
						search.createFilter({
							name: 'internalid',
							operator: search.Operator.ANYOF,
							values: woInternalId
						})
					);
				}
				var backOrderWOListResults = utility.getSearchResultInJSON(workOrderListSearch);
				if (backOrderWOListResults.length > 0) {
					for (var orderListIndex = 0; orderListIndex < backOrderWOListResults.length; orderListIndex++) {
						var woOrderInternalId = backOrderWOListResults[orderListIndex]['internalid'];
						backOrderedWOinternalIdArr.push(woOrderInternalId);
					}
				}
			}
			catch (e) {
				log.error('Exception in getBackOrderedWOlist function', e);
			}
			return backOrderedWOinternalIdArr;
		}
		function getOpenTaskDetailsForWorkOrder(warehouseLocationId, transactionInternalId, openTaskinternalIdarray) {
			try {
				var openTaskDetails = {};
				var openTaskSearch = search.load({
					id: 'customsearch_wms_wo_pickrev_opentaskdet'
				});
				openTaskSearch.filters.push(
					search.createFilter({
						name: 'custrecord_wmsse_wms_location',
						operator: search.Operator.ANYOF,
						values: warehouseLocationId
					})
				);
				if (utility.isValueValid(transactionInternalId)) {
					openTaskSearch.filters.push(
						search.createFilter({
							name: 'custrecord_wmsse_order_no',
							operator: search.Operator.ANYOF,
							values: transactionInternalId
						})
					);
				}
				if (utility.isValueValid(openTaskinternalIdarray) && openTaskinternalIdarray.length > 0) {
					openTaskSearch.filters.push(
						search.createFilter({
							name: 'internalid',
							operator: search.Operator.ANYOF,
							values: openTaskinternalIdarray
						})
					);
				}
				openTaskDetails = utility.getSearchResultInJSON(openTaskSearch);

			}
			catch (e) {
				log.error('Exception in getOpenTaskDetailsForWorkOrder function', e);
			}
			return openTaskDetails;
		}

		function moveOpentaskRecordToClosedTask(openTaskdetails, binTransferId) {
			try {
				var resultsObj = {};
				var actualQuantity = 0;
				var openTaskDeleteRecordId = '';
				var currentDate = utility.DateStamp();
				var parsedCurrentDate = format.parse({
					value: currentDate,
					type: format.Type.DATE
				});
				var closedTaskRecord = record.create({
					type: 'customrecord_wmsse_trn_closedtask'
				});

				closedTaskRecord.setValue({ fieldId: 'name', value: openTaskdetails.name });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_task_opentaskid_clt', value: openTaskdetails.id });

				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_act_begin_date)) {
					var actualbegintDate = openTaskdetails.custrecord_wmsse_act_begin_date;
					var parsedactualbegintDate = format.parse({
						value: actualbegintDate,
						type: format.Type.DATE
					});
					closedTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_act_begin_date_clt',
						value: parsedactualbegintDate
					});
				}
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_act_end_date))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_act_end_date_clt', value: parsedCurrentDate });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_act_qty_clt', value: openTaskdetails.custrecord_wmsse_act_qty });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_batch_no))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_batch_no_clt', value: openTaskdetails.custrecord_wmsse_batch_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_comp_id))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_comp_id_clt', value: openTaskdetails.custrecord_wmsse_comp_id });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_currentdate))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_currentdate_clt', value: openTaskdetails.custrecord_wmsse_currentdate });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_sku))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_sku_clt', value: openTaskdetails.custrecord_wmsse_sku });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_skudesc_clt', value: openTaskdetails.custrecord_wmsse_skudesc });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_expe_qty_clt', value: openTaskdetails.custrecord_wmsse_expe_qty });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_line_no_clt', value: openTaskdetails.custrecord_wmsse_line_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_wms_status_flag))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_wms_status_flag_clt', value: 32 });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_tasktype))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_tasktype_clt', value: openTaskdetails.custrecord_wmsse_tasktype });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_upd_user_no))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_upd_user_no_clt', value: openTaskdetails.custrecord_wmsse_upd_user_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_actbeginloc))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_actbeginloc_clt', value: openTaskdetails.custrecord_wmsse_actbeginloc });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_actendloc))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_actendloc_clt', value: openTaskdetails.custrecord_wmsse_actendloc });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_expirydate))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_expirydate_clt', value: openTaskdetails.custrecord_wmsse_expirydate });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_fifodate))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_fifodate_clt', value: openTaskdetails.custrecord_wmsse_fifodate });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_order_no))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_order_no_clt', value: openTaskdetails.custrecord_wmsse_order_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_wms_location))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_wms_location_clt', value: openTaskdetails.custrecord_wmsse_wms_location });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_zone_no))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_zone_no_clt', value: openTaskdetails.custrecord_wmsse_zone_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_parent_sku_no))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_parent_sku_no_clt', value: openTaskdetails.custrecord_wmsse_parent_sku_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_nsconfirm_ref_no))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_nsconfirm_ref_no_clt', value: openTaskdetails.custrecord_wmsse_nsconfirm_ref_no });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_serial_no_clt', value: openTaskdetails.custrecord_wmsse_serial_no });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_customer))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_customer_clt', value: openTaskdetails.custrecord_wmsse_customer });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_actualbegintime)) {
					var parsedBeginTime = parseTimeString(openTaskdetails.custrecord_wmsse_actualbegintime);
					log.debug('parsedBeginTime', parsedBeginTime);
					closedTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_actualbegintime_clt',
						value: parsedBeginTime
					});
				}
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_actualendtime)) {
					var parsedEndTime = parseTimeString(openTaskdetails.custrecord_wmsse_actualendtime);
					closedTaskRecord.setValue({
						fieldId: 'custrecord_wmsse_actualendtime_clt',
						value: parsedEndTime
					});
				}
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_batch_num_clt', value: openTaskdetails.custrecord_wmsse_batch_num });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_compitm_expqty_clt', value: openTaskdetails.custrecord_wmsse_compitm_expqty });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_compitm_actqty_clt', value: openTaskdetails.custrecord_wmsse_compitm_actqty });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_multi_bins_clt', value: openTaskdetails.custrecord_wmsse_multi_bins });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_uom_clt', value: openTaskdetails.custrecord_wmsse_uom });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_conversionrate))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_conversionrate_clt', value: openTaskdetails.custrecord_wmsse_conversionrate });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_orderindex_clt', value: openTaskdetails.custrecord_wmsse_orderindex });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_task_assignedto))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_task_assignedto_clt', value: openTaskdetails.custrecord_wmsse_task_assignedto });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_orderindex_clt', value: openTaskdetails.custrecord_wmsse_orderindex });
				if (utility.isValueValid(openTaskdetails.lastmodified))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_lastmodified_clt', value: openTaskdetails.lastmodified });
				closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_notes_clt', value: "WorkOrder PickReversal" });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_inventorystatus))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_inventorystatus_clt', value: openTaskdetails.custrecord_wmsse_inventorystatus });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_stagebinloc))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_stagebinloc_clt', value: openTaskdetails.custrecord_wmsse_stagebinloc });
				if (utility.isValueValid(openTaskdetails.custrecord_wmsse_pick_comp_date))
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_pick_comp_date_clt', value: openTaskdetails.custrecord_wmsse_pick_comp_date });
				if (utility.isValueValid(binTransferId)) {
					closedTaskRecord.setValue({ fieldId: 'custrecord_wmsse_nstrn_ref_no_clt', value: binTransferId });
				}
				closedTaskRecord = closedTaskRecord.save();
				if (utility.isValueValid(closedTaskRecord)) {
					openTaskDeleteRecordId = record.delete({
						type: 'customrecord_wmsse_trn_opentask',
						id: openTaskdetails.id
					});
				}
				resultsObj.closedTaskRecord = closedTaskRecord;
				resultsObj.deletedOpenTaskRecord = openTaskDeleteRecordId;
			}
			catch (e) {
				resultsObj.closedTaskRecord = "";
				resultsObj.deletedOpenTaskRecord = "";
				resultsObj.errorMessage = e.message;
				log.error('exception in moveOpentaskRecordToClosedTask function', e);
			}
			log.debug('Results Object', resultsObj);
			return resultsObj
		}

		function convertQuantityInStockUnits(itemInternalId, enterQuantity, transactionUOMConvRate) {
			var convertedQuantity = enterQuantity;
			var stockUnitText = '';
			var unitType = '';
			try {
				var itemLookUp = search.lookupFields({
					type: search.Type.ITEM,
					id: itemInternalId,
					columns: ['unitstype', 'stockunit']
				});
				if (utility.isValueValid(itemLookUp.unitstype) && utility.isValueValid(itemLookUp.unitstype[0])) {
					unitType = itemLookUp.unitstype[0].value;
				}
				if (utility.isValueValid(itemLookUp.stockunit) && utility.isValueValid(itemLookUp.stockunit[0])) {
					stockUnitText = itemLookUp.stockunit[0].text;
				}
				if (utility.isValueValid(stockUnitText) && utility.isValueValid(unitType)) {
					var stockConversionRate = utility.getConversionRate(stockUnitText, unitType);
					log.debug('stockConversionRate', stockConversionRate);
					if (!(utility.isValueValid(stockConversionRate))) {
						stockConversionRate = 1;
					}
					var conersionRate = Number(Big(transactionUOMConvRate).div(stockConversionRate));
					convertedQuantity = parseFloat(Number(Big(convertedQuantity).mul(conersionRate)).toFixed(8));
				}
			}
			catch (exp) {
				log.error("Error in convertQuantityInStockUnits function ", exp);
			}
			log.debug('Return convertedQuantity', convertedQuantity);
			return convertedQuantity;
		}

		return {
			getWOList: getWOList,
			getWODetails: getWODetails,
			fnToValidateWO: fnToValidateWO,
			getWOpickQty: getWOpickQty,
			getWOLineItemList: getWOLineItemList,
			getOpentaskPickQtyDetails: getOpentaskPickQtyDetails,
			//getWOPickBinDetails : getWOPickBinDetails,
			getInventoryBalance: getInventoryBalance,
			getOPenTaskPickBinDetails: getOPenTaskPickBinDetails,
			createOpenTaskForWorkOrder: createOpenTaskForWorkOrder,
			getbasicItemDetails: getbasicItemDetails,
			getStagedTaskDetails: getStagedTaskDetails,
			getSerialEntry: getSerialEntry,
			createSerialEntries: createSerialEntries,
			validateStageBin: validateStageBin,
			fetchingComponentsforStaging: fetchingComponentsforStaging,
			woBinTransfer: woBinTransfer,
			updateMoveOpenTask: updateMoveOpenTask,
			showNextPickTaskButton: showNextPickTaskButton,
			getWOStageflag: getWOStageflag,
			isInventoryTypeItem: isInventoryTypeItem,
			getOpenTaskSerialEntries: getOpenTaskSerialEntries,
			validateItemForAssembly: validateItemForAssembly,
			getOpenTaskDtlForAssembly: getOpenTaskDtlForAssembly,
			getTransactionDtlForAssembly: getTransactionDtlForAssembly,
			isInventoryNumberExists: isInventoryNumberExists,
			getOpenTaskDetailsforAssemblycomplete: getOpenTaskDetailsforAssemblycomplete,
			//  getPutBinAndIntDetails : getPutBinAndIntDetails,
			checkComponentItemsQty: checkComponentItemsQty,
			createAssemblyBuildRec: createAssemblyBuildRec,
			getOpenTaskDetailsforSerial: getOpenTaskDetailsforSerial,
			getMemberItemQtyForWO: getMemberItemQtyForWO,
			getOpenTaskDetailsforBuild: getOpenTaskDetailsforBuild,
			getSerialsforWObuild: getSerialsforWObuild,
			getItemStockUOMdetails: getItemStockUOMdetails,
			getWODetailsforAssembly: getWODetailsforAssembly,
			getRecommendedBinswithPickPathAPI: getRecommendedBinswithPickPathAPI,
			splitOpenTaskRecordsForWO: splitOpenTaskRecordsForWO,
			cloneOpenTaskRecord: cloneOpenTaskRecord,
			buildParameterObject: buildParameterObject,
			getOpenTaskLineDetails: getOpenTaskLineDetails,
			noCodeSolForWO: noCodeSolForWO,
			getUomDetails: getUomDetails,
			getItemTypeDetails: getItemTypeDetails,
			updateOpenTaskInWOStaging: updateOpenTaskInWOStaging,
			getOpentaskQtyWithInventoryNumber: getOpentaskQtyWithInventoryNumber,
			updateOpentaskQtyForInvNumber: updateOpentaskQtyForInvNumber,
			getWorkOrderDetails: _getWorkOrderDetails,
			woOverpickingFlag: woOverpickingFlag,
			getWOcompItemsCountFromOpenTask: getWOcompItemsCountFromOpenTask,
			nextPickTaskCheckForWOoverpicking: nextPickTaskCheckForWOoverpicking,
			checkMFGbundleExistOrNot: checkMFGbundleExistOrNot,
			getStagedOpenTaskCount: getStagedOpenTaskCount,
			getBackOrderedWOlist: getBackOrderedWOlist,
			getOpenTaskDetailsForWorkOrder: getOpenTaskDetailsForWorkOrder,
			moveOpentaskRecordToClosedTask: moveOpentaskRecordToClosedTask,
			convertQuantityInStockUnits: convertQuantityInStockUnits

		}
	});
