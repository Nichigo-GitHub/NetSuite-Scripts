/**
 * wmsUtility.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['./wms_utility','N/search','N/record','N/runtime','./big', 'N/query','N/format','./wms_translator'],
		function (utility,search,record,runtime,Big,query,format,translator) {

	function _getASNSystemRuleValue(warehouseLocationId)
	{
		var ASNCRuleVal = [];
		var SystemRuleName = "Generate EDI 856 outbound ASNs?";
		ASNCRuleVal = utility.getSystemRuleValue(SystemRuleName,warehouseLocationId);
		return ASNCRuleVal;
	}

	function _getAllEligibleItemFulfillments(asnRuleValue)
	{
		var getShipOrderdetails= [];
		if (asnRuleValue == 'Y') {
			var orderResults = search.load({
				id: 'customsearch_wms_get_orderdetails_asn'
			});
			getShipOrderdetails = utility.getSearchResultInJSON(orderResults);
		}
		return getShipOrderdetails;
	}

	function _getinvDetailInfo(itemfulfillmentInternalId){
		var _invDetailInfoSearch = search.load({id:'customsearch_wms_invdetailinfo_asnedi'});
		var _invDetailInfoFilter = _invDetailInfoSearch.filters;
		if(utility.isValueValid(itemfulfillmentInternalId))
		{
			_invDetailInfoFilter.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.ANYOF,
				values:itemfulfillmentInternalId}));
		}
		_invDetailInfoSearch.filters = _invDetailInfoFilter;
		var _invDetailInfoObjDetails = utility.getSearchResultInJSON(_invDetailInfoSearch);
		return _invDetailInfoObjDetails;
	}

	function _getOrderInformation(orderInternalId){
		var _orderInfoSearch = search.load({id:'customsearch_wms_orderinformation_asnedi'});
		var _orderInfoFilter = _orderInfoSearch.filters;
		if(utility.isValueValid(orderInternalId))
		{
			_orderInfoFilter.push(search.createFilter({
				name:'internalid',
				operator:search.Operator.ANYOF,
				values:orderInternalId}));
		}
		_orderInfoSearch.filters = _orderInfoFilter;
		var _orderInfoObjDetails = utility.getSearchResultInJSON(_orderInfoSearch);
		return _orderInfoObjDetails;
	}

	function _getContainerCUCCDetails(containerLP){
		var _uccnumber=getUCCNumber(containerLP);
		return _uccnumber;
	}
	
	function _getTrackingNoDetails(containerLP){
		var trackingNumber=getTrackingNumber(containerLP);
		return trackingNumber;
	}

	function getUCCNumber(containerLP)
	{
		var getUccresults = search.load({
			id:'customsearch_wms_ucc_labeldata'
		});
		getUccresults.filters.push(
				search.createFilter({
					name:'custrecord_wmsse_contlp',					
					operator:search.Operator.IS,
					values:containerLP
				})
		);
		var	 searchResults = utility.getSearchResultInJSON(getUccresults);
		return searchResults;
	}
	
	
	function getTrackingNumber(containerLP)
	{

		var wmsShipmentQuery = query.create({type: 'customrecord_wmsse_ship_manifest'});
		wmsShipmentQuery.columns = [
			wmsShipmentQuery.createColumn({fieldId: 'custrecord_wmsse_ship_trackno',alias: 'trackingno'})];	


		wmsShipmentQuery.condition = wmsShipmentQuery.createCondition({
			fieldId: 'custrecord_wmsse_ship_contlp',
			operator: query.Operator.IS,
			values: containerLP
		});		

		var resultSet = wmsShipmentQuery.run().asMappedResults();
		
		return resultSet;
	}

	function _getSKUDetails(itemInternalId){
		var _itemInfoSearch = search.load({id:'customsearch_wms_skuinfo_asnedi'});
		var _itemInfoFilter = _itemInfoSearch.filters;
		if(utility.isValueValid(itemInternalId))
		{
			_itemInfoFilter.push(search.createFilter({
				name:'internalid',
				operator:search.Operator.ANYOF,
				values:itemInternalId}));
		}
		_itemInfoSearch.filters = _itemInfoFilter;
		var _itemInfoObjDetails = utility.getSearchResultInJSON(_itemInfoSearch);
		log.debug({
			title: '_itemInfoObjDetails',
			details: _itemInfoObjDetails
		});
		return _itemInfoObjDetails;
	}

	function _updateParentRecord(objParenParams){
		var _orderInternalId = objParenParams['orderInternalId'];
		var _salesOrderText = objParenParams['salesOrderText'];
		var _ConsigneeId = objParenParams['ConsigneeId'];
		var advanceShippingParentRecord = record.create({
			type: 'customrecord_wmsse_asnc_parent',
			isDynamic: true
		});
		advanceShippingParentRecord.setValue({fieldId: 'name', value: _salesOrderText});			
		advanceShippingParentRecord.setValue({fieldId:'custrecord_wmsse_parent_deliveryid',value:_salesOrderText}); 
		advanceShippingParentRecord.setValue({fieldId:'custrecord_wmsse_parent_orderno',value:_orderInternalId}); 
		var recordId = advanceShippingParentRecord.save();
	}

	function _updateEDIOutboundStage(objParenParams){
		log.debug({title:'objParenParams',details:objParenParams});
		var orderInternalId = objParenParams['orderInternalId'];
		var tranid = objParenParams['tranid'];
		var UOM1 = objParenParams['UOM1'];
		var UOMQty1 = objParenParams['UOMQty1'];
		var UOMLength1 = objParenParams['UOMLength1'];
		var UOMWidth1 = objParenParams['UOMWidth1'];
		var UOMWeight1 = objParenParams['UOMWeight1'];
		var UOMHeight1 = objParenParams['UOMHeight1'];
		var CUCC = objParenParams['CUCC'];
		var ConsigneeId = objParenParams['ConsigneeId'];
		var Billaddressee = objParenParams['Billaddressee'];
		var Billaddr1 = objParenParams['Billaddr1'];
		var Billaddr2 = objParenParams['Billaddr2'];
		var Billcity = objParenParams['Billcity'];
		var BillState = objParenParams['BillState'];
		var Billzip = objParenParams['Billzip'];
		var Billcountry = objParenParams['Billcountry'];
		var Billphone = objParenParams['Billphone'];
		var Billaddr3 = objParenParams['Billaddr3'];
		var vendor = objParenParams['vendor'];
		var ShipAddressee = objParenParams['ShipAddressee'];
		var Department = objParenParams['Department'];
		var Class = objParenParams['Class'];		
		var ShipAddress1 = objParenParams['ShipAddress1'];
		var ShipAddress2 = objParenParams['ShipAddress2'];
		var Shipcity = objParenParams['Shipcity'];
		var ShipState = objParenParams['ShipState'];
		var Shipzip = objParenParams['Shipzip'];
		var ShipCountry = objParenParams['ShipCountry'];
		var Shipphone = objParenParams['Shipphone'];
		var ActualArrivalDate = objParenParams['ActualArrivalDate'];
		var PlannedArrivalDate = objParenParams['PlannedArrivalDate'];
		var containerLP = objParenParams['containerLP'];
		var TrackingNumbers = objParenParams['TrackingNumbers'];
		var IssueDate = objParenParams['IssueDate'];
		var Terms = objParenParams['Terms'];
		var CustomerPO = objParenParams['CustomerPO'];
		var lineno = objParenParams['lineno'];
		var ItemID = objParenParams['itemInternalId'];
		var SKUDesc = objParenParams['SKUDesc'];
		var upcCode = objParenParams['upcCode'];
		var Actqty = objParenParams['Actqty'];  
		var location = objParenParams['location'];
		var vendor = objParenParams['vendor'];
		var itemName = objParenParams['itemName'];
		var Company = objParenParams['Company'];//
		var city = objParenParams['city'];
		var state = objParenParams['state']; 
		var zip = objParenParams['zip']; 
		var Phone = objParenParams['Phone'];
		var SKUFamily = objParenParams['SKUFamily'];
		var SKUGroup = objParenParams['SKUGroup'];
		var SKUtype = objParenParams['SKUtype'];
		var ContainerMaxWeight = objParenParams['ContainerMaxWeight'];
		var OrderType = objParenParams['OrderType'];
		var OrderPriority = objParenParams['OrderPriority'];
		var ShippingCharges = objParenParams['ShippingCharges']; 
		var ShiptoEmail = objParenParams['ShiptoEmail']; 
		var ShiptoFax = objParenParams['ShiptoFax'];
		var Route = objParenParams['Route'];
		var Destination = objParenParams['Destination']; 
		var carrierIdnew = objParenParams['carrierIdnew']; 
		var carrierNamenew = objParenParams['carrierNamenew']; 
		var ContainerCube = objParenParams['ContainerCube']; 
		var carrierScacnew = objParenParams['carrierScacnew'];
		var shipFromAdress1=objParenParams['shipFromAdress1'];
		var shipFromAdress2=objParenParams['shipFromAdress2'];
		var shipFromAdress3=objParenParams['shipFromAdress3'];
		var shipFromCity=objParenParams['shipFromCity'];
		var shipFromState=objParenParams['shipFromState'];
		var shipFromZip=objParenParams['shipFromZip'];
		var shipFromCountry=objParenParams['shipFromCountry'];
		var shipFromPhone=objParenParams['shipFromPhone'];
		var shipMethod = objParenParams.shipMethod;
		

		if(!utility.isValueValid(Billaddressee)){
			Billaddressee = ConsigneeId;
		}
		if(!utility.isValueValid(vendor)) {
			vendor = itemName;
		}
		if(!utility.isValueValid(ShipAddressee)){
			ShipAddressee = ConsigneeId;
		}
		if(!utility.isValueValid(Route)){
			Route = Destination;
		}
		if(!utility.isValueValid(ActualArrivalDate)){
			ActualArrivalDate=IssueDate;
		}
		if(!utility.isValueValid(PlannedArrivalDate)){ 
			PlannedArrivalDate=IssueDate;
		}
		if (Billaddressee == "" || Billaddressee == null){
			Billaddressee = ConsigneeId;
		}
		if(!utility.isValueValid(SKUtype)){
			SKUtype="";
		}
		var ediOutboundShippingRecord = record.create({
			type: 'customrecord_wmsse_inetinterfaceasnc',
			isDynamic: true
		});

		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_ordno', value: orderInternalId});			
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_deliveryid',value:tranid}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipunitdimsuom',value:'Inches'}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_containerdimsuom', value: 'Inches'});			
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_skudimsuom',value:'Inches'}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_uom_id', value: UOM1});			
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_uom_qty',value:UOMQty1}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_sku_length',value:UOMLength1}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_sku_width', value: UOMWidth1});			
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_sku_weight',value:UOMWeight1}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_sku_height',value:UOMHeight1}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_c_ucc128', value: CUCC});			
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_eucc128',value:CUCC}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billto_contactname',value:Billaddressee}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billto_addr1',value:Billaddr1}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_billto_addr2', value: Billaddr2});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billtocity',value:Billcity}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_billtostate', value: BillState});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billtozip',value:Billzip}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billtocountry',value:Billcountry}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_billtophone', value: Billphone});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billinginfo_locid',value:Billaddr3}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_scac_code',value:carrierScacnew}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_carierservicelevel', value: carrierScacnew});
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_wmsse_skuvendor',value:vendor}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_delivery_uom',value:'EACH'}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_container_cube', value: ContainerCube});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipto_contactname',value:ShipAddressee}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_department',value:Department}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_class', value: Class});			
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_carrierid',value:carrierIdnew}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_asn_carrier_name', value: carrierNamenew});	
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_route',value:Route}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_dest',value:Destination}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_shiptoaddr1', value: ShipAddress1});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shiptoaddr2',value:ShipAddress2}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_shiptocity', value: Shipcity});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shiptostate',value:ShipState}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shiptozip',value:Shipzip}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_shiptocountry', value: ShipCountry});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shiptophone',value:Shipphone}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shiptoemail',value:ShiptoEmail}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_shiptofax', value: ShiptoFax});
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_expected_arrivaldate', value: ActualArrivalDate});
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_planned_arrival_date',value:PlannedArrivalDate}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_containerlp',value:containerLP}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_containerlp_charge', value: ShippingCharges});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_container_trackingno',value:TrackingNumbers}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_issue_period', value: IssueDate});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_payment_terms',value:Terms}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_container_weight',value:ContainerMaxWeight}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_deliveryid', value: tranid});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_ordertype',value:OrderType}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_order_priority',value:OrderPriority}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_consigneeid', value: ConsigneeId});
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_billtoemail',value:ShiptoEmail}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_customer_pono',value:CustomerPO}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_host_ordno', value: orderInternalId});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_deliveryline_no',value:lineno}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_item_internalid', value: ItemID});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_asn_item',value:itemName}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_sku_desc',value:SKUDesc}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_sku_family', value: SKUFamily});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_sku_group',value:SKUGroup}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_sku_type',value:SKUtype}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_upc_code', value:upcCode });
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_batch_delivery_qty',value:Actqty}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_quantity',value:Actqty}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_wh_location', value: location});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_company',value:Company}); 
		ediOutboundShippingRecord.setValue({fieldId: 'custrecord_wmsse_container_levelqty', value: Actqty});		
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_deliverylineqty',value:Actqty}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromlocationid',value:location}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_vendor',value:vendor}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromaddr1',value:shipFromAdress1}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromaddr2',value:shipFromAdress2}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromcity',value:shipFromCity}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromstate',value:shipFromState}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromzip',value:shipFromZip}); 
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromphone',value:shipFromPhone});
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipfromcountry',value:shipFromCountry});
		ediOutboundShippingRecord.setValue({fieldId:'custrecord_wmsse_shipping_cstfld_009',value:shipMethod});
		
		var EDICustRequired = IsEDICustRequired();

		if(EDICustRequired == 'Y')
		{
			var ressoDetails = GetEDIconfig(orderInternalId,lineno);
			for ( var w = 0 ; ressoDetails !=null && w < ressoDetails.length; w++ )
			{
				var columns= ressoDetails.columns;
				var columnLen = columns.length;
				for (var c = 0; c < columnLen; c++)
				{
					var value = ressoDetails[w]['fromCustRecdID'];
					if(ressoDetails[w]['carriertype'] == 'PC')
					{
						if( (ressoDetails[w]['customer'] != null && ressoDetails[w]['customer'] != '') && (ressoDetails[w]['customer'] == ConsigneeId) )
						{	
							ediOutboundShippingRecord.setValue({fieldId:ressolineDetails[w]['toCustRecdID'],value:value}); 
						}
						
						
					}
				}
			}
			var ressolineDetails = GetEDIconfigLinelevel(orderInternalId,lineno);
			for ( var w = 0 ; ressolineDetails !=null && w < ressolineDetails.length; w++ )
			{
				var resval = ressolineDetails[w]['fromCustRecdID'];
				if(ressolineDetails[w]['carriertype'] == 'PC')
				{
					if( (ressoDetails[w]['customer'] != null && ressoDetails[w]['customer'] != '') && (ressoDetails[w]['customer'] == ConsigneeId) )
					{	
						ediOutboundShippingRecord.setValue({fieldId:ressolineDetails[w]['toCustRecdID'],value:resval});
					}
					
				}
			}
			var resDefaultvalues = GetEDIconfigDefaultvalues();
			for ( var w = 0 ; resDefaultvalues !=null && w < resDefaultvalues.length; w++ )
			{
				var resdefaulval = resDefaultvalues[w]['defaultvalue'];
				ediOutboundShippingRecord.setValue({fieldId:resDefaultvalues[w]['toCustRecdID'],value:resdefaulval});
			}
		}
		var recordId = ediOutboundShippingRecord.save();
	}

	function IsEDICustRequired()
	{
		var systemrulevalue = 'Y';
		try {
			var searchRec = search.load({
				id: 'customsearch_wmsse_sys_rules'
			});
			var filters = searchRec.filters;
			filters.push(search.createFilter({
				name: 'custrecord_wmsseruletype',
				operator: search.Operator.IS,
				values:'WMSSE_EDI_CUST_REQ'
			}), search.createFilter({
				name: 'custrecord_wmsseactive',
				operator: search.Operator.IS,
				values: true
			}));
			searchRec.filters = filters;
			var searchresults = utility.getSearchResultInJSON(searchRec);
			if (searchresults.length > 0) {
				if (searchresults[0]['custrecord_wmsserulevalue'] != null &&
						searchresults[0]['custrecord_wmsserulevalue'] != '') {
					systemrulevalue = searchresults[0]['custrecord_wmsserulevalue'];
				}
			}
		}
		catch (exp) {
			log.error('expception', exp);
			return systemrulevalue;
		}
		return systemrulevalue;
	}

	function GetEDIconfig(soid,lineno){
		var FrmCustRecdName='';
		var FrmCustRecdID='';
		var FrmCustRecdFieldID='';
		var toCustRecdName='';
		var toCustRecdID='';
		var soheaderlevel='';
		var solinelevel='';
		var carriertype='';
		var customer='' ;
		var defaultvalue='';
		var impactedRecords = [];
		var _invDetailInfoSearch = search.load({id:'customsearch_wms_edi_configuration'});
		var _invDetailInfoObjDetails = utility.getSearchResultInJSON(_invDetailInfoSearch);
		if(_invDetailInfoObjDetails!=null && _invDetailInfoObjDetails!='')
		{
			for(var m=0; m < _invDetailInfoObjDetails.length; m++)
			{
				FrmCustRecdName = (_invDetailInfoObjDetails[m]['custrecord_wmsse_frm_custrecord_nameText']); // text
				FrmCustRecdID = (_invDetailInfoObjDetails[m]['custrecord_wmsse_frm_custrecord_name']); // text
				FrmCustRecdFieldID = _invDetailInfoObjDetails[m]['custrecord_wmsse_frm_cstmrecord_id'];
				toCustRecdName = _invDetailInfoObjDetails[m]['custrecord_wmsse_to_custrecrd_name'];
				toCustRecdID = _invDetailInfoObjDetails[m]['custrecord_wmsse_tocustmrecord_fld_name'];
				soheaderlevel = _invDetailInfoObjDetails[m]['custrecord_wmsse_soheader_level'];
				solinelevel = _invDetailInfoObjDetails[m]['custrecord_wmsse_soline_level'];
				carriertype = _invDetailInfoObjDetails[m]['custrecord_wmsse_carriertyp']; // text
				customer = _invDetailInfoObjDetails[m]['custrecord_wmsse_consignee_name']; //text
				defaultvalue = _invDetailInfoObjDetails[m]['custrecord_wmsse_default_val'];
				if(FrmCustRecdID == 'salesorder' && soheaderlevel == true)
				{
					var res=GetSODetails(FrmCustRecdID,FrmCustRecdFieldID,toCustRecdName,toCustRecdID,soid);
					if(res!=null && res!=''){
						for(var s=0;s<res.length;s++)
						{	
							var newcurrentRow = {
									'fromCustRecdID':res[s][FrmCustRecdID],
									'toCustRecdID':toCustRecdID,
									'carriertype':carriertype,
									'customer':customer,
									'defaultvalue':defaultvalue
							};

							impactedRecords.push(newcurrentRow);
						}
					}
				}
			}

		}
		return impactedRecords;
	}

	function GetSODetails(FrmCustRecdID,FrmCustRecdFieldID,toCustRecdName,toCustRecdID,soid)
	{
		var GetSODetailsSearch = search.load({
			id:FrmCustRecdID
		});
		var getSODetailFilter = GetSODetailsSearch.filters;
		var getSODetailColumn = GetSODetailsSearch.columns;
		getSODetailFilter.push(search.createFilter({
			name:'internalid',
			operator:search.Operator.ANYOF,
			values:soid
		}));
		getSODetailFilter.push(search.createFilter({
			name:'mainline',
			operator:search.Operator.IS,
			values:true
		}));
		getSODetailColumn.push(search.createColumn({
			name:FrmCustRecdFieldID
		}));
		GetSODetailsSearch.filters = getSODetailFilter;
		GetSODetailsSearch.columns = getSODetailColumn;
		var	 searchResults = utility.getSearchResultInJSON(GetSODetailsSearch);
		return searchResults;
	}

	function GetEDIconfigLinelevel(soid,lineno){
		var FrmCustRecdName='';
		var FrmCustRecdID='';
		var FrmCustRecdFieldID='';
		var toCustRecdName='';
		var toCustRecdID='';
		var soheaderlevel='';
		var solinelevel='';
		var carriertype='';
		var customer='' ;
		var defaultvalue='';
		var impactedRecords = [];
		var _invDetailInfoSearch = search.load({id:'customsearch_wms_edi_configuration'});
		var _invDetailInfoObjDetails = utility.getSearchResultInJSON(_invDetailInfoSearch);
		if(_invDetailInfoObjDetails!=null && _invDetailInfoObjDetails!='')
		{
			for(var m=0; m < _invDetailInfoObjDetails.length; m++)
			{
				FrmCustRecdName = (_invDetailInfoObjDetails[m]['custrecord_wmsse_frm_custrecord_name']);
				FrmCustRecdID = (_invDetailInfoObjDetails[m]['custrecord_wmsse_frm_custrecord_nameText']);
				FrmCustRecdFieldID = _invDetailInfoObjDetails[m]['custrecord_wmsse_frm_cstmrecord_id'];
				toCustRecdName = _invDetailInfoObjDetails[m]['custrecord_wmsse_to_custrecrd_name'];
				toCustRecdID = _invDetailInfoObjDetails[m]['custrecord_wmsse_tocustmrecord_fld_name'];
				soheaderlevel = _invDetailInfoObjDetails[m]['custrecord_wmsse_soheader_level'];
				solinelevel = _invDetailInfoObjDetails[m]['custrecord_wmsse_soline_level'];
				carriertype = _invDetailInfoObjDetails[m]['custrecord_wmsse_carriertyp']; // text
				customer = _invDetailInfoObjDetails[m]['custrecord_wmsse_consignee_name']; //text
				defaultvalue = _invDetailInfoObjDetails[m]['custrecord_wmsse_default_val'];
				if(FrmCustRecdID == 'salesorder' && solinelevel == true)
				{
					var res=GetSoLinedetails(FrmCustRecdID,FrmCustRecdFieldID,toCustRecdName,toCustRecdID,soid,lineno);
					if(res!=null && res!=''){
						for(var s=0;s<res.length;s++)
						{	
							var newcurrentRow = {
									'fromCustRecdID':res[s][FrmCustRecdID],
									'toCustRecdID':toCustRecdID,
									'carriertype':carriertype,
									'customer':customer,
									'defaultvalue':defaultvalue
							};
							impactedRecords.push(newcurrentRow);
						}
					}
				}
			}
		}
		return impactedRecords;
	}

	function GetSoLinedetails(FrmCustRecdID,FrmCustRecdFieldID,toCustRecdName,toCustRecdID,soid,lineno ){
		var lineval="";	
		try{
			var salesorderRec = record.load(({
				type:'salesorder',
				id:soid
			}));
			lineval=salesorderRec.getSublistValue(({
				sublistId:'item',
				fieldId:FrmCustRecdFieldID,
				line:lineno
			}));
		}
		catch(exception){
		}
		return lineval;
	}

	function GetEDIconfigDefaultvalues(){
		var FrmCustRecdName='';
		var FrmCustRecdID='';
		var FrmCustRecdFieldID='';
		var toCustRecdName='';
		var toCustRecdID='';
		var soheaderlevel='';
		var solinelevel='';
		var carriertype='';
		var customer='' ;
		var defaultvalue='';
		var isdefault = '';
		var impactedRecords = [];
		var _invDetailInfoSearch = search.load({id:'customsearch_wms_edi_configuration'});
		var _invDetailInfoObjDetails = utility.getSearchResultInJSON(_invDetailInfoSearch);
		if(_invDetailInfoObjDetails!=null && _invDetailInfoObjDetails!='')
		{
			for(var m=0; m < _invDetailInfoObjDetails.length; m++)
			{
				FrmCustRecdName = (_invDetailInfoObjDetails[m]['custrecord_wmsse_frm_custrecord_name']).split(':')[0]; // text
				FrmCustRecdID = (_invDetailInfoObjDetails[m]['custrecord_wmsse_frm_custrecord_name']).split(':')[1]; // text
				FrmCustRecdFieldID = _invDetailInfoObjDetails[m]['custrecord_wmsse_frm_cstmrecord_id'];
				toCustRecdName = _invDetailInfoObjDetails[m]['custrecord_wmsse_to_custrecrd_name'];
				toCustRecdID = _invDetailInfoObjDetails[m]['custrecord_wmsse_tocustmrecord_fld_name'];
				soheaderlevel = _invDetailInfoObjDetails[m]['custrecord_wmsse_soheader_level'];
				solinelevel = _invDetailInfoObjDetails[m]['custrecord_wmsse_soline_level'];
				carriertype = _invDetailInfoObjDetails[m]['custrecord_wmsse_carriertyp']; // text
				customer = _invDetailInfoObjDetails[m]['custrecord_wmsse_consignee_name']; //text
				defaultvalue = _invDetailInfoObjDetails[m]['custrecord_wmsse_default_val'];
				isdefault = _invDetailInfoObjDetails[m]['custrecord_wmsse_isdefault'];
				if(isdefault == true)
				{
					var newcurrentRow = {
							'defaultvalue':defaultvalue,
							'toCustRecdID':toCustRecdID,
							'carriertype':carriertype,
							'customer':customer,
							'defaultvalue':defaultvalue
					};
					impactedRecords.push(newcurrentRow);
				}
			}
		}
		return impactedRecords;
	}

	function _updateItemFulfillment(itemFulfillmentInternalId){
		var itemFulfillmentRecord = record.load({
			type : 'itemfulfillment',
			id : itemFulfillmentInternalId,
			isDynamic: false
		});
		itemFulfillmentRecord.setValue('custbody_wms_asngeneration',2); 
		var resultId = itemFulfillmentRecord.save();
	}

	function _getAllItemInfo(invDetailInfo){
		var itemInternalId = [];
		for (var invIteration in invDetailInfo){
			var itemId=invDetailInfo[invIteration]['item'];
			itemInternalId.push(itemId);
		}
		var _itemDetails = _getSKUDetails(itemInternalId);
		return _itemDetails;
	}

	function _getIndividualSKUDetails(allItemInfo,itemInternalId){
		var itemDetails = [];
		for(var itemItr = 0;allItemInfo!=null && itemItr<allItemInfo.length;itemItr++){
			var	itemId= allItemInfo[itemItr]['id'];
			if(itemId == itemInternalId){
				var	itemIdInternalId= allItemInfo[itemItr]['id']; 
				var	skuDescription = allItemInfo[itemItr]['salesdescription']; 
				var	vendor = allItemInfo[itemItr]['othervendor'];
				var	upcCode=allItemInfo[itemItr]['upccode'];
				var	itemId=allItemInfo[itemItr]['itemid'];
				var newcurrentRow = {
						'id':itemIdInternalId,
						'salesdescription':skuDescription,
						'othervendor':vendor,
						'upccode':upcCode,
						'itemid':itemId,
				};
				itemDetails.push(newcurrentRow);
			}
		}
		return itemDetails;
	}

	function _getOrderLineInformation(orderInternalId){
		var _orderInfoSearch = search.load({id:'customsearch_wms_orderlineinfo'});
		var _orderInfoFilter = _orderInfoSearch.filters;
		if(utility.isValueValid(orderInternalId))
		{
			_orderInfoFilter.push(search.createFilter({
				name:'internalid',
				operator:search.Operator.ANYOF,
				values:orderInternalId}));
		}
		_orderInfoSearch.filters = _orderInfoFilter;
		var _orderInfoObjDetails = utility.getSearchResultInJSON(_orderInfoSearch);
		return _orderInfoObjDetails;
	}

	function getMOPickTaskStageflagforAlreadystaged(whLocation,waveId){
		var picktaskSearch = search.load({
			id : 'customsearch_wmsse_partiallystaged_pick'
		});
		var picktaskSearchArr = picktaskSearch.filters;
		picktaskSearchArr.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: whLocation
		}));
		picktaskSearchArr.push(search.createFilter({
			name       : 'wavename',
			operator  : search.Operator.ANYOF,
			values      : waveId
		}));	
		picktaskSearchArr.filters = picktaskSearchArr;
		var pickTaskStgDtls = utility.getSearchResultInJSON(picktaskSearch);
		log.debug({title:'Stage Item Details :', details:pickTaskStgDtls});
		if(utility.isValueValid(pickTaskStgDtls) && pickTaskStgDtls.length!=0)
		{
			var stgOrderInternalIdArr = [];	
			var stgOrderIntIdArr = [];	
			for(var stgItr=0; stgItr<pickTaskStgDtls.length; stgItr++)
			{
				var stgOrderInternalIdArrObj = {};
				stgOrderInternalIdArrObj['internalid'] = pickTaskStgDtls[stgItr]['internalid'];
				stgOrderInternalIdArrObj['tranid'] = pickTaskStgDtls[stgItr]['tranid'];
				stgOrderInternalIdArr.push(stgOrderInternalIdArrObj);
				stgOrderIntIdArr.push(pickTaskStgDtls[stgItr]['internalid']);
			}
			log.debug({title:'Order Id array with tran id:', details:stgOrderInternalIdArr});
			log.debug({title:'Order Id array :', details:stgOrderIntIdArr});
			if(utility.isValueValid(stgOrderInternalIdArr) && stgOrderInternalIdArr.length > 0)
			{
				var orderSearch = search.load({id:'customsearch_wmsse_check_staged'});
				var orderSearchFilters = orderSearch.filters;
				if(utility.isValueValid(stgOrderIntIdArr))
				{
					orderSearchFilters.push(search.createFilter({
						name       : 'appliedtotransaction',
						join          : 'transaction',
						operator  : search.Operator.ANYOF,
						values      : stgOrderIntIdArr}));
				}
				if(utility.isValueValid(whLocation))
				{
					orderSearchFilters.push(search.createFilter({
						name:'location',
						operator:search.Operator.ANYOF,
						values:['@NONE@',whLocation]}));
				}
					orderSearchFilters.push(search.createFilter({
						name: 'quantitystaged',
						operator: search.Operator.EQUALTO,
						values: 0
					}));
			
				
				orderSearch.filters = orderSearchFilters;
				var	 objOrderSearchDetails =  utility.getSearchResultInJSON(orderSearch);
				if(objOrderSearchDetails.length >0 && utility.getSystemRuleValue('Allow staging for assigned picker only',whLocation) == 'Y'){
			    var inventoryDetailsIdArray=[];
			   for(var result=0;result<objOrderSearchDetails.length;result++)
	           {
	             inventoryDetailsIdArray.push(objOrderSearchDetails[result]['Internal ID']);
               }
              objOrderSearchDetails = getAssignedPickTaskStagingDetails(inventoryDetailsIdArray,'','Y');
	         	}
				log.debug({title:'objOrderSearchDetails list :', details:objOrderSearchDetails});
			}
		}
		return objOrderSearchDetails;
	}

	function getSOPickTaskStageflagforAlreadystaged(whLocation,ordId,pickingType){
		var orderSearch = search.load({id:'customsearch_wmsse_check_staged'});
		var orderSearchFilters = orderSearch.filters;
		if(utility.isValueValid(ordId))
		{
			orderSearchFilters.push(search.createFilter({
				name       : 'appliedtotransaction',
				join          : 'transaction',
				operator  : search.Operator.ANYOF,
				values      : ordId}));
		}
		if(utility.isValueValid(whLocation))
		{
			orderSearchFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',whLocation]}));
		}
		
	
			orderSearchFilters.push(search.createFilter({
				name: 'quantitystaged',
				operator: search.Operator.EQUALTO,
				values: 0
			}));
	
		orderSearch.filters = orderSearchFilters;
		var	 objOrderSearchDetails =  utility.getSearchResultInJSON(orderSearch);
		var assignedPickerSystemruleValue = utility.getSystemRuleValue('Allow staging for assigned picker only',whLocation);
		if(objOrderSearchDetails.length >0 ){
			var inventoryDetailsIdArray=[];
			for(var result=0;result<objOrderSearchDetails.length;result++)
	           {
	             inventoryDetailsIdArray.push(objOrderSearchDetails[result]['Internal ID']);
               }
              objOrderSearchDetails = getAssignedPickTaskStagingDetails(inventoryDetailsIdArray,pickingType,assignedPickerSystemruleValue);
		}
		return objOrderSearchDetails;
	}

	function getERPShipItems(){
		var shipItemvalues = search.load({id:'customsearch_wmsse_getshipmethod'});
		var	shipItemsSearchDetails = utility.getSearchResultInJSON(shipItemvalues);
		return shipItemsSearchDetails;
	}

	function _checkParentRecord(ordId){
		var orderSearch = search.load({id:'customsearch_wms_asnediparent'});
		var orderSearchFilters = orderSearch.filters;
		if(utility.isValueValid(ordId))
		{
			orderSearchFilters.push(search.createFilter({
				name       : 'custrecord_wmsse_parent_orderno',
				operator  : search.Operator.ANYOF,
				values      : ordId}));
		}
		orderSearch.filters = orderSearchFilters;
		var	 objOrderSearchDetails =  utility.getSearchResultInJSON(orderSearch);
		return objOrderSearchDetails;
	}

	function getMultiOrderPickTaskOrderDetails(whLocationId,waveId,pickTaskInternalId,transactionInternalArray,transactiontype,remainQty,isZonePickingEnabled)
	{
		var pickTaskSearch = search.load({id:'customsearch_wms_picktask_order_details'});
		if(transactiontype!='' && transactiontype=='SalesOrd')
		{
			 pickTaskSearch = search.load({id:'customsearch_wms_picktask_order_details'});
		}
		else if(transactiontype!='' && transactiontype=='TrnfrOrd')
		{
			 pickTaskSearch = search.load({id:'customsearch_wms_picktask_to_order_dtls'});
		}		
		var pickTaskFilters = pickTaskSearch.filters;
		if(utility.isValueValid(waveId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'waveName',
				operator:search.Operator.ANYOF,
				values:waveId
			}));
		}
		if(utility.isValueValid(whLocationId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',whLocationId] 
			}));
		}
		if(utility.isValueValid(pickTaskInternalId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'internalId',
				operator:search.Operator.ANYOF,
				values:[pickTaskInternalId] 
			}));
		}
		if(utility.isValueValid(transactionInternalArray) && utility.isValueValid(remainQty) && remainQty <= 0)
		{
			log.debug({title:'transactionInternalArray',details:transactionInternalArray});
			pickTaskFilters.push(search.createFilter({
				name: 'internalId',
				join : 'transaction',
				operator: search.Operator.NONEOF,
				values:  transactionInternalArray
			}));
		}
		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true)
		{
			log.debug('isZonePickingEnabled',isZonePickingEnabled);
				var orderSearchColumns = pickTaskSearch.columns;
				orderSearchColumns.push(search.createColumn({
					name:'zone',
					join:'binnumber'					
				}))
				
				pickTaskSearch.cloumns = orderSearchColumns;
			
		}
		pickTaskFilters.push(search.createFilter({
			name:'lineitemstatus',
			operator:search.Operator.NONEOF,
			values:["DONE"]
		}));
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
		log.debug({title:'Multi Order pickTaskSearch',details:objpicktaskSearchDetails});
		return objpicktaskSearchDetails;
	}

	function picktaskupdate(picktaskObj)
	{
		var whLocation =picktaskObj['whLocation'];
		var pickTaskId =picktaskObj['picktaskid'];
		var itemId=picktaskObj['itemId'];
		var pickQty=picktaskObj['pickqty'];
		var enterQty = picktaskObj['enterqty'];
		var fromBinId=picktaskObj['fromBinId'];
		var batchNo=picktaskObj['batchno'];
		var fromStatus=picktaskObj['statusInternalId'];
		var itemType=picktaskObj['itemType'];
		var totalLinepickqty = picktaskObj['totalLinepickqty'];
		var containerName = picktaskObj['containerName'];
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
		var currentUserId = runtime.getCurrentUser().id;
		var locUseBinsFlag = picktaskObj['locUseBinsFlag'];
		var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
      var isTallyScanRequired = picktaskObj['isTallyScanRequired'];

		var vPicktaskRec = record.load({type:'picktask',
			id:pickTaskId
		});
		var lineNo = (parseInt(0));
		var pickedQty = vPicktaskRec.getSublistValue({
			sublistId: 'pickactions',
			fieldId: 'pickedquantity',
			line : lineNo
		});
		if(!utility.isValueValid(pickedQty))
		{
			pickedQty = 0;
		}
		var totalLinePickedQty = Number(Big(pickedQty).plus(enterQty));
		vPicktaskRec.setSublistValue({
			sublistId: 'pickactions',
			fieldId: 'pickedquantity',
			line : lineNo,
			value: totalLinePickedQty
		});
		if(itemType != "noninventoryitem")
		{
			var compSubRecord = vPicktaskRec.getSublistSubrecord({
				sublistId :'pickactions',
				fieldId : 'inventorydetail',
				line : lineNo
			});
			var complinelength =compSubRecord.getLineCount({
				sublistId:'inventoryassignment'
			});
			if (itemType == "serializedinventoryitem" || itemType=="serializedassemblyitem") 
			{
				var serialSearchObj = search.load({type:'customrecord_wmsse_serialentry', id:'customsearch_wmsse_serialdetails_search'});
				serialSearchObj.filters.push(search.createFilter({
					name : 'custrecord_wmsse_ser_status',
					operator : search.Operator.IS,
					values : false
				}));
				serialSearchObj.filters.push(search.createFilter({
					name : 'custrecord_wmsse_ser_tasktype',
					operator : search.Operator.ANYOF,
					values : 3
				}));
				serialSearchObj.filters.push(search.createFilter({
					name : 'custrecord_wmsse_ser_item',
					operator : search.Operator.ANYOF,
					values : itemId
				}));
				serialSearchObj.filters.push(search.createFilter({
					name : 'name',
					operator : search.Operator.IS,
					values : pickTaskId
				}));
				var serialSearchResults = utility.getSearchResultInJSON(serialSearchObj);
              log.debug('serialSearchResults',serialSearchResults);
				var serialIdArr = [];
				if(serialSearchResults.length  > 0)
				{
					var intItr=0;
					for (var x = complinelength; intItr < serialSearchResults.length; x++)
					{
						serialIdArr.push(serialSearchResults[intItr].id);
						compSubRecord.insertLine({
							sublistId: 'inventoryassignment',
							line : x
						});
						compSubRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'binnumber',
							line : x,
							value : fromBinId
						});
						compSubRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'quantity',
							line : x,
							value : 1
						});
						if(utility.isValueValid(containerName))
						{
							if(populateWMSCartonFields == true)
							{
								compSubRecord.setSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'custrecord_wms_pickcarton',
									line : x,
									value : containerName
								});
							}
							
							compSubRecord.setSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'pickcarton',
								line : x,
								value : containerName
							});
						}
						compSubRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'receiptinventorynumber',
							line : x,
							value:  serialSearchResults[intItr]['custrecord_wmsse_ser_no']
						});
						if(inventoryStatusFeature) {
							compSubRecord.setSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'inventorystatus',
								line: x,
								value: serialSearchResults[intItr]['custrecord_serial_inventorystatus']
							});// 523782(core issue raised)
						}
						intItr++;
					}
					for (var serialId in serialIdArr) {

						var serialEntryRecId = serialIdArr[serialId];

						record.submitFields({
							type: 'customrecord_wmsse_serialentry',
							id: serialEntryRecId,
							values: {
								'custrecord_wmsse_ser_note1' : 'because of discontinue of serial number scanning we have marked this serial number as closed',
								'custrecord_wmsse_ser_status':true
							}
						});
					}
				}
			}
			else if ((itemType == "lotnumberedinventoryitem" || itemType=="lotnumberedassemblyitem" )&& isTallyScanRequired == true)  
					{
                      log.debug('into lot block for tally scan');
						var compinvlinelength =compSubRecord.getLineCount({
							sublistId:'inventoryassignment'
						});
						log.debug({title:'compinvlinelength',details:compinvlinelength});
						log.debug({title:'batchNo.length',details:batchNo.length});
						var intlotItr=0;
						for (var lotvalue = compinvlinelength; intlotItr < batchNo.length; lotvalue++)
							{
						compSubRecord.insertLine({
							sublistId: 'inventoryassignment',
							line : lotvalue
						});
						if(utility.isValueValid(fromBinId))
						{
						compSubRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'binnumber',
							line : lotvalue,
							value : fromBinId
						});
						}
						compSubRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'quantity',
							line : lotvalue,
							value : pickQty[intlotItr]
						});
						if(inventoryStatusFeature) {
							compSubRecord.setSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'inventorystatus',
								line: lotvalue,
								value: fromStatus[intlotItr]
							});
						}
						if(utility.isValueValid(batchNo))
						{
							compSubRecord.setSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'receiptinventorynumber',
								line :lotvalue,
								value :batchNo[intlotItr]// name
							});
						}
						if(utility.isValueValid(containerName))
						{
							
							if(populateWMSCartonFields == true)
							{
								compSubRecord.setSublistValue({
									sublistId : 'inventoryassignment',
									fieldId : 'custrecord_wms_pickcarton',
									line : lotvalue,
									value : containerName
								});
							}
							compSubRecord.setSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'pickcarton',
								line : lotvalue,
								value : containerName
							});
						}
						log.debug({title:'compSubRecord',details:compSubRecord});
						intlotItr++;
					}
					}
			else if(inventoryStatusFeature && (itemType == "inventoryitem" || itemType=="assemblyitem" )&& isTallyScanRequired == true)
			{
				log.debug('into inv block for tally scan with different status');
				var compinvlinelength = compSubRecord.getLineCount({
					sublistId: 'inventoryassignment'
				});

				//log.debug({title:'fromStatus.length',details:fromStatus.length});

				var intStatusItr=0;
				for (var statusvalue = compinvlinelength; intStatusItr < fromStatus.length; statusvalue++)
				{

				compSubRecord.insertLine({
					sublistId: 'inventoryassignment',
					line: statusvalue
				});
				compSubRecord.setSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'binnumber',
					line: statusvalue,
					value: fromBinId
				});
				compSubRecord.setSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'quantity',
					line: statusvalue,
					value: pickQty[intStatusItr]
				});

				if (utility.isValueValid(containerName)) {
					if (populateWMSCartonFields == true) {
						compSubRecord.setSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'custrecord_wms_pickcarton',
							line: statusvalue,
							value: containerName
						});
					}

					compSubRecord.setSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'pickcarton',
						line: statusvalue,
						value: containerName
					});
				}
				if (inventoryStatusFeature) {
					compSubRecord.setSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'inventorystatus',
						line: statusvalue,
						value: fromStatus[intStatusItr]
					});
				}  // 523782(core issue raised)
					intStatusItr++;
			}
			}
		else
			{log.debug('intooo normal lot/inv block for without tally scan');
				var compinvlinelength =compSubRecord.getLineCount({
					sublistId:'inventoryassignment'
				});
				compSubRecord.insertLine({
					sublistId: 'inventoryassignment',
					line : compinvlinelength
				});
				compSubRecord.setSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'binnumber',
					line :compinvlinelength,
					value : fromBinId
				});
				compSubRecord.setSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'quantity',
					line : compinvlinelength,
					value : enterQty
				});
				if(utility.isValueValid(batchNo))
				{
					compSubRecord.setSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'receiptinventorynumber',
						line : compinvlinelength,
						value : batchNo
					});
				}
				if(utility.isValueValid(containerName))
				{					
					if(populateWMSCartonFields == true)
					{
						compSubRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'custrecord_wms_pickcarton',
							line : compinvlinelength,
							value : containerName
						});
					}				
					
					compSubRecord.setSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'pickcarton',
						line : compinvlinelength,
						value : containerName
					});
				}
				if(inventoryStatusFeature) {
					compSubRecord.setSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'inventorystatus',
						line: compinvlinelength,
						value: fromStatus
					});
				}  // 523782(core issue raised)
			}
		}
		if(utility.isValueValid(locUseBinsFlag) && locUseBinsFlag == false)
		{
			var lineRemainingQty = vPicktaskRec.getSublistValue({
				sublistId : 'pickactions',
				fieldId : 'remainingquantity', 
				line : lineNo
			});
			if(parseFloat(lineRemainingQty) == parseFloat(enterQty))
			{
				vPicktaskRec.setSublistValue({
					sublistId: 'pickactions',
					fieldId: 'status',
					line : lineNo,
					value: 'DONE'
				});

			}
			
		}
		
		var picktaskrecId=vPicktaskRec.save();
		return picktaskrecId;
	}
	function updatePickTaskToDoneForSingleOrder(pickTaskId,markOpenPicksDoneAutomaticallySysRuleValue,status)
	{
		var picktaskrecId;
		var vPicktaskRec = record.load({type:'picktask',
			id:pickTaskId
		});
		var lineNo = (parseInt(0));
		var lineRemainingQty = vPicktaskRec.getSublistValue({
			sublistId : 'pickactions',
			fieldId : 'remainingquantity', 
			line : lineNo
		});
		var pickedQty = vPicktaskRec.getSublistValue({
			sublistId : 'pickactions',
			fieldId : 'pickedquantity',
			line : lineNo
		});
		if(! utility.isValueValid(pickedQty)){
			pickedQty = 0;
		}

		if(markOpenPicksDoneAutomaticallySysRuleValue == undefined ||
			! utility.isValueValid(markOpenPicksDoneAutomaticallySysRuleValue || (utility.isValueValid(markOpenPicksDoneAutomaticallySysRuleValue) && markOpenPicksDoneAutomaticallySysRuleValue != "Y"))){
			markOpenPicksDoneAutomaticallySysRuleValue = "N";
		}

		if(lineRemainingQty == 0 || (markOpenPicksDoneAutomaticallySysRuleValue == "Y" && pickedQty > 0))
		{
			vPicktaskRec.setSublistValue({
				sublistId: 'pickactions',
				fieldId: 'status',
				line : lineNo,
				value: status
			});
			picktaskrecId=vPicktaskRec.save();

		}
		return picktaskrecId;
	}


	//function updatePickTaskStatusFormultiOrder(pickTaskId,pickTaskLineNo,pickTaskLineOrderId,markOpenPicksDoneAutomaticallySysRuleValue)
			function updatePickTaskStatusFormultiOrder(pickTaskId,markOpenPicksDoneAutomaticallySysRuleValue,itemType)
	{
				log.debug('process start to done for partial picking:',pickTaskId );

				var vPicktaskRec = record.load({type:'picktask',
					id:pickTaskId
				});
				var pickActionLinelength = vPicktaskRec.getLineCount({
					sublistId:'pickactions'
				});

				for (var pickActionItr = 0; pickActionItr < pickActionLinelength; pickActionItr++) {

				/*	var pickTaskLine = vPicktaskStgRec.getSublistValue({
						sublistId: 'pickactions',
						fieldId: 'linenumber',
						line : pickActionItr
					});

					var pickTaskOrderId = vPicktaskStgRec.getSublistValue({
						sublistId: 'pickactions',
						fieldId: 'ordernumber',
						line : pickActionItr
					});
*/
					var lineRemainingQty = vPicktaskRec.getSublistValue({
						sublistId : 'pickactions',
						fieldId : 'remainingquantity',
						line : pickActionItr
					});

					var pickedQty = vPicktaskRec.getSublistValue({
						sublistId : 'pickactions',
						fieldId : 'pickedquantity',
						line : pickActionItr
					});
					if(! utility.isValueValid(pickedQty)){
						pickedQty = 0;
					}

					if(markOpenPicksDoneAutomaticallySysRuleValue == undefined ||
						! utility.isValueValid(markOpenPicksDoneAutomaticallySysRuleValue || (utility.isValueValid(markOpenPicksDoneAutomaticallySysRuleValue) && markOpenPicksDoneAutomaticallySysRuleValue != "Y"))){
						markOpenPicksDoneAutomaticallySysRuleValue = "N";
					}

					if(lineRemainingQty == 0 || (markOpenPicksDoneAutomaticallySysRuleValue == "Y" && pickedQty > 0)) {
						if ((utility.isValueValid(itemType)) && (itemType == 'NonInvtPart' || itemType == 'Service' || itemType == 'noninventoryitem'))
						{
							vPicktaskRec.setSublistValue({
								sublistId: 'pickactions',
								fieldId: 'status',
								line: pickActionItr,
								value: 'STAGED'
							});
						}
						else
						{
							vPicktaskRec.setSublistValue({
								sublistId: 'pickactions',
								fieldId: 'status',
								line : pickActionItr,
								value: 'DONE'
							});
						}
					}

				}
		vPicktaskRec.save();
				//log.debug('process end :', runtime.getCurrentScript().getRemainingUsage());
			}

	function getPickTaskDetails(pickTaskDetails)
	{
		var getOrderInternalId = pickTaskDetails['orderInternalId'];
		var strLocation = pickTaskDetails["whLocationId"];
		var transactionType = pickTaskDetails["transactionType"];
		var pickTaskName = pickTaskDetails["pickTaskName"];
		var pickTaskSearch = search.load({id:'customsearch_wmsse_picktask_list'});
		var pickTaskFilters = pickTaskSearch.filters;
		if(utility.isValueValid(getOrderInternalId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.ANYOF,
				values:getOrderInternalId}));
		}
		if(utility.isValueValid(pickTaskName))
		{
			pickTaskFilters.push(search.createFilter({
				name:'name',
				operator:search.Operator.EQUALTO,
				values:pickTaskName}));
		}
		if(utility.isValueValid(transactionType))
		{
			pickTaskFilters.push(search.createFilter({
				name:'type',
				join:'transaction',
				operator:search.Operator.IS,
				values:transactionType}));
		}
		if(utility.isValueValid(strLocation))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
		log.debug({title:'pickTaskSearch',details:objpicktaskSearchDetails});
		return objpicktaskSearchDetails;
	}

	function getPickingOrderDetails(orderParams,callBackFuncntion)
	{
		var getOrderName = orderParams.orderName;		
		var strLocation = orderParams.whLocationId;
		var transactionType = orderParams.transactionType;
		var isZonePickingEnabled = orderParams.isZonePickingEnabled;
		var currentUserId=orderParams.currentUserId;
		var orderSearch = '';
		if(transactionType == 'TrnfrOrd')
		{
			orderSearch = search.load({id:'customsearch_wmsse_toorders_list'});	
		}
		else
		{
			orderSearch = search.load({id:'customsearch_wmsse_orders_list'});	
		}
		var orderSearchFilters = orderSearch.filters;
		if(utility.isValueValid(getOrderName))
		{
			orderSearchFilters.push(search.createFilter({
				name:'tranid',
				join:'transaction',
				operator:search.Operator.IS,
				values:getOrderName}));
		}
		if(utility.isValueValid(strLocation))
		{
			orderSearchFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		if(utility.isValueValid(transactionType))
		{
			orderSearchFilters.push(search.createFilter({
				name:'type',
				join:'transaction',
				operator:search.Operator.IS,
				values:transactionType}));
		}

		if(utility.isValueValid(currentUserId)) {
			orderSearchFilters.push(search.createFilter({
				name: 'picker',
				operator: search.Operator.ANYOF,
				values: ['@NONE@', currentUserId]
			}));
		}
		orderSearch.filters = orderSearchFilters;
		
		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
			var orderSearchColumns = orderSearch.columns;
			orderSearchColumns.push(search.createColumn({
				name:'zone',
				join:'binnumber',
				summary:'group'
			}))
			
			orderSearch.cloumns = orderSearchColumns;
		}

		var	 objOrderSearchDetails = utility.getSearchResultInJSON(orderSearch,callBackFuncntion);
		log.debug({title:'objOrderSearchDetails',details:objOrderSearchDetails});
		return objOrderSearchDetails;
	}

	function getPickingWaveDetails(orderParams)
	{
		log.debug({title:'orderParams',details:orderParams});
		var getWaveName = orderParams.waveName;		
		var strLocation = orderParams.whLocationId;
		var isZonePickingEnabled = orderParams.isZonePickingEnabled;
		
		var waveSearch = '';
		waveSearch = search.load({id:'customsearch_wms_multiorder_wave_valid'});
		var waveSearchFilters = waveSearch.filters;
		if(utility.isValueValid(getWaveName))
		{
			waveSearchFilters.push(search.createFilter({
				name:'waveName',				
				operator:search.Operator.ANYOF,
				values:getWaveName}));
		}
		if(utility.isValueValid(strLocation))
		{
			waveSearchFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		var currentUserID = runtime.getCurrentUser();	
		waveSearchFilters.push(search.createFilter({
			name:'picker',
			operator:search.Operator.ANYOF,
			values:['@NONE@',currentUserID.id]}));
		waveSearch.filters = waveSearchFilters;
		
		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
			var waveSearchColumns = waveSearch.columns;
			waveSearchColumns.push(search.createColumn({
				name:'zone',
				join:'binnumber',
				summary:'group'
			}));
			waveSearchColumns.push(search.createColumn({
				name:'picker',
				summary:'group'
			}));
			
			waveSearch.cloumns = waveSearchColumns;
		}
		
		
		var	 objwaveSearchDetails = utility.getSearchResultInJSON(waveSearch);
		log.debug({title:'objwaveSearchDetails',details:objwaveSearchDetails});
		return objwaveSearchDetails;
	}

	function getwavePickTaskDetails(pickTaskDetails)
	{
		var getWaveName = pickTaskDetails['waveName'];
		var strLocation = pickTaskDetails["whLocationId"];
		var transactionType = pickTaskDetails["transactionType"];
		var pickTaskName = pickTaskDetails["pickTaskName"];
		var pickTaskSearch = search.load({id:'customsearch_wms_multiorder_picktasklist'});
		var pickTaskFilters = pickTaskSearch.filters;
		if(utility.isValueValid(getWaveName))
		{
			pickTaskFilters.push(search.createFilter({
				name:'wavename',			
				operator:search.Operator.ANYOF,
				values:getWaveName}));
		}
		if(utility.isValueValid(pickTaskName))
		{
			pickTaskFilters.push(search.createFilter({
				name:'name',
				operator:search.Operator.EQUALTO,
				values:pickTaskName}));
		}
		if(utility.isValueValid(strLocation))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
		log.debug({title:'pickTaskSearch',details:objpicktaskSearchDetails});
		return objpicktaskSearchDetails;
	}

	function _validateStageBin(picktaskObj)
	{
		var stageBinId = '';
		var binName = picktaskObj['binName'];
		var warehouseLocationId = picktaskObj['whLocationId'];
		var binlocationSearch =  search.load({
			id:'customsearch_wmsse_pickstagebin_validate'
		});
		var binFilters = binlocationSearch.filters;
		if(utility.isValueValid(warehouseLocationId))
		{
			binFilters.push(search.createFilter({
				name : 'location',
				operator : search.Operator.ANYOF,
				values : warehouseLocationId
			}));
		}
		binFilters.push(search.createFilter({
			name : 'binnumber',
			operator : search.Operator.IS,
			values : binName
		}));
		binlocationSearch.filters = binFilters;
		var binRecord = utility.getSearchResultInJSON(binlocationSearch);
		if(binRecord.length > 0)
		{
			stageBinId = binRecord[0]['internalid'];
		}
		return stageBinId;
	}

	function _updateStageBin(picktaskObj)
	{
		var isPickTaskUpdated = 'T';// change it to 'F' when the below comments are removed
		var whLocation =picktaskObj.whLocationId;
		var ordId =picktaskObj.orderInternalId;
		var stageBinId=picktaskObj.stageBinInternalId;
		var pickingType=picktaskObj.pickingType;
		var waveId=picktaskObj.waveId;
		var pickTaskIdarr=[];
		var selectedOrderIdArr = picktaskObj.selectedOrderIdArr ;
		var isZonePickingEnabled = picktaskObj.isZonePickingEnabled;
		var selectedZones = picktaskObj.selectedZones;
		var markOpenPicksDoneAutomaticallySysRuleVal = picktaskObj.markOpenPicksDoneAutomaticallySysRule;
		
		log.debug({title:'whLocation',details:whLocation});
		log.debug({title:'ordId',details:ordId});
		log.debug({title:'stageBinId',details:stageBinId});
		var	 objOrderSearchDetails = getPicktasksDetailsReadyToStage(picktaskObj);
		var duplicate_pickTaskArr = {};
		var OrderSearchDetailsLength =  objOrderSearchDetails.length;
		if(OrderSearchDetailsLength > 0){
			for(var task = 0 ; task < OrderSearchDetailsLength; task++)	{
				if(!duplicate_pickTaskArr[objOrderSearchDetails[task].id]){
					pickTaskIdarr.push(objOrderSearchDetails[task]);
					duplicate_pickTaskArr[objOrderSearchDetails[task].id] = true;
				}
			}
		}
		var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
		var pickTaskStagedarr=[];
		if(markOpenPicksDoneAutomaticallySysRuleVal == undefined ||
			!utility.isValueValid(markOpenPicksDoneAutomaticallySysRuleVal) || (utility.isValueValid(markOpenPicksDoneAutomaticallySysRuleVal) && markOpenPicksDoneAutomaticallySysRuleVal != 'Y')){
			markOpenPicksDoneAutomaticallySysRuleVal = "N";
		}
		log.debug('usage before picktask update from picked to done in single step :', runtime.getCurrentScript().getRemainingUsage());
		//below function updates pick action status to done directly after selecting staging bin with single step update
		var newLinetoStage = updatePickTaskStageBin(pickTaskIdarr,stageBinId,populateWMSCartonFields,pickTaskStagedarr,'N',isZonePickingEnabled,selectedOrderIdArr,selectedZones,pickingType,markOpenPicksDoneAutomaticallySysRuleVal);
		log.debug('newLinetoStage',newLinetoStage);

		if(pickTaskStagedarr.length > 0 && newLinetoStage == 'N' &&
			pickTaskStagedarr.indexOf(stageBinId)==-1 && markOpenPicksDoneAutomaticallySysRuleVal == "N"){
			isPickTaskUpdated = 'N';
		}
		log.debug('usage after update picktask from picked to done in single step :', runtime.getCurrentScript().getRemainingUsage());
		return isPickTaskUpdated;
	}

	function getStagedPickTaskDetails(pickTaskDetails,containerEnabled)
	{
		var getOrderInternalId = pickTaskDetails['orderInternalId'];
		var warehouseLocationId = pickTaskDetails["whLocationId"];
		var stageBinInternalId = pickTaskDetails["stageBinInternalId"];
		var waveName = pickTaskDetails["waveName"];
		var restrictStageProcessFlag = utility.getSystemRuleValue('Allow staging for assigned picker only',warehouseLocationId);
		log.debug({title:'stageBinInternalId',details:stageBinInternalId});
		var pickTaskSearch = search.load({id:'customsearch_wmsse_stagedpicktask_detail'});
		var pickTaskFilters = pickTaskSearch.filters;
		if(utility.isValueValid(getOrderInternalId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.ANYOF,
				values:getOrderInternalId}));
		}
		if(utility.isValueValid(warehouseLocationId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',warehouseLocationId]}));
		}
		if(utility.isValueValid(stageBinInternalId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'stagingbin',
				operator:search.Operator.ANYOF,
				values:stageBinInternalId}));
		}
		if(utility.isValueValid(waveName))
		{
			pickTaskFilters.push(search.createFilter({
				name:'waveName',
				operator:search.Operator.IS,
				values:waveName
			}));
		}
		if(restrictStageProcessFlag == 'Y'){
			pickTaskFilters.push(search.createFilter({
				name:'picker',
				operator:search.Operator.ANYOF,
				values:[runtime.getCurrentUser().id]}));
		}
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
		log.debug({title:'pickTaskSearch',details:objpicktaskSearchDetails});
		if(objpicktaskSearchDetails.length > 0)
		{
			for(var pickTaskItr=0; pickTaskItr<objpicktaskSearchDetails.length; pickTaskItr++)
			{

				objpicktaskSearchDetails[pickTaskItr]['lineitempickedquantity']=
					objpicktaskSearchDetails[pickTaskItr]['lineitempickedquantity'] + ' ' +objpicktaskSearchDetails[pickTaskItr]['unitsText'];
			}
		}
		var stgItmContrTempArr = [];
		if(utility.isValueValid(containerEnabled) && containerEnabled == 'Y' && utility.isValueValid(objpicktaskSearchDetails) && objpicktaskSearchDetails.length!=0)
		{
			
			var transactionid = objpicktaskSearchDetails[0]['tranid'];

			var pickTaskStgContrDtls = getPickCartonRelatedData(getOrderInternalId,warehouseLocationId,restrictStageProcessFlag);

			log.debug({title:'container list :', details:pickTaskStgContrDtls});
			if(utility.isValueValid(pickTaskStgContrDtls) && pickTaskStgContrDtls.length > 0)
			{
				var cartonObject = {};
				var finalPickTaskStgDtls = {};
				for(var stgContrItr=0; stgContrItr<pickTaskStgContrDtls.length; stgContrItr++)
				{
					if(!cartonObject[pickTaskStgContrDtls[stgContrItr].pickcarton]){
						finalPickTaskStgDtls = {};
						cartonObject[pickTaskStgContrDtls[stgContrItr].pickcarton] = true;
						finalPickTaskStgDtls.itemText = 1;
						finalPickTaskStgDtls.custrecord_wms_pickcarton = pickTaskStgContrDtls[stgContrItr].pickcarton;
						finalPickTaskStgDtls.lineitempickedquantity = pickTaskStgContrDtls[stgContrItr].quantitystaged;
						finalPickTaskStgDtls.tranid = transactionid;
						stgItmContrTempArr.push(finalPickTaskStgDtls);
					}
					else{
						for(var c=0;c<stgItmContrTempArr.length;c++){
							if(stgItmContrTempArr[c].custrecord_wms_pickcarton == pickTaskStgContrDtls[stgContrItr].pickcarton){
								stgItmContrTempArr[c].itemText = parseInt(stgItmContrTempArr[c].itemText)+ 1;
								stgItmContrTempArr[c].lineitempickedquantity = parseInt(stgItmContrTempArr[c].lineitempickedquantity)+ parseInt(pickTaskStgContrDtls[stgContrItr]['quantitystaged']);
							}
						}
					}
				}
			}	
			log.debug({title:'stgItmContrTempArr list :', details:stgItmContrTempArr});
			return stgItmContrTempArr;
		}
		else
		{
			log.debug({title:'objpicktaskSearchDetails list :', details:objpicktaskSearchDetails});
			return objpicktaskSearchDetails;
		}
	}

	function getMultiOrderWaveList(wareHouseLocation, currentUserId,isZonePickingEnabled,callBackFuncntion)
	{
		var waveDetailsSrch = search.load({
			id : 'customsearch_wms_multiorder_wave_list'
		});
		var waveDtlFilterArr = waveDetailsSrch.filters;
		waveDtlFilterArr.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: wareHouseLocation
		}));
		/*waveDtlFilterArr.push(search.createFilter({
			name: 'picker',
			operator: search.Operator.ANYOF,
			values:  ['@NONE@', currentUserId]
		}));*/
		waveDtlFilterArr.filters = waveDtlFilterArr;
		log.debug({title:'isZonePickingEnabled', details: isZonePickingEnabled});
		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true){
			var waveDetailsSrchColumns = waveDetailsSrch.columns;
			waveDetailsSrchColumns.push(search.createColumn({
				name:'zone',
				join:'binnumber',
				summary:'group'
			}))
			
			waveDetailsSrch.cloumns = waveDetailsSrchColumns;
		}
		
		return utility.getSearchResultInJSON(waveDetailsSrch,callBackFuncntion);
	}

	function getMultiOrderContainerList(wareHouseLocation,itemName,transactionInternalId,currentUserId,waveId,zoneIdArr)
	{
		zoneIdArr = zoneIdArr || [];
		var containerDetailsSrch = search.load({
			id : 'customsearch_wms_multiorder_containr_lst'
		});
		var containerDtlFilterArr = containerDetailsSrch.filters;
		containerDtlFilterArr.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: wareHouseLocation
		}));		

		/*
		 * containerDtlFilterArr.push(search.createFilter({ name: 'item',
		 * operator: search.Operator.ANYOF, values: itemName }));
		 */	

		containerDtlFilterArr.push(search.createFilter({
			name       : 'appliedtotransaction',
			join          : 'transaction',
			operator  : search.Operator.IS,
			values      : transactionInternalId
		}));
		if(utility.isValueValid(waveId)){
		containerDtlFilterArr.push(search.createFilter({
			name       : 'internalid',
			join          : 'transaction',
			operator  : search.Operator.ANYOF,
			values      : waveId
		}));
		}
		if(utility.isValueValid(zoneIdArr) && zoneIdArr.length > 0){
			containerDtlFilterArr.push(search.createFilter({
				name       : 'zone',
				join          : 'binnumber',
				operator  : search.Operator.ANYOF,
				values      : zoneIdArr
			}));
		}
	
		containerDtlFilterArr.push(search.createFilter({
			name       : 'pickcarton',
			operator  : search.Operator.ISNOTEMPTY
		}));
	

		containerDtlFilterArr.filters = containerDtlFilterArr;
		var ContainerListDetailsResult = utility.getSearchResultInJSON(containerDetailsSrch);
		return ContainerListDetailsResult;
	}

	function getMultiOrderStageItemList(whLocation,waveId, stageBinInternalId, containerEnabled,isZonePickingEnabled)
	{var restrictStageProcessFlag = utility.getSystemRuleValue('Allow staging for assigned picker only',whLocation);
		var picktaskSearch = search.load({
			id : 'customsearch_wms_stage_item_list'
		});
		var picktaskSearchArr = picktaskSearch.filters;
		picktaskSearchArr.push(search.createFilter({
			name: 'location',
			operator: search.Operator.ANYOF,
			values: whLocation
		}));
		picktaskSearchArr.push(search.createFilter({
			name       : 'wavename',
			operator  : search.Operator.ANYOF,
			values      : waveId
		}));	
		if(isZonePickingEnabled != true){
			picktaskSearchArr.push(search.createFilter({
				name       : 'stagingbin',
				operator  : search.Operator.IS,
				values      : stageBinInternalId
			}));
		}
		if(restrictStageProcessFlag == 'Y'){
			picktaskSearchArr.push(search.createFilter({
				name:'picker',
				operator:search.Operator.ANYOF,
				values:[runtime.getCurrentUser().id]}));
		}
		picktaskSearchArr.filters = picktaskSearchArr;
		var pickTaskStgDtls = utility.getSearchResultInJSON(picktaskSearch);
		log.debug({title:'Stage Item Details :', details:pickTaskStgDtls});
		if(utility.isValueValid(containerEnabled) && containerEnabled == 'Y' && utility.isValueValid(pickTaskStgDtls) && pickTaskStgDtls.length!=0)
		{
			var stgOrderInternalIdArr = [];	
			for(var stgItr=0; stgItr<pickTaskStgDtls.length; stgItr++)
			{
				var stgOrderInternalIdArrObj = {};
				stgOrderInternalIdArrObj['internalid'] = pickTaskStgDtls[stgItr]['internalid'];
				stgOrderInternalIdArrObj['tranid'] = pickTaskStgDtls[stgItr]['tranid'];
				stgOrderInternalIdArr.push(stgOrderInternalIdArrObj);
			}
//			log.debug({title:'Order Id array :', details:stgOrderInternalIdArr});
			if(utility.isValueValid(stgOrderInternalIdArr) && stgOrderInternalIdArr.length > 0)
			{
				var stgItemContrListArr = [];
				var stgItmContrTempArr = [];
				for(var stgOrdItr =0; stgOrdItr < stgOrderInternalIdArr.length; stgOrdItr++)
				{
					var stgItemContrListObj = {};
					var orderId = stgOrderInternalIdArr[stgOrdItr]['internalid'];
					var pickTaskStgContrDtls = getPickCartonRelatedData(orderId,whLocation,restrictStageProcessFlag);
					
					log.debug({title:'container list :', details:pickTaskStgContrDtls});
					if(utility.isValueValid(pickTaskStgContrDtls) && pickTaskStgContrDtls.length > 0)
					{
						var cartonObject = {};
						var finalPickTaskStgDtls = {};
						for(var stgContrItr=0; stgContrItr<pickTaskStgContrDtls.length; stgContrItr++)
						{
							if(!cartonObject[pickTaskStgContrDtls[stgContrItr].pickcarton]){
								finalPickTaskStgDtls = {};
								cartonObject[pickTaskStgContrDtls[stgContrItr].pickcarton] = true;
								finalPickTaskStgDtls.itemText = 1;
								finalPickTaskStgDtls.custrecord_wms_pickcarton = pickTaskStgContrDtls[stgContrItr].pickcarton;
								finalPickTaskStgDtls.lineitempickedquantity = pickTaskStgContrDtls[stgContrItr].quantitystaged;
								if(isZonePickingEnabled){
									finalPickTaskStgDtls.stagingbin = pickTaskStgContrDtls[stgContrItr].stagingbin;
								}
								if(pickTaskStgContrDtls[stgContrItr].ordernumber) {
									finalPickTaskStgDtls.tranid = pickTaskStgContrDtls[stgContrItr].ordernumber.split('#')[1];
								}
								stgItmContrTempArr.push(finalPickTaskStgDtls);
							}
							else{
								for(var c=0;c<stgItmContrTempArr.length;c++){
									if(stgItmContrTempArr[c].custrecord_wms_pickcarton == pickTaskStgContrDtls[stgContrItr].pickcarton){
										stgItmContrTempArr[c].itemText = parseInt(stgItmContrTempArr[c].itemText)+ 1;
										stgItmContrTempArr[c].lineitempickedquantity = parseInt(stgItmContrTempArr[c].lineitempickedquantity)+ parseInt(pickTaskStgContrDtls[stgContrItr]['quantitystaged']);
										if(isZonePickingEnabled){
											stgItmContrTempArr[c].stagingbin = pickTaskStgContrDtls[stgContrItr].stagingbin;
										}
									}
								}
							}
						}
					}	
				}
			}
		}
		if(containerEnabled == 'Y' && utility.isValueValid(stgItmContrTempArr)){

			var pickTaskStgDtlsArrr =[];
			if(stgItmContrTempArr.length!=0){
				log.debug({title:'Stage Container Details :', details:'Inside stage container arry return'});
				for(var i=0; i<stgItmContrTempArr.length; i++)
				{
					var pickTaskStgcontrDtls = {};
					pickTaskStgcontrDtls['item'] = stgItmContrTempArr[i]['item'];
					pickTaskStgcontrDtls['custrecord_wms_pickcarton'] = stgItmContrTempArr[i]['custrecord_wms_pickcarton'];
					pickTaskStgcontrDtls['lineitempickedquantity'] = stgItmContrTempArr[i]['quantity'];
					pickTaskStgcontrDtls['tranid'] = stgItmContrTempArr[i]['tranid'];
					if(isZonePickingEnabled){
					pickTaskStgcontrDtls['stagingbinText'] = stgItmContrTempArr[i]['stagingbin'];
					}
					pickTaskStgDtlsArrr.push(pickTaskStgcontrDtls);
				}
				log.debug({title:'Stage Container Array Details2 :', details:pickTaskStgDtlsArrr});
			}
			return pickTaskStgDtlsArrr;
		}else{
			return pickTaskStgDtls;
		}
	}
	function multiOrderPicktaskUpdate(picktaskObj)
	{
		log.debug({title:'multipicktaskObj',details:picktaskObj});
		var pickQty=parseFloat(picktaskObj.pickqty);
		var invDetailLineObj = {};
		var totalLotqty=0;
		var pickActionLineLookup ={};
		var itemWiseDataObj ={};
		var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
		picktaskObj.populateWMSCartonFields = populateWMSCartonFields;
		
		if(picktaskObj.tallyLoopObj != undefined && picktaskObj.tallyLoopObj != {}){
		 invDetailLineObj = picktaskObj.tallyLoopObj[picktaskObj.orderInternalId + '-' + picktaskObj.line];
		}
		var vPicktaskRec= record.load({
			type : 'picktask',
			id : picktaskObj.picktaskid,
		});
		var pickTaskItemcount = vPicktaskRec.getLineCount({
			sublistId: 'pickactions'
		});
		 for(var lineNumber = 0; lineNumber < pickTaskItemcount;lineNumber++){
		 	var pickActionId = vPicktaskRec.getSublistValue({
                                 sublistId: 'pickactions',
                                 fieldId: 'id',
                                 line: lineNumber
                                   });
		 	var pickTaskOrderId = vPicktaskRec.getSublistValue({sublistId: 'pickactions',
		 		                                               fieldId: 'ordernumber',
		 		                                               line:lineNumber});
			var lineId = vPicktaskRec.getSublistValue({sublistId: 'pickactions',
				                                      fieldId: 'linenumber',
				                                      line:lineNumber});
             pickActionLineLookup[pickTaskOrderId + '-' + lineId] = { 'lineNumber': lineNumber };
		 }
		
		  var Ifitr= pickActionLineLookup[picktaskObj.orderInternalId + '-' + picktaskObj.line].lineNumber;
			
				vPicktaskRec.setSublistValue({
					sublistId: 'pickactions',
					fieldId: 'pickedquantity',
					line : parseInt(Ifitr),
					value: picktaskObj.totalLinepickqty 
				});
				if(picktaskObj.itemType != "noninventoryitem")
				{
					compSubRecord = vPicktaskRec.getSublistSubrecord({
						sublistId :'pickactions',
						fieldId : 'inventorydetail',
						line : parseInt(Ifitr)
					});
					var invDetailLinelength =compSubRecord.getLineCount({
						sublistId:'inventoryassignment'
					});
					if (picktaskObj.itemType == "serializedinventoryitem" || picktaskObj.itemType=="serializedassemblyitem") 
					{
						var SrchRecordSerials = getPickedSerials(picktaskObj);
						if(SrchRecordSerials.length > 0)
						{
							var intItr=0;
							var serialsScannedCount = SrchRecordSerials.length;
							for (var lineNo = invDetailLinelength; intItr < serialsScannedCount; lineNo++)
							{   itemWiseDataObj.quantity = 1;
								itemWiseDataObj.invNumber =  SrchRecordSerials[intItr]['custrecord_wmsse_ser_no'];
								itemWiseDataObj.invStatus = SrchRecordSerials[intItr]['custrecord_serial_inventorystatus'];
								addInventoryDetailLine(compSubRecord,lineNo,picktaskObj,itemWiseDataObj);
								intItr++;
							}
						   var serialNotes ='because of discontinue of serial number scanning we have marked this serial number as closed';
							for (var iterator = 0; iterator < serialsScannedCount; iterator++) {
								utility.closeSerialEntryStatusCycleCount(SrchRecordSerials[iterator], serialNotes);
							}
						}
					}
					else if(picktaskObj.isTallyScanRequired){
					 for(var invDetailLine in invDetailLineObj){
						itemWiseDataObj.quantity = invDetailLineObj[invDetailLine].quantity;
						itemWiseDataObj.invNumber =  invDetailLineObj[invDetailLine].lotName;
						itemWiseDataObj.invStatus = invDetailLineObj[invDetailLine].statusId;
						addInventoryDetailLine(compSubRecord,invDetailLinelength,picktaskObj,itemWiseDataObj);
						invDetailLinelength++;
	                    totalLotqty=Number(Big(totalLotqty).plus(invDetailLineObj[invDetailLine].quantity));
					   }
					}
					else
					{
						itemWiseDataObj.quantity = pickQty;
						itemWiseDataObj.invNumber =  picktaskObj.batchno;
						itemWiseDataObj.invStatus = picktaskObj.statusInternalId;
						addInventoryDetailLine(compSubRecord,invDetailLinelength,picktaskObj,itemWiseDataObj);
					}
				}
				if(picktaskObj.locUseBinsFlag === false)
				{
					picktaskObj.totalLotqty = totalLotqty;
					updatePicktaskToDone(vPicktaskRec,Ifitr,picktaskObj);
                }
			
		var picktaskrecId=vPicktaskRec.save();
		log.debug('recId1111---',picktaskrecId);
		return picktaskrecId;
	}

	function fnEmptyBinOrNoStock(pickTaskId)
	{
		var pickQty=0;
		var vPicktaskRec= record.load({
			type : 'picktask',
			id : pickTaskId
		});
		var pickTaskItemcount = vPicktaskRec.getLineCount({
			sublistId: 'pickactions'
		});
		var picktaskrecId= '';
		for(var Ifitr=0;Ifitr<pickTaskItemcount;Ifitr++)
		{
			var pickTaskOrderId = vPicktaskRec.getSublistValue({sublistId: 'pickactions',fieldId: 'ordernumber',line:Ifitr});
			var pickedQuantity = vPicktaskRec.getSublistValue({sublistId: 'pickactions',fieldId: 'pickedquantity',line:Ifitr});
			if(!utility.isValueValid(pickedQuantity))
			{
				vPicktaskRec.setSublistValue({
					sublistId: 'pickactions',
					fieldId: 'pickedquantity',
					line : parseFloat(Ifitr),
					value: pickQty
				});
			}
			picktaskrecId=vPicktaskRec.save();
		}
		return picktaskrecId;
	}

	function getMultiOrderPickTaskCompletedDetails(whLocationId,waveName,currentUser,callBackFunction,pickingType)
	{
		var pickTaskSearch = search.load({id:'customsearch_wms_multiorder_completelist'});
		var pickTaskFilters = pickTaskSearch.filters;
        var pickTaskColumns = pickTaskSearch.columns;
		if(utility.isValueValid(waveName))
		{
			pickTaskFilters.push(search.createFilter({
				name:'waveName',
				operator:search.Operator.IS,
				values:waveName
			}));
		}
		if(utility.isValueValid(whLocationId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.IS,
				values:['@NONE@',whLocationId] 
			}));
		}
		pickTaskFilters.push(search.createFilter({
			name:'picker',
			operator:search.Operator.ANYOF,
			values:['@NONE@',currentUser]
		}));

        if(utility.isValueValid(pickingType) && pickingType == 'MULTI') {
            pickTaskColumns.push(search.createColumn({
                name: "lineitemsubitemof",
                summary: "GROUP",
                label: "Line Item Subitem of"
            }));
        }
        pickTaskSearch.columns = pickTaskColumns;

		pickTaskSearch.filters = pickTaskFilters;
		return utility.getSearchResultInJSON(pickTaskSearch,callBackFunction);
	}

	function getPickTaskStageflag(pickingType,waveId,ordId,whLocation){
		var restrictStageProcessFlag = utility.getSystemRuleValue('Allow staging for assigned picker only',whLocation);
		var orderSearch = search.load({id:'customsearch_wmsse_stagedetails'});
		var orderSearchFilters = orderSearch.filters;
		if(pickingType == 'multiOrder')
		{
			if(utility.isValueValid(waveId))
			{
				orderSearchFilters.push(search.createFilter({
					name:'wavename',
					operator:search.Operator.ANYOF,
					values:waveId}));
			}
		}
		else
		{
			if(utility.isValueValid(ordId))
			{
				orderSearchFilters.push(search.createFilter({
					name:'internalid',
					join:'transaction',
					operator:search.Operator.IS,
					values:ordId}));

                orderSearchFilters.push(search.createFilter({
                    name:'pickingtype',
                    operator:search.Operator.IS,
                    values:"SINGLE"}));
			}
		}
		if(utility.isValueValid(whLocation))
		{
			orderSearchFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',whLocation]}));
		}
		if(restrictStageProcessFlag == 'Y'){
			orderSearchFilters.push(search.createFilter({
				name:'picker',
				operator:search.Operator.ANYOF,
				values:[runtime.getCurrentUser().id]}));
		}
		orderSearch.filters = orderSearchFilters;
		var	 objOrderSearchDetails =  utility.getSearchResultInJSON(orderSearch);
		return objOrderSearchDetails;
	}

	function getOutboundStageBinDetails(locationId,processType,workorderOverpickingFlag)
	{
		var outboundStageBinResults = "";
		if(utility.isValueValid(locationId)) {
			var stageBinDetails = search.load({id:'customsearch_wms_pickstage_ob_bindtl'});
			var stageBinFilters  = stageBinDetails.filters;
			if(processType == 'workOrder')
			{
				stageBinFilters.push(search.createFilter({
					name: 'type',
					operator: search.Operator.ANYOF,
					values: 'WIP'
				}));
				if(workorderOverpickingFlag)
				{
					stageBinFilters.push(search.createFilter({
						name: 'custrecord_wms_mfg_picking',
						operator: search.Operator.IS,
						values: true
					}));
				}
			}
			else
			{
				stageBinFilters.push(search.createFilter({
					name: 'type',
					operator: search.Operator.ANYOF,
					values: 'OUTBOUND_STAGING'
				}));
			}
			stageBinFilters.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: locationId
			}));
			stageBinDetails.filters = stageBinFilters;
			outboundStageBinResults  = utility.getSearchResultInJSON(stageBinDetails);
			log.debug({title:'outboundStageBinResults :',details:outboundStageBinResults});
		}
		return outboundStageBinResults;
	}

	function _getstatusDetailsForValidation(whLocation,getItemInternalId,eneteredBinId,enteredLot,fromStatusInternalId)
	{
		var balanceSearch=search.load({id:'customsearch_wms_get_invbalance_details',type:search.Type.INVENTORY_BALANCE});
		if(utility.isValueValid(whLocation))
		{
			balanceSearch.filters.push(search.createFilter({name:'location',
				operator:search.Operator.ANYOF,
				values:whLocation}));
		}
		if(utility.isValueValid(getItemInternalId))
		{
			balanceSearch.filters.push(search.createFilter({name:'internalid'
				,join:'item',
				operator:search.Operator.ANYOF,
				values:getItemInternalId}));
		}
		if(utility.isValueValid(eneteredBinId))
		{
			balanceSearch.filters.push(search.createFilter({name:'binnumber',
				operator:search.Operator.ANYOF,
				values:eneteredBinId}));
		}
		if(utility.isValueValid(enteredLot))
		{
			balanceSearch.filters.push(search.createFilter({name:'inventorynumber',
				operator:search.Operator.ANYOF,
				values:enteredLot}));
		}
		if (utility.isValueValid(fromStatusInternalId)) {
			balanceSearch.filters.push(search.createFilter({ name :'status',
				operator: search.Operator.ANYOF,
				values: fromStatusInternalId
			}));

		}
		var StatusDetails = utility.getSearchResultInJSON(balanceSearch);
		return StatusDetails;
	}

	function _getBinQtyDetailsItemwiseForValidation(binInternalId, warehouseLocationId,itemInternalId,lotName) {
		var qtyArray = [];
		var filterStrat = [];
		if (utility.isValueValid(itemInternalId))
			filterStrat.push(search.createFilter({
				name: 'internalid',
				operator: search.Operator.ANYOF,
				values: itemInternalId
			}));
		if (utility.isValueValid(warehouseLocationId))
			filterStrat.push(search.createFilter({
				name: 'location',
				join :'binonhand',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
		if (utility.isValueValid(binInternalId))
			filterStrat.push(search.createFilter({
				name: 'binnumber',
				join :'binonhand',
				operator: search.Operator.ANYOF,
				values: binInternalId
			}));	
		if (utility.isValueValid(lotName))
			filterStrat.push(search.createFilter({
				name:'inventorynumber',	
				join:'inventoryNumberBinOnHand',
				operator:search.Operator.IS, 
				values:lotName
			}));
		var objInvDetailsSearch = search.load({id: 'customsearch_wmsse_get_bininventorydtls'});
		var savedFilter = objInvDetailsSearch.filters ;	
		objInvDetailsSearch.filters = savedFilter.concat(filterStrat);
		var objInvDetails = utility.getSearchResultInJSON(objInvDetailsSearch);
		return objInvDetails;
	}

	function _getPickTaskDetailsForValidation(pickTaskDetails)
	{
		var getOrderInternalId = pickTaskDetails.orderInternalId;
		var strLocation = pickTaskDetails.whLocationId;
		var transactionType = pickTaskDetails.transactionType;
		var pickingType = pickTaskDetails.pickingType;
		var waveId  = pickTaskDetails.waveId;
		var isZonePickingEnabled = pickTaskDetails.isZonePickingEnabled;
		var selectedZones = pickTaskDetails.selectedZones;
		var pickTaskSearch = search.load({id:'customsearch_wmsse_validate_picktask'});
		var pickTaskFilters = pickTaskSearch.filters;
		if(pickingType == 'multiOrder')
		{
			pickTaskFilters.push(search.createFilter({
				name:'wavename',
				operator:search.Operator.ANYOF,
				values:waveId}));
		}
		else if(utility.isValueValid(getOrderInternalId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.ANYOF,
				values:getOrderInternalId}))
		}
		if(utility.isValueValid(transactionType))
		{
			pickTaskFilters.push(search.createFilter({
				name:'type',
				join:'transaction',
				operator:search.Operator.IS,
				values:transactionType}))
		}
		if(utility.isValueValid(strLocation))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		pickTaskFilters.push(search.createFilter({
				name:'picker',
				operator:search.Operator.ANYOF,
				values:['@NONE@',runtime.getCurrentUser().id]}));
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = [];
		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true)
		{
			log.debug('isZonePickingEnabled',isZonePickingEnabled);
				var orderSearchColumns = pickTaskSearch.columns;
				orderSearchColumns.push(search.createColumn({
					name:'zone',
					join:'binnumber'					
				}));
				orderSearchColumns.push(search.createColumn({
					name:'picker'
				}));
				
				pickTaskSearch.cloumns = orderSearchColumns;
					 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
		}
		else{
			 objpicktaskSearchDetails = utility.getSearchResultInJSONForValidation(pickTaskSearch,2);
		}
		
		return objpicktaskSearchDetails;
	}

	function _getmultiorderPickTaskDetailsForValidation(whLocationId, waveId, currentUser,isZonePickingEnabled)
	{
		var pickTaskSearch = search.load({id:'customsearch_wmsse_multiorder_picktask'});
		var pickTaskFilters = pickTaskSearch.filters;
		if(utility.isValueValid(waveId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'waveName',
				operator:search.Operator.ANYOF,
				values:waveId
			}));
		}
		if(utility.isValueValid(whLocationId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.IS,
				values:['@NONE@',whLocationId] 
			}));
		}
		pickTaskFilters.push(search.createFilter({
			name:'picker',
			operator:search.Operator.ANYOF,
			values:['@NONE@',currentUser]
		}));
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = [];
		if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true)
		{
			log.debug('isZonePickingEnabled',isZonePickingEnabled);
				var orderSearchColumns = pickTaskSearch.columns;
				orderSearchColumns.push(search.createColumn({
					name:'zone',
					join:'binnumber'					
				}));
				var orderSearchColumns = pickTaskSearch.columns;
				orderSearchColumns.push(search.createColumn({
					name:'picker'
				}));
				
				pickTaskSearch.cloumns = orderSearchColumns;
				objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
			
		}else{
			objpicktaskSearchDetails = utility.getSearchResultInJSONForValidation(pickTaskSearch,2);
		}
		return objpicktaskSearchDetails;
	}

	function _getTransactionOrderlineCount(getOrderInternalId,strLocation,transactionType)
	{
		var searchName = 'customsearch_wms_transactions_so_linecnt';
		if(transactionType == 'TrnfrOrd')
		{
			searchName = 'customsearch_wms_transactions_to_linecnt';
		}
		var transactionOrderDetails = search.load({id:searchName});
		var transactionfilters = transactionOrderDetails.filters;
		if(utility.isValueValid(getOrderInternalId))
		{
			transactionfilters.push(search.createFilter({
				name:'internalid',
				operator:search.Operator.ANYOF,
				values:getOrderInternalId}))
		}		
		if(utility.isValueValid(strLocation))
		{
			transactionfilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:strLocation}));
		}
		transactionOrderDetails.filters = transactionfilters;
		var	 objTransactionSearchDetails = utility.getSearchResultInJSONForValidation(transactionOrderDetails,2);
		return objTransactionSearchDetails;
	}

	function getPickTaskDtlstoIncldAlreadyPickedOrders(pickTaskDetails)
	{
		log.debug({title:'getPickTaskDtlstoIncldAlreadyPickedOrders',details:pickTaskDetails});
		var getOrderInternalId = pickTaskDetails['orderInternalId'];
		var strLocation = pickTaskDetails["whLocationId"];
		var transactionType = pickTaskDetails["transactionType"];
		var pickTaskName = pickTaskDetails["pickTaskName"];
		var currentUser = pickTaskDetails["currentUser"];
		var pickingType = pickTaskDetails["pickingType"];

		var pickTaskSearch = search.load({id:'customsearch_wmsse_picktasklst_pickedord'});
		var pickTaskFilters = pickTaskSearch.filters;
		if(utility.isValueValid(getOrderInternalId))
		{
			pickTaskFilters.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.ANYOF,
				values:getOrderInternalId}));
		}
		if(utility.isValueValid(pickTaskName))
		{
			pickTaskFilters.push(search.createFilter({
				name:'name',
				operator:search.Operator.IS,
				values:pickTaskName}));
		}
		if(utility.isValueValid(transactionType))
		{
			pickTaskFilters.push(search.createFilter({
				name:'type',
				join:'transaction',
				operator:search.Operator.IS,
				values:transactionType}));
		}
		if(utility.isValueValid(strLocation))
		{
			pickTaskFilters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF,
				values:['@NONE@',strLocation]}));
		}
		if(utility.isValueValid(pickingType) && pickingType != undefined)
		{
			pickTaskFilters.push(search.createFilter({
				name:'pickingtype',
				operator:search.Operator.ANYOF,
				values:pickingType}));
		}
		pickTaskFilters.push(search.createFilter({
			name:'picker',
			operator:search.Operator.ANYOF,
			values:['@NONE@',currentUser]
		}));
		pickTaskSearch.filters = pickTaskFilters;
		var	 objpicktaskSearchDetails = utility.getSearchResultInJSON(pickTaskSearch);
		log.debug({title:'pickTaskSearch',details:objpicktaskSearchDetails});
		return objpicktaskSearchDetails;
	}

	function _updateStageForNonInventoryItem(pickTaskId,line,pickingType,OrderInternalId,pickType)
	{
		var vPicktaskStgRec = record.load({type:'picktask',
			id:pickTaskId
		});
		log.debug({title:'vPicktaskStgRec ',details:vPicktaskStgRec});
		var complinelength =vPicktaskStgRec.getLineCount({
			sublistId:'pickactions'
		});
		if(pickingType == "multiorder")
		{
			for(var Ifitr=0;Ifitr<complinelength;Ifitr++)
			{
				var pickTaskOrderId = vPicktaskStgRec.getSublistValue({sublistId: 'pickactions',fieldId: 'ordernumber',line:Ifitr});
				var lineId = vPicktaskStgRec.getSublistValue({sublistId: 'pickactions',fieldId: 'linenumber',line:Ifitr});
				var lineRemainingQuantity = vPicktaskStgRec.getSublistValue({sublistId: 'pickactions',fieldId: 'remainingquantity',line:Ifitr});
				var lineItemStatus = vPicktaskStgRec.getSublistValue({sublistId: 'pickactions',fieldId: 'status',line:Ifitr});

				if(pickType == 'BULK' && (lineRemainingQuantity ==0) && (lineItemStatus != 'DONE'))
				{
					vPicktaskStgRec.setSublistValue({
						sublistId: 'pickactions',
						fieldId: 'status',
						line : parseInt(Ifitr),
						value: 'STAGED'
					});
				}
				else if(OrderInternalId == pickTaskOrderId && line == lineId)
				{
					vPicktaskStgRec.setSublistValue({
						sublistId: 'pickactions',
						fieldId: 'status',
						line : parseInt(Ifitr),
						value: 'STAGED'
					});
				}
			}
		}
		else
		{
			vPicktaskStgRec.setSublistValue({
				sublistId: 'pickactions',
				fieldId: 'status',
				line : 0,
				value: 'STAGED'
			});
		}
		var picktaskrecId=vPicktaskStgRec.save();
		var vPicktaskDoneRec = record.load({type:'picktask',
			id:pickTaskId
		});
		// var lineNo = (parseInt(0));
		var complinelength =vPicktaskDoneRec.getLineCount({
			sublistId:'pickactions'
		});
		if(pickingType == "multiorder")
		{
			for (var pickAction = 0; pickAction < complinelength; pickAction++)
			{
				var pickTaskOrderId = vPicktaskDoneRec.getSublistValue({sublistId: 'pickactions',fieldId: 'ordernumber',line:pickAction});
				var lineId = vPicktaskDoneRec.getSublistValue({sublistId: 'pickactions',fieldId: 'linenumber',line:pickAction});
				var lineRemainingQuantity = vPicktaskDoneRec.getSublistValue({sublistId: 'pickactions',fieldId: 'remainingquantity',line:pickAction});
				var lineItemStatus = vPicktaskDoneRec.getSublistValue({sublistId: 'pickactions',fieldId: 'status',line:pickAction});

				if(pickType == 'BULK' && (lineRemainingQuantity ==0) && (lineItemStatus != 'DONE'))
				{
					vPicktaskStgRec.setSublistValue({
						sublistId: 'pickactions',
						fieldId: 'status',
						line : pickAction,
						value: 'DONE'
					});
				}
				else if(OrderInternalId == pickTaskOrderId && line == lineId)
				{
					vPicktaskStgRec.setSublistValue({
						sublistId: 'pickactions',
						fieldId: 'status',
						line : pickAction,
						value: 'DONE'
					});
				}
			}
		}
		else
		{
			vPicktaskStgRec.setSublistValue({
				sublistId: 'pickactions',
				fieldId: 'status',
				line : 0,
				value: 'DONE'
			});
		}
		var picktaskrecId=vPicktaskStgRec.save();
	}

	function noCodeSolForPicking(pickTaskId, waveId, soId,toId,txnLineId,picktaskLineId,pickingType)
	{
		var pickTaskIdArr = [];
		var waveIdArr = [];
		var saleOrderIdArr = [];
		var transOrderIdArr = [];
		var tranLineIdArr = [];
		var pickLineIdArr = [];
		var impactedRecords = {};
		if(utility.isValueValid(pickTaskId)){
			pickTaskIdArr.push(pickTaskId);
		}else{
			pickTaskIdArr.push();
		}
		if(utility.isValueValid(waveId)){
			waveIdArr.push(parseInt(waveId));
		}else{
			waveIdArr.push();
		}
				
		
		if(pickingType == 'multiOrder')
		{
		
			if(!utility.isValueValid(soId))
			{
				saleOrderIdArr.push();
				impactedRecords['salesorder'] = saleOrderIdArr;
			}
			else
			{
				impactedRecords['salesorder'] = soId;
			}
			
			if(!utility.isValueValid(toId))
			{
				transOrderIdArr.push();
				impactedRecords['transferorder'] = transOrderIdArr;
			}
			else
			{
				impactedRecords['transferorder'] = toId;
			}
		
		}
		else
		{			
			
			if(utility.isValueValid(soId)){
			saleOrderIdArr.push(parseInt(soId));
			}else{
				saleOrderIdArr.push();
			}
			if(utility.isValueValid(toId)){
				transOrderIdArr.push(parseInt(toId));
			}else{
				transOrderIdArr.push();
			}
			
			impactedRecords['salesorder'] = saleOrderIdArr;
			impactedRecords['transferorder'] = transOrderIdArr;
		}
		
		
		if(utility.isValueValid(txnLineId)){
			tranLineIdArr.push(txnLineId);
		}else{
			tranLineIdArr.push();
		}
		if(utility.isValueValid(picktaskLineId)){
			pickLineIdArr.push(picktaskLineId);
		}else{
			pickLineIdArr.push();
		}
		impactedRecords['picktask'] = pickTaskIdArr;
		impactedRecords['wave'] = waveIdArr;
		impactedRecords['trasactionlineno'] = tranLineIdArr;
		impactedRecords['picktasklineno'] = pickLineIdArr;		
		log.debug({title:'impactedRecords :', details: impactedRecords });
		return impactedRecords;
	}

	function getBaseUnitRate(vUnitTypeId)
	{ 
		var baseUnitSrch= search.load({id:'customsearch_wms_get_baseunit'}); 
		baseUnitSrch.filters.push(search.createFilter({
			name: 'internalid',
			operator: search.Operator.ANYOF,
			values: vUnitTypeId
		}));
		var baseUnitSrchRes = utility.getSearchResultInJSON(baseUnitSrch);
		log.debug('baseUnitSrchRes',baseUnitSrchRes);
		return baseUnitSrchRes;
	}
	function _getPickingLotDetails(lotParams)
	{
		var warehouseLocationId = lotParams['warehouseLocationId'];		
		var itemInternalId = lotParams["itemInternalId"];
		var fromBinInternalId = lotParams["fromBinInternalId"];
		var lotName = lotParams["lotName"];
		var lotInternalId = lotParams["lotInternalId"];
		var lotstatus = lotParams["fromInventorystatus"];

		var is_InvStatusFeatureEnabled = lotParams["invStatusFeature"];
		if(!utility.isValueValid(is_InvStatusFeatureEnabled))
		{

			is_InvStatusFeatureEnabled = utility.isInvStatusFeatureEnabled();
		}

		var objBinDetails = {};
		var systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?',warehouseLocationId);
		var vmakeInvAvailFlag = true;
		var vLocDetails = search.lookupFields({
			type: search.Type.LOCATION,
			id: warehouseLocationId,
			columns: ['makeinventoryavailable']
		});
		vmakeInvAvailFlag = vLocDetails.makeinventoryavailable;
		var invBalanceSearch = search.load({id:'customsearch_wmsse_invtbalance_lotlist',type:search.Type.INVENTORY_BALANCE});
		var filters = invBalanceSearch.filters;
		if(utility.isValueValid(lotInternalId))
		{
			filters.push(search.createFilter({
				name:'inventorynumber',					
				operator:search.Operator.ANYOF, 
				values:lotInternalId}));
		}
		if(itemInternalId != null && itemInternalId != '')
		{
			filters.push(search.createFilter({
				name:'internalid',
				join:'item', 
				operator:search.Operator.ANYOF, 
				values:itemInternalId}));
		}
		if(warehouseLocationId!= null && warehouseLocationId!= '')
		{
			filters.push(search.createFilter({
				name:'location',
				operator:search.Operator.ANYOF, 
				values:warehouseLocationId}));
		}
		if(fromBinInternalId!= null && fromBinInternalId!= '')
		{
			filters.push(search.createFilter({
				name:'binnumber',
				operator:search.Operator.ANYOF, 
				values:fromBinInternalId}));
		}
		
		if(utility.isValueValid(lotstatus))
		{
			filters.push(search.createFilter({
				name:'status',
				operator:search.Operator.ANYOF, 
				values:lotstatus}));
		}
		
		
		if(vmakeInvAvailFlag)
		{
			filters.push(search.createFilter({
				name:'available',
				operator:search.Operator.GREATERTHAN, 
				values:0}));
		}
		if(systemRule_AllowExpiredItems == 'N' || systemRule_AllowExpiredItems == '')
		{
			var currDate = utility.DateStamp();
			currDate = format.parse({
				value: currDate,
				type: format.Type.DATE
			});
			currDate = format.format({
				value: currDate,
				type: format.Type.DATE
			});

			var dateFormat = utility.DateSetting();
			var defalutExpiryDate  = utility.setExpiryDate(dateFormat,'01','01','2199');
			filters.push(search.createFilter({
				name:'formuladate',
				operator:search.Operator.ONORAFTER, 
				formula:"NVL({inventorynumber.expirationdate},TO_DATE('"+defalutExpiryDate+"','"+dateFormat+"'))",
				values:currDate}));
		}
		invBalanceSearch.filters = filters;
		objBinDetails = utility.getSearchResultInJSON(invBalanceSearch);
		return objBinDetails;
	}
	function _getWaveInternalId(waveName,warehouseLocationId)
	{ 
		var waveInternalIdSrch= search.load({id:'customsearch_wms_wave_internalid'}); 
		waveInternalIdSrch.filters.push(search.createFilter({
			name: 'tranid',
			operator: search.Operator.IS,
			values: waveName
		}));
		if(utility.isValueValid(warehouseLocationId)){
			waveInternalIdSrch.filters.push(search.createFilter({
				name: 'location',
				operator: search.Operator.ANYOF,
				values: warehouseLocationId
			}));
		}
		var waveInternalIdSrchRes = utility.getSearchResultInJSON(waveInternalIdSrch);
		log.debug('waveInternalIdSrchRes',waveInternalIdSrchRes);
		return waveInternalIdSrchRes;
	}
	/* Validate assigned picker with the logged in user */
	function validatePicker(picker){
	    var currentUserId = runtime.getCurrentUser().id ;
      if(utility.isValueValid(picker) && (parseInt(picker) != parseInt(currentUserId))){
          return false;
	    }
	    else{
	    return true;
	    }
	}
	/* Update assigned picker to current login user */
	function updateAssignedPicker(pickTaskRecord){
	pickTaskRecord.setValue({fieldId: 'picker', value: runtime.getCurrentUser().id});
	}

	function getPicktasksDetailsReadyToStage(stageBinDetailsObj)
	{ 
		var restrictStageProcessFlag = utility.getSystemRuleValue('Allow staging for assigned picker only',stageBinDetailsObj.whLocationId);
	
		var orderSearch = search.load({id:'customsearch_wmsse_stagedet_updatestatus'});
		var orderSearchFilters = orderSearch.filters;
		
		if(stageBinDetailsObj.pickingType == 'multiOrder')	{

			var selectedOrderIdArr = stageBinDetailsObj.selectedOrderIdArr ;
			var isZonePickingEnabled = stageBinDetailsObj.isZonePickingEnabled ;
			var selectedZonesArr = stageBinDetailsObj.selectedZones ;
			selectedOrderIdArr = selectedOrderIdArr || [];
			isZonePickingEnabled = isZonePickingEnabled || false;
			selectedZonesArr = selectedZonesArr || [];
			
			orderSearchFilters.push(search.createFilter({
				name:'wavename',
				operator:search.Operator.ANYOF,
				values:stageBinDetailsObj.waveId}));

			if(utility.isValueValid(isZonePickingEnabled) && isZonePickingEnabled == true && 
					utility.isValueValid(selectedOrderIdArr) && selectedOrderIdArr.length > 0){

				orderSearchFilters.push(search.createFilter({
					name:'internalid',
					join:'transaction',
					operator:search.Operator.ANYOF,
					values:selectedOrderIdArr}));
			}
		}
		else {

			orderSearchFilters.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.IS,
				values:stageBinDetailsObj.orderInternalId}));
		}
		var pickTaskId = stageBinDetailsObj.pickTaskId;
		  
		
		if(utility.isValueValid(pickTaskId)){
			orderSearchFilters.push(search.createFilter({
				name:'internalid',
				operator:search.Operator.ANYOF,
				values:pickTaskId}));
		}
		orderSearchFilters.push(search.createFilter({
			name:'location',
			operator:search.Operator.ANYOF,
			values:['@NONE@',stageBinDetailsObj.whLocationId]}));
		
		
		if(restrictStageProcessFlag == 'Y'){
			orderSearchFilters.push(search.createFilter({
				name:'picker',
				operator:search.Operator.ANYOF,
				values:[runtime.getCurrentUser().id]}));
		}
		
		orderSearch.filters = orderSearchFilters;
		return utility.getSearchResultInJSON(orderSearch);		 
	}
	function updatePickTaskStageBin(pickTaskIdarr,stageBinId,populateWMSCartonFields,pickTaskStagedarr,newLinetoStage,isZonePickingEnabled,selectedOrderIdArr,selectedZonesArr,pickingType,markOpenPicksDone)
	{
		var pickTaskIdArrLength = pickTaskIdarr.length;
		var _newLineToStage = newLinetoStage;
		selectedOrderIdArr = selectedOrderIdArr || [];
		isZonePickingEnabled = isZonePickingEnabled || false;
		selectedZonesArr = selectedZonesArr || [];
		if(pickTaskIdArrLength > 0)	{
			
			for (var picktaskid = 0; picktaskid < pickTaskIdArrLength; picktaskid++) {
				var pickTaskRec = record.load({type:'picktask',id:pickTaskIdarr[picktaskid].id});
				var pickActionsLinesLength =pickTaskRec.getLineCount({	sublistId:'pickactions'	});
				var pickActionsUpdated = false;
				for (var pickAction = 0; pickAction < pickActionsLinesLength; pickAction++) {
					
					var pickedQty = pickTaskRec.getSublistValue({sublistId : 'pickactions',fieldId: 'pickedquantity',line : pickAction	});
					var pickActionLineItemStatus = pickTaskRec.getSublistValue({sublistId : 'pickactions',	fieldId : 'status',line : pickAction});
					var pickActionLineItemOrderNumber = pickTaskRec.getSublistValue({sublistId : 'pickactions',	fieldId : 'ordernumber',line : pickAction});
					if(pickedQty > 0 && pickActionLineItemStatus != 'DONE' &&
							(isZonePickingEnabled == false || selectedOrderIdArr.length == 0) ||
							(isZonePickingEnabled == true && selectedOrderIdArr.indexOf(parseInt(pickActionLineItemOrderNumber)) != -1))	{
						
						var stagedBinId = pickTaskRec.getSublistValue({sublistId : 'pickactions',fieldId : 'stagingbin',line : parseInt(pickAction)});
						var invdetailLine = pickTaskRec.getSublistSubrecord({sublistId :'pickactions',fieldId : 'inventorydetail',line : parseInt(pickAction)});
						var invDetailslinelength =invdetailLine.getLineCount({sublistId:'inventoryassignment'});
						
						if(!utility.isValueValid(stagedBinId)){ // new line to stage
							pickTaskRec.setSublistValue({sublistId: 'pickactions',fieldId: 'stagingbin',line : pickAction,	value: stageBinId});
							for (var invDetailsIndex = 0; invDetailsIndex < invDetailslinelength; invDetailsIndex++) {
								var invDetailLineQuantity = invdetailLine.getSublistValue({	sublistId : 'inventoryassignment',fieldId : 'quantity',line : invDetailsIndex});								
								invdetailLine.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'quantitystaged',line : invDetailsIndex,value : invDetailLineQuantity});
								if(populateWMSCartonFields == true)	{
									invdetailLine.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'custrecord_wmsse_staged',line : invDetailsIndex,value : true});
								}
							}
							pickActionsUpdated = true;
							_newLineToStage ='Y';
						}
						else if(stagedBinId == stageBinId || (pickingType == 'multiOrder')){// existing stage bin is already existing when partial qty
							if(pickActionLineItemStatus == 'STAGED'){
								pickTaskStagedarr.push(stageBinId);
							}
							for (var invDetailsIndex = 0; invDetailsIndex < invDetailslinelength; invDetailsIndex++) {
								var invDetailLineQuantity = invdetailLine.getSublistValue({	sublistId : 'inventoryassignment',fieldId : 'quantity',line : invDetailsIndex});								
								invdetailLine.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'quantitystaged',line : invDetailsIndex,value : invDetailLineQuantity});
								if(populateWMSCartonFields == true)	{
									invdetailLine.setSublistValue({sublistId : 'inventoryassignment',fieldId : 'custrecord_wmsse_staged',line : invDetailsIndex,value : true});
								}
								pickActionsUpdated = true;
							}
						}
						else{
							if(pickActionLineItemStatus == 'PICKED' || pickActionLineItemStatus == 'STARTED'){
								_newLineToStage = 'Y';
							}
							else {
								if(pickActionLineItemStatus == 'STAGED' ){
									for (var invDetailsIndex = 0; invDetailsIndex < invDetailslinelength; invDetailsIndex++) {
										var invdetStagedFlagStatus = invdetailLine.getSublistValue({sublistId : 'inventoryassignment',fieldId : 'quantitystaged',line : invDetailsIndex});
										if (invdetStagedFlagStatus == 0){
											pickTaskStagedarr.push(stagedBinId);
										}
									}
								}
							}
						}
					if(((!utility.isValueValid(stagedBinId) && markOpenPicksDone =="N") || ((stagedBinId == stageBinId) || (markOpenPicksDone != undefined &&
							utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="Y")))
							|| (pickingType == 'multiOrder' && isZonePickingEnabled == true)){

							var lineRemainingQty = pickTaskRec.getSublistValue({sublistId : 'pickactions',fieldId : 'remainingquantity',line : pickAction});
							if((lineRemainingQty == 0 ||
								(markOpenPicksDone != undefined && utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="Y"))){
								var invdetailLine = pickTaskRec.getSublistSubrecord({sublistId :'pickactions',fieldId : 'inventorydetail',line : parseInt(pickAction)});
								var invDetailslinelength =invdetailLine.getLineCount({sublistId:'inventoryassignment'});
								var stgFlag = true;
								if((markOpenPicksDone == undefined || !utility.isValueValid(markOpenPicksDone)) ||
									(utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="N"))
								{
									for (var invDetailIndex = 0; invDetailIndex < invDetailslinelength; invDetailIndex++) {
										var stagedFlagStatusInvDet = invdetailLine.getSublistValue({
											sublistId: 'inventoryassignment', fieldId: 'quantitystaged',
											line: invDetailIndex
										});
										if (stagedFlagStatusInvDet == 0) {
											stgFlag = false;
											break;
										}
									}
								}
								if(stgFlag){
									pickTaskRec.setSublistValue({sublistId: 'pickactions',fieldId: 'status',line : pickAction,value: 'DONE'});
									pickActionsUpdated = true;
								}
							}
						}
					}
				}
				if(pickActionsUpdated){
					pickTaskRec.save();
				}
			}
		}
		log.debug({title:'_newLineToStage',details:_newLineToStage});
		return _newLineToStage;
	}
	
	function _createOrUpdateLotJSONObject(lotJSONobject,lotName,scannedQty,selectedStatusText,transactionName)
	{
		var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
		var _lotJSONObject = lotJSONobject ? JSON.parse(lotJSONobject) : new Object();
		var key = lotName + '_' +transactionName + (inventoryStatusFeature ? '_' + selectedStatusText : '');
		log.debug({title:'key',details:key});
		if(_lotJSONObject[key]){

			_lotJSONObject[key]['quantity'] = Number(Big(_lotJSONObject[key]['quantity']).plus(scannedQty));

		}else{
			var obj = {};
			obj.lotName = lotName;
			obj.quantity = scannedQty;
			obj.statusName = selectedStatusText;
			obj.transactionName = transactionName;


			_lotJSONObject[key] = obj;
		}
		return _lotJSONObject;
	}
	function updatePickTaskStatusDone(pickingType,waveId,ordId,whLocation,stageBinId,populateWMSCartonFields,isPickTaskUpdated,isZonePickingEnabled,markOpenPicksDone)
	{var restrictStageProcessFlag = utility.getSystemRuleValue('Allow staging for assigned picker only',whLocation);
		// Stage to DONE updation
		var orderStgSearch = search.load({id:'customsearch_wms_stage_picktask_dtl'});			
		var orderStgSearchFilters = orderStgSearch.filters;
		if(pickingType == 'multiOrder')	{
			orderStgSearchFilters.push(search.createFilter({
				name:'wavename',
				operator:search.Operator.ANYOF,
				values:waveId}));
		}
		else{
			orderStgSearchFilters.push(search.createFilter({
				name:'internalid',
				join:'transaction',
				operator:search.Operator.ANYOF,
				values:ordId}));
		}
		orderStgSearchFilters.push(search.createFilter({
			name:'location',
			operator:search.Operator.ANYOF,
			values:['@NONE@',whLocation]}));
		if(restrictStageProcessFlag == 'Y'){
			orderStgSearchFilters.push(search.createFilter({
				name:'picker',
				operator:search.Operator.ANYOF,
				values:[runtime.getCurrentUser().id]}));
		}

		orderStgSearch.filters = orderStgSearchFilters;
		var	 objOrderStgSearchDetails = utility.getSearchResultInJSON(orderStgSearch);
		log.debug({title:'objOrderSearchDetails',details:objOrderStgSearchDetails});
		var duplicate_pickTaskstgArr = {};
		var pickTaskIdStgarr=[];
		var pickTaskRecId = '';
		var objOrderStgSearchDetailsLength = objOrderStgSearchDetails.length;
		if(objOrderStgSearchDetailsLength > 0){
			for(var task = 0 ; task < objOrderStgSearchDetailsLength; task++)
			{
				var pickTask = objOrderStgSearchDetails[task].id;
				if(!duplicate_pickTaskstgArr[pickTask]){
					pickTaskIdStgarr.push(objOrderStgSearchDetails[task]);
					duplicate_pickTaskstgArr[pickTask] = true;
				}
			}
		}
		log.debug({title:'pickTaskIdarr',details:pickTaskIdStgarr});
		var pickTaskIdStgArrLength = pickTaskIdStgarr.length;
		if(pickTaskIdStgArrLength > 0){
			for (var picktaskid = 0; picktaskid < pickTaskIdStgArrLength; picktaskid++) {
				
				var pickTaskRec = record.load({type:'picktask',	id:pickTaskIdStgarr[picktaskid].id});
				var pickActionsLinelength = pickTaskRec.getLineCount({sublistId:'pickactions'});
				var pickActionsUpdated = false;
				for (var pickAction = 0; pickAction < pickActionsLinelength; pickAction++) {

					var stagedBinId = pickTaskRec.getSublistValue({sublistId : 'pickactions',fieldId : 'stagingbin',line : pickAction});
					if(((stagedBinId == stageBinId) || (markOpenPicksDone != undefined &&
						utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="Y"))
					 || (pickingType == 'multiOrder' && isZonePickingEnabled == true)){
						
						var lineRemainingQty = pickTaskRec.getSublistValue({sublistId : 'pickactions',fieldId : 'remainingquantity',line : pickAction});
						var currentpickActionLineItemStatus = pickTaskRec.getSublistValue({sublistId : 'pickactions',fieldId : 'status',line : pickAction});
						if((lineRemainingQty == 0 ||
								(markOpenPicksDone != undefined && utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="Y"))
							&& currentpickActionLineItemStatus == 'STAGED')	{
						var invdetailLine = pickTaskRec.getSublistSubrecord({sublistId :'pickactions',fieldId : 'inventorydetail',line : parseInt(pickAction)});
						var invDetailslinelength =invdetailLine.getLineCount({sublistId:'inventoryassignment'});
						var stgFlag = true;
						if((markOpenPicksDone == undefined || !utility.isValueValid(markOpenPicksDone)) ||
							(utility.isValueValid(markOpenPicksDone) && markOpenPicksDone =="N"))

							{
								for (var invDetailIndex = 0; invDetailIndex < invDetailslinelength; invDetailIndex++) {
									var stagedFlagStatusInvDet = invdetailLine.getSublistValue({
										sublistId: 'inventoryassignment', fieldId: 'quantitystaged',
										line: invDetailIndex
									});
									if (stagedFlagStatusInvDet == 0) {
										stgFlag = false;
										break;
									}
								}
							}
						if(stgFlag){
								pickTaskRec.setSublistValue({sublistId: 'pickactions',fieldId: 'status',line : pickAction,value: 'DONE'});
								pickActionsUpdated = true;
							}
						}
					}
				}
				if(pickActionsUpdated){
					pickTaskRecId=pickTaskRec.save();
				}
			}
		}
		if(utility.isValueValid(pickTaskRecId))	{
			isPickTaskUpdated = 'T'
		}
		log.debug({title:'isPickTaskUpdated',details:isPickTaskUpdated});
		return isPickTaskUpdated;
	}
	

	
	function getCommittedOrderList(ordersInputObj)
	{
		try{
			log.debug('ordersInputObj :', ordersInputObj);
			var orderListArray=[];

			var orderReleaseQuery = query.create({
				type:query.Type.ORDER_RELEASE_LINE
			});


			var condOrdlocation = orderReleaseQuery.createCondition({
				fieldId: 'location',
				operator: query.Operator.ANY_OF,
				values: ordersInputObj['whLocationId']
			});

			var condOrdtype = orderReleaseQuery.createCondition({
				fieldId: 'type',
				operator: query.Operator.ANY_OF,
				values: ordersInputObj['transactionType']
			});


			if(utility.isValueValid(ordersInputObj['orderName']))
			{
				var condOrdNumber = orderReleaseQuery.createCondition({
					fieldId: 'transactionnumber',
					operator: query.Operator.ANY_OF,
					values: ordersInputObj['orderName']
				});

				orderReleaseQuery.columns = [
					orderReleaseQuery.createColumn({
						fieldId: 'transactionId',
						alias: 'internalid'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'transactionnumber',
						alias: 'tranid'
					}),	
					orderReleaseQuery.createColumn({
						fieldId: 'transactionLineid',
						alias: 'line'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'customername',
						alias: 'customerText'
					})
					];			

			}
			else
			{
				orderReleaseQuery.columns = [
					orderReleaseQuery.createColumn({
						fieldId: 'transactionId',
						groupBy: true,
						alias: 'internalid'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'transactionnumber',
						groupBy: true,
						alias: 'tranid'
					}),	
					orderReleaseQuery.createColumn({
						fieldId: 'customername',
						groupBy: true,
						alias: 'customerText'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'transactionlineid',
						aggregate: query.Aggregate.COUNT,
						alias: 'line'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'tranlinequantitybase',
						aggregate: query.Aggregate.SUM,
						alias: 'quantitycommitted'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'transactiondate',
						groupBy: true,
						alias: 'Date Created'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'tranlineshipdate',
						groupBy: true,
						alias: 'shipdate'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'tranlineshipmethodname',
						groupBy: true,
						alias: 'shipviaText'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'location.name',
						groupBy: true,
						alias: 'locationText'
					}),
					orderReleaseQuery.createColumn({
						fieldId: 'tranline.transaction.ordertype.name',
						groupBy: true,
						alias: 'orderTypeText'
					}),
                    orderReleaseQuery.createColumn({
                        fieldId: 'tranline.quantitypicked',
                        aggregate: query.Aggregate.SUM,
                        alias: 'pickedQuantity'
                    }),
                    orderReleaseQuery.createColumn({
                        fieldId: 'tranline.quantitybackordered',
                        aggregate: query.Aggregate.SUM,
                        alias: 'backorderedQuantity'
                    })
					];			
			}

			if(utility.isValueValid(condOrdNumber)){
				orderReleaseQuery.condition = orderReleaseQuery.and(condOrdlocation,condOrdtype,condOrdNumber);
			}
			else{
				orderReleaseQuery.condition = orderReleaseQuery.and(condOrdlocation,condOrdtype);
			}
			var orderListArray=orderReleaseQuery.run().asMappedResults();
			/*var myPagedData = orderReleaseQuery.runPaged({
				pageSize: 1000
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
						var resultObj = resultsObj[row]; 
						convertCommittedOrderObjToJsonObj(resultObj,orderListArray,columnsObj)
					}
				}
			});	*/

		}catch(e){
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
			orderListArray = [];
		}

		return orderListArray;			
	}
	
	function convertCommittedOrderObjToJsonObj(result,orderListArray,columnsObj)
	{
		var columns = columnsObj;
		var values = result.values;
		var ordersObj = {};
		for(var col in columns)
		{
			var colName = columns[col]['fieldId'];
			log.debug('colName :', colName);
			
			if(colName == 'transactionId'){
				colName ='internalid'
			}
			if(colName == 'transactionnumber'){
				colName ='tranid'
			}
			if(colName == 'transactionlineid'){
				colName ='line'
			}
			if(colName == 'tranlinequantitybase'){
				colName ='quantitycommitted'
			}
			if(colName == 'transactiondate'){
				colName ='Date Created'
			}
			if(colName == 'tranlineshipdate'){
				colName ='shipdate'
			}
			if(colName == 'tranlineshipmethodname'){
				colName ='shipviaText'
			}
			if(colName == 'customername'){
				colName ='customerText'
			}
			if(colName == 'transactionLineid'){
				colName ='line'
			}
			if(colName == 'location.name'){
				colName ='locationText'
			}
			if(colName == 'tranline.transaction.ordertype.name'){
				colName ='orderTypeText'
			}
			ordersObj[colName] = values[col];  
		}
		orderListArray.push(ordersObj); 
	}

	
	
	function createWave(waveObject, orderDetails,selectedWaveStatus, selectedWaveStatusValue)
	{
		var waveObj = {};
		log.debug('orderDetails :', orderDetails);
		log.debug('selectedWaveStatus :', selectedWaveStatus);
		log.debug('selectedWaveStatusValue :', selectedWaveStatusValue);
		var createdWaveStatus ='';

		var waveRec = record.create({type: 'wave', 
			isDynamic: true
		});

		waveRec.setValue({fieldId: 'location', 
			value: waveObject.location
		});
		waveRec.setValue({fieldId: 'priority', 
			value: '1'
		});
		waveRec.setValue({fieldId: 'picktype', 
			value: waveObject.picktype
		});
		if(utility.isValueValid(selectedWaveStatus) && utility.isValueValid(selectedWaveStatusValue))
		{
			if(selectedWaveStatusValue == 'Pending Release')
			{
 				selectedWaveStatus = 'Pending';
			}
			else
			{
 				selectedWaveStatus = 'Released';
			}
			log.debug('selectedWaveStatus in obutility',selectedWaveStatus);
			waveRec.setValue({fieldId: 'newwavestatus',
				value: selectedWaveStatus
			});
		}
		else
		{
			waveRec.setValue({fieldId: 'newwavestatus',
				value: 'Released'
			});
		}
		if(utility.isValueValid(selectedWaveStatus))
		{
			createdWaveStatus = selectedWaveStatus;
		}
		else
		{
			createdWaveStatus ='Released';
		}

		waveRec.setValue({fieldId: 'wavetype', 
			value: waveObject.wavetype
		});

		waveRec.insertLine({sublistId: 'lineitems', 
			line: 0
		});
		
		for(var k=0; k<orderDetails.length; k++)
		{
			waveRec.setCurrentSublistValue({
				sublistId: 'lineitems',
				line: k,
				fieldId: 'transactionId',
				value: orderDetails[k]['internalid']
			});					

			waveRec.setCurrentSublistValue({
				sublistId: 'lineitems',
				line: k,
				fieldId: 'transactionLineId',
				value: orderDetails[k]['line']
			});


			waveRec.commitLine({sublistId: 'lineitems'});
		}
		var waveId = waveRec.save();
		log.debug('waveId :', waveId);
		waveObj['waveid'] = waveId;
		waveObj['waveid'] = waveId;
		waveObj['createdWaveStatus'] = createdWaveStatus;
		return waveObj;
	}
	
	function bulkPickTaskUpdate(picktaskObj)
	{
		log.debug({title:'bulkPickTaskUpdate',details:picktaskObj});
		var pickQty= parseFloat(picktaskObj.pickqty);
		var pickActionIdCount = (picktaskObj.pickActionIdArray).length;
		var populateWMSCartonFields = utility.isPopulateWMSCartonFieldSet();
		var pickActionLineLookup = {};
		var pickActionId='';
		var orderPickQty = 0;
		var linePickedQty =0;
        var lineStatus = "";
		var pickTaskRecord = record.load({
			type : 'picktask',
			id : picktaskObj.picktaskid
		});
		var pickActionCount = pickTaskRecord.getLineCount({
			sublistId: 'pickactions'
		   });
		 for(var lineNumber = 0; lineNumber < pickActionCount;lineNumber++){
		 	 pickActionId = pickTaskRecord.getSublistValue({
                                 sublistId: 'pickactions',
                                 fieldId: 'id',
                                 line: lineNumber
                                   });
             lineStatus = pickTaskRecord.getSublistValue({
                 sublistId: 'pickactions',
                 fieldId: 'status',
                 line: lineNumber
             });
             if(lineStatus != "DONE") {
                 pickActionLineLookup[pickActionId] = {'lineNumber': lineNumber};
             }
		 }
		log.debug('pickActionLineLookup',pickActionLineLookup);
		for(var index=0; index< pickActionIdCount; index++)
		{
		    pickActionId = picktaskObj.pickActionIdArray[index];     
		    if(pickActionLineLookup[pickActionId]) {
		    var lineNumber = pickActionLineLookup[pickActionId].lineNumber;
		    var lineRemainingQuantity  = parseFloat(pickTaskRecord.getSublistValue({sublistId: 'pickactions',
		    	                                                         fieldId: 'remainingquantity',
		    	                                                         line:lineNumber
		    	                                                       }));
			
			if(lineRemainingQuantity > 0 && pickQty > 0)
			{			
				if(pickQty >= lineRemainingQuantity){
					orderPickQty = lineRemainingQuantity;
				}
				else{
					orderPickQty = pickQty;
				}		
				pickQty = Number(Big(pickQty).minus(lineRemainingQuantity));		
			    linePickedQty = pickTaskRecord.getSublistValue({
					sublistId: 'pickactions',
					fieldId: 'pickedquantity',
					line : lineNumber
				}) || 0;
				
				pickTaskRecord.setSublistValue({
					sublistId: 'pickactions',
					fieldId: 'pickedquantity',
					line : lineNumber,
					value: Number(Big(linePickedQty).plus(orderPickQty))
				});
				if(picktaskObj.itemType != "noninventoryitem")
				{
					var invDetailRecord = pickTaskRecord.getSublistSubrecord({
						sublistId :'pickactions',
						fieldId : 'inventorydetail',
						line : lineNumber
					});
					var invDtllinelength =invDetailRecord.getLineCount({
						sublistId:'inventoryassignment'
					});
					invDetailRecord.insertLine({
						sublistId: 'inventoryassignment',
						line : invDtllinelength
					});
					if(utility.isValueValid(picktaskObj.batchno))
					{
						invDetailRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'receiptinventorynumber',
							line :invDtllinelength,
							value :picktaskObj.batchno 
						});
					}
					if(utility.isValueValid(picktaskObj.fromBinId))
					{
						invDetailRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'binnumber',
							line : invDtllinelength,
							value : picktaskObj.fromBinId
						});
					}
					if(utility.isValueValid(picktaskObj.statusInternalId)) {
						invDetailRecord.setSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'inventorystatus',
							line: invDtllinelength,
							value: picktaskObj.statusInternalId
						});
					}
					invDetailRecord.setSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'quantity',
						line : invDtllinelength,
						value : orderPickQty
					});
					if(utility.isValueValid(picktaskObj.containerName))
					{
						invDetailRecord.setSublistValue({
							sublistId : 'inventoryassignment',
							fieldId : 'pickcarton',
							line : invDtllinelength,
							value : picktaskObj.containerName
						});
						if(populateWMSCartonFields)
						{
							invDetailRecord.setSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'custrecord_wms_pickcarton',
								line : invDtllinelength,
								value : picktaskObj.containerName
							});
						}
					}
				}
				if(picktaskObj.locUseBinsFlag === false)
				{
					if(lineRemainingQuantity == orderPickQty)
					{
						pickTaskRecord.setSublistValue({
							sublistId: 'pickactions',
							fieldId: 'status',
							line : lineNumber,
							value: 'DONE'
						});
					  }
                }
			 }
			 }
          if(pickQty <= 0){
          	break;
          }
		}
		var pickTaskRecId=pickTaskRecord.save();
		return pickTaskRecId;
	}
	
   function getOrdersForBulkPick(pickTaskId,pickItemId,scannedQty){
      var pickActionIdObj = {};
      var pickActionLineTotalQty = 0;
      var suiteQL= " SELECT \
                     PickAction_SUB.id_0 AS pickactionsidRAW /*{pickactions.id#RAW}*/, \
                     PickAction_SUB.remainingquantity_crit AS pickactionsremainingquantity /*{pickactions.remainingquantity#RAW}*/ \
                     FROM pickTask,\
                      (SELECT PickAction.picktask AS picktask, \
                              PickAction.\"ID\" AS id_0, \
                              transaction_SUB.tranId AS id_join_0, \
                              transaction_SUB.orderpriority AS orderpriority_0, \
                              PickAction.remainingquantity AS remainingquantity_crit \
                         FROM PickAction, \
                             (SELECT \
                              transactionLine.TRANSACTION AS tranId, \
                              transactionLine.orderpriority AS orderpriority \
                              FROM   transactionLine \
                              WHERE   NVL(transactionLine.mainline, 'F') = 'F' \
                                      AND NVL(transactionLine.taxline , 'F') = 'F' \
                                      AND transactionLine.item IN ('"+ pickItemId +"')) transaction_SUB \
                         WHERE PickAction.ordernumber = transaction_SUB.tranId \
                               AND PickAction.remainingquantity > 0) PickAction_SUB WHERE pickTask.\"ID\" = PickAction_SUB.picktask(+) AND pickTask.\"ID\" = ?  \
                     ORDER BY  PickAction_SUB.orderpriority_0 ASC , PickAction_SUB.id_join_0 ASC " ;

		// Run the SuiteQL query
		var resultSuiteQL= query.runSuiteQL({query: suiteQL,
                                             params : [pickTaskId]}); 
		var queryResults = resultSuiteQL.results;
		var queryResultsCount = queryResults.length; 
		log.debug('queryResults',queryResults);
		// Pushing Pickaction line ID into array 
		for(var count=0; count<queryResultsCount; count++){
			var queryData = queryResults[count].values;
          if(!pickActionIdObj[queryData[0]]){
          	pickActionIdObj[queryData[0]] = true;
          	pickActionLineTotalQty = pickActionLineTotalQty + parseFloat(queryData[1]); 
          	if(pickActionLineTotalQty >= scannedQty){
             break;
          	}
          }
		}
		return Object.keys(pickActionIdObj);
   }

   function getPickactionsIdsForPickTask(picktaskArr,warehouseLocationId,orderIDArr)
   {

	   var pickActionIdObject = {};
	   orderIDArr = orderIDArr || [];

	   var pickActionStatusSearch = query.create({type: query.Type.PICK_TASK});
	   var nameCond = pickActionStatusSearch.createCondition({
		   fieldId: 'name',
		   operator: query.Operator.ANY_OF,
		   values: picktaskArr
	   });

	   var pickActionStatusCond = pickActionStatusSearch.createCondition({
		   fieldId: 'pickactions.status',
		   operator: query.Operator.ANY_OF,
		   values: ['PICKED','STARTED','STAGED','DONE']				
	   });
	  
	   

	   var locCond = pickActionStatusSearch.createCondition({
		   fieldId: 'location',
		   operator: query.Operator.ANY_OF,
		   values: warehouseLocationId
	   });
	  

	   var pickActionsFieldsJoin = pickActionStatusSearch.autoJoin({
		   fieldId: 'pickactions'
	   });

	   pickActionStatusSearch.columns = [

		   pickActionStatusSearch.createColumn({
			   fieldId: 'name'			
		   }),
		   pickActionsFieldsJoin.createColumn({
			   fieldId: 'id'
		   })

		   ];

	   pickActionStatusSearch.sort = [
		   pickActionStatusSearch.createSort({
			   column: pickActionStatusSearch.columns[0],
			   ascending: true
		   })
		   ];
	   if(orderIDArr.length > 0){
		   
		   var pickActionOrdersCond = pickActionStatusSearch.createCondition({
			   fieldId: 'pickactions.ordernumber',
			   operator: query.Operator.ANY_OF,
			   values: orderIDArr				
		   });
		   pickActionStatusSearch.condition = pickActionStatusSearch.and(nameCond,pickActionStatusCond,pickActionOrdersCond,locCond);  
	   }
	   else{
	   pickActionStatusSearch.condition = pickActionStatusSearch.and(nameCond,pickActionStatusCond,locCond);
	   }
	   var pickActionResultSet = pickActionStatusSearch.run().results;
	   if (pickActionResultSet != null && pickActionResultSet.length > 0) {

		   for (var intItr in pickActionResultSet) {

			   pickActionIdObject[pickActionResultSet[intItr].values[0]] = {};

			   var pickActionString ="";
			   for (var pickactionItr in pickActionResultSet)
			   {
				   if(pickActionResultSet[intItr].values[0] == pickActionResultSet[pickactionItr].values[0])
				   {
					   if(pickActionString == "")
					   {
						   pickActionString = pickActionResultSet[pickactionItr].values[1];
					   }
					   else
					   {
						   pickActionString = pickActionString+','+pickActionResultSet[pickactionItr].values[1];
					   }
				   }
			   }

			   pickActionIdObject[pickActionResultSet[intItr].values[0]] =pickActionString;
		   }
	   }
	   log.debug('pickActionIdObject',pickActionIdObject);
	   return pickActionIdObject

   }

	function getShowStageFlag(waveInternalId,warehouseLocId) {

		var objPickedPickTaskDetails = getPickTaskStageflag('multiOrder',waveInternalId,'',warehouseLocId);
		var showStageButton = 'N';
		if(objPickedPickTaskDetails.length > 0) {							
			showStageButton = 'Y';
		}
		else {
			var StagedDtlfromPickTask = getMOPickTaskStageflagforAlreadystaged(warehouseLocId,waveInternalId);
			if(utility.isValueValid(StagedDtlfromPickTask) && StagedDtlfromPickTask.length>0){
				showStageButton = 'Y';
			}else{
				showStageButton = 'N';
			}
		}
		return showStageButton;
	}
  
	function fillObjectWithNextOrderDetails (ordObj,returnObj,unitType,isTallyScanRequired) {

		returnObj.transactionName = ordObj.tranid;
		returnObj.lineItememainingQuantity = ordObj.lineitemremainingquantity;
		returnObj.remainingQuantity = ordObj.lineitemremainingquantity;
		returnObj.lineItemPickedQuantity = ordObj.lineitempickedquantity;	
		returnObj.transactionInternalId = ordObj.internalid;	
		returnObj.line = ordObj.line;
		var transactionUom = ordObj.unitsText;
		if(utility.isValueValid(unitType) && utility.isValueValid(transactionUom))	{
			var transactionUomResult = utility.getUnitsType(unitType,transactionUom);
			if(transactionUomResult.length > 0)	{
				returnObj.transactionUomConversionRate = transactionUomResult[0].conversionrate;
			}
		}
		else {
			transactionUom = '';
		}
		returnObj.transactionUomName = transactionUom;
		var	remainingQtyWithUom = ordObj.lineitemremainingquantity + " " + transactionUom;
		returnObj.lblRemainingQuantity = remainingQtyWithUom;
		if(isTallyScanRequired && (returnObj.itemType == "serializedinventoryitem" || returnObj.itemType=="serializedassemblyitem")){
			fillObjectForSerialTallyScan(ordObj,returnObj);
		}

	}
	function fillObjectForSerialTallyScan(ordObj,pickqtyValidate){
		var baseUnitName= (utility.getObjectLength(pickqtyValidate.qtyUOMObj) > 0) ? (pickqtyValidate.qtyUOMObj).unitName : '';

		if(pickqtyValidate.newOrderScanRequired == 'true'){
			if(utility.isValueValid(pickqtyValidate.unitType)){
				if(utility.isValueValid(pickqtyValidate.qtyUOMObj)){
				var convertedValue = Number(Big((pickqtyValidate.qtyUOMObj).conversionRate).mul(pickqtyValidate.transactionUomConversionRate));
				ordObj.lineitemremainingquantity = Number(Big(ordObj.lineitemremainingquantity).mul(convertedValue));
				}
			}
			pickqtyValidate.remainingQty = ordObj.lineitemremainingquantity + " " + baseUnitName;
			pickqtyValidate.lblRemainingQuantity = ordObj.lineitemremainingquantity + " " + baseUnitName;
			pickqtyValidate.numberOfTimesSerialScanned = 0;
			pickqtyValidate.scannedQuantityInBaseUnits = ordObj.lineitemremainingquantity;
		}else{
			var leftOverQuantity = parseInt(pickqtyValidate.scannedQuantityInBaseUnits) - (parseInt(pickqtyValidate.numberOfTimesSerialScanned) + 1);
			pickqtyValidate.remainingQty = leftOverQuantity + " " + baseUnitName ;
			pickqtyValidate.lblRemainingQuantity = leftOverQuantity + " " + baseUnitName;
			pickqtyValidate.numberOfTimesSerialScanned = parseInt(pickqtyValidate.numberOfTimesSerialScanned) + 1;	
		}
	}
            function getExitingSerial(serialObj) {

                var serialSearch = search.load({
                    type: 'customrecord_wmsse_serialentry',
                    id: 'customsearch_wmsse_serialdetails_search'
                });
                serialSearch.filters.push(search.createFilter({
                    name: 'custrecord_wmsse_ser_no',
                    operator: search.Operator.IS,
                    values: serialObj.serialName
                }));

                serialSearch.filters.push(search.createFilter({
                    name: 'custrecord_wmsse_ser_item',
                    operator: search.Operator.ANYOF,
                    values: serialObj.itemInternalId
                }));

                serialSearch.filters.push(search.createFilter({
                    name: 'custrecord_wmsse_ser_status',
                    operator: search.Operator.IS,
                    values: false
                }));
                serialSearch.filters.push(search.createFilter({
                    name: 'custrecord_wmsse_ser_tasktype',
                    operator: search.Operator.ANYOF,
                    values: 3
                }));
				return utility.getSearchResultInJSON(serialSearch);
            }

            function createWMSSerialEntry(serialObj) {



                var objRecord = record.create({
                    type : 'customrecord_wmsse_serialentry',

                });

                objRecord.setValue({
                    fieldId: 'name',
                    value: serialObj.pickTaskId
                });

                objRecord.setValue({
                    fieldId: 'custrecord_wmsse_ser_ordno',
                    value: serialObj.orderInternalId
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wmsse_ser_item',
                    value: serialObj.itemInternalId
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wmsse_ser_qty',
                    value: 1
                });

                objRecord.setValue({
                    fieldId: 'custrecord_wmsse_ser_no',
                    value: serialObj.serialName
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wmsse_ser_status',
                    value: false
                });
                objRecord.setValue({
                    fieldId: 'custrecord_serial_inventorystatus',
                    value: serialObj.serialstatus
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wmsse_ser_tasktype',
                    value: 3
                });
               objRecord.save();

            }

    function getPickedSerials(serialObj) {

        var serialSearch = search.load({
            type: 'customrecord_wmsse_serialentry',
            id: 'customsearch_wmsse_serialdetails_search'
        });
        serialSearch.filters.push(search.createFilter({
            name: 'name',
            operator: search.Operator.IS,
            values: serialObj.picktaskid
        }));

        serialSearch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_item',
            operator: search.Operator.ANYOF,
            values: serialObj.itemId
        }));

        serialSearch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_status',
            operator: search.Operator.IS,
            values: false
        }));
        serialSearch.filters.push(search.createFilter({
            name: 'custrecord_wmsse_ser_tasktype',
            operator: search.Operator.ANYOF,
            values: 3
        }));
        var serialSearchRes = utility.getSearchResultInJSON(serialSearch);
        return serialSearchRes;
        }
    function addInventoryDetailLine(compSubRecord,lineIndex,picktaskObj,itemWiseDataObj){
           compSubRecord.insertLine({
				sublistId: 'inventoryassignment',
				line : lineIndex
			});
           if(utility.isValueValid(picktaskObj.fromBinId))
	       {
			compSubRecord.setSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'binnumber',
				line : lineIndex,
				value : picktaskObj.fromBinId
			});
		   } 
			compSubRecord.setSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'quantity',
				line : lineIndex,
				value : itemWiseDataObj.quantity
			});
			if(utility.isValueValid(itemWiseDataObj.invNumber))
	       {
			compSubRecord.setSublistValue({
				sublistId : 'inventoryassignment',
				fieldId : 'receiptinventorynumber',
				line : lineIndex,
				value: itemWiseDataObj.invNumber
			});
		   }
			if(picktaskObj.inventoryStatusFeature) {
				compSubRecord.setSublistValue({
					sublistId: 'inventoryassignment',
					fieldId: 'inventorystatus',
					line: lineIndex,
					value: itemWiseDataObj.invStatus
				});
			}
			if(utility.isValueValid(picktaskObj.containerName))
			{
				compSubRecord.setSublistValue({
					sublistId : 'inventoryassignment',
					fieldId : 'pickcarton',
					line : lineIndex,
					value : picktaskObj.containerName
				});
				if(picktaskObj.populateWMSCartonFields == true)
				{
					compSubRecord.setSublistValue({
						sublistId : 'inventoryassignment',
						fieldId : 'custrecord_wms_pickcarton',
						line : lineIndex,
						value : picktaskObj.containerName
					});										
				}
			}   	
   }
   function updatePicktaskToDone(vPicktaskRec,lineIndex,picktaskObj){
   	var pickQty = parseFloat(picktaskObj.pickqty)
      if(picktaskObj.isTallyScanRequired ==true && picktaskObj.totalLotqty>0)
	  {
		pickQty= picktaskObj.totalLotqty;
	  }
	  if((picktaskObj.itemType == "serializedinventoryitem" || picktaskObj.itemType=="serializedassemblyitem")&&
	   utility.isValueValid(picktaskObj.enterqty)) 
	  {
		pickQty=parseFloat(picktaskObj.enterqty);
	  }
	var lineRemainingQty = vPicktaskRec.getSublistValue({
		sublistId : 'pickactions',
		fieldId : 'remainingquantity',
		line : parseInt(lineIndex)
	});

	if(parseFloat(lineRemainingQty) == pickQty)
	{
		vPicktaskRec.setSublistValue({
			sublistId: 'pickactions',
			fieldId: 'status',
			line : parseInt(lineIndex),
			value: 'DONE'
		});
	}
   }
	
	function getDetailsFromScheduleScriptRecord (orderOrWaveInternalId,warehouseLocationId,pickTaskIdObject,isMRScriptInvokeRequired,orderInternalIds)
	{

		var resultsObject ={};
		var concurrencyFlag = false;
		var recordInternalId ="";
		try
		{
			var processName ='PickTask Stagebin Update Mapreduce';
			var currentUserId = runtime.getCurrentUser().id;
			var processDetails = getAsynScriptProcessDetails(processName,orderOrWaveInternalId);

			log.debug('processDetails',processDetails);
			if(processDetails.length>0)
			{
				var pickTaskDetailsFromSearch = getPickactionsIdsForPickTask(Object.keys(pickTaskIdObject),warehouseLocationId);
				log.debug('pickTaskDetailsFromSearch',pickTaskDetailsFromSearch);
				
				var pickTaskDetailsFromTempRecord = processDetails[0].custrecord_wms_schpickactionids;
				var pickTaskObjectTempRecord =JSON.parse(pickTaskDetailsFromTempRecord);				
				var pickTasksFromTempRecord = Object.keys(pickTaskObjectTempRecord);				
				var pickTaskFromSearch = Object.keys(pickTaskDetailsFromSearch);				
				log.debug('pickTaskDetails from TempRecord',pickTaskObjectTempRecord);
				log.debug('pickTaskDetails from Search',pickTaskDetailsFromSearch);				
				
				//below condition to compare the pick tasks
				if((compareKeys(pickTaskObjectTempRecord,pickTaskDetailsFromSearch)) || !(comparePickTasks(pickTasksFromTempRecord,pickTaskFromSearch)))
				{
					// both keys [picktasks] are same
					var unMatchedPickActionsCount = comparePickActionsIds(pickTasksFromTempRecord,pickTaskObjectTempRecord,pickTaskDetailsFromSearch,isMRScriptInvokeRequired);
					if(unMatchedPickActionsCount == 0)
					{
						log.debug('PickTask and pickactions match');
						concurrencyFlag =true;
					}
					else
					{
						if(isMRScriptInvokeRequired)
						{
							recordInternalId =utility.updateScheduleScriptStatus(processName,currentUserId,'Submitted',orderOrWaveInternalId,null,null,pickTaskDetailsFromSearch);
						}
					}
				}
				else
				{
					if(isMRScriptInvokeRequired)
					{
						var pickTaskDetailsFromSearch = getPickactionsIdsForPickTask(Object.keys(pickTaskIdObject),warehouseLocationId);
						recordInternalId =utility.updateScheduleScriptStatus(processName,currentUserId,'Submitted',orderOrWaveInternalId,null,null,pickTaskDetailsFromSearch);
					}
				}			
				
			}
			else
			{
				if(isMRScriptInvokeRequired)
				{
					var pickTaskDetailsFromSearch = getPickactionsIdsForPickTask(Object.keys(pickTaskIdObject),warehouseLocationId,orderInternalIds);
					recordInternalId =utility.updateScheduleScriptStatus(processName,currentUserId,'Submitted',orderOrWaveInternalId,null,null,pickTaskDetailsFromSearch);
				}
			}		
		}
		catch(e)
		{
			log.debug('expection in getDetailsFromScheduleScriptRecord',e);
		}
		
		log.debug('concurrencyFlag',concurrencyFlag);
		resultsObject.concurrencyFlag =concurrencyFlag;
		resultsObject.recordInternalId =recordInternalId;
		log.debug('resultsObject',resultsObject);
		return resultsObject;
	}
	
	function compareKeys(object1, object2) {		
		var object1Keys = Object.keys(object1).sort();
		var object2Keys = Object.keys(object2).sort();
		return JSON.stringify(object1Keys) === JSON.stringify(object2Keys);
	}

	function comparePickTasks(pickTasksFromTempRecord,pickTaskFromSearch)
	{
		var pickTasksMatched = true;
		var pickTaskArray = {};
		var pickTaskDiffArray =[]
		var pickTaskSearchLength = pickTaskFromSearch.length;
		var pickTaskTempLength = pickTasksFromTempRecord.length;
		
		for (var i = 0; i < pickTaskSearchLength; i++) {
			pickTaskArray[pickTaskFromSearch[i]] = true;
		}		
		for (var K = 0;  K< pickTaskTempLength; K++) {
			if(utility.isValueValid(pickTaskArray[pickTasksFromTempRecord[K]])) {
				pickTaskDiffArray[pickTasksFromTempRecord[K]] = true;
			}
		}
		log.debug('pickTaskDiffArray',pickTaskDiffArray);
		if(pickTaskDiffArray.length>0)
		{
			pickTasksMatched = false;
		}
		log.debug('pickTasksMatched',pickTasksMatched);
		return pickTasksMatched;
	}
	
	function comparePickActionsIds(pickTasksFromTempRecord,pickTaskObjectTempRecord,pickTaskDetailsFromSearch,isMRScriptInvokeRequired)
	{		
		var unMatchedPickActionsCount =0;
		var matchedPickTaskArray =[];		
		var pickTaskLength = pickTasksFromTempRecord.length;
		for (var itr=0;itr<pickTaskLength;itr++)
		{			
			var tempRecordPickTask  = pickTasksFromTempRecord[itr];		
			var tempRecordPickActionsArray =[];
			var pickTaskPickActionsArray =[];
			if( typeof(pickTaskObjectTempRecord[tempRecordPickTask]) == 'number')
			{
				tempRecordPickActionsArray.push(pickTaskObjectTempRecord[tempRecordPickTask]);
				pickTaskPickActionsArray.push(pickTaskDetailsFromSearch[tempRecordPickTask]);
			}
			else{											

				if(utility.isValueValid (pickTaskObjectTempRecord[tempRecordPickTask]))
				{
					tempRecordPickActionsArray = pickTaskObjectTempRecord[tempRecordPickTask].split(',');
				}
				if(utility.isValueValid (pickTaskDetailsFromSearch[tempRecordPickTask]))
				{
					pickTaskPickActionsArray = pickTaskDetailsFromSearch[tempRecordPickTask].split(',');
				}
			}					
			
			if(pickTaskPickActionsArray.length>0 && tempRecordPickActionsArray.length>0)
			{
				var pickActionsMatched = comparepickActionsArray(pickTaskPickActionsArray,tempRecordPickActionsArray);

				if(!pickActionsMatched)
				{
					unMatchedPickActionsCount ++;
					if(isMRScriptInvokeRequired)
					{
						var deltaPickActionString = getDeltaPickActionIds(tempRecordPickActionsArray,pickTaskPickActionsArray,tempRecordPickTask);
						pickTaskDetailsFromSearch[tempRecordPickTask] =deltaPickActionString;
					}
				}
				else
				{		
					if(isMRScriptInvokeRequired)
					{
						delete pickTaskDetailsFromSearch.tempRecordPickTask;
					}					
				}
			}
		}	
		log.debug('unMatchedPickActionsCount',unMatchedPickActionsCount);
		return unMatchedPickActionsCount
	}
	
	function comparepickActionsArray(pickActionValuesArray,intermediatePickActionValuesArray)
	{
		var resultsFalg = false;
		if(JSON.stringify(pickActionValuesArray.sort(function(a, b){return a - b})) == JSON.stringify(intermediatePickActionValuesArray.sort(function(a, b){return a - b})))
			{resultsFalg = true;
			}			
		return resultsFalg;		
	}
	
	function getDeltaPickActionIds(tempRecordPickActionsArray,pickTaskPickActionsArray)
	{
		var pickActionString ="";
		var pickActionLength = pickTaskPickActionsArray.length;			
		for(var pickActionItr=0;pickActionItr<pickActionLength;pickActionItr++)
		{
			var pickActionId = pickTaskPickActionsArray[pickActionItr];
			var arrayIndex = tempRecordPickActionsArray.indexOf(pickActionId);
			if(arrayIndex ==-1)
			{
				if(pickActionString == "")
				{
					pickActionString = pickActionId;
				}
				else
				{
					pickActionString = pickActionString+','+pickActionId;
				}			
						
			}	
		}
		log.debug('DeltaPickActionIds',pickActionString);
		return pickActionString;	
	}
	
	
	function getAsynScriptProcessDetails(processName,orderOrWaveInternalId)
	{
		try
		{
			var statusDetails = search.load({id:'customsearch_wmsse_mapreduce_status'});
			var objFiltersArr  = statusDetails.filters;

			objFiltersArr.push(search.createFilter({
				name: 'custrecord_wmsse_schprsstatus',
				operator: search.Operator.ISNOT,
				values: 'Completed'
			}));		

			if(utility.isValueValid(processName))
			{
				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsname',
					operator: search.Operator.IS,
					values: processName
				}));
			}

			objFiltersArr.push(search.createFilter({
				name: 'custrecord_wmsse_schprstranrefno',
				operator: search.Operator.IS,
				values: parseFloat(orderOrWaveInternalId)
			}));		

			statusDetails.filters = objFiltersArr;
			var statusSearchResult =  utility.getSearchResultInJSON(statusDetails);
			return statusSearchResult;
		}
		catch(exp)
		{
			log.error('exception in getAsynScriptProcessDetails',exp);
		}
	}
	function getAssignedPickTaskStagingDetails(inventoryDetailsIdArray,pickingType,assignedPickerSystemruleValue){
		if(!utility.isValueValid(assignedPickerSystemruleValue)){
			assignedPickerSystemruleValue =  'Y';
		}
		var results= [];
		var myPickTaskQuery = query.create({
			type: query.Type.PICK_TASK
		});
		var pickActionsFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'pickactions'
		});
		var  pickActionsQuery_invDetailId = pickActionsFieldsJoin.createCondition({
			fieldId: 'inventorydetail.id',
			operator: query.Operator.ANY_OF,
			values: inventoryDetailsIdArray
		});

		myPickTaskQuery.columns = [ myPickTaskQuery.createColumn({
	                                                    fieldId: 'id'
                                                         })
		                          ];
		myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_invDetailId);
		if(assignedPickerSystemruleValue == 'Y') {
			var pickTaskQuery_Picker = myPickTaskQuery.createCondition({
				fieldId: 'picker',
				operator: query.Operator.ANY_OF,
				values: [runtime.getCurrentUser().id]
			});
			myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_invDetailId,pickTaskQuery_Picker);
		}

		if(utility.isValueValid(pickingType)){
			var pickTaskQuery_Pickingtype = myPickTaskQuery.createCondition({
				fieldId: 'wave^transaction.picktype',
				operator: query.Operator.ANY_OF,
				values:pickingType
			});
			myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_invDetailId,pickTaskQuery_Pickingtype);

			if(assignedPickerSystemruleValue == 'Y') {
				var pickTaskQuery_Picker = myPickTaskQuery.createCondition({
					fieldId: 'picker',
					operator: query.Operator.ANY_OF,
					values: [runtime.getCurrentUser().id]
				});
				myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_invDetailId,pickTaskQuery_Picker,pickTaskQuery_Pickingtype);
			}

		}


			results = myPickTaskQuery.run().asMappedResults();
		return results;
	}
	function getPickCartonRelatedData(orderInternalId,warehouseLocationId,restrictStageProcessFlag){
		var myPickTaskQuery = query.create({
			type: query.Type.PICK_TASK
		});
			var pickActionsFieldsJoin = myPickTaskQuery.autoJoin({
			fieldId: 'pickactions'
		});
			var pickActionsinvDtlFieldsJoin = pickActionsFieldsJoin.autoJoin({
			fieldId: 'inventorydetail'
		});

		var  pickActionsQuery_orderId = pickActionsFieldsJoin.createCondition({
			fieldId: 'ordernumber',
			operator: query.Operator.ANY_OF,
			values: orderInternalId
		});
		var piscTaskQuery_Location = myPickTaskQuery.createCondition({
			fieldId: 'location',    
			operator: query.Operator.ANY_OF,
			values: warehouseLocationId  
		});
		if(restrictStageProcessFlag == 'Y'){
		var pickTaskQuery_Picker = myPickTaskQuery.createCondition({
			fieldId: 'picker',
			operator: query.Operator.ANY_OF,
			values: [runtime.getCurrentUser().id]
		});
	      }
	    var pickCartonCond = pickActionsinvDtlFieldsJoin.createCondition({
			fieldId: 'pickcarton',
			operator: query.Operator.EMPTY_NOT
		});
		var stagingBinQuery = pickActionsFieldsJoin.createCondition({
			fieldId: 'stagingbin',
			operator: query.Operator.EMPTY_NOT
		});
	

		// Create a query column
		myPickTaskQuery.columns = [

		                           			myPickTaskQuery.createColumn({ fieldId: 'item',
		                           				groupBy: true
                                             }),
                                             pickActionsinvDtlFieldsJoin.createColumn({ fieldId: 'pickcarton',
           	                                   groupBy: true
                                             }),
                                             pickActionsinvDtlFieldsJoin.createColumn({ fieldId: 'quantitystaged',
           	                                   aggregate: query.Aggregate.SUM
                                             }),
                                             pickActionsFieldsJoin.createColumn({ fieldId: 'ordernumber',
                                                 context: query.FieldContext.DISPLAY,
           	                                   groupBy: true
                                             }),
                                            pickActionsFieldsJoin.createColumn({ fieldId: 'stagingbin',
                                            		 context: query.FieldContext.DISPLAY,
                                            		 groupBy: true
                                             })

			];
		
     if(restrictStageProcessFlag == 'Y'){
		myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_orderId,piscTaskQuery_Location,pickTaskQuery_Picker,pickCartonCond,
				stagingBinQuery);
	}else{
		myPickTaskQuery.condition = myPickTaskQuery.and(pickActionsQuery_orderId,piscTaskQuery_Location,pickCartonCond,
				stagingBinQuery);
	}

		var pagedData = myPickTaskQuery.runPaged({
			pageSize: 1000
		});
		
		var pickTaskContrDtls = [];
	   pagedData.pageRanges.forEach(function (pageRange) {
			var myPage = pagedData.fetch({
				index: pageRange.index
			});
			var resultSetObj =  myPage.data;
			if(resultSetObj!=null && resultSetObj!='')
			{
				var resultsObj = resultSetObj.results;
				var columnsObj = resultSetObj.columns;
				for (var row in resultsObj)
				{
					var resultObj = resultsObj[row]; 
					convertToJsonObj(resultObj,pickTaskContrDtls,columnsObj);
				}
			}
		});
	   return pickTaskContrDtls;
	}
	 function convertToJsonObj(result,resultsArray,columnsObj)
	 {
		var columns = columnsObj;
		var values = result.values;
		var dataObj = {};
		for(var col in columns)
		{
			var colName = columns[col]['fieldId'];
			if(colName == ''||colName == null){
			    colName = columns[col]['label'];
			}
			dataObj[colName] = values[col];  
			if(colName == 'id'){
				dataObj.internalid = values[col]; 
			}
		}
		resultsArray.push(dataObj); 
	}
	function inventoryNumberInternalIdforSerial(serialObj){
		
				var internalId = '';
				var invNumSearch = search.load({id:'customsearch_inv_num_basic_search'});

				if(utility.isValueValid(serialObj.serialName))
				{
					invNumSearch.filters.push(search.createFilter({
						name : 'inventorynumber',
						operator : search.Operator.IS,
						values : serialObj.serialName
					}));
				}
				if(utility.isValueValid(serialObj.warehouseLocationId)) {
					invNumSearch.filters.push(search.createFilter({
						name : 'location',
						operator:search.Operator.ANYOF,
						values : serialObj.warehouseLocationId
					}));
				}
				if(utility.isValueValid(serialObj.itemInternalId))
				{
					invNumSearch.filters.push(search.createFilter({
						name : 'item',
						operator : search.Operator.ANYOF,
						values : serialObj.itemInternalId
					}));
				}
				if(!utility.isValueValid(serialObj.inventoryDetailLotOrSerial))
				{
					invNumSearch.filters.push(search.createFilter({
						name : 'quantityavailable',
						operator : search.Operator.GREATERTHAN,
						values : 0
					}));
				}

				var invNumSearchRes =invNumSearch.run().getRange({
						start: 0,
						end: 10
					});

			if(utility.isValueValid(invNumSearchRes) && invNumSearchRes.length > 0)
			{
				internalId = invNumSearchRes[0].id;
				}
		log.debug('internalId', internalId);
				return internalId;
	}
	function _getPickActionDetailsFromScheduleScriptCustomRecord(processName,currentUserId,transactionInternalId)
	{
		try
		{

			var statusDetails = search.load({id:'customsearch_wmsse_mapreduce_status'});
			var objFiltersArr  = statusDetails.filters;

			objFiltersArr.push(search.createFilter({
				name: 'custrecord_wmsse_schprsstatus',
				operator: search.Operator.ISNOT,
				values: 'Completed'
			}));

			objFiltersArr.push(search.createFilter({
				name: 'custrecord_wmsse_schprsname',
				operator: search.Operator.IS,
				values: processName
			}));

			objFiltersArr.push(search.createFilter({
				name: 'custrecord_wmsse_schprstranrefno',
				operator: search.Operator.IS,
				values: parseFloat(transactionInternalId)
			}));

			if(utility.isValueValid(currentUserId))
			{
				objFiltersArr.push(search.createFilter({
					name: 'custrecord_wmsse_schprsinitiatedby',
					operator: search.Operator.ANYOF,
					values: currentUserId
				}));
			}

			statusDetails.filters = objFiltersArr;
			var statusSearchResult =  utility.getSearchResultInJSON(statusDetails);
			return statusSearchResult;
		}
		catch(exp)
		{
			log.error('exception in getPickActionDetailsFromScheduleScriptRecord',exp);
		}
	}

	function _getPickedOrders(waveName,warehouseLocationId,selectedZonesArr,pickTaskId){
		
		var waveIdArr = _getWaveInternalId(waveName);
		var pickActionsIDArray = [];
		if(waveIdArr.length >0){
			var getPickActionDetails  = _getPickActionDetailsFromScheduleScriptCustomRecord('PickTask Stagebin Update Mapreduce','',waveIdArr[0].internalid);

			log.debug('getPickActionDetails',getPickActionDetails);
			if(getPickActionDetails.length>0 && utility.isValueValid(getPickActionDetails[0].custrecord_wms_schpickactionids))
			{
				pickTaskDetails = JSON.parse(getPickActionDetails[0].custrecord_wms_schpickactionids);
				var pickTasks = Object.keys(pickTaskDetails);

				for(var len = 0; len < pickTasks.length;len++){
					var pickactions = pickTaskDetails[pickTasks[len]];
					pickactions = pickactions + ",";

					var tempPickActionsArr = pickactions.split(',');
					for(var obj in tempPickActionsArr){
						if(tempPickActionsArr[obj]){
							pickActionsIDArray.push(tempPickActionsArr[obj]);
						}
					}
				}
				log.debug('pickActionsIDArray',pickActionsIDArray);
			}
		}

		var currentUser = runtime.getCurrentUser().id;
		var pickTaskQuery = query.create({
			type: query.Type.PICK_TASK
		});

		var pickActionsFieldsJoin = pickTaskQuery.autoJoin({
			fieldId: 'pickactions'
		});

		var transactionFieldsJoin = pickTaskQuery.autoJoin({
			fieldId: 'pickactions.ordernumber^transaction'
		});

		var pickTaskStatusCond = pickTaskQuery.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['READY','INPROGRESS']
		});
		var pickActionsStatusCond = pickActionsFieldsJoin.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['STARTED','PICKED','STAGED']
		});
		var pickActionsQuantityStagedCond = pickActionsFieldsJoin.createCondition({
			fieldId: 'inventorydetail.quantitystaged',			
			operator: query.Operator.EQUAL,
			values: 0
		});


		var waveNameCond = pickTaskQuery.createCondition({
			fieldId: 'wave^transaction.tranid',
			operator: query.Operator.IS,
			values: waveName
		});
		var locCond = pickTaskQuery.createCondition({
			fieldId: 'location',
			operator: query.Operator.EQUAL,
			values: warehouseLocationId
		});

		var waveStatusCond = pickTaskQuery.createCondition({
			fieldId: 'wave^transaction.status',
			operator: query.Operator.ANY_OF,
			values:  ['Wave:B','Wave:C']
		});
		
		var restrictStageProcessFlag = utility.getSystemRuleValue('Allow staging for assigned picker only',warehouseLocationId);


			 pickTaskQuery.columns = [transactionFieldsJoin.createColumn({fieldId: 'trandisplayname', groupBy: true}),
				 transactionFieldsJoin.createColumn({fieldId: 'id', groupBy: true})];

		if(pickActionsIDArray.length > 0){
			var pickActionsCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF_NOT,
				values: pickActionsIDArray
			});

			if(restrictStageProcessFlag == 'Y'){
				var pickTaskQuery_Picker = pickTaskQuery.createCondition({
					fieldId: 'picker',
					operator: query.Operator.ANY_OF,
					values: [runtime.getCurrentUser().id]
				});
			
					pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
							locCond,pickActionsStatusCond,pickTaskStatusCond,pickActionsCond,pickTaskQuery_Picker,pickActionsQuantityStagedCond);
							if(utility.isValueValid(pickTaskId)){
			var pickTaskCond = pickTaskQuery.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: pickTaskId
			});
			pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
							locCond,pickActionsStatusCond,pickTaskStatusCond,pickActionsCond,pickTaskQuery_Picker,pickActionsQuantityStagedCond,pickTaskCond);
			}
				

			}
			else{
				
				pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
						locCond,pickActionsStatusCond,pickTaskStatusCond,pickActionsCond,pickActionsQuantityStagedCond);
							if(utility.isValueValid(pickTaskId)){
			var pickTaskCond = pickTaskQuery.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: pickTaskId
			});
			pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
						locCond,pickActionsStatusCond,pickTaskStatusCond,pickActionsCond,pickActionsQuantityStagedCond,pickTaskCond);
			}
				
			}
		}
		else{
			if(restrictStageProcessFlag == 'Y'){

				var pickTaskQuery_Picker = pickTaskQuery.createCondition({
					fieldId: 'picker',
					operator: query.Operator.ANY_OF,
					values: [runtime.getCurrentUser().id]
				});

					pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
							locCond,pickActionsStatusCond,pickTaskStatusCond,pickTaskQuery_Picker,pickActionsQuantityStagedCond);
							if(utility.isValueValid(pickTaskId)){
			var pickTaskCond = pickTaskQuery.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: pickTaskId
			});
				pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
							locCond,pickActionsStatusCond,pickTaskStatusCond,pickTaskQuery_Picker,pickActionsQuantityStagedCond,pickTaskCond);
			}
				
			}
			else{

					pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
							locCond,pickActionsStatusCond,pickTaskStatusCond,pickActionsQuantityStagedCond);
											if(utility.isValueValid(pickTaskId)){
			var pickTaskCond = pickTaskQuery.createCondition({
				fieldId: 'id',
				operator: query.Operator.ANY_OF,
				values: pickTaskId
			});
				pickTaskQuery.condition = pickTaskQuery.and(waveNameCond,waveStatusCond,
							locCond,pickActionsStatusCond,pickTaskStatusCond,pickActionsQuantityStagedCond,pickTaskCond);
			}
				
			}
				
			}
		

		var pickTaskListDetailsArr=[];
		var results = pickTaskQuery.run().results;
		//log.error("results",results);
		for(var result in results){
			if(results[result]){
				var resultObj = {};
				var displayName = results[result].values[0];
				resultObj.trandisplayname =  displayName
				if(displayName.indexOf('#')!=-1){
					var val = displayName.split('#');
					resultObj.trandisplayname = val[1];
				}
				resultObj.id = results[result].values[1];

				pickTaskListDetailsArr.push(resultObj);
			}
		}
		return pickTaskListDetailsArr;
	}

	function getResultsFromNQuery(columnsObj,pageResults,searchDetailsArr)
	{
		var columns = columnsObj;
		var values = pageResults;
		for(var res in values){
			if(values[res]){
				var resObj = values[res].values;
				var resultObj = {};
				if(columns){
					for(var col in columns){
						if(columns[col]){
							var colName = columns[col].fieldId;
							if(colName == 'trandisplayname'){
								if(resObj[col].indexOf('#')!=-1){
									var val = resObj[col].split('#');
									resultObj[colName] = val[1];
								}
								else{
									resultObj[colName] = resObj[col];
								}
							}
							else{
								resultObj[colName] = resObj[col];
							}
						}
					}
					searchDetailsArr.push(resultObj);
				}
			}
		}

	}

    function validateScannedContainer(warehouseLocationId, containerName,
                                          orderInternalId,isZonePickingEnabled,zoneIdArr) {
    	
		var isValidObj = {};
		isValidObj.isValid = true;
		var pickTaskSearch = query.create({type: query.Type.PICK_TASK});

		var locCond = pickTaskSearch.createCondition({
			fieldId: 'location',
			operator: query.Operator.ANY_OF,
			values: warehouseLocationId
		});

		var pickActionOrdersCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.ordernumber',
			operator: query.Operator.ANY_OF_NOT,
			values: orderInternalId				
		});

		var pickActionCartonCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.inventorydetail.pickcarton',
			operator: query.Operator.IS,
			values: containerName
		});
		var pickActionStatusCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.status',
			operator: query.Operator.ANY_OF,
			values: ['PICKED','STARTED','STAGED','DONE']				
		});
		var waveStatusCond = pickTaskSearch.createCondition({
			fieldId: 'wave^transaction.status',
			operator: query.Operator.ANY_OF,
			values: ['Wave:C']			
		});
		var trasactionTypeCond = pickTaskSearch.createCondition({
			fieldId: 'wave^transaction.type',
			operator: query.Operator.IS,
			values: 'Wave'		
		});

        var trasactionStatusCond = pickTaskSearch.createCondition({
            fieldId: 'pickactions.transactionnumber^transaction.status',
            operator: query.Operator.ANY_OF_NOT,
            values: ['ItemShip:B','ItemShip:C']
        });

		var orderStatusCond = pickTaskSearch.createCondition({
			fieldId: 'pickactions.ordernumber^transaction.status',
			operator: query.Operator.ANY_OF,
			values: ['SalesOrd:B','SalesOrd:D','SalesOrd:E','TrnfrOrd:B','TrnfrOrd:D','TrnfrOrd:E']
		});
		pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'id'			
		}));
		pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'pickactions.transactionnumber^transaction.status'			
		}));
		pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'pickactions.ordernumber^transaction.tranid'			
		}));
	
				
		pickTaskSearch.condition = pickTaskSearch.and(locCond,pickActionOrdersCond,pickActionCartonCond,
				pickActionStatusCond,trasactionTypeCond,waveStatusCond,trasactionStatusCond,orderStatusCond);
		if(isZonePickingEnabled == true && zoneIdArr.length > 0){
			pickActionOrdersCond = pickTaskSearch.createCondition({
				fieldId: 'pickactions.ordernumber',
				operator: query.Operator.ANY_OF,
				values: orderInternalId				
			});
			pickActionZoneCond = pickTaskSearch.createCondition({
				fieldId: 'recommendedbin.zone',
				operator: query.Operator.ANY_OF_NOT,
				values: zoneIdArr				
			});
			pickTaskSearch.condition = pickTaskSearch.and(locCond,pickActionOrdersCond,pickActionCartonCond,
					pickActionStatusCond,trasactionTypeCond,pickActionZoneCond,trasactionStatusCond,orderStatusCond);
		 pickTaskSearch.columns.push(pickTaskSearch.createColumn({
			fieldId: 'recommendedbin.zone.name'			
		}));
		}
		

		// Run the query as a paged query with 10 results per page
		var results = pickTaskSearch.runPaged({
			pageSize: 1000
		});

		log.debug(results.pageRanges.length);
		log.debug(results.count);

		var page = '';
		var pageCoulmns = '';
		var pageResults = '';
		var resultJsonArr =[];
		// Retrieve the query results using an iterator
		var iterator = results.iterator();

		iterator.each(function(result) {
			page = result.value;
			pageResults = page.data.results;
			if(pageResults){
				isValidObj = checkPickCartonStatus(pageResults);
			}
			return isValidObj ;
		});
		return isValidObj ;
	}
    function checkPickCartonStatus(pageResults){
		var isCartonPacked = true;
		var orderDetail='';
		var zoneDetail = '';
		for(var result in pageResults){
			if(pageResults[result]){
				if(pageResults[result].values[1] == 'A' ||
						pageResults[result].values[1] == null ||
						pageResults[result].values[1] == 'null' || pageResults[result].values[1]== undefined ||
						pageResults[result].values[1] == ''){//A--ItemFulfillmebt Picked
					isCartonPacked = false;
				    orderDetail = pageResults[result].values[2];
				    zoneDetail = pageResults[result].values[3];
					break;
				}
			}

		}
		return  {'isValid' : isCartonPacked,
		        'orderDetail' : orderDetail,
		        'zoneDetail' : zoneDetail 
		      };
	}
    function _checkIfAnyItemIsAlreadyStaged(pickingType,waveName,orderInternalId,whLocation){

    	var boolAnyItemIsAlreadyStaged = 'N';
		var pickTaskSearch = query.create({type: query.Type.PICK_TASK});
		var pickActionsFieldsJoin = pickTaskSearch.autoJoin({
			fieldId: 'pickactions'
		});

		var locCond = pickTaskSearch.createCondition({
			fieldId: 'location',
			operator: query.Operator.ANY_OF,
			values: whLocation
		});
		var waveOrOrderCond = '';
		if(pickingType == 'multiOrder')	{ 
			var waveIdArr = _getWaveInternalId(waveName);
			if(waveIdArr.length >0){
				waveOrOrderCond = pickTaskSearch.createCondition({
					fieldId: 'wave',
					operator: query.Operator.ANY_OF,
					values: waveIdArr[0].internalid
				});
			}

		}
		else {
			waveOrOrderCond = pickActionsFieldsJoin.createCondition({
				fieldId: 'ordernumber',
				operator: query.Operator.ANY_OF,
				values: orderInternalId
			});
		}
		var pickActionStatusCond = pickActionsFieldsJoin.createCondition({
			fieldId: 'status',
			operator: query.Operator.ANY_OF,
			values: ['STAGED','DONE']				
		});
		pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond,waveOrOrderCond,locCond);
		pickTaskSearch.columns = [pickActionsFieldsJoin.createColumn({fieldId: 'stagingbin'})];

		var results = pickTaskSearch.runPaged({
			pageSize: 1000
		});
		var page = '';
		var pageResults = [];
		// Retrieve the query results using an iterator
		var iterator = results.iterator();
		iterator.each(function(result) {
			page = result.value;
			pageResults.push(page.data.results);
			return true;
		});
		
		if(pageResults.length > 0){
			boolAnyItemIsAlreadyStaged = 'Y';
		}
		return boolAnyItemIsAlreadyStaged;
	}
            function _getStagedOrdersCount(pickingType,waveName,orderInternalId,whLocation){

                var boolAnyItemIsAlreadyStaged = 'N';
                var pickTaskSearch = query.create({type: query.Type.PICK_TASK});
                var pickActionsFieldsJoin = pickTaskSearch.autoJoin({
                    fieldId: 'pickactions'
                });

                var locCond = pickTaskSearch.createCondition({
                    fieldId: 'location',
                    operator: query.Operator.ANY_OF,
                    values: whLocation
                });
                var waveOrOrderCond = '';

                    var waveIdArr = _getWaveInternalId(waveName);
                    if(waveIdArr.length >0){
                        waveOrOrderCond = pickTaskSearch.createCondition({
                            fieldId: 'wave',
                            operator: query.Operator.ANY_OF,
                            values: waveIdArr[0].internalid
                        });
                    }



                var pickActionStatusCond = pickActionsFieldsJoin.createCondition({
                    fieldId: 'status',
                    operator: query.Operator.ANY_OF,
                    values: ['STARTED','PICKED']
                });
                pickTaskSearch.condition = pickTaskSearch.and(pickActionStatusCond,waveOrOrderCond,locCond);
                pickTaskSearch.columns = [pickActionsFieldsJoin.createColumn({fieldId: 'stagingbin'})];

                var results = pickTaskSearch.runPaged({
                    pageSize: 1000
                });

             var   totalSearchCount = results.count;

             if(totalSearchCount == null || totalSearchCount ==undefined || totalSearchCount == "")
             {
                 totalSearchCount = 0;
             }
             return totalSearchCount;
            }

            function _getItemsInventoryDetailswithInvStatusEnable(searchName,itemInternalId,binInternalId,WhLocation,itemType){

                var searchObj = search.load({ id : searchName,type:search.Type.INVENTORY_BALANCE});


                if (utility.isValueValid(WhLocation)) {
                    searchObj.filters.push(search.createFilter({ name :'location',
                        operator: search.Operator.ANYOF,
                        values: WhLocation
                    }));
                }
                if (utility.isValueValid(itemInternalId)) {
                    searchObj.filters.push(search.createFilter({ name :'internalid',
                        join :'item',
                        operator: search.Operator.ANYOF,
                        values: itemInternalId
                    }));
                }
                if (utility.isValueValid(binInternalId)) {
                    searchObj.filters.push(search.createFilter({ name :'binnumber',
                        operator: search.Operator.ANYOF,
                        values: binInternalId
                    }));
                }
                searchObj.filters.push(search.createFilter({ name :'available',
                    operator: search.Operator.GREATERTHAN,
                    values: 0
                }));

				if(itemType == "lotnumberedinventoryitem" || itemType==
					"lotnumberedassemblyitem") {
					var systemRule_AllowExpiredItems = utility.getSystemRuleValue('Allow picking of expired items?', WhLocation);
					if (systemRule_AllowExpiredItems == 'N' || systemRule_AllowExpiredItems == '') {
						var currDate = utility.DateStamp();
						currDate = format.parse({
							value: currDate,
							type: format.Type.DATE
						});
						currDate = format.format({
							value: currDate,
							type: format.Type.DATE
						});

						var dateFormat = utility.DateSetting();
						var defalutExpiryDate = utility.setExpiryDate(dateFormat, '01', '01', '2199');
						searchObj.filters.push(search.createFilter({
							name: 'formuladate',
							operator: search.Operator.ONORAFTER,
							formula: "NVL({inventorynumber.expirationdate},TO_DATE('" + defalutExpiryDate + "','" + dateFormat + "'))",
							values: currDate
						}));
					}
				}

                var alltaskresults = utility.getSearchResultInJSON(searchObj);
                return alltaskresults;
            }
            function _checkAndCloseSerials(serialNum,transactionInternalId,itemInternalId){
                log.debug('serialNum',serialNum);
                log.debug('transactionInternalId',transactionInternalId);
                log.debug('itemInternalId',itemInternalId);
                var serialSearch = search.load({
                    id: 'customsearch_wmsse_wo_serialentry_srh',
                });
                var serailFilters = serialSearch.filters;
                if(utility.isValueValid(serialNum)) {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_no',
                        operator: search.Operator.IS,
                        values: serialNum
                    }));
                }
                serailFilters.push(search.createFilter({
                    name: 'custrecord_wmsse_ser_tasktype',
                    operator: search.Operator.ANYOF,
                    values: 3//pick
                }));
                if(utility.isValueValid(transactionInternalId))
                {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_ordno',
                        operator: search.Operator.ANYOF,
                        values: transactionInternalId
                    }));
                }
                if(utility.isValueValid(itemInternalId))
                {
                    serailFilters.push(search.createFilter({
                        name: 'custrecord_wmsse_ser_item',
                        operator: search.Operator.ANYOF,
                        values: itemInternalId
                    }));
                }
                serialSearch.filters = serailFilters;
                var serialSearchResults =utility.getSearchResultInJSON(serialSearch);
                log.debug('serialSearchResults11111111111',serialSearchResults);
                if(serialSearchResults.length > 0)
                {
                    log.debug('serialSearchResults',serialSearchResults.length);
                    for (var j = 0; j < serialSearchResults.length; j++) {
                        var TempRecord = serialSearchResults[j];
                        var id = record.submitFields({
                            type : 'customrecord_wmsse_serialentry',
                            id: TempRecord.id,
                            values: {
                                id: TempRecord.id,
                                name : TempRecord.name,
                                custrecord_wmsse_ser_note1 : 'because of discontinue of serial number scanning we have marked this serial number as closed',
                                custrecord_wmsse_ser_status : true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields : true
                            }
                        });
                    }
                }
            }
            function chkSmartCountEnabled(RuleId, loc,processType ) {
                var systemRuleValue = 'N';

                try {
                    var vprocessType= utility.getProcessId(processType)
                    log.debug({title: 'vprocessType',details:vprocessType});
                    var LANG = "LANGUAGE";
                    var  locale = runtime.getCurrentUser().getPreference(LANG)
                    if(locale != "en_US")
                    {
                        RuleId = translator.getKeyBasedonValue(RuleId);
                    }

                    var searchRec = search.load({
                        id: 'customsearch_wmsse_sys_rules'
                    });
                    var filters = searchRec.filters;
                    filters.push(search.createFilter({name: 'name',operator: search.Operator.IS,values: RuleId.toString()}),
                        search.createFilter({name: 'isinactive',operator: search.Operator.IS,values: false}));
                    if(utility.isValueValid(loc))
                    {
                        filters.push(search.createFilter({name: 'custrecord_wmssesite',	operator: search.Operator.ANYOF,values: ['@NONE@', loc]	}));
                    }
                    if(utility.isValueValid(vprocessType))
                    {
                        filters.push(search.createFilter({name: 'custrecord_wmsseprocesstype',operator: search.Operator.ANYOF,values: vprocessType}));
                    }
                    filters.push(search.createFilter({name: 'custrecord_wmsserulevalue',operator: search.Operator.IS,values: 'Y'}));
                    searchRec.filters = filters;
                    var searchresults = utility.getSearchResultInJSON(searchRec);
                    log.debug({title: 'searchresults',details:searchresults});
                    if (utility.isValueValid(searchresults) && searchresults.length > 0) {
                        systemRuleValue= "Y";
                    }

                }
                catch(e){
                    systemRuleValue = 'N';
                    log.error({title: 'exception in chkSmartCountEnabled', details: e});
                }
                return systemRuleValue;
            }
			function getSmartCountIntegrationRecords(itemId,binId,loc)
			{
				var searchQuery = query.create({
					type: 'customrecord_wms_sc_integration'
				});
				var inactiveFilter = searchQuery.createCondition({
					fieldId: 'isinactive',
					operator: query.Operator.IS,
					values: false
				});
				var itemFilter = searchQuery.createCondition({
					fieldId: 'custrecord_wms_sc_item',
					operator: query.Operator.ANY_OF,
					values: itemId
				});
				var binFilter = searchQuery.createCondition({
					fieldId: 'custrecord_wms_sc_bin',
					operator: query.Operator.ANY_OF,
					values: binId
				});
				var locFilter = searchQuery.createCondition({
					fieldId: 'custrecord_wms_sc_loc',
					operator: query.Operator.ANY_OF,
					values: loc
				});


				searchQuery.condition = searchQuery.and(inactiveFilter,itemFilter,binFilter,locFilter);
				searchQuery.columns = [
					searchQuery.createColumn({
						fieldId: 'id',
						alias:'internalid'
					})

				];
				return searchQuery.run().asMappedResults();
			}
   
	return {
		getASNSystemRuleValue : _getASNSystemRuleValue,
		getAllEligibleItemFulfillments : _getAllEligibleItemFulfillments,
		getinvDetailInfo: _getinvDetailInfo,
		getOrderInformation: _getOrderInformation,
		getContainerCUCCDetails: _getContainerCUCCDetails,
		getTrackingNoDetails:_getTrackingNoDetails,
		getSKUDetails:_getSKUDetails,
		updateParentRecord:_updateParentRecord,
		updateEDIOutboundStage:_updateEDIOutboundStage,
		updateItemFulfillment:_updateItemFulfillment,
		getAllItemInfo:_getAllItemInfo,
		getIndividualSKUDetails:_getIndividualSKUDetails,
		getOrderLineInformation: _getOrderLineInformation,
		getMOPickTaskStageflagforAlreadystaged:getMOPickTaskStageflagforAlreadystaged,
		getERPShipItems:getERPShipItems,
		getSOPickTaskStageflagforAlreadystaged:getSOPickTaskStageflagforAlreadystaged,
		checkParentRecord:_checkParentRecord,
		getMultiOrderPickTaskOrderDetails:getMultiOrderPickTaskOrderDetails,
		picktaskupdate:picktaskupdate,
		getPickTaskDetails:getPickTaskDetails,
		getPickingOrderDetails:getPickingOrderDetails,
		getPickingWaveDetails:getPickingWaveDetails,
		getwavePickTaskDetails:getwavePickTaskDetails,
		validateStageBin:_validateStageBin,
		updateStageBin:_updateStageBin,
		getStagedPickTaskDetails:getStagedPickTaskDetails,
		getMultiOrderWaveList:getMultiOrderWaveList,
		getMultiOrderContainerList:getMultiOrderContainerList,
		getMultiOrderStageItemList:getMultiOrderStageItemList,		
		multiOrderPicktaskUpdate:multiOrderPicktaskUpdate,
		fnEmptyBinOrNoStock:fnEmptyBinOrNoStock,
		getMultiOrderPickTaskCompletedDetails:getMultiOrderPickTaskCompletedDetails,
		getPickTaskStageflag:getPickTaskStageflag,
		getOutboundStageBinDetails:getOutboundStageBinDetails,
		getstatusDetailsForValidation:_getstatusDetailsForValidation,
		getBinQtyDetailsItemwiseForValidation:_getBinQtyDetailsItemwiseForValidation,
		getPickTaskDetailsForValidation:_getPickTaskDetailsForValidation,
		getPickTaskDtlstoIncldAlreadyPickedOrders:getPickTaskDtlstoIncldAlreadyPickedOrders,
		updateStageForNonInventoryItem:_updateStageForNonInventoryItem,
		getmultiorderPickTaskDetailsForValidation:_getmultiorderPickTaskDetailsForValidation,
		getTransactionOrderlineCount :_getTransactionOrderlineCount,
		getBaseUnitRate :getBaseUnitRate,
		noCodeSolForPicking:noCodeSolForPicking,
		getPickingLotDetails:_getPickingLotDetails,
        getWaveInternalId: _getWaveInternalId,
        validatePicker: validatePicker,
        updateAssignedPicker: updateAssignedPicker,
        getPicktasksDetailsReadyToStage :getPicktasksDetailsReadyToStage,
        updatePickTaskStageBin:updatePickTaskStageBin,
        updatePickTaskStatusDone:updatePickTaskStatusDone,
        createOrUpdateLotJSONObject:_createOrUpdateLotJSONObject,
		getCommittedOrderList : getCommittedOrderList,
		createWave : createWave,
		bulkPickTaskUpdate: bulkPickTaskUpdate,
		getOrdersForBulkPick:getOrdersForBulkPick,
		getPickactionsIdsForPickTask:getPickactionsIdsForPickTask,
        getShowStageFlag:getShowStageFlag,
        fillObjectWithNextOrderDetails:fillObjectWithNextOrderDetails,
        fillObjectForSerialTallyScan:fillObjectForSerialTallyScan,
        getExitingSerial:getExitingSerial,
		createWMSSerialEntry:createWMSSerialEntry,
		getDetailsFromScheduleScriptRecord:getDetailsFromScheduleScriptRecord,
		inventoryNumberInternalIdforSerial :inventoryNumberInternalIdforSerial,
		getPickedOrders:_getPickedOrders,
		validateScannedContainer:validateScannedContainer,
		checkIfAnyItemIsAlreadyStaged:_checkIfAnyItemIsAlreadyStaged,
		getItemsInventoryDetailswithInvStatusEnable:_getItemsInventoryDetailswithInvStatusEnable,
        getStagedOrdersCount:_getStagedOrdersCount,
        checkAndCloseSerials:_checkAndCloseSerials,
		updatePickTaskToDoneForSingleOrder:updatePickTaskToDoneForSingleOrder,
		updatePickTaskStatusFormultiOrder:updatePickTaskStatusFormultiOrder,
        chkSmartCountEnabled:chkSmartCountEnabled,
		getSmartCountIntegrationRecords:getSmartCountIntegrationRecords,
		GetEDIconfig:GetEDIconfig,
		GetSODetails:GetSODetails,
		GetEDIconfigLinelevel:GetEDIconfigLinelevel,
		GetEDIconfigDefaultvalues:GetEDIconfigDefaultvalues

	}
});
