define(["require", "exports", "../usecase/SC_ItemCountForApprovalUseCase", "../../common/constants/SC_Constants"], function (require, exports, SC_ItemCountForApprovalUseCase_1, SC_Constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSuiteletPage = void 0;
    function getSuiteletPage(location, item, user, pageId) {
        var clientSideUseCase = new SC_ItemCountForApprovalUseCase_1.SC_ItemCountForApprovalUseCase();
        var scriptId = SC_Constants_1.ItemCountsForPendingApproval.ScriptId;
        var deploymentId = SC_Constants_1.ItemCountsForPendingApproval.DeploymentId;
        var locationCondition = location ? "&location=" + location : SC_Constants_1.Common.EmptyString;
        var itemCondition = item ? "&item=" + item : SC_Constants_1.Common.EmptyString;
        var userCondition = user ? "&user=" + user : SC_Constants_1.Common.EmptyString;
        var pageIdCondition = pageId ? "&pageId=" + pageId : SC_Constants_1.Common.EmptyString;
        var suiteletUrl = "" + clientSideUseCase.getUrlFromScript(scriptId, deploymentId) + locationCondition + itemCondition + userCondition + pageIdCondition;
        window.location.assign(suiteletUrl);
    }
    exports.getSuiteletPage = getSuiteletPage;
});
