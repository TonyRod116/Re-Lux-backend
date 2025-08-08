import mongoose from "mongoose"


const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: ['Please provide a title.', true],
  },
  type: {
    type: String,
    enum: ["handbag","shoes","dress","jacket","trousers","pants","watch","jewelry","coat","skirt","suit","shirt","blouse","sweater","jumper","scarf","belt","sunglasses","wallet","purse","clutch"],
    required: ['Please provide a type.', true],
  },
  description: {
    type: String,
    required:  false
  },
  location: {
    type: String,
    required: false
  },
  favourited_by_user: {
    type: String,
    required: false
  },
  images: {
    type: String,
    required: false
  },
    price: {
    type: Number,
    min: 1,
    required: ['Please provide a minimum price.', true],
  },
  seller: {
    type: String,
    required: false
  }
})

export default Item