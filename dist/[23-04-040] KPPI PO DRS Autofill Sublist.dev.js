"use strict";
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord'], function (search, currentRecord) {
  // Flag to indicate if the if condition has been executed
  var isIfConditionExecuted = false; // Get the current month

  var currentMonth = getMonthText(); // Array to store the field IDs to check in the sublist

  var fieldIdsToCheck = [];

  for (var i = 541; i <= 571; i++) {
    fieldIdsToCheck.push('custrecord' + i);
  }

  function fieldChanged(context) {
    // Get the current record object from the context
    var currentRecord = context.currentRecord; // If the field changed is 'custrecord533'

    if (context.fieldId === 'custrecord533') {
      if (context.fieldId != '' || context.fieldId != null || context.fieldId != undefined) {
        try {
          // Get the selected vendor from the pop-up list field
          var vendor = currentRecord.getText({
            fieldId: 'custrecord533'
          }); // Remove all existing lines from the sublist

          var lineCount = currentRecord.getLineCount({
            sublistId: 'recmachcustrecord500'
          });

          for (var i = lineCount - 1; i >= 0; i--) {
            currentRecord.removeLine({
              sublistId: 'recmachcustrecord500',
              line: i
            });
          } // Perform a saved search based on the selected vendor value


          var searchObj = search.create({
            type: 'purchaseorder',
            filters: [['type', 'anyof', 'PurchOrd'], 'AND', ['mainline', 'is', 'F'], 'AND', ['subsidiary', 'anyof', '18'], 'AND', ['vendtype', 'noneof', '3'], 'AND', ['status', 'noneof', 'PurchOrd:C', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:A'], 'AND', ['formulanumeric: {quantity}-{quantityshiprecv}', 'notlessthanorequalto', '0'], 'AND', ['closed', 'is', 'F'], 'AND', ['custcol13', 'contains', 'DRS']],
            columns: [search.createColumn({
              name: 'custbody39'
            }), search.createColumn({
              name: 'custbody382'
            }), search.createColumn({
              name: 'trandate'
            }), search.createColumn({
              name: 'tranid'
            }), search.createColumn({
              name: 'item',
              sort: search.Sort.ASC // Sorting order: ascending

            }), search.createColumn({
              name: 'memo'
            }), search.createColumn({
              name: 'custbody41'
            }), search.createColumn({
              name: 'mainname'
            }), search.createColumn({
              name: 'formulanumeric',
              formula: '{quantity}-{quantityshiprecv}'
            })]
          }); // Run the search and get the results

          var searchResults = searchObj.run().getRange({
            start: 0,
            end: 999
          });
          var numOfResults = 0; // Loop through the search results and count number of results

          searchResults.forEach(function (result) {
            var supplier = result.getText({
              name: 'mainname'
            });

            if (vendor == supplier) {
              numOfResults++;
            }
          }); // Loop through the search results and add new lines to the sublist

          var count = 0;
          searchResults.forEach(function (result) {
            var supplier = result.getText({
              name: 'mainname'
            });

            if (vendor == supplier) {
              // Add a new line to the sublist and set the values
              currentRecord.selectNewLine({
                sublistId: 'recmachcustrecord500'
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord537',
                text: result.getValue({
                  name: 'tranid'
                })
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord698',
                text: result.getValue({
                  name: 'trandate'
                })
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord501',
                text: currentMonth
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord700',
                text: result.getText({
                  name: 'custbody382'
                })
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord539',
                text: result.getValue({
                  name: 'memo'
                })
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord538',
                text: result.getText({
                  name: 'item'
                })
              });
              currentRecord.setCurrentSublistText({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord536',
                text: result.getText({
                  name: 'custbody41'
                })
              });
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: 'custrecord540',
                value: parseInt(result.getValue({
                  name: 'formulanumeric',
                  formula: '{quantity}-{quantityshiprecv}'
                }))
              }); // Set other fields in the sublist to zero

              for (var i = 0; i < fieldIdsToCheck.length; i++) {
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: fieldIdsToCheck[i],
                  value: 0
                });
              }

              currentRecord.commitLine({
                sublistId: 'recmachcustrecord500'
              });
              count++; // Set the flag to true if all relevant search results are processed

              if (count === numOfResults) {
                isIfConditionExecuted = true;
              }
            }
          }); // Get fields for disabling

          var poNumberField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord537',
            line: 0
          }),
              prRequestorField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord700',
            line: 0
          }),
              descriptionField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord539',
            line: 0
          }),
              itemKeyField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord538',
            line: 0
          }),
              customerField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord536',
            line: 0
          }),
              poBalanceField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord540',
            line: 0
          }),
              poCreatedDateField = currentRecord.getSublistField({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord698',
            line: 0
          }); // Disable the fields

          poNumberField.isDisabled = true;
          prRequestorField.isDisabled = true;
          descriptionField.isDisabled = true;
          itemKeyField.isDisabled = true;
          customerField.isDisabled = true;
          poBalanceField.isDisabled = true;
          poCreatedDateField.isDisabled = true;
        } catch (e) {
          // Log the error
          console.log('An error occurred:', e.message); // Optionally, rethrow the error to allow it to propagate

          throw e;
        }
      }
    } else if (context.fieldId === 'custrecord541' || context.fieldId === 'custrecord542' || context.fieldId === 'custrecord543' || context.fieldId === 'custrecord544' || context.fieldId === 'custrecord545' || context.fieldId === 'custrecord546' || context.fieldId === 'custrecord547' || context.fieldId === 'custrecord548' || context.fieldId === 'custrecord549' || context.fieldId === 'custrecord550' || context.fieldId === 'custrecord551' || context.fieldId === 'custrecord552' || context.fieldId === 'custrecord553' || context.fieldId === 'custrecord554' || context.fieldId === 'custrecord555' || context.fieldId === 'custrecord556' || context.fieldId === 'custrecord557' || context.fieldId === 'custrecord558' || context.fieldId === 'custrecord559' || context.fieldId === 'custrecord560' || context.fieldId === 'custrecord561' || context.fieldId === 'custrecord562' || context.fieldId === 'custrecord563' || context.fieldId === 'custrecord564' || context.fieldId === 'custrecord565' || context.fieldId === 'custrecord566' || context.fieldId === 'custrecord567' || context.fieldId === 'custrecord568' || context.fieldId === 'custrecord569' || context.fieldId === 'custrecord570' || context.fieldId === 'custrecord571') {
      var sum = 0;
      var trigger = context.fieldId;
      var triggerValue = currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: trigger
      }); // Check if the if condition was executed before running the else if condition

      if (isIfConditionExecuted && triggerValue !== '') {
        // console.log('triggerValue: ' + triggerValue)
        for (var i = 0; i < fieldIdsToCheck.length; i++) {
          var dayOfMonth = currentRecord.getCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: fieldIdsToCheck[i]
          });
          sum += dayOfMonth;
          var poBalanceValue = currentRecord.getCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord540'
          });

          if (sum > poBalanceValue) {
            window.alert('[Notice: Input is Exceeding The Remaining PO Balance]');
            sum = -triggerValue;
            currentRecord.setCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: trigger,
              value: 0
            });
            break; // Exit the loop if the condition is met for any field
          }
        }
      } else if (isIfConditionExecuted && triggerValue === '') {
        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: trigger,
          value: 0
        });
      }
    }
  }

  function pageInit(context) {
    // Check if the sublist is the "item" sublist and the mode is 'edit'
    if (context.mode === 'edit') {
      if (context.fieldId != '' || context.fieldId != null || context.fieldId != undefined) {
        // Get the current record
        var currentRecord = context.currentRecord; // Get line count from the sublist

        var lineCount = currentRecord.getLineCount({
          sublistId: 'recmachcustrecord500'
        }); // Perform a saved search based on the selected vendor value

        var searchObj = search.create({
          type: 'purchaseorder',
          filters: [['type', 'anyof', 'PurchOrd'], 'AND', ['mainline', 'is', 'F'], 'AND', ['subsidiary', 'anyof', '18'], 'AND', ['vendtype', 'noneof', '3'], 'AND', ['status', 'noneof', 'PurchOrd:C', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:A'], 'AND', ['formulanumeric: {quantity}-{quantityshiprecv}', 'notlessthanorequalto', '0'], 'AND', ['closed', 'is', 'F'], 'AND', ['custcol13', 'contains', 'DRS']],
          columns: [search.createColumn({
            name: 'custbody39'
          }), search.createColumn({
            name: 'custbody382'
          }), search.createColumn({
            name: 'trandate'
          }), search.createColumn({
            name: 'tranid'
          }), search.createColumn({
            name: 'item',
            sort: search.Sort.ASC // Sorting order: ascending

          }), search.createColumn({
            name: 'memo'
          }), search.createColumn({
            name: 'custbody41'
          }), search.createColumn({
            name: 'mainname'
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
        var total = 0; // Loop through the search results and count number of results

        total = searchResults.length; // Loop through the search results and add new lines to the sublist

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
          }); // console.log('count: ' + count + '/' + total)

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
                }); // Get the selected PO balance from the sublist field

                var monthValue = currentRecord.getSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord501',
                  line: i
                });
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord540',
                  line: i,
                  value: ssPObal
                }); // Get the selected PO balance from the sublist field

                var dateString = currentRecord.getText({
                  fieldId: 'custrecord499'
                }); // Split the date string into an array

                var dateParts = dateString.split('/');
                /* console.log('---------------------------------');
                console.log('Customer  : ' + vendor);
                console.log('PO Number : ' + POnum);
                console.log('Item Code: ' + itemCode);
                console.log('PO Balance: ' + PObal);
                console.log('---------------------------------');
                console.log('ssCustomer  : ' + supplier);
                console.log('ssPO Number : ' + ssPOnum);
                console.log('ssPO Balance: ' + ssPObal);
                console.log('ssItem Code: ' + ssItemCode);
                console.log('---------------------------------'); */

                var dayOfMonthValue = [];
                var sum = 0;

                for (var x = 0; x < fieldIdsToCheck.length; x++) {
                  dayOfMonthValue[x] = currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord500',
                    fieldId: fieldIdsToCheck[x],
                    line: i
                  }); // Extract day, month, and year

                  var day = x + 1; // Convert to integer

                  var month = monthValue - 1; // Convert to integer (subtract 1 from month as months are 0-based)

                  var year = parseInt(dateParts[2], 10); // Convert to integer
                  // Create a Date object for the input date

                  var inputDate = new Date(year, month, day); // Get the current date

                  var currentDate = new Date(); // Compare the two dates

                  if (inputDate < currentDate) {
                    // remove value
                    currentRecord.setCurrentSublistValue({
                      sublistId: 'recmachcustrecord500',
                      fieldId: fieldIdsToCheck[x],
                      line: i,
                      value: 0
                    });
                    dayOfMonthValue[x] = 0;
                    sum += dayOfMonthValue[x];
                  } else if (inputDate > currentDate) {
                    sum += dayOfMonthValue[x];
                  } else {
                    sum += dayOfMonthValue[x];
                  }

                  if (dayOfMonthValue[x] > 0) {// Uncomment line below for loop debugging
                    // console.log(fieldIdsToCheck[x] + ' ' + [x + 1] + ': ' + dayOfMonthValue[x] + ' [' + [x + 1] + '/' + fieldIdsToCheck.length + ']')
                  }
                }

                for (var y = 0; y < fieldIdsToCheck.length; y++) {
                  if (sum > ssPObal) {
                    while (sum > ssPObal) {
                      var smallest = 999999999;
                      var smallestIndex = [];

                      for (var z = 0; z < dayOfMonthValue.length; z++) {
                        if (dayOfMonthValue[z] > 0) {
                          /* if (dayOfMonthValue[y] < smallest) { */
                          smallest = dayOfMonthValue[z];
                          smallestIndex = z;
                          /* } */

                          break;
                        }
                      }

                      if (smallest == 999999999) smallest = 0;
                      sum -= smallest;
                      /* console.log('-----------------------------------------------------------')
                      console.log('earliest input   : ' + smallest)
                      console.log('index of earliest: ' + [smallestIndex + 1])
                      console.log('earliest - sum   = ' + sum)
                      console.log('PO Balance       : ' + ssPObal)
                      console.log('-----------------------------------------------------------')
                        console.log('Old value of Day ' + [smallestIndex + 1] + ': ' + currentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord500',
                        fieldId: fieldIdsToCheck[smallestIndex],
                        line: i
                      })) */

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
                      /* console.log('New value of Day ' + [smallestIndex + 1] + ': ' + currentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord500',
                        fieldId: fieldIdsToCheck[smallestIndex],
                        line: i
                      })) */

                      for (var x = 0; x < fieldIdsToCheck.length; x++) {
                        dayOfMonthValue[x] = currentRecord.getSublistValue({
                          sublistId: 'recmachcustrecord500',
                          fieldId: fieldIdsToCheck[x],
                          line: i
                        });

                        if (dayOfMonthValue[x] > 0) {// Uncomment line below for loop debugging
                          // console.log(fieldIdsToCheck[x] + ' ' + [x + 1] + ': ' + dayOfMonthValue[x] + ' [' + [x + 1] + '/' + fieldIdsToCheck.length + ']')
                        }
                      }
                    }
                  } else {
                    currentRecord.commitLine({
                      sublistId: 'recmachcustrecord500'
                    });
                    break;
                  }
                }

                break;
              } else if (POnum != ssPOnum && itemCode != ssItemCode && i == lineCount - 1) {
                // Add a new line to the sublist and set the values
                currentRecord.selectNewLine({
                  sublistId: 'recmachcustrecord500'
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord537',
                  text: result.getValue({
                    name: 'tranid'
                  })
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord698',
                  text: result.getValue({
                    name: 'trandate'
                  })
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord501',
                  text: currentMonth
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord700',
                  text: result.getText({
                    name: 'custbody382'
                  })
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord539',
                  text: result.getValue({
                    name: 'memo'
                  })
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord538',
                  text: result.getText({
                    name: 'item'
                  })
                });
                currentRecord.setCurrentSublistText({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord536',
                  text: result.getText({
                    name: 'custbody41'
                  })
                });
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: 'custrecord540',
                  value: parseInt(result.getValue({
                    name: 'formulanumeric',
                    formula: '{quantity}-{quantityshiprecv}'
                  }))
                }); // Set other fields in the sublist to zero

                for (var i = 0; i < fieldIdsToCheck.length; i++) {
                  currentRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord500',
                    fieldId: fieldIdsToCheck[i],
                    value: 0
                  });
                }

                currentRecord.commitLine({
                  sublistId: 'recmachcustrecord500'
                });
                /* console.log('---------------------------------');
                console.log('[New Record] PO Number: ' + ssPOnum + ' | Item Code: ' + ssItemCode);
                console.log('Customer  : ' + vendor);
                console.log('PO Balance: ' + ssPObal);
                console.log('---------------------------------'); */

                break;
              }
            }
          }
        }); // Get line count from the sublist

        var lineCount = currentRecord.getLineCount({
          sublistId: 'recmachcustrecord500'
        });

        for (i = 0; i < lineCount; i++) {
          var match = 0;
          count = 0; // Get the selected PO number from the sublist field

          var POnum = currentRecord.getSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord537',
            line: i
          }); // Get the selected Item Code from the sublist field

          var itemCode = currentRecord.getSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord538',
            line: i
          }); //console.log('i: ' + i + '/' + [lineCount - 1] + ' | PO num: ' + POnum + ' | Item Code: ' + itemCode);
          // Loop through the search results and add new lines to the sublist

          for (var x = 0; x < searchResults.length; x++) {
            count++;
            var ssPOnum = searchResults[x].getValue({
              name: 'tranid'
            });
            var ssItemCode = searchResults[x].getText({
              name: 'item'
            });

            if (POnum == ssPOnum && itemCode == ssItemCode) {
              match = 1;
              break; // You can use break here
            }
          }

          if (match == 0) {
            /* console.log('---------------------------------');
            console.log('[Deleted] i: ' + i + '/' + [lineCount - 1] + ' | PO Number: ' + POnum + ' | ' + 'Item Code: ' + itemCode);
            console.log('---------------------------------'); */
            // Select the line you want to delete
            currentRecord.selectLine({
              sublistId: 'recmachcustrecord500',
              line: i
            }); // Remove the selected line

            currentRecord.removeLine({
              sublistId: 'recmachcustrecord500',
              line: i
            }); // Commit the changes

            currentRecord.commitLine({
              sublistId: 'recmachcustrecord500'
            }); // Get line count from the sublist

            var lineCount = currentRecord.getLineCount({
              sublistId: 'recmachcustrecord500'
            });
          } // Set the flag to true if all relevant search results are processed


          if (i === lineCount - 1) {
            isIfConditionExecuted = true;
          }
        } // Get fields for disabling


        var poNumberField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord537',
          line: 0
        }),
            prRequestorField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord700',
          line: 0
        }),
            descriptionField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord539',
          line: 0
        }),
            itemKeyField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord538',
          line: 0
        }),
            customerField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord536',
          line: 0
        }),
            poBalanceField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          line: 0
        }),
            poCreatedDateField = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord698',
          line: 0
        }); // Disable the fields

        poNumberField.isDisabled = true;
        prRequestorField.isDisabled = true;
        descriptionField.isDisabled = true;
        itemKeyField.isDisabled = true;
        customerField.isDisabled = true;
        poBalanceField.isDisabled = true;
        poCreatedDateField.isDisabled = true;
      }

      if (context.fieldId === 'custrecord541' || context.fieldId === 'custrecord542' || context.fieldId === 'custrecord543' || context.fieldId === 'custrecord544' || context.fieldId === 'custrecord545' || context.fieldId === 'custrecord546' || context.fieldId === 'custrecord547' || context.fieldId === 'custrecord548' || context.fieldId === 'custrecord549' || context.fieldId === 'custrecord550' || context.fieldId === 'custrecord551' || context.fieldId === 'custrecord552' || context.fieldId === 'custrecord553' || context.fieldId === 'custrecord554' || context.fieldId === 'custrecord555' || context.fieldId === 'custrecord556' || context.fieldId === 'custrecord557' || context.fieldId === 'custrecord558' || context.fieldId === 'custrecord559' || context.fieldId === 'custrecord560' || context.fieldId === 'custrecord561' || context.fieldId === 'custrecord562' || context.fieldId === 'custrecord563' || context.fieldId === 'custrecord564' || context.fieldId === 'custrecord565' || context.fieldId === 'custrecord566' || context.fieldId === 'custrecord567' || context.fieldId === 'custrecord568' || context.fieldId === 'custrecord569' || context.fieldId === 'custrecord570' || context.fieldId === 'custrecord571') {
        var sum = 0;
        var trigger = context.fieldId;
        var triggerValue = currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: trigger
        }); // Check if the if condition was executed before running the else if condition

        if (isIfConditionExecuted && triggerValue !== '') {
          // console.log('triggerValue: ' + triggerValue)
          for (var i = 0; i < fieldIdsToCheck.length; i++) {
            var dayOfMonth = currentRecord.getCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldIdsToCheck[i]
            });
            sum += dayOfMonth;
            var poBalanceValue = currentRecord.getCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: 'custrecord540'
            });

            if (sum > poBalanceValue) {
              window.alert('[Notice: Input is Exceeding The Remaining PO Balance]');
              sum = -triggerValue;
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: trigger,
                value: 0
              });
              break; // Exit the loop if the condition is met for any field
            }
          }
        } else if (isIfConditionExecuted && triggerValue === '') {
          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: trigger,
            value: 0
          });
        }
      }
    }
  } // Get the color for the current month


  function getMonthText() {
    var currentMonth = new Date().getMonth(),
        // Predefined names for each month
    monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthName[currentMonth];
  }

  return {
    fieldChanged: fieldChanged,
    pageInit: pageInit
  };
});