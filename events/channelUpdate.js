const { getConfigValue } = require('../slashcommands/trello/keyConfig.js')
const { logUpdate, debug } = require('../slashcommands/trello/suggModLog.js')

module.exports = {
    name: "channelUpdate",
    run: async (bot, oldChannel, newChannel) => {
        const suggestionsId = await getConfigValue('suggestionsId')

        /* Debug */ if (debug) console.log(`channelUpdate - newChannelID: ${newChannel.id}`)
        if (newChannel.id == /*channelIdArray.*/suggestionsId) {
            logUpdate(/*bot, */'channelUpdate', { oldChannel: oldChannel, newChannel: newChannel } )
        }
    },
}