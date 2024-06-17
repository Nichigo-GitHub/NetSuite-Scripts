/**
 *     Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', 'N/runtime','N/record','./wms_utility','./wms_translator'],
		/**
		 * @param {search} search
		 */
		function(search, runtime, record, utility,translator) {

	/**
	 * This function is to fetch the status from Inventory Status list.
	 *
	 */
	function doPost(requestBody) {

		var serailList = {};
		var processType = '';
		var binInternalId = '';
		var itemInternalId = '';
		var getNumber = '';
		var transactionLineNo = '';
		var transactionInternalId = '';
		var debugString ='';
		var showSerails = '';
		try{
			
			if (utility.isValueValid(requestBody)) {
                var requestParams = requestBody.params;
				log.debug({title:'requestParams',details:requestParams});
				processType = requestParams.processType;
				binInternalId = requestParams.binInternalId;	
				itemInternalId = requestParams.itemInternalId;
				getNumber = requestParams.numberOfTimesSerialScanned;
				transactionLineNo = requestParams.transactionLineNo;
				transactionInternalId = requestParams.transactionInternalId;
				var serialNumber = requestParams.serialNumber;
				showSerails = requestParams.showSerails;
        var binName =  requestParams.binName;
				if(utility.isValueValid(processType))
				{
          if(utility.isValueValid(binName))
					{
						serailList['binName'] = binName;
					}
					if(!utility.isValueValid(getNumber))
					{
						getNumber=0;
					}
					if(parseInt(getNumber)==0 || utility.isValueValid(serialNumber))
					{
						var serialSearch = search.load({
							id: 'customsearch_wmsse_wo_serialentry_srh',
						});
						var serailFilters = serialSearch.filters;

						var filtersApplied = false;
						if(utility.isValueValid(serialNumber)){
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_no',
								operator: search.Operator.IS,
								values: serialNumber
							}));
                            filtersApplied = true;
						}
						
						if(processType == 'putAway' || processType == 'binTransfer' || processType == "cartPutaway"){
                            filtersApplied = true;
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_tasktype',
								operator: search.Operator.ANYOF,
								values: 9
							}));
							if(utility.isValueValid(binInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_bin',
									operator: search.Operator.ANYOF,
									values: binInternalId
								}));
							}	
							if(utility.isValueValid(itemInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_item',
									operator: search.Operator.ANYOF,
									values: itemInternalId
								}));
							}	
						}
						else if(processType == 'inventoryTransfer' || processType == 'inventoryStatusChange'){
                            filtersApplied = true;
                            if(processType == "inventoryStatusChange"){
                                serailFilters.push(search.createFilter({
                                    name: 'custrecord_wmsse_ser_tasktype',
                                    operator: search.Operator.ANYOF,
                                    values: 18
                                }));
                            }
                            else {
                                serailFilters.push(search.createFilter({
                                    name: 'custrecord_wmsse_ser_tasktype',
                                    operator: search.Operator.ANYOF,
                                    values: 9
                                }));
                            }
							if(utility.isValueValid(itemInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_item',
									operator: search.Operator.ANYOF,
									values: itemInternalId
								}));
							}
							if(utility.isValueValid(binInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_bin',
									operator: search.Operator.ANYOF,
									values: binInternalId
								}));
							}
						}
						else if(processType == 'replen'){
                            filtersApplied = true;
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_tasktype',
								operator: search.Operator.ANYOF,
								values: 17
							}));
							if(utility.isValueValid(itemInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_item',
									operator: search.Operator.ANYOF,
									values: itemInternalId
								}));
							}
							if(utility.isValueValid(binInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_bin',
									operator: search.Operator.ANYOF,
									values: binInternalId
								}));
							}
						}
						else if(processType == 'inbound' || processType == 'cycleCount'){
                            filtersApplied = true;
							if(utility.isValueValid(transactionLineNo))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_ordline',
									operator: search.Operator.EQUALTO,
									values: transactionLineNo
								}));
							}
							if(utility.isValueValid(transactionInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_ordno',
									operator: search.Operator.ANYOF,
									values: transactionInternalId
								}));
							}
							if(processType == 'inbound'){
								serailFilters.push(search.createFilter({
									name: 'custrecord_wms_opentaskno',
									operator: search.Operator.ISEMPTY
								}));
							}
							
						}
						else if(processType == 'outbound'|| processType == 'workOrder'|| processType == 'woassembly'){
                            filtersApplied = true;
							log.debug({title:'transactionInternalId',details:transactionInternalId});
							log.debug({title:'itemInternalId',details:itemInternalId});
							if(processType == 'woassembly')
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_tasktype',
									operator: search.Operator.ANYOF,
									values: 2
								}));
							
							}
							else if(processType == 'workOrder')
							{
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_tasktype',
								operator: search.Operator.ANYOF,
									values: 9
								}));
							}
							else
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_tasktype',
									operator: search.Operator.ANYOF,
								values: 3//pick
							}));
							}
							if(utility.isValueValid(transactionInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_ordno',
									operator: search.Operator.ANYOF,
									values: transactionInternalId
								}));
							}	
							if(utility.isValueValid(itemInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_item',
									operator: search.Operator.ANYOF,
									values: itemInternalId
								}));
							}
						}
						else if(processType == 'createInventory'){
                            filtersApplied = true;
							serailFilters.push(search.createFilter({
								name: 'custrecord_wmsse_ser_tasktype',
								operator: search.Operator.ANYOF,
								values: 10
							}));
							if(utility.isValueValid(itemInternalId))
							{
								serailFilters.push(search.createFilter({
									name: 'custrecord_wmsse_ser_item',
									operator: search.Operator.ANYOF,
									values: itemInternalId
								}));
							}
						}
                        var serialSearchResults = [];
                        if(filtersApplied) {
                            serialSearch.filters = serailFilters;
                            serialSearchResults = utility.getSearchResultInJSON(serialSearch);
                        }
						if(serialSearchResults.length > 0)
						{
							var serialMatchFound = true;
							var serialName = "";
							var serialNameDtlArr = [];
							var currentUserId = runtime.getCurrentUser().id;
							for (var j = 0; j < serialSearchResults.length; j++) {
								var TempRecord = serialSearchResults[j];
								serialMatchFound = true;
								if(utility.isValueValid(processType) && (processType == "inventoryTransfer" || processType == "binTransfer"
                                || processType == "createInventory"  || processType == 'replen' ||
									processType == 'putAway' || processType == "cartPutaway" || processType == "inventoryStatusChange")){
									serialName = TempRecord.name;
									if(serialName) {
										serialNameDtlArr = serialName.split("^");
										if (serialNameDtlArr.length == 3) {
										if ((serialNameDtlArr[0] != processType)
											|| serialNameDtlArr[1] != currentUserId) {
											serialMatchFound = false;
										}
									}
									}
								}
								if(serialMatchFound)
								{
								var id = record.submitFields({
									type: 'customrecord_wmsse_serialentry',
									id: TempRecord.id,
									values: {
										id: TempRecord.id,
										name: TempRecord.name,
										custrecord_wmsse_ser_note1: 'because of discontinue of serial number scanning we have marked this serial number as closed',
										custrecord_wmsse_ser_status: true
									},
									options: {
										enableSourcing: false,
										ignoreMandatoryFields: true
									}
								});
							}
							}
						}
					}
					serailList['isValid'] = true;
				}
				else if(showSerails == "true"){
					var serialSearch = search.load({
						id: 'customsearch_wms_inbound_invtdetails',
					});
					var serailFilters = serialSearch.filters;

					
					if(utility.isValueValid(transactionInternalId)){
						serailFilters.push(search.createFilter({
							name: 'internalid',
							operator: search.Operator.ANYOF,
							values: transactionInternalId
						}));
					}
					if(utility.isValueValid(itemInternalId)){
						serailFilters.push(search.createFilter({
							name: 'item',
							operator: search.Operator.ANYOF,
							values: itemInternalId
						}));
					}
					serialSearch.filters = serailFilters;
					serailList['serialList']  =utility.getSearchResultInJSON(serialSearch);
				}
				else{
					serailList['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
					serailList['isValid'] = false;
				}
			}
			else{
				serailList['errorMessage'] = translator.getTranslationString('BINTRANSFER_SERIALLIST.EMPTY_INPUT');
				serailList['isValid'] = false;
			}
		}
		catch(e)
		{
			serailList['isValid'] = false;
			serailList['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return serailList;
	}
	return {
		'post': doPost
	};

});
