/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Apr 2016     Administrator
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */

function userEventBeforeLoad(type, form, request) {
  if (type == "view") {
    var subId = nlapiGetSubsidiary();
    var recieveTagUrl = nlapiResolveURL("SUITELET", "customscript_kpg_sl_receiving_tag", "customdeploy_kpg_sl_receiving_tag", null);
    var transferlocation = nlapiGetFieldValue("transferlocation");
    var recordId = nlapiGetRecordId();
    var itemReceiptRecordType = nlapiLookupField('itemreceipt', recordId, 'recordtype');
    var inventoryTransferRecordType = nlapiLookupField('inventorytransfer', recordId, 'recordtype');
    var inventoryAdjustmentRecordType = nlapiLookupField('inventoryadjustment', recordId, 'recordtype');
    var rectype = '';

    if (itemReceiptRecordType) {
      rectype = itemReceiptRecordType;
      //nlapiLogExecution('ERROR', 'Record Type and Sub', itemReceiptRecordType + ' ' + subId);
    } else if (inventoryTransferRecordType) {
      rectype = inventoryTransferRecordType;
      //nlapiLogExecution('DEBUG', 'Record Type and Sub ', inventoryTransferRecordType + ' ' + subId); 
    } else if (inventoryAdjustmentRecordType) {
      rectype = inventoryAdjustmentRecordType;
      //nlapiLogExecution('DEBUG', 'Record Type and Sub ', inventoryAdjustmentRecordType + ' ' + subId); 
    }

    nlapiLogExecution('ERROR', 'recordId', recordId);
    nlapiLogExecution('ERROR', 'rectype', rectype);
    nlapiLogExecution('ERROR', 'subId', subId);

    var url_1 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype;
    var url_2 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&printOutTag=RM";
    var url_3 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&printOutTag=FG";

    if (rectype == "inventorytransfer") {
      if (subId == 18 || subId == 5) {
        if (transferlocation == 792) {
          form.addButton("custpage_receiving_tag", " Print Receiving Tag", "window.open('" + url_2 + "')");
        }
        form.addButton("custpage_receiving_tag", "Print FG Tag", "window.open('" + url_3 + "')");
      } else {
        form.addButton("custpage_receiving_tag", "Print FG Tag", "window.open('" + url_1 + "')");
      }
    } else if (rectype == "inventoryadjustment") {
      if (subId == 4) {
        for (var i = 1; i <= 1; i++) {
          var locationDisplay = nlapiGetLineItemValue('inventory', 'location_display', i);
          // Process locationDisplay value as needed
        }

        nlapiLogExecution('ERROR', 'locationDisplay', locationDisplay);

        if (locationDisplay == "KPI Finished Goods") {
          form.addButton("custpage_receiving_tag", "Print FG Tag", "window.open('" + url_1 + "')");
        }
      }
    } else {
      form.addButton("custpage_receiving_tag", "Print Receiving Tag", "window.open('" + url_1 + "')");
    }
  }
}