const { chooseRandomApprovedCard, createDevCardEmbed, hasDevPermission } = require('./trello/devReview.js')
const { ApplicationCommandOptionType } = require("discord.js")
const { getCardIdFromSlashInput } = require('./prepCard.js')

const debug = true

const run = async (_, interaction) => {

	if (await hasDevPermission(interaction) == false) return

	if (`${interaction.options.getString("cardlink")}` == 'null') {
		try { chooseRandomApprovedCard(interaction) }
		catch (e) {
			if (e) {
				console.log(`Fail on runGetSugg1: ${e}`)
				interaction.reply(`Failed to complete runGetSugg1`)
			}
		}
	} else {
		const getCard = await getCardIdFromSlashInput(interaction, debug, 'PCgetBoardCards')
		if (getCard != undefined) createDevCardEmbed(interaction, getCard, 'createEmbedSpecific') 
	}
}

module.exports = {
    name: "getsuggestion",
	description: "Get a develop review embed for a card ready for review.",
	options: [
		{
			name: "cardlink",
			description: "If you want a specific card, put a link to it here.  Optional.",
			type: ApplicationCommandOptionType.String,
			required: false,
		},
	],
    run,
}