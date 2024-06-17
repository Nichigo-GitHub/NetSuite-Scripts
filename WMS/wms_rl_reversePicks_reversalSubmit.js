/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_reversePicks_utility','N/search'],

		function(utility,translator,revPicksUtility,search) {

	/**
	 * Function to validate order
	 */
	function doPost(requestBody) {

		var reversalPickTaskLineObj = {};
		var debugString 	 		= '';
		var requestParams 	 		= '';
		var locUseBinsFlag 	 		= false;
		var isNextPickTaskLineExist = false;
		var KitComponentPickTaskArr = [];
		var isBintransferRequired =false;
		var selectBinSystemRulValue ='N';
		var itemType ='';
		var isNonInventoryFlag = false;

		try{
			requestParams = requestBody.params;
			var warehouseLocationId  = requestParams.warehouseLocationId;
			var transactionType 	 = requestParams.transactionType;
			var pickTaskId 			 = requestParams.pickTaskId;
			var pickActionLineStatus = requestParams.pickTaskLineStatus;
			var pickActionLineNumber = requestParams.pickTaskLineNumber;
			var transaction 		 = requestParams.transaction;
			var orderId				 = requestParams.orderId;
			var itemInternalId		 = requestParams.itemId;
			var transactionNumber	 = requestParams.transactionNumber;
			var subItemOf	         = requestParams.subItemOf;
			var kitItemLineNumber    = requestParams.kitItemLineNumber;
			var binName   			 = requestParams.binName;
			var buttonAction   		 = requestParams.buttonAction;
			var pickingBin   		 = requestParams.pickingBin;
			locUseBinsFlag		 	 = requestParams.locUseBinsFlag;

			if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(pickTaskId)){
				selectBinSystemRulValue = utility.getSystemRuleValue('Choose bins for reversed pick task items?',warehouseLocationId);
				if(utility.isValueValid(itemInternalId)) {
					var columnlookupArray = [];
					columnlookupArray.push('recordtype');
					var itemLookUp = utility.getItemFieldsByLookup(itemInternalId, columnlookupArray);

					if (itemLookUp.recordtype !== undefined) {
						itemType = itemLookUp.recordtype;
					}
					if(itemType =='noninventoryitem' || itemType =='serviceitem'){
						isNonInventoryFlag = true;
					}
				}
				if((selectBinSystemRulValue != 'Y'|| locUseBinsFlag != true) || (selectBinSystemRulValue == 'Y' && (isNonInventoryFlag)) || (buttonAction =="enterBinScreen"))
				{
					var enterBinInternalId='';
					var isValidBinFlag = true;

					if(selectBinSystemRulValue == 'Y' && buttonAction =="enterBinScreen" && utility.isValueValid(binName) &&
						binName !="originalBin" && locUseBinsFlag)
					{
						var binInternalId =	this.validateBin(binName,warehouseLocationId);
						if(utility.isValueValid(binInternalId))
						{	pickingBin=binName;
							enterBinInternalId =binInternalId;
							isBintransferRequired =true;
							isValidBinFlag = true;
						}else{
							isValidBinFlag =false;
						}
					}
				if(isValidBinFlag != false)
				{
				var pickTaskInputObj = {};
				pickTaskInputObj.warehouseLocationId = warehouseLocationId;			
				pickTaskInputObj.pickTaskId			 = pickTaskId;
				pickTaskInputObj.orderId 			 = orderId;
				pickTaskInputObj.pickActionLineNumber= pickActionLineNumber;
				pickTaskInputObj.pickActionLineStatus= pickActionLineStatus;
				pickTaskInputObj.itemInternalId		 = itemInternalId;
				pickTaskInputObj.locUseBinsFlag		 = locUseBinsFlag;
				pickTaskInputObj.transactionType	 = transactionType;
				pickTaskInputObj.kitItemLineNumber	 = kitItemLineNumber;
				pickTaskInputObj.subItemOf			 = subItemOf;
				pickTaskInputObj.toBinIternalId = enterBinInternalId;
				pickTaskInputObj.isBintransferRequired = isBintransferRequired;
				reversalPickTaskLineObj.pickingBin=pickingBin;
				if(utility.isValueValid(pickTaskInputObj.subItemOf) && utility.isValueValid(pickTaskInputObj.kitItemLineNumber)){
					KitComponentPickTaskArr = revPicksUtility.getKitComponentPickTasks(pickTaskInputObj);
					pickTaskInputObj.KitComponentPickTaskArr = KitComponentPickTaskArr;
				}

				revPicksUtility.submitReversal(pickTaskInputObj);

				var transactionInputObj = {};
				transactionInputObj.whLocationId      = warehouseLocationId;
				transactionInputObj.transactionType   = transactionType;
				transactionInputObj.transactionNumber = transactionNumber;
				transactionInputObj.transaction       = transaction;
				transactionInputObj.actionType        = 'validation';

				var pickTaskLinesDtl = revPicksUtility.getPickTaskLines(transactionInputObj);

				if(pickTaskLinesDtl.length > 0){
					isNextPickTaskLineExist = true;
				}
				reversalPickTaskLineObj.isNonInventoryFlag =isNonInventoryFlag;
				reversalPickTaskLineObj.isNextPickTaskLineExist = isNextPickTaskLineExist;
				reversalPickTaskLineObj.isValid = true;				
				}
				else {
					reversalPickTaskLineObj.errorMessage = translator.getTranslationString('SINGLEORDERPICKING.INVALIDBIN.INVALID_INPUT');
					reversalPickTaskLineObj.isValid	= false;
				}
				}else{
					if(locUseBinsFlag){
						reversalPickTaskLineObj.isBinScanRequired =true;
						reversalPickTaskLineObj.isValid = true;
					}
				}
			}
			else{
				reversalPickTaskLineObj.errorMessage = translator.getTranslationString("REVERSE_PICKS.SELECT_VALID_LINE");
				reversalPickTaskLineObj.isValid		 = false;	
			}
		}
		catch(e)
		{
			reversalPickTaskLineObj.isValid 		= false;
			reversalPickTaskLineObj.errorMessage   = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return reversalPickTaskLineObj;
	}

	function validateBin(binName,warehouseLocationId)
	{
		var binInternalId='';
		var	 binSearchResults=search.load({
			id : 'customsearch_wmsse_pickbinvalidate'
		});
		var binSearchFilters = binSearchResults.filters;
		if(utility.isValueValid(binName))
		{
			binSearchFilters.push(search.createFilter({
				name: 'binnumber',
				operator: search.Operator.IS,
				values: binName
			}));
		}
		binSearchFilters.push(search.createFilter({
			name: 'inactive',
			operator: search.Operator.IS,
			values: false
		}));
		if(utility.isValueValid(warehouseLocationId))
		{
			binSearchFilters.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
		}
		var binSearchDetails = binSearchResults.run().getRange({
			start: 0,
			end: 100
		});
		if(utility.isValueValid(binSearchDetails))
		{
			binInternalId=binSearchDetails[0].id;
		}
		return  binInternalId;
	}
	return {
		'post': doPost,
		'validateBin':validateBin
	};
});
