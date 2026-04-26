const { /*getChannel, */fs, getTrelloJson, hasPermission, getConfigValue } = require('./trello/keyConfig.js')

const debugAddTags = true
const debugScanTags = true

const tagNameBlacklist = [
    //'Mob Suggestion',
]

const run = async (_, interaction) => {
    const mobLC = await getConfigValue('mobLC')
    const tierLC = await getConfigValue('tierLC')
    const noteLC = await getConfigValue('noteLC')
    const suggestionsId = await getConfigValue('suggestionsId')

	//const suggestionsChannel = /*channelIdArray.*/getChannel("suggestionsChannel")
	const suggestionsChannel = interaction.client.channels.cache.get(/*channelIdArray.*/suggestionsId)

    if (!hasPermission(interaction, (debugAddTags || debugScanTags))) return

    const timeStart = new Date()
    try {
        const fileTrelloJson = await getTrelloJson('boards', 'RiQBBFRB/labels', (debugAddTags || debugScanTags), 'RLgetBoardLabels')

        function checkBlacklist(/*labelName, */labelColor) {
            // if (`${labelName}` == 'To Deny') return [false, 'tag']
            // if (`${labelName}` == 'To Recycle') return [false, 'tag']
            // if (`${labelName}` == 'Group') return [false, 'tag']
            if (`${labelColor}` == noteLC) return [false, noteLC]
            if (`${labelColor}` == tierLC) return [false, tierLC]
            if (`${labelColor}` == mobLC) return [false, mobLC]
            return [true, true]
        }

        ///* Debug */ if (debugAddTags) console.log(JSON.stringify(fileTrelloJson))
        let labelArray = []
        let mobLabelArray = []
        let tierLabelArray = []
        let addTags = []
        for (const label of fileTrelloJson) {//fileTrelloJson.forEach(function(label) {
            let tagConst = await suggestionsChannel.availableTags.find(tagObject => tagObject.name === label.name)
            /* Debug */ if (debugAddTags) console.log(` tagConst = ${tagConst}`)
            if (tagConst == undefined) tagConst = { id: undefined, name: undefined }

            /* Debug */ if (debugAddTags) console.log(`1stSearch - labelName: ${label.name}, labelId: ${label.id}, tagName: ${tagConst.name}, tagId: ${tagConst.id}, labelColor: ${label.color}`)
            const isNotBlacklisted = checkBlacklist(/*label.name, */label.color)
            if (isNotBlacklisted[0]) {
                if (tagConst.id == undefined) {
                    /* Debug */ if (debugAddTags) console.log(`Tag ${label.name} does not exist, tag will be added.`)
                    addTags.push(label)
                } else /* Debug */ if (debugAddTags) console.log(`Tag ${label.name} already exists.`)
                labelArray.push(`{ "labelName": "${label.name}", "labelId": "${label.id}", "tagId": "${tagConst.id}" }`)
            } else {
                /* Debug */ if (debugAddTags) console.log(`Tag ${label.name} is blacklisted from labels.json.`)
                if (isNotBlacklisted[1] == mobLC) {
                    /* Debug */ if (debugAddTags) console.log(`Label ${label.name} added to parasiteLabels.json.`)
                    mobLabelArray.push(`{ "labelName": "${label.name}", "labelId": "${label.id}" }`)
                } else if (isNotBlacklisted[1] == tierLC) {
                    /* Debug */ if (debugAddTags) console.log(`Label ${label.name} added to tierLabels.json.`)
                    tierLabelArray.push(`{ "labelName": "${label.name}", "labelId": "${label.id}" }`)
                }
            }
        }//)

        let objMob = JSON.parse('{ "labels": [' + mobLabelArray.toString() + '] }')
        let objTier = JSON.parse('{ "labels": [' + tierLabelArray.toString() + '] }')

        function fetchTagEmoji(labelColor) {
            let emojiName = '⭕️'//'o'//
            if (labelColor == 'red' || labelColor == 'red_light' || labelColor == 'red_dark' ) emojiName = '🔴'//'red_circle'// 🔴🔵🟢🟤🟣🟠🟦🟩🟡🟪⭕️🌑
            if (labelColor == 'orange' || labelColor == 'orange_light' || labelColor == 'orange_dark' ) emojiName = '🟠'//'orange_circle'//
            if (labelColor == 'yellow' || labelColor == 'yellow_light' || labelColor == 'yellow_dark' ) emojiName = '🟡'//'yellow_circle'//
            if (labelColor == 'green' || labelColor == 'green_light' || labelColor == 'green_dark' ) emojiName = '🟢'//'green_circle'//
            if (labelColor == 'lime' || labelColor == 'lime_light' || labelColor == 'lime_dark' ) emojiName = '🔴'//'🟩'//'green_square'//
            if (labelColor == 'sky' || labelColor == 'sky_light' || labelColor == 'sky_dark' ) emojiName = '🟦'//'blue_square'//
            if (labelColor == 'blue' || labelColor == 'blue_light' || labelColor == 'blue_dark' ) emojiName = '🔵'//'blue_circle'//
            if (labelColor == 'purple' || labelColor == 'purple_light' || labelColor == 'purple_dark' ) emojiName = '🟪'//'purple_circle'//
            if (labelColor == 'pink' || labelColor == 'pink_light' || labelColor == 'pink_dark' ) emojiName = '🟣'//'white_circle'//
            if (labelColor == 'black' || labelColor == 'black_light' || labelColor == 'black_dark' ) emojiName = '🌑'//'black_circle'//
            /* Debug */ if (debugAddTags) console.log(`Emoji - ${labelColor}: ${emojiName}`)
            return emojiName
        }

        function objectArrayNames(array) {
            let arrayNames = []
            for (const tag of array) /*array.forEach(function(tag)*/ { arrayNames.push(` ${tag.name}`) }//)
            return arrayNames
        }

        let tagsAdded = "No tags added."
        let tagAddError = false
        //const hasMobSugg = suggestionsChannel.availableTags.some(tagObject => tagObject.name === 'Mob Suggestion')
        if (addTags.length > 0/* || !hasMobSugg*/) {
            
            let tagRecreate = suggestionsChannel.availableTags
            /* Debug */ if (debugAddTags) console.log(`tagRecreate OLD:${objectArrayNames(tagRecreate)}`)

            for (const label of addTags) {//addTags.forEach(function(label) {
                const tagEmoji = fetchTagEmoji(label.color)
                /* Debug */ if (debugAddTags) console.log(`${tagEmoji}`)
                tagRecreate.push({ name: label.name, emoji: {name: tagEmoji } })//, moderated: false, id: '0'
                /* Debug */ if (debugAddTags) console.log(`Added Tag ${label.name}`)
            }//)

            /* Debug */ if (debugAddTags) console.log(`tagRecreate NEW:${objectArrayNames(tagRecreate)}`)
            try {
                await suggestionsChannel.setAvailableTags(tagRecreate)
                /* Debug */ if (debugAddTags) console.log('tags added')
            } catch (error) {
                tagAddError = `${error.name}: ${error.message}`
                console.log(error)
            }

            if (tagAddError == false) {
                tagsAdded = `__Added Tags__:${objectArrayNames(addTags).toString()}`

                for (let i = 0; i < labelArray.length; i++) { // Add tag IDs to labelArray for counterpart output
                    /* Debug */ if (debugAddTags) console.log(`labelArray obj #${i+1} CURRENT: ${labelArray[i]}`)
                    let tagID = `${labelArray[i]}`.split('"tagId": "')[1].split('" }')[0]
                    if (tagID == 'undefined') {
                        const labelName = `${labelArray[i]}`.split('"labelName": "')[1].split('", "labelId":')[0]
                        /* Debug */ if (debugAddTags) console.log(`labelName ${i+1}: ${labelName}`)
                        tagID = suggestionsChannel.availableTags.find(tagObject => tagObject.name === labelName).id
                        labelArray[i] = labelArray[i].replace('undefined',`${tagID}`)
                        /* Debug */ if (debugAddTags) console.log(`labelArray obj #${i} NEW: ${labelArray[i]}`)
                    }
                }
            }
        }

        /* Debug */ let tagNum = 1
        /* Debug */ if (debugAddTags) for (const aTag of suggestionsChannel.availableTags) {//suggestionsChannel.availableTags.forEach(function(aTag, tagNum) {
            console.log(`Available Tag #${tagNum++}: ${aTag.name}, ${aTag.id}, ${aTag.emoji.name}`)
        }//)

        let obj = JSON.parse('{ "labels": [' + labelArray.toString() + '] }')

        ///* Debug */ if (debugAddTags) console.log(JSON.stringify(obj.labels))

        /* Debug */ if (debugAddTags) console.log(`${labelArray.toString()}`)
        /* Debug */ let poop = 1
        /* Debug */ if (debugAddTags) for (const lblO of labelArray) console.log(`#${poop++}: ${lblO}`)

        let tagsNoLabel = "All tags have a label counterpart."
        const debugLabelCounterpartTest = false

        for (const forumTag of suggestionsChannel.availableTags) {
            if (tagNameBlacklist.includes(`${forumTag.name}`)) {
                /* Debug */ if (debugScanTags) console.log(`Skipping Tag "${forumTag.name}"`)
            } else {
                let labelConst = { labelId: undefined, tagId: undefined }//labelArray.find(labelObject => labelObject.tagId == forumTag.id)
                for (const labelObject of labelArray) {//labelArray.forEach(function(labelObject) {
                    const labelId = `${labelObject}`.split('"labelId": "')[1].split('", "tagId": "')[0]
                    const tagId = `${labelObject}`.split('"tagId": "')[1].split('" }')[0]
                    /* Debug */ if (debugLabelCounterpartTest) console.log(`labelConst Data - labelId: ${labelId}, taglId: ${tagId}`)
                    if (tagId == forumTag.id) {
                        /* Debug */ if (debugLabelCounterpartTest) console.log('labelConst - Match Found!')
                        labelConst = { labelId: labelId, tagId: tagId }
                        continue
                    } else /* Debug */ if (debugLabelCounterpartTest) console.log('labelConst - Does Not Match')
                }

                /* Debug */ if (debugScanTags) console.log(`2ndSearch - labelConst(obj): ${labelConst}, labelId: ${labelConst.labelId}, tagId: ${labelConst.tagId}, searchedTag: "${forumTag.name}", searchedTagID: ${forumTag.id}`)
                if (forumTag.id == labelConst.tagId && labelConst.labelId !== undefined) {
                    /* Debug */ if (debugScanTags) console.log(`Tag ${forumTag.name} exists.`)
                } else if (tagAddError !== false && labelConst.labelId == undefined && labelConst.tagId == undefined && forumTag.id == undefined) {
                    if (tagsAdded == "No tags added.") tagsAdded = `__Tags that have NOT been added__: ${forumTag.name}`; else tagsAdded += `, ${forumTag.name}`
                } else if (labelConst.labelId == undefined) { //&& labelConst.tagId !== undefined) {
                    /* Debug */ if (debugScanTags) console.log(`TagID: ${forumTag.id} - TagName: ${forumTag.name}`)
                    if (tagsNoLabel == "All tags have a label counterpart.") tagsNoLabel = `__Tags with no Trello label counterpart__: ${forumTag.name}`
                    else tagsNoLabel += `, ${forumTag.name}`
                    /* Debug */ if (debugScanTags) console.log(` NoCounterpart: ${forumTag.name}`)
                } // else if ( labelConst.tagId == undefined) {
                  //* Debug */ if (debugScanTags) console.log(` Undefined TAG ID: ${forumTag.name}`)
            }
        }

        const tagCount = suggestionsChannel.availableTags.length
        let timeSpent = `Reponse time: ${((new Date()) - timeStart)}ms • ${tagCount} Tags`
        if (tagCount > 17) timeSpent += `\nNotice: Maximum amount of tags is 20.  It is recommended to remove any tags without label counterparts and replace them on existing suggestion posts.  Contact a Trello admin for assistance.`

        if (tagAddError !== false) {
            var errorReport = `${tagAddError}`
            if (`${tagAddError}`.includes('[BASE_TYPE_MAX_LENGTH]')) errorReport += `  *Amount of Tags and length of Tag names must not exceed 20.  Either there are too many Trello labels, or there are too many tags that do not have a Trello label counterpart, or there is a Trello label that exceeds 20 characters.*`
            
            let errorEmbed = { 
                color: 0xff0000,
                title: 'Report',
                description: `${tagsAdded}\n\n${tagsNoLabel}`,
                footer: { text: timeSpent }
            }

            return interaction.reply({ content: `<@${process.env.BOT_OWNER_ID}> An Error has occurred - ${errorReport}`, embeds: [errorEmbed] })
        } else {
            
            fs.writeFileSync('slashcommands/trello/labels.json', JSON.stringify(obj), (err) => {
                if (err) console.log(err);
                else if (debugAddTags || debugScanTags) console.log("reloadlabels - Data Written!")
            })

            fs.writeFileSync('slashcommands/trello/mobLabels.json', JSON.stringify(objMob), (err) => {
                if (err) console.log(err);
                else if (debugAddTags || debugScanTags) console.log("reloadlabels - Mob Data Written!")
            })

            fs.writeFileSync('slashcommands/trello/tierLabels.json', JSON.stringify(objTier), (err) => {
                if (err) console.log(err);
                else if (debugAddTags || debugScanTags) console.log("reloadlabels - Tier Data Written!")
            })

            let reloadEmbed = { 
                color: 0x0000ff,
                title: 'Report',
                description: `${tagsAdded}\n\n${tagsNoLabel}`,
                footer: { text: timeSpent }
            }
            /* Debug */ if (debugAddTags || debugScanTags) console.log(timeSpent)
            return interaction.reply({ content: `Cached Trello labels successfully.  *Remember to remove any <#${/*channelIdArray.*/suggestionsId}> tags that no longer have a Trello label counterpart (This happens when a Trello label is removed).*`, embeds: [reloadEmbed] })//files: ['slashcommands/trello/labels.json']
        }
    } catch (error) {
        /* Debug */ if (debugAddTags || debugScanTags) console.log(error)
        return interaction.reply(`<@${process.env.BOT_OWNER_ID}> An Unknown Error has occurred - Failed to cache Trello labels.`)
    }
}

module.exports = {
    name: "reloadlabels",
    description: "Reloads the cache for Trello Labels - use when a label is added or deleted.",
    run
}
