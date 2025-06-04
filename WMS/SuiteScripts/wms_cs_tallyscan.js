/**
 *    Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
 (function(){

 	var myFunctions = {};

 	myFunctions.tallyscan = function () {

		var statedata = mobile.getRecordFromState();
		var isTallyScanRequired = statedata.scriptParams.isTallyScanRequired;
		if(isTallyScanRequired){
			var qtyToBePopulated = statedata.scriptParams.uomTobePopulated;
			var barCodeQuantity = statedata.scriptParams.barcodeQuantity;
			if(qtyToBePopulated!= undefined){
				var cyccPageElement = mobile.getValueFromPage('cyclecount_enterQty_tallyScan_uom');
				var cyccNobinPageElement = mobile.getValueFromPage('cyclecount_enterQty_nobins_tallyScan_uom');
				var cyccFrombtnclickPageElement = mobile.getValueFromPage('cyclecount_enterQty_nobins_tallyScan_uom_fromLinkBtnClick');
				if(cyccNobinPageElement != undefined && barCodeQuantity!=undefined){
					
					if(barCodeQuantity[0].unit !== undefined && barCodeQuantity[0].unit !== null){
						mobile.setValueInPage('cyclecount_enterQty_nobins_tallyScan_uom',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('cyclecount_enterQty_nobins_tallyScan_uom',[{value: barCodeQuantity[0].value}]);
					}
				}else if(cyccFrombtnclickPageElement != undefined && barCodeQuantity!=undefined){
					
					if(barCodeQuantity[0].unit !== undefined && barCodeQuantity[0].unit !== null){
						mobile.setValueInPage('cyclecount_enterQty_nobins_tallyScan_uom_fromLinkBtnClick',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('cyclecount_enterQty_nobins_tallyScan_uom_fromLinkBtnClick',[{value: barCodeQuantity[0].value}]);
					}
				}else if(cyccPageElement != undefined && barCodeQuantity!=undefined){
					
					if(barCodeQuantity[0].unit !== undefined && barCodeQuantity[0].unit !== null){
						mobile.setValueInPage('cyclecount_enterQty_tallyScan_uom',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('cyclecount_enterQty_tallyScan_uom',[{value: barCodeQuantity[0].value}]);
					}
				}else{
					if(qtyToBePopulated[0].unit !== null && qtyToBePopulated[0].unit !== undefined){
					mobile.setValueInPage('multiOrderPicking_LotScan_uom',[{value: qtyToBePopulated[0].value,unit: qtyToBePopulated[0].unit}]);
				}else{
					mobile.setValueInPage('multiOrderPicking_LotScan_uom',[{value: qtyToBePopulated[0].value}]);
				}
				}
			}
			else if(barCodeQuantity!=undefined){
				var loadPageName = mobile.getValueFromPage('cartPutaway_quantityScan_textbox');
				var unloadPageName = mobile.getValueFromPage('cartPutaway_cartItemQuantityScan_textbox');
				var woLoadPageName = mobile.getValueFromPage('enterQuantity_enterQuantityTextBox');
				var sopSoLoadPageName = mobile.getValueFromPage('singleorerPicking_quantityScan_txtQuantity');
				var sopToLoadPageName = mobile.getValueFromPage('singleOrder_TransferOrderPicking_quantityScan_txtQuantity');
				var poPageElement = mobile.getValueFromPage('poReceiving_quantityScan_enterQtyUOM');
				var TOPageElement = mobile.getValueFromPage('toReceiving_enterquantity__enterQtyUOM');
				var rmaPageElement = mobile.getValueFromPage('returns_quantityScanRMA_enterQtyUOM');


				if(loadPageName!=undefined){
					if(barCodeQuantity[0].unit !== null && barCodeQuantity[0].unit !== undefined){
						mobile.setValueInPage('cartPutaway_quantityScan_textbox',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('cartPutaway_quantityScan_textbox',[{value: barCodeQuantity[0].value}]);
					}
				}
				else if(unloadPageName!=undefined){
					if(barCodeQuantity[0].unit !== null && barCodeQuantity[0].unit !== undefined){
						mobile.setValueInPage('cartPutaway_cartItemQuantityScan_textbox',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('cartPutaway_cartItemQuantityScan_textbox',[{value: barCodeQuantity[0].value}]);
					}
				}
				else if(woLoadPageName!=undefined){
					if(barCodeQuantity[0].unit !== null && barCodeQuantity[0].unit !== undefined){
						mobile.setValueInPage('enterQuantity_enterQuantityTextBox',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('enterQuantity_enterQuantityTextBox',[{value: barCodeQuantity[0].value}]);
					}
				}
				else if(sopSoLoadPageName!=undefined){
					if(barCodeQuantity[0].unit !== null && barCodeQuantity[0].unit !== undefined){
						mobile.setValueInPage('singleorerPicking_quantityScan_txtQuantity',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('singleorerPicking_quantityScan_txtQuantity',[{value: barCodeQuantity[0].value}]);
					}
				}
				else if(sopToLoadPageName!=undefined){
					if(barCodeQuantity[0].unit !== null && barCodeQuantity[0].unit !== undefined){
						mobile.setValueInPage('singleOrder_TransferOrderPicking_quantityScan_txtQuantity',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('singleOrder_TransferOrderPicking_quantityScan_txtQuantity',[{value: barCodeQuantity[0].value}]);
					}
				}
				else if(poPageElement != undefined){
					
					if(barCodeQuantity[0].unit !== undefined && barCodeQuantity[0].unit !== null){
						mobile.setValueInPage('poReceiving_quantityScan_enterQtyUOM',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('poReceiving_quantityScan_enterQtyUOM',[{value: barCodeQuantity[0].value}]);
					}
				}
	            else if(TOPageElement != undefined){
					
					if(barCodeQuantity[0].unit !== undefined && barCodeQuantity[0].unit !== null){
						mobile.setValueInPage('toReceiving_enterquantity__enterQtyUOM',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('toReceiving_enterquantity__enterQtyUOM',[{value: barCodeQuantity[0].value}]);
					}
				}
				else if(rmaPageElement != undefined){

					if(barCodeQuantity[0].unit !== undefined && barCodeQuantity[0].unit !== null){
						mobile.setValueInPage('returns_quantityScanRMA_enterQtyUOM',[{value: barCodeQuantity[0].value,unit: barCodeQuantity[0].unit}]);
					}else{
						mobile.setValueInPage('returns_quantityScanRMA_enterQtyUOM',[{value: barCodeQuantity[0].value}]);
					}
				}
			
		}
	}
        else {
            var itemType = statedata.scriptParams.itemType;
			var gs1enabled = statedata.scriptParams.gs1enabled;
			if((itemType == 'lotnumberedinventoryitem' || itemType == 'lotnumberedassemblyitem') && gs1enabled === true) {
				var globalTitle = document.getElementsByClassName("global__title").length;
                for(var itr =0 ; itr<globalTitle; itr++){
                    if(document.getElementsByClassName("global__title")[itr].innerText === 'SCAN/ENTER LOT') {
                        document.getElementsByClassName("global__title")[itr].nextSibling.nextSibling.children[0].focus();
                        break;
                    }
                }
            }
        }

 		var supressUOMPlusIcon = function(){

 			var pageelementTitle="ENTER QUANTITY"				 
 			var selectPath='select[parent::div[parent::div[preceding-sibling::div[contains(text(),"'+pageelementTitle+'")]]]]';
 			var iterate = document.evaluate('//'+selectPath, document, null,XPathResult.ANY_TYPE, null);
 			var select=iterate.iterateNext();
 			var uomButton = document.evaluate('//button[contains(@class,"uombutton")][preceding-sibling::'+ selectPath +']', document, null, XPathResult.ANY_TYPE, null);
 			uomButton=uomButton.iterateNext();
 			uomButton.style.display='none';
 			select.addEventListener('change',function(event){
 				uomButton.style.display='none';
 				setTimeout(supressUOMPlusIcon);
 			});
			var randomTallyScan = statedata.scriptParams.randomTallyScan;
			if(randomTallyScan   == 'T'){
				select.style.display='none';
			}

		};

              
 			var tallyUOM=false;
 			var globalTitle = document.getElementsByClassName("global__title").length;
 			for(var itr =0 ; itr<globalTitle; itr++){

 				if(document.getElementsByClassName("global__title")[itr].innerText === 'TALLY SCAN ITEM' || 
 					document.getElementsByClassName("global__title")[itr].innerText === 'TALLY SCAN SERIAL' ||
 					document.getElementsByClassName("global__title")[itr].innerText === 'TALLY SCAN LOT#/ITEM' || 
 					document.getElementsByClassName("global__title")[itr].innerText === 'TALLY SCAN LOT#'
 						
 				) {
 					tallyUOM=true;
 				document.getElementsByClassName("global__title")[itr].nextSibling.nextSibling.children[0].focus();
 			}
          }
 		if(tallyUOM==true)
 		{
 			supressUOMPlusIcon();
 		}


 	};

 	return myFunctions;

 } ());