/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Mar 2016     Administrator
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response) {
    var poId = request.getParameter("poId");
    var lineNo = request.getParameter("lineNo");
    var receiptId = request.getParameter("Id");
    var recType = request.getParameter("recType");
    var tag = request.getParameter("printOutTag");

    nlapiLogExecution('ERROR', 'poId', poId);
    nlapiLogExecution('ERROR', 'lineNo', lineNo);
    nlapiLogExecution('ERROR', 'receiptId', receiptId);
    nlapiLogExecution('ERROR', 'recType', recType);
    nlapiLogExecution('ERROR', 'tag', tag);

    if (recType == "itemreceipt") {
        if (!poId && !receiptId)
            return "";
        var poRecord = poId ? nlapiLoadRecord("purchaseorder", poId) : nlapiLoadRecord("itemreceipt", receiptId);

        var customform = poRecord.getFieldValue("customform");
        var subsidiary = poRecord.getFieldValue("subsidiary");

        if (customform == 128 && subsidiary == 18) {
            var receivingTagTemplateFile = nlapiLoadFile("290270"); //KPLima_Receiving_Tag.xml
            var orderedBy = poRecord.getFieldText("custbody382");
        } else if (customform == 486 && subsidiary == 15) {
            var receivingTagTemplateFile = nlapiLoadFile("290270"); //KPVN_Receiving_Tag.xml
        } else if (customform == 503 && subsidiary == 4) {
            var receivingTagTemplateFile = nlapiLoadFile("299436"); //KPIN_Receiving_Tag.xml
            var orderedBy = "-----"; //getOrderedBy(poId);
        } else {
            var receivingTagTemplateFile = nlapiLoadFile("22162"); //(SFLI) receivingTagTemplate.xml
            var orderedBy = "Ian and Ms Weng"; //getOrderedBy(poId);
        }

        var dataArray = getReceivingTagDataJson(poId, receiptId, lineNo, orderedBy);

        var xml = juicer(receivingTagTemplateFile.getValue(), {
            "dataArray": dataArray
        });

        response.setContentType("PDF", "RECEIVING TAG", "inline");
        response.write(nlapiXMLToPDF(xml));
    } else if (recType == "inventorytransfer") {
        if (!receiptId) {
            // Log an error or handle the case where receiptId is missing
            nlapiLogExecution('ERROR', 'receiptId', 'Receipt ID is missing.');
            return;
        }

        var poRecord = nlapiLoadRecord("inventorytransfer", receiptId);

        if (customform == 128 && subsidiary == 18) {
            if (tag == 'RM') {
                var receivingTagTemplateFile = nlapiLoadFile("290270"); //KPLima_Receiving_Tag.xml
            } else {
                var receivingTagTemplateFile = nlapiLoadFile("295850"); //KPLima_FG_Tag.xml
            }
        } else if (customform == 128 && subsidiary == 4) {

        }
        var dataArray = getReceivingTagDataJsonForInventoryTransfer(poId, receiptId, lineNo, orderedBy);

        var xml = juicer(receivingTagTemplateFile.getValue(), {
            "dataArray": dataArray
        });

        response.setContentType("PDF", "RECEIVING TAG", "inline");
        response.write(nlapiXMLToPDF(xml));
    }
}

function getReceivingTagDataJson(poId, receiptId, lineNo, orderedBy) {
    var poRecord = poId ? nlapiLoadRecord("purchaseorder", poId
    ) : nlapiLoadRecord("itemreceipt", receiptId);
    var refPoNo = poRecord.getFieldValue("custbody92"); //External PO No. (Custom)   
    var refPoNo2 = poRecord.getFieldText("createdfrom");
    var dateDelivered = poRecord.getFieldValue("custbody328");
    var drNo = poRecord.getFieldValue("custbody28"); //DR No. (Custom)
    var reveivedBy = poRecord.getFieldText("custbody1"); //Prepared by (Custom)
    var dateReceived = poRecord.getFieldValue("trandate"); //Date
    var customer = poRecord.getFieldText("custbody41");//Customer (Custom)
    var RrNo = poRecord.getFieldValue("custbody19");//KPLIMA RR #
    var supplier = nlapiLookupField("vendor"
        , poRecord.getFieldValue("entity"), "companyname"); //COMPANY NAME

    var receiveMonth = dateReceived ? (nlapiStringToDate(dateReceived).getMonth() + 1) : "";
    var month = poId ? nlapiCreateRecord("customrecord_kpj_date").getFieldValue("custrecord_current_month") : receiveMonth; //当前月

    month = getSimpleEnglishMonthJson(month, true);

    var receivingTagCommonDataJson = {
        "refPoNo": convertNullToEmpty(refPoNo),
        "refPoNo2": convertNullToEmpty(refPoNo2).substring(16, 40),
        "orderedBy": convertNullToEmpty(orderedBy),
        "drNo": convertNullToEmpty(drNo),
        "RrNo": convertNullToEmpty(RrNo),
        "reveivedBy": convertNullToEmpty(reveivedBy),
        "dateReceived": convertNullToEmpty(dateReceived),
        "customer": convertNullToEmpty(customer),
        "dateDelivered": convertNullToEmpty(dateDelivered),
        "supplier": convertNullToEmpty(supplier),
        "month": convertNullToEmpty(month),
        "inspectedBy": ""
    };
    var receivingTagCommonDataString = JSON.stringify(receivingTagCommonDataJson);

    var itemCode = "";
    var itemDescription = "";
    var quantity = "";
    var itemUPC = "";

    var dataArray = [];
    var itemCounts = poRecord.getLineItemCount("item");

    for (var i = 1; i <= itemCounts; i++) {
        var receivingTagDataJson = JSON.parse(receivingTagCommonDataString);
        if (!lineNo) {
            itemId = poRecord.getLineItemValue("item", "item", i);
            itemCode = nlapiLookupField("item", itemId, "itemid");
            quantity = poRecord.getLineItemValue("item", "quantity", i);
            itemDescription = poRecord.getLineItemValue("item", "description", i);
            itemUPC = poRecord.getLineItemValue("item", "custcol241", i);

            receivingTagDataJson["itemCode"] = convertNullToEmpty(itemCode);
            receivingTagDataJson["itemDescription"] = convertNullToEmpty(itemDescription);
            receivingTagDataJson["quantity"] = convertNullToEmpty(quantity);
            receivingTagDataJson["itemUPC"] = convertNullToEmpty(itemUPC
            );
            dataArray.push(receivingTagDataJson);
        } else {
            var lineNo1 = poRecord.getLineItemValue("item", "line", i);
            if (lineNo1 == lineNo) {
                var itemId1 = poRecord.getLineItemValue("item", "item", i);
                itemCode = nlapiLookupField("item", itemId1, "itemid");
                quantity = poRecord.getLineItemValue("item", "quantity", i);
                itemDescription = poRecord.getLineItemValue("item", "description", i);
                itemUPC = poRecord.getLineItemValue("item", "custcol241", i);


                receivingTagDataJson["itemCode"] = convertNullToEmpty(itemCode);
                receivingTagDataJson["itemDescription"] = convertNullToEmpty(itemDescription);
                receivingTagDataJson["quantity"] = convertNullToEmpty(quantity);
                receivingTagDataJson["itemUPC"] = convertNullToEmpty(itemUPC);
                dataArray.push(receivingTagDataJson);
                break;
            }
        }
    }

    return dataArray.length > 0 ? dataArray : "";
}


















function getReceivingTagDataJsonForInventoryTransfer(poId, receiptId, lineNo, orderedBy) {
    var itRecord = nlapiLoadRecord("inventorytransfer", receiptId);
    var refJoNo = itRecord.getFieldValue("custbody23");
    //var refPoNo2 = itRecord.getFieldText("createdfrom");
    var dateDelivered = itRecord.getFieldValue("custbody397");
    var drNo = itRecord.getFieldValue("custbody396");


    var reveivedBy = itRecord.getFieldText("custbody1"); //Prepared by (Custom)
    var dateReceived = itRecord.getFieldValue("trandate"); //Date
    var customer = itRecord.getFieldText("custbody41");//Customer (Custom)
    var RrNo = itRecord.getFieldValue("custbody19");//KPLIMA RR #
    var supplier2 = itRecord.getFieldText("custbodycust_sfli_vendor"); //supplier
    //var supplier = nlapiLookupField("vendor", itRecord.getFieldValue("entity"), "companyname"); //COMPANY NAME

    //month = getSimpleEnglishMonthJson(month, true);

    var receivingTagCommonDataJson = {
        "refJoNo": convertNullToEmpty(refJoNo),
        //"refPoNo2": convertNullToEmpty(refPoNo2).substring(16, 40),
        "orderedBy": convertNullToEmpty(orderedBy),
        "RrNo": convertNullToEmpty(RrNo),
        "drNo": convertNullToEmpty(drNo),
        "reveivedBy": convertNullToEmpty(reveivedBy),
        "dateReceived": convertNullToEmpty(dateReceived),
        "customer": convertNullToEmpty(customer),
        "dateDelivered": convertNullToEmpty(dateDelivered),
        "supplier2": convertNullToEmpty(supplier2),
        //"month": convertNullToEmpty(month),
        "inspectedBy": ""
    };
    var receivingTagCommonDataString = JSON.stringify(receivingTagCommonDataJson);

    var itemCode = "";
    var itemDescription = "";
    var quantity = "";
    var itemUPC = "";

    var dataArray = [];
    var itemCounts = itRecord.getLineItemCount("inventory");

    for (var i = 1; i <= itemCounts; i++) {
        var receivingTagDataJson = JSON.parse(receivingTagCommonDataString);
        if (!lineNo) {
            itemId = itRecord.getLineItemValue("inventory", "item", i);
            itemCode = nlapiLookupField("item", itemId, "itemid");
            quantity = itRecord.getLineItemValue("inventory", "adjustqtyby", i);
            itemDescription = itRecord.getLineItemValue("inventory", "description", i);
            itemUPC = itRecord.getLineItemValue("inventory", "custcol242", i);

            receivingTagDataJson["itemCode"] = convertNullToEmpty(itemCode);
            receivingTagDataJson["itemDescription"] = convertNullToEmpty(itemDescription);
            receivingTagDataJson["quantity"] = convertNullToEmpty(quantity);
            receivingTagDataJson["itemUPC"] = convertNullToEmpty(itemUPC);
            dataArray.push(receivingTagDataJson);
        } else {
            var lineNo1 = itRecord.getLineItemValue("inventory", "line", i);
            if (lineNo1 == lineNo) {
                var itemId1 = itRecord.getLineItemValue("inventory", "inventory", i);
                itemCode = nlapiLookupField("item", itemId1, "itemid");
                quantity = itRecord.getLineItemValue("inventory", "quantity", i);
                itemDescription = itRecord.getLineItemValue("inventory", "description", i);
                itemUPC = itRecord.getLineItemValue("inventory", "custcol241", i);

                receivingTagDataJson["itemCode"] = convertNullToEmpty(itemCode);
                receivingTagDataJson["itemDescription"] = convertNullToEmpty(itemDescription);
                receivingTagDataJson["quantity"] = convertNullToEmpty(quantity);
                receivingTagDataJson["itemUPC"] = convertNullToEmpty(itemUPC);
                dataArray.push(receivingTagDataJson);
                break;
            }
        }
    }

    return dataArray.length > 0 ? dataArray : "";
}

/**
 * 
 * @param poId
 * @returns
 */
function getOrderedBy(poId) {
    /*
    var results = nlapiSearchRecord("transaction", "customsearch_transac_body_fields_search", ["internalid","is",poId], null);
    if (results)
        return convertNullToEmpty(results[0].getText("custbody49"));
    */
}

/**
 * 
 * @param monthNum
 * @param upper
 * @param lower
 * @returns
 */
function getSimpleEnglishMonthJson(monthNum, upper, lower) {
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
            var simpleMonth = simpleMonthJson[monthNum];
            return upper ? simpleMonth.toUpperCase() : lower ? simpleMonth.toLowerCase() : simpleMonth;
        } else {
            return ""; //月份参数不正确
        }
    } else {
        if (upper) {
            for (var key in simpleMonthJson) {
                var month = simpleMonthJson[key];
                simpleMonthJson[key] = month.toUpperCase();
            }
        }

        if (lower) {
            for (var key1 in simpleMonthJson) {
                var month1 = simpleMonthJson[key1];
                simpleMonthJson[key1] = month1.toLowerCase();
            }
        }
    }

    return simpleMonthJson;
}

/**
 * 把null和undefined 转为""
 * @param parameter
 * @returns
 */
function convertNullToEmpty(parameter) {
    if (!parameter && parameter != 0)
        return "";
    return parameter;
}

/**
 * 把null和undefined 转为""
 * @param parameter
 * @returns
 */
function convertNullToZeros(parameter) {
    if (!parameter && parameter != 0)
        return "0000000";
    return parameter;
}