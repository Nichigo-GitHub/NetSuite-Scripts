/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function getInputData() {
        try {
            log.audit({
                title: 'GET INPUT DATA',
                details: 'Loading saved search customsearch5627'
            });

            var savedSearch = search.load({
                id: 'customsearch5627'
            });

            log.audit({
                title: 'SAVED SEARCH LOADED',
                details: {
                    id: savedSearch.id,
                    length: savedSearch.runPaged().count
                }
            });

            return savedSearch;
        } catch (e) {
            log.error({
                title: 'GET INPUT DATA ERROR',
                details: {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                }
            });

            throw e;
        }
    }

    function map(context) {
        try {
            var result = JSON.parse(context.value);

            log.debug({
                title: 'MAP RESULT',
                details: result
            });

            var itemId = result.values['GROUP(internalid)'];
            itemId = itemId.value;

            log.debug({
                title: 'MAP ITEM',
                details: {
                    itemId: itemId
                }
            });

            if (!itemId) {
                log.error({
                    title: 'MISSING ITEM',
                    details: {
                        itemId: itemId
                    }
                });
                return;
            }

            context.write({
                key: String(itemId),
                value: JSON.stringify({
                    itemId: itemId
                })
            });

        } catch (e) {
            log.error({
                title: 'MAP ERROR',
                details: e
            });
        }
    }

    function reduce(context) {
        try {
            var itemId = context.key;
            var countDate = getLastWorkingDayOfMonth();

            log.audit({
                title: 'PROCESSING ITEM',
                details: {
                    itemId: itemId,
                    countDate: countDate
                }
            });

            var configSearch = search.create({
                type: 'itemlocationconfiguration',
                filters: [
                    ['item', 'anyof', itemId]
                ],
                columns: [
                    'internalid',
                    'location'
                ]
            });

            var results = configSearch.run().getRange({
                start: 0,
                end: 1000
            });

            log.debug({
                title: 'CONFIGURATIONS FOUND',
                details: {
                    itemId: itemId,
                    count: results.length
                }
            });

            for (var i = 0; i < results.length; i++) {
                var configId = results[i].getValue({
                    name: 'internalid'
                });

                var locationId = results[i].getValue({
                    name: 'location'
                });

                log.debug({
                    title: 'UPDATING CONFIGURATION ' + (i + 1) + ' OF ' + results.length,
                    details: {
                        configId: configId,
                        itemId: itemId,
                        locationId: locationId
                    }
                });

                var configRecord = record.load({
                    type: 'itemlocationconfiguration',
                    id: configId,
                    isDynamic: false
                });

                configRecord.setValue({
                    fieldId: 'nextinvtcountdate',
                    value: countDate
                });

                configRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug({
                    title: 'CONFIGURATION UPDATED ' + (i + 1) + ' OF ' + results.length,
                    details: {
                        configId: configId,
                        itemId: itemId,
                        locationId: locationId,
                        countDate: countDate
                    }
                });
            }

            log.audit({
                title: 'ITEM COMPLETE',
                details: {
                    itemId: itemId,
                    configurationsUpdated: results.length,
                    countDate: countDate
                }
            });
        } catch (e) {
            log.error({
                title: 'REDUCE ERROR',
                details: {
                    key: context.key,
                    error: e
                }
            });
        }
    }

    function getLastWorkingDayOfMonth() {
        var today = new Date();
        /*
         * Last day of current month
         */
        var lastDay = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );

        lastDay.setDate(
            lastDay.getDate() - 2
        );

        /*
         * Sunday → Saturday
         */
        /* if (lastDay.getDay() === 0) {
            lastDay.setDate(
                lastDay.getDate() - 1
            );
        } */

        /*
         * Sunday → Friday
         */
        /* if (lastDay.getDay() === 0) {
            lastDay.setDate(
                lastDay.getDate() - 2
            );
        } */

        /*
         * Saturday → Friday
         */
        /* else if (lastDay.getDay() === 6) {
            lastDay.setDate(
                lastDay.getDate() - 1
            );
        } */

        return lastDay;
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    };
});