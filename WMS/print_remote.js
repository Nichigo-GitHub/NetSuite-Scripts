/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *//**
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 *
 */
define(['N/record','N/url', 'N/runtime', 'N/file', 'N/https', './rule_engine_utils', './rule_engine_const', './rule_engine_dal','../Translation/mobile_translation_library'],
    /**
     * Encapsulates all remote invocations to PrintNode APIs
     * @param record NS record
     * @param url NS url
     * @param runtime NS runtime
     * @param file NS file
     * @param https NS https
     * @param utils Print Utils module
     * @param consts Print Constants module
     * @param dal Print data access layer
     * @returns {{print: print, queryStatus: queryStatus, getStatusMapping: (function(*): *)}}
     */
    function (record, url, runtime, file, https, utils, consts, dal, mobileTranslationLibrary) {

        const DEFAULT_PRINT_URL = "https://api.printnode.com/printjobs";
        const DEFAULT_EXPIRY_SEC = 30;
        const UNAUTH_CODE = 401;
        var STATUS_MAPPINGS;
        const DEFAULT_MODE = consts.PRINT_MODE.PULL;


        /**
         * Prints the file and starts tracking Audit information. Returns job Id of the printNode job.
         * Can throw an exception if PrintNode returns an error during submission phase.
         * No exception still doesn't guarantee successful print, just that Print job was accepted by PrintNode.
         * @param printer Printer to use for Printing
         * @param filePath FilePath of the Print file
         * @param noOfCopies No Of Copies to Print. Should be an Integer
         * @param isRaw Whether the file is raw (ZPL/EPL) or PDF
         * @param options Other metadata options(color, duplex etc.). Not in use right now
         * @returns id of the saved audit record to track progress
         */
        function print(printer, filePath, noOfCopies, isRaw, description, options) {
            checkParams(printer, filePath, noOfCopies);

            const fileObj = file.load({
                id: filePath
            });
            const isPullModel = (dal.getConfig(consts.CONFIG_KEYS.PRINT_MODE, DEFAULT_MODE) === consts.PRINT_MODE.PULL);
            isRaw = (isRaw === 'F') ? false : ((isRaw === 'T') ? true : isRaw) // While reprinting value ios passed as string from suitelet
            if(!isRaw && (isRaw !== false)){
                //fallback plan to determine filetype
                isRaw = isRawFile(filePath);
            }
            const iNoOfCopies = parseInt(noOfCopies);
            const response = (isPullModel?_urlPrint(printer, filePath, iNoOfCopies,isRaw, options):_sendRequest(fileObj, printer, filePath, iNoOfCopies, isRaw, options));
            const jobId = analyzePrintResponse(response);
            log.debug("Created jobId : " + JSON.stringify(jobId) + " for file path : " + filePath);
            return dal.insertAuditRecord(jobId, filePath, fileObj.id, printer, noOfCopies, isRaw, description);
        }

        /**
         * throws error if any one of the parameter is not present
         * @param printer
         * @param filePath
         * @param noOfCopies
         */
        function checkParams(printer, filePath, noOfCopies){
            utils.checkAndTranslatedThrow(printer, {
                translationKey: consts.TRANSLATION_KEYS.REQUIRED_FIELD_MISSING,
                logMessage: "One of the required field is missing."
            },null,null,["printer"]);
            utils.checkAndTranslatedThrow(filePath, {
                translationKey: consts.TRANSLATION_KEYS.REQUIRED_FIELD_MISSING,
                logMessage: "One of the required field is missing."
            },null,null,["filePath"]);
            utils.checkAndTranslatedThrow(noOfCopies, {
                translationKey: consts.TRANSLATION_KEYS.REQUIRED_FIELD_MISSING,
                logMessage: "One of the required field is missing."
            },null,null,["noOfCopies"]);
        }

        /**
         * Url printing function
         * @param printer Printer to use for Printing
         * @param filePath FilePath of the Print file
         * @param noOfCopies No Of Copies to Print. Should be an Integer
         * @param isRaw Whether the file is raw (ZPL/EPL) or PDF
         * @param options Other metadata options(color, duplex etc.). Not in use right now
         * @returns id of the saved audit record to track progress
         * @private
         */
        function _urlPrint(printer, filePath, noOfCopies, isRaw, options){
            const sSuiteletUrl = url.resolveScript({
                scriptId: consts.SCRIPT_DEPLOYMENTS.SUITELET_FILESERVER.scriptId,
                deploymentId: consts.SCRIPT_DEPLOYMENTS.SUITELET_FILESERVER.deploymentId,
                returnExternalUrl: true
            });
            const accessKey= utils.randomUuid();
            const accessRecord = record.create({type:consts.ID.RECORD_FILEMAP});
            accessRecord.setValue({fieldId:consts.ID.FILEMAP_ACCESSKEY, value:accessKey});
            accessRecord.setValue({fieldId:consts.ID.FILEMAP_FILEPATH, value:filePath});
            accessRecord.setValue({fieldId:consts.ID.FILEMAP_TIMESTAMP, value:new Date().getTime()});
            accessRecord.save();
            return _sendUrlPrint(printer,filePath,sSuiteletUrl,accessKey,noOfCopies,isRaw,options);
        }

        /**
         * URL Printing API invocation to PrintNode
         * @param printer Printer to use for Printing
         * @param filePath FilePath of the Print file
         * @param fileServerUrl Url to print
         * @param basicAuthPasscode Authpass code for accessing file
         * @param iNoOfCopies No of Copies
         * @param isRaw Whether the file is raw (ZPL/EPL) or PDF
         * @param options
         * @return {*}
         * @private
         */
        function _sendUrlPrint(printer, filePath, fileServerUrl, basicAuthPasscode, iNoOfCopies, isRaw, options) {
            log.debug("Print config - " +basicAuthPasscode+"::"+fileServerUrl);
            var requestBody;
            if (!isRaw) {
                requestBody = {
                    "printer": printer,
                    "title": "Printing Netsuite",
                    "contentType": consts.PRINT_CONTENT_TYPE.PDF_URL,
                    "content": fileServerUrl,
                    "source": "Netsuite",
                    "options": {"copies": iNoOfCopies},
                    "expireAfter": dal.getConfig(consts.CONFIG_KEYS.JOB_EXPIRY, DEFAULT_EXPIRY_SEC),
                    "authentication": {"type":"BasicAuth","credentials":{"user":basicAuthPasscode,"pass":""}}
                }
            } else {
                requestBody = {
                    "printer": printer,
                    "title": "Printing Netsuite",
                    "contentType": consts.PRINT_CONTENT_TYPE.RAW_URL,
                    "content": fileServerUrl,
                    "source": "Netsuite",
                    "options": {"copies": iNoOfCopies},
                    "qty": iNoOfCopies,
                    "expireAfter": dal.getConfig(consts.CONFIG_KEYS.JOB_EXPIRY, DEFAULT_EXPIRY_SEC),
                    "authentication": {"type":"BasicAuth","credentials":{"user":basicAuthPasscode,"pass":""}}
                }
            }
            var headers = {
                'Authorization': 'Basic ' + utils.encodeInput(dal.getConfig(consts.CONFIG_KEYS.API_KEY) + ":"),
                'Content-Type': 'text/plain'
            };

            var response = https.post({
                url: dal.getConfig(consts.CONFIG_KEYS.URL_PRINT, DEFAULT_PRINT_URL),
                body: JSON.stringify(requestBody),
                headers: headers
            });
            log.debug("Response", JSON.stringify(response));
            return response;
        }


        /**
         * Parses the PrintNode response for any errors
         * @param response PrintNode response
         * @returns jobId PrintNode jobId
         * @throws exceptions if PrintNode returns an erroneous response like invalid printer
         */
        function analyzePrintResponse(response) {
            utils.checkAndTranslatedThrow(response.code !== UNAUTH_CODE, {
                    translationKey: consts.TRANSLATION_KEYS.INVALID_APIKEY,
                    logMessage: "PrintNode API key or configured API endpoint is invalid."},
                null,
                consts.ERROR_CODES.AUTH_ERROR
            );
            const responseBody = JSON.parse(response.body);
            utils.checkAndTranslatedThrow((responseBody), {
                translationKey: consts.TRANSLATION_KEYS.UNEXPECTED_ERROR,
                logMessage: "Response is empty."
            }, null, consts.ERROR_CODES.UNEXPECTED_ERROR);
            utils.checkAndTranslatedThrow((responseBody.message !== consts.ERRORS.PN_MSSG_INVALIDPRINTER), {
                translationKey: consts.TRANSLATION_KEYS.INVALID_PRINTER,
                logMessage: "Invalid Printer."
            }, null, consts.ERROR_CODES.INVALID_PRINTER );
            utils.checkAndTranslatedThrow((responseBody.code !== consts.ERRORS.PN_BADREQUEST), {
                translationKey: consts.TRANSLATION_KEYS.UNEXPECTED_ERROR,
                logMessage: "Unexpected error." + responseBody.message
            }, null,  consts.ERROR_CODES.UNEXPECTED_ERROR);
            return responseBody;
        }

        /**
         * Sends request to Print Node and returns the response
         * @param fileObj File object to print
         * @param printer Printer to print on
         * @param filePath File path
         * @param iNoOfCopies No Of copies to print
         * @param isRaw whether a raw file or pdf
         * @param options Optional Print command data. Not used right now
         * @returns response body parsed as JSON
         * @throws exception if API key is invalid
         */
        function _sendRequest(fileObj, printer, filePath, iNoOfCopies, isRaw, options) {
            var requestBody;

            if (!isRaw) {
                requestBody = {
                    "printer": printer,
                    "title": "Printing",
                    "contentType": consts.PRINT_CONTENT_TYPE.PDF,
                    "content": fileObj.getContents(),
                    "source": "Netsuite",
                    "options": {"copies": iNoOfCopies},
                    "expireAfter": dal.getConfig(consts.CONFIG_KEYS.JOB_EXPIRY, DEFAULT_EXPIRY_SEC)
                }
            } else {
                requestBody = {
                    "printer": printer,
                    "title": "Printing",
                    "contentType": consts.PRINT_CONTENT_TYPE.RAW ,
                    "content": utils.encodeInput(fileObj.getContents()),
                    "source": "Netsuite",
                    "options": {"copies": iNoOfCopies},
                    "qty": iNoOfCopies,
                    "expireAfter": dal.getConfig(consts.CONFIG_KEYS.JOB_EXPIRY, DEFAULT_EXPIRY_SEC)
                }
            }

            const headers = {
                'Authorization': 'Basic ' + utils.encodeInput(dal.getConfig(consts.CONFIG_KEYS.API_KEY) + ":"),
                'Content-Type': 'text/plain'
            };
            const response = https.post({
                url: dal.getConfig(consts.CONFIG_KEYS.URL_PRINT, DEFAULT_PRINT_URL),
                body: JSON.stringify(requestBody),
                headers: headers
            });

            return response;
        }

        /**
         * Queries status of the job  ids passed
         * @param jobIds Job Ids to be queried
         * @returns JSON response containing status of the Jobs
         */
        function queryStatus(jobIds) {
            if (!jobIds || jobIds.length === 0) {
                return {};
            }
            var jobUrl = dal.getConfig(consts.CONFIG_KEYS.URL_PRINT, DEFAULT_PRINT_URL) + "/";
            for (var i = 0; i < (jobIds.length - 1); i++) {
                jobUrl += jobIds[i] + ",";
            }
            jobUrl += jobIds[i] + "/states";
            var headers = {
                'Authorization': 'Basic ' + utils.encodeInput(dal.getConfig(consts.CONFIG_KEYS.API_KEY) + ":")
            };
            log.debug("Submitting Print job to URL : " + jobUrl);
            var response = https.get({
                url: jobUrl,
                headers: headers
            });
            return JSON.parse(response.body);
        }

        /**
         * Returns if the file is Raw or not. Works using extension of the file. Missing extension can lead to erroneous result
         * @param filePath File path
         * @returns true if ZPL file, false otherwise
         */
        function isRawFile(filePath) {
            return utils.endsWith(filePath, consts.FILE_EXTENSION.ZPL);
        }


        /**
         * Maps printNode response code to one of internal codes
         * @param externalStatus External status code
         * @returns Internal response mapping
         */
        function getStatusMapping(externalStatus) {
            if(!STATUS_MAPPINGS){
                setSatusMappings();
            }
            return STATUS_MAPPINGS[externalStatus];
        }

        /**
         * Sets all Print Status Params
         */
        function setSatusMappings(){
            STATUS_MAPPINGS = {};
            STATUS_MAPPINGS[consts.EXTERNAL_PRINT_STATUS.NEW] = mobileTranslationLibrary.getTranslation("PRINT_SUBMITTED");
            STATUS_MAPPINGS[consts.EXTERNAL_PRINT_STATUS.DONE] = mobileTranslationLibrary.getTranslation("PRINT_COMPLETED");
            STATUS_MAPPINGS[consts.EXTERNAL_PRINT_STATUS.ERROR] = mobileTranslationLibrary.getTranslation("PRINT_ERROR");
            STATUS_MAPPINGS[consts.EXTERNAL_PRINT_STATUS.EXPIRED] = mobileTranslationLibrary.getTranslation("PRINT_ERROR");
        }

        return {
            print: print,
            queryStatus: queryStatus,
            getStatusMapping: getStatusMapping
        }
    }
);
