/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/format', 'N/log'], function (record, runtime, format, log) {
    var SOA_RECORD_TYPE = 'customrecord_kppi_soa';
    var SOA_SUBLIST_ID = 'recmachcustrecord_kppi_soa_details_link';
    var ROWS_PER_PAGE = 27;

    var MONTH_NAMES = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    var SHORT_MONTH_NAMES = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

    function onRequest(context) {
        var request = context.request;
        var response = context.response;
        var recId = request.parameters.recId || request.parameters.internalId || request.parameters.id;

        if (!recId) {
            response.write('Missing recId/internalId/id parameter.');
            return;
        }

        var soaRecord;

        try {
            soaRecord = record.load({
                type: SOA_RECORD_TYPE,
                id: recId,
                isDynamic: false
            });
        } catch (e) {
            log.error({
                title: 'SOA record load failed',
                details: {
                    recordType: SOA_RECORD_TYPE,
                    recId: recId,
                    error: e
                }
            });

            response.write('Unable to load SOA record. Please check that the Suitelet URL is passing the SOA internal id as recId, internalId, or id. Record type: ' +
                escapeHtml(SOA_RECORD_TYPE) + ', id: ' + escapeHtml(recId));
            return;
        }

        var customer = soaRecord.getText({ fieldId: 'custrecord_kppi_soa_customer' }) || '';
        var customerAddress = soaRecord.getValue({ fieldId: 'custrecord_kppi_soa_address' }) || '';
        var branch = soaRecord.getText({ fieldId: 'custrecord_kppi_soa_branch' }) || '';
        var currency = soaRecord.getText({ fieldId: 'custrecord_kppi_soa_currency' }) || '';
        var terms = soaRecord.getText({ fieldId: 'custrecord_kppi_soa_terms' }) || '';
        var dateTo = soaRecord.getValue({ fieldId: 'custrecord_kppi_soa_date_to' });
        var sublistLength = soaRecord.getLineCount({ sublistId: SOA_SUBLIST_ID }) || 0;
        var controlNum = soaRecord.getValue({ fieldId: 'custrecord_kppi_soa_code' }) || recId;
        var preparedBy = (soaRecord.getText({ fieldId: 'custrecord_kppi_soa_prepared_by' }) || '').toUpperCase();
        var createdDate = getCreatedDatePhilippine(soaRecord) || getPhilippineDateText(new Date());
        var rowsPerPage = ROWS_PER_PAGE;
        var html = runtime.getCurrentScript().getParameter({
            name: 'custscript_kppi_soa_html'
        }) || runtime.getCurrentScript().getParameter({
            name: 'custscript_kppi_soa_printout'
        });

        if (!html) {
            response.write('Missing HTML template parameter. Use custscript_kppi_soa_html or custscript_kppi_soa_printout.');
            return;
        }

        var detailRows = [];
        var summaryMap = {};
        var totalAmount = 0;
        var currentTransactionAmount = 0;
        var currencyForAmount = currency;
        var previousBalanceAmount = 0;
        var previousBalanceDateMap = {};
        var farthestDueDate = null;

        for (var line = 0; line < sublistLength; line++) {
            var tranDate = soaRecord.getSublistValue({
                sublistId: SOA_SUBLIST_ID,
                fieldId: 'custrecord_kppi_soa_details_date',
                line: line
            }),
                invoiceNo = soaRecord.getSublistValue({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_invoice',
                    line: line
                }) || '',
                drNo = soaRecord.getSublistValue({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_dr',
                    line: line
                }) || '',
                lineCurrency = soaRecord.getSublistText({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_currency',
                    line: line
                }) || soaRecord.getSublistValue({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_currency',
                    line: line
                }) || currencyForAmount,
                amount = soaRecord.getSublistValue({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_orig_amount',
                    line: line
                }),
                dueDate = soaRecord.getSublistValue({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_due_date',
                    line: line
                }),
                remarks = soaRecord.getSublistValue({
                    sublistId: SOA_SUBLIST_ID,
                    fieldId: 'custrecord_kppi_soa_details_remarks',
                    line: line
                }) || '';

            currencyForAmount = lineCurrency || currencyForAmount;
            amount = toNumber(amount).toFixed(2);
            totalAmount += toNumber(amount);

            if (isSameMonthYear(tranDate, dateTo)) {
                currentTransactionAmount += toNumber(amount);
            }

            var dueDateObj = normalizeDateValue(dueDate);

            if (dueDateObj && (!farthestDueDate || dueDateObj.getTime() > farthestDueDate.getTime())) {
                farthestDueDate = dueDateObj;
            }

            var upperRemarks = remarks.toString().toUpperCase().trim();
            var allowedRemarks = [
                /* 'ATTN',
                'ATTENTION', */
                '45 DAYS',
                '60 DAYS',
                '75 DAYS',
                '90 DAYS',
                'CUT OFF',
                'CUT-OFF',
                'UNPAID'
            ];

            var keepRemark = false;

            for (var i = 0; i < allowedRemarks.length; i++) {
                if (upperRemarks.indexOf(allowedRemarks[i]) !== -1) {
                    keepRemark = true;
                    break;
                }
            }

            if (!keepRemark)
                remarks = '';

            /* if (remarks && remarks.indexOf('IJP') !== -1) {
                remarks = '';
            } */

            if (upperRemarks === 'UNPAID' ||
                upperRemarks === 'CUT OFF' ||
                upperRemarks === 'CUT-OFF' ||
                upperRemarks === '45 DAYS' ||
                upperRemarks === '60 DAYS' ||
                upperRemarks === '75 DAYS' ||
                upperRemarks === '90 DAYS') {
                previousBalanceAmount += toNumber(amount);
                addPreviousBalanceMonth(previousBalanceDateMap, tranDate);
            }

            detailRows.push(add1row(
                formatDate(tranDate),
                invoiceNo,
                drNo,
                formatCurrency(lineCurrency),
                amount.replace(/\B(?=(\d{3})+(?!\d))/g, ","), // formatAmount(amount, lineCurrency),
                remarks,
                formatDate(dueDate),
                ''
            ));

            addSalesSummary(summaryMap, tranDate, dueDate, amount);
        }

        var lastPageRows = detailRows.length % ROWS_PER_PAGE;
        var addLastPageHeader = '';

        // When total rows is an exact multiple of 27, the last page is full.
        if (lastPageRows === 0)
            lastPageRows = ROWS_PER_PAGE;

        var cutoffSectionClass = (lastPageRows > 10 && lastPageRows < 27) ? 'page-break-before' : '';

        if (cutoffSectionClass == 'page-break-before')
            addLastPageHeader += addHeader(customer, customerAddress, controlNum, createdDate, currency, terms, branchAddress(branch));

        html = injectHtmlPagingStyles(html);
        html = replaceAll(html, '{statementDate}', escapeHtml(createdDate));
        html = replaceAll(html, '{customer}', escapeHtml(customer));
        html = replaceAll(html, '{customerAddress}', escapeHtml(customerAddress));
        html = replaceAll(html, '{address}', branchAddress(branch));
        html = replaceAll(html, '{currency}', escapeHtml(currency));
        html = replaceAll(html, '{terms}', escapeHtml(terms));
        html = replaceAll(html, '{body}', buildPagedRows(detailRows, rowsPerPage, customer, customerAddress, controlNum, createdDate, currency, terms, branchAddress(branch)));
        html = replaceAll(html, '{salesSummaryRows}', buildSalesSummaryRows(summaryMap, currencyForAmount));
        html = replaceAll(html, '{salesSummaryTotal}', formatAmount(totalAmount, currencyForAmount));
        html = replaceAll(html, '{previousBalanceStatus}', ':');
        html = replaceAll(html, '{previousBalanceAmount}', formatAmount(previousBalanceAmount, currencyForAmount));
        html = replaceAll(html, '{previousBalanceLabel}', escapeHtml(buildPreviousBalanceLabel(previousBalanceDateMap)));
        html = replaceAll(html, '{currentTransactionAmount}', formatAmount(currentTransactionAmount, currencyForAmount));
        /* html = replaceAll(html, '{currentTransactionLabel}', escapeHtml(getMonthYear(dateTo) + ' TRANSACTION')); */
        html = replaceAll(html, '{totalAmountToBePaid}', formatAmount(totalAmount, currencyForAmount));
        html = replaceAll(html, '{preparedBy}', preparedBy);
        html = replaceAll(html, '{preparedByTitle}', 'Staff');
        html = replaceAll(html, '{checkedBy}', 'RAMOS, RIZZA');
        html = replaceAll(html, '{checkedByTitle}', 'MPD & Logistics Manager');
        html = replaceAll(html, '{approvedBy}', 'KANEHIRA, YUJI');
        html = replaceAll(html, '{approvedByTitle}', 'President');
        html = replaceAll(html, '{notedBy}', 'LUBAG, SHIELA');
        html = replaceAll(html, '{notedByTitle}', 'Assistant Vice President');
        html = replaceAll(html, '{controlNo}', escapeHtml(controlNum));
        html = replaceAll(html, '{soaDueDate}', escapeHtml(formatDate(farthestDueDate || dateTo)));
        html = replaceAll(html, '{rowsPerPage}', rowsPerPage);
        html = replaceAll(html, '{totalDetailLines}', detailRows.length);
        html = replaceAll(html, '{cutoffSectionClass}', cutoffSectionClass);
        html = replaceAll(html, '{addHeader}', addLastPageHeader);
        if (detailRows.length < ROWS_PER_PAGE && addLastPageHeader === '') {
            html = replaceAll(html, '{lastPageNumber}', addOnlyPageFooter());
            html = replaceAll(html, '{LastPageNumberUnderTable}', '');
        }
        if (detailRows.length >= ROWS_PER_PAGE || detailRows.length <= ROWS_PER_PAGE && addLastPageHeader !== '') {
            if (calculateActualTotalPages(detailRows.length, rowsPerPage) <= 2) {
                html = replaceAll(html, '{LastPageNumberUnderTable}', addPageNumberRow(calculateTotalPages(detailRows.length, rowsPerPage), calculateTotalPages(detailRows.length, rowsPerPage) + 1));
                html = replaceAll(html, '{lastPageNumber}', addLastPageNumberRow(calculateActualTotalPages(detailRows.length, rowsPerPage), calculateActualTotalPages(detailRows.length, rowsPerPage) + 1));
            } else {
                html = replaceAll(html, '{LastPageNumberUnderTable}', '');
                html = replaceAll(html, '{lastPageNumber}', addLastPageNumberRow(calculateActualTotalPages(detailRows.length, rowsPerPage), calculateActualTotalPages(detailRows.length, rowsPerPage)));
            }
        } else {
            html = replaceAll(html, '{lastPageNumber}', '');
        }
        html = replaceAll(html, '{totalHtmlPages}', calculateActualTotalPages(detailRows.length, rowsPerPage));

        response.setHeader({
            name: 'Content-Type',
            value: 'text/html; charset=UTF-8'
        });
        response.write(html);
    }

    function buildPagedRows(detailRows, rowsPerPage, customer, customerAddress, controlNo, statementDate, currency, terms, address) {
        var rows = '';
        var totalPages = calculateActualTotalPages(detailRows.length, rowsPerPage);
        var currentPage = 1;

        for (var i = 0; i < detailRows.length; i++) {
            rows += detailRows[i];

            if (detailRows.length === 0) {
                rows += addOnlyPageFooter();
            }

            if (isPageEndLine(i, detailRows.length, rowsPerPage)) {
                if (currentPage < totalPages) {
                    rows += addPageNumberRow(currentPage, totalPages);

                    if (i < detailRows.length - 1) {
                        rows += addPageBreakRow();
                        rows += addHeader(customer, customerAddress, controlNo, statementDate, currency, terms, address);
                        rows += addTableHeaderRow();
                        currentPage++;
                    }
                }
            }
        }

        return rows;
    }

    function isPageEndLine(lineIndex, totalRows, rowsPerPage) {
        var rowNumber = lineIndex + 1;

        return rowNumber === totalRows || rowNumber % rowsPerPage === 0;
    }

    function addPageNumberRow(pageNumber, totalPages) {
        return '' +
            '<tr class="html-page-number-row">' +
            '<td style="text-align: left;">THIS IS SYSTEM GENERATED PER <b>BIR CAS REGISTRATION NO.: AC_056_102024_000019 ISSUED DATE: OCTOBER 31, 2024</b></td>' +
            '<td colspan="6">Page ' + pageNumber + ' of ' + totalPages + '</td>' +
            '</tr>';
    }

    function addLastPageNumberRow(pageNumber, totalPages) {
        return '' +
            '<tr class="html-page-number-last-row">' +
            '<td colspan="5" style="text-align: left;">THIS IS SYSTEM GENERATED PER <b>BIR CAS REGISTRATION NO.: AC_056_102024_000019 ISSUED DATE: OCTOBER 31, 2024</b></td>' +
            '<td colspan="1" style="vertical-align: middle;">Page ' + pageNumber + ' of ' + totalPages + '</td>' +
            '</tr>';
    }

    function addOnlyPageFooter() {
        return '' +
            '<tr class="html-page-number-last-row">' +
            '<td style="text-align: left;" colspan="6">THIS IS SYSTEM GENERATED PER <b>BIR CAS REGISTRATION NO.: AC_056_102024_000019 ISSUED DATE: OCTOBER 31, 2024</b></td>' +
            '</tr>';
    }

    function addPageBreakRow() {
        return '' +
            '<tr class="html-page-break-row">' +
            '<td colspan="7">&nbsp;</td>' +
            '</tr>' +
            '</table>';
    }

    function calculateTotalPages(totalRows, rowsPerPage) {
        if (totalRows <= 0) {
            return 1;
        }

        return Math.ceil(totalRows / rowsPerPage);
    }

    function calculateActualTotalPages(totalRows, rowsPerPage) {

        if (totalRows <= rowsPerPage)
            return 1;

        var tablePages = Math.ceil(totalRows / rowsPerPage);

        var lastPageRows = totalRows % rowsPerPage;

        if (lastPageRows === 0)
            lastPageRows = rowsPerPage;


        // balance + signatory moves to another page
        if (lastPageRows > 10 && lastPageRows < rowsPerPage) {
            return tablePages + 1;
        }

        return tablePages;
    }

    function injectHtmlPagingStyles(html) {
        var pagingStyles = '' +
            '<style type="text/css">' +
            '.html-page-number-row td {' +
            'border:0 !important;' +
            'font-size:7.1pt;' +
            'text-align:right;' +
            'padding-top:4px;' +
            'padding-bottom:2px;' +
            '}' +
            '.html-page-number-last-row td {' +
            'border:0 !important;' +
            'font-size:7.1pt;' +
            'text-align:right;' +
            'padding-top:25px;' +
            'padding-bottom:2px;' +
            '}' +
            '@media print {' +
            '.html-page-break-row { break-after: page; page-break-after: always; }' +
            '.html-page-break-row td { border: 0 !important; height: 0 !important; line-height: 0 !important; padding: 0 !important; }' +
            '.details-table thead { display: table-header-group; }' +
            '.page-header { display: table-header-group; }' +
            '}' +
            '@media screen {' +
            '.html-page-break-row td { border: 0 !important; height: 16px !important; padding: 0 !important; }' +
            '}' +
            '</style>';

        if (html.indexOf('</head>') !== -1) {
            return html.replace('</head>', pagingStyles + '</head>');
        }

        return pagingStyles + html;
    }

    function addHeader(customer, customerAddress, controlNo, statementDate, currency, terms, address) {
        return '<thead class="page-header">' +
            '<tr>' +
            '<td class="page-header-cell">' +
            '<div class="doc-code">PF-MP-046-F02 REV. 00</div>' +
            '<table class="header-layout">' +
            '<tr>' +
            '<td class="left-panel">' +
            '<table class="brand-row">' +
            '<tr>' +
            '<td>' +
            '<img style="height: 35px; width: 380px;" src="https://3389427.app.netsuite.com/core/media/media.nl?id=349768&amp;c=3389427&amp;h=jauO9MIdFdseVgWZfS4-Rw2UuAAUuB-GEGtdV_lU9Synwqtm&amp;fcts=20250421171410&amp;whence=" />' +
            '</td>' +
            '</tr>' +
            '</table>' +
            '<table width="100%">' +
            '<tr>' +
            '<td style="font-size:8pt;line-height:12pt;">' + address +
            '</td>' +
            '</tr>' +
            '</table>' +
            '</td>' +
            '<td class="right-panel">' +
            '<div class="side-title">Statement of Account [SOA]</div>' +
            '<table class="control-table">' +
            '<tr>' +
            '<td class="control-label">Control No. :</td>' +
            '<td class="control-value">' + controlNo + '</td>' +
            '</tr>' +
            '</table>' +
            '<br />' +
            '<table class="date-table">' +
            '<tr>' +
            '<td class="side-date-label">Date:</td>' +
            '<td class="side-date-value">' + statementDate + '</td>' +
            '</tr>' +
            '</table>' +
            '</td>' +
            '</tr>' +
            '</table>' +
            '<table style="border:1px solid #000000;">' +
            '<tr>' +
            '<td style="border:1px solid #000000;" colspan="3">' +
            '<b>Account Name:</b> Kanepackage Philippine Inc.' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td style="border-right:1px solid #000000;">' +
            '<div class="bank-box">' +
            '<b>Bank:</b> MUFG Bank, Ltd.<br />' +
            '<b>Address:</b> 15th Floor, 6788 Ayala Avenue, Makati City<br />' +
            '<b>USD Account No.: 512-1000-208306</b><br />' +
            '<b>Swiftcode:</b> BOTKPHMM<br />' +
            '</div>' +
            '</td>' +
            '<td style="border-right:1px solid #000000;">' +
            '<div class="bank-box">' +
            '<b>Bank:</b> RCBC Carmelray 1 Branch<br />' +
            '<b>Address:</b> Canlubang, Calamba, Laguna<br />' +
            '<b>USD Account No.: 8-322-00338-3</b><br />' +
            '<b>PHP Account No.: 1-322-40558-4</b><br />' +
            '<b>JPY Account No.: 8-322-00339-1</b><br />' +
            '<b>Swiftcode:</b> RCBCPHMM' +
            '</div>' +
            '</td>' +
            '<td>' +
            '<div class="bank-box">' +
            '<b>Bank:</b> Mizuho Corporate Bank Ltd. Manila Branch<br />' +
            '<b>Address:</b> 25th Floor, The Zuellig Building,<br />' +
            'Makati Avenue cor. Paseo De Roxas, Makati City 1225<br />' +
            '<b>USD Account No.: F15-789-101865</b><br />' +
            '<b>PHP Account No.: F10-767-101865</b><br />' +
            '<b>Swiftcode:</b> MHCBPHMM' +
            '</div>' +
            '</td>' +
            '</tr>' +
            '</table>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<table class="details-table"></table>' +
            '</tr>' +
            '<tr>' +
            '<table width="100%" style="border:1px solid #000000;">' +
            '<tr>' +
            '<td>' +
            '<table width="100%">' +
            '<tr>' +
            '<td style="font-size:8pt;font-weight:bold;">' +
            'Customer Name &amp; Address:' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td style="font-size:11pt;font-weight:bold;">' +
            customer +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td style="font-size:9pt;">' +
            customerAddress +
            '</td>' +
            '</tr>' +
            '</table>' +
            '</td>' +
            '<td style="width: 36.7%; font-size:10pt; border-left: 1px solid #000000; text-align: center; vertical-align: middle; padding: 4px;">' +
            '<b>Currency:</b> ' + currency + '<br /><br />' +
            '<b>Terms:</b> ' + terms +
            '</td>' +
            '</tr>' +
            '</table>' +
            '</tr>' +
            '</thead>';

    }

    function addTableHeaderRow() {
        return '<table class="details-table">' +
            '<thead>' +
            '<tr>' +
            '<th class="date-col">DATE</th>' +
            '<th class="invoice-col">INVOICE #</th>' +
            '<th class="dr-col">D.R. #</th>' +
            '<th class="amount-header-col" colspan="2">AMOUNT</th>' +
            '<th class="remarks-col">REMARKS</th>' +
            '<th class="due-col last-col">DUE DATE</th>' +
            '</tr>' +
            '</thead>';
    }

    function add1row(tranDate, invoiceNo, drNo, currency, amount, remarks, dueDate, rowClass) {
        var classAttribute = rowClass ? ' class="' + rowClass + '"' : '';

        return '<tr' + classAttribute + ' style="height: 25px;">' +
            '<td class="date-col">' + escapeHtml(tranDate) + '</td>' +
            '<td class="invoice-col">' + escapeHtml(invoiceNo) + '</td>' +
            '<td class="dr-col">' + escapeHtml(drNo) + '</td>' +
            '<td class="currency-col">' + currency + '</td>' +
            '<td class="amount-col">' + amount + '</td>' +
            '<td class="remarks-col">' + escapeHtml(remarks) + '</td>' +
            '<td class="due-col">' + escapeHtml(dueDate) + '</td>' +
            '</tr>';
    }

    function addPreviousBalanceMonth(monthMap, tranDate) {
        var dateObj = normalizeDateValue(tranDate);

        if (!dateObj) return;

        var year = dateObj.getFullYear();
        var month = dateObj.getMonth();

        if (!monthMap[year]) {
            monthMap[year] = {};
        }

        monthMap[year][month] = true;
    }

    function buildPreviousBalanceLabel(monthMap) {
        var years = [];
        var year;

        for (year in monthMap) {
            if (monthMap.hasOwnProperty(year)) {
                years.push(parseInt(year, 10));
            }
        }

        if (years.length === 0) return '';

        years.sort(function (a, b) {
            return a - b;
        });

        var parts = [];

        for (var i = 0; i < years.length; i++) {
            var months = [];
            var monthKey;
            var yearValue = years[i];

            for (monthKey in monthMap[yearValue]) {
                if (monthMap[yearValue].hasOwnProperty(monthKey)) {
                    months.push(parseInt(monthKey, 10));
                }
            }

            months.sort(function (a, b) {
                return a - b;
            });

            parts.push(formatMonthRanges(months, yearValue));
        }

        return parts;
    }

    function branchAddress(branch) {
        var addressMap = {
            'LAGUNA': '<b>#5 Ring Road Light Industry Science Park II,<br />Brgy. Lamesa, Calamba City, Laguna<br />Tel. No.: (049) 545-7166 to 69 Fax No.: (049) 545-7516 / 545-6302</b><br />VAT REG TIN #: 004-692-418-00000 *PEZA REG #: 96-028',
            'LIMA': '<b>Blk 6-B Lot 2 & 3 Phase 3, Lima Technology Center<br />Special Economic Zone Malvar, Batangas 4233<br />Tel. No.: (043) 236-6885 Cel. No.: 0917-836-3028</b><br />VAT REG TIN #: 004-692-418-003 *PEZA REG #: 96-028',
            'FPIP': '<b>Lot 10 635A CSD-04-017299<br />Phase 1A, Bldg. B2, FPIP, Sto. Tomas, Batangas 4234<br />Cel. No.: 0917-538-4655 / 0917-538-6922</b><br />VAT REG TIN #: 004-692-418-004 *PEZA REG #: 96-028',
            'CEBU': '<b>(Warehousing Division)<br />Blk 3, Lot 5 & 6, Ohmori Whse, Cebu Light Industrial Park,<br />Brgy. Basak, Lapu-Lapu City, Cebu 6015<br />Tel. No.: (032) 888-6688</b><br />VAT REG TIN #: 004-692-418-00002 *PEZA REG #: 96-028',
            'CAVITE': '<b>(Storage Facility of LISP II, Calamba City, Laguna)<br />Bldg. 7A,10th St., Lot 6, Block 18, Phase III CEPZ, Rosario, Cavite 4106 <br />Cel. No.: 0917-560-9915 Telefax. No.: (046) 437-1816</b><br />VAT REG TIN #: 004-692-418 *PEZA REG #: 96-028'
        };

        return addressMap[branch] || '';
    }

    function formatMonthRanges(months, year) {
        var ranges = [];
        var start = months[0];
        var end = months[0];

        for (var i = 1; i < months.length; i++) {
            if (months[i] === end + 1) {
                end = months[i];
            } else {
                ranges.push(formatMonthRange(start, end, year));
                start = months[i];
                end = months[i];
            }
        }

        ranges.push(formatMonthRange(start, end, year));
        return ranges.join(', ');
    }

    function formatMonthRange(startMonth, endMonth, year) {
        if (startMonth === endMonth) {
            return SHORT_MONTH_NAMES[startMonth] + ' ' + year;
        }

        return SHORT_MONTH_NAMES[startMonth] + '-' + SHORT_MONTH_NAMES[endMonth] + ' ' + year;
    }

    function isSameMonthYear(value, compareValue) {
        var dateObj = normalizeDateValue(value);
        var compareDateObj = normalizeDateValue(compareValue);

        if (!dateObj || !compareDateObj) return false;

        return dateObj.getMonth() === compareDateObj.getMonth() &&
            dateObj.getFullYear() === compareDateObj.getFullYear();
    }

    function addSalesSummary(summaryMap, tranDate, dueDate, amount) {
        var deliveryLabel = getShortMonthYear(tranDate);

        if (!deliveryLabel) return;

        var dueLabel = getMonthYear(dueDate);
        var summaryKey = deliveryLabel + '|' + dueLabel;
        var tranDateObj = normalizeDateValue(tranDate);

        if (!summaryMap[summaryKey]) {
            summaryMap[summaryKey] = {
                deliveryLabel: deliveryLabel,
                dueLabel: dueLabel,
                amount: 0,
                sortValue: tranDateObj ? tranDateObj.getTime() : 0
            };
        }

        summaryMap[summaryKey].amount += toNumber(amount);
    }

    function buildSalesSummaryRows(summaryMap, currencyText) {
        var keys = [];
        var key;
        var rows = '';

        for (key in summaryMap) {
            if (summaryMap.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        keys.sort(function (a, b) {
            return summaryMap[a].sortValue - summaryMap[b].sortValue;
        });

        for (var i = 0; i < keys.length; i++) {
            var summary = summaryMap[keys[i]];

            rows += '<tr>' +
                '<td class="summary-month">' + escapeHtml(summary.deliveryLabel) + ' DELIVERY:</td>' +
                '<td class="summary-amount">' + formatAmount(summary.amount, currencyText) + '</td>' +
                '<td class="summary-note">' + /* escapeHtml(summary.dueLabel) + ' DUE AMOUNT' + */ '</td>' +
                '</tr>';
        }

        return rows;
    }

    function normalizeDateValue(value) {
        if (!value) return null;

        if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
            return value;
        }

        if (typeof value === 'string') {
            try {
                return format.parse({
                    value: value,
                    type: format.Type.DATE
                });
            } catch (e) {
                log.debug('DATE PARSE ERROR', e);
            }
        }

        return null;
    }

    function formatDate(value) {
        var dateObj = normalizeDateValue(value);

        if (!dateObj) return '';

        try {
            return format.format({
                value: dateObj,
                type: format.Type.DATE
            });
        } catch (e) {
            log.debug('DATE FORMAT ERROR', e);
            return '';
        }
    }

    function getMonthYear(value) {
        var dateObj = normalizeDateValue(value);

        if (!dateObj) return '';

        return MONTH_NAMES[dateObj.getMonth()] + ' ' + dateObj.getFullYear();
    }

    function getShortMonthYear(value) {
        var dateObj = normalizeDateValue(value);

        if (!dateObj) return '';

        return SHORT_MONTH_NAMES[dateObj.getMonth()] + ' ' + dateObj.getFullYear();
    }

    function toNumber(value) {
        var num = parseFloat(value);
        return isNaN(num) ? 0.00 : num;
    }

    function getCreatedDatePhilippine(soaRecord) {
        var createdDate = null;

        try {
            createdDate = soaRecord.getValue({ fieldId: 'custrecord_kppi_soa_date_prepared' });
        } catch (e) {
            log.debug('CREATED DATE VALUE ERROR', e);
        }

        if (!createdDate) return '';

        return getPhilippineDateText(createdDate);
    }

    function getPhilippineDateText(value) {
        var dateObj = normalizeDateValue(value);

        if (!dateObj) return '';

        var phTime = dateObj.getTime() + (8 * 60 * 60 * 1000);
        var phDate = new Date(phTime);
        var day = phDate.getUTCDate();
        var dayText = day < 10 ? '0' + day : day.toString();
        var monthText = SHORT_MONTH_NAMES[phDate.getUTCMonth()].toLowerCase();

        monthText = monthText.charAt(0).toUpperCase() + monthText.slice(1);
        return dayText + '-' + monthText + '-' + phDate.getUTCFullYear();
    }

    function formatAmount(value, currencyText) {
        var num = toNumber(value);
        var prefix = '';

        if (currencyText === 'Philippine Peso' || currencyText === 'PHP' || currencyText === 'PESO') {
            prefix = '&#8369;';
        } else if (currencyText === 'US Dollar' || currencyText === 'USD') {
            prefix = '$';
        } else if (currencyText === 'Japanese Yen' || currencyText === 'JPY' || currencyText === 'YEN') {
            prefix = '&#165;';
        }

        return prefix + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatCurrency(currencyText) {
        if (currencyText === 'Philippine Peso' || currencyText === 'PHP' || currencyText === 'PESO') {
            return '&#8369;';
        } else if (currencyText === 'US Dollar' || currencyText === 'USD') {
            return '$';
        } else if (currencyText === 'Japanese Yen' || currencyText === 'JPY' || currencyText === 'YEN') {
            return '&#165;';
        }
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';

        return value.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function replaceAll(template, token, value) {
        return template.split(token).join(value === null || value === undefined ? '' : value.toString());
    }

    return {
        onRequest: onRequest
    };
});