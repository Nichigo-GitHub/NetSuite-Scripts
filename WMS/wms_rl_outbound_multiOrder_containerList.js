/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_translator','N/runtime','./wms_outBoundUtility','./wms_tallyScan_utility','N/query'],
		function(search,utility,translator,runtime,obUtility,tallyScanUtility,query) {

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 */
	function doPost(requestBody) {

		var containerListArray = [];
		var containerListDetails 	= {};
		try{

			if(utility.isValueValid(requestBody)) 
			{

				var requestParams			= requestBody.params;
				var whLocation  				= requestParams.warehouseLocationId;
				var itemName            		= requestParams.itemName;
				var transactionInternalId = requestParams.transactionInternalId;
				var currentUser 				= runtime.getCurrentUser();
				var currentUserId 			= currentUser.id;
				var waveId =   requestParams.waveId;
				var pickingType =   requestParams.pickingType;
				var processNameFromState = requestParams.processNameFromState;
				var selectedZonesArr = requestParams.selectedZones;
				var  isZonePickingEnabled   = requestParams.isZonePickingEnabled;
				
				log.debug({title:'Request Params :', details:requestParams});

				if(utility.isValueValid(whLocation)  && utility.isValueValid(itemName) && utility.isValueValid(transactionInternalId))
				{	
					selectedZonesArr = selectedZonesArr || [];
					isZonePickingEnabled = isZonePickingEnabled || false;
					var containerListArr = [];
					var pickingPrintSystemRule = "Print pick carton labels?";
					var pickingPrintEnabled = 'N';
					var pickingPrintEnabledResult = tallyScanUtility.getSystemRuleValueforTallyScan(pickingPrintSystemRule,whLocation,processNameFromState);
					
					if(pickingPrintEnabledResult.length > 0){
						pickingPrintEnabled  = pickingPrintEnabledResult[0].custrecord_wmsserulevalue;
					}
					var zoneIdArr = [];
					if(isZonePickingEnabled == true){
						var selectedZonesArrLength = selectedZonesArr.length;
						if(selectedZonesArrLength > 0){
							if(selectedZonesArr.indexOf("0") != -1){
								zoneIdArr.push('@NONE@');
							}
							for(var zone = 0 ; zone < selectedZonesArrLength ;zone++){
								if(selectedZonesArr[zone] != "0"){
									zoneIdArr.push(selectedZonesArr[zone]);
								}
							}
						}
					}
					log.debug('zoneIdArr',zoneIdArr);
					var pickedContainerList = [];
					if(pickingType == 'MULTI'){
						 pickedContainerList = obUtility.getMultiOrderContainerList(whLocation,itemName,transactionInternalId,currentUserId,waveId,zoneIdArr);
					  log.debug('pickedContainerList',pickedContainerList);
						
					
					}
					else{
						pickedContainerList =  obUtility.getMultiOrderContainerList(whLocation,itemName,transactionInternalId,currentUserId,'',zoneIdArr);
					}
					if(pickedContainerList.length > 0){
						 var packedContainerNamesArr = [];
						 var packedCartonResults =  getPickCartonDetails(whLocation,transactionInternalId);
						 log.debug('packedCartonResults',packedCartonResults);
						 if(packedCartonResults.length > 0){
							var cartonResultsOfAllOrders = {};
							 for(var containerCounter = 0;containerCounter < packedCartonResults.length;containerCounter++ ){
								 var containerName = packedCartonResults[containerCounter].packcarton;
								 if(utility.isValueValid(containerName)  && packedContainerNamesArr.indexOf(containerName) == -1){
									if(containerCounter == 0){
									cartonResultsOfAllOrders = getAllCartonDetails(transactionInternalId,whLocation);
									}
									log.debug('cartonResultsOfAllOrderssss',cartonResultsOfAllOrders);									
									var isCartonPickedByOtherOrder = false;									
										for(var carton in cartonResultsOfAllOrders){
									  if(carton){
										if(containerName == carton && transactionInternalId != cartonResultsOfAllOrders[carton]){
										isCartonPickedByOtherOrder = true;
										break;
										}
									}
									}
									
									log.debug('isCartonPickedByOtherOrder',isCartonPickedByOtherOrder);
									if(isCartonPickedByOtherOrder == true){
									 packedContainerNamesArr.push(containerName);
									 }
								 }
							 }
						 }
						 log.debug('packedContainerNamesArr',packedContainerNamesArr);
						 for(var pickedkContainer = 0;pickedkContainer < pickedContainerList.length;pickedkContainer++ ){
							 var containerName = pickedContainerList[pickedkContainer].pickcarton;
							 if(utility.isValueValid(containerName)  && packedContainerNamesArr.indexOf(containerName) == -1){
								 containerListArr.push(pickedContainerList[pickedkContainer]);
							 }
						 }
						 log.debug('containerListArr',containerListArr);
						
					 }

					if(containerListArr.length==0)
					{
						containerListDetails = {
								isValid      : true,
								pickingprintenabled : pickingPrintEnabled
						};	
					}
					else
					{
						log.debug({title:'Container list:',details: containerListArr});
						
						var printedContainerListArr = [];
						
						var printedContainerList = this.getPrintedContainers(whLocation,transactionInternalId);
						
						for(var printedContainerIndex=0;printedContainerIndex<printedContainerList.length;printedContainerIndex++){
							var printedContainerListObj = printedContainerList[printedContainerIndex];
							printedContainerListArr.push(printedContainerListObj.custrecord_wms_cartonname);

						}
						for(var i=0;i<containerListArr.length;i++){
							var containerListObj = containerListArr[i];
							var containerObj = {};
							containerObj.Carton = containerListObj.pickcarton;					
							containerObj.Item = containerListObj.item;
							containerObj.Quantity = containerListObj.quantity;
							if(printedContainerListArr.indexOf(containerListObj.pickcarton) != -1){
								containerObj.Printed = translator.getTranslationString('CONTAINER.PRINT_YES');
							}else{
								containerObj.Printed = translator.getTranslationString('CONTAINER.PRINT_NO');
							}
							containerListArray.push(containerObj);

						}
						if(containerListArray.length>0)
						{
							containerListDetails = {
									containerList 	:  containerListArray,
									pickingprintenabled : pickingPrintEnabled,
									isValid      : true
							};
							log.debug({title:'Container List', details: containerListArray});
						}
						else
						{
							containerListDetails = {
									errorMessage : translator.getTranslationString('MULTIORDER_CONTAINERLIST.INVALIDINPUT'),
									isValid              : false
							};
						}

						log.debug({title:'Container List', details: containerListDetails});
					}
				}
				else
				{
					containerListDetails = {
							errorMessage : translator.getTranslationString('MULTIORDER_CONTAINERLIST.INVALIDINPUT'),
							isValid      : false
					};	
				}
			}
			else
			{
				containerListDetails = {
						errorMessage : translator.getTranslationString('MULTIORDER_CONTAINERLIST.EMPTYPARAM'),
						isValid      : false
				};		
			}
		}
		catch(e)
		{
			containerListDetails.isValid = false;
			containerListDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}	

		return containerListDetails;
	}
	function getPickCartonDetails(warehouseLocationId,orderIdArr){

		 var containerDetailsSrch = search.load({
				id : 'customsearch_wms_packcartondtls'
			});

			var containerDtlFilterArr = containerDetailsSrch.filters;

			containerDtlFilterArr.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));				

			containerDtlFilterArr.push(search.createFilter({
				name       : 'appliedtotransaction',
				join          : 'transaction',
				operator  : search.Operator.ANYOF,
				values      : orderIdArr
			}));
			containerDtlFilterArr.filters = containerDtlFilterArr;
		return utility.getSearchResultInJSON(containerDetailsSrch);
	 
	}
	function getPrintedContainers(whLocation,transactionInternalId) {

		var cartonDetails = search.load({id:'customsearch_wms_printed_carton_search'});
		var objFiltersArr  = cartonDetails.filters;

		objFiltersArr.push(search.createFilter({
			name: 'custrecord_wms_ext_location',
			operator: search.Operator.ANYOF,
			values: whLocation
		}));		

		objFiltersArr.push(search.createFilter({
			name: 'custrecord_wms_tran_num',
			operator: search.Operator.ANYOF,
			values: transactionInternalId
		}));
		objFiltersArr.push(search.createFilter({
			name: 'custrecord_wms_printed',
			operator: search.Operator.IS,
			values: true
		}));

		cartonDetails.filters = objFiltersArr;
		return  utility.getSearchResultInJSON(cartonDetails);	
	}
	function getAllCartonDetails(orderInternalId,warehouseLocationId){
		var pickTaskSearch = query.create({type: query.Type.PICK_TASK});

		var locCond = pickTaskSearch.createCondition({
			fieldId: 'location',
			operator: query.Operator.ANY_OF,
			values: warehouseLocationId
		});

		var pickActionOrdersCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.ordernumber',
			operator: query.Operator.ANY_OF_NOT,
			values: orderInternalId				
		});

		var pickActionCartonCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.inventorydetail.pickcarton',
			operator: query.Operator.EMPTY_NOT
		});
		var pickActionStatusCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.status',
			operator: query.Operator.ANY_OF,
			values: ['PICKED','STARTED','STAGED','DONE']				
		});
		var waveStatusCond = pickTaskSearch.createCondition({
			fieldId: 'wave^transaction.status',
			operator: query.Operator.ANY_OF,
			values: ['Wave:C']			
		});
		var trasactionTypeCond = pickTaskSearch.createCondition({
			fieldId: 'wave^transaction.type',
			operator: query.Operator.IS,
			values: 'Wave'		
		});

        var trasactionStatusCond = pickTaskSearch.createCondition({
            fieldId: 'pickactions.transactionnumber^transaction.status',
            operator: query.Operator.ANY_OF_NOT,
            values: ['ItemShip:B','ItemShip:C']
        });

        var orderStatusCond = pickTaskSearch.createCondition({
            fieldId: 'pickactions.ordernumber^transaction.status',
            operator: query.Operator.ANY_OF,
            values: ['SalesOrd:B','SalesOrd:D','SalesOrd:E','TrnfrOrd:B','TrnfrOrd:D','TrnfrOrd:E']
        });
		
		pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'pickactions.transactionnumber^transaction.status'			
		}));
		pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'pickactions.inventorydetail.pickcarton'			
		}));
		pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'pickactions.ordernumber^transaction.id'			
		}));
	
				
		pickTaskSearch.condition = pickTaskSearch.and(locCond,pickActionOrdersCond,
				trasactionTypeCond,waveStatusCond,pickActionStatusCond,pickActionCartonCond,trasactionStatusCond,orderStatusCond);
			

		// Run the query as a paged query with 10 results per page
		var results = pickTaskSearch.runPaged({
			pageSize: 1000
		});

		log.debug(results.pageRanges.length);
		log.debug(results.count);

		var page = '';
		var pageResults = '';
		var resultJsonObj = {};
		// Retrieve the query results using an iterator
		var iterator = results.iterator();
		iterator.each(function(result) {
			page = result.value;
			pageResults = page.data.results;
			if(pageResults){
			for(var result in pageResults){
			if(pageResults[result]){
				if(pageResults[result].values[0] == 'A' ||
						pageResults[result].values[0] == null ||
						pageResults[result].values[0] == 'null' || pageResults[result].values[0]== undefined ||
						pageResults[result].values[0] == ''){//A--ItemFulfillmebt Picked
			resultJsonObj = {};
			resultJsonObj[pageResults[result].values[1]] = pageResults[result].values[2];
			}
			}
			}
			}
			return true ;
			
		});
		return resultJsonObj ;
	}
	return {
		'post': doPost,
		getPrintedContainers:getPrintedContainers
	};

});
