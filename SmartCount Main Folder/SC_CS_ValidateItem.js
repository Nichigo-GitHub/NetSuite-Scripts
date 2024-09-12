/* enable-cache:true */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
(function () {
    var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // @ts-ignore
    var headerHeight = headerElement.clientHeight;
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.validateItem = function () {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, upcCode, countType, locationId, stateUpcCode, stateItemName, stateItemId, selectedZoneName, selectedAisleName, binEnabled, previousGS1Data, totalQuantity, gs1Data, itemDetails, parserResult, isSameGtin, uomDetails, totalQuantity, previousGS1Data;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        upcCode = _mobile.getValueFromPage('item').trim();
                        if (!upcCode ||
                            (dataRecord.scriptParams.scanStarted == true && !dataRecord.scriptParams.scanEnded)) {
                            return [2 /*return*/];
                        }
                        countType = dataRecord.auxParams.itemsTbl && Object.keys(dataRecord.auxParams.itemsTbl).length > 1
                            ? 'DirectedCount'
                            : 'NonDirectedCount';
                        locationId = dataRecord.auxParams.userLocationsTbl
                            ? dataRecord.auxParams.userLocationsTbl.id
                            : dataRecord.scriptParams.selectedLocation.id;
                        stateUpcCode = dataRecord.scriptParams.itemCountCreateResponse
                            ? dataRecord.scriptParams.itemCountCreateResponse.upcCode
                            : dataRecord.auxParams.itemsTbl
                                ? dataRecord.auxParams.itemsTbl.upcCode
                                : '';
                        stateItemName = dataRecord.scriptParams.itemCountCreateResponse
                            ? dataRecord.scriptParams.itemCountCreateResponse.itemName
                            : dataRecord.auxParams.itemsTbl
                                ? dataRecord.auxParams.itemsTbl.name
                                : '';
                        stateItemId = dataRecord.scriptParams.itemCountCreateResponse
                            ? dataRecord.scriptParams.itemCountCreateResponse.itemId
                            : dataRecord.auxParams.itemsTbl
                                ? dataRecord.auxParams.itemsTbl.id
                                : '';
                        selectedZoneName = (_a = dataRecord.auxParams.zoneList) === null || _a === void 0 ? void 0 : _a.name;
                        selectedAisleName = dataRecord.auxParams.aisleList && !dataRecord.auxParams.aisleList.isNoAisleOption
                            ? (_b = dataRecord.auxParams.aisleList) === null || _b === void 0 ? void 0 : _b.name : '';
                        dataRecord.scriptParams.showPopup = 'F';
                        _mobile.setRecordInState(dataRecord);
                        binEnabled = countType == 'DirectedCount'
                            ? !!dataRecord.auxParams.itemsTbl.binNumber
                            : dataRecord.auxParams.userLocationsTbl
                                ? dataRecord.auxParams.userLocationsTbl.binEnabled
                                : dataRecord.scriptParams.selectedLocation.binEnabled;
                        if (binEnabled && !dataRecord.scriptParams.binScanned) {
                            _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#c9e0ff',
                                headerHeight
                            ]) +
                                _mobile.getValueFromPage('scanBinMsg') +
                                _mobile.getValueFromPage('bannerEnd')));
                            _mobile.setValueInPage('item', '');
                            _mobile.setFocusOnElement('bin');
                            setMargin();
                            return [2 /*return*/];
                        }
                        if (!(dataRecord.scriptParams.itemCountCreateResponse &&
                            (dataRecord.scriptParams.previousScannedUpcValue == upcCode ||
                                stateItemName == upcCode ||
                                stateUpcCode == upcCode ||
                                dataRecord.scriptParams.previousGS1 == upcCode))) return [3 /*break*/, 1];
                        if (dataRecord.scriptParams.pausedItem == true) {
                            dataRecord.scriptParams.pausedItem = false;
                        }
                        previousGS1Data = dataRecord.scriptParams.previousGS1Data;
                        totalQuantity = _mobile.getValueFromPage('totalQuantityCounted');
                        totalQuantity = Number(totalQuantity);
                        if (dataRecord.scriptParams.previousGS1 == upcCode) {
                            incrementQuantity(previousGS1Data, dataRecord, totalQuantity);
                        }
                        else {
                            dataRecord.scriptParams.previousGS1Data = null;
                            dataRecord.scriptParams.previousGS1 = null;
                            dataRecord.scriptParams.previousScannedUpcValue = upcCode;
                        }
                        setValidItemBannerMsg(dataRecord.scriptParams.itemCountCreateResponse.itemName);
                        dataRecord.scriptParams.onhandChangePopupOpened = true;
                        dataRecord.scriptParams.rescanPopupOpened = true;
                        setMargin();
                        return [3 /*break*/, 7];
                    case 1:
                        gs1Data = void 0, itemDetails = [];
                        if (!(dataRecord.scriptParams.advancedBarcodeSupport && upcCode.match(/01[0-9]{14}/g))) return [3 /*break*/, 3];
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_parse_barcode', 'customdeploy_sc_rl_parse_barcode', {
                                upcCodeParam: upcCode
                            }, 'get')];
                    case 2:
                        parserResult = _e.sent();
                        if ((_c = parserResult === null || parserResult === void 0 ? void 0 : parserResult.barcodeComponents) === null || _c === void 0 ? void 0 : _c.gtin) {
                            gs1Data = parserResult.barcodeComponents;
                            if (parserResult.itemDetails.length) {
                                itemDetails = parserResult.itemDetails;
                            }
                        }
                        _e.label = 3;
                    case 3:
                        if (dataRecord.scriptParams.isFromEnableItemFieldWithGS1) {
                            itemDetails = [dataRecord.auxParams.duplicateItemAliasesTbl];
                        }
                        isSameGtin = (gs1Data === null || gs1Data === void 0 ? void 0 : gs1Data.gtin) &&
                            dataRecord.scriptParams.previousGS1Data &&
                            (gs1Data.gtin == ((_d = dataRecord.scriptParams.previousGS1Data) === null || _d === void 0 ? void 0 : _d.gtin) ||
                                dataRecord.scriptParams.previousScannedUpcValue == gs1Data.gtin);
                        if (!(dataRecord.scriptParams.itemCountCreateResponse &&
                            (isSameGtin ||
                                (itemDetails.length == 1 &&
                                    dataRecord.scriptParams.itemCountCreateResponse.itemId ==
                                        itemDetails[0].itemId &&
                                    !(itemDetails[0].isSerialItem &&
                                        itemDetails[0].aliasUnit &&
                                        !itemDetails[0].isBaseUnit))))) return [3 /*break*/, 4];
                        uomDetails = void 0;
                        totalQuantity = _mobile.getValueFromPage('totalQuantityCounted');
                        totalQuantity = Number(totalQuantity);
                        if (isSameGtin) {
                            uomDetails = dataRecord.scriptParams.previousGS1Data.uomDetails;
                        }
                        else {
                            uomDetails = {
                                uomId: itemDetails[0].aliasUnit,
                                uomName: itemDetails[0].aliasUnitName
                            };
                        }
                        dataRecord.scriptParams.previousGS1Data = __assign(__assign({}, gs1Data), { uomDetails: uomDetails });
                        dataRecord.scriptParams.previousGS1 = upcCode;
                        dataRecord.scriptParams.previousScannedUpcValue = upcCode;
                        previousGS1Data = dataRecord.scriptParams.previousGS1Data;
                        incrementQuantity(previousGS1Data, dataRecord, totalQuantity);
                        return [3 /*break*/, 7];
                    case 4:
                        dataRecord.scriptParams.previousGS1Data = null;
                        dataRecord.scriptParams.previousGS1 = null;
                        dataRecord.scriptParams.onhandChangePopupOpened = false;
                        dataRecord.scriptParams.rescanPopupOpened = false;
                        if (dataRecord.scriptParams.itemCountCreateResponse) {
                            if (dataRecord.scriptParams.validateVarianceClicked) {
                                dataRecord.scriptParams.validateVarianceClicked = false;
                                _mobile.setValueInPage('hiddenItem_ValidateVariance', '');
                            }
                            if (dataRecord.scriptParams.cancelVarianceClicked &&
                                dataRecord.scriptParams.itemCountCreateResponse.itemName != upcCode &&
                                dataRecord.scriptParams.itemCountCreateResponse.upcCode != upcCode) {
                                dataRecord.scriptParams.cancelVarianceClicked = false;
                            }
                            dataRecord.scriptParams.promptOpened && _mobile.hideField('prompt');
                            callItemCountEditRestlet(dataRecord.scriptParams.itemCountCreateResponse.itemCountId, dataRecord);
                        }
                        resetFields(dataRecord);
                        if (gs1Data && gs1Data.gtin) {
                            dataRecord.scriptParams.previousGS1Data = gs1Data;
                            dataRecord.scriptParams.previousGS1 = upcCode;
                            upcCode = gs1Data.gtin;
                        }
                        if ((itemDetails === null || itemDetails === void 0 ? void 0 : itemDetails.length) > 1) {
                            dataRecord.scriptParams.duplicateAliases = itemDetails;
                        }
                        if (!upcCode) return [3 /*break*/, 6];
                        return [4 /*yield*/, callValidationRestlet(upcCode, locationId, countType, dataRecord, itemDetails, stateItemId, selectedZoneName, selectedAisleName)];
                    case 5:
                        _e.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                            '#c9e0ff',
                            headerHeight
                        ]) +
                            _mobile.getValueFromPage('scanItemMsg') +
                            _mobile.getValueFromPage('bannerEnd')));
                        hideItemDetailsAndRemarks();
                        setMargin();
                        _e.label = 7;
                    case 7:
                        if (dataRecord.scriptParams.isFromEnableItemField ||
                            dataRecord.scriptParams.isFromProcessRescanPopupUpdate ||
                            dataRecord.scriptParams.isFromEnableItemFieldWithGS1) {
                            dataRecord.scriptParams.isFromEnableItemField
                                ? (dataRecord.scriptParams.isFromEnableItemField = false)
                                : (dataRecord.scriptParams.isFromProcessRescanPopupUpdate = false);
                            dataRecord.scriptParams.isFromEnableItemFieldWithGS1 = false;
                            _mobile.setValueInPage('item', '');
                            _mobile.setFocusOnElement('item');
                        }
                        if (dataRecord.scriptParams.itemCountCreateResponse) {
                            setInventoryNumberElementFocus();
                        }
                        _mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    };
    function callValidationRestlet(upcCode, locationId, countType, dataRecord, itemDetails, stateItemId, selectedZoneName, selectedAisleName) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var colorCodes, _mobile, scannedBinId, result, scannedItemName, bannerMessage, color, binItemId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        colorCodes = {
                            Red: '#fccfcf',
                            Green: '#d7fccf',
                            Yellow: '#faf8ce'
                        };
                        _mobile = mobile;
                        scannedBinId = dataRecord.scriptParams.scannedBinId
                            ? dataRecord.scriptParams.scannedBinId
                            : '';
                        _mobile.disableField('cancel_bckBtn');
                        dataRecord.scriptParams.scanStarted = true;
                        _mobile.setRecordInState(dataRecord);
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_validate_item', 'customdeploy_sc_rl_validate_item', {
                                upcCodeParam: htmlDecode(upcCode),
                                locationIdParam: locationId,
                                binIdParam: scannedBinId,
                                selectedItemId: dataRecord.auxParams.duplicateUpcCodesTbl
                                    ? dataRecord.auxParams.duplicateUpcCodesTbl.itemId
                                    : null,
                                isCompleteCountWithoutScan: false,
                                isFromTaskListRescanPopup: dataRecord.scriptParams.isFromTaskListRescanPopup,
                                selectedItemInfo: dataRecord.scriptParams.selectedItemInfo,
                                accountForSpotCountVariance: dataRecord.scriptParams.accountForSpotCountVariance,
                                isGs1Code: !!((_a = dataRecord.scriptParams.previousGS1Data) === null || _a === void 0 ? void 0 : _a.gtin),
                                itemDetails: itemDetails || [],
                                zoneName: dataRecord.scriptParams.isBinNotOfSelectedZone ? dataRecord.scriptParams.zoneNameOfbinScanned : selectedZoneName,
                                aisleName: dataRecord.scriptParams.isBinNotOfSelectedAisle ? dataRecord.scriptParams.aisleOfbinScanned : selectedAisleName
                            }, 'post')];
                    case 1:
                        result = _c.sent();
                        dataRecord.auxParams.duplicateUpcCodesTbl = null;
                        dataRecord.scriptParams.isFromTaskListRescanPopup = false;
                        _mobile.setRecordInState(dataRecord);
                        if (result.validateStatus == 'DuplicateItemAliasesExist') {
                            _mobile.setValueInPage('hiddenDuplicateItemAlias', '');
                            _mobile.setValueInPage('hiddenDuplicateItemAlias', htmlEscape(upcCode));
                        }
                        else if (result.validateStatus == 'DuplicateUpcCodesExist') {
                            _mobile.setValueInPage('hiddenDuplicateUpc', '');
                            _mobile.setValueInPage('hiddenDuplicateUpc', htmlDecode(upcCode));
                        }
                        else if (result.validateStatus == 'ItemCountInProgressByOtherUser') {
                            // @ts-ignore
                            mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#fccfcf',
                                headerHeight
                            ]) +
                                replacePlaceholders(_mobile.getValueFromPage('invalidOwnerMsg'), [
                                    htmlEscape(result.lastModifiedByUserName)
                                ]) +
                                _mobile.getValueFromPage('bannerEnd')));
                            hideItemDetailsAndRemarks();
                        }
                        else if (result.validateStatus === 'ItemNotSupported') {
                            // @ts-ignore
                            mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#fccfcf',
                                headerHeight
                            ]) +
                                _mobile.getValueFromPage('invalidTypeMsg') +
                                _mobile.getValueFromPage('bannerEnd')));
                            hideItemDetailsAndRemarks();
                        }
                        else if (result.validateStatus === 'ItemDoesNotExist') {
                            // @ts-ignore
                            mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#fccfcf',
                                headerHeight
                            ]) +
                                _mobile.getValueFromPage('invalidItemMsg') +
                                _mobile.getValueFromPage('bannerEnd')));
                            hideItemDetailsAndRemarks();
                        }
                        else if (result.validateStatus === 'UseBinsUnchecked') {
                            // @ts-ignore
                            mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#fccfcf',
                                headerHeight
                            ]) +
                                _mobile.getValueFromPage('binsDisabledMsg') +
                                _mobile.getValueFromPage('bannerEnd')));
                            hideItemDetailsAndRemarks();
                        }
                        else if (result.validateStatus === 'CountConfigAndDefaultInventoryCountAccountNotExist') {
                            // @ts-ignore
                            mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#fccfcf',
                                headerHeight
                            ]) +
                                _mobile.getValueFromPage('inventoryCntActMsg') +
                                _mobile.getValueFromPage('bannerEnd')));
                            hideItemDetailsAndRemarks();
                        }
                        else if (result.validateStatus === 'NotABaseUnitInItemAlias') {
                            // @ts-ignore
                            mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                '#fccfcf',
                                headerHeight
                            ]) +
                                _mobile.getValueFromPage('notABaseUnitInItemAliasMsg') +
                                _mobile.getValueFromPage('bannerEnd')));
                            hideItemDetailsAndRemarks();
                        }
                        else if (result.validateStatus == 'ValidationSuccessful') {
                            // @ts-ignore
                            mobile.enableField('item');
                            scannedItemName = result.scannedItemName;
                            if (dataRecord.scriptParams.onhandChangePopupOpened ||
                                dataRecord.scriptParams.rescanPopupOpened) {
                                dataRecord.scriptParams.showPopup = 'F';
                            }
                            else {
                                dataRecord.scriptParams.showPopup = 'T';
                                _mobile.disableField('quantity');
                                _mobile.disableField('totalQuantityCounted');
                            }
                            dataRecord.scriptParams.previousScannedUpcValue =
                                dataRecord.scriptParams.previousGS1 || upcCode;
                            _mobile.setRecordInState(dataRecord);
                            dataRecord.scriptParams.scannedCountConfigId = result.scannedCountConfigId;
                            callItemCountCreationRestlet(result.creationResult, dataRecord, result.isStuckInProgressState);
                            bannerMessage = void 0, color = void 0;
                            if (stateItemId != result.creationResult.itemId &&
                                ((_b = dataRecord.scriptParams.recountedItemDetails) === null || _b === void 0 ? void 0 : _b.itemId) != result.creationResult.itemId) {
                                dataRecord.scriptParams.itemId = result.creationResult.itemId;
                                dataRecord.scriptParams.itemName = result.creationResult.itemName;
                                dataRecord.scriptParams.upcCode = result.creationResult.upcCode;
                                if (result.scannedCountConfigId && countType == 'DirectedCount') {
                                    bannerMessage = replacePlaceholders(_mobile.getValueFromPage('itemInTaskListMsg'), [htmlEscape(scannedItemName)]);
                                    color = colorCodes.Yellow;
                                }
                                else if (!result.scannedCountConfigId && countType == 'DirectedCount') {
                                    bannerMessage = replacePlaceholders(_mobile.getValueFromPage('itemNotInTaskListMsg'), [htmlEscape(scannedItemName)]);
                                    color = colorCodes.Yellow;
                                }
                                else {
                                    bannerMessage = replacePlaceholders(_mobile.getValueFromPage('validItem'), [
                                        htmlEscape(scannedItemName)
                                    ]);
                                    color = colorCodes.Green;
                                }
                                _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                    color,
                                    headerHeight
                                ]) +
                                    bannerMessage +
                                    _mobile.getValueFromPage('bannerEnd')));
                            }
                            else {
                                setValidItemBannerMsg(scannedItemName);
                            }
                            binItemId = dataRecord.scriptParams.itemCountCreateResponse.binId +
                                ':' +
                                dataRecord.scriptParams.itemCountCreateResponse.itemId;
                            if (dataRecord.scriptParams.itemCountCreateResponse.binId &&
                                dataRecord.scriptParams.itemCountCreateResponse.binId ==
                                    dataRecord.scriptParams.scannedBinId &&
                                dataRecord.scriptParams.mixedItemCounts.indexOf(binItemId) == -1) {
                                dataRecord.scriptParams.mixedItemCounts.push(binItemId);
                                dataRecord.scriptParams.mixedCount =
                                    dataRecord.scriptParams.mixedItemCounts.length > 1;
                            }
                            if (dataRecord.scriptParams.completeAndNextEnabled) {
                                if (result.scannedCountConfigId) {
                                    _mobile.hideField('completeCount_actBtn');
                                    _mobile.showField('completeAndNextCount_actBtn');
                                }
                                else {
                                    _mobile.hideField('completeAndNextCount_actBtn');
                                    _mobile.showField('completeCount_actBtn');
                                }
                            }
                            if (result.isSerialItem && dataRecord.scriptParams.validateVarianceClicked) {
                                _mobile.showField('serials');
                                _mobile.showField('viewserialnumbers');
                                _mobile.setFocusOnElement('serials');
                            }
                        }
                        dataRecord.scriptParams.scanEnded = true;
                        dataRecord.scriptParams.recountedItemDetails = null;
                        _mobile.setRecordInState(dataRecord);
                        setMargin();
                        return [2 /*return*/];
                }
            });
        });
    }
    function callItemCountCreationRestlet(creationResult, dataRecord, isStuckInProgressState) {
        // @ts-ignore
        var _mobile = mobile;
        dataRecord.auxParams.itemCountRemarks = null;
        var itemUOMDropdown = [];
        var inventoryStatusDropdown = [];
        dataRecord.scriptParams.itemCountCreateResponse = creationResult;
        dataRecord.scriptParams.stockUnitPluralName = creationResult.stockUnitPluralName || '';
        var itemCountRecord = localStorage.getItem('ItemCountRecord');
        var itemCountRecordObject;
        if (itemCountRecord) {
            itemCountRecordObject = JSON.parse(itemCountRecord);
            if (creationResult.itemCountId == itemCountRecordObject.itemCountId &&
                (creationResult.itemCountStatus == 1 || creationResult.itemCountStatus == 8) &&
                isStuckInProgressState) {
                itemCountRecordObject.itemCountRemarks = creationResult.itemCountRemarks;
                itemCountRecordObject.allowManualCount = creationResult.allowManualCount;
                itemCountRecordObject.showExpectedCount = creationResult.showExpectedCount;
                dataRecord.scriptParams.itemCountCreateResponse = itemCountRecordObject;
                dataRecord.scriptParams.itemCountCreateResponse.nextItem = creationResult.nextItem;
                dataRecord.scriptParams.itemCountCreateResponse.ignoreSerialNumberUntilVariance =
                    creationResult.ignoreSerialNumberUntilVariance;
                dataRecord.scriptParams.itemCountCreateResponse.ignoreLotNumberUntilVarianceGlobalPref =
                    creationResult.ignoreLotNumberUntilVarianceGlobalPref;
                dataRecord.scriptParams.itemCountCreateResponse.ignoreLotNumberUntilVarianceItemPref =
                    creationResult.ignoreLotNumberUntilVarianceItemPref;
                dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails =
                    itemCountRecordObject.statusQuantityDetails;
                dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity =
                    itemCountRecordObject.serialsQuantity;
                dataRecord.scriptParams.itemCountCreateResponse.uomIdFromGs1 =
                    creationResult.uomIdFromGs1;
            }
        }
        dataRecord.scriptParams.popupResponse = creationResult.itemCountPopupDetails;
        if (dataRecord.scriptParams.serialOrLotVarainceSubmit ||
            dataRecord.scriptParams.cancelVarianceClicked) {
            dataRecord.scriptParams.popupResponse.onhandChangePopup = false;
        }
        if (dataRecord.scriptParams.showPopup == 'T' &&
            (dataRecord.scriptParams.popupResponse.onhandChangePopup == true ||
                dataRecord.scriptParams.popupResponse.rescanPopup == true)) {
            _mobile.setValueInPage('hiddenItem', htmlEscape(dataRecord.scriptParams.previousScannedUpcValue));
        }
        if ((dataRecord.scriptParams.showPopup == 'T' &&
            dataRecord.scriptParams.popupResponse.onhandChangePopup == true) ||
            dataRecord.scriptParams.popupResponse.onhandQuantityChangedDuringRescan == true) {
            var resumePopupMessage = void 0;
            if (creationResult.itemCountPopupDetails.onhandChangePreference == 1) {
                resumePopupMessage = replacePlaceholders(_mobile.getValueFromPage('resumePopUpText_1'), [htmlEscape(creationResult.itemName)]);
            }
            else if (creationResult.itemCountPopupDetails.onhandChangePreference == 2) {
                resumePopupMessage = replacePlaceholders(_mobile.getValueFromPage('resumePopUpText_2'), [htmlEscape(creationResult.itemName)]);
            }
            dataRecord.scriptParams.resumePopupMessage = resumePopupMessage;
        }
        var defaultUomId = dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
        var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        var defaultInventoryStatusName = null;
        var defaultUomName = null;
        var uomNameFromGs1 = null;
        var itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
        var baseUnitName = dataRecord.scriptParams.itemCountCreateResponse.baseUnitName;
        var baseUnitId = dataRecord.scriptParams.itemCountCreateResponse.baseUnitId;
        var lotItemWithoutOnhandUOMDetails = dataRecord.scriptParams.itemCountCreateResponse.lotItemWithoutOnhandUOMDetails;
        var uomIdFromGs1 = dataRecord.scriptParams.itemCountCreateResponse.uomIdFromGs1;
        _mobile.setValueInPage('itemName', "<span style='word-break: break-all;margin:0;'>" + htmlEscape(dataRecord.scriptParams.itemCountCreateResponse.itemName) + "</span>");
        if (dataRecord.scriptParams.itemCountCreateResponse.binNumber) {
            _mobile.setValueInPage('binName', "<span style='word-break: break-all;margin:0;'>" + htmlEscape(dataRecord.scriptParams.itemCountCreateResponse.binNumber) + "</span>");
        }
        if (defaultInventoryStatusId) {
            dataRecord.scriptParams.inventoryStatuses.forEach(function (inventoryStatus) {
                inventoryStatusDropdown.push({
                    value: inventoryStatus.internalId,
                    label: inventoryStatus.status
                });
                if (inventoryStatus.internalId == defaultInventoryStatusId) {
                    defaultInventoryStatusName = inventoryStatus.status;
                }
            });
            _mobile.setElementSourceData('inventoryStatus', inventoryStatusDropdown);
            _mobile.setValueInPage('inventoryStatus', defaultInventoryStatusName);
            _mobile.showField('inventoryStatus');
        }
        if (defaultUomId || baseUnitId) {
            var itemUOMDetails = itemCountDetails.length
                ? itemCountDetails
                : lotItemWithoutOnhandUOMDetails.length
                    ? lotItemWithoutOnhandUOMDetails
                    : [];
            itemUOMDetails.forEach(function (obj) {
                if (!itemUOMDropdown.some(function (uomObj) { return uomObj.value == obj.uomIdParam; })) {
                    itemUOMDropdown.push({
                        value: obj.uomIdParam,
                        label: obj.uomNameParam
                    });
                    if (obj.uomIdParam == defaultUomId) {
                        defaultUomName = obj.uomNameParam;
                    }
                    if (obj.uomIdParam == uomIdFromGs1) {
                        uomNameFromGs1 = obj.uomNameParam;
                        if (dataRecord.scriptParams.previousGS1Data) {
                            dataRecord.scriptParams.previousGS1Data.uomDetails = {
                                uomId: uomIdFromGs1,
                                uomName: uomNameFromGs1
                            };
                        }
                    }
                }
            });
            _mobile.setElementSourceData('unitOfMeasurement', itemUOMDropdown);
            if (creationResult.isSerialItem) {
                if (!itemUOMDropdown.length) {
                    _mobile.setElementSourceData('unitOfMeasurement', [
                        {
                            value: baseUnitId,
                            label: baseUnitName
                        }
                    ]);
                }
                _mobile.setValueInPage('unitOfMeasurement', baseUnitName);
                _mobile.disableField('unitOfMeasurement');
            }
            else {
                _mobile.setValueInPage('unitOfMeasurement', uomNameFromGs1 || defaultUomName);
                _mobile.enableField('unitOfMeasurement');
            }
            _mobile.showField('unitOfMeasurement');
        }
        setTimeout(function () {
            var uomDropDown = document
                .evaluate("(//div[@class='dropdown__container']/div[2])[3]", document, null, XPathResult.ANY_TYPE, null)
                .iterateNext();
            // @ts-ignore
            uomDropDown.style.backgroundColor =
                creationResult.isSerialItem && baseUnitId ? '#c9c9c9' : 'unset';
            //@ts-ignore
            var dropdownElements = document.getElementsByClassName('dropdown--placeholder');
            if (dropdownElements.length > 0) {
                var dropdownLength = dropdownElements.length;
                while (dropdownLength > 0) {
                    dropdownElements[0].classList.remove('dropdown--placeholder');
                    dropdownLength--;
                }
            }
        }, 1000);
        var returnedQuantity;
        if (defaultInventoryStatusId) {
            itemCountDetails = itemCountDetails.filter(function (itemCount) { return itemCount.inventoryStatusIdParam == defaultInventoryStatusId; });
        }
        if (defaultUomId) {
            var uomId_1 = uomIdFromGs1 || defaultUomId;
            itemCountDetails = itemCountDetails.filter(function (itemCount) { return itemCount.uomIdParam == uomId_1; });
        }
        var statusQuantityDetails, serialsQuantity;
        if (creationResult.isSerialItem) {
            statusQuantityDetails =
                dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
            serialsQuantity = dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity;
            if (defaultInventoryStatusId) {
                statusQuantityDetails = statusQuantityDetails.find(function (detail) { return detail.status == defaultInventoryStatusId; });
                returnedQuantity = statusQuantityDetails.quantity;
            }
            else {
                returnedQuantity = serialsQuantity;
            }
        }
        else {
            returnedQuantity = itemCountDetails.length
                ? itemCountDetails[0].countQuantityParam
                : '';
        }
        var previousGS1Data = dataRecord.scriptParams.previousGS1Data;
        // @ts-ignore
        returnedQuantity = returnedQuantity ? returnedQuantity : '';
        var isIgnoreLotNumberUntilVariance = creationResult.ignoreLotNumberUntilVarianceGlobalPref ||
            creationResult.ignoreLotNumberUntilVarianceItemPref;
        if (creationResult.isLotItem) {
            //@ts-ignore
            returnedQuantity = 0;
            var itemCountDetailsUntilVariance = void 0;
            if (dataRecord.scriptParams.serialOrLotVarainceSubmit ||
                dataRecord.scriptParams.cancelVarianceClicked) {
                itemCountDetailsUntilVariance =
                    dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
            }
            else {
                itemCountDetailsUntilVariance = creationResult.itemCountDetailsUntilVariance;
            }
            itemCountDetailsUntilVariance = itemCountDetailsUntilVariance === null || itemCountDetailsUntilVariance === void 0 ? void 0 : itemCountDetailsUntilVariance.filter(function (icd) { return icd.currentQuantity > 0; });
            var isItemCountDetailsUntilVarianceExists = itemCountDetailsUntilVariance && itemCountDetailsUntilVariance.length;
            if (isIgnoreLotNumberUntilVariance &&
                isItemCountDetailsUntilVarianceExists &&
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                    'fromVariancePopup') {
                if (defaultInventoryStatusId) {
                    itemCountDetailsUntilVariance = itemCountDetailsUntilVariance.filter(function (icd) { return icd.inventoryStatusId == defaultInventoryStatusId; });
                }
                if (defaultUomId) {
                    itemCountDetailsUntilVariance = itemCountDetailsUntilVariance.filter(function (itemCount) { return itemCount.uomId == (uomIdFromGs1 || defaultUomId); });
                }
                returnedQuantity = itemCountDetailsUntilVariance.length
                    ? itemCountDetailsUntilVariance[0].currentQuantity
                    : 0;
            }
        }
        _mobile.setValueInPage('totalQuantityCounted', returnedQuantity);
        var querySelectorElements = document.querySelectorAll('[for="quantity"]');
        var elementForTotalQuantity = document.querySelectorAll('[for="totalQuantityCounted"]');
        if (dataRecord.scriptParams.itemCountCreateResponse.allowManualCount) {
            _mobile.enableField('quantity');
            _mobile.enableField('totalQuantityCounted');
            if (querySelectorElements.length > 0) {
                querySelectorElements[0].parentElement.classList.add('Inline');
            }
            if (elementForTotalQuantity.length > 0) {
                var firstElement = elementForTotalQuantity[0];
                firstElement.parentElement.classList.add('Inline');
                firstElement.parentElement.classList.remove('newLine');
                firstElement.parentElement.style.float = 'right';
                firstElement.parentElement.style.marginRight = 'auto';
            }
            _mobile.hideField('resetQuantity');
        }
        else {
            _mobile.disableField('quantity');
            _mobile.disableField('totalQuantityCounted');
            if (querySelectorElements.length > 0) {
                querySelectorElements[0].parentElement.classList.add('Inline');
            }
            var currentCountQuantity = _mobile.getValueFromPage('quantity');
            if (Number(currentCountQuantity) > 0) {
                _mobile.showField('resetQuantity');
            }
        }
        if (creationResult.isSerialItem) {
            if (!creationResult.ignoreSerialNumberUntilVariance ||
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction ==
                    'fromVariancePopup') {
                var childElement = document.getElementById('viewserialnumbers');
                childElement.parentElement.classList.add('newLine');
                childElement.parentElement.style.paddingBottom = '5px';
                _mobile.showField('serials');
                _mobile.showField('viewserialnumbers');
            }
            else {
                setTimeout(function () {
                    _mobile.hideField('serials');
                    _mobile.hideField('viewserialnumbers');
                });
            }
            if (elementForTotalQuantity.length > 0) {
                elementForTotalQuantity[0].parentElement.classList.add('Inline');
            }
            _mobile.hideField('resetQuantity');
            if (!creationResult.allowManualCount) {
                _mobile.disableField('quantity');
                _mobile.disableField('totalQuantityCounted');
            }
            else {
                _mobile.enableField('quantity');
                _mobile.enableField('totalQuantityCounted');
            }
        }
        else {
            _mobile.hideField('serials');
            _mobile.hideField('viewserialnumbers');
        }
        if (creationResult.isLotItem) {
            dataRecord.scriptParams.isIgnoreLotNumberUntilVariance = isIgnoreLotNumberUntilVariance;
            if (!isIgnoreLotNumberUntilVariance ||
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction ==
                    'fromVariancePopup') {
                var childElement = document.getElementById('viewlotnumbers');
                childElement.parentElement.classList.add('newLine');
                childElement.parentElement.style.paddingBottom = '5px';
                _mobile.showField('lotnumber');
                _mobile.showField('lotselect');
                _mobile.showField('viewlotnumbers');
                dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance = [];
            }
            else {
                _mobile.hideField('lotnumber');
                _mobile.hideField('lotselect');
                _mobile.hideField('viewlotnumbers');
                if (creationResult.itemCountDetailsUntilVariance &&
                    creationResult.itemCountDetailsUntilVariance.length) {
                    dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance =
                        creationResult.itemCountDetailsUntilVariance;
                }
                else {
                    dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance = [];
                }
            }
            _mobile.hideField('resetQuantity');
            if (elementForTotalQuantity.length > 0) {
                elementForTotalQuantity[0].parentElement.classList.add('Inline');
            }
            dataRecord.scriptParams.countedLotNumbersList = { popupTitle: '' };
        }
        else {
            _mobile.hideField('lotnumber');
            _mobile.hideField('lotselect');
            _mobile.hideField('viewlotnumbers');
        }
        if (dataRecord.scriptParams.pausedItem == true) {
            _mobile.setValueInPage('item', '');
        }
        _mobile.enableField('completeCount_actBtn');
        _mobile.enableField('pauseCount_actBtn');
        _mobile.enableField('cancel_bckBtn');
        _mobile.showField('itemName');
        var countType = dataRecord.auxParams.itemsTbl && Object.keys(dataRecord.auxParams.itemsTbl).length > 1
            ? 'DirectedCount'
            : 'NonDirectedCount';
        var binEnabled = countType == 'DirectedCount'
            ? !!dataRecord.auxParams.itemsTbl.binNumber
            : dataRecord.auxParams.userLocationsTbl
                ? dataRecord.auxParams.userLocationsTbl.binEnabled
                : dataRecord.scriptParams.selectedLocation.binEnabled;
        if (binEnabled) {
            _mobile.showField('binName');
        }
        _mobile.showField('remarks');
        var isLotOrSerialItem = creationResult.isSerialItem || creationResult.isLotItem;
        if (dataRecord.scriptParams.tallyScanNotSuccessful) {
            if (!isLotOrSerialItem) {
                if (returnedQuantity) {
                    returnedQuantity += (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.quantity) || 1;
                }
                else {
                    returnedQuantity = (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.quantity) || 1;
                }
                dataRecord.scriptParams.isItemTallyScanned = true;
                _mobile.setValueInPage('quantity', (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.quantity) || 1);
                _mobile.setValueInPage('totalQuantityCounted', returnedQuantity);
            }
            else if (creationResult.isSerialItem) {
                if (creationResult.ignoreSerialNumberUntilVariance &&
                    creationResult.selectedPopupAction != 'fromVariancePopup') {
                    setQuantityOnScan(dataRecord, returnedQuantity, previousGS1Data);
                }
                else if (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.serialNumber) {
                    dataRecord.scriptParams.setFocusOnItem = true;
                    _mobile.setValueInPage('serials', previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.serialNumber);
                }
                else {
                    _mobile.setFocusOnElement('serials');
                }
            }
            else if (creationResult.isLotItem) {
                if (isIgnoreLotNumberUntilVariance &&
                    creationResult.selectedPopupAction != 'fromVariancePopup') {
                    setQuantityOnScan(dataRecord, returnedQuantity, previousGS1Data);
                }
                else if (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.lotNumber) {
                    dataRecord.scriptParams.callLotOnScan = true;
                    dataRecord.scriptParams.setFocusOnItem = true;
                    _mobile.setValueInPage('lotnumber', '');
                    _mobile.setValueInPage('lotnumber', previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.lotNumber);
                    _mobile.setFocusOnElement('lotnumber');
                }
                else {
                    _mobile.setFocusOnElement('lotnumber');
                }
            }
        }
        else {
            dataRecord.scriptParams.callIncrementQuantity = true;
            if (creationResult.isSerialItem) {
                if ((!creationResult.ignoreSerialNumberUntilVariance ||
                    creationResult.selectedPopupAction == 'fromVariancePopup') && (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.serialNumber)) {
                    _mobile.setValueInPage('serials', previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.serialNumber);
                    dataRecord.scriptParams.callIncrementQuantity = false;
                    dataRecord.scriptParams.setFocusOnItemWhenTally = true;
                }
            }
            if (creationResult.isLotItem) {
                if ((!isIgnoreLotNumberUntilVariance ||
                    creationResult.selectedPopupAction == 'fromVariancePopup') && (previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.lotNumber)) {
                    dataRecord.scriptParams.lotGs1scanned = true;
                    _mobile.setValueInPage('lotnumber', '');
                    _mobile.setValueInPage('lotnumber', previousGS1Data.lotNumber);
                    if (creationResult.allowManualCount) {
                        dataRecord.scriptParams.shouldEnterLotQuantity = true;
                    }
                }
            }
        }
        dataRecord.scriptParams.tallyScanNotSuccessful = false;
        dataRecord.scriptParams.isSerialTallyScanned = false;
        dataRecord.scriptParams.incrementLotCurrentQtyForEveryscan = null;
        dataRecord.scriptParams.previouslyScannedLotNumber = null;
        dataRecord.scriptParams.tallyScanCurrentCount = null;
        _mobile.setRecordInState(dataRecord);
    }
    function setQuantityOnScan(newDataRecord, returnedQuantity, previousGS1Data) {
        //@ts-ignore;
        var _mobile = mobile;
        var state = _mobile.getRecordFromState();
        var tallyScanNotSuccessful = newDataRecord.scriptParams.tallyScanNotSuccessful;
        var currentCountValue = Number(tallyScanNotSuccessful && previousGS1Data
            ? previousGS1Data.quantity || 1
            : tallyScanNotSuccessful
                ? 1
                : 0);
        returnedQuantity = Number(returnedQuantity) + currentCountValue;
        state.scriptParams.isItemTallyScanned = true;
        _mobile.setValueInPage('quantity', currentCountValue || '');
        _mobile.setValueInPage('totalQuantityCounted', returnedQuantity || '');
    }
    function callItemCountEditRestlet(itemCountId, dataRecord) {
        // @ts-ignore
        var _mobile = mobile;
        var itemCountStatus = dataRecord.scriptParams.itemCountCreateResponse.itemCountStatus;
        if (itemCountStatus == 4 || itemCountStatus == 5) {
            return;
        }
        _mobile.setRecordInState(dataRecord);
        var itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
        itemCountDetails = itemCountDetails.map(function (_a) {
            var index = _a.index, rest = __rest(_a, ["index"]);
            return rest;
        });
        var itemCountRecordEditParams = {
            itemCountIdParam: itemCountId,
            statusIdParam: 8,
            itemCountDetails: itemCountDetails,
            nextItem: dataRecord.scriptParams.itemCountCreateResponse.nextItem
        };
        if (dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId) {
            itemCountRecordEditParams.currentInvtStatus =
                dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        }
        if (dataRecord.scriptParams.itemCountCreateResponse.defaultUomId) {
            itemCountRecordEditParams.currentUom =
                dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
        }
        dataRecord.auxParams.itemCountRemarks || dataRecord.auxParams.itemCountRemarks == ''
            ? (itemCountRecordEditParams['remarksParam'] = dataRecord.auxParams.itemCountRemarks)
            : '';
        itemCountRecordEditParams.whenIgnoreLotNumberUntilVariance =
            dataRecord.scriptParams.itemCountCreateResponse.isLotItem &&
                dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                    'fromVariancePopup';
        if (itemCountRecordEditParams.whenIgnoreLotNumberUntilVariance) {
            itemCountRecordEditParams.itemCountDetailsUntilVariance =
                dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
        }
        if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
            itemCountRecordEditParams.serialsQuantity =
                dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity;
            itemCountRecordEditParams.statusQuantityDetails =
                dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
        }
        _mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
            itemCountRecord: itemCountRecordEditParams,
            isFromClient: true
        }, 'post');
    }
    function resetFields(dataRecord) {
        // @ts-ignore
        var _mobile = mobile;
        _mobile.disableField('pauseCount_actBtn');
        _mobile.disableField('completeCount_actBtn');
        _mobile.setValueInPage('inventoryStatus', '');
        _mobile.hideField('inventoryStatus');
        _mobile.setValueInPage('unitOfMeasurement', '');
        _mobile.hideField('unitOfMeasurement');
        _mobile.setValueInPage('serials', '');
        _mobile.setValueInPage('lotnumber', '');
        _mobile.hideField('serials');
        _mobile.hideField('lotnumber');
        _mobile.hideField('lotselect');
        _mobile.hideField('viewserialnumbers');
        _mobile.hideField('viewlotnumbers');
        _mobile.setValueInPage('quantity', '');
        _mobile.setValueInPage('totalQuantityCounted', '');
        dataRecord.scriptParams.itemCountCreateResponse = null;
        dataRecord.scriptParams.previousScannedUpcValue = null;
        dataRecord.scriptParams.duplicateUpcItem = false;
        dataRecord.scriptParams.previousGS1Data = null;
        dataRecord.scriptParams.previousGS1 = null;
        dataRecord.scriptParams.tallyScanNotSuccessful =
            (dataRecord.scriptParams.isFromEnableItemFieldWithGS1 ||
                dataRecord.scriptParams.isFromEnableItemField) &&
                dataRecord.scriptParams.tallyScanNotSuccessful;
        _mobile.setRecordInState(dataRecord);
    }
    function hideItemDetailsAndRemarks() {
        // @ts-ignore
        var _mobile = mobile;
        _mobile.hideField('itemName');
        _mobile.hideField('binName');
        _mobile.hideField('remarks');
        _mobile.enableField('cancel_bckBtn');
        _mobile.setValueInPage('hiddenDuplicateUpc', '');
    }
    function replacePlaceholders(translatedString, params) {
        var replacedString = translatedString;
        for (var i = 0; i < params.length; i++) {
            replacedString = replacedString.replace('${' + (i + 1) + '}', params[i]);
        }
        return replacedString;
    }
    function setMargin() {
        setTimeout(function () {
            var bannerElement = document.evaluate("//span[@id='banner']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            var bannerMarginElement = document.evaluate("//span[@id='banner']/parent::div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // @ts-ignore
            bannerMarginElement.style.marginTop = bannerElement.clientHeight + 'px';
        }, 0);
    }
    //@ts-ignore
    clientFunctions.clearItemCountState = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        dataRecord.scriptParams.nonDirectedCount = true;
        _mobile.setRecordInState(dataRecord);
        if (dataRecord.auxParams.itemsTbl) {
            dataRecord.auxParams.itemsTbl = null;
        }
        if (dataRecord.scriptParams.itemCountCreateResponse) {
            callItemCountEditRestlet(dataRecord.scriptParams.itemCountCreateResponse.itemCountId, dataRecord);
            dataRecord.scriptParams.itemCountCreateResponse = null;
            dataRecord.scriptParams.previousScannedUpcValue = null;
            dataRecord.scriptParams.previousGS1Data = null;
            dataRecord.scriptParams.previousGS1 = null;
            _mobile.setRecordInState(dataRecord);
        }
    };
    function htmlEscape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function setInventoryNumberElementFocus() {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var creationResponse = dataRecord.scriptParams.itemCountCreateResponse;
        if (creationResponse.isLotItem) {
            _mobile.setFocusOnElement('lotnumber');
        }
        else if (creationResponse.isSerialItem) {
            _mobile.setFocusOnElement('serials');
        }
    }
    function incrementQuantity(previousGS1Data, dataRecord, totalQuantity) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // @ts-ignore
        var _mobile = mobile;
        var itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
        var isIgnoreLotNumberUntilVariance = itemCountCreateResponse.ignoreLotNumberUntilVarianceGlobalPref ||
            itemCountCreateResponse.ignoreLotNumberUntilVarianceItemPref;
        var defaultInventoryStatusId = (_a = dataRecord.scriptParams.itemCountCreateResponse) === null || _a === void 0 ? void 0 : _a.defaultInventoryStatusId;
        var defaultUomId = (_b = dataRecord.scriptParams.itemCountCreateResponse) === null || _b === void 0 ? void 0 : _b.defaultUomId;
        if (itemCountCreateResponse.isLotItem &&
            isIgnoreLotNumberUntilVariance &&
            itemCountCreateResponse.selectedPopupAction != 'fromVariancePopup') {
            dataRecord.scriptParams.callIncrementQuantity = true;
            if ((_c = previousGS1Data.uomDetails) === null || _c === void 0 ? void 0 : _c.uomId) {
                _mobile.setValueInPage('unitOfMeasurement', previousGS1Data.uomDetails.uomName);
            }
            var currentStatus_1 = ((_d = _mobile.getValueFromPage('inventoryStatus')) === null || _d === void 0 ? void 0 : _d.value) || defaultInventoryStatusId;
            var currentUom_1 = ((_e = _mobile.getValueFromPage('unitOfMeasurement')) === null || _e === void 0 ? void 0 : _e.value) || defaultUomId;
            var index = itemCountCreateResponse.itemCountDetailsUntilVariance.findIndex(function (itemCount) {
                return ((defaultUomId ? itemCount.uomId == currentUom_1 : true) &&
                    (defaultInventoryStatusId
                        ? itemCount.inventoryStatusId == currentStatus_1
                        : true));
            });
            var lotQuantity = index != -1
                ? itemCountCreateResponse.itemCountDetailsUntilVariance[index].currentQuantity
                : '';
            _mobile.setValueInPage('totalQuantityCounted', '');
            _mobile.setValueInPage('totalQuantityCounted', lotQuantity || '');
            if (!itemCountCreateResponse.allowManualCount) {
                dataRecord.scriptParams.setFocusOnItemWhenTally = true;
            }
        }
        if (itemCountCreateResponse.isSerialItem) {
            if (itemCountCreateResponse.ignoreSerialNumberUntilVariance &&
                itemCountCreateResponse.selectedPopupAction != 'fromVariancePopup') {
                dataRecord.scriptParams.callIncrementQuantity = true;
                if (!itemCountCreateResponse.allowManualCount) {
                    dataRecord.scriptParams.setFocusOnItemWhenTally = true;
                }
            }
            else {
                dataRecord.scriptParams.callIncrementQuantity = !itemCountCreateResponse.allowManualCount;
                if (previousGS1Data.serialNumber) {
                    _mobile.setValueInPage('serials', previousGS1Data.serialNumber);
                    dataRecord.scriptParams.setFocusOnItemWhenTally = true;
                }
                else {
                    setValidItemBannerMsg(itemCountCreateResponse.itemName);
                }
            }
            return;
        }
        if (itemCountCreateResponse.isLotItem) {
            if (!isIgnoreLotNumberUntilVariance ||
                itemCountCreateResponse.selectedPopupAction == 'fromVariancePopup') {
                dataRecord.scriptParams.callIncrementQuantity = true;
                if (previousGS1Data.lotNumber) {
                    dataRecord.scriptParams.lotGs1scanned = true;
                    _mobile.setValueInPage('lotnumber', '');
                    _mobile.setValueInPage('lotnumber', previousGS1Data.lotNumber);
                }
                if ((_f = previousGS1Data.uomDetails) === null || _f === void 0 ? void 0 : _f.uomId) {
                    _mobile.setValueInPage('unitOfMeasurement', previousGS1Data.uomDetails.uomName);
                }
                if (itemCountCreateResponse.allowManualCount) {
                    dataRecord.scriptParams.shouldEnterLotQuantity = true;
                }
            }
            return;
        }
        if (itemCountCreateResponse.allowManualCount && itemCountCreateResponse.defaultUomId) {
            if ((_g = previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.uomDetails) === null || _g === void 0 ? void 0 : _g.uomName) {
                _mobile.setValueInPage('unitOfMeasurement', previousGS1Data.uomDetails.uomName);
            }
            var currentStatus_2 = ((_h = _mobile.getValueFromPage('inventoryStatus')) === null || _h === void 0 ? void 0 : _h.value) ||
                dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
            var currentUom_2 = ((_j = _mobile.getValueFromPage('unitOfMeasurement')) === null || _j === void 0 ? void 0 : _j.value) ||
                dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
            var itemCountDetails = itemCountCreateResponse.itemCountDetails.filter(function (itemCount) {
                return (itemCount.uomIdParam == currentUom_2 &&
                    itemCount.inventoryStatusIdParam == currentStatus_2);
            });
            totalQuantity = itemCountDetails[0].countQuantityParam;
            _mobile.setValueInPage('totalQuantityCounted', totalQuantity || '');
        }
        dataRecord.scriptParams.callIncrementQuantity = true;
    }
    function setValidItemBannerMsg(itemName) {
        // @ts-ignore
        var _mobile = mobile;
        _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
            '#d7fccf',
            headerHeight
        ]) +
            replacePlaceholders(_mobile.getValueFromPage('validItem'), [htmlEscape(itemName)]) +
            _mobile.getValueFromPage('bannerEnd')));
    }
    function htmlDecode(str) {
        return String(str)
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    return clientFunctions;
})();
