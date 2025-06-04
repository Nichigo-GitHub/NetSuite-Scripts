/***************************************************************************
 Copyright � 2018,2018, Oracle and/or its affiliates. All rights reserved.
 ****************************************************************************/
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/record','N/url','N/runtime','N/redirect','N/config','N/search','../Restlets/wms_utility.js','N/file'],
		function(serverWidget,record,url,runtime,redirect,config,search,utility,file) 
		{

	function onRequest(context) 
	{

		if (context.request.method === 'GET') 
		{
			try
			{
				var request = context.request;
				var response = context.response;
				var soid=context.request.parameters.custparam_wmsse_soid;
				var containerlp=context.request.parameters.custparam_wmsse_containerlp;
				var isbulkpack=context.request.parameters.custparam_bul_pack;
				var whLocation=context.request.parameters.custparam_wmsse_Locationid;

				var strlog = 'soid. = ' + soid + '<br>';
				strlog = strlog + 'containerlp. = ' + containerlp + '<br>';	
				strlog = strlog + 'isbulkpack. = ' + isbulkpack + '<br>';	
				strlog = strlog + 'whLocation. = ' + whLocation + '<br>';	

				log.debug('Into GET',strlog);

				if(isbulkpack == null || isbulkpack == '' || isbulkpack == 'null' || isbulkpack == 'undefined')
					isbulkpack='';

				//var strHtmlString=utility.fngethtmlstring(soid,containerlp,isbulkpack,whLocation);
				var strHtmlStringfile = fngethtmlstring(soid,containerlp,isbulkpack,whLocation);
				var strUrl="";


				var imageurl;

				/*var objRecord = record.load({
			           type: 'customrecord_wmsse_labelprinting',
			            id: strHtmlString
			       });*/
				var filefound = getLoadFile('LOGOCOMP.jpg',context,file,runtime); 
				if (filefound) 
				{ 


					imageurl = filefound['url'];


					log.debug('imageurl',imageurl);
					imageurl=imageurl.replace(/&/g,"&amp;");

				}
				//var strHtmlStringfile=objRecord.getValue("custrecord_wmsse_label_data");
				if(strHtmlStringfile!=null && strHtmlStringfile!="")
				{
					strHtmlStringfile=strHtmlStringfile.replace('headerimage',imageurl);
				}

				response.write(strHtmlStringfile);


			}
			catch(exp)
			{
				log.error('Error in GET', exp.toString());
				//showInlineMessage(form, 'ERROR', exp.toString(), null);
				//context.response.writePage(form);
			}
		} 

	}


	function getLoadFile(fileName,context,file,runtime)
	{
		//var nlobjContext = nlapiGetContext();
		//var vBundleId = context.getBundleId();
		var txtFilePath = "";
		var script = runtime.getCurrentScript();
		var vBundleId = script.bundleIds;
		//nlapiLogExecution('ERROR', 'vBundleId', vBundleId);
		log.error('vBundleId', vBundleId);
		if(vBundleId != null && vBundleId != ''){
			//txtFilePath = 'SuiteBundles/Bundle '+vBundleId+'/'+'src/Images/'+ fileName;
			txtFilePath = utility.getBundleFilePath(fileName,'Images');
		}

		log.error('txtFilePath', txtFilePath);
		var objFile=null;
		try
		{

			var objFile = file.load({
				id: txtFilePath
			});

		}
		catch(e)
		{
			log.error('Error in GET', e.toString());

			txtFilePath = "Images/"+ fileName;			
			log.error('txtFilePath', txtFilePath);
			var objFile = file.load({
				id: txtFilePath
			});

			log.error('Exception in file load', objFile);
		}
		return objFile;
	}

	function fngethtmlstring(soid,containerlp,isbulkpack,whLocation)
	{

var strHtmlString='';
		var s = search.create({ 
			type:'customrecord_wmsse_labelprinting',
			columns: [{name: 'custrecord_wmsse_label_data'}],
			filters: [{
				name: 'custrecord_wmsse_label_lp',
				operator: 'is',
				values: containerlp},
				{
					name: 'custrecord_wmsse_label_type',
					operator: 'is',
					values: 'PackList'}
				
				]
		}).run().each(function(result){
			log.debug('custrecord_wmsse_label_data',result.getValue('custrecord_wmsse_label_data'));
			strHtmlString+=result.getValue('custrecord_wmsse_label_data');
			return true;
		});


		/*var getLabelresults = search.create({			
			type:"customrecord_wmsse_labelprinting",			   
		    //id: 'customrecord_wmsse_labelprinting',

			columns: [{
		        name: 'custrecord_wmsse_label_data'
		    }],
		    filters: [{
		        name: 'custrecord_wmsse_label_lp',
		        operator: 'is',
		        values: containerlp}]
		});



		var Labelprintingsearchrec = utility.getSearchResultInJSON(getLabelresults);


		log.error('Labelprintingsearchrec',Labelprintingsearchrec);

		var strHtmlString="";
		if(Labelprintingsearchrec.length >0)
		{
			log.error('Labelprintingsearchrec.length', Labelprintingsearchrec.length);
			for(var m=0; m < Labelprintingsearchrec.length; m++)
			{
				strHtmlString = Labelprintingsearchrec[m]['id'];			
			}
		}*/
		log.error('strHtmlString', strHtmlString);
		return strHtmlString;

	}


	return {
		onRequest: onRequest
	};
		});