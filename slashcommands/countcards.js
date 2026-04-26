const { ApplicationCommandOptionType } = require('discord.js')
const { getTrelloJson } = require('./trello/keyConfig.js')

const debug = true
const debugResOK = false

async function listLines(listArray) {
    let stringArray = []
    let inpoop = 1
    for (list of listArray) {
        const fileCards = await getTrelloJson('lists', `${list.id}/cards`, debugResOK, 'CClistLinesgetListCards')
        const cardCount = fileCards.length
        stringArray.push(`**${inpoop++}**. ${list.name}: **${cardCount}** cards`)
    }
    return `${stringArray.join('\n')}`
}

const run = async (_, interaction) => {
    const listInput = `${interaction.options.getString("list")}`
    if (listInput.toUpperCase() == 'PROGRESS') {
        const lists = ['63abbb3cba0fb301ab83553c', '6323255ccd99c502f0caca37', '6323255ccd99c502f0caca38', 
        '632325992bc5fb02b052bf75', '632325ba4d289801b8a909df', '647e8cfa4cc634fe48c387c0'] // Auto, Unread, Unread-PC, TBD, TBD-PC, Approved
        let listArray = []
        for (listID of lists) {
            const listYup = await getTrelloJson('lists', listID, debugResOK, 'CCgetBoardListsProgress')
            listArray.push(listYup)
        }
        interaction.reply(`__Number of cards in each requested list__:\n${await listLines(listArray)}`)
    }
    else if (listInput.toUpperCase() == 'ALL') {
        const sendChannel = interaction.channel
        interaction.reply('Calculating card counts for all lists...')
        const boardListsOne = await getTrelloJson('boards', `RiQBBFRB/lists`, debugResOK, 'CCgetBoardLists1All')
        const boardListsTwo = await getTrelloJson('boards', `dLH1xA3x/lists`, debugResOK, 'CCgetBoardLists2All')
        let listArray = []
        for (list of boardListsOne) if (!listArray.includes(list => list.id)) listArray.push(list)
        for (list of boardListsTwo) if (!listArray.includes(list => list.id)) listArray.push(list)
        sendChannel.send(`__Number of cards in each list__:\n${await listLines(listArray)}`)
    } else {
        const list = await getTrelloJson('lists', `${listInput}`, debugResOK, 'CCgetBoardListsID')
        interaction.reply(`__Number of cards in each requested list__:\n${await listLines([list])}`)
    }
    
}

module.exports = {
	name: "countcards",
	description: "Count the amount of cards in a list.",
	options: [
		{
			name: "list",
			description: "Enter a list ID to get the # of cards, 'All' for all lists, or 'Progress' for unaccepted lists.",
			type: ApplicationCommandOptionType.String,
			required: true,
		}
	],
	run,
}