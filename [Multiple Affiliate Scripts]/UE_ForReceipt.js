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
    var subId = nlapiGetFieldValue("subsidiary");
    var recieveTagUrl = nlapiResolveURL("SUITELET", "customscript_kpg_sl_receiving_tag", "customdeploy_kpg_sl_receiving_tag", null);
    var transferlocation = nlapiGetFieldValue("transferlocation");
    var recordId = nlapiGetRecordId();
    var itemReceiptRecordType = nlapiLookupField('itemreceipt', recordId, 'recordtype');
    var inventoryTransferRecordType = nlapiLookupField('inventorytransfer', recordId, 'recordtype');
    var inventoryAdjustmentRecordType = nlapiLookupField('inventoryadjustment', recordId, 'recordtype');
    var location = nlapiGetFieldValue("location");
    var rectype = '';

    if (itemReceiptRecordType) {
      rectype = itemReceiptRecordType;
    } else if (inventoryTransferRecordType) {
      rectype = inventoryTransferRecordType;
    } else if (inventoryAdjustmentRecordType) {
      rectype = inventoryAdjustmentRecordType;
    }

    nlapiLogExecution('ERROR', 'recordId', recordId);
    nlapiLogExecution('ERROR', 'rectype', rectype);
    nlapiLogExecution('ERROR', 'subId', subId);
    nlapiLogExecution('ERROR', 'location', location);

    var url_1 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype;
    var url_2 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&printOutTag=RM";
    var url_3 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&printOutTag=FG";
    var url_4 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&location=Branch";
    var url_5 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&location=Trade";
    var url_6 = recieveTagUrl + "&Id=" + recordId + "&recType=" + rectype + "&location=" + location;

    if (rectype == "inventorytransfer") {
      if (subId == 18 || subId == 5) { //KPLima
        if (transferlocation == 792) {
          form.addButton("custpage_receiving_tag", " Print Receiving Tag", "window.open('" + url_2 + "')");
        } else if (transferlocation == 825) {
          form.addButton("custpage_receiving_tag", " Print RM Tag", "window.open('" + url_2 + "')");
        }
        form.addButton("custpage_receiving_tag", "Print FG Tag", "window.open('" + url_3 + "')");
      } else if (subId == 14) {
        form.addButton("custpage_receiving_tag", " Print Receiving Tag", "window.open('" + url_2 + "')");
      } else if (subId == 15) {
        form.addButton("custpage_receiving_tag", " Print Receiving Tag", "window.open('" + url_1 + "')");
      } else if (subId == 4) {
        form.addButton("custpage_receiving_tag", " Print FG Tag", "window.open('" + url_1 + "')");
      }
    } else if (rectype == "inventoryadjustment") {
      if (subId == 4) {
        for (var i = 1; i <= 1; i++) {
          var locationDisplay = nlapiGetLineItemValue('inventory', 'location_display', i);
        }

        if (locationDisplay == "KPI Finished Goods") {
          form.addButton("custpage_receiving_tag", "Print FG Tag", "window.open('" + url_1 + "')"); // KPIndonesia
        }
      }
    } else if (rectype == "itemreceipt") {
      if (subId == 15) {
        if (location == 866) {
          form.addButton("custpage_receiving_tag", "Print HCM Receiving Tag", "window.open('" + url_4 + "')"); //KPVN_AMATA_Branch
        } else if (location == 873 || location == 897) {
          form.addButton("custpage_receiving_tag", "Print HCM Receiving Tag", "window.open('" + url_5 + "')"); //KPVN_AMATA_Trade
        } /* else if (
          location == 781 ||
          location == 785 ||
          location == 776 ||
          location == 855 ||
          location == 775 ||
          location == 900 ||
          location == 778 ||
          location == 859 ||
          location == 805 ||
          location == 818 ||
          location == 819 ||
          location == 813 ||
          location == 770 ||
          location == 779 ||
          location == 858 ||
          location == 777 ||
          location == 816 ||
          location == 817 ||
          location == 771 ||
          location == 854 ||
          location == 814 ||
          location == 815 ||
          location == 860) {
          form.addButton("custpage_receiving_tag", "Print Hanoi Receiving Tag", "window.open('" + url_6 + "')"); //KPVN_HANOI
        } */

      } else {
        form.addButton("custpage_receiving_tag", "Print Receiving Tag", "window.open('" + url_1 + "')");
      }
    }
  }
}