/**
 *    Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define([ 'N/runtime', 'N/currentRecord' , 'N/search' ,'../Restlets/wms_translator'],

		function(runtime, currentRecord ,search ,translator) {

	function saveRecord(scriptContext)
	{
		var subsidiaryFeature = runtime.isFeatureInEffect({
			feature: 'subsidiaries'
		});
		var currentRec = scriptContext.currentRecord;

		var cycleCountPlanNo = currentRec.getValue({
			fieldId : 'name'
		});

		if(cycleCountPlanNo == '' || cycleCountPlanNo == null)
		{
			alert(translator.getTranslationStringForClientScript('wms_Cyclecount.ENTER_PLAN_NAME'));
			return false;
		}

		var subsidiaryValue = currentRec.getValue({
			fieldId : 'custrecord_cycc_subsidiary'
		});

		if((subsidiaryValue == '' || subsidiaryValue == null) && subsidiaryFeature == true )
		{
			alert(translator.getTranslationStringForClientScript('wms_Cyclecount.ENTER_SUBSIDIARY'));
			return false;
		}
		var cycleCountPlanLocation = '';
		if(subsidiaryFeature == true)
		{
			cycleCountPlanLocation = currentRec.getValue({
				fieldId : 'custrecord_cycc_location'
			});
		}
		else
		{
			cycleCountPlanLocation = currentRec.getValue({
				fieldId : 'custrecord_cycc_nonworld_location'
			});
		}

		if(cycleCountPlanLocation == '' || cycleCountPlanLocation == null)
		{
			alert(translator.getTranslationStringForClientScript('wms_Cyclecount.ENTER_LOCATION'));
			return false;
		}

		var cycleCountPlanAccount = currentRec.getValue({
			fieldId : 'custrecord_cycc_account'
		});
		if(cycleCountPlanAccount == '' || cycleCountPlanAccount == null)
		{
			alert(translator.getTranslationStringForClientScript('wms_Cyclecount.ENTER_ACCOUNT'));
			return false;
		}
		// To restrict duplicate plans

		if(cycleCountPlanNo != null && cycleCountPlanNo != '')
		{
			var searchresults;
			var searchRec = search.load({
				id: 'customsearch_wms_new_cycc_plan_srch'
			});
			var filters = searchRec.filters;
			filters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: cycleCountPlanNo
			}));

			searchRec.filters = filters;
			searchresults = searchRec.run().getRange({
				start: 0, end: 1
			});

			if(searchresults != null && searchresults != '')
			{
				alert(translator.getTranslationStringForClientScript('wms_Cyclecount.PLAN_ALREADY_EXIST'));
				return false;
			}
		}
		var itemIdArr = [];
		var itemTxtArr = [];
		var subsidiary = '';
		if(subsidiaryFeature == true)
		{
			subsidiary = currentRec.getValue({
				fieldId : 'custrecord_cycc_subsidiary'
			});
			var itemId = currentRec.getValue({
				fieldId : 'custrecord_cycc_item'
			});
			var itemTxt = currentRec.getText({
				fieldId : 'custrecord_cycc_item'
			});
			if(itemId != null && itemId != '' && itemId != 'null')
			{
				itemIdArr = itemId.toString().split('');
			}
			if(itemTxt != null && itemTxt != '' && itemTxt != 'null')
			{
				itemTxtArr = itemTxt.toString().split('');
			}

			var validItemArr = [];
			var invalidItemArr = [];

			var itemcolumns= null;
			var itemFilters = null;
			var itemSearch = search.load({
				id: 'customsearch_wmsse_inv_basic_itemdetails'
			});
			itemFilters = itemSearch.filters;
			itemcolumns =  itemSearch.columns;
			if(subsidiary != null && subsidiary != '' && subsidiary != 'null' && subsidiaryFeature == true){
				itemFilters.push(search.createFilter({
					name : 'subsidiary',
					operator : search.Operator.ANYOF,
					values : subsidiary
				}));
			}
			if(itemId != null && itemId != '' && itemId != 'null'){
				itemFilters.push(search.createFilter({
					name : 'internalid',
					operator : search.Operator.ANYOF,
					values : itemId
				}));
			}

			itemcolumns.push(search.createColumn({
				name: 'itemid'
			}));

			itemSearch.columns = itemcolumns;
			itemSearch.filters = itemFilters;
			var itemResult = itemSearch.run().getRange({
				start: 0, end: 100
			});
			if(itemResult != null && itemResult != '')
			{
				for(var i=0;i<itemResult.length;i++)
				{
					validItemArr.push(itemResult[i].id);
				}
				for(var j=0;j<itemTxtArr.length;j++)
				{
					if(validItemArr.indexOf(itemId[j])==-1)
					{
						invalidItemArr.push(itemTxtArr[j]);
					}
				}
				if(invalidItemArr != null && invalidItemArr != '' && invalidItemArr.length>0)
				{
					var itemStr = invalidItemArr.toString();
					if(invalidItemArr.length>1)
					{
						itemStr = itemStr+' are';
					}
					else
					{
						itemStr = itemStr+' is';
					}
					alert(itemStr + translator.getTranslationStringForClientScript('wms_Cyclecount.NOT_MAPPED_SELECTED_SUBSIDIARY'));
					return false;
				}
			}
			else
			{
				alert(translator.getTranslationStringForClientScript('wms_Cyclecount.ITEMS_NOT_MAPPED_SELECTED_SUBSIDIARY'));
				return false;
			}
		}

		var binInternalId = currentRec.getValue({
			fieldId : 'custrecord_cycc_bins'
		});

		var binName = currentRec.getText({
			fieldId : 'custrecord_cycc_bins'
		});

		var binsInternalIdArr = [];
		var binsNameArr = [];
		var validBins = [];
		var inValidBins = [];

		if(binInternalId != null && binInternalId != '' && binInternalId != 'null')
		{
			if(binInternalId != null && binInternalId != '' && binInternalId != 'null')
			{
				binsInternalIdArr = binInternalId.toString().split('');
			}
			if(binName != null && binName != '' && binName != 'null')
			{
				binsNameArr = binName.toString().split('');
			}

			var binFilters= null;
			var binSearch = search.load({
				id: 'customsearch_wms_bin_details_search'
			});
			binFilters = binSearch.filters;
			if(cycleCountPlanLocation != null && cycleCountPlanLocation != '' && cycleCountPlanLocation != 'null'){
				binFilters.push(search.createFilter({
					name : 'location',
					operator : search.Operator.ANYOF,
					values : cycleCountPlanLocation
				}));
			}
			if(binsInternalIdArr != null && binsInternalIdArr != '' && binsInternalIdArr != 'null' && binsInternalIdArr.length>0){
				binFilters.push(search.createFilter({
					name : 'internalid',
					operator : search.Operator.ANYOF,
					values : binInternalId
				}));
			}
			binSearch.filters = binFilters;
			var binResult = binSearch.run().getRange({
				start: 0, end: 100
			});
			if(binResult != null && binResult != '')
			{
				for(var t=0;t<binResult.length;t++)
				{
					validBins.push(binResult[t].getValue('binnumber'));
				}
				for(var s=0;s<binsInternalIdArr.length;s++)
				{
					if(validBins.indexOf(binName[s]) == -1)
					{
						inValidBins.push(binsNameArr[s]);
					}
				}
				if(inValidBins != null && inValidBins != '' && inValidBins.length>0)
				{
					var binString = inValidBins.toString();
					if(inValidBins.length>1)
					{
						binString = binString+' are';
					}
					else
					{
						binString = binString+' is';
					}
					alert(binString + translator.getTranslationStringForClientScript('wms_Cyclecount.NOT_MAPPED_SELECTED_LOCATION'));
					return false;
				}
			}
			else
			{
				alert(translator.getTranslationStringForClientScript('wms_Cyclecount.BINS_NOT_MAPPED_SELECTED_LOCATION'));
				return false;
			}
		}

		return true;
	}

	function validateField(scriptContext)
	{
		var currentRecord = scriptContext.currentRecord;
		var subsidiaryFeature = runtime.isFeatureInEffect({
			feature: 'subsidiaries'
		});
		var userObj = runtime.getCurrentUser();
		var subsidiaryId = userObj.subsidiary;

		var name = scriptContext.fieldId;
		var subsidiary = '';
		if(name == 'custrecord_cycc_subsidiary')
		{
			if(subsidiaryId != null && subsidiaryId != '' && subsidiaryId != 'null' && subsidiaryId != 'undefined' && subsidiaryFeature == true)
			{
				subsidiary = currentRecord.getValue({
					fieldId : 'custrecord_cycc_subsidiary'
				});

				if(subsidiary == null || subsidiary == '')
				{
					alert(translator.getTranslationStringForClientScript('wms_Cyclecount.SUBSIDIARY_MANDATORY'));
					return false;
				}
				else
				{
					return true;
				}
			}
		}

		if(name == 'custrecord_cycc_location')
		{
			// To validate location in One World Account
			if(subsidiaryId != null && subsidiaryId != '' && subsidiaryId != 'null' && subsidiaryId != 'undefined' && subsidiaryFeature == true)
			{
				subsidiary = currentRecord.getValue({
					fieldId : 'custrecord_cycc_subsidiary'
				});

				var locationFilter= null;
				var locSearch = search.load({
					id: 'customsearch_wmsse_locsearchresults'
				});
				locationFilter = locSearch.filters;
				if(subsidiary != null && subsidiary != '' && subsidiary != 'null'){
					locationFilter.push(search.createFilter({
						name : 'subsidiary',
						operator : search.Operator.ANYOF,
						values : subsidiary
					}));
				}
				if(location != null && location != '' && location != 'null'){
					locationFilter.push(search.createFilter({
						name : 'internalid',
						operator : search.Operator.ANYOF,
						values : location
					}));
				}

				locSearch.filters = locationFilter;
				var locResult = locSearch.run().getRange({
					start: 0, end: 100
				});

				if(locResult == null || locResult == '' || locResult == 'null')
				{
					alert(translator.getTranslationStringForClientScript('wms_Cyclecount.LOCATION_NOT_MAPPED_SELECTED_SUBSIDIARY'));
					return false;
				}else
				{
					return true;
				}

			}
		}

		if(name == 'custrecord_cycc_account')
		{
			var cycAccount = '';		
			if(subsidiaryId != null && subsidiaryId != '' && subsidiaryId != 'null' && subsidiaryId != 'undefined' && subsidiaryFeature == true)
			{

				subsidiary = currentRecord.getValue({
					fieldId : 'custrecord_cycc_subsidiary'
				});

				cycAccount = currentRecord.getValue({
					fieldId : 'custrecord_cycc_account'
				});

				var accountFilter= null;
				var accountSearch = search.load({
					id: 'customsearch_wms_account_search'
				});
				accountFilter = accountSearch.filters;
				if(subsidiary != null && subsidiary != '' && subsidiary != 'null'){
					accountFilter.push(search.createFilter({
						name : 'subsidiary',
						operator : search.Operator.ANYOF,
						values : subsidiary
					}));
				}
				if(cycAccount != null && cycAccount != '' && cycAccount != 'null'){
					accountFilter.push(search.createFilter({
						name : 'internalid',
						operator : search.Operator.ANYOF,
						values : cycAccount
					}));
				}
				accountSearch.filters = accountFilter;
				var accResult = accountSearch.run().getRange({
					start: 0, end: 100
				});

				if(accResult == null || accResult == '' || accResult == 'null')
				{
					alert(translator.getTranslationStringForClientScript('wms_Cyclecount.ACCOUNT_NOT_MAPPED_SELECTED_SUBSIDIARY'));
					return false;
				}else
				{
					return true;
				}
			}
		}
		return true;
	}
	function fieldChanged(scriptContext)
	{
		var currentRecord = scriptContext.currentRecord;
		var name = scriptContext.fieldId;

		if(trim(name)==trim('custrecord_cycc_location'))
		{
			var cycleCountPlanLocation = currentRecord.getValue({
				fieldId : 'custrecord_cycc_location'
			});
			disableBinField(cycleCountPlanLocation,currentRecord);

		}
      if(trim(name)==trim('custrecord_cycc_nonworld_location'))
		{
			var cycleCountPlanLocation = currentRecord.getValue({
				fieldId : 'custrecord_cycc_nonworld_location'
			});
			if(cycleCountPlanLocation != undefined && cycleCountPlanLocation != null &&
				cycleCountPlanLocation != '' && cycleCountPlanLocation != 'null') {

				currentRecord.setValue({
					fieldId: 'custrecord_cycc_location', value: cycleCountPlanLocation
				});
			}

		}
		return true;

	}

	function disableBinField(location,currentRecord)
	{
		var locUseBinsFlag= "T";
		if(location!=null && location!='')
		{
			var locationDtl= search.lookupFields({
				type :'location',
				id :location,
				columns : 'usesbins'
			});


			locUseBinsFlag = locationDtl.usesbins;			
		}	

		var zoneField = '';
		var zeroBinField = '';
		var aisleField = '';
		var binRowSortField = '';
		var binField = '';

		if(locUseBinsFlag == 'F')
		{		
			currentRecord.setValue({
				fieldId: 'custrecord_cycc_aisle',
				value: null
			});

			currentRecord.setValue({
				fieldId: 'custrecord_cycc_binswithzeroquantity',
				value: false
			});

			currentRecord.setValue({
				fieldId: 'custrecord_cycc_sortrowsbybin',
				value: false
			});

			var zoneValue = currentRecord.getValue({
				fieldId : 'custrecord_cycc_zones'
			});            

			if(zoneValue!=null && zoneValue!='')
			{
				currentRecord.setText({
					fieldId: 'custrecord_cycc_zones',
					value: ''
				});
			}

			var binValue = currentRecord.getValue({
				fieldId : 'custrecord_cycc_bins'
			});

			if(binValue!=null && binValue!='')
			{
				currentRecord.setText({
					fieldId: 'custrecord_cycc_bins',
					value: ''
				});
			}

			zoneField = currentRecord.getField({
				fieldId: 'custrecord_cycc_zones'
			});
			zoneField.isDisabled = true;

			zeroBinField = currentRecord.getField({
				fieldId: 'custrecord_wmsse_ccp_count_binrowszqty'
			});
			zeroBinField.isDisabled = true;

			aisleField = currentRecord.getField({
				fieldId: 'custrecord_cycc_aisle'
			});
			aisleField.isDisabled = true;

			binRowSortField = currentRecord.getField({
				fieldId: 'custrecord_cycc_sortrowsbybin'
			});
			binRowSortField.isDisabled = true;

			binField = currentRecord.getField({
				fieldId: 'custrecord_cycc_bins'
			});
			binField.isDisabled = true;
		}
		else
		{
			zoneField = currentRecord.getField({
				fieldId: 'custrecord_cycc_zones'
			});
			zoneField.isDisabled = false;

			zeroBinField = currentRecord.getField({
				fieldId: 'custrecord_cycc_binswithzeroquantity'
			});
			zeroBinField.isDisabled = false;

			aisleField = currentRecord.getField({
				fieldId: 'custrecord_cycc_aisle'
			});
			aisleField.isDisabled = false;

			binRowSortField = currentRecord.getField({
				fieldId: 'custrecord_cycc_sortrowsbybin'
			});
			binRowSortField.isDisabled = false;

			binField = currentRecord.getField({
				fieldId: 'custrecord_cycc_bins'
			});
			binField.isDisabled = false;
		}	

	}

	return {
		saveRecord:saveRecord,
		validateField:validateField,
		fieldChanged:fieldChanged
	};

});
