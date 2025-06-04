/**
 *    Copyright © 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
 define(['../Restlets/wms_itemStockLocation_utility','../Restlets/wms_translator'],
 	function(util_itemStockLocation,translator) {
 		var contextMode;
 		function pageInit(context)
 		{
 			contextMode=context.mode;
 		}
 		function fieldChanged(scriptContext) {
 			var currentRecord = scriptContext.currentRecord;
 			var fieldName = scriptContext.fieldId;
 			if(fieldName === 'custpage_wms_stock_location'){
 				var locationId =currentRecord.getValue({
 					fieldId : 'custpage_wms_stock_location'
 				});
 				currentRecord.setValue({
 					fieldId : 'custrecord_wms_stock_location',
 					value: locationId
 				});
 			}
 		}

 		function saveRecord(context) {
 			var inputParamObj={};
 			var currentRecord = context.currentRecord;
 			var currentRecordId = currentRecord.getValue({
 				fieldId: 'id'
 			}); 
 			var name = currentRecord.getValue({
 				fieldId: 'name'
 			});
 			var item= currentRecord.getValue({
 				fieldId: 'custrecord_wms_stock_item'
 			});
 			var stockLocation= currentRecord.getValue({
 				fieldId: 'custrecord_wms_stock_location'
 			});
 			var preferredLocation= currentRecord.getValue({
 				fieldId: 'custrecord_wms_preferred_itemlocation'
 			});
 			inputParamObj.stockLocation =stockLocation; 
 			inputParamObj.item =item; 
 			inputParamObj.name =name; 
 			inputParamObj.currentRecordId =currentRecordId;
 			if(util_itemStockLocation.isValueValid(name) && util_itemStockLocation.isValueValid(item) && util_itemStockLocation.isValueValid(stockLocation)){

 				var itemStockLocationResults = util_itemStockLocation.getItemStockLocations(inputParamObj);
 				if(itemStockLocationResults.length > 0)
 				{  
 					alert(translator.getTranslationStringForClientScript('ITEMSTOCKLOCATION.ALREADY_EXISTS'));
 					return false;
 				}
 				if(preferredLocation){
 					inputParamObj.preferredLocationCheck = true;
 					itemStockLocationResults = util_itemStockLocation.getItemStockLocations(inputParamObj);
 					if(itemStockLocationResults.length > 0)
 					{
 						alert(translator.getTranslationStringForClientScript('ITEMSTOCKLOCATION.PREFERREDLOCATION_EXISTS'));
 						return false;
 					}else
 					{
 						return true;
 					}
 				}else{
 					return true;
 				}
 				
 			}else
 			return true;
 		}
 		return {
 			pageInit:pageInit,
 			saveRecord:saveRecord,
 			fieldChanged:fieldChanged
 		};

 	});
