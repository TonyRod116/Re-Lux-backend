import jwt from 'jsonwebtoken'

export const generateToken = (user) => {
  return jwt.sign(
    {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        profilePic: user.profilePic,
        avatar: user.avatar
      }
    }, // 1st arg: payload
    process.env.TOKEN_SECRET, // 2nd arg: Secret
    { expiresIn: '2d' } // 3rd arg: options object
  )
}
