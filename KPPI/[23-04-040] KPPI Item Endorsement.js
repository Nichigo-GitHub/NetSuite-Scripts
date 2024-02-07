/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/search', 'N/record', 'N/log'], function (currentRecord, search, record, log) {
  function fieldChanged(context) {
    // Get the current record object from the context
    var currentRecord = context.currentRecord;

    // Check if the field changed is 'custrecord733'
    if (context.fieldId === 'custrecord733') {
      try {
        var ipdNum = currentRecord.getText({
          fieldId: 'custrecord733'
        });

        var trimmedIpd = ipdNum.substring("Sales Order #".length);

        const assemblyItemSearchColTransactionTranDate = search.createColumn({ name: 'trandate', join: 'transaction' });
        const assemblyItemSearchColTransactionTranId = search.createColumn({ name: 'tranid', join: 'transaction', sort: search.Sort.ASC });
        const assemblyItemSearchColCUSTOMER = search.createColumn({ name: 'formulatext', formula: 'CASE WHEN {transaction.type} = \'Sales Order\' THEN {transaction.mainname} ELSE {transaction.custbody41} END' });
        const assemblyItemSearchColITEMCODE = search.createColumn({ name: 'formulatext', formula: 'CASE WHEN {memberitem.type} = \'Inventory Item\' THEN {name} WHEN {memberitem.type} = \'Non-inventory Item\' THEN {name} ELSE {memberitem.name} END' });
        const assemblyItemSearchColITEMDESCRIPTION = search.createColumn({ name: 'formulatext', formula: 'CONCAT((CASE WHEN {memberitem.type} = \'Non-inventory Item\' THEN {description} WHEN {memberitem.type} = \'Inventory Item\' THEN {description}  ELSE {memberitem.description} END),(CASE WHEN {memberitem.type} = \'Non-inventory Item\' THEN null WHEN {memberitem.type} = \'Inventory Item\' THEN null ELSE (CASE WHEN {memberline} = \'1\' THEN \'; A\' WHEN {memberline} = \'2\' THEN \'; B\' WHEN {memberline} = \'3\' THEN \'; C\' WHEN {memberline} = \'4\' THEN \'; D\' WHEN {memberline} = \'5\' THEN \'; E\' WHEN {memberline} = \'6\' THEN \'; F\' WHEN {memberline} = \'7\' THEN \'; G\' WHEN {memberline} = \'8\' THEN \'; H\' WHEN {memberline} = \'9\' THEN \'; I\' WHEN {memberline} = \'10\' THEN \'; J\' WHEN {memberline} = \'11\' THEN \'; K\'  ELSE null END) END))' });
        const assemblyItemSearchColGROUP = search.createColumn({ name: 'formulatext', formula: 'CASE WHEN {memberitem.type} = \'Inventory Item\' THEN {custitem121} ELSE {memberitem.custitem121} END' });
        const assemblyItemSearchColMATERIALUSEDBKMATERIALS = search.createColumn({ name: 'formulatext', formula: 'CASE WHEN {memberitem.type} = \'Inventory Item\' THEN {memberitem.custitem61} ELSE {memberitem.memberitem} END' });
        const assemblyItemSearchColDELIVERYDATE = search.createColumn({ name: 'formuladate', formula: 'CASE WHEN {transaction.type} = \'Sales Order\' THEN {transaction.custcol4} ELSE {transaction.expectedreceiptdate} END' });
        const assemblyItemSearchColCUTTINGSIZE = search.createColumn({ name: 'formulatext', formula: 'CASE WHEN {memberitem.type} = \'Inventory Item\' THEN (CASE WHEN {memberline} = \'2\' THEN (CASE WHEN {custitem108} = null THEN {custitem78} ELSE {custitem108} END) WHEN {memberline} = \'3\' THEN (CASE WHEN {custitem109} = null THEN {custitem78} ELSE {custitem109} END) WHEN {memberline} = \'4\' THEN (CASE WHEN {custitem110} = null THEN {custitem78} ELSE {custitem110} END) WHEN {memberline} = \'5\' THEN (CASE WHEN {custitem111} = null THEN {custitem78} ELSE {custitem111} END) ELSE {custitem78} END)  ELSE (CASE WHEN {memberitem.memberline} = \'2\' THEN (CASE WHEN {memberitem.custitem108} = null THEN  {memberitem.custitem78} ELSE {memberitem.custitem108} END)WHEN {memberitem.memberline} = \'3\' THEN (CASE WHEN {memberitem.custitem109} = null THEN  {memberitem.custitem78} ELSE {memberitem.custitem109} END) WHEN {memberitem.memberline} = \'4\' THEN (CASE WHEN {memberitem.custitem110} = null THEN  {memberitem.custitem78} ELSE {memberitem.custitem110} END) WHEN {memberitem.memberline} = \'5\' THEN (CASE WHEN {memberitem.custitem111} = null THEN  {memberitem.custitem78} ELSE {memberitem.custitem111} END) ELSE {memberitem.custitem78} END) END' });
        const assemblyItemSearchColOutsPerSheet = search.createColumn({ name: 'formulanumeric', formula: 'CASE WHEN {memberline} = \'1\' THEN {custitem67} WHEN {memberline} = \'2\' THEN {custitem112} WHEN {memberline} = \'3\' THEN {custitem113} WHEN {memberline} = \'4\' THEN {custitem114} WHEN {memberline} = \'5\' THEN {custitem115} ELSE null END' });
        const assemblyItemSearchColOutsPerBlade = search.createColumn({ name: 'formulanumeric' });
        const assemblyItemSearchColNeededPerSet = search.createColumn({ name: 'formulanumeric' });
        const assemblyItemSearchColPricingSellingPrice = search.createColumn({ name: 'unitprice', join: 'pricing' });
        const assemblyItemSearchColPricingMOQ = search.createColumn({ name: 'pricelevel', join: 'pricing' });
        const assemblyItemSearchColMemberitemPurchasePrice = search.createColumn({ name: 'vendorcost', join: 'memberitem' });
        const assemblyItemSearchColProcurement = search.createColumn({ name: 'formulanumeric', formula: 'ROUND(({memberitem.lastpurchaseprice}*{memberquantity}),4)' });
        const assemblyItemSearchColRMMOQ = search.createColumn({ name: 'formulatext' });
        const assemblyItemSearchColGPR = search.createColumn({ name: 'formulapercent', formula: '({pricing.unitprice}-({memberitem.lastpurchaseprice}*{memberquantity}))/{pricing.unitprice}' });
        const assemblyItemSearchColMemberitemSupplier = search.createColumn({ name: 'othervendor', join: 'memberitem' });
        const assemblyItemSearchColRemarks = search.createColumn({ name: 'custitem101' });

        // Create a search to find the item record based on the selected item ID
        var assemblyItemSearch = search.create({
          type: "assemblyitem",
          filters: [
            ["type", "anyof", "Assembly"],
            "AND",
            ["transaction.type", "anyof", "SalesOrd", "TrnfrOrd"],
            "AND",
            ["subsidiary", "anyof", "18"],
            "AND",
            ["transaction.customform", "anyof", "606"],
            "AND",
            ["isinactive", "is", "F"],
            "AND",
            ["custitem24.entityid", "startswith", ""],
            "AND",
            ["transaction.transactionlinetype", "noneof", "SHIPPING", "RECEIVING"],
            "AND",
            ["transaction.closed", "is", "F"],
            "AND",
            ["custitem1", "anyof", "1"],
            "AND",
            ["memberitem.type", "anyof", "Assembly", "InvtPart"],
            "AND",
            ["transaction.trandate", "within", "thismonth"],
            "AND",
            ["transaction.tranid", "is", trimmedIpd],
          ],
          columns: [
            /* assemblyItemSearchColTransactionTranDate,
            assemblyItemSearchColTransactionTranId,
            assemblyItemSearchColCUSTOMER, */
            assemblyItemSearchColITEMCODE,
            assemblyItemSearchColITEMDESCRIPTION,
            /* assemblyItemSearchColGROUP, */
            assemblyItemSearchColMATERIALUSEDBKMATERIALS,
            /* assemblyItemSearchColDELIVERYDATE, */
            assemblyItemSearchColCUTTINGSIZE,
            assemblyItemSearchColOutsPerSheet,
            assemblyItemSearchColOutsPerBlade,
            assemblyItemSearchColNeededPerSet,
            assemblyItemSearchColPricingSellingPrice,
            assemblyItemSearchColPricingMOQ,
            assemblyItemSearchColMemberitemPurchasePrice,
            assemblyItemSearchColProcurement,
            assemblyItemSearchColRMMOQ,
            assemblyItemSearchColGPR,
            assemblyItemSearchColMemberitemSupplier,
            assemblyItemSearchColRemarks
          ]
        });

        // Run the search and get the results
        var searchResults = assemblyItemSearch.run().getRange({
          start: 0,
          end: 999
        });

        // Loop through the search results and count number of results
        var total = searchResults.length;

        log.debug("itemcode", total);

        searchResults.forEach(function (result) {
          /* const transactionTranDate = result.getValue(assemblyItemSearchColTransactionTranDate);
          const transactionTranId = result.getValue(assemblyItemSearchColTransactionTranId);
          const customer = result.getValue(assemblyItemSearchColCUSTOMER); */
          const itemcode = result.getValue(assemblyItemSearchColITEMCODE);
          const itemdescription = result.getValue(assemblyItemSearchColITEMDESCRIPTION);
          /* const group = result.getValue(assemblyItemSearchColGROUP); */
          const materialusedbkmaterials = result.getValue(assemblyItemSearchColMATERIALUSEDBKMATERIALS);
          /* const deliverydate = result.getValue(assemblyItemSearchColDELIVERYDATE); */
          const cuttingsize = result.getValue(assemblyItemSearchColCUTTINGSIZE);
          const outsPerSheet = result.getValue(assemblyItemSearchColOutsPerSheet);
          const outsPerBlade = result.getValue(assemblyItemSearchColOutsPerBlade);
          const neededPerSet = result.getValue(assemblyItemSearchColNeededPerSet);
          const pricingSellingPrice = result.getValue(assemblyItemSearchColPricingSellingPrice);
          const pricingMOQ = result.getValue(assemblyItemSearchColPricingMOQ);
          const memberitemPurchasePrice = result.getValue(assemblyItemSearchColMemberitemPurchasePrice);
          const procurement = result.getValue(assemblyItemSearchColProcurement);
          const rmmoq = result.getValue(assemblyItemSearchColRMMOQ);
          const gpr = result.getValue(assemblyItemSearchColGPR);
          const memberitemSupplier = result.getText(assemblyItemSearchColMemberitemSupplier);
          const remarks = result.getValue(assemblyItemSearchColRemarks);

          var pricingMOQValue = '';

          // Check if pricingMOQ is "Base Price" or "MOQ 20"
          if (pricingMOQ === 'Base Price' || pricingMOQ.includes('MOQ')) {
            pricingMOQValue = pricingMOQ;
          } else {
            // Convert pricingMOQ to float
            pricingMOQValue = parseFloat(pricingMOQ);

            // Check if the conversion is successful (not NaN)
            if (isNaN(pricingMOQValue)) {
              // Handle the case where pricingMOQ is not a valid float
              // You may want to log an error or set a default value
              pricingMOQValue = 0; // Default value or another appropriate action
            }
          }

          // Insert a new line for each result
          currentRecord.selectNewLine({
            sublistId: 'recmachcustrecord731'
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord712',
            text: itemcode
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord713',
            text: itemdescription
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord714',
            text: cuttingsize
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord716',
            text: materialusedbkmaterials
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord717',
            text: outsPerSheet
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord718',
            text: outsPerBlade
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord719',
            text: neededPerSet
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord720',
            text: pricingSellingPrice
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord721',
            value: convertNullToZero(pricingMOQValue)
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord722',
            value: convertNullToZero(parseFloat(memberitemPurchasePrice))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord723',
            value: convertNullToZero(parseFloat(procurement))
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord724',
            value: rmmoq
          });

          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord725',
            value: convertNullToZero(parseFloat(gpr)) + '%'
          });

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord726',
            text: memberitemSupplier
          }); 

          currentRecord.setCurrentSublistText({
            sublistId: 'recmachcustrecord731',
            fieldId: 'custrecord729',
            text: remarks
          });

          // Commit the line
          currentRecord.commitLine({
            sublistId: 'recmachcustrecord731'
          });
        })
      } catch (e) {
        // Log the error
        log.error({
          title: 'An error occurred',
          details: e
        });

        // Optionally, rethrow the error to allow it to propagate
        throw e;
      }
    }
  }

  return {
    fieldChanged: fieldChanged
  };

  function convertNullToZero(parameter) {
    if (!parameter && parameter != 0)
      return 0;
    return parameter;
  }
});