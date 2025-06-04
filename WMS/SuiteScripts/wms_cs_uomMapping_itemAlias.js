/**
 *    Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search','N/currentRecord','N/record'],

		function(search,currentRecord,record) {
	function fieldChanged(scriptContext) {
		var currentRecord = scriptContext.currentRecord;
		var fieldName = scriptContext.fieldId;
		var unitType = '';
		if (fieldName === 'custrecord_wmsse_alias_item'){
			var itemInternalId =currentRecord.getValue({
				fieldId : 'custrecord_wmsse_alias_item'
			});
			//Getting field
			var uomField = currentRecord.getField({
				fieldId: 'custpage_wms_alias_unit'
			});
			uomField.removeSelectOption({
			    value: null,
			});
		if(itemInternalId != null && itemInternalId != '' && itemInternalId != 'null' && itemInternalId != undefined && itemInternalId != 'undefined'){
			var fieldLookUp = search.lookupFields({
				type: search.Type.ITEM,
				id: itemInternalId,
				columns: ['unitstype']
			});
			if (fieldLookUp.unitstype != undefined && fieldLookUp.unitstype[0] != undefined)
			{
				unitType = fieldLookUp.unitstype[0].value;
				var unitNameArr = getUnitsTypeUOM(unitType) ;
				
				// Insert a new options.
				for(var opt in unitNameArr){
					unitObj = unitNameArr[opt];
					uomField.insertSelectOption({
						value: unitObj.id,
						text: unitObj.name
					});
				}
			}
          }
		}else if(fieldName === 'custpage_wms_alias_unit'){
			var uom =currentRecord.getValue({
				fieldId : 'custpage_wms_alias_unit'
			});

			currentRecord.setValue({
				fieldId : 'custrecord_wms_alias_unit',
				value: uom
			});
		}
	}

	function getUnitsTypeUOM(unitTypeId){
		var UnitsTypeUOMArr = [];
		var unitName ='';
		var uomValue ='';
		var uomObj = {};
		var uomRecord = record.load({
			type: record.Type.UNITS_TYPE,
			id: unitTypeId
		});
		var sublistCount = uomRecord.getLineCount({
			sublistId: 'uom'
		});
		for (var i = 0; i < sublistCount; i++) {
			uomObj ={};
			unitName = uomRecord.getSublistValue({
				sublistId: 'uom',
				fieldId: 'pluralname',
				line: i
			});
			uomValue = uomRecord.getSublistValue({
				sublistId: 'uom',
				fieldId: 'internalid',
				line: i
			});
			uomObj.name = unitName;
			uomObj.id = uomValue;
			UnitsTypeUOMArr.push(uomObj);
		}
		return UnitsTypeUOMArr;
	}



	return {
		fieldChanged:fieldChanged
	};

});
