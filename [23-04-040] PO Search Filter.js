/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/search'], function (search) {
  function pageInit(context) {
    var purchaseorderSearchColPrNumber = search.createColumn({ name: 'custbody39' });
    var purchaseorderSearchColPrReceiveDate = search.createColumn({ name: 'custbody284' });
    var purchaseorderSearchColPrRequestor = search.createColumn({ name: 'custbody382' });
    var purchaseorderSearchColPoDate = search.createColumn({ name: 'trandate', sort: search.Sort.ASC });
    var purchaseorderSearchColPoNumber = search.createColumn({ name: 'tranid' });
    var purchaseorderSearchColItemKey = search.createColumn({ name: 'item' });
    var purchaseorderSearchColDescriptionmodelspecification = search.createColumn({ name: 'memo' });
    var purchaseorderSearchColPoQuantity = search.createColumn({ name: 'quantity' });
    var purchaseorderSearchColUnitPrice = search.createColumn({ name: 'formulanumeric', formula: 'ROUND(({fxamount}/{quantity}),4)' });
    var purchaseorderSearchColDeliveryDate = search.createColumn({ name: 'custcol13' });
    var purchaseorderSearchColQuantityReceived = search.createColumn({ name: 'quantityshiprecv' });
    var purchaseorderSearchColBalance = search.createColumn({ name: 'formulanumeric', formula: '{quantity}-{quantityshiprecv}' });
    var purchaseorderSearchColAdjustments = search.createColumn({ name: 'custcol203' });
    var purchaseorderSearchColAdjustmentDate = search.createColumn({ name: 'custcol204' });
    var purchaseorderSearchColCustomer = search.createColumn({ name: 'custbody41' });
    var purchaseorderSearchColSupplier = search.createColumn({ name: 'mainname' });
    var purchaseorderSearchColLineId = search.createColumn({ name: 'line' });
    var purchaseorderSearchColInternalId = search.createColumn({ name: 'internalid' });
    var purchaseorderSearchColBkCode = search.createColumn({ name: 'custitem61', join: 'item' });

    var purchaseorderSearch = search.create({
      type: 'purchaseorder',
      filters: [
        ['type', 'anyof', 'PurchOrd'],
        'AND',
        ['mainline', 'is', 'F'],
        'AND',
        ['subsidiary', 'anyof', '18'],
        'AND',
        ['vendtype', 'noneof', '3'],
        'AND',
        ['status', 'noneof', 'PurchOrd:C', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:A'],
        'AND',
        ['formulanumeric: {quantity}-{quantityshiprecv}', 'notlessthanorequalto', '0'],
        'AND',
        ['closed', 'is', 'F'],
      ],
      columns: [
        purchaseorderSearchColPrNumber,
        purchaseorderSearchColPrReceiveDate,
        purchaseorderSearchColPrRequestor,
        purchaseorderSearchColPoDate,
        purchaseorderSearchColPoNumber,
        purchaseorderSearchColItemKey,
        purchaseorderSearchColDescriptionmodelspecification,
        purchaseorderSearchColPoQuantity,
        purchaseorderSearchColUnitPrice,
        purchaseorderSearchColDeliveryDate,
        purchaseorderSearchColQuantityReceived,
        purchaseorderSearchColBalance,
        purchaseorderSearchColAdjustments,
        purchaseorderSearchColAdjustmentDate,
        purchaseorderSearchColCustomer,
        purchaseorderSearchColSupplier,
        purchaseorderSearchColLineId,
        purchaseorderSearchColInternalId,
        purchaseorderSearchColBkCode,
      ],
    });

    var purchaseorderSearchPagedData = purchaseorderSearch.runPaged({ pageSize: 1000 });

    purchaseorderSearchPagedData.pageRanges.forEach(function (page) {
      var purchaseorderSearchPage = purchaseorderSearchPagedData.fetch({ index: page.index });

      purchaseorderSearchPage.data.forEach(function (result) {
        var prNumber = result.getValue(purchaseorderSearchColPrNumber);
        var prReceiveDate = result.getValue(purchaseorderSearchColPrReceiveDate);
        var prRequestor = result.getValue(purchaseorderSearchColPrRequestor);
        var poDate = result.getValue(purchaseorderSearchColPoDate);
        var poNumber = result.getValue(purchaseorderSearchColPoNumber);
        var itemKey = result.getValue(purchaseorderSearchColItemKey);
        var descriptionmodelspecification = result.getValue(purchaseorderSearchColDescriptionmodelspecification);
        var poQuantity = result.getValue(purchaseorderSearchColPoQuantity);
        var unitPrice = result.getValue(purchaseorderSearchColUnitPrice);
        var deliveryDate = result.getValue(purchaseorderSearchColDeliveryDate);
        var quantityReceived = result.getValue(purchaseorderSearchColQuantityReceived);
        var balance = result.getValue(purchaseorderSearchColBalance);
        var adjustments = result.getValue(purchaseorderSearchColAdjustments);
        var adjustmentDate = result.getValue(purchaseorderSearchColAdjustmentDate);
        var customer = result.getValue(purchaseorderSearchColCustomer);
        var supplier = result.getValue(purchaseorderSearchColSupplier);
        var lineId = result.getValue(purchaseorderSearchColLineId);
        var internalId = result.getValue(purchaseorderSearchColInternalId);
        var bkCode = result.getValue(purchaseorderSearchColBkCode);

        // Perform further processing or operations using the retrieved data
      });
    });
  }

  return {
    pageInit: pageInit,
  };
});