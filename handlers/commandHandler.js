const messageCreator = require('../helpers/messageCreator')
const reactionHandler = require('../handlers/reactionHandler')
const messageCommands = require('../data/messageCommands')
const zgLoot = require('../data/zg.json')
const dotenv = require('dotenv')
dotenv.config()

module.exports = async (message) => {
	switch (message.content) {
		case '!zg-loot':
			const sentMessage = await message.author.send(
				`Using the MM-DD-YYYY format, please enter the date that this raid will take place. You will have 3 minutes to respond. Invalid date formatting will not be accepted. When a valid date is given in the proper format, you will be asked to confirm this date.`
			)
			const filter = (m) => {
				const index = m.content.search(
					/^(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])-(19|20)\d\d$/
				)
				return index >= 0 ? true : false
			}
			const dateCollector = await sentMessage.channel.createMessageCollector(
				filter,
				{
					max: 1,
					time: 180000,
					errors: ['time'],
				}
			)
			dateCollector.on('collect', async (m) => {
				const confirmMessage = await sentMessage.channel.send(
					`${m.content} is the date that you entered. Is this correct? You have 90 seconds to confirm. When you confirm, a collection will be created in the database and the loot selection message will be posted in the channel, so please be 100% certain.\n\n:one: Yes\n:two: No`
				)
				const filter = (reaction, user) => user.id !== process.env.BOT_ID
				confirmMessage.react('1️⃣').then(() => confirmMessage.react('2️⃣'))
				const collected = await confirmMessage.awaitReactions(filter, {
					max: 1,
					time: 90000,
					errors: ['time'],
				})
				const reaction = collected.first()
				if (reaction._emoji.name === '1️⃣') {
					confirmMessage.channel.send('Date is confirmed.')
					const lootTable = messageCreator(
						messageCommands.ZG_LOOT_SELECTION,
						m.content
					)
					message.channel.send(lootTable).then((sentMessage) => {
						const filter = (reaction, user) => user.id !== process.env.BOT_ID
						const reactionCollector = sentMessage.createReactionCollector(
							filter,
							{
								maxUsers: 30,
							}
						)
						zgLoot.bosses.forEach((boss) => {
							sentMessage.react(boss.reaction)
						})
						sentMessage.react('❔')
						sentMessage.react('❌')
						reactionCollector.on('collect', (reaction, user) => {
							reactionHandler(reaction, user)
						})
					})
				}
				if (reaction._emoji.name === '2️⃣') {
					confirmMessage.channel.send(
						'Well, you done fucked up buddy. Start over.'
					)
				}
			})

			message.delete()
			break
		case '!clear':
			message.channel.bulkDelete(25)
			break
		default:
			return
	}
}
