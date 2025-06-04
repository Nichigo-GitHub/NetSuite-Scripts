(function(){

    var myFunctions = {};
 
    myFunctions.gotoStage = function () {
        var statedata = mobile.getRecordFromState();
        var gotostageflag = statedata.scriptParams.gotostage;
        if(gotostageflag=='Y'){
          
          mobile.showField('selectPickTask_goToStagingBtn');
        }else if(gotostageflag == 'N'){
          mobile.hideField('selectPickTask_goToStagingBtn');
        }
		//alert('statedate :'+JSON.stringify(statedata));
    }
     
    return myFunctions;
 
} ());