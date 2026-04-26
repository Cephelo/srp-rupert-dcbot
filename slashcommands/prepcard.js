const { getTrelloJson, getConfigValue, hasPermission } = require('./trello/keyConfig.js')
const { sendSuggModMessage } = require('./trello/suggModUpdate.js')
const { ApplicationCommandOptionType } = require("discord.js")

const debug = true
const debugResOK = false

const listGroups = [
	{ name: "Unread Suggestions", value: "unread" },
	{ name: "TBD Suggestions", value: "tbd" },
]

async function getCardToAugment(interaction, list1id, list2id) {
    const list1 = await getTrelloJson('lists', `${list1id}/cards`, debugResOK, 'PCgetListCards1')
    const list2 = await getTrelloJson('lists', `${list2id}/cards`, debugResOK, 'PCgetListCards2')
    //* Debug */ if (debug) console.log(`A list is undefined.  list1: ${list1}\nlist2: ${list2}`)

    const threshold = list1.length
    const maximum = list2.length + list1.length
    //if (list1.length < list2.length) threshold = list2.length
    const randomVal = Math.floor(Math.random() * maximum)
    let chosenList = list1
    if (randomVal > threshold) chosenList = list2
    
	if (chosenList.length == 0) {
        interaction.reply('There are no cards in that category!')
        return 
    }

    const chosenCard = Math.floor(Math.random() * chosenList.length)
    /* Debug */ if (debug) console.log(`chosen: ${chosenCard}/${chosenList.length} - card id: ${chosenList[chosenCard].id}`)

    if (`${chosenCard}` == 'NaN' || `${chosenCard}` == 'undefined') return
    else sendSuggModMessage(interaction, chosenList[chosenCard], true, undefined, undefined, 'prepcard')

}

async function getCardIdFromSlashInput(interaction, debug, flag) {
	let card = interaction.options.getString("cardlink")
		const isTrelloId = /^[0-9a-fA-F]{24}$/.test(card)
		if (!card.includes('https://trello.com/c/') && !isTrelloId) {
			interaction.reply({ content: '\`cardlink\` field must be a link to a trello card, or a trello card id.', ephemeral: true })
			return undefined
		} else {
			try { 
				if (!isTrelloId) {
					const shortString = card.split('https://trello.com/c/')[1].split('/')[0]
					const fileTrelloJson = await getTrelloJson('boards', 'RiQBBFRB/cards', debug, flag)
					const cardReturn = await fileTrelloJson.find(card => card.shortLink == shortString)
					if (cardReturn != undefined) card = cardReturn.id
					else {
						/* Debug */ if (debug) console.log(`Failed to retrieve card from shortURL ${shortString}`)
						interaction.reply(`Could not find a card at <https://trello.com/c/${shortString}> - make sure the link is valid, and the card is not archived.`)
						return undefined
					}
				}
				/* Debug */ if (debug) console.log(`card "${card}" retrieved from ${flag}-cardlink input "${interaction.options.getString("cardlink")}"`)
				return card
			}
			catch (e) {
				console.log(e)
				interaction.reply(`Failed to retrieve card - assure the card link/id is valid.  ${e}`)
				return undefined
			}
		}
}

const run = async (_, interaction) => {

	if (!hasPermission(interaction, debug)) return
	const listIDs = await getConfigValue('listIDs')

	if (`${interaction.options.getString("cardlink")}` == 'null') {
		let operation = `${interaction.options.getString("listgroup")}`

		if (!operation) return interaction.reply("You must provide an operation to call")

		try {
			/* Debug */ if (debug) console.log(`prepcard - ${operation}`)
			if (operation == 'unread') await getCardToAugment(interaction, listIDs.unread, listIDs.unreadPC)
			if (operation == 'tbd') await getCardToAugment(interaction, listIDs.tbd, listIDs.tbdPC)
		} catch (e) {
			if (e) {
				console.log(e)
				interaction.reply(`Failed to complete runPrep`)
			}
		}
	} else {
		const getCard = await getCardIdFromSlashInput(interaction, debug, 'PCgetBoardCards')
		if (getCard != undefined) sendSuggModMessage(interaction, getCard, false, undefined, undefined, 'prepcard2') 
	}
}

module.exports = {
    name: "prepcard",
	description: "Get a card editor message to add a starboard link and summary.",
	options: [
		{
			name: "listgroup",
			description: "Which list group to get a random card from.",
			type: ApplicationCommandOptionType.String,
			choices: listGroups,
			required: true,
		},
		{
			name: "cardlink",
			description: "If you want a specific card, put a link to it here.  Ignores the listgroup option.",
			type: ApplicationCommandOptionType.String,
			required: false,
		},
	],
    run,
	getCardIdFromSlashInput,
}