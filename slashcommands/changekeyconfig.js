const { reloadVariablesFromJson, reloadValueIDs, fs, getChannel } = require('./trello/keyConfig.js')
const { ApplicationCommandOptionType } = require("discord.js")

const debug = true
const debugLong = false

const configOptions = [
	{ name: "Required Stars", value: reloadValueIDs.requiredStars },
	{ name: "Role ID for Suggestion Moderator", value: reloadValueIDs.rolePingId },
	{ name: "Suggestion Channel ID", value: reloadValueIDs.guildChecksug },
	{ name: "Starboard Channel ID", value: reloadValueIDs.guildCheckstr },
	{ name: "Suggestion Logs Channel ID", value: reloadValueIDs.guildChecklog },
	{ name: "Suggestion Moderator Channel ID", value: reloadValueIDs.guildCheckmod },
	{ name: "Developer Review Channel ID", value: reloadValueIDs.guildCheckdev },
	{ name: "AUTOMATED Trello List ID", value: reloadValueIDs.listIDsauto },
	{ name: "APPROVED Trello List ID", value: reloadValueIDs.listIDsapproved },
	{ name: "Unread Trello List ID", value: reloadValueIDs.listIDsunread },
	{ name: "Unread PCs Trello List ID", value: reloadValueIDs.listIDsunreadPC },
	{ name: "TBD Trello List ID", value: reloadValueIDs.listIDstbd },
	{ name: "TBD PCs Trello List ID", value: reloadValueIDs.listIDstbdPC },
	{ name: "Accepted Trello List ID", value: reloadValueIDs.listIDsaccepted },
	{ name: "Accepted PCs Trello List ID", value: reloadValueIDs.listIDsacceptedPC },
	{ name: "Denied Trello List ID", value: reloadValueIDs.listIDsdenied },
	{ name: "Recycled Trello List ID", value: reloadValueIDs.listIDsrecycled },
	{ name: "In The Mod Trello List ID", value: reloadValueIDs.listIDsinTheMod },
	{ name: "PCs In The Mod Trello List ID", value: reloadValueIDs.listIDsinTheModPC },
	{ name: "Being Worked On Trello List ID", value: reloadValueIDs.listIDsbeingWorkedOn },
	{ name: "PCs Being Worked On Trello List ID", value: reloadValueIDs.listIDsbeingWorkedOnPC },
]

async function writeJson(option, editedValue) {
    const logsChannel = await getChannel("logsChannel")
    try {
        fileJson = JSON.parse(fs.readFileSync('slashcommands/trello/keyConfigJson.json')) // const fileJson = require('./keyConfigJson.json')
        /* Debug */ if (debugLong) console.log(`keyConfigJson.json OLD: ${JSON.stringify(fileJson)}`)

        fileJson[option] = `${editedValue}`
        /* Debug */ if (debugLong) console.log(`keyConfigJson.json NEW: ${JSON.stringify(fileJson)}`)

        fs.writeFileSync('slashcommands/trello/keyConfigJson.json', JSON.stringify(fileJson), (err) => {
            if (err) console.log(err);
            else if (debug) console.log("changekeyconfig/keyConfigJson - Data Written!")
        })
    } catch (error) {
        /* Debug */ if (debug) console.log(error)
        console.log('keyConfigJson.json file errored, resetting file.  Errored file sent in Logs channel.')
        await logsChannel.send({ content: 'keyConfigJson.json file errored, resetting file.  Errored file below.', files: ['slashcommands/trello/keyConfigJson.json'] }) // Send to Log channel
    }
}

const run = async (_, interaction) => {
    if (interaction.user.id != process.env.BOT_OWNER_ID) { 
        interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true })
        return
    }

    let option = `${interaction.options.getString("option")}`
    let editedValue = `${interaction.options.getString("newvalue")}`
    let optionName = configOptions.find(value => value.value == option).name

    if (option == reloadValueIDs.requiredStars) {
        if (/^[0-9]{2}$/.test(editedValue) || /^[0-9]{1}$/.test(editedValue)) { // If value is 1 or 2 digits long
            await interaction.reply(`Attempting to change "${optionName}" to \`${editedValue}\`...`)
            await writeJson(option, editedValue) // write to the file
            reloadVariablesFromJson(option, interaction, optionName)
        } else {
            interaction.reply(`Could not change "${optionName}" to \`${editedValue}\` - Must be a 1 or 2 digit number`)
        }
    }

    if (option == reloadValueIDs.rolePingId || option == reloadValueIDs.guildChecksug || option == reloadValueIDs.guildCheckstr || 
        option == reloadValueIDs.guildChecklog || option == reloadValueIDs.guildCheckmod || option == reloadValueIDs.guildCheckdev) {
        if (/^[0-9]{18}$/.test(editedValue) || /^[0-9]{19}$/.test(editedValue)) { // If value is a valid Discord Snowflake
            await interaction.reply(`Attempting to change "${optionName}" to \`${editedValue}\`...`)
            await writeJson(option, editedValue) // write to the file
            reloadVariablesFromJson(option, interaction, optionName)
        } else {
            interaction.reply(`Could not change "${optionName}" to \`${editedValue}\` - Not a valid Discord ID`)
        }

    }

    if (option == reloadValueIDs.listIDsauto || option == reloadValueIDs.listIDsapproved || option == reloadValueIDs.listIDsunread || 
        option == reloadValueIDs.listIDsunreadPC || option == reloadValueIDs.listIDstbd || option == reloadValueIDs.listIDstbdPC || 
        option == reloadValueIDs.listIDsaccepted || option == reloadValueIDs.listIDsacceptedPC || option == reloadValueIDs.listIDsdenied || 
        option == reloadValueIDs.listIDsrecycled || option == reloadValueIDs.listIDsinTheMod || option == reloadValueIDs.listIDsinTheModPC || 
        option == reloadValueIDs.listIDsbeingWorkedOn || option == reloadValueIDs.listIDsbeingWorkedOnPC) {
        if (/^[0-9a-fA-F]{24}$/.test(editedValue)) { // If value is a valid Trello ID
            await interaction.reply(`Attempting to change "${optionName}" to \`${editedValue}\`...`)
            await writeJson(option, editedValue) // write to the file
            reloadVariablesFromJson(option, interaction, optionName)
        } else {
            interaction.reply(`Could not change "${optionName}" to \`${editedValue}\` - Not a valid Trello ID`)
        }
    }
}

module.exports = {
    name: "changekeyconfig",
	description: "Change a config value.  ADMINISTRATOR ONLY!",
	options: [
		{
			name: "option",
			description: "Which config option to change.",
			type: ApplicationCommandOptionType.String,
			choices: configOptions,
			required: true,
		},
		{
			name: "newvalue",
			description: "What to change the config option to.",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
    run,
}