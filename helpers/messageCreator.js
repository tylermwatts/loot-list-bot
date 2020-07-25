const messageCommands = require('../data/messageCommands')
const moment = require('moment')

const defaultParams = {
	date: null,
	event: null,
	list: null,
	lootData: null,
}

const makeLootSelectMessage = (raidName, date, lootData) => {
	const bossString = lootData.bosses
		.map((boss) => {
			return `**${boss.name}** - ${boss.reaction}`
		})
		.join('\n')
	return `\`${raidName}-${date}\`\n__**${
		lootData.zone
	} Loot Selection**__\nThis list is for the ${raidName} raid happening on **${moment(
		date,
		'MM-DD-YYYY'
	).format(
		'dddd, MMMM Do YYYY'
	)}**\n\nPlease click the appropriate reaction for the boss that drops the piece you would like to reserve. You will then receive a direct message from the bot to select your item.\n\n${bossString}\n\n**Show me my reserved item** - ❔\n**Clear my reserved item** - ❌`
}

module.exports = (command, params = defaultParams) => {
	switch (command) {
		case messageCommands.HELP: {
			return `__Available commands__\n\`!zgloot\` - Creates a new ZG loot list\n\`!mcloot\` - Creates a new MC loot list\n\`!bwlloot\` - Creates a new BWL loot list\n\`!aq20loot\` - Creates a new AQ20 loot list\n\`!zgprint\` - Select a ZG loot list to be printed in the channel\n\`!mcprint\` - Select a MC loot list to be printed in the channel\n\`!bwlprint\` - Select a BWL loot list to be printed in the channel\n\`!aq20print\` - Select a AQ20 loot list to be printed in the channel\n\`!zgwho\` - Sends a list of players who have reserved loot for ZG. **Does not show what items are reserved**\n\`!mcwho\` - Sends a list of players who have reserved loot for MC. **Does not show what items are reserved**\n\`!bwlwho\` - Sends a list of players who have reserved loot for BWL. **Does not show what items are reserved**\n\`!aq20who\` - Sends a list of players who have reserved loot for AQ20. **Does not show what items are reserved**`
		}
		case messageCommands.ZG_LOOT_SELECTION: {
			const { date, lootData } = params
			const lootSelectionMessage = makeLootSelectMessage('ZG', date, lootData)
			return lootSelectionMessage
		}
		case messageCommands.MC_LOOT_SELECTION: {
			const { date, lootData } = params
			const lootSelectionMessage = makeLootSelectMessage('MC', date, lootData)
			return lootSelectionMessage
		}
		case messageCommands.AQ20_LOOT_SELECTION: {
			const { date, lootData } = params
			const lootSelectionMessage = makeLootSelectMessage('AQ20', date, lootData)
			return lootSelectionMessage
		}
		case messageCommands.BWL_LOOT_SELECTION: {
			const { date, lootData } = params
			const lootSelectionMessage = makeLootSelectMessage('BWL', date, lootData)
			return lootSelectionMessage
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
