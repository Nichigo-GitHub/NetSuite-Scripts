function printRR(request, response) {
    var itemreceiptID = request.getParameter("internalId");
    var html = nlapiGetContext().getSetting('SCRIPT', 'custscript58');

    var itemreceiptRecord = nlapiLoadRecord('itemreceipt', itemreceiptID);
    var subsidiary = itemreceiptRecord.getFieldText('subsidiary');
    var date = itemreceiptRecord.getFieldValue('trandate');
    var time = itemreceiptRecord.getFieldValue('custbody329');
    var from = itemreceiptRecord.getFieldValue('createdfrom').substring(25);
    var drNo = itemreceiptRecord.getFieldValue('custbody28');
    var preparedby = itemreceiptRecord.getFieldText('custbody1');
    var checkedby = itemreceiptRecord.getFieldText('custbody2');

    var TruckNo = (itemreceiptRecord.getFieldValue('custbody387') == null) ? ' ' : itemreceiptRecord.getFieldValue('custbody387');
    var ponofull = itemreceiptRecord.getFieldText('createdfrom');
    var pono = ponofull.substring(16);
    var memo = (itemreceiptRecord.getFieldValue('memo') == null) ? '' : itemreceiptRecord.getFieldValue('memo');
    var kpno = (itemreceiptRecord.getFieldValue('tranid') == null) ? itemreceiptRecord.getFieldValue('tranid') : itemreceiptRecord.getFieldValue('tranid');
    var entityName = itemreceiptRecord.getFieldText('entity');
    var concat = "";
    var lineItemCount = itemreceiptRecord.getLineItemCount('item');

    for (var i = 1; i <= lineItemCount; i++) {
        var curr = (itemreceiptRecord.getLineItemValue('item', 'currency', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'currency', i);
        var dr = (itemreceiptRecord.getLineItemValue('item', 'custcol6', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'custcol6', i);
        var itemcode = (itemreceiptRecord.getLineItemValue('item', 'itemname', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'itemname', i);
        var itemDesc = (itemreceiptRecord.getLineItemValue('item', 'itemdescription', i) == null) ? itemreceiptRecord.getLineItemText('item', 'item', i) : itemreceiptRecord.getLineItemValue('item', 'itemdescription', i);
        itemDesc = itemDesc.replace('&', ' and ');
        var quantity = (itemreceiptRecord.getLineItemValue('item', 'quantity', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'quantity', i);
        quantity = addCommas(quantity); // Apply addCommas function
        var declaredQuantity = (itemreceiptRecord.getLineItemValue('item', 'custcol68', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'custcol68', i);
        declaredQuantity = addCommas(declaredQuantity); // Apply addCommas function
        var units = itemreceiptRecord.getLineItemValue('item', 'unitsdisplay', i) || "";

        concat += getRow(drNo, pono, itemcode, itemDesc, quantity, declaredQuantity, units);
        dr = '';
    }

    html = html.replace('{TruckNo}', TruckNo);
    html = html.replace('{subsidiary}', subsidiary);
    html = html.replace('{subsidiaryname}', subsidiary);
    html = html.replace('{body}', concat);
    html = html.replace('{kpNo}', kpno);
    html = html.replace('{preparedby}', preparedby);
    html = html.replace('{checkedby}', checkedby);
    html = html.replace('{supplier}', entityName);
    html = html.replace('{date}', date);
    html = html.replace('{Time}', time);
    html = html.replace('{memo}', memo);
    html = html.replace(/&/g, '&amp;');

    var file = nlapiXMLToPDF(html);
    response.setContentType('PDF', itemreceiptRecord.getFieldValue('tranid') + '.pdf', 'inline');
    response.write(file.getValue());
}

function getRow(drNo, pono, itemcode, itemDesc, quantity, declaredQuantity, units) {
    return '<tr>' +
        "<td class='borderRight paddingBottom wrap medium' width='150'>" + drNo + '</td>' +
        "<td class='borderRight paddingBottom wrap small' width='150'>" + pono + '</td>' +
        //"<td class='borderRight paddingBottom wrap small' width='100'>" + itemcode +'</td>' +
        "<td class='borderRight paddingBottom wrap medium' width='300'>" + itemDesc + '</td>' +
        "<td class='borderRight paddingBottom wrap medium' width='120'>" + quantity + '</td>' +
        "<td class='paddingBottom wrap small' width='120'>" + declaredQuantity + '</td>' +
        // "<td class='paddingBottom wrap small' width='83.33'>" + ' ' + '</td>' +
        "</tr>";
}

function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}