/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log'], function (currentRecord, dialog, log) {

    function validateLine(context) {
        var rec = currentRecord.get();

        log.debug('validateLine triggered', 'Sublist ID: ' + context.sublistId);

        var subsidiary = rec.getValue({
            fieldId: 'subsidiary'
        });

        log.debug('Subsidiary', subsidiary);

        if (subsidiary != 14) {
            log.debug('Skipping validation', 'subsidiary is not 14');
            return true;
        }

        var currentItem = rec.getCurrentSublistValue({
            sublistId: context.sublistId,
            fieldId: 'item'
        });

        log.debug('Current Item being added/edited', currentItem);

        var lineCount = rec.getLineCount({
            sublistId: context.sublistId
        });

        log.debug('Line Count in Items Sublist', lineCount);

        for (var i = 0; i < lineCount; i++) {
            var lineItem = rec.getSublistValue({
                sublistId: context.sublistId,
                fieldId: 'item',
                line: i
            });

            log.debug('Checking line', 'Line ' + i + ' Item: ' + lineItem);

            if (lineItem == currentItem) {
                log.debug('Duplicate Found', 'Duplicate item at line ' + (i + 1));
                dialog.alert({
                    title: 'Duplicate Item',
                    message: '🚫 This item already exists at line ' + (i + 1) + '.'
                });
                return false; // Prevent line from saving
            }
        }

        log.debug('No duplicates found', 'Line validation passed');
        return true;
    }

    return {
        validateLine: validateLine
    };
});