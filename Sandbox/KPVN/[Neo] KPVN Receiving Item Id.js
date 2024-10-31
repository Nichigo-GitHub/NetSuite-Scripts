/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */

define(['N/log'], function (log) {
    function getItemId(QRdata) {
        try {
            // Log the raw QR data for debugging
            log.debug({
                title: 'Raw QR Data',
                details: QRdata
            });

            // Parse the scanned JSON or input from the QR Data
            var parsedData = JSON.parse(QRdata);

            // Log the parsed data for debugging
            log.debug({
                title: 'Parsed QR Data',
                details: JSON.stringify(parsedData)
            });

            // Extract Item ID from the JSON data
            var itemId = parsedData.itemId;

            // Log the extracted Item ID for debugging
            log.debug({
                title: 'Extracted Item ID',
                details: itemId
            });

            return itemId;
        } catch (e) {
            // Log the error if parsing or extracting fails
            log.error({
                title: 'Error in getItemId',
                details: e.message
            });
            throw e; // Re-throw the error to ensure it's handled by the caller
        }
    }

    function doGet(params) {
        try {
            // Log the incoming parameters for debugging
            log.debug({
                title: 'Incoming Params',
                details: JSON.stringify(params)
            });

            var QRdata = params.QRdata;

            // Call the function to get the item ID
            var itemId = getItemId(QRdata);

            // Log the result before returning it
            log.debug({
                title: 'Returning Item ID',
                details: itemId
            });

            return itemId;
        } catch (e) {
            // Log the error if there's an issue in doGet
            log.error({
                title: 'Error in doGet',
                details: e.message
            });
            throw e; // Re-throw the error so it's handled at a higher level
        }
    }

    return {
        get: doGet
    };
});