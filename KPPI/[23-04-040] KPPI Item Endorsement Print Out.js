/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/record", "N/runtime", "N/format"], function (record, runtime, format) {
    // Entry point for the Suitelet script
    function onRequest(context) {
        var request = context.request,
            response = context.response;

        // Load the item endorsement record
        var printEndorsementRecord = record.load({
            type: "customrecord1358",
            id: request.parameters.internalId,
            isDynamic: true,
        });

        // Extract relevant data from the item endorsement record
        var customer = printEndorsementRecord.getText({
            fieldId: "custrecord706",
        }),
            poNum = printEndorsementRecord.getText({
                fieldId: "custrecord707",
            }),
            endorsed_by = printEndorsementRecord.getText({
                fieldId: "custrecord734",
            }),
            endorsed_to = printEndorsementRecord.getText({
                fieldId: "custrecord735",
            }),
            sublistLength = printEndorsementRecord.getLineCount({
                sublistId: "recmachcustrecord731",
            }),
            date = printEndorsementRecord.getValue({
                fieldId: "custrecord709",
            }),
            area = printEndorsementRecord.getText({
                fieldId: "custrecord708",
            }),
            forex_date = printEndorsementRecord.getText({
                fieldId: "custrecord736",
            }),
            forex_rate = printEndorsementRecord.getValue({
                fieldId: "custrecord737",
            }),
            controlNum = printEndorsementRecord.getText({
                fieldId: "custrecord710",
            }),
            IPDnum = printEndorsementRecord.getText({
                fieldId: "custrecord733",
            });

        // Format the date
        date = format.format({
            value: date,
            type: format.Type.DATE,
        });

        // Retrieve HTML template from Suitelet parameters
        var html = runtime.getCurrentScript().getParameter({
            name: 'custscript76'
        });

        html = html.replace('{customer}', customer);
        html = html.replace('{poNum}', poNum);
        html = html.replace('{endorsed_by}', endorsed_by);
        html = html.replace('{endorsed_to}', endorsed_to);
        html = html.replace('{date}', date);
        html = html.replace('{area}', area);
        html = html.replace('{forex_date}', forex_date);
        html = html.replace('{forex_rate}', forex_rate);
        html = html.replace('{controlNum}', controlNum);
        html = html.replace('{IPDnum}', IPDnum);

        var tableRow = '';

        // Iterate over the sublist lines and generate HTML for each item
        for (var line = 0; line < sublistLength; line++) {
            var item_id = printEndorsementRecord.getSublistText({
                sublistId: "recmachcustrecord731",
                fieldId: "custrecord712",
                line: line,
            }),
                item_desc = printEndorsementRecord.getSublistText({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord713",
                    line: line,
                }),
                group = '',
                sheet_size = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord714",
                    line: line,
                }),
                flute = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord715",
                    line: line,
                }),
                paper_com = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord716",
                    line: line,
                }),
                outs_per_sheet = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord717",
                    line: line,
                }),
                outs_per_blade = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord718",
                    line: line,
                }),
                need_per_set = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord719",
                    line: line,
                }),
                selling_price = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord720",
                    line: line,
                }),
                moq = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord721",
                    line: line,
                }),
                rm_unit_price = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord722",
                    line: line,
                }),
                procurement = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord723",
                    line: line,
                }),
                moq_rm = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord724",
                    line: line,
                }),
                gpr = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord725",
                    line: line,
                }),
                supplier = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord726",
                    line: line,
                }),
                open_po = '',
                cs_endorsement = '',
                bom_code = printEndorsementRecord.getSublistValue({
                    sublistId: "recmachcustrecord731",
                    fieldId: "custrecord729",
                    line: line,
                });

            // Append HTML for each item to table row
            tableRow += add1row(item_id, item_desc, group, sheet_size, flute, paper_com, outs_per_sheet, outs_per_blade, need_per_set, selling_price, moq, rm_unit_price, procurement, moq_rm, gpr, supplier, open_po, cs_endorsement, bom_code);
        }

        // Replace the placeholder in the template with dynamic item data
        html = html.replace('{body}', tableRow);

        // Set the content type and send the HTML response
        response.write(html);
        response.setHeader({
            name: "Content-Type",
            value: "text/html",
        });
    }

    function add1row(item_id, item_desc, group, sheet_size, flute, paper_com, outs_per_sheet, outs_per_blade, need_per_set, selling_price, moq, rm_unit_price, procurement, moq_rm, gpr, supplier, open_po, cs_endorsement, bom_code) {
        return row1 = "<tr style='letter-spacing: 1px;'>" +
            "<td class='padding borderLeft borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + item_id + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + item_desc + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + group + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + sheet_size + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + flute + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + paper_com + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + outs_per_sheet + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + outs_per_blade + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + need_per_set + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + selling_price + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + moq + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + rm_unit_price + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + procurement + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + moq_rm + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + gpr + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + supplier + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + open_po + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + cs_endorsement + "</td>" +
            "<td class='padding borderBottom borderRight' align='center' style='text-align: center; font-size: 8px;'>" + bom_code + "</td>" +
            "</tr>";
    }

    // Return the onRequest function as the Suitelet's handler
    return {
        onRequest: onRequest,
    };
});