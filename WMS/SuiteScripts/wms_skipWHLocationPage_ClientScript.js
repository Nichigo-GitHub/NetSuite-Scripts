/**
 *    Copyright 2020, Oracle and/or its affiliates. All rights reserved.
 */
(function(){
    var myFunctions = {};
    myFunctions.skipWHLocPage = function () {
    	var statedata = mobile.getRecordFromState();
    	var count = statedata.scriptParams.roleList.length;
    	if (count === 1) {
    		statedata.auxParams.warehouseLocation_LocationTbl = statedata.scriptParams.roleList[0];
    		statedata.scriptParams.locUseBinsFlag = statedata.scriptParams.roleList[0]['locUseBinsFlag'];
    		mobile.setRecordInState(statedata);
        	mobile.callPrimaryAction();
    	}
    }
    myFunctions.hideButton = function () {
    	mobile.hideField('selectWH_hiddenbutton');
    }
    return myFunctions;
 
} ());