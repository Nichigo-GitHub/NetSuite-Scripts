"use strict";

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record'], function (record) {
  // Get the color for the current month
  var currentMonthColor = getMonthColor(); // Entry point for the Suitelet script

  function onRequest(context) {
    var request = context.request,
        response = context.response; // Load the inventory adjustment record

    var printInventoryAdjustmentRecord = record.load({
      type: 'inventoryadjustment',
      id: request.parameters.internalId,
      isDynamic: true
    }); // Extract relevant data from the inventory adjustment record

    var customer = printInventoryAdjustmentRecord.getText({
      fieldId: 'customer'
    }),
        jonum = printInventoryAdjustmentRecord.getText({
      fieldId: 'custbody23'
    }),
        sublistLength = printInventoryAdjustmentRecord.getLineCount({
      sublistId: 'inventory'
    }); // Set the response headers to indicate PDF content

    response.headers['Content-Type'] = 'application/pdf';
    var deduct = 0; // Initialize the deduction counter
    // Iterate over the sublist lines and generate PDF content

    for (var line = 0; line < sublistLength; line++) {
      var item = printInventoryAdjustmentRecord.getSublistText({
        sublistId: 'inventory',
        fieldId: 'item',
        line: line
      }),
          quantity = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: 'inventory',
        fieldId: 'adjustqtyby',
        line: line
      }),
          desc = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: 'inventory',
        fieldId: 'description',
        line: line
      }),
          unit = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: 'inventory',
        fieldId: 'units_display',
        line: line
      }); // Proceed if Adjustment Quantity is non-negative

      if (quantity > 0) {
        // Generate PDF content for the current line
        var pdfContent = generatePDFContent(item, quantity, desc, unit, customer, jonum, line, sublistLength),
            page = line + 1; // Calculate the page number
        // Write the PDF content to the response

        response.write(pdfContent); // Add a page break if it's not the last line

        if (line < sublistLength - 1) {
          response.write("<table><tr><td class='footer'>Page " + [page - deduct] + "</td></tr></table><p style='page-break-after:always;'></p>");
        } else {
          response.write("<table><tr><td class='footer'>Page " + [page - deduct] + "</td></tr></table>");
        }
      } else {
        // Add the number of deduction when a page is skipped
        deduct += 1;
      }
    }
  } // Generate the HTML content for a PDF document


  function generatePDFContent(item, quantity, desc, unit, customer, jonum, line, sublistLength) {
    // Construct the HTML content using inline CSS and dynamic values
    var pdfContent = "<html>" + "<head>" + "<style>" + // CSS styles for the PDF content
    "body { font-family: Arial, Helvetica, sans-serif; }" + "table { border-collapse: collapse; width: 725px; }" + "td { border: 2px solid black; padding: 8px; }" + ".right-aligned { text-align: right; font-size: 12px; font-weight: bold; }" + ".title1 { font-size: 45px; font-weight: bold; }" + ".border { border-style: solid; border-color: black; padding: 4px; }" + ".borderWidth { border-width: 0px 2px 2px 2px; }" + ".title2 { border-width: 0px 2px 0px 2px; font-weight: bold; font-size: 30px; vertical-align: top; }" + ".rawmats { height: 145px; font-weight: bold; font-size: 50px; vertical-align: middle; text-align: center; }" + ".rmDesc { height: 145px; font-weight: bold; font-size: 40px; vertical-align: middle; text-align: center; }" + ".title3 { border-width: 0px 2px 0px 2px; font-weight: bold; font-size: 28px; }" + ".title4 { border-width: 0px 2px 0px 2px; font-weight: bold; font-size: 28px; vertical-align: top; }" + ".dateProcess { width: 195px; border-width: 0px 2px 0px 2px; font-weight: bold; font-size: 16px; vertical-align: top; }" + ".title5 { height: 85px; font-weight: bold; font-size: 32px; vertical-align: middle; text-align: center; }" + ".title6 { font-weight: bold; font-size: 25px; background-color: black; color: white; vertical-align: middle; text-align: center; }" + ".title7 { height: 85px; font-weight: bold; font-size: 30px; vertical-align: middle; text-align: center; }" + ".field { font-weight: bold; vertical-align: top; text-align: center; }" + ".footer { border-width: 0px 0px 0px 0px; text-align: right; font-weight: bold; font-size: 25px; }" + "</style>" + "</head>" + "<body>" + // HTML table structure for the PDF content
    "<table>" + "<tr><td style='margin-top: 20px; background-color: " + currentMonthColor + "; color: #fff; padding: 10px; width: 160px;'></td>" + "<td><span class='title1'>RAW-Materials TAG</span><br>" + "<span style='font-size: 25px; font-weight: bold;'>(For In-house)</span>        " + "<span style='font-size: 20px; font-weight: bold;'><i>WAREHOUSE DEPARTMENT</i></span></td></tr>" + "</table>" + "<table>" + "<tr><td class='right-aligned border borderWidth'>WHSE-RMT-19 REV.01</td></tr>" + "<tr><td class='title2 border'>RAW-MATS CODE:</td></tr>" + "<tr><td class='rawmats border borderWidth'>" + item + "</td></tr>" + "<tr><td class='title2 border'>RM DESCRIPTION:</td></tr>" + "<tr><td class='rmDesc border borderWidth'>" + desc + "</td></tr>" + "</table>" + "<table>" + "<tr><td class='title3 border' style='width: 400px'>PERSON IN CHARGE:</td>" + "<td class='title3 border' style='font-size: 27px'>JO NUMBER:</td></tr>" + "<tr><td class='border borderWidth' style='height: 45px'></td>" + "<td class='border borderWidth field' style='height: 45px'><span style='font-size: 25px;'>" + jonum + "</span></td></tr>" + "</table>" + "<table>" + "<tr><td class='dateProcess border'>PRODUCTION / QA DATE<br>PROCESS:</td>" + "<td class='title4 border' style='width: 195px'>DEL. DATE:</td>" + "<td class='title4 border'>CUSTOMER:</td>" + "<tr><td class='border borderWidth' style='height: 45px'></td>" + "<td class='border borderWidth' style='height: 45px'></td>" + "<td class='border borderWidth field' style='height: 45px'>" + customer + "</td></tr>" + "</table>" + "<table>" + "<tr><td class='title5 border borderWidth' style='width: 195px'>QUANTITY:</td>" + "<td class='title5 border borderWidth'>" + quantity + " " + unit + "<br><span style='font-size: 15px; font-weight: bold;'>(note: This is the quantity for adjustment)</span></td></tr>" + "</table>" + "<table>" + "<tr><td class='title6 border borderWidth' style='width: 195px'>ORIGINAL</td>" + "<td class='title6 border borderWidth'>1st</td>" + "<td class='title6 border borderWidth'>2nd</td>" + "<td class='title6 border borderWidth'>3rd</td>" + "<td class='title6 border borderWidth'>4th</td>" + "<td class='title6 border borderWidth'>5th</td></tr>" + "<tr><td class='border borderWidth' style='height: 85px; width: 115px'></td>" + "<td class='border borderWidth' style='height: 85px'></td>" + "<td class='border borderWidth' style='height: 85px'></td>" + "<td class='border borderWidth' style='height: 85px'></td>" + "<td class='border borderWidth' style='height: 85px'></td>" + "<td class='border borderWidth' style='height: 85px'></td></tr>" + "</table>" + "<table>" + "<tr><td class='title6 border borderWidth' style='height: 20px'></td>" + "<td class='title6 border borderWidth'></td></tr>" + "</table>" + "<table>" + "<tr><td class='title7 border borderWidth' style='width: 195px'>REMARKS:</td>" + "<td class='title7 border borderWidth'></td></tr>" + "</table>" + "</body>" + "</html>";
    return pdfContent;
  } // Get the color for the current month


  function getMonthColor() {
    var currentMonth = new Date().getMonth(),
        // Predefined colors for each month
    colors = ["#008000", "#ffff00", "#0000ff", "#ffa500", "#000000", "#ffc0cb", "#ff0000", "#8f00ff", "#808080", "#adff2f", "#87ceeb", "#8b4513"];
    return colors[currentMonth];
  } // Return the onRequest function as the Suitelet's handler


  return {
    onRequest: onRequest
  };
});