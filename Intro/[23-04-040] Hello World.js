/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function(dialog) {
    function helloWorld() {
        var contents = {
            title: 'Greetings!',
            message: 'Hello World!'
        }

        try {
            dialog.alert(contents)

            log.debug ({
                title: 'Success',
                details: 'Alert displayed successfully'
            })
        } catch (e) {
            log.error ({
                title: e.name,
                details: e.message
            })
        }
    }

    return {
        pageInit: helloWorld
    }
})