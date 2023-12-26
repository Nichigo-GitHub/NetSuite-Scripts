"use strict";

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/record", "N/render", "N/query"], function (record, render, query) {
  // Entry point for the Suitelet script
  function onRequest(context) {
    var request = context.request,
        response = context.response;
    var renderer = render.create();
    var items = []; // Load the inventory adjustment record

    var printInventoryAdjustmentRecord = record.load({
      type: "itemreceipt",
      id: request.parameters.internalId,
      isDynamic: true
    }); // Extract relevant data from the inventory adjustment record

    var customer = printInventoryAdjustmentRecord.getText({
      fieldId: "customer"
    }),
        jonum = printInventoryAdjustmentRecord.getText({
      fieldId: "custbody23"
    }),
        sublistLength = printInventoryAdjustmentRecord.getLineCount({
      sublistId: "inventory"
    }),
        date = printInventoryAdjustmentRecord.getValue({
      fieldId: "trandate"
    });
    var dateValue = new Date(date);
    var month = dateValue.getMonth(); // Convert month to a more human-friendly format (e.g., 1 for January)

    var actualMonth = month + 1;
    var monthColor = actualMonth == 1 ? 'january-background' : actualMonth == 2 ? 'february-background' : actualMonth == 3 ? 'march-background' : actualMonth == 4 ? 'april-background' : actualMonth == 5 ? 'may-background' : actualMonth == 6 ? 'june-background' : actualMonth == 7 ? 'july-background' : actualMonth == 8 ? 'august-background' : actualMonth == 9 ? 'september-background' : actualMonth == 10 ? 'october-background' : actualMonth == 11 ? 'november-background' : actualMonth == 12 ? 'december-background' : 'default-background';

    if (!jonum) {
      jonum = printInventoryAdjustmentRecord.getText({
        fieldId: "custbody412"
      });
      jonum = !jonum ? "testqr" : jonum;
    }

    var deduct = 0; // Initialize the deduction counter
    // Iterate over the sublist lines and generate PDF content

    for (var line = 0; line < sublistLength; line++) {
      var item_id = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: 'inventory',
        fieldId: 'item',
        line: line
      });
      var item = printInventoryAdjustmentRecord.getSublistText({
        sublistId: "inventory",
        fieldId: "item",
        line: line
      });
      var quantity = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: "inventory",
        fieldId: "adjustqtyby",
        line: line
      });
      var desc = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: "inventory",
        fieldId: "description",
        line: line
      });
      var queryResult = query.runSuiteQL({
        query: 'select upccode from item where id = ' + item_id
      });
      var itemUPC = queryResult.results[0].values[0];
      var unit = printInventoryAdjustmentRecord.getSublistValue({
        sublistId: "inventory",
        fieldId: "units_display",
        line: line
      }); // Proceed if Adjustment Quantity is non-negative

      if (quantity > 0) {
        items.push({
          customer: customer,
          joNum: jonum,
          item: item,
          quantity: quantity,
          description: desc,
          itemUPC: itemUPC,
          unit: unit,
          monthColor: monthColor
        });
      }
    }

    var payload = {
      inventoryItems: items
    };
    renderer.addCustomDataSource({
      format: render.DataSource.OBJECT,
      alias: "inventoryItems",
      data: payload
    });
    renderer.setTemplateByScriptId("CUSTTMPL_152_3389427_SB1_671");
    response.setHeader({
      name: "content-disposition",
      value: 'inline; filename="invadj.pdf"'
    });
    var pdfFile = renderer.renderAsPdf();
    response.writeFile(pdfFile, true);
  } // Return the onRequest function as the Suitelet's handler


  return {
    onRequest: onRequest
  };
});