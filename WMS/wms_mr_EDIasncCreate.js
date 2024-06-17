/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope public
 */
define(['N/search','N/record','./wms_utility','N/format','./wms_outBoundUtility','N/runtime'],

		function(search,record,utility,format,outBoundUtility,runtime) {


	function getInputData() {

		try
		{
			var asnRuleValue = outBoundUtility.getASNSystemRuleValue();
			return _inputData = outBoundUtility.getAllEligibleItemFulfillments(asnRuleValue);
		}
		catch(e)
		{
			log.error({title:'Exception in Getinputdata',details:e});
		}
	}
	function map(context) {
		if (context != null && context != "" && context != undefined && context.value != null &&
			context.value !== null && context.value != "" && context.value !== "" &&
			context.value != undefined){
			try {
				var resultArr = [];
				var resultObj = {};
				var ItemFulfillmentObj = JSON.parse(context.value);
				resultArr.push(ItemFulfillmentObj);
				for (var val in resultArr) {
					var itemFulfillmentInternalId = resultArr[val]["ItemFulfillment"];
					var IFDetails = resultArr[val];
					var invDetailInfo = outBoundUtility.getinvDetailInfo(itemFulfillmentInternalId);
					var invDetailInfoLength = invDetailInfo.length;
					var count = 0;
					var resArr = [];
					var totalLinesCounter = 0;

					for (var object1 in invDetailInfo) {
						if (count == 0) {
							resArr = [];
						}
						totalLinesCounter = totalLinesCounter + 1;
						var object2 = invDetailInfo[object1];
						object2.tranid = resultArr[val]["tranid"];
						object2.orderInternalid = resultArr[val]["internalid"];
						object2.itemFulfillmentInternalId = resultArr[val]["ItemFulfillment"];
						object2.updateIF = false;
						object2.totalLinesCounter = totalLinesCounter;
						object2.invDetailInfoLength = invDetailInfoLength;
						count = count + 1;
						resArr.push(object2);
						if (count == 100) {
							if (totalLinesCounter == invDetailInfoLength) {
								object2.updateIF = true;
							}
							count = 0;
							var key = itemFulfillmentInternalId + object1;
							context.write(key, resArr);
						} else {
							if (totalLinesCounter == invDetailInfoLength) {
								object2.updateIF = true;
								var key = itemFulfillmentInternalId + object1;
								context.write(key, resArr);
							}
						}
					}
				}
			} catch (e) {
				log.error("e", e);
			}
	}

	}
	function reduce(context) {
		if (context != null && context != "" && context != undefined && context.values != null &&
			context.values !== null && context.values != "" && context.values !== "" &&
			context.values != undefined) {
			try {
				var invDetailInfo = JSON.parse(context.values[0]);
				if(invDetailInfo != undefined && invDetailInfo != "" && invDetailInfo != null) {
					var orderName = invDetailInfo[0]["tranid"];
					var orderInternalId = invDetailInfo[0]["orderInternalid"];
					var itemFulfillmentInternalId = invDetailInfo[0]["itemFulfillmentInternalId"];
					var now = new Date(); // Say it's 7:01PM right now.
					var tStr = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
					var orderInformation = outBoundUtility.getOrderInformation(orderInternalId);
					var orderLineInformation = outBoundUtility.getOrderLineInformation(orderInternalId);

					var _currentDate = utility.DateStamp();
					var IssueDate = format.parse({
						value: _currentDate,
						type: format.Type.DATE
					});

					var prevContainerLP = '';
					var prevItemInternalId = '';
					var CUCC = '';
					var UOM1 = '';
					var UOMQty1 = '';
					var UOMLength1 = '';
					var UOMWidth1 = '';
					var UOMHeight1 = '';
					var UOMWeight1 = '';
					var UOMCube1 = '';
					var Packcode1 = '';
					var UOMlevel1 = '';
					var skuDescription = '';
					var vendor = '';
					var upcCode = '';
					var salesOrdNo = '';
					var tranid = '';
					var shipmethod = '';
					var shipAddressee = '';
					var ShipAddress1 = '';
					var ShipAddress2 = '';
					var Shipcity = '';
					var ShipState = '';
					var shipCountry = '';
					var shipzip = '';
					var shiptoPhone = '';
					var Class = '';
					var consigneeId = '';
					var billAddressee = '';
					var billaddr1 = '';
					var billAddr2 = '';
					var billAddr3 = '';
					var billCity = '';
					var billState = '';
					var billZip = '';
					var billCountry = '';
					var billPhone = '';
					var location = '';
					var customerPO = '';
					var department = '';
					var terms = '';
					var trackingNumbers = '';
					var carrierScacnew = '';
					var ContainerCube = '';
					var carrierIdnew = '';
					var carrierNamenew = '';
					var Route = '';
					var Destination = '';
					var ShiptoEmail = '';
					var ShiptoFax = '';
					var ShippingCharges = '';
					var ContainerMaxWeight = '';
					var OrderType = '';
					var OrderPriority = '';
					var SKUFamily = '';
					var SKUGroup = '';
					var SKUtype = '';
					var Company = '';
					var city = '';
					var state = '';
					var zip = '';
					var Phone = '';
					var itemName = '';
					var lineNumber = '';
					var shipFromAdress1 = '';
					var shipFromAdress2 = '';
					var shipFromAdress3 = '';
					var shipFromCity = '';
					var shipFromState = '';
					var shipFromZip = '';
					var shipFromCountry = '';
					var shipFromPhone = '';
					var _allItemInfo = outBoundUtility.getAllItemInfo(invDetailInfo);

					for (var invIteration in invDetailInfo) {

						if (invDetailInfo[invIteration]) {
							var itemInternalId = invDetailInfo[invIteration]['item'];
							var itemInternalIdText = invDetailInfo[invIteration]['itemText'];
							var actualQunatity = invDetailInfo[invIteration]['quantity'];
							var salesOrderId = invDetailInfo[invIteration]['createdfrom'];
							//var containerLP=invDetailInfo[invIteration]['custrecord_wmsse_packing_container'];
							var containerLP = invDetailInfo[invIteration]['packcarton'];
							var salesOrderText = invDetailInfo[invIteration]['createdfromText'];


							for (var orderLine = 0; orderLine < orderLineInformation.length; orderLine++) {
								var orderItemInternalId = orderLineInformation[orderLine]['item'];
								if (orderItemInternalId == itemInternalId) {
									lineNumber = orderLineInformation[orderLine]['line'];
								}
							}

							if (containerLP != prevContainerLP) {

								var individualCUCCDetailsList = outBoundUtility.getContainerCUCCDetails(containerLP);

								var individualTrackingNo = outBoundUtility.getTrackingNoDetails(containerLP);


								if (utility.isValueValid(individualTrackingNo) && individualTrackingNo.length > 0) {
									trackingNumbers = individualTrackingNo[0]['trackingno'];

								}

								if (utility.isValueValid(individualCUCCDetailsList) && individualCUCCDetailsList.length > 0) {
									CUCC = individualCUCCDetailsList[0]['custrecord_wmsse_uccno'];
								}
							}
							prevContainerLP = containerLP;


							if (itemInternalId != prevItemInternalId) {
								var itemInformation = outBoundUtility.getIndividualSKUDetails(_allItemInfo, itemInternalId)


								if (utility.isValueValid(itemInformation) && itemInformation.length > 0) {
									itemInternalId = itemInformation[0]['id'];
									skuDescription = itemInformation[0]['salesdescription'];
									vendor = itemInformation[0]['othervendor'];
									upcCode = itemInformation[0]['upccode'];
									itemName = itemInformation[0]['itemid'];
								}

								UOM1 = 1;
								UOMQty1 = 1;
								UOMLength1 = 1;
								UOMWidth1 = 1;
								UOMHeight1 = 1;
								UOMWeight1 = 1;
								UOMCube1 = 1;
								Packcode1 = 1;
								UOMlevel1 = 1;

							}
							prevItemInternalId = itemInternalId;

							if (utility.isValueValid(orderInformation) && orderInformation.length > 0) {

								salesOrdNo = orderInformation[0]['tranid'];
								tranid = orderInformation[0]['tranid'];
								shipmethod = orderInformation[0]['shipmethodText'];
								shipAddressee = orderInformation[0]['shipaddressee'];
								ShipAddress1 = orderInformation[0]['shipaddress1'];
								ShipAddress2 = orderInformation[0]['shipaddress2'];
								Shipcity = orderInformation[0]['shipcity'];
								ShipState = orderInformation[0]['shipstate'];
								shipCountry = orderInformation[0]['shipcountry'];
								shipzip = orderInformation[0]['shipzip'];
								shiptoPhone = orderInformation[0]['shipphone'];
								Class = orderInformation[0]['classText'];
								consigneeId = orderInformation[0]['entity'];
								billAddressee = orderInformation[0]['billaddressee'];
								billaddr1 = orderInformation[0]['billaddress1'];
								billAddr2 = orderInformation[0]['billaddress2'];
								billAddr3 = orderInformation[0]['billaddress3'];
								billCity = orderInformation[0]['billcity'];
								billState = orderInformation[0]['billstate'];
								billZip = orderInformation[0]['billzip'];
								billCountry = orderInformation[0]['billcountry'];
								billPhone = orderInformation[0]['billphone'];
								location = orderInformation[0]['location'];
								customerPO = orderInformation[0]['otherrefnum'];
								department = orderInformation[0]['department'];
								terms = orderInformation[0]['termsText'];
								//trackingNumbers = orderInformation[0]['trackingnumbers'];
								shipFromAdress1 = orderInformation[0]['address1'];
								shipFromAdress2 = orderInformation[0]['address2'];
								shipFromAdress3 = orderInformation[0]['address3'];
								shipFromCity = orderInformation[0]['city'];
								shipFromState = orderInformation[0]['state'];
								shipFromZip = orderInformation[0]['zip'];
								shipFromCountry = orderInformation[0]['country'];
								shipFromPhone = orderInformation[0]['phone'];
							}


							var ediParamsObj = {};
							ediParamsObj['orderInternalId'] = orderInternalId;
							ediParamsObj['tranid'] = tranid;
							ediParamsObj['UOM1'] = UOM1;
							ediParamsObj['UOMQty1'] = UOMQty1;
							ediParamsObj['UOMLength1'] = UOMLength1;
							ediParamsObj['UOMWidth1'] = UOMWidth1;
							ediParamsObj['UOMWeight1'] = UOMWeight1;
							ediParamsObj['UOMHeight1'] = UOMHeight1;
							ediParamsObj['CUCC'] = CUCC;
							ediParamsObj['ConsigneeId'] = consigneeId;
							ediParamsObj['Billaddressee'] = billAddressee;
							ediParamsObj['Billaddr1'] = billaddr1;
							ediParamsObj['Billaddr2'] = billAddr2;
							ediParamsObj['Billcity'] = billCity;
							ediParamsObj['BillState'] = billState;
							ediParamsObj['Billzip'] = billZip;
							ediParamsObj['Billcountry'] = billCountry;
							ediParamsObj['Billphone'] = billPhone;
							ediParamsObj['Billaddr3'] = billAddr3;
							ediParamsObj['vendor'] = vendor;
							ediParamsObj['ShipAddressee'] = shipAddressee;
							ediParamsObj['Department'] = department;
							ediParamsObj['Class'] = Class;
							ediParamsObj['Billphone'] = billPhone;
							ediParamsObj['Billaddr3'] = billAddr3;
							ediParamsObj['ShipAddress1'] = ShipAddress1;
							ediParamsObj['ShipAddress2'] = ShipAddress2;
							ediParamsObj['Shipcity'] = Shipcity;
							ediParamsObj['ShipState'] = ShipState;
							ediParamsObj['Shipzip'] = shipzip;
							ediParamsObj['ShipCountry'] = shipCountry;
							ediParamsObj['Shipphone'] = shiptoPhone;
							ediParamsObj['ActualArrivalDate'] = _currentDate;
							ediParamsObj['PlannedArrivalDate'] = _currentDate;
							ediParamsObj['containerLP'] = containerLP;
							ediParamsObj['TrackingNumbers'] = trackingNumbers;
							ediParamsObj['IssueDate'] = _currentDate;
							ediParamsObj['Terms'] = terms;
							ediParamsObj['CustomerPO'] = customerPO;
							ediParamsObj['lineno'] = lineNumber;
							ediParamsObj['itemInternalId'] = itemInternalId;
							ediParamsObj['SKUDesc'] = skuDescription;
							ediParamsObj['upcCode'] = upcCode;
							ediParamsObj['Actqty'] = actualQunatity;
							ediParamsObj['location'] = location;
							ediParamsObj['vendor'] = vendor;
							ediParamsObj['itemName'] = itemName;
							ediParamsObj['carrierScacnew'] = carrierScacnew; //
							ediParamsObj['ContainerCube'] = ContainerCube;
							ediParamsObj['carrierIdnew'] = carrierIdnew;
							ediParamsObj['carrierNamenew'] = carrierNamenew;
							ediParamsObj['Route'] = Route;
							ediParamsObj['Destination'] = Destination;
							ediParamsObj['ShiptoEmail'] = ShiptoEmail;
							ediParamsObj['ShiptoFax'] = ShiptoFax;
							ediParamsObj['ShippingCharges'] = ShippingCharges;
							ediParamsObj['ContainerMaxWeight'] = ContainerMaxWeight;
							ediParamsObj['OrderType'] = OrderType;
							ediParamsObj['OrderPriority'] = OrderPriority;
							ediParamsObj['SKUFamily'] = SKUFamily;
							ediParamsObj['SKUGroup'] = SKUGroup;
							ediParamsObj['SKUtype'] = SKUtype;
							ediParamsObj['Company'] = Company;
							ediParamsObj['city'] = city;
							ediParamsObj['state'] = state;
							ediParamsObj['zip'] = zip;
							ediParamsObj['Phone'] = Phone;
							ediParamsObj['shipFromAdress1'] = shipFromAdress1;
							ediParamsObj['shipFromAdress2'] = shipFromAdress2;
							ediParamsObj['shipFromAdress3'] = shipFromAdress3;
							ediParamsObj['shipFromCity'] = shipFromCity;
							ediParamsObj['shipFromState'] = shipFromState;
							ediParamsObj['shipFromZip'] = shipFromZip;
							ediParamsObj['shipFromCountry'] = shipFromCountry;
							ediParamsObj['shipFromPhone'] = shipFromPhone;
							ediParamsObj.shipMethod = shipmethod;

							var ediOutboundStage = outBoundUtility.updateEDIOutboundStage(ediParamsObj);

							if (invDetailInfo[invIteration].updateIF == true) {

								var parentParamsObj = {};
								parentParamsObj['orderInternalId'] = orderInternalId;
								parentParamsObj['salesOrderText'] = salesOrdNo;
								parentParamsObj['ConsigneeId'] = consigneeId;
								var isParentExist = outBoundUtility.checkParentRecord(orderInternalId);

								if (isParentExist.length == 0) {
									var parentRecordupdateResult = outBoundUtility.updateParentRecord(parentParamsObj);
								}
								var now = new Date(); // Say it's 7:01PM right now.
								var tStr = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
								log.debug('parentRecordupdateResult end', tStr);
								var updateItemFulfillment = outBoundUtility.updateItemFulfillment(itemFulfillmentInternalId);
								var now = new Date(); // Say it's 7:01PM right now.
								var tStr = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
								log.debug('updateItemFulfillment end', tStr);
							}
						}
					}
				}
			} catch (e) {
				log.error({title: 'Exception in Reduce', details: e});
				log.error({title: 'errorMessage', details: e.message + " Stack :" + e.stack});
			}
		}
	}

	function summarize(summary) {

		try
		{
		}
		catch(e)
		{
			log.error({title:'Exception in Summarize',details:e});    		
			log.error({title:'errorMessage',details:e.message+" Stack :"+e.stack});
		}

	}

	return {
		getInputData: getInputData,
		reduce: reduce,
		map:map,
		summarize: summarize
	};

});
