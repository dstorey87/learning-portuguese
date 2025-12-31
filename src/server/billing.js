/* global process */
import Stripe from 'stripe';
import { setSubscription, getSubscription } from './storage.js';

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        console.warn('[billing] Stripe not configured - missing STRIPE_SECRET_KEY');
        return null;
    }
    return new Stripe(key, { apiVersion: '2023-10-16' });
}

function allowedPriceIds() {
    return [
        process.env.STRIPE_PRICE_WEEKLY,
        process.env.STRIPE_PRICE_MONTHLY,
        process.env.STRIPE_PRICE_ANNUAL
    ].filter(Boolean);
}

function ensureAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    return next();
}

export function registerBilling(app) {
    const stripe = getStripe();
    const prices = allowedPriceIds();

    if (!stripe || prices.length === 0) {
        console.warn('[billing] Skipping billing routes - Stripe not fully configured');
        return;
    }

    app.post('/billing/create-checkout-session', ensureAuth, async (req, res) => {
        try {
            const { priceId } = req.body || {};
            if (!priceId || !prices.includes(priceId)) {
                return res.status(400).json({ error: 'Invalid priceId' });
            }
            const successUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/billing/cancel`;

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: successUrl,
                cancel_url: cancelUrl,
                customer_email: req.user.email,
                metadata: {
                    userId: req.user.id
                }
            });

            res.json({ url: session.url });
        } catch (err) {
            console.error('[billing] create-checkout-session failed', err);
            res.status(500).json({ error: 'Failed to create checkout session' });
        }
    });

    // Webhook expects raw body; server must attach express.raw before this handler.
    app.post('/stripe/webhook', async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('[billing] webhook signature verification failed', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (userId) {
                    setSubscription(userId, {
                        active: true,
                        status: 'active',
                        priceId: session.line_items?.data?.[0]?.price?.id || session.display_items?.[0]?.plan?.id,
                        currentPeriodEnd: null
                    });
                }
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.created': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (userId) {
                    setSubscription(userId, {
                        active: sub.status === 'active' || sub.status === 'trialing',
                        status: sub.status,
                        priceId: sub.items?.data?.[0]?.price?.id,
                        currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : null
                    });
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (userId) {
                    setSubscription(userId, {
                        active: false,
                        status: sub.status,
                        priceId: sub.items?.data?.[0]?.price?.id,
                        currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : null
                    });
                }
                break;
            }
            default:
                break;
        }

        res.json({ received: true });
    });

    app.get('/billing/status', ensureAuth, (req, res) => {
        const subscription = getSubscription(req.user.id);
        res.json({ subscription });
    });
}
