"use strict";

/**
    Sets up the whole routing and access to certain functionalities. Exposes the router object, which can be injected as middleware to express.
**/

const passport = require(`passport`);
const appRoot = require(`app-root-path`);
const router = require(`express`).Router();
const h = require(`../helpers`);
const config = require(`../config`);
const authFunctions = require(`../auth`).functions;
const logger = require(`../logger`).appLogger;
const api = require(`../api`);

logger.setup(`Initializing the ROUTER module`, {identifier: `router`});

/**
    Parses the routes object (defined in the module.exports object) and puts them in an express.Router instance
**/
const registerRoutes = (routes, method) => {
    for (let key in routes){ //For method route do a recursive call with its name as the second argument
        if(typeof routes[key] === `object` && routes[key] !== null && !(routes[key] instanceof Array)){
            registerRoutes(routes[key], key); //If the current object isn't a route, it's a method name which contains all of the method's routes
        } else { //This will be true if the routes[key] is a route and the key is a method name
            logger.setup(`Registering a ${method.toUpperCase()} route to ${key}`, {identifier: `router`});
            if (method === `get`){
                router.get(key, routes[key]);
            } else if (method === `post`){
                router.post(key, routes[key]);
            } else if (method === `delete`){
                router.delete(key, routes[key]);
            } else if (method === `put`){
                router.put(key, routes[key]);
            }
        }
    }
};

/**
    Uses the registerRoutes function to generate routing for the given routes object.
    Receives an additional argument - an object with REST API routes. They are all protected by the auth and autorization functions. Creates a route for the 404 error page
**/
const route = (routes, apiRoutes, notFound) => {
    registerRoutes(routes);
    router.use(authFunctions.isAuthenticatedApi); //Protect all API paths with middleware
    registerRoutes(apiRoutes); //Register API routes
    if (typeof notFound === `function`){
        router.use(notFound);
    }
    return router;
};

const handleError = (req, res, message, viewName) => {
    req.flash(`error`, message);
    res.render(viewName, {
        flash: h.generateFlash(req),
        user: req.user,
        host: config.server.host
    });
};

module.exports = () => {
    /**
        An ordered list of routes. Messages for the user (usually errors) must reside
        inside a property called 'flash' - it's used in the errors.ejs view.
    **/
    const routes = {
        get: {
            '/': (req, res, next) => {
                if (req.isAuthenticated()){ //Redirect to dashboard if we're authenticated
                    res.redirect(`/main`);
                } else {
                    res.render(`login`, {
                        flash: h.generateFlash(req),
                        host: config.server.host
                    });
                }
            },
            '/main': [authFunctions.isAuthenticated, (req, res, next) => {
                res.render(`main`, {
                    flash: h.generateFlash(req),
                    host: config.server.host,
                    user: req.user
                });
            }],
            '/learn': [authFunctions.isAuthenticated, (req, res, next) => {
                res.render(`learn`, {
                    flash: h.generateFlash(req),
                    host: config.server.host,
                    user: req.user
                });
            }],
            '/edit': [authFunctions.isAuthenticated, async (req, res, next) => {
                const words = await api.word.search({query: {userId: req.user._id}});
                res.render(`edit`, {
                    flash: h.generateFlash(req),
                    host: config.server.host,
                    user: req.user,
                    words
                });
            }],
            '/logout': (req, res, next) => {
                req.logout();
                req.flash(`success`, `You were successfully logged out!`);
                res.redirect(`/`);
            },
        },
        post: {
            '/login': passport.authenticate(`login`, {
                successRedirect: `/main`,
                badRequestMessage: `Error while trying to read your username or password`,
                failureRedirect: `/`,
                failureFlash: true
            }),
            '/signup': passport.authenticate(`signup`, {
                successRedirect: `/main`,
                badRequestMessage: `Error while trying to sign you up`,
                failureRedirect: `/`,
                failureFlash: true
            }),
        }
    };
    //The not found route is defined separately
    const notFound = (req, res, next) => {
        logger.verbose(`${req.connection.remoteAddress} tried to access a non-existing route: ${req.path}`, {identifier: `router notFound`});
        res.status(404).sendFile(`${appRoot}/views/404.htm`);
    };
    return route(routes, require(`./api.js`), notFound); //Return an express Router instance
};
