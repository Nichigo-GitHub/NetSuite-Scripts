/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime'], function (runtime) {

    function pageInit(context) {
        applyLogic(context.currentRecord);
    }

    function lineInit(context) {
        applyLogic(context.currentRecord);
    }

    function validateLine(context) {
        applyLogic(context.currentRecord);
        return true;
    }

    function fieldChanged(context) {
        if (context.fieldId === 'memo') {
            applyLogic(context.currentRecord);
        }
    }

    function applyLogic(rec) {
        try {
            var userRole = runtime.getCurrentUser().role;

            // Only apply for role 1410
            if (userRole != 1410) return;

            var memo = rec.getValue({ fieldId: 'memo' }) || '';
            var isGoodScrap = memo.toLowerCase().indexOf('good scrap') !== -1;

            var lineCount = rec.getLineCount({ sublistId: 'item' });

            for (var i = 0; i < lineCount; i++) {

                var qty = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                var isDecimal = (qty % 1 !== 0);

                // Default: disable if NOT Good Scrap
                var shouldDisable = !isGoodScrap;

                // BUT if decimal → enable
                if (isDecimal) {
                    shouldDisable = false;
                }

                rec.getSublistField({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                }).isDisabled = shouldDisable;
            }

        } catch (e) {
            console.log('ERROR:', e);
        }
    }

    return {
        pageInit: pageInit,
        lineInit: lineInit,
        validateLine: validateLine,
        fieldChanged: fieldChanged
    };
});