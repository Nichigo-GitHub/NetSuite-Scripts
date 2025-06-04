/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Sep 2020     Lenovo
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request) {
	try {
		var newId = nlapiGetRecordId();
		var newType = nlapiGetRecordType();
		nlapiLogExecution('DEBUG', 'newtype', newType);
		var ctxtObj = nlapiGetContext();

		if (type == "view") {
			var printNCR = "printNCR = window.open('" + nlapiResolveURL('SUITELET', 'customscript1692', 'customdeploy1') + "&formtype=" + newType + "&internalId=" + newId + "&l=t', 'printNCR', 'height=1056, width=1100, resizable=yes, scrollbars=yes, toolbar=no'); printNCR.focus();";
			var subId = nlapiGetSubsidiary();
			if (subId == 15) { //only KPVN display the button
				form.addButton("custpage_printOR", "Print NCR QA", printNCR);
			} else if (subId == 18) { //only KPVN display the button
				form.addButton("custpage_printOR", "Print NCR QA", printNCR);
			}
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('DEBUG', 'beforeLoad', e.getCode() + '\n' + e.getDetails());
		} else {
			nlapiLogExecution('DEBUG', 'beforeLoad - unexpected', e.toString());
		}
	}
}