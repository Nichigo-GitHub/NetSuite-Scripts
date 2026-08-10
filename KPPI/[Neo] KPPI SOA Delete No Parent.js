/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/log'], 
function(search, record, log) {
    function execute(context) {
        try {
            var detailSearch = search.create({
                type: 'customrecord_kppi_soa_details',
                filters: [
                    [
                        'custrecord_kppi_soa_details_link',
                        'isempty',
                        ''
                    ]
                ],
                columns: [
                    'internalid'
                ]
            });

            var deletedCount = 0;

            detailSearch.run().each(function(result) {
                var detailId = result.getValue({
                    name: 'internalid'
                });

                try {
                    record.delete({
                        type: 'customrecord_kppi_soa_details',
                        id: detailId
                    });

                    deletedCount++;

                    log.audit({
                        title: 'Deleted orphan SOA Detail',
                        details: detailId
                    });

                } catch (e) {
                    log.error({
                        title: 'Delete Failed: ' + detailId,
                        details: e
                    });
                }

                return true;
            });

            log.audit({
                title: 'SOA Details Cleanup Finished',
                details: 'Deleted Records: ' + deletedCount
            });

        } catch (e) {
            log.error({
                title: 'Scheduled Script Error',
                details: e
            });
        }
    }

    return {
        execute: execute
    };
});