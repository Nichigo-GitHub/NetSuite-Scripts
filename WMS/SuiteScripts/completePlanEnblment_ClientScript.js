(function(){

    var myFunctions = {};
 
    myFunctions.completePlan = function () {
        var statedata = mobile.getRecordFromState();
        var planComplete = statedata.scriptParams.planComplete;
        var locUseBinsFlag = statedata.scriptParams.locUseBinsFlag;
        
         if(planComplete == true && locUseBinsFlag == false){
          
          mobile.showField('cyclecount_selectItemTaskNoBins_completePlanBtn');
        }else 
        {
          mobile.hideField('cyclecount_selectItemTaskNoBins_completePlanBtn');
        }
        var showCompleteCountButton = statedata.scriptParams.showCompleteCountButton;
        if(showCompleteCountButton == true && locUseBinsFlag == false){
            mobile.showField('cyclecount_selectItemTaskNoBins_completeCount');
        }else if(showCompleteCountButton == false && locUseBinsFlag == false){
            mobile.hideField('cyclecount_selectItemTaskNoBins_completeCount');
        }
    }
     
    return myFunctions;
 
} ());