/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['./wms_utility', './wms_translator','./big', './wms_reversePicks_utility'],

		function(utility, translator, bigJS, revPicksUtility) {

	/**
	 * Function to fetch orders 
	 */
	function doPost(requestBody) {

		var kitComponentPickTaskLines 	= {};
		var debugString 				= '';
		var requestParams 				= '';
		var binNumberString 	 		= '';
		var qtyString			 		= '';

		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{
				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});

				var warehouseLocationId  = requestParams.warehouseLocationId;
				var transactionType 	 = requestParams.transactionType;
				var orderId				 = requestParams.orderId;
				var subItemOf	         = requestParams.subItemOf;
				var kitItemLineNumber    = requestParams.kitItemLineNumber;
				var reversedQuantity	 = requestParams.reversedQuantity;
				var locUseBinsFlag		 = requestParams.locUseBinsFlag;
				var pickingBin			 = requestParams.pickingBin;


				if(locUseBinsFlag){
					kitComponentPickTaskLines.pickingBin 	   = pickingBin;					
				}
				kitComponentPickTaskLines.reversedQuantity 	   = reversedQuantity;
				kitComponentPickTaskLines.isValid			   = true;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(orderId) && utility.isValueValid(subItemOf))
				{
					var kitCompPickTaskLinesArr = [];
					var orderInputObj 			= {}; 

					orderInputObj.warehouseLocationId = warehouseLocationId;
					orderInputObj.orderId 			 = orderId;
					orderInputObj.transactionType	 = transactionType;
					orderInputObj.kitItemLineNumber	 = kitItemLineNumber;
					orderInputObj.subItemOf			 = subItemOf;					
					orderInputObj.action			 = 'componentList';

					kitCompPickTaskLinesArr = revPicksUtility.getKitComponentPickTasks(orderInputObj);
					log.debug({title:'kitCompPickTaskLinesArr :',details:kitCompPickTaskLinesArr});				

					if(kitCompPickTaskLinesArr.length > 0){

						var kitCompPickLinesArr = [];
						var kitCompPickLineObj = {};
						var tempQuantity = 0;
						var binitemIndex='';
						var binQuantity = 0;
						var binNumText = '';
						var itemName = '';
						var tempKitCompArray = [];
						var key = '';
						var kitCompArrLength = kitCompPickTaskLinesArr.length;

						for(var kitCompItr=0; kitCompItr<kitCompArrLength; kitCompItr++)
						{
							kitCompPickLineObj = kitCompPickTaskLinesArr[kitCompItr];
							binNumText 		   = kitCompPickLineObj.binnumberText;
							itemName 		   = kitCompPickLineObj.itemText;	                          

							if(locUseBinsFlag){
								key = itemName+'-'+binNumText;

								if(tempKitCompArray.indexOf(key)==-1){

									kitCompPickLinesArr.push(kitCompPickLineObj);
									tempKitCompArray.push(key);	                            
								}
								else{
									binitemIndex = tempKitCompArray.indexOf(key);
									tempQuantity = kitCompPickLineObj.quantity;
									binQuantity  = kitCompPickLinesArr[binitemIndex].quantity;

									kitCompPickLinesArr[binitemIndex].quantity = Number(bigJS(tempQuantity).plus(binQuantity));
								}								
							}
							else{
								if(tempKitCompArray.indexOf(itemName)==-1){
									kitCompPickLineObj.quantity = kitCompPickLineObj.lineitempickedquantity;									
									kitCompPickLinesArr.push(kitCompPickLineObj);
									tempKitCompArray.push(itemName);
								}
							}
						}


						kitCompArrLength = kitCompPickLinesArr.length;
						for(var itr=0;itr<kitCompArrLength;itr++){

							if(itr==(kitCompArrLength-1)){
								binNumberString = binNumberString + kitCompPickLinesArr[itr].binnumberText;
								qtyString 		= qtyString + kitCompPickLinesArr[itr].quantity;

							}else{
								binNumberString = binNumberString+kitCompPickLinesArr[itr].binnumberText+',';
								qtyString 		= qtyString+kitCompPickLinesArr[itr].quantity+',';
							}						
						}

						log.debug('binNumberString :', binNumberString);
						log.debug('qtyString :', qtyString);

						kitComponentPickTaskLines.KitCompPicktaskLines = kitCompPickLinesArr;
						kitComponentPickTaskLines.reversedQuantity 	   = qtyString;
						if(locUseBinsFlag)
							kitComponentPickTaskLines.pickingBin 	   = binNumberString;
						kitComponentPickTaskLines.isValid			   = true;
					}
					else{
						kitComponentPickTaskLines.errorMessage 	= translator.getTranslationString("REVERSE_PICKS.NO_PICKACTION_LINES");
						kitComponentPickTaskLines.isValid		= false;
					}					
				}
			}
			else
			{
				kitComponentPickTaskLines.isValid = false;	
			}
			log.debug({title:'kitComponentPickTaskLines :',details:kitComponentPickTaskLines});
		}
		catch(e)
		{
			kitComponentPickTaskLines.isValid 		= false;
			kitComponentPickTaskLines.errorMessage 	= e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return kitComponentPickTaskLines;
	}

	return {
		'post': doPost
	};
});
