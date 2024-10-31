/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/runtime"], function (runtime) {
    // Entry point for the Suitelet script
    function onRequest(context) {
        var response = context.response;

        // Retrieve HTML template from Suitelet parameters
        var html = runtime.getCurrentScript().getParameter({
            name: 'custscript_kppi_collection_receipt_html'
        });

        // Set the content type and send the HTML response
        response.write(html);
        response.setHeader({
            name: "Content-Type",
            value: "text/html",
        });
    }

    // Return the onRequest function as the Suitelet's handler
    return {
        onRequest: onRequest,
    };
});