const zgLoot = require('../data/zg.json')
const numberReacts = require('../data/numberReacts.json')
const dbService = require('../services/dbService')
const _ = require('lodash')
const dotenv = require('dotenv')
dotenv.config()

const itemStringCreator = (boss) =>
	boss.items
		.map((item, index) => `${numberReacts[index]}. ${item.name}`)
		.join('\n')

const verifyItem = async (user, boss, item, reactionCollector) => {
	const sentMessage = await user.send(
		`You selected **${item.name}** - ${item.wowhead_link}\nIs this correct? You have 90 seconds to verify whether this is the item you wish to reserve.\n:one:. Yes\n:two:. No`
	)

	const filter = (reaction, user) => user.id !== process.env.BOT_ID
	sentMessage.react('1️⃣').then(() => sentMessage.react('2️⃣'))
	const collected = await sentMessage.awaitReactions(filter, {
		max: 1,
		time: 90000,
		errors: ['time'],
	})
	const reaction = collected.first()
	if (reaction._emoji.name === '1️⃣') {
		const upsertedCount = await dbService.insertItem(
			user.id,
			boss.name,
			item.name
		)
		if (upsertedCount === 1) {
			sentMessage.channel.send(`Your item has been reserved. Thank you.`)
		} else {
			sentMessage.channel.send('Your reserved item has been updated.')
		}
	}
	if (reaction._emoji.name === '2️⃣') {
		sentMessage.channel.send(
			'Please go back to the channel and start the process over by clicking the reaction for the boss you want.'
		)
	}
	reactionCollector.stop()
}

module.exports = async (reaction, user) => {
	const userReactions = reaction.message.reactions.cache.filter((reaction) =>
		reaction.users.cache.has(user.id)
	)

	try {
		for (const reaction of userReactions.values()) {
			reaction.users.remove(user.id)
		}
	} catch (error) {
		console.error('Failed to remove reactions.')
	}

	switch (reaction._emoji.name) {
		case '❔': {
			const itemRecord = await dbService.retrieveItem(user.id)
			if (itemRecord) {
				user.send(
					`Your currently reserved item is **${itemRecord.item}**, dropped from **${itemRecord.boss}**. To change your reserved item, return to the channel and click the reaction that corresponds to the boss that drops the item you want.`
				)
			} else {
				user.send('You currently have no items reserved for this event.')
			}
			break
		}
		case '❌': {
			const success = await dbService.deleteItem(user.id)
			if (success === 1) {
				user.send(
					'Your reserved item has been successfully cleared. You may go back to the channel and use a boss reaction to reserve a new item or you may verify that your item has been cleared by going back to the channel and reacting with ❔.'
				)
			} else {
				user.send('You currently have no item reserved.')
			}
			break
		}
		default:
			const boss = zgLoot.bosses.find(
				(b) => b.reaction === reaction._emoji.name
			)

			const sentMessage = await user.send(
				`You selected **${
					boss.name
				}**. Please react with the reaction that corresponds to the item you want to reserve. You will have 3 minutes to choose an item, or else you will need to start the process over.\n\n${itemStringCreator(
					boss
				)}`
			)
			const filter = (reaction, user) => user.id !== process.env.BOT_ID
			const reactionCollector = sentMessage.createReactionCollector(filter, {
				max: 1,
				time: 180000,
				errors: ['time'],
			})
			boss.items.forEach((_, index) => {
				sentMessage.react(numberReacts[index])
			})
			reactionCollector.on('collect', (reaction, user) => {
				const emoji = reaction.emoji.name
				const itemIndex = _.findKey(numberReacts, (r) => r === emoji)
				const item = boss.items[itemIndex]
				verifyItem(user, boss, item, reactionCollector)
			})
			break
	}
}
