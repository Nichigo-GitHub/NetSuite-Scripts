/**
 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NModuleScope public
 */
 define(['N/search'],
 	function (search) {

 		function getItemStockLocations(inputParamObj){
 			log.debug('inputParamObj',inputParamObj);
 			var	 itemStockLocationResults=[];
 			var itemStockLocationSrch = search.load({
 				id:'customsearch_wms_item_stocklocation_srch'
 			});
 			itemStockLocationSrch.filters.push(
 				search.createFilter({
 					name:'custrecord_wms_stock_location',
 					operator:search.Operator.ANYOF,
 					values: inputParamObj.stockLocation
 				})
 				);
 			itemStockLocationSrch.filters.push(
 				search.createFilter({
 					name:'custrecord_wms_stock_item',
 					operator:search.Operator.ANYOF,
 					values: inputParamObj.item
 				})
 				);
 			if(inputParamObj.preferredLocationCheck ){
 				itemStockLocationSrch.filters.push(
 					search.createFilter({
 						name:'custrecord_wms_preferred_itemlocation',
 						operator:search.Operator.IS,
 						values: true
 					})
 					);
 			}else{
 				if(_isValueValid(inputParamObj.name)){
 					itemStockLocationSrch.filters.push(
 						search.createFilter({
 							name:'name',
 							operator:search.Operator.IS,
 							values: inputParamObj.name
 						})
 						);
 				}
 			}
 			if(_isValueValid(inputParamObj.currentRecordId)){
 				itemStockLocationSrch.filters.push(
 					search.createFilter({
 						name:'internalid',
 						operator:search.Operator.NONEOF,
 						values: inputParamObj.currentRecordId
 					})
 					);
 			}

 			itemStockLocationResults = _getSearchResultInJSON(itemStockLocationSrch);

 			return itemStockLocationResults;
 		}
 		function getNoBinsLocations(inputParamObj)
 		{
 			var locationNameSearch = search.load({id:'customsearch_wmsse_whloc_srh'});

 			locationNameSearch.filters.push(search.createFilter({
 				name:'usesbins',
 				operator:search.Operator.IS,
 				values:false
 			})); 
 			if(_isValueValid(inputParamObj) && _isValueValid(inputParamObj.stockLocation)){
 				locationNameSearch.filters.push(search.createFilter({
 					name:'internalid',
 					operator:search.Operator.ANYOF,
 					values:inputParamObj.stockLocation
 				})); 
 			}

 			var searchresults = _getSearchResultInJSON(locationNameSearch);
 			log.debug({title:'searchresults',details:searchresults});

 			return searchresults;
 		}
 		function _isValueValid(val)
 		{
 			var isNotNull = false;
 			if( typeof(val) == 'boolean')
 			{
 				val = val.toString();
 			}
 			if (val !== null && val !== '' && val !== 'null' && val !== undefined && val !== 'undefined')
 			{
 				isNotNull = true;
 			}

 			return isNotNull;
 		}
 		function _getSearchResultInJSON(searchObj, callback, callbackResultObj) {
		// if callback and callbackResultObj are undefined, default behaviour is
		// 1 result -> 1 object
		if (callback == undefined || callback == '') {
			callback = _searchResultToJson;
		}
		if (callbackResultObj == undefined) {
			callbackResultObj = []; // initialize as array
		}
		var search_page_count = 1000;
		var myPagedData = searchObj.runPaged({
			pageSize: search_page_count
		});
		myPagedData.pageRanges.forEach(function (pageRange) {
			var myPage = myPagedData.fetch({
				index: pageRange.index
			});
			myPage.data.forEach(function (result) {
				// get json of result
				callback(result,callbackResultObj);
			});
		});
		return callbackResultObj;
	}
	/**
	 * Converts Search result to JSON object
	 * 
	 * @param searchResult
	 *            each search result object
	 * @returns {Array} JSON equivalent of search object
	 */
	 function _searchResultToJson(searchResult, searchResults) {
	 	var resultObj = {};
	 	var columnsArray = searchResult.columns;
	 	var columnKeys =[];
	 	for (var j in columnsArray) {
	 		var columnObj = JSON.parse(JSON.stringify(columnsArray[j]));
	 		var column = columnObj.name;
	 		var columnSummary = columnObj.summary;
	 		var columnLabel = columnObj.label;
	 		var columnJoin = columnObj.join;
	 		var columnType = columnObj.type;
	 		if (column == 'formulanumeric' || column == 'formuladate' || column == 'formulatext') {
	 			var columnValue = searchResult.getValue(columnsArray[j]);
	 			resultObj[columnLabel] = columnValue;
	 		}
	 		else {
	 			var columnValue = searchResult.getValue({
	 				name: column,
	 				summary: columnSummary,
	 				join: columnJoin
	 			});
	 			if(columnKeys.indexOf(column) != -1)
	 			{
	 				columnKeys.push(columnLabel);
	 				resultObj[columnLabel] = columnValue;
	 			}
	 			else
	 			{
	 				columnKeys.push(column);
	 				resultObj[column] = columnValue;
	 			}
	 			if (columnType == 'select' || column == 'unit'  || typeof columnObj == 'object') {
	 				if(columnValue!= '')
	 				{
	 					var columnText = searchResult.getText({
	 						name: column,
	 						summary: columnSummary,
	 						join: columnJoin
	 					});
	 					var colName = column + "Text";
	 					resultObj[colName] = columnText;
	 				}
	 				else
	 				{
	 					var colName = column + "Text";
	 					resultObj[colName] = '';	
	 				}                                             
	 			}
	 		}

	 		resultObj.id = searchResult.id;
	 		resultObj.recordType = searchResult.recordType;
	 	}
	 	searchResults.push(resultObj);
	 }
	 return {
	 	getItemStockLocations : getItemStockLocations,
	 	getNoBinsLocations:getNoBinsLocations,
	 	isValueValid : _isValueValid
	 };
	});
