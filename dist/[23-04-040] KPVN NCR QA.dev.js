"use strict";

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
  // Array to store the field IDs to check in the sublist
  var fieldIdsToCheck = [];

  for (var i = 589; i <= 623; i++) {
    fieldIdsToCheck.push('custrecord' + i);
  }

  function fieldChanged(context) {
    var currentRecord = context.currentRecord;

    if (context.fieldId === 'custrecord575') {
      var currentRecord = context.currentRecord;
      var rr = currentRecord.getValue('custrecord626');
      if (!rr) return;
      var itemreceiptSearchColSize = search.createColumn({
        name: 'custitem122',
        join: 'item'
      });
      var itemreceiptSearchColCustomer = search.createColumn({
        name: 'custcol227',
        join: 'appliedToTransaction'
      });
      var itemreceiptSearchColItemDescription = search.createColumn({
        name: 'memo',
        join: 'appliedToTransaction'
      });
      var itemreceiptSearch = search.create({
        type: 'itemreceipt',
        filters: [["transactionnumbertext", "is", rr], 'AND', ['type', 'anyof', 'ItemRcpt'], 'AND', ['subsidiary', 'anyof', '15'], 'AND', ['mainline', 'is', 'F']],
        columns: [itemreceiptSearchColCustomer, itemreceiptSearchColSize, itemreceiptSearchColItemDescription, "entity", "item", "quantity", "fxrate"]
      });
      var itemreceiptSearchResults = itemreceiptSearch.run().getRange({
        start: 0,
        end: 999 // Adjust this as needed

      });
      itemreceiptSearchResults.forEach(function (result) {
        currentRecord.selectNewLine({
          sublistId: 'recmachcustrecord625'
        }); // Customer

        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord625',
          fieldId: "custrecord624",
          text: result.getValue({
            name: 'custcol227',
            join: 'appliedToTransaction'
          })
        }); // Item

        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord625',
          fieldId: "custrecord582",
          text: result.getText({
            name: "item"
          })
        }); // Size

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord625',
          fieldId: "custrecord583",
          value: result.getValue({
            name: 'custitem122',
            join: 'item'
          })
        }); // Description

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord625',
          fieldId: "custrecord702",
          value: result.getValue({
            name: 'memo',
            join: 'appliedToTransaction'
          })
        }); // Quantity

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord625',
          fieldId: "custrecord584",
          value: result.getValue({
            name: "quantity"
          })
        }); // Rate

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord625',
          fieldId: "custrecord587",
          value: result.getValue({
            name: "fxrate"
          })
        }); // Reject Quantity

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord625',
          fieldId: 'custrecord585',
          value: 0
        }); // Set other fields in the sublist to zero

        for (var i = 0; i < fieldIdsToCheck.length; i++) {
          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord625',
            fieldId: fieldIdsToCheck[i],
            value: 0
          });
        }

        currentRecord.commitLine({
          sublistId: 'recmachcustrecord625'
        });
      });
    } else if (context.fieldId === 'custrecord589' || context.fieldId === 'custrecord590' || context.fieldId === 'custrecord591' || context.fieldId === 'custrecord592' || context.fieldId === 'custrecord593' || context.fieldId === 'custrecord594' || context.fieldId === 'custrecord595' || context.fieldId === 'custrecord596' || context.fieldId === 'custrecord597' || context.fieldId === 'custrecord598' || context.fieldId === 'custrecord599' || context.fieldId === 'custrecord600' || context.fieldId === 'custrecord601' || context.fieldId === 'custrecord602' || context.fieldId === 'custrecord603' || context.fieldId === 'custrecord604' || context.fieldId === 'custrecord605' || context.fieldId === 'custrecord606' || context.fieldId === 'custrecord607' || context.fieldId === 'custrecord608' || context.fieldId === 'custrecord609' || context.fieldId === 'custrecord610' || context.fieldId === 'custrecord611' || context.fieldId === 'custrecord612' || context.fieldId === 'custrecord613' || context.fieldId === 'custrecord614' || context.fieldId === 'custrecord615' || context.fieldId === 'custrecord616' || context.fieldId === 'custrecord617' || context.fieldId === 'custrecord618' || context.fieldId === 'custrecord619' || context.fieldId === 'custrecord620' || context.fieldId === 'custrecord621' || context.fieldId === 'custrecord622' || context.fieldId === 'custrecord623') {
      var sum = 0;
      var trigger = context.fieldId;
      var triggerValue = currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord625',
        fieldId: trigger
      });
      var rejQuantity = currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord625',
        fieldId: 'custrecord585'
      });

      for (var i = 0; i < fieldIdsToCheck.length; i++) {
        var kindOfReject = currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord625',
          fieldId: fieldIdsToCheck[i]
        });
        sum += kindOfReject;

        if (sum > rejQuantity) {
          window.alert('[Notice: Input is Exceeding The Reject Quantity]');
          sum = -triggerValue;
          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord625',
            fieldId: trigger,
            value: 0
          });
          break; // Exit the loop if the condition is met for any field
        }
      }
    }
  }

  return {
    fieldChanged: fieldChanged
  };
});