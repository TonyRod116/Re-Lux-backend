import express from 'express'
import Item from '../models/item.js'
import Favorite from '../models/favorite.js'
import verifyToken from '../middleware/verifyToken.js'

// Custom errors
import { NotFoundError, UnauthorizedError } from '../utils/errors.js'

const router = express.Router()

// Starting path for this router: /items

// * Index - Get all items
router.get('/', async (req, res, next) => {
  try {
    const items = await Item.find().populate('seller', 'username')
    return res.json(items)
  } catch (error) {
    next(error)
  }
})

// * Index with favorites - NEW ENDPOINT for frontend
router.get('/with-favorites', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    
    // Get all items with seller info
    const items = await Item.find()
      .populate('seller', 'username')
      .populate('offers.buyer', 'username')
    
    // Get user's favorites
    const userFavorites = await Favorite.find({ userId })
    const favoriteItemIds = userFavorites.map(fav => fav.itemId.toString())
    
    // Add isFavorited field to each item
    const itemsWithFavorites = items.map(item => ({
      ...item.toObject(),
      isFavorited: favoriteItemIds.includes(item._id.toString())
    }))
    
    res.json(itemsWithFavorites)
  } catch (error) {
    next(error)
  }
})

// * Get favorites - UPDATED
router.get('/favorites', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    
    // Get user's favorites with item details
    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'itemId',
        populate: { path: 'seller', select: 'username' }
      })
    
    const favoriteItems = favorites.map(fav => ({
      ...fav.itemId.toObject(),
      isFavorited: true
    }))
    
    res.json(favoriteItems)
  } catch (error) {
    next(error)
  }
})

// * Types 
router.get("/types", async (req, res, next) => {
  try {
    const enumValues = Item.schema.path("type").enumValues
    res.json(enumValues)
  } catch (error) {
    next(error)
  }
})

// * Get offers made by a specific user
router.get('/offers/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    
    // Find all items that have offers from this user
    const itemsWithOffers = await Item.find({
      'offers.buyer': userId
    }).populate('seller', 'username')
    
    // Transform the data to show user's offers
    const userOffers = []
    
    itemsWithOffers.forEach(item => {
      // Find offers made by this user
      const userItemOffers = item.offers.filter(offer => 
        offer.buyer.toString() === userId
      )
      
      // Create offer objects with item info
      userItemOffers.forEach(offer => {
        userOffers.push({
          _id: offer._id,
          amount: offer.amount,
          status: offer.status,
          createdAt: offer.createdAt,
          item: {
            _id: item._id,
            title: item.title,
            price: item.price,
            images: item.images,
            seller: item.seller
          }
        })
      })
    })
    
    // Sort by creation date (newest first)
    userOffers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    res.json(userOffers)
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

// * FAVORITES ROUTES - UPDATED

// Toggle favorite - NEW ENDPOINT for frontend
router.post('/:itemId/toggle-favorite', verifyToken, async (req, res, next) => {
  try {
    const { itemId } = req.params
    const userId = req.user._id
    
    // Check if favorite already exists
    const existingFavorite = await Favorite.findOne({ userId, itemId })
    
    if (existingFavorite) {
      // Remove favorite
      await Favorite.findByIdAndDelete(existingFavorite._id)
      
      // Update item's favouritedBy array
      await Item.findByIdAndUpdate(itemId, {
        $pull: { favouritedBy: userId }
      })
      
      res.json({ 
        success: true, 
        message: 'Favorite removed', 
        isFavorited: false 
      })
    } else {
      // Add favorite
      const newFavorite = new Favorite({ userId, itemId })
      await newFavorite.save()
      
      // Update item's favouritedBy array
      await Item.findByIdAndUpdate(itemId, {
        $addToSet: { favouritedBy: userId }
      })
      
      res.json({ 
        success: true, 
        message: 'Favorite added', 
        isFavorited: true 
      })
    }
  } catch (error) {
    next(error)
  }
})

// Add to favorites - LEGACY (can be removed later)
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

// Remove from favorites - LEGACY (can be removed later)
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

// Check if item is in favorites - LEGACY (can be removed later)
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

// * OFFER MANAGEMENT

// Accept offer
router.put('/:itemId/offers/:offerId/accepted', verifyToken, async (req, res, next) => {
  try {
    const { itemId, offerId } = req.params
    const userId = req.user._id

    // Find the item and verify ownership
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    // Check if the user owns this item
    if (!item.seller.equals(userId)) {
      return res.status(403).json({ message: 'You can only manage offers for your own items' })
    }

    // Find and update the offer
    const offer = item.offers.id(offerId)
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' })
    }

    // Update offer status
    offer.status = 'accepted'
    await item.save()

    res.json({ message: 'Offer accepted successfully', offer })
  } catch (error) {
    next(error)
  }
})

// Reject offer
router.put('/:itemId/offers/:offerId/rejected', verifyToken, async (req, res, next) => {
  try {
    const { itemId, offerId } = req.params
    const userId = req.user._id

    // Find the item and verify ownership
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    // Check if the user owns this item
    if (!item.seller.equals(userId)) {
      return res.status(403).json({ message: 'You can only manage offers for your own items' })
    }

    // Update offer status
    offer.status = 'rejected'
    await item.save()

    res.json({ message: 'Offer rejected successfully', offer })
  } catch (error) {
    next(error)
  }
})

export { router as itemsRouter }