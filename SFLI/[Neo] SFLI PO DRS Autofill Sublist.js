/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */

define(['N/search', 'N/record', 'N/ui/dialog', 'N/log'], function (search, record, dialog, log) {
  var previousCustomer = null; // Tracks the previous customer value
  var contextMode = ''; // Global variable for context.mode
  var isFieldChangeScriptActive = true; // Global flag for field change control
  var fieldIdsToCheck = [
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
    var currentRecord = context.currentRecord;

    contextMode = context.mode;
    if (contextMode === 'edit') {
      isFieldChangeScriptActive = false;
      var customer = currentRecord.getValue({
        fieldId: 'custrecord_customer'
      });
      if (customer) {
        loadSublistData(currentRecord, customer, contextMode);
      }
    }
  }

  // Function to react when a field changes value
  function fieldChanged(context) {
    if (!isFieldChangeScriptActive) return;

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
      sublistId: 'recmachcustrecord500',
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
          sublistId: 'recmachcustrecord500'
        });

        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });

        var projectedPOBalance = currentRecord.getSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord775',
          line: currentLineIndex
        });

        var currentMonth = currentRecord.getSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord501',
          line: currentLineIndex
        });

        var date = currentRecord.getSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord698',
          line: currentLineIndex
        });

        var poNum = currentRecord.getSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord537',
          line: currentLineIndex
        });

        var itemPrice = currentRecord.getSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord700',
          line: currentLineIndex
        });

        var itemName = currentRecord.getSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord538',
          line: currentLineIndex
        });

        var itemDesc = currentRecord.getSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord539',
          line: currentLineIndex
        });

        var qty = currentRecord.getSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          line: currentLineIndex
        });

        currentRecord.insertLine({
          sublistId: 'recmachcustrecord500',
          line: currentLineIndex + 1
        });

        var month = new Date(currentMonth).getMonth() + 2;

        if (month > 12) {
          month = month - 12; // Wrap around if month exceeds December
        }

        // Set the value of the newly inserted line with the updated month
        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord501',
          value: month
        });

        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord698',
          text: date
        });

        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord537',
          text: poNum
        });

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord700',
          value: itemPrice
        });

        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord538',
          text: itemName
        });

        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord539',
          text: itemDesc
        });

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          value: qty
        });

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          value: projectedPOBalance
        });

        initializeSublistFieldsToZero(currentRecord);

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord775',
          value: projectedPOBalance
        });

        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });

        currentRecord.selectLine({
          sublistId: 'recmachcustrecord500',
          line: currentLineIndex + 1
        });

        isFieldChangeScriptActive = true;
      }
    }
  }

  // Clear sublist lines function
  function clearSublist(currentRecord) {
    var lineCount = currentRecord.getLineCount({
      sublistId: 'recmachcustrecord500'
    });
    for (var i = lineCount - 1; i >= 0; i--) {
      currentRecord.removeLine({
        sublistId: 'recmachcustrecord500',
        line: i
      });
    }
  }

  // Load sublist data
  function loadSublistData(currentRecord, customer, contextMode) {
    try {
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

      do {
        var searchResults = searchObj.run().getRange({
          start: start,
          end: start + pageSize
        });
        resultCount = searchResults.length;

        searchResults.forEach(function (result) {
          if (contextMode === 'edit' ? checkForDuplicate(currentRecord, result) : true) {
            populateSublistLine(currentRecord, result, contextMode);
          }
        });

        searchResults.forEach(function (result) {
          // Get all columns in the current result row
          var columns = result.columns;

          // Loop through each column and log its name and value
          columns.forEach(function (column) {
            var fieldName = column.name;
            var fieldValue = result.getValue(column); // Get the value of the column
            var fieldText = result.getText(column); // Get the text of the column (useful for list/record type fields)

            log.debug({
              title: fieldName,
              details: 'Value: ' + fieldValue + ' | Text: ' + fieldText
            });
          });
        });

        start += pageSize;
      } while (resultCount === pageSize);

      updateRemainingBalance(currentRecord);
      disableFields(currentRecord);
    } catch (e) {
      throw e;
    }
  }

  // Check for duplicate entries in sublist during edit mode
  function checkForDuplicate(currentRecord, result) {
    var lineCount = currentRecord.getLineCount({
      sublistId: 'recmachcustrecord500'
    });

    for (var i = 0; i < lineCount; i++) {
      if (currentRecord.getSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord537',
          line: i
        }) === result.getValue('tranid') &&
        currentRecord.getSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord538',
          line: i
        }) === result.getText('item')) {
        currentRecord.selectLine({
          sublistId: 'recmachcustrecord500',
          line: i
        });
        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
        });
        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord700',
          value: result.getValue('rate')
        });
        currentRecord.setCurrentSublistText({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord695',
          text: result.getText('mainname')
        });
        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });
        return false;
      }
    }
    return true;
  }

  // Populate a sublist line
  function populateSublistLine(currentRecord, result) {
    isFieldChangeScriptActive = false;

    currentRecord.selectNewLine({
      sublistId: 'recmachcustrecord500'
    });
    currentRecord.setCurrentSublistText({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord698',
      text: result.getValue('trandate')
    });
    currentRecord.setCurrentSublistText({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord537',
      text: result.getValue('tranid')
    });
    currentRecord.setCurrentSublistValue({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord700',
      value: result.getValue('rate')
    });
    currentRecord.setCurrentSublistText({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord538',
      text: result.getText('item')
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
      fieldId: 'custrecord695',
      text: result.getText('mainname')
    });
    currentRecord.setCurrentSublistValue({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord540',
      value: result.getValue('formulanumeric', '{quantity}-{quantityshiprecv}')
    });
    initializeSublistFieldsToZero(currentRecord);
    currentRecord.setCurrentSublistValue({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord501',
      value: new Date().getMonth() + 1
    });

    currentRecord.commitLine({
      sublistId: 'recmachcustrecord500'
    });
  }

  // Function to initialize sublist fields to zero
  function initializeSublistFieldsToZero(currentRecord) {
    fieldIdsToCheck.forEach(function (fieldId) {
      currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: fieldId,
        value: 0
      });
    });
  }

  // Function to update remaining balance
  function updateRemainingBalance(currentRecord) {
    var lineCount = currentRecord.getLineCount({
      sublistId: 'recmachcustrecord500'
    });

    for (var i = 0; i < lineCount; i++) {
      currentRecord.selectLine({
        sublistId: 'recmachcustrecord500',
        line: i
      });

      var poBalance = currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: 'custrecord540'
      });
      var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
        return acc + currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: fieldId
        });
      }, 0);

      if (sum > poBalance) {
        var gap = sum - poBalance;

        fieldIdsToCheck.forEach(function (fieldId) {
          var fieldValue = currentRecord.getCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: fieldId
          });

          if (fieldValue < gap && fieldValue > 0 && sum > poBalance) {
            currentRecord.setCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldId,
              value: 0
            });
            sum -= fieldValue;
            gap = sum - poBalance;
          } else if (fieldValue >= gap) {
            currentRecord.setCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldId,
              value: fieldValue - gap
            });
            sum -= gap;
          }
        });
      }

      var remainingBal = poBalance - sum;
      currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: 'custrecord775',
        value: remainingBal
      });

      if (status == true) {
        var nextLineIndex = currentRecord.getCurrentSublistIndex({
          sublistId: 'recmachcustrecord500'
        }) + 1;

        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });

        currentRecord.selectLine({
          sublistId: 'recmachcustrecord500',
          line: nextLineIndex
        });

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          value: remainingBal
        });

        var nextMonthSum = fieldIdsToCheck.reduce(function (acc, fieldId) {
          return acc + currentRecord.getCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: fieldId
          });
        }, 0);

        if (nextMonthSum > remainingBal) {
          var gap = nextMonthSum - remainingBal;

          for (var i = fieldIdsToCheck.length - 1; i >= 0; i--) {
            var fieldId = fieldIdsToCheck[i];
            var fieldValue = currentRecord.getCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldId
            });

            if (fieldValue < gap && fieldValue > 0 && nextMonthSum > remainingBal) {
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: fieldId,
                value: 0
              });
              nextMonthSum -= fieldValue;
              gap = nextMonthSum - remainingBal;
            } else if (fieldValue >= gap) {
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: fieldId,
                value: fieldValue - gap
              });
              nextMonthSum -= gap;
            }
          }
        }
        var nextMonthRemainingBal = remainingBal - nextMonthSum;

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord775',
          value: nextMonthRemainingBal
        });

        var status = currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord778'
        });

        if (status == true) {
          var nextLineIndex = currentRecord.getCurrentSublistIndex({
            sublistId: 'recmachcustrecord500'
          }) + 1;

          currentRecord.commitLine({
            sublistId: 'recmachcustrecord500'
          });

          currentRecord.selectLine({
            sublistId: 'recmachcustrecord500',
            line: nextLineIndex
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord540',
            value: nextMonthRemainingBal
          });

          var nextNextMonthSum = fieldIdsToCheck.reduce(function (acc, fieldId) {
            return acc + currentRecord.getCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldId
            });
          }, 0);

          if (nextNextMonthSum > nextMonthRemainingBal) {
            var gap = nextNextMonthSum - nextMonthRemainingBal;

            for (var i = fieldIdsToCheck.length - 1; i >= 0; i--) {
              var fieldId = fieldIdsToCheck[i];
              var fieldValue = currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: fieldId
              });

              if (fieldValue < gap && fieldValue > 0 && nextNextMonthSum > nextMonthRemainingBal) {
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: fieldId,
                  value: 0
                });
                nextNextMonthSum -= fieldValue;
                gap = nextNextMonthSum - nextMonthRemainingBal;
              } else if (fieldValue >= gap) {
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: fieldId,
                  value: fieldValue - gap
                });
                nextNextMonthSum -= gap;
              }
            }
          }
          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord775',
            value: nextMonthRemainingBal - nextNextMonthSum
          });

          currentRecord.commitLine({
            sublistId: 'recmachcustrecord500'
          });

          currentRecord.selectLine({
            sublistId: 'recmachcustrecord500',
            line: nextLineIndex
          });
        }
        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });

        currentRecord.selectLine({
          sublistId: 'recmachcustrecord500',
          line: nextLineIndex
        });
      }
      currentRecord.commitLine({
        sublistId: 'recmachcustrecord500'
      });

      currentRecord.selectLine({
        sublistId: 'recmachcustrecord500',
        line: i
      });
    }

    isFieldChangeScriptActive = true;
  }

  // Disable specific fields in sublist
  function disableFields(currentRecord) {
    var disableFieldIds = ['custrecord695', 'custrecord698', 'custrecord537',
      'custrecord538', 'custrecord700', 'custrecord540', 'custrecord539'
    ];

    disableFieldIds.forEach(function (fieldId) {
      var lineCount = currentRecord.getLineCount({
        sublistId: 'recmachcustrecord500'
      });
      for (var i = 0; i < lineCount; i++) {
        var field = currentRecord.getSublistField({
          sublistId: 'recmachcustrecord500',
          fieldId: fieldId,
          line: i
        });
        if (field) {
          field.isDisabled = true;
        }
      }
    });
  }

  // Handles field change validation logic
  function handleFieldChangeSumValidation(context, currentRecord, status) {
    var poBalance = currentRecord.getCurrentSublistValue({
      sublistId: 'recmachcustrecord500',
      fieldId: 'custrecord540'
    });

    var sum = fieldIdsToCheck.reduce(function (acc, fieldId) {
      return acc + currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: fieldId
      });
    }, 0);

    if (sum > poBalance) {
      dialog.alert({
        title: 'Invalid Quantity',
        message: 'Total sum exceeds remaining balance.'
      });

      currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: context.fieldId,
        value: 0
      });
    } else {
      var remainingBal = poBalance - sum;
      currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord500',
        fieldId: 'custrecord775',
        value: remainingBal
      });

      if (status == true) {
        var nextLineIndex = currentRecord.getCurrentSublistIndex({
          sublistId: 'recmachcustrecord500'
        }) + 1;

        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });

        currentRecord.selectLine({
          sublistId: 'recmachcustrecord500',
          line: nextLineIndex
        });

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord540',
          value: remainingBal
        });

        var nextMonthSum = fieldIdsToCheck.reduce(function (acc, fieldId) {
          return acc + currentRecord.getCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: fieldId
          });
        }, 0);

        if (nextMonthSum > remainingBal) {
          var gap = nextMonthSum - remainingBal;

          for (var i = fieldIdsToCheck.length - 1; i >= 0; i--) {
            var fieldId = fieldIdsToCheck[i];
            var fieldValue = currentRecord.getCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldId
            });

            if (fieldValue < gap && fieldValue > 0 && nextMonthSum > remainingBal) {
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: fieldId,
                value: 0
              });
              nextMonthSum -= fieldValue;
              gap = nextMonthSum - remainingBal;
            } else if (fieldValue >= gap) {
              currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: fieldId,
                value: fieldValue - gap
              });
              nextMonthSum -= gap;
            }
          }
        }
        var nextMonthRemainingBal = remainingBal - nextMonthSum;

        currentRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord775',
          value: nextMonthRemainingBal
        });

        var status = currentRecord.getCurrentSublistValue({
          sublistId: 'recmachcustrecord500',
          fieldId: 'custrecord778'
        });

        if (status == true) {
          var nextLineIndex = currentRecord.getCurrentSublistIndex({
            sublistId: 'recmachcustrecord500'
          }) + 1;

          currentRecord.commitLine({
            sublistId: 'recmachcustrecord500'
          });

          currentRecord.selectLine({
            sublistId: 'recmachcustrecord500',
            line: nextLineIndex
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord540',
            value: nextMonthRemainingBal
          });

          var nextNextMonthSum = fieldIdsToCheck.reduce(function (acc, fieldId) {
            return acc + currentRecord.getCurrentSublistValue({
              sublistId: 'recmachcustrecord500',
              fieldId: fieldId
            });
          }, 0);

          if (nextNextMonthSum > nextMonthRemainingBal) {
            var gap = nextNextMonthSum - nextMonthRemainingBal;

            for (var i = fieldIdsToCheck.length - 1; i >= 0; i--) {
              var fieldId = fieldIdsToCheck[i];
              var fieldValue = currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord500',
                fieldId: fieldId
              });

              if (fieldValue < gap && fieldValue > 0 && nextNextMonthSum > nextMonthRemainingBal) {
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: fieldId,
                  value: 0
                });
                nextNextMonthSum -= fieldValue;
                gap = nextNextMonthSum - nextMonthRemainingBal;
              } else if (fieldValue >= gap) {
                currentRecord.setCurrentSublistValue({
                  sublistId: 'recmachcustrecord500',
                  fieldId: fieldId,
                  value: fieldValue - gap
                });
                nextNextMonthSum -= gap;
              }
            }
          }
          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord500',
            fieldId: 'custrecord775',
            value: nextMonthRemainingBal - nextNextMonthSum
          });

          currentRecord.commitLine({
            sublistId: 'recmachcustrecord500'
          });

          currentRecord.selectLine({
            sublistId: 'recmachcustrecord500',
            line: nextLineIndex
          });
        }
        currentRecord.commitLine({
          sublistId: 'recmachcustrecord500'
        });

        currentRecord.selectLine({
          sublistId: 'recmachcustrecord500',
          line: nextLineIndex
        });
      }
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged
  };
});