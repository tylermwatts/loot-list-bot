const { Client } = require('discord.js')
const dotenv = require('dotenv')
dotenv.config()

const commandHandler = require('./handlers/commandHandler')
const reactionHandler = require('./handlers/reactionHandler')

const token = process.env.TOKEN

const bot = new Client()

require('http')
	.createServer(async (req, res) => {
		console.log(req)
		res.statusCode = 200
		res.write('ok')
		res.end()
	})
	.listen(3000, () => console.log('Now listening on port 3000'))

bot.once('ready', () => {
	bot.user.setPresence({
		activity: {
			name: 'user input',
			type: 'LISTENING',
		},
		status: 'online',
	})
})

bot.on('message', async (message) => {
	if (message.content[0] === '!') {
		commandHandler(message)
	}
})

bot.on('messageReactionAdd', async (reaction, user) => {
	if (user.id !== '696457530439893072') {
		await reactionHandler(reaction, user)
	}
})

bot.login(token)
