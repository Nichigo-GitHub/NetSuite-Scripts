"use strict";

function suitelet(request, response) {
  var workorder = nlapiLoadRecord('workorder', request.getParameter('internalid'));
  context = nlapiGetContext(); //SW Start 

  var subsidary = workorder.getFieldValue("subsidiary"); //	var htmlId = (subsidary == "4" ? "custscript_html_indonesia":"custscript26");

  html = context.getSetting('SCRIPT', 'custscript51'); //	html = context.getSetting('SCRIPT', htmlId);
  //SW End

  tablerow = '';
  var lineCount = workorder.getLineItemCount('item');

  for (var i = 1; i <= lineCount; i++) {
    //SW Start
    code = subsidary == "4" ? workorder.getLineItemValue('item', 'custcol_item_display_name', i) : workorder.getLineItemText('item', 'item', i), //desc = (subsidary == "4" ? (workorder.getLineItemValue('item', 'custcol_item_purc_desc', i)||"0") : (workorder.getLineItemValue('item', 'description', i) == null) ? 0 : workorder.getLineItemValue('item', 'description', i)),
    //SW End
    desc = workorder.getLineItemValue('item', 'description', i) == null ? 0 : workorder.getLineItemValue('item', 'description', i), itemprcdesc = workorder.getLineItemValue('item', 'custcol_item_purc_desc', i) == null ? 0 : workorder.getLineItemValue('item', 'custcol_item_purc_desc', i), part = workorder.getLineItemValue('item', 'custcol199', i) == null ? 0 : workorder.getLineItemValue('item', 'custcol199', i), qty = workorder.getLineItemValue('item', 'quantity', i) == null ? 0 : workorder.getLineItemValue('item', 'quantity', i), unit = workorder.getLineItemText('item', 'units', i) == null ? 0 : workorder.getLineItemText('item', 'units', i), cutSize = workorder.getLineItemValue('item', 'custcol197', i) == null ? 0 : workorder.getLineItemValue('item', 'custcol197', i), cutqty = workorder.getLineItemValue('item', 'custcol198', i) == null ? 0 : workorder.getLineItemValue('item', 'custcol198', i), SO_Number = workorder.getFieldText('createdfrom');
    /* if (SO_Number === false) {
        return;
    } else {
        var memo = nlapiLookupField('salesorder', workorder.getFieldValue('createdfrom'), 'memo', false);
    } */

    blades = nlapiLookupField('lotnumberedassemblyitem', workorder.getFieldValue('assemblyitem'), 'custitem81', false);
    tablerow += addRow1(itemprcdesc + ' ' + part, qty, cutSize, cutqty, +' ' + unit, '', '', '', '', '', '', '');
  }

  html = html.replace('{blades}', blades);
  html = html.replace('{body}', tablerow);
  html = html.replace('{BKCode}', workorder.getFieldValue('custbody383') == null || workorder.getFieldValue('custbody383') == '' ? ' ' : workorder.getFieldValue('custbody383'));
  html = html.replace('{customer1}', workorder.getFieldValue('custbody353') == null || workorder.getFieldValue('custbody353') == '' ? ' ' : workorder.getFieldValue('custbody353'));
  html = html.replace('{customer2}', workorder.getFieldValue('custbody354') == null || workorder.getFieldValue('custbody354') == '' ? ' ' : workorder.getFieldValue('custbody354'));
  html = html.replace('{customer3}', workorder.getFieldValue('custbody355') == null || workorder.getFieldValue('custbody355') == '' ? ' ' : workorder.getFieldValue('custbody355'));
  html = html.replace('{customer4}', workorder.getFieldValue('custbody356') == null || workorder.getFieldValue('custbody356') == '' ? ' ' : workorder.getFieldValue('custbody356'));
  html = html.replace('{customer5}', workorder.getFieldValue('custbody357') == null || workorder.getFieldValue('custbody357') == '' ? ' ' : workorder.getFieldValue('custbody357'));
  html = html.replace('{note1}', workorder.getFieldValue('custbody358') == null || workorder.getFieldValue('custbody358') == '' ? ' ' : workorder.getFieldValue('custbody358'));
  html = html.replace('{note2}', workorder.getFieldValue('custbody359') == null || workorder.getFieldValue('custbody359') == '' ? ' ' : workorder.getFieldValue('custbody359'));
  html = html.replace('{note3}', workorder.getFieldValue('custbody360') == null || workorder.getFieldValue('custbody360') == '' ? ' ' : workorder.getFieldValue('custbody360'));
  html = html.replace('{note4}', workorder.getFieldValue('custbody361') == null || workorder.getFieldValue('custbody361') == '' ? ' ' : workorder.getFieldValue('custbody361'));
  html = html.replace('{note5}', workorder.getFieldValue('custbody362') == null || workorder.getFieldValue('custbody362') == '' ? ' ' : workorder.getFieldValue('custbody362'));
  html = html.replace('{memo}', workorder.getFieldValue('memo') == null || workorder.getFieldValue('memo') == '' ? ' ' : workorder.getFieldValue('memo'));
  html = html.replace('{memoSO}', workorder.getFieldValue('custbody389') == null || workorder.getFieldValue('custbody389') == '' ? ' ' : workorder.getFieldValue('custbody389'));
  html = html.replace('{soNum}', SO_Number);
  html = html.replace('{joNum}', workorder.getFieldValue('tranid'));
  html = html.replace('{IssuedBy}', workorder.getFieldText('custbody_employee'));
  html = html.replace('{date}', workorder.getFieldValue('trandate')); // workorder.getFieldValue('trandate')

  html = html.replace('{cust}', workorder.getFieldText('entity'));
  html = html.replace('{assemblyItem}', workorder.getFieldText('assemblyitem'));
  html = html.replace('{assemblyItemDesc}', workorder.getFieldValue('custbody240'));
  html = html.replace('{qty}', workorder.getFieldValue('quantity') + ' ' + workorder.getFieldText('units'));
  html = html.replace('{DateNeed}', workorder.getFieldValue('enddate')); //workorder.getFieldValue('enddate'));

  html = html.replace('{TimeNeed}', workorder.getFieldValue('custbody237') || "");
  html = html.replace('{name1}', workorder.getFieldText('custbody220') || "");
  html = html.replace('{upcCode}', workorder.getFieldValue('custbody_upccode'));
  /* // Array to store the field IDs to check in the sublist
  var process = [];
  for (var i = 226; i <= 267; i++) {
      process.push('custbody' + i);
      if (i == 245) {
          i += 12;
      }
  }
    // Array to store the field IDs to check in the sublist
  var target = [];
  for (var i = 340; i <= 349; i++) {
      target.push('custbody' + i);
  }
    for (var i = 0; i < process.length; i++) { // Iterate through the array
      nlapiLogExecution('ERROR', 'Target in array: ' + [i + 1], process[i]);
  }
    for (var i = 0; i < process.length; i++) {
      //var
      num = workorder.getFieldValue(process[i]);
      numText = workorder.getFieldText(process[i]);
      if (i > 10)
          targetValue = workorder.getFieldValue(target[i]);
      row = "";
      if (num != "" && num != null) {
          if (i > 10 || i < 13)
              row += numFunc(numtext, '', '', '', '', '', '', '', '');
          else
              row += numFunc2(numtext, '', '', '', '', '', '', '');
              html = html.replace('{num' + i + '}', row == null ? '' : row);
      }
  }
    function numFunc(onetext, a, b, c, d, e, f, g, h) {
      return row = "<tr>" +
          "<td class='borderLeft borderRight borderBottom column'>1." + onetext + "</td>" +
          "<td class='borderRight borderBottom column'>" + a + "</td>" +
          "<td class='borderRight borderBottom column'>" + b + "</td>" +
          "<td class='borderRight borderBottom column'>" + c + "</td>" +
          "<td class='borderRight borderBottom column'>" + d + "</td>" +
          "<td class='borderRight borderBottom column'>" + e + "</td>" +
          "<td class='borderRight borderBottom column'>" + f + "</td>" +
          "<td class='borderRight borderBottom column'>" + g + "</td>" +
          "<td class='borderRight borderBottom borderTop column'>" + h + "</td>" +
          "</tr>";
  }
    function numFunc2(onetext, a, b, c, d, e, f, g) {
      return row = "<tr>" +
          "<td class='borderLeft borderRight borderBottom column'>1." + onetext + "</td>" +
          "<td class='borderRight borderBottom column'>" + a + "</td>" +
          "<td class='borderRight borderBottom column'>" + b + "</td>" +
          "<td class='borderRight borderBottom column'>" + c + "</td>" +
          "<td class='borderRight borderBottom column'>" + d + "</td>" +
          "<td class='borderRight borderBottom column'>" + e + "</td>" +
          "<td class='borderRight borderBottom column'>" + f + "</td>" +
          "<td class='borderRight borderBottom column'>" + g + "</td>" +
          "</tr>";
  } */
  //one

  one = workorder.getFieldValue('custbody226');
  onetext = workorder.getFieldText('custbody226');
  target = workorder.getFieldValue('custbody340');
  onerow = "";

  if (one != "" && one != null) {
    onerow += Numone(onetext, '', '', '', '', '', '', '', '');
    html = html.replace('{one}', onerow == null ? '' : onerow);
  } //two


  two = workorder.getFieldValue('custbody227');
  twotext = workorder.getFieldText('custbody227');
  target = workorder.getFieldValue('custbody341');
  tworow = "";

  if (two != "" && two != null) {
    tworow += Numtwo(twotext, '', '', '', '', '', '', '', '', '');
    html = html.replace('{two}', tworow == null ? '' : tworow);
  } //three 


  three = workorder.getFieldValue('custbody228');
  threetext = workorder.getFieldText('custbody228');
  target = workorder.getFieldValue('custbody342');
  threerow = "";

  if (three != "" && three != null) {
    threerow += Numthree(threetext, '', '', '', '', '', '', '', '', '');
    html = html.replace('{three}', threerow == null ? '' : threerow);
  } //four 


  four = workorder.getFieldValue('custbody229');
  fourtext = workorder.getFieldText('custbody229');
  target = workorder.getFieldValue('custbody343');
  fourrow = "";

  if (four != "" && four != null) {
    fourrow += Numfour(fourtext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{four}', fourrow == null ? '' : fourrow); //five 

  five = workorder.getFieldValue('custbody230');
  fivetext = workorder.getFieldText('custbody230');
  target = workorder.getFieldValue('custbody344');
  fiverow = "";

  if (five != "" && five != null) {
    fiverow += Numfive(fivetext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{five}', fiverow == null ? '' : fiverow); //six 

  six = workorder.getFieldValue('custbody231');
  sixtext = workorder.getFieldText('custbody231');
  target = workorder.getFieldValue('custbody345');
  sixrow = "";

  if (six != "" && six != null) {
    sixrow += Numsix(sixtext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{six}', sixrow == null ? '' : sixrow); //seven

  seven = workorder.getFieldValue('custbody232');
  seventext = workorder.getFieldText('custbody232');
  target = workorder.getFieldValue('custbody346');
  sevenrow = "";

  if (seven != "" && seven != null) {
    sevenrow += Numseven(seventext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{seven}', sevenrow == null ? '' : sevenrow); //eight 

  eight = workorder.getFieldValue('custbody233');
  eighttext = workorder.getFieldText('custbody233');
  target = workorder.getFieldValue('custbody347');
  eightrow = "";

  if (eight != "" && eight != null) {
    eightrow += Numeight(eighttext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{eight}', eightrow == null ? '' : eightrow); //nine 

  nine = workorder.getFieldValue('custbody234');
  ninetext = workorder.getFieldText('custbody234');
  target = workorder.getFieldValue('custbody348');
  ninerow = "";

  if (nine != "" && nine != null) {
    ninerow += Numnine(ninetext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{nine}', ninerow == null ? '' : ninerow); //ten 

  ten = workorder.getFieldValue('custbody235');
  tentext = workorder.getFieldText('custbody235');
  target = workorder.getFieldValue('custbody349');
  tenrow = "";

  if (ten != "" && ten != null) {
    tenrow += Numten(tentext, '', '', '', '', '', '', '', '', '');
  }

  html = html.replace('{ten}', tenrow == null ? '' : tenrow); //eleven 

  eleven = workorder.getFieldValue('custbody241');
  eleventext = workorder.getFieldText('custbody241');
  elevenrow = "";

  if (eleven != "" && eleven != null) {
    elevenrow += Numeleven(eleventext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{eleven}', elevenrow == null ? '' : elevenrow); //twelve

  twelve = workorder.getFieldValue('custbody242');
  twelvetext = workorder.getFieldText('custbody242');
  twelverow = "";

  if (twelve != "" && twelve != null) {
    twelverow += Numtwelve(twelvetext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twelve}', twelverow == null ? '' : twelverow); //thirteen

  thirteen = workorder.getFieldValue('custbody243');
  thirteentext = workorder.getFieldText('custbody243');
  thirteenrow = "";

  if (thirteen != "" && thirteen != null) {
    thirteenrow += Numthirteen(thirteentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{thirteen}', thirteenrow == null ? '' : thirteenrow); //fourteen

  fourteen = workorder.getFieldValue('custbody244');
  fourteentext = workorder.getFieldText('custbody244');
  fourteenrow = "";

  if (fourteen != "" && fourteen != null) {
    fourteenrow += Numfourteen(fourteentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{fourteen}', fourteenrow == null ? '' : fourteenrow); //fifteen

  fifteen = workorder.getFieldValue('custbody245');
  fifteentext = workorder.getFieldText('custbody245');
  fifteenrow = "";

  if (fifteen != "" && fifteen != null) {
    fifteenrow += Numfifteen(fifteentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{fifteen}', fifteenrow == null ? '' : fifteenrow); //16

  sixteen = workorder.getFieldValue('custbody258');
  sixteentext = workorder.getFieldText('custbody258');
  sixteenrow = "";

  if (sixteen != "" && sixteen != null) {
    sixteenrow += Numsixteen(sixteentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{sixteen}', sixteenrow == null ? '' : sixteenrow); //17

  seventeen = workorder.getFieldValue('custbody259');
  seventeentext = workorder.getFieldText('custbody259');
  seventeenrow = "";

  if (seventeen != "" && seventeen != null) {
    seventeenrow += Numseventeen(seventeentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{seventeen}', seventeenrow == null ? '' : seventeenrow); //18

  eightteen = workorder.getFieldValue('custbody260');
  eightteentext = workorder.getFieldText('custbody260');
  eightteenrow = "";

  if (eightteen != "" && eightteen != null) {
    eightteenrow += Numeightteen(eightteentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{eightteen}', eightteenrow == null ? '' : eightteenrow); //19

  nineteen = workorder.getFieldValue('custbody261');
  nineteentext = workorder.getFieldText('custbody261');
  nineteenrow = "";

  if (nineteen != "" && nineteen != null) {
    nineteenrow += Numnineteen(nineteentext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{nineteen}', nineteenrow == null ? '' : nineteenrow); //20

  twenty = workorder.getFieldValue('custbody262');
  twentytext = workorder.getFieldText('custbody262');
  twentyrow = "";

  if (twenty != "" && twenty != null) {
    twentyrow += Numtwenty(twentytext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twenty}', twentyrow == null ? '' : twentyrow); //21

  twentyone = workorder.getFieldValue('custbody263');
  twentyonetext = workorder.getFieldText('custbody263');
  twentyonerow = "";

  if (twentyone != "" && twentyone != null) {
    twentyonerow += Numtwentyone(twentyonetext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twentyone}', twentyonerow == null ? '' : twentyonerow); //22

  twentytwo = workorder.getFieldValue('custbody264');
  twentytwotext = workorder.getFieldText('custbody264');
  twentytworow = "";

  if (twentytwo != "" && twentytwo != null) {
    twentytworow += Numtwentytwo(twentytwotext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twentytwo}', twentytworow == null ? '' : twentytworow); //23

  twentythree = workorder.getFieldValue('custbody265');
  twentythreetext = workorder.getFieldText('custbody265');
  twentythreerow = "";

  if (twentythree != "" && twentythree != null) {
    twentythreerow += Numtwentythree(twentythreetext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twentythree}', twentythreerow == null ? '' : twentythreerow); //24

  twentyfour = workorder.getFieldValue('custbody266');
  twentyfourtext = workorder.getFieldText('custbody266');
  twentyfourrow = "";

  if (twentyfour != "" && twentyfour != null) {
    twentyfourrow += Numtwentyfour(twentyfourtext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twentyfour}', twentyfourrow == null ? '' : twentyfourrow); //25

  twentyfive = workorder.getFieldValue('custbody267');
  twentyfivetext = workorder.getFieldText('custbody267');
  twentyfiverow = "";

  if (twentyfive != "" && twentyfive != null) {
    twentyfiverow += Numtwentyfive(twentyfivetext, '', '', '', '', '', '', '', '');
  }

  html = html.replace('{twentyfive}', twentyfiverow == null ? '' : twentyfiverow);
  response.write(html);
}

function addRow1(itemprcdesc, qty, a, b, c, d, e, f, g) {
  return row1 = "<tr>" + "<td class='padding borderLeft borderBottom borderRight' width='200px'>" + itemprcdesc + " </td>" + "<td class='padding borderBottom borderRight'>" + qty + "</td>" + "<td class='padding borderBottom borderRight'>" + a + "</td>" + "<td class='padding borderBottom borderRight'>" + b + "</td>" + "<td class='padding borderBottom borderRight'>" + c + "</td>" + "<td class='padding borderBottom borderRight width='160px''>" + d + "</td>" + "<td class='padding borderBottom borderRight'>" + e + "</td>" + "<td class='padding borderBottom borderRight'>" + f + "</td>" + "<td class='padding borderBottom borderRight'>" + g + "</td>" + "</tr>";
}

function addRow1_Indonesia(code, desc, qty, a, b, c, d) {
  return row1 = "<tr>" + "<td class='padding  borderRight' width='150px'>" + code + "</td>" + "<td class='padding  borderRight' width='300px'>" + desc + "</td>" + "<td class='padding  borderRight'>" + qty + "</td>" + "<td class='padding  borderRight'>" + a + "</td>" + "<td class='padding  borderRight' width='60px'>" + b + "</td>" + "<td class='padding  borderRight'>" + c + "</td>" + "<td class='padding  borderRight' width='50px'></td>" + "<td class='padding '>" + d + "</td>" + "</tr>";
}

function Numone(onetext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft borderRight borderBottom column'>1." + onetext + "</td>" + "<td class='borderRight borderBottom column'>" + a + "</td>" + "<td class='borderRight borderBottom column'>" + b + "</td>" + "<td class='borderRight borderBottom column'>" + c + "</td>" + "<td class='borderRight borderBottom column'>" + d + "</td>" + "<td class='borderRight borderBottom column'>" + e + "</td>" + "<td class='borderRight borderBottom column'>" + f + "</td>" + "<td class='borderRight borderBottom column'>" + g + "</td>" + "<td class='borderRight borderBottom borderTop column'>" + h + "</td>" + "</tr>";
}

function Numtwo(twotext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>2." + twotext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numthree(threetext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>3." + threetext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numfour(fourtext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>4." + fourtext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numfive(fivetext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>5." + fivetext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numsix(sixtext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>6." + sixtext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numseven(seventext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>7." + seventext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numeight(eighttext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>8." + eighttext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numnine(ninetext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>9." + ninetext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numten(tentext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>10." + tentext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numeleven(eleventext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>11." + eleventext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "</tr>";
}

function Numtwelve(twelvetext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>12." + twelvetext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "</tr>";
}

function Numthirteen(thirteentext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>13." + thirteentext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "</tr>";
}

function Numfourteen(fourteentext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>14." + fourteentext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "</tr>";
}

function Numfifteen(fifteentext, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='borderLeft padding borderRight borderBottom column'>15." + fifteentext + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "</tr>";
}

function Numsixteen(sixteen, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom column'>15." + sixteen + "</td>" + "<td class='padding borderRight borderBottom column'>" + a + "</td>" + "<td class='padding borderRight borderBottom column'>" + b + "</td>" + "<td class='padding borderRight borderBottom column'>" + c + "</td>" + "<td class='padding borderRight borderBottom column'>" + d + "</td>" + "<td class='padding borderRight borderBottom column'>" + e + "</td>" + "<td class='padding borderRight borderBottom column'>" + f + "</td>" + "<td class='padding borderRight borderBottom column'>" + g + "</td>" + "<td class='padding borderRight borderBottom column'>" + h + "</td>" + "</tr>";
}

function Numseventeen(seventeen, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + seventeen + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numeightteen(eightteen, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + eightteen + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numnineteen(nineteen, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + nineteen + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numtwenty(twenty, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + twenty + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numtwentyone(twentyone, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + twentyone + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numtwentytwo(twentytwo, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + twentytwo + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numtwentythree(twentythree, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + twentythree + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numtwentyfour(twentyfour, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + twentyfour + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}

function Numtwentyfive(twentyfive, a, b, c, d, e, f, g, h) {
  return row1 = "<tr>" + "<td class='padding borderRight borderBottom'>15." + twentyfive + "</td>" + "<td class='padding borderRight borderBottom'>" + a + "</td>" + "<td class='padding borderRight borderBottom'>" + b + "</td>" + "<td class='padding borderRight borderBottom'>" + c + "</td>" + "<td class='padding borderRight borderBottom'>" + d + "</td>" + "<td class='padding borderRight borderBottom'>" + e + "</td>" + "<td class='padding borderRight borderBottom'>" + f + "</td>" + "<td class='padding borderRight borderBottom'>" + g + "</td>" + "<td class='padding borderRight borderBottom'>" + h + "</td>" + "</tr>";
}