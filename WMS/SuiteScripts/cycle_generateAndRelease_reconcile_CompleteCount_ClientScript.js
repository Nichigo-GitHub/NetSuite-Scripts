(function(){

    var myFunctions = {};

    myFunctions.reconcileCompleteCountButton = function () {
        var statedata = mobile.getRecordFromState();
        var showCompleteCountButton = statedata.scriptParams.showCompleteCountButton;
        // var locUseBinsFlag = statedata.scriptParams.locUseBinsFlag;

        if(showCompleteCountButton == true){

            mobile.showField('cycc_selectTask_cmpltdPlanListTbl_completecountBtn');
        }else if(showCompleteCountButton == false){
            mobile.hideField('cycc_selectTask_cmpltdPlanListTbl_completecountBtn');
        }
        //alert('statedate :'+JSON.stringify(statedata));
    }

    return myFunctions;

} ());
