/**
 * Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 *
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(["N/runtime",'N/record','N/search','./wms_utility','./wms_translator'],

		function(runtime,record,search,utility,translator) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} splitResults
	 * @property {number} woInternalid - Internal ID of the workorder record instance
	 * @property {string} trantype - Record type
	 *
	 */
	function getInputData() {
		try
		{
			var wmsSystemRulesSearchResult = getSystemRules();
			log.debug({title:'getInputData: wmsSystemRulesSearchResult',details:wmsSystemRulesSearchResult});
			return wmsSystemRulesSearchResult;
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}


	}
	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 */

	function map(context) {
		var resultObj = JSON.parse(context.value);
		var debugstring = 'key. = ' + resultObj.id + '<br>';
		debugstring = debugstring + 'value. = ' + resultObj.name + '<br>';
		log.debug({title:'Map:Key and Values',details:debugstring});
		context.write({
			key : resultObj.id,
			value : resultObj.name
		});

	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 */

	function reduce(context) {
		try
		{

			var systemRuleInternalId = context.key;
			var systemRuleName =context.values[0];
			var debugstring = 'systemRuleInternalId. = ' + systemRuleInternalId + '<br>';
			debugstring = debugstring + 'systemRuleName = ' + systemRuleName + '<br>';

			if(utility.isValueValid(systemRuleName) && utility.isValueValid(systemRuleInternalId)) {

				var wmsSystemRuleRec = record.load({
					type: 'customrecord_wmsse_sysrules',
					id: systemRuleInternalId
				});
				var languageCountOfWMSSysRule = wmsSystemRuleRec.getLineCount({
					sublistId: 'translations'
				});
				debugstring = debugstring + 'languageCountOfWMSSysRule = ' + languageCountOfWMSSysRule + '<br>';

				// get the system rule key value from js file for specific system rule.
				var translationKeyObj = translator.getTranslationKey(systemRuleName);
				debugstring = debugstring + 'translationKeyObj = ' + translationKeyObj + '<br>';

				if(utility.isValueValid(translationKeyObj)){
					//below condition is used to fetch the translations for selected languages in set preference
					if(!translationKeyObj.defaultTranslationAvaliable)
					{
						var LANG = "LANGUAGE";
						var selectedLanguage = runtime.getCurrentUser().getPreference(LANG);
						var selectedlangaugeTranslationObj = translator.getTranslationforSpecificLang(selectedLanguage);
						selectedLanguageTranslatedName = selectedlangaugeTranslationObj[translationKeyObj.translationKey];
						if (utility.isValueValid(selectedLanguageTranslatedName)) {
							wmsSystemRuleRec.setValue({fieldId: 'name', value: selectedLanguageTranslatedName});
						}
					}

				for (var systemRuleItr = 0; systemRuleItr < languageCountOfWMSSysRule; systemRuleItr++) {
					var translatedNameForlocale="";
					var languageCode = wmsSystemRuleRec.getSublistValue({
						sublistId: 'translations',
						fieldId: 'locale',
						line: systemRuleItr
					});
					//get the translations object for the specific languageCode
					var langaugeTranslationObj = translator.getTranslationforSpecificLang(languageCode);
					if(utility.isValueValid(translationKeyObj.translationKey)){
						translatedNameForlocale = langaugeTranslationObj[translationKeyObj.translationKey];
					}
					if (utility.isValueValid(translatedNameForlocale)) {
						wmsSystemRuleRec.setSublistValue({
							sublistId: 'translations',
							fieldId: 'label',
							line: systemRuleItr,
							value: translatedNameForlocale
						});

					}
				}
				}
				wmsSystemRuleRec.save();

			}
			log.debug({title:'Reduce:logs',details:debugstring});
		}
		catch(e)
		{
			log.error({title:'Exception in reduce',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});

		}
	}


	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

		try
		{
			log.debug({title:'Summarize: system rule translation update',details:'Summarize'});
		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}

	function getSystemRules(){
		var wmsPickCartonSearchObj = search.load({
			id: 'customsearch_wms_systemrules_details'
		});
		var wmsSystemRulesSearchResults = utility.getSearchResultInJSON(wmsPickCartonSearchObj);
			return wmsSystemRulesSearchResults;
	}

	return {
		getInputData: getInputData,
		map:map,
		reduce: reduce,
		summarize: summarize
	};

});
