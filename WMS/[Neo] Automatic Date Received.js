/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search'], function (search) {

    function post(context) {
        try {
            var rrNumber = context.rrNumber;

            log.debug('RR Number Received', rrNumber);

            if (!rrNumber) {
                return {
                    success: false,
                    message: 'RR Number is required'
                };
            }

            // Search Item Receipt by tranid
            var irSearch = search.create({
                type: search.Type.ITEM_RECEIPT,
                filters: [
                    ['custbody19', 'is', rrNumber]
                ],
                columns: [
                    'trandate'
                ]
            });

            var results = irSearch.run().getRange({
                start: 0,
                end: 1
            });

            if (!results || results.length === 0) {
                return {
                    success: false,
                    message: 'Cannot Find Tracking Number ' + rrNumber
                };
            }

            var dateReceived = results[0].getValue('trandate');

            log.debug('Date Received', dateReceived);

            return {
                success: true,
                dateReceived: new Date(dateReceived)
            };

        } catch (e) {
            log.error('ERROR', e);

            return {
                success: false,
                message: e.message
            };
        }
    }

    return {
        post: post
    };
});