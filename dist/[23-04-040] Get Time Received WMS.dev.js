"use strict";

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/format'], function (format) {
  function getCurrentTime() {
    var currentTime = format.format({
      value: new Date(),
      type: format.Type.TIMEOFDAY,
      timezone: format.Timezone.AMERICA_NEW_YORK
    });
    return currentTime;
  }

  function get(context) {
    var currentTime = getCurrentTime();
    return currentTime;
  }

  return {
    get: get
  };
});