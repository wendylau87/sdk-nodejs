const logger = require('../logger');
const config = require('../config')
const localConfig = config.getLocalConfig();
const {asyncLocalStorage} = require('../context');

var httpLogger = require('pino-http')({
    // Reuse an existing logger instance
    logger: logger.get(),

    // Logger level is `info` by default
    useLevel: localConfig.application.logger.level,

    customReceivedMessage: function (req, res){
        return {
            "id":req.headers["x-request-id"],
            "message":"Incoming Request"
        }
    },

    customErrorMessage: function (req, res){
        return {
            "id":req.headers["x-request-id"],
            "message":"Request failed"
        }
    },

    customSuccessMessage: function (req, res){
        return {
            "id":req.headers["x-request-id"],
            "message":"Request completed"
        }
    },

    serializers: {
        req(req) {
            req.body = req.raw.body;
            req.id = req.headers['x-request-id'] === undefined ? '' : req.headers['x-request-id'];;
            return req;
        },
        res(res){
            res.body = res.raw.body
            return res;
        }
    },
})

const integrationAttachResponseBody = function (req, res, next) {
    var send = res.send;
    res.send = function (body) {
        res.body = body
        send.call(this, body);
    };
    next();
}

const integrationAttachContext = function (req, res, next) {
    const data = asyncLocalStorage.getStore().get("context");
    req.context = asyncLocalStorage.getStore().get("context");
    logger.setContext(data);
    req.headers['x-request-id'] = data['x-request-id'];
    httpLogger(req,res);
    next();
}

module.exports = {
    httpLogger,
    integrationAttachResponseBody,
    integrationAttachContext,
};