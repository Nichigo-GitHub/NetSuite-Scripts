/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log'], function(log) {
    function getDefaultValue(warehouseLocation) {
        var defaultValue = '';
        // Set default value based on warehouse location
        if (warehouseLocation === 'KPVN HANOI : HANOI TRADING - RM WH') {
            defaultValue = 'H-Trading RM Staging';
        } else if (warehouseLocation === 'KPVN HANOI : HANOI BRANCH - RM WH') {
            defaultValue = 'H-Branch RM Staging';
        } else if (warehouseLocation === 'KPVN HANOI : HANOI EPE - RM WH') {
            defaultValue = 'H-EPE RM Staging';
        } else if (warehouseLocation === 'KPVN AMATA : AMATA TRADING - Main Location : AMATA TRADING - RM WH') {
            defaultValue = 'A-Trading RM Staging';
        } else if (warehouseLocation === 'KPVN AMATA : AMATA BRANCH - Main Location : AMATA BRANCH - RM WH') {
            defaultValue = 'A-Branch RM Staging';
        } else if (warehouseLocation === 'KPVN AMATA : AMATA EPE - Main Location : AMATA EPE - RM WH') {
            defaultValue = 'A-EPE RM Staging';
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