/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log'], function(log) {
    function getDefaultValue(warehouseLocation) {
        var defaultValue = '';
        // Set default value based on warehouse location
        if (warehouseLocation === 'KPPI Lima Warehouse : Raw Materials - L') {
            defaultValue = 'LIMA Staging RM';
        } else if (warehouseLocation === 'KPPI Cebu Warehouse : Raw Materials - C') {
            defaultValue = 'KP Cebu RM Staging';
        } else if (warehouseLocation === 'KPPI FPIP Warehouse : Raw Materials - F') {
            defaultValue = 'KP FPIP RM Staging';
        }

        return defaultValue;
    }

    function doGet(params) {
        // Log the value of params.warehouseLocationName
        log.error({
            title: 'Warehouse Location Name',
            details: params.warehouseLocationName
        });

        var warehouseLocation = params.warehouseLocationName;
        // Call the function to get the default value
        var defaultValue = getDefaultValue(warehouseLocation);

        // Log the value of Default Value
        log.error({
            title: 'Default Value',
            details: defaultValue
        });

        return defaultValue;
    }

    return {
        get: doGet
    };
});