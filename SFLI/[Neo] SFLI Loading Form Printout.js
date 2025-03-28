/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/format', 'N/search'], function (record, runtime, format, search) {
    const sublistId = 'recmachcustrecord848';

    // Entry point for the Suitelet script
    function onRequest(context) {
        var request = context.request,
            response = context.response;

        // Load the loading form record
        var loadingFormDetails = record.load({
            type: 'customrecord_sfli_loading_form_dtls',
            id: request.parameters.internalId,
            isDynamic: true,
        });

        var header = loadingFormDetails.getValue({
            fieldId: 'custrecord_loading_form_num'
        });

        var sublistLength = loadingFormDetails.getLineCount({
            sublistId: sublistId,
        });

        // Retrieve HTML template from Suitelet parameters
        var html = runtime.getCurrentScript().getParameter({
            name: 'custscript_sfli_loading_form_html'
        });

        var sublistData = [];

        // Extract data
        for (var i = 0; i < sublistLength; i++) {
            sublistData.push({
                customer: loadingFormDetails.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord849',
                    line: i
                }),
                item: loadingFormDetails.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord850',
                    line: i
                }),
                desc: loadingFormDetails.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord851',
                    line: i
                }),
                SOnum: loadingFormDetails.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord852',
                    line: i
                }),
                qty: loadingFormDetails.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord853',
                    line: i
                })
            });
        }

        // Sort by customer name (custrecord849) alphabetically (A to Z)
        sublistData.sort(function (a, b) {
            return a.customer.localeCompare(b.customer);
        });

        // Generate sorted table rows
        var tableRow = '';
        sublistData.forEach(function (row) {
            tableRow += add1row(row.item, row.desc, row.SOnum, row.qty, row.customer);
        });

        // Replace the placeholder in the template with dynamic item data
        html = html.replace('{header}', header);
        html = html.replace('{body}', tableRow);

        // Set the content type and send the HTML response
        response.write(html);
        response.setHeader({
            name: 'Content-Type',
            value: 'text/html',
        });
    }

    function add1row(item, desc, SOnum, qty, customer) {
        var custQrCodeURL = "https://quickchart.io/qr?text=" + encodeURIComponent(customer) + "&size=75";
        var itemQrCodeURL = "https://quickchart.io/qr?text=" + encodeURIComponent(customer) + "&size=75";
        var soNumCodeURL = "https://quickchart.io/qr?text=" + encodeURIComponent(customer) + "&size=75";

        return row1 = "<td class='padding borderLeft borderBottom borderRight' align='center' style='text-align: center; font-size: 12px;'>" +
            "<table style='width: 100%; border-collapse: collapse;'><tr>" +
            "<td style='text-align: left; font-size: 12px;'>" + customer + "</td>" +
            "<td style='text-align: right;'><img src='" + custQrCodeURL + "' style='height: 75px; width: 75px;' />" +
            "</tr></table>" +
            "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 12px;'>" +
            "<table style='width: 100%; border-collapse: collapse;'><tr>" +
            "<td style='text-align: left; font-size: 12px;'>" + item + "</td>" +
            "<td style='text-align: right;'><img src='" + itemQrCodeURL + "' style='height: 75px; width: 75px;' />" +
            "</tr></table>" +
            "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 12px;'>" + desc + '</td>' +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 12px; width: 120px;'>" +
            "<table style='width: 100%; border-collapse: collapse;'><tr>" +
            "<td style='text-align: left; font-size: 12px;'>" + SOnum + "</td>" +
            "<td style='text-align: right;'><img src='" + soNumCodeURL + "' style='height: 75px; width: 75px;' />" +
            "</tr></table>" +
            "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 12px;'>" + qty + '</td>' +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 12px;'></td>" +
            "</tr>";
    }

    // Return the onRequest function as the Suitelet's handler
    return {
        onRequest: onRequest,
    };
});