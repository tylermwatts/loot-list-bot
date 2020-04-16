const messageCommands = require('../data/messageCommands')
const moment = require('moment')
const zgLoot = require('../data/zg.json')

module.exports = (command, date) => {
	switch (command) {
		case messageCommands.ZG_LOOT_SELECTION: {
			const bossString = zgLoot.bosses
				.map((boss) => {
					return `**${boss.name}** - ${boss.reaction}`
				})
				.join('\n')
			return `\`${date}\`\n__**ZG Loot Selection**__\nThis list is for the ZG raid happening on **${moment(
				date,
				'MM-DD-YYYY'
			).format(
				'dddd, MMMM Do YYYY'
			)}**\n\nPlease click the appropriate reaction for the boss that drops the piece you would like to reserve. You will then receive a direct message from the bot to select your item.\n\n${bossString}\n\n**Show me my reserved item** - ❔\n**Clear my reserved item** - ❌`
		}
		default:
			return
	}
}
