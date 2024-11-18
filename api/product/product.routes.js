import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getProducts, getProductById, addProduct, updateProduct, removeProduct, addProductMsg, removeProductMsg } from './product.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getProducts)
router.get('/:id', log, getProductById)
router.post('/', log, requireAuth, addProduct)
router.put('/:id', requireAuth, updateProduct)
router.delete('/:id', requireAuth, removeProduct)
// router.delete('/:id', requireAuth, requireAdmin, removeProduct)

router.post('/:id/msg', requireAuth, addProductMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeProductMsg)

export const productRoutes = router