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
					var searchObj = '';
					var threeMonths = currentRecord.getValue({ fieldId: 'custrecord1261' });
					var sixMonths = currentRecord.getValue({ fieldId: 'custrecord1262' });
					var twelveMonths = currentRecord.getValue({ fieldId: 'custrecord1263' });

					if (threeMonths) {
						searchObj = search.load({
							id: 'customsearch5337'
						});
					} else if (sixMonths) {
						searchObj = search.load({
							id: 'customsearch5336'
						});
					} else if (twelveMonths) {
						searchObj = search.load({
							id: 'customsearch5339'
						});
					} else {
						searchObj = search.load({
							id: 'customsearch4381'
						});
					}

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

					log.debug('Autofill search setup', {
						customer: customer,
						threeMonths: threeMonths,
						sixMonths: sixMonths,
						twelveMonths: twelveMonths,
						batchSize: batchSize
					});

					do {
						log.debug('Fetching search batch', {
							start: start,
							end: end,
							totalRecordsFetched: totalRecordsFetched
						});

						var searchResults = searchObj.run().getRange({
							start: start,
							end: end
						});

						allResults = allResults.concat(searchResults);
						totalRecordsFetched += searchResults.length;

						log.debug('Fetched search batch', {
							batchCount: searchResults.length,
							totalRecordsFetched: totalRecordsFetched
						});

						start += batchSize;
						end += batchSize;

					} while (searchResults.length === batchSize);

					log.audit('Autofill search complete', {
						totalRecordsFetched: totalRecordsFetched
					});

					var resultMap = {};

					allResults.forEach(function (result) {
						/* for (var r = 0; r < allResults.length; r++) { */
						var itemid = result.getValue({
							name: "itemid",
							summary: search.Summary.GROUP
						});

						resultMap[itemid] = {
							internalid: result.getValue({ name: "internalid", summary: search.Summary.GROUP }),
							salesdesc: result.getValue({ name: "salesdescription", summary: search.Summary.GROUP }),
							currency: result.getText({ name: "currency", join: "pricing", summary: search.Summary.GROUP }),
							unitprice: result.getValue({ name: "unitprice", join: "pricing", summary: search.Summary.GROUP }),
							lastpurchaseprice: result.getValue({ name: "lastpurchaseprice", summary: search.Summary.MAX }),
							class: result.getText({ name: "class", summary: search.Summary.GROUP })
						};

						log.debug('Processed result for item', {
							itemid: itemid,
							data: resultMap[itemid]
						});
					});

					var lineCount = currentRecord.getLineCount({
						sublistId: 'recmachcustrecord762'
					});

					log.debug('Prepared result map', {
						resultCount: Object.keys(resultMap).length,
						lineCount: lineCount
					});

					for (var i = 0; i < lineCount; i++) {
						var item = currentRecord.getSublistText({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord764',
							line: i
						});

						item = item ? item.trim() : item;

						var data = resultMap[item];

						log.debug('Processing sublist line', {
							line: i,
							item: item,
							matchFound: !!data
						});

						if (data) {
							log.debug('Updating existing sublist line', {
								line: i + 1,
								item: item,
								data: data
							});

							/* currentRecord.selectLine({
								sublistId: 'recmachcustrecord762',
								line: i
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord1182',
								value: data.internalid
							});

							currentRecord.setCurrentSublistText({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord764',
								text: item
							});

							currentRecord.setCurrentSublistText({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord765',
								text: data.salesdesc
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord767',
								value: data.unitprice
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord768',
								value: data.lastpurchaseprice
							});

							currentRecord.setCurrentSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord763',
								value: customer
							});

							currentRecord.commitLine({
								sublistId: 'recmachcustrecord762'
							}); */

							log.debug('Committed updated sublist line', {
								line: i + 1,
								item: item,
								internalid: data.internalid
							});

							delete resultMap[item];
						} else {
							var forDelete = true;
							
							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord769',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord770',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord771',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord772',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord997',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord998',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord999',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord1000',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord1001',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord1002',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord1003',
								line: i
							})) {
								forDelete = false;
							}

							if (currentRecord.getSublistValue({
								sublistId: 'recmachcustrecord762',
								fieldId: 'custrecord1004',
								line: i
							})) {
								forDelete = false;
							}

							log.debug('Line has no matching search data', {
								line: i + 1,
								item: item,
								forDelete: forDelete
							});

							if (forDelete) {
								currentRecord.removeLine({
									sublistId: 'recmachcustrecord762',
									line: i
								});
								log.debug('Removed line with no future forecast', {
									line: i + 1,
									item: item
								});
								i--; // Adjust index after removal
								lineCount--; // Adjust total line count after removal
							}
						}
					}

					log.audit('Finished processing existing lines', {
						remainingItemsToAdd: Object.keys(resultMap).length
					});

					Object.keys(resultMap).forEach(function (itemid) {
						var data = resultMap[itemid];
						
						currentRecord.selectNewLine({
							sublistId: 'recmachcustrecord762'
						});
						
						currentRecord.setCurrentSublistValue({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord1182',
							value: data.internalid
						});
						
						currentRecord.setCurrentSublistText({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord764',
							text: itemid
						});
						
						currentRecord.setCurrentSublistText({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord765',
							text: data.salesdesc
						});
						
						currentRecord.setCurrentSublistValue({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord767',
							value: data.unitprice
						});
						
						currentRecord.setCurrentSublistValue({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord768',
							value: data.lastpurchaseprice
						});

						currentRecord.setCurrentSublistValue({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord819',
							value: data.class
						});

						currentRecord.setCurrentSublistValue({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord766',
							value: data.currency
						});
						
						currentRecord.setCurrentSublistValue({
							sublistId: 'recmachcustrecord762',
							fieldId: 'custrecord763',
							value: customer
						});
						
						currentRecord.commitLine({
							sublistId: 'recmachcustrecord762'
						});
						
						log.debug('Added remaining item to sublist', {
							itemid: itemid,
							internalid: data.internalid
						});
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

		if (context.fieldId === 'custrecord1261') {
			var threeMonths = context.currentRecord.getValue({ fieldId: 'custrecord1261' });

			log.error('threeMonths value', threeMonths);

			if (threeMonths === true) {
				currentRecord.setValue({
					fieldId: 'custrecord1262',
					value: false
				});

				currentRecord.setValue({
					fieldId: 'custrecord1263',
					value: false
				});
			}
		}

		if (context.fieldId === 'custrecord1262') {
			var sixMonths = context.currentRecord.getValue({ fieldId: 'custrecord1262' });

			log.error('sixMonths value', sixMonths);

			if (sixMonths === true) {
				currentRecord.setValue({
					fieldId: 'custrecord1261',
					value: false
				});

				currentRecord.setValue({
					fieldId: 'custrecord1263',
					value: false
				});
			}
		}

		if (context.fieldId === 'custrecord1263') {
			var twelveMonths = context.currentRecord.getValue({ fieldId: 'custrecord1263' });

			log.error('twelveMonths value', twelveMonths);

			if (twelveMonths === true) {
				currentRecord.setValue({
					fieldId: 'custrecord1261',
					value: false
				});

				currentRecord.setValue({
					fieldId: 'custrecord1262',
					value: false
				});
			}
		}
	}

	function onClickLoadGPR() {
		var currentRecord = require('N/currentRecord').get();

		var customer = currentRecord.getValue({
			fieldId: 'custrecord761'
		});

		log.error('onClickLoadGPR - customer', customer);

		if (customer) {
			var lineCount = currentRecord.getLineCount({
				sublistId: 'recmachcustrecord762'
			});

			log.error('onClickLoadGPR - lineCount before removal', lineCount);

			for (var i = lineCount - 1; i >= 0; i--) {
				currentRecord.removeLine({
					sublistId: 'recmachcustrecord762',
					line: i
				});
				log.error('onClickLoadGPR - removed line', i);
			}

			try {
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

				var excludeSearchResults = excludeSearch.run().getRange({
					start: 0,
					end: 1
				});

				log.error('excludeSearchResults length', excludeSearchResults.length);

				// Check if any results were found
				if (excludeSearchResults.length > 0) {
					var customerName = currentRecord.getText({
						fieldId: 'custrecord761'
					});

					log.error('Existing GPR found for customer', customerName);

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

				var GPRsearch = '';
				var threeMonths = currentRecord.getValue({ fieldId: 'custrecord1261' });
				var sixMonths = currentRecord.getValue({ fieldId: 'custrecord1262' });
				var twelveMonths = currentRecord.getValue({ fieldId: 'custrecord1263' });

				log.error('threeMonths', threeMonths);
				log.error('sixMonths', sixMonths);
				log.error('twelveMonths', twelveMonths);

				if (threeMonths) {
					GPRsearch = 'customsearch5337';
				} else if (sixMonths) {
					GPRsearch = 'customsearch5336';
				} else if (twelveMonths) {
					GPRsearch = 'customsearch5339';
				} else {
					GPRsearch = 'customsearch4381';
				}

				log.error('Selected GPRsearch', GPRsearch);

				// Proceed with the original search if no match was found
				var searchObj = search.load({
					id: GPRsearch
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

					log.error('searchResults batch length', searchResults.length);

					allResults = allResults.concat(searchResults);
					totalRecordsFetched += searchResults.length;

					start += batchSize;
					end += batchSize;

				} while (searchResults.length === batchSize);

				log.error('Total allResults fetched', totalRecordsFetched);
				log.error('allResults', allResults);

				var count = 0;
				allResults.forEach(function (result) {
					var internalID = result.getValue({
						name: "internalid",
						summary: search.Summary.GROUP
					});
					var itemid = result.getValue({
						name: "itemid",
						summary: search.Summary.GROUP
					});
					var salesdesc = result.getValue({
						name: "salesdescription",
						summary: search.Summary.GROUP
					});
					var currency = result.getText({
						name: "currency",
						join: "pricing",
						summary: search.Summary.GROUP
					});
					var unitprice = result.getValue({
						name: "unitprice",
						join: "pricing",
						summary: search.Summary.GROUP
					});
					var formulanumeric = result.getValue({
						name: "lastpurchaseprice",
						summary: search.Summary.MAX
					});
					var itemClass = result.getText({
						name: "class",
						summary: search.Summary.GROUP
					});

					log.error('Processing item', itemid + ' - ' + salesdesc);

					currentRecord.selectNewLine({
						sublistId: 'recmachcustrecord762'
					});

					currentRecord.setCurrentSublistValue({
						sublistId: 'recmachcustrecord762',
						fieldId: 'custrecord1182',
						value: internalID
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

					log.error('Line committed', count + 1);

					count++;
				});

				log.error('Total lines added', count);
			} catch (e) {
				log.error('Error occurred in onClickLoadGPR function', e.message);
				throw e;
			}
		}
	}

	return {
		fieldChanged: fieldChanged,
		pageInit: pageInit,
		onClickLoadGPR: onClickLoadGPR
	};
});
