const moment = require('moment')
const dbService = require('../services/dbService')

const today = moment().startOf('day')

const THREE_DAYS_OLD = today.clone().subtract(3, 'days').startOf('day')

const isThreeDaysOrOlder = (momentDate) => {
	return moment(momentDate, 'MM-DD-YYYY').isSameOrBefore(THREE_DAYS_OLD)
}

module.exports = {
	clearOldEvents: async () => {
		const events = await dbService.retrieveAllEvents()
		events.forEach(async (e) => {
			if (isThreeDaysOrOlder(e)) {
				await dbService.deleteList(e)
			}
		})
	},
}
