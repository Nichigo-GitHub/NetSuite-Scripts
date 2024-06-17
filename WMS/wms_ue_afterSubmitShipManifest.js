/**
 *     Copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search','N/runtime','N/record','./wms_utility','./big','./wms_packingUtility'],

		function(search,runtime,record,utility,Big,packUtility) {

	function afterSubmit(scriptContext) {

        var newRecord = scriptContext.newRecord;
		if(scriptContext.type == 'create'){
			log.debug('requestParams' , 'Into Create');
        try{
			var shippingCarrier = newRecord.getValue('custrecord_wmsse_ship_carrier');
			var transactionInternalId =newRecord.getValue('custrecord_wmsse_ship_order');
			var nsConfirmationNumber=newRecord.getValue('custrecord_wmsse_ship_nsconf_no'); 
			var trackingNumber = newRecord.getValue('custrecord_wmsse_ship_trackno');
			var str = 'trackingNumber. = ' + trackingNumber + '<br>';
			str = str + 'transactionInternalId. = ' + transactionInternalId + '<br>';
			str = str + 'nsConfirmationNumber. = ' + nsConfirmationNumber + '<br>';
			log.debug({title:'Parameters for LTL Str ',details:str});
			var containerLp =newRecord.getValue('custrecord_wmsse_ship_contlp');
			var shippingCharges =newRecord.getValue('custrecord_wmsse_ship_charges');
			var packageWeight = newRecord.getValue('custrecord_wmsse_ship_actwght');
			var warehouseLocationId=newRecord.getValue('custrecord_wmsse_ship_location');
			var str3 = 'trackingNumber. = ' + trackingNumber + '<br>';
			str3 = str3 + 'shippingCharges. = ' + shippingCharges + '<br>';	
			str3 = str3 + 'packageWeight. = ' + packageWeight + '<br>';	
			str3 = str3 + 'containerLp. = ' + containerLp + '<br>';	
			str3 = str3 + 'transactionInternalId. = ' + transactionInternalId + '<br>';
			str3 = str3 + 'warehouseLocationId. = ' + warehouseLocationId + '<br>';
			str3 = str3 + 'nsConfirmationNumber. = ' + nsConfirmationNumber + '<br>';
			log.debug({title:' Function Parameters',details:str3});

			log.debug({title:'shippingCarrier',details:shippingCarrier});
			if(shippingCarrier=="LTL"){
								
					if(utility.isValueValid(transactionInternalId) && utility.isValueValid(nsConfirmationNumber)
					 && utility.isValueValid(trackingNumber))
					{
						updateItemfulfillment(nsConfirmationNumber,trackingNumber,shippingCharges,containerLp);
					}
			}
			else 
			{
				log.debug({title:'Quickship',details:'Into QuickShip Orders'});
				
					if(utility.isValueValid(nsConfirmationNumber) && utility.isValueValid(trackingNumber))	{
						
						var frecord = record.load({
							type : 'itemfulfillment',
							id : nsConfirmationNumber,
							isDynamic: false
						});

						var totalLine = frecord.getLineCount({
							sublistId: 'package'
						});

						log.debug({title:'totalLine',details:totalLine});
						var trackingNumberCount=0;
						for(var pckItr=0; pckItr<totalLine; pckItr++)
						{
							var packageContainerLp=frecord.getSublistValue({sublistId: 'package',fieldId: 'packagedescr',line: pckItr});
							var packageTrackingnumber=frecord.getSublistValue({sublistId: 'package',fieldId: 'packagetrackingnumber',line: pckItr});
							// (!utility.isValueValid(packageContainerLp)) this condition is added to count the extra line which is added by default in package details, 
							//  while creating IF 
							if(utility.isValueValid(packageTrackingnumber) || (!utility.isValueValid(packageContainerLp)))	{
								trackingNumberCount++;
							}
							if(containerLp ==packageContainerLp){
								frecord.setSublistValue({sublistId: 'package',line:pckItr,fieldId: 'packagetrackingnumber',value: trackingNumber});
								trackingNumberCount++;
							}   										

						}						
						var lastcharges =frecord.getValue('shippingcost');
						var totalshipcharges;
						if(!utility.isValueValid(shippingCharges)){
							shippingCharges=0;
						}
						if(utility.isValueValid(lastcharges)&& parseFloat(lastcharges)>0){
							totalshipcharges = Number(Big(lastcharges).plus(shippingCharges));
						}

						frecord.setValue('custbody_wmsse_fulfill_shipcost',totalshipcharges);
						if(trackingNumberCount == totalLine)
						{
							var customerId = frecord.getValue('entity');
							var _IsEligibleASN = getIsEligibleASN(customerId);

							if(_IsEligibleASN == "Y"){
								frecord.setValue('custbody_wms_asngeneration',1); 
							}
							frecord.setValue('shipstatus','C'); 
						}
						var resultId = frecord.save();										
						log.debug({title:'resultId',details:resultId});
					}
			}
		}
		catch(exp) {
					log.error({title:'exp',details:exp});	
					log.error({title:'errorMessage',details:exp.message+" Stack :"+exp.stack});
				}
		}
		else if ((scriptContext.type=='edit' || scriptContext.type=='xedit') && 
			(!utility.isValueValid(newRecord.getValue('custrecord_wms_quickship_flag'))) )	{			
			try	{	
				var voidStatus=newRecord.getValue('custrecord_wmsse_ship_void');
				if(voidStatus == "U"){
					var oldRecord = scriptContext.oldRecord;
					var containerLp =oldRecord.getValue('custrecord_wmsse_ship_contlp');
					var trackingNumber =newRecord.getValue('custrecord_wmsse_ship_trackno');	

					if(utility.isValueValid(containerLp) && utility.isValueValid(trackingNumber)){	

						var shipRef5=oldRecord.getValue('custrecord_wmsse_ship_ref5');
						var nsConfirmationNumber=oldRecord.getValue('custrecord_wmsse_ship_nsconf_no'); 
						var shippingCharges ='';
						var pakageWeight=newRecord.getValue('custrecord_wmsse_ship_actwght');
						var payMethodType = oldRecord.getValue('custrecord_wmsse_ship_paymethod');

						var str4 = 'containerLp. = ' + containerLp + '<br>';			
						str4 = str4 + 'voidStatus. = ' + voidStatus + '<br>';				
						str4 = str4 + ' shipRef5= ' + shipRef5 + '<br>';
						str4 = str4 + ' nsConfirmationNumber= ' + nsConfirmationNumber + '<br>';
						str4 = str4 + ' payMethodType= ' + payMethodType + '<br>';
						log.debug({title:'Into Edit parameters',details:str4});				

						if(payMethodType =='FREE_FRIEGHT')	{
							shippingCharges="0.00";
						}
						else if(payMethodType =="COLLECT")	{
							shippingCharges="0.00";
						}
						else if((shipRef5=='')||(shipRef5==null)){
							shippingCharges="";
						}
						else{
							shippingCharges =newRecord.getValue('custrecord_wmsse_ship_charges');
						}
						var itemfulfillmentIdArr =nsConfirmationNumber.split(',');				
						for(var intItr=0;intItr<itemfulfillmentIdArr.length;intItr++){
							updateItemfulfillment(itemfulfillmentIdArr[intItr],trackingNumber,shippingCharges,containerLp,pakageWeight);					
						}
					}
				}
			}
			catch(exp) {
				log.debug({title:'exp',details:exp});	
				log.error({title:'errorMessage',details:exp.message+" Stack :"+exp.stack});	
			}
		}		
	}

	function updateItemfulfillment(nsConfirmationNumber,trackingNumber,shippingCharges,containerLp,pakageWeight){ 	
		var trackingNumberCount=0;
        var containerLpLineArr= [];
		var frecord = record.load({
			type : 'itemfulfillment',
			id : nsConfirmationNumber,
			isDynamic: false
		});

		var packageSublistIdObj =  packUtility.getPackagestabInternalIds(frecord);

		var totalLine = frecord.getLineCount({
			sublistId: packageSublistIdObj.packageSublist
		});

		log.debug({title:'totalLine',details:totalLine});

		for(var intItr=0; intItr<totalLine; intItr++) {
			var packageContainerLp=frecord.getSublistValue({sublistId: packageSublistIdObj.packageSublist,fieldId: packageSublistIdObj.packageDesc,line: intItr});
			var packageTrackingnumber=frecord.getSublistValue({sublistId: packageSublistIdObj.packageSublist,fieldId: packageSublistIdObj.packageTrackingNumber,line: intItr});

			if(utility.isValueValid(packageTrackingnumber) || (!utility.isValueValid(packageContainerLp)))	{
				trackingNumberCount++;
			}

			if(packageContainerLp == containerLp){
				containerLpLineArr.push(intItr);
				trackingNumberCount++;
			}
		}

		if(utility.isValueValid(trackingNumber) && containerLpLineArr.length > 0)	{
			
			var trackingNumArr 	= [];
			var packageWeightArr = [];
			trackingNumArr 		= trackingNumber.split(',');

			if(utility.isValueValid(pakageWeight)){
				packageWeightArr = pakageWeight.split(',');
			}

			if(trackingNumArr.length > 0)	{
				//Updating the same container LP in the Item Fulfillment Packages sublist with tracking number and weight if only 1 tracking number provided in shipping Integrator for 1 container LP
				if(trackingNumArr.length==1 && containerLpLineArr.length==1){
					frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[0],fieldId: packageSublistIdObj.packageTrackingNumber,value: trackingNumber});

					if(utility.isValueValid(pakageWeight) && pakageWeight != 0 && !isNaN(pakageWeight))	{
						frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[0],fieldId: packageSublistIdObj.packageWeight,value: pakageWeight});
					}
				}
				else {
					//Splitting the Container LP in the packages sublist of Item Fulfillment to multiple lines if multiple tracking numbers provided in the Shipping Integrator for 1 container LP
					var updatedCount = 0;
					var lineNumStart = totalLine;

					if(containerLpLineArr.length > trackingNumArr.length){
						for(var trackNumItr=0; trackNumItr<trackingNumArr.length; trackNumItr++){
							var pkgWeight = packageWeightArr[trackNumItr];

							frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[trackNumItr],fieldId: packageSublistIdObj.packageTrackingNumber,value: trackingNumArr[trackNumItr]});
							if(utility.isValueValid(pkgWeight) && pkgWeight != 0 && !isNaN(pkgWeight)){
								frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[trackNumItr],fieldId: packageSublistIdObj.packageWeight,value: pkgWeight});
							}
							updatedCount = updatedCount + 1;
						}

						var lineNumber = containerLpLineArr.length-1;
						for(var i = lineNumber; i>=updatedCount; i--){	
							frecord.removeLine({
								sublistId	: packageSublistIdObj.packageSublist,
								line		: containerLpLineArr[i],
								ignoreRecalc: true
							});
						}
					}
					else{
						log.debug('container lp length is lesser than track num length: ', 'conlp < tracknum lp');

						for(var cntItr=0; cntItr < containerLpLineArr.length; cntItr++)	{
							
							var pkgWeight = packageWeightArr[cntItr];
							frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[cntItr],fieldId: packageSublistIdObj.packageTrackingNumber,value: trackingNumArr[cntItr]});
							if(utility.isValueValid(pkgWeight) && pkgWeight != 0 && !isNaN(pkgWeight))
							{
								frecord.setSublistValue({sublistId: packageSublistIdObj.packageSublist,line:containerLpLineArr[cntItr],fieldId: packageSublistIdObj.packageWeight,value: pkgWeight});
							}
							updatedCount = updatedCount + 1;
						}
						log.debug('updatedCount :', updatedCount);

						for(var trackNumIndex=updatedCount; trackNumIndex < trackingNumArr.length; trackNumIndex++)	{

							if(utility.isValueValid(trackingNumArr[trackNumIndex].trim()))
							{
								var pkgWeight = packageWeightArr[trackNumIndex];

								frecord.insertLine({
									sublistId : packageSublistIdObj.packageSublist,
									line	  : lineNumStart
								});

								frecord.setSublistValue({
									sublistId : packageSublistIdObj.packageSublist,
									fieldId   : packageSublistIdObj.packageDesc,
									line 	  : lineNumStart,
									value     : containerLp
								});							

								frecord.setSublistValue({
									sublistId : packageSublistIdObj.packageSublist,
									fieldId   : packageSublistIdObj.packageTrackingNumber,
									line 	  : lineNumStart,
									value     : trackingNumArr[trackNumIndex]
								});

								//Package weight is mandatory while adding a line to Packages sublist, so if package weight is not provided from Shipping Integrator, we are defaulting to 0.01
								if(!utility.isValueValid(pkgWeight) || isNaN(pkgWeight))
								{
									pkgWeight = '0.01';
								}

								frecord.setSublistValue({
									sublistId : packageSublistIdObj.packageSublist,
									fieldId   : packageSublistIdObj.packageWeight,
									line 	  : lineNumStart,
									value     : pkgWeight
								});

								lineNumStart++;
							}
						}

					}				
				}
			}
		}

		var trackingNumArrValues	= [];
		if(utility.isValueValid(trackingNumber))
		{
			trackingNumArrValues = trackingNumber.split(',');
		}

		var lastcharges =frecord.getValue('custbody_wmsse_fulfill_shipcost');
		log.debug({title:'lastcharges',details:lastcharges});

		var totalshipcharges;
		if(!utility.isValueValid(shippingCharges))
			shippingCharges=0;
		if(utility.isValueValid(lastcharges) && parseFloat(lastcharges)>0 && utility.isValueValid(trackingNumArrValues) && trackingNumArrValues.length==1)
		{
			totalshipcharges = Number(Big(lastcharges).plus(shippingCharges));
		}

		else
		{
			totalshipcharges = shippingCharges;
		}

		if(!utility.isValueValid(totalshipcharges)){
			totalshipcharges =frecord.getValue('shippingcost');		
			if(totalshipcharges==null || totalshipcharges==''){
				totalshipcharges = 0;
			}
		}

		log.debug({title:'totalshipcharges',details:totalshipcharges});
		frecord.setValue('custbody_wmsse_fulfill_shipcost',totalshipcharges);
		if(trackingNumberCount==totalLine)
		{
			var customerId = frecord.getValue('entity');
			var _IsEligibleASN = getIsEligibleASN(customerId);

			if(_IsEligibleASN == "Y"){
				frecord.setValue('custbody_wms_asngeneration',1); 
			}
			frecord.setValue('shipstatus','C'); 
		}

		var resultId = frecord.save();										
		log.debug({title:'resultId',details:resultId});	
	}

	function getIsEligibleASN(customerId){

		var isEligibleASN = "N";

		var SystemRuleName = "Generate EDI 856 outbound ASNs?";

		var _asnRuleValue = utility.getSystemRuleValue(SystemRuleName);	

		if(_asnRuleValue == 'Y'){

			var isCustomerASNEnabled = packUtility.getCustomerASNEnabled(customerId);

			if(isCustomerASNEnabled!=null && isCustomerASNEnabled!=''){
				if(isCustomerASNEnabled.length>0){
					isEligibleASN = "Y";
				}
			}
		}
		return isEligibleASN;
	}

	return {		
		afterSubmit: afterSubmit
	};

});
