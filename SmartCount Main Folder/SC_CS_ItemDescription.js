(function () {
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.setItemDescription = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        var description = dataRecord.scriptParams.description
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        // @ts-ignore
        mobile.setPopupElementSourceData('ItemDescriptionPopupText', description);
    };
    // @ts-ignore
    clientFunctions.clearHiddenField = function () {
        // @ts-ignore
        mobile.setValueInPage('hiddenItemDescription_Popup', '');
    };
    // @ts-ignore
    clientFunctions.setDoneItemDescription = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        var description = dataRecord.scriptParams.description
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        // @ts-ignore
        mobile.setPopupElementSourceData('doneItemDescriptionPopupText', description);
    };
    // @ts-ignore
    clientFunctions.clearDoneHiddenField = function () {
        // @ts-ignore
        mobile.setValueInPage('hiddenDoneItemDescription_Popup', '');
    };
    // @ts-ignore
    clientFunctions.setItemDisplayName = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        var displayName = dataRecord.scriptParams.displayName
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        // @ts-ignore
        mobile.setPopupElementSourceData('itemDisplayNamePopupText', displayName);
    };
    // @ts-ignore
    clientFunctions.clearHiddenDisplayNameField = function () {
        // @ts-ignore
        mobile.setValueInPage('hiddenItemDisplayName_Popup', '');
    };
    // @ts-ignore
    clientFunctions.clearDoneHiddenDisplayNameField = function () {
        // @ts-ignore
        mobile.setValueInPage('hiddenDoneItemDisplayName_Popup', '');
    };
    return clientFunctions;
})();
