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
        var tranid = rec.getValue({
            fieldId: 'tranid'
        });
        var vendor = rec.getValue({
            fieldId: 'entity'
        });
        var supplier = rec.getText({
            fieldId: 'entity'
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

        // Create a search for vendorreturnauthorization where subsidiary is 18 and date is within April 2025
        var mySearch = search.create({
            type: 'transaction',
            filters: [
                ['type', 'anyof', 'VendAuth'], // 'VendAuth' is the internal id for vendor return authorization
                'AND',
                ['subsidiary', 'anyof', 18],
                'AND',
                ['tranid', 'anyof', tranid],
                'AND',
                ['location', 'anyof', 792],
                'AND',
                ['createdfrom.type', 'anyof', 'PurchOrd'],
                'AND',
                ['entity', 'anyof', vendor],
            ],
            columns: [
                search.createColumn({ name: 'mainline' }),
                search.createColumn({ name: 'createdfrom' }),
                search.createColumn({ name: 'entity' }),
                search.createColumn({ name: 'trandate', sort: search.Sort.ASC }), // sort by trandate ascending
                search.createColumn({ name: 'status' }),
                search.createColumn({ name: 'item' }),
                search.createColumn({ name: 'custbody41' }),
                search.createColumn({ name: 'quantity' }),
                search.createColumn({ name: 'rate' }),
                search.createColumn({ name: 'amount' }),
                search.createColumn({ name: 'custcol6' }),
                search.createColumn({ name: 'custbody23' }),
                search.createColumn({ name: 'custbody39' }),
                search.createColumn({ name: 'custcol207' }),
                search.createColumn({ name: 'custcol70' }),
                search.createColumn({ name: 'custbody321' })
            ]
        });

        var searchResults = [];
        mySearch.run().each(function (result) {
            searchResults.push(result);
            return true;
        });

        // Build a map of item internalid -> description
        var itemDescMap = {};
        var itemIds = [];
        for (var i = 0; i < searchResults.length; i++) {
            var itemId = searchResults[i].getValue({
                name: 'item'
            });
            if (itemId && itemIds.indexOf(itemId) === -1) {
                itemIds.push(itemId);
            }
        }
        if (itemIds.length > 0) {
            var itemSearch = search.create({
                type: search.Type.ITEM,
                filters: [
                    ['internalid', 'anyof'].concat(itemIds)
                ],
                columns: [
                    'internalid',
                    'salesdescription'
                ]
            });
            itemSearch.run().each(function (result) {
                var id = result.getValue({
                    name: 'internalid'
                });
                var desc = result.getValue({
                    name: 'salesdescription'
                }) || '';
                itemDescMap[id] = desc;
                return true;
            });
        }

        var tableRows = "";
        var mainlineAmount = '';
        var mainlineCreatedFrom = '';
        var totalRejects = '';
        // Helper function to format date as D/M/YYYY
        function formatDateDMY(dateObj) {
            if (!dateObj) return '';
            var d = new Date(dateObj);
            var day = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            return day + '/' + month + '/' + year;
        }

        // Totals initialization
        var totalLotSize = 0;
        var totalRejectQty = 0;
        var totalAmount = 0;

        // Initialize an object to hold totals per reason
        var rejectsPerReason = {};

        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];
            var isMainline = result.getValue({
                name: 'mainline'
            });
            if (isMainline == "*") {
                mainlineAmount = result.getValue({
                    name: 'amount'
                }) || '';
                mainlineCreatedFrom = result.getValue({
                    name: 'createdfrom'
                }) || '';
                rnNum = result.getValue({
                    name: 'custbody39'
                }) || '';
                totalRejects = result.getValue({
                    name: 'custbody321'
                }) || '';
                continue; // skip mainline row for tableRows
            }
            var trandate = result.getValue({
                name: 'trandate'
            }) || '';
            var customer = result.getText({
                name: 'custbody41'
            }) || '';
            if (customer && customer.indexOf('&') !== -1) {
                customer = customer.replace(/&/g, '&amp;');
            }
            var itemName = result.getText({
                name: 'item'
            }) || '';
            if (itemName && itemName.indexOf('&') !== -1) {
                itemName = itemName.replace(/&/g, '&amp;');
            }
            var itemId = result.getValue({
                name: 'item'
            });
            var itemDescription = itemDescMap[itemId] || '';
            if (itemDescription && itemDescription.indexOf('&') !== -1) {
                itemDescription = itemDescription.replace(/&/g, '&amp;');
            }
            var quantity = result.getValue({
                name: 'quantity'
            }) || '';
            var rate = result.getValue({
                name: 'rate'
            }) || '';
            var drNo = result.getValue({
                name: 'custcol6'
            }) || '';
            var jobOrder = result.getValue({
                name: 'custbody23'
            }) || '';
            var reasonForReject = result.getText({
                name: 'custcol207'
            }) || '';
            var lotSize = result.getValue({
                name: 'custcol70'
            }) || '';

            // Convert quantity to positive integer
            var rejectQty = Math.abs(parseInt(quantity, 10)) || 0;
            var lotSizeNum = parseInt(lotSize, 10) || 0;

            // Calculate reject %
            var rejectPercent = '';
            if (lotSizeNum > 0) {
                rejectPercent = ((rejectQty / lotSizeNum) * 100).toFixed(2) + '%';
            }

            // Load related Purchase Order record to get additional information
            var poTrandate = '';
            if (mainlineCreatedFrom) {
                try {
                    var poRec = record.load({
                        type: record.Type.PURCHASE_ORDER,
                        id: mainlineCreatedFrom
                    });
                    poTrandate = poRec.getValue({
                        fieldId: 'trandate'
                    });
                } catch (e) {
                    log.error('Error loading PO for trandate', e);
                }
            }
            var formattedPoTrandate = formatDateDMY(poTrandate);

            tableRows += "<tr>" +
                "<td class='border' align='center' valign='middle' width='70'>" + (itemDescription || '') + "</td>" + // Model/Item
                "<td class='border' align='center' valign='middle'>" + (customer || '') + "</td>" + // Customer
                "<td class='border' align='center' valign='middle' width='60'>" + (itemName || '') + "</td>" + // Part Name (not in search)
                "<td class='border' align='center' valign='middle' width='35'>" + (drNo || '') + "</td>" + // DR No.
                "<td class='border' align='center' valign='middle'>" + (formattedPoTrandate || '') + "</td>" + // Date Received
                "<td class='border' align='center' valign='middle'>" + (trandate || '') + "</td>" + // Date Inspected
                "<td class='border' align='center' valign='middle'>" + (lotSize || '') + "</td>" + // Lot Size
                "<td class='border' align='center' valign='middle'>" + rejectQty + "</td>" + // Reject Qty (positive)
                "<td class='border' align='center' valign='middle'>" + (rate || '') + "</td>" + // U/P (USD)
                "<td class='border' align='center' valign='middle'>" + (mainlineAmount || '') + "</td>" + // Amount (USD) from mainline
                "<td class='border' align='center' valign='middle'>" + rejectPercent + "</td>" + // Reject %
                "<td class='border' align='center' valign='middle'>" + (rnNum || '') + "</td>" + // Rejection Notice No.
                "<td class='border' align='center' valign='middle'>" + (jobOrder || '') + "</td>" + // Job Order Number
                "<td class='border' align='center' valign='middle' width='60'>" + (reasonForReject || '') + "</td>" + // Reason for Reject
                "</tr>";

            // Add to totals
            totalLotSize += lotSizeNum;
            totalRejectQty += rejectQty;
            totalAmount += parseFloat(mainlineAmount) || 0;

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

        var reasonTableRows = "";
        var reasons = Object.keys(rejectsPerReason);

        // First row: Reason names
        reasonTableRows += "<tr style='background-color:#D3D3D3;'><td class='border' align='center' width='50'><b>Reject Type</b></td>";
        for (var i = 0; i < reasons.length; i++) {
            reasonTableRows += "<td class='border' align='center' valign='middle'><b>" + reasons[i] + "</b></td>";
        }
        reasonTableRows += "</tr>";

        // Second row: Reject totals
        reasonTableRows += "<tr><td style='background-color:#D3D3D3;' class='border' align='center' width='50'><b>Quantity</b></td>";
        for (var i = 0; i < reasons.length; i++) {
            reasonTableRows += "<td class='border' align='center'>" + rejectsPerReason[reasons[i]] + "</td>";
        }
        reasonTableRows += "</tr>";

        // Add totals row to table
        tableRows += "<tr style='font-weight:bold; background-color:#D3D3D3;'>" +
            "<td class='border' align='center' colspan='6'>TOTAL</td>" +
            "<td class='border' align='center'>" + totalLotSize + "</td>" +
            "<td class='border' align='center'>" + totalRejectQty + "</td>" +
            "<td class='border' align='center'></td>" + // U/P (USD) left blank
            "<td class='border' align='center'>" + totalAmount.toFixed(2) + "</td>" +
            "<td class='border' align='center'>" + totalRejectPercent + "</td>" +
            "<td class='border' align='center'></td>" + // Rejection Notice No.
            "<td class='border' align='center'></td>" + // Job Order Number
            "<td class='border' align='center'></td>" + // Reason for Reject
            "</tr>";

        // Format today's date for Issued Date
        var issuedDate = format.format({
            value: new Date(),
            type: format.Type.DATE
        });

        // Get current user name
        var userObj = runtime.getCurrentUser();
        var preparedBy = userObj.name || '';

        var xml = "<pdf>" +
            "<pdfset>" +
            "<pagesize width='297mm' height='210mm'/>" + // A4 landscape
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
            ".width { width: 277mm; }" + // 297mm - 2*10mm margins, use full landscape width
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
            "<td style='vertical-align:middle;' width='600' align='left'>" + // was 400, now wider
            "<h2 align='left'>KANEPACKAGE PHILIPPINE, INC.</h2>" +
            "</td>" +
            "</tr>" +
            "</table>" +
            "<table class='tableMarginTop' style='font-size: 12px; width:100%;'>" + // ensure full width
            "<tr>" +
            "<td width='100%'>" + // was 1000px, now 100% for responsive
            "<h1 align='center'>NON CONFORMANCE REPORT</h1></td>" +
            "</tr>" +
            "</table>" +
            "<table class='tableMarginTop' style='width:100%;'>" +
            "<tr>" +
            "<td width='70'><b>Supplier:</b></td>" +
            "<td width='200' style='text-decoration: underline;'>" + supplier + "</td>" +
            "<td width='70'>Issued Date: </td>" +
            "<td width='200' style='text-decoration: underline;'>" + issuedDate + "</td>" +
            "<td width='70'><b>Nature:</b></td>" +
            "<td width='35' align='center' class='black-bg'>_</td>" +
            "<td width='90' >Information</td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>Critical</td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'><b>Attention:</b></td>" +
            "<td width='200' style='text-decoration: underline;'>" + contactId + "</td>" +
            "<td width='70'>Prepared By: </td>" +
            "<td width='200' style='text-decoration: underline;'>" + preparedBy + "</td>" +
            "<td width='70'></td>" +
            "<td width='35'></td>" +
            "<td width='10'></td>" +
            "<td width='35'></td>" +
            "<td width='110'></td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'>Control No.: </td>" +
            "<td width='200' align='left' style='text-decoration: underline;'>" + tranid + "</td>" +
            "<td width='70'></td>" +
            "<td width='200' align='left'>QA Staff in Charge</td>" +
            "<td width='70'><b>Disposition:</b></td>" +
            "<td width='35' align='center' class='black-bg'>_</td>" +
            "<td width='10'>Backload</td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>Under Evaluation</td>" +
            "</tr>" +
            "<tr>" +
            "<td width='70'></td>" +
            "<td width='200'></td>" +
            "<td width='70'></td>" +
            "<td width='200'></td>" +
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
            "<td width='200'></td>" +
            "<td width='70'></td>" +
            "<td width='35' align='center' class='border'></td>" +
            "<td width='10'>For Verification</td>" +
            "<td width='35' class='border'></td>" +
            "<td width='110'>Reject for Disposal</td>" +
            "</tr>" +
            "</table>" +
            "<table class='border tableMarginTop' style='width:100%;'>" +
            "<tr style='background-color:#D3D3D3;'>" +
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
            "<td class='border' align='center' valign='middle'><b>Job Order<br />Number</b></td>" +
            "<td class='border' align='center' valign='middle'><b>Reason<br />for Reject</b></td>" +
            "</tr>" +
            tableRows +
            "</table>" +
            "<table class='border tableMarginTop' style='width:100%;'>" +
            reasonTableRows +
            "</table>" +
            "<table class='tableMarginTop' style='width:100%; page-break-inside: avoid;'>" + // signature/acknowledgement table
            "<tr>" +
            "<td class='border' align='center' valign='middle' style='background-color:#D3D3D3;'><b>Department</b></td>" +
            "<td class='border' align='center' valign='middle' style='background-color:#D3D3D3;'><b>In-Charge</b></td>" +
            "<td class='border' align='center' valign='middle' width='80' style='background-color:#D3D3D3;'><b>Signature</b></td>" +
            "<td width='100'></td>" +
            "<td width='50'><b>ACKNOWLEDGEMENT OF SUPPLIER:</b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>QA</td>" +
            "<td class='border' align='center' valign='middle'>Mr. GLENN DONALD MAGSINO</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' valign='bottom'><b>RECEIVED BY: </b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>ADMIN</td>" +
            "<td class='border' align='center' valign='middle'>Ms. JOSSA SALAZAR</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' align='center' colspan='2' valign='top'><b>______________________________<br />SIGNATURE OVER PRINTED NAME</b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>WAREHOUSE</td>" +
            "<td class='border' align='center' valign='middle'>Ms. STELLA ORTEGA /<br />Ms. SUZETTE DIMAYUGA</td>" +
            "<td class='border' height='25'></td>" +
            "<td width='100'></td>" +
            "<td width='50' valign='middle'><b>SUPPLIER'S NAME: __________________________</b></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='border' align='center' valign='middle'>Purchasing</td>" +
            "<td class='border' align='center' valign='middle'>Ms. SALVE OSI</td>" +
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