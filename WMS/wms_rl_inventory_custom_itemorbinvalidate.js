/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define([
  "N/search",
  "./wms_utility",
  "./wms_translator",
  "./wms_inventory_utility",
], function (search, utility, translator, invtUtility) {
  function doPost(requestBody) {
    var binoritemArray = {};
    log.debug({
      title: "requestBody",
      details: requestBody
    });
    var debugString = "";
    var requestParams = "";
    try {
      if (utility.isValueValid(requestBody)) {
        requestParams = requestBody.params;
        var inputStringVar = requestParams.inputString;
        var wareHouseLocationId = requestParams.warehouseLocationId;

        if (
          utility.isValueValid(inputStringVar) &&
          utility.isValueValid(wareHouseLocationId)
        ) {
          binoritemArray = binValidation(requestParams);
          log.debug({
            title: "binoritemArray",
            details: binoritemArray
          });
          if (
            binoritemArray.isValid == false ||
            binoritemArray.isValid == "false"
          ) {
            var itemResObj = utility.itemValidationForInventoryAndOutBound(
              inputStringVar,
              wareHouseLocationId
            );

            if (
              utility.isValueValid(itemResObj.itemInternalId) ||
              utility.isValueValid(itemResObj.barcodeIteminternalid)
            ) {
              var itemInternalId = itemResObj.itemInternalId ?
                itemResObj.itemInternalId :
                itemResObj.barcodeIteminternalid;
              var itemName = itemResObj.itemName ?
                itemResObj.itemName :
                itemResObj.barcodeItemname;

              var objBinDetails = getUseBins(
                itemInternalId,
                wareHouseLocationId
              );
              log.debug({
                title: "objBinDetails",
                details: objBinDetails
              });

              if (objBinDetails != null && objBinDetails != "") {
                if (
                  objBinDetails != undefined &&
                  objBinDetails != "undefined"
                ) {
                  var useBins = objBinDetails.usebins;
                  log.debug({
                    title: "useBins",
                    details: useBins
                  });
                  if (useBins == false) {
                    binoritemArray.errorMessage =
                      translator.getTranslationString(
                        "BINTRANSFER_ITEMVALIDATE.USEBIN_FLAG"
                      );
                    binoritemArray.isValid = false;
                  } else {
                    binoritemArray = {};
                    binoritemArray.itemInternalId = itemInternalId;
                    binoritemArray.itemName = itemName;
                    binoritemArray.custparam_processeddatatype = "item";
                    var unitType = "";
                    var stockUnitName = "";
                    binoritemArray.unitType = "";
                    var itemType = "";
                    if (
                      objBinDetails.unitstype[0] != undefined &&
                      objBinDetails.unitstype[0] != "undefined"
                    ) {
                      unitType = objBinDetails.unitstype[0].value;
                      stockUnitName = objBinDetails.stockunit[0].text;
                      binoritemArray.unitType = unitType;
                      binoritemArray.stockUnitName = stockUnitName;
                    }
                    if (
                      objBinDetails.recordtype != undefined &&
                      objBinDetails.recordtype != "undefined"
                    ) {
                      itemType = objBinDetails.recordtype;
                    }
                    var stockConversionRate = "";
                    var unitTypeIdNum = "";
                    if (utility.isValueValid(unitType)) {
                      unitTypeIdNum = unitType;
                      stockConversionRate =
                        invtUtility.getOpenTaskStockCoversionRate(
                          unitType,
                          stockUnitName
                        );
                    }
                    binoritemArray.stockConversionRate = stockConversionRate;

                    if (
                      itemType == "" &&
                      objBinDetails.recordtype != undefined
                    ) {
                      itemType = objBinDetails.recordtype;
                    }

                    if (objBinDetails.thumbnailurl != undefined) {
                      binoritemArray.imageUrl = objBinDetails.thumbnailurl;
                    }
                    binoritemArray.itemType = itemType;

                    binoritemArray = utility.addItemDatatoResponse(
                      binoritemArray,
                      itemResObj,
                      unitTypeIdNum,
                      stockUnitName
                    );

                    if (itemType != "kititem") {
                      binoritemArray.isValid = true;
                    } else {
                      binoritemArray.errorMessage =
                        translator.getTranslationString(
                          "BINTRANSFER_ITEMORBINVALIDATE.ITEM_VALIDATION"
                        );
                      binoritemArray.isValid = false;
                    }
                  }
                }
              }
            } else {
              if (
                itemResObj.error ===
                translator.getTranslationString("PO_ITEMVALIDATE.INVALID_INPUT")
              ) {
                binoritemArray.errorMessage = translator.getTranslationString(
                  "BINTRANSFER_ITEMORBINVALIDATE.INVALID_INPUT"
                );
                binoritemArray.isValid = false;
              } else {
                log.debug({
                  title: "itemResObj.error",
                  details: itemResObj.error,
                });
                binoritemArray.errorMessage = itemResObj.error;
                binoritemArray.isValid = false;
              }
            }
          } else {
            var processType = requestParams.processType;
            if (processType == "cartPutAway") {
              var loadAllSystemRuleValue = utility.getSystemRuleValue(
                "Enable bulk loading into staging carts",
                wareHouseLocationId
              );
              if (
                utility.isValueValid(loadAllSystemRuleValue) &&
                loadAllSystemRuleValue == "Y"
              ) {
                binoritemArray.enableLoadAllItemsFromStageToCart = true;
              } else {
                binoritemArray.enableLoadAllItemsFromStageToCart = false;
              }
            }
          }
        } else {
          binoritemArray.errorMessage = translator.getTranslationString(
            "BINTRANSFER_ITEMORBINVALIDATE.INVALID_INPUT"
          );
          binoritemArray.isValid = false;
        }
      } else {
        binoritemArray.errorMessage = translator.getTranslationString(
          "BINTRANSFER_ITEMORBINVALIDATE.INVALID_INPUT"
        );
        binoritemArray.isValid = false;
      }
      log.debug({
        title: "binoritemArray",
        details: binoritemArray
      });
    } catch (e) {
      binoritemArray.isValid = false;
      binoritemArray.errorMessage = e.message;
      log.error({
        title: "errorMessage",
        details: e.message + " Stack :" + e.stack,
      });
      log.error({
        title: "debugString",
        details: debugString
      });
    }
    return binoritemArray;
  }

  function binValidation(requestParams) {
    var binoritemArray = {};
    var inputStringVar = requestParams.inputString;
    var whLocationId = requestParams.warehouseLocationId;
    var processType = requestParams.processType;
    var stgLocId = -1;
    var BinlocationSearch = search.create({
      type: "customlist_wmsse_bin_loc_type",
      columns: [{
        name: "name",
      }, ],
    });
    var BinlocationTypes = BinlocationSearch.run().getRange({
      start: 0,
      end: 1000,
    });

    if (
      BinlocationTypes != null &&
      BinlocationTypes != "" &&
      BinlocationTypes.length > 0
    ) {
      var strName = "Stage";
      var stgTypeArr = [];
      var stageLocArr = [];
      if (processType == "binTransfer") {
        stgTypeArr.push("Stage");
        stgTypeArr.push("WIP");
        stageLocArr = utility.getStageLocations(stgTypeArr, BinlocationTypes);
      } else {
        for (var b = 0; b < BinlocationTypes.length; b++) {
          var tName = BinlocationTypes[b].getValue("name");
          if (tName == strName) {
            stgLocId = BinlocationTypes[b].id;
            break;
          }
        }
      }
    }
    var binInternalId = "";
    var binSearchFilters = [];

    var searchrecord = search.load({
      id: "customsearch_wmsse_binnumbers_2",
    });
    binSearchFilters = searchrecord.filters;
    binSearchFilters.push(
      search.createFilter({
        name: "custrecord_bin_code",
        operator: search.Operator.IS,
        values: inputStringVar,
      })
    );

    if (processType == "putAway" || processType == "cartPutAway") {
      if (
        utility.isValueValid(processType) &&
        (processType == "putAway" || processType == "cartPutAway")
      ) {
        binSearchFilters.push(
          search.createFilter({
            name: "custrecord_wms_iscart",
            operator: search.Operator.IS,
            values: false,
          })
        );
      }
      binSearchFilters.push(
        search.createFilter({
          name: "custrecord_wmsse_bin_stg_direction",
          operator: search.Operator.ANYOF,
          values: ["1"],
        })
      );
      if (stgLocId != -1) {
        binSearchFilters.push(
          search.createFilter({
            name: "custrecord_wmsse_bin_loc_type",
            operator: search.Operator.ANYOF,
            values: stgLocId,
          })
        );
      }
    } else if (processType == "binTransfer") {
      binSearchFilters.push(
        search.createFilter({
          name: "custrecord_wmsse_bin_stg_direction",
          operator: search.Operator.ANYOF,
          values: ["@NONE@", "1", "2"],
        })
      );
      if (stageLocArr.length > 0) {
        stageLocArr.push("@NONE@");
        binSearchFilters.push(
          search.createFilter({
            name: "custrecord_wmsse_bin_loc_type",
            operator: search.Operator.ANYOF,
            values: stageLocArr,
          })
        );
      }
    } else {
      binSearchFilters.push(
        search.createFilter({
          name: "custrecord_wmsse_bin_stg_direction",
          operator: search.Operator.ANYOF,
          values: ["@NONE@", "1"],
        })
      );
      if (stgLocId != -1) {
        binSearchFilters.push(
          search.createFilter({
            name: "custrecord_wmsse_bin_loc_type",
            operator: search.Operator.ANYOF,
            values: ["@NONE@", stgLocId],
          })
        );
      }
    }
    if (utility.isValueValid(whLocationId)) {
      binSearchFilters.push(
        search.createFilter({
          name: "location",
          operator: search.Operator.ANYOF,
          values: whLocationId,
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
    var binSearchResults = searchrecord.run().getRange({
      start: 0,
      end: 1000,
    });
    log.debug({
      title: "binSearchResults",
      details: binSearchResults
    });
    if (binSearchResults.length > 0) {
      binInternalId = binSearchResults[0].id;
      // need to allow bins which bin location type as WIP and mfg picking flag as true
      if (
        processType == "binTransfer" &&
        binSearchResults[0].getText({
          name: "custrecord_wmsse_bin_loc_type",
        }) == "WIP" &&
        binSearchResults[0].getValue({
          name: "custrecord_wms_mfg_picking"
        }) ==
        false
      ) {
        binInternalId = "";
      }
    }
    if (!utility.isValueValid(binInternalId)) {
      binoritemArray.errorMessage = translator.getTranslationString(
        "BINTRANSFER_ITEMORBINVALIDATE.INVALID_INPUT"
      );
      binoritemArray.isValid = false;
    } else {
      if (
        binSearchResults[0].getText({
          name: "custrecord_wmsse_bin_loc_type",
        }) == "Stage" &&
        binSearchResults[0].getText({
          name: "custrecord_wmsse_bin_stg_direction",
        }) == ""
      ) {
        binoritemArray.errorMessage = translator.getTranslationString(
          "BINPUTW_FROM_BINVALIDATE.INVALID_INPUT"
        );
        binoritemArray.isValid = false;
      } else {
        binoritemArray.binInternalId = binInternalId;
        binoritemArray.binName = binSearchResults[0].getValue({
          name: "custrecord_bin_code",
        });
        binoritemArray.custparam_processeddatatype = "bin";
        binoritemArray.isValid = true;
      }
    }
    return binoritemArray;
  }

  function getUseBins(itemInternalId, warehouseLocationId) {
    var columnArray = [];
    columnArray.push("usebins");
    columnArray.push("unitstype");
    columnArray.push("stockunit");
    columnArray.push("recordtype");

    var itemDetails = utility.getItemFieldsByLookup(
      itemInternalId,
      columnArray
    );

    return itemDetails;
  }
  return {
    post: doPost,
  };
});