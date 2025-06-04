(function(){

    var myFunctions = {};
 
    myFunctions.CompleteCountButton = function () {
        var statedata = mobile.getRecordFromState();
        var showCompleteCountButton = statedata.scriptParams.showCompleteCountButton;
       // var locUseBinsFlag = statedata.scriptParams.locUseBinsFlag;
        
         if(showCompleteCountButton == true){
          
          mobile.showField('cyclecount_selectTask_completeCount');
        }else if(showCompleteCountButton == false){
          mobile.hideField('cyclecount_selectTask_completeCount');
        }
		//alert('statedate :'+JSON.stringify(statedata));
    }
     
    return myFunctions;
 
} ());