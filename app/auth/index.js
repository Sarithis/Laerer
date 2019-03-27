`use strict`;

/**
    The module provides a local mongoDB authentication method and creates a passport authentication strategy
**/

const logger = require(`../logger`).appLogger;

logger.setup(`Initializing the AUTH module`, {identifier: `auth`});

module.exports = {
    functions: require(`./functions.js`),
    core: require(`./core.js`)
};
