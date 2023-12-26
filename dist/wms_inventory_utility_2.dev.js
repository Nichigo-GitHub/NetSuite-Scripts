"use strict";

/**
 *    Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search', 'N/runtime', 'N/record', 'N/query', 'N/format', './big', './wms_utility', './wms_translator', 'N/task', 'N/config'], function (search, runtime, record, query, format, Big, utility, translator, task, config) {
  function _getBinDetailsForItem(pickBinDetailsObj, processType) {
    try {
      log.debug({
        title: 'pickBinDetailsObj',
        details: pickBinDetailsObj
      });
      log.debug({
        title: 'processType',
        details: processType
      });
      var getItemInternalId = pickBinDetailsObj['itemInternalId'];
      var strItemGrp = pickBinDetailsObj['strItemGrp'];
      var strItemFam = pickBinDetailsObj['strItemFamily'];
      var getPreferBin = pickBinDetailsObj["preferBinId"];
      var strLocation = pickBinDetailsObj["whLocationId"];
      var strItemDept = pickBinDetailsObj["department"];
      var strItemClass = pickBinDetailsObj["classes"];
      var strOrderType = pickBinDetailsObj["strOrderType"];
      var strvUnits = pickBinDetailsObj["strvUnits"];
      var boolinclIBStageInvFlag = pickBinDetailsObj["boolinclIBStageInvFlag"];
      var makeInvAvailFlagFromSelect = pickBinDetailsObj["makeInvAvailFlagFromSelect"];
      var itemType = pickBinDetailsObj["itemType"];
      var itemUnitType = pickBinDetailsObj["unitType"];
      var itemStockUnit = pickBinDetailsObj["blnItemUnit"];
      var getPreferBinId = pickBinDetailsObj["preferBinId"];
      var selectedConversionRate = pickBinDetailsObj["selectedConversionRate"];
      var currentConversionRate = pickBinDetailsObj["currentConversionRate"];
      var invstatusarray = [];
      var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
      var vmakeInvAvailFlag = true;
      var vLocDetails = search.lookupFields({
        type: search.Type.LOCATION,
        id: strLocation,
        columns: ['makeinventoryavailable']
      });
      vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
      var vBinLocArr = [];
      var vBinIntIdExcludeArr = [];

      if (utility.isValueValid(getPreferBin)) {
        _getPreferBinInvtDetails(getPreferBin, getItemInternalId, strLocation, vmakeInvAvailFlag, selectedConversionRate, vBinLocArr, vBinIntIdExcludeArr, itemType, currentConversionRate, processType);
      }

      log.debug({
        title: 'vBinLocArr',
        details: vBinLocArr
      });
      log.debug({
        title: 'vBinIntIdExcludeArr',
        details: vBinIntIdExcludeArr
      });

      var objBinInvtDetails = _getItemBinInvtDetails(getItemInternalId, strLocation, inventoryStatusFeature, itemType, processType);

      log.debug({
        title: 'objBinInvtDetails',
        details: objBinInvtDetails
      });

      if (objBinInvtDetails.length > 0) {
        _getInvtBinDetails(objBinInvtDetails, vBinLocArr, selectedConversionRate, currentConversionRate, vmakeInvAvailFlag, vBinIntIdExcludeArr);
      }

      log.debug({
        title: 'vBinLocArr',
        details: vBinLocArr
      });
    } catch (e) {
      log.error('expection in _getBinDetailsForItem', e);
    }

    return vBinLocArr;
  }

  function _getItemBinInvtDetails(getItemInternalId, strLocation, inventoryStatusFeature, itemType, processType) {
    var systemRule_AllowExpiredItems = ' ';

    if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
      systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?', strLocation);
    }

    var objBinInvtDetails = [];
    var searchName = 'customsearch_wms_item_inventorydetails';

    if (itemType == "inventoryitem" || itemType == "assemblyitem") {
      searchName = 'customsearch_wms_item_inventorydetails';
    } else {
      searchName = 'customsearch_wms_item_inventory_lotser';
    }

    var objInvtSearch = search.load({
      id: searchName,
      type: search.Type.INVENTORY_BALANCE
    });
    var invtBinFilters = objInvtSearch.filters;
    invtBinFilters = getInvtBinFilters(invtBinFilters, getItemInternalId, strLocation, systemRule_AllowExpiredItems, itemType, processType);
    objInvtSearch.filters = invtBinFilters;
    var objBinInvtDetails = utility.getSearchResultInJSONForValidation(objInvtSearch, 4000);
    return objBinInvtDetails;
  }

  function getInvtBinFilters(invtBinFilters, getItemInternalId, strLocation, systemRule_AllowExpiredItems, itemType, processType) {
    if (utility.isValueValid(getItemInternalId)) {
      invtBinFilters.push(search.createFilter({
        name: 'internalid',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: getItemInternalId
      }));
    }

    if (utility.isValueValid(strLocation)) {
      invtBinFilters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: strLocation
      }));
    }

    if (processType == 'invtransfer' || processType == 'inventoryStatusChange') {
      invtBinFilters.push(search.createFilter({
        name: 'custrecord_wmsse_bin_stg_direction',
        join: 'binnumber',
        operator: search.Operator.ANYOF,
        values: ['@NONE@', '1']
      }));
    }

    if ((systemRule_AllowExpiredItems == 'N' || systemRule_AllowExpiredItems == '') && (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem")) {
      var currDate = utility.DateStamp();
      currDate = format.parse({
        value: currDate,
        type: format.Type.DATE
      });
      currDate = format.format({
        value: currDate,
        type: format.Type.DATE
      });
      var dateFormat = utility.DateSetting();
      var defalutExpiryDate = utility.setExpiryDate(dateFormat, '01', '01', '2199');
      invtBinFilters.push(search.createFilter({
        name: 'formuladate',
        operator: search.Operator.ONORAFTER,
        formula: "NVL({inventorynumber.expirationdate},TO_DATE('" + defalutExpiryDate + "','" + dateFormat + "'))",
        values: currDate
      }));
    }

    return invtBinFilters;
  }

  function gerPreferBinFilters(preferBinFilters, getItemInternalId, strLocation, getPreferBinId) {
    if (utility.isValueValid(getItemInternalId)) {
      preferBinFilters.push(search.createFilter({
        name: 'internalid',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: getItemInternalId
      }));
    }

    if (utility.isValueValid(strLocation)) {
      preferBinFilters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: strLocation
      }));
    }

    preferBinFilters.push(search.createFilter({
      name: 'binnumber',
      operator: search.Operator.ANYOF,
      values: getPreferBinId
    }));
    return preferBinFilters;
  }

  function _getInvtBinDetails(objBinInvtDetails, vBinLocArr, selectedConversionRate, currentConversionRate, vmakeInvAvailFlag, vBinIntIdExcludeArr) {
    var vValidBinId = '';
    var vValidBin = '';
    var vBinQtyAvail = 0;
    var vBinStatus = '';
    var vBinStatusID = '';
    var vZone = '';

    for (var invtBinItr in objBinInvtDetails) {
      vValidBinId = objBinInvtDetails[invtBinItr]['binnumber'];
      vValidBin = objBinInvtDetails[invtBinItr]['binnumberText'];
      vBinStatus = objBinInvtDetails[invtBinItr]['statusText']; //vZone = objBinInvtDetails[invtBinItr]['custrecord_wmsse_zoneText'];

      vZone = objBinInvtDetails[invtBinItr]['zoneText'];
      vBinStatusID = objBinInvtDetails[invtBinItr]['status'];

      if (vmakeInvAvailFlag) {
        vBinQtyAvail = objBinInvtDetails[invtBinItr]['available'];
      } else {
        vBinQtyAvail = objBinInvtDetails[invtBinItr]['onhand'];
      }

      vBinQtyAvail = parseFloat(vBinQtyAvail);

      if (parseFloat(vBinQtyAvail) > 0 && vBinIntIdExcludeArr.indexOf(vValidBinId) == -1) {
        if (utility.isValueValid(selectedConversionRate) && utility.isValueValid(currentConversionRate) && selectedConversionRate != currentConversionRate) {
          vBinQtyAvail = utility.uomConversions(vBinQtyAvail, selectedConversionRate, currentConversionRate);
        }

        var currRow = {
          'binnumber': vValidBin,
          'availableqty': vBinQtyAvail,
          'bininternalid': vValidBinId,
          'zone': vZone,
          'status': vBinStatus
        };
        vBinLocArr.push(currRow);
      }
    }
  }

  function _getPreferBinInvtDetails(getPreferBin, getItemInternalId, strLocation, vmakeInvAvailFlag, selectedConversionRate, vBinLocArr, vBinIntIdExcludeArr, itemType, currentConversionRate, processType) {
    var preferBinSearch = search.load({
      id: 'customsearch_wmsse_binsbypickzonesearch'
    });
    var PreferBinFilters = preferBinSearch.filters;
    PreferBinFilters.push(search.createFilter({
      name: 'inactive',
      operator: search.Operator.IS,
      values: false
    }));
    PreferBinFilters.push(search.createFilter({
      name: 'binnumber',
      operator: search.Operator.IS,
      values: getPreferBin
    }));

    if (utility.isValueValid(strLocation)) {
      PreferBinFilters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: strLocation
      }));
    }

    if (processType == 'invtransfer' || processType == 'inventoryStatusChange') {
      PreferBinFilters.push(search.createFilter({
        name: 'custrecord_wmsse_bin_stg_direction',
        operator: search.Operator.ANYOF,
        values: ['@NONE@', '1']
      }));
    }

    preferBinSearch.filters = PreferBinFilters;
    var objPrefBinIdDetails = utility.getSearchResultInJSON(preferBinSearch);

    if (objPrefBinIdDetails.length > 0 && objPrefBinIdDetails[0]['internalid'] != null && objPrefBinIdDetails[0]['internalid'] != '' && utility.isValueValid(getPreferBin)) {
      var getPreferBinId = objPrefBinIdDetails[0]['internalid'];
      log.debug({
        title: 'getPreferBinId',
        details: getPreferBinId
      });
      var objPrefBinDetails = [];
      var searchName = 'customsearch_wms_item_inventorydetails';

      if (itemType == "inventoryitem" || itemType == "assemblyitem") {
        searchName = 'customsearch_wms_item_inventorydetails';
      } else {
        searchName = 'customsearch_wms_item_inventory_lotser';
      }

      var objPrefSearch = search.load({
        id: searchName,
        type: search.Type.INVENTORY_BALANCE
      });
      var preferBinFilters = objPrefSearch.filters;
      preferBinFilters = gerPreferBinFilters(preferBinFilters, getItemInternalId, strLocation, getPreferBinId);
      objPrefSearch.filters = preferBinFilters;
      var objPrefBinDetails = utility.getSearchResultInJSONForValidation(objPrefSearch, 4000);
      log.debug({
        title: 'objPrefBinDetails11',
        details: objPrefBinDetails
      });

      if (objPrefBinDetails.length > 0) {
        var vPrefBinQtyAvail = 0;
        var vBinStatus = '';
        var vBinStatusID = '';
        var vZone = '';

        for (var prefBinIterator in objPrefBinDetails) {
          if (vmakeInvAvailFlag) {
            vPrefBinQtyAvail = objPrefBinDetails[prefBinIterator]['available'];
          } else {
            vPrefBinQtyAvail = objPrefBinDetails[prefBinIterator]['onhand'];
          }

          vBinStatus = objPrefBinDetails[prefBinIterator]['statusText']; //vZone = objPrefBinDetails[prefBinIterator]['custrecord_wmsse_zoneText'];

          vZone = objPrefBinDetails[prefBinIterator]['zoneText'];
          vBinStatusID = objPrefBinDetails[prefBinIterator]['status'];
          vPrefBinQtyAvail = parseFloat(vPrefBinQtyAvail);

          if (parseFloat(vPrefBinQtyAvail) > 0) {
            if (utility.isValueValid(selectedConversionRate) && utility.isValueValid(currentConversionRate) && selectedConversionRate != currentConversionRate) {
              vPrefBinQtyAvail = utility.uomConversions(vPrefBinQtyAvail, selectedConversionRate, currentConversionRate);
            }

            var currRow = {
              'binnumber': getPreferBin,
              'availableqty': vPrefBinQtyAvail,
              'bininternalid': objPrefBinIdDetails[0]['internalid'],
              'zone': vZone,
              'status': vBinStatus
            };
            vBinIntIdExcludeArr.push(objPrefBinIdDetails[0]['internalid']);
            vBinLocArr.push(currRow);
          }
        }
      }
    }
  }

  function getOpenTaskStockCoversionRate(vUnitTypeId, vUnits) {
    var uomfilters = [];
    uomfilters[0] = search.createFilter({
      name: 'internalid',
      operator: search.Operator.ANYOF,
      values: vUnitTypeId
    });
    uomfilters[1] = search.createFilter({
      name: 'unitname',
      operator: search.Operator.IS,
      values: vUnits
    });
    var uomcolumns = [];
    uomcolumns[0] = search.createColumn({
      name: "conversionrate"
    });
    var uomresults = search.create({
      type: 'unitstype',
      filters: uomfilters,
      columns: uomcolumns
    }).run().getRange({
      start: 0,
      end: 1000
    });
    var vFromRate = 1;

    if (uomresults != null && uomresults != '') {
      // There will be only one record in the search result
      vFromRate = uomresults[0].getValue({
        name: 'conversionrate'
      });
      if (vFromRate == null || vFromRate == '') vFromRate = 1;
    }

    return vFromRate;
  }

  function inventoryBinTransfer(bintransferObj) {
    log.debug({
      title: 'bintransferObj in inventoryBinTransfer',
      details: bintransferObj
    });
    var itemType = bintransferObj.itemType;
    var whLocation = bintransferObj.whLocation;
    var itemId = bintransferObj.itemId;
    var quantity = bintransferObj.quantity;
    var fromBinId = bintransferObj.fromBinId;
    var toBinId = bintransferObj.toBinId;
    var batchno = bintransferObj.batchno;
    var actualBeginTime = bintransferObj.actualBeginTime;
    var units = bintransferObj.units;
    var stockConversionRate = bintransferObj.stockConversionRate;
    var opentaskQty = bintransferObj.opentaskQty;
    var fromStatus = bintransferObj.fromStatus;
    var toStatus = bintransferObj.toStatus;
    var processType = bintransferObj.processType;
    var isTallyScanRequired = bintransferObj.isTallyScanRequired;
    var tallyQtyArr = bintransferObj.tallyQtyArr;
    var statusArray = bintransferObj.statusArray;
    var lotArray = bintransferObj.lotArray;
    var processType = bintransferObj.processType;
    var batchnoArr = [];
    var statusArr = [];
    var quantityArr = [];
    var lotArrr = [];

    if (!utility.isValueValid(stockConversionRate)) {
      stockConversionRate = 1;
    }

    if ((itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") && processType == "replen") {
      var quantityArray = bintransferObj.scannedStatusQtyList;
      var batchno = bintransferObj.scannedStatusLotList;
      var fromStatusArray = bintransferObj.scannedStatusList;

      if (utility.isValueValid(batchno)) {
        var lotArray = batchno.split(',');

        for (var intItr = 0; intItr < lotArray.length; intItr++) {
          batchnoArr.push(lotArray[intItr]);
        }
      }

      if (utility.isValueValid(quantityArray)) {
        var totalQuantity = 0;
        var qtyArray = quantityArray.split(',');

        for (var qtyItr = 0; qtyItr < qtyArray.length; qtyItr++) {
          totalQuantity = Number(Big(totalQuantity).plus(qtyArray[qtyItr]));
          var lotQauntity = Number(Big(qtyArray[qtyItr]).mul(stockConversionRate));
          quantityArr.push(lotQauntity);
        }

        log.debug({
          title: 'totalQuantity',
          details: totalQuantity
        });
        quantity = Number(Big(totalQuantity).mul(stockConversionRate).toFixed(8));
        opentaskQty = quantity;
      }

      if (utility.isValueValid(fromStatus)) {
        var statusArray = fromStatusArray.split(',');

        for (var statusItr = 0; statusItr < statusArray.length; statusItr++) {
          statusArr.push(statusArray[statusItr]);
        }
      }

      log.debug({
        title: 'batchnoArr',
        details: batchnoArr
      });
      log.debug({
        title: 'quantityArray',
        details: quantityArray
      });
      log.debug({
        title: 'statusArr',
        details: statusArr
      });
    }

    log.debug({
      title: 'quantity',
      details: quantity
    });
    quantity = Number(Big(quantity).div(stockConversionRate).toFixed(8));
    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
    var binTransfer = record.create({
      type: record.Type.BIN_TRANSFER,
      isDynamic: true
    });
    binTransfer.setValue({
      fieldId: 'location',
      value: whLocation
    });
    var currDate = utility.DateStamp();
    var parsedCurrentDate = format.parse({
      value: currDate,
      type: format.Type.DATE
    });
    binTransfer.setValue({
      fieldId: 'trandate',
      value: parsedCurrentDate
    });
    binTransfer.selectNewLine({
      sublistId: 'inventory'
    });
    binTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'item',
      value: itemId
    });
    binTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'quantity',
      value: quantity
    });

    if (itemType == "inventoryitem" || itemType == "assemblyitem") {
      if (isTallyScanRequired && inventoryStatusFeature) {
        log.audit({
          title: 'isTallyScanRequired',
          details: isTallyScanRequired
        });
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        log.audit({
          title: 'statusArray11',
          details: statusArray
        });

        for (var statusvalue = 0; statusvalue < statusArray.length; statusvalue++) {
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: Number(Big(tallyQtyArr[statusvalue]).div(stockConversionRate))
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });

          if (inventoryStatusFeature) {
            if (processType == 'cartPutaway') {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'inventorystatus',
                value: fromStatus
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: statusArray[statusvalue]
              });
            } else {
              if (processType == 'cart') {
                toStatus = statusArray[statusvalue];
              }

              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'inventorystatus',
                value: statusArray[statusvalue]
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: toStatus
              });
            }
          }

          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      } else {
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        compSubRecord.selectNewLine({
          sublistId: 'inventoryassignment'
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: quantity
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: fromBinId
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'tobinnumber',
          value: toBinId
        });

        if (inventoryStatusFeature) {
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'inventorystatus',
            value: fromStatus
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'toinventorystatus',
            value: toStatus
          });
        }

        compSubRecord.commitLine({
          sublistId: 'inventoryassignment'
        });
      }
    } else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
      if (processType == "replen") {
        log.debug({
          title: 'batchnoArr.length',
          details: batchnoArr.length
        });
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });

        for (var putawayall = 0; putawayall < batchnoArr.length; putawayall++) {
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: Number(Big(quantityArr[putawayall]).div(stockConversionRate))
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'receiptinventorynumber',
            value: batchnoArr[putawayall]
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });

          if (inventoryStatusFeature) {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'inventorystatus',
              value: statusArr[putawayall]
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'toinventorystatus',
              value: statusArr[putawayall]
            });
          }

          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      } else if (isTallyScanRequired) {
        log.audit({
          title: 'isTallyScanRequired',
          details: isTallyScanRequired
        });
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });

        for (var lotvalue = 0; lotvalue < lotArray.length; lotvalue++) {
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: Number(Big(tallyQtyArr[lotvalue]).div(stockConversionRate))
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'receiptinventorynumber',
            value: lotArray[lotvalue]
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });

          if (inventoryStatusFeature) {
            if (processType == 'cartPutaway') {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'inventorystatus',
                value: fromStatus
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: statusArray[lotvalue]
              });
            } else {
              if (processType == 'cart') {
                toStatus = statusArray[lotvalue];
              }

              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'inventorystatus',
                value: statusArray[lotvalue]
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: toStatus
              });
            }
          }

          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      } else {
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        compSubRecord.selectNewLine({
          sublistId: 'inventoryassignment'
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: quantity
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'receiptinventorynumber',
          value: batchno
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: fromBinId
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'tobinnumber',
          value: toBinId
        });

        if (inventoryStatusFeature) {
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'inventorystatus',
            value: fromStatus
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'toinventorystatus',
            value: toStatus
          });
        }

        compSubRecord.commitLine({
          sublistId: 'inventoryassignment'
        });
      }
    } else {
      var filterssertemp = [];
      filterssertemp.push(search.createFilter({
        name: 'custrecord_wmsse_ser_status',
        operator: search.Operator.IS,
        values: false
      }));

      if (utility.isValueValid(processType) && processType == 'replen') {
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_tasktype',
          operator: search.Operator.ANYOF,
          values: [17]
        }));
      } else {
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_tasktype',
          operator: search.Operator.ANYOF,
          values: 9
        }));
      }

      if (utility.isValueValid(processType) && processType == 'replen') {
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_bin',
          operator: search.Operator.ANYOF,
          values: toBinId
        }));
      } else {
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_bin',
          operator: search.Operator.ANYOF,
          values: fromBinId
        }));
      }

      filterssertemp.push(search.createFilter({
        name: 'custrecord_wmsse_ser_item',
        operator: search.Operator.ANYOF,
        values: itemId
      }));
      var columns = [];
      columns.push(search.createColumn('custrecord_wmsse_ser_no'));
      columns.push(search.createColumn('name'));
      var SrchRecordTmpSeriaObj = search.create({
        type: 'customrecord_wmsse_serialentry',
        filters: filterssertemp,
        columns: columns
      });
      var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(SrchRecordTmpSeriaObj);
      log.debug({
        title: 'SrchRecordTmpSerial1',
        details: SrchRecordTmpSerial1
      });

      if (SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 != '') {
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        var serialMatchFound = true;
        var serialNameDtlArr = [];
        var serialName = "";
        var currentUserId = runtime.getCurrentUser().id;

        for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
          serialMatchFound = true;
          serialName = SrchRecordTmpSerial1[n].name;

          if (serialName) {
            serialNameDtlArr = serialName.split("^");

            if (serialNameDtlArr.length == 3) {
              if (utility.isValueValid(processType) && processType == 'replen') {
                if (serialNameDtlArr[0] != "replen" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && processType == 'cartPutaway') {
                if (serialNameDtlArr[0] != "cartPutaway" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && processType == 'cart') {
                if (serialNameDtlArr[0] != "cartPutaway" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && processType == 'putAway') {
                if (serialNameDtlArr[0] != "putAway" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && (processType == 'binTransfer' || processType == 'BinTransfer')) if (serialNameDtlArr[0] != "binTransfer" && serialNameDtlArr[0] != "BinTransfer" || serialNameDtlArr[1] != currentUserId) {
                serialMatchFound = false;
              }
            } else {}
          }

          log.debug("serialMatchFound", serialMatchFound);

          if (serialMatchFound) {
            compSubRecord.selectNewLine({
              sublistId: 'inventoryassignment'
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'quantity',
              value: 1
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'receiptinventorynumber',
              value: SrchRecordTmpSerial1[n]['custrecord_wmsse_ser_no']
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'binnumber',
              value: fromBinId
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'tobinnumber',
              value: toBinId
            });

            if (inventoryStatusFeature) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'inventorystatus',
                value: fromStatus
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: toStatus
              });
            }

            compSubRecord.commitLine({
              sublistId: 'inventoryassignment'
            });
          }
        }

        var serialMatchFound = true;
        var serialNameDtlArr = [];
        var currentUserId = runtime.getCurrentUser().id;
        var serialName = "";

        for (var j = 0; j < SrchRecordTmpSerial1.length; j++) {
          var TempRecord = SrchRecordTmpSerial1[j];
          serialMatchFound = true;
          serialName = TempRecord.name;

          if (serialName) {
            serialNameDtlArr = serialName.split("^");

            if (serialNameDtlArr.length == 3) {
              if (utility.isValueValid(processType) && processType == 'replen') {
                if (serialNameDtlArr[0] != "replen" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && processType == 'cartPutaway') {
                if (serialNameDtlArr[0] != "cartPutaway" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && processType == 'cart') {
                if (serialNameDtlArr[0] != "cart" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && processType == 'putAway') {
                if (serialNameDtlArr[0] != "putAway" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              } else if (utility.isValueValid(processType) && (processType == 'binTransfer' || processType == 'BinTransfer')) if (serialNameDtlArr[0] != "binTransfer" && serialNameDtlArr[0] != "BinTransfer" || serialNameDtlArr[1] != currentUserId) {
                serialMatchFound = false;
              }
            } else {}
          }

          if (serialMatchFound) {
            var serialRec = record.load({
              type: 'customrecord_wmsse_serialentry',
              id: TempRecord.id
            });
            serialRec.setValue({
              fieldId: 'id',
              value: TempRecord.id
            });
            serialRec.setValue({
              fieldId: 'name',
              value: TempRecord.name
            });
            serialRec.setValue({
              fieldId: 'custrecord_wmsse_ser_note1',
              value: 'because of discontinue of serial number scanning we have marked this serial number as closed'
            });
            serialRec.setValue({
              fieldId: 'custrecord_wmsse_ser_status',
              value: true
            });
            serialRec.save();
          }

          TempRecord = null;
        }
      }
    }

    binTransfer.commitLine({
      sublistId: 'inventory'
    });
    var inventoryCountId = binTransfer.save();
    log.debug({
      title: 'inventoryCountId',
      details: inventoryCountId
    });
    var taskType = "MOVE";
    var Qty = quantity;

    if (opentaskQty != null && opentaskQty != '' && opentaskQty != 'null' && opentaskQty != 'undefined') {
      Qty = opentaskQty;
    }

    var opentaskObj = {};
    var opentaskId = '';
    var impactedRec = {};
    opentaskObj.itemType = itemType;
    opentaskObj.whLocation = whLocation;
    opentaskObj.itemId = itemId;
    opentaskObj.quantity = Qty;
    opentaskObj.fromBinId = fromBinId;
    opentaskObj.toBinId = toBinId;
    opentaskObj.batchno = batchno;
    opentaskObj.inventoryCountId = inventoryCountId;
    opentaskObj.taskType = taskType;
    opentaskObj.actwhLocation = '';
    opentaskObj.soInternalId = '';
    opentaskObj.actualBeginTime = actualBeginTime;
    opentaskObj.units = units;
    opentaskObj.stockConversionRate = stockConversionRate;
    opentaskObj.fromStatus = fromStatus;
    opentaskObj.toStatus = toStatus;
    opentaskObj.toStatus = toStatus;
    opentaskObj.processType = bintransferObj.processType;
    opentaskObj.puStratagieId = bintransferObj.puStratagieId;
    opentaskObj.recomendedBinId = bintransferObj.recomendedBinId;
    opentaskObj.recomendedBinSequenceNo = bintransferObj.recomendedBinSequenceNo;
    opentaskId = updateMoveOpenTaskforInventory(opentaskObj);
    impactedRec['opentaskId'] = opentaskId;
    impactedRec['inventoryCountId'] = inventoryCountId;
    return impactedRec;
  }

  function putawayallBinTransfer(bintransferObj) {
    // for both bintransfer,binputaway same function
    log.debug({
      title: 'bintransferObj',
      details: bintransferObj
    });
    var itemType = bintransferObj.itemType;
    var whLocation = bintransferObj.whLocation;
    var itemId = bintransferObj.itemId;
    var quantity = bintransferObj.quantity;
    var fromBinId = bintransferObj.fromBinId;
    var toBinId = bintransferObj.toBinId;
    var batchno = bintransferObj.batchno;
    var actualBeginTime = bintransferObj.actualBeginTime;
    var units = bintransferObj.units;
    var stockConversionRate = bintransferObj.stockConversionRate;
    var opentaskQty = bintransferObj.opentaskQty;
    var fromStatus = bintransferObj.fromStatus;
    var toStatus = bintransferObj.toStatus;
    var fromStatusarr = bintransferObj.fromStatusarr;
    var toStatusarr = bintransferObj.toStatusarr;
    var quantityArr = bintransferObj.quantityarr;
    var actionType = bintransferObj.actionType;
    var processType = bintransferObj.processType;
    var toStatusInternalId = bintransferObj.toStatusInternalId;
    var allowAllLots = 'T';
    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
    var batchnoArr = [];
    var statusArr = [];
    var quantityArr = [];
    var vlotNo = "";
    var vstatus = "";
    var objBinDetails = getPickBinDetailsLotWithExpiryDates(itemId, fromBinId, '', whLocation, null, units, stockConversionRate, allowAllLots, null, null, null, batchno, itemType);
    log.debug({
      title: 'objBinDetails',
      details: objBinDetails.length
    });

    if (objBinDetails != null && objBinDetails.length > 0) {
      for (var bindetail in objBinDetails) {
        var binTransferQty = objBinDetails[bindetail]['availableqty'];
        if (binTransferQty == null || binTransferQty == '') binTransferQty = 0;

        if (actionType != 'loadToCartFromStage' && utility.isValueValid(stockConversionRate) && binTransferQty > 0) {
          binTransferQty = Number(Big(binTransferQty).toFixed(8));
        }

        if (quantity == null || quantity == '') quantity = 0;
        quantity = Number(Big(quantity).plus(binTransferQty));
        vlotNo = objBinDetails[bindetail]['lotnumber'];
        vstatus = objBinDetails[bindetail]['statusid'];
        quantityArr.push(binTransferQty);
        batchnoArr.push(vlotNo);
        if (inventoryStatusFeature) statusArr.push(vstatus);
      }

      var binTransfer = record.create({
        type: record.Type.BIN_TRANSFER,
        isDynamic: true
      });
      binTransfer.setValue({
        fieldId: 'location',
        value: whLocation
      });
      var currDate = utility.DateStamp();
      var parsedCurrentDate = format.parse({
        value: currDate,
        type: format.Type.DATE
      });
      binTransfer.setValue({
        fieldId: 'trandate',
        value: parsedCurrentDate
      });
      binTransfer.selectNewLine({
        sublistId: 'inventory'
      });
      binTransfer.setCurrentSublistValue({
        sublistId: 'inventory',
        fieldId: 'item',
        value: itemId
      });
      binTransfer.setCurrentSublistValue({
        sublistId: 'inventory',
        fieldId: 'quantity',
        value: quantity
      });

      if (utility.isValueValid(units) && utility.isValueValid(actionType) && actionType == 'loadToCartFromStage') {
        binTransfer.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'itemunits',
          value: units
        });
      }

      if (itemType == "inventoryitem" || itemType == "assemblyitem") {
        var statusLength = statusArr.length;

        if (statusLength == 0) {
          statusLength = 1;
        }

        for (var len = 0; len < statusLength; len++) {
          var compSubRecord = binTransfer.getCurrentSublistSubrecord({
            sublistId: 'inventory',
            fieldId: 'inventorydetail'
          });
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: quantity
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });

          if (inventoryStatusFeature) {
            if (statusLength > 0) {
              fromStatus = statusArr[len];
              toStatus = statusArr[len];
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity',
                value: quantityArr[len]
              });
            }

            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'inventorystatus',
              value: fromStatus
            });

            if (processType == 'BinTransfer' && utility.isValueValid(toStatusInternalId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: toStatusInternalId
              });
            } else {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: toStatus
              });
            }
          }

          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      } else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem" || itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
        var compSubRecord = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });

        for (var putawayall = 0; putawayall < batchnoArr.length; putawayall++) {
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });

          if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'quantity',
              value: 1
            });
          } else {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'quantity',
              value: quantityArr[putawayall]
            });
          }

          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'receiptinventorynumber',
            value: batchnoArr[putawayall]
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });

          if (inventoryStatusFeature) {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'inventorystatus',
              value: statusArr[putawayall]
            });

            if (processType == 'BinTransfer' && utility.isValueValid(toStatusInternalId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: toStatusInternalId
              });
            } else {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'toinventorystatus',
                value: statusArr[putawayall]
              });
            }
          }

          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      }

      binTransfer.commitLine({
        sublistId: 'inventory'
      });
      var inventoryCountId = binTransfer.save();
      log.debug({
        title: 'inventoryCountId',
        details: inventoryCountId
      });
      var taskType = "MOVE";
      var Qty = quantity;
      var opentaskObj = {};
      var opentaskId = '';
      var impactedRec = {};
      opentaskObj['itemType'] = itemType;
      opentaskObj['whLocation'] = whLocation;
      opentaskObj['itemId'] = itemId;
      opentaskObj['quantity'] = Number(Big(Qty).div(stockConversionRate));
      opentaskObj['fromBinId'] = fromBinId;
      opentaskObj['toBinId'] = toBinId;
      opentaskObj['batchno'] = batchnoArr;
      opentaskObj['inventoryCountId'] = inventoryCountId;
      opentaskObj['taskType'] = taskType;
      opentaskObj['actwhLocation'] = '';
      opentaskObj['soInternalId'] = '';
      opentaskObj['actualBeginTime'] = actualBeginTime;
      opentaskObj['units'] = units;
      opentaskObj['stockConversionRate'] = stockConversionRate;
      opentaskObj['fromStatus'] = fromStatus;
      opentaskObj['toStatus'] = toStatus;
      opentaskObj['processType'] = bintransferObj.processType;
      opentaskObj['puStratagieId'] = bintransferObj.puStratagieId;
      opentaskObj['recomendedBinId'] = bintransferObj.recomendedBinId;
      opentaskObj['recomendedBinSequenceNo'] = bintransferObj.recomendedBinSequenceNo;
      opentaskId = updateMoveOpenTaskforInventory(opentaskObj);
      impactedRec['opentaskId'] = opentaskId;
      impactedRec['inventoryCountId'] = inventoryCountId;
      return impactedRec;
    }
  }

  function transferallInvTransfer(invtransferObj) {
    log.debug({
      title: 'bintransferObj',
      details: invtransferObj
    });
    var itemType = invtransferObj['itemType'];
    var whLocation = invtransferObj['whLocation'];
    var towhLocation = invtransferObj['towhLocation'];
    var itemId = invtransferObj['itemId'];
    var quantity = invtransferObj['quantity'];
    var fromBinId = invtransferObj['fromBinId'];
    var toBinId = invtransferObj['toBinId'];
    var batchnoArr = invtransferObj['batchno'];
    var actualBeginTime = invtransferObj['actualBeginTime'];
    var units = invtransferObj['units'];
    var stockConversionRate = invtransferObj['stockConversionRate'];
    var opentaskQty = invtransferObj['opentaskQty'];
    var fromLocUseBinsFlag = invtransferObj['fromLocUseBinsFlag'];
    var allowAllLots = 'T';
    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
    var batchnoArr = [];
    var statusArr = [];
    var quantityArr = [];
    var fromStatusarr = [];
    var toStatusarr = [];
    var vlotNo = "";
    var vstatus = "";
    var objBinDetails = getPickBinDetailsLotWithExpiryDates(itemId, fromBinId, '', whLocation, null, units, stockConversionRate, allowAllLots, null, null, null, null, itemType, fromLocUseBinsFlag);
    log.debug({
      title: 'objBinDetails',
      details: objBinDetails.length
    });

    if (objBinDetails != null && objBinDetails.length > 0) {
      for (var bindetail in objBinDetails) {
        var binTransferQty = objBinDetails[bindetail]['availableqty'];
        if (binTransferQty == null || binTransferQty == '') binTransferQty = 0;
        if (quantity == null || quantity == '') quantity = 0;
        binTransferQty = Number(Big(binTransferQty).toFixed(8));
        quantity = Number(Big(quantity).plus(binTransferQty));
        vlotNo = objBinDetails[bindetail]['lotnumber'];
        vstatus = objBinDetails[bindetail]['statusid'];
        quantityArr.push(binTransferQty);
        batchnoArr.push(vlotNo);
        log.debug({
          title: 'vstatus',
          details: vstatus
        });

        if (inventoryStatusFeature) {
          fromStatusarr.push(vstatus);
          toStatusarr.push(vstatus);
        }
      }
    }

    var invTransfer = record.create({
      type: record.Type.INVENTORY_TRANSFER,
      isDynamic: true
    });
    var vSubsidiaryVal = utility.getSubsidiaryforLocation(whLocation);

    if (vSubsidiaryVal != null && vSubsidiaryVal != '') {
      invTransfer.setValue({
        fieldId: 'subsidiary',
        value: vSubsidiaryVal
      });
    }

    invTransfer.setValue({
      fieldId: 'location',
      value: whLocation
    });
    invTransfer.setValue({
      fieldId: 'transferlocation',
      value: towhLocation
    });
    var currDate = utility.DateStamp();
    var parsedCurrentDate = format.parse({
      value: currDate,
      type: format.Type.DATE
    });
    invTransfer.setValue({
      fieldId: 'trandate',
      value: parsedCurrentDate
    });
    invTransfer.selectNewLine({
      sublistId: 'inventory'
    });
    invTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'item',
      value: itemId
    });
    invTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'adjustqtyby',
      value: quantity
    });

    if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
      var compSubRecord = invTransfer.getCurrentSublistSubrecord({
        sublistId: 'inventory',
        fieldId: 'inventorydetail'
      });

      for (var putawayall = 0; putawayall < batchnoArr.length; putawayall++) {
        compSubRecord.selectNewLine({
          sublistId: 'inventoryassignment'
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: parseFloat(quantityArr[putawayall])
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'receiptinventorynumber',
          value: batchnoArr[putawayall]
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: fromBinId
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'tobinnumber',
          value: toBinId
        });
        compSubRecord.commitLine({
          sublistId: 'inventoryassignment'
        });
      }
    } else {
      var compSubRecord = invTransfer.getCurrentSublistSubrecord({
        sublistId: 'inventory',
        fieldId: 'inventorydetail'
      });

      for (var n = 0; n < batchnoArr.length; n++) {
        compSubRecord.selectNewLine({
          sublistId: 'inventoryassignment'
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: 1
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'receiptinventorynumber',
          value: batchnoArr[n]
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: fromBinId
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'tobinnumber',
          value: toBinId
        });
        compSubRecord.commitLine({
          sublistId: 'inventoryassignment'
        });
      }
    }

    invTransfer.commitLine({
      sublistId: 'inventory'
    });
    var inventoryCountId = invTransfer.save();
    log.debug({
      title: 'inventoryCountId',
      details: inventoryCountId
    });
    var taskType = "XFER";
    var Qty = quantity;

    if (opentaskQty != null && opentaskQty != '' && opentaskQty != 'null' && opentaskQty != 'undefined') {
      Qty = opentaskQty;
    }

    var opentaskObj = {};
    var opentaskId = '';
    var impactedRec = {};
    opentaskObj['itemType'] = itemType;
    opentaskObj['whLocation'] = whLocation;
    opentaskObj['itemId'] = itemId;
    opentaskObj['quantity'] = Qty;
    opentaskObj['fromBinId'] = fromBinId;
    opentaskObj['toBinId'] = toBinId;
    opentaskObj['batchno'] = batchnoArr.toString();
    opentaskObj['inventoryCountId'] = inventoryCountId;
    opentaskObj['taskType'] = taskType;
    opentaskObj['actwhLocation'] = '';
    opentaskObj['soInternalId'] = '';
    opentaskObj['actualBeginTime'] = actualBeginTime;
    opentaskObj['units'] = units;
    opentaskObj['stockConversionRate'] = stockConversionRate;
    opentaskId = updateMoveOpenTaskforInventory(opentaskObj);
    impactedRec['opentaskId'] = opentaskId;
    impactedRec['inventoryCountId'] = inventoryCountId;
    return impactedRec;
  }

  function inventoryInvTransfer(invtransferObj) {
    log.debug({
      title: 'invtransferObj',
      details: invtransferObj
    });
    var itemType = invtransferObj.itemType;
    var whLocation = invtransferObj.whLocation;
    var towhLocation = invtransferObj.towhLocation;
    var itemId = invtransferObj.itemId;
    var quantity = invtransferObj.quantity;
    var fromBinId = invtransferObj.fromBinId;
    var toBinId = invtransferObj.toBinId;
    var batchno = invtransferObj.batchno;
    var actualBeginTime = invtransferObj.actualBeginTime;
    var units = invtransferObj.units;
    var stockConversionRate = invtransferObj.stockConversionRate;
    var opentaskQty = invtransferObj.opentaskQty;
    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
    log.debug('inventoryStatusFeature', inventoryStatusFeature);
    var isTallyScanRequired = invtransferObj.isTallyScanRequired;
    var tallyQtyArr = invtransferObj.tallyQtyArr;
    var lotArray = invtransferObj.lotArray;
    var department = invtransferObj.department.toLowerCase();
    var customer = invtransferObj.customer.toLowerCase();
    var employee = invtransferObj.preparedBy.toLowerCase();
    var invTransfer = record.create({
      type: record.Type.INVENTORY_TRANSFER,
      isDynamic: true
    });
    if (stockConversionRate == null || stockConversionRate == '' || stockConversionRate == undefined) stockConversionRate = 1;
    var vSubsidiaryVal = utility.getSubsidiaryforLocation(whLocation);

    if (vSubsidiaryVal != null && vSubsidiaryVal != '') {
      invTransfer.setValue({
        fieldId: 'subsidiary',
        value: vSubsidiaryVal
      });
    }

    invTransfer.setValue({
      fieldId: 'location',
      value: whLocation
    });
    invTransfer.setValue({
      fieldId: 'transferlocation',
      value: towhLocation
    });
    var currDate = utility.DateStamp();
    var parsedCurrentDate = format.parse({
      value: currDate,
      type: format.Type.DATE
    });
    invTransfer.setValue({
      fieldId: 'trandate',
      value: parsedCurrentDate
    });
    var queryResult = query.runSuiteQL({
      query: "SELECT (select id from department where lower(name) LIKE '" + department + "') as Department, (select id from customer where lower(companyname) like '" + customer + "') as Customer, (select id from employee where entityid like '" + employee + "') as Employee"
    });
    log.debug('Employee', employee);
    log.debug('Query Result', queryResult.results[0].values); // [9,7428,14974]

    var departmentId = queryResult.results[0].values[0];
    var customerId = queryResult.results[0].values[1];
    var employeeId = queryResult.results[0].values[2];
    var deliveryDate = new Date(Date.parse(invtransferObj.deliveryDate));
    log.debug('Delivery Date', deliveryDate);
    invTransfer.setValue({
      fieldId: 'department',
      value: departmentId
    });
    invTransfer.setValue({
      fieldId: 'custbody41',
      value: customerId
    });
    invTransfer.setValue({
      fieldId: 'custbody1',
      value: employeeId
    });
    invTransfer.selectNewLine({
      sublistId: 'inventory'
    });
    invTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'item',
      value: itemId
    });
    invTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'adjustqtyby',
      value: quantity
    });
    invTransfer.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'custcol4',
      value: deliveryDate
    });

    if (itemType == "inventoryitem" || itemType == "assemblyitem") {
      //getting use bins for item
      var columnArray = [];
      columnArray.push('usebins');
      var itemUseBins = true;

      if (utility.isValueValid(itemId)) {
        var itemUseBinRes = utility.getItemFieldsByLookup(itemId, columnArray);

        if (utility.isValueValid(itemUseBinRes)) {
          itemUseBins = itemUseBinRes.usebins;
        }
      }

      if (utility.isValueValid(fromBinId) || utility.isValueValid(toBinId) && utility.isValueValid(itemUseBins) && itemUseBins == true || inventoryStatusFeature) {
        var compSubRecord = invTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        var complinelength = compSubRecord.getLineCount({
          sublistId: 'inventoryassignment'
        });

        if (complinelength > 0 && (itemType == "inventoryitem" || itemType == "assemblyitem")) {
          for (var invtassignmentLine = 0; invtassignmentLine < complinelength; invtassignmentLine++) {
            compSubRecord.removeLine({
              sublistId: 'inventoryassignment',
              line: invtassignmentLine
            });
          }

          complinelength = 0;
        }

        if (isTallyScanRequired == true && inventoryStatusFeature == true) {
          for (var statusvalue = 0; statusvalue < statusArray.length; statusvalue++) {
            compSubRecord.selectNewLine({
              sublistId: 'inventoryassignment'
            });
            if (tallyQtyArr[statusvalue] == null || tallyQtyArr[statusvalue] == '' || tallyQtyArr[statusvalue] == undefined) tallyQtyArr[statusvalue] = 0;
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'quantity',
              value: Number(Big(tallyQtyArr[statusvalue]).div(stockConversionRate))
            });

            if (utility.isValueValid(fromBinId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'binnumber',
                value: fromBinId
              });
            }

            if (utility.isValueValid(toBinId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'tobinnumber',
                value: toBinId
              });
            }

            compSubRecord.commitLine({
              sublistId: 'inventoryassignment'
            });
          }
        } else {
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: quantity
          });

          if (utility.isValueValid(fromBinId)) {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'binnumber',
              value: fromBinId
            });
          }

          if (utility.isValueValid(toBinId)) {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'tobinnumber',
              value: toBinId
            });
          }

          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      }
    } else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
      if (isTallyScanRequired == true) {
        var compSubRecord = invTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });

        for (var lotvalue = 0; lotvalue < lotArray.length; lotvalue++) {
          if (tallyQtyArr[lotvalue] == null || tallyQtyArr[lotvalue] == '' || tallyQtyArr[lotvalue] == undefined) tallyQtyArr[lotvalue] = 0;
          tallyQtyArr[lotvalue] = Number(Big(tallyQtyArr[lotvalue]).div(stockConversionRate));
          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: tallyQtyArr[lotvalue]
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'receiptinventorynumber',
            value: lotArray[lotvalue]
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });
          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        }
      } else {
        var compSubRecord = invTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        compSubRecord.selectNewLine({
          sublistId: 'inventoryassignment'
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: quantity
        });
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'receiptinventorynumber',
          value: batchno
        });

        if (utility.isValueValid(fromBinId)) {
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'binnumber',
            value: fromBinId
          });
        }

        if (utility.isValueValid(toBinId)) {
          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'tobinnumber',
            value: toBinId
          });
        }

        compSubRecord.commitLine({
          sublistId: 'inventoryassignment'
        });
      }
    } else {
      var filterssertemp = [];
      filterssertemp.push(search.createFilter({
        name: 'custrecord_wmsse_ser_tasktype',
        operator: search.Operator.ANYOF,
        values: 9
      }));

      if (utility.isValueValid(fromBinId)) {
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_bin',
          operator: search.Operator.ANYOF,
          values: fromBinId
        }));
      }

      filterssertemp.push(search.createFilter({
        name: 'custrecord_wmsse_ser_item',
        operator: search.Operator.ANYOF,
        values: itemId
      }));
      var columns = [];
      columns.push(search.createColumn('custrecord_wmsse_ser_no'));
      columns.push(search.createColumn('name'));
      var SrchRecordTmpSeriaObj = search.create({
        type: 'customrecord_wmsse_serialentry',
        filters: filterssertemp,
        columns: columns
      });
      var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(SrchRecordTmpSeriaObj);
      log.debug({
        title: 'SrchRecordTmpSerial1',
        details: SrchRecordTmpSerial1
      });

      if (SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 != '') {
        var compSubRecord = invTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });
        var serialMatchFound = true;
        var serialNameDtlArr = [];
        var serialName = "";
        var currentUserId = runtime.getCurrentUser().id;

        for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
          serialName = SrchRecordTmpSerial1[n].name;
          serialMatchFound = true;

          if (serialName) {
            serialNameDtlArr = serialName.split("^");

            if (serialNameDtlArr.length == 3) {
              if (serialNameDtlArr[0] != "inventoryTransfer" || serialNameDtlArr[1] != currentUserId) {
                serialMatchFound = false;
              }
            }
          }

          if (serialMatchFound) {
            compSubRecord.selectNewLine({
              sublistId: 'inventoryassignment'
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'quantity',
              value: 1
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'receiptinventorynumber',
              value: SrchRecordTmpSerial1[n].custrecord_wmsse_ser_no
            });

            if (utility.isValueValid(fromBinId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'binnumber',
                value: fromBinId
              });
            }

            if (utility.isValueValid(toBinId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'tobinnumber',
                value: toBinId
              });
            }

            compSubRecord.commitLine({
              sublistId: 'inventoryassignment'
            });
          }
        }

        var serialName = "";
        var serialNameDtlArr = [];
        var serialMatchFound = true;

        for (var j = 0; j < SrchRecordTmpSerial1.length; j++) {
          var TempRecord = SrchRecordTmpSerial1[j];
          serialName = TempRecord.name;
          serialMatchFound = true;

          if (serialName) {
            serialNameDtlArr = serialName.split("^");

            if (serialNameDtlArr.length == 3) {
              if (serialNameDtlArr[0] != "inventoryTransfer" || serialNameDtlArr[1] != currentUserId) {
                serialMatchFound = false;
              }
            }
          }

          if (serialMatchFound) {
            var serialRec = record.load({
              type: 'customrecord_wmsse_serialentry',
              id: TempRecord.id
            });
            serialRec.setValue({
              fieldId: 'id',
              value: TempRecord.id
            });
            serialRec.setValue({
              fieldId: 'name',
              value: TempRecord.name
            });
            serialRec.setValue({
              fieldId: 'custrecord_wmsse_ser_note1',
              value: 'because of discontinue of serial number scanning we have marked this serial number as closed'
            });
            serialRec.save();
          }

          TempRecord = null;
        }
      }
    }

    invTransfer.commitLine({
      sublistId: 'inventory'
    });
    var inventoryCountId = invTransfer.save();
    log.debug({
      title: 'inventoryCountId',
      details: inventoryCountId
    });
    var taskType = "XFER";
    var Qty = quantity;

    if (opentaskQty != null && opentaskQty != '' && opentaskQty != 'null' && opentaskQty != 'undefined') {
      Qty = opentaskQty;
    }

    var opentaskObj = {};
    var opentaskId = '';
    var impactedRec = {};
    opentaskObj.itemType = itemType;
    opentaskObj.whLocation = whLocation;
    opentaskObj.itemId = itemId;
    opentaskObj.quantity = Qty;
    opentaskObj.fromBinId = fromBinId;
    opentaskObj.toBinId = toBinId;
    opentaskObj.batchno = batchno;
    opentaskObj.inventoryCountId = inventoryCountId;
    opentaskObj.taskType = taskType;
    opentaskObj.actwhLocation = '';
    opentaskObj.soInternalId = '';
    opentaskObj.actualBeginTime = actualBeginTime;
    opentaskObj.units = units;
    opentaskObj.stockConversionRate = stockConversionRate;
    opentaskId = updateMoveOpenTaskforInventory(opentaskObj);
    impactedRec.opentaskId = opentaskId;
    impactedRec.inventoryCountId = inventoryCountId;
    return impactedRec;
  }

  function getPickBinDetailsLotWithExpiryDates(getItemInternalId, vBinIdArr, getPreferBin, strLocation, makeInvAvailFlagFromSelect, itemUnitType, itemStockUnit, allowAllLots, selectedConversionRate, stockConversionUnitname, selectedUOMText, batchno, itemType, locUseBinsFlag) {
    var systemRule_AllowExpiredItems = ' ';

    if (allowAllLots != 'T') {
      systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?', strLocation);
    }

    var objBinDetails = [];
    var vBinLocArr = [];
    var invBalanceSearch = search.load({
      id: 'customsearch_wmsse_invblnc_itemsqtyrslts',
      type: search.Type.INVENTORY_BALANCE
    });
    var filters = invBalanceSearch.filters;
    log.debug({
      title: 'batchno',
      details: batchno
    });

    if (getItemInternalId != null && getItemInternalId != '') {
      filters.push(search.createFilter({
        name: 'internalid',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: getItemInternalId
      }));
    }

    if (utility.isValueValid(batchno)) {
      filters.push(search.createFilter({
        name: 'inventorynumber',
        operator: search.Operator.ANYOF,
        values: batchno
      }));
    }

    if (strLocation != null && strLocation != '') {
      filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: strLocation
      }));
    }

    if (vBinIdArr != null && vBinIdArr != '') {
      filters.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: vBinIdArr
      }));
    }

    if (makeInvAvailFlagFromSelect != null && makeInvAvailFlagFromSelect != '' && makeInvAvailFlagFromSelect != 'null' && makeInvAvailFlagFromSelect != 'undefined' && makeInvAvailFlagFromSelect != undefined) {
      if (makeInvAvailFlagFromSelect == 'T' || makeInvAvailFlagFromSelect == 'F') {
        filters.push(search.createFilter({
          name: 'inventoryavailable',
          join: 'inventorystatus',
          operator: search.Operator.IS,
          values: makeInvAvailFlagFromSelect
        }));
      } else {
        if (makeInvAvailFlagFromSelect != 'All') {
          filters.push(search.createFilter({
            name: 'status',
            operator: search.Operator.ANYOF,
            values: makeInvAvailFlagFromSelect
          }));
        }
      }
    }

    if ((systemRule_AllowExpiredItems == 'N' || systemRule_AllowExpiredItems == '') && allowAllLots != 'T') {
      var currDate = utility.DateStamp();
      currDate = format.parse({
        value: currDate,
        type: format.Type.DATE
      });
      currDate = format.format({
        value: currDate,
        type: format.Type.DATE
      });
      var dateFormat = utility.DateSetting();
      var defalutExpiryDate = utility.setExpiryDate(dateFormat, '01', '01', '2199');
      filters.push(search.createFilter({
        name: 'formuladate',
        operator: search.Operator.ONORAFTER,
        formula: "NVL({inventorynumber.expirationdate},TO_DATE('" + defalutExpiryDate + "','" + dateFormat + "'))",
        values: currDate
      }));
    }

    invBalanceSearch.filters = filters;
    objBinDetails = utility.getSearchResults(invBalanceSearch);

    if (objBinDetails.length > 0) {
      for (var binItr in objBinDetails) {
        // No need to check status Makeavailable flag
        var vBinQtyAvail = objBinDetails[binItr].getValue({
          name: 'available',
          summary: 'SUM'
        });
        vBinQtyAvail = parseFloat(vBinQtyAvail);

        if (parseFloat(vBinQtyAvail) > 0) {
          var vValidBinId = objBinDetails[binItr].getValue({
            name: 'binnumber',
            summary: 'GROUP'
          });
          var vValidBin = objBinDetails[binItr].getText({
            name: 'binnumber',
            summary: 'GROUP'
          });
          var vBinInvNum = objBinDetails[binItr].getText({
            name: 'inventorynumber',
            summary: 'GROUP'
          });
          var vBinStatus = objBinDetails[binItr].getText({
            name: 'status',
            summary: 'GROUP'
          });
          var vValidBinStatusId = objBinDetails[binItr].getValue({
            name: 'status',
            summary: 'GROUP'
          });
          var vLotExp = objBinDetails[binItr].getValue({
            name: 'expirationdate',
            summary: 'GROUP',
            join: 'inventoryNumber'
          });

          if (vValidBin != getPreferBin || locUseBinsFlag != 'undefined' && locUseBinsFlag != undefined && locUseBinsFlag == false) {
            var availableQuantityWithUOM = vBinQtyAvail + " " + (utility.isValueValid(selectedUOMText) ? selectedUOMText : stockConversionUnitname);

            if (utility.isValueValid(selectedConversionRate) && utility.isValueValid(itemStockUnit) && selectedConversionRate != itemStockUnit) {
              vBinQtyAvail = utility.uomConversions(vBinQtyAvail, selectedConversionRate, itemStockUnit);
              availableQuantityWithUOM = vBinQtyAvail + " " + selectedUOMText;
            }

            var currRow = {
              'binnumber': vValidBin,
              'availableqty': vBinQtyAvail,
              'bininternalid': vValidBinId,
              'lotnumber': vBinInvNum,
              'lotexpirydate': vLotExp,
              'status': vBinStatus,
              'statusid': vValidBinStatusId,
              'availableQuantityWithUOM': availableQuantityWithUOM
            };
            vBinLocArr.push(currRow);
          }
        }
      }
    }

    log.debug({
      title: 'vBinLocArr',
      details: vBinLocArr
    });
    return vBinLocArr;
  }

  function fnGetBinsbyZones(strPickZone, strLocation) {
    var binSearchObj = search.load({
      id: 'customsearch_wmsse_binssort_byinternalid'
    });
    var binSearchFilters = binSearchObj.filters;

    if (utility.isValueValid(strPickZone) && strPickZone != '-None-') {
      binSearchFilters.push(search.createFilter({
        name: 'custrecord_wmsse_zone',
        operator: search.Operator.ANYOF,
        values: strPickZone
      }));
    }

    if (utility.isValueValid(strLocation)) {
      binSearchFilters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: strLocation
      }));
    }

    binSearchFilters.push(search.createFilter({
      name: 'inactive',
      operator: search.Operator.IS,
      values: false
    }));
    binSearchObj.filters = binSearchFilters;
    var objBinByZoneDetails = utility.getSearchResultInJSON(binSearchObj);
    return objBinByZoneDetails;
  }

  function fnGetBinsbyZonesAlongWithStage(strPickZone, strLocation) {
    var binSearchObj = search.load({
      id: 'customsearch_wmsse_binsbypickzonewithstg'
    });
    var binSearchFilters = binSearchObj.filters;

    if (utility.isValueValid(strPickZone) && strPickZone != '-None-') {
      binSearchFilters.push(search.createFilter({
        name: 'custrecord_wmsse_zone',
        operator: search.Operator.ANYOF,
        values: strPickZone
      }));
    }

    if (utility.isValueValid(strLocation)) {
      binSearchFilters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: strLocation
      }));
    }

    binSearchFilters.push(search.createFilter({
      name: 'inactive',
      operator: search.Operator.IS,
      values: false
    }));
    binSearchObj.filters = binSearchFilters;
    var objBinByZoneDetails = utility.getSearchResultInJSON(binSearchObj);
    return objBinByZoneDetails;
  }

  function _getItemWiseDetails(binInternalId, whLocationId, itemInternalId, lotInternalId) {
    var searchObj = search.load({
      id: 'customsearch_wmsse_itemwise_inventory',
      type: search.Type.ITEM
    });

    if (utility.isValueValid(itemInternalId)) {
      searchObj.filters.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: itemInternalId
      }));
    }

    if (utility.isValueValid(whLocationId)) {
      searchObj.filters.push(search.createFilter({
        name: 'location',
        join: 'binOnHand',
        operator: search.Operator.ANYOF,
        values: whLocationId
      }));
    }

    if (utility.isValueValid(binInternalId)) {
      searchObj.filters.push(search.createFilter({
        name: 'binnumber',
        join: 'binOnHand',
        operator: search.Operator.ANYOF,
        values: binInternalId
      }));
    }

    var inventoryDetailsResults = utility.getSearchResultInJSON(searchObj);
    return inventoryDetailsResults;
  }

  function _getValidBinInternalIdWithLocationTypeInv(Binnumber, warehouseLocationId) {
    var searchrecordSearch = search.load({
      id: 'customsearch_wmsse_woqty_bin_srh'
    });
    var filter = searchrecordSearch.filters;
    filter.push(search.createFilter({
      name: 'binnumber',
      operator: search.Operator.IS,
      values: Binnumber
    }));
    if (utility.isValueValid(warehouseLocationId)) filter.push(search.createFilter({
      name: 'location',
      operator: search.Operator.ANYOF,
      values: warehouseLocationId
    }));
    searchrecordSearch.filters = filter;
    var binSearchResults = utility.getSearchResultInJSON(searchrecordSearch);
    return binSearchResults;
  }

  function _InvokeNSInventoryAdjustment(nsInvAdjObj) {
    log.debug('nsInvAdjObj in invt utility file', nsInvAdjObj);
    var adjInventoryId = '';
    var itemInternalId = nsInvAdjObj.itemInternalId;
    var itemType = nsInvAdjObj.itemType;
    var warehouseLocationId = nsInvAdjObj.warehouseLocationId;
    var scannedQuantity = nsInvAdjObj.scannedQuantity;
    var enterBin = nsInvAdjObj.binInternalId;
    var expiryDate = nsInvAdjObj.expiryDate;
    var lot = nsInvAdjObj.lotName;
    var notes = nsInvAdjObj.notes;
    var date = nsInvAdjObj.date;
    var period = nsInvAdjObj.period;
    var accountNo = nsInvAdjObj.accountNo;
    var inventoryStatus = nsInvAdjObj.statusInternalId;
    var units = nsInvAdjObj.units;
    var stockConversionRate = nsInvAdjObj.stockConversionRate;
    var vAccountNo = accountNo;
    var vCost = 0;
    var vAvgCost = 0;
    var vItemname = '';
    var avgcostlot = 0;
    var openTaskId = '';
    var errorMessage = "";
    var itemSearch = search.load({
      id: 'customsearch_wmsse_inv_basic_itemdetails'
    });
    itemSearch.filters.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.IS,
      values: itemInternalId
    }));
    itemSearch.filters.push(search.createFilter({
      name: 'isinactive',
      operator: search.Operator.IS,
      values: false
    }));

    if (warehouseLocationId != null && warehouseLocationId != '' && warehouseLocationId != 'null' && warehouseLocationId != 'undefined' && warehouseLocationId > 0) {
      itemSearch.filters.push(search.createFilter({
        name: 'inventorylocation',
        operator: search.Operator.ANYOF,
        values: warehouseLocationId
      }));
    }

    itemSearch.columns.push(search.createColumn({
      name: 'cost'
    }));
    itemSearch.columns.push(search.createColumn({
      name: 'locationaveragecost'
    }));
    itemSearch.columns.push(search.createColumn({
      name: 'itemid'
    }));
    var itemObj = utility.getSearchResultInJSON(itemSearch);

    if (itemObj.length > 0) {
      vItemname = itemObj[0].itemid;
      vCost = itemObj[0].cost;
      vAvgCost = itemObj[0].locationaveragecost;
    }

    try {
      var adjInventory = record.create({
        type: record.Type.INVENTORY_ADJUSTMENT,
        isDynamic: true
      });
      var subs = runtime.isFeatureInEffect({
        feature: 'subsidiaries'
      });

      if (subs == true) {
        var vSubsidiaryVal = utility.getSubsidiaryforLocation(warehouseLocationId);

        if (vSubsidiaryVal != null && vSubsidiaryVal != '') {
          adjInventory.setValue({
            fieldId: 'subsidiary',
            value: vSubsidiaryVal
          });
        }
      }

      var vConfig = config.load({
        type: config.Type.ACCOUNTING_PREFERENCES
      });

      if (utility.isValueValid(vConfig)) {
        var preferencesFlag = vConfig.getValue({
          fieldId: 'LOCMANDATORY'
        });
        log.debug('preferencesFlag', preferencesFlag);

        if (utility.isValueValid(preferencesFlag) && preferencesFlag === true) {
          adjInventory.setValue({
            fieldId: 'adjlocation',
            value: warehouseLocationId
          });
        }
      }

      if (utility.isValueValid(vAccountNo)) {
        adjInventory.setValue({
          fieldId: 'account',
          value: vAccountNo
        });
      } else {
        adjInventory.setValue({
          fieldId: 'account',
          value: 1
        });
      }

      adjInventory.setValue({
        fieldId: 'memo',
        value: notes
      });
      adjInventory.setCurrentSublistValue({
        sublistId: 'inventory',
        fieldId: 'item',
        value: itemInternalId
      });
      adjInventory.setCurrentSublistValue({
        sublistId: 'inventory',
        fieldId: 'location',
        value: warehouseLocationId
      });
      adjInventory.setCurrentSublistValue({
        sublistId: 'inventory',
        fieldId: 'adjustqtyby',
        value: scannedQuantity
      });
      var currDate = utility.DateStamp();
      var parsedCurrentDate = format.parse({
        value: currDate,
        type: format.Type.DATE
      });

      if (utility.isValueValid(date)) {
        adjInventory.setValue({
          fieldId: 'trandate',
          value: parsedCurrentDate
        });
      }

      if (utility.isValueValid(period)) {
        adjInventory.setValue({
          fieldId: 'postingperiod',
          value: period
        });
      }

      if (utility.isValueValid(vAvgCost)) {
        adjInventory.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'unitcost',
          value: vAvgCost
        });
      } else {
        adjInventory.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'unitcost',
          value: vCost
        });
      }

      if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
        var tempQty;

        if (parseFloat(scannedQuantity) < 0) {
          tempQty = -1;
        } else {
          tempQty = 1;
        }

        var filterssertemp = [];
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_status',
          operator: search.Operator.IS,
          values: false
        }));
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_tasktype',
          operator: search.Operator.ANYOF,
          values: 10
        }));
        filterssertemp.push(search.createFilter({
          name: 'custrecord_wmsse_ser_item',
          operator: search.Operator.ANYOF,
          values: itemInternalId
        }));
        var columns = [];
        columns.push(search.createColumn('custrecord_wmsse_ser_no'));
        columns.push(search.createColumn('name'));
        var SrchRecordTmpSeriaObj = search.create({
          type: 'customrecord_wmsse_serialentry',
          filters: filterssertemp,
          columns: columns
        });
        var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(SrchRecordTmpSeriaObj);
        log.debug('SrchRecordTmpSerial1', SrchRecordTmpSerial1);

        if (SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 != "") {
          log.debug('SrchRecordTmpSerial1.length', SrchRecordTmpSerial1.length);
          var compSubRecord = adjInventory.getCurrentSublistSubrecord({
            sublistId: 'inventory',
            fieldId: 'inventorydetail'
          });
          var serialName = "";
          var serialNameDtlArr = [];
          var serialMatchFound = true;
          var currentUserId = runtime.getCurrentUser().id;

          for (var x = 0; x < SrchRecordTmpSerial1.length; x++) {
            serialMatchFound = true;
            serialName = SrchRecordTmpSerial1[x].name;

            if (serialName) {
              serialNameDtlArr = serialName.split("^");

              if (serialNameDtlArr.length == 3) {
                if (serialNameDtlArr[0] != "createInventory" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              }
            }

            if (serialMatchFound) {
              compSubRecord.selectNewLine({
                sublistId: 'inventoryassignment'
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity',
                value: tempQty
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'receiptinventorynumber',
                value: SrchRecordTmpSerial1[x].custrecord_wmsse_ser_no
              });

              if (utility.isValueValid(enterBin)) {
                compSubRecord.setCurrentSublistValue({
                  sublistId: 'inventoryassignment',
                  fieldId: 'binnumber',
                  value: enterBin
                });
              }

              if (inventoryStatus) {
                compSubRecord.setCurrentSublistValue({
                  sublistId: 'inventoryassignment',
                  fieldId: 'inventorystatus',
                  value: inventoryStatus
                });
              }

              compSubRecord.commitLine({
                sublistId: 'inventoryassignment'
              });
            }
          }

          var serialName = "";
          var serialNameDtlArr = [];
          var serialMatchFound = true;

          for (var j = 0; j < SrchRecordTmpSerial1.length; j++) {
            serialMatchFound = true;
            var TempRecord = SrchRecordTmpSerial1[j];
            serialName = TempRecord.name;

            if (serialName) {
              serialNameDtlArr = serialName.split("^");

              if (serialNameDtlArr.length == 3) {
                if (serialNameDtlArr[0] != "createInventory" || serialNameDtlArr[1] != currentUserId) {
                  serialMatchFound = false;
                }
              }
            }

            if (serialMatchFound) {
              var serialRec = record.load({
                type: 'customrecord_wmsse_serialentry',
                id: TempRecord.id
              });
              serialRec.setValue({
                fieldId: 'customrecord_wmsse_serialentry',
                value: TempRecord.id
              });
              serialRec.setValue({
                fieldId: 'custrecord_wmsse_ser_note1',
                value: 'because of discontinue of serial number scanning we have marked this serial number as closed'
              });
              serialRec.setValue({
                fieldId: 'custrecord_wmsse_ser_status',
                value: true
              });
              serialRec.save();
            }

            TempRecord = null;
          }
        }
      } else if (itemType == "inventoryitem" || itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem" || itemType == "assemblyitem") {
        try {
          var compSubRecord = adjInventory.getCurrentSublistSubrecord({
            sublistId: 'inventory',
            fieldId: 'inventorydetail'
          });
          var complinelength = compSubRecord.getLineCount({
            sublistId: 'inventoryassignment'
          });

          if (complinelength > 0 && !utility.isValueValid(enterBin) && (itemType == "inventoryitem" || itemType == "assemblyitem")) {
            for (var invtassignmentLine = 0; invtassignmentLine < complinelength; invtassignmentLine++) {
              compSubRecord.removeLine({
                sublistId: 'inventoryassignment',
                line: 0
              });
            }

            complinelength = 0;
          }

          compSubRecord.selectNewLine({
            sublistId: 'inventoryassignment'
          });
          log.debug('enterBin1 enterBin1', enterBin);
          log.debug('scannedQuantity scannedQuantity', scannedQuantity);
          log.debug('enterBin enterBin', enterBin);

          if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
            if (utility.isValueValid(lot)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'receiptinventorynumber',
                value: lot
              });
            }

            if (utility.isValueValid(expiryDate)) {
              var parsedExpiryDate = format.parse({
                value: expiryDate,
                type: format.Type.DATE
              });
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'expirationdate',
                value: parsedExpiryDate
              });
            }
          }

          if (utility.isValueValid(enterBin)) {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'binnumber',
              value: enterBin
            });
          }

          compSubRecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: scannedQuantity
          });
          log.debug('inventoryStatus inventoryStatus', inventoryStatus);

          if (inventoryStatus != null && inventoryStatus != '') {
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'inventorystatus',
              value: inventoryStatus
            });
          }

          log.debug('inventoryStatusafter inventoryStatus', inventoryStatus);
          compSubRecord.commitLine({
            sublistId: 'inventoryassignment'
          });
        } catch (e) {
          log.error({
            title: 'error',
            details: e
          });
        }
      }

      adjInventory.commitLine({
        sublistId: 'inventory'
      });
      adjInventoryId = adjInventory.save();
      log.debug('into inv item adjInventoryId', adjInventoryId);
    } catch (e) {
      //adjInventoryId = 'INVALID_KEY_OR_REF';
      adjInventoryId = '';
      errorMessage = e.message;
      log.debug('e', e);
    }

    if (adjInventoryId != null && adjInventoryId != '') {
      var taskType = "INVT";
      var opentaskObj = {};
      opentaskObj.itemType = itemType;
      opentaskObj.whLocation = warehouseLocationId;
      opentaskObj.itemId = itemInternalId;
      opentaskObj.quantity = scannedQuantity;
      opentaskObj.fromBinId = enterBin;
      opentaskObj.toBinId = enterBin;
      opentaskObj.batchno = lot;
      opentaskObj.inventoryCountId = adjInventoryId;
      opentaskObj.taskType = taskType;
      opentaskObj.units = units;
      opentaskObj.stockConversionRate = stockConversionRate;
      opentaskObj.fromStatus = inventoryStatus;
      openTaskId = updateMoveOpenTaskforInventory(opentaskObj);
    }

    var outputObj = {};
    outputObj.adjInventoryId = adjInventoryId;
    outputObj.openTaskId = openTaskId;

    if (adjInventoryId == null || adjInventoryId == '') {
      outputObj.errorMessage = errorMessage;
    }

    log.debug('outputObj outputObj', outputObj);
    return outputObj;
  }

  function getItemMixFlag(itemNo, binInternalId, strLocation, BinLocation) {
    var resultArray = [];
    var mixFlag = "T";
    var mixLotFlag = "T";
    var isValid = 'T';
    var useBins = true;
    var errorMsg = "";
    var searchrecordSearch = search.load({
      id: 'customsearch_wmsse_inv_basic_itemdetails'
    });
    var filter = searchrecordSearch.filters;
    filter.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.ANYOF,
      values: itemNo
    }));
    searchrecordSearch.columns.push(search.createColumn({
      name: 'custitem_wmsse_mix_item'
    }));
    searchrecordSearch.columns.push(search.createColumn({
      name: 'usebins'
    }));
    searchrecordSearch.columns.push(search.createColumn({
      name: 'custitem_wmsse_mix_lot'
    }));
    searchrecordSearch.filters = filter;
    var searchRes = utility.getSearchResultInJSON(searchrecordSearch);

    if (searchRes != null && searchRes != "") {
      mixFlag = searchRes[0]['custitem_wmsse_mix_item'];
      useBins = searchRes[0]['usebins'];
      mixLotFlag = searchRes[0]['custitem_wmsse_mix_lot'];
    }

    var getPreferBin = '';
    var searchrecordSearch = search.load({
      id: 'customsearch_wmsse_inventory_itemdetails'
    });
    var preferBinfilter = searchrecordSearch.filters;
    preferBinfilter.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.ANYOF,
      values: itemNo
    }));
    preferBinfilter.push(search.createFilter({
      name: 'isinactive',
      operator: search.Operator.ANYOF,
      values: false
    }));

    if (utility.isValueValid(strLocation)) {
      preferBinfilter.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: ['@NONE@', strLocation]
      }));
    }

    searchrecordSearch.columns.push(search.createColumn({
      name: 'itemid'
    }));
    searchrecordSearch.filters = preferBinfilter;
    var itemresults = utility.getSearchResultInJSON(searchrecordSearch);

    if (itemresults != null && itemresults != '') {
      if (itemresults[0]['preferredbin'] == true) {
        getPreferBin = itemresults[0]['binnumber'];
      }
    }

    if (mixFlag == false && getPreferBin != BinLocation) {
      var objInvDetails = search.load({
        id: 'customsearch_wmsse_itemwise_inventory'
      });
      var filterStrat = objInvDetails.filters;
      filterStrat.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.NONEOF,
        values: itemNo
      }));
      filterStrat.push(search.createFilter({
        name: 'quantityonhand',
        join: 'binOnHand',
        operator: search.Operator.GREATERTHAN,
        values: 0
      }));

      if (strLocation != null && strLocation != '') {
        filterStrat.push(search.createFilter({
          name: 'location',
          join: 'binOnHand',
          operator: search.Operator.ANYOF,
          values: strLocation
        }));
      }

      if (binInternalId != null && binInternalId != '') {
        filterStrat.push(search.createFilter({
          name: 'binnumber',
          join: 'binOnHand',
          operator: search.Operator.ANYOF,
          values: binInternalId
        }));
      }

      objInvDetails.columns.push(search.createColumn({
        name: 'binnumber'
      }));
      objInvDetails.filters = filterStrat;
      var objInvDetailsRes = utility.getSearchResultInJSON(objInvDetails);

      if (objInvDetailsRes.length > 0) {
        isValid = 'F';
      }
    } else if (mixFlag == true) {
      var objInvDetailsRes = utility.getItemMixFlagDetails(strLocation, itemNo, binInternalId, true, null);

      if (objInvDetailsRes.length > 0) {
        isValid = 'F';
        errorMsg = translator.getTranslationString("CREATE_INVENTORY.INVALID_BIN");
      }
    }

    var currRow = {
      'isValid': isValid,
      'useBins': useBins,
      'mixLotFlag': mixLotFlag,
      'errorMsg': errorMsg
    };
    resultArray.push(currRow);
    return resultArray;
  }

  function validateLocationForAccNo(whLocation) {
    var isValid = '';
    var accountNo = '';
    var vSubsid = utility.getSubsidiaryforLocation(whLocation);
    var searchRec = search.load({
      id: 'customsearch_wmsse_locsearchresults'
    });
    searchRec.filters.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.ANYOF,
      values: whLocation
    }));
    searchRec.columns.push(search.createColumn({
      name: 'custrecord_wmsse_wms_account'
    }));
    var searchRes = utility.getSearchResultInJSON(searchRec);

    if (searchRes.length > 0) {
      var searcObj = searchRes[0];
      accountNo = searcObj['custrecord_wmsse_wms_account'];

      if (utility.isValueValid(accountNo)) {
        isValid = accountNo;
      } else {
        var searchRec = search.load({
          id: 'customsearch_wms_account_search'
        });
        searchRec.filters.push(search.createFilter({
          name: 'isinactive',
          operator: search.Operator.IS,
          values: false
        }));

        if (vSubsid != null && vSubsid != '' && vSubsid != 'null') {
          searchRec.filters.push(search.createFilter({
            name: 'subsidiary',
            operator: search.Operator.ANYOF,
            values: vSubsid
          }));
        }

        searchRec.columns.push(search.createColumn({
          name: 'internalid'
        }));
        var searchRes = utility.getSearchResultInJSON(searchRec);

        if (searchRes != '' && searchRes != 'null' && searchRes != null && searchRes != 'undefined') {
          isValid = searchRes[0]['internalidText'];
        }
      }
    }

    return isValid;
  }

  function getReplenItemsList(warehouseLocationId, itemInternalId, toBinInternalId, currentUserId, recordInternalId) {
    var replentaskDetailsSearch = search.load({
      id: 'customsearch_wmsse_rpln_getopentask_srh'
    });
    var replenFilters = replentaskDetailsSearch.filters;

    if (utility.isValueValid(warehouseLocationId)) {
      replenFilters.push(search.createFilter({
        name: 'custrecord_wmsse_wms_location',
        operator: search.Operator.ANYOF,
        values: warehouseLocationId
      }));
    }

    if (utility.isValueValid(itemInternalId)) {
      replenFilters.push(search.createFilter({
        name: 'custrecord_wmsse_sku',
        operator: search.Operator.ANYOF,
        values: itemInternalId
      }));
    }

    if (utility.isValueValid(toBinInternalId)) {
      replenFilters.push(search.createFilter({
        name: 'custrecord_wmsse_actendloc',
        operator: search.Operator.ANYOF,
        values: toBinInternalId
      }));
    }

    if (utility.isValueValid(recordInternalId)) {
      replenFilters.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: recordInternalId
      }));
    }

    replenFilters.push(search.createFilter({
      name: 'custrecord_wmsse_task_assignedto',
      operator: search.Operator.ANYOF,
      values: ['@NONE@', currentUserId]
    }));
    replentaskDetailsSearch.filters = replenFilters;
    var replenOpenTaskDetails = utility.getSearchResultInJSON(replentaskDetailsSearch);
    return replenOpenTaskDetails;
  }

  function getCyclePlanTaskDetails(planId, whLocationId, binName, itemInternalId, hideCompletedTaks, reconcilecountZeroqty, noBinExcepforReconcile, locUseBinsFlag) {
    var getCycPlanTasks = search.load({
      id: 'customsearch_wms_cyc_plan_task_list'
    });
    getCycPlanTasks.filters.push(search.createFilter({
      name: 'tranid',
      operator: search.Operator.IS,
      values: planId
    }));

    if (locUseBinsFlag != 'undefined' && locUseBinsFlag != undefined && locUseBinsFlag == false && utility.isValueValid(whLocationId)) {
      getCycPlanTasks.filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.IS,
        values: whLocationId
      }));
    } else if (utility.isValueValid(whLocationId)) {
      getCycPlanTasks.filters.push(search.createFilter({
        join: 'binnumber',
        name: 'location',
        operator: search.Operator.IS,
        values: whLocationId
      }));
    }

    if (utility.isValueValid(hideCompletedTaks)) getCycPlanTasks.filters.push(search.createFilter({
      name: 'quantity',
      operator: search.Operator.ISEMPTY
    }));
    if (utility.isValueValid(noBinExcepforReconcile)) getCycPlanTasks.filters.push(search.createFilter({
      name: 'quantity',
      operator: search.Operator.ISEMPTY
    }));
    if (utility.isValueValid(reconcilecountZeroqty)) getCycPlanTasks.filters.push(search.createFilter({
      name: 'quantity',
      operator: search.Operator.ISNOTEMPTY
    }));

    if (utility.isValueValid(binName)) {
      getCycPlanTasks.filters.push(search.createFilter({
        name: 'binnumber',
        join: 'binnumber',
        operator: search.Operator.IS,
        values: binName
      }));
    }

    if (utility.isValueValid(itemInternalId)) getCycPlanTasks.filters.push(search.createFilter({
      name: 'item',
      operator: search.Operator.ANYOF,
      values: itemInternalId
    }));
    return utility.getSearchResultInJSON(getCycPlanTasks);
  }

  function inventoryCountPosting(invCountPostingObj) {
    var inventoryCountId = '';
    var compSubRecord = '';
    var invDtlSubRecord = '';
    var planInternalId = invCountPostingObj.planInternalId;
    var planLineNo = invCountPostingObj.planLineNo;
    var enterQty = invCountPostingObj.enterQty;
    var itemType = invCountPostingObj.itemType;
    var itemId = invCountPostingObj.itemId;
    var whLocation = invCountPostingObj.whLocation;
    var serialStatusArr = invCountPostingObj.serialStatusArr;
    var zeroQty = invCountPostingObj.zeroQty;
    var errorMessage = '';
    var conversionRate = invCountPostingObj.conversionRate;
    var isTallyScanRequired = invCountPostingObj.isTallyScanRequired;

    if (!utility.isValueValid(isTallyScanRequired)) {
      isTallyScanRequired = false;
    }

    if (!utility.isValueValid(isTallyScanRequired)) {
      conversionRate = conversionRate = null;
    }

    try {
      if ((itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") && (isTallyScanRequired == true || isTallyScanRequired == 'true') && utility.isValueValid(conversionRate)) {
        enterQty = Number(Big(enterQty).div(conversionRate));
      }

      var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
      var vInvRec = record.load({
        type: 'inventorycount',
        id: planInternalId
      });
      var lineNo = (parseInt(planLineNo) + 2) / 3 - 1;
      vInvRec.setSublistValue({
        sublistId: 'item',
        fieldId: 'countquantity',
        line: lineNo,
        value: enterQty
      });
      vInvRec.setSublistValue({
        sublistId: 'item',
        fieldId: 'location',
        line: lineNo,
        value: whLocation
      });

      if (zeroQty == 'zeroQty') {
        inventoryCountId = vInvRec.save();
        return {
          'inventoryCountId': inventoryCountId,
          'errorMessage': errorMessage
        };
      } else if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
        var vBinOpenTaskSerialArr = [];
        var vBinOpenTaskBinIdArr = [];
        var vBinOpenTaskBinQtyArr = [];
        var serialArray = '';
        var statusArray = '';
        var openTaskSrch = search.load({
          id: 'customsearch_wmsse_opentask_search'
        });
        openTaskSrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_order_no',
          operator: search.Operator.ANYOF,
          values: planInternalId
        }));
        openTaskSrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_line_no',
          operator: search.Operator.EQUALTO,
          values: planLineNo
        }));
        openTaskSrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_parent_sku_no',
          operator: search.Operator.ANYOF,
          values: itemId
        }));
        openTaskSrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_currentdate',
          operator: search.Operator.ISEMPTY
        }));

        if (inventoryStatusFeature == true) {
          openTaskSrch.columns.push(search.createColumn({
            name: 'custrecord_wmsse_serial_no'
          }));
          openTaskSrch.columns.push(search.createColumn({
            name: 'custrecord_wmsse_actendloc'
          }));
          openTaskSrch.columns.push(search.createColumn({
            name: 'custrecord_wmsse_inventorystatus'
          }));
        }

        var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(openTaskSrch);

        if (utility.isValueValid(SrchRecordTmpSerial1)) {
          invDtlSubRecord = vInvRec.getSublistSubrecord({
            sublistId: 'item',
            fieldId: 'countdetail',
            line: lineNo
          });

          if (utility.isValueValid(invDtlSubRecord)) {
            var complinelength = invDtlSubRecord.getLineCount({
              sublistId: 'inventorydetail'
            });

            if (parseInt(complinelength) > 0) {
              for (var r1 = 0; r1 < complinelength; r1++) {
                invDtlSubRecord.removeLine({
                  sublistId: 'inventorydetail',
                  line: 0
                });
              }
            }
          }

          if (inventoryStatusFeature == true) {
            for (var statsItr = 0; statsItr < serialStatusArr.length; statsItr++) {
              serialArray = '';
              statusArray = serialStatusArr[statsItr];

              for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
                var statusArr = SrchRecordTmpSerial1[n]['custrecord_wmsse_inventorystatus'];

                if (statusArray == statusArr) {
                  if (!utility.isValueValid(serialArray)) {
                    serialArray = SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
                  } else {
                    serialArray = serialArray + "," + SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
                  }
                }
              }

              var totalSerialArray = serialArray.split(',');

              if (!utility.isValueValid(invDtlSubRecord)) {
                invDtlSubRecord = vInvRec.getSublistSubrecord({
                  sublistId: 'item',
                  fieldId: 'countdetail',
                  line: lineNo
                });
                var complinelength = invDtlSubRecord.getLineCount({
                  sublistId: 'inventorydetail'
                });
                log.debug('invDtlSubRecord of lot item new--', invDtlSubRecord);

                if (parseInt(complinelength) > 0) {
                  for (var r1 = 0; r1 < complinelength; r1++) {
                    log.debug('r1 of inventory lot new--', r1);
                    compSubRecord.removeLine({
                      sublistId: 'inventorydetail',
                      line: 0
                    });
                  }
                }
              }

              for (var k = 0; k < totalSerialArray.length; k++) {
                invDtlSubRecord.insertLine({
                  sublistId: 'inventorydetail',
                  line: k
                });
                invDtlSubRecord.setSublistValue({
                  sublistId: 'inventorydetail',
                  fieldId: 'quantity',
                  line: k,
                  value: 1
                });
                invDtlSubRecord.setSublistValue({
                  sublistId: 'inventorydetail',
                  fieldId: 'inventorynumber',
                  line: k,
                  value: totalSerialArray[k]
                });
                invDtlSubRecord.setSublistValue({
                  sublistId: 'inventorydetail',
                  fieldId: 'inventorystatus',
                  line: k,
                  value: statusArray
                });
              }
            }
          } else {
            for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
              if (!utility.isValueValid(serialArray)) {
                serialArray = SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
              } else {
                serialArray = serialArray + "," + SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
              }
            }

            log.debug({
              title: 'in non inv serialArray',
              details: serialArray
            });
            var totalSerialArray = serialArray.split(',');

            if (!utility.isValueValid(invDtlSubRecord)) {
              invDtlSubRecord = vInvRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'countdetail',
                line: lineNo
              });
            }

            for (var k = 0; k < totalSerialArray.length; k++) {
              invDtlSubRecord.insertLine({
                sublistId: 'inventorydetail',
                line: k
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'quantity',
                line: k,
                value: 1
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'inventorynumber',
                line: k,
                value: totalSerialArray[k]
              });
            }
          }
        }
      } else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
        var serialEntrySrch = search.load({
          id: 'customsearch_wmsse_serialentry_details'
        });
        serialEntrySrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_ser_status',
          operator: search.Operator.IS,
          values: 'F'
        }));
        serialEntrySrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_ser_ordline',
          operator: search.Operator.EQUALTO,
          values: planLineNo
        }));
        serialEntrySrch.filters.push(search.createFilter({
          name: 'custrecord_wmsse_ser_ordno',
          operator: search.Operator.ANYOF,
          values: planInternalId
        }));
        serialEntrySrch.columns.push(search.createColumn({
          name: 'custrecord_wmsse_ser_bin'
        }));
        serialEntrySrch.columns.push(search.createColumn({
          name: 'custrecord_wmsse_ser_qty'
        }));
        if (inventoryStatusFeature == true) serialEntrySrch.columns.push(search.createColumn({
          name: 'custrecord_serial_inventorystatus'
        }));
        var SrchRecordTmpLot1 = utility.getSearchResultInJSON(serialEntrySrch);
        compSubRecord = vInvRec.getSublistSubrecord({
          sublistId: 'item',
          fieldId: 'countdetail',
          line: lineNo
        });
        log.debug('compSubRecord 1111---', compSubRecord);
        var complinelength = compSubRecord.getLineCount({
          sublistId: 'inventorydetail'
        });
        log.debug('compSubRecord of lot item new--', compSubRecord);

        if (parseInt(complinelength) > 0) {
          for (var r1 = 0; r1 < complinelength; r1++) {
            log.debug('r1 of inventory item new--', r1);
            compSubRecord.removeLine({
              sublistId: 'inventorydetail',
              line: 0
            });
          }
        }

        if (utility.isValueValid(SrchRecordTmpLot1)) {
          for (var n = 0; n < SrchRecordTmpLot1.length; n++) {
            if (!utility.isValueValid(invDtlSubRecord)) {
              invDtlSubRecord = vInvRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'countdetail',
                line: lineNo
              });
            }

            invDtlSubRecord.insertLine({
              sublistId: 'inventorydetail',
              line: n
            });
            invDtlSubRecord.setSublistValue({
              sublistId: 'inventorydetail',
              fieldId: 'quantity',
              line: n,
              value: SrchRecordTmpLot1[n]['custrecord_wmsse_ser_qty']
            });
            invDtlSubRecord.setSublistValue({
              sublistId: 'inventorydetail',
              fieldId: 'inventorynumber',
              line: n,
              value: SrchRecordTmpLot1[n]['custrecord_wmsse_ser_no']
            });
            if (inventoryStatusFeature == true) invDtlSubRecord.setSublistValue({
              sublistId: 'inventorydetail',
              fieldId: 'inventorystatus',
              line: n,
              value: SrchRecordTmpLot1[n]['custrecord_serial_inventorystatus']
            });
          }
        }
      } else if (itemType == "inventoryitem" || itemType == "assemblyitem") {
        if (inventoryStatusFeature == true) {
          var serialEntrySrch = search.load({
            id: 'customsearch_wmsse_serialdetails_search'
          });
          serialEntrySrch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_status',
            operator: search.Operator.IS,
            values: 'F'
          }));
          serialEntrySrch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_ordline',
            operator: search.Operator.EQUALTO,
            values: planLineNo
          }));
          serialEntrySrch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_ordno',
            operator: search.Operator.ANYOF,
            values: planInternalId
          }));
          serialEntrySrch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_item',
            operator: search.Operator.ANYOF,
            values: itemId
          }));
          var SrchRecordTmpInv = utility.getSearchResultInJSON(serialEntrySrch);
          /*
           * var hasSubrecord = vInvRec.hasSublistSubrecord({
           * sublistId: 'item', fieldId: 'countdetail', line: lineNo
           * });
           * 
           * if(hasSubrecord){ vInvRec =
           * vInvRec.removeSublistSubrecord({ sublistId: 'item',
           * fieldId: 'countdetail', line: lineNo }); }
           */

          invDtlSubRecord = vInvRec.getSublistSubrecord({
            sublistId: 'item',
            fieldId: 'countdetail',
            line: lineNo
          });
          var complinelength = invDtlSubRecord.getLineCount({
            sublistId: 'inventorydetail'
          });
          log.debug('compSubRecord of inventory item new--', compSubRecord);

          if (parseInt(complinelength) > 0) {
            for (var r1 = 0; r1 < complinelength; r1++) {
              log.debug('r1 of inventory item new--', r1);
              invDtlSubRecord.removeLine({
                sublistId: 'inventorydetail',
                line: 0
              });
            }
          }

          if (utility.isValueValid(SrchRecordTmpInv)) {
            for (var invInvCount = 0; invInvCount < SrchRecordTmpInv.length; invInvCount++) {
              invDtlSubRecord.insertLine({
                sublistId: 'inventorydetail',
                line: invInvCount
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'quantity',
                line: invInvCount,
                value: SrchRecordTmpInv[invInvCount]['custrecord_wmsse_ser_qty']
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'inventorystatus',
                line: invInvCount,
                value: SrchRecordTmpInv[invInvCount]['custrecord_serial_inventorystatus']
              });
            }
          }
        }
      }

      inventoryCountId = vInvRec.save();
    } catch (e) {
      inventoryCountId = 'INVALID_KEY_OR_REF';
      errorMessage = e.message;
      log.debug('e', e);
    }

    return {
      'inventoryCountId': inventoryCountId,
      'errorMessage': errorMessage
    };
  }

  function inventoryCountPostingForNoBins(invCountPostingObj) {
    var inventoryCountId = '';
    var enterQty = invCountPostingObj.enterQty;
    var errorMessage = '';
    log.debug('invCountPostingObj', invCountPostingObj);

    try {
      var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
      var vInvRec = record.load({
        type: 'inventorycount',
        id: invCountPostingObj.planInternalId
      });
      var lineNo = (parseInt(invCountPostingObj.planLineNo) + 2) / 3 - 1;

      if (invCountPostingObj.action == 'newEntryBtnClicked') {
        var existingInvCountQuanity = vInvRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'countquantity',
          line: lineNo
        });
        enterQty = Number(Big(enterQty).plus(existingInvCountQuanity));
      } else if (invCountPostingObj.action == 'timeLinkClicked') {
        var existingInvCountQuanity = vInvRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'countquantity',
          line: lineNo
        });
        existingInvCountQuanity = Number(Big(existingInvCountQuanity).minus(invCountPostingObj.oldQtytimelink));
        enterQty = Number(Big(existingInvCountQuanity).plus(enterQty));
      }

      vInvRec.setSublistValue({
        sublistId: 'item',
        fieldId: 'countquantity',
        line: lineNo,
        value: enterQty
      });
      vInvRec.setSublistValue({
        sublistId: 'item',
        fieldId: 'location',
        line: lineNo,
        value: invCountPostingObj.whLocation
      }); //when nostock button is clicked from action timeLinkClicked only that particular record from inventory detail should be updated with zero qty

      if (parseFloat(enterQty) == 0) {
        log.debug('in no stock');
        inventoryCountId = vInvRec.save();
        return {
          'inventoryCountId': inventoryCountId,
          'errorMessage': errorMessage
        };
        ;
      } else if (invCountPostingObj.itemType == "serializedinventoryitem" || invCountPostingObj.itemType == "serializedassemblyitem") {
        invCountPostingNoBinsforSerialItem(invCountPostingObj, inventoryStatusFeature, vInvRec, lineNo);
      } else if (invCountPostingObj.itemType == "lotnumberedinventoryitem" || invCountPostingObj.itemType == "lotnumberedassemblyitem") {
        invCountPostingNoBinsforLotItem(invCountPostingObj, inventoryStatusFeature, vInvRec, lineNo);
      } else if (invCountPostingObj.itemType == "inventoryitem" || invCountPostingObj.itemType == "assemblyitem") {
        invCountPostingNoBinsforInvItem(invCountPostingObj, inventoryStatusFeature, vInvRec, lineNo);
      }

      inventoryCountId = vInvRec.save();
    } catch (e) {
      inventoryCountId = 'INVALID_KEY_OR_REF';
      errorMessage = e.message;
      log.debug('e', e);
    }

    return {
      'inventoryCountId': inventoryCountId,
      'errorMessage': errorMessage
    };
  }

  function createSerialEntry(lotName, cyclePlanInternalId, lineNum, itemInternalId, binInternalId, scannedQuantity, statusInternalId, inventoryStatusFeature) {
    var objRecord = record.create({
      type: 'customrecord_wmsse_serialentry'
    });
    objRecord.setValue({
      fieldId: 'name',
      value: lotName
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_ordno',
      value: cyclePlanInternalId
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_ordline',
      value: lineNum
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_item',
      value: itemInternalId
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_bin',
      value: binInternalId
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_qty',
      value: scannedQuantity
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_no',
      value: lotName
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_ser_status',
      value: false
    });
    if (inventoryStatusFeature) objRecord.setValue({
      fieldId: 'custrecord_serial_inventorystatus',
      value: statusInternalId
    });
    return objRecord.save();
  }

  function updateCycleCountOpenTask(cyclePlanInternalId, itemInternalId, lineNum, scannedQty, binInternalId, itemType, warehouseLocationId, batchno, inventoryCountRecId, cyclePlanId, actualBeginTime, units, conversionRate, vOpenBinQty, vBinOpenTaskSerialArr, status) {
    var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
    var objRecord = record.create({
      type: 'customrecord_wmsse_trn_opentask'
    });
    if (utility.isValueValid(cyclePlanId)) objRecord.setValue({
      fieldId: 'name',
      value: cyclePlanId
    });
    var parsedCurrentDate = format.parse({
      value: utility.DateStamp(),
      type: format.Type.DATE
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_act_begin_date',
      value: parsedCurrentDate
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_act_end_date',
      value: parsedCurrentDate
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_act_qty',
      value: scannedQty
    });

    if (utility.isValueValid(vOpenBinQty)) {
      if (itemType != "lotnumberedinventoryitem" && itemType != "lotnumberedassemblyitem") objRecord.setValue({
        fieldId: 'custrecord_wmsse_act_qty',
        value: Number((parseFloat(scannedQty) + parseFloat(vOpenBinQty)).toFixed(8))
      });
      var vNotes = "System is added " + vOpenBinQty + " qty because this qty is picked from bin location but item fulfillment is not yet posted";
      objRecord.setValue({
        fieldId: 'custrecord_wmsse_notes',
        value: vNotes
      });
    }

    objRecord.setValue({
      fieldId: 'custrecord_wmsse_sku',
      value: itemInternalId
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_line_no',
      value: lineNum
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_expe_qty',
      value: scannedQty
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_wms_status_flag',
      value: 31
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_tasktype',
      value: 7
    });
    if (utility.isValueValid(binInternalId)) objRecord.setValue({
      fieldId: 'custrecord_wmsse_actendloc',
      value: binInternalId
    });
    if (utility.isValueValid(units)) objRecord.setValue({
      fieldId: 'custrecord_wmsse_uom',
      value: units
    });
    if (utility.isValueValid(conversionRate)) objRecord.setValue({
      fieldId: 'custrecord_wmsse_conversionrate',
      value: conversionRate
    });
    if (utility.isValueValid(status)) objRecord.setValue({
      fieldId: 'custrecord_wmsse_inventorystatus',
      value: status
    });

    if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {
      if (utility.isValueValid(batchno)) {
        objRecord.setValue({
          fieldId: 'custrecord_wmsse_batch_num',
          value: batchno
        });
        var lotInternalId = utility.getLotInternalId(batchno);

        if (utility.isValueValid(lotInternalId)) {
          var lotDetails = search.lookupFields({
            type: search.Type.INVENTORY_NUMBER,
            id: lotInternalId,
            columns: ['inventorynumber', 'expirationdate']
          });
          var expDate = lotDetails['expirationdate'];
          log.debug('expDate', expDate);

          if (utility.isValueValid(expDate)) {
            expDate = format.parse({
              value: expDate,
              type: format.Type.DATE
            });
            objRecord.setValue({
              fieldId: 'custrecord_wmsse_expirydate',
              value: expDate
            });
          }
        }
      }
    }

    if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
      // if(inventoryStatusFeature == true){
      var vPickStatusIdArr = new Array();
      var SrchRecordTmpSerial1 = [];
      var serialArray = '';

      if (inventoryStatusFeature == true) {
        SrchRecordTmpSerial1 = fnGetAllSerialsbyStatus(cyclePlanInternalId, lineNum, status, SrchRecordTmpSerial1);
      } else {
        SrchRecordTmpSerial1 = getAllSerials(cyclePlanInternalId, lineNum);
      }

      if (SrchRecordTmpSerial1.length > 0) {
        /*
         * var objRecord = record.create({ type :
         * 'customrecord_wmsse_throwaway_parent' }); var serialparentid =
         * objRecord.submit();
         * 
         * var serialparent = record.load({ type :
         * 'customrecord_wmsse_throwaway_parent', id : serialparentid
         * });
         */
        for (var i in SrchRecordTmpSerial1) {
          if (utility.isValueValid(serialArray)) {
            serialArray = serialArray + "," + SrchRecordTmpSerial1[i]['custrecord_wmsse_ser_no'];
          } else {
            serialArray = SrchRecordTmpSerial1[i]['custrecord_wmsse_ser_no'];
          }

          var notes = "because of serial number is updated in opentask we have marked this serial number as closed";
          utility.closeSerialEntryStatusCycleCount(SrchRecordTmpSerial1[i], notes);
        } // serialparent.save();


        log.debug('vBinOpenTaskSerialArr', vBinOpenTaskSerialArr);

        if (utility.isValueValid(vBinOpenTaskSerialArr)) {
          for (var z in vBinOpenTaskSerialArr) {
            /*
             * if(utility.isValueValid(serialArray)){
             * //if(serialArray.indexOf(vBinOpenTaskSerialArr[z]) ==
             * -1) serialArray=vBinOpenTaskSerialArr[z]; }else{
             * if(serialArray.indexOf(vBinOpenTaskSerialArr[z]) ==
             * -1) serialArray =
             * serialArray+","+vBinOpenTaskSerialArr[z]; }
             */
            if (serialArray == '') {
              serialArray = vBinOpenTaskSerialArr[z];
            } else {
              serialArray = serialArray + "," + vBinOpenTaskSerialArr[z];
            }
          }
        }

        objRecord.setValue({
          fieldId: 'custrecord_wmsse_serial_no',
          value: serialArray
        });
      } else {
        if (utility.isValueValid(vBinOpenTaskSerialArr)) {
          for (var i in vBinOpenTaskSerialArr) {
            /*
             * if(utility.isValueValid(serialArray)){
             * if(serialArray.indexOf(vBinOpenTaskSerialArr[z]) ==
             * -1) serialArray=vBinOpenTaskSerialArr[z]; }else{
             * if(serialArray.indexOf(vBinOpenTaskSerialArr[z]) ==
             * -1) serialArray =
             * serialArray+","+vBinOpenTaskSerialArr[z]; }
             */
            if (serialArray == '') {
              serialArray = vBinOpenTaskSerialArr[z];
            } else {
              serialArray = serialArray + "," + vBinOpenTaskSerialArr[z];
            }
          }
        }

        objRecord.setValue({
          fieldId: 'custrecord_wmsse_serial_no',
          value: serialArray
        });
      }

      SrchRecordTmpSerial1 = null;
      var columnssertemp1 = null;
      var filterssertemp1 = null; // }

      /*
       * else{ var
       * SrchRecordTmpSerial1=getAllSerials(cyclePlanInternalId,poLineno);
       * var serialArray = ''; if(SrchRecordTmpSerial1.length > 0){ var
       * objRecord = record.create({ type :
       * 'customrecord_wmsse_throwaway_parent' }); var serialparentid =
       * objRecord.submit();
       * 
       * var serialparent = record.load({ type :
       * 'customrecord_wmsse_throwaway_parent', id : serialparentid }); } }
       */
    }

    objRecord.setValue({
      fieldId: 'custrecord_wmsse_order_no',
      value: cyclePlanInternalId
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_wms_location',
      value: warehouseLocationId
    });
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_parent_sku_no',
      value: itemInternalId
    });

    if (utility.isValueValid(inventoryCountRecId)) {
      objRecord.setValue({
        fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
        value: inventoryCountRecId
      });
    }

    var currentUserId = runtime.getCurrentUser().id;
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_upd_user_no',
      value: currentUserId
    });
    if (utility.isValueValid(actualBeginTime)) objRecord.setValue({
      fieldId: 'custrecord_wmsse_actualbegintime',
      value: utility.parseTimeString(actualBeginTime)
    });
    var endTime = utility.getCurrentTimeStamp();
    objRecord.setValue({
      fieldId: 'custrecord_wmsse_actualendtime',
      value: utility.parseTimeString(endTime)
    });
    var recId = objRecord.save();

    if (utility.isValueValid(recId)) {// createLockRecord(cyclePlanInternalId,'inventorycount',lineNum,currentUserId);
    }

    objRecord = null;
    return recId;
  }

  function deleteCycleCountOpenTask(cyclePlanInternalId, cyclePlanId, lineNum, itemInternalId, inventoryStatusFeature, action, locUseBinsFlag, wmsopentaskinternalid, NoStockAction, invItemofNoInvStatus) {
    var serialSearch = search.load({
      type: 'customrecord_wmsse_serialentry',
      id: 'customsearch_wmsse_serialentry_details'
    });
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: false
    }));
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordline',
      operator: search.Operator.EQUALTO,
      values: lineNum
    }));
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordno',
      operator: search.Operator.ANYOF,
      values: cyclePlanInternalId
    }));
    serialSearch.columns.push(search.createColumn({
      name: 'custrecord_wmsse_ser_bin'
    }));
    serialSearch.columns.push(search.createColumn({
      name: 'custrecord_wmsse_ser_qty'
    }));
    if (inventoryStatusFeature) serialSearch.columns.push(search.createColumn({
      name: 'custrecord_serial_inventorystatus'
    }));
    var serialSearchRes = utility.getSearchResultInJSON(serialSearch);

    if (serialSearchRes.length > 0 || NoStockAction == 'NoStock' || invItemofNoInvStatus == true) {
      var openTaskPlanSearch = search.load('customsearch_wmsse_opentask_search');
      openTaskPlanSearch.filters.push(search.createFilter({
        name: 'name',
        operator: search.Operator.IS,
        values: cyclePlanId
      }));
      openTaskPlanSearch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_wms_status_flag',
        operator: search.Operator.ANYOF,
        values: 31
      }));
      openTaskPlanSearch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_tasktype',
        operator: search.Operator.ANYOF,
        values: 7
      }));
      openTaskPlanSearch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_line_no',
        operator: search.Operator.EQUALTO,
        values: lineNum
      }));
      openTaskPlanSearch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_sku',
        operator: search.Operator.ANYOF,
        values: itemInternalId
      }));

      if (wmsopentaskinternalid != null && wmsopentaskinternalid != '' && locUseBinsFlag != 'undefined' && locUseBinsFlag != undefined && locUseBinsFlag == false && action == 'timeLinkClicked') {
        openTaskPlanSearch.filters.push(search.createFilter({
          name: 'internalid',
          operator: search.Operator.IS,
          values: wmsopentaskinternalid
        }));
      }

      var openTaskPlanDtls = utility.getSearchResultInJSON(openTaskPlanSearch);

      if (openTaskPlanDtls != null && openTaskPlanDtls != '' && openTaskPlanDtls.length > 0 && action != 'newEntryBtnClicked') {
        for (var openTaskCount = 0; openTaskCount < openTaskPlanDtls.length; openTaskCount++) {
          var recId = openTaskPlanDtls[openTaskCount]['id'];
          log.debug('recId which is deleting from open task', recId);
          var id = record["delete"]({
            type: 'customrecord_wmsse_trn_opentask',
            id: recId
          });
        }
      }
    }

    log.debug('delelteOpen Task serialSearchRes', serialSearchRes);
    return serialSearchRes;
  }

  function getInventoryBalanceDetails(warehouseLocationId, itemInternalId, binInternalId, locUseBinsFlag) {
    var invsearch = search.load({
      type: search.Type.INVENTORY_BALANCE,
      id: 'customsearch_wmsse_inv_report_invbalance'
    });
    invsearch.filters.push(search.createFilter({
      name: 'location',
      operator: search.Operator.ANYOF,
      values: warehouseLocationId
    }));
    invsearch.filters.push(search.createFilter({
      name: 'item',
      operator: search.Operator.ANYOF,
      values: itemInternalId
    }));

    if (locUseBinsFlag == true) {
      invsearch.filters.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: binInternalId
      }));
    }

    return utility.getSearchResultInJSON(invsearch);
  }

  function loadCyclePlanItemListForSeletedBin(cyclePlanId, warehouseLocationId, binInternalId, showCompletedFlag, locUseBinsFlag) {
    var itemListSearch = search.load({
      id: 'customsearch_wms_cycle_plan_item_list'
    });
    itemListSearch.filters.push(search.createFilter({
      name: 'tranid',
      operator: search.Operator.IS,
      values: cyclePlanId
    }));
    itemListSearch.filters.push(search.createFilter({
      name: 'location',
      operator: search.Operator.IS,
      values: warehouseLocationId
    }));

    if (locUseBinsFlag) {
      itemListSearch.filters.push(search.createFilter({
        name: 'internalid',
        join: 'binnumber',
        operator: search.Operator.IS,
        values: binInternalId
      }));

      if (showCompletedFlag == 'true') {
        itemListSearch.filters.push(search.createFilter({
          name: 'quantity',
          operator: search.Operator.ISNOTEMPTY
        }));
      } else {
        itemListSearch.filters.push(search.createFilter({
          name: 'quantity',
          operator: search.Operator.ISEMPTY
        }));
      }
    }

    return utility.getSearchResultInJSON(itemListSearch);
  }

  function updateMoveOpenTaskforInventory(opentaskObj) {
    var itemType = opentaskObj.itemType;
    var whLocation = opentaskObj.whLocation;
    var itemId = opentaskObj.itemId;
    var quantity = opentaskObj.quantity;
    var fromBinId = opentaskObj.fromBinId;
    var toBinId = opentaskObj.toBinId;
    var batchno = opentaskObj.batchno;
    var inventoryCountId = opentaskObj.inventoryCountId;
    var taskType = opentaskObj.taskType;
    var actwhLocation = opentaskObj.actwhLocation;
    var soInternalId = opentaskObj.soInternalId;
    var actualBeginTime = opentaskObj.actualBeginTime;
    var units = opentaskObj.units;
    var stockConversionRate = opentaskObj.stockConversionRate;
    var fromStatus = opentaskObj.fromStatus;
    var toStatus = opentaskObj.toStatus;
    var customrecord = record.create({
      type: 'customrecord_wmsse_trn_opentask'
    });
    var processType = opentaskObj.processType;

    if (utility.isValueValid(inventoryCountId)) {
      customrecord.setValue({
        fieldId: 'name',
        value: inventoryCountId
      });
    }

    var currDate = utility.DateStamp();
    var parsedCurrentDate = format.parse({
      value: currDate,
      type: format.Type.DATE
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_act_begin_date',
      value: parsedCurrentDate
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_act_end_date',
      value: parsedCurrentDate
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_act_qty',
      value: quantity
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_sku',
      value: itemId
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_expe_qty',
      value: quantity
    });

    if (taskType == "MOVE") {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_wms_status_flag',
        value: 19
      }); // storage

      customrecord.setValue({
        fieldId: 'custrecord_wmsse_tasktype',
        value: 9
      }); // For
      // MOVE

      if (utility.isValueValid(soInternalId)) {
        customrecord.setValue({
          fieldId: 'custrecord_wmsse_order_no',
          value: soInternalId
        });
      }
    } else if (taskType == "XFER") // For inventory transfer
      {
        customrecord.setValue({
          fieldId: 'custrecord_wmsse_wms_status_flag',
          value: 19
        }); // storage

        customrecord.setValue({
          fieldId: 'custrecord_wmsse_tasktype',
          value: 18
        });

        if (utility.isValueValid(actwhLocation)) {
          customrecord.setValue({
            fieldId: 'custrecord_wmsse_act_wms_location',
            value: actwhLocation
          });
        }

        if (utility.isValueValid(inventoryCountId)) {
          customrecord.setValue({
            fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
            value: inventoryCountId
          });
        }
      }

    if (utility.isValueValid(units)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_uom',
        value: units
      });
    }

    if (utility.isValueValid(stockConversionRate)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_conversionrate',
        value: stockConversionRate
      });
    }

    if (utility.isValueValid(fromBinId)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_actbeginloc',
        value: fromBinId
      });
    }

    if (utility.isValueValid(toBinId)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_actendloc',
        value: toBinId
      });
    }

    if (itemType == translator.getTranslationString("ITEMTYPE_LOT") || itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
      if (utility.isValueValid(batchno)) {
        customrecord.setValue({
          fieldId: 'custrecord_wmsse_batch_num',
          value: batchno
        });
      }
    }

    if (utility.isValueValid(actualBeginTime)) {
      var parsedBeginTime = utility.parseTimeString(actualBeginTime);
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_actualbegintime',
        value: parsedBeginTime
      });
    }

    var timeStamp = utility.getCurrentTimeStamp();
    var parsedCurrentTime = utility.parseTimeString(timeStamp);
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_actualendtime',
      value: parsedCurrentTime
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_wms_location',
      value: whLocation
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_parent_sku_no',
      value: itemId
    });

    if (utility.isValueValid(inventoryCountId) && taskType != "XFER") {
      if (taskType == "MOVE" && processType == 'cart') {
        var reccommendedBinId = opentaskObj['recomendedBinId'];
        var recomendedBinSequenceNo = opentaskObj['recomendedBinSequenceNo'];

        if (utility.isValueValid(reccommendedBinId)) {
          customrecord.setValue({
            fieldId: 'custrecord_wmsse_reccommendedbin',
            value: reccommendedBinId
          });
        }

        if (utility.isValueValid(recomendedBinSequenceNo)) {
          customrecord.setValue({
            fieldId: 'custrecord_wmsse_recomendedbinsequence',
            value: recomendedBinSequenceNo
          });
        }

        var puStratagieId = opentaskObj['puStratagieId'];

        if (utility.isValueValid(puStratagieId)) {
          customrecord.setValue({
            fieldId: 'custrecord_wmsse_put_strategy',
            value: puStratagieId
          });
        }
      }

      customrecord.setValue({
        fieldId: 'custrecord_wmsse_nsconfirm_ref_no',
        value: inventoryCountId
      });
    }

    if (utility.isValueValid(fromStatus)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_inventorystatus',
        value: fromStatus
      });
    }

    if (utility.isValueValid(toStatus)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_inventorystatusto',
        value: toStatus
      });
    }

    var currentUserID = runtime.getCurrentUser();
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_upd_user_no',
      value: currentUserID.id
    });
    var recid = customrecord.save();
    return recid;
  }

  function fnGetAllSerialsbyStatus(poInternalId, poLineno, vstatus, vAllSerialArray) {
    var serialSearch = search.load({
      type: 'customrecord_wmsse_serialentry',
      id: 'customsearch_wmsse_serialentry_statussrh'
    });
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: false
    }));
    if (utility.isValueValid(poLineno)) serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordline',
      operator: search.Operator.EQUALTO,
      values: poLineno
    }));
    if (utility.isValueValid(poInternalId)) serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordno',
      operator: search.Operator.ANYOF,
      values: poInternalId
    }));
    if (utility.isValueValid(vstatus)) serialSearch.filters.push(search.createFilter({
      name: 'custrecord_serial_inventorystatus',
      operator: search.Operator.ANYOF,
      values: vstatus
    }));
    var result = utility.getSearchResultInJSON(serialSearch);
    return result;
  }

  function getAllSerials(internalId, lineNum) {
    var serialSearch = search.load('customsearch_wms_get_all_serials');
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: false
    }));
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordline',
      operator: search.Operator.EQUALTO,
      values: lineNum
    }));
    serialSearch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordno',
      operator: search.Operator.ANYOF,
      values: internalId
    }));
    return utility.getSearchResultInJSON(serialSearch);
  }

  function getCYCCCountCompletedList(inputParamObj) {
    var CYCCCountCompletedSearch = search.load({
      id: 'customsearch_wms_cycc_countcompl_tasks'
    });
    var CYCCFilters = CYCCCountCompletedSearch.filters;

    if (utility.isValueValid(inputParamObj.warehouseLocationId)) {
      CYCCFilters.push(search.createFilter({
        name: 'custrecord_wmsse_wms_location',
        operator: search.Operator.ANYOF,
        values: inputParamObj.warehouseLocationId
      }));
    }

    if (utility.isValueValid(inputParamObj.itemInternalId)) {
      CYCCFilters.push(search.createFilter({
        name: 'custrecord_wmsse_sku',
        operator: search.Operator.ANYOF,
        values: inputParamObj.itemInternalId
      }));
    }

    if (utility.isValueValid(inputParamObj.cyclePlanInternalId)) {
      CYCCFilters.push(search.createFilter({
        name: 'custrecord_wmsse_order_no',
        operator: search.Operator.ANYOF,
        values: inputParamObj.cyclePlanInternalId
      }));
    }

    if (utility.isValueValid(inputParamObj.openTaskLineNum)) {
      CYCCFilters.push(search.createFilter({
        name: 'custrecord_wmsse_line_no',
        operator: search.Operator.IS,
        values: inputParamObj.openTaskLineNum
      }));
    }

    if (utility.isValueValid(inputParamObj.openTaskIdArray)) {
      CYCCFilters.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: inputParamObj.openTaskIdArray
      }));
    }

    CYCCCountCompletedSearch.filters = CYCCFilters;
    var CYCCOpenTaskDetails = utility.getSearchResultInJSON(CYCCCountCompletedSearch);
    return CYCCOpenTaskDetails;
  }
  /**
   * Timelink click : Get serials enterted from OpenTask and delete the OpenTask 
   * as another OpenTask will be created with modified quantity
   */


  function getSerialsFordelete(openTaskInternalId) {
    var serialArray = '';
    var serialSearch = search.load({
      id: 'customsearch_wmsse_opentask_search'
    });
    serialSearch.filters.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.IS,
      values: openTaskInternalId
    }));
    var serialSearchResults = utility.getSearchResultInJSON(serialSearch);
    log.debug('serialSearchResults', serialSearchResults);

    if (serialSearchResults.length > 0) {
      for (var n = 0; n < serialSearchResults.length; n++) {
        if (!utility.isValueValid(serialArray)) {
          serialArray = serialSearchResults[n]['custrecord_wmsse_serial_no'];
        } else {
          serialArray = serialArray + "," + serialSearchResults[n]['custrecord_wmsse_serial_no'];
        }
      }

      var openTaskid = record["delete"]({
        type: 'customrecord_wmsse_trn_opentask',
        id: openTaskInternalId
      });
    }

    return serialArray;
  }

  function invCountPostingNoBinsforLotItem(invCountPostingObj, inventoryStatusFeature, vInvRec, lineNo) {
    var compSubRecord = '';
    var invDtlSubRecord = '';
    var serialEntrySrch = search.load({
      id: 'customsearch_wmsse_serialentry_details'
    });
    serialEntrySrch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: 'F'
    }));
    serialEntrySrch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordline',
      operator: search.Operator.EQUALTO,
      values: invCountPostingObj.planLineNo
    }));
    serialEntrySrch.filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordno',
      operator: search.Operator.ANYOF,
      values: invCountPostingObj.planInternalId
    }));
    serialEntrySrch.columns.push(search.createColumn({
      name: 'custrecord_wmsse_ser_bin'
    }));
    serialEntrySrch.columns.push(search.createColumn({
      name: 'custrecord_wmsse_ser_qty'
    }));

    if (inventoryStatusFeature == true) {
      serialEntrySrch.columns.push(search.createColumn({
        name: 'custrecord_serial_inventorystatus'
      }));
    }

    var SrchRecordTmpLot1 = '';
    SrchRecordTmpLot1 = utility.getSearchResultInJSON(serialEntrySrch);
    compSubRecord = vInvRec.getSublistSubrecord({
      sublistId: 'item',
      fieldId: 'countdetail',
      line: lineNo
    });
    var complinelength = compSubRecord.getLineCount({
      sublistId: 'inventorydetail'
    });
    log.debug('compSubRecord of lot item new--', compSubRecord);

    if (parseInt(complinelength) > 0 && invCountPostingObj.action == 'timeLinkClicked') {
      for (var invdItr = 0; invdItr < complinelength; invdItr++) {
        var invdQty = compSubRecord.getSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'quantity',
          line: invdItr
        });
        var invdStatus = '';

        if (inventoryStatusFeature) {
          invdStatus = compSubRecord.getSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'inventorystatus',
            line: invdItr
          });
        }

        var invdLot = compSubRecord.getSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'inventorynumber',
          line: invdItr
        });

        if (parseFloat(invCountPostingObj.oldQtytimelink) == parseFloat(invdQty) && invCountPostingObj.oldLottimelink == invdLot) {
          if (!inventoryStatusFeature) {
            compSubRecord.removeLine({
              sublistId: 'inventorydetail',
              line: invdItr
            });
            break;
          } else if (invCountPostingObj.oldInvStatustimelink == invdStatus) {
            compSubRecord.removeLine({
              sublistId: 'inventorydetail',
              line: invdItr
            });
            break;
          }
        }
      }
    }

    complinelength = compSubRecord.getLineCount({
      sublistId: 'inventorydetail'
    });
    log.debug('SrchRecordTmpLot1 for lot in no bins ', SrchRecordTmpLot1);

    if (utility.isValueValid(SrchRecordTmpLot1)) {
      for (var serialEntryItr = 0; serialEntryItr < SrchRecordTmpLot1.length; serialEntryItr++) {
        var invDtlSubRecord = vInvRec.getSublistSubrecord({
          sublistId: 'item',
          fieldId: 'countdetail',
          line: lineNo
        });
        invDtlSubRecord.insertLine({
          sublistId: 'inventorydetail',
          line: complinelength
        });
        invDtlSubRecord.setSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'quantity',
          line: complinelength,
          value: SrchRecordTmpLot1[serialEntryItr]['custrecord_wmsse_ser_qty']
        });
        invDtlSubRecord.setSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'inventorynumber',
          line: complinelength,
          value: SrchRecordTmpLot1[serialEntryItr]['custrecord_wmsse_ser_no']
        });
        if (inventoryStatusFeature == true) invDtlSubRecord.setSublistValue({
          sublistId: 'inventorydetail',
          fieldId: 'inventorystatus',
          line: complinelength,
          value: SrchRecordTmpLot1[serialEntryItr]['custrecord_serial_inventorystatus']
        });
        complinelength++;
      }
    }
  }

  function invCountPostingNoBinsforInvItem(invCountPostingObj, inventoryStatusFeature, vInvRec, lineNo) {
    var compSubRecord = '';
    var invDtlSubRecord = '';

    if (inventoryStatusFeature == true) {
      var serialEntrySrch = search.load({
        id: 'customsearch_wmsse_serialdetails_search'
      });
      serialEntrySrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_ser_status',
        operator: search.Operator.IS,
        values: 'F'
      }));
      serialEntrySrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_ser_ordline',
        operator: search.Operator.EQUALTO,
        values: invCountPostingObj.planLineNo
      }));
      serialEntrySrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_ser_ordno',
        operator: search.Operator.ANYOF,
        values: invCountPostingObj.planInternalId
      }));
      serialEntrySrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_ser_item',
        operator: search.Operator.ANYOF,
        values: invCountPostingObj.itemId
      }));
      var SrchRecordTmpInv = utility.getSearchResultInJSON(serialEntrySrch);
      invDtlSubRecord = vInvRec.getSublistSubrecord({
        sublistId: 'item',
        fieldId: 'countdetail',
        line: lineNo
      });
      var complinelength = invDtlSubRecord.getLineCount({
        sublistId: 'inventorydetail'
      });

      if (parseInt(complinelength) > 0 && invCountPostingObj.action == 'timeLinkClicked') {
        for (var invDetItr = 0; invDetItr < complinelength; invDetItr++) {
          var invdQty = invDtlSubRecord.getSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'quantity',
            line: invDetItr
          });
          var invdstatus = invDtlSubRecord.getSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'inventorystatus',
            line: invDetItr
          });

          if (invCountPostingObj.oldInvStatustimelink == invdstatus && parseFloat(invCountPostingObj.oldQtytimelink) == parseFloat(invdQty)) {
            invDtlSubRecord.removeLine({
              sublistId: 'inventorydetail',
              line: invDetItr
            });
            break;
          }
        }
      }

      complinelength = invDtlSubRecord.getLineCount({
        sublistId: 'inventorydetail'
      });

      if (utility.isValueValid(SrchRecordTmpInv)) {
        for (var invInvCount = 0; invInvCount < SrchRecordTmpInv.length; invInvCount++) {
          invDtlSubRecord.insertLine({
            sublistId: 'inventorydetail',
            line: complinelength
          });
          invDtlSubRecord.setSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'quantity',
            line: complinelength,
            value: SrchRecordTmpInv[invInvCount]['custrecord_wmsse_ser_qty']
          });
          invDtlSubRecord.setSublistValue({
            sublistId: 'inventorydetail',
            fieldId: 'inventorystatus',
            line: complinelength,
            value: SrchRecordTmpInv[invInvCount]['custrecord_serial_inventorystatus']
          });
          complinelength++;
        }
      }
    }
  }

  function invCountPostingNoBinsforSerialItem(invCountPostingObj, inventoryStatusFeature, vInvRec, lineNo) {
    var compSubRecord = '';
    var invDtlSubRecord = '';
    var serialArray = '';
    var statusArray = '';

    if (invCountPostingObj.noStockAction == 'NoStock' && invCountPostingObj.action == 'timeLinkClicked') {
      log.debug('in no stock timeLinkClicked');
      invDtlSubRecord = vInvRec.getSublistSubrecord({
        sublistId: 'item',
        fieldId: 'countdetail',
        line: lineNo
      });

      if (utility.isValueValid(invDtlSubRecord)) {
        var complinelength = invDtlSubRecord.getLineCount({
          sublistId: 'inventorydetail'
        });

        if (parseInt(complinelength) > 0) {
          for (var invdtlLine = 0; invdtlLine < complinelength;) {
            var invSerial = invDtlSubRecord.getSublistValue({
              sublistId: 'inventorydetail',
              fieldId: 'inventorynumber',
              line: invdtlLine
            });

            if (invCountPostingObj.serialArraytoDelete.indexOf(invSerial) != -1) {
              invDtlSubRecord.removeLine({
                sublistId: 'inventorydetail',
                line: invdtlLine
              });
            } else {
              invdtlLine++;
            }

            var length11 = invDtlSubRecord.getLineCount({
              sublistId: 'inventorydetail'
            });
          }
        }
      }
    } else {
      var openTaskSrch = search.load({
        id: 'customsearch_wmsse_opentask_search'
      });
      openTaskSrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_order_no',
        operator: search.Operator.ANYOF,
        values: invCountPostingObj.planInternalId
      }));
      openTaskSrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_line_no',
        operator: search.Operator.EQUALTO,
        values: invCountPostingObj.planLineNo
      }));
      openTaskSrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_parent_sku_no',
        operator: search.Operator.ANYOF,
        values: invCountPostingObj.itemId
      }));
      openTaskSrch.filters.push(search.createFilter({
        name: 'custrecord_wmsse_currentdate',
        operator: search.Operator.ISEMPTY
      }));

      if (inventoryStatusFeature == true) {
        openTaskSrch.columns.push(search.createColumn({
          name: 'custrecord_wmsse_serial_no'
        }));
        openTaskSrch.columns.push(search.createColumn({
          name: 'custrecord_wmsse_actendloc'
        }));
        openTaskSrch.columns.push(search.createColumn({
          name: 'custrecord_wmsse_inventorystatus'
        }));
      }

      var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(openTaskSrch);
      log.debug('in normal', SrchRecordTmpSerial1);

      if (utility.isValueValid(SrchRecordTmpSerial1)) {
        invDtlSubRecord = vInvRec.getSublistSubrecord({
          sublistId: 'item',
          fieldId: 'countdetail',
          line: lineNo
        });

        if (utility.isValueValid(invDtlSubRecord)) {
          var complinelength = invDtlSubRecord.getLineCount({
            sublistId: 'inventorydetail'
          });

          if (parseInt(complinelength) > 0) {
            if (invCountPostingObj.action != 'newEntryBtnClicked' && invCountPostingObj.action != 'timeLinkClicked') {
              for (var invdtlLine = 0; invdtlLine < complinelength; invdtlLine++) {
                invDtlSubRecord.removeLine({
                  sublistId: 'inventorydetail',
                  line: 0
                });
              }
            } else if (invCountPostingObj.action == 'timeLinkClicked') {
              for (var invdtlLine = 0; invdtlLine < complinelength;) {
                var invSerial = invDtlSubRecord.getSublistValue({
                  sublistId: 'inventorydetail',
                  fieldId: 'inventorynumber',
                  line: invdtlLine
                });

                if (invCountPostingObj.serialArraytoDelete.indexOf(invSerial) != -1) {
                  invDtlSubRecord.removeLine({
                    sublistId: 'inventorydetail',
                    line: invdtlLine
                  });
                } else {
                  invdtlLine++;
                }

                var length11 = invDtlSubRecord.getLineCount({
                  sublistId: 'inventorydetail'
                });
              }
            }
          }
        }

        if (inventoryStatusFeature == true) {
          for (var statsItr = 0; statsItr < invCountPostingObj.serialStatusArr.length; statsItr++) {
            serialArray = '';
            statusArray = invCountPostingObj.serialStatusArr[statsItr];

            for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
              var statusArr = SrchRecordTmpSerial1[n]['custrecord_wmsse_inventorystatus'];

              if (statusArray == statusArr) {
                if (!utility.isValueValid(serialArray)) {
                  serialArray = SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
                } else {
                  serialArray = serialArray + "," + SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
                }
              }
            }

            var totalSerialArray = serialArray.split(',');

            if (!utility.isValueValid(invDtlSubRecord)) {
              invDtlSubRecord = vInvRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'countdetail',
                line: lineNo
              });
              var complinelength = invDtlSubRecord.getLineCount({
                sublistId: 'inventorydetail'
              });

              if (parseInt(complinelength) > 0) {
                for (var r1 = 0; r1 < complinelength; r1++) {
                  compSubRecord.removeLine({
                    sublistId: 'inventorydetail',
                    line: 0
                  });
                }
              }
            }

            log.debug('totalSerialArray', totalSerialArray);

            for (var k = 0; k < totalSerialArray.length; k++) {
              invDtlSubRecord.insertLine({
                sublistId: 'inventorydetail',
                line: k
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'quantity',
                line: k,
                value: 1
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'inventorynumber',
                line: k,
                value: totalSerialArray[k]
              });
              invDtlSubRecord.setSublistValue({
                sublistId: 'inventorydetail',
                fieldId: 'inventorystatus',
                line: k,
                value: statusArray
              });
            }
          }
        } else {
          for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
            if (!utility.isValueValid(serialArray)) {
              serialArray = SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
            } else {
              serialArray = serialArray + "," + SrchRecordTmpSerial1[n]['custrecord_wmsse_serial_no'];
            }
          }

          log.debug({
            title: 'in non inv serialArray',
            details: serialArray
          });
          var totalSerialArray = serialArray.split(',');

          if (!utility.isValueValid(invDtlSubRecord)) {
            invDtlSubRecord = vInvRec.getSublistSubrecord({
              sublistId: 'item',
              fieldId: 'countdetail',
              line: lineNo
            });
          }

          for (var k = 0; k < totalSerialArray.length; k++) {
            invDtlSubRecord.insertLine({
              sublistId: 'inventorydetail',
              line: k
            });
            invDtlSubRecord.setSublistValue({
              sublistId: 'inventorydetail',
              fieldId: 'quantity',
              line: k,
              value: 1
            });
            invDtlSubRecord.setSublistValue({
              sublistId: 'inventorydetail',
              fieldId: 'inventorynumber',
              line: k,
              value: totalSerialArray[k]
            });
          }
        }
      }
    }
  }

  function noCodeSolForCycleCount(inventoryCountRecId, openTaskIdArray) {
    var inventoryCountRecIdArray = [];
    var impactedRecords = {};

    if (utility.isValueValid(inventoryCountRecId)) {
      inventoryCountRecIdArray.push(inventoryCountRecId);
    } else {
      inventoryCountRecIdArray.push();
    }

    impactedRecords.inventorycount = inventoryCountRecIdArray;
    impactedRecords.customrecord_wmsse_trn_opentask = openTaskIdArray;
    return impactedRecords;
  }

  function noCodeSolForCreateInv(adjInventoryId, openTaskId) {
    var adjInventoryIdArray = [];
    var openTaskIdArray = [];
    var impactedRecords = {};

    if (utility.isValueValid(adjInventoryId)) {
      adjInventoryIdArray.push(adjInventoryId);
    } else {
      adjInventoryIdArray.push();
    }

    if (utility.isValueValid(openTaskId)) {
      openTaskIdArray.push(openTaskId);
    } else {
      openTaskIdArray.push();
    }

    impactedRecords.inventoryadjustment = adjInventoryIdArray;
    impactedRecords.customrecord_wmsse_trn_opentask = openTaskIdArray;
    impactedRecords._ignoreUpdate = false;
    return impactedRecords;
  }

  function postInventoryStatusChange(inputObj) {
    log.debug('postInventoryStatusChange', inputObj);
    var inventoryStatusChangeId = '';

    if (!utility.isValueValid(inputObj.transactionUomConversionRate)) {
      inputObj.transactionUomConversionRate = 1;
    }

    inputObj.scannedQuantity = Number(Big(inputObj.scannedQuantity).div(inputObj.transactionUomConversionRate).toFixed(8));
    var invStatusChange = record.create({
      type: record.Type.INVENTORY_STATUS_CHANGE,
      isDynamic: true
    });
    invStatusChange.setValue({
      fieldId: 'location',
      value: inputObj.warehouseLocationId
    });
    invStatusChange.setValue({
      fieldId: 'previousstatus',
      value: inputObj.previousStatusInternalId
    });
    invStatusChange.setValue({
      fieldId: 'revisedstatus',
      value: inputObj.revisedStatusInternalId
    });
    var currDate = utility.DateStamp();
    var parsedCurrentDate = format.parse({
      value: currDate,
      type: format.Type.DATE
    });
    invStatusChange.setValue({
      fieldId: 'trandate',
      value: parsedCurrentDate
    });
    invStatusChange.selectNewLine({
      sublistId: 'inventory'
    });
    invStatusChange.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'item',
      value: inputObj.itemInternalId
    });
    invStatusChange.setCurrentSublistValue({
      sublistId: 'inventory',
      fieldId: 'quantity',
      value: inputObj.scannedQuantity
    });

    if ((inputObj.itemType == "inventoryitem" || inputObj.itemType == "assemblyitem") && utility.isValueValid(inputObj.binInternalId) || inputObj.itemType == "lotnumberedinventoryitem" || inputObj.itemType == "lotnumberedassemblyitem") {
      var compSubRecord = invStatusChange.getCurrentSublistSubrecord({
        sublistId: 'inventory',
        fieldId: 'inventorydetail'
      });
      compSubRecord.selectNewLine({
        sublistId: 'inventoryassignment'
      });
      compSubRecord.setCurrentSublistValue({
        sublistId: 'inventoryassignment',
        fieldId: 'quantity',
        value: inputObj.scannedQuantity
      });

      if (inputObj.itemType == "lotnumberedinventoryitem" || inputObj.itemType == "lotnumberedassemblyitem") {
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'receiptinventorynumber',
          value: inputObj.lotName //inputObj.lotInternalId

        });
      }

      if (utility.isValueValid(inputObj.binInternalId)) {
        compSubRecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: inputObj.binInternalId
        });
      }

      compSubRecord.commitLine({
        sublistId: 'inventoryassignment'
      });
    } else if (inputObj.itemType == "serializedinventoryitem" || inputObj.itemType == "serializedassemblyitem") {
      var SrchSerialEntryResults = getScannedSerials(inputObj);

      if (SrchSerialEntryResults.length > 0) {
        var serialMatchFound = true;
        var serialName = "";
        var serialNameDtlArr = [];
        var currentUserId = runtime.getCurrentUser().id;
        var compSubRecord = invStatusChange.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail'
        });

        for (var line = 0; line < SrchSerialEntryResults.length; line++) {
          serialMatchFound = true;
          serialName = SrchSerialEntryResults[line].name;

          if (serialName) {
            serialNameDtlArr = serialName.split("^");

            if (serialNameDtlArr.length == 3) {
              if (serialNameDtlArr[0] != "inventoryStatusChange" || serialNameDtlArr[1] != currentUserId) {
                serialMatchFound = false;
              }
            }
          }

          if (serialMatchFound) {
            compSubRecord.selectNewLine({
              sublistId: 'inventoryassignment'
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'quantity',
              value: 1
            });
            compSubRecord.setCurrentSublistValue({
              sublistId: 'inventoryassignment',
              fieldId: 'receiptinventorynumber',
              value: SrchSerialEntryResults[line].custrecord_wmsse_ser_no
            });

            if (utility.isValueValid(inputObj.binInternalId)) {
              compSubRecord.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'binnumber',
                value: inputObj.binInternalId
              });
            }

            compSubRecord.commitLine({
              sublistId: 'inventoryassignment'
            });
          }
        }

        var serialMatchFound = true;
        var serialName = "";
        var serialNameDtlArr = [];

        for (var result = 0; result < SrchSerialEntryResults.length; result++) {
          serialMatchFound = true;
          serialName = SrchSerialEntryResults[result].name;

          if (serialName) {
            serialNameDtlArr = serialName.split("^");

            if (serialNameDtlArr.length == 3) {
              if (serialNameDtlArr[0] != "inventoryStatusChange" || serialNameDtlArr[1] != currentUserId) {
                serialMatchFound = false;
              }
            }
          }

          if (serialMatchFound) {
            var notes = 'because of discontinue of serial number scanning we have marked this serial number as closed';
            utility.closeSerialEntryStatusCycleCount(SrchSerialEntryResults[result], notes);
          }
        }
      }
    }

    invStatusChange.commitLine({
      sublistId: 'inventory'
    });
    inventoryStatusChangeId = invStatusChange.save();
    log.debug({
      title: 'inventoryStatusChangeId',
      details: inventoryStatusChangeId
    });

    if (utility.isValueValid(inventoryStatusChangeId)) {
      inputObj.taskType = "XFER";
      inputObj.inventoryStatusChangeId = inventoryStatusChangeId;
      createClosedTaskforInvstatusChange(inputObj);
    }

    return inventoryStatusChangeId;
  }

  function getScannedSerials(inputObj) {
    var filterssertemp = [];
    filterssertemp.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: false
    }));
    filterssertemp.push(search.createFilter({
      name: 'custrecord_wmsse_ser_tasktype',
      operator: search.Operator.ANYOF,
      values: 18
    }));

    if (utility.isValueValid(inputObj.binInternalId)) {
      filterssertemp.push(search.createFilter({
        name: 'custrecord_wmsse_ser_bin',
        operator: search.Operator.ANYOF,
        values: inputObj.binInternalId
      }));
    }

    filterssertemp.push(search.createFilter({
      name: 'custrecord_wmsse_ser_item',
      operator: search.Operator.ANYOF,
      values: inputObj.itemInternalId
    }));
    var SrchRecordTmpSeriaObj = search.load('customsearch_wms_get_all_serials');
    SrchRecordTmpSeriaObj.filters = filterssertemp;
    var SrchRecordTmpSerial = utility.getSearchResultInJSON(SrchRecordTmpSeriaObj);
    log.debug({
      title: 'SrchRecordTmpSerial1',
      details: SrchRecordTmpSerial
    });
    return SrchRecordTmpSerial;
  }

  function getItemWiseStatusDetailsInBin(itemInternalId, warehouseLocationId, binInternalId, fromStatusInternalId, lotInternalId, inventoryStatusFeature) {
    var searchObj = search.load({
      id: 'customsearch_wmsse_srchres_statuswise',
      type: search.Type.INVENTORY_BALANCE
    });
    searchObj.filters.push(search.createFilter({
      name: 'item',
      operator: search.Operator.ANYOF,
      values: itemInternalId
    }));
    searchObj.filters.push(search.createFilter({
      name: 'location',
      operator: search.Operator.ANYOF,
      values: warehouseLocationId
    }));

    if (utility.isValueValid(binInternalId)) {
      searchObj.filters.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: binInternalId
      }));
    }

    if (inventoryStatusFeature && utility.isValueValid(fromStatusInternalId)) {
      searchObj.filters.push(search.createFilter({
        name: 'status',
        operator: search.Operator.ANYOF,
        values: fromStatusInternalId
      }));
    }

    if (utility.isValueValid(lotInternalId)) {
      searchObj.filters.push(search.createFilter({
        name: 'inventorynumber',
        operator: search.Operator.ANYOF,
        values: lotInternalId
      }));
    }

    var alltaskresults = utility.getSearchResultInJSON(searchObj);
    log.debug({
      title: 'alltaskresults',
      details: alltaskresults
    });
    return alltaskresults;
  }

  function createClosedTaskforInvstatusChange(inputObj) {
    log.debug('createClosedTaskforInvstatusChange', inputObj);
    var itemType = inputObj.itemType;
    var whLocation = inputObj.warehouseLocationId;
    var itemId = inputObj.itemInternalId;
    var quantity = parseFloat(inputObj.openTaskQty);
    var fromBinId = inputObj.binInternalId;
    var toBinId = inputObj.binInternalId;
    var batchno = inputObj.lotInternalId;
    var inventoryStatusChangeId = inputObj.inventoryStatusChangeId;
    var taskType = inputObj.taskType;
    var actwhLocation = inputObj.warehouseLocationId;
    var units = inputObj.unitType;
    var transactionUomConversionRate = inputObj.transactionUomConversionRate;
    var fromStatus = inputObj.previousStatusInternalId;
    var toStatus = inputObj.revisedStatusInternalId;
    var actualBeginTime = inputObj.actualBeginTime;
    var customrecord = record.create({
      type: 'customrecord_wmsse_trn_closedtask'
    });
    log.debug('quantity', quantity);

    if (utility.isValueValid(inventoryStatusChangeId)) {
      customrecord.setValue({
        fieldId: 'name',
        value: inventoryStatusChangeId
      });
    }

    var currDate = utility.DateStamp();
    var parsedCurrentDate = format.parse({
      value: currDate,
      type: format.Type.DATE
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_act_begin_date_clt',
      value: parsedCurrentDate
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_act_end_date_clt',
      value: parsedCurrentDate
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_act_qty_clt',
      value: quantity
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_sku_clt',
      value: itemId
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_expe_qty_clt',
      value: quantity
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_wms_status_flag_clt',
      value: 19
    }); // storage

    customrecord.setValue({
      fieldId: 'custrecord_wmsse_tasktype_clt',
      value: 18
    });

    if (utility.isValueValid(actwhLocation)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_act_wms_location_clt',
        value: actwhLocation
      });
    }

    if (utility.isValueValid(units)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_uom_clt',
        value: units
      });
    }

    if (utility.isValueValid(transactionUomConversionRate)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_conversionrate_clt',
        value: transactionUomConversionRate
      });
    }

    if (utility.isValueValid(fromBinId)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_actbeginloc_clt',
        value: fromBinId
      });
    }

    if (utility.isValueValid(toBinId)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_actendloc_clt',
        value: toBinId
      });
    }

    if (itemType == translator.getTranslationString("ITEMTYPE_LOT") || itemType == translator.getTranslationString("ITEMTYPE_LOT_ASSEMBLY")) {
      if (utility.isValueValid(batchno)) {
        customrecord.setValue({
          fieldId: 'custrecord_wmsse_batch_num_clt',
          value: batchno
        });
      }
    }

    if (utility.isValueValid(actualBeginTime)) {
      var parsedBeginTime = utility.parseTimeString(actualBeginTime);
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_actualbegintime_clt',
        value: parsedBeginTime
      });
    }

    var timeStamp = utility.getCurrentTimeStamp();
    var parsedCurrentTime = utility.parseTimeString(timeStamp);
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_actualbegintime_clt',
      value: parsedCurrentTime
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_actualendtime_clt',
      value: parsedCurrentTime
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_wms_location_clt',
      value: whLocation
    });
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_parent_sku_no_clt',
      value: itemId
    });

    if (utility.isValueValid(fromStatus)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_inventorystatus_clt',
        value: fromStatus
      });
    }

    if (utility.isValueValid(toStatus)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_inventorystatusto_clt',
        value: toStatus
      });
    }

    if (utility.isValueValid(inventoryStatusChangeId)) {
      customrecord.setValue({
        fieldId: 'custrecord_wmsse_nstrn_ref_no_clt',
        value: inventoryStatusChangeId
      });
    }

    var currentUserID = runtime.getCurrentUser();
    customrecord.setValue({
      fieldId: 'custrecord_wmsse_upd_user_no_clt',
      value: currentUserID.id
    });
    var recId = customrecord.save();
    return recId;
  }

  function itemInventoryDetailsforNoBins(itemType, warehouseLocationId, itemInternalId) {
    var availableQty = 0;
    var inventoryStatusDetails = {};
    var vmakeInvAvailFlag = true;
    var vLocDetails = search.lookupFields({
      type: search.Type.LOCATION,
      id: warehouseLocationId,
      columns: ['makeinventoryavailable']
    });
    vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
    var searchName = 'customsearch_wmsse_invtbalance_invt_item';

    if (itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem") {
      searchName = 'customsearch_wmsse_invtbalance_serialsrh';
    }

    var searchObj = search.load({
      id: searchName,
      type: search.Type.INVENTORY_BALANCE
    });

    if (utility.isValueValid(warehouseLocationId)) {
      searchObj.filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: warehouseLocationId
      }));
    }

    if (utility.isValueValid(itemInternalId)) {
      searchObj.filters.push(search.createFilter({
        name: 'internalid',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: itemInternalId
      }));
    }

    searchObj.filters.push(search.createFilter({
      name: 'available',
      operator: search.Operator.GREATERTHAN,
      values: 0
    }));
    var objBinDetails = utility.getSearchResultInJSON(searchObj);

    if (objBinDetails.length > 0) {
      for (var p in objBinDetails) {
        var locQtyAvail = '';
        var statusId = '';
        var status = '';

        if (vmakeInvAvailFlag == true) {
          locQtyAvail = objBinDetails[p]['available'];
        } else {
          locQtyAvail = objBinDetails[p]['onhand'];
        }

        statusId = objBinDetails[p]['status'];
        status = objBinDetails[p]['statusText'];

        if (objBinDetails.length == 1) {
          inventoryStatusDetails.statusInternalId = statusId;
          inventoryStatusDetails.statusName = status;
        }

        if (locQtyAvail > 0) {
          availableQty = Big(availableQty).plus(locQtyAvail);
        }
      }

      inventoryStatusDetails.locAvailableQty = availableQty;

      if (objBinDetails.length > 1) {
        inventoryStatusDetails.showInvStatusPage = "Y";
      } else {
        inventoryStatusDetails.showInvStatusPage = "N";
      }

      log.debug({
        title: 'inventoryStatusDetails',
        details: inventoryStatusDetails
      });
    }

    log.debug({
      title: 'inventoryStatusDetails11',
      details: inventoryStatusDetails
    });
    return inventoryStatusDetails;
  }

  function getInventoryStatusList() {
    var inventoryStatusSearchResults = '';
    var inventoryStatusResults = search.load({
      id: 'customsearch_wmsse_getinventorystatuslst'
    });
    inventoryStatusSearchResults = utility.getSearchResultInJSON(inventoryStatusResults);
    return inventoryStatusSearchResults;
  }

  function updateWMSOpenTask(arrOpenTaskId) {
    var parsedCurrentDate = format.parse({
      value: utility.DateStamp(),
      type: format.Type.DATE
    });

    for (var openTaskCounter in arrOpenTaskId) {
      record.submitFields({
        type: 'customrecord_wmsse_trn_opentask',
        id: arrOpenTaskId[openTaskCounter],
        values: {
          'custrecord_wmsse_currentdate': parsedCurrentDate
        }
      });
    }
  }

  function getCycleCountPlanDetails(parameters) {
    log.debug({
      title: 'parameters.planNumber getCycleCountPlanDetails',
      details: parameters.planNumber
    });
    var generateAndReleaseSearch = search.load({
      id: 'customsearch_wms_new_cycc_plan_srch'
    }); //on cycle count plan custom record

    if (utility.isValueValid(parameters)) {
      generateAndReleaseSearch.filters.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: parameters.planNumber
      }));
    }

    generateAndReleaseSearch.filters.push(search.createFilter({
      name: 'isinactive',
      operator: search.Operator.IS,
      values: false
    }));
    var generateAndReleaseSearchResults = utility.getSearchResult(generateAndReleaseSearch, 4000);
    log.debug('generateAndReleaseSearchResults for 4000 records', generateAndReleaseSearchResults);
    return generateAndReleaseSearchResults;
  }

  function getCycleCountPlanBinDetails(parameters, binArr) {
    var binsQuery = query.create({
      type: 'bin'
    });
    var isBinActiveCond = binsQuery.createCondition({
      fieldId: 'isinactive',
      operator: query.Operator.IS,
      values: [false]
    });
    var binTypeCond = binsQuery.createCondition({
      fieldId: 'custrecord_wmsse_bin_loc_type',
      operator: query.Operator.ANY_OF_NOT,
      values: ['4']
    });
    var whLocCond = binsQuery.createCondition({
      fieldId: 'location',
      operator: query.Operator.ANY_OF,
      values: parameters.cycleCountPlanLoction
    });
    binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond);

    if (utility.isValueValid(parameters.cycleCountPlanZone)) {
      log.debug({
        title: 'parameters.cycleCountPlanZone  in bin nquery--',
        details: parameters.cycleCountPlanZone
      });
      var binZoneCond = binsQuery.createCondition({
        fieldId: 'zone',
        operator: query.Operator.ANY_OF,
        values: parameters.cycleCountPlanZone
      });
      binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binZoneCond);
    }

    if (utility.isValueValid(binArr)) {
      log.debug({
        title: 'parameters.binArr  in bin nquery--',
        details: binArr
      });
      var binInternalIdCond = binsQuery.createCondition({
        fieldId: 'id',
        operator: query.Operator.ANY_OF,
        values: binArr
      });

      if (utility.isValueValid(parameters.cycleCountPlanZone)) {
        binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binZoneCond, binInternalIdCond);
      } else {
        binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binInternalIdCond);
      }
    }

    if (utility.isValueValid(parameters.cycleCountPlanAisle)) {
      log.debug({
        title: 'parameters.cycleCountPlanAisle  in bin nquery--',
        details: parameters.cycleCountPlanAisle
      });
      var binAileCond = binsQuery.createCondition({
        fieldId: 'custrecord_wmsse_aisle',
        operator: query.Operator.IS,
        values: parameters.cycleCountPlanAisle
      });

      if (utility.isValueValid(parameters.cycleCountPlanZone) && utility.isValueValid(binArr)) {
        binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binZoneCond, binInternalIdCond, binAileCond);
      } else if (utility.isValueValid(parameters.cycleCountPlanZone)) {
        binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binZoneCond, binAileCond);
      } else if (utility.isValueValid(binArr)) {
        binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binInternalIdCond, binAileCond);
      } else {
        binsQuery.condition = binsQuery.and(isBinActiveCond, binTypeCond, whLocCond, binAileCond);
      }
    }

    log.debug('binsQuery final', binsQuery);
    binsQuery.columns = [binsQuery.createColumn({
      fieldId: 'binnumber'
    }), binsQuery.createColumn({
      fieldId: 'location'
    }), binsQuery.createColumn({
      fieldId: 'custrecord_wmsse_aisle'
    }), binsQuery.createColumn({
      fieldId: 'id'
    })];
    binsQuery.sort = [binsQuery.createSort({
      column: binsQuery.columns[3]
    })]; //var objBinsDetails = binsQuery.run().results;

    var objBinsDetails = binsQuery.runPaged({
      pageSize: 1000
    }); //log.debug({title: 'objBinsDetails.length --', details: objBinsDetails.length});

    log.debug({
      title: 'objBinsDetails.length --',
      details: objBinsDetails.count
    });
    log.debug({
      title: 'objBinsDetails --',
      details: objBinsDetails
    });
    return objBinsDetails;
  }

  function getCycleCountPlanItemDetails(parameters, itemArr, binArr, itemTypeArr) {
    log.debug({
      title: 'parameters in getCycleCountPlanItemDetails',
      details: parameters
    });
    log.debug({
      title: 'itemArr in getCycleCountPlanItemDetails',
      details: itemArr
    });
    log.debug({
      title: 'binArr in getCycleCountPlanItemDetails',
      details: binArr
    });
    log.debug({
      title: 'itemTypeArr in getCycleCountPlanItemDetails',
      details: itemTypeArr
    });
    var itemTypeArr1 = [];
    var planItemSearch = search.load({
      id: 'customsearch_wmsse_cyccnt_items_srh'
    }); //1

    if (utility.isValueValid(itemArr)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: itemArr
      }));
    }

    if (utility.isValueValid(itemTypeArr)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'type',
        operator: search.Operator.IS,
        values: itemTypeArr
      }));
    }

    if (utility.isValueValid(parameters.cycleCountPlanitemGrp)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'itemprocessgroup',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanitemGrp
      }));
    }

    if (utility.isValueValid(parameters.cycleCountPlanitemFamily)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'itemprocessfamily',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanitemFamily
      }));
    }

    if (utility.isValueValid(binArr)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'binnumber',
        join: 'binonhand',
        operator: search.Operator.ANYOF,
        values: binArr
      }));
    }

    if (utility.isValueValid(parameters.cycleCountPlansubsidiary)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'subsidiary',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlansubsidiary
      }));
    }

    if (utility.isValueValid(parameters.cycleCountPlanDeparment)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'department',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanDeparment
      }));
    }

    if (utility.isValueValid(parameters.cycleCountPlanClass)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'class',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanClass
      }));
    }

    if (utility.isValueValid(parameters.cycleCountPlanLoction)) {
      planItemSearch.filters.push(search.createFilter({
        name: 'inventorylocation',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      planItemSearch.filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: ['@NONE@', parameters.cycleCountPlanLoction]
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpStartDate != null && parameters.getExpStartDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      planItemSearch.filters.push(search.createFilter({
        name: 'inventorylocation',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      planItemSearch.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        operator: search.Operator.ONORAFTER,
        values: parameters.getExpStartDate
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpEndDate != null && parameters.getExpEndDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      planItemSearch.filters.push(search.createFilter({
        name: 'inventorylocation',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      planItemSearch.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        operator: search.Operator.ONORBEFORE,
        values: parameters.getExpEndDate
      }));
    }

    var planItemSearchResult = [];
    var search_page_count = 1000;
    var myPagedData = planItemSearch.runPaged({
      pageSize: search_page_count
    });
    myPagedData.pageRanges.forEach(function (pageRange) {
      var myPage = myPagedData.fetch({
        index: pageRange.index
      });
      myPage.data.forEach(function (result) {
        planItemSearchResult.push(result);
      });
    });
    log.debug({
      title: 'planItemSearchResult.length',
      details: planItemSearchResult.length
    });
    return planItemSearchResult;
  }

  function fnGetCyccDetails(parameters, binArrayId) {
    log.debug({
      title: 'parameters in fnGetCyccDetails',
      details: parameters
    });
    log.debug({
      title: 'binArrayId in fnGetCyccDetails',
      details: binArrayId
    });
    log.debug('parameters.locUseBinsFlag check', parameters.locUseBinsFlag);
    var sublistDetailArr = [];

    if (parameters.locUseBinsFlag) {
      var itemResult = search.load({
        id: 'customsearch_wms_item_search_invitemtype',
        type: search.Type.INVENTORY_BALANCE
      });

      if (utility.isValueValid(parameters.itemsArray)) {
        itemResult.filters.push(search.createFilter({
          name: 'item',
          operator: search.Operator.ANYOF,
          values: parameters.itemsArray
        }));
      }

      itemResult.filters.push(search.createFilter({
        name: 'onhand',
        operator: search.Operator.GREATERTHAN,
        values: 0
      }));
      itemResult.filters.push(search.createFilter({
        name: 'inactive',
        join: 'binnumber',
        operator: search.Operator.IS,
        values: false
      }));

      if (parameters.cycleCountPlanItemFreq == true && parameters.getExpStartDate != null && parameters.getExpStartDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
        itemResult.filters.push(search.createFilter({
          name: 'inventorylocation',
          join: 'item',
          operator: search.Operator.ANYOF,
          values: parameters.cycleCountPlanLoction
        }));
        itemResult.filters.push(search.createFilter({
          name: 'locationnextinvtcountdate',
          join: 'item',
          operator: search.Operator.ONORAFTER,
          values: parameters.getExpStartDate
        }));
      }

      if (parameters.cycleCountPlanItemFreq == true && parameters.getExpEndDate != null && parameters.getExpEndDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
        itemResult.filters.push(search.createFilter({
          name: 'inventorylocation',
          join: 'item',
          operator: search.Operator.ANYOF,
          values: parameters.cycleCountPlanLoction
        }));
        itemResult.filters.push(search.createFilter({
          name: 'locationnextinvtcountdate',
          join: 'item',
          operator: search.Operator.ONORBEFORE,
          values: parameters.getExpEndDate
        }));
      }

      if (utility.isValueValid(binArrayId)) {
        itemResult.filters.push(search.createFilter({
          name: 'binnumber',
          operator: search.Operator.ANYOF,
          values: binArrayId
        }));
      } else {
        if (parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
          var nonStorageBinsArr = getNonStorageBins(parameters.cycleCountPlanLoction);

          if (nonStorageBinsArr.length > 0) {
            itemResult.filters.push(search.createFilter({
              name: 'binnumber',
              operator: search.Operator.NONEOF,
              values: nonStorageBinsArr
            }));
          }
        }
      }

      if (utility.isValueValid(parameters.cycleCountPlanLoction)) {
        itemResult.filters.push(search.createFilter({
          name: 'location',
          operator: search.Operator.ANYOF,
          values: parameters.cycleCountPlanLoction
        }));
      }

      var search_page_count = 1000;
      var myPagedData = itemResult.runPaged({
        pageSize: search_page_count
      });
      myPagedData.pageRanges.forEach(function (pageRange) {
        var myPage = myPagedData.fetch({
          index: pageRange.index
        });
        myPage.data.forEach(function (result) {
          var objCyccItr = [result.getValue({
            name: 'itemid',
            join: 'item',
            summary: 'group'
          }), result.getValue({
            name: 'internalid',
            join: 'item',
            summary: 'group'
          }), result.getValue({
            name: 'binnumber',
            summary: 'group'
          }), result.getText({
            name: 'binnumber',
            summary: 'group'
          })];
          sublistDetailArr.push(objCyccItr);
        });
      });
    } else {
      var itemResult = search.load({
        id: 'customsearch_wmsse_itemsrh_cyccnt_nobins',
        type: search.Type.ITEM
      });

      if (utility.isValueValid(parameters.itemsArray)) {
        itemResult.filters.push(search.createFilter({
          name: 'internalid',
          operator: search.Operator.ANYOF,
          values: parameters.itemsArray
        }));
      }

      if (parameters.cycleCountPlanItemFreq == true && parameters.getExpStartDate != null && parameters.getExpStartDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
        itemResult.filters.push(search.createFilter({
          name: 'inventorylocation',
          join: 'item',
          operator: search.Operator.ANYOF,
          values: parameters.cycleCountPlanLoction
        }));
        itemResult.filters.push(search.createFilter({
          name: 'locationnextinvtcountdate',
          join: 'item',
          operator: search.Operator.ONORAFTER,
          values: parameters.getExpStartDate
        }));
      }

      if (parameters.cycleCountPlanItemFreq == true && parameters.getExpEndDate != null && parameters.getExpEndDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
        itemResult.filters.push(search.createFilter({
          name: 'inventorylocation',
          join: 'item',
          operator: search.Operator.ANYOF,
          values: parameters.cycleCountPlanLoction
        }));
        itemResult.filters.push(search.createFilter({
          name: 'locationnextinvtcountdate',
          join: 'item',
          operator: search.Operator.ONORBEFORE,
          values: parameters.getExpEndDate
        }));
      }

      if (utility.isValueValid(parameters.cycleCountPlanLoction)) {
        itemResult.filters.push(search.createFilter({
          name: 'location',
          operator: search.Operator.ANYOF,
          values: ['@NONE@', parameters.cycleCountPlanLoction]
        }));
      }

      var search_page_count = 1000;
      var myPagedData = itemResult.runPaged({
        pageSize: search_page_count
      });
      myPagedData.pageRanges.forEach(function (pageRange) {
        var myPage = myPagedData.fetch({
          index: pageRange.index
        });
        myPage.data.forEach(function (result) {
          var objCyccItr = [result.getValue({
            name: 'itemid'
          }), result.getValue({
            name: 'internalid'
          })];
          sublistDetailArr.push(objCyccItr);
          log.debug('sublistDetailArr for nobins', sublistDetailArr);
        });
      });
    }

    return sublistDetailArr;
  }

  function fnGetCyccDetailsSortBin(parameters, binArrayId) {
    log.debug('parameters in fetching fnGetCyccDetailsSort', parameters);
    log.debug('binArrayId fetching fnGetCyccDetailsSort', binArrayId);
    var itemResult = search.load({
      id: 'customsearch_wms_cycc_count_sort_srh',
      type: search.Type.INVENTORY_BALANCE
    });

    if (utility.isValueValid(parameters.itemsArray)) {
      itemResult.filters.push(search.createFilter({
        name: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.itemsArray
      }));
    }

    if (parameters.locUseBinsFlag) {
      itemResult.filters.push(search.createFilter({
        name: 'onhand',
        operator: search.Operator.GREATERTHAN,
        values: 0
      }));
      itemResult.filters.push(search.createFilter({
        name: 'inactive',
        join: 'binnumber',
        operator: search.Operator.IS,
        values: false
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpStartDate != null && parameters.getExpStartDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      itemResult.filters.push(search.createFilter({
        name: 'inventorylocation',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      itemResult.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        join: 'item',
        operator: search.Operator.ONORAFTER,
        values: parameters.getExpStartDate
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpEndDate != null && parameters.getExpEndDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      itemResult.filters.push(search.createFilter({
        name: 'inventorylocation',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      itemResult.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        join: 'item',
        operator: search.Operator.ONORBEFORE,
        values: parameters.getExpEndDate
      }));
    }

    if (utility.isValueValid(binArrayId)) {
      log.debug('into binArrayId', binArrayId);
      itemResult.filters.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: binArrayId
      }));
    } else {
      if (parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
        var nonStorageBinsArr = getNonStorageBins(parameters.cycleCountPlanLoction);

        if (nonStorageBinsArr.length > 0) {
          itemResult.filters.push(search.createFilter({
            name: 'binnumber',
            operator: search.Operator.NONEOF,
            values: nonStorageBinsArr
          }));
        }
      }
    }

    if (utility.isValueValid(parameters.cycleCountPlanLoction)) {
      itemResult.filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
    }

    var sublistDetailArr = [];
    var search_page_count = 1000;
    var myPagedData = itemResult.runPaged({
      pageSize: search_page_count
    });
    myPagedData.pageRanges.forEach(function (pageRange) {
      var myPage = myPagedData.fetch({
        index: pageRange.index
      });
      myPage.data.forEach(function (result) {
        var objcyccItrSortBin = [result.getValue({
          name: 'itemid',
          join: 'item',
          summary: 'group'
        }), result.getValue({
          name: 'internalid',
          join: 'item',
          summary: 'group'
        }), result.getValue({
          name: 'binnumber',
          summary: 'group'
        }), result.getText({
          name: 'binnumber',
          summary: 'group'
        })];
        sublistDetailArr.push(objcyccItrSortBin);
      });
    });
    return sublistDetailArr;
  }

  function fnGetCyccDetailsWithZeroQty(parameters, binArrayId) {
    log.debug('parameters in fetching fnGetCyccDetailsWithZeroQty to display', parameters);
    log.debug('binArrayId fetching fnGetCyccDetailsWithZeroQty to display', binArrayId);
    var itemResult = search.load({
      id: 'customsearch_wmsse_cyc_countbinszero'
    });
    itemResult.filters.push(search.createFilter({
      name: 'inactive',
      join: 'binnumber',
      operator: search.Operator.IS,
      values: false
    }));

    if (utility.isValueValid(parameters.cycleCountPlanLoction)) {
      itemResult.filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
    }

    if (utility.isValueValid(parameters.itemsArray)) {
      itemResult.filters.push(search.createFilter({
        name: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.itemsArray
      }));
    }

    if (utility.isValueValid(binArrayId)) {
      log.debug('into binArrayId', binArrayId);
      itemResult.filters.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: binArrayId
      }));
    }

    itemResult.filters.push(search.createFilter({
      name: 'custrecord_wmsse_bin_loc_type',
      join: 'binnumber',
      operator: search.Operator.NONEOF,
      values: ['4']
    }));

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpStartDate != null && parameters.getExpStartDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      itemResult.filters.push(search.createFilter({
        name: 'inventorylocation',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      itemResult.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        join: 'item',
        operator: search.Operator.ONORAFTER,
        values: parameters.getExpStartDate
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpEndDate != null && parameters.getExpEndDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      itemResult.filters.push(search.createFilter({
        name: 'inventorylocation',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      itemResult.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        join: 'item',
        operator: search.Operator.ONORBEFORE,
        values: parameters.getExpEndDate
      }));
    }

    var sublistDetailArr = [];
    var search_page_count = 1000;
    var myPagedData = itemResult.runPaged({
      pageSize: search_page_count
    });
    myPagedData.pageRanges.forEach(function (pageRange) {
      var myPage = myPagedData.fetch({
        index: pageRange.index
      });
      myPage.data.forEach(function (result) {
        var objcyccItrZeroQty = [result.getText({
          name: 'item',
          summary: 'group'
        }), result.getValue({
          name: 'internalid',
          join: 'item',
          summary: 'group'
        }), result.getValue({
          name: 'binnumber',
          summary: 'group'
        }), result.getText({
          name: 'binnumber',
          summary: 'group'
        })];
        sublistDetailArr.push(objcyccItrZeroQty);
      });
    });
    return sublistDetailArr;
  }

  function fnGetCyccDetailsWithZeroQtyAndSort(parameters, binArrayId) {
    log.debug('parameters in fetching fnGetCyccDetailsWithZeroQtyAndSort to display', parameters);
    log.debug('binArrayId fetching fnGetCyccDetailsWithZeroQtyAndSort to display', binArrayId);
    var itemResult = search.load({
      id: 'customsearch_wmsse_cyc_csortbinszero'
    });
    itemResult.filters.push(search.createFilter({
      name: 'inactive',
      join: 'binnumber',
      operator: search.Operator.IS,
      values: false
    }));

    if (utility.isValueValid(parameters.cycleCountPlanLoction)) {
      itemResult.filters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
    }

    if (utility.isValueValid(parameters.itemsArray)) {
      itemResult.filters.push(search.createFilter({
        name: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.itemsArray
      }));
    }

    if (utility.isValueValid(binArrayId)) {
      log.debug('into binArrayId', binArrayId);
      itemResult.filters.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: binArrayId
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpStartDate != null && parameters.getExpStartDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      itemResult.filters.push(search.createFilter({
        name: 'inventorylocation',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      itemResult.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        join: 'item',
        operator: search.Operator.ONORAFTER,
        values: parameters.getExpStartDate
      }));
    }

    if (parameters.cycleCountPlanItemFreq == true && parameters.getExpEndDate != null && parameters.getExpEndDate != '' && parameters.cycleCountPlanLoction != null && parameters.cycleCountPlanLoction != '') {
      itemResult.filters.push(search.createFilter({
        name: 'inventorylocation',
        join: 'item',
        operator: search.Operator.ANYOF,
        values: parameters.cycleCountPlanLoction
      }));
      itemResult.filters.push(search.createFilter({
        name: 'locationnextinvtcountdate',
        join: 'item',
        operator: search.Operator.ONORBEFORE,
        values: parameters.getExpEndDate
      }));
    }

    itemResult.filters.push(search.createFilter({
      name: 'custrecord_wmsse_bin_loc_type',
      join: 'binnumber',
      operator: search.Operator.NONEOF,
      values: ['4']
    }));
    var cyccSearchResultWithZeroQtySort = [];
    var sublistDetailArr = [];
    var search_page_count = 1000;
    var myPagedData = itemResult.runPaged({
      pageSize: search_page_count
    });
    myPagedData.pageRanges.forEach(function (pageRange) {
      var myPage = myPagedData.fetch({
        index: pageRange.index
      });
      myPage.data.forEach(function (result) {
        var objcyccItrSortBinZeroQty = [result.getText({
          name: 'item',
          summary: 'group'
        }), result.getValue({
          name: 'item',
          summary: 'group'
        }), result.getValue({
          name: 'binnumber',
          summary: 'group'
        }), result.getText({
          name: 'binnumber',
          summary: 'group'
        })];
        sublistDetailArr.push(objcyccItrSortBinZeroQty);
      });
    });
    return sublistDetailArr;
  }

  function getNonStorageBins(cycleCountPlanLocation) {
    var nonStoragebinsLoadQuery = query.create({
      type: query.Type.BIN
    });
    var isnonStorageBinActiveCond = nonStoragebinsLoadQuery.createCondition({
      fieldId: 'isinactive',
      operator: query.Operator.IS,
      values: [false]
    });
    var isnonStorageBinLocTypeCond = nonStoragebinsLoadQuery.createCondition({
      fieldId: 'custrecord_wmsse_bin_loc_type',
      operator: query.Operator.ANY_OF,
      values: ['4']
    });
    nonStoragebinsLoadQuery.condition = nonStoragebinsLoadQuery.and(isnonStorageBinActiveCond, isnonStorageBinLocTypeCond);

    if (utility.isValueValid(cycleCountPlanLocation)) {
      var isnonStorageLocationCond = nonStoragebinsLoadQuery.createCondition({
        fieldId: 'location',
        operator: query.Operator.ANY_OF,
        values: cycleCountPlanLocation
      });
      nonStoragebinsLoadQuery.condition = nonStoragebinsLoadQuery.and(isnonStorageBinActiveCond, isnonStorageBinLocTypeCond, isnonStorageLocationCond);
    }

    nonStoragebinsLoadQuery.columns = [nonStoragebinsLoadQuery.createColumn({
      fieldId: 'binnumber'
    }), nonStoragebinsLoadQuery.createColumn({
      fieldId: 'id'
    }), nonStoragebinsLoadQuery.createColumn({
      fieldId: 'location'
    }), nonStoragebinsLoadQuery.createColumn({
      fieldId: 'memo'
    }), nonStoragebinsLoadQuery.createColumn({
      fieldId: 'custrecord_wmsse_aisle'
    })];
    nonStoragebinsLoadQuery.sort = [nonStoragebinsLoadQuery.createSort({
      column: nonStoragebinsLoadQuery.columns[0]
    })];
    var objnonStorageBinDetails = new Array();
    var objnonStorageLoadBinDetails = nonStoragebinsLoadQuery.run().results;
    log.debug('objnonStorageLoadBinDetails', objnonStorageLoadBinDetails);

    for (var objItr in objnonStorageLoadBinDetails) {
      objnonStorageBinDetails.push(objnonStorageLoadBinDetails[objItr].values[1]);
    }

    log.debug({
      title: 'objnonStorageBinDetails',
      details: objnonStorageBinDetails
    });
    return objnonStorageBinDetails;
  }

  function getInventoryCountDetails(cycleCountPlanLoction, items, bins) {
    var locUseBinsFlag = utility.lookupOnLocationForUseBins(cycleCountPlanLoction);
    var inventoryCountSearch = search.load({
      id: 'customsearch_wms_invcount_existitems_det'
    });
    var inventoryCountFilters = inventoryCountSearch.filters;

    if (locUseBinsFlag) {
      inventoryCountFilters.push(search.createFilter({
        name: 'internalid',
        join: 'binnumber',
        operator: search.Operator.ANYOF,
        values: bins
      }));
    } else {
      inventoryCountFilters.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: cycleCountPlanLoction
      }));
    }

    inventoryCountFilters.push(search.createFilter({
      name: 'item',
      operator: search.Operator.ANYOF,
      values: items
    }));
    inventoryCountSearch.filters = inventoryCountFilters;
    var inventoryCountSearchResults = utility.getSearchResults(inventoryCountSearch);
    log.debug('inventoryCountSearchResults from getSearchResults', inventoryCountSearchResults);
    return inventoryCountSearchResults;
  }

  function processSelectedGenerateAndReleaseLines(request, response, lineCount, oldResponseArr) {
    var recid = '';
    var InvCountRefNumber = '';
    var existingBin = '';
    var existingItem = '';
    var scrObj = runtime.getCurrentScript();

    if (request.parameters.custpage_hiddenfieldselectpage == 'F') {
      var assignedTo = request.parameters.custpage_assignedto;
      var itemArray = [];
      var itemTxtArray = [];
      var binArray = [];
      var binTxtArray = [];
      var isSelected = 'F';
      var selectedCount = 0;
      var cycleCountPlanLoction = '';
      var invCountObj = {};
      var oldResponseArrlength = oldResponseArr.length - 1;

      for (var count = 0; count < oldResponseArrlength; count++) {
        var currenRecordValue = [];
        if (utility.isValueValid(oldResponseArr[count])) currenRecordValue = oldResponseArr[count].split(',');

        if (utility.isValueValid(currenRecordValue)) {
          selectedCount = selectedCount + 1;
          itemTxtArray.push(currenRecordValue[1]);
          itemArray.push(currenRecordValue[2]);
          binArray.push(currenRecordValue[4]);
          binTxtArray.push(currenRecordValue[3]);
          cycleCountPlanLoction = currenRecordValue[5];
        }
      }

      var results = getInventoryCountDetails(cycleCountPlanLoction, itemArray, binArray);
      log.debug({
        title: 'inventory count already exists',
        details: results
      });

      if (results.length > 0) {
        var resultLength = results.length;

        for (var resItr = 0; resItr < resultLength; resItr++) {
          var status = results[resItr].getValue({
            name: 'statusref'
          });
          InvCountRefNumber = results[resItr].getValue({
            name: 'truedocnumber'
          });
          existingBin = results[resItr].getValue({
            name: 'binnumber'
          });
          existingItem = results[resItr].getText({
            name: 'item'
          });

          if (status != 'approved') {
            var binItem = existingItem + "/" + existingBin;
            var processedDetails = [recid, InvCountRefNumber, binItem];
            return processedDetails;
          }
        }
      }

      log.debug({
        title: 'getRemainingUsage at ending of processSelectedGenerateAndReleaseLines --',
        details: scrObj.getRemainingUsage()
      });
      invCountObj.planNumber = request.parameters.custpage_qbplannum;
      var getCycleCountPlanResult = getCycleCountPlanDetails(invCountObj);

      if (getCycleCountPlanResult.length > 0 && selectedCount > 0) {
        var cycleCountPlansubsidiary = getCycleCountPlanResult[0].getValue({
          name: 'custrecord_cycc_subsidiary'
        });
        var cycleCountPlanName = getCycleCountPlanResult[0].getValue({
          name: 'name'
        });
        var cycleCountPlanDeparment = getCycleCountPlanResult[0].getValue({
          name: 'custrecord_cycc_department'
        });
        var cycleCountPlanClass = getCycleCountPlanResult[0].getValue({
          name: 'custrecord_cycc_class'
        });
        var cycleCountPlanMemo = getCycleCountPlanResult[0].getValue({
          name: 'custrecord_cycc_memo'
        });
        var cycleCountPlanAccount = getCycleCountPlanResult[0].getValue({
          name: 'custrecord_cycc_account'
        });
        var cycleCountPlanAssignedTo = getCycleCountPlanResult[0].getValue({
          name: 'custrecord_cycc_assignedto'
        });

        if (utility.isValueValid(assignedTo)) {
          cycleCountPlanAssignedTo = assignedTo;
        }

        log.debug({
          title: 'cycleCountPlanAssignedTo',
          details: cycleCountPlanAssignedTo
        });

        if (scrObj.getRemainingUsage() <= 500) {
          var mapReducetask = task.create({
            taskType: task.TaskType.MAP_REDUCE
          });
          mapReducetask.scriptId = 'customscript_wms_mr_cycc_planrelease';
          mapReducetask.params = {
            "custscript_wms_mr_cycc_location_param": cycleCountPlanLoction,
            "custscript_wms_mr_cycc_plannumber_param": cycleCountPlanName,
            "custscript_wms_mr_cycc_itemid_param": itemArray.toString(),
            "custscript_wms_mr_cycc_binlocid_param": binArray.toString(),
            "custscript_wms_mr_cycc_linecount_param": selectedCount,
            "custscript_wms_mr_cycc_subsidary_param": cycleCountPlansubsidiary,
            "custscript_wms_mr_cycc_department_param": cycleCountPlanDeparment,
            "custscript_wms_mr_cycc_class_param": cycleCountPlanClass,
            "custscript_wms_mr_cycc_memo_param": cycleCountPlanMemo,
            "custscript_wms_mr_cycc_account_param": cycleCountPlanAccount
          };
          log.debug({
            title: 'mapReducetask.params',
            details: mapReducetask.params
          });
          var mrTaskId = mapReducetask.submit();
          var taskStatus = task.checkStatus(mrTaskId);
          var currentUserID = runtime.getCurrentUser().id;
          var schdStatusrecordId = utility.updateScheduleScriptStatus('cycleCountGenerateAndRelease', currentUserID, 'Submitted', cycleCountPlanName, '', '');
          var processedDetails = [schdStatusrecordId, '', '', 'Submitted', taskStatus.scriptId];
          return processedDetails;
        } else {
          invCountObj.cycleCountPlanName = cycleCountPlanName;
          invCountObj.cycleCountPlanLoction = cycleCountPlanLoction;
          invCountObj.lineCount = selectedCount;
          invCountObj.cycleCountPlansubsidiary = cycleCountPlansubsidiary;
          invCountObj.cycleCountPlanDeparment = cycleCountPlanDeparment;
          invCountObj.cycleCountPlanClass = cycleCountPlanClass;
          invCountObj.cycleCountPlanMemo = cycleCountPlanMemo;
          invCountObj.cycleCountPlanAccount = cycleCountPlanAccount;
          invCountObj.cycleCountPlanAssignedTo = cycleCountPlanAssignedTo;
          invCountObj.itemId = itemArray;
          invCountObj.binId = binArray;
          var recid = createInventoryCountRecord(invCountObj);
        }
      }
    }

    var processedDetails = [recid, InvCountRefNumber];
    return processedDetails;
  }

  function createInventoryCountRecord(invCountObj) {
    var invCountRecord = record.create({
      type: 'inventorycount',
      isDynamic: true
    });
    log.debug({
      title: 'invCountObj',
      details: invCountObj
    });

    if (utility.isValueValid(invCountObj.cycleCountPlanName)) {
      invCountRecord.setValue({
        fieldId: 'name',
        value: invCountObj.cycleCountPlanName
      });
    }

    if (utility.isValueValid(invCountObj.cycleCountPlansubsidiary)) {
      invCountRecord.setValue({
        fieldId: 'subsidiary',
        value: invCountObj.cycleCountPlansubsidiary
      });
    }

    if (utility.isValueValid(invCountObj.cycleCountPlanClass)) {
      invCountRecord.setValue({
        fieldId: 'class',
        value: invCountObj.cycleCountPlanClass
      });
    }

    if (utility.isValueValid(invCountObj.cycleCountPlanAccount)) {
      invCountRecord.setValue({
        fieldId: 'account',
        value: invCountObj.cycleCountPlanAccount
      });
    }

    if (utility.isValueValid(invCountObj.cycleCountPlanMemo)) {
      invCountRecord.setValue({
        fieldId: 'memo',
        value: invCountObj.cycleCountPlanMemo
      });
    }

    if (utility.isValueValid(invCountObj.cycleCountPlanLoction)) {
      invCountRecord.setValue({
        fieldId: 'location',
        value: invCountObj.cycleCountPlanLoction
      });
    }

    if (utility.isValueValid(invCountObj.cycleCountPlanDeparment)) {
      invCountRecord.setValue({
        fieldId: 'department',
        value: invCountObj.cycleCountPlanDeparment
      });
    }

    for (var itr = 0; itr < invCountObj.lineCount; itr++) {
      invCountRecord.selectNewLine({
        sublistId: 'item'
      });

      if (invCountObj.itemId.length > 0 && utility.isValueValid(invCountObj.itemId[itr])) {
        invCountRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: invCountObj.itemId[itr]
        });
      }

      if (invCountObj.binId.length > 0 && utility.isValueValid(invCountObj.binId[itr])) {
        invCountRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'binnumber',
          value: invCountObj.binId[itr]
        });
      }

      invCountRecord.commitLine({
        sublistId: 'item'
      });
    }

    log.debug({
      title: 'created inventory count record',
      details: invCountRecord
    });
    var recid = invCountRecord.save();

    if (recid != null && recid != '') {
      var createOpenTaskRecord = record.create({
        type: 'customrecord_wmsse_trn_opentask'
      });
      createOpenTaskRecord.setValue({
        fieldId: 'name',
        value: recid
      });
      createOpenTaskRecord.setValue({
        fieldId: 'custrecord_wmsse_tasktype',
        value: 7
      });
      createOpenTaskRecord.setValue({
        fieldId: 'custrecord_wmsse_wms_status_flag',
        value: 31
      });

      if (utility.isValueValid(invCountObj.cycleCountPlanAssignedTo)) {
        createOpenTaskRecord.setValue({
          fieldId: 'custrecord_wmsse_task_assignedto',
          value: invCountObj.cycleCountPlanAssignedTo
        });
      }

      var opentaskrecid = createOpenTaskRecord.save();
    }

    return recid;
  }

  function _getStageInventory(stageBinId, warehouseLocationId) {
    var result = [];

    if (utility.isValueValid(stageBinId)) {
      var searchRec = search.load({
        id: 'customsearch_wmsse_invtbalance_serialsrh',
        type: search.Type.INVENTORY_BALANCE
      });
      var savedFilter = searchRec.filters;
      savedFilter.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: warehouseLocationId
      }));
      savedFilter.push(search.createFilter({
        name: 'binnumber',
        operator: search.Operator.ANYOF,
        values: stageBinId
      }));
      savedFilter.push(search.createFilter({
        name: 'available',
        operator: search.Operator.GREATERTHAN,
        values: 0
      }));
      searchRec.filters = savedFilter;
      result = utility.getSearchResults(searchRec);
    }

    return result;
  }

  function buildObjectFromTallyLoopObj(isTallyScanRequired, itemType, tallyLoopObj, tallyScanBarCodeQty) {
    log.debug('buildTallyscanObject', tallyLoopObj);
    var tallyscanObj = {};
    var tallyQtyArr = [];
    var statusArray = [];
    var lotArray = [];
    tallyscanObj.isTallyScanRequired = isTallyScanRequired;
    tallyscanObj.tallyScanBarCodeQty = tallyScanBarCodeQty;

    if (utility.isValueValid(tallyLoopObj)) {
      if (itemType == "inventoryitem" || itemType == "assemblyitem" || itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') {
        for (var tallyObjIndex in tallyLoopObj) {
          if (utility.isValueValid(tallyLoopObj[tallyObjIndex].lotName) && lotArray.indexOf(tallyLoopObj[tallyObjIndex].lotName) == -1) {
            lotArray.push(tallyLoopObj[tallyObjIndex].lotName);
            tallyQtyArr.push(tallyLoopObj[tallyObjIndex].quantity);
            statusArray.push(tallyLoopObj[tallyObjIndex].statusName);
          } else if (statusArray.indexOf(tallyLoopObj[tallyObjIndex].statusName) == -1) {
            tallyQtyArr.push(tallyLoopObj[tallyObjIndex].quantity);
            statusArray.push(tallyLoopObj[tallyObjIndex].statusName);
          } else {
            tallyscanObj.quantity = tallyScanBarCodeQty;
          }
        }

        tallyscanObj.lotArray = lotArray;
        tallyscanObj.tallyQtyArr = tallyQtyArr;
        tallyscanObj.statusArray = statusArray;
      }
    }

    log.debug('return tallyscanObj', tallyscanObj);
    return tallyscanObj;
  }
  /**
  * This function is to cycle count plan details
  * 
  */


  function getPlanDetails(planid, itemId, binLocationId, whLocation, locUseBinsFlag, lineNumber) {
    var searchrecord = search.load({
      id: 'customsearch_wms_cycc_invcnt_details'
    });
    var filter = searchrecord.filters;
    filter.push(search.createFilter({
      name: 'tranid',
      operator: search.Operator.ANYOF,
      values: planid
    }));

    if (utility.isValueValid(itemId)) {
      filter.push(search.createFilter({
        name: 'item',
        operator: search.Operator.ANYOF,
        values: itemId
      }));
    }

    if (utility.isValueValid(lineNumber)) {
      filter.push(search.createFilter({
        name: 'line',
        operator: search.Operator.EQUALTO,
        values: lineNumber
      }));
    }

    if ((utility.isValueValid(locUseBinsFlag) || locUseBinsFlag == true) && utility.isValueValid(binLocationId)) {
      filter.push(search.createFilter({
        name: 'internalid',
        join: 'binnumber',
        operator: search.Operator.ANYOF,
        values: binLocationId
      }));
    }

    if (utility.isValueValid(whLocation)) {
      filter.push(search.createFilter({
        name: 'location',
        operator: search.Operator.ANYOF,
        values: whLocation
      }));
    }

    searchrecord.filters = filter;
    var searchrecordResult = utility.getSearchResultInJSON(searchrecord);
    return searchrecordResult;
  }

  function getSerialEntryDetails(serialNumber, lineNum, cyccPlanInternalId, binInternalId) {
    var serialSearch = search.load({
      id: 'customsearch_wmsse_serialentry_details'
    });
    var serailFilters = serialSearch.filters;
    serailFilters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_no',
      operator: search.Operator.IS,
      values: serialNumber
    }));
    serailFilters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordline',
      operator: search.Operator.EQUALTO,
      values: lineNum
    }));
    serailFilters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordno',
      operator: search.Operator.ANYOF,
      values: cyccPlanInternalId
    }));
    serailFilters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: 'F'
    }));

    if (utility.isValueValid(binInternalId)) {
      serailFilters.push(search.createFilter({
        name: 'custrecord_wmsse_ser_bin',
        operator: search.Operator.ANYOF,
        values: binInternalId
      }));
    }

    serialSearch.filters = serailFilters;
    var SrchRecordSerialResults = utility.getSearchResultInJSON(serialSearch);
    return SrchRecordSerialResults;
  }

  function isInventoryNumberExistsCYCCbystatus(item, serial, location, binlocation, invStatusInternalId) {
    var boolfound = false;
    var itemSearchObj = search.load({
      id: 'customsearch_wmsse_itemwise_lots'
    });
    var itemSearchFilters = itemSearchObj.filters;

    if (utility.isValueValid(binlocation)) {
      itemSearchFilters.push(search.createFilter({
        name: 'binnumber',
        join: 'inventoryNumberBinOnHand',
        operator: search.Operator.ANYOF,
        values: binlocation
      }));
    }

    itemSearchFilters.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.ANYOF,
      values: item
    }));
    itemSearchFilters.push(search.createFilter({
      name: 'isinactive',
      operator: search.Operator.IS,
      values: false
    }));

    if (utility.isValueValid(location)) {
      itemSearchFilters.push(search.createFilter({
        name: 'location',
        join: 'inventoryNumberBinOnHand',
        operator: search.Operator.ANYOF,
        values: location
      }));
    }

    itemSearchFilters.push(search.createFilter({
      name: 'inventorynumber',
      join: 'inventoryNumberBinOnHand',
      operator: search.Operator.IS,
      values: serial
    }));
    itemSearchObj.filters = itemSearchFilters;
    var objBinDetails_id = utility.getSearchResultInJSON(itemSearchObj);

    if (objBinDetails_id != null && objBinDetails_id != '') {
      if (objBinDetails_id.length > 0) {
        var vinventoryNumberBinOnHand = objBinDetails_id[0]['inventorynumber'];
        var invBalanceSearch = search.load({
          id: 'customsearch_wmsse_inventorybalance',
          type: search.Type.INVENTORY_BALANCE
        });
        var filters = invBalanceSearch.filters;
        filters.push(search.createFilter({
          name: 'item',
          operator: search.Operator.ANYOF,
          values: item
        }));
        filters.push(search.createFilter({
          name: 'location',
          operator: search.Operator.ANYOF,
          values: location
        }));

        if (utility.isValueValid(vinventoryNumberBinOnHand)) {
          filters.push(search.createFilter({
            name: 'inventorynumber',
            operator: search.Operator.IS,
            values: vinventoryNumberBinOnHand
          }));
        }

        filters.push(search.createFilter({
          name: 'onhand',
          operator: search.Operator.GREATERTHAN,
          values: 0
        }));
        invBalanceSearch.filters = filters;
        var objBinDetails = utility.getSearchResultInJSON(invBalanceSearch);

        if (objBinDetails.length > 0) {
          for (var i = 0; i < objBinDetails.length; i++) {
            var bin = objBinDetails[i]['binnumber'];
            var status = objBinDetails[i]['status'];

            if (bin == binlocation && status != invStatusInternalId) {
              boolfound = true;
            } else if (bin != binlocation) {
              boolfound = true;
            }
          }
        }
      }
    } else {
      boolfound = isInventoryNumberExistsCYCC(item, serial, location, binlocation);
    }

    return boolfound;
  }

  function isInventoryNumberExistsCYCC(item, serial, location, binlocation) {
    var boolfound = false;
    var itemSearchObj = search.load({
      id: 'customsearch_wmsse_itemwise_lots'
    });
    var itemSearchFilters = itemSearchObj.filters;

    if (utility.isValueValid(binlocation)) {
      itemSearchFilters.push(search.createFilter({
        name: 'binnumber',
        join: 'inventoryNumberBinOnHand',
        operator: search.Operator.NONEOF,
        values: binlocation
      }));
    }

    itemSearchFilters.push(search.createFilter({
      name: 'internalid',
      operator: search.Operator.ANYOF,
      values: item
    }));
    itemSearchFilters.push(search.createFilter({
      name: 'isinactive',
      operator: search.Operator.IS,
      values: false
    }));

    if (utility.isValueValid(location)) {
      itemSearchFilters.push(search.createFilter({
        name: 'location',
        join: 'inventoryNumberBinOnHand',
        operator: search.Operator.ANYOF,
        values: location
      }));
    }

    itemSearchFilters.push(search.createFilter({
      name: 'inventorynumber',
      join: 'inventoryNumberBinOnHand',
      operator: search.Operator.IS,
      values: serial
    }));
    itemSearchFilters.push(search.createFilter({
      name: 'quantityonhand',
      join: 'inventoryNumberBinOnHand',
      operator: search.Operator.GREATERTHAN,
      values: 0
    }));
    itemSearchObj.filters = itemSearchFilters;
    var objBinDetails = utility.getSearchResultInJSON(itemSearchObj);

    if (objBinDetails != null && objBinDetails != '' && objBinDetails.length > 0) {
      boolfound = true;
    }

    return boolfound;
  }

  function getSerialItemdataforCYCCtallyscan(cyccPlanData) {
    var arrOpenTaskId = [];
    var serialArrayArr = [];
    var vSerialQtyArr = [];
    var vSerialStatustextArr = [];
    var vStatusIDArr = [];
    var serialDetailsArr = [];
    var serialSearch = search.load({
      id: 'customsearch_wmsse_serialdetails_search'
    });
    var filters = serialSearch.filters;
    filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_status',
      operator: search.Operator.IS,
      values: false
    }));
    filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordline',
      operator: search.Operator.EQUALTO,
      values: cyccPlanData.lineNum
    }));
    filters.push(search.createFilter({
      name: 'custrecord_wmsse_ser_ordno',
      operator: search.Operator.ANYOF,
      values: cyccPlanData.cyccPlanInternalId
    }));
    serialSearch.filters = filters;
    var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(serialSearch);

    if (SrchRecordTmpSerial1.length > 0) {
      for (var zserialItr = 0; zserialItr < SrchRecordTmpSerial1.length; zserialItr++) {
        var vSerialQty = SrchRecordTmpSerial1[zserialItr]['custrecord_wmsse_ser_qty'];
        var vSerialNum = SrchRecordTmpSerial1[zserialItr]['custrecord_wmsse_ser_no'];
        var vStatus = SrchRecordTmpSerial1[zserialItr]['custrecord_serial_inventorystatus'];
        var vStatusText = SrchRecordTmpSerial1[zserialItr]['custrecord_serial_inventorystatusText'];

        if (vStatusIDArr.indexOf(vStatus) == -1) {
          vStatusIDArr.push(vStatus);
          vSerialQtyArr.push(vSerialQty);
          serialArrayArr.push(vSerialNum);
          vSerialStatustextArr.push(vStatusText);
        } else {
          if (vStatusIDArr.length > 0 && vStatusIDArr.indexOf(vStatus) != -1) {
            var ind = vStatusIDArr.indexOf(vStatus);
            var tempQty = vSerialQtyArr[ind];
            var tempSerial = serialArrayArr[ind];
            var totalSerial = tempSerial + "," + vSerialNum;
            var totalLotQty = Number(Big(tempQty).plus(vSerialQty));
            vSerialQtyArr[ind] = totalLotQty;
            serialArrayArr[ind] = totalSerial;
            vStatusIDArr[ind] = vStatus;
            vSerialStatustextArr[ind] = vStatusText;
          } else {
            vStatusIDArr.push(vStatus);
            vSerialQtyArr.push(vSerialQty);
            serialArrayArr.push(vSerialNum);
            vSerialStatustextArr.push(vStatusText);
          }
        }

        var row1 = [vStatusIDArr, vSerialQtyArr, serialArrayArr, vSerialStatustextArr];
      }

      serialDetailsArr.push(row1);
      var serialStatusArr = '';
      var serialQtyArr = '';
      var serialArr = '';
      var serialsttextArr = '';

      if (serialDetailsArr.length > 0) {
        for (var z = 0; z < serialDetailsArr.length; z++) {
          serialStatusArr = serialDetailsArr[z][0];
          serialQtyArr = serialDetailsArr[z][1];
          serialArr = serialDetailsArr[z][2];
          serialsttextArr = serialDetailsArr[z][3];
        }

        if (serialStatusArr.length > 0) {
          for (var statsItr = 0; statsItr < serialStatusArr.length; statsItr++) {
            var openTaskId = updateCycleCountOpenTask(cyccPlanData.cyccPlanInternalId, cyccPlanData.itemInternalId, cyccPlanData.lineNum, Number(Big(serialQtyArr[statsItr]).toFixed(8)), cyccPlanData.binInternalId, cyccPlanData.itemType, cyccPlanData.warehouseLocationId, '', cyccPlanData.cyccPlanInternalId, cyccPlanData.cyclecountPlan, cyccPlanData.actualBeginTime, cyccPlanData.unitType, cyccPlanData.conversionRate, 0, '', serialStatusArr[statsItr]);
            arrOpenTaskId.push(openTaskId);
          }
        }
      }
    }

    return {
      'serialStatusArr': serialStatusArr,
      'arrOpenTaskId': arrOpenTaskId
    };
  }

  return {
    getBinDetailsForItem: _getBinDetailsForItem,
    getOpenTaskStockCoversionRate: getOpenTaskStockCoversionRate,
    inventoryBinTransfer: inventoryBinTransfer,
    putawayallBinTransfer: putawayallBinTransfer,
    transferallInvTransfer: transferallInvTransfer,
    inventoryInvTransfer: inventoryInvTransfer,
    getPickBinDetailsLotWithExpiryDates: getPickBinDetailsLotWithExpiryDates,
    getItemWiseDetails: _getItemWiseDetails,
    getValidBinInternalIdWithLocationTypeInv: _getValidBinInternalIdWithLocationTypeInv,
    invokeNSInventoryAdjustment: _InvokeNSInventoryAdjustment,
    getItemMixFlag: getItemMixFlag,
    validateLocationForAccNo: validateLocationForAccNo,
    getReplenItemsList: getReplenItemsList,
    getCyclePlanTaskDetails: getCyclePlanTaskDetails,
    inventoryCountPosting: inventoryCountPosting,
    createSerialEntry: createSerialEntry,
    deleteCycleCountOpenTask: deleteCycleCountOpenTask,
    loadCyclePlanItemListForSeletedBin: loadCyclePlanItemListForSeletedBin,
    updateMoveOpenTaskforInventory: updateMoveOpenTaskforInventory,
    getInventoryBalanceDetails: getInventoryBalanceDetails,
    updateCycleCountOpenTask: updateCycleCountOpenTask,
    getCYCCCountCompletedList: getCYCCCountCompletedList,
    inventoryCountPostingForNoBins: inventoryCountPostingForNoBins,
    getSerialsFordelete: getSerialsFordelete,
    noCodeSolForCycleCount: noCodeSolForCycleCount,
    noCodeSolForCreateInv: noCodeSolForCreateInv,
    postInventoryStatusChange: postInventoryStatusChange,
    getItemWiseStatusDetailsInBin: getItemWiseStatusDetailsInBin,
    itemInventoryDetailsforNoBins: itemInventoryDetailsforNoBins,
    getInventoryStatusList: getInventoryStatusList,
    updateWMSOpenTask: updateWMSOpenTask,
    getCycleCountPlanBinDetails: getCycleCountPlanBinDetails,
    getCycleCountPlanItemDetails: getCycleCountPlanItemDetails,
    fnGetCyccDetails: fnGetCyccDetails,
    getNonStorageBins: getNonStorageBins,
    fnGetCyccDetailsWithZeroQty: fnGetCyccDetailsWithZeroQty,
    fnGetCyccDetailsSortBin: fnGetCyccDetailsSortBin,
    fnGetCyccDetailsWithZeroQtyAndSort: fnGetCyccDetailsWithZeroQtyAndSort,
    getInventoryCountDetails: getInventoryCountDetails,
    getCycleCountPlanDetails: getCycleCountPlanDetails,
    processSelectedGenerateAndReleaseLines: processSelectedGenerateAndReleaseLines,
    createInventoryCountRecord: createInventoryCountRecord,
    buildObjectFromTallyLoopObj: buildObjectFromTallyLoopObj,
    getStageInventory: _getStageInventory,
    getPlanDetails: getPlanDetails,
    getSerialEntryDetails: getSerialEntryDetails,
    isInventoryNumberExistsCYCC: isInventoryNumberExistsCYCC,
    isInventoryNumberExistsCYCCbystatus: isInventoryNumberExistsCYCCbystatus,
    getSerialItemdataforCYCCtallyscan: getSerialItemdataforCYCCtallyscan,
    fnGetBinsbyZones: fnGetBinsbyZones,
    fnGetBinsbyZonesAlongWithStage: fnGetBinsbyZonesAlongWithStage
  };
});