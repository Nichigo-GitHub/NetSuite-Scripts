/*
 *     Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
 define(['./wms_itemStockLocation_utility','./wms_translator'],

 	function(util_itemStockLocation,translator) {

 		function doPost(requestBody) {

 			var requestParams = '';
 			var itemStockLocationList ={};
 			try{
 				if(util_itemStockLocation.isValueValid(requestBody)){
 					log.debug({title:'requestBody',details:requestBody});	
 					requestParams = requestBody.params;
 					var warehouseLocationId = requestParams.warehouseLocationId;
 					var itemInternalId = requestParams.itemInternalId;

 					if(util_itemStockLocation.isValueValid(warehouseLocationId) && util_itemStockLocation.isValueValid(itemInternalId))
 					{
 						var inputParamObj={};
 						inputParamObj.stockLocation =warehouseLocationId; 
 						inputParamObj.item =itemInternalId; 
 						var itemStockLocationResults = util_itemStockLocation.getItemStockLocations(inputParamObj);
 						if(itemStockLocationResults.length > 0){
 							itemStockLocationList.isValid = true;
 							itemStockLocationList.stockLocationList = itemStockLocationResults;

 						}
 					}
 				}
 			}catch(e){
 				itemStockLocationList.isValid = false;
 				itemStockLocationList.errorMessage = e.message;
 				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
 			}
 			return itemStockLocationList;
 		}
 		return{
 			'post' : doPost
 		};
 	});
