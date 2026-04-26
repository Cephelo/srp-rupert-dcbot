const fs = require("fs")

// CONFIG //
const isDev = true
const debug = false

// DO NOT CHANGE
const reloadValueIDs = {
    requiredStars: 'requiredStars',//25 (isDev 1)
    mobLC: 'mobLabelColor',//purple
    tierLC: 'tierLabelColor',//orange_dark
    noteLC: 'noteLabelColor',//green
    guildChecksug: 'suggestionsChannelID',//undefined
    guildCheckstr: 'starboardChannelID',//825978424798478336
    guildChecklog: 'suggLogChannelID',//undefined
    guildCheckmod: 'suggModChannelID',//898020642933313616
    guildCheckdev: 'devReviewChannelID',//undefined
    rolePingId: 'rolePingID', //undefined
    listIDsauto: 'autoListID',//63abbb3cba0fb301ab83553c
    listIDsapproved: 'approvedListID',//647e8cfa4cc634fe48c387c0
    listIDsunread: 'unreadListID',//6323255ccd99c502f0caca37
    listIDsunreadPC: 'unreadPCListID',//6323255ccd99c502f0caca38
    listIDstbd: 'tbdListID',//632325992bc5fb02b052bf75
    listIDstbdPC: 'tbdPCListID',//632325ba4d289801b8a909df
    listIDsaccepted: 'acceptedListID',//632325cd0df9e2003d48802e
    listIDsacceptedPC: 'acceptedPCListID',//632325d839156b0149815129
    listIDsdenied: 'deniedListID',//63c22a70744e460111aa9f3b
    listIDsrecycled: 'recycledListID',//63c22a70744e460111aa9f38
    listIDsinTheMod: 'inTheModListID',//632325e8db8b750163f47c4a
    listIDsinTheModPC: 'inTheModPCListID',//63b07ba2a63cd0004a9aafc6
    listIDsbeingWorkedOn: 'beingWorkedOnListID',//632325e2a77704007e905f98
    listIDsbeingWorkedOnPC: 'beingWorkedOnPCListID',//63b0646449fbdd0d6e46fc74
}
// DO NOT CHANGE

let requiredStars = getValueFromJson(reloadValueIDs.requiredStars)

require("dotenv").config()

let mobLC = getValueFromJson(reloadValueIDs.mobLC)//'purple'
let tierLC = getValueFromJson(reloadValueIDs.tierLC)//'orange_dark'
let noteLC = getValueFromJson(reloadValueIDs.noteLC)//'green'
// LC stands for label color

const guildId = process.env.SERVER_ID

let guildCheck = { // channel IDs
    sug: isDev ? '1057084987314294884'/*DEV*/ : getValueFromJson(reloadValueIDs.guildChecksug),//'undefined'/*SRP*/, // suggestionsId
    str: isDev ? '1057460463442591794'/*DEV*/ : getValueFromJson(reloadValueIDs.guildCheckstr),//'825978424798478336'/*SRP*/, // starboardId
    log: isDev ? '1067292847499390986'/*DEV*/ : getValueFromJson(reloadValueIDs.guildChecklog),//'undefined'/*SRP*/, // logsId
    mod: isDev ? '1067292884698677278'/*DEV*/ : getValueFromJson(reloadValueIDs.guildCheckmod),//'898020642933313616'/*SRP*/, // suggModId
    dev: isDev ? '1118443502125195396'/*DEV*/ : getValueFromJson(reloadValueIDs.guildCheckdev)//'undefined'/*SRP*/, // devReviewId
}

async function retrieveChannel(client, id) {
    if (client == undefined) {
        /* Debug */ if (debug) console.log('CLIENT UNDEFINED')
        return undefined
    } else {
        const channel = await client.channels.cache.get(id)
        /* Debug */ if (debug) console.log(`CLIENT DEFINED - ${id} - ${channel}`)
        return channel 
    }
}

async function setChannels(client) {
    channelIdArray.suggestionsChannel = retrieveChannel(client, guildCheck.sug)
    channelIdArray.starboardChannel = retrieveChannel(client, guildCheck.str)
    channelIdArray.logsChannel = retrieveChannel(client, guildCheck.log)
    channelIdArray.suggModChannel = retrieveChannel(client, guildCheck.mod)
    channelIdArray.devReviewChannel = retrieveChannel(client, guildCheck.dev)
}

let channelIdArray = {
    suggestionsId: guildCheck.sug,
    starboardId: guildCheck.str,
    logsId: guildCheck.log,
    suggModId: guildCheck.mod,
    devReviewId: guildCheck.dev,
    suggestionsChannel: undefined,//getChannel(guildCheck.sug),
    starboardChannel: undefined,//getChannel(guildCheck.str),
    logsChannel: undefined,//getChannel(guildCheck.log),
    suggModChannel: undefined,//getChannel(guildCheck.mod),
    devReviewChannel: undefined,
}

async function getChannel(name) {
    let channelObject = undefined
    if (name == 'suggestionsChannel') channelObject = channelIdArray.suggestionsChannel
    if (name == 'starboardChannel') channelObject = channelIdArray.starboardChannel
    if (name == 'logsChannel') channelObject = channelIdArray.logsChannel
    if (name == 'suggModChannel') channelObject = channelIdArray.suggModChannel
    if (name == 'devReviewChannel') channelObject = channelIdArray.devReviewChannel
    /* Debug */ if (debug) console.log(`getChannel ${name} - ${channelObject}`)
    return channelObject
}//Current files that link to channelObjects: messageReactionAdd, postStarboard, reloadlabels, suggModLog, suggModUpdate, devReview

let rolePingId = isDev ? '1057105842744328282'/*DEV*/ : getValueFromJson(reloadValueIDs.rolePingId)//'undefined'/*SRP*/ // suggestion moderator role id

function hasPermission(interaction, debug) {
    if (!interaction.member.roles.cache.some(role => role.id == rolePingId) && !interaction.member.roles.cache.some(role => role.name === 'Warden') && !interaction.member.permissions.has('MANAGE_GUILD')) {
        interaction.reply({ content: `You do not have permission to use this command.`, ephemeral: true})
        return false
    }
    /* Debug */ if (debug) console.log(`hasPermission channelId: ${interaction.channelId}`)
    if (interaction.channelId !== channelIdArray.suggModId){
        interaction.reply({ content: `You can only use this command in <#${channelIdArray.suggModId}>.`, ephemeral: true})
        return false
    }
    return true
}

// DO NOT CHANGE THESE
const customIdArray = {
    botUserId: process.env.DISCORD_BOT_ID,
    editLabels: 'EditLabels',
    submitLabels: 'SubmitLabels',
    label: 'labelSelect',
    tier: 'tierSelect',
    mob: 'mobSelect',
    cancelButton: 'CancelButtonInteraction',
    deletePrintConfigValues: 'ButtonThatDeletesAPrintConfigValuesMessage',
    confirmSummary: 'ConfirmSummary',
    selectListToSort: 'SortThisList',
    confirmSBLink: 'ConfirmStarboardLink',
    printSummaries: 'PrintShortSums',
    approveCard: 'ApproveCardToMoveLists',
    moveCardToAuto: 'ActuallyMoveCardToAutoList',
    refreshSuggModPost: 'RefeshSuggModPostMessageEmbed',
    collapseSuggModEmbed: 'collapseSuggModEmbedMessage',
    expandSuggModEmbed: 'expandSuggModEmbedMessage',
    //editLabelBlacklist: 'EditLabelBlacklistJson',
    //submitLabelBlacklist: 'SubmitLabelBlacklistJson'
    collapseDRE: 'CollapseDevReviewEmbed',
    expandDRE: 'ExpandDevReviewEmbed',
    refreshDRE: 'ReloadDevReviewEmbed',
    changeDecisionDRE: 'CHANGEMoveCardDevReviewEmbed',
    moveCardDRE: 'MoveCardDevReviewEmbed',
    confirmDecisionDRE: 'AreYouSureDevReviewEmbed',
    cancelButtonDRE: 'CancelButtonInteractionForDREOnly',
    nvmDRE: 'NeverMindImNotGoingToMoveThisCard',
    confirmDevComment: 'ThisWillActuallyPostTheComment',
    detectDevComment: 'ThisWillHappenWhenADevRepliesToTheDRE'
} // DO NOT CHANGE THESE

let listIDs = {
    auto: getValueFromJson(reloadValueIDs.listIDsauto),//'63abbb3cba0fb301ab83553c',
    approved: getValueFromJson(reloadValueIDs.listIDsapproved),//'647e8cfa4cc634fe48c387c0',
    unread: getValueFromJson(reloadValueIDs.listIDsunread),//'6323255ccd99c502f0caca37',
    unreadPC: getValueFromJson(reloadValueIDs.listIDsunreadPC),//'6323255ccd99c502f0caca38',
    tbd: getValueFromJson(reloadValueIDs.listIDstbd),//'632325992bc5fb02b052bf75',
    tbdPC: getValueFromJson(reloadValueIDs.listIDstbdPC),//'632325ba4d289801b8a909df',
    accepted: getValueFromJson(reloadValueIDs.listIDsaccepted),//'632325cd0df9e2003d48802e',
    acceptedPC: getValueFromJson(reloadValueIDs.listIDsacceptedPC),//'632325d839156b0149815129',
    denied: getValueFromJson(reloadValueIDs.listIDsdenied),//'63c22a70744e460111aa9f3b',
    recycled: getValueFromJson(reloadValueIDs.listIDsrecycled),//'63c22a70744e460111aa9f38',
    inTheMod: getValueFromJson(reloadValueIDs.listIDsinTheMod),//'632325e8db8b750163f47c4a',
    inTheModPC: getValueFromJson(reloadValueIDs.listIDsinTheModPC),//'63b07ba2a63cd0004a9aafc6',
    beingWorkedOn: getValueFromJson(reloadValueIDs.listIDsbeingWorkedOn),//'632325e2a77704007e905f98',
    beingWorkedOnPC: getValueFromJson(reloadValueIDs.listIDsbeingWorkedOnPC)//'63b0646449fbdd0d6e46fc74'
}

async function getConfigValue(value) {
    let retrievedValue = true
    if (value == 'requiredStars') return requiredStars
    else if (value == 'rolePingId') return rolePingId
    else if (value == 'channelIdArray') return channelIdArray
    else if (value == 'mobLC') return mobLC
    else if (value == 'tierLC') return tierLC
    else if (value == 'noteLC') return noteLC
    else if (value == 'listIDs') return listIDs
    else if (value == 'suggestionsId') return channelIdArray.suggestionsId
    else if (value == 'devReviewId') return channelIdArray.devReviewId 
    else if (value == 'starboardId') return channelIdArray.starboardId
    else if (value == 'suggModId') return channelIdArray.suggModId
    else if (value == 'autoListId') return listIDs.auto
    else {
        retrievedValue = false
        console.log(`FAILED TO GET CONFIG VALUE; value ${value} does not match!`)
    }
    /* Debug */ if (debugLong) {
        if (retrievedValue) console.log('Config value retrieved successfully.')
        else console.log(`Failed to retrieve config value - value ${value} does not match!`)
    }
}

function getValueFromJson(inputID) {
    const fileJson = JSON.parse(fs.readFileSync('slashcommands/trello/keyConfigJson.json')) // const fileJson = require('./keyConfigJson.json')
    const returnVariable = fileJson[inputID]
    /* Debug */ if (debug) console.log(`getValueFromJson.${inputID} = ${returnVariable}`)
    return returnVariable
}

function reloadVariablesFromJson(inputID, interaction, optionName) {
    let changedValue = true
    const changedVariable = getValueFromJson(inputID)
    if (inputID == reloadValueIDs.requiredStars) requiredStars = changedVariable
    else if (inputID == reloadValueIDs.mobLC) mobLC = changedVariable
    else if (inputID == reloadValueIDs.tierLC) tierLC = changedVariable
    else if (inputID == reloadValueIDs.noteLC) noteLC = changedVariable
    else if (inputID == reloadValueIDs.rolePingId) rolePingId = changedVariable
    else if (inputID == reloadValueIDs.listIDsauto) listIDs.auto = changedVariable
    else if (inputID == reloadValueIDs.listIDsapproved) listIDs.approved = changedVariable
    else if (inputID == reloadValueIDs.listIDsunread) listIDs.unread = changedVariable
    else if (inputID == reloadValueIDs.listIDsunreadPC) listIDs.unreadPC = changedVariable
    else if (inputID == reloadValueIDs.listIDstbd) listIDs.tbd = changedVariable
    else if (inputID == reloadValueIDs.listIDstbdPC) listIDs.tbdPC = changedVariable
    else if (inputID == reloadValueIDs.listIDsaccepted) listIDs.accepted = changedVariable
    else if (inputID == reloadValueIDs.listIDsacceptedPC) listIDs.acceptedPC = changedVariable
    else if (inputID == reloadValueIDs.listIDsdenied) listIDs.denied = changedVariable
    else if (inputID == reloadValueIDs.listIDsrecycled) listIDs.recycled = changedVariable
    else if (inputID == reloadValueIDs.listIDsinTheMod) listIDs.inTheMod = changedVariable
    else if (inputID == reloadValueIDs.listIDsinTheModPC) listIDs.inTheModPC = changedVariable
    else if (inputID == reloadValueIDs.listIDsbeingWorkedOn) listIDs.beingWorkedOn = changedVariable
    else if (inputID == reloadValueIDs.listIDsbeingWorkedOnPC) listIDs.beingWorkedOnPC = changedVariable
    else if (inputID == reloadValueIDs.guildChecksug) {
        guildCheck.sug = changedVariable
        channelIdArray.suggestionsId = guildCheck.sug
        channelIdArray.suggestionsChannel = retrieveChannel(interaction.client, guildCheck.sug)
    }
    else if (inputID == reloadValueIDs.guildCheckstr) {
        guildCheck.str = changedVariable
        channelIdArray.starboardId = guildCheck.str
        channelIdArray.starboardChannel = retrieveChannel(interaction.client, guildCheck.str)
    }
    else if (inputID == reloadValueIDs.guildChecklog) {
        guildCheck.log = changedVariable
        channelIdArray.logsId = guildCheck.log
        channelIdArray.logsChannel = retrieveChannel(interaction.client, guildCheck.log)
    }
    else if (inputID == reloadValueIDs.guildCheckmod) {
        guildCheck.mod = changedVariable
        channelIdArray.suggModId = guildCheck.mod
        channelIdArray.suggModChannel = retrieveChannel(interaction.client, guildCheck.mod)
    }
    else if (inputID == reloadValueIDs.guildCheckdev) {
        guildCheck.dev = changedVariable
        channelIdArray.devReviewId = guildCheck.dev
        channelIdArray.devReviewChannel = retrieveChannel(interaction.client, guildCheck.dev)
    }
    else {
        changedValue = false
        console.log(`FAILED TO RELOAD VALUE; inputID ${inputID} does not match!`)
    }
    if (changedValue) interaction.editReply(`Successfully changed "${optionName}" to \`${changedVariable}\`.`)
    else interaction.editReply(`Failed to change "${optionName}" to ${changedValue} - inputID "${inputID}" does not match!`)
}

// target == cards / lists / labels / boards / 
async function getTrelloJson(target, args, debugResOK, flag) {
    //console.log(`ATTEMPTED GETLINK: https://api.trello.com/1/${target}/${args}${(args.includes('?')?'&':'?')}key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_OAUTH_TOKEN} : CLOSE`)
    const fetchJson = await fetch(`https://api.trello.com/1/${target}/${args}${(args.includes('?')?'&':'?')}key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_OAUTH_TOKEN}`)
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! (${flag}) Status: ${response.status}`);
        } else if (debugResOK) console.log(`Response OK! (${flag})`)
        return response;
    }).catch(err => console.error(err))

    let fileJson = undefined
    try {
        fileJson = await fetchJson.json()
        //* Debug */ if (debug) console.log(`fileJson (${flag}): ${JSON.stringify(fileJson)}`)
    } catch (error) {
        console.log(`Error parsing JSON (${flag})`)
        console.log(error)
    }
    return fileJson
}

async function putTrello(target, args, debugResOk, flag, postNotPut) {
    let wasError = false
    //console.log(`ATTEMPTED LINK: https://api.trello.com/1/${target}${target.includes('?')?'':'/'}${args}${target.includes('?')||args.includes('?')?'&':'?'}key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_OAUTH_TOKEN} : CLOSE`.toString())
    await fetch(`https://api.trello.com/1/${target}${target.includes('?')?'':'/'}${args.replaceAll('\n','%0A')}${target.includes('?')||args.includes('?')?'&':'?'}key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_OAUTH_TOKEN}`, {
        method: postNotPut ? 'POST' : 'PUT',
    }).then((response) => {
        if (flag == 'PScreateCard_DONT_CHANGE_THIS') wasError = response // So postStarboard.js can have the card's id when created, if it works
        if (!response.ok) {
            wasError = response.text()//true
            throw new Error(`HTTP error! (${flag}) Status: ${response.status}`);
        } else if (debugResOk) console.log(`Response OK! (${flag})`)
        //return response;
    }).catch(err => {
        console.error(err)
        wasError = err
    })
    return wasError
}

module.exports = {
    // mobLC,
    // tierLC,
    // noteLC,
    // channelIdArray,
    customIdArray,
    // rolePingId,
    fs,
    getTrelloJson,
    putTrello,
    // listIDs,
    setChannels,
    guildId,
    getChannel,
    hasPermission,
    // requiredStars,
    isDev,
    reloadVariablesFromJson,
    reloadValueIDs,
    getConfigValue
}

// These lists are outdated.
// Events using channelIdArray: threadCreate/Delete/Update, messageReactionAdd, channelUpdate
// Execs using channelIdArray: reloadlabels, postStarboard, suggModLog
// customIdArray used by: interactionCreate, postStarboard