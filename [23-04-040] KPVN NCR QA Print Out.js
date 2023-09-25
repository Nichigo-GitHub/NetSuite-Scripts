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
    var NCRnum = customRecord.getFieldValue('custrecord699') || '';
    var RRNo = customRecord.getFieldText('custrecord575') || '';
    var InvoiceNo = customRecord.getFieldValue('custrecord578') || '';
    var ReceivedDate = customRecord.getFieldValue('custrecord579') || '';
    var IssuedDate = customRecord.getFieldValue('custrecord580') || '';
    var RRNo2 = customRecord.getFieldValue('custrecord626') || '';

    var RMcode = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord582', 1) || '';
    var total = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord584', 1) || '';
    var rejquantity = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord585', 1) || '';
    var size = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord583', 1);
    var desc = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord702', 1);
    var limiter = 0;
    var partName = '';
    var defects = [];

    var filters = [new nlobjSearchFilter('transactionnumber', null, 'is', RRNo2)];
    var searchResults = nlapiSearchRecord('itemreceipt', null, filters);

    if (searchResults) {
        for (var i = 0; i < 1; i++) {
            var recordId = searchResults[i].getId();
            var loadedRecord = nlapiLoadRecord('itemreceipt', recordId);

            var location = loadedRecord.getFieldText('location');
            var hanoi = 'hanoi';
            var amata = 'amata';

            // Convert both the input string and the target word to lowercase
            var location = location.toLowerCase();

            // Check if the string contains the target word
            if (location.indexOf(hanoi) !== -1) {
                // The string contains the word hanoi
            } else if (location.indexOf(amata) !== -1) {
                // The string contains the word amata
            } else {
                // matches none, but defaults to hanoi
            }

            var sublistItemCount = loadedRecord.getLineItemCount('item');
            for (var j = 1; j <= sublistItemCount; j++) {
                var sublistValue = loadedRecord.getLineItemValue('item', 'itemdescription', j);

                // Define regular expressions for matching the desired patterns
                const regex1 = /\b((?:(?!\b(?:\d+|\w+F)\b)\b\w+\s*)+)/;
                const regex2 = /\s([0-9*]+mm)/;

                const part1Match = sublistValue.match(regex1);
                const part2Match = sublistValue.match(regex2);

                // Extract the desired parts using match() and the defined regex
                partName = part1Match ? part1Match[1].trim() : '';
                if (size == null)
                    size = part2Match ? part2Match[1].trim() : '';
            }
        }
    }

    for (var i = DEFECT_START; i <= DEFECT_END; i++) {
        var sublistFieldLabel = customRecord.getLineItemField('recmachcustrecord625', 'custrecord' + i, 1) || '';
        var kindOfDefect = sublistFieldLabel.getLabel();
        var numberOfDefect = customRecord.getLineItemValue('recmachcustrecord625', 'custrecord' + i, 1) || '';

        if (limiter == MAX_DEFECTS) {
            break;
        } else if (numberOfDefect > 0) {
            if (numberOfDefect < 10) {
                defects[limiter] = '0' + numberOfDefect + ' - ' + kindOfDefect;
                limiter++;
            } else {
                defects[limiter] = numberOfDefect + ' - ' + kindOfDefect;
                limiter++;
            }
        }
    };

    var arrayOfDefects = defects.join("<br>");

    var html = "<!DOCTYPE HTML>" +
        "<html>" +
        "<head>" +
        "<style type='text/css'>" +
        "* { border-spacing: 0; font-family: Sans-serif; font-size: 11px; margin: 0; }" +
        "h2 { font-size: 15px; }" +
        "h1 { font-size: 20px; }" +
        "table { border-collapse: collapse; }" +
        ".table_unx { table-layout: fixed; width: 100%; }" +
        ".td_unx { white-space: forced; }" +
        ".border { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; border-bottom: .5px solid; }" +
        ".sideBorder { border-left: .5px solid; border-right: .5px solid; }" +
        ".topSideBorder { border-left: .5px solid; border-right: .5px solid; border-top: .5px solid; }" +
        ".bottomSideBorder { border-left: .5px solid double; border-right: .5px solid; border-bottom: .5px solid; }" +
        ".column { height: 50px; }" +
        ".row { display: flex; }" +
        ".width { width: 800px; }" +
        ".img { float: left; margin-bottom: 30px; }" +
        ".floatRight { padding-top: 20px; float: right; }" +
        ".address { font-size: 10px; }" +
        ".PR { font-size: 35px; }" +
        ".bold { font-weight: bold; }" +
        ".paddingLeft { padding-left: 100px; }" +
        ".paddingRight { padding-right: 70px; }" +
        ".paddingBottom { padding-bottom: 25px; }" +
        ".paddingSFLIadd { padding-top: 30px; margin-left: 640px; position: absolute; }" +
        ".borderLeft { border-left: .5px solid; }" +
        ".borderRight { border-right: .5px solid; }" +
        ".borderTop { border-top: .5px solid; }" +
        ".borderBottom { border-bottom: .5px solid; }" +
        ".tableMarginTop3 { height: auto; }" +
        ".tableMarginTop2 { margin-top: 5px; height: auto; }" +
        ".tableMarginTop { margin-top: 25px; height: auto; }" +
        ".tableColor { background-color: black; color: #ffffff; }" +
        ".padding { padding-top: 5px; padding-bottom: 5px; }" +
        ".paddingLR { padding-left: 5px; padding-right: 5px; }" +
        ".grey { background-color: #C0C0C0; }" +
        "footer { width: 800px; height: 30px; font-family: cursive; font-style: normal; }" +
        "</style>" +
        "</head>" +
        "<body width='880px' height='825px' class='width'>" +
        "<table>" +
        "<tr>" +
        "<td width='800px' align='right'>KPVN - 008 </td>" +
        "</tr>" +
        "<tr>" +
        "<td width='800px' align='right'>REV 04</td>" +
        "<tr>" +
        "</table>" +
        "<div style='width: 100%; height: 100%; position: relative;'>" +
        "<div class='img'>" +
        "<image src='https://3389427.app.netsuite.com/core/media/media.nl?id=1138&c=3389427&h=ueq3mWB0n4_ATVXT-t97HWbnG8O8z1kK_E39_Bd7lW3DO6Mb'>" +
        "</image>" +
        "</div><br><br>" +
        "<div class='paddingSFLIadd'> </div>" +
        "<table>" +
        "<tr>" +
        "<td width='500'>" +
        "<h2 align='left'  style='padding-left: 20px'>KANEPACKAGE VIETNAM CO., LTD.<br>QUALITY ASSURANCE DEPARTMENT</h2>" +
        "</td>" +
        "<td width='300'></td>" +
        "<td width='300'><b>Control No.: " + NCRnum + "</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td width='400'></td>" +
        "<td width='100'></td>" +
        "<td width='200'><b> Issue Date: " + IssuedDate + "</b></td>" +
        "</tr>" +
        "</table><br>" +
        "<table class='tableMarginTop'>" +
        "<tr>" +
        "<td width='1000px'>" +
        "<h1 align='center'>NON CONFORMANCE REPORT</h1>" +
        "</td>" +
        "</tr>" +
        "</table>" +
        "<table class='tableMarginTop'>" +
        "<tr>" +
        "<td width='70'><b>to:</b></td>" +
        "<td width='450'><b>" + vendor + "</b></td>" +
        "<td width='70'><b>Nature:</b></td>" +
        "<td width='10' align='center'>⬜</td>" +
        "<td width='90' >Information</td>" +
        "<td width='10'>⬛</td>" +
        "<td width='110'>Critical</td>" +
        "</tr>" +
        "<tr>" +
        "<td width='70'><b>Attn:</b></td>" +
        "<td width='450'></td>" +
        "<td width='70'><b>Disposition:</b></td>" +
        "<td width='10' align='center'>⬛</td>" +
        "<td width='10'>Backload</td>" +
        "<td width='10'>⬜</td>" +
        "<td width='110'>Under Evaluation</td>" +
        "</tr>" +
        "<tr>" +
        "<td width='70'><b>Section IQA:</b></td>" +
        "<td width='450' align='left'></td>" +
        "<td width='70'></td>" +
        "<td width='10'></td>" +
        "<td width='10'></td>" +
        "<td width='10'>⬜</td>" +
        "<td width='110'>Subject for Backload</td>" +
        "</tr>" +
        "<tr>" +
        "<td width='70'></td>" +
        "<td width='450'><b>Rejection Notice No.:_____________________</td>" +
        "<td width='70'></td>" +
        "<td width='10'></td>" +
        "<td width='10'></td>" +
        "<td width='10'>⬜</td>" +
        "<td width='110'>Reject for Disposal</td>" +
        "</tr>" +
        "</table>" +
        "<table class='tableMarginTop'>" +
        "<tr>" +
        "<td width='400' style='font-size:20' align='center'><b>⚫ Quality Management System</b></td>" +
        "<td width='400' style='font-size:20' align='center'><b>⚪ EOHS Management System</b></td>" +
        "</tr>" +
        "</table>" +
        "<table class='border tableMarginTop'>" +
        "<tr>" +
        "<td class='border' width='132'><b>Supplier</b></td>" +
        "<td class='border' width='270' align='center'>" + vendor + "</td>" +
        "<td class='border' width='132'><b>Date Received</b></td>" +
        "<td class='border' width='270' align='center'>" + ReceivedDate + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132'><b>Part Name</b></td>" +
        "<td class='border' width='270' align='center'>" + partName + "</td>" +
        "<td class='border' width='132'><b>Date Inspected</b></td>" +
        "<td class='border' width='270' align='center'>" + IssuedDate + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132'><b>Code RM</b></td>" +
        "<td class='border' width='270' align='center'>" + RMcode + "</td>" +
        "<td class='border' width='132'><b>Lot Size</b></td>" +
        "<td class='border' width='270' align='center'>" + total + " pcs.</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132'><b>Size</b></td>" +
        "<td class='border' width='270' align='center'>" + size + "</td>" +
        "<td class='border' width='132'><b>Act. Quantity</b></td>" +
        "<td class='border' width='270' align='center'>" + total + " pcs.</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132' rowspan='2'><b>Description</b></td>" +
        "<td class='border' width='270' rowspan='2' align='center'>" + desc + "</td>" +
        "<td class='border' width='132'><b>Good Quantity</b></td>" +
        "<td class='border' width='270' align='center'>" + [total - rejquantity] + " pcs.</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132'><b>QTY Reject</b></td>" +
        "<td class='border' width='270' align='center'>" + rejquantity + " pcs.</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132'><b>DA / INV. No</b></td>" +
        "<td class='border' width='270' align='center'>" + InvoiceNo + "</td>" +
        "<td class='border' width='132'><b>% Rejection</b></td>" +
        "<td class='border' width='270' align='center'>" + parseFloat(([rejquantity / total] * 100).toFixed(1)) + "%</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='132'><b>RR No.</b></td>" +
        "<td class='border' width='270' align='center'>" + RRNo + "</td>" +
        "<td class='border' width='132'><b>JO No.</b></td>" +
        "<td class='border' width='269'></td>" +
        "</tr>" +
        "</table>" +
        "<table>" +
        "<tr>" +
        "<td class='border' width='380' valign='top' align='center'><b>DEFECT MODE/NON-CONFORMANCE LAYOUT</b></td>" +
        "<td class='border' width='131' align='center'><b>SECTION</b></td>" +
        "<td class='border' width='131' align='center'><b>ACKNOWLEDGEMENT</b></td>" +
        "<td class='border' width='131' align='center'><b>DISTRIBUTION</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='380' valign='top' rowspan='6' style='padding-left: 20px'><b>" + arrayOfDefects + "</b></td>" +
        "<td class='border' width='131'><b>Purchasing</b></td>" +
        "<td class='border' width='131'></td>" +
        "<td class='border' width='131'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='131'><b>Planning</b></td>" +
        "<td class='border' width='131'></td>" +
        "<td class='border' width='131'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='131'><b>Warehouse</b></td>" +
        "<td class='border' width='131'></td>" +
        "<td class='border' width='131'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='131'><b>Production</b></td>" +
        "<td class='border' width='131'></td>" +
        "<td class='border' width='131'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='131'><b>Sales</b></td>" +
        "<td class='border' width='131'></td>" +
        "<td class='border' width='131'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='border' width='131'><b>QA</b></td>" +
        "<td class='border' width='131'></td>" +
        "<td class='border' width='131'></td>" +
        "</tr>" +
        "</table>" +
        "<table class='sideBorder tableMarginTop3'>" +
        "<tr>" +
        "<td class='sideBorder borderTop' width='20' align='center'>S</td>" +
        "<td class='border' width='780' rowspan='4' colspan='4' valign='top'><b>ROOT CAUSE ANALYSIS:</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>U</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>P</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>P</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>L</td>" +
        "<td class='borderBottom borderLeft' width='390' rowspan='5' colspan='2' valign='top'><b>IMMEDIATE CORRECTIVE ACTION:</b></td>" +
        "<td class='sideBorder' width='390'  colspan='2' align='center'><b>IMPLEMENTATION</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>I</td>" +
        "<td class='borderLeft' width='390' colspan='2'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>E</td>" +
        "<td class='sideBorder' width='390' colspan='2' style='padding-left: 20px'>Date: ___________</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>R</td>" +
        "<td class='sideBorder' width='390' colspan='2' style='padding-left: 20px'>Resp:___________</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' style='height:12px'></td>" +
        "<td class='borderLeft' width='390' colspan='2'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>T</td>" +
        "<td class='borderLeft' width='390' rowspan='6' colspan='2' valign='top'><b>PERMANENT CORRECTIVE ACTION:</b></td>" +
        "<td class='topSideBorder' width='390' colspan='2' align='center'><b>IMPLEMENTATION</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>O</td>" +
        "<td class='borderLeft' width='390' colspan='2'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' style='height:12px'></td>" +
        "<td class='sideBorder' width='390' colspan='2' style='padding-left: 20px'>Date: ___________</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>F</td>" +
        "<td class='sideBorder' width='390' colspan='2' style='padding-left: 20px'>Resp:___________</td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>I</td>" +
        "<td class='sideBorder' width='390' colspan='2'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'>L</td>" +
        "<td class='borderLeft' width='390' colspan='2'></td>" +
        "</tr>" +
        "<tr>" +
        "<td style='border-left: .5px solid;' width='20' align='center'>L</td>" +
        "<td class='border' colspan='4' width='780'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' style='height:12px'></td>" +
        "<td class='borderRight' width='180' style='height:12px'></td>" +
        "<td class='borderRight' width='195' style='height:12px'></td>" +
        "<td class='borderRight' width='200' style='height:12px'></td>" +
        "<td class='borderRight' width='195' style='height:12px'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' align='center'>U</td>" +
        "<td class='borderRight' width='180' style='height:12px'></td>" +
        "<td class='borderRight' width='195' style='height:12px'></td>" +
        "<td class='borderRight' width='200' style='height:12px'></td>" +
        "<td class='borderRight' width='195' style='height:12px'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' align='center'>P</td>" +
        "<td class='borderRight' width='180' style='height:12px'></td>" +
        "<td class='borderRight' width='195' style='height:12px'></td>" +
        "<td class='borderRight' width='200' style='height:12px'></td>" +
        "<td class='borderRight' width='195' style='height:12px'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderBottom borderLeft' width='20'></td>" +
        "<td class='border' width='180' style='height:12px' align='center'><b>PREPARED</b></td>" +
        "<td class='border' width='195' style='height:12px' align='center'><b>CHECKED</b></td>" +
        "<td class='border' width='200' style='height:12px' align='center'><b>APPROVED</b></td>" +
        "<td class='border' width='195' style='height:12px' align='center'><b>DATE</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft' width='20' align='center'></td>" +
        "<td width='180' style='height:12px'></td>" +
        "<td width='195' style='height:12px'></td>" +
        "<td width='200' style='height:12px'></td>" +
        "<td class='borderRight'width='195' style='height:12px'></td>" +
        "</tr>" +
        "</table>" +
        "<table class='topSideBorder tableMarginTop3'>" +
        "<tr>" +
        "<td width='400' align='center'><b>VERIFICATION OF COUNTERMEASURE</b></td>" +
        "<td width='400'></td>" +
        "</tr>" +
        "</table>" +
        "<table class='sideBorder tableMarginTop3'>" +
        "<tr>" +
        "<td class='sideBorder' width='20' align='center'>K</td>" +
        "<td class='borderRight borderTop' width='90' align='center'></td>" +
        "<td class='borderRight borderTop' width='90' align='center'></td>" +
        "<td class='borderRight borderTop' width='100' align='center'></td>" +
        "<td class='borderRight borderTop' width='90' align='center'></td>" +
        "<td class='borderRight borderTop borderBottom' width='400' align='center'><b>Remarks</b></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' align='center'>P</td>" +
        "<td class='borderRight' width='90' align='center'></td>" +
        "<td class='borderRight' width='90' align='center'></td>" +
        "<td class='borderRight' width='100' align='center'></td>" +
        "<td class='borderRight' width='90' align='center'></td>" +
        "<td class='borderRight' width='400' align='center'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' align='center'>V</td>" +
        "<td class='borderRight' width='90' align='center'></td>" +
        "<td class='borderRight' width='90' align='center'></td>" +
        "<td class='borderRight' width='100' align='center'></td>" +
        "<td class='borderRight' width='90' align='center'></td>" +
        "<td class='borderRight' width='400' align='center'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='sideBorder' width='20' align='center'>N</td>" +
        "<td class='borderRight borderBottom borderTop' width='90' align='center'><b>PREPARED</b></td>" +
        "<td class='borderRight borderBottom borderTop' width='90' align='center'><b>CHECKED</b></td>" +
        "<td class='borderRight borderBottom borderTop' width='100' align='center'><b>APPROVED</b></td>" +
        "<td class='borderRight borderBottom borderTop' width='90' align='center'><b>DATE</b></td>" +
        "<td class='borderRight borderBottom' width='400' align='center'></td>" +
        "</tr>" +
        "<tr>" +
        "<td class='borderLeft borderBottom' width='20' height='12px'></td>" +
        "<td class='borderBottom' width='90'></td>" +
        "<td class='borderBottom' width='90'></td>" +
        "<td class='borderBottom' width='100'></td>" +
        "<td class='borderBottom' width='90'></td>" +
        "<td class='borderRight borderBottom' width='400'></td>" +
        "</tr>" +
        "</table>" +
        "<table class='tableMarginTop3'>" +
        "<tr>" +
        "<td width='800' align='center'>Note: Pls Reply within 7 days working days upon receipt</td>" +
        "</tr>" +
        "<tr>" +
        "<td width='800' align='center'>Document keep-1 year: Effective 16-July 16</td>" +
        "</tr>" +
        "</table>" +
        "<br>" +
        "<br>" +
        "<br>" +
        "<br>" +
        "<br>" +
        "<br>" +
        "<table class='tableMarginTop3'>" +
        "<tr>" +
        "<td style='padding-left: 35px;'><b>Prepared by: _________________</b></td>" +
        "<td width='100'></td>" +
        "<td><b>Checked by: _________________</b></td>" +
        "<td width='100'></td>" +
        "<td><b>Approved by: _________________</b></td>" +
        "</tr>" +
        "</table>" +
        "</body>" +
        "</html>";

    response.write(html);
}

// Constants
const DEFECT_START = 589;
const DEFECT_END = 623;
const MAX_DEFECTS = 5;