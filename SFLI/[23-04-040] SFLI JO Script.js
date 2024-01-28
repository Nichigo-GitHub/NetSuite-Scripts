function suitelet(request, response) {
	var workorder = nlapiLoadRecord('workorder', request.getParameter('internalid'));
	context = nlapiGetContext();
	//SW Start 
	var subsidary = workorder.getFieldValue("subsidiary");
	var htmlId = (subsidary == "4" ? "custscript_html_indonesia" : subsidary == "18" ? "custscript74" : "custscript26");
	//	html = context.getSetting('SCRIPT', 'custscript26');
	html = context.getSetting('SCRIPT', htmlId);
	//SW End

	tablerow = '';
	//	tablerow2 = '';
	var lineCount = workorder.getLineItemCount('item');
	for (var i = 1; i <= lineCount; i++) {
		//SW Start
		code = (subsidary == "4" ? workorder.getLineItemValue('item', 'custcol_item_display_name', i) : workorder.getLineItemText('item', 'item', i)),
			desc = (subsidary == "4" ? (workorder.getLineItemValue('item', 'custcol_item_purc_desc', i) || "0") : (workorder.getLineItemValue('item', 'description', i) == null) ? 0 : workorder.getLineItemValue('item', 'description', i)),
			desc2 = (subsidary == "4" ? (workorder.getLineItemValue('item', 'description', i) || " ") : (workorder.getLineItemValue('item', 'description', i) == null) ? 0 : workorder.getLineItemValue('item', 'description', i)),
			//SW End
			qty = (workorder.getLineItemValue('item', 'quantity', i) == null) ? 0 : workorder.getLineItemValue('item', 'quantity', i),
			unit = (workorder.getLineItemText('item', 'units', i) == null) ? 0 : workorder.getLineItemText('item', 'units', i)
			;

		if (subsidary == "4") {
			tablerow += addRow1_Indonesia(code, desc + desc2, qty + ' ' + unit, '', '', '', '');
			//        tablerow2 += addRow2_Indonesia(desc2,'','','','','','','','');
		} else {
			tablerow += addRow1(code, desc, qty + ' ' + unit, '', '', '', '');
		}
	}

	var datetemp = nlapiStringToDate(workorder.getFieldValue('trandate'));
	var dy = datetemp.getFullYear();
	var dd = datetemp.getDate();
	var mm = datetemp.getMonth() + 1;
	var dada = dy + "/" + mm + "/" + dd;

	var datetemp2 = nlapiStringToDate(workorder.getFieldValue('enddate'));
	var dy2 = datetemp2.getFullYear();
	var dd2 = datetemp2.getDate();
	var mm2 = datetemp2.getMonth() + 1;
	var dada2 = dy2 + "/" + mm2 + "/" + dd2;

	html = html.replace('{body}', tablerow);
	//  	html = html.replace('{body2}' , tablerow2);
	html = html.replace('{joNum}', workorder.getFieldValue('tranid'));
	html = html.replace('{joNum2}', workorder.getFieldValue('tranid'));
    html = html.replace('{joNum3}', workorder.getFieldValue('tranid'));
	html = html.replace('{date}', dada); // workorder.getFieldValue('trandate')
	html = html.replace('{cust}', workorder.getFieldText('entity'));
	html = html.replace('{cust2}', workorder.getFieldText('entity'));
	html = html.replace('{assemblyItem}', workorder.getFieldText('assemblyitem'));
	html = html.replace('{assemblyItemDesc}', workorder.getFieldValue('custbody240'));
	html = html.replace('{qty}', workorder.getFieldValue('quantity') + ' ' + workorder.getFieldText('units'));
	html = html.replace('{DateNeed}', dada2);//workorder.getFieldValue('enddate'));
	html = html.replace('{TimeNeed}', workorder.getFieldValue('custbody237') || "");
	html = html.replace('{name1}', workorder.getFieldText('custbody220') || "");
	html = html.replace('{upcCode}', workorder.getFieldValue('custbody_upccode'));


	//one
	one = workorder.getFieldValue('custbody226');
	onetext = workorder.getFieldText('custbody226');
	onerow = "";
	if (one != "" && one != null) {
		onerow += Numone(onetext, '', '', '', '', '', '', '', '', '', '');
		html = html.replace('{one}', onerow == null ? '' : onerow);
	}

	//two
	two = workorder.getFieldValue('custbody227');
	twotext = workorder.getFieldText('custbody227');
	tworow = "";
	if (two != "" && two != null) {
		tworow += Numtwo(twotext, '', '', '', '', '', '', '', '', '', '');
		html = html.replace('{two}', tworow == null ? '' : tworow);
	}

	//three 
	three = workorder.getFieldValue('custbody228');
	threetext = workorder.getFieldText('custbody228');
	threerow = "";
	if (three != "" && three != null) {
		threerow += Numthree(threetext, '', '', '', '', '', '', '', '', '', '');
		html = html.replace('{three}', threerow == null ? '' : threerow);
	}

	//four 
	four = workorder.getFieldValue('custbody229');
	fourtext = workorder.getFieldText('custbody229');
	fourrow = "";
	if (four != "" && four != null) {
		fourrow += Numfour(fourtext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{four}', fourrow == null ? '' : fourrow);

	//five 
	five = workorder.getFieldValue('custbody230');
	fivetext = workorder.getFieldText('custbody230');
	fiverow = "";
	if (five != "" && five != null) {
		fiverow += Numfive(fivetext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{five}', fiverow == null ? '' : fiverow);

	//six 
	six = workorder.getFieldValue('custbody231');
	sixtext = workorder.getFieldText('custbody231');
	sixrow = "";
	if (six != "" && six != null) {
		sixrow += Numsix(sixtext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{six}', sixrow == null ? '' : sixrow);
	//seven
	seven = workorder.getFieldValue('custbody232');
	seventext = workorder.getFieldText('custbody232');
	sevenrow = "";
	if (seven != "" && seven != null) {
		sevenrow += Numseven(seventext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{seven}', sevenrow == null ? '' : sevenrow);
	//eight 
	eight = workorder.getFieldValue('custbody233');
	eighttext = workorder.getFieldText('custbody233');
	eightrow = "";
	if (eight != "" && eight != null) {
		eightrow += Numeight(eighttext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{eight}', eightrow == null ? '' : eightrow);
	//nine 
	nine = workorder.getFieldValue('custbody234');
	ninetext = workorder.getFieldText('custbody234');
	ninerow = "";
	if (nine != "" && nine != null) {
		ninerow += Numnine(ninetext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{nine}', ninerow == null ? '' : ninerow);
	//ten 
	ten = workorder.getFieldValue('custbody235');
	tentext = workorder.getFieldText('custbody235');
	tenrow = "";
	if (ten != "" && ten != null) {
		tenrow += Numten(tentext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{ten}', tenrow == null ? '' : tenrow);
	//eleven 
	eleven = workorder.getFieldValue('custbody241');
	eleventext = workorder.getFieldText('custbody241');
	elevenrow = "";
	if (eleven != "" && eleven != null) {
		elevenrow += Numeleven(eleventext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{eleven}', elevenrow == null ? '' : elevenrow);
	//twelve
	twelve = workorder.getFieldValue('custbody242');
	twelvetext = workorder.getFieldText('custbody242');
	twelverow = "";
	if (twelve != "" && twelve != null) {
		twelverow += Numtwelve(twelvetext, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twelve}', twelverow == null ? '' : twelverow);
	//thirteen
	thirteen = workorder.getFieldValue('custbody243');
	thirteentext = workorder.getFieldText('custbody243');
	thirteenrow = "";
	if (thirteen != "" && thirteen != null) {
		thirteenrow += Numthirteen(thirteentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{thirteen}', thirteenrow == null ? '' : thirteenrow);
	//fourteen
	fourteen = workorder.getFieldValue('custbody244');
	fourteentext = workorder.getFieldText('custbody244');
	fourteenrow = "";
	if (fourteen != "" && fourteen != null) {
		fourteenrow += Numfourteen(fourteentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{fourteen}', fourteenrow == null ? '' : fourteenrow);
	//fifteen
	fifteen = workorder.getFieldValue('custbody245');
	fifteentext = workorder.getFieldText('custbody245');
	fifteenrow = "";
	if (fifteen != "" && fifteen != null) {
		fifteenrow += Numfifteen(fifteentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{fifteen}', fifteenrow == null ? '' : fifteenrow);
	//16
	sixteen = workorder.getFieldValue('custbody258');
	sixteentext = workorder.getFieldText('custbody258');
	sixteenrow = "";
	if (sixteen != "" && sixteen != null) {
		sixteenrow += Numsixteen(sixteentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{sixteen}', sixteenrow == null ? '' : sixteenrow);
	//17
	seventeen = workorder.getFieldValue('custbody259');
	seventeentext = workorder.getFieldText('custbody259');
	seventeenrow = "";
	if (seventeen != "" && seventeen != null) {
		seventeenrow += Numseventeen(seventeentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{seventeen}', seventeenrow == null ? '' : seventeenrow);
	//18
	eightteen = workorder.getFieldValue('custbody260');
	eightteentext = workorder.getFieldText('custbody260');
	eightteenrow = "";
	if (eightteen != "" && eightteen != null) {
		eightteenrow += Numeightteen(eightteentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{eightteen}', eightteenrow == null ? '' : eightteenrow);
	//19
	nineteen = workorder.getFieldValue('custbody261');
	nineteentext = workorder.getFieldText('custbody261');
	nineteenrow = "";
	if (nineteen != "" && nineteen != null) {
		nineteenrow += Numnineteen(nineteentext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{nineteen}', nineteenrow == null ? '' : nineteenrow);
	//20
	twenty = workorder.getFieldValue('custbody262');
	twentytext = workorder.getFieldText('custbody262');
	twentyrow = "";
	if (twenty != "" && twenty != null) {
		twentyrow += Numtwenty(twentytext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twenty}', twentyrow == null ? '' : twentyrow);
	//21
	twentyone = workorder.getFieldValue('custbody263');
	twentyonetext = workorder.getFieldText('custbody263');
	twentyonerow = "";
	if (twentyone != "" && twentyone != null) {
		twentyonerow += Numtwentyone(twentyonetext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twentyone}', twentyonerow == null ? '' : twentyonerow);
	//22
	twentytwo = workorder.getFieldValue('custbody264');
	twentytwotext = workorder.getFieldText('custbody264');
	twentytworow = "";
	if (twentytwo != "" && twentytwo != null) {
		twentytworow += Numtwentytwo(twentytwotext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twentytwo}', twentytworow == null ? '' : twentytworow);
	//23
	twentythree = workorder.getFieldValue('custbody265');
	twentythreetext = workorder.getFieldText('custbody265');
	twentythreerow = "";
	if (twentythree != "" && twentythree != null) {
		twentythreerow += Numtwentythree(twentythreetext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twentythree}', twentythreerow == null ? '' : twentythreerow);
	//24
	twentyfour = workorder.getFieldValue('custbody266');
	twentyfourtext = workorder.getFieldText('custbody266');
	twentyfourrow = "";
	if (twentyfour != "" && twentyfour != null) {
		twentyfourrow += Numtwentyfour(twentyfourtext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twentyfour}', twentyfourrow == null ? '' : twentyfourrow);
	//25
	twentyfive = workorder.getFieldValue('custbody267');
	twentyfivetext = workorder.getFieldText('custbody267');
	twentyfiverow = "";
	if (twentyfive != "" && twentyfive != null) {
		twentyfiverow += Numtwentyfive(twentyfivetext, '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twentyfive}', twentyfiverow == null ? '' : twentyfiverow);
	html = html.replace(/&/g, '&amp;');

	var file = nlapiXMLToPDF(html);
	response.setContentType('PDF', 'JobOrder.pdf', 'inline');
	response.write(file.getValue());

	/*************************************INDO PROCESS*********************************/

	one1 = workorder.getFieldValue('custbody400');
	onetext1 = workorder.getFieldValue('custbody400');
	one1row = "";
	if (one1 != "" && one1 != null) {
		one1row += Numone1(onetext1, '', '', '', '', '', '', '', '', '', '');
		html = html.replace('{one1}', one1row == null ? '' : one1row);
	}

	//two
	two2 = workorder.getFieldValue('custbody401');
	twotext2 = workorder.getFieldValue('custbody401');
	two2row = "";
	if (two2 != "" && two2 != null) {
		two2row += Numtwo2(twotext2, '', '', '', '', '', '', '', '', '', '');
		html = html.replace('{two2}', two2row == null ? '' : two2row);
	}

	//three 
	three3 = workorder.getFieldValue('custbody402');
	threetext3 = workorder.getFieldValue('custbody402');
	three3row = "";
	if (three3 != "" && three3 != null) {
		three3row += Numthree3(threetext3, '', '', '', '', '', '', '', '', '', '');
		html = html.replace('{three3}', three3row == null ? '' : three3row);
	}

	//four 
	four4 = workorder.getFieldValue('custbody403');
	fourtext4 = workorder.getFieldValue('custbody403');
	four4row = "";
	if (four4 != "" && four4 != null) {
		four4row += Numfour4(fourtext4, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{four4}', four4row == null ? '' : four4row);

	//five 
	five5 = workorder.getFieldValue('custbody404');
	fivetext5 = workorder.getFieldValue('custbody404');
	five5row = "";
	if (five5 != "" && five5 != null) {
		five5row += Numfive5(fivetext5, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{five5}', five5row == null ? '' : five5row);

	//six 
	six6 = workorder.getFieldValue('custbody405');
	sixtext6 = workorder.getFieldValue('custbody405');
	six6row = "";
	if (six6 != "" && six6 != null) {
		six6row += Numsix6(sixtext6, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{six6}', six6row == null ? '' : six6row);
	//seven
	seven7 = workorder.getFieldValue('custbody406');
	seventext7 = workorder.getFieldValue('custbody406');
	seven7row = "";
	if (seven7 != "" && seven7 != null) {
		seven7row += Numseven7(seventext7, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{seven7}', sevenrow == null ? '' : sevenrow);
	//eight 
	eight8 = workorder.getFieldValue('custbody407');
	eighttext8 = workorder.getFieldValue('custbody407');
	eight8row = "";
	if (eight8 != "" && eight8 != null) {
		eight8row += Numeight8(eighttext8, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{eight8}', eight8row == null ? '' : eight8row);
	//nine 
	nine9 = workorder.getFieldValue('custbody408');
	ninetext9 = workorder.getFieldValue('custbody408');
	nine9row = "";
	if (nine9 != "" && nine9 != null) {
		nine9row += Numnine9(ninetext9, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{nine9}', nine9row == null ? '' : nine9row);
	//ten 
	ten10 = workorder.getFieldValue('custbody409');
	tentext10 = workorder.getFieldValue('custbody409');
	ten10row = "";
	if (ten10 != "" && ten10 != null) {
		ten10row += Numten10(tentext10, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{ten10}', ten10row == null ? '' : ten10row);
	//eleven 
	eleven11 = workorder.getFieldValue('custbody410');
	eleventext11 = workorder.getFieldValue('custbody410');
	eleven11row = "";
	if (eleven11 != "" && eleven11 != null) {
		eleven11row += Numeleven11(eleventext11, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{eleven11}', eleven11row == null ? '' : eleven11row);
	//twelve
	twelve12 = workorder.getFieldValue('custbody411');
	twelvetext12 = workorder.getFieldValue('custbody411');
	twelve12row = "";
	if (twelve12 != "" && twelve12 != null) {
		twelve12row += Numtwelve12(twelvetext12, '', '', '', '', '', '', '', '', '', '');
	}
	html = html.replace('{twelve12}', twelve12row == null ? '' : twelve12row);



}

function addRow1(code, desc, qty, a, b, c, d) {
	return row1 = "<tr>" +
		"<td class='padding borderBottom borderRight'>" + code + "</td>" +
		"<td class='padding borderBottom borderRight'>" + desc + "</td>" +
		"<td class='padding borderBottom borderRight'>" + qty + "</td>" +
		"<td class='padding borderBottom borderRight'>" + a + "</td>" +
		"<td class='padding borderBottom borderRight'>" + b + "</td>" +
		"<td class='padding borderBottom borderRight'>" + c + "</td>" +
		"<td class='padding borderBottom'>" + d + "</td>" +
		"</tr>"
		;
}

function addRow1_Indonesia(code, desc, qty, a, b, c, d) {
	return row1 = "<tr>" +
		"<td class='padding  borderRight' width='150px'>" + code + "</td>" +
		"<td class='padding  borderRight' width='300px'>" + desc + "</td>" +
		"<td class='padding  borderRight'>" + qty + "</td>" +
		"<td class='padding  borderRight'>" + a + "</td>" +
		//	"<td class='padding  borderRight' width='60px'>"+b+"</td>"+
		//	"<td class='padding  borderRight'>"+c+"</td>"+
		"<td class='padding  borderRight' width='50px'></td>" +
		"<td class='padding '>" + d + "</td>" +
		"</tr>"
		;
}

function addRow2_Indonesia(desc2) {
	return row2 = "<tr>" +
		"<td class='padding borderRight borderBottom' height='30px'>" + desc2 + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		"<td class='padding borderRight borderBottom'>" + "</td>" +
		//   			"<td class='padding borderRight borderBottom'>"+i+"</td>"+
		"</tr>"
		;
}

function Numone(onetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>1." + onetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numtwo(twotext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>2." + twotext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numthree(threetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>3." + threetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numfour(fourtext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>4." + fourtext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numfive(fivetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>5." + fivetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numsix(sixtext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>6." + sixtext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numseven(seventext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>7." + seventext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numeight(eighttext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>8." + eighttext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numnine(ninetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>9." + ninetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numten(tentext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>10." + tentext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numeleven(eleventext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>11." + eleventext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" + "<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numtwelve(twelvetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>12." + twelvetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numthirteen(thirteentext, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>13." + thirteentext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" + "<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numfourteen(fourteentext, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>14." + fourteentext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numfifteen(fifteentext, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + fifteentext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numsixteen(sixteen, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + sixteen + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numseventeen(seventeen, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + seventeen + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numeightteen(eightteen, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + eightteen + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numnineteen(nineteen, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + nineteen + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numtwenty(twenty, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + twenty + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numtwentyone(twentyone, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + twentyone + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numtwentytwo(twentytwo, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + twentytwo + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numtwentythree(twentythree, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + twentythree + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numtwentyfour(twentyfour, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + twentyfour + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numtwentyfive(twentyfive, a, b, c, d, e, f, g, h, i) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>15." + twentyfive + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
/*********************INDO JO PROCESS FUNCTION**************************/

function Numone1(onetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>1." + onetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numtwo2(twotext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>2." + twotext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numthree3(threetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>3." + threetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"</tr>"
		;
}
function Numfour4(fourtext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>4." + fourtext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numfive5(fivetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>5." + fivetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numsix6(sixtext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>6." + sixtext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numseven7(seventext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>7." + seventext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numeight8(eighttext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>8." + eighttext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numnine9(ninetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>9." + ninetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numten10(tentext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>10." + tentext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numeleven11(eleventext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>11." + eleventext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" + "<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
}
function Numtwelve12(twelvetext, a, b, c, d, e, f, g, h, i, j) {
	return row1 = "<tr>" +
		"<td class='padding borderRight borderBottom'>12." + twelvetext + "</td>" +
		"<td class='padding borderRight borderBottom'>" + a + "</td>" +
		"<td class='padding borderRight borderBottom'>" + b + "</td>" +
		"<td class='padding borderRight borderBottom'>" + c + "</td>" +
		"<td class='padding borderRight borderBottom'>" + d + "</td>" +
		"<td class='padding borderRight borderBottom'>" + e + "</td>" +
		"<td class='padding borderRight borderBottom'>" + f + "</td>" +
		"<td class='padding borderRight borderBottom'>" + g + "</td>" +
		"<td class='padding borderRight borderBottom'>" + h + "</td>" +
		"<td class='padding borderRight borderBottom'>" + i + "</td>" +
		"<td class='padding borderRight borderBottom'>" + j + "</td>" +
		"</tr>"
		;
} 