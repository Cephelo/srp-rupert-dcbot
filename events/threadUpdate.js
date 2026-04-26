const { getConfigValue } = require('../slashcommands/trello/keyConfig.js')
const { logUpdate, debug } = require('../slashcommands/trello/suggModLog.js')

module.exports = {
    name: "threadUpdate",
    run: async (bot, oldThread, newThread) => {
        /* Debug */ if (debug) console.log(`threadUpdate - parentId: ${newThread.parentId}`)
        const suggestionsId = await getConfigValue('suggestionsId')
        if (newThread.parentId == /*channelIdArray.*/suggestionsId) {
            logUpdate(/*bot, */'threadUpdate', { oldThread: oldThread, newThread: newThread } )
        }
    },
}