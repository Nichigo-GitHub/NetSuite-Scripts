/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

  function getInputData() {
    // Load the saved search and return the results as input data
    return search.load({
      id: 'customsearch4381' // Replace with your saved search ID
    });
  }

  function map(context) {
    var result = JSON.parse(context.value);

    // Assuming you're processing each item from the search results
    var customer = result.getText({
      name: "custitem24"
    });
    var itemid = result.getValue({
      name: "itemid"
    });
    var salesdesc = result.getValue({
      name: "salesdescription"
    });
    var currency = result.getText({
      name: "currency",
      join: "pricing"
    });
    var unitprice = result.getValue({
      name: "unitprice",
      join: "pricing"
    });
    var formulanumeric = result.getValue({
      name: "formulanumeric",
      summary: "SUM",
      formula: "ROUND(({memberquantity}*{memberitem.lastpurchaseprice}),4)"
    });

    // Write the processed data to the Reduce stage
    context.write({
      key: itemid,
      value: {
        customer: customer,
        salesdesc: salesdesc,
        currency: currency,
        unitprice: unitprice,
        formulanumeric: formulanumeric
      }
    });
  }

  function reduce(context) {
    // Aggregate or process the data further if needed
    var values = context.values.map(function (value) {
      return JSON.parse(value);
    });

    // Here you could store the data in a custom record, or another NetSuite object

    log.audit('Reduce', 'Processed ' + values.length + ' records for item ' + context.key);
  }

  function summarize(summary) {
    // Final logging or error handling
    log.audit('Summary', 'Total records processed: ' + summary.reduceSummary.keys.length);

    if (summary.inputSummary.error) {
      log.error('Input Error', summary.inputSummary.error);
    }

    summary.mapSummary.errors.iterator().each(function (key, error) {
      log.error('Map Error', 'Key: ' + key + ', Error: ' + error);
      return true;
    });

    summary.reduceSummary.errors.iterator().each(function (key, error) {
      log.error('Reduce Error', 'Key: ' + key + ', Error: ' + error);
      return true;
    });
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
  };
});