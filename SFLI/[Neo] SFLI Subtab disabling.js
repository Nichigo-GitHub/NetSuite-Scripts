/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {
  function lineInit(context) {
    var currentRecord = context.currentRecord;

    // Get the value of subsidiary and status field and the 'item' sublist
    var subsidiaryField = currentRecord.getValue({
        fieldId: 'subsidiary'
      }),
      orderStatusField = currentRecord.getValue({
        fieldId: 'orderstatus'
      });

    // Get the sublist, line count, and the index of the current line in the sublist
    var sublist = currentRecord.getSublist({
        sublistId: 'item'
      }),
      itemCount = currentRecord.getLineCount({
        sublistId: 'item'
      }) > 0,
      selectedLine = currentRecord.getCurrentSublistIndex({
        sublistId: 'item'
      });

    // Check if sublist exists
    if (sublist) {
      // Check if there are lines in the "item" sublist
      if (itemCount) {
        // Check if the value of subsidiary field is 4, 14, or 24 with order status planned or released
        if (subsidiaryField == 4 || subsidiaryField == 14 || subsidiaryField == 24 && (orderStatusField == 'planned' || orderStatusField == 'released')) {
          // Get the fields of item, description, and item purchase description
          var itemDisplayField = currentRecord.getSublistField({
              sublistId: 'item',
              fieldId: 'item_display',
              line: 0
            }),
            descriptionField = currentRecord.getSublistField({
              sublistId: 'item',
              fieldId: 'description',
              line: 0
            }),
            purchaseDescriptionField = currentRecord.getSublistField({
              sublistId: 'item',
              fieldId: 'custcol_item_purc_desc',
              line: 0
            });

          // Check if index is greater than the length of the list
          if (selectedLine < itemCount) {
            // Disable the fields
            itemDisplayField.isDisabled = true;
            descriptionField.isDisabled = true;
            purchaseDescriptionField.isDisabled = true;
          } else {
            // Enable the fields
            itemDisplayField.isDisabled = false;
            descriptionField.isDisabled = false;
            purchaseDescriptionField.isDisabled = false;
          }
        } else {
          // Do nothing
        }
      } else {
        // Do nothing
      }
    } else {
      console.error("Sublist does not exist");
    }
  }

  function validateLine(context) {
    var sublistFieldValue = context.currentRecord.getCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'item_display'
    });

    if (sublistFieldValue === null || sublistFieldValue === "<Type then tab>") {
      // Field is null
      console.error('item_display is null');
      alert("Please choose an item to add");
      return false;
    } else {
      // Field has a value, add it to the sublist
      return true;
    }
  }

  return {
    lineInit: lineInit,
    validateLine: validateLine
  };
});