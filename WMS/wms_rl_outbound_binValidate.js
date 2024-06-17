/**
 *    Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/record','N/config'],
		/**
		 * @param {search} search
		 */
		function(search,utility,Big,translator,record,config) {


	function doPost(requestBody) {

		var fromBinValidate = {};
		var pickTaskId ='';           
		var itemName = '';
		var pickBinName = '';           
		var debugString='';
		var requestParams = '';
		var binArry = [];
		var binDtl = {};

		try
		{

			requestParams = requestBody.params;
			log.debug({title:'requestParams',details:requestParams});
			if (utility.isValueValid(requestParams))
			{
				debugString = debugString + " requestParams:"+requestParams;

				var warehouseLocationId = requestParams.warehouseLocationId;
				var pickBinName = requestParams.pickBinName;
				var pickTaskId = requestParams.pickTaskId;
				var recommendedBinId = requestParams.recommendedBinId;

				if (utility.isValueValid(pickBinName) && utility.isValueValid(warehouseLocationId) && utility.isValueValid(pickTaskId))

				{
					log.debug({title:'requestParams',details:requestParams});



					if (utility.isValueValid(pickBinName))
					{
						var binInternalId='';

						var	 binSearchResults=search.load({
							id : 'customsearch_wmsse_pickbinvalidate'
						});
						var binSearchFilters = binSearchResults.filters;
						//var binSearchFilters = [];
						if(utility.isValueValid(pickBinName))
						{
							binSearchFilters.push(search.createFilter({
								name: 'binnumber',
								operator: search.Operator.IS,
								values: pickBinName
							}));
						}
						binSearchFilters.push(search.createFilter({
							name: 'inactive',
							operator: search.Operator.IS,
							values: false
						}));
						if(utility.isValueValid(warehouseLocationId))
						{
							binSearchFilters.push(search.createFilter({
								name: 'location',
								operator: search.Operator.ANYOF,
								values: warehouseLocationId
							}));
						}

						var	 binSearchResults = binSearchResults.run().getRange({
							start: 0,
							end: 1000
						});
						log.debug({title:'pickBinName',details:pickBinName});
						log.debug({title:'recommendedBinId',details:recommendedBinId});

						if(utility.isValueValid(pickTaskId) && pickBinName!=recommendedBinId) 
						{	
							debugString = debugString + 'Pick Task Id:'+pickTaskId;
							var vPicktask = record.load({
								type  		   : 'picktask',
								id   : pickTaskId
							});

							var sublistsCount = vPicktask.getLineCount({
								sublistId:'bins'
							});

							var binArray = [];
							for(var i=0;i<sublistsCount;i++)
							{
								var binObj ={};

								binObj['binNumber'] = vPicktask.getSublistValue({
									sublistId : 'bins',
									fieldId : 'binnumber',
									line : i
								});
								binObj['binId'] = vPicktask.getSublistValue({
									sublistId : 'bins',
									fieldId : 'binid',
									line : i
								});

								binObj['quantity']     = vPicktask.getSublistValue({
									sublistId : 'bins',
									fieldId : 'availablequantity',
									line : i
								});
								var binnumber=Number(Big(binObj['binId']));
								
								if(binArray.indexOf(binnumber.toString()) == -1)
								{
									
									
									binArray.push(binnumber.toString());
								}
								
							}
							log.debug({title:'binArray',details:binArray});
							log.debug({title:'pickBinName',details:pickBinName});
							if(utility.isValueValid(binSearchResults))
							{
								binInternalId=binSearchResults[0].id;
							}
							
							if(binArray.indexOf(binInternalId.toString()) == -1)
							{
								fromBinValidate['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVENTOTY_INPUT');
								fromBinValidate['isValid'] = false;
							}
							else
							{
								log.debug({title:'binSearchResults',details:binSearchResults});

								if(utility.isValueValid(binSearchResults))
								{
									binInternalId=binSearchResults[0].id;
									fromBinValidate['isValid'] = true;
									fromBinValidate["binInternalId"] = binSearchResults[0].id;
								}

								fromBinValidate['binName'] = pickBinName;
								log.debug({title:'binInternalId',details:binInternalId});
								if(!(utility.isValueValid(binInternalId))){
									fromBinValidate['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
									fromBinValidate['isValid'] = false;
								}
							}

						}
						else
						{
							log.debug({title:'binSearchResults',details:binSearchResults});

							if(utility.isValueValid(binSearchResults))
							{
								binInternalId=binSearchResults[0].id;
								fromBinValidate['isValid'] = true;
								fromBinValidate["binInternalId"] = binSearchResults[0].id;
							}

							fromBinValidate['binName'] = pickBinName;
							log.debug({title:'binInternalId',details:binInternalId});
							if(!(utility.isValueValid(binInternalId))){
								fromBinValidate['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
								fromBinValidate['isValid'] = false;
							}
						}


						if(!(utility.isValueValid(binInternalId))){

							fromBinValidate['errorMessage'] = translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
							fromBinValidate['isValid'] = false;
						}



					}
					else
					{
						fromBinValidate["errorMessage"] = translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
						fromBinValidate['isValid'] = false;
					}
				}
				else{
					fromBinValidate["errorMessage"] =translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
					fromBinValidate['isValid'] = false;
				}
			}
			else{
				fromBinValidate["errorMessage"] =translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
				fromBinValidate['isValid'] = false;
			}
		}
		catch(e)
		{
			fromBinValidate['isValid'] = false;
			fromBinValidate['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
		return fromBinValidate;
	}

	return {
		'post': doPost
	};

});
