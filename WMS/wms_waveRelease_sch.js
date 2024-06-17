/**
 *    Copyright 2020, Oracle and/or its affiliates. All rights reserved.
 *//**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */
define(['N/runtime','../Restlets/wms_utility','N/search','N/record','N/format','N/email','N/url','N/query','N/task'],
		function(runtime,utility,search,record,format,email,url,query,task) {

	function execute(context) {
		try
		{
			var waveTemplateDetials = getWaveTemplateDetials();
			invokeCreateProcess(waveTemplateDetials);
		}
		catch(e)
		{
			log.error({title:'error in execute',details:e});
		}
	}	

	function getWaveTemplateDetials(){

		var waveTemplateSearchObj = search.load({
			id: 'customsearch_wms_wave_release_template'			
		}); 

		waveTemplateSearchObj = utility.getSearchResultInJSON(waveTemplateSearchObj);
		return waveTemplateSearchObj;
	}

	function invokeCreateProcess(waveTemplateSearchObj){
		if(waveTemplateSearchObj.length > 0)
		{
			log.debug({title:'waveTemplateSearchObj',details:waveTemplateSearchObj});

			for(var waveTemplateIndex in waveTemplateSearchObj)
			{
				try {
					if (waveTemplateSearchObj[waveTemplateIndex]) {

						var templateId = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_template;
						var locationId = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_location;
						var pickingTypeText = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_picking_typeText;//
						var pickingType = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_picking_type;//
						var transactionTypeText = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_tran_typeText;//
						var transactionType = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_tran_type;//
						var wavePriority = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_wave_priority;
						var releaseDay = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_release_dayText;
						var releaseDayValue = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_release_day;
						var releaseFrequencyText = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_frequencyText;
						var releaseFrequency = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_frequency;
						var runTimeStart = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_runtime_start;
						var waveOrderLimit = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_order_limit;
						var waveNotifyStatus = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_status_reqText;
						var emailIds = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_email;
						var waveSchdulerInternalId = waveTemplateSearchObj[waveTemplateIndex].id;
						var lastRunTime = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_lastruntime;
						var lastRunDate = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_lastrundate;
						var templateCreatedById = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_template_create_by;
						var waveStatusText = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_waverelease_statusText;
						var waveStatus = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_waverelease_status;
						var emailIdsWaveCreatedStatus = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_email_wavecreate;
						var isMultiWaveSelected = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_waverelease_multiwaves;
						var waveLimit = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_release_wavelimit;
						var locationName = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_locationText;

						if (!utility.isValueValid(waveLimit) && (isMultiWaveSelected === true)) {
							waveLimit = 500;
						} else if (isMultiWaveSelected === false) {
							waveLimit = 1;
						}

						var currentDate = utility.DateStamp();
						currentDate = format.parse({
							value: currentDate,
							type: format.Type.DATE
						});
						var currdateObj = currentDate;
						currentDate = format.format({
							value: currentDate,
							type: format.Type.DATE
						});

						var currentDay = getWeekDay(currdateObj);

						var releaseDayObj = releaseDayValue.split(',');

						var releaseDayArr = [];

						for (var releaseDayObjIndex = 0; releaseDayObjIndex < releaseDayObj.length; releaseDayObjIndex++) {
							releaseDayArr.push(releaseDayObj[releaseDayObjIndex]);

						}

						if ((utility.isValueValid(releaseDayObj) && releaseDayObj == '1') || (utility.isValueValid(releaseDayArr) && (releaseDayArr.indexOf(currentDay) != -1))) {

							log.debug({title: 'releaseDayObj', details: releaseDayObj});
							log.debug({title: 'releaseDayArr', details: releaseDayArr});

							var runTimeEnd = waveTemplateSearchObj[waveTemplateIndex].custrecord_wms_wave_rls_runtime_end;
							var currentTime = utility.getCurrentTimeStamp();

							var isCurrentTimeFallsBetweenRunTimeStartAndEnd = checkCurrentTimeFallsBetweenRunTimeStartAndRunTimeEnd(runTimeStart, runTimeEnd, currentTime, currentDate, currdateObj);

							log.debug({
								title: 'isCurrentTimeFallsBetweenRunTimeStartAndEnd',
								details: isCurrentTimeFallsBetweenRunTimeStartAndEnd
							});
							if ((isCurrentTimeFallsBetweenRunTimeStartAndEnd == 'T')) {
								var releseFrequencyObj = [];

								releseFrequencyObj.releaseFrequencyText = releaseFrequency;
								releseFrequencyObj.lastRunTime = lastRunTime;
								releseFrequencyObj.lastRunDate = lastRunDate;
								releseFrequencyObj.currentTime = currentTime;
								releseFrequencyObj.currentDate = currentDate;

								var releaseFrequency = checkReleaseFrequency(releseFrequencyObj);

								log.debug({title: 'releaseFrequency', details: releaseFrequency});

								if (releaseFrequency == true) {

									var requestStartedDate = new Date();

									var transactionType = getTransactionType(transactionType);
									var pickingType = getPickingType(pickingType);
									var waveStatus = getWaveStatus(waveStatus);

									var waveParams = [];
									waveParams.templateId = templateId;
									waveParams.wavetype = transactionType;
									waveParams.locationId = locationId;
									waveParams.picktype = pickingType;
									waveParams.priority = wavePriority;
									waveParams.waveOrderLimit = waveOrderLimit;
									waveParams.waveStatus = waveStatus;

									var repeatLoop = 1;

									for (var waveIndex = 0; waveIndex < repeatLoop && repeatLoop <= parseInt(waveLimit); waveIndex++) {

										var checkGovernanceLimit = runtime.getCurrentScript().getRemainingUsage();

										if (checkGovernanceLimit < 1000) {
											invokeWaveReleaseScheduleScript('customscript_wms_wave_release_scheduler', 'customdeploy_wms_wave_release_scheduler');
											break;

										}
										var waveResult = createWave(waveParams);
										var errorMessage = '';
										var isWaveGeneratedSuccessfully = 'Y';
										waveStatus = 'Wave Created';
										if (!utility.isValueValid(waveResult.waveId) && utility.isValueValid(waveResult.waveExceptionName)) {
											errorMessage = waveResult.waveExceptionMessage;
											isWaveGeneratedSuccessfully = 'N';
											waveStatus = 'Failed';
										}
										updateWMSWaveReleaseSchedule(waveSchdulerInternalId);

										var schedulerStatusRequestId = getDeploymentURL();
										var childRecordParams = [];
										var requestSubmittedDate = new Date();
										var requestSubmittedDateTime = utility.getCurrentTimeStamp();
										childRecordParams.requestSubmittedDate = requestSubmittedDate;
										childRecordParams.waveStatus = waveStatus;
										childRecordParams.requestStartedDate = requestStartedDate;
										childRecordParams.requestId = schedulerStatusRequestId;
										var waveName = '';
										if (isWaveGeneratedSuccessfully == 'Y') {
											childRecordParams.waveId = waveResult.waveId;
											waveName = getWaveName(waveResult.waveId);
											if (waveName.length > 0) {
												waveName = waveName[0].WaveName;
											} else {
												waveName = "";
												childRecordParams.waveId = "";
											}
										}
										childRecordParams.errorMessage = errorMessage;
										childRecordParams.templateId = templateId;
										childRecordParams.waveSchdulerInternalId = waveSchdulerInternalId;

										var skipMail = false;
										var sendEmailFuncObj = [];
										if (isMultiWaveSelected === true) {
											repeatLoop++;
											skipMail = true;
											log.debug({title: 'errorMessage', details: errorMessage});
											if ((isWaveGeneratedSuccessfully == 'N' && waveIndex > 0) || ((waveIndex + 1) == waveLimit)) {
												createChildWMSWaveReleaseScheduleRecord(childRecordParams);
												sendEmailFuncObj.waveNotifyStatus = waveNotifyStatus;
												sendEmailFuncObj.emailIds = emailIds;
												sendEmailFuncObj.emailIdsWaveCreatedStatus = emailIdsWaveCreatedStatus;
												sendEmailFuncObj.isWaveGeneratedSuccessfully = isWaveGeneratedSuccessfully;
												sendEmailFuncObj.waveName = waveName;
												sendEmailFuncObj.currentDate = currentDate;
												sendEmailFuncObj.requestSubmittedDateTime = requestSubmittedDateTime;
												sendEmailFuncObj.errorMessage = errorMessage;
												sendEmailFuncObj.waveResult = waveResult;
												sendEmailFuncObj.currentTime = currentTime;
												sendEmailFuncObj.templateCreatedById = templateCreatedById;
												sendEmailFuncObj.isMultiWaveSelected = isMultiWaveSelected;
												sendEmailFuncObj.waveIndex = waveIndex + 1;
												sendEmailFuncObj.locationName = locationName;
												sendEmailFunction(sendEmailFuncObj);
												break;
											} else if (isWaveGeneratedSuccessfully == 'N' && waveIndex == 0) {
												skipMail = false;
												repeatLoop = 1;
											}
										}
										createChildWMSWaveReleaseScheduleRecord(childRecordParams);
										if (skipMail == false) {
											sendEmailFuncObj.waveNotifyStatus = waveNotifyStatus;
											sendEmailFuncObj.emailIds = emailIds;
											sendEmailFuncObj.emailIdsWaveCreatedStatus = emailIdsWaveCreatedStatus;
											sendEmailFuncObj.isWaveGeneratedSuccessfully = isWaveGeneratedSuccessfully;
											sendEmailFuncObj.waveName = waveName;
											sendEmailFuncObj.currentDate = currentDate;
											sendEmailFuncObj.requestSubmittedDateTime = requestSubmittedDateTime;
											sendEmailFuncObj.errorMessage = errorMessage;
											sendEmailFuncObj.waveResult = waveResult;
											sendEmailFuncObj.currentTime = currentTime;
											sendEmailFuncObj.templateCreatedById = templateCreatedById;
											sendEmailFuncObj.locationName = locationName;
											sendEmailFunction(sendEmailFuncObj);
										}
									}
								}
							}
						}
					}
				}
				catch(e){
					log.error({title:"exception in",details:waveTemplateSearchObj[waveTemplateIndex]});
					log.error({title:"e",details:e});
				}
			}
		}

	}

	function sendEmailFunction(sendEmailFuncParams){
		
		var waveNotifyStatus = sendEmailFuncParams.waveNotifyStatus;
		var emailIds = sendEmailFuncParams.emailIds;
		var emailIdsWaveCreatedStatus = sendEmailFuncParams.emailIdsWaveCreatedStatus;
		var isWaveGeneratedSuccessfully = sendEmailFuncParams.isWaveGeneratedSuccessfully;
		var waveName = sendEmailFuncParams.waveName;
		var currentDate = sendEmailFuncParams.currentDate;
		var requestSubmittedDateTime = sendEmailFuncParams.requestSubmittedDateTime;
		var errorMessage = sendEmailFuncParams.errorMessage;	
		var waveResult = sendEmailFuncParams.waveResult;
		var currentTime = sendEmailFuncParams.currentTime;	
		var templateCreatedById = sendEmailFuncParams.templateCreatedById;
		var isMultiWaveSelected = sendEmailFuncParams.isMultiWaveSelected;
		var noOfWaves = sendEmailFuncParams.waveIndex;
    var locationName = sendEmailFuncParams.locationName;
		var waveNotifyStatusObj = waveNotifyStatus.split(',');
		var emailIdsObj = emailIds.split(';');

		var emailIdsWaveCreatedObj = emailIdsWaveCreatedStatus.split(';');
		if(waveNotifyStatusObj.length>0){

			var emailIdsArr = [];
			for(var waveNotifyStatusObjIndex = 0; waveNotifyStatusObjIndex<waveNotifyStatusObj.length;waveNotifyStatusObjIndex++){
				waveNotifyStatus = waveNotifyStatusObj[waveNotifyStatusObjIndex];
				if(waveNotifyStatus == 'Failed' && isWaveGeneratedSuccessfully == 'N'){
					if(emailIdsObj.length>0){
						for(var emailIdsObjIndex = 0; emailIdsObjIndex<emailIdsObj.length;emailIdsObjIndex++){
							emailIdsArr.push(emailIdsObj[emailIdsObjIndex]);
						}
					}
					break;
				}
				else if(waveNotifyStatus == 'Wave Created' && isWaveGeneratedSuccessfully == 'Y'){
					if(emailIdsWaveCreatedObj.length>0){
						for(var emailIdsWaveCreatedObjIndex = 0; emailIdsWaveCreatedObjIndex<emailIdsWaveCreatedObj.length;emailIdsWaveCreatedObjIndex++){
							emailIdsArr.push(emailIdsWaveCreatedObj[emailIdsWaveCreatedObjIndex]);
						}
					}
					break;
				}
			}

			var sendEmailObj = [];
			sendEmailObj.recepientEmailIds = emailIdsArr;
			sendEmailObj.isWaveGeneratedSuccessfully = isWaveGeneratedSuccessfully;
			sendEmailObj.waveName = waveName;
			sendEmailObj.requestSubmitted = currentDate + ' ' + requestSubmittedDateTime;
			sendEmailObj.errorMessage = errorMessage;
			sendEmailObj.waveId = waveResult.waveId;
			sendEmailObj.requestStartedDate = currentDate + ' ' + currentTime;
			sendEmailObj.currentDate = currentDate;	
			sendEmailObj.authorId = templateCreatedById;
			sendEmailObj.isMultiWaveSelected = isMultiWaveSelected;
			sendEmailObj.noOfWaves = noOfWaves;
			sendEmailObj.locationName = locationName;
			log.debug({title:'templateCreatedById',details:templateCreatedById});
			sendEmail(sendEmailObj);
		}

	}

	function checkCurrentTimeFallsBetweenRunTimeStartAndRunTimeEnd(runTimeStart,runTimeEnd,currentTime,currentDate,currdateObj){
		var isCurrentTimeFallsBetweenRunTimeStartAndEnd = 'F';
		if(utility.isValueValid(runTimeStart)){
			var isRunTimeStartLessThenCurrentTime = CompareTime(currentTime,runTimeStart,currentDate,currdateObj);
			if(isRunTimeStartLessThenCurrentTime<0){
				if(utility.isValueValid(runTimeEnd)) {
					var isRunTimeEndGreaterThenCurrentTime = CompareTime(currentTime, runTimeEnd, currentDate,currdateObj);
					if (isRunTimeEndGreaterThenCurrentTime > 0) {
						isCurrentTimeFallsBetweenRunTimeStartAndEnd = 'T';
					}
				}
				else{
					isCurrentTimeFallsBetweenRunTimeStartAndEnd = 'T';
				}
			}
		}
		else{
			isCurrentTimeFallsBetweenRunTimeStartAndEnd = 'T';
		}
		return isCurrentTimeFallsBetweenRunTimeStartAndEnd;
	}

	function getWeekDay(currentDate){
		
		var date = new Date();
		var weekdays = new Array(
				//"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
			"8","2","3","4","5","6","7"
		);
		var day = currentDate.getDay();
		return weekdays[day];
	}

	function getTransactionType(transactionTypeText){
		var transactionType = '';
		switch (transactionTypeText) {
		case '1':
			transactionType = "SalesOrd";
			break;
		case '2':
			transactionType = 'TrnfrOrd';
			break;
		}
		return transactionType;
	}
	function getPickingType(pickingTypeText){
		var pickingType = '';
		switch (pickingTypeText) {
		case '1':
			pickingType = "SINGLE";
			break;
		case '2':
			pickingType = 'MULTI';
			break;
		case '3':
			pickingType = 'BULK';
			break;
		}
		return pickingType;
	}
	function getWaveStatus(waveStatusText){
		var waveStatusId = '';
		switch (waveStatusText) {
		case '1':
			waveStatusId = "RELEASED";
			break;
		case '2':
			waveStatusId = 'PENDING';
			break;
		}
		return waveStatusId;
	}
	function getWaveName(waveId){

		var waveQuery = query.create({
			type: query.Type.TRANSACTION
		});

		var condType = waveQuery.createCondition({
			fieldId: 'type',
			operator: query.Operator.ANY_OF,
			values: 'Wave'
		});

		var condWaveId = waveQuery.createCondition({
			fieldId: 'id',
			operator: query.Operator.ANY_OF,
			values: waveId
		});

		waveQuery.columns = [
			waveQuery.createColumn({
				fieldId: 'trandisplayname'
			}),
			];

		waveQuery.condition = waveQuery.and(
				condType,condWaveId);


		var waveDetailsArr=[];

		var myPagedData = waveQuery.runPaged({
			pageSize: 1
		});

		myPagedData.pageRanges.forEach(function (pageRange) {
			var myPage = myPagedData.fetch({
				index: pageRange.index
			});
			var resultSetObj =  myPage.data;
			if(resultSetObj!=null && resultSetObj!='')
			{
				var resultsObj = resultSetObj.results;
				var columnsObj = resultSetObj.columns;
				for (var row in resultsObj)
				{
					if(resultsObj[row]){
					var resultObj = resultsObj[row]; 
					convertToJsonObj(resultObj,waveDetailsArr,columnsObj);
					}
				}
			}
		});



		return waveDetailsArr;
	}
	function convertToJsonObj(result,waveDetailsArr,columnsObj)
	{

		var columns = columnsObj;
		var  values = result.values;

		var waveObj = {};
		for(var col in columns)
		{
			if(columns[col]){
				var colName = columns[col].fieldId;
				log.debug({title:'colName',details:colName});
				if(colName == 'trandisplayname')
				{
					colName ='WaveName';
				}

				waveObj[colName ] = values[col];  
			}
		}
		waveDetailsArr.push(waveObj); 
	}
	function updateWMSWaveReleaseSchedule(waveSchdulerInternalId){

		var currentDate = utility.DateStamp();
		var currentTime = utility.getCurrentTimeStamp();
		var timeString = utility.parseTimeString(currentTime);

		var parsedCurrentDate = format.parse({
			value: currentDate,
			type: format.Type.DATE
		});

		var waveReleaseRecord = record.load({type:'customrecord_wms_wave_release_schedule',
			id:waveSchdulerInternalId,
			isDynamic: true
		});
		waveReleaseRecord.setValue({fieldId:'custrecord_wms_wave_rls_lastruntime',value: timeString});
		waveReleaseRecord.setValue({fieldId: 'custrecord_wms_wave_rls_lastrundate',value: parsedCurrentDate});
		waveReleaseRecord.save();
	}
	function createChildWMSWaveReleaseScheduleRecord(childRecordParams){

		var requestSubmittedDate =childRecordParams.requestSubmittedDate;
		var waveStatus = childRecordParams.waveStatus;
		var requestStartedDate = childRecordParams.requestStartedDate;
		var waveId = childRecordParams.waveId;
		var errorMessage = childRecordParams.errorMessage;
		var templateId = childRecordParams.templateId ;
		var waveSchdulerInternalId = childRecordParams.waveSchdulerInternalId;

		requestSubmittedDate = format.parse({
			value: requestSubmittedDate,
			type: format.Type.DATETIME
		});
		
		requestStartedDate = format.parse({
			value: requestStartedDate,
			type: format.Type.DATETIME
		});

		var childCustomRecord = record.create({
			type: 'customrecord_wms_wave_release_status'
		});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_req_submitted',value: requestSubmittedDate});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_req_status',value: waveStatus});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_req_started',value: requestStartedDate});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_wavenumber',value: waveId});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_status_errmsg',value: errorMessage});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_status_template',value: templateId});
		childCustomRecord.setValue({fieldId: 'custrecord_wms_wave_rls_parentpage',value: waveSchdulerInternalId});
		childCustomRecord.save({enableSourcing: false,ignoreMandatoryFields: true});
	}

	function createWave(waveParams){

		var templateId = waveParams.templateId;
		var wavetype = waveParams.wavetype;
		var locationId = waveParams.locationId;
		var picktype = waveParams.picktype;
		var priority = waveParams.priority;
		var waveOrderLimit = waveParams.waveOrderLimit;
		var waveStatus = waveParams.waveStatus;

		var wave = record.create({type: record.Type.WAVE, isDynamic: true});
		wave.setValue({fieldId: 'searchtemplateid', value: templateId}); 
		wave.setValue({fieldId: 'wavetype', value: wavetype});        
		wave.setValue({fieldId: 'location', value: locationId});         
		wave.setValue({fieldId: 'picktype', value: picktype});
		wave.setValue({fieldId: 'newwavestatus', value: waveStatus});
		wave.setValue({fieldId: 'priority', value: priority});    
		wave.setValue({fieldId: 'waveorderlimit', value: waveOrderLimit});  
		var waveResultObj = [];

		try{
			waveResultObj.waveId = wave.save();
		}
		catch(e){
			log.error({title:'error in wave',details:e});
			waveResultObj.waveExceptionName = e.name;
			waveResultObj.waveExceptionMessage = e.message;
		}
		log.debug({title:'waveId',details:waveResultObj});

		return waveResultObj;
	}

	function CompareTime(CurrentTime,vNextRunTime,currentDate,currdateObj)
	{
		var difference_in_milliseconds=0;
		try{
			log.debug("vNextRunTime",vNextRunTime);
			log.debug("CurrentTime",CurrentTime);
			log.debug("currentDate",currentDate);
			if(vNextRunTime !=null && vNextRunTime !='' && CurrentTime!=null && CurrentTime !='')
			{
				//new Date() is not suporting for some dateformat so always conevrting the date to
				// 'dd/mm/yyyy' before new Date()
				var newConvertedDate = converttoNewDate(currdateObj);
				log.debug("newConvertedDate",newConvertedDate);
				var dtStart = new Date(newConvertedDate + ' ' + CurrentTime);
				var dtEnd = new Date(newConvertedDate + ' ' + vNextRunTime);
				log.debug("dtStart",dtStart);
				log.debug("dtEnd",dtEnd);

				difference_in_milliseconds = dtEnd - dtStart;
				log.debug("difference_in_milliseconds",difference_in_milliseconds);
			}
		}
		catch (exp)
		{
			log.error("exp",exp);
		}
		return difference_in_milliseconds;
	}
			function converttoNewDate(date) {
				var day = date.getDate();
				day = day < 10 ? "0" + day : day;
				var month = date.getMonth() + 1;
				month = month < 10 ? "0" + month : month;
				var year = date.getFullYear();
				return year + "/" + month + "/" + day;
			}
	function getTimeDifference(currentTime,lastRunTime,currentDate,lastRunDate)
	{
		var difference_in_milliseconds=0;
		try{

			if(lastRunTime !=null && lastRunTime !='' && currentTime!=null && currentTime !='')
			{
				var lastRunDateString = getDateinMMDDYYYYFormat(lastRunDate);
				var currentDateString = getDateinMMDDYYYYFormat(currentDate);
				
				
				var dateLastRun = new Date(lastRunDateString + ' ' + lastRunTime);
				var dateCurrent = new Date(currentDateString + ' ' + currentTime);
				
				
				difference_in_milliseconds = dateCurrent - dateLastRun;
				var timeInHours = convertMS(difference_in_milliseconds);
				return timeInHours;
			}
		}
		catch (exp)
		{
		}
		return difference_in_milliseconds;
	}
	function convertMS( milliseconds ) {
		var minute, seconds;
		seconds = Math.floor(milliseconds / 1000);
		minute = Math.floor(seconds / 60);
		
		return {
			minute: minute
		};
	}
	function checkReleaseFrequency(releseFrequencyObjParams){

		var releaseFrequencyText = releseFrequencyObjParams.releaseFrequencyText;
		var lastRunTime = releseFrequencyObjParams.lastRunTime;
		var lastRunDate = releseFrequencyObjParams.lastRunDate;
		var currentTime = releseFrequencyObjParams.currentTime;
		var currentDate = releseFrequencyObjParams.currentDate;
		log.debug('releaseFrequencyText', releaseFrequencyText);
		if(utility.isValueValid(lastRunTime) && utility.isValueValid(lastRunDate)){
			var hourGap = getTimeDifference(currentTime,lastRunTime,currentDate,lastRunDate);

			switch (releaseFrequencyText) {
			case '1':
				if(hourGap.minute>=1435){
					return true;
				}
				break;
			case '2':
				//if(hourGap.minute>=13){
					return true;
				//}
				break;
			case '3':
				if(hourGap.minute>=25){
					return true;
				}
				break;
			case '4':
				if(hourGap.minute>=55){
					return true;
				}
				break;
			case '5':
				if(hourGap.minute>=115){
					return true;
				}
				break;
			case '6':
				if(hourGap.minute>=235){
					return true;
				}
				break;
			case '7':
				if(hourGap.minute>=355){
					return true;
				}
				break;
			case '8':
				if(hourGap.minute>=475){
					return true;
				}
				break;
			case '9':
				if(hourGap.minute>=715){
					return true;
				}
				break;
			}
		}
		else{
			return true;
		}
	}

	function sendEmail(sendEmailParams) {

		var recipientIdsArr = sendEmailParams.recepientEmailIds;
		var isWaveGeneratedSuccessfully = sendEmailParams.isWaveGeneratedSuccessfully;
		var waveName  = sendEmailParams.waveName;
		var requestSubmitted = sendEmailParams.requestSubmitted;
		var errorMessage = sendEmailParams.errorMessage;
		var waveId = sendEmailParams.waveId;
		var requestStarted = sendEmailParams.requestStartedDate;
		var currentDate = sendEmailParams.currentDate;
		var authorId = sendEmailParams.authorId;
		var isMultiWaveSelected = sendEmailParams.isMultiWaveSelected;
		var noOfWaves = sendEmailParams.noOfWaves;
		var locationName = sendEmailParams.locationName;

		log.debug('authorId', authorId);
		try {
			var emailObject = composeEmail(isWaveGeneratedSuccessfully,waveName,requestSubmitted,errorMessage,waveId,requestStarted,currentDate,
				isMultiWaveSelected,noOfWaves,locationName);
			log.debug('emailObject', emailObject);
			email.send({
				author: authorId,
				recipients: recipientIdsArr,
				subject:  emailObject.subject,
				body: emailObject.body,
			});
		} catch (error) {
			log.error({
				title: 'Sending email is failed',
				details: error
			});
		}
	}
	function composeEmail(isWaveGeneratedSuccessfully,waveName,requestSubmitted,errorMessage,waveId,requestStarted,currentDate,
						  isMultiWaveSelected,noOfWaves,locationName) {
		var emailObject = {};
		emailObject.subject = getEmailSubject(isWaveGeneratedSuccessfully,waveName,currentDate,isMultiWaveSelected,noOfWaves);
		emailObject.body = getEmailBody(isWaveGeneratedSuccessfully,waveName,requestSubmitted,errorMessage,waveId,requestStarted,
			isMultiWaveSelected,noOfWaves,locationName);
		return emailObject;
	}
	function getEmailSubject(isWaveGeneratedSuccessfully,waveName,currentDate,isMultiWaveSelected,noOfWaves) {
		if(isMultiWaveSelected == true){
                 return "Scheduled Wave Release: " + noOfWaves + "  Waves Released";
		}else{
			if (isWaveGeneratedSuccessfully == 'Y') {
				return "Scheduled Wave Release: " + waveName + " Created";
			} else {
				return "Scheduled Wave Release: Request Submitted "+ currentDate +" Failed";
			}
		}
	}

	function getEmailBody(isWaveGeneratedSuccessfully,waveName,requestSubmitted,errorMessage,waveId,requestStarted,isMultiWaveSelected,noOfWaves,locationName) {
		var emailBody = '';
		if(isMultiWaveSelected == true){
			var multiSelectBodyLine = "Wave creation and release has been successfully completed, with the following details:";
			emailBody += getIntroductoryParagraph(multiSelectBodyLine);
		}else{
			if (isWaveGeneratedSuccessfully == 'Y') {
				var successBodyLine = "Wave creation and release has been successfully completed for the following request:";
				emailBody += getIntroductoryParagraph(successBodyLine);
			} else {
				var failBodyLine = "Wave creation and release has failed for the following request:";
				emailBody += getIntroductoryParagraph(failBodyLine);
			}
		}
		emailBody += getParagraphWithLinks(isWaveGeneratedSuccessfully,waveName,requestSubmitted,errorMessage,waveId,
			requestStarted,isMultiWaveSelected,noOfWaves,locationName);
		return emailBody;
	}

	function getIntroductoryParagraph(paraContent) {
		return "<html><head></head><body><p>" + paraContent + "</p>";
	}
	function getParagraphWithLinks(isWaveGeneratedSuccessfully,waveName,requestSubmitted,errorMessage,waveId,requestStarted,isMultiWaveSelected,
								   noOfWaves,locationName) {
		if(isMultiWaveSelected == true){
			return "<p>"  + "Request Submitted :  " + requestSubmitted + "<br>" + 
			"Request Started: "+ requestStarted +"<br>" +
			"Total # of Waves Released: " + noOfWaves + "<br>"  +
			"Location : " + locationName + "<br>"  +
			"NetSuite Account :  " + runtime.accountId
			+ " "
			+  "<br><br><b>***" + "PLEASE DO NOT RESPOND TO THIS MESSAGE" + "***</b></p></body></html>";
		}else{
			if(isWaveGeneratedSuccessfully == 'Y'){

				var scheme = 'https://';
				var host = url.resolveDomain({
					hostType: url.HostType.APPLICATION
				});
				var relativePath = url.resolveRecord({
					recordType: 'wave',
					recordId: waveId
				});
				var myURL = scheme + host + relativePath;			


				return "<p>"  + "Request Submitted :  " + requestSubmitted + "<br>" + 
				"Request Started: "+ requestStarted +"<br>" +
				"Wave # : " + "<a href="+myURL+">"+ waveName+"</a>"  + "<br>" +
				"Location : " + locationName + "<br>"  +
				"NetSuite Account :  " + runtime.accountId
				+ " "
				+  "<br><br><b>***" + "PLEASE DO NOT RESPOND TO THIS MESSAGE" + "***</b></p></body></html>";
			}
			else{
				return "<p>"  + "Request Submitted: " + requestSubmitted + "<br>" + 
				"Request Started: "+ requestStarted +"<br>" +
				"Error message: " + errorMessage +"<br>" +
				"Location : " + locationName + "<br>"  +
				"NetSuite Account :  " + runtime.accountId
				+ " "
				+  "<br><br><b>***" + "PLEASE DO NOT RESPOND TO THIS MESSAGE" + "***</b></p></body></html>";
			}
		}
	}
	function getDeploymentURL() {
		var deploymentId = runtime.getCurrentScript().deploymentId;
		var scriptDeploymentObj = getScriptDeploymentDetails(deploymentId);

		return scriptDeploymentObj.id;
	}
	function getScriptDeploymentDetails (scriptId) {
		var scriptObj = {} ;
		var deploymentSearch = search.create({
			type: record.Type.SCRIPT_DEPLOYMENT,
			filters: [
				search.createFilter({
					name: 'scriptid',
					operator: search.Operator.CONTAINS,
					values: scriptId
				}),
				],
				columns: [

					search.createColumn({
						name: 'internalid'
					})
					]
		});
		var searchresult = deploymentSearch.run().getRange({
			start: 0,
			end: 1
		});
		if (searchresult.length > 0) {
			scriptObj.id = searchresult[0].getValue({
				name: 'internalid'
			});
		}
		return scriptObj;
	}
	
	function getDateinMMDDYYYYFormat(dateStringParam){
		
		var dateString = format.parse({
			value: dateStringParam,
			type: format.Type.DATE
		});
		
		return ((parseFloat(dateString.getMonth()) + 1) + '/' + (parseFloat(dateString.getDate())) + '/' + dateString.getFullYear());
		
	}
	function invokeWaveReleaseScheduleScript(scriptId,deploymentId){
		try
		{			
			var scheduledScriptTask = task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: scriptId,
				deploymentId: deploymentId
			});

			scheduledScriptTask.submit();
		}
		catch(e)
		{
			log.error({title:'error in  invokeWaveReleaseScheduleScript',details:e});
		}
	}


	return {
		execute: execute,
		getWaveTemplateDetials : getWaveTemplateDetials,
		invokeCreateProcess:invokeCreateProcess
	};

});
