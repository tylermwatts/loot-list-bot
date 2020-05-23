const { Client } = require('discord.js')
const { RecurrenceRule, scheduleJob } = require('node-schedule')
const dotenv = require('dotenv')
dotenv.config()

const commandHandler = require('./handlers/commandHandler')
const reactionHandler = require('./handlers/reactionHandler')
const eventCleanup = require('./helpers/eventCleanup')

const token = process.env.TOKEN

const everyMidnight = new RecurrenceRule()
everyMidnight.hour = 5
everyMidnight.minute = 1

const bot = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

require('http')
	.createServer(async (req, res) => {
		console.log('Received request')
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

bot.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) return
	const datePattern = /^`\d\d-\d\d-\d\d\d\d`/
	if (reaction.partial) {
		try {
			await reaction.fetch()
		} catch (err) {
			console.log('Could not fetch: ', err)
			return
		}
		if (datePattern.test(reaction.message.content)) {
			await reactionHandler(reaction, user)
			reaction.users.remove(user.id)
		}
	} else {
		if (datePattern.test(reaction.message.content)) {
			await reactionHandler(reaction, user)
			reaction.users.remove(user.id)
		}
	}
})

setInterval(() => {
	require('http').get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`)
}, 280000)

bot.login(token)
