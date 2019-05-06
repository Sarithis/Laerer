"use strict";

/**
    This module exposes the API of this app. It *DOES NOT* check user authentication, authorization and permissions - these are done in the router module.
**/

const dotObj = require(`dot-object`);
const h = require(`../helpers`);
const logger = require(`../logger`).appLogger;
const mongoDb = require(`../db`).mongo.models;
const mongoTypes = require(`../db`).mongo.mongoose.Types;
const mongoose = require(`../db`).mongo.mongoose;
const config = require(`../config`);

logger.setup(`Initializing the API module`, {identifier: `api`});


/*
    A set of generic CRUD functions that can be applied to multiple different models.
    It was created to avoid copy-pasting the same code for every DB object
*/
const generics = {
    /*
        Creates a new object in the database.
        Calls the mongoDb.models[modelName] constructor and passes obj as an argument.
        The modifier parameter is optional. It's a custom function which receives
        the newly created object as an argument. The function can modify it before it's saved in the mongoDb. The modifier needs to return the object.
        logPathPrefix is optional - it should be a string which will be prepended to the api path in log messages. It's useful when the final CRUD method is nested and the modelName is ambiguous.
    */
    add: async ({inputObj, modelName, modifierFunc, logPathPrefix = ``, logging = true, callId = null}) => {
        callId = h.generateCallId(callId);
        logger.api(`Adding a new ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} add`, meta: {inputObj}, callId});
        try{
            if (inputObj === undefined || typeof inputObj !== `object`){
                throw(`Wrong inputObj argument`);
            }
            logger.api(`Creating a new ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} add`, callId});
            let newObj = new mongoDb[modelName](inputObj);
            if (typeof modifierFunc === `function`){
                newObj = modifierFunc(newObj);
            }
            logger.api(`Saving the new ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} add`, callId});
            const savedObj = await newObj.save();
            if (savedObj){
                logger.api(`Successfully added a new ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} add`, meta: {savedObj}, callId});
                return mongoDb[modelName].findOne(savedObj._id); //For autopopopulate to work
            } else {
                throw(`Failed to add a new ${logPathPrefix}${modelName}: unknown error`);
            }
        } catch (error){
            logger.error(`Failed to add a new ${modelName}: ${h.optionalStringify(error)}`, {identifier: `api ${logPathPrefix}${modelName} add`, meta: {inputObj}, callId});
            throw error;
        }
    },
    /*
        Deletes an object from the database
        The id argument should be a string representing the ObjectId.
    */
    delete: async ({id, modelName, logPathPrefix = ``, logging = true, callId = null}) => {
        callId = h.generateCallId(callId);
        logger.api(`Deleting a ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} delete`, meta: {id}, callId});
        try{
            if (id === undefined || typeof id !== `string` || !(/^[a-fA-F0-9]{24}$/).test(id)){
                throw(`Wrong id argument`);
            }
            const deletedObj = await mongoDb[modelName].findByIdAndRemove(id).exec();
            if (deletedObj){
                logger.api(`Successfully deleted a ${modelName} with an id: ${id}`, {logging, identifier: `api ${logPathPrefix}${modelName} delete`, meta: {deletedObj}, callId});
                return deletedObj;
            } else {
                throw(`Failed to delete ${modelName} with id: ${id}`);
            }
        } catch (error){
            logger.error(`Failed to delete an existing ${modelName}: ${h.optionalStringify(error)}`, {identifier: `api ${logPathPrefix}${modelName} delete`, meta: {id}, callId});
            throw error;
        }
    },
    /*
        Updates an object in the database.
        Passes obj to findByIdAndUpdate function.
        The modifier argument is optional. It's a custom function which receives
        the newly created object as an argument. The function can modify it before it's saved in the mongoDb. The modifier needs to return the object.
        The id argument should be a string representing the ObjectId.
    */
    update: async ({id, inputObj, modelName, modifierFunc, logPathPrefix = ``, logging = true, callId = null}) => {
        callId = h.generateCallId(callId);
        logger.api(`Updating a ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} update`, meta: {id, inputObj}, callId});
        try{
            if (id === undefined || typeof id !== `string` || !(/^[a-fA-F0-9]{24}$/).test(id)){
                throw(`Wrong id argument: ${id === undefined ? `undefined` : id}`);
            }
            if (inputObj === undefined || typeof inputObj !== `object`){
                throw(`Wrong ${modelName} argument`);
            }
            if (typeof modifierFunc === `function`){
                inputObj = modifierFunc(inputObj);
            }
            inputObj = dotObj.dot(inputObj);
            const updateResult = await mongoDb[modelName].updateOne({_id: id}, {$set: inputObj}, {new: true});
            if (updateResult.ok){
                logger.api(`Successfully updated a ${modelName} with an id: ${id}`, {logging, identifier: `api ${logPathPrefix}${modelName} update`, meta: {updateResult}, callId});
                return await mongoDb[modelName].findById(id);
            } else {
                throw(`Failed to update ${modelName} with id: ${id}`);
            }
        } catch (error){
            logger.error(`Failed to update an existing ${modelName}: ${h.optionalStringify(error)}`, {identifier: `api ${logPathPrefix}${modelName} update`, meta: {id, inputObj}, callId});
            throw error;
        }
    },
    /*
        Gets an object from the database.
        The id argument should be a string representing the ObjectId.
    */
    get: async ({id, modelName, logPathPrefix = ``, logging = true, callId = null}) => {
        callId = h.generateCallId(callId);
        logger.api(`Getting ${modelName}`, {logging, identifier: `api ${logPathPrefix}${modelName} get`, meta: {id}, callId});
        try{
            let result = null;
            if (id === undefined){
                const dbResponse = await mongoDb[modelName].find({});
                result = dbResponse.map((entry) => {
                    return entry.toObject();
                });
            } else {
                const dbResponse = await mongoDb[modelName].findById(id);
                result = dbResponse === null ? dbResponse : dbResponse.toObject();
            }

            if ((result instanceof Array && result.length === 0) || result === null || result === undefined){
                logger.api(`Returning 0 ${modelName}s`, {logging, identifier: `api ${logPathPrefix}${modelName} get`, meta: {id}, callId});
                return [];
            }
            logger.api(`Returning ${result instanceof Array ? result.length : 1} ${modelName}s`, {logging, identifier: `api ${logPathPrefix}${modelName} get`, meta: {id, result}, callId});
            return result;
        } catch (error){
            logger.error(`Failed to get an existing ${modelName}: ${h.optionalStringify(error)}`, {identifier: `api ${logPathPrefix}${modelName} get`, meta: {id}, callId});
            throw error;
        }
    }
};

/**
    The actual functions
**/

module.exports = {
    word: {
        add: async ({word, logging = true, callId = null}) => {
            callId = h.generateCallId(callId);
            return await generics.add({
                inputObj: word,
                modelName: `word`,
                logPathPrefix: ``,
                logging,
                callId
            });
        },
        delete: async ({id, logging = true, callId = null}) => {
            callId = h.generateCallId(callId);
            return await generics.delete({
                id,
                modelName: `word`,
                logPathPrefix: ``,
                logging,
                callId
            });
        },
        update: async ({id, word, logging = true, callId = null}) => {
            callId = h.generateCallId(callId);
            return await generics.update({
                id,
                inputObj: word,
                modelName: `word`,
                logPathPrefix: ``,
                logging,
                callId
            });
        },
        get: async ({id, logging = true, callId = null}) => {
            callId = h.generateCallId(callId);
            return await generics.get({
                id,
                modelName: `word`,
                logPathPrefix: ``,
                logging,
                callId
            });
        },
        search: async ({query, logging = true, callId = null}) => {
            callId = h.generateCallId(callId);
            logger.api(`Searching words`, {logging, identifier: `api word search`, meta: {query}, callId});
            try{
                const dbResponse = await mongoDb.word.find(query).exec();
                let result = null;
                if (dbResponse instanceof Array){
                    result = dbResponse.map((entry) => {
                        return entry.toObject();
                    });
                } else {
                    result = dbResponse.toObject();
                }
                if ((result instanceof Array && result.length === 0) || result === null || result === undefined){
                    logger.api(`Returning an empty array of words`, {logging, identifier: `api word search`, meta: {query}, callId});
                    return [];
                }
                logger.api(`Returning ${result instanceof Array ? result.length : 1} words`, {logging, identifier: `api word search`, meta: {query, result}, callId});
                return result;
            } catch (error){
                logger.error(`Failed to search for words : ${h.optionalStringify(error)}`, {identifier: `api word search`, meta: {query}, callId});
                throw error;
            }
        },
        getNext: async ({userId, logging = true, callId = null}) => {
            callId = h.generateCallId(callId);
            logger.api(`Getting the next word`, {logging, identifier: `api word getNext`, meta: {}, callId});
            try{
                let dbResponse = null;
                if (Math.random() > 0.1){ //A standard mode
                    //Get a random number of words (5-20) sorted ascending by score
                    logger.api(`Mode: standard`, {logging, identifier: `api word getNext`, meta: {}, callId});
                    dbResponse = await mongoDb.word.find({userId: userId}).sort({score: 1}).limit(h.getRandomInt(5, 20)).exec();
                } else { //Sometimes get the word that was not translated in a long time (ignore the score)
                    logger.api(`Mode: ignore the score`, {logging, identifier: `api word getNext`, meta: {}, callId});
                    dbResponse = await mongoDb.word.find({userId: userId}).sort({translatedTimestamp: 1}).limit(1).exec();
                }
                let result = null;
                if (dbResponse instanceof Array){
                    result = dbResponse.map((entry) => {
                        return entry.toObject();
                    });
                    //result = result.reduce((prev, current) => (prev.translatedTimestamp < current.translatedTimestamp) ? prev : current);
                    //Sort the words by timestamp ascending (latest are last)
                    result.sort((a, b) => {return a.translatedTimestamp < b.translatedTimestamp});
                    //Cut the result array in half
                    if (result.length > 2){
                        result = result.slice(0, Math.ceil(result.length / 2));
                    }
                    //Draw a random word from the result array
                    result = result[h.getRandomInt(0, result.length)];
                } else {
                    result = dbResponse.toObject();
                }
                //Determine the direction of translation
                result.translateFromForeign = Math.random() > 0.8 ? true : false;
                logger.api(`Returning the next word: ${result.word}`, {logging, identifier: `api word getNext`, meta: {result}, callId});
                return result;
            } catch (error){
                logger.error(`Failed to get the next word : ${h.optionalStringify(error)}`, {identifier: `api word getNext`, meta: {}, callId});
                throw error;
            }
        },
    }
};
