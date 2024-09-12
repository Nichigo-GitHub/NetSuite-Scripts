/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {

    function beforeSubmit(context) {
        var itemReceipt = context.newRecord;

        log.debug('beforeSubmit', 'Script started.');

        // Check if the custom form is 486
        var customFormId = itemReceipt.getValue({
            fieldId: 'customform'
        });

        log.debug('beforeSubmit', 'Custom Form ID: ' + customFormId);

        if (parseInt(customFormId) !== 486) {
            log.debug('beforeSubmit', 'Custom form is not 486, exiting script.');
            return;
        }

        // Get the 'createdfrom' field value (Purchase Order ID)
        var createdFromId = itemReceipt.getValue({
            fieldId: 'createdfrom'
        });

        log.debug('beforeSubmit', 'Created From ID: ' + createdFromId);

        if (createdFromId) {
            try {
                // Load the related Purchase Order
                var purchaseOrder = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: createdFromId,
                    isDynamic: false
                });

                log.debug('beforeSubmit', 'Purchase Order loaded successfully.');

                // Get the value of customer from the Purchase Order
                var customer = purchaseOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'customer',
                    line: 0
                });

                log.debug('beforeSubmit', 'customer Value from Purchase Order: ' + customer);

                // Set the value of customer on the Item Receipt
                itemReceipt.setValue({
                    fieldId: 'custbody41',
                    value: customer
                });

                log.debug('beforeSubmit', 'customer Value set on Item Receipt.');

                // Process each line in the item sublist
                var lineCount = itemReceipt.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < lineCount; i++) {
                    var quantity = itemReceipt.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });

                    log.debug('beforeSubmit', 'Processing line: ' + i + ', Quantity: ' + quantity);

                    if (quantity > 0) {
                        // Get the value of custbodylicensetype from the Purchase Order
                        var licenseType = purchaseOrder.getValue({
                            fieldId: 'custbodylicensetype'
                        });

                        log.debug('beforeSubmit', 'License Type from Purchase Order: ' + licenseType);

                        var bin = '';

                        // Set bin number based on license type
                        if (licenseType == 1) {
                            bin = 6746;
                        } else if (licenseType == 2) {
                            bin = 6744;
                        } else if (licenseType == 3) {
                            bin = 6745;
                        }

                        log.debug('beforeSubmit', 'Bin number selected: ' + bin);

                        // Access or create the Inventory Detail subrecord (Standard mode)
                        var inventoryDetail = itemReceipt.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });

                        if (!inventoryDetail) {
                            inventoryDetail = itemReceipt.createSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail',
                                line: i
                            });
                            log.debug('beforeSubmit', 'Created new Inventory Detail subrecord.');
                        } else {
                            log.debug('beforeSubmit', 'Existing Inventory Detail subrecord found.');
                        }

                        // Clear existing lines if any
                        var invAssignLineCount = inventoryDetail.getLineCount({
                            sublistId: 'inventoryassignment'
                        });

                        for (var j = 0; j < invAssignLineCount; j++) {
                            inventoryDetail.removeLine({
                                sublistId: 'inventoryassignment',
                                line: 0
                            });
                        }

                        log.debug('beforeSubmit', 'Cleared existing inventory assignment lines.');

                        // Add Inventory Assignment Line (Standard mode)
                        inventoryDetail.insertLine({
                            sublistId: 'inventoryassignment',
                            line: 0
                        });

                        inventoryDetail.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'binnumber',
                            line: 0,
                            value: bin
                        });

                        inventoryDetail.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: 0,
                            value: parseFloat(quantity).toFixed(5) // Set the quantity as entered by the user
                        });

                        log.debug('beforeSubmit', 'Inventory assignment line added with bin: ' + bin + ' and quantity: ' + quantity);

                    } else {
                        log.debug('beforeSubmit', 'Quantity is not greater than 0, no inventory detail added.');
                    }
                }

            } catch (e) {
                log.error({
                    title: 'Error Loading Purchase Order or Processing Inventory Detail in beforeSubmit',
                    details: e.toString()
                });
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});