/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Sep 2020     Lenovo
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

	function RRprintout(request, response){
		var RRPO = nlapiLoadRecord('itemreceipt', request.getParameter("internalId")),
			subsidiary = RRPO.getFieldText('subsidiary'),
			Reference = RRPO.getFieldValue('tranid'),
			date = RRPO.getFieldValue('trandate'),
			supplier = RRPO.getFieldText('entity'),
            ponofull  = RRPO.getFieldText('createdfrom'),
            pono = 'PO ' + ponofull.substring(15),
            DrNo = RRPO.getFieldValue('custbody28'),
	

			lineCount = RRPO.getLineItemCount('item'),
			
			line = "",
			item,
			drNo,
			desc,
			Decquantity,
			quantity,
			
	      

			html = nlapiGetContext().getSetting('SCRIPT', 'custscript58');
	     nlapiLogExecution('ERROR','lineCount',lineCount);
		for(var i = 1; i <= lineCount; i++){
			item = RRPO.getLineItemValue('item', 'itemname', i); item = (item == null) ? "" : item;
			drNo = RRPO.getLineItemValue('item', 'custcol6', i); drNo = (drNo == null) ? "" : drNo;
			desc = RRPO.getLineItemValue('item', 'itemdescription', i); desc = (desc == null) ? "" : desc;
			Decquantity = RRPO.getLineItemValue('item', 'custcol68', i); Decquantity = (Decquantity == null) ? "" : Decquantity;
			quantity = RRPO.getLineItemValue('item', 'quantity', i); quantity = (quantity == null) ? "" : quantity;

			line = line.concat(getRow(item , DrNo , pono , desc , Decquantity, quantity));

		}

		subsidiary = (subsidiary == null) ? "" : subsidiary;
		Reference = (Reference == null) ? "" : Reference;
		//PO = (PO == null) ? "" : PO;
		date = (date == null) ? "" : date;
		supplier = (supplier == null) ? "" : supplier;
        DrNo = (DrNo == null) ? "" : DrNo;
	  


		//html = html.replace('{header}', subsidiary);
		html = html.replace('{Reference}', Reference);
		//html = html.replace('{PO}', PO);
		html = html.replace('{date}', date);
      	html = html.replace('{supplier}', supplier);
		html = html.replace('{body}', line);
		response.write(html);
	}

	function getRow(item , DrNo , pono , desc , Decquantity, quantity){
					var row = "";

					return row.concat("<table class='table_unx'  width='800px'>",
					"<tr>",
                    "<td class = 'table_unx borderTop borderLeft borderBottom' width='100px' style='font-size:20px' align='center'>", DrNo, "</td>",
				//	"<td class='table_unx borderTop borderLeft borderBottom' width='100px' style='font-size:16px' align='center'>"+ '' +"</td>",
                   	"<td class = 'table_unx borderTop borderLeft borderBottom' width='150px' style='font-size:20px' align='center'>", pono, "</td>",
					"<td class = 'table_unx borderTop borderLeft borderBottom' width='450px' style='font-size:20px' align='center'>", desc, "</td>",
					"<td class = 'table_unx borderTop borderLeft borderBottom' width='50px' style='font-size:20px' align='center'>", Decquantity, "</td>",
					"<td class = 'table_unx borderTop borderLeft borderRight borderBottom' width='50px' style='font-size:20px' align='center'>", quantity, "</td>",
					"</tr>",
	                                  "</table>"
					);
		}


