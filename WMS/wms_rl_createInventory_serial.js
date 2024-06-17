/**

 *    Copyright � 2018, Oracle and/or its affiliates. All rights reserved.

 */


/**

 * @NApiVersion 2.x

 * @NScriptType Restlet

 * @NModuleScope Public

 */

define(['N/search','./wms_utility','./big','./wms_translator','N/record','./wms_inventory_utility','./big','N/runtime'],

		/**

		 * @param {search} search

		 */

		function (search,utility,Big,translator,record,invtUtility,bigJs,runtime) {



	/**

	 * Function to fetch item details.

	 *

	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)

	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'

	 */

	var serialName='';

	var itemInternalId='';

	var statusInternalId = '';

	var warehouseLocationId ='';
  
  var inventoryStatusFeature = '';

	function doPost(requestBody) {



		var serailValidate = {};

		var numberOfTimesSerialScanned ='';

		var scannedQuantity = '';

		var scannedNegativeQuantity = false;

		var debugString = ''; 

		var requestParams = '';

    var impactedRecords = {};
    
   

		if(utility.isValueValid(requestBody)){



			try{



				requestParams = requestBody.params;

				warehouseLocationId = requestParams.warehouseLocationId;

				serialName = requestParams.serialName;

				itemInternalId=requestParams.itemInternalId;

				numberOfTimesSerialScanned =requestParams.numberOfTimesSerialScanned;

				scannedQuantity =requestParams.scannedQuantity;

				scannedNegativeQuantity =requestParams.scannedNegativeQuantity;

				var locUseBinsFlag = requestParams.locUseBinsFlag;

				var itemType = requestParams.itemType;

				statusInternalId = requestParams.statusInternalId;

				var stockConversionRate = requestParams.stockConversionRate;

				var transactionUomName = requestParams.transactionUomName;



				if(utility.isValueValid(serialName) && utility.isValueValid(warehouseLocationId)

						&& utility.isValueValid(itemInternalId))

				{



					serialName =serialName.trim();



					if(!utility.isValueValid(scannedNegativeQuantity))

					{

						scannedNegativeQuantity = false;

					}



					inventoryStatusFeature = utility.isInvStatusFeatureEnabled();



					serailValidate.warehouseLocationId ='';

					serailValidate.serialName ='';

					serailValidate.itemInternalId ='';

					serailValidate.scannedQuantity ='';



					var isSerialExistsInInventory = utility.isInventoryNumberExists(itemInternalId, serialName, warehouseLocationId);



					if (isSerialExistsInInventory && scannedNegativeQuantity != true) {



					

							

							serailValidate.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.SERIAL_EXISTS');



							serailValidate.isValid=false;

					



					}

					else{

						var serialEntryRecords =  this.searchEnteredSerialInSerialEntry();

						if(serialEntryRecords.length > 0){



							serailValidate.errorMessage = translator.getTranslationString('PO_SERIALVALIDATION.SERIAL_SCANNED');



							serailValidate.isValid = false;



						} else {

							serailValidate.isValid = true;

							if (scannedNegativeQuantity != true) {

								createSerial();



								

							} else {

								var serialInternalId = utility.inventoryNumberInternalId(serialName, warehouseLocationId, itemInternalId,'', '');



							

								if (utility.isValueValid(serialInternalId)) {



               					 var serialIdinWMSSerialEntry =	updateSerialNoforNegativeInvAdj(serialName);

									

									if(serialIdinWMSSerialEntry.length > 0){

									

									var serialRec = record.load({

										type: 'customrecord_wmsse_serialentry',

										id: serialIdinWMSSerialEntry[0].id

									});

								

									serialRec.setValue({fieldId: 'custrecord_wmsse_ser_note1', value: ''});

									serialRec.setValue({fieldId: 'custrecord_wmsse_ser_status', value: false});

									serialRec.save();



									

									var serialScanCount = parseInt(numberOfTimesSerialScanned) + 1;

									

									serailValidate.numberOfTimesSerialScanned = serialScanCount;



									serailValidate.isValid = true;



									}

									else

									{

										log.debug('creating serial in wms serial entry since scanned serial exists only on core till now');

										createSerial();//scanned serial existing in core and not in wms serial entry then creating in ems serial entry

									}

								} else {

									serailValidate.errorMessage = translator.getTranslationString('CREATE_INVENTORY_SERIALVALIDATION.SERIAL_SCANNED');



									serailValidate.isValid = false;

								}

							}

							if (serailValidate.isValid != false)

							{

							

								var serialScanCount = parseInt(numberOfTimesSerialScanned) + 1;

								

								serailValidate.numberOfTimesSerialScanned = serialScanCount;



								serailValidate.isValid = true;



							impactedRecords._ignoreUpdate = true;



							if (locUseBinsFlag != undefined && (locUseBinsFlag == false || locUseBinsFlag == 'false') &&



								(parseInt(serialScanCount) == parseInt(scannedQuantity))) {



								//for NOBins feature post invadjustment for last scanned serial.	

								var accountNo = invtUtility.validateLocationForAccNo(warehouseLocationId);

								if(!utility.isValueValid(stockConversionRate)){

									

									stockConversionRate = 1;

								}



								if(accountNo == ''){

									serailValidate.errorMessage = translator.getTranslationString('CREATE_INVENTORY.CONFIG_ACCOUNT');

									serailValidate.isValid = false;



								} else {



										if(scannedNegativeQuantity == true)

										{

											scannedQuantity = scannedQuantity * -1;//This o/p is to set to postive value even if we scan negative,because if scan -2 in qty screen then for serial it should 0 of 2 in serial scanning screen not as 0 of -2

										}





									var nsInvAdjObj = {};

									nsInvAdjObj.itemInternalId=itemInternalId;

									nsInvAdjObj.itemType=itemType;

									nsInvAdjObj.warehouseLocationId=warehouseLocationId;

									nsInvAdjObj.scannedQuantity=Number(bigJs(scannedQuantity).toFixed(8));

									nsInvAdjObj.expiryDate='';

									nsInvAdjObj.lotName='';

									nsInvAdjObj.notes='';

									nsInvAdjObj.date='';

									nsInvAdjObj.period='';

									nsInvAdjObj.accountNo=accountNo;

									nsInvAdjObj.statusInternalId=statusInternalId;

									nsInvAdjObj.units=transactionUomName;

									nsInvAdjObj.stockConversionRate= stockConversionRate;

									if(utility.isValueValid(stockConversionRate) && stockConversionRate != 1){

									var scnQty = Number(Big(scannedQuantity).div(stockConversionRate));

									nsInvAdjObj.scannedQuantity=Number(bigJs(scnQty).toFixed(8));

									}
									nsInvAdjObj.processType = "createInventory";


									var outputObj=invtUtility.invokeNSInventoryAdjustment(nsInvAdjObj);

									serailValidate.itemInternalId = itemInternalId;

									if(utility.isValueValid(transactionUomName)){

										serailValidate.itemUnits = scannedQuantity + ' ' + transactionUomName;

									}

									else {

										serailValidate.itemUnits = scannedQuantity;

									}

									if(outputObj.adjInventoryId == ''){

									

										serailValidate.isValid = false;

										serailValidate.errorMessage = translator.getTranslationString("BINTRANSFER_LOTVALIDATE.FROMBINLIST.INSUFFICIENTINVENTORY");

									

										

									}

									else

									{



										impactedRecords = invtUtility.noCodeSolForCreateInv(outputObj.adjInventoryId, outputObj.openTaskId);



									}











								}

								

							}

							serailValidate.impactedRecords = impactedRecords;

						}

					}

					}}

				else{

					serailValidate.errorMessage = translator.getTranslationString('BINTRANSFER_SERIALVALIDATE.EMPTY_INPUT');

					serailValidate.isValid = false;

				}



			}catch(e){

				serailValidate.isValid = false;

				serailValidate.errorMessage = e.message;

				log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

				log.error({title:'debugString',details:debugString});

			}

		}else{

			serailValidate.isValid = false;

		}

		return serailValidate;

	}

	function createSerial(){
        var currentUserId = runtime.getCurrentUser().id;
       var name = "createInventory" + "^" + currentUserId + "^" + serialName;

		var customrecord = record.create({

			type: 'customrecord_wmsse_serialentry'

		});

		customrecord.setValue({fieldId: 'name', value: name});

		customrecord.setValue({fieldId: 'custrecord_wmsse_ser_item', value: itemInternalId});

		customrecord.setValue({fieldId: 'custrecord_wmsse_ser_qty', value: 1});

		customrecord.setValue({fieldId: 'custrecord_wmsse_ser_no', value: serialName});



		if(inventoryStatusFeature) {

			customrecord.setValue({fieldId: 'custrecord_serial_inventorystatus', value: statusInternalId});

		}



		customrecord.setValue({fieldId: 'custrecord_wmsse_ser_status', value: false});

		customrecord.setValue({fieldId: 'custrecord_wmsse_ser_tasktype', value: 10});

		customrecord.save({

			enableSourcing: false,

			ignoreMandatoryFields: true

		});



	}

	function searchEnteredSerialInSerialEntry(){



		var serialSearch = search.load({

			id: 'customsearch_wmsse_serialdetails_search',

		});

		var filters = serialSearch.filters;

		filters.push(search.createFilter({

			name: 'custrecord_wmsse_ser_no',

			operator: search.Operator.IS,

			values: serialName

		}));

		filters.push(search.createFilter({

			name: 'custrecord_wmsse_ser_status',

			operator: search.Operator.IS,

			values: false

		}));

		filters.push(search.createFilter({

			name: 'custrecord_wmsse_ser_tasktype',

			operator: search.Operator.ANYOF,

			values: 10

		}));

		filters.push(search.createFilter({

			name: 'custrecord_wmsse_ser_item',

			operator: search.Operator.ANYOF,

			values: itemInternalId

		}));



		serialSearch.filters = filters;

		return  utility.getSearchResultInJSON(serialSearch);		

	}



	function updateSerialNoforNegativeInvAdj(serialName) {





		var serialSearch = search.load({



			id: 'customsearch_wmsse_serialentry_details',



		});



		var serailFilters = serialSearch.filters;







		serailFilters.push(search.createFilter({



			name:'custrecord_wmsse_ser_no',



			operator: search.Operator.IS,



			values : serialName



		}));







		serialSearch.filters = serailFilters;



		var serialIdinWMSSerialEntry =utility.getSearchResultInJSON(serialSearch);





return serialIdinWMSSerialEntry;









	







		}



	return{

		'post': doPost,

		'searchEnteredSerialInSerialEntry':searchEnteredSerialInSerialEntry

	}	

});	

