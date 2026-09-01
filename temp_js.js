/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {
    function getInputData() {
        log.audit({
            title: 'GET INPUT DATA',
            details: 'Loading saved search customsearch4991'
        });
        return search.load({
            id: 'customsearch4991'
        });
    }

    function map(context) {
        try {
            var result = JSON.parse(context.value);

            log.debug({
                title: 'MAP RESULT',
                details: result
            });

            /*
             * Get values from saved search
             */
            var itemId = result.values['GROUP(internalid)'];
            var itemType = result.values['GROUP(type)'];
            var binNumber = result.values['GROUP(binnumber.binOnHand)'];
            var location = result.values['GROUP(location.binOnHand)'];
            var onHand = result.values['GROUP(quantityonhand.binOnHand)'];
            var name = result.values['GROUP(itemid)'];
            var description = result.values['GROUP(salesdescription)'];
            var formulaDate = result.values['MAX(formuladate)'];

            /*
             * Summary search values can sometimes
             * come back as objects:
             *
             * {
             *     value: '12345',
             *     text: 'Item Name'
             * }
             */

            if (itemId && typeof itemId === 'object') {
                itemId = itemId.value;
            }

            if (itemType && typeof itemType === 'object') {
                itemType = itemType.value;
            }

            if (binNumber && typeof binNumber === 'object') {
                binNumber = binNumber.value;
            }

            if (location && typeof location === 'object') {
                location = location.value;
            }

            log.debug({
                title: 'ITEM RESULT',
                details: {
                    itemId: itemId,
                    itemType: itemType,
                    binNumber: binNumber,
                    location: location,
                    onHand: onHand,
                    name: name,
                    description: description,
                    formulaDate: formulaDate
                }
            });

            /*
             * Send item information to Reduce
             */

            context.write({
                key: String(itemId),
                value: JSON.stringify({
                    itemId: itemId,
                    itemType: itemType,
                    binNumber: binNumber,
                    location: location,
                    onHand: onHand,
                    name: name,
                    description: description,
                    formulaDate: formulaDate
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

            var data = JSON.parse(context.values[0]);


            log.audit({
                title: 'PROCESSING ITEM',
                details: {
                    itemId: itemId,
                    itemType: data.itemType,
                    data: data
                }
            });


            /*
             * Determine record type
             */

            var recordType;


            if (data.itemType === 'InvtPart') {

                recordType = record.Type.INVENTORY_ITEM;

            }
            else if (data.itemType === 'Assembly') {

                recordType = record.Type.ASSEMBLY_ITEM;

            }
            else {

                log.error({
                    title: 'UNSUPPORTED ITEM TYPE',
                    details: {
                        itemId: itemId,
                        itemType: data.itemType,
                        name: data.name
                    }
                });

                return;
            }


            log.debug({
                title: 'RECORD TYPE DETERMINED',
                details: {
                    itemId: itemId,
                    itemType: data.itemType,
                    recordType: recordType
                }
            });


            /*
             * Determine the date that should be assigned.
             *
             * Last working day of current month.
             */

            var countDate = getLastWorkingDayOfMonth();


            /*
             * Load either:
             *
             * Inventory Item
             * OR
             * Assembly Item
             */

            var itemRecord = record.load({
                type: recordType,
                id: itemId,
                isDynamic: false
            });


            /*
             * Set Next Inventory Count Date
             */

            itemRecord.setValue({
                fieldId: 'custitem_sc_next_count_date',
                value: countDate
            });


            /*
             * Save item
             */

            var savedId = itemRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });


            log.audit({
                title: 'COUNT DATE UPDATED',
                details: {
                    itemId: itemId,
                    savedId: savedId,
                    itemType: data.itemType,
                    recordType: recordType,
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


        /*
         * Sunday
         */

        if (lastDay.getDay() === 0) {

            lastDay.setDate(
                lastDay.getDate() - 2
            );

        }


        /*
         * Saturday
         */

        else if (lastDay.getDay() === 6) {

            lastDay.setDate(
                lastDay.getDate() - 1
            );

        }


        return lastDay;
    }


    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    };
});