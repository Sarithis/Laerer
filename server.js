`use strict`;

const express = require(`express`);
const laerer = require(`./app`);
const passport = require(`passport`);
const cookieParser = require(`cookie-parser`);
const app = express();
const flash = require(`connect-flash`);
const bodyParser = require(`body-parser`);
const appRoot = require(`app-root-path`);
const morgan = require(`morgan`);
const favicon = require(`serve-favicon`);

app.set(`view engine`, `ejs`);


/* Static routes */
app.use(express.static(`${appRoot}/public/`));
app.use(`/frontLib/bootstrap`, express.static(`${appRoot}/node_modules/bootstrap/dist/`));
app.use(`/frontLib/tether`, express.static(`${appRoot}/node_modules/tether/dist/`));
app.use(`/frontLib/jquery`, express.static(`${appRoot}/node_modules/jquery/dist/`));
app.use(`/frontLib/jquery-ui`, express.static(`${appRoot}/node_modules/jquery-ui-dist/`));
app.use(`/frontLib/socket.io`, express.static(`${appRoot}/node_modules/socket.io-client/dist/`));
app.use(`/frontLib/popper`, express.static(`${appRoot}/node_modules/popper.js/dist/umd/`));
app.use(`/frontLib/moment`, express.static(`${appRoot}/node_modules/moment/min/`));
app.use(`/frontLib/particles.js`, express.static(`${appRoot}/node_modules/particles.js/`));
app.use(`/frontLib/font-awesome`, express.static(`${appRoot}/node_modules/font-awesome/`));
app.use(`/frontLib/dot-object/`, express.static(`${appRoot}/node_modules/dot-object/dist/`));
app.use(`/frontLib/datatables/`, express.static(`${appRoot}/node_modules/datatables/`));
app.use(`/frontLib/datatables.net-bs4/`, express.static(`${appRoot}/node_modules/datatables.net-bs4/`));
app.use(`/frontLib/css-reset-and-normalize/`, express.static(`${appRoot}/node_modules/css-reset-and-normalize/css/`));


/* Middleware */
app.use(favicon(`${appRoot}/public/img/favicon.png`));
app.use(morgan(`combined`, {stream: laerer.logger.httpLogger.stream}));
app.use(flash());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

/* CMS middleware */
app.use(laerer.session);
app.use(passport.initialize());
app.use(passport.session());
app.use(`/`, laerer.router);

laerer.ioServer(app).listen(laerer.config.server.port, () => {
    laerer.logger.appLogger.info(`Running on TCP ${laerer.config.server.port}`, {identifier: `server`});
});
