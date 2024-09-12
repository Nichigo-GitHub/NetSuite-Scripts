/* enable-cache:true */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function (resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = {
            label: 0,
            sent: function () {
                if (t[0] & 1) throw t[1];
                return t[1];
            },
            trys: [],
            ops: []
        },
        f, y, t, g;
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
        return this;
    }), g;

    function verb(n) {
        return function (v) {
            return step([n, v]);
        };
    }

    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1], done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [0];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [6, e];
            y = 0;
        } finally {
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
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
    var pushItemCountEditRequest = function (statusId, itemCountCreateResponse, mixedCountOkButtonSelected) {
        if (mixedCountOkButtonSelected === void 0) {
            mixedCountOkButtonSelected = false;
        }
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        dataRecord.scriptParams.itemCountEditRequest = {};
        if (itemCountCreateResponse) {
            dataRecord.scriptParams.itemCountEditRequest.itemCountIdParam = itemCountCreateResponse.itemCountId;
            dataRecord.scriptParams.itemCountEditRequest.statusIdParam = statusId;
            if (dataRecord.scriptParams.mixedCount && mixedCountOkButtonSelected) {
                dataRecord.scriptParams.itemCountEditRequest.isMixedCount = true;
            }
            if (itemCountCreateResponse.isLotItem) {
                dataRecord.scriptParams.itemCountEditRequest.whenIgnoreLotNumberUntilVariance =
                    dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                    itemCountCreateResponse.selectedPopupAction != 'fromVariancePopup';
                if (dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                    itemCountCreateResponse.selectedPopupAction != 'fromVariancePopup') {
                    dataRecord.scriptParams.itemCountEditRequest.itemCountDetailsUntilVariance = itemCountCreateResponse.itemCountDetailsUntilVariance;
                }
            }
            if (dataRecord.auxParams.itemCountRemarks || dataRecord.auxParams.itemCountRemarks == '') {
                dataRecord.scriptParams.itemCountEditRequest.remarksParam = dataRecord.auxParams.itemCountRemarks;
            }
            if (dataRecord.scriptParams.zeroQuantityOfLotUntilVariance) {
                dataRecord.scriptParams.itemCountEditRequest.zeroQuantityOfLotUntilVariance = dataRecord.scriptParams.zeroQuantityOfLotUntilVariance;
            }
            var itemCountDetails = itemCountCreateResponse.itemCountDetails;
            itemCountDetails = itemCountDetails.map(function (_a) {
                var index = _a.index,
                    rest = __rest(_a, ["index"]);
                return rest;
            });
            dataRecord.scriptParams.itemCountEditRequest.itemCountDetails = itemCountDetails;
            if (itemCountCreateResponse.defaultInventoryStatusId) {
                dataRecord.scriptParams.itemCountEditRequest.currentInvtStatus = itemCountCreateResponse.defaultInventoryStatusId;
            }
            if (itemCountCreateResponse.defaultUomId) {
                dataRecord.scriptParams.itemCountEditRequest.currentUom = itemCountCreateResponse.defaultUomId;
            }
            if (itemCountCreateResponse.isSerialItem) {
                // @ts-ignore
                dataRecord.scriptParams.itemCountEditRequest.serialsQuantity = itemCountCreateResponse.serialsQuantity;
                dataRecord.scriptParams.itemCountEditRequest.statusQuantityDetails = itemCountCreateResponse.statusQuantityDetails;
                if (dataRecord.scriptParams.validateVarianceClicked) {
                    dataRecord.scriptParams.itemCountEditRequest.validateVarianceClicked = true;
                }
            }
            if (statusId == 2 &&
                dataRecord.scriptParams.completeAndNextEnabled && itemCountCreateResponse.countConfigReferenceId) {
                var itemsList = dataRecord.scriptParams.itemsList;
                var itemsListLength = itemsList.length;
                var currentItemIndex = itemsList.findIndex(function (ile) {
                    return ile.id == itemCountCreateResponse.itemId &&
                        ile.binId == itemCountCreateResponse.binId;
                });
                if (currentItemIndex != -1) {
                    itemsList[currentItemIndex].itemCountStatus = statusId;
                    var nextIndex = (currentItemIndex + 1) % itemsListLength,
                        countStatusItem = null,
                        recountStatusItem = null;
                    while (nextIndex != currentItemIndex) {
                        var nextIndexItem = itemsList[nextIndex];
                        if (!nextIndexItem.itemCountStatus && !nextIndexItem.recountSuggested) {
                            countStatusItem = nextIndexItem;
                            break;
                        } else if (nextIndexItem.recountSuggested && !recountStatusItem) {
                            recountStatusItem = nextIndexItem;
                        }
                        nextIndex = (nextIndex + 1) % itemsListLength;
                    }
                    dataRecord.scriptParams.itemCountEditRequest.nextItem = countStatusItem || recountStatusItem;
                }
            }
        }
        // @ts-ignore
        mobile.setRecordInState(dataRecord);
    };
    var processCompleteRequest = function (mixedCountOkButtonSelected) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, selectedZoneName, selectedAisleName, locationId, binId, result, itemCountRecord, defaultInventoryStatusId_1, statusQuantityDetails, totalQuantity_1, currentStatus_1, itemCountDetailsUntilVariance, lotCountDetailsUntilVariance, itemCountEditResponse, errorBannerStart, btns, i, btn;
            return __generator(this, function (_c) {
                
                switch (_c.label) {
                    case 0:
                        //@ts-ignore
                        document.getElementsByClassName('page-loader')[0].style.display = 'block';
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        selectedZoneName = (_a = dataRecord.auxParams.zoneList) === null || _a === void 0 ? void 0 : _a.name;
                        selectedAisleName = dataRecord.auxParams.aisleList && !dataRecord.auxParams.aisleList.isNoAisleOption ? (_b = dataRecord.auxParams.aisleList) === null || _b === void 0 ? void 0 : _b.name : '';
                        if (!!dataRecord.scriptParams.itemCountCreateResponse) return [3 /*break*/ , 2];

                        locationId = dataRecord.auxParams.userLocationsTbl ? dataRecord.auxParams.userLocationsTbl.id : dataRecord.scriptParams.selectedLocation.id;
                        binId = dataRecord.scriptParams.recountedItemDetails ? dataRecord.scriptParams.recountedItemDetails.bindId : dataRecord.auxParams.itemsTbl.binId;
                        return [4 /*yield*/ , _mobile.callRestlet('customscript_sc_rl_validate_item', 'customdeploy_sc_rl_validate_item', {
                            upcCodeParam: dataRecord.scriptParams.recountedItemDetails ? dataRecord.scriptParams.recountedItemDetails.itemName : dataRecord.auxParams.itemsTbl.name,
                            locationIdParam: locationId,
                            binIdParam: binId,
                            selectedItemId: null,
                            isCompleteCountWithoutScan: true,
                            selectedItemInfo: dataRecord.scriptParams.selectedItemInfo,
                            zoneName: dataRecord.scriptParams.isBinNotOfSelectedZone ? dataRecord.scriptParams.zoneNameOfbinScanned : selectedZoneName,
                            aisleName: dataRecord.scriptParams.isBinNotOfSelectedAisle ? dataRecord.scriptParams.aisleOfbinScanned : selectedAisleName
                        }, 'post')];

                    case 1:
                        result = _c.sent();
                        if (result.creationResult) {
                            pushItemCountEditRequest(2, result.creationResult, mixedCountOkButtonSelected);
                        }
                        return [3 /*break*/ , 3];

                    case 2:
                        itemCountRecord = dataRecord.scriptParams.itemCountCreateResponse;
                        defaultInventoryStatusId_1 = itemCountRecord.defaultInventoryStatusId;
                        statusQuantityDetails = itemCountRecord.statusQuantityDetails;
                        totalQuantity_1 = _mobile.getValueFromPage('totalQuantityCounted');
                        currentStatus_1 = _mobile.getValueFromPage('inventoryStatus');
                        itemCountDetailsUntilVariance = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
                        lotCountDetailsUntilVariance = itemCountRecord.isLotItem &&
                            dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                            dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                            'fromVariancePopup' &&
                            itemCountDetailsUntilVariance;
                        if (lotCountDetailsUntilVariance) {
                            dataRecord.scriptParams.zeroQuantityOfLotUntilVariance = !itemCountDetailsUntilVariance.find(function (itemCountDetail) {
                                return itemCountDetail.currentQuantity > 0;
                            });
                        }
                        if (itemCountRecord.isSerialItem) {
                            dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity = totalQuantity_1;
                            if (defaultInventoryStatusId_1 && statusQuantityDetails.length) {
                                statusQuantityDetails.forEach(function (quantityDetail) {
                                    if (quantityDetail.status ==
                                        (currentStatus_1 ? currentStatus_1.value : defaultInventoryStatusId_1)) {
                                        quantityDetail.quantity = totalQuantity_1 ? Number(totalQuantity_1) : 0;
                                    }
                                });
                                dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails = statusQuantityDetails;
                                _mobile.setRecordInState(dataRecord);
                            }
                        }
                        pushItemCountEditRequest(2, dataRecord.scriptParams.itemCountCreateResponse, mixedCountOkButtonSelected);
                        _c.label = 3;

                    case 3:
                        dataRecord.scriptParams.recountedItemDetails = null;
                        return [4 /*yield*/ , _mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
                            itemCountRecord: dataRecord.scriptParams.itemCountEditRequest,
                            isFromClient: true
                        }, 'post')];

                    case 4:
                        itemCountEditResponse = _c.sent();
                        if (dataRecord.scriptParams.isFromValidateLotItemPopup) {
                            dataRecord.scriptParams.isFromValidateLotItemPopup = false;
                        }
                        dataRecord.scriptParams.validateVarianceClicked =
                            dataRecord.scriptParams.validateVarianceClicked && false;
                        dataRecord.scriptParams.cancelVarianceClicked = false;
                        if (itemCountEditResponse.errorMessage) {
                            errorBannerStart = _mobile
                                .getValueFromPage('errorBannerStart')
                                .replace('${1}', headerHeight);
                            _mobile.setValueInPage('banner', "" + (errorBannerStart +
                                itemCountEditResponse.errorMessage +
                                _mobile.getValueFromPage('errorBannerEnd')));
                            _mobile.setValueInPage('hiddenitem_popup', 'retry');
                            _mobile.setRecordInState(dataRecord);
                            document.getElementById('countInterfaceIconText').style.color = '#fff';
                            document.getElementById('sclisticon').style.stroke = '#fff';
                            //@ts-ignore
                            document.getElementsByClassName('page-loader')[0].style.display = 'none';
                        } else {
                            _mobile.setValueInPage('hiddenItemCountField', 'true');
                            _mobile.setValueInPage('hiddenItemCountField', '');
                            btns = document.getElementsByTagName('button');
                            for (i = btns.length - 1; i >= 0; i--) {
                                btn = btns[i];
                                if (itemCountEditResponse.nextItem) {
                                    if (btn && btn.textContent.trim() == 'hiddenItemCountField') {
                                        dataRecord.scriptParams.nextItemsTbl = itemCountEditResponse.nextItem;
                                        dataRecord.scriptParams.itemCountCreateResponse = null;
                                        dataRecord.auxParams.ItemListTbl = null;
                                        dataRecord.scriptParams.selectedItemInfo = null;
                                        _mobile.setRecordInState(dataRecord);
                                        // @ts-ignore
                                        btn.click();
                                        return [2 /*return*/ ];
                                    }
                                } else if (btn && btn.textContent.trim() == 'HiddenCCButtonLabel') {
                                    dataRecord.scriptParams.nextItemsTbl = null;
                                    _mobile.setRecordInState(dataRecord);
                                    // @ts-ignore
                                    btn.click();
                                    return [2 /*return*/ ];
                                }
                            }
                        }
                        return [2 /*return*/ ];
                }
            });
        });
    };
    var closePopup = function () {
        //@ts-ignore
        var popupClose = document.getElementsByClassName('svg-image close')[0];
        if (popupClose) {
            //@ts-ignore
            popupClose.click();
        }
    };
    //@ts-ignore
    var validateCountQuantity = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var itemCountRecord = dataRecord.scriptParams.itemCountCreateResponse;
        if (!itemCountRecord) {
            return;
        }
        var totalQuantity = _mobile.getValueFromPage('totalQuantityCounted');
        if (Number(totalQuantity) < 0 || Number(totalQuantity) >= 1.0e10) {
            throw new Error(_mobile.getValueFromPage('invalidQuantityMsg'));
        }
        totalQuantity = Number(totalQuantity);
        var itemCountDetails = itemCountRecord.itemCountDetails;
        var defaultUomId = itemCountRecord.defaultUomId;
        var defaultInventoryStatusId = itemCountRecord.defaultInventoryStatusId;
        var currentUOM = _mobile.getValueFromPage('unitOfMeasurement');
        var currentStatus = _mobile.getValueFromPage('inventoryStatus');
        var currentLotNumber = _mobile.getValueFromPage('lotnumber').toString().trim();
        var statusQuantityDetails = itemCountRecord.statusQuantityDetails;
        var uomIdFromGs1 = itemCountRecord.uomIdFromGs1;
        itemCountDetails.forEach(function (itemCount, index) {
            itemCount.index = index;
        });
        if (itemCountRecord.isSerialItem) {
            dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity = totalQuantity;
            if (defaultInventoryStatusId && statusQuantityDetails.length) {
                statusQuantityDetails.forEach(function (quantityDetail) {
                    if (quantityDetail.status ==
                        (currentStatus ? currentStatus.value : defaultInventoryStatusId)) {
                        quantityDetail.quantity = totalQuantity ? Number(totalQuantity) : 0;
                    }
                });
                dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails = statusQuantityDetails;
                _mobile.setRecordInState(dataRecord);
            }
        } else if (currentLotNumber !== '' || !itemCountRecord.isLotItem) {
            if (defaultInventoryStatusId) {
                var inventoryStatusId_1 = currentStatus ?
                    currentStatus.value :
                    defaultInventoryStatusId;
                itemCountDetails = itemCountDetails.filter(function (itemCount) {
                    return itemCount.inventoryStatusIdParam == inventoryStatusId_1;
                });
            }
            if (currentLotNumber) {
                itemCountDetails = itemCountDetails.filter(function (itemCount) {
                    return itemCount.inventoryNumberNameParam == currentLotNumber;
                });
            }
            if (defaultUomId) {
                var uomId_1 = currentUOM ? currentUOM.value : uomIdFromGs1 || defaultUomId;
                itemCountDetails = itemCountDetails.filter(function (itemCount) {
                    return itemCount.uomIdParam == uomId_1;
                });
            }
            if (itemCountDetails.length) {
                dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails[itemCountDetails[0].index].countQuantityParam = totalQuantity ? Number(totalQuantity) : 0;
            }
        } else if (itemCountRecord.isLotItem &&
            dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
            dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
            'fromVariancePopup') {
            if (!defaultInventoryStatusId && !defaultUomId) {
                var itemCountDetailsUntilVariance = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
                if (itemCountDetailsUntilVariance.length) {
                    itemCountDetailsUntilVariance[0].currentQuantity = totalQuantity;
                } else {
                    itemCountDetailsUntilVariance[0] = {
                        currentQuantity: totalQuantity
                    };
                }
            } else if (defaultInventoryStatusId && !defaultUomId) {
                var inventoryStatusId = currentStatus ?
                    currentStatus.value :
                    defaultInventoryStatusId;
                var selectedValues = {
                    currentQuantity: totalQuantity,
                    inventoryStatusId: inventoryStatusId
                };
                setItemCountDetailsUntilVariance(selectedValues);
            } else if (!defaultInventoryStatusId && defaultUomId) {
                var uomId = currentUOM ? currentUOM.value : defaultUomId;
                var selectedValues = {
                    currentQuantity: totalQuantity,
                    uomId: uomId
                };
                setItemCountDetailsUntilVariance(selectedValues);
            } else if (defaultInventoryStatusId && defaultUomId) {
                var inventoryStatusId = currentStatus ?
                    currentStatus.value :
                    defaultInventoryStatusId;
                var uomId = currentUOM ? currentUOM.value : defaultUomId;
                var selectedValues = {
                    currentQuantity: totalQuantity,
                    inventoryStatusId: inventoryStatusId,
                    uomId: uomId
                };
                setItemCountDetailsUntilVariance(selectedValues);
            }
        }
        dataRecord.scriptParams.isFromLotScan = false;
        _mobile.setRecordInState(dataRecord);
        localStorage.setItem('ItemCountRecord', JSON.stringify(dataRecord.scriptParams.itemCountCreateResponse));
        if (dataRecord.scriptParams.pausedItem == true) {
            dataRecord.scriptParams.pausedItem = false;
            if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem) {
                _mobile.setFocusOnElement('lotnumber');
            } else if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
                _mobile.setFocusOnElement('serials');
            } else {
                _mobile.setFocusOnElement('item');
            }
            _mobile.setRecordInState(dataRecord);
        }
    };
    //@ts-ignore
    var setItemCountDetailsUntilVariance = function (selectedValues) {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var itemCountDetailsUntilVariance = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
        if (itemCountDetailsUntilVariance.length > 0) {
            var existingObj = void 0;
            if (selectedValues.uomId && selectedValues.inventoryStatusId) {
                existingObj = itemCountDetailsUntilVariance.find(function (obj) {
                    return obj.uomId == selectedValues.uomId &&
                        obj.inventoryStatusId == selectedValues.inventoryStatusId;
                });
            } else if (selectedValues.inventoryStatusId && !selectedValues.uomId) {
                existingObj = itemCountDetailsUntilVariance.find(function (obj) {
                    return obj.inventoryStatusId == selectedValues.inventoryStatusId;
                });
            } else if (!selectedValues.inventoryStatusId && selectedValues.uomId) {
                existingObj = itemCountDetailsUntilVariance.find(function (obj) {
                    return obj.uomId == selectedValues.uomId;
                });
            }
            if (!existingObj) {
                itemCountDetailsUntilVariance.push(selectedValues);
            } else {
                existingObj.currentQuantity = selectedValues.currentQuantity;
            }
        } else {
            itemCountDetailsUntilVariance.push(selectedValues);
        }
    };
    // @ts-ignore
    clientFunctions.pushItemCountPauseRequest = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        dataRecord.scriptParams.cancelVarianceClicked = false;
        _mobile.setRecordInState(dataRecord);
        pushItemCountEditRequest(8, dataRecord.scriptParams.itemCountCreateResponse);
    };
    // @ts-ignore
    clientFunctions.pushItemCountCompleteRequest = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        closePopup();
                        return [4 /*yield*/ , processCompleteRequest(false)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/ ];
                }
            });
        });
    };
    // @ts-ignore
    clientFunctions.pushItemCountCancelRequest = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        pushItemCountEditRequest(7, dataRecord.scriptParams.itemCountCreateResponse);
    };
    // @ts-ignore
    clientFunctions.setAvailableLotNumbers = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var availableLotNumbers = JSON.parse(JSON.stringify(dataRecord.scriptParams.itemCountCreateResponse.availableLotNumbers));
        if (availableLotNumbers.length == 0) {
            availableLotNumbers = [{}];
        }
        _mobile.setElementSourceData('lotselect', availableLotNumbers);
    };
    // @ts-ignore
    clientFunctions.onSelectLotNumber = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var selectedLot = _mobile.getValueFromPage('lotselect');
        var itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
        _mobile.setValueInPage('lotnumber', selectedLot.label);
        _mobile.setValueInPage('lotselect', {});
        if (itemCountCreateResponse === null || itemCountCreateResponse === void 0 ? void 0 : itemCountCreateResponse.allowManualCount) {
            _mobile.setFocusOnElement('quantity');
        } else {
            _mobile.setFocusOnElement('lotnumber');
        }
    };
    // @ts-ignore
    clientFunctions.submitItemCountPauseAction = function () {
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
        if (itemCountCreateResponse) {
            var itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
            itemCountDetails = itemCountDetails.map(function (_a) {
                var index = _a.index,
                    rest = __rest(_a, ["index"]);
                return rest;
            });
            var itemCountRecordEditParams = {
                itemCountIdParam: itemCountCreateResponse.itemCountId,
                statusIdParam: 8,
                itemCountDetails: itemCountDetails
            };
            if (dataRecord.auxParams.itemCountRemarks ||
                dataRecord.auxParams.itemCountRemarks == '') {
                itemCountRecordEditParams['remarksParam'] = dataRecord.auxParams.itemCountRemarks;
            }
            if (itemCountCreateResponse.defaultInventoryStatusId) {
                itemCountRecordEditParams['currentInvtStatus'] =
                    itemCountCreateResponse.defaultInventoryStatusId;
            }
            if (dataRecord.scriptParams.itemCountCreateResponse.defaultUomId) {
                itemCountRecordEditParams['currentUom'] =
                    dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
            }
            if (itemCountCreateResponse.isSerialItem) {
                itemCountRecordEditParams['serialsQuantity'] =
                    dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity;
                itemCountRecordEditParams['statusQuantityDetails'] =
                    dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
            }
            itemCountRecordEditParams['whenIgnoreLotNumberUntilVariance'] =
                dataRecord.scriptParams.itemCountCreateResponse.isLotItem &&
                dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                'fromVariancePopup';
            if (itemCountRecordEditParams['whenIgnoreLotNumberUntilVariance']) {
                itemCountRecordEditParams['itemCountDetailsUntilVariance'] =
                    dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
            }
            //@ts-ignore
            mobile.callRestlet('customscript_sc_rl_item_count_edit', 'customdeploy_sc_rl_item_count_edit', {
                itemCountRecord: itemCountRecordEditParams,
                isFromClient: true
            }, 'post');
        }
    };
    // @ts-ignore
    clientFunctions.beforeCountComplete = function () {
        var _a;
        //@ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        if (((_a = dataRecord.scriptParams.mixedItemCounts) === null || _a === void 0 ? void 0 : _a.length) == 1) {
            dataRecord.scriptParams.mixedCount = false;
            dataRecord.scriptParams.mixedItemCounts = [];
        }
        if (dataRecord.scriptParams.popupButtonSelected == 'Continue') {
            dataRecord.scriptParams.popupButtonSelected = null;
        }
        _mobile.setRecordInState(dataRecord);
        validateCountQuantity();
        _mobile.setValueInPage('hiddenItem_MixedCountPopup', '');
        _mobile.setValueInPage('hidden_triggerComplete', '');
        _mobile.setValueInPage('hidden_triggerComplete', 'true');
    };
    // @ts-ignore
    clientFunctions.mixedCountOkButtonClick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.mixedCountButtonSelected = 'Ok';
                        _mobile.setRecordInState(dataRecord);
                        closePopup();
                        return [4 /*yield*/ , processCompleteRequest(true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/ ];
                }
            });
        });
    };
    return clientFunctions;
})();