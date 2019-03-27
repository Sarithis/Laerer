`use strict`;

/**
    Provides connection to databases and exposes all models
**/

const logger = require(`../logger`).appLogger;

logger.setup(`Initializing the DB module`, {identifier: `db`});

module.exports = {
    mongo: require(`./mongo`)
};
