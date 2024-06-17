/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log'], function (log) {
    function getDefaultValue(WarehouseLocation) {
        var defaultValue = '';
        // Set default value based on warehouse location
        if (WarehouseLocation === 'KPVN HANOI : HANOI BRANCH - PRO-DIV1') {
            defaultValue = 'H-Branch Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI BRANCH - PRO-DIV2') {
            defaultValue = 'H-Branch Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI BRANCH - PRO-DIV3') {
            defaultValue = 'H-Branch Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI BRANCH - QA') {
            defaultValue = 'H-Branch QA WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI BRANCH - FG WH') {
            defaultValue = 'H-Branch FG Staging';
        }
        
        else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - PRO-DIV1') {
            defaultValue = 'H-EPE Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - PRO-DIV2') {
            defaultValue = 'H-EPE Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - PRO-DIV3') {
            defaultValue = 'H-EPE Prod WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - QA') {
            defaultValue = 'H-EPE QA WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI EPE - FG WH') {
            defaultValue = 'H-EPE FG Staging';
        } 
        
        else if (WarehouseLocation === 'KPVN HANOI : HANOI TRADING - QA') {
            defaultValue = 'H-Trading QA WIP';
        } else if (WarehouseLocation === 'KPVN HANOI : HANOI TRADING - FG WH') {
            defaultValue = 'H-Trading FG Staging';
        } 
        
        else if (WarehouseLocation === 'KPVN AMATA : AMATA BRANCH - Main Location : AMATA BRANCH - Prod') {
            defaultValue = 'A-Branch Prod WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA BRANCH - Main Location : AMATA BRANCH - QA') {
            defaultValue = 'A-Branch QA WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA BRANCH - Main Location : AMATA BRANCH - FG WH') {
            defaultValue = 'A-Branch FG Staging';
        }
        
        else if (WarehouseLocation === 'KPVN AMATA : AMATA EPE - Main Location : AMATA EPE - Prod') {
            defaultValue = 'A-EPE Prod WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA EPE - Main Location : AMATA EPE - QA') {
            defaultValue = 'A-EPE QA WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA EPE - Main Location : AMATA EPE - FG WH') {
            defaultValue = 'A-EPE FG Staging';
        } 
        
        else if (WarehouseLocation === 'KPVN AMATA : AMATA TRADING - Main Location : AMATA TRADING - QA') {
            defaultValue = 'A-Trading QA WIP';
        } else if (WarehouseLocation === 'KPVN AMATA : AMATA TRADING - Main Location : AMATA TRADING - FG WH') {
            defaultValue = 'A-Trading FG Staging';
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