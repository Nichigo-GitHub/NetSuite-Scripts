/**
 *     Copyright © 2022, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility'],

		function(search,utility) {
	/**
	 * This function is to fetch the reason codes.
	 *
	 */
	function doPost(requestBody) {

		var waveStatusList = {};
		var waveStatusArray =[];

		try{
			requestParams = requestBody.params;
			if (utility.isValueValid(requestBody)) {
log.debug('requestParams',requestParams);
				var transactionName = requestParams.transactionName;
				var WaveStatusValues =["Pending Release","Released"];
				var waveStatusResults = this.getListOfwaveStatus();
                log.debug('waveStatusResults',waveStatusResults);
                log.debug('WaveStatusValues',WaveStatusValues);
				if(waveStatusResults.length>0)
				{
					for(var srchResult=0;srchResult<waveStatusResults.length;srchResult++){
						var objectwaveStatus = {};
						var waveStatusResultsData = waveStatusResults[srchResult];
                        objectwaveStatus.waveStatusDisplayName =waveStatusResultsData.getValue({name:'name'});
                        objectwaveStatus.waveStatus =WaveStatusValues[srchResult];

                        waveStatusArray[waveStatusArray.length]=objectwaveStatus;
					}
				}
                waveStatusList.waveStatusList =waveStatusArray;
				waveStatusList.transactionName =transactionName;
				log.debug({title: 'waveStatusList', details: waveStatusList});

			}
		}
		catch(e)
		{
			log.error({title: 'exception in waveStatusList', details: e});
		}
		return waveStatusList;
	}

	function getListOfwaveStatus()
	{
		var waveStatusListObj = search.create({type:'customlist_wms_wave_release_status',columns:['name']
		});
		var waveStatusListObjSearchResult = [];
		var search_page_count = 10;

		var myPagedData = waveStatusListObj.runPaged({
			pageSize: search_page_count
		});
		myPagedData.pageRanges.forEach(function (pageRange) {
			var myPage = myPagedData.fetch({
				index: pageRange.index
			});
			myPage.data.forEach(function (result) {
				waveStatusListObjSearchResult.push(result);
			});
		});

		return waveStatusListObjSearchResult;
	}

	return {
		'post': doPost,
        getListOfwaveStatus:getListOfwaveStatus
	};

});
