const zgLoot = require('../data/zg.json')
const messageCreator = require('../helpers/messageCreator')

module.exports = (message) => {
	switch (message.content) {
		case '!zg-loot':
			const lootTable = messageCreator('ZG Loot Selection', zgLoot)
			message.channel.send(lootTable).then((sentMessage) => {
				zgLoot.bosses.forEach((boss) => {
					sentMessage.react(boss.reaction)
				})
			})
			break
		default:
			return
	}
}
