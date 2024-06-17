/**
 *    Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/query', '../Restlets/wms_translator.js'], function (query, translator) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            if(scriptContext.type === scriptContext.UserEventType.CREATE) {
                const labelType = scriptContext.newRecord.getValue('custrecord_wmsse_lprange_lptype');
                log.debug('labelType', labelType)
                if(!labelType)
                {
                    throw translator.getTranslationString('AUTO_GEN_CREATE_ERROR');
                }
                if(labelType === '1') {
                    const duns = scriptContext.newRecord.getValue('custrecord_wmsse_company_duns_num');
                    log.debug('duns', duns)
                    if( duns && isNaN(duns))
                    {
                        throw translator.getTranslationString('UCC_VALIDATE_NONNUMERIC');
                    }
                    else if(duns && (duns.toString().length < 7 || duns.toString().length > 10)) {
                        throw translator.getTranslationString('AUTO_GEN_DUNS_ERROR');
                    }
                }
                const autoGenerateRecords = getAutoGenerateRecords();

                const labelTypeIndex = autoGenerateRecords.findIndex(autoGenerateRecord => autoGenerateRecord.type.toString() === labelType);
                log.debug('label type idx', labelTypeIndex);

                if(labelTypeIndex !== -1) {

                    throw translator.getTranslationString('AUTO_GEN_CREATE_ERROR');
                }
            } else if(scriptContext.type === scriptContext.UserEventType.DELETE) {
                throw translator.getTranslationString('AUTO_GEN_DELETE_ERROR');
            } else if(scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.XEDIT) {
                const labelType = scriptContext.newRecord.getValue('custrecord_wmsse_lprange_lptype');
                const labelTypeOld = scriptContext.oldRecord.getValue('custrecord_wmsse_lprange_lptype');
                if(!labelTypeOld)
                {
                    throw translator.getTranslationString('AUTO_GEN_CREATE_ERROR');
                }
                if(labelType === '1') {
                    const duns = scriptContext.newRecord.getValue('custrecord_wmsse_company_duns_num');
                    if( duns && isNaN(duns))
                    { 
                        throw translator.getTranslationString('UCC_VALIDATE_NONNUMERIC');
                    }
                    else if(duns && (duns.toString().length < 7 || duns.toString().length > 10)) {
                        log.debug('dunslength1', duns.length)
                        throw translator.getTranslationString('AUTO_GEN_DUNS_ERROR');
                    }
                }
            }
        }

        function getAutoGenerateRecords() {
            const autoGenQuery = query.create({type: 'customrecord_wmsse_lp_range'});
            autoGenQuery.columns = [
                autoGenQuery.createColumn({
                    fieldId: 'custrecord_wmsse_lprange_lptype',
                    alias: 'type'
                })
            ];
            return autoGenQuery.run().asMappedResults();
        }

        return {
            beforeSubmit: beforeSubmit
        };

    });
