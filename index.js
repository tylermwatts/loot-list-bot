const { Client } = require('discord.js')
const { RecurrenceRule, scheduleJob } = require('node-schedule')
const dotenv = require('dotenv')
dotenv.config()

const commandHandler = require('./handlers/commandHandler')
const eventCleanup = require('./helpers/eventCleanup')

const token = process.env.TOKEN

const everyMidnight = new RecurrenceRule()
everyMidnight.hour = 5
everyMidnight.minute = 1

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
	scheduleJob(everyMidnight, async () => {
		await eventCleanup.clearOldEvents()
	})
})

bot.on('message', async (message) => {
	if (
		message.channel.id === process.env.OPERATING_CHANNEL &&
		message.member.roles.cache.has(process.env.OFFICER_ROLE)
	) {
		if (!message.content.startsWith('!') || message.author.bot) return
		await commandHandler(message)
	}
})

bot.login(token)
