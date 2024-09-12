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
    var clientFunctions = {};
    //@ts-ignore
    clientFunctions.RescanIgnoreFromTaskList = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        dataRecord.scriptParams.selectedItemInfo = null;
        _mobile.setValueInPage('hiddenEleForRescanPopup', '');
        _mobile.setValueInPage('hiddenEleForDoneConfirmationPopup', '');
        _mobile.setRecordInState(dataRecord);
    };
    //@ts-ignore
    clientFunctions.RescanRecountFromTaskList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, selectedItemInfo, itemCountEditRequest, itemCountRecordCreateWithRefParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.popupButtonSelected = 'recount';
                        selectedItemInfo = dataRecord.scriptParams.selectedItemInfo;
                        itemCountEditRequest = {};
                        itemCountEditRequest.itemCountIdParam = selectedItemInfo.itemCountId;
                        itemCountEditRequest.statusIdParam = 7;
                        itemCountEditRequest.rescanAction = 'recount';
                        if (dataRecord.auxParams.itemCountRemarks || dataRecord.auxParams.itemCountRemarks == '') {
                            itemCountEditRequest.remarksParam = dataRecord.auxParams.itemCountRemarks;
                        }
                        itemCountEditRequest.isFromRescanRecountFromTaskList = true;
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_get_icd_and_edit', 'customdeploy_sc_rl_get_icd_and_edit', {
                                itemCountRecord: itemCountEditRequest,
                                isFromClient: true
                            }, 'post')];
                    case 1:
                        _a.sent();
                        itemCountRecordCreateWithRefParams = {
                            itemCountIdParam: selectedItemInfo.itemCountId,
                            rescanAction: 'recount'
                        };
                        _mobile.callRestlet('customscript_sc_rl_item_count_from_ref', 'customdeploy_sc_rl_item_count_from_ref', {
                            itemCountRecord: itemCountRecordCreateWithRefParams
                        }, 'post');
                        dataRecord.auxParams.itemCountRemarks = null;
                        dataRecord.scriptParams.selectedItemInfo = null;
                        dataRecord.scriptParams.previousScannedUpcValue = null;
                        dataRecord.scriptParams.binScanned = false;
                        _mobile.setValueInPage('hiddenEleForRescanPopup', '');
                        _mobile.setValueInPage('hiddenEleForItemCountPage', 'true');
                        _mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    };
    //@ts-ignore
    clientFunctions.RescanUpdateFromTaskList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _mobile, dataRecord, selectedItemInfo, itemCountEditRequest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _mobile = mobile;
                        dataRecord = _mobile.getRecordFromState();
                        dataRecord.scriptParams.popupButtonSelected = 'update';
                        dataRecord.scriptParams.isFromProcessRescanPopupUpdate = true;
                        dataRecord.scriptParams.isFromTaskListRescanPopup = true;
                        _mobile.setRecordInState(dataRecord);
                        selectedItemInfo = dataRecord.scriptParams.selectedItemInfo;
                        dataRecord.scriptParams.previousScannedUpcValue = selectedItemInfo.upcCode;
                        itemCountEditRequest = {};
                        itemCountEditRequest.itemCountIdParam = selectedItemInfo.itemCountId;
                        itemCountEditRequest.statusIdParam = 1;
                        itemCountEditRequest.rescanAction = 'update';
                        itemCountEditRequest.isFromTaskListRescanPopup =
                            dataRecord.scriptParams.isFromTaskListRescanPopup;
                        return [4 /*yield*/, _mobile.callRestlet('customscript_sc_rl_get_icd_and_edit', 'customdeploy_sc_rl_get_icd_and_edit', {
                                itemCountRecord: itemCountEditRequest,
                                isFromClient: true
                            }, 'post')];
                    case 1:
                        _a.sent();
                        _mobile.setValueInPage('hiddenEleForRescanPopup', '');
                        _mobile.setValueInPage('hiddenEleForItemCountPage', 'true');
                        _mobile.setRecordInState(dataRecord);
                        return [2 /*return*/];
                }
            });
        });
    };
    return clientFunctions;
})();
