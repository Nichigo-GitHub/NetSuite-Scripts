/* enable-cache:true */
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
    clientFunctions.processRescanIgnore = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        dataRecord.scriptParams.popupButtonSelected = 'ignore';
        dataRecord.scriptParams.itemCountCreateResponse = null;
        dataRecord.scriptParams.previousScannedUpcValue = null;
        dataRecord.auxParams.itemsTbl = null;
        _mobile.setRecordInState(dataRecord);
    };
    // @ts-ignore
    clientFunctions.processRescanRecount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, itemCountCreateResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.popupButtonSelected = 'recount';
                        itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
                        dataRecord.scriptParams.itemCountCreateResponse = null;
                        dataRecord.scriptParams.selectedItemInfo = null;
                        dataRecord.scriptParams.previousScannedUpcValue = null;
                        dataRecord.scriptParams.binScanned = false;
                        _mobile.setRecordInState(dataRecord);
                        return [4 /*yield*/, cancelAndCreateNewItemCountRecord(itemCountCreateResponse)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // @ts-ignore
    clientFunctions.processRescanUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, itemCountEditRequest, itemCountDetails, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.popupButtonSelected = 'update';
                        dataRecord.scriptParams.isFromProcessRescanPopupUpdate = true;
                        _mobile.setRecordInState(dataRecord);
                        itemCountEditRequest = {};
                        itemCountEditRequest.itemCountIdParam =
                            dataRecord.scriptParams.itemCountCreateResponse.itemCountId;
                        itemCountEditRequest.statusIdParam = 1;
                        itemCountEditRequest.rescanAction = 'update';
                        if (dataRecord.auxParams.itemCountRemarks || dataRecord.auxParams.itemCountRemarks == '') {
                            itemCountEditRequest.remarksParam = dataRecord.auxParams.itemCountRemarks;
                        }
                        itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
                        itemCountDetails = itemCountDetails.map(function (_a) {
                            var index = _a.index, rest = __rest(_a, ["index"]);
                            return rest;
                        });
                        itemCountEditRequest.itemCountDetails = itemCountDetails;
                        if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
                            itemCountEditRequest.serialsQuantity =
                                dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity;
                            itemCountEditRequest.statusQuantityDetails =
                                dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
                        }
                        if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem) {
                            itemCountEditRequest.whenIgnoreLotNumberUntilVariance =
                                dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                                    dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                                        'fromVariancePopup';
                            if (itemCountEditRequest.whenIgnoreLotNumberUntilVariance) {
                                itemCountEditRequest.itemCountDetailsUntilVariance =
                                    dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
                            }
                        }
                        if (dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId) {
                            itemCountEditRequest.currentInvtStatus =
                                dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
                        }
                        if (dataRecord.scriptParams.itemCountCreateResponse.defaultUomId) {
                            itemCountEditRequest.currentUom =
                                dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
                        }
                        _a = dataRecord.scriptParams;
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
                                itemCountRecord: itemCountEditRequest,
                                isFromClient: true
                            }, 'post')];
                    case 1:
                        _a.itemCountCreateResponse = _b.sent();
                        _mobile.setRecordInState(dataRecord);
                        if (dataRecord.scriptParams.popupResponse.onhandQuantityChangedDuringRescan == true) {
                            _mobile.setValueInPage('Hidden_Rescan', 'showOHCPopup');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // @ts-ignore
    clientFunctions.processRescanPopupOnClose = function () {
        var _a;
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var creationResponse = dataRecord.scriptParams.itemCountCreateResponse;
        var selectedItemInfo = dataRecord.scriptParams.selectedItemInfo;
        if (dataRecord.auxParams.itemsTbl &&
            (dataRecord.auxParams.itemsTbl.itemCountStatus === 2 ||
                dataRecord.auxParams.itemsTbl.itemCountStatus === 3 ||
                dataRecord.auxParams.itemsTbl.itemCountStatus === 4) &&
            !dataRecord.scriptParams.itemListBackResponse) {
            dataRecord.scriptParams.rescanPopupOpened = false;
            dataRecord.scriptParams.showPopup = 'F';
            if (selectedItemInfo.binNumber) {
                setTimeout(function () {
                    _mobile.setValueInPage('bin', selectedItemInfo.binNumber);
                }, 10);
            }
            setTimeout(function () {
                _mobile.setValueInPage('item', selectedItemInfo.upcCode ? selectedItemInfo.upcCode : selectedItemInfo.name);
            }, 100);
            return;
        }
        if (dataRecord.scriptParams.popupButtonSelected == 'Continue') {
            dataRecord.scriptParams.popupButtonSelected = null;
        }
        var isIgnoreLotNumberUntilVariance = (creationResponse === null || creationResponse === void 0 ? void 0 : creationResponse.ignoreLotNumberUntilVarianceGlobalPref) || (creationResponse === null || creationResponse === void 0 ? void 0 : creationResponse.ignoreLotNumberUntilVarianceItemPref);
        dataRecord.scriptParams.isIgnoreLotNumberUntilVariance = isIgnoreLotNumberUntilVariance;
        if (creationResponse &&
            (dataRecord.scriptParams.popupButtonSelected == 'update' ||
                dataRecord.scriptParams.itemListBackResponse ||
                dataRecord.scriptParams.serialOrLotVarainceSubmit)) {
            _mobile.setValueInPage('itemName', htmlEscape(creationResponse.itemName));
            if (creationResponse.binNumber) {
                setTimeout(function () {
                    _mobile.setValueInPage('bin', htmlEscape(creationResponse.binNumber));
                    _mobile.setFocusOnElement('item');
                }, 10);
            }
            setTimeout(function () {
                var _a;
                var item = dataRecord.scriptParams.previousScannedUpcValue;
                if (dataRecord.scriptParams.duplicateUpcItem) {
                    item = creationResponse.itemName;
                }
                else if ((_a = dataRecord.scriptParams.previousGS1Data) === null || _a === void 0 ? void 0 : _a.gtin) {
                    item = '01' + dataRecord.scriptParams.previousGS1Data.gtin;
                }
                _mobile.setValueInPage('item', item);
            }, 10);
            var itemUOMDropdown_1 = [];
            var inventoryStatusDropdown_1 = [];
            var defaultUomId_1 = creationResponse.defaultUomId;
            var defaultInventoryStatusId_1 = creationResponse.defaultInventoryStatusId;
            var defaultInventoryStatusName_1 = null;
            var defaultUomName_1 = null;
            var itemCountDetails = creationResponse.itemCountDetails;
            var baseUnitName = creationResponse.baseUnitName;
            var baseUnitId_1 = creationResponse.baseUnitId;
            var lotItemWithoutOnhandUOMDetails = dataRecord.scriptParams.itemCountCreateResponse.lotItemWithoutOnhandUOMDetails;
            if (creationResponse.binNumber) {
                _mobile.setValueInPage('binName', htmlEscape(creationResponse.binNumber));
                _mobile.showField('binName');
            }
            _mobile.setValueInPage('itemName', htmlEscape(creationResponse.itemName));
            if (defaultInventoryStatusId_1) {
                dataRecord.scriptParams.inventoryStatuses.forEach(function (inventoryStatus) {
                    inventoryStatusDropdown_1.push({
                        value: inventoryStatus.internalId,
                        label: inventoryStatus.status
                    });
                    if (inventoryStatus.internalId == defaultInventoryStatusId_1) {
                        defaultInventoryStatusName_1 = inventoryStatus.status;
                    }
                });
                _mobile.setElementSourceData('inventoryStatus', inventoryStatusDropdown_1);
                _mobile.setValueInPage('inventoryStatus', defaultInventoryStatusName_1);
                _mobile.showField('inventoryStatus');
            }
            if (defaultUomId_1 || baseUnitId_1) {
                var itemUOMDetails = itemCountDetails.length
                    ? itemCountDetails
                    : lotItemWithoutOnhandUOMDetails.length
                        ? lotItemWithoutOnhandUOMDetails
                        : [];
                itemUOMDetails.forEach(function (obj) {
                    if (!itemUOMDropdown_1.some(function (uomObj) { return uomObj.value == obj.uomIdParam; })) {
                        itemUOMDropdown_1.push({
                            value: obj.uomIdParam,
                            label: obj.uomNameParam
                        });
                        if (obj.uomIdParam == defaultUomId_1) {
                            defaultUomName_1 = obj.uomNameParam;
                        }
                    }
                });
                _mobile.setElementSourceData('unitOfMeasurement', itemUOMDropdown_1);
                if (creationResponse.isSerialItem) {
                    if (!itemUOMDropdown_1.length) {
                        _mobile.setElementSourceData('unitOfMeasurement', [
                            {
                                value: baseUnitId_1,
                                label: baseUnitName
                            }
                        ]);
                    }
                    _mobile.setValueInPage('unitOfMeasurement', baseUnitName);
                    _mobile.disableField('unitOfMeasurement');
                }
                else {
                    _mobile.setValueInPage('unitOfMeasurement', defaultUomName_1);
                    _mobile.enableField('unitOfMeasurement');
                }
                _mobile.showField('unitOfMeasurement');
            }
            var dropdownElements_1 = [];
            setTimeout(function () {
                var uomDropDown = document
                    .evaluate("(//div[@class='dropdown__container']/div[2])[3]", document, null, XPathResult.ANY_TYPE, null)
                    .iterateNext();
                // @ts-ignore
                uomDropDown.style.backgroundColor =
                    creationResponse.isSerialItem && baseUnitId_1 ? '#c9c9c9' : 'unset';
                //@ts-ignore
                dropdownElements_1 = document.getElementsByClassName('dropdown--placeholder');
                if (dropdownElements_1.length > 0) {
                    var dropdownLength = dropdownElements_1.length;
                    while (dropdownLength > 0) {
                        dropdownElements_1[0].classList.remove('dropdown--placeholder');
                        dropdownLength--;
                    }
                }
            }, 1000);
            var returnedQuantity_1 = 0;
            if (defaultInventoryStatusId_1) {
                itemCountDetails = itemCountDetails.filter(function (itemCount) { return itemCount.inventoryStatusIdParam == defaultInventoryStatusId_1; });
            }
            if (defaultUomId_1) {
                itemCountDetails = itemCountDetails.filter(function (itemCount) { return itemCount.uomIdParam == defaultUomId_1; });
            }
            // @ts-ignore
            returnedQuantity_1 = ((_a = itemCountDetails[0]) === null || _a === void 0 ? void 0 : _a.countQuantityParam) || '';
            if (creationResponse.isSerialItem) {
                if (defaultInventoryStatusId_1) {
                    returnedQuantity_1 = creationResponse.statusQuantityDetails.find(function (ele) { return ele.status == defaultInventoryStatusId_1; }).quantity;
                }
                else {
                    returnedQuantity_1 = creationResponse.serialsQuantity;
                }
            }
            if (creationResponse.isLotItem) {
                //@ts-ignore
                returnedQuantity_1 = 0;
                var isItemCountDetailsUntilVarianceExists = creationResponse.itemCountDetailsUntilVariance &&
                    creationResponse.itemCountDetailsUntilVariance.length;
                var itemCountDetailsUntilVariance = creationResponse.itemCountDetailsUntilVariance
                    ? creationResponse.itemCountDetailsUntilVariance
                    : [];
                if (isIgnoreLotNumberUntilVariance &&
                    !!isItemCountDetailsUntilVarianceExists &&
                    creationResponse.selectedPopupAction != 'fromVariancePopup') {
                    if (defaultInventoryStatusId_1) {
                        itemCountDetailsUntilVariance = itemCountDetailsUntilVariance.filter(function (icd) { return icd.inventoryStatusId == defaultInventoryStatusId_1; });
                    }
                    if (defaultUomId_1) {
                        itemCountDetailsUntilVariance = itemCountDetailsUntilVariance.filter(function (itemCount) { return itemCount.uomId == defaultUomId_1; });
                    }
                    returnedQuantity_1 = itemCountDetailsUntilVariance.length
                        ? itemCountDetailsUntilVariance[0].currentQuantity
                        : 0;
                }
            }
            setTimeout(function () {
                _mobile.setValueInPage('totalQuantityCounted', returnedQuantity_1);
            }, 500);
            var querySelectorElements = document.querySelectorAll('[for="quantity"]');
            var elementForTotalQuantity = document.querySelectorAll('[for="totalQuantityCounted"]');
            if (creationResponse.allowManualCount) {
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
            if (creationResponse.isSerialItem) {
                if (dataRecord.scriptParams.serialOrLotVarainceSubmit ||
                    (creationResponse.ignoreSerialNumberUntilVariance &&
                        creationResponse.selectedPopupAction != 'fromVariancePopup')) {
                    _mobile.hideField('serials');
                    _mobile.hideField('viewserialnumbers');
                }
                else {
                    _mobile.showField('serials');
                    _mobile.showField('viewserialnumbers');
                }
                if (elementForTotalQuantity.length > 0) {
                    elementForTotalQuantity[0].parentElement.classList.add('Inline');
                }
                _mobile.hideField('resetQuantity');
                if (!creationResponse.allowManualCount) {
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
            if (creationResponse.isLotItem) {
                if (dataRecord.scriptParams.serialOrLotVarainceSubmit) {
                    _mobile.hideField('lotnumber');
                    _mobile.hideField('lotselect');
                    _mobile.hideField('viewlotnumbers');
                }
                else if (!dataRecord.scriptParams.isIgnoreLotNumberUntilVariance ||
                    creationResponse.selectedPopupAction == 'fromVariancePopup') {
                    _mobile.showField('lotnumber');
                    _mobile.showField('lotselect');
                    _mobile.showField('viewlotnumbers');
                    dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance = [];
                }
                else {
                    _mobile.hideField('lotnumber');
                    _mobile.hideField('lotselect');
                    _mobile.hideField('viewlotnumbers');
                    if (creationResponse.itemCountDetailsUntilVariance &&
                        creationResponse.itemCountDetailsUntilVariance.length) {
                        dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance =
                            creationResponse.itemCountDetailsUntilVariance;
                    }
                    else {
                        dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance = [];
                    }
                    dataRecord.scriptParams.countedLotNumbersList = { popupTitle: '' };
                }
                _mobile.hideField('resetQuantity');
                if (elementForTotalQuantity.length > 0) {
                    elementForTotalQuantity[0].parentElement.classList.add('Inline');
                }
            }
            else {
                _mobile.hideField('lotnumber');
                _mobile.hideField('lotselect');
                _mobile.hideField('viewlotnumbers');
            }
            _mobile.enableField('pauseCount_actBtn');
            _mobile.enableField('completeCount_actBtn');
            _mobile.showField('itemName');
            _mobile.showField('remarks');
            _mobile.enableField('item');
            _mobile.setFocusOnElement('item');
            if (dataRecord.scriptParams.completeAndNextEnabled) {
                if (creationResponse.countConfigReferenceId) {
                    _mobile.hideField('completeCount_actBtn');
                    _mobile.showField('completeAndNextCount_actBtn');
                }
                else {
                    _mobile.hideField('completeAndNextCount_actBtn');
                    _mobile.showField('completeCount_actBtn');
                }
            }
            if (dataRecord.scriptParams.onhandchangepopupButtonSelected == true &&
                dataRecord.scriptParams.itemCountCreateResponse.binId) {
                _mobile.setFocusOnElement('bin');
            }
            dataRecord.scriptParams.onhandchangepopupButtonSelected = null;
            dataRecord.scriptParams.popupButtonSelected = null;
            dataRecord.scriptParams.itemListBackResponse = null;
        }
        _mobile.setRecordInState(dataRecord);
    };
    //@ts-ignore
    clientFunctions.setRescanPopupMessage = function () {
        //@ts-ignore
        document.getElementsByClassName('svg-image close')[0].style.display = 'none';
        //@ts-ignore
        document.getElementsByClassName('headerPopup')[0].style.display = 'none';
    };
    //@ts-ignore
    clientFunctions.setOnhandChangeCompletePopupMessage = function () {
        //@ts-ignore
        document.getElementsByClassName('svg-image close')[0].style.display = 'none';
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var text = dataRecord.scriptParams.completePopupMessage;
        _mobile.setPopupElementSourceData('PopupText', text);
    };
    //@ts-ignore
    clientFunctions.setOnhandChangePopupMessage = function () {
        //@ts-ignore
        document.getElementsByClassName('svg-image close')[0].style.display = 'none';
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var text = dataRecord.scriptParams.resumePopupMessage;
        _mobile.setPopupElementSourceData('PopupText', text);
    };
    function cancelAndCreateNewItemCountRecord(itemCountCreateResponse) {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, itemCountEditRequest, itemCountDetails, itemCountRecordCreateWithRefParams, _a, binNumber, binId, itemId, itemName, upcCode, countConfigReferenceId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        itemCountEditRequest = {};
                        if (!itemCountCreateResponse) return [3 /*break*/, 2];
                        itemCountEditRequest.itemCountIdParam = itemCountCreateResponse.itemCountId;
                        itemCountEditRequest.statusIdParam = 7;
                        itemCountEditRequest.rescanAction = 'recount';
                        if (dataRecord.auxParams.itemCountRemarks ||
                            dataRecord.auxParams.itemCountRemarks == '') {
                            itemCountEditRequest.remarksParam = dataRecord.auxParams.itemCountRemarks;
                        }
                        itemCountDetails = itemCountCreateResponse.itemCountDetails;
                        if (itemCountDetails) {
                            itemCountDetails = itemCountDetails.map(function (_a) {
                                var index = _a.index, rest = __rest(_a, ["index"]);
                                return rest;
                            });
                        }
                        itemCountEditRequest.itemCountDetails = itemCountDetails;
                        if (itemCountCreateResponse.isSerialItem) {
                            itemCountEditRequest.serialsQuantity = itemCountCreateResponse.serialsQuantity;
                            itemCountEditRequest.statusQuantityDetails =
                                itemCountCreateResponse.statusQuantityDetails;
                        }
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
                                itemCountRecord: itemCountEditRequest,
                                isFromClient: true
                            }, 'post')];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        itemCountRecordCreateWithRefParams = {
                            itemCountIdParam: itemCountCreateResponse.itemCountId,
                            rescanAction: 'recount'
                        };
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_item_count_from_ref', 'customdeploy_sc_rl_item_count_from_ref', {
                                itemCountRecord: itemCountRecordCreateWithRefParams
                            }, 'post')];
                    case 3:
                        _a = _b.sent(), binNumber = _a.binNumber, binId = _a.binId, itemId = _a.itemId, itemName = _a.itemName, upcCode = _a.upcCode, countConfigReferenceId = _a.countConfigReferenceId;
                        dataRecord.scriptParams.recountedItemDetails = {
                            binNumber: binNumber,
                            binId: binId,
                            itemId: itemId,
                            itemName: itemName,
                            upcCode: upcCode,
                            countConfigReferenceId: countConfigReferenceId
                        };
                        dataRecord.auxParams.itemCountRemarks = null;
                        _mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    }
    //@ts-ignore
    clientFunctions.processOnhandChangeRecount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dataRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dataRecord = mobile.getRecordFromState();
                        dataRecord.scriptParams.onhandChangePopupOpened = true;
                        return [4 /*yield*/, onHandChangeOrVarianceRecountAction(dataRecord)];
                    case 1:
                        _a.sent();
                        resetAndDisableFields(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    };
    //@ts-ignore
    clientFunctions.processOnhandChangeResumeContinue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, itemCountCreateResponse, countConfigId, binId, previousGS1Data, itemCountRecordCreateParams, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.onhandChangePopupOpened = true;
                        itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
                        countConfigId = dataRecord.scriptParams.scannedCountConfigId;
                        binId = dataRecord.scriptParams.itemCountCreateResponse.binId;
                        dataRecord.scriptParams.popupButtonSelected = 'Continue';
                        previousGS1Data = dataRecord.scriptParams.previousGS1Data;
                        _mobile.setRecordInState(dataRecord);
                        itemCountRecordCreateParams = {
                            itemIdParam: itemCountCreateResponse.itemId,
                            locationIdParam: itemCountCreateResponse.locationId,
                            countTypeIdParam: countConfigId ? 1 : 2,
                            countConfigIdParam: countConfigId,
                            onhandChangeAction: 'continueCount',
                            nextItem: itemCountCreateResponse.nextItem
                        };
                        if (binId) {
                            itemCountRecordCreateParams['binIdParam'] = binId;
                        }
                        return [4 /*yield*/, mobile.callRestlet('customscript_sc_rl_item_count_creation', 'customdeploy_sc_rl_item_count_creation', {
                                itemCountRecord: itemCountRecordCreateParams
                            }, 'post')];
                    case 1:
                        result = _a.sent();
                        dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails = result.itemCountDetails;
                        _mobile.setRecordInState(dataRecord);
                        localStorage.setItem('ItemCountRecord', JSON.stringify(result));
                        if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem &&
                            !(previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.lotNumber)) {
                            _mobile.setFocusOnElement('lotnumber');
                        }
                        else if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem &&
                            !(previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.serialNumber)) {
                            _mobile.setFocusOnElement('serials');
                        }
                        else {
                            _mobile.setFocusOnElement('item');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    function resetAndDisableFields(dataRecord) {
        //@ts-ignore
        var _mobile = mobile;
        _mobile.setValueInPage('bin', '');
        _mobile.setValueInPage('item', '');
        _mobile.setValueInPage('quantity', '');
        _mobile.setValueInPage('totalQuantityCounted', '');
        if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
            _mobile.hideField('serials');
            _mobile.hideField('viewserialnumbers');
        }
        if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem) {
            _mobile.hideField('lotnumber');
            _mobile.hideField('lotselect');
            _mobile.hideField('viewlotnumbers');
        }
        if (dataRecord.auxParams.userLocationsTbl.binEnabled) {
            _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                '#faf8ce',
                headerHeight
            ]) +
                _mobile.getValueFromPage('scanBinMsg') +
                _mobile.getValueFromPage('bannerEnd')));
            _mobile.setFocusOnElement('bin');
        }
        else {
            _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                '#faf8ce',
                headerHeight
            ]) +
                _mobile.getValueFromPage('scanItemMsg') +
                _mobile.getValueFromPage('bannerEnd')));
            _mobile.setFocusOnElement('item');
        }
        dataRecord.scriptParams.validateVarianceClicked =
            dataRecord.scriptParams.validateVarianceClicked && false;
        dataRecord.scriptParams.isFromValidateLotItemPopup =
            dataRecord.scriptParams.isFromValidateLotItemPopup && false;
        _mobile.hideField('inventoryStatus');
        _mobile.hideField('unitOfMeasurement');
        _mobile.disableField('pauseCount_actBtn');
        _mobile.enableField('completeCount_actBtn');
        dataRecord.scriptParams.popupButtonSelected = 'Recount';
        dataRecord.scriptParams.onhandchangepopupButtonSelected = true;
        dataRecord.scriptParams.previousScannedUpcValue = null;
        dataRecord.scriptParams.binScanned = false;
        dataRecord.scriptParams.duplicateUpcItem = false;
        dataRecord.scriptParams.serialVarianceExists =
            dataRecord.scriptParams.serialVarianceExists && false;
        dataRecord.scriptParams.lotVarianceExists =
            dataRecord.scriptParams.lotVarianceExists && false;
        dataRecord.scriptParams.itemCountCreateResponse = null;
        _mobile.setRecordInState(dataRecord);
    }
    //@ts-ignore
    clientFunctions.hideEmptyDropdownValue = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var selectedConfigName = dataRecord.auxParams.countConfig.label;
        var selectedConfigNameMsg = _mobile.getValueFromPage('countConfigNameMsg');
        _mobile.setValueInPage('countConfigName', replacePlaceholders(selectedConfigNameMsg, [selectedConfigName]));
        _mobile.showField('countConfigName');
    };
    //@ts-ignore
    clientFunctions.fetchCountConfigs = function () {
        return [];
    };
    //@ts-ignore
    clientFunctions.setDropDownFieldInPausedCountPage = function () {
        setDropDownFieldValue('countConfig_pausedCnt');
        //@ts-ignore
        mobile.enableField('completeAllCounts_btn');
    };
    //@ts-ignore
    clientFunctions.setDropDownFieldInDoneCountPage = function () {
        setDropDownFieldValue('countConfig_doneCnt');
    };
    function setDropDownFieldValue(fieldId) {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var countConfigList = JSON.parse(JSON.stringify(fieldId == 'countConfig_doneCnt'
            ? dataRecord.scriptParams.countConfigListDC
            : dataRecord.scriptParams.countConfigListPC));
        _mobile.setElementSourceData(fieldId, countConfigList);
        var selectedCountConfigName = fieldId == 'countConfig_doneCnt'
            ? dataRecord.scriptParams.selectedCountConfigNameDC
            : dataRecord.scriptParams.selectedCountConfigNamePC;
        if (selectedCountConfigName) {
            _mobile.setValueInPage(fieldId, selectedCountConfigName);
        }
    }
    //@ts-ignore
    clientFunctions.processOnhandChangeCompleteContinue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, itemCountCreateResponse_1, itemCountDetails, itemsList, itemsListLength, currentItemIndex, nextIndex, countStatusItem, recountStatusItem, nextIndexItem, nextItem, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        if (!(dataRecord.scriptParams.serialVarianceExists &&
                            !dataRecord.scriptParams.validateVarianceClicked)) return [3 /*break*/, 1];
                        _mobile.setValueInPage('hiddenItem_ValidateVariance', true);
                        dataRecord.scriptParams.serialOrLotVarainceSubmit = true;
                        return [3 /*break*/, 4];
                    case 1:
                        if (!(dataRecord.scriptParams.lotVarianceExists &&
                            !dataRecord.scriptParams.isFromValidateLotItemPopup)) return [3 /*break*/, 2];
                        _mobile.setValueInPage('hiddenItem_ValidateLotItem_Popup', true);
                        dataRecord.scriptParams.serialOrLotVarainceSubmit = true;
                        return [3 /*break*/, 4];
                    case 2:
                        itemCountCreateResponse_1 = dataRecord.scriptParams.itemCountCreateResponse;
                        dataRecord.scriptParams.popupButtonSelected = 'Continue';
                        dataRecord.scriptParams.itemCountPopupDetails = null;
                        dataRecord.scriptParams.popupResponse = null;
                        dataRecord.scriptParams.showOnhandChangeCompletePopup = null;
                        dataRecord.scriptParams.scannedBinId = null;
                        dataRecord.scriptParams.binScanned = null;
                        dataRecord.scriptParams.showPopup = null;
                        dataRecord.scriptParams.onhandChangePopupOpened = null;
                        dataRecord.scriptParams.rescanPopupOpened = null;
                        dataRecord.scriptParams.scannedCountConfigId = null;
                        dataRecord.auxParams.itemsTbl = null;
                        dataRecord.auxParams.ItemListTbl = null;
                        dataRecord.scriptParams.itemCountCreateResponse = null;
                        dataRecord.scriptParams.previousScannedUpcValue = null;
                        dataRecord.scriptParams.itemCountEditRequest = {};
                        if (!itemCountCreateResponse_1) return [3 /*break*/, 4];
                        dataRecord.scriptParams.itemCountEditRequest.itemCountIdParam =
                            itemCountCreateResponse_1.itemCountId;
                        dataRecord.scriptParams.itemCountEditRequest.statusIdParam = 2;
                        dataRecord.scriptParams.itemCountEditRequest.onhandChangeAction = 'continueCount';
                        if (dataRecord.auxParams.itemCountRemarks ||
                            dataRecord.auxParams.itemCountRemarks == '') {
                            dataRecord.scriptParams.itemCountEditRequest.remarksParam =
                                dataRecord.auxParams.itemCountRemarks;
                        }
                        itemCountDetails = itemCountCreateResponse_1.itemCountDetails;
                        itemCountDetails = itemCountDetails.map(function (_a) {
                            var index = _a.index, rest = __rest(_a, ["index"]);
                            return rest;
                        });
                        dataRecord.scriptParams.itemCountEditRequest.itemCountDetails = itemCountDetails;
                        if (itemCountCreateResponse_1.isSerialItem) {
                            dataRecord.scriptParams.itemCountEditRequest.serialsQuantity =
                                itemCountCreateResponse_1.serialsQuantity;
                            dataRecord.scriptParams.itemCountEditRequest.statusQuantityDetails =
                                itemCountCreateResponse_1.statusQuantityDetails;
                        }
                        if (itemCountCreateResponse_1.isLotItem) {
                            dataRecord.scriptParams.itemCountEditRequest.itemCountDetailsUntilVariance =
                                itemCountCreateResponse_1.itemCountDetailsUntilVariance;
                            dataRecord.scriptParams.itemCountEditRequest.whenIgnoreLotNumberUntilVariance =
                                dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                                    itemCountCreateResponse_1.selectedPopupAction != 'fromVariancePopup';
                        }
                        dataRecord.scriptParams.nextItemExists = false;
                        if (dataRecord.scriptParams.completeAndNextEnabled &&
                            itemCountCreateResponse_1.countConfigReferenceId) {
                            itemsList = dataRecord.scriptParams.itemsList;
                            itemsListLength = itemsList.length;
                            currentItemIndex = itemsList.findIndex(function (ile) {
                                return ile.id == itemCountCreateResponse_1.itemId &&
                                    ile.binId == itemCountCreateResponse_1.binId;
                            });
                            if (currentItemIndex != -1) {
                                itemsList[currentItemIndex].itemCountStatus = 2;
                                nextIndex = (currentItemIndex + 1) % itemsListLength, countStatusItem = null, recountStatusItem = null;
                                while (nextIndex != currentItemIndex) {
                                    nextIndexItem = itemsList[nextIndex];
                                    if (!nextIndexItem.itemCountStatus && !nextIndexItem.recountSuggested) {
                                        countStatusItem = nextIndexItem;
                                        break;
                                    }
                                    else if (nextIndexItem.recountSuggested && !recountStatusItem) {
                                        recountStatusItem = nextIndexItem;
                                    }
                                    nextIndex = (nextIndex + 1) % itemsListLength;
                                }
                                nextItem = countStatusItem || recountStatusItem;
                                dataRecord.scriptParams.itemCountEditRequest.nextItem = nextItem;
                                if (nextItem) {
                                    dataRecord.scriptParams.nextItemExists = true;
                                }
                            }
                        }
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
                                itemCountRecord: dataRecord.scriptParams.itemCountEditRequest,
                                isFromClient: true
                            }, 'post')];
                    case 3:
                        result = _a.sent();
                        dataRecord.scriptParams.nextItemsTbl = result.nextItem;
                        dataRecord.scriptParams.scannedSerials = null;
                        dataRecord.scriptParams.countedSerialNumbersList = null;
                        dataRecord.scriptParams.itemCountEditRequest = null;
                        dataRecord.scriptParams.validateVarianceClicked =
                            dataRecord.scriptParams.validateVarianceClicked && false;
                        dataRecord.scriptParams.cancelVarianceClicked = false;
                        _a.label = 4;
                    case 4:
                        dataRecord.scriptParams.serialVarianceExists =
                            dataRecord.scriptParams.serialVarianceExists && false;
                        dataRecord.scriptParams.lotVarianceExists =
                            dataRecord.scriptParams.lotVarianceExists && false;
                        _mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    };
    //@ts-ignore
    clientFunctions.setDuplicateUpcPopupMessage = function () {
        //@ts-ignore
        var _mobile = mobile;
        //@ts-ignore
        document.getElementsByClassName('svg-image close')[0].style.display = 'none';
        var text = "<div><p>Multiple items present with the <b>same UPC</b>. " +
            "Select an item to count.</p></div>";
        _mobile.setPopupElementSourceData('popupText', text);
        _mobile.disableField('item');
    };
    //@ts-ignore
    clientFunctions.enableItemField = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var upc = _mobile.getValueFromPage('hiddenDuplicateUpc');
        dataRecord.scriptParams.duplicateUpcItem = true;
        _mobile.enableField('item');
        _mobile.setFocusOnElement('item');
        _mobile.setValueInPage('item', '');
        dataRecord.scriptParams.isFromEnableItemField = true;
        _mobile.setRecordInState(dataRecord);
        setTimeout(function () {
            _mobile.setValueInPage('item', htmlEscape(upc));
        }, 0);
    };
    //@ts-ignore
    clientFunctions.enableItemFieldWithGS1 = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        _mobile.enableField('item');
        _mobile.setValueInPage('item', '');
        dataRecord.scriptParams.isFromEnableItemFieldWithGS1 = true;
        _mobile.setRecordInState(dataRecord);
        setTimeout(function () {
            _mobile.setValueInPage('item', htmlEscape(dataRecord.scriptParams.previousGS1));
        }, 0);
    };
    //@ts-ignore
    clientFunctions.setDuplicateAliasPopupMessage = function () {
        var _a;
        //@ts-ignore
        var _mobile = mobile;
        //@ts-ignore
        document.getElementsByClassName('svg-image close')[0].style.display = 'none';
        var duplicateAliasMsg = (_a = document.evaluate("//span[@id='duplicateItemAliasesMsg']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) === null || _a === void 0 ? void 0 : _a.textContent;
        var text = "<div><p>" + duplicateAliasMsg + "</p></div>";
        _mobile.setPopupElementSourceData('aliasPopupText', text);
        _mobile.disableField('item');
    };
    //@ts-ignore
    clientFunctions.onSerialOrLotPopupAfterLoad = function () {
        document
            .getElementsByClassName('svg-image close')[0]
            .addEventListener('click', function (event) {
            var btns = document.getElementsByTagName('button');
            for (var i = btns.length - 1; i >= 0; i--) {
                var btn = btns[i];
                if (btn && btn.textContent.trim() == 'HiddenPopupButtonLabel') {
                    // @ts-ignore
                    btn.click();
                    break;
                }
            }
            event.stopPropagation();
        });
    };
    //@ts-ignore
    clientFunctions.onSerialOrLotPopupLoad = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        if (dataRecord.auxParams.inventoryNumbersDeleteSuccess) {
            var isSerialItem = dataRecord.scriptParams.itemCountCreateResponse.isSerialItem;
            var bannerMessageKey = isSerialItem ? 'serialsDeleteMessage' : 'lotsDeleteMessage';
            _mobile.setPopupElementSourceData('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('popupBannerStart'), ['#d7fccf']) +
                _mobile.getValueFromPage(bannerMessageKey) +
                _mobile.getValueFromPage('popupBannerEnd')));
        }
        dataRecord.auxParams.inventoryNumbersDeleteSuccess = null;
        _mobile.setRecordInState(dataRecord);
    };
    //@ts-ignore
    clientFunctions.setInitialFieldValues = function () {
        //@ts-ignore
        var _mobile = mobile;
        _mobile.setPopupElementSourceData('hiddenField1', 'test');
        _mobile.setPopupElementSourceData('hiddenField2', '');
    };
    //@ts-ignore
    clientFunctions.filterItemCountDetails = function () {
        //@ts-ignore
        var dataRecord = mobile.getRecordFromState();
        var selectedInventoryNumbers = dataRecord.auxParams.InventoryNumbersData;
        if (selectedInventoryNumbers && selectedInventoryNumbers.length > 0) {
            var itemCountDetails_1 = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
            if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem) {
                itemCountDetails_1 = itemCountDetails_1.map(function (icd) {
                    var isLotSelected = selectedInventoryNumbers.some(function (inv) {
                        return inv.inventoryNumber == icd.inventoryNumberNameParam &&
                            inv.inventoryStatus == icd.inventoryStatusNameParam;
                    });
                    if (isLotSelected) {
                        icd.countQuantityParam = 0;
                    }
                    return icd;
                });
            }
            else {
                itemCountDetails_1 = itemCountDetails_1.filter(function (icd) {
                    return !selectedInventoryNumbers.some(function (inv) {
                        return inv.inventoryNumber == icd.inventoryNumberNameParam &&
                            inv.inventoryStatus == icd.inventoryStatusNameParam;
                    });
                });
                var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
                var statusQuantityDetails = dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
                if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
                    if (defaultInventoryStatusId && statusQuantityDetails.length) {
                        statusQuantityDetails.forEach(function (quantityDetail) {
                            quantityDetail.quantity = itemCountDetails_1.reduce(function (accumulator, currentValue) {
                                if (currentValue.inventoryStatusIdParam == quantityDetail.status) {
                                    ++accumulator;
                                }
                                return accumulator;
                            }, 0);
                        });
                        dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails = statusQuantityDetails;
                    }
                    else {
                        dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity = itemCountDetails_1.reduce(function (accumulator, currentValue) {
                            return accumulator + currentValue.countQuantityParam;
                        }, 0);
                    }
                }
            }
            dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails = itemCountDetails_1;
            localStorage.setItem('ItemCountRecord', JSON.stringify(dataRecord.scriptParams.itemCountCreateResponse));
            dataRecord.auxParams.inventoryNumbersDeleteSuccess = true;
        }
        dataRecord.auxParams.InventoryNumbersData = null;
        //@ts-ignore
        mobile.setRecordInState(dataRecord);
    };
    //@ts-ignore
    clientFunctions.getOnhandChangeCompleteMessage = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var completePopupMessage;
        var onhandChangePreference = dataRecord.scriptParams.popupResponse.onhandChangePreference;
        var itemName = dataRecord.scriptParams.itemCountCreateResponse.itemName;
        if (onhandChangePreference == 1) {
            completePopupMessage = replacePlaceholders(_mobile.getValueFromPage('ohc_PopUpText_1'), [htmlEscape(itemName)]);
        }
        else if (onhandChangePreference == 2) {
            completePopupMessage = replacePlaceholders(_mobile.getValueFromPage('ohc_PopUpText_2'), [htmlEscape(itemName)]);
        }
        dataRecord.scriptParams.completePopupMessage = completePopupMessage;
        _mobile.setRecordInState(dataRecord);
    };
    // @ts-ignore
    clientFunctions.processLotItemValidation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, childElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.validateVarianceClicked = true;
                        return [4 /*yield*/, onHandChangeOrVarianceRecountAction(dataRecord)];
                    case 1:
                        _a.sent();
                        _mobile.setValueInPage('item', '');
                        _mobile.setValueInPage('quantity', '');
                        _mobile.setValueInPage('totalQuantityCounted', '');
                        _mobile.showField('lotnumber');
                        _mobile.showField('lotselect');
                        _mobile.showField('viewlotnumbers');
                        childElement = document.getElementById('viewlotnumbers');
                        childElement.parentElement.classList.add('newLine');
                        childElement.parentElement.style.paddingBottom = '5px';
                        setTimeout(function () {
                            _mobile.setFocusOnElement('lotnumber');
                        }, 0);
                        if (dataRecord.scriptParams.serialOrLotVarainceSubmit) {
                            dataRecord.scriptParams.serialOrLotVarainceSubmit = false;
                        }
                        _mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    };
    // @ts-ignore
    clientFunctions.cancelLotItemValidation = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        _mobile.setValueInPage('hiddenItem_ValidateLotItem_Popup', '');
        if (dataRecord.scriptParams.serialOrLotVarainceSubmit) {
            dataRecord.scriptParams.serialOrLotVarainceSubmit = false;
            _mobile.hideField('lotnumber');
            _mobile.hideField('lotselect');
            _mobile.hideField('viewlotnumbers');
        }
        _mobile.setFocusOnElement('item');
        dataRecord.scriptParams.cancelVarianceClicked = true;
        _mobile.setRecordInState(dataRecord);
    };
    //@ts-ignore
    clientFunctions.updateQtyField = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
            var statusQuantityDetails = dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails, quantity = void 0;
            var serialEntered_1 = _mobile.getValueFromPage('serials').trim();
            if (defaultInventoryStatusId) {
                statusQuantityDetails = statusQuantityDetails.find(function (currentValue) { return currentValue.status == defaultInventoryStatusId; });
                if (statusQuantityDetails) {
                    quantity = statusQuantityDetails.quantity;
                }
            }
            else {
                quantity = dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity;
            }
            if (serialEntered_1) {
                var serialFound = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails.findIndex(function (currentValue) { return currentValue.inventoryNumberNameParam == serialEntered_1; });
                if (serialFound == -1) {
                    _mobile.setValueInPage('serials', '');
                }
            }
            _mobile.setValueInPage('totalQuantityCounted', quantity);
            _mobile.setValueInPage('quantity', '');
            _mobile.setFocusOnElement('serials');
        }
        else {
            var lotScanned_1 = dataRecord.scriptParams.lotScanned;
            var defaultUomId = dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
            var currentUOM = _mobile.getValueFromPage('unitOfMeasurement');
            var selectedUomId_1 = currentUOM ? currentUOM.value : defaultUomId;
            var lotFieldValue = _mobile.getValueFromPage('lotnumber');
            var totalQuantityFieldValue = _mobile.getValueFromPage('totalQuantityCounted');
            if (lotScanned_1) {
                var itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
                itemCountDetails = itemCountDetails.find(function (currentValue) {
                    return (currentValue.inventoryNumberNameParam == lotScanned_1 &&
                        currentValue.uomIdParam == selectedUomId_1 &&
                        currentValue.inventoryStatusIdParam == defaultInventoryStatusId);
                });
                if (itemCountDetails && (lotFieldValue || totalQuantityFieldValue)) {
                    _mobile.setValueInPage('totalQuantityCounted', itemCountDetails.countQuantityParam);
                }
                if (!itemCountDetails || itemCountDetails.countQuantityParam == 0) {
                    _mobile.setValueInPage('lotnumber', '');
                    dataRecord.scriptParams.promptOpened && _mobile.hideField('prompt');
                }
            }
            _mobile.setFocusOnElement('lotnumber');
        }
    };
    //@ts-ignore
    clientFunctions.validateSerailsAction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, childElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.validateVarianceClicked = true;
                        _mobile.setRecordInState(dataRecord);
                        return [4 /*yield*/, onHandChangeOrVarianceRecountAction(dataRecord)];
                    case 1:
                        _a.sent();
                        _mobile.setValueInPage('item', '');
                        _mobile.setValueInPage('quantity', '');
                        _mobile.setValueInPage('totalQuantityCounted', '');
                        _mobile.showField('serials');
                        _mobile.showField('viewserialnumbers');
                        childElement = document.getElementById('viewserialnumbers');
                        childElement.parentElement.classList.add('newLine');
                        childElement.parentElement.style.paddingBottom = '5px';
                        setTimeout(function () {
                            _mobile.setFocusOnElement('serials');
                        }, 0);
                        if (dataRecord.scriptParams.serialOrLotVarainceSubmit) {
                            dataRecord.scriptParams.serialOrLotVarainceSubmit = false;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    //@ts-ignore
    clientFunctions.cancelSerailsAction = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        _mobile.setValueInPage('hiddenItem_ValidateVariance', '');
        if (dataRecord.scriptParams.serialOrLotVarainceSubmit) {
            dataRecord.scriptParams.serialOrLotVarainceSubmit = false;
            _mobile.hideField('serials');
            _mobile.hideField('viewserialnumbers');
        }
        _mobile.setFocusOnElement('item');
        dataRecord.scriptParams.cancelVarianceClicked = true;
        _mobile.setRecordInState(dataRecord);
    };
    //@ts-ignore
    clientFunctions.hidePopupCloseIcon = function () {
        //@ts-ignore
        document.getElementsByClassName('svg-image close')[0].style.display = 'none';
    };
    //@ts-ignore
    clientFunctions.setBinPopupMessage = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var binNumber = dataRecord.scriptParams.itemCountCreateResponse
            ? dataRecord.scriptParams.itemCountCreateResponse.binNumber
            : dataRecord.auxParams.itemsTbl.binNumber;
        _mobile.setPopupElementSourceData('Bin', htmlEscape(binNumber));
    };
    function onHandChangeOrVarianceRecountAction(dataRecord) {
        return __awaiter(this, void 0, void 0, function () {
            var itemCountCreateResponse, onhandChangeAction, itemCountRecordEditParams, itemCountRecordCreateWithRefParams, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
                        onhandChangeAction = 'recount';
                        itemCountRecordEditParams = {
                            itemCountIdParam: itemCountCreateResponse.itemCountId,
                            statusIdParam: 7,
                            itemCountDetails: itemCountCreateResponse.itemCountDetails,
                            onhandChangeAction: onhandChangeAction,
                            statusQuantityDetails: itemCountCreateResponse.isSerialItem
                                ? itemCountCreateResponse.statusQuantityDetails
                                : '',
                            nextItem: itemCountCreateResponse.nextItem ? itemCountCreateResponse.nextItem : null
                        };
                        //@ts-ignore
                        return [4 /*yield*/, mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
                                itemCountRecord: itemCountRecordEditParams,
                                isFromClient: true
                            }, 'post')];
                    case 1:
                        //@ts-ignore
                        _a.sent();
                        itemCountRecordCreateWithRefParams = {
                            itemCountIdParam: itemCountCreateResponse.itemCountId,
                            onhandChangeAction: dataRecord.scriptParams.validateVarianceClicked ||
                                dataRecord.scriptParams.isFromValidateLotItemPopup
                                ? 'fromVariancePopup'
                                : 'recount'
                        };
                        return [4 /*yield*/, mobile.callRestlet('customscript_sc_rl_item_count_from_ref', 'customdeploy_sc_rl_item_count_from_ref', {
                                itemCountRecord: itemCountRecordCreateWithRefParams
                            }, 'post')];
                    case 2:
                        result = _a.sent();
                        result.nextItem = itemCountCreateResponse.nextItem;
                        if (dataRecord.scriptParams.validateVarianceClicked ||
                            dataRecord.scriptParams.isFromValidateLotItemPopup) {
                            dataRecord.scriptParams.itemCountCreateResponse = result;
                            localStorage.setItem('ItemCountRecord', JSON.stringify(result));
                        }
                        //@ts-ignore
                        mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    }
    function replacePlaceholders(translatedString, params) {
        var replacedString = translatedString;
        for (var i = 0; i < params.length; i++) {
            replacedString = replacedString.replace('${' + (i + 1) + '}', params[i]);
        }
        return replacedString;
    }
    function htmlEscape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function resetFooter() {
        setTimeout(function () {
            var _a;
            var footerButtonsMissing = !getSingleNodeValue("//div[@class='app-footer']/div");
            var overFlowButton = getSingleNodeValue("//button[@id='OverFlowButton']");
            if (overFlowButton || footerButtonsMissing) {
                // @ts-ignore
                (_a = getSingleNodeValue("//div[@class='app-footer']/div")) === null || _a === void 0 ? void 0 : _a.remove();
                // @ts-ignore
                var buttonElements = getSingleNodeValue("//div[@class='overflow-buttons']").children;
                var footer = getSingleNodeValue("//div[@class='app-footer']");
                for (var i = 0; i < 4; i++) {
                    buttonElements[0].children[0].style.padding = 0;
                    footer.appendChild(buttonElements[0]);
                }
            }
            else {
                var buttonsNodeList = getOrderedNodeList("//div[@class='app-footer']/div/button");
                var buttons = [];
                // @ts-ignore
                var buttonNode = buttonsNodeList.iterateNext();
                while (buttonNode) {
                    buttonNode && buttons.push(buttonNode);
                    // @ts-ignore
                    buttonNode = buttonsNodeList.iterateNext();
                }
                buttons.forEach(function (button) { return (button.style.padding = 0); });
            }
        }, 100);
    }
    function getSingleNodeValue(expression) {
        return document.evaluate(expression, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    function getOrderedNodeList(expression) {
        return document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    }
    //@ts-ignore
    clientFunctions.setMixedCountPopupMessage = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var bin = dataRecord.scriptParams.itemCountCreateResponse.binNumber;
        var popupText = replacePlaceholders(_mobile.getValueFromPage('mixed_count_popupText'), [
            htmlEscape(bin)
        ]);
        _mobile.setPopupElementSourceData('popupText', popupText);
    };
    return clientFunctions;
})();
