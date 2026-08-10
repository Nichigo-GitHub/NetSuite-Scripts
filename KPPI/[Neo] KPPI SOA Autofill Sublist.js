/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/record', 'N/currentRecord', 'N/log', 'N/format'],
    function (search, record, currentRecord, log, format) {
        var isPopulatingSublist = false;
        var SUBLIST_ID = 'recmachcustrecord_kppi_soa_details_link';
        var SAVED_SEARCH_ID = 'customsearch1793';
        var customerAddressCache = {};

        function formatSearchDate(value) {
            if (!value) return null;

            try {
                return format.format({
                    value: value,
                    type: format.Type.DATE
                });
            } catch (e) {
                log.error('DATE FORMAT ERROR', e);
                return null;
            }
        }

        function normalizeDateValue(value) {
            if (!value) {
                return null;
            }

            if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
                return value;
            }

            if (typeof value === 'string') {
                try {
                    var parsed = format.parse({
                        value: value,
                        type: format.Type.DATE
                    });

                    if (Object.prototype.toString.call(parsed) === '[object Date]' && !isNaN(parsed.getTime())) {
                        return parsed;
                    }
                } catch (e) {
                    log.debug('DATE PARSE ERROR', e);
                }

                var fallbackDate = new Date(value);
                if (!isNaN(fallbackDate.getTime())) {
                    return fallbackDate;
                }
            }

            return null;
        }

        function getMonthName(value) {
            var dateObj = normalizeDateValue(value);
            if (!dateObj) {
                return '';
            }

            var monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            return monthNames[dateObj.getMonth()];
        }

        function joinAddressParts(parts) {
            return parts.filter(function (part) {
                return part !== null && part !== undefined && part !== '';
            }).join(', ');
        }

        function getCustomerAddress(customerId) {
            if (!customerId) {
                return '';
            }

            if (customerAddressCache[customerId] !== undefined) {
                return customerAddressCache[customerId];
            }

            try {
                var customerRec = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerId,
                    isDynamic: false
                });

                var addressCount = customerRec.getLineCount({
                    sublistId: 'addressbook'
                }) || 0;

                var targetLine = -1;
                var i;

                for (i = 0; i < addressCount; i++) {
                    var isDefaultBilling = customerRec.getSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'defaultbilling',
                        line: i
                    });

                    if (isDefaultBilling) {
                        targetLine = i;
                        break;
                    }
                }

                if (targetLine === -1) {
                    for (i = 0; i < addressCount; i++) {
                        var isDefaultShipping = customerRec.getSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'defaultshipping',
                            line: i
                        });

                        if (isDefaultShipping) {
                            targetLine = i;
                            break;
                        }
                    }
                }

                if (targetLine === -1 && addressCount > 0) {
                    targetLine = 0;
                }

                if (targetLine === -1) {
                    customerAddressCache[customerId] = '';
                    return '';
                }

                var addressSubrecord = customerRec.getSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress',
                    line: targetLine
                });

                var addr1 = addressSubrecord.getValue({
                    fieldId: 'addr1'
                }) || '';

                var city = addressSubrecord.getValue({
                    fieldId: 'city'
                }) || '';

                var dropdownState = addressSubrecord.getValue({
                    fieldId: 'dropdownstate'
                }) || '';

                var finalAddress = joinAddressParts([addr1, city, dropdownState]);
                customerAddressCache[customerId] = finalAddress;

                return finalAddress;

            } catch (e) {
                log.debug('CUSTOMER ADDRESS LOAD ERROR', e);
                customerAddressCache[customerId] = '';
                return '';
            }
        }

        function getCustomerEntityId(customerId, fallbackText) {
            if (!customerId) {
                return '';
            }

            try {
                var lookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customerId,
                    columns: ['entityid']
                });

                return lookup.entityid || fallbackText || '';
            } catch (e) {
                log.debug('CUSTOMER LOOKUP ERROR', e);
                return fallbackText || '';
            }
        }

        function updateAddressAndName(rec) {
            var customerId = rec.getValue({
                fieldId: 'custrecord_kppi_soa_customer'
            });
            var customerText = rec.getText({
                fieldId: 'custrecord_kppi_soa_customer'
            });
            var dateTo = rec.getValue({
                fieldId: 'custrecord_kppi_soa_date_to'
            });

            rec.setValue({
                fieldId: 'custrecord_kppi_soa_address',
                value: customerId ? (getCustomerAddress(customerId) || '') : '',
                ignoreFieldChange: true
            });

            if (!customerId || !dateTo) {
                rec.setValue({
                    fieldId: 'name',
                    value: '',
                    ignoreFieldChange: true
                });
                return;
            }

            var monthName = getMonthName(dateTo);
            if (!monthName) {
                rec.setValue({
                    fieldId: 'name',
                    value: '',
                    ignoreFieldChange: true
                });
                return;
            }

            var reportname = getCustomerEntityId(customerId, customerText);

            rec.setValue({
                fieldId: 'name',
                value: reportname ? reportname + ' - SOA for ' + monthName : '',
                ignoreFieldChange: true
            });
        }

        function cleanBaseFilters(filters) {
            return (filters || []).filter(function (f) {
                if (!f) return false;

                if (f.name === 'mainname') return false;
                if (f.name === 'trandate') return false;
                if (f.name === 'currency') return false;
                if (f.name === 'entityid' && f.join === 'customermain') return false;

                return true;
            });
        }

        function toNumber(value) {
            var n = parseFloat(value);
            return isNaN(n) ? 0 : n;
        }

        function clearSublistLines(rec, sublistId) {
            var lineCount = rec.getLineCount({
                sublistId: sublistId
            }) || 0;

            try {
                rec.cancelLine({
                    sublistId: sublistId
                });
            } catch (e) { }

            for (var i = lineCount - 1; i >= 0; i--) {
                rec.removeLine({
                    sublistId: sublistId,
                    line: i,
                    ignoreRecalc: true
                });
            }
        }

        function getPagedResults(searchObj) {
            var results = [];
            var pagedData = searchObj.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({
                    index: pageRange.index
                });

                page.data.forEach(function (result) {
                    results.push(result);
                });
            });

            return results;
        }

        function fieldChanged(context) {
            if (isPopulatingSublist)
                return;

            var rec = context.currentRecord;
            var fieldId = context.fieldId;
            var sublistId = SUBLIST_ID;

            if (fieldId === 'custrecord_kppi_soa_customer' ||
                fieldId === 'custrecord_kppi_soa_date_to')
                updateAddressAndName(rec);

            if (fieldId !== 'custrecord_kppi_soa_customer' &&
                fieldId !== 'custrecord_kppi_soa_currency' &&
                fieldId !== 'custrecord_kppi_soa_date_from' &&
                fieldId !== 'custrecord_kppi_soa_date_to')
                return;

            var customerId = rec.getValue({
                fieldId: 'custrecord_kppi_soa_customer'
            });
            var currencyId = rec.getValue({
                fieldId: 'custrecord_kppi_soa_currency'
            });
            log.debug('currencyId', currencyId);
            var dateFrom = rec.getValue({
                fieldId: 'custrecord_kppi_soa_date_from'
            });
            var dateTo = rec.getValue({
                fieldId: 'custrecord_kppi_soa_date_to'
            });

            if (!customerId || !currencyId || !dateFrom || !dateTo) {
                try {
                    clearSublistLines(rec, sublistId);
                } catch (clearErr) {
                    log.error('CLEAR INCOMPLETE FILTER LINES ERROR', clearErr);
                }

                return;
            }

            try {
                isPopulatingSublist = true;

                var mySavedSearch = search.load({
                    id: SAVED_SEARCH_ID
                });

                var baseFilters = cleanBaseFilters(mySavedSearch.filters);
                var filters = [];

                filters.push(search.createFilter({
                    name: 'mainname',
                    operator: search.Operator.ANYOF,
                    values: [customerId]
                }));

                filters.push(search.createFilter({
                    name: 'currency',
                    operator: search.Operator.ANYOF,
                    values: Array.isArray(currencyId) ? currencyId : [currencyId]
                }));

                var formattedDateFrom = formatSearchDate(dateFrom);
                var formattedDateTo = formatSearchDate(dateTo);

                if (formattedDateFrom) {
                    filters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.ONORAFTER,
                        values: formattedDateFrom
                    }));
                }

                if (formattedDateTo) {
                    filters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.ONORBEFORE,
                        values: formattedDateTo
                    }));
                }

                mySavedSearch.filters = baseFilters.concat(filters);

                log.debug('Search', mySavedSearch);

                var searchResults = getPagedResults(mySavedSearch);
                var columns = mySavedSearch.columns;

                if (rec.getLineCount({ sublistId: sublistId }) < 0) {
                    log.error('SUBLIST UNAVAILABLE', {
                        sublistId: sublistId,
                        message: 'Sublist is not editable/available in this context.'
                    });
                    return;
                }

                clearSublistLines(rec, sublistId);

                log.debug('SEARCH RESULTS COUNT', searchResults.length);
                log.debug('SEARCH RESULTS', searchResults.map(function (result) {
                    return columns.reduce(function (acc, col) {
                        var colName = col.name || col.join || 'unknown';
                        acc[colName] = result.getValue(col);
                        return acc;
                    }, {});
                }));

                searchResults.forEach(function (result, index) {
                    try {
                        var customerLineValue = result.getValue(columns[0]);
                        var tranDateText = result.getText(columns[1]) || result.getValue(columns[1]) || '';
                        var invoiceNo = result.getValue(columns[2]) || '';
                        var drNo = result.getValue(columns[3]) || '';
                        var currencyLineValue = result.getValue(columns[9]);
                        var currencyLineText = result.getText(columns[9]) || '';
                        var originalAmount = toNumber(result.getValue(columns[17]));
                        var phpAmount = toNumber(result.getValue(columns[7]));
                        var forexRate = toNumber(result.getValue(columns[10]));
                        var usdAmount = toNumber(result.getValue(columns[8]));
                        var dueDateText = result.getText(columns[12]) || result.getValue(columns[12]) || '';
                        var remarks = result.getValue(columns[5]) || result.getText(columns[5]) || '';

                        log.debug('columns[0]', columns[0]);
                        log.debug('columns[1]', columns[1]);
                        log.debug('columns[2]', columns[2]);
                        log.debug('columns[3]', columns[3]);
                        log.debug('columns[4]', columns[4]);
                        log.debug('columns[5]', columns[5]);
                        log.debug('columns[6]', columns[6]);
                        log.debug('columns[7]', columns[7]);
                        log.debug('columns[8]', columns[8]);
                        log.debug('columns[9]', columns[9]);
                        log.debug('columns[10]', columns[10]);

                        if (!remarks.toString().includes('internal')) {
                            rec.selectNewLine({
                                sublistId: sublistId
                            });

                            if (customerLineValue) {
                                rec.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_customer',
                                    value: customerLineValue,
                                    ignoreFieldChange: true
                                });
                            }

                            if (tranDateText) {
                                rec.setCurrentSublistText({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_date',
                                    text: tranDateText,
                                    ignoreFieldChange: true
                                });
                            }

                            if (invoiceNo !== '') {
                                rec.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_invoice',
                                    value: invoiceNo.toString(),
                                    ignoreFieldChange: true
                                });
                            }

                            if (drNo !== '') {
                                rec.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_dr',
                                    value: drNo.toString(),
                                    ignoreFieldChange: true
                                });
                            }

                            if (currencyLineText) {
                                rec.setCurrentSublistText({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_currency',
                                    text: currencyLineText,
                                    ignoreFieldChange: true
                                });
                            } else if (currencyLineValue) {
                                rec.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_currency',
                                    value: currencyLineValue,
                                    ignoreFieldChange: true
                                });
                            }

                            rec.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_kppi_soa_details_orig_amount',
                                value: originalAmount,
                                ignoreFieldChange: true
                            });

                            rec.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_kppi_soa_details_php_amount',
                                value: phpAmount,
                                ignoreFieldChange: true
                            });

                            rec.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_kppi_soa_details_forex',
                                value: forexRate,
                                ignoreFieldChange: true
                            });

                            rec.setCurrentSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_kppi_soa_details_usd_amount',
                                value: usdAmount,
                                ignoreFieldChange: true
                            });

                            if (dueDateText) {
                                rec.setCurrentSublistText({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_due_date',
                                    text: dueDateText,
                                    ignoreFieldChange: true
                                });
                            }

                            /* if (remarks !== '') {
                                rec.setCurrentSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custrecord_kppi_soa_details_remarks',
                                    value: remarks.toString(),
                                    ignoreFieldChange: true
                                });
                            } */

                            rec.commitLine({
                                sublistId: sublistId,
                                ignoreRecalc: true
                            });
                        }
                    } catch (lineErr) {
                        log.error('LINE ERROR ' + index, lineErr);
                    }
                });

            } catch (e) {
                log.error('MAIN ERROR', e);
            } finally {
                isPopulatingSublist = false;
            }
        }

        function pageInit(context) {
            var rec = context.currentRecord;

            if (context.mode === 'edit') {
                rec.setValue({                    
                    fieldId: 'custrecord_kppi_soa_revised',
                    value: true
                });

                rec.getField({
                    fieldId: 'custrecord_kppi_soa_revised'
                }).isDisabled = true;
            }
        }

        function openKppiSoa() {
            var rec = currentRecord.get();
            var recId = rec.id;

            var url = '/app/site/hosting/scriptlet.nl?script=customscript_kppi_soa_printout&deploy=customdeploy_kppi_soa_printout'
                + '&recId=' + recId;

            window.open(url, '_blank');
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            openKppiSoa: openKppiSoa
        };
    });