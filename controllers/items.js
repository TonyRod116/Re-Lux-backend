import express from 'express'
import Item from '../models/item.js'
import verifyToken from '../middleware/verifyToken.js'

// Custom errors
import { NotFoundError, UnauthorizedError } from '../utils/errors.js'

const router = express.Router()

// Starting path for this router: /api/items

// * Create
router.post('/new', verifyToken, async (req, res, next) => {
  try {
    req.body.owner = req.user._id
    const item = await Item.create(req.body)
    return res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

// * Index
router.get('', async (req, res, next) => {
  try {
    const items = await Item.find()
    return res.json(items)
  } catch (error) {
    next(error)
  }
})

// * Show
router.get('/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params
    const item = await Item.findById(itemId).populate(['pledges', 'owner'])
    if (!item) throw new NotFound('Item not found')

    return res.json(item)
  } catch (error) {
    next(error)
  }
})

// * Update
router.put('/:itemId', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const item = await Item.findById(itemId)
    if (!item) throw new NotFound('Item not found')

    if (!item.owner.equals(req.user._id)) throw new Forbidden()

    const updatedItem = await Item.findByIdAndUpdate(itemId, req.body, { returnDocument: 'after' })

    return res.json(updatedItem)
  } catch (error) {
    next(error)
  }
})

// * Delete
router.delete('/:itemId', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const item = await Item.findById(itemId)
    if (!item) throw new NotFound('Item not found')

    if (!item.owner.equals(req.user._id)) throw new Forbidden()

    await Item.findByIdAndDelete(itemId)

    return res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

export { router as itemsRouter }