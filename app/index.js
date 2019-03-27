`use strict`;

const config = require(`./config`);
const logger = require(`./logger`).appLogger;

require(`./auth`).core();

const ioServer = (app) => {
    const server = require(`http`).Server(app);
    const io = require(`socket.io`)(server);
    io.set(`transports`, [`websocket`]); //Allow only websockets transport
    require(`./socket`)(io, app);
    return server;
};

module.exports = {
    router: require(`./router`)(),
    session: require(`./session`).session,
    logger: require(`./logger`),
    config,
    ioServer,
};
