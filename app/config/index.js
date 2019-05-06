"use strict";

const fs = require(`graceful-fs`);
const appRoot = require(`app-root-path`);

let configPath = `${appRoot}/config/config.json`;
if (fs.existsSync(configPath)){
    module.exports = require(configPath);
} else {
    throw(`Config not found`);
}
