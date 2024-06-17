/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record','N/runtime','./wms_utility','./wms_packingUtility'],

		function(record,runtime,utility,packUtility) {


	function getInputData() {

		try
		{
			log.debug({title:'input data',details:'input'});

			var scriptObj = runtime.getCurrentScript();				
			var pickTaskIdArr = JSON.parse(scriptObj.getParameter({name : 'custscript_wms_picktasklinedata'}));
			log.debug({title:'pickTaskIdArr',details:pickTaskIdArr});			
			return pickTaskIdArr;

		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}
	}
	
	

	function reduce(context) {
		try
		{
			log.debug({title:'reduce data',details:'reduce'});
			var scriptObj = runtime.getCurrentScript();
			var currentUserId = runtime.getCurrentUser().id;
			var pickTaskObj =JSON.parse(context.values[0]);
			var whLocation = scriptObj.getParameter({ name : 'custscript_wms_picktaskwhlocation'});
			var binResults = JSON.parse(scriptObj.getParameter({ name : 'custscript_wms_picktaskbinresults'}));
			var locationUseBinFlag=JSON.parse(scriptObj.getParameter({ name : 'custscript_wms_locationUsebinsFlag'}));
           	var itemType=scriptObj.getParameter({ name : 'custscript_wms_markopen_itemtypes'});
			log.debug({title:'pickTaskObj',details:pickTaskObj});
			var pickTaskId=pickTaskObj.pickTaskId;
						var subListpickTaskLineStatus =	pickTaskObj.pickTaskLineStatus;
						var pickLineNo =	pickTaskObj.pickTaskLineNo;
						var pickTaskOrderId =	pickTaskObj.pickTaskLineOrderId;
            var pickitemType =	pickTaskObj.pickTaskLineItemtype;

            log.debug({title:'subListpickTaskLineStatus',details:subListpickTaskLineStatus});
          		if(subListpickTaskLineStatus != 'STAGED' && locationUseBinFlag) {
                            if (pickitemType != 'NonInvtPart' && pickitemType != 'Service') {


                                log.debug('single step when status is not in staged  ', 'single step when status is not in staged');
                                var stageBinId = '';
                                if (binResults.length > 0) {
                                    stageBinId = binResults[0]['internalid'];
                                } else {
                                    log.debug({title: 'noBins', details: 'noBins'});
                                }
                                log.debug('stageBinId',stageBinId);
                                packUtility.updatePickTaskStatusSch(pickTaskId, pickLineNo, pickTaskOrderId, stageBinId);
                            }
							else
							{
								log.debug('single step  for inv part ','single step when status is already in staged');
								packUtility.updatePickTaskStatusSch(pickTaskId,pickLineNo,pickTaskOrderId);
							}
                        }
						else
                        {
                            log.debug('single step when status is already in staged  ','single step when status is already in staged');
                            packUtility.updatePickTaskStatusSch(pickTaskId,pickLineNo,pickTaskOrderId);
                        }


						
			
		}
		catch(e)
		{
			log.error({title:'Exception in Reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}
	
	function summarize(summary) {

		try
    	{ 
    	}
    	catch(e)
    	{
    		log.error({title:'Exception in Summarize',details:e});    		
    		log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
    	}

	}

	return {
		getInputData: getInputData,		
		reduce: reduce,
		summarize: summarize
	};

});
