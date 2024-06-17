/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *//**
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 *
 */
define(['N/https','N/encode','N/url','N/file','N/runtime','N/error','N/format','./rule_engine_const','N/search','N/task','N/translation','N/util','../Translation/mobile_translation_library'],

    /**
     * Utilities file.
     * Contains util methods for rule engine
     * @param https NS Https module binding
     * @param encode NS encode utility
     * @param url NS URL
     * @param file NS file module binding
     * @param runtime NS runtime
     * @param error NS error module
     * @param format NS format
     * @param consts Rule Engine constants
     * @param search NS search
     * @param task NS task
     * @param translation NS translation
     * @param nsUtils NS utils
     * @returns {{isExpression: isExpression, triggerScheduleScript: triggerScheduleScript, getTime: (function(): number), hasOwnPropertyCI: hasOwnPropertyCI, getTemplateType: getTemplateType, getUTCString: (function(): string), parseColumnforJoin: (function(*)), getPreDefinedName: (function((jsonResult|columnId), *=): *), printNodeApiCall: (function(*, *=): any), checkAndThrow: checkAndThrow, merge: (function(*=, *=): Array), getTemplateName: (function(jsonResult): *), getSavedFilePath: (function(fileId): string), uniquify: (function(*): string[]), getBundleId: (function(): (Array|number[]|string|string[])), getFileNamefromPath: (function(*): string), checkAndTranslatedThrow: checkAndTranslatedThrow, convertToDate: (function(*=): *), parseResultforJoin: parseResultforJoin, convertToArray: convertToArray, iterateSearchData: (function(*): Array), getParentFolderId: (function(filePath): *), isEmpty: (function(*=): boolean), getWithDefault: (function(*, *): *), convertToString: (function(*=): string), includes: includes, jsonReader: (function(*=, *=, *): *), searchData: (function(*=): Array), readFromRecord: (function(*, *, *=)), contains: contains, getDestinationFolderId: (function(): parentFolderId), getFilePath: (function(fileName): string), encodeInput: (function(*=): *), endsWith: endsWith, stringFormatter: {replaceAll: (function(*=, *=, *=): *), firstUpremLower: (function(*=): *), firstUp: (function(*=): *)}}}
     */
    function (https,encode,url,file,runtime, error, format, consts,search,task,translation, nsUtils, translationLibrary) {
       /* var localizedStrings = translation.load({
            collections: [{
                alias: 'translationCollection',
                collection: consts.TRANSLATOR_COLLECTION.ERROR_MESSAGE,
                keys : Object.keys(consts.TRANSLATION_KEYS)
            }]
        });*/
        /**
         * Checks if a string starts with another string
         * @param input Main string
         * @param chkString String to check for in Main string
         * @returns {boolean} true if starts false otherwise
         */
        function startsWith(input, chkString) {
            if (input.length < chkString.length) {
                return false;
            }
            return input.substring(0, chkString.length) === chkString;
        }

        /**
         * Checks if a string ends with another string.
         * @param input Main string
         * @param chkString String to check for in Main string
         * @returns {boolean}
         */
        function endsWith(input, chkString) {
            if (input.length < chkString.length) {
                return false;
            }
            return input.substring(input.length - chkString.length, input.length) === chkString;
        }


        /**
         * Checks if a string contains another string.
         * @param sInput Main string
         * @param sChkString String to check for in Main string
         * @returns {boolean}
         */
        function includes(sInput, sChkString) {
            if (sInput.length < sChkString.length) {
                return false;
            }
            return sInput.split(sChkString).length > 1;
        }

        /**
         * Returns unique elements in the string array
         * @param inputArr Input Array
         * @returns {string[]} Unique values are returned
         */
        function uniquify(inputArr) {
            var uniqueSet = {};
            for (var i = 0; i < inputArr.length; i++) {
                uniqueSet[inputArr[i]] = '';
            }
            return Object.getOwnPropertyNames(uniqueSet);
        }

        /**
         * Whether the string contains any expressions
         * @param val Input string
         * @returns {boolean} true if is an expression
         */
        function isExpression(val) {
            //Only a string can contain expression
            if(!nsUtils.isString(val)){
                return false;
            }
            if (val  && includes(val, '{')) {
                checkAndTranslatedThrow(val.split("{").length === 2, {
                    translationKey: consts.TRANSLATION_KEYS.INVALID_EXPRESSION,
                    logMessage: "Invalid expression. Contains more than one expression parts -> {exprParts}."
                }, null, consts.ERROR_CODES.INVALID_EXPRESSION,[val]);
                return true;
            }
            return false;
        }

        /**
         * Converts input to array
         * @param input
         * @returns {*}
         */
        function convertToArray(input){
            if(!input){
                return [];
            }
            return (input instanceof Array)?input:[input];
        }

        /**
         * Converts an object to string. Arrays are converted to elements sorted(as String) and concatenated as string.
         * Should be O(nlg(n)) complexity and hence better for comparing say 2 arrays, which otherwise will take O(n^2) time.
         * @param input
         * @returns {string}
         */
        function convertToString(input) {
            var inputTypeArray = convertToArray(input);
            var strArray = [];
            inputTypeArray.forEach(function (inputEntry) {
                strArray.push(String(inputEntry));
            });
            strArray.sort();
            var str = '';
            strArray.forEach(function (inputEntry) {
                str+='{]'+inputEntry;
            });
            return str;
        }

        /**
         * Throws an exception if condition evaluates to false
         * @param condition Condition to check to be valid
         * @param errorString Exception string to throw
         */
        function checkAndThrow(condition, errorString){
            if(!condition){
                log.error(errorString);
                throw errorString;
            }
        }
        /**
         * Throws an exception if condition evaluates to false
         * @param condition Condition to check to be valid
         * @param errorKey Exception string key to throw which will be translated. Key can contain the Log message and the thrown translated message key
         * @param errorString Option error string which can override the messgage available from key
         * @param errorName Name of the error , which gets populated in thrown exception
         */
        function checkAndTranslatedThrow(condition, errorKey, errorString, errorName, params, locale){
            if(!condition){
                log.error(errorName?errorName:"ERROR OCCURRED",errorString||errorKey.logMessage);
                var translatedMessage = translate(errorKey.translationKey, params, locale);
                if(!errorName) {
                    throw translatedMessage;
                }
                else{
                    throw error.create({name:errorName, message:translatedMessage,notifyOff:true});
                }
            }
        }
        function readFromRecord(incomingRecord, itemColumnId, itemColumnType) {
            if(!itemColumnType){
                itemColumnType = consts.COLUMN_TYPE.CONST_VALUE;
            }
            log.debug("Item Column Id being read : " + itemColumnId);
            const joins = itemColumnId.split(".");
            var recordValue = {};
            var itemColName = {};
            if (joins.length === 2) {
                itemColName = joins[1];
                const joinName = joins[0];
                if ((consts.COLUMN_TYPE.VALUE === translationLibrary.getTranslationKey(itemColumnType)) || (consts.COLUMN_TYPE.MULTISELECT === translationLibrary.getTranslationKey(itemColumnType))) {
                    recordValue = incomingRecord.getValue({
                        name: itemColName,
                        join: joinName
                    });
                } else if (consts.COLUMN_TYPE.TEXT === translationLibrary.getTranslationKey(itemColumnType)) {
                    recordValue = incomingRecord.getText({
                        name: itemColName,
                        join: joinName
                    });
                }
            } else {
                itemColName = joins[0];
                if ((consts.COLUMN_TYPE.VALUE === translationLibrary.getTranslationKey(itemColumnType)) || (consts.COLUMN_TYPE.MULTISELECT === translationLibrary.getTranslationKey(itemColumnType))) {
                    recordValue = incomingRecord.getValue({
                        name: itemColName
                    });
                } else if (consts.COLUMN_TYPE.TEXT === translationLibrary.getTranslationKey(itemColumnType)) {
                    recordValue = incomingRecord.getText({
                        name: itemColName
                    });
                }
            }
            if (consts.COLUMN_TYPE.MULTISELECT === translationLibrary.getTranslationKey(itemColumnType)) {
                recordValue = recordValue.split(consts.DELIMITERS.MULTISELECT)
            }
            return recordValue;
        }

        /**
         * Reader function for reading paths from JSON
         * @param json Input JSON
         * @param query json path to look for delimited by .
         * @param columnType Not Used
         * @returns {*} Value at the query
         */
        function jsonReader(json, query, columnType) {
            return jsonPath(json, query);
        }


        /**
         * Logic to identify xml or script Id template
         * @param {xmlTemplateFile} xmlTemplateFile
         * @returns {invoicePdf} invoicePdf
         */
        function getTemplateType(xmlTemplateFile){
            if(xmlTemplateFile.toString().indexOf(consts.ID.DOT) > 0){
                return true;
            }
            return false;
        }
        /**
         * Logic to get templateName
         * @param {jsonResult} jsonResult
         * @returns {templateName} templateName
         */
        function getTemplateName(jsonResult){
            var jsonResponse = JSON.stringify(jsonResult);
            var outPutObject = jsonResult[consts.ID.MAP];
            var templateName = outPutObject[consts.ID.FIELD_TEMPLATE];
            return templateName;
        }

        /**
         * Logic to get templateName from columnId
         * @param {jsonResult,columnId} jsonResult,columnId
         * @returns {name} name
         */
        function getPreDefinedName(jsonResult,columnId){
            log.debug("JsonResult",jsonResult + "columnId",columnId);
            var outPutObject = jsonResult[consts.ID.MAP];
            var name = outPutObject[columnId];
            return name;
        }


        /**
         * Merges two arrays into a single array. Returns a new merged array.
         * Order is not guaranteed.
         * @param arrOne First Array
         * @param arrTwo Second Array
         * @returns {Array} Merged Array
         */
        function merge(arrOne, arrTwo) {
            var convArrOne = convertToArray(arrOne);
            var convArrTwo = convertToArray(arrTwo);

            var mergedArr = [];
            convArrOne.forEach(function(item){mergedArr.push(item)});
            convArrTwo.forEach(function(item){mergedArr.push(item)});
            return mergedArr;
        }

        /**
         *
         * @returns {time}
         */

        function getTime(){
            var date = new Date();
            var time = Math.floor(date.getTime()/1000);
            return time;
        }

        /**
         *
         * @returns {UTCDate}
         */

        function getUTCString(){
            var date = new Date();
            var  utcDate = date.toUTCString();
            return utcDate;
        }

        /**
         * Logic to encode api key
         * @param data
         * @returns {encodedCode}
         */
        function encodeInput(data){
            return encode.convert({
                string: data,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
        }

        /**
         * Logic to decode base64 string
         * @param data
         * @returns {encodedCode}
         */
        function decodeInput(data){
            return encode.convert({
                string: data,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });
        }

        /**
         * Logic to make api call
         * @param apiKey
         * @param url
         * @returns {any}
         */
        function printNodeApiCall(apiKey,url){
            var authorization = 'Basic '+ encodeInput(apiKey + ":");
            var headers = {
                'Authorization': authorization
            };
            var response = https.get({
                url: url,
                headers: headers
            });
            return JSON.parse(response.body);
        }

        /**
         *
         * @param id
         * @returns {Array}
         */
        function searchData(id){
            var configSearchObj = search.load({
                id: id
            });
            return iterateSearchData(configSearchObj);
        }

        /**
         *
         * @param configSearchObj
         * @returns {Array}
         */
        function iterateSearchData(configSearchObj){
            var resultRow = [];
            var searchPageData;
            var pageSize = configSearchObj.runPaged().count;
            log.debug("Elements pageSize",pageSize);
            var searchData = configSearchObj.runPaged({
                pageSize: pageSize
            });
            searchData.pageRanges
                .forEach(function (pageRange) {
                    searchPageData = searchData.fetch({
                        index: pageRange.index
                    });
                    searchPageData.data
                        .forEach(function (result) {
                            resultRow.push(result);
                        });
                });
            return resultRow;
        }
        /**
         * Check if array contains element
         * supports only string values
         * @param {*} arr
         * @param {*} element
         */
        function contains(arr, element) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].toLowerCase() === element.toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        /**
         * String formatter Utility
         * @type {{replaceAll: (function(*=, *=, *=): *), firstUpremLower: (function(*=): *), firstUp: (function(*=): *)}}
         */
        var stringFormatter = {
            firstUpremLower : function(input){
                var convertedString = null;
                if(input){
                    convertedString = this.firstUp(input.toLowerCase());
                }
                return convertedString;
            },
            firstUp : function(input){
                var convertedString = null;
                if(input){
                    convertedString = input.charAt(0).toUpperCase() + input.slice(1);
                }
                return convertedString;
            },
            replaceAll : function(input, toReplace, replacement){
                var convertedString = null;
                if(input){
                    convertedString = input.replace(new RegExp(toReplace, 'g'), replacement);
                }
                return convertedString;
            }
        };

        /**
         * Triggers Scheduled script based on scriptId and deploymentId
         * @param scriptId
         * @param deploymentId
         * @returns {{id: (*|string|void), statusObj: *, url: string}}
         */
        function triggerScheduleScript(scriptId, deploymentId) {
            var scheduledScriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: scriptId,
                deploymentId: deploymentId
            })

            scheduledScriptTask.submit();

        }

        /**
         * Translates error key.
         * If value against key is not found, either because collection is not defined in account or key is not defined, key itself is returned as a failsafe measure.
         * @param key
         * @returns {*} Translated String or key if translation not found
         */
        function translate(key,params,locale) {
            try {
                /*var translatedValue = localizedStrings["translationCollection"][key];
                if (translatedValue) {
                    return translatedValue();
                } else {
                    return key;
                }*/
                return translationLibrary.getTranslation(key,params,locale);
            } catch (ex) {
                log.error("Error while loading translation : "+ JSON.stringify(ex));
                return key;
            }
        }

        /**
         * Parses column to return either a normal column or a join column
         * @param columnString
         */
        function parseColumnforJoin(columnString) {
            var column = {};
            var joins = columnString.split(".");
            if (joins.length === 2) {
                column.name = joins[1];
                column.join = joins[0];
            } else if (joins.length === 1) {
                column.name = joins[0];
            } else {
                checkAndTranslatedThrow(false, {
                    translationKey: consts.TRANSLATION_KEYS.INVALID_ITEM_COLUMN,
                    logMessage: 'Illegal item column specified:' + columnString
                }, null, consts.ERROR_CODES.INVALID_EXPRESSION);
            }
            return column;
        }

        function parseResultforJoin(columnString,searchResult,dataType) {
            var result = "";
            var itemColName ;
            try{
                var joins = columnString.split(".");
                if (joins.length === 2) {
                    itemColName = joins[1];
                    const joinName = joins[0];
                    if (consts.COLUMN_TYPE.TEXT === translationLibrary.getTranslationKey(dataType)) {
                        result = searchResult.getText({
                            name: itemColName,
                            join: joinName
                        });
                    } else {
                        result = searchResult.getValue({
                            name: itemColName,
                            join: joinName
                        });
                    }
                } else {
                    itemColName = joins[0];
                    if (consts.COLUMN_TYPE.TEXT === translationLibrary.getTranslationKey(dataType)) {
                        result = searchResult.getText({
                            name: itemColName
                        });
                    } else {
                        result = searchResult.getValue({
                            name: itemColName
                        });
                    }
                }
                return result;
            }catch(e){
                log.error("error while parsing data",e);
                return result;
            }

        }

        /**
         * Returns file name from complete path
         * @param path Path of the file
         * @returns {string} File name
         */
        function getFileNamefromPath(path){
            var n = path.lastIndexOf('/');
            return path.substring(n + 1);
        }

        /**
         * Whether an object is empty JSON object
         * @param obj Object to test
         * @returns {boolean} true if empty , false otherwise
         */
        function isEmpty(obj){
            return Object.keys(obj).length === 0 && obj.constructor === Object
        }

        /**
         * Converts a string formatted input to date. If already a date, returns same
         * @param input
         * @returns {*|number} Date converted
         */
        function convertToDate(input) {
            var formattedDate = input;
            if (!(typeof input.getMonth === 'function')) {
                formattedDate = format.parse({
                    value: input,
                    type: format.Type.DATE
                });
            }
            return formattedDate;
        }

        /**
         * Provides value with fallback
         * @param nullableValue value which can potentially be null
         * @param defaultValue value to default to, if nullableValue is null
         * @returns {*} Value with fallback
         * @throws exception if can't obtain a non-null/defined value even with default
         */
        function getWithDefault(nullableValue, defaultValue){
            var value = nullableValue;
            if(!value){
                value = defaultValue;
                checkAndTranslatedThrow((value), {
                    translationKey: consts.TRANSLATION_KEYS.UNEXPECTED_ERROR,
                    logMessage: "Value is empty as well as defaulted is empty."
                }, null, consts.ERROR_CODES.UNEXPECTED_ERROR);
            }
            return value;
        }

        /**
         * A simple JSON path traversal function. Works with simple paths (not arrays)
         * @param json Json in which path needs to be traversed
         * @param query JSON query (. separated)
         * @returns {*} Result of path lookup
         */
        function jsonPath(json, query) {
            var queryParts = query.split(".");
            var currJsonPart = json;
            for (var idx in queryParts) {
                if (!currJsonPart) {
                    break;
                }
                currJsonPart = currJsonPart[queryParts[idx]];
            }
            return currJsonPart;
        }
        /**
         * Method compares values - case insensitive
         * @param object
         * @param prop
         */
        function hasOwnPropertyCI(object, prop){
            for(var key in object){
                if(key.toLowerCase() === prop.toLowerCase())
                    return true;
            }
            return false;
        }

        /**
         * function returns user preference printer stored in custom record
         * @param userId
         * @param key
         * @returns {Array}
         */
        function getUserPreferencePrinters(userId,key){
            var filters = [];
            if(!userId){
                checkAndTranslatedThrow(false, {
                    translationKey: consts.TRANSLATION_KEYS.REQUIRED_FIELD_MISSING,
                    logMessage: 'Exception while inserting record:' + e
                }, null, consts.ERROR_CODES.REQUIRED_FIELD_MISSING, ["userId"]);
            }

            filters.push(search.createFilter({
                name: consts.ID.RECORD_PRINT_USERID,
                operator: search.Operator.CONTAINS,
                values: userId
            }));

            if(key){
                filters.push(search.createFilter({
                    name: consts.ID.RECORD_PRINT_REPORT_NAME,
                    operator: search.Operator.CONTAINS,
                    values: key
                }));
            }
            var searchId = search.load({
                id: consts.ID.SEARCH_PRINT_SESSION_PRINTER
            });
            searchId.filters = filters;
            return iterateSearchData(searchId);
        }

        /**
         * Generates random UUID string
         * @return {string}
         */
        function randomUuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        return {
            uniquify: uniquify,
            isExpression: isExpression,
            convertToArray: convertToArray,
            convertToString: convertToString,
            readFromRecord: readFromRecord,
            jsonReader : jsonReader,
            checkAndThrow: checkAndThrow,
            getTemplateType: getTemplateType,
            getTemplateName: getTemplateName,
            getPreDefinedName: getPreDefinedName,
            merge: merge,
            getTime: getTime,
            getUTCString: getUTCString,
            encodeInput: encodeInput,
            decodeInput: decodeInput,
            printNodeApiCall: printNodeApiCall,
            searchData: searchData,
            iterateSearchData: iterateSearchData,
            contains: contains,
            stringFormatter : stringFormatter,
            triggerScheduleScript : triggerScheduleScript,
            checkAndTranslatedThrow : checkAndTranslatedThrow,
            parseColumnforJoin: parseColumnforJoin,
            parseResultforJoin: parseResultforJoin,
            endsWith : endsWith,
            includes : includes,
            getFileNamefromPath : getFileNamefromPath,
            isEmpty : isEmpty,
            convertToDate :convertToDate,
            getWithDefault : getWithDefault,
            hasOwnPropertyCI: hasOwnPropertyCI,
            translate: translate,
            getUserPreferencePrinters: getUserPreferencePrinters,
            randomUuid : randomUuid
        }

    });
