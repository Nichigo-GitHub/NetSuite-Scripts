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
    var location = request.getParameter("location");

    if (recType == "itemreceipt") {
        if (!poId && !receiptId)
            return "";

        var poRecord = poId ? nlapiLoadRecord("purchaseorder", poId) : nlapiLoadRecord("itemreceipt", receiptId);

        var customform = poRecord.getFieldValue("customform");
        var subsidiary = poRecord.getFieldValue("subsidiary");
        nlapiLogExecution('ERROR', 'customform', customform);
        nlapiLogExecution('ERROR', 'subsidiary', subsidiary);

        if (customform == 128 && subsidiary == 18) {
            var receivingTagTemplateFile = nlapiLoadFile("290270"); //KPLima_Receiving_Tag.xml
            var orderedBy = poRecord.getFieldText("custbody382");
        } else if (customform == 503 && subsidiary == 4) {
            var receivingTagTemplateFile = nlapiLoadFile("299436"); //KPIN_Receiving_Tag.xml
            var orderedBy = "-----";
        } else if (subsidiary == 15) {
            if (customform == 486 && location == 'Branch') {
                nlapiLogExecution('ERROR', 'print', 'amata branch');
                var receivingTagTemplateFile = nlapiLoadFile("311521"); //KPVN_AMATA_BRANCH_Receiving_Tag.xml
                var orderedBy = " ";
            } else if (customform == 486 && location == 'Trade') {
                nlapiLogExecution('ERROR', 'print', 'amata trade');
                var receivingTagTemplateFile = nlapiLoadFile("311522"); //KPVN_AMATA_TRADE_Receiving_Tag.xml
                var orderedBy = " ";
            } else if (location == 781 ||
                location == 785 ||
                location == 776 ||
                location == 855 ||
                location == 775 ||
                location == 900 ||
                location == 778 ||
                location == 859 ||
                location == 805 ||
                location == 818 ||
                location == 819 ||
                location == 813 ||
                location == 770 ||
                location == 779 ||
                location == 858 ||
                location == 777 ||
                location == 816 ||
                location == 817 ||
                location == 771 ||
                location == 854 ||
                location == 814 ||
                location == 815 ||
                location == 860) {
                nlapiLogExecution('ERROR', 'print', 'hanoi');
                var receivingTagTemplateFile = nlapiLoadFile("312905"); //KPVN_HANOI_Receiving_Tag.xml
                var orderedBy = " ";
            }
        } else {
            var receivingTagTemplateFile = nlapiLoadFile("22162"); //(SFLI) receivingTagTemplate.xml
            var orderedBy = "Weng De Villa";
        }

        var dataArray = getReceivingTagDataJson(poId, receiptId, lineNo, orderedBy, subsidiary);

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

        var customform = poRecord.getFieldValue("customform");
        var subsidiary = poRecord.getFieldValue("subsidiary");

        if (subsidiary == 18) {
            if (customform == 650 || customform == 452) {
                if (tag == 'RM') {
                    var receivingTagTemplateFile = nlapiLoadFile("290270"); //KPLima_Receiving_Tag.xml
                } else {
                    var receivingTagTemplateFile = nlapiLoadFile("295850"); //KPLima_FG_Tag.xml
                }
            } else if (customform == 710 || customform == 678) {
                if (tag == 'RM') {
                    var receivingTagTemplateFile = nlapiLoadFile("301224"); //KPLima_Receiving_Tag(from_laguna).xml 
                } else {
                    var receivingTagTemplateFile = nlapiLoadFile("295850"); //KPLima_FG_Tag.xml
                }
            }
        } else if (customform == 620 && subsidiary == 4) {
            var receivingTagTemplateFile = nlapiLoadFile("300170"); //KPIN_FG_Tag.xml
        } else if (customform == 694 || customform == 740 && subsidiary == 15) {
            var itRecord = nlapiLoadRecord("inventorytransfer", receiptId);
            var location = itRecord.getFieldText("transferlocation");

            // Check if the variable is a string, and convert it if it's not
            if (typeof location !== 'string') {
                location = String(location); // Convert the variable to a string if it's not already
            }

            if (location.toLowerCase().indexOf("hanoi") !== -1) {
                var receivingTagTemplateFile = nlapiLoadFile("309110"); //KPVN_HANOI_FG_Tag.xml
            } else if (location.toLowerCase().indexOf("amata") !== -1) {
                var receivingTagTemplateFile = nlapiLoadFile("321948"); //KPVN_AMATA_FG_Tag.xml
            }
        } else if (customform == 707 && subsidiary == 14) {
            var receivingTagTemplateFile = nlapiLoadFile("22162"); //(SFLI) receivingTagTemplate.xml
            var orderedBy = "Weng De Villa";
        }
        var dataArray = getReceivingTagDataJsonForInventoryTransfer(receiptId, lineNo, orderedBy, customform, subsidiary);

        var xml = juicer(receivingTagTemplateFile.getValue(), {
            "dataArray": dataArray
        });

        response.setContentType("PDF", "RECEIVING TAG", "inline");
        response.write(nlapiXMLToPDF(xml));
    } else if (recType == "inventoryadjustment") {
        if (!receiptId) {
            // Log an error or handle the case where receiptId is missing
            nlapiLogExecution('ERROR', 'receiptId', 'Receipt ID is missing.');
            return;
        }

        var poRecord = nlapiLoadRecord("inventoryadjustment", receiptId);

        var customform = poRecord.getFieldValue("customform");
        var subsidiary = poRecord.getFieldValue("subsidiary");

        if (subsidiary == 4 && customform == 133) {
            var receivingTagTemplateFile = nlapiLoadFile("300170"); //KPIN_FG_Tag.xml
        }
        var dataArray = getReceivingTagDataJsonForInventoryAdjustment(poId, receiptId, lineNo, orderedBy);

        var xml = juicer(receivingTagTemplateFile.getValue(), {
            "dataArray": dataArray
        });

        response.setContentType("PDF", "RECEIVING TAG", "inline");
        response.write(nlapiXMLToPDF(xml));
    }
}

// Function for item reciepts
function getReceivingTagDataJson(poId, receiptId, lineNo, orderedBy, subsidiary) {
    var poRecord = poId ? nlapiLoadRecord("purchaseorder", poId) : nlapiLoadRecord("itemreceipt", receiptId);
    var refPoNo = poRecord.getFieldValue("custbody92"); //External PO No. (Custom)   
    var refPoNo2 = poRecord.getFieldText("createdfrom");
    var dateDelivered = poRecord.getFieldValue("custbody328");
    var drNo = poRecord.getFieldValue("custbody28"); //DR No. (Custom)
    if (!drNo) {
        drNo = "----"
    }
    var reveivedBy = poRecord.getFieldText("custbody1"); //Prepared by (Custom)
    var dateReceived = poRecord.getFieldValue("trandate"); //Date
    var customer = poRecord.getFieldText("custbody41"); //Customer (Custom)
    var RrNo = poRecord.getFieldValue("custbody19"); //KPLIMA RR #
    if (!RrNo) {
        RrNo = poRecord.getFieldValue("tranid");
    }
    if (subsidiary == 18) {
        dateReceived = formatDateToYYYYMMDD(dateReceived);
        dateDelivered = formatDateToYYYYMMDD(dateDelivered);
    }
    var supplier = nlapiLookupField("vendor", poRecord.getFieldValue("entity"), "companyname"); //COMPANY NAME
    var location = poRecord.getFieldText("location");
    var tolocation = location.replace(/^KPVN HANOI : /, '').trim();
    tolocation = tolocation.replace(/^KPVN AMATA : AMATA BRANCH - Main Location : /, '').trim();
    tolocation = tolocation.replace(/^KPVN AMATA : AMATA EPE - Main Location : /, '').trim();
    tolocation = tolocation.replace(/^KPVN AMATA : AMATA TRADING - Main Location : /, '').trim();

    if (dateReceived) {
        if (subsidiary == 18) {
            var dateObject = nlapiStringToDate(dateReceived); // Auto-detects user's date format

            if (dateObject) {
                var receiveMonth = dateObject.getMonth() + 1; // Get month (0-based index)
                nlapiLogExecution('ERROR', 'receiveMonth', receiveMonth);
            }
        } else if (subsidiary == 14) {
            var receiveMonth = (nlapiStringToDate(dateReceived).getMonth() + 1);
        }
    } else {
        var receiveMonth = "";
    }
    var month = poId ? nlapiCreateRecord("customrecord_kpj_date").getFieldValue("custrecord_current_month") : receiveMonth; //当前月

    month = getSimpleEnglishMonthJson(month, true);

    var receivingTagCommonDataJson = {
        "refPoNo": refPoNo || '',
        "refPoNo2": refPoNo2.substring(16, 40) || '',
        "orderedBy": orderedBy || '',
        "drNo": drNo || '',
        "RrNo": RrNo || '',
        "reveivedBy": reveivedBy || '',
        "dateReceived": dateReceived || '',
        "customer": customer || '',
        "dateDelivered": dateDelivered || '',
        "supplier": supplier || '',
        "month": month || '',
        "inspectedBy": "",
        "location": tolocation || ''
    };
    var receivingTagCommonDataString = JSON.stringify(receivingTagCommonDataJson);

    var itemCode = "";
    var itemDescription = "";
    var quantity = "";
    var itemUPC = "";
    var customerVN = "";

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
            if (!customer) {
                customerVN = poRecord.getLineItemValue("item", "custcol227", i);
                receivingTagDataJson["customer"] = customerVN || '';
            }

            receivingTagDataJson["itemCode"] = itemCode || '';
            receivingTagDataJson["itemDescription"] = itemDescription || '';
            receivingTagDataJson["quantity"] = quantity || '';
            receivingTagDataJson["itemUPC"] = itemUPC || '';
            dataArray.push(receivingTagDataJson);
        } else {
            var lineNo1 = poRecord.getLineItemValue("item", "line", i);
            if (lineNo1 == lineNo) {
                var itemId1 = poRecord.getLineItemValue("item", "item", i);
                itemCode = nlapiLookupField("item", itemId1, "itemid");
                quantity = poRecord.getLineItemValue("item", "quantity", i);
                itemDescription = poRecord.getLineItemValue("item", "description", i);
                itemUPC = poRecord.getLineItemValue("item", "custcol241", i);
                if (!customer) {
                    customerVN = poRecord.getLineItemValue("item", "custcol227", i);
                    receivingTagDataJson["customer"] = customerVN || '';
                }

                receivingTagDataJson["itemCode"] = itemCode || '';
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

// Function for inventory transfers
function getReceivingTagDataJsonForInventoryTransfer(receiptId, lineNo, orderedBy, customform, subsidiary) {
    var itRecord = nlapiLoadRecord("inventorytransfer", receiptId);
    var refJoNo = itRecord.getFieldValue("custbody23");
    if (!refJoNo)
        refJoNo = "----"
    if (!drNo)
        drNo = "----"
    if (subsidiary == 18) {
        dateDelivered = formatDateToYYYYMMDD(dateDelivered);
        drNo = null;
    }
    if (customform == 694 && subsidiary == 15)
        var drNo = itRecord.getFieldValue("tranid");
    var reveivedBy = itRecord.getFieldText("custbody1"); //Prepared by (Custom)
    if (!reveivedBy)
        reveivedBy = itRecord.getFieldText("custbody11");
    var inspectedBy = itRecord.getFieldValue("custbody365");
    var dateDelivered = itRecord.getFieldValue("custbody397");
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
    } else if (customform == 620 && subsidiary == 4) {
        dateReceived = itRecord.getFieldValue("trandate");
        // Add current time in HH:mm:ss format
        var now = new Date();
        var hours = ('0' + now.getHours()).slice(-2);
        var minutes = ('0' + now.getMinutes()).slice(-2);
        // Convert to 12-hour format with AM/PM
        var hours12 = hours % 12 || 12;
        var ampm = hours < 12 ? 'AM' : 'PM';
        dateReceived += ' ' + hours12 + ':' + minutes + ' ' + ampm;
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
    if (!RrNo)
        RrNo = itRecord.getFieldValue("custbody54");
    var supplier2 = itRecord.getFieldText("custbodycust_sfli_vendor"); //supplier

    var receivingTagCommonDataJson = {
        "refJoNo": refJoNo || '',
        //"refPoNo2": refPoNo2.substring(16, 40) || '',
        "orderedBy": orderedBy || '',
        "RrNo": RrNo || '',
        "drNo": drNo || '',
        "reveivedBy": reveivedBy || '',
        "inspectedBy": inspectedBy || '',
        "dateReceived": dateReceived || '',
        "formattedDate": formattedDate || '',
        "dateString": dateString || '',
        "customer": customer || '',
        "dateDelivered": dateDelivered || '',
        "supplier2": supplier2 || '',
        "location": tolocation || ''
        //"month": month || ''
    };
    var receivingTagCommonDataString = JSON.stringify(receivingTagCommonDataJson);

    var itemId = '';
    var itemCode = "";
    var itemDescription = "";
    var quantity = "";
    var itemUPC = "";

    var dataArray = [];
    var itemCounts = itRecord.getLineItemCount("inventory");

    if (subsidiary == 18) {
        for (var i = 1; i <= itemCounts; i++) {
            var receivingTagDataJson = JSON.parse(JSON.stringify(receivingTagCommonDataJson));

            itemId = itRecord.getLineItemValue("inventory", "item", i);
            itemCode = nlapiLookupField("item", itemId, "itemid");
            qtyPerPallet = parseInt(nlapiLookupField("item", itemId, "custitem_quantity_per_pallet")) || null;
            quantity = parseInt(itRecord.getLineItemValue("inventory", "adjustqtyby", i)) || 0;
            itemDescription = itRecord.getLineItemValue("inventory", "description", i);
            itemUPC = itRecord.getLineItemValue("inventory", "custcol242", i);

            if (!qtyPerPallet) {
                // If qtyPerPallet is missing, treat the entire quantity as a single entry
                var receivingTagPage = JSON.parse(JSON.stringify(receivingTagDataJson));
                receivingTagPage["itemCode"] = formatString(itemCode) || '';
                receivingTagPage["itemDescription"] = itemDescription || '';
                receivingTagPage["quantity"] = quantity;
                receivingTagPage["itemUPC"] = itemUPC || '';
                receivingTagPage["page"] = 1;
                receivingTagPage["totalPages"] = 1;
                dataArray.push(receivingTagPage);
            } else {
                var fullPallets = Math.floor(quantity / qtyPerPallet);
                var remainder = quantity % qtyPerPallet;

                for (var j = 0; j < fullPallets; j++) {
                    var receivingTagPage = JSON.parse(JSON.stringify(receivingTagDataJson));
                    receivingTagPage["itemCode"] = formatString(itemCode) || '';
                    receivingTagPage["itemDescription"] = itemDescription || '';
                    receivingTagPage["quantity"] = quantity;
                    receivingTagPage["qtyPerPallet"] = qtyPerPallet;
                    receivingTagPage["itemUPC"] = itemUPC || '';
                    receivingTagPage["page"] = j + 1;
                    receivingTagPage["totalPages"] = fullPallets;
                    dataArray.push(receivingTagPage);
                }

                // Add remainder as the last page
                if (remainder > 0) {
                    var receivingTagPage = JSON.parse(JSON.stringify(receivingTagDataJson));
                    receivingTagPage["itemCode"] = formatString(itemCode) || '';
                    receivingTagPage["itemDescription"] = itemDescription || '';
                    receivingTagPage["quantity"] = quantity;
                    receivingTagPage["qtyPerPallet"] = remainder;
                    receivingTagPage["itemUPC"] = itemUPC || '';
                    receivingTagPage["page"] = fullPallets;
                    receivingTagPage["totalPages"] = fullPallets;
                    dataArray.push(receivingTagPage);
                }
            }
        }
    } else {
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
    }

    return dataArray.length > 0 ? dataArray : "";
}

// Function for inventory adjustment
function getReceivingTagDataJsonForInventoryAdjustment(poId, receiptId, lineNo, orderedBy) {
    var itRecord = nlapiLoadRecord("inventoryadjustment", receiptId);

    var refJoNo = itRecord.getFieldValue("custbody412");
    //var refPoNo2 = itRecord.getFieldText("createdfrom");
    var dateDelivered = itRecord.getFieldValue("custbody397");
    var drNo = itRecord.getFieldValue("custbody396");


    var reveivedBy = itRecord.getFieldText("custbody1"); //Prepared by (Custom)
    var dateReceived = itRecord.getFieldValue("trandate"); //Date
    var customer = itRecord.getFieldText("customer"); //Customer (Custom)
    var RrNo = itRecord.getFieldValue("custbody19"); //KPLIMA RR #
    var supplier2 = itRecord.getFieldText("custbodycust_sfli_vendor"); //supplier
    //var supplier = nlapiLookupField("vendor", itRecord.getFieldValue("entity"), "companyname"); //COMPANY NAME

    //month = getSimpleEnglishMonthJson(month, true);

    var receivingTagCommonDataJson = {
        "refJoNo": refJoNo || '',
        //"refPoNo2": refPoNo2.substring(16, 40) || '',
        "orderedBy": orderedBy || '',
        "RrNo": RrNo || '',
        "drNo": drNo || '',
        "reveivedBy": reveivedBy || '',
        "dateReceived": dateReceived || '',
        "customer": customer || '',
        "dateDelivered": dateDelivered || '',
        "supplier2": supplier2 || '',
        //"month": month || '',
        "inspectedBy": ""
    };
    var receivingTagCommonDataString = JSON.stringify(receivingTagCommonDataJson);

    var itemId = ""
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

            receivingTagDataJson["itemCode"] = itemCode || '';
            receivingTagDataJson["itemDescription"] = itemDescription || '';
            receivingTagDataJson["quantity"] = quantity || '';
            receivingTagDataJson["itemUPC"] = itemUPC || '';

            dataArray.push(receivingTagDataJson);
        } else {
            var lineNo1 = itRecord.getLineItemValue("inventory", "line", i);
            if (lineNo1 == lineNo) {
                var itemId1 = itRecord.getLineItemValue("inventory", "inventory", i);
                itemCode = nlapiLookupField("item", itemId1, "itemid");
                quantity = itRecord.getLineItemValue("inventory", "quantity", i);
                itemDescription = itRecord.getLineItemValue("inventory", "description", i);
                itemUPC = itRecord.getLineItemValue("inventory", "custcol241", i);

                receivingTagDataJson["itemCode"] = itemCode || '';
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

function formatString(input) {
    // Ensure the input is a string
    var str = String(input);

    // Log the original string
    // nlapiLogExecution('ERROR', 'Original String', str);

    // Get string length
    var strLength = str.length;
    // nlapiLogExecution('ERROR', 'String Length', 'String length is ' + strLength);

    // Check if the string is at least 23 characters
    if (strLength >= 23) {
        // nlapiLogExecution('ERROR', 'String Length Check', 'String is 23 or more characters');

        // Define the split index after 23 characters
        var splitIndex = 23;

        // Split the string into two halves
        var firstHalf = str.substring(0, splitIndex);
        var secondHalf = str.substring(splitIndex);

        // Log the two halves
        /* nlapiLogExecution('ERROR', 'First Half', firstHalf);
        nlapiLogExecution('ERROR', 'Second Half', secondHalf); */

        // Find the last occurrence of '-' in the first half
        var lastHyphenIndex = firstHalf.lastIndexOf('-');
        // nlapiLogExecution('ERROR', 'Last Hyphen Index in First Half', lastHyphenIndex !== -1 ? 'Hyphen found at index ' + lastHyphenIndex : 'No hyphen found in the first half');

        if (lastHyphenIndex !== -1) {
            // Insert 4 spaces after the nearest hyphen to the 23rd character
            firstHalf = firstHalf.substring(0, lastHyphenIndex + 1) + '    ' + firstHalf.substring(lastHyphenIndex + 1);
            // Concatenate with the second half
            str = firstHalf + secondHalf;
        } else {
            // If no hyphen is found in the first half, insert 4 spaces after the 23rd character
            str = firstHalf + '    ' + secondHalf;
        }

        // Check if the second half exceeds 23 characters
        var secondHalfLength = secondHalf.length;
        if (secondHalfLength > 23) {
            // Split the second half if it exceeds 23 characters
            var secondHalfFirstPart = secondHalf.substring(0, 23);
            var secondHalfSecondPart = secondHalf.substring(23);

            str = firstHalf + '    ' + secondHalfFirstPart + '    ' + secondHalfSecondPart;
        }

    } else {
        // If the string is less than 23 characters, no changes are made
        // nlapiLogExecution('ERROR', 'String Length Check', 'String is less than 23 characters, no changes made');
    }

    // Log the formatted string
    // nlapiLogExecution('ERROR', 'Formatted String', str);

    return str;
}

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

function formatDateToYYYYMMDD(date) {
    if (!date) return '';
    var d = nlapiStringToDate(date);
    var year = d.getFullYear();
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return year + '/' + month + '/' + day;
}