/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope public
 * 
 * Created by: DBTI - Ricky Eredillas Jr
 * Date: Nov 13, 2023
 * 
 */
define(['N/record', 'N/query', 'N/format', './wms_utility'],

    function (record, query, format, utility) {

        function execute(context) {

            var invtransferObj = { "department": "Warehouse", "customer": "KANEPACKAGE PHILIPPINE INC", "preparedBy": "John Mosquito", "deliveryDate": "11/13/2023", "itemType": "lotnumberedassemblyitem", "whLocation": "669", "towhLocation": "842", "itemId": "437395", "quantity": 1, "fromBinId": "5283", "toBinId": "1626", "batchno": "SFLI-JO-23119-179407", "units": "Set", "stockConversionRate": "1", "opentaskQty": 1 }
            inventoryInvTransfer(invtransferObj);

        }

        function inventoryInvTransfer(invtransferObj) {
			log.debug({ title: 'invtransferObj', details: invtransferObj });
			var itemType = invtransferObj.itemType;
			var whLocation = invtransferObj.whLocation;
			var towhLocation = invtransferObj.towhLocation;
			var itemId = invtransferObj.itemId;
			var quantity = invtransferObj.quantity;
			var fromBinId = invtransferObj.fromBinId;
			var toBinId = invtransferObj.toBinId;
			var batchno = invtransferObj.batchno;
			var actualBeginTime = invtransferObj.actualBeginTime;
			var units = invtransferObj.units;
			var stockConversionRate = invtransferObj.stockConversionRate;
			var opentaskQty = invtransferObj.opentaskQty;
			var inventoryStatusFeature = utility.isInvStatusFeatureEnabled();
			log.debug('inventoryStatusFeature', inventoryStatusFeature);
			var isTallyScanRequired = invtransferObj.isTallyScanRequired;
			var tallyQtyArr = invtransferObj.tallyQtyArr;
			var lotArray = invtransferObj.lotArray;
			var department = invtransferObj.department.toLowerCase();
			var customer = invtransferObj.customer.toLowerCase();
			var employee = invtransferObj.preparedBy.toLowerCase().split(" ").join("");

			var invTransfer = record.create({
				type: record.Type.INVENTORY_TRANSFER,
				isDynamic: true
			});

			if (stockConversionRate == null || stockConversionRate == '' || stockConversionRate == undefined)
				stockConversionRate = 1;

			var vSubsidiaryVal = utility.getSubsidiaryforLocation(whLocation);
			if (vSubsidiaryVal != null && vSubsidiaryVal != '') {
				invTransfer.setValue({
					fieldId: 'subsidiary',
					value: vSubsidiaryVal
				});
			}
			invTransfer.setValue({
				fieldId: 'location',
				value: whLocation
			});
			invTransfer.setValue({
				fieldId: 'transferlocation',
				value: towhLocation
			});
			var currDate = utility.DateStamp();
			var parsedCurrentDate = format.parse({
				value: currDate,
				type: format.Type.DATE
			});
			invTransfer.setValue({
				fieldId: 'trandate',
				value: parsedCurrentDate
			});

			var queryResult = query.runSuiteQL({
				query: "SELECT (select id from department where lower(name) LIKE '" + department + "') as Department, (select id from customer where lower(companyname) like '" + customer + "') as Customer, (select id from employee where lower(concat(concat(firstname, middlename), lastname)) like '" + employee + "') as Employee",
			});

			log.debug('Employee', employee);
			log.debug('Query Result', queryResult.results[0].values);

			// [9,7428,14974]

			var departmentId = queryResult.results[0].values[0];

			var customerId = queryResult.results[0].values[1];

			var employeeId = queryResult.results[0].values[2];

			var deliveryDate = new Date(Date.parse(invtransferObj.deliveryDate));

			log.debug('Delivery Date', deliveryDate);

			invTransfer.setValue({
				fieldId: 'department',
				value: departmentId,
			});

			invTransfer.setValue({
				fieldId: 'custbody41',
				value: customerId,
			});

			invTransfer.setValue({
				fieldId: 'custbody1',
				value: employeeId,
			});

			invTransfer.selectNewLine({
				sublistId: 'inventory',

			});
			invTransfer.setCurrentSublistValue({
				sublistId: 'inventory',
				fieldId: 'item',
				value: itemId
			});
			invTransfer.setCurrentSublistValue({
				sublistId: 'inventory',
				fieldId: 'adjustqtyby',
				value: quantity
			});
			invTransfer.setCurrentSublistValue({
				sublistId: 'inventory',
				fieldId: 'custcol_pruduction_plan_date',
				value: deliveryDate
			});
			if (itemType == "inventoryitem" || itemType == "assemblyitem") {
				//getting use bins for item
				var columnArray = [];
				columnArray.push('usebins');
				var itemUseBins = true;
				if (utility.isValueValid(itemId)) {
					var itemUseBinRes = utility.getItemFieldsByLookup(itemId, columnArray);
					if (utility.isValueValid(itemUseBinRes)) {
						itemUseBins = itemUseBinRes.usebins;
					}
				}

				if (utility.isValueValid(fromBinId) || (utility.isValueValid(toBinId) && utility.isValueValid(itemUseBins) && itemUseBins == true) || inventoryStatusFeature) {

					var compSubRecord = invTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					var complinelength = compSubRecord.getLineCount({ sublistId: 'inventoryassignment' });
					if (complinelength > 0 && (itemType == "inventoryitem" || itemType == "assemblyitem")) {
						for (var invtassignmentLine = 0; invtassignmentLine < complinelength; invtassignmentLine++) {
							compSubRecord.removeLine({
								sublistId: 'inventoryassignment',
								line: invtassignmentLine
							});
						}
						complinelength = 0;
					}

					if ((isTallyScanRequired == true) && (inventoryStatusFeature == true)) {

						for (var statusvalue = 0; statusvalue < statusArray.length; statusvalue++) {
							compSubRecord.selectNewLine({
								sublistId: 'inventoryassignment'
							});

							if (tallyQtyArr[statusvalue] == null || tallyQtyArr[statusvalue] == '' || tallyQtyArr[statusvalue] == undefined)
								tallyQtyArr[statusvalue] = 0;


							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'quantity',
								value: Number(Big(tallyQtyArr[statusvalue]).div(stockConversionRate))
							});
							if (utility.isValueValid(fromBinId)) {
								compSubRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'binnumber',
									value: fromBinId
								});
							}
							if (utility.isValueValid(toBinId)) {
								compSubRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'tobinnumber',
									value: toBinId
								});
							}
							compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
						}
					}
					else {


						compSubRecord.selectNewLine({
							sublistId: 'inventoryassignment'
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'quantity',
							value: quantity
						});
						if (utility.isValueValid(fromBinId)) {
							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'binnumber',
								value: fromBinId
							});
						}
						if (utility.isValueValid(toBinId)) {
							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'tobinnumber',
								value: toBinId
							});
						}
						compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
					}
				}

			}
			else if (itemType == "lotnumberedinventoryitem" || itemType == "lotnumberedassemblyitem") {

				if (isTallyScanRequired == true) {
					var compSubRecord = invTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});

					for (var lotvalue = 0; lotvalue < lotArray.length; lotvalue++) {

						if (tallyQtyArr[lotvalue] == null || tallyQtyArr[lotvalue] == '' || tallyQtyArr[lotvalue] == undefined)
							tallyQtyArr[lotvalue] = 0;


						tallyQtyArr[lotvalue] = Number(Big(tallyQtyArr[lotvalue]).div(stockConversionRate));

						compSubRecord.selectNewLine({
							sublistId: 'inventoryassignment'
						});

						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'quantity',
							value: tallyQtyArr[lotvalue]
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'receiptinventorynumber',
							value: lotArray[lotvalue]
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: fromBinId
						});
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'tobinnumber',
							value: toBinId
						});

						compSubRecord.commitLine({ sublistId: 'inventoryassignment' });


					}
				}
				else {
					var compSubRecord = invTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					compSubRecord.selectNewLine({
						sublistId: 'inventoryassignment'
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'quantity',
						value: quantity
					});
					compSubRecord.setCurrentSublistValue({
						sublistId: 'inventoryassignment',
						fieldId: 'receiptinventorynumber',
						value: batchno
					});
					if (utility.isValueValid(fromBinId)) {
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'binnumber',
							value: fromBinId
						});
					}
					if (utility.isValueValid(toBinId)) {
						compSubRecord.setCurrentSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'tobinnumber',
							value: toBinId
						});
					}
					compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
				}
			}
			else {
				var filterssertemp = [];
				filterssertemp.push(search.createFilter({ name: 'custrecord_wmsse_ser_tasktype', operator: search.Operator.ANYOF, values: 9 }));
				if (utility.isValueValid(fromBinId)) {
					filterssertemp.push(search.createFilter({ name: 'custrecord_wmsse_ser_bin', operator: search.Operator.ANYOF, values: fromBinId }));
				}
				filterssertemp.push(search.createFilter({ name: 'custrecord_wmsse_ser_item', operator: search.Operator.ANYOF, values: itemId }));
				var columns = [];
				columns.push(search.createColumn('custrecord_wmsse_ser_no'));
				columns.push(search.createColumn('name'));
				var SrchRecordTmpSeriaObj = search.create({ type: 'customrecord_wmsse_serialentry', filters: filterssertemp, columns: columns });
				var SrchRecordTmpSerial1 = utility.getSearchResultInJSON(SrchRecordTmpSeriaObj);
				log.debug({ title: 'SrchRecordTmpSerial1', details: SrchRecordTmpSerial1 });
				if (SrchRecordTmpSerial1 != null && SrchRecordTmpSerial1 != '') {
					var compSubRecord = invTransfer.getCurrentSublistSubrecord({
						sublistId: 'inventory',
						fieldId: 'inventorydetail'
					});
					var serialMatchFound = true;
					var serialNameDtlArr = [];
					var serialName = "";
					var currentUserId = runtime.getCurrentUser().id;
					for (var n = 0; n < SrchRecordTmpSerial1.length; n++) {
						serialName = SrchRecordTmpSerial1[n].name;
						serialMatchFound = true;
						if (serialName) {
							serialNameDtlArr = serialName.split("^");

							if (serialNameDtlArr.length == 3) {
								if ((serialNameDtlArr[0] != "inventoryTransfer")
									|| serialNameDtlArr[1] != currentUserId) {
									serialMatchFound = false;
								}
							}
						}
						if (serialMatchFound) {
							compSubRecord.selectNewLine({
								sublistId: 'inventoryassignment'
							});
							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'quantity',
								value: 1
							});
							compSubRecord.setCurrentSublistValue({
								sublistId: 'inventoryassignment',
								fieldId: 'receiptinventorynumber',
								value: SrchRecordTmpSerial1[n].custrecord_wmsse_ser_no
							});
							if (utility.isValueValid(fromBinId)) {
								compSubRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'binnumber',
									value: fromBinId
								});
							}
							if (utility.isValueValid(toBinId)) {
								compSubRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'tobinnumber',
									value: toBinId
								});
							}
							compSubRecord.commitLine({ sublistId: 'inventoryassignment' });
						}
					}
					var serialName = "";
					var serialNameDtlArr = [];
					var serialMatchFound = true;
					for (var j = 0; j < SrchRecordTmpSerial1.length; j++) {
						var TempRecord = SrchRecordTmpSerial1[j];
						serialName = TempRecord.name;
						serialMatchFound = true;
						if (serialName) {
							serialNameDtlArr = serialName.split("^");
							if (serialNameDtlArr.length == 3) {

								if ((serialNameDtlArr[0] != "inventoryTransfer")
									|| serialNameDtlArr[1] != currentUserId) {
									serialMatchFound = false;
								}
							}
						}
						if (serialMatchFound) {
							var serialRec = record.load({
								type: 'customrecord_wmsse_serialentry',
								id: TempRecord.id
							});
							serialRec.setValue({ fieldId: 'id', value: TempRecord.id });
							serialRec.setValue({ fieldId: 'name', value: TempRecord.name });
							serialRec.setValue({
								fieldId: 'custrecord_wmsse_ser_note1',
								value: 'because of discontinue of serial number scanning we have marked this serial number as closed'
							});
							serialRec.save();
						}
						TempRecord = null;
					}
				}
			}
			invTransfer.commitLine({ sublistId: 'inventory' });
			var inventoryCountId = invTransfer.save();
			log.debug({ title: 'inventoryCountId', details: inventoryCountId });
			
		}

        return {
            execute: execute,
        };
    }
);