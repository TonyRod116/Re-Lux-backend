import express from 'express'
import Item from '../models/item.js'
import verifyToken from '../middleware/verifyToken.js'

// Custom errors
import { NotFoundError, UnauthorizedError } from '../utils/errors.js'

const router = express.Router()

// Starting path for this router: /items


// * Index
router.get('/', async (req, res, next) => {
  try {
    const items = await Item.find().populate('seller', 'username')
    return res.json(items)
  } catch (error) {
    next(error)
  }
})

// Get favorites
router.get('/favorites', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    
    const favoriteItems = await Item.find({ favouritedBy: userId })
    .populate('seller', 'username')
    .populate('favouritedBy', 'username')
    
    res.json(favoriteItems)
  } catch (error) {
    next(error)
  }
})


// * Types 
router.get("/types", async (req, res, next) => {
  try {
    const enumValues = Item.schema.path("type").enumValues;
    res.json(enumValues);
  } catch (error) {
    next(error)
  }
})




// * Get items by user ID
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    
    // Find all items where seller matches userId
    const userItems = await Item.find({ seller: userId })
    .populate('seller', 'username')
    .populate('offers.buyer', 'username')
    
    return res.json(userItems)
  } catch (error) {
    console.error('Error fetching user items:', error)
    next(error)
  }
})


// * Show specific item
router.get('/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params
    const item = await Item.findById(itemId).populate('seller', 'username')
    if (!item) throw new NotFoundError('Item not found')
      
      return res.json(item)
    } catch (error) {
      next(error)
    }
  })
  

  
  // * Create
  router.post('/', verifyToken, async (req, res, next) => {
    try {
      req.body.seller = req.user._id
      const item = await Item.create(req.body)
      return res.status(201).json(item)
    } catch (error) {
      console.error('Error creating item:', error)  
      next(error)
    }
  })
  
  // * Make an offer
  router.post('/:itemId/offers', verifyToken, async (req, res, next) => {
    try {
      const { itemId } = req.params
      const { amount } = req.body
      const buyerId = req.user._id
      
      // Validate the offer amount
    if (!amount || amount < 10) {
      return res.status(400).json({ 
        message: 'Offer amount must be at least €10' 
      })
    }

    // Find the item
    const item = await Item.findById(itemId).populate('seller', 'username')
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
  
    // Add the new offer
    const newOffer = {
      buyer: buyerId,
      amount: amount,
      status: 'pending',
      createdAt: new Date()
    }
    
    item.offers.push(newOffer)
    await item.save()

    // Populate the buyer information for the response
    await item.populate('offers.buyer', 'username')

    res.status(201).json({
      message: 'Offer submitted successfully',
      offer: newOffer
    })

  } catch (error) {
    console.error('Error creating offer:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})



// * Update
router.put('/:itemId', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const item = await Item.findById(itemId)
    if (!item) throw new NotFoundError('Item not found')

    if (!item.seller._id.equals(req.user._id)) throw new UnauthorizedError()

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
    if (!item) throw new NotFoundError('Item not found')

    if (!item.seller._id.equals(req.user._id)) throw new UnauthorizedError()

    await Item.findByIdAndDelete(itemId)

    return res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

// * FAVORITES ROUTES
// Add to favorites
router.post('/:itemId/favorite', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const userId = req.user._id
    
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    
    // Verify if already favorited
    if (item.favouritedBy.includes(userId)) {
      return res.status(400).json({ message: 'Item already in favorites' })
    }
    
    // Add to favorites
    item.favouritedBy.push(userId)
    await item.save()
    
    res.json({ message: 'Added to favorites', isFavorited: true })
  } catch (error) {
    next(error)
  }
})

// Remove from favorites
router.delete('/:itemId/favorite', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const userId = req.user._id
    
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    
    // Remove from favorites
    item.favouritedBy = item.favouritedBy.filter(id => !id.equals(userId))
    await item.save()
    
    res.json({ message: 'Removed from favorites', isFavorited: false })
  } catch (error) {
    next(error)
  }
})

// Check if item is in favorites
router.get('/:itemId/favorite', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const userId = req.user._id
    
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    
    const isFavorited = item.favouritedBy.includes(userId)
    
    res.json({ isFavorited })
  } catch (error) {
    next(error)
  }
})



export { router as itemsRouter }
