/* enable-cache:true */
(function () {
    var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // @ts-ignore
    var headerHeight = headerElement.clientHeight;
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.validateLot = function () {
        lotHelper(true);
    };
    //@ts-ignore
    clientFunctions.scanLot = function () {
        lotHelper(false);
    };
    // @ts-ignore
    clientFunctions.unassignedLotQty = function () {
        // @ts-ignore
        var _mobile = mobile;
        showBanner(_mobile.getValueFromPage('unassignedLotQtyMsg'), '#fccfcf');
        _mobile.setValueInPage('hiddenItem_UnassignedLotQty', '');
    };
    function lotHelper(fromValidate) {
        var _a;
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var lots = _mobile.getValueFromPage('lotnumber').toString().trim();
        if (dataRecord.scriptParams.previouslyScannedLotNumber != lots) {
            dataRecord.scriptParams.previouslyScannedLotNumber = lots;
            dataRecord.scriptParams.incrementLotCurrentQtyForEveryscan = null;
        }
        var itemCountCreateResponse = dataRecord.scriptParams.itemCountCreateResponse;
        var itemCountDetails = itemCountCreateResponse.itemCountDetails;
        var defaultUomId = dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
        var currentUOM = defaultUomId ? _mobile.getValueFromPage('unitOfMeasurement') : '';
        var previousGS1Data = dataRecord.scriptParams.previousGS1Data;
        var previousGS1UomId = (_a = previousGS1Data === null || previousGS1Data === void 0 ? void 0 : previousGS1Data.uomDetails) === null || _a === void 0 ? void 0 : _a.uomId;
        var selectedUomId;
        if (currentUOM && previousGS1UomId == currentUOM.value) {
            selectedUomId = previousGS1UomId;
        }
        else if (currentUOM) {
            selectedUomId =
                previousGS1UomId && dataRecord.scriptParams.lotGs1scanned
                    ? previousGS1UomId
                    : currentUOM.value;
        }
        else {
            selectedUomId = previousGS1UomId ? previousGS1UomId : defaultUomId;
        }
        var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        var status = _mobile.getValueFromPage('inventoryStatus')
            ? _mobile.getValueFromPage('inventoryStatus').value
            : defaultInventoryStatusId;
        var callLotOnScan = dataRecord.scriptParams.callLotOnScan;
        if (lots) {
            showBanner("Lot '" + lots + "' was scanned or entered.", '#d7fccf');
            dataRecord.scriptParams.lotScanned = lots;
            itemCountDetails = filterLots(itemCountDetails, lots, status, selectedUomId);
            if (itemCountDetails.length) {
                var lotQuantity = 0;
                if (fromValidate && !callLotOnScan) {
                    lotQuantity = itemCountDetails[0].countQuantityParam;
                    _mobile.setValueInPage('quantity', '');
                    _mobile.setValueInPage('totalQuantityCounted', lotQuantity ? lotQuantity : '');
                }
                else {
                    itemCountDetails[0].countQuantityParam =
                        Number(itemCountDetails[0].countQuantityParam) +
                            Number(previousGS1Data && callLotOnScan
                                ? previousGS1Data.quantity == 0
                                    ? 1
                                    : previousGS1Data.quantity
                                : 1);
                    lotQuantity = itemCountDetails[0].countQuantityParam;
                    if (!callLotOnScan) {
                        _mobile.setValueInPage('quantity', ++dataRecord.scriptParams.incrementLotCurrentQtyForEveryscan);
                    }
                    else {
                        dataRecord.scriptParams.isItemTallyScanned = true;
                        _mobile.setValueInPage('quantity', '');
                        _mobile.setValueInPage('quantity', previousGS1Data.quantity || 1);
                        dataRecord.scriptParams.incrementLotCurrentQtyForEveryscan = null;
                    }
                    _mobile.setValueInPage('totalQuantityCounted', lotQuantity);
                }
            }
            else {
                var countQuantity = 0;
                var itemCountDetailsObj = buildLotConfig({
                    countQuantityParam: previousGS1Data && callLotOnScan
                        ? previousGS1Data.quantity == 0
                            ? 1
                            : previousGS1Data.quantity
                        : fromValidate
                            ? ''
                            : 1,
                    inventoryNumberNameParam: lots
                });
                dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails.push(itemCountDetailsObj);
                countQuantity = itemCountDetailsObj.countQuantityParam
                    ? itemCountDetailsObj.countQuantityParam
                    : '';
                _mobile.setValueInPage('quantity', countQuantity);
                _mobile.setValueInPage('totalQuantityCounted', countQuantity);
            }
            if (!fromValidate || callLotOnScan) {
                dataRecord.scriptParams.isFromLotScan = true;
                localStorage.setItem('ItemCountRecord', JSON.stringify(dataRecord.scriptParams.itemCountCreateResponse));
                if (dataRecord.scriptParams.setFocusOnItem) {
                    _mobile.setFocusOnElement('item');
                }
                else {
                    _mobile.setValueInPage('lotnumber', '');
                    _mobile.setFocusOnElement('lotnumber');
                }
                dataRecord.scriptParams.promptOpened && _mobile.hideField('prompt');
            }
            else if (dataRecord.scriptParams.allowManualCountEntry) {
                dataRecord.scriptParams.promptOpened = true;
                _mobile.setRecordInState(dataRecord);
                _mobile.showField('prompt');
                if (dataRecord.scriptParams.shouldEnterLotQuantity) {
                    _mobile.setFocusOnElement('quantity');
                }
                else if (dataRecord.scriptParams.setFocusOnItem) {
                    dataRecord.scriptParams.promptOpened && _mobile.hideField('prompt');
                    _mobile.setFocusOnElement('item');
                }
            }
        }
        dataRecord.scriptParams.shouldEnterLotQuantity = false;
        dataRecord.scriptParams.setFocusOnItem = false;
        dataRecord.scriptParams.callLotOnScan = false;
        dataRecord.scriptParams.lotGs1scanned = false;
        _mobile.setRecordInState(dataRecord);
    }
    function showBanner(message, colorCode) {
        // @ts-ignore
        var _mobile = mobile;
        _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
            colorCode,
            headerHeight
        ]) +
            message +
            _mobile.getValueFromPage('bannerEnd')));
        setMargin();
    }
    function replacePlaceholders(translatedString, params) {
        var replacedString = translatedString;
        for (var i = 0; i < params.length; i++) {
            replacedString = replacedString.replace('${' + (i + 1) + '}', params[i]);
        }
        return replacedString;
    }
    function filterLots(itemCountDetails, lot, status, selectedUomId) {
        itemCountDetails = itemCountDetails.filter(function (itemCount) {
            if (status) {
                return (itemCount.inventoryNumberNameParam == lot &&
                    itemCount.inventoryStatusIdParam == status);
            }
            return itemCount.inventoryNumberNameParam == lot;
        });
        if (selectedUomId) {
            itemCountDetails = itemCountDetails.filter(function (itemCount) {
                return itemCount.uomIdParam == selectedUomId;
            });
        }
        return itemCountDetails;
    }
    function buildLotConfig(itemCountDetailsObj) {
        var _a, _b, _c, _d;
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var defaultUomId = dataRecord.scriptParams.itemCountCreateResponse.defaultUomId;
        var defaultUomName = dataRecord.scriptParams.itemCountCreateResponse.defaultUomName;
        var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        var defaultInventoryStatusName;
        var inventoryStatuses = dataRecord.scriptParams.inventoryStatuses;
        if (inventoryStatuses) {
            defaultInventoryStatusName = inventoryStatuses.find(function (itemCountDetail) { return itemCountDetail.internalId == defaultInventoryStatusId; }).status;
        }
        var currentStatus = _mobile.getValueFromPage('inventoryStatus');
        if (defaultInventoryStatusId) {
            itemCountDetailsObj.inventoryStatusIdParam = currentStatus
                ? currentStatus.value
                : defaultInventoryStatusId;
            itemCountDetailsObj.inventoryStatusNameParam = currentStatus
                ? currentStatus.label
                : defaultInventoryStatusName;
        }
        var currentUOM = _mobile.getValueFromPage('unitOfMeasurement');
        if (defaultUomId) {
            var selectedUomId = void 0, selectedUomName = void 0;
            var previousGS1UomId = (_b = (_a = dataRecord.scriptParams.previousGS1Data) === null || _a === void 0 ? void 0 : _a.uomDetails) === null || _b === void 0 ? void 0 : _b.uomId;
            var previousGS1UomName = (_d = (_c = dataRecord.scriptParams.previousGS1Data) === null || _c === void 0 ? void 0 : _c.uomDetails) === null || _d === void 0 ? void 0 : _d.uomName;
            if (currentUOM && previousGS1UomId == currentUOM.value) {
                selectedUomId = previousGS1UomId;
                selectedUomName = previousGS1UomName;
            }
            else if (currentUOM) {
                selectedUomId =
                    previousGS1UomId && dataRecord.scriptParams.lotGs1scanned
                        ? previousGS1UomId
                        : currentUOM.value;
                selectedUomName =
                    previousGS1UomName && dataRecord.scriptParams.lotGs1scanned
                        ? previousGS1UomName
                        : currentUOM.label;
            }
            else {
                selectedUomId = previousGS1UomId ? previousGS1UomId : defaultUomId;
                selectedUomName = previousGS1UomName ? previousGS1UomName : defaultUomName;
            }
            itemCountDetailsObj.uomIdParam = selectedUomId;
            itemCountDetailsObj.uomNameParam = selectedUomName;
        }
        return itemCountDetailsObj;
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
