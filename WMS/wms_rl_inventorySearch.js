/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search','./wms_utility','./big','./wms_translator'],
		/**
		 * @param {search} search
		 */
		function (search,utility,Big,translator) {

	/**
	 * Function to fetch item details.
	 *
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function
	 *  as an Object (for all supported content types)
	 * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; 
	 * return Object when request Content-Type is 'application/json'
	 */
	function doPost(requestBody) {

		var itemList={};
		try{
			if(utility.isValueValid(requestBody))
			{
				var requestParams = requestBody.params;
				var whLocation = requestParams.warehouseLocationId;
				var itemText = requestParams.itemText;
				var action = requestParams.action;
				var itemInternalId = requestParams.itemInternalId;
				var binInternalId = requestParams.binInternalId;
				var binNameStr = requestParams.binName;
				var stockunitText = requestParams.stockunitText;
				var unitType = requestParams.unitType;
				var conversionRate = '';
				var barCodeScanned = false;
				var barcodeError ="";
				var itemInternalIdBinList = requestParams.itemInternalIdBinList;
				var locUseBinsFlag = requestParams.locUseBinsFlag;
				var warehouseLocationName = requestParams.warehouseLocationName;
				if(itemInternalIdBinList){
				    itemInternalId = itemInternalIdBinList;
				}
				if((utility.isValueValid(itemInternalId) || utility.isValueValid(binInternalId) ||
						(utility.isValueValid(itemText) && utility.isValueValid(action))) && utility.isValueValid(whLocation))
				{
					var objBinDetails=[];
					var itemType = '';				
					var thumbNailUrl = '';
					if(utility.isValueValid(itemInternalId))
					{

						var columnArray =[];						
						columnArray.push('recordtype');
						columnArray.push('unitstype');
						columnArray.push('stockunit');						

						var itemLookUp = utility.getItemFieldsByLookup(itemInternalId,columnArray);

						if (itemLookUp.thumbnailurl != undefined) 
						{
							thumbNailUrl = itemLookUp.thumbnailurl;
						}
						if (itemLookUp.recordtype != undefined) 
						{
							itemType = itemLookUp.recordtype;
						}
						if(itemLookUp.unitstype != undefined && itemLookUp.unitstype.length > 0){
							unitType = itemLookUp.unitstype[0].value;
						}
						if(utility.isValueValid(unitType)){
							stockunitText = itemLookUp.stockunit[0].text;
							conversionRate = utility.getStockCoversionRate(unitType, stockunitText, 1);
						}
					}else if(action == 'searchItems'){

						var barCodeItemObj = utility.getSKUIdWithName(itemText,whLocation,null,null,true);
						log.debug('barCodeItemObj',barCodeItemObj);
						if(barCodeItemObj){
							barCodeScanned = barCodeItemObj.isbarcodescanned;
							barcodeError = barCodeItemObj.error;
							if(utility.isValueValid(barCodeItemObj['barcodeItemname']))
							{
								itemText = barCodeItemObj['barcodeItemname'];
							}
							else if(utility.isValueValid(barCodeItemObj['itemName']))
							{
								itemText = barCodeItemObj['itemName'];
							}
							else if(utility.isValueValid(barCodeItemObj) && utility.isValueValid(barCodeItemObj[0]) && utility.isValueValid(barCodeItemObj[0].id)) {
								var itemInternalId = [];
								for (var i in barCodeItemObj) {
									if(utility.isValueValid(barCodeItemObj[0].id)) {
										itemInternalId.push(barCodeItemObj[i].id);
									}
								}
							}
							else if(utility.isValueValid(barCodeItemObj) && utility.isValueValid(barCodeItemObj[0])){
								log.debug('barCodeItemObj1',Object.keys(barCodeItemObj).length);
								if(Object.keys(barCodeItemObj).length == 1)
								{
									itemText = barCodeItemObj[0]['itemid'];
								}

							}
							else{}
						}
					}

					log.debug('barCodeScanned', barCodeScanned);
					log.debug('itemText', itemText);


					var searchRec = null;
					var savedFilter = null;
					var flag ='T';

					if(action == 'searchItems'){
						searchRec = search.load({
							type:search.Type.INVENTORY_BALANCE,
							id: 'customsearch_wms_inv_bal_item_search',
							name : 'WMS Inventory Balance for Item Search'
						});
						flag ='T';
					}else{ 
						searchRec = search.load({
							type:search.Type.INVENTORY_BALANCE,
							id: 'customsearch_wms_get_invbal_stat_details'
						});
					}
						savedFilter = searchRec.filters;

						if(utility.isValueValid(binInternalId)){
							savedFilter.push(search.createFilter({
								name : 'binnumber',
								operator : search.Operator.ANYOF,
								values : binInternalId
							}));
						}
						savedFilter.push(search.createFilter({
							name : 'location',
							operator : search.Operator.ANYOF,
							values : whLocation
						}));
					if(utility.isValueValid(itemInternalId)){
						savedFilter.push(search.createFilter({
							name : 'internalid',
							join : 'item',
							operator : search.Operator.ANYOF,
							values : itemInternalId
						}));
					}
					else
					{
						savedFilter = searchRec.filters;
						if(flag =='T')
						{
							savedFilter.push(search.createFilter({
								name: 'location',
								operator: search.Operator.ANYOF,
								values: whLocation
							}));
						}
						if(utility.isValueValid(itemInternalId)){
							savedFilter.push(search.createFilter({
								name: 'internalid',
								operator: search.Operator.ANYOF,						
								values: itemInternalId
							}));

						}
						else if(utility.isValueValid(itemText) && barCodeScanned)
						{
							savedFilter.push(search.createFilter({
								name: 'name',
								join : 'item',
								operator: search.Operator.IS,						
								values: itemText
							}));
						}
						else if (utility.isValueValid(itemText))
						{
							savedFilter.push(search.createFilter({
								name: 'nameinternal',
								join : 'item',
								operator: search.Operator.CONTAINS,						
								values: itemText
							}));
						}
						if(utility.isValueValid(binInternalId)){
							if(flag =='T')
							{
								savedFilter.push(search.createFilter({
									name: 'binnumber',
									operator: search.Operator.ANYOF,						
									values: binInternalId
								}));
							}
						}
					}
					searchRec.filters = savedFilter;
					objBinDetails = utility.getSearchResultInJSON(searchRec);
					if(action == 'searchItems'){

						if(utility.isValueValid(itemText)){
							var	binId = getBinInternalId(itemText,whLocation);
							if(binId.length > 0)
							{
								savedFilter.splice(savedFilter.length-1,1);
								savedFilter.push(search.createFilter({
									name: 'binnumber',
									operator: search.Operator.ANYOF,						
									values: binId
								}));
								if(utility.isValueValid(itemInternalId)){
									savedFilter.push(search.createFilter({
										name : 'internalid',
										join : 'item',
										operator: search.Operator.NONEOF,
										values: itemInternalId
									}));
								}
								searchRec.filters = savedFilter;
								objBinDetails = objBinDetails.concat(utility.getSearchResultInJSON(searchRec));
							}
						}
					}
					if(objBinDetails.length == 0)
					{
						if(utility.isValueValid(barcodeError) && action == 'searchItems' && barCodeScanned)
						{
							itemList['errorMessage'] = barcodeError;
						}
						else
						{
							itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.NO_ITEMS_FOUND');
						}
						itemList['isValid']=false;
					}
					else
					{
						var binName='';
						var totalBinAvailQty=0;
						var itemInternalId='';
						var itemName='';
						var objBinDetailsRec = null;							
						var itemsList = [];
						var description = '';
						var uomText = '';
						for (var bindetail in objBinDetails) {
							objBinDetailsRec = objBinDetails[bindetail];


								totalBinAvailQty = parseFloat(objBinDetailsRec['available']);
								itemInternalId = objBinDetailsRec['item'];
								itemName =objBinDetailsRec['itemText'] ;
								uomText = stockunitText;
								uomText = utility.isValueValid(uomText) ? uomText : objBinDetailsRec['stockunitText'] == '- None -' ? '' : objBinDetailsRec['stockunitText'];

							if(totalBinAvailQty > 0)
							{
								binName = objBinDetailsRec['binnumberText'];
								description = objBinDetailsRec['salesdescription'];
								if(uomText == undefined)
								{
									uomText = '';
								}
								objBinDetailsRec['itemName'] = itemName;
								objBinDetailsRec['availbleQuanity'] = totalBinAvailQty +" "+uomText;
								objBinDetailsRec['binName'] = binName;
								objBinDetailsRec['itemInternalId'] = itemInternalId;
								objBinDetailsRec['internalid'] = itemInternalId;
								objBinDetailsRec['salesdescription'] = this.nullIf(description);
								objBinDetailsRec['upccode'] = this.nullIf(objBinDetailsRec['upccode']);
								itemsList[itemsList.length]=objBinDetailsRec;
							}
						}
						if((locUseBinsFlag != undefined && (locUseBinsFlag == false) || locUseBinsFlag == 'false' )){ 
							itemList['infoLocation'] = warehouseLocationName;
						}
						itemList['selectedItem']=itemText;
						itemList['selectedBin']=binNameStr;
						itemList['selectedBinInternalId']=binInternalId;
						itemList['item_id']=itemInternalId;
						itemList['imageUrl']=thumbNailUrl;
						if(description!='- None -')
						{
							itemList['selectedDescription']=description;
						}
						itemList['itemType'] = itemType;
						itemList['itemList']=itemsList;
						itemList['isValid']=true;
					}
				}
				else
				{
					if(!(utility.isValueValid(whLocation)))
					{
						itemList['errorMessage'] = translator.getTranslationString('SEARCH_INV.INVALID_WHLOC');
					}
					else
					{
						itemList['errorMessage'] = translator.getTranslationString('BINTRANSFER_FINDITEM.INVALID_INPUT');
					}
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
		}
		return itemList;
	}

	function getBinInternalId(Binnumber,whLocation)
	{
		var bininternalId=[];
		var searchrecordSearch= search.load({
			id : 'customsearch_wmsse_woqty_bin_srh'
		});
		var filter= searchrecordSearch.filters;
		filter.push(search.createFilter({
			name :'binnumber',
			operator: search.Operator.CONTAINS,
			values:  Binnumber
		}));
		filter.push(search.createFilter({
			name :'location',
			operator: search.Operator.ANYOF,
			values:  whLocation
		}));
		searchrecordSearch.filters = filter;
		var searchrecord = utility.getSearchResultInJSON(searchrecordSearch);
		if(searchrecord.length > 0)
		{
			for(i in searchrecord)
			{
				bininternalId.push(searchrecord[i].id);
			}
		}
		return bininternalId;
	}
	function nullIf(value){
	    return value == '- None -' ? '' : value;
	}
	return {
		'post': doPost,
		getBinInternalId:getBinInternalId,
		nullIf : nullIf
	};

});