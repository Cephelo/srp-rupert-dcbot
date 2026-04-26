const { getFiles } = require("../util/functions")

module.exports = (bot, reload) => {
    const {client} = bot

    let events = getFiles("./events/", ".js")

    if (events.length === 0) {
        console.log("No events to load")
    }

    events.forEach((f, i) => {
        if (reload)
            delete require.cache[require.resolve(`../events/${f}`)]
        const event = require(`../events/${f}`)
        client.events.set(event.name, event)

        if (!reload)
            console.log(`${i + 1}. ${f} loaded`)
    })

    if (!reload) {
        initEvents(bot)
        console.log('Initialized Events')
    }

}

function triggerEventHandler(bot, event, ...args) {
    const {client} = bot

    try {
        if (client.events.has(event))
            client.events.get(event).run(bot, ...args)
        else
            throw new Error(`Event ${event} does not exist`)
    }
    catch(err) {
        console.error(err)
    }
}


function initEvents(bot) {
    const {client} = bot

    // client.on("ready", () => {
    //     triggerEventHandler(bot, "ready")
    // })

    client.on("messageCreate", (message) => {
        triggerEventHandler(bot, "messageCreate", message)
    })
    
    client.on("interactionCreate", (interaction) => {
        triggerEventHandler(bot, "interactionCreate", interaction)
    })
    
    client.on("messageReactionAdd", (messageReaction) => {
        triggerEventHandler(bot, "messageReactionAdd", messageReaction)
    })

    client.on("error", function(error){
        console.error(`client's WebSocket encountered a connection error: ${error}`)
    })

    // client.on("shardError", function(error){
    //     const user = bot.users.cache.get(bot.owner);
    //     user.send(`An error has occurred: ${error}`)
    //     console.log('Attempted to send error report to owner')
    // })
    
    client.on("channelUpdate", (oldChannel, newChannel) => {
        triggerEventHandler(bot, "channelUpdate", oldChannel, newChannel)
    })
    
    client.on("threadCreate", (thread, newlyCreated) => {
        triggerEventHandler(bot, "threadCreate", thread, newlyCreated)
    })
    
    client.on("threadDelete", (thread) => {
        triggerEventHandler(bot, "threadDelete", thread)
    })
    
    client.on("threadUpdate", (oldThread, newThread) => {
        triggerEventHandler(bot, "threadUpdate", oldThread, newThread)
    })
}