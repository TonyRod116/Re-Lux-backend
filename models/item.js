import mongoose from "mongoose"


const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: ['Please provide a title.', true],
  },
  type: {
    type: String,
    enum: ["handbag", "shoes", "dress", "jacket", "trousers", "pants", "watch", "jewelry", "coat", "skirt", "suit", "shirt", "blouse", "sweater", "jumper", "scarf", "belt", "sunglasses", "wallet", "purse", "clutch",
      "smart watch", "smart glasses", "fitness tracker", "smart ring", "wireless earbuds", "noise-canceling headphones", "smartphone", "tablet", "latop", "smart speaker", "VR headset",
    "candle", "fragrance", "vase", "side table", "candle holder", "tray", "lamp", "trunk", "towel", "bathrobe", "rug", "soft furnishing", "coffee table"],
    required: ['Please provide a type.', true],
  },
  description: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  favouritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  images: {
    type: [String],
    required: false
  },
  price: {
    type: Number,
    min: 1,
    required: ['Please provide a minimum price.', true],
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  offers: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      min: 10,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  }],
}, {
  timestamps: true 
})


const Item = mongoose.model('Item', itemSchema)

export default Item