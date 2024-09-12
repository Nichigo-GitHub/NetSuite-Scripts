/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/search', 'N/currentRecord', 'N/log'], function (search, currentRecord, log) {

  function fieldChanged(context) {
    // Get the current record object from the context
    var currentRecord = context.currentRecord;

    // If the field changed is 'custrecord761'
    if (context.fieldId === 'custrecord761') {
      if (context.fieldId != '' || context.fieldId != null || context.fieldId != undefined) {
        try {
          // Get the selected customerName from the pop-up list field
          var customerName = currentRecord.getValue({
            fieldId: 'custrecord761'
          });

          if (customerName) {
            // Remove all existing lines from the sublist
            var lineCount = currentRecord.getLineCount({
              sublistId: 'recmachcustrecord762'
            });

            for (var i = lineCount - 1; i >= 0; i--) {
              currentRecord.removeLine({
                sublistId: 'recmachcustrecord762',
                line: i
              });
            }

            log.debug('fieldChanged', 'All lines removed from sublist.');

            // Perform a saved search based on the selected customerName value
            var searchObj = search.load({
              id: 'customsearch4381'
            });

            // Add a filter to the search to only include "Finished Goods"
            searchObj.filters.push(search.createFilter({
              name: 'custitem24', // Replace with the correct field ID
              operator: search.Operator.IS,
              values: customerName // Replace with the correct value if needed
            }));

            var allResults = [];
            var start = 0;
            var end = 1000;
            var batchSize = 1000;
            var totalRecordsFetched = 0;

            // Loop to fetch results in batches of 1,000
            do {
              // Get a batch of results
              var searchResults = searchObj.run().getRange({
                start: start,
                end: end
              });

              // Add the results to the array
              allResults = allResults.concat(searchResults);

              // Update the total number of records fetched so far
              totalRecordsFetched += searchResults.length;

              // Log the progress
              log.debug({
                title: 'Progress',
                details: 'Fetched ' + totalRecordsFetched + ' records so far'
              });

              // Increment the start and end for the next batch
              start += batchSize;
              end += batchSize;

            }
            while (searchResults.length === batchSize);

            // Loop through the search results and add new lines to the sublist
            var count = 0;
            allResults.forEach(function (result) {
              // Add a new line to the sublist and set the values
              currentRecord.selectNewLine({
                sublistId: 'recmachcustrecord762'
              });

              var customer = result.getText({
                name: "custitem24",
                summary: "GROUP",
                label: "Customer",
                type: "select",
                sortdir: "ASC"
              }), itemid = result.getValue({
                name: "itemid",
                summary: "GROUP",
                label: "FG Name",
                type: "text",
                sortdir: "ASC"
              }), salesdesc = result.getValue({
                name: "salesdescription",
                summary: "GROUP",
                label: "Description",
                type: "text",
                sortdir: "NONE"
              }), currency = result.getText({
                name: "currency",
                join: "pricing",
                summary: "GROUP",
                label: "FG Currency",
                type: "select",
                sortdir: "NONE"
              }), unitprice = result.getValue({
                name: "unitprice",
                join: "pricing",
                summary: "GROUP",
                label: "FG Price",
                type: "currency2",
                sortdir: "NONE"
              }), formulanumeric = result.getValue({
                name: "formulanumeric",
                summary: "SUM",
                label: "Formula (Numeric)",
                type: "float",
                formula: "ROUND(({memberquantity}*{memberitem.lastpurchaseprice}),4)",
                sortdir: "NONE"
              })

              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord763',
                text: customer
              });              

              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord764',
                text: itemid
              });

              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord765',
                text: salesdesc
              });

              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord766',
                value: currency
              });

              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord767',
                value: unitprice
              });

              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord768',
                value: formulanumeric
              });

              currentRecord.commitLine({
                sublistId: 'recmachcustrecord762'
              });

              log.debug({
                title: 'Line ' + count + ' / ' + allResults.length,
                details: 'Customer: ' + customer + 
                         ', Item: ' + itemid + 
                         ', Description: ' + salesdesc +
                         ', Currency: ' + currency +
                         ', Base Price: ' + unitprice +
                         ', Procurement Price: ' + formulanumeric
              });

              count++;
            });

            // Get fields for disabling
            var customerField = currentRecord.getSublistField({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord763',
                line: 0
              }),
              fgNameField = currentRecord.getSublistField({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord764',
                line: 0
              }),
              descriptionField = currentRecord.getSublistField({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord765',
                line: 0
              }),
              currencyField = currentRecord.getSublistField({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord766',
                line: 0
              }),
              fgPriceField = currentRecord.getSublistField({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord767',
                line: 0
              }),
              procurementPriceField = currentRecord.getSublistField({
                sublistId: 'recmachcustrecord762',
                fieldId: 'custrecord768',
                line: 0
              });

            // Disable the fields
            customerField.isDisabled = true;
            fgNameField.isDisabled = true;
            descriptionField.isDisabled = true;
            currencyField.isDisabled = true;
            fgPriceField.isDisabled = true;
            procurementPriceField.isDisabled = true;

            log.debug('fieldChanged', 'Fields disabled.');
          }
        } catch (e) {
          // Log the error
          log.error('Error occurred in fieldChanged function', e.message);

          // Optionally, rethrow the error to allow it to propagate
          throw e;
        }
      }
    }
  }

  function pageInit(context) {
    // Get the current record object from the context
    var currentRecord = context.currentRecord;

    // Check if the sublist is the "item" sublist and the mode is 'edit'
    if (context.mode === 'edit') {
      // Get fields for disabling
      var customerField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord762',
          fieldId: 'custrecord763',
          line: 0
        }),
        fgNameField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord762',
          fieldId: 'custrecord764',
          line: 0
        }),
        descriptionField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord762',
          fieldId: 'custrecord765',
          line: 0
        }),
        currencyField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord762',
          fieldId: 'custrecord766',
          line: 0
        }),
        fgPriceField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord762',
          fieldId: 'custrecord767',
          line: 0
        }),
        procurementPriceField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord762',
          fieldId: 'custrecord768',
          line: 0
        });

      // Disable the fields
      customerField.isDisabled = true;
      fgNameField.isDisabled = true;
      descriptionField.isDisabled = true;
      currencyField.isDisabled = true;
      fgPriceField.isDisabled = true;
      procurementPriceField.isDisabled = true;
    }
  }

  return {
    fieldChanged: fieldChanged,
    pageInit: pageInit
  };
});