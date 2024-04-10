/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log'], function(log) {
    function getDefaultValue(WarehouseLocation) {
        var defaultValue = '';
        // Set default value based on warehouse location
        if (WarehouseLocation === 'KPVN HANOI : HANOI BRANCH - PRO-DIV1') {
            defaultValue = 'H-Branch Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - PRO-DIV1') {
            defaultValue = 'H-EPE Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI TRADING - QA') {
            defaultValue = 'H-Trading QA WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA TRADING - Main Location : AMATA BRANCH - Prod') {
            defaultValue = 'A-Branch Prod WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA BRANCH - Main Location : AMATA EPE - Prod') {
            defaultValue = 'A-EPE Prod WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA EPE - Main Location : AMATA TRADING - QA') {
            defaultValue = 'A-Trading QA WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - QA') {
            defaultValue = 'H-EPE QA WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - FG WH') {
            defaultValue = 'H-EPE FG Staging';
        } 

        return defaultValue;
    }

    function doGet(params) {
        // Log the value of params.toWarehouseLocationId
        log.error({
            title: 'Warehouse Location Name',
            details: params.toWarehouseLocationId
        });

        var WarehouseLocation = params.toWarehouseLocationId;
        // Call the function to get the default value
        var defaultValue = getDefaultValue(WarehouseLocation);

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