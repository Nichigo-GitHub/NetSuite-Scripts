/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved. 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/search','./wms_utility','./wms_translator','N/runtime','./wms_outBoundUtility'],
		function(search,utility,translator,runtime,obUtility) {

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 */
	var waveIndxArr = [];
	var isZonePickingEnabled=false;
	var selectedZones=[];
	function doPost(requestBody) {

		var waveListDetails 	= {};
		var debugString 			= '';
		var waveListArr = [];


		try{

			if(utility.isValueValid(requestBody)) {
				var requestParams	= requestBody.params;
				var whLocation  	= requestParams.warehouseLocationId;
				var currentUser 	= runtime.getCurrentUser();
				var currentUserId 	= currentUser.id;
				var gotoStageBtn    = requestParams.gotoStageBtn;
				var pickingType     = requestParams.pickingType;
				 isZonePickingEnabled = requestParams.isZonePickingEnabled;
				 selectedZones = requestParams.selectedZones;
				if(utility.isValueValid(gotoStageBtn) && gotoStageBtn == 'gotoStageBtn'){

					waveListDetails.gotostage = 'N';
					waveListDetails.pickingType = pickingType;
				}
				else{

					if(utility.isValueValid(whLocation)){	
						log.debug({title:'Request Params :', details:requestParams});
						debugString = debugString + 'Request Params :'+requestParams;

						if(!utility.isValueValid(isZonePickingEnabled)){
							isZonePickingEnabled = false;
						}

						// calling the Get Wave List method to get the Wave for a given combinations
						var waveListObj = obUtility.getMultiOrderWaveList(whLocation,currentUserId,isZonePickingEnabled,callBackFunc);
						log.debug({title:'waveListObj', details:waveListObj});



						if(waveListObj.length==0){
							waveListDetails = {
									isValid      : true
							};	
						}
						else{
							waveListDetails = {
									waveList : waveListObj,
									isValid      : true
							};
							log.debug({title:'Wave List', details: waveListObj});
						}
					}
					else{
						waveListDetails = {
								errorMessage : translator.getTranslationString('MULTIORDER_WAVELIST.INVALIDINPUT'),
								isValid      : false
						};	
					}

				}

			}
			else
			{
				waveListDetails = {
						errorMessage : translator.getTranslationString('MULTIORDER_WAVELIST.EMPTYPARAM'),
						isValid      : false
				};		
			}
		}
		catch(e)
		{
			waveListDetails.isValid = false;
			waveListDetails.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugMessage',details:debugString});
		}	

		return waveListDetails;
	}

	function callBackFunc(searchResult, searchResults){

		var currRow='';

		var lineitemremainingquantity = searchResult.getValue({name:'lineitemremainingquantity',summary:'SUM'});
		var lineitemremainingquantityText = searchResult.getText({name:'lineitemremainingquantity',summary:'SUM'});
		var name = searchResult.getValue({name:'name',summary:'COUNT'});
		var nameText = searchResult.getText({name:'name',summary:'COUNT'});
		var picker = searchResult.getValue({name:'picker',summary:'GROUP'});
		var PickerStatus='';
		var currentUserID = runtime.getCurrentUser();
		var userId=currentUserID.id;
		var wavename = searchResult.getText({name:'wavename',summary:'GROUP'});
		var wavenameText = searchResult.getText({name:'wavename',summary:'GROUP'});
		var lineItemStatus = searchResult.getValue({name:'lineitemstatus',summary:'GROUP'});

		if(!utility.isValueValid(picker))
		{
			PickerStatus = "Not Started"
		}
		else if(picker && userId!=picker)
		{
			PickerStatus = "Started"
		}
		else
		{
			PickerStatus = "Started"
		}
		//log.debug({title:'PickerStatus', details:PickerStatus});
		if((userId==picker || !utility.isValueValid(picker)) && lineItemStatus!='DONE') {
			var pickingtype = searchResult.getValue({name:'pickingtype',summary:'GROUP'});
			var pickingtypeText = searchResult.getText({name:'pickingtype',summary:'GROUP'});
			priority = searchResult.getValue({name:'priority',summary:'GROUP'});
			tranid = searchResult.getValue({name:'tranid',join:'transaction',summary:'COUNT'});
			type = searchResult.getValue({name:'type',join:'transaction',summary:'GROUP'});



			if (isZonePickingEnabled == true && utility.isValueValid(selectedZones) && selectedZones.length > 0) {

				var zoneId = searchResult.getValue({name:'zone',join:'binnumber',summary:'GROUP'});
				if (!utility.isValueValid(zoneId)) {
					zoneId = "0";
				} else {
					zoneId = parseInt(zoneId);
				}

				if (selectedZones.indexOf(zoneId) != -1 || userId==picker) {
					var waveIndx = waveIndxArr.indexOf(wavename);
					if (waveIndx == -1) {
						currRow = {
							lineitemremainingquantity: lineitemremainingquantity,
							lineitemremainingquantityText: lineitemremainingquantityText,
							name: name,
							nameText: nameText,
							picker: picker,
							PickerStatus: PickerStatus,
							pickingtype: pickingtype,
							pickingtypeText: pickingtypeText,
							priority: priority,
							tranid: tranid,
							type: type,
							wavename: wavename,
							wavenameText: wavenameText
						};
						searchResults.push(currRow)
						waveIndxArr.push(wavename);
					} else {
						var currRow = searchResults[waveIndx];
						searchResults[waveIndx].lineitemremainingquantity = parseFloat(currRow.lineitemremainingquantity) + parseFloat(lineitemremainingquantity);
						searchResults[waveIndx].name = parseInt(currRow.name) + parseInt(name);
						searchResults[waveIndx].PickerStatus = PickerStatus;
					}

				}
			}
			else {
				var waveIndx = waveIndxArr.indexOf(wavename);

				if (waveIndx == -1) {
					currRow = {
						lineitemremainingquantity: lineitemremainingquantity,
						lineitemremainingquantityText: lineitemremainingquantityText,
						name: name,
						nameText: nameText,
						picker: picker,
						PickerStatus: PickerStatus,
						pickingtype: pickingtype,
						pickingtypeText: pickingtypeText,
						priority: priority,
						tranid: tranid,
						type: type,
						wavename: wavename,
						wavenameText: wavenameText
					};
					searchResults.push(currRow)
					waveIndxArr.push(wavename);

				}
				else
				{

					var currRow = searchResults[waveIndx];
					searchResults[waveIndx].lineitemremainingquantity = parseFloat(currRow.lineitemremainingquantity) + parseFloat(lineitemremainingquantity);
					searchResults[waveIndx].name = parseInt(currRow.name) + parseInt(name);
					searchResults[waveIndx].PickerStatus = 'Started';

				}
			}
		}
		else {

			var waveIndx = waveIndxArr.indexOf(wavename);

			if (waveIndx != -1) {
				var currRow = searchResults[waveIndx];
				searchResults[waveIndx].PickerStatus = 'Started';

			}

		}




	}
	return {
		'post': doPost
	};

});





