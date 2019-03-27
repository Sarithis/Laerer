`use strict`;

/**
    Exposes an object which can log data in the defined destination containers
**/

const winston = require(`winston`);
require(`winston-daily-rotate-file`); //No need to assign it
const appRoot = require(`app-root-path`);
const config = require(`../config`);
const colors = require(`colors`);

const customLevels = {
    levels: {
        http: 8,
        api: 7,
        silly: 6,
        setup: 5,
        debug: 4,
        verbose: 3,
        info: 2,
        warn: 1,
        error: 0
    },
    colors: {
        http: `italic grey`,
        api: `italic magenta`,
        silly: `grey`,
        setup: `white`,
        debug: `blue`,
        verbose: `cyan`,
        info: `green`,
        warn: `yellow`,
        error: `red`
    }
};
/**
    Logger of the app itself
**/


const appPrintf = (colorize = false) => {
    return winston.format.printf((info) => {
        const metaObj = {};  //Exclude undefined keys
        let metaString = ``;
        if (info.meta instanceof Object){
            for (let key in info.meta){
                if (info.meta[key] !== undefined){
                    metaObj[key] = info.meta[key];
                }
                if (info.meta[key] instanceof Error){
                    metaObj[key] = info.meta[key].message;
                }
            }
            metaString = config.logging.prettyMeta ? JSON.stringify(metaObj, null, 4) : JSON.stringify(metaObj);
        } else if (typeof info.meta === `string`){
            metaString = info.meta;
        }
        if (typeof metaString === `string` && config.logging.maxMetaLength < metaString.length){
            metaString = `Too long (${metaString.length} characters)`;
        }
        let identifier = info.identifier ? info.identifier : `Nieznany`;
        if (identifier && identifier.indexOf(`callback=jQuery`) > -1){
            identifier = info.identifier.substring(0, info.identifier.indexOf(`callback=jQuery`) - 1); //Also remove the '?' or '&' char
        }
        identifier = colorize ? colors.italic.bold.black(identifier) : identifier;
        const timestamp = info.timestamp;
        const level = info.level;
        const callId = info.callId ? ` ${colorize ? colors.italic.grey(info.callId) : info.callId}` : ``;
        const message = info.message;
        let meta = ``;
        if (Object.keys(metaObj).length > 0){
            meta = colorize ? colors.dim(` | META: ` + metaString) : metaString;
        }
        const finalMessage = `${timestamp} - ${level} [${identifier}]${callId}: ${message} ${meta}`;
        return finalMessage;
    });
};

const appFormatter = (colorize = false) => {
    if (colorize) {
        return winston.format.combine(
            winston.format.colorize(),
            appPrintf(colorize)
        );
    } else {
        return winston.format.combine(
            appPrintf(colorize)
        );
    }
};

const appLogger = winston.createLogger({
    levels: customLevels.levels,
    format: winston.format.combine(
        (winston.format((info, opts) => { //Don't log when logging is set to false
            for (let i = 0; i < appLogger.transports.length; i++){
                appLogger.transports[i].level = config.logging.level; //Update the logging level in case of configuration change
            }
            if (!info || info.logging === false){
                return false;
            } else {
                return info;
            }
        }))(),
        winston.format.timestamp()
    ),
    transports: [
        new (winston.transports.Console)({
            format: appFormatter(true),
            name: `appConsole`,
            level: config.logging.level,
            handleExceptions: true,
        }),
    ],
    exitOnError: false,
});
winston.addColors(customLevels.colors);

/**
    HTTP traffic logger
**/

const httpLogger = winston.createLogger({
    levels: customLevels.levels,
    transports: [
        new (winston.transports.DailyRotateFile)({
            //filename: appRoot + `/logs/http_${(new Date()).getTime()}_.log`,
            filename: `${appRoot}/logs/http.log`,
            name: `httpFile`,
            datePattern: `YYYY-MM-DD-HH`,
            level: `http`,
            handleExceptions: true,
            prettyPrint: true,
            maxsize: `20M`,
            maxFiles: `30d`
        }),
    ],
    exitOnError: false,
});

httpLogger.stream = { //This will be used by Morgan
    write: (message, encoding) => {
        httpLogger.http(message);
    }
};

module.exports = {
    appLogger,
    httpLogger
};
