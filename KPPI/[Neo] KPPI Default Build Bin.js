/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {

    var DEFAULT_BIN_NAME = 'Whse Prod RM';

    /**
     * Hook when inventory detail is opened
     */
    function fieldChanged(context) {

        if (context.fieldId !== 'inventorydetail') {
            return;
        }

        console.log('[DefaultBin] Inventory Detail clicked');

        hookPopup();
    }

    /**
     * Intercept popup window
     */
    function hookPopup() {
        if (window._binPopupHooked) return;
        window._binPopupHooked = true;

        var originalOpen = window.open;

        window.open = function () {
            var popup = originalOpen.apply(window, arguments);

            console.log('[DefaultBin] Popup intercepted');

            var interval = setInterval(function () {
                try {
                    if (!popup || popup.closed) {
                        clearInterval(interval);
                        return;
                    }

                    var doc = popup.document;
                    var input = doc.getElementById('inventoryassignment_binnumber_display');

                    if (input) {
                        console.log('[DefaultBin] Bin field found, injecting value');

                        // Set bin name
                        input.value = DEFAULT_BIN_NAME;

                        // Trigger NetSuite events
                        input.dispatchEvent(new popup.Event('change', { bubbles: true }));
                        input.dispatchEvent(new popup.Event('blur', { bubbles: true }));

                        // Simulate ENTER key (critical for selection)
                        var evt = new popup.KeyboardEvent('keydown', {
                            bubbles: true,
                            cancelable: true,
                            keyCode: 13
                        });

                        input.dispatchEvent(evt);

                        console.log('[DefaultBin] Default bin applied:', DEFAULT_BIN_NAME);

                        clearInterval(interval);
                    }

                } catch (e) {
                    console.log('[DefaultBin] Waiting for popup...', e);
                }

            }, 300);

            return popup;
        };
    }

    return {
        fieldChanged: fieldChanged
    };
});