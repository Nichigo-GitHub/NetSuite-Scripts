/* enable-cache:true */
(function () {
    var clientFunctions = {
        onDropdownSelect: function () {
            var _a;
            // @ts-ignore
            var _mobile = mobile;
            var dataRecord = _mobile.getRecordFromState();
            var itemCountRecord = dataRecord.scriptParams.itemCountCreateResponse;
            var defaultUomId = itemCountRecord.defaultUomId;
            var defaultInventoryStatusId = itemCountRecord.defaultInventoryStatusId;
            var itemCountDetails = itemCountRecord.itemCountDetails;
            var countQuantity = 0;
            var selectedUOM = _mobile.getValueFromPage('unitOfMeasurement');
            var currentStatus = _mobile.getValueFromPage('inventoryStatus');
            var inventoryStatusId = currentStatus
                ? currentStatus.value
                : itemCountRecord.defaultInventoryStatusId;
            var uomId = selectedUOM ? selectedUOM.value : defaultUomId;
            dataRecord.scriptParams.tallyScanCurrentCount = null;
            if (itemCountRecord.isLotItem &&
                dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                    'fromVariancePopup') {
                var quantityObj = void 0;
                var itemCountDetailsUntilVariance = dataRecord.scriptParams.itemCountCreateResponse.itemCountDetailsUntilVariance;
                if (defaultInventoryStatusId && !defaultUomId) {
                    quantityObj = itemCountDetailsUntilVariance.find(function (obj) { return obj.inventoryStatusId == inventoryStatusId; });
                    countQuantity = quantityObj ? quantityObj.currentQuantity : null;
                }
                else if (!defaultInventoryStatusId && defaultUomId) {
                    quantityObj = itemCountDetailsUntilVariance.find(function (obj) { return obj.uomId == uomId; });
                    countQuantity = quantityObj ? quantityObj.currentQuantity : null;
                }
                else if (defaultInventoryStatusId && defaultUomId) {
                    quantityObj = itemCountDetailsUntilVariance.find(function (obj) { return obj.uomId == uomId && obj.inventoryStatusId == inventoryStatusId; });
                    countQuantity = quantityObj ? quantityObj.currentQuantity : null;
                }
                dataRecord.scriptParams.itemCountCreateResponse.defaultUomId = uomId;
                if (inventoryStatusId) {
                    dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId = inventoryStatusId;
                }
            }
            else {
                if (inventoryStatusId) {
                    itemCountDetails = itemCountDetails.filter(function (itemCount) {
                        return itemCount.inventoryStatusIdParam == inventoryStatusId;
                    });
                    dataRecord.scriptParams.itemCountCreateResponse.defaultInventoryStatusId = inventoryStatusId;
                }
                if (itemCountRecord.isLotItem) {
                    var currentLotNumber_1 = dataRecord.scriptParams.lotScanned;
                    if (!currentLotNumber_1) {
                        _mobile.setValueInPage('quantity', '');
                        _mobile.setValueInPage('totalQuantityCounted', '');
                        return;
                    }
                    if (currentLotNumber_1) {
                        itemCountDetails = itemCountDetails.filter(function (itemCount) {
                            return itemCount.inventoryNumberNameParam == currentLotNumber_1;
                        });
                    }
                }
                if (itemCountRecord.isSerialItem) {
                    var statusQuantityDetails = itemCountRecord.statusQuantityDetails;
                    var statusDetails = statusQuantityDetails.find(function (ele) {
                        return ele.status == inventoryStatusId;
                    });
                    countQuantity = statusDetails.quantity;
                }
                else {
                    if (defaultUomId) {
                        var selectedUomValue = selectedUOM ? selectedUOM.value : defaultUomId;
                        for (var index = 0; index < itemCountDetails.length; index++) {
                            if (itemCountDetails[index].uomIdParam == selectedUomValue) {
                                countQuantity = itemCountDetails[index].countQuantityParam;
                                break;
                            }
                        }
                        dataRecord.scriptParams.itemCountCreateResponse.defaultUomId = selectedUomValue;
                    }
                    else {
                        countQuantity = (_a = itemCountDetails[0]) === null || _a === void 0 ? void 0 : _a.countQuantityParam;
                    }
                }
            }
            _mobile.setRecordInState(dataRecord);
            _mobile.setValueInPage('quantity', '');
            _mobile.setValueInPage('totalQuantityCounted', countQuantity ? countQuantity : '');
            if (itemCountRecord.isLotItem) {
                dataRecord.scriptParams.incrementLotCurrentQtyForEveryscan = null;
                _mobile.setValueInPage('lotnumber', '');
                _mobile.setFocusOnElement('lotnumber');
            }
            else if (itemCountRecord.isSerialItem) {
                _mobile.setValueInPage('serials', '');
                _mobile.setFocusOnElement('serials');
            }
        }
    };
    return clientFunctions;
})();
