const moment = require('moment')
const _ = require('lodash')
const dotenv = require('dotenv')
dotenv.config()

const messageCreator = require('../helpers/messageCreator')
const itemListCreator = require('../helpers/itemListCreator')
const eventCleanup = require('../helpers/eventCleanup')
const reactionHandler = require('../handlers/reactionHandler')
const messageCommands = require('../data/messageCommands')
const dbService = require('../services/dbService')

const zgLoot = require('../data/zg.json')
const numberReacts = require('../data/numberReacts.json')

module.exports = async (message) => {
	switch (message.content) {
		case '!help':
			message.author.send(
				`__Available commands__\n\`!zg-loot\` - Begin the process of creating a new ZG loot list\n\`!print-list\` - Begins the process of selecting a loot list to be printed `
			)
			message.delete()
			break
		case '!zg-loot':
			const sentMessage = await message.author.send(
				`Using the MM-DD-YYYY format including leading zeros (ex: 02-28-2020), please enter the date that this raid will take place. You will have 3 minutes to respond. Invalid date formatting will not be accepted. When a valid date is given in the proper format, you will be asked to confirm this date.`
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
					`${moment(m.content, 'MM-DD-YYYY').format(
						'dddd, MMMM Do YYYY'
					)} is the date that you requested. Is this correct? You have 90 seconds to confirm via reaction to this message. When you confirm, a collection will be created in the database and the loot selection message will be posted in the channel, so please be 100% certain.\n\n:one: Yes\n:two: No`
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
		case '!print-list': {
			const user = message.author
			const channel = message.channel
			const events = await dbService.retrieveAllEvents()
			const eventSelectString = events
				.map((event, index) => {
					return `${numberReacts[index]} ${moment(event, 'MM-DD-YYYY').format(
						'dddd, MMMM Do YYYY'
					)}`
				})
				.join('\n')
			const sentMessage = await user.send(
				`The following events were found in the database. Please use reactions to select the event for which you would like to print the list. **This will not cause the list to print. There will be a verification step before the list is printed.**\n\n${eventSelectString}`
			)
			events.forEach((e, i) => sentMessage.react(numberReacts[i]))
			const filter = (reaction, user) => user.id !== process.env.BOT_ID
			const eventReactionCollector = sentMessage.createReactionCollector(
				filter,
				{ max: 1, time: 9000, errors: ['time'] }
			)
			eventReactionCollector.on('collect', async (reaction, user) => {
				const emoji = reaction.emoji.name
				const eventIndex = _.findKey(numberReacts, (r) => r === emoji)
				const event = events[eventIndex]
				const eventVerifyMessage = await user.send(
					`You have selected the event **${moment(event, 'MM-DD-YYYY').format(
						'dddd, MMMM Do YYYY'
					)}**.\n\nWhen you react to confirm this, **the full item list will be printed in the public channel** so please be certain you are ready to print the list.\n\n:one: Yes\n:two: No`
				)
				eventVerifyMessage
					.react('1️⃣')
					.then(() => eventVerifyMessage.react('2️⃣'))
				const collected = await eventVerifyMessage.awaitReactions(filter, {
					max: 1,
					time: 90000,
					errors: ['time'],
				})
				const confirmReaction = collected.first()
				if (confirmReaction._emoji.name === '1️⃣') {
					const dbList = await dbService.retrieveList(event)
					const itemList = itemListCreator(dbList)
					channel.send(itemList)
				}
				if (confirmReaction._emoji.name === '2️⃣') {
					user.send('List printing aborted.')
				}
			})
			message.delete()
			break
		}
		case '!clear':
			message.channel.bulkDelete(25)
			break
		case '!test-drop':
			await eventCleanup.clearOldEvents()
			break
		default:
			return
	}
}
