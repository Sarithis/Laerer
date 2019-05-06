"use strict";

const fs = require(`graceful-fs`);
const appRoot = require(`app-root-path`);

let assetsPath = `${appRoot}/assets/`;
if (fs.existsSync(assetsPath)){
    module.exports = {
        norwegian: require(`${assetsPath}/norwegian-synonyms.json`)
    };
} else {
    throw(`Assets not found`);
}
