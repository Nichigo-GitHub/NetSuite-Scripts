/**
 * Copyright 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/record','./wms_translator','./wms_utility','./big','N/wms/recommendedBins'],

		function(record,translator,utility,bigJS,binApi) {

	function doPost(requestBody) {

		var binArry = [];
		var binDtl = {};

		var debugString = '';

		try	{

			if(utility.isValueValid(requestBody)) {

				var requestParams= requestBody.params;

				var uomDefltSts ='';
				var picktaskId = requestParams.pickTaskId;
				var transactionUomConversionRate = requestParams.transactionUomConversionRate;
				var uomList = requestParams.uomList;
				var uomOutList = requestParams.uomOutList;
				var  isZonePickingEnabled   = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;
				var recomendedBinZoneId = requestParams.recomendedBinZoneId;



				log.debug({title:'requestParams',details:requestParams});	
				if(utility.isValueValid(picktaskId)) {
					debugString = debugString + 'Pick Task Id:'+picktaskId;
					var binArray = [];

					var selectedStatusId = '';
					var selectedStatusName = '';
					var defaultStatusName = '';
					var defaultStatusId = '';
					var statusListArr = [];
					var coreStatusList = [];
					var allAvailbleStatusList = [];
					var notAvailbleStatusList = [];

					var binResults = binApi.computeBinListForPickTask(parseInt(picktaskId));
					log.debug({title:'binResults',details:binResults});
					if (binResults != null && binResults != undefined && binResults.status.code == binApi.ResultCode.SUCCESS){

						if(!utility.isValueValid(isZonePickingEnabled)){
							isZonePickingEnabled = false;
						}
						if(!utility.isValueValid(selectedZones)){
							selectedZones = [];
						}

						var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
						var selectedConversionRate = '';
						var selectedUOMText = '';
						var isUomChanged = false;
						if(utility.isValueValid(uomList)){ 

							var selectedUomList = requestParams.uomList;
							selectedConversionRate =  selectedUomList.id;
							selectedUOMText = selectedUomList.value;
							isUomChanged = true;
						}
						if(utility.isValueValid(requestParams.statusList)){
							var selectedStatusList = requestParams.statusList;
							log.debug({title:'selectedStatusList',details:selectedStatusList});
							selectedStatusId = selectedStatusList.id;
							selectedStatusName = selectedStatusList.value;
						}
						if(inventoryStatusFeature){
							var inventoryStatusOptions = utility.getInventoryStatusOptions();
							log.debug({title:'inventoryStatusOptions',details:inventoryStatusOptions});
							if(inventoryStatusOptions.length>0)	{
								var staticOptionsArr = this.getInvStatusAllAllAvailableNotAvailableOptions();
								if(staticOptionsArr.length > 0){

									for (var result in staticOptionsArr){
										if(staticOptionsArr[result]){
											if(!utility.isValueValid(selectedStatusId)){
												var row = staticOptionsArr[result];
												var listValue = row.value;
												if(listValue == 'All Available'){
													defaultStatusName = listValue;
													defaultStatusId = row.id;
												}
											}
											statusListArr.push(staticOptionsArr[result]);// ALL,AllAvailable,Not Available Options filling
										}
									}
								}
								for(var invtStatus in  inventoryStatusOptions){ 
									if(inventoryStatusOptions[invtStatus]){
										var inventoryStatusRow = inventoryStatusOptions[invtStatus];
										var statusText =inventoryStatusRow.name;
										var statusId =inventoryStatusRow.internalid;
										var makeInventoryAvailable =inventoryStatusRow.listInventoryavailable;

										var coreStatusLst = {'value':statusText,'id':statusId,'inventoryavailable':makeInventoryAvailable};
										statusListArr.push(coreStatusLst);
										coreStatusList.push(coreStatusLst);
									}
								}

								for(var avialInvItr in  coreStatusList)	{
									if(coreStatusList[avialInvItr]){
										var avilInvStatusforcommitement = coreStatusList[avialInvItr].inventoryavailable;

										if(avilInvStatusforcommitement){
											allAvailbleStatusList.push(coreStatusList[avialInvItr].value);
										}
										else{
											notAvailbleStatusList.push(coreStatusList[avialInvItr].value);
										}
									}
								}   

							}
						}


						var qty = 0;
						var binId = '';
						var binObj ={} ;
						var tempBinQty =  '';
						var binIndex = '';
						var binQty = '';
						var totalbinQty = '';
						var binResultsObj = binResults.bins;
						log.debug('binResultsObj',binResultsObj);  

						for (var index = 0; index < binResults.bins.length; index++) {

							var binObject = binResults.bins[index];
							log.debug(' binObject', binObject);
							if (binObject.data) {
								binId = '';
								qty = 0;

								var binQtyArr = binObject.data.quantities;
								var zoneSeq = '';
								if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true 
										&& utility.isValueValid(selectedZones) ){ 
									zoneSeq = selectedZones.length + 1;
								}
								for(var qtyIndex=0; qtyIndex<binQtyArr.length; qtyIndex++){
									binObj ={};
									binId = binObject.data.bin.id;
									binObj.binId = binObject.data.bin.id;
									binObj.binNumber = binObject.data.bin.name;
									binObj.itemText = binObject.data.item.name;									
									binObj.status =  binQtyArr[qtyIndex].status.name;
									binObj.statusId =  binQtyArr[qtyIndex].status.id;
									binObj.quantity =  binQtyArr[qtyIndex].quantity;
									binObj.zone =  binObject.data.zone.name;
									binObj.zoneId =  binObject.data.zone.id;
									binObj.zoneSeq =  zoneSeq;
									if(utility.isValueValid(binObj.zoneId) && utility.isValueValid(isZonePickingEnabled) &&
											isZonePickingEnabled == true && utility.isValueValid(selectedZones)
											&& selectedZones.indexOf(binObj.zoneId) != -1){
										if(utility.isValueValid(recomendedBinZoneId) &&
												( parseInt(recomendedBinZoneId) == parseInt(binObj.zoneId))){
											binObj.zoneSeq =  0;
										}
										else{
											binObj.zoneSeq =  selectedZones.indexOf(binObj.zoneId)+1;
										}
									}
									binObj.seqNum =  binObject.data.seqNum;

									qty = binObj.quantity;
									if(isUomChanged){
										if(utility.isValueValid(qty) && utility.isValueValid(selectedConversionRate) &&
												utility.isValueValid(transactionUomConversionRate) 
												&& (selectedConversionRate != transactionUomConversionRate)){
											binObj.quantity = utility.uomConversions(qty,selectedConversionRate,
													transactionUomConversionRate);
										}
									}

									if(inventoryStatusFeature){
										var binStatusName = binObj.status;
										log.debug({title:'selectedStatusId',details:selectedStatusId});
										if(utility.isValueValid(selectedStatusId) || utility.isValueValid(defaultStatusId))	{
											if(binStatusName == selectedStatusName || selectedStatusId == 'All'){//this will execute to display bins of selected indiviual status only 
												binArry.push(binObj);
											}
											else if(selectedStatusId == 'T' || defaultStatusId == 'T'){//this will execute to display bins of selected All Available status only 
												if(allAvailbleStatusList.indexOf(binStatusName) != -1){
													binArry.push(binObj);
												}
											}
											else if(selectedStatusId == 'F'){//this will execute to display bins of selected Not Available status only 
												if(notAvailbleStatusList.indexOf(binStatusName) != -1){
													binArry.push(binObj);
												}
											}
											else{}
										}
									}
									else{// no inv status acounts
										log.debug({title:'binId before binArray',details:binId});
										if(binArray.indexOf(binId) == -1)	{
											binArry.push(binObj);
											binArray.push(binId);
										}
										else{
											tempBinQty =  '';
											binIndex = '';
											binQty = '';
											totalbinQty = '';
											tempBinQty = binObj.quantity;
											if(!utility.isValueValid(tempBinQty)){
												tempBinQty = 0;
											}
											binIndex = binArray.indexOf(binId);
											binQty = binArry[binIndex].quantity;
											totalbinQty = Number(bigJS(binQty).plus(tempBinQty));
											binArry[binIndex].quantity = totalbinQty;
										}
									}
									log.debug({title:'binArry in feature',details:binArry});

								}
							}
						}
						if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
							binArry.sort(function(a, b) {
								return a.zoneSeq === b.zoneSeq ? a.seqNum - b.seqNum : a.zoneSeq - b.zoneSeq;

							});
						}

						if(inventoryStatusFeature)
						{
							if(binArry.length>0){  

								if(utility.isValueValid(requestParams.uomDfltStatus)){
									uomDefltSts =  requestParams.uomDfltStatus;
								}else{
									var vPicktask = record.load({
										type  		   : 'picktask',
										id   : picktaskId
									});
									var vItemQtyUnits = vPicktask.getText({fieldId:'units'});
									if(vItemQtyUnits != ''){
										uomDefltSts =  vItemQtyUnits;
									}
								}
								binDtl = {
										binDtls 	:  binArry,
										uomList : uomOutList,
										uomDefaultStatus : uomDefltSts,
										statusList : statusListArr,
										selectedStatusName : defaultStatusName,	
										isValid      : true
								};
								debugString = debugString + ' Bin Dtls :'+binArry;
							}
							else{

								binDtl = {

										binDtls 	: '',
										uomList : uomOutList,
										uomDefaultStatus : uomDefltSts,
										statusList : statusListArr,
										selectedStatusName : defaultStatusName,	
										isValid      : true

								};
							}
						}
						else{
							if(binArry.length>0){  

								if(utility.isValueValid(requestParams.uomDfltStatus)){
									uomDefltSts =  requestParams.uomDfltStatus;
								}else{
									var picktask = record.load({
										type  		   : 'picktask',
										id   : picktaskId
									});
									var itemQtyUnits = picktask.getText({fieldId:'units'});
									if(itemQtyUnits != ''){
										uomDefltSts =  itemQtyUnits;
									}
								}
								binDtl = {
										binDtls 	:  binArry,
										uomList : uomOutList,
										uomDefaultStatus : uomDefltSts,
										isValid      : true
								};
								debugString = debugString + ' Bin Dtls :'+binArry;
							}
							else{

								binDtl = {
										isValid              : false
								};
							}
						}
					}
					else{

						binDtl = {
								errorMessage : translator.getTranslationString('SINGLEORDERPICKING.INVALIDINPUT'),
								isValid              : false
						};
					}

				}
				else{

					binDtl = {
							errorMessage : translator.getTranslationString('SINGLEORDERPICKING.INVALIDINPUT'),
							isValid              : false
					};
				}

			}
			else{

				binDtl = {
						errorMessage : translator.getTranslationString('SINGLEORDERPICKING.INVALIDINPUT'),
						isValid: false
				};	
			}
		}
		catch(e){

			binDtl.isValid = false;
			binDtl.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+' Stack :'+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}

		return  binDtl;   	
	}
	function getInvStatusAllAllAvailableNotAvailableOptions(){
		var optionsArr = [];
		var inventoryResults = utility.getInventoryStatusOptionsList();
		if(inventoryResults.length > 0){
			var res = '';
			var listValue = '';
			var listID = null;
			var optionslst= '';
			for (var result in inventoryResults){
				if(inventoryResults[result]){
					res = inventoryResults[result];
					listValue = res.name;
					listID = null;
					if(listValue == 'All'){
						listID = 'All';
					}
					else if(listValue == 'All Available'){
						listID = 'T';
					}
					else if(listValue == 'Not Available'){
						listID = 'F';
					}
					else{}
					optionslst={'value':listValue,'id':listID};
					optionsArr.push(optionslst);
				}
			}
		}
		return optionsArr;
	}

	return {
		'post': doPost,
		'getInvStatusAllAllAvailableNotAvailableOptions':getInvStatusAllAllAvailableNotAvailableOptions
	};

});
