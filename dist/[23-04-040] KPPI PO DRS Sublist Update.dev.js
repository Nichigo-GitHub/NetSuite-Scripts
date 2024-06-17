"use strict";
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord'], function (search, currentRecord) {
  // Array to store the field IDs to check in the sublist
  var fieldIdsToCheck = [];

  for (var i = 541; i <= 571; i++) {
    fieldIdsToCheck.push('custrecord' + i);
  }

  function beforeLoad(context) {
    contextMode = context.mode; // Check if the sublist is the "item" sublist and the mode is 'edit'

    if (context.mode === 'edit') {
      // Get the current record
      var currentRecord = context.newRecord; // Get line count from the sublist

      var lineCount = currentRecord.getLineCount({
        sublistId: 'recmachcustrecord500'
      }); // Perform a saved search based on the selected vendor value

      var searchObj = search.create({
        type: 'purchaseorder',
        filters: [['type', 'anyof', 'PurchOrd'], 'AND', ['mainline', 'is', 'F'], 'AND', ['subsidiary', 'anyof', '18'], 'AND', ['vendtype', 'noneof', '3'], 'AND', ['status', 'noneof', 'PurchOrd:C', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:A'], 'AND', ['formulanumeric: {quantity}-{quantityshiprecv}', 'notlessthanorequalto', '0'], 'AND', ['closed', 'is', 'F'], 'AND', ['custcol13', 'contains', 'DRS']],
        columns: [search.createColumn({
          name: 'tranid'
        }), search.createColumn({
          name: 'mainname'
        }), search.createColumn({
          name: 'item',
          sort: search.Sort.ASC // Sorting order: ascending

        }), search.createColumn({
          name: 'formulanumeric',
          formula: '{quantity}-{quantityshiprecv}'
        })]
      }); // Run the search and get the results

      var searchResults = searchObj.run().getRange({
        start: 0,
        end: 999
      });
      var count = 0;
      var total = 0;
      var match = 0;
      var updated = 0; // Loop through the search results and count number of results

      searchResults.forEach(function () {
        total++;
      }); // Loop through the search results and add new lines to the sublist

      searchResults.forEach(function (result) {
        count++;
        var supplier = result.getText({
          name: 'mainname'
        });
        var ssPOnum = result.getValue({
          name: 'tranid'
        });
        var ssItemCode = result.getText({
          name: 'item'
        });
        var ssPObal = parseInt(result.getValue({
          name: 'formulanumeric',
          formula: '{quantity}-{quantityshiprecv}'
        })); // Get the selected vendor from the pop-up list field

        var vendor = currentRecord.getText({
          fieldId: 'custrecord533'
        });
        console.log('Count: ' + count + '/' + total);

        if (vendor == supplier) {
          for (i = 0; i < lineCount; i++) {
            // Get the selected PO number from the sublist field
            var POnum = currentRecord.getSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: 'custrecord537',
              line: i
            }); // Get the selected Item Code from the sublist field

            var itemCode = currentRecord.getSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: 'custrecord538',
              line: i
            });

            if (POnum == ssPOnum && itemCode == ssItemCode) {
              // Add a new line to the sublist and set the values
              currentRecord.selectLine({
                sublistId: 'recmachcustrecord500',
                line: i
              }); // Get the selected PO balance from the sublist field

              var PObal = currentRecord.getSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord540',
                line: i
              }); // Get the selected Month from the sublist field

              var Month = currentRecord.getSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord501',
                line: i
              });
              console.log('custrecord501 Month: ' + Month);
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord540',
                line: i,
                value: ssPObal
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord501',
                line: i,
                text: Month
              });
              console.log('-----------------------------------------------------------');
              console.log('Customer  : ' + vendor);
              console.log('PO Number : ' + POnum);
              console.log('Item Code: ' + itemCode);
              console.log('PO Balance: ' + PObal);
              console.log('-----------------------------------------------------------');
              console.log('ssCustomer  : ' + supplier);
              console.log('ssPO Number : ' + ssPOnum);
              console.log('ssItem Code: ' + ssItemCode);
              console.log('ssPO Balance: ' + ssPObal);
              console.log('-----------------------------------------------------------');
              match++;
              var dayOfMonthValue = [];
              var sum = 0;

              for (var x = 0; x < fieldIdsToCheck.length; x++) {
                dayOfMonthValue[x] = currentRecord.getSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: fieldIdsToCheck[x],
                  line: i
                });
                sum += dayOfMonthValue[x]; // Uncomment line below for loop debugging

                console.log(fieldIdsToCheck[x] + ' ' + [x + 1] + ': ' + dayOfMonthValue[x] + ' [' + x + '/' + fieldIdsToCheck.length + ']');
              }

              for (var y = 0; y < fieldIdsToCheck.length; y++) {
                if (sum > ssPObal || PObal != ssPObal) {
                  updated++;

                  while (sum > ssPObal || PObal != ssPObal) {
                    var smallest = 999999999;
                    var smallestIndex = 0;

                    for (var z = 0; z < dayOfMonthValue.length; z++) {
                      if (dayOfMonthValue[z] > 0) {
                        // if (dayOfMonthValue[y] < smallest) { 
                        smallest = dayOfMonthValue[z];
                        smallestIndex = z; // } 

                        break;
                      }
                    }

                    if (smallest == 999999999) smallest = 0;
                    sum -= smallest;
                    console.log('-----------------------------------------------------------');
                    if (sum > ssPObal) console.log('sum > ssPObal    : Yes');
                    if (PObal != ssPObal) console.log('PObal != ssPObal : Yes');
                    console.log('earliest input   : ' + smallest);
                    console.log('index of earliest: ' + [smallestIndex + 1]);
                    console.log('earliest - sum   = ' + sum);
                    console.log('PO Balance       : ' + PObal);
                    console.log('-----------------------------------------------------------');
                    PObal = ssPObal;
                    /* console.log('Old value of Month: ' + currentRecord.getCurrentSublistText({
                        sublistId: 'recmachcustrecord500',
                        fieldId: custrecord501
                    })) */

                    console.log('Old value of Day ' + [smallestIndex + 1] + ' ' + fieldIdsToCheck[smallestIndex] + ': ' + currentRecord.getSublistValue({
                      sublistId: 'recmachcustrecord500',
                      fieldId: fieldIdsToCheck[smallestIndex],
                      line: i
                    }));
                    currentRecord.setCurrentSublistValue({
                      sublistId: 'recmachcustrecord500',
                      fieldId: fieldIdsToCheck[smallestIndex],
                      line: i,
                      value: 0
                    });
                    currentRecord.commitLine({
                      sublistId: 'recmachcustrecord500'
                    });
                    currentRecord.selectLine({
                      sublistId: 'recmachcustrecord500',
                      line: i
                    });
                    console.log('New value of Month: ' + currentRecord.getCurrentSublistText({
                      sublistId: 'recmachcustrecord500',
                      fieldId: custrecord501
                    }));
                    console.log('New value of Day ' + [smallestIndex + 1] + ' ' + fieldIdsToCheck[smallestIndex] + ': ' + currentRecord.getSublistValue({
                      sublistId: 'recmachcustrecord500',
                      fieldId: fieldIdsToCheck[smallestIndex],
                      line: i
                    }));
                    console.log('New PO Balance: ' + currentRecord.getSublistValue({
                      sublistId: 'recmachcustrecord500',
                      fieldId: 'custrecord540',
                      line: i
                    }));
                    console.log('-----------------------------------------------------------');

                    for (var x = 0; x < fieldIdsToCheck.length; x++) {
                      if (x == smallestIndex) {
                        dayOfMonthValue[x] = currentRecord.getSublistValue({
                          sublistId: 'recmachcustrecord500',
                          fieldId: fieldIdsToCheck[x],
                          line: i
                        }); // Uncomment line below for loop debugging

                        console.log(fieldIdsToCheck[x] + ' ' + [x + 1] + ': ' + dayOfMonthValue[x] + ' [' + x + '/' + fieldIdsToCheck.length + ']');
                      }
                    }
                  }
                } else {
                  currentRecord.commitLine({
                    sublistId: 'recmachcustrecord500'
                  });
                }
              }

              break;
            }
          }
        } else {} // Set the flag to true if all relevant search results are processed


        if (count === total) {
          isIfConditionExecuted = true;
          console.log(match + ' match');
          console.log(updated + ' updated');
        }
      });
    }
  }

  return {
    beforeLoad: beforeLoad
  };
});