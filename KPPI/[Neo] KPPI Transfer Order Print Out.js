function printTransferOrder(request, response) {
    var printRecord = nlapiLoadRecord('transferorder', request.getParameter("internalId")),
        subsidiary = printRecord.getFieldText('subsidiary'),
        billTo = printRecord.getFieldValue('trandate'),
        shipTo = printRecord.getFieldValue('shipaddress'),
        orderNo = printRecord.getFieldValue('tranid'),
        orderNo2 = (printRecord.getFieldValue('tranid').substring(3, 15)),
        date = printRecord.getFieldValue('trandate'),
        customer = printRecord.getFieldText('custbody41'),
        RevNo = (printRecord.getFieldValue('custbody38') == null || printRecord.getFieldValue('custbody38') == 'F') ? ' ' : printRecord.getFieldValue('custbody38'),
        PR = (printRecord.getFieldValue('custbody364') == null || printRecord.getFieldValue('custbody364') == 'F') ? ' ' : printRecord.getFieldValue('custbody364'),
        SMR = (printRecord.getFieldValue('custbody363') == null || printRecord.getFieldValue('custbody363') == 'F') ? ' ' : printRecord.getFieldValue('custbody363'),
        Tool = (printRecord.getFieldValue('custbody371') == null || printRecord.getFieldValue('custbody371') == 'F') ? ' ' : printRecord.getFieldValue('custbody371'),
        BK = (printRecord.getFieldValue('custbody370') == null || printRecord.getFieldValue('custbody370') == 'F') ? ' ' : printRecord.getFieldValue('custbody370'),
        SI = (printRecord.getFieldValue('custbody372') == null || printRecord.getFieldValue('custbody372') == 'F') ? ' ' : printRecord.getFieldValue('custbody372'),
        SID = (printRecord.getFieldValue('custbody368') == null || printRecord.getFieldValue('custbody368') == 'F') ? ' ' : printRecord.getFieldValue('custbody368'),
        TAD = (printRecord.getFieldValue('custbody367') == null || printRecord.getFieldValue('custbody367') == 'F') ? ' ' : printRecord.getFieldValue('custbody367'),
        PCN = (printRecord.getFieldValue('custbody373') == null || printRecord.getFieldValue('custbody373') == 'F') ? ' ' : printRecord.getFieldValue('custbody373'),
        SCN = (printRecord.getFieldValue('custbody374') == null || printRecord.getFieldValue('custbody374') == 'F') ? ' ' : printRecord.getFieldValue('custbody374'),
        PQ = (printRecord.getFieldValue('custbody471') == null || printRecord.getFieldValue('custbody471') == 'F') ? ' ' : printRecord.getFieldValue('custbody471'),
        LoA = (printRecord.getFieldValue('custbody523') == 'T') ? '<span style="font-size:18px; font-weight:bold; color:green;">✔</span>' : ' ',
        LoACon1 = (printRecord.getFieldValue('custbody524') == 'T') ? '<span style="font-size:18px; font-weight:bold; color:green;">✔</span>' : ' ',
        LoACon2 = (printRecord.getFieldValue('custbody525') == 'T') ? '<span style="font-size:18px; font-weight:bold; color:green;">✔</span>' : ' ',

        lineCount = printRecord.getLineItemCount('item'),

        line = "",
        item,
        quantity,
        desc,
        pono,
        remarks,
        delivery,
        unit,
        jonum,
        componnt,

        html = nlapiGetContext().getSetting('SCRIPT', 'custscript7');

    for (var i = 1; i <= lineCount; i++) {
        item = printRecord.getLineItemText('item', 'item', i); item = (item == null) ? "" : item;
        quantity = printRecord.getLineItemValue('item', 'quantity', i); quantity = (quantity == null) ? "" : quantity;
        desc = printRecord.getLineItemValue('item', 'description', i); desc = (desc == null) ? "" : desc;
        pono = printRecord.getLineItemValue('item', 'custcol2', i); pono = (pono == null) ? "" : pono;
        remarks = printRecord.getLineItemValue('item', 'custcol3', i); remarks = (remarks == null) ? "" : remarks;
        delivery = printRecord.getLineItemValue('item', 'expectedreceiptdate', i); delivery = (delivery == null) ? "" : delivery;
        unit = printRecord.getLineItemValue('item', 'units_display', i); unit = (unit == null) ? "" : unit;
        // jonum = printRecord.getLineItemValue('item', 'custcol201', i); jonum = (jonum == null) ? "" : jonum;

        var woRef = printRecord.getLineItemValue('item', 'custcol_kpg_woref', i);
        var workOrder = null;

        if (woRef) {
            var woSearch = nlapiSearchRecord('workorder', null, [
                ['tranid', 'is', woRef]
            ]);

            if (woSearch && woSearch.length > 0) {
                var woId = woSearch[0].getId(); // internal ID
                workOrder = nlapiLoadRecord('workorder', woId);
            }
        }
        jonum = (workOrder != null) ? workOrder.getFieldValue('memo') : '';

        componnt = printRecord.getLineItemValue('item', 'custcol246', i); componnt = (componnt == null) ? "" : componnt;

        line = line.concat(getRow(item, quantity, desc, remarks, pono, delivery, unit, orderNo2, jonum, componnt));
    }

    customer = (customer == null) ? "" : customer;
    subsidiary = (subsidiary == null) ? "" : subsidiary;
    billTo = (billTo == null) ? "" : billTo;
    shipTo = (shipTo == null) ? "" : shipTo;
    orderNo = (orderNo == null) ? "" : orderNo;
    orderNo2 = (orderNo2 == null) ? "" : orderNo2;
    date = (date == null) ? "" : date;

    html = html.replace('{header}', subsidiary);
    html = html.replace('{orderNo}', orderNo);
    html = html.replace('{date}', date);
    html = html.replace('{shipTo}', shipTo);
    html = html.replace('{customer}', customer);
    html = html.replace('{RevNo}', RevNo);
    html = html.replace('{body}', line);
    html = html.replace('{PR}', PR);
    html = html.replace('{SMR}', SMR);
    html = html.replace('{Tool}', Tool);
    html = html.replace('{BK}', BK);
    html = html.replace('{SI}', SI);
    html = html.replace('{SID}', SID);
    html = html.replace('{TAD}', TAD);
    html = html.replace('{PCN}', PCN);
    html = html.replace('{SCN}', SCN);
    html = html.replace('{PQ}', PQ);
    html = html.replace('{LoA}', LoA);
    html = html.replace('{LoACon1}', LoACon1);
    html = html.replace('{LoACon2}', LoACon2);
    //html = html.replace('{orderNo2}', orderNo2);
    html = html.replace('{Department}', (printRecord.getFieldValue('department') == null) ? '' : printRecord.getFieldText('department'));
    html = html.replace('{preparedBy}', (printRecord.getFieldValue('employee') == null) ? '' : printRecord.getFieldText('employee'));
    html = html.replace('{checkedBy}', (printRecord.getFieldValue('custbody48') == null) ? '' : printRecord.getFieldText('custbody48'));
    html = html.replace('{approvedBy}', (printRecord.getFieldValue('custbody50') == null) ? '' : printRecord.getFieldText('custbody50'));

    response.write(html);
}

function getRow(item, quantity, description, remarks, pono, dateDelivery, unit, orderNo2, jonum, componnt) {
    var row = "";

    // Check if quantity is "1" and change quantity to "0" and componnt to "Cancelled"
    if (quantity == "1") {
        quantity = "0";
        componnt = "Cancelled";
    }

    dateDelivery = (dateDelivery == null || dateDelivery == '') ? '' : nlapiStringToDate(dateDelivery).toLocaleDateString();
    return row.concat(
        "<tr>",
        "<td width=100>", item, "</td>",
        "<td width=150>", description, "</td>",
        "<td width=50>", quantity, "</td>",
        "<td width=10>", unit, "</td>",
        "<td width=70>", pono, "</td>",
        "<td width=70>", dateDelivery, "</td>",
        "<td width=120>", remarks, "</td>",
        "<td width=90>", jonum, "</td>",
        "<td width=90>", componnt, "</td>",
        "</tr>"
    );
}