/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *//**
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 *
 */
define(['N/record','N/search', 'N/render', 'N/file', './rule_engine_const' ,'./rule_engine_utils', '../JSON Generation/common','../Config Injection/config','../Translation/mobile_translation_library'],
    /**
     * Data access layer interfacing with Netsuite. Provides various finder, getter methods.
     * @param record N/record binding
     * @param search N/search binding
     * @param render N/render binding
     * @param file N/file binding
     * @param consts AutoPrint Constants
     * @param utils
     * @param mobileCommon Reference to mobile dependency to avoid relevant mobile updates being missed here
     */
    function (record,search, render, file, consts, utils, mobileCommon,config, mobileTranslationLibrary) {
        //LOAD ALL configs once
        var CONFIG;

        /**
         * Loads all configurations
         */
        function loadConfigs(){
            var config = {};
            var results = _executeSavedSearch(null, null, null, mobileCommon.searchId.accountPreferences, true);
            results.forEach(function(result){
                config[result.getText(consts.ID.MOBILE_ACCNT_PREF_KEY)] = result.getValue(consts.ID.MOBILE_ACCNT_PREF_VAL);
            });

            results = _executeSavedSearch(null, null, null, consts.ID.SEARCH_SECURE_ACCOUNT_PREF, true);
            var value;
            results.forEach(function(result){
                //give preference to secure value in case of conflict, only if secure value is configured
                value = result.getValue(consts.ID.SECURE_ACCNT_PREF_VAL);
                if(value) {
                    config[result.getText(consts.ID.SECURE_ACCNT_PREF_KEY)] = value;
                }
            });
            log.debug("Loaded Configurations : "+JSON.stringify(config));
            return config;
        }
        /**
         * Finds a single record by id and type of the record. This can fetch join columns as well.
         * @param id Record Id
         * @param type Type of the record
         * @param columns Columns of the record that needs to be fetched
         * @returns {Array} Array would contain either a single result or none
         * @throws exception if more than one record is found for the id. Which shouldn't be the case in case of Netsuite.
         */
        function findByIdAndType(id, type, columns) {
            var filters = [];
            filters.push(search.createFilter({name : consts.ID.INTERNALID, operator : search.Operator.EQUALTO, values: id}));
            var searchColumns = [];
            var column = {};

            for (var i = 0; i < columns.length; i++) {
                column = columns[i];

                var searchColumn = {};
                if (column.join) {
                    searchColumn = search.createColumn({
                        name: column.name,
                        join: column.join
                    });
                } else {
                    searchColumn = search.createColumn({
                        name: column.name
                    });
                }
                searchColumns.push(searchColumn);
                log.debug("Columns fetched rec id:" + id + " : " + column.name);
            }

            return getSearchResults(type, filters, searchColumns);

        }

        /**
         * Executes an adhoc search and returns results
         * @param type
         * @param filters
         * @param searchColumns
         * @returns {Array}
         */
        function getSearchResults(type, filters, searchColumns){
            var recordSearch = search.create({
                type: type,
                filters: filters,
                columns: searchColumns
            });

            var results = [];
            var searchPageData;
            var pageSize = recordSearch.runPaged().count;
            log.debug("Rule Engine dal Search elements pageSize",pageSize);
            var searchData = recordSearch.runPaged({
                pageSize: pageSize
            });
            searchData.pageRanges
                .forEach(function (pageRange) {
                    searchPageData = searchData.fetch({
                        index: pageRange.index
                    });
                    searchPageData.data
                        .forEach(function (result) {
                            results.push(result);
                        });
                });
            return results;
        }

        /**
         * Gives rules sorted by Sequence number in ascending order
         * @param key for which rule is being evaluated
         * @param ruleColumnIds Column Ids of the rules that need to be fetched
         * @returns {Array} Rules defined for input key
         */
        function getAllRulesSortSeq(key, ruleColumnIds) {
            log.debug("Rules being fetched for key:" + key);
            var filters = [];
            filters.push(search.createFilter({
                name: consts.ID.RULE_KEY,
                operator: search.Operator.IS,
                values: key
            }));

            var columns = [];
            for (var i = 0; i < ruleColumnIds.length; i++) {
                log.debug("Adding rule column : " + ruleColumnIds[i]);
                columns.push(search.createColumn({name: ruleColumnIds[i]}));
            }

            columns.push(search.createColumn({name: consts.ID.RULE_NAME}));
            columns.push(search.createColumn({name: consts.ID.RULE_EMPTYEVAL}));
            columns.push(search.createColumn({name: consts.ID.RULE_ISDEFAULT}));

            var results = _executeSavedSearch(key, columns, filters, consts.ID.SEARCH_RULEVALUE);
            logRuleResults(results);
            return results;
        }

        /**
         * Rule search method
         * @param key
         * @param columns Columns to Fetch. Don't include name. It's always fetched
         * @param filters Additional filters required.
         * @param searchId Search Id to execute
         * @skipNameColumn boolean to indicate whether to add name column by default to the list of returned columns
         * @returns {Array}
         */
        function _executeSavedSearch(key, columns, filters, searchId, skipNameColumn) {
            var searchPageData;
            if (!filters) {
                filters = [];
            }
            if (!columns) {
                columns = [];
            }

            if(!skipNameColumn)
                columns.push(search.createColumn({name: consts.ID.COLUMN_NAME}));

            var savedSearch = search.load({
                id: searchId
            });
            savedSearch.filters = utils.merge(savedSearch.filters, filters);
            savedSearch.columns = utils.merge(savedSearch.columns, columns);
            var results = [];
            var pageSize = savedSearch.runPaged().count;
            log.debug("Execute Saved Search elements pageSize",pageSize);
            var searchData = savedSearch.runPaged({
                pageSize: pageSize
            });
            searchData.pageRanges
                .forEach(function (pageRange) {
                    searchPageData = searchData.fetch({
                        index: pageRange.index
                    });
                    searchPageData.data
                        .forEach(function (result) {
                            results.push(result);
                        });
                });
            return results;
        }

        function logRuleResults(results) {
            var ruleNames = "";
            results.forEach(function (result) {
                ruleNames += result.getValue(consts.ID.RULE_NAME) + ",";
            });
            log.debug("No of Rules returned : " + results.length + " Rules returned : " + ruleNames);
            return results;
        }

        /**
         * Gets default rules. Ideally should be 1 for a key
         * @param key
         * @returns {Array}
         */
        function getDefaultRules(key) {
            log.debug("Getting default rules for key : " + key);

            var filters = [];
            filters.push(search.createFilter({
                name: consts.ID.RULE_KEY,
                operator: search.Operator.IS,
                values: key
            }));
            filters.push(search.createFilter({
                name: consts.ID.RULE_ISDEFAULT,
                operator: search.Operator.IS,
                values: true
            }));
            return _executeSavedSearch(key, null, filters, consts.ID.SEARCH_RULEVALUE);
        }

        /**
         *
         * @param key for which rule is being evaluated
         * @returns {Array} Rule Maps defined for input key
         */
        function getRuleMapsSortRuleName(key) {
            log.debug("Rule Map being fetched for key:" + key);
            var filters = [];
            filters.push(search.createFilter({
                name: consts.ID.RULEMAP_KEY,
                operator: search.Operator.IS,
                values: key
            }));
            filters.push(search.createFilter({
                name: consts.ID.INACTIVE,
                operator: search.Operator.IS,
                values: consts.ID.FALSE
            }));

            var columns = [
                search.createColumn({name: consts.ID.RULEMAP_ISOUT, label: consts.LABEL.RULEMAP_ISOUT}),
                search.createColumn({
                    name: consts.ID.RULEMAP_ITEMCOLTYPE,
                    label: consts.LABEL.RULEMAP_ITEMCOLTYPE
                }),
                search.createColumn({name: consts.ID.RULEMAP_ITEMCOLID, label: consts.LABEL.RULEMAP_ITEMCOLID}),
                search.createColumn({name: consts.ID.RULEMAP_OPERATOR, label: consts.LABEL.RULEMAP_OPERATOR}),
                search.createColumn({name: consts.ID.RULEMAP_RULECOLID, label: consts.LABEL.RULEMAP_RULECOLID}),
                search.createColumn({
                    name: consts.ID.RULEMAP_RULECOLTYPE,
                    label: consts.LABEL.RULEMAP_RULECOLTYPE
                }),
                search.createColumn({
                    name: consts.ID.RULEMAP_RULENAME,
                    sort: search.Sort.ASC,
                    label: consts.LABEL.RULEMAP_RULENAME
                })
            ];

            return _executeSavedSearch(key, columns, filters, consts.ID.SEARCH_RULEMAP);
        }
        /**
         * Logic to check incoming data record or savedsearch
         * @param {key} key
         * @returns {sourceType} sourceType
         */
        function getSourceType(key){
            var jsonObject = {};
            var searchPageData;
            var ruleReportSearchObj = search.load({
                id: consts.ID.REPORT_SEARCH
            });
            var filterArray = ruleReportSearchObj.filters;
            var labelTypeFilter = search.createFilter({
                name: consts.ID.COLUMN_NAME,
                operator : search.Operator.IS,
                values : key
            });
            filterArray.push(labelTypeFilter);
            ruleReportSearchObj.filters = filterArray;
            var pageSize = ruleReportSearchObj.runPaged().count;
            log.debug("Source Type pageSize",pageSize);
            var searchData = ruleReportSearchObj.runPaged({
                pageSize: pageSize
            });
            searchData.pageRanges
                .forEach(function (pageRange) {
                    searchPageData = searchData.fetch({
                        index: pageRange.index
                    });
                    searchPageData.data
                        .forEach(function (result) {
                            jsonObject.key = result[consts.ID.ID];
                            jsonObject.sourceId = result.getValue(consts.ID.REPORT_SOURCEID);
                            jsonObject.sourceType = result.getText(consts.ID.REPORT_SOURCETYPE);
                        });
                });
            return jsonObject;
        }


        /**
         * Logic to do interpolation on Json Object
         * @param templateFile
         * @param jsonObj
         * @returns {*}
         */
        function jsonInterpolation(templateFile, jsonObj){
            var invoicePdf;
            var isXml = utils.getTemplateType(templateFile);
            var renderer = render.create();
            if(isXml){
                var xmlTemplateFile = file.load(templateFile);
                renderer.templateContent = xmlTemplateFile.getContents();
            }
            else{
                renderer.setTemplateByScriptId({
                    scriptId: templateFile
                });
            }
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonObject",
                data: jsonObj
            });
            var start = new Date().getTime();
            var contents = file.load(templateFile);
            if(!utils.includes(contents.getContents().toLowerCase(),consts.ID.PDF)){
                invoicePdf = renderer.renderAsString();
            }else{
                invoicePdf = renderer.renderAsPdf();
            }
            log.audit("File pdf check time"+(new Date().getTime() - start) + " ms.");
            return invoicePdf;
        }
        /**
         * Logic to do get search Row
         * @param {sourceId, recordId, additionalFilters} sourceId, recordId, additionalFilters
         * @returns {searchRow} searchRow
         */
        function getSearchRow(sourceId, recordId,additionalFilters){
            var searchRowResults = search.load({
                id: sourceId
            });
            var filterArray = searchRowResults.filters;
            var filter = search.createFilter({
                name: consts.ID.INTERNAL_ID,
                operator : search.Operator.ANYOF,
                values : recordId
            });
            filterArray.push(filter);
            if(additionalFilters){
                for(var i in additionalFilters){
                    filterArray.push(additionalFilters[i]);
                }
            }
            searchRowResults.filters = filterArray;
            return searchRowResults;
        }

        /**
         * Returns record name field
         * @param recordType Type of record to read
         * @param recordId Id of the record to read
         * @returns {*}
         */
        function getNameonRecord(recordType, recordId){
            var rec = record.load({
                type : recordType,
                id : recordId
            });
            return rec.getValue(consts.ID.COLUMN_NAME);
        }

        /**
         * Returns internal id associated with a Custom record
         * @param recordName Record name for which Id needs to be looked
         * @returns {*} Internal Id of the record
         */
        function getCustomRecordidbyName(recordName){
            var recordTypeId = null;
            var filters = [search.createFilter({
                name: "scriptid",
                operator: "IS",
                values: recordName
            })];
            var results = getSearchResults(consts.ID.CUSTOMRECORD_TYPE,filters,["name","scriptid"]);
            if(results && results.length > 0){
                recordTypeId = results[0].id;
            }
            return recordTypeId;
        }


        /**
         * Looks up Rule Map entry for key & ruleFieldId. Both active & inactive ruleMaps are returned.
         * @param key Rule key
         * @param ruleFieldId Rule field Id
         * @returns {*} RuleMap result
         */
        function getRuleFieldMap(key, ruleFieldId) {
            var ruleField = null;
            var formulaFilter = String("formulatext: {"+consts.ID.RULEMAP_KEY+"}");
            var filters = [
                [consts.ID.RULEMAP_RULECOLID, search.Operator.IS , ruleFieldId],
                "AND",
                [formulaFilter,search.Operator.IS,key],
                "AND",
                [consts.ID.COLUMN_INACTIVE,search.Operator.ANY,""]
            ];
            var columns =  [search.createColumn({name: consts.ID.COLUMN_NAME}), search.createColumn({name: consts.ID.INTERNAL_ID}), search.createColumn({name: consts.ID.COLUMN_INACTIVE})];
            var results = getSearchResults(consts.ID.RECORD_RULEMAP,filters,columns);
            if (results && results.length > 0) {
                ruleField = results[0];
            }
            return ruleField;

        }

        /**
         * return search count for duplicate names in specific record
         * @param name
         * @param recordType
         * @returns {count}
         */
        function getRecordCountByName(name,recordType) {
            var customrecord_SearchObj = search.create({
                type: recordType,
                filters:
                    [
                        [consts.ID.COLUMN_NAME,search.Operator.IS,name]//case insensitive
                    ],
                columns:
                    [
                        search.createColumn({
                            name: consts.ID.COLUMN_NAME,
                            label: consts.ID.COLUMN_NAME
                        })
                    ]
            });

            return customrecord_SearchObj.runPaged().count;
        }

        /**
         * returns all printers configured for Printers record
         * @param printerName
         * @returns {Array}
         */
        function getPrinters(printerName) {
            var printers = [];
            var printer;
            var printerType;
            var printSearchResult = utils.searchData(consts.ID.PRINTERS_SEARCH);
            for(var i in printSearchResult){
                if(printSearchResult[i].getValue(consts.ID.COLUMN_NAME) === printerName){
                    printerType = printSearchResult[i].getValue(consts.ID.PRINTER_TYPE);
                }
            }
            for(var i in printSearchResult){
                printer = {};
                printer.label = printSearchResult[i].getValue(consts.ID.COLUMN_NAME);
                printer.value = printSearchResult[i].getValue(consts.ID.PRINTER_ID);
                if(printerType && printerType === printSearchResult[i].getValue(consts.ID.PRINTER_TYPE)){
                    printers.push(printer);
                }
            }
            return printers;
        }

        /**
         * return request column data
         * @param key
         * @param ruleColumnId
         */
        function getColumnDataForKey(key,ruleColumnId){
            return getDataBasedOnSavedSearchId(consts.ID.SEARCH_RULEVALUE,key,ruleColumnId,consts.COLUMN_TYPE.CONST_TEXT);
        }

        /**
         * returns requested column data by savedSearchId
         * @param savedSearchId
         * @param key
         * @param ruleColumnId
         * @param dataType
         * @returns {Array}
         */
        function getDataBasedOnSavedSearchId(savedSearchId,key,ruleColumnId,dataType){
            var finalData = [];
            var filters = [];
            var columns = utils.parseColumnforJoin(ruleColumnId);
            var savedSearch = search.load({
                id: savedSearchId
            });
            filters.push(search.createFilter({
                name: consts.ID.RULE_KEY,
                operator: search.Operator.IS,
                values: key
            }));

            savedSearch.filters = utils.merge(savedSearch.filters, filters);
            savedSearch.columns = utils.merge(savedSearch.columns, columns);
            var searchResult = utils.iterateSearchData(savedSearch);
            for(var i in searchResult){
                finalData.push(utils.parseResultforJoin(ruleColumnId,searchResult[i],dataType))
            }
            finalData = finalData.filter(function(e){return e});
            return finalData;

        }

        /**
         * Queries printer by remote printer id
         * @param sRemotePrinterId
         * @returns {*}
         * @private
         */
        function _getPrinter(sRemotePrinterId){
            const filters = [];
            filters.push(search.createFilter({
                name: consts.ID.PRINTER_ID,
                operator: search.Operator.IS,
                values: sRemotePrinterId
            }));

            const results = _executeSavedSearch(null,null,filters, consts.ID.PRINTERS_SEARCH, true);

            return results[0];
        }

        /**
         * Inserts a new audit record for Print
         * @param jobId external jobId to track audit against
         * @param filePath File path beine printed
         * @param fileId Id of the file in File Cabinet
         * @param sRemotePrinterId remote printer id
         * @param iNoOfCopies noOf copies being printed
         * @return id of saved audit record
         */
        function insertAuditRecord(jobId, filePath, fileId, sRemotePrinterId, iNoOfCopies, isRaw, description){
            var recordId;
            var auditRec = record.create({type : consts.ID.PRINT_AUDIT});

            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_DATE, value : new Date()});
            auditRec.setText({fieldId : consts.ID.PRINT_AUDIT_STATUS, text : mobileTranslationLibrary.getTranslation("PRINT_SUBMITTED")});
            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_JOB, value : jobId});
            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_FILE_PATH, value : filePath});
            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_COPIES, value : iNoOfCopies});
            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_DESCRIPTION, value : description});
            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_IS_RAW, value : isRaw});


            const printer = _getPrinter(sRemotePrinterId);
            auditRec.setValue({fieldId : consts.ID.PRINT_AUDIT_PRINTER, value : printer.getValue({name:consts.ID.ID})});

            if(fileId) {
                auditRec.setValue({fieldId: consts.ID.PRINT_AUDIT_FILE_ID, value: fileId});
            }
            recordId = auditRec.save();
            var params = '&recordId='+recordId;
            var scriptURL = config.suiteletURL + 'script=' + consts.SCRIPT_DEPLOYMENTS.SUITELET_REPRINT.REPRINT_SL_SCRIPTID + '&deploy=' + consts.SCRIPT_DEPLOYMENTS.SUITELET_REPRINT.REPRINT_SL_DEPLOYMENTID;

            record.submitFields({
                type: consts.ID.PRINT_AUDIT,
                id: recordId,
                values: {
                    'custrecord_print_reprint_url': scriptURL + params
                }
            });
            return recordId;
        }

        /**
         * Updates status of a audit record
         * @param recId Internal Id of the audit record
         * @param status Status of the audit
         */
        function updateAuditRecord(recId, status) {
            //TODO : will need to be changed to submitFields. Not working with TEXT right now
            var auditRec = record.load({type: consts.ID.PRINT_AUDIT, id: recId});
            auditRec.setText({fieldId: consts.ID.PRINT_AUDIT_STATUS, text: status});
            auditRec.save();
        }

        /**
         * Returns Audit records with status as submitted
         * @returns {Array} Array of results
         */
        function getAuditSubmitted(){
            return _executeSavedSearch(null,null,null, consts.ID.SEARCH_PRINTAUDIT_SUBMITTED, true);
        }

        /**
         * Loads config key
         * @param configKey
         * @param defaultVal Default value is return in case the key is not found in DB
         * @returns {*} value of the key
         */
        function getConfig(configKey, defaultVal) {
            if(!CONFIG){
                //load once
                CONFIG = loadConfigs();
            }
            var value = CONFIG[configKey];
            if (!value && defaultVal) {
                log.audit("Using Default value for "+configKey+" - "+defaultVal);
                return defaultVal;
            } else {
                return value;
            }
        }

        /**
         * Get function definition by Name of the function
         * @param name Function Name
         * @returns {Array} Definitions array - ideally should be single entry
         */
        function getFunctionDefinition(name){
            var filters = [];
            filters.push(search.createFilter({
                name: consts.ID.COLUMN_NAME,
                operator: search.Operator.IS,
                values: name
            }));
            return _executeSavedSearch(null,null,filters, consts.ID.FUNCTION_SEARCH, true);
        }

        /**
         * Gets file access record by Key
         * @param sAccessKey Access key
         * @return {*} File Access record
         */
        function getFileaccessByKey(sAccessKey) {
            var filters = [];
            filters.push(search.createFilter({
                name: consts.ID.FILEMAP_ACCESSKEY,
                operator: search.Operator.IS,
                values: sAccessKey
            }));
            return _executeSavedSearch(null,null,filters, consts.ID.SEARCH_FILEMAP, true);

        }

        /**
         * Gets file access record older than specified
         * @param iAge older than seconds
         * @return {*} File Access record
         */
        function getFileaccessbyAge(iAge) {
            var filters = [];
            const iLessThanTime = new Date().getTime()-(iAge*1000);
            log.debug("Returning records older than: "+iLessThanTime);
            filters.push(search.createFilter({
                name: consts.ID.FILEMAP_TIMESTAMP,
                operator: search.Operator.LESSTHAN,
                values: iLessThanTime
            }));
            return _executeSavedSearch(null,null,filters, consts.ID.SEARCH_FILEMAP, true);
        }

        return {
            getAllRulesSortSeq: getAllRulesSortSeq,
            getRuleMapsSortRuleName: getRuleMapsSortRuleName,
            findByIdAndType: findByIdAndType,
            getSourceType: getSourceType,
            getSearchRow: getSearchRow,
            getDefaultRules : getDefaultRules,
            getNameonRecord : getNameonRecord,
            getCustomRecordidbyName : getCustomRecordidbyName,
            getRuleFieldMap:getRuleFieldMap,
            getRecordCountByName: getRecordCountByName,
            getPrinters: getPrinters,
            getColumnDataForKey: getColumnDataForKey,
            getDataBasedOnSavedSearchId: getDataBasedOnSavedSearchId,
            insertAuditRecord: insertAuditRecord,
            updateAuditRecord: updateAuditRecord,
            getAuditSubmitted: getAuditSubmitted,
            getConfig: getConfig,
            jsonInterpolation: jsonInterpolation,
            getFunctionDefinition : getFunctionDefinition,
            getFileaccessByKey : getFileaccessByKey,
            _executeSavedSearch: _executeSavedSearch,
            getFileaccessbyAge: getFileaccessbyAge
        };

    });
