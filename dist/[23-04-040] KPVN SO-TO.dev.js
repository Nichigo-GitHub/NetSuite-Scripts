"use strict";

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {
  function beforeSubmit(context) {
    if (context.type === context.UserEventType.CREATE) {
      // Retrieve Sales Order data
      var salesOrder = context.newRecord; // Check if Sales Order is using KPVN_SALE_ORDER custom form

      var customForm = salesOrder.getValue({
        fieldId: 'customform'
      }); // Check if JO to Branch is set to "Yes"

      var joToBranch = salesOrder.getValue({
        fieldId: 'custbody463'
      });

      if (customForm == 463 && joToBranch == 1) {
        var items = salesOrder.getLineCount({
          sublistId: 'item'
        }); // Get field values from sales order

        var tranid = salesOrder.getValue({
          fieldId: 'tranid'
        });
        var subsidiary = salesOrder.getValue({
          fieldId: 'subsidiary'
        });
        var location = salesOrder.getValue({
          fieldId: 'location'
        });
        var department = salesOrder.getValue({
          fieldId: 'department'
        });
        var trandate = salesOrder.getValue({
          fieldId: 'trandate'
        });
        var exchangerate = salesOrder.getValue({
          fieldId: 'exchangerate'
        });
        var orderstatus = salesOrder.getValue({
          fieldId: 'orderstatus'
        });
        var customer = salesOrder.getValue({
          fieldId: 'entity'
        });
        var memo = salesOrder.getValue({
          fieldId: 'memo'
        });

        if (customer) {
          // Load the customer record using the internal ID
          var customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customer
          }); // Get the customer name

          var customerName = customerRecord.getValue({
            fieldId: 'companyname' // Change to the appropriate field ID for the customer name

          });
        }

        var savedSearchId = 'customsearch4064';
        var mySavedSearch = search.load({
          id: savedSearchId
        });
        var SOitems = [];
        var skip = [];
        var skipCount = 0; // Add Transfer Order line items based on Sales Order

        for (var i = 0; i < items; i++) {
          // Get sublist items from Sales Order
          SOitems[i] = salesOrder.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i
          }); // Add additional filters

          mySavedSearch.filters.push(search.createFilter({
            name: 'internalid',
            // Replace with the actual field name
            operator: search.Operator.IS,
            values: SOitems[i] // Replace with the value you're looking for

          })); // Run the search and get the first result

          var searchResult = mySavedSearch.run().getRange({
            start: 0,
            end: 1
          }); // Get the first result

          var firstResult = searchResult[0] ? searchResult[0].id : null;

          if (firstResult == SOitems[i]) {
            skip[i] = 1;
            skipCount++;
          } else {
            skip[i] = 0;
          } // Log relevant information about each result


          log.debug({
            title: 'skip ' + (i + 1),
            details: skip[i]
          }); // Log relevant information about each result

          log.debug({
            title: 'firstResult ' + (i + 1),
            details: firstResult
          });
        } // Create Transfer Order record


        var transferOrder = record.create({
          type: record.Type.TRANSFER_ORDER
        }); // Set custom form on Transfer Order to KPVN_TRANSFER_ORDER

        transferOrder.setValue({
          fieldId: 'customform',
          value: '467'
        }); // Set transid

        transferOrder.setValue({
          fieldId: 'tranid',
          value: 'TO-KPVN-' + tranid.match(/\d+/g)
        }); // Set subsidiary

        transferOrder.setValue({
          fieldId: 'subsidiary',
          value: subsidiary
        }); // Set location

        transferOrder.setValue({
          fieldId: 'location',
          value: 778
        }); // Set transferlocation

        transferOrder.setValue({
          fieldId: 'transferlocation',
          value: location
        }); // Set department

        transferOrder.setValue({
          fieldId: 'department',
          value: department
        }); // Set trandate

        transferOrder.setValue({
          fieldId: 'trandate',
          value: trandate
        }); // Set orderstatus

        transferOrder.setValue({
          fieldId: 'orderstatus',
          value: orderstatus
        }); // Set custbody466

        transferOrder.setValue({
          fieldId: 'custbody466',
          value: customerName
        }); // Set memo

        transferOrder.setValue({
          fieldId: 'memo',
          value: memo
        });
        var TOline = 0; // Add Transfer Order line items based on Sales Order

        for (var i = 0; i < skip.length; i++) {
          if (skip[i] == 0) {
            // Get sublist items from Sales Order
            var item = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: i
            });
            var description = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'description',
              line: i
            });
            var order_quantity = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i
            });
            var item_unit = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'units',
              line: i
            });
            var price = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: i
            });
            var amount = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              line: i
            }); // Insert a new line in Transfer Order sublist

            transferOrder.insertLine({
              sublistId: 'item',
              line: TOline
            });
            transferOrder.setSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: TOline,
              value: item
            });
            transferOrder.setSublistValue({
              sublistId: 'item',
              fieldId: 'description',
              line: TOline,
              value: description
            });
            transferOrder.setSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: TOline,
              value: order_quantity
            });
            transferOrder.setSublistValue({
              sublistId: 'item',
              fieldId: 'units',
              line: TOline,
              value: item_unit
            });
            transferOrder.setSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: TOline,
              value: price * exchangerate
            });
            transferOrder.setSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              line: TOline,
              value: amount * exchangerate
            }); // Log relevant information about each result

            log.debug({
              title: 'If Item',
              details: 'Item: ' + item + ', Line: ' + TOline
            });
            TOline++;
          } else {
            // Log relevant information about each result
            log.debug({
              title: 'Else Item',
              details: 'Item: ' + item + ', Line: ' + TOline
            });
          }
        } // Save Transfer Order


        transferOrder.save();
      }
    }
  }

  return {
    beforeSubmit: beforeSubmit
  };
});