/**
 *     Copyright � 2022, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
 /** UserEvent on Smart Count Item Count Custom Record to relase the bin hold automatically.
  * and also updates the status , samrtcountID and isinactive fields in the WMS Smart Count Integration custom record
  **/
     define(['N/query','N/record','./wms_utility','N/runtime','N/wms/recommendedBins','./wms_outBoundUtility'],

     	function(query,record,utility,runtime,recomendedBinApi,obUtility) {

	function afterSubmit(scriptContext) {
        log.debug('type', scriptContext.type);
        log.debug('context', runtime.executionContext);
        if (scriptContext != undefined && scriptContext != null
            && scriptContext != "null" && scriptContext != "") {
            var scRecord = scriptContext.newRecord;
            if (scRecord != undefined && scRecord != null
                && scRecord != "null" && scRecord != "") {
            var locId = parseInt(scRecord.getValue('custrecord_sc_location'));
            var smartCountSystemRuleValue  = obUtility.chkSmartCountEnabled("Enable bin reporting and blocking",locId,'Smart Count');
                log.debug("smartCountSystemRuleValue",smartCountSystemRuleValue);
            if(smartCountSystemRuleValue == "Y") {
                var isSmartCountAppExistsInAccount = utility.fnChkSmartCountAppEntryInMobileAppDefault();
                log.debug("isSmartCountAppExistsInAccount", isSmartCountAppExistsInAccount)
                if (isSmartCountAppExistsInAccount) {
                    var isWMSCountConfigurationExistsInTheAccount = utility.fnChkWMSCountConfigurtion();
                    log.debug("isWMSCountConfigurationExistsInTheAccount", isWMSCountConfigurationExistsInTheAccount)
                    if (isWMSCountConfigurationExistsInTheAccount) {
                           try {

                                var itemId = parseInt(scRecord.getValue('custrecord_sc_item'));
                                var binId = parseInt(scRecord.getValue('custrecord_sc_bin'));

                                var scStatus = "In Progress";
                                if (scriptContext.type == "edit") {
                                    scStatus = scRecord.getText('custrecord_sc_status');
                                    log.debug("scStatus", scStatus);
                                    if (scStatus == "Approved") {
                                        log.debug("scStatus1", scStatus);
                                        var itemBinArr = [];
                                        var itemBinObj = {};
                                        itemBinObj.itemId = itemId;
                                        itemBinObj.binId = binId;
                                        itemBinArr.push(itemBinObj);
                                        log.debug("itemBinArr", itemBinArr);
                                        recomendedBinApi.unblockItemBinPairs(itemBinArr);

                                    }
                                }

                                var wmsSmartCountIntegrationRecordResults = [];
                                if (utility.isValueValid(itemId) && utility.isValueValid(binId) && utility.isValueValid(locId)) {
                                    wmsSmartCountIntegrationRecordResults = obUtility.getSmartCountIntegrationRecords(itemId, binId, locId);
                                }
                                log.debug("wmsSmartCountIntegrationRecordResults", wmsSmartCountIntegrationRecordResults);
                                if (wmsSmartCountIntegrationRecordResults.length > 0) {
                                    for (var rec = 0; rec < wmsSmartCountIntegrationRecordResults.length; rec++) {
                                        var wmsSmartCountIntegrationRecord = record.load({
                                            type: 'customrecord_wms_sc_integration',
                                            id: wmsSmartCountIntegrationRecordResults[rec].internalid
                                        });
                                        if (wmsSmartCountIntegrationRecord != null && wmsSmartCountIntegrationRecord != undefined
                                            && wmsSmartCountIntegrationRecord != "null" && wmsSmartCountIntegrationRecord != "") {

                                            wmsSmartCountIntegrationRecord.setValue("custrecord_wms_sc_status", scStatus);
                                            wmsSmartCountIntegrationRecord.setValue("custrecord_wms_sc_smartcountinternalid", scRecord.getValue('name'));
                                            if (scStatus == "Approved") {
                                                wmsSmartCountIntegrationRecord.setValue("isinactive", true);
                                            }
                                            wmsSmartCountIntegrationRecord.save();
                                        }
                                    }
                                }

                            }
                            catch (e) {
                                log.error({title: 'error in  smartcount', details: e});
                            }
                        }
                    }
                }
            }
    }
	}

	return {		
		afterSubmit: afterSubmit

	};
});
