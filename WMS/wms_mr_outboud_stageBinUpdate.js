/**
 * Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','N/record','./wms_utility','./wms_outBoundUtility'],

		function(runtime,record,utility,obUtility) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} splitResults
	 * @property {number} woInternalid - Internal ID of the workorder record instance
	 * @property {string} trantype - Record type 
	 *
	 */
	function getInputData() {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var str = 'scriptObj. = ' + scriptObj + '<br>';
			var pickTaskDetails ={};
			var currentUserId = runtime.getCurrentUser().id;

			var stageBinInternalId = scriptObj.getParameter({ name :'custscript_wms_stagebininternalid'});
			var warehouseLocationId = scriptObj.getParameter({ name :'custscript_wms_warehouselocation'});
			var orderInternalId = scriptObj.getParameter({ name :'custscript_wms_orderinternalid'});
			var pickingType = scriptObj.getParameter({ name :'custscript_wms_pickingtype'});
			var waveInternalId = scriptObj.getParameter({ name :'custscript_wms_waveid'});
			var isZonePickingEnabled = scriptObj.getParameter({ name :'custscript_wms_iszonepickingenabled'});
			var selectedOrderIdStr = scriptObj.getParameter({ name :'custscript_wms_selectedorderidarr'});

			var orderOrWaveId =orderInternalId;
			if(pickingType == 'multiOrder')
			{
				orderOrWaveId= waveInternalId;
			}
			//updating the intermediate custom record status to 'In progress' for internal reference
			utility.updateScheduleScriptStatus('PickTask Stagebin Update Mapreduce',currentUserId,'In Progress',
					orderOrWaveId);

			//getting the picktask details along with the eligible pickaction ids from intermediate custom record,this data is inserted in resltet
			var getPickActionDetails  = utility.getPickActionDetailsFromScheduleScriptRecord('PickTask Stagebin Update Mapreduce',currentUserId,orderOrWaveId);
			
			log.debug('getPickActionDetails',getPickActionDetails);
			if(getPickActionDetails.length>0 && utility.isValueValid(getPickActionDetails[0].custrecord_wms_schpickactionids))
			{
				pickTaskDetails = JSON.parse(getPickActionDetails[0].custrecord_wms_schpickactionids);
			}
			//if no records fetched from intermediate customrecord
			if(Object.keys(pickTaskDetails).length == 0 )
			{	
				var stageBinDetailsObj = {}; 
				var pickTaskIdKeys = {};
				
				isZonePickingEnabled = isZonePickingEnabled || false;
				selectedOrderIdStr = selectedOrderIdStr || "";
				var selectedOrderIdArr = [];
				if(isZonePickingEnabled == "true"){
					isZonePickingEnabled  = true;
				}
				if(isZonePickingEnabled){
					if(utility.isValueValid(selectedOrderIdStr)){
						selectedOrderIdArr = selectedOrderIdStr.split(',');
					}
				}
				
				stageBinDetailsObj.whLocationId = warehouseLocationId;
				stageBinDetailsObj.orderInternalId = orderInternalId;
				stageBinDetailsObj.stageBinInternalId = stageBinInternalId;
				stageBinDetailsObj.pickingType = pickingType;
				stageBinDetailsObj.waveId = waveInternalId;
				stageBinDetailsObj.isZonePickingEnabled = isZonePickingEnabled;
				stageBinDetailsObj.selectedOrderIdArr = selectedOrderIdArr;

				log.debug('stageBinDetailsObj',stageBinDetailsObj);

				var objOrderSearchDetails = obUtility.getPicktasksDetailsReadyToStage(stageBinDetailsObj);
				log.debug('objOrderSearchDetails',objOrderSearchDetails);
				var orderSearchDetailsLength = objOrderSearchDetails.length;
				if(orderSearchDetailsLength>0)
				{
					for(var task = 0 ; task < orderSearchDetailsLength; task++)
					{
						pickTaskIdKeys[objOrderSearchDetails[task].id]=true;
					}
					var pickActionInternalIds = obUtility.getPickactionsIdsForPickTask(Object.keys(pickTaskIdKeys),warehouseLocationId,selectedOrderIdArr);        	
					if(utility.isValueValid(pickActionInternalIds))
					{
						pickTaskDetails = JSON.parse(JSON.stringify(pickActionInternalIds));
					}
				}
			}
			str = str + 'currentUserId. = ' + currentUserId + '<br>';	
			str = str + 'warehouseLocationId. = ' + warehouseLocationId + '<br>';	
			str = str + 'orderInternalId. = ' + orderInternalId + '<br>';
			str = str + 'stageBinInternalId. = ' + stageBinInternalId + '<br>';
			str = str + 'pickingType. = ' + pickingType + '<br>';
			str = str + 'waveInternalId. = ' + waveInternalId + '<br>';			
			str = str + 'pickTaskDetails. = ' + pickTaskDetails + '<br>';
			log.debug({title:'getInputData: Picktask details',details:str}); 
			return pickTaskDetails;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}


	}
	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 */

	function map(context) {	
		var pickActionDetails=context.value;	
		var pickTaskId=context.key;
		var debugstring = 'pickTaskId. = ' + pickTaskId + '<br>';
		debugstring = debugstring + 'pickActionDetails = ' + pickActionDetails + '<br>';
		log.debug({title:'Map:Key and Values',details:debugstring});		
		context.write(pickTaskId, pickActionDetails);
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 */

	function reduce(context) {
		try
		{

			var scriptObj = runtime.getCurrentScript();		
			var stageBinInternalId = scriptObj.getParameter({ name :'custscript_wms_stagebininternalid'});
			var useCoreCartonFields = scriptObj.getParameter({ name :'custscript_wms_usecorecartonfields'});
			var warehouseLocationId = scriptObj.getParameter({ name :'custscript_wms_warehouselocation'});

			var pickTaskId = context.key;		
			var pickActionDetails =context.values[0];			
			var pickActionIdArray = [];
			if(utility.isValueValid(pickTaskId) && utility.isValueValid(pickActionDetails) && utility.isValueValid(stageBinInternalId))
			{
				pickActionIdArray = pickActionDetails.split(',');

				var debugstring = 'scriptObj. = ' + scriptObj + '<br>';
				debugstring = debugstring + 'context = ' + context + '<br>';
				debugstring = debugstring + 'stageBinInternalId. = ' + stageBinInternalId + '<br>';
				debugstring = debugstring + 'useCoreCartonFields. = ' + useCoreCartonFields + '<br>';
				debugstring = debugstring + 'pickTaskId = ' + pickTaskId + '<br>';
				debugstring = debugstring + 'pickActionDetails. = ' + pickActionDetails + '<br>';				
				debugstring = debugstring + 'pickActionIdArray = ' + pickActionIdArray + '<br>';


				var markOpenPicksDoneAutomaticallySysRule = utility.getSystemRuleValue('Automatically mark partial picks as Done',
					warehouseLocationId);

				log.debug({title: 'markOpenPicksDoneAutomaticallySysRule to update function', details: markOpenPicksDoneAutomaticallySysRule});
				// below function is used to update the stagebin,implemented single step to update directly to done
				var pickTaskStagedUpdated = updatePickTaskStageBin(pickTaskId,stageBinInternalId,useCoreCartonFields,pickActionIdArray,markOpenPicksDoneAutomaticallySysRule);

				debugstring = debugstring + 'pickTaskStagedUpdated. = ' + pickTaskStagedUpdated + '<br>';
			}


		}
		catch(e)
		{
			log.error({title:'Exception in reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}

	}


	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

		try
		{
			var scriptObj = runtime.getCurrentScript();
			var currentUserId = runtime.getCurrentUser().id;
			var orderInternalId = scriptObj.getParameter({ name :'custscript_wms_orderinternalid'});
			var pickingType = scriptObj.getParameter({ name :'custscript_wms_pickingtype'});
			var waveInternalId = scriptObj.getParameter({ name :'custscript_wms_waveid'});


			var debugstring = 'scriptObj. = ' + scriptObj + '<br>';
			debugstring = debugstring + 'currentUserId = ' + currentUserId + '<br>';
			debugstring = debugstring + 'orderInternalId = ' + orderInternalId + '<br>';
			debugstring = debugstring + 'pickingType = ' + pickingType + '<br>';
			debugstring = debugstring + 'waveInternalId = ' + waveInternalId + '<br>';


			var orderOrWaveId =orderInternalId;
			if(pickingType == 'multiOrder')
			{
				orderOrWaveId= waveInternalId;
			}
			//updating the intermediate custom record status to 'Complete' for internal reference
			utility.updateScheduleScriptStatus('PickTask Stagebin Update Mapreduce',currentUserId,'Completed',
					orderOrWaveId);
			log.debug({title:'Summarize: Picktask status updated to Done',details:debugstring});  
		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}
	function updatePickTaskStageBin(pickTaskId,selectedLineStageBinId,populateWMSCartonFields,pickActionIdArray,markOpenPicksDone)
	{
		var pickTaskStageRecordId ="";
		var selectedLinePickActionId = "";
		var pickedQty =0;
		var pickActionLineItemStatus ="";
		var stagedBin ="";
		var pickActionLineId ="";
		var itr =0;
		var lineNumberItr =0;
		var invdetailLine ="";
		var invDetailslinelength =0;
		var invDetailsIndex = 0;
		var invDetailLineQuantity =0;
		var pickActionIdArrayLength =pickActionIdArray.length;
		var pickActionLineLookup = {};

		var pickTaskRecord = record.load({type:'picktask',
			id:pickTaskId
		});

		var pickActionLinelength =pickTaskRecord.getLineCount({
			sublistId:'pickactions'
		});
	    var pickActionLineStatus = "";
		for(lineNumberItr = 0; lineNumberItr < pickActionLinelength; lineNumberItr++)
		{
            pickActionLineStatus = pickTaskRecord.getSublistValue({
                sublistId: 'pickactions',
                fieldId: 'status',
                line: lineNumberItr
            });
            if(pickActionLineStatus != "DONE") {
                pickActionLineId = pickTaskRecord.getSublistValue({
                    sublistId: 'pickactions',
                    fieldId: 'id',
                    line: lineNumberItr
                });
                pickActionLineLookup[pickActionLineId] = {'lineNumber': lineNumberItr};
            }
		}
		for(itr = 0; itr < pickActionIdArrayLength; itr++)
		{
			pickedQty =0;
			pickActionLineItemStatus ="";
			stagedBin ="";
			invdetailLine = "";
			invDetailslinelength =0;
			invDetailsIndex = 0;
			invDetailLineQuantity =0;

			selectedLinePickActionId = pickActionIdArray[itr];
			log.debug({title: 'selectedLinePickActionId to update function', details: selectedLinePickActionId});

			if(pickActionLineLookup[selectedLinePickActionId])
			{
				var lineNumber = pickActionLineLookup[selectedLinePickActionId].lineNumber;
				pickedQty = pickTaskRecord.getSublistValue({
					sublistId : 'pickactions',
					fieldId: 'pickedquantity',
					line : lineNumber
				});

				var stagedFlag = true;
				if(pickedQty > 0)
				{						
					stagedBin = pickTaskRecord.getSublistValue({
						sublistId : 'pickactions',
						fieldId : 'stagingbin', 
						line : lineNumber
					});

					if(!utility.isValueValid(stagedBin) || (stagedBin == selectedLineStageBinId))//updating stage bin first
					{
						if(!utility.isValueValid(stagedBin))
						{
							pickTaskRecord.setSublistValue({
								sublistId: 'pickactions',
								fieldId: 'stagingbin',
								line : lineNumber,
								value: selectedLineStageBinId
							});
						}
						invdetailLine = pickTaskRecord.getSublistSubrecord({
							sublistId :'pickactions',
							fieldId : 'inventorydetail',
							line : lineNumber
						});
						invDetailslinelength =invdetailLine.getLineCount({
							sublistId:'inventoryassignment'
						});
						for (invDetailsIndex = 0; invDetailsIndex < invDetailslinelength; invDetailsIndex++)
						{
							invDetailLineQuantity = invdetailLine.getSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'quantity',
								line : invDetailsIndex								
							});
							invdetailLine.setSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'quantitystaged',
								line : invDetailsIndex,
								value : invDetailLineQuantity
							});
							if(populateWMSCartonFields == true)
							{
								invdetailLine.setSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'custrecord_wmsse_staged',
									line : invDetailsIndex,
									value : true
								});
							}
						}
					}

					if( (!utility.isValueValid(stagedBin) && markOpenPicksDone =="N") ||  stagedBin == selectedLineStageBinId || (markOpenPicksDone != undefined &&
						utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="Y")) //updating to done in single step
					{

						lineRemainingQty = pickTaskRecord.getSublistValue({
							sublistId: 'pickactions',
							fieldId: 'remainingquantity',
							line: lineNumber
						});

						pickActionLineItemStatus = pickTaskRecord.getSublistValue({
							sublistId: 'pickactions',
							fieldId: 'status',
							line: lineNumber
						});

						if((lineRemainingQty == 0 ||
							(markOpenPicksDone != undefined && utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="Y"))
						)	{

							invdetailLine = pickTaskRecord.getSublistSubrecord({
								sublistId: 'pickactions',
								fieldId: 'inventorydetail',
								line: lineNumber
							});
							invDetailslinelength = invdetailLine.getLineCount({
								sublistId: 'inventoryassignment'
							});

							if((markOpenPicksDone == undefined || !utility.isValueValid(markOpenPicksDone)) ||
								(utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="N"))
							{
								for (invDetailIndex = 0; invDetailIndex < invDetailslinelength; invDetailIndex++) {

									var invDetailsStageFlag = invdetailLine.getSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantitystaged',
										line: invDetailIndex
									});

									if (invDetailsStageFlag == 0) {
										stagedFlag = false;
										break;
									}
								}
							}
							if (stagedFlag) {
								pickTaskRecord.setSublistValue({
									sublistId: 'pickactions',
									fieldId: 'status',
									line: lineNumber,
									value: 'DONE'
								});
							}
						}

					}
				}
			}
		}
		pickTaskStageRecordId = pickTaskRecord.save();
		

		return pickTaskStageRecordId;
	}

	return {
		getInputData: getInputData,
		map:map,
		reduce: reduce,
		summarize: summarize
	};

});
