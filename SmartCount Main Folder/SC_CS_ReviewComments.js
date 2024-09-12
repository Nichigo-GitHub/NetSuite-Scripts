/* enable-cache:true */
(function () {
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.setReviewComments = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        var comments = dataRecord.scriptParams.comments
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        // @ts-ignore
        mobile.setPopupElementSourceData('ReviewCommentsPopupText', comments);
    };
    // @ts-ignore
    clientFunctions.clearHiddenField = function () {
        // @ts-ignore
        mobile.setValueInPage('hiddenReviewComments_Popup', '');
    };
    return clientFunctions;
})();
