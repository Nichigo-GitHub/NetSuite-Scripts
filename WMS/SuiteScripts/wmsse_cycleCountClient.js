/**
 * Script Description
 * This script is used to validate Cyclecount Generate and release custom form and to start the count .
 */

/***************************************************************************
 Copyright � 2017,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/

/**
 * @author siva mulagalapati
 *@version
 *@date 2017/02/08 04:15:30 $
 *@Description: This is a Client Script used to start the count and to navigate
 * back to cycle count plan form
 */
function backtogeneratesearch()
{ 	 
	var planNum = nlapiGetFieldValue('custpage_plannum');
	var cyclecountURL = nlapiResolveURL('SUITELET', 'customscript_wmsse_cyclecountplan',
			'customdeploy_wmsse_cyclecountplan');
	cyclecountURL = cyclecountURL + '&custpage_plannum='+ planNum;
	window.location.href = cyclecountURL;
}

//This is to start the inventory count
function startCount(recid)
{ 	 
	  var cmd = 'startcount';	
	    var WavePDFURL = '/app/accounting/transactions/invcountmanager.nl?id=' + recid + '&cmd=' + cmd;
	window.location.href = WavePDFURL;
}
