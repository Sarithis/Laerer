`use strict`;

const passport = require(`passport`);
const config = require(`../config`);
const db = require(`../db`).mongo;
const logger = require(`../logger`).appLogger;
const localStrategy = require(`passport-local`);
const authFunctions = require(`./functions.js`);
const h = require(`../helpers`);

/**
    Checks the supplied password and login against the user's mongoDB record
**/
const authProcessor = (req, login, password, done) => {
    logger.verbose(`Starting to authenticate ${login}`, {identifier: `auth authProcessor`});
    db.models.user.findOne({login}).select(`+password`).exec().then((user) => {
        if (!user){ //If the user wasn't found
            logger.warn(`Login attempt failed from ${req.connection.remoteAddress}: user ${login} doesn't exist`, {identifier: `auth authProcessor`});
            return done(null, false, req.flash(`error`, `This user doesn't exist or the password is wrong`));
        } else if (!authFunctions.isValidPassword(user, password)){ //If the user was found, but his password wasn't valid
            logger.warn(`Login attempt failed from ${req.connection.remoteAddress}: password for ${login} is incorrect`, {identifier: `auth authProcessor`});
            return done(null, false, req.flash(`error`, `This user doesn't exist or the password is wrong`));
        } else { //Everything ok
            logger.debug(`Login attempt of ${login} succeeded from ${req.connection.remoteAddress}`, {identifier: `auth authProcessor`});
            return done(null, user);
        }
    }).catch((error) => {
        logger.error(`Error while trying to find a user ${login}: ${h.optionalStringify(error)}`, {identifier: `auth authProcessor`});
        return done(null, false, req.flash(`error`, `Unknown error`));
    });
};

/**
    Checks if the supplied login exists in the database. If not, creates a new user
**/
const signupProcessor = (req, login, password, done) => {
    logger.verbose(`Starting to singup ${login}`, {identifier: `auth singupProcessor`});
    db.models.user.findOne({login}).exec().then((user) => {
        if (user){ //If the user was found
            logger.warn(`Signup attempt failed from ${req.connection.remoteAddress}: user ${login} already exist`, {identifier: `auth singupProcessor`});
            return done(null, false, req.flash(`error`, `This username is already taken, try another one!`));
        }
        const newUser = new db.models.user();
        newUser.password = h.generateHash(password);
        newUser.login = login;
        newUser.save((error) => {
            if (error){
                logger.error(`Signup attempt failed from ${req.connection.remoteAddress}: ${h.optionalStringify(error)}`, {identifier: `auth singupProcessor`});
                throw(error);
            }
            logger.info(`Signup attempt successfull from ${req.connection.remoteAddress} for login ${login}`, {identifier: `auth singupProcessor`});
            return done(null, newUser);
        });
    }).catch((error) => {
        logger.error(`Error while trying to find a user ${login}: ${h.optionalStringify(error)}`, {identifier: `auth singupProcessor`});
        return done(null, false, req.flash(`error`, `Unknown error`));
    });
};

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
        db.models.user.findById(id,  {password: false})
            .then((user) => done(null, user.toObject()))
            .catch((error) => logger.error(`Error trying to find a user with id ${id} during deserialization: ${h.optionalStringify(error)}`, {identifier: `auth core`}));
    });
    passport.use(`login`, new localStrategy({
        passReqToCallback: true,
        usernameField: `login`,
        passwordField: `password`
    }, authProcessor));
    passport.use(`signup`, new localStrategy({
        passReqToCallback: true,
        usernameField: `login`,
        passwordField: `password`
    }, signupProcessor));
};
