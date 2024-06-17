/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator','N/record', './big'],
		/**
		 * @param {search} search
		 */
		function (search,utility,Big,translator,record, bigJS) {

	/**
	 * Function to fetch item details.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
	 */
	function doPost(requestBody) {
		var itemList={};
		var debugString ='';
		var requestParams ='';
		var locUseBinsFlag = '';
		try{
			if(utility.isValueValid(requestBody))
			{
				requestParams= requestBody.params;
				var whLocation = requestParams.warehouseLocationId;
				var itemtext = requestParams.itemText;
				locUseBinsFlag = requestParams.locUseBinsFlag;
				if(!utility.isValueValid(locUseBinsFlag)){
					locUseBinsFlag = true;
				}
				log.debug({title:'requestParams',details:requestParams});
				if(utility.isValueValid(itemtext) && utility.isValueValid(whLocation))
				{
					var objBinDetails=[];
					
					objBinDetails = this.getItemDetails(whLocation,itemtext);

					if(objBinDetails.length == 0)
					{
						var itemResult =  utility.itemValidationForInventoryAndOutBound(itemtext,whLocation);

						if(utility.isValueValid(itemResult['itemInternalId']) || utility.isValueValid(itemResult['barcodeIteminternalid']))
						{
							var itemInternalId = ((itemResult['itemInternalId']) ? (itemResult['itemInternalId']) : itemResult['barcodeIteminternalid']);
							var itemNameVar = ((itemResult['itemName']) ? (itemResult['itemName']) : itemResult['barcodeItemname']);

							var fields = ['unitstype'];
							var itemDetails = search.lookupFields({
								type: 'item',
								id: itemInternalId,
								columns: fields

							})
							var unitType ='';
							if(utility.isValueValid(itemDetails['unitstype'][0]))
							{
								unitType = itemDetails['unitstype'][0].value;
							}

							itemList = utility.addItemDatatoResponse(itemList, itemResult, unitType);



							objBinDetails = this.getItemDetails(whLocation,itemNameVar);
						}
						else
						{
							if(utility.isValueValid(itemResult.error))
							{
								itemList['errorMessage'] = itemResult.error;
							}
							else
							{
								itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
							}
							itemList['isValid']=false;
						}

					}

					if(objBinDetails.length > 0)
					{

						var binName='';
						var totalBinAvailQty=0;
						var itemInternalId='';
						var itemName='';
						var unitType = '';
						var stockUnitName = '';
						var openPickQty = 0;
						var objBinDetailsRec = null;							
						var itemsList = [];
						var binInternalId ='';
						var itemDtlArr = [];
						var itemDtlItmArr = [];
						log.debug('objBinDetails :', objBinDetails);
						for (var bindetail in objBinDetails) {
							openPickQty = 0;
							objBinDetailsRec = objBinDetails[bindetail];
							binInternalId = objBinDetailsRec['binnumber'];
							binName = objBinDetailsRec['binnumberText'];
							totalBinAvailQty = objBinDetailsRec['available'];
							itemInternalId = objBinDetailsRec['item'];
							itemName = objBinDetailsRec['itemText'];
							unitType = objBinDetailsRec['unitstype'];
							stockUnitName = objBinDetailsRec['stockunit'];


							if(totalBinAvailQty > 0)
							{
								var uomText = objBinDetailsRec['stockunitText'];
								objBinDetailsRec['itemName'] = itemName;
								if(utility.isValueValid(uomText)) {
									objBinDetailsRec['availbleQuanity'] = totalBinAvailQty + " " + uomText;
								}
								else{
									objBinDetailsRec['availbleQuanity'] = totalBinAvailQty;
								}
								if(utility.isValueValid(binName))
								{
									objBinDetailsRec['binName'] = binName;
								}
								objBinDetailsRec['itemInternalId'] = itemInternalId;
								var itemAndBin = itemInternalId+"^"+binInternalId;
								if(itemDtlItmArr.indexOf(itemAndBin) == -1)	{
									itemDtlArr.push(objBinDetailsRec);
									itemDtlItmArr.push(itemAndBin);
								}
								else{
									var itemIndex = '';
									var tempItemQty = '';
									var itemQty = '';

									itemIndex = itemDtlItmArr.indexOf(itemAndBin);
									var itemDetialRow = itemDtlArr[itemIndex];

									if(utility.isValueValid(itemDetialRow)){
										if(locUseBinsFlag == true) {
											if (utility.isValueValid(binInternalId) &&
												binInternalId == itemDetialRow.binnumber) {
												tempItemQty = totalBinAvailQty;
												if (!utility.isValueValid(tempItemQty)) {
													tempItemQty = 0;
												}
												itemQty = itemDtlArr[itemIndex]['available'];
												itemDtlArr[itemIndex]['available'] = Number(bigJS(tempItemQty).plus(itemQty));
												itemDtlArr[itemIndex]['availbleQuanity'] = Number(bigJS(tempItemQty).plus(itemQty));
												if (utility.isValueValid(uomText)) {
													itemDtlArr[itemIndex]['availbleQuanity'] = Number(bigJS(tempItemQty).plus(itemQty)) + " " + uomText;
												}
											} else {
												itemDtlArr.push(objBinDetailsRec);
												itemDtlItmArr.push(itemAndBin);
											}
										}
										else{
											tempItemQty = totalBinAvailQty;
											if (!utility.isValueValid(tempItemQty)) {
												tempItemQty = 0;
											}
											itemQty = itemDetialRow['available'];
											itemDetialRow['available'] = Number(bigJS(tempItemQty).plus(itemQty));
											itemDetialRow['availbleQuanity'] = Number(bigJS(tempItemQty).plus(itemQty));
											if (utility.isValueValid(uomText)) {
												itemDetialRow['availbleQuanity'] = Number(bigJS(tempItemQty).plus(itemQty)) + " " + uomText;
											}

										}
									}
									else{
										itemDtlArr.push(objBinDetailsRec);
										itemDtlItmArr.push(itemAndBin);
									}
								}

							}
						}

						itemsList = itemDtlArr;
						itemList['itemList']=itemsList;
						itemList['isValid']=true;
					}
				}
				else
				{
					itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.INVALID_INPUT');
					itemList['isValid']=false;
				}

			}
			else
			{
				itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.INVALID_INPUT');
				itemList['isValid']=false;
			}
		}
		catch(e)
		{
			itemList['isValid'] = false;
			itemList['errorMessage'] = e.message;
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			log.error({title:'debugString',details:debugString});
		}
		log.debug({title:'itemList',details:itemList});
		return itemList;

	}
	function getItemDetails(whLocation,itemtext){

		var objBinDetails= [];

		var searchRec = search.load({
			id: 'customsearch_wms_getitem_invtblnc_dtl',
			type:search.Type.INVENTORY_BALANCE
		});
		var savedFilter = searchRec.filters;
		if(utility.isValueValid(whLocation))
		{
			savedFilter.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: whLocation
			}));

		}

		if(utility.isValueValid(itemtext))
		{
			savedFilter.push(search.createFilter({
				name: 'name',
				join : 'item',
				operator: search.Operator.CONTAINS,						
				values: itemtext
			}));
		}
		searchRec.filters = savedFilter;
		objBinDetails = utility.getSearchResultInJSON(searchRec);
		
		return objBinDetails;
	}

	return {
		post: doPost,
		getItemDetails: getItemDetails

	};

});
