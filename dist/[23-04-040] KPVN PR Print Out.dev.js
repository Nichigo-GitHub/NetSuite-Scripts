"use strict";
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/format'], function (record, format) {
  // Get the color for the current month
  var currentMonthColor = getMonthColor(); // Entry point for the Suitelet script

  function onRequest(context) {
    var request = context.request,
        response = context.response,
        sublist = 'recmachcustrecord_swprd_po_request_id'; // Load the record

    var printPRform = record.load({
      type: 'customrecord_sw_po_request',
      id: request.parameters.internalId
    }); // Extract relevant data from the inventory adjustment record

    var item_code = printPRform.getValue({
      fieldId: 'custrecord_swprd_item'
    }),
        date = printPRform.getText({
      fieldId: 'custrecord_swpr_date'
    }),
        customer = printPRform.getText({
      fieldId: 'custrecord_swpr_customer'
    }),
        vendor = printPRform.getText({
      fieldId: 'custrecord_swpr_vendor'
    }),
        PRnum = printPRform.getValue({
      fieldId: 'custrecord385'
    }),
        POnum = printPRform.getText({
      fieldId: 'custrecord_swc_purchaseorder'
    }),
        currency = printPRform.getValue({
      fieldId: 'custrecord_swpr_currency'
    }),
        sublistLength = printPRform.getLineCount({
      sublistId: sublist
    });
    log.error({
      title: 'item_code',
      details: item_code
    });
    log.error({
      title: 'date',
      details: date
    });
    log.error({
      title: 'customer',
      details: customer
    });
    log.error({
      title: 'vendor',
      details: vendor
    });
    log.error({
      title: 'PRnum',
      details: PRnum
    });
    log.error({
      title: 'POnum',
      details: POnum
    });
    log.error({
      title: 'currency',
      details: currency
    });
    log.error({
      title: 'sublistLength',
      details: sublistLength
    }); // Set the response headers to indicate PDF content

    response.headers['Content-Type'] = 'application/pdf'; // Iterate over the sublist lines and generate PDF content

    for (var line = 0; line < sublistLength; line++) {
      var item = printPRform.getSublistText({
        sublistId: sublist,
        fieldId: 'custrecord_swprd_item',
        line: line
      }),
          itemDesc = printPRform.getSublistValue({
        sublistId: sublist,
        fieldId: 'custrecord_swprd_display_name',
        line: line
      }),
          quantity = printPRform.getSublistValue({
        sublistId: sublist,
        fieldId: 'custrecord_swprd_quantity',
        line: line
      }),
          unit = printPRform.getSublistText({
        sublistId: sublist,
        fieldId: 'custrecord_swprd_unit',
        line: line
      }),
          rateValue = printPRform.getSublistValue({
        sublistId: sublist,
        fieldId: 'custrecord_swprd_rate',
        line: line
      }),
          amountValue = printPRform.getSublistValue({
        sublistId: sublist,
        fieldId: 'custrecord_swprd_amount',
        line: line
      });
      log.error({
        title: 'item',
        details: item
      });
      log.error({
        title: 'itemDesc',
        details: itemDesc
      });
      log.error({
        title: 'quantity',
        details: quantity
      });
      log.error({
        title: 'unit',
        details: unit
      });
      log.error({
        title: 'rateValue',
        details: rateValue
      });
      log.error({
        title: 'amountValue',
        details: amountValue
      });
      quantity = format.format({
        value: quantity,
        type: format.Type.INTEGER
      });

      if (currency == 1) {
        var USD = '⚫';
        var VND = '⚪';
        var sign = '$';
        var signName = 'USD'; // Format as USD currency

        var amount = format.format({
          value: amountValue,
          type: format.Type.CURRENCY
        });
        var rate = format.format({
          value: rateValue,
          type: format.Type.CURRENCY
        });
        amount = String(sign + amount);
        rate = String(sign + rate);
      } else if (currency == 9) {
        var USD = '⚪';
        var VND = '⚫';
        var sign = ' ₫';
        var signName = 'VNĐ'; // Format as VND currency

        var amount = format.format({
          value: amountValue,
          type: format.Type.CURRENCY,
          currency: 'VND' // Specify the currency code

        });
        var rate = format.format({
          value: rateValue,
          type: format.Type.CURRENCY,
          currency: 'VND' // Specify the currency code

        });
        amount = String(amount + sign);
        rate = String(rate + sign);
      } else {
        var USD = '⚪';
        var VND = '⚪';
        var amount = format.format({
          value: amountValue,
          type: format.Type.INTEGER
        });
        var rate = format.format({
          value: rateValue,
          type: format.Type.INTEGER
        });
      }

      log.error({
        title: 'rate',
        details: rate
      });
      log.error({
        title: 'amount',
        details: amount
      });
    } //var arrayOfDefects = defects.join("<br>");


    var pdfContent = generatePDFContent(PRnum, POnum, date, item, quantity, itemDesc, unit, rate, amount, customer, vendor, line, sublistLength, USD, VND, signName);
    response.write(pdfContent);
  } // Generate the HTML content for a PDF document


  function generatePDFContent(PRnum, POnum, date, item, quantity, itemDesc, unit, rate, amount, customer, vendor, line, sublistLength, USD, VND, signName) {
    // Construct the HTML content using inline CSS and dynamic values
    var html = "<!DOCTYPE HTML>" + "<html>" + "<head>" + "<style type='text/css'>" + "* { border-spacing: 0; font-family: Sans-serif; font-size: 11px; margin: 0; }" + "h2 { font-size: 15px; }" + "h1 { font-size: 20px; }" + "table { border-collapse: collapse; }" + ".table_unx { table-layout: fixed; width: 100%; }" + ".td_unx { white-space: forced; }" + ".border { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; border-bottom: .5px solid; }" + ".sideBorder { border-left: .5px solid; border-right: .5px solid; }" + ".topSideBorder { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; }" + ".bottomSideBorder { border-left: .5px solid double; border-right: .5px solid; border-bottom: .5px solid; }" + ".column { height: 50px; }" + ".row { display: flex; }" + ".width { width: 800px; }" + ".img { float: left; margin-bottom: 30px; }" + ".floatRight { padding-top: 20px; float: right; }" + ".address { font-size: 10px; }" + ".PR { font-size: 35px; }" + ".bold { font-weight: bold; }" + ".paddingLeft { padding-left: 100px; }" + ".paddingRight { padding-right: 70px; }" + ".paddingBottom { padding-bottom: 25px; }" + ".paddingSFLIadd { padding-top: 30px; margin-left: 640px; position: absolute; }" + ".borderLeft { border-left: .5px solid; }" + ".borderRight { border-right: .5px solid; }" + ".borderTop { border-top: .5px solid; }" + ".borderBottom { border-bottom: .5px solid; }" + ".tableMarginTop3 { height: auto; }" + ".tableMarginTop2 { margin-top: 5px; height: auto; }" + ".tableMarginTop { margin-top: 25px; height: auto; }" + ".tableColor { background-color: black; color: #ffffff; }" + ".padding { padding-top: 5px; padding-bottom: 5px; }" + ".paddingLR { padding-left: 5px; padding-right: 5px; }" + ".grey { background-color: #C0C0C0; }" + "footer { width: 800px; height: 30px; font-family: cursive; font-style: normal; }" + "</style>" + "</head>" + "<body width='880px' height='825px' class='width'>" + "<div style='width: 100%; height: 100%; position: relative;'>" + "<div class='img'>" + "<image src='https://3389427.app.netsuite.com/core/media/media.nl?id=591&c=3389427&h=e_d0joUP8_NDSRzCrwUd_1WYoJmF-GswOr4_pBQv3vSnSfhA&fcts=20120930202450&whence='>" + "</image>" + "</div>" + "<div class='paddingSFLIadd'> </div>" + "<table>" + "<tr>" + "<td width='664'>" + "<h1 align='center' style='padding-left: 20px;  font-size: 20px;'>KANEPACKAGE VIETNAM CO.,LTD</h1>" + "</td>" + "<td align='right'>KPVN-CIC-002</td>" + "</tr>" + "<tr>" + "<td width='664'>" + "</td>" + "<td align='right'>Rev.00</td>" + "</tr>" + "<tr>" + "<td width='664px' align='center'>Lot 101/2-3, 3B street, AMATA Industrial Park Long Binh ward, Bien Hoa city, Dong Nai province<br>VAT Code: 010158710-001</td>" + "<td>" + "</td>" + "</tr>" + "</table>" + "<table class='tableMarginTop'>" + "<tr>" + "<td class='border' width='150' style='padding-left: 30px;'>DATE:</td>" + "<td class='border' width='150' align='center'>" + date + "</td>" + "<td class='border' width='150'></td>" + "<td width='22'></td>" + "<td class='border' width='120' style='padding-left: 15px;'>REQUEST NO.:</td>" + "<td class='border' width='150' align='center'><b>" + PRnum + "</b></td>" + "</tr>" + "<tr>" + "<td width='150' style='padding-left: 30px; border-bottom: .5px solid; border-left: .5px solid;'>CARRIER:</td>" + "<td width='150' style='border-bottom: .5px solid;'></td>" + "<td width='150' style='border-bottom: .5px solid; border-right: .5px solid;'></td>" + "<td width='22'></td>" + "<td class='border' width='120' rowspan='2' style='padding-left: 15px;'>FOR CUSTOMER:</td>" + "<td class='border' width='150' rowspan='2' align='center'>" + customer + "</td>" + "</tr>" + "<tr>" + "<td width='150'></td>" + "<td width='150'></td>" + "<td width='150'></td>" + "<td width='22'></td>" + "</tr>" + "<tr>" + "<td width='150'></td>" + "<td width='150'></td>" + "<td width='150'></td>" + "<td width='22'></td>" + "<td class='border' width='120' style='padding-left: 15px;'>Customer PO:</td>" + "<td class='border' width='150' align='center'>" + POnum + "</td>" + "</tr>" + "<tr>" + "<td height='20' width='150'></td>" + "<td width='150'></td>" + "<td width='150'></td>" + "<td width='22'></td>" + "</tr>" + "</table>" + "<table style='height: auto;'>" + "<tr>" + "<td width='664'>" + "<h1 align='center' style='padding-left: 20px;  font-size: 20px;'>PURCHASE REQUEST</h1>" + "</td>" + "</tr>" + "</table>" + "<table class='tableMarginTop'>" + "<tr style='height: 40px;'>" + "<td style='padding-left: 30px; border-top: .5px solid; border-left: .5px solid;' width='150'>ORDER TO:</td>" + "<td class='border' width='275' align='center' colspan='2'>" + vendor + "</td>" + "<td width='22'></td>" + "<td style='padding-left: 15px;border-top: .5px solid; border-left: .5px solid; vertical-align: bottom;' width='130'>PLACE OF DELIVERY:</td>" + "<td style='padding-left: 15px;border-top: .5px solid; border-right: .5px solid;' width='130' align='center'></td>" + "</tr>" + "<tr>" + "</tr>" + "<tr style='height: 40px;'>" + "<td style='padding-left: 30px; border-left: .5px solid;' width='150'>ADDRESS:</td>" + "<td style='padding-left: 20px; border-right: .5px solid;' width='275'align='left' colspan='2'>No. 22 Huu Nghi Avenue, Vsip, Thuan An</td>" + "<td width='22'></td>" + "<td style='padding-left: 15px; border-left: .5px solid; vertical-align: bottom;' width='130'>TERM: ⚪ COD<br><span style='padding-left: 38px;'>⚪</span></td>" + "<td style='padding-left: 15px; border-right: .5px solid; vertical-align: bottom;' width='130' align='left'>⚪ 30 DAYS<br>⚪ OTHERS</td>" + "</tr>" + "<tr style='height: 40px;'>" + "<td style='padding-left: 30px; border-bottom: .5px solid; border-left: .5px solid;' width='150'  rowspan='2'>ATTENTION:</td>" + "<td style='padding-left: 20px; border-bottom: .5px solid; border-right: .5px solid;' width='275' align='left' colspan='2' rowspan='2'><b>MS. HUYEN/QUYEN</b></td>" + "<td width='22'></td>" + "<td style='padding-left: 15px; border-left: .5px solid; vertical-align: bottom;' width='130'>MODE: ⚪ CASH<br><span style='padding-left: 38px;'>⚪ CHECK</span></td>" + "<td style='padding-left: 15px; border-right: .5px solid; vertical-align: bottom;' width='130' align='left'>⚪ BANK TRANSFER<br>⚪ OTHERS</td>" + "</tr>" + "</tr>" + "<tr style='height: 20px;'>" + "<td width='22'></td>" + "<td style='padding-left: 15px; border-left: .5px solid; vertical-align: top; border-bottom: .5px solid;' width='130'><span style='padding-left: 38px;'>⚪ TEL. TRNS</span></td>" + "<td class='border' style='padding-left: 15px; border-right: .5px solid; border-bottom: .5px solid; vertical-align: top;' width='130' align='left'>CURRENCY: " + USD + " USD ($)<br><span style='padding-left: 68px'>" + VND + " VNĐ (₫)</span></td>" + "</tr>" + "</table>" + "<table style='margin-top: 15px; height: auto;'>" + "<tr style='background-color: black; color: white;'>" + "<td class='border' width='3' align='center'><b>No.</b></td>" + "<td class='border' width='131' align='center'><b>REQUESTED<br>DELIVERY DATE</b></td>" + "<td class='border' width='131' align='center'><b>KANE CODE</b></td>" + "<td class='border' width='131' align='center'><b>MODEL / CODE / DESCRIPTION</b></td>" + "<td class='border' width='45' align='center'><b>SELLING<br>PRICE</b></td>" + "<td class='border' width='45' align='center'><b>QUANTITY</b></td>" + "<td class='border' width='131' align='center'><b>UNIT PRICE</b></td>" + "<td class='border' width='131' align='center'><b>AMOUNT (in " + signName + ")</b></td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>1</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>2</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>3</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>4</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>5</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>6</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>7</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>8</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>9</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr style='height: 60px;'>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='3' align='center'>10</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' valign='top' style='padding-left: 20px'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + item + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'><b>" + itemDesc + "</b></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'></td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='45' align='center'>" + quantity +
    /* " " + unit +  */
    "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + rate + "</td>" + "<td style='border-left: .5px solid; border-right: .5px solid;' width='131' align='center'>" + amount + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='3'></td>" + "<td class='border' width='131'><b>Planning</b></td>" + "<td class='border' width='131'></td>" + "<td class='border' width='131'></td>" + "<td class='border' width='45'></td>" + "<td class='border' width='45'></td>" + "<td class='border' width='131'></td>" + "<td class='border' width='131'></td>" + "</tr>" + "<tr>" + "<td class='border' width='3'></td>" + "<td class='border' width='131'><b>Warehouse</b></td>" + "<td class='border' width='131'></td>" + "<td class='border' width='131'></td>" + "<td class='border' width='45'></td>" + "<td class='border' width='45'></td>" + "<td class='border' width='131'></td>" + "<td class='border' width='131'></td>" + "</tr>" + "</table>" + "<table class='sideBorder tableMarginTop3'>" + "<tr>" + "<td class='sideBorder borderTop' width='20' align='center'>S</td>" + "<td class='border' width='780' rowspan='4' colspan='4' valign='top'><b>ROOT CAUSE ANALYSIS:</b></td>" + "</tr>" + "</table>" + "<table class='sideBorder tableMarginTop3'>" + "<tr>" + "<td class='sideBorder' width='20' align='center'>K</td>" + "<td class='borderRight borderTop' width='90' align='center'></td>" + "<td class='borderRight borderTop' width='90' align='center'></td>" + "<td class='borderRight borderTop' width='100' align='center'></td>" + "<td class='borderRight borderTop' width='90' align='center'></td>" + "<td class='borderRight borderTop borderBottom' width='400' align='center'><b>Remarks</b></td>" + "</tr>" + "<tr>" + "<td class='sideBorder' width='20' align='center'>P</td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='400' align='center'></td>" + "</tr>" + "<tr>" + "<td class='sideBorder' width='20' align='center'>V</td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='400' align='center'></td>" + "</tr>" + "<tr>" + "<td class='sideBorder' width='20' align='center'>N</td>" + "<td class='borderRight borderBottom borderTop' width='90' align='center'><b>PREPARED</b></td>" + "<td class='borderRight borderBottom borderTop' width='90' align='center'><b>CHECKED</b></td>" + "<td class='borderRight borderBottom borderTop' width='100' align='center'><b>APPROVED</b></td>" + "<td class='borderRight borderBottom borderTop' width='90' align='center'><b>DATE</b></td>" + "<td class='borderRight borderBottom' width='400' align='center'></td>" + "</tr>" + "<tr>" + "<td class='borderLeft borderBottom' width='20' height='12px'></td>" + "<td class='borderBottom' width='90'></td>" + "<td class='borderBottom' width='90'></td>" + "<td class='borderBottom' width='100'></td>" + "<td class='borderBottom' width='90'></td>" + "<td class='borderRight borderBottom' width='400'></td>" + "</tr>" + "</table>" + "</body>" + "</html>";
    return html;
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