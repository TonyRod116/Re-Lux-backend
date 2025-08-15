# Re-Lux Backend

## Description

This is the backend API for Re-Lux, a luxury fashion marketplace platform built during my software engineering course. The project focuses on creating a robust REST API that handles user authentication, item management, reviews, and favorites functionality. This backend serves as the foundation for a full-stack application where users can buy, sell, and trade luxury fashion items.

## Deployment Link

The backend is deployed on Netlify and can be accessed at: [https://re-lux-backend.netlify.app/](https://re-lux-backend.netlify.app/)

The API is currently running and responding with the message: `{"message":"server home route is running🚀"}`

## Getting Started/Code Installation

To run this project locally, follow these steps:

1. Clone the repository:
```bash
git clone https://github.com/TonyRod116/Re-Lux-backend.git
cd Re-Lux-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
TOKEN_SECRET=your_jwt_secret_key
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Timeframe & Working Team

This project was completed as a **pair programming** collaboration with **Katie** ([KatieHill-Fr-Gr](https://github.com/KatieHill-Fr-Gr)) during a 1-week sprint from Friday to Friday, including weekend work. We worked together to plan, design, and implement both the backend API and frontend, collaborating on all aspects of the project.

## Technologies Used

### Back End
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT (JSON Web Tokens)** - Authentication
- **bcrypt** - Password hashing
- **Morgan** - HTTP request logger
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Development Tools
- **Nodemon** - Development server with auto-reload
- **Git** - Version control
- **Netlify** - Deployment platform

## Brief

The project brief was to create a luxury fashion marketplace platform where users can:
- Register and authenticate securely
- List luxury fashion items for sale
- Browse and search through available items
- Make offers on items
- Add items to favorites
- Leave reviews for other users
- Manage their profile and listings

The backend needed to provide a secure, scalable API that could handle user authentication, data persistence, and business logic for the marketplace functionality.

## Planning

### Initial Architecture Planning
We started by designing the database schema and API structure. I created an Entity Relationship Diagram (ERD) to plan the data models:

- **User Model**: Handles authentication, profile information, and user relationships
- **Item Model**: Manages product listings with categories, pricing, and offer system
- **Review Model**: Enables user feedback and rating system
- **Favorite Model**: Tracks user's favorite items

### API Endpoint Planning
I planned the REST API structure with clear separation of concerns:
- `/api/auth` - User authentication (signup/signin)
- `/users` - User profile management
- `/items` - Item CRUD operations and marketplace functionality
- `/reviews` - User review system
- `/favorites` - User favorites management

### Security Planning
- JWT-based authentication system
- Password hashing with bcrypt
- Protected routes for sensitive operations
- Input validation and error handling

## Build/Code Process

### 1. Project Setup and Dependencies
I started by setting up the Express server with essential middleware and configuring the MongoDB connection:

```javascript
// server.js - Main server configuration
import express from 'express'
import 'dotenv/config'
import morgan from 'morgan'
import mongoose from 'mongoose'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(morgan('dev'))
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
```

### 2. Database Models Implementation
I created comprehensive Mongoose schemas with proper validation and relationships:

```javascript
// models/item.js - Item schema with offers system
const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: ['Please provide a title.', true],
  },
  type: {
    type: String,
    enum: ["handbag", "shoes", "dress", "jacket", "trousers", "pants", "watch", "jewelry", "coat", "skirt", "suit", "shirt", "blouse", "sweater", "jumper", "scarf", "belt", "sunglasses", "wallet", "purse", "clutch", "smart watch", "smart glasses", "fitness tracker", "smart ring", "wireless earbuds", "noise-canceling headphones", "smartphone", "tablet", "latop", "smart speaker", "VR headset", "candle", "fragrance", "vase", "side table", "candle holder", "tray", "lamp", "trunk", "towel", "bathrobe", "rug", "soft furnishing", "coffee table"],
    required: ['Please provide a type.', true],
  },
  price: {
    type: Number,
    min: 1,
    required: ['Please provide a minimum price.', true],
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
    }
  }]
}, {
  timestamps: true 
})
```

### 3. Authentication System
I implemented a secure JWT-based authentication system with password hashing:

```javascript
// controllers/users.js - User authentication
router.post('/sign-up', async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirmation} = req.body

    // Check if username already exists
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // password confirmation
    if (password !== passwordConfirmation) {
      throw new InvalidDataError('Passwords do not match.', 'password')
    }

    // create user
    const newUser = await User.create({ username, email, password })

    // JWT user info token
    const token = generateToken(newUser)

    return res.status(201).json({token:token})
  } catch (error) {
    next(error)
  }
})
```

### 4. Item Management System
I built a comprehensive item management system with favorites and offers functionality:

```javascript
// controllers/items.js - Items with favorites integration
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
```

### 5. Review System
I implemented a user review system with validation and aggregation:

```javascript
// controllers/reviews.js - Review creation and management
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

    res.status(201).json({
      message: 'Review created successfully',
      review
    })
  } catch (error) {
    next(error)
  }
})
```

### 6. Middleware and Error Handling
I created custom middleware for authentication and comprehensive error handling:

```javascript
// middleware/verifyToken.js - JWT verification
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) throw new UnauthorizedError('No authorization header provided')

    const token = authHeader.split(' ')[1]
    if (!token) throw new UnauthorizedError('No token provided')

    const payload = jwt.verify(token, process.env.TOKEN_SECRET)
    const foundUser = await User.findById(payload.user._id)
    req.user = foundUser

    next()
  } catch (error) {
    next(error)
  }
}
```

## Challenges

### 1. JWT Token Implementation
**Challenge**: Implementing secure JWT authentication with proper token verification and user session management.

**Solution**: I created a robust middleware system that verifies tokens, extracts user information, and maintains secure user sessions across protected routes.

### 2. Complex Data Relationships
**Challenge**: Managing complex relationships between users, items, offers, and favorites while maintaining data consistency.

**Solution**: I designed a flexible schema structure with proper references and implemented aggregation queries to efficiently retrieve related data.

### 3. Input Validation and Error Handling
**Challenge**: Creating a comprehensive error handling system that provides meaningful feedback to the frontend.

**Solution**: I implemented custom error classes and middleware that catch and format errors appropriately, ensuring consistent API responses.

### 4. Database Query Optimization
**Challenge**: Optimizing database queries for items with favorites and offers to avoid N+1 query problems.

**Solution**: I used Mongoose's populate functionality and aggregation pipelines to efficiently retrieve related data in single queries.

## Wins

### 1. Robust Authentication System
I'm particularly proud of the secure authentication system I built, which includes proper password hashing, JWT token management, and protected route middleware.

### 2. Efficient Data Architecture
The database schema design efficiently handles complex relationships between users, items, offers, and favorites while maintaining good performance.

### 3. Comprehensive API Design
The REST API provides a clean, intuitive interface for all marketplace functionality with proper HTTP status codes and error handling.

### 4. Clean Code Structure
The codebase follows good practices with clear separation of concerns, reusable middleware, and consistent error handling patterns.

## Key Learnings/Takeaways

### Technical Skills Development
- **Express.js**: I gained deep understanding of Express middleware, routing, and error handling patterns
- **MongoDB/Mongoose**: I learned advanced querying techniques, aggregation pipelines, and schema design best practices
- **JWT Authentication**: I mastered implementing secure authentication systems with proper token management
- **API Design**: I developed strong skills in RESTful API design with proper HTTP methods and status codes

### Engineering Process Growth
- **Pair Programming**: Working with Katie ([KatieHill-Fr-Gr](https://github.com/KatieHill-Fr-Gr)) taught me effective collaboration techniques and code review practices
- **Project Planning**: I learned the importance of thorough planning before coding, especially for complex data relationships
- **Error Handling**: I developed a systematic approach to error handling that improves user experience and debugging
- **Database Design**: I gained experience in designing efficient database schemas that balance flexibility with performance

## Bugs

Currently, there are no known bugs in the backend system. All endpoints have been tested and are functioning as expected.

## Future Improvements

### 1. Enhanced Search and Filtering
- Implement advanced search with text indexing
- Add filtering by price range, location, and item type
- Implement sorting options for search results

### 2. Real-time Features
- Add WebSocket support for real-time notifications
- Implement live chat between buyers and sellers
- Add real-time updates for offer status changes

### 3. Performance Optimizations
- Implement Redis caching for frequently accessed data
- Add database indexing for better query performance
- Implement pagination for large datasets

### 4. Additional Features
- Add image upload and management system
- Implement a messaging system between users
- Add analytics and reporting features for sellers
- Implement a recommendation system based on user preferences
- **Re-New Service**: Partner with local dry cleaners to offer item renewal service where users can pay a small fee (based on item type - coat, shirt, etc.) to have items professionally cleaned before shipping, essentially "renewing" the clothing
- **Custom Auction System**: Implement an in-house auction platform currently in development, allowing users to bid on luxury items with real-time bidding functionality

---

*This README reflects my individual contributions to the Re-Lux backend project, completed in collaboration with Katie during our pair programming sprint.*
