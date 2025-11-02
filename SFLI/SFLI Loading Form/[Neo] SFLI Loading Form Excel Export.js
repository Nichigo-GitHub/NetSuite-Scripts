/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search'], function (record, search) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        var recordId = request.parameters.internalId;
        var sublistId = 'recmachcustrecord848';

        var customRecord = record.load({
            type: 'customrecord_sfli_loading_form_dtls',
            id: recordId
        });

        var sublistData = [];

        var sublistCount = customRecord.getLineCount({
            sublistId: sublistId
        });

        // Extract sublist data into an array
        for (var i = 0; i < sublistCount; i++) {
            sublistData.push({
                customer: customRecord.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord849',
                    line: i
                }) || '',
                item: customRecord.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord850',
                    line: i
                }) || '',
                desc: customRecord.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord851',
                    line: i
                }) || '',
                soNum: customRecord.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord852',
                    line: i
                }) || '',
                qty: customRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord853',
                    line: i
                }) || '0',
                balance: customRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord934',
                    line: i
                }) || '0'
            });
        }

        // Sort using ES5 function syntax
        sublistData.sort(function (a, b) {
            return a.customer.localeCompare(b.customer);
        });

        // Prepare CSV content
        var csvContent = 'Customer,Item,Description,SO Number,Quantity,Balance\n';
        for (var j = 0; j < sublistData.length; j++) {
            csvContent += '"' + sublistData[j].customer + '","' + sublistData[j].item + '","' + sublistData[j].desc + '","' + sublistData[j].soNum + '","' + sublistData[j].qty + '","' + sublistData[j].balance + '"\n';
        }

        // Extract relevant data from the loading form record
        var deliveryDate = customRecord.getValue({
            fieldId: 'custrecord_date_num'
        });

        if (!deliveryDate) return;

        var dateString = formatLongDate(deliveryDate);

        var fileName = "Loading Form - " + dateString + ".csv";

        response.setHeader({
            name: 'Content-Type',
            value: 'text/csv'
        });
        response.setHeader({
            name: 'Content-Disposition',
            value: 'attachment; filename="' + fileName + '"'
        });
        response.write(csvContent);
    }

    function formatLongDate(dateObj) {
        if (!(dateObj instanceof Date)) {
            dateObj = new Date(dateObj);
        }
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return {
        onRequest: onRequest
    };
});