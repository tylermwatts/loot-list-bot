const zgLoot = require('../data/zg.json')
const numberReacts = require('../data/numberReacts.json')
const _ = require('lodash')

module.exports = async (reaction, user) => {
	const userReactions = reaction.message.reactions.cache.filter((reaction) =>
		reaction.users.cache.has(user.id)
	)

	const itemStringCreator = (boss) =>
		boss.items
			.map((item, index) => `${numberReacts[index]}. ${item.name}`)
			.join('\n')

	try {
		for (const reaction of userReactions.values()) {
			await reaction.users.remove(user.id)
		}
	} catch (error) {
		console.error('Failed to remove reactions.')
	}

	const boss = zgLoot.bosses.find((b) => b.reaction === reaction._emoji.name)
	let dm

	user
		.send(
			`You selected **${
				boss.name
			}**. Please react with the reaction that corresponds to the item you want to reserve. You will have 90 seconds to choose an item, or else you will need to start the process over.\n\n${itemStringCreator(
				boss
			)}`
		)
		.then((sentMessage) => {
			dm = sentMessage
			boss.items.forEach((_, index) => {
				sentMessage.react(numberReacts[index])
			})
		})
		.then(() => {
			const filter = (reaction, user) => user.id !== '696457530439893072'
			dm.awaitReactions(filter, { max: 1, time: 90000, errors: ['time'] })
				.then((collected) => {
					const reaction = collected.first()._emoji.name
					const itemIndex = _.findKey(numberReacts, (r) => r === reaction)
					const item = boss.items[itemIndex]
					user
						.send(
							`You selected **${item.name}** - ${item.wowhead_link}\nIs this correct?\n:one:. Yes\n:two:. No`
						)
						.then((sentMessage) => {
							sentMessage.react('1️⃣').then(() => sentMessage.react('2️⃣'))
							sentMessage
								.awaitReactions(filter, {
									max: 1,
									time: 90000,
									errors: ['time'],
								})
								.then((collected) => {
									const reaction = collected.first()
									if (reaction._emoji.name === '1️⃣') {
										sentMessage.channel.send(
											'Your item has been reserved. Thank you.'
										)
									}
									if (reaction._emoji.name === '2️⃣') {
										sentMessage.channel.send(
											'Please go back to the channel and start the process over by clicking the reaction for the boss you want.'
										)
									}
								})
								.catch((err) => sentMessage.channel.send('timed out'))
						})
				})
				.catch(() =>
					user.send(
						`Time's up! Please go back to the message and use the appropriate reaction to restart the item selection process.`
					)
				)
		})
		.catch((err) => console.error(err))
}
