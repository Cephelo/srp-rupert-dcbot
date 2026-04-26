const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getConfigValue, getChannel, customIdArray, fs, getTrelloJson, putTrello, guildId } = require('./keyConfig.js')
// ButtonStyles: Primary=Blurple, Success=Green, Danger=Red, Secondary=Gray, Link=Gray w/popup box indicating the button is a link

const debug = true
const debugLong = false

const printSummaries = new ButtonBuilder() // Print Summaries button
    .setCustomId(customIdArray.printSummaries)
    .setLabel('Print Summaries')
    .setStyle(ButtonStyle.Primary)

const defaultComponents/*[changeLabels, printSummaries, refreshSuggModPost]*/ = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder() // Edit Labels button
        .setCustomId(customIdArray.editLabels)
        .setLabel('Edit Labels')
        .setStyle(ButtonStyle.Primary),
        printSummaries,
    new ButtonBuilder() // Refresh button
        .setCustomId(customIdArray.refreshSuggModPost)
        .setLabel('Refresh')
        .setStyle(ButtonStyle.Secondary)
);

const approveCard = new ButtonBuilder() // Approve Card button
        .setCustomId(customIdArray.approveCard)
        .setLabel('Approve Card')
        .setStyle(ButtonStyle.Success)

const collapseSuggModEmbed = new ButtonBuilder() // Collapse button
        .setCustomId(customIdArray.collapseSuggModEmbed)
        .setLabel('Collapse Embed')
        .setStyle(ButtonStyle.Secondary)

const expandSuggModEmbed = new ActionRowBuilder() // Expand button
.addComponents(
    new ButtonBuilder()
        .setCustomId(customIdArray.expandSuggModEmbed)
        .setLabel('Expand')
        .setStyle(ButtonStyle.Secondary)
);


function getCurrentDate(fuzzyTimeOnly) {
    const currentDate = (Date.now() / 1000).toString().split('.')[0]
    return fuzzyTimeOnly ? `<t:${currentDate}:R>` : `<t:${currentDate}:R> (<t:${currentDate}:f>)`
}

/* Checks if a card on the UNREAD or TBD list has a starboard message linked to it, and has at least one short summary, 
   and is therefore ready to be moved to the APPROVED list. */
async function checkIfUnreadCardIsReady(interaction, embed) {
    const listIDs = await getConfigValue('listIDs')

    const cardId = embed.footer.text
    const cardList = await getTrelloJson('cards', `${cardId}/list`, debug, 'SMUgetCardListToCheckReady')
    /*Debug*/ if (debug) console.log(`Card ${cardId} is on list ${cardList.name} (${cardList.id})`)
    if (`${cardList.id}` == `${listIDs.auto}` || `${cardList.id}` == `${listIDs.unread}` || `${cardList.id}` == `${listIDs.unreadPC}` || 
        `${cardList.id}` == `${listIDs.tbd}` || `${cardList.id}` == `${listIDs.tbdPC}`) {
        let isUrlDefined = false
        if (embed.url !== undefined && embed.url !== null) isUrlDefined = true
        /* Debug */ if (debug) console.log(`embedURL: ${embed.url}, ${isUrlDefined}`)

        /* Debug */ if (debug) console.log('CIURCR cardId: ', cardId);
        if (await cardIsNotArchived(cardId) != false) {
            interaction.message.reply(failureMessage('Failed to check approval criteria', `cardNotFound-${cardId}`, interaction.member.id))
            return
        }
        const cardComments = await getTrelloJson('cards', `${cardId}/actions?filter=commentCard`, debug, 'SMUgetCommentsForReadyCheck')
        /* Debug */ if (debugLong) console.log(cardComments.stringify())
        /* Debug */ if (debug) console.log(`Found ${cardComments.length} comments for card ${cardId}`)
        let areThereSummaries = false
        if (cardComments.length > 0 && cardComments.some(comment => comment.data.text.includes('**Short summary** - *Written by*') && comment.memberCreator.id === '63af5585aa367c01b737a99a'/*Rupert's Trello Account ID*/)) {
            areThereSummaries = true
        } else /* Debug */ if (debug) console.log(`CIURCR: Card ${cardId} still has no summaries.`)

        if (isUrlDefined && areThereSummaries) {
            /* Debug */ if (debug) console.log(`CIURCR: Card ${cardId} is ready to be approved!`)
            return true
        }
    } else addCollapseButton(interaction)
    return false
}

function hasApproveOrCollapse(repliedToMessage) {
    return repliedToMessage.components[0].components.some(button => button.customId == customIdArray.approveCard || button.customId == customIdArray.collapseSuggModEmbed)
}

async function addApproveComponent(interaction, repliedToMessage, debugFlag, optionalBoolean) {
    const checkifReadyBoolean = await checkIfUnreadCardIsReady(interaction, repliedToMessage.embeds[0])
    /* Debug */ if (debug) console.log(`addApprove-${debugFlag}: ${checkifReadyBoolean} | hasApprove/CollapseButton: ${hasApproveOrCollapse(repliedToMessage)/*.components.length*/}`)
    let componentsCopy = ActionRowBuilder.from(defaultComponents.toJSON())// To make sure that componentsCopy won't point to defaultComponent
    let checkIfStringSelect = false
    if (repliedToMessage.components[0].components.some(component => component.type == 3/*String Select Menu, label editing*/)) checkIfStringSelect = true
    
    if (checkifReadyBoolean && !checkIfStringSelect && optionalBoolean && !hasApproveOrCollapse(repliedToMessage)/*.components.length <= 3/*[changeLabels, printSummaries, refresh]*/) { 
        componentsCopy.components.push(approveCard)
        repliedToMessage.edit({ content: repliedToMessage.content, embeds: repliedToMessage.embeds, components: [componentsCopy] })
        /* Debug */ if (debug) console.log(`Approve button pushed for message ${repliedToMessage.id} (card ${repliedToMessage.embeds[0].footer.text})`)
    } else /* Debug */ if (debug) console.log(`Approve button withheld from message ${repliedToMessage.id} (card ${repliedToMessage.embeds[0].footer.text}) - ready: ${checkifReadyBoolean}, hasStringSelect: ${checkIfStringSelect}, hasApprove/CollapseButton: ${hasApproveOrCollapse(repliedToMessage)}`)//is <4 comps: ${repliedToMessage.components[0].components.length <= 3}`)
}

async function confirmMoveCardToAuto(interaction) { // used by interactionCreate.js
    confirmationMessage(interaction, customIdArray.moveCardToAuto, true, 'Move Card', `Are you sure you want to approve this card?  **Make sure the card has a starboard post linked, is labelled correctly, and has at least one summary.**  *Approving the card will move it into the automated queue for dev approval.*  <@${interaction.member.id}>`)
}

async function moveCardToAutoList(interaction, repliedToMessage) {
    const listIDs = await getConfigValue('listIDs')

    const cardId = repliedToMessage.embeds[0].footer.text
    const notMoved = await putTrello('cards', `${cardId}?idList=${listIDs.approved}`, debug, 'SMUmoveCardToAutoList', false)
    if (!notMoved) {
        repliedToMessage.reply(`Card ${cardId} moved to dev queue *(list ${listIDs.approved})*.`)
        if (repliedToMessage.components[0].components.some(button => button.customId == customIdArray.approveCard)/*.components.length == 4/*[changeLabels, printSummaries, refreshSuggModPost, approveCard]*/) {
            let componentsCopy = ActionRowBuilder.from(defaultComponents.toJSON())// To make sure that componentsCopy won't point to  defaultComponent
            componentsCopy.components.push(collapseSuggModEmbed)
            /* Debug */ if (debug) console.log(`Collapse button pushed for message ${repliedToMessage.id} (card ${repliedToMessage.embeds[0].footer.text})`)
            repliedToMessage.edit({ content: 'This suggestion has already been given a starboard link and at least one summary.  You may still give it summaries, so the devs have more to work with.  *Reply to this message with a __short summary__ of the suggestion.*', 
                embeds: repliedToMessage.embeds, components: [componentsCopy] })
            sendLogsEmbed('Editor', 'Card Approved', interaction.member.id, interaction.message.url, cardId)
        }
    }
    else repliedToMessage.reply(`Card ${cardId} could not be moved.`)
}

async function addCollapseButton(interaction) {
    //* Debug */ if (debug) console.log(`addCollapseButton: ${interaction.message.components[0].components.length} components`)
    let componentsCopy = ActionRowBuilder.from(defaultComponents.toJSON())// To make sure that componentsCopy won't point to  defaultComponent
    let checkIfStringSelect = false
    if (interaction.message.components[0].components.some(component => component.type == 3/*String Select Menu, label editing*/)) checkIfStringSelect = true
    
    if (!checkIfStringSelect && !hasApproveOrCollapse(interaction.message)/*.components.length <= 3/*[changeLabels, printSummaries, refresh]*/) { 
        componentsCopy.components.push(collapseSuggModEmbed)
        /* Debug */ if (debug) console.log(`Collapse button pushed for message ${interaction.message.id} (card ${interaction.message.embeds[0].footer.text})`)
    } else /* Debug */ if (debug) console.log(`Collapse button withheld from message ${interaction.message.id} (card ${interaction.message.embeds[0].footer.text}) - isStringSelect: ${checkIfStringSelect}, hasApprove/CollapseButton: ${hasApproveOrCollapse(interaction.message)}`)//is <4 comps: ${interaction.message.components[0].components.length <= 3}`)
    interaction.message.edit({ content: interaction.message.content, embeds: interaction.message.embeds, components: [componentsCopy] })
}

async function collapseCard(interaction) {
    const expandedEmbed = interaction.message.embeds[0]

    let suggModEmbed = new EmbedBuilder()
    suggModEmbed.setColor(0xffc20d)
    suggModEmbed.setTitle(expandedEmbed.description.split('Title: __')[1].split('__')[0])
    suggModEmbed.setURL(expandedEmbed.author.url)
    suggModEmbed.setFooter(expandedEmbed.footer)
    interaction.update({ content: 'This card has been approved.  Click Expand to edit this card.', embeds: [suggModEmbed], components: [expandSuggModEmbed] })
}

async function sendLogsEmbed(title, desc, authorID, url, cardId) {
    let logEditorLink = { 
        color: 0x42526e,
        title: `${title} Message`,
        author: {name: `${desc}`},
        description: `**Author:** <@${authorID}>\nEdited ${getCurrentDate(false)}\n\n**Card ID**\n${cardId}`,
        url: url
    }
    const logsChannel = await /*channelIdArray.*/getChannel("logsChannel")
    await logsChannel.send({ embeds: [logEditorLink] })
}

async function refreshSuggModUI(interaction, methodId) {
    const cardId = interaction.message.embeds[0].footer.text
    await sendSuggModMessage(interaction, cardId, false, undefined, undefined, methodId)
    //sendLogsEmbed('Editor', 'Embed Refreshed', interaction.member.id, interaction.message.url, cardId)
    addApproveComponent(interaction, interaction.message, 'refreshEmbedcheckIfReady', true)   
}

async function cardIsNotArchived(cardId) {
    const cardJson = await getTrelloJson('cards', `${cardId}`, debug, 'SMUisCardArchived')
    //* Debug */ console.log('CARD:', JSON.stringify(cardJson))
    if (cardJson == undefined) return false
    /* Debug */ if (debug) console.log('isClosed:', cardJson.closed)
    return cardJson.closed
    
}

function failureMessage(message, error, authorId) {
    const cardNotFound = error.toLowerCase().includes('cardnotfound')
    if (cardNotFound) error = `Card ${error.split('-')[1]} is archived, or cannot be found.`
    const failOnNewLine = cardNotFound || error.toLowerCase().includes('http') || error.toLowerCase().includes('you must')
    const returnMessage = (`${message}: *${error}*` + ((failOnNewLine)? '  ' : '\n') 
        + `Failure occurred ${getCurrentDate(false)}` + (authorId != null ? ` <@${authorId}>` : ''))
    return returnMessage
}

async function printShortSummaries(interaction) {
    const cardId = interaction.message.embeds[0].footer.text
    /* Debug */ if (debug) console.log('PSS cardId: ', cardId);
    if (await cardIsNotArchived(cardId) != false) {
        interaction.reply(failureMessage('Failed to find summaries', `cardNotFound-${cardId}`, interaction.member.id))
        return
    }
    let cardComments = await getTrelloJson('cards', `${cardId}/actions?filter=commentCard`, debug, 'SMUgetCardComments')
    const cardCopiedComments = await getTrelloJson('cards', `${cardId}/actions?filter=copyCommentCard`, debug, 'SMUgetCardCopiedComments')
    cardComments = cardComments.concat(cardCopiedComments)
    
    let printSumsEmbed = new EmbedBuilder()
        .setColor(0x42526e)
        .setTitle('Comments')
        .setAuthor({name: `Card ID ${cardId}`})
        .setDescription(`Retrieved ${getCurrentDate(false)}\n${cardComments.length} commen${(cardComments.length == 1 ? 't' : 'ts')}`)
        .setURL(interaction.message.url)
        
    let commentCount = 1
    for (const comment of cardComments) {
        /* Debug */ if (debugLong) console.log(`Comment #${commentCount} text: ${comment.data.text}`)
        const cardCommenter = (comment.memberCreator.id == '63af5585aa367c01b737a99a') ? '' : `  *(${comment.memberCreator.fullName})*`
        printSumsEmbed.addFields(
            { name: `__Comment #${commentCount++}__${cardCommenter}`, value: `${comment.data.text}` }
        )
    }

    interaction.reply({ content: `<@${interaction.member.id}> requested a list of comments for this card.`, embeds: [printSumsEmbed] })
}

async function confirmationMessage(source, customId, ephemeral, label, messageContent) {
    const confirmationComponents = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
        new ButtonBuilder()
            .setCustomId(customIdArray.cancelButton)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❎'/*❌*/)
    )
    source.reply({ content: messageContent, components: [confirmationComponents], ephemeral: ephemeral/*(customId == customIdArray.moveCardToAuto)*/ })
}

async function getSBStartLink() { return `https://discord.com/channels/${guildId}/${'825978424798478336'/*SRP starboard channel id*/}/` }
//async function getSBStartLink(message) { return `https://discord.com/channels/${message.guild.id}/${/*channelIdArray.starboardId*/}/` }

async function confirmSummary(message, repliedToMessage) { // used by messageCreate.js
    if (message.content.includes(`${await getSBStartLink(/*message*/)}`)) {
        if (repliedToMessage.embeds[0].title.includes('[Unlinked]')) {
            await confirmationMessage(message, customIdArray.confirmSBLink, false, 'Submit Starboard Link', 
                'This reply contains a link to a discord message.  Would you like to set this link as the Link to the Starboard Post?  **Summaries cannot contain links to discord messages if the trello card does not link to a starboard post.**  *To add a summary with a discord link, you must add a starboard link __first__.  If necessary, add the summary manually via Trello.*')
        } else await confirmationMessage(message, customIdArray.confirmSummary, false, 'Submit Summary', 'This Trello card is already linked to a starboard post.  Would you like to submit this reply as a summary to the Trello card instead?')
    } else await confirmationMessage(message, customIdArray.confirmSummary, false, 'Submit Summary', 'Would you like to submit this reply as a summary to the Trello card?')
}

async function addSBLink(interaction, message, repliedToMessage) {
    const suggModId = await getConfigValue('suggModId')

    if (message.channelId == /*channelIdArray.*/suggModId) {
        const SBMessageId = message.content.split(`${await getSBStartLink(/*message*/)}`)[1].substring(0, 18).trim()
        /* Debug */ if (debug) console.log('SBMessageId: ', SBMessageId)

        const cardId = repliedToMessage.embeds[0].footer.text
        /* Debug */ if (debug) console.log('cardId: ', cardId);

        if (await cardIsNotArchived(cardId) != false) {
            message.reply(failureMessage('Failed to add starboard link', `cardNotFound-${cardId}`, null))
            return
        }

        // Add Starboard Link
        const sbLink = `${await getSBStartLink()}${SBMessageId}`
        const wasError = await putTrello('cards', `${cardId}/attachments?name=${'Link to Starboard Post [Discord]'}&url=${sbLink}`, debug, 'PSaddSBLink', true)   
        if (!wasError) {
            const suggModEmbedEdited = EmbedBuilder.from(repliedToMessage.embeds[0].toJSON())
            suggModEmbedEdited.setTitle('Starboard Post')
            suggModEmbedEdited.setURL(sbLink/*sourceAttach.url*/)
            await repliedToMessage.edit({ content: `${repliedToMessage.content}`, embeds: [suggModEmbedEdited], components: repliedToMessage.components })
            addApproveComponent(interaction, repliedToMessage, 'addSBLcheckIfReady', true/*checkAfterSBLinkIfCardReady()*/)

            sendLogsEmbed('Linker', 'Starboard Post Linked', message.author.id, message.url, cardId)
            message.reply('Starboard Link added!  ***Be sure to check if the link is valid and correct.**  If it is not, ping a Trello Manager to fix the link on the Card, then refresh the embed.*')
        } else {
            console.log('addSBLink Trello error', wasError);
            if (`${wasError}` == 'Error: The requested resource was not found.') message.reply(failureMessage('Failed to add starboard link', `cardNotFound-${cardId}`, null))
            else message.reply(failureMessage('Failed to add starboard link', wasError, null))
        }

    }    
}

async function shortSummary(interaction, message, repliedToMessage) { // used by interactionCreate.js
    ///* Debug */ if (debug) console.log('message: ', message);
    const suggModId = await getConfigValue('suggModId')

    if (message.channelId == /*channelIdArray.*/suggModId) {
        const shortSum = `**Short summary** - *Written by* ***${message.author.username}*** *${getCurrentDate(true)}*\n${encodeURIComponent(message.content.trim())}`
        const cardId = repliedToMessage.embeds[0].footer.text
        /* Debug */ if (debug) console.log('sS cardId: ', cardId);
        if (await cardIsNotArchived(cardId) != false) {
            message.reply(failureMessage('Failed to add summary', `cardNotFound-${cardId}`, false, null))
            return
        }

        const wasError = await putTrello('cards', `${cardId}/actions/comments?text=${shortSum}`, debug, 'SMUaddComment', true)
        if (!wasError) {
            sendLogsEmbed('Summary', 'Short Summary Written', message.author.id, message.url, cardId)
            message.reply('Summary added!')
        } else {
            if (`${wasError}` == 'Error: The requested resource was not found.') message.reply(failureMessage('Failed to add summary', `cardNotFound-${cardId}`, null))
            else message.reply(failureMessage('Failed to add summary', wasError, null))
        }

        addApproveComponent(interaction, repliedToMessage, 'shortSumcheckIfReady', true) 
    }
}

async function getSelectOptions(file, title, id, placeholder) { // used by getReplyComponents
    const fileSelectionsJson = await JSON.parse(fs.readFileSync(`slashcommands/trello/${file}`))
    const selectOptions = []
    let labelCount = 1
    fileSelectionsJson.labels.forEach(function(label) {
        const labelSMOB = new StringSelectMenuOptionBuilder()
            .setLabel(label.labelName)
            .setDescription(`${title}Label #${labelCount++}`)
            .setValue(label.labelId)
        selectOptions.push(labelSMOB)
    })

    const select = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(id)
                .setPlaceholder(`Select a ${placeholder} to add/remove`)
                .addOptions(selectOptions)
        );
    /* Debug */ if (debugLong) console.log(`${id}Select: [${JSON.stringify(select.toJSON())}]`)
    return select
}

async function getReplyComponents() { // used by updateSuggModMessageLabels
    let replyComponents = []
    const labelSelect = await getSelectOptions('labels.json', '', customIdArray.label, 'Label')
    replyComponents.push(labelSelect)

    const tierSelect = await getSelectOptions('tierLabels.json', 'Tier ', customIdArray.tier, 'Tier')
    const mobSelect = await getSelectOptions('mobLabels.json', 'Mob ', customIdArray.mob, 'Type/Ability')
    replyComponents.push(tierSelect)
    replyComponents.push(mobSelect)
    //}
    const submitButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(customIdArray.submitLabels)
                .setLabel('Submit Label Changes')
                .setStyle(ButtonStyle.Success),
            printSummaries
        ); replyComponents.push(submitButton)
    return replyComponents
}

async function updateSuggModMessageLabels(interaction, selectedNames, labelIdArray, editLabels) { // used by updateSuggModUI
    let component = [defaultComponents]
    if (editLabels) { component = await getReplyComponents() }

    const suggModEmbedEdited = EmbedBuilder.from(interaction.message.embeds[0].toJSON())
    /* Debug */ if (debug) console.log(`length: ${selectedNames.length}, ${labelIdArray.length}`)
    /* Debug */ if (debug) console.log(`selectedNames: [${selectedNames.toString()}]`)
    /* Debug */ if (debug) console.log(`labelIdArray: [${labelIdArray.toString()}]`)
    if (selectedNames[0] == ',') selectedNames = selectedNames.slice(1)
    if (labelIdArray[0] == ',') labelIdArray = labelIdArray.slice(1)
    if (selectedNames.length > 0 && `${selectedNames.toString()}` !== '') {
        suggModEmbedEdited.setFields(
        { name: 'Labels', value: `${selectedNames.join(', ')/*.toString()*/}` },
        { name: 'Label IDs', value: `${labelIdArray.join(',')/*.toString()*/}` }
        )
    } else {
        suggModEmbedEdited.setFields(
            { name: 'Labels', value: 'None' },
            { name: 'Label IDs', value: 'None' }
        )
    }

    if (interaction.customId == customIdArray.submitLabels) {
        suggModEmbedEdited.addFields(
            { name: '*Changes Saved*', value: `*Labels last edited by <@${interaction.member.id}>*, ${getCurrentDate(false)}` }
        )
    } else {
        suggModEmbedEdited.addFields(
            { name: '*Editing in progress*', value: `*Labels currently being edited by <@${interaction.member.id}> (last edit ${getCurrentDate(false)})*` }
        )
    }
    
    await interaction.update({ content: `${interaction.message.content}`, embeds: [suggModEmbedEdited], components: component })
    if (interaction.customId == customIdArray.submitLabels && !editLabels) addApproveComponent(interaction, interaction.message, 'updateLabelscheckIfReady', true)   
    return
}

async function updateSuggModUI(interaction) { // used by interactionCreate.js
    const suggModId = await getConfigValue('suggModId')

    if (interaction.channelId !== /*channelIdArray.*/suggModId) return
        let selectedNames = interaction.message.embeds[0].fields[0].value.replace('?,', '').replace('?', '').replace('None', '').replace('None,', '').split(', ')
        let labelIdArray = interaction.message.embeds[0].fields[1].value.replace('?,', '').replace('?', '').replace('None', '').replace('None,', '').split(',')
        if (labelIdArray.toString().substring(0, 1) == ',') labelIdArray = labelIdArray.toString().substring(1).split(',')
        if (selectedNames.toString().substring(0, 1) == ',') selectedNames = selectedNames.toString().substring(1).split(',')
        /* Debug */ if (debug) console.log(`selectedNames u1: ${selectedNames.toString()}`)
        /* Debug */ if (debug) console.log(`labelIdArray u1: ${labelIdArray.toString()}`)
    if (interaction.isButton()) {
    if (interaction.customId == customIdArray.editLabels) {
        await updateSuggModMessageLabels(interaction, selectedNames, labelIdArray, true)
    } else if (interaction.customId == customIdArray.submitLabels) {
        /* Debug */ if (debug) console.log(`Submitted Labels: ${labelIdArray.toString()}`)
        const cardId = interaction.message.embeds[0].footer.text
        if (labelIdArray.length > 0 && `${selectedNames.toString()}` !== '' && `${selectedNames.toString()}` !== '?' && `${selectedNames.toString()}` !== 'None') {
            if (await cardIsNotArchived(cardId) != false) {
                interaction.message.reply(failureMessage('Failed to submit labels', `cardNotFound-${cardId}`, interaction.member.id))
                await updateSuggModMessageLabels(interaction, ['?'], ['?'], false)
                return
            }

            const wasError = await putTrello('cards', `${cardId}?idLabels=${labelIdArray.join(',')}`, debug, 'SMUsubmitLabels', false)
            
            if (!wasError) {
                sendLogsEmbed('Editor', 'Labels Edited', interaction.member.id, interaction.message.url, cardId)
                await updateSuggModMessageLabels(interaction, selectedNames, labelIdArray, false)
            } else {
                interaction.message.reply(failureMessage('Failed to submit labels', 'HTTP Error.', interaction.member.id))
                await updateSuggModMessageLabels(interaction, ['?'], ['?'], false)
            }
        } else {
            try {
                const cardObjectJson = await getTrelloJson('cards', `${cardId}`, debug, 'SMUgetCard1')

                let labelNameFailArray = []
                let labelIdFailArray = []
                for(const label of cardObjectJson.labels) {
                    labelNameFailArray.push(label.name)
                    labelIdFailArray.push(label.id)
                }
                await updateSuggModMessageLabels(interaction, labelNameFailArray, labelIdFailArray, true)
            } catch (error) {
                console.log(error)
                await updateSuggModMessageLabels(interaction, ['?'], ['?'], true)
            }
            interaction.message.reply(failureMessage('Failed to submit labels', 'You must apply at least one label.', interaction.member.id))
        }
    }}
    else if (interaction.isStringSelectMenu()) {
    const value = interaction.values[0]
    const label = interaction.component.options.find(labelObj => labelObj.value == value).label
    /* Debug */ if (debug) console.log(`Interaction: ${label}, ${value}`)
    if (labelIdArray.includes(value)) { 
        /* Debug */ if (debug) console.log(`Spliced - ${label}, ${value}`)
        labelIdArray.splice(labelIdArray.indexOf(value), 1)
        selectedNames.splice(selectedNames.indexOf(label), 1)
    } else { 
        /* Debug */ if (debug) console.log(`Pushed - ${label}, ${value}`)
        labelIdArray.push(value)
        selectedNames.push(label)
    }

    /* Debug */ if (debug) console.log(`selectedIds: ${labelIdArray.toString()}`)
    /* Debug */ if (debug) console.log(`selectedNames: ${selectedNames.toString()}`)

    await updateSuggModMessageLabels(interaction, selectedNames, labelIdArray, true)

    }
}

async function sendSuggModMessage(source, card, isCard, image, starboardMessageUrl, methodId) {
    if (!isCard) card = await getTrelloJson('cards', `${card}`, debug, 'SMUgetCard2')

    const cardAttachments = await getTrelloJson('cards', `${card.id}/attachments`, debug, 'SMUgetCardAttachments')
    /* Debug */ if (debug) console.log(`Card ${card.id} has ${cardAttachments.length} attachments`)
    let sbLinkAlreadyRetrieved = false
    for (let i = cardAttachments.length - 1; i > 0; i--) {//for (const attachment of cardAttachments) {
        const attachment = cardAttachments[i]
        if (!sbLinkAlreadyRetrieved && attachment.url.includes('https://discord.com/channels')) { 
            sbLinkAlreadyRetrieved = true; starboardMessageUrl = attachment.url }
    }
    let imageAlreadyRetrieved = false
    if (image == undefined) { for (let i = cardAttachments.length - 1; i > 0; i--) {//for (const attachment of cardAttachments) {
        const attachment = cardAttachments[i]
        /* Debug */ if (debug) console.log(`URL for attachment: ${attachment.url}`)
        if (!imageAlreadyRetrieved && attachment.url.includes(`https://trello.com/1/cards/${card.id}/attachments`)) { 
            imageAlreadyRetrieved = true;  image = attachment }
    }}

    let cardLabelNames = []
    let cardLabelIDs = []
    for (const label of card.labels) {
        cardLabelNames.push(label.name)
        cardLabelIDs.push(label.id)
    }

    let suggModEmbed = new EmbedBuilder()
    suggModEmbed.setColor(0xffc20d)
    suggModEmbed.setTitle('Starboard Post')
    suggModEmbed.setAuthor({ name: 'Trello Card Link', url: card.shortUrl })
    if (starboardMessageUrl !== undefined) suggModEmbed.setURL(starboardMessageUrl)
    else suggModEmbed.setTitle('Starboard Post [Unlinked]')
    suggModEmbed.setFooter({ text: card.id })
    if (image !== undefined) suggModEmbed.setThumbnail(image.url)
    suggModEmbed.setDescription(`Title: __${card.name}__`)
    if (cardLabelIDs.length > 0) {
        suggModEmbed.addFields(
            { name: 'Labels', value: `${cardLabelNames.join(', ')}` },
            { name: 'Label IDs', value: `${cardLabelIDs.join(',')}` }
        )
    } else {
        suggModEmbed.addFields(
            { name: 'Labels', value: 'None' },
            { name: 'Label IDs', value: 'None' }
        )
    }
    if (methodId == 'postStarboard' ) {
        const rolePingId = await getConfigValue('rolePingId')
        const suggModChannel = await /*channelIdArray.*/getChannel("suggModChannel")
        await suggModChannel.send({ content: `<@&${rolePingId}> A suggestion has reached the starboard!  It requires a __short summary__ so the devs can evaluate it easier.\n*Reply to this message with a __short summary__ of the suggestion.*`, 
            embeds: [suggModEmbed], components: [defaultComponents] })
    } else if (methodId == 'refreshMethod') {
        suggModEmbed.addFields(
            { name: '*Changes Saved*', value: `*Embed last refreshed by <@${source.member.id}>*, ${getCurrentDate(false)}` }
        )
        await source.update({ content: source.message.content, embeds: [suggModEmbed], components: [defaultComponents]/*source.message.components*/ })
    } else if (methodId == 'prepcard') {
        source.reply({ content: `This Trello card requires a __short summary__ and a link to its __starboard post__ so the devs can evaluate it easier.\n*Reply to this message with a __short summary__ of the suggestion, or with a __message link to the starboard post__.*`, 
            embeds: [suggModEmbed], components: [defaultComponents] })
    } else if (methodId == 'expandCard') {
        suggModEmbed.addFields(
            { name: '*Changes Saved*', value: `*Embed last refreshed by <@${source.member.id}>*, ${getCurrentDate(false)}` }
        )
        await source.update({ content: 'This suggestion has already been given a starboard link and at least one summary.  You may still give it summaries, so the devs have more to work with.  *Reply to this message with a __short summary__ of the suggestion.*'
            , embeds: [suggModEmbed], components: [defaultComponents] })
    } else if (methodId == 'prepcard2') {
        source.reply({ content: `This specific Trello card was retrieved by link.  It *may* require a __short summary__ and a link to its __starboard post__.\n*Reply to this message with a __short summary__ of the suggestion, or with a __message link to the starboard post__, if it doesn't already have one.*`, 
            embeds: [suggModEmbed], components: [defaultComponents] })
    }
}

module.exports = {
    shortSummary,
    updateSuggModUI,
    debug,
    confirmSummary,
    sendSuggModMessage,
    addSBLink,
    printShortSummaries,
    confirmMoveCardToAuto,
    moveCardToAutoList,
    checkIfUnreadCardIsReady,
    refreshSuggModUI,
    collapseCard,
    failureMessage,
    cardIsNotArchived,
    getCurrentDate
}