`use strict`;

/**
	Functions related to the auth module
**/

const bCrypt = require(`bcrypt-nodejs`);
const config = require(`../config`);
const h = require(`../helpers`);

module.exports = {
    /**
		Middleware which checks if a user is authenticated. If he is, calls the callback, if not, redirects to the main page
	**/
    isAuthenticated: (req, res, next) => {
        if (config.openAuth === true || req.isAuthenticated()){
            next();
        } else {
            res.redirect(`/`);
        }
    },
	/**
		Same as isAuthenticated, but doesn't redirect to the main page - sends a json response instead
	**/
	isAuthenticatedApi: (req, res, next) => {
		if (req.isAuthenticated()){
			next();
		} else {
			res.status(401).jsonp(h.generateApiResponse(false, null, `Unauthenticated`));
		}
	},
    /**
		Returns true if the provided password is correct. The first argument should be a user object from the database
	**/
    isValidPassword: (user, password) => {
        return config.openAuth === true || bCrypt.compareSync(password, user.password);
    },
};
