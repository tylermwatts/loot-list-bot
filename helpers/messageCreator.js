module.exports = (title, lootData) => {
	const bossString = lootData.bosses
		.map((boss) => {
			return `**${boss.name}** - ${boss.reaction}`
		})
		.join('\n')
	return `__**${title}**__\n\nPlease click the appropriate reaction for the boss that drops the piece you would like to reserve. You will then receive a direct message from the bot to select your item.\n\n${bossString}`
}
