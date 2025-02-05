/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog', 'N/log'], function (search, dialog, log) {

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;

        // Check if the custom form is 759 before executing
        var customFormId = currentRecord.getValue({
            fieldId: 'customform'
        });

        if (parseInt(customFormId) !== 759) {
            log.debug('fieldChanged', 'Custom form is not 759, exiting script.');
            return;
        }

        // Check if the field changed is the lot number in inventory assignment
        if (context.sublistId === 'inventoryassignment' && context.fieldId === 'receiptinventorynumber') {
            var selectedLotNumber = currentRecord.getCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'receiptinventorynumber'
            });

            log.debug('fieldChanged', 'Selected Lot Number: ' + selectedLotNumber);

            if (selectedLotNumber) {
                // Run saved search to check if the lot number is locked
                var lotLocked = isLotNumberLocked(selectedLotNumber);

                if (lotLocked) {
                    // Display a dialog box to the user
                    dialog.alert({
                        title: 'Lot Number Locked',
                        message: 'The selected lot number "' + selectedLotNumber + '" is locked and cannot be fulfilled. Please select a different lot number.'
                    }).then(function () {
                        // Clear the selected lot number
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            value: null, // Reset the field to null
                            ignoreFieldChange: true // Prevent triggering additional field changes
                        });

                        log.debug('fieldChanged', 'Lot number cleared after dialog.');
                    });
                }
            }
        }
    }

    /**
     * Check if the selected lot number is locked by searching in the saved search
     * @param {string} lotNumber - The selected lot number
     * @returns {boolean} - True if the lot number is locked, false otherwise
     */
    function isLotNumberLocked(lotNumber) {
        var lotLocked = false;

        // Load the saved search (update 'customsearch_locked_lot_numbers' with your saved search ID)
        var lockedLotSearch = search.load({
            id: 'customsearch_locked_lot_numbers'
        });

        // Run the search and check if the lot number exists in the results
        lockedLotSearch.run().each(function (result) {
            var lockedLot = result.getValue({
                name: 'inventorynumber'
            });

            if (lockedLot === lotNumber) {
                lotLocked = true;
                return false; // Stop the search as we've found a match
            }
            return true;
        });

        return lotLocked;
    }

    return {
        fieldChanged: fieldChanged
    };
});