/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/record", "N/render", "N/query", "N/log", "N/error"], function (record, render, query, log, error) {
  // Entry point for the Suitelet script
  function onRequest(context) {
    var request = context.request,
      response = context.response;

    var renderer = render.create();

    var items = [];

    // Determine the record type and load the record
    var recordId = request.parameters.internalId;
    var recordType;

    // Determine the correct record type by attempting to load the record
    try {
      recordType = "inventoryadjustment";
      var printRecord = record.load({
        type: recordType,
        id: recordId,
        isDynamic: true,
      });
    } catch (e) {
      if (e.name === "INVALID_TRANS_TYP") {
        try {
          recordType = "inventorytransfer";
          var printRecord = record.load({
            type: recordType,
            id: recordId,
            isDynamic: true,
          });
        } catch (e) {
          if (e.name === "INVALID_TRANS_TYP") {
            throw error.create({
              name: "INVALID_RECORD_TYPE",
              message: "The specified record ID does not correspond to a valid Inventory Adjustment or Inventory Transfer record.",
              notifyOff: false
            });
          } else {
            throw e;
          }
        }
      } else {
        throw e;
      }
    }

    // Extract relevant data from the record
    var customer = printRecord.getText({
        fieldId: "customer"
      }),
      jonum = printRecord.getText({
        fieldId: "custbody23"
      }),
      sublistLength = printRecord.getLineCount({
        sublistId: "inventory"
      }),
      date = printRecord.getValue({
        fieldId: "trandate"
      }),
      subsidiary = printRecord.getValue({
        fieldId: "subsidiary"
      });

    var dateValue = new Date(date);
    var month = dateValue.getMonth();
    var actualMonth = month + 1;
    var simpleMonth = getSimpleEnglishMonthJson(actualMonth, true);

    var monthColor = getMonthColor(actualMonth);

    if (!jonum) {
      jonum = printRecord.getText({
        fieldId: "custbody412"
      }) || "testqr";
    }

    var deduct = 0; // Initialize the deduction counter

    // Iterate over the sublist lines and generate PDF content
    for (var line = 0; line < sublistLength; line++) {
      var item_id = printRecord.getSublistValue({
        sublistId: 'inventory',
        fieldId: 'item',
        line: line,
      });

      var item = printRecord.getSublistText({
        sublistId: "inventory",
        fieldId: "item",
        line: line,
      });

      var quantity = printRecord.getSublistValue({
        sublistId: "inventory",
        fieldId: "adjustqtyby",
        line: line,
      });

      var desc = printRecord.getSublistValue({
        sublistId: "inventory",
        fieldId: "description",
        line: line,
      });

      var queryResult = query.runSuiteQL({
        query: 'select upccode from item where id = ' + item_id,
      });

      var itemUPC = queryResult.results[0].values[0];
      if (!itemUPC) {
        itemUPC = printRecord.getSublistText({
          sublistId: "inventory",
          fieldId: "custcol242",
          line: line,
        });
      }

      var unit = printRecord.getSublistValue({
        sublistId: "inventory",
        fieldId: "units_display",
        line: line,
      });

      var temp = '';

      if (subsidiary == 4) {
        temp = "CUSTTMPL_KPI_RM_TAG";

        var refNum = printRecord.getText({
            fieldId: "tranid"
          }),
          atuomNum = printRecord.getText({
            fieldId: "custbody270"
          }),
          reason = printRecord.getText({
            fieldId: "custbody_purpose_of_adjustment"
          }),
          memo = printRecord.getText({
            fieldId: "memo"
          }),
          department = printRecord.getText({
            fieldId: "department"
          }),
          approval = printRecord.getText({
            fieldId: "custbody114"
          }),
          quantity2 = quantity,
          refNum2 = refNum,
          atuomNum2 = atuomNum;

        // Proceed if Adjustment Quantity is non-negative
        if (quantity > 0) {
          var itemData = {
            customer: customer,
            simpleMonth: simpleMonth,
            memo: memo,
            quantity: quantity,
            quantity2: quantity2,
            atuomNum: atuomNum,
            atuomNum2: atuomNum2,
            description: desc,
            item: item,
            itemUPC: itemUPC,
            unit: unit,
            refNum: refNum,
            refNum2: refNum2,
            reason: reason,
            memo: memo,
            date: date,
            department: department,
            approval: approval
          };
          items.push(itemData);
          log.error("Item Added", JSON.stringify(itemData));
        }
      } else if (subsidiary == 14) {
        temp = "CUSTTMPL_152_3389427_SB1_671";

        // Proceed if Adjustment Quantity is non-negative
        if (quantity > 0) {
          var itemData = {
            customer: customer,
            joNum: jonum,
            item: item,
            quantity: quantity,
            description: desc,
            itemUPC: itemUPC,
            unit: unit,
            monthColor: monthColor
          };
          items.push(itemData);
          log.error("Item Added", JSON.stringify(itemData));
        }
      }
    }

    var payload = {
      inventoryItems: items
    };

    try {
      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "inventoryItems",
        data: payload,
      });

      renderer.setTemplateByScriptId(temp);
      response.setHeader({
        name: "content-disposition",
        value: 'inline; filename="invadj.pdf"',
      });

      var pdfFile = renderer.renderAsPdf();
      response.writeFile(pdfFile, true);
    } catch (e) {
      log.error("Render Error", "An error occurred while rendering the PDF: " + e.message);
      throw e;
    }
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

  function getMonthColor(month) {
    var colors = {
      1: 'january-background',
      2: 'february-background',
      3: 'march-background',
      4: 'april-background',
      5: 'may-background',
      6: 'june-background',
      7: 'july-background',
      8: 'august-background',
      9: 'september-background',
      10: 'october-background',
      11: 'november-background',
      12: 'december-background'
    };

    return colors[month] || 'default-background';
  }

  // Return the onRequest function as the Suitelet's handler
  return {
    onRequest: onRequest,
  };
});