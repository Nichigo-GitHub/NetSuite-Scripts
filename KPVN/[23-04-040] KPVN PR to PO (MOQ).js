/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/search', 'N/record'], function (currentRecord, search, record) {
  function fieldChanged(context) {
    // Get the current record object from the context
    var currentRecord = context.currentRecord;

    // Check if the field changed is 'custrecord_swpr_subsidiary' or 'custrecord_swprd_quantity'
    if (context.fieldId === 'custrecord_swprd_quantity' || context.fieldId === 'custrecord_swpr_subsidiary') {
      try {
        // Get the subsidiary, quantity, and item values from the current record
        var subsidiary = currentRecord.getValue({
          fieldId: 'custrecord_swpr_subsidiary'
        });

        var quantity = currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord_swprd_po_request_id',
          fieldId: 'custrecord_swprd_quantity'
        });

        var item = currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord_swprd_po_request_id',
          fieldId: 'custrecord_swprd_item'
        });

        // Check if subsidiary is 15, and quantity and item have valid values
        if (subsidiary == 15 && quantity && item) {
          // Create a search to find the item record based on the selected item ID
          var itemSearchObj = search.create({
            type: search.Type.ITEM,
            filters: [
              ["internalid", search.Operator.ANYOF, item]
            ],
            columns: [
              search.createColumn({
                name: "custitemmoqprice1"
              }),
              search.createColumn({
                name: "custitemmoqprice2"
              }),
              search.createColumn({
                name: "custitemmoqprice3"
              }),
              search.createColumn({
                name: "custitemmoqprice4"
              }),
              search.createColumn({
                name: "custitemmoqprice5"
              }),
              search.createColumn({
                name: "custitemmoq1"
              }),
              search.createColumn({
                name: "custitemmoq2"
              }),
              search.createColumn({
                name: "custitemmoq3"
              }),
              search.createColumn({
                name: "custitemmoq4"
              }),
              search.createColumn({
                name: "custitemmoq5"
              })
            ]
          });

          // Run the search and get the first result
          var result = itemSearchObj.run().getRange({
            start: 0,
            end: 1
          });

          // Check if the search result is not empty
          if (result.length > 0) {
            // Get the values of moqPrice and moqQuantity from the search result
            var moqPrice1 = result[0].getValue({
              name: "custitemmoqprice1"
            });
            var moqPrice2 = result[0].getValue({
              name: "custitemmoqprice2"
            });
            var moqPrice3 = result[0].getValue({
              name: "custitemmoqprice3"
            });
            var moqPrice4 = result[0].getValue({
              name: "custitemmoqprice4"
            });
            var moqPrice5 = result[0].getValue({
              name: "custitemmoqprice5"
            });

            var moqQuantity1 = result[0].getValue({
              name: "custitemmoq1"
            });
            var moqQuantity2 = result[0].getValue({
              name: "custitemmoq2"
            });
            var moqQuantity3 = result[0].getValue({
              name: "custitemmoq3"
            });
            var moqQuantity4 = result[0].getValue({
              name: "custitemmoq4"
            });
            var moqQuantity5 = result[0].getValue({
              name: "custitemmoq5"
            });

            // Convert the item ID to an integer
            var itemId = parseInt(item);

            // Load the item record using its internal ID
            var itemRecord = record.load({
              type: record.Type.INVENTORY_ITEM,
              id: itemId
            });

            // Get the vendor prices from the item record's 'itemvendor' sublist
            var vendorPrices = itemRecord.getSublistValue({
              sublistId: 'itemvendor',
              fieldId: 'vendorprices',
              line: 0
            });

            // Remove non-numeric characters except the decimal point using a regular expression
            var numericPart = vendorPrices.replace(/[^\d.]/g, "");

            // Parse the numeric part to a floating-point number
            var floatVendorPrices = parseFloat(numericPart);

            // Check for quantity tiers and set the appropriate rate based on the quantity
            if (moqQuantity1) {
              if (quantity >= moqQuantity1) {
                if (moqQuantity2) {
                  if (quantity >= moqQuantity2) {
                    if (moqQuantity3) {
                      if (quantity >= moqQuantity3) {
                        if (moqQuantity4) {
                          if (quantity >= moqQuantity4) {
                            if (moqQuantity5) {
                              if (quantity >= moqQuantity5) {
                                // Set the rate based on the highest tier price
                                currentRecord.setCurrentSublistValue({
                                  sublistId: 'recmachcustrecord_swprd_po_request_id',
                                  fieldId: 'custrecord_swprd_rate',
                                  value: moqPrice5,
                                });
                              } else {
                                currentRecord.setCurrentSublistValue({
                                  sublistId: 'recmachcustrecord_swprd_po_request_id',
                                  fieldId: 'custrecord_swprd_rate',
                                  value: moqPrice4,
                                });
                              }
                            } else {
                              currentRecord.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_swprd_po_request_id',
                                fieldId: 'custrecord_swprd_rate',
                                value: moqPrice4,
                              });
                            }
                          } else {
                            currentRecord.setCurrentSublistValue({
                              sublistId: 'recmachcustrecord_swprd_po_request_id',
                              fieldId: 'custrecord_swprd_rate',
                              value: moqPrice3,
                            });
                          }
                        } else {
                          currentRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_swprd_po_request_id',
                            fieldId: 'custrecord_swprd_rate',
                            value: moqPrice3,
                          });
                        }
                      } else {
                        currentRecord.setCurrentSublistValue({
                          sublistId: 'recmachcustrecord_swprd_po_request_id',
                          fieldId: 'custrecord_swprd_rate',
                          value: moqPrice2,
                        });
                      }
                    } else {
                      currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_swprd_po_request_id',
                        fieldId: 'custrecord_swprd_rate',
                        value: moqPrice2,
                      });
                    }
                  } else {
                    currentRecord.setCurrentSublistValue({
                      sublistId: 'recmachcustrecord_swprd_po_request_id',
                      fieldId: 'custrecord_swprd_rate',
                      value: moqPrice1,
                    });
                  }
                } else {
                  currentRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_swprd_po_request_id',
                    fieldId: 'custrecord_swprd_rate',
                    value: moqPrice1,
                  });
                }
              } else {
                // Set the rate based on the vendor price if quantity is below the first tier
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord_swprd_po_request_id',
                  fieldId: 'custrecord_swprd_rate',
                  value: floatVendorPrices,
                });
              }
            } else {
              // No quantity tier information available, set rate to an empty string
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_swprd_po_request_id',
                fieldId: 'custrecord_swprd_rate',
                value: '',
              });
            }
          }
        }
      } catch (e) {
        // Log the error
        console.log('An error occurred:', e.message);

        // Optionally, rethrow the error to allow it to propagate
        throw e;
      }
    }
  }

  return {
    fieldChanged: fieldChanged
  };
});