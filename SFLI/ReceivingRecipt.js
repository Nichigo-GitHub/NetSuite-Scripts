/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Nov 2012     Vanessa
 *
 */

function printRR(request, response) {
	var itemreceiptID = request.getParameter("internalId");
	var html = nlapiGetContext().getSetting('SCRIPT', 'custscript4');

	var itemreceiptRecord = nlapiLoadRecord('itemreceipt', itemreceiptID);
	subsidiary = itemreceiptRecord.getFieldText('subsidiary');
	subsidiaryid = itemreceiptRecord.getFieldValue('subsidiary');
	date = itemreceiptRecord.getFieldValue('trandate');
	time = itemreceiptRecord.getFieldValue('custbody219');
	var from = itemreceiptRecord.getFieldValue('createdfrom');
	// preparedby = nlapiLookupField('purchaseorder', from, 'employee', false);
	// inspectedby = nlapiLookupField('purchaseorder', from, 'custbody3', false);
	// approveby = nlapiLookupField('purchaseorder', from, 'custbody3', true);
	// dr = (itemreceiptRecord.getFieldValue('custbody168') == null) ? '-' : itemreceiptRecord.getFieldValue('custbody168');
	// preparedby = (nlapiLookupField('purchaseorder', from, 'employee', true) == null) ? '' : nlapiLookupField('purchaseorder', from, 'employee', true);
	// inspectedby = (nlapiLookupField('purchaseorder', from, 'custbody3', true) == null) ? '' : nlapiLookupField('purchaseorder', from, 'custbody3', true);

	preparedby = (itemreceiptRecord.getFieldText('custbody1') == null) ? '' : itemreceiptRecord.getFieldText('custbody1');
	inspectedby = (itemreceiptRecord.getFieldText('custbody2') == null) ? '' : itemreceiptRecord.getFieldText('custbody2');
	//invoice = (itemreceiptRecord.getFieldValue('custbody29') == null)? '-': itemreceiptRecord.getFieldValue('custbody29');
	ponofull = itemreceiptRecord.getFieldText('createdfrom');
	pono = ponofull.split('#')[1];

	memo = (itemreceiptRecord.getFieldValue('memo') == null) ? '' : itemreceiptRecord.getFieldValue('memo');
	kpno = (itemreceiptRecord.getFieldValue('tranid') == null) ? itemreceiptRecord.getFieldValue('tranid') : itemreceiptRecord.getFieldValue('tranid');
	DrNum = (itemreceiptRecord.getFieldValue('custbody28') == null) ? itemreceiptRecord.getFieldValue('custbody28') : itemreceiptRecord.getFieldValue('custbody28');
	var concat = "";
	var lineItemCount = itemreceiptRecord.getLineItemCount('item');
	for (var i = 1; i <= lineItemCount; i++) {

		if (subsidiaryid != '12')
			var dr = (itemreceiptRecord.getLineItemValue('item', 'custcol6', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'custcol6', i);
		var itemcode = (itemreceiptRecord.getLineItemValue('item', 'itemname', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'itemname', i);
		//var pono = (itemreceiptRecord.getLineItemValue('item','custcol2', i)== null) ? "-":itemreceiptRecord.getLineItemValue('item','custcol2', i);
		var itemDesc = (itemreceiptRecord.getLineItemValue('item', 'itemdescription', i) == null) ? itemreceiptRecord.getLineItemText('item', 'item', i) : itemreceiptRecord.getLineItemValue('item', 'itemdescription', i);
		itemDesc = itemDesc.replace('&', ' and ');
		var declaredQuantity = (itemreceiptRecord.getLineItemValue('item', 'quantity', i) == null) ? "-" : itemreceiptRecord.getLineItemValue('item', 'quantity', i);
		//var units = (itemreceiptRecord.getLineItemValue('item', 'units', i) == null) ? '' : itemreceiptRecord.getLineItemValue('item', 'units', i);
		//SW 20181009 START
		var units = itemreceiptRecord.getLineItemValue('item', 'unitsdisplay', i) || "";

		if (units == '') {
			unit = '';
			dq = declaredQuantity + "/" + unit;
		} else {
			unit = (units == 'Pieces' ? 'Pcs' : units); //(nlapiLookupField('unitstype', units, 'name')) == 'Pieces' ? 'Pcs' : nlapiLookupField('unitstype', units, 'name');
			dq = declaredQuantity + "/" + unit;
		}
		//SW 20181009 END
		concat += getRow(DrNum, pono, itemcode, itemDesc, dq, subsidiaryid);
	}
	if (subsidiaryid == '13') {
		source = '<img src="http://shopping.sandbox.netsuite.com/core/media/media.nl?id=3219&amp;c=3389427&amp;h=7572b34de19b3813204e"></img>';
		invno = itemreceiptRecord.getFieldValue('custbody29');
		truckno = itemreceiptRecord.getFieldValue('custbody19');
		html = html.replace('{logohere}', source);

		drsize = 100;
		posize = 107;
		itemsize = 143;
		descsize = 350;
		// html = html.replace('{row}', getHeaderRow(invno, truckno));
	} else if (subsidiaryid == '14') {
		html = html.replace('{logohere}', '');
		drsize = 93;
		posize = 125;
		itemsize = 140;
		descsize = 335;
	} else {
		html = html.replace('{logohere}', '');
	}
	html = html.replace('{subsidiary}', subsidiary);
	html = html.replace('{subsidiaryname}', subsidiary);
	html = html.replace('{body}', concat);
	html = html.replace('{kpNo}', kpno);
	html = html.replace('{drsize}', drsize);
	html = html.replace('{posize}', posize);
	html = html.replace('{itemsize}', itemsize);
	html = html.replace('{descsize}', descsize);
	html = html.replace('{supplier}', itemreceiptRecord.getFieldText('entity'));
	html = html.replace('{date}', date + " " + time);
	html = html.replace('{preparedby}', preparedby);
	html = html.replace('{inspectedby}', inspectedby);
	html = html.replace('{memo}', memo);
	html = html.replace(/&/g, '&amp;');
	var file = nlapiXMLToPDF(html);
	response.setContentType('PDF', itemreceiptRecord.getFieldValue('tranid') + '.pdf', 'inline');
	response.write(file.getValue());
}

function getHeaderRow(invoiceno, truckno) {
	return "<tr>" +
		"<td width='500'>INVOICE NO: " + invoiceno + "</td>" +
		"<td width='300'>TRUCK NO: " + truckno + "</td>" +
		"</tr>";
}

function getRow(DrNum, pono, itemcode, itemDesc, declaredQuantity, subsidiaryid) {
	if (subsidiaryid == '14') {
		row = '<tr>';
		row += "<td width='93'>" + DrNum + ' </td>';
		row += "<td width='125'>" + pono + ' </td>';
		row += "<td width='140'>" + itemcode + ' </td>';
		row += "<td width='335'>" + itemDesc + ' </td>';
		row += "<td width='105'>" + declaredQuantity + ' </td>';
		row += "</tr>";
	} else {
		row = '<tr>';
		row += "<td width='100'>" + DrNum + ' </td>';
		row += "<td width='107'>" + pono + ' </td>';
		row += "<td width='143'>" + itemcode + ' </td>';
		row += "<td width='350'>" + itemDesc + ' </td>';
		row += "<td width='105'>" + declaredQuantity + ' </td>';
		row += "</tr>";
	}
	return row;
}

function addCommas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}