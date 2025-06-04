/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file'], function (render, record, file) {

    function onRequest(context) {
        var recId = context.request.parameters.recordId;
        var kpcebuParam = context.request.parameters.kpcebu;
        var kpcebuSize = '';
        if (kpcebuParam) {
            if (kpcebuParam.toLowerCase() === 'big') {
                kpcebuSize = 'big';
            } else if (kpcebuParam.toLowerCase() === 'small') {
                kpcebuSize = 'small';
            }
        }
        var rec = record.load({
            type: 'customrecord2097',
            id: recId
        });

        var fieldText = rec.getText({
            fieldId: 'custrecord926'
        });
        var trimmedLot = fieldText.replace(/Work Order\s*#/g, '').trim();

        var customer = rec.getText('custrecord927') || '';
        var itemDesc = rec.getText('custrecord929') || '';
        var itemCode = rec.getText('custrecord928') || '';
        var model = rec.getText('custrecord930') || '';
        var quantity = rec.getValue('custrecord931') || '';
        var numOfLabels = rec.getValue('custrecord932') || '';

        if (!kpcebuParam) {
            var xml = '<?xml version="1.0"?><pdf><head><style>';
            xml += 'table { font-size: 7pt; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; } ';
            xml += '.labelTable { border: 1px solid black; width: 200px; height: 114px; margin-right: -25px;}';
            xml += '</style></head><body>';

            var labelsPerRow = 3;
            var totalLabels = numOfLabels; // Total labels to print

            for (var i = 0; i < totalLabels; i++) {
                if (i % labelsPerRow === 0) {
                    xml += '<table><tr>'; // start a new row
                }

                xml += '<td style="margin-top: -3px; margin-bottom: -3px; padding-right: -8px; padding-left: -8px;"><table class="labelTable">' +
                    '<tr><td colspan="3" align="center" style="border-bottom: 1px;"><b>SUPERFLEX LOGISTIC INC.</b></td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">CUSTOMER:</td><td colspan="2" align="center" style="border-bottom: 1px;">' + customer + '</td></tr>' +
                    '<tr><td align="center" style="border-right: 1px;" valign="bottom">ITEM</td><td colspan="2" rowspan="2" align="center" style="border-bottom: 1px;">' + itemDesc + '</td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;" valign="top">DESCRIPTION:</td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">ITEM CODE:</td><td colspan="2" align="center" style="border-bottom: 1px;">' + itemCode + '</td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;" valign="middle">MODEL:</td><td align="center" style="border-bottom: 1px; border-right: 1px;">' + model + '</td>' +
                    '<td align="center" rowspan="3" valign="middle"><b>RoHS<br />OQA<br />PASSED</b></td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">LOT NUMBER:</td><td align="center" style="border-bottom: 1px; border-right: 1px;">' + trimmedLot + '</td></tr>' +
                    '<tr><td align="center" style="border-right: 1px;">QUANTITY:</td><td align="center" style="border-right: 1px;">' + quantity + '</td></tr>' +
                    '</table></td>';

                if ((i + 1) % labelsPerRow === 0) {
                    xml += '</tr></table>'; // end the row
                }
            }

            if (totalLabels % labelsPerRow !== 0) {
                xml += '</tr></table>'; // close final row if not full
            }

            xml += '</body></pdf>';
        } else if (kpcebuSize === 'big') {
            var xml = '<?xml version="1.0"?><pdf><head><style>';
            xml += 'table { font-size: 7pt; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; } ';
            xml += '.labelTable { border: 1px solid black; width: 320px; height: 114px; margin-right: 0px; background-color: #ec3b83;}'; // Increased width, removed negative margin
            xml += '</style>';
            xml += '<page orientation="landscape" size="A4" header="nlheader" footer="nlfooter" padding="10px 10px 10px 10px"></page>';
            xml += '</head><body>';

            var labelsPerRow = 2;
            var totalLabels = numOfLabels; // Total labels to print

            for (var i = 0; i < totalLabels; i++) {
                if (i % labelsPerRow === 0) {
                    xml += '<table><tr>'; // start a new row
                }

                var lotFontSize = String(trimmedLot).indexOf("SFLI-JO-") !== -1 ? "4.5pt" : "inherit";
                xml += '<td style="margin-top: -3px; margin-bottom: -3px; padding-right: 0px; padding-left: 0px;"><table class="labelTable">' +
                    '<tr>' +
                    '<td style="width:10; border-bottom: 1px;" align="right" valign="top">' +
                    '<img src="https://3389427.app.netsuite.com/core/media/media.nl?id=357289&amp;c=3389427&amp;h=bBelVHtmEpk8_EVgFppomQZOP8wWxjlexgiX9-orUAvW6qcz&amp;fcts=20250603011305&amp;whence=" width="10" height="10" />' +
                    '</td>' +
                    '<td colspan="4" align="left" valign="bottom" style="border-bottom: 1px;"><b>KANEPACKAGE PHILIPPINE, INC.</b></td>' +
                    '</tr>' +
                    '<tr style="display:none;"></tr>' +
                    '<tr><td colspan="2" align="left">CUSTOMER</td><td>:</td><td colspan="2" align="left" style="">' + customer + '</td></tr>' +
                    '<tr><td colspan="2" align="left">ITEM CODE</td><td>:</td><td colspan="2" align="left" style="color: white; font-weight: bold;">' + itemCode + '</td></tr>' +
                    '<tr><td colspan="2" align="left" valign="middle">ITEM DESC</td><td valign="middle">:</td><td colspan="2" align="left" style="color: white; font-weight: bold;">' + itemDesc + '</td></tr>' +
                    '<tr><td colspan="2" align="left">LOT NO.</td><td>:</td><td align="left" valign="middle" style="border-right: 1px; color: white; font-weight: bold; font-size: ' + lotFontSize + ';">' + trimmedLot + '</td>' +
                    '<td align="center" valign="middle" style="border-top: 1px;"><b>RoHS OK</b></td></tr>' +
                    '<tr><td colspan="2" align="left">QUANTITY</td><td>:</td><td align="left" style="border-right: 1px; color: white; font-weight: bold;">' + quantity + '</td>' +
                    '<td align="center" valign="middle" style="border-top: 1px;"><b>QA-PASSED</b></td></tr>' +
                    '</table></td>';

                if ((i + 1) % labelsPerRow === 0) {
                    xml += '</tr></table>'; // end the row
                }
            }

            if (totalLabels % labelsPerRow !== 0) {
                xml += '</tr></table>'; // close final row if not full
            }

            xml += '</body></pdf>';
        } else if (kpcebuSize === 'small') {
            var xml = '<?xml version="1.0"?><pdf><head><style>';
            xml += 'table { font-size: 7pt; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; } ';
            xml += '.labelTable { border: 1px solid black; width: 200px; height: 114px; margin-right: -25px; background-color: #ec3b83;}';
            xml += '</style></head><body>';

            var labelsPerRow = 3;
            var totalLabels = numOfLabels; // Total labels to print

            for (var i = 0; i < totalLabels; i++) {
                if (i % labelsPerRow === 0) {
                    xml += '<table><tr>'; // start a new row
                }

                var lotFontSize = String(trimmedLot).indexOf("SFLI-JO-") !== -1 ? "4.5pt" : "inherit";
                xml += '<td style="margin-top: -3px; margin-bottom: -3px; padding-right: -8px; padding-left: -8px;"><table class="labelTable">' +
                    '<tr>' +
                    '<td style="width:10; border-bottom: 1px;" align="right" valign="top">' +
                    '<img src="https://3389427.app.netsuite.com/core/media/media.nl?id=357289&amp;c=3389427&amp;h=bBelVHtmEpk8_EVgFppomQZOP8wWxjlexgiX9-orUAvW6qcz&amp;fcts=20250603011305&amp;whence=" width="10" height="10" />' +
                    '</td>' +
                    '<td colspan="4" align="left" valign="bottom" style="border-bottom: 1px;"><b>KANEPACKAGE PHILIPPINE, INC.</b></td>' +
                    '</tr>' +
                    '<tr style="display:none;"></tr>' +
                    '<tr><td colspan="2" align="left">CUSTOMER</td><td>:</td><td colspan="2" align="left" style="">' + customer + '</td></tr>' +
                    '<tr><td colspan="2" align="left">ITEM CODE</td><td>:</td><td colspan="2" align="left" style="color: white; font-weight: bold;">' + itemCode + '</td></tr>' +
                    '<tr><td colspan="2" align="left" valign="middle">ITEM DESC</td><td valign="middle">:</td><td colspan="2" align="left" style="color: white; font-weight: bold;">' + itemDesc + '</td></tr>' +
                    '<tr><td colspan="2" align="left">LOT NO.</td><td>:</td><td align="left" valign="middle" style="border-right: 1px; color: white; font-weight: bold; font-size: ' + lotFontSize + ';">' + trimmedLot + '</td>' +
                    '<td align="center" valign="middle" style="border-top: 1px;"><b>RoHS OK</b></td></tr>' +
                    '<tr><td colspan="2" align="left">QUANTITY</td><td>:</td><td align="left" style="border-right: 1px; color: white; font-weight: bold;">' + quantity + '</td>' +
                    '<td align="center" valign="middle" style="border-top: 1px;"><b>QA-PASSED</b></td></tr>' +
                    '</table></td>';

                if ((i + 1) % labelsPerRow === 0) {
                    xml += '</tr></table>'; // end the row
                }
            }

            if (totalLabels % labelsPerRow !== 0) {
                xml += '</tr></table>'; // close final row if not full
            }

            xml += '</body></pdf>';
        }

        var pdfFile = render.xmlToPdf({
            xmlString: xml
        });
        context.response.writeFile(pdfFile, true);
    }

    return {
        onRequest: onRequest
    };
});