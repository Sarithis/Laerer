`use strict`;

const config = require(`../../config`);
const mongoose = require(`mongoose`);
const logger = require(`../../logger`).appLogger;
mongoose.Promise = global.Promise;

const connection = mongoose.connect(config.db.mongo.uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    user: config.db.mongo.user,
    pass: config.db.mongo.password,
    auth: {
        authdb: `admin`
    }
});

mongoose.connection.on(`error`, (error) => {
    logger.error(`mongo: Mongoose error: ${error}`);
});

mongoose.Schema.Types.String.checkRequired(v => v != null); //Allow empty strings in required: true

module.exports = {
    connection: mongoose.connection,
    mongoose,
    models: require(`./models`)(mongoose)
}
