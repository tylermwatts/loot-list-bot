const messageCommands = require('../data/messageCommands')
const zgLoot = require('../data/zg.json')

module.exports = (command, date) => {
	switch (command) {
		case messageCommands.ZG_LOOT_SELECTION: {
			const bossString = zgLoot.bosses
				.map((boss) => {
					return `**${boss.name}** - ${boss.reaction}`
				})
				.join('\n')
			return `__**ZG Loot Selection** for ${date}__\n\nPlease click the appropriate reaction for the boss that drops the piece you would like to reserve. You will then receive a direct message from the bot to select your item.\n\n${bossString}\n\n**Show me my reserved item** - ❔\n**Clear my reserved item** - ❌`
		}
		default:
			return
	}
}
