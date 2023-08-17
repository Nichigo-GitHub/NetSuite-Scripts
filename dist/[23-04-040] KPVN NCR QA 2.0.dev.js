"use strict";

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord'], function (search, currentRecord) {
  function pageInit(context) {
    var rr = currentRecord.getValue('custrecord626');
    console.log("rr no" + rr);
    if (!rr) return; // 2023.06.07 Modified JTAA
    // -----------------------------------------------------------------------------------------------

    var itemreceiptSearch = search.create({
      type: 'itemreceipt',
      filters: [["transactionnumbertext", "is", rr], 'AND', ["mainline", "is", 'F']],
      columns: [search.createColumn({
        name: "mainname"
      }), search.createColumn({
        name: "custcol227",
        join: "appliedToTransaction"
      }), search.createColumn({
        name: "tranid"
      }).setSort(false), search.createColumn({
        name: "trandate"
      }).setSort(false), search.createColumn({
        name: "custbody28"
      }), search.createColumn({
        name: "custbody29"
      }), search.createColumn({
        name: "formulatext",
        formula: "SUBSTR({createdfrom.number},-4,4)"
      }), search.createColumn({
        name: "item"
      }), search.createColumn({
        name: "formulatext",
        formula: "CASE WHEN {item.custitem122} is null THEN {appliedtotransaction.memo} ELSE {item.custitem122} END"
      }), search.createColumn({
        name: "formulanumeric",
        formula: "ABS({quantity})"
      }), search.createColumn({
        name: "unit"
      }), search.createColumn({
        name: "custcol50",
        join: "appliedToTransaction"
      }), search.createColumn({
        name: "formulatext",
        formula: "TO_CHAR({datecreated},'DD-Mon-YYYY')"
      }), search.createColumn({
        name: "formulanumeric",
        formula: "ROUND((ABS({amount}/{quantity})),4)"
      }), search.createColumn({
        name: "entity",
        join: "appliedToTransaction"
      }), search.createColumn({
        name: "item"
      }), search.createColumn({
        name: "quantity"
      }), search.createColumn({
        name: "fxrate"
      })]
    });
    var itemreceiptSearchResults = itemreceiptSearch.run().getRange({
      start: 0,
      end: 1000 // Adjust this as needed

    });
    var lineCount = itemreceiptSearchResults.length;

    for (var i = 0; i < lineCount; i++) {
      var result = itemreceiptSearchResults[i]; // 2023.06.07 Modified JTAA
      // -----------------------------------------------------------------------------------------------

      currentRecord.selectNewLine({
        sublistId: 'recmachcustrecord625'
      }); // Customer

      currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord625',
        fieldId: "custrecord624",
        value: result.getValue({
          name: "entity",
          join: "appliedToTransaction"
        })
      }); // Item

      currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord625',
        fieldId: "custrecord582",
        value: result.getValue({
          name: "item"
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
      });
      currentRecord.commitLine({
        sublistId: 'recmachcustrecord625'
      });
    }
  }

  return {
    pageInit: pageInit
  };
});