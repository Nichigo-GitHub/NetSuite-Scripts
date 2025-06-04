/**
 *    Copyright � 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
 define([ 'N/search', 'N/url' , 'N/record' ,'../Restlets/wms_translator','N/currentRecord','./big'],

 	function(search, url ,record ,translator,currentRecord,Big) {
 		
 		var rec = currentRecord.get();
 		function backtogeneratesearch() {

 			var URLtoredirect = url.resolveScript({
 				scriptId : 'customscript_wms_gui_packing',
 				deploymentId : 'customdeploy_wms_gui_packing'
 			});
 			window.location.href = URLtoredirect;
 		}

 		function saveRecord(scriptContext) {
 			var currentRec = scriptContext.currentRecord;
 			var tempFlag="F";
 			var vCustmerArr = [];		
 			var strInvDtl='';
 			var vShipMethodArr = [];
 			var	objCustShipaddr  = {};
 			var shipAddressArr=[];
 			var vShipCarrierArr=[];
 			var orderInternalIdArr=[];

 			var cartonNo = currentRec.getValue({
 				fieldId : 'custpage_carton'
 			});
 			var cartonWeight = currentRec.getValue({
 				fieldId : 'custpage_cartonweight'
 			});	
 			var lineCnt = currentRec.getLineCount({
 				sublistId: 'custpage_packinglist'
 			});

 			for(var sublist=0;sublist< lineCnt;sublist++)
 			{  
 				var isSelected=currentRec.getSublistValue({
 					sublistId: 'custpage_packinglist',
 					fieldId: 'custpage_select',
 					line: sublist
 				});
 				var orderId= currentRec.getSublistValue({
 					sublistId: 'custpage_packinglist',
 					fieldId: 'custpage_orderinternalid',
 					line: sublist
 				}); 
 				var enteredQty= currentRec.getSublistValue({
 					sublistId: 'custpage_packinglist',
 					fieldId: 'custpage_actqty',
 					line: sublist
 				}); 
 				var actQty= currentRec.getSublistValue({
 					sublistId: 'custpage_packinglist',
 					fieldId: 'custpage_actqtyhddn',
 					line: sublist
 				}); 

 				var customer=  currentRec.getSublistValue({
 					sublistId: 'custpage_packinglist',
 					fieldId: 'custpage_entity',
 					line: sublist
 				});  

 				if( isSelected )
 				{ 	
 					tempFlag="T";
 					var itemfulfillId=  currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_itemfulfillid',
 						line: sublist
 					});  

 					var itemfulfillNum=  currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_fulfillnumber',
 						line: sublist
 					}); 

 					var itemName =  currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_sku',
 						line: sublist
 					}); 
 					var shipmethod =	currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_shipmethodid',
 						line: sublist
 					});
 					var shipAddress= currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_shipaddress',
 						line: sublist
 					});
 					var shipCarrier= currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_shipcarrier',
 						line: sublist
 					});
 					var itemType = currentRec.getSublistValue({
 						sublistId: 'custpage_packinglist',
 						fieldId: 'custpage_itemtype',
 						line: sublist
 					}); 

 					if( shipAddressArr.indexOf(shipAddress)==-1)
 					{
 						shipAddressArr.push(shipAddress);
 						if(objCustShipaddr[customer] != null && objCustShipaddr[customer] != 'null' && objCustShipaddr[customer] != '' && objCustShipaddr[customer] != undefined  )
 							objCustShipaddr[customer]  = 	objCustShipaddr[customer]  + '~' + shipAddress;
 						else
 							objCustShipaddr[customer]  = shipAddress;
 					}
 					if( (shipmethod != null && shipmethod != 'null' && shipmethod != '' && shipmethod != undefined) && vShipMethodArr.indexOf(shipmethod)==-1)
 					{
 						vShipMethodArr.push(shipmethod);
 					}
 					if( (shipCarrier != null && shipCarrier != 'null' && shipCarrier != '' && shipCarrier != undefined) && vShipCarrierArr.indexOf(shipCarrier)==-1)
 					{
 						vShipCarrierArr.push(shipCarrier);
 					}
 					if( vCustmerArr.indexOf(customer)==-1)
 					{
 						vCustmerArr.push(customer);
 					}
 					if( orderInternalIdArr.indexOf(orderId)==-1)
 					{
 						orderInternalIdArr.push(orderId);
 					}
 					if(isNaN(enteredQty) || parseFloat(enteredQty)<=0)
 					{
 						alert(translator.getTranslationStringForClientScript('GUIPACKING.INVALIDQTY'));
 						currentRec.setCurrentSublistValue({
 							sublistId: 'custpage_packinglist',
 							fieldId: 'custpage_actqty',
 							value:actQty
 						});
 						return false;
 					}
 					if(parseFloat(enteredQty) > parseFloat(actQty))
 					{
 						alert(translator.getTranslationStringForClientScript('GUIPACKING.UNPACKEDQTY'));
 						currentRec.setCurrentSublistValue({
 							sublistId: 'custpage_packinglist',
 							fieldId: 'custpage_actqty',
 							value:actQty
 						}); 
 						return false;
 					}

 					if((parseFloat(enteredQty) != parseFloat(actQty)) &&  itemType != 'NonInvtPart' && itemType != 'Service')
 					{
 						var invDetail =  document.getElementsByName('custpage_inventorydetailhdn'+ (parseFloat(sublist)+1))[0].value;
 						if(strInvDtl == null || strInvDtl == 'null' || strInvDtl == '' || strInvDtl == undefined)
 							strInvDtl= invDetail;
 						else 
 							strInvDtl= strInvDtl + '$' + invDetail;

 						if(invDetail == null || invDetail == 'null' || invDetail == '' || invDetail == undefined || invDetail =='None' ||  invDetail == 'undefined'){
 							alert(translator.getTranslationStringForClientScript('GUIPACKING.INVDTLSET') + ' '+itemfulfillNum+' , ' +itemName);
 							return false;
 						}
 					}
 				}
 			}
 			currentRec.setValue({
 				fieldId : 'custpage_invdtlhdn',
 				value:strInvDtl
 			});	

 			if(tempFlag=="F")
 			{
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.ATLEASTONE'));
 				return false;
 			}

 			if(vCustmerArr.length > 1)
 			{
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.ONECUSTOMER'));
 				return false;
 			}
 			else if(vCustmerArr.length <= 1  )
 			{ 
 				var arrShipAddr = objCustShipaddr[vCustmerArr[0]].split('~');

 				if(arrShipAddr.length > 1){
 					alert(translator.getTranslationStringForClientScript('GUIPACKING.DIFFSHIPADDR'));
 					return false;
 				}
 			}
 			if(vShipCarrierArr.length > 1 ){
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.DIFFSHIPMETHOD'));
 				return false;
 			} 

 			if(vShipMethodArr.length > 1 ){
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.DIFFSHIPMETHOD'));
 				return false;
 			} 

 			if(cartonNo !=null && cartonNo !='' && cartonNo !=null && cartonNo !='')
 			{
 				var newcartonNo = cartonNo.replace(/[';:!%&#@,<>]/g, "");

 				if(newcartonNo.length != cartonNo.length)
 				{
 					alert(translator.getTranslationStringForClientScript('GUIPACKING.CARTON_SPCLCHAR'));
 					return false;
 				}
 			}

 			if(isNaN(cartonWeight)==true)
 			{

 				alert(translator.getTranslationStringForClientScript('GUIPACKING.CARTON_NUMERIC'));
 				return false;
 			}

 			if(parseFloat(cartonWeight)<0)
 			{
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.CARTON_NEGETIVE'));
 				return false;
 			}
 			if(parseFloat(cartonWeight) == 0)
 			{
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.CARTON_MOREZERO'));
 				return false;
 			}
 			var maxvalue =  Math.pow(2,64);

 			if(parseFloat(cartonWeight) > parseFloat(maxvalue))
 			{
 				alert(translator.getTranslationStringForClientScript('GUIPACKING.CARTON_WEIGHT')  + cartonWeight);
 				return false;
 			}

 			return true;
 		}


 		function PrintPacklist()
 		{
 			
 			var containerlp = rec.getValue('custpage_contlp');
 			var soid = rec.getValue('custpage_orderno');
 			var Locationid = rec.getValue('custpage_whlocation');
 			var itemfulfillmentid=rec.getValue('custpage_fulfillnumber');
 			var tranType=rec.getValue('custpage_trantype');
 			var PackslipPDFURL;
 			
 			var systemrulevalue = '';		
 			var customPacklistrule = getSystemRuleValueforpacklist('Use custom packing lists?',Locationid);
 			
 			
 			var customScriptID ='';
 			var customDeployID = '';
 			if(isValueValid(customPacklistrule))
 			{
 				
 				systemrulevalue = customPacklistrule[0].getValue({name: 'custrecord_wmsserulevalue'});	
 				
 				customScriptID = customPacklistrule[0].getValue({name: 'custrecord_wmsse_scriptid'});
 				
 				customDeployID = customPacklistrule[0].getValue({name: 'custrecord_wmsse_deployid'});
 				
 				
 			}
 			if(systemrulevalue == 'Y')
 			{
 				
 				
 				if(isValueValid(customScriptID))
 				{
 					
 					if(isValueValid(customDeployID))
 					{
 						
 						PackslipPDFURL = url.resolveScript({
 							scriptId : customScriptID,
 							deploymentId : customDeployID,
 							params : {'custparam_wmsse_Locationid':Locationid,'custparam_wmsse_soid':soid,'custparam_wmsse_containerlp':containerlp,'custparam_trantype':tranType}
 						});
 						
 						
 					}	
 					else{
 						
 						
 						if(isValueValid(itemfulfillmentid))
 						{
 							

 							PackslipPDFURL=customScriptID.replace(/itemfulfillmentid/g,itemfulfillmentid);
 						}
 						else
 						{
 							alert(translator.getTranslationStringForClientScript('GUIPACKING.IFPOSTING'));							
 							return false;
 						}

					//PackslipPDFURL = "/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&id="+itemfulfillmentid+"&label=Packing%20Slip&printtype=packingslip&trantype=itemship&orgtrantype=SalesOrd&auxtrans="+itemfulfillmentid+"";
				}
			}
			else
			{
				alert(translator.getTranslationStringForClientScript('GUIPACKING.CUSTOM_SCRIPT'));								
				return false;
			}
		}
		else
		{
			
			PackslipPDFURL = url.resolveScript({
				scriptId : 'customscript_wms_printpacklist',
				deploymentId : 'customdeploy_wms_printpacklist_di',
				params : {'custparam_wmsse_Locationid':Locationid,'custparam_wmsse_soid':soid,'custparam_wmsse_containerlp':containerlp,'custparam_trantype':tranType}
			});
		}
		
		var printWindow=window.open(PackslipPDFURL);
		printWindow.focus();
		printWindow.print();

	}

	function fieldChanged(scriptContext) {
		var currentRecord = scriptContext.currentRecord;
		var sublistName = scriptContext.sublistId;
		var sublistFieldName = scriptContext.fieldId;
		var location = currentRecord.getValue({
			fieldId : 'custpage_whlocation'
		});
		
		var lineNo = scriptContext.line;
		var invInternalId='';
		var invQty='';

		if (sublistName === 'custpage_packinglist' && sublistFieldName === 'custpage_actqty')
		{
			var quantity = currentRecord.getSublistValue({
				sublistId: 'custpage_packinglist',
				fieldId: 'custpage_actqty',
				line: lineNo
			}); 
			var actQty=  currentRecord.getSublistValue({
				sublistId: 'custpage_packinglist',
				fieldId: 'custpage_actqtyhddn',
				line: lineNo
			});  
			var itemType = currentRecord.getSublistValue({
				sublistId: 'custpage_packinglist',
				fieldId: 'custpage_itemtype',
				line: lineNo
			});
			if(quantity != null && quantity != '')
			{
				var qtyValidate = quantity.split('.');
				if(qtyValidate.length > 1)
				{
					if(parseInt(qtyValidate[1].length) > 5)
					{
						alert(translator.getTranslationStringForClientScript('GUIPACKING.QTYDECIMALVALID'));
						currentRecord.setCurrentSublistValue({
							sublistId: 'custpage_packinglist',
							fieldId: 'custpage_actqty',
							value:actQty
						});  
						return false;
					}
				}
			}else{
				alert(translator.getTranslationStringForClientScript('GUIPACKING.INVALIDQTY'));
				currentRecord.setCurrentSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_actqty',
					value:actQty
				});
				return false;
			}

			//partial packing is not allowed for Non Inventory Items
			if(itemType == 'NonInvtPart' || itemType == 'Service'){
				if(parseFloat(quantity) != parseFloat(actQty)){
					if(itemType == 'Service')
					{
						alert(translator.getTranslationStringForClientScript('GUIPACKING.NOPARTIALPACKSERVICE'));
					}
					else {
						alert(translator.getTranslationStringForClientScript('GUIPACKING.NOPARTIALPACK'));
					}
					currentRecord.setCurrentSublistValue({
						sublistId: 'custpage_packinglist',
						fieldId: 'custpage_actqty',
						value:actQty
					});
					return false;
				}else{
					return true;
				}
			}

			if(parseFloat(quantity ) < parseFloat(actQty))	{
				var sublistLineNo=  currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_listlineno',
					line: lineNo
				}); 
				var itemfulfillId=  currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_itemfulfillid',
					line: lineNo
				});  
				var iteminternalid=  currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_skuinternalid',
					line: lineNo
				}); 
				var sublineNo=  currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_lineno',
					line: lineNo
				}); 

				var invDtlCount=  currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_invdtlcount',
					line: lineNo
				}); 

				var convRate=  currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_conversionrate',
					line: lineNo
				}); 

				var pickCartonRowWise = currentRecord.getSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_pickcartonrowwise',
					line: lineNo
				});

				
				if(invDtlCount > 1){

					var inputparams= {
						'custpage_itemfulfillid' :itemfulfillId,
						'custpage_skuinternalid' : iteminternalid,
						'custpage_lineno' : sublineNo,
						'custpage_sublistline' : sublistLineNo,
						'custpage_qtyentered' : quantity,
						'custpage_pickcartonNo' : pickCartonRowWise,
						'custpage_convRate' : convRate,
						'custpage_location' : location
					};

					var outputurl = url.resolveScript({
						scriptId: 'customscript_wms_packing_inv_detail',
						deploymentId: 'customdeploy_wms_packing_inv_detail',
						params : inputparams
					});		

					window.open(outputurl, "Inventory Detail"+lineNo, "width=800,height=600");

				}else
				{ 

					var invDtlLinesSearch = search.load({
						id:'customsearch_wms_get_inv_detail_packing'
					});

					invDtlLinesSearch.filters.push(
						search.createFilter({
							name:'internalid',
							join:'transaction',
							operator:search.Operator.ANYOF,
							values: itemfulfillId
						})
						);
					invDtlLinesSearch.filters.push(
						search.createFilter({
							name:'item',
							operator:search.Operator.ANYOF,
							values:iteminternalid
						})
						);
					invDtlLinesSearch.filters.push(
						search.createFilter({
							name:'line',
							join:'transaction',
							operator:search.Operator.EQUALTO,
							values: sublineNo
						})
						);
					if (pickCartonRowWise != '' && pickCartonRowWise != '- None -')
						invDtlLinesSearch.filters.push(
							search.createFilter({
								name:'pickcarton',
								operator:search.Operator.IS,
								values:pickCartonRowWise
							})
							);

					invDtlLinesSearch.run().each(function(result) {

						invQty = result.getValue({
							name: 'quantity'
						});
						invInternalId = result.getValue({
							join : 'inventoryDetailLines',
							name: 'internalid'
						});
						return true;
					}); 

					if( convRate != null && convRate != 'null' && convRate != '' && convRate != undefined && convRate != '- None -') {
						itemType = getItemType(iteminternalid);
						if(itemType != "serializedinventoryitem" && itemType !="serializedassemblyitem"){
							invQty =  Number(Big(invQty).div(convRate))   ;
						}
					}
					var line=parseInt(lineNo)+1;
					document.getElementsByName('custpage_inventorydetailhdn'+line)[0].value= invInternalId + ',' + quantity	+ ',' + invQty;
				}

			}else if (parseFloat(quantity) > parseFloat(actQty)) {
				alert(translator.getTranslationStringForClientScript('GUIPACKING.INVALIDPACKQTY'));
				currentRecord.setCurrentSublistValue({
					sublistId: 'custpage_packinglist',
					fieldId: 'custpage_actqty',
					value:actQty
				});  
				return false;
			}



		}

	}




	function getSystemRuleValueforpacklist(RuleId, loc) {
		
		var searchresults;
		try {

			
			var searchRec = search.load({
				id: 'customsearch_wmsse_sys_rules'
			});
			var filters = searchRec.filters;
			filters.push(search.createFilter({
				name: 'name',
				operator: search.Operator.IS,
				values: RuleId.toString()
			}), search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: false
			}));

			// starts
			if (loc != null && loc != '') {
				filters.push(search.createFilter({
					name: 'custrecord_wmssesite',
					operator: search.Operator.ANYOF,
					values: ['@NONE@', loc]
				}));
			}
			searchRec.filters = filters;
			searchresults = searchRec.run().getRange({
				start: 0, end: 1
			});
			

		}
		catch (exp) {
			log.error('expception', exp);
			return searchresults;
		}
		return searchresults;
	}
	function getItemType(itemNo) {
		var itemType = "";

		var searchRec = search.load({
			id: 'customsearch_wmsse_itemtype_srh'
		});
		var savedFilter = searchRec.filters;
		savedFilter.push(search.createFilter({
			name: 'internalid',
			operator: search.Operator.ANYOF,
			values: itemNo
		}));
		searchRec.filters = savedFilter;
		var searchres = searchRec.run().getRange({
			start: 0, end: 1
		});
		if (searchres.length>0) {
			itemType = searchres[0].recordType;
		}
		return itemType;
	}
	
	function isValueValid(val)
	{
		var isNotNull = false;
		if( typeof(val) == 'boolean')
		{
			val = val.toString();
		}
		if (val != null && val != '' && val != 'null' && val != undefined && val != 'undefined')
		{
			isNotNull = true;
		}

		return isNotNull;
	}

	return {
		backtogeneratesearch : backtogeneratesearch,
		saveRecord:saveRecord,
		fieldChanged:fieldChanged,
		PrintPacklist:PrintPacklist
	};

});
