const { EmbedBuilder } = require("discord.js");
const { getChannel, putTrello, fs, getConfigValue } = require('./keyConfig.js')
const { sendSuggModMessage } = require('./suggModUpdate.js')

const debug = true
const debugLong = false
//const debugStarredMessageIDs = false
const ignoreStarredMessages = true
const keepSuggestionOpen = true
const cutoffTrello = false

async function runPost(message) {
    /* Debug */ if (debug) console.log('REACTION AUTHORIZED')

	const logsChannel = await /*channelIdArray.*/getChannel("logsChannel")
	const starboardChannel = await /*channelIdArray.*/getChannel("starboardChannel")
	
    let starredIds = []
    let idExists = false
    try {
        const fileJson = await JSON.parse(fs.readFileSync('slashcommands/trello/starredMessages.json')) // const fileJson = require('./starredMessages.json')
        /* Debug */ if (debugLong) console.log(`starredMessages.json OLD: ${JSON.stringify(fileJson)}`)
        
        /* Debug */ if (debug) console.log(`Checking for id ${message.id}`)
        if (fileJson.ids.includes(`${message.id}`)) {
            if (!ignoreStarredMessages) {
                /* Debug */ if (debug) console.log(`Message ID ${id} already exists!`)
                idExists = true
            } else /* Debug */ if (debug) console.log(`Message ID ${id} already exists, but ignoreStarredMessages is set to true.`)
        }

        starredIds = fileJson.ids
    } catch (error) {
        /* Debug */ if (debug) console.log(error)
        console.log('starredMessages.json file errored, resetting file.  Errored file sent in Logs channel.')
        await logsChannel.send({ content: 'starredMessages.json file errored, resetting file.  Errored file below.', files: ['events/starredMessages.json'] }) // Send to Log channel
    }
    
    if (idExists) return

    /*if (message.channel.locked) {
        let starFailEmbed = { 
            color: 0xffffff,
            title: message.channel.name,
            url: message.channel.url,
            footer: { text:`${message.channel.id}`},
            description: `Created by <@${message.author.id}>`
        }
        suggModChannel.send({ content: `A suggestion has reached the starboard threshold, but it is locked.  If it is meant to reach the starboard, and was not closed for a good reason, re-open the suggestion and give it a star.  If not, this message can be ignored.`, embeds: [starFailEmbed] })
        return
    }*/

    if (!ignoreStarredMessages) starredIds.push(`${message.id}`)
    let writeJson = '{ "ids": ' + JSON.stringify(starredIds) + '}'
    let writObj = JSON.parse(writeJson)
    /* Debug */ if (debugLong) console.log(`starredMessages.json NEW: ${JSON.stringify(writObj)}`)

    fs.writeFileSync('events/starredMessages.json', JSON.stringify(writObj), (err) => {
        if (err) console.log(err);
        else if (debug) console.log("postStarboard/starredMessages - Data Written!")
    });  

    /* Debug */ if (debug && !ignoreStarredMessages) console.log('Message ID does not exist, added to starredMessages.json')

    const labelsTrelloArray = await JSON.parse(fs.readFileSync('slashcommands/trello/labels.json'))
    let tagNames = []
    let labelIdArray = []
    /* Debug */ if (debug) console.log(`appliedTags: ${message.channel.appliedTags}`)
    message.channel.appliedTags.forEach(function(tagID) {//for (const tagID of message.channel.appliedTags) {
        let matchFound = false
        labelsTrelloArray.labels.forEach(function(label) { //for (let i = 0; i < labelsTrelloArray.labels.length; i++) {//for (const label of labelsTrelloArray.labels) { //labelsTrelloArray.labels.forEach(function(label) { // For every registered label, 
            if (label.tagId == tagID) { // If tag IDs match, 
                labelIdArray.push(label.labelId) // Add label ID to array
                tagNames.push(label.labelName) // Add to tagNames
                matchFound = true
                return
            }
            })
        if (!matchFound) {
            try {
                tagNames.push(`\*${message.channel.parent.availableTags.find(tagObject => tagObject.id === tagID).name}\*`) // Add to tagNames
            } catch (error) {
                 /* Debug */ if (debug) {
                    if (`${error.name}: ${error.message}` == "TypeError: Cannot read properties of undefined (reading 'name')") console.log(`Suggestion ${message.id} has a deleted tag: ${tagID}`)
                    else console.log(error)
                }
            }
        }
    })

    /* Debug */ if (debug) console.log(`Image Count: ${message.attachments.size}`)
    /* Debug */ if (debug) console.log(`Embed Count: ${message.embeds.length}`)
    //* Debug */ if (debug) { console.log('Image Send Attempted'); starboardChannel.send({ files: [message.attachments[0]] }) }

    if (tagNames.length <= 0/* == ""*/) tagNames.push('None')

    let embededImage = undefined
    if (message.attachments.size > 0) {
        /* Debug */ if (debugLong) console.log('PS pI mA0: ' + Array.from(message.attachments)[0][1])
        embededImage = Array.from(message.attachments)[0][1]//message.attachments[0]
    }
    else if (message.embeds.length > 0) {
        /* Debug */ if (debugLong) console.log('PS pI mA0E: ' + Array.from(message.embeds)[0])
        embededImage = Array.from(message.embeds)[0]
    }
    else /* Debug */ if (debug) console.log('No Images Found.')

    // Create Trello Card
    const cardFetchResponse = await putTrello('cards?', `idList=${/*listIDs.auto*/await getConfigValue('autoListId')}&name=${message.channel.name}&pos=bottom&idLabels=${labelIdArray}&desc=${/*
        */`Suggested by **${message.author.username}**, on *${message.createdAt.toString().split('(')[0].trim()}*\n\n${encodeURIComponent(message.content)}`}`
        , debug, 'PScreateCard_DONT_CHANGE_THIS', true)
    let postTrelloFailed = false
    let cardObject = await cardFetchResponse.text()
    cardObject = JSON.parse(cardObject)
    if (cardObject.id) /* Debug */ if (debug) console.log(`CardID - ${cardObject.id}`)
    else {
        logsChannel.send(`<@${process.env.BOT_OWNER_ID}> A suggestion reached the required amount of stars, but a trello card could not be created.  ${message.url}\nError: ${cardObject}`)
        /* Debug */ if (debug) console.log('Card failed to be created, see logs channel.')
        postTrelloFailed = true
    }

    if (postTrelloFailed) return
    
    let starEmbed = new EmbedBuilder()
    starEmbed.setColor(0xffc20d)
    starEmbed.setTitle(message.channel.name)
    starEmbed.setURL(message.url)
    starEmbed.setFooter({text: `${message.id} • Tags: ${tagNames.join(', ')}`})
    starEmbed.setImage(embededImage.url)
    starEmbed.setDescription(`Created by <@${message.author.id}>\n${message.content}`)

    const starboardMessage = await starboardChannel.send({ content: `:sparkles: Congratulations <@${message.author.id}>, your suggestion has made it to the starboard!`, embeds: [starEmbed] })
    /* Debug */ if (debug) console.log(`SBurl: ${starboardMessage.url}`)

    let forumPostEmbed = { 
        color: 0x02aff4,
        title: 'Starboard Post',
        url: starboardMessage.url,
        thumbnail: { url: 'https://cdn.discordapp.com/attachments/852690266757398578/940653326222098442/star.png' },
        description: message.channel.name
    }

    await message.channel.send({ content: `:sparkles: Congratulations ${message.author.username}, your suggestion has made it to the <#${/*channelIdArray.starboardId*/await getConfigValue('starboardId')}>!`, embeds: [forumPostEmbed] })
    await message.channel.send('*This post has been closed and locked automatically, and a Trello card has been created.  Thank you for your suggestion!*')

    if (!keepSuggestionOpen) {
        await message.channel.setLocked(true)
        .then(newThread => console.log(`Post is now ${newThread.locked ? 'locked' : 'unlocked'}`))
        .catch(error => console.log(`Post could not be locked: ${console.error(error)}`));
        await message.channel.setArchived(true)
        .then(newThread => console.log(`Post is now ${newThread.archived ? 'closed' : 'open'}`))
        .catch(error => console.log(`Post could not be closed: ${console.error(error)}`));
    }

    if (cutoffTrello) return

    const starEmbedLinked = EmbedBuilder.from(starboardMessage.embeds[0].toJSON()).setAuthor({ name: 'Trello Card Link', url: cardObject.shortUrl })
    starboardMessage.edit({ embeds: [starEmbedLinked] })

    // Add Starboard Link
    await putTrello('cards', `${cardObject.id}/attachments?name=${'Link to Starboard Post [Discord]'}&url=${starboardMessage.url}`, debug, 'PSaddSBLink', true)   

    // Add Attachments
    let imageCount = 1; let imageURLs = []
    for (const image of message.attachments) imageURLs.push(image[1].url)
    for (const embed of message.embeds) imageURLs.push(embed.url)
    for (const url of imageURLs)  await putTrello('cards', `${cardObject.id}/attachments?name=Image%20%23${imageCount++}&url=${url}&setCover=false`, debug, `PSaddAttachE${imageCount}`, true)   

    // let selectedNamesString = tagNames
    // for (const tagN of tagNameBlacklist) {
    //     /* Debug */ if (debug) console.log(`tagNames ${tagN} search, ${selectedNamesString}`)
    //     selectedNamesString.replace(`, ${tagN}`, '').replace(`${tagN}`, '') // Remove blacklisted tags from tagNames
    //     /* Debug */ if (debug) console.log(`tagNames NEW: ${selectedNamesString}`)
    // }
    // let selectedNames = selectedNamesString.split(', ')
    // /* Debug */ if (debug) console.log(`selectedNames: ${selectedNames.toString()} [${selectedNames.length}] +++ [${tagNames.toString()}]`)

    sendSuggModMessage(message, cardObject.id, false, embededImage, starboardMessage.url, 'postStarboard')
}

module.exports = {
    runPost,
    debug,
}