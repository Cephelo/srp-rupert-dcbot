const { customIdArray } = require('../slashcommands/trello/keyConfig.js')
const { updateSuggModUI, debug } = require('../slashcommands/trello/suggModUpdate.js')

async function getRepliedToMessage(interaction) {
    const repliedToMessage = await interaction.channel.messages.fetch(interaction.message.reference.messageId)
    return repliedToMessage
}
async function checkIfAuthor(interaction) {
    const summaryMessage = await getRepliedToMessage(interaction)
    /* Debug */ if (debug) console.log(`InteractUserId: ${interaction.member.id}, sumMesAuthId: ${summaryMessage.author.id}`)
    if (interaction.member.id == summaryMessage.author.id) return [true, summaryMessage]
    else {
        interaction.reply({ content: 'Only the summary author can use this.', ephemeral: true })
        return [false, undefined]
    }
}

async function checkIfEditor(interaction) {
    const editorId = interaction.message.embeds[0].fields.find(field => field.name == '*Editing in progress*').value.split('<@')[1].split('>')[0]
    /* Debug */ if (debug) console.log(`InteractUserId: ${interaction.member.id}, lblEditorId: ${editorId}`)
    if (`${interaction.member.id}` == `${editorId}`) return true
    else {
        interaction.reply({ content: 'Only the current label editor can use this.', ephemeral: true })
        return false
    }
}

module.exports = {
    name: "interactionCreate",
    run: async (bot, interaction) => {
        const {client} = bot
        /* Debug */ if (debug) console.log(`Interaction Custom ID: ${interaction.customId}`)
        
        if (interaction.customId == customIdArray.printSummaries) {
            const { printShortSummaries } = require("../slashcommands/trello/suggModUpdate")
            printShortSummaries(interaction)
            return
        }

        if (interaction.customId == customIdArray.confirmSBLink) { 
            const sumCheck = await checkIfAuthor(interaction)
            if (sumCheck[0]) {
                const summaryMessage = sumCheck[1]
                const editorMessage = await interaction.channel.messages.fetch(summaryMessage.reference.messageId)
                const { addSBLink } = require("../slashcommands/trello/suggModUpdate")
                addSBLink(interaction, summaryMessage, editorMessage)
                interaction.deferUpdate().then(interaction.deleteReply())//interaction.message.delete()
                return
            }
        }
        if (interaction.customId == customIdArray.confirmSummary) { 
            const sumCheck = await checkIfAuthor(interaction)
            if (sumCheck[0]) {
                const summaryMessage = sumCheck[1]
                const editorMessage = await interaction.channel.messages.fetch(summaryMessage.reference.messageId)
                const { shortSummary } = require("../slashcommands/trello/suggModUpdate")
                shortSummary(interaction, summaryMessage, editorMessage)
                interaction.deferUpdate().then(interaction.deleteReply())//interaction.message.delete()
                return
            }
        }
        if (interaction.customId == customIdArray.approveCard) { 
            const { confirmMoveCardToAuto } = require("../slashcommands/trello/suggModUpdate")
            confirmMoveCardToAuto(interaction)
            return
        }
        if (interaction.customId == customIdArray.moveCardToAuto) { 
            const { moveCardToAutoList } = require("../slashcommands/trello/suggModUpdate")
            const repliedToMessage = await getRepliedToMessage(interaction)
            moveCardToAutoList(interaction, repliedToMessage)
            interaction.deferUpdate().then(interaction.deleteReply())//interaction.message.delete()
            return
        }
        if (interaction.customId == customIdArray.refreshSuggModPost) { 
            const { refreshSuggModUI } = require("../slashcommands/trello/suggModUpdate")
            refreshSuggModUI(interaction, 'refreshMethod')
            return
        }
        if (interaction.customId == customIdArray.collapseSuggModEmbed) { 
            const { collapseCard } = require("../slashcommands/trello/suggModUpdate")
            collapseCard(interaction)
            return
        }
        if (interaction.customId == customIdArray.expandSuggModEmbed) { 
            const { refreshSuggModUI } = require("../slashcommands/trello/suggModUpdate")
            refreshSuggModUI(interaction, 'expandCard')
            return
        }
        if (interaction.customId == customIdArray.cancelButton) { 
            if (interaction.message.flags.has(64)/* check if ephemeral*/) interaction.deferUpdate().then(interaction.deleteReply())
            else { 
                const sumCheck = await checkIfAuthor(interaction)
                if (sumCheck[0]) interaction.message.delete()
            }
            return
        }
        if (interaction.customId == customIdArray.deletePrintConfigValues) { 
            interaction.message.delete()
            return
        }

        if (interaction.customId == customIdArray.collapseDRE) { 
            const { collapseDREMethod } = require("../slashcommands/trello/devReview")
            collapseDREMethod(interaction)
            return
        }
        if (interaction.customId == customIdArray.refreshDRE || interaction.customId == customIdArray.expandDRE) { 
            const { refreshDRE, hasDevPermission } = require("../slashcommands/trello/devReview")
            if (await hasDevPermission(interaction) == true) refreshDRE(interaction, false)
            return
        }
        if (interaction.customId == customIdArray.changeDecisionDRE) { 
            const { changeDecisionDRE } = require("../slashcommands/trello/devReview")
            changeDecisionDRE(interaction)
            return
        }
        if (interaction.customId == customIdArray.confirmDecisionDRE || interaction.customId == customIdArray.nvmDRE) { 
            const { confirmDecisionDRE } = require("../slashcommands/trello/devReview")
            confirmDecisionDRE(interaction)
            return
        }
        if (interaction.customId == customIdArray.moveCardDRE) { 
            const { moveCardDREMethod } = require("../slashcommands/trello/devReview")
            const repliedToMessage = await getRepliedToMessage(interaction)
            moveCardDREMethod(interaction, repliedToMessage)
            return
        }
        if (interaction.customId == customIdArray.cancelButtonDRE) { 
            const { cancelButtonDRE } = require("../slashcommands/trello/devReview")
            const repliedToMessage = await getRepliedToMessage(interaction)
            cancelButtonDRE(interaction, repliedToMessage)
            return
        }
        if (interaction.customId == customIdArray.confirmDevComment) { 
            const commentMessage = await getRepliedToMessage(interaction)
            const DREMessage = await interaction.channel.messages.fetch(commentMessage.reference.messageId)
            const { devComment } = require("../slashcommands/trello/devReview")
            devComment(commentMessage, DREMessage)
            interaction.deferUpdate().then(interaction.deleteReply())
            return
        }

        // if (interaction.customId == customIdArray.selectListToSort) {
        //     const listId = interaction.values[0]
        //     const listName = interaction.component.options.find(labelObj => labelObj.value == listId).label
        //     const boardId = interaction.message.embeds[0].description.trim()

        //     const { moveSortList } = require("../slashcommands/sortlist") // Changed from "sortlist" to "sortList" becuz of some weird error
        //     moveSortList(interaction, boardId, listId, listName)
        // }

        if (interaction.customId == customIdArray.editLabels || interaction.customId == customIdArray.submitLabels || interaction.customId == customIdArray.label || interaction.customId == customIdArray.tier || interaction.customId == customIdArray.mob) { 
            /* Debug */ if (debug) console.log('updateSuggModUI triggered')
            if (interaction.customId != customIdArray.editLabels) {
                if (!(await checkIfEditor(interaction))) return
            }
            updateSuggModUI(interaction)
            return
        }
        if (!interaction.isCommand()) return
        if (!interaction.inGuild()) return interaction.reply("This command can only be used in a guild")

        const slashcmd = client.slashcommands.get(interaction.commandName)

        if (!slashcmd) return interaction.reply ("Invalid slash command")

        // check permissions
        if (slashcmd.perms && !interaction.member.permissions.has(slashcmd.perms))
            return interaction.reply("You do not have permission to use this command")

        slashcmd.run(client, interaction)
    },
}