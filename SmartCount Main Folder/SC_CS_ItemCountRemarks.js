/* enable-cache:true */
(function () {
    var clientFunctions = {};
    // @ts-ignore
    clientFunctions.populateRemarksField = function () {
        // @ts-ignore
        var dataRecord = mobile.getRecordFromState();
        var newRemarks = dataRecord.auxParams.itemCountRemarks;
        var oldRemarks = dataRecord.scriptParams.inProgressItemCountRemarks
            ? dataRecord.scriptParams.inProgressItemCountRemarks
            : dataRecord.scriptParams.itemCountCreateResponse.itemCountRemarks;
        if (newRemarks || newRemarks == '') {
            //@ts-ignore
            mobile.setPopupElementSourceData('itemCountRemarks', newRemarks);
        }
        else if (oldRemarks || oldRemarks == '') {
            //@ts-ignore
            mobile.setPopupElementSourceData('itemCountRemarks', oldRemarks);
        }
    };
    return clientFunctions;
})();
