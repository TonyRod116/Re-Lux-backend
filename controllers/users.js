import User from '../models/user.js'
import express from 'express'
import { InvalidDataError, UnauthorizedError } from '../utils/errors.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import verifyToken from '../middleware/verifyToken.js'
import { generateToken } from '../utils/tokens.js'


const router = express.Router()

// *Starting path: /api/auth
// *Sign Up
router.post('/sign-up', async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirmation} = req.body

    // password confirmation
    if (password !== passwordConfirmation) {
      throw new InvalidDataError('Passwords do not match.', 'password')
    }

    // create user
    const newUser = await User.create({ username, email, password })

    // JWT user info token
    const token = generateToken(newUser)

    // Send the response to the client
    return res.status(201).json({token:token})



  } catch (error) {
    next(error)
    }
})

// *Sign In
router.post('/sign-in', async (req, res, next) => {
  try {
    //search for the user by username OR email
const foundUser = await User.findOne({$or:[{username:req.body.identifier},{email:req.body.identifier}]})

    if (!foundUser) {throw new UnauthorizedError('User not found')}

    // compare the hash against the provded plain text password
    if (!bcrypt.compareSync(req.body.password, foundUser.password)) {
      throw new UnauthorizedError('Password is incorrect')
    }

// generate the token
const token = generateToken(foundUser)

// send the response to the client
    // res.status(200).json({token:token})

    // responded message
    res.status(200).json({
      message: 'Login successful',
      user: foundUser,
      token
    })
  } catch (error) {
    next(error)
  }
})


// * Profile

router.get('/users/:username', async (req, res) => {
  try {
      const viewer = req.session?.user || null;
      const profileUser = await User.findOne({ username: req.params.username });
      if (!profileUser) {
          return res.status(404).json({ message: 'User not found' });
      }
      const isOwner = viewer && viewer._id.toString() === profileUser._id.toString();
      // Always fetch public items (or all if owner)1
      const myItems = await Item.find({
          contributor: profileUser._id,
          ...(isOwner ? {} : { visibility: 'public' })  // Optional filtering
      }).populate('contributor');
      // Only return liked items if profile owner
      const likedItems = isOwner
          ? await Item.find({ likedbyUsers: profileUser._id }).populate('contributor')
          : [];
      // Build the profile response
      const profile = {
          username: profileUser.username,
          avatar: profileUser.avatar || null,
          bio: profileUser.bio || '',
          items: myItems,
          ...(isOwner && {
              likedItems,
              email: profileUser.email,
          })
      };
      return res.json(profile);
  } catch (error) {
      next(error);
  }
});


export { router as usersRouter }