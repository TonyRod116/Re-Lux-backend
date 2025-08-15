import mongoose from "mongoose"

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  }
}, {
  timestamps: true
})

// compound index to avoid duplicates
favoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true })

const Favorite = mongoose.model('Favorite', favoriteSchema)
export default Favorite