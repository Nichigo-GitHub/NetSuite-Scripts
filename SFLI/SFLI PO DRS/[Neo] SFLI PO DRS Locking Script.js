/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record'], function (currentRecord, record) {

    function lockAndEditRecord() {
        try {
            var rec = currentRecord.get();
            var recId = rec.id;
            var recType = rec.type;

            // Lock the record by setting custrecord_in_edit to true
            record.submitFields({
                type: recType,
                id: recId,
                values: {
                    custrecord_in_edit: true
                }
            });

            // Redirect using window.location
            var baseUrl = '/app/common/custom/custrecordentry.nl';
            var url = baseUrl + '?rectype=1026&id=' + recId + '&e=T';
            window.location.href = url;

        } catch (e) {
            console.error('Error locking record', e);
            alert('❗ Error locking record: ' + e.message);
        }
    }

    function resetLockOnCancel() {
        try {
            var rec = currentRecord.get();
            var recId = rec.id;
            var recType = rec.type;

            // Unlock the record by setting custrecord_in_edit to false
            record.submitFields({
                type: recType,
                id: recId,
                values: {
                    custrecord_in_edit: false
                }
            });

        } catch (e) {
            console.error('Error resetting lock', e);
            alert('❗ Error resetting lock: ' + e.message);
        }
    }

    // Expose the required entry point function
    function pageInit(context) {
        console.log('Page initialized');

        // Add an event listener for the Cancel button
        window.addEventListener('beforeunload', function (event) {
            // Check if the user is navigating away without saving
            if (!document.querySelector('[name="save"]').clicked) {
                resetLockOnCancel();
            }
        });
    }

    return {
        pageInit: pageInit, // Required entry point
        lockAndEditRecord: lockAndEditRecord // Custom function for the button
    };
});