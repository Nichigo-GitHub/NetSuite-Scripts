/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *//**
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 *
 */
define([],

		/**
		 * Constants file.
		 * Holds constants relevant to Rule engine project
		 *
		 */
		function () {
	const ID = {
			"RECORD_REPORT": "customrecord_print_rule_group",
			"REPORT_SEARCH": "customsearch_print_rule_group_search",
			"PRINTERS_SEARCH": "customsearch_print_printers",
			"PRINT_AUDIT_SEARCH": "customsearch_wms_autoprint_audit_dtl",
			"PRINT_PRINTERS": "customrecord_print_printers",
			"PRINTER_TYPE": "custrecord_print_printer_type",
			"INTERNALID": "internalidnumber",
			"PRINT_AUDIT": "customrecord_wms_autoprint_audit_inf",
			"PRINT_AUDIT_STATUS": "custrecord_print_status",
			"PRINT_ACCNT_PREF_KEY" : "custrecord_print_act_pref_key",
			"PRINT_ACCNT_PREF_VAL" : "custrecord_print_act_pref_value",
			"SECURE_ACCNT_PREF_KEY" : "custrecord_print_sec_act_pref_key",
			"SECURE_ACCNT_PREF_VAL" : "custrecord_print_sec_act_pref_val",
			"PRINT_PLUGIN": "customscript_print_plugin",
			"PRINTER_ID": "custrecord_print_id",
			"COLUMN_NAME": "name",
			"COLUMN_INACTIVE": "isinactive",
			"INTERNAL_ID": "internalid",
			"ID": "id",
			"MAP": "map",
			"ERROR": "error",
			"RESULTS": "results",
			"PATH": "Templates/",
			"RECORD": "record",
			"RECORD_ID": "recordid",
			"INACTIVE": "isinactive",
			"XML": ".xml",
			"TXT": ".txt",
			"PDF": "pdf",
			"DOT": ".",
			"TRUE": "T",
			"FALSE": "F",
			"CUSTOM_FIELD": "customrecordcustomfield",
			"CUSTFIELD_RECORDTYPE": "rectype",
			"CUSTFIELD_LABEL": "label",
			"CUSTFIELD_FIELDTYPE": "fieldtype",
			"CUSTFIELD_SELECTTYPE": "selectrecordtype",
			"SCRIPT_ID": "scriptid",
			"CUSTOMRECORD_TYPE": "customrecordtype",
			"REPORT_SOURCEID": "custrecord_print_rule_group_sourceid",
			"REPORT_SOURCETYPE": "custrecord_print_rule_group_sourcetype",
			"PRINT_AUDIT_RECORD_ID": "custscript_print_audit_rec_id",
			"PRINT_ACCT_PREF" : "customsearch_print_sec_actpref",
			"PRINT_AUDIT_DATE": "custrecord_autoprint_file_date",
			"PRINT_AUDIT_FILE_ID": "custrecord_autoprint_file_id"
	};

	const SOURCE_TYPE = {
			"RECORD": "Record",
			"SAVED_SEARCH": "Saved Search",
			"JSON" : "JSON"
	};

	const CONFIG_KEYS = {
			"API_KEY" 	 : "print_api_key",
			"RETENTION_PERIOD" : "print_retention_time"
	};

	const applicationIdentifiers = {
			"01": {
				"description"	: "GlobalTradeItemNumber(GTIN)",
				"fixedLength"	: "N14",
				"dataTitle"		: "gtin"
			},	
			"10": {
				"description"	: "Batchorlotnumber",
				"variableLength": "X..20",
				"dataTitle"		: "batch_lot"
			},
			"17": {
				"description"	: "Expirationdate(YYYYMMDD)",
				"fixedLength"	: "N8",
				"isDate"		: true,
				"dataTitle"		: "expiry_date"
			},
			"21": {
				"description"	: "Serialnumber",
				"variableLength": "X..20",
				"dataTitle"		: "serial"
			},
			"30": {
				"description"	: "Variablecountofitems(variablemeasuretradeitem)",
				"variableLength": "N..8",
				"dataTitle"		: "var_item_count"
			},
			"91": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_91"
			},
			"92": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_92"
			},
			"93": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_93"
			},
			"94": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_94"
			},
			"95": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_95"
			},
			"96": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_96"
			},
			"97": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_97"
			},
			"98": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_98"
			},
			"99": {
				"description"	: "Companyinternalinformation",
				"variableLength": "X..90",
				"dataTitle"		: "company_internal_99"
			}
	};

	const gs1_parameters = {
			"gtin_length" 			: '14',
			"checkDigitReqLength" 	: '13',
			"fnc" 					: 'FNC',
			"pdf_fnc" 				: '&#xefc1;',
			"zpl_fnc" 				: '_1',
			"gtin_ai" 				: '01',
			"quantity_ai" 			: '30',
			"lot_number_ai" 		: '10',
			"lot_expiry_date_ai" 	: '17',
			"serial_ai" 			: '21',
			"custrecord_wms_user_field_1" : '91',
			"custrecord_wms_user_field_2" : '92',
			"custrecord_wms_user_field_3" : '93',
			"custrecord_wms_user_field_4" : '94',
			"custrecord_wms_user_field_5" : '95',
			"custrecord_wms_user_field_6" : '96',
			"custrecord_wms_user_field_7" : '97',
			"custrecord_wms_user_field_8" : '98',
			"custrecord_wms_user_field_9" : '99'

	};



	return {
		ID: ID,
		SOURCE_TYPE: SOURCE_TYPE,
		CONFIG_KEYS : CONFIG_KEYS,
		gs1_parameters : gs1_parameters,
		applicationIdentifiers : applicationIdentifiers
	};

});
