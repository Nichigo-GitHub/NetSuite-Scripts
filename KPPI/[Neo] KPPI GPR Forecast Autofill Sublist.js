/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/log', 'N/ui/dialog'], function (search, currentRecord, log, dialog) {
	const sublistId = 'recmachcustrecord824';

	function pageInit(context) {
		var currentRecord = context.currentRecord;

		// If mode is 'create', set the 'custrecord773' field based on 'custrecord820'
		if (context.mode === 'create') {
			var date = currentRecord.getText({
				fieldId: 'custrecord820'
			});

			if (date) {
				var dateParts = date.split('/');
				if (dateParts.length === 3) {
					var day = dateParts[1].padStart(2, '0');
					var month = dateParts[0].padStart(2, '0');
					var year = dateParts[2];

					var formattedDate = day + '/' + month + '/' + year;
					currentRecord.setText({
						fieldId: 'custrecord822',
						text: formattedDate
					});
				}
			}
		}

		// Check if the mode is 'edit'
		if (context.mode === 'edit') {
			var customer = currentRecord.getValue({
				fieldId: 'custrecord821'
			});

			if (customer) {
				try {
					// Load saved search 'customsearch4877' for checking the customer
					var searchObj = search.load({
						id: 'customsearch4877'
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
						sublistId: sublistId
					});

					allResults.forEach(function (result) {
						var itemid = result.getValue({
							name: "itemid",
							summary: "GROUP"
						});
						var salesdesc = result.getValue({
							name: "salesdescription",
							summary: "GROUP"
						});
						var unitprice = result.getValue({
							name: "unitprice",
							join: "pricing",
							summary: "GROUP"
						});
						var formulanumeric = result.getValue({
							name: "formulanumeric",
							summary: "SUM"
						});

						// Loop through all lines in the sublist
						for (var i = 0; i < lineCount; i++) {
							// Get the item and description values in the current sublist line
							var item = currentRecord.getSublistText({
								sublistId: sublistId,
								fieldId: 'custrecord825',
								line: i
							});

							// Check if the itemid and salesdesc match the sublist values
							if (itemid == item) {
								// If match found, update the unitprice and formulanumeric fields
								currentRecord.selectLine({
									sublistId: sublistId,
									line: i
								});

								currentRecord.setCurrentSublistValue({
									sublistId: sublistId,
									fieldId: 'custrecord828',
									value: unitprice
								});

								currentRecord.setCurrentSublistValue({
									sublistId: sublistId,
									fieldId: 'custrecord829',
									value: formulanumeric
								});

								currentRecord.commitLine({
									sublistId: sublistId
								});

								log.debug({
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

		if (context.fieldId === 'custrecord821') {
			var customer = currentRecord.getValue({
				fieldId: 'custrecord821'
			});

			if (customer) {
				var lineCount = currentRecord.getLineCount({
					sublistId: sublistId
				});

				for (var i = lineCount - 1; i >= 0; i--) {
					currentRecord.removeLine({
						sublistId: sublistId,
						line: i
					});
				}

				if (context.fieldId !== '' && context.fieldId !== null && context.fieldId !== undefined) {
					try {
						var allResults = [];
						var allExcludeResults = [];
						var start = 0;
						var end = 1000;
						var batchSize = 1000;
						var totalRecordsFetched;
						var excludeSearchResults;

						var excludeSearch = search.load({
							id: 'customsearch4897'
						});

						// Add customer filter
						excludeSearch.filters.push(search.createFilter({
							name: 'custrecord821',
							operator: search.Operator.IS,
							values: customer
						}));

						do {
							excludeSearchResults = excludeSearch.run().getRange({
								start: start,
								end: start + batchSize
							});
							allExcludeResults = allExcludeResults.concat(excludeSearchResults);
							start += batchSize;
						} while (excludeSearchResults.length === batchSize);

						// Get the current month (1-based, i.e., January is 1)
						var currentDate = new Date();
						var currentMonth = currentDate.getMonth() + 1;

						// Loop through each excludeSearch result and check the month of custrecord820
						for (var i = 0; i < allExcludeResults.length; i++) {
							var result = allExcludeResults[i];

							// Get the value of custrecord820 (assumed to be a date field)
							var custrecord820Date = result.getValue({
								name: 'custrecord820'
							});

							// Convert custrecord820 to a JavaScript Date object
							if (custrecord820Date) {
								var dateValue = new Date(custrecord820Date);
								var custrecord820Month = dateValue.getMonth() + 1; // getMonth() is 0-indexed, so add 1 to match 1-based month

								// Compare the month of custrecord820 with the current month
								if (custrecord820Month === currentMonth) {
									// If there's a match, clear the customer field and show the alert
									var customerName = currentRecord.getText({
										fieldId: 'custrecord821'
									});

									currentRecord.setValue({
										fieldId: 'custrecord821',
										value: ''
									});

									dialog.alert({
										title: 'GPR Forecast Exists',
										message: 'There is already an existing GPR forecast for the customer: ' + customerName + ' in this month.'
									});

									return; // Exit the loop and function early since we found a match
								}
							}
						}

						var searchObj = search.load({
							id: 'customsearch4877'
						});

						searchObj.filters.push(search.createFilter({
							name: 'custitem24',
							operator: search.Operator.IS,
							values: customer
						}));

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

						var count = 0;
						allResults.forEach(function (result) {
							var itemid = result.getValue({
								name: "itemid"/* ,
								summary: "GROUP"*/
							});
							var salesdesc = result.getValue({
								name: "salesdescription"/* ,
								summary: "GROUP"*/
							});
							var currency = result.getText({
								name: "currency",
								join: "pricing"/* ,
								summary: "GROUP"*/
							});
							var unitprice = result.getValue({
								name: "unitprice",
								join: "pricing"/* ,
								summary: "GROUP"*/
							});
							var formulanumeric = result.getValue({
								name: "lastpurchaseprice"/* ,
								summary: "MAXIMUM" */
							});
							
							var itemClass = result.getText({
								name: "class"/* ,
								summary: "GROUP"*/
							});

							currentRecord.selectNewLine({
								sublistId: sublistId
							});

							currentRecord.setCurrentSublistText({
								sublistId: sublistId,
								fieldId: 'custrecord825',
								text: itemid
							});

							currentRecord.setCurrentSublistText({
								sublistId: sublistId,
								fieldId: 'custrecord826',
								text: salesdesc
							});

							currentRecord.setCurrentSublistValue({
								sublistId: sublistId,
								fieldId: 'custrecord827',
								value: currency
							});

							currentRecord.setCurrentSublistValue({
								sublistId: sublistId,
								fieldId: 'custrecord828',
								value: unitprice
							});

							currentRecord.setCurrentSublistValue({
								sublistId: sublistId,
								fieldId: 'custrecord829',
								value: formulanumeric
							});

							currentRecord.setCurrentSublistValue({
								sublistId: sublistId,
								fieldId: 'custrecord834',
								value: itemClass
							});

							currentRecord.commitLine({
								sublistId: sublistId
							});

							log.debug({
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