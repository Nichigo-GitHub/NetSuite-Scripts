/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file', 'N/search'], function (render, record, file, search) {

    function onRequest(context) {
        var recId = context.request.parameters.recordId;
        var kpcebuParam = context.request.parameters.kpcebu;
        var koyaParam = context.request.parameters.koyama;
        var oqaParam = context.request.parameters.oqa;
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
        if (itemDesc) {
            // Encode ampersands that are not already part of an HTML entity
            itemDesc = itemDesc.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
        }
        var padding = 'padding-right: -8px; padding-left: -8px;';
        if (itemDesc.indexOf("S-XS-83-S-12 PARTITION") !== -1 ||
            itemDesc.indexOf("CUSHION FOAM (15 grams)") !== -1 ||
            itemDesc == "FABRICATION BOARD") {
            padding = 'padding-right: 10px; padding-left: 10px;';
        }
        var itemCode = rec.getText('custrecord928') || '';
        var model = rec.getText('custrecord930') || '';
        var quantity = rec.getValue('custrecord931') || '';
        var numOfLabels = rec.getValue('custrecord932') || '';
        var oqa = rec.getValue('custrecord945') || '';
        var traceMark = rec.getText('custrecord988') || '';
        var itemUnit = rec.getText('custrecord987') || '';
        quantity = quantity + ' ' + itemUnit;

        if (customer === "KANEPACKAGE PHILIPPINE INC. (CEBU)") {
            // Remove text in parentheses and trim
            var trimmedItemCode = itemCode.replace(/\s*\(.*?\)\s*/g, '').trim();

            var KanecebuCustomer = rec.getText({
                fieldId: 'custrecord1065'
            });

            // Search for inventory items
            var itemSearch = search.create({
                type: search.Type.INVENTORY_ITEM,
                filters: [
                    ['displayname', 'is', trimmedItemCode],
                    'AND',
                    ['subsidiary', 'anyof', '18']
                ],
                columns: [
                    search.createColumn({
                        name: 'custitem24'
                    })
                ]
            });

            var searchResult = itemSearch.run().getRange({
                start: 0,
                end: 1
            });
            if (searchResult && searchResult.length > 0) {
                var custitem24Text = searchResult[0].getText({
                    name: 'custitem24'
                }) || '';
                rec.setValue({
                    fieldId: 'custrecord927',
                    value: custitem24Text
                });
                customer = custitem24Text; // Use this for the label
            }

            if (KanecebuCustomer) {
                customer = KanecebuCustomer;
            }
        }

        if (itemCode === 'CORRUGATED BOX WITH PAD' || itemCode === '172530') {
            var width = '143px';
            var margin = '6px;';
        } else {
            var width = '111px;';
            var margin = '-25px;';
        }

        if (oqaParam && oqaParam.toLowerCase() === 't') {
            var xml = '<?xml version="1.0"?><pdf><head><style>';
            xml += 'table { font-size: 6pt; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; font-weight: bold; border-collapse: collapse; }';
            xml += '.labelTable { border: 1px solid black; width: ' + width + '; height: 200px; margin-right: ' + margin + '; }';
            xml += '</style></head><body>';

            var labelsPerRow = 5;
            var totalLabels = numOfLabels; // Total labels to print

            for (var i = 0; i < totalLabels; i++) {
                if (i % labelsPerRow === 0) {
                    xml += '<table><tr>'; // start a new row
                }

                var lotFontSize = (String(trimmedLot).indexOf("SFLI-JO-") !== -1) ? "5pt" : "inherit";
                // Get today's date in 01-Jan-2025 format
                var today = new Date();
                var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var formattedDate = ("0" + today.getDate()).slice(-2) + '-' + months[today.getMonth()] + '-' + today.getFullYear();

                xml += '<td style="table-layout: fixed; margin-top: -3px; margin-bottom: -2px; ' + padding + '"><table class="labelTable">' +
                    '<tr><td colspan="3" style="font-size: 4.5pt;" align="right"><b>rev02</b></td></tr>' +
                    '<tr style="height: 50px;"><td colspan="2" align="center" valign="top">' +
                    '<img src="https://3389427.app.netsuite.com/core/media/media.nl?id=360340&amp;c=3389427&amp;h=cfGNqhly00yySx-YB1nHq39gUTV44NU5JadtY4Ro6XIPxjvU" width="95" height="95" style="position: absolute; top: -10px; left: 3px;"/>' +
                    '</td><td align="right" valign="bottom"><img src="https://3389427.app.netsuite.com/core/media/media.nl?id=360884&amp;c=3389427&amp;h=xmkKM_reDhgkgnCwE0bc7GysVV_vmGBlD2wyRmK0jmqCNRsw&amp;fcts=20250707003633&amp;whence=" width="18" height="18" style="position: absolute; top: 68; left: 14;"/></td></tr>' +
                    '<tr><td align="center" style="width: 25px; font-size: 4.5pt; padding-bottom: -2px;" colspan="3">DATE : ' + formattedDate + '<br />IN-PROCESS : 0<br />OQA : <span style="text-decoration: underline;">' + oqa + '</span></td></tr>' +
                    '<tr><td><br /><br /></td></tr>' +
                    '<tr></tr>' +
                    '<tr><td align="left" colspan="3" style="width: 25px;">MODEL: ' + model +
                    '<br />CODE : <span style="font-size: 4.5pt;">' + itemCode + '</span></td></tr>' +
                    '<tr><td align="left" colspan="3" style="width: 25px;">SIZE/DESC : <span style="font-size: 4.5pt; text-decoration: underline;">' + itemDesc + '</span></td></tr>' +
                    '<tr><td align="left" colspan="3" style="width: 25px;">LOT#: <span style="font-size: ' + lotFontSize + ';">' + trimmedLot +
                    '</span><br />QTY : ' + quantity + '</td></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
                    '<tr></tr>' +
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
            xml += 'table { font-size: 7pt; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; } ';
            xml += '.labelWrapper { width: 100%; table-layout: fixed; }';
            xml += '.labelCell { width: 50%; vertical-align: top; padding: 0px; }';
            xml += '.labelTable { border: 1px solid black; width: 100%; height: 120px; }';
            xml += '</style></head><body>';

            var labelsPerRow = 2;
            var totalLabels = numOfLabels;

            for (var i = 0; i < totalLabels; i++) {
                if (i % labelsPerRow === 0) {
                    xml += '<table class="labelWrapper"><tr>'; // Start new row
                }

                var isLastOdd = (i + 1 === totalLabels) && (totalLabels % labelsPerRow !== 0);
                var labelCellStyle = isLastOdd ? 'style="width: 50%; width: 50%;"' : '';

                xml += '<td class="labelCell"><table class="labelTable" ' + labelCellStyle + '>' +
                    '<tr>' +
                    '<td style="width: 30px; min-width: 30px; max-width: 30px; border-bottom: 1px;" align="right" valign="top">' +
                    '<img src="https://3389427.app.netsuite.com/core/media/media.nl?id=357289&amp;c=3389427&amp;h=bBelVHtmEpk8_EVgFppomQZOP8wWxjlexgiX9-orUAvW6qcz&amp;fcts=20250603011305&amp;whence=" width="10" height="10" />' +
                    '</td>' +
                    '<td align="left" valign="middle" style="border-bottom: 1px; width: 50px;"><b>KANEPACKAGE PHILIPPINE, INC.</b></td>' +
                    '<td align="right" valign="bottom" style="border-bottom: 1px; font-size: 3pt;"><b>FORM QA 10<br />REV. 2</b></td>' +
                    '</tr>' +
                    '<tr><td align="left">CUSTOMER</td><td colspan="2" align="left">: ' + customer + '</td></tr>' +
                    '<tr><td align="left">ITEM CODE</td><td colspan="2" align="left" style="font-weight: bold;">: ' + itemCode + '</td></tr>' +
                    '<tr><td align="left">ITEM DESC</td><td colspan="2" align="left" style="font-weight: bold;">: ' + itemDesc + '</td></tr>' +
                    '<tr><td align="left">LOT NO.</td><td align="left" style="font-weight: bold;">: ' + trimmedLot + '</td>' +
                    '<td align="center" valign="middle" style="border-left: 1px; border-top: 1px; width: 30px; min-width: 30px; max-width: 30px;"><b>RoHS OK</b></td></tr>' +
                    '<tr><td align="left">QUANTITY</td><td align="left" style="font-weight: bold;">: ' + quantity + '</td>' +
                    '<td align="center" valign="middle" style="border-left: 1px; border-top: 1px; width: 30px; min-width: 30px; max-width: 30px;"><b>' + traceMark + '</b></td></tr>' +
                    '<tr><td colspan="3" align="center" valign="middle" style="border-top: 1px; font-size: 20pt;"><b>PASSED INSPECTION</b></td></tr>' +
                    '</table></td>';
                if ((i + 1) % labelsPerRow === 0) {
                    xml += '</tr></table>'; // end the row
                }
            }

            if (totalLabels % labelsPerRow !== 0) {
                xml += '</tr></table>'; // Close last incomplete row
            }

            xml += '</body></pdf>';
        } else if (kpcebuSize === 'small') {
            var xml = '<?xml version="1.0"?><pdf><head><style>';
            xml += 'table { font-size: 7pt; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; } ';
            xml += '.labelTable { border: 1px solid black; width: 200px; height: 114px; margin-right: -25px; }';
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
                    '<td style="width: 10; border-bottom: 1px;" align="right" valign="top">' +
                    '<img src="https://3389427.app.netsuite.com/core/media/media.nl?id=357289&amp;c=3389427&amp;h=bBelVHtmEpk8_EVgFppomQZOP8wWxjlexgiX9-orUAvW6qcz&amp;fcts=20250603011305&amp;whence=" width="10" height="10" />' +
                    '</td>' +
                    '<td colspan="4" align="left" valign="bottom" style="border-bottom: 1px;"><b>KANEPACKAGE PHILIPPINE, INC.</b></td>' +
                    '</tr>' +
                    '<tr style="display:none;"></tr>' +
                    '<tr><td colspan="2" align="left">CUSTOMER</td><td colspan="3" align="left">: ' + customer + '</td></tr>' +
                    '<tr><td colspan="2" align="left">ITEM CODE</td><td colspan="3" align="left" style="font-weight: bold;">: ' + itemCode + '</td></tr>' +
                    '<tr><td colspan="2" align="left" valign="middle">ITEM DESC</td><td colspan="3" align="left" style="font-weight: bold;">: ' + itemDesc + '</td></tr>' +
                    '<tr><td colspan="2" align="left">LOT NO.</td><td colspan="2" align="left" valign="middle" style="border-right: 1px; font-weight: bold; font-size: ' + lotFontSize + ';">: ' + trimmedLot + '</td>' +
                    '<td align="center" valign="middle" style="border-top: 1px;"><b>RoHS OK</b></td></tr>' +
                    '<tr><td colspan="2" align="left">QUANTITY</td><td align="left" style="width: 60px; border-right: 1px; font-size: 6pt; font-weight: bold;">: ' + quantity + '</td>' +
                    '<td align="center" valign="middle" style="border-top: 1px; border-right: 1px; font-size: 6pt;"><b>' + traceMark + '</b></td>' +
                    '<td align="center" valign="middle" style="border-top: 1px; font-size: 6pt;"><b>QA-PASSED</b></td></tr>' +
                    '<tr><td colspan="3" style="border-right: 1px;"></td><td style="border-right: 1px;"></td></tr>' +
                    '</table></td>';

                if ((i + 1) % labelsPerRow === 0) {
                    xml += '</tr></table>'; // end the row
                }
            }

            if (totalLabels % labelsPerRow !== 0) {
                xml += '</tr></table>'; // close final row if not full
            }

            xml += '</body></pdf>';
        } else if (koyaParam && koyaParam.toLowerCase() === 'full') {
            var xml = '<?xml version="1.0"?><pdf><head><style>'
                + 'body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding-top: 130px; }'
                + 'table { font-size: 18pt; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif; } '
                + '.labelTable { border: 1px solid black; }'
                + '</style></head><body>';

            var lotFontSize = /* String(trimmedLot).indexOf("SFLI-JO-") !== -1 ? "4.5pt" : */ "inherit";
            xml += '<table class="labelTable">' +
                '<tr><td colspan="3" align="center" style="border-bottom: 1px;"><b>SUPERFLEX LOGISTIC INC.</b></td></tr>' +
                '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">CUSTOMER:</td><td colspan="2" align="center" style="border-bottom: 1px;">' + customer + '</td></tr>' +
                '<tr><td align="center" style="border-right: 1px;" valign="bottom">ITEM</td><td colspan="2" rowspan="2" align="center" style="border-bottom: 1px;">' + itemDesc + '</td></tr>' +
                '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;" valign="top">DESCRIPTION:</td></tr>' +
                '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">ITEM CODE:</td><td colspan="2" align="center" style="border-bottom: 1px;">' + itemCode + '</td></tr>' +
                '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;" valign="middle">MODEL:</td><td align="center" style="border-bottom: 1px; border-right: 1px;">' + model + '</td>' +
                '<td align="center" rowspan="3" valign="middle"><b>RoHS<br />OQA<br />PASSED</b></td></tr>' +
                '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">LOT NUMBER:</td><td align="center" valign="middle" style="border-bottom: 1px; border-right: 1px; font-size: ' + lotFontSize + ';">' + trimmedLot + '</td></tr>' +
                '<tr><td align="center" style="border-right: 1px;">QUANTITY:</td><td align="center" style="border-right: 1px;">' + quantity + '</td></tr>' +
                '</table></body></pdf>';
        } else {
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

                var lotFontSize = String(trimmedLot).indexOf("SFLI-JO-") !== -1 ? "4.5pt" : "inherit";
                xml += '<td style="margin-top: -3px; margin-bottom: -3px; ' + padding + '"><table class="labelTable">' +
                    '<tr><td colspan="3" align="center" style="border-bottom: 1px;"><b>SUPERFLEX LOGISTIC INC.</b></td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">CUSTOMER:</td><td colspan="2" align="center" style="border-bottom: 1px;">' + customer + '</td></tr>' +
                    '<tr><td align="center" style="border-right: 1px;" valign="bottom">ITEM</td><td colspan="2" rowspan="2" align="center" style="border-bottom: 1px;">' + itemDesc + '</td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;" valign="top">DESCRIPTION:</td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">ITEM CODE:</td><td colspan="2" align="center" style="border-bottom: 1px;">' + itemCode + '</td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;" valign="middle">MODEL:</td><td align="center" style="border-bottom: 1px; border-right: 1px;">' + model + '</td>' +
                    '<td align="center" rowspan="3" valign="middle"><b>RoHS<br />OQA<br />PASSED</b></td></tr>' +
                    '<tr><td align="center" style="border-bottom: 1px; border-right: 1px;">LOT NUMBER:</td><td align="center" valign="middle" style="border-bottom: 1px; border-right: 1px; font-size: ' + lotFontSize + ';">' + trimmedLot + '</td></tr>' +
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