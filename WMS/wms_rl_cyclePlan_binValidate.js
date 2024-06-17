/**
 * Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
 define(['./wms_utility','./wms_translator','./wms_inventory_utility','./wms_tallyScan_utility'],
		 
		 function(utility,translator,invtUtility,tallyScanUtil) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doPost(requestBody) {

		var binValidate = {};
		log.debug({title:'requestBody',details:requestBody});
		var debugString = '';
	 	var itemDetails = {};
	 	var baseUnitId = '';
	 	var baseUnitName = '';
	 	var baseUnitConvRate = '';
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				var warehouseLocationId = requestParams.warehouseLocationId;
				var binName = requestParams.binName;
				var cyclePlanId = requestParams.cyclePlanId;
				var binValidateaction = requestParams.binValidateaction;
				var itemInternalId = requestParams.itemInternalId;
				var itemName = requestParams.itemName;
				var fromReconcileTaskList = requestParams.fromReconcileTaskList;
				var PreviousBinName = requestParams.PreviousBinName;
				var noBinExcepforReconcile='';
				var fromReconcilePlanList = requestParams.fromReconcilePlanList;
	 			var processNameFromState = requestParams.processNameFromState;
	 			var binInternalId = requestParams.binInternalId;
	 			var locUseBinsFlag = requestParams.locUseBinsFlag;

				if(binValidateaction == 'binValidateaction' ){

					if(utility.isValueValid(binName))
					{	

						if(((PreviousBinName != '' && PreviousBinName != null) && PreviousBinName.toUpperCase() != binName.toUpperCase())  && (fromReconcileTaskList == true || fromReconcilePlanList == true))
						{
							log.debug({title:'binName reconcile from tasklist',details:binName});
							//change msg and send stephani
							binValidate['isValid'] = false;
							binValidate["errorMessage"] = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE_RECONCILE');
							//noBinExcepforReconcile = true;
						}
						else
						{
							var binInternalId = utility.getBinInternalId(binName, warehouseLocationId);
							cyclePlanList = invtUtility.getCyclePlanTaskDetails(cyclePlanId, warehouseLocationId, binName, itemInternalId,null,null,noBinExcepforReconcile);
							log.debug({title:'cyclePlanList',details:cyclePlanList});
							if(cyclePlanList.length > 0){
								binValidate['isValid'] = true;
								binValidate['cyclePlanList'] = cyclePlanList;
								binValidate['itemText'] = cyclePlanList[0]['itemText'];
								binValidate['internalid'] = cyclePlanList[0]['internalid'];
								binValidate['binInternalId'] = binInternalId;
								//binValidate['binName'] = binName;
								binValidate['binName'] = cyclePlanList[0]['binnumber'];
								binValidate['itemDescription'] = cyclePlanList[0]['salesdescription'];

							}else{
								binValidate['isValid'] = false;
								binValidate["errorMessage"] = translator.getTranslationString('BINTRANSFER_TOBINVALIDATE.INVALID_BIN');
							}
						}
					}
					else
					{
						binValidate['isValid'] = false;
						binValidate["errorMessage"] = translator.getTranslationString('BINTRANSFER_TOBINVALIDATE.INVALID_BIN');
					}
				}else{
					binValidate['binName'] = binName;
					binValidate['itemInternalId'] = itemInternalId;
					binValidate['itemName'] = itemName;
					binValidate['isValid'] = true;
					binValidate['fromReconcileTaskList']=true;
					binValidate['PreviousBinName'] = binName;
					binValidate['fromReconcilePlanList']=true;

					itemDetails = tallyScanUtil.getItemDetails(itemInternalId,itemDetails) ;
					itemDetails = tallyScanUtil.getTallyScanRuleData(warehouseLocationId,processNameFromState,itemDetails,false);
					if(itemDetails.isTallyScanRequired){
						var arrPlandetails=invtUtility.getPlanDetails(cyclePlanId,itemInternalId,binInternalId,null,locUseBinsFlag);
						if(arrPlandetails.length>0)
						{   
							var taskDetails = arrPlandetails[0];
							var PlanLine=taskDetails.line;
							var PlanLineLocation=taskDetails.location;
							var PlanItemId=taskDetails.item;							 
							var PlanInternalId=taskDetails.internalidText;
							var PlanCountQty=taskDetails.quantity;
							var planStatusId = taskDetails.statusref;
							var transactionUOMId = taskDetails.unitid;
							var transactionUOMName = taskDetails.unit;
							var unitsType = taskDetails.unitstype;

							if((!utility.isValueValid(locUseBinsFlag) || locUseBinsFlag === true) && itemDetails.useItemLevelTallyScan === false){
								binValidate.errorMessage  = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.USEBINS_FLASE');
								binValidate.isValid = false;
							}
							else
							{ 
								if(planStatusId == 'started')
								{
									if(PlanLineLocation===null || PlanLineLocation==='')
									{
										PlanLineLocation = warehouseLocationId;
									}
									var lockError = utility.checkTransactionLock('inventorycount',PlanInternalId, PlanLine);
									if(utility.isValueValid(lockError)){
										binValidate.isValid = false;
										binValidate.errorMessage = lockError;
									}else{

										if(utility.isValueValid(unitsType))
										{ 
											var uomResult = tallyScanUtil.getUOMDetails(unitsType);
											for(var itr in uomResult){
												if(uomResult[itr]['uom.baseunit']){
													baseUnitId = uomResult[itr]['uom.internalid'];
													baseUnitName = uomResult[itr]['uom.unitname'];
													baseUnitConvRate = uomResult[itr]['uom.conversionrate'];
												}
											}
										}
										
										binValidate.lineno = PlanLine;
										binValidate.itemInternalId = PlanItemId;
										binValidate.cyclePlanId = cyclePlanId;
										binValidate.itemType = itemDetails.itemType;
										binValidate.cycPlaninternalid = PlanInternalId;
										binValidate.transactionUOMId = transactionUOMId; 
										binValidate.transactionUOMName = transactionUOMName;  
										binValidate.imageUrl = itemDetails.imageUrl;
										binValidate.stockUnitName = itemDetails.stockUnitText;
										binValidate.salesDescription = itemDetails.salesDesc;
										binValidate.isTallyScanRequired = itemDetails.isTallyScanRequired;
										binValidate.tallyScanBarCodeQty = itemDetails.tallyScanBarCodeQty;
										binValidate.showNoStockButton = true;
										binValidate.binInternalId = binInternalId;
										binValidate.fromBinInternalId = binInternalId;
										binValidate.unitsType = unitsType;
										if(itemDetails.itemType == "serializedinventoryitem" || itemDetails.itemType=="serializedassemblyitem"){
											binValidate.barcodeQuantity = [{'value': '1', 'unit': baseUnitId}];
					                        binValidate.uomSelectionforFirstItr = baseUnitId;//For Serial Item.. It should be base units
					                        binValidate.numberOfTimesSerialScanned = 0;
				                        }else if(!(itemDetails.itemType == 'lotnumberedinventoryitem' || itemDetails.itemType == 'lotnumberedassemblyitem')){
				                        	binValidate.barcodeQuantity = [{'value': '1', 'unit': transactionUOMId}];
			                           	}

				if(utility.isValueValid(PlanCountQty) && locUseBinsFlag!=='undefined' && locUseBinsFlag!==undefined && locUseBinsFlag === false)
				{
					binValidate.itemIsForEdit = true;
					binValidate.fromReconcileItemList =true;
				}
			}
		}
		else
		{
			binValidate.errorMessage = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE.COUNT_ALREADY_COMPLETED');
			binValidate.isValid = false;
		}
	}
} 
}

if(((PreviousBinName != '' && PreviousBinName != null) && PreviousBinName.toUpperCase() != binName.toUpperCase())  && (fromReconcileTaskList == true || fromReconcilePlanList == true))
{
						//change msg and send stephani
						binValidate['isValid'] = false;
						binValidate["errorMessage"] = translator.getTranslationString('CYCLECOUNTPLAN_ITEMVALIDATE_RECONCILE');
					}
				}
			}
			else{
				binValidate['isValid'] = false;
			}
		}
		catch(e)
		{
			binValidate['isValid'] = false;
			binValidate['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
	binValidate.showLineColumnInItemTable = true;
		return binValidate;
	}

	return {
		'post': doPost
	};
});
