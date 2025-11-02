/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/log', 'N/ui/dialog'], function (search, currentRecord, log, dialog) {

	function pageInit(context) {
		var currentRecord = context.currentRecord;

		// If mode is 'create', set the 'custrecord773' field based on 'custrecord760'
		if (context.mode === 'create') {
			var date = currentRecord.getText({
				fieldId: 'custrecord760'
			});

			if (date) {
				var dateParts = date.split('/');
				// Support dates like "29-Oct-2025" or "29-October-2025"
				if (!dateParts || dateParts.length !== 3) {
					var dashParts = (date || '').split('-');
					log.error('Dash parts', dashParts);
					if (dashParts.length === 3) {
						var dayPart = dashParts[0].trim();
						var monthPart = dashParts[1].trim().toLowerCase();
						var yearPart = dashParts[2].trim();

						var monthMap = {
							jan: '01', january: '01',
							feb: '02', february: '02',
							mar: '03', march: '03',
							apr: '04', april: '04',
							may: '05',
							jun: '06', june: '06',
							jul: '07', july: '07',
							aug: '08', august: '08',
							sep: '09', sept: '09', september: '09',
							oct: '10', october: '10',
							nov: '11', november: '11',
							dec: '12', december: '12'
						};

						var mapped = monthMap[monthPart] || monthMap[monthPart.substring(0, 3)];
						month = mapped || monthPart;
						month = month.toString().padStart(2, '0');

						day = dayPart.toString().padStart(2, '0');
						year = yearPart;
						log.error('Mapped month', month);
						log.error('Final day, month, year', day + ', ' + month + ', ' + year);

						var formattedDate = day + '/' + month + '/' + year;
						currentRecord.setText({
							fieldId: 'custrecord773',
							text: formattedDate
						});
						currentRecord.setValue({
							fieldId: 'custrecord1204',
							value: parseInt(month)
						});
						currentRecord.setValue({
							fieldId: 'custrecord1205',
							value: parseInt(year)
						});
					}
				} else {
					day = dateParts[0].padStart(2, '0');
					month = dateParts[1].padStart(2, '0');
					year = dateParts[2];

					var formattedDate = day + '/' + month + '/' + year;
					currentRecord.setText({
						fieldId: 'custrecord773',
						text: formattedDate
					});
					currentRecord.setValue({
						fieldId: 'custrecord1204',
						value: parseInt(month)
					});
					currentRecord.setValue({
						fieldId: 'custrecord1205',
						value: parseInt(year)
					});
				}
			}
		}

		// Check if the mode is 'edit'
		if (context.mode === 'edit') {
			var customer = currentRecord.getValue({
				fieldId: 'custrecord761'
			});

			log.error('Customer', customer);

			if (customer) {
				try {
					// Load saved search 'customsearch4381' for checking the customer
					var searchObj = search.load({
						id: 'customsearch4381'
					});

					searchObj.filters.push(search.createFilter({
						name: 'custitem24',
						operator: search.Operator.IS,
						values: customer
					}));

					// Fetch all search results
					var allResults = [];
					var start = 0;
					var end = 1000;
					var batchSize = 1000;
					var totalRecordsFetched = 0;

					do {
						var searchResults = searchObj.run().getRange({
							start: start,
							end: end
						});

						allResults = allResults.concat(searchResults);
						totalRecordsFetched += searchResults.length;

						start += batchSize;
						end += batchSize;

					} while (searchResults.length === batchSize);

					// Loop through the search results and compare with sublist lines
					var lineCount = currentRecord.getLineCount({
						sublistId: 'recmachcustrecord762'
					});

					log.error('Total Search Results', totalRecordsFetched);
					log.error('allResults', allResults);

					allResults.forEach(function (result) {
						var itemid = result.getValue({
							name: "itemid"
						});
						var salesdesc = result.getValue({
							name: "salesdescription"
						});
						var unitprice = result.getValue({
							name: "unitprice",
							join: "pricing"
						});
						var formulanumeric = result.getValue({
							name: "lastpurchaseprice"
						});

						// Loop through all lines in the sublist
						for (var i = 0; i < lineCount; i++) {
							// Get the item and description values in the current sublist line
							var item = currentRecord.getSublistText({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord764',
								line: i
							});

							log.error('itemid vs item', itemid + ' vs ' + item);

							// Check if the itemid and salesdesc match the sublist values
							if (itemid == item) {
								// If match found, update the unitprice and formulanumeric fields
								currentRecord.selectLine({
									sublistId: 'recmachcustrecord762',
									line: i
								});

								currentRecord.setCurrentSublistValue({
									sublistId: 'recmachcustrecord762',
									fieldId: 'custrecord767',
									value: unitprice
								});

								currentRecord.setCurrentSublistValue({
									sublistId: 'recmachcustrecord762',
									fieldId: 'custrecord768',
									value: formulanumeric
								});

								currentRecord.setCurrentSublistValue({
									sublistId: 'recmachcustrecord762',
									fieldId: 'custrecord763',
									value: customer
								});

								log.error('customer set in line', customer);

								currentRecord.commitLine({
									sublistId: 'recmachcustrecord762'
								});

								log.error({
									title: 'Line ' + (i + 1),
									details: 'Item: ' + itemid + ', Description: ' + salesdesc + ' updated.'
								});
							}
						}
					});
				} catch (e) {
					log.error({
						title: 'Error in pageInit (edit mode)',
						details: e.message
					});
				}
			}
		}
	}

	function fieldChanged(context) {
		var currentRecord = context.currentRecord;

		if (context.fieldId === 'custrecord760') {
			var date = currentRecord.getText({
				fieldId: 'custrecord760'
			});

			if (date) {
				var dateParts = date.split('/');
				if (!dateParts || dateParts.length !== 3) {
					var dashParts = (date || '').split('-');
					log.error('Dash parts', dashParts);
					if (dashParts.length === 3) {
						var dayPart = dashParts[0].trim();
						var monthPart = dashParts[1].trim().toLowerCase();
						var yearPart = dashParts[2].trim();

						var monthMap = {
							jan: '01', january: '01',
							feb: '02', february: '02',
							mar: '03', march: '03',
							apr: '04', april: '04',
							may: '05',
							jun: '06', june: '06',
							jul: '07', july: '07',
							aug: '08', august: '08',
							sep: '09', sept: '09', september: '09',
							oct: '10', october: '10',
							nov: '11', november: '11',
							dec: '12', december: '12'
						};

						var mapped = monthMap[monthPart] || monthMap[monthPart.substring(0, 3)];
						month = mapped || monthPart;
						month = month.toString().padStart(2, '0');

						day = dayPart.toString().padStart(2, '0');
						year = yearPart;
						log.error('Mapped month', month);
						log.error('Final day, month, year', day + ', ' + month + ', ' + year);

						var formattedDate = day + '/' + month + '/' + year;
						currentRecord.setText({
							fieldId: 'custrecord773',
							text: formattedDate
						});
						currentRecord.setValue({
							fieldId: 'custrecord1204',
							value: parseInt(month)
						});
						currentRecord.setValue({
							fieldId: 'custrecord1205',
							value: parseInt(year)
						});
					}
				} else {
					day = dateParts[0].padStart(2, '0');
					month = dateParts[1].padStart(2, '0');
					year = dateParts[2];

					var formattedDate = day + '/' + month + '/' + year;
					currentRecord.setText({
						fieldId: 'custrecord773',
						text: formattedDate
					});
					currentRecord.setValue({
						fieldId: 'custrecord1204',
						value: parseInt(month)
					});
					currentRecord.setValue({
						fieldId: 'custrecord1205',
						value: parseInt(year)
					});
				}
			}
		}

		if (context.fieldId === 'custrecord761') {
			var customer = currentRecord.getValue({
				fieldId: 'custrecord761'
			});

			if (customer) {
				var lineCount = currentRecord.getLineCount({
					sublistId: 'recmachcustrecord762'
				});

				for (var i = lineCount - 1; i >= 0; i--) {
					currentRecord.removeLine({
						sublistId: 'recmachcustrecord762',
						line: i
					});
				}

				if (context.fieldId !== '' && context.fieldId !== null && context.fieldId !== undefined) {
					try {
						var allExcludeResults = [];
						var start = 0;
						var batchSize = 1000;
						var excludeSearchResults;

						// Get the month and year
						var date = currentRecord.getText({
							fieldId: 'custrecord760'
						});

						var dateParts = date.split('/');

						log.error('Original date', date);
						log.error('Parsed dateParts', dateParts);

						// Support dates like "29-Oct-2025" or "29-October-2025"
						if (!dateParts || dateParts.length !== 3) {
							var dashParts = (date || '').split('-');
							log.error('Dash parts', dashParts);
							if (dashParts.length === 3) {
								var dayPart = dashParts[0].trim();
								var monthPart = dashParts[1].trim().toLowerCase();
								var yearPart = dashParts[2].trim();

								var monthMap = {
									jan: '01', january: '01',
									feb: '02', february: '02',
									mar: '03', march: '03',
									apr: '04', april: '04',
									may: '05',
									jun: '06', june: '06',
									jul: '07', july: '07',
									aug: '08', august: '08',
									sep: '09', sept: '09', september: '09',
									oct: '10', october: '10',
									nov: '11', november: '11',
									dec: '12', december: '12'
								};

								var mapped = monthMap[monthPart] || monthMap[monthPart.substring(0, 3)];
								month = mapped || monthPart;
								month = month.toString().padStart(2, '0');

								day = dayPart.toString().padStart(2, '0');
								year = yearPart;
								log.error('Mapped month', month);
								log.error('Final day, month, year', day + ', ' + month + ', ' + year);
							}
						} else {
							day = dateParts[0].padStart(2, '0');
							month = dateParts[1].padStart(2, '0');
							year = dateParts[2];
						}

						var excludeSearch = search.load({
							id: 'customsearch4398'
						});

						log.error('day, month, year', day + ', ' + month + ', ' + year);

						// Add customer filter
						excludeSearch.filters.push(search.createFilter({
							name: 'custrecord761',
							operator: search.Operator.IS,
							values: customer
						}));
						excludeSearch.filters.push(search.createFilter({
							name: 'custrecord1204',
							operator: search.Operator.IS,
							values: month
						}));
						excludeSearch.filters.push(search.createFilter({
							name: 'custrecord1205',
							operator: search.Operator.IS,
							values: year
						}));

						do {
							excludeSearchResults = excludeSearch.run().getRange({
								start: start,
								end: start + batchSize
							});
							allExcludeResults = allExcludeResults.concat(excludeSearchResults);
							start += batchSize;
						} while (excludeSearchResults.length === batchSize);

						log.debug('Exclude results count', allExcludeResults.length);

						allExcludeResults.forEach(function (res, i) {
							var id = res.id || res.getValue({ name: 'internalid' });
							var cust = res.getValue({ name: 'custrecord761' });
							var monthResult = res.getValue({ name: 'custrecord1204' }) || '';
							var yearResult = res.getValue({ name: 'custrecord1205' }) || '';
							log.debug({
								title: 'Exclude Result ' + (i + 1),
								details: 'id: ' + id + ', customer: ' + cust + ', month: ' + monthResult + ', year: ' + yearResult
							});
						});

						// Check if any results were found
						if (allExcludeResults && allExcludeResults.length > 0) {
							var customerName = currentRecord.getText({
								fieldId: 'custrecord761'
							});

							currentRecord.setValue({
								fieldId: 'custrecord761',
								value: ''
							});

							var monthText = currentRecord.getText({
								fieldId: 'custrecord1204'
							});

							dialog.alert({
								title: 'GPR Forecast Exists',
								message: 'There is already an existing GPR forecast for the customer: ' + customerName + ' in month ' + monthText + ' and year ' + year + '.'
							});

							return;
						}

						// Proceed with the original search if no match was found
						var searchObj = search.load({
							id: 'customsearch4381'
						});

						searchObj.filters.push(search.createFilter({
							name: 'custitem24',
							operator: search.Operator.IS,
							values: customer
						}));

						var allResults = [];
						var start = 0;
						var end = 1000;
						var totalRecordsFetched = 0;

						do {
							var searchResults = searchObj.run().getRange({
								start: start,
								end: end
							});

							allResults = allResults.concat(searchResults);
							totalRecordsFetched += searchResults.length;

							start += batchSize;
							end += batchSize;

						} while (searchResults.length === batchSize);

						var count = 0;
						allResults.forEach(function (result) {
							var itemid = result.getValue({
								name: "itemid"
							});
							var salesdesc = result.getValue({
								name: "salesdescription"
							});
							var currency = result.getText({
								name: "currency",
								join: "pricing"
							});
							var unitprice = result.getValue({
								name: "unitprice",
								join: "pricing"
							});
							var formulanumeric = result.getValue({
								name: "lastpurchaseprice"
							});
							var itemClass = result.getText({
								name: "class"
							});

							currentRecord.selectNewLine({
								sublistId: 'recmachcustrecord762'
							});

							currentRecord.setCurrentSublistText({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord764',
								text: itemid
							});

							currentRecord.setCurrentSublistText({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord765',
								text: salesdesc
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord766',
								value: currency
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord767',
								value: unitprice
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord768',
								value: formulanumeric
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord819',
								value: itemClass
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord763',
								value: customer
							});

							currentRecord.commitLine({
								sublistId: 'recmachcustrecord762'
							});

							log.error({
								title: 'Line ' + (count + 1),
								details: 'Item: ' + itemid + ', Description: ' + salesdesc
							});

							count++;
						});
					} catch (e) {
						log.error('Error occurred in fieldChanged function', e.message);
						throw e;
					}
				}
			}
		}
	}

	return {
		fieldChanged: fieldChanged,
		pageInit: pageInit
	};
});