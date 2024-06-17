/**
 *    Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope public
 */

define(['N/runtime','./wms_translator','N/search'], function (runtime,translator,search) {
        /**
         * Function definition to be triggered before record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */

        function beforeSubmit(scriptContext) {
            log.debug({title:"scriptContext",details:scriptContext});
            log.debug({title:"runtime.executionContext",details:runtime.executionContext});
          if(runtime.executionContext == "USERINTERFACE" || runtime.executionContext == "userinterface"
              || runtime.executionContext == "USEREVENT" || runtime.executionContext == "userevent") {
              if(scriptContext.type === scriptContext.UserEventType.DELETE ||
               scriptContext.type === scriptContext.UserEventType.EDIT || 
               scriptContext.type === scriptContext.UserEventType.XEDIT) {
                  var newRecordObj = scriptContext.oldRecord;
                  var type = newRecordObj.type;
                  var name = newRecordObj.getValue('name');
                  log.debug({title:"newRecordObj",details:newRecordObj});
                  log.debug({title:"type",details:type});
                  log.debug({title:"name",details:name});
                  if(type == "customrecord_wmsse_label_template"){
                      if(name == "" || name == "null" || name == null || name == undefined){
                          var id= newRecordObj.id;

                          if(id != "" && id != "null" && id != null && id != undefined){
                            var standardLabelIDArr =  getStandardLabelTemplateID();
                            if(standardLabelIDArr.length > 0){
                                if(standardLabelIDArr.indexOf(id) != -1){
                                   throw translator.getTranslationString('STANDARD_RECORD_EDIT_DELETE_ERROR');
                                }
                            }
                          }
                      }
                      else {
                          if (name == "ADDRESSLABEL" || name == "COMPOSITEPALLETLABEL" || name == "ITEMLABEL"
                              || name == "PALLETLABEL" || name == "UCCLABEL") {
                              var errMsg = translator.getTranslationString('STANDARD_RECORD_EDIT_DELETE_ERROR');
                              throw errMsg;
                          }
                      }

                  }else{
                      throw translator.getTranslationString('STANDARD_RECORD_EDIT_DELETE_ERROR');
                  }


            }
          }
        }
              function getStandardLabelTemplateID(){
                  var labelTemplateSrch = search.create({
                      type: 'customrecord_wmsse_label_template',
                      columns: [{name: 'name'},
                          {name: 'internalid'}]

                  });

                  var searchResult = [];
                  var search_page_count = 1000;
                  var myPageData = labelTemplateSrch.runPaged({
                      pageSize: search_page_count
                  });
                  myPageData.pageRanges.forEach(function (pageRange) {
                      var myPage = myPageData.fetch({
                          index: pageRange.index
                      });

                      myPage.data.forEach(function (result) {
                          var lblName = result.getValue({name: "name"});
                          if (lblName == "ADDRESSLABEL" || lblName == "COMPOSITEPALLETLABEL" || lblName == "ITEMLABEL"
                              || lblName == "PALLETLABEL" || lblName == "UCCLABEL") {
                              var idVal = parseInt(result.id);
                              searchResult.push(idVal);
                          }

                      });
                  });
                  return searchResult;
              }
        return {
            beforeSubmit: beforeSubmit
        };
    });

