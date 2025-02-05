function printLoading(request, response) {
	var printLoading = nlapiLoadRecord('fulfillmentrequest', request.getParameter("internalId")),
		subsidiary = printLoading.getFieldText('subsidiary'),
		date = printLoading.getFieldValue('trandate'), //date
		cust = printLoading.getFieldText('entity'), //customer
		createdSO = printLoading.getFieldText('createdfrom'), //createdfrom
		LFnum = printLoading.getFieldValue('tranid'),
		lineCount = printLoading.getLineItemCount('item'),
		line = "",
		deldate, //deliver date
		cuscode, //customer code
		desc, //description
		item, //item code
		quantity, //quantity
		uom, //UOM
		whstock, //whsestock
		pickup, //pickup
		bin,
		binqty;

		html = nlapiGetContext().getSetting('SCRIPT', 'custscript65');
	nlapiLogExecution('ERROR', 'lineCount', lineCount);

	for (var i = 1; i <= lineCount; i++) {
		deldate = printLoading.getLineItemValue('item', 'custcol4', i);
		deldate = (deldate == null) ? "" : deldate;
		cuscode = printLoading.getLineItemValue('item', 'custcol_item_display_name', i);
		cuscode = (cuscode == null) ? "" : cuscode;
		desc = printLoading.getLineItemValue('item', 'itemdescription', i);
		desc = (desc == null) ? "" : desc;
		item = printLoading.getLineItemText('item', 'item', i);
		item = (item == null) ? "" : item;
		quantity = printLoading.getLineItemValue('item', 'itemquantity', i);
		quantity = (quantity == null) ? "" : quantity;
		uom = printLoading.getLineItemValue('item', 'unitsdisplay', i);
		uom = (uom == null) ? "" : uom;
		whstock = printLoading.getLineItemValue('item', 'onhand', i);
		whstock = (whstock == null) ? "" : whstock;
		pickup = printLoading.getLineItemValue('item', 'onhand', i);
		pickup = (pickup == null) ? "" : pickup;

		bin = printLoading.getLineItemValue('item', 'custcol554', i);

		var binsData = getBinsAndQuantities(item);
		nlapiLogExecution('ERROR', 'binsData.bin', binsData.bin);
		nlapiLogExecution('ERROR', 'binsData.binqty', binsData.binqty);
		bin = (bin == null) ? "" : bin;
		binqty = printLoading.getLineItemValue('item', 'custcol555', i);
		binqty = (binqty == null) ? "" : binqty;

		line = line.concat(getRow(deldate, cuscode, desc, item, quantity, uom, whstock, pickup, bin, binqty));
	}

	subsidiary = (subsidiary == null) ? "" : subsidiary;
	date = (date == null) ? "" : date;
	cust = (cust == null) ? "" : cust;
	createdSO = (createdSO == null) ? "" : createdSO;
	LFnum = (LFnum == null) ? "" : LFnum;

	html = html.replace('{date}', date);
	html = html.replace('{cust}', cust);
	html = html.replace('{createdSo}', createdSO.replace('Sales Order #', ''));
	html = html.replace('{LFnum}', LFnum);
	html = html.replace('{body}', line);
	response.write(html);
}

function getBinsAndQuantities(item) {
	try {
		// Load the saved search
		var savedSearch = nlapiLoadSearch('lotnumberedassemblyitem', 'customsearch4256');

		// Add filters to the search
		savedSearch.addFilter(new nlobjSearchFilter('itemid', null, 'anyof', item));

		// Run the search
		var searchResults = savedSearch.runSearch();
		var binsData = {};

		// Retrieve first result for bin and quantity
		searchResults.forEachResult(function (result) {
			binsData.bin = result.getValue('inventorydetail', 'binnumber');
			binsData.binqty = result.getValue('inventorydetail', 'quantityonhand');
			return false; // Exit after first result
		});

		return binsData;
	} catch (error) {
		nlapiLogExecution('ERROR', 'Error in getBinsAndQuantities', error.message);
		return {};
	}
}

function getRow(deldate, cuscode, desc, item, quantity, uom, whstock, pickup, bin, binqty) {
	return [
		"<tr>",
		"<td width='70px' align='left' class='border' style='font-size:14px'>", deldate, "</td>",
		"<td width='50px' align='left' class='border' style='font-size:14px'>", cuscode, "</td>",
		"<td width='200px' align='left' class='border' style='font-size:14px'>", desc, "</td>",
		"<td width='75px' align='left' class='border' style='font-size:14px'>", item, "</td>",
		"<td width='50px' align='center' class='border' style='font-size:14px'>", quantity, "</td>",
		"<td width='50px' align='center' class='border' style='font-size:14px'>", uom, "</td>",
		"<td width='50px' align='center' class='border' style='font-size:14px'>", whstock, "</td>",
		"<td width='50px' align='right' class='border' style='font-size:14px'></td>",
		"<td width='50px' align='right' class='border' style='font-size:14px'></td>",
		"<td width='100px' align='left' class='border' style='font-size:14px'>", bin, "</td>",
		"<td width='50px' align='center' class='border' style='font-size:14px'>", binqty, "</td>",
		"<td width='80px' align='left' class='border' style='font-size:14px'></td>",
		"</tr>"
	].join("");
}