/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_translator'],
		function(search,utility,translator) {

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 */
	function doPost(requestBody) {
		
		var debugString = '';
		var warehouseLocationId;
		var shipmentInternalId;
		var shipmentListObj;
		var shipmentListDetails = {};

		try{
			if(utility.isValueValid(requestBody)) {

				var requestParams	= requestBody.params;
				debugString = debugString + 'Request Params :'+requestParams;
				warehouseLocationId  	= requestParams.warehouseLocationId;
				shipmentInternalId = requestParams.shipmentInternalId;
				log.debug({title:'Request Params :', details:requestParams});

				// calling the Get Shipment List method to get the eligible Shipments

				shipmentListObj = this.getItemReciptDetilasForISM(shipmentInternalId, warehouseLocationId);

				if(shipmentListObj.length > 0)
				{	
					shipmentListDetails = {
							shipmentList : shipmentListObj, 
							isValid      : true,
							itemsCount	 : shipmentListObj.itemsCount
					};
				}
				else
				{
					shipmentListDetails = {
							errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.NOMATCH'), //No Inbound Shipments pending receipt.
							isValid      : false
					};	
				}
			}
			else{
				shipmentListDetails = {
						errorMessage : translator.getTranslationString('ISM_SHIPMENTLIST.EMPTYPARAM'),
						isValid      : false
				};		
			}
		}
		catch(e)
		{
			shipmentListDetails.isValid = false;
			shipmentListDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}	

		return shipmentListDetails;
	}

	function getItemReciptDetilasForISM(shipmentInternalId, warehouseLocationId){
		var shipmentDetailsSrch = search.load({
			id : 'customsearch_wms_post_item_receipt_dtls',
			name : 'ISM Post Item Receipt Details List'
		});

		shipmentDetailsSrch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_wms_location',
			operator: search.Operator.ANYOF,
			values: warehouseLocationId
		}));

		shipmentDetailsSrch.filters.push(search.createFilter({
			name: 'custrecord_wmsse_inbshipment',
			operator: search.Operator.ANYOF,
			values: shipmentInternalId
		}));

		return utility.getSearchResultInJSON(shipmentDetailsSrch,callBackFunc);
	}
	function callBackFunc(searchResult, searchResults) {
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
		if(resultObj.custrecord_wmsse_uom != '- None -'){
			resultObj.custrecord_wmsse_act_qty_uom = 
				(resultObj.custrecord_wmsse_act_qty).concat(' ', resultObj.custrecord_wmsse_uom);
		}else{
			resultObj.custrecord_wmsse_act_qty_uom = resultObj.custrecord_wmsse_act_qty;
		}
		searchResults.push(resultObj);
	}


	return {
		'post': doPost,
		getItemReciptDetilasForISM : getItemReciptDetilasForISM
	};

});
