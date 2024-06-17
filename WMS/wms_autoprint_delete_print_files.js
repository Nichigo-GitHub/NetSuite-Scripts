/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(['N/search','N/file','N/record','N/runtime','./wms_rl_autoprint_const','./wms_utility'],
		function (search,file,record,runtime,consts,utility) {
	function execute(requestParams) {
		try{
			const DEFAULT_RETENTION_PERIOD = 24;
			var retentionPeriod 	= getConfig(consts.CONFIG_KEYS.RETENTION_PERIOD,DEFAULT_RETENTION_PERIOD); // retention period to be measured in hours
			var auditResultsSearch 	= searchData(consts.ID.PRINT_AUDIT_SEARCH); //customsearch_wms_autoprint_audit_dtl

			log.debug("RetentionPeriod",retentionPeriod);
			if(utility.isValueValid(auditResultsSearch)){
				for(var i in auditResultsSearch)
				{
					try
					{
						var searchDate = auditResultsSearch[i].getValue(consts.ID.PRINT_AUDIT_DATE);  //custrecord_autoprint_file_date
						if(searchDate)
						{
							var diff = Math.abs(new Date()-new Date(searchDate)) / 36e5;
							log.debug("Time Difference between file created time and current time:", diff);
							if(diff > parseInt(retentionPeriod))
							{
								log.debug('file which is going to delete , file id:', auditResultsSearch[i].getValue(consts.ID.PRINT_AUDIT_FILE_ID));

								file.delete({
									id: auditResultsSearch[i].getValue(consts.ID.PRINT_AUDIT_FILE_ID)
								});
								var auditRecord = record.submitFields({
									type: consts.ID.PRINT_AUDIT,
									id: auditResultsSearch[i][consts.ID.ID],
									values: {
										'isinactive' : true
									}
								});
							}
						}
					}catch(e){
						log.error("Exception while deleting Print files",e);
					}
					log.debug({
						title: 'Delete Print Files Governance',
						details: 'Remaining usage: ' + runtime.getCurrentScript().getRemainingUsage()
					})
					remainingGovernanceLimit = runtime.getCurrentScript().getRemainingUsage();
				}			
			}
		}catch(e){
			log.error("Exception while deleting Print files in ss",e);
		}

	}

	function getConfig(configKey, defaultVal)
	{	
		var config = {};
		var printAccountPrefResults = searchData(consts.ID.PRINT_ACCT_PREF);
		if(printAccountPrefResults!='' && printAccountPrefResults.length > 0){
			printAccountPrefResults.forEach(function(result){
				config[result.getText(consts.ID.PRINT_ACCNT_PREF_KEY)] = result.getValue(consts.ID.PRINT_ACCNT_PREF_VAL);
			});
		}
		log.debug("Loaded Configurations : "+JSON.stringify(config));

		var value = config[configKey];
		log.debug('Print Retention Period value :', value);
		if (!value && defaultVal){
			return defaultVal;
		}else{
			return value;
		}
	}

	function searchData(id)
	{
		log.debug('Search Data Id:', id);
		var configSearchObj = search.load({
			id: id
		});
		return iterateSearchData(configSearchObj);
	}

	function iterateSearchData(configSearchObj){
		var resultRow = [];
		var searchPageData;
		var pageSize = configSearchObj.runPaged().count;
		log.debug("Elements pageSize",pageSize);
		var searchData = configSearchObj.runPaged({
			pageSize: pageSize
		});
		searchData.pageRanges
		.forEach(function (pageRange) {
			searchPageData = searchData.fetch({
				index: pageRange.index
			});
			searchPageData.data
			.forEach(function (result) {
				resultRow.push(result);
			});
		});
		return resultRow;
	}        


	return {
		'execute': execute,
	}
})