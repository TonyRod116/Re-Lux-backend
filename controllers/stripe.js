import express from 'express'
import Stripe from 'stripe'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Stripe route
router.post('/purchase-intent', async (req, res, next) => {
    try {
        const { amount } = req.body
        const purchaseIntent = await stripe.purchaseIntents.create({
            amount,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
        })
        res.json({ clientSecret: purchaseIntent.client_secret })
    } catch (error) {
        console.log(error)
        next(error)
    }
})


export { router as stripeRouter }