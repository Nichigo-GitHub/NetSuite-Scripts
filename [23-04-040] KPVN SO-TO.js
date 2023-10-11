/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record'], function (record) {
    function beforeSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            // Retrieve Sales Order data
            var salesOrder = context.newRecord;

            // Check if Sales Order is using KPVN_SALE_ORDER custom form
            var customForm = salesOrder.getValue({
                fieldId: 'customform'
            });
            // Check if JO to Branch is set to "Yes"
            var joToBranch = salesOrder.getValue({
                fieldId: 'custbody463'
            });

            if (customForm == 463 && joToBranch == 1) {
                var items = salesOrder.getLineCount({
                    sublistId: 'item'
                });

                // Get field values from sales order
                var tranid = salesOrder.getValue({
                    fieldId: 'tranid'
                });
                var subsidiary = salesOrder.getValue({
                    fieldId: 'subsidiary'
                });
                var location = salesOrder.getValue({
                    fieldId: 'location'
                });
                var department = salesOrder.getValue({
                    fieldId: 'department'
                });
                var trandate = salesOrder.getValue({
                    fieldId: 'trandate'
                });
                var exchangerate = salesOrder.getValue({
                    fieldId: 'exchangerate'
                });
                var orderstatus = salesOrder.getValue({
                    fieldId: 'orderstatus'
                });
                var customer = salesOrder.getValue({
                    fieldId: 'entity'
                });
                var memo = salesOrder.getValue({
                    fieldId: 'memo'
                });

                if (customer) {
                    // Load the customer record using the internal ID
                    var customerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: customer
                    });
                
                    // Get the customer name
                    var customerName = customerRecord.getValue({
                        fieldId: 'companyname' // Change to the appropriate field ID for the customer name
                    });
                
                    // Now, customerName should contain "CÔNG TY TNHH IPAX VIỆT NAM"
                    log.error({
                        title: 'Customer Name',
                        details: customerName
                    });
                }            

                // Create Transfer Order record
                var transferOrder = record.create({
                    type: record.Type.TRANSFER_ORDER
                });

                // Set custom form on Transfer Order to KPVN_TRANSFER_ORDER
                transferOrder.setValue({
                    fieldId: 'customform',
                    value: '467'
                });

                // Set transid
                transferOrder.setValue({
                    fieldId: 'tranid',
                    value: 'TO-KPVN-' + tranid.match(/\d+/g)
                });
                // Set subsidiary
                transferOrder.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary
                });
                // Set location
                transferOrder.setValue({
                    fieldId: 'location',
                    value: 778
                }); 
                // Set transferlocation
                transferOrder.setValue({
                    fieldId: 'transferlocation',
                    value: location
                });
                // Set department
                transferOrder.setValue({
                    fieldId: 'department',
                    value: department
                });
                // Set trandate
                transferOrder.setValue({
                    fieldId: 'trandate',
                    value: trandate
                });
                // Set orderstatus
                transferOrder.setValue({
                    fieldId: 'orderstatus',
                    value: orderstatus
                });
                // Set custbody466
                transferOrder.setValue({
                    fieldId: 'custbody466',
                    value: customerName
                });
                // Set memo
                transferOrder.setValue({
                    fieldId: 'memo',
                    value: memo
                });

                // Add Transfer Order line items based on Sales Order
                for (var i = 0; i < items; i++) {
                    // Get sublist items from Sales Order
                    var item = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var description = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    });
                    var order_quantity = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });
                    var item_unit = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'units',
                        line: i
                    });
                    var price = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    });
                    var amount = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });

                    // Insert a new line in Transfer Order sublist
                    transferOrder.insertLine({
                        sublistId: 'item',
                        line: i
                    });
                    transferOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i,
                        value: item
                    });
                    transferOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i,
                        value: description
                    });
                    transferOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i,
                        value: order_quantity
                    });
                    transferOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'units',
                        line: i,
                        value: item_unit
                    });
                    transferOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i,
                        value: price * exchangerate
                    });
                    transferOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i,
                        value: amount * exchangerate
                    });
                }

                // Save Transfer Order
                transferOrder.save();
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});