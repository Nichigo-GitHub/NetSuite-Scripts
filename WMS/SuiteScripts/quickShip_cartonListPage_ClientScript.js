(function(){

	var myFunctions = {};

	myFunctions.hideShipAll = function () {
		mobile.hideField('quickShip_cartonList_shipAllButton');
		var statedata = mobile.getRecordFromState();
		var count = statedata.scriptParams.cartonCount;
		if (count > 1) {
			mobile.showField('quickShip_cartonList_shipAllButton');
		}
	}

	return myFunctions;

} ());