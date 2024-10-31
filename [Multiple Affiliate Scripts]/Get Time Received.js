/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define(['N/format'], function (format) {

    function getCurrentTime() {
        var currentTime = format.format({
            value: new Date(),
            type: format.Type.DATETIME,
            timezone: format.Timezone.ASIA_MANILA
        });

        // Remove the date part from the formatted time string
        var timeWithoutDate = currentTime.split(' ')[1] + ' ' + currentTime.split(' ')[2]; // Extract the time part

        return timeWithoutDate;
    }

    function get(context) {
        var currentTime = getCurrentTime();
        return currentTime;
    }

    return {
        get: get
    };
});