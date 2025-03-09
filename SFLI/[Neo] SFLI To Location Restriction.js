/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/log', 'N/runtime'], function (currentRecord, dialog, log, runtime) {

    function fieldChanged(context) {
        var rec = currentRecord.get();
        var fieldId = context.fieldId;

        // Only trigger when "transferlocation" field is changed
        if (fieldId !== 'transferlocation') {
            return;
        }

        log.debug('Field Changed Triggered', 'Field ID: ' + fieldId);

        var subsidiaryValue = rec.getValue({
            fieldId: 'subsidiary'
        });
        log.debug('Subsidiary Value', subsidiaryValue);

        // Proceed only if the subsidiary is 14
        if (subsidiaryValue != 14) {
            log.debug('Subsidiary Check Failed', 'Subsidiary is not 14. Exiting.');
            return;
        }

        log.debug('Subsidiary Check Passed', 'Subsidiary is 14.');

        // Get current user ID
        var userId = runtime.getCurrentUser().id;
        log.debug('Current User ID', userId);

        // List of restricted users for location 669
        var restrictedUsers669 = [109078, 107387, 109079, 10461, 33368/* , 96883 */];

        // Restriction for user 452 on location 670
        var restrictedUsers670 = [452];

        var transferLocationValue = rec.getValue({
            fieldId: 'transferlocation'
        });
        log.debug('Transfer Location Selected', transferLocationValue);

        // Restrict users from selecting restricted locations
        if ((restrictedUsers669.includes(userId) && transferLocationValue == '669') ||
            (restrictedUsers670.includes(userId) && transferLocationValue == '670')) {

            rec.setValue({
                fieldId: 'transferlocation',
                value: '',
                ignoreFieldChange: true
            });

            log.debug('Transfer Location Reset', `Restricted location (${transferLocationValue}) was selected and cleared.`);

            dialog.alert({
                title: "Access Denied",
                message: "You are not allowed to transfer to this location."
            }).then(function () {
                log.debug('Popup Shown', 'User acknowledged the restriction.');
            }).catch(function (error) {
                log.error('Popup Error', error);
            });
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});