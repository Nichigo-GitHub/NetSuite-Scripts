/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/search', './wms_utility', './wms_translator', 'N/record', 'N/runtime', 'N/task', './wms_inboundUtility', './wms_inbound_utility', 'N/query'],
  /**
   * @param {search} search
   */
  function (search, utility, translator, record, runtime, task, inboundUtility, inboundLib, query) {

    /**
     * This function is to fetch the valid orders to postitemreceipt
     */
    function doPost(requestBody) {

      var transactionType = '';
      var warehouseLocationId = '';
      var transactionName = '';
      var transactionInternalId = '';
      var postItemReceiptResponse = {};
      var openTaskIdarray = [];
      var impactedRecords = {};
      var kitDetailsforRMA = {};
      var kitOTResults = {};
      var kitIRPostObj = {};
      var RMAkitIterator = 0;
      var itemIterator = 0;
      var targetSubsidiary = '';
      var warehouseLocationName = '';
      var drNumber = '',
        mrrNumber = '',
        preparedBy = '',
        inspectedBy = '';
      var date = null;
      var invoiceno = '';
      var truck_number = '';
      var start_time = '';
      var time_received = '';

      try {
        if (utility.isValueValid(requestBody)) {

          var requestParams = requestBody.params;
          log.debug('Reqparams', requestParams);

          transactionType = requestParams.transactionType;
          warehouseLocationId = requestParams.warehouseLocationId;
          transactionName = requestParams.transactionName;
          transactionInternalId = requestParams.transactionInternalId;
          warehouseLocationName = requestParams.warehouseLocationName;
          drNumber = requestParams.drnumber;
          mrrNumber = requestParams.mrrnumber;
          date = requestParams.date;
          
          preparedBy = requestParams.preparedBy;
          inspectedBy = requestParams.inspectedBy;
          invoiceno = requestParams.invoiceno;
          start_time = requestParams.start_time;
          truck_number = requestParams.truck_number;
          time_received = requestParams.time_received;

          var itemReceiptId = '';

          if (utility.isValueValid(warehouseLocationId) && utility.isValueValid(transactionInternalId) && utility.isValueValid(transactionName) &&
            utility.isValueValid(transactionType)) {
            var centralizesPurchasingandBilling = utility.isCentralizedPurchasingandBillingFeatureEnabled();
            var systemRule = utility.getSystemRuleValueWithProcessType('Manually post item receipts?', warehouseLocationId, transactionType);

            if (systemRule == 'Y') {
              var PORec = inboundUtility.getOrderStatus(transactionInternalId, transactionName, transactionType, warehouseLocationName, centralizesPurchasingandBilling);

              if (PORec.length > 0) {
                var poStatus = PORec[0]['statusref'];
                var poToLocationID = PORec[0]['location'];
                targetSubsidiary = PORec[0]['targetsubsidiary'];

                log.debug({
                  title: 'targetSubsidiary',
                  details: targetSubsidiary
                });

                if (poToLocationID == null || poToLocationID == '') {
                  poToLocationID = warehouseLocationId;
                }
                if (poStatus == 'pendingReceipt' || poStatus == 'partiallyReceived' || poStatus == 'pendingRefundPartReceived' ||
                  poStatus == 'pendingBillPartReceived' || poStatus == 'pendingReceiptPartFulfilled' ||
                  poStatus == 'Pending Refund/Partially Received') {
                  var isMapReduceScriptInvoked = 'F';
                  var useitemcostflag = '';
                  if (transactionType == "transferorder") {
                    var transferordervalues = record.load({
                      type: 'transferorder',
                      id: transactionInternalId
                    });
                    useitemcostflag = transferordervalues.getValue({
                      fieldId: 'useitemcostastransfercost'
                    });
                    if ((useitemcostflag == null || useitemcostflag == '' || useitemcostflag == 'null') &&
                      useitemcostflag != false && useitemcostflag != true) {
                      var itemcostruleValue = inboundUtility.getItemCostRuleValue();
                      useitemcostflag = itemcostruleValue;
                    }
                  }

                  if (transactionType == "transferorder" && useitemcostflag == true) {
                    var opentaskSearchResults = inboundUtility.getOTResultsforIRPosting(transactionInternalId, '', '', '', warehouseLocationId);

                    if (opentaskSearchResults.length > 50) {
                      var schstatus = task.create({
                        taskType: task.TaskType.MAP_REDUCE
                      });
                      schstatus.scriptId = 'customscript_wms_mr_postitemreceipt';
                      schstatus.deploymentId = 'customdeploy_wms_mr_postitemreceipt';
                      schstatus.params = {
                        "custscript_wmsse_mr_ordername": transactionName,
                        "custscript_wmsse_mr_trantype": transactionType,
                        "custscript_wmsse_mr_orderid": transactionInternalId,
                        "custscript_wmsse_mr_location": warehouseLocationId
                      };

                      schstatus.submit();
                      isMapReduceScriptInvoked = 'T';
                      var currentUserId = runtime.getCurrentUser().id;
                      utility.updateScheduleScriptStatus('post item receipt Mapreduce', currentUserId, 'Submitted',
                        transactionInternalId, transactionType);

                    }
                    if (opentaskSearchResults.length > 0 && isMapReduceScriptInvoked == 'F') {
                      itemReceiptId = inboundLib.consolidatePostItemReceiptforTO(transactionInternalId, warehouseLocationId,
                        opentaskSearchResults);
                      if (itemReceiptId != null && itemReceiptId != '') {
                        postItemReceiptResponse['itemteceiptId'] = itemReceiptId;
                        postItemReceiptResponse['transactionName'] = transactionName;
                        postItemReceiptResponse['isValid'] = true;
                        for (var openTask = 0; openTask < opentaskSearchResults.length; openTask++) {
                          openTaskIdarray.push(parseInt(opentaskSearchResults[openTask].id));
                        }
                      } else {
                        postItemReceiptResponse['errorMessage'] = translator.getTranslationString('ITEMRECEIPT_FAILED');
                        postItemReceiptResponse['isValid'] = false;

                      }
                    } else if (isMapReduceScriptInvoked == 'T') {
                      postItemReceiptResponse['isMapReduceScriptInvoked'] = isMapReduceScriptInvoked;
                      postItemReceiptResponse['errorMessage'] = translator.getTranslationString('POSTITEMRECEIPT_SCHEDSCRIPT_INITIATED');
                      postItemReceiptResponse['isValid'] = true;
                    }
                  } else {
                    if (transactionType == 'returnauthorization') {
                      kitOTResults = inboundLib.getKitOTResultsforIRPosting(transactionInternalId, '', warehouseLocationId);
                      kitDetailsforRMA = inboundLib.getKitDetailsforRMA(transactionInternalId);

                      var objPostIrValues = {};
                      objPostIrValues.transactionInternalId = transactionInternalId;
                      objPostIrValues.tranid = transactionName;
                      objPostIrValues.whLocation = warehouseLocationId;
                      objPostIrValues.transactionType = transactionType;
                      kitIRPostObj = inboundLib.matchKitComponentsQty(kitOTResults, kitDetailsforRMA, objPostIrValues, impactedRecords);
                    }

                    var opentaskSearchResults = inboundUtility.getOTResultsforIRPosting(transactionInternalId, '', '', '', warehouseLocationId);

                    if (opentaskSearchResults.length > 50) {
                      var schstatus = task.create({
                        taskType: task.TaskType.MAP_REDUCE
                      });
                      schstatus.scriptId = 'customscript_wms_mr_postitemreceipt';
                      schstatus.deploymentId = null;
                      schstatus.params = {
                        "custscript_wmsse_mr_ordername": transactionName,
                        "custscript_wmsse_mr_trantype": transactionType,
                        "custscript_wmsse_mr_orderid": transactionInternalId,
                        "custscript_wmsse_mr_location": warehouseLocationId,
                        "custscript_wmsse_mr_targetsubsidiary": targetSubsidiary
                      };

                      schstatus.submit();
                      isMapReduceScriptInvoked = 'T';
                      var currentUserId = runtime.getCurrentUser().id;
                      utility.updateScheduleScriptStatus('post item receipt Mapreduce', currentUserId, 'Submitted',
                        transactionInternalId, transactionType);

                    }
                    if (opentaskSearchResults.length > 0 && isMapReduceScriptInvoked == 'F') {

                      var recordType = record.Type.PURCHASE_ORDER;
                      if (transactionType == 'returnauthorization')
                        recordType = record.Type.RETURN_AUTHORIZATION;
                      else if (transactionType == 'transferorder')
                        recordType = record.Type.TRANSFER_ORDER;
                      var trecord = null;

                      if (transactionType == 'returnauthorization') {
                        var crossSubsidiaryFeature = utility.isIntercompanyCrossSubsidiaryFeatureEnabled();

                        if (crossSubsidiaryFeature) {
                          var locationSubsidiary = utility.getSubsidiaryforLocation(warehouseLocationId)

                          trecord = record.transform({
                            fromType: record.Type.RETURN_AUTHORIZATION,
                            fromId: transactionInternalId,
                            toType: record.Type.ITEM_RECEIPT,
                            defaultValues: {
                              orderinvtsub: locationSubsidiary
                            },
                            isDynamic: false
                          });
                        } else {
                          trecord = record.transform({
                            fromType: recordType,
                            fromId: transactionInternalId,
                            toType: record.Type.ITEM_RECEIPT,
                            isDynamic: false
                          });
                        }
                      } else {

                        if (centralizesPurchasingandBilling == true) {
                          log.debug({
                            title: 'targetSubsidiary',
                            details: targetSubsidiary
                          });
                          if (targetSubsidiary == null || targetSubsidiary == '' || targetSubsidiary == undefined || targetSubsidiary == 'undefined') {
                            targetSubsidiary = -1;
                          }
                          trecord = record.transform({
                            fromType: recordType,
                            fromId: transactionInternalId,
                            toType: record.Type.ITEM_RECEIPT,
                            defaultValues: {
                              targetsub: targetSubsidiary
                            },
                            isDynamic: false
                          });
                        } else {
                          trecord = record.transform({
                            fromType: recordType,
                            fromId: transactionInternalId,
                            toType: record.Type.ITEM_RECEIPT,
                            isDynamic: false
                          });

                        }

                      }

                      var prossedLinesArr = [];
                      var actQuantity = '';
                      var itemId = '';
                      var batchNo = '';
                      var expiryDate = '';
                      var serialArray = '';
                      var isKitComponent = false;
                      var irUpdateOpenTaskId = [];
                      var splitOpenTaskId = {};
                      var parentItem = '';
                      for (var otItr = 0; otItr < opentaskSearchResults.length; otItr++) {

                        var linenum = opentaskSearchResults[otItr]['custrecord_wmsse_line_no'];
                        openTaskIdarray.push(parseInt(opentaskSearchResults[otItr].id));
                        if (prossedLinesArr.indexOf(linenum) == -1) {
                          prossedLinesArr.push(linenum);
                          actQuantity = opentaskSearchResults[otItr].custrecord_wmsse_act_qty;
                          itemId = opentaskSearchResults[otItr].custrecord_wmsse_sku;
                          batchNo = opentaskSearchResults[otItr].custrecord_wmsse_batch_num;
                          expiryDate = opentaskSearchResults[otItr].custrecord_wmsse_expirydate;
                          enterBin = opentaskSearchResults[otItr].custrecord_wmsse_actendloc;
                          serialArray = opentaskSearchResults[otItr].custrecord_wmsse_serial_no;
                          isKitComponent = opentaskSearchResults[otItr].custrecord_wmsse_kitflag;
                          parentItem = opentaskSearchResults[otItr].custrecord_wmsse_parent_sku_no;
                          if (transactionType == 'returnauthorization' && (isKitComponent === true || utility.isValueValid(kitDetailsforRMA[itemId]))) {
                            if (utility.isValueValid(kitIRPostObj[parentItem]) && kitIRPostObj[parentItem] > 0) {
                              inboundLib.updateItemReceiptDetailsForRMAKit(trecord, opentaskSearchResults[otItr], opentaskSearchResults,
                                warehouseLocationId, transactionInternalId, kitDetailsforRMA, kitIRPostObj, irUpdateOpenTaskId, splitOpenTaskId);
                              RMAkitIterator++;
                            }
                          } else {
                            inboundLib.consolidatePostItemReceipt(trecord, actQuantity, linenum, itemId, transactionType, batchNo, expiryDate,
                              warehouseLocationId, enterBin, serialArray, opentaskSearchResults, transactionInternalId, otItr);
                            itemIterator++;
                          }

                        }
                      }

                      if (trecord != null && trecord != '') {

                        trecord.setValue('custbody19', mrrNumber);

                        trecord.setValue('custbody28', drNumber);

                        trecord.setValue('custbody29', invoiceno);

                        trecord.setValue('custbody387', truck_number);

                        trecord.setValue('memo', 'ST: ' + start_time + ' ET: ' + time_received);

                        // Search for employees with 'entityid' containing 'preparedBy'
                        var employeeSearchResults = search.load({
                          id: 'customsearch_kppi_employee'
                        });

                        var employeeSearchFilters = employeeSearchResults.filters;

                        employeeSearchFilters.push(search.createFilter({
                          name: 'entityid',
                          operator: search.Operator.CONTAINS,
                          values: preparedBy
                        }));

                        employeeSearchResults.filters = employeeSearchFilters;
                        var empSearchResultsvalues = employeeSearchResults.run().getRange({
                          start: 0,
                          end: 1000
                        });

                        trecord.setValue('custbody1', empSearchResultsvalues[0] ? empSearchResultsvalues[0].id : null);

                        // Search for employees with 'entityid' containing 'inspectedBy'
                        employeeSearchResults = search.load({
                          id: 'customsearch_kppi_employee'
                        });

                        employeeSearchFilters = employeeSearchResults.filters;

                        employeeSearchFilters.push(search.createFilter({
                          name: 'entityid',
                          operator: search.Operator.CONTAINS,
                          values: inspectedBy
                        }));

                        employeeSearchResults.filters = employeeSearchFilters;
                        empSearchResultsvalues = employeeSearchResults.run().getRange({
                          start: 0,
                          end: 1000
                        });

                        trecord.setValue('custbody2', empSearchResultsvalues[0] ? empSearchResultsvalues[0].id : null);

                        var date_digits = date.value.split('/');

                        var new_date = date_digits[1] + '/' + date_digits[0] + '/' + date_digits[2];

                        log.debug('new_date', new_date);

                        trecord.setValue('trandate', new Date(Date.parse(new_date)));

                        var queryResult = query.runSuiteQL({
                          query: "select id from CUSTOMRECORD178 where custrecord167 like '" + date.value + "'",
                        });

                        var forexId = queryResult.results[0].values[0];

                        log.debug('Query Result', queryResult.results[0].values[0]);

                        trecord.setValue('custbody104', forexId);

                        log.debug('Date', date.value);

                        itemReceiptId = trecord.save();

                        postItemReceiptResponse['transactionName'] = transactionName;

                      }
                      if (itemReceiptId != null && itemReceiptId != '') {
                        var opentaskId = '';
                        var isKitComponentFlag = false;
                        for (var j = 0; j < opentaskSearchResults.length; j++) {
                          opentaskId = opentaskSearchResults[j].id;
                          isKitComponentFlag = opentaskSearchResults[j].custrecord_wmsse_kitflag;
                          if (!isKitComponentFlag) {
                            record.submitFields({
                              type: 'customrecord_wmsse_trn_opentask',
                              id: opentaskId,
                              values: {
                                'custrecord_wmsse_nsconfirm_ref_no': itemReceiptId,
                                'name': opentaskId
                              }
                            });
                          }
                        }

                        var ir_record = record.load({
                          type: record.Type.ITEM_RECEIPT,
                          id: itemReceiptId,
                          isDynamic: true,
                        });

                        var ir_tranid = ir_record.getValue('tranid');


                        log.debug({
                          title: 'transactionName',
                          details: transactionName
                        });
                        postItemReceiptResponse['transactionName'] = transactionName;
                        postItemReceiptResponse['itemteceiptId'] = itemReceiptId;
                        postItemReceiptResponse['isValid'] = true;
                        postItemReceiptResponse['itemteceiptReferenceNumber'] = ir_tranid;
                        if (transactionType == 'returnauthorization') {

                          inboundLib.updateorCloneOpenTask(itemReceiptId, irUpdateOpenTaskId, splitOpenTaskId);

                        }
                      } else {
                        postItemReceiptResponse['errorMessage'] = translator.getTranslationString('ITEMRECEIPT_FAILED');
                        postItemReceiptResponse['isValid'] = false;

                      }
                    } else if (isMapReduceScriptInvoked == 'T') {
                      postItemReceiptResponse['isMapReduceScriptInvoked'] = isMapReduceScriptInvoked;
                      postItemReceiptResponse['errorMessage'] = translator.getTranslationString('POSTITEMRECEIPT_SCHEDSCRIPT_INITIATED');
                      postItemReceiptResponse['isValid'] = true;

                    } else {
                      if (transactionType == 'purchaseorder') {
                        postItemReceiptResponse['errorMessage'] = translator.getTranslationString('PO_POSTITEMRECEIPT_NOMATCHING_OPEN_PUTAWAY');
                        postItemReceiptResponse['isValid'] = false;

                      } else if (transactionType == 'returnauthorization') {
                        postItemReceiptResponse['errorMessage'] = translator.getTranslationString('RMA_POSTITEMRECEIPT_NOMATCHING_OPEN_PUTAWAY');
                        postItemReceiptResponse['isValid'] = false;

                      }

                    }

                  }
                  var itemReceipt = {
                    'itemreceiptid': itemReceiptId
                  };
                  impactedRecords = inboundUtility.noCodeSolForReceiving(transactionInternalId, '', itemReceipt, transactionType, openTaskIdarray, false);
                  log.debug({
                    title: 'impactedRecords :',
                    details: impactedRecords
                  });
                  postItemReceiptResponse.impactedRecords = impactedRecords;
                } else {
                  postItemReceiptResponse['errorMessage'] = translator.getTranslationString('ITEMRECEIPTPOSTING_DATA_NOMATCH');
                  postItemReceiptResponse['isValid'] = false;

                }
              } else {
                postItemReceiptResponse['errorMessage'] = translator.getTranslationString('ITEMRECEIPTPOSTING_DATA_NOMATCH');
                postItemReceiptResponse['isValid'] = false;

              }
            } else {
              postItemReceiptResponse['errorMessage'] = translator.getTranslationString('MANNUALITEMRECEIPTPOSTING_SYSTEMRULE_NOT_CONFIGURED');
              postItemReceiptResponse['isValid'] = false;

            }
          } else {

            postItemReceiptResponse['errorMessage'] = translator.getTranslationString('ITEMRECEIPTPOSTING_DATA_NOMATCH');
            postItemReceiptResponse['isValid'] = false;

          }
        } else {
          postItemReceiptResponse['errorMessage'] = translator.getTranslationString('ITEMRECEIPTPOSTING_DATA_NOMATCH');
          postItemReceiptResponse['isValid'] = false;

        }

        return postItemReceiptResponse;

      } catch (e) {
        var orderList = {};
        orderList['isValid'] = false;
        orderList['errorMessage'] = e.message;
        log.error({
          title: 'errorMessage',
          details: e.message + " Stack :" + e.stack
        });
        if (transactionType == 'returnauthorization' && utility.getObjectLength(kitIRPostObj)) {
          if (RMAkitIterator == 0 && itemIterator == 0) {
            orderList.errorMessage = translator.getTranslationString('ITEMRECEIPT_FAILED');
            orderList.isValid = false;
          }
        }

        return orderList;
      }
    }


    return {
      'post': doPost
    };
  });