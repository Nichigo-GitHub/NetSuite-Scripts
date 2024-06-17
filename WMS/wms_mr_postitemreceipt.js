/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record','N/runtime','./wms_utility', './wms_inboundUtility','./wms_inbound_utility'],

function(record,runtime,utility, inboundUtility,inboundLib) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	
    	try
    	{

    		var scriptObj = runtime.getCurrentScript();
    		var transactionType = scriptObj.getParameter({ name : 'custscript_wmsse_mr_trantype'});
    		var transactionInternalId = scriptObj.getParameter({ name : 'custscript_wmsse_mr_orderid'});
    		var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wmsse_mr_location'});
    		var currentUserId = runtime.getCurrentUser().id;
    		utility.updateScheduleScriptStatus('post item receipt Mapreduce',currentUserId,'In Progress',transactionInternalId,transactionType);
    		var str = 'scriptObj. = ' + scriptObj + '<br>';
    		str = str + 'transactionType. = ' + transactionType + '<br>';	
    		str = str + 'transactionInternalId. = ' + transactionInternalId + '<br>';	
    		str = str + 'warehouseLocationId. = ' + warehouseLocationId + '<br>';
    		    		    				    		
			var opentaskSearchResults='';
			if(transactionInternalId !=null && transactionInternalId !='')
			{				
				opentaskSearchResults= inboundUtility.getOTResultsforIRPosting(transactionInternalId,'','','',warehouseLocationId);

			}			
			return opentaskSearchResults;
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

		var scriptObj = runtime.getCurrentScript();
		log.debug("MAP_Remaining governance units start: " + scriptObj.getRemainingUsage());
		var orderDetails=context.value;	
		var transactionInternalId = scriptObj.getParameter({ name : 'custscript_wmsse_mr_orderid'});		
		context.write(transactionInternalId, orderDetails);
		log.debug("MAP_Remaining governance units end: " + scriptObj.getRemainingUsage());

	}

	/**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */

        function reduce(context) {
	  		try{
				var scriptObj = runtime.getCurrentScript();
				var transactionInternalId = scriptObj.getParameter({ name : 'custscript_wmsse_mr_orderid'});
				context.write({
					key: transactionInternalId,
					value: context.values
				});
			}
			catch(e){
				log.error('Execption in Reduce',e);
            }
        }


		/**
		 * Executes when the summarize entry point is triggered and applies to the result set.
		 *
		 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
		 * @since 2015.1
		 */
		function summarize(context) {
		var debugString = '';
		try
		{
             debugString = debugString + "Summarize :"+"Summarize";
            debugString = debugString + "context :"+context;
             var scriptObj = runtime.getCurrentScript();
             log.debug("SUMMARIZE_Remaining governance units START: " + scriptObj.getRemainingUsage());
                    var postItemReceiptResponse = {};
                    var transactionType = scriptObj.getParameter({ name : 'custscript_wmsse_mr_trantype'});
                    var transactionInternalId = scriptObj.getParameter({ name : 'custscript_wmsse_mr_orderid'});
                    var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wmsse_mr_location'});
                    var targetSubsidiary = scriptObj.getParameter({ name : 'custscript_wmsse_mr_targetsubsidiary'});
                    var opentaskSearchResults=[];
                    var openTaskDetails=[];
					context.output.iterator().each(function(key, value) {
						openTaskDetails= value;
						return true;
					});
				var afterParsingOpenTaskDetails = JSON.parse(openTaskDetails);
				for( var i=0 ;i<afterParsingOpenTaskDetails.length;i++)
                {
					var openTaskData = JSON.parse(afterParsingOpenTaskDetails[i]);
					opentaskSearchResults.push(openTaskData);
				 }
                    debugString = debugString + 'transactionType. = ' + transactionType + '<br>';
                    debugString = debugString + 'transactionInternalId. = ' + transactionInternalId + '<br>';
                    debugString = debugString + 'warehouseLocationId. = ' + warehouseLocationId + '<br>';

			var itemcostruleValue='';
			var useitemcostflag = '';
			if(transactionType == "transferorder")
			{
				
				var transferordervalues = record.load({
					type : 'transferorder',
					id : transactionInternalId
				});

				useitemcostflag = transferordervalues.getValue({fieldId: 'useitemcostastransfercost'});
				if((useitemcostflag == null || useitemcostflag == '' || useitemcostflag == 'null') && useitemcostflag !=false && useitemcostflag !=true)
				{
					itemcostruleValue = inboundUtility.getItemCostRuleValue();
					useitemcostflag = itemcostruleValue;
				}
			}
			if(opentaskSearchResults.length > 0)
			{
				if(transactionType == "transferorder" && useitemcostflag == true)
				{		
					var itemteceiptId = inboundLib.consolidatePostItemReceiptforTO(transactionInternalId,warehouseLocationId,opentaskSearchResults);

					postItemReceiptResponse['itemteceiptId'] = itemteceiptId;
					postItemReceiptResponse['isValid'] = true;
				}
				else
				{

					var recordType = record.Type.PURCHASE_ORDER;
					if (transactionType=='returnauthorization')
						recordType = record.Type.RETURN_AUTHORIZATION;
					else if (transactionType=='transferorder')
						recordType = record.Type.TRANSFER_ORDER;
					var trecord = null;

					if(transactionType=='returnauthorization')
					{
						var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
						if(crossSubsidiaryFeature)
						{
							var locationSubsidiary = utility.getSubsidiaryforLocation(warehouseLocationId)

							trecord  = record.transform({
								fromType: record.Type.RETURN_AUTHORIZATION,
								fromId: transactionInternalId,
								toType: record.Type.ITEM_RECEIPT,
								defaultValues: {orderinvtsub: locationSubsidiary},							
								isDynamic:false
							});
						}
						else
						{
							trecord  = record.transform({
								fromType: recordType,
								fromId: transactionInternalId,
								toType: record.Type.ITEM_RECEIPT,
								isDynamic:false
							});
						}
					}
					else
					{
						var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
						if(centralizesPurchasingandBilling ==true)
						{
							if (targetSubsidiary == null || targetSubsidiary == '' || targetSubsidiary==undefined || targetSubsidiary=='undefined') {
								targetSubsidiary = -1;
							}
							trecord  = record.transform({
								fromType: recordType,
								fromId: transactionInternalId,
								toType: record.Type.ITEM_RECEIPT,
								defaultValues: {targetsub: targetSubsidiary},
								isDynamic:false
							});
						}
						else
						{
							trecord  = record.transform({
								fromType: recordType,
								fromId: transactionInternalId,
								toType: record.Type.ITEM_RECEIPT,
								isDynamic:false
							});
						}

					}

					var prossedLinesArr =  [];
					var actQuantity = '';
					var	itemId='';
					var	batchNo='';
					var	expiryDate='';
					var	enterBin='';
					var	serialArray='';
					for(var otItr=0;otItr<opentaskSearchResults.length;otItr++)
					{		
						var linenum=opentaskSearchResults[otItr]['custrecord_wmsse_line_no'];
						if(prossedLinesArr.indexOf(linenum)==-1)
						{
							prossedLinesArr.push(linenum);
							actQuantity=opentaskSearchResults[otItr]['custrecord_wmsse_act_qty'];
							itemId=opentaskSearchResults[otItr]['custrecord_wmsse_sku'];
							batchNo=opentaskSearchResults[otItr]['custrecord_wmsse_batch_num'];								
							expiryDate=opentaskSearchResults[otItr]['custrecord_wmsse_expirydate'];
							enterBin=opentaskSearchResults[otItr]['custrecord_wmsse_actendloc'];
							serialArray=opentaskSearchResults[otItr]['custrecord_wmsse_serial_no'];

							inboundLib.consolidatePostItemReceipt(trecord,actQuantity,linenum,itemId,transactionType,batchNo,expiryDate,
									warehouseLocationId,enterBin,serialArray,opentaskSearchResults,transactionInternalId,otItr);
						}
					}
					
					if(trecord != null && trecord != '')
					{
						itemReceiptId = trecord.save();
					}
					log.debug('itemReceiptId',itemReceiptId);
					debugString = debugString + 'itemReceiptId. = ' + itemReceiptId + '<br>';
					if(itemReceiptId!=null && itemReceiptId!='')
					{	
						for(var j=0;j<opentaskSearchResults.length;j++)
						{
							var opentaskId =opentaskSearchResults[j]['id'];
							var id = record.submitFields({
								type: 'customrecord_wmsse_trn_opentask',
								id: opentaskId,
								values: {
									'custrecord_wmsse_nsconfirm_ref_no': itemReceiptId,
									'name': opentaskId
								}
							});
						}
					}


					postItemReceiptResponse['itemteceiptId'] = itemReceiptId;
					postItemReceiptResponse['isValid'] = true;
				}
			}
                var currentUserId = runtime.getCurrentUser().id;
                utility.updateScheduleScriptStatus('post item receipt Mapreduce',currentUserId,'Completed',transactionInternalId,transactionType);
                log.debug("SUMMARIZE_Remaining governance units END: " + scriptObj.getRemainingUsage());
        }
        catch(e)
        {
            log.error({title:'debugString',details:debugString});
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
