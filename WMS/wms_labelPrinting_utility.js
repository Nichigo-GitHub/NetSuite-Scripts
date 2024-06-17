/**

 *  /**
 */

/**

 * @NApiVersion 2.x

 * @NModuleScope public

 */

define(['N/search', './wms_utility', './wms_translator', './wms_rl_autoprint_const', 'N/format'],

		function (search, utility, translator, printConstants, format) {

	var applicationIdentifiers = printConstants.applicationIdentifiers;
	var gs1Parameters = printConstants.gs1_parameters;

	function checkGS1Enable(whLocation)
	{
		var isGS1Enabled = false;

		var systemRule_gs1barcodeResults = utility.getSystemRuleDetails('Enable Advanced Barcode Scanning?',whLocation , 'Y');
		if(systemRule_gs1barcodeResults.length > 0 )
		{
			if(utility.isValueValid(systemRule_gs1barcodeResults[0].custrecord_wmsseprocesstypeText))
			{
				var barCodeType = systemRule_gs1barcodeResults[0].custrecord_wmsseprocesstypeText;
				if(barCodeType == translator.getTranslationString("ADVANCE_BARCODE.GS1BARCODE"))
				{
					isGS1Enabled = true;
				}
			}
		}

		return isGS1Enabled;
	}

	function validateGTIN(barcodeGTIN)
	{
		var isGTINValid = false;

		if(!isNaN(barcodeGTIN) && (barcodeGTIN.length == gs1Parameters.gtin_length || barcodeGTIN.length == gs1Parameters.checkDigitReqLength))
		{
			isGTINValid = true;
		}

		return isGTINValid;
	}	

	function getGTINValFromItemAlias(itemId, unitstype, vendor)
	{
		var itemAliasResObj = {};
		var itemList = [];
		var gtin = '';


        if(utility.isValueValid(itemId))

        {
			itemList = this.getItemAliasResults(itemId, unitstype, vendor);
			if(itemList.length > 1)
			{
				itemAliasResObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_ITEMALIAS_CONFIG');
				return itemAliasResObj;
			}
		}

		if(itemList.length == 0)
		{
			itemAliasResObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_ITEMALIAS');
			itemAliasResObj.allowDataMatrixLabel = true; 
			return itemAliasResObj;
		}
		else if(itemList.length == 1)
		{	
			gtin = itemList[0]['name'];

			if(utility.isValueValid(gtin) && isNaN(gtin))
			{
				itemAliasResObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.GTIN_NONNUMERIC');
				return itemAliasResObj;				

			}else if(utility.isValueValid(gtin) && !validateGTIN(gtin)){
				itemAliasResObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_GTIN_LENGTH');
				return itemAliasResObj;
			}
			else
			{
				itemAliasResObj.aliasName = gtin;
			}
		}
		else
		{
			itemAliasResObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_ITEMALIAS_CONFIG');
			return itemAliasResObj;				
		}
		
		return itemAliasResObj;
	}	

	function getItemAliasResults(itemId, unitstype, vendor)
	{
		var itemAliasFilters = [];
		var itemAliasRes = [];
		
		if(utility.isValueValid(itemId))
		{
			itemAliasFilters.push(search.createFilter({
				name: 'custrecord_wmsse_alias_item',
				operator: search.Operator.ANYOF,
				values: itemId
			}));		
		}

		if(utility.isValueValid(unitstype))
		{
			itemAliasFilters.push(search.createFilter({
				name: 'custrecord_wms_alias_unit',
				operator: search.Operator.ANYOF,
				values: unitstype
			}));
		}

		if(utility.isValueValid(vendor))
		{
			itemAliasFilters.push(search.createFilter({
				name: 'custrecord_wmsse_alias_vendor',
				operator: search.Operator.ANYOF,
				values: vendor
			}));			
		}
			

		var itemAliasResultsSearch = search.load({
			id :'customsearch_wmsse_itemalias_validate'
		});
		var savedFilters = itemAliasResultsSearch.filters;
		itemAliasResultsSearch.filters = savedFilters.concat(itemAliasFilters);

		itemAliasRes = utility.getSearchResultInJSON(itemAliasResultsSearch);
		
		log.debug('Item Alias Results :', itemAliasRes);
		
		return itemAliasRes;
	}
	

	function generateGS1String(gs1StringObj)
	{
		var gs1StringResponseObj = {};
		var checkDigit = '';

		if(utility.isValueValid(gs1StringObj) && utility.isValueValid(gs1StringObj.gtin))
		{

			var gtinLength = gs1StringObj.gtin.length;

			if(gtinLength == gs1Parameters.checkDigitReqLength)
			{
				checkDigit = checkDigitGS1(gs1StringObj.gtin);
			}
			log.debug('check Digit :', checkDigit);			

			gs1StringResponseObj = appendAIData(gs1StringObj, checkDigit);
		}

		return gs1StringResponseObj;
	}

	function checkDigitGS1(barcodeGTIN)
	{
		var gtinArr = barcodeGTIN.substring(0,barcodeGTIN.length).split('').reverse();
		var sum = 0;

		for (var i=0; i<gtinArr.length; i++) 
		{
			if (i % 2 == 0) 
			{ 
				sum += Number(gtinArr[i]) * 3; 
			}
			else 
			{
				sum += Number(gtinArr[i]);
			}
		}

		var checkDigit = ((Math.ceil(sum/10) * 10) - sum);

		return checkDigit;

	}

	function appendAIData(gs1StringObj, checkDigit)
	{
        var customAIappend = false;
		var qtyAppend = '';
		var lotNumAppend = '';
		var appendedAIResponseObj = {};
		var ai = '';
		var gs1String = gs1Parameters.fnc + gs1Parameters.gtin_ai + gs1StringObj.gtin;

		if(utility.isValueValid(checkDigit))
		{
			gs1String = gs1String + checkDigit;
		}

		for(var aiKey in applicationIdentifiers)
		{
			getFormatedAiDetails(applicationIdentifiers[aiKey]);
		}

		log.debug('applicationIdentifiers :', applicationIdentifiers);



		for (var field in gs1StringObj.customFields){



			var fieldValue = gs1StringObj.customFields[field];

			ai = gs1Parameters[field];

			

			if(fieldValue.toString().length <= applicationIdentifiers[ai].dataLength)

			{

					if(customAIappend){

                        gs1String = gs1String  + 'FNC'+ ai + fieldValue;

					}else{

						gs1String = gs1String  + ai + fieldValue;

					}

				    customAIappend = true;

			}

			else

			{

				appendedAIResponseObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_CUSTOM_AI_LENGTH');

				appendedAIResponseObj.isValid = false;				

				return appendedAIResponseObj;

			}

		}





		if(utility.isValueValid(gs1StringObj.quantity))
		{
			var quantity = gs1StringObj.quantity;
			ai = gs1Parameters.quantity_ai;

			if(quantity.toString().length <= applicationIdentifiers[ai].dataLength)
			{
				if(customAIappend){

                    gs1String = gs1String +  'FNC' + ai + gs1StringObj.quantity;

                    customAIappend = false;

				}else{

					gs1String = gs1String + ai + gs1StringObj.quantity;
				}

				qtyAppend = 'true';
			}
			else
			{
				appendedAIResponseObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_QUANTITY_LENGTH');
				appendedAIResponseObj.isValid = false;				
				return appendedAIResponseObj;
			}
		}

		if(utility.isValueValid(gs1StringObj.lotNumber))
		{
			var lotNumber = gs1StringObj.lotNumber;
			ai = gs1Parameters.lot_number_ai;

			if(lotNumber.toString().length <= applicationIdentifiers[ai].dataLength)
			{

				if(utility.isValueValid(qtyAppend) && qtyAppend == 'true')
					gs1String = gs1String + 'FNC' + ai + lotNumber;
				else{
					if(customAIappend){

						gs1String = gs1String + 'FNC' + ai + lotNumber;

						customAIappend = false;

					}else{

						gs1String = gs1String + ai + lotNumber;
					}

				}


				lotNumAppend = 'true';

			}
			else
			{
				appendedAIResponseObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_LOTNUM_LENGTH');
				appendedAIResponseObj.isValid = false;				
				return appendedAIResponseObj;
				
			}
		}


		if(utility.isValueValid(gs1StringObj.lotExpiryDate))
		{
			ai = gs1Parameters.lot_expiry_date_ai;

			var lotDate = format.parse({
				value: gs1StringObj.lotExpiryDate,
				type: format.Type.DATE
			});

			var formatedLotDate = new Date(lotDate);
			log.debug('formatedLotDate:', formatedLotDate);

			if(utility.isValueValid(formatedLotDate))
			{
				var month = ((formatedLotDate.getMonth()+1).toString().length==2) ? (formatedLotDate.getMonth() + 1) : '0'+(formatedLotDate.getMonth() + 1);
				var date = ((formatedLotDate.getDate()).toString().length==2) ? (formatedLotDate.getDate()) : '0'+(formatedLotDate.getDate());
				var year = ((formatedLotDate.getFullYear()).toString().length==4) ? (formatedLotDate.getFullYear()).toString().substring(2,4) : formatedLotDate.getFullYear();
				
				gs1StringObj.lotExpiryDate = year+month+date;

				if(utility.isValueValid(lotNumAppend) && lotNumAppend == 'true')
					gs1String = gs1String + 'FNC' + ai + gs1StringObj.lotExpiryDate;				
			}


		}


		if(utility.isValueValid(gs1StringObj.serialNumber))
		{
			var serialNumber = gs1StringObj.serialNumber;
			ai = gs1Parameters.serial_ai;
			
			if(serialNumber.toString().length <= applicationIdentifiers[ai].dataLength)
			{
				if(utility.isValueValid(qtyAppend) && qtyAppend == 'true')
					gs1String = gs1String + 'FNC' + ai + serialNumber;
				else{
					if(customAIappend){

                       gs1String = gs1String + 'FNC' + ai + serialNumber;

					}else{

                       gs1String = gs1String + ai + serialNumber;
					}		

				}


			}
			else
			{
				appendedAIResponseObj.errorMessage = translator.getTranslationString('AUTOPRINT_GS1.INVALID_SERIAL_LENGTH');
				appendedAIResponseObj.isValid = false;				
				return appendedAIResponseObj;
				
			}
		}

		appendedAIResponseObj.gs1String = gs1String;
		appendedAIResponseObj.isValid = true;		
		log.debug('gs1String :', gs1String);

		return appendedAIResponseObj;	

	}


	function getFormatedAiDetails(aiObject) {

		if (aiObject.fixedLength) {
			aiObject.dataLength = parseInt((aiObject.fixedLength + '').replace(/[NX]/g, ''));
			aiObject.fncRequired = false;
		}

		if (aiObject.variableLength) {
			aiObject.dataLength = parseInt((aiObject.variableLength + '').replace(/[(N..)(X..)]/g, ''));
			aiObject.fncRequired = true;
		}
	}

	function replaceFNCCharSymbol(barcodeString, ruleEvaluationRec, templateType)
	{

		if(utility.isValueValid(barcodeString))
		{

			if(templateType == 'ZPL')
			{
				barcodeString = barcodeString.replace(/FNC/g, gs1Parameters.zpl_fnc);
			}
			else
			{
				barcodeString = barcodeString.replace(/FNC/g, gs1Parameters.pdf_fnc);
			}

			ruleEvaluationRec.setValue({fieldId : 'custrecord_label_barcode_string', 	value : barcodeString});
			ruleEvaluationRec.save();			

		}

	}	


	function getAllItemAliasResultsForPrint(itemId, vendor,warehouselocationId)

	{

				var itemAliasFilters = [];

				var itemAliasRes = [];



				if(utility.isValueValid(itemId))

				{

					itemAliasFilters.push(search.createFilter({

						name: 'custrecord_wmsse_alias_item',

						operator: search.Operator.ANYOF,

						values: itemId

					}));

				}

				if(utility.isValueValid(vendor))

				{

					itemAliasFilters.push(search.createFilter({

						name: 'custrecord_wmsse_alias_vendor',

						operator: search.Operator.ANYOF,

						values: ["@NONE@",vendor]

					}));

				}

				if(utility.isValueValid(warehouselocationId))

				{

					itemAliasFilters.push(search.createFilter({

						name: 'custrecord_wmsse_alias_location',

						operator: search.Operator.ANYOF,

						values: ["@NONE@",warehouselocationId]

					}));

				}



				var itemAliasResultsSearch = search.load({

					id :'customsearch_wmsse_itemalias_validate'

				});

				var savedFilters = itemAliasResultsSearch.filters;

				itemAliasResultsSearch.filters = savedFilters.concat(itemAliasFilters);

				itemAliasRes = utility.getSearchResultInJSON(itemAliasResultsSearch);

				return itemAliasRes;

	}

	return {

		checkGS1Enable 			: checkGS1Enable,
		validateGTIN 			: validateGTIN,
		getGTINValFromItemAlias : getGTINValFromItemAlias,		
		generateGS1String 		: generateGS1String,
		checkDigitGS1 			: checkDigitGS1,
		getFormatedAiDetails 	: getFormatedAiDetails,		
		replaceFNCCharSymbol 	: replaceFNCCharSymbol,
		getItemAliasResults    :getItemAliasResults,
		getAllItemAliasResultsForPrint:getAllItemAliasResultsForPrint

	};

});

