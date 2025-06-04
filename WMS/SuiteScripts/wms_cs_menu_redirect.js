/**
 *    Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define([],

    function () {

        function pageInit(scriptContext) {
            window.open(scriptContext.currentRecord.getValue('custpage_field_hidden_url'), '_self');
        }

        return {
            pageInit: pageInit
        };

    });
