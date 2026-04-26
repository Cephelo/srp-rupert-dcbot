const { getConfigValue } = require('../slashcommands/trello/keyConfig.js')
const { confirmSummary } = require("../slashcommands/trello/suggModUpdate")
const { confirmDevComment } = require("../slashcommands/trello/devReview")

const debug = false

module.exports = {
    name: "messageCreate",
    run: async function runAll(bot, message) {
        const {client, prefix, owner} = bot
        const channelIdArray = await getConfigValue('channelIdArray')

        if (!message.guild) return
        if (message.author.bot) return
        if (message.channel.id != channelIdArray.suggModId && message.channel.id != channelIdArray.devReviewId) return

        /* Debug */ if (debug) console.log(`Message created - ${message.id}, ${message.type}, ${message.channel.id}`)
        if (`${message.type}` == '19'/* REPLY */) {
            let doReturn = false
            try {
                /* Debug */ if (debug) console.log(`Attempting Fetch - ${message.reference.messageId}`)
                const repliedToMessage = await message.channel.messages.fetch(message.reference.messageId)
                /* Debug */ if (debug) console.log(`repliedToMessage.AuthorID - ${repliedToMessage.author.id}`)
                if (repliedToMessage.author.id == process.env.DISCORD_BOT_ID) {
                    if (message.channel.id == channelIdArray.suggModId) confirmSummary(message, repliedToMessage)
                    if (message.channel.id == channelIdArray.devReviewId) confirmDevComment(message)
                }
                doReturn = true
            } catch (error) { 
                /* Debug */ if (debug) console.log(`Failed Check - ${message.id}`)
                /* Debug */ if (debug) console.log(error) 
            }
            if (doReturn) return
        }
        if (!message.content.startsWith(prefix)) return

        const args = message.content.slice(prefix.length).trim().split(/ +/g)
        const cmdstr = args.shift().toLowerCase()

        let command = client.commands.get(cmdstr)
        if (!command) return

        let member = message.member

        if (command.devOnly && owner != member.id) {
            return message.reply("This command is only available to the bot owners")
        }

        if (command.permissions && member.permissions.missing(command.permissions).length !== 0) {
            return message.reply("You do not have permission to use this command")
        }

        try {
            await command.run({bot, message, args})
        }
        catch (err) {
            let errMsg = err.toString()

            if (errMsg.startsWith("?")) {
                errMsg = errMsg.slice(1)
                await message.reply(errMsg)
            }
            else    
                console.error(err)
        }
    }
}