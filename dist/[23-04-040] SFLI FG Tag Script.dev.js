"use strict";

function suitelet(request, response) {
  var FGtag = nlapiLoadRecord('inventorytransfer', request.getParameter("internalId")),
      subsidiary = FGtag.getFieldText('subsidiary'),
      date = FGtag.getFieldValue('trandate'),
      //prdQAdate = FGtag.getFieldValue('custbody459'),
  PreparedBy = FGtag.getFieldText('custbody1'),
      custm = FGtag.getFieldText('custbody41'),
      JoNum = FGtag.getFieldValue('tranid'),
      lineCount = FGtag.getLineItemCount('inventory'),
      line = "",
      line2 = "",
      line3 = "",
      line4 = "",
      line5 = "",
      item,
      itemUPC,
      qty,
      desc,
      prdQA,
      html = nlapiGetContext().getSetting('SCRIPT', 'custscript69');
  nlapiLogExecution('ERROR', 'lineCount', lineCount); // logger(html);

  for (var i = 1; i <= lineCount; i++) {
    item_id = FGtag.getLineItemValue('inventory', 'item', i);
    item_id = item_id == null ? "" : item_id;
    item = FGtag.getLineItemText('inventory', 'item', i);
    item = item == null ? "" : item;
    var search = nlapiSearchRecord('item', null, [new nlobjSearchFilter('internalid', null, 'is', item_id)], [new nlobjSearchColumn('upccode')]);

    if (search) {
      itemUPC = search[0].getValue('upccode');
    } // itemUPC = FGtag.getLineItemValue('inventory', 'custcol242', i); itemUPC = (itemUPC == null) ? "" : itemUPC;


    qty = FGtag.getLineItemValue('inventory', 'adjustqtyby', i);
    qty = qty == null ? "" : qty;
    desc = FGtag.getLineItemValue('inventory', 'description', i);
    desc = desc == null ? "" : desc;
    prdQA = FGtag.getLineItemValue('inventory', 'custcol_pruduction_plan_date', i);
    prdQA = prdQA == null ? "" : prdQA;
    line = line.concat(getRow(item));
    line2 = line2.concat(getRow2(desc));
    line3 = line3.concat(getRow3(qty));
    line4 = line4.concat(getRow4(prdQA));
    line5 = line5.concat(getRow5(itemUPC));
  }

  subsidiary = subsidiary == null ? "" : subsidiary;
  date = date == null ? "" : date; //prdQAdate = (prdQAdate == null) ? "" : prdQAdate;

  PreparedBy = PreparedBy == null ? "" : PreparedBy;
  custm = custm == null ? "" : custm;
  JoNum = JoNum == null ? "" : JoNum;
  dateValue = new Date(date);
  var month = dateValue.getMonth(); // Convert month to a more human-friendly format (e.g., 1 for January)

  var actualMonth = month + 1;
  var color = actualMonth == 1 ? 'january-background' : actualMonth == 2 ? 'february-background' : actualMonth == 3 ? 'march-background' : actualMonth == 4 ? 'april-background' : actualMonth == 5 ? 'may-background' : actualMonth == 6 ? 'june-background' : actualMonth == 7 ? 'july-background' : actualMonth == 8 ? 'august-background' : actualMonth == 9 ? 'september-background' : actualMonth == 10 ? 'october-background' : actualMonth == 11 ? 'november-background' : actualMonth == 12 ? 'december-background' : 'default-background';
  nlapiLogExecution('ERROR', 'Month color', color);
  html = html.replace('{header}', subsidiary);
  html = html.replace('{date}', date);
  html = html.replace('{prdQA}', line4);
  html = html.replace('{prepby}', PreparedBy);
  html = html.replace('{customer}', custm);
  html = html.replace('{Jonumber}', JoNum);
  html = html.replace('{Jonumber2}', JoNum);
  html = html.replace('{color}', color);
  html = html.replace('{body}', line);
  html = html.replace('{body2}', line2);
  html = html.replace('{body3}', line3);
  html = html.replace('{body4}', line5);
  html = html.replace(/&/g, '&amp;');
  var file = nlapiXMLToPDF(html);
  response.setContentType('PDF', 'Inventory Transfer.pdf', 'inline');
  response.write(file.getValue());
}

function getRow(item) {
  var row = "";
  return row.concat(item);
}

function getRow2(desc) {
  var row = "";
  return row.concat(desc);
}

function getRow3(qty) {
  var row = "";
  return row.concat(qty);
}

function getRow4(prdQA) {
  var row = "";
  return row.concat(prdQA);
}

function getRow5(itemUPC) {
  var row = "";
  return row.concat(itemUPC);
}

function logger(str) {
  str.match(/.{1,3000}/g).forEach(function (smallString, idx) {
    nlapiLogExecution('ERROR', 'Html', smallString);
  });
}