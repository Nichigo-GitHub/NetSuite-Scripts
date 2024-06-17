/**
 * Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility','./wms_inboundUtility','./wms_inbound_utility','N/task','./big','N/search'],

		function(runtime,utility,inboundUtility,inboundLib,task,Big,search) {

	function getInputData() {

		try
		{

			var scriptObj = runtime.getCurrentScript();
			log.debug({title:"MAP_Remaining governance units getInputData: " ,details: scriptObj.getRemainingUsage()});

			var shipmentId 			= scriptObj.getParameter({ name : 'custscript_wms_mr_ism_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_location'});
			var fromMapReduceScriptCall = scriptObj.getParameter({ name : 'custscript_wms_fromMapReduceScriptCall'}); 

			log.debug({title:'Shipment Id:',details:shipmentId});
			log.debug({title:'Location :', details:warehouseLocationId});

			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS Inb Shipment ReceiveAll Map Reduce',currentUserId,'In Progress',shipmentId,warehouseLocationId);
			

			var lineItemDetails = [];
			if(utility.isValueValid(shipmentId) && utility.isValueValid(warehouseLocationId))
			{
				lineItemDetails = inboundLib.getlineItemsforReceiveAll(shipmentId ,warehouseLocationId);
			}
			if(lineItemDetails.length == 0){
				var manuallyPostIRSystemRuleValue = utility.getSystemRuleValue('Manually post item receipts?',warehouseLocationId);
				if(((fromMapReduceScriptCall == 'true' || fromMapReduceScriptCall == true) && manuallyPostIRSystemRuleValue == 'N' )){
					lineItemDetails = getReceivedLineItemsOfISM(shipmentId , warehouseLocationId);
				}
			}

			return lineItemDetails;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}
	}

	function map(context) {
		var scriptObj = runtime.getCurrentScript();
		log.debug({title:"MAP_Remaining governance units map: " ,details: scriptObj.getRemainingUsage()});

		var shipmentId          = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_shipmentid'});
		var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_location'});		
		var itemList   			= context.value;


		context.write({
			key : shipmentId,
			value : itemList
		});
		log.debug({title:"MAP_Remaining governance units map end: ",details: scriptObj.getRemainingUsage()});
	}

	function reduce(context) {
		var debugString = '';
		try
		{
			var scriptObj = runtime.getCurrentScript();
			var remainingUsage = scriptObj.getRemainingUsage();

			log.debug("MAP_Remaining governance units reduce: " + scriptObj.getRemainingUsage());

			var shipmentId 			= scriptObj.getParameter({ name : 'custscript_wms_mr_ism_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_location'});
			var binInternalId 		= scriptObj.getParameter({ name : 'custscript_wms_mr_ism_bininternalid'});
			var invtStatusId 		= scriptObj.getParameter({ name : 'custscript_wms_mr_ism_invstatusid'});
			var transactionType='ISM';
      var fromMapReduceScriptCall = scriptObj.getParameter({ name : 'custscript_wms_fromMapReduceScriptCall'}); 
			var manuallyPostIRSystemRuleValue = utility.getSystemRuleValueWithProcessType('Manually post item receipts?',warehouseLocationId,transactionType);
			var itemType = '';
			var unitType = '';
			var conversionRate = '';
			var itemListDtl=[];
			var itemList =context.values;
			for( var i=0 ;i<context.values.length;i++)
			{
				var lineItemData = JSON.stringify(JSON.parse(itemList[i]));
				var taskArray =JSON.parse(lineItemData);				
				itemListDtl.push(taskArray);
			}

			log.debug({title:'REDUCE : shipmentItemListDtl Array :',details:itemListDtl});

			// Creating Receive Inbound Shipment
			var shipmentLineNo = '';
			var shipId = '';
			if(fromMapReduceScriptCall != true && fromMapReduceScriptCall != "true"){
				shipId = inboundUtility.iSM_receiveAll(shipmentId,warehouseLocationId,binInternalId,shipmentLineNo,manuallyPostIRSystemRuleValue,invtStatusId);
			}
			else{
				if((fromMapReduceScriptCall == true || fromMapReduceScriptCall == "true") && manuallyPostIRSystemRuleValue == 'N'){
					shipId = shipmentId;
				}
			}
			var columnlookupArray =[];
			columnlookupArray.push('recordtype');
			columnlookupArray.push('unitstype');
			var itemLookUp = '';
			var quantity = '';
			var quantityReceived = '';
			var lineItemOpentaskRcvQty ='';
			var shipmentLineNo = '';
			var openPutAwayDetails = inboundUtility.getInbShipmentOpenTaskDetails(shipmentId,'',warehouseLocationId);
			var isFromMapReduceScriptCall = false;
			if(((fromMapReduceScriptCall == 'true' || fromMapReduceScriptCall == true) && manuallyPostIRSystemRuleValue == 'N' )){
				openPutAwayDetails = getReceivedOpenTaskDetails(shipmentId,'',warehouseLocationId);
				isFromMapReduceScriptCall = true;
				log.debug({title:'openPutAwayDetails',details:openPutAwayDetails.length});
			}
			for(var i=0;i<itemListDtl.length;i++)
			{
				var scriptObj = runtime.getCurrentScript();
				var remainingUsage = scriptObj.getRemainingUsage();
				if(remainingUsage > 100){
					quantity = itemListDtl[i].quantityremaining;
					quantityReceived = itemListDtl[i].quantityreceived;
					shipmentLineNo = itemListDtl[i].inboundshipmentitemid;
					itemType = '';
					if(JSON.stringify(openPutAwayDetails) != '{}')
					{
						lineItemOpentaskRcvQty = openPutAwayDetails[shipmentLineNo];
						if((!utility.isValueValid(lineItemOpentaskRcvQty) || lineItemOpentaskRcvQty == 0) &&
								isFromMapReduceScriptCall == true && quantity == 0){
							quantity = quantityReceived;
							itemListDtl[i]['quantityremaining'] = quantityReceived;
							quantityReceived = "";
							log.debug({title:'shipmentLineNo',details:openPutAwayDetails[shipmentLineNo]});
						}
					}
					if(parseFloat(quantity) > 0	&& (!utility.isValueValid(quantityReceived) && !utility.isValueValid(lineItemOpentaskRcvQty)))
					{
						itemLookUp = utility.getItemFieldsByLookup(itemListDtl[i]['item'],columnlookupArray);
						if (itemLookUp.recordtype !== undefined){
							itemType = itemLookUp.recordtype;
						}
						if (itemLookUp.unitstype !== undefined &&
								itemLookUp.unitstype[0] !== undefined){
							unitType = itemLookUp.unitstype[0].value;
						}
						var objOpentaskDetails = {};
						objOpentaskDetails['poInternalId'] 	= itemListDtl[i]['purchaseorder'];
						objOpentaskDetails['FetchedItemId']	= itemListDtl[i]['item'];
						objOpentaskDetails['poLineno']		= itemListDtl[i]['inboundshipmentitemid'];
						objOpentaskDetails['enterQty']		= itemListDtl[i]['quantityremaining'];
						objOpentaskDetails['enterBin']		= binInternalId;
						objOpentaskDetails['expectedQty']	= itemListDtl[i]['quantityexpected'];

						if(itemListDtl[i]['unitText'] != null && itemListDtl[i]['unitText'] != undefined)	{

							var uomconversionrate = utility.getConversionRate(itemListDtl[i]['unitText'],unitType);
							conversionRate = uomconversionrate;
						}

						if(itemType == "noninventoryitem" || itemType == "otherchargeitem" ||
								itemType =="serviceitem" || itemType =="downloaditem" || itemType =="giftcertificateitem")
						{
							objOpentaskDetails['enterBin']= '';
						}
						objOpentaskDetails['itemType']		= itemType;
						objOpentaskDetails['whLocation']	= warehouseLocationId;			
						objOpentaskDetails['poname']		= itemListDtl[i]['purchaseorderText'];
						objOpentaskDetails['taskType']		= 'PUTW';
						objOpentaskDetails['trantype']		= 'purchaseorder';
						objOpentaskDetails['actualBeginTime']= utility.getCurrentTimeStamp();
						objOpentaskDetails['customer'] 		= '';
						objOpentaskDetails['systemRule'] 	= manuallyPostIRSystemRuleValue;
						objOpentaskDetails['uom']			= itemListDtl[i]['unitText'];
						objOpentaskDetails['conversionRate']=conversionRate;
						objOpentaskDetails['vInvStatus_select']= invtStatusId;
						objOpentaskDetails['strBarCode']	= '';	
						objOpentaskDetails['shipmentReceiptId']= shipId;
						objOpentaskDetails['shipmentId']	= shipmentId;


						var openTaskId = inboundUtility.updateOpenTask(objOpentaskDetails);
					}

				}
				else{
					log.debug('remainingUsage',remainingUsage);
					var shipmentId          = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_shipmentid'});
					var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_location'});	
					var binInternalId 		= scriptObj.getParameter({ name : 'custscript_wms_mr_ism_bininternalid'});
					var invtStatusId 		= scriptObj.getParameter({ name : 'custscript_wms_mr_ism_invstatusid'});
					var mrTask = task.create({
						taskType: task.TaskType.MAP_REDUCE,
						scriptId: 'customscript_wms_mr_ism_receiveall',
						deploymentId: null,
						params : {
							"custscript_wms_fromMapReduceScriptCall" : true	,	
							"custscript_wms_mr_ism_shipmentid" : shipmentId,
							"custscript_wms_mr_ism_location":warehouseLocationId,
							"custscript_wms_mr_ism_invstatusid":invtStatusId,
							"custscript_wms_mr_ism_bininternalid":binInternalId


						}
					});

					// Submit the map/reduce task
					var mrTaskId = mrTask.submit();
					break;

				}
			}

		}
		catch(e)
		{
			log.error({title:'Exception in reduce',details:e});    		
		}

	}

	function summarize(summary) {

		try
		{
			var scriptObj = runtime.getCurrentScript();    
			log.debug("summarize-Remaining governance summarize: " + scriptObj.getRemainingUsage());

			var shipmentId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_shipmentid'});
			var warehouseLocationId = scriptObj.getParameter({ name : 'custscript_wms_mr_ism_location'});
			var currentUserId = runtime.getCurrentUser().id;
			utility.updateScheduleScriptStatus('WMS Inb Shipment ReceiveAll Map Reduce',currentUserId,'Completed',shipmentId,warehouseLocationId);
		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}
	function getReceivedLineItemsOfISM(shipmentId, warehouseLocationId)
	{
		var itemListSrch = search.load({
			id : 'customsearch_wms_ism_item_list'
		});

		var itemListSrchArr = [];
		var itemListObj = [];
		if(utility.isValueValid(shipmentId)){
			if(utility.isValueValid(warehouseLocationId)){
				itemListSrchArr.push(search.createFilter({
					name: 'receivinglocation',
					operator: search.Operator.ANYOF,
					values: warehouseLocationId
				}));	
			}


			itemListSrchArr.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));	




			itemListSrch.filters = itemListSrchArr;
			itemListObj = utility.getSearchResultInJSON(itemListSrch);
		}

		log.debug('AABitemList Obj before conversion:', itemListObj.length);

		for(var index in itemListObj)
		{
			if(utility.isValueValid(itemListObj[index]['unitstype']))
			{
				var convRate = utility.getConversionRate(itemListObj[index]['unitText'] ,itemListObj[index]['unitstype']);

				if(utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index]['quantityreceived']))
				{
					itemListObj[index]['quantityreceived'] = utility.uomConversions(parseFloat(itemListObj[index]['quantityreceived']),convRate,1);
				}

				if(utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index]['quantityremaining']))
				{
					itemListObj[index]['quantityremaining'] = utility.uomConversions(parseFloat(itemListObj[index]['quantityremaining']),convRate,1);
				}

				if(utility.isValueValid(convRate) && utility.isValueValid(itemListObj[index]['quantityexpected']))
				{
					itemListObj[index]['quantityexpected'] = utility.uomConversions(parseFloat(itemListObj[index]['quantityexpected']),convRate,1);
				}
			}
		}


		return itemListObj;	
	}

	function getReceivedOpenTaskDetails(shipmentId,shipmentNum,whLocation){
		log.debug({title:'shipmentId',details:shipmentId});
		log.debug({title:'whLocation',details:whLocation});
		var opentaskArr = {};
		var filterStrat = [];
		if (utility.isValueValid(shipmentId))
		{
			if (utility.isValueValid(whLocation))
			{
				filterStrat.push(search.createFilter({
					name: 'custrecord_wmsse_wms_location',
					operator: search.Operator.ANYOF,
					values: whLocation
				}));
			}
			filterStrat.push(search.createFilter({
				name: 'custrecord_wmsse_inbshipment',
				operator: search.Operator.ANYOF,
				values: shipmentId
			}));


			var objOpentaskDetailsSearch = search.load({id: 'customsearch_wms_inbshipmnt_opentask_dtl'});
			objOpentaskDetailsSearch.filters = filterStrat;
			var objOPentaskDetails = utility.getSearchResultInJSON(objOpentaskDetailsSearch);

			log.debug('open task dtl :', objOPentaskDetails);

			if (objOPentaskDetails.length > 0) {
				for (var objOPentask in objOPentaskDetails) {
					var objOPentaskRec = objOPentaskDetails[objOPentask];	
					var conversionRate = objOPentaskRec.custrecord_wmsse_conversionrate;
					var expectedQuantity = objOPentaskRec.custrecord_wmsse_expe_qty;
					if(!utility.isValueValid(conversionRate)){
						conversionRate = 1;
					}
					opentaskArr[objOPentaskRec['custrecord_wmsse_line_no']] = Number(Big(expectedQuantity).mul(conversionRate));
				}
			}
		}
		log.debug({title:'opentaskArr',details:opentaskArr});
		return opentaskArr;
	}

	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};

});
