import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/errors.js'
import User from '../models/user.js'



const verifyToken = async (req, res, next) => {
  try {

const authHeader = req.headers.authorization
// 1. verify an auth header is provided
if (!authHeader) throw new UnauthorizedError('No authorization header provided')

  // 2. get the token from the header
  const token = authHeader.split(' ')[1]
  if (!token) throw new UnauthorizedError('No token provided')

  // 3. verify the token is JWT
  const payload = jwt.verify(token, process.env.TOKEN_SECRET)

  // 4. add the user to the request object
const foundUser = await User.findById(payload.user._id)

// 5 before passong the request to the controller, we will make the logged in user (thge foundUser above) available on req.user
req.user = foundUser

// 6. pass the request to the controller
next()

  } catch (error) {
    next(error)
  }
}

export default verifyToken