"use strict";

/**
    Configures and exposes an express-session instance
**/

const config = require(`../config`);
const session = require(`express-session`);
const mongoStore = require(`connect-mongo`)(session);
const db = require(`../db`);
const logger = require(`../logger`).appLogger;

logger.setup(`Initializing the SESSION module`, {identifier: `session`});

const store = new mongoStore({
    mongooseConnection: db.mongo.connection,
    collection: `sessions`
});

module.exports = {
    session: session({
        key: config.sessionKey,
        secret: config.sessionSecret,
        resave: true,
        saveUninitialized: true,
        store,
        cookie: {
            httpOnly: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    }),
    store
};
