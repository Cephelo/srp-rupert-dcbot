const { EmbedBuilder } = require("discord.js");
const { getConfigValue, getChannel, customIdArray } = require("./keyConfig.js");

const debug = true

async function cachePosts(client) {
    try {
        const suggestionsId = await getConfigValue("suggestionsId")
        suggestionsChannel = client.channels.cache.get(/*channelIdArray.*/suggestionsId)
        suggestionsChannel.threads.fetch({ active: true })
        suggestionsChannel.threads.fetch({ archived: { limit: 100 } })
        console.log('Suggestion Posts cached!')
    } catch (e) {
        console.log(`Could not cache suggestion posts\n${e}`)
    }
}

// Event types:
// CHANNEL_UPDATE=11, THREAD_CREATE=110, THREAD_UPDATE=111, THREAD_DELETE=112
async function sendLogEmbed(logEmbed, type, action, thread) {
    let editorId = '0'
    try {
        const logs = await thread.guild.fetchAuditLogs({ type: type, limit: 1 }) 
        editorId = `${logs.entries.first().executor.id}`
    } catch (error) { console.log('fetchAuditLogs error ', error) }

    if (editorId == customIdArray.botUserId && type == 11) logEmbed.setDescription('See the `/reloadlabels` command output for which labels changed.')

    if (type != 11) {
        logEmbed.setTitle(`${thread.name}`)
        logEmbed.setURL(thread.url)
        logEmbed.setFooter({ text: `${thread.id} - Posted: <t:${thread.createdAt}:f>` })
    }
    try {
        /* Debug */ if (debug) console.log(`sendLogEmbed: ${editorId}, ${thread}`)
        logEmbed.setAuthor({ name: `Action: ${action}` })
        logEmbed.setFields(
            { name: 'Editor', value: `<@${editorId}>` }
        )
        const logsChannel = await getChannel("logsChannel")
        await logsChannel.send({ embeds: [logEmbed] })
    } catch (error) {
        /* Debug */ if (debug) console.log(error)
    }
}

async function logUpdate(triggerName, args) {
    let logEmbed = new EmbedBuilder()
    logEmbed.setColor(0xffffff)
    if (triggerName == 'channelUpdate') { // args = oldChannel, newChannel
        if (args.oldChannel.availableTags !== args.newChannel.availableTags) {
            logEmbed.setColor(0x21aa44)
            logEmbed.setTitle('Channel Update')
            let avTagsOld = []
            await args.oldChannel.availableTags.forEach(function(avTag) {
                avTagsOld.push(`${avTag.name}`)
            })
            let avTagsNew = []
            await args.newChannel.availableTags.forEach(function(avTag) {
                avTagsNew.push(`${avTag.name}`)
            })
            logEmbed.setDescription(`**Old Tags**\n${avTagsOld.join(', ')}\n\n**New Tags**\n${avTagsNew.join(', ')}`)

            await sendLogEmbed(logEmbed, 11, 'Available Tags Edited', args.newChannel)
        }
        if (args.oldChannel.defaultReactionEmoji.name !== args.newChannel.defaultReactionEmoji.name) {
            logEmbed.setColor(0xff0000)
            logEmbed.setTitle('Channel Update')
            logEmbed.setDescription(`Old: ${args.oldChannel.defaultReactionEmoji.name} New: ${args.newChannel.defaultReactionEmoji.name}`)
            await sendLogEmbed(logEmbed, 11, 'Default Reaction Changed', args.newChannel)
        } 
    } else if (triggerName == 'threadCreate') { // args = thread, newlyCreated
        logEmbed.setColor(0x0061ff)
        logEmbed.setDescription(`Locked: ${args.thread.locked}\nTags: ${args.thread.appliedTags.toString()}`)
        setTimeout(() => {
            args.thread.send(`__Welcome to <#${args.thread.id}>, your new suggestion post!__\nKeep in mind: Only data from the original message will be passed onto the starboard and Trello, so edit the message to your liking.  If you need to add another attachment, either make a new post or ask a Trello Helper to add it for you once it reaches the starboard.\n**If you Close this post, it will automatically lock.**  *To reopen it, you must ask a Warden.  Closed posts cannot reach the starboard.*\nGood luck, and happy suggesting! :sparkles:`)
        }, 2000);
        await sendLogEmbed(logEmbed, 110, 'Suggestion Posted', args.thread)
    } else if (triggerName == 'threadDelete') { // args = thread
        logEmbed.setColor(0xff0000)
        logEmbed.setDescription(`Tags: ${args.thread.appliedTags.toString()}\nClosed: ${args.thread.archived}\nLocked: ${args.thread.locked}`)
        await sendLogEmbed(logEmbed, 112, 'Suggestion Deleted', args.thread)   
    } else if (triggerName == 'threadUpdate') { // args = oldThread, newThread
        if (args.oldThread.archived !== args.newThread.archived) {
            //logEmbed.setColor(0xffbf00)
            let action = ''
            if (args.newThread.archived) { 
                action = 'Suggestion Closed'; logEmbed.setColor(0xff8000) 
                if (args.newThread.locked) { action += ' & Locked'; logEmbed.setColor(0xff4000) }
            }
            if (!args.newThread.archived) { 
                action = 'Suggestion Reopened'; logEmbed.setColor(0xffbf00) 
                if (args.newThread.locked) { action += ' & Locked'; logEmbed.setColor(0xffff00) }
            }

            logEmbed.setDescription(`Closed: ${args.newThread.archived}\nLocked: ${args.newThread.locked}`)
            await sendLogEmbed(logEmbed, 111, action, args.newThread)
        }
        if (args.oldThread.locked !== args.newThread.locked) {
            //logEmbed.setColor(0xffbf00)
            let action = ''
            if (args.newThread.locked) { action = 'Suggestion Locked'
                if (args.newThread.archived) logEmbed.setColor(0xff4000); else logEmbed.setColor(0xffff00)
            } else { action = 'Suggestion Unlocked'
                if (args.newThread.archived) logEmbed.setColor(0xff8000); else logEmbed.setColor(0xffbf00)
            }

            logEmbed.setDescription(`Closed: ${args.newThread.archived}\nLocked: ${args.newThread.locked}`)
            await sendLogEmbed(logEmbed, 111, action, args.newThread)
        }
        if (args.oldThread.appliedTags.toString() !== args.newThread.appliedTags.toString()) {
            logEmbed.setColor(0x21aa44)
            logEmbed.setDescription(`Old Tags: ${args.oldThread.appliedTags.toString()}\nNew Tags: ${args.newThread.appliedTags.toString()}`)
            await sendLogEmbed(logEmbed, 111, 'Applied Tags Edited', args.newThread)
        }
        
    } else { 
        /* Debug */ if (debug) console.log(`suggModLog unknown triggerName: (${triggerName})`)
        return
    }
}

module.exports = { logUpdate, debug, cachePosts }