/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function fieldChanged(context) {
        const currentRecord = context.currentRecord;
        const sublistId = 'inventory';
        const QuantityFieldId = 'adjustqtyby';
        const customformFieldId = 'customform';

        // Check if the subsidiary is equal to 18
        const customform = currentRecord.getValue({
            fieldId: customformFieldId
        });

        if (customform != 650) {
            log.error('customform Check', 'customform is not 650, exiting function');
            return; // Exit the function if subsidiary is not 18
        }

        // Array to store the field IDs to check in the sublist
        var fieldIdsToCheck = [];
        for (var i = 253; i <= 547; i++) {
            if (i === 350) i = 352;
            if (i === 449) i = 451;

            fieldIdsToCheck.push('custcol' + i);
        }

        log.error('context.fieldId Value', context.fieldId);

        // Log the sublist ID if there is one
        if (context.sublistId) {
            log.debug('Sublist ID', context.sublistId);
        }

        if (context.fieldId == 'adjustqtyby') {
            for (var i = 0; i < fieldIdsToCheck.length; i++) {
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldIdsToCheck[i],
                    value: 0
                });
            }

            currentRecord.commitLine({
                sublistId: sublistId
            });

            log.error('Item Display', 'New line selected and fields set to 0');
        } else if (fieldIdsToCheck.indexOf(context.fieldId) !== -1) {
            var flag = F;
            var sum = 0;
            const trigger = context.fieldId;
            const triggerValue = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: trigger
            });
            const rejQuantity = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: QuantityFieldId
            });

            log.error('Trigger Field', trigger);
            log.error('Trigger Value', triggerValue);

            for (var i = 0; i < fieldIdsToCheck.length; i++) {
                const kindOfReject = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldIdsToCheck[i],
                });

                sum += kindOfReject;

                log.error('Current Sum', sum);
                log.error('Current Field ID', fieldIdsToCheck[i]);

                if (sum > rejQuantity) {
                    window.alert('[Notice: Input is Exceeding The Total Quantity]');

                    // Reset the field that triggered the change
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: trigger,
                        value: 0
                    });

                    sum -= triggerValue; // Correct the sum after resetting the value

                    flag = T;

                    log.error('Sum after reset', sum);

                    return; // Exit the loop if the condition is met for any field
                }
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});