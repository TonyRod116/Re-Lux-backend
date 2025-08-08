import express from "express"
const router = express.Router()

// Home page
router.get('/', async (req, res, next) => {
    try {
    } catch (error) {
        console.log(error)
        next(error)
    }
})


export { router as defaultRouter }