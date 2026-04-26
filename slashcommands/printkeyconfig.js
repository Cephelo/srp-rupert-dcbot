const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { fs, getChannel, getConfigValue, customIdArray } = require('./trello/keyConfig.js')

const debug = true
const debugLong = false

const deleteButton = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId(customIdArray.deletePrintConfigValues)
        .setLabel('Delete Message')
        .setStyle(ButtonStyle.Danger)
)

const run = async (_, interaction) => {
    const rolePingId = await getConfigValue('rolePingId')
    if (!interaction.member.roles.cache.some(role => role.id == rolePingId) && !interaction.member.roles.cache.some(role => role.name === 'Warden') && !interaction.member.permissions.has('MANAGE_GUILD')) {
        interaction.reply({ content: `You do not have permission to use this command.`, ephemeral: true})
        return
    }
    
    const logsChannel = await getChannel("logsChannel")
    let messageContent = ''
    try {
        const mobLC = await getConfigValue('mobLC')
        const tierLC = await getConfigValue('tierLC')
        const noteLC = await getConfigValue('noteLC')
        //const rolePingId = await getConfigValue('rolePingId')
        const requiredStars = await getConfigValue('requiredStars')
        const channelIdArray = await getConfigValue('channelIdArray')
        const listIDs = await getConfigValue('listIDs')
        const suggestionsChannel = await getChannel("suggestionsChannel")
        const starboardChannel = await getChannel("starboardChannel")
        const suggModChannel = await getChannel("suggModChannel")
        const devReviewChannel = await getChannel("devReviewChannel")

        interaction.reply({ content: `Printing config values in <#${channelIdArray.logsId}>.`, ephemeral: true })
        fileJson = JSON.parse(fs.readFileSync('slashcommands/trello/keyConfigJson.json')) // const fileJson = require('./keyConfigJson.json')
        /* Debug */ if (debugLong) console.log(`keyConfigJson.json: \`${JSON.stringify(fileJson)}`)
        messageContent = (`__keyConfigJson.json file requested, printing data__:\n` + /*
        */`> requiredStars: \`${requiredStars}\`\n` + /*
        */`> mobLC: \`${mobLC}\`\n` + /*
        */`> tierLC: \`${tierLC}\`\n` + /*
        */`> noteLC: \`${noteLC}\`\n` + /*
        */`> rolePingId: \`${rolePingId}\`\n` + /*
        */`> Auto list ID: \`${listIDs.auto}\`\n` + /*
        */`> Approved list ID: \`${listIDs.approved}\`\n` + /*
        */`> Unread list ID: \`${listIDs.unread}\`\n` + /*
        */`> Unread PCs list ID: \`${listIDs.unreadPC}\`\n` + /*
        */`> TBD list ID: \`${listIDs.tbd}\`\n` + /*
        */`> TBD PCs list ID: \`${listIDs.tbdPC}\`\n` + /*
        */`> Accepted list ID: \`${listIDs.accepted}\`\n` + /*
        */`> Accepted PCs list ID: \`${listIDs.acceptedPC}\`\n` + /*
        */`> Denied list ID: \`${listIDs.denied}\`\n` + /*
        */`> Recycled list ID: \`${listIDs.recycled}\`\n` + /*
        */`> In the Mod list ID: \`${listIDs.inTheMod}\`\n` + /*
        */`> PCs In the Mod list ID: \`${listIDs.inTheModPC}\`\n` + /*
        */`> Being worked on list ID: \`${listIDs.beingWorkedOn}\`\n` + /*
        */`> PCs Being worked on list ID: \`${listIDs.beingWorkedOnPC}\`\n` + /*
        */`> Suggestions Channel ID: \`${channelIdArray.suggestionsId}\`\n` + /*
        */`> Starboard Channel ID: \`${channelIdArray.starboardId}\`\n` + /*
        */`> SuggLogs Channel ID: \`${channelIdArray.logsId}\`\n` + /*
        */`> SuggMod Channel ID: \`${channelIdArray.suggModId}\`\n` + /*
        */`> DevReview Channel ID: \`${channelIdArray.devReviewId}\`\n` + /*
        */`> Suggestions Channel: <#${/*channelIdArray.*/suggestionsChannel.id}>\n` + /*
        */`> Starboard Channel: <#${/*channelIdArray.*/starboardChannel.id}>\n` + /*
        */`> SuggLogs Channel: <#${/*channelIdArray.*/logsChannel.id}>\n` + /*
        */`> SuggMod Channel: <#${/*channelIdArray.*/suggModChannel.id}>\n` + /*
        */`> DevReview Channel: <#${/*channelIdArray.*/devReviewChannel.id}>`)
    } catch (error) {
        /* Debug */ if (debug) console.log(error)
        console.log('keyConfigJson.json file errored, resetting file.  Errored file sent in Logs channel.')
        messageContent = 'keyConfigJson.json file errored, resetting file.  Errored file below.'
    }
    await logsChannel.send({ content: messageContent, components:[deleteButton], files: ['slashcommands/trello/keyConfigJson.json'] }) // Send to Log channel
}

module.exports = {
    name: "printkeyconfig",
	description: "Print all config values.  ADMINISTRATOR ONLY!",
    run,
}