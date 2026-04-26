const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getConfigValue, getChannel, getTrelloJson, putTrello, customIdArray} = require('./keyConfig.js')
const { failureMessage, cardIsNotArchived, getCurrentDate } = require('./suggModUpdate.js')

const debug = true
const debugResOK = false
const debugLong = false

const changeDecisionButton = new ButtonBuilder() // Change Decision button
    .setCustomId(customIdArray.changeDecisionDRE)
    .setLabel('Change Decision')
    .setStyle(ButtonStyle.Primary)

const refreshDREButton = new ButtonBuilder() // Refresh button
    .setCustomId(customIdArray.refreshDRE)
    .setLabel('Refresh Embed')
    .setStyle(ButtonStyle.Secondary)

const collapseDREButton = new ButtonBuilder() // Collapse button
    .setCustomId(customIdArray.collapseDRE)
    .setLabel('Collapse Embed')
    .setStyle(ButtonStyle.Secondary)

const defaultComponents = new ActionRowBuilder()
.addComponents(changeDecisionButton, refreshDREButton, collapseDREButton)

const nvmDREButton = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder() // Never Mind button
        .setCustomId(customIdArray.nvmDRE)
        .setLabel('Never Mind')
        .setStyle(ButtonStyle.Danger)
);

const expandDRE = new ActionRowBuilder() // Expand button
.addComponents(
    new ButtonBuilder()
        .setCustomId(customIdArray.expandDRE)
        .setLabel('Expand')
        .setStyle(ButtonStyle.Secondary)
);

const awaitingDRE = new ActionRowBuilder() // Awaiting button
.addComponents(
    new ButtonBuilder()
        .setCustomId('awaitingDRE')
        .setLabel('Awaiting move confirmation...')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
);


async function hasDevPermission(interaction) {
    const devReviewId = await getConfigValue('devReviewId')

    if (!interaction.member.roles.cache.some(role => role.name === 'Dev' || role.name === 'Author') && !interaction.member.permissions.has('MANAGE_GUILD')) {
        interaction.reply({ content: `You do not have permission to use this.`, ephemeral: true})
        return false
    }
    //* Debug */ if (debug) console.log(`hasDevPermission channelId: ${interaction.channelId}`)
    if (interaction.channelId !== /*channelIdArray.*/devReviewId){
        interaction.reply({ content: `You can only use this in <#${/*channelIdArray.*/devReviewId}>.`, ephemeral: true})
        return false
    }
    return true
}

async function changeDecisionDRE(interaction) {
    if (await hasDevPermission(interaction) == false) return

    const listIDs = await getConfigValue('listIDs')
    const listAccepted = new StringSelectMenuOptionBuilder()
        .setLabel('Accepted Suggestions').setValue(listIDs.accepted)
        .setDescription('This suggestion is accepted. (Non-Mob suggestions only)')
    const listAcceptedPC = new StringSelectMenuOptionBuilder()
        .setLabel('Accepted Parasite Concepts').setValue(listIDs.acceptedPC)
        .setDescription('This suggestion is accepted. (Mob suggestions only)')
    const listDenied = new StringSelectMenuOptionBuilder()
        .setLabel('Denied Suggestions').setValue(listIDs.denied)
        .setDescription('This suggestion is denied.')
    const listRecycled = new StringSelectMenuOptionBuilder()
        .setLabel('Recycled Suggestions').setValue(listIDs.recycled)
        .setDescription("Cool idea, but we're going to use it differently. / Something similar is already in the mod.")
    const listInTheMod = new StringSelectMenuOptionBuilder()
        .setLabel('Suggestions in the mod').setValue(listIDs.inTheMod)
        .setDescription('We have put this exact suggestion in the mod. (Non-Mob suggestions only)')
    const listInTheModPC = new StringSelectMenuOptionBuilder()
        .setLabel('Parasite Concepts in the mod').setValue(listIDs.inTheModPC)
        .setDescription('We have put this exact suggestion in the mod. (Mob suggestions only)')
    const listBeingWorkedOn = new StringSelectMenuOptionBuilder()
        .setLabel('Suggestions being worked on').setValue(listIDs.beingWorkedOn)
        .setDescription('This exact suggestion is currently being worked on. (Non-Mob suggestions only)')
    const listBeingWorkedOnPC = new StringSelectMenuOptionBuilder()
        .setLabel('Parasite Concepts being worked on').setValue(listIDs.beingWorkedOnPC)
        .setDescription('This exact suggestion is currently being worked on. (Mob suggestions only)')
    const listDelayed = new StringSelectMenuOptionBuilder()
        .setLabel('Wait until later').setValue(listIDs.approved)
        .setDescription('We will review this suggestion again later.')

    const selectDecision = new ActionRowBuilder()
    .addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customIdArray.confirmDecisionDRE)
            .setPlaceholder(`Select where to move this card`)
            .addOptions([listAccepted, listAcceptedPC, listDenied, listRecycled, listDelayed, listBeingWorkedOn, listBeingWorkedOnPC, listInTheMod, listInTheModPC])
    );

    interaction.message.edit({ content: interaction.message.content, embeds: interaction.message.embeds, components: [selectDecision, nvmDREButton] })
    refreshDRE(interaction, false)
}
function defaultMessage(interaction) {
    interaction.update({ content: interaction.message.content, embeds: interaction.message.embeds, components: [defaultComponents] })
}

async function confirmDecisionDRE(interaction) {
    const listIDs = await getConfigValue('listIDs')

    if (await hasDevPermission(interaction) == false) return
    if (interaction.customId == customIdArray.nvmDRE) { defaultMessage(interaction); return }
    const value = interaction.values[0]
    const label = interaction.component.options.find(labelObj => labelObj.value == value).label
    /* Debug */ if (debug) console.log(`StringSelected: ${label}, ${value}`)
    if (value == listIDs.approved) { 
        defaultMessage(interaction)
        interaction.message.reply(`Decision for card ${interaction.message.embeds[0].footer.text} has been postponed.${interaction.message.pinned ? '  Message unpinned.':''}  *To shrink the embed, click 'Collapse Embed'.*`)
        if (interaction.message.pinned) interaction.message.unpin('Card has been given a decision (Wait until later).')
        return 
    }
    interaction.message.edit({ content: interaction.message.content, embeds: interaction.message.embeds, components: [awaitingDRE] })
    const confirmationComponents = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId(customIdArray.moveCardDRE).setLabel('Move Card')
            .setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder()
            .setCustomId(customIdArray.cancelButtonDRE).setLabel('Cancel')
            .setStyle(ButtonStyle.Danger).setEmoji('❎'/*❌*/)
    )
    let infoEmbed = new EmbedBuilder()
    infoEmbed.setDescription(`Destination: "${label}" *(${value})*`)
    interaction.reply({ content: `Are you sure you want to move this card to the "${label}" list?  This can be changed this later.`,
        embeds: [infoEmbed], components: [confirmationComponents], ephemeral: true })
}

async function cancelButtonDRE(interaction, repliedToMessage) {
    interaction.deferUpdate().then(interaction.deleteReply())
    repliedToMessage.edit({content: repliedToMessage.content, embeds: repliedToMessage.embeds, components: [defaultComponents]})
    await refreshDRE(repliedToMessage, true)
}

async function moveCardDREMethod(interaction, repliedToMessage) {
    const destination = interaction.message.embeds[0].description.split('(')[1].split(')')[0]
    const listName = interaction.message.embeds[0].description.split('"')[1]
    const cardId = repliedToMessage.embeds[0].footer.text
    /* Debug */ if (debug) console.log(`moveCDREM values: ${destination}, ${listName}, ${cardId}`)
    interaction.deferUpdate().then(interaction.deleteReply())
    const notMoved = await putTrello('cards', `${cardId}?idList=${destination}`, debug, 'DRmoveCardToDestination', false)
    if (!notMoved) {
        repliedToMessage.reply(`Card ${cardId} moved to "${listName}" *(${destination})*.${repliedToMessage.pinned ? '  Message unpinned.':''}  *To shrink the embed, click 'Collapse Embed'.*`)
        if (repliedToMessage.pinned) repliedToMessage.unpin('Card has been given a decision.')
    }
    else repliedToMessage.reply(`Card ${cardId} could not be moved.`)
    await refreshDRE(repliedToMessage, true)
}

async function collapseDREMethod(interaction) {
    if (await hasDevPermission(interaction) == false) return
    const expandedEmbed = interaction.message.embeds[0]

    let collapsedDRE = new EmbedBuilder()
    collapsedDRE.setColor(expandedEmbed.color)
    collapsedDRE.setTitle(expandedEmbed.title)
    collapsedDRE.setAuthor(expandedEmbed.author)
    collapsedDRE.setURL(expandedEmbed.url)
    collapsedDRE.setFooter(expandedEmbed.footer)
    interaction.update({ content: "Click Expand to view this card's info.", embeds: [collapsedDRE], components: [expandDRE] })
}

async function refreshDRE(source, isMessage) {
    const message = isMessage ? source : source.message
    await createDevCardEmbed(source, message.embeds[0].footer.text, (isMessage ? 'editMessage' : 'updateInteraction'))
}

async function confirmDevComment(message) {
    const confirmationComponents = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId(customIdArray.confirmDevComment).setLabel('Post Comment')
            .setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder()
            .setCustomId(customIdArray.cancelButton).setLabel('Cancel')
            .setStyle(ButtonStyle.Danger).setEmoji('❎'/*❌*/)
    )
    message.reply({ content: 'Would you like to submit this reply as a developer comment to the Trello card?', components: [confirmationComponents]/*, ephemeral: true*/ })
}

async function devComment(message, repliedToMessage) { // used by interactionCreate.js
    ///* Debug */ if (debug) console.log('message: ', message);
    const devReviewId = await getConfigValue('devReviewId')

    if (message.channelId == /*channelIdArray.*/devReviewId) {
        const shortSum = `**Developer Comment** - *Written by* ***${message.author.username}*** *${getCurrentDate(true)}*\n${encodeURIComponent(message.content.trim())}`
        const cardId = repliedToMessage.embeds[0].footer.text
        /* Debug */ if (debug) console.log('dC cardId: ', cardId);
        if (await cardIsNotArchived(cardId) != false) {
            message.reply(failureMessage('Failed to add comment', `cardNotFound-${cardId}`, false, null))
            return
        }

        const wasError = await putTrello('cards', `${cardId}/actions/comments?text=${shortSum}`, debug, 'DRaddComment', true)
        if (!wasError) {
            message.reply('Comment posted!')
            refreshDRE(repliedToMessage, true)
        }
        else {
            if (`${wasError}` == 'Error: The requested resource was not found.') message.reply(failureMessage('Failed to post dev comment', `cardNotFound-${cardId}`, null))
            else message.reply(failureMessage('Failed to post dev comment', wasError, null))
        }
    }
}

async function chooseRandomApprovedCard(interaction) {
    const listIDs = await getConfigValue('listIDs')
    const approvedList = await getTrelloJson('lists', `${listIDs.approved}/cards`, debugResOK, 'DRgetListCards')
    
    if (approvedList.length == 0) {
        interaction.reply('There are currently no cards ready for review.')
        const suggModChannel = await /*channelIdArray.*/getChannel("suggModChannel")
        await suggModChannel.send(`<@&${await getConfigValue('rolePingId')}> There are currently no cards ready for developer review, but a developer has requested one!  Please approve some more cards!`)
        return 
    }

    const chosenCard = Math.floor(Math.random() * approvedList.length)
    /* Debug */ if (debug) console.log(`chosen: ${chosenCard}/${approvedList.length} - card id: ${approvedList[chosenCard].id}`)

    if (`${chosenCard}` == 'NaN' || `${chosenCard}` == 'undefined') return interaction.reply('Failed to retrieve a card.')
    else createDevCardEmbed(interaction, approvedList[chosenCard], 'createEmbed')
}

async function createDevCardEmbed(source, card, methodId) {
    if (methodId != 'createEmbed') card = await getTrelloJson('cards', `${card}`, debug, 'DRgetCard')
    let image = undefined 

    const cardAttachments = await getTrelloJson('cards', `${card.id}/attachments`, debug, 'SMUgetCardAttachments')
    /* Debug */ if (debug) console.log(`Card ${card.id} has ${cardAttachments.length} attachments`)

    let imageAlreadyRetrieved = false
    for (let i = cardAttachments.length - 1; i > 0; i--) {//for (const attachment of cardAttachments) {
        const attachment = cardAttachments[i]
        /* Debug */ if (debug) console.log(`URL for attachment: ${attachment.url}`)
        if (!imageAlreadyRetrieved && attachment.url.includes(`https://trello.com/1/cards/${card.id}/attachments`)) { 
            imageAlreadyRetrieved = true; image = attachment }
    }

    let cardLabelNames = []
    for (const label of card.labels) cardLabelNames.push(label.name)
    const cardList = await getTrelloJson('cards', `${card.id}/list`, debug, 'DRgetListOfCard')

    let devReviewEmbed = new EmbedBuilder()
    devReviewEmbed.setTitle(card.name)
    devReviewEmbed.setURL(card.shortUrl)
    devReviewEmbed.setFooter({ text: card.id })

    const listIDs = await getConfigValue('listIDs')
    /* Debug */ if (debug) console.log(`cardList.id: ${cardList.id}`)
    if (`${cardList.id}` == `${listIDs.approved}`) {
        devReviewEmbed.setAuthor({ name: 'Suggestion requires developer review!' })
        devReviewEmbed.setColor(0x00ffff)
    }
    else if (`${cardList.id}` == `${listIDs.auto}`) {
        devReviewEmbed.setAuthor({ name: 'Suggestion is NOT ready to be reviewed.' })
        devReviewEmbed.setColor(0xffa500)
    }
    else if (`${cardList.id}` == `${listIDs.accepted}` || `${cardList.id}` == `${listIDs.acceptedPC}`) {
        devReviewEmbed.setAuthor({ name: 'Suggestion has been accepted by a developer!' })
        devReviewEmbed.setColor(0x00ff00)
    }
    else if (`${cardList.id}` == `${listIDs.denied}`) {
        devReviewEmbed.setAuthor({ name: 'Suggestion has been denied!' })
        devReviewEmbed.setColor(0xff0000)
    }
    else if (`${cardList.id}` == `${listIDs.approved}`) {
        devReviewEmbed.setAuthor({ name: 'Suggestion has been denied! (recycled)' })
        devReviewEmbed.setColor(0xff0000)
    }
    else {
        devReviewEmbed.setAuthor({ name: `Suggestion Card is currently in list "${cardList.name}"!` })
        devReviewEmbed.setColor(0x0000ff)
    }
    
    if (image !== undefined) devReviewEmbed.setThumbnail(image.url)
    else devReviewEmbed.setThumbnail('https://static.wikia.nocookie.net/scape-and-run-parasites/images/d/dc/SRP_Logo.png/revision/latest')
    
    let cardComments = await getTrelloJson('cards', `${card.id}/actions?filter=commentCard`, debug, 'DRgetCardComments')
    const cardCopiedComments = await getTrelloJson('cards', `${card.id}/actions?filter=copyCommentCard`, debug, 'DRgetCardCopiedComments')
    cardComments = cardComments.concat(cardCopiedComments)

    devReviewEmbed.setDescription(`**Labels**\n${cardLabelNames.size > 0 ? 'None' : cardLabelNames.join(', ')}\n\n${methodId == 'createEmbed' ? 'Info retrieved' : 'Embed last refreshed'} ${getCurrentDate(false)}\n${cardComments.length} commen${(cardComments.length == 1 ? 't' : 'ts')}`)
 
    let commentCount = 1
    for (const comment of cardComments) {//let i = 0; i < cardComments.length || i <= 25; i++) {
        //const comment = cardComments[i]
        /* Debug */ if (debugLong) console.log(`Comment #${commentCount} text: ${comment.data.text}`)
        const cardCommenter = (comment.memberCreator.id == '63af5585aa367c01b737a99a') ? '' : `  *(${comment.memberCreator.fullName})*`
        devReviewEmbed.addFields(
            { name: `__Comment #${commentCount++}__${cardCommenter}`, value: `${comment.data.text}` }
        )
    }

    const messageString = "Trello Card retrieved.  Check the top of the embed for its approval status!\n*Reply to this message to submit your reply as a developer comment on the Trello card!*"
    if (methodId == 'createEmbed' || methodId == 'createEmbedSpecific') {
        await source.reply({ content: messageString, embeds: [devReviewEmbed], components: [defaultComponents] })
        const returnedMessage = await source.fetchReply()
        await returnedMessage.pin('Card still requires a decision.')

        const pinnedMessages = await returnedMessage.channel.messages.fetchPinned()
        const devPinLimit = 40 // Maximum amount of dev editor embeds there can be before they start getting unpinned to make space.
        if (pinnedMessages.size >= devPinLimit) {
            let devMessages = []
            for (pinMes of pinnedMessages) {
                if (`${pinMes[1].author.id}` == customIdArray.botUserId && pinsMes[1].embeds[0] != undefined) devMessages.push(pinMes[1])
            }
            /* Debug */ if (debug) console.log(`Dev channel has ${pinnedMessages.size} pins, and ${devMessages.length} dev messages.`)
            if (devMessages.length > devPinLimit || pinnedMessages.size >= 49) {
                const unpinnedMessage = devMessages.pop()
                await unpinnedMessage.unpin(`Unpinning to make space.  Pin count of dev messages reached ${devPinLimit}, or pin limit is almost at maximum.`)
                unpinnedMessage.reply(`Message unpinned to make space.  Pin count of dev editor messages has reached ${devPinLimit}, or pin limit is almost at maximum.`)
            }
        } else /* Debug */ if (debug) console.log(`Dev channel has ${pinnedMessages.size} pins, and <${devPinLimit} dev messages.`)
    } else if (methodId == 'updateInteraction') {
        await source.update({ content: messageString, embeds: [devReviewEmbed], components: (source.customId == customIdArray.expandDRE ? [defaultComponents] : source.message.components) })
    } else if (methodId == 'editMessage') {
        await source.edit({ content: messageString, embeds: [devReviewEmbed], components: [defaultComponents] })
    }
}

module.exports = {
    chooseRandomApprovedCard,
    changeDecisionDRE,
    collapseDREMethod,
    refreshDRE,
    moveCardDREMethod,
    confirmDecisionDRE,
    cancelButtonDRE,
    hasDevPermission,
    createDevCardEmbed,
    confirmDevComment,
    devComment
}