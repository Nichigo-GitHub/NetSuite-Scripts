/**
 *     Copyright © 2022, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/query','./wms_utility'],

		function(query,utility) {
	/**
	 * This function is to fetch the reason codes.
	 *
	 */
	function doPost(requestBody) {

		var reasonCodeList = {};
		var reasonCodeArray =[];

		try{

			if (utility.isValueValid(requestBody)) {
				var resonCodeResults = this.getListOfReasonCodes();
				if(resonCodeResults.length>0)
				{
					for(var srchResult=0;srchResult<resonCodeResults.length;srchResult++){
						var objectReasonCode = {};
						objectReasonCode.reasonCodeDisplayName =resonCodeResults[srchResult].reasoncodedisplay;
						objectReasonCode.reasonCode =resonCodeResults[srchResult].reasoncode+"^"+resonCodeResults[srchResult].includeinbincount;

						reasonCodeArray[reasonCodeArray.length]=objectReasonCode;
					}
				}
				reasonCodeList.reasonCodeList =reasonCodeArray;
				log.debug({title: 'reasonCodeList', details: reasonCodeList});
			}
		}
		catch(e)
		{
			log.error({title: 'exception in reasonCode', details: e});
		}
		return reasonCodeList;
	}

	function getListOfReasonCodes()
	{
		var searchQuery = query.create({
		type: 'customrecord_wms_reason_blockemptybins'
		});
		var inactiveFilter = searchQuery.createCondition({
			fieldId: 'isinactive',
			operator: query.Operator.IS,
			values: false
		});
		searchQuery.condition = searchQuery.and(inactiveFilter);
		searchQuery.columns = [
			searchQuery.createColumn({
			fieldId: 'custrecord_wms_reasondesc',
			alias:'reasoncodedisplay'
		}),
		searchQuery.createColumn({
			fieldId: 'custrecord_wms_reasoncode',
			alias:'reasoncode'
		}),
            searchQuery.createColumn({
                fieldId: 'custrecord_wms_include_bincount',
                alias:'includeinbincount'
            })
		];
		return searchQuery.run().asMappedResults();
	}

	return {
		'post': doPost,
		getListOfReasonCodes:getListOfReasonCodes
	};

});
