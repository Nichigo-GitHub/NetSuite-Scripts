/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/format', 'N/runtime'], function (render, record, file, search, format, runtime) {

    function onRequest(context) {
        var recId = context.request.parameters.recordId;
        var rec = record.load({
            type: 'vendorreturnauthorization',
            id: parseInt(recId, 10)
        });
        var tranid = rec.getValue({ fieldId: 'tranid' });
        var vendor = rec.getValue({ fieldId: 'entity' });
        var supplier = rec.getText({ fieldId: 'entity' });

        // Get contact (first contact for vendor, if needed)
        var contactId = '';

        var tranid = rec.getValue({
            fieldId: 'tranid'
        });
        var vendor = rec.getValue({
            fieldId: 'entity'
        });
        var supplier = rec.getText({
            fieldId: 'entity'
        });
        var currency = rec.getText({
            fieldId: 'currency'
        });
        var poNumber = rec.getText({
            fieldId: 'createdfrom'
        });
        var jobOrder = rec.getText({
            fieldId: 'custbody23'
        });
        var location = rec.getValue({
            fieldId: 'location'
        });
        var qa = '';
        var admin = '';
        var warehouse = '';
        var purchasing = '';

        if (location == 825) {
            qa = 'Mr. ANGELO PLATON /<br />C. FLORES';
            admin = 'Ms. MIRASOL TALATALA';
            warehouse = 'Mr. EDUARD RAMOS';
            purchasingHeader = '';
            purchasing = '';
        } else {
            qa = 'Mr. GLENN DONALD MAGSINO /<br />Mr. RODERICK RAMOS';
            admin = 'Ms. JOSSA SALAZAR';
            warehouse = 'Ms. STELLA ORTEGA /<br />Ms. SUZETTE DIMAYUGA';
            purchasingHeader = 'PURCHASING';
            purchasing = 'Ms. SALVE OSI';
        }
        // Format today's date for Issued Date
        var issuedDate = format.format({
            value: new Date(),
            type: format.Type.DATE
        });

        var contactSearch = search.create({
            type: search.Type.CONTACT,
            filters: [
                ['company', 'is', vendor]
            ],
            columns: [
                'entityid'
            ]
        });

        var results = contactSearch.run().getRange({
            start: 0,
            end: 1
        });

        if (results.length > 0) {
            var contactId = results[0].getValue('entityid');
        }

        // Helper function to format date as D/M/YYYY
        function formatDateDMY(dateObj) {
            if (!dateObj) return '';
            var d = new Date(dateObj);
            var day = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            return day + '/' + month + '/' + year;
        }

        var tableRows = "";
        var totalLotSize = 0;
        var totalRejectQty = 0;
        var totalAmount = 0;
        var rejectsPerReason = {};

        var rnNum = rec.getValue({ fieldId: 'custbody39' }) || '';
        var totalRejects = rec.getValue({ fieldId: 'custbody321' }) || '';
        var preparedBy = rec.getText('custbody103') || userObj.name;

        var lineCount = rec.getLineCount({ sublistId: 'item' });
        for (var i = 0; i < lineCount; i++) {
            var itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var itemDescription = rec.getSublistText({ sublistId: 'item', fieldId: 'description', line: i }) || '';
            var itemName = rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) || '';
            var quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || '';
            var rate = rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }) || '';
            var amount = rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) || '';
            var drNo = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol6', line: i }) || '';
            var reasonForReject = rec.getSublistText({ sublistId: 'item', fieldId: 'custcol207', line: i }) || '';
            var lotSize = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol70', line: i }) || '';
            var customer = rec.getText({ fieldId: 'custbody41' }) || '';

            // Convert quantity to positive integer
            var rejectQty = Math.abs(parseInt(quantity, 10)) || 0;
            var lotSizeNum = parseInt(lotSize, 10) || 0;

            // Calculate reject %
            var rejectPercent = '';
            if (lotSizeNum > 0) {
                rejectPercent = ((rejectQty / lotSizeNum) * 100).toFixed(2) + '%';
            }

            tableRows += "<tr>" +
                "<td class='border' align='center' valign='middle' width='70'>" + (itemDescription || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (customer || '') + "</td>" +
                "<td class='border' align='center' valign='middle' width='60'>" + (itemName || '') + "</td>" +
                "<td class='border' align='center' valign='middle' width='35'>" + (drNo || '') + "</td>" +
                "<td class='border' align='center' valign='middle'></td>" +
                "<td class='border' align='center' valign='middle'></td>" +
                "<td class='border' align='center' valign='middle'>" + (lotSize || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + rejectQty + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (rate || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (amount || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + rejectPercent + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (rnNum || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (jobOrder || '') + "</td>" +
                "<td class='border' align='center' valign='middle' width='60'>" + (reasonForReject || '') + "</td>" +
                "</tr>";

            // Add to totals
            totalLotSize += lotSizeNum;
            totalRejectQty += rejectQty;
            totalAmount += parseFloat(amount) || 0;

            // Aggregate by reason
            var reasonKey = reasonForReject || 'No Reason';
            if (!rejectsPerReason[reasonKey]) {
                rejectsPerReason[reasonKey] = 0;
            }
            rejectsPerReason[reasonKey] += rejectQty;
        }

        // Calculate total reject percent
        var totalRejectPercent = '';
        if (totalLotSize > 0) {
            totalRejectPercent = ((totalRejectQty / totalLotSize) * 100).toFixed(2) + '%';
        }

        // Collect all unique reasons
        var reasons = Object.keys(rejectsPerReason);

        // Build the dynamic table header
        var dynamicTableHeader = "<tr style='background-color:#D3D3D3;'>" +
            "<td class='border' align='center' valign='middle'><b>Model / Description</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Customer</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Part Name</b></td>" +
            "<td class='border' align='center' valign='middle'><b>DR No.</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Date<br />Received</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Date<br />Inspected</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Lot<br />Size</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Reject<br />Qty</b></td>" +
            "<td class='border' align='center' valign='middle'><b>U/P<br />(USD)</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Amount<br />(USD)</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Reject %</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Rejection<br />Notice No.</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Job Order<br />Number</b></td>";

        log.debug({
            title: 'Dynamically Generated Reasons',
            details: reasons 
        })
        // Add dynamic reason columns with rotated headers
        for (var i = 0; i < reasons.length; i++) {
            // Split each character with <br> for vertical stacking
            var verticalReason = reasons[i].split('').join('<br />');
            dynamicTableHeader += "<td class='border' align='center' valign='middle' style='height:80px;'><b>" + verticalReason + "</b></td>";
        }
        dynamicTableHeader += "</tr>";

        // Build the dynamic table rows
        var dynamicTableRows = "";
        for (var i = 0; i < lineCount; i++) {
            var itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var itemDescription = rec.getSublistText({ sublistId: 'item', fieldId: 'description', line: i }) || '';
            var itemName = rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) || '';
            var quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || '';
            var rate = rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }) || '';
            var amount = rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) || '';
            var drNo = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol6', line: i }) || '';
            var reasonForReject = rec.getSublistText({ sublistId: 'item', fieldId: 'custcol207', line: i }) || '';
            var lotSize = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol70', line: i }) || '';
            var customer = rec.getText({ fieldId: 'custbody41' }) || '';

            var rejectQty = Math.abs(parseInt(quantity, 10)) || 0;
            var lotSizeNum = parseInt(lotSize, 10) || 0;
            var rejectPercent = '';
            if (lotSizeNum > 0) {
                rejectPercent = ((rejectQty / lotSizeNum) * 100).toFixed(2) + '%';
            }

            dynamicTableRows += "<tr>" +
                "<td class='border' align='center' valign='middle' width='70'>" + (itemDescription || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (customer || '') + "</td>" +
                "<td class='border' align='center' valign='middle' width='60'>" + (itemName || '') + "</td>" +
                "<td class='border' align='center' valign='middle' width='35'>" + (drNo || '') + "</td>" +
                "<td class='border' align='center' valign='middle'></td>" +
                "<td class='border' align='center' valign='middle'></td>" +
                "<td class='border' align='center' valign='middle'>" + (lotSize || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + rejectQty + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (rate || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (amount || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + rejectPercent + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (rnNum || '') + "</td>" +
                "<td class='border' align='center' valign='middle'>" + (jobOrder || '') + "</td>";

            // For each reason, put the reject quantity if it matches, else blank
            for (var j = 0; j < reasons.length; j++) {
                dynamicTableRows += "<td class='border' align='center'>" + (reasonForReject === reasons[j] ? rejectQty : "") + "</td>";
            }
            dynamicTableRows += "</tr>";
        }

        // Optionally, add a totals row for each reason
        var totalsRow = "<tr style='font-weight:bold; background-color:#D3D3D3;'>" +
            "<td class='border' align='center' colspan='6'>TOTAL</td>" +
            "<td class='border' align='center'>" + totalLotSize + "</td>" +
            "<td class='border' align='center'>" + totalRejectQty + "</td>" +
            "<td class='border' align='center'></td>" +
            "<td class='border' align='center'>" + totalAmount.toFixed(2) + "</td>" +
            "<td class='border' align='center'>" + totalRejectPercent + "</td>" +
            "<td class='border' align='center'></td>" +
            "<td class='border' align='center'></td>";

        // Add totals for each reason
        for (var i = 0; i < reasons.length; i++) {
            totalsRow += "<td class='border' align='center'>" + (rejectsPerReason[reasons[i]] || 0) + "</td>";
        }
        totalsRow += "</tr>";

        // In your xml string, replace the old tableRows and reasonTableRows with the new dynamic table
        var xml = "<pdf>" +
            "<pdfset>" +
            "<pagesize size='A4' orientation='landscape'/>" +
            "<margins left='10mm' right='10mm' top='10mm' bottom='10mm'/>" +
            "</pdfset>" +
            "<html>" +
            "<head>" +
            "<style type='text/css'>" +
            "* { border-spacing: 0; font-family: Sans-serif; font-size: 8px; margin: 0; letter-spacing: normal; text-align: left; }" +
            "h2 { font-size: 16px; letter-spacing: normal; text-align: left; }" +
            "h1 { font-size: 18px; letter-spacing: normal; text-align: center; }" +
            "table { border-collapse: collapse; }" +
            ".table_unx { table-layout: fixed; width: 100%; }" +
            ".td_unx { white-space: forced; }" +
            ".border { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; border-bottom: .5px solid; }" +
            ".sideBorder { border-left: .5px solid; border-right: .5px solid; }" +
            ".topSideBorder { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; }" +
            ".bottomSideBorder { border-left: .5px solid double; border-right: .5px solid; border-bottom: .5px solid; }" +
            ".column { height: 30px; }" +
            ".row { display: flex; }" +
            ".width { width: 277mm; }" +
            ".img { float: left; margin-bottom: 30px; }" +
            ".floatRight { padding-top: 20px; float: right; }" +
            ".bold { font-weight: bold; }" +
            ".paddingLeft { padding-left: 60px; }" +
            ".paddingRight { padding-right: 30px; }" +
            ".paddingBottom { padding-bottom: 10px; }" +
            ".paddingSFLIadd { padding-top: 10px; margin-left: 350px; position: absolute; }" +
            ".borderLeft { border-left: .5px solid; }" +
            ".borderRight { border-right: .5px solid; }" +
            ".borderTop { border-top: .5px solid; }" +
            ".borderBottom { border-bottom: .5px solid; }" +
            ".tableMarginTop3 { height: auto; }" +
            ".tableMarginTop2 { margin-top: 2px; height: auto; }" +
            ".tableMarginTop { margin-top: 8px; height: auto; }" +
            ".tableColor { background-color: black; color: #ffffff; }" +
            ".black-bg { background-color: black; }" +
            ".padding { padding-top: 2px; padding-bottom: 2px; }" +
            ".paddingLR { padding-left: 2px; padding-right: 2px; }" +
            ".grey { background-color: #C0C0C0; }" +
            "</style>" +
            "</head>" +
            "<body width='277mm' class='width'>" +
            "<table style='width:100%; margin-bottom:10px;'>" +
            "<tr>" +
            "<td height='20px' style='vertical-align:top;'>" +
            "<img src='https://3389427.app.netsuite.com/core/media/media.nl?id=1138&amp;c=3389427&amp;h=ueq3mWB0n4_ATVXT-t97HWbnG8O8z1kK_E39_Bd7lW3DO6Mb' style='max-width:10px; max-height:4px;' />" +
            "</td>" +
            "<td style='vertical-align:middle;' width='600' align='left'>" +
            "<h2 align='left'>KANEPACKAGE PHILIPPINE, INC.</h2>" +
            "</td>" +
            "</tr>" +
            "</table>" +
            "<table class='tableMarginTop' style='font-size: 12px; width:100%;'>" +
            "<tr>" +
            "<td width='100%'>" +
            "<h1 align='center'>NON CONFORMANCE REPORT</h1></td>" +
            "</tr>" +
            "</table>" +
            "<table class='tableMarginTop' style='width:100%;'>" +
            "<tr>" +
            "<td width='70'><b>Supplier:</b></td>" +
            "<td width='200' style='text-decoration: underline;'>" + supplier + "</td>" +
            "<td width='70'>PO #:</td>" +
            "<td width='200' style='text-decoration: underline;'>" + poNumber + "</td>" +
            "<td width='70'><b>Nature:</b></td>" +
            "<td width='35' align='center' class='black-bg'>_</td>" +
            "<td width='90' >Information</td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>Critical</td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'><b>Attention:</b></td>" +
            "<td width='200' style='text-decoration: underline;'>" + contactId + "</td>" +
            "<td width='70'>Currency: </td>" +
            "<td width='200' style='text-decoration: underline;'>" + currency + "</td>" +
            "<td width='70'></td>" +
            "<td width='35'></td>" +
            "<td width='10'></td>" +
            "<td width='35'></td>" +
            "<td width='110'></td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'>Control No.: </td>" +
            "<td width='200' align='left' style='text-decoration: underline;'>" + tranid + "</td>" +
            "<td width='70'>Issued Date: </td>" +
            "<td width='200' style='text-decoration: underline;'>" + issuedDate + "</td>" +
            "<td width='70'><b>Disposition:</b></td>" +
            "<td width='35' align='center' class='black-bg'>_</td>" +
            "<td width='10'>Backload</td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>Under Evaluation</td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'></td>" +
            "<td width='200'></td>" +
            "<td width='70'>Prepared By: </td>" +
            "<td width='200' style='text-decoration: underline;'>" + preparedBy + "</td>" +
            "<td width='70'></td>" +
            "<td width='35'></td>" +
            "<td width='10'></td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>For Replacement</td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'></td>" +
            "<td width='200'></td>" +
            "<td width='70'></td>" +
            "<td width='200' align='left'>QA Staff in Charge</td>" +
            "<td width='70'></td>" +
            "<td width='35' align='center' class='border'></td>" +
            "<td width='10'>For Verification</td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>Reject for Disposal</td>" +
            "</tr>" +
            "</table>" +
            "<table class='border tableMarginTop' style='width:100%;'>" +
            dynamicTableHeader +
            dynamicTableRows +
            totalsRow +
            "</table>" +
            "<table class='tableMarginTop' style='width:100%; page-break-inside: avoid;'>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle' style='background-color:#D3D3D3;'><b>Department</b></td>" +
            "<td class='border' align='center' valign='middle' style='background-color:#D3D3D3;'><b>In-Charge</b></td>" +
            "<td class='border' align='center' valign='middle' width='80' style='background-color:#D3D3D3;'><b>Signature</b></td>" +
            "<td width='100'></td>" +
            "<td width='50'><b>ACKNOWLEDGEMENT OF SUPPLIER:</b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>QA</td>" +
            "<td class='border' align='center' valign='middle'>" + qa + "</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' valign='bottom'><b>RECEIVED BY: </b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>ADMIN</td>" +
            "<td class='border' align='center' valign='middle'>" + admin + "</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' align='center' colspan='2' valign='top'><b>______________________________<br />SIGNATURE OVER PRINTED NAME</b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>WAREHOUSE</td>" +
            "<td class='border' align='center' valign='middle'>" + warehouse + "</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' valign='middle'><b>SUPPLIER'S NAME: __________________________</b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>" + purchasingHeader + "</td>" +
            "<td class='border' align='center' valign='middle'>" + purchasing + "</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' valign='middle'><b>DATE RECEIVED: ____________________________</b></td>" +
            "</tr>" +
            "</table>" +
            "</body>" +
            "</html>" +
            "</pdf>";

        var pdfFile = render.xmlToPdf({
            xmlString: xml
        });
        context.response.writeFile(pdfFile, true);
    }

    return {
        onRequest: onRequest
    };
});