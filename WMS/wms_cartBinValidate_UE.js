/**
 *    Copyright � 2020, Oracle and/or its affiliates. All rights reserved.
 *//**/***************************************************************************
 * @NApiVersion 2.x
 * @NScriptType usereventscript
 * @NModuleScope Public
 */
define(
		['N/search','N/record' ,'N/config','./wms_translator','N/runtime'],

			function(search,record,config,translator,runtime) {

			function checkIsCartBinValid(context){
				var type = context.type;
				var scriptType = runtime.executionContext;
				
				log.debug({title:'scriptType',details:scriptType});
				if(scriptType != 'SCHEDULED'){
				var isCartBinValid = 'F';
        var isMFGpickingFlag = 'F';
				try
				{
					
					
					var newRec = context.newRecord;
					var isCartFld = newRec.getValue({fieldId:'custrecord_wms_iscart'});
          var isMFGpickingFld = newRec.getValue({fieldId:'custrecord_wms_mfg_picking'});
					log.debug({title:'newRec.type',details:newRec.type});
					log.debug({title:'isCartFld',details:isCartFld});
					if(isMFGpickingFld != undefined && isMFGpickingFld != true) {
					if(isCartFld == undefined || isCartFld == false || type == 'delete' || type == 'copy' ||
							type == 'DELETE' || type == 'COPY' ){
						return false;
						}
					}
					if(isCartFld != undefined && isCartFld != true) {
						if (isMFGpickingFld == undefined || isMFGpickingFld == false || type == 'delete' || type == 'copy' ||
							type == 'DELETE' || type == 'COPY') {
							return false;
						}
					}
                    var binType = newRec.getValue({fieldId:'type'});
					var binTypeArr = binType.split('');
					log.debug({title:'binType',details:binType});
					if(binTypeArr[0] == 'INBOUND_STAGING'){
						isCartBinValid = 'T';
					}
          if(binTypeArr[0] == 'WIP'){
            isMFGpickingFlag = 'T';
           }

					log.debug({title:'isCartBinValid',details:isCartBinValid});
				}
				catch(e){
					log.debug({title:'exception',details:e});	
				}
				if(isCartBinValid == 'F' && isCartFld == true){
					
					throw translator.getTranslationString('CARTPUTAWAY_CARTBINVALIDATE');
				}
        if (isMFGpickingFlag == 'F' && isMFGpickingFld == true)
          {
            throw translator.getTranslationString('WO_MFGPICKING_BINTYPEFLAG');
         }
			}
			}
			return {
				beforeSubmit : checkIsCartBinValid
			};
		});
