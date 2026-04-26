module.exports = {
    name: "ping",
    category: "info",
    permissions: [],
    devOnly: false,
    run: async ({bot, message, args}) => {
        message.reply(`Pong!  \`Bot Latency: ${Date.now() - message.createdTimestamp}ms\` \`API Latency: ${Math.round(bot.client.ws.ping)}ms\``)
    }
}