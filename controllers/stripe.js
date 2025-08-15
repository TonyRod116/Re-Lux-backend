import express from 'express'
import Stripe from 'stripe'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Stripe route
router.post('/purchase-intent', async (req, res, next) => {
    console.log('Route hit!');
    console.log('Request body:', req.body);

    const { amount, cartItems, currency = 'eur' } = req.body;

    try {

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const serverTotal = cartItems.reduce((total, item) => {
            return total + item.price;
        }, 0);

        const serverAmountInCents = Math.round(serverTotal * 100);

        if (amount !== serverAmountInCents) {
            return res.status(400).json({
                error: 'Amount mismatch between frontend and backend',
                expected: serverAmountInCents,
                received: amount
            });
        }


        const paymentIntent = await stripe.paymentIntents.create({
            amount: serverAmountInCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
        })

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            error: 'Failed to create payment intent',
            message: error.message
        });
    }
})


export { router as stripeRouter }