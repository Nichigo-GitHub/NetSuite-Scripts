/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

    function beforeSubmit(context) {
        var newRecord = context.newRecord;
        var customForm = newRecord.getValue({
            fieldId: 'customform'
        });

        // Get the "location" field value
        var location = newRecord.getText({
            fieldId: 'location'
        }); // Use getText to get the display value
        log.debug('Location:', location);

        // Check if "location" contains "hanoi" (case insensitive)
        if (location && location.toLowerCase().indexOf('hanoi') !== -1) {

            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY) {
                log.debug('Script triggered.');

                if (customForm === '737' || customForm === '486') { // KPVN_ITEM_RECEIPT_WMS
                    var newDate = setTranValue();
                    var tranid = newDate.prefix + newDate.date + newDate.num; // Include the formatted date
                    log.debug('New tranid: ' + tranid);

                    newRecord.setValue({
                        fieldId: 'tranid',
                        value: tranid
                    });
                    log.debug('New tranid set: ' + tranid);
                }
            }
        } else {
            log.debug('Location does not contain "Hanoi". Script will not run.');
        }
    }

    function setTranValue() {
        var configObj = getConfigData();
        log.debug("Config data retrieved: " + JSON.stringify(configObj));

        var prefix = configObj.prefix;
        var number = parseInt(configObj.num); // Convert to number

        // Format today's date as MMDDYYYY
        var today = new Date();
        var formattedDate = formatDate(today);

        // Update the record directly with the next sequence number
        setConfigRec(configObj.id, number + 1);

        // Format the number with leading zeros
        var formattedNumber = ('000' + (number + 1)).slice(-3);

        return {
            'id': configObj.id,
            'prefix': prefix,
            'date': formattedDate,
            'num': formattedNumber
        };
    }

    function getConfigData() {
        var tranidconfigSearch = search.create({
            type: 'customrecord_kpvn_num_series',
            columns: ['custrecord_kpvnrr_pre', 'custrecord_kpvnrr_num']
        }).run().getRange({
            start: 0,
            end: 1
        });

        if (!tranidconfigSearch || tranidconfigSearch.length < 1) {
            throw new Error('No configuration data found.');
        }

        var result = tranidconfigSearch[0];
        return {
            'id': result.id,
            'prefix': result.getValue('custrecord_kpvnrr_pre'),
            'num': result.getValue('custrecord_kpvnrr_num')
        };
    }

    function setConfigRec(recId, number) {
        if (!recId || !number) return;

        var rec = record.load({
            type: 'customrecord_kpvn_num_series',
            id: recId,
            isDynamic: true
        });

        // Get the current value of custrecord_kpvnrr_num
        var currentNumber = rec.getValue({
            fieldId: 'custrecord_kpvnrr_num'
        });

        // Increment the number by 1
        var incrementedNumber = parseInt(currentNumber) + 1;

        // Set the incremented number back to the record
        rec.setValue({
            fieldId: 'custrecord_kpvnrr_num',
            value: incrementedNumber
        });

        // Save the record
        rec.save();
    }

    function formatDate(date) {
        var year = String(date.getFullYear()).slice(-2); // Get last 2 digits of the year
        var month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
        var day = ('0' + date.getUTCDate()).slice(-2); // Use getUTCDate to avoid timezone issues
        var com = '-';
        return year + month + day + com; // Format: YYMMDD
    }

    return {
        beforeSubmit: beforeSubmit
    };
});