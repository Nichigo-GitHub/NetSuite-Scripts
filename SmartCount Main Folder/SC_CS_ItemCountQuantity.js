/* enable-cache:true */
(function () {
    var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // @ts-ignore
    var headerHeight = headerElement.clientHeight;
    var clientFunctions = {
        validateCountQuantity: function () {
            this.validateCurrentOrTotalQuantity(true);
        },
        validateTotalCountQuantity: function () {
            this.validateCurrentOrTotalQuantity(false);
        },
        validateCurrentOrTotalQuantity: function (isFromCurrentQuantity) {
            // @ts-ignore
            var _mobile = mobile;
            var currentQuantity = _mobile.getValueFromPage('quantity');
            var totalQuantityCounted = _mobile.getValueFromPage('totalQuantityCounted');
            currentQuantity = Number(currentQuantity) || 0;
            totalQuantityCounted = Number(totalQuantityCounted) || 0;
            var currentOrTotalQuantity = isFromCurrentQuantity
                ? currentQuantity
                : totalQuantityCounted;
            if (currentOrTotalQuantity < 0 || currentOrTotalQuantity >= 1.0e10) {
                throw new Error(_mobile.getValueFromPage('invalidQuantityMsg'));
            }
            var dataRecord = _mobile.getRecordFromState();
            var itemCountRecord = dataRecord.scriptParams.itemCountCreateResponse;
            if (!itemCountRecord) {
                return;
            }
            var itemCountDetails = itemCountRecord.itemCountDetails;
            var defaultUomId = itemCountRecord.defaultUomId;
            var uomIdFromGs1 = itemCountRecord.uomIdFromGs1;
            var defaultInventoryStatusId = itemCountRecord.defaultInventoryStatusId;
            var currentUOM = _mobile.getValueFromPage('unitOfMeasurement');
            var currentStatus = _mobile.getValueFromPage('inventoryStatus');
            var currentLotNumber = _mobile.getValueFromPage('lotnumber').toString().trim();
            var statusQuantityDetails = itemCountRecord.statusQuantityDetails;
            itemCountDetails.forEach(function (itemCount, index) {
                itemCount.index = index;
            });
            if (itemCountRecord.isSerialItem) {
                if (isFromCurrentQuantity) {
                    var ignoreSerialNumberUntilVariance = itemCountRecord.ignoreSerialNumberUntilVariance;
                    var isPopupActionNotSelected = (itemCountRecord === null || itemCountRecord === void 0 ? void 0 : itemCountRecord.selectedPopupAction) != 'fromVariancePopup';
                    var isAddCurrentQtyWithTotalQty = (ignoreSerialNumberUntilVariance &&
                        ((isPopupActionNotSelected &&
                            !dataRecord.scriptParams.isItemTallyScanned) ||
                            (!isPopupActionNotSelected &&
                                !dataRecord.scriptParams.isSerialTallyScanned))) ||
                        (!ignoreSerialNumberUntilVariance &&
                            !dataRecord.scriptParams.isSerialTallyScanned);
                    if (isAddCurrentQtyWithTotalQty) {
                        var totalCount = currentQuantity + totalQuantityCounted;
                        _mobile.setValueInPage('totalQuantityCounted', totalCount);
                        _mobile.setValueInPage('quantity', '');
                        dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity = totalCount;
                        dataRecord.scriptParams.tallyScanCurrentCount = null;
                    }
                }
                else {
                    dataRecord.scriptParams.itemCountCreateResponse.serialsQuantity = totalQuantityCounted;
                    dataRecord.scriptParams.isSerialTallyScanned = false;
                    dataRecord.scriptParams.isItemTallyScanned = false;
                }
                if (defaultInventoryStatusId && statusQuantityDetails.length) {
                    statusQuantityDetails.forEach(function (quantityDetail) {
                        if (quantityDetail.status ==
                            (currentStatus ? currentStatus.value : defaultInventoryStatusId)) {
                            if (!isFromCurrentQuantity) {
                                quantityDetail.quantity = totalQuantityCounted
                                    ? Number(totalQuantityCounted)
                                    : 0;
                            }
                        }
                    });
                    dataRecord.scriptParams.itemCountCreateResponse.statusQuantityDetails = statusQuantityDetails;
                    _mobile.setRecordInState(dataRecord);
                }
            }
            else if (currentLotNumber !== '' || !itemCountRecord.isLotItem) {
                if (defaultInventoryStatusId) {
                    var inventoryStatusId_1 = currentStatus
                        ? currentStatus.value
                        : defaultInventoryStatusId;
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
                    if (isFromCurrentQuantity) {
                        if (!dataRecord.scriptParams.isItemTallyScanned) {
                            _mobile.setValueInPage('quantity', '');
                            var resetValue = dataRecord.scriptParams.resetValue;
                            if (resetValue || resetValue == 0) {
                                _mobile.setValueInPage('totalQuantityCounted', resetValue == 0 ? '' : resetValue);
                                dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails[itemCountDetails[0].index].countQuantityParam = resetValue;
                            }
                            else {
                                var countQuantity = dataRecord.scriptParams.itemCountCreateResponse
                                    .itemCountDetails[itemCountDetails[0].index]
                                    .countQuantityParam;
                                countQuantity += currentQuantity;
                                _mobile.setValueInPage('totalQuantityCounted', countQuantity);
                            }
                            dataRecord.scriptParams.incrementLotCurrentQtyForEveryscan = null;
                            dataRecord.scriptParams.tallyScanCurrentCount = null;
                        }
                    }
                    else {
                        dataRecord.scriptParams.itemCountCreateResponse.itemCountDetails[itemCountDetails[0].index].countQuantityParam = totalQuantityCounted
                            ? Number(totalQuantityCounted)
                            : 0;
                        dataRecord.scriptParams.isItemTallyScanned = false;
                    }
                }
            }
            else if (itemCountRecord.isLotItem &&
                dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                    'fromVariancePopup') {
                if (isFromCurrentQuantity && !dataRecord.scriptParams.isItemTallyScanned) {
                    var countQuantity = currentQuantity + totalQuantityCounted;
                    _mobile.setValueInPage('quantity', '');
                    _mobile.setValueInPage('totalQuantityCounted', countQuantity);
                    dataRecord.scriptParams.tallyScanCurrentCount = null;
                }
                else {
                    if (!defaultInventoryStatusId && !defaultUomId) {
                        var itemCountDetailsUntilVariance = dataRecord.scriptParams.itemCountCreateResponse
                            .itemCountDetailsUntilVariance;
                        if (itemCountDetailsUntilVariance.length) {
                            itemCountDetailsUntilVariance[0].currentQuantity = totalQuantityCounted;
                        }
                        else if (currentQuantity) {
                            itemCountDetailsUntilVariance[0] = {
                                currentQuantity: totalQuantityCounted
                            };
                        }
                    }
                    else if (defaultInventoryStatusId && !defaultUomId) {
                        var inventoryStatusId = currentStatus
                            ? currentStatus.value
                            : defaultInventoryStatusId;
                        var selectedValues = {
                            currentQuantity: totalQuantityCounted,
                            inventoryStatusId: inventoryStatusId
                        };
                        this.setItemCountDetailsUntilVariance(selectedValues);
                    }
                    else if (!defaultInventoryStatusId && defaultUomId) {
                        var uomId = currentUOM ? currentUOM.value : uomIdFromGs1 || defaultUomId;
                        var selectedValues = {
                            currentQuantity: totalQuantityCounted,
                            uomId: uomId
                        };
                        this.setItemCountDetailsUntilVariance(selectedValues);
                    }
                    else if (defaultInventoryStatusId && defaultUomId) {
                        var inventoryStatusId = currentStatus
                            ? currentStatus.value
                            : defaultInventoryStatusId;
                        var uomId = currentUOM ? currentUOM.value : uomIdFromGs1 || defaultUomId;
                        var selectedValues = {
                            currentQuantity: totalQuantityCounted,
                            inventoryStatusId: inventoryStatusId,
                            uomId: uomId
                        };
                        this.setItemCountDetailsUntilVariance(selectedValues);
                    }
                    dataRecord.scriptParams.isItemTallyScanned = false;
                }
            }
            if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem &&
                !dataRecord.scriptParams.lotScanned &&
                !currentLotNumber &&
                !dataRecord.scriptParams.isFromLotScan &&
                !(dataRecord.scriptParams.isIgnoreLotNumberUntilVariance &&
                    dataRecord.scriptParams.itemCountCreateResponse.selectedPopupAction !=
                        'fromVariancePopup')) {
                var isViewLotNumbersEmpty = !itemCountDetails.find(function (itemCount) {
                    if (itemCount.countQuantityParam > 0) {
                        return itemCount;
                    }
                });
                var displayError = (Number(currentQuantity || totalQuantityCounted) && isViewLotNumbersEmpty) ||
                    (!isViewLotNumbersEmpty &&
                        (currentQuantity || totalQuantityCounted) != '' &&
                        Number((currentQuantity || totalQuantityCounted) >= 0));
                if (displayError) {
                    throw new Error(_mobile.getValueFromPage('unassignedLotQtyMsg'));
                }
            }
            dataRecord.scriptParams.isFromLotScan = false;
            _mobile.setRecordInState(dataRecord);
            localStorage.setItem('ItemCountRecord', JSON.stringify(dataRecord.scriptParams.itemCountCreateResponse));
            if (!dataRecord.scriptParams.itemCountCreateResponse.isLotItem &&
                !dataRecord.scriptParams.itemCountCreateResponse.isSerialItem &&
                !dataRecord.scriptParams.itemCountCreateResponse.allowManualCount &&
                currentQuantity > 0) {
                _mobile.showField('resetQuantity');
            }
            if (dataRecord.scriptParams.pausedItem == true) {
                dataRecord.scriptParams.pausedItem = false;
                if (dataRecord.scriptParams.itemCountCreateResponse.isLotItem) {
                    _mobile.setFocusOnElement('lotnumber');
                }
                else if (dataRecord.scriptParams.itemCountCreateResponse.isSerialItem) {
                    _mobile.setFocusOnElement('serials');
                }
                else {
                    _mobile.setFocusOnElement('item');
                }
                _mobile.setRecordInState(dataRecord);
            }
        },
        setItemCountDetailsUntilVariance: function (selectedValues) {
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
                }
                else if (selectedValues.inventoryStatusId && !selectedValues.uomId) {
                    existingObj = itemCountDetailsUntilVariance.find(function (obj) { return obj.inventoryStatusId == selectedValues.inventoryStatusId; });
                }
                else if (!selectedValues.inventoryStatusId && selectedValues.uomId) {
                    existingObj = itemCountDetailsUntilVariance.find(function (obj) { return obj.uomId == selectedValues.uomId; });
                }
                if (!existingObj) {
                    itemCountDetailsUntilVariance.push(selectedValues);
                }
                else {
                    existingObj.currentQuantity = selectedValues.currentQuantity;
                }
            }
            else {
                itemCountDetailsUntilVariance.push(selectedValues);
            }
        },
        onScanQuantity: function () {
            // @ts-ignore
            var _mobile = mobile;
            var currentQuantity = _mobile.getValueFromPage('quantity');
            if (Number(currentQuantity) < 0 || Number(currentQuantity) >= 1.0e10) {
                throw new Error(_mobile.getValueFromPage('invalidQuantityMsg'));
            }
            var dataRecord = _mobile.getRecordFromState();
            var itemCountRecord = dataRecord.scriptParams.itemCountCreateResponse;
            if (!itemCountRecord) {
                return;
            }
            var currentLotNumber = _mobile.getValueFromPage('lotnumber').toString().trim();
            if (currentLotNumber) {
                dataRecord.scriptParams.promptOpened = false;
                _mobile.hideField('prompt');
                this.showBanner(this.replacePlaceholders(_mobile.getValueFromPage('lotScannedMsg'), [
                    currentQuantity,
                    currentLotNumber
                ]), '#d7fccf');
                _mobile.setValueInPage('quantity', '');
                _mobile.setValueInPage('lotnumber', '');
                _mobile.setFocusOnElement('lotnumber');
                _mobile.setRecordInState(dataRecord);
            }
        },
        resetQuantity: function () {
            // @ts-ignore
            var _mobile = mobile;
            var countQuantity = _mobile.getValueFromPage('quantity');
            var totalCountQuantity = _mobile.getValueFromPage('totalQuantityCounted');
            var resetValue = Number(totalCountQuantity) - Number(countQuantity);
            var dataRecord = _mobile.getRecordFromState();
            dataRecord.scriptParams.resetValue = resetValue;
            _mobile.setValueInPage('quantity', '');
            _mobile.setValueInPage('totalQuantityCounted', resetValue == 0 ? '' : resetValue);
            _mobile.setFocusOnElement('item');
            _mobile.hideField('resetQuantity');
            _mobile.setRecordInState(dataRecord);
            this.validateCountQuantity();
        },
        hideCloseButton: function () {
            //@ts-ignore
            document.getElementsByClassName('svg-image close')[0].style.display = 'none';
        },
        replacePlaceholders: function (translatedString, params) {
            var replacedString = translatedString;
            for (var i = 0; i < params.length; i++) {
                replacedString = replacedString.replace('${' + (i + 1) + '}', params[i]);
            }
            return replacedString;
        },
        setMargin: function () {
            setTimeout(function () {
                var bannerElement = document.evaluate("//span[@id='banner']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                var bannerMarginElement = document.evaluate("//span[@id='banner']/parent::div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                // @ts-ignore
                bannerMarginElement.style.marginTop = bannerElement.clientHeight + 'px';
            }, 0);
        },
        showBanner: function (message, colorCode) {
            // @ts-ignore
            var _mobile = mobile;
            _mobile.setValueInPage('banner', "" + (this.replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                colorCode,
                headerHeight
            ]) +
                message +
                _mobile.getValueFromPage('bannerEnd')));
            this.setMargin();
        }
    };
    return clientFunctions;
})();
