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
				if (dateParts.length === 3) {
					var day = dateParts[1].padStart(2, '0');
					var month = dateParts[0].padStart(2, '0');
					var year = dateParts[2];

					var formattedDate = month + '/' + day + '/' + year;
					currentRecord.setText({
						fieldId: 'custrecord773',
						text: formattedDate
					});
				}
			}
		}

		// Check if the mode is 'edit'
		if (context.mode === 'edit') {
			var customer = currentRecord.getValue({
				fieldId: 'custrecord761'
			});

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
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord764',
								line: i
							});

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

								currentRecord.commitLine({
									sublistId: 'recmachcustrecord762'
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

						var excludeSearch = search.load({
							id: 'customsearch4398'
						});

						// Add customer filter
						excludeSearch.filters.push(search.createFilter({
							name: 'custrecord761',
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

						// Get the current month and year
						var currentDate = new Date();
						var currentMonth = currentDate.getMonth() + 1;
						var currentYear = currentDate.getFullYear();

						// Loop through each excludeSearch result and check month & year of custrecord760
						for (var i = 0; i < allExcludeResults.length; i++) {
							var result = allExcludeResults[i];

							// Get the value of custrecord760 (assumed to be a date field)
							var custrecord760Date = result.getValue({
								name: 'custrecord760'
							});

							// Convert custrecord760 to a JavaScript Date object
							if (custrecord760Date) {
								var dateValue = new Date(custrecord760Date);
								var custrecord760Month = dateValue.getMonth() + 1; // JavaScript months are 0-indexed
								var custrecord760Year = dateValue.getFullYear();

								// Compare both month & year
								if (custrecord760Month === currentMonth && custrecord760Year === currentYear) {
									// If there's a match, clear the customer field and show the alert
									var customerName = currentRecord.getText({
										fieldId: 'custrecord761'
									});

									currentRecord.setValue({
										fieldId: 'custrecord761',
										value: ''
									});

									dialog.alert({
										title: 'GPR Forecast Exists',
										message: 'There is already an existing GPR forecast for the customer: ' + customerName + ' in this month and year.'
									});

									return; // Exit the function early since we found a match
								}
							}
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

							currentRecord.commitLine({
								sublistId: 'recmachcustrecord762'
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