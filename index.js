const { Client } = require('discord.js')
const dotenv = require('dotenv')
dotenv.config()

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
		if (message.content === '!test') {
			message.channel.send('Test successful')
		}
		if (message.content === '!userid') {
			message.channel.send(`<@${message.author.id}>`)
		}
	}
})

bot.on('messageReactionAdd', async (messageReaction, user) => {
	await messageReaction.remove([user])
})

bot.login(token)
