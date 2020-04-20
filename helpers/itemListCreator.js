const moment = require('moment')

module.exports = (event, list) => {
	const lootListObj = {}
	list.forEach((r) => {
		if (!lootListObj.hasOwnProperty(r.boss)) {
			lootListObj[r.boss] = {
				[r.item]: [`<@${r.user}>`],
			}
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
				`__${bossName}__\n${Object.keys(lootListObj[bossName]).map(
					(itemName) =>
						`${itemName} - ${lootListObj[bossName][itemName].join(', ')}`
				)}`
		)
		.join('\n')

	const message =
		`__**Zul'Gurub Loot List for ${moment(event, 'MM-DD-YYYY').format(
			'dddd, MMMM Do YYYY'
		)}**__\n\n` + itemsByBoss

	return message
}
