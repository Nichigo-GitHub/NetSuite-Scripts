/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message'], function(message) {
    function testMessages() {
        let myMsg = message.create({
            title: 'My Title',
            message: 'My Message',
            type: message.Type.CONFIRMATION
        })
        myMsg.show({
            duration: 5000 // will disappear after 5s
        })

        let myMsg2 = message.create({
            title: 'My Title 2',
            message: 'My Message 2',
            type: message.Type.INFORMATION
        })
        myMsg2.show()
        setTimeout(myMsg2.hide, 15000) // will disappear after 15s

        let myMsg3 = message.create({
            title: 'My Title 3',
            message: 'My Message 3',
            type: message.Type.WARNING,
            duration: 20000
        })
        myMsg3.show() // will disappear after 20s

        let myMsg4 = message.create({
            title: 'My Title 4',
            message: 'My Message 4',
            type: message.Type.ERROR
        })
        myMsg4.show() // will stay up until hide is called.
    }

    return {
        pageInit: testMessages
    }
})