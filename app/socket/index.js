"use strict";

const helpers = require(`../helpers`);
const logger = require(`../logger`).appLogger;

module.exports = (io, app) => {
    const userSessions = app.locals.userSessions;
    io.of(`/panel`).on(`connection`, (socket) => {
        socket.on(`disconnect`, () => {
            logger.log(`verbose`, `socket: ${socket.id} disconnected`);
        });
    });
}
