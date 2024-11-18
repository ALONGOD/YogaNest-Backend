import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const productService = {
	remove,
	query,
	getById,
	add,
	update,
	addProductMsg,
	removeProductMsg,
}

async function query(filterBy = { txt: '' }) {
	try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('product')
		var productCursor = await collection.find(criteria, { sort })

		if (filterBy.pageIdx !== undefined) {
			productCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		}

		const products = productCursor.toArray()
		return products
	} catch (err) {
		logger.error('cannot find products', err)
		throw err
	}
}

async function getById(productId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(productId) }

		const collection = await dbService.getCollection('product')
		const product = await collection.findOne(criteria)
        
		product.createdAt = product._id.getTimestamp()
		return product
	} catch (err) {
		logger.error(`while finding product ${productId}`, err)
		throw err
	}
}

async function remove(productId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const { _id: ownerId, isAdmin } = loggedinUser

	try {
        const criteria = { 
            _id: ObjectId.createFromHexString(productId), 
        }
        if(!isAdmin) criteria['owner._id'] = ownerId
        
		const collection = await dbService.getCollection('product')
		const res = await collection.deleteOne(criteria)

        if(res.deletedCount === 0) throw('Not your product')
		return productId
	} catch (err) {
		logger.error(`cannot remove product ${productId}`, err)
		throw err
	}
}

async function add(product) {
	try {
		const collection = await dbService.getCollection('product')
		await collection.insertOne(product)

		return product
	} catch (err) {
		logger.error('cannot insert product', err)
		throw err
	}
}

async function update(product) {
    const productToSave = { vendor: product.vendor, speed: product.speed }

    try {
        const criteria = { _id: ObjectId.createFromHexString(product._id) }

		const collection = await dbService.getCollection('product')
		await collection.updateOne(criteria, { $set: productToSave })

		return product
	} catch (err) {
		logger.error(`cannot update product ${product._id}`, err)
		throw err
	}
}

async function addProductMsg(productId, msg) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(productId) }
        msg.id = makeId()
        
		const collection = await dbService.getCollection('product')
		await collection.updateOne(criteria, { $push: { msgs: msg } })

		return msg
	} catch (err) {
		logger.error(`cannot add product msg ${productId}`, err)
		throw err
	}
}

async function removeProductMsg(productId, msgId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(productId) }

		const collection = await dbService.getCollection('product')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId }}})
        
		return msgId
	} catch (err) {
		logger.error(`cannot add product msg ${productId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
    const criteria = {
        vendor: { $regex: filterBy.txt, $options: 'i' },
        speed: { $gte: filterBy.minSpeed },
    }

    return criteria
}

function _buildSort(filterBy) {
    if(!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}