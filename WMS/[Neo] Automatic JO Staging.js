/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log'], function(log) {
    function getDefaultValue(warehouseLocation, fromLocId) {
        var defaultValue = '';
        // Set default value based on warehouse location
         if (warehouseLocation === 'KPI Raw Materials') {
            defaultValue = 'KPI JO Staging Bin';
        }
        
        else if (warehouseLocation === "SFLI Warehouse : Raw Mat'ls") {
            defaultValue = 'Production RM';
        } else if (warehouseLocation === 'SFLI Production') {
            defaultValue = '';
        } 
        
        else if (warehouseLocation === 'KPPI Laguna Warehouse : Production - M' && fromLocId === 'KPPI Laguna Warehouse : Raw Materials - M') {
            defaultValue = 'PROD WIP';
        } else if (warehouseLocation === 'KPPI Laguna Warehouse : Production - M' && fromLocId === null) {
            defaultValue = 'PROD WIP';
        } else if (warehouseLocation === 'KPPI Laguna Warehouse : QA - M') {
            defaultValue = 'QA WIP';
        } else if (warehouseLocation === 'KPPI Laguna Warehouse : Overrun - M') {
            defaultValue = 'Overrun - M';
        } 
        
        else if (warehouseLocation === 'KPPI Lima Warehouse : Raw Materials - L') {
            defaultValue = 'RM JO Staging';
        } else if (warehouseLocation === 'KPPI Lima Warehouse : Production - L' && fromLocId === 'KPPI Lima Warehouse : Raw Materials - L') {
            defaultValue = 'WHSE - PROD L RM';
        } else if (warehouseLocation === 'KPPI Lima Warehouse : Production - L' && fromLocId === null) {
            defaultValue = 'WIP PRODUCTION';
        } else if (warehouseLocation === 'KPPI Lima Warehouse : QA - L') {
            defaultValue = 'WIP QA';
        } else if (warehouseLocation === 'KPPI Lima Warehouse : Overruns Quantity - L') {
            defaultValue = 'Overruns Quantity';
        }

        else if (warehouseLocation === 'KPPI Cebu Warehouse : Raw Materials - C') {
            defaultValue = 'KP Cebu JO Staging';
        } else if (warehouseLocation === 'KPPI FPIP Warehouse : Raw Materials - F') {
            defaultValue = 'KP FPIP JO Staging';
        } else if (warehouseLocation === 'North FG For Delivery : KPPI RM North Warehouse') {
            defaultValue = 'NFI JO Staging';
        } 

        return defaultValue;
    }

    function doGet(params) {
        // Log the value of params.warehouseLocationName
        log.error({
            title: 'params',
            details: params
        });

        var warehouseLocation = params.warehouseLocationName;
        var fromLocId = null;
        if (params.fromLocId) {
            fromLocId = params.fromLocId;
        }

        if (!warehouseLocation || warehouseLocation === 'KPPI Laguna Warehouse : Raw Materials - M') {
            warehouseLocation = params.warehouseLocationName_2;

            log.debug({
                title: 'Warehouse Location Name 2',
                details: warehouseLocation
            });
        }

        // Call the function to get the default value
        var defaultValue = getDefaultValue(warehouseLocation, fromLocId);

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