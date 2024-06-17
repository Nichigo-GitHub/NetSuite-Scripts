/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_inboundUtility','./wms_inventory_utility','N/search'],

		function(runtime,utility,inboundUtility,inventoryUtiltiy,search) {

	function getInputData(context) {

		try
		{

			var scriptObj = runtime.getCurrentScript();
			
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_whid'});
			var stageBinId =          scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_stagebinid'});

			var stageItemsList = inventoryUtiltiy.getStageInventory(stageBinId,warehouseLocationId);
			log.debug({title:'stageItemsList',details:stageItemsList});
			var obj = {};
			var objArr = [];
			var stageItemsLength = stageItemsList.length;
			if(stageItemsLength > 0){
				for(var len = 0 ;len < stageItemsLength; len++){
					obj = {};
					obj.itemId = stageItemsList[len].getValue({name:'item',summary:'group'});
					obj.units = stageItemsList[len].getValue({name:'stockunit',join:'item',summary:'group'});
					obj.fromStatus = stageItemsList[len].getValue({name:'status',summary:'group'});
					obj.toStatus = stageItemsList[len].getValue({name:'status',summary:'group'});
					objArr.push(obj);
				}
				var currentUserID = runtime.getCurrentUser().id;             
				utility.updateScheduleScriptStatus('WMS Cart load all Map Reduce', currentUserID, 'In Progress',stageBinId,warehouseLocationId);
			}
			return objArr;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}
	}

	function map(context) {
		
		var scriptObj = runtime.getCurrentScript();
		var bintransferObj = JSON.parse(context.value);
		var itemId = bintransferObj.itemId;
		var whLocation = scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_whid'});
		var stageBinId = scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_stagebinid'});
		var cartId = scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_cartid'});
		bintransferObj.whLocation = whLocation;
		bintransferObj.fromBinId = stageBinId;
		bintransferObj.toBinId = cartId;
		bintransferObj.stockConversionRate = 1;

		context.write({
			key: itemId,
			value: bintransferObj
		});

	}

	function reduce(context) {
		try{
			var bintransferObj = JSON.parse(context.values[0]);

			var	itemResults = inboundUtility.getItemDetails(bintransferObj.itemId,bintransferObj.whLocation);
			var itemResultsLength = itemResults.length ? itemResults.length:0;
			var preferedBinInternalId = null;
			var objPutBinQueryDetails = {};
			var itemType = '';
			if (itemResultsLength > 0) {
				var isPreferedBin = false;
				var itemPreferedBinLocationId = null;
				var count = 0;

				for (count = 0; count < itemResultsLength; count++) {
					var itemResultsRec = itemResults[count];

					itemPreferedBinLocationId = itemResultsRec.location;
					isPreferedBin = itemResultsRec.preferredbin;
					if(count == 0) {

						itemType = itemResults[count].recordType;
						bintransferObj.itemType = itemType;

						objPutBinQueryDetails.itemGroup = itemResultsRec.custitem_wmsse_itemgroup;
						objPutBinQueryDetails.itemFamily = itemResultsRec.custitem_wmsse_itemfamily;
						objPutBinQueryDetails.blnMixItem = itemResultsRec.custitem_wmsse_mix_item;
						objPutBinQueryDetails.blnMixLot = itemResultsRec.custitem_wmsse_mix_lot;
						var departments =runtime.isFeatureInEffect({feature: 'departments'});
						var classes =runtime.isFeatureInEffect({feature: 'classes'});
						if (departments){
							objPutBinQueryDetails.department = itemResultsRec.department;
						}
						if (classes){
							objPutBinQueryDetails['class'] = itemResultsRec.class;
						}
					}
					if (isPreferedBin == true && (itemPreferedBinLocationId == bintransferObj.whLocation)) {
						var preferedBinName = itemResults[count].binnumber;
						preferedBinInternalId = inboundUtility.getValidBinInternalId(preferedBinName, bintransferObj.whLocation, null);
						break;
					}

				}
			}
			if(utility.isValueValid(preferedBinInternalId))	{
				bintransferObj.recomendedBinId = preferedBinInternalId;	
			}
			else{

				objPutBinQueryDetails.itemInternalId = bintransferObj.itemId;						
				objPutBinQueryDetails.warehouseLocationId = bintransferObj.whLocation;
				objPutBinQueryDetails.itemType = itemType;
				//objPutBinQueryDetails.lotName = lotName;
				objPutBinQueryDetails.transcationUomInternalId = bintransferObj.units;
				objPutBinQueryDetails.fromBinInternalId = bintransferObj.fromBinId;
				objPutBinQueryDetails.fromStatusId = bintransferObj.fromStatus;
				var abcVelocityResult = inboundUtility.getItemABCVelocityDetails(bintransferObj.itemId,bintransferObj.whLocation);
				if(abcVelocityResult.length > 0){
					for (var itemItr = 0; itemItr < abcVelocityResult.length; itemItr++) {
						var itemRec = abcVelocityResult[itemItr];
						if (itemRec.inventorylocation == bintransferObj.whLocation) {
							objPutBinQueryDetails.locationinvtclassification = itemRec.locationinvtclassification;
							break;
						}
					}
				}
				var binDetails = inboundUtility.getRecomendedBinFromPutStratagie(objPutBinQueryDetails);
				if(binDetails != '{}'){

					bintransferObj.puStratagieId = binDetails.putStratagie;
					bintransferObj.recomendedBinId = binDetails.binId;
				}
			}
			if(utility.isValueValid(bintransferObj.recomendedBinId)) {
				var fields = ['custrecord_wmsse_putseq_no'];
				var binRec = search.lookupFields({type: 'Bin',id: bintransferObj.recomendedBinId,columns: fields});

				if(binRec != undefined)	{
					bintransferObj.recomendedBinSequenceNo = binRec.custrecord_wmsse_putseq_no;	
				}
			}
			bintransferObj.actionType = 'loadAllFromStage';
			bintransferObj.quantity = null;
			bintransferObj.batchno = null;
			inventoryUtiltiy.putawayallBinTransfer(bintransferObj);	



		}
		catch(e){
			log.debug({title:'e',details:e});
		}


	}

	function summarize(summary) {

		try
		{
			log.debug({title:'context summarize',details:summary});

			var scriptObj = runtime.getCurrentScript();    
			log.debug("summarize-Remaining governance summarize: " + scriptObj.getRemainingUsage());

			var stageBinId = scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_stagebinid'});
			var whLocationId = scriptObj.getParameter({ name : 'custscript_wms_cart_loadall_whid'});
			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS Cart load all Map Reduce',currentUserId,'Completed',stageBinId,whLocationId);
		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}


	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};

});
