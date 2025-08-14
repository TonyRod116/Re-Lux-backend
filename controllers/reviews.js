import express from 'express'
import Review from '../models/review.js'
import verifyToken from '../middleware/verifyToken.js'

// Custom errors
import { NotFoundError, UnauthorizedError } from '../utils/errors.js'

const router = express.Router()

// * Create Review
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { target_user_id, rating, description } = req.body
    const user_id = req.user._id

    // Validate input
    if (!target_user_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Invalid input. Rating must be between 1-5 and target_user_id is required.' 
      })
    }

    // Check if user is trying to review themselves
    if (user_id.toString() === target_user_id) {
      return res.status(400).json({ 
        message: 'You cannot review yourself.' 
      })
    }

    // Check if user has already reviewed this target user
    const existingReview = await Review.findOne({
      user_id: user_id,
      target_user_id: target_user_id
    })

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this user.' 
      })
    }

    // Create the review
    const review = await Review.create({
      user_id,
      target_user_id,
      rating,
      description: description || ''
    })

    // Populate user info for response
    await review.populate('user_id', 'username')

    res.status(201).json({
      message: 'Review created successfully',
      review
    })

  } catch (error) {
    next(error)
  }
})

// * Get reviews for a specific user
router.get('/user/:userId', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.params

    const reviews = await Review.find({ target_user_id: userId })
      .populate('user_id', 'username')
      .sort({ created_at: -1 })

    res.json(reviews)

  } catch (error) {
    next(error)
  }
})

// * Get average rating for a user
router.get('/user/:userId/average', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.params

    const result = await Review.aggregate([
      { $match: { target_user_id: userId } },
      { 
        $group: { 
          _id: null, 
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        } 
      }
    ])

    if (result.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0
      })
    }

    res.json({
      averageRating: result[0].averageRating,
      totalReviews: result[0].totalReviews
    })

  } catch (error) {
    next(error)
  }
})

// * Check if current user has already reviewed a specific user
router.get('/check/:targetUserId', verifyToken, async (req, res, next) => {
  try {
    const { targetUserId } = req.params
    const userId = req.user._id

    const existingReview = await Review.findOne({
      user_id: userId,
      target_user_id: targetUserId
    })

    res.json({
      hasReviewed: !!existingReview
    })

  } catch (error) {
    next(error)
  }
})

// * Update Review
router.put('/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const review = await Review.findById(reviewId)
    if (!review) throw new NotFoundError('Review not found')

    // Check if user owns this review
    if (!review.user_id.equals(req.user._id)) throw new UnauthorizedError()

    const reviewToUpdate = await Review.findByIdAndUpdate(
      reviewId, req.body, 
      { new: true }
    )

    return res.json(reviewToUpdate)
  } catch (error) {
    next(error)
  }
})

// * Delete Review
router.delete('/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const reviewToDelete = await Review.findById(reviewId)
    if (!reviewToDelete) throw new NotFoundError('Review not found')

    // Check if user owns this review
    if (!reviewToDelete.user_id.equals(req.user._id)) throw new UnauthorizedError()

    await reviewToDelete.remove()
    return res.sendStatus(204)

  } catch (error) {
    next(error)
  }
})

export { router as reviewsRouter }