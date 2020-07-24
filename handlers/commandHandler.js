const moment = require('moment')
const _ = require('lodash')
const dotenv = require('dotenv')
dotenv.config()

const messageCreator = require('../helpers/messageCreator')
const messageCommands = require('../data/messageCommands')
const dbService = require('../services/dbService')

const zgLoot = require('../data/zg.json')
const numberReacts = require('../data/numberReacts.json')

const returnFormattedDateString = (hyphenatedDate) => {
	return moment(hyphenatedDate, 'MM-DD-YYYY').format('dddd, MMMM Do YYYY')
}

const getLongRaidName = (raidName) => {
	switch (raidName) {
		case 'ZG': {
			return "Zul'Gurub"
		}
		case 'AQ20': {
			return "Ruins of Ahn'Qiraj"
		}
		case 'MC': {
			return 'Molten Core'
		}
		case 'BWL': {
			return 'Blackwing Lair'
		}
	}
}

const makeNewLootTable = async (message, messageCommand, lootData) => {
	const channel = message.channel
	const createDateSelectMessage = messageCreator(
		messageCommands.CREATE_DATE_SELECT
	)
	const sentMessage = await message.author.send(createDateSelectMessage)

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
			`${returnFormattedDateString(
				message.content
			)} is the date that you requested. Is this correct? You have 90 seconds to confirm via reaction to this message. When you confirm, a collection will be created in the database and the loot selection message will be posted in the channel, so please be 100% certain.\n\n:one: Yes\n:two: No`
		)

		const filter = (reaction, user) => !user.bot
		const dateConfirmCollector = confirmMessage.createReactionCollector(
			filter,
			{ max: 1, time: 90000, errors: ['time'] }
		)

		dateConfirmCollector.on('collect', (reaction, user) => {
			if (reaction.emoji.name === '1️⃣') {
				confirmMessage.channel.send('Date is confirmed.')

				const lootTable = messageCreator(messageCommand, {
					date: message.content,
				})

				channel.send(lootTable).then((sentMessage) => {
					lootData.bosses.forEach((boss) => {
						sentMessage.react(boss.reaction)
					})

					sentMessage.react('❔')
					sentMessage.react('❌')
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
}

const printList = async (message, raidName) => {
	const user = message.author
	const channel = message.channel
	const events = await dbService.retrieveEventsByRaid(raidName)
	const eventSelectString = events
		.map((event, index) => {
			return `${numberReacts[index]} ${returnFormattedDateString(event)}`
		})
		.join('\n')

	const sentMessage = await user.send(
		`The following events were found in the database. Please use reactions to select the event for which you would like to print the list. **This will not cause the list to print. There will be a verification step before the list is printed.**\n\n${eventSelectString}`
	)

	const filter = (reaction, user) => !user.bot
	const eventReactionCollector = sentMessage.createReactionCollector(filter, {
		time: 180000,
		errors: ['time'],
	})

	eventReactionCollector.on('collect', async (reaction, user) => {
		const emoji = reaction.emoji.name
		const eventIndex = _.findKey(numberReacts, (r) => r === emoji)
		const event = events[eventIndex]
		const eventVerifyMessage = await user.send(
			`You have selected the event **${returnFormattedDateString(
				event
			)}**.\n\nWhen you react to confirm this, **the full item list will be printed in the public channel** so please be certain you are ready to print the list.\n\n:one: Yes\n:two: No`
		)

		const eventVerifyReactionCollector = eventVerifyMessage.createReactionCollector(
			filter,
			{ time: 180000, errors: ['time'] }
		)

		eventVerifyReactionCollector.on('collect', async (verifyReaction, user) => {
			if (verifyReaction.emoji.name === '1️⃣') {
				const raidEvent = `${raidName}-${event}`
				const dbList = await dbService.retrieveList(raidEvent)
				const itemList = messageCreator(messageCommands.CREATE_ITEM_LIST, {
					longName: getLongRaidName(raidName),
					event,
					list: dbList,
				})
				channel.send(itemList)
			}
			if (verifyReaction.emoji.name === '2️⃣') {
				user.send('List printing aborted.')
			}
		})

		eventVerifyMessage.react('1️⃣').then(() => eventVerifyMessage.react('2️⃣'))
	})
	events.forEach((e, i) => sentMessage.react(numberReacts[i]))
	message.delete()
}

const showUsersWithReservedItems = async (message, raidName) => {
	const user = message.author
	const events = await dbService.retrieveEventsByRaid(raidName)
	const eventSelectString = events
		.map((event, index) => {
			return `${numberReacts[index]} ${returnFormattedDateString(event)}`
		})
		.join('\n')
	const sentMessage = await user.send(
		`The following events were found in the database. Please use reactions to select the event for which you would like to see a list of users who have items reserved.\n\n${eventSelectString}`
	)

	const filter = (reaction, user) => !user.bot
	const eventReactionCollector = sentMessage.createReactionCollector(filter, {
		max: 1,
		time: 180000,
		errors: ['time'],
	})

	eventReactionCollector.on('collect', async (reaction, user) => {
		const emoji = reaction.emoji.name
		const eventIndex = _.findKey(numberReacts, (r) => r === emoji)
		const event = events[eventIndex]
		const eventList = await dbService.retrieveList(`${raidName}-${event}`)
		const usersString = eventList
			.filter((record) => message.guild.member(record.user))
			.map((record, index) => {
				const member = message.guild.member(record.user)
				const nickName =
					member.nickname && member.nickname !== member.user.username
						? ` (${member.nickname})\n`
						: `\n`
				const userWithNickname = `${index + 1}. <@${record.user}>` + nickName
				return userWithNickname
			})
			.join('')
		user.send(
			`Here is the list of users who have items reserved for **${getLongRaidName(
				raidName
			)} on ${returnFormattedDateString(event)}**\n\n${usersString}`
		)
	})
	events.forEach((e, i) => sentMessage.react(numberReacts[i]))
	message.delete()
}

module.exports = async (message) => {
	switch (message.content) {
		case '!zgloot': {
			await makeNewLootTable(message, messageCommands.ZG_LOOT_SELECTION, zgLoot)
			break
		}
		case '!zgprint': {
			await printList(message, 'ZG')
			break
		}
		case '!zgwho': {
			await showUsersWithReservedItems(message, 'ZG')
			break
		}
		// case '!mcloot': {
		// 	await makeNewLootTable(message, messageCommands.MC_LOOT_SELECTION, mcLoot)
		// 	break
		// }
		// case '!mcprint': {
		// 	await printList(message, 'MC')
		// 	break
		// }
		// case '!mcwho': {
		// 	await showUsersWithReservedItems(message, 'MC')
		// 	break
		// }
		// case '!aq20loot': {
		// 	await makeNewLootTable(message, messageCommands.AQ20_LOOT_SELECTION, aq20Loot)
		// 	break
		// }
		// case '!aq20print': {
		// 	await printList(message, 'AQ20')
		// 	break
		// }
		// case '!aq20who': {
		// 	await showUsersWithReservedItems(message, 'AQ20')
		// 	break
		// }
		// case '!bwlloot': {
		// 	await makeNewLootTable(message, messageCommands.BWL_LOOT_SELECTION, bwlLoot)
		// 	break
		// }
		// case '!bwlprint': {
		// 	await printList(message, 'BWL')
		// 	break
		// }
		// case '!bwlwho': {
		// 	await showUsersWithReservedItems(message, 'BWL')
		// }
		case messageCommands.HELP: {
			const helpMessage = messageCreator(messageCommands.HELP)
			message.author.send(helpMessage)
			message.delete()
			break
		}
		default: {
			const helpMessage = messageCreator(messageCommands.HELP)
			message.author.send(helpMessage)
			message.delete()
			break
		}
	}
}
