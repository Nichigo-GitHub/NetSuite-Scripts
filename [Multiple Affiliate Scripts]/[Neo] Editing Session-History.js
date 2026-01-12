/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/record', 'N/runtime', 'N/log'], function (search, record, runtime, log) {

    const PARENT_REC = 'customrecord_edit_history';
    const CHILD_REC = 'customrecord_edit_session';

    function beforeLoad(context) {
        log.debug('beforeLoad.start', { eventType: context.type });
        log.debug('beforeLoad is edit?', 'isEdit=' + (context.type === context.UserEventType.EDIT) + ', context.type=' + context.type + ', EDIT=' + context.UserEventType.EDIT);
        if (context.type != context.UserEventType.EDIT) {
            log.debug('beforeLoad.skipping', { reason: 'not edit', eventType: context.type });
            return;
        }

        const user = runtime.getCurrentUser().id;

        if (user === -4) { // -4 is the internal ID for the System User
            log.debug('beforeLoad.skipping', { reason: 'system user', eventType: context.type });
            return;
        }

        log.debug('beforeLoad.currentUser', { user: user });

        const parentId = findOrCreateParent(context.newRecord);
        log.debug('beforeLoad.parentId', { parentId: parentId });

        // check if a session is already active
        const parentRec = record.load({ type: PARENT_REC, id: parentId });
        const hasActive = parentRec.getValue('custrecord_eh_active_session');
        log.debug('beforeLoad.parentActive', { parentId: parentId, hasActive: hasActive });

        if (!hasActive) {
            startSession(parentId, user);
        }
    }

    function afterSubmit(context) {
        log.debug('afterSubmit.start', { eventType: context.type });
        if (context.type === context.UserEventType.DELETE) {
            handleDelete(context);
            return;
        }

        if (context.type !== context.UserEventType.EDIT) {
            log.debug('afterSubmit.skipping', { reason: 'unsupported event', eventType: context.type });
            return;
        }

        const user = runtime.getCurrentUser().id;
        log.debug('afterSubmit.currentUser', { user: user });

        if (user === -4) { // -4 is the internal ID for the System User
            log.debug('afterSubmit.skipping', { reason: 'system user', eventType: context.type });
            return;
        }

        const parentId = findOrCreateParent(context.newRecord);
        log.debug('afterSubmit.parentId', { parentId: parentId });

        // close any active session
        endActiveSession(parentId, user, context);
        log.debug('afterSubmit.completed', { parentId: parentId });
    }

    /**
     * Finds existing parent via record type + internal id
     * or creates one.
     */
    function findOrCreateParent(rec) {
        const type = rec.type;
        const id = rec.id;
        const displayId = getDisplayIdentifier(rec);

        const s = search.create({
            type: PARENT_REC,
            filters: [
                ['custrecord_eh_record_type', 'is', type],
                'AND',
                ['custrecord_eh_record_id', 'equalto', id]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (s.length > 0) {
            return s[0].id;
        }

        const parent = record.create({ type: PARENT_REC });
        parent.setValue('custrecord_eh_record_type', type);
        parent.setValue('custrecord_eh_record_id', id);
        parent.setValue('custrecord_eh_display_id', displayId);
        parent.setValue('custrecord_eh_active_session', false);

        return parent.save();
    }

    /**
     * Creates a new child editing session.
     */
    function startSession(parentId, userId) {
        log.debug('startSession.start', { parentId: parentId, userId: userId });
        const child = record.create({ type: CHILD_REC });
        child.setValue('custrecord_es_parent', parentId);
        child.setValue('custrecord_es_editor', userId);
        child.setValue('custrecord_es_start', new Date());
        child.setValue('custrecord_es_isactive', true);
        const childId = child.save();
        log.debug('startSession.created', { childId: childId });

        // update parent
        record.submitFields({
            type: PARENT_REC,
            id: parentId,
            values: {
                custrecord_eh_active_session: true,
                custrecord_eh_last_editor: userId
            }
        });
        log.debug('startSession.parentUpdated', { parentId: parentId });
    }

    /**
     * End the current active session (if any).
     */
    function endActiveSession(parentId, userId, context) {
        log.debug('endActiveSession.start', { parentId: parentId, userId: userId });

        const sessionSearch = search.create({
            type: CHILD_REC,
            filters: [
                ['custrecord_es_parent', 'is', parentId],
                'AND',
                ['custrecord_es_isactive', 'is', true]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (!sessionSearch.length) return;

        const sessionId = sessionSearch[0].id;
        log.debug('endActiveSession.foundSession', { sessionId: sessionId });

        // 🔒 Close session
        record.submitFields({
            type: CHILD_REC,
            id: sessionId,
            values: {
                custrecord_es_end: new Date(),
                custrecord_es_isactive: false
            }
        });
        log.debug('endActiveSession.sessionClosed', { sessionId: sessionId });

        record.submitFields({
            type: PARENT_REC,
            id: parentId,
            values: {
                custrecord_eh_active_session: false,
                custrecord_eh_last_editor: userId,
                custrecord_eh_last_edit: new Date()
            }
        });
        log.debug('endActiveSession.parentUpdated', { parentId: parentId });

        // 🔍 FIELD DIFF LOOP - only for non-delete events
        if (context.type === context.UserEventType.DELETE) return;

        const oldRec = context.oldRecord;
        const newRec = context.newRecord;

        const fields = newRec.getFields();
        log.debug('endActiveSession.fieldsToCheck', { fields: fields });

        fields.forEach(function (fieldId) {
            try {
                const oldVal = oldRec.getValue({ fieldId: fieldId });
                const newVal = newRec.getValue({ fieldId: fieldId });

                if (oldVal !== newVal) {
                    log.debug('fieldDiff.detected', { fieldId: fieldId, oldVal: stringify(oldVal), newVal: stringify(newVal) });
                    
                    const diff = record.create({
                        type: 'customrecord_edit_field_change'
                    });

                    diff.setValue('custrecord_ef_session', parseInt(sessionId));
                    diff.setValue('custrecord_ef_field_id', fieldId);
                    diff.setValue('custrecord_ef_old_value', stringify(oldVal));
                    diff.setValue('custrecord_ef_new_value', stringify(newVal));
                    
                    const diffId = diff.save();
                    log.debug('fieldDiff.saved', { diffId: diffId, fieldId: fieldId, sessionId: sessionId });
                }
            } catch (e) {
                log.debug('fieldDiff.error', { fieldId: fieldId, error: e.message });
                // ignore unreadable/system fields
            }
        });

        log.debug('endActiveSession.completed', { parentId: parentId });
    }

    function getDisplayIdentifier(rec) {
        try {
            // 1️⃣ Transactions
            if (rec.getValue && rec.getValue('tranid')) {
                return rec.getValue('tranid');
            }

            // 2️⃣ Records with name / entityid / itemid
            const nameFields = ['name', 'entityid', 'itemid', 'altname', 'custrecorddrs_name', 'custrecord498'];

            for (var i = 0; i < nameFields.length; i++) {
                try {
                    var val = rec.getValue(nameFields[i]);
                    if (val) return val;
                } catch (e) { }
            }

            // 3️⃣ Absolute fallback
            return rec.type + ' #' + rec.id;

        } catch (e) {
            return 'ID ' + rec.id;
        }
    }

    function handleDelete(context) {
        const user = runtime.getCurrentUser().id;

        if (user === -4) {
            log.debug('handleDelete.skipping', { reason: 'system user' });
            return;
        }

        const parentId = findExistingParent(context.oldRecord);
        if (!parentId) {
            log.debug('handleDelete.noParent', { recordId: context.oldRecord.id });
            return;
        }

        // Close any active session
        endActiveSession(parentId, user, context);

        // Mark as deleted
        record.submitFields({
            type: PARENT_REC,
            id: parentId,
            values: {
                custrecord_eh_is_deleted: true,
                custrecord_eh_active_session: false,
                custrecord_eh_last_editor: user,
                custrecord_eh_last_edit: new Date()
            }
        });

        log.debug('handleDelete.completed', { parentId: parentId });
    }

    function findExistingParent(rec) {
        const type = rec.type;
        const id = rec.id;

        const s = search.create({
            type: PARENT_REC,
            filters: [
                ['custrecord_eh_record_type', 'is', type],
                'AND',
                ['custrecord_eh_record_id', 'equalto', id]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        return s.length ? s[0].id : null;
    }

    function stringify(val) {
        if (val === null || val === undefined) return '';
        return String(val);
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
});