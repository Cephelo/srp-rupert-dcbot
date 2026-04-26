const { ApplicationCommandOptionType } = require('discord.js')
const { getTrelloJson } = require('./trello/keyConfig.js')

const debug = true

const target = [
	{ name: "Get Board ID", value: "board" },
	{ name: "Get List ID", value: "list" },
	{ name: "Get Card ID", value: "card" },
	{ name: "Get Label IDs", value: "label" },
]

const run = async (_, interaction) => {
	const shortString = interaction.options.getString("cardlink").split('https://trello.com/c/')[1].split('/')[0]
    const operation = `${interaction.options.getString("target")}`

    const fileTrelloJsonOne = await getTrelloJson('boards', 'RiQBBFRB/cards', debug, 'getid1')// Lone trello
    const cardObjectOne = fileTrelloJsonOne.find(card => card.shortLink == shortString)
    const fileTrelloJsonTwo = await getTrelloJson('boards', 'dLH1xA3x/cards', debug, 'getid2')// Denied trello
    const cardObjectTwo = fileTrelloJsonTwo.find(card => card.shortLink == shortString)
    let cardObject = cardObjectOne
    if (cardObjectOne == undefined) cardObject = cardObjectTwo

    if (operation == 'board') interaction.reply(`The ID of this card's board is ${cardObject.idBoard}.  *Card used: <${cardObject.shortUrl}>*`)
    else if (operation == 'list')  interaction.reply(`The ID of this card's list is ${cardObject.idList}.  *Card used: <${cardObject.shortUrl}>*`)
    else if (operation == 'card') interaction.reply(`The ID of this card is ${cardObject.id}.  *Card used: <${cardObject.shortUrl}>*`)
    else if (operation == 'label') {
        let labelArray = []
        for (label of cardObject.labels) labelArray.push(` __${label.name}__ (${label.id})`)
        interaction.reply(`This card has the following labels:${labelArray.toString()}.  *Card used: <${cardObject.shortUrl}>*`)
    }
}

module.exports = {
	name: "getid",
	description: "Get the ID of anything in the trello.",
	options: [
		{
			name: "target",
			description: "What type of Trello nodule you want the ID of.",
			type: ApplicationCommandOptionType.String,
			choices: target,
			required: true,
		},
		{
			name: "cardlink",
            description: "Card Link (or a Card in the List/Board) you want the ID for, or the Card you want the Label IDs of.",
			type: ApplicationCommandOptionType.String,
			required: true,
		}
	],
	run,
}