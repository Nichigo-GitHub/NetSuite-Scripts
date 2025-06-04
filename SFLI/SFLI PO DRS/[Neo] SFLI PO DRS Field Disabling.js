/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {
  function pageInit(context) {
    var currentRecord = context.currentRecord;

    // Disable the fields
    currentRecord.getField({
      fieldId: 'custrecord500'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord536'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord698'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord537'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord695'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord538'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord539'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord700'
    }).isDisabled = true;

    currentRecord.getField({
      fieldId: 'custrecord540'
    }).isDisabled = true;
  }

  return {
    pageInit: pageInit
  };
});