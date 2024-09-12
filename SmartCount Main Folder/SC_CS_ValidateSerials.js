/* enable-cache:true */
(function () {
    var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // @ts-ignore
    var headerHeight = headerElement.clientHeight;
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.serialsQuantityMismatch = function () {
        // @ts-ignore
        var _mobile = mobile;
        showBanner(_mobile.getValueFromPage('serialsCountMismatchMsg'), '#fccfcf');
        _mobile.setValueInPage('hiddenItem_SerialsMismatched', '');
        _mobile.setFocusOnElement('serials');
    };
    //@ts-ignore
    clientFunctions.serialsOnValidate = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        if (dataRecord.scriptParams.itemCountCreateResponse.allowManualCount ||
            dataRecord.scriptParams.callSerialOnScan) {
            scanSerial(_mobile, dataRecord);
        }
        else {
            _mobile.setFocusOnElement('serials');
        }
    };
    // @ts-ignore
    clientFunctions.serialsOnScan = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        scanSerial(_mobile, dataRecord);
    };
    function incrementSerialQuantity(serials, dataRecord, quantity) {
        // @ts-ignore
        var _mobile = mobile;
        var itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
        var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        itemCountDetails = filterSerials(itemCountDetails, serials);
        var statusQuantityDetails = dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
        var serialsQuantity = dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity;
        if (itemCountDetails[0].incrementQuantity) {
            var quantityVal = ++quantity;
            var setTotalQuantityField = void 0;
            _mobile.setValueInPage('quantity', quantityVal);
            if (defaultInventoryStatusId && statusQuantityDetails.length) {
                statusQuantityDetails = statusQuantityDetails.filter(function (quantityDetail) {
                    return quantityDetail.status == itemCountDetails[0].inventoryStatusIdParam;
                });
                setTotalQuantityField = statusQuantityDetails[0].quantity
                    ? ++statusQuantityDetails[0].quantity
                    : 1;
            }
            else {
                setTotalQuantityField = serialsQuantity ? ++serialsQuantity : 1;
            }
            _mobile.setValueInPage('totalQuantityCounted', setTotalQuantityField);
            dataRecord.scriptParams.isSerialTallyScanned = true;
        }
        itemCountDetails[0].incrementQuantity = false;
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
    function buildSerialConfig(itemCountDetailsObj, serials) {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        var baseUnitId = dataRecord.scriptParams.itemCountCreateResponse.baseUnitId;
        var baseUnitName = dataRecord.scriptParams.itemCountCreateResponse.baseUnitName;
        var defaultInventoryStatusId = dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId;
        var defaultInventoryStatusName;
        var inventoryStatuses = dataRecord.scriptParams.inventoryStatuses;
        if (inventoryStatuses) {
            defaultInventoryStatusName = inventoryStatuses.find(function (itemCountDetail) { return itemCountDetail.internalId == defaultInventoryStatusId; }).status;
        }
        var currentStatus = _mobile.getValueFromPage('inventoryStatus');
        if (!itemCountDetailsObj) {
            itemCountDetailsObj = { countQuantityParam: 1, inventoryNumberNameParam: serials };
        }
        else if (itemCountDetailsObj.inventoryStatusIdParam !=
            (currentStatus ? currentStatus.value : defaultInventoryStatusId)) {
            itemCountDetailsObj.incrementQuantity = true;
            var statusQuantityDetails = dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails;
            statusQuantityDetails = statusQuantityDetails.filter(function (quantityDetail) {
                if (quantityDetail.status == itemCountDetailsObj.inventoryStatusIdParam) {
                    quantityDetail.quantity = --quantityDetail.quantity;
                }
                return quantityDetail;
            });
            dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails = statusQuantityDetails;
        }
        if (defaultInventoryStatusId) {
            itemCountDetailsObj.inventoryStatusIdParam = currentStatus
                ? currentStatus.value
                : defaultInventoryStatusId;
            itemCountDetailsObj.inventoryStatusNameParam = currentStatus
                ? currentStatus.label
                : defaultInventoryStatusName;
        }
        if (baseUnitId) {
            itemCountDetailsObj.uomIdParam = baseUnitId;
            itemCountDetailsObj.uomNameParam = baseUnitName;
        }
        return itemCountDetailsObj;
    }
    function filterSerials(itemCountDetails, serials) {
        return itemCountDetails.filter(function (itemCount) {
            return itemCount.inventoryNumberNameParam == serials;
        });
    }
    function setMargin() {
        setTimeout(function () {
            var bannerElement = document.evaluate("//span[@id='banner']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            var bannerMarginElement = document.evaluate("//span[@id='banner']/parent::div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // @ts-ignore
            bannerMarginElement.style.marginTop = bannerElement.clientHeight + 'px';
        }, 0);
    }
    function scanSerial(_mobile, dataRecord) {
        var quantity = _mobile.getValueFromPage('quantity');
        var serials = _mobile.getValueFromPage('serials').toString().trim();
        if (!serials) {
            return;
        }
        var itemCountDetails = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails;
        itemCountDetails.forEach(function (itemCount, index) {
            itemCount.index = index;
        });
        showBanner("Serial '" + serials + "' was scanned or entered.", '#d7fccf');
        itemCountDetails = filterSerials(itemCountDetails, serials);
        if (itemCountDetails.length) {
            itemCountDetails[0] = buildSerialConfig(itemCountDetails[0], serials);
            if (itemCountDetails[0].countQuantityParam == 0) {
                itemCountDetails[0].countQuantityParam = 1;
                itemCountDetails[0].incrementQuantity = true;
            }
            dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails[itemCountDetails[0].index] = itemCountDetails[0];
        }
        else {
            var itemCountDetailsObj = buildSerialConfig(null, serials);
            itemCountDetailsObj.incrementQuantity = true;
            dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails.push(itemCountDetailsObj);
        }
        if (serials) {
            incrementSerialQuantity(serials, dataRecord, quantity);
            _mobile.setValueInPage('serials', '');
            if (dataRecord.scriptParams.setFocusOnItem) {
                _mobile.setFocusOnElement('item');
            }
            else {
                _mobile.setFocusOnElement('serials');
            }
        }
        dataRecord.scriptParams.callSerialOnScan = false;
        dataRecord.scriptParams.setFocusOnItem = false;
        _mobile.setRecordInState(dataRecord);
        localStorage.setItem('ItemCountRecord', JSON.stringify(dataRecord.scriptParams.itemCountCreateResponse));
    }
    return clientFunctions;
})();
