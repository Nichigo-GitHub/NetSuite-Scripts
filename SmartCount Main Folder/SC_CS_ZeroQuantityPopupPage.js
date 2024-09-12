(function () {
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.ZeroQuantityIgnore = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        if (dataRecord.scriptParams.binScanned == false) {
            _mobile.setFocusOnElement('bin');
        }
        else {
            _mobile.setFocusOnElement('item');
        }
        _mobile.setValueInPage('hiddenItem_ZeroQuantityCompletePopup', '');
    };
    return clientFunctions;
})();
