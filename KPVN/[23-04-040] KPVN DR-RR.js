/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search'], function (record, log, search) {
    function beforeSubmit(context) {
        // Get the current Item Fulfillment record
        var itemFulfillment = context.newRecord;

        // Log a message to indicate the script has started
        log.error({
            title: 'Script Started',
            details: 'Item Fulfillment ID: ' + itemFulfillment.id
        });

        // Retrieve relevant information from the Item Fulfillment (adjust field names as needed)
        var DRcustomform = itemFulfillment.getValue({
            fieldId: 'customform'
        });

        // Log line data for debugging
        log.error({
            title: 'DRcustomform',
            details: DRcustomform
        });

        // Log line data for debugging
        log.error({
            title: 'context.type',
            details: context.type
        });

        // Log line data for debugging
        log.error({
            title: 'context.UserEventType.CREATE',
            details: context.UserEventType.CREATE
        });

        if (context.type === context.UserEventType.CREATE && DRcustomform === 459) {
            // Log line data for debugging
            log.error({
                title: 'Entry',
                details: 'yes'
            });

            // Get the current Item Fulfillment record
            var itemFulfillment = context.newRecord;

            // Retrieve relevant information from the Item Fulfillment (adjust field names as needed)
            var createdfrom = itemFulfillment.getValue({
                fieldId: 'createdfrom'
            });

            // Log line data for debugging
            log.error({
                title: 'createdfrom',
                details: createdfrom
            });

            // Load the transfer order record using the internal ID
            var TOrecord = record.load({
                type: record.Type.TRANSFER_ORDER,
                id: createdfrom
            });

            TOrecord.setValue({
                fieldId: 'orderstatus',
                value: 'F' 
            });

            var lineCount = itemFulfillment.getLineCount({
                sublistId: 'item'
            });

            // Log line data for debugging
            log.error({
                title: 'lineCount',
                details: lineCount
            });

            // Create an Item Receipt record
            var itemReceipt = record.create({
                type: record.Type.ITEM_RECEIPT,
                isDynamic: true
            });

            // Set fields on the Item Receipt based on the Item Fulfillment
            itemReceipt.setValue({
                fieldId: 'customform',
                value: 486
            });

            // Set fields on the Item Receipt based on the Item Fulfillment
            itemReceipt.setValue({
                fieldId: 'createdfrom',
                value: createdfrom
            });

            // Set fields on the Item Receipt based on the Item Fulfillment
            itemReceipt.setValue({
                fieldId: 'department',
                value: 5
            }); 

            // Loop through Item Fulfillment lines and add them to the Item Receipt
            for (var i = 0; i < lineCount; i++) {
                var item = itemFulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                var quantity = itemFulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemquantity',
                    line: i
                });

                // Log line data for debugging
                log.error({
                    title: 'Processing Line ' + (i + 1),
                    details: 'Item: ' + item + ', Quantity: ' + quantity
                });

                // Add line to the Item Receipt
                itemReceipt.selectNewLine({
                    sublistId: 'item'
                });
                itemReceipt.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    value: 'T'
                });
                itemReceipt.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: item
                });
                itemReceipt.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemquantity',
                    value: quantity
                });
                itemReceipt.commitLine({
                    sublistId: 'item'
                });
            }

            // Save the Item Receipt
            var itemReceiptId = itemReceipt.save();

            // Log the Item Receipt ID for reference
            log.error({
                title: 'Item Receipt Created',
                details: 'Item Receipt ID: ' + itemReceiptId
            });
        } else {
            // Log line data for debugging
            log.error({
                title: 'Entry',
                details: 'no'
            });
        }

        // Log a message to indicate the script has completed
        log.error({
            title: 'Script Completed',
            details: 'Item Fulfillment ID: ' + itemFulfillment.id
        });
    }

    return {
        beforeSubmit: beforeSubmit
    };
});