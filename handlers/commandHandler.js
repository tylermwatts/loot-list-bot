const moment = require('moment')
const _ = require('lodash')
const dotenv = require('dotenv')
dotenv.config()

const messageCreator = require('../helpers/messageCreator')
const itemListCreator = require('../helpers/itemListCreator')
const reactionHandler = require('../handlers/reactionHandler')
const messageCommands = require('../data/messageCommands')
const dbService = require('../services/dbService')

const zgLoot = require('../data/zg.json')
const numberReacts = require('../data/numberReacts.json')

const returnFormatedDateString = (hyphenatedDate) => {
	return moment(hyphenatedDate, 'MM-DD-YYYY').format('dddd, MMMM Do YYYY')
}

module.exports = async (message) => {
	switch (message.content) {
		case '!help':
			message.author.send(
				`__Available commands__\n\`!zgloot\` - Begin the process of creating a new ZG loot list\n\`!zgprint\` - Begins the process of selecting a loot list to be printed `
			)
			message.delete()
			break
		case '!zgloot': {
			const channel = message.channel
			const sentMessage = await message.author.send(
				`Using the MM-DD-YYYY format including leading zeros (ex: 02-28-2020), please enter the date that this raid will take place. You will have 3 minutes to respond. Invalid date formatting will not be accepted. When a valid date is given in the proper format, you will be asked to confirm this date.`
			)

			const filter = (m) =>
				/^(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])-(19|20)\d\d$/.test(m.content)
			const dateCollector = await sentMessage.channel.createMessageCollector(
				filter,
				{
					max: 1,
					time: 180000,
					errors: ['time'],
				}
			)

			dateCollector.on('collect', async (message) => {
				const confirmMessage = await sentMessage.channel.send(
					`${returnFormatedDateString(
						message.content
					)} is the date that you requested. Is this correct? You have 90 seconds to confirm via reaction to this message. When you confirm, a collection will be created in the database and the loot selection message will be posted in the channel, so please be 100% certain.\n\n:one: Yes\n:two: No`
				)

				const filter = (reaction, user) => user.id !== process.env.BOT_ID
				const dateConfirmCollector = confirmMessage.createReactionCollector(
					filter,
					{ max: 1, time: 90000, errors: ['time'] }
				)

				dateConfirmCollector.on('collect', (reaction, user) => {
					if (reaction.emoji.name === '1️⃣') {
						confirmMessage.channel.send('Date is confirmed.')

						const lootTable = messageCreator(
							messageCommands.ZG_LOOT_SELECTION,
							message.content
						)

						channel.send(lootTable).then((sentMessage) => {
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

					if (reaction.emoji.name === '2️⃣') {
						confirmMessage.channel.send(
							'Well, you done fucked up buddy. Start over.'
						)
					}
				})

				confirmMessage.react('1️⃣').then(() => confirmMessage.react('2️⃣'))
			})
			message.delete()
			break
		}
		case '!zgprint': {
			const user = message.author
			const channel = message.channel
			const events = await dbService.retrieveAllEvents()
			const eventSelectString = events
				.map((event, index) => {
					return `${numberReacts[index]} ${returnFormatedDateString(event)}`
				})
				.join('\n')

			const sentMessage = await user.send(
				`The following events were found in the database. Please use reactions to select the event for which you would like to print the list. **This will not cause the list to print. There will be a verification step before the list is printed.**\n\n${eventSelectString}`
			)

			const filter = (reaction, user) => user.id !== process.env.BOT_ID
			const eventReactionCollector = sentMessage.createReactionCollector(
				filter,
				{ time: 180000, errors: ['time'] }
			)

			eventReactionCollector.on('collect', async (reaction, user) => {
				const emoji = reaction.emoji.name
				const eventIndex = _.findKey(numberReacts, (r) => r === emoji)
				const event = events[eventIndex]
				const eventVerifyMessage = await user.send(
					`You have selected the event **${returnFormatedDateString(
						event
					)}**.\n\nWhen you react to confirm this, **the full item list will be printed in the public channel** so please be certain you are ready to print the list.\n\n:one: Yes\n:two: No`
				)

				const eventVerifyReactionCollector = eventVerifyMessage.createReactionCollector(
					filter,
					{ time: 180000, errors: ['time'] }
				)

				eventVerifyReactionCollector.on(
					'collect',
					async (verifyReaction, user) => {
						if (verifyReaction.emoji.name === '1️⃣') {
							const dbList = await dbService.retrieveList(event)
							const itemList = itemListCreator(event, dbList)
							channel.send(itemList)
						}
						if (verifyReaction.emoji.name === '2️⃣') {
							user.send('List printing aborted.')
						}
					}
				)

				eventVerifyMessage
					.react('1️⃣')
					.then(() => eventVerifyMessage.react('2️⃣'))
			})
			events.forEach((e, i) => sentMessage.react(numberReacts[i]))
			message.delete()
			break
		}
		case '!zgwho': {
			const user = message.author
			const events = await dbService.retrieveAllEvents()
			const eventSelectString = events
				.map((event, index) => {
					return `${numberReacts[index]} ${returnFormatedDateString(event)}`
				})
				.join('\n')
			const sentMessage = await user.send(
				`The following events were found in the database. Please use reactions to select the event for which you would like to see a list of users who have items reserved.\n\n${eventSelectString}`
			)

			const filter = (reaction, user) => user.id !== process.env.BOT_ID
			const eventReactionCollector = sentMessage.createReactionCollector(
				filter,
				{ max: 1, time: 180000, errors: ['time'] }
			)

			eventReactionCollector.on('collect', async (reaction, user) => {
				const emoji = reaction.emoji.name
				const eventIndex = _.findKey(numberReacts, (r) => r === emoji)
				const event = events[eventIndex]
				const eventList = await dbService.retrieveList(event)
				const usersString = eventList
					.map((record, index) => `${index + 1}. <@${record.user}>`)
					.join('\n')
				user.send(
					`Here is the list of users who have items reserved for **${returnFormatedDateString(
						event
					)}**\n\n${usersString}`
				)
			})
			events.forEach((e, i) => sentMessage.react(numberReacts[i]))
			message.delete()
			break
		}
		default:
			return
	}
}
