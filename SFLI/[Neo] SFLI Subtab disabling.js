/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {
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
    }),
    itemSource = context.currentRecord.getCurrentSublistValue({
      sublistId: 'item',
      fieldId: 'itemsource'
    });
    
    log.debug({
      title: 'itemSource',
      details: itemSource
    });

    if (itemSource == 'WORK_ORDER') {
      context.currentRecord.setValue({
        fieldId: 'location',
        value: ''
      })
      log.debug({
        title: 'location',
        details: 'set to null'
      })
    }

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

  function fieldChanged(context) {
    if (context.fieldId === 'assemblyitem') {
      var rec = currentRecord.get();
      var itemId = rec.getValue({
        fieldId: 'assemblyitem'
      });

      if (itemId) {
        // Lookup the custom field value from the assembly item
        var itemLookup = search.lookupFields({
          type: 'lotnumberedassemblyitem',
          id: itemId,
          columns: ['custitem24']
        });

        var custValue = itemLookup.custitem24 && itemLookup.custitem24.length ? itemLookup.custitem24[0].value : null;

        if (custValue) {
          rec.setValue({
            fieldId: 'entity',
            value: custValue
          });
        }
      }
    }
  }

  return {
    lineInit: lineInit,
    validateLine: validateLine,
    fieldChanged: fieldChanged
  };
});