"use strict";

/**
    Provides helper functions used across the whole project
**/

const bCrypt = require(`bcrypt-nodejs`);
const moment = require(`moment-timezone`);

module.exports = {
    /**
        Generates an object with standarized property names which represents a message
        for the user
    **/
    generateFlash: (req) => {
        return {
            error: req.flash(`error`),
            success: req.flash(`success`),
            warning: req.flash(`warning`),
            info: req.flash(`info`)
        };
    },
    getCorrectedTimestamp: () => {
        return moment().tz(`Europe/Warsaw`).subtract(0, `hour`);
    },
    getRandomInt: (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    },
    /**
        Returns an array of paths to populate from the given schema (autopopulate must == true)
    **/
    getSchemaVirtualPaths: (schema) => {
        const virtualPaths = new Array();
        if (typeof schema.virtuals === `object`){
            for (let virtualPath in schema.virtuals){
                const virtual = schema.virtuals[virtualPath];
                if (virtual.options.autopopulate === true){
                    virtualPaths.push(virtualPath);
                }
            }
        }
        const refs = new Array();
        for (let prop in schema.tree){
            const entry = schema.tree[prop];
            if (Array.isArray(entry)){
                for (let innerProp in entry[0]){
                    const innerEntry = entry[0][innerProp];
                    if (typeof innerEntry.ref === `string` && innerEntry.autopopulate === true){
                        refs.push(`${prop}.${innerProp}`);
                    }
                }
            }
            if (typeof entry.ref === `string`){
                refs.push(prop);
            }
        }
        return [...virtualPaths, ...refs];
    },
    /*
        Generates a response which is returned to the client.
        If an argument is undefined, it's replaced with null
    */
    generateApiResponse: (status, data, error) => {
        return{
            status: status !== undefined ? status : null,
            data: data !== undefined ? data : null,
            error: error !== undefined ? error : null
        };
    },
    /**
        Generates a random number that can be used to identify async calls in logger
    **/
    generateCallId: (currentCallId) => {
        return currentCallId === undefined || currentCallId === null ? Math.floor(Math.random() * Math.pow(10, 17)) : currentCallId;
    },
    /**
        Merges many objects into one
    **/
    mergeDeep: (...objects) => {
        const isObject = obj => obj && typeof obj === `object`;
        return objects.reduce((prev, obj) => {
            Object.keys(obj).forEach(key => {
                const pVal = prev[key];
                const oVal = obj[key];

                if (Array.isArray(pVal) && Array.isArray(oVal)) {
                    prev[key] = pVal.concat(...oVal);
                } else if (isObject(pVal) && isObject(oVal)) {
                    prev[key] = module.exports.mergeDeep(pVal, oVal);
                } else {
                    prev[key] = oVal;
                }
            });
            return prev;
        }, {});
    },
    /**
        Allows to use await in the forEach callback
    **/
    asyncForEach: async (iterable, callback) => {
        if (Array.isArray(iterable)){
            for (let index = 0; index < iterable.length; index++){
                await callback(iterable[index], index, iterable);
            }
        } else if (iterable instanceof Object){
            for (let prop in iterable){
                await callback(iterable[prop], prop, iterable);
            }
        }
    },
    /**
        Generates a password hash from the provided cleartext password
    **/
    generateHash: (password) => {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
    },
    /**
        Returns a stringied version of obj only if it's an actual object. Otherwise it returns it without changes
    **/
    optionalStringify: (obj) => {
        if (obj instanceof Object && Object.keys(obj) > 0){
            return JSON.stringify(obj);
        } else {
            return obj;
        }
    },
    /**
        Returns an object if the input string can be parsed. If not, returns it raw
    **/
    optionalParse: (obj) => {
        try{
            return JSON.parse(obj);
        } catch(error){
            return obj;
        }
    },
    /**
        Return a promise after ms number of milliseconds
    **/
    wait: (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },
};
