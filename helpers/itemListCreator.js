const moment = require('moment')

module.exports = (event, list) => {
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
		`__**Zul'Gurub Loot List for ${moment(event, 'MM-DD-YYYY').format(
			'dddd, MMMM Do YYYY'
		)}**__\n\n` + itemsByBoss

	return message
}
