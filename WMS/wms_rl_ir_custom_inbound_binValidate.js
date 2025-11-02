/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define([
  "N/search",
  "N/config",
  "./wms_utility",
  "./big",
  "./wms_translator",
  "./wms_inboundUtility",
  "./wms_inbound_utility",
  "N/record",
  "N/runtime",
  "N/task",
], /**
 * @param {search} search
 */
  function (
    search,
    config,
    utility,
    Big,
    translator,
    inboundUtility,
    inboundLib,
    record,
    runtime,
    task
  ) {
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doPost(requestBody) {
      var transactionType = "";
      var whLocation = "";
      var orderInternalId = "";
      var tranid = "";
      var fetchedItemId = "";
      var orderLineNo = "";
      var enterBin = "";
      var preferBin = "";
      var enterQty = "";
      var invtStatus = "";
      var lotno = "";
      var lotExpiryDate = "";
      var uom = "";
      var conversionRate = "";
      var actualBeginTime = "";
      var customer = "";
      var remQty = "";
      var binValidateDetails = {};
      var debugString = "";
      var strBarCode = "";
      var inforeceivedQuantity = "";
      var inforemainingQuantity = "";
      var binLocType = "";
      var binIsCart = "";
      var stgTypeArr = [];
      var binSearchFilters = [];
      var binInternalId = "";
      var targetLocation = "";
      var targetSubsidiary = "";

      try {
        if (utility.isValueValid(requestBody)) {
          log.debug("requestBody.params", requestBody.params);
          var requestParams = requestBody.params;
          transactionType = requestParams.transactionType;
          whLocation = requestParams.warehouseLocationId;
          orderInternalId = requestParams.transactionInternalId;
          tranid = requestParams.transactionName;
          fetchedItemId = requestParams.itemInternalId;
          orderLineNo = requestParams.transactionLineNo;
          enterBin = requestParams.binName;
          preferBin = requestParams.preferedBinName;
          enterQty = requestParams.scannedQuantity;
          invtStatus = requestParams.statusInternalId;
          var useitemcostflag = "F";
          lotno = requestParams.lotName;
          lotExpiryDate = requestParams.lotExpiryDate;
          uom = requestParams.stockUnitName;
          conversionRate = requestParams.stockConversionRate;
          actualBeginTime = requestParams.actualBeginTime;
          customer = requestParams.customerId;
          remQty = requestParams.remainingQuantity;
          strBarCode = requestParams.strBarCode;
          inforeceivedQuantity = requestParams.inforeceivedQuantity;
          inforemainingQuantity = requestParams.inforemainingQuantity;
          var isTallyScanRequired = requestParams.isTallyScanRequired;
          var tallyLoopObj = requestParams.tallyLoopObj;
          var locUseBinsFlag = requestParams.locUseBinsFlag;
          var isKitComponent = requestParams.isKitComponent;
          var parentItem = requestParams.parentItem;
          var parentItemLine = requestParams.parentItemLine;
          var vendorId = requestParams.vendorId;
          var fetcheditemname = requestParams.fetcheditemname;
          var warehouseLocationName = requestParams.warehouseLocationName;
          targetLocation = requestParams.targetlocation;
          targetSubsidiary = requestParams.targetsubsidiary;
          var randomTallyScanRule = requestParams.randomTallyScan;
          var crossSubsidiaryFeature =
            utility.isIntercompanyCrossSubsidiaryFeatureEnabled();
          var centralizesPurchasingandBilling =
            utility.isCentralizedPurchasingandBillingFeatureEnabled();

          if (utility.isValueValid(requestParams.restock)) {
            var restock = requestParams.restock;
          }

          if (
            utility.isValueValid(whLocation) &&
            utility.isValueValid(orderInternalId) &&
            utility.isValueValid(tranid) &&
            utility.isValueValid(fetchedItemId) &&
            utility.isValueValid(orderLineNo)
          ) {
            var itemSearchResults = this.getItemCustomDetails(
              fetchedItemId,
              whLocation
            );
            debugString =
              debugString + ",itemSearchResults :" + itemSearchResults;
            log.debug("itemSearchResults", itemSearchResults);
            var blnMixItem = false;
            var blnMixLot = false;
            if (itemSearchResults.length == 0) {
              binValidateDetails.errorMessage = translator.getTranslationString(
                "PO_QUANTITYVALIDATE.INACTIVE_ITEM"
              );
              binValidateDetails.isValid = false;
            } else {
              var itemSearchObjRes = null;
              var itemInvtLoc = "";
              var itemSearchObj = itemSearchResults[0];
              var isPreferBin = false;
              preferBin = "";
              for (var locRec in itemSearchResults) {
                itemSearchObjRes = itemSearchResults[locRec];
                itemInvtLoc = itemSearchObjRes.location;
                isPreferBin = itemSearchObjRes.preferredbin;
                if (itemInvtLoc == whLocation && isPreferBin == true) {
                  preferBin = itemSearchObjRes["binnumber"];
                  break;
                }
              }

              debugString = debugString + ",itemSearchObj :" + itemSearchObj;
              blnMixItem = itemSearchObj.custitem_wmsse_mix_item;
              blnMixLot = itemSearchObj.custitem_wmsse_mix_lot;

              log.debug("blnMixItem", blnMixItem);
              log.debug("blnMixLot", itemSearchObj.custitem_wmsse_mix_lot);

              if (!utility.isValueValid(conversionRate)) {
                if (utility.isValueValid(itemSearchResults[0]["unitstype"]))
                  conversionRate = utility.getStockCoversionRate(
                    itemSearchResults[0]["unitstype"],
                    uom,
                    "1"
                  );
              }

              if (
                !utility.isValueValid(enterBin) &&
                utility.isValueValid(preferBin)
              ) {
                enterBin = preferBin;
              }
              if (utility.isValueValid(enterBin)) {
                //var systemRule=utility.getSystemRuleValue('Stage received items before putting away?',whLocation);
                var systemRule = utility.getSystemRuleValueWithProcessType(
                  "Stage received items before putting away?",
                  whLocation,
                  transactionType
                );
                debugString = debugString + ",systemRule :" + systemRule;
                var stageLocArr = [];
                var BinlocationSearch = search.create({
                  type: "customlist_wmsse_bin_loc_type",
                  columns: [
                    {
                      name: "name",
                    },
                  ],
                });
                var BinlocationTypes = BinlocationSearch.run().getRange({
                  start: 0,
                  end: 1000,
                });
                var itemType = itemSearchObj.recordType;
                debugString = debugString + ",itemType :" + itemType;
                var boolMixItemRulesStaisfied = true;
                var tempflag = true;
                if (
                  (itemType != "noninventoryitem" &&
                    itemType != "otherchargeitem" &&
                    itemType != "serviceitem" &&
                    itemType != "downloaditem" &&
                    itemType != "giftcertificateitem") ||
                  randomTallyScanRule == "T"
                ) {
                  if (systemRule == "N") {
                    if (preferBin != enterBin) {
                      if (
                        BinlocationTypes != null &&
                        BinlocationTypes != "" &&
                        BinlocationTypes.length > 0
                      ) {
                        stgTypeArr.push("Stage");
                        stgTypeArr.push("WIP");
                        stageLocArr = utility.getStageLocations(
                          stgTypeArr,
                          BinlocationTypes
                        );
                      }
                      if (utility.isValueValid(enterBin)) {
                        binSearchFilters.push(
                          search.createFilter({
                            name: "binnumber",
                            operator: search.Operator.IS,
                            values: enterBin,
                          })
                        );
                      }
                      binSearchFilters.push(
                        search.createFilter({
                          name: "inactive",
                          operator: search.Operator.IS,
                          values: false,
                        })
                      );
                      if (utility.isValueValid(whLocation)) {
                        binSearchFilters.push(
                          search.createFilter({
                            name: "location",
                            operator: search.Operator.ANYOF,
                            values: whLocation,
                          })
                        );
                      }

                      if (stageLocArr.length > 0) {
                        var stgBinId = utility.getBinInternalId(
                          enterBin,
                          whLocation
                        );
                        var binLookUp = null;
                        if (utility.isValueValid(stgBinId)) {
                          binLookUp = search.lookupFields({
                            type: search.Type.BIN,
                            id: stgBinId,
                            columns: [
                              "custrecord_wms_iscart",
                              "custrecord_wmsse_bin_loc_type",
                            ],
                          });
                        }

                        if (
                          utility.isValueValid(binLookUp) &&
                          utility.isValueValid(binLookUp.custrecord_wms_iscart) &&
                          binLookUp.custrecord_wms_iscart == true
                        ) {
                          binSearchFilters.push(
                            search.createFilter({
                              name: "custrecord_wmsse_bin_loc_type",
                              operator: search.Operator.ANYOF,
                              values: stageLocArr,
                            })
                          );

                          binLocType = "Stage";
                          binIsCart = binLookUp.custrecord_wms_iscart;
                        } else {
                          binSearchFilters.push(
                            search.createFilter({
                              name: "custrecord_wmsse_bin_loc_type",
                              operator: search.Operator.NONEOF,
                              values: stageLocArr,
                            })
                          );
                        }
                      }
                      var searchrecord = search.create({
                        type: "Bin",
                        filters: binSearchFilters,
                      });
                      var binSearchResults = searchrecord.run().getRange({
                        start: 0,
                        end: 1000,
                      });

                      if (utility.isValueValid(binSearchResults)) {
                        binInternalId = binSearchResults[0].id;
                      }

                      if (!utility.isValueValid(binInternalId)) {
                        binValidateDetails.errorMessage =
                          translator.getTranslationString(
                            "PO_QUANTITYVALIDATE.INVALID_BIN"
                          );
                        binValidateDetails.isValid = false;
                        tempflag = false;
                      }
                    } else {
                      binInternalId = utility.getBinInternalId(
                        enterBin,
                        whLocation
                      );
                      debugString =
                        debugString + ",binInternalId :" + binInternalId;
                    }

                    if (blnMixItem == false || blnMixLot == false) {
                      if (
                        enterBin != preferBin &&
                        binInternalId != "" &&
                        binInternalId != null
                      ) {
                        if (!blnMixItem) {
                          var objInvDetails = getItemInventoryDetails(
                            fetchedItemId,
                            whLocation,
                            binInternalId
                          );

                          if (objInvDetails != null && objInvDetails != "") {
                            if (objInvDetails.length > 0) {
                              binValidateDetails.errorMessage =
                                translator.getTranslationString(
                                  "PO_QUANTITYVALIDATE.MIXITEMS_FALSE"
                                );
                              binValidateDetails.isValid = false;
                              boolMixItemRulesStaisfied = false;
                              tempflag = false;
                            }
                          }
                        }
                        if (
                          !blnMixLot &&
                          (itemType ==
                            translator.getTranslationString("ITEMTYPE_LOT") ||
                            itemType ==
                            translator.getTranslationString(
                              "ITEMTYPE_LOT_ASSEMBLY"
                            ))
                        ) {
                          var objInvDetails = getLotItemInventoryDetails(
                            whLocation,
                            binInternalId,
                            lotno
                          );
                          if (objInvDetails != null && objInvDetails != "") {
                            if (objInvDetails.length > 0) {
                              binValidateDetails.errorMessage =
                                translator.getTranslationString(
                                  "PO_QUANTITYVALIDATE.MIXLOTS_FALSE"
                                );
                              binValidateDetails.isValid = false;
                              boolMixItemRulesStaisfied = false;
                              tempflag = false;
                            }
                          }
                        }
                      }
                    }
                  } //if stage system rule is 'Y'
                  else {
                    if (
                      BinlocationTypes != null &&
                      BinlocationTypes != "" &&
                      BinlocationTypes.length > 0
                    ) {
                      stgTypeArr.push("Stage");
                      stageLocArr = utility.getStageLocations(
                        stgTypeArr,
                        BinlocationTypes
                      );
                    }
                    var searchrecord = search.load({
                      id: "customsearch_wmsse_binnumbers_2",
                    });
                    binSearchFilters = searchrecord.filters;
                    if (enterBin != null && enterBin != "") {
                      binSearchFilters.push(
                        search.createFilter({
                          name: "custrecord_bin_code",
                          operator: search.Operator.IS,
                          values: enterBin,
                        })
                      );
                    }
                    binSearchFilters.push(
                      search.createFilter({
                        name: "inactive",
                        operator: search.Operator.IS,
                        values: false,
                      })
                    );
                    if (whLocation != null && whLocation != "") {
                      binSearchFilters.push(
                        search.createFilter({
                          name: "location",
                          operator: search.Operator.ANYOF,
                          values: whLocation,
                        })
                      );
                    }

                    searchrecord.filters = binSearchFilters;

                    var binSearchResults = searchrecord.run().getRange({
                      start: 0,
                      end: 1000,
                    });

                    debugString =
                      debugString + ",binSearchResults :" + binSearchResults;
                    if (binSearchResults != null && binSearchResults != "") {
                      if (
                        stageLocArr.indexOf(
                          binSearchResults[0].getValue({
                            name: "custrecord_wmsse_bin_loc_type",
                          })
                        ) == -1
                      ) {
                        binValidateDetails.errorMessage =
                          translator.getTranslationString(
                            "PO_QUANTITYVALIDATE.NOT_STAGEBIN"
                          );
                        binValidateDetails.isValid = false;
                        tempflag = false;
                      } else if (
                        binSearchResults[0].getValue({
                          name: "custrecord_wmsse_bin_stg_direction",
                        }) != 1
                      ) {
                        binValidateDetails.errorMessage =
                          translator.getTranslationString(
                            "PO_QUANTITYVALIDATE.INVALID_BIN_DIRECTION"
                          );
                        binValidateDetails.isValid = false;
                        tempflag = false;
                      } else {
                        binInternalId = binSearchResults[0].id;
                        binLocType = "Stage";
                        if (
                          utility.isValueValid(
                            binSearchResults[0].getValue({
                              name: "custrecord_wms_iscart",
                            })
                          ) &&
                          binSearchResults[0].getValue({
                            name: "custrecord_wms_iscart",
                          }) == true
                        ) {
                          binIsCart = binSearchResults[0].getValue({
                            name: "custrecord_wms_iscart",
                          });
                        }
                      }
                    }
                    if (binSearchResults == "" || binSearchResults == null) {
                      binValidateDetails.errorMessage =
                        translator.getTranslationString(
                          "PO_QUANTITYVALIDATE.INVALID_STAGEBIN"
                        );
                      binValidateDetails.isValid = false;
                      tempflag = false;
                    }
                  }
                }
                if (tempflag) {
                  if (!utility.isValueValid(locUseBinsFlag)) {
                    if (
                      utility.isValueValid(inforeceivedQuantity) &&
                      utility.isValueValid(inforemainingQuantity)
                    ) {
                      if (utility.isValueValid(uom)) {
                        var index = inforeceivedQuantity.indexOf(" ");
                        inforeceivedQuantity =
                          parseFloat(
                            inforeceivedQuantity
                              .toString()
                              .substring(0, index == -1 ? 1 : index)
                          ) + parseFloat(enterQty);
                        index = inforemainingQuantity.indexOf(" ");
                        inforemainingQuantity =
                          parseFloat(
                            inforemainingQuantity
                              .toString()
                              .substring(0, index == -1 ? 1 : index)
                          ) - parseFloat(enterQty);

                        inforeceivedQuantity =
                          inforeceivedQuantity == 0
                            ? "0"
                            : inforeceivedQuantity + " " + uom;
                        inforemainingQuantity =
                          inforemainingQuantity == 0
                            ? "0"
                            : inforemainingQuantity + " " + uom;
                      } else {
                        inforeceivedQuantity =
                          parseFloat(inforeceivedQuantity) + parseFloat(enterQty);
                        inforemainingQuantity =
                          parseFloat(inforemainingQuantity) -
                          parseFloat(enterQty);
                      }
                    }
                  }

                  binValidateDetails.inforeceivedQuantity = inforeceivedQuantity;
                  binValidateDetails.inforemainingQuantity =
                    inforemainingQuantity;

                  //this is stop the duplicate entry of open task record when deffered item receipt rule is set to 'Y'

                  var systemRuleValue = utility.getSystemRuleValueWithProcessType(
                    "Manually post item receipts?",
                    whLocation,
                    transactionType
                  );
                  //var tempflag =true;
                  if (systemRuleValue == "Y") {
                    var orderItemLineDetails =
                      inboundUtility.getRecevingOrderItemDetails(
                        tranid,
                        fetchedItemId,
                        whLocation,
                        orderLineNo,
                        null,
                        null,
                        transactionType,
                        crossSubsidiaryFeature,
                        centralizesPurchasingandBilling,
                        warehouseLocationName
                      );
                    log.debug("orderItemLineDetails", orderItemLineDetails);
                    if (orderItemLineDetails.length > 0) {
                      var orderLineDetailsRec = orderItemLineDetails[0];
                      var orderId = orderLineDetailsRec.internalid;
                      targetLocation = orderLineDetailsRec.targetlocation;
                      targetSubsidiary = orderLineDetailsRec.targetsubsidiary;
                      var openPutAwayDetails =
                        inboundUtility.getOpentaskOpenPutwayDetails(
                          orderId,
                          whLocation,
                          fetchedItemId,
                          orderLineNo
                        );
                      if (JSON.stringify(openPutAwayDetails) !== "{}") {
                        var openTaskRcvQty = openPutAwayDetails[orderLineNo];

                        if (utility.isValueValid(openTaskRcvQty)) {
                          var orderLineRemainingQty = 0;
                          var orderLineReceivedQty =
                            orderLineDetailsRec.totalReceivedQty;
                          if (transactionType == "returnauthorization")
                            orderLineRemainingQty =
                              orderLineDetailsRec.rmaRemainingQty;
                          else
                            orderLineRemainingQty =
                              orderLineDetailsRec.poRemainingQty;
                          orderLineDetailsRec.totalReceivedQty = Number(
                            Big(orderLineReceivedQty).plus(openTaskRcvQty)
                          );
                          orderLineDetailsRec.poRemainingQty = Number(
                            Big(orderLineRemainingQty).plus(openTaskRcvQty)
                          );
                        }
                      }
                      var orderRemQty = 0;
                      if (transactionType == "returnauthorization")
                        orderRemQty = orderLineDetailsRec.rmaRemainingQty;
                      else orderRemQty = orderLineDetailsRec.poRemainingQty;
                      if (parseFloat(orderRemQty) <= 0) {
                        tempflag = false;
                      }
                    } else {
                      tempflag = false;
                    }
                    if (!tempflag) {
                      binValidateDetails.errorMessage =
                        translator.getTranslationString(
                          "PO_QUANTITYVALIDATE.TRANSACTION_COMPLETED"
                        );
                      binValidateDetails.isValid = false;
                    }
                  }

                  debugString = debugString + ",binInternalId :" + binInternalId;
                  if (
                    itemType == "noninventoryitem" ||
                    itemType == "otherchargeitem" ||
                    itemType == "serviceitem" ||
                    itemType == "downloaditem" ||
                    itemType == "giftcertificateitem"
                  ) {
                    if (randomTallyScanRule != "T") {
                      binInternalId = "";
                    }
                  }
                  var itemReceipt = "";
                  if (isTallyScanRequired == true && randomTallyScanRule == "T") {
                    log.debug("aaaaa@@@@opentaskIdArr", systemRuleValue);

                    var opentaskIdArr = [];
                    for (var openTsk in tallyLoopObj) {
                      opentaskIdArr.push(tallyLoopObj[openTsk].openTaskId);
                    }
                    log.debug("opentaskIdArr", opentaskIdArr);
                    var trecord = null;
                    var opentaskSearchResults =
                      inboundUtility.getOTResultsforIRPosting(
                        orderInternalId,
                        "",
                        "",
                        "",
                        whLocation,
                        randomTallyScanRule
                      );
                    log.debug("opentaskSearchResults", opentaskSearchResults);
                    if (opentaskSearchResults.length > 0) {
                      if (systemRuleValue == "N") {
                        var recordType = record.Type.PURCHASE_ORDER;
                        if (transactionType == "returnauthorization") {
                          var crossSubsidiaryFeature =
                            utility.isIntercompanyCrossSubsidiaryFeatureEnabled();

                          if (crossSubsidiaryFeature) {
                            var locationSubsidiary =
                              utility.getSubsidiaryforLocation(
                                warehouseLocationId
                              );

                            trecord = record.transform({
                              fromType: record.Type.RETURN_AUTHORIZATION,
                              fromId: orderInternalId,
                              toType: record.Type.ITEM_RECEIPT,
                              defaultValues: { orderinvtsub: locationSubsidiary },
                              isDynamic: false,
                            });
                          } else {
                            trecord = record.transform({
                              fromType: recordType,
                              fromId: orderInternalId,
                              toType: record.Type.ITEM_RECEIPT,
                              isDynamic: false,
                            });
                          }
                        } else {
                          if (centralizesPurchasingandBilling == true) {
                            log.debug({
                              title: "targetSubsidiary",
                              details: targetSubsidiary,
                            });
                            if (
                              targetSubsidiary == null ||
                              targetSubsidiary == "" ||
                              targetSubsidiary == undefined ||
                              targetSubsidiary == "undefined"
                            ) {
                              targetSubsidiary = -1;
                            }
                            trecord = record.transform({
                              fromType: recordType,
                              fromId: orderInternalId,
                              toType: record.Type.ITEM_RECEIPT,
                              defaultValues: { targetsub: targetSubsidiary },
                              isDynamic: false,
                            });
                          } else {
                            trecord = record.transform({
                              fromType: recordType,
                              fromId: orderInternalId,
                              toType: record.Type.ITEM_RECEIPT,
                              isDynamic: false,
                            });
                          }
                        }
                        var prossedLinesArr = [];
                        var actQuantity = "";
                        var itemId = "";
                        var batchNo = "";
                        var expiryDate = "";
                        var serialArray = "";
                        var parentItem = "";
                        var openTaskIdarray = [];
                        var enterBin = "";
                        for (
                          var otItr = 0;
                          otItr < opentaskSearchResults.length;
                          otItr++
                        ) {
                          var linenum =
                            opentaskSearchResults[otItr][
                            "custrecord_wmsse_line_no"
                            ];
                          openTaskIdarray.push(
                            parseInt(opentaskSearchResults[otItr].id)
                          );
                          if (prossedLinesArr.indexOf(linenum) == -1) {
                            prossedLinesArr.push(linenum);
                            actQuantity =
                              opentaskSearchResults[otItr]
                                .custrecord_wmsse_act_qty;
                            itemId =
                              opentaskSearchResults[otItr].custrecord_wmsse_sku;
                            batchNo =
                              opentaskSearchResults[otItr]
                                .custrecord_wmsse_batch_num;
                            expiryDate =
                              opentaskSearchResults[otItr]
                                .custrecord_wmsse_expirydate;
                            //	enterBin = opentaskSearchResults[otItr].custrecord_wmsse_actendloc;
                            serialArray =
                              opentaskSearchResults[otItr]
                                .custrecord_wmsse_serial_no;
                            isKitComponent =
                              opentaskSearchResults[otItr]
                                .custrecord_wmsse_kitflag;
                            parentItem =
                              opentaskSearchResults[otItr]
                                .custrecord_wmsse_parent_sku_no;

                            inboundLib.consolidatePostItemReceipt(
                              trecord,
                              actQuantity,
                              linenum,
                              itemId,
                              transactionType,
                              batchNo,
                              expiryDate,
                              whLocation,
                              binInternalId,
                              serialArray,
                              opentaskSearchResults,
                              orderInternalId,
                              otItr,
                              randomTallyScanRule
                            );
                            //itemIterator++;
                          }
                        }
                        if (trecord != null && trecord != "") {
                          itemReceipt = trecord.save();
                        }
                      }
                      if (itemReceipt != "" || systemRuleValue == "Y") {
                        if (
                          runtime.getCurrentScript().getRemainingUsage() >
                          scriptUsageRequiredToUpdateOpenTask(
                            opentaskSearchResults.length
                          ) &&
                          opentaskSearchResults.length <= 100
                        ) {
                          for (
                            var j = 0;
                            j < opentaskSearchResults.length &&
                            runtime.getCurrentScript().getRemainingUsage() >= 20;
                            j++
                          ) {
                            var isKitComponentFlag =
                              opentaskSearchResults[j].custrecord_wmsse_kitflag;
                            if (!isKitComponentFlag) {
                              if (systemRuleValue == "N") {
                                record.submitFields({
                                  type: "customrecord_wmsse_trn_opentask",
                                  id: opentaskSearchResults[j].id,
                                  values: {
                                    custrecord_wmsse_nsconfirm_ref_no:
                                      itemReceipt,
                                    custrecord_wmsse_actbeginloc: binInternalId,
                                    custrecord_wmsse_actendloc: binInternalId,
                                  },
                                });
                              } else {
                                record.submitFields({
                                  type: "customrecord_wmsse_trn_opentask",
                                  id: opentaskSearchResults[j].id,
                                  values: {
                                    custrecord_wmsse_actbeginloc: binInternalId,
                                    custrecord_wmsse_actendloc: binInternalId,
                                  },
                                });
                              }
                            }
                          }
                        } else {
                          var result = triggerMapreduce(
                            whLocation,
                            itemReceipt,
                            binInternalId,
                            orderInternalId
                          );
                          if (JSON.stringify(result) != "{}") {
                            if (result.returnStatus) {
                              if (
                                result.returnStatus == "MapReduceTriggered" &&
                                systemRuleValue == "Y"
                              ) {
                                binValidateDetails.mapReduceTriggered = "Y";
                              }
                            }
                          }
                        }
                      }
                    }
                  } else {
                    var postIrObj = {};
                    if (
                      utility.isValueValid(transactionType) &&
                      transactionType == "returnauthorization" &&
                      utility.isValueValid(restock)
                    ) {
                      postIrObj.restock = restock;
                    }
                    postIrObj.transactionType = transactionType;
                    postIrObj.poInternalId = orderInternalId;
                    postIrObj.fetchedItemId = fetchedItemId;
                    postIrObj.poLineno = orderLineNo;
                    postIrObj.enterQty = enterQty;
                    postIrObj.binInternalId = binInternalId;
                    postIrObj.itemType = itemType;
                    postIrObj.whLocation = whLocation;
                    postIrObj.lotno = lotno;
                    postIrObj.lotExpiryDate = lotExpiryDate;
                    postIrObj.tranid = tranid;
                    postIrObj.actualBeginTime = actualBeginTime;
                    postIrObj.customer = customer;
                    postIrObj.uom = uom;
                    postIrObj.conversionRate = conversionRate;
                    postIrObj.useitemcostflag = useitemcostflag;
                    postIrObj.systemRuleValue = systemRuleValue;
                    postIrObj.invtStatus = invtStatus;
                    postIrObj.fifoDate = null;
                    postIrObj.PutStrategy = null;
                    postIrObj.zoneno = null;
                    postIrObj.TOLineDetails = null;
                    postIrObj.lineFullQty = null;
                    postIrObj.strBarCode = strBarCode;
                    postIrObj.binLocType = binLocType;
                    postIrObj.binIsCart = binIsCart;
                    postIrObj.targetLocation = targetLocation;
                    postIrObj.targetSubsidiary = targetSubsidiary;
                    postIrObj.isKitComponent = isKitComponent;
                    postIrObj.parentItem = parentItem;
                    postIrObj.parentItemLine = parentItemLine;
                    var barcodeDataObj = {};
                    barcodeDataObj.vendorId = vendorId;
                    barcodeDataObj.itemName = fetcheditemname;
                    barcodeDataObj.lotName = lotno;
                    barcodeDataObj.lotExpiryDate = lotExpiryDate;
                    barcodeDataObj.quantity = enterQty.toString();
                    barcodeDataObj.uom = uom;
                    barcodeDataObj.transactionId = orderInternalId;
                    barcodeDataObj.whLocation = whLocation;
                    log.debug("barcodeDataObj", barcodeDataObj);
                    var barcodeOutPutObj =
                      utility.generateCompositeBarcodeString(barcodeDataObj);
                    log.debug("barcodeOutPutObj", barcodeOutPutObj);
                    if (
                      utility.isValueValid(
                        barcodeOutPutObj.compositeBarcodeString
                      )
                    ) {
                      postIrObj.strBarCode =
                        barcodeOutPutObj.compositeBarcodeString;
                    }
                    if (isTallyScanRequired == true) {
                      var selectedConversionRateForTallyScan =
                        requestParams.selectedConversionRateForTallyScan;
                      tallyLoopObj = utility.isValueValid(tallyLoopObj)
                        ? tallyLoopObj
                        : {};
                      var totalQty = 0;
                      for (var obj in tallyLoopObj) {
                        var tallyObj = tallyLoopObj[obj];
                        totalQty =
                          parseFloat(totalQty) + parseFloat(tallyObj.quantity);
                      }
                      if (
                        utility.isValueValid(selectedConversionRateForTallyScan)
                      ) {
                        totalQty = Number(
                          Big(totalQty).mul(selectedConversionRateForTallyScan)
                        );
                        log.debug("totalQty", totalQty);
                        totalQty = Number(Big(totalQty).div(conversionRate));
                      }
                      postIrObj.enterQty = totalQty;
                      postIrObj.isTallyScanRequired = isTallyScanRequired;
                      postIrObj.tallyLoopObj = tallyLoopObj;
                      postIrObj.selectedConversionRate =
                        selectedConversionRateForTallyScan;
                    }

                    debugString = debugString + ",postIrObj :" + postIrObj;
                    itemReceipt = inboundLib.postItemReceipt(postIrObj);
                  }

                  // No Code Solution Changes begin here
                  var impactedRecords = {};
                  impactedRecords = inboundUtility.noCodeSolForReceiving(
                    orderInternalId,
                    orderLineNo,
                    itemReceipt,
                    transactionType,
                    "",
                    false
                  );
                  log.debug({
                    title: "impactedRecords :",
                    details: impactedRecords,
                  });
                  //No Code Solution ends here.

                  debugString = debugString + ",itemReceipt :" + itemReceipt;
                  var orderLineDetails = [];
                  if (binValidateDetails.mapReduceTriggered != "Y") {
                    orderLineDetails = inboundUtility.getRecevingOrderItemDetails(
                      tranid,
                      null,
                      whLocation,
                      null,
                      null,
                      null,
                      transactionType,
                      crossSubsidiaryFeature,
                      centralizesPurchasingandBilling,
                      warehouseLocationName
                    );
                  }
                  if (orderLineDetails != null && orderLineDetails.length > 0) {
                    var orderId = orderLineDetails[0]["internalid"];
                    var openPutAwayDetails =
                      inboundUtility.getOpentaskOpenPutwayDetails(
                        orderId,
                        whLocation
                      );
                    var vCount = 0;
                    var orderRemainingqty = 0;
                    var lineReceivedQty = 0;
                    var lineRemainingQty = 0;
                    for (var cnt in orderLineDetails) {
                      var orderLineArr = orderLineDetails[cnt];
                      var orderLine = orderLineArr.line;
                      if (JSON.stringify(openPutAwayDetails) !== "{}") {
                        var itemOpentaskRcvQty = openPutAwayDetails[orderLine];
                        if (utility.isValueValid(itemOpentaskRcvQty)) {
                          lineReceivedQty = orderLineArr.totalReceivedQty;
                          if (transactionType == "returnauthorization")
                            lineRemainingQty = orderLineArr.rmaRemainingQty;
                          else lineRemainingQty = orderLineArr.poRemainingQty;
                          orderLineArr.totalReceivedQty = Number(
                            Big(lineReceivedQty).plus(itemOpentaskRcvQty)
                          );
                          orderLineArr.poRemainingQty = Number(
                            Big(lineRemainingQty).minus(itemOpentaskRcvQty)
                          );
                          orderLineArr.rmaRemainingQty = Number(
                            Big(lineRemainingQty).minus(itemOpentaskRcvQty)
                          );
                        }
                      }

                      if (transactionType == "returnauthorization")
                        orderRemainingqty = orderLineArr.rmaRemainingQty;
                      else orderRemainingqty = orderLineArr.poRemainingQty;

                      if (parseFloat(orderRemainingqty) > 0) {
                        vCount++;
                        break;
                      }
                    }
                    if (parseFloat(vCount) > 0) {
                      binValidateDetails.isValid = true;
                      binValidateDetails.custparam_count = vCount;
                      binValidateDetails.systemRuleValue = systemRuleValue;
                    } else {
                      binValidateDetails.isValid = true;
                      binValidateDetails.custparam_count = 0;
                      binValidateDetails.systemRuleValue = systemRuleValue;
                    }
                    binValidateDetails.impactedRecords = impactedRecords;
                  } else {
                    binValidateDetails.isValid = true;
                    binValidateDetails.custparam_count = 0;
                    binValidateDetails.systemRuleValue = systemRuleValue;
                    binValidateDetails.impactedRecords = impactedRecords;
                  }
                }
              } else {
                binValidateDetails.errorMessage = translator.getTranslationString(
                  "PO_QUANTITYVALIDATE.INVALID_BIN"
                );
                binValidateDetails.isValid = false;
              }
            }
          } else {
            binValidateDetails.errorMessage = translator.getTranslationString(
              "PO_QUANTITYVALIDATE.INVALID_BIN"
            );
            binValidateDetails.isValid = false;
          }
        } else {
          binValidateDetails.errorMessage = translator.getTranslationString(
            "PO_QUANTITYVALIDATE.INVALID_BIN"
          );
          binValidateDetails.isValid = false;
        }
      } catch (e) {
        binValidateDetails.isValid = false;
        binValidateDetails.errorMessage = e.message;
        log.error({
          title: "errorMessage",
          details: e.message + " Stack :" + e.stack,
        });
        log.error({ title: "debugString", details: debugString });
      }
      return binValidateDetails;
    }
    function getItemCustomDetails(fetchedItemId, whLocation) {
      var itemSearch = search.load({
        id: "customsearch_wmsse_receivingitemdetails",
      });
      var itemSearchFilters = itemSearch.filters;
      if (utility.isValueValid(fetchedItemId)) {
        itemSearchFilters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: fetchedItemId,
          })
        );
      }
      itemSearchFilters.push(
        search.createFilter({
          name: "isinactive",
          operator: search.Operator.IS,
          values: false,
        })
      );
      if (utility.isValueValid(whLocation)) {
        itemSearchFilters.push(
          search.createFilter({
            name: "inventorylocation",
            operator: search.Operator.ANYOF,
            values: ["@NONE@", whLocation],
          })
        );
      }
      itemSearch.filters = itemSearchFilters;
      var itemSrchResults = utility.getSearchResultInJSON(itemSearch);
      return itemSrchResults;
    }
    function getItemInventoryDetails(fetchedItemId, whLocation, binInternalId) {
      var invDetailsSearch = search.load({
        id: "customsearch_wmsse_itemwise_invt_inbound",
      });
      var invDeialsFilters = invDetailsSearch.filters;
      if (utility.isValueValid(fetchedItemId)) {
        invDeialsFilters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.NONEOF,
            values: fetchedItemId,
          })
        );
      }

      if (utility.isValueValid(whLocation)) {
        invDeialsFilters.push(
          search.createFilter({
            name: "location",
            join: "binonhand",
            operator: search.Operator.ANYOF,
            values: whLocation,
          })
        );
      }
      if (utility.isValueValid(binInternalId)) {
        invDeialsFilters.push(
          search.createFilter({
            name: "binnumber",
            join: "binonhand",
            operator: search.Operator.ANYOF,
            values: binInternalId,
          })
        );
      }

      invDetailsSearch.filters = invDeialsFilters;
      var itemInvDetails = utility.getSearchResultInJSON(invDetailsSearch);
      return itemInvDetails;
    }
    function getLotItemInventoryDetails(whLocation, binInternalId, lotno) {
      var invDetailsSearch = search.load({
        id: "customsearch_wmsse_itemwise_lots",
      });
      var invDeialsFilters = invDetailsSearch.filters;

      if (utility.isValueValid(whLocation)) {
        invDeialsFilters.push(
          search.createFilter({
            name: "location",
            join: "inventoryNumberBinOnHand",
            operator: search.Operator.ANYOF,
            values: whLocation,
          })
        );
      }
      if (utility.isValueValid(binInternalId)) {
        invDeialsFilters.push(
          search.createFilter({
            name: "binnumber",
            join: "inventoryNumberBinOnHand",
            operator: search.Operator.ANYOF,
            values: binInternalId,
          })
        );
      }
      if (utility.isValueValid(lotno)) {
        invDeialsFilters.push(
          search.createFilter({
            name: "inventorynumber",
            join: "inventoryNumberBinOnHand",
            operator: search.Operator.ISNOT,
            values: lotno,
          })
        );
      }
      invDeialsFilters.push(
        search.createFilter({
          name: "islotitem",
          operator: search.Operator.IS,
          values: true,
        })
      );
      invDetailsSearch.filters = invDeialsFilters;
      var lotItemInventoryDetails =
        utility.getSearchResultInJSON(invDetailsSearch);
      return lotItemInventoryDetails;
    }
    function triggerMapreduce(
      whLocationId,
      itemreceiptId,
      binInternalId,
      orderID
    ) {
      var schstatus = task.create({ taskType: task.TaskType.MAP_REDUCE });
      schstatus.scriptId = "customscript_wms_mr_opentaskupdate";
      schstatus.params = {
        custscript_wms_orderid: orderID,
        custscript_wms_warehouseInternalId: whLocationId,
        custscript_wms_itemreceiptId: itemreceiptId,
        custscript_wms_bininternalidnumber: binInternalId,
      };
      var mrTaskId = schstatus.submit();
      var taskStatus = task.checkStatus(mrTaskId);
      var returnStatus = "";
      var schScriptStatusLink = "";
      if (taskStatus.status != "FAILED") {
        utility.updateScheduleScriptStatus(
          "randomTallyscanBinUpdate",
          runtime.getCurrentUser().id,
          "Submitted",
          orderID,
          "",
          "",
          ""
        );
        returnStatus = "MapReduceTriggered";
        var scriptStatusURL =
          "/app/common/scripting/mapreducescriptstatus.nl?daterange=TODAY&scripttype=" +
          taskStatus.scriptId;
        var schScriptStatusLink =
          '<a href="' +
          scriptStatusURL +
          '"> ' +
          translator.getTranslationString("GUIPACKING.CLICKHERE") +
          " </a>";
      }
      return {
        returnStatus: returnStatus,
        schScriptStatusLink: schScriptStatusLink,
      };
    }
    function scriptUsageRequiredToUpdateOpenTask(opentaskCount) {
      var bufferScriptUsage = 20;
      var scriptUsageNeededForStep1 = Number(Big(opentaskCount).mul(2));
      var scriptUsageNeeded =
        parseFloat(scriptUsageNeededForStep1) + parseFloat(bufferScriptUsage);
      return scriptUsageNeeded;
    }

    return {
      post: doPost,
      getItemCustomDetails: getItemCustomDetails,
    };
  });
