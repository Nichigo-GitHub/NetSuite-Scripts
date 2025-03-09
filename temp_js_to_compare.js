/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response) {
    try {
        var params = {
            poId: request.getParameter("poId"),
            lineNo: request.getParameter("lineNo"),
            receiptId: request.getParameter("Id"),
            recType: request.getParameter("recType"),
            tag: request.getParameter("printOutTag"),
            location: request.getParameter("location")
        };

        if (!params.recType) {
            throw new Error("Record type (recType) is missing.");
        }

        switch (params.recType) {
            case "itemreceipt":
                handleItemReceipt(params, response);
                break;
            case "inventorytransfer":
                handleInventoryTransfer(params, response);
                break;
            case "inventoryadjustment":
                handleInventoryAdjustment(params, response);
                break;
            default:
                throw new Error("Invalid record type: " + params.recType);
        }
    } catch (e) {
        nlapiLogExecution('ERROR', 'Suitelet Error', e.toString());
        response.write("An error occurred: " + e.toString());
    }
}

/**
 * Handles item receipt records.
 */
function handleItemReceipt(params, response) {
    if (!params.poId && !params.receiptId) {
        throw new Error("Both poId and receiptId are missing for item receipt.");
    }

    var poRecord = params.poId ? nlapiLoadRecord("purchaseorder", params.poId) : nlapiLoadRecord("itemreceipt", params.receiptId);
    var customform = poRecord.getFieldValue("customform");
    var subsidiary = poRecord.getFieldValue("subsidiary");

    var templateFileId = getTemplateFileId(customform, subsidiary, params.location);
    var orderedBy = getOrderedBy(customform, subsidiary);

    var dataArray = getReceivingTagData(params.poId, params.receiptId, params.lineNo, orderedBy, subsidiary, "itemreceipt");
    generatePDFResponse(response, templateFileId, dataArray);
}

/**
 * Handles inventory transfer records.
 */
function handleInventoryTransfer(params, response) {
    if (!params.receiptId) {
        throw new Error("Receipt ID is missing for inventory transfer.");
    }

    var itRecord = nlapiLoadRecord("inventorytransfer", params.receiptId);
    var customform = itRecord.getFieldValue("customform");
    var subsidiary = itRecord.getFieldValue("subsidiary");

    var templateFileId = getTemplateFileId(customform, subsidiary, params.location, params.tag);
    nlapiLogExecution('ERROR', 'getTemplateFileId', templateFileId);
    var orderedBy = getOrderedBy(customform, subsidiary);
    nlapiLogExecution('ERROR', 'getOrderedBy', 'passed');

    var dataArray = getReceivingTagData(params.receiptId, null, params.lineNo, orderedBy, subsidiary, "inventorytransfer");
    nlapiLogExecution('ERROR', 'getReceivingTagData', 'passed');
    generatePDFResponse(response, templateFileId, dataArray);
    nlapiLogExecution('ERROR', 'generatePDFResponse', 'passed');
}

/**
 * Handles inventory adjustment records.
 */
function handleInventoryAdjustment(params, response) {
    if (!params.receiptId) {
        throw new Error("Receipt ID is missing for inventory adjustment.");
    }

    var iaRecord = nlapiLoadRecord("inventoryadjustment", params.receiptId);
    var customform = iaRecord.getFieldValue("customform");
    var subsidiary = iaRecord.getFieldValue("subsidiary");

    var templateFileId = getTemplateFileId(customform, subsidiary);
    var orderedBy = getOrderedBy(customform, subsidiary);

    var dataArray = getReceivingTagData(null, params.receiptId, params.lineNo, orderedBy, subsidiary, "inventoryadjustment");
    generatePDFResponse(response, templateFileId, dataArray);
}

/**
 * Determines the template file ID based on customform, subsidiary, location, and tag.
 */
function getTemplateFileId(customform, subsidiary, location, tag) {
    nlapiLogExecution('ERROR', 'customform', customform);
    nlapiLogExecution('ERROR', 'subsidiary', subsidiary);
    if (customform == 128 && subsidiary == 18) {
        return 290270; // KPLima_Receiving_Tag.xml
    } else if (customform == 503 && subsidiary == 4) {
        return 299436; // KPIN_Receiving_Tag.xml
    } else if (subsidiary == 15) {
        if (customform == 486 && location == 'Branch') {
            return 311521; // KPVN_AMATA_BRANCH_Receiving_Tag.xml
        } else if (customform == 486 && location == 'Trade') {
            return 311522; // KPVN_AMATA_TRADE_Receiving_Tag.xml
        } else if (location == 781 || location == 785 || location == 776 || location == 855 || location == 775 || location == 900 || location == 778 || location == 859 || location == 805 || location == 818 || location == 819 || location == 813 || location == 770 || location == 779 || location == 858 || location == 777 || location == 816 || location == 817 || location == 771 || location == 854 || location == 814 || location == 815 || location == 860) {
            return 312905; // KPVN_HANOI_Receiving_Tag.xml
        }
    } else if (subsidiary == 18 && (customform == 650 || customform == 452)) {
        return tag == 'RM' ? 290270 : 295850; // KPLima_Receiving_Tag.xml or KPLima_FG_Tag.xml
    } else if (subsidiary == 18 && (customform == 710 || customform == 678)) {
        return tag == 'RM' ? 301224 : 295850; // KPLima_Receiving_Tag(from_laguna).xml  or KPLima_FG_Tag.xml
    } else if (customform == 620 && subsidiary == 4) {
        return 300170; // KPIN_FG_Tag.xml
    } else if ((customform == 694 || customform == 740) && subsidiary == 15) {
        return location.toLowerCase().indexOf("hanoi") !== -1 ? 309110 : 321948; // KPVN_HANOI_FG_Tag.xml or KPVN_AMATA_FG_Tag.xml
    } else if (customform == 707 && subsidiary == 14) {
        return 22162; // (SFLI) receivingTagTemplate.xml
    } else if (subsidiary == 4 && customform == 133) {
        return 300170; // KPIN_FG_Tag.xml
    }
    return 22162; // Default template
}

/**
 * Determines the "ordered by" value based on customform and subsidiary.
 */
function getOrderedBy(customform, subsidiary) {
    if (customform == 128 && subsidiary == 18) {
        return nlapiLoadRecord("purchaseorder", poId).getFieldText("custbody382");
    } else if (customform == 503 && subsidiary == 4) {
        return "-----";
    } else if (subsidiary == 15) {
        return " ";
    }
    return "Weng De Villa";
}

/**
 * Generates a PDF response using the provided template and data.
 */
function generatePDFResponse(response, templateFileId, dataArray) {
    var receivingTagTemplateFile = nlapiLoadFile(templateFileId);
    nlapiLogExecution('ERROR', 'templateFileId', templateFileId);

    var xml = juicer(receivingTagTemplateFile.getValue(), {
        "dataArray": dataArray
    });
    response.setContentType("PDF", "RECEIVING TAG", "inline");
    response.write(nlapiXMLToPDF(xml));
}

/**
 * Retrieves receiving tag data for the specified record type.
 */
function getReceivingTagData(poId, receiptId, lineNo, orderedBy, subsidiary, recordType) {
    if (recordType == 'inventorytransfer') {
        var itRecord = nlapiLoadRecord("inventorytransfer", receiptId);

        var refJoNo = itRecord.getFieldValue("custbody23");
        if (!refJoNo)
            refJoNo = "----"
        var dateDelivered = itRecord.getFieldValue("custbody397");
        if (subsidiary == 18) {
            dateDelivered = formatDateToYYYYMMDD(dateDelivered);
        }
        if (customform == 694 && subsidiary == 15) {
            var drNo = itRecord.getFieldValue("tranid");
        }
        if (!drNo)
            drNo = "----"
        var reveivedBy = itRecord.getFieldText("custbody1"); //Prepared by (Custom)
        if (!reveivedBy) {
            reveivedBy = itRecord.getFieldText("custbody365");
            if (!reveivedBy) {
                reveivedBy = itRecord.getFieldText("custbody11");
            }
        }
        var location = itRecord.getFieldText("transferlocation");
        var tolocation = location.replace(/^KPVN HANOI : /, '').trim();
        tolocation = tolocation.replace(/^KPVN AMATA : AMATA BRANCH - Main Location : /, '').trim();
        tolocation = tolocation.replace(/^KPVN AMATA : AMATA EPE - Main Location : /, '').trim();
        tolocation = tolocation.replace(/^KPVN AMATA : AMATA TRADING - Main Location : /, '').trim();
        var dateReceived = ''; //Date
        var formattedDate = "";
        var dateString = "";
        if (customform == 694 && subsidiary == 15) {
            dateReceived = itRecord.getFieldValue("createddate");
            dateString = itRecord.getFieldValue("trandate");
            formattedDate = dateString.replace(/\//g, ''); // This will remove all slashes
        } else if (subsidiary == 18) {
            dateReceived = itRecord.getFieldValue("trandate");
            dateReceived = formatDateToYYYYMMDD(dateReceived);
        } else {
            dateReceived = itRecord.getFieldValue("trandate");
        }

        var customer = itRecord.getFieldText("custbody41"); //Customer (Custom)
        if (!customer && refJoNo) {
            var filters = [
                new nlobjSearchFilter('tranid', null, 'is', refJoNo)
            ];
            var columns = [
                new nlobjSearchColumn('internalid')
            ];

            var searchResults = nlapiSearchRecord('workorder', null, filters, columns);

            if (searchResults && searchResults.length > 0) {
                var internalId = searchResults[0].getValue('internalid');
                var workOrder = nlapiLoadRecord('workorder', internalId);
                customer = workOrder.getFieldValue('entityname');
            }
        }
        var RrNo = itRecord.getFieldValue("custbody19"); //KPLIMA RR #
        if (!RrNo) {
            RrNo = itRecord.getFieldValue("custbody54");
        }
        var supplier2 = itRecord.getFieldText("custbodycust_sfli_vendor"); //supplier

        var receivingTagCommonDataJson = {
            "refJoNo": refJoNo || '',
            //"refPoNo2": refPoNo2.substring(16, 40) || '',
            "orderedBy": orderedBy || '',
            "RrNo": RrNo || '',
            "drNo": drNo || '',
            "reveivedBy": reveivedBy || '',
            "dateReceived": dateReceived || '',
            "formattedDate": formattedDate || '',
            "dateString": dateString || '',
            "customer": customer || '',
            "dateDelivered": dateDelivered || '',
            "supplier2": supplier2 || '',
            "location": tolocation || '',
            //"month": month || '',
            "inspectedBy": ""
        };
        var receivingTagCommonDataString = JSON.stringify(receivingTagCommonDataJson);

        var itemId = '';
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

                receivingTagDataJson["itemCode"] = formatString(itemCode) || '';
                receivingTagDataJson["itemDescription"] = itemDescription || '';
                receivingTagDataJson["quantity"] = quantity || '';
                receivingTagDataJson["itemUPC"] = itemUPC || '';

                nlapiLogExecution('ERROR', 'itemCode', itemCode);
                nlapiLogExecution('ERROR', 'quantity', quantity);
                nlapiLogExecution('ERROR', 'itemUPC', itemUPC);

                dataArray.push(receivingTagDataJson);
            } else {
                var lineNo1 = itRecord.getLineItemValue("inventory", "line", i);
                if (lineNo1 == lineNo) {
                    var itemId1 = itRecord.getLineItemValue("inventory", "inventory", i);
                    itemCode = nlapiLookupField("item", itemId1, "itemid");
                    quantity = itRecord.getLineItemValue("inventory", "quantity", i);
                    itemDescription = itRecord.getLineItemValue("inventory", "description", i);
                    itemUPC = itRecord.getLineItemValue("inventory", "custcol241", i);

                    receivingTagDataJson["itemCode"] = formatString(itemCode) || '';
                    receivingTagDataJson["itemDescription"] = itemDescription || '';
                    receivingTagDataJson["quantity"] = quantity || '';
                    receivingTagDataJson["itemUPC"] = itemUPC || '';
                    dataArray.push(receivingTagDataJson);
                    break;
                }
            }
        }

        return dataArray.length > 0 ? dataArray : "";
    }
    
    var record = poId ? nlapiLoadRecord("purchaseorder", poId) : nlapiLoadRecord(recordType, receiptId);
    var commonData = getCommonReceivingTagData(record, orderedBy, subsidiary);

    var dataArray = [];
    var itemCounts = record.getLineItemCount(recordType === "itemreceipt" ? "item" : "inventory");

    for (var i = 1; i <= itemCounts; i++) {
        var itemData = JSON.parse(JSON.stringify(commonData));
        if (!lineNo || record.getLineItemValue(recordType === "itemreceipt" ? "item" : "inventory", "line", i) == lineNo) {
            itemData.itemCode = record.getLineItemValue(recordType === "itemreceipt" ? "item" : "inventory", "item", i);
            itemData.itemDescription = record.getLineItemValue(recordType === "itemreceipt" ? "item" : "inventory", "description", i);
            itemData.quantity = record.getLineItemValue(recordType === "itemreceipt" ? "item" : "inventory", "quantity", i);
            itemData.itemUPC = record.getLineItemValue(recordType === "itemreceipt" ? "item" : "inventory", "custcol241", i);
            dataArray.push(itemData);
            if (lineNo) break; // Exit loop if lineNo is specified
        }
    }

    return dataArray;
}

/**
 * Retrieves common receiving tag data for all record types.
 */
function getCommonReceivingTagData(record, orderedBy, subsidiary) {
    var refPoNo = record.getFieldValue("custbody92") || "----";
    var drNo = record.getFieldValue("custbody28") || "----";
    var dateDelivered = formatDateToYYYYMMDD(record.getFieldValue("custbody328"));
    var dateReceived = formatDateToYYYYMMDD(record.getFieldValue("trandate"));
    var customer = record.getFieldText("custbody41") || record.getFieldText("customer") || "----";
    var RrNo = record.getFieldValue("custbody19") || record.getFieldValue("tranid") || "----";
    var supplier = record.getFieldText("entity") || "----";

    return {
        refPoNo: refPoNo,
        orderedBy: orderedBy,
        drNo: drNo,
        RrNo: RrNo,
        dateReceived: dateReceived,
        customer: customer,
        dateDelivered: dateDelivered,
        supplier: supplier,
        inspectedBy: ""
    };
}

/**
 * Formats a date to YYYY/MM/DD.
 */
function formatDateToYYYYMMDD(date) {
    if (!date) return '';
    var d = nlapiStringToDate(date);
    return d.getFullYear() + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2);
}