/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/record','N/file','N/config','N/search'],

		function(record,file,config,search) {


	function execute(context) {

		try
		{
			changeUserLanguage('en_US');
			//var appDetails = 'NSWMS';
            var configPath = 'SuiteBundles/Bundle 227319/src/Config/appConfig.js';
            var referenceFile = 'NSWMS_2852351789.txt';
            var applicationLanguages = getApplicationLanguages('NSWMS');
           var  commonLanguagesMap = getCommonLanguages(applicationLanguages);

         var  standardLabelAndMessage = getStandardLabelAndMessage(commonLanguagesMap, configPath, 'NSWMS', referenceFile);
          synchronizeLabels(standardLabelAndMessage, commonLanguagesMap);
          synchronizeMessages(standardLabelAndMessage, commonLanguagesMap);
		}
		catch(e)
		{
			log.error({title:'e',details:e});

		}
	}	
	function messageRowProcesssor(rowObj, finalObj) {
        if (!finalObj) {
            finalObj = {}
        }
        var msgId = rowObj['messageId'];
        var msg = rowObj['message'];
        finalObj[msg] = msgId;
        return finalObj;
    }
	function changeUserLanguage(languageCode) {
        var userPref = config.load({
            type: config.Type.USER_PREFERENCES,
            isDynamic: true
        });

        userPref.setValue({
            fieldId: "LANGUAGE",
            value: languageCode
        });

        userPref.save()
    }
	function getAccountMessages() {
        var fieldMap = {
            getValue: {
                name: 'message',
                internalid: 'messageId'
            }
        }
        var msgList = prepareJSONFromSearch('customsearch_mobile_message_search', fieldMap, messageRowProcesssor) || {};
        return msgList
    }
	 function prepareJSONFromSearchObject (searchObj, searchFieldsMap, resultObjPostProcessor, objKey) {
         var pagedData = searchObj.runPaged({
             pageSize: 1000
         })

         log.debug({
             title: 'Result Count for Search: ' + searchObj.id,
             details: pagedData.count
         })

         var finalObj
         if (!resultObjPostProcessor) {
             if (objKey) {
                 finalObj = {}
             } else {
                 finalObj = []
             }
         }

         pagedData.pageRanges
             .forEach(function (pageRange) {
                 var myPage = pagedData.fetch({
                     index: pageRange.index
                 })
                 myPage.data
                     .forEach(function (result) {
                         var resultObj = {}
                         var joinNameArr = []
                         for (var key in searchFieldsMap.getValue) {
                             var resultValue = result.getValue({
                                 name: key
                             })
                             if (INCLUDE_NULL_CONFIG || NULL_VALUES.indexOf(resultValue) === -1) {
                                 resultObj[searchFieldsMap.getValue[key]] = resultValue
                             }
                         }
                         for (var key in searchFieldsMap.getText) {
                             var resultValue = result.getText({
                                 name: key
                             })
                             if (INCLUDE_NULL_CONFIG || NULL_VALUES.indexOf(resultValue) === -1) {
                                 resultObj[searchFieldsMap.getText[key]] = resultValue
                             }
                         }
                         for (var joinKey in searchFieldsMap.join) {
                             var joinName = searchFieldsMap.join[joinKey]['joinName']
                             joinNameArr.push(joinName)
                             var joinObj = {}
                             for (var fieldName in searchFieldsMap.join[joinKey].getValue) {
                                 var resultValue = result.getValue({
                                     name: fieldName,
                                     join: joinKey
                                 })
                                 var jsonName = searchFieldsMap.join[joinKey].getValue[fieldName]
                                 if (INCLUDE_NULL_CONFIG || NULL_VALUES.indexOf(resultValue) === -1) {
                                     joinObj[jsonName] = resultValue
                                 }
                             }
                             for (var fieldName in searchFieldsMap.join[joinKey].getText) {
                                 var resultValue = result.getText({
                                     name: fieldName,
                                     join: joinKey
                                 })
                                 var jsonName = searchFieldsMap.join[joinKey].getText[fieldName]
                                 if (INCLUDE_NULL_CONFIG || NULL_VALUES.indexOf(resultValue) === -1) {
                                     joinObj[jsonName] = resultValue
                                 }
                             }
                             resultObj[joinName] = joinObj
                         }
                         if (resultObjPostProcessor) {
                             finalObj = resultObjPostProcessor(resultObj, finalObj)
                         } else {
                             if (objKey) {
                                 var joinsData = {}
                                 for (var i in joinNameArr) {
                                     var key = joinNameArr[i]
                                     joinsData[key] = resultObj[key]
                                     delete resultObj[key]
                                 }
                                 if (!finalObj.hasOwnProperty(resultObj[objKey])){
                                     finalObj[resultObj[objKey]] = resultObj
                                 }
                                 for (var joinKey in joinsData) {
                                     if (!finalObj[resultObj[objKey]].hasOwnProperty(joinKey)) {
                                         finalObj[resultObj[objKey]][joinKey] = []
                                     }
                                     finalObj[resultObj[objKey]][joinKey].push(joinsData[joinKey])
                                 }
                             } else {
                                 finalObj.push(resultObj)
                             }
                         }
                     })
             })
         return finalObj
     }
	 function labelRowProcesssor(rowObj, finalObj) {
         if (!finalObj) {
             finalObj = {}
         }
         var labelId = rowObj['labelId'];
         var label = rowObj['label'];
         finalObj[label] = labelId;
         return finalObj;
     }
	function prepareJSONFromSearch (searchId, searchFieldsMap, resultObjPostProcessor, objKey, filterObj) {
        var filtersArray
        var searchObj = search.load({
            id: searchId
        })
        if(filterObj) {
            filtersArray = filterObj[searchId]
        }
        if(filtersArray) {
            searchObj.filters = filtersArray
        }

        return prepareJSONFromSearchObject(searchObj, searchFieldsMap, resultObjPostProcessor, objKey)
    }
	function getAccountLabels() {
        var fieldMap = {
            getValue: {
                name: 'label',
                internalid: 'labelId'
            }
        }
        var labelsList = prepareJSONFromSearch('customsearch_mobile_labels_search', fieldMap, labelRowProcesssor) || {};
        return labelsList
    }
	function synchronizeLabels(standardLabelAndMessage, commonLanguagesMap) {
        var accountLabels = getAccountLabels();
        var standardLabels = standardLabelAndMessage['labelsList'];
        var en_US_standardLabels = standardLabelAndMessage['labelsList']['en_US'];
        var labelMap = {
            updated: [],
            created: []
        };
        var en_US_value;
        for (var key in en_US_standardLabels) {
            en_US_value = en_US_standardLabels[key];
            var labelObj = {
                id: key,
                value: en_US_value
            };
            if (accountLabels[en_US_value]) {
                labelMap.updated.push(updateRecord('customrecord_mobile_labels', standardLabels, commonLanguagesMap, labelObj, accountLabels[en_US_value]));
            } else {
                labelMap.created.push(createRecord('customrecord_mobile_labels', standardLabels, commonLanguagesMap, labelObj));
            }
        }
        return labelMap;
    }


    function synchronizeMessages(standardLabelAndMessage, commonLanguagesMap) {
        var accountMessages = getAccountMessages();
        var standardMessages = standardLabelAndMessage['messagesList'];
        var en_US_standardMessages = standardLabelAndMessage['messagesList']['en_US'];
        var messageMap = {
            updated: [],
            created: []
        };
        var en_US_value;
        for (var key in en_US_standardMessages) {
            en_US_value = en_US_standardMessages[key];
            var msgObj = {
                id: key,
                value: en_US_value
            };
            if (accountMessages[en_US_value]) {
                messageMap.updated.push(updateRecord('customrecord_mobile_messages', standardMessages, commonLanguagesMap, msgObj, accountMessages[en_US_value]));
            } else {
                messageMap.created.push(createRecord('customrecord_mobile_messages', standardMessages, commonLanguagesMap, msgObj));
            }
        }
        return messageMap;
    }

    function updateRecord(recordType, standardValues, commonLanguagesMap, enUSObject, recordId) {
        var recordObject = record.load({
            type: recordType,
            id: recordId
        });
        var name = recordObject.getValue({
            fieldId: 'name'
        })
        recordObject.setValue({
            fieldId: 'name',
            value: replaceSpecialHTMLCharacters(name)
        });
        return updateTranslations(recordObject, standardValues, commonLanguagesMap, enUSObject);
    }
    function replaceSpecialHTMLCharacters(inputString) {
        var unEscapeMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#x27;': "'",
            '&#x60;': '`'
        };

        var outputString = inputString;
        if (inputString) {
            for (var encodedKey in unEscapeMap) {
                var regularExp = new RegExp(encodedKey, 'g');
                outputString = outputString.replace(regularExp, unEscapeMap[encodedKey]);
            }
        }
        return outputString;
    }

    function updateTranslations(recordObject, standardValues, commonLanguagesMap, enUSObject) {
        var languageLine, currentLangValue;
        var standardKey = enUSObject.id;
        for (var language in commonLanguagesMap) {
            languageLine = commonLanguagesMap[language]['line'];
            currentLangValue = standardValues[language][standardKey];

            if (language !== 'en_US' && currentLangValue !== enUSObject.value) {
                var currentValue = recordObject.getSublistValue({
                    sublistId: 'translations',
                    fieldId: 'label',
                    line: languageLine
                });
                log.debug('difflangtrans', replaceSpecialHTMLCharacters(currentLangValue))
                if(!currentValue) {
                    recordObject.setSublistValue({
                        sublistId: 'translations',
                        fieldId: 'label',
                        line: languageLine,
                        value: replaceSpecialHTMLCharacters(currentLangValue)
                    });
                }
            }
        }
        return recordObject.save();
    }

    function createRecord(recordType, standardValues, commonLanguagesMap, enUSObject) {
        var recordObject = record.create({
            type: recordType,
        });
        recordObject.setValue({
            fieldId: 'name',
            value: replaceSpecialHTMLCharacters(enUSObject['value'])
        });
        return updateTranslations(recordObject, standardValues, commonLanguagesMap, enUSObject);
    }
	  function getStandardLabelAndMessage(commonLanguagesMap, configPath, applicationName, referenceFileName) {
          var langFilePath, jsonContent
          var applicationLanguages = Object.keys(commonLanguagesMap);
          if (applicationLanguages.indexOf('en_US') === -1) {
              applicationLanguages.push('en_US');
          }
          var standardMap = {
              labelsList: {},
              messagesList: {}
          };
          for (var i = 0; i < applicationLanguages.length; i++) {
              var language = applicationLanguages[i];
              configPath = resolveRelativePath(applicationName, configPath, referenceFileName);
              langFilePath = getLanguageFilePath(configPath, language, applicationName);
              jsonContent = getConfigJSON(langFilePath);
              standardMap['labelsList'][language] = jsonContent[applicationName][language]['labelsList'];
              standardMap['messagesList'][language] = jsonContent[applicationName][language]['messagesList'];
          }
          return standardMap;
      }
	  function getFileCabinetPath(fileName) {
          var fileId = getReferenceFileId(fileName)
          var fileObj = file.load({id: fileId})
          var filePath = fileObj.path
          return filePath.replace(fileName, '')
      }

      /**
       * Takes the name of a file and returns the file id
       */
      function getReferenceFileId(fileName) {
          var fileId
          var fileSearchObj = search.create({
              type: "file",
              filters:
                  [
                      ["name", "is", fileName]
                  ],
              columns:
                  [
                      search.createColumn({name: "internalid"})
                  ]
          })
          var fileSearchResult = fileSearchObj.run().getRange({start: 0, end: 1})
          fileId = fileSearchResult[0].getValue({
                  name: "internalid"
              })
          return fileId
      }
	  function getLanguageFilePath (path, language, appName) {
          var pathArr = path.split("/")
          var fileName = pathArr.pop()
          var langFileName = language + "_" + appName + "_" + fileName
          pathArr.push(langFileName)
          var langFilePath = pathArr.join("/")
          return langFilePath
      }
	  function resolveRelativePath (appName, configPath, referenceFileName) {
          var completePath = '';
          if(configPath.indexOf('~') > -1) {
              var relativePath = referenceFileName && getFileCabinetPath(referenceFileName);
              if(!relativePath) {
                  log.error({
                      title: 'Relative path cannot be resolved.',
                      details: 'The reference file has not been generated for the following application: ' + appName
                  });
                  throw 'The reference file has not been generated for the following application: ' + appName
              } else {
                  completePath = configPath.replace('~/', relativePath);
              }
          } else {
              completePath = configPath;
          }
          return completePath;
      }
	
	 function getApplicationLanguages(applicationName) {
        
             var en_US_filePath = 'SuiteBundles/Bundle 227319/src/Config/en_US_NSWMS_appConfig.js';
             var configJSON = getConfigJSON(en_US_filePath);
             var languageList = configJSON[applicationName]['en_US']['defaults']['translationLanguages'];
             return languageList;
     }
	 function getCommonLanguages(applicationLanguages) {
         var commonLanguages = {};
         var userAccountLanguages = getAccountLanguages();
         var accountLanguages = Object.keys(userAccountLanguages);
         for (var i = 0; i < applicationLanguages.length; i++) {
             for (var j = 0; j < accountLanguages.length; j++) {
                 if (applicationLanguages[i] === accountLanguages[j]) {
                     commonLanguages[applicationLanguages[i]] = userAccountLanguages[applicationLanguages[i]];
                 }
             }
         }
         return commonLanguages;
     }
	  function getAccountLanguages() {
          var labelRecord = record.create({
              type: 'customrecord_mobile_labels',
              isDynamic: true
          });

          var languageCount = labelRecord.getLineCount({
              sublistId: 'translations'
          });
          var languageMap = {};
          for (var i = 0; i < languageCount; i++) {
              var obj = {};
              var locale = labelRecord.getSublistValue({
                  sublistId: 'translations',
                  fieldId: 'locale',
                  line: i
              });
              var language = labelRecord.getSublistValue({
                  sublistId: 'translations',
                  fieldId: 'language',
                  line: i
              });
              obj['line'] = parseInt(i);
              obj['language'] = language;
              obj['locale'] = locale;
              languageMap[locale] = obj;
          }
          return languageMap;
      }
	 function getConfigJSON(filePath) {
         var fileObj = file.load({
             id: filePath
         });
         return JSON.parse(fileObj.getContents());
     }


	return {
		execute: execute
	};

});
