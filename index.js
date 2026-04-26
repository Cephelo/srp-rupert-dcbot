const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");

require("dotenv").config()

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [
	  Partials.User,
	  Partials.Channel,
	  Partials.Message,
	  Partials.Reaction,
	]
})

let bot = {
	client,
	prefix: "=",
	owner: process.env.BOT_OWNER_ID
}

client.commands = new Collection()
client.events = new Collection()
client.slashcommands = new Collection()

client.loadEvents = (bot, reload) => require("./handlers/events")(bot, reload)
client.loadCommands = (bot, reload) => require("./handlers/commands")(bot, reload)
client.loadSlashCommands = (bot, reload) => require("./handlers/slashcommands")(bot, reload)

client.loadEvents(bot, false)
client.loadCommands(bot, false)
client.loadSlashCommands(bot, false)

// client.on("ready", () => {
// 	console.log(`Logged in as ${client.user.tag}`)
// })

// client.on("messageCreate", (message) => {
// 	if (message.content == "hi"){
// 		message.reply("among us")
// 	}
// })

client.on("ready", async () => {
	console.log("Logged in as " + bot.client.user.tag)
	console.log(`Discord.js version: ${require('discord.js').version}`)
    
	const { setChannels, guildId, isDev } = require("./slashcommands/trello/keyConfig.js");

    const guild = client.guilds.cache.get(guildId)
    if (!guild) return console.error("Target guild not found")
	setChannels(client);

	const { cachePosts } = require("./slashcommands/trello/suggModLog.js");
	cachePosts(client);

	console.log(`Loading ${client.slashcommands.size} slash commands`)
    await guild.commands.set([...client.slashcommands.values()])
    console.log(`Successfully loaded ${client.slashcommands.size} slash commands`)
	console.log(isDev ? 'WARNING: Bot is configured for developer testing!' : 'Bot configured for standard use.')
	console.log('Ready!')
    //process.exit(0)
})

client.login(process.env.DISCORD_TOKEN)

const { run } = require('./util/server.js')
run();