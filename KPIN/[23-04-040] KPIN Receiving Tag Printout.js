/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/record', 'N/file', 'N/xml', 'N/format'],

    (runtime, record, file, xml, format) => {

        let PDF_TEMPLATE_FILE_ID = 1;

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            log.debug('START', '[CB] KPI RECEIVING TAG PRINTOUT::onRequest()');

            let transId = scriptContext.request.parameters['internalId'];
            log.debug('INIT', `transId = ${transId}`);

            let trans = record.load({ type: record.Type.ITEM_RECEIPT, id: transId });

            let subsidiary = trans.getText({ fieldId: 'subsidiary' }) || "";
            let RRnO = trans.getValue({ fieldId: 'tranid' }) || "";
            let DRno = trans.getValue({ fieldId: 'custbody28' }) || "----";
            let customer = trans.getText({ fieldId: 'custbody41' }) || "";
            let supplier = trans.getText({ fieldId: 'entity' }) || "";
            let date = trans.getText({ fieldId: 'trandate' }) || "";
            let CreatePO = trans.getText({ fieldId: 'createdfrom' }).substring(16, 30) || "";
            let TimeRcvd = trans.getValue({ fieldId: 'custbody34' }) || "";
            let PrepBy = trans.getText({ fieldId: 'custbody1' }) || "";
            let CheckBy = trans.getText({ fieldId: 'custbody2' }) || "";

            let lineCount = trans.getLineCount({ sublistId: 'item' });
            let scriptObj = runtime.getCurrentScript();
            let mainTemplate = scriptObj.getParameter({ name: 'custscript70' });
            let bodyTemplate = scriptObj.getParameter({ name: 'custscript71' });
            let logoURL = file.load({ id: 756 }).url;
            //log.debug('MAIN TEMPLATE', mainTemplate);
            //log.debug('BODY TEMPLATE', bodyTemplate);

            let bodyHtml = "";
            let html = "";
            let item = null;
            let desc = null;
            let quantity = null;
            //let customer = null;

            var receiveMonth = date ? (new Date(date).getMonth() + 1) : "";

            var month = getSimpleEnglishMonthJson(receiveMonth, true);

            for (let i = 0; i < lineCount; i++) {
                item = trans.getSublistValue({ sublistId: 'item', fieldId: 'custcol_item_display_name', line: i }) || "";
                desc = trans.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }) || "";
                quantity = trans.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || "";
                //  customer = trans.getSublistValue({sublistId: 'item', fieldId: 'custcol227disp', line: i}) || "";

                html = bodyTemplate;

                html = html.replace('{logo_url}', xml.escape({
                    xmlText: logoURL
                }));
                html = html.replace('{subsidiary}', subsidiary);

                /*html = html.replace('{customer}', xml.escape({
                    xmlText : customer })); */

                html = html.replace('{part_name}', desc);
                html = html.replace('{part_code}', item);
                html = html.replace('{itemUPC}', item);
                html = html.replace('{quantity}', quantity);
                html = html.replace('{quantity2}', quantity);

                html = html.replace('{supplier}', supplier);
                html = html.replace('{customer}', customer);
                html = html.replace('{RefPONo}', CreatePO);

                html = html.replace('{month}', month);
                html = html.replace('{issue_date}', date);
                html = html.replace('{date}', date);
                html = html.replace('{trandate}', date);
                html = html.replace('{PrepBy}', PrepBy);
                html = html.replace('{datetime}', date + "  " + TimeRcvd);
                html = html.replace('{CheckBy}', CheckBy);
                html = html.replace('{RRnO}', RRnO);
                html = html.replace('{DRno}', DRno);
                html = html.replace('{RRnO2}', RRnO);
                html = html.replace('{DRno2}', DRno);
                html = html.replace('{item_quanity}', format.format({ value: quantity, type: format.Type.FLOAT }));

                if ((i + 1) < lineCount) {
                    html += '<pbr/>';
                }

                bodyHtml += html;
            }

            mainTemplate = mainTemplate.replace('{body_template}', bodyHtml);
            scriptContext.response.renderPdf({ xmlString: mainTemplate });
            // scriptContext.response.write({output: mainTemplate});

            log.debug('END', '[CB] KPI RECEIVING TAG PRINTOUT::onRequest()');
        }

        function getSimpleEnglishMonthJson(monthNum) {
            var simpleMonthJson = {
                "1": "Jan",
                "2": "Feb",
                "3": "Mar",
                "4": "Apr",
                "5": "May",
                "6": "June",
                "7": "July",
                "8": "Aug",
                "9": "Sept",
                "10": "Oct",
                "11": "Nov",
                "12": "Dec"
            };

            if (monthNum) {
                if (/(^[1-9]$)|(^1[0-2]$)/.test(monthNum)) {
                    return simpleMonthJson[monthNum];
                } else {
                    return ""; // Invalid month parameter
                }
            } else {
                return simpleMonthJson;
            }
        }

        return { onRequest }

    });