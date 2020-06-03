const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const dotenv = require('dotenv')
dotenv.config()

const url = process.env.DB_URI

const dbName = 'zg-loot-list'

const insertDocument = async (collection, document) => {
	const result = await collection.updateOne(
		{ user: document.user },
		{ $set: { boss: document.boss, item: document.item } },
		{ upsert: true }
	)

	return result.upsertedCount
}

const retrieveDocument = async (collection, userId) => {
	const res = await collection.findOne({ user: userId })
	return res
}

const deleteDocument = async (collection, userId) => {
	let res = await collection.deleteOne({ user: userId })
	return res.result.n
}

const retrieveAllCollections = async (db) => {
	const allCollections = await db.collections()
	const sanitizedCollectionNames = allCollections
		.map((c) => c.collectionName)
		.filter((n) => /\d\d-\d\d-\d\d\d\d/.test(n))
		.sort()
	return sanitizedCollectionNames
}

module.exports = {
	insertItem: async (collectionName, userId, bossName, itemName) => {
		let modified
		const client = new MongoClient(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		try {
			client.connect((err) => {
				assert.equal(err, null)
				console.log('Insert Item: Connected successfully to database.')
			})
			const db = client.db(dbName)
			const collection = db.collection(collectionName)
			modified = await insertDocument(collection, {
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
	retrieveItem: async (collectionName, userId) => {
		let record
		const client = new MongoClient(url, { useUnifiedTopology: true })
		try {
			client.connect((err) => {
				assert.equal(err, null)
				console.log('Retrieve Item: Connected successfully to database.')
			})
			const db = client.db(dbName)
			const collection = db.collection(collectionName)
			record = await retrieveDocument(collection, userId)
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
			return record
		}
	},
	deleteItem: async (collectionName, userId) => {
		const client = new MongoClient(url, { useUnifiedTopology: true })
		let success
		try {
			client.connect((err) => {
				assert.equal(err, null)
				console.log('Delete Item: Connected successfully to database.')
			})
			const db = client.db(dbName)
			const collection = db.collection(collectionName)
			success = await deleteDocument(collection, userId)
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
			return success
		}
	},
	retrieveAllEvents: async () => {
		const client = new MongoClient(url, { useUnifiedTopology: true })
		try {
			client.connect((err) => {
				assert.equal(null, err)
				console.log('Retrieve All Lists: Connected successfully to database.')
			})
			const db = client.db(dbName)
			return await retrieveAllCollections(db)
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
		}
	},
	retrieveList: async (collectionName) => {
		const client = new MongoClient(url, { useUnifiedTopology: true })
		client.connect((err) => {
			assert.equal(null, err)
			console.log('Retrieve Specific List: Connected successfully to database.')
		})
		const db = client.db(dbName)
		try {
			const documents = await db.collection(collectionName).find({}).toArray()
			return documents
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
		}
	},
	deleteList: async (listName) => {
		const client = new MongoClient(url, { useUnifiedTopology: true })
		client.connect((err) => {
			assert.equal(null, err)
			console.log('Delete Specific List: Connected successfully to database.')
		})
		const db = client.db(dbName)
		try {
			await db.dropCollection(listName)
		} catch (err) {
			console.log(err)
		} finally {
			client.close()
		}
	},
}
