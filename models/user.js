import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: ['Please provide a username.', true],
      unique: true
    },
    email: {
      type: String,
      required: ['Please provide an email.', true],
      unique: true
    },
    password: {
      type: String,
      required: ['Please provide a password.', true]
    }
    
})

// Hash the password just before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hashSync(this.password, 12)
  next()
})


const User = mongoose.model('User', userSchema)

export default User