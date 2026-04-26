const { getConfigValue, getChannel } = require('../slashcommands/trello/keyConfig.js')
const { runPost } = require('../slashcommands/trello/postStarboard.js')
const debug = false

module.exports = {
    name: 'messageReactionAdd',
    run: async (bot, reaction) => {
        /* Debug */ if (debug) console.log(`REACTION DETECTED - ${reaction.emoji.name}`)
        const message = await reaction.message.fetch()

        /* Debug */ if (debug) console.log(Object.fromEntries(message.reactions.cache))
        const suggestionsChannel = await /*channelIdArray.*/getChannel("suggestionsChannel")
        if (reaction.emoji.name == suggestionsChannel.defaultReactionEmoji.name /*'⭐'*/) {
            const suggestionsId = await getConfigValue('suggestionsId')
            if (`${message.channel.parentId}` == `${/*channelIdArray.*/suggestionsId}`) {
                let reactionCount = reaction.count
                if (reactionCount == null) {
                    /* Debug */ if (debug) console.log('Reaction Count is null, attempting to retrieve count from cache')
                    try { reactionCount = message.reactions.cache.find(react => react.emoji.name == reaction.emoji.name).count
                    } catch (error) { /* Debug */ if (debug) console.log(`Could not get reaction count - ${error}`) }
                }
                const requiredStars = await getConfigValue('requiredStars')
                /* Debug */ if (debug) console.log(`StarCount: ${reactionCount} - Threshold: ${requiredStars}`)
                if (reactionCount >= requiredStars) runPost(message)
            } else /* Debug */ if (debug) console.log(`diffchannel - ${message.channel.parentId}, ${/*channelIdArray.*/suggestionsId}`)

        }
    }
}