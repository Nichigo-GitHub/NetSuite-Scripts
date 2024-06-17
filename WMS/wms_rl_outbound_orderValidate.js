/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility','./wms_translator','./wms_outBoundUtility','N/runtime'],

		function(utility,translator,obUtility,runtime) {

	/**
	 * Function to validate order
	 */
	function doPost(requestBody) {

		var orderListDetailsArr = {};
		var debugString = '';
		var requestParams = '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{

				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var orderName = requestParams.transactionName;
				var transactionType = requestParams.transactionType;
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var currentUser 	= runtime.getCurrentUser();
				var currentUserId 	= currentUser.id;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(orderName))
				{

					var orderListDetails=[];
					var orderDetails = {}; 

					orderDetails.orderName=orderName;							
					orderDetails.whLocationId=warehouseLocationId;
					orderDetails.transactionType=transactionType;
					orderDetails.isZonePickingEnabled = isZonePickingEnabled;
                    orderDetails.currentUserId = currentUserId;

					orderListDetails=obUtility.getPickingOrderDetails(orderDetails);
					log.debug({title:'orderListDetails',details:orderListDetails});				

					if(orderListDetails.length > 0)
					{	
						var orderDetailRow = orderListDetails[0];
						var isValidOrderScanned = true;
						if(isZonePickingEnabled == true && utility.isValueValid(selectedZones) && selectedZones.length > 0){
							var isValidTaskFound = false;
							for(var order = 0; order < orderListDetails.length;order++){
								var orderDtl = orderListDetails[order];
								var picker = orderDtl.picker;
								var zoneId = orderDtl.zone;
								if(!utility.isValueValid(zoneId)){
									zoneId = "0";
								}
								else{
									zoneId = parseInt(zoneId);
								}
								if((selectedZones.indexOf(zoneId) != -1 )|| (picker == currentUserId)){
									orderDetailRow = orderDtl;
									var lineitemstatus = orderDtl.lineitemstatus;
									if(lineitemstatus != 'DONE' && lineitemstatus != 'STAGED'){
										isValidTaskFound  = true;
										break;
									}
								}
							}
							if(isValidTaskFound){
								isValidOrderScanned = true;
							}
							else{
								isValidOrderScanned = false;
							}
						}
						log.debug({title:'isValidOrderScanned',details:isValidOrderScanned});				

						if(isValidOrderScanned){
							orderListDetailsArr.transactionInternalId = orderDetailRow.internalid;
							orderListDetailsArr.customer = orderDetailRow.customerText;
							orderListDetailsArr.transactionName = orderName;
							orderListDetailsArr.waveName = orderDetailRow.wavename;						
							var orderLinecount =obUtility.getTransactionOrderlineCount(orderListDetailsArr.transactionInternalId,warehouseLocationId,transactionType);
							log.debug({title:'orderLinecount',details:orderLinecount});		

							if(orderLinecount.length>0)
							{
								if(transactionType == 'TrnfrOrd')
								{
									orderListDetailsArr.Task = orderLinecount[0].transferorderitemline;
								}
								else
								{
									orderListDetailsArr.Task = orderLinecount[0].line;
								}


							}
							orderListDetailsArr.isValid=true;
							orderListDetailsArr.gotostage = 'N';
							if(utility.isValueValid(transactionType)){
								orderListDetailsArr.transactionType = transactionType;
							}else{
								orderListDetailsArr.transactionType = 'SalesOrd';
							}
						}
						else{
							orderListDetailsArr.errorMessage = translator.getTranslationString("wms_ZonePicking.INVALID_ORDER_SCANNED");
							orderListDetailsArr.isValid=false;
						}

					}
					else
					{
						orderListDetailsArr.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDBIN.EMPTYINPUT_SALESORDER");
						orderListDetailsArr.isValid=false;
					}
				}
				else
				{
					if(transactionType == 'SalesOrd')
					{
						orderListDetailsArr.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDBIN.EMPTYINPUT_SALESORDER");
					}
					else
					{
						orderListDetailsArr.errorMessage = translator.getTranslationString("SINGLEORDERPICKING.INVALIDBIN.EMPTYINPUT_TRANSFERORDER");
					}
					orderListDetailsArr.isValid=false;	
				}
			}
			else
			{
				orderListDetailsArr.isValid=false;	
			}
			log.debug({title:'orderListDetailsArr',details:orderListDetailsArr});
		}
		catch(e)
		{
			orderListDetailsArr.isValid = false;
			orderListDetailsArr.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return orderListDetailsArr;
	}
	return {
		'post': doPost
	};
});
