/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/record', 'N/log'], function (currentRecord, search, record, log) {
  function fieldChanged(context) {
    var currentRecord = context.currentRecord;

    // Check if the field changed is 'custrecord733'
    if (context.fieldId === 'custrecord733') {
      try {
        var currentUser = runtime.getCurrentUser();
        var subsidiaryId = currentUser.subsidiary;
        
        var ipdNum = currentRecord.getText({
          fieldId: 'custrecord733'
        });

        // Remove prefixes and trim the value
        var trimmedIpd = ipdNum.replace(/^Sales Order #/, '').replace(/^Transfer Order #/, '').trim();

        log.error({
          title: 'trimmedIpd',
          details: trimmedIpd
        });

        // Load the saved search by its internal ID
        var mySavedSearch = search.load({
          id: 'customsearch4095'
        });

        // Add a filter to match the transaction ID with the trimmed IPD number
        mySavedSearch.filters.push(search.createFilter({
          name: 'tranid',
          join: 'transaction',
          operator: search.Operator.IS,
          values: trimmedIpd
        }));

        // Add subsidiary filter for values 14 and 18
        mySavedSearch.filters.push(search.createFilter({
          name: 'subsidiary',
          join: 'transaction',
          operator: search.Operator.ANYOF,
          values: [14, 18]
        }));

        // Run the search and get the results
        var searchResults = mySavedSearch.run().getRange({
          start: 0,
          end: 1000
        });

        // Access the columns of the loaded search
        var columns = mySavedSearch.columns;

        // Debug the length of the results
        log.debug({
          title: 'Search Results Count',
          details: searchResults.length
        });

        // Iterate over the search results and log values with structured formatting
        searchResults.forEach(function (result, resultIndex) {
          var resultDetails = 'Result [' + resultIndex + ']:\n';

          columns.forEach(function (column, columnIndex) {
            var value = result.getValue(column);
            var text = result.getText(column);
            var key = column.label || column.name;

            // Store both the value and text representation, if available
            var displayValue = text || value;

            // Append each column's details to resultDetails
            resultDetails += '    Column [' + columnIndex + '] (' + key + '): "' + displayValue + '"\n';
          });

          // Log the formatted details
          log.debug({
            title: 'Result Details - Index ' + resultIndex,
            details: resultDetails
          });
        });

        var initialLineCount = currentRecord.getLineCount({
          sublistId: 'recmachcustrecord731'
        });

        log.debug({
          title: 'Line Count Check',
          details: 'Initial line count: ' + initialLineCount
        });

        // Iterate and set sublist fields with the search results
        searchResults.forEach(function (result, index) {
          var itemcode = result.getValue(columns[3]);
          var itemdescription = result.getValue(columns[4]);
          var group = result.getValue(columns[5]);
          var materialusedbkmaterials = result.getValue(columns[6]);
          var outsPerSheet = result.getValue(columns[9]);
          var outsPerBlade = result.getValue(columns[10]);
          var neededPerSet = result.getValue(columns[11]);
          var pricingSellingPrice = result.getValue(columns[12]);
          var MOQ = result.getText(columns[13]);
          var memberitemPurchasePrice = result.getValue(columns[15]);
          var procurement = result.getValue(columns[16]);
          var rmmoq = result.getValue(columns[8]);
          var gpr = result.getValue(columns[17]);
          var supplier = result.getText(columns[18]);
          var remarks = result.getValue(columns[19]);

          // Cancel any uncommitted changes in the current line
          currentRecord.cancelLine({
            sublistId: 'recmachcustrecord731'
          });

          // Insert new line on sublist
          currentRecord.selectNewLine({
            sublistId: 'recmachcustrecord731'
          });

          /* Set fields */
          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord712', // Item code field ID
            text: itemcode
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord713', // Description field ID
            text: itemdescription
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord738', // Group field ID
            text: group
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord714', // Sheet size field ID
            text: materialusedbkmaterials
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord717', // Outs per sheet field ID
            value: convertNullToZero(parseFloat(outsPerSheet))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord718', // Outs per blade field ID
            value: convertNullToZero(parseFloat(outsPerBlade))
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord719', // Needed per set field ID
            text: convertNullToZero(parseFloat(neededPerSet))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord720', // Selling price field ID
            value: convertNullToZero(parseFloat(pricingSellingPrice))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord721', // MOQ field ID
            value: MOQ
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord722', // RM Unit price field ID
            value: convertNullToZero(parseFloat(memberitemPurchasePrice))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord723', // Procurement field ID
            value: convertNullToZero(parseFloat(procurement))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord724', // RM MOQ field ID
            value: rmmoq
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord725', // GPR field ID
            value: gpr
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord726', // Supplier field ID
            text: supplier
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord729', // BOM Code field ID
            text: remarks
          });

          // Commit the line after setting all fields
          currentRecord.commitLine({
            sublistId: 'recmachcustrecord731'
          });

          var updatedLineCount = currentRecord.getLineCount({
            sublistId: 'recmachcustrecord731'
          });

          log.debug({
            title: 'Line Count Check',
            details: 'Updated line count: ' + updatedLineCount
          });
        });

        // If search results exist, update the customer field
        if (searchResults.length > 0) {
          var firstResult = searchResults[0];

          // Set field 'custrecord706' with a value from the search
          var transactionCustomer = firstResult.getValue(columns[2]);
          currentRecord.setText({
            fieldId: 'custrecord706',
            text: transactionCustomer
          });

          log.debug({
            title: 'firstResult',
            details: firstResult
          });

          // Disable the field after setting the value
          var field = currentRecord.getField({
            fieldId: 'custrecord706'
          });
          field.isDisabled = true;
        }
      } catch (e) {
        log.error({
          title: 'An error occurred in fieldChanged function',
          details: e.message
        });
        throw e;
      }
    }
  }

  function pageInit(context) {
    var currentRecord = context.currentRecord;

    // Check if the page is in view mode
    if (context.mode === 'view') {
      // Get the number of lines in the sublist
      var initialLineCount = currentRecord.getLineCount({
        sublistId: 'recmachcustrecord731'
      });

      // Loop through each line of the sublist
      for (var i = 0; i < initialLineCount; i++) {
        // Make the sublist field editable
        rec.getSublistField({
          sublistId: 'recmachcustrecord731',
          fieldId: 'custrecord776',
          line: i
        }).isDisabled = false; // Enable the field
        log.debug({
          title: 'custrecord776',
          details: 'line: ' + [i + 1] + ' disabled'
        })
      }
    }
  }

  return {
    fieldChanged: fieldChanged,
    pageInit: pageInit
  };

  function convertNullToZero(parameter) {
    if (!parameter && parameter != 0)
      return 0;
    return parameter;
  }
});