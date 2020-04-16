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
		if (
			message.member.roles.cache.has(process.env.OFFICER_ROLE) ||
			message.author.id === '213089677652131841'
		) {
			commandHandler(message)
		}
	}
})

bot.login(token)
