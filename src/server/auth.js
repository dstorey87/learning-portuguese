import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import csrf from 'csurf';
/* global process */
import { upsertUser, getUserById, getSubscription } from './storage.js';

const FileStore = FileStoreFactory(session);

function getSessionConfig() {
    const secret = process.env.SESSION_SECRET || 'change_me';
    const secureCookies = process.env.NODE_ENV === 'production';
    return {
        store: new FileStore({
            path: './.sessions',
            retries: 1
        }),
        name: 'lp.sid',
        secret,
        resave: false,
        saveUninitialized: false,
        proxy: true,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: secureCookies,
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    };
}

function configureGoogleStrategy() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${process.env.PUBLIC_API_URL || 'http://localhost:3001'}/auth/google/callback`;

    if (!clientID || !clientSecret) {
        console.warn('[auth] Google OAuth is not configured - missing client ID/secret');
        return;
    }

    passport.use(new GoogleStrategy({ clientID, clientSecret, callbackURL }, (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || email || 'Learner';
            const userId = `google-${profile.id}`;
            const user = upsertUser({
                id: userId,
                email,
                name,
                googleId: profile.id,
                picture: profile.photos?.[0]?.value,
                provider: 'google'
            });
            return done(null, { id: user.id, email: user.email, name: user.name, picture: user.picture });
        } catch (err) {
            return done(err);
        }
    }));
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = getUserById(id);
    if (!user) return done(null, false);
    return done(null, { id: user.id, email: user.email, name: user.name, picture: user.picture });
});

function getCsrfProtection() {
    return csrf({ cookie: false });
}

export function registerAuth(app) {
    app.use(session(getSessionConfig()));
    configureGoogleStrategy();
    app.use(passport.initialize());
    app.use(passport.session());

    const csrfProtection = getCsrfProtection();

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/auth/failure'
    }), (req, res) => {
        const redirectTarget = process.env.PUBLIC_APP_URL || 'http://localhost:4321';
        res.redirect(`${redirectTarget}?auth=success`);
    });

    app.get('/auth/failure', (req, res) => {
        res.status(401).json({ error: 'Authentication failed' });
    });

    app.get('/auth/me', (req, res) => {
        if (!req.user) {
            return res.json({ authenticated: false });
        }
        const subscription = getSubscription(req.user.id);
        res.json({
            authenticated: true,
            user: req.user,
            subscription
        });
    });

    app.post('/auth/logout', csrfProtection, (req, res, next) => {
        req.logout(err => {
            if (err) return next(err);
            req.session.destroy(() => {
                res.json({ success: true });
            });
        });
    });

    app.get('/auth/csrf', csrfProtection, (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
    });
}
