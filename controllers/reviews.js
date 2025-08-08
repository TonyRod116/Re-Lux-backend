import express from 'express'

import User from '../models/user.js'
import Review from '../models/review.js'

import verifyToken from '../middleware/verifyToken.js'

// Custom errors
import { NotFoundError, UnauthorizedError } from '../utils/errors.js'

const router = express.Router()


// * Create
router.post('/:userId/reviews', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const review = await Review.create({
      ...req.body,
      owner: req.user._id,
      reviewedUser: userId,
    })
      
    return res.status(201).json(review)
  } catch (error) {
    next(error)
  }
})



// * Update
router.put('/:userId/reviews/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const review = await Review.findById(reviewId)
    if (!review) throw new NotFoundError('Review not found')

    const reviewToUpdate = await Review.findByIdAndUpdate(
      reviewId, req.body, 
      { new: 'True' }
    )

    // In Mongoose, new: false (default) → returns the document as it was before the update*
    // new: true → returns the document after the update (the updated version)

    return res.json(reviewToUpdate)
  } catch (error) {
    next(error)
  }
})

// * Delete
router.delete('/:userId/reviews/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const reviewToDelete = await Review.findById(reviewId)
    if (!reviewToDelete) throw new NotFound('Review not found')

    if (!reviewToDelete.owner.equals(req.user._id)) throw new UnauthorizedError()

    await reviewToDelete.remove()
    return res.sendStatus(204)

  } catch (error) {
    next(error)
  }
})

export { router as reviewsRouter }