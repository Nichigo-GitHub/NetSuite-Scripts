/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/file', 'N/record', 'N/runtime', './wms_utility', '../Restlets/wms_translator', 'N/email', '../Restlets/big','N/format'],

    function (file, record, runtime, utility, translator, email, big,format) {


        function execute(context) {

            try {
                var start = new Date().getTime();
                log.debug({title: 'start time', details: start});
                var scriptObj = runtime.getCurrentScript();
                var whLocation = scriptObj.getParameter({name: 'custscript_wms_location_param'});
                var itemId = scriptObj.getParameter({name: 'custscript_wms_item_param'});
                var binId = scriptObj.getParameter({name: 'custscript_wms_binloc_param'});
                var invStatusId = scriptObj.getParameter({name: 'custscript_wms_invstatus_param'});
                var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
                log.debug({
                    title: 'getRemainingUsage at starting of the POST method in suitelet --',
                    details: scriptObj.getRemainingUsage()
                });

                var objInvQBDetails = {};
                objInvQBDetails.whLocation = whLocation;
                objInvQBDetails.itemId = itemId;
                objInvQBDetails.binId = binId;
                objInvQBDetails.invStatusId = invStatusId;
                var result = utility.getInvReportDetails(objInvQBDetails);

                var setNextFile = false;

              
                var strItemId = '';
                var strLocation = '';
                var strItemName = '';
                var strBin = '';
                var strBinId = '';
                var strQOH = '';
                var strAvailQty = '';

                var unitTypeIdArr = [];
                var uomstr;
                var stockUnitsTextArr = [];
                var inputMap = {};
                var offSet = 0;
                var batchIndex = 1000;
                var batchSize = 1000;
                var lastSetItr = 0;
                var currentUserId = runtime.getCurrentUser().id;
                var strItemDesc ='';
                var strstockUnits ='';

                if (result != null && result != "") {
                    //have to pass location from QB
                    var locUseBinsFlag = utility.lookupOnLocationForUseBins(whLocation);
                    var currInvBalanceLength = result.length;
                    var invBalanceLength = result.length;
                    var attachmentCounter = 0;
                    var lastbatchIndex = false;
                    for(var fileStartItr =0; fileStartItr <= invBalanceLength; fileStartItr++)
                    {
                        log.debug('fileStartItr',fileStartItr);
                        var strxml = "";
                        var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n<head></head><body  font-size=\"7\"  size=\"A4-landscape\"  padding-top=\" 0mm\"   footer='myfooter' footer-height='20mm'>\n";

                        var currentDate = utility.DateStamp();
                        currentDate = format.parse({
                			value: currentDate,
                			type: format.Type.DATE
                		});
                        currentDate = format.format({
                			value: currentDate,
                			type: format.Type.DATE
                		});
                        var currentTime = utility.getCurrentTimeStamp();
                        var isExportToExcelSuccessful = 'Y';
                        var sizeInBytes = 0;
                        var sizeInMB = 0;
                        setNextFile = false;
                        offSet = fileStartItr;


                    strxml += "<table width='100%'>";
                    strxml += "<tr><td><table width='100%' >";
                    strxml += "<tr><td valign='middle' align='left' colspan='2'><p align='center' style='font-size:xx-large;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_EXCELTITLE');
                    strxml += "</p></td></tr></table></td></tr>";
                    strxml += "<tr><td><table width='100%' >";
                    strxml += "<tr><td style='width:41px;font-size: 12px;'>";
                    strxml += "</td></tr>";
                    strxml += "</table>";
                    strxml += "</td></tr>";

                    strxml += "<tr><td><table width='100%' valign='top' >";
                    strxml += "<tr><td>";

                    strxml += "<table width='200%'>";
                    strxml += "<tr style=\"font-weight:bold;background-color:gray;color:white;\">";

                    strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_ITEM');
                    strxml += "</td>";

                    strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_ITEMDESC');
                    strxml += "</td>";

                    strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_LOCATION');
                    strxml += "</td>";

                    if (locUseBinsFlag != null && locUseBinsFlag != '' && locUseBinsFlag == true) {
                        strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                        strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_BINLOC');
                        strxml += "</td>";
                    }
                    strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_UNITS');
                    strxml += "</td>";

                    strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_QOH');
                    strxml += "</td>";

                    strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                    strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_AVLQTY');
                    strxml += "</td>";

                    if (inventoryStatusFeature == true) {
                        strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                        strxml += translator.getTranslationString('INVENTORYREPORT.FORM_SUBLIST_INVSTATUS');
                        strxml += "</td>";
                    }

                        var str = 'offSet log. = ' + offSet + '<br>';
                        str = str + 'batchSize log. = ' + batchSize + '<br>';
                        str = str + 'currInvBalanceLength log. = ' + currInvBalanceLength + '<br>';
                        str = str + 'originalResultLength log. = ' + invBalanceLength + '<br>';
                        str = str + 'batchIndex log. = ' + batchIndex + '<br>';
                        str = str + 'batchSize log. = ' + batchSize + '<br>';
                        str = str + 'lastbatchIndex log. = ' + lastbatchIndex + '<br>';

                        log.debug({
                            title: 'str',
                            details: str
                        });

                    for (var batchItr = 0; batchIndex < invBalanceLength || lastbatchIndex == true; batchItr++)
                    {
                        if (lastbatchIndex == true && currInvBalanceLength > 0) {
                                  batchSize = currInvBalanceLength;
                        }

                        var arrCount = offSet;
                        var itemIdArr = [];
                        var binIdArr = [];
                        var invStatusIdArr = [];
                        var itemIds = '';
                        var binIds = '';
                        var statusIds = '';
                        var stockUnits = '';
                        var stockUnitTexts = '';
                        var unitTypeIds = '';

                        for (var arryItr = 0; arryItr < batchSize; arryItr++) {

                            itemIds = result[arrCount].getValue({name: 'item', summary: 'group'});
                            binIds = result[arrCount].getValue({name: 'binnumber', summary: 'group'});
                            statusIds = result[arrCount].getValue({name: 'status', summary: 'group'});
                            stockUnits = result[arrCount].getValue({name: 'stockunit', join: 'item', summary: 'group'});
                            stockUnitTexts = result[arrCount].getText({
                                name: 'stockunit',
                                join: 'item',
                                summary: 'group'
                            });
                            unitTypeIds = result[arrCount].getValue({
                                name: 'unitstype',
                                join: 'item',
                                summary: 'group'
                            });


                            if (itemIdArr.indexOf(itemIds) == -1) {
                                itemIdArr.push(itemIds);

                            }
                            if (binIdArr.indexOf(binIds) == -1) {
                                binIdArr.push(binIds);

                            }
                            if (invStatusIdArr.indexOf(statusIds) == -1) {
                                invStatusIdArr.push(statusIds);
                            }

                            if (stockUnitTexts != null && stockUnitTexts != '') {
                                if (unitTypeIdArr.indexOf(unitTypeIds) == -1) {
                                    unitTypeIdArr.push(unitTypeIds);
                                }

                                if (stockUnitsTextArr.indexOf(stockUnitTexts) == -1) {
                                    stockUnitsTextArr.push(stockUnitTexts);
                                }


                                if (locUseBinsFlag != null && locUseBinsFlag != '' && locUseBinsFlag == true) {
                                    uomstr = unitTypeIds + '_' + stockUnitTexts;
                                    inputMap[itemIds + '_' + binIds + '_' + statusIds] = uomstr;
                                } else {
                                    uomstr = result[arrCount].unitstype + '_' + result[arrCount].stockunitText;
                                    inputMap[itemIds + '_' + statusIds] = uomstr;
                                }

                            }
                            arrCount++;
                        }

                        var strInvStatusId = '';
                        var strinvStatus = '';
                        var uomMap = {};
                        var uomFlag = unitTypeIdArr ? unitTypeIdArr.length > 0 : false;

                        if (uomFlag) {
                            uomMap = utility.getOpenTaskStockCoversionRate(unitTypeIdArr, stockUnitsTextArr);
                        }

                        //FETCHING FROM NQUERY

                        var binOpenPickQty = utility.getOpenTaskPickBinDetailsQuery(itemIdArr, binIdArr, objInvQBDetails.whLocation, inventoryStatusFeature,
                            invStatusIdArr, locUseBinsFlag, inputMap, uomMap, uomFlag);

                        isExportToExcelSuccessful = 'Y';
                        strxml += "</tr>";
                        var xmlbindItr = offSet;
                        var countItr = 0;
                        for (var invStatusItr = 0; invStatusItr < batchSize; invStatusItr++) {

                            strLocation = result[xmlbindItr].getText({name: 'location', summary: 'group'});
                            strItemId = result[xmlbindItr].getValue({name: 'item', summary: 'group'});
                            strItemName = result[xmlbindItr].getText({name: 'item', summary: 'group'});
                            strBinId = result[xmlbindItr].getValue({name: 'binnumber', summary: 'group'});
                            strBin = result[xmlbindItr].getText({name: 'binnumber', summary: 'group'});
                            strQOH = result[xmlbindItr].getValue({name: 'onhand', summary: 'sum'});
                            strAvailQty = result[xmlbindItr].getValue({name: 'available', summary: 'sum'});
                            strItemDesc = result[xmlbindItr].getValue({name: 'salesdescription',join: 'item', summary: 'group'});
                            strstockUnits = result[xmlbindItr].getText({name: 'stockunit', join: 'item', summary: 'group'});

                            if (!(utility.isValueValid(strstockUnits)))
                                strstockUnits = '- None -';

                            if (inventoryStatusFeature) {
                                strInvStatusId = result[xmlbindItr].getValue({name: 'status', summary: 'group'});
                                strinvStatus = result[xmlbindItr].getText({name: 'status', summary: 'group'});
                            }
                            var invBalanceStr = '';
                            if (inventoryStatusFeature) {
                                if (locUseBinsFlag == false) {
                                    invBalanceStr = strItemId + '_' + strInvStatusId;
                                } else {
                                    invBalanceStr = strItemId + '_' + strBinId + '_' + strInvStatusId;
                                }


                            } else {
                                if (locUseBinsFlag == false) {
                                    invBalanceStr = strItemId;
                                } else {
                                    invBalanceStr = strItemId + '_' + strBinId;
                                }


                            }
                            if (JSON.stringify(binOpenPickQty) !== '{}') {
                                var openPickQty = binOpenPickQty[invBalanceStr];
                                if (openPickQty == null || openPickQty == '' || openPickQty == 'null' || openPickQty == '- None -')
                                    openPickQty = 0;
                                if (utility.isValueValid(openPickQty)) {
                                    strAvailQty = Number(big(strAvailQty).minus(openPickQty));
                                }
                            }

                            if (strAvailQty < 0) {
                                strAvailQty = 0;
                            }

                            strxml += "<tr>";
                            strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                            strxml += strItemName;//
                            strxml += "</td>";
                            strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                            strxml += strItemDesc;
                            strxml += "</td>";
                            strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                            strxml += strLocation;//
                            strxml += "</td>";

                            if (locUseBinsFlag != null && locUseBinsFlag != '' && locUseBinsFlag == true) {
                                strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                                strxml += strBin;//
                                strxml += "</td>";
                            }
                            strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                            strxml += strstockUnits;
                            strxml += "</td>";
                            strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                            strxml += parseFloat(big(strQOH).toFixed(5));//
                            strxml += "</td>";
                            strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                            strxml += parseFloat(big(strAvailQty).toFixed(5));//
                            strxml += "</td>";
                            if (inventoryStatusFeature == true) {
                                strxml += "<td width='10%' align='center' style='border-width: 1px; border-color: #000000;font-size: 14px;'>";
                                strxml += strinvStatus;//
                                strxml += "</td>";
                            }
                            strxml += "</tr>";
                            sizeInBytes = strxml.length;
                            sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(5);

                            if (sizeInMB > 9.8) {

                                isExportToExcelSuccessful = 'E';
                                if(result.length > xmlbindItr)
                                 {
                                     fileStartItr = Number(big(xmlbindItr).minus(1));
                                     setNextFile = true;
                                 }
                                break;
                            }

                            xmlbindItr++;
                            countItr++;
                            lastSetItr = xmlbindItr;

                        }

                        if (parseInt(currInvBalanceLength) > 0)
                        {
                            if(lastbatchIndex)
                            {
                                currInvBalanceLength = Number(big(currInvBalanceLength).minus(countItr+1));
                            }
                            else
                            {
                                currInvBalanceLength = Number(big(currInvBalanceLength).minus(countItr));
                            }
                        }

                        if (parseInt(currInvBalanceLength) < 1000) {
                            if (parseInt(currInvBalanceLength) > 0) {
                                lastbatchIndex = true;
                            } else {
                                 lastbatchIndex = false;
                            }
                        }
                        if(setNextFile ||  parseInt(currInvBalanceLength) == 0)
                        {
                            log.debug('generate next set of excel file',setNextFile);
                            break;
                        }

                        batchIndex += 1000;//since last batch index is not set, records printed are only 15396 and next set is becoming 16000 as per ofset check how to print between records
                        offSet += 1000;


                    }//batch loop

                    strxml += "</table>";
                    strxml += "</td></tr>";
                    strxml += "</table>";
                    strxml += "</td></tr>";
                    strxml += "</table>";
                    strxml += "\n</body>\n</pdf>";
                    xml = xml + strxml;
                    var exportXML = strxml;
                    var requestSubmitted = currentDate + ' ' + currentTime;
                    var errorMessage = '';
                    if (result != null && result != '') {
                            attachmentCounter = attachmentCounter+1;
                           var attachmentName = result[0].getText({
                                name: 'location',
                                summary: 'group'
                            });

                        attachmentName = attachmentName +'_'+ attachmentCounter;

                        log.debug({
                            title: 'no.of times file created with attachmentName --',
                            details: attachmentName
                        });
                            var fileObj = file.create({
                                name: translator.getTranslationString('INVENTORYREPORT.FORM_EMAILEXCELREPORT') + attachmentName + '.xls',
                                fileType: file.Type.PLAINTEXT,
                                contents: exportXML
                            });

                        log.debug({
                            title: 'exportXML',
                            details: exportXML
                        });

                            log.debug({
                                title: 'getRemainingUsage after creating file in scheduler --',
                                details: scriptObj.getRemainingUsage()
                            });

                            try {
                                var emailObject = composeEmail(isExportToExcelSuccessful, requestSubmitted, errorMessage);
                                var emailSubject = emailObject.subject + '_'+attachmentCounter;
                                email.send({
                                    author: currentUserId,
                                    recipients: currentUserId,
                                    subject: emailSubject,
                                    body: emailObject.body,
                                    attachments: [fileObj]
                                });


                        log.debug({
                            title: 'getRemainingUsage after sending email in scheduler --',
                            details: scriptObj.getRemainingUsage()
                        });
                           } catch (error) {
                                log.error({
                                    title: 'Sending email is failed',
                                    details: error
                                });
                            }
                        waitingTime(10);

                    }
                    if(!setNextFile && parseInt(currInvBalanceLength) < 1000)
                    {
                       fileStartItr = Number(big(lastSetItr).plus(1));
                    }
                    if(parseInt(currInvBalanceLength) == 0)
                    {
                        log.debug('when currInvBalanceLength is zero break main loop','');
                        break;
                    }

                }
                }

                utility.updateScheduleScriptStatus('Inventory Report', currentUserId, 'Completed', '', '', '');
                var end = new Date().getTime();
                var time = end - start;

                log.debug({title: 'end time', details: time});

            } catch (e) {
                log.error({title: 'e', details: e});

            }
        }

        function composeEmail(isExportToExcelSuccessful, requestSubmitted, errorMessage) {
            var emailObject = {};
            emailObject.subject = getEmailSubject(isExportToExcelSuccessful, requestSubmitted, errorMessage);
            emailObject.body = getEmailBody(isExportToExcelSuccessful, requestSubmitted, errorMessage);
            return emailObject;
        }

        function getEmailSubject(isExportToExcelSuccessful) {
            if (isExportToExcelSuccessful == 'Y' || isExportToExcelSuccessful == 'E') {
                return "Export of Inventory Report Completed";
            } else {
                return "Export of Inventory Report Failed";
            }
        }

        function getEmailBody(isExportToExcelSuccessful, requestSubmitted, errorMessage) {
            var emailBody = '';
            var failBodyLine = '';
            var successBodyLine = '';
            if (isExportToExcelSuccessful == 'Y') {
                 successBodyLine = "Export to Excel has been successfully completed  " + '' + " with the following details:";
                emailBody += getIntroductoryParagraph(successBodyLine);
            } else if (isExportToExcelSuccessful == 'E') {
                 successBodyLine = "The following request to export the inventory report has been processed, however, only 10 MB of data can be included in the file: " + '' + " ";
                emailBody += getIntroductoryParagraph(successBodyLine);
            } else {
                 failBodyLine = "The following request to export the inventory report has failed:";
                emailBody += getIntroductoryParagraph(failBodyLine);
            }

            emailBody += getParagraphWithLinks(isExportToExcelSuccessful, requestSubmitted, errorMessage);
            return emailBody;
        }

        function getIntroductoryParagraph(paraContent) {
            return "<html><head></head><body><p>" + paraContent + "</p>";
        }

        function getParagraphWithLinks(isExportToExcelSuccessful, requestSubmitted, errorMessage) {
            if (isExportToExcelSuccessful == 'Y') {
                return "<p>" + "Request Submitted : " + requestSubmitted + "<br>"
                    + " "
                    + "<br>" + "You can view a copy of the report in the attached file.." + "</b></p></body></html>";
                +" "
                + "<br><br><b>***" + "PLEASE DO NOT RESPOND TO THIS MESSAGE" + "***</b></p></body></html>";
            } else if (isExportToExcelSuccessful == 'E') {
                return "<p>" + "Request Submitted : " + requestSubmitted + "<br>"
                    + " "
                    + "<br>" + "You can view this part of the report in the attached file. If you want to generate the report again, you can reduce the file size by adjusting the filters." + "</b></p></body></html>";
                +" "
                + "<br><br><b>***" + "PLEASE DO NOT RESPOND TO THIS MESSAGE" + "***</b></p></body></html>";
            } else {
                return "<p>" + "Request Submitted:" + requestSubmitted + "<br>" +
                    "Error message:" + errorMessage
                    + " "
                    + "<br><br><b>***" + "PLEASE DO NOT RESPOND TO THIS MESSAGE" + "***</b></p></body></html>";
            }
        }

        function waitingTime(waitTime){ //seconds
            try{
                var endTime = new Date().getTime() + waitTime * 1000;
                var now = null;
                do{
                    now = new Date().getTime(); //
                }while(now < endTime);
            }catch (e){
                log.debug('Error', 'Error in the execution time');
            }
        }

        return {
            execute: execute
        };

    });
