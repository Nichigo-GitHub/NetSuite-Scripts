/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

    function execute(context) {

        var sessionSearch = search.create({
            type: 'customrecord_edit_session',
            filters: [
                ['custrecord_es_isactive', 'is', 'T'],
                'AND',
                ['custrecord_es_start', 'onorbefore', 'hoursago1']
            ],
            columns: [
                'internalid',
                'custrecord_es_parent',
                'custrecord_es_editor'
            ]
        });

        var pagedData = sessionSearch.runPaged({
            pageSize: 1000
        });

        log.debug('Expired session pages', pagedData.pageRanges.length);

        pagedData.pageRanges.forEach(function (pageRange) {

            var page = pagedData.fetch({
                index: pageRange.index
            });

            log.debug('Processing page', {
                index: pageRange.index,
                size: page.data.length
            });

            page.data.forEach(function (r) {
                try {
                    var sessionId = r.id;
                    var parentId = r.getValue('custrecord_es_parent');
                    var editorId = r.getValue('custrecord_es_editor');

                    // Close session
                    record.submitFields({
                        type: 'customrecord_edit_session',
                        id: sessionId,
                        values: {
                            custrecord_es_isactive: false,
                            custrecord_es_end: new Date(),
                            custrecord_es_editor: editorId
                        }
                    });

                    // Unlock parent
                    record.submitFields({
                        type: 'customrecord_edit_history',
                        id: parentId,
                        values: {
                            custrecord_eh_active_session: false,
                            custrecord_eh_last_edit: new Date(),
                            custrecord_eh_last_editor: editorId
                        }
                    });

                } catch (e) {
                    log.error({
                        title: 'Cleanup failed for session ' + r.id,
                        details: e
                    });
                }
            });
        });
    }

    return {
        execute: execute
    };
});