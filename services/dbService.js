const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const dotenv = require('dotenv')
dotenv.config()

const url = process.env.DB_URI

const dbName = 'zg-loot-list'
const collectionName = 'zg-loot'

const insertDocument = async (db, document) => {
	const collection = db.collection(collectionName)

	const result = await collection.updateOne(
		{ user: document.user },
		{ $set: { boss: document.boss, item: document.item } },
		{ upsert: true }
	)

	return result.upsertedCount
}

const retrieveDocument = async (db, userId) => {
	const collection = db.collection(collectionName)

	const res = await collection.findOne({ user: userId })
	return res
}

const deleteDocument = async (db, userId) => {
	const collection = db.collection(collectionName)

	let res = await collection.deleteOne({ user: userId })
	return res.result.n
}

const findAllDocuments = (db, callback) => {
	const collection = db.collection(collectionName)

	collection.find({}).toArray((err, docs) => {
		assert.equal(err, null)
		console.log('Found the following records')
		console.log(docs)
		callback(docs)
	})
}

module.exports = {
	insertItem: async (userId, bossName, itemName) => {
		let modified
		const client = new MongoClient(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		try {
			client.connect((err) => {
				assert.equal(err, null)
				console.log('Connected successfully to server.')
			})
			const db = client.db(dbName)
			modified = await insertDocument(db, {
				user: userId,
				boss: bossName,
				item: itemName,
			})
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
			return modified
		}
	},
	retrieveItem: async (userId) => {
		let record
		const client = new MongoClient(url, { useUnifiedTopology: true })
		try {
			client.connect((err) => {
				assert.equal(err, null)
				console.log('Connected successfully to server.')
			})
			const db = client.db(dbName)
			record = await retrieveDocument(db, userId)
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
			return record
		}
	},
	deleteItem: async (userId) => {
		const client = new MongoClient(url, { useUnifiedTopology: true })
		let success
		try {
			client.connect((err) => {
				assert.equal(err, null)
				console.log('Connected successfully to server.')
			})
			const db = client.db(dbName)
			success = await deleteDocument(db, userId)
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
			return success
		}
	},
	retrieveList: () => {
		const client = new MongoClient(url, { useUnifiedTopology: true })
		client.connect((err) => {
			assert.equal(null, err)
			console.log('Connected successfully to server.')

			const db = client.db(dbName)

			findAllDocuments(db, () => client.close())
		})
	},
}
