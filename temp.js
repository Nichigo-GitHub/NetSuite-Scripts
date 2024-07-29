/**
* Copyright ï¿½ 2018, Oracle and/or its affiliates. All rights reserved.
*/

/**
* @NApiVersion 2.x
* @NScriptType Restlet
* @NModuleScope Public
*/
define(['N/search', './wms_utility', './wms_translator', './big', 'N/config', 'N/record', 'N/runtime',
'./wms_workOrderUtility','N/task'],


function (search, utility, translator, Big, config, record, runtime, workOrderUtility,task) {

function doPost(requestBody) {

var binValidateObj = {};
var debugString = '';
var requestParams = '';
var woItemList = [];
var impactedRecords={};
var impactRec = {};
var openTaskArr = [];
var assemblyBuildIdArr = [];
var transactionInternalIdArr = [];
var issuedBy = '';

try{
if(utility.isValueValid(requestBody)){
log.debug({title:'requestBody',details:requestBody});

var requestParams = requestBody.params;
var binName = requestParams.binName;
var warehouseLocationId = requestParams.warehouseLocationId;
var assemblyItemInternalId = requestParams.assemblyItemInternalId;
var assemblyItemType = requestParams.assemblyItemType;
var assemblyItemName = requestParams.assemblyItemName;
var inventoryStatusFeature = requestParams.inventoryStatusFeature;

var transactionInternalId = requestParams.transactionInternalId;
var transactionName = requestParams.transactionName;
var scannedQuantity = requestParams.scannedQuantity;
var scannedQuantityInBaseUnits = requestParams.scannedQuantityInBaseUnits;

var statusName = requestParams.statusName;
var statusInternalId = requestParams.statusInternalId;
var transactionUomName = requestParams.transactionUomName;
var lotName = requestParams.lotName;
var lotInternalId = requestParams.lotInternalId;
var lotExpiryDate = requestParams.lotExpiryDate;
var assemblyItemQuantity = requestParams.assemblyItemQuantity;
var issuedBy = requestParams.issuedBy;

//var stockConversionRate = requestParams.stockConversionRate;
var preferedBinInternalId = requestParams.preferedBinInternalId;
var binMixItem = requestParams.binMixItem;
var binMixLot = requestParams.binMixLot;
var actualBeginTime = requestParams.actualBeginTime;
var isValidBin = true;
var isUOMItem = false;
if(utility.isValueValid(transactionUomName)){
isUOMItem = true;
}
binValidateObj['isUOMItem'] = isUOMItem;
var binObj = validateWOBin(binName, warehouseLocationId, binValidateObj);
var binInternalId = binObj.binInternalId;
var binName = binObj.binName;


if(utility.isValueValid(binInternalId)){
if(binInternalId != preferedBinInternalId){
if(binMixItem != true){
var invBalanceDetails = validateMixItemAndMixLot(assemblyItemInternalId, binInternalId, warehouseLocationId, null ,null,
assemblyItemType);
if(invBalanceDetails.length > 0){
isValidBin = false;
binValidateObj['isValid']=false;
binValidateObj["errorMessage"] = translator.getTranslationString("PO_QUANTITYVALIDATE.MIXITEMS_FALSE");;
}
}
if(isValidBin && binMixLot != true && assemblyItemType == "lotnumberedassemblyitem"){
var invBalanceDetails = validateMixItemAndMixLot(assemblyItemInternalId, binInternalId, warehouseLocationId, lotName
,null, assemblyItemType);
if(invBalanceDetails.length > 0){
isValidBin = false;
binValidateObj['isValid']=false;
binValidateObj["errorMessage"] = translator.getTranslationString("PO_QUANTITYVALIDATE.MIXLOTS_FALSE");;
}
}
}
if(isValidBin){
var obj = new Object();
obj['transactionInternalId'] = transactionInternalId;
obj['binInternalId'] = binInternalId;
obj['assemblyItemInternalId'] = assemblyItemInternalId;
obj['warehouseLocationId'] = warehouseLocationId;
obj['itemType'] = assemblyItemType;

obj['inventoryNumber'] = lotName;
obj['lotInternalId'] = lotInternalId;
obj['scannedQuantity'] = scannedQuantity;
obj['scannedQuantityInBaseUnits'] = scannedQuantityInBaseUnits;
obj['assemblyItemQuantity'] = assemblyItemQuantity;
obj['lotExpiryDate'] = lotExpiryDate;
obj['statusInternalId'] = statusInternalId;
obj['inventoryStatusFeature'] = inventoryStatusFeature;

obj['inventoryNumber'] = lotName;
obj['actualBeginTime'] = actualBeginTime;
obj['itemInternalId'] = assemblyItemInternalId;
obj['status'] = statusInternalId;
obj['processType'] = 'WorkOrderAssembly';
obj['transactionUomName'] = transactionUomName;

binValidateObj['isValid'] = true;
binValidateObj['info_binName'] = binName;

var results = workOrderUtility.createAssemblyBuildRec(obj);
var splitOpenTaskResults = results.opentaskSplitArray;

if(utility.isValueValid(results['assemblyRecId'])){
assemblyBuildIdArr.push(results['assemblyRecId']);
var assemblyRec = record.load({ type : 'assemblybuild', id : results.assemblyRecId});
var employeeSearchResults = search.load({
id: 'customsearch_sfli_employees'
});

var employeeSearchFilters = employeeSearchResults.filters;

employeeSearchFilters.push(search.createFilter({
name: 'entityid',
operator: search.Operator.HASKEYWORDS,
values: issuedBy
}));

employeeSearchResults.filters = employeeSearchFilters;
var empSearchResultsvalues = employeeSearchResults.run().getRange({
start: 0,
end: 1000
});

assemblyRec.setValue({fieldId :'custbody_employee', value: empSearchResultsvalues[0].id});
assemblyRec.save();

}else{
assemblyBuildIdArr.push();
}

impactedRecords['assemblybuild'] = assemblyBuildIdArr;


log.debug('splitOpenTaskResults', splitOpenTaskResults);

obj['openTask_statusFlag'] = 3;
obj['openTask_taskType'] = 5;
obj['opentTask_NSConfirmationRefNo'] = results.assemblyRecId;
obj['toBinInternalId'] = binInternalId;

var openTaskId = workOrderUtility.createOpenTaskForWorkOrder(obj);

impactRec['opentaskId'] = openTaskId;

if(utility.isValueValid(impactRec['opentaskId'])){
openTaskArr.push(impactRec['opentaskId']);
}else{
openTaskArr.push();
}
impactedRecords['customrecord_wmsse_trn_opentask'] = openTaskArr;

if(utility.isValueValid(transactionInternalId)){
transactionInternalIdArr.push(transactionInternalId);
}else{
transactionInternalIdArr.push();
}

impactedRecords['workorder'] = transactionInternalIdArr;
binValidateObj["impactedRecords"] = impactedRecords;
if(utility.isValueValid(splitOpenTaskResults) && splitOpenTaskResults.length>0)
{

splitOpenTaskRecords(splitOpenTaskResults,results,transactionInternalId,inventoryStatusFeature);

}
else
{
binValidateObj['errorMessage']='';
binValidateObj['isValid']=false;
}

}
}
}else{
binValidateObj['isValid']=false;
}

}catch(e){
binValidateObj['isValid'] = false;
binValidateObj['errorMessage'] = e.message;
log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
log.error({title:'debugString',details:debugString});
}
log.debug('binValidateObj',binValidateObj);
return binValidateObj;
}

function validateWOBin(binName, warehouseLocationId, binValidateObj){
var binObj = {};
if(utility.isValueValid(binName)){
var binSearch = search.load('customsearch_wmsse_woqty_bin_srh');

binSearch.filters.push(search.createFilter({
name : 'binnumber',
operator : search.Operator.IS,
values : binName
}));

binSearch.filters.push(search.createFilter({
name : 'location',
operator : search.Operator.IS,
values : warehouseLocationId
}));

var binSearchRes = utility.getSearchResultInJSON(binSearch);
log.debug('binSearchRes', binSearchRes);
if(binSearchRes.length == 0){
binValidateObj['isValid']=false;
binValidateObj["errorMessage"] = translator.getTranslationString("BINTRANSFER_TOBINVALIDATE.INVALID_BIN");
}else if(binSearchRes[0]['inactive'] == 'T'){
binValidateObj['isValid']=false;
binValidateObj["errorMessage"] = translator.getTranslationString("WORKORDER_PICKING.INACTIVE_BIN");
}else{
isValidBin = true;
binObj.binInternalId = binSearchRes[0]['id'];
binObj.binName = binSearchRes[0]['binnumber'];
}
}else{
binValidateObj['isValid']=false;
binValidateObj["errorMessage"] = translator.getTranslationString("BINTRANSFER_TOBINVALIDATE.INVALID_BIN");
}
return binObj;
}

function validateMixItemAndMixLot(itemInternalId, binInternalId, warehouseLocationId, inventoryNumber, statusInternalId,
itemType){
var invBalanceSearch = '';
if(itemType == "serializedinventoryitem" || itemType == "serializedassemblyitem"){
invBalanceSearch = search.load({
type : search.Type.INVENTORY_BALANCE,
id : 'customsearch_wms_get_invbalance_details'
});
}else{

invBalanceSearch = search.load({
type : search.Type.INVENTORY_BALANCE,
id : 'customsearch_wms_wo_invbal_inv_lot_exp'
});
}

invBalanceSearch.filters.push(search.createFilter({
name : 'location',
join : 'binnumber',
operator : search.Operator.ANYOF,
values : warehouseLocationId
}));

invBalanceSearch.filters.push(search.createFilter({
name : 'binnumber',
operator : search.Operator.IS,
values : binInternalId
}));

invBalanceSearch.filters.push(search.createFilter({
name : 'item',
operator : search.Operator.NONEOF,
values : itemInternalId
}));

if(utility.isValueValid(inventoryNumber)){
invBalanceSearch.filters.push(search.createFilter({
name : 'inventorynumber',
join : 'inventorynumber',
operator : search.Operator.ISNOT,
values : inventoryNumber
}));
}

invBalanceResults = utility.getSearchResultInJSONForValidation(invBalanceSearch);
log.debug('invBalanceResults',invBalanceResults);
return invBalanceResults;
}

function getOpenTaskLineDetails(transactionInternalId, openTaskLineNo, openTaskSku, openTaskLotNum, openTaskSerial,
inventoryStatusFeature){

var openTaskSearch = search.load({
type : 'customrecord_wmsse_trn_opentask',
id : 'customsearch_wmsse_assembly_qtyscan_ot'
});

openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_order_no',
operator : search.Operator.ANYOF,
values : transactionInternalId
}));

openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_wms_status_flag',
operator : search.Operator.ANYOF,
values : ['8']
}));

openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_nsconfirm_ref_no',
operator : search.Operator.ANYOF,
values : ['@NONE@']
}));

openTaskSearch.filters.push(search.createFilter({
name : 'isinactive',
operator : search.Operator.IS,
values : false
}));
if(utility.isValueValid(openTaskSku)){
openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_sku',
operator : search.Operator.ANYOF,
values : openTaskSku
}));
}
if(utility.isValueValid(openTaskLineNo)){
openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_line_no',
operator : search.Operator.EQUALTO,
values : openTaskLineNo
}));
}
if(utility.isValueValid(openTaskLotNum)){
openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_batch_num',
operator : search.Operator.IS,
values : openTaskLotNum
}));
}
if(utility.isValueValid(openTaskSerial)){
openTaskSearch.filters.push(search.createFilter({
name : 'custrecord_wmsse_serial_no',
operator : search.Operator.CONTAINS,
values : openTaskSerial
}));
}

var openTaskRes = utility.getSearchResultInJSON(openTaskSearch);
log.debug('openTaskRes', openTaskRes);
return openTaskRes;
}

function splitOpenTaskRecords(splitOpenTaskResults,results,transactionInternalId,inventoryStatusFeature)
{
for(var index in splitOpenTaskResults){
if(runtime.getCurrentScript().getRemainingUsage() <= 100){ var
  schstatus=task.create({taskType:task.TaskType.MAP_REDUCE});
  schstatus.scriptId='customscript_wms_mr_assemblybuild_ot_upd' ; schstatus.deploymentId=null;
  schstatus.params={ "custscript_wms_woid" : transactionInternalId, "custscriptwms_wotype" : 'workorder'
  , "custscript_wms_woresults" : splitOpenTaskResults, "custscript_wms_assemblybuildid" : results.assemblyRecId };
  schstatus.submit(); break; }else{ var assemblyBuildQty=Number(splitOpenTaskResults[index]['assemblyBuildQty']); var
  openTaskLineNo=splitOpenTaskResults[index]['openTaskLine']; var
  openTaskItem=splitOpenTaskResults[index]['openTaskItem']; var
  openTaskSerial=splitOpenTaskResults[index]['openTaskSerialArray']; var
  openTaskStatus=splitOpenTaskResults[index]['openTaskStatusArray']; var
  openTaskLot=splitOpenTaskResults[index]['openTaskLotArray']; var
  openTaskInvStatusObject=splitOpenTaskResults[index]['openTaskInvStatusObj']; var
  lotWiseQuantiy=splitOpenTaskResults[index]['lotWiseQuantity']; var
  openTaskList=getOpenTaskLineDetails(transactionInternalId, openTaskLineNo, openTaskItem,'',openTaskSerial,
  inventoryStatusFeature); log.debug('openTaskList',openTaskList); for(var openTaskItr=0; openTaskItr <
  openTaskList.length && assemblyBuildQty> 0; openTaskItr++ ){
  var assemblyBuildOpenTaskId = openTaskList[openTaskItr]['id']
  var transactionRec = record.load({ type : 'customrecord_wmsse_trn_opentask', id : assemblyBuildOpenTaskId});
  var recordActualQty = transactionRec.getValue({fieldId:'custrecord_wmsse_act_qty'});
  var recordActualSerail = transactionRec.getValue({fieldId:'custrecord_wmsse_serial_no'});
  var recordStatus = transactionRec.getValue({fieldId:'custrecord_wmsse_inventorystatus'});
  var recordkBatchNum = transactionRec.getValue({fieldId:'custrecord_wmsse_batch_num'});
  var recordActualSerialIds = transactionRec.getValue({fieldId:'custrecord_wmsse_multi_bins'});
  if(utility.isValueValid (openTaskStatus) && openTaskStatus.length > 0 &&
  utility.isValueValid(recordStatus) && inventoryStatusFeature ==true)
  {
  if(((openTaskStatus.indexOf(recordStatus) != -1) && (openTaskLot =='' || openTaskLot ==null || openTaskLot =='null'))
  ||
  ((openTaskStatus.indexOf(recordStatus) != -1) && (openTaskLot!='' && openTaskLot !=null &&
  openTaskLot.indexOf(recordkBatchNum) != -1)))
  {
  var openTaskInvStatusQuantity = openTaskInvStatusObject[recordStatus];
  if((parseFloat(assemblyBuildQty) < parseFloat(recordActualQty)) ||(parseFloat(openTaskInvStatusQuantity)<
    parseFloat(recordActualQty))) { var newSerialString='' ; var newSerialInternalId='' ;
    if(utility.isValueValid(recordActualSerail) && utility.isValueValid(openTaskSerial)){ var
    serialArray=recordActualSerail.split(','); var serialInternalIdArray='' ;
    if(utility.isValueValid(recordActualSerialIds)) { serialInternalIdArray=recordActualSerialIds.split(','); } for(var
    n in serialArray){ if(openTaskSerial.indexOf(serialArray[n])==-1){ if(newSerialString=='' ){
    newSerialString=serialArray[n]; if(serialInternalIdArray.length>0)
    {
    newSerialInternalId =serialInternalIdArray[n];
    }
    }else{
    newSerialString = newSerialString.concat(',', serialArray[n]);
    if(serialInternalIdArray.length>0)
    {
    newSerialInternalId =newSerialInternalId.concat(',', serialInternalIdArray[n]);
    }
    }
    }
    }
    }
    cloneOpenTaskRecord (assemblyBuildOpenTaskId,recordActualQty,openTaskInvStatusQuantity,transactionInternalId,
    newSerialString,recordActualSerialIds,newSerialInternalId);
    transactionRec.setValue({fieldId :'custrecord_wmsse_expe_qty', value:
    Number(parseFloat(assemblyBuildQty).toFixed(8))});
    transactionRec.setValue({fieldId :'custrecord_wmsse_act_qty', value:
    Number(parseFloat(assemblyBuildQty).toFixed(8))});
    }
    transactionRec.setValue({fieldId :'custrecord_wmsse_nsconfirm_ref_no', value: results.assemblyRecId});
    transactionRec.save();
    assemblyBuildQty = Big(assemblyBuildQty).minus(openTaskInvStatusQuantity);
    }
    }
    else
    {
    if((openTaskLot =='' || openTaskLot ==null || openTaskLot =='null') ||
    (openTaskLot!='' && openTaskLot !=null && openTaskLot.indexOf(recordkBatchNum) != -1))
    {
    var assemblyBuildWiseQuantity =recordActualQty;
    if(utility.isValueValid(openTaskLot) && openTaskLot.length>0)
    {
    assemblyBuildWiseQuantity = lotWiseQuantiy[recordkBatchNum];
    }

    if((parseFloat(assemblyBuildQty) < parseFloat(recordActualQty))||((parseFloat(assemblyBuildWiseQuantity)<
      parseFloat(recordActualQty)) && (openTaskLot.indexOf(recordkBatchNum) !=-1))) { if((parseFloat(assemblyBuildQty) <
      parseFloat(recordActualQty)) && (openTaskLot.indexOf(recordkBatchNum)==-1)) {
      assemblyBuildWiseQuantity=assemblyBuildQty; } var newSerialString='' ; var newSerialInternalId='' ;
      if(utility.isValueValid(recordActualSerail) && utility.isValueValid(openTaskSerial)){ var
      serialArray=recordActualSerail.split(','); var serialInternalIdArray='' ;
      if(utility.isValueValid(recordActualSerialIds)) { serialInternalIdArray=recordActualSerialIds.split(','); }
      for(var n in serialArray){ if(openTaskSerial.indexOf(serialArray[n])==-1){ if(newSerialString=='' ){
      newSerialString=serialArray[n]; if(serialInternalIdArray.length>0)
      {
      newSerialInternalId =serialInternalIdArray[n];
      }
      }else{
      newSerialString = newSerialString.concat(',', serialArray[n]);
      if(serialInternalIdArray.length>0)
      {
      newSerialInternalId =newSerialInternalId.concat(',', serialInternalIdArray[n]);
      }
      }
      }
      }
      }
      cloneOpenTaskRecord (assemblyBuildOpenTaskId,recordActualQty,assemblyBuildWiseQuantity,transactionInternalId,
      newSerialString,recordActualSerialIds,newSerialInternalId);
      transactionRec.setValue({fieldId :'custrecord_wmsse_expe_qty', value:
      Number(parseFloat(assemblyBuildWiseQuantity).toFixed(8))});
      transactionRec.setValue({fieldId :'custrecord_wmsse_act_qty', value:
      Number(parseFloat(assemblyBuildWiseQuantity).toFixed(8))});
      }
      transactionRec.setValue({fieldId :'custrecord_wmsse_nsconfirm_ref_no', value: results.assemblyRecId});
      transactionRec.save();
      assemblyBuildQty = Big(assemblyBuildQty).minus(assemblyBuildWiseQuantity);
      log.debug({title:'assemblyBuildQty1',details:assemblyBuildQty});
      }
      }
      }
      }
      }
      }
      function cloneOpenTaskRecord (assemblyBuildOpenTaskId,recordActualQty,assemblyBuildQty,transactionInternalId,
      newSerialString,recordActualSerialIds,newSerialInternalId)
      {
      var cloneOpenTaskRec = record.copy({
      type : 'customrecord_wmsse_trn_opentask',
      id : assemblyBuildOpenTaskId
      });
      var remainingQty = Number(Big(parseFloat(recordActualQty)).minus(parseFloat(assemblyBuildQty)).toFixed(8));
      cloneOpenTaskRec.setValue({fieldId :'custrecord_wmsse_expe_qty', value: remainingQty});
      cloneOpenTaskRec.setValue({fieldId :'custrecord_wmsse_act_qty', value: remainingQty});
      cloneOpenTaskRec.setValue({fieldId :'custrecord_wmsse_upd_user_no', value: runtime.getCurrentUser().id});
      cloneOpenTaskRec.setValue({fieldId :'custrecord_wmsse_serial_no', value: newSerialString});
      cloneOpenTaskRec.setValue({fieldId :'custrecord_wmsse_nsconfirm_ref_no', value: ''});
      cloneOpenTaskRec.setValue({fieldId :'name', value: transactionInternalId});
      if(utility.isValueValid(recordActualSerialIds))
      cloneOpenTaskRec.setValue({fieldId :'custrecord_wmsse_multi_bins', value: newSerialInternalId});
      var cloneOpenTaskRecId = cloneOpenTaskRec.save();
      }
      return{
      'post' : doPost
      };
      });