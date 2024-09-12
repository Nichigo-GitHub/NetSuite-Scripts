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
(function () {
    var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // @ts-ignore
    var headerHeight = headerElement.clientHeight;
    var clientFunctions = {
        onSubmit: function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function () {
                var _mobile, dataRecord, invetoryStatusEnabled, tableSelections, bannerMessage, onhandChangePreference, hidden_value, itemsWithOnHandChangeExists, hidden_value;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _mobile = mobile;
                            dataRecord = _mobile.getRecordFromState();
                            invetoryStatusEnabled = dataRecord.scriptParams.isInventoryStatusFeatureEnabled;
                            tableSelections = _mobile.getValueFromPage('pausedCountsTbl');
                            if (tableSelections.length == 0) {
                                bannerMessage = replacePlaceholders(_mobile.getValueFromPage('noitemcountselectedmsg'), []) + " ";
                                _mobile.setValueInPage('banner', "" + replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                                    '#fccfcf',
                                    headerHeight
                                ]) +
                                    bannerMessage +
                                    ("" + _mobile.getValueFromPage('bannerEnd')));
                                setMargin();
                                return [2 /*return*/];
                            }
                            dataRecord.scriptParams.selectedPausedCounts = tableSelections;
                            onhandChangePreference = dataRecord.scriptParams.onhandChangePreference;
                            if (tableSelections.length > 50) {
                                hidden_value = _mobile.getValueFromPage('hidden_thresholdError')
                                    ? _mobile.getValueFromPage('hidden_thresholdError') + 1
                                    : 1;
                                _mobile.setValueInPage('hidden_thresholdError', hidden_value);
                                return [2 /*return*/];
                            }
                            itemsWithOnHandChangeExists = tableSelections.some(function (itemCount) { return itemCount.isOnhandChange == true; });
                            if (!(itemsWithOnHandChangeExists && onhandChangePreference == 1)) return [3 /*break*/, 1];
                            hidden_value = _mobile.getValueFromPage('hidden_onhandChange')
                                ? _mobile.getValueFromPage('hidden_onhandChange') + 1
                                : 1;
                            _mobile.setValueInPage('hidden_onhandChange', hidden_value);
                            setTimeout(function () {
                                //@ts-ignore
                                document.getElementsByClassName('svg-image close')[0].style.display = 'none';
                                //@ts-ignore
                                document.getElementsByClassName('headerPopup')[0].style.display = 'none';
                            }, 0);
                            return [3 /*break*/, 3];
                        case 1:
                            //@ts-ignore
                            document.getElementsByClassName('page-loader')[0].style.display = 'block';
                            return [4 /*yield*/, this.callCompletePausedCountRestlet(tableSelections, onhandChangePreference, onhandChangePreference == 2 ? 'Recount' : 'Submit', invetoryStatusEnabled, (_a = dataRecord.auxParams.zoneList) === null || _a === void 0 ? void 0 : _a.name, dataRecord.auxParams.aisleList &&
                                    !dataRecord.auxParams.aisleList.isNoAisleOption
                                    ? (_b = dataRecord.auxParams.aisleList) === null || _b === void 0 ? void 0 : _b.name : '')];
                        case 2:
                            _c.sent();
                            _c.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        },
        forceRecountAction: function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function () {
                var _mobile, dataRecord, invetoryStatusEnabled;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _mobile = mobile;
                            dataRecord = _mobile.getRecordFromState();
                            invetoryStatusEnabled = dataRecord.scriptParams.isInventoryStatusFeatureEnabled;
                            dataRecord.scriptParams.completeAllCountsOHCPopupAction = 'Recount';
                            return [4 /*yield*/, this.callCompletePausedCountRestlet(dataRecord.scriptParams.selectedPausedCounts, dataRecord.scriptParams.onhandChangePreference, 'Recount', invetoryStatusEnabled, (_a = dataRecord.auxParams.zoneList) === null || _a === void 0 ? void 0 : _a.name, dataRecord.auxParams.aisleList && !dataRecord.auxParams.aisleList.isNoAisleOption
                                    ? (_b = dataRecord.auxParams.aisleList) === null || _b === void 0 ? void 0 : _b.name : '')];
                        case 1:
                            _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
        submitAction: function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function () {
                var _mobile, dataRecord, invetoryStatusEnabled;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _mobile = mobile;
                            dataRecord = _mobile.getRecordFromState();
                            invetoryStatusEnabled = dataRecord.scriptParams.isInventoryStatusFeatureEnabled;
                            dataRecord.scriptParams.completeAllCountsOHCPopupAction = 'Submit';
                            return [4 /*yield*/, this.callCompletePausedCountRestlet(dataRecord.scriptParams.selectedPausedCounts, dataRecord.scriptParams.onhandChangePreference, 'Submit', invetoryStatusEnabled, (_a = dataRecord.auxParams.zoneList) === null || _a === void 0 ? void 0 : _a.name, dataRecord.auxParams.aisleList && !dataRecord.auxParams.aisleList.isNoAisleOption
                                    ? (_b = dataRecord.auxParams.aisleList) === null || _b === void 0 ? void 0 : _b.name : '')];
                        case 1:
                            _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
        callCompletePausedCountRestlet: function (tableSelections, onhandChangePreference, action, invetoryStatusEnabled, zoneName, aisleName) {
            return __awaiter(this, void 0, void 0, function () {
                var _mobile, result, dataRecord;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _mobile = mobile;
                            _mobile.setValueInPage('banner', '');
                            return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_complete_paused_ic', 'customdeploy_sc_rl_complete_paused_ic', {
                                    tableSelections: tableSelections,
                                    actionType: action,
                                    onhandChangePreference: onhandChangePreference,
                                    invetoryStatusEnabled: invetoryStatusEnabled,
                                    zoneName: zoneName,
                                    aisleName: aisleName
                                }, 'post')];
                        case 1:
                            result = _a.sent();
                            dataRecord = _mobile.getRecordFromState();
                            dataRecord.scriptParams.countCompletedItems = result.data.countCompletedItems;
                            dataRecord.scriptParams.errorMessage = result.data.errorMessage;
                            _mobile.setRecordInState(dataRecord);
                            //@ts-ignore
                            document.getElementsByClassName('page-loader')[0].style.display = 'none';
                            _mobile.setValueInPage('hidden_refreshPausedCounts', 1);
                            return [2 /*return*/];
                    }
                });
            });
        },
        clearItemCountState: function () {
            //@ts-ignore
            var _mobile = mobile;
            var dataRecord = _mobile.getRecordFromState();
            showBannerMessages();
            dataRecord.scriptParams.itemCountCreateResponse = null;
            dataRecord.scriptParams.previousScannedUpcValue = null;
            dataRecord.scriptParams.itemCountEditRequest = null;
            dataRecord.scriptParams.onHandChangeItems = null;
            dataRecord.scriptParams.countCompletedItems = null;
            dataRecord.scriptParams.countCompletedOHCRecount = null;
            dataRecord.scriptParams.totalItems = null;
            dataRecord.scriptParams.varianceItems = null;
            dataRecord.scriptParams.completeAllCountsOHCPopupAction = null;
            dataRecord.scriptParams.ohcAndVarianceItemsCount = null;
            dataRecord.scriptParams.errorMessage = null;
            _mobile.setRecordInState(dataRecord);
        }
    };
    function showBannerMessages() {
        //@ts-ignore
        var _mobile = mobile;
        _mobile.setValueInPage('banner', '');
        var dataRecord = _mobile.getRecordFromState();
        var colorCodes = {
            Red: '#fccfcf',
            Green: '#d7fccf',
            Yellow: '#faf8ce'
        };
        var bannerMessageColour = colorCodes.Red;
        var bannerMessage = dataRecord.scriptParams.errorMessage;
        var countCompletedItems = dataRecord.scriptParams.countCompletedItems;
        if (!bannerMessage && countCompletedItems) {
            bannerMessageColour = colorCodes.Green;
            if (countCompletedItems > 1) {
                bannerMessage = "" + replacePlaceholders(_mobile.getValueFromPage('countCompleteMsg'), [countCompletedItems]);
            }
            else {
                bannerMessage = "" + _mobile.getValueFromPage('countCompleteMsgForSingleRecord');
            }
        }
        if (bannerMessage) {
            _mobile.setValueInPage('banner', "" + replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                bannerMessageColour,
                headerHeight
            ]) +
                bannerMessage +
                ("" + _mobile.getValueFromPage('bannerEnd')));
            setMargin();
        }
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
    return clientFunctions;
})();
