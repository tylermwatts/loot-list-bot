const messageCommands = require('../data/messageCommands')
const moment = require('moment')
const zgLoot = require('../data/zg.json')

const defaultParams = {
	date: null,
	event: null,
	list: null,
	lootData: null,
}

module.exports = (command, params = defaultParams) => {
	switch (command) {
		case messageCommands.HELP: {
			return `__Available commands__\n\`!zgloot\` - Creates a new ZG loot list\n\`!zgprint\` - Select a loot list to be printed in the channel\n\`!zgwho\` - Sends a list of players who have reserved loot. **Does not show what items are reserved**`
		}
		case messageCommands.ZG_LOOT_SELECTION: {
			const { date, lootData } = params
			const bossString = lootData.bosses
				.map((boss) => {
					return `**${boss.name}** - ${boss.reaction}`
				})
				.join('\n')
			return `\`ZG-${date}\`\n__**ZG Loot Selection**__\nThis list is for the ZG raid happening on **${moment(
				date,
				'MM-DD-YYYY'
			).format(
				'dddd, MMMM Do YYYY'
			)}**\n\nPlease click the appropriate reaction for the boss that drops the piece you would like to reserve. You will then receive a direct message from the bot to select your item.\n\n${bossString}\n\n**Show me my reserved item** - ❔\n**Clear my reserved item** - ❌`
		}
		case messageCommands.MC_LOOT_SELECTION: {
			const { date, lootData } = params
			const bossString = lootData.bosses
				.map((boss) => {
					return `**${boss.name}** - ${boss.reaction}`
				})
				.join('\n')
			return `\`MC-${date}\`\n__**Molten Core Loot Selection**__\nThis list is for the MC raid happening on **${moment(
				date,
				'MM-DD-YYYY'
			).format(
				'dddd, MMMM Do YYYY'
			)}**\n\nPlease click the appropriate reaction for the boss that drops the piece you would like to reserve. You will then receive a direct message from the bot to select your item.\n\n${bossString}\n\n**Show me my reserved item** - ❔\n**Clear my reserved item** - ❌`
		}
		case messageCommands.CREATE_DATE_SELECT: {
			return `Using the MM-DD-YYYY format including leading zeros (ex: 02-28-2020), please enter the date that this raid will take place. You will have 3 minutes to respond. Invalid date formatting will not be accepted. When a valid date is given in the proper format, you will be asked to confirm this date.`
		}
		case messageCommands.CREATE_ITEM_LIST: {
			const { longName, event, list } = params
			const lootListObj = {}
			list.forEach((r) => {
				if (!lootListObj.hasOwnProperty(r.boss)) {
					lootListObj[r.boss] = {}
				}
				if (!lootListObj[r.boss].hasOwnProperty(r.item)) {
					lootListObj[r.boss][r.item] = [`<@${r.user}>`]
				} else {
					lootListObj[r.boss][r.item] = [
						...lootListObj[r.boss][r.item],
						`<@${r.user}>`,
					]
				}
			})

			const bosses = Object.keys(lootListObj)

			const itemsByBoss = bosses
				.map(
					(bossName) =>
						`__${bossName}__\n${Object.keys(lootListObj[bossName])
							.map((itemName) => {
								const userString = lootListObj[bossName][itemName].join(', ')
								return `${itemName} - ${userString}\n`
							})
							.join('')}\n`
				)
				.join('')

			const message =
				`__**${longName} Loot List for ${moment(event, 'MM-DD-YYYY').format(
					'dddd, MMMM Do YYYY'
				)}**__\n\n` + itemsByBoss

			return message
		}
		default:
			return
	}
}
