/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log', 'N/runtime'], function(log, runtime) {
    function getDefaultValue(roleId) {
        switch (Number(roleId)) {
            case 1387:
                return 'KPPI Lima Warehouse : Raw Materials - L';

            case 1410:
                return 'KPPI Laguna Warehouse : Raw Materials - M';

            default:
                return '';
        }
    }

    function doGet() {
        var currentUser = runtime.getCurrentUser();
        var roleId = currentUser.role;

        log.debug({
            title: 'Current Role ID',
            details: roleId
        });

        var defaultValue = getDefaultValue(roleId);

        log.debug({
            title: 'Default Value',
            details: defaultValue
        });

        return defaultValue;
    }

    return {
        get: doGet
    };
});