/**
 * Copyright � 2023, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','N/record'],

		function(runtime,record) {


	function getInputData(context) {
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var pickTaskArray = scriptObj.getParameter({ name : 'custscript_wms_picktaskdata'});
			var pickTaskObj = {};
			if(pickTaskArray) {
				var pickTaskIdArr = pickTaskArray.split(",");
				for (var picktask = 0; picktask < pickTaskIdArr.length; picktask++) {
					pickTaskObj[pickTaskIdArr[picktask]] = picktask;
				}
			}
			return pickTaskObj;
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
			var scriptObj = runtime.getCurrentScript();
			var picktaskId = context.key;
			var assignedPickerId = scriptObj.getParameter({ name : 'custscript_wms_assignpickerinternalid'});
			var vPicktask = record.load({
				type: 'picktask',
				id: picktaskId
			});
			vPicktask.setValue({fieldId: 'picker', value: assignedPickerId});
			vPicktask.save();
		}
		catch(e)
		{
			log.error({title:'Exception in Reduce',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}
	
	function summarize(summary) {


	}

	return {
		getInputData: getInputData,
		reduce: reduce,
		summarize: summarize
	};

});
