(function(){

    var myFunctions = {};
 
    myFunctions.gotoStage = function () {
        var statedata = mobile.getRecordFromState();
        var gotostageflag = statedata.scriptParams.gotostageflag;
        var locUseBinsFlag = statedata.scriptParams.locUseBinsFlag;
        
         if(gotostageflag=='Y' && locUseBinsFlag == true){
          
          mobile.showField('pickTask_stagingActionButtn');
        }else if(gotostageflag == 'N'){
          mobile.hideField('pickTask_stagingActionButtn');
        }
		//alert('statedate :'+JSON.stringify(statedata));
    }
     
    return myFunctions;
 
} ());