<<<<<<< HEAD
const express = require('express');
const passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
var db = require('../db');
var router = express.Router();
passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile']
}, function verify(issuer, profile, cb) {
    db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
        issuer,
        profile.id
    ], function (err, row) {
        if (err) { return cb(err); }
        if (!row) {
            db.run('INSERT INTO users (name) VALUES (?)', [
                profile.displayName
            ], function (err) {
                if (err) { return cb(err); }

                var id = this.lastID;
                db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
                    id,
                    issuer,
                    profile.id
                ], function (err) {
                    if (err) { return cb(err); }
                    var user = {
                        id: id,
                        name: profile.displayName
                    };
                    return cb(null, user);
                });
            });
        } else {
            db.get('SELECT * FROM users WHERE id = ?', [row.user_id], function (err, row) {
                if (err) { return cb(err); }
                if (!row) { return cb(null, false); }
                return cb(null, row);
            });
        }
    });
}));

router.get('/login', (req, res, next) => {
    res.render('login')
});
router.get('/login/federated/google', passport.authenticate('google'));
=======
var express = require('express');
const passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var db = require('../db');
var router = express.Router();

passport.use(new LocalStrategy(function verify(username, password, cb) {
    db.get('SELECT * FROM users WHERE username = ?', [username], function (err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

        crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function (err, hashedPassword) {
            if (err) { return cb(err); }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
            return cb(null, row);
        });
    });
}));

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.get('/login', function (req, res, next) {
    res.render('login');
});
>>>>>>> 1387595c076eeb55834278286a0ca062f83eef7b

module.exports = router;