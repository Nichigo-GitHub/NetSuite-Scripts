/**
 *     Copyright © 2022, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/runtime','./wms_utility', './wms_translator'],

    function(runtime,utility, translator) {
        /**
         * This function is to fetch the restock values.
         *
         */
        function doPost(requestBody) {

            var restockResponse = {};
            var restockArray =[];

            try{

                if (utility.isValueValid(requestBody)) {
                    var requestParams = requestBody.params;
                    var transactionType = requestParams.transactionType;
                    var warehouseLocationId = requestParams.warehouseLocationId;

                    var restockYes = {text: 'YES', value: true};
                    var restockNo = {text: 'NO', value: false};

                    var restockPreference = runtime.getCurrentUser().getPreference('RESTOCKRETURNS');
                    var restockEnabled = utility.getSystemRuleValueWithProcessType(translator.getTranslationString('wms_SystemRules.RESTOCK'), warehouseLocationId, transactionType);
                    var manualIREnabled = utility.getSystemRuleValueWithProcessType(translator.getTranslationString('wms_SystemRules.MANUALL_POST_IR'), warehouseLocationId, transactionType);

                    if(restockEnabled == 'Y' && manualIREnabled == 'Y') {
                        if(restockPreference == true) {
                            restockArray.push(restockYes);
                        } else {
                            restockArray.push(restockNo);
                        }
                    } else if (restockEnabled == 'Y') {
                        restockArray.push(restockYes);
                        restockArray.push(restockNo);
                    }
                    if(utility.isValueValid(requestParams.restock)) {
                        restockArray = []
                        if(requestParams.restock == true) {
                            restockArray.push(restockYes);
                        } else {
                            restockArray.push(restockNo);
                        }
                    }
                    restockResponse['restockValues'] = restockArray;
                }
            }
            catch(e)
            {
                log.error({title: 'exception in restockValue', details: e});
            }
            return restockResponse;
        }

        return {
            'post': doPost
        };

    });
