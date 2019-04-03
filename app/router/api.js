`use strict`;

/**
    This module provides routes related to the REST API. It's separated from
    the main router module for convenience.
    Routes in this module are NOT PROTECTED IN ANY WAY. It's done once in the Router module
    TODO: change scheme and standarize it
**/

const h = require(`../helpers`);
const api = require(`../api`);
const logger = require(`../logger`).appLogger;

/**
    Sends a negative response to the client
**/

const handleError = (req, res, error, statusCode = 500) => {
    logger.error(`Error (req by ${req.user.login}): ${h.optionalStringify(error)}`, {identifier: `router ${req.method} ${req.url}`, meta: {query: req.query, params: req.params}});
    return res.status(statusCode).jsonp(h.generateApiResponse(false, null, `Something went wrong while performing an API call: ${h.optionalStringify(error)}`));
};

/**
    argMap should be an object with key names representing argument names. Every property that should be checked must equal to true.
    If the property contains a function, it will be executed and its output (should be boolean) will be taken into account instead.
    Example:
    argMap: {
        ip: true, //Check if exists
        onu: (onu) => { //Function check
            return onu > 0 && onu < 16
        }
    }
    args: {
        ip: "1.2.3.4",
        onu: -1
    }
    Result: it will call handleError function because the "onu" argument doesn't meet the argMap requiremenets
**/
const handleMandatoryArgs = ({argMap, args}) => {
    let allPresent = true;
    let allCorrect = true;
    for (let argName in argMap){
        if (argMap[argName] === true){
            if (args[argName] === undefined){
                allPresent = false;
                break;
            }
        } else if (typeof argMap[argName] === `function`){
            if (!argMap[argName](args[argName])){
                allCorrect = false;
                break;
            }
        }
    }
    return allPresent && allCorrect;
};

/**
    Performs a call to apiFunc expecting that it will return a promise and SOME value. It passes the args object to it as an argument. Calls successCallback if everything went fine. Sends a response to the client.
**/
const performApiCall = ({req, res, apiFunc, args, successCallback, logging = true}) => {
    const callId = h.generateCallId();
    logger.verbose(`${req.user.login} called ${apiFunc.name}`, {callId, identifier: `router ${req.method} ${req.url}`, logging, meta: {query: req.query, params: req.params, args}});
    apiFunc(Object.assign({}, args, {callId})).then((result) => {
        if (result === undefined){
            return handleError(req, res, `API func returned nothing`);
        } else {
            if (typeof successCallback === `function`){
                successCallback(req, res);
            }
            return res.status(200).jsonp(h.generateApiResponse(true, result, ``));
        }
    }).catch((error) => {
        return handleError(req, res, error);
    });
};

const checkUserPersmissions = async ({req, model, id}) => {
    const result = await api[model].get({id});
    if (typeof result === `object` && result.userId !== undefined){
        return result.userId.equals(req.user._id);
    } else {
        throw(`Wrong API result for ${model} - ${id}`);
    }
}

module.exports = {
    get: {
        '/api/example': (req, res, next) => {
            performApiCall({req, res, apiFunc: api.example.get});
        },
    },
    post: {
        /**
        **/
        '/api/word': (req, res, next) => {
            let parsedWord = null;
            try {
                parsedWord = h.optionalParse(req.body.data);
                parsedWord.userId = req.user._id.toString(); //Override userId
            } catch (error) {
                return handleError(req, res, error);
            }
            performApiCall({req, res, apiFunc: api.word.add, args: {
                word: parsedWord
            }});
        },
    },
    delete: {
        /**
        **/
        '/api/word/:id': async (req, res, next) => {
            if (!handleMandatoryArgs({argMap: {id: true}, args: req.params})){
                return handleError(req, res, `Incorrect or incomplete arguments`);
            }
            try {
                const canDelete = await checkUserPersmissions({req, model: `word`, id: req.params.id});
                if (!canDelete){
                    throw(`This user can't delete a word with this ID`);
                }
            } catch (error) {
                return handleError(req, res, error);
            }
            performApiCall({req, res, apiFunc: api.word.delete, args: {
                id: req.params.id
            }});
        },
    },
    put: {
        /**
        **/
        '/api/word/:id': async (req, res, next) => {
            if (!handleMandatoryArgs({argMap: {id: true}, args: req.params})){
                return handleError(req, res, `Incorrect or incomplete arguments`);
            }
            if (!handleMandatoryArgs({argMap: {id: true}, args: req.params})){
                return handleError(req, res, `Incorrect or incomplete arguments`);
            }
            let parsedWord = null;
            try {
                const canUpdate = await checkUserPersmissions({req, model: `word`, id: req.params.id});
                if (!canUpdate){
                    throw(`This user can't update a word with this ID`);
                }
                parsedWord = h.optionalParse(req.body.data);
                parsedWord.userId = req.user._id.toString(); //Override userId
            } catch (error) {
                return handleError(req, res, error);
            }
            performApiCall({req, res, apiFunc: api.word.update, args: {
                id: req.params.id,
                word: parsedWord
            }});
        },
    }
};
