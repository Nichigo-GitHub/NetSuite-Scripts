/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget'], function (serverWidget) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'My Suitelet'
            });

            // Add fields, buttons, and other form components to the form
            // Customize the form based on your requirements

            // Add a button that triggers PDF generation
            form.addButton({
                id: 'custpage_generate_pdf',
                label: 'Generate PDF',
                functionName: 'generatePDF'
            });

            // Generate the HTML directly in the Suitelet
            var htmlContent =
                '<html>' +
                '<head>' +
                '<title>My PDF</title>' +
                '<style>' +
                '/* CSS styles for the PDF content */' +
                '</style>' +
                '</head>' +
                '<body>' +
                '<h1>PDF Content</h1>' +
                '<p>This is the content of my PDF.</p>' +
                '</body>' +
                '</html>';

            // Attach the HTML content as a file to the Suitelet response
            context.response.writeFile({
                file: new serverWidget.File({
                    name: 'my_pdf.html',
                    fileType: serverWidget.FileType.HTMLDOC,
                    contents: htmlContent
                })
            });

            // Display the form
            context.response.writePage(form);
        }
    }

    return {
        onRequest: onRequest
    };
});