import express from 'express'        
import 'dotenv/config'                
import morgan from 'morgan'        
import mongoose from 'mongoose'     
import verifyToken from './middleware/verifyToken.js'
import cors from 'cors'

// *Middleware
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/errorHandler.js'

// *Routers
import { usersRouter } from './controllers/users.js'
import { itemsRouter } from './controllers/items.js'
import { stripeRouter } from './controllers/stripe.js'
import { reviewsRouter } from './controllers/reviews.js'

const app = express()
const port = process.env.PORT || 3000 

// *Middleware
app.use(express.json())
app.use(morgan('dev'))

// *Routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))

app.use('/items', itemsRouter)
app.use('/users', usersRouter)
app.use('/api/auth', usersRouter)
app.use('/', stripeRouter)

// * protected route
app.get('/protected', verifyToken, (req, res, next) => {
  res.json({ message: 'This is a protected route' })
})

app.get('/', (req, res) => {
  res.json({ message: 'server home route is running🚀' })
})

// *Error handling middleware 
app.use(notFound)
app.use(errorHandler)

const startServers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('🛢️ Database connected')
    
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`))
  } catch (error) {
    console.log(error)
  }
}

startServers()

