(function () {
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.popUpDoneConfirmationContinue = function () {
        // @ts-ignore
        var _mobile = mobile;
        var dataRecord = _mobile.getRecordFromState();
        dataRecord.scriptParams.itemCountCreateResponse = null;
        _mobile.setRecordInState(dataRecord);
        _mobile.setValueInPage('hiddenEleForDoneConfirmationPopup', '');
        _mobile.setValueInPage('hiddenEleForRescanPopup', 'true');
    };
    // @ts-ignore
    clientFunctions.DoneConfirmationIgnoreFromTaskList = function () {
        // @ts-ignore
        var _mobile = mobile;
        _mobile.setValueInPage('hiddenEleForDoneConfirmationPopup', '');
    };
    return clientFunctions;
})();
