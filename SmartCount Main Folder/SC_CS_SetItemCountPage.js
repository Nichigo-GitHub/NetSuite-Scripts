/* enable-cache:true */
(function () {
    var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // @ts-ignore
    var headerHeight = headerElement.clientHeight;
    var isBackButtonClicked;
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.setItemCountPage = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        isBackButtonClicked = dataRecord.auxParams.isBackButtonClicked;
        // @ts-ignore
        mobile.setValueInPage('countInterfaceIconText', '<div style="position:absolute;right:15px;top:70px"><svg id ="sclisticon" viewBox="0 0 12 12" width="18" height="18"><line x1="2" y1="3" x2="10" y2="3"/><line x1="2" y1="6" x2="10" y2="6"/><line x1="2" y1="9" x2="10" y2="9"/></svg></div><style>#sclisticon{border: 2px solid;stroke:black;stroke-width:1;}</style>');
        if (dataRecord.scriptParams.nextItemsTbl) {
            dataRecord.scriptParams.nextItemExists = false;
            dataRecord.auxParams.itemsTbl = dataRecord.scriptParams.nextItemsTbl;
        }
        if (isBackButtonClicked) {
            dataRecord.auxParams.ItemListTbl = null;
            dataRecord.auxParams.isBackButtonClicked = false;
        }
        setQuantityFieldWidth();
        setItemCountPageDetails(dataRecord);
        removeNewLineClassFromDynamicText('viewlotnumbers');
        removeNewLineClassFromDynamicText('viewserialnumbers');
    };
    // @ts-ignore
    clientFunctions.updateItemCountFields = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        ItemListSameItemClickAction(dataRecord);
    };
    // @ts-ignore
    clientFunctions.setItemListBackButtonProperty = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        if (dataRecord.scriptParams.itemCountCreateResponse) {
            dataRecord.scriptParams.itemListBackResponse = true;
            dataRecord.scriptParams.inProgressItemCountRemarks =
                dataRecord.auxParams.itemCountRemarks;
        }
        else {
            dataRecord.scriptParams.itemListBackResponse = false;
            dataRecord.scriptParams.binScanned ? (dataRecord.scriptParams.binScanned = false) : '';
            dataRecord.scriptParams.scannedBinId
                ? (dataRecord.scriptParams.scannedBinId = null)
                : '';
        }
        dataRecord.auxParams.isBackButtonClicked = true;
        // @ts-ignore
        mobile.setRecordInState(dataRecord);
    };
    function getDocumentField(fieldForId) {
        return document
            .evaluate("//div[preceding-sibling::div[contains(@for,'" + fieldForId + "')]]//input", document, null, XPathResult.ANY_TYPE, null)
            .iterateNext();
    }
    function replacePlaceholders(translatedString, params) {
        var replacedString = translatedString;
        for (var i = 0; i < params.length; i++) {
            replacedString = replacedString.replace('${' + (i + 1) + '}', params[i]);
        }
        return replacedString;
    }
    function setItemCountPageDetails(dataRecord) {
        var _a, _b, _c, _d;
        var itemListTbl = dataRecord.auxParams.ItemListTbl;
        if (itemListTbl && JSON.stringify(itemListTbl) != JSON.stringify({})) {
            dataRecord.auxParams.itemsTbl = itemListTbl;
            dataRecord.scriptParams.selectedItemInfo = itemListTbl;
            if (!dataRecord.scriptParams.isFromProcessRescanPopupUpdate &&
                dataRecord.scriptParams.itemCountCreateResponse &&
                (dataRecord.scriptParams.itemCountCreateResponse.itemId !=
                    dataRecord.auxParams.itemsTbl.id ||
                    (dataRecord.scriptParams.itemCountCreateResponse.binId &&
                        dataRecord.scriptParams.itemCountCreateResponse.binId !=
                            dataRecord.auxParams.itemsTbl.binId))) {
                dataRecord.scriptParams.itemCountCreateResponse = null;
            }
        }
        var directedCount = !!dataRecord.auxParams.itemsTbl &&
            !!dataRecord.auxParams.itemsTbl.id &&
            !dataRecord.scriptParams.nonDirectedCount;
        if (dataRecord.scriptParams.nonDirectedCount == true) {
            dataRecord.auxParams.itemsTbl = null;
            dataRecord.scriptParams.nonDirectedCount = null;
            //@ts-ignore
            mobile.setRecordInState(dataRecord);
        }
        var binEnabled = directedCount
            ? dataRecord.auxParams.itemsTbl.binNumber
            : dataRecord.auxParams.userLocationsTbl
                ? dataRecord.auxParams.userLocationsTbl.binEnabled
                : dataRecord.scriptParams.selectedLocation.binEnabled;
        var itemDocumentField = getDocumentField('item');
        var binDocumentField = getDocumentField('bin');
        //@ts-ignore
        var _mobile = mobile;
        if (binEnabled) {
            setTimeout(function () { return _mobile.showField('bin'); }, 10);
            setTimeout(function () { return _mobile.setFocusOnElement('bin'); }, 10);
            _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                '#faf8ce',
                headerHeight
            ]) +
                _mobile.getValueFromPage('scanBinMsg') +
                _mobile.getValueFromPage('bannerEnd')));
            var setBinFocusIn = function () {
                //@ts-ignore
                var _mobile = mobile;
                var dataRecord = _mobile.getRecordFromState();
                _mobile.setValueInPage('bin', '');
                dataRecord.scriptParams.binScanned = false;
                dataRecord.scriptParams.scannedBinId = null;
                _mobile.setRecordInState(dataRecord);
            };
            binDocumentField.addEventListener('focusin', setBinFocusIn);
        }
        else {
            _mobile.hideField('bin');
            _mobile.setValueInPage('banner', "" + (replacePlaceholders(_mobile.getValueFromPage('bannerStart'), [
                '#faf8ce',
                headerHeight
            ]) +
                _mobile.getValueFromPage('scanItemMsg') +
                _mobile.getValueFromPage('bannerEnd')));
        }
        if (!directedCount) {
            setTimeout(function () {
                _mobile.hideField('completeAndNextCount_actBtn');
                _mobile.showField('completeCount_actBtn');
            }, 0);
            _mobile.hideField('itemName');
            _mobile.hideField('binName');
            _mobile.hideField('remarks');
            _mobile.disableField('pauseCount_actBtn');
            _mobile.disableField('completeCount_actBtn');
        }
        else {
            var itemName = dataRecord.scriptParams.itemCountCreateResponse
                ? dataRecord.scriptParams.itemCountCreateResponse.itemName
                : dataRecord.scriptParams.recountedItemDetails
                    ? dataRecord.scriptParams.recountedItemDetails.itemName
                    : dataRecord.auxParams.itemsTbl.name;
            var binName = dataRecord.scriptParams.itemCountCreateResponse
                ? dataRecord.scriptParams.itemCountCreateResponse.binNumber
                : dataRecord.scriptParams.recountedItemDetails
                    ? dataRecord.scriptParams.recountedItemDetails.binNumber
                    : dataRecord.auxParams.itemsTbl.binNumber;
            _mobile.setValueInPage('itemName', itemName);
            _mobile.setValueInPage('binName', binName);
            _mobile.showField('itemName');
            if (binEnabled) {
                _mobile.showField('binName');
            }
            if ((_a = dataRecord.scriptParams.recountedItemDetails) === null || _a === void 0 ? void 0 : _a.countConfigReferenceId) {
                _mobile.hideField('completeCount_actBtn');
                _mobile.showField('completeAndNextCount_actBtn');
            }
            else if (dataRecord.scriptParams.recountedItemDetails) {
                _mobile.hideField('completeAndNextCount_actBtn');
                _mobile.showField('completeCount_actBtn');
            }
        }
        var qtyField = getDocumentField('quantity');
        var setQtyFocusIn = function () {
            //@ts-ignore
            var _mobile = mobile;
            _mobile.setValueInPage('quantity', '');
        };
        qtyField.addEventListener('focusin', setQtyFocusIn);
        dataRecord.scriptParams.itemId = dataRecord.scriptParams.itemCountCreateResponse
            ? dataRecord.scriptParams.itemCountCreateResponse.itemId
            : dataRecord.scriptParams.recountedItemDetails
                ? dataRecord.scriptParams.recountedItemDetails.itemId
                : (_b = dataRecord.auxParams.itemsTbl) === null || _b === void 0 ? void 0 : _b.id;
        dataRecord.scriptParams.itemName = dataRecord.scriptParams.itemCountCreateResponse
            ? dataRecord.scriptParams.itemCountCreateResponse.itemName
            : dataRecord.scriptParams.recountedItemDetails
                ? dataRecord.scriptParams.recountedItemDetails.itemName
                : (_c = dataRecord.auxParams.itemsTbl) === null || _c === void 0 ? void 0 : _c.name;
        dataRecord.scriptParams.upcCode = dataRecord.scriptParams.itemCountCreateResponse
            ? dataRecord.scriptParams.itemCountCreateResponse.upcCode
            : dataRecord.scriptParams.recountedItemDetails
                ? dataRecord.scriptParams.recountedItemDetails.upcCode
                : (_d = dataRecord.auxParams.itemsTbl) === null || _d === void 0 ? void 0 : _d.upcCode;
        _mobile.setRecordInState(dataRecord);
        if (!dataRecord.scriptParams.popupButtonSelected) {
            if (!dataRecord.scriptParams.itemCountCreateResponse && dataRecord.auxParams.itemsTbl) {
                if (dataRecord.auxParams.itemsTbl.itemCountStatus == 1 ||
                    dataRecord.auxParams.itemsTbl.itemCountStatus == 8) {
                    setPausedItemCountDetails(dataRecord);
                }
                else {
                    _mobile.disableField('pauseCount_actBtn');
                }
            }
            else if (dataRecord.scriptParams.itemCountCreateResponse &&
                !dataRecord.scriptParams.isFromProcessRescanPopupUpdate &&
                dataRecord.scriptParams.itemCountCreateResponse.itemCountStatus == 1 &&
                !isBackButtonClicked &&
                !dataRecord.scriptParams.serialOrLotVarainceSubmit) {
                dataRecord.scriptParams.itemCountCreateResponse = null;
                dataRecord.scriptParams.previousScannedUpcValue = null;
                setPausedItemCountDetails(dataRecord);
            }
        }
        if (dataRecord.scriptParams.popupButtonSelected &&
            dataRecord.scriptParams.popupButtonSelected != 'update') {
            dataRecord.scriptParams.itemCountCreateResponse = null;
            _mobile.setRecordInState(dataRecord);
        }
        setTimeout(function () {
            var ele = document.evaluate("//span[@id='banner']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            var bannerMarginElement = document.evaluate("//span[@id='banner']/parent::div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // @ts-ignore
            bannerMarginElement.style.marginTop = ele.clientHeight + 'px';
            var itemNameElement = document.evaluate("//span[@id='itemName']/ancestor::div[@class='dynamic-text Inline newLine']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // @ts-ignore
            itemNameElement.style.maxWidth = '75%';
            var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // @ts-ignore
            var observer = new ResizeObserver(function () {
                setBannerTop();
                setMargin();
            });
            observer.observe(headerElement);
            var resetQuantityElement = document.querySelectorAll('[id="resetQuantity"]');
            if (resetQuantityElement.length) {
                var resetQuantityElementLabel = resetQuantityElement[0].parentElement.getElementsByClassName('dynamic-text-label');
                if (resetQuantityElementLabel.length) {
                    //@ts-ignore
                    resetQuantityElementLabel[0].style.visibility = 'hidden';
                }
            }
        }, 0);
        function setBannerTop() {
            var headerElement = document.evaluate("//div[@class='header']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // @ts-ignore
            var headerHeight = headerElement.clientHeight;
            var bannerElement = document.evaluate("//span[@id='banner']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (bannerElement) {
                // @ts-ignore
                bannerElement.style.top = headerHeight + 'px';
            }
        }
        function setMargin() {
            var bannerElement = document.evaluate("//span[@id='banner']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            var bannerMarginElement = document.evaluate("//span[@id='banner']/parent::div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (bannerMarginElement) {
                // @ts-ignore
                bannerMarginElement.style.marginTop = bannerElement.clientHeight + 'px';
            }
        }
    }
    function setQuantityFieldWidth() {
        var querySelectorElements = document.querySelectorAll('[for="quantity"]');
        var elementForTotalQuantity = document.querySelectorAll('[for="totalQuantityCounted"]');
        if (querySelectorElements.length > 0) {
            querySelectorElements[0].parentElement.classList.add('Inline');
            querySelectorElements[0].parentElement.classList.remove('newLine');
        }
        if (elementForTotalQuantity.length > 0) {
            var firstElement = elementForTotalQuantity[0];
            firstElement.parentElement.classList.add('Inline');
            firstElement.parentElement.classList.remove('newLine');
            firstElement.parentElement.style.float = 'right';
            firstElement.parentElement.style.marginRight = 'auto';
        }
    }
    // @ts-ignore
    function ItemListSameItemClickAction(dataRecord) {
        var itemListTbl = dataRecord.auxParams.ItemListTbl;
        dataRecord.auxParams.itemsTbl = itemListTbl;
        if (dataRecord.scriptParams.scannedBinId != itemListTbl.binId) {
            dataRecord.scriptParams.mixedCount = false;
            dataRecord.scriptParams.mixedItemCounts = [];
        }
        // @ts-ignore
        mobile.setValueInPage('itemName', "<span style='word-break: break-all;margin:0;'>" + itemListTbl.name + "</span>");
        // @ts-ignore
        mobile.setValueInPage('bin', '');
        // @ts-ignore
        mobile.setValueInPage('item', '');
        // @ts-ignore
        mobile.setValueInPage('quantity', '');
        dataRecord.scriptParams.itemCountCreateResponse = null;
        dataRecord.scriptParams.previousScannedUpcValue = null;
        dataRecord.scriptParams.binScanned ? (dataRecord.scriptParams.binScanned = false) : '';
        dataRecord.scriptParams.scannedBinId ? (dataRecord.scriptParams.scannedBinId = null) : '';
        // @ts-ignore
        mobile.enableField('completeCount_actBtn');
        // @ts-ignore
        mobile.setRecordInState(dataRecord);
    }
    function setPausedItemCountDetails(dataRecord) {
        //@ts-ignore
        var _mobile = mobile;
        var selectedTbl = dataRecord.auxParams.itemsTbl;
        var bin = selectedTbl.binNumber;
        if (bin) {
            setTimeout(function () {
                _mobile.setValueInPage('bin', htmlEscape(bin));
            }, 10);
        }
        setTimeout(function () {
            _mobile.setFocusOnElement('item');
            _mobile.disableField('item');
        }, 10);
        var upcCode = dataRecord.scriptParams.selectedItemInfo.upcCode;
        if (upcCode) {
            setTimeout(function () {
                _mobile.setValueInPage('item', htmlEscape(upcCode));
            }, 500);
        }
        else {
            setTimeout(function () {
                _mobile.setValueInPage('item', htmlEscape(dataRecord.scriptParams.selectedItemInfo.name));
            }, 500);
        }
        dataRecord.scriptParams.pausedItem = true;
        _mobile.setRecordInState(dataRecord);
        _mobile.enableField('pauseCount_actBtn');
        _mobile.enableField('completeCount_actBtn');
    }
    function htmlEscape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function removeNewLineClassFromDynamicText(fieldId) {
        var element = document
            .evaluate("//div[span[contains(@id,'" + fieldId + "')]]", document, null, XPathResult.ANY_TYPE, null)
            .iterateNext();
        // @ts-ignore
        element.classList.remove('newLine');
    }
    function resetFooter() {
        var _a;
        var overFlowButton = getSingleNodeValue("//button[@id='OverFlowButton']");
        var ellipseContainer = getSingleNodeValue("//div[@class='ellipse-container']");
        if (ellipseContainer) {
            // @ts-ignore
            getSingleNodeValue("//div[@class='ellipse-container']").remove();
            // @ts-ignore
            var buttonElements = getSingleNodeValue("//div[@class='overflow-buttons']").children;
            var footer = getSingleNodeValue("//div[@class='app-footer']");
            for (var i = 0; i < 2; i++) {
                buttonElements[0].children[0].style.padding = 0;
                footer.appendChild(buttonElements[0]);
            }
            // @ts-ignore
            footer.children[0].style.flexGrow = 0;
            // @ts-ignore
            footer.children[0].style.paddingRight = '16px';
            var cancelBtn = getSingleNodeValue("//div[@class='app-footer']/div/div/button");
            // @ts-ignore
            cancelBtn === null || cancelBtn === void 0 ? void 0 : cancelBtn.style.padding = 0;
        }
        else if (overFlowButton) {
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
    }
    function getSingleNodeValue(expression) {
        return document.evaluate(expression, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    function getOrderedNodeList(expression) {
        return document.evaluate(expression, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    }
    return clientFunctions;
})();
