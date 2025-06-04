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

				var whLocation=context.request.parameters.custparam_wmsse_Locationid;

				var strlog = 'soid. = ' + soid + '<br>';
				strlog = strlog + 'containerlp. = ' + containerlp + '<br>';						
				strlog = strlog + 'whLocation. = ' + whLocation + '<br>';	

				log.debug('Into GET',strlog);

				var strHtmlStringfile = gethtmlstring(soid,containerlp,whLocation);
				var strUrl="";


				var imageurl;


				var filefound = getLoadFile('LOGOCOMP.jpg',context,file,runtime); 
				if (filefound) 
				{ 


					imageurl = filefound['url'];


					log.debug('imageurl',imageurl);
					imageurl=imageurl.replace(/&/g,"&amp;");

				}

				if(strHtmlStringfile!=null && strHtmlStringfile!="")
				{

					strHtmlStringfile = replaceAll(strHtmlStringfile, "headerimage",imageurl);

				}

				response.write(strHtmlStringfile);


			}
			catch(exp)
			{
				log.error('Error in GET', exp.toString());

			}
		} 

	}

	function replaceAll(str, find, replaceString) {
		return str.replace(new RegExp(find, 'g'), replaceString);
	}



	function getLoadFile(fileName,context,file,runtime)
	{

		var txtFilePath = "";
		var script = runtime.getCurrentScript();
		var vBundleId = script.bundleIds;

		log.error('vBundleId', vBundleId);
		if(vBundleId != null && vBundleId != '') {
			//txtFilePath = 'SuiteBundles/Bundle ' + vBundleId + '/' + 'src/Images/' + fileName;
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

	function gethtmlstring(soid,containerlp,whLocation)
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


		log.error('strHtmlString', strHtmlString);
		return strHtmlString;

	}


	return {
		onRequest: onRequest
	};
		});