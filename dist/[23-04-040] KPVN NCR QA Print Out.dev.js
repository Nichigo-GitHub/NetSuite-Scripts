"use strict";

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Oct 2020     Lenovo
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response) {
  var recordId = request.getParameter("internalId");
  var customRecord = nlapiLoadRecord('customrecord1034', recordId);
  var vendor = customRecord.getFieldValue('custrecord576') || '';
  var Owner = customRecord.getFieldText('owner') || '';
  var date = customRecord.getFieldValue('created') || '';
  var modifiedDate = customRecord.getFieldValue('lastmodified') || '';
  var RRNo = customRecord.getFieldText('custrecord575') || '';
  var InvoiceNo = customRecord.getFieldValue('custrecord578') || '';
  var ReceivedDate = customRecord.getFieldValue('custrecord579') || '';
  var IssuedDate = customRecord.getFieldValue('custrecord580') || '';
  var PONo = customRecord.getFieldValue('custrecord581') || '';
  var RRNo2 = customRecord.getFieldValue('custrecord626') || '';
  var RMcode = customRecord.getLineItemText('recmachcustrecord625', 'custrecord582', 1) || '';
  var total = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord584', 1) || '';
  var rejquantity = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord585', 1) || '';
  var size = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord583', 1);
  var partName = '';
  var paperCombi = '';
  var flute = '';
  var limiter = 0;
  var defects = [];
  var filters = [new nlobjSearchFilter('transactionnumber', null, 'is', RRNo2)];
  var searchResults = nlapiSearchRecord('itemreceipt', null, filters);

  if (searchResults) {
    for (var i = 0; i < 1; i++) {
      var recordId = searchResults[i].getId();
      var loadedRecord = nlapiLoadRecord('itemreceipt', recordId);
      var sublistItemCount = loadedRecord.getLineItemCount('item');

      for (var j = 1; j <= sublistItemCount; j++) {
        var sublistValue = loadedRecord.getLineItemValue('item', 'itemdescription', j); // Define regular expressions for matching the desired patterns

        var regex1 = /([A-Z\s\u00C0-\u024F]{2,10})\s+[A-Z\s\u00C0-\u024F]{1,3}\s/;
        var regex2 = /[A-Z\s]{2,50}\s([A-Z\s]{1,3})\s/;
        var regex3 = /\s([A-Z0-9\/*A-Z0-9]+)[\/:]\s+/;
        var regex4 = /\s([0-9*]+mm)/;
        var part1Match = sublistValue.match(regex1);
        var part2Match = sublistValue.match(regex2);
        var part3Match = sublistValue.match(regex3);
        var part4Match = sublistValue.match(regex4); // Extract the desired parts using match() and the defined regex

        partName = part1Match ? part1Match[1].trim() : '';
        flute = part2Match ? part2Match[1].trim() : '';
        paperCombi = part3Match ? part3Match[1].trim() : '';
        if (size == null) size = part4Match ? part4Match[1].trim() : '';
      }

      for (var i = DEFECT_START; i <= DEFECT_END; i++) {
        var sublistFieldLabel = customRecord.getLineItemField('recmachcustrecord625', 'custrecord' + i, 1) || '';
        var kindOfDefect = sublistFieldLabel.getLabel();
        var numberOfDefect = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord' + i, 1) || '';

        if (limiter == MAX_DEFECTS) {
          break;
        } else {
          if (numberOfDefect) {
            defects[limiter] = kindOfDefect + ' = ' + numberOfDefect;
            limiter++;
          } else {}
        }
      }

      ;
      var arrayOfDefects = defects.join("<br>");
    }
  }

  var html = "<!DOCTYPE HTML>" + "<html>" + "<head>" + "<style type='text/css'>" + "* { border-spacing: 0; font-family: Sans-serif; font-size: 11px; margin: 0; }" + "h2 { font-size: 15px; }" + "h1 { font-size: 20px; }" + ".table_unx { table-layout: fixed; width: 100%; }" + ".td_unx { white-space: forced; }" + ".border { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; border-bottom: .5px solid; }" + ".column { height: 50px; }" + ".row { display: flex; }" + ".width { width: 800px; }" + ".img { float: left; margin-bottom: 30px; }" + ".floatRight { padding-top: 20px; float: right; }" + ".address { font-size: 10px; }" + ".PR { font-size: 35px; }" + ".bold { font-weight: bold; }" + ".paddingLeft { padding-left: 100px; }" + ".paddingRight { padding-right: 70px; }" + ".paddingBottom { padding-bottom: 25px; }" + ".paddingSFLIadd { padding-top: 30px; margin-left: 640px; position: absolute; }" + ".borderLeft { border-left: .5px solid; }" + ".borderRight { border-right: .5px solid; }" + ".borderTop { border-top: .5px solid; }" + ".borderBottom { border-bottom: .5px solid; }" + ".tableMarginTop3 { height: auto; }" + ".tableMarginTop2 { margin-top: 5px; height: auto; }" + ".tableMarginTop { margin-top: 25px; height: auto; }" + ".tableColor { background-color: black; color: #ffffff; }" + ".padding { padding-top: 5px; padding-bottom: 5px; }" + ".paddingLR { padding-left: 5px; padding-right: 5px; }" + ".grey { background-color: #C0C0C0; }" + "footer { width: 800px; height: 30px; font-family: cursive; font-style: normal; }" + "</style>" + "</head>" + "<body width='880px' height='825px' class='width'>" + "<table>" + "<tr>" + "<td width='800px' align='right'>KPVN - 008 </td>" + "</tr>" + "<tr>" + "<td width='800px' align='right'>REV 04</td>" + "<tr>" + "</table>" + "<div style='width: 100%; height: 100%; position: relative;'>" + "<div class='img'>" + "<image src='https://3389427.app.netsuite.com/core/media/media.nl?id=1138&c=3389427&h=ueq3mWB0n4_ATVXT-t97HWbnG8O8z1kK_E39_Bd7lW3DO6Mb'>" + "</image>" + "</div><br /><br />" + "<div class='paddingSFLIadd'> </div>" + "<table>" + "<tr>" + "<td class='borderTop borderLeft' width='500'>" + "<h2 align='left'>KANEPACKAGE VIETNAM CO., LTD.<br />QUALITY ASSURANCE DEPARTMENT</h1>" + "</td>" + "<td class='borderTop' width='300'></td>" + "<td class='borderTop borderRight' width='300'><b>Control No.: 23-0700</b></td>" + "</tr>" + "</tr>" + "<tr>" + "<td class='borderLeft borderBottom' width='400'></td>" + "<td class='borderBottom' width='100'></td>" + "<td class='borderBottom borderRight' width='200'><b> Issue Date: " + IssuedDate + "</b></td>" + "</tr>" + "</table><br />" + "<table>" + "<tr>" + "<td width='800px'>" + "<h1 align='center'>NON CONFORMANCE REPORT</h1>" + "</td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop'>" + "<tr>" + "<td class='border' width='200'>to: </td>" + "<td class='border' width='200' align='center'>" + vendor + "</td>" + "<td class='border' width='200'>Nature: </td>" + "<td class='border' width='90' align='center'></td>" + "<td class='border' width='10'></td>" + "<td class='border' width='100'>Critical: </td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Attn:</td>" + "<td class='border' width='200'></td>" + "<td class='border' width='200'>Disposition: </td>" + "<td class='border' width='90'></td>" + "<td class='border' width='10'></td>" + "<td class='border' width='100'>Under Evaluation</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Section IQA: </td>" + "<td class='border' width='200' align='left'></td>" + "<td class='border' width='200'></td>" + "<td class='border' width='90'></td>" + "<td class='border' width='10'></td>" + "<td class='border' width='100'>Subject for Backload</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Rejection Notice No.</td>" + "<td class='border' width='200'></td>" + "<td class='border' width='200'></td>" + "<td class='border' width='90'></td>" + "<td class='border' width='10'></td>" + "<td class='border' width='100'>Reject for Disposal</td>" + "</tr>" + "</table>" + "<table class='tableMarginTop'>" + "<tr>" + "<td width='400' style='font-size:20' align='center'><b>◯ Quality Management System</b></td>" + "<td width='400' style='font-size:20' align='center'><b>◯ EOHS Management System</b></td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop'>" + "<tr>" + "<td class='border' width='200'>Supplier:</td>" + "<td class='border' width='200'>" + vendor + "</td>" + "<td class='border' width='200'>Date Received:</td>" + "<td class='border' width='200'>" + ReceivedDate + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Part Name:</td>" + "<td class='border' width='200'>" + partName + "</td>" + "<td class='border' width='200'>Date Inspected:</td>" + "<td class='border' width='200'>" + IssuedDate + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Code RM:</td>" + "<td class='border' width='200'>" + RMcode + "</td>" + "<td class='border' width='200'>Lot Size:</td>" + "<td class='border' width='200'>" + total + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Size:</td>" + "<td class='border' width='200'>" + size + "</td>" + "<td class='border' width='200'>Act. Quantity</td>" + "<td class='border' width='200'>" + total + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Paper Combination</td>" + "<td class='border' width='200'>" + paperCombi + "</td>" + "<td class='border' width='200'>Good Quantity</td>" + "<td class='border' width='200'>" + [total - rejquantity] + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>Flute</td>" + "<td class='border' width='200'>" + flute + "</td>" + "<td class='border' width='200'>QTY Reject</td>" + "<td class='border' width='200'>" + rejquantity + "</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>DA / INV. No</td>" + "<td class='border' width='200'>" + InvoiceNo + "</td>" + "<td class='border' width='200'>% Rejection</td>" + "<td class='border' width='200'>" + parseInt([rejquantity / total] * 100) + "%</td>" + "</tr>" + "<tr>" + "<td class='border' width='200'>RR No.</td>" + "<td class='border' width='200'>" + RRNo2 + " , " + RRNo + "</td>" + "<td class='border' width='200'>JO No.</td>" + "<td class='border' width='200'></td>" + "</tr>" + "<tr>" + "<td class='border' width='400' valign='top'><b>DEFECT MODE/NON-CONFORMANCE LAYOUT</b></td>" + "<td class='border' width='200'><b>SECTION</b></td>" + "<td class='border' width='100'></td>" + "<td class='border' width='100'><b>DISTRIBUTION</b></td>" + "</tr>" + "<tr>" + "<td class='border' style='height:70px' width='400' valign='top'><b>" + arrayOfDefects + "</b></td>" + "<td class='border' width='200' align='center'>QA</td>" + "<td class='border' width='100'></td>" + "<td class='border' width='100'></td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop2'>" + "<tr>" + "<td class='border' width='20'>S</td>" + "<td class='border' width='780' rowspan='4' valign='top'><b>ROOT CAUSE ANALYSIS:</b></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>U</td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>P</td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>P</td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop3'>" + "<tr>" + "<td class='border' width='20'>L</td>" + "<td class='border' width='390' rowspan='5' valign='top'><b>IMMEDIATE CORRECTIVE ACTION:</b></td>" + "<td class='border' width='390'><b>IMPLEMENTATION:</b></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>I</td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>E</td>" + "<td class='border' width='390'>Date:</td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>R</td>" + "<td class='border' width='390'>Resp:</td>" + "</tr>" + "<tr>" + "<td class='border' width='20' style='height:12px'></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>T</td>" + "<td class='border' width='390' rowspan='6' valign='top'><b>PERMANENT CORRECTIVE ACTION:</b></td>" + "<td class='border' width='390'><b>IMPLEMENTATION:</b></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>O</td>" + "</tr>" + "<tr>" + "<td class='border' width='20' style='height:12px'></td>" + "<td class='border' width='390'></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>F</td>" + "<td class='border' width='390'>Date:</td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>I</td>" + "<td class='border' width='390'>Resp:</td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>L</td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop3'>" + "<tr>" + "<td class='border' width='20'>L</td>" + "<td class='border' width='780'></td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop3'>" + "<tr>" + "<td class='border' width='20' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>U</td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>P</td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "<td class='borderRight' width='195' style='height:12px'></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'></td>" + "<td class='border' width='195' style='height:12px' align='center'>PREPARED</td>" + "<td class='border' width='195' style='height:12px' align='center'>CHECKED</td>" + "<td class='border' width='195' style='height:12px' align='center'>APPROVED</td>" + "<td class='border' width='195' style='height:12px' align='center'>DATE</td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop2'>" + "<tr>" + "<td width='400' align='center'><b>VERIFICATION OF COUNTERMEASURE</b></td>" + "<td width='400'></td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop3'>" + "<tr>" + "<td class='border' width='20'>K</td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight borderBottom' width='400' align='center'><b>Remarks</b></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>P</td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='400' align='center'><b></b></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>V</td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='100' align='center'></td>" + "<td class='borderRight' width='90' align='center'></td>" + "<td class='borderRight' width='400' align='center'><b></b></td>" + "</tr>" + "<tr>" + "<td class='border' width='20'>N</td>" + "<td class='borderRight' width='100' align='center'>PREPARED</td>" + "<td class='borderRight' width='90' align='center'>CHECKED</td>" + "<td class='borderRight' width='100' align='center'>APPROVED</td>" + "<td class='borderRight' width='90' align='center'>DATE</td>" + "<td class='borderRight' width='400' align='center'><b></b></td>" + "</tr>" + "</table>" + "<table class='border tableMarginTop3'>" + "<tr>" + "<td width='800' align='center'>Note: Pls Reply within 7 days working days upon receipt</td>" + "</tr>" + "<tr>" + "<td width='800' align='center'>Document keep-1 year: Effective 16-July 16</td>" + "</tr>" + "</table>" + "</body>" + "</html>";
  response.write(html);
} // Constants


var DEFECT_START = 589;
var DEFECT_END = 623;
var MAX_DEFECTS = 5;