/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'], function (runtime) {

  function pageInit(context) {
    var userRole = runtime.getCurrentUser().role;
    var buttonId = 'void'; // Replace with the internal ID of the "void" button

    // Check if the user role is 1201 (replace with the desired user role)
    if (userRole === 1201) {
      var voidButton = context.form.getButton({
        id: buttonId
      });

      // Disable the button
      voidButton.isDisabled = true;
    }
  }

  return {
    pageInit: pageInit
  };
});