/**
 *    Copyright � 2023, Oracle and/or its affiliates. All rights reserved.
 */
/**
/***************************************************************************
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define([ 'N/url' , '../Restlets/wms_translator','N/currentRecord'],

		function( url,translator,currentRecord) {

			function fieldChanged(scriptContext) {
			 if(scriptContext.fieldId == 'custpage_pagination'){
					var myRecord = currentRecord.get();
					myRecord.setValue({
						fieldId: 'custpage_hiddenfield',
						value:'paginationChange',
						ignoreFieldChange: true
					});
					NLDoMainFormButtonAction("submitter", true);
				}
				else {
					var myRecord = currentRecord.get();
					myRecord.setValue({
						fieldId: 'custpage_hiddenfield',
						value:'',
						ignoreFieldChange: true
					});
					return false;
				}
			}
			function  resetForm(){

				var URLtoredirect = url.resolveScript({
					scriptId : 'customscript_wms_inboundreversal',
					deploymentId : 'customdeploy_wms_inboundreversal'
				});
				window.location.href = URLtoredirect;
			}
			function saveRecord(scriptContext){
				var currentRec = scriptContext.currentRecord;
				var lineCnt = currentRec.getLineCount({
					sublistId: 'custpage_items'
				});
				var hiddenFieldValue = currentRec.getValue({
					fieldId:'custpage_hiddenfield'
				});
				var count = 0;
                var NonSelectedKitCompntArr = [];
                var selectedKitComponentArr = [];
                var kitComponentObj = {};
				var parentItemArray = [];
				if(hiddenFieldValue != 'paginationChange') {
					for (var i = 0; i < lineCnt; i++) {
						var isSelected = currentRec.getSublistValue({
							sublistId: 'custpage_items',
							fieldId: 'custpage_select',
							line: i
						});
						var isPrevRowSelected = currentRec.getSublistValue({
							sublistId: 'custpage_items',
							fieldId: 'custpage_selectedtasksacrosspages',
							line: i
						});



                        var kigFlag=currentRec.getSublistValue({
                            sublistId: 'custpage_items',
                            fieldId: 'custpage_kitflag',
                            line: i
                        });
                        kitComponentObj = {};


                        var parentitem=currentRec.getSublistValue({
                            sublistId: 'custpage_items',
                            fieldId: 'custpage_parentitem',
                            line: i
                        });

						var itemId=currentRec.getSublistValue({
							sublistId: 'custpage_items',
							fieldId: 'custpage_itemintrid',
							line: i
						});

                        var nsrefno = currentRec.getSublistValue({
                            sublistId: 'custpage_items',
                            fieldId: 'custpage_nsrefno',
                            line: i
                        });

						var lineNo = currentRec.getSublistValue({
							sublistId: 'custpage_items',
							fieldId: 'custpage_lineno',
							line: i
						});

                        var validationMessage = '';

                        if(kigFlag === "true")
                        {
                        	//alert('isidekit');
                            kitComponentObj = {};
                            kitComponentObj['nsrefno'] = nsrefno;
                            kitComponentObj['parentitem'] = parentitem;
							kitComponentObj['itemId'] = itemId;
							kitComponentObj['lineNo'] = lineNo;


						//	alert(selectedKitComponentArr);
						//	alert(NonSelectedKitCompntArr);

                            if(isSelected)
                            {
							
                                validationMessage = validateLines(NonSelectedKitCompntArr , selectedKitComponentArr, kitComponentObj,parentItemArray);
                            }
                            else
                            {
							
                                validationMessage = validateLines(selectedKitComponentArr , NonSelectedKitCompntArr, kitComponentObj,parentItemArray);
                            }
                            if(validationMessage!=true)
                            {
                                alert(validationMessage);
                                return false;
                            }
                        }


						if (isSelected == true ||
							(isPrevRowSelected != '' && isPrevRowSelected != null && isPrevRowSelected != 'null' && isPrevRowSelected != undefined)) {
							count++;
							//break;
						}
					}

					if (lineCnt > 0 && count == 0) {
						alert(translator.getTranslationStringForClientScript('wms_InboundReversal.SELECT_AT_LEAST_ONE_LINE'));
						return false;
					} else {
						return true;
					}
				}
				else{
					return true;
				}
			}
            function validateLines(componentArr1, componentArr2, kitComponentObj,parentItemArray)
            {
			
                if(componentArr1.length > 0)
                {
                    for(var itr=0; itr<componentArr1.length; itr++)
                    {
                        if((componentArr1[itr]['parentitem'] == kitComponentObj['parentitem'])
							&&(componentArr1[itr]['itemId'] != kitComponentObj['itemId']) && parentItemArray.indexOf(kitComponentObj['itemId']) == -1)
                        {

                            var alertMessage = translator.getTranslationStringForClientScript('GUIPICKREVERSAL_SELECT_ALL_KIT_COMPONENTS')
							return alertMessage;

                        }
                        else
                        {
							parentItemArray.push(kitComponentObj['itemId']);
                            componentArr2.push(kitComponentObj);
                        }

                    }

                }
                else
                {
					parentItemArray.push(kitComponentObj['itemId']);
                    componentArr2.push(kitComponentObj);
					//alert(componentArr2);
                }
                return true;
            }



            return {
		fieldChanged : fieldChanged,
		resetForm:resetForm,
		saveRecord:saveRecord
	};

});
