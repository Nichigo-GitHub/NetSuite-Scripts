/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/format', 'N/record', 'N/log'],
function(search, format, record, log) {

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

    function toDdMmYyyy(value) {
        var dateObj = normalizeDateValue(value);
        if (!dateObj) {
            return '';
        }

        var day = ('0' + dateObj.getDate()).slice(-2);
        var month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        var year = dateObj.getFullYear();

        return day + '/' + month + '/' + year;
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
        return parts.filter(function(part) {
            return part !== null && part !== undefined && part !== '';
        }).join(', ');
    }

    function getCustomerAddress(customerId) {
        if (!customerId) {
            return '';
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

            return joinAddressParts([addr1, city, dropdownState]);

        } catch (e) {
            log.debug('CUSTOMER ADDRESS LOAD ERROR', e);
            return '';
        }
    }

    function beforeLoad(context) {
        var form = context.form;

        form.clientScriptModulePath = 'SuiteScripts/[Neo] KPPI SOA Autofill Sublist.js';

        if (context.type === context.UserEventType.CREATE) {
            return;
        }

        if (context.type !== context.UserEventType.EDIT &&
            context.type !== context.UserEventType.VIEW) {
            return;
        }

        form.addButton({
            id: 'custpage_kppiSoa_btn',
            label: '🖨️ Print KPPI SOA',
            functionName: 'openKppiSoa'
        });
    }

    function beforeSubmit(context) {
    var rec = context.newRecord;

    var customerId = rec.getValue({
        fieldId: 'custrecord_kppi_soa_customer'
    });
    var dateTo = rec.getValue({
        fieldId: 'custrecord_kppi_soa_date_to'
    });

    var normalizedDate = normalizeDateValue(dateTo);

    log.debug({
        title: 'NORMALIZED DATE',
        details: {
            rawDateTo: dateTo,
            ddmmyyyy: toDdMmYyyy(dateTo)
        }
    });

    if (customerId) {
        var address = getCustomerAddress(customerId);

        rec.setValue({
            fieldId: 'custrecord_kppi_soa_address',
            value: address || ''
        });
    } else {
        rec.setValue({
            fieldId: 'custrecord_kppi_soa_address',
            value: ''
        });
    }

    if (!normalizedDate) {
        rec.setValue({
            fieldId: 'name',
            value: ''
        });
        return;
    }

    var reportname = customerId ? '' : 'Sales Ledger';

    if (customerId) {
        try {
            var lookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['entityid']
            });

            reportname = lookup.entityid || '';
        } catch (e) {
            log.debug('Customer Lookup Error', e);
        }

        if (!reportname) {
            rec.setValue({
                fieldId: 'name',
                value: ''
            });
            return;
        }
    }

    var monthName = getMonthName(normalizedDate);
    var nameValue = reportname + ' - SOA for ' + monthName;

    rec.setValue({
        fieldId: 'name',
        value: nameValue
    });
}

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});