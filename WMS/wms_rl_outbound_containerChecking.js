/**
 * Copyright © 2021, Oracle and/or its affiliates. All rights reserved. 
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

		var containerListDetails 	= {};
		try{

			if(utility.isValueValid(requestBody)) 
			{
				var requestParams			= requestBody.params;
				var whLocation  				= requestParams.warehouseLocationId;
				var containerName            		= requestParams.containerName;

				log.debug({title:'Request Params :', details:requestParams});

				if(utility.isValueValid(whLocation)  && utility.isValueValid(containerName))
				{	
					var containerListArr = this.isContainerExists(whLocation,containerName);
					containerListDetails.cartonprinted = 'Y';
					containerListDetails.cartonName = containerName;
					if(containerListArr.length>0)
					{
						containerListDetails = {
								isValid      : true,
								cartonprinted : 'N'
						};	
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
	function isContainerExists(whLocation,containerName) {

		var cartonDetails = search.load({id:'customsearch_wms_rule_evaluatn_autoprint'});
		var objFiltersArr  = cartonDetails.filters;

		objFiltersArr.push(search.createFilter({
			name: 'custrecord_wms_ext_location',
			operator: search.Operator.ANYOF,
			values: whLocation
		}));		

		objFiltersArr.push(search.createFilter({
			name: 'custrecord_wms_cartonname',
			operator: search.Operator.IS,
			values: containerName
		}));
		objFiltersArr.push(search.createFilter({
			name: 'custrecord_wms_printed',
			operator: search.Operator.IS,
			values: true
		}));

		cartonDetails.filters = objFiltersArr;
		return  utility.getSearchResultInJSON(cartonDetails);	
	}
	return {
		'post': doPost,
		'isContainerExists':isContainerExists
	};

});
