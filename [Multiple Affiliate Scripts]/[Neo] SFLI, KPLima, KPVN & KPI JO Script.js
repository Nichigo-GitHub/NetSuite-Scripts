function suitelet(request, response) {
	var workorder = nlapiLoadRecord('workorder', request.getParameter('internalid'));
	context = nlapiGetContext();
	var subsidary = workorder.getFieldValue("subsidiary");
	var custfrm = workorder.getFieldValue('customform');
	var htmlId = (subsidary == "4" ? "custscript_html_indonesia" : subsidary == "18" ? "custscript74" : subsidary == "15" && custfrm == "719" ? "custscript79" : subsidary == "15" && custfrm == "692" ? "custscript80" : "custscript26");
	html = context.getSetting('SCRIPT', htmlId);

	tablerow = '';
	var lineCount = workorder.getLineItemCount('item');
	for (var i = 1; i <= lineCount; i++) {
		var code = (subsidary == "4" ? workorder.getLineItemValue('item', 'item_display', i) : workorder.getLineItemText('item', 'item', i)),
			desc = (subsidary == "4" ? (workorder.getLineItemValue('item', 'description', i) || " ") : (workorder.getLineItemValue('item', 'description', i) == null) ? 0 : workorder.getLineItemValue('item', 'description', i)),
			qty = (workorder.getLineItemValue('item', 'quantity', i) == null) ? 0 : workorder.getLineItemValue('item', 'quantity', i),
			unit = (workorder.getLineItemText('item', 'units', i) == null) ? 0 : workorder.getLineItemText('item', 'units', i),
			excess = (workorder.getLineItemValue('item', 'custcol244', i) == null) ? 0 : workorder.getLineItemValue('item', 'custcol244', i),
			outs = (workorder.getFieldValue('custbody489') == null) ? 0 : workorder.getFieldValue('custbody489');

			excess = (excess == 0) ? "" : excess + ' ' + unit;
			desc = String(desc);
			desc = desc.replace(/\n+/g, ' ');

		if (subsidary == "4") {
			var itemId = workorder.getLineItemValue('item', 'item', i);

			var recordType = nlapiLookupField('inventoryitem', itemId, 'internalid');
			var preferredVendor = '';

			nlapiLogExecution('ERROR', 'recordType', recordType);

			if (recordType) {
				var itemRecord = nlapiLoadRecord('inventoryitem', itemId);

				var vendorCount = itemRecord.getLineItemCount('itemvendor');

				for (var j = 0; j <= vendorCount; j++) {
					var isPreferred = itemRecord.getLineItemValue('itemvendor', 'preferredvendor', j);
					nlapiLogExecution('ERROR', 'isPreferred', isPreferred);
					if (isPreferred == 'T') {
						preferredVendor = itemRecord.getLineItemValue('itemvendor', 'vendor_display', j);
						nlapiLogExecution('ERROR', 'preferredVendor', preferredVendor);
						break;
					}
				}
			}

			tablerow += addRmRow_KPI(code, preferredVendor, qty + ' ' + unit, '', '');
		} else if (subsidary == "15" && custfrm == "692") {
			var itemId = workorder.getLineItemValue('item', 'item', i);

			var itemRecord = nlapiLoadRecord('inventoryitem', itemId);
			var vendor = itemRecord.getLineItemValue('itemvendor', 'vendor_display', 1);

			tablerow += addRmRow_KPVN_AMATA(code, desc, qty + ' ' + unit, '', vendor);
		} else if (subsidary == "15" && custfrm == "719") {
			var itemId = workorder.getLineItemValue('item', 'item', i);

			var upccode = nlapiLookupField('inventoryitem', itemId, 'upccode');

			if (upccode) {
				tablerow += addRmRow_KPVN_HANOI(code, desc, parseFloat(qty) + ' ' + unit, '', '', '', '', upccode);
			}
		} else if (subsidary == "14") {
			tablerow += addRmRow_SFLI(code, desc, qty + ' ' + unit, outs, '', '', '', '');
		} else {
			tablerow += addRmRow_KPLima(code, desc, qty + ' ' + unit, excess, '', '', '', '');
		}
	}

	var datetemp = nlapiStringToDate(workorder.getFieldValue('trandate'));
	var dy = datetemp.getFullYear();
	var dd = datetemp.getDate();
	var mm = datetemp.getMonth() + 1;
	if (subsidary == "15") {
		var dada = dd + "/" + mm + "/" + dy;
	} else {
		var dada = dy + "/" + mm + "/" + dd;
	}

	var datetemp2 = nlapiStringToDate(workorder.getFieldValue('enddate'));
	var dy2 = datetemp2.getFullYear();
	var dd2 = datetemp2.getDate();
	var mm2 = datetemp2.getMonth() + 1;
	if (subsidary == "15") {
		var dada2 = dd2 + "/" + mm2 + "/" + dy2;
	} else {
		var dada2 = dy2 + "/" + mm2 + "/" + dd2;
	}

	html = html.replace('{body}', tablerow);
	html = html.replace('{joNum}', workorder.getFieldValue('tranid'));
	html = html.replace('{joNum2}', workorder.getFieldValue('tranid'));
	html = html.replace('{joNum3}', workorder.getFieldValue('tranid'));
	html = html.replace('{preparedBy}', workorder.getFieldText('custbody_employee'));
	html = html.replace('{date}', dada);
	html = html.replace('{cust}', workorder.getFieldText('entity'));
	html = html.replace('{cust2}', workorder.getFieldText('entity'));
	html = html.replace('{assemblyItem}', workorder.getFieldText('assemblyitem'));
	html = html.replace('{assemblyItemDesc}', workorder.getFieldValue('custbody240') || "");
	html = html.replace('{qty}', workorder.getFieldValue('quantity') + ' ' + workorder.getFieldText('units'));
	html = html.replace('{DateNeed}', dada2);
	html = html.replace('{TimeNeed}', workorder.getFieldValue('custbody237') || "");
	html = html.replace('{name1}', workorder.getFieldText('custbody220') || "");
	html = html.replace('{upcCode}', workorder.getFieldValue('custbody_upccode'));
	html = html.replace('{excess}', excess);
	html = html.replace('{deptLocation}', workorder.getFieldValue('custbody485') || "");
	html = html.replace('{deptLocationUPC}', workorder.getFieldValue('custbody485') || "");
	html = html.replace('{drawingUPC}', workorder.getFieldValue('custbody491') || "");

	// Add Process Rows
	if (subsidary == 14) {
		function SFLIrow(processText, a, b, c, d, e, f, g, Num) {
			return row1 = "<tr>" +
				"<td class='padding borderRight borderBottom'>" + Num + "." + processText + "</td>" +
				"<td class='padding borderRight borderBottom'>" + a + "</td>" +
				"<td class='padding borderRight borderBottom'>" + b + "</td>" +
				"<td class='padding borderRight borderBottom'>" + c + "</td>" +
				"<td class='padding borderRight borderBottom'>" + d + "</td>" +
				"<td class='padding borderRight borderBottom'>" + e + "</td>" +
				"<td class='padding borderRight borderBottom'>" + f + "</td>" +
				"<td class='padding borderRight borderBottom'>" + g + "</td>" +
				"<td class='padding borderRight borderBottom'>" + g + "</td>" +
				"</tr>";
		}

		var Num = 1;

		for (i = 226; i <= 267; i++) {
			if (i == 236) {
				i = 241;
			} else if (i == 246) {
				i = 258;
			}
			process = workorder.getFieldValue('custbody' + i);
			processText = workorder.getFieldText('custbody' + i);
			onerow = "";
			if (process != "" && process != null) {
				onerow += SFLIrow(processText, '', '', '', '', '', '', '', Num);
				html = html.replace('{' + i + '}', onerow == null ? '' : onerow);
				Num++;
			}
		}

		html = html.replace(/&/g, '&amp;');

		nlapiLogExecution('ERROR', 'Generated HTML', html);

		var file = nlapiXMLToPDF(html);
		response.setContentType('PDF', 'JobOrder.pdf', 'inline');
		response.write(file.getValue());
	} else if (subsidary == 15 && custfrm == 692) {
		var POnum = 'SAMPLE',
			codeType = '__________';

		if (subsidary == 15 && custfrm == 692) {
			var SOid = workorder.getFieldValue('createdfrom');

			if (SOid) {
				var SOrecord = nlapiLoadRecord('salesorder', SOid);
				POnum = SOrecord.getFieldValue('custbodyrefdoc');
			} else {
				var POfield = workorder.getFieldValue('custbody92');
				if (POfield)
					POnum = POfield;
			}
		}

		html = html.replace('{POnum}', POnum);

		var lotNumber = workorder.getFieldValue('assemblyitem');
		var currentWorkOrderId = workorder.getId();

		var filters = [
			new nlobjSearchFilter('item', null, 'is', lotNumber),
			new nlobjSearchFilter('internalid', null, 'noneof', currentWorkOrderId)
		];

		// Define the search columns
		var columns = [
			new nlobjSearchColumn('internalid')
		];

		// Perform the search
		var searchResults = nlapiSearchRecord('workorder', null, filters, columns);
		// Check if there are any results
		if (searchResults && searchResults.length > 0) {
			codeType = 'Current Code';
		} else {
			codeType = 'New Code';
		}

		html = html.replace('{codeType}', codeType);

		function KPVNamataRow(processText, Num) {
			return row = "<tr height='20px'>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='5'>" + Num + ". " + processText + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>";
		}

		var j = 1;

		for (i = 226; i <= 267; i++) {
			if (i == 236) {
				i = 241;
			} else if (i == 246) {
				i = 258;
			}
			process = workorder.getFieldValue('custbody' + i);
			processText = workorder.getFieldText('custbody' + i);
			onerow = "";
			if (process != "" && process != null) {
				onerow += KPVNamataRow(processText, j);
				html = html.replace('{' + i + '}', onerow == null ? '' : onerow);
				j++;
			}
		}

		html = html.replace(/&/g, '&amp;');

		nlapiLogExecution('ERROR', 'Generated HTML', html);

		var file = nlapiXMLToPDF(html);
		response.setContentType('PDF', 'JobOrder.pdf', 'inline');
		response.write(file.getValue());
	} else if (subsidary == 15 && custfrm == 719) {
		function KPVNhanoiRow(processText, Num) {
			return row = "<tr height='20px'>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + Num + "." + processText + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'></td>" +
				"</tr>";
		}

		var j = 1;

		for (i = 226; i <= 267; i++) {
			if (i == 236) {
				i = 241;
			} else if (i == 246) {
				i = 258;
			}
			process = workorder.getFieldValue('custbody' + i);
			processText = workorder.getFieldText('custbody' + i);
			onerow = "";
			if (process != "" && process != null) {
				onerow += KPVNhanoiRow(processText, j);
				html = html.replace('{' + i + '}', onerow == null ? '' : onerow);
				j++;
			}
		}

		html = html.replace(/&/g, '&amp;');

		nlapiLogExecution('ERROR', 'Generated HTML', html);

		var file = nlapiXMLToPDF(html);
		response.setContentType('PDF', 'JobOrder.pdf', 'inline');
		response.write(file.getValue());
	} else {
		function Row(processText, a, b, c, d, e, f, g, h, i, j, Num) {
			return row = "<tr height='20px'>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + Num + "." + processText + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + a + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + b + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + c + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + d + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + e + "</td>" +
				"<td class='padding borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + h + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + i + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'>" + f + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'>" + g + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'>" + j + "</td>" +
				"</tr>";
		}

		function extraRow(a, b, c, d, e, f, g, h, i, j) {
			return row1 = "<tr height='20px'>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + a + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + b + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + c + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + d + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + e + "</td>" +
				"<td class='padding borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + h + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' rowspan='2'>" + i + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px'></td>" +
				"</tr>" +
				"<tr>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'>" + f + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'>" + g + "</td>" +
				"<td class='padding borderRight borderBottom' height='20px' style='font-size: 6px;'>" + j + "</td>" +
				"</tr>";
		}

		var j = 1;

		for (i = 226; i <= 267; i++) {
			if (i == 236) {
				i = 241;
			} else if (i == 246) {
				i = 258;
			}
			process = workorder.getFieldValue('custbody' + i);
			processText = workorder.getFieldText('custbody' + i);
			onerow = "";
			if (process != "" && process != null) {
				onerow += Row(processText, '', '', '', '', '', 'G', 'R', '', '', '', j);
				html = html.replace('{' + i + '}', onerow == null ? '' : onerow);
				j++;
			}
		}

		extra = '';
		extra += extraRow('', '', '', '', '', 'G', 'R', '', '', '');
		html = html.replace('{extra}', extra == null ? '' : extra);
		html = html.replace('{extra2}', extra == null ? '' : extra);
		html = html.replace('{extra3}', extra == null ? '' : extra);
		var fileId = 295848; // Replace with your image's internal ID
		var fileObj = nlapiLoadFile(fileId); // SuiteScript 1.0 equivalent of file.load
		var base64Image = fileObj.getURL(); // Get the URL of the file
		html = html.replace('{base64Image}', base64Image == null ? '' : base64Image);
		html = html.replace(/&/g, '&amp;');

		nlapiLogExecution('ERROR', 'Generated HTML', html);

		var file = nlapiXMLToPDF(html);
		response.setContentType('PDF', 'JobOrder.pdf', 'inline');
		response.write(file.getValue());
	}

	// Functions for RM rows
	function addRmRow_SFLI(code, desc, qty, outs, a, b, c, d) {
		return row1 = "<tr style='letter-spacing: 1px; font-size: 8px;'>" +
			"<td class='padding borderBottom borderRight' align='left'>" + code + "</td>" +
			"<td class='padding borderBottom borderRight' align='left' style='text-align: left;'>" + desc + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + qty + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + outs + "</td>" +
			"<td class='padding borderBottom borderRight'>" + a + "</td>" +
			"<td class='padding borderBottom borderRight'>" + b + "</td>" +
			"<td class='padding borderBottom borderRight'>" + c + "</td>" +
			"<td class='padding borderBottom'>" + d + "</td>" +
			"</tr>";
	}

	function addRmRow_KPLima(code, desc, qty, excess, a, b, c, d) {
		return row1 = "<tr style='letter-spacing: 1px;'>" +
			"<td class='padding borderBottom borderRight' align='left'>" + code + "</td>" +
			"<td class='padding borderBottom borderRight' align='left' style='text-align: left;'>" + desc + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + qty + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + excess + "</td>" +
			"<td class='padding borderBottom borderRight'>" + a + "</td>" +
			"<td class='padding borderBottom borderRight'>" + b + "</td>" +
			"<td class='padding borderBottom borderRight'>" + c + "</td>" +
			"<td class='padding borderBottom'>" + d + "</td>" +
			"</tr>";
	}

	function addRmRow_KPVN_HANOI(code, desc, qty, a, b, c, d, upccode) {
		return row1 = "<tr style='letter-spacing: 1px;'>" +
			"<td class='padding borderBottom borderRight' align='left' valign='middle'>" +
			"<table cellpadding='0' cellspacing='0'><tr><td valign='middle'>" +
			"<barcode codetype='qrcode' style='height: 50px; width: 50px;  padding-top: -5px; padding-bottom: -5px;' showtext='false' value='" + upccode + "' />" +
			"</td><td valign='middle'>" + code + "</td></tr></table></td>" +
			"<td class='padding borderBottom borderRight' align='left' style='text-align: left;'>" + desc + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + qty + "</td>" +
			"<td class='padding borderBottom borderRight'>" + a + "</td>" +
			"<td class='padding borderBottom borderRight'>" + b + "</td>" +
			"<td class='padding borderBottom borderRight'>" + c + "</td>" +
			"<td class='padding borderBottom'>" + d + "</td>" +
			"</tr>";
	}

	function addRmRow_KPVN_AMATA(code, desc, qty, a, vendor) {
		return row1 = "<tr style='letter-spacing: 1px;'>" +
			"<td class='padding borderBottom borderRight' align='left'>" + code + "</td>" +
			"<td class='padding borderBottom borderRight' align='left' style='text-align: left;'>" + desc + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + qty + "</td>" +
			"<td class='padding borderBottom borderRight'>" + a + "</td>" +
			"<td class='padding borderBottom'>" + vendor + "</td>" +
			"</tr>";
	}

	function addRmRow_KPI(code, preferredVendor, qty, a, b) {
		return row1 = "<tr class='spacing' align='left'>" +
			"<td class='padding borderBottom borderRight' align='left'>" + code + "</td>" +
			"<td class='padding borderBottom borderRight' align='left' style='text-align: left;'>" + preferredVendor + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + qty + "</td>" +
			"<td class='padding borderBottom borderRight' align='center'>" + a + "</td>" +
			"<td class='padding borderBottom borderRight'>" + b + "</td>" +
			"</tr>";
	}
}