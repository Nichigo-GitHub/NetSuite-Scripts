/**
 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility'],

		function(utility) {
	/**
	 * Function to log data to ElasticSearch
	 */
	function doPost(requestBody) {

		var dataObj = {};
		var responseObj = {};
		try{
		   var requestParams = requestBody.params;
		   var featureName = requestParams.featureName;
           if(utility.isValueValid(featureName)){
           	dataObj.bundleName =  'WMS';
            dataObj.executionContext ='FeatureUsage' ;
           	dataObj.featureName = featureName;
           	  utility.logDatatoELK(dataObj);
           }
           responseObj.isValid = true;
		}
		catch(e) {
			responseObj.isValid = false;
			responseObj.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
		return responseObj;
	}

	return {
		'post': doPost
	};

});
