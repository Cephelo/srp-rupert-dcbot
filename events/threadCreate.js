const { getConfigValue } = require('../slashcommands/trello/keyConfig.js')
const { logUpdate, debug } = require('../slashcommands/trello/suggModLog.js')

module.exports = {
    name: "threadCreate",
    run: async (bot, thread, newlyCreated) => {
        /* Debug */ if (debug) console.log(`threadCreate - parentId: ${thread.parentId}`)
        const suggestionsId = await getConfigValue('suggestionsId')
        if (thread.parentId == /*channelIdArray.*/suggestionsId) {
            logUpdate(/*bot, */'threadCreate', { thread: thread, newlyCreated: newlyCreated } )
        }
    },
}