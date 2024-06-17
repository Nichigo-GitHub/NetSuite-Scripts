/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','N/runtime'],
		/**
		 * @param {search} search
		 */
		function(search,utility,runtime) {

	/**
	 * This function is to fetch the items of a purchase order
	 */
    function doPost(requestBody) {
		
		var replenItemList = {};
		var warehouseLocationId = '';
		var currentUserID = '';
		var debugString = '';
		try{
			
			if(utility.isValueValid(requestBody)) 
			{
				var requestParams		= requestBody.params;
				warehouseLocationId = requestParams.warehouseLocationId;
				if(utility.isValueValid(warehouseLocationId)) {
					currentUserID = runtime.getCurrentUser();
					var openTaskSearch = search.load({
						id: 'customsearch_wmsse_rpln_opentask_details'
					});

					openTaskSearch.filters.push(search.createFilter({
						name : 'custrecord_wmsse_wms_location',
						operator : search.Operator.ANYOF,
						values : warehouseLocationId
					}));

					openTaskSearch.filters.push(search.createFilter({
						name : 'custrecord_wmsse_task_assignedto',
						operator : search.Operator.ANYOF,
						values : ['@NONE@',currentUserID.id]
					}));

					var openTaskRes = utility.getSearchResultInJSON(openTaskSearch);

					for(var i in openTaskRes){
						if(utility.isValueValid(openTaskRes[i]['custrecord_wmsse_uom']) && openTaskRes[i]['custrecord_wmsse_uom'] != '- None -'){
							openTaskRes[i]['quantity'] = openTaskRes[i]['Remaining quantity'] + ' ' + openTaskRes[i]['custrecord_wmsse_uom'];
						}else{
							openTaskRes[i]['quantity'] = openTaskRes[i]['Remaining quantity'];
						}
					}

					replenItemList['isValid'] = true;
					replenItemList['replenItemList'] = openTaskRes;
				}else{
					replenItemList['isValid'] = false;
				}
			}else{
				replenItemList['isValid'] = false;
			}
		}catch(e){
			replenItemList['isValid'] = false;
			replenItemList['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString})
		}
		log.debug('replenItemList',replenItemList);
		return replenItemList;
	}

    return {
		'post': doPost
    };

});