/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','N/config','./wms_translator','./wms_outBoundUtility','N/runtime'],

		function(search,utility,config,translator,obUtility,runtime) {

	/**
	 * Function to validate order
	 */
	function doPost(requestBody) {

		var waveListDetailsArr = {};
		var debugString = '';
		var requestParams = '';
		try{
			requestParams = requestBody.params;
			if(utility.isValueValid(requestParams))
			{

				debugString = debugString + "requestParams :"+requestParams;
				log.debug({title:'requestParams',details:requestParams});
				var warehouseLocationId = requestParams.warehouseLocationId;
				var waveName = requestParams.waveName;
				var pickingType = requestParams.pickingType;
				var isZonePickingEnabled = requestParams.isZonePickingEnabled;
				var selectedZones = requestParams.selectedZones;

				if(utility.isValueValid(warehouseLocationId) && utility.isValueValid(waveName))
				{

					var waveListDetails=[];
					var waveDetails = {}; 
					waveDetails.whLocationId=warehouseLocationId;
					waveDetails.isZonePickingEnabled=isZonePickingEnabled;
					
					log.debug({title:'waveName',details:waveName});

					var getWaveInternalId = obUtility.getWaveInternalId(waveName,warehouseLocationId);
					var isValidWaveScanned = true;
					if(getWaveInternalId.length>0){
						waveDetails['waveName']=getWaveInternalId[0]['internalid'];
						waveListDetails=obUtility.getPickingWaveDetails(waveDetails);
						
						if(isZonePickingEnabled == true && utility.isValueValid(selectedZones) && selectedZones.length > 0){
							var isValidTaskFound = false;
							var currentUser 	= runtime.getCurrentUser();
							var currentUserId 	= currentUser.id;
							for(var waveIndex = 0; waveIndex < waveListDetails.length;waveIndex++){
								var waveDetail = waveListDetails[waveIndex];
								var zoneId = waveDetail.zone;
								var picker = waveDetail.picker;
								if(!utility.isValueValid(zoneId)){
									zoneId = "0";
								}
								else{
									zoneId = parseInt(zoneId);
								}
								if((selectedZones.indexOf(zoneId) != -1) || (picker == currentUserId)){
									isValidTaskFound  = true;
									break;
								}
							}
							if(isValidTaskFound){
								isValidWaveScanned = true;
							}
							else{
								isValidWaveScanned = false;
							}
						}
						
					}

					if(waveListDetails.length > 0 && isValidWaveScanned == true)
					{							
						waveListDetailsArr.transactionName = waveName;
						waveListDetailsArr.waveName = waveListDetails[0].wavenameText;	
						waveListDetailsArr.isValid=true;
						waveListDetailsArr.gotostage = 'N';
						waveListDetailsArr.pickingType = waveListDetails[0].pickingtype;

					}
					else
					{
						waveListDetailsArr.errorMessage = translator.getTranslationString("MULTIORDER_WAVELIST.INVALIDWAVE");
						waveListDetailsArr.isValid=false;
					}
				}
				else
				{

					waveListDetailsArr.errorMessage = translator.getTranslationString("MULTIORDER_WAVELIST.INVALIDWAVE");

					waveListDetailsArr.isValid=false;	
				}
			}
			else
			{
				waveListDetailsArr.isValid=false;	
			}
			log.debug({title:'waveListDetailsArr',details:waveListDetailsArr});
		}
		catch(e)
		{
			waveListDetailsArr.isValid = false;
			waveListDetailsArr.errorMessage = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}

		return waveListDetailsArr;
	}
	return {
		'post': doPost
	};
});
