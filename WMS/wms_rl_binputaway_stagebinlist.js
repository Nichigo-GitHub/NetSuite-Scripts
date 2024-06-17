/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./wms_translator', './wms_inboundUtility'],
		/**
		 * @param {search} search
		 */
		function (search, utility,translator, inboundUtility) {


	function doPost(requestBody) {

		var whLocation = '';
		var stageInventoryDetails = {};
		var debugString ='';
		var processType = '';
		var requestParams = '';
		try{
			log.debug({title:'requestBody',details:requestBody});	
			if (utility.isValueValid(requestBody)) {	
				requestParams= requestBody.params;
				processType = requestParams.processType;
				whLocation = requestParams.warehouseLocationId;

				if (utility.isValueValid(whLocation)) {
					var vmakeInvAvailFlag = true;
					var getStageBinResults = inboundUtility.getInboundStageBinDetails(whLocation,processType);
					if(getStageBinResults.length>0)
					{
						var binLocIdArr =[];
						for(var binItr in getStageBinResults)
						{
							var inbStageBinId=getStageBinResults[binItr]['internalid'];					
							if(utility.isValueValid(inbStageBinId) && binLocIdArr.indexOf(inbStageBinId) == -1)
								binLocIdArr.push(inbStageBinId);
						}
						log.debug({title:'binLocIdArr',details:binLocIdArr});
						var binPutawayRecords = getStageBinDtls(binLocIdArr,whLocation);
						log.debug({title:'binPutawayRecords',details:binPutawayRecords});
						if(binPutawayRecords.length>0)
						{
							var vLocDetails = search.lookupFields({
								type: search.Type.LOCATION,
								id: whLocation,
								columns: ['makeinventoryavailable']
							});
							vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
							log.debug({title:'binPutawayRecords',details:binPutawayRecords});
							stageInventoryDetails['stageinventorydetails']=binPutawayRecords;
							stageInventoryDetails['makeinventoryavailable']=vmakeInvAvailFlag;
							stageInventoryDetails['isValid']=true;
						}
						else
						{

							stageInventoryDetails['errorMessage']=translator.getTranslationString('BINPUTW_STAGELIST.NO_INVENTORY');
							stageInventoryDetails['isValid']=false;
						}


					}
					else
					{
						stageInventoryDetails['errorMessage']=translator.getTranslationString('BINPUTW_STAGELIST.NO_STAGEBINS');
						stageInventoryDetails['isValid']=false;

					}

				}
				else {
					stageInventoryDetails['errorMessage']=translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
					stageInventoryDetails['isValid']=false;
				}
			}
			else {
				stageInventoryDetails['errorMessage']=translator.getTranslationString('BINPUTW_STAGELIST.INVAILD_INPUT');
				stageInventoryDetails['isValid']=false;
			}
			log.debug({title:'stageInventoryDetails',details:stageInventoryDetails});

		}
		catch(e)
		{
			stageInventoryDetails['isValid'] = false;
			stageInventoryDetails['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		return stageInventoryDetails;
	}
	function getStageBinDtls(stageBins,locationId){
		
		var binsInventoryDetails = search.load({id:'customsearch_wmsse_binlocwise_inventory'});
		var binFiltersArr  = binsInventoryDetails.filters;
		if(utility.isValueValid(stageBins)) {
			binFiltersArr.push(search.createFilter({
				name: 'binnumber',
				join: 'binOnHand',
				operator: search.Operator.ANYOF,
				values: stageBins
			}));
		}
		if(utility.isValueValid(locationId)) {
			binFiltersArr.push(search.createFilter({
				name: 'location',
				join: 'binOnHand',
				operator: search.Operator.ANYOF,
				values: locationId
			}));
		}
		binFiltersArr.push(search.createFilter({
			name: 'quantityavailable',
			join: 'binOnHand',
			operator: search.Operator.GREATERTHAN,
			values: 0
		}));
		
		binsInventoryDetails.filters = binFiltersArr;
		return  utility.getSearchResultInJSON(binsInventoryDetails);
	}
	


	return {
		'post': doPost

	};
});