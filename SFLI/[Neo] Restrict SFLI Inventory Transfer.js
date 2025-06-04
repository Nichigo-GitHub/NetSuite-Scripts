/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error'], function (record, log, error) {

    function beforeSubmit(context) {
        var newRecord = context.newRecord;

        // Check if the record is an inventory transfer and the transferlocation field is '669'
        if (newRecord.type === record.Type.INVENTORY_TRANSFER && newRecord.getValue({
                fieldId: 'transferlocation'
            }) == 669 && newRecord.getValue({
                fieldId: 'location'
            }) != 664) {
            log.debug({
                title: 'If',
                details: 'true'
            })

            // Get the number of lines in the sublist
            var lineCount = newRecord.getLineCount({ sublistId: 'inventory' });

            log.debug({
                title: 'sublist count',
                details: lineCount
            })

            // If there is more than one line, throw an error
            if (lineCount > 1) {
                throw error.create({
                    name: 'Go Back!',
                    message: '1 Item per Inventory Transfer to FG Only'
                });
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };

});