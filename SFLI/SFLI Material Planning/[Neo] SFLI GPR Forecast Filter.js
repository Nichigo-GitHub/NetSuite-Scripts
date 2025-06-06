/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/log'], function (record, log) {

  function beforeSubmit(context) {
    // Ensure the script runs only on create or edit
    if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
      return;
    }

    var newRecord = context.newRecord; // Get the current record

    try {
      var sublistId = 'recmachcustrecord500'; // Sublist ID

      // Get the number of lines in the sublist
      var lineCount = newRecord.getLineCount({
        sublistId: sublistId
      });

      log.debug('Line Count', lineCount);

      // Iterate through the sublist lines in reverse order so we can remove them safely
      for (var i = lineCount - 1; i >= 0; i--) {
        // Get values from the fields
        var fieldValue1 = newRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord769',
          line: i
        });

        var fieldValue2 = newRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord770',
          line: i
        });

        var fieldValue3 = newRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord771',
          line: i
        });

        var fieldValue4 = newRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'custrecord772',
          line: i
        });

        log.debug('Field Values for line ' + i, 'custrecord769: ' + fieldValue1 +
          ', custrecord770: ' + fieldValue2 + ', custrecord771: ' + fieldValue3 + ', custrecord772: ' + fieldValue4);

        // If all fields are empty or undefined, remove the line
        if (!fieldValue1 && !fieldValue2 && !fieldValue3 && !fieldValue4) {
          newRecord.removeLine({
            sublistId: sublistId,
            line: i,
            ignoreRecalc: true // Optional: If you don't want to recalculate
          });
          log.debug('Line Removed', 'Line ' + i + ' was removed.');
        }
      }

    } catch (e) {
      log.error({
        title: 'Error in beforeSubmit',
        details: e.message
      });
      throw e; // Rethrow the error to halt processing if needed
    }
  }

  return {
    beforeSubmit: beforeSubmit
  };
});