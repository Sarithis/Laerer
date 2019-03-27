`use strict`;

/**
	Scans the current directory and loads all model files
**/

const fs = require(`graceful-fs`);

module.exports = (mongoose) => {
    const allModels = {};
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file !== `index.js`) {
            const fileName = file.match(/.+(?=\.js)/)[0];
            const moduleNameSplit = fileName.split(`.`);
            const moduleName = moduleNameSplit[moduleNameSplit.length - 1];
            allModels[moduleName] = require(`./` + fileName)(mongoose);
        }
    });

    return allModels;
};
