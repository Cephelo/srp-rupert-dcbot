const { getConfigValue } = require('../slashcommands/trello/keyConfig.js')
const { logUpdate, debug } = require('../slashcommands/trello/suggModLog.js')

module.exports = {
    name: "threadDelete",
    run: async (bot, thread) => {
        /* Debug */ if (debug) console.log(`threadDelete - parentId: ${thread.parentId}`)
        const suggestionsId = await getConfigValue('suggestionsId')
        if (thread.parentId == /*channelIdArray.*/suggestionsId) {
            logUpdate(/*bot, */'threadDelete', { thread: thread } )
        }
    },
}