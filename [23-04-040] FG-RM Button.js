/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/render'], function (serverWidget, render) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Generate PDF Template'
            });

            // Add a custom button to the form
            var customButton = form.addButton({
                id: 'custpage_custom_button',
                label: 'Generate PDF',
                functionName: 'handleCustomButton'
            });

            context.response.writePage(form);
        } else {
            // Handle the button click and generate the PDF template
            // Perform your logic here to generate the PDF template using N/render module

            var templateFileId = 123; // Replace with the actual template file ID
            var renderedPdf = render.renderPdf({
                templateId: templateFileId
            });

            // Output the PDF to the response
            context.response.writeFile({
                file: renderedPdf,
                isInline: true
            });
        }
    }

    return {
        onRequest: onRequest,
        handleCustomButton: handleCustomButton
    };
});