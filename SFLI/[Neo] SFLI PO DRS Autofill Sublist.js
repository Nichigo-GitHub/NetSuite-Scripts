/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */

define(['N/search', 'N/record', 'N/ui/dialog', 'N/log', 'N/format'], function (search, record, dialog, log, format) {
  var previousCustomer = null;
  var contextMode = '';
  var isFieldChangeScriptActive = true;
  var isValidationRunning = false;
  var removeRemarks = true;
  const currentDate = new Date();
  const today = currentDate.getDate();
  var isInitializing = false; // Flag to track initialization phase
  const sublistId = 'recmachcustrecord500';
  const fieldIdsToCheck = [
    'custrecord541', 'custrecord542', 'custrecord543', 'custrecord544',
    'custrecord545', 'custrecord546', 'custrecord547', 'custrecord548',
    'custrecord549', 'custrecord550', 'custrecord551', 'custrecord552',
    'custrecord553', 'custrecord554', 'custrecord555', 'custrecord556',
    'custrecord557', 'custrecord558', 'custrecord559', 'custrecord560',
    'custrecord561', 'custrecord562', 'custrecord563', 'custrecord564',
    'custrecord565', 'custrecord566', 'custrecord567', 'custrecord568',
    'custrecord569', 'custrecord570', 'custrecord571'
  ];

  // Page Init Function - Loads when the form is loaded
  function pageInit(context) {
    isInitializing = true; // Disable fieldChanged logic during initialization
    var currentRecord = context.currentRecord;

    contextMode = context.mode;

    if (contextMode === 'create') {
      currentRecord.setValue({
        fieldId: 'custrecord844',
        value: currentDate
      });
      var lastModifiedField = currentRecord.getField({
        fieldId: 'custrecord844'
      })
      lastModifiedField.isDisabled = true;
    }
    /* else if (contextMode === 'edit') {
         var lastModifiedDate = currentRecord.getValue({
           fieldId: 'custrecord844'
         });

         isFieldChangeScriptActive = false;

         if (!lastModifiedDate) { // Simplified null/undefined check
           currentRecord.setValue({
             fieldId: 'custrecord844',
             value: currentDate
           });

           lastModifiedDate = today
         }

         // Convert both dates to YYYY-MM-DD format for accurate comparison
         var modifiedDate = new Date(lastModifiedDate);
         modifiedDate.setHours(0, 0, 0, 0); // Remove time part

         var todayFormatted = format.format({
           value: currentDate,
           type: format.Type.DATE
         });

         var recordedDate = format.format({
           value: lastModifiedDate,
           type: format.Type.DATE
         });

         log.debug({
           title: 'dates',
           details: 'today: ' + todayFormatted + ' | lastModifiedDate: ' + recordedDate
         });

         if (toString(recordedDate) === toString(todayFormatted)) {
           log.debug('match', 'The record was last modified today.');
         } else {
           log.debug('not match', 'deleting remarks.');
           removeRemarks = true;

           currentRecord.setValue({
             fieldId: 'custrecord844',
             value: currentDate
           });
         }

         var lastModifiedField = currentRecord.getField({
           fieldId: 'custrecord844'
         })

         lastModifiedField.isDisabled = true;
       } */

    if (contextMode === 'edit') {
      isFieldChangeScriptActive = false;
      var customer = currentRecord.getValue({
        fieldId: 'custrecord_customer'
      });
      if (customer) {
        loadSublistData(currentRecord, customer, contextMode);
      }
    }
    isInitializing = false; // Re-enable fieldChanged logic after initialization
  }

  // Function to react when a field changes value
  function fieldChanged(context) {
    if (!isFieldChangeScriptActive || isInitializing) return; // Skip during initialization

    var currentRecord = context.currentRecord;

    // Handle 'custrecord_customer' field change
    if (context.fieldId === 'custrecord_customer') {
      var customer = currentRecord.getValue({
        fieldId: 'custrecord_customer'
      });

      if (customer !== previousCustomer && customer) {
        previousCustomer = customer;
        clearSublist(currentRecord);
        loadSublistData(currentRecord, customer, contextMode);
      } else if (!customer) {
        clearSublist(currentRecord);
      }
    }

    var status = currentRecord.getCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord778'
    });

    // Handle sublist validation field change
    if (fieldIdsToCheck.includes(context.fieldId)) {
      handleFieldChangeSumValidation(context, currentRecord, status);
    }

    if (context.fieldId === 'custrecord778') {
      if (status == true || status === 'T') {
        isFieldChangeScriptActive = false;

        var currentLineIndex = currentRecord.getCurrentSublistIndex({
          sublistId: sublistId
        });

        currentRecord.commitLine({
          sublistId: sublistId
        });

        var projectedPOBalance = currentRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord775',
          line: currentLineIndex
        });

        var NetSuiteMonth = currentRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord501',
          line: currentLineIndex
        });

        var date = currentRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord698',
          line: currentLineIndex
        });

        var poNum = currentRecord.getSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord537',
          line: currentLineIndex
        });

        var vendor = currentRecord.getSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord695',
          line: currentLineIndex
        });

        var itemPrice = currentRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord700',
          line: currentLineIndex
        });

        var itemName = currentRecord.getSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord538',
          line: currentLineIndex
        });

        var itemDesc = currentRecord.getSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord539',
          line: currentLineIndex
        });

        var qty = currentRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord540',
          line: currentLineIndex
        });

        currentRecord.insertLine({
          sublistId: sublistId,
          line: currentLineIndex + 1
        });

        var month = new Date(NetSuiteMonth).getMonth() + 2;

        if (month > 12) {
          month = month - 12;
        }

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord501',
          value: month
        });

        currentRecord.setCurrentSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord698',
          text: date
        });

        currentRecord.setCurrentSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord537',
          text: poNum
        });

        currentRecord.setCurrentSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord695',
          text: vendor
        });

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord700',
          value: itemPrice
        });

        currentRecord.setCurrentSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord538',
          text: itemName
        });

        currentRecord.setCurrentSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord539',
          text: itemDesc
        });

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord540',
          value: qty
        });

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord540',
          value: projectedPOBalance
        });

        initializeSublistFieldsToZero(currentRecord);

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord775',
          value: projectedPOBalance
        });

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord780',
          value: projectedPOBalance
        });

        currentRecord.commitLine({
          sublistId: sublistId
        });

        currentRecord.selectLine({
          sublistId: sublistId,
          line: currentLineIndex + 1
        });

        isFieldChangeScriptActive = true;
      }
    }
  }

  // Clear sublist lines function
  function clearSublist(currentRecord) {
    isFieldChangeScriptActive = false; // Disable fieldChanged logic during clearing
    var lineCount = currentRecord.getLineCount({
      sublistId: sublistId
    });
    for (var i = lineCount - 1; i >= 0; i--) {
      currentRecord.removeLine({
        sublistId: sublistId,
        line: i
      });
    }
    isFieldChangeScriptActive = true; // Re-enable fieldChanged logic after clearing
  }

  // Load sublist data
  function loadSublistData(currentRecord, customer, contextMode) {
    try {
      isFieldChangeScriptActive = false; // Disable fieldChanged logic during loading
      var searchObj = search.create({
        type: 'purchaseorder',
        filters: [
          ['type', 'anyof', 'PurchOrd'], 'AND', ['mainline', 'is', 'F'],
          'AND', ['subsidiary', 'anyof', '14'], 'AND', ['vendtype', 'noneof', '3'],
          'AND', ['status', 'noneof', 'PurchOrd:C', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:A'],
          'AND', ['formulanumeric: {quantity}-{quantityshiprecv}', 'notlessthanorequalto', '0'],
          'AND', ['closed', 'is', 'F'], 'AND', ['custcol50', 'contains', 'DRS'],
          'AND', ['custbody41', 'anyof', customer]
        ],
        columns: [
          'custbody39', 'rate', 'trandate', 'tranid', 'memo', 'custbody41', 'mainname',
          {
            name: 'item',
            sort: search.Sort.ASC
          },
          {
            name: 'formulanumeric',
            formula: '{quantity}-{quantityshiprecv}'
          }
        ]
      });

      var pageSize = 100,
        start = 0,
        resultCount = 0;

      var searchResults = [];

      do {
        var pagedResults = searchObj.run().getRange({
          start: start,
          end: start + pageSize
        });
        searchResults = searchResults.concat(pagedResults);
        resultCount = pagedResults.length;
        start += pageSize;
      } while (resultCount === pageSize);

      var results = [];
      searchObj.run().each(function (result) {
        results.push({
          item: result.getText({
            name: 'item',
            sort: search.Sort.ASC
          }),
          tranid: result.getValue({
            name: 'tranid'
          })
        });
        return true;
      });

      log.debug('Search Results', JSON.stringify(results));

      var matchedKeys = {};

      // Process search results: Add or update sublist lines, and track matches
      searchResults.forEach(function (result) {
        if (!checkAndUpdateSublist(currentRecord, result)) {
          // If result is not found in sublist, add a new line
          populateSublistLine(currentRecord, result);
        }

        var poNumber = result.getValue('tranid');
        var itemName = result.getText('item');
        matchedKeys[poNumber + '-' + itemName] = true;
      });

      // Second, iterate through sublist and remove unmatched lines
      removeUnmatchedSublistLines(currentRecord, matchedKeys);

      disableFields(currentRecord);
    } catch (e) {
      throw e;
    } finally {
      isFieldChangeScriptActive = true; // Re-enable fieldChanged logic after loading
    }
  }

  // Function to update sublist and check for matches
  function checkAndUpdateSublist(currentRecord, result) {
    var lineCount = currentRecord.getLineCount({
      sublistId: sublistId
    });

    for (var i = 0; i < lineCount; i++) {
      var currentPO = currentRecord.getSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord537',
        line: i
      });
      var currentItem = currentRecord.getSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord538',
        line: i
      });

      // If there is a match, update and commit the sublist
      if (currentPO === result.getValue('tranid') && currentItem === result.getText('item')) {
        currentRecord.selectLine({
          sublistId: sublistId,
          line: i
        });
        var previousBal = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord540'
        });
        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord780',
          value: previousBal
        });
        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord540',
          value: result.getValue('formulanumeric')
        });
        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord700',
          value: result.getValue('rate')
        });
        currentRecord.setCurrentSublistText({
          sublistId: sublistId,
          fieldId: 'custrecord695',
          text: result.getText('mainname')
        });
        /* if (removeRemarks) {
          currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord_remarks',
            value: null
          });
        } */

        var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
          return acc + currentRecord.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId
          });
        }, 0);

        var NetSuiteMonth = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord501'
        });

        var systemMonth = new Date().getMonth();

        var currentMonth = systemMonth + 1;

        var nextMonth = currentMonth + 1;

        if (nextMonth > 12) {
          nextMonth = nextMonth - 12;
        }

        if (currentMonth > 1) {
          var previousMonth = currentMonth - 1
        } else {
          var previousMonth = currentMonth + 11
        }

        var status = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord778'
        });

        if (sum == 0) {
          if (NetSuiteMonth == previousMonth && status == true || status === 'T') {
            var previousMonthPO = currentRecord.getCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord537'
            });
            var previousMonthItem = currentRecord.getCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord538'
            });
            var updatedPObal = currentRecord.getCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord540'
            });
            var vendor = currentRecord.getCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord695'
            });

            currentRecord.removeLine({
              sublistId: sublistId,
              line: i
            });

            lineCount = currentRecord.getLineCount({
              sublistId: sublistId
            });

            currentRecord.selectLine({
              sublistId: sublistId,
              line: i
            });

            if (previousMonthPO == currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord537'
              }) && previousMonthItem == currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord538'
              })) {
              if (!currentRecord.getCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord780'
                })) {
                var currentToOldPObal = currentRecord.getCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord540'
                })

                currentRecord.setCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord780',
                  value: currentToOldPObal
                });
              }

              currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord540',
                value: updatedPObal
              });

              if (!currentRecord.getCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord695'
                }))
                currentRecord.setCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord695',
                  value: vendor
                });

              var result = getGapAndSum(currentRecord);
              var remainingBal = result.remainingBal;

              currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord775',
                value: remainingBal
              });
            }
            i--;
          } else if (NetSuiteMonth != currentMonth) {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord501',
              value: new Date().getMonth() + 1
            });
          }
        } else if (NetSuiteMonth == nextMonth) {} else {
          if (NetSuiteMonth == previousMonth || NetSuiteMonth == currentMonth) {
            var result = getGapAndSum(currentRecord);

            currentRecord.selectLine({
              sublistId: sublistId,
              line: i
            });

            var poBalance = result.poBalance;
            var gap = result.gap;
            if (NetSuiteMonth == previousMonth && status == true || status === 'T') {
              var updatedPObal = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord540'
              });
              var vendor = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord695'
              });

              currentRecord.removeLine({
                sublistId: sublistId,
                line: i
              });

              lineCount = currentRecord.getLineCount({
                sublistId: sublistId
              });

              currentRecord.selectLine({
                sublistId: sublistId,
                line: i
              });

              if (!currentRecord.getCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord780'
                })) {
                var currentToOldPObal = currentRecord.getCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord540'
                })

                currentRecord.setCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord780',
                  value: currentToOldPObal
                });
              }

              currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord540',
                value: updatedPObal
              });

              if (!currentRecord.getCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord695'
                }))
                currentRecord.setCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord695',
                  value: vendor
                });

              var result = getGapAndSum(currentRecord);
              var remainingBal = result.remainingBal;

              if (remainingBal != updatedPObal) {
                currentRecord.setCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord775',
                  value: remainingBal
                });
              }
            } else {
              var prevProjectedPOBal = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord775'
              });

              currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord775',
                value: poBalance
              });

              var projectedPOBalance = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord775'
              });

              var carryOver = 0;
              if (gap > sum)
                carryOver = gap - sum;

              if (status == true || status === 'T' && carryOver > 0) {
                currentRecord.commitLine({
                  sublistId: sublistId
                });

                if (i < lineCount) {
                  i++;

                  currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                  });

                  prevProjectedPOBal = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord540'
                  });

                  if (prevProjectedPOBal) {
                    currentRecord.setCurrentSublistValue({
                      sublistId: sublistId,
                      fieldId: 'custrecord780',
                      value: prevProjectedPOBal
                    });
                  }

                  currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord540',
                    value: projectedPOBalance
                  });

                  currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord775',
                    value: prevProjectedPOBal - projectedPOBalance
                  });

                  currentRecord.commitLine({
                    sublistId: sublistId
                  });

                  currentRecord.selectLine({
                    sublistId: sublistId,
                    line: i
                  });
                }
              } else {
                currentRecord.commitLine({
                  sublistId: sublistId
                });

                currentRecord.selectLine({
                  sublistId: sublistId,
                  line: i
                });
              }
            }
          } else {
            currentRecord.commitLine({
              sublistId: sublistId
            });

            currentRecord.selectLine({
              sublistId: sublistId,
              line: i
            });
          }
        }
        isFieldChangeScriptActive = true;
        return true; // Match found
      }
    }
    isFieldChangeScriptActive = true;
    return false; // No match
  }

  // Function to remove sublist lines that have no matching entries in the search results
  function removeUnmatchedSublistLines(currentRecord, matchedKeys) {
    var lineCount = currentRecord.getLineCount({
      sublistId: sublistId
    });

    for (var i = lineCount - 1; i >= 0; i--) {
      var currentPO = currentRecord.getSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord537',
        line: i
      });
      var currentItem = currentRecord.getSublistText({
        sublistId: sublistId,
        fieldId: 'custrecord538',
        line: i
      });

      var key = currentPO + '-' + currentItem;

      if (!matchedKeys[key]) {
        currentRecord.removeLine({
          sublistId: sublistId,
          line: i
        });
      }
    }
  }

  // Populate a sublist line
  function populateSublistLine(currentRecord, result) {
    isFieldChangeScriptActive = false;

    log.debug({
      title: 'populateSublistLine',
      details: result.getValue('tranid') + ': ' + result.getText('item')
    })

    currentRecord.selectNewLine({
      sublistId: sublistId
    });
    currentRecord.setCurrentSublistText({
      sublistId: sublistId,
      fieldId: 'custrecord698',
      text: result.getValue('trandate')
    });
    currentRecord.setCurrentSublistText({
      sublistId: sublistId,
      fieldId: 'custrecord537',
      text: result.getValue('tranid')
    });
    currentRecord.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord700',
      value: result.getValue('rate')
    });
    currentRecord.setCurrentSublistText({
      sublistId: sublistId,
      fieldId: 'custrecord538',
      text: result.getText('item')
    });
    currentRecord.setCurrentSublistText({
      sublistId: sublistId,
      fieldId: 'custrecord539',
      text: result.getValue({
        name: 'memo'
      })
    });
    currentRecord.setCurrentSublistText({
      sublistId: sublistId,
      fieldId: 'custrecord695',
      text: result.getText('mainname')
    });
    currentRecord.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord540',
      value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
    });
    currentRecord.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord780',
      value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
    });
    currentRecord.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord775',
      value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
    });
    initializeSublistFieldsToZero(currentRecord);
    currentRecord.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord501',
      value: new Date().getMonth() + 1
    });

    currentRecord.commitLine({
      sublistId: sublistId
    });
  }

  // Handles field change validation logic
  function handleFieldChangeSumValidation(context, currentRecord, status) {
    if (isValidationRunning) return; // Exit if already running
    isValidationRunning = true;

    try {
      var currentLine = currentRecord.getCurrentSublistIndex({
        sublistId: sublistId
      });

      var poBalance = currentRecord.getCurrentSublistValue({
        sublistId: sublistId,
        fieldId: 'custrecord540'
      });

      var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
        return acc + currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: fieldId
        });
      }, 0);

      if (sum > poBalance) {
        errorDialog(currentRecord, context, currentLine);

        var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
          return acc + currentRecord.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId
          });
        }, 0);

        currentRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord775',
          value: poBalance - sum
        });
      } else if (poBalance > 0) {
        var remainingBal = poBalance - sum;

        if (remainingBal < 0) {
          errorDialog(currentRecord, context, currentLine);
          return;
        } else {
          currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord775',
            value: remainingBal
          });

          if (status == true) {
            var nextLineIndex = currentRecord.getCurrentSublistIndex({
              sublistId: sublistId
            }) + 1;

            currentRecord.commitLine({
              sublistId: sublistId
            });

            currentRecord.selectLine({
              sublistId: sublistId,
              line: nextLineIndex
            });

            var previousBal = currentRecord.getCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord540'
            });

            if (previousBal) {
              currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord780',
                value: previousBal
              });
            }

            currentRecord.setCurrentSublistValue({
              sublistId: sublistId,
              fieldId: 'custrecord540',
              value: remainingBal
            });

            sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
              return acc + currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldId
              });
            }, 0);

            remainingBal -= sum;

            if (remainingBal < 0) {
              errorDialog(currentRecord, context, currentLine);

              return;
            } else {
              currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord775',
                value: remainingBal
              });

              status = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord778'
              });

              if (status == true) {
                currentRecord.commitLine({
                  sublistId: sublistId
                });

                currentRecord.selectLine({
                  sublistId: sublistId,
                  line: nextLineIndex + 1
                });

                currentRecord.setCurrentSublistValue({
                  sublistId: sublistId,
                  fieldId: 'custrecord540',
                  value: remainingBal
                });

                sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
                  return acc + currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId
                  });
                }, 0);

                remainingBal -= sum;

                if (remainingBal < 0) {
                  errorDialog(currentRecord, context, currentLine);

                  return;
                } else {
                  previousBal = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord775'
                  });

                  if (previousBal) {
                    currentRecord.setCurrentSublistValue({
                      sublistId: sublistId,
                      fieldId: 'custrecord780',
                      value: previousBal
                    });
                  }

                  currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord775',
                    value: remainingBal
                  });

                  currentRecord.commitLine({
                    sublistId: sublistId
                  });

                  currentRecord.selectLine({
                    sublistId: sublistId,
                    line: nextLineIndex
                  });
                }
              } else {
                currentRecord.commitLine({
                  sublistId: sublistId
                });

                currentRecord.selectLine({
                  sublistId: sublistId,
                  line: nextLineIndex
                });
              }
            }
          }
        }
      }
    } finally {
      isValidationRunning = false; // Reset the flag after execution
    }
  }

  // Function that gets the gap of previous and current PO balance and the sum of the line's DRS
  function getGapAndSum(currentRecord) {
    var prevPoBalance = currentRecord.getCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord780'
    });
    var poBalance = currentRecord.getCurrentSublistValue({
      sublistId: sublistId,
      fieldId: 'custrecord540'
    });

    var gap = prevPoBalance - poBalance;

    fieldIdsToCheck.forEach(function (fieldId) {
      var fieldValue = currentRecord.getCurrentSublistValue({
        sublistId: sublistId,
        fieldId: fieldId
      });

      if (gap > 0) {
        if (fieldValue < gap && fieldValue > 0) {
          currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            value: 0
          });
          gap -= fieldValue;
        } else if (fieldValue >= gap) {
          currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            value: fieldValue - gap,
          });
          gap = 0;
        }
      }
    });

    sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
      return acc + currentRecord.getCurrentSublistValue({
        sublistId: sublistId,
        fieldId: fieldId
      });
    }, 0);

    currentRecord.commitLine({
      sublistId: sublistId
    });

    return {
      remainingBal: poBalance - sum,
      poBalance: poBalance,
      gap: prevPoBalance - poBalance
    };
  }

  // Function to initialize sublist fields to zero
  function initializeSublistFieldsToZero(currentRecord) {
    fieldIdsToCheck.forEach(function (fieldId) {
      currentRecord.setCurrentSublistValue({
        sublistId: sublistId,
        fieldId: fieldId,
        value: 0
      });
    });
  }

  function errorDialog(currentRecord, context, i) {
    // Temporarily disable validation
    isValidationRunning = false;

    currentRecord.selectLine({
      sublistId: sublistId,
      line: i
    });

    currentRecord.setCurrentSublistValue({
      sublistId: sublistId,
      fieldId: context.fieldId,
      value: 0
    });

    dialog.alert({
      title: 'Invalid Quantity',
      message: 'Remaining balance cannot be less than 0, please adjust your input.'
    });

    isValidationRunning = true;
  }

  // Disable specific fields in sublist
  function disableFields(currentRecord) {
    var disableFieldIds = ['custrecord695', 'custrecord698', 'custrecord537',
      'custrecord538', 'custrecord700', 'custrecord540', 'custrecord539', 'custrecord780'
    ];

    disableFieldIds.forEach(function (fieldId) {
      var lineCount = currentRecord.getLineCount({
        sublistId: sublistId
      });
      for (var i = 0; i < lineCount; i++) {
        var field = currentRecord.getSublistField({
          sublistId: sublistId,
          fieldId: fieldId,
          line: i
        });
        if (field) {
          field.isDisabled = true;
        }
      }
    });
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged
  };
});