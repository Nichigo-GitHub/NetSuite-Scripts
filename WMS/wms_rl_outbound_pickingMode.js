/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility'],

		function(utility) {

	function doPost(requestBody) {

		var pickingModeDtl = {};
		var requestParams = '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				var wareHouseLocation = requestParams.warehouseLocationId;
				var pickingType = requestParams.pickingType;
				var pickingMode = requestParams.pickingMode;
				
				var columnsArr = [];
				columnsArr.push('usesbins');
				var locResults = utility.getLocationFieldsByLookup(wareHouseLocation,columnsArr);
				var locUseBinsFlag = false;

				if(locResults){
					locUseBinsFlag =  locResults.usesbins;
				}
				if(locUseBinsFlag == true){
					var zonePickingSystemRule = '';
					log.debug('pickingType',pickingType);
					log.debug('pickingMode',pickingMode);
					if(pickingType == 'multiorder'){
						zonePickingSystemRule = utility.getSystemRuleDetails('Enable Zone Picking for multiple orders' ,wareHouseLocation , 'Y');
					}
					else{
						if(pickingMode == 'wavepicking'){
							zonePickingSystemRule = utility.getSystemRuleDetails('Enable Zone Picking for single orders' ,wareHouseLocation , 'Y');
						}
					}
					pickingModeDtl.isZonePickingEnabled = false;
					log.debug('zonePickingSystemRule',zonePickingSystemRule);
					if(utility.isValueValid(zonePickingSystemRule)){
						if(zonePickingSystemRule[0].custrecord_wms_pickingtypeText == 'Pick & Merge'){
							pickingModeDtl.isZonePickingEnabled = true;
							pickingModeDtl.isEnforceStageFlagEnabled = zonePickingSystemRule[0].custrecord_wms_enforce_stage;
							if(utility.isValueValid(pickingType) && pickingType == "multiorder"){
								pickingModeDtl.stageByOrderSystemRuleValue = zonePickingSystemRule[0].custrecord_wms_stagebyorder_flag;
							}
						}
					}
					else{
						pickingModeDtl.stageByOrderSystemRuleValue = false;
						pickingModeDtl.isZonePickingEnabled = false;
						pickingModeDtl.isEnforceStageFlagEnabled = false;
					}
				}
				else{
					pickingModeDtl.stageByOrderSystemRuleValue = false;
					pickingModeDtl.isZonePickingEnabled = false;
					pickingModeDtl.isEnforceStageFlagEnabled = false;
				}
				
				pickingModeDtl.pickingMode = pickingMode;
				pickingModeDtl.isValid = true;
			}
		}
		catch(e)
		{
			pickingModeDtl.isValid = false;
			pickingModeDtl.errorMessage = e.message;
		}

		return pickingModeDtl;
	}
	return {
		'post': doPost
	};
});
