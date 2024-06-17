/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['./wms_utility','./wms_translator','./wms_outBoundUtility','N/runtime', 'N/search'],



	function(utility,translator,obUtility,runtime,search) {

		/**
		 * Function to fetch orders
		 */
		var orderIndxArr = [];
		var isZonePickingEnabled=false;
		var selectedZones=[];
		function doPost(requestBody) {

			var orderListDetailsArr = {};
			var debugString = '';
			var requestParams = '';
			try{
				requestParams = requestBody.params;
				if(utility.isValueValid(requestParams))	{

					debugString = debugString + "requestParams :"+requestParams;
					//log.debug({title:'requestParams',details:requestParams});
					var warehouseLocationId = requestParams.warehouseLocationId;
					var transactionType = requestParams.transactionType;
					var pickingMode = requestParams.pickingMode;
					isZonePickingEnabled = requestParams.isZonePickingEnabled;
					selectedZones = requestParams.selectedZones;
					isZonePickingEnabled = isZonePickingEnabled || false;
					selectedZones = selectedZones || [];


					if(utility.isValueValid(warehouseLocationId)){
						var orderDetails = {};
						orderDetails.whLocationId = warehouseLocationId;
						orderDetails.transactionType = transactionType;
						orderDetails.isZonePickingEnabled = isZonePickingEnabled;
						if(!utility.isValueValid(pickingMode) || pickingMode == 'wavepicking') {

							var maxno = -1;


							var orderListArr = getPickingOrderDetails(orderDetails,callBackFunc,maxno,null);

						}
						log.debug({title:'orderListArr',details:orderListArr});



						if(orderListArr.length > 0)	{
							orderListDetailsArr.orderList = orderListArr;
							orderListDetailsArr.isValid = true;
						}
						else{
							orderListDetailsArr.errorMessage  = translator.getTranslationString("SINGLEORDERPICKING.NOORDERSTOSHOW");
							orderListDetailsArr.isValid = false;
						}
					}
					else{
						orderListDetailsArr.errorMessage  = translator.getTranslationString("SINGLEORDERPICKING.NOORDERSTOSHOW");
						orderListDetailsArr.isValid = false;
					}
				}
				else{
					orderListDetailsArr.isValid = false;
				}
			}
			catch(e){

				orderListDetailsArr.isValid = false;
				orderListDetailsArr.errorMessage = e.message;
				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
				log.error({title:'debugString',details:debugString});
			}
			return orderListDetailsArr;
		}
		function callBackFunc(searchResult, searchResults){



			//log.error({title:'searchResult', details:searchResult});

			var resultObj = {};
			var columnsArray = searchResult.columns;
			var columnKeys =[];
			var currRow='';


			for (var j in columnsArray) {

				var columnObj = columnsArray[j];
				var column = columnObj.name;
				var columnSummary = columnObj.summary;
				var columnLabel = columnObj.label;
				var columnJoin = columnObj.join;
				var columnType = columnObj.type;

				if (column == 'formulanumeric' || column == 'formuladate' || column == 'formulatext') {
					resultObj[columnLabel] = searchResult.getValue(columnsArray[j]);
				}
				else {
					var columnValue = searchResult.getValue({name: column,	summary: columnSummary,	join: columnJoin });
					if(columnKeys.indexOf(column) != -1){

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

							if(column == 'tranidText'){

								resultObj[column] = columnText;

							}

						}

						else

						{

							var columnName = column + "Text";

							resultObj[columnName] = '';

						}

					}

				}



				resultObj.id = searchResult.id;

				resultObj.recordType = searchResult.recordType;

			}

			var quantitycommitted = 0;

			var quantitycommittedText = 0;

			var line = 0;

			var currentUserId = runtime.getCurrentUser();

			var userId=currentUserId.id;

			var picker = resultObj.picker;

			var tranid = resultObj.tranid;

			var lineitemStatus = resultObj.lineitemstatus;

			if(!utility.isValueValid(picker))

			{

				PickerStatus = "Not Started"

			}

			else if(picker && userId!=picker)

			{

				PickerStatus = "Started"

			}

			else

			{

				PickerStatus = "Started"

			}

			

			if((userId==picker || !utility.isValueValid(picker)) && lineitemStatus!='DONE' ) {

				quantitycommitted = resultObj.quantitycommitted;

				quantitycommittedText = resultObj.quantitycommittedText;

				var DateCreated = resultObj['Date Created'];

				var internalid = resultObj.internalid;

				var internalidText = resultObj.internalidText;

				var customer = resultObj.customer;

				var customerText = resultObj.customerText;

				var priority = resultObj.priority;

				var tranidText = resultObj.tranid;

				var shipdate = resultObj.shipdate;

				var shipvia = resultObj.shipvia;

				var shipviaText = resultObj.shipviaText;

				line = resultObj.line;

				var location = resultObj.location;

				var locationText = resultObj.locationText;

				var transactiontype = resultObj.transactiontype;

				var transactiontypeText = resultObj.transactiontypeText;

				var wavename = resultObj.wavename;

                var wavenameText = resultObj.wavenameText;

				if (isZonePickingEnabled == true && utility.isValueValid(selectedZones) && selectedZones.length > 0) {

					var zoneId = resultObj.zone;

					if (!utility.isValueValid(zoneId)) {

						zoneId = "0";



					} else {

						zoneId = parseInt(zoneId);

					}

					if (selectedZones.indexOf(zoneId) != -1 || (userId==picker) ) {

						var ordIndx = orderIndxArr.indexOf(resultObj.internalid);

						if (ordIndx == -1) {

							currRow = {

								quantitycommitted: quantitycommitted,

								quantitycommittedText: quantitycommittedText,

								internalid: internalid,

								internalidText: internalidText,

								picker: picker,

								PickerStatus: PickerStatus,

								customer: customer,

								line: line,

								customerText: customerText,

								priority: priority,

								tranid: tranid,

								tranidText: tranidText,

								shipdate: shipdate,

								shipvia: shipvia,

								shipviaText: shipviaText,

								location: location,

								locationText: locationText,

								transactiontype: transactiontype,

								transactiontypeText: transactiontypeText,

								'Date Created': DateCreated,

								wavename: wavename,

                                wavenameText: wavenameText

							};

							searchResults.push(currRow);

							orderIndxArr.push(resultObj.internalid);

						} else {

							var currRow = searchResults[ordIndx];

							searchResults[ordIndx].quantitycommitted = parseFloat(currRow.quantitycommitted) + parseFloat(resultObj.quantitycommitted);

							searchResults[ordIndx].line = parseInt(currRow.line) + parseInt(resultObj.line);
							searchResults[ordIndx].PickerStatus = PickerStatus;



						}

					}





				} else {

					var ordIndx = orderIndxArr.indexOf(resultObj.internalid);

					if (ordIndx == -1) {

						currRow = {

							quantitycommitted: quantitycommitted,

							quantitycommittedText: quantitycommittedText,

							internalid: internalid,

							internalidText: internalidText,

							picker: picker,

							PickerStatus: PickerStatus,

							customer: customer,

							line: line,

							customerText: customerText,

							priority: priority,

							tranid: tranid,

							tranidText: tranidText,

							shipdate: shipdate,

							shipvia: shipvia,

							shipviaText: shipviaText,

							location: location,

							locationText: locationText,

							transactiontype: transactiontype,

							transactiontypeText: transactiontypeText,

							'Date Created': DateCreated,

							wavename: wavename,

                            wavenameText: wavenameText

						};

						searchResults.push(currRow);

						orderIndxArr.push(resultObj.internalid);

					} else {

						var currRow = searchResults[ordIndx];
						if(currRow!=null && currRow!=''&& currRow!=undefined) {
							searchResults[ordIndx].quantitycommitted = parseFloat(currRow.quantitycommitted) + parseFloat(resultObj.quantitycommitted);

							searchResults[ordIndx].line = parseInt(currRow.line) + parseInt(resultObj.line);



							searchResults[ordIndx].PickerStatus = PickerStatus;

						}



					}



				}

			}

			else

			{

				var ordIndx = orderIndxArr.indexOf(resultObj.internalid);


				if (ordIndx != -1) {

					var currRow = searchResults[ordIndx];

					if(currRow!=null && currRow!=''&& currRow!=undefined)
					{

						searchResults[ordIndx].PickerStatus = PickerStatus;

					}




				}



			}



		}

        function getPickingOrderDetails(orderParams,callBackFuncntion,maxno,callbackResultObj)
        {
            var getOrderName = orderParams.orderName;
            var strLocation = orderParams.whLocationId;
            var transactionType = orderParams.transactionType;
            var isZonePickingEnabled = orderParams.isZonePickingEnabled;
            var currentUserId=orderParams.currentUserId;
            var orderSearch = '';

            if(transactionType == 'TrnfrOrd')
            {
                orderSearch = search.load({id:'customsearch_wmsse_toorders_list'});
            }
            else
            {
                orderSearch = search.load({id:'customsearch_wmsse_orders_list'});
            }
            var orderSearchFilters = orderSearch.filters;
            if(utility.isValueValid(getOrderName))
            {
                orderSearchFilters.push(search.createFilter({
                    name:'tranid',
                    join:'transaction',
                    operator:search.Operator.IS,
                    values:getOrderName}));
            }
			if(maxno != -1)
			{
				orderSearchFilters.push(search.createFilter({
					name:'internalidnumber',
					join:'transaction',
					operator:search.Operator.GREATERTHAN,
					values:maxno}));
			}
			else
			{
				callbackResultObj=[];
			}
            if(utility.isValueValid(strLocation))
            {
                orderSearchFilters.push(search.createFilter({
                    name:'location',
                    operator:search.Operator.ANYOF,
                    values:['@NONE@',strLocation]}));
            }
            if(utility.isValueValid(transactionType))
            {
                orderSearchFilters.push(search.createFilter({
                    name:'type',
                    join:'transaction',
                    operator:search.Operator.IS,
                    values:transactionType}));
            }

            if(utility.isValueValid(currentUserId)) {
                orderSearchFilters.push(search.createFilter({
                    name: 'picker',
                    operator: search.Operator.ANYOF,
                    values: ['@NONE@', currentUserId]
                }));
            }
            orderSearch.filters = orderSearchFilters;

			var orderSearchColumns = orderSearch.columns;

			if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
                orderSearchColumns.push(search.createColumn({
                    name:'zone',
                    join:'binnumber',
                    summary:'group'
                }))
            }

			orderSearchColumns.push(search.createColumn({
				name:'wavename',
				summary:'group'
			}))
			
			orderSearch.cloumns = orderSearchColumns;

            var	 objOrderSearchDetails = getSearchResultInJSON(orderSearch,callBackFuncntion,callbackResultObj,maxno,orderParams);


            log.debug({title:'objOrderSearchDetails',details:objOrderSearchDetails.length});
            return objOrderSearchDetails;
        }
        function getSearchResultInJSON(searchObj, callback, callbackResultObj,maxno,orderParams) {
            // if callback and callbackResultObj are undefined, default behaviour is
            // 1 result -> 1 object
            if (callback == undefined || callback == '') {
                callback = _searchResultToJson;
            }
            if (callbackResultObj == undefined) {
                callbackResultObj = []; // initialize as array
            }
            var search_page_count = 4000;


			var q=0;
			var myPagedData=searchObj.run().each(function(result){
				// .run().each has a limit of 4,000 results
				q++
				callback(result,callbackResultObj);
				if(q==4000)
				{

					maxno = result.getValue({name:'internalid',join:'transaction',summary:'group'});
					log.debug({title:'maxno',details:maxno});
					getPickingOrderDetails(orderParams,callback,maxno,callbackResultObj)
					return false;
				}
				else {
					return true;
				}

			});



            return callbackResultObj;
        }

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

                resultObj['id'] = searchResult.id;
                resultObj['recordType'] = searchResult.recordType;
            }
            searchResults.push(resultObj);
        }

		return {
			'post': doPost
		};
	});
