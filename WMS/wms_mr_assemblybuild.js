/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record','N/runtime','./wms_utility','N/search','./big'],

		function(record,runtime,utility,search,Big) {

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

			var currentUserID = runtime.getCurrentUser().id;
			var woInternalid = scriptObj.getParameter({ name :'custscript_wms_woid'});
			var trantype = scriptObj.getParameter({ name :'custscript_wms_wotype'});
			var splitResults = scriptObj.getParameter({ name :'custscript_wms_woresults'});
			
			str = str + 'trantype. = ' + trantype + '<br>';	
			str = str + 'woInternalid. = ' + woInternalid + '<br>';	
			str = str + 'splitResults. = ' + splitResults + '<br>';
			str = str + 'splitResultstypeof. = ' + typeof(splitResults) + '<br>';
			//splitResultsObj = splitResultsObj.replace(/'/g, '"');
			splitResults = JSON.parse(splitResults);
			str = str + 'splitResults. = ' +splitResults+ '<br>';
			utility.updateScheduleScriptStatus('Assebly build SCH',currentUserID,'In Progress',woInternalid,trantype);
			log.debug({title:'str',details:str});
			var results = splitResults;
			return results;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}


	}
	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 */

	function reduce(context) {
		log.debug({title:'context1',details:context});
		var splitResultsObj  =  JSON.parse(context.values[0]);
		log.debug({title:'splitResultsObj',details:splitResultsObj});
		log.debug({title:'splitResultsObj type1',details:typeof(splitResultsObj)});
		log.debug({title:'splitResultsObj.length',details:splitResultsObj.length});
		var scriptObj = runtime.getCurrentScript();
         var woInternalid = scriptObj.getParameter({ name :'custscript_wms_woid'});
         var woAssemblyBuildId = scriptObj.getParameter({ name :'custscript_wms_assemblybuildid'});
         log.debug({title:'woAssemblyBuildId',details:woAssemblyBuildId});
		try
		{
			if(splitResultsObj != null)
			{
				var assemblyBuildOpenTaskId = '';
				var transaction =  '';
				var opentaskactQty =  0;
				var opentaskactSerail = '';
				var vNewSerial=''; 
				var totalSerialArray= [];
				var currentUserID =  runtime.getCurrentUser().id;
				var remainQty = '';
				var createopentaskrec =  '';
				var recordActualSerialIds ='';
				var assemblyBuildQty = splitResultsObj.assemblyBuildQty;
				var openTaskLine = splitResultsObj.openTaskLine;
				var openTaskItem = splitResultsObj.openTaskItem;
				var openTaskLot = splitResultsObj.openTaskLotArray;
				var openTaskSerial = splitResultsObj.openTaskSerialArray;
				log.debug({title:'assemblyBuildQty',details:assemblyBuildQty});
				log.debug({title:'openTaskLine',details:openTaskLine});
				log.debug({title:'openTaskItem',details:openTaskItem});
				log.debug({title:'openTaskLot',details:openTaskLot});
				log.debug({title:'openTaskSerial',details:openTaskSerial});
				log.debug({title:'woInternalid',details:woInternalid});
				var	 getOpenTaskDetails = getOpenTaskLineDetails(woInternalid,openTaskLine,openTaskItem,openTaskLot,openTaskSerial); 
				log.debug({title:'getOpenTaskDetails',details:getOpenTaskDetails});
				if(getOpenTaskDetails.length > 0)
				{
					for(var h=0;h<getOpenTaskDetails.length && parseFloat(assemblyBuildQty) > 0;h++)
					{
						assemblyBuildOpenTaskId = getOpenTaskDetails[h].id;
						transaction = record.load({type:'customrecord_wmsse_trn_opentask',id:assemblyBuildOpenTaskId});
						var tQty = parseFloat(transaction.getValue({fieldId:'custrecord_wmsse_act_qty'}));
						//opentaskactQty = Big(opentaskactQty).plus(tQty);
						opentaskactQty = tQty;
						opentaskactSerail = transaction.getValue({fieldId:'custrecord_wmsse_serial_no'});
						recordActualSerialIds = transaction.getValue({fieldId:'custrecord_wmsse_multi_bins'});
						//opentaskactSerail = opentaskactSerail + "," +transaction.getValue({fieldId:'custrecord_wmsse_serial_no'});
					
						log.debug({title:'assemblyBuildQty',details:assemblyBuildQty});
						log.debug({title:'opentaskactQty',details:opentaskactQty});
						if(parseFloat(assemblyBuildQty) < parseFloat(opentaskactQty))
						{
							vNewSerial='';
							var newSerialInternalId='';
							if(opentaskactSerail !=null && opentaskactSerail !='' &&
									opentaskactSerail !='null' && openTaskSerial !=null && openTaskSerial !='')
							{
								totalSerialArray=opentaskactSerail.split(',');
								var serialInternalIdArray='';
								if(utility.isValueValid(recordActualSerialIds))
								{
									serialInternalIdArray = recordActualSerialIds.split(',');
								}
								for (var serialItr = 0; serialItr < totalSerialArray.length; serialItr++) {
									if(openTaskSerial.indexOf(totalSerialArray[serialItr]) == -1)
									{
										if(vNewSerial =='')
										{
											vNewSerial = totalSerialArray[serialItr];
											if(serialInternalIdArray.length>0)
											{
												newSerialInternalId =serialInternalIdArray[serialItr];
											}
										}
										else
										{
											vNewSerial = vNewSerial +","+ totalSerialArray[serialItr];
											if(serialInternalIdArray.length>0)
											{
												newSerialInternalId =newSerialInternalId.concat(',', serialInternalIdArray[serialItr]);
											}
										}
									}
								}
							}

							remainQty = Big(opentaskactQty).minus(assemblyBuildQty);
							createopentaskrec =  record.copy({type:'customrecord_wmsse_trn_opentask',id:assemblyBuildOpenTaskId});		    	
							createopentaskrec.setValue({fieldId:'name',value:woInternalid});
							createopentaskrec.setValue({fieldId:'custrecord_wmsse_expe_qty', value:Number(parseFloat(remainQty).toFixed(8))});
							createopentaskrec.setValue({fieldId:'custrecord_wmsse_act_qty',value: Number(parseFloat(remainQty).toFixed(8))});
							createopentaskrec.setValue({fieldId:'custrecord_wmsse_upd_user_no',value: currentUserID});
							createopentaskrec.setValue({fieldId:'custrecord_wmsse_serial_no', value:vNewSerial});
							createopentaskrec.setValue({fieldId:'custrecord_wmsse_nsconfirm_ref_no',value:''});
							if(utility.isValueValid(recordActualSerialIds))
								createopentaskrec.setValue({fieldId :'custrecord_wmsse_multi_bins', value: newSerialInternalId});
							var id = createopentaskrec.save();
							log.debug({title:'id',details:id});
							transaction.setValue({fieldId:'custrecord_wmsse_expe_qty', value :Number(parseFloat(assemblyBuildQty).toFixed(8))});
							transaction.setValue({fieldId:'custrecord_wmsse_act_qty',value : Number(parseFloat(assemblyBuildQty).toFixed(8))});

						}

						transaction.setValue({fieldId:'custrecord_wmsse_nsconfirm_ref_no',value:woAssemblyBuildId});
						transaction.save();
						assemblyBuildQty = Number(Big(assemblyBuildQty).minus(opentaskactQty));
					}
				}
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
			var currentUserID = runtime.getCurrentUser().id;
			var woInternalid = scriptObj.getParameter({ name :'custscript_wms_woid'});
			var trantype = scriptObj.getParameter({ name :'custscript_wms_wotype'});

			utility.updateScheduleScriptStatus('Assebly build SCH',currentUserID,'Completed',woInternalid,trantype);

		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}
	function getOpenTaskLineDetails(transactionInternalId, openTaskLineNo, openTaskSku, openTaskLotNum, openTaskSerial, inventoryStatusFeature){

		var openTaskSearch = search.load({
			type : 'customrecord_wmsse_trn_opentask',
			id : 'customsearch_wmsse_assembly_qtyscan_ot'
		});
		
		openTaskSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_order_no',
			operator : search.Operator.ANYOF,
			values : transactionInternalId
		}));

		openTaskSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_wms_status_flag',
			operator : search.Operator.ANYOF,
			values : ['8']
		}));

		openTaskSearch.filters.push(search.createFilter({
			name : 'custrecord_wmsse_nsconfirm_ref_no',
			operator : search.Operator.ANYOF,
			values : ['@NONE@']
		}));

		openTaskSearch.filters.push(search.createFilter({
			name : 'isinactive',
			operator : search.Operator.IS,
			values : false
		}));
		if(utility.isValueValid(openTaskSku)){
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_sku',
				operator : search.Operator.ANYOF,
				values : openTaskSku
			}));
		}
		if(utility.isValueValid(openTaskLineNo)){
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_line_no',
				operator : search.Operator.EQUALTO,
				values : openTaskLineNo
			}));
		}
		if(utility.isValueValid(openTaskLotNum)){
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_batch_num',
				operator : search.Operator.IS,
				values : openTaskLotNum
			}));
		}
		if(utility.isValueValid(openTaskSerial)){
			openTaskSearch.filters.push(search.createFilter({
				name : 'custrecord_wmsse_serial_no',
				operator : search.Operator.CONTAINS,
				values : openTaskSerial
			}));
		}
		//log.debug({title:'openTaskSearch',details:openTaskSearch});
		var openTaskRes = utility.getSearchResultInJSON(openTaskSearch);
		log.debug('openTaskRes', openTaskRes);
		return openTaskRes;
	}
	return {
		getInputData: getInputData,
		reduce: reduce,
		summarize: summarize
	};

});
