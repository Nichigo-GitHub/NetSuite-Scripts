/**
 *    Copyright � 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['N/currentRecord', 'N/search', '../Restlets/wms_translator'],

    function (currentRecord, search, translator) {

        function saveRecord(scriptContext) {

            var currentRec = scriptContext.currentRecord;
            var lineCnt = currentRec.getLineCount({
                sublistId: 'item'
            });

            var whLocation = currentRec.getValue({
                fieldId: 'location'
            });
            var makeWhSite = "F";

            if (whLocation != null && whLocation != '' && whLocation != 'null') {
                var locationColumns = [];
                var locationFilters = [];

                locationFilters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: whLocation
                }));


                locationFilters.push(search.createFilter({
                    name: 'custrecord_wmsse_make_wh_site',
                    operator: search.Operator.IS,
                    values: true
                }));
                locationFilters.push(search.createFilter({
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: false
                }));

                var locationSearch = search.create({type:'location',
                    filters:locationFilters,columns:locationColumns
                });
                var searchResult = locationSearch.run().getRange({
                    start: 0, end: 100
                });

                if (searchResult.length > 0) {
                    makeWhSite = "T";
                }
            }
            if (makeWhSite == "T") {
                var binIdArr = [];
                for (var subLstItr = 0; subLstItr < lineCnt; subLstItr++) {

                    var binId = currentRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'binnumber',
                        line: subLstItr
                    });

                    if (binId)
                        binIdArr.push(binId);
                }

                if (binIdArr.length > 0) {
                    var binIdArray = getValidBinInternalId_CYCC(binIdArr, whLocation);



                    if (binIdArray != null && binIdArray != '' && binIdArray != 'null' && binIdArray != undefined && binIdArray.length > 0) {
                        alert(translator.getTranslationStringForClientScript('wms_Cyclecount.INVENTORYCOUNT_CSSAVE_BINS') + binIdArray);
                        return false;
                    }


                }
            }
            return true;
        }

        function validateLine(scriptContext) {

            var currentRec = scriptContext.currentRecord;

            var itemId = currentRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });

            var whLocation = currentRec.getValue({
                fieldId: 'location'
            });

            var makeWhSite="F";
            if (whLocation != null && whLocation != '' && whLocation != 'null') {
                var locationColumns = [];
                var locationFilters = [];

                locationFilters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: whLocation
                }));


                locationFilters.push(search.createFilter({
                    name: 'custrecord_wmsse_make_wh_site',
                    operator: search.Operator.IS,
                    values: true
                }));
                locationFilters.push(search.createFilter({
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: false
                }));

                var locationSearch = search.create({type:'location',
                    filters:locationFilters,columns:locationColumns
                });

                var locationResult = locationSearch.run().getRange({
                    start: 0, end: 100
                });

                if (locationResult != null && locationResult != '') {
                    makeWhSite = "T";
                }
            }
            if (makeWhSite == "T") {

               var itemColumns = [];
                var itemFilters = [];


                if (itemId != null && itemId != '' && itemId != 'null') {
                    itemFilters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: itemId
                    }));
                }
                itemColumns.push(search.createColumn({
                    name: 'usebins'
                }));

                itemColumns.push(search.createColumn({
                    name: 'location'
                }));

                var itemSearch = search.create({type:'item',
                    filters:itemFilters,columns:itemColumns
                });


                var itemResult = itemSearch.run().getRange({
                    start: 0, end: 100
                });

                var binVal = currentRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'binnumber'
                });

                if (binVal != null && binVal != '') {

                    if (itemResult != null && itemResult != '') {
                        var usebinsFlag = itemResult[0].getValue('usebins');

                        if (usebinsFlag == 'F') {
                            alert(translator.getTranslationStringForClientScript('wms_Cyclecount.INVENTORYCOUNT_BIN_VALIDATION'));
                            return false;
                        }

                        if (itemResult[0].getValue('location') != '' && itemResult[0].getValue('location') != whLocation) {
                            alert(translator.getTranslationStringForClientScript('wms_Cyclecount.INVENTORYCOUNT_ITEM_VALIDATION'));
                            return false;
                        }
                    }
                    var binIdArray = getValidBinInternalId_CYCC(binVal, whLocation);
                    if (binIdArray != null && binIdArray != '' && binIdArray != 'null' && binIdArray != undefined && binIdArray.length > 0) {
                        alert(translator.getTranslationStringForClientScript('wms_Cyclecount.INVENTORYCOUNT_CSLINE_BINS') + binIdArray);
                        return false;
                    }

                }
            }
            return true;
        }

        function getValidBinInternalId_CYCC(scannedBinnumber, whLocation) {
            var binInternalId = [];
            var binColumns = [];
            var binFilters = [];

            binFilters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: scannedBinnumber
            }));
            binFilters.push(search.createFilter({
                name: 'inactive',
                operator: search.Operator.IS,
                values: false
            }));
            if (whLocation != null && whLocation != '' && whLocation != 'null' && whLocation != undefined) {
                binFilters.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: whLocation
                }));
            }

            binColumns.push(search.createColumn({
                name: 'custrecord_wmsse_bin_loc_type'
            }));

            binColumns.push(search.createColumn({
                name: 'binnumber'
            }));

            var binSearch = search.create({type:'Bin',
                filters:binFilters,columns:binColumns
            });

            var binResult = binSearch.run().getRange({
                start: 0, end: 100
            });


            if (binResult != null && binResult != "") {
            var binResultLength = binResult.length;
                for (var binItr = 0; binItr < binResultLength; binItr++) {
                    var binLocationType = binResult[binItr].getText('custrecord_wmsse_bin_loc_type');

                    if (binLocationType == 'WIP') {
                        var binLocation = binResult[binItr].getValue('binnumber');
                        binInternalId.push(binLocation);
                    }
                }

            }

            binFilters = null;
            binResult = null;
            return binInternalId;
        }

        return {
            saveRecord: saveRecord,
            validateLine: validateLine

        };

    });
